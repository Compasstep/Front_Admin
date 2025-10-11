// --- React 및 라이브러리 임포트 ---
import { useMemo, useState, useEffect } from "react";

// --- 더미 데이터 ---

// [데이터] KPI 카드 영역에 표시될 데이터.
const KPI = {
  totalUsers: 100,
  todaySignups: 5,
  badUsers: 3,
  suspended: 3,
};

// [데이터] '총 API 호출 횟수' 막대그래프의 일자별 데이터.
const BAR_DATA = [
  { day: 'D1', calls: 3 }, { day: 'D2', calls: 5 }, { day: 'D3', calls: 7 },
  { day: 'D4', calls: 6 }, { day: 'D5', calls: 8 }, { day: 'D6', calls: 9 },
  { day: 'D7', calls: 5 },
];

// [데이터] 막대그래프 클릭 시 표시될 일자별 상세 API 호출 내역.
const DAILY_API_DETAILS = {
  D1: [
    { name: "Lyrics Emotion Analyzer", calls: 2 },
    { name: "Vector Updater", calls: 1 },
  ],
  D2: [
    { name: "Admin Invite Email", calls: 2 },
    { name: "OpenAI Chat Completions", calls: 1 },
    { name: "Share Link Presigner", calls: 1 },
    { name: "S3 SignedURL Maker", calls: 1 },
  ],
  D3: [
    { name: "OpenAI Chat Completions", calls: 3 },
    { name: "Fine-tune Queue Writer", calls: 2 },
    { name: "WordCloud Generator", calls: 1 },
    { name: "Vector Updater", calls: 1 },
  ],
  D4: [
    { name: "Spotify Genre Ranker", calls: 3 },
    { name: "Lyrics Emotion Analyzer", calls: 2 },
    { name: "Batch Cleaner", calls: 1 },
  ],
  D5: [
    { name: "Share Link Presigner", calls: 4 },
    { name: "S3 SignedURL Maker", calls: 2 },
    { name: "Admin Invite Email", calls: 1 },
    { name: "Daily Snapshotter", calls: 1 },
  ],
  D6: [
    { name: "OpenAI Chat Completions", calls: 3 },
    { name: "Vector Updater", calls: 2 },
    { name: "Lyrics Emotion Analyzer", calls: 2 },
    { name: "WordCloud Generator", calls: 1 },
    { name: "Share Link Presigner", calls: 1 },
  ],
  D7: [
    { name: "Fine-tune Queue Writer", calls: 2 },
    { name: "Spotify Genre Ranker", calls: 2 },
    { name: "Keyword Stats Aggregator", calls: 1 },
  ],
};

// [데이터] 'API 호출 시간' 목록에 표시될 데이터.
const API_LIST = Array.from({ length: 15 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    name: [
      "WordCloud Generator", "Share Link Presigner", "Fine-tune Queue Writer",
      "Spotify Genre Ranker", "OpenAI Chat Completions", "Lyrics Emotion Analyzer",
      "Admin Invite Email", "Sentiment Classifier", "Queue Dashboard Pusher",
      "Keyword Stats Aggregator", "Audio Preview Preset", "S3 SignedURL Maker",
      "Vector Updater", "Batch Cleaner", "Daily Snapshotter",
    ][i],
    call: 100 + (i * 11 % 68),
    resp: 40 + (i * 17 % 360),
  };
});

// --- 커스텀 Hook: 팝오버 관리 ---
// AI 재학습 요약 목록에서 감정 더보기를 위한 팝오버의 상태와 동작을 관리함.
function usePopover() {
  const [pop, setPop] = useState(null);
  const open = (ev, items) => {
    const r = ev.currentTarget.getBoundingClientRect();
    setPop({ x: r.left + r.width / 2, y: r.top - 8, items });
  };
  const close = () => setPop(null);
  return { pop, open, close };
}

