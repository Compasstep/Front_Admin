// --- React 및 관련 라이브러리 임포트 ---
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- 메인 컴포넌트: 비밀번호 찾기 페이지 ---
// 사용자가 이메일 입력을 통해 자신의 비밀번호 정보를 확인할 수 있는 페이지.
export default function FindPasswordPage({ admins }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  const [email, setEmail] = useState(''); // 이메일 입력 필드의 값을 관리하는 상태.
  const [foundPassword, setFoundPassword] = useState(null); // 찾은 비밀번호(마스킹 처리됨)를 저장하는 상태.
  const [error, setError] = useState(''); // 오류 메시지를 저장하는 상태.
  const navigate = useNavigate(); // 페이지 이동을 위한 함수.

  // --- 2. 이벤트 핸들러 (Event Handlers) ---

  // [핸들러] '찾기' 버튼이 포함된 폼 제출 시 실행됨.
  const handleFindPassword = (e) => {
    e.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 막음.
    
    // 이전 검색 결과 및 오류 메시지를 초기화함.
    setError('');
    setFoundPassword(null);
    
    // admins 데이터에서 입력된 이메일과 일치하는 관리자를 검색함.
    const admin = admins.find(a => a.id === email);
    
    if (admin) {
      // 관리자를 찾았을 경우, 보안을 위해 첫 글자를 제외하고 마스킹 처리함.
      const maskedPassword = admin.password.charAt(0) + '•'.repeat(admin.password.length - 1);
      // 마스킹된 비밀번호를 상태에 저장하여 화면에 표시되도록 함.
      setFoundPassword(maskedPassword);
    } else {
      // 일치하는 관리자가 없을 경우, 오류 메시지를 설정함.
      setError('해당 이메일로 가입된 관리자를 찾을 수 없습니다.');
    }
  };

  // --- 3. UI 렌더링 (JSX) ---
  return (
    <div className="page" style={{ background: '#F9FAFB' }}>
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

          {/* foundPassword 상태에 값이 있을 경우에만 결과 박스를 렌더링함 */}
          {foundPassword && (
            <div className="pw-result-box">
              <p className="pw-result-text">비밀번호: <strong>{foundPassword}</strong></p>
              <hr className="divider" />
              <div className="pw-help-text">
                <p>비밀번호를 잊으셨다면 최고 관리자에게 메일을 보내주세요.</p>
                <p>최고 관리자 이메일: <strong>choisw0404@naver.com</strong></p>
              </div>
            </div>
          )}

          {/* error 상태에 값이 있을 경우에만 오류 메시지를 렌더링함 */}
          {error && <p className="error-message">{error}</p>}
          
          {/* 로그인 페이지로 돌아가는 버튼 */}
          <button type="button" className="forgot" onClick={() => navigate('/login')} style={{ marginTop: '24px' }}>
            로그인 페이지로 돌아가기
          </button>
        </div>
      </main>
    </div>
  );
}