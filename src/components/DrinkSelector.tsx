import React, { useState } from 'react';
import type { DrinkRecipe, CoffeeBeanProfile, GrinderProfile } from '../types/espresso';
import { DRINK_RECIPES } from '../data/drinkRecipes';
import {
  Coffee,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Droplets,
  Settings2,
  Check,
  X,
  Lightbulb,
  Layers,
} from 'lucide-react';
import { loadActiveBarDrinkIds, saveActiveBarDrinkIds } from '../lib/storage';
import { ArchitecturalCup } from './ArchitecturalCup';

interface DrinkSelectorProps {
  currentBean: CoffeeBeanProfile;
  currentGrinder: GrinderProfile;
  activeDrinkId: string;
  onSelectDrink: (drink: DrinkRecipe) => void;
  onLaunchScaleCam: (drink: DrinkRecipe) => void;
  onOpenDialInWizard: (drink: DrinkRecipe) => void;
  onOpenBeanVault: () => void;
}

export const DrinkSelector: React.FC<DrinkSelectorProps> = ({
  currentBean,
  currentGrinder,
  activeDrinkId,
  onSelectDrink,
  onLaunchScaleCam,
  onOpenDialInWizard,
  onOpenBeanVault,
}) => {
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>(() => loadActiveBarDrinkIds());
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'milk' | 'black' | 'dessert'>('all');

  const selectedDrink = DRINK_RECIPES.find((d) => d.id === activeDrinkId) || DRINK_RECIPES[0];

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Check if drink is considered "dialed in" for current bean
  const isDialedIn = Boolean(currentBean.grindSetting && currentBean.grindSetting.length > 0);

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
              <Sparkles className="w-3.5 h-3.5 text-[#C26D52]" />
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
              Your Active Bar Deck ({activeDeckIds.length} pinned):
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              className="text-[10px] sm:text-[11px] font-mono text-[#FAF7F2] hover:text-[#FFFDF9] bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition"
              title="Customize which drinks appear on your quick bar"
            >
              <Settings2 className="w-3 h-3 text-[#C26D52]" />
              <span>Customize Bar</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {DRINK_RECIPES.filter((d) => activeDeckIds.includes(d.id)).map((drink) => {
              const isSelected = drink.id === selectedDrink.id;
              const shortName = drink.name.split('/')[0].trim();
              return (
                <button
                  key={drink.id}
                  onClick={() => onSelectDrink(drink)}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono font-medium transition shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#C26D52] text-white shadow-xs font-bold scale-[1.02]'
                      : 'bg-white/10 text-[#FAF7F2] hover:bg-white/20 border border-white/10'
                  }`}
                >
                  <ArchitecturalCup drink={drink} size="xs" />
                  <span className="whitespace-nowrap">{shortName}</span>
                </button>
              );
            })}
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

            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#2C2018]">
              {selectedDrink.name}
            </h3>
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

            {/* Dial-In Pro Tip */}
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-[10px] sm:text-[11px] text-[#2C2018] leading-relaxed flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#C26D52] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#C26D52] font-mono uppercase text-[9px] sm:text-[10px] tracking-wider block mb-0.5">
                  Dial-In Guidance for {currentGrinder.name.split(' ')[0]}:
                </strong>
                <span>
                  {currentBean.grindSetting
                    ? `Locked at setting ${currentBean.grindSetting} for ${currentBean.name}. ${selectedDrink.dialInTip}`
                    : `Recommended: Step ${currentGrinder.defaultSetting} on ${currentGrinder.name}. ${selectedDrink.dialInTip}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete Specialty Drink Menu (Grid with Image 3 Silhouette Cup Visuals) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
              Specialty Drink Library ({DRINK_RECIPES.length} recipes)
            </h4>
            <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono">
              Detailed cross-section anatomy with exact ml volumes
            </p>
          </div>

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

      {/* 6. Customize Coffee Bar Modal */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#E8DFD5] max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD5]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#C26D52]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2C2018] font-mono">
                  Customize Bar Deck
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

            <p className="text-[11px] text-[#7A6E65] font-mono">
              Toggle which drinks appear in your top 1-tap quick bar. Keep your daily workflow fast and clutter-free.
            </p>

            {/* Drink Selection List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {DRINK_RECIPES.map((drink) => {
                const isActive = activeDeckIds.includes(drink.id);
                return (
                  <button
                    key={drink.id}
                    type="button"
                    onClick={() => toggleDeckDrink(drink.id)}
                    className={`w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition flex items-center justify-between ${
                      isActive
                        ? 'border-[#C26D52] bg-[#FAF7F2] ring-1 ring-[#C26D52]'
                        : 'border-[#E8DFD5] bg-white hover:bg-[#FAF7F2]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ArchitecturalCup drink={drink} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-[#2C2018] font-serif">
                          {drink.name}
                        </div>
                        <div className="text-[10px] text-[#7A6E65] font-mono mt-0.5">
                          {drink.cupVolumeMl}ml • {drink.category} • 1:{drink.targetRatio} ratio
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        isActive
                          ? 'bg-[#C26D52] border-[#C26D52] text-white'
                          : 'border-[#E8DFD5] bg-white'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
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
