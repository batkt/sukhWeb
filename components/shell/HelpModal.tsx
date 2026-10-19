"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { HelpCircle, MessageSquare, X } from "lucide-react";
import { ModalPortal } from "./ModalPortal";
import { ICON_STROKE } from "./navConfig";

const AdminZaavar = lazy(() => import("@/components/shell/AdminZaavar"));
const ChatWidget = lazy(() => import("@/components/ChatWidget"));

function BodyFallback() {
  return (
    <div className="space-y-4 p-8" aria-busy="true">
      <div className="h-64 w-full animate-pulse rounded-2xl bg-[color:var(--panel-text)]/5" />
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
  initialTab = "instructions",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: "instructions" | "chat";
}) {
  const [tab, setTab] = useState<"instructions" | "chat">(initialTab);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const garchig = "Тусламж ба заавар";
  const GarchigIcon = HelpCircle;

  const tabs = [
    {
      key: "instructions" as const,
      label: "Системийн заавар",
      icon: HelpCircle,
    },
    { key: "chat" as const, label: "Шууд чат", icon: MessageSquare },
  ];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-5">
        <button
          type="button"
          aria-label="Хаах"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={garchig}
          className="shell-dialog relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[color:var(--panel-text)]/12 bg-[color:var(--surface-bg)] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.6)]"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--panel-text)]/10 px-5 sm:px-6 py-3.5 sm:py-4">
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-[color:var(--panel-text)]">
              <GarchigIcon
                className="h-5 w-5 text-brand"
                strokeWidth={ICON_STROKE}
              />
              {garchig}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Хаах"
              className="grid h-9 w-9 place-items-center rounded-xl text-[color:var(--panel-text)]/60 transition-colors duration-200 hover:bg-[color:var(--panel-text)]/8 hover:text-[color:var(--panel-text)]"
            >
              <X className="h-5 w-5" strokeWidth={ICON_STROKE} />
            </button>
          </header>

          <div
            role="tablist"
            className="flex shrink-0 gap-1 border-b border-[color:var(--panel-text)]/10 px-4 py-2"
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
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-theme text-white shadow-sm"
                      : "text-[color:var(--panel-text)]/60 hover:bg-[color:var(--panel-text)]/5 hover:text-[color:var(--panel-text)]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="scrollable min-h-[480px] flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <Suspense fallback={<BodyFallback />}>
              {tab === "instructions" ? (
                <AdminZaavar />
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
