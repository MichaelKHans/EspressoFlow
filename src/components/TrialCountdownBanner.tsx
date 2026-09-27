import React from 'react';
import { ShieldAlert, Sparkles, Coffee, Clock, ArrowRight } from 'lucide-react';
import type { UserAccessState } from '../types/espresso';
import { useTranslation } from '../i18n';

interface TrialCountdownBannerProps {
  accessState: UserAccessState;
  onOpenPaywall: () => void;
}

export const TrialCountdownBanner: React.FC<TrialCountdownBannerProps> = ({
  accessState,
  onOpenPaywall,
}) => {
  const { t } = useTranslation();

  // If user is already Lifetime Pro, do not render any banner
  if (accessState.isProLifetime) {
    return null;
  }

  const daysLeft = accessState.daysRemainingInTrial;
  const isExpired = !accessState.isWithinTrial || daysLeft <= 0;
  // Calculate which day of 7 the user is currently on (1 to 7)
  const totalDays = 7;
  const currentDayIndex = isExpired ? 7 : Math.min(totalDays, Math.max(1, totalDays - daysLeft + 1));

  return (
    <aside
      aria-label="Trial status"
      className={`mx-auto max-w-4xl px-2 sm:px-4 mb-3 animate-fadeIn transition-all`}
    >
      <div
        className={`rounded-2xl border p-3 sm:p-3.5 shadow-xs transition-all ${
          isExpired
            ? 'bg-amber-500/10 border-amber-600/40 text-[#2C2018]'
            : 'bg-[#FFFDF9] border-[#C26D52]/30 hover:border-[#C26D52]/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Info, Day Counter & Tactile Segments */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isExpired
                    ? 'bg-red-500/15 text-red-700 border border-red-300'
                    : 'bg-[#C26D52]/10 text-[#C26D52] border border-[#C26D52]/20'
                }`}
              >
                {isExpired ? (
                  <>
                    <ShieldAlert className="w-3 h-3 text-red-600" />
                    <span>Trial Expired</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-[#C26D52]" />
                    <span>
                      {daysLeft === 1
                        ? t('trial.banner_title_one')
                        : t('trial.banner_title', { days: daysLeft })}
                    </span>
                  </>
                )}
              </span>

              {/* 7-Segment Visual Progress Bar */}
              <div
                className="flex items-center gap-1"
                title={
                  isExpired
                    ? '7 of 7 trial days completed'
                    : `Day ${currentDayIndex} of ${totalDays} in free trial`
                }
              >
                {Array.from({ length: totalDays }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isPassed = dayNum < currentDayIndex;
                  const isCurrent = dayNum === currentDayIndex && !isExpired;
                  return (
                    <div
                      key={dayNum}
                      className={`h-2 rounded-full transition-all ${
                        isExpired
                          ? 'w-3.5 bg-red-400/80'
                          : isPassed
                          ? 'w-3.5 bg-[#C26D52]'
                          : isCurrent
                          ? 'w-5 bg-[#C26D52] ring-2 ring-[#C26D52]/30 animate-pulse'
                          : 'w-3.5 bg-[#E8DFD5]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-[#7A6E65] leading-relaxed">
              {isExpired ? t('trial.banner_sub_expired') : t('trial.banner_sub')}
            </p>
          </div>

          {/* Right: Unlock Button CTA */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPaywall}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95 ${
                isExpired
                  ? 'bg-[#2C2018] hover:bg-[#3D2D22]'
                  : 'bg-[#C26D52] hover:bg-[#B05D43]'
              }`}
            >
              {isExpired ? (
                <Coffee className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{t('trial.unlock_now')}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
