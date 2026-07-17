import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, guestId } = body;

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Check if user prayed in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orConditions = [];
    if (userId) orConditions.push({ userId });
    if (guestId) orConditions.push({ guestId });

    const recentPrayer = await prisma.prayer.findFirst({
      where: {
        OR: orConditions.length > 0 ? orConditions : undefined,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (recentPrayer) {
      return NextResponse.json({ 
        success: true, 
        alreadyPrayed: true,
        message: 'Ya registramos tu oración en los últimos 30 días. ¡Muchas gracias!' 
      });
    }

    const prayer = await prisma.prayer.create({
      data: {
        userId: userId || null,
        guestId: guestId || null,
      },
    });

    return NextResponse.json({ success: true, id: prayer.id });
  } catch (error) {
    console.error('Error registrando oración:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
