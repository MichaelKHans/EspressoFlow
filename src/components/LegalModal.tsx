import React, { useState } from 'react';
import { X, Shield, FileText, HelpCircle, Mail } from 'lucide-react';
import { useTranslation } from '../i18n';

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
  const { t } = useTranslation();
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
              {t('legal.modal_title')}
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
            {t('legal.tab_privacy')}
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
            {t('legal.tab_terms')}
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
            {t('legal.tab_support')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#2C2018] leading-relaxed">
          {tab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#2C2018]">{t('legal.privacy_title')}</h3>
              <p className="text-[#7A6E65]">{t('legal.privacy_updated')}</p>
              
              <h4 className="font-semibold text-[#2C2018]">{t('legal.privacy_camera_h')}</h4>
              <p>
                {t('legal.privacy_camera_p')}
              </p>

              <h4 className="font-semibold text-[#2C2018]">{t('legal.privacy_data_h')}</h4>
              <p>
                {t('legal.privacy_data_p')}
              </p>

              <h4 className="font-semibold text-[#2C2018]">{t('legal.privacy_purchase_h')}</h4>
              <p>
                {t('legal.privacy_purchase_p')}
              </p>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#2C2018]">{t('legal.terms_title')}</h3>
              <p className="text-[#7A6E65]">{t('legal.terms_updated')}</p>
              
              <h4 className="font-semibold text-[#2C2018]">{t('legal.terms_acceptance_h')}</h4>
              <p>
                {t('legal.terms_acceptance_p')}
              </p>

              <h4 className="font-semibold text-[#2C2018]">{t('legal.terms_license_h')}</h4>
              <p>
                {t('legal.terms_license_p')}
              </p>

              <h4 className="font-semibold text-[#2C2018]">{t('legal.terms_disclaimer_h')}</h4>
              <p>
                {t('legal.terms_disclaimer_p')}
              </p>
            </div>
          )}

          {tab === 'support' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#2C2018]">{t('legal.support_title')}</h3>
              <p className="text-[#7A6E65]">{t('legal.support_subtitle')}</p>
              
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
                <div className="flex items-center gap-2 font-mono font-semibold text-[#2C2018]">
                  <Mail className="w-4 h-4 text-[#C26D52]" />
                  <span>{t('legal.support_email')}</span>
                </div>
                <p className="text-[11px] text-[#7A6E65]">
                  {t('legal.support_questions')}
                </p>
              </div>

              <h4 className="font-semibold text-[#2C2018]">{t('legal.faq_title')}</h4>
              <div className="space-y-2 text-[11px]">
                <p>
                  <strong>{t('legal.faq_q1')}</strong><br />
                  {t('legal.faq_a1')}
                </p>
                <p>
                  <strong>{t('legal.faq_q2')}</strong><br />
                  {t('legal.faq_a2')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
