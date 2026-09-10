import React from 'react';
import { Clock, Bell, CheckCircle2, RefreshCw, ChevronRight } from 'lucide-react';

interface CountdownReminderBannerProps {
  reminder: {
    appointmentDate: string;
    doctorName: string;
    tokenNumber?: number;
    hoursRemaining?: number;
    daysRemaining?: number;
    countdownTier?: string;
    countdownLabel?: string;
    isUpcomingSoon?: boolean;
  };
  onActionClick: (prompt: string) => void;
}

export const CountdownReminderBanner: React.FC<CountdownReminderBannerProps> = ({
  reminder,
  onActionClick
}) => {
  if (!reminder) return null;

  const isUrgent = reminder.hoursRemaining !== undefined && reminder.hoursRemaining <= 3;
  const isOneHour = reminder.countdownTier === '1H' || (reminder.hoursRemaining !== undefined && reminder.hoursRemaining <= 1);

  return (
    <div className={`mx-3 mt-3 p-3 rounded-2xl shadow-xs border transition-all animate-in fade-in duration-200 ${
      isOneHour
        ? 'bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/40 dark:to-amber-950/40 border-red-300 dark:border-red-800/60'
        : isUrgent
        ? 'bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/40 dark:to-emerald-950/40 border-amber-300 dark:border-amber-800/60'
        : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200 dark:border-emerald-800/60'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <Clock className={`w-3.5 h-3.5 ${isOneHour ? 'text-red-600 animate-spin-slow' : 'text-emerald-600 dark:text-emerald-400 animate-pulse'}`} />
          <span className="text-slate-900 dark:text-emerald-100">
            {isOneHour ? 'Consultation in ~1 Hour!' : reminder.countdownLabel || 'Upcoming Consultation'}
          </span>
        </div>

        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
          isOneHour
            ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/60 dark:text-red-200'
            : isUrgent
            ? 'bg-amber-100 text-amber-850 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200'
        }`}>
          Token #{reminder.tokenNumber || '1'}
        </span>
      </div>

      <p className="mt-1.5 text-[11px] text-slate-700 dark:text-[#C8D3C0] leading-relaxed">
        Doctor: <strong className="text-slate-900 dark:text-white">{reminder.doctorName}</strong> on{' '}
        <strong className="text-slate-900 dark:text-white">{reminder.appointmentDate}</strong>.
      </p>

      {/* Action Controls */}
      <div className="mt-2.5 flex items-center gap-1.5 pt-1 border-t border-black/5 dark:border-white/10 flex-wrap">
        <button
          onClick={() => onActionClick('Confirm that I am attending my scheduled appointment')}
          className="px-2.5 py-1 bg-white dark:bg-[#1E2918] hover:bg-emerald-50 dark:hover:bg-[#273820] text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-[#384C2C] rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Confirm Attendance</span>
        </button>

        <button
          onClick={() => onActionClick('Check live clinic queue and waiting status')}
          className="px-2.5 py-1 bg-white dark:bg-[#1E2918] hover:bg-emerald-50 dark:hover:bg-[#273820] text-slate-700 dark:text-[#C5D0BC] border border-slate-300/80 dark:border-[#384C2C] rounded-lg text-[10.5px] font-medium transition-all cursor-pointer shadow-2xs"
        >
          <span>Live Queue</span>
        </button>

        <button
          onClick={() => onActionClick('Reschedule my upcoming appointment')}
          className="px-2 py-1 text-slate-500 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-300 text-[10px] font-medium transition-colors cursor-pointer ml-auto"
        >
          Reschedule
        </button>
      </div>
    </div>
  );
};
