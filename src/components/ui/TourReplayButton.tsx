"use client";

import { HelpCircle, X, EyeOff, RotateCcw, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTour } from "@/context/TourContext";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { motion, AnimatePresence } from "framer-motion";
import { useTsonkh } from "@/lib/useTsonkh";

export default function TourReplayButton() {
  const { start, disable, enable, disabled } = useTour();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  const { list: tsonkhList } = useTsonkh("sukh");
  const currentTsonkh = useMemo(() => {
    const path = pathname?.replace(/\/$/, "") || "";
    if (!path) return null;

    if (path === "/zogsool/orshinSuugch" || path === "/geree/orshinSuugch") {
      return {
        _id: "resident-list-help-custom",
        ner: "Оршин суугч",
        zaavar: `<div class="space-y-4">
  <p><strong>Оршин суугчдын бүртгэлийн хэсэг</strong> нь орон сууцны хотхон, барилгын оршин суугчид болон тэдгээрийн тээврийн хэрэгслийн мэдээллийг нэгдсэн байдлаар удирдах зориулалттай.</p>
  
  <div class="bg-theme/10 dark:bg-theme/20 p-5 rounded-3xl border border-theme/30 dark:border-theme/30">
    <h4 class="font-bold text-theme dark:text-theme mb-2">Үндсэн боломжууд:</h4>
    <ul class="list-disc pl-5 space-y-1.5 text-[color:var(--panel-text)]">
      <li>Шинээр оршин суугч болон түүний тээврийн хэрэгслийн дугаарыг бүртгэх</li>
      <li>Оршин суугчдын мэдээллийг харах, шүүх болон засах</li>
      <li>Шаардлагагүй болсон бүртгэлийг системээс устгах</li>
      <li>Орц, тоотоор шүүлт хийж мэдээллийг хурдан олох</li>
    </ul>
  </div>

  <div class="mt-4">
    <h4 class="font-bold text-[color:var(--panel-text)] dark:text-white mb-2">Ажиллуулах зааварчилгаа:</h4>
    <ol class="list-decimal pl-5 space-y-2.5 text-[color:var(--panel-text)]">
      <li><strong>Нэмэх товч</strong> дээр дарж оршин суугчийн нэр, утасны дугаар, орц, тоот болон тээврийн хэрэгслийн улсын дугаарыг бүртгэнэ.</li>
      <li>Жагсаалтаас хайлт хийхдээ дээд хэсэгт байрлах <strong>Хайх цонхыг</strong> ашиглан нэр, утас эсвэл улсын дугаараар хайх боломжтой.</li>
      <li>Бүртгэлтэй оршин суугчийн мэдээллийг шинэчлэхийн тулд тухайн мөрний баруун талд байрлах <strong>Засах (Edit) товчлуур</strong> дээр дарна уу.</li>
    </ol>
  </div>
</div>`
      } as any;
    }

    const withZam = tsonkhList
      .map((t) => ({ t, zam: (t.zam || "").replace(/\/$/, "") }))
      .filter(({ zam }) => zam);
    withZam.sort((a, b) => b.zam.length - a.zam.length);

    // Try finding exact or prefix match first
    let found = withZam.find(
      ({ zam }) => path === zam || path.startsWith(zam + "/")
    );

    return found?.t ?? null;
  }, [pathname, tsonkhList]);

  const menuRef = useRef<HTMLDivElement>(null);

  useModalHotkeys({ isOpen: open, onClose: () => setOpen(false) });

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  useEffect(() => {
    const interacted = localStorage.getItem("tour-button-interacted");
    if (interacted === "true") {
      setHasInteracted(true);
    } else {
      // Show label automatically for new users after a short delay
      const timer = setTimeout(() => setShowLabel(true), 2000);
      const hideTimer = setTimeout(() => setShowLabel(false), 8000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  const handleClick = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      localStorage.setItem("tour-button-interacted", "true");
    }
    setShowLabel(false);
    setOpen((o) => !o);
  };

  if (pathname === "/login") return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[1200] pointer-events-auto">
      <div className="relative flex flex-col items-end gap-3">
        {/* Main Floating Button - only shown when closed */}
        {!open && (
          <div 
            className="relative flex items-center group"
            onMouseEnter={() => setShowLabel(true)}
            onMouseLeave={() => setShowLabel(false)}
          >
            <AnimatePresence>
              {showLabel && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  className="absolute right-full mr-3 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl pointer-events-none whitespace-nowrap hidden md:block"
                >
                  <span className="text-sm font-medium text-[color:var(--panel-text)] dark:text-white flex items-center gap-2">
                    {currentTsonkh?.ner ? `${currentTsonkh.ner} тусламж хэрэгтэй юу?` : "Ерөнхий тусламж хэрэгтэй юу?"} <span className="text-theme">👋</span>
                  </span>
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-white/90 border-r border-t border-white/20" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClick}
              className="relative flex items-center justify-center h-14 w-14 md:h-12 md:w-12 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all overflow-hidden bg-white/80 backdrop-blur-md text-[color:var(--panel-text)]"
            >
              <div className="relative">
                <HelpCircle className="w-6 h-6 md:w-5 md:h-5" />
                {!hasInteracted && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-theme"></span>
                  </span>
                )}
              </div>
            </motion.button>
          </div>
        )}

        {/* Dropdown Menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-[280px] md:w-72 overflow-hidden rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            >
              <div className="p-5 border-b border-[color:var(--surface-border)] dark:border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-[color:var(--panel-text)] dark:text-white">
                    {currentTsonkh?.ner || "Ерөнхий тусламж"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Хаах"
                    className="flex items-center justify-center h-7 w-7 rounded-full bg-danger hover:bg-danger active:bg-danger text-white shadow-sm transition-colors cursor-pointer shrink-0 border-none"
                  >
                    <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
                <p className="text-xs text-[color:var(--muted-text)] mt-1">
                  {currentTsonkh?.ner ? "Энэ хуудасны тухай дэлгэрэнгүй мэдээлэл" : "Системийн заавар болон тусламжийг эндээс аваарай"}
                </p>
              </div>

              <div className="p-2 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    start();
                    setOpen(false);
                  }}
                  className="group flex items-center justify-between w-full p-3 rounded-2xl hover:bg-theme/10 dark:hover:bg-theme/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-theme/10 dark:bg-theme/20 text-theme dark:text-theme group-hover:scale-110 transition-transform">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">Дахин үзүүлэх</div>
                      <div className="text-[11px] text-[color:var(--muted-text)]">Хуудасны зааварчилгааг эхлүүлэх</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[color:var(--muted-text)] group-hover:translate-x-1 transition-transform" />
                </button>

                {disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      enable();
                      setOpen(false);
                    }}
                    className="group flex items-center justify-between w-full p-3 rounded-2xl hover:bg-theme/10 dark:hover:bg-theme/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-theme/10 dark:bg-theme/20 text-theme dark:text-theme group-hover:scale-110 transition-transform">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">Дахин идэвхжүүлэх</div>
                        <div className="text-[11px] text-[color:var(--muted-text)]">Тусламжийн функцийг нээх</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[color:var(--muted-text)] group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      disable();
                      setOpen(false);
                    }}
                    className="group flex items-center justify-between w-full p-3 rounded-2xl hover:bg-danger/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-danger/10 text-danger group-hover:scale-110 transition-transform">
                        <EyeOff className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">Дахиж харуулахгүй</div>
                        <div className="text-[11px] text-[color:var(--muted-text)]">Зааварчилгааг нуух</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[color:var(--muted-text)] group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              <div className="p-3 bg-[color:var(--surface-hover)] dark:bg-white/5 flex justify-center">
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs font-medium text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors py-1 px-4"
                >
                  Хаах
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
