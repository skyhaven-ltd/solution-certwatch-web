import { app, InvocationContext } from "@azure/functions";
import { containers } from "../shared/db/cosmosClient";
import { User } from "../shared/models/user";
import { syncCredlyForUser } from "../shared/sync/syncUser";

const PER_USER_DELAY_MS = 500; // be a polite guest of the public Credly endpoint

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handler(_timer: unknown, ctx: InvocationContext): Promise<void> {
  ctx.log("Credly sync job started");

  const { resources: users } = await containers
    .users()
    .items.query<User>({
      query:
        "SELECT * FROM c WHERE IS_DEFINED(c.credlyUsername) AND c.credlyUsername != null AND c.credlyUsername != ''",
    })
    .fetchAll();

  ctx.log(`Found ${users.length} users with a linked Credly profile`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const result = await syncCredlyForUser(user);
      created += result.created;
      updated += result.updated;
    } catch (err) {
      // Per-user isolation: one bad/private/404 profile never aborts the run.
      ctx.error(`Credly sync failed for user ${user.userId}: ${err}`);
      failed++;
    }
    await delay(PER_USER_DELAY_MS);
  }

  ctx.log(
    `Credly sync complete. Created: ${created}, Updated: ${updated}, Failed: ${failed}`,
  );
}

// Runs daily at 00:30 UTC, ahead of the 01:00 reminder job so expiry dates are
// fresh before reminders are computed.
app.timer("credlySyncJob", {
  schedule: "0 30 0 * * *",
  handler,
});
