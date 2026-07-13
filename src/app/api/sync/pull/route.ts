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

    // Fetch changes for all user-related tables
    const filter = dateFilter ? { updatedAt: dateFilter, userId: user.id } : { userId: user.id };
    
    // Note: some tables like SeedContributions depend on SeedGoal, not userId directly.
    const seedGoals = await prisma.seedGoal.findMany({ where: filter });
    const seedGoalIds = seedGoals.map(g => g.id);
    
    const [
      accounts,
      categories,
      transactions,
      seedContributions,
      tithes,
      settings,
      notifications
    ] = await Promise.all([
      prisma.account.findMany({ where: filter }),
      prisma.category.findMany({ where: filter }),
      prisma.transaction.findMany({ where: filter }),
      prisma.seedContribution.findMany({
        where: dateFilter ? {
          updatedAt: dateFilter,
          seedGoal: { userId: user.id }
        } : { seedGoal: { userId: user.id } }
      }),
      prisma.tithe.findMany({ where: filter }),
      prisma.settings.findMany({ where: dateFilter ? { updatedAt: dateFilter, userId: user.id } : { userId: user.id } }),
      prisma.notification.findMany({ where: filter }),
    ]);

    return NextResponse.json({
      serverTimestamp,
      accounts,
      categories,
      transactions,
      seedGoals,
      seedContributions,
      tithes,
      settings,
      notifications
    });

  } catch (error) {
    console.error('Pull sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
