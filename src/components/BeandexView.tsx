import React, { useState, useEffect, useMemo } from 'react';
import {
  Coffee,
  Star,
  Barcode,
  Plus,
  Sliders,
  Check,
  Trash2,
  Globe,
  Award,
  Search,
  Calendar,
  ArrowRight,
  Info,
  PackageOpen,
  Edit3,
  Save,
} from 'lucide-react';
import type { CoffeeBeanProfile, GrinderProfile, RoastLevel } from '../types/espresso';
import { fetchAllGlobalBeans, type GlobalCoffeeBean } from '../lib/supabase';
import { resolveGrinder } from '../lib/storage';
import { calculateBeanFreshness } from '../lib/espressoMath';
import { FreshnessInfoModal } from './FreshnessInfoModal';
import { useTranslation } from '../i18n';

export interface BeandexViewProps {
  beans: CoffeeBeanProfile[];
  activeBeanId: string;
  onSelectBean: (id: string) => void;
  onUpdateBean: (id: string, updates: Partial<CoffeeBeanProfile>) => void;
  onDeleteBean: (id: string) => void;
  onCreateBean: (bean: Omit<CoffeeBeanProfile, 'id'>) => void;
  onOpenScanner: () => void;
  onOpenCentralVault: () => void;
  onOpenDialInForBean: (beanId: string) => void;
  onSwitchToFlow: () => void;
  grinders: GrinderProfile[];
  activeGrinderName: string;
}

