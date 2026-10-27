/* 작성 가이드 (presets.js 기반 자동 생성) */
(function () {
  const P = window.UTM_PRESETS;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const code = (s) => (s ? `<code>${esc(s)}</code>` : `<span class="muted">—</span>`);
  const table = (head, rows) =>
    `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const active = (list) => list.filter((x) => !x.deprecated);
  const ch = (id) => P.channels.find((c) => c.id === id) || {};
  const codeList = (list) => active(list).map((x) => `${code(x.code)} ${esc(x.label)}`).join(" · ");
  const ok = P.channels.filter((c) => !c.status && !c.deprecated);
  const no = P.channels.filter((c) => c.status && !c.deprecated);

  const sections = [
    {
      title: "사용 방법",
      html: `<div class="summary"><ul>
        <li>랜딩 URL 붙여넣기 → 링크를 거는 위치 선택 → (광고면) 소재명·형식 입력 → 복사</li>
        <li>캠페인 칸은 기본값(오늘 · 구매 전환 · 상시)이 채워져 있어, 행사나 목적이 다를 때만 바꾸면 됩니다.</li>
        <li>프로필·스토리처럼 링크가 그대로 보이는 곳은 <b>단축 URL</b>, 오프라인은 <b>QR</b>을 사용합니다.</li>
        <li>UTM을 넣을 수 없는 위치를 고르면 링크 대신 확인 방법을 안내합니다.</li>
      </ul></div>`
    },
    {
      title: "링크 구조",
      html: table(["파라미터", "구조", "예시", "입력"], [
        [code("utm_source"), "매체", code("facebook"), "위치 선택 시 자동"],
        [code("utm_medium"), "활동 유형 (GA4 채널 기준)", code("paid_social"), "위치 선택 시 자동"],
        [code("utm_campaign"), code("시작일_목적_프로모션_상품"), code("261121_conversion_bf_wrist"), "상품만 선택, 나머지 기본값 있음"],
        [code("utm_content"), code("소재명_형식"), code("doctor_video"), "광고 매체만 필수"],
        [code("utm_term"), "광고: " + code("타겟유형_세부") + " / 검색광고: 키워드", code("lookalike_purchase"), "선택"]
      ]) + `<p class="note">이커머스(DTC) 브랜드 표준 구조를 따르며, 모든 값은 영문 소문자·숫자·밑줄(_)만 사용합니다. 같은 캠페인은 매체가 달라도 같은 캠페인 이름을 씁니다.</p>`
    },
    {
      title: "UTM을 넣을 수 있는 위치",
      html: table(["위치", "source / medium", "소재", "GA4 채널"], ok.map((c) => [
        esc(c.label),
        `${c.custom ? "크리에이터 ID" : code(c.source)} / ${code(c.medium)}`,
        c.content === "required" ? `<span class="pill req">필수</span>` : c.content === "optional" ? `<span class="pill">선택</span>` : `형식 ${code(c.content)} 고정`,
        esc(c.ga4)
      ])) + `<p class="note">스마트스토어 주소를 넣으면 utm 대신 <code>nt_</code> 파라미터로 자동 변환됩니다. 'Unassigned' 매체는 GA4 관리 > 채널 그룹에서 사용자 정의 채널 그룹을 추가하면 별도 줄로 보입니다.</p>`
    },
    {
      title: "UTM을 넣을 수 없는 위치",
      html: table(["위치", "이유", "대신"], no.map((c) => [`${esc(c.label)}${c.status === "forbidden" ? ` <span class="pill req">금지</span>` : ""}`, esc(c.reason), esc(c.alt)]))
    },
    {
      title: "코드표",
      html: table(["구간", "값"], [
        ["목적", codeList(P.objectives)],
        ["프로모션", codeList(P.promotions)],
        ["상품", codeList(P.products) + ` <span class="muted small">(전 상품이면 비움)</span>`],
        ["소재 형식", codeList(P.formats)],
        ["타겟 유형", codeList(P.targets)]
      ])
    },
    {
      title: "작성 예시",
      html: table(["상황", "source / medium", "campaign", "content", "term"],
        P.examples.map((e) => { const c = ch(e.channel); return [esc(e.situation), `${c.custom ? "크리에이터 ID" : code(c.source)} / ${code(c.medium)}`, code(e.campaign), code(e.content), code(e.term)]; }))
    },
    {
      title: "메타 광고 URL 매개변수",
      html: `<p>메타 광고를 고르면 <b>'광고관리자 URL 매개변수 칸용으로 만들기'</b>를 켤 수 있습니다. 광고관리자 이름이 그대로 utm에 들어가므로 아래 규칙으로 이름을 지어 주세요.</p>` +
        table(["광고관리자", "→ utm", "이름 규칙"], [
          ["캠페인 이름", code("utm_campaign"), code("시작일_목적_프로모션_상품")],
          ["광고세트 이름", code("utm_term"), code("타겟유형_세부")],
          ["광고 이름", code("utm_content"), code("소재명_형식")]
        ])
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
