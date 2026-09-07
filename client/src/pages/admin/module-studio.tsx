import React, { useState, useEffect } from 'react';
import {
  Layers,
  GripVertical,
  ArrowRightLeft,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileText,
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Users,
  ShieldCheck,
  Database,
  Settings,
  ClipboardList,
  Sparkles,
  HelpCircle,
  X,
  Pill,
  Package,
  ShoppingCart,
  ShieldAlert,
  Truck,
  ArrowRight,
  LayoutGrid,
  Columns3
} from 'lucide-react';
import { api } from '../../services/api';

export interface PageHierarchyItem {
  id: string;
  label: string;
  category: 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY';
  categoryLabel: string;
  description: string;
}

const ICON_MAP: Record<string, any> = {
  doctor_queue: Activity,
  doctor_consultation: FileText,
  doctor_tokens: LayoutDashboard,
  recep_desk: ClipboardList,
  recep_approvals: CalendarCheck,
  recep_pos: CreditCard,
  recep_reports: BarChart3,
  patient_portal: CalendarCheck,
  patient_booking: Activity,
  patient_history: FileText,
  patient_billing: CreditCard,
  pharma_queue: Pill,
  pharma_inventory: Package,
  pharma_pos: ShoppingCart,
  pharma_safety: ShieldAlert,
  pharma_procurement: Truck,
  admin_users: Users,
  admin_studio: Layers,
  admin_audit: ShieldCheck,
  admin_queue: Activity,
  admin_reports: BarChart3,
  admin_database: Database,
  admin_config: Settings,
  admin_ledger: CreditCard,
};

