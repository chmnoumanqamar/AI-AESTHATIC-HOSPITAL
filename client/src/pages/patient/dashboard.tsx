import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  FileText,
  CreditCard,
  Activity,
  ShieldCheck,
  Plus,
  Bell,
  User,
  UserPlus,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
  AlertTriangle,
  Receipt,
  Clock,
  RefreshCw,
  Phone,
  Shield,
  MessageSquare
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { api } from '../../services/api';

interface PatientDashboardProps {
  currentUser: any;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  currentUser,
  currentTab = 'patient_portal',
  onSelectTab
}) => {
  const patientId = currentUser?.profileId || 'pat-01';

  // Active tab state synced with prop
  const [activeTab, setActiveTab] = useState<string>(currentTab);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [history, setHistory] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Appointments Filter
  const [appointmentFilter, setAppointmentFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Booking Form State
  const [bookingFor, setBookingFor] = useState<'SELF' | 'NEW'>('SELF');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [bookingChannel, setBookingChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  // New Patient Form State (When booking for a family member or new person)
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientCnic, setNewPatientCnic] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientDob, setNewPatientDob] = useState('1995-01-01');
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [isCrossCheckModalOpen, setIsCrossCheckModalOpen] = useState(false);

  // Reschedule & Cancel Modals
  const [targetActionApp, setTargetActionApp] = useState<any>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');

  // Channel Preferences State
  const [primaryChannel, setPrimaryChannel] = useState(currentUser?.profile?.primaryNotificationChannel || 'WhatsApp');
  const [backupChannel, setBackupChannel] = useState(currentUser?.profile?.backupNotificationChannel || 'SMS');
  const [hasWhatsApp, setHasWhatsApp] = useState(currentUser?.profile?.hasWhatsApp ?? true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [appRes, histRes, billRes, docRes, srvRes] = await Promise.all([
        api.get('/appointments', { params: { patientId } }),
        api.get(`/clinical-records/patient/${patientId}/history`),
        api.get('/billing/my-summary'),
        api.get('/doctors'),
        api.get('/services')
      ]);
      setAppointments(appRes.data.data);
      setHistory(histRes.data.data);
      setBilling(billRes.data.data);
      setDoctors(docRes.data.data);
      setServices(srvRes.data.data);
      if (docRes.data.data.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Error loading patient portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  // Real-time duplicate check when entering new patient CNIC or Phone
  const handleCheckDuplicate = async () => {
    if (!newPatientCnic && !newPatientPhone) return;
    try {
      const res = await api.post('/patients/check-duplicate', {
        cnic: newPatientCnic,
        phone: newPatientPhone
      });
      if (res.data.data.isDuplicate) {
        setDuplicateWarning(res.data.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromptCrossCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingFor === 'NEW') {
      if (!newPatientName.trim() || !newPatientPhone.trim()) {
        alert('Baraye meharbani Mareez ka Naam aur Mobile Number darj karein.');
        return;
      }
    }
    setIsCrossCheckModalOpen(true);
  };

  const handleExecuteBooking = async () => {
    setIsSubmittingBooking(true);
    setBookingSuccessData(null);

    try {
      let targetPatientId = patientId;

      // If booking for a new person, register the patient profile first (frictionless: CNIC optional)
      if (bookingFor === 'NEW') {
        try {
          const regRes = await api.post('/auth/register', {
            fullName: newPatientName.trim(),
            phone: newPatientPhone.trim(),
            cnic: newPatientCnic.trim() || undefined,
            password: 'Password123!',
            gender: newPatientGender,
            dateOfBirth: newPatientDob,
            hasWhatsApp: bookingChannel === 'WhatsApp',
            primaryNotificationChannel: bookingChannel,
            backupNotificationChannel: bookingChannel === 'WhatsApp' ? 'SMS' : 'Email'
          });
          targetPatientId = regRes.data.data.user.profile.id;
        } catch (regErr: any) {
          // If already registered, proceed with existing record
          if (regErr.response?.data?.error?.message?.includes('already exists') || duplicateWarning?.existingPatientId) {
            targetPatientId = duplicateWarning?.existingPatientId || patientId;
          } else {
            targetPatientId = patientId;
          }
        }
      }

      const res = await api.post('/appointments/booking', {
        patientId: targetPatientId,
        doctorId: selectedDoctorId,
        serviceId: selectedServiceId || undefined,
        appointmentDate: bookingDate,
        bookingSource: 'PORTAL',
        chiefComplaint: chiefComplaint.trim() || undefined
      });

      setIsCrossCheckModalOpen(false);
      setBookingSuccessData({
        appointment: res.data.data,
        doctor: doctors.find(d => d.id === selectedDoctorId),
        patientName: bookingFor === 'NEW' ? newPatientName : (currentUser?.profile?.fullName || 'John Doe')
      });

      // Clear form inputs
      setChiefComplaint('');
      if (bookingFor === 'NEW') {
        setNewPatientName('');
        setNewPatientPhone('');
        setNewPatientCnic('');
        setDuplicateWarning(null);
      }

      await fetchPatientData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Booking request failed');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!targetActionApp) return;
    try {
      await api.patch(`/appointments/${targetActionApp.id}/status`, {
        status: 'CANCELLED',
        reason: 'Patient cancelled via portal'
      });
      alert('Appointment cancelled. Daily token slot is permanently locked.');
      setIsCancelConfirmOpen(false);
      setTargetActionApp(null);
      await fetchPatientData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Cancellation failed');
    }
  };

  const handleRescheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetActionApp || !newRescheduleDate) return;
    try {
      const res = await api.post('/appointments/reschedule', {
        appointmentId: targetActionApp.id,
        newDate: newRescheduleDate,
        reason: 'Rescheduled via Patient Portal'
      });
      alert(`✅ Reschedule request registered: Old appointment cancelled. New Token #${res.data.data.newAppointment.tokenNumber} is PENDING approval.`);
      setIsRescheduleOpen(false);
      setTargetActionApp(null);
      await fetchPatientData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Reschedule failed');
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      await api.patch('/patients/preferences', {
        hasWhatsApp,
        primaryNotificationChannel: primaryChannel,
        backupNotificationChannel: backupChannel
      });
      alert('✅ Multi-channel notification failover preferences updated!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const filteredAppointments = appointments.filter(app => {
    if (appointmentFilter === 'ALL') return true;
    return app.status === appointmentFilter;
  });

  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctorId);
  const selectedServiceObj = services.find(s => s.id === selectedServiceId);
  const totalEstimatedFee = (selectedDoctorObj?.consultationFee || 2000) + (selectedServiceObj?.baseFee || 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Patient Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Patient Portal</h1>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
            Welcome back, <strong>{currentUser?.profile?.fullName || currentUser?.fullName || currentUser?.name || currentUser?.phone || 'Patient'}</strong>
          </p>
        </div>

        {activeTab !== 'patient_booking' && (
          <button
            onClick={() => switchTab('patient_booking')}
            className="clinical-button-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        )}
      </div>



      {/* =========================================================================
          TAB 1: MY APPOINTMENTS & LIVE TOKENS (patient_portal)
          ========================================================================= */}
      {activeTab === 'patient_portal' && (
        <div className="space-y-6 animate-fade-in">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1E2717] rounded-xl p-5 shadow-xs space-y-1.5 border border-[#E2E6D8] dark:border-[#333D29]">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#656D4A] dark:text-[#A4AC86]">
                <span>Scheduled Visits</span>
                <CalendarCheck className="w-4 h-4 text-[#2D6A4F]" />
              </div>
              <div className="hud-token-display text-2xl font-bold text-[#1F291E] dark:text-white">{appointments.length}</div>
              <span className="text-[11px] font-medium text-[#7F4F24] dark:text-[#D7DBC7]">Active & Historical Tokens</span>
            </div>

            <div className="bg-white dark:bg-[#1E2717] rounded-xl p-5 shadow-xs space-y-1.5 border border-[#E2E6D8] dark:border-[#333D29]">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#656D4A] dark:text-[#A4AC86]">
                <span>Outstanding Balance</span>
                <CreditCard className="w-4 h-4 text-[#2D6A4F]" />
              </div>
              <div className="hud-token-display text-2xl font-bold font-mono text-[#1F291E] dark:text-white">
                PKR {billing?.balanceDue ? billing.balanceDue.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px] font-medium text-[#7F4F24] dark:text-[#D7DBC7]">
                Total Incurred: PKR {billing?.totalCharges?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="bg-white dark:bg-[#1E2717] rounded-xl p-5 shadow-xs space-y-1.5 border border-[#E2E6D8] dark:border-[#333D29]">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#656D4A] dark:text-[#A4AC86]">
                <span>Primary Dispatch</span>
                <Bell className="w-4 h-4 text-[#2D6A4F]" />
              </div>
              <div className="text-lg font-bold text-[#1F291E] dark:text-white">{primaryChannel}</div>
              <span className="text-[11px] font-medium text-[#7F4F24] dark:text-[#D7DBC7]">Failover Backup: {backupChannel}</span>
            </div>
          </div>

          {/* Appointments Deck */}
          <div className="bg-white dark:bg-[#1E2717] rounded-xl overflow-hidden shadow-xs border border-[#E2E6D8] dark:border-[#333D29]">
            <div 
              className="px-5 py-3.5 border-b border-[#E2E6D8] dark:border-[#333D29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAF6] dark:bg-[#1E2717]"
            >
              <div>
                <h3 className="operational-sub-header text-[#1F291E] dark:text-white">My Consultations & Sequential Tokens</h3>
                <p className="text-xs font-medium text-[#656D4A] dark:text-[#A4AC86]">
                  Track your guaranteed queue position and consultation status.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5">
                {(['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setAppointmentFilter(status)}
                    className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                    style={
                      appointmentFilter === status
                        ? { background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(45, 106, 79, 0.25)' }
                        : { backgroundColor: '#F4F6F0', color: '#4A5543', border: '1px solid #DDE2D5' }
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: '#D7DBC7' }}>
              {filteredAppointments.map((app) => (
                <div key={app.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F6F7F2] transition-colors">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="font-mono font-extrabold text-base px-2.5 py-0.5 rounded border shadow-2xs"
                        style={{ backgroundColor: '#EAECE2', borderColor: '#C2C5AA', color: '#333D29' }}
                      >
                        Token #{String(app.tokenNumber).padStart(2, '0')}
                      </span>
                      <StatusBadge status={app.status} size="sm" />
                      <span className="font-medium font-mono" style={{ color: '#7F4F24' }}>• Date: {app.appointmentDate}</span>
                    </div>

                    <div className="text-sm font-bold" style={{ color: '#333D29' }}>
                      {app.doctorName} <span className="text-xs font-normal" style={{ color: '#656D4A' }}>({app.doctorSpecialization})</span>
                    </div>

                    {app.serviceName && (
                      <div className="text-xs font-medium" style={{ color: '#414833' }}>
                        Service: {app.serviceName}
                      </div>
                    )}

                    {app.chiefComplaint && (
                      <div className="text-xs italic px-2.5 py-1 rounded border inline-block" style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA', color: '#7F4F24' }}>
                        Symptoms / Complaint: "{app.chiefComplaint}"
                      </div>
                    )}
                  </div>

                  {/* Patient Self-Service Controls */}
                  {['PENDING', 'CONFIRMED'].includes(app.status) && (
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          setTargetActionApp(app);
                          setNewRescheduleDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
                          setIsRescheduleOpen(true);
                        }}
                        className="px-3.5 py-1.5 border text-xs font-semibold rounded transition-colors shadow-2xs cursor-pointer active:scale-95"
                        style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA', color: '#333D29' }}
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setTargetActionApp(app);
                          setIsCancelConfirmOpen(true);
                        }}
                        className="px-3.5 py-1.5 border text-xs font-semibold rounded transition-colors shadow-2xs cursor-pointer active:scale-95"
                        style={{ backgroundColor: '#F2E8DE', borderColor: '#A68A64', color: '#582F0E' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="py-12 text-center text-xs space-y-3" style={{ color: '#7F4F24' }}>
                  <CalendarCheck className="w-8 h-8 mx-auto opacity-50" style={{ color: '#656D4A' }} />
                  <p className="font-semibold text-sm">No appointments matching this filter.</p>
                  <button
                    onClick={() => switchTab('patient_booking')}
                    className="clinical-button-primary text-xs mx-auto"
                  >
                    Request New Consultation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BOOK CONSULTATION & NEW PATIENT DESK (patient_booking)
          ========================================================================= */}
      {activeTab === 'patient_booking' && (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          {/* Booking Success Confirmation Banner */}
          {bookingSuccessData && (
            <div 
              className="p-5 rounded-xl border shadow-sm space-y-3 animate-fade-in"
              style={{ backgroundColor: '#FAFBF7', borderColor: '#656D4A' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xs" style={{ backgroundColor: '#656D4A' }}>
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: '#333D29' }}>Consultation Request Submitted!</h3>
                  <p className="text-xs font-medium" style={{ color: '#656D4A' }}>
                    Token #{String(bookingSuccessData.appointment.tokenNumber).padStart(2, '0')} has been secured for {bookingSuccessData.patientName}.
                  </p>
                </div>
              </div>

              <div 
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border text-xs"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#C2C5AA' }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase block" style={{ color: '#7F4F24' }}>Specialist</span>
                  <span className="font-bold text-sm" style={{ color: '#333D29' }}>{bookingSuccessData.doctor?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase block" style={{ color: '#7F4F24' }}>Appointment Date</span>
                  <span className="font-bold text-sm font-mono" style={{ color: '#333D29' }}>{bookingSuccessData.appointment.appointmentDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase block" style={{ color: '#7F4F24' }}>Status</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-xs" style={{ backgroundColor: '#EAECE2', color: '#656D4A' }}>
                    PENDING (Awaiting Front-Desk Check-In)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => switchTab('patient_portal')}
                  className="clinical-button-primary text-xs flex items-center gap-1.5"
                >
                  <span>View in My Appointments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Streamlined Luxury Aesthetic Booking Suite */}
          <div className="bg-white dark:bg-[#192215] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-white/10 space-y-7">
            <div className="border-b border-slate-100 dark:border-white/10 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Book an Appointment
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Choose your specialist and preferred date to reserve your consultation token.
              </p>
            </div>

            <form onSubmit={handlePromptCrossCheck} className="space-y-6">
              {/* STEP 1: PATIENT IDENTITY SELECTION */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  1. Who is this appointment for?
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Option 1: Book for Myself */}
                  <div
                    onClick={() => setBookingFor('SELF')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                      bookingFor === 'SELF'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        bookingFor === 'SELF' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          For Myself
                        </div>
                        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                          {currentUser?.profile?.fullName || currentUser?.fullName || currentUser?.name || 'Registered Account'}
                        </div>
                      </div>
                    </div>
                    {bookingFor === 'SELF' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                  </div>

                  {/* Option 2: Book for Someone Else */}
                  <div
                    onClick={() => setBookingFor('NEW')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                      bookingFor === 'NEW'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        bookingFor === 'NEW' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                      }`}>
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          For Someone Else
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          Family member or friend
                        </div>
                      </div>
                    </div>
                    {bookingFor === 'NEW' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Only 2 Simple Fields for Other Person */}
                {bookingFor === 'NEW' && (
                  <div className="p-5 bg-slate-50/90 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-2xl space-y-4 animate-fade-in mt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                          Patient Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newPatientName}
                          onChange={e => setNewPatientName(e.target.value)}
                          placeholder="e.g. Ayesha Khan"
                          className="w-full px-4 py-3 bg-white dark:bg-[#10160D] border border-slate-300 dark:border-white/15 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                          WhatsApp / Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={newPatientPhone}
                          onChange={e => setNewPatientPhone(e.target.value)}
                          onBlur={handleCheckDuplicate}
                          placeholder="e.g. +92 300 1234567"
                          className="w-full px-4 py-3 bg-white dark:bg-[#10160D] border border-slate-300 dark:border-white/15 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: DOCTOR SELECTION & DATE */}
              <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-white/10">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  2. Select Specialist Doctor
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {doctors.map(doc => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-white/5 text-emerald-800 dark:text-emerald-400'
                          }`}>
                            <Stethoscope className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {doc.name}
                            </div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium truncate mt-0.5">
                              {doc.specialization}
                            </div>
                            <div className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300 mt-1">
                              Consultation Fee: PKR {doc.consultationFee}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Appointment Date */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                    Preferred Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full sm:w-72 px-4 py-3 bg-white dark:bg-[#10160D] border border-slate-300 dark:border-white/15 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* STEP 3: SYMPTOMS & REASON */}
              <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-white/10">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  3. Reason for Visit (Optional)
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Skin consultation, routine aesthetic checkup, laser treatment..."
                  className="w-full px-4 py-3 bg-white dark:bg-[#10160D] border border-slate-300 dark:border-white/15 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
                />

                <div className="flex items-center gap-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant digital token and appointment confirmation will be dispatched to WhatsApp.</span>
                </div>
              </div>

              {/* STEP 4: FEE SUMMARY & ACTION BUTTON */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-black/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Total Consultation Fee:
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    PKR {totalEstimatedFee.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pay at clinic reception during check-in
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full sm:w-auto px-9 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
                >
                  <CalendarCheck className="w-5 h-5" />
                  <span>{isSubmittingBooking ? 'Reserving Token...' : 'Confirm & Book Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MEDICAL RECORDS & RX (patient_history)
          ========================================================================= */}
      {activeTab === 'patient_history' && (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
          {/* Clinical Privacy Wall Banner */}
          <div 
            className="rounded-xl p-4 flex items-center gap-3 text-xs border"
            style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA', color: '#414833' }}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: '#656D4A' }} />
            <div>
              <strong className="font-semibold block" style={{ color: '#333D29' }}>Verified Clinical History & Prescription Records</strong>
              <span>
                Patient View Policy: Exclusively serves active, authorized prescription versions (`v_current`) and verified diagnostic summaries. Doctor private working notes remain redacted for confidentiality.
              </span>
            </div>
          </div>

          {/* Clinical Records Timeline */}
          <div className="bg-white rounded-xl p-5 shadow-xs space-y-4 border" style={{ borderColor: '#C2C5AA' }}>
            <h3 className="operational-sub-header" style={{ color: '#333D29' }}>Clinical Consultations & Prescriptions</h3>

            <div className="space-y-4">
              {history?.records?.map((record: any) => (
                <div 
                  key={record.id} 
                  className="p-5 rounded-xl text-xs space-y-3 border shadow-2xs"
                  style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA' }}
                >
                  <div className="flex items-center justify-between font-semibold border-b pb-2.5" style={{ borderColor: '#D7DBC7' }}>
                    <div>
                      <span className="text-sm font-bold block" style={{ color: '#333D29' }}>{record.diagnosis}</span>
                      <span className="text-[11px] font-normal" style={{ color: '#656D4A' }}>Attending Physician: {record.doctorName}</span>
                    </div>
                    <span className="font-mono font-medium text-xs px-2.5 py-1 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#C2C5AA', color: '#7F4F24' }}>
                      {record.createdAt.split('T')[0]}
                    </span>
                  </div>

                  <div className="text-xs" style={{ color: '#414833' }}>
                    <strong className="text-[#333D29]">Treatment Plan:</strong> {record.treatmentPlan}
                  </div>

                  {/* Active Prescription Version */}
                  {record.prescriptions?.[0]?.versions?.[0] && (
                    <div 
                      className="mt-3 bg-white p-4 rounded-lg border space-y-2"
                      style={{ borderColor: '#C2C5AA' }}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                          style={{ color: '#333D29' }}
                        >
                          <span>Active Prescription (v{record.prescriptions[0].versions[0].versionNumber})</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: '#EAECE2', color: '#656D4A' }}>
                          VERIFIED
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {record.prescriptions[0].versions[0].medicationsJson?.map((med: any, i: number) => (
                          <div 
                            key={i} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between font-mono text-xs px-3 py-1.5 rounded border"
                            style={{ backgroundColor: '#FAFBF7', borderColor: '#EAECE2' }}
                          >
                            <span className="font-bold" style={{ color: '#333D29' }}>• {med.name} ({med.dosage})</span>
                            <span style={{ color: '#656D4A' }}>{med.frequency} • {med.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {(!history?.records || history.records.length === 0) && (
                <div className="text-center py-12 text-xs space-y-2" style={{ color: '#7F4F24' }}>
                  <FileText className="w-8 h-8 mx-auto opacity-50" style={{ color: '#656D4A' }} />
                  <p className="font-semibold text-sm">No clinical records on file yet.</p>
                  <p>Once you complete a consultation, your verified diagnosis and prescription will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Channel Failover Preferences Card */}
          <div className="bg-white rounded-xl p-5 shadow-xs space-y-4 border" style={{ borderColor: '#C2C5AA' }}>
            <h3 className="operational-sub-header" style={{ color: '#333D29' }}>Notification Routing & Failover Configuration</h3>
            <p className="text-xs font-medium" style={{ color: '#7F4F24' }}>
              Hospital notifications dispatch via Primary channel first; automatically routes to Backup channel on network timeout.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="operational-metadata-tag block mb-1" style={{ color: '#656D4A' }}>Primary Dispatch Channel</label>
                <select
                  value={primaryChannel}
                  onChange={e => setPrimaryChannel(e.target.value)}
                  className="w-full clinical-input text-xs"
                >
                  <option value="WhatsApp">WhatsApp (Instant Delivery)</option>
                  <option value="SMS">SMS (Cellular Gateway)</option>
                  <option value="Email">Email (Secure Inbox)</option>
                </select>
              </div>

              <div>
                <label className="operational-metadata-tag block mb-1" style={{ color: '#656D4A' }}>Failover Backup Channel</label>
                <select
                  value={backupChannel}
                  onChange={e => setBackupChannel(e.target.value)}
                  className="w-full clinical-input text-xs"
                >
                  <option value="SMS">SMS (Cellular Gateway)</option>
                  <option value="Email">Email (Secure Inbox)</option>
                  <option value="WhatsApp">WhatsApp (Instant Delivery)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="patientHasWhatsApp"
                  checked={hasWhatsApp}
                  onChange={e => setHasWhatsApp(e.target.checked)}
                  className="rounded border text-xs cursor-pointer"
                  style={{ borderColor: '#C2C5AA', accentColor: '#656D4A' }}
                />
                <label htmlFor="patientHasWhatsApp" className="text-xs font-medium cursor-pointer" style={{ color: '#333D29' }}>
                  Primary phone has active WhatsApp
                </label>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={isSavingPrefs}
                className="clinical-button-primary text-xs cursor-pointer active:scale-95"
              >
                {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BILLING & INVOICES (patient_billing)
          ========================================================================= */}
      {activeTab === 'patient_billing' && (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
          {/* Financial Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-xs space-y-1 border" style={{ borderColor: '#C2C5AA' }}>
              <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: '#656D4A' }}>Total Incurred Charges</span>
              <div className="text-2xl font-bold font-mono" style={{ color: '#333D29' }}>
                PKR {billing?.totalCharges ? billing.totalCharges.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px]" style={{ color: '#7F4F24' }}>Consultations & Procedures</span>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-xs space-y-1 border" style={{ borderColor: '#C2C5AA' }}>
              <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: '#656D4A' }}>Total Paid Amount</span>
              <div className="text-2xl font-bold font-mono" style={{ color: '#333D29' }}>
                PKR {billing?.totalPaid ? billing.totalPaid.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px]" style={{ color: '#656D4A' }}>Settled at Front-Desk POS</span>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-xs space-y-1 border" style={{ borderColor: '#C2C5AA' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#656D4A' }}>Outstanding Balance</span>
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: billing?.balanceDue > 0 ? '#F2E8DE' : '#EAECE2',
                    color: billing?.balanceDue > 0 ? '#582F0E' : '#656D4A'
                  }}
                >
                  {billing?.balanceDue > 0 ? 'DUES PENDING' : 'CLEAR'}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: billing?.balanceDue > 0 ? '#582F0E' : '#333D29' }}>
                PKR {billing?.balanceDue ? billing.balanceDue.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px]" style={{ color: '#7F4F24' }}>Payable upon physical check-in</span>
            </div>
          </div>

          {/* Itemized Consultation Charges Table */}
          <div className="bg-white rounded-xl overflow-hidden shadow-xs border" style={{ borderColor: '#C2C5AA' }}>
            <div className="px-5 py-3.5 border-b" style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA' }}>
              <h3 className="operational-sub-header" style={{ color: '#333D29' }}>Incurred Consultation & Service Ledger</h3>
              <p className="text-xs font-medium" style={{ color: '#7F4F24' }}>
                Itemized hospital fees associated with your registered tokens.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[11px] uppercase font-bold" style={{ backgroundColor: '#FAFBF7', borderColor: '#D7DBC7', color: '#656D4A' }}>
                    <th className="py-3 px-5">Item / Service</th>
                    <th className="py-3 px-5">Attending Doctor</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Amount (PKR)</th>
                    <th className="py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#D7DBC7' }}>
                  {appointments.map(app => (
                    <tr key={app.id} className="hover:bg-[#F6F7F2] transition-colors">
                      <td className="py-3.5 px-5 font-semibold" style={{ color: '#333D29' }}>
                        Token #{String(app.tokenNumber).padStart(2, '0')} - {app.serviceName || 'Specialist Consultation'}
                      </td>
                      <td className="py-3.5 px-5" style={{ color: '#414833' }}>
                        {app.doctorName}
                      </td>
                      <td className="py-3.5 px-5 font-mono" style={{ color: '#7F4F24' }}>
                        {app.appointmentDate}
                      </td>
                      <td className="py-3.5 px-5 font-bold font-mono" style={{ color: '#333D29' }}>
                        PKR {app.serviceFee || '2500.00'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span 
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: app.status === 'COMPLETED' ? '#EAECE2' : '#F4ECE0',
                            color: app.status === 'COMPLETED' ? '#656D4A' : '#7F4F24'
                          }}
                        >
                          {app.status === 'COMPLETED' ? 'SETTLED' : 'PENDING AT DESK'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs" style={{ color: '#7F4F24' }}>
                        No billing items recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="bg-white rounded-xl overflow-hidden shadow-xs border" style={{ borderColor: '#C2C5AA' }}>
            <div className="px-5 py-3.5 border-b" style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA' }}>
              <h3 className="operational-sub-header" style={{ color: '#333D29' }}>Payment Receipts & POS Settlements</h3>
              <p className="text-xs font-medium" style={{ color: '#7F4F24' }}>
                Official transaction log of payments collected via Cash, JazzCash, EasyPaisa, or Debit Card.
              </p>
            </div>

            <div className="p-4 space-y-3">
              {billing?.payments?.map((pmt: any) => (
                <div 
                  key={pmt.id} 
                  className="p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  style={{ backgroundColor: '#FAFBF7', borderColor: '#C2C5AA' }}
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-[#656D4A] shrink-0" />
                    <div>
                      <div className="font-bold" style={{ color: '#333D29' }}>
                        Receipt #{pmt.id.slice(0, 8).toUpperCase()} • {pmt.category}
                      </div>
                      <div className="text-[11px] font-mono" style={{ color: '#7F4F24' }}>
                        {pmt.createdAt.split('T')[0]} • Method: {pmt.paymentMethod}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold font-mono text-sm" style={{ color: '#656D4A' }}>
                      PKR {pmt.amountPaid.toFixed(2)}
                    </span>
                    <span className="text-[10px] block font-bold text-[#656D4A]">
                      COMPLETED
                    </span>
                  </div>
                </div>
              ))}

              {(!billing?.payments || billing.payments.length === 0) && (
                <div className="py-8 text-center text-xs" style={{ color: '#7F4F24' }}>
                  No payment receipts recorded on file yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Confirmation Modal */}
      {isRescheduleOpen && targetActionApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in" style={{ backgroundColor: 'rgba(51, 61, 41, 0.65)' }}>
          <div className="w-full max-w-md bg-white border rounded-xl p-6 space-y-4 shadow-2xl" style={{ borderColor: '#C2C5AA' }}>
            <h3 className="operational-sub-header" style={{ color: '#333D29' }}>Reschedule Consultation</h3>
            <p className="text-xs font-medium" style={{ color: '#7F4F24' }}>
              Rescheduling permanently cancels Token #{targetActionApp.tokenNumber} on {targetActionApp.appointmentDate} and issues a new sequential token for your new chosen date.
            </p>

            <form onSubmit={handleRescheduleAppointment} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: '#656D4A' }}>Select New Target Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newRescheduleDate}
                  onChange={e => setNewRescheduleDate(e.target.value)}
                  className="w-full clinical-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: '#C2C5AA' }}>
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="clinical-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clinical-button-primary text-xs"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {isCancelConfirmOpen && targetActionApp && (
        <ConfirmationModal
          isOpen={isCancelConfirmOpen}
          title="Cancel Consultation Token?"
          message={`Are you sure you want to cancel Token #${targetActionApp.tokenNumber} scheduled with ${targetActionApp.doctorName} on ${targetActionApp.appointmentDate}? Per hospital policy, this token slot will be permanently locked and cannot be reclaimed.`}
          confirmLabel="Yes, Cancel Token"
          cancelLabel="Keep Token"
          isDestructive={true}
          onConfirm={handleCancelAppointment}
          onCancel={() => setIsCancelConfirmOpen(false)}
        />
      )}

      {/* Patient Booking Details Verification Modal */}
      {isCrossCheckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" style={{ backgroundColor: 'rgba(15, 23, 13, 0.75)' }}>
          <div className="w-full max-w-lg bg-white dark:bg-[#192215] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Verify Appointment Details
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Please review your booking information before final confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Details Card */}
            <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">Patient Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {bookingFor === 'SELF' ? (currentUser?.profile?.fullName || currentUser?.fullName || 'For Myself') : newPatientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">Mobile Number:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    {bookingFor === 'SELF' ? (currentUser?.profile?.phone || currentUser?.phone || 'On File') : newPatientPhone}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">Doctor:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm block">
                    {doctors.find(d => d.id === selectedDoctorId)?.fullName || 'Selected Specialist'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {doctors.find(d => d.id === selectedDoctorId)?.specialization}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">Appointment Date:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    {bookingDate}
                  </span>
                </div>
              </div>

              {chiefComplaint && (
                <div className="pt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">Reason for Visit:</span>
                  <span className="text-slate-900 dark:text-white italic">
                    "{chiefComplaint}"
                  </span>
                </div>
              )}
            </div>

            {/* Total Fee & Reception Note */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                  Payable at Reception:
                </span>
                <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-200">
                  PKR {totalEstimatedFee.toFixed(2)}
                </span>
              </div>
              <div className="text-right text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                Instant queue token<br />dispatched upon booking
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCrossCheckModalOpen(false)}
                disabled={isSubmittingBooking}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={handleExecuteBooking}
                disabled={isSubmittingBooking}
                className="px-7 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-emerald-900/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
              >
                {isSubmittingBooking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Reserving Token...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Book Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
