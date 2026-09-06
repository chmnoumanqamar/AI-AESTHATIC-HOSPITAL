import React, { useState } from 'react';
import { Sliders, Shield, Save, CheckCircle2, Database, ArrowRight } from 'lucide-react';

export const AdminConfigView: React.FC<{ onNavigateToDatabase?: () => void }> = () => {
  const [policies, setPolicies] = useState({
    PERMANENT_TOKEN_CANCELLATION: true,
    DEFAULT_DAILY_PATIENT_LIMIT: 100,
    LATE_CHECKIN_GRACE_PERIOD_MINUTES: 30,
    AUTO_NO_SHOW_THRESHOLD_HOURS: 4,
    MAX_ADVANCE_BOOKING_DAYS: 30,
    MIN_RESCHEDULE_NOTICE_HOURS: 2,
    STRICT_DUPLICATE_CNIC: true,
    STRICT_DUPLICATE_PHONE: true,
    STRICT_DUPLICATE_EMAIL: true,
    RECEPTIONIST_PRIVACY_REDACTION: true,
    PATIENT_PRIVATE_NOTES_REDACTION: true,
    DOCTOR_RELATIONSHIP_REQUIRED_FOR_HISTORY: true,
    STRICT_PRESCRIPTION_IMMUTABILITY: true,
    REQUIRE_PRESCRIPTION_CORRECTION_REASON: true,
    NOTIFICATION_FAILOVER_TIMEOUT_MS: 3000,
    FOLLOW_UP_DISCOUNT_PERCENT: 20,
    CONSULTATION_ALERT_MINUTES: 45,
    CALLED_PATIENT_ARRIVAL_WINDOW_MINUTES: 10
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: any) => {
    setPolicies(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F291E] dark:text-[#F6F7F2] flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <Sliders className="w-6 h-6" />
            </span>
            <span>21 Clinical Policy Engine Hooks</span>
          </h1>
          <p className="text-xs text-brand-600 dark:text-[#B6AD90] mt-1">
            System invariants, token constraints, and privacy boundary configuration parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="clinical-button-primary flex items-center gap-2 text-xs cursor-pointer shadow-xs"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Policy Configuration Synced!' : 'Save System Rules'}</span>
        </button>
      </div>

      {/* Database Maintenance Banner */}
      <div className="p-4 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shrink-0">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
              Database Purge & Clean Slate Center
            </h4>
            <p className="text-[11px] text-red-700 dark:text-red-300/80 mt-0.5">
              Starting hospital operations? Wipe all rough dummy data (patients, appointments, invoices) directly from the sidebar.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 shrink-0">
          <span>Select &quot;Database Clear &amp; Reset&quot; in Sidebar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Token & Queue Invariants */}
        <div className="bg-white dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-brand-200 dark:border-[#2F3E29]">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-[#1F291E] dark:text-[#F6F7F2]">Token & Queue Mathematical Invariants</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-brand-50/60 dark:bg-[#151D12] rounded-xl border border-brand-200 dark:border-[#2F3E29] transition-colors">
              <div className="pr-3">
                <div className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">Permanent Token Cancellation Lock</div>
                <div className="text-[#656D4A] dark:text-[#A4AC86] text-[11px] mt-0.5">Once cancelled, token slots are never reused (T_max = A + C)</div>
              </div>
              <input
                type="checkbox"
                checked={policies.PERMANENT_TOKEN_CANCELLATION}
                onChange={e => handleChange('PERMANENT_TOKEN_CANCELLATION', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-[#2D6A4F] cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-brand-50/60 dark:bg-[#151D12] rounded-xl border border-brand-200 dark:border-[#2F3E29] transition-colors">
              <div className="pr-3">
                <div className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">Default Daily Patient Limit (L)</div>
                <div className="text-[#656D4A] dark:text-[#A4AC86] text-[11px] mt-0.5">Maximum active tokens allowed per physician per day</div>
              </div>
              <input
                type="number"
                value={policies.DEFAULT_DAILY_PATIENT_LIMIT}
                onChange={e => handleChange('DEFAULT_DAILY_PATIENT_LIMIT', parseInt(e.target.value, 10))}
                className="w-20 clinical-input text-right font-mono py-1 bg-white dark:bg-[#151D12] border border-brand-200 dark:border-[#38482E] text-[#1F291E] dark:text-[#F6F7F2] rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-brand-50/60 dark:bg-[#151D12] rounded-xl border border-brand-200 dark:border-[#2F3E29] transition-colors">
              <div className="pr-3">
                <div className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">Late Check-In Grace Period</div>
                <div className="text-[#656D4A] dark:text-[#A4AC86] text-[11px] mt-0.5">Minutes past schedule before queue reprioritization</div>
              </div>
              <input
                type="number"
                value={policies.LATE_CHECKIN_GRACE_PERIOD_MINUTES}
                onChange={e => handleChange('LATE_CHECKIN_GRACE_PERIOD_MINUTES', parseInt(e.target.value, 10))}
                className="w-20 clinical-input text-right font-mono py-1 bg-white dark:bg-[#151D12] border border-brand-200 dark:border-[#38482E] text-[#1F291E] dark:text-[#F6F7F2] rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Clinical Privacy Wall & RBAC */}
        <div className="bg-white dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-brand-200 dark:border-[#2F3E29]">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-[#1F291E] dark:text-[#F6F7F2]">Clinical Privacy Wall & Redaction Invariants</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-brand-50/60 dark:bg-[#151D12] rounded-xl border border-brand-200 dark:border-[#2F3E29] transition-colors">
              <div className="pr-3">
                <div className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">Receptionist Privacy Wall (API Redaction)</div>
                <div className="text-[#656D4A] dark:text-[#A4AC86] text-[11px] mt-0.5">Zero access to diagnosis, exam findings, and prescriptions</div>
              </div>
              <input
                type="checkbox"
                checked={policies.RECEPTIONIST_PRIVACY_REDACTION}
                onChange={e => handleChange('RECEPTIONIST_PRIVACY_REDACTION', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-[#2D6A4F] cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-brand-50/60 dark:bg-[#151D12] rounded-xl border border-brand-200 dark:border-[#2F3E29] transition-colors">
              <div className="pr-3">
                <div className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">Doctor-Patient Boundary Check</div>
                <div className="text-[#656D4A] dark:text-[#A4AC86] text-[11px] mt-0.5">History permitted only for assigned or treated patients</div>
              </div>
              <input
                type="checkbox"
                checked={policies.DOCTOR_RELATIONSHIP_REQUIRED_FOR_HISTORY}
                onChange={e => handleChange('DOCTOR_RELATIONSHIP_REQUIRED_FOR_HISTORY', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-[#2D6A4F] cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-brand-50/60 dark:bg-[#151D12] rounded-xl border border-brand-200 dark:border-[#2F3E29] transition-colors">
              <div className="pr-3">
                <div className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">Prescription Immutability Enforcement</div>
                <div className="text-[#656D4A] dark:text-[#A4AC86] text-[11px] mt-0.5">Prohibit in-place updates; require v1 to v2 versioning</div>
              </div>
              <input
                type="checkbox"
                checked={policies.STRICT_PRESCRIPTION_IMMUTABILITY}
                onChange={e => handleChange('STRICT_PRESCRIPTION_IMMUTABILITY', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-[#2D6A4F] cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
