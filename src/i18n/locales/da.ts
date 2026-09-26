import type { TranslationKeys } from './en';

/**
 * Danish (Dansk)
 * Specialty kaffebegreber bevares naturligt i overensstemmelse med barista-jargon.
 */
export const da: Partial<Record<TranslationKeys, string>> = {
  // App Header
  'app.title': 'ESPRESSO FLOW',
  'app.subtitle': 'Præcisions-Vægt OCR & Flow Dynamics',
  'app.pro_lifetime': 'PRO LIFETIME',
  'app.trial_days': 'PRØVEPERIODE: {days}D',

  // Navigation Tabs
  'nav.bar': 'Bar',
  'nav.coffee_bar': 'Kaffebar',
  'nav.scale': 'Vægt',
  'nav.scale_cam': 'Scale Cam',
  'nav.logs': 'Logs',
  'nav.logbook': 'Logbog',
  'nav.gear': 'Udstyr',
  'nav.beans_and_gear': 'Bønner & Udstyr',

  // Active Bean Bar
  'active_bean.title': 'AKTIV BØNNE',
  'active_bean.days_off_roast': '{days}d siden ristning',
  'active_bean.ratio': 'FORHOLD',
  'active_bean.dose': 'DOSIS',
  'active_bean.yield': 'UDBYTTE',
  'active_bean.grind': 'KVÆRN',

  // Coffee Bar / Drink Deck
  'deck.title': 'Barista Ekstraktions-Deck',
  'deck.subtitle': 'Vælg drikkeprofil eller justér din ønskede ekstraktionskurve',
  'deck.custom_dialin': 'Brugerdefineret Dial-In',
  'deck.show_more': 'Vis Flere Drikke ({count})',
  'deck.show_less': 'Vis Færre',
  'deck.pull_shot': 'Kør Shot på Scale Cam',
  'deck.grind_setting': 'Kværnindstilling',

  // Scale Monitor / Cam
  'scale.ocr_active': 'OCR AKTIV ({fps} FPS)',
  'scale.roi_target': 'VÆGT FOKUSRAMME',
  'scale.live_ocr': 'Live OCR',
  'scale.start_camera': 'Start Kamera',
  'scale.align': 'Centrér',
  'scale.led': 'LED',
  'scale.tare': 'Tarér ({weight}g)',
  'scale.tare_locked': 'Tara: {weight}g Låst',
  'scale.target_guide': 'Mål: {dose}g → {yield}g',
  'scale.stop_and_save': 'Stop & Gem Shot ({duration}s)',
  'scale.align_hint': 'Ret fokusrammen mod vægtens display',

  // Bean Vault & Scanner
  'bean.scan_bag': 'Scan Pose',
  'bean.scan_bag_desc': 'Scan stregkoder, emballage-etiketter og ristedatoer',
  'bean.add_bean': 'Tilføj Kaffebønne',
  'bean.name': 'Bønnenavn / Oprindelse',
  'bean.roaster': 'Risteri (Valgfrit)',
  'bean.roast_level': 'Ristegrad',
  'bean.roast_date': 'Ristedato',
  'bean.assigned_grinder': 'Tilknyttet Kværn',

  // Onboarding Wizard
  'wizard.welcome_title': 'Velkommen til Espresso Flow',
  'wizard.welcome_subtitle': 'Hurtig opsætning -- 3 trin til dit første perfekte shot',
  'wizard.step1_machine': 'Vælg Espressomaskine',
  'wizard.step2_grinder': 'Vælg Kaffekværn',
  'wizard.step3_bean': 'Din Første Kaffebønne',
  'wizard.skip': 'Spring over ✕',
  'wizard.skip_setup': 'Spring Opsætning Over',
  'wizard.next': 'Næste',
  'wizard.back': 'Tilbage',
  'wizard.finish': 'Start Brygning →',

  // Equipment & Settings
  'settings.title': 'Udstyr & Indstillinger',
  'settings.language': 'Sprog',
  'settings.espresso_machine': 'Espressomaskine',
  'settings.grinder_inventory': 'Kværn Inventar',
  'settings.camera_settings': 'Kamera & OCR Justering',

  // Common Actions
  'common.save': 'Gem',
  'common.cancel': 'Annuller',
  'common.edit': 'Rediger',
  'common.delete': 'Slet',
  'common.close': 'Luk',
};
