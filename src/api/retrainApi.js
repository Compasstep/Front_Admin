// src/api/retrainApi.js

async function safeGetJson(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn("[retrain] non-200", res.status, url);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("GET failed:", url, e);
    return null;
  }
}

/**
 * 재학습(수정 전) 대기열 요약
 * 항상 { items: Array<{id, comment, emotions, confidence}>, total: number } 반환
 */
export async function fetchRetrainQueue({ page = 0, size = 3 } = {}) {
  // ✔ 존재하는 엔드포인트만 시도 (list는 404)
  const candidates = [
    `/api/admin/retrain/invalid?page=${page}&size=${size}`,
    `/api/admin/retrain/invalid?pageNo=${page + 1}&pageSize=${size}`, // 1-based 백엔드 대비
    `/api/admin/retrain/invalid`,
  ];

  let raw = null;
  for (const url of candidates) {
    const data = await safeGetJson(url);
    if (!data) {
      console.log("[retrain] skip(null):", url);
      continue;
    }
    const arr = extractArray(data);
    if (arr.length) {
      raw = data;
      // console.log("[retrain] using:", url, data); // 필요하면 잠깐 열어보세요
      break;
    } else {
      console.log("[retrain] skip(no array):", url, data);
    }
  }

  if (!raw) return { items: [], total: 0 };

  const arr = extractArray(raw);
  const total = extractTotal(raw, arr.length);
  const items = arr.map((row, idx) => normalizeRow(row, idx));
  return { items, total };
}

/** 공통: 표준 pageMeta 만들기 */
function buildPageMeta(total, page, size) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  return {
    page, size, totalElements: total, totalPages,
    hasPrev: page > 0,
    hasNext: page < totalPages - 1,
  };
}

// src/api/retrainApi.js 안에서 이 두 함수만 교체

/** 수정 전(Invalid) 목록: 페이지 + 검색(q) */
export async function fetchInvalidList({ page = 0, size = 10, q = "" } = {}) {
  const paramsA = new URLSearchParams({ page, size });
  const paramsB = new URLSearchParams({ pageNo: page + 1, pageSize: size });
  if (q && q.trim()) { paramsA.set("q", q.trim()); paramsB.set("q", q.trim()); }

  const candidates = [
    `/api/admin/retrain/invalid?${paramsA.toString()}`,
    `/api/admin/retrain/invalid?${paramsB.toString()}`,
    `/api/admin/retrain/invalid`,
  ];

  // 1) 먼저 일반 요청(백엔드가 q를 지원하면 그대로 사용)
  let raw = null;
  for (const url of candidates) {
    const data = await safeGetJson(url);
    if (!data) continue;
    raw = data; break;
  }
  if (!raw) return { reviews: [], pageMeta: buildPageMeta(0, page, size) };

  // 2) q가 없으면 그대로 리턴
  const arr = extractArray(raw);
  if (!q || !q.trim()) {
    const total = extractTotal(raw, arr.length);
    return { reviews: arr, pageMeta: buildPageMeta(total, page, size) };
  }

  // 3) q가 있으면 ‘대량 조회 → 프론트 필터 → 페이징’
  const bulkA = new URLSearchParams({ page: 0, size: 1000 });
  const bulkB = new URLSearchParams({ pageNo: 1, pageSize: 1000 });
  const bulkCandidates = [
    `/api/admin/retrain/invalid?${bulkA.toString()}`,
    `/api/admin/retrain/invalid?${bulkB.toString()}`,
    `/api/admin/retrain/invalid`,
  ];

  let bulk = null;
  for (const url of bulkCandidates) {
    const data = await safeGetJson(url);
    if (!data) continue;
    bulk = data; break;
  }
  const all = extractArray(bulk || raw); // 최악의 경우 raw라도 사용
  const qLower = q.trim().toLowerCase();

  const filtered = all.filter((row) => {
    const t =
      row?.commentText ??
      row?.comment_text ??
      row?.comment ??
      row?.text ??
      "";
    return String(t).toLowerCase().includes(qLower);
  });

  const total = filtered.length;
  const start = page * size;
  const end = start + size;
  const pageSlice = filtered.slice(start, end);

  return {
    reviews: pageSlice,
    pageMeta: buildPageMeta(total, page, size),
  };
}

