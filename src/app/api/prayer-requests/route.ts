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
      // Solo peticiones sin workspace (comunitarias)
      where.workspaceId = null;
      
      const uniqueUsers = await prisma.prayerRequest.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      });
      
      return NextResponse.json({ activeCount: uniqueUsers.length });
    }

    if (!userId || userId === 'null' || userId === 'undefined') {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    if (scope === 'mine') {
      const whereCondition: any = { userId };
      // Para peticiones mías en el contexto comunitario, mostrar solo las sin workspace
      whereCondition.workspaceId = null;
      
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
            joinedCount: r.joinedCount,
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
            joinedCount: r.joinedCount,
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
      
      // Mostrar peticiones comunitarias (sin workspace específico)
      whereCondition.workspaceId = null;
      
      const requests = await prisma.prayerRequest.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, lastName: true } },
          interactions: {
            where: { userId },
            select: { id: true, type: true },
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
          joinedCount: r.joinedCount,
          createdAt: r.createdAt.toISOString(),
          expiresAt: r.expiresAt.toISOString(),
          archivedAt: null,
          daysRemaining: getDaysRemaining(r.expiresAt),
          authorDisplayName: displayName,
          authorInitial: initial,
          hasPrayed: r.interactions.some(i => i.type === 'PRAYED'),
          hasJoined: r.interactions.some(i => i.type === 'JOINED'),
        };
      });

      const activeCount = items.length;
      const prayedCount = items.filter(i => i.hasPrayed).length;
      const unaccompaniedCount = items.filter(i => !i.hasJoined).length;
      const accompaniedCount = items.filter(i => i.hasJoined).length;
      const pendingCount = activeCount - prayedCount;

      return NextResponse.json({
        summary: { activeCount, pendingCount, prayedCount, unaccompaniedCount, accompaniedCount },
        pending: items.filter(i => !i.hasPrayed),
        prayed: items.filter(i => i.hasPrayed),
        unaccompanied: items.filter(i => !i.hasJoined),
        accompanied: items.filter(i => i.hasJoined),
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
    const { id, userId, message, name, lastName } = body;


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
          name: name || null,
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
    
    // Idempotency: Si ya existe, retornamos success
    if (id) {
      const existing = await prisma.prayerRequest.findUnique({ where: { id } });
      if (existing) {
        return NextResponse.json({
          success: true,
          alreadyCreated: true,
          id: existing.id,
          expiresAt: existing.expiresAt.toISOString(),
        });
      }
    }

    const request = await prisma.prayerRequest.create({
      data: {
        id: id || undefined,
        userId,
        // Todas las peticiones del módulo son comunitarias por diseño
        workspaceId: null,
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