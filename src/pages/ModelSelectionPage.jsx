// --- React 및 관련 라이브러리 임포트 ---
import React, { useState, useMemo, useEffect } from "react";

// --- 더미 데이터 ---

// [데이터] 선택 가능한 AI 모델 버전 및 성능 정보를 생성함.
const createDummyModels = () => [
  { version: 'v0.1', microF1: 0.70, macroF1: 0.45, accuracy: 0.86 },
  { version: 'v0.2', microF1: 0.72, macroF1: 0.48, accuracy: 0.88 },
  { version: 'v0.3', microF1: 0.68, macroF1: 0.43, accuracy: 0.85 },
  { version: 'v0.4', microF1: 0.75, macroF1: 0.51, accuracy: 0.90 },
  { version: 'v0.5', microF1: 0.77, macroF1: 0.53, accuracy: 0.91 },
];

// --- 메인 컴포넌트: 모델 선택 페이지 ---
// 서비스에 적용할 AI 모델의 버전을 선택하고 관리하는 페이지.
export default function ModelSelectionPage({ setPageTitle, refreshKey }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  // 페이지 로드 시 상단 제목을 '모델 선택'으로 설정함.
  useEffect(() => {
    setPageTitle("모델 선택");
  }, [setPageTitle]);

  const [models, setModels] = useState(createDummyModels()); // 전체 모델 목록 상태.
  const [searchTerm, setSearchTerm] = useState(""); // 검색창 입력값 상태.
  const [selectedVersion, setSelectedVersion] = useState('v0.5'); // 선택된 모델 버전 상태 (초기값 'v0.5').

  // [상태 초기화] 새로고침 신호(refreshKey)가 오면 선택된 버전을 초기값으로 리셋함.
  useEffect(() => {
    setSelectedVersion('v0.5');
  }, [refreshKey]);

  // --- 2. 데이터 처리 (Data Processing) ---
  
  // 검색어(searchTerm)에 따라 모델 목록을 실시간으로 필터링함.
  const filteredModels = useMemo(() => {
    // 검색어가 없으면 전체 목록을 반환함.
    if (!searchTerm.trim()) {
      return models;
    }
    // 검색어가 있으면 버전명 기준으로 필터링된 목록을 반환함.
    return models.filter((model) =>
      model.version.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [models, searchTerm]);

  // --- 3. 이벤트 핸들러 (Event Handlers) ---

  // [핸들러] '저장하기' 버튼 클릭 시 실행됨.
  const handleSave = () => {
    alert(`모델 버전 ${selectedVersion}이(가) 선택되어 저장되었습니다.`);
  };

  // --- 4. UI 렌더링 (JSX) ---
  return (
    <>
      <div className="model-table-card">
        {/* 검색 컨트롤 영역 */}
        <div className="model-controls">
          <div className="model-search">
            <input
              type="text"
              placeholder="모델 버전을 입력하세요"
              className="model-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="model-search-btn" title="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* 모델 목록 테이블 */}
        <div className="model-table">
          <div className="model-table-head">
            <div style={{width: '60px'}}></div>
            <div className="text-center">재학습 버전</div>
            <div className="text-center">Micro F1 Score</div>
            <div className="text-center">Macro F1 Score</div>
            <div className="text-center">Accuracy</div>
          </div>
          <div className="model-table-body">
            {/* 필터링된 모델 목록을 표시. 결과가 없으면 메시지를 보여줌 */}
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <div key={model.version} className="model-row">
                  <div className="text-center">
                    <input 
                      type="checkbox" 
                      className="model-checkbox"
                      checked={selectedVersion === model.version}
                      onChange={() => setSelectedVersion(model.version)}
                    />
                  </div>
                  <div className="model-text-strong text-center">{model.version}</div>
                  <div className="model-text-normal text-center">{model.microF1.toFixed(2)}</div>
                  <div className="model-text-normal text-center">{model.macroF1.toFixed(2)}</div>
                  <div className="model-text-normal text-center">{model.accuracy.toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div className="no-results">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
        
        {/* 저장 버튼 (선택된 버전이 있을 때만 활성화됨) */}
        <div className="model-save-action">
            <button className="btn" onClick={handleSave} disabled={!selectedVersion}>
              저장하기
            </button>
        </div>
      </div>
    </>
  );
}