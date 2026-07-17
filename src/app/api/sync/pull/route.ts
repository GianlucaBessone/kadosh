import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/features/auth/user';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lastSyncAt = searchParams.get('lastSyncAt');

    const serverTimestamp = new Date().toISOString();
    const dateFilter = lastSyncAt ? { gt: new Date(lastSyncAt) } : undefined;

    // 1. Obtener Workspaces a los que pertenece el usuario
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true }
    });
    const workspaceIds = userWorkspaces.map(w => w.workspaceId);

    // 2. Obtener Eventos y Snapshots de los Workspaces
    // TODO: En producción, usar lastSequence por Workspace en lugar de lastSyncAt global.
    const [
      workspaceEvents,
      workspaceSnapshots,
      workspaceKeys,
      deviceWorkspaceKeys
    ] = await Promise.all([
      prisma.workspaceEvent.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        orderBy: { sequence: 'asc' }
      }),
      prisma.workspaceSnapshot.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          ...(dateFilter ? { createdAt: dateFilter } : {})
        }
      }),
      prisma.workspaceKey.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          ...(dateFilter ? { createdAt: dateFilter } : {})
        }
      }),
      // Solo llaves envueltas para mis dispositivos
      prisma.deviceWorkspaceKey.findMany({
        where: {
          device: { userId: user.id },
          ...(dateFilter ? { createdAt: dateFilter } : {})
        }
      })
    ]);

    // 3. Obtener metadatos no cifrados (Configuraciones, Notificaciones, etc.)
    const nonFinancialFilter = dateFilter ? { updatedAt: dateFilter, userId: user.id } : { userId: user.id };
    const [
      settings,
      notifications
    ] = await Promise.all([
      prisma.settings.findMany({ where: nonFinancialFilter }),
      prisma.notification.findMany({ where: nonFinancialFilter }),
    ]);

    return NextResponse.json({
      serverTimestamp,
      workspaceEvents,
      workspaceSnapshots,
      workspaceKeys,
      deviceWorkspaceKeys,
      settings,
      notifications
    });

  } catch (error) {
    console.error('Pull sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
