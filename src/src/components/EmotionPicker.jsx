// --- React 라이브러리 임포트 ---
import React from "react";

// --- 하위 컴포넌트: 선택 가능한 감정 칩 ---
// 감정 선택 모달 내부에서 사용되는 개별 감정 버튼 UI.
// props:
// - label: 칩에 표시될 감정 텍스트
// - selected: 현재 칩의 선택 여부 (boolean)
// - onToggle: 칩을 클릭했을 때 실행될 함수
function ChipOption({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      // 'selected' prop에 따라 'is-selected' 클래스가 동적으로 추가/제거됨.
      className={`chip-option ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      {/* 감정 칩 앞의 색상 점 */}
      <span className="chip-bullet" />
      {/* 감정 텍스트 */}
      <span className="chip-label">{label}</span>
      {/* 선택 시 표시되는 체크 아이콘 */}
      <svg className="chip-check" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M5 10.5l3.5 3.5L15 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// --- 메인 컴포넌트: 감정 선택 모달 ---
// AI 재학습 페이지에서 감정 데이터를 수정할 때 사용되는 모달 UI.
// props:
// - open: 모달의 표시 여부를 결정함 (boolean).
// - onClose: 모달을 닫을 때 호출되는 함수.
// - onReset: '선택 초기화' 버튼 클릭 시 호출되는 함수.
// - onSave: '저장하기' 버튼 클릭 시 호출되는 함수.
// - prevEmotions: 수정 전 감정 목록 배열.
// - selected: 현재 선택된 감정들의 Set 객체.
// - onToggle: 감정 칩을 클릭(토글)할 때 호출되는 함수.
// - positive, negative, ambiguous: 각 카테고리별 감정 목록 배열.
export default function EmotionPicker({
  open,
  onClose,
  onReset,
  onSave,
  prevEmotions = [],
  selected,
  onToggle,
  positive = [],
  negative = [],
  ambiguous = [],
}) {
  // open prop이 false이면 렌더링하지 않음 (컴포넌트 숨김 처리).
  if (!open) return null;

  return (
    <>
      {/* 모달 뒷 배경. 클릭 시 모달이 닫힘. */}
      <div className="backdrop" onClick={onClose} />
      
      {/* 모달 본문 */}
      <div className="modal" role="dialog" aria-modal="true">
        
        {/* 모달 헤더: 제목, 선택 개수, 닫기 버튼 */}
        <div className="modal-header">
          <div className="modal-title">감정 선택</div>
          <div className="modal-count">{selected?.size ?? 0} 선택</div>
          <button className="modal-close" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-sub">
          
          {/* 수정 전 감정 표시 영역 */}
          <div className="muted">수정 전 감정</div>
          <div className="chips" style={{ marginTop: 6, marginBottom: 12 }}>
            {prevEmotions.map((e) => (
              <span key={e} className="chip chip-gray">
                {e}
              </span>
            ))}
          </div>

          {/* 감정 선택 영역: 긍정 */}
          <div className="group">
            <div className="group-title">긍정 ({positive.length})</div>
            <div className="chips">
              {positive.map((e) => (
                <ChipOption
                  key={e}
                  label={e}
                  selected={selected.has(e)}
                  onToggle={() => onToggle(e)}
                />
              ))}
            </div>
          </div>

          {/* 감정 선택 영역: 부정 */}
          <div className="group">
            <div className="group-title">부정 ({negative.length})</div>
            <div className="chips">
              {negative.map((e) => (
                <ChipOption
                  key={e}
                  label={e}
                  selected={selected.has(e)}
                  onToggle={() => onToggle(e)}
                />
              ))}
            </div>
          </div>

          {/* 감정 선택 영역: 모호 */}
          <div className="group">
            <div className="group-title">모호 ({ambiguous.length})</div>
            <div className="chips">
              {ambiguous.map((e) => (
                <ChipOption
                  key={e}
                  label={e}
                  selected={selected.has(e)}
                  onToggle={() => onToggle(e)}
                />
              ))}
            </div>
          </div>

          {/* 모달 액션 버튼 (취소, 초기화, 저장) */}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="button" className="btn btn-ghost" onClick={onReset}>
              선택 초기화
            </button>
            <button type="button" className="btn" onClick={onSave}>
              저장하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}