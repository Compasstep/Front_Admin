// --- React 및 관련 라이브러리 임포트 ---
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- 메인 컴포넌트: 비밀번호 찾기 페이지 ---
// 더미 admins는 더 이상 사용하지 않으므로 무시(경고 방지용으로 언더스코어)
export default function FindPasswordPage({ admins: _admins }) {

  // --- 1. 상태 관리 (State Management) ---
  const [email, setEmail] = useState('');            // 입력 이메일
  const [foundPassword, setFoundPassword] = useState(null); // 마스킹된 PW
  const [error, setError] = useState('');            // 오류 메시지
  const navigate = useNavigate();

  // --- 2. 이벤트 핸들러 (Event Handlers) ---
  const handleFindPassword = (e) => {
    e.preventDefault();
    setError('');
    setFoundPassword(null);

// PasswordChangePage에서 저장한 마스킹 정보를 여러 키로 탐색
    const raw = email.trim();
    const candidates = [
      `pwmask:${raw}`,                // 정확히 일치
      `pwmask:${raw.toLowerCase()}`,  // 소문자 정규화
      'pwmask:last',                  // 최근 변경 기록(이메일 매칭 확인)
    ];
    try {
      for (const k of candidates) {
        const saved = localStorage.getItem(k);
        if (!saved) continue;
        const data = JSON.parse(saved);
        // pwmask:last는 다른 사람 것일 수 있으므로 이메일이 다르면 스킵
        if (k === 'pwmask:last' && data?.email && data.email !== raw && data.email !== raw.toLowerCase()) {
          continue;
        }
        const first = data?.first ?? '';
        const len = data?.len ?? 0;
        const dots = len > 1 ? '•'.repeat(len - 1) : '';
        setFoundPassword(`${first}${dots}`);
        return;
      }
    } catch { /* no-op */ }

    // 저장된 마스킹 정보가 없으면 안내만 (디자인 유지: 기존 error paragraph 사용)
    setError('저장된 비밀번호 정보가 없습니다. 최고 관리자에게 문의해 주세요.');
  };

  // --- 3. UI 렌더링 (JSX) ---
  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <main className="wrap" style={{ maxWidth: '480px', textAlign: 'center', marginTop: '-80px' }}>
        <h1 className="brand">Compassstep Admin</h1>
        <div className="find-pw-card">
          <h2 className="title">비밀번호 찾기</h2>
          <p className="desc">가입 시 사용한 이메일 주소를 입력해주세요.</p>

          {/* 비밀번호 찾기 입력 폼 */}
          <form className="find-pw-form" onSubmit={handleFindPassword}>
            <input
              type="email"
              placeholder="이메일 주소"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn" style={{ height: '48px', width: '100px' }}>
              찾기
            </button>
          </form>

          {/* 마스킹 비밀번호가 있을 때만 표시 */}
          {foundPassword && (
            <div className="pw-result-box">
              <p className="pw-result-text">비밀번호: <strong>{foundPassword}</strong></p>
              <hr className="divider" />
              <div className="pw-help-text">
                <p>비밀번호를 잊으셨다면 최고 관리자에게 메일을 보내주세요.</p>
                <p>최고 관리자 이메일: <strong>root@compasstep.com</strong></p>
              </div>
            </div>
          )}

          {/* 오류는 기존 디자인 그대로(단락 하나) */}
          {error && <p className="error-message">{error}</p>}

          {/* 로그인 페이지로 돌아가기 */}
          <button
            type="button"
            className="forgot"
            onClick={() => navigate('/login')}
            style={{ marginTop: '24px' }}
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </main>
    </div>
  );
}
