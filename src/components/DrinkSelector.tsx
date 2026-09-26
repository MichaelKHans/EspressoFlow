import React, { useState, useEffect } from 'react';
import type { DrinkRecipe, CoffeeBeanProfile, GrinderProfile, ShotRecord } from '../types/espresso';
import { DRINK_RECIPES } from '../data/drinkRecipes';
import {
  Coffee,
  ChevronRight,
  ChevronDown,
  Sliders,
  CheckCircle2,
  Droplets,
  Settings2,
  Check,
  X,
  Lightbulb,
  Layers,
  Plus,
  Minus,
  AlertCircle,
} from 'lucide-react';
import {
  loadActiveBarDrinkIds,
  saveActiveBarDrinkIds,
  loadDrinkGrindSettings,
  saveDrinkGrindSetting,
  loadShots,
} from '../lib/storage';
import { GRINDER_CALIBRATIONS } from '../lib/espressoMath';
import { ArchitecturalCup } from './ArchitecturalCup';

interface DrinkSelectorProps {
  currentBean: CoffeeBeanProfile;
  currentGrinder: GrinderProfile;
  activeDrinkId: string;
  shots?: ShotRecord[];
  onSelectDrink: (drink: DrinkRecipe) => void;
  onLaunchScaleCam: (drink: DrinkRecipe) => void;
  onOpenDialInWizard: (drink: DrinkRecipe) => void;
  onOpenBeanVault: () => void;
  onGrindSettingChange?: (setting: string) => void;
}

