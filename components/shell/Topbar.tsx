"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LifeBuoy,
  LogOut,
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
import { ICON_STROKE, type NavItem, titleForPath } from "./navConfig";

interface Props {
  items: NavItem[];
  bellBadgeCount: number;
  canSeeSanalKhuselt: boolean;
  onOpenNotifications: () => void;
  onOpenHelp: () => void;
  onOpenSettings: (tab: "general" | "font-size") => void;
}

export default function Topbar({
  items,
  bellBadgeCount,
  canSeeSanalKhuselt,
  onOpenNotifications,
  onOpenHelp,
  onOpenSettings,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { ajiltan, token, garya } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const { isDesktop, setMobileOpen } = useSidebar();

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

      <h1 className="shell-title">{title}</h1>

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
          <LifeBuoy strokeWidth={ICON_STROKE} />
        </button>

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
