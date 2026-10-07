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
} from 'lucide-react';
import { DRINK_RECIPES } from '../data/drinkRecipes';
import { ArchitecturalCup } from './ArchitecturalCup';
import { FlowChart } from './FlowChart';
import { useTranslation } from '../i18n';

interface LogbookProps {
  shots: ShotRecord[];
  onDeleteShot?: (shotId: string) => void;
  initialExpandedShotId?: string | null;
}

interface DayGroup {
  dateKey: string;
  dayLabel: string;
  shots: ShotRecord[];
}

export const Logbook: React.FC<LogbookProps> = ({ shots, onDeleteShot, initialExpandedShotId }) => {
  const { t } = useTranslation();
  const [selectedDrinkFilter, setSelectedDrinkFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedShotId, setExpandedShotId] = useState<string | null>(
    initialExpandedShotId || (shots.length > 0 ? shots[0].id : null)
  );

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

    return Object.entries(groups).map(([dateKey, dayShots]) => {
      let dayLabel = '';
      const sampleDate = new Date(dayShots[0].timestamp);
      const formattedDate = sampleDate.toLocaleDateString(undefined, {
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
                      {/* Main Card Overview Row */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
                        {/* Visual Drink Cup Silhouette */}
                        <div className="flex sm:flex-col items-center justify-between sm:justify-center p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] shrink-0 self-start sm:self-center w-full sm:w-20">
                          <div className="py-1">
                            <ArchitecturalCup drink={matchingRecipe} size="sm" />
                          </div>
                          <span className="text-[9px] font-bold text-[#7A6E65] sm:mt-1 text-center truncate max-w-[120px] sm:max-w-[70px]">
                            {matchingRecipe.name.split('/')[0].trim()}
                          </span>
                        </div>

                        {/* Shot Details & Extraction Metrics */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Journal Card Header */}
                          <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-[#2C2018] text-[#FAF7F2] px-2 py-0.5 rounded text-[10px] font-bold">
                                #{shotNumber}
                              </span>
                              <span className="font-bold text-[#2C2018]">{shot.coffeeName}</span>
                              <span className="bg-[#FAF7F2] border border-[#C26D52]/30 text-[#C26D52] px-2 py-0.5 rounded text-[10px] font-bold">
                                {drinkLabel}
                              </span>
                              {shot.roastLevel && roastKey && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono tracking-wider font-semibold border-[#E8DFD5] bg-[#FAF7F2] text-[#7A6E65]">
                                  {t(roastKey as any)}
                                </span>
                              )}
                            </div>

                            {/* Actions & Timestamp */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-[11px] text-[#7A6E65]">
                                <Clock className="w-3 h-3" />
                                <span>{timeStr}</span>
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
                              {shot.preInfusionSeconds !== undefined && (
                                <div className="text-[10px] text-[#7A6E65] mt-0.5 truncate">
                                  {t('logbook.pre_abbr')}: {shot.preInfusionSeconds}s •{' '}
                                  {t('logbook.flow_abbr')}: {shot.flowTimeSeconds}s
                                </div>
                              )}
                            </div>

                            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]/70">
                              <div className="text-[9px] text-[#7A6E65] uppercase font-bold tracking-wider">
                                {t('logbook.equipment')}
                              </div>
                              <div className="font-bold text-[#2C2018] text-xs mt-0.5 truncate">
                                {shot.grinderName.split(' ')[0]} @{' '}
                                <strong className="text-[#C26D52]">{shot.grindSetting}</strong>
                              </div>
                              {shot.machineName && (
                                <div className="text-[10px] text-[#7A6E65] truncate mt-0.5">
                                  {shot.machineName.split(' ')[0]}
                                </div>
                              )}
                            </div>

                            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]/70">
                              <div className="text-[9px] text-[#7A6E65] uppercase font-bold tracking-wider">
                                {t('logbook.taste_flow')}
                              </div>
                              <div className="flex items-center gap-1 font-semibold capitalize text-[#2C2018] mt-0.5">
                                {shot.channelingDetected ? (
                                  <span className="text-[#B85B48] flex items-center gap-1 text-[11px] font-bold">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{' '}
                                    {t('logbook.channeling')}
                                    {shot.channeling?.flowSpikeGps
                                      ? ` (${shot.channeling.flowSpikeGps} g/s)`
                                      : ''}
                                  </span>
                                ) : (
                                  <span className="text-[#72806B] flex items-center gap-1 text-[11px] font-bold">
                                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />{' '}
                                    {shot.tasteRating
                                      ? shot.tasteRating === 'sour'
                                        ? t('taste.sour_label')
                                        : shot.tasteRating === 'bitter'
                                        ? t('taste.bitter_label')
                                        : shot.tasteRating === 'watery'
                                        ? t('taste.watery_label')
                                        : t('taste.balanced_label')
                                      : t('logbook.balanced')}
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
                        </div>
                      </div>

                      {/* Expandable Flow Curve Action Button */}
                      <div className="border-t border-[#E8DFD5]/60 pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleExpand(shot.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#E8DFD5] border border-[#E8DFD5] text-[#2C2018] text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-[#C26D52]" />
                          <span>
                            {isExpanded ? t('logbook.hide_curve') : t('logbook.view_curve')}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#7A6E65]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#7A6E65]" />
                          )}
                        </button>

                        <span className="text-[10px] text-[#7A6E65]">
                          {shot.dataPoints && shot.dataPoints.length > 0
                            ? `${shot.dataPoints.length} telemetri punkter`
                            : ''}
                        </span>
                      </div>

                      {/* Expandable Flow Curve Container */}
                      {isExpanded && (
                        <div className="pt-2 animate-in fade-in duration-200">
                          {shot.dataPoints && shot.dataPoints.length > 0 ? (
                            <div className="rounded-xl border border-[#E8DFD5] overflow-hidden">
                              <FlowChart
                                points={shot.dataPoints}
                                targetYield={shot.targetYieldGrams || shot.actualYieldGrams}
                                doseGrams={shot.doseGrams}
                                channelingEvent={shot.channeling}
                                preInfusionSeconds={shot.preInfusionSeconds}
                                isLive={false}
                              />
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-center text-xs text-[#7A6E65]">
                              {t('logbook.no_curve_data')}
                            </div>
                          )}
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
    </div>
  );
};
