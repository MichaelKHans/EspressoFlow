import React from 'react';
import {
  Settings,
  X,
  Thermometer,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Check,
  HelpCircle,
  Coffee,
} from 'lucide-react';
import { useTranslation, type SupportedLanguage } from '../i18n';
import type { TempUnit, UserAccessState } from '../types/espresso';
import { formatTemperature } from '../lib/espressoMath';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempUnit: TempUnit;
  onTempUnitChange: (unit: TempUnit) => void;
  accessState: UserAccessState;
  onOpenPaywall: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms' | 'support') => void;
  onRestorePro?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  tempUnit,
  onTempUnitChange,
  accessState,
  onOpenPaywall,
  onOpenLegal,
  onRestorePro,
}) => {
  const { t, language, setLanguage, supportedLanguages } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      style={{
        paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="bg-[#FFFDF9] border border-[#DECFC0] rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative overflow-hidden my-auto max-h-[calc(100dvh-4.5rem)] overflow-y-auto font-sans animate-modal-pop-in">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#C26D52]/15 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shrink-0 shadow-xs">
              <Settings className="w-4 h-4 text-[#C26D52]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif text-[#2C2018]">
                {t('settings.modal_title')}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono">
                {t('settings.modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#7A6E65] hover:text-[#2C2018] transition shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Temperature Unit Preference (°C / °F) */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" /> {t('settings.temp_unit_label')}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#2C2018] bg-white px-2 py-0.5 rounded-md border border-[#E8DFD5]">
              Active: °{tempUnit}
            </span>
          </div>

          <p className="text-[11px] text-[#7A6E65] leading-relaxed">
            {t('settings.temp_unit_desc')}
          </p>

          {/* Segmented Switcher for °C vs °F */}
          <div className="grid grid-cols-2 gap-2 font-mono">
            <button
              type="button"
              onClick={() => onTempUnitChange('C')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                tempUnit === 'C'
                  ? 'border-[#C26D52] bg-white ring-2 ring-[#C26D52] shadow-xs text-[#2C2018]'
                  : 'border-[#E8DFD5] bg-white/70 hover:bg-white text-[#7A6E65]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {tempUnit === 'C' && <CheckCircle2 className="w-4 h-4 text-[#C26D52]" />}
                <span className="text-sm font-bold">{t('settings.temp_celsius')}</span>
              </div>
              <span className="text-[10px] text-[#7A6E65]">93°C = Golden Standard</span>
            </button>

            <button
              type="button"
              onClick={() => onTempUnitChange('F')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                tempUnit === 'F'
                  ? 'border-[#C26D52] bg-white ring-2 ring-[#C26D52] shadow-xs text-[#2C2018]'
                  : 'border-[#E8DFD5] bg-white/70 hover:bg-white text-[#7A6E65]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {tempUnit === 'F' && <CheckCircle2 className="w-4 h-4 text-[#C26D52]" />}
                <span className="text-sm font-bold">{t('settings.temp_fahrenheit')}</span>
              </div>
              <span className="text-[10px] text-[#7A6E65]">199°F = Golden Standard</span>
            </button>
          </div>

          {/* Live Preview Conversion Pill */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#7A6E65] bg-white/80 p-2 rounded-lg border border-[#E8DFD5]">
            <span>Conversion Reference:</span>
            <span className="font-bold text-[#2C2018]">
              {formatTemperature(93, tempUnit)} (Medium Roast) • {formatTemperature(94, tempUnit)} (Light Roast)
            </span>
          </div>
        </div>

        {/* Section 2: App Language Selection */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> {t('settings.language_label')}
            </span>
            <span className="text-[10px] font-mono text-[#7A6E65]">
              Specialty terms international
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {supportedLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code as SupportedLanguage)}
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#C26D52] bg-white ring-1 ring-[#C26D52] text-[#2C2018] font-bold shadow-2xs'
                      : 'border-[#E8DFD5] bg-white/60 hover:bg-white text-[#7A6E65]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C26D52]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: App Membership & License Status */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#C26D52] tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('settings.membership_label')}
            </span>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                accessState.isProLifetime
                  ? 'bg-[#72806B]/15 text-[#72806B] border-[#72806B]/30'
                  : 'bg-[#C26D52]/10 text-[#C26D52] border-[#C26D52]/30'
              }`}
            >
              {accessState.isProLifetime ? 'LIFETIME UNLOCKED' : `${accessState.daysRemainingInTrial} DAYS LEFT`}
            </span>
          </div>

          <p className="text-[11px] text-[#7A6E65] font-sans leading-relaxed">
            {accessState.isProLifetime
              ? 'Lifetime Pro status is active on this device. Unlimited OCR scale tracking, flow curve telemetri, and Beandex.'
              : 'You are currently on your 7-day free trial. Unlock permanently with a single one-time payment of $4.99 / 49,- DKK.'}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            {!accessState.isProLifetime && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaywall();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Unlock Lifetime ($4.99)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onRestorePro) onRestorePro();
              }}
              className="px-3 py-1.5 rounded-xl border border-[#E8DFD5] bg-white text-[#7A6E65] hover:text-[#2C2018] text-xs font-semibold transition cursor-pointer"
            >
              {t('settings.restore_btn')}
            </button>
          </div>
        </div>

        {/* Section 4: Version & Legal Compliance Links */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-between text-[11px] font-mono text-[#7A6E65] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2C2018]">Flowbean</span> v1.7.3
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.hash = 'admin';
              }}
              className="px-2 py-0.5 rounded-md bg-[#FAF7F2] hover:bg-[#2C2018] hover:text-[#FAF7F2] text-[#7A6E65] border border-[#E8DFD5] transition flex items-center gap-1 text-[10px] cursor-pointer"
              title="Open Admin Coffee Curator Studio"
            >
              <ShieldCheck className="w-3 h-3 text-[#C26D52]" />
              <span>Curator Studio</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegal('terms');
              }}
              className="hover:underline hover:text-[#2C2018] cursor-pointer"
            >
              {t('settings.terms')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegal('privacy');
              }}
              className="hover:underline hover:text-[#2C2018] cursor-pointer"
            >
              {t('settings.privacy')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegal('support');
              }}
              className="hover:underline hover:text-[#2C2018] flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-[#C26D52]" />
              <span>{t('settings.support')}</span>
            </button>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold transition shadow-xs cursor-pointer text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
