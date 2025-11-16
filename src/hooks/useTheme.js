// src/hooks/useTheme.js
import { useEffect, useState } from "react";

const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";

// 로컬스토리지에서 현재 테마 읽기
export function getTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === DARK ? DARK : LIGHT;
  } catch {
    return LIGHT;
  }
}

// html[data-theme] + 로컬스토리지 동기화
export function applyTheme(theme) {
  const t = theme === DARK ? DARK : LIGHT;
  document.documentElement.setAttribute("data-theme", t);
}

export function setThemeStorage(theme) {
  try { localStorage.setItem(THEME_KEY, theme === DARK ? DARK : LIGHT); } catch {}
  applyTheme(theme);
}

export function toggleTheme() {
  const next = getTheme() === DARK ? LIGHT : DARK;
  setThemeStorage(next);
  return next;
}

// ✅ default export hook: ThemeToggle에서 `const { isDark, toggle } = useTheme()`로 사용
export default function useTheme() {
  const [theme, setTheme] = useState(getTheme());

  // 최초 마운트/스토리지 변경 반영
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    // 초기 동기화
    const init = getTheme();
    if (init !== theme) {
      setTheme(init);
      applyTheme(init);
    }

    // 다른 탭에서 바뀐 경우 반영
    const onStorage = (e) => {
      if (e.key === THEME_KEY) {
        const next = (e.newValue === DARK ? DARK : LIGHT);
        setTheme(next);
        applyTheme(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const next = theme === DARK ? LIGHT : DARK;
    setTheme(next);
    setThemeStorage(next);
  };

  return {
    theme,
    isDark: theme === DARK,
    setTheme: (t) => { setTheme(t); setThemeStorage(t); },
    toggle,
  };
}

// named export도 그대로 제공(원하는 곳에서 직접 호출 가능)
export { useTheme };
