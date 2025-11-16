// src/api/metricsApi.js

// 공용 fetch 래퍼: 오류시 안전한 기본값 반환
async function safeGetJson(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      console.error(`GET ${url} failed with status ${res.status}`);
      return { result: [] };
    }
    const data = await res.json();
    return data ?? { result: [] };
  } catch (err) {
    console.error(`❌ GET ${url} error:`, err);
    return { result: [] };
  }
}

export async function fetchApiCount() {
  return safeGetJson("/api/admin/metrics/api-count");
}
export async function fetchApiLatency() {
  return safeGetJson("/api/admin/metrics/api-latency");
}

/** 날짜별 엔드포인트 집계 조회 */
export async function fetchApiCountByDate(dateStr) {
  return safeGetJson(`/api/admin/metrics/api-count?date=${encodeURIComponent(dateStr)}`);
}
