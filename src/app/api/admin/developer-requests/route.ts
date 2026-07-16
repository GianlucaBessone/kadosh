import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const requests = await prisma.developerInfoRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching developer requests:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
