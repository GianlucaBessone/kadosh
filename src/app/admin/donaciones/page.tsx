'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Heart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDonaciones() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/donations');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Error loading donations', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Donaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Historial de aportes voluntarios</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar reporte
        </Button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-12 text-slate-500 flex flex-col items-center">
              <Heart className="w-12 h-12 text-slate-300 mb-4" />
              <p>Aún no hay donaciones registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Fecha</th>
                    <th className="px-6 py-4 font-medium">Usuario</th>
                    <th className="px-6 py-4 font-medium">Monto</th>
                    <th className="px-6 py-4 font-medium">Método</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.map((donation) => (
                    <tr key={donation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">{new Date(donation.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{donation.user?.name} ({donation.user?.email})</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">${donation.amount} {donation.currency}</td>
                      <td className="px-6 py-4">{donation.paymentMethod || 'No especificado'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          donation.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                          donation.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
