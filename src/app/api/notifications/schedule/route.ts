import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userHash, title, message, targetTimeUtc, commitmentId } = body;

    if (!userHash || !title || !message || !targetTimeUtc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try to find existing intent by userHash and commitmentId
    if (commitmentId) {
      const existing = await prisma.notificationIntent.findFirst({
        where: { userHash, commitmentId },
      });

      if (existing) {
        const updated = await prisma.notificationIntent.update({
          where: { id: existing.id },
          data: { title, message, targetTimeUtc: new Date(targetTimeUtc), sent: false },
        });
        return NextResponse.json({ success: true, id: updated.id });
      }
    }

    const created = await prisma.notificationIntent.create({
      data: {
        userHash,
        title,
        message,
        targetTimeUtc: new Date(targetTimeUtc),
        commitmentId,
        sent: false,
      },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
