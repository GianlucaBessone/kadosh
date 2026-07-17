import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Encuentra las intenciones de notificación que ya pasaron su hora límite (targetTimeUtc <= now) y no se han enviado
    const now = new Date();
    const pendingNotifications = await prisma.notificationIntent.findMany({
      where: {
        sent: false,
        targetTimeUtc: {
          lte: now,
        },
      },
      take: 100, // Batch limit
    });

    if (pendingNotifications.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0 });
    }

    // Group by userHash to optimize OneSignal calls
    const userMessages = pendingNotifications.map((n: any) => ({
      intentId: n.id,
      userHash: n.userHash,
      title: n.title,
      message: n.message,
      commitmentId: n.commitmentId,
    }));

    const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const onesignalApiKey = process.env.ONESIGNAL_API_KEY;

    if (!onesignalAppId || !onesignalApiKey) {
      console.error('Missing OneSignal credentials');
      return NextResponse.json({ error: 'Missing OneSignal credentials' }, { status: 500 });
    }

    let successCount = 0;

    for (const msg of userMessages) {
      const response = await fetch('https://api.onesignal.com/notifications?c=push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${onesignalApiKey}`,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          app_id: onesignalAppId,
          include_aliases: {
            external_id: [msg.userHash]
          },
          target_channel: "push",
          headings: { "en": msg.title, "es": msg.title },
          contents: { "en": msg.message, "es": msg.message },
          ...(msg.commitmentId?.startsWith('dev-info-') && { app_url: '/asistencia' })
        })
      });

      if (response.ok) {
        successCount++;
        // Marcar como sent
        await prisma.notificationIntent.update({
          where: { id: msg.intentId },
          data: { sent: true },
        });
      } else {
        console.error('Failed to send to OneSignal:', await response.text());
      }
    }

    return NextResponse.json({ success: true, sentCount: successCount });
  } catch (error) {
    console.error('Error processing cron notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
