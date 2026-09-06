import React, { useState, useEffect } from 'react';
import { CommandDeckShell } from './components/layout/CommandDeckShell';
import { DoctorDashboard } from './pages/doctor/dashboard';
import { ReceptionistCommandCenter } from './pages/receptionist/command-center';
import { PatientDashboard } from './pages/patient/dashboard';
import { AdminAuditVault } from './pages/admin/audit-vault';
import { AdminConfigView } from './pages/admin/config';
import { AdminUserAccessView } from './pages/admin/user-access';
import { AdminQueueMonitor } from './pages/admin/queue-monitor';
import { AdminHospitalLedger } from './pages/admin/ledger';
import { AdminDatabaseMaintenance } from './pages/admin/database-maintenance';
import { ReportsAnalyticsDashboard } from './components/reports/ReportsAnalyticsDashboard';
import { LoginView } from './pages/auth/login';
import { api } from './services/api';

interface TerminalConfig {
  role: 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'ADMIN';
  email: string;
  name: string;
  key: string;
  path: string;
}

const TERMINAL_REGISTRY: Record<string, TerminalConfig> = {
  '3001': { role: 'DOCTOR', email: 'dr.aisha@hospital.com', name: 'Dr. Aisha Khan', key: '3001', path: '/doctor' },
  '3002': { role: 'RECEPTIONIST', email: 'receptionist@hospital.com', name: 'Sarah Jenkins', key: '3002', path: '/receptionist' },
  '3003': { role: 'PATIENT', email: 'john.doe@example.com', name: 'John Doe', key: '3003', path: '/patient' },
  '3004': { role: 'ADMIN', email: 'admin@hospital.com', name: 'Administrator', key: '3004', path: '/admin' },
};

function resolveTerminalConfig(): TerminalConfig | null {
  if (typeof window === 'undefined') return null;

  const port = window.location.port;
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const host = window.location.hostname.toLowerCase();
  const queryRole = (search.get('role') || search.get('terminal') || '').toLowerCase();

  // 1. Port mapping (Local development)
  if (TERMINAL_REGISTRY[port]) return TERMINAL_REGISTRY[port];

  // 2. Direct dedicated paths (Production / Vercel: /doctor, /receptionist, /patient, /admin)
  if (path.startsWith('/doctor')) return TERMINAL_REGISTRY['3001'];
  if (path.startsWith('/reception')) return TERMINAL_REGISTRY['3002'];
  if (path.startsWith('/patient')) return TERMINAL_REGISTRY['3003'];
  if (path.startsWith('/admin')) return TERMINAL_REGISTRY['3004'];

  // 3. Query params (?terminal=doctor or ?role=doctor)
  if (queryRole === 'doctor') return TERMINAL_REGISTRY['3001'];
  if (queryRole === 'receptionist' || queryRole === 'reception') return TERMINAL_REGISTRY['3002'];
  if (queryRole === 'patient') return TERMINAL_REGISTRY['3003'];
  if (queryRole === 'admin') return TERMINAL_REGISTRY['3004'];

  // 4. Subdomains (doctor.xxx, reception.xxx, etc.)
  if (host.startsWith('doctor.')) return TERMINAL_REGISTRY['3001'];
  if (host.startsWith('reception.') || host.startsWith('receptionist.')) return TERMINAL_REGISTRY['3002'];
  if (host.startsWith('patient.')) return TERMINAL_REGISTRY['3003'];
  if (host.startsWith('admin.')) return TERMINAL_REGISTRY['3004'];

  return null;
}

