// --- React 및 관련 라이브러리 임포트 ---
import React, { createContext, useContext, useState, useCallback } from 'react';

// --- React Context 생성 ---
// 앱 전역에서 토스트 메시지 관련 함수와 상태를 공유하기 위한 Context 객체를 생성함.
// 1. Context 생성
const ToastContext = createContext(null);

// --- 커스텀 Hook: useToast ---
// 다른 컴포넌트에서 ToastContext의 값을 쉽게 사용하기 위한 훅.
// 2. 다른 컴포넌트에서 토스트를 쉽게 사용하게 해주는 Hook
export function useToast() {
  return useContext(ToastContext);
}

// --- Context Provider 컴포넌트: ToastProvider ---
// 앱의 최상위를 감싸 토스트 메시지 기능을 제공하는 컴포넌트.
// 3. Toast 기능을 앱 전체에 제공하는 Provider 컴포넌트
export function ToastProvider({ children }) {
  
  // --- 1. 상태 관리 (State Management) ---
  
  // 현재 화면에 표시될 토스트 메시지의 정보(id, message)를 관리하는 상태.
  const [toast, setToast] = useState(null);

  // --- 2. 이벤트 핸들러 및 함수 ---

  // [함수] 토스트 메시지를 화면에 표시하는 함수.
  // useCallback을 사용하여 함수가 불필요하게 재생성되는 것을 방지함.
  const showToast = useCallback((message, duration = 3000) => {
    // 여러 토스트 요청이 동시에 발생해도 구분할 수 있도록 고유 ID를 생성함.
    const id = Date.now();
    // 토스트 상태를 업데이트하여 화면에 메시지를 표시함.
    setToast({ id, message });

    // 설정된 시간(duration)이 지난 후, 현재 표시된 토스트와 ID가 일치하면 상태를 null로 변경하여 화면에서 제거함.
    setTimeout(() => {
      setToast(currentToast => (currentToast?.id === id ? null : currentToast));
    }, duration);
  }, []);

  // --- 3. UI 렌더링 (JSX) ---
  return (
    // Provider를 통해 showToast 함수를 하위 모든 컴포넌트에 제공함.
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* toast 상태에 값이 있을 때만 토스트 UI를 렌더링함 */}
      {toast && (
        <div className="toast-notification">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}