"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, CheckCircle2, Video } from "lucide-react";

export interface ZaavarChapter {
  id: number;
  t: number;
  d: number;
  title: string;
  timeStr: string;
  desc: string;
}

export const ZAAVAR_CHAPTERS: ZaavarChapter[] = [
  { id: 1, t: 5.0, d: 9.725, title: "Нэвтрэх", timeStr: "0:05", desc: "Нэвтрэх нэр болон нууц үгээ оруулан нэвтэрнэ. Нэвтэрсний дараа хяналтын самбар нээгдэнэ." },
  { id: 2, t: 14.725, d: 12.677, title: "Барилгын тохиргоо", timeStr: "0:15", desc: "СӨХ-ийн нэр, холбоо барих мэдээлэл болон барилгын мэдээллээ тохируулна." },
  { id: 3, t: 27.402, d: 12.128, title: "Нэмэлт тохиргоо", timeStr: "0:27", desc: "Нэхэмжлэх автоматаар илгээх, хоногоор хуваан бодох зэрэг төлбөрийн тохиргоог хийнэ." },
  { id: 4, t: 39.53, d: 8.001, title: "Ашиглалтын зардал", timeStr: "0:40", desc: "Тогтмол болон хувьсах зардлуудаа бүртгэж, тариф тогтооно." },
  { id: 5, t: 47.531, d: 6.93, title: "Данс", timeStr: "0:48", desc: "Төлбөр хүлээн авах банкны данс нэмнэ." },
  { id: 6, t: 54.46, d: 16.804, title: "И-Баримт", timeStr: "0:54", desc: "Татвар төлөгчийн дугаар болон дүүрэг, хороогоо оруулан И-Баримт системтэй холбоно." },
  { id: 7, t: 71.264, d: 9.333, title: "Зогсоолын тохиргоо", timeStr: "1:11", desc: "Зогсоолын тариф, зочин урих эрх, машины тоо болон камерын тохиргоог хийнэ." },
  { id: 8, t: 80.598, d: 8.811, title: "Тоот бүртгэл", timeStr: "1:21", desc: "Тоот, гараж, агуулахын жагсаалтыг харж, бүртгэнэ." },
  { id: 9, t: 89.408, d: 15.341, title: "Оршин суугч", timeStr: "1:29", desc: "Оршин суугчийг гараар нэмж, эсвэл Excel файлаар олноор нь оруулна." },
  { id: 10, t: 104.749, d: 15.341, title: "Ажилтан", timeStr: "1:45", desc: "Ажилтны мэдээллийг оруулж, нэвтрэх эрхийг нь үүсгэнэ." },
  { id: 11, t: 120.091, d: 20.122, title: "Гүйлгээний түүх", timeStr: "2:00", desc: "Оршин суугчийн төлбөрийн гүйлгээг гараар хийх, эсвэл Excel файлаар олноор нь оруулна." },
  { id: 12, t: 140.212, d: 11.475, title: "Хөнгөлөлт", timeStr: "2:20", desc: "Оршин суугчид хөнгөлөлт оруулж, хөнгөлөлтийн түүхийг харна." },
  { id: 13, t: 151.687, d: 13.069, title: "Тайлан", timeStr: "2:32", desc: "Орлого, авлага, авлагын насжилт зэрэг тайланг харна." },
  { id: 14, t: 164.756, d: 10.273, title: "Мэдэгдэл", timeStr: "2:45", desc: "Оршин суугчид руу апп, мессеж эсвэл имэйлээр мэдэгдэл илгээнэ." },
  { id: 15, t: 175.029, d: 9.202, title: "Санал асуулга", timeStr: "2:55", desc: "СӨХ-өөс оршин суугчид руу санал асуулга үүсгэж илгээнэ." },
  { id: 16, t: 184.232, d: 10.535, title: "Зогсоол", timeStr: "3:04", desc: "Зогсоолын машин бүртгэнэ." },
  { id: 17, t: 194.767, d: 6.93, title: "Санал хүсэлт", timeStr: "3:15", desc: "Оршин суугчаас ирсэн санал, хүсэлтийг хүлээн авч хариу өгнө." },
];

