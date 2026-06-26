import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateToken } from "../../shared/auth/validateToken";
import { containers } from "../../shared/db/cosmosClient";
import { User } from "../../shared/models/user";
import { syncCredlyForUser } from "../../shared/sync/syncUser";

interface SyncRequest {
  username?: string;
}

// Matches the defaults applied by PUT /v1/users/me so a profile first created
// here is indistinguishable from one created via Settings.
const DEFAULT_PREFERENCES = {
  emailEnabled: true,
  emailDaysBefore: [30, 14, 7],
  smsEnabled: false,
  smsDaysBefore: [],
};

async function handler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let auth;
  try {
    auth = await validateToken(req);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { status: 401, jsonBody: { error: message } };
  }

  const body = (await req.json().catch(() => ({}))) as SyncRequest;
  const providedUsername = (body.username ?? "").trim();

  const usersContainer = containers.users();
  const { resource: existing } = await usersContainer
    .item(auth.userId, auth.userId)
    .read<User>();

  // A username in the body links/relinks the profile ("Link & import"); without
  // it we sync the already-linked profile ("Sync now").
  const effective = providedUsername || existing?.credlyUsername?.trim();
  if (!effective) {
    return {
      status: 400,
      jsonBody: {
        error: "No Credly profile linked. Provide a Credly username to link.",
      },
    };
  }

  // A first-time user may reach "Connect Credly" before any profile write has
  // created their record (only PUT /v1/users/me does that, via Settings). When
  // they're linking, provision the record here — mirroring updateProfile — so
  // linking succeeds on the first attempt instead of 404-ing. syncCredlyForUser
  // persists the user via upsert.
  const now = new Date().toISOString();
  const baseUser: User = existing ?? {
    id: auth.userId,
    userId: auth.userId,
    email: auth.email,
    displayName: auth.displayName,
    reminderPreferences: DEFAULT_PREFERENCES,
    credlyUsername: null,
    credlyLastSyncedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const targetUser: User = providedUsername
    ? { ...baseUser, credlyUsername: providedUsername }
    : baseUser;

  try {
    const result = await syncCredlyForUser(targetUser);
    return {
      status: 200,
      jsonBody: {
        status: "synced",
        credlyUsername: effective,
        ...result,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Credly sync failed.";
    return { status: 502, jsonBody: { error: message } };
  }
}

app.http("syncCertifications", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "v1/certifications/sync",
  handler,
});
