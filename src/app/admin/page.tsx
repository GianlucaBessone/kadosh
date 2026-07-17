'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, TrendingUp, HandCoins, MessageSquare, Bug } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Loader2 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface DashboardData {
  users: { total: number; activeToday: number; active30d: number; newToday: number; newWeek: number; newMonth: number };
  transactions: { total: number; sum: number; expenses: number; incomes: number };
  modules: { budgets: number; seeds: number };
  support: { devRequests: number; prayers: number; feedback: number; bugs: number; features: number };
  donations: { total: number; amount: number };
  nps: { average: string };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return <div>Error al cargar datos del dashboard</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Resumen general de la plataforma</p>
      </div>

      <div className="space-y-6">
        {/* Sección Usuarios */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Usuarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <MetricCard title="Usuarios Registrados" value={data.users.total} icon={Users} variant="primary" />
            <MetricCard title="Nuevos Hoy" value={data.users.newToday} icon={TrendingUp} variant="success" />
            <MetricCard title="Nuevos esta semana" value={data.users.newWeek} icon={TrendingUp} />
            <MetricCard title="Activos 30 días" value={data.users.active30d} icon={Activity} />
          </div>
        </div>

        {/* Sección Financiera */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-500" />
            Finanzas & Módulos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <MetricCard title="Movimientos" value={data.transactions.total} icon={Activity} />
            <MetricCard title="Gastos Registrados" value={data.transactions.expenses} icon={TrendingUp} variant="destructive" />
            <MetricCard title="Ingresos Registrados" value={data.transactions.incomes} icon={TrendingUp} variant="success" />
            <MetricCard title="Metas de Semilla" value={data.modules.seeds} icon={HandCoins} variant="warning" />
          </div>
        </div>

        {/* Sección Comunidad & Soporte */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Comunidad & Soporte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <MetricCard title="NPS Promedio" value={data.nps.average} icon={MessageSquare} variant="primary" />
            <MetricCard title="Feedback" value={data.support.feedback} icon={MessageSquare} />
            <MetricCard title="Errores (Bugs)" value={data.support.bugs} icon={Bug} variant="destructive" />
            <MetricCard title="Oraciones" value={data.support.prayers} icon={HandCoins} variant="warning" />
            <MetricCard title="Donaciones (Total)" value={`$${data.donations.amount}`} icon={HandCoins} variant="success" />
          </div>
        </div>

        {/* Sección Gráficos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Métricas Recientes</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Usuarios Nuevos (Últimos 7 días)</h3>
              <ReactECharts
                option={{
                  tooltip: { trigger: 'axis' },
                  xAxis: { type: 'category', data: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] },
                  yAxis: { type: 'value' },
                  series: [{ data: [12, 19, 15, 22, 30, 24, 28], type: 'line', smooth: true, itemStyle: { color: '#7FA58A' } }]
                }}
                style={{ height: '300px' }}
              />
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Transacciones por Tipo</h3>
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item' },
                  legend: { top: 'bottom' },
                  series: [
                    {
                      name: 'Transacciones',
                      type: 'pie',
                      radius: ['40%', '70%'],
                      itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                      },
                      data: [
                        { value: data.transactions.incomes, name: 'Ingresos', itemStyle: { color: '#8FBF9F' } },
                        { value: data.transactions.expenses, name: 'Gastos', itemStyle: { color: '#D68B8B' } }
                      ]
                    }
                  ]
                }}
                style={{ height: '300px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
