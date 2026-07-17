import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, guestId, type, subject, description, appVersion, browser, os, language, resolution } = body;

    if ((!userId && !guestId) || !type || !subject || !description) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId || null,
        guestId: guestId || null,
        type,
        subject,
        description,
        appVersion,
        browser,
        os,
        language,
        resolution,
      },
    });

    return NextResponse.json({ success: true, id: ticket.id });
  } catch (error) {
    console.error('Error creando ticket de soporte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
