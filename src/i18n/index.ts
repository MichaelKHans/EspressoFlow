import { useState, useEffect } from 'react';
import { en, type TranslationKeys } from './locales/en';
import { de } from './locales/de';
import { da } from './locales/da';

export type SupportedLanguage = 'en' | 'de' | 'da';

export interface LanguageInfo {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
];

const dictionaries: Record<SupportedLanguage, Partial<Record<TranslationKeys, string>>> = {
  en,
  de,
  da,
};

const STORAGE_KEY = 'espressoflow_lang';
const EVENT_NAME = 'espressoflow_lang_change';

/**
 * Detects initial user language based on localStorage or browser navigator
 */
export function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && (saved === 'en' || saved === 'de' || saved === 'da')) {
      return saved;
    }

    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('da')) return 'da';
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
  };
}
