import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, Lock, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<'enter_id' | 'enter_otp' | 'new_password'>('enter_id');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('Please enter your email or phone number', undefined, 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('enter_otp');
      showToast('Verification code sent! (Use demo code: 123456)', undefined, 'info');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456' && otp.length < 4) {
      showToast('Please enter a valid 6-digit code (Use 123456)', undefined, 'error');
      return;
    }
    setStep('new_password');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', undefined, 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Password updated successfully! Please sign in.', undefined, 'success');
      navigate('/login');
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-grid-pattern">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-agro-200/80">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agro-700 to-emerald-400 text-white mx-auto flex items-center justify-center shadow-lg shadow-agro-600/30 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {t('auth_reset_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {step === 'enter_id' && t('auth_reset_step1_sub')}
            {step === 'enter_otp' && t('auth_reset_step2_sub')}
            {step === 'new_password' && t('auth_reset_step3_sub')}
          </p>
        </div>

        {step === 'enter_id' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth_identifier_label')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or farmer@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-agro-600 hover:bg-agro-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Sending Code...' : t('auth_send_code_btn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'enter_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth_otp_label')}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1 2 3 4 5 6"
                className="w-full py-3 text-center tracking-widest text-lg font-bold bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-4 bg-agro-600 hover:bg-agro-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{t('auth_verify_btn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'new_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth_new_pwd_label')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth_confirm_new_pwd_label')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-agro-600 hover:bg-agro-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Updating Password...' : t('auth_save_new_pwd_btn')}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-xs text-slate-600 hover:text-agro-700 font-semibold inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth_back_login')}</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
