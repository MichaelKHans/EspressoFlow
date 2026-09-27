import { useState, useEffect, useRef } from 'react';
import { Coffee, Sliders, BookOpen, ShieldCheck, Flame, Plus, Check, Trash2, Layers, Camera, FlaskConical, Barcode, Globe, Star } from 'lucide-react';
import { useTranslation, type SupportedLanguage } from './i18n';
import { ScaleMonitor } from './components/ScaleMonitor';
import { FlowChart } from './components/FlowChart';
import { TasteFeedback } from './components/TasteFeedback';
import { Logbook } from './components/Logbook';
import { PaywallModal } from './components/PaywallModal';
import { LegalModal } from './components/LegalModal';
import { DrinkSelector } from './components/DrinkSelector';
import { DialInWizardModal } from './components/DialInWizardModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { BeanScannerModal } from './components/BeanScannerModal';
import { AdminPortal } from './components/AdminPortal';
import type { OnboardingResult } from './components/OnboardingWizard';
import { DRINK_RECIPES } from './data/drinkRecipes';
import type {
  ShotDataPoint,
  ShotRecord,
  TasteRating,
  UserAccessState,
  CoffeeBeanProfile,
  GrinderProfile,
  RoastLevel,
  RatioStyle,
  DrinkRecipe,
} from './types/espresso';
import {
  loadShots,
  saveShot,
  deleteShot,
  loadUserAccess,
  saveProStatus,
  loadBeans,
  saveBeans,
  loadGrinders,
  saveGrinders,
  loadDrinkGrindSettings,
  saveDrinkGrindSetting,
  loadOnboardingComplete,
  saveOnboardingComplete,
  loadMachineName,
  saveMachineName,
} from './lib/storage';
import { analyzeChanneling, RATIO_PRESETS, ROAST_PRESETS } from './lib/espressoMath';
import { parseCoffeeBagPhoto } from './lib/bagScanner';

