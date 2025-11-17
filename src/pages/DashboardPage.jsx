// --- React 및 라이브러리 임포트 ---
import { useMemo, useState, useEffect } from "react";
// 여기는 더미데이터를 가져와서 적용
import { KPI, BAR_DATA, DAILY_API_DETAILS, API_LIST } from "../Data/data.jsx";

// [추가] 메트릭 API 임포트 (호출횟수 / 지연시간)
import { fetchApiCount, fetchApiLatency } from "../api/metricsApi.js";
import { fetchDashboard } from "../api/userApi"; // KPI 실제 값
import { fetchRetrainQueue } from "../api/retrainApi.js"; // 대기열 api

// 한국 시간(Asia/Seoul)으로 오늘 요일 인덱스: 월=0 … 일=6
const DAYS_KO = ['월','화','수','목','금','토','일'];
function getKstDayIndex(date = new Date()) {
  const w = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'short'
  }).format(date); // '월' '화' …
  return DAYS_KO.indexOf(w.replace('요일', ''));
}

// KST yyyy-mm-dd 문자열 만들기 (로컬스토리지 키로 사용)
function getKstDateStr(date = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return f.format(date); // 예: 2025-11-11
}

// 최근 7일 API 합계 히스토리 로드/세이브 (로컬스토리지)
function loadApiHistory() {
  try { return JSON.parse(localStorage.getItem('apiCountHistory') || '[]'); }
  catch { return []; }
}
function saveApiHistory(arr) {
  try { localStorage.setItem('apiCountHistory', JSON.stringify(arr)); } catch {}
}
function loadApiBreakdown(dateStr) {
  try { return JSON.parse(localStorage.getItem(`apiBreakdown:${dateStr}`) || '[]'); }
  catch { return []; }
}
function saveApiBreakdown(dateStr, rows) {
  try { localStorage.setItem(`apiBreakdown:${dateStr}`, JSON.stringify(rows || [])); } catch {}
}

// --- 감정 라벨 한글 매핑 ---
const EMO_KO = {
  approval: "호의/승인",
  disapproval: "반대/거부",
  admiration: "감탄",
  realization: "깨달음",
  interest_curiosity: "관심/기대",
  joy_happiness: "기쁨",
  gratitude: "감사",
  caring_love: "애정",
  pride: "자부심",
  relief: "안도",
  amusement: "재미",
  optimism: "낙관",
  contentment: "만족",
  surprise: "놀람",
  nostalgia: "향수",
  trust: "신뢰",

  sadness_grief: "슬픔/비애",
  anger_annoyance: "분노/짜증",
  fear_nervousness: "두려움/긴장",
  embarrassment: "당황/민망",
  disappointment: "실망",
  guilt: "죄책감",
  shame: "수치심",
  boredom: "지루함",
  loneliness: "외로움",
  envy: "질투/시기",
  confusion: "혼란",
};

// 안전 변환(알 수 없는 라벨은 원문 그대로)
function emoToKo(e) {
  if (!e || typeof e !== "string") return e;
  const key = e.trim();
  return EMO_KO[key] ?? EMO_KO[key.toLowerCase()] ?? key;
}

// 배열을 fromIndex 위치의 항목이 toIndex 위치로 오도록 회전
function rotateToIndex(arr, fromIndex, toIndex) {
  const n = arr.length || 0;
  if (!n) return arr;
  const shift = ((toIndex - fromIndex) % n + n) % n; // 0~n-1
  return arr.map((_, i) => arr[(i - shift + n) % n]);
}

// --- 커스텀 Hook: 팝오버 관리 ---
function usePopover() {
  const [pop, setPop] = useState(null);
  const open = (ev, items) => {
    const r = ev.currentTarget.getBoundingClientRect();
    setPop({ x: r.left + r.width / 2, y: r.top - 8, items });
  };
  const close = () => setPop(null);
  return { pop, open, close };
}

// [추가] 백엔드가 주는 "{method=GET, uri=/path}" 문자열을 보기 좋게 파싱
function parseApiPath(raw) {
  if (!raw) return { method: "", uri: "-", label: "-" };
  const m = raw.match(/method=([A-Z]+)/);
  const u = raw.match(/uri=([^}]+)\}/);
  const method = m?.[1] ?? "";
  const uri = u?.[1] ?? raw.replace(/[{}]/g, "");
  return { method, uri, label: uri }; // 이름 칸엔 uri만 노출
}

