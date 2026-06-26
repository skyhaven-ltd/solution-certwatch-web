import { CertificationVendor } from "../models/certification";
import { ICertSyncSource, NormalizedBadge } from "./syncSource";

const CREDLY_BASE_URL = "https://www.credly.com";
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

interface CredlyBadge {
  id?: string;
  issued_at_date?: string | null;
  expires_at_date?: string | null;
  badge_template?: { id?: string; name?: string };
  issuer?: { entities?: { entity?: { name?: string } }[] };
}

interface CredlyResponse {
  data?: CredlyBadge[];
  metadata?: { total_pages?: number };
}

function mapVendor(name: string | undefined): CertificationVendor {
  const n = (name ?? "").toLowerCase();
  if (n.includes("amazon") || n.includes("aws")) return "aws";
  if (n.includes("comptia")) return "comptia";
  if (n.includes("hashicorp")) return "hashicorp";
  if (n.includes("microsoft")) return "microsoft";
  return "other";
}

function toIsoDate(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  // Credly returns date-only ("2026-12-31") or full ISO; keep the date part.
  return value.slice(0, 10);
}

function normalizeBadge(badge: CredlyBadge): NormalizedBadge | null {
  const templateId = badge.badge_template?.id;
  if (!templateId) return null; // can't match/dedupe without a template id

  return {
    templateId,
    name: badge.badge_template?.name ?? "Untitled credential",
    vendor: mapVendor(badge.issuer?.entities?.[0]?.entity?.name),
    expiresAt: toIsoDate(badge.expires_at_date),
    issuedAt: toIsoDate(badge.issued_at_date),
    badgeId: badge.id ?? templateId,
  };
}

// Reads a user's PUBLIC Credly badges from the unauthenticated profile JSON.
// Requires the user's Credly badges to be public; private badges are invisible.
export class CredlySyncSource implements ICertSyncSource {
  readonly source = "credly";
  readonly displayName = "Credly";

  async fetchBadges(username: string): Promise<NormalizedBadge[]> {
    const handle = username.trim();
    if (!handle) {
      throw new Error("A Credly username is required.");
    }

    const badges: NormalizedBadge[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url =
        `${CREDLY_BASE_URL}/users/${encodeURIComponent(handle)}/badges.json` +
        `?page=${page}&page_size=${PAGE_SIZE}`;

      const response = await fetch(url, {
        headers: { accept: "application/json" },
      });

      if (response.status === 404) {
        throw new Error(
          `No public Credly profile found for "${handle}". Check the username and that the profile is public.`,
        );
      }
      if (!response.ok) {
        throw new Error(
          `Credly request failed with status ${response.status}.`,
        );
      }

      const body = (await response.json()) as CredlyResponse;
      const data = Array.isArray(body.data) ? body.data : [];

      for (const badge of data) {
        const normalized = normalizeBadge(badge);
        if (normalized) badges.push(normalized);
      }

      const totalPages = body.metadata?.total_pages;
      const reachedEnd = totalPages
        ? page >= totalPages
        : data.length < PAGE_SIZE;
      if (reachedEnd) break;
    }

    return badges;
  }
}
