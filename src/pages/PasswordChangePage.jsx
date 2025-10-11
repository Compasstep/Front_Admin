// --- React 및 관련 라이브러리 임포트 ---
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// --- 하위 컴포넌트: 성공 모달 ---
// 비밀번호 변경 성공 시 나타나는 모달 UI.
function SuccessModal({ onClose }) {
  return (
    <>
      {/* 모달 뒷 배경 */}
      <div className="backdrop" />
      {/* 모달 본문 */}
      <div className="modal" role="alertdialog" style={{ width: 400, top: '40%', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center' }}>
          {/* 성공 아이콘 SVG */}
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
// 임시 비밀번호로 로그인한 사용자가 새 비밀번호를 설정하는 페이지.
export default function PasswordChangePage({ onPasswordChange }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  const [password, setPassword] = useState(''); // '새 비밀번호' 입력 필드의 값을 관리하는 상태.
  const [confirmPassword, setConfirmPassword] = useState(''); // '새 비밀번호 확인' 입력 필드의 값을 관리하는 상태.
  const [showPassword, setShowPassword] = useState(false); // 첫 번째 비밀번호 필드의 보이기/숨기기 상태.
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 두 번째 비밀번호 필드의 보이기/숨기기 상태.
  const [isSuccess, setIsSuccess] = useState(false); // 성공 모달의 표시 여부를 관리하는 상태.
  
  const navigate = useNavigate(); // 페이지 이동을 위한 함수.
  const location = useLocation(); // 현재 URL의 위치 정보 및 state를 가져옴.
  const email = location.state?.email; // 이전 페이지(로그인)에서 전달받은 이메일 정보.

  // --- 2. 사이드 이펙트 (Side Effects) ---

  // [보안] 이메일 정보가 없는 상태로 페이지에 직접 접근하는 것을 방지함.
  useEffect(() => {
    // location.state에 email이 없으면, 강제로 로그인 페이지로 이동시킴.
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // --- 3. 이벤트 핸들러 (Event Handlers) ---

  // [핸들러] '비밀번호 변경' 폼 제출 시 실행됨.
  const handleSubmit = (e) => {
    e.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 막음.
    
    // 비밀번호 일치 여부 검사.
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    // 비밀번호 길이 검사.
    if (password.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    // App 컴포넌트의 onPasswordChange 함수를 호출하여 실제 비밀번호를 변경함.
    onPasswordChange(email, password);
    // 성공 모달을 표시하도록 상태를 변경함.
    setIsSuccess(true);
  };

  // [핸들러] 성공 모달의 '확인' 버튼 클릭 시 실행됨.
  const handleSuccessConfirm = () => {
    setIsSuccess(false); // 성공 모달을 닫음.
    navigate('/login'); // 로그인 페이지로 이동.
  };

  // --- 4. 하위 컴포넌트 및 UI 렌더링 ---

  // 비밀번호 보이기/숨기기 아이콘 UI 컴포넌트.
  const EyeIcon = ({ isVisible }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
      {/* isVisible이 false일 때만 눈을 가리는 선을 그림 */}
      {!isVisible && <line x1="1.5" y1="22.5" x2="22.5" y2="1.5" strokeWidth="2" />}
    </svg>
  );

  return (
    <div className="page" style={{ background: '#F9FAFB' }}>
      <main className="wrap" style={{ maxWidth: '400px', textAlign: 'center', marginTop: '-80px' }}>
        <h1 className="brand">Compassstep Admin</h1>
        <div className="change-pw-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563EB" style={{ margin: '0 auto 12px' }}>
             <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
             <path d="M7 11V7a5 5 0 0 1 10 0v4"  strokeWidth="2"/>
          </svg>
          <h2 className="title">관리자 비밀번호 변경</h2>
          <p className="desc">임시 발급된 비밀번호를 변경해주세요.</p>
          
          {/* 비밀번호 변경 폼 */}
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
      
      {/* isSuccess 상태가 true일 때만 성공 모달을 렌더링함 */}
      {isSuccess && <SuccessModal onClose={handleSuccessConfirm} />}
    </div>
  );
}