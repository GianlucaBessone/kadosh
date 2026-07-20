import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationDispatcher } from '@/lib/notifications/NotificationDispatcher';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const prayerRequest = await prisma.prayerRequest.findUnique({
      where: { id },
      include: {
        interactions: {
          where: { type: 'JOINED' },
          select: { userId: true },
        },
      },
    });

    if (!prayerRequest) {
      return NextResponse.json({ error: 'Petición no encontrada' }, { status: 404 });
    }

    if (prayerRequest.userId !== userId) {
      return NextResponse.json({ error: 'No tienes permiso para cancelar esta petición' }, { status: 403 });
    }

    if (prayerRequest.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'La petición ya se encuentra cancelada' }, { status: 400 });
    }

    await prisma.prayerRequest.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
    });

    const joinedUserIds = prayerRequest.interactions.map(i => i.userId);
    if (joinedUserIds.length > 0) {
      await NotificationDispatcher.dispatchPrayerCancelled(joinedUserIds, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelando petición:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
