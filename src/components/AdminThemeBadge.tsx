import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, Sliders, RotateCcw, X } from 'lucide-react';
import {
  cycleNextCardTheme,
  CARD_THEME_REGISTRY,
  useCardAdjustments,
  type CardThemePreset,
} from '../lib/cardThemes';
import { useTranslation, type TranslationKeys } from '../i18n';

interface AdminThemeBadgeProps {
  cardKey:
    | 'barista_deck'
    | 'barista_deck_espresso'
    | 'barista_deck_pourover'
    | 'beandex_banner'
    | 'grinder_fleet'
    | 'espresso_machine'
    | 'filter_gear';
  currentTheme: CardThemePreset;
  isAdminEditMode: boolean;
  onThemeChanged: (next: CardThemePreset) => void;
}

const TINT_PRESETS: { key: TranslationKeys; color: string }[] = [
  { key: 'admin.tint_espresso', color: '#140C08' },
  { key: 'admin.tint_black', color: '#000000' },
  { key: 'admin.tint_warm_amber', color: '#1E130D' },
  { key: 'admin.tint_terracotta', color: '#C26D52' },
  { key: 'admin.tint_forest', color: '#1F2421' },
];

export const AdminThemeBadge: React.FC<AdminThemeBadgeProps> = ({
  cardKey,
  currentTheme,
  isAdminEditMode,
  onThemeChanged,
}) => {
  const { t } = useTranslation();
  const [justSwitched, setJustSwitched] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const inspectorRef = useRef<HTMLDivElement>(null);

  const { adjustments, update, reset, isCustomized } = useCardAdjustments(cardKey);

  // Close inspector on outside click or Escape key
  useEffect(() => {
    if (!isInspectorOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (inspectorRef.current && !inspectorRef.current.contains(e.target as Node)) {
        setIsInspectorOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsInspectorOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInspectorOpen]);

  if (!isAdminEditMode) return null;

  const presets = CARD_THEME_REGISTRY[cardKey] || [];
  const currentIndex = presets.findIndex((p) => p.id === currentTheme.id);
  const positionNumber = currentIndex >= 0 ? currentIndex + 1 : 1;

  const handleCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = cycleNextCardTheme(cardKey);
    onThemeChanged(next);
    setJustSwitched(true);
    setTimeout(() => setJustSwitched(false), 1500);
  };

  const toggleInspector = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInspectorOpen((prev) => !prev);
  };

  return (
    <div className="relative z-30 inline-flex items-center gap-1.5 animate-fadeIn font-mono">
      {/* 1. Theme Preset Switcher */}
      <button
        type="button"
        onClick={handleCycle}
        className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-[#C26D52]/60 hover:border-[#C26D52] text-[#FAF7F2] text-[10px] font-bold flex items-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer"
        title={t('admin.theme_cycle_title')}
      >
        <Palette className="w-3 h-3 text-[#C26D52] shrink-0" />
        <span className="text-[#E8DFD5] font-normal">{t('admin.theme_badge_label', { current: positionNumber, total: presets.length })}</span>
        <strong className="text-white font-bold">{currentTheme.label}</strong>
        {justSwitched ? (
          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : (
          <Sparkles className="w-2.5 h-2.5 text-amber-300 shrink-0 animate-pulse" />
        )}
      </button>

      {/* 2. Direct Background Adjuster Button */}
      <button
        type="button"
        onClick={toggleInspector}
        className={`px-2 py-1 rounded-lg backdrop-blur-md border text-[10px] font-bold flex items-center gap-1 transition shadow-lg active:scale-95 cursor-pointer ${
          isInspectorOpen
            ? 'bg-[#C26D52] border-[#FAF7F2] text-white shadow-[#C26D52]/40'
            : isCustomized
            ? 'bg-amber-950/70 border-amber-400/80 text-amber-200 hover:bg-amber-900/80'
            : 'bg-black/60 hover:bg-black/80 border-[#C26D52]/60 hover:border-[#C26D52] text-[#FAF7F2]'
        }`}
        title={t('admin.theme_adjust_title')}
      >
        <Sliders className="w-3 h-3 text-amber-300 shrink-0" />
        <span>{t('admin.inspector_adjust')}</span>
        {isCustomized && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" title={t('admin.customized')} />
        )}
      </button>

      {/* 3. Filename badge for quick reference */}
      {currentTheme.src && (
        <span className="hidden sm:inline-block text-[9px] text-[#A6998E] bg-black/40 px-1.5 py-0.5 rounded border border-white/10 select-all">
          {currentTheme.src.replace('/images/', '')}
        </span>
      )}

      {/* 4. Floating Backdrop Inspector Popover */}
      {isInspectorOpen && (
        <div
          ref={inspectorRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 z-50 w-80 sm:w-88 p-4 rounded-2xl bg-[#180E09]/95 backdrop-blur-xl border border-[#C26D52]/60 shadow-2xl text-[#FAF7F2] font-sans space-y-3.5 select-none animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#FAF7F2]/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C26D52]/25 border border-[#C26D52]/40 flex items-center justify-center text-[#E58367]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide font-serif">
                  {t('admin.inspector_title')}
                </h4>
                <p className="text-[10px] text-[#D4A373] font-mono">
                  {cardKey} • {isCustomized ? t('admin.customized') : t('admin.default')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              className="p-1 rounded-lg text-[#E8DFD5]/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Slider: Blur */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#E8DFD5] font-medium">{t('admin.inspector_blur')}</span>
              <span className="font-mono text-amber-300 font-bold">{adjustments.blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="16"
              step="1"
              value={adjustments.blur}
              onChange={(e) => update({ blur: Number(e.target.value) })}
              className="w-full accent-[#C26D52] bg-white/15 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-[#D4A373]">
              {[0, 3, 6, 12].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => update({ blur: val })}
                  className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${
                    adjustments.blur === val
                      ? 'bg-[#C26D52] border-white text-white font-bold'
                      : 'bg-black/30 border-white/10 hover:border-white/30 text-[#E8DFD5]'
                  }`}
                >
                  {val}px
                </button>
              ))}
            </div>
          </div>

          {/* Slider: Photo Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#E8DFD5] font-medium">{t('admin.inspector_opacity')}</span>
              <span className="font-mono text-amber-300 font-bold">{adjustments.opacity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={adjustments.opacity}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              className="w-full accent-[#C26D52] bg-white/15 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-[#D4A373]">
              {[50, 75, 85, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => update({ opacity: val })}
                  className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${
                    adjustments.opacity === val
                      ? 'bg-[#C26D52] border-white text-white font-bold'
                      : 'bg-black/30 border-white/10 hover:border-white/30 text-[#E8DFD5]'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Slider: Brightness */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#E8DFD5] font-medium">{t('admin.inspector_brightness')}</span>
              <span className="font-mono text-amber-300 font-bold">{adjustments.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={adjustments.brightness}
              onChange={(e) => update({ brightness: Number(e.target.value) })}
              className="w-full accent-[#C26D52] bg-white/15 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider: Contrast */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#E8DFD5] font-medium">{t('admin.inspector_contrast')}</span>
              <span className="font-mono text-amber-300 font-bold">{adjustments.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={adjustments.contrast}
              onChange={(e) => update({ contrast: Number(e.target.value) })}
              className="w-full accent-[#C26D52] bg-white/15 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Color Tint & Strength */}
          <div className="pt-2 border-t border-[#FAF7F2]/10 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#E8DFD5] font-medium">{t('admin.inspector_tint')}</span>
              <span className="font-mono text-xs font-bold" style={{ color: adjustments.overlayTint }}>
                {adjustments.overlayTint}
              </span>
            </div>

            {/* Tint swatches + Native color picker */}
            <div className="flex items-center gap-2 flex-wrap">
              {TINT_PRESETS.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => update({ overlayTint: p.color })}
                  title={t(p.key)}
                  className={`w-6 h-6 rounded-full border transition cursor-pointer shrink-0 ${
                    adjustments.overlayTint.toLowerCase() === p.color.toLowerCase()
                      ? 'ring-2 ring-[#C26D52] ring-offset-1 ring-offset-[#180E09] border-white scale-110'
                      : 'border-white/30 hover:border-white'
                  }`}
                  style={{ backgroundColor: p.color }}
                />
              ))}

              {/* Native color picker */}
              <label
                className="w-6 h-6 rounded-full border border-white/30 hover:border-white flex items-center justify-center cursor-pointer overflow-hidden bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-400 shrink-0"
                title={t('admin.pick_color')}
              >
                <input
                  type="color"
                  value={adjustments.overlayTint}
                  onChange={(e) => update({ overlayTint: e.target.value })}
                  className="opacity-0 w-0 h-0 cursor-pointer"
                />
              </label>
            </div>

            {/* Overlay Tint Strength Slider */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#E8DFD5]/80">{t('admin.inspector_overlay_opacity')}</span>
                <span className="font-mono text-amber-300 font-bold">{adjustments.overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={adjustments.overlayOpacity}
                onChange={(e) => update({ overlayOpacity: Number(e.target.value) })}
                className="w-full accent-[#C26D52] bg-white/15 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-[#FAF7F2]/10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={reset}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 text-[11px] font-mono text-[#D4A373] flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('admin.inspector_reset')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-[#C26D52] hover:bg-[#B85D43] text-white text-[11px] font-bold transition shadow-md active:scale-95 cursor-pointer"
            >
              {t('admin.inspector_done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThemeBadge;

