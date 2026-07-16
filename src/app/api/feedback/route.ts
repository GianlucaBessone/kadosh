import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, guestId, type, npsScore, bestPart, improvement, comment } = body;

    if ((!userId && !guestId) || !type) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: userId || null,
        guestId: guestId || null,
        type,
        npsScore,
        bestPart,
        improvement,
        comment,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    console.error('Error creando feedback:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
