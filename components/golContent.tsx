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
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById("modal-root") || document.body;
    setTarget(el);
  }, []);

  if (!target) return null;
  return createPortal(children, target);
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

  // Close any open submenu when route changes
  useEffect(() => {
    setOpenSubmenuIndex(null);
  }, [pathname]);

  // focus mobile search input when opened and prevent body scroll
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

  // close mobile search with Escape
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
    // { label: "Бүртгэл", path: "burtgel" },
    // {
    //   label: "Мэдэгдэл",
    //   path: "medegdel",
    //   submenu: [
    //     { label: "Шаардлага", path: "shaardlaga" },
    //     { label: "Санал хүсэлт", path: "sanalkhuselt" },
    //     { label: "Мэдэгдэл", path: "medegdel" },
    //     { label: "Дуудлага", path: "duudlaga" },
    //     { label: "Анкет", path: "anket" },
    //   ],
    // },
    {
      label: "Төлбөр",
      path: "tulbur",
    },
    {
      label: "Тайлан",
      path: "tailan",
      submenu: [
        // { label: "Санхүү", path: "sankhuu" },
        // { label: "Оршин суугч", path: "orshinSuugch" },
        // { label: "Авлагийн насжилт", path: "avlagiinNasjilt" },
        // { label: "Өр, авлагын тайлан", path: "debt" },
        // { label: "Орлого, зарлагын тайлан", path: "income-expense" },
        // { label: "Нийт ашиг, алдагдал", path: "profit-loss" },
        // { label: "Гүйлгээний түүх", path: "guilgee" },
        // { label: "Гүйцэтгэлийн тайлан", path: "guitsetgel" },
        { label: "Санхүүгийн тайлан", path: "/financial" },
        { label: "Гүйцэтгэлийн тайлан", path: "/performance" },
      ],
    },
    // {
    //   label: "Зогсоол",
    //   path: "zogsool",
    //   submenu: [
    //     { label: "Жагсаалт", path: "jagsaalt" },
    //     { label: "Камер касс", path: "camera" },
    //   ],
    // },
  ];

  const handleLogout = async () => {
    try {
      setShowLogout(false);
      // Clear auth using central logout to remove cookies/localStorage
      garya();
      // Fallback in case full page reload doesn't happen
      router.replace("/login");
    } catch (_) {
      router.replace("/login");
    }
  };

  const userName = ajiltan?.ner || ajiltan?.nevtrekhNer || "User";
  const isLoggedIn = !!token && !!ajiltan;
  return (
    <>
      <nav className="w-full z-[500]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <ThemedLogo />
              </div>
              <div className="hidden sm:block w-48 sm:w-56">
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
                  tone="neutral"
                />
              </div>
            </div>

            {/* Center: Menu (hidden on small to keep right controls visible) */}
            <div className="hidden md:flex flex-1 items-center justify-center px-2">
              <div className="flex items-center justify-start md:justify-center gap-2 sm:gap-3 relative flex-nowrap overflow-x-auto overflow-y-visible md:overflow-visible px-2 whitespace-nowrap custom-scrollbar min-w-0">
                {menuItems.map((item, i) => {
                  const isParentActive = pathname.startsWith(`/${item.path}`);
                  const isOpen = openSubmenuIndex === i;
                  return (
                    <div key={i} className="relative shrink-0 z-[80]">
                      {item.submenu ? (
                        <>
                          {/* Mobile: tap to open inline */}
                          <button
                            type="button"
                            onClick={() =>
                              setOpenSubmenuIndex((prev) =>
                                prev === i ? null : i
                              )
                            }
                            className={`md:hidden px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] whitespace-nowrap ${
                              isParentActive
                                ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner scale-105"
                                : "hover:menu-surface"
                            }`}
                          >
                            {item.label}
                          </button>

                          {/* Mobile submenu dropdown */}
                          {isOpen && (
                            <div className="md:hidden absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl shadow-lg menu-surface z-[120]">
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

                          {/* Desktop: parent clickable and hover to open */}
                          <button
                            type="button"
                            role="menuitem"
                            onMouseEnter={() => setOpenSubmenuIndex(i)}
                            onMouseLeave={() => {
                              /* leave handled on wrapper */
                            }}
                            onClick={() => {
                              setOpenSubmenuIndex(null);
                              router.push(`/${item.path}`);
                            }}
                            className={`hidden md:inline-flex px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] whitespace-nowrap pointer-events-auto ${
                              isParentActive
                                ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 shadow-inner scale-105"
                                : "hover:menu-surface"
                            } relative z-[80]`}
                          >
                            {item.label}
                          </button>

                          {/* Desktop submenu (absolute) */}
                          {isOpen && (
                            <div
                              onMouseEnter={() => setOpenSubmenuIndex(i)}
                              onMouseLeave={() => setOpenSubmenuIndex(null)}
                              className="hidden md:block absolute left-1/2 transform -translate-x-1/2 mt-3 w-56 rounded-2xl shadow-lg menu-surface z-[90]"
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
                          } relative z-[80]`}
                        >
                          {item.label}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Search, settings, user */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
              <div className="relative h-10 w-64 hidden md:flex items-center neu-panel">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--panel-text)] opacity-60 pointer-events-none" />
                <input
                  aria-label="Global search"
                  className="w-full h-full pl-10 pr-3 rounded-2xl border border-transparent bg-transparent text-theme focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)] transition-all"
                  placeholder="Хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="md:hidden">
                <button
                  aria-label="Open search"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full menu-surface hover:scale-105 transition-all duration-300"
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              </div>

              <UnguSongokh />
              <ThemeModeToggler buttonClassName="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full neu-panel hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--focus-ring)]" />
              <button
                onClick={() => router.push("/tokhirgoo")}
                className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full neu-panel hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--focus-ring)]"
              >
                <Settings className="w-5 h-5" />
              </button>

              {isLoggedIn && (
                <div className="relative" ref={avatarRef}>
                  <div
                    onClick={() => setShowLogout(!showLogout)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none font-bold shadow-md hover:scale-105 transition-transform"
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>

                  {showLogout && (
                    <div className="absolute right-0 mt-2 w-40 menu-surface rounded-xl transition-all duration-300 z-[120]">
                      <ul className="py-2">
                        <li>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm rounded-2xl hover:menu-surface/80 transition-all text-[color:var(--panel-text)]"
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
        </div>
      </nav>

      {/* Mobile Menu Bar */}
      <div className="md:hidden w-full z-[400]">
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
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
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] shrink-0 ${
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
              <div className="mt-2 w-full rounded-2xl shadow-lg menu-surface z-[350]">
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
          <div className="fixed inset-0 z-[90] flex items-start p-4">
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
                  className="p-2"
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
