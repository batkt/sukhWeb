"use client";

import { Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { createPortal } from "react-dom";
import UnguSongokh from "./ungu/unguSongokh";

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

  const { ajiltan, token } = useAuth();
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    {
      label: "Мэдэгдэл",
      path: "medegdel",
      submenu: [
        { label: "Шаардлага", path: "shaardlaga" },
        { label: "Санал хүсэлт", path: "sanalkhuselt" },
        { label: "Мэдэгдэл", path: "medegdel" },
        { label: "Дуудлага", path: "duudlaga" },
        { label: "Анкет", path: "anket" },
      ],
    },
    {
      label: "Төлбөр тооцоо",
      path: "tulbur",
      submenu: [
        { label: "Дансны хуулга", path: "dansKhuulga" },
        { label: "Гүйлгээний түүх", path: "guilgeeTuukh" },
      ],
    },
    {
      label: "Тайлан",
      path: "tailan",
      submenu: [
        { label: "Санхүү", path: "sankhuu" },
        { label: "Оршин суугч", path: "orshinSuugch" },
        { label: "Авлагийн насжилт", path: "avlagiinNasjilt" },
        { label: "Насжилт", path: "nasjilt" },
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
    router.push("/");
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
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-12 h-12 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => router.push("/khynalt")}
                />
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold font-serif italic text-[color:var(--panel-text)]">
                    Амар Сөх
                  </span>
                </div>

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
                <UnguSongokh />
                <button
                  onClick={() => router.push("/tokhirgoo")}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full menu-surface hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--focus-ring)]"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button className="inline-flex items-center justify-center h-10 w-10 rounded-full menu-surface hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--focus-ring)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-bell w-5 h-5"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                </button>

                {isLoggedIn && (
                  <div className="relative" ref={avatarRef}>
                    <div
                      onClick={() => setShowLogout(!showLogout)}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[#1e3a8a] flex items-center justify-center cursor-pointer select-none font-bold shadow-md hover:scale-105 transition-transform"
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
            <div className="neu-panel rounded-[2rem] p-6 h-[calc(100vh-140px)] overflow-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>

      <div id="modal-root"></div>
    </>
  );
}

export { ModalPortal };
