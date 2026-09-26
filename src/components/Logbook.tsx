import React, { useState } from 'react';
import type { ShotRecord } from '../types/espresso';
import { BookOpen, Calendar, AlertCircle, CheckCircle, Trash2, Filter, Check, X, Coffee } from 'lucide-react';

interface LogbookProps {
  shots: ShotRecord[];
  onDeleteShot?: (shotId: string) => void;
}

export const Logbook: React.FC<LogbookProps> = ({ shots, onDeleteShot }) => {
  const [selectedDrinkFilter, setSelectedDrinkFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  // Extract unique drink names recorded in the logbook
  const recordedDrinks = Array.from(
    new Set(shots.map((s) => s.drinkName || 'Double Espresso'))
  );

  const filteredShots =
    selectedDrinkFilter === 'all'
      ? shots
      : shots.filter((s) => (s.drinkName || 'Double Espresso') === selectedDrinkFilter);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      if (onDeleteShot) {
        onDeleteShot(id);
      }
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C26D52]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            Barista Extraction Logbook ({shots.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#7A6E65]">Analog Field Journal</span>
      </div>

      {/* Drink Filter Tabs Ribbon */}
      <div className="bg-[#FFFDF9] p-2.5 rounded-2xl border border-[#E8DFD5] space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7A6E65] uppercase tracking-wider font-bold">
          <Filter className="w-3 h-3 text-[#C26D52]" />
          <span>Filter by Drink:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedDrinkFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition shrink-0 ${
              selectedDrinkFilter === 'all'
                ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                : 'bg-[#FAF7F2] text-[#7A6E65] hover:bg-[#E8DFD5] border border-[#E8DFD5]'
            }`}
          >
            All Drinks ({shots.length})
          </button>
          {recordedDrinks.map((drink) => {
            const count = shots.filter((s) => (s.drinkName || 'Double Espresso') === drink).length;
            const isSelected = selectedDrinkFilter === drink;
            return (
              <button
                key={drink}
                type="button"
                onClick={() => setSelectedDrinkFilter(drink)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#C26D52] text-white font-bold shadow-xs'
                    : 'bg-[#FAF7F2] text-[#7A6E65] hover:bg-[#E8DFD5] border border-[#E8DFD5]'
                }`}
              >
                <Coffee className="w-3 h-3 opacity-70" />
                <span>{drink}</span>
                <span className="text-[10px] opacity-80 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shots List */}
      {filteredShots.length === 0 ? (
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-6 text-center font-mono">
          <p className="text-xs text-[#7A6E65]">No shots logged for "{selectedDrinkFilter}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredShots.map((shot, idx) => {
            const shotNumber = String(filteredShots.length - idx).padStart(3, '0');
            const dateStr = new Date(shot.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const drinkLabel = shot.drinkName || 'Double Espresso';
            const isConfirming = confirmDeleteId === shot.id;

            return (
              <div
                key={shot.id}
                className="bg-[#FFFDF9] rounded-xl border border-[#E8DFD5] p-4 shadow-xs hover:border-[#C26D52]/40 transition font-mono"
              >
                {/* Journal Card Header */}
                <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2 mb-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#2C2018] text-[#FAF7F2] px-2 py-0.5 rounded text-[10px] font-bold">
                      #{shotNumber}
                    </span>
                    <span className="font-bold text-[#2C2018]">{shot.coffeeName}</span>
                    <span className="bg-[#FAF7F2] border border-[#C26D52]/30 text-[#C26D52] px-2 py-0.5 rounded text-[10px] font-bold">
                      {drinkLabel}
                    </span>
                    {shot.roastLevel && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono tracking-wider font-semibold border-[#E8DFD5] bg-[#FAF7F2] text-[#7A6E65]">
                        {shot.roastLevel}
                      </span>
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-[#7A6E65]">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </div>

                    {/* Safe Delete Button */}
                    {onDeleteShot && (
                      <div className="flex items-center gap-1 ml-2">
                        {isConfirming ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1">
                            <span className="text-[10px] text-red-700 font-bold px-1">Delete?</span>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(shot.id, e)}
                              className="p-1 rounded hover:bg-red-200 text-red-700 transition"
                              title="Confirm delete"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelDelete}
                              className="p-1 rounded hover:bg-gray-200 text-[#7A6E65] transition"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(shot.id, e)}
                            className="p-1.5 rounded-lg text-[#7A6E65] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                            title="Delete this shot record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Extraction Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                  <div>
                    <div className="text-[10px] text-[#7A6E65] uppercase">Ratio</div>
                    <div className="font-semibold text-[#2C2018]">
                      {shot.doseGrams}g → {shot.actualYieldGrams}g
                    </div>
                    <div className="text-[10px] text-[#7A6E65] mt-0.5">
                      1:{(shot.doseGrams > 0 ? (shot.actualYieldGrams / shot.doseGrams).toFixed(1) : '2.0')} ratio
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A6E65] uppercase">Time & Flow</div>
                    <div className="font-semibold text-[#2C2018]">
                      {shot.totalTimeSeconds}s @ {shot.averageFlowGps}g/s
                    </div>
                    {shot.preInfusionSeconds !== undefined && (
                      <div className="text-[10px] text-[#7A6E65] mt-0.5">
                        Pre: {shot.preInfusionSeconds}s • Flow: {shot.flowTimeSeconds}s
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A6E65] uppercase">Equipment</div>
                    <div className="font-semibold text-[#2C2018]">
                      {shot.grinderName.split(' ')[0]} @ {shot.grindSetting}
                    </div>
                    {shot.machineName && (
                      <div className="text-[10px] text-[#7A6E65] truncate mt-0.5">
                        {shot.machineName}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A6E65] uppercase">Taste / Flow</div>
                    <div className="flex items-center gap-1 font-semibold capitalize text-[#2C2018]">
                      {shot.channelingDetected ? (
                        <span className="text-[#B85B48] flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3 h-3" /> Channeling
                          {shot.channeling?.flowSpikeGps ? ` (${shot.channeling.flowSpikeGps} g/s)` : ''}
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
      )}
    </div>
  );
};
