import type { TranslationKeys } from './en';

/**
 * Japanese (日本語)
 * 日本のスペシャルティコーヒー文化およびSCA標準に準拠。
 */
export const ja: Partial<Record<TranslationKeys, string>> = {
  // App Header
  'app.title': 'ESPRESSO FLOW',
  'app.subtitle': '高精度スケールOCR＆流速ダイナミクス',
  'app.pro_lifetime': 'PRO 永久ライセンス',
  'app.trial_days': 'トライアル期間: 残り{days}日',

  // Navigation Tabs
  'nav.bar': 'バー',
  'nav.coffee_bar': 'コーヒーバー',
  'nav.scale': 'スケール',
  'nav.scale_cam': 'スケールCam',
  'nav.logs': '履歴',
  'nav.logbook': '抽出記録',
  'nav.gear': '器具',
  'nav.beans_and_gear': '豆と器具',

  // Active Bean Bar
  'active_bean.title': '現在のコーヒー豆',
  'active_bean.days_off_roast': '焙煎後{days}日',
  'active_bean.ratio': '比率',
  'active_bean.dose': '粉量',
  'active_bean.yield': '抽出量',
  'active_bean.grind': '挽き目',

  // Coffee Bar / Drink Deck
  'deck.title': 'バリスタ抽出デッキ',
  'deck.subtitle': 'レシピを選択するか、目標の抽出曲線をダイヤルインしてください',
  'deck.custom_dialin': 'カスタム・ダイヤルイン',
  'deck.show_more': '他のレシピを表示 ({count})',
  'deck.show_less': '折りたたむ',
  'deck.pull_shot': 'スケールCamで抽出開始',
  'deck.grind_setting': 'グラインダー設定',

  // Scale Monitor / Cam
  'scale.standby_title': 'スケールCam スタンバイ',
  'scale.standby_desc': 'カメラがデジタルの表示画面を正面から捉えるようにスマートフォンをセットしてください。',
  'scale.start_cam_btn': 'カメラ起動',
  'scale.stop_cam_btn': 'カメラ停止',
  'scale.demo_btn': 'デモモード',
  'scale.reset': 'リセット',
  'scale.reset_title': '記録せずに抽出を中止してリセット',
  'scale.start_shot': '抽出開始',
  'scale.ocr_active': 'OCR稼働中 ({fps} FPS)',
  'scale.roi_target': 'スケール認識エリア',
  'scale.live_ocr': 'リアルタイムOCR',
  'scale.start_camera': 'カメラ起動',
  'scale.align': '位置調整',
  'scale.led': 'LED',
  'scale.tare': '風袋引き ({weight}g)',
  'scale.tare_locked': 'ゼロ点: {weight}g ロック済',
  'scale.target_guide': '目標: {dose}g → {yield}g',
  'scale.stop_and_save': '抽出停止＆記録保存 ({duration}秒)',
  'scale.align_hint': '赤い点線枠をスケール画面に合わせてください',

  // Bean Vault & Scanner
  'bean.scan_bag': 'パッケージをスキャン',
  'bean.scan_bag_desc': 'コーヒー豆のバーコード、ラベル、焙煎日をカメラで自動読み取り',
  'bean.add_bean': '新しい豆を登録',
  'bean.name': '豆の銘柄 / 産地',
  'bean.roaster': 'ロースター (任意)',
  'bean.roast_level': '焙煎度',
  'bean.roast_date': '焙煎日',
  'bean.assigned_grinder': '使用グラインダー',

  // Onboarding Wizard
  'wizard.welcome_title': 'Espresso Flowへようこそ',
  'wizard.welcome_subtitle': 'かんたん初期設定 -- 最高の一杯のための3ステップ',
  'wizard.step1_machine': 'エスプレッソマシンを選択',
  'wizard.step2_grinder': 'グラインダーを選択',
  'wizard.step3_bean': '最初に使用するコーヒー豆',
  'wizard.skip': 'スキップ ✕',
  'wizard.skip_setup': '設定をスキップ',
  'wizard.next': '次へ',
  'wizard.back': '戻る',
  'wizard.finish': '抽出をはじめる →',

  // Equipment & Settings
  'settings.title': '器具と環境設定',
  'settings.language': '言語 (Language)',
  'settings.espresso_machine': 'エスプレッソマシン',
  'settings.grinder_inventory': '登録グラインダー一覧',
  'settings.camera_settings': 'カメラ＆OCRキャリブレーション',

  // Common Actions
  'common.save': '保存',
  'common.cancel': 'キャンセル',
  'common.edit': '編集',
  'common.delete': '削除',
  'common.close': '閉じる',
};
