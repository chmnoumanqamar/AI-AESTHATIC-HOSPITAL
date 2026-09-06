import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Stethoscope,
  ClipboardList,
  UserPlus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../services/api';

const renderRoleIcon = (roleName: string, className = "w-5 h-5") => {
  switch (roleName?.toLowerCase()) {
    case 'doctor':
      return <Stethoscope className={`${className} text-emerald-600`} />;
    case 'receptionist':
      return <ClipboardList className={`${className} text-amber-600`} />;
    case 'patient':
      return <User className={`${className} text-blue-600`} />;
    case 'admin':
    case 'admin vault':
      return <ShieldCheck className={`${className} text-purple-600`} />;
    default:
      return <User className={className} />;
  }
};

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
  isolatedPort?: string | null;
}

interface RoleInfo {
  email: string;
  name: string;
  role: string;
  title: string;
  icon: string;
  themeColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    gradient: string;
  };
}

const ROLES: Record<string, RoleInfo> = {
  '3001': {
    email: 'dr.aisha@hospital.com',
    name: 'Dr. Aisha Khan',
    role: 'Doctor',
    title: 'Chief Medical Officer & Surgeon',
    icon: '🩺',
    themeColor: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      gradient: 'from-emerald-500 to-teal-600'
    }
  },
  '3002': {
    email: 'receptionist@hospital.com',
    name: 'Sarah Jenkins',
    role: 'Receptionist',
    title: 'Lead Desk & Triage Officer',
    icon: '📋',
    themeColor: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      gradient: 'from-amber-500 to-orange-600'
    }
  },
  '3003': {
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'Patient',
    title: 'Registered Patient Member',
    icon: '👤',
    themeColor: {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      gradient: 'from-sky-500 to-blue-600'
    }
  },
  '3004': {
    email: 'admin@hospital.com',
    name: 'Administrator',
    role: 'Admin Vault',
    title: 'Master System & Security Control',
    icon: '🛡️',
    themeColor: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      gradient: 'from-indigo-600 to-purple-600'
    }
  }
};

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, isolatedPort }) => {
  const currentRoleConfig = isolatedPort ? ROLES[isolatedPort] : null;
  const isPortLocked = Boolean(currentRoleConfig);

  const [identifier, setIdentifier] = useState(
    currentRoleConfig ? currentRoleConfig.email : ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2-Step OTP Reset States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP'>('REQUEST_OTP');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [maskedContact, setMaskedContact] = useState<string>('');
  const [demoOtp, setDemoOtp] = useState<string>('');

  // Sign Up / Registration States
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [signUpRole, setSignUpRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpSpecialization, setSignUpSpecialization] = useState('General Practice & Aesthetics');
  const [signUpGender, setSignUpGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [signUpCnic, setSignUpCnic] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Quick Demo Credentials Accordion
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleQuickFill = (accIdentifier: string, accPass: string = 'Password123!') => {
    setIdentifier(accIdentifier);
    setPassword(accPass);
    setError(null);
  };

  const handleQuickSignIn = async (accIdentifier: string, accPass: string = 'Password123!') => {
    setLoading(true);
    setError(null);
    setIdentifier(accIdentifier);
    setPassword(accPass);
    try {
      const res = await api.post('/auth/login', { identifier: accIdentifier, password: accPass });
      const { token, user } = res.data.data;
      localStorage.setItem('hospital_token', token);
      onLoginSuccess(token, user);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpLoading(true);
    setSignUpError(null);
    try {
      const payload: any = {
        fullName: signUpName.trim(),
        phone: signUpPhone.trim(),
        email: signUpEmail.trim() || undefined,
        password: signUpPassword,
        role: signUpRole
      };
      if (signUpRole === 'DOCTOR') {
        payload.specialization = signUpSpecialization.trim() || 'General Practice & Aesthetics';
      } else {
        payload.gender = signUpGender;
        if (signUpCnic.trim()) {
          payload.cnic = signUpCnic.trim();
        }
      }

      const res = await api.post('/auth/register', payload);
      const { token, user } = res.data.data;
      localStorage.setItem('hospital_token', token);
      onLoginSuccess(token, user);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed. Please check your inputs.';
      setSignUpError(msg);
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { identifier, password });
      const { token, user } = res.data.data;
      localStorage.setItem('hospital_token', token);
      onLoginSuccess(token, user);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Invalid username/email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotIdentifier(identifier);
    setForgotStep('REQUEST_OTP');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError(null);
    setForgotSuccess(null);
    setDemoOtp('');
    setIsForgotMode(true);
  };

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered username or email.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.post('/auth/request-reset-otp', {
        identifier: forgotIdentifier.trim()
      });
      const data = res.data.data;
      setMaskedContact(data.maskedContact || 'registered contact');
      setDemoOtp(data.devOtp || '');
      setOtpCode(data.devOtp || ''); // Auto-fill demo OTP for convenience
      setForgotStep('VERIFY_OTP');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'No registered account found with this username/email.';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      await api.post('/auth/reset-password', {
        identifier: forgotIdentifier.trim(),
        otp: otpCode.trim(),
        newPassword
      });
      setForgotSuccess('Identity verified! Password has been updated successfully.');
      setPassword(newPassword);
      setIdentifier(forgotIdentifier);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Verification failed. Please check the code and try again.';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 selection:bg-[#656D4A] selection:text-white"
      style={{ background: 'linear-gradient(135deg, #333D29 0%, #252E1C 50%, #181F12 100%)' }}
    >
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ backgroundColor: 'rgba(101, 109, 74, 0.15)' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(164, 172, 134, 0.12)' }} />
      <div className="absolute inset-0 bg-[radial-gradient(#414833_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden transition-all z-10">
        <div className="p-7 sm:p-9 space-y-6">

          {/* ================= FORGOT PASSWORD VIEW (SECURE 2-STEP OTP) ================= */}
          {isForgotMode ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 ring-4 ring-slate-100">
                  <ShieldCheck className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Secure Password Recovery
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {forgotStep === 'REQUEST_OTP'
                      ? 'Identity verification required before resetting password'
                      : `Enter the 6-digit verification code sent to ${maskedContact}`}
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {forgotError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{forgotError}</div>
                </div>
              )}

              {/* Success Alert */}
              {forgotSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-sm text-emerald-900">Password Updated!</span>
                  </div>
                  <p className="text-emerald-700">
                    Your password has been securely reset. You can now sign in using your new credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-colors cursor-pointer text-center"
                  >
                    Proceed to Sign In &rarr;
                  </button>
                </div>
              ) : (
                <>
                  {/* STEP 1: Enter Username or Email to send OTP */}
                  {forgotStep === 'REQUEST_OTP' && (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Username or Email
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <input
                            type="text"
                            required
                            value={forgotIdentifier}
                            onChange={e => setForgotIdentifier(e.target.value)}
                            placeholder="Enter username or email"
                            style={{ paddingLeft: '2.75rem' }}
                            className="w-full pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          🔒 A one-time verification code (OTP) will be dispatched to this account's registered contact to prevent unauthorized access.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/15 hover:shadow-xl hover:shadow-slate-900/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                            <span>Sending Verification Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* STEP 2: Enter OTP Code + New Password */}
                  {forgotStep === 'VERIFY_OTP' && (
                    <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                      {/* Security Banner with Demo Code */}
                      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-sky-800">
                            <ShieldCheck className="w-4 h-4 text-sky-600" />
                            Code Sent to {maskedContact}
                          </span>
                          {demoOtp && (
                            <span className="px-2 py-0.5 rounded bg-sky-200/80 font-mono font-bold text-sky-950 text-[11px]">
                              Code: {demoOtp}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-sky-700">
                          Enter the 6-digit code sent to verify ownership before setting a new password.
                        </p>
                      </div>

                      {/* 6-Digit OTP Field */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            6-Digit Verification Code
                          </label>
                          <button
                            type="button"
                            onClick={() => setForgotStep('REQUEST_OTP')}
                            className="text-[11px] font-semibold text-sky-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Resend / Change
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Shield className="w-4 h-4 text-slate-500" />
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            style={{ paddingLeft: '2.75rem' }}
                            className="w-full pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-base font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          New Password
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </div>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 6 characters)"
                            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                            className="w-full py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none transition-colors cursor-pointer"
                            title={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Confirm New Password
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </div>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            style={{ paddingLeft: '2.75rem' }}
                            className="w-full pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm tracking-wider"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/15 hover:shadow-xl hover:shadow-slate-900/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                            <span>Verifying Code & Updating...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Code & Set Password</span>
                            <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Back to sign in button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotMode(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : isSignUpMode ? (

            /* ================= SIGN UP / REGISTRATION VIEW ================= */
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] text-white shadow-lg shadow-emerald-900/20 ring-4 ring-emerald-50">
                  <UserPlus className="w-7 h-7 text-emerald-200" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Create New Account
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Start your journey with Aesthetic Hospital Clinical Deck
                  </p>
                </div>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSignUpRole('PATIENT')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    signUpRole === 'PATIENT'
                      ? 'bg-white text-[#1B4332] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>I am a Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpRole('DOCTOR')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    signUpRole === 'DOCTOR'
                      ? 'bg-white text-[#1B4332] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                  <span>I am a Doctor</span>
                </button>
              </div>

              {signUpError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-start gap-2 animate-in fade-in duration-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{signUpError}</div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    {signUpRole === 'DOCTOR' ? 'Doctor Full Name' : 'Patient Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                    placeholder={signUpRole === 'DOCTOR' ? 'e.g. Dr. Tariq Mahmood' : 'e.g. Hamza Ali'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      placeholder="e.g. name@hospital.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={signUpPhone}
                      onChange={e => setSignUpPhone(e.target.value)}
                      placeholder="e.g. +923001234567"
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all tracking-wider"
                  />
                </div>

                {/* Role Specific Extra Fields */}
                {signUpRole === 'DOCTOR' ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Medical Specialization
                    </label>
                    <input
                      type="text"
                      required
                      value={signUpSpecialization}
                      onChange={e => setSignUpSpecialization(e.target.value)}
                      placeholder="e.g. Dermatology & Laser Aesthetics"
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        Gender
                      </label>
                      <select
                        value={signUpGender}
                        onChange={e => setSignUpGender(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        CNIC / ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={signUpCnic}
                        onChange={e => setSignUpCnic(e.target.value)}
                        placeholder="35201-XXXXXXX-X"
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full mt-3 py-3.5 px-5 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)', boxShadow: '0 4px 14px rgba(45, 106, 79, 0.25)' }}
                >
                  {signUpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Open {signUpRole === 'DOCTOR' ? 'Doctor' : 'Patient'} Portal</span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to sign in */}
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSignUpMode(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Already have an account? Sign In</span>
                </button>
              </div>
            </div>
          ) : (

            /* ================= REGULAR SIGN IN VIEW ================= */
            <>
              {/* Header section */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 ring-4 ring-slate-100">
                  <Hospital className="w-8 h-8 text-sky-400" />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Clinical Command Deck
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Hospital Management & AI Operating System
                  </p>
                </div>

                {/* Role Header Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 shadow-sm text-slate-700">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Sign In</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username / Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Username or Email
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Enter username or email"
                      style={{ paddingLeft: '2.75rem' }}
                      className="w-full pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenForgot}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                      className="w-full py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-sm tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-5 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)', boxShadow: '0 4px 14px rgba(45, 106, 79, 0.25)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Navigation Link */}
              <div className="pt-3 text-center border-t border-slate-200/80">
                <p className="text-xs text-slate-600 font-medium">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(true);
                      setSignUpError(null);
                      setError(null);
                    }}
                    className="font-bold text-[#2D6A4F] hover:underline cursor-pointer inline-flex items-center gap-1 ml-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Account / Sign Up</span>
                  </button>
                </p>
              </div>

              {/* Collapsible Test / Demo Accounts Reference */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Quick Demo Credentials</span>
                  </div>
                  {showDemoAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDemoAccounts && (
                  <div className="mt-2 p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-2 text-xs animate-in fade-in duration-200">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Click <strong>Fill</strong> to auto-enter credentials for testing:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Doctor */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Doctor (Dr. Aisha)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">dr.aisha@hospital.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('dr.aisha@hospital.com')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded border border-slate-200 cursor-pointer"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleQuickSignIn('dr.aisha@hospital.com')}
                            className="px-2.5 py-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-[10px] rounded shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>

                      {/* Receptionist */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                            <span>Receptionist</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">receptionist@hospital.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('receptionist@hospital.com')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded border border-slate-200 cursor-pointer"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleQuickSignIn('receptionist@hospital.com')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>

                      {/* Patient */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-sky-600" />
                            <span>Patient (John Doe)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">john.doe@example.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('john.doe@example.com')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded border border-slate-200 cursor-pointer"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleQuickSignIn('john.doe@example.com')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>

                      {/* Admin */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Administrator</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">admin@hospital.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('admin@hospital.com')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded border border-slate-200 cursor-pointer"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleQuickSignIn('admin@hospital.com')}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center pt-1 font-mono">
                      Default Password: <span className="font-bold text-slate-700">Password123!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer security badge */}
              <div className="text-center pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Secure Login • Hospital Management System</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
