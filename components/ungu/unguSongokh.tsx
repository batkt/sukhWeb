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

  const themes = [
    {
      id: "soft-sage" as Theme,
      name: "Зөөлөн ногоон",
      colors: ["#eaf7f0", "#d9f1e7", "#9fd3c0", "#0f1730"],
    },
    {
      id: "blue-gradient" as Theme,
      name: "Цэнхэр градиент",
      colors: ["#e6f0ff", "#d7e7ff", "#c7ddff", "#b7d2ff"],
    },
    {
      id: "colorful" as Theme,
      name: "Өнгөлөг",
      colors: ["#806bdf", "#f64770", "#f6bb32", "#5cbf9b"],
    },

    {
      id: "white-gray" as Theme,
      name: "Цагаан саарал",
      colors: ["#e6e9ed", "#d9dde1", "#cbd2d6", "#b0b8be"],
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative inline-flex items-center justify-center h-10 w-10 rounded-2xl neu-panel text-slate-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:text-[#1e3a8a] hover:scale-105 hover:shadow-md transition-all duration-300 overflow-hidden"
        title="Өнгөний загварыг солих"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-current/10 to-current/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Palette className="w-5 h-5 relative z-10" />
        <div className="absolute inset-0 rounded-xl ring-2 ring-current/20 group-hover:ring-current/40 transition-all duration-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl z-[120] menu-surface overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-800">
                  Өнгөний загвар
                </h3>
                <p className="text-xs text-slate-500">Загварыг сонгоно уу</p>
              </div>
            </div>

            <div className="space-y-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`w-full group relative overflow-hidden rounded-xl border transition-all duration-300 ease-out ${
                    currentTheme === theme.id
                      ? "border-blue-500 bg-blue-50/50 shadow-md scale-[1.01]"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-sm"
                  } ${clickedTheme === theme.id ? "scale-95" : "scale-100"}`}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg border border-white/50 shadow-sm transition-all duration-300 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.join(
                            ", "
                          )})`,
                        }}
                      />
                      <div className="text-left">
                        <p className="text-xs font-medium text-slate-800">
                          {theme.name}
                        </p>
                      </div>
                    </div>

                    {currentTheme === theme.id && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Animated background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
