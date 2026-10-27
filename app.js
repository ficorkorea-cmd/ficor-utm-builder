/* FICOR UTM 빌더 — 화면 로직 */
(function () {
  const P = window.UTM_PRESETS;
  const R = window.UTM_RULES;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const HIST_KEY = "ficor_utm_history_v1";
  const META_MACROS = { campaign: "{{campaign.name}}", content: "{{ad.name}}", term: "{{adset.name}}" };

  let current = null; // 마지막 생성 결과

  /* ── 공통 유틸 ─────────────────────────────── */
  function opt(list, placeholder, labelFn) {
    return (placeholder ? `<option value="">${placeholder}</option>` : "") +
      list.filter((x) => !x.deprecated).map((x) => `<option value="${esc(x.code)}">${esc(labelFn ? labelFn(x) : x.label)}</option>`).join("");
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1800);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
  }

  function yymmdd(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return y.slice(2) + m + d;
  }

  function todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  /* ── 탭 ─────────────────────────────────────── */
  function showTab(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "tab-" + name));
    if (name === "history") renderHistory();
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
    window.scrollTo({ top: 0 });
  }

  /* ── 초기 셋업 ──────────────────────────────── */
  function initSelects() {
    $("landingPreset").innerHTML = `<option value="">선택</option>` +
      P.landingPages.map((p, i) => `<option value="${i}">${esc(p.label)}</option>`).join("");
    $("source").innerHTML = opt(P.sources, "매체 선택");
    $("cObjective").innerHTML = opt(P.campaign.objectives, "목적", (x) => `${x.code} · ${x.label}`);
    $("cProduct").innerHTML = opt(P.campaign.products, "상품", (x) => `${x.code} · ${x.label}`);
    $("cPromotion").innerHTML = opt(P.campaign.promotions, "프로모션", (x) => `${x.code} · ${x.label}`);
    $("ctFormat").innerHTML = opt(P.content.formats, "형식", (x) => `${x.code} · ${x.label}`);
    $("topicList").innerHTML = P.content.topicExamples.map((x) => `<option value="${esc(x.code)}">${esc(x.label)}</option>`).join("");
    $("ctVersion").innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="v${i + 1}">v${i + 1}</option>`).join("");
    $("tType").innerHTML = opt(P.targetTypes, "선택 안 함", (x) => `${x.code} · ${x.label}`);
    $("cDate").value = todayISO();
  }

  function onSourceChange() {
    const s = R.findSource($("source").value);
    const med = $("medium");
    if (!s) {
      med.innerHTML = `<option value="">매체를 먼저 선택</option>`;
      med.disabled = true;
    } else {
      med.innerHTML = s.mediums.map((m) => `<option value="${esc(m.code)}">${esc(m.code)} · ${esc(m.label)}</option>`).join("");
      med.disabled = false;
    }
    $("customSourceWrap").hidden = !(s && s.custom);
    $("customSourceHint").textContent = s && s.custom ? s.customHint || "" : "";
    onMediumChange();
  }

  function selectedMedium() {
    const s = R.findSource($("source").value);
    return s ? s.mediums.find((m) => m.code === $("medium").value) || null : null;
  }

  function onMediumChange() {
    const s = $("source").value, m = selectedMedium();
    $("channelInfo").innerHTML = m ? `GA4 채널 분류: <b>${esc(m.channel)}</b>` : "";
    const req = !!(m && m.contentRequired);
    $("contentReqBadge").textContent = req ? "필수" : "선택";
    $("contentReqBadge").classList.toggle("on", req);
    const isSA = s === "naver" && m && m.code === "cpc";
    $("termTargetRow").hidden = isSA;
    $("termKeywordRow").hidden = !isSA;
    $("termHint").textContent = m && m.termHint ? "작성 안내: " + m.termHint : "";
    applyMetaMode();
  }

  function applyMetaMode() {
    update();
  }

  function syncMetaUI(dest) {
    const m = selectedMedium();
    const allowed = !!(m && m.meta) && dest !== "smartstore" && dest !== "coupang";
    $("metaModeWrap").hidden = !allowed;
    if (!allowed) $("metaMode").checked = false;
    const on = $("metaMode").checked;
    $("contentBlock").classList.toggle("is-macro", on);
    $("termBlock").classList.toggle("is-macro", on);
    $("metaCampaignNote").hidden = !on;
  }

  /* ── 값 수집 ────────────────────────────────── */
  function collect() {
    const sourceSel = $("source").value;
    const srcObj = R.findSource(sourceSel);
    const source = srcObj && srcObj.custom ? R.sanitize($("customSource").value) : sourceSel;
    const medium = $("medium").disabled ? "" : $("medium").value;
    const m = selectedMedium();

    const parts = [$("cObjective").value, $("cProduct").value, $("cPromotion").value, yymmdd($("cDate").value)];
    const campaign = parts.every(Boolean) ? parts.join("_") : "";

    const topic = R.sanitize($("ctTopic").value);
    const content = topic && $("ctFormat").value ? [$("ctFormat").value, topic, $("ctVersion").value].join("_") : "";

    let term = "";
    if (sourceSel === "naver" && medium === "cpc") term = $("tKeyword").value.trim();
    else if ($("tType").value) {
      const detail = R.sanitize($("tDetail").value);
      term = detail ? `${$("tType").value}_${detail}` : $("tType").value;
    }

    return {
      landing: $("landing").value.trim(),
      source, sourceSel, medium, campaign, content, term,
      parts, topicRaw: $("ctTopic").value, formatSel: $("ctFormat").value,
      contentRequired: !!(m && m.contentRequired),
      channel: m ? m.channel : "",
      metaMode: $("metaMode").checked,
      memo: $("memo").value.trim()
    };
  }

  /* ── 세그먼트 미리보기 ─────────────────────── */
  function segPreview(el, labels, values) {
    el.innerHTML = labels.map((l, i) => {
      const v = values[i];
      return `<span class="seg ${v ? "filled" : ""}"><small>${esc(l)}</small>${v ? esc(v) : "—"}</span>`;
    }).join(`<span class="seg-sep">_</span>`);
  }

  /* ── 생성 ───────────────────────────────────── */
  function build(v) {
    const res = { dest: R.destType(v.landing), url: "", params: [], checks: [], ready: false, metaParams: "" };

    if (!v.landing) { res.checks.push({ level: "pending", text: "랜딩 URL을 입력하세요." }); }
    else if (res.dest === "invalid") { res.checks.push({ level: "error", text: "URL 형식이 아닙니다. https:// 부터 입력하세요." }); }
    else if (res.dest === "coupang") { res.checks.push({ level: "error", text: "쿠팡 링크는 외부 파라미터로 유입 추적이 되지 않아 생성하지 않습니다." }); return res; }
    else if (res.dest === "other") { res.checks.push({ level: "warn", text: "등록되지 않은 도메인입니다. 자사몰 주소인지 확인하세요." }); }

    // 값 검사
    if (!v.sourceSel) res.checks.push({ level: "pending", text: "매체(utm_source)를 선택하세요." });
    else if ((R.findSource(v.sourceSel) || {}).custom) {
      if (!v.source) res.checks.push({ level: "pending", text: "크리에이터 ID를 입력하세요." });
      else res.checks.push({ level: "ok", text: `utm_source "${v.source}" (크리에이터 ID)` });
    } else res.checks.push(...R.checkSource(v.source));
    if (v.sourceSel) res.checks.push(...R.checkMedium(v.source, v.medium));

    if (!v.campaign) res.checks.push({ level: "pending", text: "캠페인 4개 구간(목적·상품·프로모션·시작일)을 모두 선택하세요." });
    else res.checks.push(...R.checkCampaign(v.campaign));

    if (v.metaMode) {
      res.checks.push({ level: "ok", text: "utm_content · utm_term — 광고관리자 광고 이름 · 광고세트 이름으로 자동 입력" });
    } else {
      if (v.contentRequired && !v.content) res.checks.push({ level: "pending", text: "이 매체는 소재(utm_content)가 필수입니다. 형식·주제를 입력하세요." });
      else res.checks.push(...R.checkContent(v.content, v.contentRequired));
      if (v.topicRaw && /[^a-zA-Z0-9_\s\-]/.test(v.topicRaw)) res.checks.push({ level: "warn", text: "소재 주제의 한글·특수문자는 자동 제거되었습니다." });
      res.checks.push(...R.checkTerm(v.term, v.source, v.medium));
    }

    const blocking = res.checks.some((c) => c.level === "error" || c.level === "pending");
    if (blocking || res.dest === "invalid" || !v.landing) return res;

    let u;
    try { u = new URL(v.landing); } catch (e) { return res; }
    const removed = [];
    [...u.searchParams.keys()].forEach((k) => {
      if (/^(utm_|nt_)/.test(k)) { removed.push(k); u.searchParams.delete(k); }
    });
    if (removed.length) res.checks.push({ level: "warn", text: `랜딩 URL에 있던 기존 파라미터(${[...new Set(removed)].join(", ")})를 제거하고 새로 붙였습니다.` });

    if (res.dest === "smartstore") {
      const map = [["nt_source", v.source], ["nt_medium", v.medium], ["nt_detail", v.campaign], ["nt_keyword", v.content || v.term]];
      map.forEach(([k, val]) => { if (val) { u.searchParams.set(k, val); res.params.push([k, val]); } });
      res.checks.push({ level: "info", text: "스마트스토어 링크라 nt_ 파라미터로 변환했습니다. 스마트스토어센터 > 통계 > 마케팅분석에서 확인합니다." });
      res.url = u.toString();
      res.ready = true;
      return res;
    }

    if (v.metaMode) {
      const mp = [["utm_source", v.source], ["utm_medium", v.medium], ["utm_campaign", META_MACROS.campaign], ["utm_content", META_MACROS.content], ["utm_term", META_MACROS.term]];
      res.params = mp;
      res.metaParams = mp.map(([k, val]) => `${k}=${val}`).join("&");
      res.website = u.toString();
      res.url = res.website + (res.website.includes("?") ? "&" : "?") + res.metaParams; // 기록용
      res.ready = true;
      return res;
    }

    const list = [["utm_source", v.source], ["utm_medium", v.medium], ["utm_campaign", v.campaign], ["utm_content", v.content], ["utm_term", v.term]];
    list.forEach(([k, val]) => { if (val) { u.searchParams.set(k, val); res.params.push([k, val]); } });
    res.url = u.toString();
    res.ready = true;
    return res;
  }

  /* ── 화면 갱신 ──────────────────────────────── */
  const LEVEL_ICON = { ok: "✓", warn: "!", error: "×", pending: "·", info: "i" };

  function renderChecks(el, checks) {
    el.innerHTML = checks.map((c) => `<li class="ck ${c.level}"><span class="ic">${LEVEL_ICON[c.level] || "·"}</span><span>${esc(c.text)}</span></li>`).join("");
  }

  function highlightUrl(url) {
    const i = url.indexOf("?");
    if (i < 0) return esc(url);
    const base = url.slice(0, i), qs = url.slice(i + 1);
    let hash = "";
    let q = qs;
    const h = qs.indexOf("#");
    if (h >= 0) { hash = qs.slice(h); q = qs.slice(0, h); }
    const parts = q.split("&").map((p) => {
      const [k, ...rest] = p.split("=");
      const cls = /^(utm_|nt_)/.test(k) ? "p-utm" : "p-etc";
      return `<span class="${cls}"><span class="pk">${esc(k)}</span>=<span class="pv">${esc(rest.join("="))}</span></span>`;
    });
    return `<span class="p-base">${esc(base)}</span>?${parts.join('<span class="amp">&amp;</span>')}${esc(hash)}`;
  }

  function update() {
    syncMetaUI($("landing").value.trim() ? R.destType($("landing").value.trim()) : "");
    const v = collect();
    segPreview($("campaignPreview"), ["목적", "상품", "프로모션", "시작일"], v.parts);
    segPreview($("contentPreview"), ["형식", "주제", "버전"], [v.formatSel, R.sanitize(v.topicRaw), $("ctVersion").value]);

    // 랜딩 판별 배지
    const dest = v.landing ? R.destType(v.landing) : "";
    const destText = { mall: "자사몰 · utm 파라미터로 생성", smartstore: "스마트스토어 · nt_ 파라미터로 생성", coupang: "쿠팡 · 추적 불가", other: "미등록 도메인", invalid: "URL 형식 오류" }[dest] || "";
    $("destBadge").className = "dest " + dest;
    $("destBadge").textContent = destText;

    const res = build(v);
    current = res.ready ? { v, res } : null;

    const isMeta = res.ready && v.metaMode;
    $("resultTitle").textContent = isMeta ? "메타 광고 설정값" : res.dest === "smartstore" ? "완성 URL (스마트스토어)" : "완성 URL";
    $("urlOut").hidden = isMeta;
    $("metaOut").hidden = !isMeta;
    if (isMeta) {
      $("metaWebsite").textContent = res.website;
      $("metaParams").textContent = res.metaParams;
    } else {
      $("urlOut").innerHTML = res.ready ? highlightUrl(res.url) : `<span class="placeholder">${res.checks.some((c) => c.level === "error") ? "아래 오류를 수정하면 URL이 만들어집니다." : "왼쪽 항목을 채우면 여기에 URL이 만들어집니다."}</span>`;
    }
    $("copyBtn").textContent = isMeta ? "URL 매개변수 복사" : "URL 복사";
    ["copyBtn", "qrBtn", "openBtn"].forEach((id) => ($(id).disabled = !res.ready));
    $("qrBtn").disabled = !res.ready || isMeta;
    $("openBtn").disabled = !res.ready || isMeta;
    $("qrBox").hidden = true;

    const hasErr = res.checks.some((c) => c.level === "error");
    const hasWarn = res.checks.some((c) => c.level === "warn");
    $("statusBadge").className = "status " + (res.ready ? (hasWarn ? "warn" : "ok") : hasErr ? "error" : "pending");
    $("statusBadge").textContent = res.ready ? (hasWarn ? "확인 필요" : "완료") : hasErr ? "수정 필요" : "작성 중";
    renderChecks($("checkList"), res.checks);

    $("paramTable").innerHTML = res.ready && res.params.length
      ? `<table class="tbl compact"><thead><tr><th>파라미터</th><th>값</th></tr></thead><tbody>${res.params.map(([k, val]) => `<tr><td><code>${esc(k)}</code></td><td><code>${esc(val)}</code></td></tr>`).join("")}</tbody></table>`
      : "";
  }

  /* ── 기록 ───────────────────────────────────── */
  function loadHist() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveHist(list) {
    try { localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, 1000))); } catch (e) {}
  }

  function addHistory(v, res) {
    const list = loadHist();
    const key = res.url;
    const idx = list.findIndex((x) => x.url === key);
    const entry = {
      id: idx >= 0 ? list[idx].id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      at: new Date().toISOString(),
      dest: res.dest, landing: v.landing, source: v.source, medium: v.medium,
      campaign: v.metaMode ? META_MACROS.campaign : v.campaign,
      campaignName: v.campaign,
      content: v.metaMode ? META_MACROS.content : v.content,
      term: v.metaMode ? META_MACROS.term : v.term,
      url: key, metaMode: v.metaMode, metaParams: res.metaParams || "",
      memo: v.memo,
      form: snapshotForm()
    };
    if (idx >= 0) list.splice(idx, 1);
    list.unshift(entry);
    saveHist(list);
  }

  function snapshotForm() {
    const ids = ["landing", "source", "customSource", "medium", "metaMode", "cObjective", "cProduct", "cPromotion", "cDate", "ctFormat", "ctTopic", "ctVersion", "tType", "tDetail", "tKeyword", "memo"];
    const o = {};
    ids.forEach((id) => { const el = $(id); o[id] = el.type === "checkbox" ? el.checked : el.value; });
    return o;
  }

  function restoreForm(o) {
    const set = (id) => { const el = $(id); if (!(id in o)) return; if (el.type === "checkbox") el.checked = o[id]; else el.value = o[id]; };
    set("landing"); set("source"); onSourceChange();
    ["customSource", "medium"].forEach(set); onMediumChange();
    ["metaMode", "cObjective", "cProduct", "cPromotion", "cDate", "ctFormat", "ctTopic", "ctVersion", "tType", "tDetail", "tKeyword", "memo"].forEach(set);
    applyMetaMode();
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function renderHistory() {
    const q = $("histSearch").value.trim().toLowerCase();
    const list = loadHist().filter((x) => !q || [x.campaign, x.campaignName, x.source, x.medium, x.content, x.term, x.memo, x.landing].join(" ").toLowerCase().includes(q));
    if (!list.length) {
      $("histOut").innerHTML = `<div class="empty">${q ? "검색 결과가 없습니다." : "아직 생성한 링크가 없습니다."}</div>`;
      return;
    }
    $("histOut").innerHTML = `<div class="tbl-wrap"><table class="tbl hist"><thead><tr><th>생성일시</th><th>source / medium</th><th>campaign</th><th>content</th><th>term</th><th>메모</th><th></th></tr></thead><tbody>${list.map((x) => `
      <tr data-id="${esc(x.id)}">
        <td class="nowrap">${fmtDate(x.at)}${x.dest === "smartstore" ? '<div class="pill small">스마트스토어</div>' : ""}${x.metaMode ? '<div class="pill small">메타 매개변수</div>' : ""}</td>
        <td><code>${esc(x.source)}</code> / <code>${esc(x.medium)}</code></td>
        <td><code>${esc(x.metaMode ? x.campaignName : x.campaign)}</code></td>
        <td>${x.content ? `<code>${esc(x.content)}</code>` : '<span class="muted">—</span>'}</td>
        <td>${x.term ? `<code>${esc(x.term)}</code>` : '<span class="muted">—</span>'}</td>
        <td>${esc(x.memo) || '<span class="muted">—</span>'}</td>
        <td class="nowrap row-actions">
          <button class="btn small" data-act="copy">복사</button>
          <button class="btn small ghost" data-act="load">불러오기</button>
          <button class="btn small ghost danger" data-act="del" aria-label="삭제">삭제</button>
        </td>
      </tr>`).join("")}</tbody></table></div>`;
  }

  function exportCsv() {
    const list = loadHist();
    if (!list.length) return toast("내보낼 기록이 없습니다.");
    const head = ["생성일시", "랜딩 구분", "랜딩 URL", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "완성 URL", "메타 URL 매개변수", "메모"];
    const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const rows = list.map((x) => [fmtDate(x.at), { mall: "자사몰", smartstore: "스마트스토어", other: "기타" }[x.dest] || x.dest, x.landing, x.source, x.medium, x.metaMode ? x.campaignName : x.campaign, x.content, x.term, x.metaMode ? "" : x.url, x.metaParams, x.memo].map(q).join(","));
    const csv = "﻿" + [head.map(q).join(","), ...rows].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `utm_links_${todayISO()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ── QR ─────────────────────────────────────── */
  function makeQr(text) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr;
  }

  function showQr() {
    if (!current) return;
    if (typeof qrcode === "undefined") return toast("QR 라이브러리를 불러오지 못했습니다. 네트워크를 확인하세요.");
    const qr = makeQr(current.res.url);
    $("qrImg").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    $("qrBox").hidden = false;
  }

  function downloadQr() {
    if (!current || typeof qrcode === "undefined") return;
    const qr = makeQr(current.res.url);
    const n = qr.getModuleCount(), cell = 12, margin = 4;
    const size = (n + margin * 2) * cell;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.isDark(r, col)) ctx.fillRect((col + margin) * cell, (r + margin) * cell, cell, cell);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `qr_${current.v.campaign || "utm"}${current.v.content ? "_" + current.v.content : ""}.png`;
    a.click();
  }

  /* ── 검사 탭 ────────────────────────────────── */
  function runInspect() {
    const raw = $("inspectInput").value;
    if (!raw.trim()) return;
    const r = R.inspectUrl(raw);
    const destLabel = { mall: "자사몰", smartstore: "스마트스토어", coupang: "쿠팡", other: "미등록 도메인" }[r.dest] || "";
    const errs = r.checks.filter((c) => c.level === "error").length;
    const warns = r.checks.filter((c) => c.level === "warn").length;
    $("inspectOut").innerHTML = `
      <div class="inspect-sum ${errs ? "error" : warns ? "warn" : "ok"}">
        ${errs ? `규칙에 맞지 않는 항목 ${errs}개` : warns ? `확인이 필요한 항목 ${warns}개` : "규칙에 맞는 링크입니다."}
        ${destLabel ? `<span class="pill">${destLabel}</span>` : ""}
      </div>
      ${r.params.length ? `<table class="tbl compact"><thead><tr><th>파라미터</th><th>값</th></tr></thead><tbody>${r.params.map((p) => `<tr><td><code>${esc(p.key)}</code></td><td><code>${esc(p.val)}</code></td></tr>`).join("")}</tbody></table>` : ""}
      <ul class="checks">${r.checks.map((c) => `<li class="ck ${c.level}"><span class="ic">${LEVEL_ICON[c.level]}</span><span>${esc(c.text)}</span></li>`).join("")}</ul>
      ${errs || warns ? `<p class="note">규칙은 <button class="link-btn" data-goto="guide">작성 가이드</button>에서 확인할 수 있습니다.</p>` : ""}`;
  }

  /* ── 팝오버 ─────────────────────────────────── */
  let popTarget = null;
  function openPopover(btn) {
    const h = window.UTM_GUIDE.helps[btn.dataset.help];
    if (!h) return;
    const pop = $("popover");
    if (!pop.hidden && popTarget === h.target) { pop.hidden = true; return; }
    popTarget = h.target;
    $("popoverBody").innerHTML = h.html;
    pop.hidden = false;
    const r = btn.getBoundingClientRect();
    const w = Math.min(320, window.innerWidth - 32);
    pop.style.width = w + "px";
    let left = r.left + window.scrollX - 12;
    left = Math.max(16, Math.min(left, window.scrollX + window.innerWidth - w - 16));
    pop.style.left = left + "px";
    pop.style.top = r.bottom + window.scrollY + 8 + "px";
  }

  function goGuide(id) {
    showTab("guide");
    if (id) setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30);
  }

  /* ── 이벤트 ─────────────────────────────────── */
  function bind() {
    document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

    $("landingPreset").addEventListener("change", (e) => {
      const p = P.landingPages[e.target.value];
      if (p) $("landing").value = p.url;
      e.target.value = "";
      update();
    });
    $("source").addEventListener("change", onSourceChange);
    $("medium").addEventListener("change", onMediumChange);
    $("metaMode").addEventListener("change", applyMetaMode);
    $("buildForm").addEventListener("input", update);
    $("buildForm").addEventListener("change", update);

    $("copyBtn").addEventListener("click", async () => {
      if (!current) return;
      const text = current.v.metaMode ? current.res.metaParams : current.res.url;
      await copyText(text);
      addHistory(current.v, current.res);
      toast(current.v.metaMode ? "URL 매개변수를 복사했습니다." : "URL을 복사했습니다.");
    });
    $("copyCampaignName").addEventListener("click", async () => {
      const v = collect();
      if (!v.campaign) return toast("캠페인 구간을 모두 선택하세요.");
      await copyText(v.campaign);
      toast("캠페인 이름을 복사했습니다.");
    });
    $("qrBtn").addEventListener("click", () => ($("qrBox").hidden ? showQr() : ($("qrBox").hidden = true)));
    $("qrDownload").addEventListener("click", () => { downloadQr(); if (current) addHistory(current.v, current.res); });
    $("openBtn").addEventListener("click", () => current && window.open(current.res.url, "_blank", "noopener"));
    $("resetBtn").addEventListener("click", () => {
      $("buildForm").reset();
      $("cDate").value = todayISO();
      onSourceChange();
    });

    $("inspectBtn").addEventListener("click", runInspect);
    $("inspectInput").addEventListener("keydown", (e) => { if (e.key === "Enter") runInspect(); });

    $("histSearch").addEventListener("input", renderHistory);
    $("histCsv").addEventListener("click", exportCsv);
    $("histClear").addEventListener("click", () => {
      if (!loadHist().length) return;
      if (confirm("이 브라우저에 저장된 생성 기록을 모두 삭제할까요? CSV로 먼저 내보내 두는 것을 권장합니다.")) { saveHist([]); renderHistory(); }
    });
    $("histOut").addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const id = btn.closest("tr").dataset.id;
      const list = loadHist();
      const x = list.find((i) => i.id === id);
      if (!x) return;
      if (btn.dataset.act === "copy") { await copyText(x.metaMode ? x.metaParams : x.url); toast("복사했습니다."); }
      if (btn.dataset.act === "load") { showTab("build"); restoreForm(x.form || {}); toast("생성 탭에 불러왔습니다."); }
      if (btn.dataset.act === "del") { saveHist(list.filter((i) => i.id !== id)); renderHistory(); }
    });

    document.addEventListener("click", (e) => {
      const help = e.target.closest(".help");
      if (help) { e.stopPropagation(); openPopover(help); return; }
      const goto = e.target.closest("[data-goto]");
      if (goto) { goGuide(); return; }
      if (!e.target.closest("#popover")) $("popover").hidden = true;
    });
    $("popoverMore").addEventListener("click", () => { $("popover").hidden = true; goGuide(popTarget); });
    window.addEventListener("resize", () => ($("popover").hidden = true));
  }

  /* ── 시작 ───────────────────────────────────── */
  initSelects();
  window.UTM_GUIDE.render();
  bind();
  onSourceChange();
  const hash = (location.hash || "").slice(1);
  if (["build", "inspect", "history", "guide"].includes(hash)) showTab(hash);
})();
