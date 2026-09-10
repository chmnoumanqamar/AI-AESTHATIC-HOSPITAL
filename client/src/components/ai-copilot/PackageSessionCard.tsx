import React from 'react';
import { Sparkles, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';

interface PackageSessionCardProps {
  cardData: {
    hasPackages?: boolean;
    packages?: Array<{
      id: string;
      name: string;
      category: string;
      totalSessions: number;
      completedSessions: number;
      remainingSessions: number;
      status: string;
      lastSessionDate: string;
      nextRecommendedDate: string;
      pricePKR: number;
      isNextDue: boolean;
    }>;
    primaryPackage?: any;
  };
  onBookSession: (prompt: string) => void;
}

export const PackageSessionCard: React.FC<PackageSessionCardProps> = ({ cardData, onBookSession }) => {
  const pkgs = cardData.packages || (cardData.primaryPackage ? [cardData.primaryPackage] : []);
  if (pkgs.length === 0) return null;

  return (
    <div className="my-2 space-y-2.5">
      {pkgs.map(pkg => {
        const percent = Math.min(100, Math.round((pkg.completedSessions / pkg.totalSessions) * 100));

        return (
          <div
            key={pkg.id}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1C2C1F]/90 to-[#142017] dark:from-[#1A2616] dark:to-[#0F170D] text-white border border-emerald-500/30 shadow-md space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {pkg.category || 'AESTHETIC DEAL'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300/80">
                    Rs. {pkg.pricePKR?.toLocaleString()}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-white mt-1">
                  {pkg.name}
                </h4>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                pkg.remainingSessions > 0
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {pkg.remainingSessions > 0 ? `${pkg.remainingSessions} Left` : 'Completed'}
              </span>
            </div>

            {/* Session Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-medium text-emerald-200/90">
                <span>Progress</span>
                <span className="font-bold">
                  {pkg.completedSessions} of {pkg.totalSessions} Sessions
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Timings & Booking Action */}
            <div className="pt-1.5 flex items-center justify-between border-t border-white/10 text-[10.5px]">
              <div className="text-emerald-100/70 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Next Recommended: <strong>{pkg.nextRecommendedDate}</strong></span>
              </div>

              {pkg.remainingSessions > 0 && (
                <button
                  onClick={() => onBookSession(`Schedule session #${pkg.completedSessions + 1} for my ${pkg.name} package`)}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-[10.5px] shadow-sm transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Book Session #{pkg.completedSessions + 1}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
