"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("convertx-theme");
    const isLight = saved === "light";
    setLight(isLight);
    document.documentElement.dataset.theme = isLight ? "light" : "dark";

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

  function toggleTheme() {
    const nextLight = !light;
    setLight(nextLight);
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
    window.localStorage.setItem("convertx-theme", nextLight ? "light" : "dark");
  }

  if (!headerSlot) return null;

  return createPortal(
    <button
      type="button"
      className="convertx-theme-toggle"
      onClick={toggleTheme}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={light}
      title={light ? "Dark mode" : "Light mode"}
    >
      <span className="convertx-theme-icon" aria-hidden="true">
        {light ? <Moon size={16} strokeWidth={2.2} /> : <Sun size={16} strokeWidth={2.2} />}
      </span>
      <span className="convertx-theme-label">{light ? "Dark" : "Light"}</span>
    </button>,
    headerSlot,
  );
}
