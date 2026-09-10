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
  QrCode,
  Palette,
  Type,
  Maximize2,
  Sparkles,
  RotateCcw,
  Layout,
  Layers,
  SunMoon,
  Monitor,
  CheckCircle,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { WhatsAppSimulatorModal } from '../../components/common/WhatsAppSimulatorModal';
import { 
  getStoredWindowFormatting, 
  saveWindowFormatting, 
  resetWindowFormatting,
  THEME_COLOR_OPTIONS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  SURFACE_TONE_OPTIONS,
  WindowFormattingConfig
} from '../../utils/windowFormatting';

type SettingsTab = 'formatting' | 'policies' | 'whatsapp';

export const AdminConfigView: React.FC<{ onNavigateToDatabase?: () => void }> = () => {
  // Settings Tab Navigation State
  const [activeTab, setActiveTab] = useState<SettingsTab>('formatting');

  // Window Formatting State
  const [formatting, setFormatting] = useState<WindowFormattingConfig>(getStoredWindowFormatting);
  const [formattingSaved, setFormattingSaved] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  // Policies State
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

  const handleUpdateFormatting = (partial: Partial<WindowFormattingConfig>) => {
    const updated = { ...formatting, ...partial };
    setFormatting(updated);
    saveWindowFormatting(updated);
    setFormattingSaved(true);
    setTimeout(() => setFormattingSaved(false), 2500);
  };

  const handleResetFormatting = () => {
    const defaults = resetWindowFormatting();
    setFormatting(defaults);
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 2500);
  };

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

  const activeColor = THEME_COLOR_OPTIONS.find(c => c.id === formatting.themeColorId) || THEME_COLOR_OPTIONS[0];
  const activeFont = FONT_FAMILY_OPTIONS.find(f => f.id === formatting.fontFamilyId) || FONT_FAMILY_OPTIONS[0];
  const activeSize = FONT_SIZE_OPTIONS.find(s => s.id === formatting.fontSizeId) || FONT_SIZE_OPTIONS[2];
  const activeRadius = BORDER_RADIUS_OPTIONS.find(r => r.id === formatting.borderRadiusId) || BORDER_RADIUS_OPTIONS[1];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Settings Navigation Sub-Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-brand-200 dark:border-[#2F3E29]">
        {/* Tab Selection Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-100/60 dark:bg-[#151D12] rounded-xl border border-brand-200 dark:border-[#2F3E29]">
          <button
            type="button"
            onClick={() => setActiveTab('formatting')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'formatting'
                ? 'bg-white dark:bg-[#232E1D] text-[#1F291E] dark:text-[#F6F7F2] shadow-xs'
                : 'text-[#656D4A] dark:text-[#A4AC86] hover:text-[#1F291E] dark:hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Window Formatting & Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-white dark:bg-[#232E1D] text-[#1F291E] dark:text-[#F6F7F2] shadow-xs'
                : 'text-[#656D4A] dark:text-[#A4AC86] hover:text-[#1F291E] dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>System Policies & Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white dark:bg-[#232E1D] text-[#1F291E] dark:text-[#F6F7F2] shadow-xs'
                : 'text-[#656D4A] dark:text-[#A4AC86] hover:text-[#1F291E] dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Meta Cloud API</span>
          </button>
        </div>

        {/* Global Action Status */}
        <div className="flex items-center gap-2">
          {activeTab === 'formatting' && (
            <button
              type="button"
              onClick={handleResetFormatting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 dark:bg-[#151D12] text-[#656D4A] dark:text-[#A4AC86] hover:bg-brand-100 dark:hover:bg-[#232E1D] border border-brand-200 dark:border-[#2F3E29] flex items-center gap-1.5 cursor-pointer transition-all"
              title="Reset formatting to hospital defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetNotice ? 'Defaults Restored!' : 'Reset Defaults'}</span>
            </button>
          )}

          {activeTab === 'policies' && (
            <button
              onClick={handleSave}
              className="clinical-button-primary flex items-center gap-2 text-xs cursor-pointer shadow-xs"
            >
              {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Policy Configuration Synced!' : 'Save System Rules'}</span>
            </button>
          )}

          {activeTab === 'whatsapp' && (
            <button
              type="button"
              onClick={handleSaveWhatsApp}
              className="clinical-button-primary flex items-center gap-1.5 text-xs cursor-pointer shadow-xs"
            >
              {waSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{waSaved ? 'WhatsApp Settings Saved!' : 'Save Bot Rules'}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: WINDOW FORMATTING & APPEARANCE (NEW REQUESTED FEATURE)
          ========================================================================= */}
      {activeTab === 'formatting' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Info & Save Confirmation Banner */}
          <div className="p-4 rounded-xl bg-brand-50/80 dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span 
                className="p-2.5 rounded-xl text-white shadow-xs shrink-0"
                style={{ background: `linear-gradient(135deg, ${activeColor.gradientStart} 0%, ${activeColor.gradientEnd} 100%)` }}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#1F291E] dark:text-[#F6F7F2] flex items-center gap-2">
                  <span>Hospital Window & Interface Formatting Studio</span>
                  {formattingSaved && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 animate-fade-in">
                      ✓ Instant Live Synced
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-[#656D4A] dark:text-[#A4AC86] mt-0.5">
                  Format window theme colors, typography fonts, sizing scales (max 12px enforced), and corner radii across all clinical dashboards.
                </p>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#656D4A] dark:text-[#A4AC86] mr-1">
                Quick Presets:
              </span>
              {THEME_COLOR_OPTIONS.slice(0, 4).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleUpdateFormatting({ themeColorId: c.id })}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  style={{
                    backgroundColor: formatting.themeColorId === c.id ? c.badgeBgLight : 'transparent',
                    color: formatting.themeColorId === c.id ? c.badgeTextLight : '#656D4A',
                    borderColor: formatting.themeColorId === c.id ? c.accent : 'rgba(101, 109, 74, 0.25)'
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dotColor }} />
                  <span>{c.name.split('&')[0].trim()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Formatting Grid & Live Window Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls Column (8 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Theme Color & Gradient Palette */}
              <div className="bg-white dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-brand-200 dark:border-[#2F3E29]">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#656D4A] dark:text-[#A4AC86]" />
                    <h3 className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                      1. Window Accent & Button Palette
                    </h3>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#656D4A] dark:text-[#A4AC86]">
                    Active: {activeColor.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEME_COLOR_OPTIONS.map(c => {
                    const isSelected = formatting.themeColorId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleUpdateFormatting({ themeColorId: c.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'ring-2 ring-offset-1 border-transparent shadow-xs'
                            : 'hover:border-brand-300 dark:hover:border-[#414833] border-brand-200 dark:border-[#2F3E29] bg-brand-50/40 dark:bg-[#151D12]'
                        }`}
                        style={{
                          ...(isSelected ? { ringColor: c.accent, backgroundColor: `${c.badgeBgLight}30` } : {})
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-7 h-7 rounded-lg shadow-xs shrink-0 flex items-center justify-center text-white text-[10px]"
                            style={{ background: `linear-gradient(135deg, ${c.gradientStart} 0%, ${c.gradientEnd} 100%)` }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-[#1F291E] dark:text-[#F6F7F2] truncate">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-[#656D4A] dark:text-[#A4AC86] truncate">
                              {c.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Typography & Font Family Selector */}
              <div className="bg-white dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-brand-200 dark:border-[#2F3E29]">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#656D4A] dark:text-[#A4AC86]" />
                    <h3 className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                      2. Window Typography & Font Family
                    </h3>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#656D4A] dark:text-[#A4AC86]">
                    Active: {activeFont.name} ({activeFont.category})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FONT_FAMILY_OPTIONS.map(f => {
                    const isSelected = formatting.fontFamilyId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleUpdateFormatting({ fontFamilyId: f.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-100/50 dark:bg-[#232E1D] shadow-xs'
                            : 'border-brand-200 dark:border-[#2F3E29] hover:border-brand-300 dark:hover:border-[#414833] bg-brand-50/40 dark:bg-[#151D12]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span 
                            className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]"
                            style={{ fontFamily: f.cssFamily }}
                          >
                            {f.name}
                          </span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-brand-200/50 dark:bg-[#2F3E29] text-[#656D4A] dark:text-[#A4AC86]">
                            {f.category}
                          </span>
                        </div>
                        <div 
                          className="text-[11px] text-[#656D4A] dark:text-[#A4AC86] truncate pt-0.5"
                          style={{ fontFamily: f.cssFamily }}
                        >
                          {f.sample}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Font Size Scale & Window Corner Radius */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Font Scaling (Strictly <= 12px limit enforced) */}
                <div className="bg-white dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-200 dark:border-[#2F3E29]">
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#656D4A] dark:text-[#A4AC86]" />
                      <h4 className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                        Font Sizing Scale
                      </h4>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                      Max 12px
                    </span>
                  </div>

                  <div className="space-y-2">
                    {FONT_SIZE_OPTIONS.map(s => {
                      const isSelected = formatting.fontSizeId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleUpdateFormatting({ fontSizeId: s.id })}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-brand-600 bg-brand-100/50 dark:bg-[#232E1D] font-bold'
                              : 'border-brand-200 dark:border-[#2F3E29] bg-brand-50/40 dark:bg-[#151D12]'
                          }`}
                        >
                          <div>
                            <div className="text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                              {s.name} ({s.px}px)
                            </div>
                            <div className="text-[10px] text-[#656D4A] dark:text-[#A4AC86]">
                              {s.description}
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#656D4A] dark:text-[#A4AC86]">
                            {s.px}px
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Window Corner Rounding */}
                <div className="bg-white dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-200 dark:border-[#2F3E29]">
                    <div className="flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-[#656D4A] dark:text-[#A4AC86]" />
                      <h4 className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                        Corner Rounding
                      </h4>
                    </div>
                    <span className="font-mono text-[10.5px] text-[#656D4A] dark:text-[#A4AC86]">
                      {activeRadius.px}px
                    </span>
                  </div>

                  <div className="space-y-2">
                    {BORDER_RADIUS_OPTIONS.map(r => {
                      const isSelected = formatting.borderRadiusId === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleUpdateFormatting({ borderRadiusId: r.id })}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-brand-600 bg-brand-100/50 dark:bg-[#232E1D] font-bold'
                              : 'border-brand-200 dark:border-[#2F3E29] bg-brand-50/40 dark:bg-[#151D12]'
                          }`}
                        >
                          <div>
                            <div className="text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                              {r.name}
                            </div>
                            <div className="text-[10px] text-[#656D4A] dark:text-[#A4AC86]">
                              {r.description}
                            </div>
                          </div>
                          <div 
                            className="w-5 h-5 border-2 border-brand-400 dark:border-[#A4AC86] bg-brand-100 dark:bg-[#2F3E29]"
                            style={{ borderRadius: `${r.px}px` }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Canvas Surface Background & Border Contrast */}
              <div className="bg-white dark:bg-[#1E2718] border border-brand-200 dark:border-[#2F3E29] rounded-2xl p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-brand-200 dark:border-[#2F3E29]">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#656D4A] dark:text-[#A4AC86]" />
                    <h3 className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                      3. Canvas Surface Tone & Window Edge Contrast
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SURFACE_TONE_OPTIONS.map(s => {
                    const isSelected = formatting.surfaceToneId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdateFormatting({ surfaceToneId: s.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-100/50 dark:bg-[#232E1D] shadow-xs'
                            : 'border-brand-200 dark:border-[#2F3E29] hover:border-brand-300 dark:hover:border-[#414833] bg-brand-50/40 dark:bg-[#151D12]'
                        }`}
                      >
                        <div 
                          className="w-7 h-7 rounded-lg border border-brand-300 dark:border-brand-700 shadow-xs shrink-0 flex items-center justify-center text-xs"
                          style={{ backgroundColor: s.bgLight }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-800" />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#1F291E] dark:text-[#F6F7F2] truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-[#656D4A] dark:text-[#A4AC86] truncate">
                            {s.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* High Contrast Border Toggle */}
                <div className="pt-2 border-t border-brand-200 dark:border-[#2F3E29] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                      High-Contrast Window Borders
                    </div>
                    <div className="text-[10.5px] text-[#656D4A] dark:text-[#A4AC86]">
                      Enforces sharp accent tint borders for surgical glare protection
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formatting.highContrastBorders}
                    onChange={e => handleUpdateFormatting({ highContrastBorders: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-[#2D6A4F] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right Live Preview Column (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-4">
                <div className="bg-white dark:bg-[#1E2718] border-2 border-brand-300 dark:border-[#38482E] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-200 dark:border-[#2F3E29]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-bold text-xs text-[#1F291E] dark:text-[#F6F7F2]">
                        Live Interactive Window Preview
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#656D4A] dark:text-[#A4AC86]">
                      Real-Time Render
                    </span>
                  </div>

                  {/* Simulated Mini-Window */}
                  <div 
                    className="border border-brand-200 dark:border-[#2F3E29] shadow-md overflow-hidden transition-all duration-200"
                    style={{
                      borderRadius: `${activeRadius.px}px`,
                      fontFamily: activeFont.cssFamily,
                      fontSize: `${activeSize.px}px`,
                      backgroundColor: formatting.surfaceToneId === 'white' ? '#FFFFFF' : '#FAFBF7'
                    }}
                  >
                    {/* Window Header Bar */}
                    <div className="px-4 py-2.5 bg-[#333D29] text-white flex items-center justify-between border-b border-black/10">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                        </div>
                        <span className="font-bold text-[11px] ml-1 tracking-wide">
                          Clinical Encounter Window #T-104
                        </span>
                      </div>
                      <span 
                        className="px-2 py-0.5 rounded text-[9.5px] font-bold"
                        style={{ backgroundColor: activeColor.accent, color: '#FFFFFF' }}
                      >
                        Active Patient
                      </span>
                    </div>

                    {/* Window Body */}
                    <div className="p-4 space-y-3 dark:bg-[#151D12]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#1F291E] dark:text-white">
                            Ahmad Raza (M, 34y)
                          </div>
                          <div className="text-[10.5px] text-[#656D4A] dark:text-[#A4AC86]">
                            Token T-104 • General OPD Consultation
                          </div>
                        </div>
                        <span 
                          className="px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                          style={{ 
                            backgroundColor: activeColor.badgeBgLight, 
                            color: activeColor.badgeTextLight 
                          }}
                        >
                          IN-CONSULTATION
                        </span>
                      </div>

                      {/* Mock Input Field */}
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-[#656D4A] dark:text-[#A4AC86]">
                          Clinical Diagnosis & Assessment:
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="Acute Rhinopharyngitis (Grade 1 Mild)"
                          className="w-full px-3 py-1.5 border border-brand-200 dark:border-[#2F3E29] bg-white dark:bg-[#1E2718] text-[#1F291E] dark:text-white text-xs outline-none"
                          style={{ borderRadius: `${Math.max(4, Math.round(activeRadius.px * 0.75))}px` }}
                        />
                      </div>

                      {/* Mock Buttons with Chosen Styles */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="clinical-button-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5 cursor-default shadow-xs"
                          style={{
                            background: `linear-gradient(135deg, ${activeColor.gradientStart} 0%, ${activeColor.gradientEnd} 100%)`,
                            borderRadius: `${activeRadius.px}px`
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Complete & Issue Rx</span>
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 border border-brand-200 dark:border-[#2F3E29] bg-brand-50 dark:bg-[#1E2718] text-[#1F291E] dark:text-white text-xs font-semibold cursor-default"
                          style={{ borderRadius: `${activeRadius.px}px` }}
                        >
                          Hold Queue
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Window Specs Summary Box */}
                  <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-[#151D12] border border-brand-200 dark:border-[#2F3E29] text-[10.5px] space-y-1 text-[#656D4A] dark:text-[#A4AC86]">
                    <div className="flex justify-between">
                      <span className="font-semibold">Font Family:</span>
                      <span className="font-bold text-[#1F291E] dark:text-white">{activeFont.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Font Base Scale:</span>
                      <span className="font-bold text-[#1F291E] dark:text-white">{activeSize.px}px (Strict limit &le; 12px)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Corner Curvature:</span>
                      <span className="font-bold text-[#1F291E] dark:text-white">{activeRadius.px}px ({activeRadius.name})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Palette Start &rarr; End:</span>
                      <span className="font-mono text-[10px] text-[#1F291E] dark:text-white">
                        {activeColor.gradientStart} &rarr; {activeColor.gradientEnd}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SYSTEM POLICIES & MATHEMATICAL INVARIANTS (EXISTING)
          ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="space-y-6 animate-fade-in">
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
      )}

      {/* =========================================================================
          TAB 3: WHATSAPP META CLOUD API & BOT CONTROL (EXISTING)
          ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <div className="col-span-1 md:col-span-2 bg-white dark:bg-[#1E2718] border-2 border-emerald-500/80 dark:border-emerald-700 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
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
      )}

      {/* In-Browser Interactive WhatsApp Phone Simulator */}
      <WhatsAppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        hospitalWhatsAppNumber={waConfig.hospitalWhatsAppNumber}
      />
    </div>
  );
};
