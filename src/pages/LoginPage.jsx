// --- React 및 관련 라이브러리 임포트 ---
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- 메인 컴포넌트: 로그인 페이지 ---
// 사용자가 ID와 비밀번호를 입력하여 시스템에 접근하는 첫 관문 페이지.
export default function LoginPage({ onLogin }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  const [id, setId] = useState(""); // ID 입력 필드의 값을 관리하는 상태.
  const [pw, setPw] = useState(""); // 비밀번호 입력 필드의 값을 관리하는 상태.
  const [busy, setBusy] = useState(false); // 로그인 API 호출과 같은 비동기 작업 진행 여부를 관리하는 상태 (중복 클릭 방지용).
  const [error, setError] = useState(""); // 로그인 실패 시 표시될 오류 메시지를 관리하는 상태.
  const navigate = useNavigate(); // 페이지 이동을 위한 함수.

  // --- 2. 이벤트 핸들러 (Event Handlers) ---

  // [핸들러] 로그인 폼 제출 시 실행됨.
  const handleSubmit = (e) => {
    e.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 막음.
    
    // 이미 로그인 요청이 진행 중이면 추가 실행을 막음.
    if (busy) return;
    
    // 로그인 프로세스 시작: busy 상태를 true로, 기존 오류 메시지를 초기화함.
    setBusy(true);
    setError("");

    // App 컴포넌트로부터 받은 onLogin 함수를 호출하여 실제 로그인 인증을 시도함.
    const loginSuccess = onLogin({ id, password: pw });

    // 로그인 결과가 실패(false)일 경우, 오류 메시지를 설정함.
    if (!loginSuccess) {
      setError("ID 또는 비밀번호가 올바르지 않습니다.");
    }
    
    // 로그인 프로세스 종료: busy 상태를 false로 되돌림.
    setBusy(false);
  };

  // --- 3. UI 렌더링 (JSX) ---
  return (
    <div className="page bg-white">
      <main className="wrap">
        {/* 페이지 헤더 */}
        <header className="header">
          <h1 className="brand">Compassstep Admin</h1>
          <h2 className="title">로그인</h2>
          <p className="desc">관리자 페이지에 접속하려면 ID와 비밀번호를 입력하세요.</p>
        </header>
        
        {/* 로그인 입력 폼 */}
        <form className="form" onSubmit={handleSubmit} aria-label="관리자 로그인">
          <label className="sr-only" htmlFor="id">ID</label>
          <input
            id="id"
            placeholder="ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            className="input"
          />
          <label className="sr-only" htmlFor="pw">PASSWORD</label>
          <input
            id="pw"
            type="password"
            placeholder="PASSWORD"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            className="input"
          />
          
          {/* error 상태에 값이 있을 경우에만 오류 메시지를 렌더링함 */}
          {error && <p style={{ color: 'red', fontSize: '14px', margin: '0', textAlign: 'left' }}>{error}</p>}
          
          {/* 로그인 버튼 (busy 상태일 때 비활성화됨) */}
          <button type="submit" className="button" disabled={busy}>
            {busy ? "로그인 중..." : "로그인"}
          </button>
          
          {/* 비밀번호 찾기 페이지로 이동하는 버튼 */}
          <button
            type="button"
            className="forgot"
            onClick={() => navigate('/find-password')}
          >
            비밀번호를 잊으셨나요?
          </button>
        </form>
      </main>
      
      {/* 페이지 푸터 */}
      <footer className="footer">© 2025 Compassstep. All rights reserved.</footer>
    </div>
  );
}
//