import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Play, Check, Clock, UserCheck, AlertCircle, Calendar } from 'lucide-react';

export interface QueueItem {
  appointmentId: string;
  queueEntryId?: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  serviceName: string;
  appointmentStatus: string;
  queueStatus: string;
  checkInTime?: string;
  calledTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
}

interface LiveQueueTableProps {
  queue: QueueItem[];
  userRole?: string;
  onCheckIn?: (appointmentId: string) => void;
  onStartConsultation?: (appointmentId: string) => void;
  onCompleteConsultation?: (appointmentId: string) => void;
}

export const LiveQueueTable: React.FC<LiveQueueTableProps> = ({
  queue,
  userRole = 'DOCTOR',
  onCheckIn,
  onStartConsultation,
  onCompleteConsultation
}) => {
  return (
    <div className="clinical-card overflow-hidden">
      {/* Table Header Section */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[#414833] bg-[#FAFBF7] dark:bg-[#1F2718]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Consultation Queue</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-[#A4AC86]">Patient arrival progression and clinical queue sequence</p>
        </div>
        <span className="self-start sm:self-auto text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-[#414833] bg-slate-100 dark:bg-[#2D3923] text-slate-800 dark:text-slate-200">
          {queue.length} Total Registered
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#414833] text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-[#1F2718] text-slate-600 dark:text-[#A4AC86]">
              <th className="py-3 px-5">Token</th>
              <th className="py-3 px-5">Patient Details</th>
              <th className="py-3 px-5">Doctor</th>
              <th className="py-3 px-5">Service</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#2D3923] text-sm">
            {queue.map((item) => {
              const isCalled = item.queueStatus === 'CALLED';
              const isInConsultation = item.queueStatus === 'IN_CONSULTATION';
              const isCompleted = item.queueStatus === 'COMPLETED';
              const isNotCheckedIn = item.queueStatus === 'NOT_CHECKED_IN';

              return (
                <tr
                  key={item.appointmentId}
                  className={`transition-colors ${
                    isCalled
                      ? 'bg-amber-50/50 dark:bg-amber-950/30'
                      : isInConsultation
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'hover:bg-slate-50/80 dark:hover:bg-[#242E1C]'
                  }`}
                >
                  {/* Token Number */}
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#414833] bg-slate-100 dark:bg-[#2D3923] text-slate-900 dark:text-white">
                      #{String(item.tokenNumber).padStart(2, '0')}
                    </span>
                  </td>

                  {/* Patient Name & Phone */}
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-slate-900 dark:text-white">{item.patientName}</div>
                    <div className="text-xs font-mono text-slate-500 dark:text-[#A4AC86]">{item.patientPhone || 'No contact'}</div>
                  </td>

                  {/* Doctor */}
                  <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                    {item.doctorName}
                  </td>

                  {/* Service */}
                  <td className="py-3.5 px-5 text-xs font-medium">
                    <span className="px-2 py-0.5 rounded font-medium border text-xs bg-slate-50 dark:bg-[#242E1C] border-slate-200 dark:border-[#414833] text-slate-700 dark:text-slate-300">
                      {item.serviceName}
                    </span>
                  </td>

                  {/* Queue Status */}
                  <td className="py-3.5 px-5">
                    <StatusBadge status={item.queueStatus} size="sm" />
                  </td>

                  {/* Operational Actions */}
                  <td className="py-3.5 px-5 text-right">
                    {/* Receptionist Quick Check-In */}
                    {(userRole === 'RECEPTIONIST' || userRole === 'ADMIN') && isNotCheckedIn && onCheckIn && (
                      <button
                        onClick={() => onCheckIn(item.appointmentId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 clinical-button-primary rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-white" />
                        <span>Check In</span>
                      </button>
                    )}

                    {/* Doctor Consultation Controls */}
                    {(userRole === 'DOCTOR' || userRole === 'ADMIN') && isCalled && onStartConsultation && (
                      <button
                        onClick={() => onStartConsultation(item.appointmentId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs animate-pulse"
                      >
                        <Play className="w-3.5 h-3.5 text-white" />
                        <span>Begin Consultation</span>
                      </button>
                    )}

                    {(userRole === 'DOCTOR' || userRole === 'ADMIN') && isInConsultation && onCompleteConsultation && (
                      <button
                        onClick={() => onCompleteConsultation(item.appointmentId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 clinical-button-primary rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Prescribe & Finish</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                        Completed at {item.consultationEndTime ? new Date(item.consultationEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {queue.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">No active appointments in the queue today.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Tokens will display here once patients are checked in.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default LiveQueueTable;
