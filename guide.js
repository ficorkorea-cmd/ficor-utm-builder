/* 작성 가이드 탭 + 인라인 도움말 (presets.js 기반 자동 생성) */
(function () {
  const P = window.UTM_PRESETS;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const table = (head, rows) =>
    `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div>`;
  const code = (s) => (s ? `<code>${esc(s)}</code>` : `<span class="muted">—</span>`);
  const active = (list) => list.filter((x) => !x.deprecated);

  const sections = [
    {
      id: "g-intro", title: "이 도구를 쓰는 이유",
      html: `
        <div class="summary">
          <ul>
            <li>매체마다 링크 표기가 달라지면(<code>Facebook</code> / <code>fb</code> / <code>facebook</code>) GA4 리포트에서 같은 매체가 여러 줄로 흩어집니다.</li>
            <li>링크를 만드는 모든 담당자가 같은 규칙을 쓰도록, 값은 가능한 한 목록에서 고르게 되어 있습니다.</li>
            <li>규칙이 통일되면 GA4에서 매체 · 캠페인 · 소재 단위로 바로 비교할 수 있습니다.</li>
          </ul>
        </div>`
    },
    {
      id: "g-basic", title: "기본 원칙",
      html: table(["원칙", "내용"], [
        ["영문 소문자", "GA4는 대소문자를 다른 값으로 집계합니다. (<code>Naver</code> ≠ <code>naver</code>)"],
        ["구분자는 밑줄(_)만", "하이픈(-) · 공백 · 점(.) 사용 불가"],
        ["한글 사용 안 함", "GA4에서 인코딩되어 조회·필터가 불편합니다. (네이버 검색광고 키워드만 예외)"],
        ["넓은 범위 → 좁은 범위", "캠페인(왜·언제) → 소재(무엇을) → 타겟(누구에게)"],
        ["한 캠페인 = 한 이름", "같은 캠페인은 매체가 달라도 utm_campaign 값을 동일하게 사용"]
      ])
    },
    {
      id: "g-params", title: "파라미터별 역할",
      html: table(["파라미터", "담는 정보", "구조", "예시"], [
        [code("utm_source"), "어디서 (매체)", "목록에서 선택", code("facebook")],
        [code("utm_medium"), "어떤 방식으로 (유료/오가닉/메시지)", "매체별 허용 값", code("paid_social")],
        [code("utm_campaign"), "왜 · 언제 (캠페인)", code(P.campaign.pattern), code("conversion_wrist_bf_261121")],
        [code("utm_content"), "무엇을 (소재)", code(P.content.pattern), code("video_doctor_v1")],
        [code("utm_term"), "누구에게 (타겟 · 키워드)", "검색광고: 키워드 / 그 외: 타겟유형_세부", code("lookalike_purchase")]
      ])
    },
    {
      id: "g-source", title: "매체 사전 (source / medium)",
      html:
        table(["매체", "utm_source", "utm_medium", "GA4 채널", "소재(content)"],
          P.sources.flatMap((s) => s.mediums.map((m) => [
            `${esc(s.label)}<div class="muted small">${esc(m.label)}</div>`,
            s.custom ? `<span class="muted">크리에이터 ID 직접 입력</span>` : code(s.code),
            code(m.code),
            esc(m.channel),
            m.contentRequired ? `<span class="pill req">필수</span>` : `<span class="pill">선택</span>`
          ]))) +
        `<p class="note">메타 광고가 페이스북·인스타그램 지면에 함께 노출되는 경우 <code>facebook</code>으로 통일합니다. GA4 채널이 '미분류'인 매체는 GA4 관리 > 채널 그룹에서 사용자 정의 채널 그룹을 추가하면 리포트에서 별도 줄로 보입니다.</p>`
    },
    {
      id: "g-campaign", title: "캠페인 이름 (utm_campaign)",
      html: `
        <div class="pattern"><span>목적</span><i>_</i><span>상품</span><i>_</i><span>프로모션</span><i>_</i><span>시작일 YYMMDD</span></div>
        <h4>목적</h4>${table(["값", "의미", "설명"], active(P.campaign.objectives).map((x) => [code(x.code), esc(x.label), esc(x.desc || "")]))}
        <h4>상품</h4>${table(["값", "의미"], active(P.campaign.products).map((x) => [code(x.code), esc(x.label)]))}
        <h4>프로모션</h4>${table(["값", "의미", "설명"], active(P.campaign.promotions).map((x) => [code(x.code), esc(x.label), esc(x.desc || "")]))}
        <h4>시작일</h4><p>캠페인 시작일을 <code>YYMMDD</code>로 기재합니다. 상시 캠페인은 최초 시작일을 그대로 유지합니다. (예: 2026년 11월 21일 → <code>261121</code>)</p>`
    },
    {
      id: "g-content", title: "소재 이름 (utm_content)",
      html: `
        <div class="pattern"><span>형식</span><i>_</i><span>주제</span><i>_</i><span>버전</span></div>
        <h4>형식</h4>${table(["값", "의미"], active(P.content.formats).map((x) => [code(x.code), esc(x.label)]))}
        <h4>주제 (자주 쓰는 값 · 영문 자유 입력)</h4>${table(["값", "의미"], P.content.topicExamples.map((x) => [code(x.code), esc(x.label)]))}
        <h4>버전</h4><p>같은 주제의 소재를 수정·교체할 때마다 <code>v1</code> → <code>v2</code>로 올립니다.</p>
        <h4>소재 구분이 필수인 매체</h4>
        <p>소재가 여러 개 동시에 운영되는 유료 매체(${P.sources.flatMap((s) => s.mediums.filter((m) => m.contentRequired).map((m) => esc(s.label) + " " + esc(m.label))).join(", ")})는 소재별 효율 비교를 위해 필수입니다. 그 외 매체는 위치(피드/스토리) 구분이나 문안 A/B가 있을 때만 사용합니다.</p>`
    },
    {
      id: "g-term", title: "타겟 · 키워드 (utm_term)",
      html: `
        <p><b>네이버 검색광고</b>는 검색 키워드를 그대로 기재합니다(한글 가능). 그 외 매체는 <code>타겟유형_세부</code>로 작성합니다.</p>
        ${table(["타겟 유형", "의미", "예시"], active(P.targetTypes).map((x) => [code(x.code), esc(x.label), code(x.code === "broad" ? "broad" : x.code + "_" + ({ interest: "sports", lookalike: "purchase", retarget: "cart_7d" }[x.code] || "detail"))]))}`
    },
    {
      id: "g-meta", title: "메타 광고 URL 매개변수",
      html: `
        <p>메타 광고는 광고관리자의 <b>'추적 > URL 매개변수'</b> 칸에 매크로를 넣으면, 캠페인·광고세트·광고 이름이 자동으로 UTM에 들어갑니다. 생성 탭에서 메타 유료 광고를 선택하고 'URL 매개변수 모드'를 켜면 만들어집니다.</p>
        ${table(["파라미터", "매크로", "광고관리자 이름 규칙"], [
          [code("utm_campaign"), code("{{campaign.name}}"), `캠페인 이름 = ${code(P.campaign.pattern)}`],
          [code("utm_content"), code("{{ad.name}}"), `광고 이름 = ${code(P.content.pattern)}`],
          [code("utm_term"), code("{{adset.name}}"), `광고세트 이름 = ${code("타겟유형_세부")}`]
        ])}
        <p class="note">매크로는 광고관리자에 적힌 이름을 그대로 가져오므로, 광고관리자 이름도 이 가이드 규칙대로 지어야 GA4에서 깔끔하게 보입니다.</p>`
    },
    {
      id: "g-profile", title: "프로필 링크 · 단축 URL",
      html: `
        <p>인스타그램 · 스레드 프로필(바이오) 링크도 utm을 붙여야 GA4에서 '프로필을 통해 들어온 방문'으로 따로 집계됩니다. utm 없이 넣으면 <code>l.instagram.com</code> 같은 추천 유입으로 섞여 들어옵니다.</p>
        ${table(["위치", "source / medium", "campaign", "content"], [
          ["인스타 프로필 링크", `${code("instagram")} / ${code("social")}`, code("brand_all_always_261027"), code("profile_main_v1")],
          ["스레드 프로필 링크", `${code("threads")} / ${code("social")}`, code("brand_all_always_261027"), code("profile_main_v1")],
          ["프로필 링크를 이벤트용으로 잠시 교체", `${code("instagram")} / ${code("social")}`, code("conversion_wrist_bf_261121"), code("profile_event_v1")],
          ["스토리 링크 스티커", `${code("instagram")} / ${code("social")}`, "해당 캠페인 이름", code("story_주제_v1")]
        ])}
        <h4>단축 URL</h4>
        <p>프로필처럼 링크가 그대로 노출되는 곳은 생성 탭의 <b>'단축 URL 만들기'</b>로 짧게 바꿔 넣습니다. 단축 URL을 누르면 원래 URL로 이동하면서 utm 값이 그대로 전달되므로 GA4 집계는 동일합니다. '단축 주소 이름'을 입력하면 <code>is.gd/ficor_insta</code>처럼 알아보기 쉬운 주소로 만들 수 있습니다(영문·숫자·밑줄 5~30자, 이미 사용 중인 이름은 불가).</p>
        <p class="note">한 번 만든 단축 URL은 수정·삭제할 수 없습니다. 링크 내용이 바뀌면 버전(v2)을 올려 새로 만듭니다.</p>`
    },
    {
      id: "g-channel", title: "판매 채널별 처리",
      html: table(["랜딩", "처리", "확인 위치"], [
        ["자사몰", "utm 파라미터 생성", "GA4"],
        ["네이버 스마트스토어", "GA4가 설치되지 않으므로 <code>nt_source</code> · <code>nt_medium</code> · <code>nt_detail</code> · <code>nt_keyword</code>로 자동 변환 (값 규칙은 동일)", "스마트스토어센터 > 통계 > 마케팅분석"],
        ["쿠팡", "외부 파라미터로 유입 추적 불가 → 생성하지 않음", "쿠팡 자체 통계"]
      ])
    },
    {
      id: "g-examples", title: "작성 예시",
      html: table(["상황", "source / medium", "campaign", "content", "term"],
        P.examples.map((e) => [esc(e.situation), `${code(e.source)} / ${code(e.medium)}`, code(e.campaign), code(e.content), code(e.term)]))
    },
    {
      id: "g-donts", title: "자주 틀리는 표기",
      html: table(["잘못된 표기", "올바른 표기", "이유"], P.donts.map((d) => [`<code class="bad">${esc(d.bad)}</code>`, code(d.good), esc(d.why)]))
    },
    {
      id: "g-log", title: "변경 이력",
      html: table(["날짜", "내용"], P.changelog.map((c) => [esc(c.date), esc(c.text)])) +
        `<p class="muted small">규칙 버전 ${esc(P.version)} · 값 추가·변경 요청은 사전 관리 담당자에게 전달해 주세요.</p>`
    }
  ];

  /* 인라인 도움말 (생성 탭의 ? 버튼) */
  const helps = {
    landing: { target: "g-channel", html: `<b>랜딩 URL</b><br>자사몰 주소를 붙여넣으면 utm이, 스마트스토어 주소면 nt_ 파라미터가 자동으로 만들어집니다. 쿠팡은 추적이 되지 않아 생성하지 않습니다.` },
    source: { target: "g-source", html: `<b>매체</b><br>목록에서만 선택합니다. 같은 매체를 다르게 적으면 GA4에서 다른 매체로 집계됩니다.<br>메타 광고는 지면과 관계없이 <code>facebook</code>으로 통일합니다.` },
    campaign: { target: "g-campaign", html: `<b>캠페인 이름</b> <code>${P.campaign.pattern}</code><br>예: <code>conversion_wrist_bf_261121</code><br>같은 캠페인은 매체가 달라도 같은 이름을 사용합니다.` },
    content: { target: "g-content", html: `<b>소재 이름</b> <code>${P.content.pattern}</code><br>예: <code>video_doctor_v1</code><br>메타 · GFA · 토스애즈 등 소재가 여러 개인 유료 매체는 필수입니다.` },
    term: { target: "g-term", html: `<b>타겟 · 키워드</b><br>네이버 검색광고: 검색 키워드 그대로<br>그 외: <code>타겟유형_세부</code> (예: <code>retarget_cart_7d</code>)` }
  };

  function render() {
    document.getElementById("guideToc").innerHTML =
      `<div class="toc-title">목차</div>` + sections.map((s, i) => `<a href="#${s.id}"><span>${i + 1}</span>${esc(s.title)}</a>`).join("");
    document.getElementById("guideOut").innerHTML = sections
      .map((s) => `<section class="g-sec" id="${s.id}"><h3 class="sec">${esc(s.title)}</h3>${s.html}</section>`)
      .join("");
    document.querySelectorAll("#guideToc a").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector(a.getAttribute("href")).scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
  }

  window.UTM_GUIDE = { render, helps };
})();
