/*
 * FICOR UTM 빌더 사전 파일
 * ─────────────────────────────────────────────
 * 이 파일 하나만 수정하면 입력 드롭다운 · 실시간 검사 · 작성 가이드 탭에 모두 반영됩니다.
 *
 * 수정 규칙
 *  - code 값은 영문 소문자 / 숫자 / 밑줄(_)만 사용
 *  - 값을 추가·변경하면 맨 아래 changelog 에 한 줄 기록
 *  - 이미 사용 중인 code 는 삭제하지 말고 deprecated: true 로 표시 (과거 데이터 해석용)
 */
window.UTM_PRESETS = {
  version: "1.1.0",

  /* ── 랜딩 도메인 ─────────────────────────── */
  domains: {
    mall: ["ficor.kr", "www.ficor.kr", "ficorkorea.imweb.me"],
    smartstore: ["smartstore.naver.com", "brand.naver.com", "m.smartstore.naver.com", "m.brand.naver.com"],
    coupang: ["coupang.com", "www.coupang.com", "m.coupang.com", "link.coupang.com"]
  },

  /* ── 자주 쓰는 랜딩 페이지 (자유롭게 추가) ── */
  landingPages: [
    { label: "자사몰 메인", url: "https://ficor.kr/" }
  ],

  /* ── 매체 사전 ───────────────────────────────
   * source       : utm_source 값 (custom: true 면 직접 입력)
   * mediums      : 허용 utm_medium 목록
   *   channel         : GA4 기본 채널 그룹 분류 결과
   *   contentRequired : utm_content(소재) 필수 여부
   *   termHint        : utm_term 입력 안내
   *   meta            : 메타 광고관리자 URL 매개변수(매크로) 모드 지원
   */
  sources: [
    {
      code: "naver", label: "네이버",
      mediums: [
        { code: "cpc", label: "검색광고", channel: "Paid Search", contentRequired: false, termHint: "검색 키워드 (한글 가능)" },
        { code: "display", label: "GFA (성과형 디스플레이)", channel: "Display", contentRequired: true, termHint: "타겟 유형_세부 (예: interest_sports)" }
      ]
    },
    {
      code: "facebook", label: "페이스북 (메타)",
      mediums: [
        { code: "paid_social", label: "유료 광고", channel: "Paid Social", contentRequired: true, meta: true, termHint: "타겟 유형_세부 (예: lookalike_purchase)" },
        { code: "social", label: "오가닉 게시물", channel: "Organic Social", contentRequired: false, termHint: "" }
      ]
    },
    {
      code: "instagram", label: "인스타그램",
      mediums: [
        { code: "paid_social", label: "유료 광고", channel: "Paid Social", contentRequired: true, meta: true, termHint: "타겟 유형_세부 (예: retarget_cart_7d)" },
        { code: "social", label: "오가닉 (피드·스토리·프로필)", channel: "Organic Social", contentRequired: false, termHint: "" }
      ]
    },
    {
      code: "threads", label: "스레드",
      mediums: [
        { code: "social", label: "오가닉 게시물", channel: "Organic Social", contentRequired: false, termHint: "" }
      ]
    },
    {
      code: "toss", label: "토스애즈",
      mediums: [
        { code: "display", label: "디스플레이 광고", channel: "Display", contentRequired: true, termHint: "타겟 유형_세부 (예: broad)" }
      ]
    },
    {
      code: "kakao", label: "카카오",
      mediums: [
        { code: "message", label: "채널 메시지", channel: "미분류 (사용자 정의 채널 그룹 필요)", contentRequired: false, termHint: "" }
      ]
    },
    {
      code: "sms", label: "문자 / 알림톡",
      mediums: [
        { code: "message", label: "메시지 발송", channel: "미분류 (사용자 정의 채널 그룹 필요)", contentRequired: false, termHint: "" }
      ]
    },
    {
      code: "influencer", label: "인플루언서 · 크리에이터", custom: true,
      customHint: "크리에이터 계정 ID를 영문 소문자로 입력 (예: fit_jenny)",
      mediums: [
        { code: "influencer", label: "협찬 · 공동구매 · 리뷰", channel: "미분류 (사용자 정의 채널 그룹 필요)", contentRequired: false, termHint: "" }
      ]
    }
  ],

  /* ── utm_campaign 구간 ────────────────────── */
  campaign: {
    pattern: "목적_상품_프로모션_시작일",
    objectives: [
      { code: "brand", label: "인지" , desc: "브랜드 노출·도달이 목적" },
      { code: "acquisition", label: "신규 유입", desc: "첫 방문·신규 고객 확보" },
      { code: "conversion", label: "구매 전환", desc: "구매가 직접 목적" },
      { code: "retargeting", label: "재방문", desc: "방문·장바구니 이탈 고객 재유입" },
      { code: "crm", label: "기존 고객", desc: "구매 고객 대상 메시지·재구매" }
    ],
    products: [
      { code: "wrist", label: "손목" },
      { code: "elbow", label: "팔꿈치" },
      { code: "knee", label: "무릎" },
      { code: "set", label: "세트" },
      { code: "all", label: "전 상품" }
    ],
    promotions: [
      { code: "always", label: "상시", desc: "프로모션 없는 상시 운영" },
      { code: "launch", label: "신상품", desc: "출시·신규 라인업" },
      { code: "sale", label: "일반 할인", desc: "기간 한정 할인" },
      { code: "bf", label: "블랙프라이데이" },
      { code: "newyear", label: "신년" },
      { code: "secret", label: "비밀링크", desc: "자사몰 시크릿 상품" },
      { code: "groupbuy", label: "공동구매" }
    ]
  },

  /* ── utm_content 구간 ─────────────────────── */
  content: {
    pattern: "형식_주제_버전",
    formats: [
      { code: "image", label: "이미지" },
      { code: "video", label: "영상" },
      { code: "carousel", label: "슬라이드" },
      { code: "banner", label: "배너" },
      { code: "text", label: "텍스트 (메시지)" },
      { code: "profile", label: "프로필 링크 (바이오)" },
      { code: "story", label: "스토리 링크 스티커" },
      { code: "highlight", label: "하이라이트" }
    ],
    topicExamples: [
      { code: "review", label: "후기" },
      { code: "doctor", label: "전문의 출연" },
      { code: "usp", label: "제품 특장점" },
      { code: "price", label: "가격·혜택" },
      { code: "ugc", label: "고객 제작 콘텐츠" },
      { code: "coupon", label: "쿠폰 안내" },
      { code: "main", label: "메인 (프로필 기본 링크)" },
      { code: "event", label: "이벤트 안내" }
    ]
  },

  /* ── utm_term (SA 제외) 타겟 유형 ─────────── */
  targetTypes: [
    { code: "broad", label: "타겟 미지정" },
    { code: "interest", label: "관심사" },
    { code: "lookalike", label: "유사 타겟" },
    { code: "retarget", label: "리타겟" }
  ],

  /* ── 작성 예시 (가이드 탭) ────────────────── */
  examples: [
    { situation: "메타 블프 전환 광고", source: "facebook", medium: "paid_social", campaign: "conversion_wrist_bf_261121", content: "video_doctor_v1", term: "lookalike_purchase" },
    { situation: "네이버 GFA 상시 신규 유입", source: "naver", medium: "display", campaign: "acquisition_all_always_261101", content: "banner_usp_v1", term: "interest_sports" },
    { situation: "토스애즈 신년 세트 할인", source: "toss", medium: "display", campaign: "conversion_set_newyear_261229", content: "image_price_v2", term: "broad" },
    { situation: "크리에이터 공동구매", source: "fit_jenny", medium: "influencer", campaign: "conversion_set_groupbuy_261103", content: "video_ugc_v1", term: "" },
    { situation: "카카오 채널 기존 고객 쿠폰", source: "kakao", medium: "message", campaign: "crm_all_sale_261115", content: "text_coupon_v1", term: "" },
    { situation: "인스타 프로필 링크 (상시)", source: "instagram", medium: "social", campaign: "brand_all_always_261027", content: "profile_main_v1", term: "" },
    { situation: "스레드 프로필 링크 (상시)", source: "threads", medium: "social", campaign: "brand_all_always_261027", content: "profile_main_v1", term: "" },
    { situation: "인스타 스토리 블프 안내", source: "instagram", medium: "social", campaign: "conversion_wrist_bf_261121", content: "story_event_v1", term: "" },
    { situation: "인스타 비밀링크 시크릿 상품", source: "instagram", medium: "social", campaign: "conversion_wrist_secret_261121", content: "image_usp_v1", term: "" }
  ],

  /* ── 금지 사례 (가이드 탭) ────────────────── */
  donts: [
    { bad: "BF_Wrist", good: "conversion_wrist_bf_261121", why: "대문자 사용, 목적·시작일 누락" },
    { bad: "블프_손목", good: "conversion_wrist_bf_261121", why: "한글은 GA4에서 인코딩되어 조회·필터가 불편" },
    { bad: "conversion-wrist-bf", good: "conversion_wrist_bf_261121", why: "구분자 혼용 — 밑줄(_)만 사용" },
    { bad: "bf_video_v1 (campaign에 기재)", good: "campaign / content 분리", why: "소재 정보는 utm_content에 기재" },
    { bad: "Facebook / FB / facebook.com", good: "facebook", why: "source 표기가 흔들리면 GA4에서 다른 매체로 집계" }
  ],

  /* ── 변경 이력 ────────────────────────────── */
  changelog: [
    { date: "2026-10-27", text: "최초 규칙 제정 (업계 표준 구조 기준)" },
    { date: "2026-10-27", text: "프로필·스토리 링크 소재 형식 추가 (profile, story, highlight), 단축 URL 기능 추가" }
  ]
};
