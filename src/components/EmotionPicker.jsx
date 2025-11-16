// --- React 라이브러리 임포트 ---
import React from "react";

// --- 하위 컴포넌트: 선택 가능한 감정 칩 ---
function ChipOption({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      className={`chip-option ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="chip-bullet" />
      <span className="chip-label">{label}</span>
      <svg className="chip-check" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 10.5l3.5 3.5L15 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// --- 메인 컴포넌트: 감정 선택 모달 ---
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
  if (!open) return null;

  return (
    <>
      <div className="backdrop" onClick={onClose} />

      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title">감정 선택</div>
          <div className="modal-count">{selected?.size ?? 0} 선택</div>
          <button className="modal-close" aria-label="닫기" onClick={onClose}>×</button>
        </div>

        <div className="modal-sub">
          <div className="muted">수정 전 감정</div>
          <div className="chips" style={{ marginTop: 6, marginBottom: 12 }}>
            {prevEmotions.map((e) => (
              <span key={e} className="chip chip-gray">{e}</span>
            ))}
          </div>

          <div className="group">
            <div className="group-title">긍정 ({positive.length})</div>
            <div className="chips">
              {positive.map((e) => (
                <ChipOption key={e} label={e} selected={selected.has(e)} onToggle={() => onToggle(e)} />
              ))}
            </div>
          </div>

          <div className="group">
            <div className="group-title">부정 ({negative.length})</div>
            <div className="chips">
              {negative.map((e) => (
                <ChipOption key={e} label={e} selected={selected.has(e)} onToggle={() => onToggle(e)} />
              ))}
            </div>
          </div>

          <div className="group">
            <div className="group-title">모호 ({ambiguous.length})</div>
            <div className="chips">
              {ambiguous.map((e) => (
                <ChipOption key={e} label={e} selected={selected.has(e)} onToggle={() => onToggle(e)} />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
            <button type="button" className="btn btn-ghost" onClick={onReset}>선택 초기화</button>
            <button type="button" className="btn" onClick={onSave}>저장하기</button>
          </div>
        </div>
      </div>
    </>
  );
}
