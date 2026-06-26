import { app, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { containers } from "../../shared/db/cosmosClient";
import { sendReminderEmail } from "../../shared/notifications/emailService";
import { Certification } from "../../shared/models/certification";
import { User } from "../../shared/models/user";
import { ReminderLog } from "../../shared/models/reminder";

async function handler(_timer: unknown, ctx: InvocationContext): Promise<void> {
  ctx.log("Daily reminder job started");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the furthest-out reminder window (max 60 days to limit query scope)
  const maxDaysAhead = 60;
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);

  const todayStr = today.toISOString().split("T")[0];
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Cross-partition query for all upcoming expirations
  const { resources: certs } = await containers
    .certifications()
    .items.query<Certification>(
      {
        query: `SELECT * FROM c WHERE c.expirationDate >= @today AND c.expirationDate <= @maxDate`,
        parameters: [
          { name: "@today", value: todayStr },
          { name: "@maxDate", value: maxDateStr },
        ],
      },
      { maxItemCount: 500 },
    )
    .fetchAll();

  ctx.log(`Found ${certs.length} certifications in reminder window`);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const cert of certs) {
    try {
      const { resource: user } = await containers
        .users()
        .item(cert.userId, cert.userId)
        .read<User>();

      if (!user?.reminderPreferences.emailEnabled) {
        skipped++;
        continue;
      }

      // No-expiry certs (e.g. Credly badges with no expiry) never trigger reminders.
      if (!cert.expirationDate) {
        skipped++;
        continue;
      }

      const expiryDate = new Date(cert.expirationDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      for (const triggerDay of user.reminderPreferences.emailDaysBefore) {
        if (daysUntilExpiry !== triggerDay) continue;

        // Deduplication: check if we already sent this reminder today
        const { resources: existingLogs } = await containers
          .reminderLogs()
          .items.query<ReminderLog>({
            query: `SELECT * FROM c WHERE c.userId = @userId AND c.certificationId = @certId AND c.daysBeforeExpiry = @days AND c.channel = 'email' AND c.status = 'sent'`,
            parameters: [
              { name: "@userId", value: cert.userId },
              { name: "@certId", value: cert.id },
              { name: "@days", value: triggerDay },
            ],
          })
          .fetchAll();

        if (existingLogs.length > 0) {
          skipped++;
          continue;
        }

        await sendReminderEmail({
          to: user.email,
          certificationName: cert.name,
          vendor: cert.vendor,
          expirationDate: cert.expirationDate,
          daysUntilExpiry: triggerDay,
        });

        const log: ReminderLog = {
          id: uuidv4(),
          userId: cert.userId,
          certificationId: cert.id,
          channel: "email",
          daysBeforeExpiry: triggerDay,
          sentAt: new Date().toISOString(),
          status: "sent",
        };
        await containers.reminderLogs().items.create<ReminderLog>(log);
        sent++;
      }
    } catch (err) {
      ctx.error(`Failed to process cert ${cert.id}: ${err}`);
      failed++;
    }
  }

  ctx.log(
    `Daily reminder job complete. Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`,
  );
}

// Runs daily at 1:00 AM UTC
app.timer("dailyReminderJob", {
  schedule: "0 0 1 * * *",
  handler,
});