export const App: React.FC = () => {
  const terminalConfig = resolveTerminalConfig();
  const isTerminalLocked = Boolean(terminalConfig);
  const isolatedKey = terminalConfig ? terminalConfig.key : null;

  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('hospital_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT'>(
    terminalConfig ? terminalConfig.role : 'DOCTOR'
  );
  const [currentTab, setCurrentTab] = useState<string>(
    terminalConfig ? getInitialTabForRole(terminalConfig.role) : 'doctor_queue'
  );
  const [isInitializing, setIsInitializing] = useState(true);

  function getInitialTabForRole(role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') {
    if (role === 'DOCTOR') return 'doctor_queue';
    if (role === 'RECEPTIONIST') return 'recep_desk';
    if (role === 'PATIENT') return 'patient_portal';
    if (role === 'ADMIN') return 'admin_users';
    return 'doctor_queue';
  }

  const setDefaultTabForRole = (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') => {
    setCurrentTab(getInitialTabForRole(role));
  };

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsInitializing(false);
    }, 3000);

    const initSession = async () => {
      try {
        if (authToken) {
          try {
            const res = await api.get('/auth/me');
            const user = res.data.data;
            if (isMounted && user) {
              // If current terminal is locked to a specific role, verify session matches
              if (isTerminalLocked && terminalConfig && user.role !== terminalConfig.role) {
                // Different role on this terminal: require dedicated login
                localStorage.removeItem('hospital_token');
                setAuthToken(null);
                setCurrentUser(null);
              } else {
                setCurrentUser(user);
                setCurrentRole(user.role);
                setDefaultTabForRole(user.role);
              }
            }
          } catch {
            // Token expired or invalid
            localStorage.removeItem('hospital_token');
            if (isMounted) {
              setAuthToken(null);
              setCurrentUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Session check completed:', err);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) setIsInitializing(false);
      }
    };

    initSession();
    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [authToken]);

  const handleSwitchRole = (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') => {
    const pathMap: Record<string, string> = {
      DOCTOR: '/doctor',
      RECEPTIONIST: '/receptionist',
      PATIENT: '/patient',
      ADMIN: '/admin'
    };
    if (pathMap[role]) {
      window.location.href = pathMap[role];
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital_token');
    setAuthToken(null);
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#181F12] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm w-full bg-white dark:bg-[#1E2718] p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-[#333D29] animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-emerald-950 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {terminalConfig ? `Connecting Isolated Terminal (${terminalConfig.role})...` : 'Booting Clinical Command Deck...'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-emerald-400 mt-1">Connecting to clinical backend & AI engine...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authToken) {
    return (
      <LoginView
        isolatedPort={isolatedKey}
        onLoginSuccess={(token, user) => {
          setAuthToken(token);
          setCurrentUser(user);
          setCurrentRole(user.role);
          setDefaultTabForRole(user.role);
        }}
      />
    );
  }

  return (
    <CommandDeckShell
      currentRole={currentRole}
      currentTab={currentTab}
      onSelectTab={tab => setCurrentTab(tab)}
      onSwitchRole={handleSwitchRole}
      currentUser={currentUser}
      onLogout={handleLogout}
      isolatedPort={isolatedKey}
    >
      {/* Dynamic View Switcher based on role & active tab */}
      {currentRole === 'DOCTOR' && (
        <DoctorDashboard
          currentUser={currentUser}
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
        />
      )}

      {currentRole === 'RECEPTIONIST' && (
        <ReceptionistCommandCenter
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
        />
      )}

      {currentRole === 'PATIENT' && (
        <PatientDashboard
          currentUser={currentUser}
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
        />
      )}

      {currentRole === 'ADMIN' && (
        <>
          {currentTab === 'admin_users' && <AdminUserAccessView />}
          {currentTab === 'admin_audit' && <AdminAuditVault />}
          {currentTab === 'admin_queue' && <AdminQueueMonitor />}
          {currentTab === 'admin_reports' && <ReportsAnalyticsDashboard userRole="ADMIN" />}
          {currentTab === 'admin_database' && <AdminDatabaseMaintenance />}
          {currentTab === 'admin_config' && <AdminConfigView />}
          {currentTab === 'admin_ledger' && <AdminHospitalLedger />}
        </>
      )}
    </CommandDeckShell>
  );
};
export default App;
