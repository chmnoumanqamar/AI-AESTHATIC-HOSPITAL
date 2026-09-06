import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Receipt,
  RotateCcw,
  Sparkles,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Percent,
  FileText
} from 'lucide-react';

interface QueueItem {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  tokenNumber: number;
  doctorName?: string;
  serviceName?: string;
  appointmentId?: string;
}

interface FrontDeskBillingPOSProps {
  queue?: QueueItem[];
}

interface PatientBillingSummary {
  patientId: string;
  patientName: string;
  cnic: string;
  phone: string;
  totalCharges: number;
  totalDiscounts: number;
  netPayable: number;
  totalPaid: number;
  balanceDue: number;
  advanceCredit: number;
  financialStatus: 'CLEAR' | 'PENDING' | 'PARTIAL';
  currency: string;
  unpaidAppointments: Array<{
    appointmentId: string;
    appointmentDate: string;
    doctorName: string;
    specialization: string;
    fee: number;
  }>;
  payments: Array<{
    id: string;
    invoiceNumber?: string;
    totalAmount: number;
    discount?: number;
    amountPaid: number;
    balanceDue: number;
    paymentMethod?: string;
    category?: string;
    paymentPlan?: string;
    status: 'PAID' | 'PENDING' | 'PARTIAL';
    notes?: string;
    createdAt: string;
  }>;
}

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash (PKR)', icon: Banknote, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800' },
  { id: 'CARD', label: 'Debit/Credit Card', icon: CreditCard, color: 'text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800' },
  { id: 'JAZZCASH', label: 'JazzCash', icon: Smartphone, color: 'text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800' },
  { id: 'EASYPAISA', label: 'EasyPaisa', icon: Smartphone, color: 'text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/70 border-teal-300 dark:border-teal-800' },
  { id: 'BANK_TRANSFER', label: 'Bank (IBFT / Raast)', icon: Building2, color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800' },
  { id: 'INSURANCE', label: 'Panel / Insurance', icon: ShieldCheck, color: 'text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800' }
];

const CATEGORIES = [
  { id: 'CONSULTATION', label: 'Doctor Consultation' },
  { id: 'PROCEDURE', label: 'Aesthetic / Clinical Procedure' },
  { id: 'LAB_TEST', label: 'Diagnostic / Lab Investigation' },
  { id: 'PHARMACY', label: 'Pharmacy & Medications' },
  { id: 'EMERGENCY', label: 'Emergency & Triage Copay' }
];

const PAYMENT_PLANS = [
  { id: 'FULL', label: 'Full Settlement (100% Cleared)' },
  { id: 'INSTALLMENT_1', label: 'Installment 1 (50% Advance)' },
  { id: 'INSTALLMENT_2', label: 'Installment 2 (Remaining Dues)' },
  { id: 'SPECIAL_WAIVER', label: 'Welfare / Special Discount' }
];

