export type PrayerRequestStatus = 'ACTIVE' | 'ARCHIVED';

export type OracionesView = 'hub' | 'pedir' | 'orar';

export interface PrayerRequestDTO {
  id: string;
  message: string;
  status: PrayerRequestStatus;
  prayerCount: number;
  joinedCount: number; // Added: people who joined
  createdAt: string;
  expiresAt: string;
  archivedAt: string | null;
  daysRemaining: number;
  authorDisplayName: string;
  authorInitial: string;
  hasPrayed: boolean;
  hasJoined: boolean; // Added: did current user join?
}

export interface MyPrayerRequestDTO {
  id: string;
  message: string;
  status: PrayerRequestStatus;
  prayerCount: number;
  joinedCount: number; // Added
  createdAt: string;
  expiresAt: string;
  archivedAt: string | null;
  daysRemaining: number;
  closeReason?: 'EXPIRED' | 'CANCELLED';
}

export interface CommunityPrayerSummary {
  activeCount: number; // Total active
  pendingCount: number; // >0 prayers but user hasn't prayed
  unaccompaniedCount: number; // 0 prayers
  accompaniedCount: number; // user has prayed
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