const CATEGORIES: {
  key: 'ADMIN' | 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'PHARMACY';
  title: string;
  subtitle: string;
  theme: {
    border: string;
    bg: string;
    headerBg: string;
    text: string;
    badge: string;
    dropZone: string;
  };
}[] = [
  {
    key: 'ADMIN',
    title: 'System Administration',
    subtitle: 'Security, governance, audit & system policies',
    theme: {
      border: 'border-emerald-200 dark:border-[#2D6A4F]/60',
      bg: 'bg-emerald-50/20 dark:bg-[#1A2518]/50',
      headerBg: 'bg-emerald-100/50 dark:bg-[#203622]',
      text: 'text-emerald-900 dark:text-[#74C69D]',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-[#2D6A4F] dark:text-emerald-100',
      dropZone: 'border-emerald-500 bg-emerald-50 dark:bg-[#203622]/80',
    },
  },
  {
    key: 'CLINICAL',
    title: 'Clinical & Doctor Deck',
    subtitle: 'Queue calling, consultations, prescriptions & triage',
    theme: {
      border: 'border-sky-200 dark:border-sky-900/60',
      bg: 'bg-sky-50/20 dark:bg-sky-950/20',
      headerBg: 'bg-sky-100/50 dark:bg-sky-950/50',
      text: 'text-sky-900 dark:text-sky-300',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
      dropZone: 'border-sky-500 bg-sky-50 dark:bg-sky-950/60',
    },
  },
  {
    key: 'RECEPTION',
    title: 'Front-Desk & Reception',
    subtitle: 'Walk-in check-in, booking authorizations & POS billing',
    theme: {
      border: 'border-purple-200 dark:border-purple-900/60',
      bg: 'bg-purple-50/20 dark:bg-purple-950/20',
      headerBg: 'bg-purple-100/50 dark:bg-purple-950/50',
      text: 'text-purple-900 dark:text-purple-300',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      dropZone: 'border-purple-500 bg-purple-50 dark:bg-purple-950/60',
    },
  },
  {
    key: 'PATIENT',
    title: 'Patient Services',
    subtitle: 'Self-service booking, digital records & invoice receipts',
    theme: {
      border: 'border-amber-200 dark:border-amber-900/60',
      bg: 'bg-amber-50/20 dark:bg-amber-950/20',
      headerBg: 'bg-amber-100/50 dark:bg-amber-950/50',
      text: 'text-amber-900 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      dropZone: 'border-amber-500 bg-amber-50 dark:bg-amber-950/60',
    },
  },
  {
    key: 'PHARMACY',
    title: 'Pharmacy & Medical Store',
    subtitle: 'Rx fulfillment, vault inventory & POS counter',
    theme: {
      border: 'border-teal-200 dark:border-teal-900/60',
      bg: 'bg-teal-50/20 dark:bg-teal-950/20',
      headerBg: 'bg-teal-100/50 dark:bg-teal-950/50',
      text: 'text-teal-900 dark:text-teal-300',
      badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      dropZone: 'border-teal-500 bg-teal-50 dark:bg-teal-950/60',
    },
  },
];

export const AdminModuleStudio: React.FC = () => {
  const [pages, setPages] = useState<PageHierarchyItem[]>(() => {
    try {
      const raw = localStorage.getItem('hospital_dynamic_hierarchy');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drag State
  const [draggedItem, setDraggedItem] = useState<PageHierarchyItem | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  // Confirmation Modal State
  const [pendingMove, setPendingMove] = useState<{
    page: PageHierarchyItem;
    targetCategory: 'ADMIN' | 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'PHARMACY';
    targetCategoryTitle: string;
  } | null>(null);

  // Layout View Mode (5-Column Deck vs Wide Grid)
  const [viewMode, setViewMode] = useState<'5col' | 'adaptive'>('5col');

  const fetchHierarchy = async () => {
    if (pages.length === 0) setLoading(true);
    try {
      const res = await api.get('/admin/hierarchy');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setPages(res.data.data);
        localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to load module hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hospital_dynamic_hierarchy' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPages(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDragStart = (e: React.DragEvent, item: PageHierarchyItem) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, categoryKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCategory !== categoryKey) {
      setDragOverCategory(categoryKey);
    }
  };

  const handleDragLeave = (categoryKey: string) => {
    if (dragOverCategory === categoryKey) {
      setDragOverCategory(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCategory: 'ADMIN' | 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'PHARMACY') => {
    e.preventDefault();
    setDragOverCategory(null);

    if (!draggedItem) return;

    // If dropped inside the exact same department, do nothing
    if (draggedItem.category === targetCategory) {
      setDraggedItem(null);
      return;
    }

    const targetDef = CATEGORIES.find(c => c.key === targetCategory);

    // Open confirmation prompt modal
    setPendingMove({
      page: draggedItem,
      targetCategory,
      targetCategoryTitle: targetDef ? targetDef.title : targetCategory,
    });
  };

  const handleConfirmMove = async () => {
    if (!pendingMove) return;

    setIsSubmitting(true);
    try {
      const res = await api.patch('/admin/hierarchy/move-page', {
        pageId: pendingMove.page.id,
        targetCategory: pendingMove.targetCategory,
      });

      // Update local state & localStorage
      const updatedHierarchy: PageHierarchyItem[] = res.data.data.hierarchy;
      setPages(updatedHierarchy);
      localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(updatedHierarchy));

      // Broadcast event so sidebar rail updates instantly
      window.dispatchEvent(
        new CustomEvent('hospital_hierarchy_updated', {
          detail: updatedHierarchy,
        })
      );

      setToastMessage(
        `✓ Page "${pendingMove.page.label}" successfully moved into "${pendingMove.targetCategoryTitle}"`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setPendingMove(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to move page');
    } finally {
      setIsSubmitting(false);
      setDraggedItem(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all hospital pages to their standard default departments?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/hierarchy/reset');
      setPages(res.data.data);
      localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(res.data.data));
      window.dispatchEvent(
        new CustomEvent('hospital_hierarchy_updated', {
          detail: res.data.data,
        })
      );
      setToastMessage('✓ Hospital pages reset to system defaults');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset hierarchy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2F3E29]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#2D6A4F]" />
            <span>Hospital Module & Page Architecture Studio</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-1">
            Drag & drop any hospital page between departments to customize hospital layout and role workflows.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#202C1B] p-1 rounded-xl border border-slate-200 dark:border-[#38482E]">
            <button
              onClick={() => setViewMode('5col')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === '5col'
                  ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-[#A4AC86]'
              }`}
              title="View all 5 departments side-by-side"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>5-Col Studio</span>
            </button>
            <button
              onClick={() => setViewMode('adaptive')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'adaptive'
                  ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-[#A4AC86]'
              }`}
              title="Wide multi-column grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Wide Grid</span>
            </button>
          </div>

          <button
            onClick={fetchHierarchy}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#38482E] text-slate-600 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#202C1B] transition-colors cursor-pointer"
            title="Refresh Architecture"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleResetDefaults}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-[#38482E] text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#202C1B] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* Real-time Toast Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Info Instruction Strip */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161E12] border border-slate-200/80 dark:border-[#2F3E29] flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-[#A4AC86]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-white">How it works:</strong> Click and drag any page card across the columns. When dropped, confirm with <strong>Yes</strong> to move the page into the new module. Changes reflect immediately in the navigation rail!
          </span>
        </div>
        <div className="text-[11px] font-mono shrink-0 px-2 py-0.5 rounded bg-slate-200 dark:bg-[#202C1B] text-slate-700 dark:text-[#C2C5AA]">
          {pages.length} Active Pages
        </div>
      </div>

      {/* Dynamic Drag & Drop Board with Zero Text Clamping & No Column Cut-offs */}
      <div
        className={`grid gap-3 w-full pb-20 pt-1 select-none ${
          viewMode === '5col'
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 min-[1180px]:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {CATEGORIES.map((cat) => {
          const categoryPages = pages.filter((p) => p.category === cat.key);
          const isOverThis = dragOverCategory === cat.key;

          return (
            <div
              key={cat.key}
              onDragOver={(e) => handleDragOver(e, cat.key)}
              onDragLeave={() => handleDragLeave(cat.key)}
              onDrop={(e) => handleDrop(e, cat.key)}
              className={`w-full rounded-2xl border transition-all duration-200 flex flex-col min-h-[460px] bg-white dark:bg-[#1A2215] shadow-xs ${
                isOverThis
                  ? `border-2 border-dashed ${cat.theme.dropZone} shadow-lg scale-[1.01]`
                  : cat.theme.border
              }`}
            >
              {/* Department Column Header */}
              <div
                className={`p-3.5 rounded-t-2xl border-b border-slate-100 dark:border-[#2F3E29] ${cat.theme.headerBg} flex items-start justify-between gap-1.5`}
              >
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-xs sm:text-sm leading-tight truncate ${cat.theme.text}`} title={cat.title}>
                    {cat.title}
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-[#A4AC86] mt-0.5 leading-tight line-clamp-1" title={cat.subtitle}>
                    {cat.subtitle}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full font-mono shrink-0 ${cat.theme.badge}`}
                >
                  {categoryPages.length}
                </span>
              </div>

              {/* Draggable Pages Container - No internal clipping scrollbar */}
              <div className="p-2.5 flex-1 space-y-2.5">
                {categoryPages.map((page) => {
                  const Icon = ICON_MAP[page.id] || FileText;
                  const isBeingDragged = draggedItem?.id === page.id;

                  return (
                    <div
                      key={page.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, page)}
                      className={`p-3 rounded-2xl border bg-white dark:bg-[#1E2718] border-slate-200/90 dark:border-[#38482E] shadow-2xs hover:shadow-md transition-all select-none cursor-grab active:cursor-grabbing group hover:border-[#2D6A4F] dark:hover:border-[#528357] hover:-translate-y-0.5 ${
                        isBeingDragged ? 'opacity-40 scale-95 border-dashed border-[#2D6A4F]' : ''
                      }`}
                    >
                      {/* Top Row: Icon + Grip on left, ID on right */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-[#25331E] flex items-center justify-center text-slate-700 dark:text-[#C2C5AA] shrink-0 border border-slate-200/60 dark:border-[#333D29] group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                            <Icon className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#74C69D]" />
                          </div>
                          <div className="text-slate-300 dark:text-[#4A5543] group-hover:text-slate-600 dark:group-hover:text-[#A4AC86] transition-colors shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* ID Badge */}
                        <span
                          className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#25331E] border border-slate-200/60 dark:border-[#333D29] text-slate-500 dark:text-[#A4AC86] truncate max-w-[105px]"
                          title={`Page ID: ${page.id}`}
                        >
                          {page.id}
                        </span>
                      </div>

                      {/* Page Title: Spans 100% width, wraps cleanly */}
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug break-words">
                        {page.label}
                      </h4>

                      {/* Page Description: Spans 100% width, 2-line clamp */}
                      {page.description && (
                        <p
                          className="text-[11px] text-slate-500 dark:text-[#A4AC86] mt-1 leading-snug line-clamp-2"
                          title={page.description}
                        >
                          {page.description}
                        </p>
                      )}

                      {/* Card Footer: Status on left, Drag hint on right */}
                      <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-[#2B3824] flex items-center justify-between text-[10px]">
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-slate-400 dark:text-[#7A866E]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Active</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-[#74C69D] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                          <span>Drag to move</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {categoryPages.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-[#333D29] text-center p-3">
                    <p className="text-xs text-slate-400 dark:text-[#A4AC86]">
                      Drop pages here to assign to this department.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>


      {/* Confirmation Modal on Page Move */}
      {pendingMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 shadow-xs">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Confirm Page Move
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-1 leading-relaxed">
                  Are you sure you want to move this page into another module department?
                </p>
              </div>
            </div>

            {/* Move Details Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E12] border border-slate-200 dark:border-[#2F3E29] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Page to Move:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {pendingMove.page.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Current Module:</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {pendingMove.page.categoryLabel || pendingMove.page.category}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-[#2F3E29] pt-1.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">New Target Module:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {pendingMove.targetCategoryTitle}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-[#A4AC86] leading-normal italic">
              * Users with access to "{pendingMove.targetCategoryTitle}" will immediately see this page in their sidebar navigation.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#2F3E29]">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setPendingMove(null);
                  setDraggedItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#25331E] border border-slate-200 dark:border-[#38482E] transition-colors cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmMove}
                className="clinical-button-primary px-4 py-2 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Moving Page...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Yes, Move Page</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminModuleStudio;
