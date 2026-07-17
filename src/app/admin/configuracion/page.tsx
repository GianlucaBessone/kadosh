'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AppConfig {
  key: string;
  value: string;
  type: string;
  label?: string;
  category: string;
}

export default function AdminConfiguracion() {
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/config');
        const json = await res.json();
        if (json.success) setConfigs(json.data);
      } catch (err) {
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (key: string, newValue: string) => {
    setSavingKey(key);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue }),
      });
      
      if (res.ok) {
        toast.success('Configuración guardada');
        setConfigs(configs.map(c => c.key === key ? { ...c, value: newValue } : c));
      } else {
        toast.error('Error al guardar');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setSavingKey(null);
    }
  };

  const groupedConfigs = configs.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, AppConfig[]>);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Administra los módulos y variables globales de la aplicación</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {(Object.entries(groupedConfigs) as [string, AppConfig[]][]).map(([category, items]) => (
            <Card key={category} className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-primary" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {items.map((item) => (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <Label htmlFor={item.key} className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.label || item.key}
                      </Label>
                      <p className="text-xs text-slate-500 font-mono mt-1">{item.key}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {item.type === 'BOOLEAN' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${item.value === 'true' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                            onClick={() => handleUpdate(item.key, item.value === 'true' ? 'false' : 'true')}
                            disabled={savingKey === item.key}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.value === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                          {savingKey === item.key && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-64">
                          <Input 
                            id={item.key}
                            defaultValue={item.value}
                            type={item.type === 'NUMBER' ? 'number' : 'text'}
                            className="bg-white dark:bg-slate-900 h-9"
                            onBlur={(e) => {
                              if (e.target.value !== item.value) {
                                handleUpdate(item.key, e.target.value);
                              }
                            }}
                          />
                          {savingKey === item.key && <Loader2 className="w-4 h-4 animate-spin text-slate-400 flex-shrink-0" />}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
