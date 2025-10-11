// --- React 및 관련 라이브러리 임포트 ---
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import UserChatLog from "../components/UserChatLog.jsx";

// --- 하위 컴포넌트: 알림 메시지 모달 ---
// 간단한 알림 메시지를 표시하기 위한 모달 UI 컴포넌트.
function MessageBox({ message, onClose }) {
  // message prop이 없으면 아무것도 렌더링하지 않음.
  if (!message) return null;
  
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal" role="alert" style={{ width: 400, top: '40%' }}>
        <div className="modal-header">
            <div className="modal-title">알림</div>
            <button className="modal-close" aria-label="닫기" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '24px', textAlign: 'center', fontSize: '15px' }}>
          {message}
        </div>
      </div>
    </>
  );
}

// --- 메인 컴포넌트: 유저 관리 페이지 ---
// 제재 조치가 필요한 사용자의 목록을 확인하고 계정 상태를 직접 관리하는 페이지.
export default function UserManagementPage({ users, setUsers, setPageTitle }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  // 페이지 로드 시 상단 제목을 '유저 관리'로 설정함.
  useEffect(() => {
    setPageTitle("유저 관리");
  }, [setPageTitle]);

  // URL 쿼리 파라미터를 읽어오기 위한 훅.
  const [searchParams] = useSearchParams();
  // URL에서 'status' 파라미터 값을 가져와 초기 필터 상태로 사용함 (대시보드에서 링크 클릭 시).
  const urlFilter = searchParams.get('status');

  const [filter, setFilter] = useState(urlFilter); // KPI 카드 필터 상태 ('SUSPENDED', 'BLOCKED', or null).
  const [activeAction, setActiveAction] = useState(null); // '조치' 팝오버가 열린 유저의 ID를 저장하는 상태.
  const [viewingUserLog, setViewingUserLog] = useState(null); // 대화 로그를 보고 있는 유저 정보를 저장하는 상태.
  const [message, setMessage] = useState(""); // 알림 모달에 표시될 메시지 상태.
  const [searchTerm, setSearchTerm] = useState(""); // 검색창의 현재 입력값을 관리하는 상태.
  const [activeSearch, setActiveSearch] = useState(""); // '조회' 버튼 클릭 시 적용될 실제 검색어.

  // --- 2. 데이터 처리 (Data Processing) ---
  
  // KPI 카드에 표시될 유저 수를 useMemo를 사용해 계산함 (users 배열이 변경될 때만 재계산).
  const suspendedCount = useMemo(() => users.filter(u => u.status === 'SUSPENDED').length, [users]);
  const blockedCount = useMemo(() => users.filter(u => u.status === 'BLOCKED').length, [users]);

  // 필터(filter)와 검색어(activeSearch)에 따라 최종적으로 화면에 표시될 유저 목록을 계산함.
  const displayedUsers = useMemo(() => {
    let results = users;

    // 1단계: 상태(정지/차단)에 따라 필터링함.
    if (filter) {
      results = results.filter(user => user.status === filter);
    }

    // 2단계: '조회' 버튼 클릭 후 적용된 검색어로 이름 또는 이메일을 필터링함.
    if (activeSearch) {
      results = results.filter(user =>
        user.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(activeSearch.toLowerCase())
      );
    }

    return results;
  }, [users, filter, activeSearch]);

  // --- 3. 이벤트 핸들러 (Event Handlers) ---

  // [핸들러] '조치' 메뉴(차단/해제) 클릭 시 실행됨.
  const handleAction = (userId, newStatus) => {
    const user = users.find(u => u.id === userId);
    // 이미 차단된 유저를 다시 차단하려는 경우 메시지를 표시함.
    if (user.status === 'BLOCKED' && newStatus === 'BLOCKED') {
      setMessage("이미 차단된 유저입니다.");
      setActiveAction(null);
      return;
    }

    // '해제'를 선택한 경우, 목록에서 해당 유저를 제거함.
    if (newStatus === 'RELEASED') {
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else {
    // '차단'을 선택한 경우, 해당 유저의 상태를 업데이트함.
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
    setActiveAction(null); // '조치' 팝오버를 닫음.
  };
  
  // [핸들러] '조회' 버튼 클릭 시 실행됨.
  const handleSearch = () => {
    // 현재 검색창의 입력값을 실제 검색어(activeSearch) 상태로 설정하여 필터링을 트리거함.
    setActiveSearch(searchTerm.trim());
  };

  // --- 4. UI 렌더링 (JSX) ---
  return (
    <>
      {/* KPI 카드 필터 영역 */}
      <div className="kpi-grid kpi-grid-3">
        <div 
          className={`kpi kpi-clickable ${!filter ? 'kpi-active' : ''}`}
          onClick={() => setFilter(null)}
        >
          <div className="kpi-label">전체</div>
          <div className="kpi-value">{users.length}</div>
        </div>
        <div 
          className={`kpi kpi-clickable ${filter === 'SUSPENDED' ? 'kpi-active' : ''}`}
          onClick={() => setFilter('SUSPENDED')}
        >
          <div className="kpi-label">정지 계정</div>
          <div className="kpi-value">{suspendedCount}</div>
        </div>
        <div 
          className={`kpi kpi-clickable ${filter === 'BLOCKED' ? 'kpi-active' : ''}`}
          onClick={() => setFilter('BLOCKED')}
        >
          <div className="kpi-label">차단 계정</div>
          <div className="kpi-value">{blockedCount}</div>
        </div>
      </div>

      <div className="user-table-card">
        {/* 검색 컨트롤 영역 */}
        <div className="user-controls">
          <input 
            type="text" 
            placeholder="이메일, 이름으로 검색..." 
            className="user-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn" onClick={handleSearch}>조회</button>
        </div>

        {/* 유저 목록 테이블 */}
        <div className="user-table">
          <div className="user-table-head">
            <div>UID</div><div>이름</div><div>이메일</div><div>가입일</div><div>최근 활동</div><div>상태</div><div></div><div></div>
          </div>
          <div className="user-table-body">
            {/* 필터링된 유저 목록(displayedUsers)을 기반으로 UI를 렌더링함. */}
            {displayedUsers.length > 0 ? (
              displayedUsers.map((user) => (
                <div key={user.id} className="user-row">
                  <div className="user-text-medium">{user.id}</div>
                  <div className="user-text-medium">{user.name}</div>
                  <div className="user-text-medium">{user.email}</div>
                  <div className="user-text-medium">{user.signupDate}</div>
                  <div className="user-text-medium">{user.lastActive}</div>
                  <div>
                    <span className={`status-tag ${user.status === 'SUSPENDED' ? 'status-suspended' : 'status-blocked'}`}>
                      {user.status}
                    </span>
                  </div>
                  <td>
                    <button className="iconbtn" onClick={() => setViewingUserLog(user)} title="대화 내역 보기">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </td>
                  <td style={{ position: 'relative' }}>
                    <button className="action-btn" onClick={() => setActiveAction(activeAction === user.id ? null : user.id)}>
                      조치
                    </button>
                    {/* activeAction 상태가 현재 유저 ID와 일치할 때만 팝오버를 표시함 */}
                    {activeAction === user.id && (
                      <div className="action-popover">
                        {user.status === 'SUSPENDED' && (
                          <button className="action-item" onClick={() => handleAction(user.id, 'BLOCKED')}>
                            <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2.5" fill="none" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="#DC2626" strokeWidth="2.5" /></svg>
                            차단
                          </button>
                        )}
                        {user.status === 'BLOCKED' && (
                          <button className="action-item" onClick={() => handleAction(user.id, 'BLOCKED')}>
                            <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2.5" fill="none" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="#DC2626" strokeWidth="2.5" /></svg>
                            차단
                          </button>
                        )}
                        <button className="action-item" onClick={() => handleAction(user.id, 'RELEASED')}>해제</button>
                      </div>
                    )}
                  </td>
                </div>
              ))
            ) : (
              // 검색 결과가 없을 경우 메시지를 표시함.
              <div className="no-results">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 대화 로그 모달 (viewingUserLog 상태에 값이 있을 때만 렌더링) */}
      {viewingUserLog && <UserChatLog user={viewingUserLog} onClose={() => setViewingUserLog(null)} />}
      {/* 알림 모달 (message 상태에 값이 있을 때만 렌더링) */}
      <MessageBox message={message} onClose={() => setMessage("")} />
    </>
  );
}