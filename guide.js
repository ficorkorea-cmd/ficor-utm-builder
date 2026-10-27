/* 작성 가이드 (presets.js 기반 자동 생성) */
(function () {
  const P = window.UTM_PRESETS;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const code = (s) => (s ? `<code>${esc(s)}</code>` : `<span class="muted">—</span>`);
  const table = (head, rows) =>
    `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const active = (list) => list.filter((x) => !x.deprecated);
  const ch = (id) => P.channels.find((c) => c.id === id) || {};

  const sections = [
    {
      title: "사용 방법",
      html: `<div class="summary"><ul>
        <li>랜딩 URL 붙여넣기 → 매체 선택 → 필요하면 프로모션·상품 변경 → 복사</li>
        <li>프로모션·상품·시작일은 기본값(상시 · 전 상품 · 오늘)이 들어가 있어, 특별한 캠페인이 아니면 그대로 두면 됩니다.</li>
        <li>소재명은 광고 매체(메타·GFA·토스)에서만 필수입니다.</li>
        <li>인스타·스레드 프로필처럼 링크가 그대로 보이는 곳은 <b>단축 URL</b>을 사용하세요. 눌렀을 때 utm 값은 그대로 전달됩니다.</li>
      </ul></div>`
    },
    {
      title: "표기 규칙",
      html: table(["규칙", "이유"], [
        ["영문 소문자 · 숫자 · 밑줄(_)만", "GA4는 대소문자·표기가 다르면 다른 값으로 집계합니다."],
        ["같은 캠페인은 매체가 달라도 같은 캠페인 이름", "매체별 성과를 한 캠페인으로 묶어 비교할 수 있습니다."],
        ["캠페인 = " + code("프로모션_상품_시작일"), "예: " + code("bf_wrist_261121")]
      ])
    },
    {
      title: "매체별 값",
      html: table(["매체", "source / medium", "소재명", "GA4 채널"],
        P.channels.filter((c) => !c.deprecated).map((c) => [
          esc(c.label),
          `${c.custom ? "크리에이터 ID" : code(c.source)} / ${code(c.medium)}`,
          c.content === "required" ? `<span class="pill req">필수</span>` : c.content === "optional" ? `<span class="pill">선택</span>` : code(c.content) + ` <span class="muted small">자동</span>`,
          esc(c.ga4)
        ])) +
        `<p class="note">메타 광고는 지면과 관계없이 <code>facebook</code>으로 통일합니다. 'Unassigned' 매체는 GA4 관리 > 채널 그룹에서 사용자 정의 채널 그룹을 추가하면 별도 줄로 보입니다.</p>`
    },
    {
      title: "프로모션 · 상품 코드",
      html: table(["프로모션", "코드"], active(P.promotions).map((x) => [esc(x.label), code(x.code)])) +
        table(["상품", "코드"], active(P.products).map((x) => [esc(x.label), code(x.code)]))
    },
    {
      title: "작성 예시",
      html: table(["상황", "source / medium", "campaign", "content"],
        P.examples.map((e) => { const c = ch(e.channel); return [esc(e.situation), `${c.custom ? "크리에이터 ID" : code(c.source)} / ${code(c.medium)}`, code(e.campaign), code(e.content)]; }))
    },
    {
      title: "판매 채널별 처리",
      html: table(["랜딩", "처리"], [
        ["자사몰", "utm 파라미터 생성 → GA4에서 확인"],
        ["스마트스토어", "nt_ 파라미터로 자동 변환 → 스마트스토어센터 > 통계 > 마케팅분석에서 확인"],
        ["쿠팡", "외부 파라미터 추적 불가 → 생성하지 않음"]
      ])
    },
    {
      title: "메타 광고 URL 매개변수",
      html: `<p>메타 광고를 고르면 <b>'광고관리자 URL 매개변수 칸용으로 만들기'</b>를 켤 수 있습니다. 광고관리자의 캠페인 이름·광고 이름이 자동으로 utm에 들어가므로, 광고관리자에서 캠페인 이름은 ${code("프로모션_상품_시작일")}, 광고 이름은 소재명 규칙(예: ${code("video_doctor")})으로 지어 주세요.</p>`
    },
    {
      title: "변경 이력",
      html: table(["날짜", "내용"], P.changelog.map((c) => [esc(c.date), esc(c.text)]))
    }
  ];

  function render() {
    document.getElementById("guideOut").innerHTML = sections
      .map((s) => `<section class="g-sec"><h3 class="sec">${esc(s.title)}</h3>${s.html}</section>`).join("");
  }

  window.UTM_GUIDE = { render };
})();
