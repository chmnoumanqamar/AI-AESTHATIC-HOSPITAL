import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Settings, 
  FileText, 
  X,
  Sparkles
} from 'lucide-react';
import { ALL_HOSPITAL_MODULES, getStoredHierarchy } from './StructuralRailNav';

export interface HospitalNotification {
  id: string;
  title: string;
  description: string;
  targetTab: string;
  targetWindowLabel: string;
  category: 'SECURITY' | 'QUEUE' | 'AUDIT' | 'POLICY' | 'CLINICAL';
  timestamp: string;
  unread: boolean;
  roleScope?: ('ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST')[];
}

const INITIAL_NOTIFICATIONS: HospitalNotification[] = [
  {
    id: 'notif-1',
    title: 'System Policies Alert',
    description: "Daily patient token threshold & auto-cancellation policies require verification.",
    targetTab: 'admin_config',
    targetWindowLabel: 'System Policies',
    category: 'POLICY',
    timestamp: '5m ago',
    unread: true,
    roleScope: ['ADMIN']
  },
  {
    id: 'notif-2',
    title: 'High Queue Congestion',
    description: 'OPD Queue load exceeded 15 patients waiting. Token T-104 waiting over 25 minutes.',
    targetTab: 'admin_queue',
    targetWindowLabel: 'Live System Queue Monitor',
    category: 'QUEUE',
    timestamp: '14m ago',
    unread: true,
    roleScope: ['ADMIN', 'RECEPTIONIST']
  },
  {
    id: 'notif-3',
    title: 'User Access Authorization',
    description: 'New staff credential review pending for Clinical Dispensary Pharmacist.',
    targetTab: 'admin_users',
    targetWindowLabel: 'User Access Control',
    category: 'SECURITY',
    timestamp: '32m ago',
    unread: true,
    roleScope: ['ADMIN']
  },
  {
    id: 'notif-4',
    title: 'Prescription Revision Audit',
    description: 'Prescription PRX-9082 revised: "Dosage adjusted from 500mg to 250mg TDS".',
    targetTab: 'admin_audit',
    targetWindowLabel: 'Audit Vault',
    category: 'AUDIT',
    timestamp: '1h ago',
    unread: false,
    roleScope: ['ADMIN']
  },
  {
    id: 'notif-5',
    title: 'Executive BI Analytics Ready',
    description: 'Today\'s hospital bed utilization, revenue, and token turnaround charts generated.',
    targetTab: 'admin_reports',
    targetWindowLabel: 'Executive Analytics & BI',
    category: 'POLICY',
    timestamp: '2h ago',
    unread: false,
    roleScope: ['ADMIN']
  },
  {
    id: 'notif-6',
    title: 'New Patient Triage Check-In',
    description: 'Token T-108 checked in and assigned to General Consultation Queue.',
    targetTab: 'doctor_queue',
    targetWindowLabel: "Today's Clinical Queue",
    category: 'CLINICAL',
    timestamp: '7m ago',
    unread: true,
    roleScope: ['DOCTOR']
  },
  {
    id: 'notif-7',
    title: 'Dispense Queue Alert',
    description: 'Prescription pending urgent dispense verification at Dispensary Counter 1.',
    targetTab: 'pharma_queue',
    targetWindowLabel: 'Live Dispense Queue',
    category: 'CLINICAL',
    timestamp: '18m ago',
    unread: true,
    roleScope: ['PHARMACIST']
  }
];

