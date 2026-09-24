"use client";

import React from "react";

/** Ангилал бүрийг тоотой нь товч болгож харуулна — «Бүгд 42 | Гэрээ 12 | …» */
export default function AngilalChips({
  angilaluud,
  niit,
  songogdson,
  onChange,
  loading,
}: {
  angilaluud: { value: string; label: string; too: number }[];
  niit: number;
  songogdson: string;
  onChange: (value: string) => void;
  loading?: boolean;
}) {
  const chip = (value: string, label: string, too: number) => {
    const idevkhtei = songogdson === value;
    return (
      <button
        key={value || "__bugd"}
        type="button"
        onClick={() => onChange(value)}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors ${
          idevkhtei
            ? "border-theme bg-theme/10 font-medium text-brand"
            : "border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] text-[color:var(--muted-text)] hover:border-[color:var(--ctl-border-hover)] hover:text-[color:var(--panel-text)]"
        }`}
      >
        {label}
        <span
          className={`rounded-full px-1.5 text-[11px] tabular-nums ${
            idevkhtei ? "bg-theme/15" : "bg-[color:var(--surface-hover)]"
          }`}
        >
          {too}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chip("", "Бүгд", niit)}
      {angilaluud.map((a) => chip(a.value, a.label, a.too))}
      {loading && angilaluud.length === 0 && (
        <span className="text-xs text-[color:var(--muted-text)]">Ангилал ачаалж байна...</span>
      )}
    </div>
  );
}
