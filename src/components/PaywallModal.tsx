import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ShieldCheck, Sparkles, Coffee, KeyRound, RefreshCw, AlertCircle } from 'lucide-react';
import type { UserAccessState } from '../types/espresso';
import { useTranslation } from '../i18n';
import {
  redeemLicenseKey,
  normalizeLicenseKey,
  getRateLimitStatus,
  type RateLimitStatus,
} from '../lib/licenseEngine';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessState: UserAccessState;
  onUnlockPro: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms') => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  accessState,
  onUnlockPro,
  onOpenLegal,
}) => {
  const { t } = useTranslation();
  const [showRedeem, setShowRedeem] = useState<boolean>(false);
  const [licenseCode, setLicenseCode] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>(getRateLimitStatus());

  useEffect(() => {
    if (!rateLimit.isLocked) return;
    const interval = setInterval(() => {
      const current = getRateLimitStatus();
      setRateLimit(current);
      if (!current.isLocked) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimit.isLocked]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseCode.trim() || isRedeeming || rateLimit.isLocked) return;

    setIsRedeeming(true);
    setRedeemFeedback(null);
    try {
      const result = await redeemLicenseKey(licenseCode);
      setRateLimit(result.rateLimitStatus);
      setRedeemFeedback({ success: result.success, message: result.message });
      if (result.success) {
        setTimeout(() => {
          onUnlockPro();
        }, 1200);
      }
    } catch {
      setRedeemFeedback({ success: false, message: 'Netværksfejl under validering. Prøv igen.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  const features = [
    t('paywall.feature_ocr'),
    t('paywall.feature_flow'),
    t('paywall.feature_logbook'),
    t('paywall.feature_dialin'),
    t('paywall.feature_co2'),
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="relative w-full max-w-md bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#DECFC0] p-5 sm:p-6 shadow-2xl overflow-y-auto font-sans animate-modal-pop-in max-h-[92dvh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#FAF7F2] transition cursor-pointer"
          title="Luk"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C26D52]/10 text-[#C26D52] text-xs font-mono font-bold mb-3 border border-[#C26D52]/20">
            <Sparkles className="w-3.5 h-3.5" />
            {t('paywall.badge')}
          </div>
          <h2 className="text-2xl font-bold text-[#2C2018] tracking-tight">
            {t('paywall.title')}
          </h2>
          <p className="text-xs text-[#7A6E65] mt-1">
            {t('paywall.subtitle')}
          </p>
        </div>

        {/* Pricing Box - Vivino-style Luxury Coffee Card with Macro Backdrop */}
        <div className="relative overflow-hidden rounded-2xl border border-[#C26D52]/40 bg-gradient-to-br from-[#241710] via-[#1B110B] to-[#120B07] text-[#FAF7F2] p-5 text-center mb-5 shadow-lg">
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <img
              src="/images/coffee-beans-macro.jpg"
              alt=""
              className="w-full h-full object-cover object-center opacity-50 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#140D09]/95 via-[#1E1510]/80 to-[#140D09]/50" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-extrabold text-[#FFFDF9] font-mono tracking-tight">
              {t('paywall.price')}
            </div>
            <div className="text-xs font-mono text-[#E58367] font-bold mt-1 tracking-wide">
              {t('paywall.pay_once')}
            </div>
            <div className="text-[11px] text-[#DECFC0]/80 mt-1">
              {accessState.isWithinTrial
                ? t('paywall.trial_status', { days: accessState.daysRemainingInTrial })
                : t('paywall.expired_status')}
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 mb-6 text-xs text-[#2C2018]">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="p-0.5 rounded-full bg-[#72806B]/20 text-[#72806B] mt-0.5 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="space-y-2.5">
          <button
            onClick={onUnlockPro}
            className="w-full py-3 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white font-semibold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Coffee className="w-4 h-4" />
            {t('paywall.unlock_btn')}
          </button>

          <button
            onClick={() => {
              alert(t('paywall.restore_success'));
              onUnlockPro();
            }}
            className="w-full py-2 text-xs font-mono text-[#7A6E65] hover:text-[#2C2018] transition cursor-pointer"
          >
            {t('paywall.restore_btn')}
          </button>

          {/* Redeem License Key or Gift Voucher */}
          <div className="pt-2 border-t border-[#E8DFD5]/80">
            {!showRedeem ? (
              <button
                type="button"
                onClick={() => setShowRedeem(true)}
                className="w-full text-[11px] font-mono text-[#7A6E65] hover:text-[#C26D52] flex items-center justify-center gap-1.5 transition cursor-pointer py-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Har du en licensnøgle eller gavekode?</span>
              </button>
            ) : (
              <form onSubmit={handleRedeemSubmit} className="space-y-2 bg-[#FAF7F2] p-3 rounded-xl border border-[#DECFC0] animate-fadeIn text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-[#7A6E65] uppercase flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-[#C26D52]" />
                    <span>Indløs Licens- eller Gavekode</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRedeem(false);
                      setRedeemFeedback(null);
                    }}
                    className="text-[10px] text-[#A6998E] hover:text-[#2C2018] cursor-pointer"
                  >
                    Luk
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={licenseCode}
                    onChange={(e) => setLicenseCode(normalizeLicenseKey(e.target.value))}
                    placeholder="FLOW-XXXX-XXXX-XXXX"
                    disabled={isRedeeming || rateLimit.isLocked}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#DECFC0] bg-white text-xs font-mono uppercase text-[#2C2018] tracking-wider focus:outline-none focus:border-[#C26D52]"
                  />
                  <button
                    type="submit"
                    disabled={isRedeeming || !licenseCode.trim() || rateLimit.isLocked}
                    className="px-3 py-1.5 rounded-lg bg-[#2C2018] hover:bg-[#3D2D22] disabled:opacity-40 text-white text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {isRedeeming ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Indløs</span>
                    )}
                  </button>
                </div>

                {redeemFeedback && (
                  <p
                    className={`text-[10.5px] font-sans ${
                      redeemFeedback.success ? 'text-emerald-700 font-semibold' : 'text-red-700'
                    }`}
                  >
                    {redeemFeedback.message}
                  </p>
                )}

                {rateLimit.isLocked && (
                  <p className="text-[10.5px] text-amber-700 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                    <span>Sikkerhedslås aktiv ({rateLimit.remainingSeconds}s tilbage)</span>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Store Compliance Links */}
        <div className="mt-4 pt-3 border-t border-[#E8DFD5] flex items-center justify-center gap-4 text-[10px] text-[#7A6E65] font-mono">
          <button onClick={() => onOpenLegal('terms')} className="hover:underline">
            {t('footer.terms')}
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal('privacy')} className="hover:underline">
            {t('footer.privacy')}
          </button>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#72806B]" /> {t('paywall.secure_notice')}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
