// --- React 및 커스텀 Hook 라이브러리 임포트 ---
import React, { useState, useMemo, useEffect } from "react";
import { useToast } from "../components/Toast.jsx";

// --- 하위 컴포넌트: 권한 해제 확인 모달 ---
// '권한 해제' 버튼 클릭 시 나타나는 확인 창 UI 컴포넌트.
function ConfirmationDialog({ open, onClose, onConfirm, adminName }) {
  // open prop이 false일 경우 null을 반환하여 렌더링하지 않음.
  if (!open) return null;

  return (
    <>
      {/* 모달 뒷 배경 */}
      <div className="backdrop" onClick={onClose} />
      
      {/* 모달 본문 */}
      <div className="modal" role="alertdialog" style={{ width: 400, top: '40%' }}>
        <div className="modal-body" style={{ padding: '24px' }}>
          <h3 className="confirm-title">권한 해제</h3>
          <p className="confirm-message">
            '{adminName}' 관리자의 권한을 해제하시겠습니까?
          </p>
        </div>
        {/* 모달 액션 버튼 (취소/확인) */}
        <div className="modal-actions" style={{ padding: '0 24px 24px', justifyContent: 'center', gap: '12px' }}>
          <button type="button" className="btn btn-cancel-soft" onClick={onClose} style={{ flex: 1 }}>
            취소
          </button>
          <button type="button" className="btn btn-confirm-soft" onClick={onConfirm} style={{ flex: 1 }}>
            확인
          </button>
        </div>
      </div>
    </>
  );
}

