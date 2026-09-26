import React from 'react';
import type { ShotDataPoint, ChannelingEvent } from '../types/espresso';
import { AlertCircle, TrendingUp, Gauge, Sparkles } from 'lucide-react';
import { THE_GOLDEN_ZONE } from '../lib/espressoMath';

interface FlowChartProps {
  points: ShotDataPoint[];
  targetYield: number;
  channelingEvent?: ChannelingEvent;
  preInfusionSeconds?: number;
  doseGrams?: number;
}

export const FlowChart: React.FC<FlowChartProps> = ({
  points,
  targetYield,
  channelingEvent,
  preInfusionSeconds,
  doseGrams = 18.0,
}) => {
  if (points.length === 0) {
    return (
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-6 text-center">
        <Gauge className="w-8 h-8 text-[#7A6E65]/50 mx-auto mb-2" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
          Extraction Curve & Flow Dynamics
        </h4>
        <p className="text-xs text-[#7A6E65] mt-1 max-w-sm mx-auto">
          Start a shot to observe real-time flow rate (g/s) and detect channeling spikes mathematically.
        </p>
      </div>
    );
  }

  const maxTime = Math.max(30, points[points.length - 1]?.timeSeconds || 30);
  const maxWeight = Math.max(targetYield * 1.15, 42);
  const maxFlow = 4.0; // max scale for g/s

  const width = 600;
  const height = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 25;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Coordinate mappers
  const getX = (t: number) => padLeft + (t / maxTime) * chartW;
  const getYWeight = (w: number) => padTop + chartH - (w / maxWeight) * chartH;
  const getYFlow = (f: number) => padTop + chartH - (Math.min(f, maxFlow) / maxFlow) * chartH;

  // Golden Zone band coordinates
  const yGoldenTop = getYFlow(THE_GOLDEN_ZONE.MAX_FLOW_GPS);
  const yGoldenBottom = getYFlow(THE_GOLDEN_ZONE.MIN_FLOW_GPS);

  // Build SVG path strings
  const weightPath = points.reduce((acc, p, idx) => {
    const x = getX(p.timeSeconds);
    const y = getYWeight(p.weightGrams);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const flowPath = points.reduce((acc, p, idx) => {
    const x = getX(p.timeSeconds);
    const y = getYFlow(p.flowRateGps);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const lastPoint = points[points.length - 1];
  const currentRatio = doseGrams > 0 && lastPoint ? (lastPoint.weightGrams / doseGrams).toFixed(1) : '0.0';

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C26D52]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            Extraction Dynamics Curve
          </span>
        </div>

        {channelingEvent?.detected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#B85B48]/10 text-[#B85B48] text-xs font-mono font-semibold border border-[#B85B48]/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>
              Channeling @ {channelingEvent.timestampSeconds}s ({channelingEvent.flowSpikeGps} g/s)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#72806B] bg-[#72806B]/10 px-2 py-0.5 rounded border border-[#72806B]/20">
            <Sparkles className="w-3 h-3" />
            <span>Optimal Flow Profile</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono text-[10px]">
          {/* Golden Zone Flow Band (1.2 to 1.6 g/s) */}
          <rect
            x={padLeft}
            y={yGoldenTop}
            width={chartW}
            height={yGoldenBottom - yGoldenTop}
            fill="#72806B"
            fillOpacity="0.12"
          />
          <text
            x={width - padRight - 6}
            y={yGoldenTop + 10}
            textAnchor="end"
            fill="#72806B"
            fontSize="9"
            fontWeight="bold"
            opacity="0.8"
          >
            GOLDEN ZONE (1.2–1.6 g/s)
          </text>

          {/* Horizontal grid lines */}
          {[0, 15, 30, 45].map((w) => {
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
                />
                <text x={padLeft - 6} y={y + 3} textAnchor="end" fill="#7A6E65">
                  {w}g
                </text>
              </g>
            );
          })}

          {/* Time markings */}
          {[0, 10, 20, 30].map((t) => {
            const x = getX(t);
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
                <text x={x} y={height - 6} textAnchor="middle" fill="#7A6E65">
                  {t}s
                </text>
              </g>
            );
          })}

          {/* Pre-Infusion First Drip Vertical Divider */}
          {preInfusionSeconds && preInfusionSeconds > 0 && preInfusionSeconds < maxTime && (
            <g>
              <line
                x1={getX(preInfusionSeconds)}
                y1={padTop}
                x2={getX(preInfusionSeconds)}
                y2={padTop + chartH}
                stroke="#C26D52"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={getX(preInfusionSeconds) + 4}
                y={padTop + 12}
                fill="#C26D52"
                fontSize="9"
                fontWeight="bold"
              >
                First Drip ({preInfusionSeconds.toFixed(1)}s)
              </text>
            </g>
          )}

          {/* Channeling Marker on Curve */}
          {channelingEvent?.detected &&
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
            <circle
              cx={getX(lastPoint.timeSeconds)}
              cy={getYWeight(lastPoint.weightGrams)}
              r="4"
              fill="#C26D52"
              stroke="#FFFDF9"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* Legend & Stats */}
      <div className="mt-3 pt-3 border-t border-[#E8DFD5] flex flex-wrap items-center justify-between text-xs font-mono text-[#7A6E65]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#2C2018] rounded-full inline-block" />
            <span>Yield: {lastPoint?.weightGrams.toFixed(1) || '0.0'}g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#C26D52] rounded-full inline-block" />
            <span>Flow: {lastPoint?.flowRateGps.toFixed(1) || '0.0'} g/s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#72806B]/30 rounded-xs inline-block" />
            <span className="text-[#72806B]">Ratio: 1:{currentRatio}</span>
          </div>
        </div>
        <div className="text-[11px]">
          Target: {targetYield}g (Dose {doseGrams}g)
        </div>
      </div>
    </div>
  );
};
