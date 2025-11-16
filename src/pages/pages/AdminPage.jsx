// --- React 및 커스텀 Hook 라이브러리 임포트 ---
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "../components/Toast.jsx";
import { getAdmins, inviteAdmin, deleteAdmin, reissuePassword } from "../api/adminApi.js";

// 파일 상단 import 아래 아무 곳에 추가
function getPk(a) {
  return (
    a?.id ??
    a?.adminPKId ??
    a?.adminId ??
    a?.pk ??
    a?.userId ??
    null
  );
}

// --- 하위 컴포넌트: 권한 해제 확인 모달 ---
function ConfirmationDialog({ open, onClose, onConfirm, adminName }) {
  if (!open) return null;

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal" role="alertdialog" style={{ width: 400, top: "40%" }}>
        <div className="modal-body" style={{ padding: "24px" }}>
          <h3 className="confirm-title">권한 해제</h3>
          <p className="confirm-message">
            '{adminName}' 관리자의 권한을 해제하시겠습니까?
          </p>
        </div>
        <div
          className="modal-actions"
          style={{ padding: "0 24px 24px", justifyContent: "center", gap: "12px" }}
        >
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
export default function AdminPage({ setPageTitle }) {
  useEffect(() => {
    setPageTitle("관리자 관리");
  }, [setPageTitle]);

  const { showToast } = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [adminToRevoke, setAdminToRevoke] = useState(null);

  // 관리자 목록 조회
  const fetchAdminList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAdmins();
      const normalized = (Array.isArray(list) ? list : []).map((a) => ({
        // PK 표준화
        id: getPk(a),
        // 닉네임/이름 표준화
        nickname: a?.nickname ?? a?.name ?? a?.nick ?? "",
        // 이메일은 그대로
        email: a?.email ?? "",
        // 기타 필드는 그대로 보존
        ...a,
      }));
      setAdmins(normalized);
    } catch (err) {
      console.error(err);
      setError("관리자 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminList();
  }, [fetchAdminList]);

  // 검색 필터
  const filteredAdmins = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => (a.nickname || "").toLowerCase().includes(q));
  }, [admins, searchTerm]);

  // 초대 모달 닫기
  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteEmail("");
    setInviteName("");
  };

  // 관리자 초대
  const handleInvite = async () => {
    if (!inviteName.trim()) {
      alert("이름을 입력하세요.");
      return;
    }
    if (!inviteEmail.includes("@")) {
      alert("올바른 이메일 주소를 입력하세요.");
      return;
    }

    try {
      await inviteAdmin(inviteEmail, inviteName);
      showToast("초대 메일을 발송했습니다.");
      closeInviteModal();
      fetchAdminList();
    } catch (error) {
      console.error("초대 API 요청 중 오류 발생:", error);
      alert(`초대 실패: ${error.message}`);
    }
  };

  // 권한 해제 버튼 클릭 → 확인 모달 열기
  const handleRevokeClick = (admin) => {
    setAdminToRevoke(admin);
    setConfirmOpen(true);
  };

  // 권한 해제 확인
  const handleConfirmRevoke = async () => {
    if (!adminToRevoke) return;

    const pk = getPk(adminToRevoke); // ★ 응답에 포함된 id 사용
    if (pk == null) {
      alert("이 관리자에 대한 id 값이 없습니다.");
      setConfirmOpen(false);
      setAdminToRevoke(null);
      return;
    }

    try {
      await deleteAdmin(pk); // DELETE /api/admin/admins/{id}
      showToast(`'${adminToRevoke.nickname}' 관리자 권한을 해제했습니다.`);
      fetchAdminList();
    } catch (error) {
      console.error("권한 해제 실패:", error);
      alert(`권한 해제 실패: ${error.message}`);
    } finally {
      setConfirmOpen(false);
      setAdminToRevoke(null);
    }
  };

  // 비밀번호 재발급
  const handlePasswordReset = async (admin) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`'${admin.nickname}' 관리자의 비밀번호를 재발급하시겠습니까?`)) return;

    const pk = getPk(admin); // ★ 응답에 포함된 id 사용
    if (pk == null) {
      alert("이 관리자에 대한 id 값이 없습니다.");
      return;
    }

    try {
      await reissuePassword(pk); // body: { adminPKId: "id" }
      showToast("임시 비밀번호를 메일로 발송했습니다.");
    } catch (error) {
      console.error("비밀번호 재발급 실패:", error);
      alert(`재발급 실패: ${error.message}`);
    }
  };

  // 렌더링
  return (
    <>
      <div className="admin-page-card">
        <div className="admin-header">
          <div className="admin-title-wrap">
            <h2 className="admin-title">관리자 목록</h2>
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

        <div className="admin-list">
          <div className="admin-list-head">
            <div>닉네임</div>
            <div>이메일</div>
            <div>관리</div>
            <div>password 재생성</div>
          </div>

          <div className="admin-list-body">
            {loading ? (
              <div className="no-results">관리자 목록을 불러오는 중...</div>
            ) : error ? (
              <div className="no-results" style={{ color: "red" }}>{error}</div>
            ) : filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin) => (
                <div key={`${admin.email}-${admin.id}`} className="admin-row">
                  <div className="admin-nickname">{admin.nickname}</div>
                  <div className="admin-email">{admin.email}</div>
                  <div>
                    <button className="btn-revoke" onClick={() => handleRevokeClick(admin)}>
                      권한 해제
                    </button>
                  </div>
                  <div>
                    <button
                      className="mail-icon-btn"
                      title="비밀번호 재설정 메일 발송"
                      onClick={() => handlePasswordReset(admin)}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#64748B" strokeWidth="1.8" />
                        <path d="M22 6l-10 7L2 6" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">등록된 관리자가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* 관리자 초대 모달 */}
      {isInviteModalOpen && (
        <>
          <div className="backdrop" onClick={closeInviteModal} />
          <div className="modal" role="dialog" aria-modal="true" style={{ width: 480 }}>
            <div className="modal-header">
              <div className="modal-title">관리자 초대</div>
              <button className="modal-close" aria-label="닫기" onClick={closeInviteModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <label htmlFor="invite-name" className="invite-label">
                이름을 입력하세요
              </label>
              <input
                id="invite-name"
                type="text"
                placeholder="ex) 홍길동"
                className="input"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                style={{ marginBottom: "16px" }}
              />

              <label htmlFor="invite-email" className="invite-label">
                이메일을 입력하세요
              </label>
              <input
                id="invite-email"
                type="email"
                placeholder="example@compasstep.com"
                className="input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="modal-actions" style={{ marginTop: "24px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={closeInviteModal}>
                취소하기
              </button>
              <button type="button" className="btn" onClick={handleInvite}>
                초대 메일 발송
              </button>
            </div>
          </div>
        </>
      )}

      {/* 권한 해제 확인 모달 */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRevoke}
        adminName={adminToRevoke?.nickname}
      />
    </>
  );
}
