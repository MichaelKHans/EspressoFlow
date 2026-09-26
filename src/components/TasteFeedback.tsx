import React, { useState } from 'react';
import type { TasteRating, ShotRecord } from '../types/espresso';
import { generateDialInAdvice, type DialInAdvice } from '../lib/espressoMath';
import { Sparkles, Sliders, Check, BookmarkPlus, Clock, AlertCircle } from 'lucide-react';

interface TasteFeedbackProps {
  lastShot: ShotRecord;
  onSaveWithFeedback: (taste: TasteRating, notes: string) => void;
}

export const TasteFeedback: React.FC<TasteFeedbackProps> = ({
  lastShot,
  onSaveWithFeedback,
}) => {
  const [selectedTaste, setSelectedTaste] = useState<TasteRating>('balanced');
  const [notes, setNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const advice: DialInAdvice = generateDialInAdvice(
    lastShot.totalTimeSeconds,
    lastShot.doseGrams,
    lastShot.actualYieldGrams,
    lastShot.channeling || lastShot.channelingDetected,
    selectedTaste,
    lastShot.preInfusionSeconds,
    lastShot.roastLevel
  );

  const handleSave = () => {
    onSaveWithFeedback(selectedTaste, notes);
    setIsSaved(true);
  };

  const tasteOptions: { key: TasteRating; label: string; desc: string }[] = [
    { key: 'sour', label: 'Sour / Sharp', desc: 'Under-extracted, grassy, lacking sweetness' },
    { key: 'balanced', label: 'Sweet & Balanced', desc: 'Syrupy body, bright acidity, lingering finish' },
    { key: 'bitter', label: 'Bitter / Astringent', desc: 'Over-extracted, drying mouthfeel, harsh' },
    { key: 'watery', label: 'Watery / Thin', desc: 'Weak concentration, low crema volume' },
  ];

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C26D52]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            Barista Dial-In & Taste Feedback
          </h3>
        </div>
        <div className="text-[11px] font-mono text-[#7A6E65] flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>
            {lastShot.totalTimeSeconds}s total ({lastShot.preInfusionSeconds}s pre + {lastShot.flowTimeSeconds}s flow)
          </span>
        </div>
      </div>

      <p className="text-xs text-[#7A6E65] mb-3">
        Shot completed: <span className="font-mono text-[#2C2018] font-bold">{lastShot.actualYieldGrams.toFixed(1)}g</span> out in{' '}
        <span className="font-mono text-[#2C2018] font-bold">{lastShot.totalTimeSeconds.toFixed(1)}s</span>. How did it taste?
      </p>

      {/* Taste Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {tasteOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelectedTaste(opt.key)}
            className={`p-2.5 rounded-xl border text-left transition ${
              selectedTaste === opt.key
                ? 'border-[#C26D52] bg-[#FAF7F2] ring-1 ring-[#C26D52]'
                : 'border-[#E8DFD5] bg-white hover:bg-[#FAF7F2]/50'
            }`}
          >
            <div className="text-xs font-semibold text-[#2C2018] font-mono">{opt.label}</div>
            <div className="text-[10px] text-[#7A6E65] mt-1 leading-snug">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Barista Dial-In Recommendation Card */}
      <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#C26D52]" />
            <span className="text-xs font-bold text-[#2C2018] font-mono">{advice.summary}</span>
          </div>
          {lastShot.channeling?.detected && (
            <span className="text-[10px] text-[#B85B48] font-mono font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Channeling Spike
            </span>
          )}
        </div>

        <p className="text-xs text-[#2C2018]">{advice.rationale}</p>

        {advice.roastAdvice && (
          <div className="text-[11px] text-[#7A6E65] font-mono bg-white p-2 rounded-lg border border-[#E8DFD5]">
            🔥 <strong className="text-[#2C2018]">Roast Profile {lastShot.roastLevel ? `(${lastShot.roastLevel})` : ''}:</strong> {advice.roastAdvice}
          </div>
        )}

        {advice.preInfusionAdvice && (
          <div className="text-[11px] text-[#7A6E65] font-mono bg-white p-2 rounded-lg border border-[#E8DFD5]">
            ⏱️ <strong className="text-[#2C2018]">Pre-Infusion:</strong> {advice.preInfusionAdvice}
          </div>
        )}

        {advice.puckAdvice && (
          <div className="text-[11px] text-[#7A6E65] font-mono bg-white p-2 rounded-lg border border-[#E8DFD5]">
            💡 <strong className="text-[#2C2018]">Puck Prep:</strong> {advice.puckAdvice}
          </div>
        )}
      </div>

      {/* Notes & Save Button */}
      <div className="space-y-3">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Personal tasting notes (e.g. bright acidity, apricot aroma, velvety body)..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8DFD5] bg-white focus:outline-none focus:ring-1 focus:ring-[#C26D52] font-mono"
        />

        <button
          onClick={handleSave}
          disabled={isSaved}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition font-mono ${
            isSaved
              ? 'bg-[#72806B] text-white'
              : 'bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2]'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Saved to Logbook
            </>
          ) : (
            <>
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save to Coffee Logbook
            </>
          )}
        </button>
      </div>
    </div>
  );
};
