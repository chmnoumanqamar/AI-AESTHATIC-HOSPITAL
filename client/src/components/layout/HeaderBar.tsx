import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Moon, Stethoscope, ClipboardList, User, ShieldCheck } from 'lucide-react';

interface HeaderBarProps {
  currentUser?: any;
  currentRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  onSwitchRole: (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') => void;
  isolatedPort?: string | null;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  currentRole,
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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hospital_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hospital_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getRoleDisplayName = () => {
    if (currentUser?.profile?.name) return currentUser.profile.name;
    if (currentUser?.name) return currentUser.name;
    if (currentUser?.fullName) return currentUser.fullName;

    switch (currentRole) {
      case 'DOCTOR':
        return 'Dr. Aisha Khan';
      case 'RECEPTIONIST':
        return 'Sarah Jenkins';
      case 'PATIENT':
        return 'John Doe';
      case 'ADMIN':
        return 'System Administrator';
      default:
        return 'Operator';
    }
  };

  const getRoleSubtitle = () => {
    switch (currentRole) {
      case 'DOCTOR':
        return currentUser?.profile?.specialization || 'Cardiology & Internal Medicine';
      case 'RECEPTIONIST':
        return 'Hospital Receptionist & Patient Triage';
      case 'PATIENT':
        return 'Patient Portal';
      case 'ADMIN':
        return 'System Operations & Compliance';
      default:
        return currentRole;
    }
  };

  return (
    <header 
      className="h-16 px-6 flex items-center justify-between shrink-0 select-none border-b shadow-xs z-20 transition-colors duration-200"
      style={{ 
        backgroundColor: isDark ? '#1F2718' : '#FFFFFF', 
        borderColor: isDark ? '#333D29' : '#E2E6D8' 
      }}
    >
      {/* Left: Clean Date & Clinic Status */}
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border shadow-2xs transition-colors"
          style={{ 
            backgroundColor: isDark ? '#242E1C' : '#F9FAF7', 
            borderColor: isDark ? '#414833' : '#E2E6D8', 
            color: isDark ? '#F6F7F2' : '#1F291E' 
          }}
        >
          <Calendar className="w-3.5 h-3.5" style={{ color: isDark ? '#A4AC86' : '#2D6A4F' }} />
          <span className="font-semibold" style={{ color: isDark ? '#F6F7F2' : '#1F291E' }}>{todayFormatted}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs pl-2">
          <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: isDark ? '#A4AC86' : '#2D6A4F' }} />
          <span className="font-semibold text-[11px]" style={{ color: isDark ? '#A4AC86' : '#2D6A4F' }}>Clinic Schedule Active</span>
        </div>
      </div>

      {/* Right: Clean Profile & Dark/Light Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* Professional User Profile */}
        <div className="flex items-center gap-2.5 pl-1">
          <div 
            className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shadow-xs transition-colors"
            style={{ 
              backgroundColor: isDark ? '#2D3923' : '#E8F3EB', 
              borderColor: isDark ? '#406343' : '#A7D7C5', 
              color: isDark ? '#F6F7F2' : '#1B4332' 
            }}
          >
            {currentRole === 'DOCTOR' && <Stethoscope className="w-4 h-4 text-[#2D6A4F] dark:text-[#A4AC86]" />}
            {currentRole === 'RECEPTIONIST' && <ClipboardList className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24]" />}
            {currentRole === 'PATIENT' && <User className="w-4 h-4 text-[#2D6A4F] dark:text-[#A4AC86]" />}
            {currentRole === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-[#7C3AED] dark:text-[#C084FC]" />}
          </div>

          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold leading-tight" style={{ color: isDark ? '#F6F7F2' : '#1F291E' }}>
              {getRoleDisplayName()}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: isDark ? '#B6AD90' : '#656D4A' }}>
              {getRoleSubtitle()}
            </div>
          </div>
        </div>

        {/* Top-Right Dark Mode / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          id="theme-mode-toggle"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 shadow-2xs cursor-pointer active:scale-95 group font-medium"
          style={{
            backgroundColor: isDark ? '#2D3923' : '#FFFFFF',
            borderColor: isDark ? '#656D4A' : '#C2C5AA',
            color: isDark ? '#F6F7F2' : '#333D29'
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" style={{ color: '#A4AC86' }} />
              <span className="text-[11px] font-bold" style={{ color: '#A4AC86' }}>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-300" style={{ color: '#7F4F24' }} />
              <span className="text-[11px] font-bold" style={{ color: '#7F4F24' }}>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
