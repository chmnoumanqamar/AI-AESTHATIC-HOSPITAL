import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export interface ModuleNavDef {
  id: string;
  label: string;
  category: 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN';
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

  // System Administration
  { id: 'admin_users', label: 'User Access Control', category: 'ADMIN', categoryLabel: 'System Administration', icon: Users },
  { id: 'admin_audit', label: 'Audit Vault', category: 'ADMIN', categoryLabel: 'System Administration', icon: ShieldCheck },
  { id: 'admin_queue', label: 'Live System Queue Monitor', category: 'ADMIN', categoryLabel: 'System Administration', icon: Activity },
  { id: 'admin_reports', label: 'Executive Analytics & BI', category: 'ADMIN', categoryLabel: 'System Administration', icon: BarChart3 },
  { id: 'admin_database', label: 'Database Clear & Reset', category: 'ADMIN', categoryLabel: 'System Administration', icon: Database },
  { id: 'admin_config', label: 'System Policies', category: 'ADMIN', categoryLabel: 'System Administration', icon: Settings },
  { id: 'admin_ledger', label: 'Hospital Ledger', category: 'ADMIN', categoryLabel: 'System Administration', icon: CreditCard },
];

export const ROLE_DEFAULT_IDS: Record<string, string[]> = {
  DOCTOR: ['doctor_queue', 'doctor_consultation', 'doctor_tokens'],
  RECEPTIONIST: ['recep_desk', 'recep_approvals', 'recep_pos', 'recep_reports'],
  PATIENT: ['patient_portal', 'patient_booking', 'patient_history', 'patient_billing'],
  ADMIN: ALL_HOSPITAL_MODULES.map(m => m.id),
};

interface StructuralRailNavProps {
  currentRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
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

  // Compute active modules based on permissions
  let visibleModules: ModuleNavDef[] = [];

  if (currentRole === 'ADMIN') {
    // Admin sees ALL modules across all domains
    visibleModules = ALL_HOSPITAL_MODULES;
  } else if (currentUser?.allowedModules && Array.isArray(currentUser.allowedModules) && currentUser.allowedModules.length > 0) {
    // User has custom granular permissions assigned by Admin
    visibleModules = ALL_HOSPITAL_MODULES.filter(m => currentUser.allowedModules.includes(m.id));
  } else {
    // Fallback to role defaults
    const defaultIds = ROLE_DEFAULT_IDS[currentRole] || [];
    visibleModules = ALL_HOSPITAL_MODULES.filter(m => defaultIds.includes(m.id));
  }

  // Group modules by category for clean structure
  const categories: { key: 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN'; label: string; items: ModuleNavDef[] }[] = [
    { key: 'CLINICAL' as const, label: 'Clinical Deck', items: visibleModules.filter(m => m.category === 'CLINICAL') },
    { key: 'RECEPTION' as const, label: 'Front-Desk & Reception', items: visibleModules.filter(m => m.category === 'RECEPTION') },
    { key: 'PATIENT' as const, label: 'Patient Services', items: visibleModules.filter(m => m.category === 'PATIENT') },
    { key: 'ADMIN' as const, label: 'System Administration', items: visibleModules.filter(m => m.category === 'ADMIN') },
  ].filter(cat => cat.items.length > 0);

  const hasMultipleCategories = categories.length > 1;

  return (
    <aside
      className={`h-screen flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none shadow-sm bg-white dark:bg-[#1A2215] text-[#1F291E] dark:text-[#F6F7F2] border-r border-[#E2E6D8] dark:border-[#333D29] ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Brand Header with Top 3-Lines Toggle */}
      <div className="flex flex-col min-h-0 flex-1">
        <div 
          className={`h-16 flex items-center border-b border-[#E2E6D8] dark:border-[#333D29] shrink-0 ${isExpanded ? 'justify-between px-3.5' : 'justify-center'}`}
        >
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div 
                  className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                  style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
                >
                  <Hospital className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden whitespace-nowrap">
                  <span className="font-extrabold text-sm tracking-tight text-[#1F291E] dark:text-white block">
                    Aesthetic Hospital
                  </span>
                  <span 
                    className="text-[10px] uppercase tracking-wider font-semibold block flex items-center gap-1"
                    style={{ color: '#2D6A4F' }}
                  >
                    <span>{currentRole} WORKSPACE</span>
                    {currentUser?.allowedModules && currentUser.allowedModules.length > 0 && currentRole !== 'ADMIN' && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
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
                title="Collapse Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-lg text-[#656D4A] hover:text-[#1F291E] hover:bg-[#F0F3EB] dark:text-[#C2C5AA] dark:hover:text-white dark:hover:bg-[#2D3923] transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
          {categories.map((cat, catIdx) => (
            <div key={cat.key} className="space-y-1">
              {/* Category Header */}
              {isExpanded && hasMultipleCategories && (
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#656D4A] dark:text-[#A4AC86] flex items-center justify-between border-t border-[#E2E6D8]/40 dark:border-[#333D29]/40 first:border-0 first:pt-0">
                  <span>{cat.label}</span>
                  <span className="text-[9px] font-mono opacity-60">({cat.items.length})</span>
                </div>
              )}

              {/* Modules in this category */}
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#E8F3EB] dark:bg-[#2D3923] text-[#1B4332] dark:text-white font-bold border border-[#A7D7C5] dark:border-[#406343] shadow-xs'
                        : 'text-[#4A5543] hover:text-[#1F291E] hover:bg-[#F4F6F0] dark:text-[#C2C5AA] dark:hover:text-white dark:hover:bg-[#2D3923]/60'
                    }`}
                    title={!isExpanded ? `${item.label} (${cat.label})` : undefined}
                  >
                    <Icon 
                      className="w-4 h-4 shrink-0 transition-colors" 
                      style={{ color: isActive ? '#2D6A4F' : undefined }}
                    />
                    {isExpanded && <span className="truncate text-left">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}

          {visibleModules.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-[#A4AC86]">
              No active modules assigned to your account.
            </div>
          )}
        </nav>
      </div>

      {/* Footer Controls: Only Sign Out */}
      <div className="p-2 border-t border-[#E2E6D8] dark:border-[#333D29]">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#4A5543] hover:text-[#DC2626] hover:bg-[#FEF2F2] dark:text-[#C2C5AA] dark:hover:text-white dark:hover:bg-[#7F4F24]/30 transition-all cursor-pointer ${
            !isExpanded ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className={`w-4 h-4 shrink-0 transition-transform duration-300 ${!isExpanded ? 'rotate-180' : ''}`} />
          {isExpanded && <span>Sign Out</span>}
        </button>
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
    </aside>
  );
};
