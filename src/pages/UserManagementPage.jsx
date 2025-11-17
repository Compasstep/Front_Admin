// src/pages/UserManagementPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchDashboard,
  fetchMaliciousUsers,
  fetchUserLogs,
  banUser,
  unbanUser,
} from "../api/userApi";

// 디자인 & 기존 클래스 유지 (index.css 기준)
export default function UserManagementPage({ setPageTitle }) {
  // 페이지 타이틀 유지
  useEffect(() => setPageTitle?.("유저 관리"), [setPageTitle]);

  // URL 쿼리(status) → 초기 필터 반영
  const [searchParams] = useSearchParams();

  // KPI
  const [stats, setStats] = useState({ totalUser: 0, maliciousUser: 0, bannedUser: 0 });

  // 원본 유저 목록(악성 사용자/제재 대상 목록)
  const [users, setUsers] = useState([]);

  // 필터: 'ALL' | 'SUSPENDED' | 'BLOCKED'
  const [filter, setFilter] = useState("ALL");

  // 검색
  const [keyword, setKeyword] = useState("");

  // 액션 팝오버 (열림 상태 & 대상 userId)
  const [actionOpenFor, setActionOpenFor] = useState(null);
  const actionBtnRefs = useRef({});

  // 말풍선(채팅 로그) 패널
  const [showLogs, setShowLogs] = useState(false);
  const [logsUser, setLogsUser] = useState(null);
  const [logs, setLogs] = useState([]);

  // ✅ 가벼운 토스트 (index.css의 .toast-notification 사용)
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    // 자동 사라짐
    setTimeout(() => setToastMsg(null), 3000);
  };

  // -------- 데이터 로딩 --------
  async function loadDashboard() {
    const res = await fetchDashboard();
    if (res?.result) setStats(res.result);
  }

  async function loadUsers() {
    const res = await fetchMaliciousUsers();
    // 백엔드 응답: { code, message, result: [ { userId, name, email, status, createdAt } ] }
    setUsers(Array.isArray(res?.result) ? res.result : []);
  }

  useEffect(() => {
    loadDashboard();
    loadUsers();
  }, []);

  // /user?status=blocked | suspended | (없음)
  useEffect(() => {
    const s = (searchParams.get("status") || "").toLowerCase();
    if (s === "blocked") setFilter("BLOCKED");
    else if (s === "suspended") setFilter("SUSPENDED");
    else setFilter("ALL");
  }, [searchParams]);

  // -------- 목록 표시용 파생값 (필터 + 검색) --------
  const filtered = useMemo(() => {
    let list = users;
    if (filter === "SUSPENDED") list = list.filter((u) => u.status === "SUSPENDED");
    if (filter === "BLOCKED") list = list.filter((u) => u.status === "BLOCKED");
    const q = keyword.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        String(u.userId ?? "").toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
    );
  }, [users, filter, keyword]);

  // -------- 조치(차단/해제) --------
  async function handleBan(userId) {
    try {
      await banUser(userId);
      showToast("차단이 완료되었습니다.");
      setActionOpenFor(null);
      await Promise.all([loadUsers(), loadDashboard()]);
    } catch (e) {
      showToast(e?.message || "차단 중 오류가 발생했습니다.");
    }
  }

  async function handleUnban(userId) {
    try {
      await unbanUser(userId);
      showToast("해제가 완료되었습니다.");
      setActionOpenFor(null);
      await Promise.all([loadUsers(), loadDashboard()]);
    } catch (e) {
      showToast(e?.message || "해제 중 오류가 발생했습니다.");
    }
  }

  // -------- 로그 패널 --------
  async function openLogs(user) {
    const res = await fetchUserLogs(user.userId);
    setLogs(Array.isArray(res?.result?.chatLogs) ? res.result.chatLogs : []);
    setLogsUser(user);
    setShowLogs(true);
  }

  function closeLogs() {
    setShowLogs(false);
    setLogsUser(null);
    setLogs([]);
  }

  // 팝오버 외부 클릭 닫기
  useEffect(() => {
    function onDocClick(e) {
      if (!actionOpenFor) return;
      const btn = actionBtnRefs.current[actionOpenFor];
      if (btn && btn.contains(e.target)) return;
      setActionOpenFor(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [actionOpenFor]);

  return (
    <>
      {/* KPI 그리드(카드 바깥) */}
      <div className="user-kpi-grid">
        <div
          className={`kpi kpi-clickable ${filter === "ALL" ? "kpi-active" : ""}`}
          onClick={() => setFilter("ALL")}
        >
          <p className="kpi-label">전체</p>
          <p className="kpi-value">{stats.totalUser}</p>
        </div>
        <div
          className={`kpi kpi-clickable ${filter === "SUSPENDED" ? "kpi-active" : ""}`}
          onClick={() => setFilter("SUSPENDED")}
        >
          <p className="kpi-label">정지 계정</p>
          <p className="kpi-value">{stats.maliciousUser}</p>
        </div>
        <div
          className={`kpi kpi-clickable ${filter === "BLOCKED" ? "kpi-active" : ""}`}
          onClick={() => setFilter("BLOCKED")}
        >
          <p className="kpi-label">차단 계정</p>
          <p className="kpi-value">{stats.bannedUser}</p>
        </div>
      </div>

      {/* 표/검색은 카드 안 */}
      <section className="user-table-card">
        <div className="user-controls">
          <input
            className="user-search-input"
            placeholder="이메일, 이름으로 검색…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="user-table-head">
          <div>UID</div>
          <div>이름</div>
          <div>이메일</div>
          <div>가입일</div>
          <div>최근 활동</div>
          <div>상태</div>
          <div>{/* 말풍선 */}</div>
          <div>조치</div>
        </div>

        <div className="admin-list-body">
          {filtered.length === 0 ? (
            <div className="no-results">데이터가 없습니다.</div>
          ) : (
            filtered.map((u) => {
              const isBlocked = u.status === "BLOCKED";
              const isSuspended = u.status === "SUSPENDED";
              return (
                <div key={u.userId} className="user-row">
                  <div className="user-text-strong">U{String(u.userId).padStart(4, "0")}</div>
                  <div className="user-nickname">{u.name}</div>
                  <div className="user-email">{u.email}</div>
                  <div className="user-text-medium">{u.createdAt ?? "-"}</div>
                  <div className="user-text-medium">{u.lastActiveAt ?? "오늘"}</div>
                  <div>
                    {isBlocked ? (
                      <span className="status-tag status-blocked">BLOCKED</span>
                    ) : isSuspended ? (
                      <span className="status-tag status-suspended">SUSPENDED</span>
                    ) : (
                      <span className="status-tag">NORMAL</span>
                    )}
                  </div>

                  <div>
                    <button
                      className="mail-icon-btn"
                      title="대화 로그 보기"
                      onClick={() => openLogs(u)}
                    >
                      <span role="img" aria-label="chat">💬</span>
                    </button>
                  </div>

                  <div style={{ position: "relative" }}>
                    <button
                      ref={(el) => (actionBtnRefs.current[u.userId] = el)}
                      className="action-btn"
                      onClick={() =>
                        setActionOpenFor((cur) => (cur === u.userId ? null : u.userId))
                      }
                    >
                      조치
                    </button>

                    {actionOpenFor === u.userId && (
                      <div className="action-popover">
                        {isBlocked ? (
                          <button className="action-item" onClick={() => handleUnban(u.userId)}>
                            <svg width="16" height="16" viewBox="0 0 24 24">
                              <path d="M5 12l5 5L20 7" stroke="#16a34a" strokeWidth="2" fill="none" />
                            </svg>
                            해제
                          </button>
                        ) : (
                          <button className="action-item" onClick={() => handleBan(u.userId)}>
                            <svg width="16" height="16" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="2" fill="none" />
                              <path d="M8 8l8 8M16 8l-8 8" stroke="#dc2626" strokeWidth="2" />
                            </svg>
                            차단
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 우측 대화 로그 패널 */}
      {showLogs && (
        <div className="chat-log-modal">
          <div className="chat-log-header">
            <div>
              <div className="chat-log-title">유저 대화 로그</div>
              {logsUser && (
                <div className="chat-log-userinfo">
                  <span className="user-info-id">U{String(logsUser.userId).padStart(4, "0")}</span>
                  <span className="user-info-name">{logsUser.name}</span>
                  <span className="user-email-log-medium">{logsUser.email}</span>
                </div>
              )}
            </div>
            <button className="modal-close" onClick={closeLogs}>×</button>
          </div>

          <div className="chat-log-body">
            <div className="chat-log-subtitle">최근 대화</div>
            <div className="chat-log-messages">
              {logs.length === 0 ? (
                <div className="no-results" style={{ padding: 12 }}>대화 내역이 없습니다.</div>
              ) : (
                logs.map((c) => (
                  <div
                    key={c.chatId ?? `${c.createdAt}-${Math.random()}`}
                    className={`chat-message ${c.isGuardrailled ? "violation" : ""}`}
                  >
                    <div className="message-timestamp">{c.createdAt ?? "-"}</div>
                    <div className="message-text">{c.content ?? ""}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ 토스트 출력 (디자인 그대로) */}
      {toastMsg && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </>
  );
}
