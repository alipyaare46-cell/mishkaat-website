import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Bookmark,
  BookOpen,
  Volume2,
  Sparkles,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const SAVED_EMAIL_KEY = 'mishkaat_saved_user_email';

export const UserAuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalTab, setAuthModalTab, loginUser } = useUserAuth();
  const { language } = useLanguage();

  const [email, setEmail] = useState(() => localStorage.getItem(SAVED_EMAIL_KEY) || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberId, setRememberId] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password (Gmail OTP) states
  const [mode, setMode] = useState<'auth' | 'forgot'>('auth');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Sync saved email whenever modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      const saved = localStorage.getItem(SAVED_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberId(true);
      }
      setMode('auth');
      setForgotStep('email');
      setOtpCode('');
      setNewPassword('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const persistEmailPreference = (targetEmail: string) => {
    const clean = targetEmail.trim().toLowerCase();
    if (rememberId && clean) {
      localStorage.setItem(SAVED_EMAIL_KEY, clean);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }
  };

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setMode('auth');
    setForgotStep('email');
    setError(null);
    setSuccessMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.userLogin({ email: cleanEmail, password });
      persistEmailPreference(cleanEmail);
      loginUser(res.token, res.user);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.userRegister({ full_name: fullName, email: cleanEmail, password });
      persistEmailPreference(cleanEmail);
      loginUser(res.token, res.user);
      setSuccessMsg('Account created successfully! Welcome to MISHKAAT.');
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.userForgotPassword(cleanEmail);
      setEmail(cleanEmail);
      setForgotStep('otp');
      setSuccessMsg(res.message || `OTP sent to ${cleanEmail}. Please check your Gmail.`);
    } catch (err: any) {
      setError(err.message || 'Could not send OTP to this Gmail address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.userResetPassword({
        email: cleanEmail,
        otp: otpCode.trim(),
        newPassword
      });
      persistEmailPreference(cleanEmail);
      loginUser(res.token, res.user);
      setSuccessMsg(res.message || 'Password updated! Signing you in...');
      setTimeout(() => {
        handleClose();
      }, 1100);
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP or reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Islamic Green gradient & Pattern */}
        <div className="relative bg-[#064E3B] text-white p-6 pb-5 border-b border-[#D4AF37]/30 shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MISHKAAT Member Sanctuary</span>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-white mt-1">
            {mode === 'forgot'
              ? (language === 'ur' ? 'پاس ورڈ دوبارہ سیٹ کریں' : 'Reset Password via Gmail OTP')
              : authModalTab === 'signin'
                ? (language === 'ur' ? 'اکاؤنٹ میں داخل ہوں' : language === 'ar' ? 'تسجيل الدخول' : 'Welcome Back')
                : (language === 'ur' ? 'نیا اکاؤنٹ بنائیں' : language === 'ar' ? 'إنشاء حساب جديد' : 'Join MISHKAAT')}
          </h2>

          <p className="text-xs text-emerald-100/90 mt-1">
            {mode === 'forgot'
              ? 'Enter your registered Gmail address to receive a 6-digit OTP verification code.'
              : authModalTab === 'signin'
                ? 'Sign in to access your saved speeches, digital books, and spiritual library.'
                : 'Create a free account to personalize your Islamic knowledge journey.'}
          </p>

          {/* Tab Switcher (hidden during forgot password flow) */}
          {mode === 'auth' && (
            <div className="flex bg-black/25 p-1 rounded-xl mt-4 border border-white/10">
              <button
                type="button"
                onClick={() => { setAuthModalTab('signin'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'signin'
                    ? 'bg-[#D4AF37] text-[#064E3B] shadow-xs'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthModalTab('signup'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'signup'
                    ? 'bg-[#D4AF37] text-[#064E3B] shadow-xs'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Benefits banner */}
        <div className="bg-[#F4F8F4] px-6 py-2.5 border-b border-stone-200/80 flex items-center justify-between text-[11px] text-stone-600 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <Bookmark className="w-3.5 h-3.5 text-[#064E3B]" />
            <span>Save Speeches & Reels</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-[#064E3B]" />
            <span>Personal Book Library</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-[#064E3B]" />
            <span>Watch History</span>
          </span>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'forgot' ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setMode('auth');
                  setAuthModalTab('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              {forgotStep === 'email' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                    >
                      Registered Gmail / Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        id="forgot-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aliqalandar341@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5">
                      We will send a 6-digit OTP verification code directly to your Gmail.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#064E3B] hover:bg-[#085a44] text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                        <span>Send OTP to Gmail</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordWithOtp} className="space-y-4" autoComplete="on">
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-center justify-between gap-2">
                    <span className="truncate">
                      Gmail: <strong className="text-[#064E3B]">{email}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => { setForgotStep('email'); setError(null); setSuccessMsg(null); }}
                      className="text-[11px] font-semibold text-[#064E3B] hover:underline shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-otp"
                      className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                    >
                      6-Digit Gmail OTP
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        id="reset-otp"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-new-password"
                      className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                    >
                      New Password (Min. 6 chars)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        id="reset-new-password"
                        name="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        minLength={6}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#064E3B] hover:bg-[#085a44] text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Verify OTP &amp; Reset Password</span>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleSendOtp}
                      className="text-xs text-[#064E3B] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Didn&apos;t receive OTP? Resend to Gmail
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : authModalTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4" autoComplete="on">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Email Address / Login ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="signin-email"
                    name="username"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotStep('email');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-semibold text-[#064E3B] hover:text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Forgot Password? (Gmail OTP)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Save Login ID / Remember Me Option */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberId}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setRememberId(next);
                      if (!next) {
                        localStorage.removeItem(SAVED_EMAIL_KEY);
                      } else if (email.trim()) {
                        localStorage.setItem(SAVED_EMAIL_KEY, email.trim().toLowerCase());
                      }
                    }}
                    className="w-4 h-4 rounded border-stone-300 text-[#064E3B] focus:ring-[#064E3B] cursor-pointer"
                  />
                  <span className="font-medium">Save my Email / ID on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#064E3B] hover:bg-[#085a44] text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Sign In to MISHKAAT</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthModalTab('signup'); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-[#064E3B] hover:underline font-semibold cursor-pointer"
                >
                  Don&apos;t have an account? Create one for free
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5" autoComplete="on">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Full Name / Ism-e-Girami
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Syed Muhammad / Brother / Sister"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Email Address / Login ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="signup-email"
                    name="username"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Choose a Password (Min. 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="signup-password"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none pt-0.5">
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-[#064E3B] focus:ring-[#064E3B] cursor-pointer"
                />
                <span className="font-medium">Save my Email / ID on this device</span>
              </label>

              <div className="text-[11px] text-stone-500 leading-relaxed pt-1">
                By joining, you become part of the MISHKAAT Ahl-e-Sunnat learning network and can curate your own spiritual library.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#064E3B] font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#064E3B] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create Free Account</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthModalTab('signin'); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-[#064E3B] hover:underline font-semibold cursor-pointer"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

