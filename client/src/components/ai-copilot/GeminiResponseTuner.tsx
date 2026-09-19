import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, FileText, Minimize2, Maximize2, Languages, Sparkles } from 'lucide-react';

interface GeminiResponseTunerProps {
  onTuningSelect: (tuningType: 'simpler' | 'shorter' | 'detailed' | 'urdu') => void;
}

export const GeminiResponseTuner: React.FC<GeminiResponseTunerProps> = ({ onTuningSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    {
      id: 'simpler' as const,
      label: 'Simpler',
      desc: 'Explain in easy layman terms',
      icon: FileText
    },
    {
      id: 'shorter' as const,
      label: 'Shorter',
      desc: 'Quick bulleted summary',
      icon: Minimize2
    },
    {
      id: 'detailed' as const,
      label: 'More Detailed',
      desc: 'Full clinical & pharmacological breakdown',
      icon: Maximize2
    },
    {
      id: 'urdu' as const,
      label: 'Urdu (اردو / Roman)',
      desc: 'Translate response to Urdu',
      icon: Languages
    }
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-[#202C1B] transition-colors cursor-pointer text-xs flex items-center gap-1"
        title="Modify response"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="text-[10px] hidden sm:inline">Modify</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1.5 w-56 rounded-2xl bg-white dark:bg-[#1A2316] border border-slate-200 dark:border-emerald-900/50 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" /> Modify Response
          </div>

          <div className="space-y-0.5 mt-1">
            {options.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setIsOpen(false);
                    onTuningSelect(opt.id);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-[#253420] text-slate-700 dark:text-[#E2E8D8] text-xs transition-colors flex items-center gap-2 cursor-pointer group"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[11px] leading-tight text-slate-800 dark:text-[#F0F4E8]">
                      {opt.label}
                    </div>
                    <div className="text-[9.5px] text-slate-400 dark:text-[#889980] truncate">
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
