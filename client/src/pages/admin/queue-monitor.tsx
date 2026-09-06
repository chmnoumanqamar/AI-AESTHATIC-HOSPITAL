import React, { useState } from 'react';
import { LiveQueueTable } from '../../components/queue/LiveQueueTable';
import { useQueueStream } from '../../hooks/useQueueStream';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Stethoscope,
  Radio
} from 'lucide-react';

export const AdminQueueMonitor: React.FC = () => {
  const { queue, loading, refreshQueue } = useQueueStream();
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Extract unique doctors
  const uniqueDoctors = Array.from(new Set(queue.map(q => q.doctorName).filter(Boolean)));

  // Filtered queue
  const filteredQueue = queue.filter(item => {
    const doctorMatch = selectedDoctorFilter === 'ALL' || item.doctorName === selectedDoctorFilter;
    const statusMatch = selectedStatusFilter === 'ALL' || item.queueStatus === selectedStatusFilter;
    return doctorMatch && statusMatch;
  });

  const waitingCount = queue.filter(q => q.queueStatus === 'WAITING').length;
  const inConsultCount = queue.filter(q => ['CALLED', 'IN_CONSULTATION'].includes(q.queueStatus)).length;
  const completedCount = queue.filter(q => q.queueStatus === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F291E] dark:text-[#F6F7F2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <Activity className="w-6 h-6" />
              </span>
              <span>Live Hospital Queue Monitor</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Stream</span>
            </span>
          </div>
          <p className="text-xs text-brand-600 dark:text-[#B6AD90] mt-1">
            Real-time multi-department oversight of patient arrival, room calling progression, and clinical consultation sequence.
          </p>
        </div>

        <button
          onClick={refreshQueue}
          disabled={loading}
          className="clinical-button-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38442D] rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-brand-600 dark:text-[#A4AC86]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Active Queue</span>
            <Users className="w-4 h-4 text-brand-700 dark:text-[#C2C5AA]" />
          </div>
          <div className="text-2xl font-black text-brand-900 dark:text-[#F6F7F2]">
            {queue.length}
          </div>
          <p className="text-[10px] text-brand-500 dark:text-[#889073]">Registered today</p>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38442D] rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-brand-600 dark:text-[#A4AC86]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Waiting in Lounge</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {waitingCount}
          </div>
          <p className="text-[10px] text-brand-500 dark:text-[#889073]">Checked-in and waiting</p>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38442D] rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-brand-600 dark:text-[#A4AC86]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Consultation</span>
            <Stethoscope className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {inConsultCount}
          </div>
          <p className="text-[10px] text-brand-500 dark:text-[#889073]">Inside physician suites</p>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38442D] rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-brand-600 dark:text-[#A4AC86]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Discharged / Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </div>
          <p className="text-[10px] text-brand-500 dark:text-[#889073]">Consultation concluded</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38442D] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-brand-600 dark:text-[#A4AC86] mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">Doctor Filter:</span>
          </div>

          <button
            onClick={() => setSelectedDoctorFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
              selectedDoctorFilter === 'ALL'
                ? 'bg-brand-900 dark:bg-emerald-700 text-white border-brand-900 dark:border-emerald-600'
                : 'bg-brand-50 dark:bg-[#242E1C] text-brand-900 dark:text-[#C2C5AA] border-brand-300 dark:border-[#3B472E]'
            }`}
          >
            All Specialists
          </button>

          {uniqueDoctors.map(doc => (
            <button
              key={doc}
              onClick={() => setSelectedDoctorFilter(doc)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                selectedDoctorFilter === doc
                  ? 'bg-brand-900 dark:bg-emerald-700 text-white border-brand-900 dark:border-emerald-600'
                  : 'bg-brand-50 dark:bg-[#242E1C] text-brand-900 dark:text-[#C2C5AA] border-brand-300 dark:border-[#3B472E]'
              }`}
            >
              {doc}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-brand-600 dark:text-[#A4AC86]">Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="text-xs bg-[#FAFBF7] dark:bg-[#161D12] border border-brand-300 dark:border-[#333E28] text-brand-900 dark:text-[#F6F7F2] rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="WAITING">Waiting</option>
            <option value="CALLED">Called</option>
            <option value="IN_CONSULTATION">In Consultation</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Live Queue Table */}
      <LiveQueueTable
        queue={filteredQueue}
        userRole="ADMIN"
      />
    </div>
  );
};
