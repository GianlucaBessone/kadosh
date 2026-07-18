import prisma from '@/lib/prisma';

/** Archiva peticiones vencidas. Se invoca en cron y de forma lazy al listar. */
export async function archiveExpiredPrayerRequests(): Promise<number> {
  const now = new Date();
  const result = await prisma.prayerRequest.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now },
    },
    data: {
      status: 'ARCHIVED',
      archivedAt: now,
    },
  });
  return result.count;
}
