import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { Sprout, Lock, Mail, User as UserIcon, MapPin, ArrowRight, X, Plus } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const { language, languages, t } = useLanguage();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [customCropInput, setCustomCropInput] = useState('');
  const [preferredLang, setPreferredLang] = useState(language);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCustomCrop = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customCropInput.trim();
    if (!trimmed) return;
    if (!selectedCrops.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setSelectedCrops((prev) => [...prev, trimmed]);
    }
    setCustomCropInput('');
  };

  const handleRemoveCrop = (cropToRemove: string) => {
    setSelectedCrops((prev) => prev.filter((c) => c !== cropToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim() || !password || !confirmPassword) {
      showToast('Please fill in all required fields', undefined, 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', undefined, 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please ensure both passwords are identical.', undefined, 'error');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        name,
        identifier,
        password,
        preferredLanguage: preferredLang,
        farmLocation: farmLocation.trim() || 'My Farm Field',
        cropInterests: selectedCrops,
      });
      showToast('Account created successfully! Welcome to KrishiDrishti.', undefined, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Signup failed', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 py-10 bg-grid-pattern">
      <div className="max-w-lg w-full glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-agro-200/80">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agro-700 to-emerald-400 text-white mx-auto flex items-center justify-center shadow-lg shadow-agro-600/30 mb-3">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {t('auth_signup_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('auth_signup_sub')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('auth_fullname_label')}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Farmer Name"
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth_password_label')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth_confirm_pwd_label')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 bg-white rounded-2xl border focus:outline-none text-xs sm:text-sm shadow-sm transition-colors ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-300 focus:border-rose-500 text-rose-900'
                      : confirmPassword && confirmPassword === password
                      ? 'border-emerald-400 focus:border-emerald-500'
                      : 'border-slate-200 focus:border-agro-500'
                  }`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  Passwords do not match
                </p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  ✓ Passwords match
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Village / District / Town (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="e.g. My Farm / Village"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth_pref_lang_label')}
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as any)}
                className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('auth_crops_grown_label')} (Add manually)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customCropInput}
                onChange={(e) => setCustomCropInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCrop();
                  }
                }}
                placeholder="Type crop name (e.g. Wheat, Mustard, Cotton)..."
                className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:border-agro-500 focus:outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleAddCustomCrop()}
                disabled={!customCropInput.trim()}
                className="px-4 py-2.5 bg-agro-600 hover:bg-agro-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Manually added crops badges */}
            {selectedCrops.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {selectedCrops.map((crop) => (
                  <span
                    key={crop}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-agro-50 text-agro-800 border border-agro-200 shadow-2xs"
                  >
                    <span>{crop}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(crop)}
                      className="hover:text-rose-600 text-slate-400 focus:outline-none transition-colors"
                      title="Remove crop"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1.5 italic">
                Type your crop name above and click "Add" to include it in your profile.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3.5 px-4 bg-agro-600 hover:bg-agro-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-agro-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Creating Account...' : t('auth_signup_btn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          {t('auth_already_have')}{' '}
          <Link to="/login" className="text-agro-700 font-bold hover:underline">
            {t('nav_login')}
          </Link>
        </p>
      </div>
    </div>
  );
};
