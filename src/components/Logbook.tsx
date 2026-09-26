import type { ShotRecord } from '../types/espresso';
import { BookOpen, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface LogbookProps {
  shots: ShotRecord[];
}

export const Logbook: React.FC<LogbookProps> = ({ shots }) => {
  if (shots.length === 0) {
    return (
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-8 text-center">
        <BookOpen className="w-8 h-8 text-[#7A6E65]/40 mx-auto mb-2" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
          Logbook Empty
        </h4>
        <p className="text-xs text-[#7A6E65] mt-1">
          Brew your first espresso shot to record extraction dynamics and dial-in history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C26D52]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            Barista Extraction Logbook ({shots.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#7A6E65]">Analog Field Journal</span>
      </div>

      <div className="space-y-3">
        {shots.map((shot, idx) => {
          const shotNumber = String(shots.length - idx).padStart(3, '0');
          const dateStr = new Date(shot.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={shot.id}
              className="bg-[#FFFDF9] rounded-xl border border-[#E8DFD5] p-4 shadow-xs hover:border-[#C26D52]/40 transition font-mono"
            >
              {/* Journal Card Header */}
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-[#2C2018] text-[#FAF7F2] px-2 py-0.5 rounded text-[10px] font-bold">
                    #{shotNumber}
                  </span>
                  <span className="font-bold text-[#2C2018]">{shot.coffeeName}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#7A6E65]">
                  <Calendar className="w-3 h-3" />
                  <span>{dateStr}</span>
                </div>
              </div>

              {/* Extraction Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                <div>
                  <div className="text-[10px] text-[#7A6E65] uppercase">Ratio</div>
                  <div className="font-semibold text-[#2C2018]">
                    {shot.doseGrams}g → {shot.actualYieldGrams}g
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#7A6E65] uppercase">Time & Flow</div>
                  <div className="font-semibold text-[#2C2018]">
                    {shot.totalTimeSeconds}s @ {shot.averageFlowGps}g/s
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#7A6E65] uppercase">Grinder</div>
                  <div className="font-semibold text-[#2C2018]">
                    {shot.grinderName.split(' ')[0]} @ {shot.grindSetting}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#7A6E65] uppercase">Taste / Flow</div>
                  <div className="flex items-center gap-1 font-semibold capitalize text-[#2C2018]">
                    {shot.channelingDetected ? (
                      <span className="text-[#B85B48] flex items-center gap-1 text-[11px]">
                        <AlertCircle className="w-3 h-3" /> Channeling
                      </span>
                    ) : (
                      <span className="text-[#72806B] flex items-center gap-1 text-[11px]">
                        <CheckCircle className="w-3 h-3" /> {shot.tasteRating || 'Balanced'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {shot.notes && (
                <div className="mt-2 pt-2 border-t border-[#E8DFD5]/60 text-[11px] text-[#7A6E65] italic">
                  "{shot.notes}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
