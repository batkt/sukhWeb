"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Inbox,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import { ICON_STROKE } from "./navConfig";
import type { MedegdelItem } from "./useShellNotifications";

interface Props {
  open: boolean;
  onClose: () => void;
  sanalList: MedegdelItem[];
  medegdelList: MedegdelItem[];
  unreadSanalCount: number;
  unreadMedegdelCount: number;
  onOpenMedegdel: (item: MedegdelItem) => void;
}

const formatRelativeTime = (value?: string | Date) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Дөнгөж сая";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин өмнө`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} цагийн өмнө`;
  if (diffSec < 172800) return "Өчигдөр";

  return d.toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isSanalType = (t?: string) => {
  const x = (t ?? "").toLowerCase().trim();
  return x === "sanal" || x === "санал";
};

const isGomdolType = (t?: string) => {
  const x = (t ?? "").toLowerCase().trim();
  return x === "gomdol" || x === "гомдол";
};

function EmptyState({ label, type }: { label: string; type: "sanal" | "medegdel" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center animate-in fade-in duration-300">
      <div className="relative grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-[color:var(--surface-hover)] to-blue-500/10 border border-[color:var(--panel-text)]/10 shadow-inner">
        {type === "sanal" ? (
          <MessageSquare className="h-7 w-7 text-emerald-500/80" strokeWidth={1.5} />
        ) : (
          <Bell className="h-7 w-7 text-blue-500/80" strokeWidth={1.5} />
        )}
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500/20 border-2 border-[color:var(--surface-bg)] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
      <div className="space-y-1 mt-1">
        <p className="text-sm font-semibold text-[color:var(--panel-text)]">{label}</p>
        <p className="max-w-[26ch] text-xs leading-relaxed text-[color:var(--muted-text)]">
          Шинэ мэдэгдэл, хүсэлт ирмэгц энд шууд харагдах болно.
        </p>
      </div>
    </div>
  );
}

