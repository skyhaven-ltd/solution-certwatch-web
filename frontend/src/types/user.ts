export interface ReminderPreferences {
  emailEnabled: boolean;
  emailDaysBefore: number[];
  smsEnabled: boolean;
  smsDaysBefore: number[];
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  reminderPreferences: ReminderPreferences;
  credlyUsername?: string | null;
  credlyLastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
