"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, Inbox, MessageSquare, X } from "lucide-react";
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

const dateFmt = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("mn-MN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const isSanalType = (t?: string) => {
  const x = (t ?? "").toLowerCase().trim();
  return x === "sanal" || x === "санал";
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--panel-text)]/6">
        <Inbox
          className="h-5 w-5 opacity-45"
          strokeWidth={ICON_STROKE}
          aria-hidden
        />
      </div>
      <p className="text-sm text-[color:var(--panel-text)]/70">{label}</p>
      <p className="max-w-[24ch] text-xs leading-relaxed text-[color:var(--panel-text)]/45">
        Шинэ мэдэгдэл ирмэгц энд шууд харагдана.
      </p>
    </div>
  );
}

/**
 * Slide-over panel docked to the right edge, under the bell that opens it.
 * Replaces the old 400px dropdown that was duplicated in full for desktop and
 * mobile.
 */
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

  /**
   * Гарах анимац. Компонент нь нээгдэхдээ л анимацтай байсан бөгөөд
   * хаагдахдаа шууд unmount болж, гэнэт алга болдог байв. Иймд эхлээд
   * гарах анимацыг тоглуулж, дараа нь жинхэнэ onClose-ыг дуудна.
   */
  const [khaaj, setKhaaj] = useState(false);
  const khaakhTimerRef = useRef<number | null>(null);

  const khaaya = useCallback(() => {
    if (khaakhTimerRef.current != null) return;
    setKhaaj(true);
    khaakhTimerRef.current = window.setTimeout(() => {
      khaakhTimerRef.current = null;
      setKhaaj(false);
      onClose();
    }, 180);
  }, [onClose]);

  // Дахин нээгдэхэд өмнөх хаалтын төлөв үлдэхээс сэргийлнэ
  useEffect(() => {
    if (!open) return;
    if (khaakhTimerRef.current != null) {
      window.clearTimeout(khaakhTimerRef.current);
      khaakhTimerRef.current = null;
    }
    setKhaaj(false);
  }, [open]);

  useEffect(
    () => () => {
      if (khaakhTimerRef.current != null)
        window.clearTimeout(khaakhTimerRef.current);
    },
    [],
  );
  const panelRef = useRef<HTMLDivElement>(null);

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
      <button
        type="button"
        aria-label="Хаах"
        onClick={khaaya}
        className={`shell-backdrop fixed inset-0 z-[1180] cursor-default bg-black/25 ${
          khaaj ? "shell-backdrop-out" : ""
        }`}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-label="Мэдэгдэл"
        className={`shell-slideover fixed bottom-0 right-0 z-[1190] flex w-[min(380px,100vw)] flex-col border-l border-[color:var(--panel-text)]/10 bg-[color:var(--surface-bg)] shadow-[0_24px_64px_-24px_rgba(0,0,0,0.45)] ${
          khaaj ? "shell-slideover-out" : ""
        }`}
        style={{ top: "var(--shell-topbar-h)" }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--panel-text)]/10 px-5 py-4">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[color:var(--panel-text)]">
            Мэдэгдэл
          </h2>
          <button
            type="button"
            onClick={khaaya}
            aria-label="Хаах"
            className="grid h-8 w-8 place-items-center rounded-lg text-[color:var(--panel-text)]/60 transition-colors duration-200 hover:bg-[color:var(--panel-text)]/8 hover:text-[color:var(--panel-text)]"
          >
            <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </button>
        </header>

        <div
          role="tablist"
          className="flex shrink-0 gap-1 border-b border-[color:var(--panel-text)]/10 px-3 py-2"
        >
          {(
            [
              {
                key: "sanal" as const,
                label: "Санал хүсэлт",
                icon: MessageSquare,
                count: unreadSanalCount,
              },
              {
                key: "medegdel" as const,
                label: "Мэдэгдэл",
                icon: Bell,
                count: unreadMedegdelCount,
              },
            ]
          ).map(({ key, label, icon: Icon, count }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                  active
                    ? "bg-[color:var(--panel-text)]/8 text-[color:var(--panel-text)]"
                    : "text-[color:var(--panel-text)]/55 hover:bg-[color:var(--panel-text)]/5 hover:text-[color:var(--panel-text)]/85"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                {label}
                {count > 0 && (
                  <span className="ml-0.5 rounded bg-[color:var(--theme)]/15 px-1.5 py-px text-[10px] font-bold tabular-nums text-[color:var(--theme)]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="scrollable min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {items.length === 0 ? (
            <EmptyState
              label={
                tab === "sanal"
                  ? "Уншаагүй санал хүсэлт алга"
                  : "Уншаагүй мэдэгдэл алга"
              }
            />
          ) : (
            <ul className="space-y-0.5">
              {items.map((item) => {
                const unread =
                  tab === "sanal"
                    ? item.status === "pending" && !item.kharsanEsekh
                    : !item.kharsanEsekh;
                const sanalItem = isSanalType(item.turul);
                const typeLabel =
                  tab === "medegdel"
                    ? "Мэдэгдэл"
                    : sanalItem
                      ? "Санал"
                      : "Гомдол";
                const stamp = dateFmt(item.createdAt);

                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (tab === "sanal") {
                          khaaya();
                          router.push(`/medegdel/sanalKhuselt?id=${item._id}`);
                        } else {
                          khaaya();
                          onOpenMedegdel(item);
                        }
                      }}
                      className={`group flex w-full items-start gap-3 rounded-xl border-l-2 px-3 py-3 text-left transition-colors duration-200 ${
                        unread
                          ? "border-[color:var(--theme)] bg-[color:var(--theme)]/6 hover:bg-[color:var(--theme)]/12"
                          : "border-transparent hover:bg-[color:var(--panel-text)]/5"
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 ${unread ? "text-[color:var(--theme)]" : "text-[color:var(--panel-text)]/40"}`}
                      >
                        {tab === "sanal" ? (
                          <MessageSquare
                            className="h-4 w-4"
                            strokeWidth={ICON_STROKE}
                          />
                        ) : (
                          <Bell className="h-4 w-4" strokeWidth={ICON_STROKE} />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-[color:var(--panel-text)]/8 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-[color:var(--panel-text)]/60">
                            {typeLabel}
                          </span>
                          {unread && (
                            <span className="rounded bg-[color:var(--theme)]/15 px-1.5 py-px text-[10px] font-semibold text-[color:var(--theme)]">
                              Шинэ
                            </span>
                          )}
                          {stamp && (
                            <span className="text-[10px] tabular-nums text-[color:var(--panel-text)]/40">
                              {stamp}
                            </span>
                          )}
                        </span>

                        <span className="block truncate text-[13px] font-semibold text-[color:var(--panel-text)]">
                          {item.title || "Мэдэгдэл"}
                        </span>
                        {item.message && (
                          <span className="mt-0.5 block truncate text-xs text-[color:var(--panel-text)]/60">
                            {item.message}
                          </span>
                        )}
                      </span>

                      <ChevronRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--panel-text)]/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[color:var(--panel-text)]/50"
                        strokeWidth={ICON_STROKE}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-[color:var(--panel-text)]/10 px-3 py-2.5">
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
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-[color:var(--theme)] transition-colors duration-200 hover:bg-[color:var(--theme)]/8"
          >
            Бүгдийг харах
            <ChevronRight className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </button>
        </footer>
      </aside>
    </>
  );
}
