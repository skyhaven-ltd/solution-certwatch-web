import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateToken } from "../../shared/auth/validateToken";
import { containers } from "../../shared/db/cosmosClient";
import {
  Certification,
  UpdateCertificationRequest,
} from "../../shared/models/certification";

async function handler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const auth = await validateToken(req);
    const id = req.params["id"];
    const body = (await req
      .json()
      .catch(() => ({}))) as UpdateCertificationRequest;

    const container = containers.certifications();
    const { resource: existing } = await container
      .item(id, auth.userId)
      .read<Certification>();

    if (!existing || existing.userId !== auth.userId) {
      return { status: 404, jsonBody: { error: "Certification not found." } };
    }

    const updated: Certification = {
      ...existing,
      name: body.name?.trim() ?? existing.name,
      vendor: body.vendor ?? existing.vendor,
      vendorCertId:
        body.vendorCertId !== undefined
          ? body.vendorCertId
          : existing.vendorCertId,
      expirationDate: body.expirationDate ?? existing.expirationDate,
      syncEnabled: body.syncEnabled ?? existing.syncEnabled,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate status if expiration date changed
    if (body.expirationDate) {
      updated.status =
        new Date(body.expirationDate) < new Date() ? "expired" : "active";
    }

    const { resource } = await container.items.upsert<Certification>(updated);
    return { status: 200, jsonBody: resource };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { status: 401, jsonBody: { error: message } };
  }
}

app.http("updateCertification", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "v1/certifications/{id}",
  handler,
});
