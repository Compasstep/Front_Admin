// --- React 및 관련 라이브러리 임포트 ---
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// [추가] API 함수 임포트
import { changePassword } from '../api/adminApi.js';

// --- 하위 컴포넌트: 성공 모달 ---
// (기존 코드와 동일)
function SuccessModal({ onClose }) {
  return (
    <>
      <div className="backdrop" />
      <div className="modal" role="alertdialog" style={{ width: 400, top: '40%', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', color: '#10B981' }}>
            <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.1" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="confirm-title" style={{fontSize: '16px', marginBottom: '4px'}}>비밀번호가 변경되었어요</h3>
          <p className="confirm-message" style={{ marginBottom: '20px', fontSize: '14px' }}>다시 로그인해 주세요</p>
          <button type="button" className="btn" onClick={onClose} style={{ width: '100%' }}>확인</button>
        </div>
      </div>
    </>
  );
}

// --- 메인 컴포넌트: 비밀번호 변경 페이지 ---
// [수정] onPasswordChange prop 제거
export default function PasswordChangePage({ onChanged }) {
  
  // --- 1. 상태 관리 (State Management) ---
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // [수정] email이 location.state에 없을 수도 있으므로, nullish coalescing 사용
  const email = location.state?.email ?? null; 

  // --- 2. 사이드 이펙트 (Side Effects) ---
  useEffect(() => {
    // [수정] 임시 비밀번호로 로그인한 사용자는 이메일 정보가 없을 수 있음
    // (JWT 토큰으로 인증)
    // if (!email) {
    //   navigate('/login');
    // }
  }, [email, navigate]);

  // --- 3. 이벤트 핸들러 (Event Handlers) ---

  // [핸들러] '비밀번호 변경' 폼 제출 시 실행됨.
  // --- [수정됨] 실제 API 호출로 변경 ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    try {
      // api/adminApi.js의 changePassword 함수 호출
      await changePassword(password, confirmPassword);

      try {
        const rawEmail =
          (location.state?.email ?? '') ||
          localStorage.getItem('lastLoginEmail') ||
          '';
        const emailNorm = rawEmail.trim();
        if (emailNorm) {
          const mask = {
            first: password?.[0] ?? '',
            len: (password || '').length,
            ts: Date.now(),
            email: emailNorm,
          };
          // ① 원본 키
          localStorage.setItem(`pwmask:${emailNorm}`, JSON.stringify(mask));
          // ② 소문자 정규화 키
          localStorage.setItem(`pwmask:${emailNorm.toLowerCase()}`, JSON.stringify(mask));
          // ③ 최근 저장 키(검증용)
          localStorage.setItem(`pwmask:last`, JSON.stringify(mask));
        }
      } catch { /* no-op */ }

      // 성공 모달을 표시하도록 상태를 변경함.
      setIsSuccess(true);
    } catch (error) {
      // 401 (권한 없음) 또는 400 (유효성 검사 실패) 등
      console.error("비밀번호 변경 실패:", error);
      alert(`비밀번호 변경에 실패했습니다: ${error.message}`);
    }
  };
  // --- [수정 완료] ---

  // [핸들러] 성공 모달의 '확인' 버튼 클릭 시 실행됨.
  const handleSuccessConfirm = () => {
    setIsSuccess(false); 
    // 상위(App)에서 강제변경 플래그를 해제하고 라우팅을 맡길 수 있게 훅 제공
    if (typeof onChanged === 'function') {
      onChanged();
    } else {
      // 상위에서 훅을 주지 않았다면 기존 동작 유지
      navigate('/login');
    }
  };

  // --- 4. 하위 컴포넌트 및 UI 렌더링 ---
  const EyeIcon = ({ isVisible }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
      {!isVisible && <line x1="1.5" y1="22.5" x2="22.5" y2="1.5" strokeWidth="2" />}
    </svg>
  );

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <main className="wrap" style={{ maxWidth: '400px', textAlign: 'center', marginTop: '-80px' }}>
        <h1 className="brand">Compassstep Admin</h1>
        <div className="change-pw-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563EB" style={{ margin: '0 auto 12px' }}>
             <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
             <path d="M7 11V7a5 5 0 0 1 10 0v4"  strokeWidth="2"/>
          </svg>
          <h2 className="title">관리자 비밀번호 변경</h2>
          <p className="desc">임시 발급된 비밀번호를 변경해주세요.</p>
          
          <form className="form" onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
            <div className="input-with-icon">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="새 비밀번호"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="pw-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                <EyeIcon isVisible={showPassword} />
              </button>
            </div>
            <div className="input-with-icon">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="새 비밀번호 확인"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" className="pw-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                <EyeIcon isVisible={showConfirmPassword} />
              </button>
            </div>
            <p className="input-desc">비밀번호는 영어, 숫자, 기호를 모두 포함해야 합니다.</p>
            <button type="submit" className="button">비밀번호 변경</button>
            <p className="input-desc-small">변경된 비밀번호를 잊어버렸을 경우 관리자에게 문의해주세요.</p>
          </form>
        </div>
      </main>
      
      {isSuccess && <SuccessModal onClose={handleSuccessConfirm} />}
    </div>
  );
}