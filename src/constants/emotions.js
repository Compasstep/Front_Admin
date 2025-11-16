// KO 라벨 목록 (디자인에서 보이는 텍스트)
export const POSITIVE_KO = [
  "기쁨", "감사", "감탄/존경", "관심/기대",
  "호의/승인", "안도", "애정"
];

export const NEGATIVE_KO = [
  "분노/짜증", "혐오", "두려움",
  "비난", "우울/슬픔", "부끄러움"
];

export const AMBIGUOUS_KO = [
  "놀람", "깨달음", "혼란", "호기심", "결연함", "오만", "중립/기타"
];

// 영문 ⇄ 한글 매핑 (백엔드 <-> 프론트 변환용)
// 팀원이 영문 키만 받는다고 했으므로, 반드시 이 매핑을 통해 변환한다.
export const enToKo = {
  joy_happiness: "기쁨",
  gratitude: "감사",
  admiration: "감탄/존경",
  interest_curiosity: "관심/기대",      // (GoEmotions의 desire/curiosity 통합 표현)
  approval: "호의/승인",
  anger_annoyance: "분노/짜증",
  disgust: "혐오",
  sadness_grief: "우울/슬픔",
  fear_nervousness: "두려움",
  surprise: "놀람",
  realization: "깨달음",
  relief: "안도",
  caring_love: "애정",
  embarrassment: "부끄러움",
  confusion: "혼란",
  curiosity: "호기심",
  disapproval: "비난",
  resolute: "결연함",
  arrogance: "오만",
  neutral_misc: "중립/기타",
};

export const koToEn = Object.fromEntries(Object.entries(enToKo).map(([en, ko]) => [ko, en]));
