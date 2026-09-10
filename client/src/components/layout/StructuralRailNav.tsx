import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Activity,
  FileText,
  CreditCard,
  Settings,
  ShieldCheck,
  Users,
  LogOut,
  Hospital,
  Menu,
  BarChart3,
  Database,
  ClipboardList,
  Stethoscope,
  Sparkles,
  Layers,
  ArrowRightLeft,
  GripVertical,
  CheckCircle2,
  RefreshCw,
  Pill,
  Package,
  ShoppingCart,
  ShieldAlert,
  Truck,
  ChevronUp,
  Sun,
  Moon,
  User
} from 'lucide-react';
import { api } from '../../services/api';
import { getStoredThemeColor, THEME_COLOR_OPTIONS, ThemeColorOption, getCurrentPalette } from '../../utils/themePalette';

export interface ModuleNavDef {
  id: string;
  label: string;
  category: 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY';
  categoryLabel: string;
  icon: any;
}

export const ALL_HOSPITAL_MODULES: ModuleNavDef[] = [
  // Clinical / Doctor
  { id: 'doctor_queue', label: "Today's Clinical Queue", category: 'CLINICAL', categoryLabel: 'Clinical & Doctor', icon: Activity },
  { id: 'doctor_consultation', label: 'Consultations & Rx', category: 'CLINICAL', categoryLabel: 'Clinical & Doctor', icon: FileText },
  { id: 'doctor_tokens', label: 'Token Matrix', category: 'CLINICAL', categoryLabel: 'Clinical & Doctor', icon: LayoutDashboard },

  // Front-Desk / Reception
  { id: 'recep_desk', label: 'Queue & Check-In', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', icon: ClipboardList },
  { id: 'recep_approvals', label: 'Pending Bookings', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', icon: CalendarCheck },
  { id: 'recep_pos', label: 'Front-Desk Billing POS', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', icon: CreditCard },
  { id: 'recep_reports', label: 'Front-Desk Analytics', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', icon: BarChart3 },

  // Patient Services
  { id: 'patient_portal', label: 'My Appointments & Tokens', category: 'PATIENT', categoryLabel: 'Patient Services', icon: CalendarCheck },
  { id: 'patient_booking', label: 'Book Appointment', category: 'PATIENT', categoryLabel: 'Patient Services', icon: Activity },
  { id: 'patient_history', label: 'Medical Records & Rx', category: 'PATIENT', categoryLabel: 'Patient Services', icon: FileText },
  { id: 'patient_billing', label: 'Billing & Invoices', category: 'PATIENT', categoryLabel: 'Patient Services', icon: CreditCard },

  // Pharmacy & Medical Store
  { id: 'pharma_queue', label: 'Live Dispense Queue', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', icon: Pill },
  { id: 'pharma_inventory', label: 'Drug Inventory Vault', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', icon: Package },
  { id: 'pharma_pos', label: 'Pharmacy POS Counter', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', icon: ShoppingCart },
  { id: 'pharma_safety', label: 'Drug Safety & AI Screener', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', icon: ShieldAlert },
  { id: 'pharma_procurement', label: 'Suppliers & Procurement', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', icon: Truck },

  // System Administration
  { id: 'admin_users', label: 'User Access Control', category: 'ADMIN', categoryLabel: 'System Administration', icon: Users },
  { id: 'admin_studio', label: 'Module & Page Studio', category: 'ADMIN', categoryLabel: 'System Administration', icon: Layers },
  { id: 'admin_audit', label: 'Audit Vault', category: 'ADMIN', categoryLabel: 'System Administration', icon: ShieldCheck },
  { id: 'admin_queue', label: 'Live System Queue Monitor', category: 'ADMIN', categoryLabel: 'System Administration', icon: Activity },
  { id: 'admin_reports', label: 'Executive Analytics & BI', category: 'ADMIN', categoryLabel: 'System Administration', icon: BarChart3 },
  { id: 'admin_database', label: 'Database Clear & Reset', category: 'ADMIN', categoryLabel: 'System Administration', icon: Database },
  { id: 'admin_config', label: 'System Policies', category: 'ADMIN', categoryLabel: 'System Administration', icon: Settings },
  { id: 'admin_ledger', label: 'Hospital Ledger', category: 'ADMIN', categoryLabel: 'System Administration', icon: CreditCard },
];

// Read cached dynamic hierarchy from localStorage to eliminate flicker and sync instantly
export const getStoredHierarchy = (): ModuleNavDef[] => {
  try {
    const raw = localStorage.getItem('hospital_dynamic_hierarchy');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return ALL_HOSPITAL_MODULES.map(staticDef => {
          const matched = parsed.find((p: any) => p.id === staticDef.id);
          return matched ? { ...staticDef, category: matched.category, categoryLabel: matched.categoryLabel } : staticDef;
        });
      }
    }
  } catch (e) {
    // Ignore error
  }
  return ALL_HOSPITAL_MODULES;
};

export const ROLE_DEFAULT_IDS: Record<string, string[]> = {
  DOCTOR: ['doctor_queue', 'doctor_consultation', 'doctor_tokens'],
  RECEPTIONIST: ['recep_desk', 'recep_approvals', 'recep_pos', 'recep_reports'],
  PATIENT: ['patient_portal', 'patient_booking', 'patient_history', 'patient_billing'],
  PHARMACIST: ['pharma_queue', 'pharma_inventory', 'pharma_pos', 'pharma_safety', 'pharma_procurement'],
  ADMIN: ALL_HOSPITAL_MODULES.map(m => m.id),
};

interface StructuralRailNavProps {
  currentRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLogout: () => void;
  currentUser?: any;
}

export const StructuralRailNav: React.FC<StructuralRailNavProps> = ({
  currentRole,
  currentTab,
  onSelectTab,
  isExpanded,
  onToggleExpand,
  onLogout,
  currentUser
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [modulesRegistry, setModulesRegistry] = useState<ModuleNavDef[]>(getStoredHierarchy);
  const [isHovered, setIsHovered] = useState(false);

  // When pinned it stays expanded; otherwise expands dynamically on cursor hover and hides on leave
  const effectiveExpanded = isExpanded || isHovered;

  // Drop-Up State (Preferences & Sign Out)
  const [isDropUpOpen, setIsDropUpOpen] = useState(false);
  const dropUpRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLButtonElement>(null);

  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hospital_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hospital_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hospital_theme', 'light');
    }
    window.dispatchEvent(new CustomEvent('hospital_theme_changed', { detail: nextDark ? 'dark' : 'light' }));
  };

  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      if (e.detail) {
        setIsDark(e.detail === 'dark');
      }
    };
    window.addEventListener('hospital_theme_changed', handleThemeEvent);
    return () => window.removeEventListener('hospital_theme_changed', handleThemeEvent);
  }, []);

  // Real-time synced theme palette for Brand Header & Sidebar
  const [activePalette, setActivePalette] = useState<ThemeColorOption>(getCurrentPalette);

  useEffect(() => {
    const handleColorEvent = (e: any) => {
      if (e.detail?.gradientStart) {
        setActivePalette(e.detail);
      }
    };
    window.addEventListener('hospital_theme_color_changed', handleColorEvent);
    return () => window.removeEventListener('hospital_theme_color_changed', handleColorEvent);
  }, []);

  // Click outside & Escape key handler to close drop-up
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropUpRef.current && 
        !dropUpRef.current.contains(e.target as Node) &&
        stripRef.current &&
        !stripRef.current.contains(e.target as Node)
      ) {
        setIsDropUpOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropUpOpen(false);
    };
    if (isDropUpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropUpOpen]);

  // Drag & Drop State in Sidebar
  const [draggedSidebarItem, setDraggedSidebarItem] = useState<ModuleNavDef | null>(null);
  const [dragOverCatKey, setDragOverCatKey] = useState<string | null>(null);
  const [sidebarMoveLoading, setSidebarMoveLoading] = useState(false);
  const [pendingSidebarMove, setPendingSidebarMove] = useState<{
    page: ModuleNavDef;
    targetCategory: 'ADMIN' | 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'PHARMACY';
    targetCategoryLabel: string;
  } | null>(null);

  // Sync with backend dynamic hierarchy & cross-tab localStorage
  useEffect(() => {
    const applyHierarchy = (data: any[]) => {
      if (!Array.isArray(data)) return;
      setModulesRegistry(prev => prev.map(m => {
        const found = data.find((d: any) => d.id === m.id);
        return found ? { ...m, category: found.category, categoryLabel: found.categoryLabel } : m;
      }));
    };

    const fetchDynamicHierarchy = async () => {
      try {
        const res = await api.get('/admin/hierarchy');
        if (res.data?.data && Array.isArray(res.data.data)) {
          applyHierarchy(res.data.data);
          localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(res.data.data));
        }
      } catch (err) {
        // Fallback to static defaults
      }
    };

    fetchDynamicHierarchy();

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        applyHierarchy(e.detail);
        localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(e.detail));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hospital_dynamic_hierarchy' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          applyHierarchy(parsed);
        } catch (err) {
          // ignore
        }
      }
    };

    window.addEventListener('hospital_hierarchy_updated', handleUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('hospital_hierarchy_updated', handleUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Map role to its primary domain category
  const roleToCategoryKey: Record<string, 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY'> = {
    ADMIN: 'ADMIN',
    DOCTOR: 'CLINICAL',
    RECEPTIONIST: 'RECEPTION',
    PATIENT: 'PATIENT',
    PHARMACIST: 'PHARMACY',
  };

  const primaryCategory = roleToCategoryKey[currentRole] || 'ADMIN';

  // Compute active modules based on permissions
  let visibleModules: ModuleNavDef[] = [];

  if (currentRole === 'ADMIN') {
    // Admin sees ALL modules across all domains
    visibleModules = modulesRegistry;
  } else if (currentUser?.allowedModules && Array.isArray(currentUser.allowedModules) && currentUser.allowedModules.length > 0) {
    // User has custom granular permissions assigned by Admin.
    // STRICT SECURITY ENFORCEMENT: System Administration modules (ADMIN category) are STRICTLY reserved for ADMIN role!
    // Doctors, Receptionists, Patients, and Pharmacists can never access or see System Administration in their sidebar.
    visibleModules = modulesRegistry.filter(m => currentUser.allowedModules.includes(m.id) && m.category !== 'ADMIN');
  } else {
    // Dynamic role department membership:
    // Any page whose category matches this role's department is automatically visible!
    // When a page is moved into or out of this department, it dynamically reflects in real-time!
    visibleModules = modulesRegistry.filter(m => m.category === primaryCategory && m.category !== 'ADMIN');
  }

  // Category display order: Current role's own department is ALWAYS placed at the TOP
  const orderedCategoryKeys: ('CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY')[] = currentRole === 'ADMIN'
    ? ['ADMIN', 'CLINICAL', 'RECEPTION', 'PATIENT', 'PHARMACY']
    : [primaryCategory, ...(['CLINICAL', 'RECEPTION', 'PATIENT', 'PHARMACY'] as const).filter(k => k !== primaryCategory)];

  const categoryLabels: Record<'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY', string> = {
    ADMIN: 'System Administration',
    CLINICAL: 'Clinical Deck',
    RECEPTION: 'Front-Desk & Reception',
    PATIENT: 'Patient Services',
    PHARMACY: 'Pharmacy & Medical Store',
  };

  const categories = orderedCategoryKeys.map(key => ({
    key,
    label: categoryLabels[key],
    items: visibleModules.filter(m => m.category === key)
  })).filter(cat => cat.items.length > 0 && (currentRole === 'ADMIN' || cat.key !== 'ADMIN'));

  const hasMultipleCategories = categories.length > 1;

  // Active User Profile & Department Resolution
  const resolvedUserName = 
    currentUser?.profile?.fullName ||
    currentUser?.profile?.name ||
    currentUser?.fullName ||
    currentUser?.name ||
    (currentRole === 'ADMIN' ? 'Root Administrator'
      : currentRole === 'DOCTOR' ? 'Dr. Zubair Qureshi'
      : currentRole === 'RECEPTIONIST' ? 'Nouman Qamar'
      : currentRole === 'PHARMACIST' ? 'Tariq Mehmood, RPh'
      : 'Registered Patient');

  const getDepartmentInfo = () => {
    switch (currentRole) {
      case 'DOCTOR':
        return {
          label: currentUser?.profile?.specialization ? `Doctor • ${currentUser.profile.specialization}` : 'Clinical Doctor',
          icon: Stethoscope
        };
      case 'RECEPTIONIST':
        return {
          label: currentUser?.profile?.department || 'Front-Desk Reception',
          icon: ClipboardList
        };
      case 'PATIENT':
        return {
          label: 'Patient Services',
          icon: User
        };
      case 'PHARMACIST':
        return {
          label: currentUser?.profile?.department || 'Dispensary & Pharmacy',
          icon: Pill
        };
      case 'ADMIN':
      default:
        return {
          label: 'Hospital Administration',
          icon: ShieldCheck
        };
    }
  };

  const { label: departmentLabel, icon: DepartmentIcon } = getDepartmentInfo();

  // Sidebar drag & drop handlers
  const handleSidebarDragStart = (e: React.DragEvent, item: ModuleNavDef) => {
    if (currentRole !== 'ADMIN') return;
    setDraggedSidebarItem(item);
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSidebarDragOver = (e: React.DragEvent, catKey: string) => {
    if (currentRole !== 'ADMIN') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCatKey !== catKey) {
      setDragOverCatKey(catKey);
    }
  };

  const handleSidebarDrop = (e: React.DragEvent, targetCategory: 'ADMIN' | 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'PHARMACY') => {
    if (currentRole !== 'ADMIN') return;
    e.preventDefault();
    setDragOverCatKey(null);

    if (!draggedSidebarItem) return;
    if (draggedSidebarItem.category === targetCategory) {
      setDraggedSidebarItem(null);
      return;
    }

    setPendingSidebarMove({
      page: draggedSidebarItem,
      targetCategory,
      targetCategoryLabel: categoryLabels[targetCategory] || targetCategory
    });
  };

  const handleConfirmSidebarMove = async () => {
    if (!pendingSidebarMove) return;

    setSidebarMoveLoading(true);
    try {
      const res = await api.patch('/admin/hierarchy/move-page', {
        pageId: pendingSidebarMove.page.id,
        targetCategory: pendingSidebarMove.targetCategory,
      });

      const updatedHierarchy = res.data.data.hierarchy;
      localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(updatedHierarchy));
      setModulesRegistry(prev => prev.map(m => {
        const found = updatedHierarchy.find((d: any) => d.id === m.id);
        return found ? { ...m, category: found.category, categoryLabel: found.categoryLabel } : m;
      }));

      window.dispatchEvent(
        new CustomEvent('hospital_hierarchy_updated', {
          detail: updatedHierarchy,
        })
      );

      setPendingSidebarMove(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to move page');
    } finally {
      setSidebarMoveLoading(false);
      setDraggedSidebarItem(null);
    }
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDropUpOpen(false);
      }}
      className={`h-screen flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none shadow-sm bg-white dark:bg-[#1A2215] text-[#1F291E] dark:text-[#F6F7F2] border-r border-[#E2E6D8] dark:border-[#333D29] ${
        effectiveExpanded ? 'w-64 shadow-xl' : 'w-16'
      }`}
    >
      {/* Brand Header with Top 3-Lines Toggle */}
      <div className="flex flex-col min-h-0 flex-1">
        <div 
          className={`h-16 flex items-center border-b border-[#E2E6D8] dark:border-[#333D29] shrink-0 ${effectiveExpanded ? 'justify-between px-3.5' : 'justify-center'}`}
        >
          {effectiveExpanded ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div 
                  className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs brand-header-icon transition-all duration-300"
                  style={{ background: `linear-gradient(135deg, ${activePalette.gradientStart} 0%, ${activePalette.gradientEnd} 100%)` }}
                >
                  <Hospital className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden whitespace-nowrap">
                  <span className="font-extrabold text-sm tracking-tight text-[#1F291E] dark:text-white block">
                    Aesthetic Hospital
                  </span>
                  <span 
                    className="text-[10px] uppercase tracking-wider font-semibold block flex items-center gap-1 brand-header-subtitle transition-colors duration-300"
                    style={{ color: activePalette.gradientStart }}
                  >
                    <span>{currentRole} WORKSPACE</span>
                    {currentUser?.allowedModules && currentUser.allowedModules.length > 0 && currentRole !== 'ADMIN' && (
                      <span 
                        className="text-[9px] px-1 py-0.2 rounded font-bold"
                        style={{
                          backgroundColor: activePalette.badgeBgLight,
                          color: activePalette.badgeTextLight
                        }}
                      >
                        {visibleModules.length} Modules
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* 3-Lines Menu Button */}
              <button
                onClick={onToggleExpand}
                className="p-1.5 rounded-lg text-[#656D4A] hover:text-[#1F291E] hover:bg-[#F0F3EB] dark:text-[#C2C5AA] dark:hover:text-white dark:hover:bg-[#2D3923] transition-colors shrink-0 cursor-pointer"
                title={isExpanded ? "Lock in dynamic auto-collapse mode" : "Lock in permanently expanded mode"}
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleExpand}
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-all duration-300 brand-header-icon"
              style={{ background: `linear-gradient(135deg, ${activePalette.gradientStart} 0%, ${activePalette.gradientEnd} 100%)` }}
              title="Aesthetic Hospital Workspace (Click to expand)"
            >
              <Hospital className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
          {categories.map((cat) => {
            const isCatOver = dragOverCatKey === cat.key;

            return (
              <div
                key={cat.key}
                onDragOver={(e) => handleSidebarDragOver(e, cat.key)}
                onDragLeave={() => { if (dragOverCatKey === cat.key) setDragOverCatKey(null); }}
                onDrop={(e) => handleSidebarDrop(e, cat.key)}
                className={`space-y-1 transition-all rounded-xl p-0.5 ${
                  isCatOver && currentRole === 'ADMIN'
                    ? 'border-2 border-dashed border-[#2D6A4F] bg-[#E8F3EB]/60 dark:bg-[#203622]/60'
                    : ''
                }`}
              >
                {/* Category Header */}
                {effectiveExpanded && hasMultipleCategories && (
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#656D4A] dark:text-[#A4AC86] flex items-center justify-between border-t border-[#E2E6D8]/40 dark:border-[#333D29]/40 first:border-0 first:pt-0">
                    <span>{cat.label}</span>
                    <span className="text-[9px] font-mono opacity-60">({cat.items.length})</span>
                  </div>
                )}

                {/* Modules in this category */}
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const isItemDragged = draggedSidebarItem?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      draggable={currentRole === 'ADMIN'}
                      onDragStart={(e) => handleSidebarDragStart(e, item)}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        isActive
                          ? 'sidebar-active-tab bg-[#E8F3EB] dark:bg-[#2D3923] text-[#1B4332] dark:text-white font-bold border border-[#A7D7C5] dark:border-[#406343] shadow-xs'
                          : 'text-[#4A5543] hover:text-[#1F291E] hover:bg-[#F4F6F0] dark:text-[#C2C5AA] dark:hover:text-white dark:hover:bg-[#2D3923]/60'
                      } ${isItemDragged ? 'opacity-40 scale-95' : ''}`}
                      title={!effectiveExpanded ? `${item.label} (${cat.label})` : undefined}
                    >
                      <Icon 
                        className="w-4 h-4 shrink-0 transition-colors" 
                        style={{ color: isActive ? 'var(--primary-accent, #2D6A4F)' : undefined }}
                      />
                      {effectiveExpanded && <span className="truncate text-left flex-1">{item.label}</span>}
                      {effectiveExpanded && currentRole === 'ADMIN' && (
                        <GripVertical className="w-3 h-3 text-slate-300 dark:text-[#4A5543] opacity-0 hover:opacity-100 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {visibleModules.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-[#A4AC86]">
              No active modules assigned to your account.
            </div>
          )}
        </nav>
      </div>

      {/* Half-Centimeter Arrow Strip & Drop-Up Menu */}
      <div className="relative border-t border-[#E2E6D8] dark:border-[#333D29]">
        {/* The Sleek Half-Centimeter Strip */}
        <button
          ref={stripRef}
          type="button"
          onClick={() => setIsDropUpOpen(prev => !prev)}
          style={{ height: '22px' }}
          className={`w-full flex items-center justify-center transition-all duration-200 cursor-pointer select-none group ${
            isDropUpOpen 
              ? 'bg-[#E3EBE0] dark:bg-[#27351F]' 
              : 'bg-[#F6F8F4] hover:bg-[#EAEFE6] dark:bg-[#1A2315] dark:hover:bg-[#232F1A]'
          }`}
          title={isDropUpOpen ? "Close preferences" : "Theme & Sign Out Options"}
          aria-label="Toggle Preferences and Sign Out Drop-Up"
        >
          <ChevronUp 
            className={`w-3.5 h-3.5 text-[#656D4A] dark:text-[#A4AC86] transition-transform duration-200 group-hover:scale-110 group-hover:text-[#1B4332] dark:group-hover:text-white ${
              isDropUpOpen ? 'rotate-180 text-[#2D6A4F] dark:text-[#52B788]' : ''
            }`}
          />
        </button>

        {/* Drop-Up Menu (Opens Upward Above Strip) */}
        {isDropUpOpen && (
          <div 
            ref={dropUpRef}
            className={`absolute bottom-full mb-1.5 z-50 bg-white dark:bg-[#1E2718] border border-[#D4DCD0] dark:border-[#333D29] rounded-2xl shadow-2xl p-1.5 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
              effectiveExpanded 
                ? 'left-2 right-2' 
                : 'left-2 w-52'
            }`}
          >
            {/* Theme Toggle Button (Light / Dark Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#4A5543] dark:text-[#C2C5AA] hover:text-[#1F291E] dark:hover:text-white hover:bg-[#F4F6F0] dark:hover:bg-[#2D3923] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                )}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EAEFE6] dark:bg-[#151D10] text-[#2D6A4F] dark:text-[#52B788]">
                {isDark ? 'DARK' : 'LIGHT'}
              </span>
            </button>

            {/* Separator line */}
            <div className="border-t border-[#E8ECE3] dark:border-[#2D3923] my-1" />

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                setIsDropUpOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Area: Active Department & User Profile Info */}
      <div className="p-2 border-t border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF8] dark:bg-[#192215]">
        {effectiveExpanded ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white dark:bg-[#1F291B] border border-[#E2E6D8] dark:border-[#2D3923] shadow-xs select-none">
            {/* Department / User Avatar Tile */}
            <div 
              className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors"
              style={{
                backgroundColor: isDark ? activePalette.badgeBgDark : activePalette.badgeBgLight,
                borderColor: isDark ? '#3A5337' : activePalette.badgeBgLight,
                color: isDark ? activePalette.badgeTextDark : activePalette.gradientStart
              }}
            >
              <DepartmentIcon className="w-4 h-4" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1F291B]" />
            </div>

            {/* User & Department Text */}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1F291E] dark:text-white truncate leading-tight">
                {resolvedUserName}
              </div>
              <div className="text-[10px] font-semibold text-[#656D4A] dark:text-[#A4AC86] uppercase tracking-wider truncate mt-0.5">
                {departmentLabel}
              </div>
            </div>

            {/* Sign Out Action Button on Right Side of Label */}
            <button
              id="sidebar-footer-signout-btn"
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/60 transition-all cursor-pointer shrink-0 group active:scale-95"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
          </div>
        ) : (
          <div 
            className="flex items-center justify-center py-1 select-none"
            title={`${resolvedUserName} • ${departmentLabel} (Click to Sign Out)`}
          >
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer hover:scale-105 group"
              style={{
                backgroundColor: isDark ? activePalette.badgeBgDark : activePalette.badgeBgLight,
                borderColor: isDark ? '#3A5337' : activePalette.badgeBgLight,
                color: isDark ? activePalette.badgeTextDark : activePalette.gradientStart
              }}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <DepartmentIcon className="w-4 h-4 group-hover:hidden" />
              <LogOut className="w-4 h-4 text-rose-500 hidden group-hover:block" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1F291B]" />
            </button>
          </div>
        )}
      </div>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#333D29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Sign Out Confirmation
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-1.5 leading-relaxed">
                  Are you sure you want to sign out of the hospital portal? You will need to enter your password again to log in.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#2F3E29]">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#25331E] border border-slate-200 dark:border-[#38482E] transition-colors cursor-pointer"
              >
                No, Stay Logged In
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Drag-and-Drop Move Confirmation Modal */}
      {pendingSidebarMove && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPendingSidebarMove(null)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#333D29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Confirm Page Move
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-1 leading-relaxed">
                  Are you sure you want to move <strong>"{pendingSidebarMove.page.label}"</strong> into <strong>"{pendingSidebarMove.targetCategoryLabel}"</strong>?
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#2F3E29]">
              <button
                type="button"
                disabled={sidebarMoveLoading}
                onClick={() => setPendingSidebarMove(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#25331E] border border-slate-200 dark:border-[#38482E] transition-colors cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                disabled={sidebarMoveLoading}
                onClick={handleConfirmSidebarMove}
                className="clinical-button-primary px-4 py-2 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {sidebarMoveLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Moving...</span>
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
    </aside>
  );
};
