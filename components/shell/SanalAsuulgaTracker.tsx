"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  Radio,
  RefreshCw,
  X,
  ChevronRight,
  ChevronDown,
  Users,
  Clock,
  Inbox,
  UserCheck,
  Loader2,
  MessageSquare,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { ICON_STROKE } from "./navConfig";

export interface AsuulgaItem {
  _id: string;
  garchig: string;
  tailbar?: string;
  tuluv: "noots" | "idevkhtei" | "duussan";
  duusakhOgnoo?: string;
  createdAt: string;
  khariultiinToo?: number;
  ajiltniiNer?: string;
}

interface KhariultMur {
  _id: string;
  orshinSuugchNer?: string;
  toot?: string;
  utas?: string;
  createdAt: string;
  khariultuud: {
    asuultiinId: string;
    asuult?: string;
    songogdson?: string[];
    tekst?: string;
  }[];
}

const fetcher = async ([url, tok, bId]: [string, string, string]) => {
  const { data } = await uilchilgee(tok).get(url, {
    params: { baiguullagiinId: bId },
  });
  return (Array.isArray(data?.data) ? data.data : []) as AsuulgaItem[];
};

/** Sub-component: Scrollable fixed-height list of voting residents */
function ResidentVotesList({
  pollId,
  token,
  baiguullagiinId,
}: {
  pollId: string;
  token: string;
  baiguullagiinId: string;
}) {
  const swrKey =
    token && baiguullagiinId && pollId
      ? [`/sanalAsuulga/${pollId}/khariultuud`, token, baiguullagiinId]
      : null;

  const { data: responses = [], isLoading, mutate } = useSWR(
    swrKey,
    async ([url, tok, bId]: [string, string, string]) => {
      const { data } = await uilchilgee(tok).get(url, {
        params: { baiguullagiinId: bId },
      });
      return (Array.isArray(data?.data) ? data.data : []) as KhariultMur[];
    },
    { revalidateOnFocus: true }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-500 mr-2" />
        <span className="text-xs">Уншиж байна...</span>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-[color:var(--panel-text)]/50 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
        Хараахан санал өгсөн оршин суугч байхгүй байна
      </div>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto pr-1 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
      {responses.map((item) => {
        const answersList = (item.khariultuud || [])
          .map((k) =>
            k.songogdson && k.songogdson.length > 0
              ? k.songogdson.join(", ")
              : k.tekst
          )
          .filter(Boolean);

        return (
          <div
            key={item._id}
            className="pt-2 first:pt-0 flex items-start justify-between gap-2"
          >
            <div className="flex items-start gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                {(item.orshinSuugchNer || "О")?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate text-[color:var(--panel-text)]">
                    {item.orshinSuugchNer || "Оршин суугч"}
                  </span>
                  {item.toot && (
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                      {item.toot} тоот
                    </span>
                  )}
                </div>

                {answersList.length > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-0.5">
                    {answersList.join(" | ")}
                  </p>
                )}
              </div>
            </div>

            <div className="text-[10px] text-[color:var(--panel-text)]/40 shrink-0 text-right">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString("mn-MN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SanalAsuulgaTracker() {
  const router = useRouter();
  const { token, ajiltan } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"polls" | "residents">("polls");
  const [expandedPollId, setExpandedPollId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const swrKey =
    token && baiguullagiinId ? ["/sanalAsuulga", token, baiguullagiinId] : null;
  const { data: polls = [], isValidating, mutate } = useSWR(swrKey, fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });

  // Active & Finished polls
  const activePolls = useMemo(
    () => polls.filter((p) => p.tuluv === "idevkhtei"),
    [polls]
  );
  const finishedPolls = useMemo(
    () => polls.filter((p) => p.tuluv === "duussan"),
    [polls]
  );

  const totalResponses = useMemo(
    () => polls.reduce((sum, p) => sum + (p.khariultiinToo || 0), 0),
    [polls]
  );

  const selectedPoll = useMemo(
    () => activePolls[0] || polls[0] || null,
    [activePolls, polls]
  );

  // Close popup when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!token || !baiguullagiinId) return null;

  const hasActive = activePolls.length > 0;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* ── Tracking Bar Button with Glow Effect ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Санал асуулгын хяналт"
        title="Санал асуулгын хяналт"
        className={`group relative flex items-center gap-2 h-9 px-3 rounded-xl font-medium text-xs transition-all duration-300 cursor-pointer select-none ${
          hasActive
            ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 dark:from-emerald-500/25 dark:via-teal-500/25 dark:to-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-sanal-glow"
            : "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/10 text-[color:var(--panel-text)]/80 hover:text-[color:var(--panel-text)]"
        }`}
      >
        {/* Glow pulsing ring overlay when active */}
        {hasActive && (
          <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30 blur-sm group-hover:opacity-60 transition duration-300 animate-pulse pointer-events-none" />
        )}

        <div className="relative flex items-center gap-1.5">
          {hasActive ? (
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          ) : (
            <Vote className="h-4 w-4 opacity-70" strokeWidth={ICON_STROKE} />
          )}

          <span className="hidden sm:inline font-semibold tracking-tight">
            Санал асуулга
          </span>

          {/* Active Polls Count Badge */}
          {hasActive ? (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm">
              {activePolls.length}
            </span>
          ) : polls.length > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-white/20 text-[color:var(--panel-text)]/70">
              {polls.length}
            </span>
          ) : null}
        </div>
      </button>

      {/* ── Animated Arrow-Pointed Popover Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 mt-3 z-[1100] w-[340px] sm:w-[400px] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl text-[color:var(--panel-text)] overflow-hidden"
          >
            {/* Upward Pointing Arrow Pointer */}
            <div className="absolute -top-2 right-5 w-4 h-4 rotate-45 border-t border-l border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 z-10" />

            {/* Modal Header */}
            <div className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Radio className="h-4 w-4 animate-pulse" strokeWidth={ICON_STROKE} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-[color:var(--panel-text)]">
                    Санал асуулгын хяналт
                  </h3>
                  <p className="text-[11px] text-[color:var(--panel-text)]/50">
                    Оршин суугчдын оролцоо
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mutate()}
                  disabled={isValidating}
                  title="Шинэчлэх"
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 text-[color:var(--panel-text)]/60 hover:text-[color:var(--panel-text)] transition"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`}
                    strokeWidth={ICON_STROKE}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Хаах"
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 text-[color:var(--panel-text)]/60 hover:text-[color:var(--panel-text)] transition"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="relative z-20 grid grid-cols-3 gap-2 px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-xs">
                <span className="block text-[10px] font-medium text-[color:var(--panel-text)]/50 uppercase tracking-wider">
                  Идэвхтэй
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {activePolls.length}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-xs">
                <span className="block text-[10px] font-medium text-[color:var(--panel-text)]/50 uppercase tracking-wider">
                  Нийт санал
                </span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {totalResponses}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-xs">
                <span className="block text-[10px] font-medium text-[color:var(--panel-text)]/50 uppercase tracking-wider">
                  Дууссан
                </span>
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {finishedPolls.length}
                </span>
              </div>
            </div>

            {/* Modal Tabs: Polls vs Voting Residents */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("polls")}
                className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "polls"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-[color:var(--panel-text)]/50 hover:text-[color:var(--panel-text)]"
                }`}
              >
                <Vote className="h-3.5 w-3.5" />
                <span>Санал асуулга ({activePolls.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("residents")}
                className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "residents"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-[color:var(--panel-text)]/50 hover:text-[color:var(--panel-text)]"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Санал өгсөн иргэд ({totalResponses})</span>
              </button>
            </div>

            {/* Tab 1: Polls List (with expandable resident list) */}
            {activeTab === "polls" && (
              <div className="relative z-20 max-h-[280px] overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                {polls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-medium text-[color:var(--panel-text)]/60">
                      Санал асуулга бүртгэгдээгүй байна
                    </p>
                  </div>
                ) : activePolls.length > 0 ? (
                  activePolls.map((poll) => {
                    const isExpanded = expandedPollId === poll._id;

                    return (
                      <div
                        key={poll._id}
                        className="pt-2.5 first:pt-0 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => {
                              setIsOpen(false);
                              router.push("/medegdel/sanalAsuulga");
                            }}
                            className="text-xs font-semibold text-[color:var(--panel-text)] hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer line-clamp-2"
                          >
                            {poll.garchig}
                          </h4>
                          <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            Явагдаж байна
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[color:var(--panel-text)]/60">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPollId(isExpanded ? null : poll._id)
                            }
                            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                          >
                            <Users className="h-3 w-3" />
                            <span>{poll.khariultiinToo || 0} оршин суугч хариулсан</span>
                            <ChevronDown
                              className={`h-3 w-3 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {poll.duusakhOgnoo && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" />
                              {new Date(poll.duusakhOgnoo).toLocaleDateString(
                                "mn-MN"
                              )}
                            </span>
                          )}
                        </div>

                        {/* Expandable Scrollable Fixed-Height Resident Votes List */}
                        {isExpanded && (
                          <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                Санал өгсөн иргэдийн жагсаалт
                              </span>
                              <span className="text-[10px] text-slate-400">
                                (Нийт {poll.khariultiinToo || 0})
                              </span>
                            </div>

                            <ResidentVotesList
                              pollId={poll._id}
                              token={token}
                              baiguullagiinId={baiguullagiinId}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-[color:var(--panel-text)]/60">
                      Одоогоор идэвхтэй санал асуулга байхгүй байна
                    </p>
                    <p className="text-[11px] text-[color:var(--panel-text)]/40 mt-1">
                      Нийт {polls.length} санал асуулга хадгалагдсан
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Scrollable fixed-height list of all voting residents */}
            {activeTab === "residents" && (
              <div className="relative z-20 p-3 space-y-2">
                {selectedPoll ? (
                  <div>
                    <div className="mb-2 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium flex items-center justify-between">
                      <span className="truncate max-w-[240px]">
                        📌 {selectedPoll.garchig}
                      </span>
                      <span className="font-bold shrink-0">
                        {selectedPoll.khariultiinToo || 0} санал
                      </span>
                    </div>

                    <ResidentVotesList
                      pollId={selectedPoll._id}
                      token={token}
                      baiguullagiinId={baiguullagiinId}
                    />
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[color:var(--panel-text)]/50">
                    Сонгосон санал асуулга олдсонгүй
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Navigation Button */}
            <div className="relative z-20 p-3 bg-slate-50/90 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/medegdel/sanalAsuulga");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition duration-150 cursor-pointer"
              >
                <span>Санал асуулга цэс рүү очих</span>
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
