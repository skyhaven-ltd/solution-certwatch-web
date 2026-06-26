export type CertificationVendor =
  | "microsoft"
  | "aws"
  | "comptia"
  | "hashicorp"
  | "other";
export type CertificationStatus = "active" | "expired" | "pending" | "unknown";
export type CertificationSource = "manual" | "credly";

export interface Certification {
  id: string;
  userId: string;
  name: string;
  vendor: CertificationVendor;
  // For Credly-sourced certs this holds the Credly badge_template.id, used to
  // match and dedupe badges across syncs.
  vendorCertId?: string | null;
  expirationDate: string | null; // ISO date YYYY-MM-DD, or null for no-expiry credentials
  status: CertificationStatus;
  // Where this record is reconciled from. Credly sync only ever upserts
  // source === "credly" records; manual certs are never overwritten.
  source: CertificationSource;
  syncEnabled: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Reserved for future multi-tenant support
  tenantId?: string | null;
  assignedToUserId?: string | null;
}

export interface CreateCertificationRequest {
  name: string;
  vendor: CertificationVendor;
  vendorCertId?: string;
  expirationDate: string;
}

export interface UpdateCertificationRequest {
  name?: string;
  vendor?: CertificationVendor;
  vendorCertId?: string | null;
  expirationDate?: string;
  syncEnabled?: boolean;
}
