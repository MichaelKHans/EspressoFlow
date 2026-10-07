import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Globe,
  Award,
  Star,
  Check,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { CoffeeBeanProfile, RoastLevel, RatioStyle } from '../types/espresso';
import { fetchAllGlobalBeans, type GlobalCoffeeBean } from '../lib/supabase';
import { useTranslation } from '../i18n';

interface CentralBeanVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBeanToVault: (bean: CoffeeBeanProfile) => void;
  currentVaultBeans: CoffeeBeanProfile[];
  currentGrinderName: string;
}

export const CentralBeanVaultModal: React.FC<CentralBeanVaultModalProps> = ({
  isOpen,
  onClose,
  onAddBeanToVault,
  currentVaultBeans,
  currentGrinderName,
}) => {
  const { t } = useTranslation();
  const [beans, setBeans] = useState<GlobalCoffeeBean[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoast, setSelectedRoast] = useState<string>('all');
  const [selectedDrink, setSelectedDrink] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [onlyExpertRated, setOnlyExpertRated] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      setIsLoading(true);
      fetchAllGlobalBeans()
        .then((data) => {
          if (isMounted) {
            setBeans(data);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  // Distinct countries available
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    beans.forEach((b) => {
      if (b.purchase_country) set.add(b.purchase_country);
    });
    return Array.from(set);
  }, [beans]);

  // Filtered beans list
  const filteredBeans = useMemo(() => {
    return beans.filter((bean) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = bean.name.toLowerCase().includes(q);
        const matchesRoaster = bean.roaster.toLowerCase().includes(q);
        const matchesOrigin = bean.origin_country?.toLowerCase().includes(q);
        const matchesNotes = bean.flavor_notes?.some((n) => n.toLowerCase().includes(q));
        if (!matchesName && !matchesRoaster && !matchesOrigin && !matchesNotes) {
          return false;
        }
      }

      // 2. Roast level filter
      if (selectedRoast !== 'all' && bean.roast_level !== selectedRoast) {
        return false;
      }

      // 3. Drink suitability filter
      if (selectedDrink !== 'all') {
        if (!bean.suitable_for || !bean.suitable_for.includes(selectedDrink)) {
          return false;
        }
      }

      // 4. Country filter
      if (selectedCountry !== 'all' && bean.purchase_country !== selectedCountry) {
        return false;
      }

      // 5. Expert score filter
      if (onlyExpertRated && (!bean.expert_score || bean.expert_score < 90)) {
        return false;
      }

      return true;
    });
  }, [beans, searchQuery, selectedRoast, selectedDrink, selectedCountry, onlyExpertRated]);

  if (!isOpen) return null;

  const handleAdd = (globalBean: GlobalCoffeeBean) => {
    const defaultRatio: RatioStyle =
      globalBean.roast_level === 'light'
        ? 'lungo'
        : globalBean.roast_level === 'dark'
        ? 'ristretto'
        : 'standard';
    const mult = defaultRatio === 'lungo' ? 2.5 : defaultRatio === 'ristretto' ? 1.5 : 2.0;

    const newBean: CoffeeBeanProfile = {
      id: `bean-cloud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: globalBean.name,
      roaster: globalBean.roaster,
      roastDate: new Date().toISOString().split('T')[0],
      roastLevel: globalBean.roast_level as RoastLevel,
      doseGrams: 18.0,
      ratioStyle: defaultRatio,
      targetYieldGrams: Math.round(18.0 * mult * 10) / 10,
      grindSetting: '14.0',
      grinderName: currentGrinderName || 'Baratza Encore ESP Pro',
      rating: globalBean.avg_rating ? Math.round(globalBean.avg_rating) : undefined,
      notes: globalBean.flavor_notes?.join(' • '),
      purchaseCountry: globalBean.purchase_country,
      purchaseLocation: globalBean.purchase_location,
      expertScore: globalBean.expert_score,
      expertSource: globalBean.expert_source,
      imageUrl: globalBean.image_url,
      flavorNotes: globalBean.flavor_notes,
      originCountry: globalBean.origin_country,
    };

    onAddBeanToVault(newBean);
    setToastMessage(`✓ ${globalBean.name} added to your vault!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const isAlreadyInVault = (name: string, roaster: string) => {
    return currentVaultBeans.some(
      (b) =>
        b.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        (!b.roaster || b.roaster.toLowerCase().trim() === roaster.toLowerCase().trim())
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fadeIn overflow-hidden"
      style={{
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[calc(100dvh-3rem)] bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#DECFC0] shadow-2xl flex flex-col overflow-hidden font-sans animate-modal-pop-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] flex items-center justify-between shrink-0 bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C26D52]/15 text-[#C26D52] flex items-center justify-center border border-[#C26D52]/25">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#2C2018] tracking-tight">
                  {t('vault.modal_title')}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#72806B]/15 text-[#72806B] font-bold border border-[#72806B]/30">
                  {beans.length} Verified Beans
                </span>
              </div>
              <p className="text-[11px] text-[#7A6E65] mt-0.5">
                {t('vault.modal_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#E8DFD5]/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert when a bean is added */}
        {toastMessage && (
          <div className="px-4 py-2 bg-[#72806B] text-white text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-[#E8DFD5] space-y-3 shrink-0 bg-white">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6E65]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('vault.search_placeholder')}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-xs text-[#2C2018] focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E65] hover:text-[#2C2018]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
            {/* Roast Level filter */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-[#7A6E65] uppercase font-sans mr-0.5">Roast:</span>
              {(['all', 'light', 'medium', 'dark'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRoast(r)}
                  className={`px-2 py-0.5 rounded-lg border capitalize transition ${
                    selectedRoast === r
                      ? 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018] font-bold'
                      : 'bg-[#FAF7F2] text-[#7A6E65] border-[#E8DFD5] hover:border-[#C26D52]/40'
                  }`}
                >
                  {r === 'all' ? t('vault.filter_all_roasts') : r}
                </button>
              ))}
            </div>

            {/* Drink suitability filter */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-[10px] text-[#7A6E65] uppercase font-sans mr-0.5">Drink:</span>
              <select
                value={selectedDrink}
                onChange={(e) => setSelectedDrink(e.target.value)}
                className="px-2 py-0.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-[11px] font-mono text-[#2C2018]"
              >
                <option value="all">{t('vault.filter_all_drinks')}</option>
                <option value="flat_white">Flat White</option>
                <option value="pure_espresso">Pure Espresso</option>
                <option value="cortado">Cortado</option>
                <option value="cappuccino">Cappuccino</option>
              </select>
            </div>

            {/* Country filter */}
            {availableCountries.length > 1 && (
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span className="text-[10px] text-[#7A6E65] uppercase font-sans mr-0.5">Country:</span>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-2 py-0.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-[11px] font-mono text-[#2C2018]"
                >
                  <option value="all">All Countries</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c === 'DK' ? '🇩🇰 Denmark' : c === 'IT' ? '🇮🇹 Italy' : c === 'NO' ? '🇳🇴 Norway' : c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Expert Score Filter Toggle */}
            <button
              onClick={() => setOnlyExpertRated(!onlyExpertRated)}
              className={`px-2 py-0.5 rounded-lg border shrink-0 transition flex items-center gap-1 ml-auto ${
                onlyExpertRated
                  ? 'bg-[#C26D52] text-white border-[#C26D52] font-bold'
                  : 'bg-[#FAF7F2] text-[#7A6E65] border-[#E8DFD5] hover:border-[#C26D52]/40'
              }`}
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>{t('vault.expert_rated_only')}</span>
            </button>
          </div>
        </div>

        {/* Bean Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAF7F2]">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A6E65] font-mono animate-pulse">
              Connecting to Central Bean Vault...
            </div>
          ) : filteredBeans.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#7A6E65]">
              No coffee beans matched your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredBeans.map((bean) => {
                const inVault = isAlreadyInVault(bean.name, bean.roaster);

                return (
                  <div
                    key={bean.barcode || bean.name}
                    className="p-3.5 rounded-xl border border-[#E8DFD5] bg-white hover:border-[#C26D52]/50 transition shadow-2xs flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              bean.roast_level === 'light'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : bean.roast_level === 'medium'
                                ? 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
                                : 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018]'
                            }`}
                          >
                            {bean.roast_level}
                          </span>
                          {bean.purchase_country && (
                            <span className="text-[9px] font-mono text-[#7A6E65] bg-[#FAF7F2] border border-[#E8DFD5] px-1.5 py-0.5 rounded">
                              {bean.purchase_country === 'DK' ? '🇩🇰 DK' : bean.purchase_country === 'IT' ? '🇮🇹 IT' : bean.purchase_country}
                            </span>
                          )}
                          {bean.purchase_location && (
                            <span
                              className="text-[9px] font-sans text-[#7A6E65] bg-[#FAF7F2] border border-[#E8DFD5] px-1.5 py-0.5 rounded truncate max-w-[130px]"
                              title={`Købt i: ${bean.purchase_location}`}
                            >
                              🏪 {bean.purchase_location}
                            </span>
                          )}
                        </div>

                        {bean.expert_score && (
                          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                            <Award className="w-3 h-3 text-amber-700" />
                            <span>{bean.expert_score} PTS</span>
                          </span>
                        )}
                      </div>

                      {/* Bean Name & Roaster */}
                      <div>
                        <h3 className="text-xs font-bold text-[#2C2018] leading-snug">
                          {bean.name}
                        </h3>
                        <div className="text-[10px] text-[#7A6E65] font-semibold mt-0.5">
                          {bean.roaster}
                          {bean.origin_country && (
                            <span className="text-[#A6998E] font-normal">
                              {' '}• {bean.origin_country}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Flavor Notes */}
                      {bean.flavor_notes && bean.flavor_notes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {bean.flavor_notes.map((note, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8DFD5] text-[#7A6E65]"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer: Rating, Suitable drinks & Action Button */}
                    <div className="mt-3 pt-2.5 border-t border-[#E8DFD5] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px]">
                        {bean.ratings_count > 0 ? (
                          <span className="flex items-center gap-1 text-amber-600 font-bold font-mono">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{bean.avg_rating.toFixed(1)}</span>
                            <span className="text-[8.5px] text-[#A6998E] font-normal">({bean.ratings_count})</span>
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FAF7F2] text-[#8C7E72] border border-[#E8DFD5] font-sans">
                            Ny (0 stemmer)
                          </span>
                        )}
                        {bean.suitable_for && bean.suitable_for.length > 0 && (
                          <span className="text-[9px] text-[#72806B] font-mono truncate max-w-[110px]">
                            {bean.suitable_for.map((s) => s.replace('_', ' ')).join(', ')}
                          </span>
                        )}
                      </div>

                      {inVault ? (
                        <span className="text-[10px] font-bold text-[#72806B] px-2.5 py-1 rounded-lg bg-[#72806B]/15 border border-[#72806B]/30 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>{t('vault.in_vault')}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(bean)}
                          className="text-[10px] font-bold text-[#C26D52] hover:text-white px-2.5 py-1 rounded-lg border border-[#C26D52] bg-[#C26D52]/10 hover:bg-[#C26D52] transition flex items-center gap-1 shrink-0 shadow-2xs active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{t('vault.add_to_vault')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Info */}
        <div className="p-3 bg-[#FFFDF9] border-t border-[#E8DFD5] flex items-center justify-between text-[11px] text-[#7A6E65] shrink-0 font-mono">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C26D52]" />
            <span>Community Verified • Auto-Calibrates Recipe & Ratio Targets</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
