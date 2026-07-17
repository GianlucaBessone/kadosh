import { DomainEvent, EventMetadata } from './FinanceEvents';

// ─── Tithes ─────────────────────────────────────────
export type TitheRegisteredEvent = DomainEvent<'TitheRegistered', {
  titheId: string;
  amount: number;
  month: number;
  year: number;
  transactionId: string;
}>;

export type TitheDeletedEvent = DomainEvent<'TitheDeleted', {
  titheId: string;
}>;

// ─── Seeds ──────────────────────────────────────────
export type SeedGoalCreatedEvent = DomainEvent<'SeedGoalCreated', {
  seedId: string;
  name: string;
  targetAmount: number;
  deadline?: string;
}>;

export type SeedWateredEvent = DomainEvent<'SeedWatered', {
  seedId: string;
  contributionId: string;
  amount: number;
  date: string;
  notes?: string;
}>;

export type SeedWithdrawnEvent = DomainEvent<'SeedWithdrawn', {
  seedId: string;
  withdrawalId: string;
  amount: number;
  date: string;
  notes?: string;
}>;

export type SeedDeletedEvent = DomainEvent<'SeedDeleted', {
  seedId: string;
  restoreBalance: boolean;
}>;

export type SeedGoalDeletedEvent = DomainEvent<'SeedGoalDeleted', {
  seedId: string;
}>;

export type DevotionalEvent = 
  | TitheRegisteredEvent
  | TitheDeletedEvent
  | SeedGoalCreatedEvent
  | SeedGoalDeletedEvent
  | SeedWateredEvent
  | SeedWithdrawnEvent
  | SeedDeletedEvent;