export function App() {
  const { t, language, setLanguage, supportedLanguages, isMultiLanguageEnabled } = useTranslation();
  const [activeTab, setActiveTab] = useState<'drinks' | 'monitor' | 'logbook' | 'equipment'>('drinks');
  const [activeDrinkId, setActiveDrinkId] = useState<string>('cappuccino');
  const [isDialInWizardOpen, setIsDialInWizardOpen] = useState<boolean>(false);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [accessState, setAccessState] = useState<UserAccessState>(() => loadUserAccess());

  // Onboarding State
  const [isOnboardingDone, setIsOnboardingDone] = useState<boolean>(() => loadOnboardingComplete());

  // Bean Vault & Multi-Grinder State
  const [beans, setBeans] = useState<CoffeeBeanProfile[]>(() => loadBeans());
  const [activeBeanId, setActiveBeanId] = useState<string>(() => loadBeans()[0]?.id || 'bean-ethiopia');
  const [grinders, setGrinders] = useState<GrinderProfile[]>(() => loadGrinders());
  const [isAddingBean, setIsAddingBean] = useState<boolean>(false);
  const [newBeanName, setNewBeanName] = useState<string>('');
  const [newBeanRoaster, setNewBeanRoaster] = useState<string>('');
  const [newBeanRoastLevel, setNewBeanRoastLevel] = useState<RoastLevel>('medium');
  const [newBeanGrinderName, setNewBeanGrinderName] = useState<string>('');
  const [newBeanRoastDate, setNewBeanRoastDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isScanningBag, setIsScanningBag] = useState<boolean>(false);
  const [isBeanScannerOpen, setIsBeanScannerOpen] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Bean derived
  const currentBean = beans.find((b) => b.id === activeBeanId) || beans[0] || {
    id: 'default',
    name: 'Ethiopia Yirgacheffe',
    roaster: 'Nomad Coffee',
    roastDate: '2026-09-14',
    roastLevel: 'light' as RoastLevel,
    doseGrams: 18.0,
    ratioStyle: 'lungo' as RatioStyle,
    targetYieldGrams: 45.0,
    grindSetting: '1.4',
    grinderName: 'Eureka Mignon Specialita',
  };

  // Brewing & Equipment Parameters (Declared BEFORE currentGrinder to prevent TDZ crash)
  const [doseGrams, setDoseGrams] = useState<number>(currentBean.doseGrams);
  const [targetYieldGrams, setTargetYieldGrams] = useState<number>(currentBean.targetYieldGrams);
  const [grinderName, setGrinderName] = useState<string>(currentBean.grinderName);
  const [grindSetting, setGrindSetting] = useState<string>(currentBean.grindSetting);
  const [machineName, setMachineName] = useState<string>(() => loadMachineName());
  const [machinePreInfusion, setMachinePreInfusion] = useState<number>(6.0);
  const [coffeeBeanName, setCoffeeBeanName] = useState<string>(currentBean.name);
  const [roastDate, setRoastDate] = useState<string>(currentBean.roastDate);
  const [roastLevel, setRoastLevel] = useState<RoastLevel>(currentBean.roastLevel);
  const [ratioStyle, setRatioStyle] = useState<RatioStyle>(currentBean.ratioStyle);

  // Active Grinder derived safely after grinderName is declared
  const currentGrinder = grinders.find((g) => g.name === grinderName) || grinders[0] || {
    id: 'default',
    name: 'Baratza Encore ESP Pro',
    type: 'stepped' as const,
    defaultSetting: '15',
    stepUnit: 'micro-steps',
  };

  // Brewing State
  const [isBrewing, setIsBrewing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<ShotDataPoint[]>([]);
  const [lastFinishedShot, setLastFinishedShot] = useState<ShotRecord | null>(null);

  // Modals
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'support' | null>(null);

  // Admin Route state (e.g. espressoflow.vercel.app/admin or #admin)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return p.includes('admin') || h.includes('admin');
  });

  // Load persistence, handle legal deep links, and listen for route changes
  useEffect(() => {
    setShots(loadShots());
    setAccessState(loadUserAccess());

    // Deep link router for App Store / Google Play review URLs
    const path = window.location.pathname.toLowerCase();
    if (path.includes('privacy')) {
      setLegalModalTab('privacy');
    } else if (path.includes('terms') || path.includes('eula')) {
      setLegalModalTab('terms');
    } else if (path.includes('support') || path.includes('faq')) {
      setLegalModalTab('support');
    }

    const handleLocationChange = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      setIsAdminRoute(p.includes('admin') || h.includes('admin'));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleSelectBean = (beanId: string) => {
    setActiveBeanId(beanId);
    const selected = beans.find((b) => b.id === beanId);
    if (selected) {
      setCoffeeBeanName(selected.name);
      setRoastDate(selected.roastDate);
      setRoastLevel(selected.roastLevel);
      setRatioStyle(selected.ratioStyle);
      setDoseGrams(selected.doseGrams);
      setTargetYieldGrams(selected.targetYieldGrams);
      setGrinderName(selected.grinderName);
      setGrindSetting(selected.grindSetting);
    }
  };

  const handleSelectDrink = (drink: DrinkRecipe) => {
    setActiveDrinkId(drink.id);
    setDoseGrams(drink.defaultDoseGrams);
    setTargetYieldGrams(drink.targetYieldGrams);
    setRatioStyle(drink.ratioStyle);

    // Sync active grind setting to this drink's saved calibration if present
    const drinkGrinds = loadDrinkGrindSettings();
    const key = `${activeBeanId}_${drink.id}`;
    if (drinkGrinds[key]) {
      setGrindSetting(drinkGrinds[key]);
    }
  };

  const handleLaunchScaleCam = (drink: DrinkRecipe) => {
    handleSelectDrink(drink);
    setActiveTab('monitor');
  };

  const handleOpenDialInWizard = (drink: DrinkRecipe) => {
    handleSelectDrink(drink);
    setIsDialInWizardOpen(true);
  };

  const handleSaveAndProceedFromWizard = (dialInData: {
    doseGrams: number;
    targetYieldGrams: number;
    grindSetting: string;
    grinderName?: string;
  }) => {
    // 1. Update active brewing state
    setDoseGrams(dialInData.doseGrams);
    setTargetYieldGrams(dialInData.targetYieldGrams);
    setGrindSetting(dialInData.grindSetting);
    if (dialInData.grinderName) {
      setGrinderName(dialInData.grinderName);
      // Ensure the chosen grinder is marked inSetup
      setGrinders((prev) => {
        const found = prev.find((g) => g.name === dialInData.grinderName);
        if (found && !found.inSetup) {
          const updated = prev.map((g) =>
            g.name === dialInData.grinderName ? { ...g, inSetup: true } : g
          );
          saveGrinders(updated);
          return updated;
        }
        return prev;
      });
    }

    // 2. Persist directly onto active bean in vault
    const updated = beans.map((b) =>
      b.id === activeBeanId
        ? {
            ...b,
            doseGrams: dialInData.doseGrams,
            targetYieldGrams: dialInData.targetYieldGrams,
            grindSetting: dialInData.grindSetting,
            ...(dialInData.grinderName ? { grinderName: dialInData.grinderName } : {}),
          }
        : b
    );
    setBeans(updated);
    saveBeans(updated);

    // 3. Save drink-specific grind setting mapping
    const calibrationKey = `${activeBeanId}_${activeDrinkId}`;
    saveDrinkGrindSetting(calibrationKey, dialInData.grindSetting);

    // 4. Close wizard and launch scale monitor
    setIsDialInWizardOpen(false);
    setActiveTab('monitor');
  };

  const handleOnboardingComplete = (result: OnboardingResult) => {
    // 1. Set grinder
    const chosenGrinder = grinders.find((g) => g.id === result.grinderId);
    if (chosenGrinder) {
      setGrinderName(chosenGrinder.name);
    }

    // 2. Set machine
    setMachineName(result.machineName);
    saveMachineName(result.machineName);

    // 3. Create first bean and set as active
    const newBeanId = `bean-${Date.now()}`;
    const newBean: CoffeeBeanProfile = {
      id: newBeanId,
      name: result.beanName,
      roaster: result.roaster || undefined,
      roastDate: result.roastDate,
      roastLevel: result.roastLevel,
      doseGrams: 18.0,
      ratioStyle: result.roastLevel === 'light' ? 'lungo' : result.roastLevel === 'dark' ? 'ristretto' : 'standard',
      targetYieldGrams: result.roastLevel === 'light' ? 45.0 : result.roastLevel === 'dark' ? 27.0 : 36.0,
      grindSetting: chosenGrinder?.defaultSetting || '15',
      grinderName: chosenGrinder?.name || 'Baratza Encore ESP Pro',
    };

    const updatedBeans = [newBean, ...beans];
    setBeans(updatedBeans);
    saveBeans(updatedBeans);
    setActiveBeanId(newBeanId);
    setCoffeeBeanName(newBean.name);
    setRoastDate(newBean.roastDate);
    setRoastLevel(newBean.roastLevel);
    setRatioStyle(newBean.ratioStyle);
    setDoseGrams(newBean.doseGrams);
    setTargetYieldGrams(newBean.targetYieldGrams);
    setGrindSetting(newBean.grindSetting);

    // 4. Mark onboarding done
    saveOnboardingComplete();
    setIsOnboardingDone(true);
  };

  const handleSkipOnboarding = () => {
    saveOnboardingComplete();
    setIsOnboardingDone(true);
  };

  const handleSetRoastLevel = (level: RoastLevel) => {
    setRoastLevel(level);
    const preset = ROAST_PRESETS[level];
    const newRatio = preset.defaultRatio;
    setRatioStyle(newRatio);
    const mult = RATIO_PRESETS[newRatio].multiplier;
    const newYield = Math.round(doseGrams * mult * 10) / 10;
    setTargetYieldGrams(newYield);

    const updated = beans.map((b) =>
      b.id === activeBeanId
        ? { ...b, roastLevel: level, ratioStyle: newRatio, targetYieldGrams: newYield }
        : b
    );
    setBeans(updated);
    saveBeans(updated);
  };

  const handleSetRatioStyle = (style: RatioStyle) => {
    setRatioStyle(style);
    if (style !== 'custom') {
      const mult = RATIO_PRESETS[style].multiplier;
      const newYield = Math.round(doseGrams * mult * 10) / 10;
      setTargetYieldGrams(newYield);

      const updated = beans.map((b) =>
        b.id === activeBeanId ? { ...b, ratioStyle: style, targetYieldGrams: newYield } : b
      );
      setBeans(updated);
      saveBeans(updated);
    }
  };

  const handleUpdateBeanField = (patch: Partial<CoffeeBeanProfile>) => {
    const updated = beans.map((b) => (b.id === activeBeanId ? { ...b, ...patch } : b));
    setBeans(updated);
    saveBeans(updated);
  };

  const handleCreateNewBean = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeanName.trim()) return;
    const defaultRatio = ROAST_PRESETS[newBeanRoastLevel].defaultRatio;
    const mult = RATIO_PRESETS[defaultRatio].multiplier;
    const chosenGrinder = grinders.find((g) => g.name === (newBeanGrinderName || grinderName)) || currentGrinder;
    const newBean: CoffeeBeanProfile = {
      id: `bean-${Date.now()}`,
      name: newBeanName.trim(),
      roaster: newBeanRoaster.trim() || undefined,
      roastDate: newBeanRoastDate,
      roastLevel: newBeanRoastLevel,
      doseGrams: 18.0,
      ratioStyle: defaultRatio,
      targetYieldGrams: Math.round(18.0 * mult * 10) / 10,
      grindSetting: chosenGrinder.defaultSetting || grindSetting,
      grinderName: chosenGrinder.name,
    };

    const updated = [newBean, ...beans];
    setBeans(updated);
    saveBeans(updated);
    setActiveBeanId(newBean.id);
    setCoffeeBeanName(newBean.name);
    setRoastDate(newBean.roastDate);
    setRoastLevel(newBean.roastLevel);
    setRatioStyle(newBean.ratioStyle);
    setDoseGrams(newBean.doseGrams);
    setTargetYieldGrams(newBean.targetYieldGrams);
    setGrinderName(chosenGrinder.name);
    setGrindSetting(newBean.grindSetting);
    setIsAddingBean(false);
    setNewBeanName('');
    setNewBeanRoaster('');
    setNewBeanGrinderName('');
    setScanMessage(null);
  };

  const handleScanBagFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningBag(true);
    setScanMessage(null);
    try {
      const scanned = await parseCoffeeBagPhoto(file);
      setNewBeanName(scanned.name);
      setNewBeanRoaster(scanned.roaster || '');
      setNewBeanRoastDate(scanned.roastDate);
      setNewBeanRoastLevel(scanned.roastLevel);
      setIsAddingBean(true);
      setScanMessage(`Scanned label: "${scanned.name}" (${scanned.roastLevel} roast)`);
    } catch (err) {
      console.error('Failed to scan coffee bag photo', err);
    } finally {
      setIsScanningBag(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveBeanFromScanner = (scannedBean: CoffeeBeanProfile, makeActive?: boolean) => {
    const updated = [scannedBean, ...beans];
    setBeans(updated);
    saveBeans(updated);
    if (makeActive) {
      handleSelectBean(scannedBean.id);
    }
    setScanMessage(`Scanned & added "${scannedBean.name}" to Vault!`);
  };

  const handleDeleteBean = (beanId: string) => {
    if (beans.length <= 1) return;
    const updated = beans.filter((b) => b.id !== beanId);
    setBeans(updated);
    saveBeans(updated);
    if (activeBeanId === beanId && updated[0]) {
      handleSelectBean(updated[0].id);
    }
  };

  const handleBrewStart = () => {
    setIsBrewing(true);
    setCurrentPoints([]);
    setLastFinishedShot(null);
  };

  const handleBrewCancel = () => {
    setIsBrewing(false);
    setCurrentPoints([]);
    setLastFinishedShot(null);
  };

  const handleBrewFinish = (
    finalWeight: number,
    timeSeconds: number,
    preInfusionSeconds: number,
    flowTimeSeconds: number,
    points: ShotDataPoint[]
  ) => {
    setIsBrewing(false);
    setCurrentPoints(points);

    const channelingEvent = analyzeChanneling(points);
    const avgFlow = timeSeconds > 0 ? Math.round((finalWeight / timeSeconds) * 100) / 100 : 0;
    const peakFlow = points.reduce((max, p) => Math.max(max, p.flowRateGps), 0);

    const activeDrink = DRINK_RECIPES.find((d) => d.id === activeDrinkId);

    const newShot: ShotRecord = {
      id: `shot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      coffeeName: coffeeBeanName,
      roastDate: roastDate,
      roastLevel: roastLevel,
      ratioStyle: ratioStyle,
      drinkId: activeDrinkId,
      drinkName: activeDrink?.name || 'Double Espresso',
      doseGrams: doseGrams,
      targetYieldGrams: targetYieldGrams,
      actualYieldGrams: finalWeight,
      totalTimeSeconds: timeSeconds,
      preInfusionSeconds: preInfusionSeconds,
      flowTimeSeconds: flowTimeSeconds,
      averageFlowGps: avgFlow,
      peakFlowGps: peakFlow,
      channeling: channelingEvent,
      channelingDetected: channelingEvent.detected,
      grinderName: grinderName,
      grindSetting: grindSetting,
      machineName: machineName,
      dataPoints: points,
    };

    setLastFinishedShot(newShot);
  };

  const handleDeleteShot = (shotId: string) => {
    const updated = deleteShot(shotId);
    setShots(updated);
  };

  const handleSaveFeedback = (taste: TasteRating, notes: string) => {
    if (!lastFinishedShot) return;
    const updatedShot: ShotRecord = {
      ...lastFinishedShot,
      tasteRating: taste,
      notes: notes || undefined,
    };

    saveShot(updatedShot);
    setShots([updatedShot, ...shots]);
  };

  const handleUnlockPro = () => {
    saveProStatus(true);
    setAccessState((prev) => ({
      ...prev,
      isProLifetime: true,
      isWithinTrial: false,
    }));
    setIsPaywallOpen(false);
  };

  // Auto-prompt unlock modal if the 7-day trial has expired and app is not unlocked
  useEffect(() => {
    if (!accessState.isProLifetime && !accessState.isWithinTrial) {
      setIsPaywallOpen(true);
    }
  }, [accessState.isProLifetime, accessState.isWithinTrial]);

  // Calculate days off roast
  const roastDateObj = new Date(roastDate);
  const daysOffRoast = Math.max(0, Math.floor((Date.now() - roastDateObj.getTime()) / (1000 * 60 * 60 * 24)));
  const isTooFresh = daysOffRoast < 4;

  // Render Admin Portal if navigating to /admin, /admin/ or #admin
  if (isAdminRoute) {
    return (
      <AdminPortal
        onBack={() => {
          window.history.pushState(null, '', '/');
          setIsAdminRoute(false);
        }}
        beans={beans}
        accessState={accessState}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2018] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-[#E8DFD5] bg-[#FAF7F2] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#2C2018] flex items-center justify-center text-[#C26D52] shadow-xs shrink-0">
              <Coffee className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-xs sm:text-sm tracking-wider text-[#2C2018] font-mono whitespace-nowrap truncate">
                ESPRESSO FLOW
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono hidden sm:block truncate">
                {t('app.subtitle')}
              </p>
            </div>
          </div>

          {/* Right Action Chips: Language & Access Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switcher (Only active when multi-language feature is enabled) */}
            {isMultiLanguageEnabled && (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="text-[11px] font-mono px-2 py-1 rounded-xl border border-[#E8DFD5] bg-[#FFFDF9] text-[#2C2018] font-bold cursor-pointer hover:border-[#C26D52] transition shadow-2xs focus:outline-none"
                title="Select App Language"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.code.toUpperCase()}
                  </option>
                ))}
              </select>
            )}

            {/* Trial Access Chip - Only visible during 7-day trial; completely hidden once unlocked! */}
            {!accessState.isProLifetime && (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="text-[11px] sm:text-xs font-mono px-2 sm:px-2.5 py-1 rounded-xl border border-[#C26D52]/40 bg-[#C26D52]/10 text-[#C26D52] font-semibold hover:bg-[#C26D52]/20 transition flex items-center gap-1 sm:gap-1.5 shrink-0"
                title="7-Day Free Trial - Tap to unlock lifetime access"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden font-bold">
                  {accessState.daysRemainingInTrial}d
                </span>
                <span className="hidden sm:inline">
                  {t('app.trial_days', { days: accessState.daysRemainingInTrial })}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation (Segmented Tactile Bar - 100% Mobile Clean & Never Overflows) */}
        <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-2 pt-0.5">
          <nav className="grid grid-cols-4 w-full gap-1 p-1 bg-[#F0E8DC]/80 rounded-xl sm:rounded-2xl border border-[#E8DFD5] text-[11px] sm:text-xs font-mono shadow-inner">
            <button
              onClick={() => setActiveTab('drinks')}
              className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'drinks'
                  ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                  : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
              }`}
            >
              <Coffee className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'drinks' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
              <span className="truncate">
                {t('nav.coffee_bar')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('monitor')}
              className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'monitor'
                  ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                  : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
              }`}
            >
              <Camera className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'monitor' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
              <span className="truncate">
                <span className="sm:hidden">{t('nav.scale')}</span>
                <span className="hidden sm:inline">{t('nav.scale_cam')}</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('logbook')}
              className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'logbook'
                  ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                  : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'logbook' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
              <span className="truncate">
                <span className="sm:hidden">{t('nav.logs')}</span>
                <span className="hidden sm:inline">{t('nav.logbook')}</span>
              </span>
              {shots.length > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                    activeTab === 'logbook'
                      ? 'bg-[#C26D52] text-white'
                      : 'bg-[#E8DFD5] text-[#7A6E65]'
                  }`}
                >
                  {shots.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('equipment')}
              className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'equipment'
                  ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                  : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
              }`}
            >
              <Sliders className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'equipment' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
              <span className="truncate">
                <span className="sm:hidden">{t('nav.gear')}</span>
                <span className="hidden sm:inline">{t('nav.beans_and_gear')}</span>
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Tab 0: Digital Barista Deck & Drink Selector */}
        {activeTab === 'drinks' && (
          <DrinkSelector
            currentBean={currentBean}
            currentGrinder={currentGrinder}
            activeDrinkId={activeDrinkId}
            shots={shots}
            allBeans={beans}
            onSelectDrink={handleSelectDrink}
            onLaunchScaleCam={handleLaunchScaleCam}
            onOpenDialInWizard={handleOpenDialInWizard}
            onOpenBeanVault={() => setActiveTab('equipment')}
            onGrindSettingChange={setGrindSetting}
            onSwitchBean={handleSelectBean}
            onScanBean={() => setIsBeanScannerOpen(true)}
            onUpdateBeanDialIn={handleUpdateBeanField}
          />
        )}

        {/* Quick Context Bar (Shown for Monitor, Logbook, and Equipment) */}
        {activeTab !== 'drinks' && (
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-2.5 sm:p-3 text-xs font-mono shadow-xs space-y-2">
            {/* Top row: Bean Selector + Days off roast */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <select
                  value={activeBeanId}
                  onChange={(e) => handleSelectBean(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg px-2 py-1 font-bold text-[#2C2018] text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52] truncate max-w-[170px] sm:max-w-xs"
                >
                  {beans.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <span
                  className={`text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-md border shrink-0 ${
                    roastLevel === 'light'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : roastLevel === 'medium'
                      ? 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                      : roastLevel === 'medium-dark'
                      ? 'bg-[#8C6046]/10 text-[#8C6046] border-[#8C6046]/30'
                      : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                  }`}
                >
                  {roastLevel}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-[11px] ml-auto">
                <span className="text-[#7A6E65]">
                  {t('active_bean.days_off_roast', { days: daysOffRoast })}
                </span>
                {isTooFresh && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                    <Flame className="w-3 h-3" /> CO₂
                  </span>
                )}
              </div>
            </div>

            {/* Bottom row: Clean 4-segment telemetry grid with hairline dividers */}
            <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-[#E8DFD5]/60 text-[10px] sm:text-[11px] text-center">
              <div className="px-1 py-0.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD5]/40">
                <span className="text-[#7A6E65] text-[9px] block uppercase">{t('active_bean.ratio')}</span>
                <span className="font-bold text-[#C26D52]">
                  1:{(doseGrams > 0 ? (targetYieldGrams / doseGrams).toFixed(1) : '2.0')}
                </span>
              </div>
              <div className="px-1 py-0.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD5]/40">
                <span className="text-[#7A6E65] text-[9px] block uppercase">{t('active_bean.dose')}</span>
                <span className="font-bold text-[#2C2018]">{doseGrams}g</span>
              </div>
              <div className="px-1 py-0.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD5]/40">
                <span className="text-[#7A6E65] text-[9px] block uppercase">{t('active_bean.yield')}</span>
                <span className="font-bold text-[#72806B]">{targetYieldGrams}g</span>
              </div>
              <div className="px-1 py-0.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD5]/40 truncate">
                <span className="text-[#7A6E65] text-[9px] block uppercase">{t('active_bean.grind')}</span>
                <span className="font-bold text-[#2C2018] truncate">
                  {grindSetting}
                  <span className="text-[9px] text-[#7A6E65] font-normal hidden sm:inline"> ({currentGrinder.name.split(' ')[0]})</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Live Monitor & Flow Dynamics */}
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            <ScaleMonitor
              isBrewing={isBrewing}
              onBrewStart={handleBrewStart}
              onBrewFinish={handleBrewFinish}
              onBrewCancel={handleBrewCancel}
              targetDose={doseGrams}
              targetYield={targetYieldGrams}
              machinePreInfusionSetting={machinePreInfusion}
            />

            <FlowChart
              points={currentPoints}
              targetYield={targetYieldGrams}
              doseGrams={doseGrams}
              channelingEvent={analyzeChanneling(currentPoints)}
              preInfusionSeconds={lastFinishedShot?.preInfusionSeconds}
            />

            {lastFinishedShot && (
              <TasteFeedback
                lastShot={lastFinishedShot}
                onSaveWithFeedback={handleSaveFeedback}
              />
            )}
          </div>
        )}

        {/* Tab 2: Analog Logbook */}
        {activeTab === 'logbook' && (
          <Logbook shots={shots} onDeleteShot={handleDeleteShot} />
        )}

        {/* Tab 3: Beans & Gear */}
        {activeTab === 'equipment' && (
          <div className="space-y-6 font-mono text-xs">
            {/* Bean Vault (Active Bags & Roasts) */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-[#C26D52]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                      Coffee Bean Vault ({beans.length} Bags In Stock)
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#7A6E65] mt-0.5">
                    Switch between active beans with 1 tap. Grind settings & extraction ratios are remembered per bag.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleScanBagFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setIsBeanScannerOpen(true)}
                    disabled={isScanningBag}
                    className="px-3 py-1.5 rounded-lg border border-[#72806B] bg-[#72806B]/10 hover:bg-[#72806B]/20 text-[#72806B] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    title="Scan coffee bag barcodes, packaging labels, and roast date stamps"
                  >
                    <Barcode className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>{isScanningBag ? 'Scanning...' : 'Scan Bag / Barcode'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingBean(!isAddingBean);
                      setScanMessage(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#C26D52] bg-[#C26D52]/10 hover:bg-[#C26D52]/20 text-[#C26D52] text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingBean ? 'Close' : 'Add New Bag'}</span>
                  </button>
                </div>
              </div>

              {/* Inline Add New Bean Form */}
              {isAddingBean && (
                <form
                  onSubmit={handleCreateNewBean}
                  className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#2C2018] uppercase">Add Coffee Bean To Vault</div>
                    {scanMessage && (
                      <span className="text-[11px] text-[#72806B] font-mono font-semibold animate-pulse">
                        {scanMessage}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase block mb-1">Bean Origin / Name</label>
                      <input
                        type="text"
                        required
                        value={newBeanName}
                        onChange={(e) => setNewBeanName(e.target.value)}
                        placeholder="e.g. Kenya Nyeri AA (Washed)"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase block mb-1">Roaster (Optional)</label>
                      <input
                        type="text"
                        value={newBeanRoaster}
                        onChange={(e) => setNewBeanRoaster(e.target.value)}
                        placeholder="e.g. La Cabra, Tim Wendelboe, Nomad"
                        className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase block mb-1">Roast Level</label>
                      <select
                        value={newBeanRoastLevel}
                        onChange={(e) => setNewBeanRoastLevel(e.target.value as RoastLevel)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white text-xs"
                      >
                        <option value="light">Light Roast (Floral / Citric / High Acidity)</option>
                        <option value="medium">Medium Roast (Caramel / Chocolate / Sweet)</option>
                        <option value="medium-dark">Medium-Dark (Rich Body / Crema)</option>
                        <option value="dark">Dark Roast (Smoky / Dark Cacao / Low Acidity)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase block mb-1">Roast Date</label>
                      <input
                        type="date"
                        value={newBeanRoastDate}
                        onChange={(e) => setNewBeanRoastDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[#7A6E65] uppercase block mb-1">Assigned Grinder</label>
                      <select
                        value={newBeanGrinderName || grinderName}
                        onChange={(e) => setNewBeanGrinderName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white text-xs font-semibold text-[#2C2018]"
                      >
                        {grinders.map((g) => (
                          <option key={g.id} value={g.name}>
                            {g.name} ({g.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#2C2018] text-[#FAF7F2] font-semibold text-xs flex items-center gap-1.5 hover:bg-[#3D2D22] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save Bean to Vault
                  </button>
                </form>
              )}

              {/* Bean Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {beans.map((bean) => {
                  const isActive = bean.id === activeBeanId;
                  const beanRoastDate = new Date(bean.roastDate);
                  const daysOff = Math.max(0, Math.floor((Date.now() - beanRoastDate.getTime()) / (1000 * 60 * 60 * 24)));

                  return (
                    <div
                      key={bean.id}
                      onClick={() => handleSelectBean(bean.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'border-[#C26D52] bg-[#FAF7F2] ring-1 ring-[#C26D52] shadow-xs'
                          : 'border-[#E8DFD5] bg-white hover:border-[#C26D52]/40'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              bean.roastLevel === 'light'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : bean.roastLevel === 'medium'
                                ? 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                                : bean.roastLevel === 'medium-dark'
                                ? 'bg-[#8C6046]/10 text-[#8C6046] border-[#8C6046]/30'
                                : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                            }`}
                          >
                            {bean.roastLevel}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isActive && (
                              <span className="flex items-center gap-1 text-[10px] text-[#72806B] font-bold">
                                <Check className="w-3 h-3" /> ACTIVE
                              </span>
                            )}
                            {beans.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBean(bean.id);
                                }}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[#7A6E65]/50 hover:text-red-600 hover:bg-red-50 transition"
                                title="Remove bean from vault"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="font-bold text-[#2C2018] text-xs leading-snug">{bean.name}</div>
                        {bean.roaster && (
                          <div className="text-[10px] text-[#7A6E65]">{bean.roaster}</div>
                        )}
                        <div className="text-[10px] text-[#7A6E65] flex items-center justify-between gap-1 pt-0.5">
                          <span>{daysOff}d off roast</span>
                          <span className="font-mono bg-[#FAF7F2] border border-[#E8DFD5] px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                            <span className="text-[#7A6E65]">{bean.grinderName ? bean.grinderName.split(' ')[0] : 'Grind'}:</span>
                            <strong className="text-[#C26D52] font-bold">{bean.grindSetting}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#E8DFD5]/60 flex items-center justify-between text-[10px]">
                        <span className="text-[#7A6E65]">
                          Ratio: {bean.doseGrams}g → {bean.targetYieldGrams}g
                        </span>
                      </div>

                      {/* Inline Quick Dial-In Tuner (Expands directly on active card) */}
                      {isActive && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 pt-3 border-t border-[#E8DFD5] space-y-2.5 animate-fadeIn"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#C26D52] uppercase flex items-center gap-1 font-mono">
                              <Sliders className="w-3 h-3" />
                              <span>Quick Dial-In</span>
                            </span>
                            <span className="text-[9px] font-mono text-[#72806B] bg-[#72806B]/15 px-1.5 py-0.5 rounded font-semibold">
                              Live Sync
                            </span>
                          </div>

                          {/* 1. Quick Dial Setting with +/- buttons */}
                          <div className="bg-white p-2 rounded-lg border border-[#E8DFD5] space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-[#7A6E65]">
                              <span>Grind Dial ({bean.grinderName ? bean.grinderName.split(' ')[0] : 'Grind'}):</span>
                              <span className="font-mono text-[9px]">
                                {grinders.find((g) => g.name === bean.grinderName)?.stepUnit || 'steps'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const num = parseFloat(bean.grindSetting);
                                  if (!isNaN(num)) {
                                    const updated = (num - 0.5).toFixed(1);
                                    setGrindSetting(updated);
                                    handleUpdateBeanField({ grindSetting: updated });
                                  }
                                }}
                                className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] text-[#2C2018] font-bold text-sm hover:bg-[#E8DFD5] active:scale-95 transition"
                                title="Finer / lower setting"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                value={bean.grindSetting}
                                onChange={(e) => {
                                  setGrindSetting(e.target.value);
                                  handleUpdateBeanField({ grindSetting: e.target.value });
                                }}
                                className="flex-1 text-center font-mono font-bold text-sm text-[#C26D52] bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg py-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const num = parseFloat(bean.grindSetting);
                                  if (!isNaN(num)) {
                                    const updated = (num + 0.5).toFixed(1);
                                    setGrindSetting(updated);
                                    handleUpdateBeanField({ grindSetting: updated });
                                  }
                                }}
                                className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] text-[#2C2018] font-bold text-sm hover:bg-[#E8DFD5] active:scale-95 transition"
                                title="Coarser / higher setting"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* 2. Roast Level Quick Buttons */}
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#7A6E65] block font-mono">
                              Roast Profile
                            </span>
                            <div className="grid grid-cols-4 gap-1">
                              {(['light', 'medium', 'medium-dark', 'dark'] as RoastLevel[]).map((level) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => handleSetRoastLevel(level)}
                                  className={`py-1 text-[9px] rounded font-semibold capitalize transition ${
                                    bean.roastLevel === level
                                      ? 'bg-[#C26D52] text-white shadow-xs font-bold'
                                      : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
                                  }`}
                                >
                                  {level === 'medium-dark' ? 'Med-Dark' : level}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Dose & Yield Quick Ratio */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="p-1.5 rounded bg-white border border-[#E8DFD5]">
                              <span className="text-[9px] text-[#7A6E65] uppercase block font-sans">Dose (In)</span>
                              <div className="flex items-center justify-between mt-0.5">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={bean.doseGrams}
                                  onChange={(e) => {
                                    const d = parseFloat(e.target.value) || 18;
                                    setDoseGrams(d);
                                    const mult = RATIO_PRESETS[bean.ratioStyle]?.multiplier || 2.0;
                                    const newYield = Math.round(d * mult * 10) / 10;
                                    setTargetYieldGrams(newYield);
                                    handleUpdateBeanField({ doseGrams: d, targetYieldGrams: newYield });
                                  }}
                                  className="w-12 font-bold text-[#2C2018] bg-transparent text-xs"
                                />
                                <span className="text-[#A6998E]">g</span>
                              </div>
                            </div>
                            <div className="p-1.5 rounded bg-white border border-[#E8DFD5]">
                              <span className="text-[9px] text-[#7A6E65] uppercase block font-sans">Yield (Out)</span>
                              <div className="flex items-center justify-between mt-0.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={bean.targetYieldGrams}
                                  onChange={(e) => {
                                    const y = parseFloat(e.target.value) || 36;
                                    setTargetYieldGrams(y);
                                    handleUpdateBeanField({ targetYieldGrams: y });
                                  }}
                                  className="w-12 font-bold text-[#C26D52] bg-transparent text-xs"
                                />
                                <span className="text-[#A6998E]">g</span>
                              </div>
                            </div>
                          </div>

                          {/* 4. Assigned Grinder Selector */}
                          {grinders.length > 1 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#7A6E65] font-mono">
                                <span>Assigned Grinder</span>
                                {grinders.find((g) => g.name === bean.grinderName)?.inSetup && (
                                  <span className="text-[#72806B] font-semibold">In your setup</span>
                                )}
                              </div>
                              <select
                                value={bean.grinderName}
                                onChange={(e) => {
                                  const g = e.target.value;
                                  setGrinderName(g);
                                  handleUpdateBeanField({ grinderName: g });
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-[#E8DFD5] bg-white text-[11px] font-semibold text-[#2C2018]"
                              >
                                <optgroup label="Grinders in your setup">
                                  {grinders
                                    .filter((g) => g.inSetup)
                                    .map((g) => (
                                      <option key={g.id} value={g.name}>
                                        {g.name} ({g.type === 'stepless' ? 'Stepless' : 'Stepped'})
                                      </option>
                                    ))}
                                </optgroup>
                                {grinders.filter((g) => !g.inSetup).length > 0 && (
                                  <optgroup label="Other grinders in library">
                                    {grinders
                                      .filter((g) => !g.inSetup)
                                      .map((g) => (
                                        <option key={g.id} value={g.name}>
                                          {g.name} ({g.type === 'stepless' ? 'Stepless' : 'Stepped'})
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Compact Favorite Beans Kardotek / Rolodex */}
              <div className="mt-4 pt-4 border-t border-[#E8DFD5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C2018] uppercase tracking-wider font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Favorite Beans Rolodex ({beans.filter((b) => (b.rating || 0) > 0 || b.isFavorite).length || beans.length})</span>
                  </div>
                  <span className="text-[10px] text-[#7A6E65] font-mono">
                    Rate with stars to bookmark favorites
                  </span>
                </div>

                <div className="space-y-1.5">
                  {beans.map((bean) => {
                    const rating = bean.rating || 0;
                    const isActive = bean.id === activeBeanId;

                    return (
                      <div
                        key={`fav-${bean.id}`}
                        className={`px-3 py-2 rounded-xl border text-xs font-mono transition flex items-center justify-between gap-2.5 ${
                          isActive
                            ? 'bg-[#FAF7F2] border-[#C26D52]/40 ring-1 ring-[#C26D52]/20'
                            : 'bg-white border-[#E8DFD5] hover:border-[#C26D52]/30'
                        }`}
                      >
                        {/* Left: Interactive Star Rating (1-5 stars) */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newRating = rating === star ? 0 : star;
                                const updated = beans.map((b) =>
                                  b.id === bean.id
                                    ? { ...b, rating: newRating, isFavorite: newRating >= 4 }
                                    : b
                                );
                                setBeans(updated);
                                saveBeans(updated);
                              }}
                              className="p-0.5 hover:scale-125 transition"
                              title={`${star} stars`}
                            >
                              <Star
                                className={`w-3.5 h-3.5 transition ${
                                  star <= rating
                                    ? 'text-amber-500 fill-amber-500 drop-shadow-xs'
                                    : 'text-[#E8DFD5] hover:text-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Middle: Roast badge & Bean Name */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`text-[8px] uppercase font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                              bean.roastLevel === 'light'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : bean.roastLevel === 'medium'
                                ? 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                                : bean.roastLevel === 'medium-dark'
                                ? 'bg-[#8C6046]/10 text-[#8C6046] border-[#8C6046]/30'
                                : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                            }`}
                          >
                            {bean.roastLevel}
                          </span>
                          <span className="font-bold text-[#2C2018] truncate text-[11px]">
                            {bean.name}
                          </span>
                          {bean.roaster && (
                            <span className="text-[10px] text-[#7A6E65] truncate hidden sm:inline">
                              • {bean.roaster}
                            </span>
                          )}
                        </div>

                        {/* Right: Grind & Selection */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[#7A6E65] hidden sm:inline">
                            Grind: {bean.grindSetting}
                          </span>
                          {isActive ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30">
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectBean(bean.id)}
                              className="text-[9px] font-bold px-2 py-0.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] transition"
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Bean Dial-In & Chemistry Section */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C26D52]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                    Dial-In & Roast Profile: {coffeeBeanName}
                  </h3>
                </div>
                <span className="text-[11px] text-[#7A6E65]">Customized for Current Bag</span>
              </div>

              {/* 1. Roast Level Selection */}
              <div className="space-y-2">
                <label className="text-[10px] text-[#7A6E65] uppercase tracking-wider font-semibold block">
                  Select Bean Roast Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['light', 'medium', 'medium-dark', 'dark'] as RoastLevel[]).map((level) => {
                    const preset = ROAST_PRESETS[level];
                    const isSelected = roastLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleSetRoastLevel(level)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-[#C26D52] bg-[#FAF7F2] ring-1 ring-[#C26D52]'
                            : 'border-[#E8DFD5] bg-white hover:bg-[#FAF7F2]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold capitalize text-[#2C2018]">
                            {preset.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#C26D52]" />}
                        </div>
                        <div className="text-[10px] text-[#7A6E65] leading-tight">
                          Auto-suggests: {RATIO_PRESETS[preset.defaultRatio].label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Beverage Style & Target Ratio Presets */}
              <div className="space-y-2">
                <label className="text-[10px] text-[#7A6E65] uppercase tracking-wider font-semibold block">
                  Beverage Style & Extraction Ratio
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['ristretto', 'standard', 'lungo', 'allonge'] as RatioStyle[]).map((style) => {
                    const preset = RATIO_PRESETS[style];
                    const isSelected = ratioStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => handleSetRatioStyle(style)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-[#C26D52] bg-[#FAF7F2] ring-1 ring-[#C26D52]'
                            : 'border-[#E8DFD5] bg-white hover:bg-[#FAF7F2]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#2C2018]">{preset.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#C26D52]" />}
                        </div>
                        <div className="text-[10px] text-[#7A6E65] leading-tight">{preset.shortDesc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barista Chemistry Advice Banner */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] text-[#2C2018] leading-relaxed flex items-start gap-2">
                <FlaskConical className="w-4 h-4 text-[#C26D52] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#C26D52] uppercase text-[10px] tracking-wider block mb-0.5">
                    Extraction Physics for {ROAST_PRESETS[roastLevel].label}:
                  </strong>
                  <span>{ROAST_PRESETS[roastLevel].advice}</span>
                </div>
              </div>

              {/* Manual Tweaks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E8DFD5]/60">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7A6E65] uppercase">Target Dry Dose (Grams)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={doseGrams}
                    onChange={(e) => {
                      const newDose = parseFloat(e.target.value) || 0;
                      setDoseGrams(newDose);
                      const mult = ratioStyle !== 'custom' ? RATIO_PRESETS[ratioStyle].multiplier : 2.0;
                      const newYield = Math.round(newDose * mult * 10) / 10;
                      setTargetYieldGrams(newYield);
                      handleUpdateBeanField({ doseGrams: newDose, targetYieldGrams: newYield });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7A6E65] uppercase">Target Liquid Yield (Grams)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetYieldGrams}
                    onChange={(e) => {
                      const newYield = parseFloat(e.target.value) || 0;
                      setTargetYieldGrams(newYield);
                      setRatioStyle('custom');
                      handleUpdateBeanField({ targetYieldGrams: newYield, ratioStyle: 'custom' });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7A6E65] uppercase">Dialed Grinder for this Bean</label>
                  <select
                    value={grinderName}
                    onChange={(e) => {
                      const g = e.target.value;
                      if (g === '__ADD_NEW__') {
                        const custom = prompt('Enter custom grinder model:');
                        if (custom && custom.trim()) {
                          const newG: GrinderProfile = {
                            id: `grinder-${Date.now()}`,
                            name: custom.trim(),
                            type: 'stepless',
                            defaultSetting: '1.0',
                            stepUnit: 'steps',
                            inSetup: true,
                          };
                          const updated = [...grinders, newG];
                          setGrinders(updated);
                          saveGrinders(updated);
                          setGrinderName(newG.name);
                          handleUpdateBeanField({ grinderName: newG.name });
                        }
                        return;
                      }
                      setGrinderName(g);
                      handleUpdateBeanField({ grinderName: g });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                  >
                    <optgroup label="Grinders in your setup">
                      {grinders
                        .filter((g) => g.inSetup)
                        .map((g) => (
                          <option key={g.id} value={g.name}>
                            {g.name} ({g.type === 'stepless' ? 'Stepless' : 'Stepped'})
                          </option>
                        ))}
                    </optgroup>
                    {grinders.filter((g) => !g.inSetup).length > 0 && (
                      <optgroup label="Other grinders in library">
                        {grinders
                          .filter((g) => !g.inSetup)
                          .map((g) => (
                            <option key={g.id} value={g.name}>
                              {g.name} ({g.type === 'stepless' ? 'Stepless' : 'Stepped'})
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <option value="__ADD_NEW__">+ Add Custom Grinder...</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7A6E65] uppercase">Dial Setting for this Bean</label>
                  <input
                    type="text"
                    value={grindSetting}
                    onChange={(e) => {
                      const s = e.target.value;
                      setGrindSetting(s);
                      handleUpdateBeanField({ grindSetting: s });
                    }}
                    placeholder="e.g. 15 for Baratza ESP, 1.4 for Eureka"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                  />
                </div>
              </div>
            </div>

            {/* Equipment: Grinder Setup & Personal Fleet (Mine Kværne i Kaffehjørnet) */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C26D52]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                      Grinder Fleet & Bar Setup
                    </h3>
                    <p className="text-[10px] text-[#7A6E65] font-sans">
                      Manage your home bar grinders and select which grinder is active on your station.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#72806B] bg-[#72806B]/10 border border-[#72806B]/30 px-2 py-0.5 rounded-full shrink-0">
                  {grinders.filter((g) => g.inSetup).length} in your setup
                </span>
              </div>

              {/* Grinders currently in user's setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {grinders
                  .filter((g) => g.inSetup)
                  .map((g) => {
                    const isActive = g.name === grinderName;
                    return (
                      <div
                        key={g.id}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2.5 ${
                          isActive
                            ? 'bg-[#FAF7F2] border-[#72806B] ring-1 ring-[#72806B]/40 shadow-xs'
                            : 'bg-white border-[#E8DFD5] hover:border-[#C26D52]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#2C2018]">{g.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#FAF7F2] border border-[#E8DFD5] text-[#7A6E65] uppercase">
                                {g.type === 'stepless' ? 'Stepless' : 'Stepped'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#7A6E65] block mt-0.5">
                              Scale: {g.stepUnit || 'steps'}
                            </span>
                          </div>

                          {isActive ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30 flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3" /> Active on Bar
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setGrinderName(g.name);
                                handleUpdateBeanField({ grinderName: g.name });
                              }}
                              className="text-[10px] font-bold text-[#C26D52] hover:text-[#9B533E] hover:underline shrink-0"
                            >
                              Set Active
                            </button>
                          )}
                        </div>

                        {/* Card footer: info & remove button if more than 1 in setup */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#E8DFD5]/50 text-[10px]">
                          <span className="text-[#A6998E]">
                            Default: {g.defaultSetting || '15'}
                          </span>
                          {grinders.filter((gr) => gr.inSetup).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const remaining = grinders.map((gr) =>
                                  gr.id === g.id ? { ...gr, inSetup: false } : gr
                                );
                                setGrinders(remaining);
                                saveGrinders(remaining);
                                if (isActive) {
                                  const fallback = remaining.find((gr) => gr.inSetup) || remaining[0];
                                  setGrinderName(fallback.name);
                                  handleUpdateBeanField({ grinderName: fallback.name });
                                }
                              }}
                              className="text-[#A6998E] hover:text-red-600 transition flex items-center gap-1"
                              title="Remove this grinder from your active setup"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove from setup</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Add Grinder to Setup from Library or Custom */}
              <div className="pt-2 border-t border-[#E8DFD5]/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {grinders.filter((g) => !g.inSetup).length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const updated = grinders.map((g) =>
                        g.id === selectedId ? { ...g, inSetup: true } : g
                      );
                      setGrinders(updated);
                      saveGrinders(updated);
                      const added = updated.find((g) => g.id === selectedId);
                      if (added) {
                        setGrinderName(added.name);
                        handleUpdateBeanField({ grinderName: added.name });
                      }
                      e.target.value = '';
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono text-[#2C2018] focus:outline-hidden"
                  >
                    <option value="" disabled>+ Add grinder from library to your setup...</option>
                    {grinders
                      .filter((g) => !g.inSetup)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          + {g.name} ({g.type === 'stepless' ? 'Stepless' : 'Stepped'}, {g.stepUnit})
                        </option>
                      ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const customName = prompt('Enter grinder model name (e.g. Niche Duo, Lagom P64, Kinu M47):');
                    if (customName && customName.trim()) {
                      const newG: GrinderProfile = {
                        id: `grinder-${Date.now()}`,
                        name: customName.trim(),
                        type: 'stepless',
                        defaultSetting: '2.0',
                        stepUnit: 'steps / marks',
                        inSetup: true,
                      };
                      const updated = [...grinders, newG];
                      setGrinders(updated);
                      saveGrinders(updated);
                      setGrinderName(newG.name);
                      handleUpdateBeanField({ grinderName: newG.name });
                    }
                  }}
                  className="px-3 py-2 rounded-xl border border-[#C26D52] bg-[#C26D52]/10 hover:bg-[#C26D52]/20 text-[#C26D52] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Grinder</span>
                </button>
              </div>
            </div>

            {/* Equipment: Espresso Machine & Pre-infusion */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E8DFD5] pb-2">
                <Layers className="w-4 h-4 text-[#C26D52]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                  Espresso Machine & Pump Setup
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7A6E65] uppercase">Espresso Machine</label>
                  <select
                    value={machineName}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setMachineName(selected);
                      saveMachineName(selected);
                      if (selected.includes('Dedica')) setMachinePreInfusion(2.0);
                      else if (selected.includes('Dual Boiler')) setMachinePreInfusion(6.0);
                      else if (selected.includes('Barista')) setMachinePreInfusion(7.0);
                      else if (selected.includes('Bambino')) setMachinePreInfusion(5.0);
                      else if (selected.includes('Flow Control')) setMachinePreInfusion(8.0);
                      else if (selected.includes('Micra') || selected.includes('Mini')) setMachinePreInfusion(4.0);
                      else if (selected.includes('Straight 9-Bar') || selected.includes('Gaggia') || selected.includes('Silvia')) setMachinePreInfusion(0.0);
                      else if (selected.includes('Decent')) setMachinePreInfusion(6.0);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                  >
                    <option value="De'Longhi Dedica (EC680 / EC685 / EC885)">De'Longhi Dedica EC685 (15-Bar, 2s Pulse Pre-Infusion)</option>
                    <option value="De'Longhi La Specialista">De'Longhi La Specialista (15-Bar, Dual Heating)</option>
                    <option value="Sage / Breville Dual Boiler">Sage / Breville Dual Boiler (Default 6s)</option>
                    <option value="Sage / Breville Barista Touch/Express">Sage / Breville Barista Series (Default 7s)</option>
                    <option value="Sage Bambino / Bambino Plus">Sage Bambino / Bambino Plus (Default 5s)</option>
                    <option value="Gaggia Classic Pro / Evo">Gaggia Classic Pro (Straight 9-Bar / 0s)</option>
                    <option value="Rancilio Silvia / Silvia Pro X">Rancilio Silvia (Straight 9-Bar / 0s)</option>
                    <option value="E61 Manual Flow Control">E61 Manual Flow Control (Default 8s)</option>
                    <option value="La Marzocco Linea Micra / Mini">La Marzocco Linea Micra/Mini (Default 4s)</option>
                    <option value="Decent DE1 (Profiling)">Decent DE1 (Adaptive Profiling)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-[#7A6E65] uppercase">Pre-Infusion Target (Seconds)</label>
                    <span className="font-bold text-[#C26D52]">{machinePreInfusion.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={machinePreInfusion}
                    onChange={(e) => setMachinePreInfusion(parseFloat(e.target.value) || 0)}
                    className="w-full accent-[#C26D52] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7A6E65]">
                    <span>0s (Direct 9 bar)</span>
                    <span>5-8s (Standard specialty)</span>
                    <span>15s (Long soak)</span>
                  </div>
                </div>
              </div>

              {/* License & Full Access Card */}
              <div className="bg-[#FFFDF9] rounded-xl sm:rounded-2xl border border-[#E8DFD5] p-4 sm:p-5 space-y-3 shadow-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${accessState.isProLifetime ? 'text-[#72806B]' : 'text-[#C26D52]'}`} />
                    <h3 className="font-bold text-xs sm:text-sm text-[#2C2018] uppercase tracking-wide">
                      {accessState.isProLifetime ? 'Lifetime Access Active' : '7-Day Free Trial'}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    accessState.isProLifetime
                      ? 'bg-[#72806B]/15 text-[#72806B] border-[#72806B]/30'
                      : 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                  }`}>
                    {accessState.isProLifetime ? 'UNLOCKED' : `${accessState.daysRemainingInTrial} DAYS LEFT`}
                  </span>
                </div>

                <p className="text-[11px] text-[#7A6E65] font-sans leading-relaxed">
                  {accessState.isProLifetime
                    ? 'Your one-time purchase is active. Unlimited precision scale OCR, flow dynamics & logbook access forever.'
                    : 'You are currently enjoying your 7-day free trial. After the trial, a single one-time payment of $4.99 / 49,- DKK unlocks the app permanently.'}
                </p>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {!accessState.isProLifetime && (
                    <button
                      type="button"
                      onClick={() => setIsPaywallOpen(true)}
                      className="px-3 py-2 rounded-xl bg-[#C26D52] text-white text-xs font-semibold hover:bg-[#b05d43] transition shadow-xs flex items-center gap-1.5"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Unlock Lifetime Access ($4.99)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      alert(t('paywall.restore_success'));
                      handleUnlockPro();
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-[#7A6E65] hover:text-[#2C2018] text-xs font-semibold transition"
                  >
                    {t('paywall.restore_btn')}
                  </button>
                </div>
              </div>

              {/* Language Selection Card (Hidden until post-launch multi-language update) */}
              {isMultiLanguageEnabled && (
                <div className="bg-[#FFFDF9] rounded-xl sm:rounded-2xl border border-[#E8DFD5] p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#C26D52]" />
                    <h3 className="font-bold text-xs sm:text-sm text-[#2C2018] uppercase tracking-wide">
                      {t('settings.language')}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#7A6E65] leading-relaxed">
                    Select your preferred language. Barista specialty coffee terms remain international.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code)}
                        className={`p-2.5 rounded-xl border text-center transition flex items-center justify-center gap-2 font-mono text-xs ${
                          language === lang.code
                            ? 'border-[#C26D52] bg-[#FAF7F2] ring-1 ring-[#C26D52] font-bold text-[#2C2018]'
                            : 'border-[#E8DFD5] bg-white text-[#7A6E65] hover:bg-[#FAF7F2]/50'
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer & Store Compliance Links */}
      <footer className="border-t border-[#E8DFD5] bg-[#FAF7F2] py-4 text-center text-xs font-mono text-[#7A6E65]">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            {t('footer.rights', { year: new Date().getFullYear() })}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLegalModalTab('privacy')}
              className="hover:text-[#2C2018] underline transition"
            >
              {t('footer.privacy')}
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalTab('terms')}
              className="hover:text-[#2C2018] underline transition"
            >
              {t('footer.terms')}
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalTab('support')}
              className="hover:text-[#2C2018] underline transition"
            >
              {t('footer.support')}
            </button>
            <span>•</span>
            <button
              onClick={() => {
                window.history.pushState(null, '', '/admin');
                setIsAdminRoute(true);
              }}
              className="hover:text-[#2C2018] transition flex items-center gap-1 opacity-70 hover:opacity-100"
              title="Admin Portal (Passcode protected)"
            >
              <span>Admin 🔒</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        accessState={accessState}
        onUnlockPro={handleUnlockPro}
        onOpenLegal={(tab) => setLegalModalTab(tab)}
      />

      <LegalModal
        isOpen={legalModalTab !== null}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'privacy'}
      />

      {/* Dial-In Wizard Modal */}
      <DialInWizardModal
        isOpen={isDialInWizardOpen}
        onClose={() => setIsDialInWizardOpen(false)}
        drink={DRINK_RECIPES.find((d) => d.id === activeDrinkId) || DRINK_RECIPES[0]}
        currentBean={currentBean}
        currentGrinder={currentGrinder}
        availableGrinders={grinders.filter((g) => g.inSetup)}
        allGrinders={grinders}
        onProceedToScaleCam={() => {
          setIsDialInWizardOpen(false);
          setActiveTab('monitor');
        }}
        onSaveDialIn={handleSaveAndProceedFromWizard}
      />

      {/* First-Time Onboarding Wizard */}
      {!isOnboardingDone && (
        <OnboardingWizard
          grinders={grinders}
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      )}

      {/* Bean Bag & Barcode Vision Scanner Modal */}
      <BeanScannerModal
        isOpen={isBeanScannerOpen}
        onClose={() => setIsBeanScannerOpen(false)}
        onSaveBean={handleSaveBeanFromScanner}
        currentGrinderName={currentGrinder.name}
        grinders={grinders}
      />
    </div>
  );
}

export default App;
