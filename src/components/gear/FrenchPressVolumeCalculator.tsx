import React, { useState, useEffect } from 'react';
import { Coffee, Droplets, Clock, Flame } from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  loadFrenchPressSettings,
  saveFrenchPressSettings,
  type FrenchPressSettings,
} from '../../lib/storage';

export const FrenchPressVolumeCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<FrenchPressSettings>(() =>
    loadFrenchPressSettings()
  );

  useEffect(() => {
    saveFrenchPressSettings(settings);
  }, [settings]);

  const updateWater = (ml: number) => {
    const valid = Math.min(1500, Math.max(150, Math.round(ml)));
    setSettings((prev) => ({ ...prev, waterMl: valid }));
  };

  const updateRatio = (ratio: number) => {
    setSettings((prev) => ({ ...prev, ratio }));
  };

  // Golden French Press Math
  // Dose = Water / Ratio
  const doseGrams = Math.round((settings.waterMl / settings.ratio) * 10) / 10;

  return (
    <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#D0BDAA] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="w-4 h-4 text-[#C26D52]" />
          <span className="text-xs uppercase font-bold tracking-wider text-[#2C2018]">
            {t('french_press.title')}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C26D52]/10 text-[#C26D52] border border-[#C26D52]/20">
          {t('french_press.full_immersion')}
        </span>
      </div>

      <p className="text-[11px] text-[#7A6E65] font-sans">
        {t('french_press.subtitle')}
      </p>

      {/* 3 Standard Carafe Quick-Selectors */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <button
          type="button"
          onClick={() => updateWater(350)}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
            settings.waterMl === 350
              ? 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018] shadow-xs font-bold'
              : 'bg-white text-[#2C2018] border-[#D0BDAA] hover:border-[#C26D52]'
          }`}
        >
          <span className="font-bold text-sm">350 ml</span>
          <span className="text-[9px] opacity-75 mt-0.5">{t('french_press.size_small')}</span>
        </button>

        <button
          type="button"
          onClick={() => updateWater(500)}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
            settings.waterMl === 500
              ? 'bg-[#C26D52] text-white border-[#C26D52] shadow-xs font-bold'
              : 'bg-white text-[#2C2018] border-[#D0BDAA] hover:border-[#C26D52]'
          }`}
        >
          <span className="font-bold text-sm">500 ml</span>
          <span className="text-[9px] opacity-90 mt-0.5">{t('french_press.size_medium')}</span>
        </button>

        <button
          type="button"
          onClick={() => updateWater(1000)}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
            settings.waterMl === 1000
              ? 'bg-[#2C2018] text-[#FAF7F2] border-[#2C2018] shadow-xs font-bold'
              : 'bg-white text-[#2C2018] border-[#D0BDAA] hover:border-[#C26D52]'
          }`}
        >
          <span className="font-bold text-sm">1000 ml</span>
          <span className="text-[9px] opacity-75 mt-0.5">{t('french_press.size_large')}</span>
        </button>
      </div>

      {/* Stepper & Slider for Fine Adjustment */}
      <div className="bg-white p-3 rounded-xl border border-[#D0BDAA] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-600" />
          <div>
            <span className="text-[10px] text-[#7A6E65] uppercase block font-bold">{t('french_press.water_volume')}</span>
            <span className="text-lg font-bold font-mono text-[#2C2018]">{settings.waterMl} ml</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateWater(settings.waterMl - 50)}
            className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#D0BDAA] text-[#2C2018] font-bold hover:border-[#C26D52] active:scale-95 transition flex items-center justify-center cursor-pointer"
            title="Minus 50 ml"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => updateWater(settings.waterMl + 50)}
            className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#D0BDAA] text-[#2C2018] font-bold hover:border-[#C26D52] active:scale-95 transition flex items-center justify-center cursor-pointer"
            title="Plus 50 ml"
          >
            +
          </button>
        </div>
      </div>

      {/* Dynamic Recommended Dose Result Hero Card */}
      <div className="bg-[#2C2018] text-[#FAF7F2] p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4A373]">
            {t('french_press.recommended_dose', { ratio: settings.ratio })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateRatio(14.0)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition ${
                settings.ratio === 14.0 ? 'bg-[#C26D52] text-white font-bold' : 'bg-black/30 text-stone-300'
              }`}
              title={t('french_press.ratio_strong')}
            >
              {t('french_press.ratio_strong')}
            </button>
            <button
              type="button"
              onClick={() => updateRatio(15.0)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition ${
                settings.ratio === 15.0 ? 'bg-[#C26D52] text-white font-bold' : 'bg-black/30 text-stone-300'
              }`}
              title={t('french_press.ratio_golden')}
            >
              {t('french_press.ratio_golden')}
            </button>
            <button
              type="button"
              onClick={() => updateRatio(16.0)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition ${
                settings.ratio === 16.0 ? 'bg-[#C26D52] text-white font-bold' : 'bg-black/30 text-stone-300'
              }`}
              title={t('french_press.ratio_mild')}
            >
              {t('french_press.ratio_mild')}
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
              {doseGrams.toFixed(1)}g
            </span>
            <span className="text-xs text-[#D8CDC4] font-sans">{t('french_press.coarse_ground')}</span>
          </div>

          <div className="text-right text-[10px] font-mono text-[#D8CDC4]">
            <span>{t('french_press.water_label', { amount: settings.waterMl })}</span>
          </div>
        </div>

        {/* Barista Brew Guidelines */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-stone-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('french_press.steep_time')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-300">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('french_press.water_temp')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
