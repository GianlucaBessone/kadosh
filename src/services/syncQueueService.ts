import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: any
) {
  await db.syncQueue.add({
    id: uuidv4(),
    tableName,
    recordId,
    operation,
    payload,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attempts: 0,
    lastAttempt: null,
  });
}
