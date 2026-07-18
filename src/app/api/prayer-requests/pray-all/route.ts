import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { archiveExpiredPrayerRequests } from '@/lib/prayerRequests/archiveExpired';

async function ensurePrismaUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: userId,
        email: `guest-${userId}@local.kadosh`,
        name: 'Usuario',
        lastName: null,
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    await archiveExpiredPrayerRequests();

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const now = new Date();
    await ensurePrismaUserExists(userId);

    const activeRequests = await prisma.prayerRequest.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
        userId: { not: userId },
        NOT: {
          interactions: { some: { userId } },
        },
      },
      select: { id: true },
    });

    if (activeRequests.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    await prisma.$transaction(
      activeRequests.flatMap(r => [
        prisma.prayerInteraction.create({
          data: { prayerRequestId: r.id, userId },
        }),
        prisma.prayerRequest.update({
          where: { id: r.id },
          data: { prayerCount: { increment: 1 } },
        }),
      ])
    );

    return NextResponse.json({ success: true, count: activeRequests.length });
  } catch (error) {
    console.error('Error en orar por todos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
