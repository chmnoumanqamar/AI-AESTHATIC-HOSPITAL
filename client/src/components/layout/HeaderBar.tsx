import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Sparkles,
  Search,
  User,
  BarChart3,
  Layers,
  Database,
  CreditCard,
  ArrowUpRight,
  Command,
  Users,
  Palette,
  Check
} from 'lucide-react';
import { ALL_HOSPITAL_MODULES, getStoredHierarchy, ModuleNavDef } from './StructuralRailNav';
import { api } from '../../services/api';
import { THEME_COLOR_OPTIONS, getStoredThemeColor, applyThemeColor } from '../../utils/themePalette';

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

  // Dynamic Omnibar Search State for Admin Panel
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'WINDOW' | 'PATIENT' | 'REPORT' | 'SYSTEM'>('ALL');
  const [patients, setPatients] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load patients from API or fallback
  useEffect(() => {
    let isMounted = true;
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patient');
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setPatients(res.data.data);
        }
      } catch {
        if (isMounted) {
          setPatients([
            { id: 'pat-01', fullName: 'John Doe', cnic: '35201-1234567-1', phone: '+15551234567', gender: 'Male' },
            { id: 'pat-02', fullName: 'Sarah Connor', cnic: '35201-7654321-2', phone: '+15559876543', gender: 'Female' },
            { id: 'pat-03', fullName: 'Robert Taylor', cnic: '35201-9988776-3', phone: '+15559990003', gender: 'Male' }
          ]);
        }
      }
    };
    fetchPatients();
    return () => { isMounted = false; };
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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

  // Click outside to close search popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // Color Palette Popover State & Listener
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteContainerRef = useRef<HTMLDivElement>(null);
  const [activeColorId, setActiveColorId] = useState<string>(getStoredThemeColor);

  useEffect(() => {
    const handlePaletteEvent = (e: any) => {
      if (e.detail?.id) {
        setActiveColorId(e.detail.id);
      }
    };
    window.addEventListener('hospital_theme_color_changed', handlePaletteEvent);
    return () => window.removeEventListener('hospital_theme_color_changed', handlePaletteEvent);
  }, []);

  // Click outside to close palette popover
  useEffect(() => {
    const handleClickOutsidePalette = (event: MouseEvent) => {
      if (paletteContainerRef.current && !paletteContainerRef.current.contains(event.target as Node)) {
        setIsPaletteOpen(false);
      }
    };
    if (isPaletteOpen) {
      document.addEventListener('mousedown', handleClickOutsidePalette);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsidePalette);
  }, [isPaletteOpen]);

  const handleSelectColor = (colorId: string) => {
    setActiveColorId(colorId);
    applyThemeColor(colorId);
    setIsPaletteOpen(false);
  };

  const currentPalette = THEME_COLOR_OPTIONS.find(c => c.id === activeColorId) || THEME_COLOR_OPTIONS[0];

  // Search Items Universe for Admin Omnibar
  const allSearchItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'WINDOW' | 'PATIENT' | 'REPORT' | 'SYSTEM';
      categoryLabel: string;
      targetTab: string;
      icon: any;
      badge?: string;
      keywords?: string[];
      patientData?: any;
    }> = [];

    // 1. All Navigation Windows & Modules
    let currentModules: ModuleNavDef[] = ALL_HOSPITAL_MODULES;
    try {
      currentModules = getStoredHierarchy();
    } catch {}

    currentModules.forEach(m => {
      const extraKeywords = m.id === 'admin_config' 
        ? ['format', 'color', 'font', 'theme', 'appearance', 'settings', 'window format', 'typography', 'customization'] 
        : [];
      items.push({
        id: `window-${m.id}`,
        title: m.label,
        subtitle: `${m.categoryLabel} • Switch to window`,
        category: 'WINDOW',
        categoryLabel: 'Windows',
        targetTab: m.id,
        icon: m.icon || Layers,
        badge: m.category,
        keywords: [m.id, m.categoryLabel, 'window', 'view', 'module', 'deck', 'tab', ...extraKeywords]
      });
    });

    // 2. Predefined Reports & BI Analytics
    const reportsDef = [
      { id: 'rep-rev', title: 'Daily Revenue & Billing Analytics', subtitle: 'POS collections, cash vs card & fiscal receipts', tab: 'admin_reports', icon: BarChart3, badge: 'Revenue' },
      { id: 'rep-tokens', title: 'Patient Inflow & Token Turnaround', subtitle: 'Hourly patient arrival, wait times & bottlenecks', tab: 'admin_reports', icon: Activity, badge: 'Flow' },
      { id: 'rep-dept', title: 'Department & Specialist Performance', subtitle: 'Doctor consultation volume & triage KPIs', tab: 'admin_reports', icon: BarChart3, badge: 'Clinical' },
      { id: 'rep-bed', title: 'Bed Occupancy & Ward Ratios', subtitle: 'Inpatient admission capacity & discharge rates', tab: 'admin_reports', icon: FileText, badge: 'Wards' },
      { id: 'rep-ledger', title: 'Hospital Double-Entry Ledger', subtitle: 'General accounts, debit/credit journal entries', tab: 'admin_ledger', icon: CreditCard, badge: 'Finance' },
      { id: 'rep-audit', title: 'Audit Trail Cryptographic Logs', subtitle: 'Immutable SHA-256 ledger tamper-proof records', tab: 'admin_audit', icon: ShieldCheck, badge: 'Security' }
    ];

    reportsDef.forEach(r => {
      items.push({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        category: 'REPORT',
        categoryLabel: 'Reports & BI',
        targetTab: r.tab,
        icon: r.icon,
        badge: r.badge,
        keywords: ['report', 'analytics', 'bi', 'chart', 'metric', 'export', 'summary', 'data', 'finance']
      });
    });

    // 3. System Tools & Policies
    const systemTools = [
      { id: 'sys-users', title: 'User Access Control Vault', subtitle: 'Manage staff credentials, RBAC roles & accounts', tab: 'admin_users', icon: Users, badge: 'Staff' },
      { id: 'sys-studio', title: 'Module & Page Studio', subtitle: 'Drag-and-drop structural hierarchy & sidebar', tab: 'admin_studio', icon: Layers, badge: 'Studio' },
      { id: 'sys-policy', title: 'Hospital Policies & Quotas', subtitle: 'Token thresholds, cancellation rules & timing', tab: 'admin_config', icon: Settings, badge: 'Policy' },
      { id: 'sys-db', title: 'Database Clear & System Maintenance', subtitle: 'Inspect table counts, verify hashes & factory reset', tab: 'admin_database', icon: Database, badge: 'Database' },
      { id: 'sys-queue', title: 'Live System Queue Monitor', subtitle: 'Real-time multi-department waiting queue matrix', tab: 'admin_queue', icon: Activity, badge: 'Queue' }
    ];

    systemTools.forEach(s => {
      items.push({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        category: 'SYSTEM',
        categoryLabel: 'System & Tools',
        targetTab: s.tab,
        icon: s.icon,
        badge: s.badge,
        keywords: ['system', 'config', 'security', 'tool', 'setting', 'admin', 'maintenance', 'reset']
      });
    });

    // 4. Patients
    patients.forEach(p => {
      items.push({
        id: `pat-${p.id || p.cnic}`,
        title: p.fullName || 'Registered Patient',
        subtitle: `MRN: ${p.cnic || p.id} • Phone: ${p.phone || p.emergencyContact || 'N/A'}`,
        category: 'PATIENT',
        categoryLabel: 'Patients',
        targetTab: 'admin_queue',
        icon: User,
        badge: p.gender || 'Patient',
        keywords: [p.fullName, p.cnic, p.phone, p.emergencyContact, 'patient', 'medical', 'record', 'token', 'triage'],
        patientData: p
      });
    });

    return items;
  }, [patients]);

  const filteredResults = useMemo(() => {
    let list = allSearchItems;
    if (searchCategory !== 'ALL') {
      list = list.filter(item => item.category === searchCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return list.slice(0, 8);
    }

    return list.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchBadge = item.badge?.toLowerCase().includes(q);
      const matchTab = item.targetTab.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some(k => k && k.toLowerCase().includes(q));
      return matchTitle || matchSub || matchBadge || matchTab || matchKeywords;
    }).slice(0, 15);
  }, [allSearchItems, searchQuery, searchCategory]);

  const handleSelectSearchItem = (item: any) => {
    if (onSelectTab && item.targetTab) {
      onSelectTab(item.targetTab);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIndex(prev => (prev + 1) % (filteredResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex(prev => (prev - 1 + (filteredResults.length || 1)) % (filteredResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedSearchIndex]) {
        handleSelectSearchItem(filteredResults[selectedSearchIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

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
      <div className="flex items-center gap-2.5 shrink-0">
        {(currentRole === 'ADMIN' || currentTab?.startsWith('admin_')) ? (
          <div className="flex items-center gap-2.5 select-text">
            {FeatureIcon && (
              <FeatureIcon 
                className="w-5 h-5 shrink-0 header-window-icon" 
                style={{ color: isDark ? currentPalette.badgeTextDark : currentPalette.accent }} 
              />
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
        ) : (
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
                  color: isDark ? currentPalette.badgeTextDark : currentPalette.accent
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
        )}
      </div>

      {/* Right Section: Dynamic Search Bar (just left of bell) + Notification Bell */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {(currentRole === 'ADMIN' || currentTab?.startsWith('admin_')) && (
          <div className="w-64 sm:w-80 md:w-96 relative" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search 
                className="absolute left-3 w-4 h-4 pointer-events-none transition-colors" 
                style={{ color: isDark ? currentPalette.badgeTextDark : currentPalette.accent }} 
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedSearchIndex(0);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search windows, patients, reports... (Ctrl+K)"
                className="w-full pl-9 pr-16 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 focus:outline-none shadow-2xs"
                style={{
                  backgroundColor: isDark ? '#26311E' : '#F6F7F2',
                  borderColor: isDark ? (isSearchOpen ? currentPalette.accent : '#3E4D34') : (isSearchOpen ? currentPalette.accent : '#DDE3D5'),
                  color: isDark ? '#FFFFFF' : '#111827',
                  boxShadow: isSearchOpen ? (isDark ? `0 0 0 3px ${currentPalette.accent}40` : `0 0 0 3px ${currentPalette.accent}25`) : 'none'
                }}
              />
              <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pointer-events-auto cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span 
                    className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded border font-mono"
                    style={{
                      backgroundColor: isDark ? '#1C2416' : '#FFFFFF',
                      borderColor: isDark ? '#3D5235' : '#D0D7C9',
                      color: isDark ? '#A4AC86' : '#656D4A'
                    }}
                  >
                    <kbd>Ctrl</kbd> <kbd>K</kbd>
                  </span>
                )}
              </div>
            </div>

            {/* Search Results Dropdown Popover */}
            {isSearchOpen && (
              <div 
                className="absolute right-0 top-12 w-[380px] sm:w-[440px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[460px]"
                style={{
                  backgroundColor: isDark ? '#1F2718' : '#FFFFFF',
                  borderColor: isDark ? '#3E4D34' : '#DDE3D5'
                }}
              >
                {/* Category Filter Tabs */}
                <div 
                  className="p-2 px-3 border-b flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold shrink-0"
                  style={{
                    backgroundColor: isDark ? '#26311E' : '#FAFBF8',
                    borderColor: isDark ? '#3E4D34' : '#E8ECE3'
                  }}
                >
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'WINDOW', label: 'Windows' },
                    { id: 'PATIENT', label: 'Patients' },
                    { id: 'REPORT', label: 'Reports' },
                    { id: 'SYSTEM', label: 'System' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSearchCategory(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        searchCategory === tab.id
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2F3C26]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Result List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2F3C26] max-h-[350px]">
                  {filteredResults.length === 0 ? (
                    <div className="py-10 px-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No results found for <span className="font-bold text-slate-700 dark:text-slate-300">"{searchQuery}"</span>
                    </div>
                  ) : (
                    filteredResults.map((item, idx) => {
                      const ItemIcon = item.icon || Layers;
                      const isSelected = idx === selectedSearchIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSearchItem(item)}
                          onMouseEnter={() => setSelectedSearchIndex(idx)}
                          className={`p-3 px-4 transition-all duration-150 cursor-pointer flex items-center gap-3 group ${
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-[#283823]'
                              : 'hover:bg-slate-50 dark:hover:bg-[#232D1C]'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                            style={{
                              backgroundColor: isSelected 
                                ? (isDark ? '#2D3F28' : '#E8F3EB') 
                                : (isDark ? '#1A2214' : '#F6F7F2'),
                              borderColor: isSelected 
                                ? (isDark ? '#52B788' : '#74C69D') 
                                : (isDark ? '#2F3C26' : '#E2E6D8'),
                              color: isDark ? '#A4AC86' : '#2D6A4F'
                            }}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span 
                                className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.badge && (
                                <span 
                                  className="text-[10px] font-bold px-1.5 py-0.2 rounded font-mono uppercase shrink-0"
                                  style={{
                                    backgroundColor: isDark ? '#2F3C26' : '#E8ECE3',
                                    color: isDark ? '#C2C5AA' : '#414833'
                                  }}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            <span className="text-[10px] font-semibold hidden group-hover:inline">Open</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Guide */}
                <div 
                  className="p-2 px-4 border-t flex items-center justify-between text-[10.5px] font-medium text-slate-400 dark:text-slate-500 shrink-0"
                  style={{
                    backgroundColor: isDark ? '#232D1B' : '#F9FAF7',
                    borderColor: isDark ? '#3E4D34' : '#E8ECE3'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>Use <kbd className="px-1 py-0.2 rounded border bg-white dark:bg-[#1E2718] font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.2 rounded border bg-white dark:bg-[#1E2718] font-mono text-[10px]">↓</kbd> to navigate</span>
                    <span>•</span>
                    <span><kbd className="px-1 py-0.2 rounded border bg-white dark:bg-[#1E2718] font-mono text-[10px]">↵</kbd> to select</span>
                  </div>
                  <span><kbd className="px-1 py-0.2 rounded border bg-white dark:bg-[#1E2718] font-mono text-[10px]">Esc</kbd> to close</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Color Palette Popover between Search Bar and Bell Icon */}
        <div className="relative flex items-center" ref={paletteContainerRef}>
          <button
            id="header-color-palette-btn"
            type="button"
            onClick={() => setIsPaletteOpen(prev => !prev)}
            className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 shadow-2xs cursor-pointer active:scale-95 group ${
              isPaletteOpen ? 'ring-2 ring-emerald-500/50' : 'hover:border-[#2D6A4F] dark:hover:border-[#A4AC86]'
            }`}
            style={{
              backgroundColor: isDark ? '#2D3923' : '#FFFFFF',
              borderColor: isPaletteOpen ? (isDark ? '#52796F' : '#2D6A4F') : (isDark ? '#414833' : '#E2E6D8'),
              color: isDark ? '#F6F7F2' : '#1F291E'
            }}
            title={`Color Palette (${currentPalette.name})`}
            aria-label="Theme Color Palette"
          >
            <Palette className="w-4 h-4 transition-transform group-hover:rotate-12" style={{ color: currentPalette.dotColor }} />
            <span 
              className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#2D3923] shadow-xs"
              style={{ backgroundColor: currentPalette.dotColor }}
            />
          </button>

          {/* Palette Dropdown Popover */}
          {isPaletteOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-xl p-3 space-y-2.5 z-50 animate-fade-in select-none"
              style={{
                backgroundColor: isDark ? '#1F2718' : '#FFFFFF',
                borderColor: isDark ? '#3D5235' : '#DDE3D5'
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-brand-200 dark:border-[#2F3E29]">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" style={{ color: currentPalette.dotColor }} />
                  <span className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">Theme Color Palette</span>
                </div>
                <span className="text-[10px] font-mono text-[#656D4A] dark:text-[#A4AC86]">
                  {currentPalette.name.split('&')[0].trim()}
                </span>
              </div>

              <div className="space-y-1">
                {THEME_COLOR_OPTIONS.map(c => {
                  const isSelected = activeColorId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectColor(c.id)}
                      className={`w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-100/50 dark:bg-[#232E1D] shadow-xs'
                          : 'border-transparent hover:border-brand-200 dark:hover:border-[#2F3E29] hover:bg-brand-50/60 dark:hover:bg-[#151D12]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-5 h-5 rounded-full shadow-xs shrink-0 flex items-center justify-center text-white"
                          style={{ background: `linear-gradient(135deg, ${c.gradientStart} 0%, ${c.gradientEnd} 100%)` }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#1F291E] dark:text-[#F6F7F2] truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-[#656D4A] dark:text-[#A4AC86] truncate">
                            {c.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
          <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" style={{ color: isDark ? currentPalette.badgeTextDark : currentPalette.accent }} />
          
          {/* Dynamic Unread Badge */}
          {unreadCount > 0 ? (
            <span 
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#1F2718] animate-pulse"
              style={{ backgroundColor: currentPalette.accent }}
            >
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
      </div>
    </header>
  );
};
