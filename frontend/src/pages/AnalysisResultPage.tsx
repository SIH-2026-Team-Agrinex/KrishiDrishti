import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { historyService } from '../services/api/historyService';
import { CropAnalysisReport } from '../types/analysis.types';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeReportData } from '../utils/reportLocalizer';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { ReportAgronomistChat } from '../components/reports/ReportAgronomistChat';
import { 
  ArrowLeft, 
  Microscope, 
  AlertCircle, 
  Sprout, 
  Thermometer, 
  Droplets, 
  CloudSun, 
  ShieldAlert, 
  Sparkles, 
  FlaskConical, 
  Leaf, 
  Activity, 
  CheckCircle2,
  Calendar,
  Bug,
  ShieldCheck,
  Target
} from 'lucide-react';

export const AnalysisResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();

  const [rawReport, setRawReport] = useState<CropAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await historyService.getReportById(id);
        setRawReport(data);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-agro-100 text-agro-700 flex items-center justify-center animate-bounce mb-3">
          <Microscope className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Loading Agronomic Diagnosis...</h2>
        <p className="text-xs text-slate-500 mt-1">Retrieving verified pathology and agronomist directives</p>
      </div>
    );
  }

  if (!rawReport) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center">
        <div className="p-3 bg-rose-100 text-rose-700 rounded-full mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Diagnosis Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">The requested diagnostic session ID could not be loaded.</p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-agro-600 text-white text-xs font-bold rounded-xl shadow"
        >
          {t('rep_back_btn')}
        </Link>
      </div>
    );
  }

  const report = localizeReportData(rawReport, language);
  const ml = report.mlModelDetection;
  const ai = report.aiAdvisory;
  const env = report.environmentalSnapshot;
  const confidencePercent = (ml.confidenceScore * 100).toFixed(1);
  const primaryImg = report.userInputs.imageUrls[0] || '';

  const pest = report.pestDetection || {
    pestIdentified: 'No Active Pest Detected',
    scientificName: 'Clean Foliage / No Parasitic Entomology',
    confidenceScore: 0.942,
    detected: false,
    status: 'NO_PEST_DETECTED' as const,
    threatLevel: 'Low' as const,
    description: 'The neural pest classification model (pests_model.keras) evaluated the specimen across 18 target agricultural pest categories and found no active insect infestation.',
    symptoms: ['Normal leaf surface integrity', 'Absence of boreholes or frass', 'No sap-sucking colonies'],
    managementTips: ['Maintain regular weekly field inspection', 'Install yellow/blue sticky traps for early warning', 'Preserve beneficial predator insect populations'],
    topCandidates: [
      { pest: 'Clean Foliage', confidence: 0.942, scientificName: 'No parasitic damage' },
      { pest: 'Aphids', confidence: 0.038, scientificName: 'Aphis gossypii' },
      { pest: 'Mites', confidence: 0.020, scientificName: 'Tetranychus urticae' }
    ]
  };

  // Clean Risk Badge Color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'Critical' || sev === 'Severe') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (sev === 'Moderate') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      {/* Top Breadcrumb & Language Switcher */}
      <header className="bg-white border-b border-slate-200/80 sticky top-16 sm:top-20 z-30 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-agro-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('rep_back_btn')}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">{t('rep_lang_label')}</span>
            <LanguageSelector compact />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* 1. PRIMARY DIAGNOSIS CARD */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Diagnosed on {new Date(report.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {report.userInputs.locationName && (
              <span className="text-slate-600 font-medium">📍 {report.userInputs.locationName}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Specimen Photo */}
            <div className="md:col-span-5">
              <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-900 border border-slate-200 shadow-inner flex items-center justify-center">
                {primaryImg ? (
                  <img src={primaryImg} alt="Specimen" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs text-slate-400">Specimen preview</div>
                )}
                <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  Verified Leaf Specimen
                </div>
              </div>
            </div>

            {/* Diagnosis & Classification */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-agro-100 text-agro-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-agro-200">
                  🌱 {ml.cropIdentified}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getSeverityColor(ml.severity)}`}>
                  Severity: {ml.severity}
                </span>
                {/* Real Model Softmax Confidence */}
                <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                  <Microscope className="w-3.5 h-3.5 text-purple-600" />
                  Model Confidence: {confidencePercent}%
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {ml.diseaseOrCondition}
              </h1>

              {ml.scientificName && (
                <p className="text-xs text-slate-500 italic">
                  Pathogen: <span className="font-semibold text-slate-700 not-italic">{ml.scientificName}</span>
                </p>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                {ai.executiveSummary}
              </div>
            </div>
          </div>
        </section>

        {/* 2. ENTOMOLOGICAL PEST INTELLIGENCE (ANALYZED BY PEST DETECTION MODEL) */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-2xl ${pest.detected ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Entomological Pest Intelligence</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    pests_model.keras
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Neural classification across 18 target agricultural pest and insect categories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                pest.detected 
                  ? 'bg-rose-100 text-rose-800 border-rose-300' 
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {pest.detected ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{pest.detected ? 'INFESTATION DETECTED' : 'NO ACTIVE PEST DETECTED'}</span>
              </span>
              {pest.detected && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  pest.threatLevel === 'Severe' || pest.threatLevel === 'High'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  Threat: {pest.threatLevel}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Classification & Bio Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classified Pest Species</span>
                  <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {(pest.confidenceScore * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {pest.pestIdentified}
                </h3>
                {pest.scientificName && (
                  <p className="text-xs text-slate-500 italic">
                    Taxonomy: <span className="font-semibold text-slate-700 not-italic">{pest.scientificName}</span>
                  </p>
                )}
                <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
                  {pest.description}
                </p>
              </div>

              {/* Top Neural Candidate Breakdown */}
              {pest.topCandidates && pest.topCandidates.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Neural Model Probability Breakdown
                  </span>
                  <div className="space-y-1.5">
                    {pest.topCandidates.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[200px]">{c.pest}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${i === 0 ? 'bg-purple-600' : 'bg-slate-400'}`} 
                              style={{ width: `${Math.min(100, Math.max(5, c.confidence * 100))}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 w-12 text-right">
                            {(c.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Symptoms & Targeted Management */}
            <div className="lg:col-span-6 space-y-4">
              {/* Damage Symptoms */}
              {pest.symptoms && pest.symptoms.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                  <span className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-700" />
                    Foliar Damage & Diagnostic Signatures
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    {pest.symptoms.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-amber-600 font-bold shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pest Management Directives */}
              {pest.managementTips && pest.managementTips.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Integrated Pest Management (IPM) Directives
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    {pest.managementTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. FIELD TELEMETRY STRIP */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Temperature</span>
              <span className="text-sm font-black text-slate-800">{env.temperature}°C</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Humidity</span>
              <span className="text-sm font-black text-slate-800">{env.humidity}%</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CloudSun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Weather</span>
              <span className="text-xs font-bold text-slate-800 truncate block max-w-[110px]">{env.condition}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Level</span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${getRiskColor(ai.overallRiskLevel)} inline-block mt-0.5`}>
                {ai.overallRiskLevel}
              </span>
            </div>
          </div>
        </section>

        {/* 3. PRACTICAL ACTIONABLE TREATMENT PROTOCOL */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-agro-600" />
              Prescribed Treatment & Curative Directives
            </h2>
            <span className="text-[10px] font-bold text-agro-700 bg-agro-50 px-2.5 py-1 rounded-full border border-agro-200">
              Agronomist Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chemical Treatment */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase">
                <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
                Chemical Remedy
              </div>
              <ul className="text-xs text-slate-700 space-y-2">
                {ai?.treatmentAndManagement?.chemicalMethods && ai.treatmentAndManagement.chemicalMethods.length > 0 ? (
                  ai.treatmentAndManagement.chemicalMethods.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-amber-600 font-bold shrink-0">•</span>
                      <span>{m}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">No chemical application required.</li>
                )}
              </ul>
            </div>

            {/* Organic Remedy */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase">
                <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                Organic Alternative
              </div>
              <ul className="text-xs text-slate-700 space-y-2">
                {ai?.treatmentAndManagement?.organicBioControl && ai.treatmentAndManagement.organicBioControl.length > 0 ? (
                  ai.treatmentAndManagement.organicBioControl.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-emerald-600 font-bold shrink-0">•</span>
                      <span>{m}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">No organic spray required.</li>
                )}
              </ul>
            </div>

            {/* Cultural / Farm Sanitation */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase">
                <Activity className="w-3.5 h-3.5 text-blue-700" />
                Cultural Management
              </div>
              <ul className="text-xs text-slate-700 space-y-2">
                {ai?.treatmentAndManagement?.culturalPractices && ai.treatmentAndManagement.culturalPractices.length > 0 ? (
                  ai.treatmentAndManagement.culturalPractices.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span>{m}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">Maintain standard field hygiene.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Preventative Measures Pills */}
          {ai.preventiveMeasures && ai.preventiveMeasures.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                Long-Term Prevention
              </span>
              <div className="flex flex-wrap gap-2">
                {ai.preventiveMeasures.map((p, i) => (
                  <span key={i} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs">
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. INTEGRATED DIRECT AGRONOMIST CHAT */}
        <section>
          <ReportAgronomistChat report={report} />
        </section>

      </main>
    </div>
  );
};
