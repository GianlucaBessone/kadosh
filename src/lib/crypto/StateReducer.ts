import { db, CommitmentStatus } from '@/lib/db';
import { ProjectionIdempotencyError, ProjectionReducerError } from './ProjectionErrors';

export interface ParsedEvent {
  id: string;
  workspaceId: string;
  eventType: string;
  timestamp: number;
  sequence: number;
  payloadChecksum: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export class StateReducer {
  static async reduceAndPersist(workspaceId: string, events: ParsedEvent[], maxSequence: number): Promise<void> {
    if (events.length === 0) return;

    // Ordenar los eventos por timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

    const CHECKPOINT_VERSION = '1.0.0';

    await db.transaction('rw', [
      db.accounts, db.categories, db.transactions, 
      db.seedGoals, db.seedContributions, db.tithes, db.financialCommitments, db.commitmentPayments,
      db.processedProjectionEvents, db.projectionState,
      db.projectionDeadLetters, db.projectionMetrics, db.projectionCheckpoints
    ], async () => {
      
      let processed = 0;
      let dlqCount = 0;
      let corrupted = 0;

      for (const event of sortedEvents) {
        const { eventType, payload, workspaceId, timestamp, sequence, payloadChecksum } = event;
        const now = new Date(timestamp).toISOString();

        // Idempotency Check: Event Journaling & Checksum
        const existingJournal = await db.processedProjectionEvents.get(event.id);
        if (existingJournal) {
          if (existingJournal.payloadChecksum !== payloadChecksum) {
            corrupted++;
            throw new ProjectionIdempotencyError(event.id);
          }
          continue; // Event already processed and checksum matches, skip to guarantee idempotency
        }

        const isCritical = !['CategoryCreated', 'CategoryDeleted', 'SettingsUpdated'].includes(eventType);

        try {
          switch (eventType) {
            // ─── Accounts ───
            case 'AccountCreated':
              await db.accounts.put({
                id: payload.accountId,
                workspaceId,
                name: payload.name,
                balance: payload.initialBalance || 0,
                createdAt: now,
                updatedAt: now,
                deletedAt: null
              });
              break;
            case 'AccountUpdated': {
              const acc = await db.accounts.get(payload.accountId);
              if (acc) {
                await db.accounts.put({ ...acc, ...payload, id: acc.id, workspaceId, updatedAt: now });
              }
              break;
            }
            case 'AccountDeleted':
              await db.accounts.update(payload.accountId, { deletedAt: now });
              break;

            // ─── Categories ───
            case 'CategoryCreated':
              await db.categories.put({
                id: payload.categoryId,
                workspaceId,
                name: payload.name,
                type: payload.type,
                icon: payload.icon || null,
                color: payload.color || null,
                createdAt: now,
                updatedAt: now,
                deletedAt: null
              });
              break;
            case 'CategoryDeleted':
              await db.categories.update(payload.categoryId, { deletedAt: now });
              break;

            // ─── Transactions ───
            case 'TransactionCreated': {
              await db.transactions.put({
                id: payload.transactionId,
                workspaceId,
                accountId: payload.accountId,
                categoryId: payload.categoryId || null,
                type: payload.type,
                amount: payload.amount,
                date: payload.date || now,
                notes: payload.description || null,
                createdAt: now,
                updatedAt: now,
                deletedAt: null
              });

              // Update Account Balance
              const acc = await db.accounts.get(payload.accountId);
              if (acc) {
                if (payload.type === 'INCOME') acc.balance += payload.amount;
                if (payload.type === 'EXPENSE') acc.balance -= payload.amount;
                if (payload.type === 'TRANSFER') {
                  acc.balance -= payload.amount;
                  const targetAcc = payload.transferAccountId ? await db.accounts.get(payload.transferAccountId) : null;
                  if (targetAcc) {
                    targetAcc.balance += payload.amount;
                    await db.accounts.put(targetAcc);
                  }
                }
                await db.accounts.put(acc);
              }
              break;
            }
            case 'TransactionUpdated': {
              const oldTx = await db.transactions.get(payload.transactionId);
              if (!oldTx) break;

              // Revert old impact
              const acc1 = await db.accounts.get(oldTx.accountId);
              if (acc1) {
                if (oldTx.type === 'INCOME') acc1.balance -= oldTx.amount;
                if (oldTx.type === 'EXPENSE') acc1.balance += oldTx.amount;
                if (oldTx.type === 'TRANSFER') {
                  acc1.balance += oldTx.amount;
                  // Handle target transfer reversion if exists (simplified, normally requires old transfer info)
                }
                await db.accounts.put(acc1);
              }

              // Apply new tx
              await db.transactions.put({
                ...oldTx,
                accountId: payload.accountId || oldTx.accountId,
                categoryId: payload.categoryId !== undefined ? payload.categoryId : oldTx.categoryId,
                type: payload.type || oldTx.type,
                amount: payload.amount !== undefined ? payload.amount : oldTx.amount,
                date: payload.date || oldTx.date,
                notes: payload.description !== undefined ? payload.description : oldTx.notes,
                updatedAt: now
              });

              // Apply new impact
              const newTx = await db.transactions.get(payload.transactionId);
              if (newTx) {
                const acc2 = await db.accounts.get(newTx.accountId);
                if (acc2) {
                  if (newTx.type === 'INCOME') acc2.balance += newTx.amount;
                  if (newTx.type === 'EXPENSE') acc2.balance -= newTx.amount;
                  if (newTx.type === 'TRANSFER') {
                    acc2.balance -= newTx.amount;
                  }
                  await db.accounts.put(acc2);
                }
              }
              break;
            }
            case 'TransactionDeleted': {
              const tx = await db.transactions.get(payload.transactionId);
              if (tx) {
                await db.transactions.update(tx.id, { deletedAt: now });
                const acc = await db.accounts.get(tx.accountId);
                if (acc) {
                  if (tx.type === 'INCOME') acc.balance -= tx.amount;
                  if (tx.type === 'EXPENSE') acc.balance += tx.amount;
                  if (tx.type === 'TRANSFER') acc.balance += tx.amount;
                  await db.accounts.put(acc);
                }
              }
              break;
            }

            // ─── Seed Goals ───
            case 'SeedGoalCreated':
              await db.seedGoals.put({
                id: payload.seedId,
                workspaceId,
                name: payload.name,
                targetAmount: payload.targetAmount,
                currentAmount: 0,
                targetDate: payload.date || null,
                status: 'ACTIVE',
                createdAt: now,
                updatedAt: now,
                deletedAt: null
              });
              break;
            case 'SeedGoalDeleted':
              await db.seedGoals.update(payload.seedId, { 
                status: 'HARVESTED',
                updatedAt: now 
              });
              break;
            case 'SeedDeleted':
              await db.seedGoals.update(payload.seedId, { deletedAt: now });
              break;

            case 'SeedWatered': {
              const goal = await db.seedGoals.get(payload.seedId);
              if (goal) {
                await db.seedGoals.update(payload.seedId, { 
                  currentAmount: goal.currentAmount + payload.amount,
                  updatedAt: now 
                });
                await db.seedContributions.put({
                  id: payload.contributionId,
                  seedGoalId: payload.seedId,
                  amount: payload.amount,
                  date: payload.date || now,
                  notes: payload.notes || null,
                  createdAt: now,
                  updatedAt: now,
                  deletedAt: null
                });
              }
              break;
            }

            case 'SeedWithdrawn': {
              const goal = await db.seedGoals.get(payload.seedId);
              if (goal) {
                await db.seedGoals.update(payload.seedId, { 
                  currentAmount: Math.max(0, goal.currentAmount - payload.amount),
                  updatedAt: now 
                });
                await db.seedContributions.put({
                  id: payload.withdrawalId,
                  seedGoalId: payload.seedId,
                  amount: -Math.abs(payload.amount),
                  date: payload.date || now,
                  notes: payload.notes || null,
                  createdAt: now,
                  updatedAt: now,
                  deletedAt: null
                });
              }
              break;
            }

            // ─── Tithes ───
            case 'TitheRegistered':
              await db.tithes.put({
                id: payload.titheId,
                workspaceId,
                amount: payload.amount,
                date: payload.date || now,
                month: payload.month,
                year: payload.year,
                notes: payload.notes || null,
                createdAt: now,
                updatedAt: now,
                deletedAt: null
              });
              break;
              
            case 'CommitmentCreated':
              await db.financialCommitments.put({
                id: payload.commitmentId,
                ownerId: workspaceId,
                name: payload.name,
                amount: payload.amount,
                installmentAmount: payload.installmentAmount,
                type: payload.type,
                periodicity: payload.periodicity,
                status: CommitmentStatus.ACTIVE,
                firstDueDate: payload.firstDueDate,
                endDate: payload.endDate,
                notes: payload.notes,
                isRecurring: payload.isRecurring,
                installments: payload.installments,
                currentInstallment: payload.currentInstallment || 0,
                customPeriodicityDays: payload.customPeriodicityDays,
                dayOfMonth: payload.dayOfMonth,
                biweeklyPeriod: payload.biweeklyPeriod,
                amountTotal: payload.amountTotal,
                remainingAmount: payload.amountTotal,
                categoryId: payload.categoryId,
                description: payload.description,
                createdAt: now,
                updatedAt: now,
                deletedAt: null
              });
              break;

            case 'CommitmentUpdated': {
              const commitment = await db.financialCommitments.get(payload.commitmentId);
              if (commitment) {
                await db.financialCommitments.update(payload.commitmentId, {
                  ...payload.changes,
                  updatedAt: now
                });
              }
              break;
            }

            case 'CommitmentDeleted':
              await db.financialCommitments.update(payload.commitmentId, { deletedAt: now });
              break;

            case 'CommitmentPaid': {
              await db.commitmentPayments.put({
                id: payload.paymentId,
                commitmentId: payload.commitmentId,
                transactionId: payload.transactionId,
                amount: payload.amount,
                installmentNumber: payload.installmentNumber || 0,
                date: payload.date,
                status: 'PAID',
                createdAt: now,
                updatedAt: now,
                deletedAt: null
              });
              const commitment = await db.financialCommitments.get(payload.commitmentId);
              if (commitment) {
                const current = commitment.currentInstallment || 0;
                const prevRemaining = commitment.remainingAmount !== undefined && commitment.remainingAmount !== null 
                                      ? commitment.remainingAmount 
                                      : (commitment.amountTotal || 0);
                const newRemaining = Math.max(0, prevRemaining - payload.amount);
                
                await db.financialCommitments.update(payload.commitmentId, {
                  currentInstallment: current + 1,
                  remainingAmount: newRemaining,
                  updatedAt: now
                });
              }
              break;
            }

            case 'PaymentDeleted': {
              const payment = await db.commitmentPayments.get(payload.paymentId);
              if (payment) {
                await db.commitmentPayments.update(payload.paymentId, {
                  deletedAt: now
                });
                
                const commitment = await db.financialCommitments.get(payload.commitmentId);
                if (commitment) {
                  const current = commitment.currentInstallment || 0;
                  const prevRemaining = commitment.remainingAmount !== undefined && commitment.remainingAmount !== null 
                                        ? commitment.remainingAmount 
                                        : (commitment.amountTotal || 0);
                  const newRemaining = prevRemaining + payment.amount;
                  
                  await db.financialCommitments.update(payload.commitmentId, {
                    currentInstallment: Math.max(0, current - 1),
                    remainingAmount: newRemaining,
                    updatedAt: now
                  });
                }
              }
              break;
            }

            default:
              console.warn(`Evento no reconocido por el Reducer: ${eventType}`);
          }

          // Mark event as processed
          await db.processedProjectionEvents.put({
            eventId: event.id,
            workspaceId,
            sequence,
            payloadChecksum,
            checkpointVersion: CHECKPOINT_VERSION,
            projectedAt: new Date().toISOString()
          });
          processed++;

        } catch (error: any) {
          if (isCritical) {
            // Abort entire transaction, rollback Dexie
            throw new ProjectionReducerError(event.id, error, true);
          } else {
            // Quarantine non-critical event
            await db.projectionDeadLetters.put({
              eventId: event.id,
              workspaceId,
              sequence,
              eventType,
              errorType: error.name || 'Unknown',
              errorMessage: error.message || String(error),
              stack: error.stack || null,
              retries: 0,
              firstFailure: new Date().toISOString(),
              lastFailure: new Date().toISOString(),
              status: 'QUARANTINED'
            });
            dlqCount++;
          }
        }
      }

      // Final atomic commit for projection cursor and checkpoint
      const updateAtStr = new Date().toISOString();
      await db.projectionState.put({
        workspaceId,
        lastProjectedSequence: maxSequence,
        updatedAt: updateAtStr
      });

      await db.projectionCheckpoints.put({
        workspaceId,
        lastSequence: maxSequence,
        checkpointVersion: CHECKPOINT_VERSION,
        createdAt: updateAtStr
      });

      // Update Metrics
      const metrics = await db.projectionMetrics.get(workspaceId) || {
        workspaceId, processedCount: 0, corruptedCount: 0, dlqCount: 0, avgProcessingTimeMs: 0, updatedAt: updateAtStr
      };
      metrics.processedCount += processed;
      metrics.dlqCount += dlqCount;
      metrics.corruptedCount += corrupted;
      metrics.updatedAt = updateAtStr;
      await db.projectionMetrics.put(metrics);
    });
  }
}
