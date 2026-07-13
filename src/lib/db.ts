import Dexie, { type EntityTable } from 'dexie';

export interface User {
  id: string;
  email: string;
  name: string | null;
  lastName: string | null;
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

  constructor() {
    super('KadoshDB');
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
