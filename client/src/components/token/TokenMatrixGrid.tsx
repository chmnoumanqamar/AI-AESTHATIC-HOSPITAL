import React, { useState } from 'react';
import { Ban, CheckCircle2, Clock, User, X, FileText, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';

export interface TokenSlot {
  id: string;
  tokenNumber: number;
  status: 'AVAILABLE' | 'RESERVED' | 'ACTIVE' | 'CANCELLED';
  patientName?: string;
  queueStatus?: string;
  cancelledAt?: string;
  appointmentId?: string;
  appointmentStatus?: string;
}

interface TokenMatrixGridProps {
  tokens: TokenSlot[];
  dailyLimit: number;
  onSelectToken?: (token: TokenSlot) => void;
  onStartConsultation?: (appointmentId: string) => void;
  onRefresh?: () => void;
}

export const TokenMatrixGrid: React.FC<TokenMatrixGridProps> = ({
  tokens,
  dailyLimit,
  onSelectToken,
  onStartConsultation,
  onRefresh
}) => {
  const [selectedToken, setSelectedToken] = useState<TokenSlot | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleTokenClick = (token: TokenSlot) => {
    setSelectedToken(token);
    if (onSelectToken) onSelectToken(token);
  };

  const handleCancelToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to permanently cancel and lock this token slot? Once cancelled, it can NEVER be reused according to mathematical capacity invariants.')) {
      return;
    }

    try {
      setCancelling(true);
      await api.post(`/tokens/${tokenId}/cancel`);
      if (onRefresh) await onRefresh();
      setSelectedToken(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel token slot');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E2718] rounded-2xl p-5 sm:p-6 shadow-xs border border-[#E2E6D8] dark:border-[#2F3E29] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E6D8] dark:border-[#2F3E29]">
        <div>
          <h3 className="text-sm font-bold text-[#1F291E] dark:text-[#F6F7F2]">
            Sequential Token Matrix Visualizer
          </h3>
          <p className="text-xs text-[#656D4A] dark:text-[#A4AC86] mt-0.5">
            Click any token slot to view patient assignment, cancel slot, or initiate consultation.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#656D4A] dark:text-[#C2C5AA]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <span>Active / Waiting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 dark:bg-red-400" />
            <span>Cancelled (Locked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A4AC86] dark:bg-[#656D4A]" />
            <span>Reserved</span>
          </div>
        </div>
      </div>

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
        {tokens.map((token) => {
          const isCancelled = token.status === 'CANCELLED';
          const isCompleted = token.queueStatus === 'COMPLETED';
          const isCalled = token.queueStatus === 'CALLED';
          const isWaiting = token.queueStatus === 'WAITING';
          const isReserved = token.status === 'RESERVED' && !isWaiting && !isCalled && !isCompleted;

          return (
            <button
              key={token.id}
              onClick={() => handleTokenClick(token)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isCancelled
                  ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 opacity-85 hover:opacity-100'
                  : isCompleted
                  ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 hover:shadow-xs'
                  : isCalled
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 animate-pulse shadow-xs'
                  : isWaiting
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 hover:shadow-xs'
                  : 'bg-[#FAFBF7] dark:bg-[#151D12] border-[#E2E6D8] dark:border-[#2F3E29] hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-mono font-extrabold text-sm ${
                  isCancelled
                    ? 'text-red-700 dark:text-red-400 line-through'
                    : isCompleted
                    ? 'text-blue-700 dark:text-blue-400'
                    : isCalled
                    ? 'text-amber-700 dark:text-amber-300'
                    : isWaiting
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-[#1F291E] dark:text-white'
                }`}>
                  #{String(token.tokenNumber).padStart(2, '0')}
                </span>

                {isCancelled ? (
                  <Ban className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                ) : isCalled ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                ) : isWaiting ? (
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#A4AC86]" />
                )}
              </div>

              <div className="mt-2 text-[11px] truncate w-full">
                <p className="font-semibold truncate text-[#1F291E] dark:text-[#F6F7F2]">
                  {token.patientName && token.patientName !== 'N/A' ? token.patientName : 'Walk-In Slot'}
                </p>
                <p className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${
                  isCancelled
                    ? 'text-red-600 dark:text-red-400 font-bold'
                    : isCompleted
                    ? 'text-blue-600 dark:text-blue-400'
                    : isCalled
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : isWaiting
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-[#656D4A] dark:text-[#A4AC86]'
                }`}>
                  {isCancelled ? 'LOCKED' : token.queueStatus || token.status}
                </p>
              </div>
            </button>
          );
        })}

        {tokens.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-[#656D4A] dark:text-[#A4AC86]">
            No tokens issued for this schedule yet. Click &quot;Issue Walk-In Token&quot; above to allocate slots.
          </div>
        )}
      </div>

      {/* SLOT DETAIL & QUICK ACTIONS MODAL */}
      {selectedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1A2215] border border-[#E2E6D8] dark:border-[#333D29] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6D8] dark:border-[#333D29]">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-base px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  #{String(selectedToken.tokenNumber).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#1F291E] dark:text-[#F6F7F2]">
                    Token Slot Details
                  </h3>
                  <span className="text-[10px] text-[#656D4A] dark:text-[#A4AC86]">
                    Slot ID: {selectedToken.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedToken(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF7] dark:bg-[#151D12] border border-[#E2E6D8] dark:border-[#2F3E29] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#656D4A] dark:text-[#A4AC86]">Assigned Patient:</span>
                <span className="font-bold text-[#1F291E] dark:text-white">
                  {selectedToken.patientName || 'Open Walk-In Slot'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#656D4A] dark:text-[#A4AC86]">Queue Status:</span>
                <StatusBadge status={selectedToken.queueStatus || selectedToken.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#656D4A] dark:text-[#A4AC86]">Token State:</span>
                <span className={`font-mono font-bold ${
                  selectedToken.status === 'CANCELLED' ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {selectedToken.status}
                </span>
              </div>
              {selectedToken.cancelledAt && (
                <div className="flex items-center justify-between text-[11px] text-red-600 dark:text-red-400">
                  <span>Locked At:</span>
                  <span>{new Date(selectedToken.cancelledAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-1">
              {selectedToken.appointmentId && onStartConsultation && selectedToken.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => {
                    onStartConsultation(selectedToken.appointmentId!);
                    setSelectedToken(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Start Consultation & Prescribe Rx</span>
                </button>
              )}

              {selectedToken.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => handleCancelToken(selectedToken.id)}
                  className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{cancelling ? 'Locking Slot...' : 'Cancel Token (Lock Slot Permanently)'}</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center text-xs text-red-700 dark:text-red-300 font-semibold flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>This slot is permanently locked and non-reusable</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TokenMatrixGrid;
