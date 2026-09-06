import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  TrendingUp,
  Users,
  Clock,
  CreditCard,
  Printer,
  Download,
  RotateCcw,
  Calendar,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Search,
  X,
  Layers,
  Banknote,
  Smartphone
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ReportsAnalyticsDashboardProps {
  userRole?: 'ADMIN' | 'RECEPTIONIST';
}

export const ReportsAnalyticsDashboard: React.FC<ReportsAnalyticsDashboardProps> = ({
  userRole = 'ADMIN'
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'patients' | 'both'>('both');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTxQuery, setSearchTxQuery] = useState<string>('');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const fetchAnalytics = async (selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reports/analytics', {
        params: { period: selectedPeriod }
      });
      setData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load reports analytics:', err);
      setError(err.response?.data?.error?.message || 'Failed to load report analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setPeriod(newPeriod);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!data) return;

    const headers = [
      'Invoice #',
      'Date Time',
      'Patient Name',
      'Doctor / Clinic',
      'Category',
      'Payment Method',
      'Total (PKR)',
      'Discount (PKR)',
      'Paid (PKR)',
      'Balance Due (PKR)',
      'Status'
    ];
    const rows = (data.transactions || []).map((t: any) => [
      t.invoiceNumber,
      new Date(t.createdAt).toLocaleString(),
      `"${t.patientName}"`,
      `"${t.doctorName}"`,
      t.category,
      t.paymentMethod,
      t.totalAmount,
      t.discount,
      t.amountPaid,
      t.balanceDue,
      t.status
    ]);

    const csvContent = [
      `"Aesthetic Hospital - ${data.dateRange?.formattedLabel || period.toUpperCase()} Report"`,
      `"Generated At: ${new Date().toLocaleString()}"`,
      `"Total Revenue: PKR ${data.summary?.totalRevenue || 0}"`,
      `"Total Patients: ${data.summary?.totalPatients || 0}"`,
      '',
      headers.join(','),
      ...rows.map((r: string[]) => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hospital_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const filteredTransactions = data?.transactions?.filter((t: any) => {
    if (!searchTxQuery) return true;
    const q = searchTxQuery.toLowerCase();
    return (
      t.invoiceNumber.toLowerCase().includes(q) ||
      t.patientName.toLowerCase().includes(q) ||
      t.doctorName.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.paymentMethod.toLowerCase().includes(q)
    );
  }) || [];

  // Calculate highest values for chart scaling
  const timeSeriesList = data?.timeSeries || [];
  const maxRevenue = Math.max(...timeSeriesList.map((t: any) => t.revenue || 0), 1000);
  const maxPatients = Math.max(...timeSeriesList.map((t: any) => t.patients || 0), 5);

  // Y-axis ticks for currency
  const yTicksRevenue = [
    maxRevenue,
    Math.round((maxRevenue * 3) / 4),
    Math.round(maxRevenue / 2),
    Math.round(maxRevenue / 4),
    0
  ];

  return (
    <div className="space-y-7 animate-fade-in pb-32 print:p-0 print:m-0 print:pb-0">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          aside, header, nav, button, input, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .clinical-card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* 1. TOP EXECUTIVE CONTROL BAR (Normalized & Compact) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF7] dark:bg-[#1E2717] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] text-white flex items-center justify-center shadow-xs shrink-0 border border-emerald-400/30">
            <TrendingUp className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Executive Reports & Analytics
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-[#2D3923] text-emerald-800 dark:text-[#74C69D] border border-emerald-300 dark:border-[#406343]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#A4AC86] flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3 h-3 text-emerald-600 dark:text-[#74C69D]" />
              <span className="font-medium text-slate-700 dark:text-[#D7DBC7]">
                {data?.dateRange?.formattedLabel || 'Clinical audit and executive financial reconciliation'}
              </span>
            </p>
          </div>
        </div>

        {/* Toolbar: Segmented Periods & Quick Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Period Tabs */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 dark:bg-[#151D10] border border-[#D8DEC9] dark:border-[#2C3822]">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => {
              const isActive = period === p;
              const tabTitles: Record<string, string> = {
                daily: 'Daily',
                weekly: 'Weekly',
                monthly: 'Monthly',
                yearly: 'Yearly'
              };

              return (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tabTitles[p]}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              disabled={loading || !data}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-[#242E1C] border border-[#E2E6D8] dark:border-[#333D29] hover:bg-slate-50 dark:hover:bg-[#2D3923] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-3 h-3 text-[#2D6A4F] dark:text-[#52B788]" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading || !data}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-[#242E1C] border border-[#E2E6D8] dark:border-[#333D29] hover:bg-slate-50 dark:hover:bg-[#2D3923] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Print Summary"
            >
              <Printer className="w-3 h-3 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              onClick={() => fetchAnalytics(period)}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#242E1C] border border-[#E2E6D8] dark:border-[#333D29] transition-all shadow-xs cursor-pointer"
              title="Refresh"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2D6A4F]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. FOUR NORMAL-SIZED, NO-OVERLAP KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200/90 dark:border-[#2D4531] bg-white dark:bg-[#1E2717] hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-150 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 dark:text-[#74C69D] truncate">
              Total Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-[#1E3326] text-emerald-700 dark:text-[#74C69D] flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 overflow-hidden">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white truncate">
                Rs. {data?.summary?.totalRevenue ? data.summary.totalRevenue.toLocaleString() : '0'}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-[#74C69D] shrink-0">PKR</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#E8EDE0] dark:border-[#2A3521] flex items-center justify-between text-[11px] gap-1">
            <span className="font-bold text-emerald-700 dark:text-[#52B788] flex items-center gap-1 shrink-0 text-[10px]">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{data?.summary?.collectionRate || 100}% Settled</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500 dark:text-[#A4AC86] truncate text-right">
              Gross: Rs. {data?.summary?.totalGross ? data.summary.totalGross.toLocaleString() : '0'}
            </span>
          </div>
        </div>

        {/* Card 2: Patient Footfall */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-sky-200/90 dark:border-[#1E3A4A] bg-white dark:bg-[#15222E] hover:border-sky-500 dark:hover:border-sky-500 transition-all duration-150 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-800 dark:text-[#7DD3FC] truncate">
              Patient Footfall
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-[#132A3A] text-sky-700 dark:text-[#7DD3FC] flex items-center justify-center font-bold shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {data?.summary?.totalPatients || 0}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-300">Patients</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-sky-100 dark:border-[#1A3343] flex items-center justify-between text-[11px] gap-1">
            <span className="font-bold text-sky-700 dark:text-[#7DD3FC] text-[10px] shrink-0">
              {data?.summary?.completedConsultations || 0} Consulted
            </span>
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate text-right">
              {data?.summary?.totalAppointments || 0} Booked
            </span>
          </div>
        </div>

        {/* Card 3: Clinical Velocity */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200/90 dark:border-[#42331C] bg-white dark:bg-[#252015] hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-150 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 dark:text-[#FDE68A] truncate">
              Avg Wait Time
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-[#382810] text-amber-700 dark:text-[#FDE68A] flex items-center justify-center font-bold shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {data?.summary?.averageWaitTimeMinutes || 16}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-300">Minutes</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100 dark:border-[#382810] flex items-center justify-between text-[11px] gap-1">
            <span className="font-bold text-amber-700 dark:text-[#FDE68A] text-[10px] shrink-0">
              ~{data?.summary?.averageConsultationMinutes || 22}m Consult
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] truncate text-right">
              Optimal
            </span>
          </div>
        </div>

        {/* Card 4: Outstanding Dues */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-purple-200/90 dark:border-[#3C244F] bg-white dark:bg-[#231730] hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-150 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-800 dark:text-[#D8B4FE] truncate">
              Outstanding Dues
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-[#341C48] text-purple-700 dark:text-[#D8B4FE] flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 overflow-hidden">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white truncate">
                Rs. {data?.summary?.totalOutstanding ? data.summary.totalOutstanding.toLocaleString() : '0'}
              </span>
              <span className="text-[10px] font-extrabold text-purple-700 dark:text-[#D8B4FE] shrink-0">PKR</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-purple-100 dark:border-[#341C48] flex items-center justify-between text-[11px] gap-1">
            <span className="font-bold text-purple-700 dark:text-[#D8B4FE] text-[10px] shrink-0">
              Rs. {data?.summary?.totalDiscounts ? data.summary.totalDiscounts.toLocaleString() : '0'} Waived
            </span>
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate text-right">
              Pending
            </span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE VISUAL TIMELINE PROGRESSION CHART */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF7] dark:bg-[#1E2717] shadow-xs space-y-4">
        {/* Chart Header & Metric Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E6D8] dark:border-[#333D29]">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Financial & Patient Volume Timeline
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-0.5">
              {period === 'daily' && 'Hourly breakdown across today’s shifts (08:00 to 20:00)'}
              {period === 'weekly' && 'Day-by-day revenue & patient progression for the past 7 days'}
              {period === 'monthly' && 'Aggregated 5-day intervals across the past 30 days'}
              {period === 'yearly' && 'Month-by-month annual billing & patient flow'}
            </p>
          </div>

          {/* Metric Selector Switch */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 dark:bg-[#151D10] border border-[#D8DEC9] dark:border-[#2C3822] text-xs">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartMetric('patients')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  chartMetric === 'patients'
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Patients
              </button>
              <button
                onClick={() => setChartMetric('both')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  chartMetric === 'both'
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Both
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas with Dual Y-Axis and Grid */}
        <div className="relative">
          {/* Main Visualization Canvas */}
          <div className="flex items-stretch h-56 sm:h-64 gap-2.5">
            {/* Left Y-Axis Scale (Revenue in PKR) */}
            <div className="flex flex-col justify-between text-right text-[10px] font-mono font-bold text-slate-400 dark:text-[#A4AC86] pr-2 shrink-0 select-none pb-7">
              {yTicksRevenue.map((val, idx) => (
                <span key={idx}>
                  {val >= 1000 ? `Rs. ${(val / 1000).toFixed(0)}k` : `Rs. ${val}`}
                </span>
              ))}
            </div>

            {/* Grid & Bars Container */}
            <div className="flex-1 relative flex flex-col justify-between">
              {/* Horizontal Background Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                <div className="border-b border-slate-200/80 dark:border-[#2F3B25] w-full" />
                <div className="border-b border-dashed border-slate-200/60 dark:border-[#2F3B25] w-full" />
                <div className="border-b border-dashed border-slate-200/60 dark:border-[#2F3B25] w-full" />
                <div className="border-b border-dashed border-slate-200/60 dark:border-[#2F3B25] w-full" />
                <div className="border-b border-slate-300 dark:border-[#38462C] w-full" />
              </div>

              {/* Vertical Bars Flex Columns */}
              <div className="relative z-10 flex-1 flex items-end justify-between gap-1.5 sm:gap-2.5 px-2 pb-7">
                {timeSeriesList.map((item: any, idx: number) => {
                  const revHeight = maxRevenue > 0 ? Math.max(0, Math.round((item.revenue / maxRevenue) * 100)) : 0;
                  const patHeight = maxPatients > 0 ? Math.max(0, Math.round((item.patients / maxPatients) * 100)) : 0;
                  const isHovered = hoveredBarIndex === idx;
                  const hasData = item.revenue > 0 || item.patients > 0;

                  return (
                    <div
                      key={item.key || idx}
                      className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Floating Tooltip Card */}
                      {isHovered && (
                        <div className="absolute -top-16 z-30 px-3 py-2 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-800 dark:border-slate-200 whitespace-nowrap animate-fade-in pointer-events-none font-mono text-[11px]">
                          <div className="font-extrabold text-xs text-emerald-400 dark:text-emerald-700">{item.label}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span>Rs. {item.revenue.toLocaleString()} PKR</span>
                            <span>•</span>
                            <span>{item.patients} pts ({item.appointments} apts)</span>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950 dark:border-t-white" />
                        </div>
                      )}

                      {/* Top Metric Indicator Pill */}
                      {hasData && (
                        <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] font-black text-emerald-700 dark:text-[#74C69D]">
                          {chartMetric !== 'patients' && item.revenue > 0 && (
                            <span className="px-1 py-0.2 rounded bg-white/90 dark:bg-[#151D10] border border-emerald-200 dark:border-[#38462C] shadow-xs text-[9px]">
                              Rs. {(item.revenue / 1000).toFixed(item.revenue >= 10000 ? 0 : 1)}k
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pillar Representation */}
                      {hasData ? (
                        <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                          {/* Revenue Bar */}
                          {(chartMetric === 'revenue' || chartMetric === 'both') && (
                            <div
                              style={{ height: `${Math.max(8, revHeight)}%` }}
                              className={`w-full rounded-t-lg transition-all duration-200 relative shadow-xs ${
                                isHovered
                                  ? 'bg-gradient-to-t from-[#1B4332] to-[#52B788] ring-2 ring-emerald-400 scale-y-105 origin-bottom'
                                  : 'bg-gradient-to-t from-[#2D6A4F] to-[#40916C] dark:from-[#1E3B2C] dark:to-[#52B788]'
                              }`}
                            >
                              <div className="w-full h-0.5 bg-emerald-200/50 rounded-t-lg" />
                            </div>
                          )}

                          {/* Patient Bar (if Combined or Patients) */}
                          {chartMetric === 'patients' && (
                            <div
                              style={{ height: `${Math.max(8, patHeight)}%` }}
                              className={`w-full rounded-t-lg transition-all duration-200 relative shadow-xs ${
                                isHovered
                                  ? 'bg-gradient-to-t from-sky-700 to-sky-400 ring-2 ring-sky-300 scale-y-105 origin-bottom'
                                  : 'bg-gradient-to-t from-sky-600 to-sky-400'
                              }`}
                            >
                              <div className="w-full h-0.5 bg-sky-200/50 rounded-t-lg" />
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Zero-data slot indicator */
                        <div className="w-full max-w-[20px] h-1.5 rounded-full bg-slate-200/60 dark:bg-[#25301D] my-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels Row */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 px-2 pt-2 border-t border-slate-300 dark:border-[#38462C]">
                {timeSeriesList.map((item: any, idx: number) => (
                  <div
                    key={item.key || idx}
                    className="flex-1 text-center font-mono font-bold text-[10px] text-slate-600 dark:text-[#D7DBC7] truncate"
                    title={item.label}
                  >
                    {item.label.replace(' AM', 'a').replace(' PM', 'p')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN BREAKDOWN GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-4.5">
        {/* Column 1: Clinical Department Revenue */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF7] dark:bg-[#1E2717] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E6D8] dark:border-[#333D29]">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Revenue by Clinical Department
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-[#74C69D]">
              Rs. {data?.summary?.totalRevenue ? data.summary.totalRevenue.toLocaleString() : '0'} Total
            </span>
          </div>

          <div className="space-y-3">
            {data?.categoryBreakdown?.map((cat: any) => {
              const categoryGradients: Record<string, string> = {
                CONSULTATION: 'from-[#2D6A4F] to-[#52B788]',
                PROCEDURE: 'from-sky-600 to-teal-400',
                LAB_TEST: 'from-purple-600 to-indigo-400',
                PHARMACY: 'from-amber-600 to-yellow-400',
                EMERGENCY: 'from-rose-600 to-orange-400'
              };
              const gradient = categoryGradients[cat.category] || 'from-[#2D6A4F] to-[#52B788]';

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-white truncate">{cat.label}</span>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-slate-500 dark:text-[#A4AC86] text-[10px]">{cat.count} tx</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Rs. {cat.revenue.toLocaleString()}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 dark:bg-[#2D3923] text-emerald-800 dark:text-[#74C69D]">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-[#141B10] overflow-hidden p-0.2 border border-[#E2E6D8] dark:border-[#333D29]">
                    <div
                      style={{ width: `${Math.max(3, cat.percentage)}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-300`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Payment Channels Distribution */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF7] dark:bg-[#1E2717] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E6D8] dark:border-[#333D29]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Payment Channel Distribution
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#A4AC86]">
              6 Streams
            </span>
          </div>

          <div className="space-y-3">
            {data?.paymentMethodBreakdown?.map((m: any) => {
              const methodGradients: Record<string, string> = {
                CASH: 'from-emerald-600 to-teal-400',
                CARD: 'from-blue-600 to-cyan-400',
                JAZZCASH: 'from-amber-600 to-yellow-400',
                EASYPAISA: 'from-teal-600 to-emerald-400',
                BANK_TRANSFER: 'from-indigo-600 to-purple-400',
                INSURANCE: 'from-violet-600 to-pink-400'
              };
              const gradient = methodGradients[m.method] || 'from-emerald-600 to-teal-400';

              return (
                <div key={m.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-white truncate">{m.label}</span>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-slate-500 dark:text-[#A4AC86] text-[10px]">{m.count} tx</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Rs. {m.revenue.toLocaleString()}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-200 dark:bg-[#2D3923] text-slate-800 dark:text-[#D7DBC7]">
                        {m.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-[#141B10] overflow-hidden p-0.2 border border-[#E2E6D8] dark:border-[#333D29]">
                    <div
                      style={{ width: `${Math.max(3, m.percentage)}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-300`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. ATTENDING PHYSICIANS PRODUCTIVITY MATRIX */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF7] dark:bg-[#1E2717] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E6D8] dark:border-[#333D29]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Physician Consultation & Billing Productivity
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-[#A4AC86] font-mono">
            {data?.doctorPerformance?.length || 0} Specialists
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {data?.doctorPerformance?.map((doc: any) => (
            <div
              key={doc.doctorId}
              className="p-3.5 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-white dark:bg-[#151D10] flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-[#1E3326] border border-emerald-300 dark:border-[#2D6A4F] flex items-center justify-center font-black text-xs text-emerald-800 dark:text-[#74C69D] shrink-0">
                  {doc.doctorName.replace('Dr. ', '').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{doc.doctorName}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A4AC86] truncate">{doc.specialization}</p>
                </div>
              </div>

              <div className="text-right font-mono shrink-0">
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  Rs. {doc.revenue.toLocaleString()}
                </div>
                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-50 dark:bg-[#2D3923] text-emerald-800 dark:text-[#74C69D] border border-emerald-200 dark:border-[#406343]">
                  {doc.patientCount} Pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. PERIOD AUDIT LEDGER TABLE */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#E2E6D8] dark:border-[#333D29] bg-[#FAFBF7] dark:bg-[#1E2717] shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#E2E6D8] dark:border-[#333D29]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Period Audit Ledger ({filteredTransactions.length} Invoices)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A4AC86]">
                Itemized transaction records for {data?.dateRange?.formattedLabel || period}
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter invoice, patient..."
              value={searchTxQuery}
              onChange={(e) => setSearchTxQuery(e.target.value)}
              className="w-full clinical-input text-xs py-1.5 pl-8 pr-7"
            />
            {searchTxQuery && (
              <button
                onClick={() => setSearchTxQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E6D8] dark:border-[#333D29] text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#A4AC86] bg-slate-100/60 dark:bg-[#151D10]">
                <th className="py-2.5 px-3 rounded-l-lg">Invoice #</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Patient Details</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3 text-right">Settled Amount</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6D8]/60 dark:divide-[#333D29]/60 font-mono">
              {filteredTransactions.slice(0, 30).map((tx: any) => (
                <tr
                  key={tx.id}
                  className="hover:bg-white dark:hover:bg-[#25321D] transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {tx.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-[#A4AC86] whitespace-nowrap font-sans text-[11px]">
                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-white whitespace-nowrap">
                    <div>{tx.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{tx.doctorName}</div>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#2D3923] text-slate-700 dark:text-[#D7DBC7] border border-slate-200 dark:border-[#414833]">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-[#A4AC86] text-[11px]">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap text-xs">
                    Rs. {tx.amountPaid.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <StatusBadge status={tx.status} size="sm" />
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans text-xs">
                    No matching invoices found for this reporting interval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalyticsDashboard;
