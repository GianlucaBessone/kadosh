import { useState } from 'react';
import { X, FileSpreadsheet, FileText, CalendarDays, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useWorkspaceStore } from '@/store/WorkspaceStore';

const CATEGORIES = [
  { id: 'supermarket', label: 'Supermercado' },
  { id: 'housing', label: 'Hogar' },
  { id: 'transport', label: 'Transporte' },
  { id: 'food', label: 'Comida' },
  { id: 'health', label: 'Salud' },
  { id: 'education', label: 'Educación' },
  { id: 'entertainment', label: 'Entretenimiento' },
  { id: 'services', label: 'Servicios' },
  { id: 'clothing', label: 'Ropa' },
  { id: 'salary', label: 'Salario' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'gifts', label: 'Regalos' },
  { id: 'investments', label: 'Inversiones' },
  { id: 'business', label: 'Negocio' },
  { id: 'other', label: 'Otros' }
];

const TYPES = [
  { id: 'INCOME', label: 'Ingreso' },
  { id: 'EXPENSE', label: 'Gasto' },
  { id: 'WATER', label: 'Riego' },
  { id: 'HARVEST', label: 'Cosecha' },
  { id: 'TITHE', label: 'Diezmo' }
];

type QuickReportMode = 'last_month' | 'last_year' | 'current_month' | 'current_year' | null;

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const [advFilters, setAdvFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    types: string[];
    categories: string[];
  }>({
    dateFrom: '',
    dateTo: '',
    types: [],
    categories: []
  });
  const [isExporting, setIsExporting] = useState(false);
  const [quickReportMode, setQuickReportMode] = useState<QuickReportMode>(null);

  const toggleAdvType = (typeId: string) => {
    setAdvFilters(prev => ({
      ...prev,
      types: prev.types.includes(typeId) 
        ? prev.types.filter(t => t !== typeId)
        : [...prev.types, typeId]
    }));
  };

  const toggleAdvCategory = (catId: string) => {
    setAdvFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(catId) 
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId]
    }));
  };

  const clearAdvFilters = () => {
    setAdvFilters({ dateFrom: '', dateTo: '', types: [], categories: [] });
  };

  const getQuickDates = (mode: QuickReportMode) => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    if (mode === 'last_month') {
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (mode === 'last_year') {
      from = new Date(today.getFullYear() - 1, 0, 1);
      to = new Date(today.getFullYear() - 1, 11, 31);
    } else if (mode === 'current_month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = today;
    } else if (mode === 'current_year') {
      from = new Date(today.getFullYear(), 0, 1);
      to = today;
    }

    const formatDate = (d: Date) => {
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };

    return { dateFrom: formatDate(from), dateTo: formatDate(to) };
  };

  const fetchAndFilterData = async (bypassFiltersMode?: QuickReportMode) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    if (!workspaceId) return [];

    const txs = await (db as any).transactions.where('workspaceId').equals(workspaceId).toArray();
    const tithes = await (db as any).tithes.where('workspaceId').equals(workspaceId).toArray();
    
    const mappedTithes = tithes.map((t: any) => ({
      id: t.id,
      userId: t.userId,
      accountId: '',
      categoryId: 'tithe',
      type: 'EXPENSE',
      amount: t.amount,
      date: t.date,
      notes: t.notes || 'Entrega de Diezmo',
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      deletedAt: t.deletedAt
    }));

    const all = [...txs, ...mappedTithes];
    const sorted = all.sort((a, b) => {
      const d1 = new Date(a.date);
      const d2 = new Date(b.date);
      const dateA = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
      const dateB = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
      if (dateB !== dateA) return dateA - dateB; // chronological order for exports
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const activeDateFrom = bypassFiltersMode ? getQuickDates(bypassFiltersMode).dateFrom : advFilters.dateFrom;
    const activeDateTo = bypassFiltersMode ? getQuickDates(bypassFiltersMode).dateTo : advFilters.dateTo;
    const activeTypes = bypassFiltersMode ? [] : advFilters.types;
    const activeCats = bypassFiltersMode ? [] : advFilters.categories;

    const filtered = sorted.filter(tx => {
      const isSeed = tx.notes?.toLowerCase().includes('semilla');
      const isTithe = tx.categoryId === 'tithe' || tx.notes?.toLowerCase().includes('diezmo');
      const txTypeGroup = isTithe ? 'TITHE' 
        : isSeed ? (tx.type === 'INCOME' ? 'HARVEST' : 'WATER') 
        : tx.type;

      if (activeDateFrom && new Date(tx.date) < new Date(activeDateFrom)) return false;
      if (activeDateTo && new Date(tx.date) > new Date(activeDateTo)) return false;
      
      if (activeTypes.length > 0) {
        if (!activeTypes.includes(txTypeGroup)) return false;
      }

      if (activeCats.length > 0) {
        if (!tx.categoryId || !activeCats.includes(tx.categoryId)) return false;
      }

      return true;
    });

    return filtered.map(tx => {
      const d = new Date(tx.date);
      const isSeed = tx.notes?.toLowerCase().includes('semilla');
      const isTithe = tx.categoryId === 'tithe' || tx.notes?.toLowerCase().includes('diezmo');
      const typeStr = isTithe ? 'Diezmo' : isSeed ? (tx.type === 'INCOME' ? 'Cosecha' : 'Riego') : (tx.type === 'INCOME' ? 'Ingreso' : 'Gasto');
      
      let catLabel = '-';
      if (isTithe) catLabel = 'Diezmo';
      else if (tx.categoryId) {
        const found = CATEGORIES.find(c => c.id === tx.categoryId);
        if (found) catLabel = found.label;
      }

      return {
        Fecha: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`,
        Hora: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
        Tipo: typeStr,
        Cuenta: '-',
        Categoría: catLabel,
        Moneda: 'ARS',
        Monto: tx.type === 'INCOME' ? tx.amount : -tx.amount,
        Detalle: tx.notes || ''
      };
    });
  };

  const handleExportExcel = async (bypassMode?: QuickReportMode) => {
    setIsExporting(true);
    try {
      const data = await fetchAndFilterData(bypassMode);
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");
      XLSX.writeFile(workbook, `Kadosh_Reporte_${new Date().getTime()}.xlsx`);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const loadImage = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ctx.beginPath();
          const radius = img.width * 0.18; // 18% border radius
          if (ctx.roundRect) {
            ctx.roundRect(0, 0, img.width, img.height, radius);
          } else {
            ctx.rect(0, 0, img.width, img.height);
          }
          ctx.clip();

          // Fill white background just in case
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Zoom of 1.25x (enough to make it big without touching edges)
          const zoom = 1.25;
          const sWidth = img.width / zoom;
          const sHeight = img.height / zoom;
          const sx = (img.width - sWidth) / 2;
          const sy = (img.height - sHeight) / 2;
          
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
          
          // Draw a very subtle inner border to hide jagged mask aliasing
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(1, 1, img.width - 2, img.height - 2, radius);
          ctx.strokeStyle = 'rgba(0,0,0,0.05)';
          ctx.lineWidth = 4;
          ctx.stroke();

          resolve(canvas.toDataURL('image/png', 1.0));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleExportPDF = async (bypassMode?: QuickReportMode) => {
    setIsExporting(true);
    try {
      const data = await fetchAndFilterData(bypassMode);
      const imgData = await loadImage('/icon-512x512.png');
      
      const doc = new jsPDF();
      
      // Header
      if (imgData) {
        doc.addImage(imgData, 'PNG', 14, 12, 14, 14);
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.setFont('helvetica', 'bold');
        doc.text("KADOSH", 31, 18);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text("Reporte de Movimientos", 31, 23.5);
      } else {
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.setFont('helvetica', 'bold');
        doc.text("KADOSH", 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text("Reporte de Movimientos", 14, 23.5);
      }
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);

      const tableColumn = ["Fecha", "Hora", "Tipo", "Cuenta", "Categoría", "Moneda", "Monto", "Detalle"];
      const tableRows = data.map(row => [
        row.Fecha,
        row.Hora,
        row.Tipo,
        row.Cuenta,
        row.Categoría,
        row.Moneda,
        formatMoney(row.Monto),
        row.Detalle
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 36,
        theme: 'grid',
        headStyles: { 
          fillColor: [50, 50, 50],
          halign: 'center'
        },
        styles: { fontSize: 8 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didDrawPage: function (data: any) {
          // Footer
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
          
          const footerY = pageHeight - 12;

          // Measure widths to center the composite footer line
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const w1 = doc.getTextWidth("KADOSH");
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          const w2 = doc.getTextWidth(" - finanzas con propósito");
          
          const circleSpace = 10; // Space for circle and margin
          const totalWidth = circleSpace + w1 + w2;
          const startX = (pageWidth - totalWidth) / 2;

          // Circle with K
          doc.setDrawColor(160, 160, 160);
          doc.setLineWidth(0.4);
          doc.circle(startX + 3.5, footerY - 1, 3.5); 
          
          doc.setFontSize(9);
          doc.setTextColor(160, 160, 160);
          doc.setFont('helvetica', 'bold');
          doc.text("K", startX + 3.5, footerY + 0.2, { align: 'center' }); 
          
          // KADOSH text
          doc.text("KADOSH", startX + 9, footerY + 0.2);

          // subtitle
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text(" - finanzas con propósito", startX + 9 + w1, footerY + 0.2);

          // reset font for page number
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          const str = "Página " + doc.getCurrentPageInfo().pageNumber;
          doc.text(str, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
        }
      });

      doc.save(`Kadosh_Reporte_${new Date().getTime()}.pdf`);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const getQuickReportLabel = (mode: QuickReportMode) => {
    switch (mode) {
      case 'last_month': return 'Mes pasado';
      case 'current_month': return 'Mes en curso';
      case 'last_year': return 'Año pasado';
      case 'current_year': return 'Año en curso';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-background rounded-t-[2rem] sm:rounded-3xl w-full max-w-md animate-in slide-in-from-bottom-1/2 sm:zoom-in-95 shadow-xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
        
        {/* Header - Sticky */}
        <div className="p-6 pb-4 shrink-0 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {quickReportMode ? (
              <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 text-muted-foreground" onClick={() => setQuickReportMode(null)}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            ) : null}
            <h2 className="text-xl font-bold">{quickReportMode ? 'Descargar Reporte' : 'Exportar Reporte'}</h2>
            {!quickReportMode && (advFilters.types.length > 0 || advFilters.categories.length > 0 || advFilters.dateFrom || advFilters.dateTo) ? (
              <Button variant="ghost" size="sm" onClick={clearAdvFilters} className="text-muted-foreground text-xs hover:text-foreground h-8 px-2">
                Limpiar
              </Button>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 shrink-0" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className={`p-6 overflow-y-auto hide-scrollbar flex flex-col gap-6 ${quickReportMode ? 'pb-28 sm:pb-6' : ''}`}>
          
          {quickReportMode ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reporte: {getQuickReportLabel(quickReportMode)}</h3>
              <p className="text-sm text-muted-foreground mb-6">Elige el formato de descarga para este reporte rápido. Se ignorarán los demás filtros avanzados.</p>
              
              <div className="flex flex-col gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="h-14 rounded-2xl border-success/20 bg-success/5 hover:bg-success/10 text-success w-full justify-start pl-6" 
                  onClick={() => handleExportExcel(quickReportMode)}
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="w-6 h-6 mr-4" />
                  Descargar en Excel
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 rounded-2xl border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive w-full justify-start pl-6 shadow-none" 
                  onClick={() => handleExportPDF(quickReportMode)}
                  disabled={isExporting}
                >
                  <FileText className="w-6 h-6 mr-4" />
                  Descargar en PDF
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Report Buttons */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reportes Rápidos</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuickReportMode('last_month')} className="h-10 rounded-xl justify-start font-medium text-xs bg-muted/30">
                    <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                    Mes pasado
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickReportMode('current_month')} className="h-10 rounded-xl justify-start font-medium text-xs bg-muted/30">
                    <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                    Mes en curso
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickReportMode('last_year')} className="h-10 rounded-xl justify-start font-medium text-xs bg-muted/30">
                    <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                    Año pasado
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickReportMode('current_year')} className="h-10 rounded-xl justify-start font-medium text-xs bg-muted/30">
                    <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                    Año en curso
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rango Personalizado</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Desde</label>
                    <Input 
                      type="date" 
                      value={advFilters.dateFrom} 
                      onChange={e => setAdvFilters(p => ({ ...p, dateFrom: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Hasta</label>
                    <Input 
                      type="date" 
                      value={advFilters.dateTo} 
                      onChange={e => setAdvFilters(p => ({ ...p, dateTo: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tipos</h3>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(type => {
                    const isActive = advFilters.types.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        onClick={() => toggleAdvType(type.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground border border-border/50'
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const isActive = advFilters.categories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleAdvCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          isActive ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground border border-border/50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer - Sticky Export Buttons */}
        {!quickReportMode && (
          <div className="p-6 pt-4 pb-28 sm:pb-6 shrink-0 border-t border-border/50 flex items-center gap-3 bg-background sm:rounded-b-3xl">
            <Button 
              variant="outline" 
              className="flex-1 h-14 rounded-2xl border-success/20 bg-success/5 hover:bg-success/10 text-success" 
              onClick={() => handleExportExcel()}
              disabled={isExporting}
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Excel
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive shadow-none" 
              variant="outline"
              onClick={() => handleExportPDF()}
              disabled={isExporting}
            >
              <FileText className="w-5 h-5 mr-2" />
              PDF
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
