import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Check, Sparkles, Camera } from 'lucide-react';
import {
  GRINDER_CATALOG,
  MACHINE_CATALOG,
  BREWER_CATALOG,
  KETTLE_CATALOG,
} from '../../data/gearCatalog';
import type { GearCatalogItem } from '../../data/gearCatalog';
import { GearImage } from './GearImage';
import { useTranslation } from '../../i18n';
import { loadGearImageOverrides } from '../../lib/storage';

interface AddGearModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'grinder' | 'machine' | 'brewer' | 'kettle';
  onAddGear: (item: GearCatalogItem) => void;
  existingNames: string[];
  isAdminEditMode?: boolean;
  onOpenAdminImageModal?: (item: GearCatalogItem) => void;
}

export const AddGearModal: React.FC<AddGearModalProps> = ({
  isOpen,
  onClose,
  category,
  onAddGear,
  existingNames,
  isAdminEditMode = false,
  onOpenAdminImageModal,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [overridesVersion, setOverridesVersion] = useState(0);

  useEffect(() => {
    const handleUpdated = () => setOverridesVersion((v) => v + 1);
    window.addEventListener('flowbean_gear_images_updated', handleUpdated);
    return () => {
      window.removeEventListener('flowbean_gear_images_updated', handleUpdated);
    };
  }, []);

  const activeOverrides = React.useMemo(() => {
    return loadGearImageOverrides();
  }, [overridesVersion]);

  if (!isOpen) return null;

  let catalog: GearCatalogItem[] = [];
  let categoryTitle = '';

  if (category === 'grinder') {
    catalog = GRINDER_CATALOG;
    categoryTitle = t('gear.catalog_select_grinder');
  } else if (category === 'machine') {
    catalog = MACHINE_CATALOG;
    categoryTitle = t('gear.catalog_select_machine');
  } else if (category === 'brewer') {
    catalog = BREWER_CATALOG;
    categoryTitle = t('gear.catalog_select_brewer');
  } else if (category === 'kettle') {
    catalog = KETTLE_CATALOG;
    categoryTitle = t('gear.catalog_select_kettle');
  }

  const filtered = catalog.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(q))
    );
  });

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const customItem: GearCatalogItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: 'Custom',
      category,
      subCategory: 'Brugerdefineret model',
      image: '',
      description: 'Manuelt tilføjet model',
      specs: {},
    };
    onAddGear(customItem);
    setCustomName('');
    setShowCustomInput(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-mono text-xs">
      <div className="bg-[#FFFDF9] w-full max-w-xl max-h-[85vh] rounded-3xl border border-[#D0BDAA] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#D0BDAA] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A6E65]">
                {t('gear.catalog_header')}
              </span>
              <h3 className="text-base font-bold text-[#2C2018] font-serif">
                {categoryTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#D0BDAA] bg-white text-[#7A6E65] hover:text-[#2C2018] hover:border-[#2C2018] flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-[#D0BDAA]/60 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6E65]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('gear.catalog_search_placeholder')}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D0BDAA] bg-[#FAF7F2] text-xs text-[#2C2018] placeholder-[#7A6E65]/60 focus:outline-none focus:border-[#C26D52] shadow-2xs"
            />
          </div>
        </div>

        {/* Catalog Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filtered.map((item) => {
            const isAlreadyInSetup = existingNames.some(
              (n) => n.toLowerCase().trim() === item.name.toLowerCase().trim()
            );
            const itemKey = item.id.toLowerCase().trim();
            const nameKey = item.name.toLowerCase().trim();
            const hasOverride = Boolean(activeOverrides[itemKey] || activeOverrides[nameKey]);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#D0BDAA] p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-[#C26D52] transition-colors"
              >
                {/* Gear Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-[#FAF7F2] rounded-xl border border-[#D0BDAA]/60 p-1 flex items-center justify-center overflow-hidden">
                  <GearImage
                    gearId={item.id}
                    src={item.image}
                    alt={item.name}
                    category={item.category}
                    subType={item.subCategory}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] uppercase font-bold text-[#C26D52]">
                      {item.brand}
                    </span>
                    <span className="text-[9px] text-[#7A6E65]">●</span>
                    <span className="text-[9px] text-[#7A6E65] truncate font-mono">
                      {item.subCategory}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#2C2018] truncate mt-0.5">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-[#7A6E65] line-clamp-2 mt-0.5 font-sans leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Action button */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {isAdminEditMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAdminImageModal?.(item);
                      }}
                      className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                        hasOverride
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                          : 'bg-[#FAF7F2] text-[#7A6E65] hover:text-[#C26D52] border-[#D0BDAA] hover:bg-white'
                      }`}
                      title="Admin: Tag/upload foto-reference for denne model"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#C26D52]" />
                      <span>{hasOverride ? 'Ref' : 'Ret'}</span>
                    </button>
                  )}

                  {isAlreadyInSetup ? (
                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">{t('gear.catalog_already_in_setup')}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onAddGear(item);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('gear.catalog_add_btn')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-[#7A6E65] space-y-2">
              <p>{t('gear.catalog_no_match', { query: search })}</p>
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="text-xs text-[#C26D52] font-bold underline cursor-pointer"
              >
                {t('gear.catalog_create_custom_prompt', { query: search })}
              </button>
            </div>
          )}
        </div>

        {/* Custom Gear Option in Bottom Footer */}
        <div className="p-3 sm:p-4 border-t border-[#D0BDAA] bg-[#FAF7F2]">
          {showCustomInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t('gear.catalog_custom_placeholder')}
                className="flex-1 px-3 py-2 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3.5 py-2 rounded-xl bg-[#2C2018] text-white font-bold cursor-pointer hover:bg-[#3D2D22] shrink-0"
              >
                {t('gear.catalog_add_btn')}
              </button>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="px-2 py-2 text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
              >
                {t('gear.catalog_custom_cancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full py-2 rounded-xl border border-dashed border-[#D0BDAA] text-[#7A6E65] hover:text-[#2C2018] hover:border-[#2C2018] text-xs font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C26D52]" />
              <span>{t('gear.catalog_missing_custom_btn')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
