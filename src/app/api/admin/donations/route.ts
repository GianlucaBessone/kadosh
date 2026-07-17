import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: donations });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
