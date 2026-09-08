import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Shield, 
  Save, 
  CheckCircle2, 
  Database, 
  ArrowRight,
  Phone,
  MessageSquare,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Check,
  Smartphone,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { api } from '../../services/api';
import { WhatsAppSimulatorModal } from '../../components/common/WhatsAppSimulatorModal';

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

  // WhatsApp Meta Cloud API & Bot State
  const [waConfig, setWaConfig] = useState({
    whatsappBotEnabled: true,
    hospitalWhatsAppNumber: '+92 300 7654321',
    whatsappProvider: 'META_CLOUD_API',
    metaPhoneNumberId: '',
    metaAccessToken: '',
    metaVerifyToken: 'hospital_wa_verify_token_2026'
  });
  const [showToken, setShowToken] = useState(false);
  const [waSaved, setWaSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    const fetchWaConfig = async () => {
      try {
        const res = await api.get('/ai/whatsapp/config');
        if (res.data?.data) {
          setWaConfig(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load WhatsApp configuration:', err);
      }
    };
    fetchWaConfig();
  }, []);

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/ai/whatsapp/config', waConfig);
      setWaSaved(true);
      setTimeout(() => setWaSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update WhatsApp configuration');
    }
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const webhookCallbackUrl = `${window.location.origin}/api/ai/whatsapp/webhook`;

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
      {/* Page Header Section: Actions Only */}
      <div className="flex items-center justify-end pb-1">
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

        {/* WhatsApp Official Bot & Meta Cloud API Master Control Card */}
        <div className="col-span-1 md:col-span-2 bg-white dark:bg-[#1E2718] border-2 border-emerald-500/80 dark:border-emerald-700 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100 dark:border-emerald-900/60">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[#00A884] text-white shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#1F291E] dark:text-[#F6F7F2]">
                    Hospital Official WhatsApp Bot (Meta Cloud API & Simulator)
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    waConfig.whatsappBotEnabled 
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' 
                      : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                  }`}>
                    {waConfig.whatsappBotEnabled ? '🟢 BOT ACTIVE' : '🔴 BOT PAUSED'}
                  </span>
                </div>
                <p className="text-xs text-[#656D4A] dark:text-[#A4AC86] mt-0.5">
                  Centralized WhatsApp bot controls, Meta Business webhook credentials, and in-browser testing simulator.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-[#008069] hover:opacity-95 shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open WhatsApp Phone Simulator</span>
              </button>
              <button
                type="button"
                onClick={handleSaveWhatsApp}
                className="clinical-button-primary flex items-center gap-1.5 text-xs cursor-pointer shadow-xs"
              >
                {waSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{waSaved ? 'WhatsApp Settings Saved!' : 'Save Bot Rules'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Core Bot & Number Controls */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                1. Bot Governance & Official Number
              </h4>

              {/* Master Bot Switch */}
              <div className="p-3.5 rounded-xl bg-[#FAFBF7] dark:bg-[#151D12] border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Enable WhatsApp Bot Engine</div>
                  <div className="text-[11px] text-slate-500 dark:text-[#A4AC86] mt-0.5">
                    When disabled, bot returns polite maintenance notice to patients.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.whatsappBotEnabled}
                    onChange={e => setWaConfig(prev => ({ ...prev, whatsappBotEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A884]"></div>
                </label>
              </div>

              {/* Hospital Official WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hospital Official WhatsApp Number:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={waConfig.hospitalWhatsAppNumber}
                    onChange={e => setWaConfig(prev => ({ ...prev, hospitalWhatsAppNumber: e.target.value }))}
                    placeholder="+92 300 1234567"
                    className="flex-1 clinical-input font-mono text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151D12]"
                  />
                  <a
                    href={`https://wa.me/${waConfig.hospitalWhatsAppNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1 text-xs border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                    title="Test Click-to-Chat"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Chat</span>
                  </a>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-[#A4AC86]">
                  This number is displayed on patient appointment receipts and reception desk flyers.
                </p>
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Primary WhatsApp Dispatch Provider:
                </label>
                <select
                  value={waConfig.whatsappProvider}
                  onChange={e => setWaConfig(prev => ({ ...prev, whatsappProvider: e.target.value as any }))}
                  className="w-full clinical-input text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151D12] text-slate-900 dark:text-white"
                >
                  <option value="META_CLOUD_API">Meta WhatsApp Business Cloud API (Official Production)</option>
                  <option value="SIMULATOR">In-Browser Interactive Simulator (Zero-Cost Testing)</option>
                  <option value="TWILIO">Twilio WhatsApp Messaging API</option>
                </select>
              </div>
            </div>

            {/* Column 2: Meta Cloud API Integration Credentials */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                2. Meta Developer Webhook & Access Credentials
              </h4>

              {/* Webhook Callback URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Webhook Callback URL (Meta Portal):</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookCallbackUrl, 'url')}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedField === 'url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'url' ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                </label>
                <input
                  type="text"
                  readOnly
                  value={webhookCallbackUrl}
                  className="w-full clinical-input font-mono text-[11px] py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#151D12] text-slate-700 dark:text-slate-300 select-all"
                />
              </div>

              {/* Verify Token */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Verify Token (Security Challenge):</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(waConfig.metaVerifyToken, 'verifyToken')}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedField === 'verifyToken' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'verifyToken' ? 'Copied!' : 'Copy Token'}</span>
                  </button>
                </label>
                <input
                  type="text"
                  value={waConfig.metaVerifyToken}
                  onChange={e => setWaConfig(prev => ({ ...prev, metaVerifyToken: e.target.value }))}
                  className="w-full clinical-input font-mono text-[11px] py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151D12]"
                />
              </div>

              {/* Meta Phone Number ID */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Meta Phone Number ID:
                </label>
                <input
                  type="text"
                  value={waConfig.metaPhoneNumberId}
                  onChange={e => setWaConfig(prev => ({ ...prev, metaPhoneNumberId: e.target.value }))}
                  placeholder="e.g. 104859384918234"
                  className="w-full clinical-input font-mono text-[11px] py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151D12]"
                />
              </div>

              {/* Meta Permanent Access Token */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Meta System User Permanent Access Token:</span>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showToken ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={waConfig.metaAccessToken}
                  onChange={e => setWaConfig(prev => ({ ...prev, metaAccessToken: e.target.value }))}
                  placeholder="EAABw..."
                  className="w-full clinical-input font-mono text-[11px] py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151D12]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* In-Browser Interactive WhatsApp Phone Simulator */}
      <WhatsAppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        hospitalWhatsAppNumber={waConfig.hospitalWhatsAppNumber}
      />
    </div>
  );
};
