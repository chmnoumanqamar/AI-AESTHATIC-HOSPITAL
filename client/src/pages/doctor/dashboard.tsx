import React, { useState } from 'react';
import { DigitalTokenHUD } from '../../components/token/DigitalTokenHUD';
import { CallNextActionButton } from '../../components/queue/CallNextActionButton';
import { LiveQueueTable } from '../../components/queue/LiveQueueTable';
import { TokenMatrixGrid } from '../../components/token/TokenMatrixGrid';
import { ConsultationWorkspace } from '../../components/clinical/ConsultationWorkspace';
import { useQueueStream } from '../../hooks/useQueueStream';
import { useTokenMatrix } from '../../hooks/useTokenMatrix';
import { api } from '../../services/api';
import {
  FileText,
  Play,
  CheckCircle2,
  User,
  AlertCircle,
  PlusCircle,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Ban,
  Activity,
  Check,
  SlidersHorizontal,
  Minus,
  Plus,
  X
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

interface DoctorDashboardProps {
  currentUser: any;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  currentUser,
  currentTab = 'doctor_queue',
  onSelectTab
}) => {
  const isDefaultDemoAccount = !currentUser || currentUser.email === 'dr.aisha@hospital.com' || currentUser.id === 'u-doc-01';
  const doctorId = currentUser?.profileId || (isDefaultDemoAccount ? 'doc-01' : (currentUser?.id || ''));
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const { queue, refreshQueue } = useQueueStream(doctorId, selectedDate);
  const { matrix, refreshMatrix } = useTokenMatrix(doctorId, selectedDate);

  // Auto-refresh queue and token matrix whenever AI assistant seeds daily data or summons patient
  React.useEffect(() => {
    const handleQueueRefresh = () => {
      refreshQueue();
      refreshMatrix();
    };
    window.addEventListener('hospital:refresh-queue', handleQueueRefresh);
    return () => window.removeEventListener('hospital:refresh-queue', handleQueueRefresh);
  }, [refreshQueue, refreshMatrix]);

  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [allocatingToken, setAllocatingToken] = useState(false);


  // Search & Filter in Consultation Deck
  const [consultationSearch, setConsultationSearch] = useState('');
  const [consultationStatusFilter, setConsultationStatusFilter] = useState<'ALL' | 'WAITING_CALLED' | 'COMPLETED'>('ALL');

  // Token Matrix Filter
  const [tokenStatusFilter, setTokenStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');

  // Flexible Daily Patient Limit Modal
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [newLimitInput, setNewLimitInput] = useState<number>(100);
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitFeedback, setLimitFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openLimitModal = () => {
    setNewLimitInput(matrix?.dailyLimit || 100);
    setLimitFeedback(null);
    setIsLimitModalOpen(true);
  };

  const handleUpdateLimit = async (customLimit?: number) => {
    const targetLimit = customLimit !== undefined ? customLimit : newLimitInput;
    if (isNaN(targetLimit) || targetLimit < 1) {
      setLimitFeedback({ type: 'error', text: 'Daily limit must be at least 1.' });
      return;
    }

    const activeCount = matrix?.activePatientsCount || 0;
    if (targetLimit < activeCount) {
      setLimitFeedback({
        type: 'error',
        text: `Cannot set limit to ${targetLimit}. There are already ${activeCount} active patients (reserved/in queue).`
      });
      return;
    }

    setSavingLimit(true);
    setLimitFeedback(null);
    try {
      await api.patch('/doctors/daily-limit', {
        doctorId,
        dailyPatientLimit: targetLimit
      });
      setLimitFeedback({
        type: 'success',
        text: `Daily patient limit successfully updated to ${targetLimit}!`
      });
      await refreshMatrix();
      await refreshQueue();
      setTimeout(() => {
        setIsLimitModalOpen(false);
        setLimitFeedback(null);
      }, 900);
    } catch (err: any) {
      setLimitFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update daily patient limit.'
      });
    } finally {
      setSavingLimit(false);
    }
  };

  // Find currently called patient
  const calledPatient = queue.find(q => q.queueStatus === 'CALLED');
  const inConsultationPatient = queue.find(q => q.queueStatus === 'IN_CONSULTATION');
  const totalWaiting = queue.filter(q => q.queueStatus === 'WAITING').length;

  const currentCalledTokenNumber = calledPatient?.tokenNumber || inConsultationPatient?.tokenNumber || null;

  const handleCallNext = async () => {
    try {
      const res = await api.post('/queue/call-next', { doctorId });
      await refreshQueue();
      await refreshMatrix();
      return res.data.data;
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'No waiting patients found.');
      return null;
    }
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      await api.post(`/queue/${appointmentId}/start`);
      await refreshQueue();

      const targetApp = queue.find(q => q.appointmentId === appointmentId);
      if (targetApp) {
        try {
          const histRes = await api.get(`/clinical-records/patient/${targetApp.patientId}/history`);
          setPatientHistory(histRes.data.data);
        } catch (e) {
          setPatientHistory({ records: [] });
        }
        setActiveConsultation(targetApp);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to begin consultation');
    }
  };

  const handleCompleteConsultation = async (recordData: any) => {
    try {
      const resolvedApptId = recordData.appointmentId || activeConsultation?.appointmentId || activeConsultation?.id;
      // 1. Create clinical record & initial prescription
      await api.post('/clinical-records/records', {
        ...recordData,
        appointmentId: resolvedApptId
      });
      // 2. Complete consultation in queue
      await api.post(`/queue/${resolvedApptId}/complete`);

      await refreshQueue();
      await refreshMatrix();
      setActiveConsultation(null);
      alert('✅ Clinical Record & Prescription saved successfully!');
    } catch (err: any) {
      const details = err.response?.data?.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        alert('Validation Error: ' + details.map((d: any) => `${d.field}: ${d.message}`).join(', '));
      } else {
        alert(err.response?.data?.error?.message || 'Failed to save clinical record');
      }
    }
  };

  const handleAllocateWalkInToken = async () => {
    try {
      setAllocatingToken(true);
      const res = await api.post('/tokens/allocate', {
        doctorId,
        date: selectedDate
      });

      const newToken = res.data.data;
      await refreshMatrix();
      await refreshQueue();
      alert(`✅ New Token Slot #${String(newToken.tokenNumber).padStart(2, '0')} allocated successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to allocate token slot.');
    } finally {
      setAllocatingToken(false);
    }
  };

  // If doctor is actively inside a consultation, show the consultation workspace
  if (activeConsultation) {
    return (
      <ConsultationWorkspace
        appointment={activeConsultation}
        patientHistory={patientHistory}
        onFinishConsultation={handleCompleteConsultation}
        onBackToQueue={() => setActiveConsultation(null)}
      />
    );
  }

  // Filtered list of consultations
  const filteredConsultations = queue.filter(item => {
    const matchesSearch =
      (item.patientName || '').toLowerCase().includes(consultationSearch.toLowerCase()) ||
      (item.patientPhone || '').includes(consultationSearch) ||
      String(item.tokenNumber).includes(consultationSearch);

    if (!matchesSearch) return false;

    if (consultationStatusFilter === 'WAITING_CALLED') {
      return item.queueStatus === 'WAITING' || item.queueStatus === 'CALLED' || item.queueStatus === 'IN_CONSULTATION';
    }
    if (consultationStatusFilter === 'COMPLETED') {
      return item.queueStatus === 'COMPLETED';
    }
    return true;
  });

  // Filtered tokens in Matrix
  const rawTokens = matrix?.tokens || [];
  const filteredTokens = rawTokens.filter((t: any) => {
    if (tokenStatusFilter === 'ACTIVE') {
      return t.status === 'ACTIVE' || t.status === 'RESERVED';
    }
    if (tokenStatusFilter === 'CANCELLED') {
      return t.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Universal Doctor Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E6D8] dark:border-[#2F3E29]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F291E] dark:text-[#F6F7F2]">
              {currentTab === 'doctor_queue' && "Today's Clinical Queue Deck"}
              {currentTab === 'doctor_consultation' && 'Clinical Consultation Deck'}
              {currentTab === 'doctor_tokens' && 'Token Allocation Matrix'}
            </h1>
          </div>
          <p className="text-xs text-[#656D4A] dark:text-[#A4AC86] mt-1 flex items-center gap-2">
            <span>Attending: <strong>{currentUser?.profile?.name || 'Dr. Aisha Khan'}</strong></span>
            <span>•</span>
            <span>{currentUser?.profile?.specialization || 'Cardiology & Internal Medicine'}</span>
          </p>
        </div>

        {/* Date Selector & Call Next Quick Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#2F3E29] text-xs font-semibold shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-[#1F291E] dark:text-white focus:outline-none text-xs font-mono cursor-pointer"
            />
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="ml-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => {
              refreshQueue();
              refreshMatrix();
            }}
            title="Refresh schedule"
            className="p-2 rounded-xl bg-white dark:bg-[#1E2718] text-[#1F291E] dark:text-white border border-[#E2E6D8] dark:border-[#2F3E29] hover:bg-[#F0F3EB] dark:hover:bg-[#283520] transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Quick Call Next Button */}
          <CallNextActionButton onCallNext={handleCallNext} />
        </div>
      </div>

      {/* TAB 1: TODAY'S QUEUE */}
      {currentTab === 'doctor_queue' && (
        <div className="space-y-6">
          {/* Digital Monospace Token HUD */}
          <DigitalTokenHUD
            currentCalledToken={currentCalledTokenNumber}
            activeDoctorName={currentUser?.profile?.name || 'Dr. Aisha Khan'}
            totalWaiting={totalWaiting}
            availableCapacity={matrix?.availableCapacity ?? 96}
            dailyLimit={matrix?.dailyLimit ?? 100}
            cancelledCount={matrix?.cancelledCount ?? 1}
            onAdjustLimit={openLimitModal}
          />

          {/* Live Queue Matrix */}
          <LiveQueueTable
            queue={queue}
            userRole="DOCTOR"
            onStartConsultation={handleStartConsultation}
            onCompleteConsultation={id => handleStartConsultation(id)}
          />
        </div>
      )}

      {/* TAB 2: CONSULTATIONS & RX */}
      {currentTab === 'doctor_consultation' && (
        <div className="space-y-6">
          {/* Active Called Patient Quick Resume Banner */}
          {calledPatient && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono font-extrabold text-base">
                  #{String(calledPatient.tokenNumber).padStart(2, '0')}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                    Patient Called: {calledPatient.patientName}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300/80">
                    Admitted into examination room. Ready for clinical notes & prescriptions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStartConsultation(calledPatient.appointmentId)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4" />
                <span>Begin Examination & Rx</span>
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1E2718] p-4 rounded-2xl border border-[#E2E6D8] dark:border-[#2F3E29] shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4AC86]" />
              <input
                type="text"
                value={consultationSearch}
                onChange={e => setConsultationSearch(e.target.value)}
                placeholder="Search patient by name, phone, or token #..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#FAFBF7] dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29] text-[#1F291E] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAFBF7] dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29] text-xs font-semibold">
              <button
                onClick={() => setConsultationStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  consultationStatusFilter === 'ALL'
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'text-[#656D4A] dark:text-[#A4AC86] hover:text-[#1F291E] dark:hover:text-white'
                }`}
              >
                All ({queue.length})
              </button>
              <button
                onClick={() => setConsultationStatusFilter('WAITING_CALLED')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  consultationStatusFilter === 'WAITING_CALLED'
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'text-[#656D4A] dark:text-[#A4AC86] hover:text-[#1F291E] dark:hover:text-white'
                }`}
              >
                In Queue ({queue.filter(q => q.queueStatus !== 'COMPLETED').length})
              </button>
              <button
                onClick={() => setConsultationStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  consultationStatusFilter === 'COMPLETED'
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'text-[#656D4A] dark:text-[#A4AC86] hover:text-[#1F291E] dark:hover:text-white'
                }`}
              >
                Completed ({queue.filter(q => q.queueStatus === 'COMPLETED').length})
              </button>
            </div>
          </div>

          {/* Patients Consultation Roster List */}
          <div className="bg-white dark:bg-[#1E2718] rounded-2xl border border-[#E2E6D8] dark:border-[#2F3E29] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E6D8] dark:border-[#2F3E29] flex items-center justify-between bg-[#FAFBF7] dark:bg-[#151D12]">
              <span className="text-xs font-bold text-[#1F291E] dark:text-[#F6F7F2]">
                Patient Consultation Roster ({filteredConsultations.length})
              </span>
              <span className="text-[11px] font-mono text-[#656D4A] dark:text-[#A4AC86]">
                Schedule: {selectedDate}
              </span>
            </div>

            <div className="divide-y divide-[#E2E6D8] dark:divide-[#2F3E29]">
              {filteredConsultations.map(item => {
                const isCompleted = item.queueStatus === 'COMPLETED';
                const isCalled = item.queueStatus === 'CALLED';

                return (
                  <div
                    key={item.appointmentId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBF7] dark:hover:bg-[#151D12] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-extrabold text-base px-3 py-1 rounded-xl border bg-[#FAFBF7] dark:bg-[#151D12] border-[#E2E6D8] dark:border-[#2F3E29] text-[#1F291E] dark:text-white shrink-0">
                        #{String(item.tokenNumber).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="font-bold flex items-center gap-2 text-sm text-[#1F291E] dark:text-white">
                          <span>{item.patientName}</span>
                          <StatusBadge status={item.queueStatus} size="sm" />
                        </div>
                        <div className="text-xs text-[#656D4A] dark:text-[#A4AC86] mt-0.5 font-mono">
                          Phone: {item.patientPhone || 'N/A'} • Service: {item.serviceName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <button
                        onClick={() => handleStartConsultation(item.appointmentId)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                          isCalled
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : isCompleted
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                            : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {isCalled
                            ? 'Resume Called Patient'
                            : isCompleted
                            ? 'View / Edit Record & Rx'
                            : 'Open Consultation & Rx'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredConsultations.length === 0 && (
                <div className="py-14 text-center text-xs text-[#656D4A] dark:text-[#A4AC86]">
                  No matching patients found for this schedule.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOKEN MATRIX DECK */}
      {currentTab === 'doctor_tokens' && (
        <div className="space-y-6">
          {/* Quick Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#2F3E29] shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-[#1F291E] dark:text-[#F6F7F2]">
                Token Slot Control Center
              </h3>
              <p className="text-xs text-[#656D4A] dark:text-[#A4AC86] mt-0.5">
                Allocate walk-in patient slots, monitor slot sequentiality, and enforce permanent cancellation locks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openLimitModal}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[#D0D7C4] dark:border-[#3D523F] bg-white dark:bg-[#1E2718] text-[#2D6A4F] dark:text-[#74C69D] hover:bg-[#F2F6F0] dark:hover:bg-[#2A3725] transition-all cursor-pointer shadow-xs"
                title="Adjust Daily Patient Limit"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adjust Daily Limit</span>
              </button>
              <button
                onClick={handleAllocateWalkInToken}
                disabled={allocatingToken}
                className="clinical-button-primary flex items-center gap-2 text-xs cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{allocatingToken ? 'Allocating Slot...' : 'Issue Next Walk-In Token'}</span>
              </button>
            </div>
          </div>

          {/* 5 Real-Time KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* T_max */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#2F3E29] shadow-xs">
              <span className="text-xs text-[#656D4A] dark:text-[#A4AC86] block">Max Issued (T-Max)</span>
              <div className="text-2xl font-extrabold text-[#1F291E] dark:text-white mt-1">
                #{String(matrix?.maxSequenceIssued || 0).padStart(2, '0')}
              </div>
              <span className="text-[10px] text-[#878E76] block mt-0.5">Sequential Sequence</span>
            </div>

            {/* Active Patients A */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#2F3E29] shadow-xs">
              <span className="text-xs text-[#656D4A] dark:text-[#A4AC86] block">Active Patients ($A$)</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {matrix?.activePatientsCount || 0}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">Reserved or In Queue</span>
            </div>

            {/* Cancelled C */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#2F3E29] shadow-xs">
              <span className="text-xs text-[#656D4A] dark:text-[#A4AC86] block">Cancelled / Locked ($C$)</span>
              <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                {matrix?.cancelledCount || 0}
              </div>
              <span className="text-[10px] text-red-700 dark:text-red-400 block mt-0.5">Non-reusable Slots</span>
            </div>

            {/* Available L - A */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#2F3E29] shadow-xs">
              <span className="text-xs text-[#656D4A] dark:text-[#A4AC86] block">Available Capacity</span>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {matrix?.availableCapacity ?? 96}
              </div>
              <span className="text-[10px] text-blue-700 dark:text-blue-400 block mt-0.5">Slots Remaining</span>
            </div>

            {/* Daily Limit L (Flexible & Clickable) */}
            <div
              onClick={openLimitModal}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && openLimitModal()}
              className="p-4 rounded-2xl bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#2F3E29] hover:border-[#2D6A4F] dark:hover:border-[#74C69D] shadow-xs hover:shadow-md transition-all cursor-pointer group relative"
              title="Click to adjust daily patient limit"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#656D4A] dark:text-[#A4AC86] block">Daily Patient Limit ($L$)</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EAF2EC] dark:bg-[#2D3E2F] text-[#2D6A4F] dark:text-[#74C69D] group-hover:scale-105 transition-transform flex items-center gap-1">
                  <SlidersHorizontal className="w-2.5 h-2.5" />
                  <span>Adjust</span>
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#1F291E] dark:text-white mt-1 group-hover:text-[#2D6A4F] dark:group-hover:text-[#74C69D] transition-colors">
                {matrix?.dailyLimit || 100}
              </div>
              <span className="text-[10px] text-[#878E76] dark:text-[#A4AC86] block mt-0.5">Max Threshold &bull; Click to edit</span>
            </div>
          </div>

          {/* Token Status Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTokenStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                tokenStatusFilter === 'ALL'
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white dark:bg-[#1E2718] text-[#656D4A] dark:text-[#A4AC86] border-[#E2E6D8] dark:border-[#2F3E29]'
              }`}
            >
              All Slots ({rawTokens.length})
            </button>
            <button
              onClick={() => setTokenStatusFilter('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                tokenStatusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-[#1E2718] text-[#656D4A] dark:text-[#A4AC86] border-[#E2E6D8] dark:border-[#2F3E29]'
              }`}
            >
              Active Only ({rawTokens.filter((t: any) => t.status === 'ACTIVE' || t.status === 'RESERVED').length})
            </button>
            <button
              onClick={() => setTokenStatusFilter('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                tokenStatusFilter === 'CANCELLED'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-[#1E2718] text-[#656D4A] dark:text-[#A4AC86] border-[#E2E6D8] dark:border-[#2F3E29]'
              }`}
            >
              Cancelled Locked ({rawTokens.filter((t: any) => t.status === 'CANCELLED').length})
            </button>
          </div>

          {/* Enhanced Matrix Grid */}
          <TokenMatrixGrid
            tokens={filteredTokens}
            dailyLimit={matrix?.dailyLimit || 100}
            onStartConsultation={handleStartConsultation}
            onRefresh={refreshMatrix}
          />
        </div>
      )}

      {/* Flexible Daily Patient Limit Adjustment Modal */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1A2315] border border-[#D8DEC9] dark:border-[#2D3E25] rounded-3xl shadow-2xl p-6 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E6D8] dark:border-[#2A3723]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EAF2EC] dark:bg-[#273B25] text-[#2D6A4F] dark:text-[#74C69D]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1F291E] dark:text-white">
                    Adjust Daily Patient Limit ($L$)
                  </h3>
                  <p className="text-xs text-[#656D4A] dark:text-[#A4AC86]">
                    Flexibly change today's maximum patient consultation capacity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A3723] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-5">
              {/* Quick Shift Presets */}
              <div>
                <label className="text-xs font-bold text-[#4F573E] dark:text-[#CBD5C0] uppercase tracking-wider block mb-2">
                  Quick Shift Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '25 (Half Day)', value: 25 },
                    { label: '50 (Short Shift)', value: 50 },
                    { label: '75 (Moderate)', value: 75 },
                    { label: '100 (Default)', value: 100 },
                    { label: '150 (Extended)', value: 150 },
                    { label: '200 (Camp / Rush)', value: 200 },
                  ].map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setNewLimitInput(preset.value)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        newLimitInput === preset.value
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                          : 'bg-slate-50 dark:bg-[#222E1D] text-[#333D29] dark:text-[#CBD5C0] border-[#DCE3D4] dark:border-[#35482C] hover:bg-[#EAF2EC] dark:hover:bg-[#2E3F28]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stepper + Number Input */}
              <div>
                <label className="text-xs font-bold text-[#4F573E] dark:text-[#CBD5C0] uppercase tracking-wider block mb-2">
                  Custom Patient Limit
                </label>
                <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-[#151D11] border border-[#DCE3D4] dark:border-[#2D3E25] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNewLimitInput(prev => Math.max(1, prev - 10))}
                    className="px-3 py-2 rounded-xl font-bold text-xs bg-white dark:bg-[#24311F] text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A4E31] hover:bg-slate-100 dark:hover:bg-[#30412A] cursor-pointer"
                    title="Decrease by 10"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewLimitInput(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-xl font-bold bg-white dark:bg-[#24311F] text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A4E31] hover:bg-slate-100 dark:hover:bg-[#30412A] cursor-pointer"
                    title="Decrease by 1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newLimitInput}
                    onChange={e => setNewLimitInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center font-mono font-extrabold text-2xl py-1.5 px-2 bg-white dark:bg-[#1E2718] text-[#1F291E] dark:text-white border border-slate-300 dark:border-[#435939] rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setNewLimitInput(prev => prev + 1)}
                    className="p-2 rounded-xl font-bold bg-white dark:bg-[#24311F] text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A4E31] hover:bg-slate-100 dark:hover:bg-[#30412A] cursor-pointer"
                    title="Increase by 1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewLimitInput(prev => prev + 10)}
                    className="px-3 py-2 rounded-xl font-bold text-xs bg-white dark:bg-[#24311F] text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A4E31] hover:bg-slate-100 dark:hover:bg-[#30412A] cursor-pointer"
                    title="Increase by 10"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Live Impact Preview */}
              <div className="p-4 rounded-2xl bg-[#F4F7F2] dark:bg-[#151D11] border border-[#DEE5D6] dark:border-[#2D3E25]">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-[#656D4A] dark:text-[#A4AC86] block">Active Patients ($A$)</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {matrix?.activePatientsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#656D4A] dark:text-[#A4AC86] block">New Limit ($L$)</span>
                    <span className="text-base font-extrabold text-[#1F291E] dark:text-white">
                      {newLimitInput}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#656D4A] dark:text-[#A4AC86] block">Available ($L - A$)</span>
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      {Math.max(0, newLimitInput - (matrix?.activePatientsCount || 0))} slots
                    </span>
                  </div>
                </div>

                {newLimitInput < (matrix?.activePatientsCount || 0) && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      Notice: Limit is lower than current active patients ({matrix?.activePatientsCount || 0}). New walk-ins and bookings will be locked until queue clears.
                    </span>
                  </div>
                )}
              </div>

              {/* Feedback Alert */}
              {limitFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    limitFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
                  }`}
                >
                  {limitFeedback.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span>{limitFeedback.text}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E6D8] dark:border-[#2A3723]">
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3723] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingLimit}
                onClick={() => handleUpdateLimit()}
                className="clinical-button-primary flex items-center gap-2 text-xs cursor-pointer shadow-xs"
              >
                {savingLimit ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Limit...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Limit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorDashboard;
