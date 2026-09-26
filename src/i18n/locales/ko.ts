import type { TranslationKeys } from './en';

/**
 * Korean (한국어)
 * SCA 기준 스페셜티 커피 용어 준수 (Ratio, Dose, Yield, Dial-In 등).
 */
export const ko: Partial<Record<TranslationKeys, string>> = {
  // App Header
  'app.title': 'ESPRESSO FLOW',
  'app.subtitle': '정밀 저울 OCR & 플로우 역학 분석',
  'app.pro_lifetime': 'PRO 평생 라이선스',
  'app.trial_days': '체험 기간: {days}일 남음',

  // Navigation Tabs
  'nav.bar': '바',
  'nav.coffee_bar': '커피 바',
  'nav.scale': '저울',
  'nav.scale_cam': '스케일 캠',
  'nav.logs': '기록',
  'nav.logbook': '추출 로그',
  'nav.gear': '장비',
  'nav.beans_and_gear': '원두 & 장비',

  // Active Bean Bar
  'active_bean.title': '선택된 원두',
  'active_bean.days_off_roast': '로스팅 후 {days}일',
  'active_bean.ratio': '추출 비율',
  'active_bean.dose': '도징량',
  'active_bean.yield': '추출량',
  'active_bean.grind': '분쇄도',

  // Coffee Bar / Drink Deck
  'deck.title': '바리스타 추출 덱',
  'deck.subtitle': '음료 프로필을 선택하거나 목표 추출 커브를 다이얼인하세요',
  'deck.custom_dialin': '맞춤 다이얼인',
  'deck.show_more': '음료 더보기 ({count})',
  'deck.show_less': '접기',
  'deck.pull_shot': '스케일 캠으로 샷 추출',
  'deck.grind_setting': '분쇄도 설정',

  // Scale Monitor / Cam
  'scale.standby_title': '스케일 캠 대기 모드',
  'scale.standby_desc': '카메라가 디지털 저울의 화면을 정면으로 비추도록 스마트폰을 거치하세요.',
  'scale.start_cam_btn': '카메라 시작',
  'scale.stop_cam_btn': '카메라 끄기',
  'scale.demo_btn': '데모 모드',
  'scale.reset': '초기화',
  'scale.reset_title': '추출을 취소하고 기록하지 않고 초기화',
  'scale.start_shot': '추출 시작',
  'scale.ocr_active': 'OCR 인식 중 ({fps} FPS)',
  'scale.roi_target': '저울 화면 인식 영역',
  'scale.live_ocr': '실시간 OCR',
  'scale.start_camera': '카메라 시작',
  'scale.align': '정렬',
  'scale.led': 'LED',
  'scale.tare': '영점 조절 ({weight}g)',
  'scale.tare_locked': '영점: {weight}g 고정됨',
  'scale.target_guide': '목표: {dose}g → {yield}g',
  'scale.stop_and_save': '추출 정지 및 저장 ({duration}초)',
  'scale.align_hint': '인식 사각형을 저울 화면에 맞추세요',

  // Bean Vault & Scanner
  'bean.scan_bag': '원두 봉투 스캔',
  'bean.scan_bag_desc': '원두 봉투 바코드, 패키지 라벨, 로스팅 날짜를 카메라로 스캔하세요',
  'bean.add_bean': '원두 추가',
  'bean.name': '원두 이름 / 원산지',
  'bean.roaster': '로스터리 (선택사항)',
  'bean.roast_level': '로스팅 포인트',
  'bean.roast_date': '로스팅 일자',
  'bean.assigned_grinder': '지정 그라인더',

  // Onboarding Wizard
  'wizard.welcome_title': 'Espresso Flow에 오신 것을 환영합니다',
  'wizard.welcome_subtitle': '스테이션 빠른 설정 -- 완벽한 첫 샷을 위한 3단계',
  'wizard.step1_machine': '에스프레소 머신 선택',
  'wizard.step2_grinder': '그라인더 선택',
  'wizard.step3_bean': '첫 번째 원두 등록',
  'wizard.skip': '건너뛰기 ✕',
  'wizard.skip_setup': '설정 건너뛰기',
  'wizard.next': '다음',
  'wizard.back': '이전',
  'wizard.finish': '추출 시작 →',

  // Equipment & Settings
  'settings.title': '장비 및 환경설정',
  'settings.language': '언어 설정',
  'settings.espresso_machine': '에스프레소 머신',
  'settings.grinder_inventory': '보유 그라인더 목록',
  'settings.camera_settings': '카메라 & OCR 튜닝',

  // Common Actions
  'common.save': '저장',
  'common.cancel': '취소',
  'common.edit': '수정',
  'common.delete': '삭제',
  'common.close': '닫기',
};
