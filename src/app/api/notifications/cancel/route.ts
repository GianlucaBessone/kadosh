import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { intentId, userHash, commitmentId } = body;

    if (intentId) {
      await prisma.notificationIntent.delete({ where: { id: intentId } }).catch(() => {});
    } else if (userHash && commitmentId) {
      await prisma.notificationIntent.deleteMany({
        where: { userHash, commitmentId },
      });
    } else {
      return NextResponse.json({ error: 'Missing intentId or userHash+commitmentId' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
