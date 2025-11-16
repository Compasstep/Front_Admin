// --- React 및 관련 라이브러리 임포트 ---
import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";

// --- 페이지 컴포넌트 임포트 ---
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import RetrainPage from "./pages/RetrainPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import UserManagementPage from "./pages/UserManagementPage.jsx";
import PasswordChangePage from "./pages/PasswordChangePage.jsx";
import ModelSelectionPage from "./pages/ModelSelectionPage.jsx";
import FindPasswordPage from "./pages/FindPasswordPage.jsx";

// --- 유틸리티 및 전역 스타일 임포트 ---
import { ToastProvider } from "./components/Toast.jsx";
import "./styles/index.css";

// --- [수정됨] ---
// createDummyAdmins는 AdminPage, FindPasswordPage 등
// 아직 마이그레이션되지 않은 다른 페이지에서 사용되므로, 임시로 남겨둠.
import { seedBefore, initialUsers, createDummyAdmins } from "./Data/data.jsx";


// --- 하위 컴포넌트: 기본 레이아웃 ---
// 로그인 후 모든 페이지에 공통적으로 적용되는 사이드바와 헤더를 포함한 레이아웃.
function Layout({ userRole, onLogout, handleRefresh, pageTitle }) {
  const getNavLinkClass = ({ isActive }) => isActive ? "sb-item sb-active" : "sb-item";

  return (
    <div className="dash">
      {/* 사이드바 영역 */}
      <aside className="sb">
        <div className="sb-brand">Compassstep Admin</div>
        <nav className="sb-nav">
          <NavLink to="/" className={getNavLinkClass} end>{({isActive}) => (<><span className={isActive ? "dot" : "dot dot-muted"} />대시보드</>)}</NavLink>
          <NavLink to="/user" className={getNavLinkClass}>{({isActive}) => (<><span className={isActive ? "dot" : "dot dot-muted"} />유저 관리</>)}</NavLink>
          <NavLink to="/ai_retrain" className={getNavLinkClass}>{({isActive}) => (<><span className={isActive ? "dot" : "dot dot-muted"} />AI 재학습</>)}</NavLink>
          {/* 루트 관리자일 경우에만 '관리자 관리'와 '모델 선택' 메뉴가 보이도록 함 */}
          {userRole === 'root' && (
            <>
              <NavLink to="/manager" className={getNavLinkClass}>{({isActive}) => (<><span className={isActive ? "dot" : "dot dot-muted"} />관리자 관리</>)}</NavLink>
              <NavLink to="/model" className={getNavLinkClass}>{({isActive}) => (<><span className={isActive ? "dot" : "dot dot-muted"} />모델 선택</>)}</NavLink>
            </>
          )}
        </nav>
        <button className="logout" onClick={onLogout}>로그아웃</button>
      </aside>
      
      {/* 메인 콘텐츠 영역 */}
      <main className="main">
        <div className="main-head">
          <h1 className="page-title">{pageTitle}</h1>
          <button className="btn" onClick={handleRefresh}>새로고침</button>
        </div>
        {/* 라우팅되는 페이지 컴포넌트가 이 위치에 렌더링됨 */}
        <Outlet />
      </main>
    </div>
  );
}

