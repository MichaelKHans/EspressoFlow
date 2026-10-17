import React, { useState } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import {
  cycleNextCardTheme,
  CARD_THEME_REGISTRY,
  type CardThemePreset,
} from '../lib/cardThemes';

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

export const AdminThemeBadge: React.FC<AdminThemeBadgeProps> = ({
  cardKey,
  currentTheme,
  isAdminEditMode,
  onThemeChanged,
}) => {
  const [justSwitched, setJustSwitched] = useState(false);

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

  return (
    <div className="relative z-30 inline-flex items-center gap-1.5 animate-fadeIn font-mono">
      <button
        type="button"
        onClick={handleCycle}
        className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-[#C26D52]/60 hover:border-[#C26D52] text-[#FAF7F2] text-[10px] font-bold flex items-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer"
        title="Admin: Klik her for at skifte baggrundsbillede på dette kort"
      >
        <Palette className="w-3 h-3 text-[#C26D52] shrink-0" />
        <span className="text-[#E8DFD5] font-normal">Tema ({positionNumber}/{presets.length}):</span>
        <strong className="text-white font-bold">{currentTheme.label}</strong>
        {justSwitched ? (
          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : (
          <Sparkles className="w-2.5 h-2.5 text-amber-300 shrink-0 animate-pulse" />
        )}
      </button>

      {currentTheme.src && (
        <span className="hidden sm:inline-block text-[9px] text-[#A6998E] bg-black/40 px-1.5 py-0.5 rounded border border-white/10 select-all">
          {currentTheme.src.replace('/images/', '')}
        </span>
      )}
    </div>
  );
};

export default AdminThemeBadge;
