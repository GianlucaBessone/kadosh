import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <main className="p-8 max-w-7xl mx-auto min-h-full">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
