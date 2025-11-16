// src/api/userApi.js
// 백엔드 /api/admin/users … 엔드포인트와만 통신하는 래퍼들
// (쿠키 세션/프록시 환경이면 별도 헤더 불필요)

const BASE = "/api/admin/users";

async function jfetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Accept": "application/json",
      ...(options.headers || {}),
    },
  });
  // 백엔드가 항상 200 + {code,message,result} 형태이므로 그대로 json
  return res.json();
}

export async function fetchDashboard() {
  return jfetch(`${BASE}/dashboard`);
}

export async function fetchMaliciousUsers() {
  return jfetch(`${BASE}/malicious`);
}

export async function fetchUserLogs(userPKId) {
  return jfetch(`${BASE}/logs/${userPKId}`);
}

export async function banUser(userPKId) {
  return jfetch(`${BASE}/ban/${userPKId}`, { method: "PATCH" });
}

export async function unbanUser(userPKId) {
  return jfetch(`${BASE}/unban/${userPKId}`, { method: "PATCH" });
}
