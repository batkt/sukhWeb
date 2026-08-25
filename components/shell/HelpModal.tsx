"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { LifeBuoy, MessageSquare, X } from "lucide-react";
import { ModalPortal } from "./ModalPortal";
import { ICON_STROKE } from "./navConfig";

const TuslamjTokhirgoo = lazy(() => import("@/app/(shell)/tokhirgoo/TuslamjTokhirgoo"));
const ChatWidget = lazy(() => import("@/components/ChatWidget"));

function BodyFallback() {
  return (
    <div className="space-y-3 p-8" aria-busy="true">
      {[92, 76, 84, 60].map((w, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-[color:var(--panel-text)]/8"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export default function HelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"instructions" | "chat">("instructions");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tabs = [
    {
      key: "instructions" as const,
      label: "Системийн заавар",
      icon: LifeBuoy,
    },
    { key: "chat" as const, label: "Шууд чат", icon: MessageSquare },
  ];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
        <button
          type="button"
          aria-label="Хаах"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/45"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ерөнхий тусламж"
          className="shell-dialog relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[color:var(--panel-text)]/12 bg-[color:var(--surface-bg)] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.5)]"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--panel-text)]/10 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.015em] text-[color:var(--panel-text)]">
              <LifeBuoy
                className="h-5 w-5 text-[color:var(--theme)]"
                strokeWidth={ICON_STROKE}
              />
              Ерөнхий тусламж
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Хаах"
              className="grid h-9 w-9 place-items-center rounded-lg text-[color:var(--panel-text)]/60 transition-colors duration-200 hover:bg-[color:var(--panel-text)]/8 hover:text-[color:var(--panel-text)]"
            >
              <X className="h-5 w-5" strokeWidth={ICON_STROKE} />
            </button>
          </header>

          <div
            role="tablist"
            className="flex shrink-0 gap-1 border-b border-[color:var(--panel-text)]/10 px-4 py-2.5"
          >
            {tabs.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-[color:var(--panel-text)]/8 text-[color:var(--panel-text)]"
                      : "text-[color:var(--panel-text)]/55 hover:bg-[color:var(--panel-text)]/5 hover:text-[color:var(--panel-text)]/85"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="scrollable min-h-[480px] flex-1 overflow-y-auto">
            <Suspense fallback={<BodyFallback />}>
              {tab === "instructions" ? (
                <TuslamjTokhirgoo compact />
              ) : (
                <ChatWidget inline />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
