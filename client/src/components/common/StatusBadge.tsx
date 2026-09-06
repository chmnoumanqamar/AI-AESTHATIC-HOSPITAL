import React from 'react';

export type BadgeVariant =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'ACTIVE'
  | 'RESERVED'
  | 'NOT_CHECKED_IN';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  // High-Contrast Semantic Styling with Flawless Light & Dark mode adaptation
  let badgeClasses = 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
  let dotClasses = 'bg-slate-500 dark:bg-slate-400';

  if (['CONFIRMED', 'COMPLETED', 'ACTIVE'].includes(normalized)) {
    badgeClasses = 'bg-emerald-50 dark:bg-[#1E3326] text-emerald-800 dark:text-[#74C69D] border-emerald-200 dark:border-[#2D6A4F]';
    dotClasses = 'bg-emerald-600 dark:bg-[#52B788]';
  } else if (['CALLED', 'IN_CONSULTATION'].includes(normalized)) {
    badgeClasses = 'bg-sky-50 dark:bg-[#15293A] text-sky-800 dark:text-[#7DD3FC] border-sky-200 dark:border-[#0284C7]';
    dotClasses = 'bg-sky-500 dark:bg-[#38BDF8] animate-pulse';
  } else if (['WAITING', 'RESERVED', 'PENDING'].includes(normalized)) {
    badgeClasses = 'bg-amber-50 dark:bg-[#352511] text-amber-900 dark:text-[#FDE68A] border-amber-200 dark:border-[#92400E]';
    dotClasses = 'bg-amber-600 dark:bg-[#FBBF24]';
  } else if (['DECLINED', 'CANCELLED', 'NO_SHOW'].includes(normalized)) {
    badgeClasses = 'bg-rose-50 dark:bg-[#381B1B] text-rose-800 dark:text-[#FCA5A5] border-rose-200 dark:border-[#7F1D1D]';
    dotClasses = 'bg-rose-600 dark:bg-[#F87171]';
  } else if (['NOT_CHECKED_IN'].includes(normalized)) {
    badgeClasses = 'bg-slate-100 dark:bg-[#282E22] text-slate-700 dark:text-[#D7DBC7] border-slate-200 dark:border-[#414833]';
    dotClasses = 'bg-slate-500 dark:bg-[#A4AC86]';
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg border shadow-xs transition-colors ${
        isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${badgeClasses}`}
    >
      <span 
        className={`inline-block rounded-full shrink-0 ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${dotClasses}`} 
      />
      <span className="tracking-wider uppercase text-[10px] leading-tight font-bold">
        {status.replace(/_/g, ' ')}
      </span>
    </span>
  );
};
export default StatusBadge;
