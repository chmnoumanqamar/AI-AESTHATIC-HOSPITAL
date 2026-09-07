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
  ChevronUp,
  Sun,
  Moon
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

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hospital_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hospital_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hospital_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

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

  // Patient Registration States
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
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

    let finalPassword = signUpPassword.trim();
    if (finalPassword) {
      if (finalPassword.length < 6) {
        setSignUpError('Password must be at least 6 characters long.');
        setSignUpLoading(false);
        return;
      }
      if (finalPassword !== signUpConfirmPassword.trim()) {
        setSignUpError('Passwords do not match. Please verify your confirm password.');
        setSignUpLoading(false);
        return;
      }
    } else {
      finalPassword = 'Password123!';
    }

    try {
      const payload: any = {
        fullName: signUpName.trim(),
        phone: signUpPhone.trim(),
        email: signUpEmail.trim() || undefined,
        password: finalPassword,
        role: 'PATIENT',
        gender: signUpGender,
        cnic: signUpCnic.trim() || undefined
      };

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
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 select-none"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1A2215 0%, #151D11 50%, #0E140C 100%)'
          : 'linear-gradient(135deg, #F6F7F2 0%, #EAECE2 50%, #DDE2D2 100%)'
      }}
    >
      {/* Top Floating Dark/Light Mode Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        id="login-theme-toggle"
        className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-200 shadow-md cursor-pointer active:scale-95 group font-semibold text-xs"
        style={{
          backgroundColor: isDark ? '#242E1C' : '#FFFFFF',
          borderColor: isDark ? '#414833' : '#CBD5E1',
          color: isDark ? '#F6F7F2' : '#334155'
        }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-emerald-800 group-hover:-rotate-12 transition-transform duration-300" />
            <span>Dark Mode</span>
          </>
        )}
      </button>

      {/* Ambient background glows */}
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-pulse" 
        style={{ backgroundColor: isDark ? 'rgba(45, 106, 79, 0.2)' : 'rgba(164, 172, 134, 0.25)' }} 
      />
      <div 
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none" 
        style={{ backgroundColor: isDark ? 'rgba(101, 109, 74, 0.15)' : 'rgba(194, 197, 170, 0.3)' }} 
      />
      <div className="absolute inset-0 bg-[radial-gradient(#414833_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Main Card */}
      <div 
        className="relative w-full max-w-lg backdrop-blur-2xl rounded-3xl shadow-2xl transition-all duration-300 z-10 border overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(24, 33, 20, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: isDark ? '#333D29' : '#E2E8F0',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' : '0 20px 40px -15px rgba(15, 23, 42, 0.1)'
        }}
      >
        <div className="p-7 sm:p-9 space-y-6">

          {/* ================= FORGOT PASSWORD VIEW (SECURE 2-STEP OTP) ================= */}
          {isForgotMode ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="text-center space-y-3">
                <div 
                  className="inline-flex items-center justify-center p-3.5 rounded-2xl text-white shadow-xl ring-4"
                  style={{
                    backgroundColor: isDark ? '#2D6A4F' : '#0F172A',
                    borderColor: isDark ? '#1B4332' : '#E2E8F0'
                  }}
                >
                  <ShieldCheck className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                  <h1 
                    className="text-2xl font-extrabold tracking-tight"
                    style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                  >
                    Secure Password Recovery
                  </h1>
                  <p 
                    className="text-xs sm:text-sm font-medium mt-1"
                    style={{ color: isDark ? '#A4AC86' : '#64748B' }}
                  >
                    {forgotStep === 'REQUEST_OTP'
                      ? 'Identity verification required before resetting password'
                      : `Enter the 6-digit verification code sent to ${maskedContact}`}
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {forgotError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{forgotError}</div>
                </div>
              )}

              {/* Success Alert */}
              {forgotSuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="font-bold text-sm text-emerald-800 dark:text-emerald-200">Password Updated!</span>
                  </div>
                  <p>
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
                        <label 
                          className="text-xs font-bold uppercase tracking-wider block"
                          style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                        >
                          Username or Email
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="w-4 h-4" style={{ color: isDark ? '#A4AC86' : '#94A3B8' }} />
                          </div>
                          <input
                            type="text"
                            required
                            value={forgotIdentifier}
                            onChange={e => setForgotIdentifier(e.target.value)}
                            placeholder="Enter username or email"
                            style={{
                              paddingLeft: '2.75rem',
                              backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                              borderColor: isDark ? '#333D29' : '#CBD5E1',
                              color: isDark ? '#FFFFFF' : '#0F172A'
                            }}
                            className="w-full pr-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                          />
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>
                          🔒 A one-time verification code (OTP) will be dispatched to this account's registered contact to prevent unauthorized access.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] hover:from-[#388463] hover:to-[#225640] active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                            <span>Sending Verification Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* STEP 2: Enter OTP Code + New Password */}
                  {forgotStep === 'VERIFY_OTP' && (
                    <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                      {/* Security Banner with Demo Code */}
                      <div 
                        className="p-3 border rounded-xl text-xs space-y-1"
                        style={{
                          backgroundColor: isDark ? '#16231B' : '#F0F9FF',
                          borderColor: isDark ? '#2D553A' : '#BAE6FD',
                          color: isDark ? '#74C69D' : '#0369A1'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            Code Sent to {maskedContact}
                          </span>
                          {demoOtp && (
                            <span 
                              className="px-2 py-0.5 rounded font-mono font-bold text-[11px]"
                              style={{
                                backgroundColor: isDark ? '#24402F' : '#BAE6FD',
                                color: isDark ? '#A7D7C5' : '#0C4A6E'
                              }}
                            >
                              Code: {demoOtp}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px]" style={{ color: isDark ? '#A4AC86' : '#0284C7' }}>
                          Enter the 6-digit code sent to verify ownership before setting a new password.
                        </p>
                      </div>

                      {/* 6-Digit OTP Field */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label 
                            className="text-xs font-bold uppercase tracking-wider block"
                            style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                          >
                            6-Digit Verification Code
                          </label>
                          <button
                            type="button"
                            onClick={() => setForgotStep('REQUEST_OTP')}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Resend / Change
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Shield className="w-4 h-4" style={{ color: isDark ? '#A4AC86' : '#94A3B8' }} />
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            style={{
                              paddingLeft: '2.75rem',
                              backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                              borderColor: isDark ? '#333D29' : '#CBD5E1',
                              color: isDark ? '#FFFFFF' : '#0F172A'
                            }}
                            className="w-full pr-4 py-3 border rounded-xl text-base font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                          />
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label 
                          className="text-xs font-bold uppercase tracking-wider block"
                          style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                        >
                          New Password
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4" style={{ color: isDark ? '#A4AC86' : '#94A3B8' }} />
                          </div>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 6 characters)"
                            style={{
                              paddingLeft: '2.75rem',
                              paddingRight: '2.75rem',
                              backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                              borderColor: isDark ? '#333D29' : '#CBD5E1',
                              color: isDark ? '#FFFFFF' : '#0F172A'
                            }}
                            className="w-full py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center hover:opacity-100 transition-opacity cursor-pointer"
                            style={{ color: isDark ? '#A4AC86' : '#94A3B8' }}
                            title={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-1.5">
                        <label 
                          className="text-xs font-bold uppercase tracking-wider block"
                          style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                        >
                          Confirm New Password
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4" style={{ color: isDark ? '#A4AC86' : '#94A3B8' }} />
                          </div>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            style={{
                              paddingLeft: '2.75rem',
                              backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                              borderColor: isDark ? '#333D29' : '#CBD5E1',
                              color: isDark ? '#FFFFFF' : '#0F172A'
                            }}
                            className="w-full pr-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs tracking-wider"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] hover:from-[#388463] hover:to-[#225640] active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                            <span>Verifying Code & Updating...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Code & Set Password</span>
                            <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: isDark ? '#A4AC86' : '#64748B' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : isSignUpMode ? (

            /* ================= PATIENT REGISTRATION VIEW ================= */
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div 
                  className="inline-flex items-center justify-center p-3 rounded-2xl text-white shadow-lg ring-4"
                  style={{
                    backgroundColor: '#2D6A4F',
                    borderColor: isDark ? '#1B4332' : '#E8F3EB'
                  }}
                >
                  <UserPlus className="w-7 h-7 text-emerald-200" />
                </div>
                <div>
                  <h1 
                    className="text-2xl font-extrabold tracking-tight"
                    style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                  >
                    New Patient Registration
                  </h1>
                  <p 
                    className="text-xs font-medium mt-0.5"
                    style={{ color: isDark ? '#A4AC86' : '#64748B' }}
                  >
                    Create your patient account to book consultations and view records
                  </p>
                </div>
              </div>

              {signUpError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2 animate-in fade-in duration-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{signUpError}</div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label 
                    className="text-[11px] font-bold uppercase tracking-wider block"
                    style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                  >
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                    placeholder="e.g. Hamza Ali"
                    style={{
                      backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                      borderColor: isDark ? '#333D29' : '#CBD5E1',
                      color: isDark ? '#FFFFFF' : '#0F172A'
                    }}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Email */}
                  <div className="space-y-1">
                    <label 
                      className="text-[11px] font-bold uppercase tracking-wider block"
                      style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                    >
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      placeholder="e.g. patient@example.com"
                      style={{
                        backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                        borderColor: isDark ? '#333D29' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A'
                      }}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label 
                      className="text-[11px] font-bold uppercase tracking-wider block"
                      style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={signUpPhone}
                      onChange={e => setSignUpPhone(e.target.value)}
                      placeholder="e.g. +923001234567"
                      style={{
                        backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                        borderColor: isDark ? '#333D29' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A'
                      }}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Create Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label 
                        className="text-[11px] font-bold uppercase tracking-wider block"
                        style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                      >
                        Password (Optional)
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Default: Password123!</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={signUpPassword}
                        onChange={e => setSignUpPassword(e.target.value)}
                        placeholder="Set password or leave blank"
                        style={{
                          backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                          borderColor: isDark ? '#333D29' : '#CBD5E1',
                          color: isDark ? '#FFFFFF' : '#0F172A'
                        }}
                        className="w-full pl-3.5 pr-9 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all tracking-wider shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-100 focus:outline-none cursor-pointer p-0.5"
                        style={{ color: isDark ? '#A4AC86' : '#94A3B8' }}
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label 
                      className="text-[11px] font-bold uppercase tracking-wider block"
                      style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSignUpConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={signUpConfirmPassword}
                        onChange={e => setSignUpConfirmPassword(e.target.value)}
                        placeholder={signUpPassword ? "Confirm your password" : "Optional (Disabled when blank)"}
                        disabled={!signUpPassword}
                        style={{
                          backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                          borderColor: isDark ? '#333D29' : '#CBD5E1',
                          color: isDark ? '#FFFFFF' : '#0F172A'
                        }}
                        className="w-full pl-3.5 pr-9 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                        disabled={!signUpPassword}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-100 focus:outline-none cursor-pointer p-0.5 disabled:opacity-50"
                        style={{ color: isDark ? '#A4AC86' : '#94A3B8' }}
                      >
                        {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Match Status Indicator */}
                {signUpPassword && (
                  <div className="text-[11px] font-medium px-1 flex items-center gap-1.5">
                    {signUpConfirmPassword ? (
                      signUpPassword === signUpConfirmPassword ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match perfectly
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5" /> Passwords do not match yet
                        </span>
                      )
                    ) : (
                      <span style={{ color: isDark ? '#A4AC86' : '#64748B' }}>
                        Please re-type password in Confirm Password to verify
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label 
                      className="text-[11px] font-bold uppercase tracking-wider block"
                      style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                    >
                      Gender
                    </label>
                    <select
                      value={signUpGender}
                      onChange={e => setSignUpGender(e.target.value as any)}
                      style={{
                        backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                        borderColor: isDark ? '#333D29' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A'
                      }}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label 
                      className="text-[11px] font-bold uppercase tracking-wider block"
                      style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                    >
                      CNIC / ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={signUpCnic}
                      onChange={e => setSignUpCnic(e.target.value)}
                      placeholder="35201-XXXXXXX-X"
                      style={{
                        backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                        borderColor: isDark ? '#333D29' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A'
                      }}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full mt-3 py-3.5 px-5 bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] hover:from-[#388463] hover:to-[#225640] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {signUpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Registering Patient...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Open Patient Portal</span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Administrative note */}
              <p className="text-[11px] text-center font-medium" style={{ color: isDark ? '#A4AC86' : '#94A3B8' }}>
                Hospital staff & doctor accounts are provisioned by Administration.
              </p>

              {/* Back to sign in */}
              <div 
                className="pt-2 text-center border-t"
                style={{ borderColor: isDark ? '#2D3A24' : '#E2E8F0' }}
              >
                <button
                  type="button"
                  onClick={() => setIsSignUpMode(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: isDark ? '#A4AC86' : '#64748B' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Already registered? Sign In</span>
                </button>
              </div>
            </div>
          ) : (

            /* ================= REGULAR SIGN IN VIEW ================= */
            <>
              {/* Header section */}
              <div className="text-center space-y-3">
                <div 
                  className="inline-flex items-center justify-center p-3.5 rounded-2xl text-white shadow-xl ring-4"
                  style={{
                    backgroundColor: isDark ? '#204532' : '#0F172A',
                    borderColor: isDark ? '#2D6A4F' : '#E2E8F0'
                  }}
                >
                  <Hospital className="w-8 h-8 text-sky-400" />
                </div>

                <div>
                  <h1 
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                  >
                    Clinical Command Deck
                  </h1>
                  <p 
                    className="text-xs sm:text-sm font-medium mt-1"
                    style={{ color: isDark ? '#A4AC86' : '#64748B' }}
                  >
                    Hospital Management & AI Operating System
                  </p>
                </div>

                {/* Role Header Badge */}
                <div 
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-2xs"
                  style={{
                    backgroundColor: isDark ? '#242E1C' : '#F1F5F9',
                    borderColor: isDark ? '#414833' : '#E2E8F0',
                    color: isDark ? '#C2C5AA' : '#334155'
                  }}
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Secure Sign In</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username / Email Input */}
                <div className="space-y-1.5">
                  <label 
                    className="text-xs font-bold uppercase tracking-wider block"
                    style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                  >
                    Username or Email
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4" style={{ color: isDark ? '#A4AC86' : '#94A3B8' }} />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Enter username or email"
                      style={{ 
                        paddingLeft: '2.75rem',
                        backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                        borderColor: isDark ? '#333D29' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A'
                      }}
                      className="w-full pr-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label 
                      className="text-xs font-bold uppercase tracking-wider block"
                      style={{ color: isDark ? '#C2C5AA' : '#334155' }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenForgot}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4" style={{ color: isDark ? '#A4AC86' : '#94A3B8' }} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{ 
                        paddingLeft: '2.75rem', 
                        paddingRight: '2.75rem',
                        backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                        borderColor: isDark ? '#333D29' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A'
                      }}
                      className="w-full py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ color: isDark ? '#A4AC86' : '#94A3B8' }}
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
                  className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] hover:from-[#388463] hover:to-[#225640] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
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
              <div 
                className="pt-3 text-center border-t"
                style={{ borderColor: isDark ? '#2D3A24' : '#E2E8F0' }}
              >
                <p className="text-xs font-medium" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>
                  New Patient?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(true);
                      setSignUpError(null);
                      setError(null);
                    }}
                    className="font-bold text-[#2D6A4F] dark:text-[#52B788] hover:underline cursor-pointer inline-flex items-center gap-1 ml-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register as Patient</span>
                  </button>
                </p>
              </div>

              {/* Collapsible Test / Demo Accounts Reference */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  style={{
                    backgroundColor: isDark ? '#1C2417' : '#F8FAFC',
                    borderColor: isDark ? '#333D29' : '#E2E8F0',
                    color: isDark ? '#C2C5AA' : '#334155'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5" style={{ color: isDark ? '#A4AC86' : '#64748B' }} />
                    <span>Quick Demo Credentials</span>
                  </div>
                  {showDemoAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDemoAccounts && (
                  <div 
                    className="mt-2 p-3 border rounded-xl space-y-2 text-xs animate-in fade-in duration-200"
                    style={{
                      backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                      borderColor: isDark ? '#333D29' : '#E2E8F0'
                    }}
                  >
                    <p className="text-[11px] font-medium" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>
                      Click <strong>Fill</strong> to auto-enter credentials for testing:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Doctor */}
                      <div 
                        className="p-2.5 rounded-lg border flex items-center justify-between gap-2 shadow-2xs"
                        style={{
                          backgroundColor: isDark ? '#1E2717' : '#FFFFFF',
                          borderColor: isDark ? '#333D29' : '#E2E8F0'
                        }}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] flex items-center gap-1" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Doctor (Dr. Aisha)</span>
                          </div>
                          <div className="text-[10px] truncate" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>dr.aisha@hospital.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('dr.aisha@hospital.com')}
                            className="px-2 py-1 font-semibold text-[10px] rounded border cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isDark ? '#2D3923' : '#F1F5F9',
                              borderColor: isDark ? '#414833' : '#CBD5E1',
                              color: isDark ? '#F6F7F2' : '#334155'
                            }}
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
                      <div 
                        className="p-2.5 rounded-lg border flex items-center justify-between gap-2 shadow-2xs"
                        style={{
                          backgroundColor: isDark ? '#1E2717' : '#FFFFFF',
                          borderColor: isDark ? '#333D29' : '#E2E8F0'
                        }}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] flex items-center gap-1" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                            <span>Receptionist</span>
                          </div>
                          <div className="text-[10px] truncate" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>receptionist@hospital.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('receptionist@hospital.com')}
                            className="px-2 py-1 font-semibold text-[10px] rounded border cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isDark ? '#2D3923' : '#F1F5F9',
                              borderColor: isDark ? '#414833' : '#CBD5E1',
                              color: isDark ? '#F6F7F2' : '#334155'
                            }}
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
                      <div 
                        className="p-2.5 rounded-lg border flex items-center justify-between gap-2 shadow-2xs"
                        style={{
                          backgroundColor: isDark ? '#1E2717' : '#FFFFFF',
                          borderColor: isDark ? '#333D29' : '#E2E8F0'
                        }}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] flex items-center gap-1" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            <User className="w-3.5 h-3.5 text-sky-500" />
                            <span>Patient (John Doe)</span>
                          </div>
                          <div className="text-[10px] truncate" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>john.doe@example.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('john.doe@example.com')}
                            className="px-2 py-1 font-semibold text-[10px] rounded border cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isDark ? '#2D3923' : '#F1F5F9',
                              borderColor: isDark ? '#414833' : '#CBD5E1',
                              color: isDark ? '#F6F7F2' : '#334155'
                            }}
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
                      <div 
                        className="p-2.5 rounded-lg border flex items-center justify-between gap-2 shadow-2xs"
                        style={{
                          backgroundColor: isDark ? '#1E2717' : '#FFFFFF',
                          borderColor: isDark ? '#333D29' : '#E2E8F0'
                        }}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] flex items-center gap-1" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                            <span>Administrator</span>
                          </div>
                          <div className="text-[10px] truncate" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>admin@hospital.com</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickFill('admin@hospital.com')}
                            className="px-2 py-1 font-semibold text-[10px] rounded border cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isDark ? '#2D3923' : '#F1F5F9',
                              borderColor: isDark ? '#414833' : '#CBD5E1',
                              color: isDark ? '#F6F7F2' : '#334155'
                            }}
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
                    <div className="text-[10px] text-center pt-1 font-mono" style={{ color: isDark ? '#A4AC86' : '#64748B' }}>
                      Default Password: <span className="font-bold" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>Password123!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer security badge */}
              <div className="text-center pt-2">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium"
                  style={{
                    backgroundColor: isDark ? '#141A10' : '#F8FAFC',
                    borderColor: isDark ? '#2D3A24' : '#E2E8F0',
                    color: isDark ? '#A4AC86' : '#64748B'
                  }}
                >
                  <Shield className="w-3.5 h-3.5" style={{ color: isDark ? '#74C69D' : '#94A3B8' }} />
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