/** 수정 후(Valid) 목록: 페이지 + 검색(q) */
export async function fetchValidList({ page = 0, size = 10, q = "" } = {}) {
  const paramsA = new URLSearchParams({ page, size });
  const paramsB = new URLSearchParams({ pageNo: page + 1, pageSize: size });
  if (q && q.trim()) { paramsA.set("q", q.trim()); paramsB.set("q", q.trim()); }

  const candidates = [
    `/api/admin/retrain/valid?${paramsA.toString()}`,
    `/api/admin/retrain/valid?${paramsB.toString()}`,
    `/api/admin/retrain/valid`,
  ];

  let raw = null;
  for (const url of candidates) {
    const data = await safeGetJson(url);
    if (!data) continue;
    raw = data; break;
  }
  if (!raw) return { reviews: [], pageMeta: buildPageMeta(0, page, size) };

  const arr = extractArray(raw);
  if (!q || !q.trim()) {
    const total = extractTotal(raw, arr.length);
    return { reviews: arr, pageMeta: buildPageMeta(total, page, size) };
  }

  // q가 있으면 대량으로 받아서 프론트 필터
  const bulkA = new URLSearchParams({ page: 0, size: 1000 });
  const bulkB = new URLSearchParams({ pageNo: 1, pageSize: 1000 });
  const bulkCandidates = [
    `/api/admin/retrain/valid?${bulkA.toString()}`,
    `/api/admin/retrain/valid?${bulkB.toString()}`,
    `/api/admin/retrain/valid`,
  ];

  let bulk = null;
  for (const url of bulkCandidates) {
    const data = await safeGetJson(url);
    if (!data) continue;
    bulk = data; break;
  }
  const all = extractArray(bulk || raw);
  const qLower = q.trim().toLowerCase();

  const filtered = all.filter((row) => {
    const t =
      row?.commentText ??
      row?.comment_text ??
      row?.comment ??
      row?.text ??
      "";
    return String(t).toLowerCase().includes(qLower);
  });

  const total = filtered.length;
  const start = page * size;
  const end = start + size;
  const pageSlice = filtered.slice(start, end);

  return {
    reviews: pageSlice,
    pageMeta: buildPageMeta(total, page, size),
  };
}

/* ----------------- helpers ----------------- */
function extractArray(data) {
  if (Array.isArray(data?.result?.reviews)) return data.result.reviews;

  if (Array.isArray(data?.result?.items))   return data.result.items;
  if (Array.isArray(data?.result?.content)) return data.result.content;
  if (Array.isArray(data?.result?.list))    return data.result.list;
  if (Array.isArray(data?.result?.rows))    return data.result.rows;
  if (Array.isArray(data?.result?.data))    return data.result.data;

  if (Array.isArray(data?.items))   return data.items;
  if (Array.isArray(data?.list))    return data.list;
  if (Array.isArray(data?.rows))    return data.rows;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data))    return data.data;
  if (Array.isArray(data?.records)) return data.records;

  if (Array.isArray(data?.result))  return data.result;
  if (Array.isArray(data))          return data;
  return [];
}

function extractTotal(data, fallbackLen = 0) {
  if (isNumber(data?.result?.pageMeta?.totalElements)) {
    return data.result.pageMeta.totalElements;
  }

  if (isNumber(data?.totalElements))         return data.totalElements;
  if (isNumber(data?.result?.totalElements)) return data.result.totalElements;
  if (isNumber(data?.total))                 return data.total;
  if (isNumber(data?.result?.total))         return data.result.total;
  if (isNumber(data?.result?.totalCount))    return data.result.totalCount;
  if (isNumber(data?.result?.count))         return data.result.count;
  if (isNumber(data?.count))                 return data.count;

  if (Array.isArray(data?.items))            return data.items.length;
  if (Array.isArray(data?.list))             return data.list.length;
  if (Array.isArray(data?.rows))             return data.rows.length;
  if (Array.isArray(data?.content))          return data.content.length;
  if (Array.isArray(data?.data))             return data.data.length;
  if (Array.isArray(data?.records))          return data.records.length;
  if (Array.isArray(data?.result?.reviews))  return data.result.reviews.length; // 보강
  if (Array.isArray(data?.result))           return data.result.length;

  return fallbackLen;
}

function normalizeRow(row, idx) {
  const id =
    row.reviewId ??
    row.id ??
    row.comment_hash ??
    row.commentHash ??
    row.hash ??
    `row_${idx}`;

  const comment =
    row.commentText ??
    row.comment_text ??
    row.comment ??
    row.text ??
    "";

  const emotionsRaw = row.emotions ?? row.prediction ?? row.labels ?? [];
  const emotions = Array.isArray(emotionsRaw)
    ? emotionsRaw
    : typeof emotionsRaw === "string"
    ? tryParseArray(emotionsRaw)
    : [];

  const confidence = isNumber(row?.confidence)
    ? row.confidence
    : toNum(row?.confidence);

  return { id, comment, emotions, confidence };
}

function tryParseArray(s) {
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v;
  } catch (_) {
    if (typeof s === "string" && s.includes(",")) {
      return s.split(",").map(t => t.trim()).filter(Boolean);
    }
  }
  return [];
}

function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// 감정 수정 저장
export async function convertInvalidToValid(reviewId, labelsEn = []) {
  try {
    const res = await fetch(`/api/admin/retrain/convert`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ reviewId, emotions: labelsEn }),
    });
    if (!res.ok) throw new Error(`convert failed ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("[convertInvalidToValid] error", e);
    return null;
  }
}

// 되돌리기
export async function revertValidToInvalid(reviewId) {
  try {
    const res = await fetch(`/api/admin/retrain/revert`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    if (!res.ok) throw new Error(`revert failed ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("[revertValidToInvalid] error", e);
    return null;
  }
}