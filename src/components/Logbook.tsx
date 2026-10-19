import React, { useState } from 'react';
import type { ShotRecord } from '../types/espresso';
import {
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  Trash2,
  Filter,
  Check,
  X,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
  Share2,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { DRINK_RECIPES } from '../data/drinkRecipes';
import { ArchitecturalCup } from './ArchitecturalCup';
import { FlowChart } from './FlowChart';
import { useTranslation } from '../i18n';
import { ShotShareModal } from './ShotShareModal';
import { generateDialInAdvice } from '../lib/espressoMath';

interface LogbookProps {
  shots: ShotRecord[];
  onDeleteShot?: (shotId: string) => void;
  initialExpandedShotId?: string | null;
  onApplyGrindSetting?: (newSetting: string) => void;
}

interface DayGroup {
  dateKey: string;
  dayLabel: string;
  shots: ShotRecord[];
}

export const Logbook: React.FC<LogbookProps> = ({ shots, onDeleteShot, initialExpandedShotId, onApplyGrindSetting }) => {
  const { t, language } = useTranslation();
  const [selectedDrinkFilter, setSelectedDrinkFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedShotId, setExpandedShotId] = useState<string | null>(
    initialExpandedShotId || (shots.length > 0 ? shots[0].id : null)
  );
  const [sharingShot, setSharingShot] = useState<ShotRecord | null>(null);
  const [appliedShotId, setAppliedShotId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialExpandedShotId) {
      setExpandedShotId(initialExpandedShotId);
    }
  }, [initialExpandedShotId]);

  if (shots.length === 0) {
    return (
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-8 text-center font-mono">
        <BookOpen className="w-8 h-8 text-[#7A6E65]/40 mx-auto mb-2" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2018]">
          {t('logbook.empty_title')}
        </h4>
        <p className="text-xs text-[#7A6E65] mt-1">
          {t('logbook.empty_desc')}
        </p>
      </div>
    );
  }

  // Extract unique drink names recorded in the logbook
  const recordedDrinks = Array.from(
    new Set(shots.map((s) => s.drinkName || 'Double Espresso'))
  );

  const filteredShots =
    selectedDrinkFilter === 'all'
      ? shots
      : shots.filter((s) => (s.drinkName || 'Double Espresso') === selectedDrinkFilter);

  // Group filtered shots by calendar day
  const groupShotsByDay = (items: ShotRecord[]): DayGroup[] => {
    const groups: Record<string, ShotRecord[]> = {};
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    items.forEach((s) => {
      const d = new Date(s.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    const localeCode = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : language === 'it' ? 'it-IT' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';

    return Object.entries(groups).map(([dateKey, dayShots]) => {
      let dayLabel = '';
      const sampleDate = new Date(dayShots[0].timestamp);
      const formattedDate = sampleDate.toLocaleDateString(localeCode, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      if (dateKey === todayKey) {
        dayLabel = `${t('logbook.today')} • ${formattedDate}`;
      } else if (dateKey === yesterdayKey) {
        dayLabel = `${t('logbook.yesterday')} • ${formattedDate}`;
      } else {
        dayLabel = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
      }

      return {
        dateKey,
        dayLabel,
        shots: dayShots,
      };
    });
  };

  const dayGroups = groupShotsByDay(filteredShots);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      if (onDeleteShot) {
        onDeleteShot(id);
      }
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedShotId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C26D52]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            {t('logbook.title', { count: shots.length })}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#7A6E65]">{t('logbook.subtitle')}</span>
      </div>

      {/* Drink Filter Tabs Ribbon with Mini Cup Silhouettes */}
      <div className="bg-[#FFFDF9] p-2.5 rounded-2xl border border-[#E8DFD5] space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7A6E65] uppercase tracking-wider font-bold">
          <Filter className="w-3 h-3 text-[#C26D52]" />
          <span>{t('logbook.filter_by')}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedDrinkFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition shrink-0 ${
              selectedDrinkFilter === 'all'
                ? 'bg-[#2C2018] text-[#FAF7F2] font-bold shadow-xs'
                : 'bg-[#FAF7F2] text-[#7A6E65] hover:bg-[#E8DFD5] border border-[#E8DFD5]'
            }`}
          >
            {t('logbook.all_drinks', { count: shots.length })}
          </button>
          {recordedDrinks.map((drink) => {
            const count = shots.filter((s) => (s.drinkName || 'Double Espresso') === drink).length;
            const isSelected = selectedDrinkFilter === drink;
            const recipe =
              DRINK_RECIPES.find(
                (r) => r.name.toLowerCase() === drink.toLowerCase() || r.id === drink.toLowerCase()
              ) || DRINK_RECIPES[1];

            return (
              <button
                key={drink}
                type="button"
                onClick={() => setSelectedDrinkFilter(drink)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#C26D52] text-white font-bold shadow-xs'
                    : 'bg-[#FAF7F2] text-[#7A6E65] hover:bg-[#E8DFD5] border border-[#E8DFD5]'
                }`}
              >
                <div className="shrink-0 scale-90">
                  <ArchitecturalCup drink={recipe} size="xs" />
                </div>
                <span>{drink}</span>
                <span className="text-[10px] opacity-80 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shots List Grouped by Day */}
      {dayGroups.length === 0 ? (
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-6 text-center font-mono">
          <p className="text-xs text-[#7A6E65]">
            {t('logbook.no_shots_filtered', { filter: selectedDrinkFilter })}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dayGroups.map((group) => (
            <div key={group.dateKey} className="space-y-2.5">
              {/* Day Header Badge */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#C26D52]" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#2C2018]">
                    {group.dayLabel}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#7A6E65] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E8DFD5]">
                  {group.shots.length === 1
                    ? t('logbook.one_shot_count')
                    : t('logbook.shots_count', { count: group.shots.length })}
                </span>
              </div>

              {/* Day Shots Cards */}
              <div className="space-y-3">
                {group.shots.map((shot, idx) => {
                  const shotNumber = String(filteredShots.length - idx).padStart(3, '0');
                  const timeStr = new Date(shot.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const drinkLabel = shot.drinkName || 'Double Espresso';
                  const isConfirming = confirmDeleteId === shot.id;
                  const isExpanded = expandedShotId === shot.id;

                  const matchingRecipe =
                    DRINK_RECIPES.find(
                      (d) =>
                        d.id === shot.drinkId ||
                        d.name.toLowerCase() === drinkLabel.toLowerCase() ||
                        drinkLabel.toLowerCase().includes(d.name.toLowerCase())
                    ) || DRINK_RECIPES[1];

                  const roastKey = shot.roastLevel
                    ? (`roast.${shot.roastLevel.replace('-', '_')}` as const)
                    : null;

                  const isChanneling = shot.channelingDetected;
                  const isSourOrWatery =
                    shot.tasteRating === 'sour' || shot.tasteRating === 'watery';
                  const isBitter = shot.tasteRating === 'bitter';

                  const advice = generateDialInAdvice(
                    shot.totalTimeSeconds,
                    shot.doseGrams,
                    shot.actualYieldGrams,
                    shot.channelingDetected || shot.channeling,
                    shot.tasteRating,
                    shot.preInfusionSeconds,
                    shot.roastLevel,
                    shot.grinderName,
                    shot.grindSetting
                  );

                  const isSweetSpot = advice.grindAdvice === 'keep' && !shot.channelingDetected;
                  const isFiner = advice.grindAdvice === 'finer';
                  const isCoarser = advice.grindAdvice === 'coarser';

                  const currentGrindNum = parseFloat(shot.grindSetting);
                  let nextSettingStr: string | null = advice.targetGrindSetting || null;
                  if (!nextSettingStr && !isNaN(currentGrindNum) && advice.grindDeltaSteps > 0) {
                    if (isFiner) {
                      nextSettingStr = (Math.max(0, currentGrindNum - advice.grindDeltaSteps)).toFixed(1).replace('.0', '');
                    } else if (isCoarser) {
                      nextSettingStr = (currentGrindNum + advice.grindDeltaSteps).toFixed(1).replace('.0', '');
                    }
                  }

                  const statusBorder = isChanneling
                    ? 'border-l-4 border-l-red-500 hover:border-l-red-600'
                    : isSourOrWatery
                    ? 'border-l-4 border-l-amber-500 hover:border-l-amber-600'
                    : isBitter
                    ? 'border-l-4 border-l-[#8C6046] hover:border-l-[#6A4733]'
                    : 'border-l-4 border-l-[#72806B] hover:border-l-[#5A6754]';

                  return (
                    <div
                      key={shot.id}
                      className={`bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] ${statusBorder} p-3.5 sm:p-4 shadow-xs hover:border-[#C26D52]/40 transition font-mono space-y-3`}
                    >
                      {/* Shot Details & Extraction Metrics */}
                      <div className="space-y-2.5">
                        {/* Journal Card Header */}
                        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Miniature Architectural Cup Icon */}
                            <div className="w-8 h-8 flex items-center justify-center shrink-0 p-0.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFD5]" title={drinkLabel}>
                              <ArchitecturalCup drink={matchingRecipe} size="xs" />
                            </div>
                            <span className="bg-[#2C2018] text-[#FAF7F2] px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                              #{shotNumber}
                            </span>
                            <span className="font-bold text-[#2C2018] font-serif">{shot.coffeeName}</span>
                            <span className="bg-[#FAF7F2] border border-[#C26D52]/30 text-[#C26D52] px-2 py-0.5 rounded text-[10px] font-bold shrink-0 whitespace-nowrap">
                              {drinkLabel}
                            </span>
                            {shot.roastLevel && roastKey && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono tracking-wider font-semibold border-[#E8DFD5] bg-[#FAF7F2] text-[#7A6E65] shrink-0 whitespace-nowrap">
                                {t(roastKey as any)}
                              </span>
                            )}
                          </div>

                          {/* Actions & Timestamp */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 text-[11px] text-[#7A6E65]">
                              <Clock className="w-3 h-3" />
                              <span className="whitespace-nowrap">{timeStr}</span>
                            </div>

                            {/* Safe Delete Button */}
                            {onDeleteShot && (
                              <div className="flex items-center gap-1 ml-2">
                                {isConfirming ? (
                                  <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1">
                                    <span className="text-[10px] text-red-700 font-bold px-1">
                                      {t('logbook.delete_confirm_prompt')}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDelete(shot.id, e)}
                                      className="p-1 rounded hover:bg-red-200 text-red-700 transition"
                                      title={t('logbook.confirm_delete')}
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelDelete}
                                      className="p-1 rounded hover:bg-gray-200 text-[#7A6E65] transition"
                                      title={t('logbook.cancel')}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDelete(shot.id, e)}
                                    className="p-1.5 rounded-lg text-[#7A6E65] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                                    title={t('logbook.delete_tooltip')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Extraction Metrics Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                          <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]/70">
                            <div className="text-[9px] text-[#7A6E65] uppercase font-bold tracking-wider">
                              {t('logbook.ratio')}
                            </div>
                            <div className="font-bold text-[#2C2018] text-xs mt-0.5">
                              {shot.doseGrams}g →{' '}
                              <span className="text-[#C26D52]">{shot.actualYieldGrams}g</span>
                            </div>
                            <div className="text-[10px] text-[#7A6E65] mt-0.5">
                              1:
                              {shot.doseGrams > 0
                                ? (shot.actualYieldGrams / shot.doseGrams).toFixed(1)
                                : '2.0'}{' '}
                              ratio
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]/70">
                            <div className="text-[9px] text-[#7A6E65] uppercase font-bold tracking-wider">
                              {t('logbook.time_and_flow')}
                            </div>
                            <div className="font-bold text-[#2C2018] text-xs mt-0.5">
                              {shot.totalTimeSeconds}s @ {shot.averageFlowGps}g/s
                            </div>
                            {(() => {
                              const matchingRecipe = DRINK_RECIPES.find(
                                (d) => d.id === shot.drinkId || d.name.toLowerCase() === (shot.drinkName || '').toLowerCase()
                              );
                              const targetSec = matchingRecipe?.expectedTimeSeconds || (shot.method === 'pour_over' ? 180 : 28);
                              const delta = Math.round((shot.totalTimeSeconds - targetSec) * 10) / 10;
                              const diffStr = delta > 0 ? `+${delta.toFixed(1)}s` : `${delta.toFixed(1)}s`;
                              const isTargetHit = Math.abs(delta) <= 2.5;
                              const isTooSlow = delta > 2.5;
                              const colorClass = isTargetHit
                                ? 'text-[#72806B]'
                                : isTooSlow
                                ? 'text-[#C26D52]'
                                : 'text-amber-700';

                              return (
                                <div className={`text-[9.5px] font-semibold mt-0.5 truncate ${colorClass}`}>
                                  {t('logbook.target_time_diff', { target: targetSec, diff: diffStr })}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]/70">
                            <div className="text-[9px] text-[#7A6E65] uppercase font-bold tracking-wider">
                              {t('logbook.equipment')}
                            </div>
                            <div className="font-bold text-[#2C2018] text-xs mt-0.5 truncate">
                              {shot.grinderName.split(' ')[0]} @{' '}
                              <strong className="text-[#C26D52]">{shot.grindSetting}</strong>
                            </div>
                            {shot.method === 'pour_over' ? (
                              <div className="text-[10px] text-[#7A6E65] truncate mt-0.5" title={shot.filterBrewer || 'Pour Over'}>
                                🫗 {(shot.filterBrewer || 'Pour Over').split('(')[0].trim()}
                              </div>
                            ) : shot.machineName ? (
                              <div className="text-[10px] text-[#7A6E65] truncate mt-0.5">
                                {shot.machineName.split(' ')[0]}
                              </div>
                            ) : null}
                          </div>

                          <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]/70 overflow-hidden">
                            <div className="text-[9px] text-[#7A6E65] uppercase font-bold tracking-wider">
                              {t('logbook.taste_flow')}
                            </div>
                            <div className="flex items-center gap-1 font-semibold capitalize text-[#2C2018] mt-0.5 min-w-0">
                              {shot.channelingDetected ? (
                                <span className="text-[#B85B48] flex items-center gap-1 text-[10.5px] font-bold truncate">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{' '}
                                  <span className="truncate">{t('logbook.channeling')}</span>
                                  {shot.channeling?.flowSpikeGps
                                    ? ` (${shot.channeling.flowSpikeGps} g/s)`
                                    : ''}
                                </span>
                              ) : shot.tasteRating ? (
                                <span
                                  className={`flex items-center gap-1 text-[10.5px] font-bold min-w-0 ${
                                    shot.tasteRating === 'balanced'
                                      ? 'text-[#72806B]'
                                      : shot.tasteRating === 'sour'
                                      ? 'text-amber-700'
                                      : shot.tasteRating === 'bitter'
                                      ? 'text-[#8C6046]'
                                      : 'text-sky-700'
                                  }`}
                                >
                                  {shot.tasteRating === 'balanced' ? (
                                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-[#72806B]" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {shot.tasteRating === 'sour'
                                      ? t('taste.sour_label')
                                      : shot.tasteRating === 'bitter'
                                      ? t('taste.bitter_label')
                                      : shot.tasteRating === 'watery'
                                      ? t('taste.watery_label')
                                      : t('taste.balanced_label')}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[#7A6E65] flex items-center gap-1.5 text-[10px] font-medium min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#DECFC0] shrink-0" />
                                  <span className="truncate">{t('logbook.unrated') || t('beandex.unrated') || 'Not rated'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {shot.notes && (
                          <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-[11px] text-[#2C2018] flex items-start gap-1.5 leading-relaxed">
                            <span className="text-[#C26D52] font-serif text-sm font-bold select-none shrink-0 leading-none mt-0.5">
                              “
                            </span>
                            <span className="italic flex-1">{shot.notes}</span>
                            <span className="text-[#C26D52] font-serif text-sm font-bold select-none shrink-0 leading-none self-end">
                              ”
                            </span>
                          </div>
                        )}

                        {/* Barista Dial-In Recommendation Banner */}
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs font-mono transition-all ${
                            isSweetSpot
                              ? 'bg-[#72806B]/12 border-[#72806B]/30 text-[#43523E]'
                              : shot.channelingDetected
                              ? 'bg-[#C26D52]/12 border-[#C26D52]/30 text-[#8C3A24]'
                              : isFiner
                              ? 'bg-[#D4A373]/20 border-[#D4A373]/40 text-[#7A4B1A]'
                              : 'bg-[#C26D52]/12 border-[#C26D52]/30 text-[#8C3A24]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isSweetSpot ? (
                              <div className="w-6 h-6 rounded-full bg-[#72806B]/20 flex items-center justify-center shrink-0 text-[#72806B]">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                            ) : shot.channelingDetected ? (
                              <div className="w-6 h-6 rounded-full bg-[#C26D52]/20 flex items-center justify-center shrink-0 text-[#C26D52]">
                                <AlertCircle className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#C26D52]/20 flex items-center justify-center shrink-0 text-[#C26D52]">
                                <Sliders className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] uppercase font-bold tracking-wider leading-tight flex items-center gap-1.5">
                                <span>
                                  {isSweetSpot
                                    ? t('logbook.status_sweet_spot') || 'SWEET SPOT (OPTIMAL)'
                                    : shot.channelingDetected
                                    ? t('logbook.status_channeling') || 'CHANNELING DETECTED'
                                    : isFiner
                                    ? t('logbook.status_fast') || 'FLOW TOO FAST (UNDER-EXTRACTED)'
                                    : t('logbook.status_slow') || 'FLOW TOO SLOW (OVER-EXTRACTED)'}
                                </span>
                              </div>
                              <div className="text-xs font-bold mt-0.5 text-[#2C2018] flex items-center justify-between gap-2 flex-wrap">
                                <span className="truncate">
                                  {isSweetSpot
                                    ? (t('logbook.dialin_keep', { setting: shot.grindSetting }) || `Keep grinder at ${shot.grindSetting} (optimal extraction)`)
                                    : isFiner && nextSettingStr
                                    ? (t('logbook.dialin_finer', { from: shot.grindSetting, to: nextSettingStr }) || `Adjust grinder FINER: ${shot.grindSetting} ➔ ${nextSettingStr}`)
                                    : isCoarser && nextSettingStr
                                    ? (t('logbook.dialin_coarser', { from: shot.grindSetting, to: nextSettingStr }) || `Adjust grinder COARSER: ${shot.grindSetting} ➔ ${nextSettingStr}`)
                                    : shot.channelingDetected
                                    ? (t('logbook.dialin_channeling') || 'Keep grinder • Improve puck prep (WDT & even tamp)')
                                    : advice.grinderSpecificAdvice || advice.summary}
                                </span>
                                {onApplyGrindSetting && (isFiner || isCoarser) && nextSettingStr && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onApplyGrindSetting(nextSettingStr);
                                      setAppliedShotId(shot.id);
                                      setTimeout(() => setAppliedShotId(null), 3000);
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-[#C26D52] hover:bg-[#b05d43] text-white text-[10px] font-sans font-bold transition shadow-2xs shrink-0 cursor-pointer"
                                  >
                                    {appliedShotId === shot.id
                                      ? (t('logbook.applied_grind') || '✓ Applied')
                                      : (t('logbook.apply_grind', { setting: nextSettingStr }) || `Apply ${nextSettingStr}`)}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Flow Curve Action Button & Share Card */}
                      <div className="border-t border-[#E8DFD5]/60 pt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(shot.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#E8DFD5] border border-[#E8DFD5] text-[#2C2018] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-[#C26D52]" />
                            <span className="whitespace-nowrap">
                              {isExpanded ? t('logbook.hide_curve') : t('logbook.view_curve')}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#7A6E65]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#7A6E65]" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSharingShot(shot)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#E8DFD5] border border-[#DECFC0] text-[#C26D52] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-98"
                            title={t('logbook.share_card')}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">{t('logbook.share_card')}</span>
                          </button>
                        </div>

                        <span className="text-[10px] text-[#7A6E65] whitespace-nowrap">
                          {shot.dataPoints && shot.dataPoints.length > 0
                            ? t('logbook.telemetry_points', { count: shot.dataPoints.length })
                            : ''}
                        </span>
                      </div>

                      {/* Expandable Flow Curve Container (Seamless, no redundant double border) */}
                      {isExpanded && (
                        <div className="pt-2 animate-in fade-in duration-200 space-y-2">
                          {shot.dataPoints && shot.dataPoints.length > 0 ? (
                            <div className="rounded-2xl overflow-hidden">
                              <FlowChart
                                points={shot.dataPoints}
                                targetYield={shot.targetYieldGrams || shot.actualYieldGrams}
                                doseGrams={shot.doseGrams}
                                channelingEvent={shot.channeling}
                                preInfusionSeconds={shot.preInfusionSeconds}
                                averageFlowGps={shot.averageFlowGps}
                                isLive={false}
                              />
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-center text-xs text-[#7A6E65]">
                              {t('logbook.no_curve_data')}
                            </div>
                          )}

                          {/* Full Barista Diagnosis Details in Expanded View */}
                          <div className="mt-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#DECFC0] space-y-2 text-xs font-mono">
                            <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#C26D52]" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E65]">
                                  {t('logbook.barista_tech_title') || 'BARISTA TECH IMPROVEMENT ADVICE'}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  isSweetSpot
                                    ? 'bg-[#72806B]/15 text-[#43523E] border border-[#72806B]/30'
                                    : 'bg-[#C26D52]/15 text-[#8C3A24] border border-[#C26D52]/30'
                                }`}
                              >
                                {advice.summary}
                              </span>
                            </div>

                            <p className="text-xs text-[#2C2018]/90 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-[#E8DFD5]">
                              {advice.rationale}
                            </p>

                            {advice.grinderSpecificAdvice && (
                              <div className="text-[11px] font-bold text-[#C26D52] bg-white/80 p-2.5 rounded-xl border border-[#E8DFD5] flex items-center gap-2">
                                <Sliders className="w-3.5 h-3.5 shrink-0" />
                                <span>{advice.grinderSpecificAdvice}</span>
                              </div>
                            )}

                            {advice.puckAdvice && (
                              <div className="text-[11px] text-[#7A6E65] bg-white/80 p-2.5 rounded-xl border border-[#E8DFD5]">
                                <strong className="text-[#2C2018]">Puck Prep: </strong>
                                {advice.puckAdvice}
                              </div>
                            )}

                            {advice.preInfusionAdvice && (
                              <div className="text-[11px] text-[#7A6E65] bg-white/80 p-2.5 rounded-xl border border-[#E8DFD5]">
                                <strong className="text-[#2C2018]">Pre-Infusion: </strong>
                                {advice.preInfusionAdvice}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Shot Share Modal */}
      <ShotShareModal
        isOpen={sharingShot !== null}
        shot={sharingShot}
        onClose={() => setSharingShot(null)}
      />
    </div>
  );
};
