import React from 'react';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  MapPin, 
  Activity, 
  Compass, 
  Leaf, 
  FlaskConical, 
  ShieldAlert, 
  Eye,
  Check
} from 'lucide-react';
import { VisualCardData } from '../../types/chat.types';

interface ChatVisualCardProps {
  card: VisualCardData;
}

export const ChatVisualCard: React.FC<ChatVisualCardProps> = ({ card }) => {
  if (card.type === 'weather_spray') {
    const isSuccess = card.badge?.variant === 'success';
    const isWarning = card.badge?.variant === 'warning';
    const isDanger = card.badge?.variant === 'danger';

    return (
      <div className="mt-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-3.5 shadow-sm overflow-hidden text-xs sm:text-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <CloudSun className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">{card.title}</h4>
              {card.subtitle && <p className="text-[10px] text-slate-500">{card.subtitle}</p>}
            </div>
          </div>
          {card.badge && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
              isSuccess 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : isWarning 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {isSuccess && <CheckCircle2 className="w-3 h-3" />}
              {isWarning && <AlertTriangle className="w-3 h-3" />}
              {isDanger && <XCircle className="w-3 h-3" />}
              <span>{card.badge.text}</span>
            </span>
          )}
        </div>

        {/* Telemetry Grid */}
        {card.metrics && card.metrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5">
            {card.metrics.map((m, idx) => (
              <div 
                key={idx} 
                className={`p-2 rounded-xl bg-white border ${m.alert ? 'border-amber-300 bg-amber-50/40' : 'border-slate-100'} flex flex-col justify-center`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{m.label}</span>
                  {idx === 0 && <Activity className="w-3 h-3 text-slate-400" />}
                  {idx === 1 && <Droplets className="w-3 h-3 text-sky-500" />}
                  {idx === 2 && <Wind className="w-3 h-3 text-indigo-500" />}
                  {idx === 3 && <Compass className="w-3 h-3 text-emerald-500" />}
                </div>
                <span className={`text-xs sm:text-sm font-extrabold mt-0.5 ${m.alert ? 'text-amber-700' : 'text-slate-800'}`}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Callout */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/80 text-[11px] text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="leading-tight">
            <strong>Optimal Window:</strong> Best foliar adhesion occurs under moderate humidity and wind below 12 km/h.
          </span>
        </div>
      </div>
    );
  }

  if (card.type === 'crop_disease' && card.diseaseInfo) {
    const info = card.diseaseInfo;
    const isCritical = info.severity === 'Critical' || info.severity === 'High';

    return (
      <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm overflow-hidden text-xs sm:text-sm">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Leaf className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">{info.cropName} Diagnostic</span>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">{info.diseaseName}</h4>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
            isCritical 
              ? 'bg-rose-100 text-rose-800 border-rose-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {info.severity} Severity
          </span>
        </div>

        {/* Visual Specimen Diagram */}
        <div className="my-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          {/* Stylized Leaf Diagram SVG */}
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-10 h-10 transform -rotate-12">
              <path 
                d="M50 10 C30 30 10 60 50 90 C90 60 70 30 50 10 Z" 
                fill="#34d399" 
                stroke="#059669" 
                strokeWidth="3"
              />
              <path d="M50 15 L50 85" stroke="#047857" strokeWidth="2" />
              <path d="M50 35 L35 25" stroke="#047857" strokeWidth="1.5" />
              <path d="M50 45 L65 35" stroke="#047857" strokeWidth="1.5" />
              <path d="M50 60 L30 50" stroke="#047857" strokeWidth="1.5" />
              {/* Lesions */}
              <circle cx="42" cy="40" r="4" fill="#92400e" opacity="0.85" />
              <circle cx="58" cy="55" r="5" fill="#78350f" opacity="0.9" />
              <circle cx="36" cy="65" r="3.5" fill="#92400e" opacity="0.8" />
              <circle cx="62" cy="42" r="3" fill="#b45309" opacity="0.75" />
            </svg>
            <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-emerald-800 bg-white/80 px-1 rounded">
              SPECIMEN
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-700 mb-1">Key Visual Symptoms:</p>
            <div className="flex flex-wrap gap-1">
              {info.symptoms.map((symp, sIdx) => (
                <span key={sIdx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                  • {symp}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Immediate Action */}
        <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Immediate Step: </strong>
            <span>{info.immediateAction}</span>
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'treatment_flowchart' && card.steps && card.steps.length > 0) {
    return (
      <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm overflow-hidden text-xs sm:text-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">{card.title}</h4>
            {card.subtitle && <p className="text-[10px] text-slate-500">{card.subtitle}</p>}
          </div>
        </div>

        {/* Step-by-Step Flowchart Nodes */}
        <div className="mt-2.5 space-y-2">
          {card.steps.map((st, sIdx) => {
            const isLast = sIdx === card.steps!.length - 1;
            return (
              <div key={sIdx} className="relative flex items-start gap-2.5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    st.type === 'sanitation'
                      ? 'bg-emerald-100 text-emerald-800'
                      : st.type === 'organic'
                        ? 'bg-teal-100 text-teal-800'
                        : st.type === 'chemical'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {st.step}
                  </div>
                  {!isLast && <div className="w-0.5 h-6 bg-slate-200 my-0.5" />}
                </div>

                <div className="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                      {st.type === 'sanitation' && <Leaf className="w-3 h-3 text-emerald-600" />}
                      {st.type === 'organic' && <FlaskConical className="w-3 h-3 text-teal-600" />}
                      {st.type === 'chemical' && <ShieldAlert className="w-3 h-3 text-amber-600" />}
                      {st.type === 'monitoring' && <Eye className="w-3 h-3 text-indigo-600" />}
                      {st.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (card.type === 'farm_map' && card.mapInfo) {
    const map = card.mapInfo;
    return (
      <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-900 text-white p-3.5 shadow-sm overflow-hidden text-xs sm:text-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs leading-tight">{card.title}</h4>
              <p className="text-[10px] text-slate-400">{map.locationName}</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GPS Active
          </span>
        </div>

        {/* Stylized Field Map Graphic */}
        <div className="my-2.5 h-20 rounded-xl bg-slate-800 border border-slate-700/80 relative overflow-hidden flex items-center justify-center">
          {/* Background Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />
          {/* Range rings */}
          <div className="absolute w-28 h-28 rounded-full border border-emerald-500/20" />
          <div className="absolute w-16 h-16 rounded-full border border-emerald-400/30" />
          {/* Field Marker Pin */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <MapPin className="w-4 h-4 fill-slate-950" />
            </div>
            <span className="mt-1 text-[9px] font-bold bg-slate-900/90 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
              {map.fieldZone}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-300">
          <span>Coordinates: <strong className="text-white">{map.coordinates}</strong></span>
          <span>Coverage: <strong className="text-emerald-400">{map.radiusKm} km radius</strong></span>
        </div>
      </div>
    );
  }

  return null;
};
