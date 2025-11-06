"use client";

import { HelpCircle, X, EyeOff, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTour } from "@/context/TourContext";

export default function TourReplayButton() {
  const { start, disable, enable, disabled } = useTour();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Check if user has interacted before (stored in localStorage)
  useEffect(() => {
    const interacted = localStorage.getItem("tour-button-interacted");
    if (interacted === "true") {
      setHasInteracted(true);
    }
  }, []);

  const handleClick = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      localStorage.setItem("tour-button-interacted", "true");
    }
    setOpen((o) => !o);
  };

  // hide on login page
  if (pathname === "/login") return null;

  return (
    <div className="fixed bottom-3 right-3 md:bottom-4 md:right-4 z-[1200] pointer-events-auto">
      <div className="relative">
        <button
          type="button"
          aria-label="Open tour controls"
          onClick={handleClick}
          className={`inline-flex items-center justify-center h-12 w-12 md:h-11 md:w-11 rounded-full neu-panel hover:scale-105 transition-all duration-300 shadow-md ${
            !hasInteracted ? "animate-pulse" : ""
          }`}
          title="Тусламж / Tour"
        >
          <HelpCircle className="w-6 h-6 md:w-5 md:h-5" />
        </button>

        {open && (
          <>
            {/* Mobile sheet */}
            <div
              className="md:hidden fixed inset-0 z-[1199]"
              onClick={() => setOpen(false)}
            />
            <div className="md:hidden fixed left-3 right-3 bottom-20 z-[1200] menu-surface rounded-2xl shadow-2xl p-3">
              <div className="px-1 pt-1 pb-2 text-base font-semibold">
                Тусламж
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    start();
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:menu-surface/80 text-left text-sm"
                >
                  <RotateCcw className="w-5 h-5" /> Дахин үзүүлэх
                </button>
                {disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      enable();
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:menu-surface/80 text-left text-sm"
                  >
                    <EyeOff className="w-5 h-5" /> Дахин идэвхжүүлэх
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      disable();
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:menu-surface/80 text-left text-sm"
                  >
                    <EyeOff className="w-5 h-5" /> Дахиж харуулахгүй
                  </button>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg hover:menu-surface/80"
                >
                  <X className="w-3 h-3" /> Хаах
                </button>
              </div>
            </div>

            {/* Desktop dropdown */}
            <div className="hidden md:block absolute bottom-14 right-0 w-64 menu-surface rounded-xl shadow-xl p-2">
              <div className="px-2 pt-2 pb-1 text-sm font-semibold">
                Тусламж
              </div>
              <div className="flex flex-col gap-1 p-1">
                <button
                  type="button"
                  onClick={() => {
                    start();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:menu-surface/80 text-left"
                >
                  <RotateCcw className="w-4 h-4" /> Дахин үзүүлэх
                </button>
                {disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      enable();
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:menu-surface/80 text-left"
                  >
                    <EyeOff className="w-4 h-4" /> Дахин идэвхжүүлэх
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      disable();
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:menu-surface/80 text-left"
                  >
                    <EyeOff className="w-4 h-4" /> Дахиж харуулахгүй
                  </button>
                )}
              </div>
              <div className="flex justify-end p-1">
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:menu-surface/80"
                >
                  <X className="w-3 h-3" /> Хаах
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
