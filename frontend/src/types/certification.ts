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
  vendorCertId?: string | null;
  expirationDate: string | null;
  status: CertificationStatus;
  source?: CertificationSource;
  syncEnabled: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface CredlyBadgePreview {
  name: string;
  vendor: CertificationVendor;
  expiresAt: string | null;
}

export interface CredlyPreviewResponse {
  username: string;
  count: number;
  badges: CredlyBadgePreview[];
}

export interface CredlySyncResponse {
  status: string;
  credlyUsername: string;
  created: number;
  updated: number;
  unchanged: number;
  credlyLastSyncedAt: string;
}
