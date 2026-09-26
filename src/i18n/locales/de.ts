import type { TranslationKeys } from './en';

/**
 * German (Deutsch)
 * Barista & Specialty-Begriffe bleiben auf Englisch/Italienisch nach SCA-Standard.
 */
export const de: Partial<Record<TranslationKeys, string>> = {
  // App Header
  'app.title': 'ESPRESSO FLOW',
  'app.subtitle': 'Präzisions-Waagen-OCR & Flow-Dynamik',
  'app.pro_lifetime': 'PRO LIFETIME',
  'app.trial_days': 'TESTPHASE: {days}T',

  // Navigation Tabs
  'nav.bar': 'Bar',
  'nav.coffee_bar': 'Coffee Bar',
  'nav.scale': 'Waage',
  'nav.scale_cam': 'Scale Cam',
  'nav.logs': 'Logs',
  'nav.logbook': 'Logbuch',
  'nav.gear': 'Setup',
  'nav.beans_and_gear': 'Bohnen & Setup',

  // Active Bean Bar
  'active_bean.title': 'AKTIVE BOHNE',
  'active_bean.days_off_roast': '{days}T seit Röstung',
  'active_bean.ratio': 'RATIO',
  'active_bean.dose': 'DOSE',
  'active_bean.yield': 'YIELD',
  'active_bean.grind': 'MAHLGRAD',

  // Coffee Bar / Drink Deck
  'deck.title': 'Barista Extraktions-Deck',
  'deck.subtitle': 'Wähle ein Getränkeprofil oder passe deine Ziel-Extraktionskurve an',
  'deck.custom_dialin': 'Benutzerdefiniertes Dial-In',
  'deck.show_more': 'Mehr Getränke anzeigen ({count})',
  'deck.show_less': 'Weniger anzeigen',
  'deck.pull_shot': 'Shot auf Scale Cam starten',
  'deck.grind_setting': 'Mahlgrad-Einstellung',

  // Scale Monitor / Cam
  'scale.ocr_active': 'OCR AKTIV ({fps} FPS)',
  'scale.roi_target': 'WAAGEN-FOKUSBEREICH',
  'scale.live_ocr': 'Live OCR',
  'scale.start_camera': 'Kamera starten',
  'scale.align': 'Ausrichten',
  'scale.led': 'LED',
  'scale.tare': 'Tara ({weight}g)',
  'scale.tare_locked': 'Tara: {weight}g Gesperrt',
  'scale.target_guide': 'Ziel: {dose}g → {yield}g',
  'scale.stop_and_save': 'Shot stoppen & speichern ({duration}s)',
  'scale.align_hint': 'Fokusrahmen auf Waagendisplay richten',

  // Bean Vault & Scanner
  'bean.scan_bag': 'Packung scannen',
  'bean.scan_bag_desc': 'Scanne Barcodes, Verpackungsetiketten und Röstdaten',
  'bean.add_bean': 'Kaffeebohne hinzufügen',
  'bean.name': 'Bohnenname / Herkunft',
  'bean.roaster': 'Rösterei (Optional)',
  'bean.roast_level': 'Röstgrad',
  'bean.roast_date': 'Röstdatum',
  'bean.assigned_grinder': 'Zugeordnete Mühle',

  // Onboarding Wizard
  'wizard.welcome_title': 'Willkommen bei Espresso Flow',
  'wizard.welcome_subtitle': 'Schnelles Setup -- 3 Schritte zum ersten perfekten Shot',
  'wizard.step1_machine': 'Espressomaschine wählen',
  'wizard.step2_grinder': 'Kaffeemühle wählen',
  'wizard.step3_bean': 'Deine erste Kaffeebohne',
  'wizard.skip': 'Überspringen ✕',
  'wizard.skip_setup': 'Setup überspringen',
  'wizard.next': 'Weiter',
  'wizard.back': 'Zurück',
  'wizard.finish': 'Starten →',

  // Equipment & Settings
  'settings.title': 'Ausrüstung & Einstellungen',
  'settings.language': 'Sprache',
  'settings.espresso_machine': 'Espressomaschine',
  'settings.grinder_inventory': 'Mühlen-Inventar',
  'settings.camera_settings': 'Kamera & OCR-Kalibrierung',

  // Common Actions
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'common.edit': 'Bearbeiten',
  'common.delete': 'Löschen',
  'common.close': 'Schließen',
};
