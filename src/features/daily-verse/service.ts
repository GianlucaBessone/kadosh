import { db, DailyVerse, VerseCategory } from '@/lib/db';
import { getSeedVerses } from './data/seedVerses';

export class DailyVerseService {
  /**
   * Inicializa la base de datos de versículos si está vacía.
   */
  static async initializeDatabase() {
    try {
      const count = await db.dailyVerses.count();
      if (count === 0) {
        console.log('Inicializando versículos diarios (Offline First)...');
        const verses = getSeedVerses();
        // Dividir en chunks para no saturar Dexie si son muchos
        const chunkSize = 50;
        for (let i = 0; i < verses.length; i += chunkSize) {
          const chunk = verses.slice(i, i + chunkSize);
          await db.dailyVerses.bulkAdd(chunk as DailyVerse[]);
        }
        console.log('Versículos inicializados correctamente.');
      }
    } catch (error) {
      console.error('Error inicializando DailyVerses:', error);
    }
  }

  /**
   * Obtiene el versículo correspondiente al día actual del año (1-365).
   */
  static async getVerseOfTheDay(): Promise<DailyVerse | null> {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay); // 1-365

    let verse;
    try {
      verse = await db.dailyVerses.where('dayOfYear').equals(dayOfYear).first();
      
      // Si por alguna razón no hay versículo para ese día (ej. año bisiesto día 366), devolver el 1
      if (!verse) {
         verse = await db.dailyVerses.where('dayOfYear').equals(1).first();
      }
    } catch (error) {
      console.warn('Error reading from dailyVerses DB, using in-memory fallback:', error);
    }
    
    if (!verse) {
      // Fallback in case the DB is empty (e.g. QuotaExceededError during initialization)
      const verses = getSeedVerses();
      verse = verses.find(v => v.dayOfYear === dayOfYear) || verses[0];
    }
    
    return verse as DailyVerse | null;
  }
}
