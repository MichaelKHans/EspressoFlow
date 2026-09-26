import React, { useState } from 'react';
import type { DrinkRecipe, CoffeeBeanProfile, GrinderProfile } from '../types/espresso';
import { DRINK_RECIPES } from '../data/drinkRecipes';
import { Coffee, Sparkles, ChevronRight, Sliders, CheckCircle2, Droplets, Thermometer } from 'lucide-react';

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
  const [favoriteIds] = useState<string[]>(['cappuccino', 'espresso', 'flat-white', 'cortado']);

  const selectedDrink = DRINK_RECIPES.find((d) => d.id === activeDrinkId) || DRINK_RECIPES[0];

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Check if drink is considered "dialed in" for current bean
  // If the active bean has a grind setting stored, and target yield matches the drink ratio, it's dialed in
  const isDialedIn = Boolean(currentBean.grindSetting && currentBean.grindSetting.length > 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Barista Deck Hero Banner */}
      <div className="bg-gradient-to-br from-[#2C2018] to-[#3D2D22] text-[#FAF7F2] p-6 rounded-3xl shadow-md border border-[#2C2018] relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#C26D52]/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#C26D52]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#E8DFD5]/80 font-bold">
                Digital Barista Deck
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-[#FFFDF9]">
              {greeting}, Barista.
            </h2>
            <p className="text-xs text-[#E8DFD5]/70 mt-0.5">
              Choose your drink below. Your recipe and scale will be locked in 1 tap.
            </p>
          </div>

          {/* Active Bean & Grinder Quick Chip */}
          <button
            type="button"
            onClick={onOpenBeanVault}
            className="self-start sm:self-auto bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-left transition flex items-center gap-3 group"
            title="Tap to switch coffee bean or grinder in Beans & Gear"
          >
            <div className="w-9 h-9 rounded-xl bg-[#C26D52] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-[#E8DFD5]/70 uppercase tracking-wider font-mono">
                Active Vault Bean
              </div>
              <div className="text-xs font-bold text-white font-mono leading-tight group-hover:text-[#FAF7F2]">
                {currentBean.name}
              </div>
              <div className="text-[10px] text-[#E8DFD5]/80 mt-0.5 flex items-center gap-1.5">
                <span className="capitalize">{currentBean.roastLevel} Roast</span> • 
                <span>{currentGrinder.name.split(' ')[0]} {currentGrinder.name.split(' ')[1] || ''}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E8DFD5]/60 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* 2. Quick Favorites Ribbon */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-[10px] font-mono text-[#E8DFD5]/60 uppercase tracking-wider mb-2.5 font-bold">
            Quick Favorites & 1-Tap Select:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {DRINK_RECIPES.filter((d) => favoriteIds.includes(d.id)).map((drink) => {
              const isSelected = drink.id === selectedDrink.id;
              return (
                <button
                  key={drink.id}
                  onClick={() => onSelectDrink(drink)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#C26D52] text-white shadow-xs font-bold scale-[1.02]'
                      : 'bg-white/10 text-[#FAF7F2] hover:bg-white/20 border border-white/10'
                  }`}
                >
                  <span className="text-sm">
                    {drink.id === 'cappuccino' ? '☕' : drink.id === 'espresso' ? '🤎' : drink.id === 'flat-white' ? '🥛' : '☕'}
                  </span>
                  <span>{drink.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Selected Drink Master Card (Smart Machine Style) */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#E8DFD5]">
          {/* Drink Name & Header */}
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  selectedDrink.category === 'milk'
                    ? 'bg-[#FFFDF9] text-[#7A6E65] border-[#E8DFD5]'
                    : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                }`}
              >
                {selectedDrink.category === 'milk' ? '🥛 Specialty Milk Drink' : '☕ Pure Black Extraction'}
              </span>

              {/* Dialed In Status Badge */}
              {isDialedIn ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> DIALED IN
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> NEEDS DIAL-IN
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold font-serif text-[#2C2018]">
              {selectedDrink.name}
            </h3>
            <p className="text-xs text-[#7A6E65] leading-relaxed">
              {selectedDrink.description}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            {!isDialedIn && (
              <button
                type="button"
                onClick={() => onOpenDialInWizard(selectedDrink)}
                className="px-4 py-3 rounded-2xl border-2 border-[#C26D52] bg-[#FAF7F2] hover:bg-[#C26D52]/10 text-[#C26D52] text-xs font-mono font-bold flex items-center justify-center gap-2 transition"
              >
                <Sliders className="w-4 h-4" />
                <span>Start Dial-In Wizard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onLaunchScaleCam(selectedDrink)}
              className="px-6 py-3 rounded-2xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-md group"
            >
              <span>Pull Shot on Scale Cam</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

        {/* 4. Visual Cup Anatomy & Layer Cross-Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Layered Cup Graphic */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A6E65] mb-2 font-bold">
              Cup Anatomy & Layer Physics
            </div>
            
            {/* The Ceramic/Glass Cup Silhouette */}
            <div className="w-48 h-44 rounded-b-3xl rounded-t-lg border-4 border-[#2C2018] bg-white p-1 shadow-inner relative flex flex-col justify-end overflow-hidden">
              {/* Cup Rim highlight */}
              <div className="absolute top-0 inset-x-0 h-1 bg-[#E8DFD5]" />

              {/* Render Stacked Liquid Layers */}
              {selectedDrink.layers.map((layer, idx) => (
                <div
                  key={idx}
                  style={{
                    height: `${layer.percentage}%`,
                    backgroundColor: layer.color,
                  }}
                  className="w-full flex items-center justify-between px-2.5 border-t border-black/10 transition-all duration-300 relative group"
                >
                  <span
                    className={`text-[9px] font-mono font-bold truncate ${
                      layer.percentage > 40 ? 'text-black/80' : 'text-black/90'
                    }`}
                  >
                    {layer.name}
                  </span>
                  <span className="text-[9px] font-mono opacity-60">
                    {layer.percentage}%
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-[#7A6E65] font-mono mt-2 text-center">
              Target Liquid Output: <strong className="text-[#2C2018]">{selectedDrink.targetYieldGrams.toFixed(1)}g</strong>
            </div>
          </div>

          {/* Extraction Specs & Barista Guidance */}
          <div className="md:col-span-7 space-y-4">
            {/* 4 Primary Extraction Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[10px] text-[#7A6E65] font-mono uppercase">Dry Dose</div>
                <div className="text-base font-bold font-mono text-[#2C2018] mt-0.5">
                  {selectedDrink.defaultDoseGrams.toFixed(1)}g
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[10px] text-[#7A6E65] font-mono uppercase">Target Yield</div>
                <div className="text-base font-bold font-mono text-[#C26D52] mt-0.5">
                  {selectedDrink.targetYieldGrams.toFixed(1)}g
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[10px] text-[#7A6E65] font-mono uppercase">Ratio</div>
                <div className="text-base font-bold font-mono text-[#2C2018] mt-0.5">
                  1:{selectedDrink.targetRatio.toFixed(1)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center">
                <div className="text-[10px] text-[#7A6E65] font-mono uppercase">Target Time</div>
                <div className="text-base font-bold font-mono text-[#2C2018] mt-0.5">
                  ~{selectedDrink.expectedTimeSeconds}s
                </div>
              </div>
            </div>

            {/* Milk Steam Guide (Only for milk drinks like Cappuccino) */}
            {selectedDrink.milkGuide && (
              <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C2018] font-mono">
                  <Droplets className="w-3.5 h-3.5 text-[#C26D52]" />
                  <span>Micro-Foam Steaming Guide</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#7A6E65]">
                    <Thermometer className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>Temp: <strong className="text-[#2C2018]">{selectedDrink.milkGuide.tempCelsius}°C</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[#7A6E65]">
                    <Droplets className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>Milk: <strong className="text-[#2C2018]">{selectedDrink.milkGuide.volumeMl}ml</strong></span>
                  </div>
                </div>
                <p className="text-[11px] text-[#7A6E65] leading-relaxed">
                  Texture: <span className="text-[#2C2018] font-semibold">{selectedDrink.milkGuide.foamStyle}</span>. ({selectedDrink.milkGuide.ratioDescription})
                </p>
              </div>
            )}

            {/* Dial-In Pro Tip */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] text-[#2C2018] leading-relaxed flex items-start gap-2.5">
              <span className="text-sm">💡</span>
              <div>
                <strong className="text-[#C26D52] font-mono uppercase text-[10px] tracking-wider block mb-0.5">
                  Barista Dial-In Guidance for {currentGrinder.name}:
                </strong>
                <span>
                  {currentBean.grindSetting
                    ? `Currently locked at setting ${currentBean.grindSetting} for ${currentBean.name}. ${selectedDrink.dialInTip}`
                    : `Recommended starting point: Step ${currentGrinder.defaultSetting} on ${currentGrinder.name}. ${selectedDrink.dialInTip}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete Specialty Drink Menu (Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            Browse All Specialty Coffee Drinks
          </h4>
          <span className="text-[11px] text-[#7A6E65] font-mono">
            {DRINK_RECIPES.length} calibrated recipes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DRINK_RECIPES.map((drink) => {
            const isSelected = drink.id === selectedDrink.id;
            return (
              <div
                key={drink.id}
                onClick={() => onSelectDrink(drink)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20 shadow-xs'
                    : 'border-[#E8DFD5] bg-white hover:border-[#C26D52]/50 hover:bg-[#FAF7F2]/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">
                      {drink.id === 'cappuccino' ? '☕' : drink.id === 'espresso' ? '🤎' : drink.id === 'flat-white' ? '🥛' : drink.id === 'cortado' ? '☕' : drink.id === 'lungo' ? '🫖' : '🧊'}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                        drink.category === 'milk'
                          ? 'bg-[#FAF7F2] text-[#7A6E65] border-[#E8DFD5]'
                          : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                      }`}
                    >
                      {drink.category === 'milk' ? 'Milk' : 'Black'}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-[#2C2018] font-serif leading-tight">
                      {drink.name}
                    </h5>
                    <p className="text-[11px] text-[#7A6E65] mt-0.5 line-clamp-1">
                      {drink.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#E8DFD5]/60 flex items-center justify-between text-[11px] font-mono text-[#7A6E65]">
                  <span>{drink.defaultDoseGrams}g → {drink.targetYieldGrams}g</span>
                  <span className="text-[#C26D52] font-semibold flex items-center gap-0.5">
                    Select <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
