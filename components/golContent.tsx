"use client";

import { Settings, Search as SearchIcon, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { createPortal } from "react-dom";
import UnguSongokh from "./ungu/unguSongokh";
import ThemedLogo from "@/components/ui/ThemedLogo";
import { useSearch } from "@/context/SearchContext";

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const { ajiltan, token, garya } = useAuth();
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      label: "Төлбөр тооцоо",
      path: "tulbur",
    },
    {
      label: "Тайлан",
      path: "tailan",
      submenu: [
        // { label: "Санхүү", path: "sankhuu" },
        { label: "Оршин суугч", path: "orshinSuugch" },
        { label: "Авлагийн насжилт", path: "avlagiinNasjilt" },
        { label: "Өр, авлагын тайлан", path: "debt" },
        { label: "Орлого, зарлагын тайлан", path: "income-expense" },
        { label: "Нийт ашиг, алдагдал", path: "profit-loss" },
        { label: "Гүйлгээний түүх", path: "guilgee" },
        { label: "Гүйцэтгэлийн тайлан", path: "guitsetgel" },
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
      <div className="min-h-screen flex flex-col">
        <nav className="neu-nav sticky top-0 z-[60]">
          <div className="max-w-[1600px] mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <ThemedLogo
                  size={48}
                  withBg
                  style={{
                    background: "#000",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                />
                {/* <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold font-serif italic text-[color:var(--panel-text)]">
                    Амар Сөх
                  </span>
                </div> */}

                <div className="flex items-center gap-2 relative">
                  {menuItems.map((item, i) => {
                    const isParentActive = pathname.startsWith(`/${item.path}`);
                    return (
                      <div key={i} className="relative group ">
                        {item.submenu ? (
                          <span
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-default text-[color:var(--panel-text)] ${
                              isParentActive
                                ? "menu-surface ring-1 ring-[color:var(--surface-border)] shadow-sm scale-105"
                                : "hover:menu-surface"
                            }`}
                          >
                            {item.label}
                          </span>
                        ) : (
                          <a
                            href={`/${item.path}`}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-[color:var(--panel-text)] ${
                              isParentActive
                                ? "menu-surface ring-1 ring-[color:var(--surface-border)] shadow-sm scale-105"
                                : "hover:menu-surface"
                            }`}
                          >
                            {item.label}
                          </a>
                        )}

                        {item.submenu && (
                          <div className="absolute left-0 mt-2 w-52 rounded-2xl  shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 menu-surface z-[70]">
                            <ul className="py-2">
                              {item.submenu.map((sub, j) => {
                                const subPath = `/${item.path}/${sub.path}`;
                                const isSubActive =
                                  pathname.startsWith(subPath);
                                return (
                                  <li key={j}>
                                    <a
                                      href={subPath}
                                      className={`block px-4 py-2 text-sm rounded-2xl transition-all duration-200 text-[color:var(--panel-text)] ${
                                        isSubActive
                                          ? "menu-surface ring-1 ring-[color:var(--surface-border)] shadow-sm"
                                          : "hover:translate-x-0.5 hover:menu-surface/80"
                                      }`}
                                    >
                                      {sub.label}
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4">
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
                <button
                  onClick={() => router.push("/tokhirgoo")}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full neu-panel hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--focus-ring)]"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {isLoggedIn && (
                  <div className="relative" ref={avatarRef}>
                    <div
                      onClick={() => setShowLogout(!showLogout)}
                      className="w-10 h-10 rounded-full neu-panel flex items-center justify-center cursor-pointer select-none font-bold shadow-md hover:scale-105 transition-transform"
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>

                    {showLogout && (
                      <div className="absolute right-0 mt-2 w-40 menu-surface rounded-xl transition-all duration-300 z-[80]">
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

        <main className="flex-1 relative h-[calc(100vh-80px)]">
          <div className="max-w-[1600px] h-full mx-auto px-8 py-6">
            <div className="neu-panel rounded-[2rem] p-4 h-[calc(100vh-140px)] overflow-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>

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
