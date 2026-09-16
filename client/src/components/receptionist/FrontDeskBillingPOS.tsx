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
  FileText,
  Plus,
  Trash2,
  Package,
  Tag,
  Undo2,
  Stethoscope,
  Search,
  ShoppingCart,
  Check,
  X,
  HeartPulse,
  Download
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
  activePackages?: Array<{
    paymentId: string;
    invoiceNumber: string;
    dealName: string;
    totalSessions: number;
    sessionsConsumed: number;
    sessionsRemaining: number;
    doctorName: string;
    sessionRemarks: Array<{ sessionNumber: number; date: string; remarks: string; doctorName?: string }>;
    purchasedAt: string;
  }>;
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
    doctorId?: string;
    doctorName?: string;
    dealId?: string;
    dealName?: string;
    sessionsAllowed?: number;
    sessionsConsumed?: number;
    sessionRemarks?: Array<{ sessionNumber: number; date: string; remarks: string; doctorName?: string }>;
    items?: Array<{ id: string; name: string; type: 'SERVICE' | 'PRODUCT' | 'DEAL'; quantity: number; unitPrice: number; subtotal: number }>;
  }>;
}

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash (PKR)', icon: Banknote, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800' },
  { id: 'CARD', label: 'Debit/Credit Card', icon: CreditCard, color: 'text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800' },
  { id: 'WALLET', label: 'Advance Wallet Credit', icon: Sparkles, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800' },
  { id: 'JAZZCASH', label: 'JazzCash', icon: Smartphone, color: 'text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800' },
  { id: 'EASYPAISA', label: 'EasyPaisa', icon: Smartphone, color: 'text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/70 border-teal-300 dark:border-teal-800' },
  { id: 'BANK_TRANSFER', label: 'Bank (IBFT / Raast)', icon: Building2, color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800' },
  { id: 'INSURANCE', label: 'Panel / Insurance', icon: ShieldCheck, color: 'text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800' }
];

const CATEGORIES = [
  { id: 'CONSULTATION', label: 'Doctor Consultation' },
  { id: 'PROCEDURE', label: 'Aesthetic Procedure' },
  { id: 'PACKAGE', label: 'Multi-Session Package Deal' },
  { id: 'RETAIL', label: 'Skincare Retail Products' },
  { id: 'LAB_TEST', label: 'Diagnostic / Lab Investigation' },
  { id: 'PHARMACY', label: 'Pharmacy & Medications' },
  { id: 'EMERGENCY', label: 'Emergency Copay' }
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

  // Doctors & Attending Practitioner
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Item Catalog & Cart
  const [catalogTab, setCatalogTab] = useState<'SERVICES' | 'PACKAGES' | 'PRODUCTS'>('SERVICES');
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<Array<{ id: string; name: string; type: 'SERVICE' | 'PRODUCT' | 'DEAL'; quantity: number; unitPrice: number; sessionsAllowed?: number; sku?: string }>>([]);
  const [catalogSearch, setCatalogSearch] = useState<string>('');

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

  // Multi-Session Redemption Modal
  const [redeemModalPackage, setRedeemModalPackage] = useState<any | null>(null);
  const [sessionRemarksInput, setSessionRemarksInput] = useState<string>('');
  const [redeemDoctorName, setRedeemDoctorName] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  // Patient Wallet Top-up Modal
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [walletAmount, setWalletAmount] = useState<string>('5000');
  const [walletPaymentMethod, setWalletPaymentMethod] = useState<string>('CASH');
  const [isToppingUp, setIsToppingUp] = useState<boolean>(false);

  // Sales Returns & Refunds Modal
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState<boolean>(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<any | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<string>('');
  const [refundReasonInput, setRefundReasonInput] = useState<string>('');
  const [refundMethodInput, setRefundMethodInput] = useState<'CASH' | 'WALLET'>('CASH');
  const [allReturns, setAllReturns] = useState<any[]>([]);
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);

  // Clinic Profile & Thermal Receipt Info
  const [clinicProfile, setClinicProfile] = useState<any>({
    clinicName: 'Skin-Lab Aesthetic Hospital & Institute',
    clinicPhone: '+92 42 35876543',
    clinicAddress: 'Plot 14-C, Main Boulevard, Gulberg III, Lahore, Pakistan',
    taxNumber: 'NTN-7418902-1',
    receiptFooterNote: 'Thank you for choosing Skin-Lab! All clinical procedures are performed by certified doctors. Retain this invoice for session verification.'
  });

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

  // Load doctors, services, deals, products, clinic profile, returns
  const fetchExtraCatalogs = async () => {
    try {
      const [docRes, srvRes, dealRes, prodRes, profRes, retRes] = await Promise.allSettled([
        api.get('/doctors'),
        api.get('/services'),
        api.get('/services/deals'),
        api.get('/services/products'),
        api.get('/admin/clinic-profile'),
        api.get('/billing/returns')
      ]);
      if (docRes.status === 'fulfilled' && docRes.value.data?.data) setAllDoctors(docRes.value.data.data);
      if (srvRes.status === 'fulfilled' && srvRes.value.data?.data) setAllServices(srvRes.value.data.data);
      if (dealRes.status === 'fulfilled' && dealRes.value.data?.data) setAllDeals(dealRes.value.data.data);
      if (prodRes.status === 'fulfilled' && prodRes.value.data?.data) setAllProducts(prodRes.value.data.data);
      if (profRes.status === 'fulfilled' && profRes.value.data?.data) setClinicProfile(profRes.value.data.data);
      if (retRes.status === 'fulfilled' && retRes.value.data?.data) setAllReturns(retRes.value.data.data);
    } catch (e) {
      console.error('Failed to load catalog data:', e);
    }
  };

  useEffect(() => {
    fetchHospitalLedger();
    fetchPatientsAndQueue();
    fetchExtraCatalogs();
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
      if (cartItems.length > 0) {
        // keep cart total
      } else if (data.balanceDue > 0) {
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

    // Auto select matching doctor from queue if available
    const matched = (queue || liveQueue).find(q => q.patientId === val);
    if (matched?.doctorName && allDoctors.length > 0) {
      const doc = allDoctors.find(d => d.name === matched.doctorName);
      if (doc) setSelectedDoctorId(doc.id);
    }
  };

  // Cart operations
  const addToCart = (item: { id: string; name: string; type: 'SERVICE' | 'PRODUCT' | 'DEAL'; unitPrice: number; sessionsAllowed?: number; sku?: string }) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(i => i.id === item.id);
      let updated: typeof prev;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx].quantity += 1;
      } else {
        updated = [...prev, { ...item, quantity: 1 }];
      }
      const newGross = updated.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      setGrossAmount(String(newGross));
      setAmountPaid(String(Math.max(0, newGross - (parseFloat(discount) || 0))));
      if (item.type === 'DEAL') setCategory('PACKAGE');
      else if (item.type === 'PRODUCT') setCategory('RETAIL');
      else setCategory('PROCEDURE');
      return updated;
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      const newGross = updated.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      setGrossAmount(String(newGross));
      setAmountPaid(String(Math.max(0, newGross - (parseFloat(discount) || 0))));
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setGrossAmount('2500');
    setDiscount('0');
    setAmountPaid('2500');
    setCategory('CONSULTATION');
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

    // If paying with wallet, check balance
    if (paymentMethod === 'WALLET') {
      const availableWallet = patientSummary?.advanceCredit || 0;
      if (paidVal > availableWallet) {
        alert(`Insufficient wallet balance. Available wallet credit: PKR ${availableWallet.toFixed(2)}`);
        return;
      }
    }

    const matchedQueue = (queue || liveQueue).find(q => q.patientId === selectedPatientId);
    const chosenDoctor = allDoctors.find(d => d.id === selectedDoctorId);

    // Identify if any deal is in the cart
    const dealInCart = cartItems.find(i => i.type === 'DEAL');

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        appointmentId: matchedQueue?.appointmentId || patientSummary?.unpaidAppointments?.[0]?.appointmentId,
        doctorId: selectedDoctorId || undefined,
        doctorName: chosenDoctor?.name || matchedQueue?.doctorName || undefined,
        dealId: dealInCart?.id || undefined,
        dealName: dealInCart?.name || undefined,
        sessionsAllowed: dealInCart?.sessionsAllowed || (category === 'PACKAGE' ? 5 : undefined),
        items: cartItems.length > 0 ? cartItems.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          subtotal: c.unitPrice * c.quantity
        })) : undefined,
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

      // Refresh Ledger, Products Stock & Patient Summary
      await fetchPatientSummary(selectedPatientId);
      await fetchHospitalLedger();
      await fetchExtraCatalogs();

      // Open Receipt Modal
      setActiveReceipt({
        ...recordedPayment,
        patientName: patientSummary?.patientName || matchedQueue?.patientName || 'Patient',
        cnic: patientSummary?.cnic,
        phone: patientSummary?.phone,
        doctorName: chosenDoctor?.name || matchedQueue?.doctorName || 'Attending Doctor',
        tokenNumber: matchedQueue?.tokenNumber || 'WALK-IN',
        items: cartItems.length > 0 ? cartItems : undefined
      });

      setNotes('');
      setCartItems([]);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Payment collection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Consume a multi-session package session
  const handleConfirmRedeemSession = async () => {
    if (!redeemModalPackage) return;
    setIsRedeeming(true);
    try {
      await api.post(`/billing/packages/${redeemModalPackage.paymentId}/consume-session`, {
        remarks: sessionRemarksInput || 'Standard clinical procedure session completed.',
        doctorName: redeemDoctorName || clinicProfile.clinicName || 'Specialist'
      });
      alert(`Session ${redeemModalPackage.sessionsConsumed + 1} redeemed successfully!`);
      setRedeemModalPackage(null);
      setSessionRemarksInput('');
      await fetchPatientSummary(selectedPatientId);
      await fetchHospitalLedger();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to redeem package session');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Top Up Wallet
  const handleConfirmTopUpWallet = async () => {
    if (!selectedPatientId || !walletAmount) return;
    setIsToppingUp(true);
    try {
      await api.post('/billing/wallet/topup', {
        patientId: selectedPatientId,
        amount: parseFloat(walletAmount),
        paymentMethod: walletPaymentMethod
      });
      alert(`Wallet successfully topped up with PKR ${walletAmount}!`);
      setIsWalletModalOpen(false);
      await fetchPatientSummary(selectedPatientId);
      await fetchHospitalLedger();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Wallet top-up failed');
    } finally {
      setIsToppingUp(false);
    }
  };

  // Process Refund
  const handleConfirmRefund = async () => {
    if (!selectedPaymentForRefund || !refundAmountInput || !refundReasonInput) {
      alert('Please provide refund amount and reason.');
      return;
    }
    setIsProcessingRefund(true);
    try {
      await api.post('/billing/refund', {
        paymentId: selectedPaymentForRefund.id,
        refundAmount: parseFloat(refundAmountInput),
        reason: refundReasonInput,
        refundMethod: refundMethodInput
      });
      alert('Refund successfully processed and ledger reversed!');
      setIsReturnsModalOpen(false);
      setSelectedPaymentForRefund(null);
      setRefundAmountInput('');
      setRefundReasonInput('');
      await fetchPatientSummary(selectedPatientId);
      await fetchHospitalLedger();
      await fetchExtraCatalogs();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Refund processing failed');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // 1-Click Patient Ledger CSV Export
  const handleExportPatientLedgerCSV = () => {
    if (!patientSummary || !patientSummary.payments || patientSummary.payments.length === 0) {
      alert('No payment ledger records to export for this patient.');
      return;
    }
    const headers = [
      'Invoice Number',
      'Date',
      'Patient Name',
      'CNIC',
      'Contact',
      'Doctor / Specialist',
      'Category',
      'Payment Channel',
      'Payment Plan',
      'Items / Treatment Detail',
      'Gross Amount (PKR)',
      'Discount (PKR)',
      'Amount Paid (PKR)',
      'Balance Due (PKR)',
      'Payment Status',
      'Clinical Session Remarks'
    ];
    const rows = patientSummary.payments.map((p: any) => {
      const itemsDetail = p.items && Array.isArray(p.items) && p.items.length > 0
        ? p.items.map((i: any) => `${i.name} (x${i.quantity})`).join('; ')
        : (p.dealName || p.category || '-');
      return [
        p.invoiceNumber || 'INV-REF',
        new Date(p.createdAt).toLocaleString(),
        `"${patientSummary.patientName}"`,
        `"${patientSummary.cnic}"`,
        `"${patientSummary.phone}"`,
        `"${p.doctorName || matchedQueueItem?.doctorName || 'Attending Doctor'}"`,
        p.category || 'CONSULTATION',
        p.paymentMethod || 'CASH',
        p.paymentPlan || 'FULL',
        `"${itemsDetail}"`,
        p.totalAmount,
        p.discount || 0,
        p.amountPaid,
        p.balanceDue,
        p.status,
        `"${p.notes || '-'}"`
      ];
    });
    const csvContent = [
      `"SkinLab Aesthetic Hospital - Patient Financial Ledger"`,
      `"Patient: ${patientSummary.patientName} (CNIC: ${patientSummary.cnic})"`,
      `"Total Billed: PKR ${patientSummary.totalCharges} | Total Paid: PKR ${patientSummary.totalPaid} | Balance Due: PKR ${patientSummary.balanceDue} | Advance Wallet Credit: PKR ${patientSummary.advanceCredit}"`,
      `"Exported At: ${new Date().toLocaleString()}"`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Patient_Ledger_${patientSummary.patientName.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const effectiveQueue: QueueItem[] = (queue && queue.length > 0) ? queue : liveQueue;
  const queuePatientIds = new Set(effectiveQueue.map(q => q.patientId).filter(Boolean));
  const otherPatients = allPatients.filter(p => !queuePatientIds.has(p.id));

  const matchedQueueItem = effectiveQueue.find(q => q.patientId === selectedPatientId);
  const matchedPatientRecord = allPatients.find(p => p.id === selectedPatientId);

  // Filter Catalog (Includes Name, SKU, and Barcode compatibility)
  const filterQuery = catalogSearch.toLowerCase().trim();
  const filteredServices = allServices.filter(s => !filterQuery || s.name.toLowerCase().includes(filterQuery));
  const filteredDeals = allDeals.filter(d => !filterQuery || d.name.toLowerCase().includes(filterQuery));
  const filteredProducts = allProducts.filter(p => !filterQuery || p.name.toLowerCase().includes(filterQuery) || (p.sku && p.sku.toLowerCase().includes(filterQuery)) || (p.barcode && p.barcode.toLowerCase().includes(filterQuery)));

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
              Receivables from Patients
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider block">Discounts & Waivers</span>
            <div className="text-xl font-mono font-extrabold text-slate-700 dark:text-[#C2C5AA] mt-1">
              PKR {hospitalLedger?.totalDiscounts?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] font-medium mt-0.5 block">
              Special clinical waivers
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#25331E] border border-slate-200 dark:border-[#38482E] flex items-center justify-center text-slate-600 dark:text-[#C2C5AA]">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider block">Sales Returns & Refunds</span>
            <div className="text-xl font-mono font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {allReturns.length} <span className="text-xs font-normal">Processed</span>
            </div>
            <button
              onClick={() => setIsReturnsModalOpen(true)}
              className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
            >
              <Undo2 className="w-3 h-3" /> View Returns Log
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Undo2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Patient Lookup, Attending Doctor & Dual Wallet Bar */}
      <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#2F3E29] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Front-Desk Aesthetic POS & Cash Counter</h3>
              <p className="text-xs text-slate-500 dark:text-[#A4AC86]">Single & multi-session treatment billing, retail skincare checkout, and doctor attribution.</p>
            </div>
          </div>

          {/* Attending Doctor Selector */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-[#A4AC86] whitespace-nowrap flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Attending Doctor:
            </span>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Direct Counter / Walk-in --</option>
              {allDoctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Patient Selection Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8">
            <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">
              Select Patient (Queue Check-in or Registered Directory) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedPatientId}
                onChange={handlePatientSelect}
                className="w-full text-xs font-semibold py-2.5 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Choose patient to begin checkout --</option>
                {effectiveQueue.length > 0 && (
                  <optgroup label="Live Queue Patients (Checked-in)">
                    {effectiveQueue.map(q => (
                      <option key={q.patientId} value={q.patientId}>
                        Token #{q.tokenNumber} - {q.patientName} ({q.doctorName || 'OPD'})
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherPatients.length > 0 && (
                  <optgroup label="Registered Patient Directory">
                    {otherPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} | CNIC: {p.cnic || 'N/A'} | Ph: {p.emergencyContact || p.phone || 'N/A'}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Quick Dual Wallet & Due Indicator */}
          <div className="lg:col-span-4 flex items-center gap-3">
            {patientSummary && (
              <div className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13]">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] font-bold uppercase block">Advance Wallet</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    PKR {patientSummary.advanceCredit.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" /> Top Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Multi-Session Packages Card for Selected Patient */}
        {patientSummary && patientSummary.activePackages && patientSummary.activePackages.length > 0 && (
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Active Multi-Session Packages (Prepaid Deals)
              </span>
              <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400">
                {patientSummary.activePackages.length} Active Series Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {patientSummary.activePackages.map(pkg => (
                <div key={pkg.paymentId} className="bg-white dark:bg-[#1A2215] border border-indigo-100 dark:border-indigo-900/60 p-3 rounded-xl shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{pkg.dealName}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                      <span className="text-indigo-600 font-bold">
                        {pkg.sessionsRemaining} Sessions Left
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500 dark:text-[#A4AC86]">
                        {pkg.sessionsConsumed} / {pkg.totalSessions} Used
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRedeemModalPackage(pkg);
                      setRedeemDoctorName(matchedQueueItem?.doctorName || 'Dr. Specialist');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Redeem 1 Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. POS Item Catalog & Cart System */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Item Catalog */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#2F3E29] pb-3">
            {/* Catalog Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#171F13] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCatalogTab('SERVICES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  catalogTab === 'SERVICES'
                    ? 'bg-white dark:bg-[#202C1B] text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900'
                }`}
              >
                Procedures
              </button>
              <button
                type="button"
                onClick={() => setCatalogTab('PACKAGES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  catalogTab === 'PACKAGES'
                    ? 'bg-white dark:bg-[#202C1B] text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900'
                }`}
              >
                Multi-Session Deals
              </button>
              <button
                type="button"
                onClick={() => setCatalogTab('PRODUCTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  catalogTab === 'PRODUCTS'
                    ? 'bg-white dark:bg-[#202C1B] text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900'
                }`}
              >
                Skincare Retail
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Search item or SKU..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Catalog Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {catalogTab === 'SERVICES' && filteredServices.map(s => (
              <div
                key={s.id}
                onClick={() => addToCart({ id: s.id, name: s.name, type: 'SERVICE', unitPrice: s.baseFee })}
                className="p-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-[#171F13] hover:bg-emerald-50/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A4AC86] line-clamp-1 mt-0.5">{s.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-[#2F3E29]/60">
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    PKR {s.baseFee.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> Add
                  </span>
                </div>
              </div>
            ))}

            {catalogTab === 'PACKAGES' && filteredDeals.map(d => (
              <div
                key={d.id}
                onClick={() => addToCart({ id: d.id, name: d.name, type: 'DEAL', unitPrice: d.totalPrice, sessionsAllowed: d.sessionsAllowed })}
                className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60">
                      {d.sessionsAllowed} Sessions Package
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{d.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A4AC86] line-clamp-1 mt-0.5">{d.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    PKR {d.totalPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> Select Deal
                  </span>
                </div>
              </div>
            ))}

            {catalogTab === 'PRODUCTS' && filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => p.stockQuantity > 0 && addToCart({ id: p.id, name: p.name, type: 'PRODUCT', unitPrice: p.sellingPrice, sku: p.sku })}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  p.stockQuantity > 0
                    ? 'border-slate-200 dark:border-[#2F3E29] hover:border-emerald-500 bg-slate-50/60 dark:bg-[#171F13] cursor-pointer'
                    : 'border-slate-200 opacity-60 bg-slate-100 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{p.sku} {p.barcode ? `• ${p.barcode}` : ''}</span>
                    <span className={p.stockQuantity <= 10 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                      Stock: {p.stockQuantity}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{p.name}</h4>
                  {p.costPrice > 0 && (
                    <div className="mt-1">
                      <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                        {Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)}% Profit Margin
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-[#2F3E29]/60">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    PKR {p.sellingPrice.toFixed(2)}
                  </span>
                  {p.stockQuantity > 0 ? (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                      <Plus className="w-3 h-3" /> Add
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-500">Out of stock</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Table if items added */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-200 dark:border-[#2F3E29] pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5 text-emerald-600" /> Active Cart ({cartItems.length} items)</span>
                <button type="button" onClick={clearCart} className="text-[11px] text-rose-500 hover:underline cursor-pointer">
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#2F3E29] text-xs">
                {cartItems.map(item => (
                  <div key={item.id} className="py-1.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">x{item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-800 dark:text-[#E8F3EB]">
                        PKR {(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Checkout & Payment Settlement Deck */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2F3E29]">
            <CreditCard className="w-4 h-4 text-emerald-600" /> POS Billing & Settlement
          </h3>

          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Category / Procedure Type */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-[#A4AC86] block mb-1">Billing Classification</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Numerical Inputs: Gross, Discount, Net */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-[#A4AC86] block mb-1">Gross Fee (PKR)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={grossAmount}
                  onChange={e => handleGrossChange(e.target.value)}
                  className="w-full text-xs font-mono font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-[#A4AC86] block mb-1">Discount (PKR)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={discount}
                  onChange={e => handleDiscountChange(e.target.value)}
                  className="w-full text-xs font-mono font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Net Amount & Payment Plan */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171F13] border border-slate-100 dark:border-[#2F3E29] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#A4AC86] font-bold uppercase block">Net Amount Payable</span>
                <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                  PKR {netVal.toFixed(2)}
                </span>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-[#A4AC86] font-bold uppercase block mb-0.5">Plan</label>
                <select
                  value={paymentPlan}
                  onChange={e => handlePaymentPlanChange(e.target.value)}
                  className="text-[11px] font-bold py-1 px-2 rounded-lg border border-slate-200 dark:border-[#2F3E29] bg-white dark:bg-[#202C1B] text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  {PAYMENT_PLANS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount Paid Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-[#A4AC86]">Amount Paid Now (PKR)</label>
                {estimatedRemainingDues > 0 && (
                  <span className="text-[11px] font-mono text-rose-600 font-bold">
                    Dues: PKR {estimatedRemainingDues.toFixed(2)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="50"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="w-full text-sm font-mono font-bold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-emerald-700 dark:text-emerald-300 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Payment Method Channels Grid */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-[#A4AC86] block mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? `${m.color} ring-2 ring-emerald-500 shadow-xs`
                          : 'border-slate-200 dark:border-[#2F3E29] text-slate-600 dark:text-[#A4AC86] bg-slate-50 dark:bg-[#171F13] hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Remarks / Session Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-[#A4AC86] block mb-1">Session Remarks / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Session 1 completed, patient advised sunscreen"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Collect Payment Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatientId}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <span>Recording Payment...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Collect Payment & Issue Invoice (PKR {paidVal.toFixed(2)})</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 4. Patient Historical Invoices & Ledger Table */}
      {patientSummary && patientSummary.payments && patientSummary.payments.length > 0 && (
        <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2F3E29] pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" /> Previous Invoices & Encounter History
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Total Invoices: {patientSummary.payments.length}
              </span>
              <button
                type="button"
                onClick={handleExportPatientLedgerCSV}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export Patient Ledger (CSV)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#171F13] text-slate-600 dark:text-[#A4AC86] uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Doctor / Category</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Dues</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2F3E29] font-mono">
                {patientSummary.payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-[#202C1B] transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{p.invoiceNumber || 'INV-REF'}</td>
                    <td className="p-3 text-slate-600 dark:text-[#A4AC86] font-sans text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-sans font-semibold text-slate-700 dark:text-[#C2C5AA]">
                      <div>{p.dealName || p.category || 'Consultation'}</div>
                      {p.doctorName && <div className="text-[10px] text-slate-400 font-normal">{p.doctorName}</div>}
                    </td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#25331E] text-slate-800 dark:text-[#C2C5AA]">
                        {p.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-white">PKR {p.totalAmount.toFixed(2)}</td>
                    <td className="p-3 font-bold text-emerald-700 dark:text-emerald-300">PKR {p.amountPaid.toFixed(2)}</td>
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">PKR {p.balanceDue.toFixed(2)}</td>
                    <td className="p-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : p.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveReceipt({
                          ...p,
                          patientName: patientSummary.patientName,
                          cnic: patientSummary.cnic,
                          phone: patientSummary.phone,
                          doctorName: p.doctorName || matchedQueueItem?.doctorName || 'Attending Doctor',
                          tokenNumber: matchedQueueItem?.tokenNumber || 'OPD'
                        })}
                        className="text-emerald-600 hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" /> Slip
                      </button>
                      {p.amountPaid > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentForRefund(p);
                            setRefundAmountInput(String(p.amountPaid));
                            setIsReturnsModalOpen(true);
                          }}
                          className="text-rose-600 hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Undo2 className="w-3 h-3" /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal: Redeem Package Session */}
      {redeemModalPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2F3E29] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Redeem Session: {redeemModalPackage.dealName}
              </h3>
              <button onClick={() => setRedeemModalPackage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171F13] text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Progress:</span>
                <span className="font-bold text-indigo-600">Session {redeemModalPackage.sessionsConsumed + 1} of {redeemModalPackage.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining After This:</span>
                <span className="font-bold text-slate-800 dark:text-white">{redeemModalPackage.sessionsRemaining - 1} Sessions</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">Attending Doctor / Aesthetician</label>
                <input
                  type="text"
                  value={redeemDoctorName}
                  onChange={e => setRedeemDoctorName(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none"
                  placeholder="e.g. Dr. Aisha Khan"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">Session Clinical Remarks & Settings</label>
                <textarea
                  rows={3}
                  value={sessionRemarksInput}
                  onChange={e => setSessionRemarksInput(e.target.value)}
                  placeholder="e.g. Session 2 completed: Diode 808nm, 14J, forehead & chin. Patient skin clear, no erythema."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2F3E29]">
              <button type="button" onClick={() => setRedeemModalPackage(null)} className="clinical-button-secondary text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={isRedeeming}
                onClick={handleConfirmRedeemSession}
                className="clinical-button-primary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isRedeeming ? 'Deducting Session...' : 'Confirm Session Deducted'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Patient Wallet Top-Up */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2F3E29] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Top Up Advance Wallet
              </h3>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">Top-Up Amount (PKR)</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={walletAmount}
                  onChange={e => setWalletAmount(e.target.value)}
                  className="w-full text-sm font-mono font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-emerald-700 dark:text-emerald-300 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">Receiving Method</label>
                <select
                  value={walletPaymentMethod}
                  onChange={e => setWalletPaymentMethod(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none"
                >
                  <option value="CASH">Cash (PKR)</option>
                  <option value="CARD">Debit/Credit Card</option>
                  <option value="BANK_TRANSFER">Bank (IBFT / Raast)</option>
                  <option value="JAZZCASH">JazzCash</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2F3E29]">
              <button type="button" onClick={() => setIsWalletModalOpen(false)} className="clinical-button-secondary text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={isToppingUp}
                onClick={handleConfirmTopUpWallet}
                className="clinical-button-primary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isToppingUp ? 'Processing...' : 'Deposit to Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Sales Returns & Refund Processing */}
      {isReturnsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2F3E29] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-rose-600" /> Sales Returns & Refund Manager
              </h3>
              <button onClick={() => { setIsReturnsModalOpen(false); setSelectedPaymentForRefund(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedPaymentForRefund ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171F13] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedPaymentForRefund.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Refundable:</span>
                    <span className="font-bold text-emerald-600">PKR {selectedPaymentForRefund.amountPaid?.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">Refund Amount (PKR)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedPaymentForRefund.amountPaid}
                    value={refundAmountInput}
                    onChange={e => setRefundAmountInput(e.target.value)}
                    className="w-full text-sm font-mono font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-rose-600 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">Refund Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundMethodInput('CASH')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer ${
                        refundMethodInput === 'CASH' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'
                      }`}
                    >
                      Cash Return
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundMethodInput('WALLET')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer ${
                        refundMethodInput === 'WALLET' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'
                      }`}
                    >
                      Credit to Wallet
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#C2C5AA] block mb-1">Reason for Return / Refund</label>
                  <textarea
                    rows={2}
                    value={refundReasonInput}
                    onChange={e => setRefundReasonInput(e.target.value)}
                    placeholder="e.g. Procedure canceled due to skin allergy; customer returned unopened sunscreen"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-[#2F3E29] bg-slate-50 dark:bg-[#171F13] text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2F3E29]">
                  <button type="button" onClick={() => setSelectedPaymentForRefund(null)} className="clinical-button-secondary text-xs cursor-pointer">
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingRefund}
                    onClick={handleConfirmRefund}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm cursor-pointer"
                  >
                    {isProcessingRefund ? 'Reversing...' : 'Issue Refund'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs text-slate-500 block">Past Returns & Reversals Audit Trail:</span>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2F3E29] text-xs">
                  {allReturns.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">No returns recorded yet.</div>
                  ) : (
                    allReturns.map(r => (
                      <div key={r.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{r.returnNumber}</span>
                          <span className="text-slate-400 font-mono ml-2">({r.invoiceNumber})</span>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{r.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-rose-600">-PKR {r.refundAmount}</span>
                          <span className="block text-[10px] text-slate-400">{r.refundMethod}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Dedicated 80mm Thermal Receipt Slip Layout & Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white text-black rounded-xl p-5 shadow-2xl font-mono text-xs border border-slate-300">
            {/* Printable Slip Container */}
            <div id="thermal-receipt-slip" className="space-y-3">
              <div className="text-center border-b border-dashed border-black pb-3">
                {clinicProfile.clinicLogoUrl && (
                  <div className="flex justify-center mb-1.5">
                    <img src={clinicProfile.clinicLogoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain grayscale" />
                  </div>
                )}
                <h2 className="text-base font-extrabold uppercase tracking-tight">{clinicProfile.clinicName}</h2>
                <p className="text-[10px] text-slate-600 mt-0.5">{clinicProfile.clinicAddress}</p>
                <p className="text-[10px] text-slate-600">Ph: {clinicProfile.clinicPhone} | NTN: {clinicProfile.taxNumber || clinicProfile.clinicNtn}</p>
                <div className="mt-2 py-1 px-2 border border-black text-xs font-bold inline-block">
                  QUEUE TOKEN #{activeReceipt.tokenNumber || 'WALK-IN'}
                </div>
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>Invoice: {activeReceipt.invoiceNumber}</span>
                  <span>{new Date(activeReceipt.createdAt).toLocaleDateString()}</span>
                </div>
                <div>Patient: <strong>{activeReceipt.patientName}</strong></div>
                {activeReceipt.doctorName && <div>Doctor: <strong>{activeReceipt.doctorName}</strong></div>}
                <div>Payment: {activeReceipt.paymentMethod} ({activeReceipt.paymentPlan || 'FULL'})</div>
              </div>

              {/* Itemized list if cart items present */}
              {activeReceipt.items && activeReceipt.items.length > 0 ? (
                <div className="border-b border-dashed border-black pb-2 text-[11px]">
                  <div className="flex justify-between font-bold pb-1">
                    <span>Item</span>
                    <span>Total</span>
                  </div>
                  {activeReceipt.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate pr-2">{it.name} (x{it.quantity})</span>
                      <span>PKR {(it.unitPrice * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between text-[11px] border-b border-dashed border-black pb-2">
                  <span>{activeReceipt.dealName || activeReceipt.category || 'Clinical Treatment'}</span>
                  <span>PKR {activeReceipt.totalAmount?.toFixed(2)}</span>
                </div>
              )}

              {/* Financial Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {activeReceipt.totalAmount?.toFixed(2)}</span>
                </div>
                {(activeReceipt.discount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-PKR {activeReceipt.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm">
                  <span>PAID:</span>
                  <span>PKR {activeReceipt.amountPaid?.toFixed(2)}</span>
                </div>
                {activeReceipt.balanceDue > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>DUES REMAINING:</span>
                    <span>PKR {activeReceipt.balanceDue?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Multi-Session Notice if applicable */}
              {activeReceipt.sessionsAllowed && activeReceipt.sessionsAllowed > 0 && (
                <div className="p-1.5 border border-dashed border-black text-center text-[10px]">
                  <strong>Aesthetic Package:</strong> {activeReceipt.sessionsAllowed} Total Sessions
                </div>
              )}

              {/* Footer Note */}
              <div className="text-center text-[9px] text-slate-600 pt-1">
                <p>{clinicProfile.receiptFooterNote}</p>
                <p className="mt-1 font-bold">*** HAVE A RADIANT DAY ***</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4 no-print">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-black text-white hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print 80mm Slip
              </button>
            </div>

            {/* Dedicated 80mm ESC/POS Thermal Print Styles */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #thermal-receipt-slip,
                #thermal-receipt-slip * {
                  visibility: visible !important;
                }
                #thermal-receipt-slip {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 80mm !important;
                  max-width: 80mm !important;
                  margin: 0 !important;
                  padding: 3mm !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  border: none !important;
                  box-shadow: none !important;
                  font-family: monospace !important;
                  font-size: 11px !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};
