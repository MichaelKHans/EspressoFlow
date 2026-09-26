import { useState, useEffect } from 'react';
import { Coffee, Sliders, BookOpen, Sparkles, Flame } from 'lucide-react';
import { ScaleMonitor } from './components/ScaleMonitor';
import { FlowChart } from './components/FlowChart';
import { TasteFeedback } from './components/TasteFeedback';
import { Logbook } from './components/Logbook';
import { PaywallModal } from './components/PaywallModal';
import { LegalModal } from './components/LegalModal';
import type { ShotDataPoint, ShotRecord, TasteRating, UserAccessState } from './types/espresso';
import { loadShots, saveShot, loadUserAccess, saveProStatus } from './lib/storage';
import { detectChanneling } from './lib/espressoMath';

export function App() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'logbook' | 'equipment'>('monitor');
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [accessState, setAccessState] = useState<UserAccessState>({
    isProLifetime: false,
    installTimestampMs: Date.now(),
    isWithinTrial: true,
    daysRemainingInTrial: 7,
  });

  // Brewing State
  const [isBrewing, setIsBrewing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<ShotDataPoint[]>([]);
  const [lastFinishedShot, setLastFinishedShot] = useState<ShotRecord | null>(null);

  // Equipment Settings
  const [doseGrams, setDoseGrams] = useState<number>(18.0);
  const [targetYieldGrams, setTargetYieldGrams] = useState<number>(36.0);
  const [grinderName, setGrinderName] = useState<string>('Eureka Mignon Specialita');
  const [grindSetting, setGrindSetting] = useState<string>('1.4');
  const [coffeeBeanName, setCoffeeBeanName] = useState<string>('Ethiopia Yirgacheffe');
  const [roastDate, setRoastDate] = useState<string>('2026-09-15');

  // Modals
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'support' | null>(null);

  // Load persistence and handle legal deep links on mount
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
  }, []);

  const handleBrewStart = () => {
    setIsBrewing(true);
    setCurrentPoints([]);
    setLastFinishedShot(null);
  };

  const handleBrewFinish = (finalWeight: number, timeSeconds: number, points: ShotDataPoint[]) => {
    setIsBrewing(false);
    setCurrentPoints(points);

    const isChanneling = detectChanneling(points);
    const avgFlow = timeSeconds > 0 ? Math.round((finalWeight / timeSeconds) * 100) / 100 : 0;
    const peakFlow = points.reduce((max, p) => Math.max(max, p.flowRateGps), 0);

    const newShot: ShotRecord = {
      id: `shot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      coffeeName: coffeeBeanName,
      roastDate: roastDate,
      doseGrams: doseGrams,
      targetYieldGrams: targetYieldGrams,
      actualYieldGrams: finalWeight,
      totalTimeSeconds: timeSeconds,
      averageFlowGps: avgFlow,
      peakFlowGps: peakFlow,
      channelingDetected: isChanneling,
      grinderName: grinderName,
      grindSetting: grindSetting,
      dataPoints: points,
    };

    setLastFinishedShot(newShot);
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

  // Calculate days off roast
  const roastDateObj = new Date(roastDate);
  const daysOffRoast = Math.max(0, Math.floor((Date.now() - roastDateObj.getTime()) / (1000 * 60 * 60 * 24)));
  const isTooFresh = daysOffRoast < 4;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2018] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-[#E8DFD5] bg-[#FAF7F2] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2C2018] flex items-center justify-center text-[#FAF7F2] shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm tracking-tight text-[#2C2018] font-mono">
                  ESPRESSO FLOW
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E8DFD5] text-[#7A6E65]">
                  v0.2.0
                </span>
              </div>
              <p className="text-[11px] text-[#7A6E65] font-mono">
                Precision Scale OCR & Flow Dynamics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Trial / Pro Badge */}
            <button
              onClick={() => setIsPaywallOpen(true)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 ${
                accessState.isProLifetime
                  ? 'border-[#72806B] bg-[#72806B]/10 text-[#72806B] font-bold'
                  : 'border-[#C26D52] bg-[#C26D52]/10 text-[#C26D52] font-semibold hover:bg-[#C26D52]/20'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {accessState.isProLifetime
                ? 'LIFETIME PRO'
                : `TRIAL: ${accessState.daysRemainingInTrial}D LEFT`}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto px-4 flex border-t border-[#E8DFD5]/60 text-xs font-mono">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'monitor'
                ? 'border-[#C26D52] text-[#2C2018] font-bold'
                : 'border-transparent text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            Live Scale Cam
          </button>
          <button
            onClick={() => setActiveTab('logbook')}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'logbook'
                ? 'border-[#C26D52] text-[#2C2018] font-bold'
                : 'border-transparent text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Logbook ({shots.length})
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'equipment'
                ? 'border-[#C26D52] text-[#2C2018] font-bold'
                : 'border-transparent text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Grinder & Beans
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quick Context Bar */}
        <div className="bg-[#FFFDF9] rounded-xl border border-[#E8DFD5] p-3 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#7A6E65]">BEAN:</span>
            <span className="font-semibold text-[#2C2018]">{coffeeBeanName}</span>
            <span className="text-[#7A6E65]">({daysOffRoast}d off roast)</span>
            {isTooFresh && (
              <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                <Flame className="w-3 h-3" /> CO2 Degassing
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[#7A6E65]">DOSE: </span>
              <span className="font-semibold">{doseGrams}g</span>
            </div>
            <div>
              <span className="text-[#7A6E65]">TARGET: </span>
              <span className="font-semibold">{targetYieldGrams}g</span>
            </div>
            <div>
              <span className="text-[#7A6E65]">GRIND: </span>
              <span className="font-semibold text-[#C26D52]">{grindSetting}</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Live Monitor & Flow Dynamics */}
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            <ScaleMonitor
              isBrewing={isBrewing}
              onBrewStart={handleBrewStart}
              onBrewFinish={handleBrewFinish}
              targetDose={doseGrams}
              targetYield={targetYieldGrams}
            />

            <FlowChart
              points={currentPoints}
              targetYield={targetYieldGrams}
              channelingDetected={detectChanneling(currentPoints)}
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
          <Logbook shots={shots} />
        )}

        {/* Tab 3: Grinder & Bean Calibration */}
        {activeTab === 'equipment' && (
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-6 shadow-xs space-y-6 font-mono text-xs">
            <div>
              <h3 className="text-sm font-bold text-[#2C2018] uppercase tracking-wider mb-1">
                Equipment Dial-In & Grinder Calibration
              </h3>
              <p className="text-[#7A6E65]">
                Configure your grinder steps and coffee bean profile for precise micro-adjustments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7A6E65] uppercase">Coffee Bean Origin / Name</label>
                <input
                  type="text"
                  value={coffeeBeanName}
                  onChange={(e) => setCoffeeBeanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7A6E65] uppercase">Roast Date</label>
                <input
                  type="date"
                  value={roastDate}
                  onChange={(e) => setRoastDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7A6E65] uppercase">Grinder Model</label>
                <select
                  value={grinderName}
                  onChange={(e) => setGrinderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                >
                  <option value="Eureka Mignon Specialita">Eureka Mignon Specialita</option>
                  <option value="DF64 Gen 2">DF64 Gen 2 (Single Dose)</option>
                  <option value="Fellow Opus">Fellow Opus Conical</option>
                  <option value="Niche Zero">Niche Zero</option>
                  <option value="Sage / Breville Smart Grinder">Sage / Breville Smart Grinder Pro</option>
                  <option value="Comandante C40">Comandante C40 (Hand Grinder)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7A6E65] uppercase">Current Dial Setting</label>
                <input
                  type="text"
                  value={grindSetting}
                  onChange={(e) => setGrindSetting(e.target.value)}
                  placeholder="e.g. 1.4 or 14 clicks"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7A6E65] uppercase">Target Dry Dose (Grams)</label>
                <input
                  type="number"
                  step="0.1"
                  value={doseGrams}
                  onChange={(e) => setDoseGrams(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7A6E65] uppercase">Target Liquid Yield (Grams)</label>
                <input
                  type="number"
                  step="0.5"
                  value={targetYieldGrams}
                  onChange={(e) => setTargetYieldGrams(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] text-[#7A6E65] leading-relaxed">
              ☕ <strong className="text-[#2C2018]">Standard 1:2 Dial-In Target:</strong> With {doseGrams}g dose, aim for {targetYieldGrams}g yield in 26-30 seconds. Flow rate should remain steady around 1.2–1.5 g/s without premature flow spikes.
            </div>
          </div>
        )}
      </main>

      {/* Footer & Store Compliance Links */}
      <footer className="border-t border-[#E8DFD5] bg-[#FAF7F2] py-4 text-center text-xs font-mono text-[#7A6E65]">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            Espresso Flow © {new Date().getFullYear()} • Global Specialty Coffee
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLegalModalTab('privacy')}
              className="hover:text-[#2C2018] underline transition"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalTab('terms')}
              className="hover:text-[#2C2018] underline transition"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalTab('support')}
              className="hover:text-[#2C2018] underline transition"
            >
              Support
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
    </div>
  );
}

export default App;
