import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Store,
  Plus,
  Flame,
  Award,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import type { CoffeeBeanProfile, PriceTier } from '../types/espresso';
import {
  PRICE_TIERS,
} from '../lib/coffeeCatalogData';
import { POPULAR_FLAVOR_TAGS } from '../lib/beanCatalogMatcher';
import {
  calculateCoffeeMatches,
  type MatchmakerPreferences,
  type PreferredDrink,
  type AcidityTolerance,
  type CoffeeMatchResult,
} from '../lib/beanMatchmakerEngine';

interface BeanMatchmakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBeanToShelf: (bean: Omit<CoffeeBeanProfile, 'id'>) => void;
  activeGrinderName?: string;
}

export const BeanMatchmakerModal: React.FC<BeanMatchmakerModalProps> = ({
  isOpen,
  onClose,
  onAddBeanToShelf,
  activeGrinderName = 'Baratza Encore ESP',
}) => {
  const { t, language } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User preferences state
  const [preferredDrink, setPreferredDrink] = useState<PreferredDrink>('milk_drink');
  const [selectedFlavorTags, setSelectedFlavorTags] = useState<string[]>([
    'dark_chocolate',
    'caramel',
  ]);
  const [acidity, setAcidity] = useState<AcidityTolerance>('balanced');
  const [priceTier, setPriceTier] = useState<'all' | PriceTier>('all');
  const [addedBeans, setAddedBeans] = useState<Set<string>>(new Set());

  // Preferences object
  const preferences: MatchmakerPreferences = useMemo(
    () => ({
      preferredDrink,
      flavorTags: selectedFlavorTags,
      acidity,
      priceTier,
    }),
    [preferredDrink, selectedFlavorTags, acidity, priceTier]
  );

  // Calculated Top Matches
  const matches = useMemo(() => {
    return calculateCoffeeMatches(preferences, undefined, 4);
  }, [preferences]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const toggleFlavorTag = (tagId: string) => {
    setSelectedFlavorTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), tagId];
      }
      return [...prev, tagId];
    });
  };

  const handleAddMatchToShelf = (match: CoffeeMatchResult) => {
    const item = match.item;
    onAddBeanToShelf({
      name: item.name,
      roaster: item.roaster,
      roastLevel: item.roastLevel,
      roastDate: new Date().toISOString().split('T')[0],
      doseGrams: 18,
      targetYieldGrams: item.roastLevel === 'light' ? 42 : item.roastLevel === 'dark' ? 30 : 36,
      ratioStyle: item.roastLevel === 'light' ? 'lungo' : item.roastLevel === 'dark' ? 'ristretto' : 'standard',
      grindSetting: '13',
      grinderName: activeGrinderName,
      notes: item.notes,
      suitableFor: item.suitableFor,
      barcode: item.barcode,
      species: item.species,
      varietal: item.varietal,
      originCountry: item.originCountry,
      purchaseLocation: item.purchaseLocation,
      purchaseCountry: item.purchaseCountry,
      flavorNotes: item.flavorNotes,
      expertScore: item.scaScore,
      expertSource: item.scaScore ? 'SCA Specialty Lot' : undefined,
      priceTier: item.priceTier || match.resolvedPriceTier,
      approxPriceDkk: item.approxPriceDkk,
      imageUrl: item.imageUrl,
    });

    setAddedBeans((prev) => new Set(prev).add(item.name));
  };

  const handleReset = () => {
    setStep(1);
    setPreferredDrink('milk_drink');
    setSelectedFlavorTags(['dark_chocolate', 'caramel']);
    setAcidity('balanced');
    setPriceTier('all');
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[85] flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF7F2] border border-[#DECFC0] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-modal-pop-in max-h-[92dvh]"
      >
        {/* Header */}
        <div className="p-4 bg-[#FFFDF9] border-b border-[#E8DFD5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#C26D52] to-[#A85840] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#2C2018] tracking-tight">
                  {t('matchmaker.title')}
                </h2>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#C26D52]/15 text-[#C26D52] border border-[#C26D52]/30">
                  {t('matchmaker.badge')}
                </span>
              </div>
              <p className="text-[11px] text-[#7A6E65] font-sans truncate max-w-[280px]">
                {t('matchmaker.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#7A6E65] flex items-center justify-center transition cursor-pointer"
            title={t('matchmaker.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-5 py-2.5 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-[#C26D52] text-white' : 'bg-[#E8DFD5] text-[#7A6E65]'
              }`}
            >
              1
            </span>
            <span className={step === 1 ? 'font-bold text-[#2C2018]' : 'text-[#7A6E65]'}>Drik</span>
          </div>
          <span className="text-[#A6998E]">→</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-[#C26D52] text-white' : 'bg-[#E8DFD5] text-[#7A6E65]'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'font-bold text-[#2C2018]' : 'text-[#7A6E65]'}>Smag</span>
          </div>
          <span className="text-[#A6998E]">→</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-[#C26D52] text-white' : 'bg-[#E8DFD5] text-[#7A6E65]'
              }`}
            >
              3
            </span>
            <span className={step === 3 ? 'font-bold text-[#2C2018]' : 'text-[#7A6E65]'}>Budget</span>
          </div>
          <span className="text-[#A6998E]">→</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 4 ? 'bg-[#72806B] text-white' : 'bg-[#E8DFD5] text-[#7A6E65]'
              }`}
            >
              ✓
            </span>
            <span className={step === 4 ? 'font-bold text-[#72806B]' : 'text-[#7A6E65]'}>Match</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 pb-8 overscroll-contain">
          {/* ============================================================== */}
          {/* STEP 1: DRINK & BREW METHOD */}
          {/* ============================================================== */}
          {step === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
                  {t('matchmaker.step1_title')}
                </h3>
                <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
                  {t('matchmaker.step1_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'milk_drink' as PreferredDrink,
                    icon: '🥛',
                    title: t('matchmaker.drink_milk'),
                    desc: t('matchmaker.drink_milk_desc'),
                  },
                  {
                    id: 'pure_espresso' as PreferredDrink,
                    icon: '☕',
                    title: t('matchmaker.drink_espresso'),
                    desc: t('matchmaker.drink_espresso_desc'),
                  },
                  {
                    id: 'filter_pour_over' as PreferredDrink,
                    icon: '💧',
                    title: t('matchmaker.drink_filter'),
                    desc: t('matchmaker.drink_filter_desc'),
                  },
                  {
                    id: 'all_rounder' as PreferredDrink,
                    icon: '🌟',
                    title: t('matchmaker.drink_all'),
                    desc: t('matchmaker.drink_all_desc'),
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreferredDrink(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      preferredDrink === opt.id
                        ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20 shadow-xs'
                        : 'border-[#E8DFD5] bg-white hover:border-[#DECFC0]'
                    }`}
                  >
                    <span className="text-xl p-1 bg-[#FAF7F2] rounded-xl border border-[#DECFC0]">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[#2C2018]">{opt.title}</h4>
                        {preferredDrink === opt.id && (
                          <div className="w-4 h-4 rounded-full bg-[#C26D52] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10.5px] text-[#7A6E65] font-sans mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: SENSORY FLAVOR PALATE */}
          {/* ============================================================== */}
          {step === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
                  {t('matchmaker.step2_title')}
                </h3>
                <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
                  {t('matchmaker.step2_desc')} ({t('matchmaker.selected_count', { count: selectedFlavorTags.length })})
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {POPULAR_FLAVOR_TAGS.map((tag) => {
                  const isSelected = selectedFlavorTags.includes(tag.id);
                  const label = language === 'da' ? tag.labelDa : tag.labelEn;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleFlavorTag(tag.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-sans font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs scale-102 ring-1 ring-[#C26D52]'
                          : 'bg-white border border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FFFDF9]'
                      }`}
                    >
                      <span>{tag.icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: ACIDITY & BUDGET */}
          {/* ============================================================== */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
                  {t('matchmaker.step3_title')}
                </h3>
                <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
                  {t('matchmaker.step3_desc')}
                </p>
              </div>

              {/* Acidity Tolerance */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#7A6E65] uppercase font-mono block">
                  Frugtsyre & Friskhed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'low' as AcidityTolerance, label: t('matchmaker.acidity_low'), icon: '🍫' },
                    { id: 'balanced' as AcidityTolerance, label: t('matchmaker.acidity_med'), icon: '⚖️' },
                    { id: 'high' as AcidityTolerance, label: t('matchmaker.acidity_high'), icon: '🍋' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAcidity(a.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        acidity === a.id
                          ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20 font-bold text-[#2C2018]'
                          : 'border-[#E8DFD5] bg-white text-[#7A6E65]'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">{a.icon}</span>
                      <span className="text-[10px] font-sans block leading-tight">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Tier Filter */}
              <div className="space-y-2 pt-2 border-t border-[#E8DFD5]">
                <label className="text-[10px] font-bold text-[#7A6E65] uppercase font-mono block">
                  {t('beandex.filter_price_tier')} (Budget)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceTier('all')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      priceTier === 'all'
                        ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20 font-bold'
                        : 'border-[#E8DFD5] bg-white text-[#7A6E65]'
                    }`}
                  >
                    <span className="text-xs block font-mono font-bold text-[#2C2018]">{t('matchmaker.tier_all_label')}</span>
                    <span className="text-[10px] text-[#A6998E] font-sans block mt-0.5">{t('matchmaker.tier_all_desc')}</span>
                  </button>

                  {(['budget', 'standard', 'premium', 'ultra_rare'] as PriceTier[]).map((tierKey) => {
                    const meta = PRICE_TIERS[tierKey];
                    return (
                      <button
                        key={tierKey}
                        type="button"
                        onClick={() => setPriceTier(tierKey)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          priceTier === tierKey
                            ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20 font-bold'
                            : 'border-[#E8DFD5] bg-white text-[#7A6E65]'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#2C2018]">
                          <span>{meta.icon}</span>
                          <span>{meta.symbol}</span>
                        </div>
                        <span className="text-[10px] text-[#7A6E65] font-sans block mt-0.5 truncate">
                          {language === 'da' ? meta.labelDa : meta.labelEn}
                        </span>
                        <span className="text-[9px] text-[#A6998E] font-mono block">
                          {meta.rangeDkk}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: RESULTS VIEW */}
          {/* ============================================================== */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
                  {t('matchmaker.results_title')}
                </h3>
                <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
                  {t('matchmaker.results_subtitle')}
                </p>
              </div>

              <div className="space-y-3">
                {matches.map((m, index) => {
                  const item = m.item;
                  const tierMeta = PRICE_TIERS[m.resolvedPriceTier];
                  const isAdded = addedBeans.has(item.name);

                  return (
                    <div
                      key={item.name}
                      className="p-4 rounded-2xl border border-[#DECFC0] bg-white shadow-xs space-y-3 relative overflow-hidden"
                    >
                      {/* Top Rank Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#2C2018] text-white">
                            #{index + 1}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#C26D52]/15 text-[#C26D52] border border-[#C26D52]/30 flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-[#C26D52]" />
                            <span>{m.matchScore}% Match</span>
                          </span>
                          <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border ${tierMeta.badgeClass}`}>
                            {tierMeta.icon} {tierMeta.symbol} {item.approxPriceDkk ? `(~${item.approxPriceDkk} DKK)` : ''}
                          </span>
                          {item.scaScore && (
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5 text-amber-700" />
                              <span>{item.scaScore} PTS</span>
                            </span>
                          )}
                        </div>

                        {item.roastLevel && (
                          <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#7A6E65] border border-[#E8DFD5]">
                            {item.roastLevel}
                          </span>
                        )}
                      </div>

                      {/* Bean Name & Roaster */}
                      <div>
                        <h4 className="font-bold text-sm text-[#2C2018] leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
                          <strong className="text-[#2C2018]">{item.roaster}</strong>
                          {item.originCountry && ` • ${item.originCountry}`}
                          {item.varietal && <span className="text-[#A6998E]"> • ✨ {item.varietal}</span>}
                        </p>
                      </div>

                      {/* Barista Rationale Box */}
                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] text-[#2C2018] font-sans leading-relaxed">
                        <strong className="text-[#C26D52] block font-mono text-[9.5px] uppercase mb-0.5">
                          {t('matchmaker.why_match')}
                        </strong>
                        {language === 'da' ? m.rationaleDa : m.rationaleEn}
                      </div>

                      {/* Flavor Note Pills */}
                      <div className="flex flex-wrap gap-1">
                        {item.flavorNotes.map((note) => (
                          <span
                            key={note}
                            className="text-[9.5px] px-2 py-0.5 rounded-md bg-[#FFFDF9] border border-[#E8DFD5] text-[#7A6E65]"
                          >
                            {note}
                          </span>
                        ))}
                      </div>

                      {/* Store / Purchase Venue info */}
                      {item.purchaseLocation && (
                        <div className="text-[10.5px] text-[#7A6E65] font-sans flex items-center gap-1 pt-1">
                          <Store className="w-3 h-3 text-[#C26D52] shrink-0" />
                          <span className="truncate">{t('beandex.available_at', { location: item.purchaseLocation })}</span>
                        </div>
                      )}

                      {/* Action Button: Add to My Shelf */}
                      <div className="pt-2 border-t border-[#E8DFD5] flex items-center justify-between gap-2">
                        {isAdded ? (
                          <span className="text-[11px] font-bold text-[#72806B] flex items-center gap-1 font-mono">
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('matchmaker.added_success')}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddMatchToShelf(m)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#C26D52]" />
                            <span>{t('matchmaker.add_to_shelf')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        <div className="p-3.5 sm:p-4 bg-[#FFFDF9] border-t border-[#E8DFD5] flex items-center justify-between gap-2 shrink-0">
          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-3 py-1.5 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-xs text-[#7A6E65] font-mono font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t('matchmaker.btn_back')}</span>
            </button>
          )}

          {step === 4 ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-xs text-[#7A6E65] font-mono font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3 text-[#C26D52]" />
              <span>{t('matchmaker.retake_quiz')}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="px-4 py-2 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow-xs active:scale-95"
            >
              <span>{t('matchmaker.btn_next')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : step === 3 ? (
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-[#C26D52] to-[#A85840] hover:brightness-110 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('matchmaker.btn_find_matches')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-white text-xs font-mono font-bold cursor-pointer transition"
            >
              <span>{t('matchmaker.close')}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