export default function AdminZaavar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chapterBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const getIdxAtTime = useCallback((t: number) => {
    let k = 0;
    for (let i = 0; i < ZAAVAR_CHAPTERS.length; i++) {
      if (t >= ZAAVAR_CHAPTERS[i].t - 0.05) {
        k = i;
      }
    }
    return k;
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    const k = getIdxAtTime(t);
    if (k !== activeIdx) {
      setActiveIdx(k);
      // Auto-scroll the chapter into view in the sidebar list
      const btn = chapterBtnRefs.current[k];
      const container = listRef.current;
      if (btn && container && container.scrollHeight > container.clientHeight) {
        const top = btn.offsetTop - container.offsetTop - (container.clientHeight - btn.offsetHeight) / 2;
        container.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const jumpToChapter = (idx: number, scrollVideo = false) => {
    const chap = ZAAVAR_CHAPTERS[idx];
    if (!chap || !videoRef.current) return;
    try {
      videoRef.current.currentTime = chap.t + 0.05;
      videoRef.current.play().catch(() => {});
    } catch {}
    setActiveIdx(idx);
    setCurrentTime(chap.t + 0.05);

    if (scrollVideo) {
      videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="w-full space-y-8 pb-12 text-[color:var(--panel-text)]">
      {/* ── 1. Hero / Video Player Section ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b4f45] to-[#06332c] p-4 text-white shadow-xl sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-white/15">
            <Video className="h-3.5 w-3.5" />
            <span>Амархоум заавар</span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Амархоум хэрхэн ашиглах вэ?
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            СӨХ-ийн админ самбарын үндсэн бүх хэсгийг 3 минут 26 секундд үзүүлнэ. Дараах жагсаалтаас хэрэгтэй хэсгээ сонгоод шууд үзэж болно.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
          {/* Зүүн тал: Видео тоглуулагч */}
          <div className="space-y-3 min-w-0">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/80 shadow-2xl ring-1 ring-white/10">
              <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onSeeked={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                className="h-full w-full object-cover"
              >
                <source src="/zaavar/video.mp4" type="video/mp4" />
                Таны хөтөч видео тоглуулах боломжгүй байна.
              </video>
            </div>

            {/* Хуваагдсан явцын шугам (Timeline Progress Segments) */}
            <div className="flex gap-1 py-1">
              {ZAAVAR_CHAPTERS.map((ch, i) => {
                const isActive = activeIdx === i;
                const frac = Math.min(1, Math.max(0, (currentTime - ch.t) / ch.d));
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => jumpToChapter(i)}
                    title={`${ch.id}. ${ch.title} (${ch.timeStr})`}
                    className="group relative h-4 flex-1 py-1.5 focus:outline-none"
                  >
                    <div
                      className={`h-1.5 w-full rounded-full transition-colors ${
                        isActive ? "bg-white/40" : "bg-white/20 group-hover:bg-white/30"
                      }`}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-100"
                        style={{ width: `${frac * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Одоо үзэж буй хэсгийн гарчиг */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-100/90 font-medium">
              <span>
                Үзэж буй хэсэг:{" "}
                <strong className="text-white font-bold">
                  {activeIdx + 1}. {ZAAVAR_CHAPTERS[activeIdx]?.title}
                </strong>
              </span>
              <span className="font-mono text-xs text-emerald-200/80">
                {ZAAVAR_CHAPTERS[activeIdx]?.timeStr}
              </span>
            </div>
          </div>

          {/* Баруун тал: Бүлгүүдийн жагсаалт */}
          <div
            ref={listRef}
            className="flex flex-col gap-1 max-h-[360px] sm:max-h-[420px] overflow-y-auto rounded-xl bg-black/25 p-2 ring-1 ring-white/10 backdrop-blur-md custom-scrollbar"
          >
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-200/70 border-b border-white/10 mb-1">
              Бүлгүүд ({ZAAVAR_CHAPTERS.length})
            </div>
            {ZAAVAR_CHAPTERS.map((ch, i) => {
              const isActive = activeIdx === i;
              return (
                <button
                  key={ch.id}
                  ref={(el) => {
                    chapterBtnRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => jumpToChapter(i)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs sm:text-sm transition-all ${
                    isActive
                      ? "bg-emerald-400/20 text-white font-semibold ring-1 ring-emerald-400/50 shadow-sm"
                      : "text-emerald-100/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-emerald-400 text-neutral-950 font-black shadow"
                          : "bg-white/15 text-white/90"
                      }`}
                    >
                      {ch.id}
                    </span>
                    <span className="truncate leading-tight">{ch.title}</span>
                  </div>
                  <span className="shrink-0 font-mono text-xs opacity-75">
                    {ch.timeStr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. Steps Grid Section ── */}
      <section className="space-y-5 px-1 sm:px-2">
        <div className="border-b border-[color:var(--surface-border)] pb-3">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[color:var(--panel-text)]">
            Админ самбарын алхамчилсан заавар
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[color:var(--muted-text)]">
            СӨХ-ийн системээ тохируулах болон ажиллуулах дараалал:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {ZAAVAR_CHAPTERS.map((ch, i) => (
            <article
              key={ch.id}
              className="flex flex-col justify-between gap-3.5 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-4 sm:p-5 shadow-sm transition-all hover:border-theme/40 hover:shadow-md text-left"
            >
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-[color:var(--panel-text)]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-theme text-xs font-bold text-white shadow-sm">
                    {ch.id}
                  </span>
                  <span>{ch.title}</span>
                </h3>
                <p className="text-xs sm:text-sm text-[color:var(--muted-text)] leading-relaxed">
                  {ch.desc}
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => jumpToChapter(i, true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-theme/30 bg-theme/5 px-3 py-1.5 text-xs font-semibold text-brand transition-all hover:bg-theme hover:text-white active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Видеон дээр үзэх · {ch.timeStr}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
