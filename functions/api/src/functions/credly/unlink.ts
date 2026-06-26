import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateToken } from "../../shared/auth/validateToken";
import { containers } from "../../shared/db/cosmosClient";
import { Certification } from "../../shared/models/certification";
import { User } from "../../shared/models/user";

// Unlinks the user's Credly profile and removes the certifications imported
// from it (source === "credly"). Any legacy manually-added certs are left
// untouched. Idempotent: unlinking when nothing is linked is a no-op.
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

  const certsContainer = containers.certifications();
  const { resources: credlyCerts } = await certsContainer.items
    .query<Certification>(
      {
        query:
          "SELECT * FROM c WHERE c.userId = @userId AND c.source = @source",
        parameters: [
          { name: "@userId", value: auth.userId },
          { name: "@source", value: "credly" },
        ],
      },
      { partitionKey: auth.userId },
    )
    .fetchAll();

  for (const cert of credlyCerts) {
    await certsContainer.item(cert.id, auth.userId).delete();
  }

  const usersContainer = containers.users();
  const { resource: user } = await usersContainer
    .item(auth.userId, auth.userId)
    .read<User>();

  if (user) {
    await usersContainer.items.upsert<User>({
      ...user,
      credlyUsername: null,
      credlyLastSyncedAt: null,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    status: 200,
    jsonBody: { status: "unlinked", removed: credlyCerts.length },
  };
}

app.http("unlinkCredly", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "v1/credly/unlink",
  handler,
});
