import React from 'react';
import type { ShotDataPoint, ChannelingEvent, FlowProfileType } from '../types/espresso';
import { AlertCircle, TrendingUp, Gauge, Sparkles } from 'lucide-react';
import { THE_GOLDEN_ZONE } from '../lib/espressoMath';
import { useTranslation } from '../i18n';

interface FlowChartProps {
  points: ShotDataPoint[];
  targetYield: number;
  channelingEvent?: ChannelingEvent;
  preInfusionSeconds?: number;
  doseGrams?: number;
  isLive?: boolean;
  method?: 'espresso' | 'pour_over';
  averageFlowGps?: number;
  flowProfile?: FlowProfileType;
  flowStabilityPercent?: number;
}

export const FlowChart: React.FC<FlowChartProps> = ({
  points,
  targetYield,
  channelingEvent,
  preInfusionSeconds,
  doseGrams = 18.0,
  isLive = false,
  method = 'espresso',
  averageFlowGps,
  flowProfile,
  flowStabilityPercent,
}) => {
  const { t, language } = useTranslation();

  // Normalize points: If non-live and curve starts with a dead flatline (>= 1.0s before first drip),
  // trim it so the chart starts cleanly at first drip (t = 0.0s)
  const { displayPoints, timeOffset } = React.useMemo(() => {
    if (isLive || points.length === 0) return { displayPoints: points, timeOffset: 0 };
    let firstDripIdx = 0;
    while (firstDripIdx < points.length && points[firstDripIdx].weightGrams < 0.3) {
      firstDripIdx++;
    }
    if (firstDripIdx > 0 && firstDripIdx < points.length) {
      const offset = points[firstDripIdx].timeSeconds;
      if (offset >= 1.0) {
        const trimmed = points.slice(firstDripIdx).map((p) => ({
          ...p,
          timeSeconds: Math.max(0, Math.round((p.timeSeconds - offset) * 10) / 10),
        }));
        return {
          displayPoints: [
            { timeSeconds: 0.0, weightGrams: 0.0, flowRateGps: 0.0 },
            ...trimmed,
          ],
          timeOffset: offset,
        };
      }
    }
    return { displayPoints: points, timeOffset: 0 };
  }, [points, isLive]);

  if (points.length === 0) {
    return (
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-6 text-center">
        <Gauge className="w-8 h-8 text-[#7A6E65]/50 mx-auto mb-2" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
          {t('chart.empty_title')}
        </h4>
        <p className="text-xs text-[#7A6E65] mt-1 max-w-sm mx-auto">
          {t('chart.empty_desc')}
        </p>
      </div>
    );
  }

  const effectivePre = timeOffset > 0 ? 0 : (preInfusionSeconds || 0);

  const isPourOver = method === 'pour_over';
  const maxTime = Math.max(isPourOver ? 180 : 30, displayPoints[displayPoints.length - 1]?.timeSeconds || (isPourOver ? 180 : 30));
  const maxWeight = Math.max(targetYield * 1.15, isPourOver ? 300 : 42);
  const maxFlow = isPourOver ? 8.0 : 4.0; // max scale for g/s

  const width = 600;
  const height = 210;
  const padLeft = 45;
  const padRight = 44; // Room for right-side flow axis
  const padTop = 22;
  const padBottom = 25;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Coordinate mappers with strict boundary clamping
  const getX = (t: number) => Math.max(padLeft, Math.min(padLeft + chartW, padLeft + (t / maxTime) * chartW));
  const getYWeight = (w: number) => Math.max(padTop, Math.min(padTop + chartH, padTop + chartH - (w / maxWeight) * chartH));
  const getYFlow = (f: number) => Math.max(padTop, Math.min(padTop + chartH, padTop + chartH - (Math.min(f, maxFlow) / maxFlow) * chartH));

  // Flow Zone band coordinates (Pour over: 4-6 g/s pacing; Espresso: 1.2-1.8 g/s golden zone)
  const goldenMinFlow = isPourOver ? 4.0 : THE_GOLDEN_ZONE.MIN_FLOW_GPS;
  const goldenMaxFlow = isPourOver ? 6.0 : THE_GOLDEN_ZONE.MAX_FLOW_GPS;
  const yGoldenTop = getYFlow(goldenMaxFlow);
  const yGoldenBottom = getYFlow(goldenMinFlow);

  // Build SVG path strings
  const weightPath = displayPoints.reduce((acc, p, idx) => {
    const x = getX(p.timeSeconds);
    const y = getYWeight(p.weightGrams);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const flowPath = displayPoints.reduce((acc, p, idx) => {
    const x = getX(p.timeSeconds);
    const y = getYFlow(p.flowRateGps);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const lastPoint = displayPoints[displayPoints.length - 1];
  const currentRatio = doseGrams > 0 && lastPoint ? (lastPoint.weightGrams / doseGrams).toFixed(1) : '0.0';

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-1.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C26D52] shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono truncate">
            {t('chart.title')}
          </span>
        </div>

        {isLive ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#C26D52]/15 text-[#C26D52] text-xs font-mono font-bold border border-[#C26D52]/30 animate-pulse shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#C26D52]" />
            <span>LIVE {isPourOver ? 'POUR OVER' : 'TELEMETRY'}</span>
          </div>
        ) : !isPourOver && channelingEvent?.detected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#C26D52]/10 text-[#C26D52] text-xs font-mono font-semibold border border-[#C26D52]/30 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#C26D52]" />
            <span className="whitespace-nowrap">
              {t('chart.channeling_spike', {
                time: channelingEvent.timestampSeconds !== undefined
                  ? Math.max(0, Math.round((channelingEvent.timestampSeconds - timeOffset) * 10) / 10)
                  : 0,
                spike: channelingEvent.flowSpikeGps ?? 0,
              })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#72806B] bg-[#72806B]/10 px-2 py-0.5 rounded border border-[#72806B]/20 shrink-0 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            <span>{isPourOver ? 'Steady Extraction' : t('chart.optimal_flow')}</span>
          </div>
        )}
      </div>

      {/* SVG Canvas with Dual Y-Axis */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono text-[10px]">
          <defs>
            <clipPath id="chart-area-clip">
              <rect x={padLeft} y={padTop} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Golden / Pacing Target Flow Band */}
          <rect
            x={padLeft}
            y={yGoldenTop}
            width={chartW}
            height={Math.max(4, yGoldenBottom - yGoldenTop)}
            fill="#D4A373"
            fillOpacity="0.20"
          />
          {/* Dashed boundary lines on target flow band */}
          <line
            x1={padLeft}
            y1={yGoldenTop}
            x2={width - padRight}
            y2={yGoldenTop}
            stroke="#D4A373"
            strokeWidth="1"
            strokeDasharray="4 3"
            strokeOpacity="0.8"
          />
          <line
            x1={padLeft}
            y1={yGoldenBottom}
            x2={width - padRight}
            y2={yGoldenBottom}
            stroke="#D4A373"
            strokeWidth="1"
            strokeDasharray="4 3"
            strokeOpacity="0.8"
          />

          {/* Crisp Target Zone Badge */}
          <g>
            <rect
              x={padLeft + 8}
              y={yGoldenTop + 4}
              width={isPourOver ? 135 : 124}
              height="15"
              rx="4"
              fill="#FFFDF9"
              fillOpacity="0.94"
              stroke="#D4A373"
              strokeWidth="0.8"
            />
            <text
              x={padLeft + 14}
              y={yGoldenTop + 15}
              fill="#8A5A2B"
              fontSize="9"
              fontWeight="bold"
            >
              {isPourOver ? '🎯 PACING (4–6 g/s)' : (language === 'da' ? '🎯 MÅL: 1.2–1.8 g/s' : '🎯 TARGET: 1.2–1.8 g/s')}
            </text>
          </g>

          {/* Left Y-Axis: Weight in grams (Dark Roast #2C2018) */}
          {(isPourOver ? [0, 100, 200, 300, 400] : [0, 15, 30, 45])
            .filter((w) => w <= maxWeight)
            .map((w) => {
              const y = getYWeight(w);
              return (
                <g key={`w-grid-${w}`}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#E8DFD5"
                    strokeDasharray="3 3"
                    strokeOpacity={0.7}
                  />
                  <text x={padLeft - 6} y={y + 3} textAnchor="end" fill="#2C2018" fontSize="9">
                    {w}g
                  </text>
                </g>
              );
            })}
          {/* Left Y-axis label */}
          <text x={padLeft - 6} y={padTop - 8} textAnchor="end" fill="#7A6E65" fontSize="8" fontWeight="bold">
            {language === 'da' ? 'VÆGT' : 'WEIGHT'}
          </text>

          {/* Right Y-Axis: Flow Rate in g/s (Terracotta #C26D52) */}
          {(isPourOver ? [0, 2, 4, 6, 8] : [0, 1, 2, 3, 4])
            .filter((f) => f <= maxFlow)
            .map((f) => {
              const y = getYFlow(f);
              return (
                <g key={`f-tick-${f}`}>
                  <line
                    x1={width - padRight}
                    y1={y}
                    x2={width - padRight + 4}
                    y2={y}
                    stroke="#C26D52"
                    strokeWidth="1.2"
                  />
                  <text x={width - padRight + 6} y={y + 3} textAnchor="start" fill="#C26D52" fontSize="9" fontWeight="bold">
                    {f}
                  </text>
                </g>
              );
            })}
          {/* Right Y-axis label */}
          <text x={width - 4} y={padTop - 8} textAnchor="end" fill="#C26D52" fontSize="8" fontWeight="bold">
            FLOW g/s
          </text>

          {/* Time markings along bottom */}
          {(isPourOver ? [0, 60, 120, 180, 240] : [0, 10, 20, 30, 40])
            .filter((t) => t <= maxTime)
            .map((t) => {
              const x = getX(t);
              const label = isPourOver && t >= 60 ? `${Math.floor(t / 60)}m` : `${t}s`;
              return (
                <g key={`t-grid-${t}`}>
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + chartH}
                    stroke="#E8DFD5"
                    strokeOpacity={0.6}
                  />
                  <text x={x} y={height - 6} textAnchor="middle" fill="#7A6E65" fontSize="9">
                    {label}
                  </text>
                </g>
              );
            })}

          {/* Pre-Infusion First Drip Vertical Divider */}
          {effectivePre > 0 && effectivePre < maxTime && (
            <g>
              <line
                x1={getX(effectivePre)}
                y1={padTop}
                x2={getX(effectivePre)}
                y2={padTop + chartH}
                stroke="#C26D52"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={getX(effectivePre) + 4}
                y={padTop + 12}
                fill="#C26D52"
                fontSize="9"
                fontWeight="bold"
              >
                {t('chart.first_drip', { time: effectivePre.toFixed(1) })}
              </text>
            </g>
          )}

          {/* Clipped Data Curves & Events Group */}
          <g clipPath="url(#chart-area-clip)">
            {/* Channeling / Surge Marker on Curve (Only for espresso) */}
            {!isPourOver &&
              channelingEvent?.detected &&
              channelingEvent.timestampSeconds &&
              channelingEvent.flowSpikeGps && (
                <g>
                  <circle
                    cx={getX(channelingEvent.timestampSeconds)}
                    cy={getYFlow(channelingEvent.flowSpikeGps)}
                    r="6"
                    fill="#B85B48"
                    stroke="#FFFDF9"
                    strokeWidth="2"
                  />
                  <text
                    x={getX(channelingEvent.timestampSeconds)}
                    y={getYFlow(channelingEvent.flowSpikeGps) - 10}
                    textAnchor="middle"
                    fill="#B85B48"
                    fontWeight="bold"
                    fontSize="9"
                  >
                    SPIKE {channelingEvent.flowSpikeGps} g/s
                  </text>
                </g>
              )}

            {/* Cumulative weight line (Espresso dark roast) */}
            <path
              d={weightPath}
              fill="none"
              stroke="#2C2018"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Flow rate line (Terracotta) */}
            <path
              d={flowPath}
              fill="none"
              stroke="#C26D52"
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />

            {/* Current cursor tip */}
            {lastPoint && (
              <g>
                {isLive && (
                  <circle
                    cx={getX(lastPoint.timeSeconds)}
                    cy={getYWeight(lastPoint.weightGrams)}
                    r="8"
                    fill="none"
                    stroke="#C26D52"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={getX(lastPoint.timeSeconds)}
                  cy={getYWeight(lastPoint.weightGrams)}
                  r="4.5"
                  fill="#C26D52"
                  stroke="#FFFDF9"
                  strokeWidth="2"
                />
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Legend & Stats */}
      <div className="mt-3 pt-3 border-t border-[#E8DFD5] flex flex-wrap items-center justify-between text-xs font-mono text-[#7A6E65] gap-2">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#2C2018] rounded-full inline-block" />
            <span>{t('chart.yield')}: {lastPoint?.weightGrams.toFixed(1) || '0.0'}g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#C26D52] rounded-full inline-block" />
            <span>
              {isLive ? t('chart.flow') : t('chart.avg_flow')}: {
                isLive
                  ? (lastPoint?.flowRateGps.toFixed(1) || '0.0')
                  : (averageFlowGps !== undefined
                      ? averageFlowGps.toFixed(2)
                      : (() => {
                          const active = points.filter((p) => p.flowRateGps > 0.1);
                          return active.length > 0
                            ? (active.reduce((acc, p) => acc + p.flowRateGps, 0) / active.length).toFixed(2)
                            : (lastPoint?.flowRateGps.toFixed(1) || '0.0');
                        })())
              } g/s
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#D4A373]/50 border border-[#D4A373] rounded-xs inline-block" />
            <span className="text-[#8A5A2B]">1.2–1.8</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#72806B]/30 rounded-xs inline-block" />
            <span className="text-[#72806B]">{t('chart.ratio')}: 1:{currentRatio}</span>
          </div>
          {flowProfile && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FAF7F2] border border-[#DECFC0] text-[#2C2018] uppercase tracking-wider font-bold">
              {flowProfile} {flowStabilityPercent !== undefined ? `(${flowStabilityPercent}%)` : ''}
            </span>
          )}
        </div>
        <div className="text-[11px]">
          {t('chart.target_dose_yield', { yield: targetYield, dose: doseGrams })}
        </div>
      </div>
    </div>
  );
};
