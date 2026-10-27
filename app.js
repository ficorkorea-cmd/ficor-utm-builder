/* FICOR UTM 빌더 — 화면 로직 */
(function () {
  const P = window.UTM_PRESETS;
  const R = window.UTM_RULES;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const HIST_KEY = "ficor_utm_history_v2";
  const META = "utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}";

  let current = null;               // { v, res }
  let short = { url: "", for: "" }; // 단축 URL

  /* ── 유틸 ── */
  const active = (list) => list.filter((x) => !x.deprecated);
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1800);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
  }
  const yymmdd = (d) => (d ? d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10) : "");
  function todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  const channelById = (id) => P.channels.find((c) => c.id === id) || null;

  /* ── 탭 ── */
  function showTab(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "tab-" + name));
    if (name === "history") renderHistory();
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
    window.scrollTo({ top: 0 });
  }

  /* ── 초기화 ── */
  const opts = (list, ph, short) => (ph ? `<option value="">${ph}</option>` : "") + active(list).map((x) => `<option value="${esc(x.code)}">${esc(x.label)}${short ? "" : ` (${esc(x.code)})`}</option>`).join("");
  function init() {
    const groups = [...new Set(P.channels.map((c) => c.group))];
    $("channel").innerHTML = `<option value="">선택하세요</option>` + groups.map((g) =>
      `<optgroup label="${esc(g)}">${P.channels.filter((c) => c.group === g && !c.deprecated).map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join("")}</optgroup>`).join("");
    $("cObjective").innerHTML = opts(P.objectives, "", true);
    $("cPromotion").innerHTML = opts(P.promotions, "", true);
    $("cProduct").innerHTML = opts(P.products, "전 상품", true);
    $("cFormat").innerHTML = opts(P.formats, "형식");
    $("tType").innerHTML = opts(P.targets, "선택 안 함");
    $("cDate").value = todayISO();
  }

  /* ── 값 수집 ── */
  function collect() {
    const ch = channelById($("channel").value);
    const fixed = ch && !["required", "optional"].includes(ch.content) ? ch.content : "";
    const source = ch && !ch.status ? (ch.custom ? R.sanitize($("customSource").value) : ch.source) : "";
    const name = R.sanitize($("cName").value);
    const format = fixed || $("cFormat").value;
    const content = name && format ? `${name}_${format}` : fixed ? (name ? `${name}_${fixed}` : fixed) : "";
    const camp = [yymmdd($("cDate").value), $("cObjective").value, $("cPromotion").value];
    const campaign = camp.every(Boolean) ? [...camp, $("cProduct").value].filter(Boolean).join("_") : "";
    let term = "";
    if (ch && ch.term === "keyword") term = $("tKeyword").value.trim();
    else if (ch && ch.term === "target" && $("tType").value) {
      const d = R.sanitize($("tDetail").value);
      term = d ? `${$("tType").value}_${d}` : $("tType").value;
    }
    return {
      landing: $("landing").value.trim(), ch, source, medium: ch && !ch.status ? ch.medium : "",
      campaign, content, term, name, format, fixed, nameRaw: $("cName").value,
      metaMode: !!(ch && ch.meta && $("metaMode").checked)
    };
  }

  /* ── 생성 ── */
  function build(v) {
    const res = { dest: v.landing ? R.destType(v.landing) : "", url: "", checks: [], ready: false };
    if (v.ch && v.ch.status) return res; // 불가 위치: 안내만
    const need = [];
    if (!v.landing) need.push("랜딩 URL");
    if (!v.ch) need.push("링크 위치");
    if (v.ch && v.ch.custom && !v.source) need.push("크리에이터 ID");
    if (!v.campaign) need.push("캠페인");
    if (v.ch && !v.metaMode && !v.fixed) {
      if (v.ch.content === "required" && !v.name) need.push("소재명");
      if (v.name && !v.format) need.push("소재 형식");
    }
    if (need.length) res.checks.push({ level: "pending", text: `${need.join(" · ")} 입력이 필요합니다.` });

    if (res.dest === "invalid") res.checks.push({ level: "error", text: "URL 형식이 아닙니다. https:// 부터 입력하세요." });
    if (res.dest === "coupang") res.checks.push({ level: "error", text: "쿠팡 링크는 외부 파라미터로 유입 추적이 되지 않아 만들지 않습니다." });
    if (res.dest === "other") res.checks.push({ level: "warn", text: "자사몰 도메인이 아닙니다. 주소를 확인하세요." });
    if (v.nameRaw && /[^a-zA-Z0-9_\s\-.]/.test(v.nameRaw)) res.checks.push({ level: "warn", text: "소재명의 한글·특수문자는 자동으로 빠졌습니다." });
    if (v.campaign) res.checks.push(...R.checkCampaign(v.campaign));
    if (res.checks.some((c) => c.level === "error" || c.level === "pending")) return res;

    const u = new URL(v.landing);
    [...u.searchParams.keys()].forEach((k) => { if (/^(utm_|nt_)/.test(k)) u.searchParams.delete(k); });

    if (res.dest === "smartstore") {
      [["nt_source", v.source], ["nt_medium", v.medium], ["nt_detail", v.campaign], ["nt_keyword", v.content || v.term]]
        .forEach(([k, val]) => val && u.searchParams.set(k, val));
      res.checks.push({ level: "info", text: "스마트스토어 링크라 nt_ 파라미터로 만들었습니다. (스마트스토어센터 > 통계 > 마케팅분석)" });
    } else if (v.metaMode) {
      res.website = u.toString();
      res.metaParams = `utm_source=${v.source}&utm_medium=${v.medium}&${META}`;
      res.url = res.website + (res.website.includes("?") ? "&" : "?") + res.metaParams;
      res.ready = true;
      return res;
    } else {
      [["utm_source", v.source], ["utm_medium", v.medium], ["utm_campaign", v.campaign], ["utm_content", v.content], ["utm_term", v.term]]
        .forEach(([k, val]) => val && u.searchParams.set(k, val));
    }
    res.url = u.toString();
    if (v.ch.short && short.for !== res.url) res.checks.push({ level: "info", text: "링크가 그대로 노출되는 위치입니다. '단축 URL'로 짧게 만들어 넣으세요." });
    if (v.ch.qr) res.checks.push({ level: "info", text: "오프라인용입니다. 'QR' 버튼으로 이미지를 저장하세요. (단축 URL을 먼저 만들면 QR이 더 단순해집니다)" });
    res.ready = true;
    return res;
  }

  /* ── 화면 갱신 ── */
  const ICON = { warn: "!", error: "×", pending: "·", info: "i" };
  const renderChecks = (el, checks) =>
    (el.innerHTML = checks.map((c) => `<li class="ck ${c.level}"><span class="ic">${ICON[c.level] || "·"}</span><span>${esc(c.text)}</span></li>`).join(""));

  function highlightUrl(url) {
    const i = url.indexOf("?");
    if (i < 0) return esc(url);
    let q = url.slice(i + 1), hash = "";
    const h = q.indexOf("#");
    if (h >= 0) { hash = q.slice(h); q = q.slice(0, h); }
    const parts = q.split("&").map((p) => {
      const [k, ...rest] = p.split("=");
      return `<span class="${/^(utm_|nt_)/.test(k) ? "p-utm" : "p-etc"}"><span class="pk">${esc(k)}</span>=<span class="pv">${esc(rest.join("="))}</span></span>`;
    });
    return `<span class="p-base">${esc(url.slice(0, i))}</span>?${parts.join('<span class="amp">&amp;</span>')}${esc(hash)}`;
  }

  function syncForm() {
    const ch = channelById($("channel").value);
    const dest = $("landing").value.trim() ? R.destType($("landing").value.trim()) : "";
    const blocked = !!(ch && ch.status);

    $("blockedNotice").hidden = !blocked;
    if (blocked) {
      $("blockedNotice").className = "notice " + ch.status;
      $("blockedNotice").innerHTML = `<b>${ch.status === "forbidden" ? "UTM을 넣으면 안 되는 위치입니다." : "UTM을 넣을 수 없는 위치입니다."}</b>${esc(ch.reason)}<br>→ ${esc(ch.alt)}`;
    }
    ["campaignWrap", "contentWrap", "termWrap"].forEach((id) => $(id).classList.toggle("is-off", blocked));
    $("customSourceWrap").hidden = !(ch && ch.custom);
    const metaOk = !!(ch && ch.meta) && dest !== "smartstore";
    $("metaModeWrap").hidden = !metaOk;
    if (!metaOk) $("metaMode").checked = false;
    const meta = $("metaMode").checked;

    $("channelInfo").textContent = ch && !blocked ? `utm_source=${ch.custom ? "크리에이터ID" : ch.source} · utm_medium=${ch.medium} · GA4 채널: ${ch.ga4}` : "";

    const fixed = ch && !["required", "optional"].includes(ch.content) ? ch.content : "";
    $("contentWrap").hidden = meta;
    $("cFormat").disabled = !!fixed;
    if (fixed) $("cFormat").value = fixed;
    else if ($("cFormat").dataset.fixed) $("cFormat").value = "";
    $("cFormat").dataset.fixed = fixed;
    const req = !!(ch && ch.content === "required");
    $("contentReq").textContent = req ? "필수" : "선택";
    $("contentReq").classList.toggle("on", req);
    $("contentHint").textContent = fixed
      ? `형식은 "${fixed}"로 고정됩니다. 소재명은 여러 링크를 구분할 때만 입력 (예: event → event_${fixed})`
      : "예: doctor + 영상 → doctor_video · 한글·공백은 자동 정리";

    $("termWrap").hidden = meta || !(ch && ch.term);
    const kw = !!(ch && ch.term === "keyword");
    $("termTitle").textContent = kw ? "검색 키워드" : "타겟";
    $("termTargetRow").hidden = kw;
    $("termKeywordRow").hidden = !kw;

    const destText = { mall: "자사몰", smartstore: "스마트스토어 · nt_ 파라미터로 생성", coupang: "쿠팡 · 추적 불가", other: "미등록 도메인", invalid: "URL 형식 오류" }[dest] || "";
    $("destBadge").className = "dest " + dest;
    $("destBadge").textContent = destText;
  }

  function update() {
    syncForm();
    const v = collect();
    const res = build(v);
    current = res.ready ? { v, res } : null;
    const isMeta = res.ready && v.metaMode;

    $("resultTitle").textContent = isMeta ? "광고관리자 입력값" : "완성 URL";
    $("urlOut").hidden = isMeta;
    $("metaOut").hidden = !isMeta;
    if (isMeta) { $("metaWebsite").textContent = res.website; $("metaParams").textContent = res.metaParams; }
    else $("urlOut").innerHTML = res.ready ? highlightUrl(res.url) : `<span class="placeholder">${v.ch && v.ch.status ? "이 위치는 UTM 링크를 만들지 않습니다." : "왼쪽 항목을 채우면 여기에 URL이 만들어집니다."}</span>`;

    $("copyBtn").disabled = !res.ready;
    $("copyBtn").textContent = isMeta ? "URL 매개변수 복사" : "URL 복사";
    $("shortBtn").disabled = $("qrBtn").disabled = !res.ready || isMeta;
    $("qrBox").hidden = true;

    const hasShort = res.ready && short.for === res.url && short.url;
    $("shortOut").hidden = !hasShort;
    if (hasShort) { $("shortLink").href = short.url; $("shortLink").textContent = short.url; }

    const err = res.checks.some((c) => c.level === "error");
    const warn = res.checks.some((c) => c.level === "warn");
    const blk = !!(v.ch && v.ch.status);
    $("statusBadge").className = "status " + (blk ? "error" : res.ready ? (warn ? "warn" : "ok") : err ? "error" : "pending");
    $("statusBadge").textContent = blk ? "UTM 불가" : res.ready ? (warn ? "확인 필요" : "완료") : err ? "수정 필요" : "작성 중";
    renderChecks($("checkList"), res.checks);
  }

  /* ── 기록 ── */
  const loadHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch (e) { return []; } };
  const saveHist = (list) => { try { localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, 1000))); } catch (e) {} };

  function addHistory() {
    if (!current) return;
    const { v, res } = current;
    const list = loadHist();
    const idx = list.findIndex((x) => x.url === res.url);
    const prev = idx >= 0 ? list.splice(idx, 1)[0] : null;
    list.unshift({
      id: prev ? prev.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      at: new Date().toISOString(),
      channel: v.ch ? v.ch.label : "", source: v.source, medium: v.medium, campaign: v.metaMode ? "{{campaign.name}}" : v.campaign, content: v.metaMode ? "{{ad.name}}" : v.content, term: v.metaMode ? "{{adset.name}}" : v.term,
      landing: v.landing, url: res.url, metaParams: res.metaParams || "",
      shortUrl: short.for === res.url && short.url ? short.url : prev ? prev.shortUrl || "" : ""
    });
    saveHist(list);
  }

  function fmtDate(iso) {
    const d = new Date(iso), p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function renderHistory() {
    const q = $("histSearch").value.trim().toLowerCase();
    const list = loadHist().filter((x) => !q || [x.channel, x.source, x.medium, x.campaign, x.content, x.landing, x.shortUrl].join(" ").toLowerCase().includes(q));
    if (!list.length) { $("histOut").innerHTML = `<div class="empty">${q ? "검색 결과가 없습니다." : "아직 생성한 링크가 없습니다."}</div>`; return; }
    $("histOut").innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>생성일시</th><th>매체</th><th>캠페인</th><th>소재</th><th>단축 URL</th><th></th></tr></thead><tbody>${list.map((x) => `
      <tr data-id="${esc(x.id)}">
        <td class="nowrap">${fmtDate(x.at)}</td>
        <td>${esc(x.channel)}<div class="muted small">${esc(x.source)} / ${esc(x.medium)}</div></td>
        <td><code>${esc(x.campaign)}</code></td>
        <td>${x.content ? `<code>${esc(x.content)}</code>` : '<span class="muted">—</span>'}</td>
        <td>${x.shortUrl ? `<a class="short-link" href="${esc(x.shortUrl)}" target="_blank" rel="noopener">${esc(x.shortUrl.replace(/^https?:\/\//, ""))}</a>` : '<span class="muted">—</span>'}</td>
        <td class="nowrap row-actions">
          <button class="btn small" data-act="copy">복사</button>
          ${x.shortUrl ? '<button class="btn small" data-act="copyShort">단축 복사</button>' : ""}
          <button class="btn small ghost danger" data-act="del">삭제</button>
        </td>
      </tr>`).join("")}</tbody></table></div>`;
  }

  function exportCsv() {
    const list = loadHist();
    if (!list.length) return toast("내보낼 기록이 없습니다.");
    const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const head = ["생성일시", "매체", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "랜딩 URL", "완성 URL", "단축 URL", "메타 URL 매개변수"];
    const rows = list.map((x) => [fmtDate(x.at), x.channel, x.source, x.medium, x.campaign, x.content, x.term || "", x.landing, x.metaParams ? "" : x.url, x.shortUrl, x.metaParams].map(q).join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + [head.map(q).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `utm_links_${todayISO()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ── 단축 URL (is.gd) ── */
  function shortenUrl(longUrl) {
    return new Promise((resolve, reject) => {
      const cb = "__isgd_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const script = document.createElement("script");
      const fail = "단축 서비스에 연결하지 못했습니다. 네트워크(사내 방화벽 등)를 확인하세요.";
      const done = () => { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } script.remove(); };
      const timer = setTimeout(() => { done(); reject(new Error(fail)); }, 10000);
      window[cb] = (data) => {
        done();
        if (data && data.shorturl) resolve(data.shorturl);
        else reject(new Error((data && data.errorcode === 3) ? "요청이 많습니다. 잠시 후 다시 시도하세요." : "단축 URL을 만들지 못했습니다."));
      };
      script.src = "https://is.gd/create.php?" + new URLSearchParams({ format: "json", url: longUrl, callback: cb }).toString();
      script.onerror = () => { done(); reject(new Error(fail)); };
      document.head.appendChild(script);
    });
  }

  async function onShorten() {
    if (!current) return;
    if (short.for === current.res.url && short.url) { await copyText(short.url); addHistory(); return toast("단축 URL을 복사했습니다."); }
    const btn = $("shortBtn"), longUrl = current.res.url;
    btn.disabled = true; btn.textContent = "만드는 중…";
    try {
      short = { url: await shortenUrl(longUrl), for: longUrl };
      update();
      await copyText(short.url);
      addHistory();
      toast("단축 URL을 만들고 복사했습니다.");
    } catch (e) { toast(e.message); }
    finally { btn.textContent = "단축 URL"; update(); }
  }

  /* ── QR ── */
  function makeQr() {
    const qr = qrcode(0, "M");
    qr.addData(short.for === current.res.url && short.url ? short.url : current.res.url);
    qr.make();
    return qr;
  }
  function toggleQr() {
    if (!current) return;
    if (!$("qrBox").hidden) { $("qrBox").hidden = true; return; }
    if (typeof qrcode === "undefined") return toast("QR 라이브러리를 불러오지 못했습니다.");
    $("qrImg").innerHTML = makeQr().createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    $("qrBox").hidden = false;
  }
  function downloadQr() {
    if (!current || typeof qrcode === "undefined") return;
    const qr = makeQr(), n = qr.getModuleCount(), cell = 12, m = 4, size = (n + m * 2) * cell;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size); ctx.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.isDark(r, col)) ctx.fillRect((col + m) * cell, (r + m) * cell, cell, cell);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `qr_${current.v.campaign}${current.v.content ? "_" + current.v.content : ""}.png`;
    a.click();
    addHistory();
  }

  /* ── 검사 ── */
  function runInspect() {
    const raw = $("inspectInput").value;
    if (!raw.trim()) return;
    const r = R.inspectUrl(raw);
    const errs = r.checks.filter((c) => c.level === "error").length;
    const warns = r.checks.filter((c) => c.level === "warn").length;
    $("inspectOut").innerHTML = `
      <div class="inspect-sum ${errs ? "error" : warns ? "warn" : "ok"}">${errs ? `규칙에 맞지 않는 항목 ${errs}개` : warns ? `확인이 필요한 항목 ${warns}개` : "규칙에 맞는 링크입니다."}</div>
      <ul class="checks">${r.checks.map((c) => `<li class="ck ${c.level}"><span class="ic">${ICON[c.level]}</span><span>${esc(c.text)}</span></li>`).join("")}</ul>
      ${r.params.length ? `<table class="tbl compact"><thead><tr><th>파라미터</th><th>값</th></tr></thead><tbody>${r.params.map((p) => `<tr><td><code>${esc(p.key)}</code></td><td><code>${esc(p.val)}</code></td></tr>`).join("")}</tbody></table>` : ""}`;
  }

  /* ── 이벤트 ── */
  function bind() {
    document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
    $("buildForm").addEventListener("input", update);
    $("buildForm").addEventListener("change", update);
    $("copyBtn").addEventListener("click", async () => {
      if (!current) return;
      await copyText(current.v.metaMode ? current.res.metaParams : current.res.url);
      addHistory();
      toast(current.v.metaMode ? "URL 매개변수를 복사했습니다." : "URL을 복사했습니다.");
    });
    $("shortBtn").addEventListener("click", onShorten);
    $("shortCopy").addEventListener("click", async () => { if (short.url) { await copyText(short.url); addHistory(); toast("단축 URL을 복사했습니다."); } });
    $("qrBtn").addEventListener("click", toggleQr);
    $("qrDownload").addEventListener("click", downloadQr);
    $("inspectBtn").addEventListener("click", runInspect);
    $("inspectInput").addEventListener("keydown", (e) => { if (e.key === "Enter") runInspect(); });
    $("histSearch").addEventListener("input", renderHistory);
    $("histCsv").addEventListener("click", exportCsv);
    $("histClear").addEventListener("click", () => {
      if (loadHist().length && confirm("이 브라우저의 생성 기록을 모두 삭제할까요?")) { saveHist([]); renderHistory(); }
    });
    $("histOut").addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const id = btn.closest("tr").dataset.id;
      const list = loadHist(), x = list.find((i) => i.id === id);
      if (!x) return;
      if (btn.dataset.act === "copy") { await copyText(x.metaParams || x.url); toast("복사했습니다."); }
      if (btn.dataset.act === "copyShort") { await copyText(x.shortUrl); toast("단축 URL을 복사했습니다."); }
      if (btn.dataset.act === "del") { saveHist(list.filter((i) => i.id !== id)); renderHistory(); }
    });
  }

  init();
  window.UTM_GUIDE.render();
  bind();
  update();
  const hash = (location.hash || "").slice(1);
  if (["build", "inspect", "history", "guide"].includes(hash)) showTab(hash);
})();
