"use client";

import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const THEME_KEY = "mlh-theme-mode";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(mode);
    window.localStorage.setItem(THEME_KEY, mode);
  }, [mode]);

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] transition hover:opacity-90"
      style={{ borderColor: "var(--nav-border)", background: "var(--retro-cell)", color: "var(--nav-text)" }}
      onClick={() => setMode(isDark ? "light" : "dark")}
      title={`현재 ${isDark ? "다크" : "라이트"} 모드 (클릭하여 전환)`}
    >
      {isDark ? "다크" : "라이트"}
    </button>
  );
}
