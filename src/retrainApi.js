// --- AI 재학습 API ---
import { getCookie } from "./utils/cookieUtils.js";

const BASE_URL = "/api/admin/retrain";

/** 공통 헤더 */
function headers() {
  const token = getCookie("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** 수정 전 목록 */
export async function fetchInvalid(page = 0, size = 10) {
  const res = await fetch(`${BASE_URL}/invalid?page=${page}&size=${size}`, { headers: headers() });
  if (!res.ok) throw new Error("invalid 목록 조회 실패");
  const json = await res.json();
  return json.result; // {pageMeta, reviews}
}

/** 수정 후 목록 */
export async function fetchValid(page = 0, size = 10) {
  const res = await fetch(`${BASE_URL}/valid?page=${page}&size=${size}`, { headers: headers() });
  if (!res.ok) throw new Error("valid 목록 조회 실패");
  const json = await res.json();
  return json.result; // {pageMeta, reviews}
}

/** [수정 전] → [수정 후] 전환 (최종 레이블 저장) */
export async function convertInvalidToValid(dataPKId, finalLabels /* string[] (en keys) */) {
  const res = await fetch(`${BASE_URL}/invalid/convert/${dataPKId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ finalLabels }),
  });
  if (!res.ok) throw new Error("변환(저장) 실패");
  return res.json();
}

/** [수정 후] → 원상복구 (수정 전 상태로 되돌리기) */
export async function revertValidToInvalid(dataPKId) {
  const res = await fetch(`${BASE_URL}/valid/convert/${dataPKId}`, {
    method: "PATCH",
    headers: headers(),
  });
  if (!res.ok) throw new Error("되돌리기 실패");
  return res.json();
}
