import { useState, useEffect, useCallback } from 'react';
import { Coffee, Sliders, BookOpen, ShieldCheck, Plus, Check, Trash2, Layers, Camera, Globe, Settings, Thermometer } from 'lucide-react';
import { useTranslation, type SupportedLanguage } from './i18n';
import { ScaleMonitor } from './components/ScaleMonitor';
import { FlowChart } from './components/FlowChart';
import { Logbook } from './components/Logbook';
import { PaywallModal } from './components/PaywallModal';
import { LegalModal } from './components/LegalModal';
import { DrinkSelector } from './components/DrinkSelector';
import { DialInWizardModal } from './components/DialInWizardModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { BeanScannerModal } from './components/BeanScannerModal';
import { AdminPortal } from './components/AdminPortal';
import { TrialCountdownBanner } from './components/TrialCountdownBanner';
import { CentralBeanVaultModal } from './components/CentralBeanVaultModal';
import { BeandexView } from './components/BeandexView';
import { ShotSummaryModal } from './components/ShotSummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { CoffeeBeanIcon } from './components/CustomCoffeeIcons';
import { useMobileBackHandler } from './lib/useMobileBackHandler';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import type { OnboardingResult } from './components/OnboardingWizard';
import { DRINK_RECIPES } from './data/drinkRecipes';
import type {
  ShotDataPoint,
  ShotRecord,
  UserAccessState,
  CoffeeBeanProfile,
  GrinderProfile,
  RoastLevel,
  RatioStyle,
  DrinkRecipe,
  TempUnit,
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
  resolveGrinder,
  loadTempUnit,
  saveTempUnit,
  getMachineTempProfile,
} from './lib/storage';
import { analyzeChanneling, RATIO_PRESETS, ROAST_PRESETS, formatTemperature, calculateBeanFreshness } from './lib/espressoMath';

