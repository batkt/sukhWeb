"use client";

import { Settings, Search as SearchIcon, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { createPortal } from "react-dom";
import UnguSongokh from "./ungu/unguSongokh";
import ThemedLogo from "@/components/ui/ThemedLogo";
import ThemeModeToggler from "@/components/ui/ThemeModeToggler";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const { ajiltan, token, garya } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const buildings = baiguullaga?.barilguud || [];
  const avatarRef = useRef<HTMLDivElement>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpenSubmenuIndex(null);
  }, [pathname]);

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

  if (!mounted) return null;

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
        { label: "Санхүүгийн тайлан", path: "/financial" },
        { label: "Гүйцэтгэлийн тайлан", path: "/performance" },
      ],
    },
  ];

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Logout button clicked - starting logout process");
    setShowLogout(false);
    
    try {
      // Call the logout function
      console.log("Calling garya()...");
      await garya();
      console.log("garya() completed");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always redirect to login regardless of garya() success
      console.log("Redirecting to /login");
      router.replace("/login");
    }
  };

  const userName = ajiltan?.ner || ajiltan?.nevtrekhNer || "User";
  const isLoggedIn = !!token && !!ajiltan;

  return (
    <>
      <nav className="w-full sticky top-0 z-[10] neu-nav">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          {/* Top row on mobile: Logo + Building Selector */}
          <div className="flex md:hidden items-center justify-between gap-2 mb-2">
            <div className="shrink-0">
              <ThemedLogo />
            </div>
            <div className="flex-1 max-w-[200px]">
              <TusgaiZagvar
                value={selectedBuildingId ?? ""}
                onChange={(v: string) => setSelectedBuildingId(v || null)}
                options={buildings.map((b: any) => ({
                  value: b._id,
                  label: b.ner,
                }))}
                placeholder={
                  buildings.length ? "Барилга" : "Барилга олдсонгүй"
                }
              />
            </div>
          </div>

          {/* Desktop layout: Logo, Building, Menu, Actions */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <ThemedLogo />
              </div>
              <div className="w-56">
                <TusgaiZagvar
                  value={selectedBuildingId ?? ""}
                  onChange={(v: string) => setSelectedBuildingId(v || null)}
                  options={buildings.map((b: any) => ({
                    value: b._id,
                    label: b.ner,
                  }))}
                  placeholder={
                    buildings.length ? "Барилга сонгох" : "Барилга олдсонгүй"
                  }
                />
              </div>
            </div>

            {/* Center: Desktop Menu */}
            <div className="flex flex-1 items-center justify-center px-2">
              <div className="flex items-center justify-center gap-3 relative">
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
                            onMouseEnter={() => setOpenSubmenuIndex(i)}
                            onClick={() => {
                              setOpenSubmenuIndex((prev) =>
                                prev === i ? null : i
                              );
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] whitespace-nowrap pointer-events-auto ${
                              isParentActive
                                ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner scale-105"
                                : "hover:menu-surface"
                            } relative z-[1005]`}
                          >
                            {item.label}
                          </button>

                          {isOpen && (
                            <div
                              onMouseEnter={() => setOpenSubmenuIndex(i)}
                              onMouseLeave={() => setOpenSubmenuIndex(null)}
                              className="absolute left-1/2 transform -translate-x-1/2 mt-3 w-56 rounded-2xl shadow-lg menu-surface z-[1100] pointer-events-auto"
                            >
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
                                        className={`w-full text-left block px-4 py-2 text-sm rounded-2xl transition-all duration-200 text-[color:var(--panel-text)] ${
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
                        <a
                          href={`/${item.path}`}
                          onClick={() => setOpenSubmenuIndex(null)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] whitespace-nowrap pointer-events-auto ${
                            isParentActive
                              ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner scale-105"
                              : "hover:menu-surface"
                          } relative z-[1005]`}
                        >
                          {item.label}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop actions */}
            <div className="flex items-center justify-end gap-3 shrink-0">
              <div className="relative h-10 w-64 flex items-center neu-panel">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--panel-text)] opacity-60 pointer-events-none" />
                <input
                  aria-label="Global search"
                  className="w-full h-full pl-10 pr-3 rounded-2xl border border-transparent bg-transparent text-theme focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)] transition-all"
                  placeholder="Хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <UnguSongokh />
              <ThemeModeToggler buttonClassName="inline-flex items-center justify-center h-10 w-10 rounded-full neu-panel hover:scale-105 transition-all duration-300" />

              <button
                onClick={() => router.push("/tokhirgoo")}
                className="inline-flex items-center justify-center h-10 w-10 rounded-full neu-panel hover:scale-105 transition-all duration-300"
              >
                <Settings className="w-5 h-5" />
              </button>

              {isLoggedIn && (
                <div className="relative z-[150]" ref={avatarRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLogout(!showLogout);
                    }}
                    className="w-10 h-10 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none font-bold shadow-md hover:scale-105 transition-transform"
                  >
                    {userName.charAt(0).toUpperCase()}
                  </button>

                  {showLogout && (
                    <div 
                      className="absolute right-0 mt-2 w-40 menu-surface rounded-xl transition-all duration-300 z-[9999] shadow-xl pointer-events-auto"
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
                              console.log("Mouse down on logout button - triggering logout");
                              handleLogout(e);
                            }}
                            className="w-full text-left px-4 py-2 text-sm rounded-2xl hover:menu-surface/80 transition-all text-[color:var(--panel-text)] cursor-pointer pointer-events-auto"
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

          {/* Mobile actions row */}
          <div className="flex md:hidden items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Open search"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileSearchOpen(true);
              }}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full neu-panel active:scale-95 hover:scale-105 transition-all duration-300"
            >
              <SearchIcon className="w-4 h-4 pointer-events-none" />
            </button>

            <UnguSongokh />
            <ThemeModeToggler buttonClassName="inline-flex items-center justify-center h-9 w-9 rounded-full neu-panel hover:scale-105 transition-all duration-300" />

            <button
              onClick={() => router.push("/tokhirgoo")}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full neu-panel hover:scale-105 transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
            </button>

            {isLoggedIn && (
              <div className="relative z-[150]" ref={avatarRef}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLogout(!showLogout);
                  }}
                  className="w-9 h-9 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none font-bold shadow-md hover:scale-105 transition-transform"
                >
                  {userName.charAt(0).toUpperCase()}
                </div>

                {showLogout && (
                  <div className="absolute right-0 mt-2 w-40 menu-surface rounded-xl transition-all duration-300 z-[200] shadow-xl">
                    <ul className="py-2">
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm rounded-2xl hover:menu-surface/80 transition-all text-[color:var(--panel-text)] cursor-pointer"
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
 
      <div className="md:hidden w-full bg-[color:var(--surface-bg)] sticky top-[120px] z-[9]">
        <div className="px-3 pb-2">
          <div className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
            {menuItems.map((item, i) => {
              const isParentActive = pathname.startsWith(`/${item.path}`);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    item.submenu
                      ? setOpenSubmenuIndex((prev) => (prev === i ? null : i))
                      : router.push(`/${item.path}`)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 text-[color:var(--panel-text)] shrink-0 ${
                    isParentActive
                      ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner"
                      : "hover:menu-surface"
                  }`}
                >
                  {item.label}
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
                          className={`w-full text-left block px-4 py-2 text-sm rounded-2xl transition-all duration-200 text-[color:var(--panel-text)] ${
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

      <main className="flex-1 relative md:h-[calc(100vh-80px)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
          <div className="relative">
            <div className="neu-panel rounded-[2rem] p-2 min-h-[60vh] md:h-[calc(100vh-140px)] overflow-y-auto md:overflow-y-hidden overflow-x-hidden overscroll-contain">
              {children}
            </div>
          </div>
        </div>
      </main>

      {mobileSearchOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1200] flex items-start p-4 pointer-events-auto">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileSearchOpen(false)}
            />
            <div className="relative w-full max-w-xl mx-auto mt-24">
              <div className="flex items-center gap-2 bg-[color:var(--surface-bg)] p-3 rounded-2xl shadow-lg">
                <SearchIcon className="w-5 h-5 text-theme" />
                <input
                  ref={mobileSearchInputRef}
                  aria-label="Mobile search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-theme px-2"
                  placeholder="Хайх..."
                />
                <button
                  aria-label="Close search"
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 text-theme"
                >
                  <X className="w-5 h-5" />
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