// --- 최상위 App 컴포넌트 ---
// 애플리케이션의 전체적인 구조와 라우팅, 상태 관리를 담당함.
export default function App() {
  
  // --- 1. 전역 상태 관리 (Global State) ---
  const [authed, setAuthed] = useState(false); // 로그인 여부 상태.
  const [userRole, setUserRole] = useState(null); // 로그인한 관리자의 권한 ('root' 또는 'general').
  const [pageTitle, setPageTitle] = useState(""); // 현재 페이지의 제목.
  
  // [데이터] AI 재학습 관련 상태.
  const [before, setBefore] = useState(seedBefore());
  const [after, setAfter] = useState([]);
  
  // [데이터] 유저 및 관리자 목록 상태.
  const [users, setUsers] = useState(initialUsers());
  
  // [수정됨] admins 상태는 AdminPage와 FindPasswordPage에서
  // 아직 더미 데이터로 사용되므로, 임시로 유지함.
  const [admins, setAdmins] = useState(createDummyAdmins());

  // [유틸리티] 새로고침 버튼 클릭 시 자식 컴포넌트의 상태를 리셋하기 위한 '신호'.
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 페이지 이동을 위한 네비게이션 함수.
  const navigate = useNavigate();

  // --- 2. 이벤트 핸들러 (Event Handlers) ---
  
  // [핸들러] 로그인 처리 로직.
  // --- [수정됨] ---
  // 더미 데이터(admins 배열)를 확인하는 대신,
  // 실제 백엔드 API 서버로 네트워크 요청을 보냄. (async 함수로 변경)
  const handleLogin = async (credentials) => {
    try {
      const response = await fetch("/api/admin/login", { // API 명세서의 주소
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: credentials.id, // LoginPage.jsx에서 'id'로 전달됨.
          password: credentials.password,
        }),
        // [중요] 서버와 쿠키를 주고받기 위한 필수 옵션임!
        // 이 옵션이 있어야 서버가 보낸 쿠키(access_token 등)가 브라우저에 저장됨.
        credentials: "include", 
      });

      if (response.ok) {
        // 로그인 성공 (2xx 응답)
        // 서버로부터 JSON 형태의 응답을 받음. (예: { "role": "root" })
        const data = await response.json(); 
        
        setAuthed(true);
        setUserRole(data.role); // 서버가 보내준 실제 권한으로 설정.
        navigate('/'); // 대시보드로 이동
        return true; // LoginPage.jsx에 성공(true)을 반환함.
      
      } else {
        // 로그인 실패 (401 Unauthorized 등)
        return false; // LoginPage.jsx에 실패(false)를 반환함.
      }

    } catch (error) {
      // 네트워크 오류 등 fetch 자체가 실패한 경우
      console.error("로그인 API 호출 중 오류 발생:", error);
      return false; // LoginPage.jsx에 실패(false)를 반환함.
    }
  };
  // --- [수정 완료] ---
  
  // [핸들러] 로그아웃 처리 로직.
  const handleLogout = () => {
    // (참고: 실제로는 /api/admin/logout POST 요청을 보내야 하지만,
    //  우선은 프론트엔드 상태만 초기화함.)
    setAuthed(false);
    setUserRole(null);
    navigate('/login');
  };

  // [핸들러] 비밀번호 변경 처리 로직 (임시 비밀번호 사용자가 새 비밀번호 설정 시).
  // (참고: 이 부분은 아직 더미데이터(admins 배열)를 사용함.)
  const handlePasswordChange = (email, newPassword) => {
    setAdmins(currentAdmins => 
      currentAdmins.map(admin => 
        admin.id === email 
          ? { ...admin, password: newPassword, temp: false } 
          : admin
      )
    );
  };

  // [핸들러] 새로고침 버튼 클릭 처리 로직.
  // (참고: 이 부분은 아직 더미데이터를 사용함.)
  const handleRefresh = () => {
    setBefore(seedBefore());
    setAfter([]);
    setUsers(initialUsers());
    setAdmins(createDummyAdmins()); // <-- 이 부분 때문에 admins 상태 유지 필요
    setRefreshKey(prevKey => prevKey + 1);
  };

  // --- 3. 라우팅 설정 및 UI 렌더링 ---
  return (
    // ToastProvider로 앱 전체를 감싸 모든 컴포넌트에서 토스트 메시지를 사용할 수 있게 함.
    <ToastProvider>
      <Routes>
        {/* 인증이 필요 없는 페이지들 */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/pswchange" element={<PasswordChangePage onPasswordChange={handlePasswordChange} />} />
        {/* FindPasswordPage는 아직 더미데이터(admins)를 사용함. */}
        <Route path="/find-password" element={<FindPasswordPage admins={admins} />} />
        
        {/* 인증이 필요한 페이지들 (Layout 컴포넌트 사용) */}
        <Route 
          path="/" 
          element={authed ? <Layout userRole={userRole} onLogout={handleLogout} handleRefresh={handleRefresh} pageTitle={pageTitle} /> : <Navigate to="/login" />}
        >
          {/* 각 페이지 경로와 렌더링할 컴포넌트를 정의하고 필요한 props를 전달함. */}
          <Route index element={<DashboardPage queueItems={before} onGotoRetrain={() => navigate('/ai_retrain')} setPageTitle={setPageTitle} onGotoUserManagement={(status) => navigate(`/user?status=${status}`)} refreshKey={refreshKey} />} />
          <Route path="user" element={<UserManagementPage users={users} setUsers={setUsers} setPageTitle={setPageTitle} />} />
          <Route path="ai_retrain" element={<RetrainPage before={before} setBefore={setBefore} after={after} setAfter={setAfter} setPageTitle={setPageTitle} />} />
          
          {/* 루트 관리자 전용 페이지 (접근 제어) */}
          {/* AdminPage는 아직 더미데이터(admins)를 사용함. */}
          <Route 
            path="manager" 
            element={userRole === 'root' ? <AdminPage admins={admins.filter(a => a.role !== 'root')} setAdmins={setAdmins} setPageTitle={setPageTitle} /> : <Navigate to="/" />} 
          />
          <Route 
            path="model" 
            element={userRole === 'root' ? <ModelSelectionPage setPageTitle={setPageTitle} refreshKey={refreshKey} /> : <Navigate to="/" />} 
          />
        </Route>
        
        {/* 정의되지 않은 경로로 접근 시 리다이렉트 처리 */}
        <Route path="*" element={<Navigate to={authed ? "/" : "/login"} />} />
      </Routes>
    </ToastProvider>
  );
}