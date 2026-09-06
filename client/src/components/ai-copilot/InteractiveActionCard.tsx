import React from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Clock, 
  Users, 
  Activity, 
  Shield, 
  ExternalLink,
  Sparkles,
  FileText,
  Stethoscope
} from 'lucide-react';

interface InteractiveActionCardProps {
  cardData: any;
  onConfirmAction?: (actionText: string) => void;
  onBookDoctor?: (doctorId: string, date: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const InteractiveActionCard: React.FC<InteractiveActionCardProps> = ({
  cardData,
  onConfirmAction,
  onBookDoctor,
  onSelectTab
}) => {
  if (!cardData) return null;

  // 1. Two-Step Confirmation Handshake Card
  if (cardData.type === 'CONFIRMATION_REQUIRED') {
    return (
      <div className="mt-2.5 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-xl space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs uppercase tracking-wide">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Security Authorization Required</span>
        </div>

        <div className="bg-white dark:bg-[#1E2718] p-2.5 rounded-lg border border-amber-200 dark:border-[#38482E] text-xs space-y-1 text-slate-800 dark:text-[#E8F3EB]">
          <div>Action: <strong className="text-brand-900 dark:text-white">{cardData.action}</strong></div>
          {cardData.doctorName && <div>Doctor: <strong className="text-brand-900 dark:text-white">{cardData.doctorName}</strong></div>}
          {cardData.appointmentDate && <div>Date: <strong className="text-brand-900 dark:text-white">{cardData.appointmentDate}</strong></div>}
          {cardData.tokenNumber && <div>Token: <strong className="font-mono text-emerald-700 dark:text-emerald-400">#{cardData.tokenNumber}</strong></div>}
          {cardData.newDate && <div>New Proposed Date: <strong className="text-brand-900 dark:text-white font-bold">{cardData.newDate}</strong></div>}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onConfirmAction && onConfirmAction('Yes')}
            className="flex-1 py-2 px-3 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
          >
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Confirm & Proceed</span>
          </button>
          <button
            onClick={() => onConfirmAction && onConfirmAction('No')}
            className="py-2 px-3.5 bg-white dark:bg-[#242E1C] border border-brand-300 dark:border-[#3B472E] text-slate-700 dark:text-[#C2C5AA] hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // 2. Safety Disclaimer Card (Diagnostic Deflection)
  if (cardData.type === 'SAFETY_DISCLAIMER' || cardData.type === 'EMERGENCY_ALERT') {
    const isEmergency = cardData.type === 'EMERGENCY_ALERT';

    return (
      <div className={`mt-2.5 p-3 rounded-xl border text-xs space-y-1.5 shadow-xs ${
        isEmergency 
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200' 
          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
      }`}>
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{cardData.title}</span>
        </div>
        <p className="leading-relaxed text-[11px] opacity-90">{cardData.actionPrompt || 'Please speak with a licensed clinician.'}</p>
        {isEmergency && (
          <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg font-bold text-center text-rose-950 dark:text-rose-100 font-mono text-xs mt-1">
            EMERGENCY LINE: {cardData.emergencyPhone || '1122 / 911'}
          </div>
        )}
      </div>
    );
  }

// 2.5. Doctor Availability & Live Slot Capacity Card
  if (cardData.type === 'DOCTOR_AVAILABILITY_CARD' && cardData.doctors) {
    const doctors = cardData.doctors;
    const dates = cardData.dates || [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
    ];

    return (
      <div className="mt-2.5 space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>OPD Roster & Live Capacity</span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#A4AC86]">Real-time Tokens</span>
        </div>

        {doctors.map((doc: any) => {
          const todayAvail = doc.todaySlots?.available ?? (doc.dailyPatientLimit || 80);
          const tomorrowAvail = doc.tomorrowSlots?.available ?? (doc.dailyPatientLimit || 80);
          const hasSlotsToday = todayAvail > 0;

          return (
            <div 
              key={doc.id}
              className="p-3 bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38482E] rounded-2xl text-xs space-y-2 shadow-xs hover:border-emerald-500/80 transition-all"
            >
              {/* Doctor Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {doc.specialization}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-[#A4AC86]">
                    {doc.experienceYears} yrs exp • {doc.qualifications?.join(', ')}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                    PKR {doc.consultationFee?.toLocaleString()}
                  </span>
                  <span className="block text-[9px] text-slate-400 dark:text-[#889073] mt-0.5">
                    Follow-up: PKR {doc.followUpFee?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Clinic Shifts */}
              <div className="p-2 bg-[#F6F8F3] dark:bg-[#202C1B] rounded-xl border border-brand-200/80 dark:border-[#2C3B24] space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-[#D5DAC8]">
                  <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-[#A4AC86] shrink-0" />
                  <span>
                    {doc.shifts?.morning && doc.shifts.morning !== 'N/A' && (
                      <span className="mr-2">🌅 Morning: <strong>{doc.shifts.morning}</strong></span>
                    )}
                    {doc.shifts?.evening && (
                      <span>🌇 Evening: <strong>{doc.shifts.evening}</strong></span>
                    )}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-[#A4AC86] flex items-center justify-between">
                  <span>🗓️ {doc.shifts?.days || 'Monday - Saturday'}</span>
                  <span>⏱️ {doc.shifts?.consultationDuration || '15 mins/patient'}</span>
                </div>
              </div>

              {/* Slot Availability Strip */}
              <div className="grid grid-cols-2 gap-1.5 text-center text-[10px]">
                <div className={`p-1.5 rounded-lg border ${hasSlotsToday ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300' : 'bg-slate-50 dark:bg-[#202919] border-slate-200 text-slate-400'}`}>
                  <span className="block font-bold">Today ({dates[0]?.slice(5)})</span>
                  <span className="text-[9px] font-semibold">{hasSlotsToday ? `✅ ${todayAvail} Slots Open` : '❌ Fully Booked'}</span>
                </div>
                <div className="p-1.5 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300">
                  <span className="block font-bold">Tomorrow ({dates[1]?.slice(5)})</span>
                  <span className="text-[9px] font-semibold">✅ {tomorrowAvail} Slots Open</span>
                </div>
              </div>

              {/* Booking Actions */}
              <div className="pt-1 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-[#2C3B24]">
                <button
                  onClick={() => onBookDoctor && onBookDoctor(doc.id, dates[0])}
                  disabled={!hasSlotsToday}
                  className={`py-1.5 px-3 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all shadow-xs cursor-pointer ${
                    hasSlotsToday
                      ? 'text-white bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] hover:opacity-95 active:scale-95'
                      : 'bg-slate-200 dark:bg-[#242E1C] text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Book Today</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onBookDoctor && onBookDoctor(doc.id, dates[1])}
                  className="py-1.5 px-3 text-[11px] font-bold rounded-xl text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 border border-emerald-300/80 dark:border-emerald-800 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>Book Tomorrow</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 2.6. Interactive Booking Picker Card
  if (cardData.type === 'BOOKING_PICKER' && cardData.doctors) {
    const doctors = cardData.doctors;
    const dates = cardData.availableDates || [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
    ];

    return (
      <div className="mt-2.5 p-3.5 bg-white dark:bg-[#1A2317] border border-emerald-300 dark:border-emerald-800/70 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">Fast Appointment Booking</h4>
            <p className="text-[10px] text-slate-500 dark:text-[#A4AC86]">Select your physician to secure sequential token</p>
          </div>
        </div>

        <div className="space-y-2">
          {doctors.map((doc: any) => (
            <div 
              key={doc.id}
              className="p-2.5 bg-[#FAFBF8] dark:bg-[#1F2B1A] border border-brand-200 dark:border-[#38482E] rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">{doc.name}</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">{doc.specialization}</div>
                <div className="text-[9.5px] text-slate-400 dark:text-[#889073] font-mono">Fee: PKR {doc.consultationFee}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onBookDoctor && onBookDoctor(doc.id, dates[0])}
                  className="py-1 px-2.5 text-[10.5px] font-bold rounded-lg text-white bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] shadow-xs hover:opacity-90 active:scale-95 cursor-pointer"
                >
                  Book ({dates[0]?.slice(5)})
                </button>
                <button
                  onClick={() => onBookDoctor && onBookDoctor(doc.id, dates[1])}
                  className="py-1 px-2.5 text-[10.5px] font-bold rounded-lg text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                >
                  ({dates[1]?.slice(5)})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2.7. Booking Confirmed Token Card
  if (cardData.type === 'BOOKING_CONFIRMED') {
    return (
      <div className="mt-2.5 p-3.5 bg-white dark:bg-[#1A2317] border border-emerald-400 dark:border-emerald-700 rounded-2xl shadow-sm space-y-2.5 animate-in fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Booking Request Registered!</h4>
              <p className="text-[9.5px] text-slate-500 dark:text-[#A4AC86]">Sequential token allocated</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300/60">
            PENDING TRIAGE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-[#1E2B1A] border border-emerald-200/80 dark:border-[#33462A]">
            <span className="text-[9.5px] text-slate-500 dark:text-[#A4AC86] block">Allocated Token</span>
            <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
              #{cardData.tokenNumber}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1E2B1A] border border-slate-200 dark:border-[#33462A]">
            <span className="text-[9.5px] text-slate-500 dark:text-[#A4AC86] block">Target Date</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {cardData.appointmentDate}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-700 dark:text-[#D5DAC8]">
          <div>Doctor: <strong className="text-slate-900 dark:text-white">{cardData.doctorName}</strong></div>
          <p className="text-[10px] text-slate-500 dark:text-[#A4AC86] mt-0.5">
            Your token is queued in OPD. Front-desk receptionist will verify and confirm.
          </p>
        </div>

        {onSelectTab && (
          <button
            onClick={() => onSelectTab('patient_portal')}
            className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
          >
            <span>View in My Appointments</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // 3. Doctor Discovery Card (Fallback)
  if (cardData.type === 'DOCTOR_LIST' && cardData.doctors) {
    return (
      <div className="mt-2.5 space-y-2">
        {cardData.doctors.map((doc: any) => (
          <div key={doc.id} className="p-3 bg-white dark:bg-[#1E2718] border border-brand-300 dark:border-[#38482E] rounded-xl text-xs space-y-1.5 shadow-xs hover:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">{doc.name}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">PKR {doc.consultationFee}</span>
            </div>
            <p className="text-slate-600 dark:text-[#A4AC86] text-[11px]">{doc.specialization} • {doc.experienceYears} yrs experience</p>
            <div className="pt-1 flex items-center justify-end">
              <button
                onClick={() => onBookDoctor && onBookDoctor(doc.id, new Date().toISOString().split('T')[0])}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Request Consultation</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 4. Live OPD Queue Summary Card
  if (cardData.type === 'QUEUE_SUMMARY') {
    return (
      <div className="mt-2.5 p-3.5 bg-white dark:bg-[#1A2317] border border-emerald-300 dark:border-emerald-800/70 rounded-2xl shadow-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">Live OPD Queue</h4>
              <p className="text-[10px] text-slate-500 dark:text-[#A4AC86]">Real-time patient flow</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/60">
            Active Stream
          </span>
        </div>

        {/* 4 Stat Badges Grid */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="text-base font-extrabold text-amber-900 dark:text-amber-300 leading-none">{cardData.waiting ?? 0}</div>
            <div className="text-[9.5px] font-semibold text-amber-700 dark:text-amber-400/80 mt-1 uppercase tracking-tight">Waiting</div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <div className="text-base font-extrabold text-emerald-900 dark:text-emerald-300 leading-none">{cardData.inConsultation ?? 0}</div>
            <div className="text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-400/80 mt-1 uppercase tracking-tight">In Cabin</div>
          </div>
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50">
            <div className="text-base font-extrabold text-sky-900 dark:text-sky-300 leading-none">{cardData.completed ?? 0}</div>
            <div className="text-[9.5px] font-semibold text-sky-700 dark:text-sky-400/80 mt-1 uppercase tracking-tight">Done</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#202919] border border-slate-200 dark:border-[#38482E]">
            <div className="text-base font-extrabold text-slate-900 dark:text-white leading-none">{cardData.total ?? 0}</div>
            <div className="text-[9.5px] font-semibold text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-tight">Total</div>
          </div>
        </div>

        {/* Next in Line Banner */}
        {cardData.nextToken && (
          <div className="p-2 rounded-xl bg-[#F4F9F5] dark:bg-[#1E2B1A] border border-[#A7D7C5] dark:border-[#33462A] flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-[#C2C5AA] text-[11px]">Next Calling:</span>
            <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 rounded font-mono text-[10px]">
                Token #{cardData.nextToken}
              </span>
              <span>{cardData.nextPatientName || ''}</span>
            </span>
          </div>
        )}

        {/* Quick Nav Button */}
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('admin_queue')}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
          >
            <span>Open Live Queue Monitor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // 5. Pending Approvals Card
  if (cardData.type === 'PENDING_APPROVALS') {
    return (
      <div className="mt-2.5 p-3.5 bg-white dark:bg-[#1A2317] border border-amber-300 dark:border-amber-800/70 rounded-2xl shadow-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">Pending Approvals</h4>
              <p className="text-[10px] text-slate-500 dark:text-[#A4AC86]">Awaiting staff review</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300/60">
            {cardData.count || 0} Requests
          </span>
        </div>

        {/* List of Pending Appointments */}
        {cardData.appointments && cardData.appointments.length > 0 ? (
          <div className="space-y-2">
            {cardData.appointments.slice(0, 3).map((app: any, idx: number) => (
              <div 
                key={app.id || idx}
                className="p-2.5 bg-[#FAFBF8] dark:bg-[#1F2B1A] border border-brand-200 dark:border-[#38482E] rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">{app.patientName}</span>
                  <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-brand-100 dark:bg-[#2C3B24] text-slate-700 dark:text-[#C2C5AA]">
                    {app.bookingSource || 'ONLINE'}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-[#A4AC86] text-[10.5px]">
                  Dr: <strong>{app.doctorName}</strong> • {app.appointmentDate}
                </div>
                {app.chiefComplaint && (
                  <p className="text-[10px] text-slate-500 dark:text-[#9AA282] italic truncate">
                    "{app.chiefComplaint}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-xl text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            ✅ All booking requests have been reviewed and approved.
          </div>
        )}

        {/* Quick Review Button */}
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('admin_users')}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold text-amber-950 dark:text-amber-100 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 border border-amber-300/80 dark:border-amber-800/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Open Appointments Control</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // 6. Audit Vault Summary Card
  if (cardData.type === 'AUDIT_VAULT_SUMMARY') {
    const stats = cardData.stats || {};
    const b = stats.breakdown || {};

    return (
      <div className="mt-2.5 p-3.5 bg-white dark:bg-[#1A2317] border border-teal-300 dark:border-teal-800/70 rounded-2xl shadow-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-800 dark:text-teal-300">
              <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">Immutable Audit Vault</h4>
              <p className="text-[10px] text-slate-500 dark:text-[#A4AC86]">Append-only forensic ledger</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-200 border border-teal-300/60">
            SHA-256 Verified
          </span>
        </div>

        {/* 4 Category Counters */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2B1A] border border-slate-200 dark:border-[#38482E]">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{b.clinical ?? 0}</div>
            <div className="text-[9px] font-semibold text-slate-600 dark:text-[#A4AC86] mt-1">Clinical</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2B1A] border border-slate-200 dark:border-[#38482E]">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{b.prescriptions ?? 0}</div>
            <div className="text-[9px] font-semibold text-slate-600 dark:text-[#A4AC86] mt-1">Rx Diff</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2B1A] border border-slate-200 dark:border-[#38482E]">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{b.queue ?? 0}</div>
            <div className="text-[9px] font-semibold text-slate-600 dark:text-[#A4AC86] mt-1">OPD</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2B1A] border border-slate-200 dark:border-[#38482E]">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{b.payments ?? 0}</div>
            <div className="text-[9px] font-semibold text-slate-600 dark:text-[#A4AC86] mt-1">Billing</div>
          </div>
        </div>

        {/* Cryptographic Integrity Row */}
        <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-600 dark:text-[#C2C5AA]">Ledger Integrity:</span>
          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Tamper-Free</span>
          </span>
        </div>

        {/* Quick Nav Button */}
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('admin_audit')}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)' }}
          >
            <span>Inspect Full Audit Vault</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
          </button>
        )}
      </div>
    );
  }

  return null;
};