// --- 메인 컴포넌트: 관리자 관리 페이지 ---
export default function AdminPage({ admins, setAdmins, setPageTitle }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  // 페이지 로드 시 상단 제목을 '관리자 관리'로 설정함.
  useEffect(() => {
    setPageTitle("관리자 관리");
  }, [setPageTitle]);
  
  // ToastProvider로부터 토스트 메시지 함수를 가져옴.
  const { showToast } = useToast();

  // 검색창의 입력값을 관리하는 상태.
  const [searchTerm, setSearchTerm] = useState("");
  // 관리자 초대 모달의 열림/닫힘 상태.
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  // 관리자 초대 모달 내 이메일 입력값.
  const [inviteEmail, setInviteEmail] = useState("");
  // 권한 해제 확인 모달의 열림/닫힘 상태.
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  // 권한 해제 대상 관리자 정보를 임시 저장하는 상태.
  const [adminToRevoke, setAdminToRevoke] = useState(null);

  // --- 2. 데이터 처리 (Data Processing) ---

  // 검색어(searchTerm) 변경에 따라 관리자 목록을 실시간으로 필터링함.
  const filteredAdmins = useMemo(() => {
    // 검색어가 비어있으면 전체 목록을 반환함.
    if (!searchTerm.trim()) {
      return admins;
    }
    // 검색어가 있으면 닉네임 기준으로 필터링된 목록을 반환함.
    return admins.filter((admin) =>
      admin.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [admins, searchTerm]);


  // --- 3. 이벤트 핸들러 (Event Handlers) ---

  // [핸들러] '권한 해제' 버튼 클릭 로직
  const handleRevokeClick = (admin) => {
    setAdminToRevoke(admin); // 해제할 관리자 정보를 state에 저장.
    setConfirmOpen(true);    // 확인 모달을 엶.
  };

  // [핸들러] 권한 해제 확인 모달에서 '확인' 클릭 로직
  const handleConfirmRevoke = () => {
    if (adminToRevoke) {
      // admins 배열에서 대상 관리자를 제외한 새 배열로 상태를 업데이트함.
      setAdmins(currentAdmins => currentAdmins.filter(admin => admin.id !== adminToRevoke.id));
    }
    setConfirmOpen(false);   // 확인 모달을 닫음.
    setAdminToRevoke(null);  // 대상 관리자 정보 초기화.
  };
  
  // [핸들러] '초대 메일 발송' 버튼 클릭 로직
  const handleInvite = () => {
    // 이메일 유효성 검사
    if (!inviteEmail.includes('@')) {
      alert("올바른 이메일 주소를 입력하세요.");
      return;
    }
    
    // 초대할 관리자의 초기 정보 객체를 생성함.
    const newTempPassword = "1234"; 
    const newAdmin = {
      id: inviteEmail,
      password: newTempPassword,
      role: 'general',
      temp: true, // temp: true로 설정하여 다음 로그인 시 비밀번호 변경을 유도함.
      nickname: inviteEmail.split('@')[0],
    };

    // admins 상태에 새로운 관리자를 추가함.
    setAdmins(currentAdmins => [...currentAdmins, newAdmin]);

    // HTML 형식의 초대 이메일 본문을 생성함.
    const loginUrl = `${window.location.origin}/login`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <p style="font-size: 14px; color: #555;">
          <strong>From:</strong> Compassstep Admin &lt;no-reply@compasstep.com&gt;<br>
          <strong>To:</strong> ${inviteEmail}
        </p>
        <p>
          <span style="background-color: #e0f2fe; color: #0c4a6e; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; margin-right: 5px;">#관리자 초대</span>
          <span style="background-color: #e0f2fe; color: #0c4a6e; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">#임시 PW</span>
        </p>
        <h2 style="font-size: 24px; color: #111;">안녕하세요,</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Compassstep 관리자 콘솔에 초대되었습니다.<br>
          아래 임시 비밀번호로 로그인 후, 비밀번호를 변경해주세요.
        </p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: left; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">임시 비밀번호</p>
          <p style="margin: 10px 0 0; font-size: 24px; color: #111; font-weight: bold; letter-spacing: 2px;">${newTempPassword}</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #111; color: #ffffff; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 12px;">비밀번호 변경하기</a>
          <br>
          <a href="${loginUrl}" target="_blank" style="display: inline-block; color: #2563eb; text-decoration: none; margin-top: 16px; font-size: 14px;">브라우저에서 열기</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: left;">
          <p><span style="background-color: #e5e7eb; color: #4b5563; padding: 4px 8px; border-radius: 15px; font-size: 12px; font-weight: bold;">보안 알림</span></p>
          <p style="font-size: 12px; color: #6b7280; line-height: 1.6;">
            이 메일은 발신 전용입니다. 문의: support@compasstep.com
          </p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">© 2025 Compassstep. All rights reserved.</p>
      </div>
    `;

    // (시뮬레이션) 콘솔에 이메일 내용을 출력함.
    console.log("--- HTML 이메일 발송 시뮬레이션 ---");
    console.log(emailHtml);
    
    // 작업 완료 토스트 메시지를 표시함.
    showToast("초대 메일을 발송했습니다.");
    
    // 초대 모달을 닫고 입력 상태를 초기화함.
    setInviteModalOpen(false);
    setInviteEmail("");
  };

  // [핸들러] '비밀번호 재생성' 아이콘 클릭 로직
  const handlePasswordReset = (adminToReset) => {
    // 8자리 랜덤 임시 비밀번호를 생성함.
    const newTempPassword = Math.random().toString(36).substring(2, 10);

    // 대상 관리자의 비밀번호를 업데이트하고 temp 상태를 true로 변경함.
    setAdmins(currentAdmins =>
      currentAdmins.map(admin =>
        admin.id === adminToReset.id
          ? { ...admin, password: newTempPassword, temp: true }
          : admin
      )
    );
    
    // HTML 형식의 비밀번호 재설정 이메일 본문을 생성함.
    const loginUrl = `${window.location.origin}/login`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <p style="font-size: 14px; color: #555;">
          <strong>From:</strong> Compassstep Security &lt;no-reply@compasstep.com&gt;<br>
          <strong>To:</strong> ${adminToReset.id}
        </p>
        <p>
          <span style="background-color: #dcfce7; color: #166534; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">#비밀번호 재설정</span>
        </p>
        <h2 style="font-size: 24px; color: #111;">요청하신 계정의 임시 비밀번호를 발급했습니다.</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          아래 정보를 사용해 로그인하세요.
        </p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: left; margin: 24px 0;">
          <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">이메일</p>
          <p style="margin: 0 0 16px; font-size: 16px; color: #111; font-weight: bold;">${adminToReset.id}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb;">
          <p style="margin: 16px 0; font-size: 14px; color: #6b7280;">임시 비밀번호</p>
          <p style="margin: 0; font-size: 16px; color: #111; font-weight: bold; letter-spacing: 1px;">${newTempPassword}</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #111; color: #ffffff; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 12px;">로그인 페이지</a>
        </div>
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">보안을 위해 최초 로그인 시 비밀번호 변경 절차가 진행됩니다.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="text-align: center; font-size: 12px; color: #9ca3af;">
          문제가 있나요? support@compasstep.com 으로 문의해주세요.<br>
          © 2025 Compassstep. All rights reserved.
        </p>
      </div>
    `;

    // (시뮬레이션) 콘솔에 이메일 내용을 출력함.
    console.log("--- 임시 비밀번호 메일 발송 시뮬레이션 ---");
    console.log(emailHtml);

    // 작업 완료 토스트 메시지를 표시함.
    showToast("임시비밀번호를 보냈습니다.");
  };

  
  // --- 4. UI 렌더링 (JSX) ---
  return (
    <>
      {/* 관리자 관리 페이지 전체 카드 */}
      <div className="admin-page-card">
        
        {/* 헤더 영역: 제목, 초대(+), 검색 */}
        <div className="admin-header">
          <div className="admin-title-wrap">
            <h2 className="admin-title">관리자 목록</h2>
            {/* '+' 버튼: 클릭 시 초대 모달을 염 */}
            <button className="add-admin-btn" onClick={() => setInviteModalOpen(true)} title="새 관리자 추가">
              +
            </button>
          </div>
          <div className="admin-search">
            <input
              type="text"
              placeholder="관리자를 입력하세요"
              className="admin-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="admin-search-btn" title="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* 관리자 목록 테이블 */}
        <div className="admin-list">
          <div className="admin-list-head">
            <div>닉네임</div>
            <div>이메일</div>
            <div>관리</div>
            <div>password 재생성</div>
          </div>
          <div className="admin-list-body">
            {/* 필터링된 관리자 목록을 표시. 결과가 없으면 메시지를 보여줌 */}
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin) => (
                <div key={admin.id} className="admin-row">
                  <div className="admin-nickname">{admin.nickname}</div>
                  <div className="admin-email">{admin.id}</div>
                  <div>
                    <button className="btn-revoke" onClick={() => handleRevokeClick(admin)}>
                      권한 해제
                    </button>
                  </div>
                  <div>
                    <button className="mail-icon-btn" title="비밀번호 재설정 메일 발송" onClick={() => handlePasswordReset(admin)}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#64748B" strokeWidth="1.8" />
                        <path d="M22 6l-10 7L2 6" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 관리자 초대 모달 (isInviteModalOpen이 true일 때만 렌더링) */}
      {isInviteModalOpen && (
        <>
          <div className="backdrop" onClick={() => setInviteModalOpen(false)} />
          <div className="modal" role="dialog" aria-modal="true" style={{ width: 480 }}>
            <div className="modal-header">
              <div className="modal-title">관리자 초대</div>
              <button className="modal-close" aria-label="닫기" onClick={() => setInviteModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label htmlFor="invite-email" className="invite-label">이메일을 입력하세요</label>
              <input 
                id="invite-email" 
                type="email" 
                placeholder="example@compasstep.com" 
                className="input" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setInviteModalOpen(false)}>취소하기</button>
              <button type="button" className="btn" onClick={handleInvite}>초대 메일 발송</button>
            </div>
          </div>
        </>
      )}

      {/* 권한 해제 확인 모달 (isConfirmOpen이 true일 때만 렌더링) */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRevoke}
        adminName={adminToRevoke?.nickname}
      />
    </>
  );
}