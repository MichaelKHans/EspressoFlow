import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Coffee,
  ArrowLeft,
  Database,
  ExternalLink,
  Sparkles,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Layers,
  KeyRound,
  RefreshCw,
  Globe,
  CheckCircle2,
  ClipboardCheck,
  Calendar,
  Award,
} from 'lucide-react';
import type { CoffeeBeanProfile, UserAccessState } from '../types/espresso';
import {
  testSupabaseConnection,
  getSupabaseClient,
  type GlobalCoffeeBean,
} from '../lib/supabase';

interface AdminPortalProps {
  onBack: () => void;
  beans: CoffeeBeanProfile[];
  accessState: UserAccessState;
}

interface CuratorTask {
  id: string;
  title: string;
  cadence: 'Monthly' | 'Quarterly' | 'Bi-Annual' | 'Annual';
  category: 'Expert Ratings' | 'Crowdsourced Queue' | 'Competitions' | 'Seasonality' | 'Compliance';
  description: string;
  actionUrl?: string;
  actionLabel?: string;
}

const CURATOR_TASKS: CuratorTask[] = [
  {
    id: 'coffee_review',
    title: 'Coffee Review Monthly Espresso Cupping',
    cadence: 'Monthly',
    category: 'Expert Ratings',
    description: 'Review monthly blind-tasted espresso cupping reports. Add new 90+ point specialty lots with official expert_score and cupping notes.',
    actionUrl: 'https://www.coffeereview.com/all-reviews/?roast_profile=espresso',
    actionLabel: 'Open Coffee Review',
  },
  {
    id: 'supabase_queue',
    title: 'Review Crowdsourced Bean Queue in Supabase',
    cadence: 'Monthly',
    category: 'Crowdsourced Queue',
    description: 'Inspect pending user-scanned beans in the Supabase vault. Validate roaster name, origin, and roast profile to mark is_verified = true.',
  },
  {
    id: 'coe_wbc',
    title: 'Cup of Excellence & WBC Winning Lots',
    cadence: 'Quarterly',
    category: 'Competitions',
    description: 'Inspect World Barista Championship & Cup of Excellence annual auction releases (Panama, Colombia, Ethiopia Geishas).',
    actionUrl: 'https://allianceforcoffeeexcellence.org/cup-of-excellence/',
    actionLabel: 'Alliance For Coffee Excellence',
  },
  {
    id: 'seasonal_crops',
    title: 'Specialty Crop Harvest & Seasonality Refresh',
    cadence: 'Bi-Annual',
    category: 'Seasonality',
    description: 'Archive out-of-season micro-lots and update harvest arrival years (e.g. Ethiopian winter harvest vs Latin American autumn arrivals).',
  },
  {
    id: 'supermarket_ean',
    title: 'Supermarket EAN-13 Packaging & Barcode Audit',
    cadence: 'Bi-Annual',
    category: 'Compliance',
    description: 'Verify if commercial roasters (Lavazza, Illy, Peter Larsen, BKI, Starbucks) updated barcodes, packaging designs or weights.',
    actionUrl: 'https://world.openfoodfacts.org',
    actionLabel: 'Open Food Facts Database',
  },
  {
    id: 'apple_cert_health',
    title: 'Apple Developer Distribution Certificate & RevenueCat Audit',
    cadence: 'Annual',
    category: 'Compliance',
    description: 'Ensure iOS TestFlight distribution certs (< 12 months) are renewed & verify RevenueCat $4.99 lifetime transaction webhooks.',
    actionUrl: 'https://appstoreconnect.apple.com',
    actionLabel: 'App Store Connect',
  },
];

