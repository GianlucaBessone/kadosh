import Dexie, { type EntityTable } from 'dexie';

// ─── Planning Module Enums ───────────────────────────────────────────────────

export enum CommitmentType {
  INSTALLMENT = 'INSTALLMENT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SERVICE = 'SERVICE',
  LOAN = 'LOAN',
  TAX = 'TAX',
  RENT = 'RENT',
  INSURANCE = 'INSURANCE',
  UTILITY = 'UTILITY',
  CUSTOM = 'CUSTOM',
}

export enum CommitmentPeriodicity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  BIMONTHLY = 'BIMONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  YEARLY = 'YEARLY',
  BIWEEKLY = 'BIWEEKLY',
  CUSTOM = 'CUSTOM',
}

export enum CommitmentStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  lastName: string | null;
  avatarUrl: string | null;    // base64 data-URL stored locally (offline-first)
  isCloudLinked: boolean;     // true when a Supabase account is associated
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Settings {
  id: string;
  userId: string;
  theme: string;
  notifications: boolean;
  dailyVerse: boolean;
  showReflection: boolean;
  offlineDownload: boolean;
  planningMode?: 'MONTHLY' | 'BIWEEKLY';
  hasSelectedPlanningMode?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  type: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SeedGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SeedContribution {
  id: string;
  seedGoalId: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Tithe {
  id: string;
  userId: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export enum VerseCategory {
  MAYORDOMIA = 'MAYORDOMIA',
  SABIDURIA = 'SABIDURIA',
  TRABAJO = 'TRABAJO',
  CONFIANZA = 'CONFIANZA',
  GENEROSIDAD = 'GENEROSIDAD',
  GRATITUD = 'GRATITUD',
  PAZ = 'PAZ',
  FE = 'FE',
  ESPERANZA = 'ESPERANZA'
}

export interface DailyVerse {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  category: VerseCategory;
  theme: string;
  text: string;
  reflection: string | null;
  dayOfYear: number;
  active: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Planning Module Interfaces ─────────────────────────────────────────────

export interface FinancialCommitment {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  type: CommitmentType;
  status: CommitmentStatus;
  /** Monto total del compromiso. null si es recurrente indefinido */
  amountTotal: number | null;
  /** Valor de cada cuota/pago */
  installmentAmount: number;
  /** Cantidad de cuotas. null = recurrente indefinido */
  installments: number | null;
  /** Índice de la cuota actual (0-based) */
  currentInstallment: number;
  /** Monto restante. null si es recurrente */
  remainingAmount: number | null;
  periodicity: CommitmentPeriodicity;
  biweeklyPeriod?: 'Q1' | 'Q2';
  /** Fecha de la primera cuota (ISO date) */
  firstDueDate: string;
  /** Día del mes para periodicidad mensual */
  dayOfMonth: number | null;
  hasReminder: boolean;
  /** Días de anticipación para el recordatorio */
  reminderDaysBefore: number;
  /** Hora del recordatorio (formato HH:mm, ej. '08:00') */
  reminderTime?: string;
  /** ID del intento de notificación en Supabase para poder cancelarlo */
  notificationIntentId?: string | null;
  /** true = sin cuotas finitas, hasta que el usuario lo finalice */
  isRecurring: boolean;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CommitmentPayment {
  id: string;
  commitmentId: string;
  installmentNumber: number;
  amount: number;
  date: string;
  notes: string | null;
  /** ID del movimiento financiero creado automáticamente */
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SyncQueue {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'ERROR';
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastAttempt: string | null;
}

export interface Metadata {
  id: string; // e.g. "sync-metadata"
  lastSyncAt: string | null;
  deviceId: string | null;
}

export class KadoshDB extends Dexie {
  users!: EntityTable<User, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  accounts!: EntityTable<Account, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  seedGoals!: EntityTable<SeedGoal, 'id'>;
  seedContributions!: EntityTable<SeedContribution, 'id'>;
  tithes!: EntityTable<Tithe, 'id'>;
  dailyVerses!: EntityTable<DailyVerse, 'id'>;
  notifications!: EntityTable<Notification, 'id'>;
  syncQueue!: EntityTable<SyncQueue, 'id'>;
  metadata!: EntityTable<Metadata, 'id'>;
  financialCommitments!: EntityTable<FinancialCommitment, 'id'>;
  commitmentPayments!: EntityTable<CommitmentPayment, 'id'>;

  constructor() {
    super('KadoshDB');
    this.version(6).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      accounts: 'id, userId',
      categories: 'id, userId, type',
      transactions: 'id, userId, accountId, categoryId, type, date',
      seedGoals: 'id, userId, status, createdAt',
      seedContributions: 'id, seedGoalId, date',
      tithes: 'id, userId, [month+year], createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      financialCommitments: 'id, ownerId, status, type, dayOfMonth, firstDueDate',
      commitmentPayments: 'id, commitmentId, date, installmentNumber',
    });
    this.version(5).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      accounts: 'id, userId',
      categories: 'id, userId, type',
      transactions: 'id, userId, accountId, categoryId, type, date',
      seedGoals: 'id, userId, status, createdAt',
      seedContributions: 'id, seedGoalId, date',
      tithes: 'id, userId, [month+year], createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
    });
    this.version(4).stores({
      users: 'id, email',
      settings: 'id, userId',
      accounts: 'id, userId',
      categories: 'id, userId, type',
      transactions: 'id, userId, accountId, categoryId, type, date',
      seedGoals: 'id, userId, status, createdAt',
      seedContributions: 'id, seedGoalId, date',
      tithes: 'id, userId, [month+year], createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
    });
    this.version(3).stores({
      users: 'id, email',
      settings: 'id, userId',
      accounts: 'id, userId',
      categories: 'id, userId, type',
      transactions: 'id, userId, accountId, categoryId, type, date',
      seedGoals: 'id, userId, status, createdAt',
      seedContributions: 'id, seedGoalId, date',
      tithes: 'id, userId, [month+year], createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
    });
    this.version(2).stores({
      users: 'id, email',
      settings: 'id, userId',
      accounts: 'id, userId',
      categories: 'id, userId, type',
      transactions: 'id, userId, accountId, categoryId, type, date',
      seedGoals: 'id, userId, status, createdAt',
      seedContributions: 'id, seedGoalId, date',
      tithes: 'id, userId, [month+year], createdAt',
      dailyVerses: 'id, date',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
    });
    this.version(1).stores({
      users: 'id, email',
      settings: 'id, userId',
      accounts: 'id, userId',
      categories: 'id, userId, type',
      transactions: 'id, userId, accountId, categoryId, type, date',
      seedGoals: 'id, userId, status',
      seedContributions: 'id, seedGoalId, date',
      tithes: 'id, userId, month, year',
      dailyVerses: 'id, date',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
    });
  }
}

export const db = new KadoshDB();

export async function clearAllUserData() {
  await db.transaction('rw', [
    db.users, db.settings, db.accounts, db.categories, db.transactions,
    db.seedGoals, db.seedContributions, db.tithes, db.notifications,
    db.syncQueue, db.metadata, db.financialCommitments, db.commitmentPayments
  ], async () => {
    await db.users.clear();
    await db.settings.clear();
    await db.accounts.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.seedGoals.clear();
    await db.seedContributions.clear();
    await db.tithes.clear();
    await db.notifications.clear();
    await db.syncQueue.clear();
    await db.metadata.clear();
    await db.financialCommitments.clear();
    await db.commitmentPayments.clear();
  });
}
