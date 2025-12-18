"use client";

import { Settings, Search as SearchIcon, X, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
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
  const { searchTerm, setSearchTerm } = useSearch();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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

  const avatarRef = useRef<HTMLDivElement>(null);
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
    // Only auto-select on login if there's no existing selection in localStorage
    // This prevents resetting the user's building choice
    if (justLoggedInRef.current) {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedBuildingId")
          : null;
      if (filteredBuildings.length > 0 && !stored) {
        setSelectedBuildingId(filteredBuildings[0]._id);
        justLoggedInRef.current = false;
      } else {
        justLoggedInRef.current = false;
      }
    }
  }, [filteredBuildings, setSelectedBuildingId]);

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
    if (mobileSearchOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileSearchOpen) setMobileSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setShowLogout(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItems: MenuItem[] = [
    { label: "Хяналт", path: "khynalt" },
    { label: "Гэрээ", path: "geree" },
    {
      label: "Төлбөр",
      path: "tulbur",
    },
    {
      label: "Тайлан",
      path: "tailan",
      submenu: [
        { label: "Орлого авлага", path: "/orlogo-avlaga" },
        { label: "Сарын төлбөр", path: "/sariin-tulbur" },
        { label: "Нэхэмжлэхийн түүх", path: "/nekhemjlekhiin-tuukh" },
        { label: "Авлагийн насжилт", path: "/avlagiin-nasjilt" },
      ],
    },
    {
      label: "Мэдэгдэл",
      path: "medegdel",
      submenu: [
        {
          label: "Мэдэгдэл",
          path: "/medegdel",
        },
        // {
        //   label: "Шаардлага",
        //   path: "/shaardlaga",
        // },
        // {
        //   label: "Дуудлага",
        //   path: "/duudlaga",
        // },
        {
          label: "Санал хүсэлт",
          path: "/sanalKhuselt",
        },
      ],
    },
    // {
    //   label: "Зогсоол",
    //   path: "zogsool",
    //   submenu: [
    //     {
    //       label: "Жагсаалт",
    //       path: "/jagsaalt",
    //     },
    //     {
    //       label: "Машин бүртгэл",
    //       path: "/mashinBurtgel",
    //     },
    //     {
    //       label: "Камер касс",
    //       path: "/camera",
    //     },
    //     {
    //       label: "Камерын хяналт",
    //       path: "/cameraKhyanalt",
    //     },
    //     {
    //       label: "Оршин суугч",
    //       path: "/orshinSuugch",
    //     },
    //   ],
    // },
  ];

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
              <ThemedLogo />
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
              <div id="barilga-songoh" className="w-36 xl:w-56">
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

              {isLoggedIn && (
                <div className="relative z-[150]" ref={avatarRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLogout(!showLogout);
                    }}
                    id="tokhirgoo"
                    className="w-9 h-9 xl:w-10 xl:h-10 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none text-sm xl:text-base font-bold shadow-md hover:scale-105 transition-transform"
                  >
                    {userName.charAt(0).toUpperCase()}
                  </button>

                  {showLogout && (
                    <div
                      className="absolute left-0 mt-2 w-48 menu-surface rounded-xl transition-all duration-300 z-[9999] shadow-xl pointer-events-auto"
                      onMouseLeave={() => setShowLogout(false)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ul className="py-2">
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

          <div className="flex lg:hidden items-center justify-end gap-1.5 sm:gap-2">
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

            {isLoggedIn && (
              <div className="relative z-[150]" ref={avatarRef}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLogout(!showLogout);
                  }}
                  id="tokhirgoo"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none text-sm font-bold shadow-md hover:scale-105 transition-transform"
                >
                  {userName.charAt(0).toUpperCase()}
                </div>

                {showLogout && (
                  <div className="absolute right-0 mt-2 w-48 menu-surface rounded-xl transition-all duration-300 z-[200] shadow-xl">
                    <ul className="py-2">
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
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm rounded-2xl transition-all text-[color:var(--panel-text)] cursor-pointer hover:menu-surface/80 hover:translate-x-0.5 hover:scale-[1.01]"
                        >
                          Гарах
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="lg:hidden w-full bg-[color:var(--surface-bg)] sticky top-[100px] sm:top-[120px] z-[9]">
        <div className="px-2 sm:px-3 pb-2">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
            {menuItems.map((item, i) => {
              const isParentActive = pathname.startsWith(`/${item.path}`);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (item.comingSoon) return;
                    item.submenu
                      ? setOpenSubmenuIndex((prev) => (prev === i ? null : i))
                      : router.push(`/${item.path}`);
                  }}
                  className={`menu-pro-font px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 text-[color:var(--panel-text)] shrink-0 relative overflow-visible ${
                    item.comingSoon ? "cursor-not-allowed opacity-60" : ""
                  } ${
                    isParentActive
                      ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner"
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
              );
            })}
          </div>
          {openSubmenuIndex !== null &&
            menuItems[openSubmenuIndex]?.submenu && (
              <div className="mt-2 w-full rounded-2xl shadow-lg menu-surface z-[950] relative">
                <ul className="py-2">
                  {menuItems[openSubmenuIndex].submenu!.map((sub, j) => {
                    const subPath = `/${menuItems[openSubmenuIndex]!.path}/${
                      sub.path
                    }`;
                    const isSubActive = pathname.startsWith(subPath);
                    return (
                      <li key={j}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenSubmenuIndex(null);
                            router.push(subPath);
                          }}
                          className={`menu-pro-font w-full text-left block px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-2xl transition-all duration-200 text-[color:var(--panel-text)] ${
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
        </div>
      </div>

      <main className="flex-1 relative">
        <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 h-full">
          <div className="relative">
            <div className="neu-panel rounded-[2rem] p-2 min-h-[60vh] md:h-[calc(100vh-140px)] overflow-y-auto md:overflow-y-hidden overflow-x-hidden overscroll-contain">
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
      <div id="modal-root"></div>
    </>
  );
}

export { ModalPortal };
