"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  Database,
  HelpCircle,
  MessageCircle,
  X,
} from "lucide-react";
import ThemedLogo from "@/components/ui/ThemedLogo";
import { useBuilding } from "@/context/BuildingContext";
import TusgaiZagvar from "../selectZagvar/tusgaiZagvar";
import SidebarNav from "./SidebarNav";
import { useSidebar } from "./SidebarContext";
import { ICON_STROKE, type NavItem } from "./navConfig";

interface BuildingOption {
  value: string;
  label: string;
}

interface Props {
  items: NavItem[];
  buildings: BuildingOption[];
  remainingDays: number | null;
  storageLabel: string | null;
  /** «Ерөнхий тусламж» — зааврын таб дээр нээнэ. */
  onOpenHelp: () => void;
  /** «Шууд чат» — чатботын таб дээр нээнэ. */
  onOpenChat: () => void;
}

/** One line of the licence / storage readout at the foot of the sidebar. */
function StatusRow({
  icon: Icon,
  label,
  value,
  unit,
  tone = "neutral",
}: {
  icon: typeof Database;
  label: string;
  value: string;
  unit?: string;
  /** "ok" reads in the brand green, "critical" goes red and pulses. */
  tone?: "neutral" | "ok" | "critical";
}) {
  return (
    <div className="shell-status-row">
      <Icon className="shell-status-icon" strokeWidth={ICON_STROKE} aria-hidden />
      <span className="shell-label shell-status-label">{label}</span>
      <span
        className={`shell-status-value is-${tone}`}
        title={`${label}: ${value}${unit ? " " + unit : ""}`}
      >
        {value}
        {unit && <span className="shell-label shell-status-unit"> {unit}</span>}
      </span>
    </div>
  );
}

/** Under 10 days left is the point the old shell started shouting. */
const LICENCE_CRITICAL_DAYS = 10;

/**
 * Navigation, plus the licence/storage readout. Search, theme, notifications
 * and the profile menu live in the top bar, so this column stays a single
 * readable list of destinations.
 */
export default function Sidebar({
  items,
  buildings,
  remainingDays,
  storageLabel,
  onOpenHelp,
  onOpenChat,
}: Props) {
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();
  const {
    collapsed,
    toggleCollapsed,
    isDesktop,
    setMobileOpen,
    railMode,
  } = useSidebar();

  const closeDrawer = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  const handleBuildingChange = useCallback(
    (v: string) => {
      const next = v?.trim() ? v.trim() : null;
      if (next !== selectedBuildingId) setSelectedBuildingId(next);
    },
    [selectedBuildingId, setSelectedBuildingId],
  );

  const hasStatus = remainingDays !== null || storageLabel !== null;


  return (
    <aside
      className="shell-sidebar"
      aria-label="Хажуугийн цэс"
    >
      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="shell-sidebar-head">
        <ThemedLogo size={railMode ? 32 : 44} radius={10} padding={4} />
        {/* Салбар сонгох нь логоны хажууд байрлана. Rail горимд зай
            байхгүй тул доорх икон болж хумигдаж, идэвхтэй салбарын нэр
            топ баарын үндсэн гарчиг болж гарна. */}
        {!railMode && (
          <div id="barilga-songoh" className="shell-brand-salbar">
            <TusgaiZagvar
              value={selectedBuildingId ?? ""}
              onChange={handleBuildingChange}
              options={buildings}
              placeholder={
                buildings.length ? "Барилга сонгох" : "Барилга нэмнэ үү"
              }
            />
          </div>
        )}
        {!isDesktop && (
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Цэсийг хаах"
            className="shell-icon-btn ml-auto shrink-0"
          >
            <X strokeWidth={ICON_STROKE} />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <div className="scrollable min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
        <SidebarNav
          items={items}
          onNavigate={isDesktop ? undefined : closeDrawer}
        />
      </div>

      {/* ── Тусламж, чат ба хумих товч ───────────────────────────── */}
      <div className="shell-sidebar-foot">
        {/* Чатбот ба ерөнхий тусламж нь урьд нь топ баарын икон болон
            хөвөгч товч хэлбэрээр тархсан байв. Хоёулаа нэг модалын хоёр
            таб тул цэсний доод хэсэгт зэрэгцүүлж, үндсэн цэстэй ижил
            мөрийн загвараар (`shell-nav-item`) харуулав — ингэснээр rail
            горимд ч бусад иконтойгоо нэг тэнхлэгт, нэг хэмжээтэй эгнэнэ. */}
        <button
          type="button"
          onClick={() => {
            onOpenChat();
            if (!isDesktop) closeDrawer();
          }}
          aria-label="Шууд чат"
          title="Шууд чат"
          className="shell-nav-item"
        >
          <MessageCircle
            className="shell-nav-icon"
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
          <span className="shell-label flex-1 text-left">Шууд чат</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenHelp();
            if (!isDesktop) closeDrawer();
          }}
          aria-label="Ерөнхий тусламж"
          title="Ерөнхий тусламж"
          className="shell-nav-item"
        >
          <HelpCircle
            className="shell-nav-icon"
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
          <span className="shell-label flex-1 text-left">Ерөнхий тусламж</span>
        </button>

        {isDesktop && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Цэсийг дэлгэх" : "Цэсийг хумих"}
            title={collapsed ? "Цэсийг дэлгэх" : "Цэсийг хумих"}
            className="shell-collapse-btn"
          >
            {collapsed ? (
              <ChevronsRight strokeWidth={ICON_STROKE} />
            ) : (
              <ChevronsLeft strokeWidth={ICON_STROKE} />
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
