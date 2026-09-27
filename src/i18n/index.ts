import { useState, useEffect } from 'react';
import { en, type TranslationKeys } from './locales/en';
import { de } from './locales/de';
import { da } from './locales/da';
import { ko } from './locales/ko';
import { ja } from './locales/ja';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { ar } from './locales/ar';
import { it } from './locales/it';
import { fr } from './locales/fr';
import { es } from './locales/es';

export type SupportedLanguage = 'en' | 'de' | 'da' | 'ko' | 'ja' | 'zh-CN' | 'zh-TW' | 'ar' | 'it' | 'fr' | 'es';

export interface LanguageInfo {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'ar', label: 'العربية', flag: '🇦🇪' },
];

const dictionaries: Record<SupportedLanguage, Partial<Record<TranslationKeys, string>>> = {
  en,
  de,
  da,
  ko,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ar,
  it,
  fr,
  es,
};

export const ENABLE_MULTI_LANGUAGE = false;

const STORAGE_KEY = 'espressoflow_lang';
const EVENT_NAME = 'espressoflow_lang_change';

/**
 * Detects initial user language based on localStorage or browser navigator.
 * When ENABLE_MULTI_LANGUAGE is false, standard English is always used.
 */
export function getInitialLanguage(): SupportedLanguage {
  if (!ENABLE_MULTI_LANGUAGE) {
    return 'en';
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    const validCodes: SupportedLanguage[] = ['en', 'de', 'da', 'ko', 'ja', 'zh-CN', 'zh-TW', 'ar', 'it', 'fr', 'es'];
    if (saved && validCodes.includes(saved)) {
      return saved;
    }

    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('it')) return 'it';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('da')) return 'da';
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang === 'zh-tw' || browserLang === 'zh-hk' || browserLang.includes('hant')) return 'zh-TW';
    if (browserLang.startsWith('zh')) return 'zh-CN';
  } catch {
    // Fallback if localStorage or navigator is unavailable
  }
  return 'en';
}

/**
 * Translates a key with optional dynamic parameter interpolation.
 * Always falls back to English if the key is missing in the target language.
 */
export function translate(
  lang: SupportedLanguage,
  key: TranslationKeys,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[lang] || en;
  let text = dict[key] || en[key] || key;

  if (params) {
    for (const [paramKey, val] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    }
  }

  return text;
}

/**
 * Lightweight React Hook for internationalization
 */
export function useTranslation() {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail) {
        setLanguageState(customEvent.detail);
      }
    };

    window.addEventListener(EVENT_NAME, handleLangChange);
    return () => window.removeEventListener(EVENT_NAME, handleLangChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (newLang: SupportedLanguage) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignored if storage blocked
    }
    setLanguageState(newLang);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newLang }));
  };

  const t = (key: TranslationKeys, params?: Record<string, string | number>) => {
    return translate(language, key, params);
  };

  return {
    t,
    language,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isMultiLanguageEnabled: ENABLE_MULTI_LANGUAGE,
  };
}
