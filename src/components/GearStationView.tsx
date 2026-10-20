import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Thermometer,
  Check,
  Droplets,
} from 'lucide-react';
import type {
  CoffeeBeanProfile,
  GrinderProfile,
  TempUnit,
  ShotRecord,
} from '../types/espresso';
import {
  formatTemperature,
  celsiusToFahrenheit,
} from '../lib/espressoMath';
import {
  getMachineTempProfile,
  loadPreinfusionOverride,
  savePreinfusionOverride,
  loadLastCleanse,
  saveLastCleanse,
  saveGrinders,
  saveMachineName,
  saveFilterBrewer,
  saveKettle,
  loadMachinesInSetup,
  saveMachinesInSetup,
  loadBrewersInSetup,
  saveBrewersInSetup,
  loadKettlesInSetup,
  saveKettlesInSetup,
} from '../lib/storage';
import { useTranslation } from '../i18n';
import { SafeRangeSlider } from './SafeRangeSlider';
import {
  GRINDER_CATALOG,
  MACHINE_CATALOG,
  BREWER_CATALOG,
  KETTLE_CATALOG,
} from '../data/gearCatalog';
import type { GearCatalogItem } from '../data/gearCatalog';
import { GearCardCarousel } from './gear/GearCardCarousel';
import type { CarouselGearItem } from './gear/GearCardCarousel';
import { AddGearModal } from './gear/AddGearModal';
import { AdminGearImageModal } from './gear/AdminGearImageModal';
import { FrenchPressVolumeCalculator } from './gear/FrenchPressVolumeCalculator';
import type { CardThemePreset } from '../lib/cardThemes';

interface GearStationViewProps {
  currentBean?: CoffeeBeanProfile;
  activeBeans?: CoffeeBeanProfile[];
  activeDrinkId?: string;
  setActiveMode?: (mode: 'beandex' | 'flow') => void;
  onOpenDialInWizard?: (drink: any) => void;
  grinderName: string;
  setGrinderName: (name: string) => void;
  grindSetting: string;
  setGrindSetting: (setting: string) => void;
  grinders: GrinderProfile[];
  setGrinders: React.Dispatch<React.SetStateAction<GrinderProfile[]>>;
  machineName: string;
  setMachineName: (name: string) => void;
  machinePreInfusion: number;
  setMachinePreInfusion: (sec: number) => void;
  filterBrewer: string;
  setFilterBrewer: (brewer: string) => void;
  kettleName: string;
  setKettleName: (kettle: string) => void;
  tempUnit: TempUnit;
  setTempUnit: (unit: TempUnit) => void;
  isAdminEditMode: boolean;
  grinderTheme: CardThemePreset;
  setGrinderTheme: (t: CardThemePreset) => void;
  grinderAdjustments: any;
  machineTheme: CardThemePreset;
  setMachineTheme: (t: CardThemePreset) => void;
  machineAdjustments: any;
  filterTheme: CardThemePreset;
  setFilterTheme: (t: CardThemePreset) => void;
  filterAdjustments: any;
  shots: ShotRecord[];
  onOpenCustomGrinderModal?: () => void;
}

