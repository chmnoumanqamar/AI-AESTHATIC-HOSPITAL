import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Pill,
  Package,
  ShoppingCart,
  ShieldAlert,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  Clock,
  Sparkles,
  Filter,
  Check,
  X,
  CreditCard,
  User,
  Activity,
  FileText,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';

interface PharmacyWorkspaceProps {
  currentUser?: any;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const PharmacyWorkspace: React.FC<PharmacyWorkspaceProps> = ({
  currentUser,
  currentTab = 'pharma_queue',
  onSelectTab
}) => {
  // Active inner sub-tab mapped to structural rail currentTab
  const activeSubTab = currentTab.startsWith('pharma_') ? currentTab : 'pharma_queue';

  // Master Data State
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [procurementOrders, setProcurementOrders] = useState<any[]>([]);

  // Modal / Action States
  const [selectedRxToDispense, setSelectedRxToDispense] = useState<any | null>(null);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [dispensePaymentMethod, setDispensePaymentMethod] = useState<'CASH' | 'CARD' | 'INSURANCE' | 'WALLET'>('CASH');
  const [dispenseLoading, setDispenseLoading] = useState(false);
  const [dispenseSuccessModal, setDispenseSuccessModal] = useState<any | null>(null);

  // Inventory Filter & Form State
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    batchNo: '',
    expiryDate: '2027-12-31',
    quantity: 100,
    reorderLevel: 20,
    unitPrice: 15,
    costPrice: 10,
    rackLocation: 'A-01',
    prescriptionRequired: true
  });

  // POS State
  const [posSearch, setPosSearch] = useState('');
  const [cart, setCart] = useState<Array<{ medicine: any; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [posProcessing, setPosProcessing] = useState(false);
  const [posReceiptModal, setPosReceiptModal] = useState<any | null>(null);

  // Safety Screener State
  const [safetySelectedDrugs, setSafetySelectedDrugs] = useState<string[]>([]);
  const [safetyCustomDrug, setSafetyCustomDrug] = useState('');
  const [safetyPatientAllergies, setSafetyPatientAllergies] = useState<string[]>([]);
  const [safetyCustomAllergy, setSafetyCustomAllergy] = useState('');
  const [safetyResult, setSafetyResult] = useState<any | null>(null);
  const [safetyChecking, setSafetyChecking] = useState(false);

  // Procurement State
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);

  // Initial Fetch & Periodic Auto-refresh
  const fetchAllPharmacyData = async () => {
    setLoading(true);
    try {
      const [queueRes, invRes, procRes] = await Promise.all([
        api.get('/pharmacy/queue'),
        api.get('/pharmacy/inventory'),
        api.get('/pharmacy/procurement')
      ]);

      if (queueRes.data?.data) setQueue(queueRes.data.data);
      if (invRes.data?.data) {
        setInventory(invRes.data.data.medicines || []);
        setLowStockAlerts(invRes.data.data.lowStockAlerts || []);
        setCategories(invRes.data.data.categories || []);
      }
      if (procRes.data?.data) setProcurementOrders(procRes.data.data);
    } catch (err) {
      console.error('Error fetching pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPharmacyData();
  }, []);

  // Calculate HUD Metrics
  const pendingRxCount = queue.filter(q => q.status === 'PENDING').length;
  const fulfilledTodayCount = queue.filter(q => q.status === 'DISPENSED').length;
  const lowStockCount = lowStockAlerts.length;
  const estimatedVaultValue = inventory.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  // Handle Prescription Dispensation
  const handleConfirmDispense = async () => {
    if (!selectedRxToDispense) return;
    setDispenseLoading(true);
    try {
      const res = await api.post('/pharmacy/dispense', {
        prescriptionId: selectedRxToDispense.prescriptionId,
        dispensedBy: currentUser?.name || currentUser?.profile?.name || 'Tariq Mehmood, RPh',
        pharmacistNotes: dispenseNotes || 'Dispensed after patient counseling on dosage.',
        paymentMethod: dispensePaymentMethod
      });

      if (res.data?.data) {
        setDispenseSuccessModal(res.data.data);
        setSelectedRxToDispense(null);
        setDispenseNotes('');
        fetchAllPharmacyData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispense prescription. Check stock levels.');
    } finally {
      setDispenseLoading(false);
    }
  };

  // Handle Add Medicine
  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy/inventory', newMedicine);
      setShowAddMedicineModal(false);
      setNewMedicine({
        name: '',
        genericName: '',
        category: 'Antibiotics',
        batchNo: '',
        expiryDate: '2027-12-31',
        quantity: 100,
        reorderLevel: 20,
        unitPrice: 15,
        costPrice: 10,
        rackLocation: 'A-01',
        prescriptionRequired: true
      });
      fetchAllPharmacyData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add medicine.');
    }
  };

  // Handle POS Cart Add/Modify
  const addToCart = (medicine: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicine.id === medicine.id);
      if (existing) {
        if (existing.quantity >= medicine.quantity) {
          alert(`Cannot add more than available stock (${medicine.quantity} units)`);
          return prev;
        }
        return prev.map(item =>
          item.medicine.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine, quantity: 1 }];
    });
  };

  const updateCartQuantity = (medicineId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.medicine.id === medicineId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.medicine.quantity) {
              alert(`Max available stock is ${item.medicine.quantity}`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prev => prev.filter(item => item.medicine.id !== medicineId));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.quantity * item.medicine.unitPrice, 0);
  const cartDiscount = (cartSubtotal * discountPercent) / 100;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  // Handle POS Checkout
  const handlePosCheckout = async () => {
    if (cart.length === 0) return;
    setPosProcessing(true);
    try {
      const res = await api.post('/pharmacy/pos', {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || 'N/A',
        items: cart.map(item => ({
          medicineId: item.medicine.id,
          quantity: item.quantity,
          unitPrice: item.medicine.unitPrice
        })),
        discountPercent,
        paymentMethod: posPaymentMethod,
        notes: 'Walk-in OTC transaction processed at dispensary desk.'
      });

      if (res.data?.data) {
        setPosReceiptModal(res.data.data);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscountPercent(0);
        fetchAllPharmacyData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'POS Checkout failed.');
    } finally {
      setPosProcessing(false);
    }
  };

  // Handle Drug Safety Check
  const handleRunSafetyCheck = async () => {
    if (safetySelectedDrugs.length === 0) {
      alert('Please add at least 1 drug to analyze.');
      return;
    }
    setSafetyChecking(true);
    try {
      const res = await api.post('/pharmacy/safety-check', {
        drugNames: safetySelectedDrugs,
        patientAllergies: safetyPatientAllergies
      });
      if (res.data?.data) {
        setSafetyResult(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Safety check failed.');
    } finally {
      setSafetyChecking(false);
    }
  };

  // Handle Receiving Procurement Shipment
  const handleReceiveShipment = async (orderId: string) => {
    setReceivingOrderId(orderId);
    try {
      await api.post(`/pharmacy/procurement/${orderId}/receive`);
      fetchAllPharmacyData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to receive shipment.');
    } finally {
      setReceivingOrderId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Top Clinical Pharmacist Banner & HUD Metrics */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-[#064E3B] dark:via-[#0F766E] dark:to-[#134E4A] p-6 sm:p-8 text-slate-900 dark:text-white shadow-xs dark:shadow-xl border border-emerald-200/80 dark:border-emerald-600/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-300/20 dark:bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-teal-200/25 dark:bg-teal-300/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-500/20 border border-emerald-300/60 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
              <span>Pharmacy & Medical Store Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Pill className="w-8 h-8 text-emerald-600 dark:text-emerald-300" />
              Clinical Dispensary & Pharmacist Suite
            </h1>
            <p className="text-slate-600 dark:text-emerald-100/80 text-sm max-w-2xl font-medium">
              Real-time doctor prescription fulfillment, electronic inventory ledger with rack tracing, POS cash counter, and AI interaction cross-screening.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={fetchAllPharmacyData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 dark:bg-white/10 dark:hover:bg-white/20 active:scale-95 border border-emerald-200 dark:border-white/20 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-2xs backdrop-blur-sm"
              title="Refresh Pharmacy Data"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-300 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Vault</span>
            </button>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Logged Pharmacist</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser?.profile?.name || currentUser?.fullName || 'Tariq Mehmood, RPh'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Key Performance Metrics Cards (Interactive Quick Jumps) */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div
            onClick={() => onSelectTab && onSelectTab('pharma_queue')}
            role="button"
            tabIndex={0}
            title="Click to view Pending Prescription Queue"
            className="rounded-2xl bg-white/90 dark:bg-white/10 backdrop-blur-md p-4 border border-emerald-100/80 dark:border-white/15 flex items-center justify-between shadow-2xs transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-emerald-200">Pending Rx Queue</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingRxCount}</p>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Doctor Orders Awaiting</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('pharma_inventory')}
            role="button"
            tabIndex={0}
            title="Click to view Drug Inventory Vault & Low Stock"
            className="rounded-2xl bg-white/90 dark:bg-white/10 backdrop-blur-md p-4 border border-emerald-100/80 dark:border-white/15 flex items-center justify-between shadow-2xs transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-emerald-200">Low Stock Triggers</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">{lowStockCount}</p>
              <span className="text-[11px] text-amber-700 dark:text-amber-200/80 font-medium">Needs Reordering</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('pharma_queue')}
            role="button"
            tabIndex={0}
            title="Click to view Dispensed Prescriptions"
            className="rounded-2xl bg-white/90 dark:bg-white/10 backdrop-blur-md p-4 border border-emerald-100/80 dark:border-white/15 flex items-center justify-between shadow-2xs transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-emerald-200">Dispensed Today</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{fulfilledTodayCount}</p>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Completed Prescriptions</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('pharma_inventory')}
            role="button"
            tabIndex={0}
            title="Click to view Inventory Ledger & Valuation"
            className="rounded-2xl bg-white/90 dark:bg-white/10 backdrop-blur-md p-4 border border-emerald-100/80 dark:border-white/15 flex items-center justify-between shadow-2xs transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-emerald-200">Inventory Valuation</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">${estimatedVaultValue.toLocaleString()}</p>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">{inventory.length} Drug SKUs</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-400/30 flex items-center justify-center text-emerald-700 dark:text-emerald-100">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: LIVE DISPENSE QUEUE */}
      {/* ========================================================================= */}
      {activeSubTab === 'pharma_queue' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Doctor Prescriptions Ready for Fulfillment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically synced in real-time from outpatient clinical consultation records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {pendingRxCount} Active Pending Rx
              </span>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-white dark:bg-[#1E2718]">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">All Prescriptions Dispensed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                There are no pending doctor prescriptions in the dispensary queue right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {queue.map(item => {
                const isPending = item.status === 'PENDING';
                const hasAllergyWarning = item.patientAllergies && item.patientAllergies.length > 0;

                return (
                  <div
                    key={item.prescriptionId}
                    className={`rounded-3xl p-5 border transition-all duration-200 bg-white dark:bg-[#1E2718] ${
                      isPending
                        ? 'border-emerald-200 dark:border-emerald-800/60 shadow-sm hover:shadow-md'
                        : 'border-slate-200 dark:border-slate-800 opacity-80'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            RX #{item.prescriptionId.slice(-6).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {item.patientName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Prescribed by <span className="font-semibold text-emerald-700 dark:text-emerald-400">{item.doctorName}</span> • {new Date(item.issuedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Est. Bill</span>
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-400">${item.totalAmount}</span>
                      </div>
                    </div>

                    {/* Patient Allergies Alert if present */}
                    {hasAllergyWarning && (
                      <div className="mt-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="font-semibold">Known Patient Allergies:</span>
                        <span>{item.patientAllergies.join(', ')}</span>
                      </div>
                    )}

                    {/* Prescribed Medications */}
                    <div className="mt-4 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prescribed Regimen:</p>
                      <div className="space-y-1.5">
                        {item.items?.map((med: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60"
                          >
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{med.medicineName}</span>
                              <span className="text-slate-500 dark:text-slate-400 ml-2 font-medium">({med.dosage} • {med.frequency})</span>
                              {med.instructions && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">{med.instructions}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Qty: {med.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                      {isPending ? (
                        <button
                          onClick={() => setSelectedRxToDispense(item)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Pill className="w-4 h-4" />
                          <span>Verify & Dispense Rx</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Dispensed ({new Date(item.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: DRUG INVENTORY VAULT */}
      {/* ========================================================================= */}
      {activeSubTab === 'pharma_inventory' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E2718] p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search drug name, generic, or batch..."
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium dark:text-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddMedicineModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Drug SKU</span>
            </button>
          </div>

          {/* Low Stock Warning Banner if any items triggered */}
          {lowStockAlerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Inventory Alert: {lowStockAlerts.length} item(s) below reorder threshold!</span>
                <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                  {lowStockAlerts.map(i => `${i.name} (${i.quantity} left)`).join(', ')}. Please issue purchase orders from the Procurement tab.
                </p>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2718] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Drug & Generic Name</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Batch / Rack</th>
                    <th className="px-4 py-4">Expiry Date</th>
                    <th className="px-4 py-4">Unit Price</th>
                    <th className="px-4 py-4">Stock Level</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inventory
                    .filter(item => {
                      const matchSearch =
                        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                        item.genericName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                        item.batchNo.toLowerCase().includes(inventorySearch.toLowerCase());
                      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
                      return matchSearch && matchCat;
                    })
                    .map(item => {
                      const isLowStock = item.quantity <= item.reorderLevel;
                      const isOutOfStock = item.quantity <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.genericName}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-700 dark:text-slate-300">{item.batchNo}</div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Rack: {item.rackLocation}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                            {item.expiryDate}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-sm ${
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-emerald-700 dark:text-emerald-400'
                              }`}>
                                {item.quantity}
                              </span>
                              <span className="text-[10px] text-slate-400">units</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {isOutOfStock ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: PHARMACY POS COUNTER */}
      {/* ========================================================================= */}
      {activeSubTab === 'pharma_pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Medicine Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#1E2718] p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Fast search over-the-counter medicine to add to cart..."
                  value={posSearch}
                  onChange={e => setPosSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {inventory
                .filter(item =>
                  item.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                  item.genericName.toLowerCase().includes(posSearch.toLowerCase())
                )
                .map(item => {
                  const inCart = cart.find(c => c.medicine.id === item.id);
                  const isAvailable = item.quantity > 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => isAvailable && addToCart(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isAvailable
                          ? 'bg-white dark:bg-[#1E2718] border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.genericName}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          ${item.unitPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Rack: {item.rackLocation}</span>
                        <span className={`font-bold ${item.quantity <= 10 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>
                          {item.quantity} in stock
                        </span>
                      </div>

                      {inCart && (
                        <div className="mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center justify-between">
                          <span>In Cart</span>
                          <span>x{inCart.quantity}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Column: POS Checkout Counter (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1E2718] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Walk-In Customer Bill</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer Information */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Name</label>
                <input
                  type="text"
                  placeholder="Optional Name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</label>
                <input
                  type="text"
                  placeholder="Contact #"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="mt-4 flex-1 overflow-y-auto max-h-[280px] space-y-2 border-y border-slate-100 dark:border-slate-800 py-3">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Cart is empty. Select items from the catalog.
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.medicine.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{item.medicine.name}</div>
                      <div className="text-[11px] text-slate-500">${item.medicine.unitPrice.toFixed(2)} each</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.medicine.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs w-5 text-center dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.medicine.id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.medicine.id)}
                        className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculation & Payment Summary */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Discount (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-right rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-white"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Net Total</span>
                <span className="font-black text-lg text-emerald-700 dark:text-emerald-400">${cartTotal.toFixed(2)}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'CARD', 'ONLINE'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPosPaymentMethod(method)}
                      className={`py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        posPaymentMethod === method
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handlePosCheckout}
                disabled={cart.length === 0 || posProcessing}
                className="w-full mt-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{posProcessing ? 'Processing Transaction...' : 'Complete Sale & Generate Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: DRUG SAFETY & AI INTERACTION SCREENER */}
      {/* ========================================================================= */}
      {activeSubTab === 'pharma_safety' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E2718] p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="max-w-2xl">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                Clinical Interaction & Patient Allergy Cross-Screener
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select multi-drug regimens or enter known patient allergies to screen for contraindicated combinations before dispensing.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Drug Combinations */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Drugs to Cross-Check:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type drug name (e.g. Lisinopril, Augmentin)..."
                    value={safetyCustomDrug}
                    onChange={e => setSafetyCustomDrug(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && safetyCustomDrug.trim()) {
                        setSafetySelectedDrugs([...safetySelectedDrugs, safetyCustomDrug.trim()]);
                        setSafetyCustomDrug('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (safetyCustomDrug.trim()) {
                        setSafetySelectedDrugs([...safetySelectedDrugs, safetyCustomDrug.trim()]);
                        setSafetyCustomDrug('');
                      }
                    }}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                {/* Quick select pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Augmentin', 'Lisinopril', 'Metoprolol', 'Atorvastatin', 'Cevit', 'Retin-A'].map(name => (
                    <button
                      key={name}
                      onClick={() => {
                        if (!safetySelectedDrugs.includes(name)) {
                          setSafetySelectedDrugs([...safetySelectedDrugs, name]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                    >
                      + {name}
                    </button>
                  ))}
                </div>

                {/* Selected Drug Tags */}
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {safetySelectedDrugs.length === 0 ? (
                    <span className="text-xs text-slate-400">No drugs selected yet</span>
                  ) : (
                    safetySelectedDrugs.map((drug, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold"
                      >
                        {drug}
                        <X
                          className="w-3.5 h-3.5 cursor-pointer hover:text-rose-500"
                          onClick={() => setSafetySelectedDrugs(safetySelectedDrugs.filter((_, i) => i !== idx))}
                        />
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Patient Allergies */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Patient Allergies (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type allergy (e.g. Penicillin, Sulfa, NSAIDs)..."
                    value={safetyCustomAllergy}
                    onChange={e => setSafetyCustomAllergy(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && safetyCustomAllergy.trim()) {
                        setSafetyPatientAllergies([...safetyPatientAllergies, safetyCustomAllergy.trim()]);
                        setSafetyCustomAllergy('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (safetyCustomAllergy.trim()) {
                        setSafetyPatientAllergies([...safetyPatientAllergies, safetyCustomAllergy.trim()]);
                        setSafetyCustomAllergy('');
                      }
                    }}
                    className="px-4 py-2 rounded-2xl bg-teal-600 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                {/* Quick select allergy pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Penicillin', 'Sulfa Drugs', 'Aspirin', 'Amoxicillin'].map(allergy => (
                    <button
                      key={allergy}
                      onClick={() => {
                        if (!safetyPatientAllergies.includes(allergy)) {
                          setSafetyPatientAllergies([...safetyPatientAllergies, allergy]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                    >
                      + {allergy}
                    </button>
                  ))}
                </div>

                {/* Selected Allergy Tags */}
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {safetyPatientAllergies.length === 0 ? (
                    <span className="text-xs text-slate-400">No allergies specified</span>
                  ) : (
                    safetyPatientAllergies.map((al, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs font-bold"
                      >
                        {al}
                        <X
                          className="w-3.5 h-3.5 cursor-pointer hover:text-rose-600"
                          onClick={() => setSafetyPatientAllergies(safetyPatientAllergies.filter((_, i) => i !== idx))}
                        />
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleRunSafetyCheck}
                disabled={safetyChecking || safetySelectedDrugs.length === 0}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{safetyChecking ? 'Analyzing Combinations...' : 'Run Interaction Analysis'}</span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {safetyResult && (
            <div className="rounded-3xl p-6 bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Safety Analysis Verdict:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    safetyResult.safe
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                  }`}>
                    {safetyResult.safe ? 'SAFE TO DISPENSE' : 'CAUTION ADVISED'}
                  </span>
                </h3>
              </div>

              {safetyResult.warnings?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Safety Warnings:</p>
                  {safetyResult.warnings.map((w: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {safetyResult.interactions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Drug-Drug Interactions:</p>
                  {safetyResult.interactions.map((inter: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{inter.drugA} + {inter.drugB}</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-[10px] font-black">{inter.severity}</span>
                      </div>
                      <p>{inter.description}</p>
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Action: {inter.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {safetyResult.safe && safetyResult.warnings?.length === 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>No contraindications or critical drug-drug interactions identified for this regimen.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: SUPPLIERS & PROCUREMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'pharma_procurement' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Distributor Purchase Orders & Stock Intake
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track incoming shipments from pharmaceutical suppliers (GlaxoSmithKline, Allergan, Abbott) and intake directly to vault.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {procurementOrders.map(order => {
              const isReceived = order.status === 'RECEIVED';

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2718] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          PO #{order.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {order.distributor}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isReceived
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs">
                      <p className="text-slate-500 dark:text-slate-400">
                        Order Date: <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(order.orderDate).toLocaleDateString()}</span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Expected Delivery: <span className="font-semibold text-slate-800 dark:text-slate-200">{order.expectedDelivery}</span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Total Invoice: <span className="font-black text-emerald-700 dark:text-emerald-400">${order.totalCost}</span>
                      </p>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Items Ordered:</p>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.medicineName}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{item.quantity} units @ ${item.unitCost}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    {isReceived ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Inventory Restocked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReceiveShipment(order.id)}
                        disabled={receivingOrderId === order.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        <span>{receivingOrderId === order.id ? 'Updating Stock...' : 'Receive Shipment & Restock Vault'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VERIFY & DISPENSE PRESCRIPTION */}
      {/* ========================================================================= */}
      {selectedRxToDispense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2718] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Dispense Prescription</h3>
              </div>
              <button
                onClick={() => setSelectedRxToDispense(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedRxToDispense.patientName}</p>
                <p className="text-slate-500">Doctor: {selectedRxToDispense.doctorName} • Total Bill: ${selectedRxToDispense.totalAmount}</p>
              </div>

              {selectedRxToDispense.patientAllergies?.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
                  <span className="font-bold">Patient Allergies:</span> {selectedRxToDispense.patientAllergies.join(', ')}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Method</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {(['CASH', 'CARD', 'INSURANCE', 'WALLET'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDispensePaymentMethod(m)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        dispensePaymentMethod === m
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pharmacist Counseling Notes</label>
                <textarea
                  rows={2}
                  value={dispenseNotes}
                  onChange={e => setDispenseNotes(e.target.value)}
                  placeholder="e.g. Advised patient to take with meals and complete 7-day course."
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedRxToDispense(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispense}
                disabled={dispenseLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{dispenseLoading ? 'Dispensing & Deducting Stock...' : 'Confirm & Dispense Rx'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISPENSE SUCCESS RECEIPT */}
      {/* ========================================================================= */}
      {dispenseSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2718] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Prescription Successfully Dispensed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Stock has been deducted from inventory and audit trail recorded.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Record ID:</span>
                <span className="font-bold text-slate-900 dark:text-white">{dispenseSuccessModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dispensed By:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{dispenseSuccessModal.dispensedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold text-emerald-600">{dispenseSuccessModal.paymentMethod} (${dispenseSuccessModal.totalAmount})</span>
              </div>
            </div>

            <button
              onClick={() => setDispenseSuccessModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POS RECEIPT */}
      {/* ========================================================================= */}
      {posReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2718] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Hospital Dispensary Receipt</h3>
              <p className="text-[11px] text-slate-500">Receipt #{posReceiptModal.invoiceNo} • {new Date(posReceiptModal.saleDate).toLocaleTimeString()}</p>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Customer:</span>
                <span className="font-bold text-slate-900 dark:text-white">{posReceiptModal.customerName}</span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                {posReceiptModal.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>{item.medicineName} x{item.quantity}</span>
                    <span className="font-bold">${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-black text-sm">
                <span className="text-slate-900 dark:text-white">Total Paid:</span>
                <span className="text-emerald-700 dark:text-emerald-400">${posReceiptModal.netTotal.toFixed(2)} ({posReceiptModal.paymentMethod})</span>
              </div>
            </div>

            <button
              onClick={() => setPosReceiptModal(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW MEDICINE SKU */}
      {/* ========================================================================= */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2718] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Drug in Vault</h3>
              </div>
              <button
                onClick={() => setShowAddMedicineModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panadol Forte"
                    value={newMedicine.name}
                    onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Generic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol"
                    value={newMedicine.genericName}
                    onChange={e => setNewMedicine({ ...newMedicine, genericName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <input
                    type="text"
                    value={newMedicine.category}
                    onChange={e => setNewMedicine({ ...newMedicine, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BT-9942"
                    value={newMedicine.batchNo}
                    onChange={e => setNewMedicine({ ...newMedicine, batchNo: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Initial Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newMedicine.quantity}
                    onChange={e => setNewMedicine({ ...newMedicine, quantity: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newMedicine.reorderLevel}
                    onChange={e => setNewMedicine({ ...newMedicine, reorderLevel: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Retail ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMedicine.unitPrice}
                    onChange={e => setNewMedicine({ ...newMedicine, unitPrice: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expiry Date</label>
                  <input
                    type="date"
                    value={newMedicine.expiryDate}
                    onChange={e => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rack Location</label>
                  <input
                    type="text"
                    value={newMedicine.rackLocation}
                    onChange={e => setNewMedicine({ ...newMedicine, rackLocation: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Register SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PharmacyWorkspace;
