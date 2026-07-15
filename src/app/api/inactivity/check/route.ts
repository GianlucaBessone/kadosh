import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as OneSignal from '@onesignal/node-onesignal';

// Initialize OneSignal
const configuration = OneSignal.createConfiguration({
  restApiKey: process.env.ONESIGNAL_REST_API_KEY || '',
});
const client = new OneSignal.DefaultApi(configuration);
const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

export async function GET(req: Request) {
  // Optional: Add authorization header check for Vercel Cron
  // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const trackers = await prisma.inactivityTracker.findMany();
    let notificationsSent = 0;

    for (const tracker of trackers) {
      // Increment days
      const newDays = tracker.accumulatedDays + 1;

      if (newDays >= 7) {
        // Send notification
        try {
          const notification = new OneSignal.Notification();
          notification.app_id = APP_ID;
          notification.include_aliases = {
            external_id: [tracker.userHash],
          };
          notification.target_channel = 'push';
          notification.headings = {
            en: '¡Te extrañamos en KADOSH!',
            es: '¡Te extrañamos en KADOSH!',
          };
          notification.contents = {
            en: 'Hace unos días no registras movimientos. Recuerda que la constancia trae paz financiera.',
            es: 'Hace unos días no registras movimientos. Recuerda que la constancia trae paz financiera.',
          };

          await client.createNotification(notification);
          notificationsSent++;
        } catch (error) {
          console.error(`Failed to send inactivity notification for ${tracker.userHash}:`, error);
        }

        // Reset days after sending to avoid daily spam
        await prisma.inactivityTracker.update({
          where: { id: tracker.id },
          data: { accumulatedDays: 0 },
        });
      } else {
        // Just update days
        await prisma.inactivityTracker.update({
          where: { id: tracker.id },
          data: { accumulatedDays: newDays },
        });
      }
    }

    return NextResponse.json({ success: true, processed: trackers.length, notificationsSent });
  } catch (error) {
    console.error('Inactivity check error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
