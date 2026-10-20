import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';
import { GearImage } from './GearImage';
import { useTranslation } from '../../i18n';
import { loadGearImageOverrides } from '../../lib/storage';

export interface CarouselGearItem {
  id: string;
  name: string;
  brand?: string;
  subCategory?: string;
  image?: string;
  category: 'grinder' | 'machine' | 'brewer' | 'kettle';
  specsSummary?: string;
}

interface GearCardCarouselProps {
  title: string;
  subtitle?: string;
  items: CarouselGearItem[];
  activeIdOrName: string;
  onSelect: (item: CarouselGearItem) => void;
  onRemove: (item: CarouselGearItem) => void;
  onOpenAddModal: () => void;
  addLabel: string;
  isAdminEditMode?: boolean;
  onOpenAdminImageModal?: (item: CarouselGearItem) => void;
}

export const GearCardCarousel: React.FC<GearCardCarouselProps> = ({
  title,
  subtitle,
  items,
  activeIdOrName,
  onSelect,
  onRemove,
  onOpenAddModal,
  addLabel,
  isAdminEditMode = false,
  onOpenAdminImageModal,
}) => {
  const { t } = useTranslation();
  const [overridesVersion, setOverridesVersion] = useState(0);

  useEffect(() => {
    const handleUpdated = () => setOverridesVersion((v) => v + 1);
    window.addEventListener('flowbean_gear_images_updated', handleUpdated);
    return () => {
      window.removeEventListener('flowbean_gear_images_updated', handleUpdated);
    };
  }, []);

  const activeOverrides = React.useMemo(() => {
    // re-evaluate when overridesVersion changes
    return loadGearImageOverrides();
  }, [overridesVersion]);
  return (
    <div className="space-y-2.5 font-mono text-xs">
      {/* Carousel Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[10px] text-[#7A6E65] uppercase font-bold tracking-wider block">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-[#A6998E] font-sans block">
              {subtitle}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#7A6E65] bg-[#FAF7F2] border border-[#D0BDAA] px-2 py-0.5 rounded-lg font-bold">
          {items.length} {items.length === 1 ? t('gear.unit_single') : t('gear.unit_plural')}
        </span>
      </div>

      {/* Horizontal Scrollable Carousel Shelf */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-none snap-x">
        {items.map((item) => {
          const isActive =
            item.id === activeIdOrName ||
            item.name.toLowerCase().trim() === activeIdOrName.toLowerCase().trim();

          const itemKey = item.id.toLowerCase().trim();
          const nameKey = item.name.toLowerCase().trim();
          const hasOverride = Boolean(activeOverrides[itemKey] || activeOverrides[nameKey]);

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`group relative snap-start shrink-0 min-w-[145px] max-w-[155px] sm:min-w-[165px] sm:max-w-[175px] rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'bg-white border-2 border-[#C26D52] shadow-md ring-2 ring-[#C26D52]/15'
                  : 'bg-[#FFFDF9] border border-[#D0BDAA] hover:border-[#C26D52]/70 shadow-2xs hover:shadow-xs opacity-90 hover:opacity-100'
              }`}
            >
              {/* Top Icons: Active Badge & Admin Cam / Discreet Trash Button */}
              <div className="flex items-center justify-between w-full mb-1">
                {isActive ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-[8px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t('gear.active_badge')}</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-[#A6998E] font-sans">
                    {t('gear.select_action')}
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {isAdminEditMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAdminImageModal?.(item);
                      }}
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        hasOverride
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                          : 'bg-[#FAF7F2] text-[#7A6E65] hover:text-[#C26D52] border border-[#D0BDAA] hover:bg-white'
                      }`}
                      title={
                        hasOverride
                          ? 'Aktiv reference-override gemt - klik for at inspicere eller ændre'
                          : 'Admin: Tag/upload foto-reference for denne model'
                      }
                    >
                      <Camera className="w-3 h-3 text-[#C26D52]" />
                      <span>{hasOverride ? 'Ref' : 'Ret'}</span>
                    </button>
                  )}

                  {/* Discreet Trash Button */}
                  {items.length <= 1 && (item.category === 'grinder' || item.category === 'machine') ? (
                    <span
                      className="p-1 text-stone-300 opacity-40 cursor-not-allowed"
                      title={
                        item.category === 'grinder'
                          ? t('gear.min_required_grinder')
                          : t('gear.min_required_machine')
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item);
                      }}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={t('gear.remove_tooltip', { name: item.name })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Hardware Product Image - Maximally fills frame without excessive borders */}
              <div className="h-32 sm:h-36 w-full bg-[#FAF7F2] rounded-xl border border-[#D0BDAA]/40 p-1 flex items-center justify-center overflow-hidden mb-2 group-hover:border-[#C26D52]/50 transition-all">
                <GearImage
                  gearId={item.id}
                  src={item.image}
                  alt={item.name}
                  category={item.category}
                  subType={item.subCategory}
                  className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Model Info */}
              <div className="space-y-0.5">
                <h4
                  className={`text-xs font-bold leading-tight line-clamp-2 ${
                    isActive ? 'text-[#2C2018]' : 'text-[#7A6E65] group-hover:text-[#2C2018]'
                  }`}
                  title={item.name}
                >
                  {item.name}
                </h4>

                <p className="text-[9px] text-[#A6998E] truncate font-sans">
                  {item.specsSummary || item.subCategory || item.brand || ''}
                </p>
              </div>
            </div>
          );
        })}

        {/* The "+ Tilføj" Card at the end of the carousel */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="snap-start shrink-0 min-w-[125px] sm:min-w-[140px] min-h-[210px] sm:min-h-[235px] rounded-2xl border-2 border-dashed border-[#D0BDAA] hover:border-[#C26D52] bg-white/40 hover:bg-white p-3 flex flex-col items-center justify-center gap-2 text-[#7A6E65] hover:text-[#C26D52] transition cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs select-none"
        >
          <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#D0BDAA] flex items-center justify-center text-[#C26D52]">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-center leading-tight">
            {addLabel}
          </span>
        </button>
      </div>
    </div>
  );
};
