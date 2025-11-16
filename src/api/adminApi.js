// src/api/adminApi.js
import { getCookie } from "../utils/cookieUtils.js";

const BASE = "/api/admin";

/* 공통 */
async function jsonOrThrow(res, msg) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status} ${text}`);
  }
  return res.json().catch(() => ({}));
}

/** 관리자 목록 조회
 *  - 응답 모양이 바뀌어도 항상 {id, nickname, email}이 나오도록 정규화
 */
export async function getAdmins() {
  const res = await fetch(`${BASE}/admins`, {
    method: "GET",
    headers: { Accept: "*/*" },
    credentials: "include",
  });
  const data = await jsonOrThrow(res, "관리자 목록 조회 실패");

  // 가능한 모든 케이스에서 배열 꺼내기
  const raw =
    Array.isArray(data?.result?.adminList) ? data.result.adminList :
    Array.isArray(data?.result?.admins)    ? data.result.admins    :
    Array.isArray(data?.result?.content)   ? data.result.content   :
    Array.isArray(data?.result)            ? data.result           :
    Array.isArray(data?.admins)            ? data.admins           :
    Array.isArray(data)                    ? data                  : [];

  // ✅ 정규화: 항상 id / nickname / email 필드를 보장
  return raw.map((a, i) => ({
    id:
      a.id ?? a.adminId ?? a.adminID ?? a.adminPkId ?? a.adminPKId ??
      a.pk ?? a.seq ?? a.userId ?? `row_${i}`,
    nickname: a.nickname ?? a.name ?? a.username ?? (a.email ? a.email.split("@")[0] : ""),
    email: a.email ?? a.address ?? a.mail ?? "",
  }));
}

/** 관리자 초대 메일 발송 */
export async function inviteAdmin(email, adminname) {
  const csrf = getCookie("csrfToken");
  const res = await fetch(`${BASE}/password/invite`, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    },
    credentials: "include",
    body: JSON.stringify({ email, adminname }),
  });
  return jsonOrThrow(res, "관리자 초대 실패");
}

/** 관리자 권한 해제 (삭제)
 *  - 1차: DELETE /admins/{id}
 *  - 실패시: POST /admins/revoke { adminPKId } 로 재시도 (백엔드 변형 대응)
 */
export async function deleteAdmin(adminId) {
  const csrf = getCookie("csrfToken");

  // ① REST 경로 시도
  try {
    const res = await fetch(`${BASE}/admins/${adminId}`, {
      method: "DELETE",
      headers: { Accept: "*/*", "X-CSRF-Token": csrf },
      credentials: "include",
    });
    return await jsonOrThrow(res, "관리자 권한 해제 실패");
  } catch (err) {
    // REST 경로 실패 → 바디 전송 스타일로 폴백
    console.debug('[adminApi] deleteAdmin fallback (/admins/revoke). cause =', err);
    // ② 바디 전송 스타일로 한번 더 시도
    const res2 = await fetch(`${BASE}/admins/revoke`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      credentials: "include",
      body: JSON.stringify({ adminPKId: String(adminId) }),
    });
    return jsonOrThrow(res2, "관리자 권한 해제 실패");
  }
}

/** 비밀번호 재발급
 *  - 우선 현재 쓰고 계신 PATCH /password/reissue { adminPKId }
 *  - 실패 시 보조 경로 POST /admins/{id}/password 시도
 */
export async function reissuePassword(adminId) {
  const csrf = getCookie("csrfToken");

  // ① 현재 사용중인 엔드포인트
  try {
    const res = await fetch(`${BASE}/password/reissue`, {
      method: "PATCH",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      credentials: "include",
      body: JSON.stringify({ adminPKId: String(adminId) }),
    });
    return await jsonOrThrow(res, "비밀번호 재발급 실패");
  } catch (err) {
    // 기존 엔드포인트 실패 → 보조 경로 시도
    console.debug('[adminApi] reissuePassword fallback (/admins/{id}/password). cause =', err);
    // ② 대안 경로
    const res2 = await fetch(`${BASE}/admins/${adminId}/password`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      credentials: "include",
    });
    return jsonOrThrow(res2, "비밀번호 재발급 실패");
  }
}

/** 비밀번호 변경 (본인) — PasswordChangePage.jsx에서 사용 */
export async function changePassword(password, doubleCheck) {
  const csrf = getCookie("csrfToken");
  const res = await fetch(`${BASE}/password/change`, {
    method: "PATCH",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    },
    credentials: "include",
    body: JSON.stringify({ password, doubleCheck }),
  });
  return jsonOrThrow(res, "비밀번호 변경 실패");
}
