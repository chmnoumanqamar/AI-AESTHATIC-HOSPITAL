import React, { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Users,
  CalendarCheck,
  Activity,
  FileText,
  CreditCard,
  Lock,
  X,
  Check,
  Server,
  HeartPulse
} from 'lucide-react';
import { api } from '../../services/api';

interface DatabaseStats {
  patients: number;
  appointments: number;
  queueEntries: number;
  dailyTokens: number;
  clinicalRecords: number;
  prescriptions: number;
  payments: number;
  notificationLogs: number;
  users: number;
  doctors: number;
  receptionists: number;
  services: number;
  auditLogs: number;
  timestamp: string;
}

export const AdminDatabaseMaintenance: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'SUCCESS' | 'ERROR';
    title: string;
    message: string;
    details?: any;
  } | null>(null);

  // Modal State for Purge
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');

  // Modal State for Demo Reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/database/stats');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load database stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExecutePurge = async () => {
    if (confirmationInput.trim().toUpperCase() !== 'CLEAR' && confirmationInput.trim().toUpperCase() !== 'PURGE') {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/admin/database/purge', {
        action: 'CLEAN_SLATE',
        confirmText: confirmationInput
      });

      const data = res.data?.data;
      setFeedback({
        type: 'SUCCESS',
        title: 'Rough Data Successfully Purged!',
        message: 'All dummy patients, appointments, queue, clinical notes, and billing records have been cleared. System is 100% clean and ready for live patients.',
        details: data?.purgeResult?.purged
      });

      setIsPurgeModalOpen(false);
      setConfirmationInput('');
      fetchStats();
    } catch (err: any) {
      setFeedback({
        type: 'ERROR',
        title: 'Purge Failed',
        message: err.response?.data?.message || 'Could not complete database purge.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteReset = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/admin/database/purge', {
        action: 'RESET_DEMO'
      });

      setFeedback({
        type: 'SUCCESS',
        title: 'Factory Demo Data Restored!',
        message: 'Sample demo patients, 12-month analytics data, doctor appointments, and test records have been re-seeded.',
        details: res.data?.data?.currentStats
      });

      setIsResetModalOpen(false);
      fetchStats();
    } catch (err: any) {
      setFeedback({
        type: 'ERROR',
        title: 'Reset Failed',
        message: err.response?.data?.message || 'Could not restore demo data.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const isPurgeReady = confirmationInput.trim().toUpperCase() === 'CLEAR' || confirmationInput.trim().toUpperCase() === 'PURGE';

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F291E] dark:text-[#F6F7F2] flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 shadow-xs">
              <Database className="w-5 h-5" />
            </span>
            <span>Database Maintenance & Data Purge Center</span>
          </h1>
          <p className="text-xs text-[#656D4A] dark:text-[#A4AC86] mt-1">
            Safely clear rough mock/test data for live clinical start, or restore factory demo records.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#1E2718] text-[#1F291E] dark:text-[#F6F7F2] border border-[#E2E6D8] dark:border-[#333D29] hover:bg-[#F0F3EB] dark:hover:bg-[#283520] transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Live Stats</span>
        </button>
      </div>

      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-fade-in ${
            feedback.type === 'SUCCESS'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700/80 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs sm:text-sm font-bold">{feedback.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{feedback.message}</p>
              {feedback.details && (
                <div className="mt-2 text-[11px] font-mono bg-white/70 dark:bg-black/30 p-2.5 rounded-lg border border-black/5 dark:border-white/10 flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(feedback.details).map(([key, value]) => (
                    <span key={key}>
                      <strong className="capitalize">{key}:</strong> {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-current cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Database Inventory Metrics */}
      <div className="bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#333D29] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E6D8] dark:border-[#333D29] mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-[#1F291E] dark:text-[#F6F7F2]">
              Current Database Record Inventory
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#656D4A] dark:text-[#A4AC86]">
            {stats?.timestamp ? `Live as of ${new Date(stats.timestamp).toLocaleTimeString()}` : 'Connecting...'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Patients */}
          <div className="p-3.5 rounded-xl bg-[#F0F3EB]/70 dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29]">
            <div className="flex items-center gap-1.5 text-xs text-[#656D4A] dark:text-[#A4AC86]">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Patients</span>
            </div>
            <div className="text-xl font-extrabold text-[#1F291E] dark:text-white mt-1">
              {loading ? '...' : stats?.patients ?? 0}
            </div>
            <div className="text-[10px] text-[#878E76] mt-0.5">Registered Profiles</div>
          </div>

          {/* Appointments */}
          <div className="p-3.5 rounded-xl bg-[#F0F3EB]/70 dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29]">
            <div className="flex items-center gap-1.5 text-xs text-[#656D4A] dark:text-[#A4AC86]">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Appointments</span>
            </div>
            <div className="text-xl font-extrabold text-[#1F291E] dark:text-white mt-1">
              {loading ? '...' : stats?.appointments ?? 0}
            </div>
            <div className="text-[10px] text-[#878E76] mt-0.5">Booked & Completed</div>
          </div>

          {/* Queue & Tokens */}
          <div className="p-3.5 rounded-xl bg-[#F0F3EB]/70 dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29]">
            <div className="flex items-center gap-1.5 text-xs text-[#656D4A] dark:text-[#A4AC86]">
              <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>OPD Queue</span>
            </div>
            <div className="text-xl font-extrabold text-[#1F291E] dark:text-white mt-1">
              {loading ? '...' : stats?.queueEntries ?? 0}
            </div>
            <div className="text-[10px] text-[#878E76] mt-0.5">Tokens: {stats?.dailyTokens ?? 0}</div>
          </div>

          {/* Clinical & Rx */}
          <div className="p-3.5 rounded-xl bg-[#F0F3EB]/70 dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29]">
            <div className="flex items-center gap-1.5 text-xs text-[#656D4A] dark:text-[#A4AC86]">
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Clinical / Rx</span>
            </div>
            <div className="text-xl font-extrabold text-[#1F291E] dark:text-white mt-1">
              {loading ? '...' : (stats?.clinicalRecords ?? 0) + (stats?.prescriptions ?? 0)}
            </div>
            <div className="text-[10px] text-[#878E76] mt-0.5">EMR Consultations</div>
          </div>

          {/* Invoices & Payments */}
          <div className="p-3.5 rounded-xl bg-[#F0F3EB]/70 dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29]">
            <div className="flex items-center gap-1.5 text-xs text-[#656D4A] dark:text-[#A4AC86]">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Invoices</span>
            </div>
            <div className="text-xl font-extrabold text-[#1F291E] dark:text-white mt-1">
              {loading ? '...' : stats?.payments ?? 0}
            </div>
            <div className="text-[10px] text-[#878E76] mt-0.5">POS & Receipts</div>
          </div>

          {/* Preserved Staff */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Protected Staff</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
              {loading ? '...' : (stats?.doctors ?? 0) + (stats?.receptionists ?? 0) + 1}
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Never Wiped</div>
          </div>
        </div>
      </div>

      {/* Main Operations Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: PURGE ROUGH DATA (CLEAN SLATE) */}
        <div className="bg-white dark:bg-[#1E2718] border-2 border-red-200 dark:border-red-900/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-100 dark:border-red-900/40">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                  <Trash2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-red-950 dark:text-red-200">
                    Purge Rough / Mock Data (Fresh Start)
                  </h3>
                  <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Recommended for Live Clinical Launch
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-800">
                HIGH IMPACT
              </span>
            </div>

            <p className="text-xs text-[#525B44] dark:text-[#C2C5AA] leading-relaxed">
              Use this option when you are ready to start hospital operations with real patients. It removes all test/rough dummy transactions across all modules, leaving your system 100% clean.
            </p>

            {/* What is cleared */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#1F291E] dark:text-[#F6F7F2] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>What will be completely removed:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#656D4A] dark:text-[#A4AC86] pl-6 list-disc">
                <li>All dummy patient profiles and patient login users.</li>
                <li>All booked, pending, and historical appointments.</li>
                <li>Live OPD queue entries and issued daily tokens.</li>
                <li>All doctor clinical exam notes, diagnoses, and prescriptions.</li>
                <li>All billing transactions, invoices, and POS payments.</li>
                <li>Audit vault reset with a single clean-slate genesis entry.</li>
              </ul>
            </div>

            {/* What is preserved */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-[#152319] border border-emerald-200 dark:border-emerald-800/80 text-xs space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>What is strictly safeguarded (Never Deleted):</span>
              </div>
              <p className="text-emerald-800 dark:text-emerald-400 text-[11px] pl-5.5">
                • <strong>Root Administrator</strong> (<code className="text-[10px]">admin@hospital.com</code>)<br />
                • <strong>Staff Doctors</strong> (Dr. Aisha Khan, Dr. Marcus Vance)<br />
                • <strong>Front-Desk Receptionists</strong> (Sarah Jenkins)<br />
                • <strong>Clinical Services Catalog</strong> (Cardiology, Dermatology, etc.)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setConfirmationInput('');
              setIsPurgeModalOpen(true);
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Rough Data & Prepare Clean Slate</span>
          </button>
        </div>

        {/* CARD 2: RESET TO FACTORY DEMO */}
        <div className="bg-white dark:bg-[#1E2718] border border-[#E2E6D8] dark:border-[#333D29] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6D8] dark:border-[#333D29]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <RotateCcw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#1F291E] dark:text-[#F6F7F2]">
                    Reset to Factory Demo Dataset
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Demo & Presentation Mode
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#283520] text-slate-700 dark:text-[#C2C5AA] border border-slate-300 dark:border-[#333D29]">
                FACTORY RESTORE
              </span>
            </div>

            <p className="text-xs text-[#525B44] dark:text-[#C2C5AA] leading-relaxed">
              Want to test features, train staff, or present a live demonstration? This restores the full sample dataset including patients, appointments, 12 months of analytical trends, and demo tokens.
            </p>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#1F291E] dark:text-[#F6F7F2] flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Demo items restored on reset:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#656D4A] dark:text-[#A4AC86] pl-6 list-disc">
                <li>Sample patients (Amina Khan, Bilal Ahmed, etc.).</li>
                <li>Active OPD queue for today with waiting and called status.</li>
                <li>150+ sample invoices across last 12 months for visual analytics.</li>
                <li>Sample medical records and versioned prescriptions (v1 & v2).</li>
                <li>Default HIPAA audit compliance log entries.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-[#121E2A] border border-blue-200 dark:border-blue-900/60 text-xs">
              <div className="font-bold text-blue-900 dark:text-blue-300">
                Safe & Reversible
              </div>
              <p className="text-blue-800 dark:text-blue-400 text-[11px] mt-0.5">
                You can switch between Clean Slate and Factory Demo at any time whenever needed.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore Factory Demo Dataset</span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL: PURGE ROUGH DATA */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1A2215] border border-red-300 dark:border-red-900/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-red-100 dark:border-red-950">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="font-extrabold text-base text-[#1F291E] dark:text-white">
                  Confirm Clean Slate Purge
                </h3>
              </div>
              <button
                onClick={() => setIsPurgeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>Irreversible Data Deletion Warning</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-95">
                This will permanently delete all {stats?.patients ?? 0} dummy patients, {stats?.appointments ?? 0} appointments, {stats?.queueEntries ?? 0} queue tickets, and {stats?.payments ?? 0} payments. Staff and admin credentials will be preserved.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#1F291E] dark:text-[#F6F7F2]">
                To proceed, type <span className="font-mono font-bold text-red-600 dark:text-red-400">CLEAR</span> or <span className="font-mono font-bold text-red-600 dark:text-red-400">PURGE</span> below:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={e => setConfirmationInput(e.target.value)}
                placeholder="Type CLEAR to confirm..."
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#38482E] bg-white dark:bg-[#151D12] text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-[#A4AC86] hover:bg-slate-100 dark:hover:bg-[#283520] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isPurgeReady || actionLoading}
                onClick={handleExecutePurge}
                className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                  isPurgeReady && !actionLoading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-300 dark:bg-[#2F3E29] text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{actionLoading ? 'Purging Database...' : 'Confirm & Wipe Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET TO DEMO */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1A2215] border border-emerald-300 dark:border-emerald-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-950">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
                <RotateCcw className="w-6 h-6" />
                <h3 className="font-extrabold text-base text-[#1F291E] dark:text-white">
                  Restore Factory Demo Dataset
                </h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#525B44] dark:text-[#C2C5AA] leading-relaxed">
              This will re-populate your database with sample patients, active OPD queues, 12 months historical analytical invoices, and test medical records.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-[#A4AC86] hover:bg-slate-100 dark:hover:bg-[#283520] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteReset}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#2D6A4F] hover:bg-[#1B4332] shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>{actionLoading ? 'Restoring Dataset...' : 'Restore Demo Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDatabaseMaintenance;
