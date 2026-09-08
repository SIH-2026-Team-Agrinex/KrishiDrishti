import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, languages, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-full border border-agro-200 bg-white/80 backdrop-blur hover:bg-agro-50 transition-all text-slate-700 font-medium ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
        } shadow-sm`}
        aria-label="Select Language"
      >
        <Globe className="w-4 h-4 text-agro-600" />
        <span className="hidden sm:inline">{current.nativeName}</span>
        <span className="sm:hidden">{current.flag}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-agro-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Choose Language / भाषा
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-sm transition-colors hover:bg-agro-50 ${
                  language === item.code ? 'bg-agro-50/80 text-agro-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.flag}</span>
                  <div>
                    <div className="leading-tight">{item.nativeName}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{item.name}</div>
                  </div>
                </div>
                {language === item.code && <Check className="w-4 h-4 text-agro-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
