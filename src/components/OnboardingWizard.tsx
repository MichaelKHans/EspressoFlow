import React, { useState } from 'react';
import { Coffee, ChevronRight, Check, Settings2, Layers, ArrowRight, X, Barcode, Sparkles } from 'lucide-react';
import type { GrinderProfile, RoastLevel, CoffeeBeanProfile } from '../types/espresso';
import { BeanScannerModal } from './BeanScannerModal';
import { useTranslation } from '../i18n';

interface OnboardingWizardProps {
  grinders: GrinderProfile[];
  onComplete: (setup: OnboardingResult) => void;
  onSkip?: () => void;
}

export interface OnboardingResult {
  grinderId: string;
  beanName: string;
  roaster: string;
  roastLevel: RoastLevel;
  roastDate: string;
  machineName: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  grinders,
  onComplete,
  onSkip,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Grinder
  const [selectedGrinderId, setSelectedGrinderId] = useState<string>(grinders[0]?.id || '');

  // Step 2: Machine
  const COMMON_MACHINES = [
    "De'Longhi Dedica (EC680 / EC685 / EC885)",
    "De'Longhi La Specialista",
    'Sage Dual Boiler',
    'Sage Barista Express',
    'Sage Barista Pro',
    'Sage Bambino / Bambino Plus',
    'Gaggia Classic Pro / Evo',
    'Rancilio Silvia / Silvia Pro X',
    'Lelit Bianca V3',
    'Lelit MaraX',
    'Lelit Anna PL41EM',
    'ECM Mechanika V Slim',
    'ECM Classika PID',
    'Profitec Pro 300 / Pro 500 / GO',
    'La Marzocco Linea Micra / Mini',
    'Rocket Appartamento',
    'Ascaso Dream PID / Steel Duo',
    'Flair 58 / Flair Pro 2',
    'Cafelat Robot',
    'Manual Lever Press',
    'Other',
  ];
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [customMachine, setCustomMachine] = useState<string>('');