export const FrontDeskBillingPOS: React.FC<FrontDeskBillingPOSProps> = ({ queue = [] }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSummary, setPatientSummary] = useState<PatientBillingSummary | null>(null);
  const [hospitalLedger, setHospitalLedger] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [liveQueue, setLiveQueue] = useState<QueueItem[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Form State
  const [category, setCategory] = useState<string>('CONSULTATION');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentPlan, setPaymentPlan] = useState<string>('FULL');
  const [grossAmount, setGrossAmount] = useState<string>('2500');
  const [discount, setDiscount] = useState<string>('0');
  const [amountPaid, setAmountPaid] = useState<string>('2500');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // Load hospital-wide ledger stats
  const fetchHospitalLedger = async () => {
    try {
      const res = await api.get('/billing/ledger');
      setHospitalLedger(res.data.data);
    } catch (err) {
      console.error('Failed to load hospital ledger stats:', err);
    }
  };

  // Load complete hospital patient directory & live queue
  const fetchPatientsAndQueue = async () => {
    setIsLoadingPatients(true);
    try {
      const [patientsRes, queueRes] = await Promise.allSettled([
        api.get('/patients'),
        api.get('/queue')
      ]);
      if (patientsRes.status === 'fulfilled' && patientsRes.value.data?.data) {
        setAllPatients(patientsRes.value.data.data);
      }
      if (queueRes.status === 'fulfilled' && queueRes.value.data?.data) {
        setLiveQueue(queueRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load patients for POS:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchHospitalLedger();
    fetchPatientsAndQueue();
  }, []);

  // Fetch patient billing summary whenever a patient is selected
  const fetchPatientSummary = async (patientId: string) => {
    if (!patientId) {
      setPatientSummary(null);
      return;
    }
    setIsLoadingSummary(true);
    try {
      const res = await api.get(`/billing/patient/${patientId}`);
      const data: PatientBillingSummary = res.data.data;
      setPatientSummary(data);

      // Auto-populate default amount based on remaining dues or unpaid appointments
      if (data.balanceDue > 0) {
        setGrossAmount(String(data.balanceDue));
        setDiscount('0');
        setAmountPaid(String(data.balanceDue));
      } else if (data.unpaidAppointments?.length > 0) {
        const fee = data.unpaidAppointments[0].fee;
        setGrossAmount(String(fee));
        setDiscount('0');
        setAmountPaid(String(fee));
      } else {
        setGrossAmount('2500');
        setDiscount('0');
        setAmountPaid('2500');
      }
    } catch (err) {
      console.error('Failed to fetch patient financial summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    fetchPatientSummary(val);
  };

  // Live Math calculations
  const grossVal = parseFloat(grossAmount) || 0;
  const discountVal = parseFloat(discount) || 0;
  const netVal = Math.max(0, grossVal - discountVal);
  const paidVal = parseFloat(amountPaid) || 0;
  const estimatedRemainingDues = Math.max(0, netVal - paidVal);

  const handlePaymentPlanChange = (planId: string) => {
    setPaymentPlan(planId);
    if (planId === 'INSTALLMENT_1') {
      const half = Math.round(netVal / 2);
      setAmountPaid(String(half));
    } else if (planId === 'FULL') {
      setAmountPaid(String(netVal));
    } else if (planId === 'SPECIAL_WAIVER') {
      const discounted = Math.round(grossVal * 0.2); // 20% discount default
      setDiscount(String(discounted));
      setAmountPaid(String(grossVal - discounted));
    }
  };

  const handleGrossChange = (val: string) => {
    setGrossAmount(val);
    const g = parseFloat(val) || 0;
    const d = parseFloat(discount) || 0;
    const net = Math.max(0, g - d);
    if (paymentPlan === 'INSTALLMENT_1') {
      setAmountPaid(String(Math.round(net / 2)));
    } else {
      setAmountPaid(String(net));
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscount(val);
    const g = parseFloat(grossAmount) || 0;
    const d = parseFloat(val) || 0;
    const net = Math.max(0, g - d);
    if (paymentPlan === 'INSTALLMENT_1') {
      setAmountPaid(String(Math.round(net / 2)));
    } else {
      setAmountPaid(String(net));
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Baraye meharbani pehle patient select karein.');
      return;
    }

    const matchedQueue = queue.find(q => q.patientId === selectedPatientId);

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        appointmentId: matchedQueue?.appointmentId || patientSummary?.unpaidAppointments?.[0]?.appointmentId,
        totalAmount: grossVal,
        discount: discountVal,
        amount: paidVal,
        paymentMethod,
        category,
        paymentPlan,
        notes: notes || undefined
      };

      const res = await api.post('/billing/pay', payload);
      const recordedPayment = res.data.data;

      // Refresh Ledger & Patient Summary
      await fetchPatientSummary(selectedPatientId);
      await fetchHospitalLedger();

      // Open Receipt Modal
      setActiveReceipt({
        ...recordedPayment,
        patientName: patientSummary?.patientName || matchedQueue?.patientName || 'Patient',
        cnic: patientSummary?.cnic,
        phone: patientSummary?.phone,
        doctorName: matchedQueue?.doctorName || 'Dr. Specialist',
        tokenNumber: matchedQueue?.tokenNumber || 'Walk-in'
      });

      setNotes('');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Payment collection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveQueue: QueueItem[] = (queue && queue.length > 0) ? queue : liveQueue;
  const queuePatientIds = new Set(effectiveQueue.map(q => q.patientId).filter(Boolean));
  const otherPatients = allPatients.filter(p => !queuePatientIds.has(p.id));

  const matchedQueueItem = effectiveQueue.find(q => q.patientId === selectedPatientId);
  const matchedPatientRecord = allPatients.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Top Executive KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider block">Today's Revenue</span>
            <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">
              PKR {hospitalLedger?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Collected via POS
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider block">Total Outstanding Dues</span>
            <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              PKR {hospitalLedger?.totalOutstanding?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5 block">
              {hospitalLedger?.partialCount || 0} Partial / {hospitalLedger?.pendingCount || 0} Pending
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider block">Total Discounts Granted</span>
            <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">
              PKR {hospitalLedger?.totalDiscounts?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] font-medium mt-0.5 block">
              Welfare & Institutional Waivers
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-teal-950/60 border border-sky-200 dark:border-teal-800 flex items-center justify-center text-sky-600 dark:text-teal-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider block">Receipts Generated</span>
            <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">
              {hospitalLedger?.paymentsCount || 0} Invoices
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
              {hospitalLedger?.paidCount || 0} Fully Cleared
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Patient Selector & Quick Filter Bar */}
      <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#2F3E29]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Patient Identification & Billing Profile</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A4AC86]">
              Select an admitted patient or queue entry to instantly inspect dues, credit balances, and payment plans.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPatientsAndQueue}
              disabled={isLoadingPatients}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#38482E] text-slate-600 dark:text-[#C2C5AA] hover:bg-slate-50 dark:hover:bg-[#25331E] transition-all cursor-pointer"
              title="Refresh patient list"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingPatients ? 'animate-spin' : ''}`} />
              <span>Reload Directory</span>
            </button>

            {selectedPatientId && (
              <button
                onClick={() => fetchPatientSummary(selectedPatientId)}
                disabled={isLoadingSummary}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSummary ? 'animate-spin' : ''}`} />
                <span>Refresh Patient Dues</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1.5">
            Select Patient from Active OPD Queue / Admitted Today:
          </label>
          <select
            value={selectedPatientId}
            onChange={handlePatientSelect}
            className="w-full clinical-input text-sm font-medium py-2.5 dark:bg-[#171F13] dark:border-[#38482E] dark:text-white cursor-pointer"
          >
            <option value="">
              {isLoadingPatients
                ? '-- Loading hospital patients directory... --'
                : `-- Choose Patient / Token (${effectiveQueue.length + otherPatients.length} Available) --`}
            </option>
            {effectiveQueue.length > 0 && (
              <optgroup label="⚡ Active Today's OPD Queue / Token Patients">
                {effectiveQueue.map(q => (
                  <option key={`q-${q.patientId}-${q.tokenNumber}`} value={q.patientId}>
                    Token #{q.tokenNumber} — {q.patientName} {q.patientPhone ? `(${q.patientPhone})` : ''} | Doctor: {q.doctorName || 'Assigned Specialist'}
                  </option>
                ))}
              </optgroup>
            )}
            {otherPatients.length > 0 && (
              <optgroup label="📋 All Registered / Admitted Hospital Patients">
                {otherPatients.map(p => (
                  <option key={`p-${p.id}`} value={p.id}>
                    {p.fullName} {p.phone ? `(${p.phone})` : ''} — CNIC: {p.cnic || 'N/A'} [MRN: {p.id}]
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* 3. Patient Financial Dossier (Visible when patient is selected) */}
        {selectedPatientId && (
          <div className="pt-2 animate-fade-in space-y-4">
            {isLoadingSummary ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-[#171F13] rounded-xl border border-slate-200 dark:border-[#2F3E29]">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-600 dark:text-[#A4AC86] font-medium">Retrieving financial ledger & dues...</span>
              </div>
            ) : patientSummary ? (
              <>
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#171F13] border border-slate-200 dark:border-[#2F3E29]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800">
                      {matchedQueueItem?.tokenNumber ? `#${matchedQueueItem.tokenNumber}` : 'Pt'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {patientSummary.patientName || matchedPatientRecord?.fullName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#A4AC86]">
                        <span>CNIC: {patientSummary.cnic || matchedPatientRecord?.cnic || 'On Record'}</span>
                        <span>•</span>
                        <span>Phone: {patientSummary.phone || matchedPatientRecord?.phone || 'On Record'}</span>
                        {matchedQueueItem?.doctorName ? (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{matchedQueueItem.doctorName}</span>
                          </>
                        ) : (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Registered Hospital Dossier</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Status Badge */}
                  <div>
                    {patientSummary.financialStatus === 'CLEAR' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>ACCOUNT CLEARED (Wajibat Nil)</span>
                      </span>
                    )}
                    {patientSummary.financialStatus === 'PENDING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>PENDING INVOICE (Baqiya Wajibat)</span>
                      </span>
                    )}
                    {patientSummary.financialStatus === 'PARTIAL' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>PARTIALLY PAID (Qist Active)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Cards: Charges, Paid, Remaining Dues, Advance Credit */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-[#171F13] border border-slate-200 dark:border-[#2F3E29] rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider block">
                      Total Incurred
                    </span>
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                      PKR {patientSummary.totalCharges.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    {patientSummary.totalDiscounts > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                        Discount: -PKR {patientSummary.totalDiscounts}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      Amount Paid / Settled
                    </span>
                    <div className="text-lg font-mono font-bold text-emerald-800 dark:text-emerald-300">
                      PKR {patientSummary.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Cleared to Ledger</span>
                  </div>

                  <div className={`p-3.5 rounded-xl space-y-1 border ${
                    patientSummary.balanceDue > 0
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-200 dark:ring-rose-900/50'
                      : 'bg-slate-50 dark:bg-[#171F13] border border-slate-200 dark:border-[#2F3E29]'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                      patientSummary.balanceDue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-[#A4AC86]'
                    }`}>
                      Remaining Dues (Wajibat)
                    </span>
                    <div className={`text-lg font-mono font-extrabold ${
                      patientSummary.balanceDue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-[#C2C5AA]'
                    }`}>
                      PKR {patientSummary.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-[#889073] font-medium block">
                      {patientSummary.balanceDue > 0 ? 'Payment Required' : 'Zero Outstanding'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-sky-50/70 dark:bg-teal-950/30 border border-sky-200 dark:border-teal-800/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-sky-700 dark:text-teal-400 uppercase tracking-wider block">
                      Advance / Credit Balance
                    </span>
                    <div className="text-lg font-mono font-bold text-sky-900 dark:text-teal-300">
                      PKR {patientSummary.advanceCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-sky-600 dark:text-teal-400 font-medium block">Available Patient Credit</span>
                  </div>
                </div>

                {/* Unpaid Appointments Alert */}
                {patientSummary.unpaidAppointments?.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>Unpaid Consultation Alert:</strong> {patientSummary.unpaidAppointments[0].doctorName} ({patientSummary.unpaidAppointments[0].specialization}) scheduled on {patientSummary.unpaidAppointments[0].appointmentDate} (Fee: PKR {patientSummary.unpaidAppointments[0].fee}).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory('CONSULTATION');
                        handleGrossChange(String(patientSummary.unpaidAppointments[0].fee));
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Load Consultation Fee
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* 4. Payment Collection & Plan Form */}
      <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2F3E29]">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Collect Payment & Select Payment Plan</h3>
              <p className="text-xs text-slate-500 dark:text-[#A4AC86]">Record cash, digital wallets, bank transfers or split payment terms</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-[#25331E] text-slate-600 dark:text-[#C2C5AA] border border-slate-200 dark:border-[#38482E]">
            Currency: PKR (Rs.)
          </span>
        </div>

        <form onSubmit={handleSubmitPayment} className="space-y-6">
          {/* A. Payment Category */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-2">1. Billing Head / Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm ring-2 ring-emerald-500/30 dark:bg-[#204532] dark:border-[#52B788] dark:ring-emerald-400/40 dark:text-white'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#151D12] dark:text-[#C2C5AA] dark:border-[#2F3E29] dark:hover:bg-[#1D2719]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* B. Payment Method (Payment Type) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-2">2. Payment Type / Channel</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2D6A4F] dark:border-[#52B788] bg-[#E8F3EB] dark:bg-[#203622] ring-2 ring-[#2D6A4F]/20 dark:ring-[#52B788]/40 shadow-sm'
                        : 'border-slate-200 dark:border-[#2F3E29] bg-white dark:bg-[#151D12] hover:bg-slate-50 dark:hover:bg-[#1D2719]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-1.5 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] dark:bg-[#2D6A4F] dark:border-[#52B788] dark:text-white'
                          : m.color
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />}
                    </div>
                    <span className={`text-xs font-bold ${
                      isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-[#C2C5AA]'
                    }`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Payment Plan */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-2">3. Payment Plan & Settlement Terms</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {PAYMENT_PLANS.map(plan => {
                const isSelected = paymentPlan === plan.id;
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => handlePaymentPlanChange(plan.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm ring-2 ring-emerald-500/30 dark:bg-[#204532] dark:border-[#52B788] dark:ring-emerald-400/40 dark:text-white'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#151D12] dark:text-[#C2C5AA] dark:border-[#2F3E29] dark:hover:bg-[#1D2719]'
                    }`}
                  >
                    {plan.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* D. Amount Inputs & Calculations */}
          <div className="p-4 bg-slate-50 dark:bg-[#171F13] border border-slate-200 dark:border-[#2F3E29] rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Total Fee / Gross (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={grossAmount}
                  onChange={e => handleGrossChange(e.target.value)}
                  className="w-full clinical-input font-mono font-bold text-sm dark:bg-[#1E2718] dark:border-[#38482E] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Discount / Waiver (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={e => handleDiscountChange(e.target.value)}
                  className="w-full clinical-input font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400 dark:bg-[#1E2718] dark:border-[#38482E]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Net Payable (PKR)</label>
                <input
                  type="text"
                  readOnly
                  value={`PKR ${netVal.toFixed(2)}`}
                  className="w-full clinical-input font-mono font-bold text-sm bg-slate-100 dark:bg-[#25331E] text-slate-800 dark:text-[#E8F3EB] dark:border-[#38482E] cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-[#2F3E29]">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Amount Received / Paid Right Now (PKR):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full clinical-input font-mono font-extrabold text-base text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-[#1E2718]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Estimated Remaining Dues after this payment:
                </label>
                <div className={`p-2.5 rounded-lg border font-mono font-extrabold text-base flex items-center justify-between ${
                  estimatedRemainingDues === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}>
                  <span>PKR {estimatedRemainingDues.toFixed(2)}</span>
                  <span className="text-[11px] font-sans font-semibold">
                    {estimatedRemainingDues === 0 ? '✅ 100% Cleared' : '⚠️ Pending Balance'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                Transaction Reference / Receipt Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. JazzCash TID #981248, Visa Card Auth 49201, or installment terms agreed..."
                className="w-full clinical-input text-xs dark:bg-[#1E2718] dark:border-[#38482E] dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedPatientId || isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Committing to Ledger...' : 'Collect & Issue Official Receipt'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5. Patient Transaction History & Dues Ledger */}
      {selectedPatientId && patientSummary && patientSummary.payments.length > 0 && (
        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl overflow-hidden shadow-sm space-y-3 p-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2F3E29]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Patient Receipt Ledger & Transaction History</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#A4AC86]">All historical receipts, installment tracking and payment types</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-[#A4AC86]">
              {patientSummary.payments.length} Records Found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#171F13] border-b border-slate-200 dark:border-[#2F3E29] text-[11px] font-bold text-slate-600 dark:text-[#A4AC86] uppercase tracking-wider">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Remaining Dues</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2F3E29] font-mono">
                {patientSummary.payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-[#202C1B] transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{p.invoiceNumber || 'INV-REF'}</td>
                    <td className="p-3 text-slate-600 dark:text-[#A4AC86] font-sans text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-sans font-semibold text-slate-700 dark:text-[#C2C5AA]">{p.category || 'Consultation'}</td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#25331E] text-slate-800 dark:text-[#C2C5AA] border border-slate-200 dark:border-[#38482E]">
                        {p.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-white">PKR {p.totalAmount.toFixed(2)}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400">PKR {(p.discount || 0).toFixed(2)}</td>
                    <td className="p-3 font-bold text-emerald-700 dark:text-emerald-300">PKR {p.amountPaid.toFixed(2)}</td>
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">PKR {p.balanceDue.toFixed(2)}</td>
                    <td className="p-3 font-sans">
                      {p.status === 'PAID' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          CLEAR
                        </span>
                      )}
                      {p.status === 'PARTIAL' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                          PARTIAL
                        </span>
                      )}
                      {p.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-sans">
                      <button
                        onClick={() => setActiveReceipt({
                          ...p,
                          patientName: patientSummary.patientName,
                          cnic: patientSummary.cnic,
                          phone: patientSummary.phone,
                          doctorName: matchedQueueItem?.doctorName || 'Dr. Specialist',
                          tokenNumber: matchedQueueItem?.tokenNumber || 'OPD'
                        })}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Printable Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-6 space-y-5 shadow-2xl">
            {/* Receipt Header */}
            <div className="text-center border-b border-slate-200 dark:border-[#2F3E29] pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs">
                  AH
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  AI Aesthetic Hospital
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#A4AC86]">Official POS Tax Invoice & Clinical Payment Receipt</p>
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#E8F3EB] mt-1">
                {activeReceipt.invoiceNumber || 'INV-RECEIPT'}
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-[#171F13] p-3.5 rounded-xl border border-slate-100 dark:border-[#2F3E29]">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] block uppercase font-bold">Patient Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeReceipt.patientName}</span>
                <span className="text-[11px] text-slate-600 dark:text-[#C2C5AA] block mt-0.5">CNIC: {activeReceipt.cnic || 'N/A'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] block uppercase font-bold">Doctor / Token</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeReceipt.doctorName}</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                  Token #{activeReceipt.tokenNumber || 'OPD'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] block uppercase font-bold">Date & Time</span>
                <span className="text-slate-700 dark:text-[#C2C5AA] font-mono text-[11px]">
                  {new Date(activeReceipt.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] block uppercase font-bold">Payment Channel</span>
                <span className="font-bold text-slate-800 dark:text-white">{activeReceipt.paymentMethod || 'CASH'}</span>
                <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] block font-sans">({activeReceipt.paymentPlan || 'FULL'})</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-200 dark:border-[#2F3E29] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-[#171F13] text-slate-700 dark:text-[#C2C5AA] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2F3E29] font-mono">
                  <tr>
                    <td className="p-2.5 text-slate-800 dark:text-[#E8F3EB] font-sans">{activeReceipt.category || 'Consultation Fee'}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                      PKR {activeReceipt.totalAmount?.toFixed(2)}
                    </td>
                  </tr>
                  {(activeReceipt.discount || 0) > 0 && (
                    <tr className="text-emerald-700 dark:text-emerald-400">
                      <td className="p-2.5 font-sans">Special Discount / Waiver</td>
                      <td className="p-2.5 text-right">-PKR {activeReceipt.discount?.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                    <td className="p-2.5 font-sans">Amount Received</td>
                    <td className="p-2.5 text-right">PKR {activeReceipt.amountPaid?.toFixed(2)}</td>
                  </tr>
                  <tr className="font-semibold text-xs">
                    <td className="p-2.5 font-sans dark:text-[#C2C5AA]">Remaining Balance Dues</td>
                    <td className={`p-2.5 text-right font-mono ${
                      activeReceipt.balanceDue > 0 ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      PKR {activeReceipt.balanceDue?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {activeReceipt.notes && (
              <div className="text-[11px] p-2.5 bg-slate-50 dark:bg-[#171F13] border border-slate-200 dark:border-[#2F3E29] rounded-lg text-slate-600 dark:text-[#C2C5AA]">
                <strong className="text-slate-800 dark:text-white">Remarks:</strong> {activeReceipt.notes}
              </div>
            )}

            {/* Receipt Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2F3E29]">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="clinical-button-secondary text-xs cursor-pointer"
              >
                Close Window
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="clinical-button-primary text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
