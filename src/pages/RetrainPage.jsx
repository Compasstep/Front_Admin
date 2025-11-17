// --- React 및 관련 라이브러리 임포트 ---
import EmotionPicker from "../components/EmotionPicker.jsx";
import { useState, useEffect, useRef } from "react";

// --- API 임포트 ---
// 모두 같은 파일에서 가져오도록 한 번에 통일 (경로 주의!)
import {
  fetchInvalidList,
  fetchValidList,
  convertInvalidToValid,
  revertValidToInvalid,
} from "../api/retrainApi.js";
// --- 감정 상수/매핑 (영문<->한글) ---
import {
  POSITIVE_KO,
  NEGATIVE_KO,
  AMBIGUOUS_KO,
  enToKo,
  koToEn,
} from "../constants/emotions.js";

// 한 페이지 개수
const PAGE_SIZE = 10;

// --- 메인 컴포넌트: AI 재학습 페이지 ---
export default function RetrainPage({ setPageTitle /* 기존 props 유지용 */ }) {
  // 상단 제목 유지
  useEffect(() => {
    setPageTitle?.("AI 재학습");
  }, [setPageTitle]);

  // 탭: before(수정 전) | after(수정 후)
  const [tab, setTab] = useState("before");

  // 목록 상태 (API 페이징 메타 포함)
  const [invalid, setInvalid] = useState({ pageMeta: { page: 0, size: PAGE_SIZE }, reviews: [] });
  const [valid, setValid] = useState({ pageMeta: { page: 0, size: PAGE_SIZE }, reviews: [] });

  // 현재 페이지 인덱스
  const [invalidPage, setInvalidPage] = useState(0);
  const [validPage, setValidPage] = useState(0);
  // [추가] 검색 상태
  const [q, setQ] = useState("");        // 입력창 값
  const [query, setQuery] = useState(""); // 실제 요청에 쓰는 값(Enter/검색 버튼 시 적용)
  const [loading, setLoading] = useState(false);
  // 팝오버(+N)
  const [pop, setPop] = useState(null);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);        // 현재 수정 중 리뷰 (API의 review 객체)
  const [prevEmotions, setPrevEmotions] = useState([]); // 한글 목록
  const [selected, setSelected] = useState(new Set());  // 한글 Set
  
  // 되돌리기 원복용: 최초 로딩 시의 원본 감정 캐시 (reviewId -> emotions[en])
  const originalMapRef = useRef(new Map());

 const loadInvalid = async (page = invalidPage) => {
   setLoading(true);
   const data = await fetchInvalidList({ page, size: PAGE_SIZE, q: query });
   // 원본 감정 캐시
   (data?.reviews || []).forEach((r) => {
     if (!originalMapRef.current.has(r.reviewId)) {
       originalMapRef.current.set(r.reviewId, r.emotions || []);
     }
   });
   setInvalid(data || { reviews: [], pageMeta: { page, size: PAGE_SIZE } });
   setLoading(false);
 };

 const loadValid = async (page = validPage) => {
   setLoading(true);
   const data = await fetchValidList({ page, size: PAGE_SIZE, q: query });
   setValid(data || { reviews: [], pageMeta: { page, size: PAGE_SIZE } });
   setLoading(false);
 };

  useEffect(() => { loadInvalid(0); loadValid(0); }, []);

  // 검색어(query)나 탭이 바뀌면 1페이지부터 다시 조회
  useEffect(() => {
    if (tab === "before") {
      setInvalidPage(0);
      loadInvalid(0);
    } else {
      setValidPage(0);
      loadValid(0);
    }
  }, [query, tab]);

  // ---------- 팝오버 ----------
  const openPopover = (e, itemsKo) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPop({ x: r.left + r.width / 2, y: r.top - 8, items: itemsKo });
  };
  const closePopover = () => setPop(null);

  // ---------- 모달 열기/닫기 ----------
  function onOpenEdit(review) {
    setEditing(review);
    // 서버는 영문 키 배열을 준다 → 화면/모달은 한글로 보여준다
    const koList = (review.emotions || []).map((en) => enToKo[en] || en);
    setPrevEmotions(koList);
    setSelected(new Set(koList)); // 기존처럼 기본 선택을 원하면 유지
    setModalOpen(true);
  }
  function onCloseEdit() {
    setModalOpen(false);
    setEditing(null);
    setPrevEmotions([]);
    setSelected(new Set());
  }
  function toggleEmotion(labelKo) {
    setSelected((old) => {
      const next = new Set(old);
      next.has(labelKo) ? next.delete(labelKo) : next.add(labelKo);
      return next;
    });
  }
  function resetSelection() { setSelected(new Set()); }

  // ---------- 저장/되돌리기 ----------
  async function onSave() {
    if (!editing) return;
    const finalLabelsEn = Array.from(selected)
      .map((ko) => koToEn[ko])
      .filter(Boolean);

    await convertInvalidToValid(editing.reviewId, finalLabelsEn);
    onCloseEdit();
    // 현재 페이지 유지한 채 양쪽 목록 새로고침
    await Promise.all([
      loadInvalid(invalid.pageMeta?.page ?? 0),
      loadValid(valid.pageMeta?.page ?? 0),
    ]);
    setTab("after");
  }

  async function onUndo(review) {
  // 1) 서버 되돌리기
  await revertValidToInvalid(review.reviewId);

  // 2) 목록 재로딩(서버 상태 동기화)
  await Promise.all([
    loadInvalid(invalid.pageMeta?.page ?? 0),
    loadValid(valid.pageMeta?.page ?? 0),
  ]);

  // 3) [보정] 서버가 원래 감정으로 즉시 되돌려주지 않는 경우를 대비해
  //    최초 로딩 때 저장해둔 원본 감정(en[])으로 화면을 강제 복구
  const original = originalMapRef.current.get(review.reviewId);
  if (original) {
    setInvalid((prev) => {
      if (!prev?.reviews?.length) return prev;
      const nextReviews = prev.reviews.map((r) =>
        r.reviewId === review.reviewId ? { ...r, emotions: original } : r
      );
      return { ...prev, reviews: nextReviews };
    });
  }

  setTab("before");
}

  // ---------- UI 하위 컴포넌트 ----------
  function EmotionChips({ emotionsEn }) {
    const koList = (emotionsEn || []).map((en) => enToKo[en] || en);
    const first2 = koList.slice(0, 2);
    const rest = koList.slice(2);
    return (
      <div className="q-emo">
        {first2.map((e) => <span key={e} className="chip">{e}</span>)}
        {rest.length > 0 && (
          <button type="button" className="chip chip-link" onClick={(e) => openPopover(e, rest)}>
            +{rest.length}
          </button>
        )}
      </div>
    );
  }

  function RowBefore({ row, idx }) {
    return (
      <div className="ai-row">
        <div className="q-no">{idx + 1}</div>
        <div>{row.isLearned ? <span className="badge-o">O</span> : <span className="badge-x">X</span>}</div>
        <div className="q-comment">{row.commentText}</div>
        <div><EmotionChips emotionsEn={row.emotions} /></div>
        <div className="q-conf">{typeof row.confidence === "number" ? row.confidence.toFixed(2) : "-"}</div>
        <div className="q-action">
          <button className="iconbtn" title="수정하기" onClick={() => onOpenEdit(row)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 7l4 4" stroke="#334155" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  function RowAfter({ row, idx }) {
    return (
      <div className="ai-row">
        <div className="q-no">{idx + 1}</div>
        <div>{row.isLearned ? <span className="badge-o">O</span> : <span className="badge-x">X</span>}</div>
        <div className="q-comment">{row.commentText}</div>
        <div><EmotionChips emotionsEn={row.emotions} /></div>
        <div className="q-conf">{typeof row.confidence === "number" ? row.confidence.toFixed(2) : "-"}</div>
        <div className="q-action">
          <button className="iconbtn" title="되돌리기" onClick={() => onUndo(row)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 11H4V6" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 11a9 9 0 1 0 2.6-6.45" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const currentList = tab === "before" ? invalid.reviews : valid.reviews;
  const meta = tab === "before" ? (invalid.pageMeta || {}) : (valid.pageMeta || {});

  return (
    <>
      <section className="ai-card">
        {/* 탭 */}
        <div className="seg" role="tablist" aria-label="수정 전/후 전환">
          <div className="seg-track">
            <div className="seg-thumb" style={{ transform: `translateX(${tab === "before" ? 0 : 100}%)` }} />
            <button role="tab" aria-selected={tab === "before"} className="seg-btn" onClick={() => setTab("before")}>수정 전</button>
            <button role="tab" aria-selected={tab === "after"} className="seg-btn" onClick={() => setTab("after")}>수정 후</button>
          </div>
        </div>

        {/* [추가] 검색 바 : 탭 바로 아래, 헤더(ai-head) 위 */}
        <div style={{ display:"flex", gap:8, alignItems:"center", margin:"12px 8px 6px auto", maxWidth:520 }}>
          <input
            className="text-input"
            style={{ flex:1, padding:"8px 10px" }}
            placeholder="댓글 내용 검색"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{
              if (e.key === "Enter") {
                setInvalidPage(0); setValidPage(0);
                setQuery(q.trim());
              }
            }}
          />
          <button
            className="btn btn-ghost"
            onClick={() => { setInvalidPage(0); setValidPage(0); setQuery(q.trim()); }}
          >
            검색
          </button>
          {!!query && (
            <button
              className="btn btn-ghost"
              onClick={() => { setQ(""); setQuery(""); setInvalidPage(0); setValidPage(0); }}
              title="검색 초기화"
              style={{ opacity: .85 }}
            >
              초기화
            </button>
          )}
        </div>

        {/* 헤더 */}
        <div className="ai-head">
          <div>No.</div>
          <div>학습유무</div>
          <div>댓글 내용</div>
          <div>감정 index</div>
          <div>confidence</div>
          <div>{tab === "before" ? "수정하기" : "되돌리기"}</div>
        </div>

        {/* 바디 */}
        <div className="ai-body">
          {loading && <div className="ai-row ai-row-empty" style={{textAlign:"center", color:"#9ca3af", padding:"18px 0"}}>불러오는 중…</div>}
          {!loading && !currentList.length && (
            <div className="ai-row ai-row-empty" style={{textAlign:"center", color:"#9ca3af", padding:"18px 0"}}>데이터가 없습니다.</div>
          )}
          {currentList.map((row, i) =>
            tab === "before" ? (
              <RowBefore key={row.reviewId} row={row} idx={i} />
            ) : (
              <RowAfter key={row.reviewId} row={row} idx={i} />
            )
          )}
        </div>

      {/* [추가] 가운데 숫자 페이지네이션 : 기존 오른쪽 '이전/다음' 그대로 유지 */}
       {(() => {
         const pm = meta || {};
         const totalPages = Math.max(1, Number(pm.totalPages ?? Math.ceil((pm.totalElements||0)/PAGE_SIZE)));
         const cur = Number(pm.page ?? 0) + 1;
         const win = 2; // 좌/우 몇 개 보여줄지
         const start = Math.max(1, cur - win);
         const end   = Math.min(totalPages, cur + win);
         const nums = [];
         for (let n = start; n <= end; n++) nums.push(n);
         return (
           <div style={{ display:"flex", justifyContent:"center", marginTop:12 }}>
             <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
               <button className="btn btn-ghost" disabled={cur===1}
                 onClick={()=>{
                   if (tab==="before"){ setInvalidPage(0); loadInvalid(0); }
                   else { setValidPage(0); loadValid(0); }
                 }}>{'<<'}</button>
               <button className="btn btn-ghost" disabled={cur===1}
                 onClick={()=>{
                   if (tab==="before"){ const p=Math.max(0, cur-2); setInvalidPage(p); loadInvalid(p); }
                   else { const p=Math.max(0, cur-2); setValidPage(p); loadValid(p); }
                 }}>{'<'}</button>
               {start>1 && <span style={{padding:"0 4px"}}>…</span>}
               {nums.map(n=>(
                 <button key={n}
                   className="btn btn-ghost"
                   style={n===cur?{fontWeight:700}:null}
                   onClick={()=>{
                     if (tab==="before"){ setInvalidPage(n-1); loadInvalid(n-1); }
                     else { setValidPage(n-1); loadValid(n-1); }
                   }}
                 >{n}</button>
               ))}
               {end<totalPages && <span style={{padding:"0 4px"}}>…</span>}
               <button className="btn btn-ghost" disabled={cur>=totalPages}
                 onClick={()=>{
                   if (tab==="before"){ const p=Math.min(totalPages-1, cur); setInvalidPage(p); loadInvalid(p); }
                   else { const p=Math.min(totalPages-1, cur); setValidPage(p); loadValid(p); }
                 }}>{'>'}</button>
               <button className="btn btn-ghost" disabled={cur>=totalPages}
                 onClick={()=>{
                   if (tab==="before"){ const p=totalPages-1; setInvalidPage(p); loadInvalid(p); }
                   else { const p=totalPages-1; setValidPage(p); loadValid(p); }
                 }}>{'>>'}</button>
               <span style={{ marginLeft:8, opacity:.7 }}>Page</span>
               <input
                 type="number"
                 min={1}
                 max={totalPages}
                 defaultValue={cur}
                 onKeyDown={(e)=>{
                   if(e.key==='Enter'){
                     const tp = Math.max(1, Math.min(totalPages, Number(e.currentTarget.value||1)));
                     if (tab==="before"){ setInvalidPage(tp-1); loadInvalid(tp-1); }
                     else { setValidPage(tp-1); loadValid(tp-1); }
                   }
                 }}
                 style={{ width:64, padding:"6px 8px" }}
               />
               <span style={{ opacity:.7 }}>of {totalPages}</span>
               <button
                 className="btn btn-ghost"
                 onClick={(e)=>{
                   const input = e.currentTarget.previousSibling?.previousSibling;
                   const tp = Math.max(1, Math.min(totalPages, Number(input?.value||1)));
                   if (tab==="before"){ setInvalidPage(tp-1); loadInvalid(tp-1); }
                   else { setValidPage(tp-1); loadValid(tp-1); }
                 }}
               >이동</button>
             </div>
           </div>
         );
       })()}

        {/* 페이저 */}
      {false && (
        <div 
          className="pager"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,             // 버튼/텍스트 간격
            marginTop: 12,      // 카드와의 간격
            }}
        >
          <button
            className="btn btn-ghost"
            disabled={!meta.hasPrev}
            onClick={() => {
              if (tab === "before") {
                const p = Math.max(0, (invalid.pageMeta?.page || 0) - 1);
                setInvalidPage(p);
                loadInvalid(p);
              } else {
                const p = Math.max(0, (valid.pageMeta?.page || 0) - 1);
                setValidPage(p);
                loadValid(p);
              }
            }}
            >
            이전
          </button>
          <div className="pager-page">페이지 {Number(meta?.page ?? 0) + 1}</div>
          <button
            className="btn btn-ghost"
            disabled={!meta.hasNext}
            onClick={() => {
              if (tab === "before") {
                const p = (invalid.pageMeta?.page || 0) + 1;
                setInvalidPage(p);
                loadInvalid(p);
              } else {
                const p = (valid.pageMeta?.page || 0) + 1;
                setValidPage(p);
                loadValid(p);
              }
            }}
          >
            다음
          </button>
        </div>
      )}
      </section>

      {/* 감정 선택 모달 */}
      <EmotionPicker
        open={modalOpen}
        onClose={onCloseEdit}
        onReset={resetSelection}
        onSave={onSave}
        prevEmotions={prevEmotions}
        selected={selected}
        onToggle={toggleEmotion}
        positive={POSITIVE_KO}
        negative={NEGATIVE_KO}
        ambiguous={AMBIGUOUS_KO}
      />

      {/* +N 팝오버 */}
      {pop && (
        <div className="popover" style={{ left: pop.x, top: pop.y }} onMouseLeave={closePopover}>
          {pop.items.map((it) => (
            <div key={it} className="popover-item">{it}</div>
          ))}
        </div>
      )}
    </>
  );
}
