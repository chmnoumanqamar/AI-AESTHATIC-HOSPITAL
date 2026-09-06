import React from 'react';
import { Users, Activity, AlertCircle, Sparkles } from 'lucide-react';

interface DigitalTokenHUDProps {
  currentCalledToken?: number | null;
  totalWaiting?: number;
  availableCapacity?: number;
  cancelledCount?: number;
  activeDoctorName?: string;
  dailyLimit?: number;
  onAdjustLimit?: () => void;
}

export const DigitalTokenHUD: React.FC<DigitalTokenHUDProps> = ({
  currentCalledToken = null,
  totalWaiting = 0,
  availableCapacity = 0,
  cancelledCount = 0,
  activeDoctorName = 'Attending Physician',
  dailyLimit = 100,
  onAdjustLimit
}) => {
  const isPatientSummoned = Boolean(currentCalledToken && currentCalledToken > 0);

  return (
    <div className="clinical-card p-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Active Consultation Status */}
        <div className="flex items-center gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#A4AC86]">
                Current Consultation
              </span>
              {isPatientSummoned ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-50 dark:bg-[#352511] text-amber-800 dark:text-[#FDE68A] border-amber-200 dark:border-[#92400E]">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-amber-500 dark:bg-[#FBBF24]" />
                  Live in Room 1
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-100 dark:bg-[#2D3923] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Room Ready
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              {isPatientSummoned ? (
                <span className="font-mono font-extrabold text-4xl tracking-tight text-slate-900 dark:text-white">
                  #{String(currentCalledToken).padStart(2, '0')}
                </span>
              ) : (
                <div className="flex items-center gap-2 py-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">Ready to Summon</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-[#A4AC86]">(No patient active)</span>
                </div>
              )}
            </div>
          </div>

          <div className="h-12 w-[1px] hidden sm:block mx-2 bg-slate-200 dark:bg-slate-700" />

          {/* Target Physician Details */}
          <div className="hidden sm:flex flex-col justify-center">
            <span className="text-[11px] font-bold uppercase tracking-wider mb-0.5 text-slate-500 dark:text-[#A4AC86]">
              Target Physician
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {activeDoctorName}
            </span>
            <div className="text-xs text-slate-500 dark:text-[#A4AC86] flex items-center gap-1.5">
              <span>Daily Capacity Limit: <strong className="text-slate-900 dark:text-white">{dailyLimit} patients</strong></span>
              {onAdjustLimit && (
                <button
                  type="button"
                  onClick={onAdjustLimit}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#EAF2EC] dark:bg-[#2D3E2F] text-[#2D6A4F] dark:text-[#74C69D] hover:bg-[#D8E8DC] dark:hover:bg-[#3D523F] transition-colors cursor-pointer"
                  title="Adjust Daily Patient Limit"
                >
                  Adjust
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Modern Metric Cards */}
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          {/* Waiting */}
          <div className="rounded-xl p-3 min-w-[110px] text-center border shadow-xs transition-all bg-amber-50/60 dark:bg-[#2D2314] border-amber-200 dark:border-[#5E421E]">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold mb-1 text-amber-800 dark:text-[#FDE68A]">
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-[#FBBF24]" />
              <span>Waiting</span>
            </div>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalWaiting}</span>
          </div>

          {/* Remaining */}
          <div className="rounded-xl p-3 min-w-[110px] text-center border shadow-xs transition-all bg-emerald-50/60 dark:bg-[#1A2E20] border-emerald-200 dark:border-[#2D6A4F]">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold mb-1 text-emerald-800 dark:text-[#74C69D]">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-[#52B788]" />
              <span>Remaining</span>
            </div>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{availableCapacity}</span>
          </div>

          {/* Cancelled */}
          <div className="rounded-xl p-3 min-w-[110px] text-center border shadow-xs transition-all bg-rose-50/60 dark:bg-[#2E1818] border-rose-200 dark:border-[#5E2B2B]">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold mb-1 text-rose-800 dark:text-[#FCA5A5]">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-[#F87171]" />
              <span>Cancelled</span>
            </div>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{cancelledCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DigitalTokenHUD;
