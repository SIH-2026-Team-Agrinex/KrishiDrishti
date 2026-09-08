import React, { useState } from 'react';
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { 
  Sprout, 
  CloudSun, 
  Microscope, 
  History, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => routerLocation.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-agro-100/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-agro-700 via-agro-600 to-emerald-400 p-0.5 shadow-md shadow-agro-600/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-agro-950 rounded-[14px] flex items-center justify-center">
                <Sprout className="w-6 h-6 text-agro-400 group-hover:rotate-6 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight font-heading">
                  Krishi<span className="text-agro-600">Drishti</span>
                </span>
                <span className="bg-gradient-to-r from-agro-500 to-emerald-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                  AI
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                {t('platform_desc')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/') ? 'text-agro-700 bg-agro-50 font-semibold' : 'text-slate-600 hover:text-agro-600 hover:bg-slate-50'
                  }`}
                >
                  {t('nav_home')}
                </Link>
                <a
                  href="/#how-it-works"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-agro-600 hover:bg-slate-50 transition-colors"
                >
                  {t('nav_how_it_works')}
                </a>
                <a
                  href="/#features"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-agro-600 hover:bg-slate-50 transition-colors"
                >
                  {t('nav_features')}
                </a>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/dashboard') ? 'text-agro-700 bg-agro-50 font-semibold' : 'text-slate-600 hover:text-agro-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-agro-600" />
                  {t('nav_dashboard')}
                </Link>
                <Link
                  to="/weather"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/weather') ? 'text-agro-700 bg-agro-50 font-semibold' : 'text-slate-600 hover:text-agro-600 hover:bg-slate-50'
                  }`}
                >
                  <CloudSun className="w-4 h-4 text-sky-600" />
                  {t('nav_weather')}
                </Link>
                <Link
                  to="/crop-analysis"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive('/crop-analysis') 
                      ? 'text-white bg-agro-600 shadow-md shadow-agro-600/20' 
                      : 'text-agro-700 bg-agro-100/70 hover:bg-agro-200/70'
                  }`}
                >
                  <Microscope className="w-4 h-4" />
                  {t('nav_crop_analysis')}
                </Link>
                <Link
                  to="/history"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/history') ? 'text-agro-700 bg-agro-50 font-semibold' : 'text-slate-600 hover:text-agro-600 hover:bg-slate-50'
                  }`}
                >
                  <History className="w-4 h-4 text-slate-500" />
                  {t('nav_history')}
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Language Selector */}
            <LanguageSelector />

            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-agro-700 hover:bg-slate-100 transition-colors"
                >
                  {t('nav_login')}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-agro-600 hover:bg-agro-700 shadow-md shadow-agro-600/25 hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('nav_signup')}
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/settings"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title={t('nav_settings')}
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <div className="h-6 w-px bg-slate-200 mx-1" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-agro-100 text-agro-800 flex items-center justify-center font-bold text-xs border border-agro-300">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title={t('nav_logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-agro-100 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {!isAuthenticated ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-medium text-slate-800 hover:bg-agro-50"
              >
                {t('nav_home')}
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-base font-medium text-slate-800 hover:bg-agro-50"
              >
                {t('nav_login')}
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-semibold text-white bg-agro-600 shadow-md shadow-agro-600/20"
              >
                {t('nav_signup')}
              </Link>
            </>
          ) : (
            <>
              <div className="p-3 bg-agro-50 rounded-2xl mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-agro-600 text-white flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-agro-50 font-medium"
              >
                <LayoutDashboard className="w-5 h-5 text-agro-600" />
                {t('nav_dashboard')}
              </Link>
              <Link
                to="/weather"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-agro-50 font-medium"
              >
                <CloudSun className="w-5 h-5 text-sky-600" />
                {t('nav_weather')}
              </Link>
              <Link
                to="/crop-analysis"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-agro-600 text-white font-semibold shadow-sm"
              >
                <Microscope className="w-5 h-5 text-white" />
                {t('nav_crop_analysis')}
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-agro-50 font-medium"
              >
                <History className="w-5 h-5 text-slate-500" />
                {t('nav_history')}
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-agro-50 font-medium"
              >
                <Settings className="w-5 h-5 text-slate-500" />
                {t('nav_settings')}
              </Link>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-left mt-2"
              >
                <LogOut className="w-5 h-5" />
                {t('nav_logout')}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
