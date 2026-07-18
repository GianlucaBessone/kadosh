import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { archiveExpiredPrayerRequests } from '@/lib/prayerRequests/archiveExpired';
import { addDays, formatDisplayName, getDaysRemaining } from '@/features/oraciones/utils/formatDisplayName';

const MAX_MESSAGE_LENGTH = 500;
const ACTIVE_DAYS = 7;

export async function GET(req: Request) {
  try {
    await archiveExpiredPrayerRequests();

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');
    const userId = searchParams.get('userId');
    const workspaceIdParam = searchParams.get('workspaceId');

    if (scope === 'stats') {
      const where: any = { status: 'ACTIVE', expiresAt: { gt: new Date() } };
      const excludeUserId = searchParams.get('excludeUserId');
      // Solo excluir userId si no es nulo y no es la cadena "null"
      if (excludeUserId && excludeUserId !== 'null' && excludeUserId !== 'undefined') {
        where.userId = { not: excludeUserId };
      }
      // Para stats de comunidad, no aplicar filtro de workspaceId para mostrar peticiones comunitarias
      if (workspaceIdParam && workspaceIdParam !== 'null' && workspaceIdParam !== 'undefined' && workspaceIdParam !== 'COMMUNITY') {
        where.workspaceId = workspaceIdParam;
      } else if (workspaceIdParam === 'COMMUNITY') {
        // Si se solicita el workspace COMMUNITY, mostrar todas excepto las específicas de workspace
        where.workspaceId = null; // Solo peticiones sin workspace (comunitarias)
      }
      const activeCount = await prisma.prayerRequest.count({ where });
      return NextResponse.json({ activeCount });
    }

    if (!userId || userId === 'null' || userId === 'undefined') {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    if (scope === 'mine') {
      const whereCondition: any = { userId };
      // Validar que workspaceIdParam no sea null o "null" antes de usarlo
      if (workspaceIdParam && workspaceIdParam !== 'null' && workspaceIdParam !== 'COMMUNITY') {
        whereCondition.workspaceId = workspaceIdParam;
      } else if (workspaceIdParam === 'COMMUNITY') {
        // Para peticiones mías en el contexto comunitario, mostrar solo las sin workspace
        whereCondition.workspaceId = null;
      }
      
      const requests = await prisma.prayerRequest.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        active: requests
          .filter(r => r.status === 'ACTIVE')
          .map(r => ({
            id: r.id,
            message: r.message,
            status: r.status,
            prayerCount: r.prayerCount,
            createdAt: r.createdAt.toISOString(),
            expiresAt: r.expiresAt.toISOString(),
            archivedAt: null,
            daysRemaining: getDaysRemaining(r.expiresAt),
          })),
        archived: requests
          .filter(r => r.status === 'ARCHIVED')
          .map(r => ({
            id: r.id,
            message: r.message,
            status: r.status,
            prayerCount: r.prayerCount,
            createdAt: r.createdAt.toISOString(),
            expiresAt: r.expiresAt.toISOString(),
            archivedAt: r.archivedAt?.toISOString() ?? r.expiresAt.toISOString(),
            daysRemaining: 0,
          })),
      });
    }

    if (scope === 'community') {
      const whereCondition: any = {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      };
      
      // Validar que userId no sea "null" o "undefined" antes de excluirlo
      if (userId && userId !== 'null' && userId !== 'undefined') {
        whereCondition.userId = { not: userId };
      }
      
      // Para peticiones comunitarias, permitir que se muestren peticiones sin workspace
      // o peticiones de cualquier workspace si no se especifica uno particular
      if (workspaceIdParam && workspaceIdParam !== 'null' && workspaceIdParam !== 'undefined' && workspaceIdParam !== 'COMMUNITY') {
        whereCondition.workspaceId = workspaceIdParam;
      } else if (workspaceIdParam === 'COMMUNITY') {
        // Mostrar peticiones comunitarias (sin workspace específico)
        whereCondition.workspaceId = null;
      }
      // Si no se especifica workspaceId o es COMMUNITY, mostrar todas las peticiones públicas
      
      const requests = await prisma.prayerRequest.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, lastName: true } },
          interactions: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const items = requests.map(r => {
        const { displayName, initial } = formatDisplayName(r.user.name, r.user.lastName);
        return {
          id: r.id,
          message: r.message,
          status: r.status as 'ACTIVE',
          prayerCount: r.prayerCount,
          createdAt: r.createdAt.toISOString(),
          expiresAt: r.expiresAt.toISOString(),
          archivedAt: null,
          daysRemaining: getDaysRemaining(r.expiresAt),
          authorDisplayName: displayName,
          authorInitial: initial,
          hasPrayed: r.interactions.length > 0,
        };
      });

      const activeCount = items.length;
      const prayedCount = items.filter(i => i.hasPrayed).length;
      const pendingCount = activeCount - prayedCount;

      return NextResponse.json({
        summary: { activeCount, pendingCount, prayedCount },
        pending: items.filter(i => !i.hasPrayed),
        prayed: items.filter(i => i.hasPrayed),
      });
    }

    return NextResponse.json({ error: 'scope inválido' }, { status: 400 });
  } catch (error) {
    console.error('Error listando peticiones de oración:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, workspaceId, message, name, lastName } = body;

    if (!userId || !message?.trim()) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const trimmed = message.trim();
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `guest-${userId}@local.kadosh`,
          name: name || 'Usuario',
          lastName: lastName || null,
        },
      });
    } else {
      const trimmedName = name?.trim();
      const trimmedLastName = lastName?.trim();
      const isPlaceholderName = !user.name || user.name.trim() === '' || user.name === 'Usuario';

      if (trimmedName && isPlaceholderName) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            name: trimmedName,
            lastName: trimmedLastName || user.lastName,
          },
        });
      } else if (trimmedLastName && !user.lastName) {
        await prisma.user.update({
          where: { id: userId },
          data: { lastName: trimmedLastName },
        });
      }
    }

    const now = new Date();
    const request = await prisma.prayerRequest.create({
      data: {
        userId,
        // Para peticiones comunitarias, establecer workspaceId como null
        workspaceId: workspaceId === 'COMMUNITY' ? null : (workspaceId || null),
        message: trimmed,
        status: 'ACTIVE',
        prayerCount: 0,
        expiresAt: addDays(now, ACTIVE_DAYS),
      },
    });

    return NextResponse.json({
      success: true,
      id: request.id,
      expiresAt: request.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creando petición de oración:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}