import { db, Category } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from './syncQueueService';

export class CategoryService {
  static async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const category: Category = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction('rw', db.categories, db.syncQueue, async () => {
      await db.categories.add(category);
      await addToSyncQueue('Category', id, 'INSERT', category);
    });

    return category;
  }

  static async updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>) {
    const now = new Date().toISOString();
    const updateData = { ...data, updatedAt: now };

    await db.transaction('rw', db.categories, db.syncQueue, async () => {
      await db.categories.update(id, updateData);
      await addToSyncQueue('Category', id, 'UPDATE', updateData);
    });
  }

  static async deleteCategory(id: string) {
    const now = new Date().toISOString();
    await db.transaction('rw', db.categories, db.syncQueue, async () => {
      await db.categories.update(id, { deletedAt: now, updatedAt: now });
      await addToSyncQueue('Category', id, 'DELETE', { deletedAt: now, updatedAt: now });
    });
  }
}
