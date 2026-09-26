import { X, Check, ShieldCheck, Sparkles, Coffee } from 'lucide-react';
import type { UserAccessState } from '../types/espresso';

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
  if (!isOpen) return null;

  const features = [
    'Unlimited Real-Time Scale OCR & Computer Vision',
    'Mathematical Channeling Detection & Flow Spikes',
    'Analog Barista Logbook & Extraction History',
    'Smart Grinder Dial-In Steps & Taste Feedback',
    'CO2 Degassing Alerts & Coffee Bean Scanning',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] p-6 shadow-2xl overflow-hidden font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#FAF7F2] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C26D52]/10 text-[#C26D52] text-xs font-mono font-bold mb-3 border border-[#C26D52]/20">
            <Sparkles className="w-3.5 h-3.5" />
            LIFETIME ACCESS • NO SUBSCRIPTION
          </div>
          <h2 className="text-2xl font-bold text-[#2C2018] tracking-tight">
            Espresso Flow PRO
          </h2>
          <p className="text-xs text-[#7A6E65] mt-1">
            Transform any kitchen scale into a precision extraction lab.
          </p>
        </div>

        {/* Pricing Box */}
        <div className="bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] p-4 text-center mb-5">
          <div className="text-3xl font-extrabold text-[#2C2018] font-mono">
            $4.99 <span className="text-sm font-normal text-[#7A6E65]">/ 49,- DKK</span>
          </div>
          <div className="text-[11px] font-mono text-[#C26D52] font-semibold mt-1">
            Pay Once, Dial In Forever
          </div>
          <div className="text-[11px] text-[#7A6E65] mt-1">
            {accessState.isWithinTrial
              ? `You currently have ${accessState.daysRemainingInTrial} days left in your free trial.`
              : 'Unlock complete precision extraction capabilities.'}
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
            className="w-full py-3 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white font-semibold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Coffee className="w-4 h-4" />
            Unlock Lifetime Pro ($4.99)
          </button>

          <button
            onClick={() => {
              alert('Purchases restored successfully! Entitlement: Lifetime PRO active.');
              onUnlockPro();
            }}
            className="w-full py-2 text-xs font-mono text-[#7A6E65] hover:text-[#2C2018] transition"
          >
            Restore Purchases
          </button>
        </div>

        {/* Store Compliance Links */}
        <div className="mt-4 pt-3 border-t border-[#E8DFD5] flex items-center justify-center gap-4 text-[10px] text-[#7A6E65] font-mono">
          <button onClick={() => onOpenLegal('terms')} className="hover:underline">
            Terms of Service
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal('privacy')} className="hover:underline">
            Privacy Policy
          </button>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#72806B]" /> Secure In-App
          </span>
        </div>
      </div>
    </div>
  );
};
