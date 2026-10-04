import React, { useState, useEffect } from 'react';
import type { DrinkRecipe, CoffeeBeanProfile, GrinderProfile, RoastLevel, TempUnit } from '../types/espresso';
import { resolveGrinder } from '../lib/storage';
import { formatTemperature, getRecommendedBrewTemp } from '../lib/espressoMath';
import {
  X,
  Sliders,
  ChevronRight,
  Target,
  Sparkles,
  Scale,
  Minus,
  Plus,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Barcode,
  Check,
  Thermometer,
} from 'lucide-react';
import { getOptimalBeanGuidanceForDrink, matchBeansForDrink } from '../lib/beanMatcher';

export const getRoastBadgeStyles = (level: RoastLevel) => {
  switch (level) {
    case 'light':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'medium':
      return 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30';
    case 'medium-dark':
      return 'bg-[#8C6046]/10 text-[#8C6046] border-[#8C6046]/30';
    case 'dark':
      return 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]';
    default:
      return 'bg-neutral-100 text-neutral-800 border-neutral-300';
  }
};

interface DialInWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  drink: DrinkRecipe;
  currentBean: CoffeeBeanProfile;
  currentGrinder: GrinderProfile;
  availableGrinders?: GrinderProfile[];
  allGrinders?: GrinderProfile[];
  allBeans?: CoffeeBeanProfile[];
  tempUnit?: TempUnit;
  onSelectBean?: (beanId: string) => void;
  onProceedToScaleCam: () => void;
  onSaveDialIn?: (updated: {
    beanId?: string;
    doseGrams: number;
    targetYieldGrams: number;
    grindSetting: string;
    grinderName: string;
    brewTempC?: number;
    launchScaleCam?: boolean;
  }) => void;
  onOpenBeanVault?: () => void;
  onScanBean?: () => void;
}

