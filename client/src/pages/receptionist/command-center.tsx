import React, { useState, useEffect } from 'react';
import { LiveQueueTable } from '../../components/queue/LiveQueueTable';
import { BookingApprovalDeck } from '../../components/receptionist/BookingApprovalDeck';
import { CheckInController } from '../../components/receptionist/CheckInController';
import { RapidRegistrationModal } from '../../components/receptionist/RapidRegistrationModal';
import { FrontDeskBillingPOS } from '../../components/receptionist/FrontDeskBillingPOS';
import { ReportsAnalyticsDashboard } from '../../components/reports/ReportsAnalyticsDashboard';
import { useQueueStream } from '../../hooks/useQueueStream';
import { useModulePermissions } from '../../hooks/useModulePermissions';
import { api } from '../../services/api';
import { UserPlus, Shield, Lock } from 'lucide-react';

interface ReceptionistCommandCenterProps {
  currentUser?: any;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const ReceptionistCommandCenter: React.FC<ReceptionistCommandCenterProps> = ({
  currentUser,
  currentTab = 'recep_desk'
}) => {
  // Permissions for Receptionist Command Center strictly evaluate against the RECEPTIONIST role configuration
  const deskPerms = useModulePermissions('recep_desk', 'RECEPTIONIST');
  const approvalsPerms = useModulePermissions('recep_approvals', 'RECEPTIONIST');
  const posPerms = useModulePermissions('recep_pos', 'RECEPTIONIST');
  const reportsPerms = useModulePermissions('recep_reports', 'RECEPTIONIST');

  const { queue, refreshQueue } = useQueueStream();
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const queryLower = searchFilter.toLowerCase().trim();
  const filteredQueue = queryLower
    ? queue
        .filter(q => {
          // 1. Exact or prefix match on token number
          if (
            String(q.tokenNumber) === queryLower ||
            String(q.tokenNumber).padStart(2, '0') === queryLower
          ) {
            return true;
          }
          // 2. Phone match
          if (q.patientPhone && q.patientPhone.toLowerCase().includes(queryLower)) {
            return true;
          }
          // 3. Word prefix match on patient name (e.g. 'e' matches 'Emily Clark')
          const nameWords = q.patientName.toLowerCase().split(/\s+/);
          if (nameWords.some((w: string) => w.startsWith(queryLower))) {
            return true;
          }
          // 4. Substring match for 3+ characters (name, doctor, service)
          if (queryLower.length >= 3) {
            if (q.patientName.toLowerCase().includes(queryLower)) return true;
            if (q.doctorName.toLowerCase().includes(queryLower)) return true;
            if (q.serviceName.toLowerCase().includes(queryLower)) return true;
          }
          return false;
        })
        .sort((a, b) => a.patientName.localeCompare(b.patientName))
    : queue;

  const fetchPendingBookings = async () => {
    try {
      const res = await api.get('/appointments', {
        params: { status: 'PENDING' }
      });
      setPendingBookings(res.data.data);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
    const handleRefresh = () => {
      refreshQueue();
      fetchPendingBookings();
    };
    window.addEventListener('hospital:refresh-queue', handleRefresh);
    return () => window.removeEventListener('hospital:refresh-queue', handleRefresh);
  }, [refreshQueue]);


  const handleApprove = async (appointmentId: string) => {
    if (!approvalsPerms.canWrite) {
      alert('Action Blocked: Write/Approval permission is disabled for Pending Bookings by Administrator.');
      return;
    }
    try {
      await api.patch(`/appointments/${appointmentId}/status`, {
        status: 'CONFIRMED'
      });
      await fetchPendingBookings();
      await refreshQueue();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Approval failed');
    }
  };

  const handleDecline = async (appointmentId: string) => {
    if (!approvalsPerms.canDelete) {
      alert('Action Blocked: Delete/Decline permission is disabled for Pending Bookings by Administrator.');
      return;
    }
    try {
      await api.patch(`/appointments/${appointmentId}/status`, {
        status: 'DECLINED',
        reason: 'Front-desk schedule conflict'
      });
      await fetchPendingBookings();
      await refreshQueue();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Decline failed');
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    if (!deskPerms.canWrite) {
      alert('Action Blocked: Write permission is disabled for Queue & Patient Check-In by Administrator.');
      return;
    }
    try {
      await api.post('/queue/check-in', { appointmentId });
      await refreshQueue();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Check-in failed');
    }
  };

  const handleSearchAndCheckIn = async (query: string) => {
    if (!deskPerms.canWrite) {
      alert('Action Blocked: Write permission is disabled for Queue & Patient Check-In by Administrator.');
      return;
    }
    const match = queue.find(
      q =>
        String(q.tokenNumber) === query ||
        q.patientPhone?.includes(query) ||
        q.patientName.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      await handleCheckIn(match.appointmentId);
      alert(`✅ Patient ${match.patientName} (Token #${match.tokenNumber}) checked in successfully! Status: WAITING.`);
    } else {
      alert(`No active appointment matching query '${query}' found in today's confirmed schedule.`);
    }
  };

  // Receptionist cannot create new patient if:
  // 1. Queue Desk write is disabled
  // 2. Pending Bookings is only read (Rule: "pending booking only read should not allow to create new patient in receptionist role")
  const isApprovalsReadOnly = !approvalsPerms.canWrite;
  const isDeskReadOnly = !deskPerms.canWrite;
  const canCreatePatient = !isDeskReadOnly && !isApprovalsReadOnly;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Quick Action Bar (Only for Desk Operations) */}
      {currentTab !== 'recep_reports' && (
        <>
          <div className="flex items-center justify-end gap-2 pb-2">
            <button
              onClick={() => {
                if (isApprovalsReadOnly) {
                  alert('Action Blocked: Write permission is disabled for Pending Bookings by Administrator. You cannot register new patients.');
                  return;
                }
                if (isDeskReadOnly) {
                  alert('Action Blocked: Write permission for Queue & Patient Check-In has been disabled by Administrator. You cannot register new patients.');
                  return;
                }
                setIsRegisterModalOpen(true);
              }}
              disabled={!canCreatePatient}
              title={
                !canCreatePatient
                  ? isApprovalsReadOnly
                    ? 'Pending Bookings is in Read-Only mode. Patient creation locked.'
                    : 'Write permission disabled by Administrator'
                  : 'Register new patient'
              }
              className={`flex items-center gap-2 text-xs transition-all ${
                !canCreatePatient
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg font-medium shadow-xs'
                  : 'clinical-button-primary'
              }`}
            >
              {!canCreatePatient ? <Lock className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>New Patient {!canCreatePatient ? '(Locked by Admin)' : '(Duplicate Check)'}</span>
            </button>
          </div>

          {/* Privacy Wall Badge */}
          <div 
            className="rounded-xl p-3.5 flex items-center gap-2.5 text-xs border"
            style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA', color: '#414833' }}
          >
            <Shield className="w-4 h-4 shrink-0" style={{ color: '#656D4A' }} />
            <span>
              <strong className="font-semibold" style={{ color: '#333D29' }}>Clinical Privacy Wall Active:</strong> Protected medical notes, vitals, and diagnostic details are strictly redacted from front-desk views.
            </span>
          </div>
        </>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {currentTab === 'recep_approvals' && (
        !approvalsPerms.canRead ? (
          <div className="rounded-2xl p-12 text-center border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 space-y-4 max-w-xl mx-auto my-8 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pending Bookings Approval Access Revoked</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Hospital Administrator has disabled <strong>Read</strong> access for Pending Bookings Approval. You do not have permission to view incoming appointment requests.
              </p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
              Permission: READ = OFF
            </span>
          </div>
        ) : (
        <div className="space-y-4 animate-fade-in">
          {!approvalsPerms.canWrite && (
            <div className="rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs border bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>
                  <strong>Read-Only Mode Active:</strong> Hospital Administrator has set <strong>WRITE ACCESS TO OFF</strong> for Pending Bookings Approval. Approval actions are disabled.
                </span>
              </div>
              <span className="px-2 py-0.5 font-bold uppercase tracking-wider rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300">
                Write Locked
              </span>
            </div>
          )}
          <BookingApprovalDeck
            pendingRequests={pendingBookings}
            onApprove={handleApprove}
            onDecline={handleDecline}
            canWrite={approvalsPerms.canWrite}
            canDelete={approvalsPerms.canDelete}
          />
        </div>
        )
      )}

      {/* TAB 3: FRONT-DESK POS & FINANCIAL DOSSIER */}
      {currentTab === 'recep_pos' && (
        !posPerms.canRead ? (
          <div className="rounded-2xl p-12 text-center border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 space-y-4 max-w-xl mx-auto my-8 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Front-Desk Billing POS Access Revoked</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Hospital Administrator has disabled <strong>Read</strong> access for Front-Desk Billing POS. You do not have permission to view billing dossiers and POS terminals.
              </p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
              Permission: READ = OFF
            </span>
          </div>
        ) : (
        <div className="space-y-6 animate-fade-in">
          {!posPerms.canWrite && (
            <div className="rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs border bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>
                  <strong>Read-Only Mode Active:</strong> Hospital Administrator has set <strong>WRITE ACCESS TO OFF</strong> for Front-Desk Billing POS. Payment settlement, discounting, and receipt generation are temporarily locked.
                </span>
              </div>
              <span className="px-2 py-0.5 font-bold uppercase tracking-wider rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300">
                Write Locked
              </span>
            </div>
          )}
          <FrontDeskBillingPOS queue={queue} canWrite={posPerms.canWrite} />
        </div>
        )
      )}

      {/* TAB 4: EXECUTIVE REPORTS & ANALYTICS */}
      {currentTab === 'recep_reports' && (
        !reportsPerms.canRead ? (
          <div className="rounded-2xl p-12 text-center border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 space-y-4 max-w-xl mx-auto my-8 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Front-Desk Analytics Access Revoked</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Hospital Administrator has disabled <strong>Read</strong> access for Front-Desk Analytics. You do not have permission to view throughput and check-in reports.
              </p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
              Permission: READ = OFF
            </span>
          </div>
        ) : (
          <ReportsAnalyticsDashboard userRole="RECEPTIONIST" />
        )
      )}

      {/* TAB 1: COMMAND DESK (DEFAULT) */}
      {(currentTab === 'recep_desk' || (!['recep_approvals', 'recep_pos', 'recep_reports'].includes(currentTab))) && (
        !deskPerms.canRead ? (
          <div className="rounded-2xl p-12 text-center border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 space-y-4 max-w-xl mx-auto my-8 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Queue & Patient Check-In Access Revoked</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Hospital Administrator has disabled <strong>Read</strong> access for Queue & Patient Check-In. You do not have permission to view today's patient queue and arrival list.
              </p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
              Permission: READ = OFF
            </span>
          </div>
        ) : (
        <div className="space-y-6 animate-fade-in">
          {!deskPerms.canWrite && (
            <div className="rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs border bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>
                  <strong>Read-Only Mode Active:</strong> Hospital Administrator has set <strong>WRITE ACCESS TO OFF</strong> for Queue & Patient Check-In. Patient registration and check-in actions are temporarily disabled.
                </span>
              </div>
              <span className="px-2 py-0.5 font-bold uppercase tracking-wider rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300">
                Write Locked
              </span>
            </div>
          )}
          <CheckInController 
            onSearchAndCheckIn={handleSearchAndCheckIn}
            queue={queue}
            searchQuery={searchFilter}
            onSearchChange={setSearchFilter}
            onCheckInPatient={handleCheckIn}
            canWrite={deskPerms.canWrite}
          />
          <LiveQueueTable
            queue={filteredQueue}
            userRole="RECEPTIONIST"
            onCheckIn={handleCheckIn}
            canWrite={deskPerms.canWrite}
          />
        </div>
        )
      )}

      {/* Rapid Registration Modal */}
      <RapidRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        canWrite={canCreatePatient}
        onSuccess={newP => {
          alert(`✅ Patient ${newP.fullName} registered successfully!`);
          fetchPendingBookings();
        }}
      />
    </div>
  );
};
