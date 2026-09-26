/**
 * English (Master / Single Source of Truth)
 * Specialty Coffee Terminology preserved according to SCA guidelines.
 */
export const en = {
  // App Header
  'app.title': 'ESPRESSO FLOW',
  'app.subtitle': 'Precision Scale OCR & Flow Dynamics',
  'app.pro_lifetime': 'PRO LIFETIME',
  'app.trial_days': 'TRIAL: {days}D',

  // Navigation Tabs
  'nav.bar': 'Bar',
  'nav.coffee_bar': 'Coffee Bar',
  'nav.scale': 'Scale',
  'nav.scale_cam': 'Scale Cam',
  'nav.logs': 'Logs',
  'nav.logbook': 'Logbook',
  'nav.gear': 'Gear',
  'nav.beans_and_gear': 'Beans & Gear',

  // Active Bean Bar
  'active_bean.title': 'ACTIVE BEAN',
  'active_bean.days_off_roast': '{days}d off roast',
  'active_bean.ratio': 'RATIO',
  'active_bean.dose': 'DOSE',
  'active_bean.yield': 'YIELD',
  'active_bean.grind': 'GRIND',

  // Coffee Bar / Drink Deck
  'deck.title': 'Barista Extraction Deck',
  'deck.subtitle': 'Select beverage profile or dial-in your target extraction curve',
  'deck.custom_dialin': 'Custom Dial-In',
  'deck.show_more': 'Show More Drinks ({count})',
  'deck.show_less': 'Show Less',
  'deck.pull_shot': 'Pull Shot on Scale Cam',
  'deck.grind_setting': 'Grind Setting',

  // Scale Monitor / Cam
  'scale.ocr_active': 'OCR ACTIVE ({fps} FPS)',
  'scale.roi_target': 'SCALE ROI TARGET',
  'scale.live_ocr': 'Live OCR',
  'scale.start_camera': 'Start Camera',
  'scale.align': 'Align',
  'scale.led': 'LED',
  'scale.tare': 'Tare ({weight}g)',
  'scale.tare_locked': 'Tare: {weight}g Locked',
  'scale.target_guide': 'Target: {dose}g → {yield}g',
  'scale.stop_and_save': 'Stop & Save Shot ({duration}s)',
  'scale.align_hint': 'Point box at scale display',

  // Bean Vault & Scanner
  'bean.scan_bag': 'Scan Bag',
  'bean.scan_bag_desc': 'Scan coffee bag barcodes, packaging labels, and roast date stamps',
  'bean.add_bean': 'Add Coffee Bean',
  'bean.name': 'Bean Name / Origin',
  'bean.roaster': 'Roaster (Optional)',
  'bean.roast_level': 'Roast Level',
  'bean.roast_date': 'Roast Date',
  'bean.assigned_grinder': 'Assigned Grinder',

  // Onboarding Wizard
  'wizard.welcome_title': 'Welcome to Espresso Flow',
  'wizard.welcome_subtitle': 'Quick station setup -- 3 steps to your first perfect shot',
  'wizard.step1_machine': 'Select Espresso Machine',
  'wizard.step2_grinder': 'Select Your Grinder',
  'wizard.step3_bean': 'Your First Coffee Bean',
  'wizard.skip': 'Skip ✕',
  'wizard.skip_setup': 'Skip Setup',
  'wizard.next': 'Next',
  'wizard.back': 'Back',
  'wizard.finish': 'Start Brewing →',

  // Equipment & Settings
  'settings.title': 'Equipment & Settings',
  'settings.language': 'Language',
  'settings.espresso_machine': 'Espresso Machine',
  'settings.grinder_inventory': 'Grinder Inventory',
  'settings.camera_settings': 'Camera & OCR Tuning',

  // Common Actions
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.close': 'Close',
} as const;

export type TranslationKeys = keyof typeof en;
