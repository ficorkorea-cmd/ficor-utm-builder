/* 규칙 · 검사 로직 (생성 탭과 검사 탭이 공통으로 사용) */
(function () {
  const P = window.UTM_PRESETS;
  const CODE_RE = /^[a-z0-9_]+$/;
  const codes = (list) => list.filter((x) => !x.deprecated).map((x) => x.code);

  function hostOf(url) {
    try { return new URL(url).hostname.toLowerCase(); } catch (e) { return null; }
  }

  function hostMatches(host, list) {
    return list.some((d) => host === d || host.endsWith("." + d));
  }

  /* 랜딩 URL 판별: mall | smartstore | coupang | other | invalid */
  function destType(url) {
    const host = hostOf(url);
    if (!host) return "invalid";
    if (hostMatches(host, P.domains.coupang)) return "coupang";
    if (hostMatches(host, P.domains.smartstore)) return "smartstore";
    if (hostMatches(host, P.domains.mall)) return "mall";
    return "other";
  }

  function findSource(code) {
    return P.sources.find((s) => s.code === code);
  }

  function findMedium(sourceCode, mediumCode) {
    const s = findSource(sourceCode);
    if (s) return s.mediums.find((m) => m.code === mediumCode) || null;
    // 커스텀 source (인플루언서 등)
    for (const src of P.sources.filter((x) => x.custom)) {
      const m = src.mediums.find((mm) => mm.code === mediumCode);
      if (m) return m;
    }
    return null;
  }

  function isValidYYMMDD(s) {
    if (!/^\d{6}$/.test(s)) return false;
    const y = 2000 + +s.slice(0, 2), m = +s.slice(2, 4), d = +s.slice(4, 6);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  /* 값 정리: 소문자, 공백·하이픈 → 밑줄, 허용 외 문자 제거 */
  function sanitize(v) {
    return (v || "").trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "");
  }

  /* ── 개별 검사 함수: { level: ok|warn|error, text } 배열 반환 ── */

  function checkSource(v) {
    const out = [];
    if (!v) return [{ level: "error", text: "utm_source가 비어 있습니다." }];
    if (!CODE_RE.test(v)) out.push({ level: "error", text: `utm_source "${v}" — 영문 소문자·숫자·밑줄만 사용` });
    else if (!findSource(v)) out.push({ level: "warn", text: `utm_source "${v}" — 사전에 없는 값 (인플루언서 ID라면 정상)` });
    else out.push({ level: "ok", text: `utm_source "${v}"` });
    return out;
  }

  function checkMedium(source, v) {
    if (!v) return [{ level: "error", text: "utm_medium이 비어 있습니다." }];
    if (!CODE_RE.test(v)) return [{ level: "error", text: `utm_medium "${v}" — 영문 소문자·숫자·밑줄만 사용` }];
    const s = findSource(source);
    if (s) {
      const m = s.mediums.find((x) => x.code === v);
      if (!m) return [{ level: "error", text: `utm_medium "${v}" — ${s.label}에 등록된 값: ${s.mediums.map((x) => x.code).join(", ")}` }];
      return [{ level: "ok", text: `utm_medium "${v}" → GA4 채널: ${m.channel}` }];
    }
    const m = findMedium(source, v);
    if (m) return [{ level: "ok", text: `utm_medium "${v}" → GA4 채널: ${m.channel}` }];
    return [{ level: "warn", text: `utm_medium "${v}" — 사전에 없는 값` }];
  }

  function checkCampaign(v) {
    if (!v) return [{ level: "error", text: "utm_campaign이 비어 있습니다." }];
    if (/^\{\{.+\}\}$/.test(v)) return [{ level: "ok", text: "utm_campaign — 메타 매크로 (광고관리자 캠페인 이름이 규칙을 따르는지 확인)" }];
    if (!CODE_RE.test(v)) return [{ level: "error", text: `utm_campaign "${v}" — 대문자·한글·공백·하이픈 사용 불가` }];
    const seg = v.split("_");
    const C = P.campaign;
    const out = [];
    if (seg.length !== 4) {
      out.push({ level: "error", text: `utm_campaign "${v}" — 구간이 ${seg.length}개 (규칙: ${C.pattern}, 4개)` });
      return out;
    }
    const [obj, prod, promo, date] = seg;
    if (!codes(C.objectives).includes(obj)) out.push({ level: "error", text: `캠페인 목적 "${obj}" — 허용: ${codes(C.objectives).join(", ")}` });
    if (!codes(C.products).includes(prod)) out.push({ level: "error", text: `캠페인 상품 "${prod}" — 허용: ${codes(C.products).join(", ")}` });
    if (!codes(C.promotions).includes(promo)) out.push({ level: "error", text: `캠페인 프로모션 "${promo}" — 허용: ${codes(C.promotions).join(", ")}` });
    if (!isValidYYMMDD(date)) out.push({ level: "error", text: `캠페인 시작일 "${date}" — YYMMDD 형식 (예: 261121)` });
    if (!out.length) out.push({ level: "ok", text: `utm_campaign "${v}"` });
    return out;
  }

  function checkContent(v, required) {
    if (!v) return required ? [{ level: "error", text: "이 매체는 utm_content(소재)가 필수입니다." }] : [];
    if (/^\{\{.+\}\}$/.test(v)) return [{ level: "ok", text: "utm_content — 메타 매크로 (광고 이름이 규칙을 따르는지 확인)" }];
    if (!CODE_RE.test(v)) return [{ level: "error", text: `utm_content "${v}" — 대문자·한글·공백·하이픈 사용 불가` }];
    const seg = v.split("_");
    const C = P.content;
    if (seg.length < 3) return [{ level: "error", text: `utm_content "${v}" — 규칙: ${C.pattern}` }];
    const format = seg[0], version = seg[seg.length - 1];
    const out = [];
    if (!codes(C.formats).includes(format)) out.push({ level: "error", text: `소재 형식 "${format}" — 허용: ${codes(C.formats).join(", ")}` });
    if (!/^v\d+$/.test(version)) out.push({ level: "error", text: `소재 버전 "${version}" — v1, v2 형식` });
    if (!out.length) out.push({ level: "ok", text: `utm_content "${v}"` });
    return out;
  }

  function checkTerm(v, source, medium) {
    if (!v) return [];
    if (/^\{\{.+\}\}$/.test(v)) return [{ level: "ok", text: "utm_term — 메타 매크로 (광고세트 이름이 규칙을 따르는지 확인)" }];
    if (source === "naver" && medium === "cpc") return [{ level: "ok", text: `utm_term "${v}" (검색 키워드)` }];
    if (!CODE_RE.test(v)) return [{ level: "error", text: `utm_term "${v}" — 검색광고 외에는 영문 소문자·숫자·밑줄만 사용` }];
    const type = v.split("_")[0];
    if (!codes(P.targetTypes).includes(type)) return [{ level: "warn", text: `utm_term "${v}" — 타겟 유형으로 시작 권장 (${codes(P.targetTypes).join(", ")})` }];
    return [{ level: "ok", text: `utm_term "${v}"` }];
  }

  /* 전체 URL 검사 (검사 탭) */
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

    if (u.hash && u.href.indexOf("?") > u.href.indexOf("#")) {
      out.checks.push({ level: "error", text: "파라미터가 # 뒤에 있어 GA4가 읽지 못합니다." });
    }

    if (out.dest === "coupang") {
      out.checks.push({ level: "warn", text: "쿠팡 링크 — 외부 파라미터로 유입 추적이 되지 않습니다." });
      return out;
    }
    if (out.dest === "smartstore") {
      const ns = get("nt_source"), nm = get("nt_medium");
      if (!ns && !nm) out.checks.push({ level: "error", text: "스마트스토어 링크에 nt_ 파라미터가 없습니다. (스마트스토어는 utm 대신 nt_source / nt_medium / nt_detail / nt_keyword 사용)" });
      else {
        out.checks.push(...checkSource(ns).map(relabel("utm_source", "nt_source")));
        out.checks.push(...checkMedium(ns, nm).map(relabel("utm_medium", "nt_medium")));
        out.checks.push(...checkCampaign(get("nt_detail")).map(relabel("utm_campaign", "nt_detail")));
      }
      if (get("utm_source")) out.checks.push({ level: "warn", text: "스마트스토어에서는 utm 파라미터가 집계되지 않습니다." });
      return out;
    }
    if (out.dest === "other") out.checks.push({ level: "warn", text: `등록되지 않은 도메인 (${u.hostname}) — 자사몰 도메인인지 확인` });

    const s = get("utm_source"), m = get("utm_medium");
    if (!s && !m && !get("utm_campaign")) {
      out.checks.push({ level: "error", text: "utm 파라미터가 없습니다. GA4에서 유입 매체를 구분할 수 없습니다." });
      return out;
    }
    const med = findMedium(s, m);
    out.checks.push(...checkSource(s), ...checkMedium(s, m), ...checkCampaign(get("utm_campaign")));
    out.checks.push(...checkContent(get("utm_content"), med ? med.contentRequired : false));
    out.checks.push(...checkTerm(get("utm_term"), s, m));
    const dup = ["utm_source", "utm_medium", "utm_campaign"].filter((k) => u.searchParams.getAll(k).length > 1);
    if (dup.length) out.checks.push({ level: "error", text: `중복 파라미터: ${dup.join(", ")}` });
    return out;
  }

  function relabel(from, to) {
    return (c) => ({ ...c, text: c.text.split(from).join(to) });
  }

  window.UTM_RULES = {
    CODE_RE, sanitize, destType, findSource, findMedium, isValidYYMMDD,
    checkSource, checkMedium, checkCampaign, checkContent, checkTerm, inspectUrl
  };
})();