export const BeandexView: React.FC<BeandexViewProps> = ({
  beans,
  activeBeanId,
  onSelectBean,
  onUpdateBean,
  onDeleteBean,
  onCreateBean,
  onOpenScanner,
  onOpenCentralVault,
  onOpenDialInForBean,
  onSwitchToFlow,
  grinders,
  activeGrinderName,
}) => {
  const { t } = useTranslation();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roastFilter, setRoastFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  // Inline custom bag form state
  const [isAddingCustomBag, setIsAddingCustomBag] = useState<boolean>(false);
  const [newBagName, setNewBagName] = useState<string>('');
  const [newBagRoaster, setNewBagRoaster] = useState<string>('');
  const [newBagRoastLevel, setNewBagRoastLevel] = useState<RoastLevel>('medium');
  const [newBagRoastDate, setNewBagRoastDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newBagDateOpened, setNewBagDateOpened] = useState<string>('');
  const [newBagNotes, setNewBagNotes] = useState<string>('');
  const [newBagGrinderName, setNewBagGrinderName] = useState<string>(activeGrinderName);

  // Freshness & Degas Info Modal state
  const [isFreshnessInfoOpen, setIsFreshnessInfoOpen] = useState<boolean>(false);
  const [selectedFreshnessRoast, setSelectedFreshnessRoast] = useState<RoastLevel>('medium');

  // Inline notes editor state
  const [editingNotesBeanId, setEditingNotesBeanId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Global cloud beans state
  const [globalBeans, setGlobalBeans] = useState<GlobalCoffeeBean[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  // Fetch global beans for index showcase
  useEffect(() => {
    let isMounted = true;
    setIsLoadingGlobal(true);
    fetchAllGlobalBeans()
      .then((data) => {
        if (isMounted) {
          setGlobalBeans(data);
          setIsLoadingGlobal(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingGlobal(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered personal bags
  const filteredBags = useMemo(() => {
    return beans.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesRoaster = b.roaster?.toLowerCase().includes(q) || false;
        const matchesNotes = b.notes?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesRoaster && !matchesNotes) return false;
      }

      if (roastFilter !== 'all' && b.roastLevel !== roastFilter) {
        return false;
      }

      if (favoritesOnly && (b.rating || 0) < 4 && !b.isFavorite) {
        return false;
      }

      return true;
    });
  }, [beans, searchQuery, roastFilter, favoritesOnly]);

  // Filtered global beans
  const filteredGlobalBeans = useMemo(() => {
    return globalBeans.filter((gb) => {
      const q = globalSearch.toLowerCase().trim();
      if (!q) return true;
      const matchesName = gb.name.toLowerCase().includes(q);
      const matchesRoaster = gb.roaster.toLowerCase().includes(q);
      const matchesNotes = gb.flavor_notes.some((n) => n.toLowerCase().includes(q));
      return matchesName || matchesRoaster || matchesNotes;
    });
  }, [globalBeans, globalSearch]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBagName.trim()) return;

    onCreateBean({
      name: newBagName.trim(),
      roaster: newBagRoaster.trim() || undefined,
      roastLevel: newBagRoastLevel,
      roastDate: newBagRoastDate,
      dateOpened: newBagDateOpened ? newBagDateOpened : undefined,
      doseGrams: 18,
      targetYieldGrams: 36,
      ratioStyle: 'standard',
      grindSetting: '15',
      grinderName: newBagGrinderName || activeGrinderName,
      notes: newBagNotes.trim() || undefined,
      rating: 0,
      isFavorite: false,
    });

    setNewBagName('');
    setNewBagRoaster('');
    setNewBagRoastLevel('medium');
    setNewBagRoastDate(new Date().toISOString().split('T')[0]);
    setNewBagDateOpened('');
    setNewBagNotes('');
    setIsAddingCustomBag(false);
  };

  const handleRateBean = (beanId: string, star: number) => {
    const currentBean = beans.find((b) => b.id === beanId);
    if (!currentBean) return;
    const newRating = currentBean.rating === star ? 0 : star;
    onUpdateBean(beanId, {
      rating: newRating,
      isFavorite: newRating >= 4,
    });
  };

  const handleAddGlobalBeanToVault = (gb: GlobalCoffeeBean) => {
    const roast = gb.roast_level === 'dark' ? 'dark' : gb.roast_level === 'light' ? 'light' : 'medium';
    onCreateBean({
      name: gb.name,
      roaster: gb.roaster,
      roastLevel: roast,
      roastDate: new Date().toISOString().split('T')[0],
      doseGrams: 18,
      targetYieldGrams: 36,
      ratioStyle: 'standard',
      grindSetting: '15',
      grinderName: activeGrinderName,
      barcode: gb.barcode,
      notes: gb.flavor_notes.join(', '),
      rating: Math.round(gb.avg_rating),
      isFavorite: gb.avg_rating >= 4.5,
      suitableFor: gb.suitable_for,
      expertScore: gb.expert_score,
      expertSource: gb.expert_source,
    });

    setAddedFeedback(gb.name);
    setTimeout(() => setAddedFeedback(null), 3500);
  };

  return (
    <div className="space-y-6 font-mono text-xs animate-fadeIn">
      {/* 1. Beandex Hero Banner with Rich Visual Contrast Spring */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1E1510] via-[#2A1D15] to-[#140D09] text-[#FAF7F2] p-5 sm:p-6 border border-[#3D2D22] shadow-xl">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#C26D52]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 bottom-0 w-28 h-28 bg-[#D4A373]/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C26D52] flex items-center justify-center text-white shadow-md">
                <Coffee className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-white">
                {t('beandex.title')}
              </h2>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#C26D52]/20 border border-[#C26D52]/50 text-[#E89E88] tracking-widest uppercase">
                Vault & Index
              </span>
            </div>
            <p className="text-[11px] text-[#C2B5A8] font-sans max-w-xl leading-relaxed">
              {t('beandex.subtitle')} — Rate your bags, scan fresh lots, and explore verified SCA cupping scores without leaving your home barista station.
            </p>
          </div>

          {/* Action Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-xl bg-linear-to-r from-[#C26D52] to-[#A85840] hover:brightness-110 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>{t('beandex.scan_bag_btn')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCustomBag(!isAddingCustomBag)}
              className="px-3 py-2 rounded-xl border border-[#4D382B] bg-[#2A1D15] hover:bg-[#38271C] text-[#FAF7F2] font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>{isAddingCustomBag ? 'Close Form' : t('beandex.add_bag_btn')}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCentralVault}
              className="px-3 py-2 rounded-xl border border-[#4D382B] bg-[#2A1D15] hover:bg-[#38271C] text-[#D4A373] font-semibold text-xs flex items-center gap-1.5 transition"
              title="Open full cloud directory"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('beandex.explore_global_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Inline Add Custom Bean Form */}
      {isAddingCustomBag && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#C26D52]/40 shadow-md space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2C2018] uppercase">
              <Plus className="w-4 h-4 text-[#C26D52]" />
              <span>Add Custom Specialty Bean</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingCustomBag(false)}
              className="text-[#7A6E65] hover:text-[#2C2018] text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div>
              <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                Bean Origin / Name *
              </label>
              <input
                type="text"
                required
                value={newBagName}
                onChange={(e) => setNewBagName(e.target.value)}
                placeholder="e.g. Ethiopia Yirgacheffe Chelchele (Washed)"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                Roaster (Optional)
              </label>
              <input
                type="text"
                value={newBagRoaster}
                onChange={(e) => setNewBagRoaster(e.target.value)}
                placeholder="e.g. La Cabra, Coffee Collective, Tim Wendelboe"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                Roast Profile
              </label>
              <select
                value={newBagRoastLevel}
                onChange={(e) => setNewBagRoastLevel(e.target.value as RoastLevel)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
              >
                <option value="light">Light Roast (Floral / Citric / High Acidity)</option>
                <option value="medium">Medium Roast (Caramel / Chocolate / Sweet)</option>
                <option value="medium-dark">Medium-Dark Roast (Rich Body / Crema)</option>
                <option value="dark">Dark Roast (Smoky / Dark Cacao / Low Acidity)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                Roast Date
              </label>
              <input
                type="date"
                value={newBagRoastDate}
                onChange={(e) => setNewBagRoastDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                {t('beandex.opened_date_label')} (Optional)
              </label>
              <input
                type="date"
                value={newBagDateOpened}
                onChange={(e) => setNewBagDateOpened(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                Assigned Grinder
              </label>
              <select
                value={newBagGrinderName}
                onChange={(e) => setNewBagGrinderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono font-semibold text-[#2C2018] focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
              >
                {grinders.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name} ({g.type === 'stepless' ? 'Stepless' : 'Stepped'})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-[#7A6E65] uppercase font-mono block mb-1">
                Tasting Notes / Barista Impressions (Optional)
              </label>
              <input
                type="text"
                value={newBagNotes}
                onChange={(e) => setNewBagNotes(e.target.value)}
                placeholder="e.g. Bergamot, jasmine, peach, silky mouthfeel"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#2C2018] text-[#FAF7F2] font-semibold text-xs flex items-center gap-1.5 hover:bg-[#3D2D22] transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save to Beandex Vault</span>
          </button>
        </form>
      )}

      {/* 3. Section: Mine Kaffeposer (Personal Fresh Bean Inventory) */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2C2018]">
                {t('beandex.my_bags')}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#C26D52]/10 border border-[#C26D52]/30 text-[#C26D52]">
                {t('beandex.my_bags_count', { count: beans.length })}
              </span>
            </div>
            <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
              {t('beandex.my_bags_subtitle')}
            </p>
          </div>

          {/* Quick Filter & Search Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#7A6E65] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('beandex.search_placeholder')}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-[#E8DFD5] bg-white text-[11px] placeholder:text-[#A6998E] focus:outline-none focus:border-[#C26D52]"
              />
            </div>

            <select
              value={roastFilter}
              onChange={(e) => setRoastFilter(e.target.value)}
              className="px-2 py-1.5 rounded-xl border border-[#E8DFD5] bg-white text-[11px] font-semibold text-[#2C2018] focus:outline-none"
            >
              <option value="all">{t('beandex.filter_all')}</option>
              <option value="light">{t('beandex.filter_light')}</option>
              <option value="medium">{t('beandex.filter_medium')}</option>
              <option value="dark">{t('beandex.filter_dark')}</option>
            </select>

            <button
              type="button"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 transition ${
                favoritesOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                  : 'bg-white border-[#E8DFD5] text-[#7A6E65] hover:bg-[#FAF7F2]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'text-amber-500 fill-amber-500' : 'text-[#7A6E65]'}`} />
              <span className="hidden sm:inline">{t('beandex.filter_favorites')}</span>
            </button>
          </div>
        </div>

        {/* Bags Grid */}
        {filteredBags.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[#DECFC0] bg-[#FFFDF9] text-center space-y-3">
            <Coffee className="w-8 h-8 text-[#C26D52]/50 mx-auto" />
            <p className="text-xs text-[#7A6E65] font-sans max-w-md mx-auto">
              {t('beandex.empty_vault')}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onOpenScanner}
                className="px-3.5 py-2 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>{t('beandex.scan_bag_btn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCustomBag(true)}
                className="px-3.5 py-2 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FAF7F2] text-[#2C2018] text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('beandex.add_bag_btn')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBags.map((bean) => {
              const isActiveInFlow = bean.id === activeBeanId;
              const freshness = calculateBeanFreshness(bean.roastDate, bean.roastLevel, bean.dateOpened);
              const rating = bean.rating || 0;
              const beanGrinder = resolveGrinder(bean.grinderName, grinders);

              return (
                <div
                  key={bean.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 shadow-xs ${
                    isActiveInFlow
                      ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52] shadow-md'
                      : 'border-[#E8DFD5] bg-white hover:border-[#DECFC0]'
                  }`}
                >
                  {/* Card Header: Roast Badge + Active State + Delete */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
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

                        {bean.expertScore && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                            <Award className="w-2.5 h-2.5 text-amber-600" />
                            <span>{bean.expertScore} PTS</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isActiveInFlow ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#72806B]/15 text-[#72806B] border border-[#72806B]/30 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>{t('beandex.active_in_flow')}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectBean(bean.id);
                              onSwitchToFlow();
                            }}
                            className="text-[9px] font-bold px-2 py-0.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5] text-[#2C2018] transition flex items-center gap-1"
                            title="Set as active bean and go to Espresso Flow"
                          >
                            <span>{t('beandex.set_active_btn')}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-[#C26D52]" />
                          </button>
                        )}

                        {beans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(t('beandex.delete_bag_confirm', { name: bean.name }))) {
                                onDeleteBean(bean.id);
                              }
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[#7A6E65]/50 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete bean"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Name & Roaster */}
                    <div>
                      <h4 className="font-bold text-xs text-[#2C2018] leading-snug line-clamp-2">
                        {bean.name}
                      </h4>
                      {bean.roaster && (
                        <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
                          {bean.roaster}
                        </p>
                      )}
                    </div>

                    {/* Freshness & Degas Status Badge */}
                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                      <div
                        className={`px-2 py-0.5 rounded-full border text-[9.5px] font-mono font-bold flex items-center gap-1.5 ${freshness.badgeClasses}`}
                        title={freshness.baristaTip}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${freshness.dotColor}`} />
                        <span>{freshness.summary}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFreshnessRoast(bean.roastLevel);
                          setIsFreshnessInfoOpen(true);
                        }}
                        className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#C26D52] text-[#7A6E65] hover:text-[#C26D52] flex items-center justify-center transition cursor-pointer"
                        title={t('beandex.info_degas_button')}
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Freshness Days Off Roast & Grinder info */}
                    <div className="flex items-center justify-between text-[10px] text-[#7A6E65] pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#A6998E]" />
                        <span>{t('beandex.days_off_roast', { days: freshness.daysOffRoast })}</span>
                      </span>

                      <span className="font-mono bg-[#FAF7F2] border border-[#E8DFD5] px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <span className="text-[#7A6E65] truncate max-w-[80px]">
                          {beanGrinder?.name || bean.grinderName}:
                        </span>
                        <strong className="text-[#C26D52] font-bold">{bean.grindSetting}</strong>
                      </span>
                    </div>

                    {/* Bag Opened Status Row */}
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      {bean.dateOpened ? (
                        <div className="flex items-center gap-1 text-[10px] text-stone-700 bg-stone-100/80 border border-stone-200 px-2 py-0.5 rounded-lg w-full justify-between">
                          <span className="flex items-center gap-1">
                            <PackageOpen className="w-3.5 h-3.5 text-[#C26D52]" />
                            <span>{t('beandex.opened_status', { days: freshness.daysOpened ?? 0 })}</span>
                            <span className="text-[#A6998E]">({bean.dateOpened})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newDate = prompt(t('beandex.opened_date_label'), bean.dateOpened);
                              if (newDate !== null) {
                                onUpdateBean(bean.id, { dateOpened: newDate.trim() || undefined });
                              }
                            }}
                            className="text-[9px] font-bold text-[#C26D52] hover:underline cursor-pointer"
                          >
                            {t('beandex.edit_opened_date')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBean(bean.id, {
                              dateOpened: new Date().toISOString().split('T')[0],
                            })
                          }
                          className="text-[10px] font-bold text-[#7A6E65] hover:text-[#C26D52] flex items-center gap-1 py-0.5 px-1.5 rounded-md hover:bg-[#FAF7F2] transition cursor-pointer"
                          title="Click when you break the bag seal"
                        >
                          <PackageOpen className="w-3.5 h-3.5 text-[#C26D52]" />
                          <span>{t('beandex.mark_opened_today')}</span>
                        </button>
                      )}
                    </div>

                    {/* Barista Tasting Notes (Inline Editable) */}
                    <div className="pt-1">
                      {editingNotesBeanId === bean.id ? (
                        <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#C26D52]/50 animate-fadeIn">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#7A6E65]">
                            <span className="font-bold text-[#2C2018] uppercase flex items-center gap-1">
                              <Edit3 className="w-3 h-3 text-[#C26D52]" /> {t('beandex.personal_notes_title')}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingNotesBeanId(null)}
                              className="text-[#7A6E65] hover:text-[#2C2018] text-[9.5px]"
                            >
                              Cancel
                            </button>
                          </div>
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder={t('beandex.notes_placeholder')}
                            rows={2}
                            className="w-full p-2 text-[11px] font-sans rounded-lg border border-[#E8DFD5] bg-white focus:outline-none focus:ring-1 focus:ring-[#C26D52]"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateBean(bean.id, { notes: tempNotes.trim() });
                                setEditingNotesBeanId(null);
                              }}
                              className="px-3 py-1 rounded-lg bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>{t('beandex.save_notes')}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNotesBeanId(bean.id);
                            setTempNotes(bean.notes || '');
                          }}
                          className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]/70 hover:border-[#C26D52]/50 transition cursor-pointer group flex items-start justify-between gap-1.5"
                          title="Tap to add or edit notes"
                        >
                          <div className="min-w-0 flex-1">
                            {bean.notes ? (
                              <p className="text-[10.5px] text-[#7A6E65] font-sans italic line-clamp-2 leading-snug">
                                "{bean.notes}"
                              </p>
                            ) : (
                              <p className="text-[10px] text-[#A6998E] font-sans flex items-center gap-1">
                                <span>{t('beandex.no_notes')}</span>
                              </p>
                            )}
                          </div>
                          <Edit3 className="w-3 h-3 text-[#A6998E] group-hover:text-[#C26D52] shrink-0 transition mt-0.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: 1-5 Star Rating & Dial-In Studio Action */}
                  <div className="pt-2 border-t border-[#E8DFD5]/70 flex items-center justify-between gap-2">
                    {/* Interactive 5-Star Barista Rating */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRateBean(bean.id, star)}
                            className="p-0.5 hover:scale-125 transition active:scale-95"
                            title={`${star} stars`}
                          >
                            <Star
                              className={`w-4 h-4 transition ${
                                star <= rating
                                  ? 'text-amber-500 fill-amber-500 drop-shadow-xs'
                                  : 'text-[#E8DFD5] hover:text-amber-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-[9px] text-[#A6998E] block">
                        {rating > 0 ? `${rating} / 5 stars` : t('beandex.unrated')}
                      </span>
                    </div>

                    {/* Direct Dial-In Studio Shortcut Button */}
                    <button
                      type="button"
                      onClick={() => onOpenDialInForBean(bean.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#C26D52] bg-[#C26D52]/10 hover:bg-[#C26D52]/20 text-[#C26D52] font-semibold text-[10px] flex items-center gap-1 transition shadow-2xs"
                      title="Open 4-step Dial-In Studio for this bean"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{t('beandex.dial_in_btn')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Added to vault toast banner */}
      {addedFeedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2C2018] text-[#FAF7F2] border border-[#72806B] text-xs font-mono shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2">
          <Check className="w-4 h-4 text-[#72806B]" />
          <span>Added "{addedFeedback}" to your Beandex stock!</span>
        </div>
      )}

      {/* 4. Section: Globalt Bønnekatalog & SCA Ratings */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#DECFC0] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DFD5] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C26D52]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2C2018]">
                {t('beandex.global_section_title')}
              </h3>
            </div>
            <p className="text-[11px] text-[#7A6E65] font-sans mt-0.5">
              {t('beandex.global_section_subtitle')}
            </p>
          </div>

          <div className="relative sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#7A6E65] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search global index..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-[#E8DFD5] bg-white text-[11px] placeholder:text-[#A6998E] focus:outline-none focus:border-[#C26D52]"
            />
          </div>
        </div>

        {isLoadingGlobal ? (
          <div className="py-8 text-center text-[#7A6E65] font-mono text-xs animate-pulse">
            Connecting to global specialty coffee registry...
          </div>
        ) : filteredGlobalBeans.length === 0 ? (
          <div className="py-6 text-center text-[#7A6E65] text-xs font-sans">
            No matching coffees found in the global index.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGlobalBeans.slice(0, 6).map((gb) => {
              const isInVault = beans.some(
                (b) => b.barcode === gb.barcode || b.name.toLowerCase() === gb.name.toLowerCase()
              );

              return (
                <div
                  key={gb.barcode}
                  className="p-3.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-white transition flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-[#E8DFD5] text-[#2C2018]">
                        {gb.roast_level}
                      </span>
                      {gb.expert_score && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-600" />
                          <span>{gb.expert_score} PTS</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h5 className="font-bold text-xs text-[#2C2018] leading-tight">
                        {gb.name}
                      </h5>
                      <span className="text-[10px] text-[#7A6E65] font-sans block mt-0.5">
                        {gb.roaster} • {gb.purchase_country}
                      </span>
                    </div>

                    {/* Community Rating & Flavor Notes */}
                    <div className="flex items-center gap-1 text-[10px] text-amber-700">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <strong className="font-bold">{gb.avg_rating.toFixed(1)}</strong>
                      <span className="text-[#A6998E]">({gb.ratings_count} ratings)</span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {gb.flavor_notes.slice(0, 3).map((note, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-md bg-white border border-[#E8DFD5] text-[9px] text-[#7A6E65]"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E8DFD5] flex items-center justify-between">
                    {isInVault ? (
                      <span className="text-[10px] font-bold text-[#72806B] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{t('beandex.in_my_bags')}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddGlobalBeanToVault(gb)}
                        className="w-full py-1.5 rounded-lg bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] font-semibold text-[10px] flex items-center justify-center gap-1 transition shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-[#D4A373]" />
                        <span>{t('beandex.add_to_my_bags')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Freshness & Degas Info Modal */}
      <FreshnessInfoModal
        isOpen={isFreshnessInfoOpen}
        onClose={() => setIsFreshnessInfoOpen(false)}
        activeRoastLevel={selectedFreshnessRoast}
      />
    </div>
  );
};
