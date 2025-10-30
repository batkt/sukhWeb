"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

type Theme =
  | "blue-gradient"
  | "colorful"
  | "white-gray"
  // | "dark-gray"
  // | "dark-green"
  // | "dark-black";

export default function ӨнгөнийЗагварСонгох() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("colorful");
  const [isOpen, setIsOpen] = useState(false);

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
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem("app-theme", theme);
    setIsOpen(false);
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
    // {
    //   id: "dark-gray" as Theme,
    //   name: "Харанхуй Саарал",
    //   colors: ["#4a5568", "#2d3748", "#1a202c", "#718096"],
    // },
    // {
    //   id: "dark-green" as Theme,
    //   name: "Хүрэн Ногоон",
    //   colors: ["#2f7c57", "#1e5a3e", "#3d9970", "#5cb88a"],
    // },
    // {
    //   id: "dark-black" as Theme,
    //   name: "Гүн Хар",
    //   colors: ["#0b0b10", "#161620", "#1c1c28"],
    // },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/40 text-slate-700 hover:bg-white/70 hover:text-[#1e3a8a] hover:scale-105 hover:shadow-sm transition-all duration-300"
        title="Өнгөний загварыг солих"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="menu-surface absolute right-0 mt-2 w-52 rounded-xl z-50 backdrop-blur-md bg-white/80 shadow-md">
          <div className="py-2 px-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 px-2">
              Өнгөний загвар сонгох
            </p>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-200 ease-in-out flex items-center justify-between gap-3 ${
                  currentTheme === theme.id
                    ? "bg-white/60 text-theme font-semibold shadow-sm"
                    : "text-theme hover:bg-white/40 hover:text-[#1e3a8a] hover:shadow-md hover:scale-[1.02]"
                }`}
              >
                <span className="text-sm">{theme.name}</span>
                <div className="flex gap-1">
                  {theme.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border border-white/50 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
