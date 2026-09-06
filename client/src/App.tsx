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

const PORT_ROLE_MAP: Record<string, { role: 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'ADMIN'; email: string; name: string }> = {
  '3001': { role: 'DOCTOR', email: 'dr.aisha@hospital.com', name: 'Dr. Aisha Khan' },
  '3002': { role: 'RECEPTIONIST', email: 'receptionist@hospital.com', name: 'Sarah Jenkins' },
  '3003': { role: 'PATIENT', email: 'john.doe@example.com', name: 'John Doe' },
  '3004': { role: 'ADMIN', email: 'admin@hospital.com', name: 'Administrator' },
};

export const App: React.FC = () => {
  const currentPort = typeof window !== 'undefined' ? window.location.port : '';
  const isolatedConfig = PORT_ROLE_MAP[currentPort] || null;
  const isPortLocked = Boolean(isolatedConfig);

  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('hospital_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT'>(
    isolatedConfig ? isolatedConfig.role : 'DOCTOR'
  );
  const [currentTab, setCurrentTab] = useState<string>(
    isolatedConfig ? getInitialTabForRole(isolatedConfig.role) : 'doctor_queue'
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

  // Login a specific role
  const performRoleLogin = async (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') => {
    const emailMap = {
      DOCTOR: 'dr.aisha@hospital.com',
      RECEPTIONIST: 'receptionist@hospital.com',
      PATIENT: 'john.doe@example.com',
      ADMIN: 'admin@hospital.com'
    };

    try {
      const res = await api.post('/auth/login', {
        identifier: emailMap[role],
        password: 'Password123!'
      });
      const { token, user } = res.data.data;
      localStorage.setItem('hospital_token', token);
      setAuthToken(token);
      setCurrentUser(user);
      setCurrentRole(user.role || role);
      setDefaultTabForRole(user.role || role);
    } catch (err) {
      console.error(`Failed to auto-authenticate for role ${role}:`, err);
    }
  };

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsInitializing(false);
    }, 3500);

    const initSession = async () => {
      try {
        if (isPortLocked && isolatedConfig) {
          // If port is locked to a specific role, ensure the active session matches that role
          if (authToken) {
            try {
              const res = await api.get('/auth/me');
              const user = res.data.data;
              if (isMounted) {
                if (user.role === isolatedConfig.role) {
                  setCurrentUser(user);
                  setCurrentRole(isolatedConfig.role);
                  setDefaultTabForRole(isolatedConfig.role);
                } else {
                  await performRoleLogin(isolatedConfig.role);
                }
              }
            } catch {
              if (isMounted) await performRoleLogin(isolatedConfig.role);
            }
          } else {
            if (isMounted) await performRoleLogin(isolatedConfig.role);
          }
        } else {
          // Hub Mode (Production / Vercel / Port 3000)
          if (authToken) {
            try {
              const res = await api.get('/auth/me');
              const user = res.data.data;
              if (isMounted) {
                setCurrentUser(user);
                if (user.role) {
                  setCurrentRole(user.role);
                  setDefaultTabForRole(user.role);
                }
              }
            } catch {
              if (isMounted) await performRoleLogin(currentRole);
            }
          } else {
            // Default demo login on hub
            if (isMounted) await performRoleLogin('DOCTOR');
          }
        }
      } catch (err) {
        console.warn('Session init completed with fallback:', err);
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
  }, [currentPort]);

  const handleSwitchRole = async (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') => {
    // If port is locked, redirect to that role's port instead of switching in-place
    if (isPortLocked) {
      const portForRole: Record<string, number> = {
        DOCTOR: 3001,
        RECEPTIONIST: 3002,
        PATIENT: 3003,
        ADMIN: 3004
      };
      if (portForRole[role] && String(portForRole[role]) !== currentPort) {
        window.open(`http://localhost:${portForRole[role]}`, '_blank');
        return;
      }
    }

    setCurrentRole(role);
    setDefaultTabForRole(role);
    await performRoleLogin(role);
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
              {isPortLocked ? `Connecting Isolated Terminal (${isolatedConfig?.role} on Port ${currentPort})...` : 'Booting Clinical Command Deck...'}
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
        isolatedPort={currentPort}
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
      isolatedPort={currentPort}
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
