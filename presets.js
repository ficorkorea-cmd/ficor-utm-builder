/*
 * FICOR UTM 빌더 사전 파일
 * 이 파일만 수정하면 선택 목록 · 검사 · 작성 가이드에 모두 반영됩니다.
 *  - code 값은 영문 소문자 / 숫자만 사용 (구간 구분은 빌더가 _ 로 자동 연결)
 *  - 이미 쓰던 값은 지우지 말고 deprecated: true 로 숨김
 */
window.UTM_PRESETS = {
  version: "3.1.0",

  domains: {
    mall: ["ficor.kr", "www.ficor.kr", "ficorkorea.imweb.me"],
    smartstore: ["smartstore.naver.com", "brand.naver.com", "m.smartstore.naver.com", "m.brand.naver.com"],
    coupang: ["coupang.com", "www.coupang.com", "m.coupang.com", "link.coupang.com"]
  },

  /* 링크 위치
   * status  : ok(생성) / blocked(UTM 불가 → 안내만) / forbidden(넣으면 안 됨)
   * content : "required" 소재 필수 / "optional" 선택 / 고정 형식(예: "profile")
   * term    : "keyword" 검색 키워드 입력 / "target" 타겟 입력 / 없음
   * meta    : 광고관리자 URL 매개변수(매크로) 모드
   * custom  : source 직접 입력 (크리에이터 ID)
   */
  channels: [
    { group: "광고", id: "meta_ad", label: "메타 광고 (페이스북·인스타)", source: "facebook", medium: "paid_social", ga4: "Paid Social", content: "required", term: "target", meta: true },
    { group: "광고", id: "naver_sa", label: "네이버 검색광고 (파워링크)", source: "naver", medium: "cpc", ga4: "Paid Search", content: "optional", term: "keyword" },
    { group: "광고", id: "naver_gfa", label: "네이버 GFA", source: "naver", medium: "display", ga4: "Display", content: "required", term: "target" },
    { group: "광고", id: "toss", label: "토스애즈", source: "toss", medium: "display", ga4: "Display", content: "required", term: "target" },

    { group: "소셜", id: "ig_profile", label: "인스타 프로필 링크", source: "instagram", medium: "social", ga4: "Organic Social", content: "profile", short: true },
    { group: "소셜", id: "ig_story", label: "인스타 스토리 링크 스티커", source: "instagram", medium: "social", ga4: "Organic Social", content: "story", short: true },
    { group: "소셜", id: "threads_profile", label: "스레드 프로필 링크", source: "threads", medium: "social", ga4: "Organic Social", content: "profile", short: true },
    { group: "소셜", id: "threads_post", label: "스레드 게시물 링크", source: "threads", medium: "social", ga4: "Organic Social", content: "optional", short: true },
    { group: "소셜", id: "youtube", label: "유튜브 설명란 · 고정 댓글", source: "youtube", medium: "social", ga4: "Organic Social", content: "optional" },

    { group: "메시지", id: "kakao", label: "카카오 채널 메시지 버튼", source: "kakao", medium: "message", ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "optional" },
    { group: "메시지", id: "sms", label: "문자 · 알림톡", source: "sms", medium: "message", ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "optional" },

    { group: "협업 · 오프라인", id: "influencer", label: "인플루언서 게시물 링크", source: "", medium: "influencer", ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "optional", custom: true },
    { group: "협업 · 오프라인", id: "offline", label: "오프라인 QR (패키지·전단·POP)", source: "offline", medium: "qr", ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "optional", qr: true },

    { group: "콘텐츠", id: "naver_blog", label: "네이버 블로그 본문 링크 (피코밴드 공식 블로그)", source: "naver_blog", medium: "blog", ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "required" },
    { group: "콘텐츠", id: "naver_cafe", label: "정형외과 제휴 카페 게시글 링크", source: "naver_cafe", medium: "community", ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "required" },

    { group: "UTM 불가", id: "ig_feed", label: "인스타 피드·릴스 캡션 · 댓글", status: "blocked", reason: "캡션과 댓글의 링크는 클릭되지 않습니다.", alt: "캡션에 '프로필 링크 확인'으로 안내하고 '인스타 프로필 링크'로 만드세요." },
    { group: "UTM 불가", id: "naver_shopping", label: "네이버 쇼핑검색광고", status: "blocked", reason: "랜딩이 스마트스토어 상품으로 고정되어 파라미터를 넣을 수 없습니다.", alt: "스마트스토어센터 > 통계 > 마케팅분석과 검색광고 리포트에서 확인합니다." },
    { group: "UTM 불가", id: "brandconnect", label: "네이버 브랜드커넥트 공동구매", status: "blocked", reason: "네이버 내 상품으로 연결되어 GA4에 잡히지 않습니다.", alt: "브랜드커넥트 성과 리포트에서 확인합니다." },
    { group: "UTM 불가", id: "coupang", label: "쿠팡 상품 · 쿠팡 광고", status: "blocked", reason: "쿠팡은 외부 파라미터로 유입을 추적할 수 없습니다.", alt: "쿠팡 서플라이어허브 · 광고 리포트에서 확인합니다." },
    { group: "UTM 불가", id: "internal", label: "자사몰 내부 배너 · 버튼", status: "forbidden", reason: "내부 링크에 UTM을 넣으면 고객의 원래 유입 경로(광고·SNS 등)가 덮어써져 성과가 사라집니다.", alt: "내부 클릭은 GA4 이벤트로 측정합니다. UTM은 넣지 마세요." }
  ],

  /* utm_campaign = (날짜_)목적_프로모션(_상품) — 날짜·상품은 선택 */
  objectives: [
    { code: "conversion", label: "구매 전환" },
    { code: "acquisition", label: "신규 유입" },
    { code: "brand", label: "인지" },
    { code: "retargeting", label: "재방문" },
    { code: "crm", label: "기존 고객" }
  ],
  promotions: [
    { code: "always", label: "상시" },
    { code: "sale", label: "일반 할인" },
    { code: "launch", label: "신상품" },
    { code: "bf", label: "블랙프라이데이" },
    { code: "newyear", label: "신년" },
    { code: "secret", label: "비밀링크" },
    { code: "groupbuy", label: "공동구매" }
  ],
  products: [
    { code: "wrist", label: "손목" },
    { code: "elbow", label: "팔꿈치" },
    { code: "knee", label: "무릎" },
    { code: "set", label: "세트" }
  ],

  /* utm_content = 소재명_형식 */
  formats: [
    { code: "image", label: "이미지" },
    { code: "video", label: "영상" },
    { code: "carousel", label: "슬라이드" },
    { code: "banner", label: "배너" },
    { code: "text", label: "텍스트" },
    { code: "profile", label: "프로필 링크" },
    { code: "story", label: "스토리 링크" },
    { code: "package", label: "패키지" },
    { code: "flyer", label: "전단" }
  ],

  /* utm_term = 타겟유형_세부 */
  targets: [
    { code: "broad", label: "타겟 미지정" },
    { code: "interest", label: "관심사" },
    { code: "lookalike", label: "유사 타겟" },
    { code: "retarget", label: "리타겟" }
  ],

  examples: [
    { situation: "메타 블프 손목 영상 광고", channel: "meta_ad", campaign: "261121_conversion_bf_wrist", content: "doctor_video", term: "lookalike_purchase" },
    { situation: "토스애즈 신년 세트 이미지", channel: "toss", campaign: "261229_conversion_newyear_set", content: "price_image", term: "broad" },
    { situation: "네이버 파워링크", channel: "naver_sa", campaign: "acquisition_always", content: "", term: "손목보호대" },
    { situation: "인스타 프로필 링크 (상시)", channel: "ig_profile", campaign: "brand_always", content: "profile", term: "" },
    { situation: "인스타 스토리 블프 안내", channel: "ig_story", campaign: "261121_conversion_bf", content: "event_story", term: "" },
    { situation: "카카오 쿠폰 메시지", channel: "kakao", campaign: "261115_crm_sale", content: "coupon_text", term: "" },
    { situation: "패키지 동봉 QR", channel: "offline", campaign: "crm_always", content: "review_package", term: "" },
    { situation: "블로그 엘보 선택 가이드 글", channel: "naver_blog", campaign: "acquisition_always_elbow", content: "elbowguide_text", term: "" },
    { situation: "제휴 카페 손목 비교 글", channel: "naver_cafe", campaign: "conversion_always_wrist", content: "cafewristcompare_text", term: "" }
  ],

  changelog: [
    { date: "2026-10-27", text: "최초 규칙 제정" },
    { date: "2026-10-27", text: "이커머스(DTC) 표준 구조 적용: 캠페인 = 시작일_목적_프로모션(_상품), 소재 = 소재명_형식, 타겟 = 타겟유형_세부 / UTM 불가 위치 안내 추가" },
    { date: "2026-10-28", text: "캠페인 날짜를 선택 항목으로 변경 (상시 링크는 날짜 없이 생성)" },
    { date: "2026-10-29", text: "네이버 블로그(naver_blog / blog)·정형외과 제휴 카페(naver_cafe / community) 채널 추가 — 기존 채널·단축 URL·검사 규칙 변경 없음" }
  ]
};
