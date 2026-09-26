import React from 'react';
import type { DrinkRecipe, CoffeeBeanProfile, GrinderProfile } from '../types/espresso';
import { X, Sliders, ChevronRight, Target, Sparkles, Scale } from 'lucide-react';

interface DialInWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  drink: DrinkRecipe;
  currentBean: CoffeeBeanProfile;
  currentGrinder: GrinderProfile;
  onProceedToScaleCam: () => void;
}

export const DialInWizardModal: React.FC<DialInWizardModalProps> = ({
  isOpen,
  onClose,
  drink,
  currentBean,
  currentGrinder,
  onProceedToScaleCam,
}) => {
  if (!isOpen) return null;

  // Determine starting grind recommendation
  const startingGrind = currentBean.grindSetting || currentGrinder.defaultSetting || '15';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFDF9] border border-[#E8DFD5] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#C26D52]/15 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#C26D52]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#2C2018]">
                Dial-In Wizard: {drink.name}
              </h3>
              <p className="text-[11px] text-[#7A6E65] font-mono">
                {currentBean.name} • {currentGrinder.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#7A6E65] hover:text-[#2C2018] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Step Guidance */}
        <div className="space-y-4">
          {/* Step 1: Starting Grind Calibration */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Step 1: Starting Burr Gap
              </span>
              <span className="text-xs font-mono font-bold text-[#2C2018] bg-white px-2 py-0.5 rounded-md border border-[#E8DFD5]">
                {currentGrinder.name.split(' ')[0]} Setting: {startingGrind}
              </span>
            </div>
            <p className="text-xs text-[#2C2018] leading-relaxed">
              Set your <strong className="font-semibold">{currentGrinder.name}</strong> to collar setting <strong className="text-[#C26D52] font-mono">{startingGrind}</strong> ({currentGrinder.stepUnit}). This gives optimal baseline surface area for a {currentBean.roastLevel} roast.
            </p>
          </div>

          {/* Step 2: Target Shot Physics */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" /> Step 2: Target Weight & Ratio
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="bg-white p-2 rounded-xl border border-[#E8DFD5]">
                <div className="text-[9px] text-[#7A6E65]">Dose</div>
                <div className="font-bold text-[#2C2018]">{drink.defaultDoseGrams}g</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E8DFD5]">
                <div className="text-[9px] text-[#7A6E65]">Target Yield</div>
                <div className="font-bold text-[#C26D52]">{drink.targetYieldGrams}g</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E8DFD5]">
                <div className="text-[9px] text-[#7A6E65]">Window</div>
                <div className="font-bold text-[#2C2018]">~{drink.expectedTimeSeconds}s</div>
              </div>
            </div>
          </div>

          {/* Step 3: Puck Preparation & First Calibration Run */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1.5 text-xs text-[#2C2018]">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Step 3: Puck Prep & Auto-Tracking
            </span>
            <p className="text-[11px] text-[#7A6E65] leading-relaxed">
              Use WDT needles to eliminate clumps, tamp firmly level, and lock portafilter. The Scale Cam will automatically start tracking once coffee hits the scale!
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E8DFD5] text-xs font-mono font-medium text-[#7A6E65] hover:text-[#2C2018] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceedToScaleCam}
            className="px-5 py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold flex items-center gap-2 transition shadow-md"
          >
            <span>Lock Recipe & Start Scale Cam</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
