'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Filter, MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SelectPicker } from '@/components/ui/picker/select/SelectPicker';

export default function AdminSoporte() {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'FEEDBACK'>('TICKETS');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'TICKETS' ? '/api/admin/support' : '/api/admin/feedback';
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const endpoint = activeTab === 'TICKETS' ? '/api/admin/support' : '/api/admin/feedback';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success('Estado actualizado');
        fetchData();
      }
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const updateNotes = async (id: string, adminNotes: string) => {
    try {
      const endpoint = activeTab === 'TICKETS' ? '/api/admin/support' : '/api/admin/feedback';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, adminNotes }),
      });
      if (res.ok) {
        toast.success('Notas guardadas');
      }
    } catch (error) {
      toast.error('Error al guardar notas');
    }
  };

  const filteredData = data.filter((item) => {
    const search = searchTerm.toLowerCase();
    const user = item.user?.email || '';
    if (activeTab === 'TICKETS') {
      return item.subject?.toLowerCase().includes(search) || user.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search);
    }
    return item.comment?.toLowerCase().includes(search) || user.toLowerCase().includes(search) || item.bestPart?.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Soporte</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Administra consultas, errores y feedback de usuarios</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'TICKETS' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            onClick={() => setActiveTab('TICKETS')}
          >
            Tickets
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'FEEDBACK' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            onClick={() => setActiveTab('FEEDBACK')}
          >
            Feedback & NPS
          </button>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por usuario o contenido..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              No se encontraron registros.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {activeTab === 'TICKETS' ? (
                          <>
                            {item.type === 'BUG' && <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><Bug className="w-3 h-3"/> Bug</span>}
                            {item.type === 'FEATURE' && <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><Lightbulb className="w-3 h-3"/> Idea</span>}
                            {item.type === 'QUESTION' && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><HelpCircle className="w-3 h-3"/> Consulta</span>}
                            <h3 className="font-semibold text-lg">{item.subject}</h3>
                          </>
                        ) : (
                          <>
                            {item.type === 'NPS' ? (
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">NPS: {item.npsScore}</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Comentario</span>
                            )}
                          </>
                        )}
                        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{item.user?.name} ({item.user?.email})</span>
                      </p>
                      
                      {activeTab === 'TICKETS' ? (
                        <p className="text-sm bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">{item.description}</p>
                      ) : (
                        <div className="space-y-2 text-sm">
                          {item.bestPart && <p><strong className="block text-emerald-600">Lo mejor:</strong> {item.bestPart}</p>}
                          {item.improvement && <p><strong className="block text-amber-600">Mejorar:</strong> {item.improvement}</p>}
                          {item.comment && <p className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{item.comment}</p>}
                        </div>
                      )}
                    </div>

                    <div className="w-full lg:w-64 flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Estado</label>
                        <SelectPicker 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm"
                          value={item.status}
                          onChange={(value) => updateStatus(item.id, value)}
                          items={[
                            { value: "NEW", label: "Nuevo" },
                            { value: "OPEN", label: "Abierto" },
                            { value: "IN_PROGRESS", label: "En Progreso" },
                            { value: "REVIEWED", label: "Revisado" },
                            { value: "RESOLVED", label: "Resuelto" },
                            { value: "CLOSED", label: "Cerrado" }
                          ]}
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Notas internas</label>
                        <textarea 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm resize-none"
                          rows={3}
                          placeholder="Notas privadas..."
                          defaultValue={item.adminNotes || ''}
                          onBlur={(e) => {
                            if (e.target.value !== item.adminNotes) {
                              updateNotes(item.id, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