export const DialInWizardModal: React.FC<DialInWizardModalProps> = ({
  isOpen,
  onClose,
  drink,
  currentBean,
  currentGrinder,
  availableGrinders = [],
  allGrinders = [],
  allBeans = [],
  tempUnit = 'C',
  onSelectBean,
  onProceedToScaleCam,
  onSaveDialIn,
  onOpenBeanVault,
  onScanBean,
}) => {
  // Master pool of all available grinders
  const pool = allGrinders.length > 0
    ? allGrinders
    : (availableGrinders.length > 0 ? availableGrinders : [currentGrinder]);

  // Master pool of all available coffee beans
  const beanPool = allBeans && allBeans.length > 0 ? allBeans : [currentBean];

  // Active bean selection state inside Dial-In Studio
  const [selectedBeanId, setSelectedBeanId] = useState<string>(currentBean.id);

  const activeBean =
    beanPool.find((b) => b.id === selectedBeanId) ||
    currentBean ||
    beanPool[0];

  // Grinder selection state: defaults to bean's dialed grinder or current bar grinder
  const [selectedGrinderName, setSelectedGrinderName] = useState<string>(() => {
    const raw = activeBean.grinderName || currentGrinder.name;
    const res = resolveGrinder(raw, pool);
    return res?.name || raw;
  });

  // Derived active grinder object in this modal
  const activeGrinder =
    resolveGrinder(selectedGrinderName, pool) ||
    currentGrinder ||
    pool[0];

  // Grinders that are marked inSetup (from user's personal setup in Gear)
  const setupGrinders = pool.filter((g) => g.inSetup === true);
  const displayGrinders = setupGrinders.length > 0
    ? (setupGrinders.some((g) => g.name === activeGrinder.name)
        ? setupGrinders
        : [activeGrinder, ...setupGrinders])
    : pool.slice(0, 4);

  // Initialize state with active bean & drink targets
  const initialDose = activeBean.doseGrams || drink.defaultDoseGrams || 18.0;
  const initialYield = drink.targetYieldGrams || activeBean.targetYieldGrams || 36.0;
  const initialGrind = activeBean.grindSetting || activeGrinder.defaultSetting || '15';
  const initialTemp = activeBean.brewTempC || getRecommendedBrewTemp(activeBean.roastLevel);

  const [doseGrams, setDoseGrams] = useState<number>(initialDose);
  const [targetYieldGrams, setTargetYieldGrams] = useState<number>(initialYield);
  const [grindSetting, setGrindSetting] = useState<string>(initialGrind);
  const [brewTempC, setBrewTempC] = useState<number>(initialTemp);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Sync state whenever modal opens or drink/bean changes
  useEffect(() => {
    if (isOpen) {
      setSelectedBeanId(currentBean.id);
      const raw = currentBean.grinderName || currentGrinder.name;
      const res = resolveGrinder(raw, pool);
      setSelectedGrinderName(res?.name || raw);
      setDoseGrams(drink.defaultDoseGrams || currentBean.doseGrams || 18.0);
      setTargetYieldGrams(drink.targetYieldGrams || currentBean.targetYieldGrams || 36.0);
      setGrindSetting(currentBean.grindSetting || currentGrinder.defaultSetting || '15');
      setBrewTempC(currentBean.brewTempC || getRecommendedBrewTemp(currentBean.roastLevel));
      setIsSavedFeedback(false);
    }
  }, [
    isOpen,
    drink.id,
    currentBean.id,
    currentBean.grinderName,
    currentBean.grindSetting,
    currentBean.doseGrams,
    currentBean.targetYieldGrams,
    currentBean.brewTempC,
    currentBean.roastLevel,
    currentGrinder.name,
    currentGrinder.defaultSetting,
  ]);

  if (!isOpen) return null;

  // Real-time calculated extraction ratio
  const ratio = doseGrams > 0 ? (targetYieldGrams / doseGrams).toFixed(1) : '2.0';

  // Optimal pairing guidance between current drink and active bean
  const guidance = getOptimalBeanGuidanceForDrink(drink, activeBean);
  const matches = matchBeansForDrink(beanPool, drink);
  const currentMatch = matches.find((m) => m.bean.id === activeBean.id);
  const currentScore = currentMatch?.matchScore ?? (guidance.isCurrentBeanOptimal ? 92 : 75);

  // Switch bean in Dial-In Studio
  const handleSelectBean = (bean: CoffeeBeanProfile) => {
    setSelectedBeanId(bean.id);
    if (onSelectBean) {
      onSelectBean(bean.id);
    }
    // Update grinder and grind settings associated with newly selected bean
    if (bean.grinderName) {
      const res = resolveGrinder(bean.grinderName, pool);
      if (res) setSelectedGrinderName(res.name);
    }
    if (bean.grindSetting) {
      setGrindSetting(bean.grindSetting);
    }
    if (bean.doseGrams) {
      setDoseGrams(bean.doseGrams);
    }
    if (bean.targetYieldGrams) {
      setTargetYieldGrams(bean.targetYieldGrams);
    }
    setBrewTempC(bean.brewTempC || getRecommendedBrewTemp(bean.roastLevel));
  };

  // Handle switching grinder in Dial-In Studio
  const handleSelectGrinder = (grinder: GrinderProfile) => {
    setSelectedGrinderName(grinder.name);
    if (grinder.name === activeBean.grinderName && activeBean.grindSetting) {
      setGrindSetting(activeBean.grindSetting);
    } else {
      setGrindSetting(grinder.defaultSetting || '15');
    }
  };

  // Grind adjustment handlers (responsive to stepped vs stepless)
  const handleAdjustGrind = (delta: number) => {
    const parsed = parseFloat(grindSetting);
    if (!isNaN(parsed)) {
      const stepDelta = activeGrinder.type === 'stepless'
        ? (delta > 0 ? 0.2 : -0.2)
        : (delta > 0 ? 0.5 : -0.5);
      const next = Math.max(0.1, Math.round((parsed + stepDelta) * 10) / 10);
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

  // Temperature adjustment handler
  const handleAdjustTemp = (delta: number) => {
    setBrewTempC((prev) => Math.max(85, Math.min(98, prev + delta)));
  };

  // Reset to original recipe baseline
  const handleResetToBaseline = () => {
    setDoseGrams(drink.defaultDoseGrams || 18.0);
    setTargetYieldGrams(drink.targetYieldGrams || 36.0);
    setGrindSetting(activeGrinder.defaultSetting || '15');
    setBrewTempC(getRecommendedBrewTemp(activeBean.roastLevel));
  };

  // Save changes without launching scale monitor
  const handleSaveOnly = () => {
    setIsSavedFeedback(true);
    if (onSaveDialIn) {
      onSaveDialIn({
        beanId: activeBean.id,
        doseGrams,
        targetYieldGrams,
        grindSetting,
        grinderName: activeGrinder.name,
        brewTempC,
        launchScaleCam: false,
      });
    }
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 900);
  };

  // Save changes & proceed to Scale Cam
  const handleSaveAndProceed = () => {
    setIsSavedFeedback(true);
    if (onSaveDialIn) {
      onSaveDialIn({
        beanId: activeBean.id,
        doseGrams,
        targetYieldGrams,
        grindSetting,
        grinderName: activeGrinder.name,
        brewTempC,
        launchScaleCam: true,
      });
    } else {
      onProceedToScaleCam();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E8DFD5] rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative overflow-hidden my-auto max-h-[95vh] overflow-y-auto">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#C26D52]/15 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shrink-0 shadow-xs">
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
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#7A6E65] font-mono truncate">
                <span className="font-semibold text-[#2C2018] truncate">{activeBean.name}</span>
                <span
                  className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${getRoastBadgeStyles(
                    activeBean.roastLevel
                  )}`}
                >
                  {activeBean.roastLevel}
                </span>
                <span>•</span>
                <span className="truncate">{activeGrinder.name.split(' ')[0]} (Setting {grindSetting})</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#7A6E65] hover:text-[#2C2018] transition shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Select Coffee Bean & Review Roast Matching */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" /> Step 1: Coffee Bean Selection
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  currentScore >= 80
                    ? 'bg-[#72806B]/15 text-[#72806B] border-[#72806B]/30'
                    : 'bg-[#C26D52]/15 text-[#C26D52] border-[#C26D52]/30'
                }`}
              >
                {currentScore}% Pairing Match
              </span>
            </div>
          </div>

          {/* Active Bean Banner */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-[#E8DFD5] space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${getRoastBadgeStyles(
                      activeBean.roastLevel
                    )}`}
                  >
                    {activeBean.roastLevel}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#2C2018] font-serif truncate">
                    {activeBean.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#72806B] text-white font-bold font-mono">
                    ACTIVE
                  </span>
                </div>
                {activeBean.roaster && (
                  <p className="text-[10px] text-[#7A6E65] font-mono mt-0.5">
                    Roaster: <strong className="text-[#2C2018]">{activeBean.roaster}</strong>
                  </p>
                )}
              </div>

              {/* Action buttons to scan or open vault */}
              <div className="flex items-center gap-1 shrink-0">
                {onScanBean && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onScanBean();
                    }}
                    className="p-1.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] text-[10px] font-mono font-bold flex items-center gap-1 transition"
                    title="Scan new coffee bag"
                  >
                    <Barcode className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span className="hidden xs:inline">Scan Bag</span>
                  </button>
                )}
                {onOpenBeanVault && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBeanVault();
                    }}
                    className="p-1.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] text-[10px] font-mono font-bold flex items-center gap-1 transition"
                    title="Open Bean Vault"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span className="hidden xs:inline">Vault</span>
                  </button>
                )}
              </div>
            </div>

            {/* Flavor & Roast Notes for this drink */}
            <p className="text-[10px] sm:text-[11px] text-[#7A6E65] leading-relaxed border-t border-[#E8DFD5]/60 pt-1.5">
              {currentMatch?.reason || guidance.whyIdeal} {guidance.idealFlavorNotes && `• Target notes: ${guidance.idealFlavorNotes}`}
            </p>
          </div>

          {/* Quick Bean Switcher (If multiple beans exist) */}
          {beanPool.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono uppercase font-bold text-[#7A6E65] block">
                Switch Bean for this Dial-In:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5 no-scrollbar">
                {beanPool.map((b) => {
                  const isSelected = b.id === activeBean.id;
                  const match = matches.find((m) => m.bean.id === b.id);
                  const score = match?.matchScore ?? 75;

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBean(b)}
                      className={`p-2 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-[#C26D52] bg-white ring-1 ring-[#C26D52] shadow-2xs'
                          : 'border-[#E8DFD5] bg-white/70 hover:bg-white hover:border-[#C26D52]/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${getRoastBadgeStyles(
                              b.roastLevel
                            )}`}
                          >
                            {b.roastLevel}
                          </span>
                          <span className="text-xs font-bold text-[#2C2018] truncate font-serif">
                            {b.name}
                          </span>
                        </div>
                        <div className="text-[9px] text-[#7A6E65] font-mono mt-0.5 flex items-center gap-1.5">
                          <span>Grind: <strong className="text-[#2C2018]">{b.grindSetting}</strong></span>
                          <span>•</span>
                          <span className="truncate">{b.roaster || 'Specialty'}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                            score >= 80
                              ? 'bg-[#72806B]/15 text-[#72806B] border-[#72806B]/30'
                              : 'bg-[#C26D52]/15 text-[#C26D52] border-[#C26D52]/30'
                          }`}
                        >
                          {score}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Grinder & Grind Setting for this Bean */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Step 2: Grinder & Setting for Bean
            </span>
            <span className="text-[10px] font-mono text-[#7A6E65]">
              {activeGrinder.name.split(' ')[0]} ({activeGrinder.stepUnit || 'micro-steps'})
            </span>
          </div>

          {/* Grinder selector from setup / library */}
          <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-[#E8DFD5]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#7A6E65] uppercase font-bold">
                Select Grinder for this Bean:
              </span>
              <span className="text-[#C26D52] font-bold">
                Selected: {activeGrinder.name.split(' ')[0]}
              </span>
            </div>

            {/* Tactile chips of grinders in setup */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {displayGrinders.map((g) => {
                const isSelected = g.name === activeGrinder.name;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelectGrinder(g)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018] shadow-xs ring-1 ring-[#C26D52]'
                        : 'bg-[#FAF7F2] hover:bg-[#E8DFD5]/50 text-[#7A6E65] border-[#E8DFD5]'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#C26D52]" />}
                    <span className="font-semibold">{g.name}</span>
                    <span className="text-[9px] opacity-75">
                      ({g.type === 'stepless' ? 'Stepless' : 'Stepped'})
                    </span>
                  </button>
                );
              })}

              {/* If there are more grinders in the full library */}
              {pool.length > displayGrinders.length && (
                <div className="w-full pt-1">
                  <select
                    value={activeGrinder.name}
                    onChange={(e) => {
                      const found = pool.find((g) => g.name === e.target.value);
                      if (found) handleSelectGrinder(found);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-[11px] font-mono text-[#2C2018] focus:outline-hidden"
                  >
                    <option value="" disabled>Or select from all grinders in library...</option>
                    {pool.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} ({g.type === 'stepless' ? 'Stepless' : 'Stepped'}, {g.stepUnit})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#E8DFD5]">
            <div className="text-[11px] text-[#7A6E65] font-mono">
              Dial setting on <strong className="text-[#2C2018]">{activeGrinder.name.split(' ')[0]}</strong>:
              <span className="block text-[9px] text-[#A6998E]">({activeGrinder.stepUnit || 'micro-steps'})</span>
            </div>

            {/* Grind Stepper */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustGrind(-1)}
                className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold text-sm transition active:scale-95 cursor-pointer"
                title={`Finer grind (-${activeGrinder.type === 'stepless' ? '0.2' : '0.5'})`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                value={grindSetting}
                onChange={(e) => setGrindSetting(e.target.value)}
                className="w-16 text-center text-sm font-bold font-mono text-[#C26D52] bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg py-1 focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                title="Enter grind setting"
              />
              <button
                type="button"
                onClick={() => handleAdjustGrind(1)}
                className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold text-sm transition active:scale-95 cursor-pointer"
                title={`Coarser grind (+${activeGrinder.type === 'stepless' ? '0.2' : '0.5'})`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] text-[#7A6E65] leading-relaxed">
            Finer setting increases puck resistance and slows flow rate (g/s). Coarser setting yields faster extraction.
          </p>
        </div>

        {/* STEP 3: Dose, Target Yield & Live Extraction Ratio */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" /> Step 3: Dose, Yield & Extraction Ratio
            </span>
            <span className="text-[10px] font-mono font-bold text-[#2C2018] bg-[#C26D52]/10 border border-[#C26D52]/30 px-2 py-0.5 rounded-full">
              Ratio 1:{ratio}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {/* Dry Dose Tuner */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-between">
              <div className="text-[9px] text-[#7A6E65] uppercase font-bold">Dry Dose (In)</div>
              <div className="flex items-center justify-between my-1">
                <button
                  type="button"
                  onClick={() => handleAdjustDose(-0.5)}
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95 cursor-pointer"
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
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95 cursor-pointer"
                  title="+0.5g"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[9px] text-[#7A6E65] text-center">Basket Dose</div>
            </div>

            {/* Target Yield Tuner */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-between">
              <div className="text-[9px] text-[#7A6E65] uppercase font-bold">Target Yield (Out)</div>
              <div className="flex items-center justify-between my-1">
                <button
                  type="button"
                  onClick={() => handleAdjustYield(-1.0)}
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95 cursor-pointer"
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
                  className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95 cursor-pointer"
                  title="+1.0g"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[9px] text-[#7A6E65] text-center">Liquid Espresso</div>
            </div>

            {/* Window & Style Summary */}
            <div className="col-span-2 sm:col-span-1 bg-white p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-between text-center">
              <div className="text-[9px] text-[#7A6E65] uppercase font-bold">Time Window</div>
              <div className="text-sm font-bold text-[#2C2018] my-1">
                ~{drink.expectedTimeSeconds || 26}s
              </div>
              <div className="text-[9px] text-[#72806B] font-semibold truncate">
                {parseFloat(ratio) < 1.8 ? 'Ristretto Profile' : parseFloat(ratio) > 2.3 ? 'Lungo Profile' : 'Standard Normale'}
              </div>
            </div>
          </div>

          {/* Target Brew Temperature Stepper */}
          <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] text-[#7A6E65] uppercase font-bold flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#C26D52]" /> Target Brew Temp
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#C26D52]/10 text-[#C26D52] font-semibold">
                  Recommended: {formatTemperature(getRecommendedBrewTemp(activeBean.roastLevel), tempUnit)}
                </span>
              </div>
              <p className="text-[10px] text-[#7A6E65] mt-0.5">
                Higher temps unlock sweetness in {activeBean.roastLevel} roast; cooler water curbs bitterness.
              </p>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleAdjustTemp(-1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95 cursor-pointer"
                title="-1°"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="w-16 sm:w-18 text-center text-xs sm:text-sm font-bold font-mono text-[#C26D52] bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg py-1">
                {formatTemperature(brewTempC, tempUnit)}
              </div>
              <button
                type="button"
                onClick={() => handleAdjustTemp(1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold transition active:scale-95 cursor-pointer"
                title="+1°"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 4: Synchronization & Confirmation Summary */}
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1.5 text-xs text-[#2C2018]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Step 4: Synchronization & Confirmation
            </span>
            <button
              type="button"
              onClick={handleResetToBaseline}
              className="text-[10px] font-mono text-[#7A6E65] hover:text-[#2C2018] flex items-center gap-1 transition cursor-pointer"
              title="Reset to recipe baseline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#7A6E65] leading-relaxed">
            Calibration will be locked for <strong>{activeBean.name}</strong> at <strong>{formatTemperature(brewTempC, tempUnit)}</strong> using <strong>{activeGrinder.name.split(' ')[0]}</strong> on setting <strong>{grindSetting}</strong> ({doseGrams.toFixed(1)}g in → {targetYieldGrams.toFixed(1)}g out).
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E8DFD5] text-xs font-mono font-medium text-[#7A6E65] hover:text-[#2C2018] transition text-center cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Save Calibration Only Button */}
            <button
              type="button"
              onClick={handleSaveOnly}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#C26D52] bg-[#FAF7F2] hover:bg-[#C26D52]/10 text-[#C26D52] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Save settings to bean without opening camera"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Calibration</span>
            </button>

            {/* Lock & Launch Scale Cam Primary Button */}
            <button
              type="button"
              onClick={handleSaveAndProceed}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-md group cursor-pointer"
            >
              {isSavedFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#72806B]" />
                  <span>Calibration Locked!</span>
                </>
              ) : (
                <>
                  <span>Lock & Launch Scale Cam</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
