'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, CheckCircle, Clock, Eye } from 'lucide-react';

export default function AdminSolicitudes() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/developer-requests');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Error loading requests', error);
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
          <h1 className="text-3xl font-bold tracking-tight">Solicitudes de Información</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Usuarios que solicitaron información del desarrollador</p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-12 text-slate-500 flex flex-col items-center">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <p>No hay solicitudes registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Fecha Solicitud</th>
                    <th className="px-6 py-4 font-medium">Usuario</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                    <th className="px-6 py-4 font-medium">Fecha Visto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">{new Date(req.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium">{req.user?.name} ({req.user?.email})</td>
                      <td className="px-6 py-4">
                        {req.status === 'PENDING' && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pendiente</span>}
                        {req.status === 'NOTIFIED' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> Notificado</span>}
                        {req.status === 'SEEN' && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max"><Eye className="w-3 h-3"/> Visto</span>}
                      </td>
                      <td className="px-6 py-4">
                        {req.seenAt ? new Date(req.seenAt).toLocaleString() : '-'}
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
