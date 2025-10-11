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

// --- 초기 더미 데이터 생성 함수 ---

// [데이터] AI 재학습 '수정 전' 목록의 초기 데이터를 생성함.
const seedBefore = () => [
  { id: 1, learned: false, comment: "이 곡 멜로디가 너무 슬퍼요... 눈물 난다", emotions: ["슬픔", "후회", "혼란", "비통", "초조함"], confidence: 0.47 },
  { id: 2, learned: false, comment: "So uplifting and happy! made my day :)", emotions: ["기쁨", "감탄", "낙관"], confidence: 0.71 },
  { id: 3, learned: false, comment: "가사는 좋은데 보컬이 좀 거슬림", emotions: ["분노", "실망", "짜증"], confidence: 0.62 },
  { id: 4, learned: false, comment: "Not my vibe, but production is clean", emotions: ["혼란", "깨달음", "놀람"], confidence: 0.55 },
  { id: 5, learned: false, comment: "소름 돋았어... 소리 너무 좋다", emotions: ["놀람", "기쁨"], confidence: 0.68 },
  { id: 6, learned: false, comment: "boring... skipped after 30s", emotions: ["초조함", "실망"], confidence: 0.41 },
  { id: 7, learned: false, comment: "드럼 소리 미쳤다! 무대에서 듣고 싶음", emotions: ["열광", "낙관"], confidence: 0.69 },
  { id: 8, learned: false, comment: "lyrics are dark but kinda beautiful", emotions: ["슬픔", "감탄", "낙관", "애정", "감사"], confidence: 0.58 },
];

// [데이터] 유저 관리 목록의 초기 데이터를 생성함.
const initialUsers = () => [
  { id: 'U1004', name: '홍길동 5', email: 'user5@example.com', signupDate: '2025-08-05', lastActive: '오늘', status: 'SUSPENDED' },
  { id: 'U1007', name: '홍길동 8', email: 'user8@example.com', signupDate: '2025-08-08', lastActive: '오늘', status: 'BLOCKED' },
  { id: 'U1009', name: '홍길동 10', email: 'user10@example.com', signupDate: '2025-08-10', lastActive: '어제', status: 'SUSPENDED' },
  { id: 'U1011', name: '홍길동 12', email: 'user12@example.com', signupDate: '2025-08-12', lastActive: '3일 전', status: 'BLOCKED' },
  { id: 'U1012', name: '홍길동 13', email: 'user13@example.com', signupDate: '2025-08-13', lastActive: '오늘', status: 'SUSPENDED' },
  { id: 'U1016', name: '홍길동 17', email: 'user17@example.com', signupDate: '2025-08-17', lastActive: '5일 전', status: 'BLOCKED' },
];

// [데이터] 관리자 계정의 초기 데이터를 생성함.
const createDummyAdmins = () => [
    { id: 'compasstep', password: 'compasstep', role: 'root', temp: false, nickname: '루트 관리자' },
    { id: 'choisw0404@naver.com', password: '1234', role: 'general', temp: true, nickname: '최성원' },
    { id: 'xzv01299@gmail.com', password: 'password1', role: 'general', temp: false, nickname: '최성원A' },
    { id: 'open_gg@naver.com', password: 'password2', role: 'general', temp: false, nickname: '최성원B' },
    { id: 'hyunjune2001@gmail.com', password: 'password3', role: 'general', temp: false, nickname: '최성원C' },
    { id: 'grayhat3400@gmail.com', password: 'password4', role: 'general', temp: false, nickname: '최성원D' },
    { id: 'sharon0320@gachon.ac.kr', password: 'password5', role: 'general', temp: false, nickname: '애런 예거' },
];

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
          {/* 루트 관리자일 경우에만 '관리자 관리'와 '모델 선택' 메뉴가 보임 */}
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
  const [admins, setAdmins] = useState(createDummyAdmins());

  // [유틸리티] 새로고침 버튼 클릭 시 자식 컴포넌트의 상태를 리셋하기 위한 '신호'.
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 페이지 이동을 위한 네비게이션 함수.
  const navigate = useNavigate();

  // --- 2. 이벤트 핸들러 (Event Handlers) ---
  
  // [핸들러] 로그인 처리 로직.
  const handleLogin = (credentials) => {
    const admin = admins.find(a => a.id === credentials.id && a.password === credentials.password);
    if (admin) {
      // 임시 비밀번호 사용자인 경우, 비밀번호 변경 페이지로 이동시킴.
      if (admin.temp) {
        navigate('/pswchange', { state: { email: admin.id } });
        return true;
      }
      // 일반 로그인 성공 시 상태 업데이트 및 대시보드로 이동.
      setAuthed(true);
      setUserRole(admin.role);
      navigate('/');
      return true;
    }
    return false; // 로그인 실패 시 false 반환.
  };
  
  // [핸들러] 로그아웃 처리 로직.
  const handleLogout = () => {
    setAuthed(false);
    setUserRole(null);
    navigate('/login');
  };

  // [핸들러] 비밀번호 변경 처리 로직 (임시 비밀번호 사용자가 새 비밀번호 설정 시).
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
  const handleRefresh = () => {
    // 모든 데이터를 초기 더미 데이터로 리셋함.
    setBefore(seedBefore());
    setAfter([]);
    setUsers(initialUsers());
    setAdmins(createDummyAdmins());
    // refreshKey 값을 변경하여 자식 컴포넌트에 리셋 신호를 보냄.
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
        <Route path="/find-password" element={<FindPasswordPage admins={admins} />} />
        
        {/* 인증이 필요한 페이지들 (Layout 컴포넌트 사용) */}
        <Route 
          path="/" 
          element={authed ? <Layout userRole={userRole} onLogout={handleLogout} handleRefresh={handleRefresh} pageTitle={pageTitle} /> : <Navigate to="/login" />}
        >
          {/* 각 페이지 경로와 렌더링할 컴포넌트를 정의하고 필요한 props를 전달함 */}
          <Route index element={<DashboardPage queueItems={before} onGotoRetrain={() => navigate('/ai_retrain')} setPageTitle={setPageTitle} onGotoUserManagement={(status) => navigate(`/user?status=${status}`)} refreshKey={refreshKey} />} />
          <Route path="user" element={<UserManagementPage users={users} setUsers={setUsers} setPageTitle={setPageTitle} />} />
          <Route path="ai_retrain" element={<RetrainPage before={before} setBefore={setBefore} after={after} setAfter={setAfter} setPageTitle={setPageTitle} />} />
          
          {/* 루트 관리자 전용 페이지 (접근 제어) */}
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