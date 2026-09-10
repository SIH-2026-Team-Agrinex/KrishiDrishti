import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  INDIA_STATE_SVG_PATHS, 
  MAP_DIMENSIONS 
} from './indiaSvgPaths';
import { 
  analyticsService, 
  HeatmapAnalyticsResponse, 
  StateTelemetry, 
  DistrictTelemetry 
} from '../../services/api/analyticsService';
import { useLocation } from '../../contexts/LocationContext';
import { 
  ShieldAlert, 
  Bug, 
  Microscope, 
  CloudRain, 
  Search, 
  ArrowLeft, 
  Sparkles, 
  Activity, 
  Thermometer, 
  Droplets, 
  ChevronRight, 
  Info,
  MapPin
} from 'lucide-react';

type MetricType = 'combined' | 'diseases' | 'pests' | 'weather';

export const IndiaHeatmapDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setManualLocation } = useLocation();

  const [analyticsData, setAnalyticsData] = useState<HeatmapAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMetric, setActiveMetric] = useState<MetricType>('combined');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtRiskFilter, setDistrictRiskFilter] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getHeatmapAnalytics();
        if (isMounted) {
          setAnalyticsData(res);
        }
      } catch (err) {
        console.error('Failed to load heatmap telemetry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map state ID to state telemetry object
  const statesMap = useMemo(() => {
    const map = new Map<string, StateTelemetry>();
    if (analyticsData?.states) {
      analyticsData.states.forEach((s) => map.set(s.id, s));
    }
    return map;
  }, [analyticsData]);

  // Selected State object
  const selectedState = useMemo(() => {
    if (!selectedStateId) return null;
    return statesMap.get(selectedStateId) || null;
  }, [selectedStateId, statesMap]);

  // Hovered State object
  const hoveredState = useMemo(() => {
    if (!hoveredStateId) return null;
    return statesMap.get(hoveredStateId) || null;
  }, [hoveredStateId, statesMap]);

  // Filtered districts for selected state
  const filteredDistricts = useMemo(() => {
    if (!selectedState) return [];
    let list = selectedState.districts || [];
    if (districtRiskFilter !== 'ALL') {
      list = list.filter((d) => d.risk_level === districtRiskFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => 
        d.name.toLowerCase().includes(q) ||
        d.top_disease.toLowerCase().includes(q) ||
        d.top_pest.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedState, districtRiskFilter, searchQuery]);

  // Get intensity score for a state based on active metric
  const getStateIntensity = (state: StateTelemetry): number => {
    switch (activeMetric) {
      case 'diseases':
        return state.disease_intensity;
      case 'pests':
        return state.pest_intensity;
      case 'weather':
        return Math.round((state.weather.humidity * 0.6) + (state.weather.rain_risk * 0.4));
      case 'combined':
      default:
        return state.overall_intensity;
    }
  };

  // Color generator for heatmap choropleth
  const getFillColor = (stateId: string): string => {
    const state = statesMap.get(stateId);
    if (!state) return '#e2e8f0'; // slate-200 default

    if (activeMetric === 'weather') {
      // Blues / Teals / Indigos for weather stress
      const score = Math.round((state.weather.humidity * 0.6) + (state.weather.rain_risk * 0.4));
      if (score >= 80) return '#0284c7'; // Sky-600
      if (score >= 65) return '#0ea5e9'; // Sky-500
      if (score >= 50) return '#38bdf8'; // Sky-400
      return '#7dd3fc'; // Sky-300
    }

    // Threat metrics (combined, diseases, pests): if state has 0 actual tests conducted, render calm neutral light green
    if (state.total_tests === 0) {
      return '#e6f4ea'; // Soft light green representing 0 tests / healthy baseline
    }

    const score = getStateIntensity(state);

    if (activeMetric === 'diseases') {
      // Warm violet / purple / crimson for fungal/viral blight
      if (score >= 80) return '#9333ea'; // Purple-600
      if (score >= 66) return '#a855f7'; // Purple-500
      if (score >= 48) return '#c084fc'; // Purple-400
      return '#34d399'; // Emerald-400
    }

    if (activeMetric === 'pests') {
      // Amber / Orange / Red for insect pest infestations
      if (score >= 80) return '#dc2626'; // Red-600
      if (score >= 66) return '#ea580c'; // Orange-600
      if (score >= 48) return '#f59e0b'; // Amber-500
      return '#10b981'; // Emerald-500
    }

    // Default 'combined' threat intensity
    if (score >= 80) return '#dc2626'; // Critical Red
    if (score >= 66) return '#f97316'; // High Orange
    if (score >= 48) return '#eab308'; // Moderate Yellow
    return '#10b981'; // Low Emerald
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200 ring-1 ring-rose-500/20';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200 ring-1 ring-amber-500/20';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 ring-1 ring-yellow-500/20';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/20';
    }
  };

  const handleStateClick = (stateId: string) => {
    const state = statesMap.get(stateId);
    if (state) {
      setSelectedStateId(stateId);
      setSearchQuery('');
      setDistrictRiskFilter('ALL');
    }
  };

  const handleDistrictAction = (district: DistrictTelemetry) => {
    if (selectedState) {
      setManualLocation(district.name, selectedState.name);
      navigate('/crop-analysis');
    }
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f8fafc] via-[#f1f7f3] to-[#e8f3ec] border-t border-agro-100 overflow-hidden">
      
      {/* Background Ambience Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[750px] bg-agro-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">

        {/* 1. Header & Live Indicator */}
        <div className="text-center max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-agro-100/90 border border-agro-300/80 text-agro-900 text-xs sm:text-sm font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <Activity className="w-4 h-4 text-agro-700" />
            <span>Live Platform Telemetry • Real Field Test Aggregation</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight">
            National Agricultural{' '}
            <span className="text-gradient-agro">Outbreak & Threat Heatmap</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Live geographic intelligence synthesized from every leaf scan, pest diagnosis, and microclimate test executed across Indian farms. Click any state to drill down into district-level field analytics.
          </p>
        </div>

        {/* 2. National KPI Summary Badges */}
        {analyticsData?.summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 max-w-5xl mx-auto">
            <div className="glass-card rounded-2xl p-4 sm:p-5 text-center border border-agro-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Field Tests Logged</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-agro-800 mt-1 font-heading">
                {analyticsData.summary.total_field_tests.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {analyticsData.summary.verified_db_tests} Verified Live Test{analyticsData.summary.verified_db_tests !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 text-center border border-rose-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">High Risk Zones</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1 font-heading">
                {analyticsData.summary.high_risk_zones_count + analyticsData.summary.critical_zones_count} States
              </div>
              <div className="text-[11px] text-rose-500 font-medium mt-0.5">Under Active Surveillance</div>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 text-center border border-sky-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">National Humidity Avg</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-700 mt-1 font-heading">
                {analyticsData.summary.national_avg_humidity}% RH
              </div>
              <div className="text-[11px] text-sky-600 font-medium mt-0.5">Spore Incubation Index</div>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 text-center border border-agro-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">States & UTs Covered</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1 font-heading">
                {analyticsData.summary.total_states_monitored} / 36
              </div>
              <div className="text-[11px] text-agro-600 font-medium mt-0.5">100% Geographic Coverage</div>
            </div>
          </div>
        )}

        {/* 3. Metric Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveMetric('combined')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMetric === 'combined'
                ? 'bg-agro-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Combined Threats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('diseases')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMetric === 'diseases'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Crop Diseases</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('pests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMetric === 'pests'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>Insect Pests</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('weather')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMetric === 'weather'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CloudRain className="w-4 h-4" />
            <span>Climate Stress</span>
          </button>
        </div>

        {/* 4. Main Interactive Canvas: Vector Map & Live Drilldown Panel */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-agro-200/80 shadow-2xl p-4 sm:p-8 lg:p-10">
          
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-agro-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Synthesizing national geospatial telemetry...</p>
            </div>
          ) : selectedState ? (
            
            /* ========================================================= */
            /* DISTRICT-WISE DRILLDOWN VIEW FOR SELECTED STATE           */
            /* ========================================================= */
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Back Button & State Title Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedStateId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-agro-700 hover:text-agro-800 bg-agro-50 hover:bg-agro-100 px-3 py-1.5 rounded-xl border border-agro-200 transition-colors cursor-pointer mb-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to National Map</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                      {selectedState.name}
                    </h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      selectedState.total_tests === 0
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : getRiskBadgeClass(selectedState.risk_level)
                    }`}>
                      {selectedState.total_tests === 0 ? '0 TESTS • BASELINE' : `${selectedState.risk_level} RISK`}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Capital: <span className="font-semibold text-slate-700">{selectedState.capital}</span> • {
                      selectedState.total_tests === 0
                        ? 'No field tests recorded yet'
                        : `${selectedState.total_tests} Field Test${selectedState.total_tests !== 1 ? 's' : ''} Conducted`
                    }
                  </p>
                </div>

                {/* State Microclimate Summary Pill */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    <span>{selectedState.weather.temperature}°C</span>
                  </div>
                  <div className="h-4 w-px bg-slate-300" />
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Droplets className="w-4 h-4 text-sky-500" />
                    <span>{selectedState.weather.humidity}% Humidity</span>
                  </div>
                  <div className="h-4 w-px bg-slate-300" />
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <CloudRain className="w-4 h-4 text-indigo-500" />
                    <span>{selectedState.weather.rain_risk}% Rain Risk</span>
                  </div>
                </div>
              </div>

              {/* State Threat Insights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                    <Microscope className="w-3.5 h-3.5" />
                    <span>Primary Disease Outbreak</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{selectedState.dominant_disease}</div>
                  <div className="text-xs text-purple-800/80">
                    Disease Intensity: <span className="font-bold">{selectedState.disease_intensity}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    <Bug className="w-3.5 h-3.5" />
                    <span>Primary Insect Pest</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{selectedState.dominant_pest}</div>
                  <div className="text-xs text-rose-800/80">
                    Pest Infestation Index: <span className="font-bold">{selectedState.pest_intensity}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                  <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Weather Assessment</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{selectedState.weather.description}</div>
                  <div className="text-xs text-sky-800/80">
                    Overall Threat Rating: <span className="font-bold">{selectedState.overall_intensity}%</span>
                  </div>
                </div>
              </div>

              {/* District Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search district, disease, or pest..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((risk) => (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => setDistrictRiskFilter(risk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        districtRiskFilter === risk
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Districts Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDistricts.length > 0 ? (
                  filteredDistricts.map((district) => (
                    <div
                      key={district.name}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-agro-400 p-5 shadow-sm hover:shadow-md transition-all space-y-4 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 group-hover:text-agro-700 transition-colors">
                            {district.name}
                          </h4>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {district.tests} Field Tests Conducted
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRiskBadgeClass(district.risk_level)}`}>
                          {district.risk_level}
                        </span>
                      </div>

                      {/* District Metrics Breakdown */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                          <span className="flex items-center gap-1 text-purple-700 font-semibold">
                            <Microscope className="w-3.5 h-3.5" /> Disease:
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[140px]" title={district.top_disease}>
                            {district.top_disease}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                          <span className="flex items-center gap-1 text-rose-700 font-semibold">
                            <Bug className="w-3.5 h-3.5" /> Pest:
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[140px]" title={district.top_pest}>
                            {district.top_pest}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                          <span className="flex items-center gap-1 text-sky-700 font-semibold">
                            <Thermometer className="w-3.5 h-3.5" /> Climate:
                          </span>
                          <span className="font-bold text-slate-800">
                            {district.temperature}°C • {district.humidity}% RH
                          </span>
                        </div>
                      </div>

                      {/* Threat Intensity Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Threat Intensity Index</span>
                          <span>{district.overall_intensity}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              district.overall_intensity >= 80 ? 'bg-rose-500' :
                              district.overall_intensity >= 66 ? 'bg-amber-500' :
                              district.overall_intensity >= 48 ? 'bg-yellow-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${district.overall_intensity}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleDistrictAction(district)}
                        className="w-full py-2.5 rounded-xl bg-agro-50 hover:bg-agro-600 text-agro-800 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Run Test in {district.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-500 space-y-2">
                    <Info className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold">No districts found matching your search or filter.</p>
                  </div>
                )}
              </div>

            </div>

          ) : (

            /* ========================================================= */
            /* ALL INDIA VECTOR HEATMAP VIEW                             */
            /* ========================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Interactive Vector SVG Map */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center relative select-none">
                
                <div className="w-full max-w-[620px] aspect-[612/696] relative">
                  <svg
                    viewBox={`0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`}
                    className="w-full h-full drop-shadow-md"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredStateId(null)}
                  >
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#047857" floodOpacity="0.4" />
                      </filter>
                    </defs>

                    {INDIA_STATE_SVG_PATHS.map((pathItem) => {
                      const isHovered = hoveredStateId === pathItem.id;
                      const fill = getFillColor(pathItem.id);

                      return (
                        <path
                          key={pathItem.id}
                          id={pathItem.id}
                          d={pathItem.d}
                          fill={fill}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2.5 : 1}
                          className={`transition-all duration-200 cursor-pointer ${
                            isHovered ? 'brightness-110 filter' : 'hover:brightness-105'
                          }`}
                          onMouseEnter={() => setHoveredStateId(pathItem.id)}
                          onClick={() => handleStateClick(pathItem.id)}
                        >
                          <title>{pathItem.title}</title>
                        </path>
                      );
                    })}
                  </svg>

                  {/* Floating Custom Glassmorphic Tooltip */}
                  {hoveredState && (
                    <div
                      className="pointer-events-none absolute z-50 transform -translate-x-1/2 -translate-y-full mb-3 transition-all duration-75"
                      style={{
                        left: `${Math.min(Math.max(tooltipPos.x, 110), MAP_DIMENSIONS.width - 110)}px`,
                        top: `${Math.max(tooltipPos.y - 12, 40)}px`,
                      }}
                    >
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 w-56 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-sm text-white font-heading">
                            {hoveredState.name}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            hoveredState.total_tests === 0 ? 'bg-slate-700 text-slate-300' :
                            hoveredState.risk_level === 'CRITICAL' ? 'bg-rose-500 text-white' :
                            hoveredState.risk_level === 'HIGH' ? 'bg-amber-500 text-slate-950' :
                            hoveredState.risk_level === 'MODERATE' ? 'bg-yellow-400 text-slate-950' : 'bg-emerald-500 text-white'
                          }`}>
                            {hoveredState.total_tests === 0 ? 'BASELINE' : hoveredState.risk_level}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Field Tests:</span>
                            <span className="font-bold text-white">
                              {hoveredState.total_tests === 0 ? '0 Tests Conducted' : `${hoveredState.total_tests} Verified Tests`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Threat Index:</span>
                            <span className={`font-bold ${hoveredState.total_tests === 0 ? 'text-slate-400' : 'text-amber-400'}`}>
                              {hoveredState.total_tests === 0 ? '0% (Baseline)' : `${getStateIntensity(hoveredState)}%`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Weather:</span>
                            <span className="font-bold text-sky-300">{hoveredState.weather.temperature}°C • {hoveredState.weather.humidity}% RH</span>
                          </div>
                          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-300 truncate">
                            {hoveredState.total_tests === 0 ? '🌿 No test records logged yet' : `🔬 ${hoveredState.dominant_disease}`}
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-agro-400 text-center pt-0.5">
                          Click state to view districts →
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend Bar */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Severity Scale:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#e6f4ea] border border-emerald-300" />
                    <span>0 Tests (Baseline)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Low (&lt;48%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Moderate (48-65%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>High (66-79%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-600" />
                    <span>Critical (&gt;80%)</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Quick Explorer & High Threat Surveillance Panel */}
              <div className="lg:col-span-4 space-y-5">
                
                <div className="bg-gradient-to-tr from-agro-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-agro-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-agro-400" />
                    <span>Active Surveillance Hotspots</span>
                  </div>
                  <h4 className="text-xl font-bold font-heading">
                    Top Priority Outbreak Zones
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    States reporting high spore migration or active pest outbreaks. Select any region below to inspect district telemetry:
                  </p>

                  <div className="space-y-2 pt-2">
                    {(() => {
                      const activeHotspots = (analyticsData?.states || [])
                        .filter((s) => s.total_tests > 0 && (s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH' || s.risk_level === 'MODERATE'))
                        .slice(0, 5);

                      if (activeHotspots.length === 0) {
                        return (
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1.5">
                            <p className="text-xs font-semibold text-slate-300">
                              No high-threat outbreaks logged yet.
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Data updates automatically as field tests and leaf scans are performed across farms.
                            </p>
                          </div>
                        );
                      }

                      return activeHotspots.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleStateClick(s.id)}
                          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-left cursor-pointer group"
                        >
                          <div>
                            <div className="font-bold text-sm text-white group-hover:text-agro-300 transition-colors">
                              {s.name}
                            </div>
                            <div className="text-[11px] text-slate-300 truncate max-w-[180px]">
                              {s.dominant_disease}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-amber-400">{s.overall_intensity}% Threat</div>
                            <div className="text-[10px] text-slate-400">{s.total_tests} test{s.total_tests !== 1 ? 's' : ''}</div>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* State Quick Dropdown Jump */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Jump Directly to State:
                  </label>
                  <select
                    value={selectedStateId || ''}
                    onChange={(e) => {
                      if (e.target.value) handleStateClick(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-agro-500 shadow-xs"
                  >
                    <option value="">-- Choose a State / UT --</option>
                    {analyticsData?.states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.total_tests} field tests - {s.risk_level})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    💡 Clicking on any state on the map or choosing from the dropdown reveals full district diagnostics, pest spread, and local weather.
                  </p>
                </div>

              </div>

            </div>

          )}

        </div>

      </div>
    </section>
  );
};
