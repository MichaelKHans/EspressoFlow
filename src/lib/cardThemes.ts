/**
 * Flowbean Card Themes & Admin Design Inspector Engine
 * 
 * Provides customizable macro background presets for:
 * - Barista Deck (Hero in DrinkSelector)
 * - Beandex Banner (Hero in BeandexView)
 * - Grinder Fleet Card (Equipment Tab)
 * - Espresso Machine & Pump Card (Equipment Tab)
 * 
 * Allows the Admin to cycle through themes live in the app, inspect their names,
 * and select their preferred aesthetic.
 */

export interface CardThemePreset {
  id: string;
  label: string;
  src: string;
  position?: string;
  accent?: string;
}

const STORAGE_KEY_THEMES = 'flowbean_card_themes_v1';
const STORAGE_KEY_ADMIN_EDIT = 'flowbean_admin_edit_mode_v1';

export const CARD_THEME_REGISTRY: Record<string, CardThemePreset[]> = {
  barista_deck: [
    {
      id: 'crema-ripple',
      label: 'Crema Ripple Splash',
      src: '/images/crema-ripple-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'portafilter-gauge',
      label: 'Naked Portafilter & 9-Bar Manometer',
      src: '/images/portafilter-gauge-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'grinder-chute',
      label: 'Kværn & Portafilter Udløb',
      src: '/images/grinder-chute-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'portafilter-flow',
      label: 'Naked Portafilter Flow',
      src: '/images/portafilter-flow-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'espresso-gauge',
      label: '9-Bar Analog Manometer',
      src: '/images/espresso-gauge-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#A8BFA0',
    },
    {
      id: 'flat-burrs',
      label: 'Titanium Kværnknive',
      src: '/images/flat-burrs-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'pourover-bloom',
      label: 'V60 Pour Over & Svanehalskedel',
      src: '/images/pourover-bloom-macro.jpg',
      position: 'object-center',
      accent: '#D4A373',
    },
    {
      id: 'frenchpress',
      label: 'French Press Stempelkande',
      src: '/images/frenchpress-macro.jpg',
      position: 'object-center',
      accent: '#C26D52',
    },
    {
      id: 'minimal-gradient',
      label: 'Klassisk Mørk Gradient (Uden foto)',
      src: '',
      position: 'none',
      accent: '#C26D52',
    },
  ],

  beandex_banner: [
    {
      id: 'coffee-beans',
      label: 'Friskristede Bønner Makro',
      src: '/images/coffee-beans-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'grinder-chute',
      label: 'Kværn & Portafilter Udløb',
      src: '/images/grinder-chute-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'pourover-bloom',
      label: 'V60 Pour Over Bloom',
      src: '/images/pourover-bloom-macro.jpg',
      position: 'object-center',
      accent: '#D4A373',
    },
    {
      id: 'frenchpress',
      label: 'French Press Aromatiske Olier',
      src: '/images/frenchpress-macro.jpg',
      position: 'object-center',
      accent: '#C26D52',
    },
    {
      id: 'flat-burrs',
      label: '64mm Flat Titanium Burrs',
      src: '/images/flat-burrs-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'grinder-burrs',
      label: 'Conical Steel Burrs',
      src: '/images/grinder-burrs-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'crema-ripple',
      label: 'Crema Ripple Splash',
      src: '/images/crema-ripple-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'minimal-gradient',
      label: 'Klassisk Mørk Gradient (Uden foto)',
      src: '',
      position: 'none',
      accent: '#C26D52',
    },
  ],

  grinder_fleet: [
    {
      id: 'grinder-chute',
      label: 'Kværn & Portafilter Udløb',
      src: '/images/grinder-chute-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'grinder-burrs',
      label: 'Conical Steel Burrs & Grounds',
      src: '/images/grinder-burrs-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'flat-burrs',
      label: '64mm Flat Titanium Burrs',
      src: '/images/flat-burrs-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'coffee-beans',
      label: 'Friskristede Kaffebønner',
      src: '/images/coffee-beans-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'minimal-dark',
      label: 'Klassisk Mørk Kværnkasse (Uden foto)',
      src: '',
      position: 'none',
      accent: '#D4A373',
    },
  ],

  espresso_machine: [
    {
      id: 'portafilter-gauge',
      label: 'Naked Portafilter & 9-Bar Manometer',
      src: '/images/portafilter-gauge-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'portafilter-flow',
      label: 'Bottomless Portafilter Flow',
      src: '/images/portafilter-flow-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#D4A373',
    },
    {
      id: 'espresso-gauge',
      label: '9-Bar Analog Manometer',
      src: '/images/espresso-gauge-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#A8BFA0',
    },
    {
      id: 'crema-ripple',
      label: 'Crema Ripple Rillinger',
      src: '/images/crema-ripple-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'minimal-dark',
      label: 'Klassisk Mørk Maskine (Uden foto)',
      src: '',
      position: 'none',
      accent: '#C26D52',
    },
  ],

  filter_gear: [
    {
      id: 'pourover-bloom',
      label: 'Hario V60 Bloom & Kedel',
      src: '/images/pourover-bloom-macro.jpg',
      position: 'object-center',
      accent: '#D4A373',
    },
    {
      id: 'frenchpress',
      label: 'French Press Stempelkande',
      src: '/images/frenchpress-macro.jpg',
      position: 'object-center',
      accent: '#C26D52',
    },
    {
      id: 'coffee-beans',
      label: 'Friske Filterristede Bønner',
      src: '/images/coffee-beans-macro.jpg',
      position: 'object-right sm:object-center',
      accent: '#C26D52',
    },
    {
      id: 'minimal-dark',
      label: 'Klassisk Mørk Filterbar (Uden foto)',
      src: '',
      position: 'none',
      accent: '#D4A373',
    },
  ],
};

