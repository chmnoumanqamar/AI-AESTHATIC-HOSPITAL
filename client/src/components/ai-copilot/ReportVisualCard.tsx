import React from 'react';
import { BarChart3, Download, Printer, DollarSign, Users, Clock, CheckCircle2 } from 'lucide-react';

interface ReportVisualCardProps {
  cardData: {
    period?: string;
    formattedLabel?: string;
    kpis?: {
      totalRevenuePKR: number;
      totalGrossPKR: number;
      collectionRate: number;
      totalPatients: number;
      totalAppointments: number;
      completedConsultations: number;
      avgWaitTimeMins: number;
      avgConsultationMins: number;
    };
    topCategories?: Array<{ category: string; count: number; revenue: number; percentage: number }>;
    recentTransactions?: Array<any>;
  };
  onExportCSV?: () => void;
}

export const ReportVisualCard: React.FC<ReportVisualCardProps> = ({ cardData, onExportCSV }) => {
  const { kpis, formattedLabel = 'Hospital Analytics', topCategories = [], recentTransactions = [] } = cardData;
  if (!kpis) return null;

  const handleDownloadCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    // Generate instant client-side CSV
    const rows = [
      ['Metric', 'Value'],
      ['Report Period', formattedLabel],
      ['Total Net Revenue (PKR)', kpis.totalRevenuePKR],
      ['Total Gross (PKR)', kpis.totalGrossPKR],
      ['Total Patients', kpis.totalPatients],
      ['Total Appointments', kpis.totalAppointments],
      ['Completed Consultations', kpis.completedConsultations],
      ['Average Wait Time (mins)', kpis.avgWaitTimeMins]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hospital_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="my-2.5 p-3.5 rounded-2xl bg-white dark:bg-[#1A2417] border border-emerald-300/80 dark:border-emerald-800/60 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
              {formattedLabel}
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-emerald-400">
              Executive Hospital Analytics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleDownloadCSV}
            className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 dark:bg-[#253320] dark:hover:bg-[#2F4228] text-slate-700 dark:text-emerald-200 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 px-2"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 dark:bg-[#253320] dark:hover:bg-[#2F4228] text-slate-700 dark:text-emerald-200 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 px-2"
            title="Print Report"
          >
            <Printer className="w-3 h-3" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* 4-Grid KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-[#202E1B] border border-emerald-200/60 dark:border-[#31462A]">
          <div className="text-[9.5px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
            Total Revenue
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-100 mt-0.5 font-mono">
            Rs. {kpis.totalRevenuePKR.toLocaleString()}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-teal-50/70 dark:bg-[#202E1B] border border-teal-200/60 dark:border-[#31462A]">
          <div className="text-[9.5px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
            Total Patients
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-teal-950 dark:text-teal-100 mt-0.5 font-mono">
            {kpis.totalPatients}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-[#202E1B] border border-amber-200/60 dark:border-[#31462A]">
          <div className="text-[9.5px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
            Consultations
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-100 mt-0.5 font-mono">
            {kpis.completedConsultations}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-[#202E1B] border border-slate-200 dark:border-[#31462A]">
          <div className="text-[9.5px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
            Avg Wait Time
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-200 mt-0.5 font-mono">
            {kpis.avgWaitTimeMins} min
          </div>
        </div>
      </div>

      {/* Top Categories Breakdown */}
      {topCategories.length > 0 && (
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-emerald-500">
            Revenue by Service Category
          </div>
          <div className="space-y-1">
            {topCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-[#C5CEBC]">
                <span className="truncate max-w-[150px]">{cat.category} ({cat.count})</span>
                <span className="font-mono font-semibold">Rs. {cat.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
