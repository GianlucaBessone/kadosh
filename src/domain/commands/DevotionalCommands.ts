import { Command, CommandMetadata } from './FinanceCommands';

// ─── Tithes ─────────────────────────────────────────
export type RegisterTitheCommand = Command<'REGISTER_TITHE', {
  titheId: string;
  amount: number;
  month: number;
  year: number;
  transactionId: string;
}>;

export type DeleteTitheCommand = Command<'DELETE_TITHE', {
  titheId: string;
}>;

// ─── Seeds ──────────────────────────────────────────
export type CreateSeedGoalCommand = Command<'CREATE_SEED_GOAL', {
  seedId: string;
  name: string;
  targetAmount: number;
  deadline?: string;
}>;

export type AddSeedContributionCommand = Command<'ADD_SEED_CONTRIBUTION', {
  contributionId: string;
  seedId: string;
  amount: number;
  transactionId: string;
  date: string;
}>;

export type DeleteSeedGoalCommand = Command<'DELETE_SEED_GOAL', {
  seedId: string;
}>;

export type DevotionalCommand = 
  | RegisterTitheCommand
  | DeleteTitheCommand
  | CreateSeedGoalCommand
  | AddSeedContributionCommand
  | DeleteSeedGoalCommand;
