import React, { useState, useEffect } from 'react';
import type { DrinkRecipe, CoffeeBeanProfile, GrinderProfile } from '../types/espresso';
import { X, Sliders, ChevronRight, Target, Sparkles, Scale, Minus, Plus, RotateCcw, CheckCircle2 } from 'lucide-react';

interface DialInWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  drink: DrinkRecipe;
  currentBean: CoffeeBeanProfile;
  currentGrinder: GrinderProfile;
  onProceedToScaleCam: () => void;
  onSaveDialIn?: (updated: {
    doseGrams: number;
    targetYieldGrams: number;
    grindSetting: string;
  }) => void;
}

export const DialInWizardModal: React.FC<DialInWizardModalProps> = ({
  isOpen,
  onClose,
  drink,
  currentBean,
  currentGrinder,
  onProceedToScaleCam,
  onSaveDialIn,
}) => {
  // Initialize state with current active bean & drink targets
  const initialDose = currentBean.doseGrams || drink.defaultDoseGrams || 18.0;
  const initialYield = drink.targetYieldGrams || currentBean.targetYieldGrams || 36.0;
  const initialGrind = currentBean.grindSetting || currentGrinder.defaultSetting || '15';

  const [doseGrams, setDoseGrams] = useState<number>(initialDose);
  const [targetYieldGrams, setTargetYieldGrams] = useState<number>(initialYield);
  const [grindSetting, setGrindSetting] = useState<string>(initialGrind);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Sync state whenever modal opens or bean/drink changes
  useEffect(() => {
    if (isOpen) {
      setDoseGrams(drink.defaultDoseGrams || currentBean.doseGrams || 18.0);
      setTargetYieldGrams(drink.targetYieldGrams || currentBean.targetYieldGrams || 36.0);
      setGrindSetting(currentBean.grindSetting || currentGrinder.defaultSetting || '15');
      setIsSavedFeedback(false);
    }
  }, [isOpen, drink.id, currentBean.id, currentBean.grindSetting, currentBean.doseGrams, currentBean.targetYieldGrams, currentGrinder.defaultSetting]);

  if (!isOpen) return null;

  // Real-time calculated extraction ratio
  const ratio = doseGrams > 0 ? (targetYieldGrams / doseGrams).toFixed(1) : '2.0';

  // Grind adjustment handlers
  const handleAdjustGrind = (delta: number) => {
    const parsed = parseFloat(grindSetting);
    if (!isNaN(parsed)) {
      const next = Math.max(0.1, parsed + delta);
      // Format with 1 decimal if float, otherwise whole number
      const formatted = next % 1 === 0 ? next.toString() : next.toFixed(1);
      setGrindSetting(formatted);
    }
  };

  // Dose adjustment handlers
  const handleAdjustDose = (delta: number) => {
    setDoseGrams((prev) => {
      const next = Math.max(7.0, Math.min(26.0, Math.round((prev + delta) * 10) / 10));
      return next;
    });
  };

  // Yield adjustment handlers
  const handleAdjustYield = (delta: number) => {
    setTargetYieldGrams((prev) => {
      const next = Math.max(10.0, Math.min(120.0, Math.round((prev + delta) * 10) / 10));
      return next;
    });
  };

  // Reset to original recipe baseline
  const handleResetToBaseline = () => {
    setDoseGrams(drink.defaultDoseGrams || 18.0);
    setTargetYieldGrams(drink.targetYieldGrams || 36.0);
    setGrindSetting(currentBean.grindSetting || currentGrinder.defaultSetting || '15');
  };

  // Save changes & proceed
  const handleSaveAndLock = () => {
    setIsSavedFeedback(true);
    if (onSaveDialIn) {
      onSaveDialIn({
        doseGrams,
        targetYieldGrams,
        grindSetting,
      });
    } else {
      onProceedToScaleCam();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E8DFD5] rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative overflow-hidden my-auto max-h-[95vh] overflow-y-auto">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#C26D52]/15 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4 text-[#C26D52]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold font-serif text-[#2C2018]">
                  Dial-In Studio: {drink.name}
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C26D52]/15 text-[#C26D52] font-mono font-bold uppercase">
                  Live Tuning
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono truncate">
                {currentBean.name} • {currentGrinder.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#7A6E65] hover:text-[#2C2018] transition shrink-0"
            title="Luk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Starting Burr Gap & Grind Setting */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Trin 1: Kværnindstilling for Bønnen
            </span>
            <span className="text-[10px] font-mono text-[#7A6E65]">
              {currentGrinder.name.split(' ')[0]} ({currentGrinder.stepUnit || 'steps'})
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#E8DFD5]">
            <div className="text-[11px] text-[#7A6E65] font-mono">
              Indstilling på <strong className="text-[#2C2018]">{currentGrinder.name.split(' ')[0]}</strong>:
            </div>

            {/* Grind Stepper */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustGrind(-0.5)}
                className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold text-sm transition active:scale-95"
                title="Finere kværn (-0.5)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                value={grindSetting}
                onChange={(e) => setGrindSetting(e.target.value)}
                className="w-16 text-center text-sm font-bold font-mono text-[#C26D52] bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg py-1 focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                title="Indtast kværntrin"
              />
              <button
                type="button"
                onClick={() => handleAdjustGrind(0.5)}
                className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold text-sm transition active:scale-95"
                title="Grovre kværn (+0.5)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] text-[#7A6E65] leading-relaxed">
            Finere indstilling giver større modstand og langsommere flow ($g/s$). Grovere indstilling giver hurtigere gennemløb.
          </p>
        </div>

        {/* Step 2: Target Weight, Dose & Live Extraction Ratio */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" /> Trin 2: Dosis, Udbytte & Forhold
            </span>
            <span className="text-[10px] font-mono font-bold text-[#2C2018] bg-[#C26D52]/10 border border-[#C26D52]/30 px-2 py-0.5 rounded-full">
              Ratio 1:{ratio}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {/* Dry Dose Tuner */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-between">
              <div className="text-[9px] text-[#7A6E65] uppercase font-bold">Tør Dosis (In)</div>
              <div className="flex items-center justify-between my-1">
                <button
                  type="button"
                  onClick={() => handleAdjustDose(-0.5)}
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95"
                  title="-0.5g"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="text-sm font-bold text-[#2C2018]">
                  {doseGrams.toFixed(1)}g
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustDose(0.5)}
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95"
                  title="+0.5g"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[9px] text-[#7A6E65] text-center">Kurvmængde</div>
            </div>

            {/* Target Yield Tuner */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-between">
              <div className="text-[9px] text-[#7A6E65] uppercase font-bold">Mål-Udbytte (Out)</div>
              <div className="flex items-center justify-between my-1">
                <button
                  type="button"
                  onClick={() => handleAdjustYield(-1.0)}
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95"
                  title="-1.0g"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="text-sm font-bold text-[#C26D52]">
                  {targetYieldGrams.toFixed(1)}g
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustYield(1.0)}
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95"
                  title="+1.0g"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[9px] text-[#7A6E65] text-center">Flydende kaffe</div>
            </div>

            {/* Window & Style Summary */}
            <div className="col-span-2 sm:col-span-1 bg-white p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-between text-center">
              <div className="text-[9px] text-[#7A6E65] uppercase font-bold">Tidsvindue</div>
              <div className="text-sm font-bold text-[#2C2018] my-1">
                ~{drink.expectedTimeSeconds || 26}s
              </div>
              <div className="text-[9px] text-[#72806B] font-semibold truncate">
                {parseFloat(ratio) < 1.8 ? 'Ristretto-profil' : parseFloat(ratio) > 2.3 ? 'Lungo-profil' : 'Standard Normale'}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Puck Preparation & Scale Synchronization */}
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1 text-xs text-[#2C2018]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Trin 3: Synkronisering & Klargøring
            </span>
            <button
              type="button"
              onClick={handleResetToBaseline}
              className="text-[10px] font-mono text-[#7A6E65] hover:text-[#2C2018] flex items-center gap-1 transition"
              title="Nulstil til opskriftens standard"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nulstil</span>
            </button>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#7A6E65] leading-relaxed">
            Dine ændringer gemmes direkte på <strong>{currentBean.name}</strong> og opdateres i <strong>Beans & Gear</strong>. Scale Cam sporer derefter automatisk mod dit mål på <strong>{targetYieldGrams.toFixed(1)}g</strong>!
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E8DFD5] text-xs font-mono font-medium text-[#7A6E65] hover:text-[#2C2018] transition text-center"
          >
            Annuller
          </button>
          <button
            type="button"
            onClick={handleSaveAndLock}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-md group"
          >
            {isSavedFeedback ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#72806B]" />
                <span>Gemt på Bønnen!</span>
              </>
            ) : (
              <>
                <span>Lås Kalibrering på Bønnen & Start Scale Cam</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
