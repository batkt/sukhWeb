"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Props = {
  className?: string;
  showTrail?: boolean;
  buttonClassName?: string;
};

export default function ThemeModeToggler({
  className = "",
  showTrail = false,
  buttonClassName,
}: Props) {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = (
        typeof window !== "undefined"
          ? localStorage.getItem("theme-mode")
          : null
      ) as "light" | "dark" | null;
      const initial =
        saved ||
        (document.documentElement.getAttribute("data-mode") as
          | "light"
          | "dark"
          | null) ||
        "light";
      setMode(initial);
      document.documentElement.setAttribute("data-mode", initial);
    } catch {}
  }, []);

  const toggle = () => {
    const next: "light" | "dark" = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
    try {
      localStorage.setItem("theme-mode", next);
    } catch {}
  };

  return (
    <div className={className}>
      <button
        aria-label="Toggle dark mode"
        className={buttonClassName || "mode-fab"}
        onClick={toggle}
        type="button"
      >
        <span className="sr-only">Toggle theme mode</span>
        <span aria-hidden className="transition-opacity duration-200">
          {mode === "dark" ? <Moon /> : <Sun />}
        </span>
      </button>
      {showTrail ? <span aria-hidden className="mode-trail" /> : null}
    </div>
  );
}
