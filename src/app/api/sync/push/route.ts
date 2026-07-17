import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/features/auth/user';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (events.length === 0) {
      return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    }

    // 1. Obtener los Workspaces a los que pertenece el usuario
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true }
    });
    const validWorkspaceIds = new Set(userWorkspaces.map(w => w.workspaceId));

    // 2. Procesar e insertar los eventos de forma transaccional
    await prisma.$transaction(async (tx) => {
      for (const event of events) {
        // Validar membresía del Workspace
        if (!validWorkspaceIds.has(event.workspaceId)) {
          throw new Error(`Unauthorized access to workspace ${event.workspaceId}`);
        }

        // Insertar (o ignorar si ya existe gracias a idempotencia, usando upsert)
        await tx.workspaceEvent.upsert({
          where: { id: event.id },
          create: {
            id: event.id,
            workspaceId: event.workspaceId,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventType: event.eventType,
            sequence: event.sequence,
            encryptedPayload: event.encryptedPayload,
            schemaVersion: event.schemaVersion || "1.0",
            encryptionVersion: event.encryptionVersion || "v1",
            ownerUserId: event.ownerUserId,
            deviceId: event.deviceId || null,
            keyId: event.keyId,
            createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
          },
          update: {
            // El Event Store es inmutable, por lo que las actualizaciones sobre eventos existentes
            // normalmente son ignoradas, o solo actualizan metadatos si fuera necesario.
          }
        });
      }
    });

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Push sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
