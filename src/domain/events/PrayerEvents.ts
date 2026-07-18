import { DomainEvent } from './FinanceEvents';

export type PrayerRequestCreatedEvent = DomainEvent<'PrayerRequestCreated', {
  prayerRequestId: string;
  workspaceId: string;
  userId: string;
  message: string;
  createdAt: string;
  expiresAt: string;
}>;

export type PrayerInteractionCreatedEvent = DomainEvent<'PrayerInteractionCreated', {
  prayerRequestId: string;
  interactionId: string;
  userId: string;
  createdAt: string;
}>;

export type PrayerEvent = PrayerRequestCreatedEvent | PrayerInteractionCreatedEvent;
