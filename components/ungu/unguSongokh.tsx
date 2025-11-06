"use client";

import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";

type Theme = "blue-gradient" | "colorful" | "white-gray" | "soft-sage";

export default function ӨнгөнийЗагварСонгох() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("soft-sage");
  const [isOpen, setIsOpen] = useState(false);
  const [clickedTheme, setClickedTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as Theme | null;
    const attr = document.documentElement.getAttribute(
      "data-theme"
    ) as Theme | null;
    const initial = (saved || attr || "soft-sage") as Theme;
    setCurrentTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    // Always set explicit data-theme, including "colorful"
    root.setAttribute("data-theme", theme);
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

  const themes: Array<{
    id: Theme;
    name: string;
    colors: string[];
  }> = [
    {
      id: "soft-sage",
      name: "Зөөлөн ногоон",
      colors: ["#eaf7f0", "#d9f1e7", "#9fd3c0", "#0f1730"],
    },
    {
      id: "blue-gradient",
      name: "Цэнхэр градиент",
      colors: ["#e6f0ff", "#d7e7ff", "#c7ddff", "#b7d2ff"],
    },
    {
      id: "colorful",
      name: "Өнгөлөг",
      colors: ["#806bdf", "#f64770", "#f6bb32", "#5cbf9b"],
    },
    {
      id: "white-gray",
      name: "Цагаан саарал",
      colors: ["#e6e9ed", "#d9dde1", "#cbd2d6", "#b0b8be"],
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative inline-flex items-center justify-center h-10 w-10 rounded-full neu-panel text-slate-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:text-[#1e3a8a] hover:scale-105 hover:shadow-md transition-all duration-300 overflow-hidden"
        title="Өнгөний загварыг солих"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-current/10 to-current/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Palette className="w-5 h-5 relative z-10" />
        <div className="absolute inset-0 rounded-full ring-2 ring-current/20 group-hover:ring-current/40 transition-all duration-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 rounded-2xl z-[120] menu-surface overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="p-2">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  title={t.name}
                  className={`group relative h-9 w-9 rounded-full border transition-all duration-200 ease-out flex-none ${
                    currentTheme === t.id
                      ? "ring-2 ring-blue-500 border-transparent"
                      : "border-slate-200 hover:border-slate-300"
                  } ${clickedTheme === t.id ? "scale-90" : "scale-90"}`}
                >
                  <span className="sr-only">{t.name}</span>
                  <div
                    className="absolute inset-0 rounded-full shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${t.colors.join(
                        ", "
                      )})`,
                    }}
                  />
                  {currentTheme === t.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
