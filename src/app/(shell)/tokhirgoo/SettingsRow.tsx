"use client";

import type { ChangeEvent, ReactNode } from "react";

/**
 * Тохиргооны хуудсын бүтэц.
 *
 * Дүрэм: КАРТ бүрд ХАМГИЙН ИХДЭЭ НЭГ «Хадгалах» товч. Өмнө нь мөр болгон
 * өөрийн товчтой байсан тул нэг дэлгэцэн дээр 6 ногоон товч зэрэг харагддаг
 * байв. Одоо картын доод баруун буланд ганц товч, доор нь бүх хуудсыг нэгэн
 * зэрэг хадгалах ерөнхий товч.
 */
export function SettingsCard({
  id,
  icon,
  title,
  subtitle,
  toggle,
  onSave,
  saveId,
  saving,
  children,
}: {
  id?: string;
  icon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  /** Картын толгойн унтраалга — асаангуут шууд хадгалагдана */
  toggle?: ReactNode;
  /** Өгсөн бол картын доор ганц «Хадгалах» товч гарна */
  onSave?: () => void;
  /** Товчны id — аялалын алхмууд (tour) үүгээр олдог */
  saveId?: string;
  saving?: boolean;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="stg-card">
      <header className="stg-card-head">
        {icon ? <span className="stg-icon">{icon}</span> : null}
        <div className="stg-card-titles">
          <h3 className="stg-card-title">{title}</h3>
          {subtitle ? <p className="stg-card-sub">{subtitle}</p> : null}
        </div>
        {toggle ? <div className="stg-card-toggle">{toggle}</div> : null}
      </header>

      {children ? <div className="stg-card-body">{children}</div> : null}

      {onSave ? (
        <div className="stg-card-foot">
          <button
            id={saveId}
            type="button"
            className="stg-btn stg-btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            Хадгалах
          </button>
        </div>
      ) : null}
    </section>
  );
}

/** Картын доторх нэг тохиргоо — бүдэг дэвсгэртэй мөр */
export function SettingsItem({
  id,
  icon,
  title,
  desc,
  control,
  children,
}: {
  id?: string;
  icon?: ReactNode;
  title: string;
  desc?: ReactNode;
  control?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="stg-item">
      <div className="stg-item-main">
        {icon ? <span className="stg-item-icon">{icon}</span> : null}
        <div className="stg-item-titles">
          <p className="stg-item-title">{title}</p>
          {desc ? <p className="stg-item-desc">{desc}</p> : null}
        </div>
        {control ? <div className="stg-item-control">{control}</div> : null}
      </div>
      {children ? <div className="stg-item-body">{children}</div> : null}
    </div>
  );
}

export function SettingsField({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`stg-field ${className}`.trim()}>
      {label ? <label className="stg-field-label">{label}</label> : null}
      {children}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  size,
}: {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  size?: "sm";
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        aria-label={label}
      />
      <span
        className={size === "sm" ? "tokh-switch tokh-switch-sm" : "tokh-switch"}
      />
    </label>
  );
}
