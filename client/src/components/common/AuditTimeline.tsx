import React, { useState } from 'react';
import {
  History,
  ArrowRight,
  Stethoscope,
  FileText,
  Activity,
  CreditCard,
  ShieldCheck,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  Check,
  SearchX
} from 'lucide-react';

export interface AuditItem {
  id: string;
  actorId?: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: any;
  newState?: any;
  metadata?: any;
  timestamp: string;
}

interface AuditTimelineProps {
  logs: AuditItem[];
  title?: string;
  onResetFilters?: () => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  logs,
  title = 'Immutable Audit Trail',
  onResetFilters
}) => {
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleDiff = (id: string) => {
    setExpandedDiffId(prev => (prev === id ? null : id));
  };

  const handleCopyJson = (id: string, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getResourceMeta = (resourceType: string) => {
    const rt = resourceType.toLowerCase();
    if (rt.includes('clinical')) {
      return {
        icon: Stethoscope,
        label: 'Clinical Record',
        badge: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-600 ring-emerald-300 dark:ring-emerald-800'
      };
    }
    if (rt.includes('prescription')) {
      return {
        icon: FileText,
        label: 'Prescription',
        badge: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
        dot: 'bg-indigo-600 ring-indigo-300 dark:ring-indigo-800'
      };
    }
    if (rt.includes('queue') || rt.includes('token')) {
      return {
        icon: Activity,
        label: 'Queue / Token',
        badge: 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800',
        dot: 'bg-sky-600 ring-sky-300 dark:ring-sky-800'
      };
    }
    if (rt.includes('pay') || rt.includes('bill')) {
      return {
        icon: CreditCard,
        label: 'Financial / Billing',
        badge: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        dot: 'bg-amber-600 ring-amber-300 dark:ring-amber-800'
      };
    }
    if (rt.includes('appoint')) {
      return {
        icon: User,
        label: 'Appointment',
        badge: 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
        dot: 'bg-teal-600 ring-teal-300 dark:ring-teal-800'
      };
    }
    return {
      icon: ShieldCheck,
      label: resourceType,
      badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      dot: 'bg-slate-600 ring-slate-300 dark:ring-slate-700'
    };
  };

  return (
    <div className="bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38442D] rounded-xl p-5 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-5 border-b border-brand-200 dark:border-[#333E28] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-brand-900 dark:text-[#F6F7F2] tracking-tight">{title}</h3>
            <p className="text-xs text-brand-600 dark:text-[#B6AD90]">Append-only, immutable forensic log of all hospital operations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F3EB] dark:bg-[#203628] text-[#1B4332] dark:text-[#74C69D] border border-[#A7D7C5] dark:border-[#2D6A4F]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
            <span>{logs.length} Immutable Records</span>
          </span>
        </div>
      </div>

      {/* Empty State */}
      {logs.length === 0 ? (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-brand-50/50 dark:bg-[#182013] rounded-lg border border-dashed border-brand-300 dark:border-[#333E28]">
          <div className="p-3 bg-brand-100 dark:bg-[#242E1C] rounded-full text-brand-600 dark:text-[#B6AD90]">
            <SearchX className="w-8 h-8" />
          </div>
          <h4 className="font-semibold text-sm text-brand-900 dark:text-[#F6F7F2]">No Matching Audit Entries</h4>
          <p className="text-xs text-brand-600 dark:text-[#A4AC86] max-w-md">
            No immutable transactions match the current filter or search criteria.
          </p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="mt-2 text-xs font-semibold px-4 py-1.5 rounded-lg bg-brand-900 text-white hover:bg-brand-800 transition-all shadow-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Timeline Nodes */
        <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-[2px] before:bg-brand-200 dark:before:bg-[#333E28]">
          {logs.map((log) => {
            const resMeta = getResourceMeta(log.resourceType);
            const IconComponent = resMeta.icon;

            const dateObj = new Date(log.timestamp);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const formattedTime = dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const hasDiff = Boolean(log.previousState && log.newState);
            const isDiffExpanded = expandedDiffId === log.id;
            const reason = log.metadata?.editReason || log.metadata?.correctionReason;

            return (
              <div key={log.id} className="relative group">
                {/* Timeline Pin Marker */}
                <div
                  className={`absolute -left-[30px] sm:-left-[35px] top-2 w-4 h-4 rounded-full border-2 border-white dark:border-[#1E2718] ring-2 shadow-xs transition-transform group-hover:scale-110 ${resMeta.dot}`}
                />

                {/* Card Body */}
                <div className="bg-[#FAFBF7] dark:bg-[#161D12] border border-brand-300/80 dark:border-[#313B26] rounded-xl p-4 text-xs space-y-2.5 hover:border-brand-600 dark:hover:border-[#52B788] transition-all shadow-xs">
                  {/* Top Bar: Action Title & DateTime */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-brand-200/70 dark:border-[#2D3823]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${resMeta.badge}`}>
                        <IconComponent className="w-3 h-3" />
                        <span>{resMeta.label}</span>
                      </span>
                      <span className="font-bold text-sm text-brand-900 dark:text-[#F6F7F2] tracking-wide">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-brand-600 dark:text-[#B6AD90] font-mono text-[11px]">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span className="font-semibold text-brand-900 dark:text-[#E8F3EB]">{formattedTime}</span>
                    </div>
                  </div>

                  {/* Operational Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-brand-700 dark:text-[#C2C5AA]">
                    <span className="flex items-center gap-1">
                      <span className="text-brand-500 dark:text-[#889073]">Actor:</span>
                      <strong className="px-1.5 py-0.5 rounded bg-brand-100 dark:bg-[#25301D] text-brand-900 dark:text-[#F6F7F2] font-semibold">
                        {log.actorType}
                        {log.actorId ? ` (${log.actorId})` : ''}
                      </strong>
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-1">
                      <span className="text-brand-500 dark:text-[#889073]">Resource ID:</span>
                      <code className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-brand-100 dark:bg-[#25301D] text-brand-900 dark:text-[#E8F3EB]">
                        {log.resourceId}
                      </code>
                    </span>

                    {log.metadata?.cashier && (
                      <>
                        <span>•</span>
                        <span>Cashier: <strong className="text-brand-900 dark:text-[#F6F7F2]">{log.metadata.cashier}</strong></span>
                      </>
                    )}

                    {log.metadata?.patientName && (
                      <>
                        <span>•</span>
                        <span>Patient: <strong className="text-brand-900 dark:text-[#F6F7F2]">{log.metadata.patientName}</strong></span>
                      </>
                    )}
                  </div>

                  {/* Reason Callout (Crucial for HIPAA & Clinical compliance) */}
                  {reason && (
                    <div className="flex items-start gap-2 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-lg text-amber-900 dark:text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[11px] uppercase tracking-wider block text-amber-800 dark:text-amber-400">
                          Authorized Clinical Justification
                        </span>
                        <p className="italic text-xs mt-0.5 leading-relaxed">
                          "{reason}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Diff Inspector Component */}
                  {hasDiff && (
                    <div className="mt-2.5 border border-brand-200 dark:border-[#313B26] rounded-lg overflow-hidden bg-white dark:bg-[#1E2718]">
                      {/* Diff Header Bar */}
                      <div className="flex items-center justify-between px-3 py-2 bg-brand-100/60 dark:bg-[#242E1C] border-b border-brand-200 dark:border-[#313B26]">
                        <div className="flex items-center gap-1.5 font-semibold text-brand-900 dark:text-[#F6F7F2] text-[11px]">
                          <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>State Revision Diff (Atomic Ledger Mutation)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyJson(log.id, { previous: log.previousState, current: log.newState })}
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#1A2215] border border-brand-300 dark:border-[#3B472E] text-brand-700 dark:text-[#C2C5AA] hover:text-brand-900"
                            title="Copy JSON Diff"
                          >
                            {copiedId === log.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Diff</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => toggleDiff(log.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-brand-800 dark:text-[#E8F3EB] hover:underline"
                          >
                            <span>{isDiffExpanded ? 'Collapse' : 'Inspect'}</span>
                            {isDiffExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Side by side preview */}
                      <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        {/* Previous State */}
                        <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded p-2 text-rose-900 dark:text-rose-300">
                          <div className="font-bold text-[10px] text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Previous State (Revoked)</span>
                          </div>
                          <div className="font-mono text-[10px] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap break-all">
                            {typeof log.previousState === 'object'
                              ? JSON.stringify(log.previousState, null, isDiffExpanded ? 2 : undefined)
                              : String(log.previousState)}
                          </div>
                        </div>

                        {/* New State */}
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded p-2 text-emerald-900 dark:text-emerald-300">
                          <div className="font-bold text-[10px] text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Committed State (Active)</span>
                          </div>
                          <div className="font-mono text-[10px] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap break-all">
                            {typeof log.newState === 'object'
                              ? JSON.stringify(log.newState, null, isDiffExpanded ? 2 : undefined)
                              : String(log.newState)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single New State Payload (for creation events without previous state) */}
                  {!hasDiff && log.newState && (
                    <div className="mt-2 border border-brand-200/80 dark:border-[#2D3823] rounded p-2 bg-brand-100/30 dark:bg-[#1A2215]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-brand-600 dark:text-[#A4AC86] uppercase tracking-wider">
                          Committed Payload
                        </span>
                        <button
                          onClick={() => handleCopyJson(log.id, log.newState)}
                          className="text-[10px] flex items-center gap-1 text-brand-600 dark:text-[#C2C5AA] hover:text-brand-900"
                        >
                          {copiedId === log.id ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{copiedId === log.id ? 'Copied' : 'JSON'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-[10.5px] text-brand-900 dark:text-[#E8F3EB] max-h-20 overflow-y-auto whitespace-pre-wrap break-all">
                        {typeof log.newState === 'object' ? JSON.stringify(log.newState) : String(log.newState)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
