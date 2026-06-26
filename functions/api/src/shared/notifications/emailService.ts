const BREVO_BASE_URL = "https://api.brevo.com/v3";

const apiKey = process.env["BREVO_API_KEY"] ?? "";
const fromEmail = process.env["EMAIL_FROM"] ?? "";
const fromName = process.env["EMAIL_FROM_NAME"] || "CertWatch";
const replyTo = process.env["EMAIL_REPLY_TO"] || "";

export interface SendReminderEmailOptions {
  to: string;
  certificationName: string;
  vendor: string;
  expirationDate: string;
  daysUntilExpiry: number;
}

interface BrevoTransactionalEmail {
  sender: { name: string; email: string };
  to: { email: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
  replyTo?: { email: string };
}

async function sendBrevoEmail(message: BrevoTransactionalEmail): Promise<void> {
  if (!apiKey || !fromEmail) {
    throw new Error(
      "Missing Brevo email configuration (BREVO_API_KEY / EMAIL_FROM).",
    );
  }

  const response = await fetch(`${BREVO_BASE_URL}/smtp/email`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Brevo API request failed with ${response.status}: ${raw}`);
  }
}

export async function sendReminderEmail(
  opts: SendReminderEmailOptions,
): Promise<void> {
  const { to, certificationName, vendor, expirationDate, daysUntilExpiry } =
    opts;

  const subject = `Certification expiring in ${daysUntilExpiry} days: ${certificationName}`;

  const htmlContent = `
    <h2>Certification Expiry Reminder</h2>
    <p>Your <strong>${certificationName}</strong> (${vendor}) certification expires on <strong>${expirationDate}</strong>.</p>
    <p>That is <strong>${daysUntilExpiry} days</strong> from now.</p>
    <p>Log in to CertWatch to view your certifications and plan your renewal.</p>
  `.trim();

  const textContent = [
    "Certification Expiry Reminder",
    "",
    `Your ${certificationName} (${vendor}) certification expires on ${expirationDate}.`,
    `That is ${daysUntilExpiry} days from now.`,
    "",
    "Log in to CertWatch to view your certifications and plan your renewal.",
  ].join("\n");

  await sendBrevoEmail({
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to }],
    subject,
    htmlContent,
    textContent,
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
  });
}
