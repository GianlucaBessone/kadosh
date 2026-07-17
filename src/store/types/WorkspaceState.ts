export interface Account {
  id: string;
  name: string;
  currency: string;
  type: string;
  balance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  date: string;
  description?: string;
  transferAccountId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  periodicity: 'MONTHLY' | 'WEEKLY' | 'YEARLY' | 'ONE_TIME';
  type: 'INCOME' | 'EXPENSE';
  firstDueDate: string;
  endDate?: string;
}

export interface Tithe {
  id: string;
  amount: number;
  month: number;
  year: number;
  transactionId: string;
}

export interface SeedGoal {
  id: string;
  name: string;
  targetAmount: number;
  deadline?: string;
  currentAmount: number;
  status?: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface WorkspaceSettings {
  theme?: string;
  currency?: string;
}

// ─── Domain States ──────────────────────────────────
export interface FinancialState {
  accounts: Record<string, Account>;
  transactions: Record<string, Transaction>;
  categories: Record<string, Category>;
  commitments: Record<string, Commitment>;
}

export interface DevotionalState {
  tithes: Record<string, Tithe>;
  seeds: Record<string, SeedGoal>;
}

export interface WorkspaceState {
  id: string;
  finances: FinancialState;
  devotionals: DevotionalState;
  members: Record<string, WorkspaceMember>;
  settings: WorkspaceSettings;
}

// ─── Root State ─────────────────────────────────────
export interface RootState {
  activeWorkspaceId: string | null;
  workspaces: Record<string, WorkspaceState>;
}