// 값 배열로 SVG 스파크라인 path 생성(외부 라이브러리 없이)
function makeSparkline(values = [], { width = 240, height = 40, pad = 2 } = {}) {
  const n = values.length;
  if (!n) return { d: "", w: width, h: height };
  const maxV = Math.max(...values, 1);
  const stepX = n > 1 ? (width - pad * 2) / (n - 1) : 0;
  const y = v => (height - pad) - (v / maxV) * (height - pad * 2);
  let d = `M ${pad} ${y(values[0])}`;
  for (let i = 1; i < n; i++) d += ` L ${pad + stepX * i} ${y(values[i])}`;
  return { d, w: width, h: height };
}

// --- 메인 컴포넌트: 대시보드 페이지 ---
export default function DashboardPage({
  onGotoRetrain,
  queueItems,
  setPageTitle,
  onGotoUserManagement,
  refreshKey
}) {
  // --- 1. 상태 관리 ---
  useEffect(() => { setPageTitle("대시보드"); }, [setPageTitle]);

  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const { pop, open, close } = usePopover();
  const [apiHistory, setApiHistory] = useState(loadApiHistory());

  useEffect(() => {
    setSelectedDay(null);
    setHasSelection(false);   // ← 처음엔 감추기
    setSelectedBarIdx(null);
    setDayApis([]);
    setDayTotal(null);
  }, [refreshKey]);
  useEffect(() => { setHasSelection(false); }, [refreshKey]);
  useEffect(() => { setDayApis([]); setDayTotal(null); }, [refreshKey]);

  // ✅ 대시보드 하단 요약: 실제 'AI 재학습(수정 전)' 대기열 3건
  const [retrainItems, setRetrainItems] = useState([]);
  const [retrainTotal, setRetrainTotal] = useState(0);
  useEffect(() => {
    (async () => {
      const { items, total } = await fetchRetrainQueue({ page: 0, size: 3 });
      setRetrainItems(Array.isArray(items) ? items : []);
      setRetrainTotal(Number.isFinite(total) ? total : (items?.length ?? 0));
    })();
  }, [refreshKey]);


  // ✅ KPI: 백엔드 값 (전체/정지/차단)
  const [kpiTotalUsers, setKpiTotalUsers] = useState(KPI.totalUsers);
  const [kpiSuspended, setKpiSuspended]   = useState(KPI.suspended); // 정지
  const [kpiBanned, setKpiBanned]         = useState(KPI.badUsers);  // 차단
  useEffect(() => {
    (async () => {
      const res = await fetchDashboard();
      // 응답: {result:{ totalUser, maliciousUser, bannedUser }}
      const s = res?.result || {};
      if (typeof s.totalUser === "number")     setKpiTotalUsers(s.totalUser);
      if (typeof s.maliciousUser === "number") setKpiSuspended(s.maliciousUser);
      if (typeof s.bannedUser === "number")    setKpiBanned(s.bannedUser);
    })();
  }, [refreshKey]);

  // ---------- [추가] 메트릭 상태 & 로딩 ----------
  const [apiCounts, setApiCounts] = useState([]);
  const [apiLatencies, setApiLatencies] = useState([]);

  // [추가] 막대그래프에서 선택된 인덱스
  const [selectedBarIdx, setSelectedBarIdx] = useState(null);
  const [hasSelection, setHasSelection] = useState(false);
  // 선택한 날의 API 목록/합계 상태
  const [dayApis, setDayApis] = useState([]);       // [{name, count}, ...]
  const [dayTotal, setDayTotal] = useState(null);   // 선택한 날의 합계(서버 기준)
  const [dayLoading, setDayLoading] = useState(false);

  // ✅ 백엔드 호출 횟수 총합 (없으면 0)  <-- 이게 먼저 있어야 합니다
  const totalApiCalls = useMemo(
    () => (apiCounts || []).reduce((sum, it) => sum + Number(it.count || 0), 0),
    [apiCounts]
  );

    // 오늘(KST) 합계를 히스토리에 반영 (최근 7일만 보존)
  useEffect(() => {
    const today = getKstDateStr(); // yyyy-mm-dd (KST)
    if (totalApiCalls == null) return; // 아직 계산 전이면 패스

    const hist = loadApiHistory();
    const others = hist.filter(h => h.date !== today);
    const next = [...others, { date: today, total: totalApiCalls }]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // 최근 7일 유지
    saveApiHistory(next);
    setApiHistory(next);
  }, [totalApiCalls, refreshKey]);

  useEffect(() => {
    (async () => {
      const [{ result: counts = [] }, { result: lats = [] }] = await Promise.all([
        fetchApiCount(),
        fetchApiLatency(),
      ]);
      setApiCounts(Array.isArray(counts) ? counts : []);
      setApiLatencies(Array.isArray(lats) ? lats : []);
      const today = getKstDateStr(); // ex) 2025-11-12
      const todayRows = (Array.isArray(counts) ? counts : [])
        .map((it) => ({
          name: parseApiPath(it.apiPath).label,
          count: Number(it.count || 0),
        }))
        .sort((a, b) => b.count - a.count);
      saveApiBreakdown(today, todayRows);
    })();
  }, [refreshKey]);

  // ---------- (기존) 우측 표용 더미 → 유지 ----------
  const apiSortedDummy = useMemo(() => {
    const arr = [...API_LIST].sort((a, b) => b.call - a.call);
    return arr.map((it, idx) => ({ ...it, rank: idx + 1 }));
  }, []);

  // ✅ 더미 BAR_DATA의 최대 막대 높이(단위)를 기준으로 사용
  const BASE_BAR_UNITS = useMemo(
    () => Math.max(...BAR_DATA.map(b => Number(b.calls) || 0), 1),
    []
  );

  // (기존) 좌측 그래프에서 막대 클릭 시 상세표시용
  const sortedApiDetails = useMemo(() => {
    if (!selectedDay) return [];
    const details = DAILY_API_DETAILS[selectedDay.day] || [];
    const sorted = [...details].sort((a, b) => {
      if (b.calls !== a.calls) return b.calls - a.calls;
      return a.name.localeCompare(b.name);
    });
    return sorted.map(api => ({
      ...api,
      displayName: api.name.length > 5 ? `${api.name.substring(0, 5)}...` : api.name,
    }));
  }, [selectedDay]);

  const queueLeft = retrainTotal || retrainItems.length;

  // ---------- [핵심] Swagger 'api-count'를 좌측 리스트에 바인딩 ----------
  const topCalledFromServer = useMemo(() => {
    return [...(apiCounts || [])]
      .map((it) => ({
        name: parseApiPath(it.apiPath).label,
        count: Number(it.count || 0),
      }))
      .sort((a, b) => b.count - a.count);
  }, [apiCounts]);

  // ✅ 그래프는 “오늘 합계”만 D1에 표시(백엔드에 일자별 API가 없으므로)
  const barDataFromServer = useMemo(() => {
    if (totalApiCalls <= 0) return [];
    // D1만 오늘 합계, 나머지는 0 (디자인 라벨 D1~D7 유지)
    const d1Height = BASE_BAR_UNITS; // 오늘이 최대가 되도록(상대적 스케일 유지)
    const bars = Array.from({ length: 7 }, (_, i) => ({
      day: `D${i + 1}`,
      calls: i === 0 ? d1Height : 0,
      _rawCount: i === 0 ? totalApiCalls : 0,   // ✅ 실제 숫자(툴팁/상세용)
    }));
    return bars;
  }, [totalApiCalls, BASE_BAR_UNITS]);

  // ---------- 우측 표용: '지연시간(ms) 1개 칼럼' ----------
  const apiLatencyRows = useMemo(() => {
    if (!apiLatencies?.length) return [];
    // latency(초) → ms 변환 후 오름차순(빠른 API 상단)
    return apiLatencies
      .map((it, idx) => {
        const { label } = parseApiPath(it.apiPath);
        const ms = Math.max(0, Number(it.latency || 0) * 1000);
        return { id: idx + 1, name: label, latencyMs: Math.round(ms) };
      })
      .sort((a, b) => a.latencyMs - b.latencyMs)
      .map((it, idx) => ({ ...it, rank: idx + 1 })); // 순위 부여
  }, [apiLatencies]);

  const latencyValues = (apiLatencyRows.length ? apiLatencyRows : []).map(r => r.latencyMs);
  const avgLatency = latencyValues.length
    ? Math.round(latencyValues.reduce((a,b)=>a+b,0) / latencyValues.length)
    : 0;
  const p95Latency = latencyValues.length
    ? latencyValues.slice().sort((a,b)=>a-b)[Math.max(0, Math.ceil(latencyValues.length*0.95)-1)]
    : 0;
  const maxLatency = latencyValues.length ? Math.max(...latencyValues) : 0;
  const spark = makeSparkline(latencyValues);

  // 호출 수 TOP 3 (좌측 리스트의 서버데이터 재활용)
  // 호출 수 TOP 3 (선택된 날짜가 있으면 그 날의 리스트에서, 아니면 오늘 기준)
  const top3Source = selectedDay && dayApis.length ? dayApis : topCalledFromServer;
  const top3Calls  = top3Source.slice(0, 3);
  const topMax     = top3Calls.length ? Math.max(...top3Calls.map(x => x.count)) : 1;


  // KST 라벨 & 오늘인덱스
// 4-1) 최근 7일(6일 전 ~ 오늘) 히스토리 기반 막대 만들기
const barsFromHistory = useMemo(() => {
  const map = new Map((apiHistory || []).map(h => [h.date, Number(h.total || 0)]));

  // 과거→오늘 순서(길이 7)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // i=0: 6일 전, i=6: 오늘
    const dateStr = getKstDateStr(d);
    const count = map.get(dateStr) || 0;
    return { dateStr, count };
  });

  // 막대 스케일: 0도 보일 수 있도록 최대값 기준으로 BASE_BAR_UNITS에 맞춤
  const maxCount = Math.max(1, ...days.map(d => d.count));
  return days.map((d, idx) => ({
    day: `D${idx + 1}`,                               // 내부 키
    calls: Math.round((d.count / maxCount) * BASE_BAR_UNITS),
    _rawCount: d.count,                               // 툴팁/상세용 실제 숫자
    _date: d.dateStr,
  }));
}, [apiHistory, BASE_BAR_UNITS]);

