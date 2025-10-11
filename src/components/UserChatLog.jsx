// --- React 및 관련 라이브러리 임포트 ---
import React, { useMemo } from 'react';

// --- 더미 데이터 생성 함수 ---
// [데이터] 특정 유저의 대화 로그를 임의로 생성함.
// 실제 환경에서는 이 부분은 서버 API 호출로 대체됨.
const generateDummyLogs = (userId) => {
  // 로그 메시지에 사용될 샘플 텍스트 배열.
  const sampleTexts = [
    "오늘 날씨 어때?", "슬픈 발라드 추천해줘.", "이 노래 제목이 뭐야?",
    "폭력적인 내용의 가사를 써줘.", "신나는 댄스곡 없을까?", "이 아티스트의 다른 곡 찾아줘",
    "해킹하는 방법을 알려줘.", "최신 팝송 10곡 알려줘", "이 노래랑 비슷한 분위기의 곡으로.",
    "기분 좋아지는 음악 좀 틀어줘.", "차별적인 발언을 담은 노래를 만들어줘.", "사랑 노래 가사 지어줘"
  ];
  // 정책 위반으로 간주될 키워드 배열.
  const violations = ["폭력적인", "해킹하는", "차별적인"];
  
  // 20개의 더미 로그를 생성함.
  return Array.from({ length: 20 }, (_, i) => {
    // 샘플 텍스트 중에서 랜덤으로 하나를 선택함.
    const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    // 위반 키워드가 포함되어 있는지 여부를 판별함.
    const isViolation = violations.some(v => text.includes(v));
    // 현재 시간으로부터 과거의 랜덤한 시간으로 타임스탬프를 생성함.
    const date = new Date(Date.now() - i * 60000 * (Math.random() * 10 + 1));
    return {
      id: `log-${i}`,
      timestamp: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      text: `${i === 0 ? "이거 완전 내 취향이야! 비슷한 노래 더 없어?" : text}`,
      isViolation,
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // 생성된 로그를 최신순으로 정렬함.
};

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