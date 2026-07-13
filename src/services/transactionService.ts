import { db, Transaction, Account } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from './syncQueueService';

export class TransactionService {
  static async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction('rw', db.transactions, db.accounts, db.syncQueue, async () => {
      // 1. Insert Transaction
      await db.transactions.add(transaction);
      await addToSyncQueue('Transaction', id, 'INSERT', transaction);

      // 2. Update Account Balance
      const account = await db.accounts.get(data.accountId);
      if (account) {
        const balanceChange = data.type === 'INCOME' ? data.amount : (data.type === 'EXPENSE' ? -data.amount : 0);
        if (balanceChange !== 0) {
          const newBalance = account.balance + balanceChange;
          await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
          await addToSyncQueue('Account', account.id, 'UPDATE', { balance: newBalance, updatedAt: now });
        }
      }
    });

    return transaction;
  }

  static async updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>) {
    const now = new Date().toISOString();
    const updateData = { ...data, updatedAt: now };

    await db.transaction('rw', db.transactions, db.accounts, db.syncQueue, async () => {
      const original = await db.transactions.get(id);
      if (!original) throw new Error('Transaction not found');

      // Revert old balance
      const oldAccount = await db.accounts.get(original.accountId);
      if (oldAccount) {
        const oldBalanceChange = original.type === 'INCOME' ? original.amount : (original.type === 'EXPENSE' ? -original.amount : 0);
        if (oldBalanceChange !== 0) {
          await db.accounts.update(oldAccount.id, { balance: oldAccount.balance - oldBalanceChange, updatedAt: now });
        }
      }

      // Apply new balance
      const newAccountId = data.accountId || original.accountId;
      const newType = data.type || original.type;
      const newAmount = data.amount !== undefined ? data.amount : original.amount;
      
      const newAccount = await db.accounts.get(newAccountId);
      if (newAccount) {
        // Wait, I should really use a separate balance re-calc or fetch it after reversing.
        // Actually, for simplicity let's just do it sequentially.
        const currentBalance = oldAccount?.id === newAccount.id ? (oldAccount.balance - (original.type === 'INCOME' ? original.amount : (original.type === 'EXPENSE' ? -original.amount : 0))) : newAccount.balance;
        const newBalanceChange = newType === 'INCOME' ? newAmount : (newType === 'EXPENSE' ? -newAmount : 0);
        const finalBalance = currentBalance + newBalanceChange;

        await db.accounts.update(newAccount.id, { balance: finalBalance, updatedAt: now });
        await addToSyncQueue('Account', newAccount.id, 'UPDATE', { balance: finalBalance, updatedAt: now });
      }

      await db.transactions.update(id, updateData);
      await addToSyncQueue('Transaction', id, 'UPDATE', updateData);
    });
  }

  static async deleteTransaction(id: string) {
    const now = new Date().toISOString();
    await db.transaction('rw', db.transactions, db.accounts, db.syncQueue, async () => {
      const original = await db.transactions.get(id);
      if (!original) return;

      // Revert balance
      const account = await db.accounts.get(original.accountId);
      if (account) {
        const balanceChange = original.type === 'INCOME' ? original.amount : (original.type === 'EXPENSE' ? -original.amount : 0);
        if (balanceChange !== 0) {
          const newBalance = account.balance - balanceChange;
          await db.accounts.update(account.id, { balance: newBalance, updatedAt: now });
          await addToSyncQueue('Account', account.id, 'UPDATE', { balance: newBalance, updatedAt: now });
        }
      }

      await db.transactions.update(id, { deletedAt: now, updatedAt: now });
      await addToSyncQueue('Transaction', id, 'DELETE', { deletedAt: now, updatedAt: now });
    });
  }
}
