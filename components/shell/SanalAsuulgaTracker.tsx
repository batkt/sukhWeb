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

  const { data: responses = [], isLoading } = useSWR(
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
      <div className="flex items-center justify-center py-6 text-[color:var(--muted-text)]">
        <Loader2 className="h-4 w-4 animate-spin text-brand mr-2" />
        <span className="text-xs">Уншиж байна...</span>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-[color:var(--panel-text)]/50 bg-[color:var(--surface-hover)]/50 rounded-xl">
        Хараахан санал өгсөн оршин суугч байхгүй байна
      </div>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto pr-1 space-y-2 divide-y divide-[color:var(--surface-border)] custom-scrollbar">
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
              <div className="h-7 w-7 rounded-full bg-theme/10 text-brand font-normal flex items-center justify-center text-[11px] shrink-0">
                {(item.orshinSuugchNer || "О")?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-normal truncate text-[color:var(--panel-text)]">
                    {item.orshinSuugchNer || "Оршин суугч"}
                  </span>
                  {item.toot && (
                    <span className="px-1.5 py-0.2 rounded-md bg-[color:var(--surface-hover)] text-[10px] font-normal text-[color:var(--muted-text)] shrink-0">
                      {item.toot} тоот
                    </span>
                  )}
                </div>

                {answersList.length > 0 && (
                  <p className="text-[11px] text-brand font-normal truncate mt-0.5">
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
      {/* ── Tracking Bar Button with Warm Amber Glow when Active ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Санал асуулгын хяналт"
        title="Санал асуулгын хяналт"
        className={`group relative flex h-9 cursor-pointer select-none items-center gap-2 rounded-[10px] border px-3 text-[13px] transition-colors ${
          hasActive
            ? "border-[color:var(--shell-line,var(--surface-border))] bg-transparent text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
            : "border-[color:var(--surface-border)] bg-transparent text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
        }`}
      >

        <div className="relative flex items-center gap-1.5">
          {hasActive ? (
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-warning" />
            </span>
          ) : (
            <Vote className="h-4 w-4 opacity-70" strokeWidth={ICON_STROKE} />
          )}

          <span className="hidden sm:inline font-normal tracking-tight">
            Санал асуулга
          </span>

          {/* Active Polls Count Badge */}
          {hasActive ? (
            <span className="ml-0.5 min-w-[20px] rounded-full bg-warning/15 px-1.5 text-center text-[12px] tabular-nums text-warning">
              {activePolls.length}
            </span>
          ) : polls.length > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-normal bg-[color:var(--panel)] dark:bg-white/20 text-[color:var(--panel-text)]/70">
              {polls.length}
            </span>
          ) : null}
        </div>
      </button>

      {/* ── Animated Arrow-Pointed Popover Modal (Original Compact Size) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 mt-3 z-[1100] w-[340px] sm:w-[400px] rounded-2xl border border-[color:var(--surface-border)]/90 bg-white/95 backdrop-blur-xl shadow-2xl text-[color:var(--panel-text)] overflow-hidden"
          >
            {/* Upward Pointing Arrow Pointer */}
            <div className="absolute -top-2 right-5 w-4 h-4 rotate-45 border-t border-l border-[color:var(--surface-border)]/90 bg-[color:var(--surface-bg)] z-10" />

            {/* Modal Header */}
            <div className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-warning/10 text-warning">
                  <Radio className="h-4 w-4 animate-pulse" strokeWidth={ICON_STROKE} />
                </div>
                <div>
                  <h3 className="text-sm font-normal tracking-tight text-[color:var(--panel-text)]">
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
                  className="p-1.5 rounded-lg hover:bg-[color:var(--panel)]/60 dark:hover:bg-white/10 text-[color:var(--panel-text)]/60 hover:text-[color:var(--panel-text)] transition cursor-pointer"
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
                  className="p-1.5 rounded-lg hover:bg-[color:var(--panel)]/60 dark:hover:bg-white/10 text-[color:var(--panel-text)]/60 hover:text-[color:var(--panel-text)] transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar: Явагдаж буй/Идэвхтэй = Шар, Дууссан = Ногоон */}
            <div className="relative z-20 grid grid-cols-3 gap-2 px-4 py-2.5 bg-[color:var(--surface-hover)]/50 border-b border-[color:var(--surface-border)] text-center">
              {/* ИДЭВХТЭЙ — ШАР / AMBER */}
              <div className="p-2 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]/60 shadow-xs">
                <span className="block text-[10px] font-normal text-[color:var(--panel-text)]/50 uppercase tracking-wider">
                  Идэвхтэй
                </span>
                <span className="text-base font-normal text-warning">
                  {activePolls.length}
                </span>
              </div>

              {/* НИЙТ САНАЛ — BLUE */}
              <div className="p-2 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]/60 shadow-xs">
                <span className="block text-[10px] font-normal text-[color:var(--panel-text)]/50 uppercase tracking-wider">
                  Нийт санал
                </span>
                <span className="text-base font-normal text-brand">
                  {totalResponses}
                </span>
              </div>

              {/* ДУУССАН — НОГООН / EMERALD */}
              <div className="p-2 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]/60 shadow-xs">
                <span className="block text-[10px] font-normal text-[color:var(--panel-text)]/50 uppercase tracking-wider">
                  Дууссан
                </span>
                <span className="text-base font-normal text-brand">
                  {finishedPolls.length}
                </span>
              </div>
            </div>

            {/* Modal Tabs: Polls vs Voting Residents */}
            <div className="flex border-b border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/50 px-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("polls")}
                className={`flex-1 pb-2 text-xs font-normal border-b-2 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "polls"
                    ? "border-theme text-brand"
                    : "border-transparent text-[color:var(--panel-text)]/50 hover:text-[color:var(--panel-text)]"
                }`}
              >
                <Vote className="h-3.5 w-3.5" />
                <span>Санал асуулга ({activePolls.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("residents")}
                className={`flex-1 pb-2 text-xs font-normal border-b-2 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "residents"
                    ? "border-theme text-brand"
                    : "border-transparent text-[color:var(--panel-text)]/50 hover:text-[color:var(--panel-text)]"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Санал өгсөн иргэд ({totalResponses})</span>
              </button>
            </div>

            {/* Tab 1: Polls List (with expandable resident list) */}
            {activeTab === "polls" && (
              <div className="relative z-20 max-h-[280px] overflow-y-auto p-3 space-y-2 divide-y divide-[color:var(--surface-border)] custom-scrollbar">
                {polls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Inbox className="h-8 w-8 text-[color:var(--muted-text)] mb-2" />
                    <p className="text-xs font-normal text-[color:var(--panel-text)]/60">
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
                            className="text-xs font-normal text-[color:var(--panel-text)] hover:text-brand dark:hover:text-brand transition cursor-pointer line-clamp-2 flex-1"
                          >
                            {poll.garchig}
                          </h4>
                          {/* Явагдаж байна — ШАР / AMBER badge */}
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-normal rounded-full bg-warning/10 text-warning border border-warning/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                            Явагдаж байна
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[color:var(--panel-text)]/60">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPollId(isExpanded ? null : poll._id)
                            }
                            className="flex items-center gap-1 text-brand hover:underline font-normal cursor-pointer"
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
                            <span className="flex items-center gap-1 text-[10px] text-[color:var(--muted-text)] font-normal">
                              <Clock className="h-3 w-3 text-[color:var(--muted-text)]" />
                              {new Date(poll.duusakhOgnoo).toLocaleDateString(
                                "mn-MN"
                              )}
                            </span>
                          )}
                        </div>

                        {/* Expandable Scrollable Fixed-Height Resident Votes List */}
                        {isExpanded && (
                          <div className="mt-2 p-2 rounded-xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)]">
                            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[color:var(--surface-border)]/50">
                              <span className="text-[11px] font-normal text-[color:var(--panel-text)]">
                                Санал өгсөн иргэдийн жагсаалт
                              </span>
                              <span className="text-[10px] text-[color:var(--muted-text)]">
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
                    <div className="mb-2 px-2 py-1 rounded-lg bg-theme/10 text-brand text-[11px] font-normal flex items-center justify-between">
                      <span className="truncate max-w-[240px]">
                        📌 {selectedPoll.garchig}
                      </span>
                      <span className="font-normal shrink-0">
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
            <div className="relative z-20 p-3 bg-[color:var(--surface-hover)]/90 border-t border-[color:var(--surface-border)]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/medegdel/sanalAsuulga");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-theme hover:bg-theme active:scale-[0.98] text-white font-normal text-xs shadow-md shadow-theme/20 transition duration-150 cursor-pointer"
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
