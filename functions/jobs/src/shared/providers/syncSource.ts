import { CertificationVendor } from "../models/certification";

// A single credential normalized from a sync source (e.g. a Credly badge),
// reduced to the fields CertWatch reconciles against a Certification record.
export interface NormalizedBadge {
  // Stable credential-type identifier (Credly badge_template.id). One template
  // == one CertWatch certification; used to match and dedupe across syncs.
  templateId: string;
  name: string;
  vendor: CertificationVendor;
  // ISO date YYYY-MM-DD, or null for credentials that never expire.
  expiresAt: string | null;
  issuedAt: string | null;
  // The issued-badge instance id, kept for reference/debugging.
  badgeId: string;
}

// A bulk, per-user sync source. Keyed by `source` (e.g. "credly"); fetches all
// of a user's credentials in one call rather than per certification.
export interface ICertSyncSource {
  readonly source: string;
  readonly displayName: string;
  fetchBadges(identifier: string): Promise<NormalizedBadge[]>;
}
