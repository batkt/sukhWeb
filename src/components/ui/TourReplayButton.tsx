"use client";

import { HelpCircle, X, EyeOff, RotateCcw, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
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
  
  <div class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30">
    <h4 class="font-bold text-blue-900 dark:text-blue-400 mb-2">Үндсэн боломжууд:</h4>
    <ul class="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
      <li>Шинээр оршин суугч болон түүний тээврийн хэрэгслийн дугаарыг бүртгэх</li>
      <li>Оршин суугчдын мэдээллийг харах, шүүх болон засах</li>
      <li>Шаардлагагүй болсон бүртгэлийг системээс устгах</li>
      <li>Орц, тоотоор шүүлт хийж мэдээллийг хурдан олох</li>
    </ul>
  </div>

  <div class="mt-4">
    <h4 class="font-bold text-slate-900 dark:text-white mb-2">Ажиллуулах зааварчилгаа:</h4>
    <ol class="list-decimal pl-5 space-y-2.5 text-slate-700 dark:text-slate-300">
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

  useModalHotkeys({ isOpen: open, onClose: () => setOpen(false) });

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

  if (pathname === "/login" || disabled) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[1200] pointer-events-auto">
      <div className="relative flex flex-col items-end gap-3">
        {/* Main Floating Button */}
        <div 
          className="relative flex items-center group"
          onMouseEnter={() => !open && setShowLabel(true)}
          onMouseLeave={() => !open && setShowLabel(false)}
        >
          <AnimatePresence>
            {showLabel && !open && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                className="absolute right-full mr-3 px-4 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl pointer-events-none whitespace-nowrap hidden md:block"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  {currentTsonkh?.ner ? `${currentTsonkh.ner} тусламж хэрэгтэй юу?` : "Ерөнхий тусламж хэрэгтэй юу?"} <span className="text-blue-500">👋</span>
                </span>
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-white/90 dark:bg-slate-900/90 border-r border-t border-white/20" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`relative flex items-center justify-center h-14 w-14 md:h-12 md:w-12 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all overflow-hidden ${
              open 
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
                : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-200"
            }`}
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X className="w-6 h-6 md:w-5 md:h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="help"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  className="relative"
                >
                  <HelpCircle className="w-6 h-6 md:w-5 md:h-5" />
                  {!hasInteracted && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-[280px] md:w-72 overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            >
              <div className="p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentTsonkh?.ner || "Ерөнхий тусламж"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                  className="group flex items-center justify-between w-full p-3 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Дахин үзүүлэх</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Хуудасны зааварчилгааг эхлүүлэх</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                </button>

                {disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      enable();
                      setOpen(false);
                    }}
                    className="group flex items-center justify-between w-full p-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Дахин идэвхжүүлэх</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Тусламжийн функцийг нээх</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      disable();
                      setOpen(false);
                    }}
                    className="group flex items-center justify-between w-full p-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                        <EyeOff className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Дахиж харуулахгүй</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Зааварчилгааг нуух</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-white/5 flex justify-center">
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1 px-4"
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