/**
 * Loads all saved card themes
 */
export function loadSavedCardThemes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEMES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Returns current preset for a given card
 */
export function getCardTheme(cardKey: string): CardThemePreset {
  const presets = CARD_THEME_REGISTRY[cardKey] || [];
  if (presets.length === 0) {
    return { id: 'default', label: 'Default', src: '' };
  }

  const saved = loadSavedCardThemes();
  const activeId = saved[cardKey];
  const found = presets.find((p) => p.id === activeId);
  return found || presets[0];
}

/**
 * Sets active theme for a given card
 */
export function saveCardTheme(cardKey: string, themeId: string): void {
  try {
    const current = loadSavedCardThemes();
    current[cardKey] = themeId;
    localStorage.setItem(STORAGE_KEY_THEMES, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('flowbean_card_theme_changed', { detail: { cardKey, themeId } }));
  } catch (err) {
    console.error('Failed to save card theme', err);
  }
}

/**
 * Cycles to the next available theme preset for a given card
 */
export function cycleNextCardTheme(cardKey: string): CardThemePreset {
  const presets = CARD_THEME_REGISTRY[cardKey] || [];
  if (presets.length === 0) return { id: 'default', label: 'Default', src: '' };

  const current = getCardTheme(cardKey);
  const currentIndex = presets.findIndex((p) => p.id === current.id);
  const nextIndex = (currentIndex + 1) % presets.length;
  const nextPreset = presets[nextIndex];

  saveCardTheme(cardKey, nextPreset.id);
  return nextPreset;
}

/**
 * Loads Admin Edit Mode status
 */
export function loadAdminEditMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_EDIT) === 'true';
  } catch {
    return false;
  }
}

/**
 * Saves Admin Edit Mode status
 */
export function saveAdminEditMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_EDIT, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('flowbean_admin_edit_mode_changed', { detail: { enabled } }));
  } catch (err) {
    console.error('Failed to save admin edit mode', err);
  }
}
