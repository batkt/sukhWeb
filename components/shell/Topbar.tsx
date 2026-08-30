"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Database,
  HelpCircle,
  LogOut,
  MessageCircle,
  MessageCircleOff,
  Menu,
  Search as SearchIcon,
  Settings,
  Type,
} from "lucide-react";
import ThemeModeToggler from "@/components/ui/ThemeModeToggler";
import { useAuth } from "@/lib/useAuth";
import { useSearch } from "@/context/SearchContext";
import { hasPermission } from "@/lib/permissionUtils";
import UnguSongokh from "../ungu/unguSongokh";
import { useSidebar } from "./SidebarContext";
import { useBuilding } from "@/context/BuildingContext";
import { useChatLauncher } from "@/lib/useChatLauncher";
import { ICON_STROKE, type NavItem, titleForPath } from "./navConfig";
import SanalAsuulgaTracker from "./SanalAsuulgaTracker";

interface Props {
  items: NavItem[];
  bellBadgeCount: number;
  canSeeSanalKhuselt: boolean;
  remainingDays?: number | null;
  storageLabel?: string | null;
  onOpenNotifications: () => void;
  onOpenHelp: () => void;
  onOpenSettings: (tab: "general" | "font-size") => void;
}

export default function Topbar({
  items,
  bellBadgeCount,
  canSeeSanalKhuselt,
  remainingDays,
  storageLabel,
  onOpenNotifications,
  onOpenHelp,
  onOpenSettings,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { ajiltan, token, garya, baiguullaga } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const { isDesktop, setMobileOpen, collapsed } = useSidebar();
  const { selectedBuildingId } = useBuilding();
  // Хөвөгч чат товчийг нуусан үед эндээс буцааж гаргана.
  const { hidden: chatHidden, toggleHidden: toggleChat } = useChatLauncher();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Local mirror so typing never re-renders the whole shell on every keystroke.
  const [draft, setDraft] = useState(searchTerm);
  useEffect(() => setDraft(searchTerm), [searchTerm]);
  useEffect(() => {
    if (draft === searchTerm) return;
    const id = window.setTimeout(() => setSearchTerm(draft), 180);
    return () => window.clearTimeout(id);
  }, [draft, searchTerm, setSearchTerm]);

  const isLoggedIn = !!token;
  const userName = ajiltan?.ner || ajiltan?.nevtrekhNer || "Хэрэглэгч";
  const title = useMemo(() => titleForPath(pathname, items), [pathname, items]);

  /**
   * Хажуугийн цэс хумигдсан үед салбарын нэр ҮНДСЭН гарчиг болно -
   * rail горимд логоны хажууд харуулах зай байхгүй тул хаана байгаагаа
   * алдахгүйн тулд топ баар руу гарна. Хуудасны нэр дэд гарчиг болно.
   */
  const tsesKhuriigdsen = collapsed && isDesktop;
  const salbarNer = useMemo(() => {
    const jagsaalt = baiguullaga?.barilguud ?? [];
    const olson = jagsaalt.find(
      (b: any) => String(b?._id) === String(selectedBuildingId),
    );
    return olson?.ner ?? null;
  }, [baiguullaga, selectedBuildingId]);

  const canSeeTokhirgoo = useMemo(
    () =>
      hasPermission(ajiltan, "tokhirgoo") ||
      hasPermission(ajiltan, "/tokhirgoo") ||
      ajiltan?.erkh?.toLowerCase() === "admin",
    [ajiltan],
  );

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const id = window.setTimeout(() => mobileSearchRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMobileSearchOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileSearchOpen]);

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    try {
      await garya();
    } finally {
      router.replace("/login");
    }
  }, [garya, router]);

  return (
    <header className="shell-topbar">
      {!isDesktop && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Цэс нээх"
          className="shell-icon-btn shrink-0"
        >
          <Menu strokeWidth={ICON_STROKE} />
        </button>
      )}

      {tsesKhuriigdsen && salbarNer ? (
        <div className="shell-title-bulge">
          <h1 className="shell-title" title={salbarNer}>
            {salbarNer}
          </h1>
          <span className="shell-title-ded" title={title}>
            {title}
          </span>
        </div>
      ) : (
        <h1 className="shell-title">{title}</h1>
      )}

      {/* ── License & Storage Status Badges (Between Title and Search Bar) ── */}
      {isLoggedIn &&
        (remainingDays !== null && remainingDays !== undefined ||
          storageLabel !== null && storageLabel !== undefined) && (
          <div className="hidden lg:flex items-center gap-2 mx-3 shrink-0">
            {remainingDays !== null && remainingDays !== undefined && (
              <div
                title={`Лицензийн үлдсэн хугацаа: ${remainingDays} хоног`}
                className={`h-9 flex items-center gap-1.5 px-3.5 rounded-xl text-xs border backdrop-blur-md transition shadow-2xs select-none ${
                  remainingDays <= 15
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                <CalendarClock className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                  Лиценз:
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                  {remainingDays} хоног
                </span>
              </div>
            )}

            {storageLabel !== null && storageLabel !== undefined && (
              <div
                title={`Ашигласан дата: ${storageLabel}`}
                className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl text-xs border border-sky-500/25 bg-sky-500/10 backdrop-blur-md transition shadow-2xs select-none"
              >
                <Database className="h-4 w-4 text-sky-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                  Дата:
                </span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 leading-none">
                  {storageLabel}
                </span>
              </div>
            )}
          </div>
        )}

      <div className="shell-topbar-actions">
        {isDesktop ? (
          <div className="shell-topsearch">
            <SearchIcon
              className="shell-topsearch-icon"
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
            <input
              aria-label="Global search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Хайлт..."
              className="shell-topsearch-input"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Open search"
            className="shell-icon-btn"
          >
            <SearchIcon strokeWidth={ICON_STROKE} />
          </button>
        )}

        <span className="shell-popup-down">
          <UnguSongokh buttonClassName="shell-icon-btn" />
        </span>
        <ThemeModeToggler buttonClassName="shell-icon-btn" />

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Ерөнхий тусламж"
          title="Ерөнхий тусламж"
          className="shell-icon-btn"
        >
          <HelpCircle strokeWidth={ICON_STROKE} />
        </button>

        {isLoggedIn && <SanalAsuulgaTracker />}

        {isLoggedIn && canSeeSanalKhuselt && (
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Мэдэгдэл"
            title="Мэдэгдэл"
            className="shell-icon-btn relative"
          >
            <Bell strokeWidth={ICON_STROKE} />
            {bellBadgeCount > 0 && (
              <span className="shell-badge">
                {bellBadgeCount > 99 ? "99+" : bellBadgeCount}
              </span>
            )}
          </button>
        )}

        {isLoggedIn && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              id="tokhirgoo"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label={userName}
              title={userName}
              className="shell-avatar-btn"
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {userMenuOpen && (
              <div role="menu" className="shell-usermenu">
                <div className="shell-usermenu-head">
                  <span className="block truncate text-[13px] font-semibold text-[color:var(--panel-text)]">
                    {userName}
                  </span>
                  <span className="block truncate text-[11px] text-[color:var(--panel-text)]/45">
                    {ajiltan?.erkh || "Ажилтан"}
                  </span>
                </div>

                {canSeeTokhirgoo && (
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/tokhirgoo");
                    }}
                    className="shell-usermenu-item"
                  >
                    <Settings className="h-4 w-4" strokeWidth={ICON_STROKE} />
                    Тохиргоо
                  </button>
                )}
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenSettings("font-size");
                  }}
                  className="shell-usermenu-item"
                >
                  <Type className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  Үсгийн хэмжээ
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    toggleChat();
                  }}
                  className="shell-usermenu-item"
                >
                  {chatHidden ? (
                    <MessageCircle className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  ) : (
                    <MessageCircleOff className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  )}
                  {chatHidden ? "Чат товч гаргах" : "Чат товч нуух"}
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={handleLogout}
                  className="shell-usermenu-item text-red-500"
                >
                  <LogOut className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  Гарах
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {mobileSearchOpen && !isDesktop && (
        <div className="shell-mobile-search">
          <SearchIcon
            className="h-4 w-4 shrink-0 text-[color:var(--panel-text)]/45"
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
          <input
            ref={mobileSearchRef}
            aria-label="Global search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => setMobileSearchOpen(false)}
            placeholder="Хайлт..."
            className="h-9 flex-1 bg-transparent text-sm text-[color:var(--panel-text)] outline-none placeholder:text-[color:var(--panel-text)]/40"
          />
        </div>
      )}
    </header>
  );
}
