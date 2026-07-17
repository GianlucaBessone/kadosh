import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const configs = await prisma.appConfig.findMany({
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching config for admin:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const config = await prisma.appConfig.update({
      where: { key },
      data: { value: String(value) },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
