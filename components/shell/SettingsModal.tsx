"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Type, X } from "lucide-react";
import { ModalPortal } from "./ModalPortal";
import { ICON_STROKE } from "./navConfig";
import {
  DEFAULT_FONT_INDEX,
  FONT_SIZE_OPTIONS,
  applyStoredFontSize,
  persistFontSize,
} from "./fontSize";

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: "general" | "font-size";
  userName: string;
  organisationName: string;
}

export default function SettingsModal({
  open,
  onClose,
  initialTab = "general",
  userName,
  organisationName,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"general" | "font-size">(initialTab);
  const [fontIndex, setFontIndex] = useState(DEFAULT_FONT_INDEX);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (open) setFontIndex(applyStoredFontSize());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleFontSizeChange = (index: number) => {
    setFontIndex(index);
    persistFontSize(index);
  };

  const progress = (fontIndex / (FONT_SIZE_OPTIONS.length - 1)) * 100;

  const tabs = [
    { key: "general" as const, label: "Ерөнхий", icon: Settings },
    { key: "font-size" as const, label: "Үсгийн хэмжээ", icon: Type },
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
          aria-label="Тохиргоо"
          className="shell-dialog relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--panel-text)]/12 bg-[color:var(--surface-bg)] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.5)]"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--panel-text)]/10 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.015em] text-[color:var(--panel-text)]">
              Тохиргоо
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

          <div className="scrollable max-h-[60vh] min-h-[360px] overflow-y-auto p-6">
            {tab === "general" ? (
              <div className="space-y-5">
                <section className="rounded-xl border border-[color:var(--panel-text)]/10 p-5">
                  <h3 className="mb-2 text-base font-semibold text-[color:var(--panel-text)]">
                    Дэлгэрэнгүй тохиргоо
                  </h3>
                  <p className="mb-5 max-w-[58ch] text-sm leading-relaxed text-[color:var(--panel-text)]/65">
                    Барилга, төлбөрийн загвар, эрхийн тохиргоо зэрэг системийн
                    бүх тохиргоо тусдаа хуудсанд байрлана.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/tokhirgoo");
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--theme)] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:opacity-92 active:scale-[0.98]"
                  >
                    <Settings className="h-4 w-4" strokeWidth={ICON_STROKE} />
                    Тохиргоо руу очих
                  </button>
                </section>

                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { term: "Хэрэглэгч", value: userName },
                    { term: "Байгууллага", value: organisationName || "—" },
                  ].map(({ term, value }) => (
                    <div
                      key={term}
                      className="rounded-xl border border-[color:var(--panel-text)]/10 px-4 py-3.5"
                    >
                      <dt className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--panel-text)]/45">
                        {term}
                      </dt>
                      <dd className="truncate text-sm font-medium text-[color:var(--panel-text)]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <div className="space-y-5">
                <section className="rounded-xl border border-[color:var(--panel-text)]/10 px-6 py-10 text-center">
                  <p className="mb-3 text-xs uppercase tracking-wider text-[color:var(--panel-text)]/45">
                    Жишээ текст
                  </p>
                  <p
                    className="font-semibold text-[color:var(--panel-text)] transition-[font-size] duration-200"
                    style={{ fontSize: FONT_SIZE_OPTIONS[fontIndex].size }}
                  >
                    Энэ бол жишээ текст юм
                  </p>
                </section>

                <section className="rounded-xl border border-[color:var(--panel-text)]/10 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[color:var(--panel-text)]">
                      {FONT_SIZE_OPTIONS[fontIndex].label}
                    </span>
                    <span className="rounded-md bg-[color:var(--panel-text)]/8 px-2.5 py-1 text-xs font-semibold tabular-nums text-[color:var(--panel-text)]">
                      {FONT_SIZE_OPTIONS[fontIndex].size}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={FONT_SIZE_OPTIONS.length - 1}
                    value={fontIndex}
                    aria-label="Үсгийн хэмжээ"
                    onChange={(e) =>
                      handleFontSizeChange(parseInt(e.target.value, 10))
                    }
                    className="slider-thumb h-2 w-full cursor-pointer appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--theme) 0%, var(--theme) ${progress}%, color-mix(in oklch, var(--panel-text), transparent 85%) ${progress}%, color-mix(in oklch, var(--panel-text), transparent 85%) 100%)`,
                    }}
                  />
                </section>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Жижиг", index: 2 },
                    { label: "Дунд", index: 6 },
                    { label: "Том", index: 10 },
                  ].map(({ label, index }) => {
                    const active = fontIndex === index;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleFontSizeChange(index)}
                        className={`rounded-lg border py-2.5 text-sm font-medium transition-colors duration-200 active:scale-[0.98] ${
                          active
                            ? "border-transparent bg-[color:var(--theme)] text-white"
                            : "border-[color:var(--panel-text)]/12 text-[color:var(--panel-text)]/75 hover:bg-[color:var(--panel-text)]/5 hover:text-[color:var(--panel-text)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
