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
import { AdminModuleStudio } from './pages/admin/module-studio';
import { PharmacyWorkspace } from './pages/pharmacist/pharmacy-workspace';
import { ReportsAnalyticsDashboard } from './components/reports/ReportsAnalyticsDashboard';
import { LoginView } from './pages/auth/login';
import { api } from './services/api';
import {
  HospitalRoleDefinition,
  getStoredRolePermissions,
  isModulePermitted,
  resolveInitialTabForRole,
  syncRolePermissionsFromServer,
  PERMISSIONS_UPDATE_EVENT,
  PERMISSIONS_STORAGE_KEY
} from './utils/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface TerminalConfig {
  role: 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'ADMIN' | 'PHARMACIST';
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
  '3005': { role: 'PHARMACIST', email: 'pharmacy@hospital.com', name: 'Tariq Mehmood, RPh', key: '3005', path: '/pharmacist' },
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

  // 2. Direct dedicated paths (Production / Vercel: /doctor, /receptionist, /patient, /admin, /pharmacist)
  if (path.startsWith('/doctor')) return TERMINAL_REGISTRY['3001'];
  if (path.startsWith('/reception')) return TERMINAL_REGISTRY['3002'];
  if (path.startsWith('/patient')) return TERMINAL_REGISTRY['3003'];
  if (path.startsWith('/admin')) return TERMINAL_REGISTRY['3004'];
  if (path.startsWith('/pharmacist') || path.startsWith('/pharma')) return TERMINAL_REGISTRY['3005'];

  // 3. Query params (?terminal=doctor or ?role=doctor)
  if (queryRole === 'doctor') return TERMINAL_REGISTRY['3001'];
  if (queryRole === 'receptionist' || queryRole === 'reception') return TERMINAL_REGISTRY['3002'];
  if (queryRole === 'patient') return TERMINAL_REGISTRY['3003'];
  if (queryRole === 'admin') return TERMINAL_REGISTRY['3004'];
  if (queryRole === 'pharmacist' || queryRole === 'pharma' || queryRole === 'pharmacy') return TERMINAL_REGISTRY['3005'];

  // 4. Subdomains (doctor.xxx, reception.xxx, etc.)
  if (host.startsWith('doctor.')) return TERMINAL_REGISTRY['3001'];
  if (host.startsWith('reception.') || host.startsWith('receptionist.')) return TERMINAL_REGISTRY['3002'];
  if (host.startsWith('patient.')) return TERMINAL_REGISTRY['3003'];
  if (host.startsWith('admin.')) return TERMINAL_REGISTRY['3004'];
  if (host.startsWith('pharma.') || host.startsWith('pharmacy.')) return TERMINAL_REGISTRY['3005'];

  return null;
}

