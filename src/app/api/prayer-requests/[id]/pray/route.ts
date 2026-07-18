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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await archiveExpiredPrayerRequests();

    const { id } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const prayerRequest = await prisma.prayerRequest.findUnique({
      where: { id },
    });

    if (!prayerRequest) {
      return NextResponse.json({ error: 'Petición no encontrada' }, { status: 404 });
    }

    if (prayerRequest.status !== 'ACTIVE' || prayerRequest.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'Esta petición ya no está activa' }, { status: 410 });
    }

    if (prayerRequest.userId === userId) {
      return NextResponse.json({ error: 'No puedes orar por tu propia petición' }, { status: 400 });
    }

    const existing = await prisma.prayerInteraction.findUnique({
      where: {
        prayerRequestId_userId: {
          prayerRequestId: id,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyPrayed: true });
    }

    await ensurePrismaUserExists(userId);

    await prisma.$transaction([
      prisma.prayerInteraction.create({
        data: { prayerRequestId: id, userId },
      }),
      prisma.prayerRequest.update({
        where: { id },
        data: { prayerCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, alreadyPrayed: false });
  } catch (error) {
    console.error('Error registrando oración:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