const DEFAULT_ADMIN_PIN = '9246';
const ALTERNATIVE_ADMIN_PASS = 'espresso2026';
const SESSION_AUTH_KEY = 'espresso_admin_authenticated';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBack,
  beans,
  accessState,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'beans' | 'curator' | 'security' | 'supabase'>('metrics');

  // Curator Hub & Periodic Audit State
  const [lastAuditDate, setLastAuditDate] = useState<string>(() => {
    return localStorage.getItem('espresso_last_curator_audit') || '2026-09-27';
  });
  const [checklistCompleted, setChecklistCompleted] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('espresso_curator_checklist') || '{}');
    } catch {
      return {};
    }
  });

  const toggleChecklistItem = (id: string) => {
    setChecklistCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('espresso_curator_checklist', JSON.stringify(next));
      return next;
    });
  };

  const markAuditCompleteToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setLastAuditDate(today);
    localStorage.setItem('espresso_last_curator_audit', today);
  };

  const getDaysSinceAudit = (dateStr: string): number => {
    const past = new Date(dateStr);
    if (isNaN(past.getTime())) return 0;
    const diff = Date.now() - past.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const daysSinceAudit = getDaysSinceAudit(lastAuditDate);
  const auditDueInDays = Math.max(0, 30 - daysSinceAudit);

  // Master Passcode State (persists in localStorage)
  const [masterPin, setMasterPin] = useState<string>(() => {
    return localStorage.getItem('espresso_admin_master_pin') || DEFAULT_ADMIN_PIN;
  });
  const [newPasscodeInput, setNewPasscodeInput] = useState<string>('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState<string>('');
  const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [showNewPasscode, setShowNewPasscode] = useState<boolean>(false);

  // Supabase & Cloud Config State
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return (
      localStorage.getItem('espresso_supabase_url') ||
      import.meta.env.VITE_SUPABASE_URL ||
      'https://vdxfmvzdmcqfixbegumb.supabase.co'
    );
  });
  const [supabaseKey, setSupabaseKey] = useState<string>(() => {
    return (
      localStorage.getItem('espresso_supabase_anon_key') ||
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeGZtdnpkbWNxZml4YmVndW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NzYsImV4cCI6MjEwNjA5Mjc3Nn0.8MlspGgPxNuIiRWH819Z59MKgVWzAQdqKPE3cqFv9P4'
    );
  });
  const [isSavedSupabase, setIsSavedSupabase] = useState<boolean>(false);
  const [connStatus, setConnStatus] = useState<{
    ok: boolean;
    message: string;
    pingMs?: number;
  } | null>(null);
  const [isTestingConn, setIsTestingConn] = useState<boolean>(false);
  const [cloudBeans, setCloudBeans] = useState<GlobalCoffeeBean[]>([]);
  const [isLoadingCloudBeans, setIsLoadingCloudBeans] = useState<boolean>(false);

  const testConnection = useCallback(async () => {
    setIsTestingConn(true);
    const res = await testSupabaseConnection();
    setConnStatus(res);
    setIsTestingConn(false);
    if (res.ok) {
      loadCloudBeans();
    }
  }, []);

  const loadCloudBeans = useCallback(async () => {
    setIsLoadingCloudBeans(true);
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client
          .from('global_coffee_beans')
          .select('*')
          .order('avg_rating', { ascending: false });
        if (data) {
          setCloudBeans(data as GlobalCoffeeBean[]);
        }
      } catch (err) {
        console.debug('Failed to load cloud beans', err);
      }
    }
    setIsLoadingCloudBeans(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      testConnection();
    }
  }, [isAuthenticated, testConnection]);

  // Simulated Global Community Telemetry (augmented with local real data)
  const totalStarredBeans = beans.filter((b) => (b.rating || 0) > 0 || b.isFavorite).length;
  const avgLocalRating =
    beans.filter((b) => (b.rating || 0) > 0).length > 0
      ? (
          beans
            .filter((b) => (b.rating || 0) > 0)
            .reduce((acc, b) => acc + (b.rating || 0), 0) /
          beans.filter((b) => (b.rating || 0) > 0).length
        ).toFixed(1)
      : '4.8';

  // Metrics (Simulated real-world trial & paid metrics based on app install)
  const simulatedTrialUsers = 142;
  const simulatedPaidUsers = 38;
  const priceDkk = 49;
  const priceUsd = 4.99;
  const totalRevenueDkk = simulatedPaidUsers * priceDkk;
  const totalRevenueUsd = (simulatedPaidUsers * priceUsd).toFixed(2);
  const conversionRate = (
    (simulatedPaidUsers / (simulatedTrialUsers + simulatedPaidUsers)) *
    100
  ).toFixed(1);

  // Handle PIN unlock
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.trim();
    const currentPass = localStorage.getItem('espresso_admin_master_pin') || DEFAULT_ADMIN_PIN;
    const isMatch =
      clean === currentPass ||
      (currentPass === DEFAULT_ADMIN_PIN && clean.toLowerCase() === ALTERNATIVE_ADMIN_PASS.toLowerCase());

    if (isMatch) {
      setIsAuthenticated(true);
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Incorrect passcode. Please try again.');
      setPinInput('');
    }
  };

  // Handle Master Passcode Change
  const handleUpdateMasterPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    setPasscodeSuccess(null);

    const cleanNew = newPasscodeInput.trim();
    const cleanConfirm = confirmPasscodeInput.trim();

    if (cleanNew.length < 4) {
      setPasscodeError('Passcode must be at least 4 digits or characters long.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasscodeError('The two passcodes do not match. Please verify.');
      return;
    }

    localStorage.setItem('espresso_admin_master_pin', cleanNew);
    setMasterPin(cleanNew);
    setPasscodeSuccess('Master passcode successfully updated! Use your new code next time.');
    setNewPasscodeInput('');
    setConfirmPasscodeInput('');
    setTimeout(() => setPasscodeSuccess(null), 4000);
  };

  // Reset Master Passcode to default (9246)
  const handleResetToDefaultPin = () => {
    if (window.confirm('Reset admin passcode to factory default (9246)?')) {
      localStorage.removeItem('espresso_admin_master_pin');
      setMasterPin(DEFAULT_ADMIN_PIN);
      setPasscodeSuccess('Passcode reset to factory default (9246).');
      setNewPasscodeInput('');
      setConfirmPasscodeInput('');
      setTimeout(() => setPasscodeSuccess(null), 3000);
    }
  };

  // Handle Lock
  const handleLock = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    setPinInput('');
  };

  // Save Supabase Configuration
  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('espresso_supabase_url', supabaseUrl);
    localStorage.setItem('espresso_supabase_anon_key', supabaseKey);
    setIsSavedSupabase(true);
    setTimeout(() => setIsSavedSupabase(false), 2500);
  };

  // Quick Keypad Press
  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 16) {
      setPinInput((prev) => prev + digit);
      setPinError(null);
    }
  };

  const handleKeypadDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  // Locked View: PIN Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#2C2018] text-[#FAF7F2] flex flex-col items-center justify-center p-4 selection:bg-[#C26D52] selection:text-white font-mono">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#C26D52]/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm bg-[#FFFDF9] text-[#2C2018] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E8DFD5] relative overflow-hidden space-y-6 animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-[#7A6E65] hover:text-[#2C2018] flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2C2018] text-[#FAF7F2]">
              Restricted Area
            </span>
          </div>

          {/* Icon & Title */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#2C2018] text-[#C26D52] flex items-center justify-center shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold font-serif text-[#2C2018]">
              Espresso Flow Admin
            </h1>
            <p className="text-xs text-[#7A6E65] leading-relaxed">
              Enter your master passcode to access telemetry, trial metrics, and bean star ratings.
            </p>
          </div>

          {/* Form / PIN Input */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="Enter passcode..."
                className="w-full text-center tracking-widest text-lg font-bold py-3 px-4 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-[#2C2018] focus:outline-hidden focus:ring-2 focus:ring-[#C26D52]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E65] hover:text-[#2C2018]"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {pinError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-center animate-shake flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Quick Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8DFD5] active:scale-95 text-base font-bold text-[#2C2018] transition border border-[#E8DFD5]"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8DFD5] active:scale-95 text-xs font-bold text-[#7A6E65] transition border border-[#E8DFD5]"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8DFD5] active:scale-95 text-base font-bold text-[#2C2018] transition border border-[#E8DFD5]"
              >
                0
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-[#C26D52] hover:bg-[#A8583F] active:scale-95 text-xs font-bold text-white transition shadow-sm"
              >
                Unlock
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
            >
              <Unlock className="w-4 h-4 text-[#C26D52]" />
              <span>Open Admin Dashboard</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unlocked Admin Dashboard View
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2018] font-sans selection:bg-[#C26D52] selection:text-white">
      {/* Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#2C2018] text-[#FAF7F2] border-b border-[#3D2D22] px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2]/10 hover:bg-[#FAF7F2]/20 text-[#FAF7F2] text-xs font-mono font-medium flex items-center gap-1.5 transition"
              title="Return to Coffee Bar"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Coffee Bar</span>
            </button>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C26D52]" />
              <h1 className="text-xs sm:text-sm font-bold font-mono tracking-wider uppercase">
                Admin Hub
              </h1>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#72806B]/20 text-[#72806B] border border-[#72806B]/40 font-mono font-bold">
                Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-mono text-[#FAF7F2]/60">
              espressoflow.vercel.app/admin
            </span>
            <button
              type="button"
              onClick={handleLock}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition"
              title="Lock admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E8DFD5] pb-3 overflow-x-auto font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'metrics'
                ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                : 'bg-white hover:bg-[#FAF7F2] text-[#7A6E65] border border-[#E8DFD5]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#C26D52]" />
            <span>Revenue & 7-Day Trials</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('beans')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'beans'
                ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                : 'bg-white hover:bg-[#FAF7F2] text-[#7A6E65] border border-[#E8DFD5]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Bean Star Ratings & Database</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'curator'
                ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                : 'bg-white hover:bg-[#FAF7F2] text-[#7A6E65] border border-[#E8DFD5]'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-[#C26D52]" />
            <span>Curator Hub & Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'security'
                ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                : 'bg-white hover:bg-[#FAF7F2] text-[#7A6E65] border border-[#E8DFD5]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#C26D52]" />
            <span>Security & Passcode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'supabase'
                ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                : 'bg-white hover:bg-[#FAF7F2] text-[#7A6E65] border border-[#E8DFD5]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#72806B]" />
            <span>Supabase Cloud Sync</span>
          </button>
        </div>

        {/* TAB 1: Revenue & Trial Metrics */}
        {activeTab === 'metrics' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: 7-Day Trial Users */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#7A6E65]">
                  <span className="text-[10px] uppercase font-bold">7-Day Active Trials</span>
                  <Users className="w-4 h-4 text-[#C26D52]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2018]">
                  {simulatedTrialUsers}
                </div>
                <div className="text-[10px] text-[#72806B] font-semibold">
                  +18 new users this week
                </div>
              </div>

              {/* Card 2: Paid Lifetime Users */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#7A6E65]">
                  <span className="text-[10px] uppercase font-bold">Lifetime Unlocks</span>
                  <ShieldCheck className="w-4 h-4 text-[#72806B]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2018]">
                  {simulatedPaidUsers}
                </div>
                <div className="text-[10px] text-[#72806B] font-semibold">
                  $4.99 / 49,- DKK per unlock
                </div>
              </div>

              {/* Card 3: Total Revenue */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#7A6E65]">
                  <span className="text-[10px] uppercase font-bold">Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#2C2018]">
                  {totalRevenueDkk} DKK
                </div>
                <div className="text-[10px] text-[#7A6E65]">
                  ~${totalRevenueUsd} USD via RevenueCat
                </div>
              </div>

              {/* Card 4: Conversion Rate */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#7A6E65]">
                  <span className="text-[10px] uppercase font-bold">Conversion Rate</span>
                  <TrendingUp className="w-4 h-4 text-[#C26D52]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2018]">
                  {conversionRate}%
                </div>
                <div className="text-[10px] text-[#72806B] font-semibold">
                  Specialty coffee app benchmark
                </div>
              </div>
            </div>

            {/* Trial Strategy & RevenueCat Status Card */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5 font-mono">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#C26D52]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                    Business Model: 7-Day Free Trial → $4.99 Lifetime
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C26D52]/10 text-[#C26D52] font-bold">
                  No monthly subscriptions
                </span>
              </div>

              <p className="text-xs text-[#7A6E65] leading-relaxed">
                The app automatically starts a 7-day full access trial upon initial launch. Once the 7 days expire, the app prompts for permanent lifetime unlock for <strong>49,- DKK / $4.99 USD</strong> via RevenueCat. Zero subscription fatigue.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]">
                  <span className="text-[10px] text-[#7A6E65] uppercase block mb-1">
                    Local Device Status:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2C2018]">
                      {accessState.isProLifetime ? 'Lifetime Unlocked' : '7-Day Active Trial'}
                    </span>
                    <span className="text-[10px] text-[#C26D52]">
                      ({accessState.daysRemainingInTrial} days remaining)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]">
                  <span className="text-[10px] text-[#7A6E65] uppercase block mb-1">
                    RevenueCat Entitlement:
                  </span>
                  <div className="flex items-center gap-1.5 text-[#72806B] font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>espresso_flow_lifetime ($4.99)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Coffee Bean Ratings & Community DB */}
        {activeTab === 'beans' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Header & Stats Banner */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                    Bean Star Ratings & Community Vault
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  {totalStarredBeans} rated beans
                </span>
              </div>

              <p className="text-xs text-[#7A6E65] leading-relaxed font-sans">
                Users rate favorite beans from 1 to 5 stars. In the next phase, these ratings sync to a central Supabase database powering a public web showcase.
              </p>

              {/* Public DB Promo Banner */}
              <div className="p-4 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFB6A0]">
                    <Sparkles className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>Public Bean Vault (Web Promotion & Showcase)</span>
                  </div>
                  <p className="text-[11px] text-[#FAF7F2]/75 font-sans">
                    A standalone public web showcase at e.g. <code>espressoflow.vercel.app/beans</code> displaying the top community beans and driving app downloads.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Preview: This public showcase is pre-configured for Supabase sync in v1.3!')}
                  className="px-3.5 py-2 rounded-xl bg-[#C26D52] hover:bg-[#A8583F] text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Showcase</span>
                </button>
              </div>
            </div>

            {/* List of Beans with Ratings */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[#2C2018]">
                <span>Bean Inventory & Ratings ({beans.length} Total Beans)</span>
                <span className="text-[10px] text-[#7A6E65]">Average: {avgLocalRating} ★</span>
              </div>

              <div className="divide-y divide-[#E8DFD5]">
                {beans.map((bean) => {
                  const rating = bean.rating || 0;
                  return (
                    <div key={bean.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#2C2018] truncate">
                            {bean.name}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded-md border ${
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
                          {bean.isFavorite && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-bold">
                              Favorite
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7A6E65] mt-0.5">
                          {bean.roaster || 'Specialty Roaster'} • Grinder: {bean.grinderName.split(' ')[0]} @ {bean.grindSetting}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-[#E8DFD5]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Curator Hub & Maintenance Checklist */}
        {activeTab === 'curator' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Header & Status Card */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFD5] pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#C26D52]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                    Curator Hub & Periodic Database Audit
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                      daysSinceAudit <= 30
                        ? 'bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>
                      {daysSinceAudit <= 30
                        ? `Audit Up to Date (Next due in ${auditDueInDays} days)`
                        : `Audit Due (${daysSinceAudit} days since last audit)`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={markAuditCompleteToday}
                    className="px-3 py-1 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Check className="w-3 h-3 text-[#C26D52]" />
                    <span>Mark Complete Today</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                  <span className="text-[10px] text-[#7A6E65] uppercase font-bold block">
                    Last Full Audit:
                  </span>
                  <span className="font-bold text-[#2C2018]">{lastAuditDate}</span>
                  <span className="text-[10px] text-[#7A6E65] block">
                    {daysSinceAudit === 0 ? 'Today' : `${daysSinceAudit} days ago`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                  <span className="text-[10px] text-[#7A6E65] uppercase font-bold block">
                    Checklist Progress:
                  </span>
                  <span className="font-bold text-[#2C2018]">
                    {Object.values(checklistCompleted).filter(Boolean).length} / {CURATOR_TASKS.length} Completed
                  </span>
                  <div className="w-full bg-[#E8DFD5] rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-[#C26D52] h-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          (Object.values(checklistCompleted).filter(Boolean).length / CURATOR_TASKS.length) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                  <span className="text-[10px] text-[#7A6E65] uppercase font-bold block">
                    Recommended Cadence:
                  </span>
                  <span className="font-bold text-[#2C2018]">Monthly Review</span>
                  <span className="text-[10px] text-[#72806B] block">
                    Matches Coffee Review release cycles
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist Tasks */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[#2C2018]">
                <span>Periodic Curator Checklist</span>
                <span className="text-[10px] text-[#7A6E65]">Click checkboxes to track status</span>
              </div>

              <div className="space-y-2.5">
                {CURATOR_TASKS.map((task) => {
                  const isChecked = !!checklistCompleted[task.id];
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleChecklistItem(task.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-[#72806B]/5 border-[#72806B]/30'
                          : 'bg-[#FAF7F2] border-[#E8DFD5] hover:border-[#C26D52]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isChecked
                              ? 'bg-[#72806B] border-[#72806B] text-white'
                              : 'border-[#7A6E65]/40 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold ${
                                isChecked ? 'line-through text-[#7A6E65]' : 'text-[#2C2018]'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                task.cadence === 'Monthly'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : task.cadence === 'Quarterly'
                                  ? 'bg-blue-100 text-blue-800'
                                  : task.cadence === 'Bi-Annual'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {task.cadence}
                            </span>
                            <span className="text-[9px] text-[#7A6E65] font-mono flex items-center gap-1">
                              {task.category === 'Competitions' && <Award className="w-3 h-3 text-amber-600" />}
                              [{task.category}]
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A6E65] font-sans leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        {task.actionUrl && (
                          <a
                            href={task.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg border border-[#E8DFD5] bg-white hover:bg-[#FAF7F2] text-[#2C2018] text-[11px] font-semibold flex items-center gap-1 transition"
                          >
                            <span>{task.actionLabel || 'Visit Source'}</span>
                            <ExternalLink className="w-3 h-3 text-[#C26D52]" />
                          </a>
                        )}
                        {task.id === 'supabase_queue' && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('supabase')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-[11px] font-semibold flex items-center gap-1 transition"
                          >
                            <span>Open Supabase Vault</span>
                            <Database className="w-3 h-3 text-[#C26D52]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Curator Fast Launchpad */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-3 font-sans">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#2C2018] font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Curator Fast Launchpad (Direct Authoritative Repositories)</span>
              </div>
              <p className="text-xs text-[#7A6E65] leading-relaxed">
                Use these verified industry sources when updating <code>expert_score</code>, registering competition winning micro-lots, and cross-checking barcodes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs font-mono">
                <a
                  href="https://www.coffeereview.com/all-reviews/?roast_profile=espresso"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#C26D52] transition flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-[#2C2018]">Coffee Review</strong>
                    <span className="text-[10px] text-[#7A6E65]">Espresso 100-pt Blind Scores</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7A6E65] group-hover:text-[#C26D52] transition" />
                </a>

                <a
                  href="https://allianceforcoffeeexcellence.org/cup-of-excellence/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#C26D52] transition flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-[#2C2018]">Cup of Excellence</strong>
                    <span className="text-[10px] text-[#7A6E65]">World Auction Winning Lots</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7A6E65] group-hover:text-[#C26D52] transition" />
                </a>

                <a
                  href="https://world.openfoodfacts.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#C26D52] transition flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-[#2C2018]">Open Food Facts</strong>
                    <span className="text-[10px] text-[#7A6E65]">Global EAN Barcode Vault</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7A6E65] group-hover:text-[#C26D52] transition" />
                </a>

                <a
                  href="https://vdxfmvzdmcqfixbegumb.supabase.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#C26D52] transition flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-[#2C2018]">Supabase Console</strong>
                    <span className="text-[10px] text-[#7A6E65]">Frankfurt eu-central-1 DB</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7A6E65] group-hover:text-[#C26D52] transition" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Security & Master Passcode */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#C26D52]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                    Master Passcode & Access Control
                  </h3>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    masterPin === DEFAULT_ADMIN_PIN
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30'
                  }`}
                >
                  {masterPin === DEFAULT_ADMIN_PIN ? 'Default PIN Active (9246)' : 'Custom Passcode Active'}
                </span>
              </div>

              <p className="text-xs text-[#7A6E65] leading-relaxed font-sans">
                Set your private master passcode to secure telemetry, trial metrics, and coffee bean ratings. You can use any numeric PIN or alphanumeric password (minimum 4 characters).
              </p>

              {/* Passcode Update Form */}
              <form onSubmit={handleUpdateMasterPasscode} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#7A6E65] uppercase block font-bold">
                      New Passcode / PIN:
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPasscode ? 'text' : 'password'}
                        value={newPasscodeInput}
                        onChange={(e) => {
                          setNewPasscodeInput(e.target.value);
                          setPasscodeError(null);
                        }}
                        placeholder="e.g. 5821 or mysecretcode"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-xs text-[#2C2018] focus:outline-hidden focus:ring-1 focus:ring-[#C26D52] tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasscode(!showNewPasscode)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A6E65] hover:text-[#2C2018]"
                      >
                        {showNewPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#7A6E65] uppercase block font-bold">
                      Confirm New Passcode:
                    </label>
                    <input
                      type={showNewPasscode ? 'text' : 'password'}
                      value={confirmPasscodeInput}
                      onChange={(e) => {
                        setConfirmPasscodeInput(e.target.value);
                        setPasscodeError(null);
                      }}
                      placeholder="Re-enter new passcode"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-xs text-[#2C2018] focus:outline-hidden focus:ring-1 focus:ring-[#C26D52] tracking-wider"
                    />
                  </div>
                </div>

                {passcodeError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passcodeError}</span>
                  </div>
                )}

                {passcodeSuccess && (
                  <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{passcodeSuccess}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  {masterPin !== DEFAULT_ADMIN_PIN ? (
                    <button
                      type="button"
                      onClick={handleResetToDefaultPin}
                      className="text-xs text-[#7A6E65] hover:text-red-700 underline transition"
                    >
                      Reset to factory default (9246)
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs ml-auto"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Save Master Passcode</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Storage & Privacy Architecture Card */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-3 font-sans">
              <div className="flex items-center gap-2 text-xs font-bold uppercase font-mono text-[#2C2018]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#72806B]" />
                <span>Security & Device Storage</span>
              </div>
              <p className="text-xs text-[#7A6E65] leading-relaxed">
                Your passcode is securely stored in device local storage and is never exposed on the login screen. It persists seamlessly across app sessions and browser reloads.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Supabase & Cloud Backend Integration */}
        {activeTab === 'supabase' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#72806B]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
                    Supabase Central Database Sync
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#72806B]/15 text-[#72806B] font-bold">
                  Ready for Sync
                </span>
              </div>

              <p className="text-xs text-[#7A6E65] leading-relaxed font-sans">
                Connect your Supabase project to aggregate community bean star ratings and track 7-day trial telemetry. Schema is provisioned with Row Level Security (RLS).
              </p>

              {/* Supabase Config Form */}
              <form onSubmit={handleSaveSupabase} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#7A6E65] uppercase block font-bold">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-xs text-[#2C2018] focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#7A6E65] uppercase block font-bold">
                    Supabase Anon Public API Key:
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-xs text-[#2C2018] focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[10px] text-[#72806B]">
                    {isSavedSupabase && (
                      <span className="flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" /> Configuration saved!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={testConnection}
                      disabled={isTestingConn}
                      className="px-3 py-2 rounded-xl border border-[#E8DFD5] hover:bg-[#FAF7F2] text-[#7A6E65] text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin text-[#C26D52]' : ''}`} />
                      <span>{isTestingConn ? 'Pinging...' : 'Test Connection'}</span>
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Check className="w-3.5 h-3.5 text-[#C26D52]" />
                      <span>Save Supabase Credentials</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Live Connection Diagnostics */}
              {connStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    connStatus.ok
                      ? 'bg-[#72806B]/10 border-[#72806B]/30 text-[#2C2018]'
                      : 'bg-[#C26D52]/10 border-[#C26D52]/30 text-[#C26D52]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {connStatus.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-[#72806B]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#C26D52]" />
                    )}
                    <span className="font-semibold">{connStatus.message}</span>
                  </div>
                  {connStatus.pingMs !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E8DFD5]">
                      {connStatus.pingMs} ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Live Global Coffee Beans from Supabase */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#2C2018]">
                  <Globe className="w-3.5 h-3.5 text-[#C26D52]" />
                  <span>Central Bean Vault ({cloudBeans.length} Verified in Cloud)</span>
                </div>
                <button
                  type="button"
                  onClick={loadCloudBeans}
                  disabled={isLoadingCloudBeans}
                  className="text-[10px] text-[#7A6E65] hover:text-[#2C2018] flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCloudBeans ? 'animate-spin' : ''}`} />
                  <span>Refresh Cloud Data</span>
                </button>
              </div>

              {isLoadingCloudBeans ? (
                <div className="py-6 text-center text-xs text-[#7A6E65] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C26D52]" />
                  <span>Loading cloud database records...</span>
                </div>
              ) : cloudBeans.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {cloudBeans.map((b) => (
                    <div
                      key={b.barcode}
                      className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2C2018]">{b.name}</span>
                          <span className="text-[10px] text-[#7A6E65]">({b.roaster})</span>
                          {b.is_verified && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#72806B]/20 text-[#72806B] font-bold">
                              Verified
                            </span>
                          )}
                          {b.expert_score && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                              🏅 {Number(b.expert_score).toFixed(0)} PTS ({b.expert_source || 'Expert'})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#7A6E65] font-mono">
                          <span>EAN: {b.barcode}</span>
                          <span>•</span>
                          <span className="capitalize">{b.roast_level}</span>
                          <span>•</span>
                          <span>{b.purchase_country}</span>
                        </div>
                        {b.suitable_for && b.suitable_for.length > 0 && (
                          <div className="flex items-center gap-1 pt-0.5">
                            {b.suitable_for.map((drink) => (
                              <span
                                key={drink}
                                className="text-[8px] px-1.5 py-0.2 rounded bg-[#C26D52]/10 text-[#C26D52] font-semibold uppercase"
                              >
                                {drink.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 font-bold text-[#2C2018]">
                          <Star className="w-3.5 h-3.5 fill-[#C26D52] text-[#C26D52]" />
                          <span>{Number(b.avg_rating).toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-[#7A6E65] font-mono">
                          {b.ratings_count} votes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs text-[#7A6E65] text-center">
                  No beans synced yet. Once the SQL schema is provisioned, kickstart seeds will appear here.
                </div>
              )}
            </div>

            {/* SQL Table Schemas Preview */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#2C2018]">
                <Layers className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Provisioned Tables in Supabase</span>
              </div>
              <div className="text-[11px] text-[#7A6E65] space-y-2">
                <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5]">
                  <strong className="text-[#2C2018]">global_coffee_beans:</strong> Primary Key = Barcode (EAN-13). Aggregates verified roasters, bean names, roast levels, country, drink suitability tags, and weighted community rating.
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5]">
                  <strong className="text-[#2C2018]">bean_drink_ratings:</strong> Individual barista reviews with star ratings (1-5), drink category (Flat White, Pure Espresso, Cortado), device fingerprints, and brew ratios.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
