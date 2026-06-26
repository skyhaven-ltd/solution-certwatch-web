import { containers } from "../db/cosmosClient";
import { User } from "../models/user";
import { reconcileCredlyBadges, ReconcileResult } from "./reconcile";
import { getSyncSource } from "./sourceRegistry";

export interface UserSyncResult extends ReconcileResult {
  credlyLastSyncedAt: string;
}

// Fetch a user's Credly badges and reconcile them into certifications, then
// stamp the user's credlyLastSyncedAt. Shared by the on-demand endpoint and
// the scheduled job. Throws if the user has no linked Credly profile or the
// fetch fails (callers decide how to surface that).
export async function syncCredlyForUser(user: User): Promise<UserSyncResult> {
  const username = user.credlyUsername?.trim();
  if (!username) {
    throw new Error("No Credly profile linked.");
  }

  const source = getSyncSource("credly");
  if (!source) {
    throw new Error("Credly sync source is not registered.");
  }

  const badges = await source.fetchBadges(username);
  const result = await reconcileCredlyBadges(user.userId, badges);

  const now = new Date().toISOString();
  await containers.users().items.upsert<User>({
    ...user,
    credlyUsername: username,
    credlyLastSyncedAt: now,
    updatedAt: now,
  });

  return { ...result, credlyLastSyncedAt: now };
}
