import React from 'react';
import type { RoastLevel } from '../types/espresso';
import { calculateBeanFreshness } from '../lib/espressoMath';
import { useTranslation } from '../i18n';

interface RoastTimelineBarProps {
  roastDate: string;
  roastLevel?: RoastLevel;
  dateOpened?: string;
  className?: string;
  compact?: boolean;
}

export const RoastTimelineBar: React.FC<RoastTimelineBarProps> = ({
  roastDate,
  roastLevel = 'medium',
  dateOpened,
  className = '',
  compact = false,
}) => {
  const { t } = useTranslation();
  const freshness = calculateBeanFreshness(roastDate, roastLevel, dateOpened);

  const degasMin = freshness.degasDaysMin;
  const peakMax = freshness.peakDaysMax;
  const daysOff = Math.max(0, freshness.daysOffRoast);

  // Total timeline axis length
  const totalDays = Math.max(42, peakMax + 14);

  // Calculate percentage width for each phase segment
  const degasPct = Math.round((degasMin / totalDays) * 100);
  const peakPct = Math.round(((peakMax - degasMin) / totalDays) * 100);
  const pastPct = Math.max(0, 100 - degasPct - peakPct);

  // Pin marker percentage clamped to 2%..98%
  const markerPct = Math.max(3, Math.min(97, Math.round((daysOff / totalDays) * 100)));

  // Status badge text
  let statusBadgeText = '';
  let statusBadgeStyle = '';

  if (freshness.phase === 'degassing') {
    const daysLeft = Math.max(1, degasMin - daysOff);
    statusBadgeText = t('beandex.timeline_resting', { days: daysLeft });
    statusBadgeStyle = 'bg-amber-500/15 text-amber-900 border-amber-400/40';
  } else if (freshness.phase === 'peak') {
    statusBadgeText = t('beandex.timeline_peak_window');
    statusBadgeStyle = 'bg-[#72806B]/15 text-[#4A5745] border-[#72806B]/40 font-bold';
  } else if (freshness.phase === 'past_peak') {
    statusBadgeText = t('beandex.timeline_past');
    statusBadgeStyle = 'bg-stone-500/15 text-stone-700 border-stone-400/40';
  } else {
    statusBadgeText = t('beandex.timeline_stale');
    statusBadgeStyle = 'bg-neutral-500/15 text-neutral-600 border-neutral-400/40';
  }

  return (
    <div className={`space-y-1.5 font-mono select-none ${className}`}>
      {/* Header: Roast Date + Days off Roast + Peak Window Badge */}
      <div className="flex items-center justify-between text-[10px] gap-1">
        <span className="text-[#7A6E65] truncate">
          <strong className="text-[#2C2018]">Day {daysOff}</strong>
          {roastDate ? ` (${roastDate})` : ''}
        </span>
        <span
          className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusBadgeStyle}`}
        >
          {statusBadgeText}
        </span>
      </div>

      {/* Segmented Timeline Track */}
      <div className="relative pt-1 pb-1">
        {/* Track Bar with 3 Phase Zones */}
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-[#E8DFD5]/40 border border-[#DECFC0]">
          {/* Zone 1: Resting / Degas */}
          <div
            style={{ width: `${degasPct}%` }}
            className="h-full bg-amber-400/35 border-r border-amber-500/30"
            title={`Resting phase (Days 0-${degasMin})`}
          />

          {/* Zone 2: Sweetness Peak Window */}
          <div
            style={{ width: `${peakPct}%` }}
            className="h-full bg-[#72806B]/40 border-r border-[#72806B]/50 relative"
            title={`Peak sweetness window (Days ${degasMin}-${peakMax})`}
          >
            {/* Subtle diagonal pinstripe indicating golden zone */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,#2C2018_25%,transparent_25%,transparent_50%,#2C2018_50%,#2C2018_75%,transparent_75%,transparent)] bg-[length:6px_6px]" />
          </div>

          {/* Zone 3: Past Peak / Mellowing */}
          <div
            style={{ width: `${pastPct}%` }}
            className="h-full bg-stone-300/40"
            title={`Mellowing phase (Days ${peakMax}+)`}
          />
        </div>

        {/* Pin Marker on Active Day */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${markerPct}%` }}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
              freshness.phase === 'peak'
                ? 'bg-[#72806B] shadow-[#72806B]/50 ring-2 ring-[#72806B]/30'
                : freshness.phase === 'degassing'
                ? 'bg-[#C26D52] shadow-[#C26D52]/50 animate-pulse'
                : 'bg-stone-500 shadow-stone-500/40'
            }`}
          >
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* Timeline Footnote Legend */}
      {!compact && (
        <div className="flex items-center justify-between text-[8.5px] text-[#A6998E] px-0.5 pt-0.5">
          <span>{t('beandex.timeline_roast')}</span>
          <span className="text-[#5B6A55] font-semibold">
            {t('beandex.timeline_peak_range', { min: degasMin, max: peakMax })}
          </span>
          <span>{t('beandex.timeline_past_range', { day: peakMax })}</span>
        </div>
      )}
    </div>
  );
};
