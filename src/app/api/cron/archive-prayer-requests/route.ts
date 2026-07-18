import { NextResponse } from 'next/server';
import { archiveExpiredPrayerRequests } from '@/lib/prayerRequests/archiveExpired';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const archivedCount = await archiveExpiredPrayerRequests();
    return NextResponse.json({ success: true, archivedCount });
  } catch (error) {
    console.error('Error archivando peticiones de oración:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
