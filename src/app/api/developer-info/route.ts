import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const guestId = searchParams.get('guestId');

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Falta userId o guestId' }, { status: 400 });
    }

    const orConditions = [];
    if (userId) orConditions.push({ userId });
    if (guestId) orConditions.push({ guestId });

    const request = await prisma.developerInfoRequest.findFirst({
      where: {
        OR: orConditions.length > 0 ? orConditions : undefined
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!request) {
      return NextResponse.json({ status: 'IDLE' });
    }

    // Si estaba PENDING pero ya pasó su hora, podríamos pasarlo a NOTIFIED
    // Aquí el cron de notificaciones idealmente también cambiaría este estado, pero
    // por ahora lo manejamos cuando el cliente consulta.
    if (request.status === 'PENDING') {
      // We don't exactly know when it was scheduled to finish here, 
      // but usually the client will just get NOTIFIED when the push arrives.
      // So we just return PENDING.
    }

    return NextResponse.json({ status: request.status });
  } catch (error) {
    console.error('Error fetching developer info request:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, guestId } = body;

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Falta userId o guestId' }, { status: 400 });
    }

    // Obtener configuración
    const configMin = await prisma.appConfig.findUnique({ where: { key: 'developer_reveal_min_minutes' } });
    const configMax = await prisma.appConfig.findUnique({ where: { key: 'developer_reveal_max_minutes' } });

    const min = parseInt(configMin?.value || '5');
    const max = parseInt(configMax?.value || '15');

    const minutesToWait = Math.floor(Math.random() * (max - min + 1) + min);
    
    // Crear la request en DB
    const devRequest = await prisma.developerInfoRequest.create({
      data: {
        userId: userId || null,
        guestId: guestId || null,
        status: 'PENDING',
      },
    });

    // Programar notificación
    const targetTimeUtc = new Date(Date.now() + minutesToWait * 60000);
    
    // Asumimos que el userHash en notification intent coincide con userId de Dexie / Supabase
    // En Kadosh el userHash es a menudo el userId o deviceId. Para notificaciones de sistema 
    // asociadas a un usuario en la nube, es el userId.
    
    await prisma.notificationIntent.create({
      data: {
        userHash: userId || guestId || 'anonymous',
        title: '¡Gracias por tu interés!',
        message: 'Ya puedes conocer al desarrollador de KADOSH.',
        targetTimeUtc,
        commitmentId: `dev-info-${devRequest.id}`,
        sent: false,
      },
    });

    return NextResponse.json({ success: true, id: devRequest.id });
  } catch (error) {
    console.error('Error solicitando info:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, guestId, action } = body;

    if ((!userId && !guestId) || action !== 'MARK_SEEN') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const orConditions = [];
    if (userId) orConditions.push({ userId });
    if (guestId) orConditions.push({ guestId });

    const request = await prisma.developerInfoRequest.findFirst({
      where: {
        OR: orConditions.length > 0 ? orConditions : undefined
      },
      orderBy: { createdAt: 'desc' },
    });

    if (request) {
      await prisma.developerInfoRequest.update({
        where: { id: request.id },
        data: { status: 'SEEN', seenAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