export const GearStationView: React.FC<GearStationViewProps> = ({
  currentBean: _currentBean,
  activeDrinkId: _activeDrinkId,
  setActiveMode: _setActiveMode,
  onOpenDialInWizard: _onOpenDialInWizard,
  grinderName,
  setGrinderName,
  grindSetting,
  setGrindSetting,
  grinders,
  setGrinders,
  machineName,
  setMachineName,
  machinePreInfusion,
  setMachinePreInfusion,
  filterBrewer,
  setFilterBrewer,
  kettleName,
  setKettleName,
  tempUnit,
  setTempUnit,
  isAdminEditMode,
  grinderTheme: _grinderTheme,
  setGrinderTheme: _setGrinderTheme,
  grinderAdjustments: _grinderAdjustments,
  machineTheme: _machineTheme,
  setMachineTheme: _setMachineTheme,
  machineAdjustments: _machineAdjustments,
  filterTheme: _filterTheme,
  setFilterTheme: _setFilterTheme,
  filterAdjustments: _filterAdjustments,
  shots,
  onOpenCustomGrinderModal: _onOpenCustomGrinderModal,
}) => {
  const { t } = useTranslation();

  // Find active grinder profile
  const activeGrinder =
    grinders.find((g) => g.name === grinderName) ||
    grinders[0] || {
      id: 'default',
      name: 'Baratza Encore ESP Pro',
      type: 'stepped' as const,
      defaultSetting: '15.0',
      stepUnit: 'micro-steps',
      burrType: 'M2 40mm Steel Conical',
      minSetting: 1.0,
      maxSetting: 40.0,
      espressoMaxSetting: 20.0,
    };

  // Pre-infusion & machine profile
  const machineProfile = getMachineTempProfile(machineName);
  const [hasOverride, setHasOverride] = useState<boolean>(() =>
    loadPreinfusionOverride(machineName)
  );

  useEffect(() => {
    setHasOverride(loadPreinfusionOverride(machineName));
    const prof = getMachineTempProfile(machineName);
    if (prof.defaultPreInfusionSeconds !== undefined) {
      setMachinePreInfusion(prof.defaultPreInfusionSeconds);
    }
    if (prof.defaultTempC !== undefined) {
      setCurrentTempC(prof.defaultTempC);
    }
  }, [machineName]);

  const toggleOverride = () => {
    const next = !hasOverride;
    setHasOverride(next);
    savePreinfusionOverride(machineName, next);
  };

  const isAdjustable =
    machineProfile.preInfusionControl === 'adjustable' || hasOverride;

  // Temperature state
  const defaultTemp = machineProfile.defaultTempC ?? 93.0;
  const [currentTempC, setCurrentTempC] = useState<number>(defaultTemp);

  // Maintenance clean logging
  const [lastCleanse, setLastCleanseState] = useState<{
    timestamp: number;
    type: string;
  }>(() => loadLastCleanse());
  const [cleanseFeedback, setCleanseFeedback] = useState(false);

  const daysSinceCleanse = Math.max(
    0,
    Math.floor((Date.now() - lastCleanse.timestamp) / (1000 * 60 * 60 * 24))
  );

  const handleLogCleanse = () => {
    saveLastCleanse('Urnex Cafiza Soak');
    setLastCleanseState({ timestamp: Date.now(), type: 'Urnex Cafiza Soak' });
    setCleanseFeedback(true);
    setTimeout(() => setCleanseFeedback(false), 2500);
  };

  // Numerical setting helper for grinder
  const currentGrindNum = parseFloat(grindSetting) || 15.0;
  const isDualZoneBaratza =
    activeGrinder.name.toLowerCase().includes('baratza') &&
    activeGrinder.name.toLowerCase().includes('esp');

  // Resilient Espresso zone threshold: saved profile -> catalog specs -> dual-zone fallback -> 40% of max
  const catalogGrinderSpecs = GRINDER_CATALOG.find(
    (g) => g.name.toLowerCase() === activeGrinder.name.toLowerCase()
  )?.specs;

  const effectiveEspressoMax =
    activeGrinder.espressoMaxSetting ??
    catalogGrinderSpecs?.espressoMaxSetting ??
    (isDualZoneBaratza
      ? 20.0
      : activeGrinder.maxSetting
      ? activeGrinder.maxSetting * 0.4
      : 20.0);

  const isEspressoZone = currentGrindNum <= effectiveEspressoMax;

  const stepGrind = (delta: number) => {
    const min = activeGrinder.minSetting ?? 1.0;
    const max = activeGrinder.maxSetting ?? (isDualZoneBaratza ? 40.0 : 30.0);
    const nextVal = Math.min(
      max,
      Math.max(min, Math.round((currentGrindNum + delta) * 10) / 10)
    );
    setGrindSetting(nextVal.toFixed(1));
  };

  // Shots logged for this specific grinder
  const grinderShotCount = shots.filter(
    (s) => s.grinderName?.toLowerCase() === grinderName.toLowerCase()
  ).length;

  // Equipment in Setup States
  const [machinesInSetup, setMachinesInSetup] = useState<string[]>(() =>
    loadMachinesInSetup()
  );
  const [brewersInSetup, setBrewersInSetup] = useState<string[]>(() =>
    loadBrewersInSetup()
  );
  const [kettlesInSetup, setKettlesInSetup] = useState<string[]>(() =>
    loadKettlesInSetup()
  );

  // Add Gear Modal State
  const [addModalCategory, setAddModalCategory] = useState<
    'grinder' | 'machine' | 'brewer' | 'kettle' | null
  >(null);
  const [adminModalGearItem, setAdminModalGearItem] = useState<CarouselGearItem | null>(null);

  // --- 1. GRINDERS CAROUSEL DATA & HANDLERS ---
  const grinderCarouselItems: CarouselGearItem[] = grinders
    .filter((g) => g.inSetup)
    .map((g) => {
      const gNorm = g.name.toLowerCase().trim();
      const cat = GRINDER_CATALOG.find(
        (c) =>
          c.name.toLowerCase().trim() === gNorm ||
          gNorm.includes(c.brand.toLowerCase()) ||
          c.name.toLowerCase().includes(gNorm) ||
          gNorm.includes(c.name.toLowerCase().split(' ')[0])
      );
      return {
        id: g.id,
        name: g.name,
        brand: cat?.brand,
        subCategory: cat?.subCategory || g.burrType,
        image: cat?.image || '/images/gear/grinders/baratza-esp.webp',
        category: 'grinder',
        specsSummary: `${g.burrType || cat?.specs?.burrType || 'Conical'} • ${grinderShotCount} shots`,
      };
    });

  const handleSelectGrinder = (item: CarouselGearItem) => {
    setGrinderName(item.name);
    const found = grinders.find((g) => g.name === item.name);
    if (found?.defaultSetting) {
      setGrindSetting(found.defaultSetting);
    }
  };

  const handleRemoveGrinder = (item: CarouselGearItem) => {
    const updated = grinders.map((g) =>
      g.id === item.id ? { ...g, inSetup: false } : g
    );
    setGrinders(updated);
    saveGrinders(updated);
    if (grinderName.toLowerCase() === item.name.toLowerCase()) {
      const remaining = updated.filter((g) => g.inSetup);
      if (remaining.length > 0) {
        setGrinderName(remaining[0].name);
        setGrindSetting(remaining[0].defaultSetting || '15.0');
      }
    }
  };

  // --- 2. ESPRESSO MACHINES CAROUSEL DATA & HANDLERS ---
  const machineCarouselItems: CarouselGearItem[] = machinesInSetup.map(
    (mName, idx) => {
      const mNorm = mName.toLowerCase().trim();
      const cat = MACHINE_CATALOG.find(
        (c) =>
          c.name.toLowerCase().trim() === mNorm ||
          mNorm.includes(c.brand.toLowerCase()) ||
          c.name.toLowerCase().includes(mNorm) ||
          (c.brand && mNorm.includes(c.brand.toLowerCase().split(' ')[0]))
      );
      const prof = getMachineTempProfile(mName);
      return {
        id: `machine-${idx}-${mName}`,
        name: mName,
        brand: cat?.brand,
        subCategory: cat?.subCategory || 'Espresso Machine',
        image: cat?.image || '/images/gear/machines/espresso-machine.webp',
        category: 'machine',
        specsSummary: `${prof.maxPumpBar || 9.0} Bar • ${cat?.subCategory || 'Espresso'}`,
      };
    }
  );

  const handleSelectMachine = (item: CarouselGearItem) => {
    setMachineName(item.name);
    saveMachineName(item.name);
    const prof = getMachineTempProfile(item.name);
    setMachinePreInfusion(prof.defaultPreInfusionSeconds ?? 6.0);
  };

  const handleRemoveMachine = (item: CarouselGearItem) => {
    const updated = machinesInSetup.filter((m) => m !== item.name);
    setMachinesInSetup(updated);
    saveMachinesInSetup(updated);
    if (machineName === item.name && updated.length > 0) {
      setMachineName(updated[0]);
      saveMachineName(updated[0]);
    }
  };

  // --- 3. FILTER BREWERS CAROUSEL DATA & HANDLERS ---
  const brewerCarouselItems: CarouselGearItem[] = brewersInSetup.map(
    (bName, idx) => {
      const bNorm = bName.toLowerCase().trim();
      const cat = BREWER_CATALOG.find(
        (c) =>
          c.name.toLowerCase().trim() === bNorm ||
          bNorm.includes(c.brand.toLowerCase()) ||
          c.name.toLowerCase().includes(bNorm) ||
          (bNorm.includes('french') && c.id.includes('french')) ||
          (bNorm.includes('stempel') && c.id.includes('french')) ||
          (bNorm.includes('v60') && c.id.includes('v60'))
      );
      const defaultBrewerImg =
        bNorm.includes('french') || bNorm.includes('stempel')
          ? '/images/gear/brewers/french-press.webp'
          : '/images/gear/brewers/hario-v60.webp';
      return {
        id: `brewer-${idx}-${bName}`,
        name: bName,
        brand: cat?.brand,
        subCategory: cat?.subCategory,
        image: cat?.image || defaultBrewerImg,
        category: 'brewer',
        specsSummary: cat?.subCategory || 'Manual Brewer',
      };
    }
  );

  const handleSelectBrewer = (item: CarouselGearItem) => {
    setFilterBrewer(item.name);
    saveFilterBrewer(item.name);
  };

  const handleRemoveBrewer = (item: CarouselGearItem) => {
    const updated = brewersInSetup.filter((b) => b !== item.name);
    setBrewersInSetup(updated);
    saveBrewersInSetup(updated);
    if (filterBrewer === item.name && updated.length > 0) {
      setFilterBrewer(updated[0]);
      saveFilterBrewer(updated[0]);
    }
  };

  // --- 4. KETTLES CAROUSEL DATA & HANDLERS ---
  const kettleCarouselItems: CarouselGearItem[] = kettlesInSetup.map(
    (kName, idx) => {
      const kNorm = kName.toLowerCase().trim();
      const cat = KETTLE_CATALOG.find(
        (c) =>
          c.name.toLowerCase().trim() === kNorm ||
          kNorm.includes(c.brand.toLowerCase()) ||
          c.name.toLowerCase().includes(kNorm)
      );
      return {
        id: `kettle-${idx}-${kName}`,
        name: kName,
        brand: cat?.brand,
        subCategory: cat?.subCategory,
        image: cat?.image || '/images/gear/kettles/fellow-stagg.webp',
        category: 'kettle',
        specsSummary: cat?.subCategory || 'Water Kettle',
      };
    }
  );

  const handleSelectKettle = (item: CarouselGearItem) => {
    setKettleName(item.name);
    saveKettle(item.name);
  };

  const handleRemoveKettle = (item: CarouselGearItem) => {
    const updated = kettlesInSetup.filter((k) => k !== item.name);
    setKettlesInSetup(updated);
    saveKettlesInSetup(updated);
    if (kettleName === item.name && updated.length > 0) {
      setKettleName(updated[0]);
      saveKettle(updated[0]);
    }
  };

  // --- MASTER ADD TO SETUP HANDLER ---
  const handleAddGearToSetup = (item: GearCatalogItem) => {
    if (item.category === 'grinder') {
      const existing = grinders.find(
        (g) => g.name.toLowerCase() === item.name.toLowerCase()
      );
      let updated: GrinderProfile[];
      if (existing) {
        updated = grinders.map((g) =>
          g.id === existing.id ? { ...g, inSetup: true } : g
        );
      } else {
        const newG: GrinderProfile = {
          id: item.id || `grinder-${Date.now()}`,
          name: item.name,
          type: item.specs.stepType || 'stepped',
          defaultSetting: item.specs.defaultSetting || '15.0',
          stepUnit: item.specs.stepUnit || 'steps',
          burrType: item.specs.burrType,
          minSetting: item.specs.minSetting ?? 1.0,
          maxSetting: item.specs.maxSetting ?? 40.0,
          espressoMaxSetting: item.specs.espressoMaxSetting,
          inSetup: true,
        };
        updated = [...grinders, newG];
      }
      setGrinders(updated);
      saveGrinders(updated);
      setGrinderName(item.name);
      setGrindSetting(item.specs.defaultSetting || '15.0');
    } else if (item.category === 'machine') {
      if (!machinesInSetup.includes(item.name)) {
        const updated = [...machinesInSetup, item.name];
        setMachinesInSetup(updated);
        saveMachinesInSetup(updated);
      }
      setMachineName(item.name);
      saveMachineName(item.name);
      const prof = getMachineTempProfile(item.name);
      setMachinePreInfusion(prof.defaultPreInfusionSeconds ?? 6.0);
    } else if (item.category === 'brewer') {
      if (!brewersInSetup.includes(item.name)) {
        const updated = [...brewersInSetup, item.name];
        setBrewersInSetup(updated);
        saveBrewersInSetup(updated);
      }
      setFilterBrewer(item.name);
      saveFilterBrewer(item.name);
    } else if (item.category === 'kettle') {
      if (!kettlesInSetup.includes(item.name)) {
        const updated = [...kettlesInSetup, item.name];
        setKettlesInSetup(updated);
        saveKettlesInSetup(updated);
      }
      setKettleName(item.name);
      saveKettle(item.name);
    }
  };

  const isFrenchPressActive =
    filterBrewer.toLowerCase().includes('french') ||
    filterBrewer.toLowerCase().includes('stempel');

  return (
    <div className="space-y-6 font-mono text-xs pb-10">
      {/* =========================================================================
          STATION HEADER (Clean, Minimalist & Focused on Gear)
          ========================================================================= */}
      <div className="flex items-center justify-between bg-[#FFFDF9] rounded-2xl border border-[#D0BDAA] p-4 sm:p-5 shadow-xs">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#7A6E65] uppercase">
            BARISTA BENCH & MACHINERY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2C2018] tracking-tight mt-0.5">
            {t('gear.station_title')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isAdminEditMode && (
            <a
              href="/gear-audit.html"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-[#C26D52]/10 border border-[#C26D52]/30 text-[#C26D52] hover:bg-[#C26D52]/20 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Åbn komplet visuelt billed-galleri og scan alle 104 modeller"
            >
              <span>🔍 Scan Alle Billeder</span>
            </a>
          )}
          <span className="text-[11px] font-mono text-[#7A6E65] bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#D0BDAA] font-semibold">
            {grinders.filter((g) => g.inSetup).length} {grinders.filter((g) => g.inSetup).length === 1 ? 'Kværn' : 'Kværne'} i setup
          </span>
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: GRINDER FLEET & ACTIVE BAR STATION
          ========================================================================= */}
      <div className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#D0BDAA] shadow-md p-4 sm:p-5 space-y-5 transition-all duration-300">
        {/* Grinder Equipment Carousel with Real Photos & Add/Remove */}
        <GearCardCarousel
          title={t('gear.grinders_title')}
          subtitle={t('gear.grinders_subtitle')}
          items={grinderCarouselItems}
          activeIdOrName={grinderName}
          onSelect={handleSelectGrinder}
          onRemove={handleRemoveGrinder}
          onOpenAddModal={() => setAddModalCategory('grinder')}
          addLabel={t('gear.add_grinder_btn')}
          isAdminEditMode={isAdminEditMode}
          onOpenAdminImageModal={setAdminModalGearItem}
        />

        {/* Cockpit Body (Taktil Dial-In Ruler & Micro-Indexed Steppers) */}
        <div className="space-y-4 pt-1">
          {/* Main Dial-In Hero Box */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D0BDAA] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A6E65]">
                CURRENT MICRO-INDEXED POSITION
              </span>
              <span className="text-[10px] font-bold uppercase text-[#C26D52] bg-[#C26D52]/10 px-2 py-0.5 rounded-md border border-[#C26D52]/30">
                {isEspressoZone ? t('gear.espresso_zone') : t('gear.filter_zone')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-[#2C2018] tracking-tight">
                  {currentGrindNum.toFixed(1)}
                </span>
                <span className="text-[11px] text-[#7A6E65] uppercase font-mono font-medium">
                  {isDualZoneBaratza && currentGrindNum > 20.0
                    ? t('gear.macro_step')
                    : t('gear.micro_step')}
                </span>
              </div>

              {/* Tactile Hardware Stepper Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepGrind(-0.5)}
                  className="w-10 h-10 rounded-xl bg-white border border-[#D0BDAA] text-[#2C2018] hover:bg-[#FAF7F2] hover:border-[#C26D52] font-bold text-lg flex items-center justify-center shadow-xs active:scale-90 transition cursor-pointer"
                  title="Finer grind"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => stepGrind(+0.5)}
                  className="w-10 h-10 rounded-xl bg-white border border-[#D0BDAA] text-[#2C2018] hover:bg-[#FAF7F2] hover:border-[#C26D52] font-bold text-lg flex items-center justify-center shadow-xs active:scale-90 transition cursor-pointer"
                  title="Coarser grind"
                >
                  +
                </button>
              </div>
            </div>

            {/* Visual Stepped Ruler with Mechanical Caliper Ticks */}
            <div className="pt-2 space-y-1.5">
              {/* Header Label Row ABOVE ruler: Fine on left, Split if present, Coarse on right */}
              <div className="flex items-center justify-between text-[10px] font-mono select-none px-1">
                <span className="font-bold text-[#C26D52]">
                  Fine ({activeGrinder.minSetting || (isDualZoneBaratza ? '1.0' : '0')})
                </span>

                {isDualZoneBaratza ? (
                  <span className="font-bold text-stone-600 bg-white/80 border border-[#D0BDAA] px-2 py-0.5 rounded-md text-[9px] shadow-2xs">
                    Split (20.0)
                  </span>
                ) : effectiveEspressoMax ? (
                  <span className="hidden sm:inline font-semibold text-stone-600 bg-white/80 border border-[#D0BDAA] px-2 py-0.5 rounded-md text-[9px] shadow-2xs">
                    Espresso ≤ {effectiveEspressoMax.toFixed(effectiveEspressoMax % 1 === 0 ? 0 : 1)}
                  </span>
                ) : null}

                <span className="font-bold text-[#72806B]">
                  Coarse ({activeGrinder.maxSetting || (isDualZoneBaratza ? '40.0' : '30')})
                </span>
              </div>

              {/* Clean Ruler Box with Caliper Ticks & Slider Thumb */}
              <div className="relative w-full h-9 bg-white rounded-xl border border-[#D0BDAA] px-3 flex items-center overflow-hidden shadow-2xs">
                {/* Mechanical Caliper Ticks (z-0 behind text) */}
                <div className="absolute inset-0 px-3 flex items-end pointer-events-none z-0">
                  <div className="relative w-full h-full">
                    {Array.from({ length: isDualZoneBaratza ? 40 : 31 }, (_, idx) => {
                      const tickVal = isDualZoneBaratza
                        ? idx + 1
                        : (activeGrinder.minSetting || 0) +
                          (idx / 30) *
                            ((activeGrinder.maxSetting || 30) -
                              (activeGrinder.minSetting || 0));
                      const percent = (idx / (isDualZoneBaratza ? 39 : 30)) * 100;
                      const isSplit = isDualZoneBaratza && tickVal === 20;
                      const isMajor = idx === 0 || idx === (isDualZoneBaratza ? 39 : 30);
                      const isMid = isDualZoneBaratza ? tickVal % 5 === 0 : idx % 5 === 0;

                      let tickHeight = 'h-2 w-[1px] bg-[#D0BDAA]/70';
                      if (isSplit) {
                        tickHeight = 'h-6 w-0.5 bg-[#C26D52]';
                      } else if (isMajor) {
                        tickHeight = 'h-4 w-0.5 bg-[#2C2018]';
                      } else if (isMid) {
                        tickHeight = 'h-3 w-0.5 bg-[#A6998E]';
                      }

                      return (
                        <div
                          key={`tick-${idx}`}
                          className={`absolute bottom-0 -translate-x-1/2 ${tickHeight}`}
                          style={{ left: `${percent}%` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Animated Dialed Indicator Notch (z-20 on top of everything) */}
                <div
                  className="absolute bottom-0 top-0 w-1 bg-[#C26D52] shadow-sm transition-all duration-150 pointer-events-none z-20"
                  style={{
                    left: `${Math.min(
                      96,
                      Math.max(
                        4,
                        ((currentGrindNum - (activeGrinder.minSetting || 1)) /
                          ((activeGrinder.maxSetting || (isDualZoneBaratza ? 40 : 30)) -
                            (activeGrinder.minSetting || 1))) *
                          100
                      )
                    )}%`,
                  }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-[#C26D52] -translate-x-1.25 -translate-y-1 shadow-md border-2 border-white" />
                </div>
              </div>

              {/* Dual-Zone Explanation for Baratza ESP */}
              {isDualZoneBaratza && (
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#7A6E65] px-1 font-sans">
                  <span className="text-[#C26D52] font-semibold">
                    ● 1–20: 20µm Micro-Steps (Espresso)
                  </span>
                  <span className="text-[#72806B] font-semibold">
                    ● 21–40: 90µm Macro-Steps (Filter & V60)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODULE 2: EXTRACTION UNIT (ESPRESSO MACHINE & PUMP SETUP)
          ========================================================================= */}
      <div className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#D0BDAA] shadow-md p-4 sm:p-5 space-y-5 transition-all duration-300">
        {/* Machine Equipment Carousel with Real Photos & Add/Remove */}
        <GearCardCarousel
          title={t('gear.machines_title')}
          subtitle={t('gear.machines_subtitle')}
          items={machineCarouselItems}
          activeIdOrName={machineName}
          onSelect={handleSelectMachine}
          onRemove={handleRemoveMachine}
          onOpenAddModal={() => setAddModalCategory('machine')}
          addLabel={t('gear.add_machine_btn')}
          isAdminEditMode={isAdminEditMode}
          onOpenAdminImageModal={setAdminModalGearItem}
        />

        {/* Machine Cockpit Controls */}
        <div className="space-y-4 pt-1">

          {/* PRE-INFUSION SOAK SECTION */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D0BDAA] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#C26D52]" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A6E65]">
                  {t('gear.preinfusion_target')}
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-[#2C2018]">
                {machinePreInfusion.toFixed(1)}s
              </span>
            </div>

            {/* If adjustable (or override active) */}
            {isAdjustable ? (
              <div className="space-y-3">
                <SafeRangeSlider
                  min={0}
                  max={15}
                  step={0.5}
                  value={machinePreInfusion}
                  onChange={(val) => setMachinePreInfusion(val)}
                  accentColor="#C26D52"
                  theme="light"
                  ariaLabel={t('gear.preinfusion_target')}
                />

                {/* 3-Zone Quick Preset Buttons */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setMachinePreInfusion(0.0)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      machinePreInfusion === 0
                        ? 'bg-[#2C2018] text-white border-[#2C2018] font-bold shadow-xs'
                        : 'bg-white text-[#7A6E65] border-[#D0BDAA] hover:border-[#C26D52]'
                    }`}
                  >
                    0s (Direct 9 bar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMachinePreInfusion(6.0)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      machinePreInfusion >= 5 && machinePreInfusion <= 8
                        ? 'bg-[#C26D52] text-white border-[#C26D52] font-bold shadow-xs'
                        : 'bg-white text-[#7A6E65] border-[#D0BDAA] hover:border-[#C26D52]'
                    }`}
                  >
                    5–8s (Sweet Spot)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMachinePreInfusion(15.0)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      machinePreInfusion >= 12
                        ? 'bg-[#2C2018] text-white border-[#2C2018] font-bold shadow-xs'
                        : 'bg-white text-[#7A6E65] border-[#D0BDAA] hover:border-[#C26D52]'
                    }`}
                  >
                    15s (Lever Soak)
                  </button>
                </div>
              </div>
            ) : (
              /* Factory profile locked informative view */
              <div className="p-3 rounded-xl bg-white border border-[#D0BDAA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C2018] text-xs">
                    {machineProfile.preInfusionNote || t('gear.preinfusion_factory_locked')}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-100 border border-stone-300 text-stone-600 font-bold">
                    FACTORY PROFILE
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6E65] font-sans">
                  Denne maskines pumpe kører med fabriksstyret tidsmætning.
                </p>
              </div>
            )}

            {/* Custom Modded / Flow Control Override Switch */}
            <div className="pt-2 border-t border-[#D0BDAA]/60 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#2C2018] block">
                  ⚙️ {t('gear.preinfusion_override')}
                </span>
                <span className="text-[9px] text-[#7A6E65] font-sans">
                  {t('gear.preinfusion_override_desc')}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleOverride}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasOverride ? 'bg-[#C26D52]' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={hasOverride}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hasOverride ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* PID BOILER TEMPERATURE HERO */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D0BDAA] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#C26D52]" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A6E65]">
                  {t('gear.pid_stability')}
                </span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800">
                {t('gear.pid_stabilized')}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-[#2C2018] tracking-tight">
                  {tempUnit === 'F'
                    ? celsiusToFahrenheit(currentTempC).toFixed(1)
                    : currentTempC.toFixed(1)}
                  °{tempUnit}
                </span>
                <span className="text-xs text-[#7A6E65] font-mono">
                  {tempUnit === 'F'
                    ? `${currentTempC.toFixed(1)}°C`
                    : `${celsiusToFahrenheit(currentTempC).toFixed(1)}°F`}
                </span>
              </div>

              {/* Temp unit toggle (°C / °F) */}
              <button
                type="button"
                onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#D0BDAA] hover:border-[#C26D52] text-[#2C2018] text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              >
                Switch to °{tempUnit === 'C' ? 'F' : 'C'}
              </button>
            </div>

            {/* 3 Quick Roast-Level Preset Buttons */}
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1">
              <button
                type="button"
                onClick={() => setCurrentTempC(91.5)}
                className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                  currentTempC === 91.5
                    ? 'bg-[#2C2018] text-white border-[#2C2018] font-bold shadow-xs'
                    : 'bg-white text-[#7A6E65] border-[#D0BDAA] hover:border-[#C26D52]'
                }`}
              >
                <span className="block text-[9px] text-[#A6998E]">MØRKRISTET</span>
                <span className="font-bold">
                  {formatTemperature(91.5, tempUnit)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTempC(93.0)}
                className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                  currentTempC === 93.0
                    ? 'bg-[#C26D52] text-white border-[#C26D52] font-bold shadow-xs'
                    : 'bg-white text-[#7A6E65] border-[#D0BDAA] hover:border-[#C26D52]'
                }`}
              >
                <span className="block text-[9px] text-amber-200">MELLEM / LYS</span>
                <span className="font-bold">
                  {formatTemperature(93.0, tempUnit)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTempC(95.5)}
                className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                  currentTempC === 95.5
                    ? 'bg-[#2C2018] text-white border-[#2C2018] font-bold shadow-xs'
                    : 'bg-white text-[#7A6E65] border-[#D0BDAA] hover:border-[#C26D52]'
                }`}
              >
                <span className="block text-[9px] text-[#A6998E]">NORDIC LIGHT</span>
                <span className="font-bold">
                  {formatTemperature(95.5, tempUnit)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODULE 3: FILTER & DRIP SUITE (POUR OVER & MANUAL BREWING)
          ========================================================================= */}
      <div className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#D0BDAA] shadow-md p-4 sm:p-5 space-y-5 transition-all duration-300">
        {/* Manual Brewers Carousel with Real Photos & Add/Remove */}
        <GearCardCarousel
          title={t('gear.brewers_title')}
          subtitle={t('gear.brewers_subtitle')}
          items={brewerCarouselItems}
          activeIdOrName={filterBrewer}
          onSelect={handleSelectBrewer}
          onRemove={handleRemoveBrewer}
          onOpenAddModal={() => setAddModalCategory('brewer')}
          addLabel={t('gear.add_brewer_btn')}
          isAdminEditMode={isAdminEditMode}
          onOpenAdminImageModal={setAdminModalGearItem}
        />

        {/* Dynamic French Press Volume & Ratio Calculator if French Press is Active */}
        {isFrenchPressActive && (
          <div className="pt-1">
            <FrenchPressVolumeCalculator />
          </div>
        )}

        {/* Pour-Over Kettles Carousel with Real Photos & Add/Remove */}
        <div className="pt-2">
          <GearCardCarousel
            title={t('gear.kettles_title')}
            subtitle={t('gear.kettles_subtitle')}
            items={kettleCarouselItems}
            activeIdOrName={kettleName}
            onSelect={handleSelectKettle}
            onRemove={handleRemoveKettle}
            onOpenAddModal={() => setAddModalCategory('kettle')}
            addLabel={t('gear.add_kettle_btn')}
            isAdminEditMode={isAdminEditMode}
            onOpenAdminImageModal={setAdminModalGearItem}
          />
        </div>

        {/* Automatic Grinder Sync Informative Note */}
        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#D0BDAA] text-xs font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-[#C26D52] text-[11px] font-bold">
            <span>☕ {t('gear.filter_sync_title')}</span>
          </div>
          <p className="text-[11px] text-[#7A6E65] font-sans leading-relaxed">
            {t('gear.filter_sync_desc', {
              brewer: filterBrewer.split('(')[0].trim(),
              grinder: grinderName,
            })}
          </p>
        </div>
      </div>

      {/* =========================================================================
          MODULE 4: MACHINE CARE & CAFIZA TRACKER
          ========================================================================= */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#D0BDAA] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              daysSinceCleanse < 7
                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                : daysSinceCleanse < 14
                ? 'bg-amber-500 ring-2 ring-amber-200'
                : 'bg-rose-500 ring-2 ring-rose-200 animate-pulse'
            }`}
          />
          <div>
            <h4 className="text-xs font-bold text-[#2C2018]">
              {daysSinceCleanse === 0
                ? t('gear.last_cleanse_today')
                : t('gear.last_cleanse', { days: daysSinceCleanse })}
            </h4>
            <p className="text-[10px] text-[#7A6E65] font-sans">
              Opretholder optimal flowdynamik og forhindrer harske kaffeolier i gruppehoved og kværnknive.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogCleanse}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs self-start sm:self-auto shrink-0 ${
            cleanseFeedback
              ? 'bg-emerald-600 text-white'
              : 'bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2]'
          }`}
        >
          {cleanseFeedback ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{t('gear.cleanse_logged')}</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-[#C26D52]" />
              <span>{t('gear.log_cleanse')}</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Equipment Catalog Modal */}
      <AddGearModal
        isOpen={Boolean(addModalCategory)}
        onClose={() => setAddModalCategory(null)}
        category={addModalCategory || 'grinder'}
        onAddGear={handleAddGearToSetup}
        existingNames={
          addModalCategory === 'grinder'
            ? grinders.filter((g) => g.inSetup).map((g) => g.name)
            : addModalCategory === 'machine'
            ? machinesInSetup
            : addModalCategory === 'brewer'
            ? brewersInSetup
            : kettlesInSetup
        }
        isAdminEditMode={isAdminEditMode}
        onOpenAdminImageModal={setAdminModalGearItem}
      />

      {/* Admin Gear Reference & Upload Modal */}
      <AdminGearImageModal
        isOpen={Boolean(adminModalGearItem)}
        onClose={() => setAdminModalGearItem(null)}
        gear={adminModalGearItem}
      />
    </div>
  );
};

export default GearStationView;
