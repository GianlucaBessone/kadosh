import { db, Account } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from './syncQueueService';

export class AccountService {
  static async createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const account: Account = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction('rw', db.accounts, db.syncQueue, async () => {
      await db.accounts.add(account);
      await addToSyncQueue('Account', id, 'INSERT', account);
    });

    return account;
  }

  static async updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>) {
    const now = new Date().toISOString();
    const updateData = { ...data, updatedAt: now };

    await db.transaction('rw', db.accounts, db.syncQueue, async () => {
      await db.accounts.update(id, updateData);
      await addToSyncQueue('Account', id, 'UPDATE', updateData);
    });
  }

  static async deleteAccount(id: string) {
    const now = new Date().toISOString();
    await db.transaction('rw', db.accounts, db.syncQueue, async () => {
      await db.accounts.update(id, { deletedAt: now, updatedAt: now });
      await addToSyncQueue('Account', id, 'DELETE', { deletedAt: now, updatedAt: now });
    });
  }
}
