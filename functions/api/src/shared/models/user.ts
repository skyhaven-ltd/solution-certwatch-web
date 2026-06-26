export interface ReminderPreferences {
  emailEnabled: boolean;
  emailDaysBefore: number[];
  smsEnabled: boolean;
  smsDaysBefore: number[];
}

export interface User {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  reminderPreferences: ReminderPreferences;
  // Linked Credly profile vanity/username for badge sync (badges must be public).
  credlyUsername?: string | null;
  // Timestamp of the last successful Credly reconcile for this user.
  credlyLastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Reserved for future multi-tenant support
  tenantId?: string | null;
  role?: "user" | "admin" | "org-admin";
}

export type UserProfileResponse = Omit<User, "tenantId">;

export interface UpdateUserRequest {
  displayName?: string;
  reminderPreferences?: Partial<ReminderPreferences>;
  credlyUsername?: string | null;
}
