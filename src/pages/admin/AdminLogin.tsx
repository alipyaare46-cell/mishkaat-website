import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { api } from '../../services/api';
import emblemImg from '../../assets/images/mishkaat_logo_emblem_1794552300053.jpg';

interface AdminLoginProps {
  onBackToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToPublic }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.login(username, password);
      login(res.token, res.admin);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F4] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onBackToPublic}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to MISHKAAT Public Platform</span>
        </button>

        <div className="w-16 h-16 rounded-xl bg-[#064E3B] border-2 border-[#D4AF37]/50 p-2 mx-auto shadow-md flex items-center justify-center">
          <img
            src={emblemImg}
            alt="Mishkaat Emblem"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-stone-900">
          Admin Portal Authentication
        </h2>
        <p className="mt-1 text-xs text-stone-600">
          Secure Administrative Gateway for MISHKAAT Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Notice for General Visitors */}
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: Restricted Admin Gateway</span>
          </div>
          <p className="leading-relaxed text-amber-900">
            <strong>Please do not try to log in here.</strong> This portal is strictly restricted to authorized platform administrators and editors only.
          </p>
          <p className="text-[11px] text-amber-800 leading-normal">
            If you are a member or visitor wishing to like, comment, or save speeches and books, please return to the main website and use the <strong>Member Sign In</strong> button in the header.
          </p>
          <button
            type="button"
            onClick={onBackToPublic}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#064E3B] hover:text-[#075c46] underline underline-offset-2 cursor-pointer pt-0.5"
          >
            <span>&larr; Return to Main Website & Member Sign In</span>
          </button>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-stone-200/90 sm:px-10">

          
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Username
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B]"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B]"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#064E3B] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#D4AF37]" />
                <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
              </button>
            </div>
          </form>

          {/* Powered By Syed Ali Qalandar Peerzade */}
          <div className="mt-8 pt-5 border-t border-stone-100 text-center">
            <span className="font-display text-[11px] font-bold tracking-widest text-[#064E3B] uppercase">
              POWERED BY SYED ALI QALANDAR PEERZADE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
