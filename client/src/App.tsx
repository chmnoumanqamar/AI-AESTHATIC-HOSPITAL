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
    const initSession = async () => {
      try {
        if (isPortLocked && isolatedConfig) {
          // If port is locked to a specific role, ensure the active session matches that role
          if (authToken) {
            try {
              const res = await api.get('/auth/me');
              const user = res.data.data;
              if (user.role === isolatedConfig.role) {
                setCurrentUser(user);
                setCurrentRole(isolatedConfig.role);
                setDefaultTabForRole(isolatedConfig.role);
              } else {
                // Token belongs to another role; auto-switch to this port's designated role
                await performRoleLogin(isolatedConfig.role);
              }
            } catch {
              // Token invalid; auto-login to designated role
              await performRoleLogin(isolatedConfig.role);
            }
          } else {
            // No token on this port origin yet: auto-login immediately
            await performRoleLogin(isolatedConfig.role);
          }
        } else {
          // Hub Mode (:3000)
          if (authToken) {
            try {
              const res = await api.get('/auth/me');
              const user = res.data.data;
              setCurrentUser(user);
              if (user.role) {
                setCurrentRole(user.role);
                setDefaultTabForRole(user.role);
              }
            } catch {
              await performRoleLogin(currentRole);
            }
          } else {
            // Default demo login on hub
            await performRoleLogin('DOCTOR');
          }
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();
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
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-300 border-t-brand-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold text-brand-900">
            {isPortLocked ? `Connecting Isolated Terminal (${isolatedConfig?.role} on Port ${currentPort})...` : 'Booting Clinical Command Deck...'}
          </p>
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
