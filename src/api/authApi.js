// src/api/authApi.js

// --- 유틸: 안전한 JSON POST ---
async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let t = '';
    try { t = await res.text(); } catch { /* ignore */ }
    throw new Error(t || `HTTP ${res.status}`);
  }
  try { return await res.json(); } catch { return {}; }
}

// --- 유틸: 안전한 GET ---
async function getJson(url) {
  const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

// true/1/'true'/'1' 을 true로 간주
function truthy(v) {
  return v === true || v === 1 || (typeof v === 'string' && (v.toLowerCase() === 'true' || v === '1'));
}

// 응답 바디에서 “비번 변경 필요” 후보 키들을 스캔
function pickMustChangeFromObject(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const candidates = [
    obj.mustChangePassword,
    obj.isTempPassword,
    obj.temp,
    obj.requirePwChange,
    obj.requirePasswordChange,
    obj.needChangePassword,
    obj.passwordExpired,
    obj.pwExpired,
    obj.pwChangeRequired,
    obj?.meta?.requirePasswordChange,
  ];
  return candidates.find(truthy);
}

// 로그인 직후, 서버가 따로 제공할 수 있는 여러 “프로빙” 엔드포인트 시도
async function probeMustChange() {
  // 많이 쓰이는 후보 경로들
  const paths = [
    '/api/admin/password/need-change',
    '/api/admin/auth/me',
    '/api/admin/me',
    '/api/admin/user',
    '/api/admin/profile',
  ];

  for (const p of paths) {
    const data = await getJson(p);
    if (!data) continue;

    // {result:{...}} / {...} 구분 없이 확인
    const r = data?.result ?? data;
    const hit = pickMustChangeFromObject(r);
    if (truthy(hit)) {
      console.debug('[authApi] mustChange by probe:', p, r);
      return true;
    }
  }

  // 쿠키 신호(최후 보루)
  const cookieStr = document?.cookie ?? '';
  if (/mustChangePassword=true|isTempPassword=true|pwExpired=true/i.test(cookieStr)) {
    console.debug('[authApi] mustChange by cookie');
    return true;
  }

  return false;
}

/** 로그인
 * - email/id 둘 다 보냄(서버 호환)
 * - 응답/헤더/쿠키에서 신호를 못 찾으면 probeMustChange()로 재확인
 */
export async function loginUser({ id, password }) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: id, id, password }),
  });

  if (!res.ok) {
    let t = '';
    try { t = await res.text(); } catch { /* ignore */ }
    throw new Error(t || `HTTP ${res.status}`);
  }

  let data = {};
  try { data = await res.json(); } catch { data = {}; }

  // {result:{...}} 또는 최상위 {...}
  const r = data?.result ?? data ?? {};

  // 1) 바디에서 먼저 찾기
  let mustChange = truthy(pickMustChangeFromObject(r));

  // 2) 헤더 신호
  if (!mustChange) {
    const h = res.headers;
    const headerFlag = h.get('x-require-password-change') ?? h.get('x-password-expired') ?? h.get('x-temp-password');
    mustChange = truthy(headerFlag);
  }

  // 3) 그래도 못 찾으면 프로빙
  if (!mustChange) {
    mustChange = await probeMustChange();
  }

  const role = r.role ?? r.authority ?? r.auth ?? 'admin';
  const out = { ...r, role, mustChangePassword: !!mustChange };
  console.debug('[authApi] login normalized =>', out);
  return out;
}

/** 로그아웃 */
export async function logoutUser() {
  try {
    await postJson('/api/admin/logout', {});
  } catch (e) {
    if (!String(e.message).includes('401')) throw e;
  }
}
