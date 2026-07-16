import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      activeUsers30d,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      totalTransactions,
      totalAmount,
      totalBudgets, // No tenemos presupuestos en schema, pero supongamos seedGoals?
      totalSeeds,
      totalExpenses,
      totalIncomes,
      totalDonations,
      donationsAmount,
      devRequests,
      totalPrayers,
      totalFeedback,
      totalBugs,
      totalFeatures,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.inactivityTracker.count({ where: { lastPulseAt: { gte: todayStart } } }), // aprox activos hoy
      prisma.inactivityTracker.count({ where: { lastPulseAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.category.count(), // Reemplazo temporal para presupuestos
      prisma.seedGoal.count(),
      prisma.transaction.count({ where: { type: 'EXPENSE' } }),
      prisma.transaction.count({ where: { type: 'INCOME' } }),
      prisma.donation.count(),
      prisma.donation.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
      prisma.developerInfoRequest.count(),
      prisma.prayer.count(),
      prisma.feedback.count(),
      prisma.supportTicket.count({ where: { type: 'BUG' } }),
      prisma.supportTicket.count({ where: { type: 'FEATURE' } }),
    ]);

    const feedbacksWithNps = await prisma.feedback.findMany({
      where: { type: 'NPS', npsScore: { not: null } },
      select: { npsScore: true }
    });

    let npsPromedio = 0;
    if (feedbacksWithNps.length > 0) {
      const sum = feedbacksWithNps.reduce((acc, curr) => acc + (curr.npsScore || 0), 0);
      npsPromedio = sum / feedbacksWithNps.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalUsers, activeToday: activeUsers, active30d: activeUsers30d, newToday: newUsersToday, newWeek: newUsersWeek, newMonth: newUsersMonth },
        transactions: { total: totalTransactions, sum: totalAmount._sum.amount || 0, expenses: totalExpenses, incomes: totalIncomes },
        modules: { budgets: totalBudgets, seeds: totalSeeds },
        support: { devRequests, prayers: totalPrayers, feedback: totalFeedback, bugs: totalBugs, features: totalFeatures },
        donations: { total: totalDonations, amount: donationsAmount._sum.amount || 0 },
        nps: { average: npsPromedio.toFixed(1) }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
