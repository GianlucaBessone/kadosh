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
  isEmailConfirmed?: boolean;
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
  soundEffects: boolean;
  showPrayerCard?: boolean;
  planningMode?: 'MONTHLY' | 'BIWEEKLY';
  hasSelectedPlanningMode?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Proyecciones (Read Models) ───────────────────────────────────────────────

export interface ProjectionState {
  workspaceId: string;
  lastProjectedSequence: number;
  updatedAt: string;
}

export interface ProcessedProjectionEvent {
  eventId: string;
  workspaceId: string;
  sequence: number;
  projectedAt: string;
  payloadChecksum: string;
  checkpointVersion: string;
}

export interface ProjectionDeadLetter {
  eventId: string;
  workspaceId: string;
  sequence: number;
  eventType: string;
  errorType: string;
  errorMessage: string;
  stack: string | null;
  retries: number;
  firstFailure: string;
  lastFailure: string;
  status: 'QUARANTINED' | 'RETRYING' | 'DISCARDED' | 'RECOVERED';
}

export interface ProjectionHealth {
  workspaceId: string;
  status: 'OK' | 'PROCESSING' | 'PAUSED' | 'WAITING_KEY' | 'RETRYING' | 'FAILED' | 'RECOVERING';
  lastError: string | null;
  updatedAt: string;
}

export interface ProjectionMetric {
  workspaceId: string;
  processedCount: number;
  corruptedCount: number;
  dlqCount: number;
  avgProcessingTimeMs: number;
  updatedAt: string;
}

