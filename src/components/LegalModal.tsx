import React, { useState } from 'react';
import { X, Shield, FileText, HelpCircle, Mail } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms' | 'support';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [tab, setTab] = useState<'privacy' | 'terms' | 'support'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8DFD5] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#C26D52]" />
            <h2 className="text-base font-bold text-[#2C2018] font-mono">
              Legal & Support Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#E8DFD5]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E8DFD5] bg-[#FFFDF9] text-xs font-mono">
          <button
            onClick={() => setTab('privacy')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'privacy'
                ? 'border-[#C26D52] text-[#2C2018] font-bold bg-[#FAF7F2]'
                : 'border-transparent text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Privacy Policy
          </button>
          <button
            onClick={() => setTab('terms')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'terms'
                ? 'border-[#C26D52] text-[#2C2018] font-bold bg-[#FAF7F2]'
                : 'border-transparent text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Terms of Service (EULA)
          </button>
          <button
            onClick={() => setTab('support')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'support'
                ? 'border-[#C26D52] text-[#2C2018] font-bold bg-[#FAF7F2]'
                : 'border-transparent text-[#7A6E65] hover:text-[#2C2018]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Support & FAQ
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#2C2018] leading-relaxed">
          {tab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#2C2018]">Privacy Policy for Espresso Flow</h3>
              <p className="text-[#7A6E65]">Last updated: September 26, 2026</p>
              
              <h4 className="font-semibold text-[#2C2018]">1. Camera & Video Data</h4>
              <p>
                Espresso Flow accesses your device's camera exclusively to recognize digital numbers on your coffee scale. All optical character recognition (OCR) and canvas processing are performed <strong>100% locally on your device</strong>. Video frames and camera streams are never recorded, saved to cloud servers, or transmitted over the internet.
              </p>

              <h4 className="font-semibold text-[#2C2018]">2. Extraction & Logbook Data</h4>
              <p>
                Your brew profiles, grinder settings, and tasting logs are stored locally on your device. We do not sell, rent, or monetize your personal coffee notes or brewing habits.
              </p>

              <h4 className="font-semibold text-[#2C2018]">3. In-App Purchases</h4>
              <p>
                Transactions are handled through Apple StoreKit and Google Play Billing via RevenueCat. We never access or store your credit card or financial credentials.
              </p>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#2C2018]">Terms of Service (Standard EULA)</h3>
              <p className="text-[#7A6E65]">Last updated: September 26, 2026</p>
              
              <h4 className="font-semibold text-[#2C2018]">1. Acceptance of Terms</h4>
              <p>
                By downloading, accessing, or using Espresso Flow, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.
              </p>

              <h4 className="font-semibold text-[#2C2018]">2. Lifetime Pro License</h4>
              <p>
                Espresso Flow offers a 7-day full in-app trial followed by an optional one-time purchase of $4.99 USD (49 DKK) for Lifetime Pro access. Lifetime access grants unrestricted use of scale OCR vision, flow rate analysis, and bean logbooks for the lifetime of the application version.
              </p>

              <h4 className="font-semibold text-[#2C2018]">3. Disclaimer of Scale Calibration</h4>
              <p>
                Espresso Flow provides flow rate estimates and dial-in recommendations based on optical reading. Lighting conditions, display reflection, and physical vibrations may affect readings. The app is provided on an "as is" and "as available" basis.
              </p>
            </div>
          )}

          {tab === 'support' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#2C2018]">Customer Support & Contact</h3>
              <p className="text-[#7A6E65]">We are passionate coffee nerds and here to help you dial in.</p>
              
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
                <div className="flex items-center gap-2 font-mono font-semibold text-[#2C2018]">
                  <Mail className="w-4 h-4 text-[#C26D52]" />
                  <span>Direct Support: michaelkhansen@gmail.com</span>
                </div>
                <p className="text-[11px] text-[#7A6E65]">
                  Questions regarding scale calibration, grinder profiles, or restore purchases? Feel free to reach out anytime.
                </p>
              </div>

              <h4 className="font-semibold text-[#2C2018]">Frequently Asked Questions:</h4>
              <div className="space-y-2 text-[11px]">
                <p>
                  <strong>Q: Does my scale need Bluetooth?</strong><br />
                  A: No! Espresso Flow works with any standard kitchen or coffee scale by reading the display with your phone's camera.
                </p>
                <p>
                  <strong>Q: How do I restore my purchase on a new phone?</strong><br />
                  A: Simply tap "Restore Purchases" in the PRO menu while signed in with your Apple ID or Google account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
