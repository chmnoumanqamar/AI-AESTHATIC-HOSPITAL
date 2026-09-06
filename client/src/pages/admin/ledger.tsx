import React from 'react';
import { FrontDeskBillingPOS } from '../../components/receptionist/FrontDeskBillingPOS';
import { CreditCard, ShieldCheck } from 'lucide-react';

export const AdminHospitalLedger: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F291E] dark:text-[#F6F7F2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <CreditCard className="w-6 h-6" />
              </span>
              <span>Hospital Financial Ledger & POS Oversight</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Executive View</span>
            </span>
          </div>
          <p className="text-xs text-brand-600 dark:text-[#B6AD90] mt-1">
            Real-time executive ledger of front-desk collections, cash & card reconciliations, outstanding patient dues, and itemized billing journal.
          </p>
        </div>
      </div>

      {/* Embedded POS Ledger */}
      <FrontDeskBillingPOS />
    </div>
  );
};
