import React from 'react';
import { Check, X, Clock, Calendar, User, Sparkles } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export interface PendingBookingRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientCnic?: string;
  doctorId: string;
  doctorName: string;
  serviceName?: string;
  appointmentDate: string;
  tokenNumber?: number;
  bookingSource: string;
  status: string;
  createdAt: string;
}

interface BookingApprovalDeckProps {
  pendingRequests: PendingBookingRequest[];
  onApprove: (appointmentId: string) => Promise<void>;
  onDecline: (appointmentId: string) => Promise<void>;
}

export const BookingApprovalDeck: React.FC<BookingApprovalDeckProps> = ({
  pendingRequests,
  onApprove,
  onDecline
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xs border" style={{ borderColor: '#C2C5AA' }}>
      <div 
        className="px-5 py-3.5 border-b flex items-center justify-between"
        style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA' }}
      >
        <div>
          <h3 className="operational-sub-header" style={{ color: '#333D29' }}>Front-Desk Booking Approval Deck</h3>
          <p className="text-xs font-medium" style={{ color: '#7F4F24' }}>Pending appointment requests from Patient Portal and AI Copilot</p>
        </div>
        <span 
          className="operational-metadata-tag px-2.5 py-1 rounded font-bold border"
          style={{ backgroundColor: '#EAECE2', borderColor: '#C2C5AA', color: '#656D4A' }}
        >
          {pendingRequests.length} Pending Actions
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#D7DBC7' }}>
        {pendingRequests.map((req) => (
          <div key={req.id} className="p-4 hover:bg-[#F6F7F2] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: '#333D29' }}>{req.patientName}</span>
                <span 
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                  style={{ backgroundColor: '#EAECE2', borderColor: '#C2C5AA', color: '#333D29' }}
                >
                  Token #{String(req.tokenNumber).padStart(2, '0')}
                </span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold border"
                  style={{ backgroundColor: '#FAFBF7', borderColor: '#D7DBC7', color: '#7F4F24' }}
                >
                  Source: {req.bookingSource}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: '#414833' }}>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" style={{ color: '#656D4A' }} />
                  Target: <strong style={{ color: '#333D29' }}>{req.doctorName}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" style={{ color: '#656D4A' }} />
                  Date: <strong style={{ color: '#333D29' }}>{req.appointmentDate}</strong>
                </span>
                {req.serviceName && (
                  <span>Service: {req.serviceName}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => onDecline(req.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border text-xs font-semibold rounded transition-colors"
                style={{ backgroundColor: '#F2E8DE', borderColor: '#A68A64', color: '#582F0E' }}
              >
                <X className="w-3.5 h-3.5" />
                Decline
              </button>
              <button
                onClick={() => onApprove(req.id)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-white text-xs font-semibold rounded transition-colors shadow-xs"
                style={{ backgroundColor: '#656D4A' }}
              >
                <Check className="w-3.5 h-3.5 text-white" />
                Approve & Confirm
              </button>
            </div>
          </div>
        ))}

        {pendingRequests.length === 0 && (
          <div className="py-8 text-center text-xs text-brand-600">
            No pending booking requests waiting for front-desk approval.
          </div>
        )}
      </div>
    </div>
  );
};
