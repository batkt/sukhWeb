"use client";

import { Settings, Search as SearchIcon, X, LogOut, Type, Menu, HelpCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/lib/useAuth";
import { createPortal } from "react-dom";
import UnguSongokh from "./ungu/unguSongokh";
import ThemedLogo from "@/components/ui/ThemedLogo";
import ThemeModeToggler from "@/components/ui/ThemeModeToggler";
import TourReplayButton from "@/components/ui/TourReplayButton";
import { useRegisterTourSteps } from "@/context/TourContext";
import { useSearch } from "@/context/SearchContext";
import { useBuilding } from "@/context/BuildingContext";
import useBaiguullaga from "@/lib/useBaiguullaga";
import TusgaiZagvar from "./selectZagvar/tusgaiZagvar";
import { hasPermission } from "@/lib/permissionUtils";

const TuslamjTokhirgoo = lazy(() =>
  import("@/app/tokhirgoo/TuslamjTokhirgoo").then((m) => ({ default: m.default }))
);

interface GolContentProps {
  children: React.ReactNode;
  title?: string;
  khuudasniiNer?: string;
  className?: string;
}

interface MenuItem {
  label: string;
  path: string;
  submenu?: SubMenuItem[];
  comingSoon?: boolean;
}

interface SubMenuItem {
  label: string;
  path: string;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return createPortal(children, document.body);
};

export default function GolContent({ children }: GolContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [showLogout, setShowLogout] = useState<boolean>(false);
  const [tuslamjModalOpen, setTuslamjModalOpen] = useState<boolean>(false);
  const { searchTerm, setSearchTerm } = useSearch();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { ajiltan, token, garya } = useAuth();
  const has = (path: string) => hasPermission(ajiltan, path);
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const buildings = baiguullaga?.barilguud || [];

  const filteredBuildings = buildings.filter((b: any) => {
    if (!b || !b.ner) return false;
    return b.ner !== baiguullaga?.ner;
  });

  // Memoized handler to prevent unnecessary updates and ensure building selection persists
  const handleBuildingChange = useCallback(
    (v: string) => {
      const newValue = v && v.trim() ? v.trim() : null;
      // Only update if the value actually changed to prevent unnecessary side effects
      if (newValue !== selectedBuildingId) {
        setSelectedBuildingId(newValue);
      }
    },
    [selectedBuildingId, setSelectedBuildingId]
  );

  const desktopAvatarRef = useRef<HTMLDivElement>(null);
  const mobileAvatarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);

  // Refs to detect login transition and to trigger selection when buildings load
  const prevTokenRef = useRef<string | null | undefined>(null);
  const justLoggedInRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect token transition from falsy -> truthy (user just logged in)
  useEffect(() => {
    if (!prevTokenRef.current && token) {
      justLoggedInRef.current = true;
    }
    prevTokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (filteredBuildings.length > 0) {
      // Check if current selection is valid (exists in the filtered list)
      const isSelectionValid = selectedBuildingId && filteredBuildings.some((b: any) => b._id === selectedBuildingId);
      
      if (!isSelectionValid) {
        // Try to recover from localStorage first
        const stored = typeof window !== "undefined" ? localStorage.getItem("selectedBuildingId") : null;
        const isStoredValid = stored && filteredBuildings.some((b: any) => b._id === stored);

        if (isStoredValid && stored) {
           setSelectedBuildingId(stored);
        } else {
           // Default to first available building if no valid selection exists
           setSelectedBuildingId(filteredBuildings[0]._id);
        }
      }
    }
  }, [filteredBuildings, selectedBuildingId, setSelectedBuildingId]);

  useEffect(() => {
    setOpenSubmenuIndex(null);
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenSubmenuIndex(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen || mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      if (mobileSearchOpen) {
        setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen, mobileMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mobileSearchOpen) setMobileSearchOpen(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileSearchOpen, mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktop = desktopAvatarRef.current?.contains(target);
      const insideMobile = mobileAvatarRef.current?.contains(target);

      if (!insideDesktop && !insideMobile) {
        setShowLogout(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const allMenuItems: MenuItem[] = [
    { label: "Хяналт", path: "khynalt" },
    { label: "Гэрээ", path: "geree" },
    { label: "Төлбөр", path: "tulbur" },
    {
      label: "Тайлан",
      path: "tailan",
      submenu: [
        { label: "Авлагын товчоо", path: "orlogo-avlaga" },
        { label: "Сарын төлбөр", path: "sariin-tulbur" },
        { label: "Авлагийн насжилт", path: "avlagiin-nasjilt" },
        { label: "Зогсоол", path: "zogsool" },
      ],
    },
    {
      label: "Мэдэгдэл",
      path: "medegdel",
      submenu: [
        { label: "Мэдэгдэл", path: "medegdel" },
        { label: "Санал хүсэлт", path: "sanalKhuselt" },
      ],
    },
    {
      label: "Зогсоол",
      path: "zogsool",
      submenu: [
        { label: "Жагсаалт", path: "jagsaalt" },
        { label: "Камер касс", path: "camera" },
        { label: "Оршин суугч", path: "orshinSuugch" },
      ],
    },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (ajiltan?.erkh?.toLowerCase() === "admin") return true;
    if (item.submenu) {
      const allowedSubs = item.submenu.filter(
        (sub) =>
          has(item.path) ||
          has(`/${item.path}`) ||
          has(`${item.path}.${sub.path}`) ||
          has(`/${item.path}/${sub.path}`)
      );
      if (allowedSubs.length === 0) return false;
      return true;
    }
    return has(item.path) || has(`/${item.path}`);
  }).map((item) => {
    if (item.submenu) {
      const allowedSubs = item.submenu.filter(
        (sub) =>
          has(item.path) ||
          has(`/${item.path}`) ||
          has(`${item.path}.${sub.path}`) ||
          has(`/${item.path}/${sub.path}`)
      );
      return { ...item, submenu: allowedSubs };
    }
    return item;
  }).filter((item) => {
    if (item.submenu && item.submenu.length === 0) return false;
    return true;
  });

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setShowLogout(false);

    try {
      await garya();
    } catch (error) {
    } finally {
      router.replace("/login");
    }
  };

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'font-size'>('general');
  
  // Font size options with more granular control
  const fontSizeOptions = [
    { value: 0, label: 'Хамгийн жижиг', size: '10px' },
    { value: 1, label: 'Маш жижиг', size: '11px' },
    { value: 2, label: 'Жижиг-', size: '12px' },
    { value: 3, label: 'Жижиг', size: '13px' },
    { value: 4, label: 'Жижиг+', size: '14px' },
    { value: 5, label: 'Дунд-', size: '15px' },
    { value: 6, label: 'Дунд', size: '16px' },
    { value: 7, label: 'Дунд+', size: '17px' },
    { value: 8, label: 'Том-', size: '18px' },
    { value: 9, label: 'Том', size: '19px' },
    { value: 10, label: 'Том+', size: '20px' },
    { value: 11, label: 'Маш том-', size: '21px' },
    { value: 12, label: 'Маш том', size: '22px' },
    { value: 13, label: 'Маш том+', size: '24px' },
    { value: 14, label: 'Хамгийн том', size: '26px' },
  ];

  const [fontSizeIndex, setFontSizeIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fontSizeIndex');
      return saved ? parseInt(saved) : 6; // Default to 'Дунд' (16px)
    }
    return 6;
  });

  const handleKhemjee = () => {
    setActiveTab('font-size');
    setShowSettingsModal(true);
    setShowLogout(false);
  };

  const handleOpenSettings = () => {
    setActiveTab('general');
    setShowSettingsModal(true);
    setShowLogout(false);
  };

  const handleFontSizeChange = (index: number) => {
    setFontSizeIndex(index);
    const size = fontSizeOptions[index].size;
    localStorage.setItem('fontSizeIndex', index.toString());
    document.documentElement.style.fontSize = size;
  };

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const savedIndex = localStorage.getItem('fontSizeIndex');
      const index = savedIndex ? parseInt(savedIndex) : 6;
      setFontSizeIndex(index);
      document.documentElement.style.fontSize = fontSizeOptions[index].size;
    }
  }, [mounted]);

  const userName = ajiltan?.ner || ajiltan?.nevtrekhNer || "User";
  const isLoggedIn = !!token;

  // Register global tour steps that exist across most pages
  useRegisterTourSteps("global", [
    {
      element: ".neu-nav",
      popover: {
        title: "Толгой цэс",
        description:
          "Эндээс үндсэн цэс, хайлт, тохиргоо болон профайлаа удирдана.",
        side: "bottom",
      },
    },
    {
      element: isMobile ? "#barilga-songoh-mobile" : "#barilga-songoh",
      popover: {
        title: "Барилга сонгох",
        description: "Өөр барилга руу шилжихдээ эндээс сонгоно.",
        side: "bottom",
      },
    },
    {
      element: isMobile
        ? "button[aria-label='Open search']"
        : "input[aria-label='Global search']",
      popover: {
        title: "Хайлт",
        description: "Нийт систем доторх мэдээллийг хурдан хайна.",
        side: "bottom",
      },
    },
    {
      element: "#tokhirgoo",
      popover: {
        title: "Тохиргоо",
        description: "Системийн тохиргоонуудыг эндээс өөрчилнө.",
        side: "bottom",
      },
    },
  ]);

  if (!mounted) return null;

  return (
    <>
      <nav className="w-full sticky top-0 z-[1000] neu-nav">
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3">
          {/* Top row on mobile: Logo + Building Selector */}
          <div className="flex lg:hidden items-center justify-between gap-2 mb-2">
            <div className="shrink-0">
              <ThemedLogo size={32} padding={4} radius={8} />
            </div>
            <div
              id="barilga-songoh-mobile"
              className="flex-1 min-w-0 max-w-[200px]"
            >
              <TusgaiZagvar
                value={selectedBuildingId ?? ""}
                onChange={handleBuildingChange}
                options={filteredBuildings.map((b: any) => ({
                  value: b._id,
                  label: b.ner,
                }))}
                placeholder={
                  filteredBuildings.length ? "Барилга" : "Барилга нэмнэ үү"
                }
              />
            </div>
          </div>

          {/* Desktop layout: Logo, Building, Menu, Actions */}
          <div className="hidden lg:flex items-center justify-between gap-2 xl:gap-4">
            <div className="flex items-center gap-2 xl:gap-3 shrink-0">
              <div className="shrink-0">
                <ThemedLogo />
              </div>
              <div id="barilga-songoh" className="w-auto min-w-[144px] xl:min-w-[224px] [&_span]:!whitespace-normal [&_span]:!overflow-visible [&_span]:!text-clip">
                <TusgaiZagvar
                  value={selectedBuildingId ?? ""}
                  onChange={handleBuildingChange}
                  options={filteredBuildings.map((b: any) => ({
                    value: b._id,
                    label: b.ner,
                  }))}
                  placeholder={
                    filteredBuildings.length
                      ? "Барилга сонгох"
                      : "Барилга нэмнэ үү"
                  }
                />
              </div>
            </div>

            {/* Center: Desktop Menu */}
            <div className="flex flex-1 items-center justify-center px-1 xl:px-2 min-w-0">
              <div
                className="flex items-center justify-center gap-1.5 xl:gap-3 relative"
                ref={menuRef}
              >
                {menuItems.map((item, i) => {
                  const isParentActive = pathname.startsWith(`/${item.path}`);
                  const isOpen = openSubmenuIndex === i;
                  return (
                    <div key={i} className="relative shrink-0 z-[1005]">
                      {item.submenu ? (
                        <>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              if (item.comingSoon) return;
                              setOpenSubmenuIndex((prev) =>
                                prev === i ? null : i
                              );
                            }}
                            className={`menu-pro-font px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] whitespace-nowrap pointer-events-auto relative z-[1005] overflow-visible ${
                              item.comingSoon
                                ? "cursor-not-allowed opacity-60"
                                : ""
                            } ${
                              isParentActive
                                ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner scale-105"
                                : "hover:menu-surface"
                            }`}
                          >
                            {item.label}
                            {item.comingSoon && (
                              <div
                                className="absolute top-0 right-0 z-[1010] pointer-events-none overflow-visible"
                                style={{ transform: "translate(20%, -20%)" }}
                              >
                                <div
                                  className="inline-block bg-green-500 text-white text-[10px] font-semibold px-4 py-0.5 shadow-sm"
                                  style={{ transform: "rotate(45deg)" }}
                                >
                                  Тун удахгүй
                                </div>
                              </div>
                            )}
                          </button>

                          {isOpen && (
                            <div className="absolute left-1/2 transform -translate-x-1/2 mt-3 w-48 xl:w-56 rounded-2xl shadow-lg menu-surface z-[1100] pointer-events-auto">
                              <ul className="py-2">
                                {item.submenu.map((sub, j) => {
                                  const subPath = `/${item.path}/${sub.path}`;
                                  const isSubActive =
                                    pathname.startsWith(subPath);
                                  return (
                                    <li key={j}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenSubmenuIndex(null);
                                          router.push(subPath);
                                        }}
                                        className={`menu-pro-font w-full text-left block px-4 py-2 text-xs xl:text-sm rounded-2xl transition-all duration-200 text-[color:var(--panel-text)] ${
                                          isSubActive
                                            ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner"
                                            : "hover:translate-x-0.5 hover:menu-surface/80"
                                        }`}
                                      >
                                        {sub.label}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.comingSoon) return;
                            setOpenSubmenuIndex(null);
                            router.push(`/${item.path}`);
                          }}
                          className={`menu-pro-font px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] whitespace-nowrap pointer-events-auto relative z-[1005] overflow-visible ${
                            item.comingSoon
                              ? "cursor-not-allowed opacity-60"
                              : ""
                          } ${
                            isParentActive
                              ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner scale-105"
                              : "hover:menu-surface"
                          }`}
                        >
                          {item.label}
                          {item.comingSoon && (
                            <div
                              className="absolute top-0 right-0 z-[1010] pointer-events-none overflow-visible"
                              style={{ transform: "translate(20%, -20%)" }}
                            >
                              <div
                                className="inline-block bg-green-500 text-white text-[10px] font-semibold px-4 py-0.5 shadow-sm"
                                style={{ transform: "rotate(45deg)" }}
                              >
                                Тун удахгүй
                              </div>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop actions */}
            <div className="flex items-center justify-end gap-1.5 xl:gap-3 shrink-0">
              <div className="relative h-9 xl:h-10 w-40 xl:w-64 flex items-center neu-panel">
                <SearchIcon className="absolute left-2 xl:left-3 top-1/2 -translate-y-1/2 w-3.5 xl:w-4 h-3.5 xl:h-4 text-[color:var(--panel-text)] opacity-60 pointer-events-none" />
                <input
                  aria-label="Global search"
                  className="w-full h-full pl-8 xl:pl-10 pr-2 xl:pr-3 rounded-2xl border border-transparent bg-transparent text-theme text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)] transition-all"
                  placeholder="Хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <UnguSongokh />
              <ThemeModeToggler buttonClassName="inline-flex items-center justify-center h-9 w-9 xl:h-10 xl:w-10 rounded-full neu-panel hover:scale-105 transition-all duration-300" />

              <button
                type="button"
                aria-label="Тусламж"
                onClick={() => setTuslamjModalOpen(true)}
                className="inline-flex items-center justify-center h-9 w-9 xl:h-10 xl:w-10 rounded-full neu-panel hover:scale-105 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 xl:w-5 xl:h-5 text-[color:var(--panel-text)]" />
              </button>

              {isLoggedIn && (
                <div className="relative z-[150]" ref={desktopAvatarRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLogout(!showLogout);
                    }}
                    id="tokhirgoo"
                    className="w-9 h-9 xl:w-10 xl:h-10 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none text-sm xl:text-base shadow-md hover:scale-105 transition-transform"
                  >
                    {userName.charAt(0).toUpperCase()}
                  </button>

                  {showLogout && (
                    <div
                      className="absolute right-0 mt-2 w-48 menu-surface rounded-xl transition-all duration-300 z-[9999] shadow-xl pointer-events-auto"
                      onMouseLeave={() => setShowLogout(false)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ul className="py-2">
                        {(has("tokhirgoo") || has("/tokhirgoo") || ajiltan?.erkh?.toLowerCase() === "admin") && (
                        <li>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setShowLogout(false);
                              router.push("/tokhirgoo");
                            }}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-2xl transition-all text-[color:var(--panel-text)] cursor-pointer pointer-events-auto hover:menu-surface/80 hover:translate-x-0.5 hover:scale-[1.01]"
                          >
                            <Settings className="w-4 h-4 opacity-80" />
                            <span>Тохиргоо</span>
                          </button>
                        </li>
                        )}
                        <li>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleKhemjee();
                            }}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-2xl transition-all text-[color:var(--panel-text)] cursor-pointer pointer-events-auto hover:menu-surface/80 hover:translate-x-0.5 hover:scale-[1.01]"
                          >
                            <Type className="w-4 h-4 opacity-80" />
                            <span>Хэмжээ</span>
                          </button>
                        </li>
                      </ul>
                      <div className="border border-b-gray-400"></div>
                      <ul>
                        <li>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleLogout(e);
                            }}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-2xl transition-all text-[color:var(--panel-text)] cursor-pointer pointer-events-auto hover:menu-surface/80 hover:translate-x-0.5 hover:scale-[1.01]"
                          >
                            <LogOut className="w-4 h-4 opacity-80" />
                            <span>Гарах</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions Row */}
          <div className="flex lg:hidden items-center justify-between gap-1.5 sm:gap-2">
            {/* Hamburger Menu Button */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full neu-panel active:scale-95 hover:scale-105 transition-all duration-300"
            >
              <Menu className="w-4 h-4 pointer-events-none" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                aria-label="Open search"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileSearchOpen(true);
                }}
                className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full neu-panel active:scale-95 hover:scale-105 transition-all duration-300"
              >
                <SearchIcon className="w-4 h-4 pointer-events-none" />
              </button>

              <UnguSongokh />
              <ThemeModeToggler buttonClassName="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full neu-panel hover:scale-105 transition-all duration-300" />

              <button
                type="button"
                aria-label="Тусламж"
                onClick={() => setTuslamjModalOpen(true)}
                className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full neu-panel active:scale-95 hover:scale-105 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-[color:var(--panel-text)]" />
              </button>

              {isLoggedIn && (
                <div className="relative z-[150]" ref={mobileAvatarRef}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLogout(!showLogout);
                    }}
                    id="tokhirgoo"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none text-sm  shadow-md hover:scale-105 transition-transform"
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>

                  {showLogout && (
                    <div className="absolute right-0 mt-2 w-48 menu-surface rounded-xl transition-all duration-300 z-[200] shadow-xl">
                      <ul className="py-2">
                        {(has("tokhirgoo") || has("/tokhirgoo") || ajiltan?.erkh?.toLowerCase() === "admin") && (
                        <li>
                          <button
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setShowLogout(false);
                              router.push("/tokhirgoo");
                            }}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-2xl transition-all text-[color:var(--panel-text)] cursor-pointer hover:menu-surface/80 hover:translate-x-0.5 hover:scale-[1.01]"
                          >
                            <Settings className="w-4 h-4 opacity-80" />
                            <span>Тохиргоо</span>
                          </button>
                        </li>
                        )}
                        <li>
                          <button
                            onClick={handleKhemjee}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-2xl transition-all text-[color:var(--panel-text)] cursor-pointer hover:menu-surface/80 hover:translate-x-0.5 hover:scale-[1.01]"
                          >
                            <Type className="w-4 h-4 opacity-80" />
                            <span>Хэмжээ</span>
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-2xl transition-all text-[color:var(--panel-text)] cursor-pointer hover:menu-surface/80 hover:translate-x-0.5 hover:scale-[1.01]"
                          >
                            <LogOut className="w-4 h-4 opacity-80" />
                            <span>Гарах</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Tuslamj (Help) Modal */}
      {tuslamjModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setTuslamjModalOpen(false)}
              aria-hidden="true"
            />
            <div
              className="relative max-w-7xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[color:var(--surface-border)]">
                <h3 className="text-lg font-semibold text-theme">Тусламж</h3>
                <button
                  type="button"
                  onClick={() => setTuslamjModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-[color:var(--surface-hover)] transition-colors"
                  aria-label="Хаах"
                >
                  <X className="w-5 h-5 text-theme" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(85vh-64px)]">
                <Suspense
                  fallback={
                    <div className="p-8 text-center text-theme/70">
                      Уншиж байна...
                    </div>
                  }
                >
                  <TuslamjTokhirgoo compact />
                </Suspense>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1100] lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div className="absolute left-0 top-0 bottom-0 w-[280px] sm:w-[320px] bg-[color:var(--surface-bg)] shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto">
              {/* Drawer Header */}
              <div className="sticky top-0 z-10 bg-[color:var(--surface-bg)] border-b border-[color:var(--surface-border)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThemedLogo size={32} />
                  <span className="text-lg font-bold text-theme">Цэс</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-[color:var(--surface-hover)] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-theme" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="p-4 space-y-2">
                {menuItems.map((item, i) => {
                  const isParentActive = pathname.startsWith(`/${item.path}`);
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const isOpen = openSubmenuIndex === i;

                  return (
                    <div key={i} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.comingSoon) return;
                          if (hasSubmenu) {
                            setOpenSubmenuIndex(isOpen ? null : i);
                          } else {
                            router.push(`/${item.path}`);
                            setMobileMenuOpen(false);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          item.comingSoon
                            ? "cursor-not-allowed opacity-60 text-theme"
                            : ""
                        } ${
                          isParentActive
                            ? "bg-[color:var(--theme)] text-white shadow-lg"
                            : "text-theme hover:bg-[color:var(--surface-hover)]"
                        }`}
                      >
                        <span>{item.label}</span>
                        {hasSubmenu && (
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Submenu */}
                      {hasSubmenu && isOpen && (
                        <div className="pl-4 space-y-1 animate-fadeIn">
                          {item.submenu!.map((sub, j) => {
                            const subPath = `/${item.path}${sub.path}`;
                            const isSubActive = pathname.startsWith(subPath);
                            return (
                              <button
                                key={j}
                                type="button"
                                onClick={() => {
                                  router.push(subPath);
                                  setMobileMenuOpen(false);
                                  setOpenSubmenuIndex(null);
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                                  isSubActive
                                    ? "bg-[color:var(--theme)]/10 text-[color:var(--theme)] font-semibold border-l-2 border-[color:var(--theme)]"
                                    : "text-theme hover:bg-[color:var(--surface-hover)] hover:translate-x-1"
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </ModalPortal>
      )}

      <main className="flex-1 relative">
        <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 h-full">
          <div className="relative">
            <div 
              className="neu-panel rounded-[2rem] p-2 min-h-[60vh] md:h-[calc(100vh-140px)] overflow-y-auto md:overflow-y-hidden overflow-x-hidden overscroll-contain flex flex-col"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y'
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Floating tour controls */}
      <TourReplayButton />

      {mobileSearchOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1200] flex items-start p-3 sm:p-4 pointer-events-auto">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileSearchOpen(false)}
            />
            <div className="relative w-full max-w-xl mx-auto mt-16 sm:mt-24">
              <div className="flex items-center gap-2 bg-[color:var(--surface-bg)] p-2.5 sm:p-3 rounded-2xl shadow-lg">
                <SearchIcon className="w-4 sm:w-5 h-4 sm:h-5 text-theme shrink-0" />
                <input
                  ref={mobileSearchInputRef}
                  aria-label="Global search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-theme px-1 sm:px-2 text-sm sm:text-base min-w-0"
                  placeholder="Хайх..."
                />
                <button
                  aria-label="Close search"
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-1.5 sm:p-2 text-theme shrink-0"
                >
                  <X className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Unified Settings Modal */}
      {showSettingsModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 animate-fadeIn">
            <div
              className="absolute inset-0 backdrop-blur-sm transition-all duration-300 bg-black/50 dark:bg-black/80"
              onClick={() => setShowSettingsModal(false)}
            />
            <div className="relative bg-[color:var(--surface-bg)] rounded-3xl w-full max-w-2xl overflow-hidden border border-[color:var(--surface-border)] dark:border-[color:var(--panel)] transform transition-all duration-300 scale-100 shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-[color:var(--surface-bg)] via-[color:var(--surface-hover)] to-[color:var(--surface-bg)] dark:from-[color:var(--surface-bg)] dark:via-[color:var(--panel)] dark:to-[color:var(--surface-bg)]">
                <h3 className="text-2xl  text-theme">Тохиргоо</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 hover:bg-[color:var(--surface-hover)] dark:hover:bg-[color:var(--panel)] rounded-xl transition-all duration-200 hover:rotate-90 group"
                  style={{ borderRadius: '0.75rem' }}
                >
                  <X className="w-6 h-6 text-theme group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 px-6 pt-4 pb-2 bg-[color:var(--surface-hover)] dark:bg-[color:var(--panel)] overflow-x-auto border-b border-[color:var(--surface-border)]">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === 'general'
                      ? 'bg-[color:var(--theme)] text-white shadow-lg shadow-[color:var(--theme)]/20 dark:shadow-[color:var(--theme)]/40 transform scale-105'
                      : 'bg-[color:var(--surface-bg)] dark:bg-[color:var(--surface-bg)] text-theme hover:bg-[color:var(--surface-border)] dark:hover:bg-[color:var(--surface-hover)] hover:scale-102 shadow-sm'
                  }`}
                  style={{ borderRadius: '0.75rem' }}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Ерөнхий</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('font-size')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === 'font-size'
                      ? 'bg-[color:var(--theme)] text-white shadow-lg shadow-[color:var(--theme)]/20 dark:shadow-[color:var(--theme)]/40 transform scale-105'
                      : 'bg-[color:var(--surface-bg)] dark:bg-[color:var(--surface-bg)] text-theme hover:bg-[color:var(--surface-border)] dark:hover:bg-[color:var(--surface-hover)] hover:scale-102 shadow-sm'
                  }`}
                  style={{ borderRadius: '0.75rem' }}
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <span>Үсгийн хэмжээ</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-[color:var(--surface-hover)]/20 dark:to-[color:var(--panel)]/30">
                {/* General Settings Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-6 bg-gradient-to-br from-[color:var(--surface-hover)] to-[color:var(--surface-bg)] dark:from-[color:var(--panel)] dark:to-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-sm dark:shadow-md">
                      <h4 className="text-lg  text-theme mb-4 flex items-center gap-2">
                        <div className="p-2 bg-[color:var(--theme)]/10 dark:bg-[color:var(--theme)]/20 rounded-lg">
                          <Settings className="w-5 h-5 text-[color:var(--theme)]" />
                        </div>
                        <span>Ерөнхий тохиргоо</span>
                      </h4>
                      <p className="text-[color:var(--muted-text)] dark:text-[color:var(--panel-text)] mb-6 text-sm leading-relaxed">
                        Системийн бүх тохиргоог харах бол дэлгэрэнгүй тохиргоо хэсэгт очино уу.
                      </p>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          router.push("/tokhirgoo");
                        }}
                        className="px-6 py-3 bg-[color:var(--theme)] hover:opacity-90 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 group"
                        style={{ borderRadius: '0.75rem' }}
                      >
                        <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Дэлгэрэнгүй тохиргоо</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-600/50 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all duration-200 hover:scale-105">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></div>
                          <h5 className="font-semibold text-theme">Хэрэглэгч</h5>
                        </div>
                        <p className="text-sm text-[color:var(--muted-text)] dark:text-[color:var(--panel-text)] font-medium">{userName}</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200/50 dark:border-purple-600/50 hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all duration-200 hover:scale-105">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse"></div>
                          <h5 className="font-semibold text-theme">Байгууллага</h5>
                        </div>
                        <p className="text-sm text-[color:var(--muted-text)] dark:text-[color:var(--panel-text)] font-medium">{baiguullaga?.ner || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Font Size Tab */}
                {activeTab === 'font-size' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Preview Text */}
                    <div className="p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30 rounded-2xl text-center border-2 border-emerald-200/50 dark:border-emerald-600/50 shadow-lg dark:shadow-emerald-500/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent"></div>
                      <div className="relative z-10">
                        <p className="text-theme dark:text-[color:var(--panel-text)] font-medium mb-3 opacity-70 text-sm flex items-center justify-center gap-2">
                          <Type className="w-4 h-4" />
                          Жишээ текст
                        </p>
                        <p 
                          className="text-theme dark:text-[color:var(--panel-text)]  transition-all duration-300 drop-shadow-sm"
                          style={{ fontSize: fontSizeOptions[fontSizeIndex].size }}
                        >
                          Энэ бол жишээ текст юм
                        </p>
                      </div>
                    </div>

                    {/* Slider */}
                    <div className="p-6 bg-gradient-to-br from-[color:var(--surface-hover)] to-[color:var(--surface-bg)] dark:from-[color:var(--panel)] dark:to-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-sm dark:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-base text-theme dark:text-white  flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[color:var(--theme)] animate-pulse"></div>
                          {fontSizeOptions[fontSizeIndex].label}
                        </span>
                        <span className="text-sm text-theme dark:text-white font-mono  bg-[color:var(--surface-bg)] dark:bg-[color:var(--surface-hover)] px-3 py-1.5 rounded-lg border border-[color:var(--surface-border)] shadow-sm">
                          {fontSizeOptions[fontSizeIndex].size}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max={fontSizeOptions.length - 1}
                          value={fontSizeIndex}
                          onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                          className="w-full h-3 rounded-full appearance-none cursor-pointer slider-thumb bg-gray-300 dark:bg-gray-600"
                          style={{
                            background: `linear-gradient(to right, var(--theme) 0%, var(--theme) ${(fontSizeIndex / (fontSizeOptions.length - 1)) * 100}%, rgba(156, 163, 175, 0.5) ${(fontSizeIndex / (fontSizeOptions.length - 1)) * 100}%, rgba(156, 163, 175, 0.5) 100%)`
                          }}
                        />
                        
                        {/* Tick marks */}
                        <div className="flex justify-between mt-3 px-1">
                          {fontSizeOptions.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-0.5 h-2 rounded-full transition-all duration-200 ${
                                idx === fontSizeIndex 
                                  ? 'bg-[color:var(--theme)] h-4 shadow-lg shadow-[color:var(--theme)]/30' 
                                  : 'bg-gray-400 dark:bg-gray-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick preset buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleFontSizeChange(2)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 border shadow-sm hover:shadow-lg hover:scale-105 ${
                          fontSizeIndex === 2
                            ? 'bg-[color:var(--theme)] text-white border-transparent shadow-lg shadow-[color:var(--theme)]/20'
                            : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-theme dark:text-[color:var(--panel-text)] border-blue-200/50 dark:border-blue-600/50 hover:bg-[color:var(--theme)] hover:text-white hover:border-transparent'
                        }`}
                        style={{ borderRadius: '0.75rem' }}
                      >
                        Жижиг
                      </button>
                      <button
                        onClick={() => handleFontSizeChange(6)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 border shadow-sm hover:shadow-lg hover:scale-105 ${
                          fontSizeIndex === 6
                            ? 'bg-[color:var(--theme)] text-white border-transparent shadow-lg shadow-[color:var(--theme)]/20'
                            : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-theme dark:text-[color:var(--panel-text)] border-green-200/50 dark:border-green-600/50 hover:bg-[color:var(--theme)] hover:text-white hover:border-transparent'
                        }`}
                        style={{ borderRadius: '0.75rem' }}
                      >
                        Дунд
                      </button>
                      <button
                        onClick={() => handleFontSizeChange(10)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 border shadow-sm hover:shadow-lg hover:scale-105 ${
                          fontSizeIndex === 10
                            ? 'bg-[color:var(--theme)] text-white border-transparent shadow-lg shadow-[color:var(--theme)]/20'
                            : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 text-theme dark:text-[color:var(--panel-text)] border-orange-200/50 dark:border-orange-600/50 hover:bg-[color:var(--theme)] hover:text-white hover:border-transparent'
                        }`}
                        style={{ borderRadius: '0.75rem' }}
                      >
                        Том
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
      <div id="modal-root"></div>
    </>
  );
}

export { ModalPortal };