interface HeaderBarProps {
  currentUser?: any;
  currentRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onSwitchRole?: (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST') => void;
  isolatedPort?: string | null;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  currentRole,
  currentTab,
  onSelectTab,
  onSwitchRole,
  isolatedPort
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hospital_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [notifications, setNotifications] = useState<HospitalNotification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hospital_notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hospital_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hospital_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      if (e.detail) {
        setIsDark(e.detail === 'dark');
      }
    };
    window.addEventListener('hospital_theme_changed', handleThemeEvent);
    return () => window.removeEventListener('hospital_theme_changed', handleThemeEvent);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hospital_notifications', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Click outside to close notification window
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getFeatureDetails = () => {
    if (currentTab === 'admin_users') {
      return { label: 'Master User Access & Permission Vault', icon: ShieldCheck };
    }

    try {
      const stored = getStoredHierarchy();
      const found = stored.find(m => m.id === currentTab);
      if (found) return { label: found.label, icon: found.icon };
    } catch {
      // fallback
    }

    const fallback = ALL_HOSPITAL_MODULES.find(m => m.id === currentTab);
    if (fallback) return { label: fallback.label, icon: fallback.icon };

    if (currentTab) {
      const formatted = currentTab
        .replace(/^(admin_|doctor_|recep_|patient_|pharma_)/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      return { label: formatted, icon: null };
    }

    return { label: 'System Policies', icon: null };
  };

  const feature = getFeatureDetails();
  const FeatureIcon = feature.icon;

  // Filter notifications for active role
  const roleNotifications = notifications.filter(
    n => !n.roleScope || n.roleScope.includes(currentRole)
  );

  const unreadCount = roleNotifications.filter(n => n.unread).length;

  const handleNotificationClick = (notif: HospitalNotification) => {
    // Mark this notification as read
    setNotifications(prev =>
      prev.map(n => (n.id === notif.id ? { ...n, unread: false } : n))
    );

    // Close notification popover
    setIsOpen(false);

    // Navigate to target window
    if (onSelectTab && notif.targetTab) {
      onSelectTab(notif.targetTab);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev =>
      prev.map(n =>
        !n.roleScope || n.roleScope.includes(currentRole)
          ? { ...n, unread: false }
          : n
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'POLICY':
        return <Settings className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'QUEUE':
        return <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'AUDIT':
        return <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <header 
      className="h-16 px-6 flex items-center justify-between shrink-0 select-none border-b shadow-xs z-20 transition-colors duration-200 relative"
      style={{ 
        backgroundColor: isDark ? '#1F2718' : '#FFFFFF', 
        borderColor: isDark ? '#333D29' : '#E2E6D8' 
      }}
    >
      {/* Left: Feature Window Title */}
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-200 select-none shadow-xs"
          style={{
            backgroundColor: isDark ? '#232F1C' : '#FFFFFF',
            borderColor: isDark ? '#3D5033' : '#D4DCD0',
            boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(45,106,79,0.06)'
          }}
        >
          {FeatureIcon && (
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: isDark ? '#1B2615' : '#EBF4EE',
                borderColor: isDark ? '#3D5235' : '#C7DDCF',
                color: isDark ? '#74C69D' : '#2D6A4F'
              }}
            >
              <FeatureIcon className="w-4.5 h-4.5" />
            </div>
          )}
          <span 
            className="text-base sm:text-lg font-black tracking-tight select-text"
            style={{ 
              color: isDark ? '#FFFFFF' : '#111827',
              letterSpacing: '-0.02em'
            }}
          >
            {feature.label}
          </span>
        </div>
      </div>

      {/* Right: Bell Icon with Interactive Sub-Window Popover */}
      <div className="relative flex items-center" ref={popoverRef}>
        <button
          id="header-notification-btn"
          onClick={() => setIsOpen(prev => !prev)}
          className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 shadow-2xs cursor-pointer active:scale-95 group ${
            isOpen ? 'ring-2 ring-emerald-500/50 border-[#2D6A4F]' : 'hover:border-[#2D6A4F] dark:hover:border-[#A4AC86]'
          }`}
          style={{
            backgroundColor: isDark ? '#2D3923' : '#FFFFFF',
            borderColor: isOpen ? (isDark ? '#52796F' : '#2D6A4F') : (isDark ? '#414833' : '#E2E6D8'),
            color: isDark ? '#F6F7F2' : '#1F291E'
          }}
          title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          aria-label="Notifications"
          aria-expanded={isOpen}
        >
          <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" style={{ color: isDark ? '#A4AC86' : '#2D6A4F' }} />
          
          {/* Dynamic Unread Badge */}
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 dark:bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#1F2718] animate-pulse">
              {unreadCount}
            </span>
          ) : (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
        </button>

        {/* Floating Notification Sub-Window Popover */}
        {isOpen && (
          <div 
            id="notifications-sub-window"
            className="absolute right-0 top-12 w-[340px] sm:w-[410px] max-h-[520px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              backgroundColor: isDark ? '#1F2718' : '#FFFFFF',
              borderColor: isDark ? '#3E4D34' : '#DDE3D5'
            }}
          >
            {/* Popover Header */}
            <div 
              className="p-3.5 px-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: isDark ? '#26311E' : '#F9FAF7',
                borderColor: isDark ? '#3E4D34' : '#E8ECE3'
              }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#2D6A4F] dark:text-[#A4AC86]" />
                <span className="font-bold text-sm tracking-tight" style={{ color: isDark ? '#F6F7F2' : '#1F291E' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#2D6A4F] dark:text-[#A4AC86] hover:underline px-2 py-1 rounded cursor-pointer transition-colors"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2D3923] transition-colors cursor-pointer"
                  title="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2F3C26] max-h-[380px]">
              {roleNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No notifications to display
                </div>
              ) : (
                roleNotifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 px-4 transition-all duration-150 cursor-pointer flex gap-3 group items-start ${
                      notif.unread
                        ? 'bg-emerald-50/40 dark:bg-[#243320]/60 hover:bg-emerald-50 dark:hover:bg-[#283B24]'
                        : 'hover:bg-slate-50/80 dark:hover:bg-[#232D1C]'
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div 
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border shadow-2xs mt-0.5 ${
                        notif.unread 
                          ? 'bg-white dark:bg-[#1C2416] border-emerald-300 dark:border-[#385230]' 
                          : 'bg-slate-100 dark:bg-[#1A2214] border-slate-200 dark:border-[#2F3C26]'
                      }`}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span 
                          className={`text-xs font-bold truncate ${
                            notif.unread 
                              ? 'text-slate-900 dark:text-white' 
                              : 'text-slate-700 dark:text-slate-300 font-semibold'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-[11.5px] leading-snug mt-1 text-slate-600 dark:text-slate-300 line-clamp-2">
                        {notif.description}
                      </p>

                      {/* Click Target Prompt */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#2D6A4F] dark:text-[#A4AC86] group-hover:translate-x-0.5 transition-transform">
                          <span>Open {notif.targetWindowLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>

                        {notif.unread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Popover Footer */}
            <div 
              className="p-2.5 px-4 text-center border-t text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              style={{
                backgroundColor: isDark ? '#232D1B' : '#F9FAF7',
                borderColor: isDark ? '#3E4D34' : '#E8ECE3'
              }}
            >
              Click any notification to switch directly to that window
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
