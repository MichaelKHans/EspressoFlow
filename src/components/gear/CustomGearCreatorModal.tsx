import React, { useState } from 'react';
import { X, Sparkles, Camera, Check, Upload, Globe } from 'lucide-react';
import type { GearCatalogItem, GearSpecs } from '../../data/gearCatalog';
import { saveGearImageDataUrl } from '../../lib/gearImageStorage';
import { saveCustomGearCatalogItem } from '../../lib/storage';
import { submitCrowdsourcedGear } from '../../lib/supabase';
import type { BrewPhysics } from '../../lib/brewPhysics';

interface CustomGearCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'machine' | 'grinder' | 'brewer' | 'kettle';
  onCreated: (item: GearCatalogItem) => void;
}

export const CustomGearCreatorModal: React.FC<CustomGearCreatorModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'machine',
  onCreated,
}) => {
  const [category, setCategory] = useState<'machine' | 'grinder' | 'brewer' | 'kettle'>(defaultCategory);

  // Common Fields
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [shareWithCommunity, setShareWithCommunity] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Machine Fields
  const [basketDiameterMm, setBasketDiameterMm] = useState<number>(58);
  const [isCustomDiameter, setIsCustomDiameter] = useState(false);
  const [customDiameterValue, setCustomDiameterValue] = useState('58');
  const [basketType, setBasketType] = useState<'precision' | 'standard' | 'pressurized'>('precision');
  const [boilerType, setBoilerType] = useState<'Single Boiler' | 'Dual Boiler' | 'Heat Exchanger (HX)' | 'Thermoblock' | 'Lever / Manuel'>('Single Boiler');
  const [pumpBar, setPumpBar] = useState<number>(9.0);
  const [preInfusionSeconds, setPreInfusionSeconds] = useState<number>(4.0);
  const [tempControl, setTempControl] = useState<'pid' | 'stepped' | 'fixed'>('pid');

  // Grinder Fields
  const [burrType, setBurrType] = useState<'Conical' | 'Flat'>('Conical');
  const [burrSizeMm, setBurrSizeMm] = useState<number>(40);
  const [stepType, setStepType] = useState<'stepped' | 'stepless'>('stepped');
  const [minSetting, setMinSetting] = useState<number>(1.0);
  const [maxSetting, setMaxSetting] = useState<number>(40.0);
  const [espressoMaxSetting, setEspressoMaxSetting] = useState<number>(40.0);
  const [hasEspressoZoneSplit, setHasEspressoZoneSplit] = useState(false);

  // Brewer Fields
  const [brewPhysicsClass, setBrewPhysicsClass] = useState<BrewPhysics>('percolation');
  const [defaultCapacityMl, setDefaultCapacityMl] = useState<number>(300);

  // Kettle Fields
  const [isGooseneck, setIsGooseneck] = useState(true);
  const [kettleHasPid, setKettleHasPid] = useState(true);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FAF7F2';
          ctx.fillRect(0, 0, 600, 600);

          const maxDim = Math.max(img.width, img.height);
          const scale = (600 * 0.94) / maxDim;
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (600 - drawW) / 2;
          const drawY = (600 - drawH) / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          const compressed = canvas.toDataURL('image/webp', 0.88);
          setPhotoPreview(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !modelName.trim()) return;

    setIsSubmitting(true);
    const fullName = `${brand.trim()} ${modelName.trim()}`;
    const gearId = `custom-${category}-${Date.now()}`;

    const effectiveBasketDiameter = isCustomDiameter ? (parseFloat(customDiameterValue) || 58) : basketDiameterMm;

    const specs: GearSpecs = {
      isCustom: true,
      defaultCapacityMl: category === 'brewer' ? defaultCapacityMl : (category === 'kettle' ? 900 : undefined),
    };

    if (category === 'machine') {
      specs.basketDiameterMm = effectiveBasketDiameter;
      specs.basketType = basketType;
      specs.boilerType = boilerType;
      specs.pumpBar = pumpBar;
      specs.defaultPreInfusionSeconds = preInfusionSeconds;
      specs.preInfusionControl = preInfusionSeconds > 0 ? 'adjustable' : 'none';
      specs.tempControl = tempControl;
      specs.defaultTempC = 93.0;
      specs.physicsClass = basketType === 'pressurized' ? 'pressurized_basket' : (boilerType.includes('Manuel') ? 'manual_espresso' : 'pump_espresso');
    } else if (category === 'grinder') {
      specs.burrType = `${burrSizeMm}mm ${burrType}`;
      specs.burrSizeMm = burrSizeMm;
      specs.stepType = stepType;
      specs.minSetting = minSetting;
      specs.maxSetting = maxSetting;
      specs.espressoMaxSetting = hasEspressoZoneSplit ? espressoMaxSetting : maxSetting;
      specs.stepUnit = stepType === 'stepped' ? 'steps' : 'dial marks';
      specs.defaultSetting = ((minSetting + maxSetting) / 3).toFixed(1);
    } else if (category === 'brewer') {
      specs.physicsClass = brewPhysicsClass;
      specs.defaultCapacityMl = defaultCapacityMl;
    } else if (category === 'kettle') {
      specs.tempControl = kettleHasPid ? 'pid' : 'fixed';
      specs.defaultTempC = 93.0;
    }

    const customItem: GearCatalogItem = {
      id: gearId,
      name: fullName,
      brand: brand.trim(),
      category,
      subCategory: category === 'machine'
        ? `${effectiveBasketDiameter}mm • ${boilerType}`
        : category === 'grinder'
        ? `${burrSizeMm}mm ${burrType} (${stepType})`
        : category === 'brewer'
        ? `${brewPhysicsClass}`
        : `${isGooseneck ? 'Gooseneck' : 'Kettle'}`,
      image: photoPreview || '',
      description: description.trim() || `Brugerdefineret ${category} tilføjet af bruger`,
      specs,
    };

    // 1. Store private photo in high-capacity IndexedDB
    if (photoPreview) {
      await saveGearImageDataUrl(gearId, photoPreview, { gearName: fullName, isCustomUserPhoto: true });
    }

    // 2. Persist custom catalog entry in local storage
    saveCustomGearCatalogItem(customItem);

    // 3. Crowdsource specs to community queue in Supabase (WITHOUT private photo)
    if (shareWithCommunity) {
      void submitCrowdsourcedGear({
        brand: brand.trim(),
        model: modelName.trim(),
        category,
        subCategory: customItem.subCategory,
        specs,
        notes: description.trim() || undefined,
      });
    }

    setIsSubmitting(false);
    onCreated(customItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-mono text-xs">
      <div className="bg-[#FFFDF9] w-full max-w-xl max-h-[90vh] rounded-3xl border border-[#D0BDAA] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D0BDAA] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A6E65]">
                Flowbean Gear Studio
              </span>
              <h3 className="text-base font-bold text-[#2C2018] font-serif">
                Opret eget udstyr
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Category Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-[#2C2018] uppercase tracking-wider mb-1.5">
              Udstyrstype
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#FAF7F2] rounded-2xl border border-[#D0BDAA]">
              {(['machine', 'grinder', 'brewer', 'kettle'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold transition cursor-pointer capitalize ${
                    category === cat
                      ? 'bg-[#2C2018] text-[#FAF7F2] shadow-xs'
                      : 'text-[#7A6E65] hover:text-[#2C2018]'
                  }`}
                >
                  {cat === 'machine' ? 'Maskine' : cat === 'grinder' ? 'Kværn' : cat === 'brewer' ? 'Brygger' : 'Kedel'}
                </button>
              ))}
            </div>
          </div>

          {/* Photo & Identity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center p-3 rounded-2xl bg-[#FAF7F2] border border-[#D0BDAA]">
            <div className="sm:col-span-1 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#D0BDAA] bg-white flex items-center justify-center overflow-hidden relative group">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-[#7A6E65] p-2 text-center">
                    <Camera className="w-6 h-6 mb-1 text-[#C26D52]" />
                    <span className="text-[9px]">Tag / Vælg foto</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition">
                  <Upload className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[9px] text-[#7A6E65] mt-1 text-center">
                Gemmes lokalt på enheden
              </span>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-[#7A6E65] uppercase">Mærke / Producent</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="fx Sage, Gaggia, Baratza, Lelit"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7A6E65] uppercase">Modelnavn</label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="fx Classic Pro, DF64 Gen 2, Switch"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7A6E65] uppercase">Beskrivelse / Noter</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="fx Hjemmemaskine med præcisionskurv"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC SPECS: MACHINE */}
          {category === 'machine' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-[#D0BDAA]">
              <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-1.5">
                <span className="font-bold text-[11px] text-[#2C2018] uppercase tracking-wider">
                  Maskinspecifikationer (Væskemekanik)
                </span>
                <span className="text-[10px] text-[#C26D52] font-semibold">Darcy-Ergun Flow</span>
              </div>

              {/* Basket Diameter */}
              <div>
                <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                  Portafilter / Kurvestørrelse (mm)
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                  {[58, 54, 52, 51].map((mm) => (
                    <button
                      key={mm}
                      type="button"
                      onClick={() => {
                        setBasketDiameterMm(mm);
                        setIsCustomDiameter(false);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        !isCustomDiameter && basketDiameterMm === mm
                          ? 'bg-[#2C2018] text-white border-[#2C2018]'
                          : 'bg-[#FAF7F2] text-[#2C2018] border-[#D0BDAA] hover:bg-stone-100'
                      }`}
                    >
                      {mm} mm
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomDiameter(true)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] border transition cursor-pointer ${
                      isCustomDiameter
                        ? 'bg-[#2C2018] text-white border-[#2C2018]'
                        : 'bg-[#FAF7F2] text-[#7A6E65] border-[#D0BDAA]'
                    }`}
                  >
                    Anden diameter
                  </button>
                  {isCustomDiameter && (
                    <input
                      type="number"
                      step="0.5"
                      min="40"
                      max="65"
                      value={customDiameterValue}
                      onChange={(e) => setCustomDiameterValue(e.target.value)}
                      className="w-20 px-2 py-1 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                    />
                  )}
                  <span className="text-[9px] text-[#7A6E65]">
                    58mm = standard E61, 54mm = Sage, 51mm = Dedica
                  </span>
                </div>
              </div>

              {/* Basket Type */}
              <div>
                <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                  Kurvetype
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBasketType('precision')}
                    className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                      basketType === 'precision'
                        ? 'border-[#2C2018] bg-[#FAF7F2] font-bold'
                        : 'border-[#D0BDAA] text-[#7A6E65]'
                    }`}
                  >
                    <div className="text-[#2C2018]">Standard / Præcisionskurv</div>
                    <div className="text-[9px] text-[#7A6E65]">Ikke-tryksat (Puckmodstand styrer flow)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasketType('pressurized')}
                    className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                      basketType === 'pressurized'
                        ? 'border-[#2C2018] bg-[#FAF7F2] font-bold'
                        : 'border-[#D0BDAA] text-[#7A6E65]'
                    }`}
                  >
                    <div className="text-[#2C2018]">Tryksat Ventilkurv (Dual Wall)</div>
                    <div className="text-[9px] text-[#7A6E65]">Ventil i bunden styrer flow</div>
                  </button>
                </div>
              </div>

              {/* Boiler & Pump */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Kedel / Varmesystem
                  </label>
                  <select
                    value={boilerType}
                    onChange={(e) => setBoilerType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                  >
                    <option value="Single Boiler">Single Boiler</option>
                    <option value="Dual Boiler">Dual Boiler</option>
                    <option value="Heat Exchanger (HX)">Heat Exchanger (HX)</option>
                    <option value="Thermoblock">Thermoblock</option>
                    <option value="Lever / Manuel">Lever / Manuel (Picopresso, Flair, Robot)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Pre-infusion (sekunder)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={preInfusionSeconds}
                    onChange={(e) => setPreInfusionSeconds(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Pumpetryk (bar)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    value={pumpBar}
                    onChange={(e) => setPumpBar(parseFloat(e.target.value) || 9.0)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Temperaturstyring
                  </label>
                  <select
                    value={tempControl}
                    onChange={(e) => setTempControl(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                  >
                    <option value="pid">Digital PID</option>
                    <option value="stepped">Trinvis kontakt</option>
                    <option value="fixed">Fast termostat</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC SPECS: GRINDER */}
          {category === 'grinder' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-[#D0BDAA]">
              <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-1.5">
                <span className="font-bold text-[11px] text-[#2C2018] uppercase tracking-wider">
                  Kværnspecifikationer (Dial-In Motor)
                </span>
                <span className="text-[10px] text-[#C26D52] font-semibold">Bayesian Grinder Model</span>
              </div>

              {/* Burr type & size */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Knivtype
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Conical', 'Flat'] as const).map((bt) => (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setBurrType(bt)}
                        className={`py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                          burrType === bt
                            ? 'bg-[#2C2018] text-white border-[#2C2018]'
                            : 'bg-[#FAF7F2] text-[#2C2018] border-[#D0BDAA]'
                        }`}
                      >
                        {bt === 'Conical' ? 'Konisk' : 'Flad'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Knivdiameter (mm)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="120"
                    value={burrSizeMm}
                    onChange={(e) => setBurrSizeMm(parseInt(e.target.value) || 40)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                  />
                </div>
              </div>

              {/* Stepped vs Stepless */}
              <div>
                <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                  Justeringstype
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStepType('stepped')}
                    className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                      stepType === 'stepped'
                        ? 'border-[#2C2018] bg-[#FAF7F2] font-bold'
                        : 'border-[#D0BDAA] text-[#7A6E65]'
                    }`}
                  >
                    <div className="text-[#2C2018]">Trinvis (Stepped)</div>
                    <div className="text-[9px] text-[#7A6E65]">Tydelige klik/trin (fx Baratza, Comandante)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepType('stepless')}
                    className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                      stepType === 'stepless'
                        ? 'border-[#2C2018] bg-[#FAF7F2] font-bold'
                        : 'border-[#D0BDAA] text-[#7A6E65]'
                    }`}
                  >
                    <div className="text-[#2C2018]">Trinløs (Stepless)</div>
                    <div className="text-[9px] text-[#7A6E65]">Mikrometrisk drejeknap (fx Eureka, Niche)</div>
                  </button>
                </div>
              </div>

              {/* Scale Min / Max */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Laveste indstilling
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={minSetting}
                    onChange={(e) => setMinSetting(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                    Højeste indstilling
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxSetting}
                    onChange={(e) => setMaxSetting(parseFloat(e.target.value) || 40)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                  />
                </div>
              </div>

              {/* Dual-zone Espresso Split */}
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D0BDAA] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEspressoZoneSplit}
                    onChange={(e) => setHasEspressoZoneSplit(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C26D52] accent-[#C26D52]"
                  />
                  <span className="text-[11px] font-bold text-[#2C2018]">
                    Delt skala (fx Baratza ESP med 1-40 espresso, 41-60 filter)
                  </span>
                </label>
                {hasEspressoZoneSplit && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                      Maksimal espresso-indstilling
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={espressoMaxSetting}
                      onChange={(e) => setEspressoMaxSetting(parseFloat(e.target.value) || 40)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC SPECS: BREWER */}
          {category === 'brewer' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-[#D0BDAA]">
              <span className="font-bold text-[11px] text-[#2C2018] uppercase tracking-wider block border-b border-[#EAE2D8] pb-1.5">
                Bryggertype & Væskemekanik
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'percolation', label: 'Percolation (Gravity)', sub: 'V60, Kalita, Chemex, Orea' },
                  { id: 'immersion', label: 'Immersion (Steep)', sub: 'French Press, Clever, Switch' },
                  { id: 'immersion_pressure', label: 'Immersion + Tryk', sub: 'AeroPress, Delter Press' },
                  { id: 'moka', label: 'Moka Pot / Damp', sub: 'Bialetti Moka / Brikka' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBrewPhysicsClass(item.id as BrewPhysics)}
                    className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                      brewPhysicsClass === item.id
                        ? 'border-[#2C2018] bg-[#FAF7F2] font-bold'
                        : 'border-[#D0BDAA] text-[#7A6E65]'
                    }`}
                  >
                    <div className="text-[#2C2018]">{item.label}</div>
                    <div className="text-[9px] text-[#7A6E65]">{item.sub}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7A6E65] uppercase mb-1">
                  Kapacitet (ml)
                </label>
                <input
                  type="number"
                  min="100"
                  max="2000"
                  step="50"
                  value={defaultCapacityMl}
                  onChange={(e) => setDefaultCapacityMl(parseInt(e.target.value) || 300)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#D0BDAA] bg-white text-xs text-[#2C2018]"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC SPECS: KETTLE */}
          {category === 'kettle' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-[#D0BDAA]">
              <span className="font-bold text-[11px] text-[#2C2018] uppercase tracking-wider block border-b border-[#EAE2D8] pb-1.5">
                Kedelkontrol
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsGooseneck(true)}
                  className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                    isGooseneck ? 'border-[#2C2018] bg-[#FAF7F2] font-bold' : 'border-[#D0BDAA] text-[#7A6E65]'
                  }`}
                >
                  <div className="text-[#2C2018]">Svanehals (Gooseneck)</div>
                  <div className="text-[9px] text-[#7A6E65]">Præcisionshældning</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGooseneck(false)}
                  className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                    !isGooseneck ? 'border-[#2C2018] bg-[#FAF7F2] font-bold' : 'border-[#D0BDAA] text-[#7A6E65]'
                  }`}
                >
                  <div className="text-[#2C2018]">Almindelig Hældetud</div>
                  <div className="text-[9px] text-[#7A6E65]">Standard køkkenkedel</div>
                </button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-[#FAF7F2] rounded-xl border border-[#D0BDAA]">
                <input
                  type="checkbox"
                  checked={kettleHasPid}
                  onChange={(e) => setKettleHasPid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C26D52] accent-[#C26D52]"
                />
                <span className="text-xs text-[#2C2018] font-bold">
                  Digital PID variabel temperaturstyring
                </span>
              </label>
            </div>
          )}

          {/* Privacy & Crowdsourcing Notice */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={shareWithCommunity}
                onChange={(e) => setShareWithCommunity(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#C26D52] accent-[#C26D52]"
              />
              <div>
                <div className="text-xs font-bold text-[#2C2018] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#C26D52]" />
                  <span>Bidrag anonymt med udstyrs-specifikationer til fællesskabet</span>
                </div>
                <p className="text-[10px] text-[#7A6E65] mt-0.5 leading-relaxed">
                  Dit foto forbliver 100% privat på din mobil. Kun brand, model og de tekniske data
                  sendes anonymt til Supabase, så andre baristaer med samme udstyr kan få glæde af det.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#D0BDAA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-bold cursor-pointer"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !brand.trim() || !modelName.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 active:scale-95 transition"
            >
              <Check className="w-4 h-4 text-[#C26D52]" />
              <span>{isSubmitting ? 'Gemmer...' : 'Opret & Tilføj til setup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
