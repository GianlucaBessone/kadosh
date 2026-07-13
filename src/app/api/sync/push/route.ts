import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/features/auth/user';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operations } = await request.json();

    if (!Array.isArray(operations)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Process all operations in a transaction
    await prisma.$transaction(async (tx: any) => {
      for (const op of operations) {
        const { tableName, recordId, operation, payload } = op;
        const model = tx[tableName.charAt(0).toLowerCase() + tableName.slice(1)];
        if (!model) continue;

        try {
          if (operation === 'INSERT') {
            await model.upsert({
              where: { id: recordId },
              create: payload,
              update: payload,
            });
          } else if (operation === 'UPDATE') {
            await model.update({
              where: { id: recordId },
              data: payload,
            });
          } else if (operation === 'DELETE') {
            await model.delete({
              where: { id: recordId },
            });
          }
        } catch (e) {
          console.error(`Error processing operation ${operation} on ${tableName}:`, e);
          // depending on strategy, we could fail the whole transaction or continue
        }
      }
    });

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Push sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