export const DrinkSelector: React.FC<DrinkSelectorProps> = ({
  currentBean,
  currentGrinder,
  activeDrinkId,
  shots,
  onSelectDrink,
  onLaunchScaleCam,
  onOpenDialInWizard,
  onOpenBeanVault,
  onGrindSettingChange,
}) => {
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>(() => loadActiveBarDrinkIds());
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState<boolean>(false); // Collapsed by default per user request!
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'milk' | 'black' | 'dessert'>('all');
  const [drinkGrinds, setDrinkGrinds] = useState<Record<string, string>>(() => loadDrinkGrindSettings());
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  const selectedDrink = DRINK_RECIPES.find((d) => d.id === activeDrinkId) || DRINK_RECIPES[0];

  // Specific calibration key for this exact bean + drink combination
  const calibrationKey = `${currentBean.id}_${selectedDrink.id}`;
  const savedDrinkSetting = drinkGrinds[calibrationKey] || currentBean.grindSetting || currentGrinder.defaultSetting;

  const [currentSettingInput, setCurrentSettingInput] = useState<string>(savedDrinkSetting);

  useEffect(() => {
    const key = `${currentBean.id}_${selectedDrink.id}`;
    const setting = drinkGrinds[key] || currentBean.grindSetting || currentGrinder.defaultSetting;
    setCurrentSettingInput(setting);
  }, [currentBean.id, selectedDrink.id, drinkGrinds, currentBean.grindSetting, currentGrinder.defaultSetting]);

  // Find most recent shot for this drink
  const allShots = shots || loadShots();
  const lastShotForDrink = allShots.find(
    (s) =>
      (s.drinkId === selectedDrink.id || s.drinkName?.toLowerCase() === selectedDrink.name.toLowerCase()) &&
      (!s.coffeeName || s.coffeeName === currentBean.name)
  ) || allShots.find(
    (s) => s.drinkId === selectedDrink.id || s.drinkName?.toLowerCase() === selectedDrink.name.toLowerCase()
  );

  const targetTime = selectedDrink.expectedTimeSeconds;
  const targetYield = selectedDrink.targetYieldGrams;

  // Grinder step specification
  const grinderSpec = GRINDER_CALIBRATIONS[currentGrinder.name] || {
    secondsPerStep: currentGrinder.secondsPerStep || 2.5,
    unitName: currentGrinder.stepUnit || 'steps',
  };

  // Compute calibration analysis & improvement advice
  const dialInAnalysis = (() => {
    if (!lastShotForDrink) {
      return {
        hasHistory: false,
        status: 'uncalibrated' as const,
        summary: `Target: ~${targetTime}s for ${targetYield}g yield`,
        tip: selectedDrink.dialInTip,
      };
    }

    const actualTime = lastShotForDrink.totalTimeSeconds;
    const deltaT = actualTime - targetTime;

    if (lastShotForDrink.channelingDetected) {
      return {
        hasHistory: true,
        status: 'channeling' as const,
        actualTime,
        actualYield: lastShotForDrink.actualYieldGrams,
        summary: `Channeling spike detected (${actualTime.toFixed(1)}s)`,
        tip: 'Puck integrity failed. Water channeled through a dry pocket. Keep current grind setting and use WDT needles with a flat, level tamp.',
      };
    }

    if (Math.abs(deltaT) <= 2.0) {
      return {
        hasHistory: true,
        status: 'dialed_in' as const,
        actualTime,
        actualYield: lastShotForDrink.actualYieldGrams,
        summary: `Dialed In: Last shot hit ${actualTime.toFixed(1)}s (target ~${targetTime}s)`,
        tip: `Setting ${lastShotForDrink.grindSetting} is in the Golden Extraction Zone (1.2–1.6 g/s). Locked and ready!`,
      };
    }

    if (deltaT < -2.0) {
      // Ran fast (e.g. 21s vs target 27s) -> needs finer
      const deltaSec = Math.abs(deltaT);
      const steps = Math.max(0.5, Math.round((deltaSec / grinderSpec.secondsPerStep) * 2) / 2);
      const numericCurrent = parseFloat(currentSettingInput);
      const suggested = !isNaN(numericCurrent) ? (numericCurrent - steps).toFixed(1).replace('.0', '') : '';

      return {
        hasHistory: true,
        status: 'fast' as const,
        actualTime,
        actualYield: lastShotForDrink.actualYieldGrams,
        steps,
        suggestedSetting: suggested,
        summary: `Fast Flow (${actualTime.toFixed(1)}s vs target ${targetTime}s)`,
        tip: `Grind ${steps} ${grinderSpec.unitName} FINER to slow flow down to target ~${targetTime}s.`,
      };
    }

    // Ran slow (e.g. 35s vs target 27s) -> needs coarser
    const deltaSec = deltaT;
    const steps = Math.max(0.5, Math.round((deltaSec / grinderSpec.secondsPerStep) * 2) / 2);
    const numericCurrent = parseFloat(currentSettingInput);
    const suggested = !isNaN(numericCurrent) ? (numericCurrent + steps).toFixed(1).replace('.0', '') : '';

    return {
      hasHistory: true,
      status: 'slow' as const,
      actualTime,
      actualYield: lastShotForDrink.actualYieldGrams,
      steps,
      suggestedSetting: suggested,
      summary: `Slow Flow (${actualTime.toFixed(1)}s vs target ${targetTime}s)`,
      tip: `Grind ${steps} ${grinderSpec.unitName} COARSER to speed flow up to target ~${targetTime}s.`,
    };
  })();

  const handleAdjustStep = (delta: number) => {
    const num = parseFloat(currentSettingInput);
    if (!isNaN(num)) {
      const next = Math.max(0, num + delta);
      const formatted = next.toFixed(1).replace('.0', '');
      setCurrentSettingInput(formatted);
    }
  };

  const handleSaveSetting = () => {
    saveDrinkGrindSetting(calibrationKey, currentSettingInput);
    setDrinkGrinds((prev) => ({
      ...prev,
      [calibrationKey]: currentSettingInput,
    }));
    if (onGrindSettingChange) {
      onGrindSettingChange(currentSettingInput);
    }
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2200);
  };

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Check if drink is considered "dialed in" for current bean
  const isDialedIn = Boolean(
    drinkGrinds[calibrationKey] || (dialInAnalysis.hasHistory && dialInAnalysis.status === 'dialed_in')
  );

  const toggleDeckDrink = (drinkId: string) => {
    let updated: string[];
    if (activeDeckIds.includes(drinkId)) {
      if (activeDeckIds.length <= 1) return; // Keep at least 1 drink active
      updated = activeDeckIds.filter((id) => id !== drinkId);
    } else {
      updated = [...activeDeckIds, drinkId];
    }
    setActiveDeckIds(updated);
    saveActiveBarDrinkIds(updated);
  };

  const filteredCatalog = DRINK_RECIPES.filter((d) => {
    if (categoryFilter === 'all') return true;
    return d.category === categoryFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-8 sm:pb-12">
      {/* 1. Barista Deck Hero Banner (Mobile Optimized) */}
      <div className="bg-gradient-to-br from-[#2C2018] to-[#3D2D22] text-[#FAF7F2] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border border-[#2C2018] relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#C26D52]/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Coffee className="w-3.5 h-3.5 text-[#C26D52]" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#E8DFD5]/80 font-bold">
                Digital Barista Deck
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight font-serif text-[#FFFDF9]">
              {greeting}, Barista.
            </h2>
            <p className="text-[11px] sm:text-xs text-[#E8DFD5]/70 mt-0.5">
              Choose your drink below. Your recipe and scale will be locked in 1 tap.
            </p>
          </div>

          {/* Active Bean & Grinder Quick Chip */}
          <button
            type="button"
            onClick={onOpenBeanVault}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left transition flex items-center justify-between sm:justify-start gap-3 group"
            title="Tap to switch coffee bean or grinder in Beans & Gear"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#C26D52] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] text-[#E8DFD5]/70 uppercase tracking-wider font-mono">
                  Active Vault Bean
                </div>
                <div className="text-xs font-bold text-white font-mono leading-tight group-hover:text-[#FAF7F2] truncate max-w-[180px] sm:max-w-none">
                  {currentBean.name}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#E8DFD5]/80 mt-0.5 flex items-center gap-1.5">
                  <span className="capitalize">{currentBean.roastLevel} Roast</span> •
                  <span>
                    {currentGrinder.name.split(' ')[0]} {currentGrinder.name.split(' ')[1] || ''}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E8DFD5]/60 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>

        {/* 2. Active Bar Deck Ribbon & Customizer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] sm:text-[10px] font-mono text-[#E8DFD5]/70 uppercase tracking-wider font-bold">
              Your Active Bar Deck ({activeDeckIds.length} of {DRINK_RECIPES.length} pinned):
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              className="text-[10px] sm:text-[11px] font-mono text-[#FAF7F2] hover:text-[#FFFDF9] bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition"
              title="Browse all 12 drinks or customize quick deck"
            >
              <Settings2 className="w-3 h-3 text-[#C26D52]" />
              <span>All Drinks & Deck</span>
            </button>
          </div>

          {/* Quick Deck Buttons: Wrapped so all pinned drinks are instantly visible! */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {DRINK_RECIPES.filter((d) => activeDeckIds.includes(d.id)).map((drink) => {
              const isSelected = drink.id === selectedDrink.id;
              const shortName = drink.name.split('/')[0].trim();
              return (
                <button
                  key={drink.id}
                  onClick={() => onSelectDrink(drink)}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 sm:gap-2 ${
                    isSelected
                      ? 'bg-[#C26D52] text-white shadow-xs font-bold ring-2 ring-white/30 scale-[1.02]'
                      : 'bg-white/10 text-[#FAF7F2] hover:bg-white/20 border border-white/10'
                  }`}
                >
                  <ArchitecturalCup drink={drink} size="xs" />
                  <span className="whitespace-nowrap">{shortName}</span>
                </button>
              );
            })}

            {/* "+ More Drinks" button right in the ribbon */}
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-mono font-medium bg-white/5 hover:bg-white/15 border border-dashed border-white/30 text-[#E8DFD5] transition flex items-center gap-1.5"
              title="Browse all 12 specialty recipes"
            >
              <Plus className="w-3.5 h-3.5 text-[#C26D52]" />
              <span>More ({DRINK_RECIPES.length - activeDeckIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Selected Drink Master Card (Mobile-First Architectural Layout) */}
      <div className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#E8DFD5] p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 pb-4 sm:pb-6 border-b border-[#E8DFD5]">
          {/* Drink Name & Header */}
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  selectedDrink.category === 'milk'
                    ? 'bg-[#FAF7F2] text-[#7A6E65] border-[#E8DFD5]'
                    : selectedDrink.category === 'dessert'
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                }`}
              >
                {selectedDrink.category === 'milk'
                  ? 'Specialty Milk Drink'
                  : selectedDrink.category === 'dessert'
                  ? 'Specialty Dessert'
                  : 'Pure Black Extraction'}
              </span>

              {/* Dialed In Status Badge */}
              {isDialedIn ? (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> DIALED IN
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> NEEDS DIAL-IN
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#2C2018]">
                {selectedDrink.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className="text-[10px] sm:text-[11px] font-mono text-[#C26D52] hover:text-[#2C2018] flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] hover:bg-[#E8DFD5]/50 transition shrink-0"
                title="Switch to another specialty drink"
              >
                <span>Switch</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-[#7A6E65] leading-relaxed line-clamp-2 sm:line-clamp-none">
              {selectedDrink.description}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto shrink-0">
            {!isDialedIn && (
              <button
                type="button"
                onClick={() => onOpenDialInWizard(selectedDrink)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-[#C26D52] bg-[#FAF7F2] hover:bg-[#C26D52]/10 text-[#C26D52] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Dial-In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onLaunchScaleCam(selectedDrink)}
              className="flex-2 sm:flex-none px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-md group"
            >
              <span>Pull Shot on Scale Cam</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* 4. Visual Cup Anatomy & Extraction Metrics Side-by-Side on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Architectural Layered Cup Graphic */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#FAF7F2] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E8DFD5]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A6E65] mb-2 font-bold flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#C26D52]" />
              <span>Cup Anatomy ({selectedDrink.cupVolumeMl || 180}ml)</span>
            </div>

            <div className="py-1">
              <ArchitecturalCup drink={selectedDrink} size="lg" showLabels={false} />
            </div>

            {/* Layer Legend Breakdown */}
            <div className="w-full mt-3 pt-2.5 border-t border-[#E8DFD5] space-y-1">
              {selectedDrink.layers.map((layer, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-2xs border border-black/20 shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="text-[#2C2018] font-medium truncate">{layer.name}</span>
                  </div>
                  <span className="text-[#7A6E65] shrink-0 font-semibold">
                    {layer.volumeMl ? `${layer.volumeMl}ml` : `${layer.percentage}%`}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-[#7A6E65] font-mono mt-2 text-center">
              Target Output: <strong className="text-[#2C2018]">{selectedDrink.targetYieldGrams.toFixed(1)}g</strong>
            </div>
          </div>

          {/* Right Column: 4 Key Metrics + Milk Steam Guide + Dial-In Guidance */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            {/* 4 Primary Extraction Metrics (2x2 on phone, 4-col on tablet/desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[9px] text-[#7A6E65] font-mono uppercase font-semibold">Dry Dose</div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#2C2018] mt-0.5">
                  {selectedDrink.defaultDoseGrams.toFixed(1)}g
                </div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[9px] text-[#7A6E65] font-mono uppercase font-semibold">Target Yield</div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#C26D52] mt-0.5">
                  {selectedDrink.targetYieldGrams.toFixed(1)}g
                </div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[9px] text-[#7A6E65] font-mono uppercase font-semibold">Ratio</div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#2C2018] mt-0.5">
                  1:{selectedDrink.targetRatio.toFixed(1)}
                </div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[9px] text-[#7A6E65] font-mono uppercase font-semibold">Target Time</div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#2C2018] mt-0.5">
                  ~{selectedDrink.expectedTimeSeconds}s
                </div>
              </div>
            </div>

            {/* Milk Steam Guide (Only for milk drinks) */}
            {selectedDrink.milkGuide && (
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#2C2018] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>Micro-Foam Guide</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#7A6E65]">
                    <span>Temp: <strong className="text-[#2C2018]">{selectedDrink.milkGuide.tempCelsius}°C</strong></span>
                    <span>Milk: <strong className="text-[#2C2018]">{selectedDrink.milkGuide.volumeMl}ml</strong></span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#7A6E65] leading-relaxed">
                  Texture: <span className="text-[#2C2018] font-semibold">{selectedDrink.milkGuide.foamStyle}</span>. ({selectedDrink.milkGuide.ratioDescription})
                </p>
              </div>
            )}

            {/* Steamed Water Guide (e.g. Americano / Long Black with aerated water) */}
            {selectedDrink.waterGuide && (
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#2C2018] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>Steamed Water Guide</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#7A6E65]">
                    <span>Temp: <strong className="text-[#2C2018]">{selectedDrink.waterGuide.tempCelsius}°C</strong></span>
                    <span>Water: <strong className="text-[#2C2018]">{selectedDrink.waterGuide.volumeMl}ml</strong></span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#7A6E65] leading-relaxed">
                  Method: <span className="text-[#2C2018] font-semibold">{selectedDrink.waterGuide.method}</span>. ({selectedDrink.waterGuide.techniqueDescription})
                </p>
              </div>
            )}

            {/* 4. Dial-In Grind Memory & Smart Improvement Engine */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-[#E8DFD5]/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#C26D52]" />
                  <span className="text-xs font-bold text-[#2C2018] font-mono">
                    Grind Memory: {selectedDrink.name.split('/')[0].trim()}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#7A6E65]">
                  Target: <strong className="text-[#2C2018]">~{targetTime}s</strong> ({targetYield}g)
                </div>
              </div>

              {/* Setting Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-[#7A6E65]">
                    Setting ({currentGrinder.name.split(' ')[0]}):
                  </span>
                  <div className="flex items-center gap-1 bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleAdjustStep(-0.5)}
                      className="w-6 h-6 rounded-lg bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold text-xs transition"
                      title="Adjust 0.5 finer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      value={currentSettingInput}
                      onChange={(e) => setCurrentSettingInput(e.target.value)}
                      className="w-12 text-center text-xs font-bold font-mono text-[#2C2018] bg-transparent focus:outline-hidden"
                      title="Grind setting"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustStep(0.5)}
                      className="w-6 h-6 rounded-lg bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] flex items-center justify-center font-bold text-xs transition"
                      title="Adjust 0.5 coarser"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[9px] font-mono text-[#7A6E65]">
                    {grinderSpec.unitName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSetting}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                    isSavedFeedback
                      ? 'bg-[#72806B] text-white shadow-xs'
                      : 'bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] shadow-2xs'
                  }`}
                >
                  {isSavedFeedback ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Locked for {selectedDrink.name.split('/')[0].trim()}!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-[#C26D52]" />
                      <span>Lock Setting</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Barista Improvement Advice */}
              <div
                className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                  dialInAnalysis.status === 'dialed_in'
                    ? 'bg-[#72806B]/10 border-[#72806B]/30 text-[#2C2018]'
                    : dialInAnalysis.status === 'channeling'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : dialInAnalysis.status === 'fast'
                    ? 'bg-sky-50 border-sky-200 text-sky-950'
                    : dialInAnalysis.status === 'slow'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-[#FFFDF9] border-[#E8DFD5] text-[#7A6E65]'
                }`}
              >
                {dialInAnalysis.status === 'dialed_in' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#72806B] shrink-0 mt-0.5" />
                ) : dialInAnalysis.status === 'channeling' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5 text-[#C26D52] shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="font-bold text-[10px] sm:text-[11px] font-mono flex items-center justify-between">
                    <span>{dialInAnalysis.summary}</span>
                    {dialInAnalysis.hasHistory && dialInAnalysis.actualTime !== undefined && dialInAnalysis.actualYield !== undefined && (
                      <span className="text-[9px] text-[#7A6E65] font-normal">
                        Last shot: {dialInAnalysis.actualTime.toFixed(1)}s / {dialInAnalysis.actualYield.toFixed(1)}g
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#7A6E65]">
                    {dialInAnalysis.tip}
                  </p>
                  {(dialInAnalysis.status === 'fast' || dialInAnalysis.status === 'slow') && dialInAnalysis.suggestedSetting && (
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold text-[#2C2018]">
                        Suggested: Setting {dialInAnalysis.suggestedSetting}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentSettingInput(dialInAnalysis.suggestedSetting)}
                        className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#C26D52] text-white hover:bg-[#A0523C] transition"
                      >
                        Apply {dialInAnalysis.suggestedSetting}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete Specialty Drink Menu (Collapsible - Collapsed by default) */}
      <div className="border border-[#E8DFD5] bg-[#FFFDF9] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs transition-all">
        <button
          type="button"
          onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#C26D52] group-hover:scale-105 transition shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2C2018] font-mono">
                  Specialty Drink Library
                </h4>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] text-[#7A6E65]">
                  {DRINK_RECIPES.length} recipes
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono mt-0.5">
                {isLibraryExpanded
                  ? 'Showing all 19 specialty cross-sections'
                  : 'Tap to expand full visual coffee recipe catalog'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-[#C26D52] font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] group-hover:bg-[#E8DFD5]/50 transition shrink-0">
            <span>{isLibraryExpanded ? 'Hide' : 'Explore All'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLibraryExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isLibraryExpanded && (
          <div className="mt-4 pt-4 border-t border-[#E8DFD5] space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono">
                Filter by category:
              </span>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 text-xs font-mono overflow-x-auto no-scrollbar pb-0.5">
                {(['all', 'milk', 'black', 'dessert'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition text-[11px] sm:text-xs shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                        : 'bg-[#FAF7F2] text-[#7A6E65] hover:bg-[#E8DFD5] border border-[#E8DFD5]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredCatalog.map((drink) => {
                const isSelected = drink.id === selectedDrink.id;
                const isOnBar = activeDeckIds.includes(drink.id);

                return (
                  <div
                    key={drink.id}
                    onClick={() => onSelectDrink(drink)}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20 shadow-xs'
                        : 'border-[#E8DFD5] bg-white hover:border-[#C26D52]/50 hover:bg-[#FAF7F2]/40'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        {/* Architectural Mini Cup (Image 3 Style) */}
                        <div className="p-1 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] shrink-0">
                          <ArchitecturalCup drink={drink} size="sm" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                                drink.category === 'milk'
                                  ? 'bg-[#FAF7F2] text-[#7A6E65] border-[#E8DFD5]'
                                  : drink.category === 'dessert'
                                  ? 'bg-amber-100 text-amber-900 border-amber-200'
                                  : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                              }`}
                            >
                              {drink.category}
                            </span>

                            {isOnBar && (
                              <span className="text-[9px] font-mono text-[#C26D52] font-semibold">
                                Pinned
                              </span>
                            )}
                          </div>

                          <h5 className="font-bold text-sm text-[#2C2018] font-serif leading-tight mt-1 truncate">
                            {drink.name}
                          </h5>
                          <p className="text-[11px] text-[#7A6E65] mt-0.5 line-clamp-1">
                            {drink.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Volume & Layers breakdown */}
                      <div className="text-[10px] font-mono text-[#7A6E65] bg-[#FAF7F2] p-2 rounded-lg border border-[#E8DFD5]/80 flex items-center justify-between">
                        <span>Yield: {drink.targetYieldGrams}g</span>
                        <span>Cup: {drink.cupVolumeMl}ml</span>
                        <span>Ratio 1:{drink.targetRatio}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#E8DFD5]/60 flex items-center justify-between text-[11px] font-mono text-[#7A6E65]">
                      <span>{drink.layers.length} layers</span>
                      <span className="text-[#C26D52] font-semibold flex items-center gap-0.5">
                        Select <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. All Drinks & Deck Customizer Modal */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#E8DFD5] max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD5]">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#C26D52]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2C2018] font-mono">
                  Specialty Drink Deck & Menu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1 rounded-lg text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#E8DFD5]/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#7A6E65] font-mono leading-relaxed">
              <strong>Tap any drink</strong> to select and brew it immediately. Use the <strong>Pin</strong> button to customize which drinks appear on your top 1-tap quick bar.
            </p>

            {/* Drink Selection List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {DRINK_RECIPES.map((drink) => {
                const isActive = activeDeckIds.includes(drink.id);
                const isSelected = drink.id === selectedDrink.id;
                return (
                  <div
                    key={drink.id}
                    className={`w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'border-[#C26D52] bg-[#FAF7F2] ring-2 ring-[#C26D52]/20 shadow-xs'
                        : 'border-[#E8DFD5] bg-white hover:border-[#C26D52]/40 hover:bg-[#FAF7F2]/40'
                    }`}
                  >
                    {/* Main Clickable Area: Select Drink for Brewing */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDrink(drink);
                        setIsCustomizeModalOpen(false);
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left group cursor-pointer"
                      title={`Select ${drink.name} for brewing`}
                    >
                      <ArchitecturalCup drink={drink} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2C2018] font-serif group-hover:text-[#C26D52] transition truncate">
                            {drink.name}
                          </span>
                          {isSelected && (
                            <span className="text-[8px] font-mono uppercase font-bold px-1.5 py-0.2 rounded-full bg-[#C26D52] text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#7A6E65] font-mono mt-0.5 truncate">
                          {drink.cupVolumeMl}ml • {drink.category} • 1:{drink.targetRatio} ratio
                        </div>
                      </div>
                    </button>

                    {/* Quick Bar Pin Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeckDrink(drink.id);
                      }}
                      className={`text-[10px] font-mono px-2 py-1 rounded-lg border flex items-center gap-1 transition shrink-0 ${
                        isActive
                          ? 'bg-[#C26D52]/10 border-[#C26D52] text-[#C26D52] font-semibold'
                          : 'bg-[#FAF7F2] border-[#E8DFD5] text-[#7A6E65] hover:text-[#2C2018]'
                      }`}
                      title={isActive ? 'Remove from top quick bar' : 'Pin to top quick bar'}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3 h-3 text-[#C26D52]" />
                          <span>Pinned</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 text-[#7A6E65]" />
                          <span>Pin</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono text-[#7A6E65]">
                {activeDeckIds.length} of {DRINK_RECIPES.length} active
              </span>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#2C2018] text-[#FAF7F2] text-xs font-mono font-bold hover:bg-[#3D2D22] transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