// 4-2) 라벨: 한국 요일 / 오늘 인덱스
const LABELS = DAYS_KO;
const todayIdx = getKstDayIndex();

// 4-3) 우선순위: 히스토리(7일) → 서버합계(D1=오늘만) → 더미
const rawBars = barsFromHistory.length
  ? barsFromHistory
  : (barDataFromServer.length ? barDataFromServer : BAR_DATA);

// 4-4) rawBars에서 "오늘"이 들어있는 위치를 정의
// - 히스토리: 배열 마지막(인덱스 6)이 오늘
// - 서버합계(D1만): 인덱스 0이 오늘
const todayPos = (rawBars === barsFromHistory) ? 6 : 0;

// 4-5) 오늘 칼럼이 화면상 오늘 요일 칸(todayIdx)에 오도록 회전
const rotationShift = ((todayIdx - todayPos + 7) % 7);
const visibleBars = rotateToIndex(rawBars, todayPos, todayIdx);
const usingHistoryBars = barsFromHistory.length > 0;                    // 최근 7일 히스토리 막대
const usingServerBars  = !usingHistoryBars && barDataFromServer.length > 0; // '오늘 합계(D1)' 막대

// 막대 클릭 시 사용할 '원본 인덱스/날짜'를 얻는 헬퍼
function getSourceMeta(i) {
  const originalIdx = (i - rotationShift + 7) % 7;       // 회전 전 인덱스로 복원
  const src = rawBars[originalIdx];                      // 원본 막대 객체
  return {
    originalIdx,
    date: src?._date || null,                            // barsFromHistory면 날짜가 들어있음
    fromHistory: rawBars === barsFromHistory,
  };
}

  // --- 3. UI 렌더링 ---
  return (
    <>
      {/* KPI 카드 섹션 (그대로) */}
      <section className="kpi-grid">
        <div className="kpi kpi-outline">
          <div className="kpi-label">총 유저 수</div>
          <div className="kpi-value">{kpiTotalUsers}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">오늘 가입자 수</div>
          <div className="kpi-value">{KPI.todaySignups}</div>
        </div>
        <div className="kpi kpi-clickable" onClick={() => onGotoUserManagement('BLOCKED')}>
          <div className="kpi-label">차단 유저 수</div>
          <div className="kpi-value">{kpiBanned}</div>
        </div>
        <div className="kpi kpi-clickable" onClick={() => onGotoUserManagement('SUSPENDED')}>
          <div className="kpi-label">정지 유저 수</div>
          <div className="kpi-value">{kpiSuspended}</div>
        </div>
      </section>

      {/* API 현황 섹션 (2단 그리드) */}
      <section className="grid-2">
        {/* 좌측 카드: 총 API 호출 횟수 (디자인 유지) */}
        <div className="card">
        <div className="card-title">총 API 호출 횟수</div>

        <div className="api-call-card-content">
            {/* 막대 그래프 - 기존 더미 유지 */}
            <div
               className="bar-chart-container"
               data-total={ totalApiCalls || BAR_DATA.reduce((s,b)=> s + Number(b.calls||0), 0) }
            >
              <div className="bar-wrap">
                {visibleBars.map((bar, i) => {
                  const isToday = i === todayIdx;
                  // 클릭 시 원본(회전 전) 인덱스로 복원 (서버 상세용)
                  const originalIdx = (i - rotationShift + 7) % 7;

                  return (
                    <div
                      key={`${bar.day}-${i}`}
                      className={`bar-col ${isToday ? 'bar-today' : ''}`}  // 오늘 칼럼 강조
                      onMouseEnter={() => setHoveredBar(bar)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={async () => {
                        setHasSelection(true);
                        setSelectedBarIdx(i);
                        const date = bar._date || null; // barsFromHistory면 날짜가 들어있음
                        setSelectedDay({ ...bar, _srcDate: date, _fromHistory: !!date });

                        if (date) {
                          // 로컬 스냅샷에서 해당 날짜 집계 로드
                          const rows = loadApiBreakdown(date);
                          setDayApis(rows);
                          setDayTotal(rows.reduce((s, r) => s + (r.count || 0), 0));
                        } else {
                          // D1(오늘만 있는 서버합계 모드) — 그냥 현재 apiCounts 사용
                          const rows = (apiCounts || [])
                            .map((it) => ({
                              name: parseApiPath(it.apiPath).label,
                              count: Number(it.count || 0),
                            }))
                            .sort((a, b) => b.count - a.count);

                          setDayApis(rows);
                          setDayTotal(rows.reduce((s, r) => s + (r.count || 0), 0));
                        }
                      }}


                      title={`${LABELS[i]}요일`} // 힌트
                    >
                      {hoveredBar?.day === bar.day && (
                        <div className="bar-tip">{bar._rawCount ?? bar.calls}</div>
                      )}
                      <div className="bar" style={{ height: `${bar.calls * 18}px` }} />
                      <div className={`bar-label ${isToday ? 'xlabel-today' : ''}`}>
                        {LABELS[i]} {/* ← 'D1' 대신 '월' 등 요일 출력 */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!hasSelection ? (
              <div className="api-details-panel">
                <div className="details-header">
                  <span className="details-title">막대를 선택해 주세요</span>
                </div>
                <div className="details-subheader">호출된 API</div>
                {/* ✨ placeholder일 때 패널 안 스크롤 완전 차단 */}
                <div
                  className="details-list placeholder no-wheel"
                  onWheel={(e) => e.preventDefault()}
                  onTouchMove={(e) => e.preventDefault()}
                >
                  <div className="no-results">
                    왼쪽의 요일 막대를 클릭하면, 해당 날짜의 총 호출횟수와 엔드포인트별 집계를 보여드릴게요.
                  </div>
                </div>
              </div>
            ) : usingServerBars && selectedBarIdx !== null ? (
              // '오늘합계(D1)' 막대를 클릭했을 때: 오늘 총합 + 오늘 Top
              <div className="api-details-panel">
                <div className="details-header">
                  <span className="details-title">
                    총 호출횟수: {barDataFromServer[selectedBarIdx]?._rawCount ?? 0}
                  </span>
                </div>
                <div className="details-subheader">호출된 API</div>
                <div className="details-list">
                  {topCalledFromServer.slice(0, 5).map((r, idx) => (
                    <div key={idx} className="details-item">
                      <span title={r.name}>{r.name.length > 5 ? `${r.name.slice(0,5)}...` : r.name}</span>
                      <span>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDay ? (
              <div className="api-details-panel">
                <div className="details-header">
                  <span className="details-title">
                    총 호출횟수: {
                      // 서버가 돌려준 dayTotal이 있으면 그걸, 없으면 막대에 담긴 합계 사용
                      (dayTotal ?? selectedDay._rawCount ?? selectedDay.calls ?? 0)
                    }
                  </span>
                  {selectedDay._srcDate && (
                    <span className="pill-soft" style={{ marginLeft: 8 }}>
                      {selectedDay._srcDate} 기준
                    </span>
                  )}
                </div>

                <div className="details-subheader">호출된 API (해당 날짜 전체)</div>
                <div className="details-list">
                  {dayLoading ? (
                    <div className="no-results">불러오는 중…</div>
                  ) : dayApis.length === 0 ? (
                    <div className="no-results">
                      선택한 날짜의 엔드포인트별 집계가 없습니다.
                    </div>
                  ) : (
                    dayApis.map((r, idx) => (
                      <div key={idx} className="details-item">
                        <span title={r.name}>{r.name.length > 24 ? `${r.name.slice(0,24)}…` : r.name}</span>
                        <span>{r.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (

              // 기본 리스트 모드: 오늘 총합 + 오늘 Top
              // 방어코드: 이 분기는 거의 안 옴. 그래도 안내만.
              <div className="api-details-panel">
                <div className="details-header">
                  <span className="details-title">막대를 선택해 주세요</span>
                </div>
                <div className="details-list placeholder">
                  <div className="no-results">왼쪽의 막대를 먼저 선택하세요.</div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 우측 카드: '지연시간' 단일 칼럼 (헤더/행만 최소 변경) */}
        <div className="card">
          <div className="card-title">API 지연시간</div>
          <div className="api-head">
            <div className="text-center">순위</div>
            <div>API 이름</div>
            <div className="text-right api-header-adjust">지연시간</div>
            {/* 마지막 칼럼은 자리를 유지하기 위해 투명 처리(레이아웃 변화 방지) */}
            <div className="text-right api-header-adjust" style={{ opacity: 0 }}>.</div>
          </div>
          <div className="api-body">
            {(apiLatencyRows.length ? apiLatencyRows : apiSortedDummy).map((row) => (
              <div key={row.id} className="api-row">
                <div className="text-center"><span className="rank-pill">{row.rank}</span></div>
                <div style={{ fontWeight: 800 }}>{row.name}</div>
                <div className="lat text-right">{row.latencyMs} ms</div>
                <div className="text-right" style={{ fontWeight: 700, opacity: 0 }}>.</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ───────────────── 미니 위젯 (프론트 전용) ───────────────── */}
      <section className="mini-grid">
        {/* 1) 호출 TOP 3 */}
        <div className="mini-card">
          <div className="mini-title">호출 TOP 3</div>
          <div className="mini-list">
            {top3Calls.length === 0 ? (
              <div className="no-results">데이터가 없습니다.</div>
            ) : (
              top3Calls.map((r, i) => (
                <div key={i} className="mini-row">
                  <div className="mini-name" title={r.name}>{r.name}</div>
                  <div className="mini-count">{r.count}</div>
                  <div className="mini-meter" style={{ gridColumn: "1 / -1" }}>
                    <span style={{ width: `${(r.count/topMax)*100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2) 지연시간 요약 + 스파크라인 */}
        <div className="mini-card">
          <div className="mini-title">지연시간 요약</div>
          <div className="mini-kpis">
            <span className="mini-badge">평균 {avgLatency} ms</span>
            <span className="mini-badge">P95 {p95Latency} ms</span>
            <span className="mini-badge">최대 {maxLatency} ms</span>
            <span className="mini-badge">엔드포인트 {latencyValues.length}개</span>
          </div>
          <svg width={spark.w} height={spark.h} viewBox={`0 0 ${spark.w} ${spark.h}`} role="img" aria-label="latency sparkline">
            {/* 배경 가이드(연한색) – 시각적 보조용 */}
            <path d={makeSparkline(latencyValues.map(()=>maxLatency), { width:spark.w, height:spark.h }).d} className="mini-spark-bg" />
            {/* 실제 데이터 라인 */}
            <path d={spark.d} className="mini-spark" />
          </svg>
        </div>
      </section>


      {/* AI 재학습 검토 대기열 (그대로) */}
      <section className="card compact">
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

        {(retrainItems || []).slice(0,2).map((r, idx) => {
          const emos = Array.isArray(r.emotions) ? r.emotions : [];
          const first2 = emos.slice(0, 2).map(emoToKo);
          const rest = emos.slice(2).map(emoToKo); // 팝오버에서도 한글로
          return (
            <div key={r.id} className="queue-row compact">
              <div className="q-no">{idx + 1}</div>
              <div className="q-comment">
                {(r.comment || r.text || "").length > 10
                   ? (r.comment || r.text).slice(0, 10) + " ..."
                   : (r.comment || r.text || "-")}
              </div>
              <div className="q-conf text-center">
                {Number.isFinite(r.confidence) ? Number(r.confidence).toFixed(2) : "-"}
              </div>
              <div className="q-emo">
                {first2.map((e) => (<span key={e} className="chip">{e}</span>))}
                {!!rest.length && (
                  <button type="button" className="chip chip-link" onClick={(ev) => open(ev, rest)}>
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

      {/* 팝오버 */}
      {pop && (
        <div className="popover" style={{ left: pop.x, top: pop.y }} onMouseLeave={close}>
          {pop.items.map((it) => (<div key={it} className="popover-item">{it}</div>))}
        </div>
      )}
    </>
  );
}