  // Step 3: First Bean
  const [beanName, setBeanName] = useState<string>('');
  const [roaster, setRoaster] = useState<string>('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('medium');
  const [roastDate, setRoastDate] = useState<string>(
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  const handleScannedBean = (scanned: CoffeeBeanProfile) => {
    setBeanName(scanned.name);
    if (scanned.roaster) setRoaster(scanned.roaster);
    setRoastLevel(scanned.roastLevel);
    setRoastDate(scanned.roastDate);
    setScannedFeedback(t('wizard.scanned_feedback', { name: scanned.name }));
    setIsScannerOpen(false);
  };

  const handleFinish = () => {
    const machine = selectedMachine === 'Other' ? customMachine : selectedMachine;
    onComplete({
      grinderId: selectedGrinderId,
      beanName: beanName || 'My First Bean',
      roaster: roaster || '',
      roastLevel,
      roastDate,
      machineName: machine || 'Espresso Machine',
    });
  };

  const canProceedStep1 = selectedGrinderId !== '';
  const canProceedStep2 = selectedMachine !== '' && (selectedMachine !== 'Other' || customMachine.trim() !== '');
  const canFinish = beanName.trim() !== '';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2C2018]/80 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="bg-[#FAF7F2] rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-lg border border-[#DECFC0] max-h-[calc(100dvh-4.5rem)] flex flex-col animate-modal-pop-in">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E8DFD5] shrink-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#2C2018] flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5 text-[#C26D52]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2018] font-mono tracking-tight">
                  {t('wizard.welcome_title')}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono">
                  {t('wizard.welcome_subtitle')}
                </p>
              </div>
            </div>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs font-mono text-[#7A6E65] hover:text-[#2C2018] px-2.5 py-1.5 rounded-xl hover:bg-[#E8DFD5]/50 border border-[#E8DFD5] bg-white transition flex items-center gap-1 shrink-0"
                title={t('wizard.skip_title')}
              >
                <span>{t('wizard.skip')}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                    s < step
                      ? 'bg-[#72806B] text-white'
                      : s === step
                      ? 'bg-[#C26D52] text-white ring-2 ring-[#C26D52]/30'
                      : 'bg-[#E8DFD5] text-[#7A6E65]'
                  }`}
                >
                  {s < step ? <Check className="w-3 h-3" /> : s}
                </div>
                <span className={`text-[10px] font-mono hidden sm:inline ${
                  s === step ? 'text-[#2C2018] font-bold' : 'text-[#7A6E65]'
                }`}>
                  {s === 1 ? t('wizard.step1_label') : s === 2 ? t('wizard.step2_label') : t('wizard.step3_label')}
                </span>
                {s < 3 && (
                  <div className={`flex-1 h-px ${s < step ? 'bg-[#72806B]' : 'bg-[#E8DFD5]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* STEP 1: Select Grinder */}
          {step === 1 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#C26D52]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#2C2018] font-mono">
                  {t('wizard.step1_title')}
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono leading-relaxed">
                {t('wizard.step1_desc')}
              </p>

              <div className="grid grid-cols-1 gap-1.5 max-h-[45vh] overflow-y-auto pr-1">
                {grinders.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrinderId(g.id)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition text-xs font-mono flex items-center justify-between gap-2 ${
                      selectedGrinderId === g.id
                        ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20'
                        : 'border-[#E8DFD5] bg-white hover:border-[#C26D52]/40'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-[#2C2018]">{g.name}</span>
                      <span className="text-[10px] text-[#7A6E65] ml-2">
                        {g.type === 'stepped' ? t('wizard.grinder_stepped') : t('wizard.grinder_stepless')} -- {g.stepUnit}
                      </span>
                    </div>
                    {selectedGrinderId === g.id && (
                      <Check className="w-4 h-4 text-[#C26D52] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Select Machine */}
          {step === 2 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C26D52]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#2C2018] font-mono">
                  {t('wizard.step2_title')}
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono leading-relaxed">
                {t('wizard.step2_desc')}
              </p>

              <div className="grid grid-cols-1 gap-1.5 max-h-[45vh] overflow-y-auto pr-1">
                {COMMON_MACHINES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMachine(m)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition text-xs font-mono ${
                      selectedMachine === m
                        ? 'border-[#C26D52] bg-[#FFFDF9] ring-2 ring-[#C26D52]/20 font-bold text-[#2C2018]'
                        : 'border-[#E8DFD5] bg-white hover:border-[#C26D52]/40 text-[#2C2018]'
                    }`}
                  >
                    {m}
                    {selectedMachine === m && m !== 'Other' && (
                      <Check className="w-3.5 h-3.5 text-[#C26D52] inline ml-2" />
                    )}
                  </button>
                ))}
              </div>

              {selectedMachine === 'Other' && (
                <input
                  type="text"
                  value={customMachine}
                  onChange={(e) => setCustomMachine(e.target.value)}
                  placeholder={t('wizard.machine_placeholder')}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono text-[#2C2018] placeholder:text-[#7A6E65]/60 focus:outline-hidden focus:ring-2 focus:ring-[#C26D52]/30"
                />
              )}
            </div>
          )}

          {/* STEP 3: First Bean */}
          {step === 3 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#C26D52]" />
                  <h3 className="text-xs sm:text-sm font-bold text-[#2C2018] font-mono">
                    {t('wizard.step3_title')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-2.5 py-1 rounded-xl border border-[#72806B] bg-[#72806B]/10 hover:bg-[#72806B]/20 text-[#72806B] text-[11px] font-mono font-bold flex items-center gap-1.5 transition shadow-xs"
                  title={t('bean.scan_bag_desc')}
                >
                  <Barcode className="w-3.5 h-3.5 text-[#C26D52]" />
                  <span>{t('bean.scan_bag')}</span>
                </button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono leading-relaxed">
                {t('wizard.step3_desc')}
              </p>
              {scannedFeedback && (
                <div className="p-2 rounded-lg bg-[#72806B]/15 border border-[#72806B]/30 text-[11px] font-mono text-[#72806B] flex items-center gap-1.5 animate-fadeIn">
                  <Sparkles className="w-3.5 h-3.5 text-[#C26D52] shrink-0" />
                  <span className="truncate">{scannedFeedback}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-mono text-[#7A6E65] font-bold uppercase tracking-wider">
                    {t('bean.name')}
                  </label>
                  <input
                    type="text"
                    value={beanName}
                    onChange={(e) => setBeanName(e.target.value)}
                    placeholder={t('wizard.bean_name_placeholder')}
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono text-[#2C2018] placeholder:text-[#7A6E65]/50 focus:outline-hidden focus:ring-2 focus:ring-[#C26D52]/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#7A6E65] font-bold uppercase tracking-wider">
                    {t('bean.roaster')}
                  </label>
                  <input
                    type="text"
                    value={roaster}
                    onChange={(e) => setRoaster(e.target.value)}
                    placeholder={t('wizard.roaster_placeholder')}
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono text-[#2C2018] placeholder:text-[#7A6E65]/50 focus:outline-hidden focus:ring-2 focus:ring-[#C26D52]/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#7A6E65] font-bold uppercase tracking-wider">
                    {t('bean.roast_level')}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {(['light', 'medium', 'medium-dark', 'dark'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setRoastLevel(level)}
                        className={`p-2 rounded-xl border text-[10px] sm:text-[11px] font-mono capitalize transition ${
                          roastLevel === level
                            ? 'border-[#C26D52] bg-[#2C2018] text-[#FAF7F2] font-bold'
                            : 'border-[#E8DFD5] bg-white text-[#7A6E65] hover:border-[#C26D52]/40'
                        }`}
                      >
                        {level === 'light'
                          ? t('wizard.roast_level_light')
                          : level === 'medium'
                          ? t('wizard.roast_level_medium')
                          : level === 'medium-dark'
                          ? t('wizard.roast_level_medium_dark')
                          : t('wizard.roast_level_dark')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#7A6E65] font-bold uppercase tracking-wider">
                    {t('bean.roast_date')}
                  </label>
                  <input
                    type="date"
                    value={roastDate}
                    onChange={(e) => setRoastDate(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E8DFD5] bg-white text-xs font-mono text-[#2C2018] focus:outline-hidden focus:ring-2 focus:ring-[#C26D52]/30"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-6 border-t border-[#E8DFD5] flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#7A6E65] hover:text-[#2C2018] transition"
            >
              {t('wizard.back')}
            </button>
          ) : onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-2 rounded-xl text-xs font-mono font-semibold text-[#7A6E65] hover:text-[#2C2018] transition"
            >
              {t('wizard.skip_setup')}
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="px-4 py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{t('wizard.next')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canFinish}
              className="px-5 py-2.5 rounded-xl bg-[#C26D52] hover:bg-[#A0523C] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <span>{t('wizard.start_brewing')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bean Bag & Barcode Vision Scanner Modal */}
      <BeanScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSaveBean={handleScannedBean}
        currentGrinderName={grinders.find((g) => g.id === selectedGrinderId)?.name || grinders[0]?.name || 'Baratza Encore ESP Pro'}
        grinders={grinders}
      />
    </div>
  );
};
