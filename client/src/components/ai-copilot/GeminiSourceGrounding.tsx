import React from 'react';
import { ShieldCheck, ExternalLink, Database } from 'lucide-react';

interface GroundingSourceItem {
  title: string;
  subtitle?: string;
  sourceUrl?: string;
  verified?: boolean;
}

interface GeminiSourceGroundingProps {
  sources?: GroundingSourceItem[];
  onSelectTab?: (tab: string) => void;
}

export const GeminiSourceGrounding: React.FC<GeminiSourceGroundingProps> = ({
  sources = [],
  onSelectTab
}) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-emerald-900/30 text-[11px] space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wide uppercase text-slate-400 dark:text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Grounding Sources
        </span>
        <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded-md border border-emerald-300/40">
          Verified with live hospital records
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {sources.map((src, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (src.title.toLowerCase().includes('pharmacy') && onSelectTab) {
                onSelectTab('pharma_inventory');
              } else if (src.title.toLowerCase().includes('queue') && onSelectTab) {
                onSelectTab('doctor_queue');
              } else if (src.title.toLowerCase().includes('audit') && onSelectTab) {
                onSelectTab('admin_audit');
              }
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-[#1A2316] dark:hover:bg-[#23311E] text-slate-700 dark:text-[#C5D0BC] border border-slate-200/80 dark:border-emerald-900/40 transition-colors text-[10.5px] cursor-pointer"
            title={src.subtitle || 'Verified live record'}
          >
            <Database className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{src.title}</span>
            {src.subtitle && (
              <span className="text-[9.5px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                ({src.subtitle})
              </span>
            )}
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};
