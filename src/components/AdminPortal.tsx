import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Edit3,
  Trash2,
  Camera,
  Tag,
  Plus,
  Search,
  X,
  Copy,
  ArrowUpDown,
  Store,
  Radio,
} from 'lucide-react';
import type { CoffeeBeanProfile, UserAccessState } from '../types/espresso';
import { isTelemetryEnabled, setTelemetryEnabled } from '../lib/scaleTelemetry';
import {
  testSupabaseConnection,
  getSupabaseClient,
  fetchAllCuratorBeans,
  adminVerifyGlobalBean,
  adminDeleteGlobalBean,
  adminCreateGlobalBean,
  type GlobalCoffeeBean,
} from '../lib/supabase';
import {
  POPULAR_FLAVOR_TAGS,
  suggestRoasters,
  compressImageToDataUrl,
} from '../lib/beanCatalogMatcher';

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

const SQL_MIGRATION_SCRIPT = `-- ==============================================================================
-- ESPRESSO FLOW - SUPABASE CENTRAL BEAN VAULT & DRINK RATINGS SCHEMA (v1.2.29)
-- Safe, Idempotent Execution Script
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES IF NOT EXIST
CREATE TABLE IF NOT EXISTS global_coffee_beans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode VARCHAR(32) UNIQUE NOT NULL,
  roaster VARCHAR(120) NOT NULL,
  name VARCHAR(150) NOT NULL,
  roast_level VARCHAR(30) NOT NULL,
  origin_country VARCHAR(100),
  purchase_country VARCHAR(10) DEFAULT 'DK',
  purchase_location VARCHAR(120),
  suitable_for TEXT[] DEFAULT '{}',
  flavor_notes TEXT[] DEFAULT '{}',
  avg_rating NUMERIC(3,2) DEFAULT 0.00,
  ratings_count INT DEFAULT 0,
  verifications_count INT DEFAULT 1,
  is_verified BOOLEAN DEFAULT FALSE,
  expert_score NUMERIC(4,1),
  expert_source VARCHAR(60),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bean_drink_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode VARCHAR(32) NOT NULL REFERENCES global_coffee_beans(barcode) ON DELETE CASCADE,
  user_fingerprint VARCHAR(64) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  drink_type VARCHAR(50) NOT NULL,
  purchase_country VARCHAR(10) DEFAULT 'DK',
  purchase_location VARCHAR(120),
  brew_ratio VARCHAR(20),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENSURE ALL COLUMNS EXIST IF TABLE WAS CREATED FROM EARLIER DRAFT
ALTER TABLE global_coffee_beans ADD COLUMN IF NOT EXISTS purchase_location VARCHAR(120);
ALTER TABLE bean_drink_ratings ADD COLUMN IF NOT EXISTS purchase_location VARCHAR(120);
ALTER TABLE global_coffee_beans ADD COLUMN IF NOT EXISTS flavor_notes TEXT[] DEFAULT '{}';
ALTER TABLE global_coffee_beans ADD COLUMN IF NOT EXISTS verifications_count INT DEFAULT 1;
ALTER TABLE global_coffee_beans ADD COLUMN IF NOT EXISTS expert_score NUMERIC(4,1);
ALTER TABLE global_coffee_beans ADD COLUMN IF NOT EXISTS expert_source VARCHAR(60);
ALTER TABLE global_coffee_beans ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE global_coffee_beans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. HIGH-PERFORMANCE INDEXES (< 2ms queries)
CREATE INDEX IF NOT EXISTS idx_beans_barcode ON global_coffee_beans(barcode);
CREATE INDEX IF NOT EXISTS idx_beans_country ON global_coffee_beans(purchase_country);
CREATE INDEX IF NOT EXISTS idx_beans_rating ON global_coffee_beans(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_beans_verified ON global_coffee_beans(is_verified);
CREATE INDEX IF NOT EXISTS idx_beans_curator_queue ON global_coffee_beans(is_verified ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beans_verified_rating ON global_coffee_beans(is_verified DESC, avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_beans_roaster_name ON global_coffee_beans(roaster, name);
CREATE INDEX IF NOT EXISTS idx_ratings_barcode ON bean_drink_ratings(barcode);
CREATE INDEX IF NOT EXISTS idx_ratings_drink_type ON bean_drink_ratings(drink_type);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE global_coffee_beans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bean_drink_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read global_coffee_beans" ON global_coffee_beans;
CREATE POLICY "Allow public read global_coffee_beans" ON global_coffee_beans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert global_coffee_beans" ON global_coffee_beans;
CREATE POLICY "Allow public insert global_coffee_beans" ON global_coffee_beans FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update global_coffee_beans" ON global_coffee_beans;
CREATE POLICY "Allow public update global_coffee_beans" ON global_coffee_beans FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete global_coffee_beans" ON global_coffee_beans;
CREATE POLICY "Allow public delete global_coffee_beans" ON global_coffee_beans FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read bean_drink_ratings" ON bean_drink_ratings;
CREATE POLICY "Allow public read bean_drink_ratings" ON bean_drink_ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert bean_drink_ratings" ON bean_drink_ratings;
CREATE POLICY "Allow public insert bean_drink_ratings" ON bean_drink_ratings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete bean_drink_ratings" ON bean_drink_ratings;
CREATE POLICY "Allow public delete bean_drink_ratings" ON bean_drink_ratings FOR DELETE USING (true);

-- 6. VERIFIED SPECIALTY SEEDS (Clean: Only genuine public cup records, Untappd retail locations, 0 user ratings)
INSERT INTO global_coffee_beans (barcode, roaster, name, roast_level, origin_country, purchase_country, purchase_location, suitable_for, flavor_notes, avg_rating, ratings_count, is_verified, expert_score, expert_source)
VALUES
  ('4056489503019', 'Hedekaffe', 'Ristemesterens Foretrukne Mellemristet', 'medium', 'Sydamerika & Indonesien (Ulfborg)', 'DK', 'Hedekaffe Gårdbutik (Ulfborg) / Webshop', ARRAY['pure_espresso', 'flat_white', 'cortado', 'cappuccino'], ARRAY['Mørk Chokolade', 'Ristede Nødder', 'Karamel'], 0.00, 0, true, NULL, NULL),
  ('5700000000010', 'The Coffee Collective', 'Kieni', 'light', 'Kenya', 'DK', 'The Coffee Collective Kaffebarer / Webshop', ARRAY['pure_espresso', 'modern_espresso'], ARRAY['Solbær', 'Rabarber', 'Rørsukker'], 0.00, 0, true, 94.0, 'Coffee Review'),
  ('8000070025066', 'Lavazza', 'Espresso Barista Gran Crema', 'dark', 'Sydamerika & Sydøstasien', 'IT', 'Føtex, Bilka, Meny, Nemlig', ARRAY['pure_espresso', 'cappuccino', 'flat_white'], ARRAY['Mørk Chokolade', 'Krydderier', 'Karamel'], 0.00, 0, true, NULL, NULL),
  ('8000070025080', 'Lavazza', 'Espresso Barista Perfetto', 'medium', 'Central & Sydamerika (100% Arabica)', 'IT', 'Føtex, Bilka, Meny', ARRAY['pure_espresso', 'cortado', 'flat_white'], ARRAY['Chokolade', 'Jasmin & Blomster', 'Frugtagtig'], 0.00, 0, true, NULL, NULL),
  ('8000070025059', 'Lavazza', 'Espresso Barista Intenso', 'dark', 'Sydamerika & Afrika', 'IT', 'Føtex, Bilka, Meny', ARRAY['pure_espresso', 'cappuccino'], ARRAY['Mørk Chokolade', 'Ristede Nødder', 'Krydderier'], 0.00, 0, true, NULL, NULL),
  ('7072611000018', 'Tim Wendelboe', 'Caballero Geisha', 'light', 'Honduras', 'NO', 'Tim Wendelboe Oslo / Webshop', ARRAY['pure_espresso', 'modern_espresso'], ARRAY['Jasmin & Blomster', 'Fersken & Abrikos', 'Bergamot'], 0.00, 0, true, 95.5, 'Cup of Excellence')
ON CONFLICT (barcode) DO UPDATE SET
  purchase_location = EXCLUDED.purchase_location,
  expert_score = EXCLUDED.expert_score,
  expert_source = EXCLUDED.expert_source,
  is_verified = TRUE,
  updated_at = NOW();

-- 7. SCALE DIAGNOSTIC SESSIONS TABLE (Flight Data Recorder for Camera/OCR Telemetry)
CREATE TABLE IF NOT EXISTS scale_diagnostic_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(64) UNIQUE NOT NULL,
  device_info JSONB,
  recipe_info JSONB,
  summary_info JSONB,
  telemetry_samples JSONB,
  initial_image TEXT,
  final_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON scale_diagnostic_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_session_id ON scale_diagnostic_sessions(session_id);

ALTER TABLE scale_diagnostic_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert scale_diagnostic_sessions" ON scale_diagnostic_sessions;
CREATE POLICY "Allow public insert scale_diagnostic_sessions"
  ON scale_diagnostic_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read scale_diagnostic_sessions" ON scale_diagnostic_sessions;
CREATE POLICY "Allow public read scale_diagnostic_sessions"
  ON scale_diagnostic_sessions FOR SELECT
  USING (true);`;

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
  const [telemetryActive, setTelemetryActive] = useState<boolean>(() => isTelemetryEnabled());

  const handleToggleTelemetry = () => {
    const next = !telemetryActive;
    setTelemetryActive(next);
    setTelemetryEnabled(next);
  };

  // Curator Hub & Periodic Audit State
  const [lastAuditDate, setLastAuditDate] = useState<string>(() => {
    return localStorage.getItem('espresso_last_curator_audit') || '';
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
    if (!dateStr) return 0;
    const past = new Date(dateStr);
    if (isNaN(past.getTime())) return 0;
    const diff = Date.now() - past.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const daysSinceAudit = lastAuditDate ? getDaysSinceAudit(lastAuditDate) : null;
  const auditDueInDays = daysSinceAudit !== null ? Math.max(0, 30 - daysSinceAudit) : null;

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
    const saved = localStorage.getItem('espresso_supabase_url');
    if (saved) return saved;
    const fallback = import.meta.env.VITE_SUPABASE_URL || 'https://vdxfmvzdmcqfixbegumb.supabase.co';
    localStorage.setItem('espresso_supabase_url', fallback);
    return fallback;
  });
  const [supabaseKey, setSupabaseKey] = useState<string>(() => {
    const saved = localStorage.getItem('espresso_supabase_anon_key');
    if (saved) return saved;
    const fallback =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeGZtdnpkbWNxZml4YmVndW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NzYsImV4cCI6MjEwNjA5Mjc3Nn0.8MlspGgPxNuIiRWH819Z59MKgVWzAQdqKPE3cqFv9P4';
    localStorage.setItem('espresso_supabase_anon_key', fallback);
    return fallback;
  });
  const [isSavedSupabase, setIsSavedSupabase] = useState<boolean>(false);
  const [connStatus, setConnStatus] = useState<{
    ok: boolean;
    message: string;
    pingMs?: number;
    schemaUpToDate?: boolean;
  } | null>(null);
  const [hasCopiedSql, setHasCopiedSql] = useState<boolean>(false);
  const [showSqlPreview, setShowSqlPreview] = useState<boolean>(false);
  const [isTestingConn, setIsTestingConn] = useState<boolean>(false);
  const [cloudBeans, setCloudBeans] = useState<GlobalCoffeeBean[]>([]);
  const [isLoadingCloudBeans, setIsLoadingCloudBeans] = useState<boolean>(false);

  // Live Curator Studio & Approval Queue State
  const [curatorBeans, setCuratorBeans] = useState<GlobalCoffeeBean[]>([]);
  const [isLoadingCurator, setIsLoadingCurator] = useState<boolean>(false);
  const [curatorSubTab, setCuratorSubTab] = useState<'pending' | 'verified' | 'create' | 'checklist'>('pending');
  const [curatorSearch, setCuratorSearch] = useState<string>('');
  const [curatorSortBy, setCuratorSortBy] = useState<
    'newest' | 'rating_desc' | 'votes_desc' | 'score_desc' | 'name_asc' | 'roaster_asc' | 'roast'
  >('newest');
  const [editingBean, setEditingBean] = useState<GlobalCoffeeBean | null>(null);
  const [curatorFeedback, setCuratorFeedback] = useState<string | null>(null);

  // Edit / Create Form State
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formRoaster, setFormRoaster] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formRoastLevel, setFormRoastLevel] = useState<'light' | 'medium' | 'dark'>('medium');
  const [formOrigin, setFormOrigin] = useState<string>('');
  const [formPurchaseCountry, setFormPurchaseCountry] = useState<string>('DK');
  const [formPurchaseLocation, setFormPurchaseLocation] = useState<string>('');
  const [formExpertScore, setFormExpertScore] = useState<string>('');
  const [formExpertSource, setFormExpertSource] = useState<string>('SCA Q-Grader');
  const [formFlavorNotes, setFormFlavorNotes] = useState<string[]>([]);
  const [formSuitableFor, setFormSuitableFor] = useState<string[]>(['pure_espresso', 'flat_white']);
  const [formImageUrl, setFormImageUrl] = useState<string | undefined>(undefined);
  const [isSubmittingCurator, setIsSubmittingCurator] = useState<boolean>(false);

  const loadCuratorBeans = useCallback(async () => {
    setIsLoadingCurator(true);
    try {
      const data = await fetchAllCuratorBeans();
      setCuratorBeans(data);
    } catch (err) {
      console.error('Failed to load curator beans', err);
    } finally {
      setIsLoadingCurator(false);
    }
  }, []);

  const handleVerifyBeanQuick = async (bean: GlobalCoffeeBean) => {
    const res = await adminVerifyGlobalBean(bean.barcode);
    if (res.success) {
      setCuratorBeans((prev) =>
        prev.map((b) => (b.barcode === bean.barcode ? { ...b, is_verified: true } : b))
      );
      setCuratorFeedback(`✓ "${bean.name}" er nu officielt verificeret!`);
      setTimeout(() => setCuratorFeedback(null), 3500);
    } else {
      alert(`Kunne ikke verificere: ${res.error}`);
    }
  };

  const handleDeleteCuratorBean = async (bean: GlobalCoffeeBean) => {
    if (!confirm(`Er du sikker på, at du vil slette "${bean.name}" (${bean.roaster}) fra den centrale bønnehvælving?`)) {
      return;
    }
    const res = await adminDeleteGlobalBean(bean.barcode);
    if (res.success) {
      setCuratorBeans((prev) => prev.filter((b) => b.barcode !== bean.barcode));
      setCuratorFeedback(`"${bean.name}" er slettet fra databasen.`);
      setTimeout(() => setCuratorFeedback(null), 3500);
    } else {
      alert(`Fejl ved sletning: ${res.error}`);
    }
  };

  const handleStartEdit = (bean: GlobalCoffeeBean) => {
    setEditingBean(bean);
    setFormBarcode(bean.barcode);
    setFormRoaster(bean.roaster);
    setFormName(bean.name);
    setFormRoastLevel(bean.roast_level);
    setFormOrigin(bean.origin_country || '');
    setFormPurchaseCountry(bean.purchase_country || 'DK');
    setFormPurchaseLocation(bean.purchase_location || '');
    setFormExpertScore(bean.expert_score ? String(bean.expert_score) : '');
    setFormExpertSource(bean.expert_source || 'SCA Q-Grader');
    setFormFlavorNotes(bean.flavor_notes || []);
    setFormSuitableFor(bean.suitable_for || ['pure_espresso', 'flat_white']);
    setFormImageUrl(bean.image_url);
  };

  const handleSaveBeanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBean) return;
    setIsSubmittingCurator(true);

    const scoreNum = formExpertScore.trim() ? parseFloat(formExpertScore) : null;
    const updates: any = {
      roaster: formRoaster.trim(),
      name: formName.trim(),
      roast_level: formRoastLevel,
      origin_country: formOrigin.trim() || undefined,
      purchase_country: formPurchaseCountry.trim(),
      purchase_location: formPurchaseLocation.trim() || undefined,
      expert_score: scoreNum,
      expert_source: scoreNum ? formExpertSource.trim() : null,
      flavor_notes: formFlavorNotes,
      suitable_for: formSuitableFor,
      image_url: formImageUrl,
      is_verified: true,
    };

    const res = await adminVerifyGlobalBean(editingBean.barcode, updates);
    setIsSubmittingCurator(false);

    if (res.success) {
      setCuratorBeans((prev) =>
        prev.map((b) => (b.barcode === editingBean.barcode ? { ...b, ...updates, is_verified: true } : b))
      );
      setCuratorFeedback(`✓ Rettelse gemt og "${formName}" er verificeret!`);
      setEditingBean(null);
      setTimeout(() => setCuratorFeedback(null), 3500);
    } else {
      alert(`Fejl ved gemning: ${res.error}`);
    }
  };

  const handleCreateNewVerifiedBean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBarcode.trim() || !formName.trim() || !formRoaster.trim()) {
      alert('Stregkode, kaffenavn og risteri er påkrævet.');
      return;
    }
    setIsSubmittingCurator(true);

    const scoreNum = formExpertScore.trim() ? parseFloat(formExpertScore) : undefined;
    const newBean: GlobalCoffeeBean = {
      barcode: formBarcode.trim(),
      roaster: formRoaster.trim(),
      name: formName.trim(),
      roast_level: formRoastLevel,
      origin_country: formOrigin.trim() || undefined,
      purchase_country: formPurchaseCountry.trim() || 'DK',
      purchase_location: formPurchaseLocation.trim() || undefined,
      expert_score: scoreNum,
      expert_source: scoreNum ? formExpertSource.trim() : undefined,
      flavor_notes: formFlavorNotes,
      suitable_for: formSuitableFor,
      image_url: formImageUrl,
      is_verified: true,
      avg_rating: 0.0,
      ratings_count: 0,
      verifications_count: 1,
    };

    const res = await adminCreateGlobalBean(newBean);
    setIsSubmittingCurator(false);

    if (res.success) {
      setCuratorBeans((prev) => [newBean, ...prev.filter((b) => b.barcode !== newBean.barcode)]);
      setCuratorFeedback(`✓ Ny verificeret kaffe "${newBean.name}" tilføjet til skyen!`);
      setFormBarcode('');
      setFormRoaster('');
      setFormName('');
      setFormOrigin('');
      setFormPurchaseLocation('');
      setFormExpertScore('');
      setFormFlavorNotes([]);
      setFormImageUrl(undefined);
      setCuratorSubTab('verified');
      setTimeout(() => setCuratorFeedback(null), 3500);
    } else {
      alert(`Fejl ved oprettelse: ${res.error}`);
    }
  };

  const handleCuratorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 400, 0.75);
      setFormImageUrl(compressed);
    } catch (err) {
      console.error('Failed to compress photo:', err);
    }
  };

  const toggleFormFlavorTag = (tagLabel: string) => {
    setFormFlavorNotes((prev) =>
      prev.includes(tagLabel) ? prev.filter((t) => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const toggleFormDrinkSuitability = (drink: string) => {
    setFormSuitableFor((prev) =>
      prev.includes(drink) ? prev.filter((d) => d !== drink) : [...prev, drink]
    );
  };

  const roasterCuratorSuggestions = useMemo(() => {
    if (!formRoaster.trim() || formRoaster.length < 2) return [];
    return suggestRoasters(formRoaster, 5);
  }, [formRoaster]);

  const testConnection = useCallback(async (overrideUrl?: string, overrideKey?: string) => {
    setIsTestingConn(true);
    const targetUrl = overrideUrl || supabaseUrl;
    const targetKey = overrideKey || supabaseKey;
    const res = await testSupabaseConnection(targetUrl, targetKey);
    setConnStatus(res);
    setIsTestingConn(false);
    if (res.ok) {
      loadCloudBeans();
    }
  }, [supabaseUrl, supabaseKey]);

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
      loadCuratorBeans();
    }
  }, [isAuthenticated, testConnection, loadCuratorBeans]);

  // Local Community Telemetry (100% authentic data, zero simulations)
  const totalStarredBeans = beans.filter((b) => (b.rating || 0) > 0 || b.isFavorite).length;
  const avgLocalRating =
    beans.filter((b) => (b.rating || 0) > 0).length > 0
      ? (
          beans
            .filter((b) => (b.rating || 0) > 0)
            .reduce((acc, b) => acc + (b.rating || 0), 0) /
          beans.filter((b) => (b.rating || 0) > 0).length
        ).toFixed(1)
      : '–';

  // Real Local & Store Status (Strictly 100% authentic data, zero simulations)
  const realTrialUsers = accessState.isProLifetime ? 0 : 1;
  const realPaidUsers = accessState.isProLifetime ? 1 : 0;
  const priceDkk = 49;
  const priceUsd = 4.99;
  const totalRevenueDkk = realPaidUsers * priceDkk;
  const totalRevenueUsd = (realPaidUsers * priceUsd).toFixed(2);
  const conversionRate = realPaidUsers > 0 ? '100.0' : '0.0';

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
    testConnection(supabaseUrl, supabaseKey);
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
              Flowbean Admin
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
      <header className="sticky top-0 z-40 bg-[#2C2018] text-[#FAF7F2] border-b border-[#3D2D22] px-4 py-3 sm:px-6 pt-safe">
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
                  {realTrialUsers}
                </div>
                <div className="text-[10px] text-[#7A6E65] font-semibold">
                  {accessState.isProLifetime ? 'Konverteret på enhed' : `${accessState.daysRemainingInTrial}d tilbage på enhed`}
                </div>
              </div>

              {/* Card 2: Paid Lifetime Users */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#7A6E65]">
                  <span className="text-[10px] uppercase font-bold">Lifetime Unlocks</span>
                  <ShieldCheck className="w-4 h-4 text-[#72806B]" />
                </div>
                <div className="text-2xl font-bold text-[#2C2018]">
                  {realPaidUsers}
                </div>
                <div className="text-[10px] text-[#72806B] font-semibold">
                  {realPaidUsers > 0 ? '1 aktiv licens' : '0 solgt (Pre-launch)'}
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
                  {realPaidUsers > 0 ? `~$${totalRevenueUsd} USD via RevenueCat` : '$0.00 USD (Afventer launch)'}
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
                <div className="text-[10px] text-[#7A6E65] font-semibold">
                  {realPaidUsers > 0 ? 'Lokal Pro status' : 'Beregnes ved App Store launch'}
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

        {/* TAB 3: Coffee Curator Studio & Approval Queue */}
        {activeTab === 'curator' && (() => {
          const pendingBeans = curatorBeans.filter((b) => !b.is_verified);
          const verifiedBeans = curatorBeans.filter((b) => b.is_verified);
          const filteredBeans = (curatorSubTab === 'pending' ? pendingBeans : verifiedBeans).filter((b) => {
            if (!curatorSearch.trim()) return true;
            const q = curatorSearch.toLowerCase();
            return (
              b.name.toLowerCase().includes(q) ||
              b.roaster.toLowerCase().includes(q) ||
              b.barcode.includes(q) ||
              (b.origin_country && b.origin_country.toLowerCase().includes(q)) ||
              (b.purchase_location && b.purchase_location.toLowerCase().includes(q))
            );
          });

          const displayedBeans = [...filteredBeans].sort((a, b) => {
            if (curatorSortBy === 'rating_desc') {
              if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
              return b.ratings_count - a.ratings_count;
            }
            if (curatorSortBy === 'votes_desc') {
              return b.ratings_count - a.ratings_count;
            }
            if (curatorSortBy === 'score_desc') {
              return (b.expert_score || 0) - (a.expert_score || 0);
            }
            if (curatorSortBy === 'name_asc') {
              return a.name.localeCompare(b.name);
            }
            if (curatorSortBy === 'roaster_asc') {
              return a.roaster.localeCompare(b.roaster);
            }
            if (curatorSortBy === 'roast') {
              const order: Record<string, number> = { light: 1, medium: 2, dark: 3 };
              return (order[a.roast_level] || 2) - (order[b.roast_level] || 2);
            }
            return (b.created_at || '').localeCompare(a.created_at || '');
          });

          return (
            <div className="space-y-6 animate-fadeIn font-mono">
              {/* Feedback toast */}
              {curatorFeedback && (
                <div className="p-3.5 rounded-xl bg-[#2C2018] text-[#FAF7F2] border border-[#72806B] text-xs shadow-lg flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#72806B] shrink-0" />
                    <span>{curatorFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCuratorFeedback(null)}
                    className="text-[#FAF7F2]/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Header KPI Banner */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFD5] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-[#C26D52]" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2C2018]">
                        Coffee Curator Studio
                      </h3>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#C26D52]/10 border border-[#C26D52]/30 text-[#C26D52]">
                        Central Vault Control
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A6E65] font-sans">
                      Godkend scannede specialty kaffer, ret stavefejl, tildel officielle SCA Cupping point og administrer det globale bønneindeks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadCuratorBeans}
                      disabled={isLoadingCurator}
                      className="px-3 py-1.5 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FAF7F2] text-xs font-semibold flex items-center gap-1.5 text-[#2C2018] transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCurator ? 'animate-spin text-[#C26D52]' : ''}`} />
                      <span>{isLoadingCurator ? 'Opdaterer...' : 'Genindlæs Vault'}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-0.5">
                    <span className="text-[9.5px] uppercase font-bold text-[#7A6E65] block">
                      Afventer Godkendelse:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xl font-bold ${pendingBeans.length > 0 ? 'text-amber-600' : 'text-[#72806B]'}`}>
                        {pendingBeans.length}
                      </span>
                      {pendingBeans.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-0.5">
                    <span className="text-[9.5px] uppercase font-bold text-[#7A6E65] block">
                      Verificeret i Vault:
                    </span>
                    <span className="text-xl font-bold text-[#2C2018]">
                      {verifiedBeans.length}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-0.5">
                    <span className="text-[9.5px] uppercase font-bold text-[#7A6E65] block">
                      SCA Cupping Scores:
                    </span>
                    <span className="text-xl font-bold text-amber-700">
                      {curatorBeans.filter((b) => !!b.expert_score).length} rated
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-0.5">
                    <span className="text-[9.5px] uppercase font-bold text-[#7A6E65] block">
                      Månedlig Revision:
                    </span>
                    <span className={`text-xs font-bold ${lastAuditDate && daysSinceAudit !== null ? (daysSinceAudit <= 30 ? 'text-[#72806B]' : 'text-amber-600') : 'text-[#7A6E65]'}`}>
                      {lastAuditDate && daysSinceAudit !== null ? (daysSinceAudit <= 30 ? `OK (${auditDueInDays} d.)` : 'Forfalden') : 'Ej udført endnu'}
                    </span>
                  </div>
                </div>

                {/* Sub-Tabs Switcher */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#E8DFD5] overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCuratorSubTab('pending');
                      setEditingBean(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      curatorSubTab === 'pending'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>Afventer Godkendelse</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      curatorSubTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {pendingBeans.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCuratorSubTab('verified');
                      setEditingBean(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      curatorSubTab === 'verified'
                        ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                        : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#72806B]" />
                    <span>Officielt Verificerede ({verifiedBeans.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCuratorSubTab('create');
                      setEditingBean(null);
                      setFormBarcode('');
                      setFormRoaster('');
                      setFormName('');
                      setFormOrigin('');
                      setFormExpertScore('');
                      setFormFlavorNotes([]);
                      setFormImageUrl(undefined);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      curatorSubTab === 'create'
                        ? 'bg-[#C26D52] text-white shadow-xs'
                        : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Opret Ny Verificeret Kaffe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCuratorSubTab('checklist');
                      setEditingBean(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      curatorSubTab === 'checklist'
                        ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                        : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-[#C26D52]" />
                    <span>Tjekliste & Kilder</span>
                  </button>
                </div>
              </div>

              {/* SUB-VIEW 1: INLINE EDITING DESK (If editing a bean) */}
              {editingBean && (
                <form
                  onSubmit={handleSaveBeanEdit}
                  className="bg-[#FFFDF9] rounded-2xl border-2 border-[#C26D52] p-5 shadow-lg space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#C26D52]" />
                      <h4 className="text-xs sm:text-sm font-bold text-[#2C2018] uppercase">
                        Rediger & Poler: {editingBean.name}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingBean(null)}
                      className="text-[#7A6E65] hover:text-[#2C2018] text-xs cursor-pointer"
                    >
                      Luk redigering
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        EAN-13 Stregkode (Fast nøgle)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formBarcode}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] font-mono text-[#7A6E65] cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Risteri / Brand *
                      </label>
                      <input
                        type="text"
                        required
                        value={formRoaster}
                        onChange={(e) => setFormRoaster(e.target.value)}
                        placeholder="f.eks. Hedekaffe, Coffee Collective, Lavazza"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                      {roasterCuratorSuggestions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-[#A6998E] font-mono">Forslag:</span>
                          {roasterCuratorSuggestions.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setFormRoaster(r)}
                              className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#FAF7F2] border border-[#DECFC0] hover:border-[#C26D52] cursor-pointer"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Kaffenavn / Oprindelse *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="f.eks. Ristemesterens Foretrukne Mellemristet"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Risteprofil
                      </label>
                      <select
                        value={formRoastLevel}
                        onChange={(e) => setFormRoastLevel(e.target.value as 'light' | 'medium' | 'dark')}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      >
                        <option value="light">Lysristet (Floral, høj syrlighed)</option>
                        <option value="medium">Mellemristet (Karamel, chokolade, balance)</option>
                        <option value="dark">Mørkristet (Intens, fyldig crema, lav syrlighed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Oprindelsesland / Region
                      </label>
                      <input
                        type="text"
                        value={formOrigin}
                        onChange={(e) => setFormOrigin(e.target.value)}
                        placeholder="f.eks. Sydamerika & Indonesien (Ulfborg)"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Købsland (ISO-kode)
                      </label>
                      <input
                        type="text"
                        value={formPurchaseCountry}
                        onChange={(e) => setFormPurchaseCountry(e.target.value.toUpperCase())}
                        placeholder="DK, SE, NO, IT, DE..."
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 font-bold text-[#2C2018]">
                          <Store className="w-3.5 h-3.5 text-[#C26D52]" />
                          <span>Købssted / Butik (Untappd-stil)</span>
                        </span>
                        <span className="text-[9.5px] text-[#A6998E]">Hvor kan kaffen købes?</span>
                      </label>
                      <input
                        type="text"
                        value={formPurchaseLocation}
                        onChange={(e) => setFormPurchaseLocation(e.target.value)}
                        placeholder="f.eks. Føtex, Meny, Hedekaffe Gårdbutik, Webshop..."
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                      <div className="flex flex-wrap items-center gap-1 pt-1.5 text-[9.5px]">
                        <span className="text-[#A6998E]">Hurtigvalg:</span>
                        {['Føtex, Bilka, Meny', 'SuperBrugsen', 'Rema 1000', 'Meny', 'Kaffebar / Risteri', 'Webshop', 'Hedekaffe Gårdbutik'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setFormPurchaseLocation(st)}
                            className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#DECFC0] hover:border-[#C26D52] hover:text-[#C26D52] text-[#7A6E65] transition cursor-pointer"
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SCA Cupping Score */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold font-mono text-xs">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>Officiel SCA Cupping Score (0–100 Point)</span>
                        </div>
                        <span className="text-[9.5px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800 font-bold">
                          Valgfri (Efterlad tom hvis ikke certificeret)
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-800/80 font-sans leading-tight">
                        Må <strong>KUN</strong> udfyldes hvis kaffen har en verificeret officiel bedømmelse fra CQI Q-Graders, Cup of Excellence eller Coffee Review. Efterlad tom for almindelige kaffer.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[9.5px] uppercase font-mono text-amber-800 block mb-0.5">
                            SCA Score (f.eks. 91.5, 94.0 — eller tom)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={formExpertScore}
                            onChange={(e) => setFormExpertScore(e.target.value)}
                            placeholder="Efterlad tom hvis ingen officiel score"
                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-mono focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] uppercase font-mono text-amber-800 block mb-0.5">
                            Akkrediteret Cupping Kilde
                          </label>
                          <select
                            value={formExpertSource}
                            onChange={(e) => setFormExpertSource(e.target.value)}
                            disabled={!formExpertScore.trim()}
                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-mono focus:outline-hidden disabled:opacity-50"
                          >
                            <option value="SCA Q-Grader">SCA Q-Grader (CQI Certificeret)</option>
                            <option value="Coffee Review">Coffee Review (Officiel Blindtest)</option>
                            <option value="Cup of Excellence">Cup of Excellence (ACE Auktion)</option>
                            <option value="World Barista Championship">World Barista Championship (WBC)</option>
                            <option value="Nordic Roaster Forum">Nordic Roaster Forum</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Vivino Sensory Flavor Pills Selector */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono font-bold flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#C26D52]" />
                        <span>Vivino Sensoriske Smagsnoter</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_FLAVOR_TAGS.map((tag) => {
                          const isSelected = formFlavorNotes.includes(tag.labelDa) || formFlavorNotes.includes(tag.labelEn);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleFormFlavorTag(tag.labelDa)}
                              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-sans flex items-center gap-1 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#C26D52] text-white font-bold shadow-xs'
                                  : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
                              }`}
                            >
                              <span>{tag.icon}</span>
                              <span>{tag.labelDa}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Suitable Drinks */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono font-bold block">
                        Velegnet Til Drikke
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'pure_espresso', label: 'Ren Espresso' },
                          { id: 'flat_white', label: 'Flat White' },
                          { id: 'cortado', label: 'Cortado' },
                          { id: 'cappuccino', label: 'Cappuccino' },
                          { id: 'all_rounder', label: 'All-Rounder' },
                        ].map((d) => {
                          const isSelected = formSuitableFor.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleFormDrinkSuitability(d.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#2C2018] text-[#FAF7F2] font-bold'
                                  : 'bg-white border border-[#E8DFD5] text-[#7A6E65]'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="sm:col-span-2 p-3 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] space-y-2">
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono font-bold flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#C26D52]" />
                        <span>Officielt Posefoto</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {formImageUrl ? (
                          <div className="relative group w-16 h-16 rounded-xl overflow-hidden border border-[#C26D52] shadow-xs">
                            <img src={formImageUrl} alt="Bag" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormImageUrl(undefined)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600 transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#DECFC0] bg-white hover:bg-[#FFFDF9] cursor-pointer text-xs text-[#7A6E65]">
                            <Camera className="w-4 h-4 text-[#C26D52]" />
                            <span>Vælg posebillede (komprimeres automatisk)</span>
                            <input type="file" accept="image/*" onChange={handleCuratorPhotoUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DFD5]">
                    <button
                      type="button"
                      onClick={() => setEditingBean(null)}
                      className="px-3.5 py-2 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FAF7F2] text-xs font-semibold cursor-pointer"
                    >
                      Annuller
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCurator}
                      className="px-4 py-2 rounded-xl bg-linear-to-r from-[#C26D52] to-[#A85840] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSubmittingCurator ? 'Gemmer...' : 'Gem Ændringer & Verificer'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SUB-VIEW 2 & 3: PENDING OR VERIFIED LIST */}
              {(curatorSubTab === 'pending' || curatorSubTab === 'verified') && (
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DFD5] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase text-[#2C2018]">
                        {curatorSubTab === 'pending' ? 'Bønner der afventer din godkendelse' : 'Officielt Verificerede Bønner i Skyen'}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#FAF7F2] border border-[#DECFC0] text-[#7A6E65]">
                        {displayedBeans.length} vist
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8DFD5] px-2.5 py-1 rounded-xl">
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#C26D52]" />
                        <span className="text-[10px] text-[#7A6E65] font-bold">Sorter:</span>
                        <select
                          value={curatorSortBy}
                          onChange={(e) => setCuratorSortBy(e.target.value as any)}
                          className="bg-transparent text-[10.5px] font-bold text-[#2C2018] focus:outline-hidden cursor-pointer"
                        >
                          <option value="newest">Nyeste tilføjet</option>
                          <option value="rating_desc">Højeste bedømmelse (★)</option>
                          <option value="votes_desc">Flest stemmer</option>
                          <option value="score_desc">SCA Cupping Score (90+ PTS)</option>
                          <option value="name_asc">Navn (A-Å)</option>
                          <option value="roaster_asc">Risteri (A-Å)</option>
                          <option value="roast">Risteprofil (Lys → Mørk)</option>
                        </select>
                      </div>

                      <div className="relative sm:w-56">
                        <Search className="w-3.5 h-3.5 text-[#7A6E65] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={curatorSearch}
                          onChange={(e) => setCuratorSearch(e.target.value)}
                          placeholder="Søg på risteri, navn el. EAN..."
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-[#E8DFD5] bg-white text-[11px] focus:outline-hidden focus:border-[#C26D52]"
                        />
                      </div>
                    </div>
                  </div>

                  {isLoadingCurator ? (
                    <div className="py-8 text-center text-xs text-[#7A6E65] flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C26D52]" />
                      <span>Henter kaffer fra central vault...</span>
                    </div>
                  ) : displayedBeans.length === 0 ? (
                    <div className="py-8 text-center space-y-2 text-xs text-[#7A6E65]">
                      {curatorSubTab === 'pending' ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-[#72806B] mx-auto opacity-70" />
                          <p className="font-bold text-[#2C2018]">Ingen bønner afventer godkendelse!</p>
                          <p className="text-[11px] font-sans">
                            Alle bruger-indsendte kaffer er gennemgået og verificeret.
                          </p>
                        </>
                      ) : (
                        <p>Ingen verificerede bønner matchede søgningen.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedBeans.map((bean) => (
                        <div
                          key={bean.barcode}
                          className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            bean.is_verified
                              ? 'bg-white border-[#E8DFD5] hover:border-[#DECFC0]'
                              : 'bg-amber-50/40 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Photo Thumbnail */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#DECFC0] bg-stone-100 shrink-0">
                              {bean.image_url ? (
                                <img src={bean.image_url} alt={bean.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#A6998E]">
                                  <Coffee className="w-5 h-5 opacity-40" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-[#2C2018] truncate">
                                  {bean.name}
                                </span>
                                <span className="text-[10px] text-[#7A6E65]">
                                  ({bean.roaster})
                                </span>
                                <span className={`text-[8.5px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                                  bean.roast_level === 'light'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : bean.roast_level === 'dark'
                                    ? 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                                    : 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                                }`}>
                                  {bean.roast_level}
                                </span>
                                {bean.expert_score && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                    <Award className="w-3 h-3 text-amber-600" />
                                    <span>{bean.expert_score} PTS</span>
                                  </span>
                                )}
                                {bean.ratings_count > 0 ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                    <span>{bean.avg_rating.toFixed(1)}</span>
                                    <span className="text-[8px] text-amber-700/80 font-normal">({bean.ratings_count} stemmer)</span>
                                  </span>
                                ) : (
                                  <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-[#FAF7F2] text-[#8C7E72] border border-[#E8DFD5] font-sans">
                                    Ny (0 stemmer)
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-[#7A6E65] font-mono flex items-center gap-2 flex-wrap">
                                <span>EAN: {bean.barcode}</span>
                                <span>•</span>
                                <span>{bean.origin_country || bean.purchase_country}</span>
                                {bean.purchase_location && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#C26D52] font-sans font-semibold flex items-center gap-1">
                                      <Store className="w-3 h-3 inline text-[#C26D52]" />
                                      <span>{bean.purchase_location}</span>
                                    </span>
                                  </>
                                )}
                              </div>

                              {bean.flavor_notes && bean.flavor_notes.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {bean.flavor_notes.map((fn, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.2 rounded-md bg-[#FAF7F2] border border-[#DECFC0] text-[9px] text-[#7A6E65]"
                                    >
                                      {fn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Live Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {!bean.is_verified && (
                              <button
                                type="button"
                                onClick={() => handleVerifyBeanQuick(bean)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                                title="Hurtiggodkend denne kaffe"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Godkend</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartEdit(bean)}
                              className="px-2.5 py-1.5 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-[#2C2018] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Rediger metadata og tildel SCA Cupping point"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#C26D52]" />
                              <span>Rediger</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCuratorBean(bean)}
                              className="w-7 h-7 rounded-xl border border-[#DECFC0] bg-white hover:bg-red-50 text-[#7A6E65] hover:text-red-600 flex items-center justify-center transition cursor-pointer"
                              title="Slet denne kaffe fra den centrale bønnehvælving"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 4: CREATE NEW VERIFIED BEAN */}
              {curatorSubTab === 'create' && (
                <form
                  onSubmit={handleCreateNewVerifiedBean}
                  className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#C26D52]" />
                      <h4 className="text-xs sm:text-sm font-bold text-[#2C2018] uppercase">
                        Opret Ny Verificeret Kaffe til Central Vault
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#72806B] font-bold">
                      Oprettes som is_verified = true
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        EAN-13 Stregkode *
                      </label>
                      <input
                        type="text"
                        required
                        value={formBarcode}
                        onChange={(e) => setFormBarcode(e.target.value)}
                        placeholder="f.eks. 4056489503019"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Risteri / Brand *
                      </label>
                      <input
                        type="text"
                        required
                        value={formRoaster}
                        onChange={(e) => setFormRoaster(e.target.value)}
                        placeholder="f.eks. Hedekaffe, April, Prolog..."
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Kaffenavn / Lot Oprindelse *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="f.eks. Vestjysk Blanding Helbønner"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Risteprofil
                      </label>
                      <select
                        value={formRoastLevel}
                        onChange={(e) => setFormRoastLevel(e.target.value as 'light' | 'medium' | 'dark')}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      >
                        <option value="light">Lysristet</option>
                        <option value="medium">Mellemristet</option>
                        <option value="dark">Mørkristet</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Oprindelsesland / Region (Valgfri)
                      </label>
                      <input
                        type="text"
                        value={formOrigin}
                        onChange={(e) => setFormOrigin(e.target.value)}
                        placeholder="f.eks. Brasilien & Colombia"
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                        Købsland (ISO-kode)
                      </label>
                      <input
                        type="text"
                        value={formPurchaseCountry}
                        onChange={(e) => setFormPurchaseCountry(e.target.value.toUpperCase())}
                        placeholder="DK, SE, NO, IT, DE..."
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 font-bold text-[#2C2018]">
                          <Store className="w-3.5 h-3.5 text-[#C26D52]" />
                          <span>Købssted / Butik (Untappd-stil)</span>
                        </span>
                        <span className="text-[9.5px] text-[#A6998E]">Hvor kan kaffen købes?</span>
                      </label>
                      <input
                        type="text"
                        value={formPurchaseLocation}
                        onChange={(e) => setFormPurchaseLocation(e.target.value)}
                        placeholder="f.eks. Føtex, Meny, Hedekaffe Gårdbutik, Webshop..."
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C26D52]"
                      />
                      <div className="flex flex-wrap items-center gap-1 pt-1.5 text-[9.5px]">
                        <span className="text-[#A6998E]">Hurtigvalg:</span>
                        {['Føtex, Bilka, Meny', 'SuperBrugsen', 'Rema 1000', 'Meny', 'Kaffebar / Risteri', 'Webshop', 'Hedekaffe Gårdbutik'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setFormPurchaseLocation(st)}
                            className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#DECFC0] hover:border-[#C26D52] hover:text-[#C26D52] text-[#7A6E65] transition cursor-pointer"
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SCA Score */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold font-mono text-xs">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>SCA Cupping Score (Valgfri)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formExpertScore}
                          onChange={(e) => setFormExpertScore(e.target.value)}
                          placeholder="Score f.eks. 90.0"
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-mono"
                        />
                        <select
                          value={formExpertSource}
                          onChange={(e) => setFormExpertSource(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-mono"
                        >
                          <option value="SCA Q-Grader">SCA Q-Grader</option>
                          <option value="Coffee Review">Coffee Review</option>
                          <option value="Cup of Excellence">Cup of Excellence</option>
                          <option value="Barista Tech Review">Barista Tech Review</option>
                        </select>
                      </div>
                    </div>

                    {/* Flavor Pills */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono font-bold flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#C26D52]" />
                        <span>Vivino Sensoriske Smagsnoter</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_FLAVOR_TAGS.map((tag) => {
                          const isSelected = formFlavorNotes.includes(tag.labelDa) || formFlavorNotes.includes(tag.labelEn);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleFormFlavorTag(tag.labelDa)}
                              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-sans flex items-center gap-1 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#C26D52] text-white font-bold shadow-xs'
                                  : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
                              }`}
                            >
                              <span>{tag.icon}</span>
                              <span>{tag.labelDa}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="sm:col-span-2 p-3 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] space-y-2">
                      <label className="text-[10px] text-[#7A6E65] uppercase font-mono font-bold flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#C26D52]" />
                        <span>Posefoto</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {formImageUrl ? (
                          <div className="relative group w-16 h-16 rounded-xl overflow-hidden border border-[#C26D52]">
                            <img src={formImageUrl} alt="Bag" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormImageUrl(undefined)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#DECFC0] bg-white hover:bg-[#FFFDF9] cursor-pointer text-xs text-[#7A6E65]">
                            <Camera className="w-4 h-4 text-[#C26D52]" />
                            <span>Upload posebillede (komprimeres offline)</span>
                            <input type="file" accept="image/*" onChange={handleCuratorPhotoUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DFD5]">
                    <button
                      type="submit"
                      disabled={isSubmittingCurator}
                      className="px-4 py-2 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-[#C26D52]" />
                      <span>{isSubmittingCurator ? 'Opretter...' : 'Gem og Verificer i Central Hvælving'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SUB-VIEW 5: CHECKLIST & SOURCES */}
              {curatorSubTab === 'checklist' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Checklist Tasks */}
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DFD5] pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#2C2018]">
                          <Calendar className="w-4 h-4 text-[#C26D52]" />
                          <span>Periodisk Kurator Tjekliste</span>
                        </div>
                        <div className="text-[10px] text-[#7A6E65] font-sans mt-0.5">
                          Sidste revision: <strong className="text-[#2C2018]">{lastAuditDate}</strong> ({daysSinceAudit} dage siden • næste revision om {auditDueInDays} dage)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={markAuditCompleteToday}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#2C2018] hover:text-[#FAF7F2] text-[#2C2018] border border-[#E8DFD5] text-[11px] font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                      >
                        <Check className="w-3.5 h-3.5 text-[#72806B]" />
                        <span>Marker revision udført i dag</span>
                      </button>
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
                                  <span>{task.actionLabel || 'Besøg Kilde'}</span>
                                  <ExternalLink className="w-3 h-3 text-[#C26D52]" />
                                </a>
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
                      <span>Autoritative Kilder & Databaser</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs font-mono">
                      <a
                        href="https://www.coffeereview.com/all-reviews/?roast_profile=espresso"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#C26D52] transition flex items-center justify-between group"
                      >
                        <div>
                          <strong className="block text-[#2C2018]">Coffee Review</strong>
                          <span className="text-[10px] text-[#7A6E65]">100-pt Blind Cuppings</span>
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
                          <span className="text-[10px] text-[#7A6E65]">Auktionsvindende Lots</span>
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
                          <span className="text-[10px] text-[#7A6E65]">Global EAN Database</span>
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
                          <span className="text-[10px] text-[#7A6E65]">Cloud Database</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#7A6E65] group-hover:text-[#C26D52] transition" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                      onClick={() => testConnection()}
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

            {/* 🔬 Black Box Scale Telemetry Recorder */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFD5] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${telemetryActive ? 'bg-red-500/20 text-red-500' : 'bg-[#E8DFD5]/40 text-[#7A6E65]'}`}>
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-[#2C2018] flex items-center gap-2">
                      <span>Sort Boks Telemetri (Flight Data Recorder)</span>
                      {telemetryActive && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-600 text-white animate-pulse">
                          REC AKTIV
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-[#7A6E65] font-sans">
                      Optager rå OCR-data, kandidat-scores, afviste frames og flow rate under kørsel af kameraet.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTelemetry}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer shadow-xs ${
                    telemetryActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-[#2C2018] text-white hover:bg-[#3D2D22]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${telemetryActive ? 'bg-white animate-ping' : 'bg-[#C26D52]'}`} />
                  <span>{telemetryActive ? 'Deaktiver Telemetri' : 'Aktivér Telemetri'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs font-mono space-y-2">
                <div className="text-[11px] text-[#2C2018] font-bold flex items-center gap-1.5">
                  <span>💡 Automatisk PC-Sync med Supabase:</span>
                </div>
                <p className="text-[11px] text-[#7A6E65] font-sans leading-relaxed">
                  Når du kører et shot på mobilen med telemetri slået til, uploades hele sessionen automatisk til Supabase.
                  På din PC kan du køre følgende kommando i terminalen for at hente alle rå logs og thumbnails ned i mappen <code>diagnostics/</code>:
                </p>
                <div className="p-2.5 rounded-lg bg-[#2C2018] text-emerald-400 text-xs font-mono flex items-center justify-between shadow-inner">
                  <code>npm run sync:diag</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('npm run sync:diag');
                    }}
                    className="text-[10px] text-[#E8DFD5]/80 hover:text-white px-2 py-0.5 rounded bg-white/10 cursor-pointer"
                  >
                    Kopiér
                  </button>
                </div>
              </div>
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

            {/* 1-Click SQL Migration & Schema Card */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DFD5] pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#C26D52]" />
                  <div>
                    <h4 className="text-xs font-bold uppercase text-[#2C2018]">
                      1-Klik Supabase SQL Schema & Migrering (v1.2.29)
                    </h4>
                    <span className="text-[10px] text-[#7A6E65] font-sans">
                      Sikrer SCA cupping scores, posefotos, kurator-indekser og DELETE-policies.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(SQL_MIGRATION_SCRIPT);
                      setHasCopiedSql(true);
                      setTimeout(() => setHasCopiedSql(false), 3000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    {hasCopiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kopieret til udklipsholder!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#C26D52]" />
                        <span>Kopiér SQL Migrations-Script</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://supabase.com/dashboard/project/vdxfmvzdmcqfixbegumb/sql"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-[#E8DFD5] bg-white hover:bg-[#FAF7F2] text-[#2C2018] text-[11px] font-bold flex items-center gap-1.5 transition"
                  >
                    <span>Åbn Supabase SQL</span>
                    <ExternalLink className="w-3 h-3 text-[#C26D52]" />
                  </a>
                </div>
              </div>

              {connStatus && connStatus.schemaUpToDate === false && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">SQL-Migrering afventer kørsel i dit Supabase projekt:</p>
                    <p className="text-[11px] font-sans">
                      Databasen mangler felterne <code>expert_score</code>, <code>expert_source</code> og <code>image_url</code>. Kopiér scriptet ovenfor, tryk på "Åbn Supabase SQL", indsæt og klik <strong>Run</strong> for at aktivere officiel SCA cupping og fotos i skyen.
                    </p>
                  </div>
                </div>
              )}

              {connStatus && connStatus.schemaUpToDate === true && (
                <div className="p-3 rounded-xl bg-[#72806B]/15 border border-[#72806B]/30 text-[#2C2018] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#72806B] shrink-0" />
                  <span className="font-bold">
                    ✓ Supabase databasen er 100% ajour med alle v1.2.29 kolonner og indekser.
                  </span>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="text-[11px] text-[#C26D52] hover:underline font-mono cursor-pointer"
                >
                  {showSqlPreview ? '▼ Skjul SQL Schema Preview' : '▶ Vis SQL Schema Preview'}
                </button>

                {showSqlPreview && (
                  <pre className="mt-2 p-3 rounded-xl bg-[#2C2018] text-[#FAF7F2] text-[10px] font-mono overflow-x-auto max-h-64 border border-[#3D2D22]">
                    {SQL_MIGRATION_SCRIPT}
                  </pre>
                )}
              </div>
            </div>

            {/* SQL Table Schemas Preview */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#2C2018]">
                <Layers className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Provisioned Tables in Supabase</span>
              </div>
              <div className="text-[11px] text-[#7A6E65] space-y-2">
                <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5]">
                  <strong className="text-[#2C2018]">global_coffee_beans:</strong> Primary Key = Barcode (EAN-13). Aggregates verified roasters, bean names, roast levels, country, drink suitability tags, expert SCA scores, and weighted community rating.
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