export interface ProjectionCheckpoint {
  workspaceId: string;
  lastSequence: number;
  checkpointVersion: string;
  createdAt: string;
}

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Category {
  id: string;
  workspaceId: string;
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
  workspaceId: string;
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
  workspaceId: string;
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
  workspaceId: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PrayerRequest {
  id: string;
  workspaceId: string | null;
  userId: string;
  message: string;
  status: 'ACTIVE' | 'ARCHIVED';
  prayerCount: number;
  joinedCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  archivedAt: string | null;
}

export interface PrayerInteraction {
  id: string;
  prayerRequestId: string;
  userId: string;
  type: 'PRAYED' | 'JOINED';
  createdAt: string;
}

// ─── E2EE & Event Sourcing Interfaces ───────────────────────────────────────

export interface Device {
  id: string;
  userId: string;
  publicKey: string;
  deviceName: string;
  trusted: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceKey {
  id: string;
  workspaceId: string;
  version: number;
  createdAt: string;
}

export interface DeviceWorkspaceKey {
  id: string;
  workspaceKeyId: string;
  deviceId: string;
  wrappedKey: string;
  createdAt: string;
}

export interface WorkspaceEvent {
  id: string;
  workspaceId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string; // e.g. "TransactionCreated", "AccountUpdated"
  sequence: number;
  encryptedPayload: string; // cyphertext + IV en base64
  schemaVersion: string; // e.g. "1.0"
  encryptionVersion: string; // e.g. "v1"
  ownerUserId: string;
  deviceId: string;
  keyId: string;
  createdAt: string;
  syncStatus: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'ERROR'; // Local-only
}

export interface WorkspaceSnapshot {
  id: string;
  workspaceId: string;
  snapshotVersion: number;
  schemaVersion: string; // e.g. "1.0"
  lastEventId: string;
  eventCount: number;
  snapshotPolicy: string;
  keyId: string;
  encryptedPayload: string;
  createdByDeviceId: string;
  createdAt: string;
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
  amount: number;
  installmentAmount: number;
  type: CommitmentType;
  periodicity: CommitmentPeriodicity;
  status: CommitmentStatus;
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
  hasReminder?: boolean;
  reminderDaysBefore?: number;
  reminderTime?: string;
  customTypeName?: string;
  notificationIntentId?: string;
  pausedUntil?: Date | string;
  remainingAmount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CommitmentPayment {
  id: string;
  commitmentId: string;
  amount: number;
  installmentNumber: number;
  date: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  notes?: string;
  transactionId?: string;
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

export interface SystemConfig {
  key: string;
  value: string;
}

import { createDexieProfiler } from './performance/DexieProfiler';

export interface MotivationalVerse {
  id: string;
  text: string;
  reference: string;
  category: 'AHORRO' | 'DIEZMO';
  createdAt: string;
}

export class KadoshDB extends Dexie {
  users!: EntityTable<User, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  workspaces!: EntityTable<Workspace, 'id'>;
  workspaceMembers!: EntityTable<WorkspaceMember, 'id'>;
  devices!: EntityTable<Device, 'id'>;
  workspaceKeys!: EntityTable<WorkspaceKey, 'id'>;
  deviceWorkspaceKeys!: EntityTable<DeviceWorkspaceKey, 'id'>;
  workspaceEvents!: EntityTable<WorkspaceEvent, 'id'>;
  workspaceSnapshots!: EntityTable<WorkspaceSnapshot, 'id'>;
  dailyVerses!: EntityTable<DailyVerse, 'id'>;
  notifications!: EntityTable<Notification, 'id'>;
  syncQueue!: EntityTable<SyncQueue, 'id'>;
  metadata!: EntityTable<Metadata, 'id'>;
  systemConfig!: EntityTable<SystemConfig, 'key'>;
  motivationalVerses!: EntityTable<MotivationalVerse, 'id'>;
  
  // Read Models (Projections)
  projectionState!: EntityTable<ProjectionState, 'workspaceId'>;
  accounts!: EntityTable<Account, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  seedGoals!: EntityTable<SeedGoal, 'id'>;
  seedContributions!: EntityTable<SeedContribution, 'id'>;
  tithes!: EntityTable<Tithe, 'id'>;
  financialCommitments!: EntityTable<FinancialCommitment, 'id'>;
  commitmentPayments!: EntityTable<CommitmentPayment, 'id'>;
  prayerRequests!: EntityTable<PrayerRequest, 'id'>;
  prayerInteractions!: EntityTable<PrayerInteraction, 'id'>;
  processedProjectionEvents!: EntityTable<ProcessedProjectionEvent, 'eventId'>;
  projectionDeadLetters!: EntityTable<ProjectionDeadLetter, 'eventId'>;
  projectionHealth!: EntityTable<ProjectionHealth, 'workspaceId'>;
  projectionMetrics!: EntityTable<ProjectionMetric, 'workspaceId'>;
  projectionCheckpoints!: EntityTable<ProjectionCheckpoint, 'workspaceId'>;

  constructor() {
    super('KadoshDB');
    // ==================== VERSIÓN ACTUAL (16) ====================
    this.version(16).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, [workspaceId+sequence], aggregateId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',

      projectionState: 'workspaceId',
      processedProjectionEvents: 'eventId, workspaceId',
      projectionDeadLetters: 'eventId, workspaceId, sequence, status',
      projectionHealth: 'workspaceId, status',
      projectionMetrics: 'workspaceId',
      projectionCheckpoints: 'workspaceId',

      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',

      // === ORACIONES - ÍNDICES OPTIMIZADOS ===
      prayerRequests: 'id, workspaceId, userId, status, expiresAt, createdAt, [workspaceId+userId], [workspaceId+status], [workspaceId+expiresAt]',
      prayerInteractions: 'id, prayerRequestId, userId, [prayerRequestId+userId]'
    });
    this.version(15).stores({
      prayerRequests: 'id, workspaceId, userId, status, expiresAt',
      prayerInteractions: 'id, prayerRequestId, userId, [prayerRequestId+userId]'
    });
    this.version(14).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, [workspaceId+sequence], aggregateId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      processedProjectionEvents: 'eventId, workspaceId',
      projectionDeadLetters: 'eventId, workspaceId, sequence, status',
      projectionHealth: 'workspaceId, status',
      projectionMetrics: 'workspaceId',
      projectionCheckpoints: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
    });
    this.version(15).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, [workspaceId+sequence], aggregateId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      processedProjectionEvents: 'eventId, workspaceId',
      projectionDeadLetters: 'eventId, workspaceId, sequence, status',
      projectionHealth: 'workspaceId, status',
      projectionMetrics: 'workspaceId',
      projectionCheckpoints: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
      prayerRequests: 'id, workspaceId, userId, status, expiresAt',
      prayerInteractions: 'id, prayerRequestId, userId, [prayerRequestId+userId]'
    });
    this.version(12).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, [workspaceId+sequence], aggregateId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
    });
    this.version(11).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, [workspaceId+sequence], aggregateId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
    });
    this.version(10).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, [workspaceId+sequence], aggregateId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
    });
    this.version(9).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, [workspaceId+sequence], aggregateId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
    });
    this.version(8).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, eventType, syncStatus, createdAt',
      workspaceSnapshots: 'id, workspaceId, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
    });
    this.version(7).stores({
      users: 'id, email, isCloudLinked',
      settings: 'id, userId',
      workspaces: 'id, ownerId',
      workspaceMembers: 'id, workspaceId, userId',
      devices: 'id, userId, trusted',
      workspaceKeys: 'id, workspaceId',
      deviceWorkspaceKeys: 'id, workspaceKeyId, deviceId',
      workspaceEvents: 'id, workspaceId, eventType, syncStatus, createdAt',
      dailyVerses: 'id, dayOfYear',
      notifications: 'id, userId, read',
      syncQueue: 'id, status, tableName, recordId',
      metadata: 'id',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
      projectionState: 'workspaceId',
      accounts: 'id, workspaceId, deletedAt',
      categories: 'id, workspaceId, type, deletedAt',
      transactions: 'id, workspaceId, accountId, categoryId, type, date, deletedAt',
      seedGoals: 'id, workspaceId, status, deletedAt',
      seedContributions: 'id, seedGoalId, date, deletedAt',
      tithes: 'id, workspaceId, [month+year], deletedAt',
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
    });
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
      financialCommitments: 'id, ownerId, status, periodicity, type, firstDueDate, endDate, deletedAt',
      commitmentPayments: 'id, commitmentId, status, date, deletedAt',
      systemConfig: 'key',
      motivationalVerses: 'id, category',
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
createDexieProfiler(db);

// Función para limpiar todo (útil para testing)
export async function clearAllUserData() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(table => table.clear()));
  });
}