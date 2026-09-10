import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sparkles, 
  CloudSun, 
  Microscope, 
  ShieldCheck, 
  ArrowRight, 
  Smartphone, 
  Globe2, 
  Bot,
  Layers
} from 'lucide-react';
import { IndiaHeatmapDashboard } from '../components/analytics/IndiaHeatmapDashboard';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleAccessDashboard = async () => {
    try {
      if (!isAuthenticated) {
        await guestLogin();
      }
    } catch (err) {
      console.error('Failed to log in as guest:', err);
    } finally {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfc] overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-grid-pattern">
        
        {/* Subtle Background Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-agro-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {/* Innovation Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-agro-100/80 border border-agro-300/80 text-agro-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm animate-bounce duration-1000">
            <Sparkles className="w-4 h-4 text-agro-600" />
            <span>{t('hero_badge')}</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6 font-heading">
            {t('hero_title_1')}{' '}
            <span className="text-gradient-agro block sm:inline">
              {t('hero_title_highlight')}
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            {t('hero_desc')}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              to={isAuthenticated ? "/crop-analysis" : "/signup"}
              className="bg-gradient-to-r from-agro-700 via-agro-600 to-emerald-500 hover:from-agro-800 hover:to-emerald-600 text-white font-bold text-sm sm:text-base px-8 py-4 rounded-2xl shadow-xl shadow-agro-600/30 hover:shadow-agro-600/50 hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <Microscope className="w-5 h-5" />
              <span>{t('hero_cta_analyze')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleAccessDashboard}
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base px-8 py-4 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CloudSun className="w-5 h-5 text-sky-600" />
              <span>{t('hero_cta_explore')}</span>
            </button>
          </div>

          {/* 3 Impact Stat Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-agro-700 font-heading">96.4%</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('stat_accuracy')}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-agro-700 font-heading">10</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('stat_languages')}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-agro-700 font-heading">PWA</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('stat_pwa')}</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. INTERACTIVE PIPELINE PREVIEW */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-agro-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-agro-600 uppercase tracking-widest bg-agro-50 px-3 py-1 rounded-full border border-agro-200">
              {t('how_title')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 font-heading">
              {t('how_title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              {t('how_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 relative group hover:bg-agro-50/50 hover:border-agro-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-agro-600 text-white font-bold flex items-center justify-center text-lg mb-5 shadow-md shadow-agro-600/20 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">{t('how_step1_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('how_step1_desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 relative group hover:bg-agro-50/50 hover:border-agro-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-bold flex items-center justify-center text-lg mb-5 shadow-md shadow-sky-600/20 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">{t('how_step2_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('how_step2_desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 relative group hover:bg-agro-50/50 hover:border-agro-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center text-lg mb-5 shadow-md shadow-purple-600/20 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">{t('how_step3_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('how_step3_desc')}
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 relative group hover:bg-agro-50/50 hover:border-agro-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-lg mb-5 shadow-md shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">{t('how_step4_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('how_step4_desc')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES SHOWCASE */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-agro-600 uppercase tracking-widest bg-agro-50 px-3 py-1 rounded-full border border-agro-200">
              {t('feat_title')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 font-heading">
              {t('feat_title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              {t('feat_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="glass-card rounded-3xl p-7 space-y-4 hover:shadow-glass-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-agro-100 text-agro-700 flex items-center justify-center">
                <CloudSun className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('feat1_title')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('feat1_desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-3xl p-7 space-y-4 hover:shadow-glass-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('feat2_title')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('feat2_desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-3xl p-7 space-y-4 hover:shadow-glass-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('feat3_title')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('feat3_desc')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card rounded-3xl p-7 space-y-4 hover:shadow-glass-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('feat4_title')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('feat4_desc')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card rounded-3xl p-7 space-y-4 hover:shadow-glass-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('feat5_title')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('feat5_desc')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card rounded-3xl p-7 space-y-4 hover:shadow-glass-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('feat6_title')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('feat6_desc')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. NATIONAL OUTBREAK & CLIMATE HEATMAP ANALYTICS */}
      <IndiaHeatmapDashboard />

      {/* 5. FINAL CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-tr from-agro-900 via-agro-800 to-emerald-900 text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
          
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 font-heading">
            {t('cta_banner_title')}
          </h2>
          <p className="text-sm sm:text-base text-agro-200 max-w-xl mx-auto mb-8 leading-relaxed">
            {t('cta_banner_desc')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/crop-analysis"
              className="bg-agro-500 hover:bg-agro-400 text-agro-950 font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-lg transition-all"
            >
              {t('hero_cta_analyze')} →
            </Link>
            <button
              type="button"
              onClick={handleAccessDashboard}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-2xl border border-white/20 transition-all cursor-pointer"
            >
              {t('hero_guest_demo')}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
