import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { Sprout, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('ramesh.farmer@krishidrishti.in');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('Please enter your email or phone number', undefined, 'error');
      return;
    }

    setIsLoading(true);
    try {
      await login({ identifier, password, rememberMe });
      showToast('Welcome back to KrishiDrishti AI!', undefined, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please verify credentials.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-grid-pattern">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-agro-200/80 relative">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agro-700 to-emerald-400 text-white mx-auto flex items-center justify-center shadow-lg shadow-agro-600/30 mb-3">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {t('auth_signin_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('auth_signin_sub')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t('auth_password_label')}
              </label>
              <Link to="/forgot-password" className="text-xs text-agro-600 hover:text-agro-700 font-semibold">
                {t('auth_forgot_link')}
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-agro-600 focus:ring-agro-500 w-4 h-4"
              />
              <span>{t('auth_remember_me')}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 bg-agro-600 hover:bg-agro-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-agro-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Signing In...' : t('auth_signin_btn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          {t('auth_new_user')}{' '}
          <Link to="/signup" className="text-agro-700 font-bold hover:underline">
            {t('auth_create_acc')}
          </Link>
        </p>
      </div>
    </div>
  );
};
