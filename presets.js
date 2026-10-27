/*
 * FICOR UTM 빌더 사전 파일
 * 이 파일만 수정하면 선택 목록 · 검사 · 작성 가이드에 모두 반영됩니다.
 *  - code 값은 영문 소문자 / 숫자 / 밑줄(_)만 사용
 *  - 이미 쓰던 값은 지우지 말고 deprecated: true 로 숨김
 */
window.UTM_PRESETS = {
  version: "2.0.0",

  domains: {
    mall: ["ficor.kr", "www.ficor.kr", "ficorkorea.imweb.me"],
    smartstore: ["smartstore.naver.com", "brand.naver.com", "m.smartstore.naver.com", "m.brand.naver.com"],
    coupang: ["coupang.com", "www.coupang.com", "m.coupang.com", "link.coupang.com"]
  },

  /* 매체 (선택 한 번으로 source · medium 결정)
   * content : "required" 소재명 필수 / "optional" 선택 / 고정값(예: "profile")
   * meta    : 메타 광고관리자 URL 매개변수 모드 지원
   * custom  : source 직접 입력 (크리에이터 ID 등)
   */
  channels: [
    { id: "meta_ad",        label: "메타 광고 (페이스북·인스타)", source: "facebook",  medium: "paid_social", ga4: "Paid Social",    content: "required", meta: true },
    { id: "naver_sa",       label: "네이버 검색광고",             source: "naver",     medium: "cpc",         ga4: "Paid Search",    content: "optional" },
    { id: "naver_gfa",      label: "네이버 GFA",                  source: "naver",     medium: "display",     ga4: "Display",        content: "required" },
    { id: "toss",           label: "토스애즈",                    source: "toss",      medium: "display",     ga4: "Display",        content: "required" },
    { id: "ig_profile",     label: "인스타 프로필 링크",          source: "instagram", medium: "social",      ga4: "Organic Social", content: "profile" },
    { id: "ig_story",       label: "인스타 스토리 링크",          source: "instagram", medium: "social",      ga4: "Organic Social", content: "story" },
    { id: "ig_post",        label: "인스타 게시물 · DM",          source: "instagram", medium: "social",      ga4: "Organic Social", content: "optional" },
    { id: "threads_profile",label: "스레드 프로필 링크",          source: "threads",   medium: "social",      ga4: "Organic Social", content: "profile" },
    { id: "threads_post",   label: "스레드 게시물",               source: "threads",   medium: "social",      ga4: "Organic Social", content: "optional" },
    { id: "kakao",          label: "카카오 채널 메시지",          source: "kakao",     medium: "message",     ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "optional" },
    { id: "sms",            label: "문자 · 알림톡",               source: "sms",       medium: "message",     ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "optional" },
    { id: "influencer",     label: "인플루언서 · 공동구매",       source: "",          medium: "influencer",  ga4: "Unassigned (사용자 정의 채널 그룹 필요)", content: "optional", custom: true }
  ],

  /* 캠페인 이름 = 프로모션_상품_시작일 */
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
    { code: "all", label: "전 상품" },
    { code: "wrist", label: "손목" },
    { code: "elbow", label: "팔꿈치" },
    { code: "knee", label: "무릎" },
    { code: "set", label: "세트" }
  ],

  examples: [
    { situation: "인스타 프로필 링크", channel: "ig_profile", campaign: "always_all_261027", content: "profile" },
    { situation: "메타 블프 영상 광고", channel: "meta_ad", campaign: "bf_wrist_261121", content: "video_doctor" },
    { situation: "토스애즈 신년 세트", channel: "toss", campaign: "newyear_set_261229", content: "image_price" },
    { situation: "인스타 스토리 블프 안내", channel: "ig_story", campaign: "bf_wrist_261121", content: "story_bf" },
    { situation: "카카오 쿠폰 메시지", channel: "kakao", campaign: "sale_all_261115", content: "" },
    { situation: "크리에이터 공동구매", channel: "influencer", campaign: "groupbuy_set_261103", content: "" }
  ],

  changelog: [
    { date: "2026-10-27", text: "최초 규칙 제정" },
    { date: "2026-10-27", text: "입력 간소화: 매체 한 번 선택, 캠페인 = 프로모션_상품_시작일, 소재명 한 칸" }
  ]
};
