import type { ShotDataPoint } from '../types/espresso';
import { AlertCircle, TrendingUp, Gauge } from 'lucide-react';

interface FlowChartProps {
  points: ShotDataPoint[];
  targetYield: number;
  channelingDetected: boolean;
}

export const FlowChart: React.FC<FlowChartProps> = ({
  points,
  targetYield,
  channelingDetected,
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
  const height = 180;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Coordinate mappers
  const getX = (t: number) => padLeft + (t / maxTime) * chartW;
  const getYWeight = (w: number) => padTop + chartH - (w / maxWeight) * chartH;
  const getYFlow = (f: number) => padTop + chartH - (Math.min(f, maxFlow) / maxFlow) * chartH;

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

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C26D52]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            Extraction Dynamics Curve
          </span>
        </div>

        {channelingDetected && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#B85B48]/10 text-[#B85B48] text-xs font-mono font-semibold border border-[#B85B48]/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Channeling Detected!
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono text-[10px]">
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
        </div>
        <div className="text-[11px]">
          Target: {targetYield}g in 27-30s
        </div>
      </div>
    </div>
  );
};
