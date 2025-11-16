// src/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { isDark, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? '라이트 모드로' : '다크 모드로'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <div className="theme-toggle__thumb" />
      <div className="theme-toggle__track">
        <span className="theme-toggle__icon" onClick={(e)=>{e.stopPropagation(); setTheme('light');}} title="라이트">
          {/* 태양 아이콘 */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
          </svg>
        </span>
        <span className="theme-toggle__icon" onClick={(e)=>{e.stopPropagation(); setTheme('dark');}} title="다크">
          {/* 달 아이콘 */}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
      </div>
    </button>
  );
}
