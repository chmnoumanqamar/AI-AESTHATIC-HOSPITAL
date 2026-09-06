import React, { useState } from 'react';
import { X, UserPlus, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface RapidRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPatient: any) => void;
}

export const RapidRegistrationModal: React.FC<RapidRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [hasWhatsApp, setHasWhatsApp] = useState(true);
  const [primaryNotificationChannel, setPrimaryNotificationChannel] = useState('WhatsApp');

  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    matchType?: string;
    maskedPhone?: string;
    maskedCnic?: string;
    message?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Real-time debounce duplicate check on CNIC or Phone blur
  const handleCheckDuplicate = async () => {
    if (!cnic && !phone && !email) return;
    try {
      const res = await api.post('/patients/check-duplicate', { cnic, phone, email });
      if (res.data.data.isDuplicate) {
        setDuplicateWarning(res.data.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateWarning?.isDuplicate) {
      alert('Registration Blocked: Duplicate patient record detected.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        fullName,
        phone,
        email: email || undefined,
        password: 'Password123!',
        cnic,
        gender,
        dateOfBirth,
        address,
        emergencyContact,
        hasWhatsApp,
        primaryNotificationChannel,
        backupNotificationChannel: primaryNotificationChannel === 'WhatsApp' ? 'SMS' : 'Email'
      });
      onSuccess(res.data.data.user.profile);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white border border-brand-300 rounded-lg shadow-modal-pop overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-300 bg-brand-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-900" />
            <h3 className="operational-sub-header">Rapid Patient Registration Deck</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-brand-600 hover:text-brand-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Duplicate Detection Alert Banner */}
          {duplicateWarning?.isDuplicate && (
            <div className="bg-red-50 border border-red-300 p-3.5 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-semantic-emergency mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-red-900 uppercase tracking-wider">
                  DUPLICATE RECORD DETECTED ({duplicateWarning.matchType})
                </span>
                <p className="text-red-800 leading-relaxed">
                  {duplicateWarning.message} Existing Masked Contact: {duplicateWarning.maskedPhone} • CNIC: {duplicateWarning.maskedCnic}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="operational-metadata-tag block mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full clinical-input"
              />
            </div>

            <div>
              <label className="operational-metadata-tag block mb-1">CNIC / National ID *</label>
              <input
                type="text"
                required
                value={cnic}
                onBlur={handleCheckDuplicate}
                onChange={e => setCnic(e.target.value)}
                placeholder="35201-XXXXXXX-X"
                className="w-full clinical-input font-mono"
              />
            </div>

            <div>
              <label className="operational-metadata-tag block mb-1">Primary Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onBlur={handleCheckDuplicate}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full clinical-input font-mono"
              />
            </div>

            <div>
              <label className="operational-metadata-tag block mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onBlur={handleCheckDuplicate}
                onChange={e => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full clinical-input"
              />
            </div>

            <div>
              <label className="operational-metadata-tag block mb-1">Gender *</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full clinical-input"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="operational-metadata-tag block mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full clinical-input"
              />
            </div>
          </div>

          <div>
            <label className="operational-metadata-tag block mb-1">Residential Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street address, Sector / Suite, City"
              className="w-full clinical-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="operational-metadata-tag block mb-1">Emergency Contact Phone *</label>
              <input
                type="tel"
                required
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                placeholder="+1 555 999 0000"
                className="w-full clinical-input font-mono"
              />
            </div>

            <div>
              <label className="operational-metadata-tag block mb-1">Primary Notification Channel</label>
              <select
                value={primaryNotificationChannel}
                onChange={e => setPrimaryNotificationChannel(e.target.value)}
                className="w-full clinical-input"
              >
                <option value="WhatsApp">WhatsApp (Instant Messaging)</option>
                <option value="SMS">SMS (Cellular Text)</option>
                <option value="Email">Email (Secure Inbox)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="hasWhatsAppCheck"
              checked={hasWhatsApp}
              onChange={e => setHasWhatsApp(e.target.checked)}
              className="rounded border-brand-300 text-brand-900 focus:ring-brand-900"
            />
            <label htmlFor="hasWhatsAppCheck" className="text-xs text-brand-900 font-medium cursor-pointer">
              Patient primary phone is active on WhatsApp (Tracked independently)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-300">
            <button
              type="button"
              onClick={onClose}
              className="clinical-button-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(duplicateWarning?.isDuplicate)}
              className="clinical-button-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Creating Record...' : 'Complete Registration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
