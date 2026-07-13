import { db, Tithe } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from './syncQueueService';

export class TitheService {
  static async createTithe(data: Omit<Tithe, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const tithe: Tithe = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction('rw', db.tithes, db.syncQueue, async () => {
      await db.tithes.add(tithe);
      await addToSyncQueue('Tithe', id, 'INSERT', tithe);
    });

    return tithe;
  }

  static async updateTithe(id: string, data: Partial<Omit<Tithe, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>) {
    const now = new Date().toISOString();
    const updateData = { ...data, updatedAt: now };

    await db.transaction('rw', db.tithes, db.syncQueue, async () => {
      await db.tithes.update(id, updateData);
      await addToSyncQueue('Tithe', id, 'UPDATE', updateData);
    });
  }

  static async deleteTithe(id: string) {
    const now = new Date().toISOString();
    await db.transaction('rw', db.tithes, db.syncQueue, async () => {
      await db.tithes.update(id, { deletedAt: now, updatedAt: now });
      await addToSyncQueue('Tithe', id, 'DELETE', { deletedAt: now, updatedAt: now });
    });
  }
}