export function App() {
  const { t, language, setLanguage, supportedLanguages, isMultiLanguageEnabled } = useTranslation();
  const [activeTab, setActiveTab] = useState<'drinks' | 'monitor' | 'logbook' | 'equipment'>('drinks');
  const [activeMode, setActiveMode] = useState<'flow' | 'beandex'>('flow');
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
  const [isBeanScannerOpen, setIsBeanScannerOpen] = useState<boolean>(false);

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
    grinderName: 'Eureka Mignon Specialita 16CR',
  };

  // Brewing & Equipment Parameters (Declared BEFORE currentGrinder to prevent TDZ crash)
  const [doseGrams, setDoseGrams] = useState<number>(currentBean.doseGrams);
  const [targetYieldGrams, setTargetYieldGrams] = useState<number>(currentBean.targetYieldGrams);
  const [grinderName, setGrinderName] = useState<string>(() => {
    const res = resolveGrinder(currentBean.grinderName, loadGrinders());
    return res?.name || currentBean.grinderName;
  });
  const [grindSetting, setGrindSetting] = useState<string>(currentBean.grindSetting);
  const [machineName, setMachineName] = useState<string>(() => loadMachineName());
  const [machinePreInfusion, setMachinePreInfusion] = useState<number>(6.0);
  const [coffeeBeanName, setCoffeeBeanName] = useState<string>(currentBean.name);
  const [roastDate, setRoastDate] = useState<string>(currentBean.roastDate);
  const [roastLevel, setRoastLevel] = useState<RoastLevel>(currentBean.roastLevel);
  const [ratioStyle, setRatioStyle] = useState<RatioStyle>(currentBean.ratioStyle);

  // Active Grinder derived safely after grinderName is declared
  const currentGrinder = resolveGrinder(grinderName, grinders) || grinders[0] || {
    id: 'default',
    name: 'Baratza Encore ESP Pro',
    type: 'stepped' as const,
    defaultSetting: '15',
    stepUnit: 'micro-steps',
  };

  // Active Drink derived
  const activeDrink = DRINK_RECIPES.find((d) => d.id === activeDrinkId) || DRINK_RECIPES[0];

  // Brewing State
  const [isBrewing, setIsBrewing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<ShotDataPoint[]>([]);
  const [lastFinishedShot, setLastFinishedShot] = useState<ShotRecord | null>(null);

  // Modals
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [isCentralVaultOpen, setIsCentralVaultOpen] = useState<boolean>(false);
  const [isShotSummaryOpen, setIsShotSummaryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => loadTempUnit());
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'support' | null>(null);
  const [isAllDrinksModalOpen, setIsAllDrinksModalOpen] = useState<boolean>(false);
  const [isFreshnessInfoOpen, setIsFreshnessInfoOpen] = useState<boolean>(false);
  const [freshnessInfoRoast, setFreshnessInfoRoast] = useState<RoastLevel>('medium');

  const closeAllActiveModals = useCallback(() => {
    setIsAllDrinksModalOpen(false);
    setIsFreshnessInfoOpen(false);
    setIsSettingsOpen(false);
    setIsDialInWizardOpen(false);
    setIsBeanScannerOpen(false);
    setIsCentralVaultOpen(false);
    setIsPaywallOpen(false);
    setLegalModalTab(null);
    setIsShotSummaryOpen(false);
  }, []);

  const handleTempUnitChange = (unit: TempUnit) => {
    setTempUnit(unit);
    saveTempUnit(unit);
  };

  // Admin Route state (e.g. espressoflow.vercel.app/admin or #admin)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return p.includes('admin') || h.includes('admin');
  });

  // Mobile hardware & gesture back button handling
  const { showExitToast, exitToastMessage } = useMobileBackHandler({
    activeTab,
    setActiveTab,
    activeMode,
    setActiveMode,
    modals: [
      { name: 'settings', isOpen: isSettingsOpen, close: () => setIsSettingsOpen(false) },
      { name: 'shotSummary', isOpen: isShotSummaryOpen, close: () => setIsShotSummaryOpen(false) },
      { name: 'dialin', isOpen: isDialInWizardOpen, close: () => setIsDialInWizardOpen(false) },
      { name: 'scanner', isOpen: isBeanScannerOpen, close: () => setIsBeanScannerOpen(false) },
      { name: 'vault', isOpen: isCentralVaultOpen, close: () => setIsCentralVaultOpen(false) },
      { name: 'paywall', isOpen: isPaywallOpen, close: () => setIsPaywallOpen(false) },
      { name: 'legal', isOpen: legalModalTab !== null, close: () => setLegalModalTab(null) },
      { name: 'allDrinks', isOpen: isAllDrinksModalOpen, close: () => setIsAllDrinksModalOpen(false) },
      { name: 'freshnessInfo', isOpen: isFreshnessInfoOpen, close: () => setIsFreshnessInfoOpen(false) },
    ],
    exitToastMessage: t('mobile.press_back_again') || 'Press back again to exit Flowbean',
  });

  // Dynamic Flowbean Top Header Height: ensures modals are strictly bounded below the header
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('app-header');
      if (header) {
        const height = header.getBoundingClientRect().height;
        if (height > 0) {
          document.documentElement.style.setProperty('--app-header-height', `${height}px`);
        }
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [activeMode]);

  // Scroll to top on navigation tab or mode switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeMode, activeTab]);

  // Configure Native Mobile Status Bar: ensure dark text/icons on parchment background
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#FAF7F2' }).catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    }
  }, []);

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
      const res = resolveGrinder(selected.grinderName, grinders);
      setGrinderName(res?.name || selected.grinderName);
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
    beanId?: string;
    doseGrams: number;
    targetYieldGrams: number;
    grindSetting: string;
    grinderName?: string;
    brewTempC?: number;
    launchScaleCam?: boolean;
  }) => {
    const targetBeanId = dialInData.beanId || activeBeanId;

    // 1. If user switched bean inside Dial-In Studio, update active bean state
    if (dialInData.beanId && dialInData.beanId !== activeBeanId) {
      handleSelectBean(dialInData.beanId);
    }

    // 2. Update active brewing state
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

    // 3. Persist directly onto target bean in vault
    const updated = beans.map((b) =>
      b.id === targetBeanId
        ? {
            ...b,
            doseGrams: dialInData.doseGrams,
            targetYieldGrams: dialInData.targetYieldGrams,
            grindSetting: dialInData.grindSetting,
            ...(dialInData.brewTempC ? { brewTempC: dialInData.brewTempC } : {}),
            ...(dialInData.grinderName ? { grinderName: dialInData.grinderName } : {}),
          }
        : b
    );
    setBeans(updated);
    saveBeans(updated);

    // 4. Save drink-specific grind setting mapping
    const calibrationKey = `${targetBeanId}_${activeDrinkId}`;
    saveDrinkGrindSetting(calibrationKey, dialInData.grindSetting);

    // 5. Close wizard and conditionally launch scale monitor
    setIsDialInWizardOpen(false);
    if (dialInData.launchScaleCam !== false) {
      setActiveTab('monitor');
    }
  };

  const handleOnboardingComplete = (result: OnboardingResult) => {
    // 1. Set grinder and activate ONLY the chosen grinder in setup
    const chosenGrinder = grinders.find((g) => g.id === result.grinderId);
    if (chosenGrinder) {
      setGrinderName(chosenGrinder.name);
    }
    const updatedGrinders = grinders.map((g) => ({
      ...g,
      inSetup: g.id === result.grinderId,
    }));
    setGrinders(updatedGrinders);
    saveGrinders(updatedGrinders);

    // 2. Set machine
    setMachineName(result.machineName);
    saveMachineName(result.machineName);

    // 3. Create first bean and set as active (Clean start with only user's bean)
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

    // Filter out any legacy sample beans (Ethiopia, Colombia, Napoli) for a clean start
    const cleanExisting = beans.filter(
      (b) => b.id !== 'bean-ethiopia' && b.id !== 'bean-colombia' && b.id !== 'bean-napoli'
    );
    const updatedBeans = [newBean, ...cleanExisting];
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

  const handleUpdateBeanField = (patch: Partial<CoffeeBeanProfile>) => {
    const updated = beans.map((b) => (b.id === activeBeanId ? { ...b, ...patch } : b));
    setBeans(updated);
    saveBeans(updated);
  };

  const handleSaveBeanFromScanner = (scannedBean: CoffeeBeanProfile, makeActive?: boolean) => {
    const updated = [scannedBean, ...beans];
    setBeans(updated);
    saveBeans(updated);
    if (makeActive) {
      handleSelectBean(scannedBean.id);
    }
  };

  const handleAddBeanFromCentralVault = (newBean: CoffeeBeanProfile) => {
    const updated = [newBean, ...beans];
    setBeans(updated);
    saveBeans(updated);
    handleSelectBean(newBean.id);
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

  const handleBrewStart = useCallback(() => {
    setIsBrewing(true);
    setCurrentPoints([]);
    setLastFinishedShot(null);
  }, []);

  const handleBrewCancel = useCallback(() => {
    setIsBrewing(false);
    setCurrentPoints([]);
    setLastFinishedShot(null);
  }, []);

  const handleLivePointsUpdate = useCallback((points: ShotDataPoint[]) => {
    setCurrentPoints(points);
  }, []);

  const handleBrewFinish = useCallback((
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
      brewTempC: currentBean.brewTempC || 93,
      dataPoints: points,
      tasteRating: undefined, // Blank sensory profile by default, barista picks explicitly
      method: activeDrink?.method || 'espresso',
      bloomSeconds: activeDrink?.pourOverGuide?.bloomSeconds,
    };

    saveShot(newShot);
    setShots((prev) => [newShot, ...prev]);
    setLastFinishedShot(newShot);
    setIsShotSummaryOpen(true);
  }, [
    activeDrinkId,
    coffeeBeanName,
    roastDate,
    roastLevel,
    ratioStyle,
    doseGrams,
    targetYieldGrams,
    grinderName,
    grindSetting,
    machineName,
    currentBean.brewTempC,
  ]);

  const handleUpdateShot = (updatedShot: ShotRecord) => {
    saveShot(updatedShot);
    setShots((prev) => prev.map((s) => (s.id === updatedShot.id ? updatedShot : s)));
    setLastFinishedShot(updatedShot);
  };

  const handleDeleteShot = (shotId: string) => {
    const updated = deleteShot(shotId);
    setShots(updated);
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

  // Render Admin Portal if navigating to /admin, /admin/ or #admin
  if (isAdminRoute) {
    return (
      <AdminPortal
        onBack={() => {
          if (window.location.hash) {
            window.location.hash = '';
          }
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
      {/* Top Header - Always Elevated at z-[70] so Flowbean Brand Banner Remains 100% Visible */}
      <header
        id="app-header"
        className="border-b-2 border-[#CBB8A3] bg-[#FAF7F2]/95 backdrop-blur-md sticky top-0 z-[70] pt-safe shadow-[0_4px_20px_rgba(44,32,24,0.06)]"
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2">
          {/* Brand Logo & Title - Tapping returns to home deck and closes any open modals */}
          <button
            type="button"
            onClick={() => {
              closeAllActiveModals();
              setActiveMode('flow');
              setActiveTab('drinks');
            }}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 text-left cursor-pointer active:opacity-85 transition"
            title="Flowbean Home"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#2C2018] flex items-center justify-center shadow-xs shrink-0 overflow-hidden border border-[#C26D52]/25">
              <img src="/flowbean-logo.png" alt="Flowbean Logo" className="w-full h-full object-cover scale-135" />
            </div>
            <div className="shrink-0">
              <h1 className="font-bold text-xs sm:text-sm tracking-wider text-[#2C2018] font-mono whitespace-nowrap">
                {activeMode === 'flow' ? 'FLOWBEAN' : 'BEANDEX'}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono hidden sm:block truncate">
                {activeMode === 'flow' ? t('app.subtitle') : t('beandex.subtitle')}
              </p>
            </div>
          </button>

          {/* Center: Dual-Mode Segmented Switcher (Visible on desktop/tablet, mobile uses bottom tab bar) */}
          <div className="hidden md:flex items-center p-0.5 sm:p-1 bg-[#EFE8DE] rounded-xl border border-[#DECFC0] text-xs font-mono shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => {
                closeAllActiveModals();
                setActiveMode('flow');
              }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-all ${
                activeMode === 'flow'
                  ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                  : 'text-[#7A6E65] hover:text-[#2C2018]'
              }`}
            >
              <Coffee className={`w-3.5 h-3.5 shrink-0 ${activeMode === 'flow' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
              <span className="font-semibold text-[10.5px] sm:text-xs">
                <span className="sm:hidden">{t('mode.flow_short')}</span>
                <span className="hidden sm:inline">{t('mode.flow')}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                closeAllActiveModals();
                setActiveMode('beandex');
              }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-all ${
                activeMode === 'beandex'
                  ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                  : 'text-[#7A6E65] hover:text-[#2C2018]'
              }`}
            >
              <CoffeeBeanIcon className={`w-3.5 h-3.5 shrink-0 ${activeMode === 'beandex' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
              <span className="font-semibold text-[10.5px] sm:text-xs">
                <span className="sm:hidden">{t('mode.beandex_short')}</span>
                <span className="hidden sm:inline">{t('mode.beandex')}</span>
              </span>
              <span className={`text-[8.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold ${
                activeMode === 'beandex' ? 'bg-[#C26D52] text-white' : 'bg-[#DECFC0] text-[#2C2018]'
              }`}>
                {beans.length}
              </span>
            </button>
          </div>

          {/* Right Action Chips: Language & Access Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switcher (Only active when multi-language feature is enabled) */}
            {isMultiLanguageEnabled && (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="hidden sm:block text-[11px] font-mono px-2 py-1 rounded-xl border border-[#DECFC0] bg-[#FFFDF9] text-[#2C2018] font-bold cursor-pointer hover:border-[#C26D52] transition shadow-2xs focus:outline-none"
                title="Select App Language"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.code.toUpperCase()}
                  </option>
                ))}
              </select>
            )}

            {/* Trial Access Chip - Hidden on mobile (<md) since TrialCountdownBanner handles it directly below; visible on desktop */}
            {!accessState.isProLifetime && (
              <button
                onClick={() => {
                  closeAllActiveModals();
                  setIsPaywallOpen(true);
                }}
                className="hidden md:flex text-[11px] sm:text-xs font-mono px-2 sm:px-2.5 py-1 rounded-xl border border-[#C26D52]/40 bg-[#C26D52]/10 text-[#C26D52] font-semibold hover:bg-[#C26D52]/20 transition items-center gap-1 sm:gap-1.5 shrink-0"
                title="7-Day Free Trial - Tap to unlock lifetime access"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold">
                  {t('app.trial_days', { days: accessState.daysRemainingInTrial })}
                </span>
              </button>
            )}

            {/* Settings Gear Button - Toggles settings or cleanly opens it */}
            <button
              type="button"
              onClick={() => {
                if (isSettingsOpen) {
                  setIsSettingsOpen(false);
                } else {
                  closeAllActiveModals();
                  setIsSettingsOpen(true);
                }
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-[#DECFC0] bg-[#FFFDF9] hover:bg-[#FAF7F2] text-[#7A6E65] hover:text-[#2C2018] flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
              title={t('settings.modal_title')}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7A6E65]" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Segmented Tactile Bar - visible on desktop/tablet in Espresso Flow mode) */}
        {activeMode === 'flow' && (
          <div className="hidden md:block max-w-4xl mx-auto px-2 sm:px-4 pb-2 pt-0.5">
            <nav className="grid grid-cols-4 w-full gap-1 p-1 bg-[#F0E8DC]/80 rounded-xl sm:rounded-2xl border border-[#DECFC0] text-[11px] sm:text-xs font-mono shadow-inner">
              <button
                onClick={() => setActiveTab('drinks')}
                className={`py-1.5 sm:py-2 px-0.5 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-0.5 sm:gap-1.5 transition-all ${
                  activeTab === 'drinks'
                    ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                    : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
                }`}
              >
                <Coffee className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'drinks' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
                <span className="whitespace-nowrap font-semibold text-[10.5px] sm:text-xs">
                  {t('nav.coffee_bar')}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('monitor')}
                className={`py-1.5 sm:py-2 px-0.5 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-0.5 sm:gap-1.5 transition-all ${
                  activeTab === 'monitor'
                    ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                    : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
                }`}
              >
                <Camera className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'monitor' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
                <span className="whitespace-nowrap text-[10.5px] sm:text-xs">
                  <span className="sm:hidden">{t('nav.scale')}</span>
                  <span className="hidden sm:inline">{t('nav.scale_cam')}</span>
                </span>
              </button>

              <button
                onClick={() => setActiveTab('logbook')}
                className={`py-1.5 sm:py-2 px-0.5 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-0.5 sm:gap-1.5 transition-all ${
                  activeTab === 'logbook'
                    ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                    : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'logbook' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
                <span className="whitespace-nowrap text-[10.5px] sm:text-xs">
                  <span className="sm:hidden">{t('nav.logs')}</span>
                  <span className="hidden sm:inline">{t('nav.logbook')}</span>
                </span>
              </button>

              <button
                onClick={() => setActiveTab('equipment')}
                className={`py-1.5 sm:py-2 px-0.5 sm:px-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-0.5 sm:gap-1.5 transition-all ${
                  activeTab === 'equipment'
                    ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                    : 'text-[#7A6E65] hover:text-[#2C2018] hover:bg-white/60'
                }`}
              >
                <Sliders className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'equipment' ? 'text-[#C26D52]' : 'text-[#7A6E65]'}`} />
                <span className="whitespace-nowrap text-[10.5px] sm:text-xs">
                  <span className="sm:hidden">{t('nav.gear')}</span>
                  <span className="hidden sm:inline">{t('gear.title') || 'Gear Setup'}</span>
                </span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* 7-Day Free Trial Countdown Progress Banner */}
      <TrialCountdownBanner
        accessState={accessState}
        onOpenPaywall={() => setIsPaywallOpen(true)}
      />

      {/* Main Container */}
      <main
        className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-32 sm:pb-24"
        style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 6.5rem))' }}
      >
        {/* BEANDEX MODE: Dedicated Coffee Bean Vault, Ratings & Global Index */}
        {activeMode === 'beandex' ? (
          <BeandexView
            beans={beans}
            activeBeanId={activeBeanId}
            onSelectBean={handleSelectBean}
            onUpdateBean={(id, patch) => {
              const updated = beans.map((b) => (b.id === id ? { ...b, ...patch } : b));
              setBeans(updated);
              saveBeans(updated);
            }}
            onDeleteBean={handleDeleteBean}
            onCreateBean={(newBeanData) => {
              const defaultRatio = ROAST_PRESETS[newBeanData.roastLevel].defaultRatio;
              const mult = RATIO_PRESETS[defaultRatio].multiplier;
              const newBean: CoffeeBeanProfile = {
                ...newBeanData,
                id: `bean-${Date.now()}`,
                doseGrams: newBeanData.doseGrams || 18,
                targetYieldGrams: newBeanData.targetYieldGrams || Math.round(18 * mult * 10) / 10,
                ratioStyle: newBeanData.ratioStyle || defaultRatio,
                grindSetting: newBeanData.grindSetting || '15',
                grinderName: newBeanData.grinderName || grinderName,
              };
              const updated = [newBean, ...beans];
              setBeans(updated);
              saveBeans(updated);
              setActiveBeanId(newBean.id);
              handleSelectBean(newBean.id);
            }}
            onOpenScanner={() => setIsBeanScannerOpen(true)}
            onOpenCentralVault={() => setIsCentralVaultOpen(true)}
            onOpenDialInForBean={(beanId) => {
              handleSelectBean(beanId);
              setIsDialInWizardOpen(true);
            }}
            onSwitchToFlow={() => setActiveMode('flow')}
            grinders={grinders}
            activeGrinderName={grinderName}
            isFreshnessInfoOpen={isFreshnessInfoOpen}
            selectedFreshnessRoast={freshnessInfoRoast}
            onOpenFreshnessInfo={(roast) => {
              setFreshnessInfoRoast(roast);
              setIsFreshnessInfoOpen(true);
            }}
            onCloseFreshnessInfo={() => setIsFreshnessInfoOpen(false)}
          />
        ) : (
          <>
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
                onOpenBeanVault={() => setActiveMode('beandex')}
                onGrindSettingChange={setGrindSetting}
                onSwitchBean={handleSelectBean}
                onScanBean={() => setIsBeanScannerOpen(true)}
                onUpdateBeanDialIn={handleUpdateBeanField}
                isAllDrinksModalOpen={isAllDrinksModalOpen}
                onOpenAllDrinksModal={() => setIsAllDrinksModalOpen(true)}
                onCloseAllDrinksModal={() => setIsAllDrinksModalOpen(false)}
              />
            )}

        {/* Tab 1: Live Monitor & Flow Dynamics */}
        {activeTab === 'monitor' && (
          <div className="space-y-4">
            {/* Active Brew Recipe Badge */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-3 text-xs font-mono shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C26D52] shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[#2C2018]">{activeDrink.name}</span>
                    <span className="text-[#7A6E65]">•</span>
                    <span className="text-[#2C2018] truncate font-medium">{currentBean.name}</span>
                    {activeDrink.method === 'pour_over' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C26D52]/15 text-[#C26D52] font-bold border border-[#C26D52]/30">
                        🫗 POUR OVER
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#7A6E65] flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span>
                      {activeDrink.method === 'pour_over' ? 'Coffee: ' : ''}{doseGrams}g →{' '}
                      <strong className="text-[#C26D52]">{targetYieldGrams}g{activeDrink.method === 'pour_over' ? ' water' : ''}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Grind: <strong className="text-[#2C2018]">{grindSetting}</strong>{' '}
                      ({currentGrinder.name.split(' ')[0]})
                    </span>
                    <span>•</span>
                    <span>
                      Temp: <strong className="text-[#C26D52]">{formatTemperature(currentBean.brewTempC || 93, tempUnit)}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDialInWizardOpen(true)}
                className="px-2.5 py-1.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] font-bold text-xs shrink-0 flex items-center gap-1.5 transition"
                title="Open Dial-In Studio to adjust recipe"
              >
                <Sliders className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>{t('scale.open_dialin')}</span>
              </button>
            </div>

            <ScaleMonitor
              isBrewing={isBrewing}
              onBrewStart={handleBrewStart}
              onBrewFinish={handleBrewFinish}
              onBrewCancel={handleBrewCancel}
              onLivePointsUpdate={handleLivePointsUpdate}
              targetDose={doseGrams}
              targetYield={targetYieldGrams}
              machinePreInfusionSetting={machinePreInfusion}
              method={activeDrink.method || 'espresso'}
              brewStyle={activeDrink.brewStyle || 'percolation'}
              steepSeconds={activeDrink.steepSeconds}
              plungeWarning={activeDrink.plungeWarning}
              bloomSeconds={activeDrink.pourOverGuide?.bloomSeconds || 45}
              bloomWaterGrams={activeDrink.pourOverGuide?.bloomWaterGrams || (doseGrams * 3)}
              targetFlowRateMin={activeDrink.pourOverGuide?.flowRateMinGps || 4.0}
              targetFlowRateMax={activeDrink.pourOverGuide?.flowRateMaxGps || 6.0}
            />

            <FlowChart
              points={currentPoints}
              targetYield={targetYieldGrams}
              doseGrams={doseGrams}
              channelingEvent={analyzeChanneling(currentPoints)}
              preInfusionSeconds={lastFinishedShot?.preInfusionSeconds}
              isLive={isBrewing}
              method={activeDrink.method || 'espresso'}
            />
          </div>
        )}

        {/* Tab 2: Analog Logbook */}
        {activeTab === 'logbook' && (
          <Logbook shots={shots} onDeleteShot={handleDeleteShot} initialExpandedShotId={lastFinishedShot?.id} />
        )}

        {/* Tab 3: Beans & Gear */}
        {activeTab === 'equipment' && (
          <div className="space-y-6 font-mono text-xs">
            {/* Station Overview: Active Bean & Grinder on Bar */}
            <div className="bg-linear-to-br from-[#FFFDF9] via-[#FAF7F2] to-[#F5EFEB] rounded-2xl border border-[#DECFC0] p-5 shadow-xs space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-[#DECFC0] pb-2.5">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#C26D52]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                      {t('gear.active_station')}
                    </h3>
                    <p className="text-[10px] text-[#7A6E65] font-sans">
                      {t('gear.active_bean_title')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('beandex')}
                  className="px-3 py-1.5 rounded-lg border border-[#C26D52] bg-[#C26D52]/10 hover:bg-[#C26D52]/20 text-[#C26D52] font-semibold text-xs flex items-center gap-1.5 transition shadow-2xs"
                  title="Open Beandex to manage your bean vault, ratings, and fresh bags"
                >
                  <span>{t('gear.manage_beans_beandex')}</span>
                </button>
              </div>

              {/* Active Bean & Grinder Details Card */}
              <div className="p-4 rounded-xl bg-white border border-[#E8DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        currentBean.roastLevel === 'light'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : currentBean.roastLevel === 'medium'
                          ? 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                          : currentBean.roastLevel === 'medium-dark'
                          ? 'bg-[#8C6046]/10 text-[#8C6046] border-[#8C6046]/30'
                          : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                      }`}
                    >
                      {currentBean.roastLevel}
                    </span>
                    {/* Freshness & Degas summary */}
                    {(() => {
                      const freshness = calculateBeanFreshness(
                        currentBean.roastDate,
                        currentBean.roastLevel,
                        currentBean.dateOpened
                      );
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-[#7A6E65]">
                            {freshness.daysOffRoast}d off roast
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${freshness.badgeClasses}`}>
                            {freshness.summary}
                          </span>
                          {currentBean.dateOpened && (
                            <span className="text-[9px] text-[#7A6E65] bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#E8DFD5]">
                              Opened {freshness.daysOpened}d ago
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <h4 className="font-bold text-xs text-[#2C2018] leading-tight">
                    {currentBean.name}
                  </h4>
                  {currentBean.roaster && (
                    <p className="text-[11px] text-[#7A6E65] font-sans">
                      {currentBean.roaster}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-[#7A6E65] pt-1 font-mono">
                    <span>
                      Grinder: <strong className="text-[#2C2018]">{grinderName}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Grind Setting: <strong className="text-[#C26D52]">{grindSetting}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const activeDrink = DRINK_RECIPES.find((d) => d.id === activeDrinkId) || DRINK_RECIPES[0];
                      handleOpenDialInWizard(activeDrink);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
                    title="Open Dial-In Studio to calibrate grind, dose & yield"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>{t('gear.open_dial_in_studio')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Equipment: Grinder Setup & Personal Fleet (Mine Kværne i Kaffehjørnet) */}
            <div className="bg-[#241A14] text-[#FAF7F2] rounded-2xl border border-[#3D2D22] p-5 shadow-md space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-[#3D2D22] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#D4A373]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2]">
                      Grinder Fleet & Bar Setup
                    </h3>
                    <p className="text-[10px] text-[#A6998E] font-sans">
                      Manage your home bar grinders and select which grinder is active on your station.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#A8BFA0] bg-[#72806B]/20 border border-[#72806B]/40 px-2.5 py-0.5 rounded-full shrink-0">
                  ● {grinders.filter((g) => g.inSetup).length} in your setup
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
                            ? 'bg-[#2F221B] border-[#72806B] ring-1 ring-[#72806B] shadow-inner text-[#FAF7F2]'
                            : 'bg-[#1C1410] border-[#3D2D22] text-[#D8CDC4] hover:border-[#D4A373]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-[#E8DFD5]'}`}>{g.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#241A14] border border-[#3D2D22] text-[#A6998E] uppercase">
                                {g.type === 'stepless' ? 'Stepless' : 'Stepped'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8C7E74] block mt-0.5">
                              Scale: {g.stepUnit || 'steps'}
                            </span>
                          </div>

                          {isActive ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#72806B]/25 text-[#A8BFA0] border border-[#72806B]/40 flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3" /> Active on Bar
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setGrinderName(g.name);
                                handleUpdateBeanField({ grinderName: g.name });
                              }}
                              className="text-[10px] font-bold text-[#D4A373] hover:text-[#E8C29D] hover:underline shrink-0"
                            >
                              Set Active
                            </button>
                          )}
                        </div>

                        {/* Card footer: info & remove button if more than 1 in setup */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#3D2D22]/60 text-[10px]">
                          <span className="text-[#8C7E74]">
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
                              className="text-[#8C7E74] hover:text-red-400 transition flex items-center gap-1"
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
              <div className="pt-2 border-t border-[#3D2D22]/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                    className="flex-1 px-3 py-2 rounded-xl border border-[#3D2D22] bg-[#1C1410] text-xs font-mono text-[#FAF7F2] focus:outline-hidden"
                  >
                    <option value="" disabled>+ Add grinder from library to your setup...</option>
                    {grinders
                      .filter((g) => !g.inSetup)
                      .map((g) => (
                        <option key={g.id} value={g.id} className="bg-[#1C1410] text-[#FAF7F2]">
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
                  className="px-3 py-2 rounded-xl border border-[#4D382B] bg-[#35251C] hover:bg-[#422F24] text-[#D4A373] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Grinder</span>
                </button>
              </div>
            </div>

            {/* Equipment: Espresso Machine & Pre-infusion */}
            <div className="bg-linear-to-b from-[#FFFDF9] to-[#FAF7F2] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C26D52]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                    Espresso Machine & Pump Setup
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#72806B] bg-[#72806B]/10 border border-[#72806B]/30 px-2 py-0.5 rounded-full shrink-0">
                  Pump Dynamics
                </span>
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

              {/* Machine Temperature & PID Capabilities */}
              {(() => {
                const profile = getMachineTempProfile(machineName);
                const minTemp = profile.minTempC ?? 88;
                const maxTemp = profile.maxTempC ?? 96;
                const defaultTemp = profile.defaultTempC ?? 93;
                return (
                  <div className="pt-3 border-t border-[#E8DFD5]/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#7A6E65] uppercase font-bold flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-[#C26D52]" /> {t('gear.machine_temp_section')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-[10px] text-[#C26D52] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Unit: °{tempUnit} (Settings ⚙️)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white border border-[#E8DFD5]">
                        <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">{t('gear.machine_temp_mode')}</span>
                        <span className="font-bold text-[#2C2018] text-[11px] mt-0.5 block truncate">
                          {profile.tempControl === 'pid'
                            ? t('gear.machine_temp_pid')
                            : profile.tempControl === 'stepped'
                            ? t('gear.machine_temp_stepped')
                            : t('gear.machine_temp_fixed')}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E8DFD5]">
                        <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                          {t('gear.machine_temp_range', {
                            min: formatTemperature(minTemp, tempUnit),
                            max: formatTemperature(maxTemp, tempUnit),
                          })}
                        </span>
                        <span className="font-bold text-[#2C2018] text-[11px] mt-0.5 block">
                          {profile.tempControl === 'fixed' ? 'Fixed Boiler' : `${formatTemperature(minTemp, tempUnit)} – ${formatTemperature(maxTemp, tempUnit)}`}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E8DFD5]">
                        <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                          {t('gear.machine_temp_baseline', {
                            temp: formatTemperature(defaultTemp, tempUnit),
                          })}
                        </span>
                        <span className="font-bold text-[#C26D52] text-[11px] mt-0.5 block">
                          {formatTemperature(defaultTemp, tempUnit)} (Specialty standard)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* App Membership & Lifetime License (Separate Dedicated Card for Apple App Store Review Compliance) */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 space-y-3.5 shadow-xs font-mono">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${accessState.isProLifetime ? 'text-[#72806B]' : 'text-[#C26D52]'}`} />
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wide text-[#2C2018]">
                      Membership & App License
                    </h3>
                    <p className="text-[10px] text-[#7A6E65] font-sans">
                      {accessState.isProLifetime ? 'Lifetime License (RevenueCat)' : '7-Day Free Trial Period'}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  accessState.isProLifetime
                    ? 'bg-[#72806B]/15 text-[#72806B] border-[#72806B]/30'
                    : 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                }`}>
                  {accessState.isProLifetime ? 'LIFETIME PRO' : `${accessState.daysRemainingInTrial} DAYS LEFT`}
                </span>
              </div>

              <p className="text-[11px] text-[#7A6E65] font-sans leading-relaxed">
                {accessState.isProLifetime
                  ? 'Your one-time purchase is active. Unlimited precision scale OCR, flow dynamics & logbook access forever.'
                  : 'You are currently enjoying your 7-day free trial. After the trial, a single one-time payment of $4.99 / 49,- DKK unlocks the app permanently.'}
              </p>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {!accessState.isProLifetime && (
                    <button
                      type="button"
                      onClick={() => setIsPaywallOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
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
                    title="Restore prior purchase on this Apple ID / Google Account"
                  >
                    {t('paywall.restore_btn')}
                  </button>
                </div>

                {/* Direct App Store Compliance links */}
                <div className="flex items-center gap-2 text-[10px] text-[#7A6E65]">
                  <button
                    type="button"
                    onClick={() => setLegalModalTab('terms')}
                    className="hover:underline hover:text-[#2C2018]"
                  >
                    Terms of Use
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setLegalModalTab('privacy')}
                    className="hover:underline hover:text-[#2C2018]"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
            </div>

            {/* Language Selection Card (Hidden until post-launch multi-language update) */}
            {isMultiLanguageEnabled && (
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 space-y-3 shadow-xs">
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
        )}
          </>
        )}
      </main>

      {/* Footer & Store Compliance Links */}
      <footer
        className="border-t border-[#E8DFD5] bg-[#FAF7F2] py-4 text-center text-xs font-mono text-[#7A6E65]"
        style={{ paddingBottom: 'max(3.5rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))' }}
      >
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

      {/* Immediate Post-Shot Summary Modal */}
      <ShotSummaryModal
        isOpen={isShotSummaryOpen}
        shot={lastFinishedShot}
        tempUnit={tempUnit}
        onClose={() => setIsShotSummaryOpen(false)}
        onViewInLogbook={() => {
          setIsShotSummaryOpen(false);
          setActiveTab('logbook');
        }}
        onUpdateShot={handleUpdateShot}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tempUnit={tempUnit}
        onTempUnitChange={handleTempUnitChange}
        accessState={accessState}
        onOpenPaywall={() => setIsPaywallOpen(true)}
        onOpenLegal={(tab) => setLegalModalTab(tab)}
        onRestorePro={() => {
          alert(t('paywall.restore_success'));
          handleUnlockPro();
        }}
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
        allBeans={beans}
        tempUnit={tempUnit}
        onSelectBean={handleSelectBean}
        onProceedToScaleCam={() => {
          setIsDialInWizardOpen(false);
          setActiveTab('monitor');
        }}
        onSaveDialIn={handleSaveAndProceedFromWizard}
        onOpenBeanVault={() => {
          setIsDialInWizardOpen(false);
          setActiveMode('beandex');
        }}
        onScanBean={() => setIsBeanScannerOpen(true)}
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
        onOpenCentralVault={() => setIsCentralVaultOpen(true)}
      />

      {/* Central Cloud Bean Vault Directory Modal */}
      <CentralBeanVaultModal
        isOpen={isCentralVaultOpen}
        onClose={() => setIsCentralVaultOpen(false)}
        onAddBeanToVault={handleAddBeanFromCentralVault}
        currentVaultBeans={beans}
        currentGrinderName={currentGrinder.name}
      />

      {/* Mobile Bottom Navigation Bar (Thumb-First 5-Tab Bar - Exclusively Professional Vector Icons, Zero Emojis) */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t-2 border-[#CBB8A3] shadow-[0_-4px_24px_rgba(44,32,24,0.08)] select-none"
        style={{ paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))' }}
      >
        <div className="grid grid-cols-5 w-full max-w-lg mx-auto px-1 pt-1.5 pb-1">
          {/* Tab 1: Bar */}
          <button
            type="button"
            onClick={() => {
              closeAllActiveModals();
              setActiveMode('flow');
              setActiveTab('drinks');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeMode === 'flow' && activeTab === 'drinks'
                ? 'text-[#C26D52] font-bold'
                : 'text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeMode === 'flow' && activeTab === 'drinks' ? 'bg-[#F3EAE0]' : ''
            }`}>
              <Coffee className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5 whitespace-nowrap">
              <span className="xs:hidden">{t('nav.bar') || 'Bar'}</span>
              <span className="hidden xs:inline">{t('nav.coffee_bar') || 'Coffee Bar'}</span>
            </span>
          </button>

          {/* Tab 2: Vægt / Scale Cam */}
          <button
            type="button"
            onClick={() => {
              closeAllActiveModals();
              setActiveMode('flow');
              setActiveTab('monitor');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeMode === 'flow' && activeTab === 'monitor'
                ? 'text-[#C26D52] font-bold'
                : 'text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeMode === 'flow' && activeTab === 'monitor' ? 'bg-[#F3EAE0]' : ''
            }`}>
              <Camera className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5 whitespace-nowrap">
              <span className="xs:hidden">{t('nav.scale') || 'Scale'}</span>
              <span className="hidden xs:inline">{t('nav.scale_cam') || 'Scale Cam'}</span>
            </span>
          </button>

          {/* Tab 3: Beandex */}
          <button
            type="button"
            onClick={() => {
              closeAllActiveModals();
              setActiveMode('beandex');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              activeMode === 'beandex'
                ? 'text-[#C26D52] font-bold'
                : 'text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all relative ${
              activeMode === 'beandex' ? 'bg-[#F3EAE0]' : ''
            }`}>
              <CoffeeBeanIcon className="w-5 h-5 stroke-[2]" />
              <span
                className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full font-bold font-mono text-[9.5px] flex items-center justify-center shadow-xs ring-2 ring-[#FFFDF9] ${
                  activeMode === 'beandex'
                    ? 'bg-[#C26D52] text-white'
                    : 'bg-[#2C2018] text-[#FAF7F2]'
                }`}
              >
                {beans.length}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5 whitespace-nowrap">
              {t('nav.beandex') || 'Beandex'}
            </span>
          </button>

          {/* Tab 4: Logbog */}
          <button
            type="button"
            onClick={() => {
              closeAllActiveModals();
              setActiveMode('flow');
              setActiveTab('logbook');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeMode === 'flow' && activeTab === 'logbook'
                ? 'text-[#C26D52] font-bold'
                : 'text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeMode === 'flow' && activeTab === 'logbook' ? 'bg-[#F3EAE0]' : ''
            }`}>
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5 whitespace-nowrap">
              <span className="xs:hidden">{t('nav.logs') || 'Logs'}</span>
              <span className="hidden xs:inline">{t('nav.logbook') || 'Logbook'}</span>
            </span>
          </button>

          {/* Tab 5: Udstyr */}
          <button
            type="button"
            onClick={() => {
              closeAllActiveModals();
              setActiveMode('flow');
              setActiveTab('equipment');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeMode === 'flow' && activeTab === 'equipment'
                ? 'text-[#C26D52] font-bold'
                : 'text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeMode === 'flow' && activeTab === 'equipment' ? 'bg-[#F3EAE0]' : ''
            }`}>
              <Sliders className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5 whitespace-nowrap">
              {t('nav.gear') || 'Gear'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Back Double-Press Exit Toast */}
      {showExitToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2C2018]/95 text-[#FAF7F2] border border-[#C26D52]/40 text-xs font-mono shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2 pointer-events-none"
          style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#C26D52] animate-ping" />
          <span>{exitToastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
