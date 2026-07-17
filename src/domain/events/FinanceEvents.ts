export type EventMetadata = {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: string;
  version: string;
}

export type DomainEvent<TType extends string, TPayload> = {
  type: TType;
  metadata: EventMetadata;
  payload: TPayload;
}

// ─── Accounts ───────────────────────────────────────
export type AccountCreatedEvent = DomainEvent<'AccountCreated', {
  accountId: string;
  name: string;
  currency: string;
  initialBalance: number;
  type: string;
}>;

export type AccountUpdatedEvent = DomainEvent<'AccountUpdated', {
  accountId: string;
  name?: string;
  currency?: string;
}>;

export type AccountDeletedEvent = DomainEvent<'AccountDeleted', {
  accountId: string;
}>;


// ─── Transactions ───────────────────────────────────
export type TransactionCreatedEvent = DomainEvent<'TransactionCreated', {
  transactionId: string;
  accountId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  date: string;
  description?: string;
  transferAccountId?: string;
}>;

export type TransactionUpdatedEvent = DomainEvent<'TransactionUpdated', {
  transactionId: string;
  accountId?: string;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  date?: string;
  description?: string;
  transferAccountId?: string;
}>;

export type TransactionDeletedEvent = DomainEvent<'TransactionDeleted', {
  transactionId: string;
}>;

// ─── Categories ─────────────────────────────────────
export type CategoryCreatedEvent = DomainEvent<'CategoryCreated', {
  categoryId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}>;

export type CategoryDeletedEvent = DomainEvent<'CategoryDeleted', {
  categoryId: string;
}>;

// ─── Commitments ────────────────────────────────────
export type CommitmentCreatedEvent = DomainEvent<'CommitmentCreated', {
  commitmentId: string;
  name: string;
  amount: number;
  installmentAmount: number;
  periodicity: 'MONTHLY' | 'WEEKLY' | 'YEARLY' | 'ONE_TIME' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'BIWEEKLY' | 'CUSTOM';
  type: 'INSTALLMENT' | 'SUBSCRIPTION' | 'SERVICE' | 'LOAN' | 'TAX' | 'RENT' | 'INSURANCE' | 'UTILITY' | 'CUSTOM';
  firstDueDate: string;
  endDate?: string;
  notes?: string;
  isRecurring?: boolean;
  installments?: number;
  currentInstallment?: number;
  customPeriodicityDays?: number;
  dayOfMonth?: number;
  biweeklyPeriod?: number;
  amountTotal?: number;
  categoryId?: string;
  description?: string;
}>;

export type CommitmentUpdatedEvent = DomainEvent<'CommitmentUpdated', {
  commitmentId: string;
  changes: Partial<CommitmentCreatedEvent['payload']>;
}>;

export type CommitmentDeletedEvent = DomainEvent<'CommitmentDeleted', {
  commitmentId: string;
}>;

export type CommitmentPaidEvent = DomainEvent<'CommitmentPaid', {
  commitmentId: string;
  paymentId: string;
  transactionId: string;
  amount: number;
  date: string;
  installmentNumber: number;
}>;

export type PaymentDeletedEvent = DomainEvent<'PaymentDeleted', {
  paymentId: string;
  commitmentId: string;
}>;

// ─── Tithes ─────────────────────────────────────────
export type TitheRegisteredEvent = DomainEvent<'TitheRegistered', {
  titheId: string;
  amount: number;
  month: number;
  year: number;
  date: string;
  notes?: string;
}>;

// ─── Seeds ──────────────────────────────────────────
export type SeedGoalCreatedEvent = DomainEvent<'SeedGoalCreated', {
  seedId: string;
  name: string;
  targetAmount: number;
  date: string;
  notes?: string;
}>;

export type SeedGoalDeletedEvent = DomainEvent<'SeedGoalDeleted', {
  seedId: string;
  amount: number;
  date: string;
  notes?: string;
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

export type FinanceEvent = 
  | AccountCreatedEvent
  | AccountUpdatedEvent
  | AccountDeletedEvent
  | TransactionCreatedEvent
  | TransactionUpdatedEvent
  | TransactionDeletedEvent
  | CategoryCreatedEvent
  | CategoryDeletedEvent
  | CommitmentCreatedEvent
  | CommitmentUpdatedEvent
  | CommitmentDeletedEvent
  | CommitmentPaidEvent
  | PaymentDeletedEvent
  | TitheRegisteredEvent
  | SeedGoalCreatedEvent
  | SeedGoalDeletedEvent
  | SeedWateredEvent
  | SeedWithdrawnEvent
  | SeedDeletedEvent;
