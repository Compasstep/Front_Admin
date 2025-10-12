// --- React 및 관련 라이브러리 임포트 ---
import EmotionPicker from "../components/EmotionPicker.jsx";
import { useState, useEffect } from "react";
// 여기는 더미데이터를 가져와서 적용
import { POSITIVE, NEGATIVE, AMBIGUOUS } from "../Data/data.jsx";


// --- 메인 컴포넌트: AI 재학습 페이지 ---
// AI가 분석한 댓글의 감정 데이터를 관리자가 직접 검토하고 수정하는 페이지.
export default function RetrainPage({ before, setBefore, after, setAfter, setPageTitle }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  // 페이지 로드 시 상단 제목을 'AI 재학습'으로 설정함.
  useEffect(() => {
    setPageTitle("AI 재학습");
  }, [setPageTitle]);

  const [tab, setTab] = useState("before"); // 현재 활성화된 탭('before' 또는 'after')을 관리하는 상태.
  
  // 감정 선택 모달 관련 상태들
  const [modalOpen, setModalOpen] = useState(false); // 모달의 표시 여부.
  const [editing, setEditing] = useState(null); // 현재 수정 중인 데이터 항목.
  const [prevEmotions, setPrevEmotions] = useState([]); // 수정 전 감정 목록 (모달 내 표시용).
  const [selected, setSelected] = useState(new Set()); // 모달에서 선택된 감정 목록.

  // 감정 더보기(+N) 팝오버 관련 상태.
  const [pop, setPop] = useState(null);

  // --- 2. 데이터 처리 및 변수 ---
  
  // 현재 활성화된 탭(tab)에 따라 테이블에 표시할 목록(list)을 동적으로 결정함.
  const list = tab === "before" ? before : after;

  // --- 3. 이벤트 핸들러 및 함수 ---

  // [핸들러] 감정 더보기 팝오버 관련
  // 팝오버를 염.
  const openPopover = (e, items) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPop({ x: r.left + r.width / 2, y: r.top - 8, items });
  };
  // 팝오버를 닫음.
  const closePopover = () => setPop(null);

  // [핸들러] 감정 수정 모달 관련
  // '수정하기' 버튼 클릭 시 모달을 열고 수정 관련 상태를 설정함.
  function onOpenEdit(item) {
    setEditing(item);
    setPrevEmotions(item.emotions);
    setSelected(new Set(item.emotions));
    setModalOpen(true);
  }
  // 모달을 닫을 때 모든 관련 상태를 초기화함.
  function onCloseEdit() {
    setModalOpen(false);
    setEditing(null);
    setPrevEmotions([]);
    setSelected(new Set());
  }
  // 모달에서 감정 칩을 토글(선택/해제)함.
  function toggleEmotion(label) {
    setSelected(old => {
      const next = new Set(old);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }
  // 모달에서 '선택 초기화' 버튼 클릭 시 선택된 감정을 모두 비움.
  function resetSelection() { setSelected(new Set()); }

  // [핸들러] 데이터 조작 (저장/되돌리기)
  // 모달에서 '저장하기' 버튼 클릭 시 실행됨.
  function onSave() {
    if (!editing) return;
    // 수정된 데이터를 새로운 객체로 만듦.
    const updated = {
      ...editing,
      __origin: editing.emotions, // 원본 감정 데이터를 보존함 (되돌리기 기능용).
      learned: true,
      emotions: Array.from(selected),
    };
    // '수정 전' 목록에서는 해당 항목을 제거함.
    setBefore(list => list.filter(v => v.id !== editing.id));
    // '수정 후' 목록에는 새 항목을 추가함.
    setAfter(list => [updated, ...list]);
    onCloseEdit();
    setTab("after"); // '수정 후' 탭으로 자동 전환.
  }

  // '되돌리기' 버튼 클릭 시 실행됨.
  function onUndo(item) {
    // 보존했던 원본(__origin) 감정 데이터로 복원함.
    const restored = { ...item, learned: false, emotions: item.__origin ?? item.emotions };
    // '수정 후' 목록에서 제거함.
    setAfter(list => list.filter(v => v.id !== item.id));
    // '수정 전' 목록에 다시 추가함.
    setBefore(list => [restored, ...list]);
    setTab("before"); // '수정 전' 탭으로 자동 전환.
  }

  // --- 4. 하위 UI 컴포넌트 ---

  // [컴포넌트] 감정 칩 목록 UI (2개 초과 시 '+N' 버튼 표시).
  function EmotionChips({ emotions }) {
    const first2 = emotions.slice(0, 2);
    const rest = emotions.slice(2);
    return (
      <div className="q-emo">
        {first2.map(e => <span key={e} className="chip">{e}</span>)}
        {rest.length > 0 && (
          <button type="button" className="chip chip-link" onClick={(e) => openPopover(e, rest)}>
            +{rest.length}
          </button>
        )}
      </div>
    );
  }

  // [컴포넌트] 테이블의 각 행(Row)을 렌더링함.
  function Row({ row, idx }) {
    return (
      <div className="ai-row">
        <div className="q-no">{idx + 1}</div>
        <div>{row.learned ? <span className="badge-o">O</span> : <span className="badge-x">X</span>}</div>
        <div className="q-comment">{row.comment}</div>
        <div><EmotionChips emotions={row.emotions} /></div>
        <div className="q-conf">{row.confidence.toFixed(2)}</div>
        <div className="q-action">
          {tab === "before" ? (
            <button className="iconbtn" title="수정하기" onClick={() => onOpenEdit(row)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 7l4 4" stroke="#334155" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
          ) : (
            <button className="iconbtn" title="되돌리기" onClick={() => onUndo(row)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 11H4V6" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 11a9 9 0 1 0 2.6-6.45" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- 5. 메인 UI 렌더링 (JSX) ---
  return (
    <>
      <section className="ai-card">
        {/* 탭 컨트롤 UI */}
        <div className="seg" role="tablist" aria-label="수정 전/후 전환">
          <div className="seg-track">
            <div
              className="seg-thumb"
              style={{ transform: `translateX(${tab === "before" ? 0 : 100}%)` }}
            />
            <button role="tab" aria-selected={tab === "before"} className="seg-btn" onClick={() => setTab("before")}>
              수정 전
            </button>
            <button role="tab" aria-selected={tab === "after"} className="seg-btn" onClick={() => setTab("after")}>
              수정 후
            </button>
          </div>
        </div>
        
        {/* 테이블 헤더 */}
        <div className="ai-head">
          <div>No.</div>
          <div>학습유무</div>
          <div>댓글 내용</div>
          <div>감정 index</div>
          <div>confidence</div>
          <div>{tab === "before" ? "수정하기" : "되돌리기"}</div>
        </div>
        
        {/* 테이블 바디 */}
        <div className="ai-body">
          {list.map((row, i) => <Row key={row.id} row={row} idx={i} />)}
        </div>
      </section>

      {/* 감정 선택 모달 (modalOpen이 true일 때만 렌더링) */}
      <EmotionPicker
        open={modalOpen}
        onClose={onCloseEdit}
        onReset={resetSelection}
        onSave={onSave}
        prevEmotions={prevEmotions}
        selected={selected}
        onToggle={toggleEmotion}
        positive={POSITIVE}
        negative={NEGATIVE}
        ambiguous={AMBIGUOUS}
      />

      {/* 감정 더보기 팝오버 (pop 상태가 있을 때만 렌더링) */}
      {pop && (
        <div className="popover" style={{ left: pop.x, top: pop.y }} onMouseLeave={closePopover}>
          {pop.items.map(it => <div key={it} className="popover-item">{it}</div>)}
        </div>
      )}
    </>
  );
}