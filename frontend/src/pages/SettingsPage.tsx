import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Settings, 
  User as UserIcon, 
  Save, 
  Check, 
  Plus,
  X,
  MapPin
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUserPreferences } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const { location, setManualLocation } = useLocation();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || 'Ramesh Patel');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [userCity, setUserCity] = useState(location.city || 'My Farm');
  const [userState, setUserState] = useState(location.state || 'India');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(user?.cropInterests || ['Tomato', 'Wheat']);
  const [customCropInput, setCustomCropInput] = useState('');

  const [allCropOptions, setAllCropOptions] = useState([
    'Tomato', 'Wheat', 'Rice / Paddy', 'Cotton', 'Onion', 'Potato', 
    'Mustard', 'Chilli', 'Sugarcane', 'Maize', 'Apple', 'Mango', 
    'Ginger', 'Garlic', 'Groundnut', 'Soybean', 'Turmeric', 'Tea', 'Coffee'
  ]);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleAddCustomCrop = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCropInput.trim();
    if (!trimmed) return;
    if (!allCropOptions.includes(trimmed)) {
      setAllCropOptions((prev) => [trimmed, ...prev]);
    }
    if (!selectedCrops.includes(trimmed)) {
      setSelectedCrops((prev) => [...prev, trimmed]);
    }
    setCustomCropInput('');
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
          <div className="flex items-center gap-2.5 pb-2 border-b border-agro-100">
            <div className="p-2 bg-agro-100 text-agro-700 rounded-2xl">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t('set_farmer_details')}</h3>
              <p className="text-xs text-slate-500">{t('set_farmer_sub')}</p>
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
                className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('set_phone')}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
              />
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

          {/* Any Crops Selection & Custom Addition */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                {t('auth_crops_grown_label')} (Select or add ANY crops)
              </label>
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50/70 rounded-2xl border border-slate-200">
              {allCropOptions.map((crop) => {
                const isSelected = selectedCrops.includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-agro-600 border-agro-600 text-white font-semibold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-agro-300'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : null}
                    <span>{crop}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Crop Add field */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customCropInput}
                onChange={(e) => setCustomCropInput(e.target.value)}
                placeholder="+ Type any other crop name..."
                className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:border-agro-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomCrop}
                disabled={!customCropInput.trim()}
                className="px-3 py-2 bg-agro-100 hover:bg-agro-200 disabled:opacity-40 text-agro-800 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Crop</span>
              </button>
            </div>
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