export const App: React.FC = () => {
  const terminalConfig = resolveTerminalConfig();
  const isolatedKey = terminalConfig ? terminalConfig.key : null;

  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('hospital_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rolePermissions, setRolePermissions] = useState<HospitalRoleDefinition[]>(getStoredRolePermissions);
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST'>(
    terminalConfig ? terminalConfig.role : 'DOCTOR'
  );
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const initialRole = terminalConfig ? terminalConfig.role : 'DOCTOR';
    return resolveInitialTabForRole(initialRole, null, getStoredRolePermissions());
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync role permissions in real-time
  useEffect(() => {
    const handlePermUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRolePermissions(e.detail);
      }
    };

    syncRolePermissionsFromServer().then(roles => {
      if (roles && Array.isArray(roles)) {
        setRolePermissions(roles);
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PERMISSIONS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setRolePermissions(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener(PERMISSIONS_UPDATE_EVENT, handlePermUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(PERMISSIONS_UPDATE_EVENT, handlePermUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Strict enforcement: if currentTab is not permitted for current user & role, auto-fallback
  useEffect(() => {
    if (!isInitializing && currentTab) {
      const permitted = isModulePermitted(currentTab, currentRole, currentUser, rolePermissions);
      if (!permitted) {
        const fallback = resolveInitialTabForRole(currentRole, currentUser, rolePermissions);
        if (fallback && fallback !== currentTab) {
          setCurrentTab(fallback);
        }
      }
    }
  }, [currentTab, currentRole, currentUser, rolePermissions, isInitializing]);

  const setDefaultTabForRole = (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST', userObj?: any) => {
    setCurrentTab(resolveInitialTabForRole(role, userObj, rolePermissions));
  };

  const syncUrlForRole = (role: string) => {
    const pathMap: Record<string, string> = {
      DOCTOR: '/doctor',
      RECEPTIONIST: '/receptionist',
      PATIENT: '/patient',
      ADMIN: '/admin',
      PHARMACIST: '/pharmacist'
    };
    if (pathMap[role] && window.location.pathname !== pathMap[role]) {
      window.history.replaceState(null, '', pathMap[role]);
    }
  };

  // Initialize saved session on mount only
  useEffect(() => {
    let isMounted = true;
    const existingToken = localStorage.getItem('hospital_token');
    if (!existingToken) {
      setIsInitializing(false);
      return;
    }

    const initSession = async () => {
      try {
        const res = await api.get('/auth/me');
        const user = res.data.data;
        if (isMounted && user) {
          setCurrentUser(user);
          setCurrentRole(user.role);
          setDefaultTabForRole(user.role, user);
          syncUrlForRole(user.role);
        }
      } catch (err) {
        console.warn('Stored session invalid or expired:', err);
        localStorage.removeItem('hospital_token');
        if (isMounted) {
          setAuthToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = (token: string, user: any) => {
    localStorage.setItem('hospital_token', token);
    setAuthToken(token);
    setCurrentUser(user);
    setCurrentRole(user.role);
    setDefaultTabForRole(user.role, user);
    syncUrlForRole(user.role);
  };

  const handleSwitchRole = (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST') => {
    const pathMap: Record<string, string> = {
      DOCTOR: '/doctor',
      RECEPTIONIST: '/receptionist',
      PATIENT: '/patient',
      ADMIN: '/admin',
      PHARMACIST: '/pharmacist'
    };
    if (pathMap[role]) {
      window.location.href = pathMap[role];
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital_token');
    setAuthToken(null);
    setCurrentUser(null);
    window.history.replaceState(null, '', '/');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#181F12] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm w-full bg-white dark:bg-[#1E2718] p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-[#333D29] animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-emerald-950 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Booting Clinical Command Deck...
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
        onLoginSuccess={handleLoginSuccess}
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
      {/* Dynamic View Access Guard */}
      {!isModulePermitted(currentTab, currentRole, currentUser, rolePermissions) ? (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-[#1E2718] border border-amber-300 dark:border-amber-800/60 rounded-3xl shadow-xl text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Module Access Restricted</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Access to this hospital page has been deactivated or restricted by the Hospital Administrator in the Module & Page Studio.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab(resolveInitialTabForRole(currentRole, currentUser, rolePermissions))}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Authorized Workspace
          </button>
        </div>
      ) : (
        <>
          {/* Universal Dynamic View Switcher: decoupled from role so Admin & cross-permitted users can render any view */}
          {currentTab.startsWith('doctor_') && (
            <DoctorDashboard
              currentUser={currentUser}
              currentTab={currentTab}
              onSelectTab={tab => setCurrentTab(tab)}
            />
          )}

          {currentTab.startsWith('recep_') && (
            <ReceptionistCommandCenter
              currentUser={currentUser}
              currentTab={currentTab}
              onSelectTab={tab => setCurrentTab(tab)}
            />
          )}

          {currentTab.startsWith('patient_') && (
            <PatientDashboard
              currentUser={currentUser}
              currentTab={currentTab}
              onSelectTab={tab => setCurrentTab(tab)}
            />
          )}

          {currentTab.startsWith('pharma_') && (
            <PharmacyWorkspace
              currentUser={currentUser}
              currentTab={currentTab}
              onSelectTab={tab => setCurrentTab(tab)}
            />
          )}

          {currentTab.startsWith('admin_') && currentRole === 'ADMIN' && (
            <>
              {currentTab === 'admin_users' && <AdminUserAccessView />}
              {currentTab === 'admin_studio' && <AdminModuleStudio />}
              {currentTab === 'admin_audit' && <AdminAuditVault />}
              {currentTab === 'admin_queue' && <AdminQueueMonitor />}
              {currentTab === 'admin_reports' && <ReportsAnalyticsDashboard userRole="ADMIN" />}
              {currentTab === 'admin_database' && <AdminDatabaseMaintenance />}
              {currentTab === 'admin_config' && <AdminConfigView />}
              {currentTab === 'admin_ledger' && <AdminHospitalLedger />}
            </>
          )}
        </>
      )}
    </CommandDeckShell>
  );
};
export default App;
