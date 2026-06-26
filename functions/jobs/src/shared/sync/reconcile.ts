import { v4 as uuidv4 } from "uuid";
import { containers } from "../db/cosmosClient";
import { Certification, CertificationStatus } from "../models/certification";
import { ReminderLog } from "../models/reminder";
import { NormalizedBadge } from "../providers/syncSource";

export interface ReconcileResult {
  created: number;
  updated: number;
  unchanged: number;
}

function computeStatus(expiresAt: string | null): CertificationStatus {
  if (!expiresAt) return "active"; // never-expiring credential
  return new Date(expiresAt) < new Date() ? "expired" : "active";
}

// True if `a` is the more current issuance of a credential than `b`:
// latest issued wins, then latest expiry as a tiebreak.
function isMoreCurrent(a: NormalizedBadge, b: NormalizedBadge): boolean {
  const ai = a.issuedAt ?? "";
  const bi = b.issuedAt ?? "";
  if (ai !== bi) return ai > bi;
  return (a.expiresAt ?? "") > (b.expiresAt ?? "");
}

// Collapse multiple badges of the same template (e.g. an original plus a
// renewal) down to the single most current issuance per template id.
function pickRepresentatives(
  badges: NormalizedBadge[],
): Map<string, NormalizedBadge> {
  const byTemplate = new Map<string, NormalizedBadge>();
  for (const badge of badges) {
    const current = byTemplate.get(badge.templateId);
    if (!current || isMoreCurrent(badge, current)) {
      byTemplate.set(badge.templateId, badge);
    }
  }
  return byTemplate;
}

// Delete a certification's prior "sent" reminder logs so the nightly job can
// fire fresh for a new expiry cycle (e.g. after a renewal pushes expiry out).
async function invalidateReminderLogs(
  userId: string,
  certificationId: string,
): Promise<void> {
  const logsContainer = containers.reminderLogs();
  const { resources: logs } = await logsContainer.items
    .query<ReminderLog>(
      {
        query:
          "SELECT * FROM c WHERE c.userId = @userId AND c.certificationId = @certId AND c.status = 'sent'",
        parameters: [
          { name: "@userId", value: userId },
          { name: "@certId", value: certificationId },
        ],
      },
      { partitionKey: userId },
    )
    .fetchAll();

  for (const log of logs) {
    await logsContainer.item(log.id, userId).delete();
  }
}

// Reconcile a user's fetched Credly badges into their certifications.
// Only ever touches source === "credly" records: creates new ones, refreshes
// changed ones, and never deletes records for badges absent from the fetch.
export async function reconcileCredlyBadges(
  userId: string,
  badges: NormalizedBadge[],
): Promise<ReconcileResult> {
  const certsContainer = containers.certifications();

  const { resources: existingCerts } = await certsContainer.items
    .query<Certification>(
      {
        query:
          "SELECT * FROM c WHERE c.userId = @userId AND c.source = @source",
        parameters: [
          { name: "@userId", value: userId },
          { name: "@source", value: "credly" },
        ],
      },
      { partitionKey: userId },
    )
    .fetchAll();

  const existingByTemplate = new Map<string, Certification>();
  for (const cert of existingCerts) {
    if (cert.vendorCertId) existingByTemplate.set(cert.vendorCertId, cert);
  }

  const representatives = pickRepresentatives(badges);
  const now = new Date().toISOString();
  const result: ReconcileResult = { created: 0, updated: 0, unchanged: 0 };

  for (const [templateId, badge] of representatives) {
    const status = computeStatus(badge.expiresAt);
    const existing = existingByTemplate.get(templateId);

    if (!existing) {
      const cert: Certification = {
        id: uuidv4(),
        userId,
        name: badge.name,
        vendor: badge.vendor,
        vendorCertId: templateId,
        expirationDate: badge.expiresAt,
        status,
        source: "credly",
        syncEnabled: true,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await certsContainer.items.create<Certification>(cert);
      result.created++;
      continue;
    }

    const expiryChanged = existing.expirationDate !== badge.expiresAt;
    const changed =
      expiryChanged ||
      existing.name !== badge.name ||
      existing.vendor !== badge.vendor ||
      existing.status !== status;

    if (!changed) {
      result.unchanged++;
      continue;
    }

    const updatedCert: Certification = {
      ...existing,
      name: badge.name,
      vendor: badge.vendor,
      expirationDate: badge.expiresAt,
      status,
      lastSyncedAt: now,
      updatedAt: now,
    };
    await certsContainer.items.upsert<Certification>(updatedCert);

    if (expiryChanged) {
      await invalidateReminderLogs(userId, existing.id);
    }
    result.updated++;
  }

  return result;
}
