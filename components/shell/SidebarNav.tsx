"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ICON_STROKE,
  type NavItem,
  hrefFor,
  subHrefFor,
} from "./navConfig";
import { useSidebar } from "./SidebarContext";

interface Props {
  items: NavItem[];
  /** Closes the mobile drawer after a navigation. */
  onNavigate?: () => void;
}

interface FlyoutState {
  key: string;
  top: number;
}

export default function SidebarNav({ items, onNavigate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, isDesktop } = useSidebar();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [flyout, setFlyout] = useState<FlyoutState | null>(null);
  const closeTimer = useRef<number | null>(null);

  const railMode = collapsed && isDesktop;

  const activeKey = useMemo(
    () => items.find((i) => pathname.startsWith(`/${i.path}`))?.path ?? null,
    [items, pathname],
  );

  // Keep the section containing the current route open, but never fight a
  // section the user opened themselves.
  useEffect(() => {
    if (activeKey) setOpenKey(activeKey);
  }, [activeKey]);

  useEffect(() => {
    setFlyout(null);
  }, [pathname, railMode]);

  // Warm the route on intent so the chunk is already downloading by the time
  // the click lands. These pages are large; this is where the wait was.
  const warm = useCallback(
    (href: string) => {
      try {
        router.prefetch(href);
      } catch {
        /* prefetch is best-effort */
      }
    },
    [router],
  );

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setFlyout(null), 140);
  };

  useEffect(() => cancelClose, []);

  const openFlyout = (key: string, el: HTMLElement) => {
    cancelClose();
    const rect = el.getBoundingClientRect();
    setFlyout({ key, top: rect.top });
  };

  return (
    <nav aria-label="Үндсэн цэс" className="shell-nav">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const href = hrefFor(item);
          const isActive = pathname.startsWith(`/${item.path}`);
          const hasSub = !!item.submenu?.length;
          const isOpen = openKey === item.path;
          const showFlyout = railMode && hasSub && flyout?.key === item.path;

          return (
            <li
              key={item.path}
              className="relative"
              onMouseEnter={
                railMode && hasSub
                  ? (e) => openFlyout(item.path, e.currentTarget)
                  : undefined
              }
              onMouseLeave={railMode && hasSub ? scheduleClose : undefined}
            >
              {hasSub ? (
                <button
                  type="button"
                  aria-expanded={railMode ? showFlyout : isOpen}
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive || undefined}
                  onFocus={
                    railMode
                      ? (e) => openFlyout(item.path, e.currentTarget)
                      : undefined
                  }
                  onClick={(e) => {
                    if (item.comingSoon) return;
                    if (railMode) {
                      openFlyout(item.path, e.currentTarget);
                      return;
                    }
                    setOpenKey(isOpen ? null : item.path);
                  }}
                  className="shell-nav-item"
                >
                  <Icon
                    className="shell-nav-icon"
                    strokeWidth={ICON_STROKE}
                    aria-hidden
                  />
                  <span className="shell-label flex-1 text-left">
                    {item.label}
                  </span>
                  <ChevronDown
                    className={`shell-label shell-nav-chevron ${isOpen ? "rotate-180" : ""}`}
                    strokeWidth={ICON_STROKE}
                    aria-hidden
                  />
                </button>
              ) : (
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive || undefined}
                  onMouseEnter={() => warm(href)}
                  onFocus={() => warm(href)}
                  onClick={onNavigate}
                  className="shell-nav-item"
                >
                  <Icon
                    className="shell-nav-icon"
                    strokeWidth={ICON_STROKE}
                    aria-hidden
                  />
                  <span className="shell-label flex-1 text-left">
                    {item.label}
                  </span>
                </Link>
              )}

              {/* Expanded mode: inline disclosure */}
              {hasSub && !railMode && isOpen && (
                <ul className="shell-sublist">
                  {item.submenu!.map((sub) => {
                    const subHref = subHrefFor(item, sub);
                    const subActive = pathname.startsWith(subHref);
                    return (
                      <li key={sub.path}>
                        <Link
                          href={subHref}
                          aria-current={subActive ? "page" : undefined}
                          data-active={subActive || undefined}
                          onMouseEnter={() => warm(subHref)}
                          onFocus={() => warm(subHref)}
                          onClick={onNavigate}
                          className="shell-subitem"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Rail mode: fixed-position flyout so the sidebar can still scroll */}
              {showFlyout && (
                <div
                  className="shell-flyout"
                  style={{ top: flyout.top }}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <p className="shell-flyout-title">{item.label}</p>
                  <ul>
                    {item.submenu!.map((sub) => {
                      const subHref = subHrefFor(item, sub);
                      const subActive = pathname.startsWith(subHref);
                      return (
                        <li key={sub.path}>
                          <Link
                            href={subHref}
                            aria-current={subActive ? "page" : undefined}
                            data-active={subActive || undefined}
                            onMouseEnter={() => warm(subHref)}
                            onFocus={() => warm(subHref)}
                            onClick={() => {
                              setFlyout(null);
                              onNavigate?.();
                            }}
                            className="shell-subitem"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
