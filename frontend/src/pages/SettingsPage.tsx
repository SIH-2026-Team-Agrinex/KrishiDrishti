import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Settings, 
  User as UserIcon, 
  Save, 
  Plus, 
  X, 
  MapPin, 
  Mail, 
  Phone 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUserPreferences } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const { location, setManualLocation } = useLocation();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [userCity, setUserCity] = useState(user?.farmLocation?.villageOrCity || (location.isCustomLocation ? location.city : ''));
  const [userState, setUserState] = useState(user?.farmLocation?.state || (location.isCustomLocation ? location.state : ''));
  const [selectedCrops, setSelectedCrops] = useState<string[]>(user?.cropInterests || []);
  const [customCropInput, setCustomCropInput] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setUserCity(user.farmLocation?.villageOrCity || (location.isCustomLocation ? location.city : ''));
      setUserState(user.farmLocation?.state || (location.isCustomLocation ? location.state : ''));
      setSelectedCrops(user.cropInterests || []);
    }
  }, [user, location.city, location.state, location.isCustomLocation]);

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPreferences({
      name,
      phone,
      cropInterests: selectedCrops,
    });
    if (userCity && userCity.trim()) {
      setManualLocation(userCity.trim(), (userState || 'India').trim());
    }
    showToast('Preferences updated successfully', undefined, 'success');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-agro-700 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4 text-agro-600" />
            <span>{t('set_badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            {t('set_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('set_sub')}
          </p>
        </div>

        {/* Profile & Preferences Form */}
        <form onSubmit={handleSaveProfile} className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-agro-100">
            <div className="p-2.5 bg-gradient-to-tr from-agro-700 to-emerald-500 text-white rounded-2xl shadow-sm">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{t('set_farmer_details')}</h3>
                {user?.isGuest ? (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Guest Account
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Farmer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>{t('set_farmer_sub')}</span>
                {user?.email && (
                  <span className="font-semibold text-agro-700 bg-agro-50 px-2 py-0.5 rounded-md border border-agro-200">
                    ID: {user.email}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('set_name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Farmer Name"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Registered Email Address</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  Registered ID
                </span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 text-xs sm:text-sm shadow-sm cursor-not-allowed font-medium select-all"
                  title="Registered Email Address"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('set_phone')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Village / District / Town
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userCity}
                  onChange={(e) => setUserCity(e.target.value)}
                  placeholder="e.g. Nashik, Ludhiana, Guntur..."
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('set_lang')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm font-medium"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manual Crops Management */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700">
              {t('auth_crops_grown_label')} (Add manually)
            </label>

            {/* Custom Crop Add field */}
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
                className="px-4 py-2.5 bg-agro-600 hover:bg-agro-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Crop</span>
              </button>
            </div>

            {/* Manually added crops badges */}
            {selectedCrops.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50/70 rounded-2xl border border-slate-200">
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
              <p className="text-[11px] text-slate-400 italic">
                No crops listed yet. Type your crop name above and click "Add Crop".
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-agro-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-agro-600 hover:bg-agro-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{t('set_save_btn')}</span>
            </button>
          </div>
        </form>

      </main>
    </div>
  );
};
