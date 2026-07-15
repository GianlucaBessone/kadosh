import { db, MotivationalVerse } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class MotivationalVerseService {
  static async getRandomVerse(category: 'AHORRO' | 'DIEZMO'): Promise<{ text: string, reference: string } | null> {
    const useDailyTable = Math.random() > 0.5;
    
    if (useDailyTable) {
      const dailyVerses = await db.dailyVerses.toArray();
      if (dailyVerses.length > 0) {
        const randomDaily = dailyVerses[Math.floor(Math.random() * dailyVerses.length)];
        return {
          text: randomDaily.text,
          reference: `${randomDaily.book} ${randomDaily.chapter}:${randomDaily.verseStart}${randomDaily.verseEnd ? '-' + randomDaily.verseEnd : ''}`
        };
      }
    }

    const verses = await db.motivationalVerses.where('category').equals(category).toArray();
    if (verses.length > 0) {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      return {
        text: randomVerse.text,
        reference: randomVerse.reference
      };
    }
    
    return null;
  }

  /**
   * Sincroniza/Inicializa versículos por defecto si la base está vacía.
   */
  static async seedDefaultVerses() {
    const count = await db.motivationalVerses.count();
    if (count > 0) return;

    const defaultVerses: Omit<MotivationalVerse, 'id' | 'createdAt'>[] = [
      {
        text: 'El que siembra escasamente, escasamente cosechará, y el que siembra en abundancia, en abundancia cosechará.',
        reference: '2 Corintios 9:6',
        category: 'AHORRO'
      },
      {
        text: 'Honra al Señor con tus riquezas y con los primeros frutos de tus cosechas.',
        reference: 'Proverbios 3:9',
        category: 'AHORRO'
      },
      {
        text: 'Traigan íntegro el diezmo para los fondos del templo, y así habrá alimento en mi casa.',
        reference: 'Malaquías 3:10',
        category: 'DIEZMO'
      },
      {
        text: 'Cada uno debe dar según lo que haya decidido en su corazón, no de mala gana ni por obligación.',
        reference: '2 Corintios 9:7',
        category: 'DIEZMO'
      }
    ];

    const now = new Date().toISOString();
    const records: MotivationalVerse[] = defaultVerses.map(v => ({
      ...v,
      id: uuidv4(),
      createdAt: now,
    }));

    await db.motivationalVerses.bulkAdd(records);
  }
}
