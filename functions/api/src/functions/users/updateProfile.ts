import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateToken } from "../../shared/auth/validateToken";
import { containers } from "../../shared/db/cosmosClient";
import { User, UpdateUserRequest } from "../../shared/models/user";

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
  try {
    const auth = await validateToken(req);
    const body = (await req.json().catch(() => ({}))) as UpdateUserRequest;

    const now = new Date().toISOString();
    const container = containers.users();

    const { resource: existing } = await container
      .item(auth.userId, auth.userId)
      .read<User>();

    const user: User = existing
      ? {
          ...existing,
          displayName: body.displayName ?? existing.displayName,
          reminderPreferences: {
            ...existing.reminderPreferences,
            ...body.reminderPreferences,
          },
          credlyUsername:
            body.credlyUsername !== undefined
              ? body.credlyUsername
              : existing.credlyUsername,
          updatedAt: now,
        }
      : {
          id: auth.userId,
          userId: auth.userId,
          email: auth.email,
          displayName: body.displayName ?? auth.displayName,
          reminderPreferences: {
            ...DEFAULT_PREFERENCES,
            ...body.reminderPreferences,
          },
          credlyUsername: body.credlyUsername ?? null,
          createdAt: now,
          updatedAt: now,
        };

    const { resource } = await container.items.upsert<User>(user);
    return { status: 200, jsonBody: resource };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { status: 401, jsonBody: { error: message } };
  }
}

app.http("updateUserProfile", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "v1/users/me",
  handler,
});
