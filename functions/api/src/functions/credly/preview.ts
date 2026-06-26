import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateToken } from "../../shared/auth/validateToken";
import { getSyncSource } from "../../shared/sync/sourceRegistry";

interface PreviewRequest {
  username?: string;
}

// Fetches a Credly profile and returns a summary of its public badges WITHOUT
// persisting anything — used by the linking page to validate a username and
// show "Found N badges" before the user commits to importing.
async function handler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    await validateToken(req);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { status: 401, jsonBody: { error: message } };
  }

  const body = (await req.json().catch(() => ({}))) as PreviewRequest;
  const username = (body.username ?? "").trim();
  if (!username) {
    return { status: 400, jsonBody: { error: "username is required." } };
  }

  const source = getSyncSource("credly");
  if (!source) {
    return {
      status: 500,
      jsonBody: { error: "Credly sync source is not registered." },
    };
  }

  try {
    const badges = await source.fetchBadges(username);
    return {
      status: 200,
      jsonBody: {
        username,
        count: badges.length,
        badges: badges.map((b) => ({
          name: b.name,
          vendor: b.vendor,
          expiresAt: b.expiresAt,
        })),
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to read Credly profile.";
    return { status: 502, jsonBody: { error: message } };
  }
}

app.http("previewCredly", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "v1/credly/preview",
  handler,
});
