import type {
  Certification,
  UpdateCertificationRequest,
  CredlyPreviewResponse,
  CredlySyncResponse,
} from "../types/certification";
import type { UserProfile, ReminderPreferences } from "../types/user";

const BASE_URL = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as unknown as T;
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: string;
    };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  users: {
    getProfile: () => request<UserProfile>("/users/me"),
    updateProfile: (body: Partial<UserProfile>) =>
      request<UserProfile>("/users/me", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },

  certifications: {
    list: () => request<Certification[]>("/certifications"),
    getById: (id: string) => request<Certification>(`/certifications/${id}`),
    update: (id: string, body: UpdateCertificationRequest) =>
      request<Certification>(`/certifications/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      request<void>(`/certifications/${id}`, { method: "DELETE" }),
    // Per-user Credly sync. Pass a username to link/relink ("Link & import");
    // omit it to sync the already-linked profile ("Sync now").
    sync: (username?: string) =>
      request<CredlySyncResponse>("/certifications/sync", {
        method: "POST",
        body: JSON.stringify(username ? { username } : {}),
      }),
  },

  credly: {
    preview: (username: string) =>
      request<CredlyPreviewResponse>("/credly/preview", {
        method: "POST",
        body: JSON.stringify({ username }),
      }),
    // Unlinks the Credly profile and removes all certs imported from it.
    unlink: () =>
      request<{ status: string; removed: number }>("/credly/unlink", {
        method: "POST",
      }),
  },

  reminders: {
    getPreferences: () =>
      request<ReminderPreferences>("/reminders/preferences"),
    updatePreferences: (body: Partial<ReminderPreferences>) =>
      request<ReminderPreferences>("/reminders/preferences", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    testNotification: () =>
      request<{ status: string }>("/reminders/test", { method: "POST" }),
  },
};