// --- 메인 컴포넌트: 대시보드 페이지 ---
export default function DashboardPage({ onGotoRetrain, queueItems, setPageTitle, onGotoUserManagement, refreshKey }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  // 페이지 로드 시 상단 제목을 '대시보드'로 설정함.
  useEffect(() => {
    setPageTitle("대시보드");
  }, [setPageTitle]);

  const [hoveredBar, setHoveredBar] = useState(null); // API 호출 그래프에서 마우스가 올라간 막대 정보.
  const [selectedDay, setSelectedDay] = useState(null); // API 호출 그래프에서 클릭으로 선택된 막대 정보.
  const { pop, open, close } = usePopover(); // 팝오버 상태 및 제어 함수.

  // [상태 초기화] 새로고침 신호(refreshKey)가 오면 선택된 막대 상태를 초기화함.
  useEffect(() => {
    setSelectedDay(null);
  }, [refreshKey]);

  // --- 2. 데이터 처리 (Data Processing) ---

  // 'API 호출 시간' 목록을 API 호출 시간(call) 기준으로 내림차순 정렬함.
  const apiSorted = useMemo(() => {
    const arr = [...API_LIST].sort((a, b) => b.call - a.call);
    return arr.map((it, idx) => ({ ...it, rank: idx + 1 }));
  }, []);

  // 선택된 날짜(selectedDay)의 상세 API 목록을 정렬하고, 긴 이름은 축약 처리함.
  const sortedApiDetails = useMemo(() => {
    // 선택된 날짜가 없으면 빈 배열을 반환함.
    if (!selectedDay) return [];
    
    // 해당 날짜의 상세 데이터를 가져옴.
    const details = DAILY_API_DETAILS[selectedDay.day] || [];
    
    // 1. 호출 횟수(내림차순), 2. 이름(오름차순)으로 정렬함.
    const sorted = [...details].sort((a, b) => {
      if (b.calls !== a.calls) {
        return b.calls - a.calls;
      }
      return a.name.localeCompare(b.name);
    });

    // 화면 표시용 이름(displayName)을 추가함 (5자 초과 시 '...' 처리).
    return sorted.map(api => ({
      ...api,
      displayName: api.name.length > 5 ? `${api.name.substring(0, 5)}...` : api.name,
    }));
  }, [selectedDay]);

  // AI 재학습 검토 대기열의 총 개수를 계산함.
  const queueLeft = queueItems.length;

  // --- 3. UI 렌더링 (JSX) ---
  return (
    <>
      {/* KPI 카드 섹션 */}
      <section className="kpi-grid">
        <div className="kpi kpi-outline">
          <div className="kpi-label">총 유저 수</div>
          <div className="kpi-value">{KPI.totalUsers}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">오늘 가입자 수</div>
          <div className="kpi-value">{KPI.todaySignups}</div>
        </div>
        <div className="kpi kpi-clickable" onClick={() => onGotoUserManagement('BLOCKED')}>
          <div className="kpi-label">차단 유저 수</div>
          <div className="kpi-value">{KPI.badUsers}</div>
        </div>
        <div className="kpi kpi-clickable" onClick={() => onGotoUserManagement('SUSPENDED')}>
          <div className="kpi-label">정지 유저 수</div>
          <div className="kpi-value">{KPI.suspended}</div>
        </div>
      </section>

      {/* API 현황 섹션 (2단 그리드) */}
      <section className="grid-2">
        {/* 좌측 카드: 총 API 호출 횟수 */}
        <div className="card">
          <div className="card-title">총 API 호출 횟수</div>
          <div className="api-call-card-content">
            {/* 막대 그래프 */}
            <div className="bar-chart-container">
              <div className="bar-wrap">
                {BAR_DATA.map((bar, i) => (
                  <div
                    key={bar.day}
                    className="bar-col"
                    onMouseEnter={() => setHoveredBar(bar)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={() => setSelectedDay(bar)}
                  >
                    {hoveredBar?.day === bar.day && <div className="bar-tip">{bar.calls}</div>}
                    <div className="bar" style={{ height: `${bar.calls * 18}px` }} />
                    <div className="bar-label">{bar.day}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* 상세 정보 패널 (막대 클릭 시 표시됨) */}
            {selectedDay && (
              <div className="api-details-panel">
                <div className="details-header">
                  <span className="details-title">총 호출횟수: {selectedDay.calls}</span>
                </div>
                <div className="details-subheader">호출된 API</div>
                <div className="details-list">
                  {sortedApiDetails.map((api, index) => (
                    <div key={index} className="details-item">
                      <span title={api.name}>{api.displayName}</span>
                      <span>{api.calls}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측 카드: API 호출 시간 */}
        <div className="card">
          <div className="card-title">API 호출 시간</div>
          <div className="api-head">
            <div className="text-center">순위</div>
            <div>API 이름</div>
            <div className="text-right api-header-adjust">호출 시간</div>
            <div className="text-right api-header-adjust">응답 시간</div>
          </div>
          <div className="api-body">
            {apiSorted.map((row) => (
              <div key={row.id} className="api-row">
                <div className="text-center"><span className="rank-pill">{row.rank}</span></div>
                <div style={{ fontWeight: 800 }}>{row.name}</div>
                <div className="lat text-right">{row.call} ms</div>
                <div className="text-right" style={{ fontWeight: 700 }}>{row.resp} ms</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI 재학습 검토 대기열 요약 섹션 */}
      <section className="card">
        <div className="card-title large-title">AI 재학습 검토 대기열 (요약)</div>
        <div style={{ marginBottom: 8, fontWeight: 800, color: "#64748B" }}>
          검토 대상 : {queueLeft}개
        </div>

        <div className="queue-head">
          <div>No.</div>
          <div>댓글내용</div>
          <div className="text-center">confidence</div>
          <div>감정 index</div>
          <div className="text-center">자세히</div>
        </div>

        {queueItems.slice(0, 3).map((r, idx) => {
          const first2 = r.emotions.slice(0, 2);
          const rest = r.emotions.slice(2);
          return (
            <div key={r.id} className="queue-row">
              <div className="q-no">{idx + 1}</div>
              <div className="q-comment">
                {r.comment.length > 10 ? r.comment.slice(0, 10) + " ..." : r.comment}
              </div>
              <div className="q-conf text-center">{r.confidence.toFixed(2)}</div>
              <div className="q-emo">
                {first2.map((e) => (
                  <span key={e} className="chip">{e}</span>
                ))}
                {!!rest.length && (
                  <button
                    type="button"
                    className="chip chip-link"
                    onClick={(ev) => open(ev, rest)}
                  >
                    +{rest.length}
                  </button>
                )}
              </div>
              <div className="q-action">
                <button className="btn btn-small" onClick={onGotoRetrain}>보기</button>
              </div>
            </div>
          );
        })}
      </section>

      {/* 팝오버 (필요시 렌더링) */}
      {pop && (
        <div
          className="popover"
          style={{ left: pop.x, top: pop.y }}
          onMouseLeave={close}
        >
          {pop.items.map((it) => (
            <div key={it} className="popover-item">{it}</div>
          ))}
        </div>
      )}
    </>
  );
}