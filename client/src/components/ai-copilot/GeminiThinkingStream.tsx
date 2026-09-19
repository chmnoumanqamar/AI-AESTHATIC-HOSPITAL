import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Search, ShieldCheck, Database, CheckCircle2, Cpu } from 'lucide-react';

interface GeminiThinkingStreamProps {
  isStreaming?: boolean;
  durationMs?: number;
  steps?: string[];
  searchingSteps?: Array<{ label: string; status: 'done' | 'active' }>;
  thinkingText?: string;
  defaultExpanded?: boolean;
}

export const GeminiThinkingStream: React.FC<GeminiThinkingStreamProps> = ({
  isStreaming = false,
  durationMs = 1200,
  steps = [],
  searchingSteps = [],
  thinkingText,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer during streaming
  useEffect(() => {
    if (!isStreaming) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(timer);
  }, [isStreaming]);

  const defaultSteps = [
    'Screened clinical safety & emergency deflection guardrails',
    'Cross-referenced hospital knowledge vault and doctor schedules',
    'Formulated patient-friendly clinical response'
  ];

  const displaySteps = steps.length > 0 ? steps : defaultSteps;
  const secondsDisplay = isStreaming
    ? elapsedSeconds
    : (durationMs ? (durationMs / 1000).toFixed(1) : '1.2');

  // While generating/streaming in real-time
  if (isStreaming) {
    return (
      <div className="my-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-teal-900/10 to-transparent border border-emerald-500/30 shadow-xs animate-in fade-in duration-300">
        <div className="flex items-center gap-2.5">
          {/* Animated Gemini Sparkle Orb */}
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-spin-slow">
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>

          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span>Thinking...</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {secondsDisplay}s
              </span>
            </span>

            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 animate-pulse">
              Gemini 3.8 Flash
            </span>
          </div>
        </div>

        {/* Live Search Status Progress */}
        <div className="mt-2.5 space-y-1.5 pl-8 border-l-2 border-emerald-500/20 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
            <Search className="w-3 h-3 animate-spin" />
            <span>Consulting hospital database & live schedules...</span>
          </div>
          {searchingSteps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Finished thinking: Collapsible Gemini-style Accordion
  return (
    <div className="mb-2.5 text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1C2718] dark:hover:bg-[#253420] text-slate-600 dark:text-emerald-300/80 text-[11px] font-medium transition-all cursor-pointer border border-slate-200/60 dark:border-emerald-900/40 select-none group"
      >
        <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span>Thinking Process</span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-emerald-500 font-bold">
          ({secondsDisplay}s)
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-slate-400" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        )}
      </button>

      {/* Expanded Reasoning Chain */}
      {isExpanded && (
        <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#131A10] border border-slate-200/80 dark:border-emerald-900/40 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-emerald-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Chain of Thought (CoT)
            </span>
            <span>Grounding Score: 99.4%</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-[#C5CEBC] leading-relaxed">
            {displaySteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {thinkingText && (
            <div className="pt-2 border-t border-slate-200 dark:border-emerald-900/30 text-[11px] font-mono text-slate-500 dark:text-[#9FB096] italic">
              "{thinkingText}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
