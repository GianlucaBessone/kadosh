export interface CommandMetadata {
  workspaceId: string;
  userId: string;
  deviceId: string;
  timestamp: string;
}

export type Command<TType extends string, TPayload> = {
  type: TType;
  metadata: CommandMetadata;
  payload: TPayload;
}

// ─── Accounts ───────────────────────────────────────
export type CreateAccountCommand = Command<'CREATE_ACCOUNT', {
  accountId: string;
  name: string;
  currency: string;
  initialBalance: number;
  type: string; // e.g., 'CASH', 'BANK'
}>;

export type UpdateAccountCommand = Command<'UPDATE_ACCOUNT', {
  accountId: string;
  name?: string;
  currency?: string;
}>;

export type DeleteAccountCommand = Command<'DELETE_ACCOUNT', {
  accountId: string;
}>;


// ─── Transactions ───────────────────────────────────
export type CreateTransactionCommand = Command<'CREATE_TRANSACTION', {
  transactionId: string;
  accountId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  date: string;
  description?: string;
  transferAccountId?: string;
}>;

export type UpdateTransactionCommand = Command<'UPDATE_TRANSACTION', {
  transactionId: string;
  accountId?: string;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  date?: string;
  description?: string;
  transferAccountId?: string;
}>;

export type DeleteTransactionCommand = Command<'DELETE_TRANSACTION', {
  transactionId: string;
}>;

// ─── Categories ─────────────────────────────────────
export type CreateCategoryCommand = Command<'CREATE_CATEGORY', {
  categoryId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}>;

export type DeleteCategoryCommand = Command<'DELETE_CATEGORY', {
  categoryId: string;
}>;

// ─── Commitments ────────────────────────────────────
export type CreateCommitmentCommand = Command<'CREATE_COMMITMENT', {
  commitmentId: string;
  name: string;
  amount: number; // For INSTALLMENT type, this is the installment amount
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

export type UpdateCommitmentCommand = Command<'UPDATE_COMMITMENT', {
  commitmentId: string;
  changes: Partial<CreateCommitmentCommand['payload']>;
}>;

export type DeleteCommitmentCommand = Command<'DELETE_COMMITMENT', {
  commitmentId: string;
}>;

export type PayCommitmentCommand = Command<'PAY_COMMITMENT', {
  commitmentId: string;
  paymentId: string;
  transactionId: string; // The ID of the transaction created for this payment
  amount: number;
  date: string;
  installmentNumber: number;
}>;

export type DeletePaymentCommand = Command<'DELETE_PAYMENT', {
  paymentId: string;
  commitmentId: string;
}>;

// ─── Tithes ─────────────────────────────────────────
export type RegisterTitheCommand = Command<'REGISTER_TITHE', {
  titheId: string;
  amount: number;
  month: number;
  year: number;
  date: string;
  notes?: string;
}>;

// ─── Seeds ──────────────────────────────────────────
export type PlantSeedCommand = Command<'PLANT_SEED', {
  seedId: string;
  name: string;
  targetAmount: number;
  date: string;
  notes?: string;
}>;

export type HarvestSeedCommand = Command<'HARVEST_SEED', {
  seedId: string;
  amount: number;
  date: string;
  notes?: string;
}>;

export type WaterSeedCommand = Command<'WATER_SEED', {
  seedId: string;
  contributionId: string;
  amount: number;
  date: string;
  notes?: string;
}>;

export type WithdrawSeedCommand = Command<'WITHDRAW_SEED', {
  seedId: string;
  withdrawalId: string;
  amount: number;
  date: string;
  notes?: string;
}>;

export type DeleteSeedCommand = Command<'DELETE_SEED', {
  seedId: string;
  restoreBalance: boolean;
}>;

export type FinanceCommand = 
  | CreateAccountCommand
  | UpdateAccountCommand
  | DeleteAccountCommand
  | CreateTransactionCommand
  | UpdateTransactionCommand
  | DeleteTransactionCommand
  | CreateCategoryCommand
  | DeleteCategoryCommand
  | CreateCommitmentCommand
  | UpdateCommitmentCommand
  | DeleteCommitmentCommand
  | PayCommitmentCommand
  | DeletePaymentCommand
  | RegisterTitheCommand
  | PlantSeedCommand
  | HarvestSeedCommand
  | WaterSeedCommand
  | WithdrawSeedCommand
  | DeleteSeedCommand;
