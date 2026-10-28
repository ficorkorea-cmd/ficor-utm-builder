/* 규칙 검사 (생성 탭 · 검사 탭 공용) */
(function () {
  const P = window.UTM_PRESETS;
  const CODE_RE = /^[a-z0-9_]+$/;
  const codes = (list) => list.filter((x) => !x.deprecated).map((x) => x.code);
  const isMacro = (v) => /^\{\{.+\}\}$/.test(v || "");

  function sanitize(v) {
    return (v || "").trim().toLowerCase().replace(/[\s\-.]+/g, "_").replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "");
  }

  function destType(url) {
    let host;
    try { host = new URL(url).hostname.toLowerCase(); } catch (e) { return "invalid"; }
    const m = (list) => list.some((d) => host === d || host.endsWith("." + d));
    if (m(P.domains.coupang)) return "coupang";
    if (m(P.domains.smartstore)) return "smartstore";
    if (m(P.domains.mall)) return "mall";
    return "other";
  }

  function isValidYYMMDD(s) {
    if (!/^\d{6}$/.test(s)) return false;
    const y = 2000 + +s.slice(0, 2), mo = +s.slice(2, 4), d = +s.slice(4, 6);
    const dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
  }

  function findChannel(source, medium) {
    return P.channels.find((c) => !c.status && c.medium === medium && (c.custom || c.source === source)) || null;
  }

  /* 문제만 반환 */
  function checkCampaign(v, key = "utm_campaign") {
    if (!v) return [{ level: "error", text: `${key}이 없습니다.` }];
    if (isMacro(v)) return [];
    if (!CODE_RE.test(v)) return [{ level: "error", text: `${key} "${v}" — 영문 소문자·숫자·밑줄만 사용` }];
    let s = v.split("_");
    const out = [];
    if (/^\d+$/.test(s[0])) {
      if (!isValidYYMMDD(s[0])) out.push({ level: "error", text: `날짜 "${s[0]}" — YYMMDD 형식 (예: 261121)` });
      s = s.slice(1);
    }
    if (s.length < 2 || s.length > 3) return [{ level: "error", text: `${key} "${v}" — 규칙: (날짜_)목적_프로모션(_상품)` }];
    s = ["", ...s];
    if (!codes(P.objectives).includes(s[1])) out.push({ level: "error", text: `목적 "${s[1]}" — 허용: ${codes(P.objectives).join(", ")}` });
    if (!codes(P.promotions).includes(s[2])) out.push({ level: "error", text: `프로모션 "${s[2]}" — 허용: ${codes(P.promotions).join(", ")}` });
    if (s[3] && !codes(P.products).includes(s[3])) out.push({ level: "error", text: `상품 "${s[3]}" — 허용: ${codes(P.products).join(", ")}` });
    return out;
  }

  function checkContent(v, key = "utm_content") {
    if (!v || isMacro(v)) return [];
    if (!CODE_RE.test(v)) return [{ level: "error", text: `${key} "${v}" — 영문 소문자·숫자·밑줄만 사용` }];
    const fmt = v.split("_").pop();
    if (!codes(P.formats).includes(fmt)) return [{ level: "warn", text: `${key} "${v}" — 규칙: 소재명_형식 (형식: ${codes(P.formats).join(", ")})` }];
    return [];
  }

  function inspectUrl(raw) {
    const out = { params: [], checks: [], dest: null };
    let u;
    try { u = new URL(raw.trim()); } catch (e) {
      out.checks.push({ level: "error", text: "URL 형식이 아닙니다. https:// 부터 전체를 붙여넣으세요." });
      return out;
    }
    out.dest = destType(u.href);
    u.searchParams.forEach((val, key) => out.params.push({ key, val }));
    const get = (k) => u.searchParams.get(k);
    if (out.dest === "coupang") { out.checks.push({ level: "warn", text: "쿠팡 링크는 외부 파라미터로 유입 추적이 되지 않습니다." }); return out; }

    const ss = out.dest === "smartstore";
    const k = ss ? { s: "nt_source", m: "nt_medium", c: "nt_detail", ct: "nt_keyword" } : { s: "utm_source", m: "utm_medium", c: "utm_campaign", ct: "utm_content" };
    const s = get(k.s), m = get(k.m), c = get(k.c), ct = get(k.ct);
    if (!s && !m && !c) {
      out.checks.push({ level: "error", text: ss ? "스마트스토어 링크에 nt_ 파라미터가 없습니다." : "utm 파라미터가 없습니다. GA4에서 유입 매체를 구분할 수 없습니다." });
      return out;
    }
    if (out.dest === "other") out.checks.push({ level: "warn", text: `등록되지 않은 도메인 (${u.hostname})` });
    if (u.hash && u.href.indexOf("?") > u.href.indexOf("#")) out.checks.push({ level: "error", text: "파라미터가 # 뒤에 있어 GA4가 읽지 못합니다." });
    [[k.s, s], [k.m, m]].forEach(([key, val]) => {
      if (!val) out.checks.push({ level: "error", text: `${key}가 없습니다.` });
      else if (!CODE_RE.test(val)) out.checks.push({ level: "error", text: `${key} "${val}" — 영문 소문자·숫자·밑줄만 사용` });
    });
    const ch = s && m ? findChannel(s, m) : null;
    if (s && m && CODE_RE.test(s) && CODE_RE.test(m) && !ch) out.checks.push({ level: "warn", text: `${s} / ${m} — 사전에 없는 매체 조합` });
    out.checks.push(...checkCampaign(c, k.c), ...checkContent(ct, k.ct));
    if (!ct && ch && ch.content === "required") out.checks.push({ level: "warn", text: `${ch.label}는 소재(${k.ct})를 넣는 것이 규칙입니다.` });
    if (ss && get("utm_source")) out.checks.push({ level: "warn", text: "스마트스토어에서는 utm 파라미터가 집계되지 않습니다." });
    return out;
  }

  window.UTM_RULES = { CODE_RE, sanitize, destType, isValidYYMMDD, findChannel, checkCampaign, checkContent, inspectUrl };
})();
