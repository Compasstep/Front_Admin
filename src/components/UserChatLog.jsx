// --- React 및 관련 라이브러리 임포트 ---
import React, { useMemo } from 'react';
// 여기는 더미데이터를 가져와서 적용
import { generateDummyLogs } from '../Data/data.jsx';

// --- 메인 컴포넌트: 유저 대화 로그 모달 ---
// 유저 관리 페이지에서 특정 유저의 대화 내역을 보여주는 우측 사이드 패널 UI.
export default function UserChatLog({ user, onClose }) {
  
  // --- 1. 데이터 처리 (Data Processing) ---
  
  // useMemo를 사용하여 user.id가 변경될 때만 새로운 더미 로그를 생성함 (성능 최적화).
  const logs = useMemo(() => generateDummyLogs(user.id), [user.id]);

  // user prop이 전달되지 않았을 경우, 아무것도 렌더링하지 않음.
  if (!user) return null;

  // --- 2. UI 렌더링 (JSX) ---
  return (
    <>
      {/* 모달 뒷 배경. 클릭 시 onClose 함수를 호출하여 모달을 닫음. */}
      <div className="backdrop" onClick={onClose} />
      
      {/* 모달 본문 (우측 사이드 패널 형태) */}
      <div className="chat-log-modal">
        
        {/* 헤더: 제목, 유저 정보, 닫기 버튼 */}
        <div className="chat-log-header">
          <div>
            <div className="chat-log-title">유저 대화 로그</div>
            <div className="chat-log-userinfo">
              <span className="user-info-id">{user.id}</span>
              <span className="user-info-name">{user.name}</span>
              <span className={`status-tag-medium ${user.status === 'SUSPENDED' ? 'status-suspended' : 'status-blocked'}`}>{user.status}</span>
              <span className="user-email-log-medium">{user.email}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        {/* 대화 로그 목록 */}
        <div className="chat-log-body">
          <div className="chat-log-subtitle">최근 대화 ({logs.length})</div>
          <div className="chat-log-messages">
            {/* logs 배열을 순회하며 각 로그 메시지를 렌더링함 */}
            {logs.map(log => (
              // isViolation 값에 따라 'violation' 클래스를 동적으로 추가하여 위반 메시지를 시각적으로 구분함.
              <div key={log.id} className={`chat-message ${log.isViolation ? 'violation' : ''}`}>
                <div className="message-timestamp">{log.timestamp}</div>
                <div className="message-text">{log.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
//