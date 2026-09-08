import React from 'react';
import { Sprout, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-agro-500 flex items-center justify-center text-agro-950 font-bold">
                <Sprout className="w-5 h-5 text-slate-950" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Krishi<span className="text-agro-400">Drishti</span> AI
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {t('footer_desc')}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-agro-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('hero_badge')}</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">{t('footer_nav_title')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/#how-it-works" className="hover:text-agro-400 transition-colors">{t('nav_how_it_works')}</a></li>
              <li><a href="/#features" className="hover:text-agro-400 transition-colors">{t('nav_features')}</a></li>
              <li><a href="/dashboard" className="hover:text-agro-400 transition-colors">{t('nav_dashboard')}</a></li>
              <li><a href="/crop-analysis" className="hover:text-agro-400 transition-colors">{t('nav_crop_analysis')}</a></li>
              <li><a href="/weather" className="hover:text-agro-400 transition-colors">{t('nav_weather')}</a></li>
            </ul>
          </div>

          {/* Col 3: Trust & Transparency */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">{t('footer_transparency_title')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {t('footer_transparency_desc')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('footer_zero_secrets')}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            {t('footer_rights')}
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>{t('footer_crafted')}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};
