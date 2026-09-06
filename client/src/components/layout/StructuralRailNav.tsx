import React from 'react';
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
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#4A5543] hover:text-[#DC2626] hover:bg-[#FEF2F2] dark:text-[#C2C5AA] dark:hover:text-white dark:hover:bg-[#7F4F24]/30 transition-all cursor-pointer ${
            !isExpanded ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className={`w-4 h-4 shrink-0 transition-transform duration-300 ${!isExpanded ? 'rotate-180' : ''}`} />
          {isExpanded && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
