import React, { useState, useEffect } from 'react';
import { LiveQueueTable } from '../../components/queue/LiveQueueTable';
import { BookingApprovalDeck } from '../../components/receptionist/BookingApprovalDeck';
import { CheckInController } from '../../components/receptionist/CheckInController';
import { RapidRegistrationModal } from '../../components/receptionist/RapidRegistrationModal';
import { FrontDeskBillingPOS } from '../../components/receptionist/FrontDeskBillingPOS';
import { ReportsAnalyticsDashboard } from '../../components/reports/ReportsAnalyticsDashboard';
import { useQueueStream } from '../../hooks/useQueueStream';
import { api } from '../../services/api';
import { UserPlus, Shield } from 'lucide-react';

interface ReceptionistCommandCenterProps {
  currentUser?: any;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const ReceptionistCommandCenter: React.FC<ReceptionistCommandCenterProps> = ({
  currentUser,
  currentTab = 'recep_desk'
}) => {
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
    try {
      await api.post('/queue/check-in', { appointmentId });
      await refreshQueue();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Check-in failed');
    }
  };

  const handleSearchAndCheckIn = async (query: string) => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Quick Action Bar (Only for Desk Operations) */}
      {currentTab !== 'recep_reports' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="screen-main-header">Front-Desk Command Center</h1>
              <p className="text-xs text-brand-600">
                Patient check-in, booking request authorization, and front-desk collection
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="clinical-button-primary flex items-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>New Patient (Duplicate Check)</span>
              </button>
            </div>
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
        <div className="space-y-4 animate-fade-in">
          <BookingApprovalDeck
            pendingRequests={pendingBookings}
            onApprove={handleApprove}
            onDecline={handleDecline}
          />
        </div>
      )}

      {/* TAB 3: FRONT-DESK POS & FINANCIAL DOSSIER */}
      {currentTab === 'recep_pos' && (
        <FrontDeskBillingPOS queue={queue} />
      )}

      {/* TAB 4: EXECUTIVE REPORTS & ANALYTICS */}
      {currentTab === 'recep_reports' && (
        <ReportsAnalyticsDashboard userRole="RECEPTIONIST" />
      )}

      {/* TAB 1: COMMAND DESK (DEFAULT) */}
      {(currentTab === 'recep_desk' || (!['recep_approvals', 'recep_pos', 'recep_reports'].includes(currentTab))) && (
        <div className="space-y-6 animate-fade-in">
          <CheckInController 
            onSearchAndCheckIn={handleSearchAndCheckIn}
            queue={queue}
            searchQuery={searchFilter}
            onSearchChange={setSearchFilter}
            onCheckInPatient={handleCheckIn}
          />
          <LiveQueueTable
            queue={filteredQueue}
            userRole="RECEPTIONIST"
            onCheckIn={handleCheckIn}
          />
        </div>
      )}

      {/* Rapid Registration Modal */}
      <RapidRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={newP => {
          alert(`✅ Patient ${newP.fullName} registered successfully!`);
          fetchPendingBookings();
        }}
      />
    </div>
  );
};
