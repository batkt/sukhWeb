"use client";

import { Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { verifySession, logout } from "@/lib/auth";

interface GolContentProps {
  children: React.ReactNode;
  title?: string;
  khuudasniiNer?: string;
  className?: string;
}

export default function GolContent({ children }: GolContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [showLogout, setShowLogout] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMounted(true);

    const session = verifySession();
    if (session.isAuthenticated) {
      setIsLoggedIn(true);
      setUserName(session.ner || "AC");
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  if (!mounted) return null;

  const menuItems = [
    { label: "Хяналт", path: "khynalt" },
    { label: "Гэрээ", path: "geree" },
    { label: "Бүртгэл", path: "burtgel" },
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
        { label: "И-Баримт", path: "ebarimt" },
        { label: "Дансны хуулга", path: "dansKhuulga" },
        { label: "Гүйлгээний түүх", path: "guilgeeTuukh" },
        { label: "Нэхэмжлэх", path: "nekhemjlekh" },
        { label: "Хөнгөлөлт", path: "khungulult" },
        { label: "Зардал", path: "zardal" },
      ],
    },
    {
      label: "Тайлан",
      path: "tailan",
      submenu: [
        { label: "График", path: "graphic" },
        { label: "Аналитик", path: "analityc" },
        { label: "Нэгтгэл", path: "negtgel" },
        { label: "Насжилт", path: "nasjilt" },
        { label: "Гүйцэтгэлийн тайлан", path: "guitsetgel" },
      ],
    },
    {
      label: "Зогсоол",
      path: "zogsool",
      submenu: [
        { label: "Жагсаалт", path: "jagsaalt" },
        { label: "Камер касс", path: "camera" },
      ],
    },
  ];

  return (
    <>
      <nav className="bg-white/30  backdrop-blur-xl shadow-[0_4px_4px_rgba(0,0,0,0.1)]   sticky top-0 z-50 ">
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
                <span className="text-4xl font-extrabold text-slate-900 font-serif italic">
                  Амар Сөх
                </span>
              </div>

              <div className="flex items-center gap-2 relative">
                {menuItems.map((item, i) => {
                  const isActive = pathname === `/${item.path}`;

                  return (
                    <div key={i} className="relative group">
                      {item.submenu ? (
                        <span
                          className={`px-5 py-2 rounded-3xl text-sm font-medium transition-all duration-300 cursor-default
              ${
                isActive
                  ? "bg-white/30 backdrop-blur-xl text-black shadow-xl scale-105 border border-white/30"
                  : "text-black hover:bg-white/20 hover:scale-105 hover:shadow-md border border-white/20"
              }`}
                        >
                          {item.label}
                        </span>
                      ) : (
                        <a
                          href={`/${item.path}`}
                          className={`px-5 py-2 rounded-3xl text-sm font-medium transition-all duration-300
              ${
                isActive
                  ? "bg-white/30 backdrop-blur-xl text-black shadow-xl scale-105 border border-white/30"
                  : "text-black hover:bg-white/20 hover:scale-105 hover:shadow-md border border-white/20"
              }`}
                        >
                          {item.label}
                        </a>
                      )}

                      {item.submenu && (
                        <div
                          className="absolute left-0 mt-2 w-52 bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 opacity-0 invisible
              group-hover:opacity-100 group-hover:visible transition-all duration-300"
                        >
                          <ul className="py-2">
                            {item.submenu.map((sub, j) => (
                              <li key={j}>
                                <a
                                  href={`/${item.path}/${sub.path}`}
                                  className="block px-4 py-2 text-sm text-black rounded-2xl transition-all duration-300
                      hover:bg-white/30 hover:scale-105 hover:shadow-md"
                                >
                                  {sub.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/tokhirgoo")}
                className="inline-flex items-center justify-center gap-2 text-sm font-medium h-10 w-10 rounded-full text-slate-900 
                  transition-all duration-300 hover:bg-black/10 hover:text-slate-900/80 hover:scale-105 hover:shadow-md"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                className="inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-900
                  transition-all duration-300 hover:bg-black/10 hover:text-slate-900/80 hover:scale-105 hover:shadow-md"
              >
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
                    className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center cursor-pointer select-none"
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>

                  {showLogout && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-amber-200 rounded-2xl shadow-lg transition-all duration-300 z-50">
                      <ul className="py-2">
                        <li>
                          <button
                            onClick={() => logout()}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

      <main className="flex-1 h-[calc(100vh-90px)] overflow-y-auto scrollable max-w-[1600px] mx-auto px-8 py-12">
        <div
          className="relative rounded-[2rem] p-12 
               bg-white/10 backdrop-blur-2xl border border-white/20 
               before:absolute before:inset-0 before:rounded-[2rem] before:bg-gradient-to-tr 
               before:from-white/20 before:to-transparent before:opacity-40 before:pointer-events-none"
        >
          {children}
        </div>
      </main>
    </>
  );
}
