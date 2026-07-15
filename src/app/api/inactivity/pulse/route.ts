import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userHash, hasActivity } = body;

    if (!userHash) {
      return NextResponse.json({ error: 'Missing userHash' }, { status: 400 });
    }

    const tracker = await prisma.inactivityTracker.upsert({
      where: { userHash },
      update: {
        lastPulseAt: new Date(),
        // If there is activity, reset accumulated days to 0. 
        // If there's no activity, we just record the pulse but the cron will increment the days.
        ...(hasActivity ? { accumulatedDays: 0 } : {}),
      },
      create: {
        userHash,
        accumulatedDays: 0,
        lastPulseAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, tracker });
  } catch (error) {
    console.error('Pulse Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
