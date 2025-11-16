// --- CSRF 토큰을 쿠키에서 읽어오는 유틸리티 함수 ---
// Double-Submit Cookie 패턴에서 사용됨.
// 로그인 응답 기준 쿠키 이름은 'csrfToken'.
export function getCookie(name = "csrfToken") {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}