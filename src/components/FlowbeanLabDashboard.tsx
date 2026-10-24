import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FlaskConical,
  Activity,
  Layers,
  Gauge,
  Sliders,
  Sparkles,
  RefreshCw,
  Cloud,
  Check,
  Copy,
  Info,
  AlertTriangle,
  Coffee,
  TrendingDown,
  TrendingUp,
  Cpu,
  BarChart3,
} from 'lucide-react';
import {
  fetchFleetTelemetryStats,
  type FleetTelemetrySummary,
  SIMULATED_FLEET_DATASET,
} from '../lib/supabase';

export const FlowbeanLabDashboard: React.FC = () => {
  const [dataMode, setDataMode] = useState<'simulated' | 'cloud'>('simulated');
  const [stats, setStats] = useState<FleetTelemetrySummary>(SIMULATED_FLEET_DATASET);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ second: number; flowGps: number } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Parameter Tuning Sandbox Sliders
  const [co2HalflifeDays, setCo2HalflifeDays] = useState<number>(14);
  const [lightRoastOffset, setLightRoastOffset] = useState<number>(1.2);
  const [darcyAreaExponent, setDarcyAreaExponent] = useState<number>(2.0);
  const [milkRatioCompensation, setMilkRatioCompensation] = useState<number>(0.2);

  const loadData = useCallback(async (mode: 'simulated' | 'cloud') => {
    setIsLoading(true);
    try {
      const res = await fetchFleetTelemetryStats(mode === 'simulated');
      setStats(res);
    } catch (err) {
      console.warn('[FlowbeanLab] Error loading fleet stats:', err);
      setStats(SIMULATED_FLEET_DATASET);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(dataMode);
  }, [dataMode, loadData]);

  // Reactive simulation of parameter tuning impact on override rate and AI accuracy
  const tuningImpact = useMemo(() => {
    // Total distance from theoretical optimal point (15.5d, 1.4 steps, 2.02 exp, 0.25 comp)
    const optHalflife = 15.5;
    const optLight = 1.4;
    const optDarcy = 2.02;
    const optMilk = 0.25;

    const optScore =
      Math.abs(co2HalflifeDays - optHalflife) * 0.35 +
      Math.abs(lightRoastOffset - optLight) * 2.2 +
      Math.abs(darcyAreaExponent - optDarcy) * 7.5 +
      Math.abs(milkRatioCompensation - optMilk) * 4.5;

    // Estimated reduction in user override rate (baseline 11.4%)
    const baselineOverride = stats.userOverrideRatePercent;
    const estimatedOverride = Math.max(
      6.2,
      Math.min(22.0, Math.round((7.8 + optScore) * 10) / 10)
    );
    const overrideDelta = Math.round((estimatedOverride - baselineOverride) * 10) / 10;

    // Estimated AI accuracy
    const baselineAccuracy = stats.aiAccuracyPercent;
    const estimatedAccuracy = Math.max(
      82.0,
      Math.min(96.8, Math.round((96.5 - optScore * 1.4) * 10) / 10)
    );
    const accuracyDelta = Math.round((estimatedAccuracy - baselineAccuracy) * 10) / 10;

    return {
      estimatedOverride,
      overrideDelta,
      estimatedAccuracy,
      accuracyDelta,
      isBetter: overrideDelta < 0 && accuracyDelta > 0,
    };
  }, [co2HalflifeDays, lightRoastOffset, darcyAreaExponent, milkRatioCompensation, stats]);

  // Handle Export Tuning JSON
  const handleExportJson = () => {
    const config = {
      math_version: 'v1.21.10-lab',
      timestamp: new Date().toISOString(),
      tuning_parameters: {
        co2_degas_halflife_days: co2HalflifeDays,
        light_roast_resistance_steps: lightRoastOffset,
        darcy_ergun_area_exponent: darcyAreaExponent,
        milk_ratio_compensation: milkRatioCompensation,
      },
      projected_metrics: {
        projected_override_rate_pct: tuningImpact.estimatedOverride,
        projected_ai_accuracy_pct: tuningImpact.estimatedAccuracy,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 3000);
  };

  // SVG Flow Curve Dimensions
  const curvePoints = stats.avgFlowCurve1Hz;
  const maxSecond = Math.max(...curvePoints.map((p) => p.second), 32);
  const maxFlow = 2.0; // g/s ceiling

  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const getSvgX = (sec: number) =>
    paddingX + (sec / maxSecond) * (svgWidth - paddingX * 2);
  const getSvgY = (flow: number) =>
    svgHeight - paddingY - (flow / maxFlow) * (svgHeight - paddingY * 2);

  const pathD = useMemo(() => {
    if (!curvePoints || curvePoints.length === 0) return '';
    return curvePoints.reduce((acc, pt, idx) => {
      const x = getSvgX(pt.second);
      const y = getSvgY(pt.flowGps);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [curvePoints]);

  const areaD = useMemo(() => {
    if (!curvePoints || curvePoints.length === 0) return '';
    const firstX = getSvgX(curvePoints[0].second);
    const lastX = getSvgX(curvePoints[curvePoints.length - 1].second);
    const baselineY = getSvgY(0);
    return `${pathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [pathD, curvePoints]);

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-[#2C2018]">
      {/* Top Banner / Mode Toggle */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2C2018] text-[#C26D52] flex items-center justify-center shrink-0 shadow-sm">
              <FlaskConical className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-serif text-[#2C2018] tracking-tight">
                  Flowbean Lab & Fleet Intelligence
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#C26D52]/10 text-[#C26D52] border border-[#C26D52]/30">
                  Forskningspanel
                </span>
              </div>
              <p className="text-xs text-[#7A6E65] font-sans mt-0.5">
                Kvantitativ og kvalitativ væskemekanik for specialty coffee baseret på anonyme &lt;450 bytes telemetrivektorer.
              </p>
            </div>
          </div>

          {/* Toggle Button Group */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="inline-flex p-1 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5]">
              <button
                type="button"
                onClick={() => setDataMode('simulated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  dataMode === 'simulated'
                    ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                    : 'text-[#7A6E65] hover:text-[#2C2018]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Simulation (1.420 skud)</span>
              </button>
              <button
                type="button"
                onClick={() => setDataMode('cloud')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  dataMode === 'cloud'
                    ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                    : 'text-[#7A6E65] hover:text-[#2C2018]'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-[#72806B]" />
                <span>Sky-Telemetri (Live)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => void loadData(dataMode)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white border border-[#E8DFD5] text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#FAF7F2] transition disabled:opacity-50"
              title="Genindlæs telemetri"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#C26D52]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Callout */}
        <div className="mt-4 pt-4 border-t border-[#E8DFD5]/60 flex flex-wrap items-center justify-between text-xs text-[#7A6E65] gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                stats.isSimulated ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'
              }`}
            />
            <span className="font-medium">
              {stats.isSimulated
                ? 'Bruger benchmark-datasæt med 1.420 validerede skud fra 4 kurvediametre.'
                : 'Forbundet til Supabase fleet_shot_telemetry tabellen i skyen.'}
            </span>
          </div>
          <span className="text-[11px] text-[#7A6E65]/80">
            Datatæthed: 1.0 Hz Flowkurver &bull; Zero PII &bull; Privacy-Safe
          </span>
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Shots */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-[10px] uppercase font-bold">Total Skud</span>
            <Activity className="w-3.5 h-3.5 text-[#C26D52]" />
          </div>
          <div className="text-xl font-bold text-[#2C2018]">
            {stats.totalShots.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#7A6E65]">
            {stats.isSimulated ? 'Laboratorie-baseline' : 'Live i skyen'}
          </div>
        </div>

        {/* Avg Brew Time */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-[10px] uppercase font-bold">Gns. Tid</span>
            <Gauge className="w-3.5 h-3.5 text-[#72806B]" />
          </div>
          <div className="text-xl font-bold text-[#2C2018]">
            {stats.avgBrewTimeS.toFixed(1)}s
          </div>
          <div className="text-[10px] text-[#7A6E65]">
            Pre-inf: {stats.avgPreInfusionS.toFixed(1)}s
          </div>
        </div>

        {/* Ratio & Yield */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-[10px] uppercase font-bold">Gns. Ratio</span>
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-[#2C2018]">
            1:{stats.avgRatio.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#7A6E65]">
            {stats.avgDoseG.toFixed(1)}g &rarr; {stats.avgYieldG.toFixed(1)}g
          </div>
        </div>

        {/* Channeling Rate */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-[10px] uppercase font-bold">Kanalisering</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#C26D52]" />
          </div>
          <div className="text-xl font-bold text-[#C26D52]">
            {stats.channelingRatePercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#7A6E65]">
            Flow spike &gt; 2.2 g/s
          </div>
        </div>

        {/* AI Accuracy */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-[10px] uppercase font-bold">AI Præcision</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {stats.aiAccuracyPercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#7A6E65]">
            Indenfor &plusmn;1.5s target
          </div>
        </div>

        {/* User Override Rate */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-[10px] uppercase font-bold">Overstyring</span>
            <Sliders className="w-3.5 h-3.5 text-[#2C2018]" />
          </div>
          <div className="text-xl font-bold text-[#2C2018]">
            {stats.userOverrideRatePercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#7A6E65]">
            Barista justerede slider
          </div>
        </div>
      </div>

      {/* Basket Geometry & Darcy-Ergun Fluid Mechanics Comparison */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C26D52]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C2018]">
              Kurvegeometri &amp; Darcy-Ergun Modstand (R &prop; Dosis / A&sup2;)
            </h3>
          </div>
          <span className="text-[11px] text-[#7A6E65]">
            Sammenligning af flow og kanalisering på tværs af kurvediametre
          </span>
        </div>

        {/* Formula Explainer Callout */}
        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs text-[#7A6E65] space-y-1 font-sans">
          <div className="font-bold font-mono text-[#2C2018] flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#C26D52]" />
            <span>Væskemekanisk forklaring: Hvorfor opfører 51 mm og 58 mm sig forskelligt?</span>
          </div>
          <p className="leading-relaxed">
            I en <strong>51 mm kurve</strong> (De&apos;Longhi Dedica) er tværsnitsarealet A &asymp; 20.4 cm&sup2;, mens en <strong>58 mm kurve</strong> har A &asymp; 26.4 cm&sup2;. Da hydraulisk modstand er omvendt proportional med <em>arealet i anden potens</em> (A&sup2;), resulterer 18g kaffe i en markant højere puck og op til <strong>+67% hydraulisk modstand</strong> i 51 mm, hvilket afspejles i flådens højere kanaliseringsrate ({stats.basketBreakdown.find((b) => b.diameterMm === 51)?.channelingPercent ?? 26.5}%).
          </p>
        </div>

        {/* 4 Basket Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.basketBreakdown.map((b) => {
            // Theoretical resistance relative to 58mm
            const area58 = Math.PI * Math.pow(58 / 20, 2);
            const areaCurrent = Math.PI * Math.pow(b.diameterMm / 20, 2);
            const relResistance = Math.pow(area58 / areaCurrent, 2);

            return (
              <div
                key={b.diameterMm}
                className="p-4 rounded-xl border border-[#E8DFD5] bg-white space-y-3 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: b.color }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2C2018]">{b.label}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white font-mono"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.diameterMm} mm
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E8DFD5]/60">
                  <div>
                    <div className="text-[10px] text-[#7A6E65]">Modstands-faktor</div>
                    <div className="font-bold text-[#2C2018]">
                      {relResistance.toFixed(2)}x
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A6E65]">Gns. Flow</div>
                    <div className="font-bold text-[#2C2018]">
                      {b.avgFlowGps.toFixed(2)} g/s
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A6E65]">Kanalisering</div>
                    <div
                      className={`font-bold ${
                        b.channelingPercent > 15 ? 'text-[#C26D52]' : 'text-[#72806B]'
                      }`}
                    >
                      {b.channelingPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A6E65]">Datapunkter</div>
                    <div className="font-bold text-[#7A6E65]">
                      {b.shotsCount} skud
                    </div>
                  </div>
                </div>

                {/* Progress bar visualising channeling risk */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-[#7A6E65]">
                    <span>Kanaliseringsrisiko</span>
                    <span>{b.channelingPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DFD5]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, b.channelingPercent * 2.5)}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flådens Gns. 1Hz Flowkurve Spektrogram (SVG) */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C26D52]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C2018]">
              Flådens Gns. 1Hz Flowkurve Profil (0 til {maxSecond} sekunder)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C26D52]" />
              <span className="text-[#7A6E65]">Target Flow (1.4 - 1.5 g/s)</span>
            </div>
            {hoveredPoint && (
              <span className="text-[#2C2018] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFD5]">
                t = {hoveredPoint.second}s: {hoveredPoint.flowGps.toFixed(2)} g/s
              </span>
            )}
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-60"
            style={{ minWidth: '600px' }}
          >
            <defs>
              <linearGradient id="labFlowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C26D52" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#C26D52" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#C26D52" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines */}
            {[0.5, 1.0, 1.5, 2.0].map((flow) => {
              const y = getSvgY(flow);
              return (
                <g key={flow}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#E8DFD5"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#7A6E65"
                    fontFamily="monospace"
                  >
                    {flow.toFixed(1)}g/s
                  </text>
                </g>
              );
            })}

            {/* Time markers on x-axis */}
            {[0, 5, 10, 15, 20, 25, 30].map((sec) => {
              const x = getSvgX(sec);
              return (
                <g key={sec}>
                  <line
                    x1={x}
                    y1={svgHeight - paddingY}
                    x2={x}
                    y2={svgHeight - paddingY + 5}
                    stroke="#7A6E65"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={svgHeight - paddingY + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#7A6E65"
                    fontFamily="monospace"
                  >
                    {sec}s
                  </text>
                </g>
              );
            })}

            {/* Extraction Phase Annotations */}
            {/* Pre-infusion box */}
            <rect
              x={getSvgX(0)}
              y={paddingY}
              width={getSvgX(5) - getSvgX(0)}
              height={svgHeight - paddingY * 2}
              fill="#72806B"
              fillOpacity="0.06"
            />
            <text
              x={getSvgX(2.5)}
              y={paddingY + 14}
              textAnchor="middle"
              fontSize="8"
              fill="#72806B"
              fontWeight="bold"
              fontFamily="monospace"
            >
              PRE-INFUSION
            </text>

            {/* Peak extraction box */}
            <rect
              x={getSvgX(5)}
              y={paddingY}
              width={getSvgX(20) - getSvgX(5)}
              height={svgHeight - paddingY * 2}
              fill="#C26D52"
              fillOpacity="0.04"
            />
            <text
              x={getSvgX(12.5)}
              y={paddingY + 14}
              textAnchor="middle"
              fontSize="8"
              fill="#C26D52"
              fontWeight="bold"
              fontFamily="monospace"
            >
              PEAK EKSTRAKTION (1.4-1.5 g/s)
            </text>

            {/* Puck erosion box */}
            <rect
              x={getSvgX(20)}
              y={paddingY}
              width={getSvgX(32) - getSvgX(20)}
              height={svgHeight - paddingY * 2}
              fill="#2C2018"
              fillOpacity="0.04"
            />
            <text
              x={getSvgX(26)}
              y={paddingY + 14}
              textAnchor="middle"
              fontSize="8"
              fill="#7A6E65"
              fontWeight="bold"
              fontFamily="monospace"
            >
              EROSION / SLUT
            </text>

            {/* Filled Area */}
            <path d={areaD} fill="url(#labFlowGradient)" />

            {/* Stroke Curve */}
            <path
              d={pathD}
              fill="none"
              stroke="#C26D52"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Circles on points */}
            {curvePoints.map((pt) => {
              const cx = getSvgX(pt.second);
              const cy = getSvgY(pt.flowGps);
              const isHovered = hoveredPoint?.second === pt.second;

              return (
                <g key={pt.second}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 2.5}
                    fill={isHovered ? '#2C2018' : '#C26D52'}
                    stroke="#FFFDF9"
                    strokeWidth={isHovered ? 2 : 1}
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Top Equipment in Fleet (Machines & Grinders Split View) */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8DFD5] pb-3">
          <Coffee className="w-4 h-4 text-[#C26D52]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C2018]">
            Flådens Mest Udbredte Udstyr (Vægtet Modstands-Grundlag)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Machines */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#7A6E65] uppercase flex items-center justify-between">
              <span>Espressomaskiner & Bryggere</span>
              <span>Andel (%)</span>
            </div>
            <div className="space-y-2">
              {stats.topEquipment
                .filter((e) => e.type === 'machine')
                .map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#2C2018]">{m.name}</span>
                      <span className="text-[#7A6E65] font-mono">
                        {m.sharePercent}% ({m.shotsCount} skud)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DFD5]">
                      <div
                        className="h-full bg-[#2C2018] rounded-full transition-all"
                        style={{ width: `${Math.min(100, m.sharePercent * 2.5)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Grinders */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#7A6E65] uppercase flex items-center justify-between">
              <span>Kaffekværne</span>
              <span>Andel (%)</span>
            </div>
            <div className="space-y-2">
              {stats.topEquipment
                .filter((e) => e.type === 'grinder')
                .map((g) => (
                  <div key={g.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#2C2018]">{g.name}</span>
                      <span className="text-[#7A6E65] font-mono">
                        {g.sharePercent}% ({g.shotsCount} skud)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DFD5]">
                      <div
                        className="h-full bg-[#C26D52] rounded-full transition-all"
                        style={{ width: `${Math.min(100, g.sharePercent * 2.5)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Remote Parameter Tuning Sandbox */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#C26D52]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C2018]">
              Remote Parameter Tuning Sandbox
            </h3>
          </div>
          <span className="text-[11px] text-[#7A6E65]">
            Simuler effekten af ændrede matematiske konstanter før release
          </span>
        </div>

        {/* 4 Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Slider 1: CO2 Halflife */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2C2018]">
                CO₂ Degas Halveringstid
              </span>
              <span className="font-bold text-[#C26D52] px-2 py-0.5 rounded-md bg-white border border-[#E8DFD5]">
                {co2HalflifeDays} dage
              </span>
            </div>
            <input
              type="range"
              min={7}
              max={28}
              step={1}
              value={co2HalflifeDays}
              onChange={(e) => setCo2HalflifeDays(Number(e.target.value))}
              className="w-full accent-[#C26D52] cursor-pointer"
            />
            <p className="text-[10px] text-[#7A6E65] font-sans">
              Hvor hurtigt bønnen taber modstand over tid efter ristning. Standard er 14 dage.
            </p>
          </div>

          {/* Slider 2: Light Roast Resistance Offset */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2C2018]">
                Lysristet Modstands-Offset
              </span>
              <span className="font-bold text-[#C26D52] px-2 py-0.5 rounded-md bg-white border border-[#E8DFD5]">
                +{lightRoastOffset.toFixed(1)} trin
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={3.0}
              step={0.1}
              value={lightRoastOffset}
              onChange={(e) => setLightRoastOffset(Number(e.target.value))}
              className="w-full accent-[#C26D52] cursor-pointer"
            />
            <p className="text-[10px] text-[#7A6E65] font-sans">
              Hvor mange trin finere lysristede bønner anbefales for at modvirke høj celledensitet.
            </p>
          </div>

          {/* Slider 3: Darcy-Ergun Area Exponent */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2C2018]">
                Darcy-Ergun Areal-Eksponent ($A^n$)
              </span>
              <span className="font-bold text-[#C26D52] px-2 py-0.5 rounded-md bg-white border border-[#E8DFD5]">
                {darcyAreaExponent.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={1.5}
              max={2.5}
              step={0.05}
              value={darcyAreaExponent}
              onChange={(e) => setDarcyAreaExponent(Number(e.target.value))}
              className="w-full accent-[#C26D52] cursor-pointer"
            />
            <p className="text-[10px] text-[#7A6E65] font-sans">
              Teoretisk $n=2.0$ ($R \propto 1/A^2$). Justering korrigerer for sidevægsfriktion i smalle kurve.
            </p>
          </div>

          {/* Slider 4: Milk Ratio Compensation */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2C2018]">
                Mælkedrik Ratio-Offset (Flat White / Cortado)
              </span>
              <span className="font-bold text-[#C26D52] px-2 py-0.5 rounded-md bg-white border border-[#E8DFD5]">
                +{milkRatioCompensation.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.5}
              step={0.05}
              value={milkRatioCompensation}
              onChange={(e) => setMilkRatioCompensation(Number(e.target.value))}
              className="w-full accent-[#C26D52] cursor-pointer"
            />
            <p className="text-[10px] text-[#7A6E65] font-sans">
              Øger yield en smule ved mælkedrikke for at skære bedre igennem fedtmolekylerne i mælken.
            </p>
          </div>
        </div>

        {/* Real-time Projected Impact Box */}
        <div className="p-4 rounded-xl border border-[#C26D52]/30 bg-[#C26D52]/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C26D52]" />
              <span className="text-xs font-bold text-[#2C2018]">
                Simuleret Flåde-Respons ved Disse Parametre:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[#7A6E65]">Forventet Overstyring:</span>
                <span className="font-bold text-[#2C2018]">
                  {tuningImpact.estimatedOverride}%
                </span>
                <span
                  className={`text-[10px] font-bold flex items-center ${
                    tuningImpact.overrideDelta <= 0 ? 'text-emerald-700' : 'text-[#C26D52]'
                  }`}
                >
                  {tuningImpact.overrideDelta <= 0 ? (
                    <TrendingDown className="w-3 h-3 inline" />
                  ) : (
                    <TrendingUp className="w-3 h-3 inline" />
                  )}
                  {tuningImpact.overrideDelta > 0 ? '+' : ''}
                  {tuningImpact.overrideDelta}%
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#7A6E65]">Forventet AI-Præcision:</span>
                <span className="font-bold text-[#2C2018]">
                  {tuningImpact.estimatedAccuracy}%
                </span>
                <span
                  className={`text-[10px] font-bold flex items-center ${
                    tuningImpact.accuracyDelta >= 0 ? 'text-emerald-700' : 'text-[#C26D52]'
                  }`}
                >
                  {tuningImpact.accuracyDelta >= 0 ? (
                    <TrendingUp className="w-3 h-3 inline" />
                  ) : (
                    <TrendingDown className="w-3 h-3 inline" />
                  )}
                  {tuningImpact.accuracyDelta > 0 ? '+' : ''}
                  {tuningImpact.accuracyDelta}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kopieret til udklipsholder!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#C26D52]" />
                  <span>Eksporter Parametre (JSON)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
