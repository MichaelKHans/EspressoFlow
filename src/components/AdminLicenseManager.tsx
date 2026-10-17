import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Sparkles,
  QrCode,
  DollarSign,
  Send,
  AlertCircle,
  Building2,
  Database,
} from 'lucide-react';
import { generateLicenseBatch } from '../lib/licenseEngine';

interface AdminLicenseManagerProps {
  onNotify?: (msg: string) => void;
}

export const AdminLicenseManager: React.FC<AdminLicenseManagerProps> = ({ onNotify }) => {
  // Batch Generator State
  const [batchCount, setBatchCount] = useState<number>(10);
  const [batchTag, setBatchTag] = useState<string>('kickstarter-2026');
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  // Bookkeeping Bridge State
  const [payoutSource, setPayoutSource] = useState<'apple' | 'google' | 'lemonsqueezy' | 'kickstarter' | 'direct_b2b'>('apple');
  const [payoutAmount, setPayoutAmount] = useState<string>('1250');
  const [payoutDate, setPayoutDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [payoutDescription, setPayoutDescription] = useState<string>('Apple App Store udbetaling - Flowbean Pro (Månedlig afregning, B2B EU-salg uden moms)');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [localSyncStatus, setLocalSyncStatus] = useState<string | null>(null);
  const [isSyncingLocal, setIsSyncingLocal] = useState<boolean>(false);

  // Quick preset batch selection
  const handleSelectPreset = (tag: string) => {
    setBatchTag(tag);
    if (tag === 'kickstarter-2026') setBatchCount(50);
    else if (tag === 'expo-cph-2026') setBatchCount(25);
    else if (tag === 'web-gift') setBatchCount(10);
    else if (tag === 'b2b-direct') setBatchCount(5);
    else if (tag === 'vip-barista') setBatchCount(5);
  };

  const handleGenerateBatch = () => {
    const finalTag = batchTag === 'custom' ? (customTagInput.trim() || 'custom-batch') : batchTag;
    const items = generateLicenseBatch(batchCount, finalTag);
    const keys = items.map((item) => item.key);
    setGeneratedKeys(keys);
    setCopiedAll(false);
    if (onNotify) {
      onNotify(`Genererede ${keys.length} nye licenskoder med tag "${finalTag}".`);
    }
  };

  const handleCopyAllKeys = () => {
    if (generatedKeys.length === 0) return;
    const text = generatedKeys.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingleKey = (key: string, idx: number) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyIndex(idx);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const handleDownloadCsv = () => {
    if (generatedKeys.length === 0) return;
    const finalTag = batchTag === 'custom' ? (customTagInput.trim() || 'custom-batch') : batchTag;
    const baseUrl = window.location.origin || 'https://espressoflow.vercel.app';

    const header = 'Index,LicenseKey,BatchTag,MagicRedeemUrl,Status,CreatedAt\n';
    const nowIso = new Date().toISOString();
    const rows = generatedKeys
      .map((k, i) => `${i + 1},"${k}","${finalTag}","${baseUrl}/?redeem=${k}","active","${nowIso}"`)
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowbean_licenses_${finalTag}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Supabase SQL Insert
  const generateSupabaseSql = () => {
    if (generatedKeys.length === 0) return '';
    const finalTag = batchTag === 'custom' ? (customTagInput.trim() || 'custom-batch') : batchTag;
    const values = generatedKeys
      .map((k) => `  ('${k}', '${finalTag}', 'active', NOW())`)
      .join(',\n');
    return `INSERT INTO app_licenses (license_key, batch_tag, status, created_at)\nVALUES\n${values}\nON CONFLICT (license_key) DO NOTHING;`;
  };

  const handleCopySupabaseSql = () => {
    const sql = generateSupabaseSql();
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Payout preset helper
  const handleSelectPayoutSource = (source: 'apple' | 'google' | 'lemonsqueezy' | 'kickstarter' | 'direct_b2b') => {
    setPayoutSource(source);
    if (source === 'apple') {
      setPayoutDescription('Apple App Store udbetaling - Flowbean Pro (Månedlig afregning, B2B EU-salg uden moms)');
    } else if (source === 'google') {
      setPayoutDescription('Google Play Store udbetaling - Flowbean Pro (Månedlig afregning, B2B EU-salg uden moms)');
    } else if (source === 'lemonsqueezy') {
      setPayoutDescription('Lemon Squeezy Webshop udbetaling - Flowbean Pro (Merchant of Record, B2B eksport uden moms)');
    } else if (source === 'kickstarter') {
      setPayoutDescription('Kickstarter Pledges udbetaling - Flowbean Launch Kampagne');
    } else if (source === 'direct_b2b') {
      setPayoutDescription('B2B Salg af Flowbean Lifetime Pro licenser til kaffebar');
    }
  };

  // Generate Bogføring JSON Object matching sales_2026.json schema
  const generateSalesJson = () => {
    const amountNum = parseFloat(payoutAmount) || 0;
    const customerInfo = {
      apple: { name: 'Apple Distribution International Ltd.', contactId: 4 },
      google: { name: 'Google Ireland Limited', contactId: 5 },
      lemonsqueezy: { name: 'Lemon Squeezy LLC', contactId: 6 },
      kickstarter: { name: 'Kickstarter PBC', contactId: 7 },
      direct_b2b: { name: 'Specialty Coffee Bar (B2B)', contactId: null },
    }[payoutSource];

    return {
      date: payoutDate,
      due_date: payoutDate,
      customer: customerInfo.name,
      contact_id: customerInfo.contactId,
      template_id: 'flowbean',
      description: payoutDescription,
      lines: [
        {
          description: payoutDescription,
          qty: 1.0,
          unit: payoutSource === 'direct_b2b' ? 'stk.' : 'mdr.',
          price: amountNum,
          total: amountNum,
        },
      ],
      amount: amountNum,
      vat: 0.0,
      status: 'paid',
      is_paid: true,
      paid_date: payoutDate,
      payment_method: 'bank',
      deposit: 'Firma Lønkonto',
      comments: `Registreret via Flowbean Admin Portal. Modpart: ${customerInfo.name}. Moms: 0% (EU Reverse charge / MoR export).`,
    };
  };

  const handleCopySalesJson = () => {
    const jsonStr = JSON.stringify(generateSalesJson(), null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleSyncToLocalBogfoering = async () => {
    setIsSyncingLocal(true);
    setLocalSyncStatus(null);
    try {
      const payload = generateSalesJson();
      const res = await fetch('http://localhost:8000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server svarede med status ${res.status}`);
      }
      const data = await res.json();
      setLocalSyncStatus(`✓ Bogført direkte i sales_2026.json som faktura #${data.sale?.invoice_number || 'OK'}!`);
      setTimeout(() => setLocalSyncStatus(null), 5000);
    } catch (err: any) {
      setLocalSyncStatus(`Kunne ikke nå http://localhost:8000 (Er cockpit-serveren startet? Ellers benyt 'Kopiér JSON'-knappen): ${err.message}`);
    } finally {
      setIsSyncingLocal(false);
    }
  };

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* Top Security & Protection Card */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#C26D52]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2C2018] uppercase tracking-wide">
                Flowbean Sikkerheds- & Licenscenter
              </h2>
              <p className="text-[11px] text-[#7A6E65]">
                Kryptografisk nøglevalidering, rate-limiting & regnskabsintegration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72806B] animate-pulse" />
              Anti-Brute-Force Aktiv
            </span>
          </div>
        </div>

        {/* Security Facts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#7A6E65] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C26D52]" />
              <span>Nøgle-Kombinatorik</span>
            </div>
            <div className="text-[#2C2018] font-bold text-sm">1.15 Trillioner Koder</div>
            <p className="text-[10px] text-[#7A6E65] leading-relaxed">
              12 base32-tegn (32¹²). Udelukker forvekselige tegn (0/O, 1/I/L). Gætteri er matematisk umuligt.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#7A6E65] flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-[#C26D52]" />
              <span>Rate-Limit & Lockout</span>
            </div>
            <div className="text-[#2C2018] font-bold text-sm">Maks 5 Forsøg / 15 Min</div>
            <p className="text-[10px] text-[#7A6E65] leading-relaxed">
              Låser enheden automatisk i 15 min ved 5 fejl. 350ms kryptografisk tids-jitter forhindrer timing-angreb.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#7A6E65] flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#72806B]" />
              <span>Gensalgs- & Carding-Værn</span>
            </div>
            <div className="text-[#2C2018] font-bold text-sm">Prisloft & Remote Revoke</div>
            <p className="text-[10px] text-[#7A6E65] leading-relaxed">
              Software har uendeligt udbud til 49 kr; gensalg til overpris er umuligt. Web checkout har 5-stk loft.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Batch Generator for Kickstarter, Expo & Web Gifts */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C26D52]" />
            <h3 className="text-xs font-bold uppercase text-[#2C2018]">
              1. Batch Generator: Licenser til Kickstarter, Messe & Gaver
            </h3>
          </div>
          <span className="text-[10px] text-[#7A6E65]">FLOW-XXXX-XXXX-XXXX</span>
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-[#7A6E65]">Vælg Kampagne eller Salgskanal</label>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'kickstarter-2026', label: '🚀 Kickstarter Backers (50 stk)' },
              { id: 'expo-cph-2026', label: '🎟️ Fysiske Messekort (25 stk)' },
              { id: 'web-gift', label: '🎁 Webshop Gavekoder (10 stk)' },
              { id: 'b2b-direct', label: '🏢 Kaffebar B2B (5 stk)' },
              { id: 'vip-barista', label: '☕ VIP Barista / Testere (5 stk)' },
              { id: 'custom', label: '✏️ Brugerdefineret Tag' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs transition ${
                  batchTag === preset.id
                    ? 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018] font-bold shadow-xs'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#7A6E65] border-[#E8DFD5]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Tag input if selected */}
        {batchTag === 'custom' && (
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#7A6E65]">Brugerdefineret Tag</label>
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              placeholder="f.eks. kaffefestival-aarhus-2026"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DFD5] text-[#2C2018] focus:border-[#C26D52] outline-none"
            />
          </div>
        )}

        {/* Count Selector & Generate Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#E8DFD5]">
            <span className="text-[11px] text-[#7A6E65] uppercase font-bold">Antal:</span>
            <input
              type="number"
              min={1}
              max={250}
              value={batchCount}
              onChange={(e) => setBatchCount(Math.min(250, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 text-center font-bold text-xs text-[#2C2018] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateBatch}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2C22] text-[#FAF7F2] text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#C26D52]" />
            <span>Generér {batchCount} Nye Licenskoder</span>
          </button>
        </div>

        {/* Generated Keys Display */}
        {generatedKeys.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFD5]">
              <div className="text-xs font-bold text-[#2C2018]">
                {generatedKeys.length} Licenser Klar ({batchTag})
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllKeys}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E8DFD5] hover:bg-[#FAF7F2] text-[#2C2018] text-[11px] font-bold flex items-center gap-1.5 transition"
                >
                  {copiedAll ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#7A6E65]" />}
                  <span>{copiedAll ? 'Kopieret!' : 'Kopiér Nøgler'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySupabaseSql}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E8DFD5] hover:bg-[#FAF7F2] text-[#2C2018] text-[11px] font-bold flex items-center gap-1.5 transition"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Database className="w-3 h-3 text-[#72806B]" />}
                  <span>{copiedSql ? 'SQL Kopieret!' : 'Kopiér Supabase SQL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 rounded-lg bg-[#C26D52] hover:bg-[#B05B40] text-[#FAF7F2] text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3 h-3" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* List preview (max 10 rows visible with scroll) */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-white border border-[#E8DFD5]">
              {generatedKeys.map((key, idx) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F5EFE6] border border-[#E8DFD5]/60 text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#7A6E65] w-6">{idx + 1}.</span>
                    <span className="font-bold text-[#2C2018] tracking-wider select-all">{key}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-[10px] text-[#7A6E65]">
                      /?redeem={key}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySingleKey(key, idx)}
                      className="p-1 rounded hover:bg-white text-[#7A6E65] hover:text-[#2C2018] transition"
                      title="Kopiér licensnøgle"
                    >
                      {copiedKeyIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Physical Card / QR-code guidance */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] text-[#7A6E65] space-y-1.5">
              <div className="font-bold text-[#2C2018] flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Sådan fungerer fysiske visitkort & messekort:</span>
              </div>
              <p>
                Ved at printe en QR-kode der peger på:{' '}
                <code className="text-[#2C2018] bg-white px-1 py-0.5 rounded border border-[#E8DFD5]">
                  https://espressoflow.vercel.app/?redeem=FLOW-XXXX-XXXX-XXXX
                </code>
                , åbner brugerens telefon web-appen og låser automatisk op på under 1 sekund uden at brugeren skal indtaste koden manuelt.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Bookkeeping Bridge to sales_2026.json */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#C26D52]" />
            <h3 className="text-xs font-bold uppercase text-[#2C2018]">
              2. Regnskabs-Bro: Salg & Udbetalinger til MH Tegnestue Bogføring
            </h3>
          </div>
          <span className="text-[10px] text-[#7A6E65]">C:\Users\mh\OneDrive\MH Tegnestue\Bogføring\sales_2026.json</span>
        </div>

        <p className="text-[11px] text-[#7A6E65] leading-relaxed">
          Når Apple, Google, Lemon Squeezy eller Kickstarter overfører din månedlige udbetaling til din{' '}
          <strong className="text-[#2C2018]">Firma Lønkonto</strong>, skal du blot registrere 1 samlet udbetaling. 
          Apple/Google er Merchants of Record (MoR) og afregner moms worldwide. For dit CVR er det et B2B-salg med{' '}
          <strong className="text-[#2C2018]">0 kr moms (EU Reverse Charge / Rubrik B-ydelser)</strong>.
        </p>

        {/* Channel Selection Buttons */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-[#7A6E65]">Vælg Udbetalingskilde</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
            {[
              { id: 'apple', label: '🍎 Apple App Store', desc: 'Irland (B2B 0% moms)' },
              { id: 'google', label: '🤖 Google Play', desc: 'Irland (B2B 0% moms)' },
              { id: 'lemonsqueezy', label: '🍋 Lemon Squeezy', desc: 'USA MoR (0% moms)' },
              { id: 'kickstarter', label: '🚀 Kickstarter', desc: 'USA Pledges' },
              { id: 'direct_b2b', label: '☕ Kaffebar B2B', desc: 'Danmark Faktura' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPayoutSource(item.id as any)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  payoutSource === item.id
                    ? 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018] font-bold shadow-xs'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#7A6E65] border-[#E8DFD5]'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[9px] opacity-80 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs: Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#7A6E65]">Udbetalt Beløb (DKK)</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DFD5] text-[#2C2018] font-bold focus:border-[#C26D52] outline-none"
              />
              <span className="absolute right-3 top-2 text-xs text-[#7A6E65]">kr.</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#7A6E65]">Bankdato (Firma Lønkonto)</label>
            <input
              type="date"
              value={payoutDate}
              onChange={(e) => setPayoutDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DFD5] text-[#2C2018] focus:border-[#C26D52] outline-none"
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-[10px] uppercase font-bold text-[#7A6E65]">Moms-sats</label>
            <div className="px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-[#2C2018] font-bold">
              0,00 kr (Reverse charge)
            </div>
          </div>
        </div>

        {/* JSON Preview matching sales_2026.json */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold text-[#7A6E65]">
              Genereret Salgspost (Format til sales_2026.json)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySalesJson}
                className="px-3 py-1 rounded-lg bg-white border border-[#E8DFD5] hover:bg-[#FAF7F2] text-[#2C2018] text-[11px] font-bold flex items-center gap-1.5 transition"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#7A6E65]" />}
                <span>{copiedJson ? 'Kopieret til Udklipsholder!' : '📋 Kopiér JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToLocalBogfoering}
                disabled={isSyncingLocal}
                className="px-3 py-1 rounded-lg bg-[#2C2018] hover:bg-[#3D2C22] text-[#FAF7F2] text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
              >
                <Send className="w-3 h-3 text-[#C26D52]" />
                <span>{isSyncingLocal ? 'Sender...' : '🚀 Direkte Bogføring'}</span>
              </button>
            </div>
          </div>

          <pre className="p-3.5 rounded-xl bg-[#2C2018] text-[#FAF7F2] text-[11px] overflow-x-auto leading-relaxed border border-[#3D2C22]">
            {JSON.stringify(generateSalesJson(), null, 2)}
          </pre>

          {localSyncStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                localSyncStatus.startsWith('✓')
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localSyncStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLicenseManager;
