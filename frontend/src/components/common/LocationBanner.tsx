import React, { useState } from 'react';
import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { MapPin, Navigation, X, Edit3, Check } from 'lucide-react';

export const LocationBanner: React.FC = () => {
  const {
    location,
    status,
    requestCurrentLocation,
    setManualLocation,
    isPermissionBannerVisible,
    dismissPermissionBanner,
  } = useLocation();
  const { t } = useLanguage();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [inputCity, setInputCity] = useState(location.city || 'My Farm');
  const [inputState, setInputState] = useState(location.state || 'India');

  if (!isPermissionBannerVisible && status === 'granted') {
    return null;
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCity && inputCity.trim()) {
      setManualLocation(inputCity.trim(), (inputState || 'India').trim());
      setIsEditModalOpen(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-agro-900 via-agro-800 to-emerald-900 text-white px-4 py-2.5 shadow-sm text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-agro-700/60 rounded-lg flex-shrink-0">
              <MapPin className="w-4 h-4 text-agro-300 animate-pulse" />
            </div>
            <div>
              <span className="font-semibold text-agro-100">
                {status === 'granted'
                  ? `${t('loc_active')}: ${location.city}, ${location.state}`
                  : t('loc_enable_gps')}
              </span>
              <span className="hidden md:inline text-agro-300/80 ml-2">
                {status === 'granted'
                  ? `(${location.latitude.toFixed(2)}° N, ${location.longitude.toFixed(2)}° E)`
                  : t('loc_sub')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestCurrentLocation}
              disabled={status === 'loading'}
              className="bg-agro-500 hover:bg-agro-400 text-agro-950 font-bold px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Navigation className={`w-3 h-3 ${status === 'loading' ? 'animate-spin' : ''}`} />
              <span>{status === 'loading' ? t('loc_detecting') : t('loc_allow_gps')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputCity(location.city || '');
                setInputState(location.state || '');
                setIsEditModalOpen(true);
              }}
              className="bg-agro-700/80 hover:bg-agro-600 text-white font-medium px-3 py-1 rounded-full text-xs transition-colors border border-agro-600/60 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{t('loc_choose_region')}</span>
            </button>

            <button
              type="button"
              onClick={dismissPermissionBanner}
              className="text-agro-300 hover:text-white p-1 rounded-md"
              aria-label="Close banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Custom Location Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-agro-100 relative">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-agro-100 text-agro-700 rounded-2xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('loc_select_region')}</h3>
                <p className="text-xs text-slate-500">Enter your village, district or town</p>
              </div>
            </div>

            {/* Quick Live GPS Detect Action */}
            <button
              type="button"
              onClick={() => {
                requestCurrentLocation();
                setIsEditModalOpen(false);
              }}
              className="w-full flex items-center justify-between p-4 mb-4 bg-agro-50 border border-agro-200 hover:border-agro-400 rounded-2xl text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-agro-600 text-white rounded-xl group-hover:scale-105 transition-transform">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t('loc_use_live_gps')}</div>
                  <div className="text-xs text-slate-500">{t('loc_use_gps_sub')}</div>
                </div>
              </div>
            </button>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Village / District / Town
                </label>
                <input
                  type="text"
                  required
                  value={inputCity}
                  onChange={(e) => setInputCity(e.target.value)}
                  placeholder="e.g. Nashik, Bhatinda, Guntur, Bareilly..."
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  State / Region
                </label>
                <input
                  type="text"
                  value={inputState}
                  onChange={(e) => setInputState(e.target.value)}
                  placeholder="e.g. Maharashtra, Punjab, Andhra Pradesh..."
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-agro-600 hover:bg-agro-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
