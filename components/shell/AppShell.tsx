"use client";

import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useRegisterTourSteps } from "@/context/TourContext";
import TourReplayButton from "@/components/ui/TourReplayButton";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import RouteProgress from "./RouteProgress";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { NAV_ITEMS, filterNavByPermission } from "./navConfig";
import { useShellNotifications } from "./useShellNotifications";
import { applyStoredFontSize } from "./fontSize";

// Split out of the shell bundle — none of these are needed to paint a page.
const NotificationsPanel = lazy(() => import("./NotificationsPanel"));
const SettingsModal = lazy(() => import("./SettingsModal"));
const HelpModal = lazy(() => import("./HelpModal"));

function ShellBody({ children }: { children: React.ReactNode }) {
  const { ajiltan, baiguullaga } = useAuth();
  const { mobileOpen, setMobileOpen, isDesktop, collapsed, collapse } = useSidebar();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "font-size" | null>(
    null,
  );

  const shell = useShellNotifications(notificationsOpen);

  const navItems = useMemo(
    () => filterNavByPermission(NAV_ITEMS, ajiltan),
    [ajiltan],
  );

  const buildings = useMemo(
    () =>
      (baiguullaga?.barilguud ?? [])
        .filter((b: any) => b?.ner && b.ner !== baiguullaga?.ner)
        .map((b: any) => ({ value: b._id, label: b.ner })),
    [baiguullaga],
  );

  useEffect(() => {
    applyStoredFontSize();
  }, []);

  // Keep the selected building valid against the list actually on offer.
  // BuildingContext seeds a value once at startup but never re-checks it, so
  // without this a stale localStorage id leaves every page querying a building
  // the user can no longer see.
  useEffect(() => {
    if (buildings.length === 0) return;
    const isValid =
      selectedBuildingId && buildings.some((b) => b.value === selectedBuildingId);
    if (isValid) return;

    let stored: string | null = null;
    try {
      stored = localStorage.getItem("selectedBuildingId");
    } catch {
      /* private mode */
    }
    const storedIsValid = stored && buildings.some((b) => b.value === stored);
    setSelectedBuildingId(storedIsValid ? stored : buildings[0].value);
  }, [buildings, selectedBuildingId, setSelectedBuildingId]);

  // Lock body scroll only while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop, setMobileOpen]);

  /**
   * Дэлгэсэн цэсний гадна дарахад автоматаар хумина.
   *
   * Зөвхөн desktop дээр — доод breakpoint дээр off-canvas drawer нь өөрийн
   * scrim-тэй. `pointerdown` сонсдог нь `click`-ээс өмнө ажиллаж, цэс хумигдах
   * үед доор нь орших элемент рүү даралт "унахаас" сэргийлнэ.
   *
   * Цэсэнд харьяалагдах зарим гадаргуу нь `document.body` руу portal хийгддэг
   * (барилга сонгох listbox, tour popover). Эдгээр нь DOM-ийн хувьд цэсний
   * гадна ч, хэрэглэгчийн хувьд цэсний нэг хэсэг тул хумихгүй.
   */
  useEffect(() => {
    if (!isDesktop || collapsed) return;

    const KEEP_OPEN = [
      ".shell-sidebar",
      '[role="listbox"]',
      '[role="dialog"]',
      '[role="menu"]',
      ".driver-popover",
    ].join(",");

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest(KEEP_OPEN)) return;
      collapse();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isDesktop, collapsed, collapse]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  useRegisterTourSteps("global", [
    {
      element: ".shell-sidebar",
      popover: {
        title: "Үндсэн цэс",
        description:
          "Бүх хэсэг рүү эндээс шилжинэ. Доод талын товчоор цэсийг хумина.",
        side: "right",
      },
    },
    {
      element: "#barilga-songoh",
      popover: {
        title: "Барилга сонгох",
        description: "Өөр барилга руу шилжихдээ эндээс сонгоно.",
        side: "right",
      },
    },
    {
      element: "input[aria-label='Global search']",
      popover: {
        title: "Хайлт",
        description: "Нийт систем доторх мэдээллийг хурдан хайна.",
        side: "bottom",
      },
    },
    {
      element: "#tokhirgoo",
      popover: {
        title: "Профайл ба тохиргоо",
        description: "Тохиргоо, үсгийн хэмжээ болон гарах товч энд байрлана.",
        side: "bottom",
      },
    },
  ]);

  const openSettings = useCallback(
    (tab: "general" | "font-size") => setSettingsTab(tab),
    [],
  );

  const sidebar = (
    <Sidebar
      items={navItems}
      buildings={buildings}
      remainingDays={shell.remainingDays}
      storageLabel={shell.storageLabel}
    />
  );

  return (
    <div className="shell-root">
      <RouteProgress />

      {/* Desktop: persistent rail/panel. Mobile: off-canvas drawer. */}
      {isDesktop
        ? sidebar
        : mobileOpen && (
            <div className="shell-drawer">
              <button
                type="button"
                aria-label="Цэсийг хаах"
                onClick={() => setMobileOpen(false)}
                className="shell-drawer-scrim"
              />
              {sidebar}
            </div>
          )}

      <Topbar
        items={navItems}
        bellBadgeCount={shell.bellBadgeCount}
        canSeeSanalKhuselt={shell.canSeeSanalKhuselt}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenSettings={openSettings}
      />

      <main className="shell-main">
        <div className="shell-surface">{children}</div>
      </main>

      <TourReplayButton />

      <Suspense fallback={null}>
        {notificationsOpen && (
          <NotificationsPanel
            open
            onClose={() => setNotificationsOpen(false)}
            sanalList={shell.sanalList}
            medegdelList={shell.medegdelList}
            unreadSanalCount={shell.unreadSanalCount}
            unreadMedegdelCount={shell.unreadMedegdelCount}
            onOpenMedegdel={shell.openMedegdel}
          />
        )}
        {settingsTab && (
          <SettingsModal
            open
            initialTab={settingsTab}
            onClose={() => setSettingsTab(null)}
            userName={ajiltan?.ner || ajiltan?.nevtrekhNer || "Хэрэглэгч"}
            organisationName={baiguullaga?.ner ?? ""}
          />
        )}
        {helpOpen && <HelpModal open onClose={() => setHelpOpen(false)} />}
      </Suspense>

      <div id="modal-root" />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellBody>{children}</ShellBody>
    </SidebarProvider>
  );
}
