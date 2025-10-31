"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

type Theme = "blue-gradient" | "colorful" | "white-gray";

export default function ӨнгөнийЗагварСонгох() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("colorful");
  const [isOpen, setIsOpen] = useState(false);
  const [clickedTheme, setClickedTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as Theme;
    if (saved) {
      setCurrentTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.removeAttribute("data-theme");
    if (theme !== "colorful") {
      root.setAttribute("data-theme", theme);
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setClickedTheme(theme);
    setTimeout(() => {
      setCurrentTheme(theme);
      applyTheme(theme);
      localStorage.setItem("app-theme", theme);
      setClickedTheme(null);
      setIsOpen(false);
    }, 400);
  };

  const themes = [
    {
      id: "blue-gradient" as Theme,
      name: "Цэнхэр",
      colors: ["#e6f0ff", "#d7e7ff", "#c7ddff", "#b7d2ff"],
    },
    {
      id: "colorful" as Theme,
      name: "Өнгөлөг",
      colors: ["#806bdf", "#f64770", "#f6bb32", "#5cbf9b"],
    },
    {
      id: "white-gray" as Theme,
      name: "Цагаан–Саарал",
      colors: ["#e6e9ed", "#d9dde1", "#cbd2d6", "#b0b8be"],
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center h-10 w-10 rounded-full neu-panel text-slate-700 hover:bg-white/70 hover:text-[#1e3a8a] hover:scale-105 hover:shadow-sm transition-all duration-300"
        title="Өнгөний загварыг солих"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="menu-surface absolute right-0 mt-2 w-64 rounded-xl z-50 backdrop-blur-md bg-white/80 shadow-md">
          <div className="py-2 px-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 px-2">
              Өнгөний загвар сонгох
            </p>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-300 ease-in-out flex items-center justify-between gap-3 ${
                  currentTheme === theme.id
                    ? "bg-white/60 font-semibold shadow-sm"
                    : "hover:bg-white/40 hover:shadow-md"
                } ${
                  clickedTheme === theme.id
                    ? "scale-95 bg-white/80"
                    : "scale-100"
                }`}
              >
                <span className="text-sm text-slate-700">{theme.name}</span>
                <div
                  className="h-4 w-24 rounded-full border border-white/50 shadow-sm transition-transform duration-300"
                  style={{
                    background: `linear-gradient(to right, ${theme.colors.join(
                      ", "
                    )})`,
                    transform:
                      clickedTheme === theme.id ? "scale(1.05)" : "scale(1)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
