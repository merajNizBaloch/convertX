"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Moon, Radio, Sun } from "lucide-react";

type Theme = "dark" | "light" | "retro";

const themes: Theme[] = ["dark", "light", "retro"];

const themeMeta: Record<Theme, { label: string; next: string }> = {
  dark: { label: "Dark", next: "Light" },
  light: { label: "Light", next: "Retro" },
  retro: { label: "Retro", next: "Dark" },
};

function iconForTheme(theme: Theme) {
  if (theme === "light") return <Sun size={16} strokeWidth={2.2} />;
  if (theme === "retro") return <Radio size={16} strokeWidth={2.2} />;
  return <Moon size={16} strokeWidth={2.2} />;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("convertx-theme") as Theme | null;
    const initial: Theme = saved === "light" || saved === "retro" ? saved : "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;

    const findHeader = () => {
      const header = document.querySelector("header > div");
      if (header instanceof HTMLElement) {
        setHeaderSlot(header);
        return true;
      }
      return false;
    };

    if (findHeader()) return;

    const observer = new MutationObserver(() => {
      if (findHeader()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function cycleTheme() {
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("convertx-theme", nextTheme);
  }

  if (!headerSlot) return null;

  return createPortal(
    <button
      type="button"
      className="convertx-theme-toggle"
      onClick={cycleTheme}
      aria-label={`Switch to ${themeMeta[theme].next.toLowerCase()} mode`}
      title={`${themeMeta[theme].label} mode · next: ${themeMeta[theme].next}`}
    >
      <span className="convertx-theme-icon" aria-hidden="true">
        {iconForTheme(theme)}
      </span>
      <span className="convertx-theme-label">{themeMeta[theme].label}</span>
    </button>,
    headerSlot,
  );
}
