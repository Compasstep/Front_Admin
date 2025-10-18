// -------------------- App.jsx에서 사용되는 더미데이터 --------------------

// [데이터] 관리자 계정의 초기 데이터를 생성함.
export const createDummyAdmins = () => [
    { id: 'compasstep', password: 'compasstep', role: 'root', temp: false, nickname: '루트 관리자' },
    { id: 'choisw0404@naver.com', password: '1234', role: 'general', temp: true, nickname: '최성원' },
    { id: 'xzv01299@gmail.com', password: 'password1', role: 'general', temp: false, nickname: '최성원A' },
    { id: 'open_gg@naver.com', password: 'password2', role: 'general', temp: false, nickname: '최성원B' },
    { id: 'hyunjune2001@gmail.com', password: 'password3', role: 'general', temp: false, nickname: '최성원C' },
    { id: 'grayhat3400@gmail.com', password: 'password4', role: 'general', temp: false, nickname: '최성원D' },
    { id: 'sharon0320@gachon.ac.kr', password: 'password5', role: 'general', temp: false, nickname: '애런 예거' },
];

// [데이터] AI 재학습 '수정 전' 목록의 초기 데이터를 생성함.
export const seedBefore = () => [
  { id: 1, learned: false, comment: "이 곡 멜로디가 너무 슬퍼요... 눈물 난다", emotions: ["슬픔", "후회", "혼란", "비통", "초조함"], confidence: 0.47 },
  { id: 2, learned: false, comment: "So uplifting and happy! made my day :)", emotions: ["기쁨", "감탄", "낙관"], confidence: 0.71 },
  { id: 3, learned: false, comment: "가사는 좋은데 보컬이 좀 거슬림", emotions: ["분노", "실망", "짜증"], confidence: 0.62 },
  { id: 4, learned: false, comment: "Not my vibe, but production is clean", emotions: ["혼란", "깨달음", "놀람"], confidence: 0.55 },
  { id: 5, learned: false, comment: "소름 돋았어... 소리 너무 좋다", emotions: ["놀람", "기쁨"], confidence: 0.68 },
  { id: 6, learned: false, comment: "boring... skipped after 30s", emotions: ["초조함", "실망"], confidence: 0.41 },
  { id: 7, learned: false, comment: "드럼 소리 미쳤다! 무대에서 듣고 싶음", emotions: ["열광", "낙관"], confidence: 0.69 },
  { id: 8, learned: false, comment: "lyrics are dark but kinda beautiful", emotions: ["슬픔", "감탄", "낙관", "애정", "감사"], confidence: 0.58 },
];

// [데이터] 유저 관리 목록의 초기 데이터를 생성함.
export const initialUsers = () => [
  { id: 'U1004', name: '홍길동 5', email: 'user5@example.com', signupDate: '2025-08-05', lastActive: '오늘', status: 'SUSPENDED' },
  { id: 'U1007', name: '홍길동 8', email: 'user8@example.com', signupDate: '2025-08-08', lastActive: '오늘', status: 'BLOCKED' },
  { id: 'U1009', name: '홍길동 10', email: 'user10@example.com', signupDate: '2025-08-10', lastActive: '어제', status: 'SUSPENDED' },
  { id: 'U1011', name: '홍길동 12', email: 'user12@example.com', signupDate: '2025-08-12', lastActive: '3일 전', status: 'BLOCKED' },
  { id: 'U1012', name: '홍길동 13', email: 'user13@example.com', signupDate: '2025-08-13', lastActive: '오늘', status: 'SUSPENDED' },
  { id: 'U1016', name: '홍길동 17', email: 'user17@example.com', signupDate: '2025-08-17', lastActive: '5일 전', status: 'BLOCKED' },
];


// -------------------- DashboardPage.jsx에서 사용되는 더미데이터 --------------------

// [데이터] KPI 카드 영역에 표시될 데이터.
export const KPI = {
  totalUsers: 100,
  todaySignups: 5,
  badUsers: 3,
  suspended: 3,
};

// [데이터] '총 API 호출 횟수' 막대그래프의 일자별 데이터.
export const BAR_DATA = [
  { day: 'D1', calls: 3 }, { day: 'D2', calls: 5 }, { day: 'D3', calls: 7 },
  { day: 'D4', calls: 6 }, { day: 'D5', calls: 8 }, { day: 'D6', calls: 9 },
  { day: 'D7', calls: 5 },
];

// [데이터] 막대그래프 클릭 시 표시될 일자별 상세 API 호출 내역.
export const DAILY_API_DETAILS = {
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
export const API_LIST = Array.from({ length: 15 }, (_, i) => {
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


// -------------------- RetrainPage.jsx에서 사용되는 더미데이터 --------------------

// [데이터] 감정 카테고리별 목록. EmotionPicker 컴포넌트로 전달됨.
export const POSITIVE = ["감탄","재미","인정","보살핌","욕망","열광","감사","기쁨","애정","낙관","자부심","안도"];
export const NEGATIVE = ["분노","짜증","실망","비난","혐오","당혹감","두려움","비통","초조함","후회","슬픔"];
export const AMBIGUOUS = ["혼란","호기심","깨달음","놀람"];


// -------------------- ModelSelectionPage.jsx에서 사용되는 더미데이터 --------------------

// [데이터] 선택 가능한 AI 모델 버전 및 성능 정보를 생성함.
export const createDummyModels = () => [
  { version: 'v0.1', microF1: 0.70, macroF1: 0.45, accuracy: 0.86 },
  { version: 'v0.2', microF1: 0.72, macroF1: 0.48, accuracy: 0.88 },
  { version: 'v0.3', microF1: 0.68, macroF1: 0.43, accuracy: 0.85 },
  { version: 'v0.4', microF1: 0.75, macroF1: 0.51, accuracy: 0.90 },
  { version: 'v0.5', microF1: 0.77, macroF1: 0.53, accuracy: 0.91 },
];


// -------------------- UserChatLog.jsx에서 사용되는 더미데이터 --------------------

// [데이터] 특정 유저의 대화 로그를 임의로 생성함.
// 실제 환경에서는 이 부분은 서버 API 호출로 대체됨.
export const generateDummyLogs = (userId) => {
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
//