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
  Database
} from 'lucide-react';

interface StructuralRailNavProps {
  currentRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLogout: () => void;
}

export const StructuralRailNav: React.FC<StructuralRailNavProps> = ({
  currentRole,
  currentTab,
  onSelectTab,
  isExpanded,
  onToggleExpand,
  onLogout
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Only real, working, verified functions per role
  const navItems = [
    // Doctor
    ...(currentRole === 'DOCTOR'
      ? [
          { id: 'doctor_queue', label: "Today's Queue", icon: Activity },
          { id: 'doctor_consultation', label: 'Consultations & Rx', icon: FileText },
          { id: 'doctor_tokens', label: 'Token Matrix', icon: LayoutDashboard },
        ]
      : []),

    // Receptionist
    ...(currentRole === 'RECEPTIONIST'
      ? [
          { id: 'recep_desk', label: 'Queue & Check-In', icon: LayoutDashboard },
          { id: 'recep_approvals', label: 'Pending Bookings', icon: CalendarCheck },
          { id: 'recep_pos', label: 'Front-Desk POS', icon: CreditCard },
          { id: 'recep_reports', label: 'Reports & Analytics', icon: BarChart3 },
        ]
      : []),

    // Patient
    ...(currentRole === 'PATIENT'
      ? [
          { id: 'patient_portal', label: 'My Appointments', icon: CalendarCheck },
          { id: 'patient_booking', label: 'Book Appointment', icon: Activity },
          { id: 'patient_history', label: 'Medical Records & Rx', icon: FileText },
          { id: 'patient_billing', label: 'Billing & Invoices', icon: CreditCard },
        ]
      : []),

    // Admin
    ...(currentRole === 'ADMIN'
      ? [
          { id: 'admin_users', label: 'User Access Control', icon: Users },
          { id: 'admin_audit', label: 'Audit Vault', icon: ShieldCheck },
          { id: 'admin_queue', label: 'Live Queue Monitor', icon: Activity },
          { id: 'admin_reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'admin_database', label: 'Database Clear & Reset', icon: Database },
          { id: 'admin_config', label: 'System Policies', icon: Settings },
          { id: 'admin_ledger', label: 'Hospital Ledger', icon: CreditCard },
        ]
      : []),
  ];

  return (
    <aside
      className={`h-screen flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none shadow-sm bg-white dark:bg-[#1A2215] text-[#1F291E] dark:text-[#F6F7F2] border-r border-[#E2E6D8] dark:border-[#333D29] ${
        isExpanded ? 'w-60' : 'w-16'
      }`}
    >
      {/* Brand Header with Top 3-Lines (Hamburger) Toggle */}
      <div>
        <div 
          className={`h-16 flex items-center border-b border-[#E2E6D8] dark:border-[#333D29] ${isExpanded ? 'justify-between px-3.5' : 'justify-center'}`}
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
                    className="text-[10px] uppercase tracking-wider font-semibold block"
                    style={{ color: '#2D6A4F' }}
                  >
                    {currentRole} WORKSPACE
                  </span>
                </div>
              </div>

              {/* 3-Lines Menu Button at Top */}
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

        {/* Navigation List */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E8F3EB] dark:bg-[#2D3923] text-[#1B4332] dark:text-white font-bold border border-[#A7D7C5] dark:border-[#406343] shadow-xs'
                    : 'text-[#4A5543] hover:text-[#1F291E] hover:bg-[#F4F6F0] dark:text-[#C2C5AA] dark:hover:text-white dark:hover:bg-[#2D3923]/60'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon 
                  className="w-4 h-4 shrink-0 transition-colors" 
                  style={{ color: isActive ? '#2D6A4F' : undefined }}
                />
                {isExpanded && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
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
