import React, { useState } from 'react';
import { UserCheck, Search, X, Sparkles, AlertCircle, Phone, Stethoscope } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { QueueItem } from '../queue/LiveQueueTable';

interface CheckInControllerProps {
  onSearchAndCheckIn: (query: string) => Promise<void>;
  queue?: QueueItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCheckInPatient?: (appointmentId: string) => Promise<void>;
}

export const CheckInController: React.FC<CheckInControllerProps> = ({
  onSearchAndCheckIn,
  queue = [],
  searchQuery: externalSearchQuery,
  onSearchChange,
  onCheckInPatient
}) => {
  const [internalQuery, setInternalQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const query = externalSearchQuery !== undefined ? externalSearchQuery : internalQuery;

  const setQuery = (newVal: string) => {
    if (onSearchChange) {
      onSearchChange(newVal);
    } else {
      setInternalQuery(newVal);
    }
  };

  // Alphabetical & Prefix-Priority Matching Logic
  const trimmedQuery = query.trim().toLowerCase();
  const suggestions = trimmedQuery
    ? queue
        .filter(item => {
          // 1. Exact or prefix match on token number
          if (
            String(item.tokenNumber) === trimmedQuery ||
            String(item.tokenNumber).padStart(2, '0') === trimmedQuery
          ) {
            return true;
          }

          // 2. Phone match
          if (item.patientPhone && item.patientPhone.toLowerCase().includes(trimmedQuery)) {
            return true;
          }

          // 3. Alphabetical / Word Prefix Match on Patient Name
          // (e.g. typing 'e' only matches names where first or last name starts with 'e', like 'Emily Clark')
          const nameWords = item.patientName.toLowerCase().split(/\s+/);
          if (nameWords.some((w: string) => w.startsWith(trimmedQuery))) {
            return true;
          }

          // 4. Substring match only for queries of 3+ letters
          if (trimmedQuery.length >= 3 && item.patientName.toLowerCase().includes(trimmedQuery)) {
            return true;
          }

          return false;
        })
        .sort((a, b) => a.patientName.localeCompare(b.patientName))
    : [];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedQuery) return;
    setLoading(true);
    try {
      await onSearchAndCheckIn(query.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (item: QueueItem) => {
    if (item.queueStatus === 'NOT_CHECKED_IN' && onCheckInPatient) {
      setLoading(true);
      try {
        await onCheckInPatient(item.appointmentId);
      } finally {
        setLoading(false);
      }
    } else {
      setQuery(item.patientName);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="clinical-card p-4 transition-all">
      <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setQuery('');
            }}
            placeholder="Type patient name alphabetically (e.g. 'E' for Emily), token #, or phone..."
            className="w-full clinical-input pr-10"
            style={{ paddingLeft: '2.5rem' }}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !trimmedQuery}
          className="w-full sm:w-auto clinical-button-primary text-xs flex items-center justify-center gap-2 whitespace-nowrap py-2.5 px-4"
        >
          <UserCheck className="w-4 h-4 text-white" />
          <span>{loading ? 'Verifying...' : 'Check In Patient'}</span>
        </button>
      </form>

      {/* In-Flow Live Matching Patients Section (Alphabetical & High-Contrast) */}
      {trimmedQuery.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#E2E6D8] dark:border-[#333D29] space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <div className="flex items-center gap-2 text-slate-700 dark:text-[#D7DBC7]">
              <Sparkles className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
              <span>Matching Patients ({suggestions.length})</span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-[#A4AC86]">
                • Alphabetical Order
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-[#A4AC86]">
              Press ESC or click X to clear
            </span>
          </div>

          <div className="space-y-2">
            {suggestions.map(item => (
              <div
                key={item.appointmentId}
                onClick={() => handleSelectSuggestion(item)}
                className="group p-3.5 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF7] dark:bg-[#1E2717] hover:bg-white dark:hover:bg-[#242E1C] hover:border-[#2D6A4F] dark:hover:border-[#52B788] transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 shadow-xs hover:shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Patient Avatar Circle with Initial */}
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-[#1E3326] border border-emerald-200 dark:border-[#2D6A4F] flex items-center justify-center shrink-0 font-bold text-sm text-emerald-800 dark:text-[#74C69D]">
                    {item.patientName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Token badge */}
                      <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded border border-[#DDE2D5] dark:border-[#414833] bg-white dark:bg-[#2D3923] text-slate-900 dark:text-white shrink-0">
                        #{String(item.tokenNumber).padStart(2, '0')}
                      </span>
                      {/* Patient Name with High Contrast */}
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.patientName}
                      </span>
                    </div>

                    {/* Contact & Physician Details */}
                    <div className="text-xs text-slate-500 dark:text-[#A4AC86] flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.patientPhone || 'No Phone'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-slate-400" />
                        <span>{item.doctorName}</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 dark:text-slate-500 font-sans">
                        {item.serviceName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status and Quick Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={item.queueStatus} size="sm" />
                  {item.queueStatus === 'NOT_CHECKED_IN' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSuggestion(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold clinical-button-primary rounded-lg shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Check In</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md text-slate-500 dark:text-[#A4AC86] bg-slate-100 dark:bg-[#2D3923] border border-slate-200 dark:border-[#414833]">
                      In System
                    </span>
                  )}
                </div>
              </div>
            ))}

            {suggestions.length === 0 && (
              <div className="p-5 text-center text-slate-500 dark:text-[#A4AC86] rounded-xl border border-dashed border-[#E2E6D8] dark:border-[#414833] bg-[#FAFBF7] dark:bg-[#1E2717]">
                <AlertCircle className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-medium">No patient found starting with or matching "{query}"</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try typing the first letter of their first or last name, phone, or token number.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default CheckInController;
