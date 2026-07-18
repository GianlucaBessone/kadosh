export type PrayerRequestStatus = 'ACTIVE' | 'ARCHIVED';

export type OracionesView = 'hub' | 'pedir' | 'orar';

export interface PrayerRequestDTO {
  id: string;
  message: string;
  status: PrayerRequestStatus;
  prayerCount: number;
  createdAt: string;
  expiresAt: string;
  archivedAt: string | null;
  daysRemaining: number;
  authorDisplayName: string;
  authorInitial: string;
  hasPrayed: boolean;
}

export interface MyPrayerRequestDTO {
  id: string;
  message: string;
  status: PrayerRequestStatus;
  prayerCount: number;
  createdAt: string;
  expiresAt: string;
  archivedAt: string | null;
  daysRemaining: number;
}

export interface CommunityPrayerSummary {
  activeCount: number;
  pendingCount: number;
  prayedCount: number;
}

export interface CreatePrayerRequestPayload {
  userId: string;
  workspaceId?: string | null;
  message: string;
}

export interface PrayPayload {
  userId: string;
}

export interface PrayAllPayload {
  userId: string;
}
