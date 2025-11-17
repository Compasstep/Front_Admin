// --- React 및 관련 라이브러리 임포트 ---
import { useState } from "react";
import { Routes, Route, NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";

// --- 페이지 컴포넌트 임포트 ---
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import RetrainPage from "./pages/RetrainPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import UserManagementPage from "./pages/UserManagementPage.jsx";
import PasswordChangePage from "./pages/PasswordChangePage.jsx";
// import ModelSelectionPage from "./pages/ModelSelectionPage.jsx"; // ⬅️ 제거
import FindPasswordPage from "./pages/FindPasswordPage.jsx";

// --- 유틸리티 및 전역 스타일 임포트 --
import { ToastProvider } from "./components/Toast.jsx";
import "./styles/index.css";
// 여기는 더미데이터를 가져와서 적용
import { seedBefore, initialUsers, createDummyAdmins } from "./Data/data.jsx";
import { loginUser, logoutUser } from "./api/authApi.js";
import ThemeToggle from "./components/ThemeToggle.jsx";
import useTheme from "./hooks/useTheme";


// --- 하위 컴포넌트: 기본 레이아웃 ---
function Layout({ userRole, onLogout, handleRefresh, pageTitle }) {
  const getNavLinkClass = ({ isActive }) => (isActive ? "sb-item sb-active" : "sb-item");

  return (
    <div className="dash">
      {/* 사이드바 영역 */}
      <aside className="sb">
        <div className="sb-brand">Compassstep Admin</div>
        <nav className="sb-nav">
          <NavLink to="/" className={getNavLinkClass} end>
            {({ isActive }) => (
              <>
                <span className={isActive ? "dot" : "dot dot-muted"} />
                대시보드
              </>
            )}
          </NavLink>
          <NavLink to="/user" className={getNavLinkClass}>
            {({ isActive }) => (
              <>
                <span className={isActive ? "dot" : "dot dot-muted"} />
                유저 관리
              </>
            )}
          </NavLink>
          <NavLink to="/ai_retrain" className={getNavLinkClass}>
            {({ isActive }) => (
              <>
                <span className={isActive ? "dot" : "dot dot-muted"} />
                AI 재학습
              </>
            )}
          </NavLink>

          {userRole === "root" && (
            <>
              <NavLink to="/manager" className={getNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <span className={isActive ? "dot" : "dot dot-muted"} />
                    관리자 관리
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>
        <button className="logout" onClick={onLogout}>
          로그아웃
        </button>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="main">
        <div className="main-head">
          <h1 className="page-title">{pageTitle}</h1>

          {/* ← 오른쪽 툴바: 토글 + 새로고침 (디자인/색 변경 없음, 위치만 이동) */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <ThemeToggle />
            <button className="btn" onClick={handleRefresh}>새로고침</button>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}

// --- 최상위 App 컴포넌트 ---
export default function App() {
  useTheme();
  const [mustChangePw, setMustChangePw] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [pageTitle, setPageTitle] = useState("");
  const [before, setBefore] = useState(seedBefore());
  const [after, setAfter] = useState([]);
  const [users, setUsers] = useState(initialUsers());
  const [admins, setAdmins] = useState(createDummyAdmins());
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    try {
      const data = await loginUser(credentials);
      setAuthed(true);

      if (credentials.id === "root@compasstep.com") {
        setUserRole("root");
      } else {
        setUserRole(data.role);
      }

      // 최근 로그인 이메일 저장 (비밀번호 변경/찾기에서 마스킹 용)
      try { localStorage.setItem('lastLoginEmail', credentials.id || ''); } catch {}

      // ── 임시비밀번호 패턴 보조판별(백엔드 신호가 없을 때 대비) ─────────────
      // 지금 이메일로 오는 임시 PW가 8자리 hex/숫자 형태였음 (예: 6b0ac201, f291f98a)
      const pw = String(credentials.password || "");
      const isHex8   = /^[0-9a-f]{8}$/i.test(pw);   // 8자리 16진
      const isNum8   = /^\d{8}$/.test(pw);          // 8자리 숫자
      const looksTemp = isHex8 || isNum8;
      // 서버에서 주는 플래그(이미 표준화되어 옴) + 보조판별(looksTemp) OR 결합
      const needPwChange = Boolean(data?.mustChangePassword) || looksTemp;

      setMustChangePw(needPwChange);
      if (needPwChange) {
        navigate("/pswchange", { replace: true, state: { email: credentials.id } });
      } else {
        navigate("/", { replace: true });
      }

      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(error.message);
    } finally {
      setMustChangePw(false);
      setAuthed(false);
      setUserRole(null);
      navigate("/login");
    }
  };

  const handleRefresh = () => {
    setBefore(seedBefore());
    setAfter([]);
    setUsers(initialUsers());
    setAdmins(createDummyAdmins());
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
         <Route
           path="/pswchange"
           element={
             <PasswordChangePage
               onChanged={async () => {
                 // 1) 서버 세션 정리
                 try { await logoutUser(); } catch (_) {}
                 // 2) App 상태 초기화
                 setMustChangePw(false);
                 setAuthed(false);
                 setUserRole(null);
                 // 3) 로그인 페이지로 이동
                 navigate('/login', { replace: true });
               }}
             />
           }
         />
        <Route path="/find-password" element={<FindPasswordPage admins={admins} />} />

        <Route
          path="/"
          element={
            authed ? (
             mustChangePw
               ? <Navigate to="/pswchange" replace />
               : <Layout userRole={userRole} onLogout={handleLogout} handleRefresh={handleRefresh} pageTitle={pageTitle} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route
            index
            element={
              <DashboardPage
                queueItems={before}
                onGotoRetrain={() => navigate("/ai_retrain")}
                setPageTitle={setPageTitle}
                onGotoUserManagement={(status) => navigate(`/user?status=${status}`)}
                refreshKey={refreshKey}
              />
            }
          />
          <Route path="user" element={<UserManagementPage users={users} setUsers={setUsers} setPageTitle={setPageTitle} />} />
          <Route
            path="ai_retrain"
            element={<RetrainPage before={before} setBefore={setBefore} after={after} setAfter={setAfter} setPageTitle={setPageTitle} />}
          />

          <Route
            path="manager"
            element={userRole === "root" ? <AdminPage setPageTitle={setPageTitle} /> : <Navigate to="/" />}
          />

          {/* ⬇️ 모델 선택 라우트 삭제 */}
          {/* <Route path="model" element={userRole === 'root' ? <ModelSelectionPage .../> : <Navigate to="/" />} /> */}

          {/* 과거 북마크/직접 접근 처리: 모델 경로로 오면 대시보드로 */}
          <Route path="model" element={<Navigate to="/dashboard" replace />} />      {/* ⬅️ 추가 */}
          <Route path="model_select" element={<Navigate to="/dashboard" replace />} />{/* ⬅️ 추가 */}
          <Route path="dashboard" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="*" element={<Navigate to={authed ? "/" : "/login"} />} />
      </Routes>
    </ToastProvider>
  );
}
