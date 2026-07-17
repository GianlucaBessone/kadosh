'use client';

import { WorkspaceQueries } from '@/store/queries/WorkspaceQueries';
import type { FinancialCommitment, CommitmentPayment } from '@/lib/db';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

/**
 * Reactively fetches all non-deleted commitments for the current user.
 * Updates automatically whenever Dexie data changes.
 */
export function useAllCommitments(ownerId: string | undefined): FinancialCommitment[] {
  const commitments = WorkspaceQueries.useCommitments();
  // Filter by deletedAt being null (or not present, if deleted items are removed from state entirely)
  // Assuming our reducers don't keep deleted items, but let's be safe.
  return commitments.filter(c => c.deletedAt === null || c.deletedAt === undefined);
}

/**
 * Reactively fetches all paused commitments for the current user.
 */
export function usePausedCommitments(ownerId: string | undefined): FinancialCommitment[] {
  const commitments = WorkspaceQueries.useCommitments();
  return commitments.filter(c => (c.deletedAt === null || c.deletedAt === undefined) && c.status === 'PAUSED');
}

/**
 * Reactively fetches a single commitment by ID.
 */
export function useCommitment(id: string | undefined): FinancialCommitment | undefined {
  const commitments = WorkspaceQueries.useCommitments();
  return commitments.find(c => c.id === id);
}

/**
 * Reactively fetches all payments for a given commitment.
 */
export function useCommitmentPayments(commitmentId: string | undefined): CommitmentPayment[] {
  return useLiveQuery(
    () => {
      if (!commitmentId) return [];
      return db.commitmentPayments
        .where('commitmentId')
        .equals(commitmentId)
        .filter(p => p.deletedAt === null || p.deletedAt === undefined)
        .toArray();
    },
    [commitmentId],
    []
  );
}

/**
 * Reactively counts active commitments for the current user.
 */
export function useActiveCommitmentsCount(ownerId: string | undefined): number {
  const commitments = WorkspaceQueries.useCommitments();
  return commitments.filter(c => (c.deletedAt === null || c.deletedAt === undefined) && c.status === 'ACTIVE').length;
}
