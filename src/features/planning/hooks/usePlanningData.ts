'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { FinancialCommitment, CommitmentPayment } from '@/lib/db';

/**
 * Reactively fetches all non-deleted commitments for the current user.
 * Updates automatically whenever Dexie data changes.
 */
export function useAllCommitments(ownerId: string | undefined): FinancialCommitment[] {
  return (
    useLiveQuery(
      () =>
        ownerId
          ? db.financialCommitments
              .where('ownerId')
              .equals(ownerId)
              .filter(c => c.deletedAt === null)
              .toArray()
          : [],
      [ownerId]
    ) ?? []
  );
}

/**
 * Reactively fetches all paused commitments for the current user.
 */
export function usePausedCommitments(ownerId: string | undefined): FinancialCommitment[] {
  return (
    useLiveQuery(
      () =>
        ownerId
          ? db.financialCommitments
              .where('ownerId')
              .equals(ownerId)
              .filter(c => c.deletedAt === null && c.status === 'PAUSED')
              .toArray()
          : [],
      [ownerId]
    ) ?? []
  );
}

/**
 * Reactively fetches a single commitment by ID.
 */
export function useCommitment(id: string | undefined): FinancialCommitment | undefined {
  return useLiveQuery(
    () => (id ? db.financialCommitments.get(id) : undefined),
    [id]
  );
}

/**
 * Reactively fetches all payments for a given commitment.
 */
export function useCommitmentPayments(commitmentId: string | undefined): CommitmentPayment[] {
  return (
    useLiveQuery(
      () =>
        commitmentId
          ? db.commitmentPayments
              .where('commitmentId')
              .equals(commitmentId)
              .filter(p => p.deletedAt === null)
              .sortBy('installmentNumber')
          : [],
      [commitmentId]
    ) ?? []
  );
}

/**
 * Reactively counts active commitments for the current user.
 */
export function useActiveCommitmentsCount(ownerId: string | undefined): number {
  return (
    useLiveQuery(
      () =>
        ownerId
          ? db.financialCommitments
              .where('ownerId')
              .equals(ownerId)
              .filter(c => c.deletedAt === null && c.status === 'ACTIVE')
              .count()
          : 0,
      [ownerId]
    ) ?? 0
  );
}