export default function NotificationsPanel({
  open,
  onClose,
  sanalList,
  medegdelList,
  unreadSanalCount,
  unreadMedegdelCount,
  onOpenMedegdel,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"sanal" | "medegdel">("sanal");
  const [khaaj, setKhaaj] = useState(false);
  const khaakhTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const totalUnread = unreadSanalCount + unreadMedegdelCount;

  const khaaya = useCallback(() => {
    if (khaakhTimerRef.current != null) return;
    setKhaaj(true);
    khaakhTimerRef.current = window.setTimeout(() => {
      khaakhTimerRef.current = null;
      setKhaaj(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    if (khaakhTimerRef.current != null) {
      window.clearTimeout(khaakhTimerRef.current);
      khaakhTimerRef.current = null;
    }
    setKhaaj(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") khaaya();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, khaaya]);

  if (!open) return null;

  const items = tab === "sanal" ? sanalList : medegdelList;

  return (
    <>
      {/* Dim Backdrop with blur */}
      <button
        type="button"
        aria-label="Хаах"
        onClick={khaaya}
        className={`fixed inset-0 z-[1290] cursor-default bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          khaaj ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Slide-over panel - FULL HEIGHT from top 0 to bottom 0 */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-label="Мэдэгдлийн төв"
        className={`fixed inset-y-0 right-0 top-0 bottom-0 z-[1300] flex w-[min(420px,100vw)] h-full flex-col border-l border-[color:var(--panel-text)]/10 bg-[color:var(--surface-bg)] shadow-[-16px_0_48px_-12px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${
          khaaj ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-[color:var(--panel-text)]/10 bg-[color:var(--surface-bg)]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Bell className="w-4.5 h-4.5" strokeWidth={ICON_STROKE} />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[color:var(--surface-bg)] animate-pulse">
                  {totalUnread}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[color:var(--panel-text)]">
                Мэдэгдэл
              </h2>
              <p className="text-[11px] text-[color:var(--muted-text)]">
                {totalUnread > 0 ? `${totalUnread} уншаагүй мэдэгдэл байна` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={khaaya}
            aria-label="Хаах"
            className="grid h-8 w-8 place-items-center rounded-xl text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)] transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </header>

        {/* Tab Switcher Pills */}
        <div className="p-3 border-b border-[color:var(--panel-text)]/10 bg-[color:var(--surface-hover)]/20">
          <div
            role="tablist"
            className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[color:var(--surface-hover)]/60 border border-[color:var(--panel-text)]/10"
          >
            <button
              role="tab"
              aria-selected={tab === "sanal"}
              type="button"
              onClick={() => setTab("sanal")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                tab === "sanal"
                  ? "bg-white dark:bg-slate-800 text-[color:var(--panel-text)] shadow-sm font-bold scale-[1.01]"
                  : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Санал хүсэлт</span>
              {unreadSanalCount > 0 && (
                <span className="ml-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {unreadSanalCount}
                </span>
              )}
            </button>

            <button
              role="tab"
              aria-selected={tab === "medegdel"}
              type="button"
              onClick={() => setTab("medegdel")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                tab === "medegdel"
                  ? "bg-white dark:bg-slate-800 text-[color:var(--panel-text)] shadow-sm font-bold scale-[1.01]"
                  : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
              }`}
            >
              <Bell className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Мэдэгдэл</span>
              {unreadMedegdelCount > 0 && (
                <span className="ml-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.2 text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {unreadMedegdelCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {items.length === 0 ? (
            <EmptyState
              type={tab}
              label={
                tab === "sanal"
                  ? "Танд ирсэн санал хүсэлт алга"
                  : "Шинэ мэдэгдэл бүртгэгдээгүй байна"
              }
            />
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const unread =
                  tab === "sanal"
                    ? item.status === "pending" && !item.kharsanEsekh
                    : !item.kharsanEsekh;
                const sanalItem = isSanalType(item.turul);
                const gomdolItem = isGomdolType(item.turul);

                const typeLabel =
                  tab === "medegdel"
                    ? "Мэдэгдэл"
                    : gomdolItem
                    ? "Гомдол"
                    : "Санал";

                const stamp = formatRelativeTime(item.createdAt);

                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => {
                        khaaya();
                        if (tab === "sanal") {
                          router.push(`/medegdel/sanalKhuselt?id=${item._id}`);
                        } else {
                          onOpenMedegdel(item);
                        }
                      }}
                      className={`group relative flex w-full items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                        unread
                          ? "border-emerald-500/30 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] shadow-sm"
                          : "border-[color:var(--panel-text)]/8 bg-[color:var(--surface-hover)]/20 hover:bg-[color:var(--surface-hover)]/60 hover:border-[color:var(--panel-text)]/15"
                      } hover:translate-x-0.5`}
                    >
                      {/* Left Icon Badge */}
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                          gomdolItem
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                            : sanalItem
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {gomdolItem ? (
                          <AlertCircle className="h-4.5 w-4.5" strokeWidth={ICON_STROKE} />
                        ) : tab === "sanal" ? (
                          <MessageSquare className="h-4.5 w-4.5" strokeWidth={ICON_STROKE} />
                        ) : (
                          <Bell className="h-4.5 w-4.5" strokeWidth={ICON_STROKE} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Meta Tags & Time */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                gomdolItem
                                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                  : sanalItem
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              }`}
                            >
                              {typeLabel}
                            </span>
                            {unread && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Шинэ
                              </span>
                            )}
                          </div>

                          {stamp && (
                            <span className="flex items-center gap-1 text-[10px] text-[color:var(--muted-text)] shrink-0">
                              <Clock className="w-3 h-3 opacity-60" />
                              {stamp}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-[13px] font-semibold text-[color:var(--panel-text)] leading-snug truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title || (tab === "sanal" ? "Санал хүсэлт" : "Мэдэгдэл")}
                        </h4>

                        {/* Message Preview */}
                        {item.message && (
                          <p className="text-xs text-[color:var(--muted-text)] leading-relaxed line-clamp-2">
                            {item.message}
                          </p>
                        )}
                      </div>

                      {/* Chevron Arrow */}
                      <ChevronRight
                        className="mt-1 h-4 w-4 shrink-0 text-[color:var(--muted-text)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-emerald-500"
                        strokeWidth={2}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Link */}
        <footer className="shrink-0 p-3 border-t border-[color:var(--panel-text)]/10 bg-[color:var(--surface-bg)]/80 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              khaaya();
              router.push(
                tab === "sanal"
                  ? "/medegdel/sanalKhuselt"
                  : "/medegdel/medegdel?tab=tulult",
              );
            }}
            className="flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all hover:scale-[1.01]"
          >
            <span>{tab === "sanal" ? "Бүх санал хүсэлт рүү шилжих" : "Бүх мэдэгдэл рүү шилжих"}</span>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </footer>
      </aside>
    </>
  );
}
