"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import ThemedLogo from "@/components/ui/ThemedLogo";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import ӨнгөнийЗагварСонгох from "../../../components/ungu/unguSongokh";

/** Зүүн талд солигдох танилцуулга текстүүд. */
const SLIDES: { title: string; text: string }[] = [
  {
    title: "Бодит цагийн\nтөлбөрийн хяналт",
    text: "Айл бүрийн төлбөр, авлагыг цаг тухайд нь хянаж, алдагдлаас урьдчилан сэргийлнэ.",
  },
  {
    title: "Гэрээ, оршин суугчийн\nнэгдсэн бүртгэл",
    text: "Барилга, орц, тоот, оршин суугчийн бүртгэлийг нэг системээс удирдана.",
  },
  {
    title: "Тайлан,\nөгөгдлийн шинжилгээ",
    text: "Орлого, авлагын тайлангаа хүссэн хугацаагаар шүүж, шийдвэрээ өгөгдөлд тулгуурлан гаргана.",
  },
];

const SLIDE_MS = 5200;

export default function LoginPage() {
  const router = useRouter();
  const { newterya } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [slide, setSlide] = useState<number>(0);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const slideTimer = useRef<number | null>(null);

  // Load saved username on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("namaigSana.username");
      if (saved && saved.trim() !== "") {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch { }
  }, []);

  // Screen size detection for lazy loading Lottie animations
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Хөдөлгөөнийг багасгах тохиргоотой үед текст солигдох боловч
  // blur/шилжилтийн эффект хийхгүй.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Текстийг автоматаар солих таймер. Цэг дарж сольсон үед дахин эхлүүлдэг
  // тул шинэ текстийг бүтэн хугацаанд харна.
  const restartSlideTimer = useCallback(() => {
    if (slideTimer.current !== null) window.clearInterval(slideTimer.current);
    slideTimer.current = window.setInterval(
      () => setSlide((i) => (i + 1) % SLIDES.length),
      SLIDE_MS
    );
  }, []);

  useEffect(() => {
    restartSlideTimer();
    return () => {
      if (slideTimer.current !== null) window.clearInterval(slideTimer.current);
    };
  }, [restartSlideTimer]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      openErrorOverlay("И-мэйл болон нууц үгээ оруулна уу");
      return;
    }

    try {
      setLoading(true);

      const success = await newterya({
        nevtrekhNer: email,
        nuutsUg: password,
      });

      if (success) {
        // If user chose to remember, persist the latest username
        try {
          if (rememberMe) localStorage.setItem("namaigSana.username", email);
        } catch { }
        openSuccessOverlay("Амжилттай нэвтэрлээ");
        // Navigate immediately after showing success overlay
        router.push("/khynalt");
        return;
      }

      // Error handling is done inside newterya() with specific toasts
    } catch (error: any) {
      openErrorOverlay("Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Save username immediately when checked; no confirmation dialog
  const namaigSana = (nextChecked: boolean) => {
    try {
      if (nextChecked) {
        localStorage.setItem("namaigSana.username", email || "");
        setRememberMe(true);
      } else {
        localStorage.removeItem("namaigSana.username");
        setRememberMe(false);
      }
    } catch {
      setRememberMe(false);
    }
  };

  const gotoSlide = useCallback(
    (i: number) => {
      setSlide(i);
      restartSlideTimer();
    },
    [restartSlideTimer]
  );

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--gradient-bg)" }}
    >
      {/* Decorative gradient blobs */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full opacity-35"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--surface-bg), var(--surface-border) 18%), transparent 75%)",
          filter: "blur(20px)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-10 w-96 h-96 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--surface-bg), var(--surface-border) 14%), transparent 78%)",
          filter: "blur(24px)",
        }}
      />

      {/* Brand */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-2.5 sm:top-6 sm:left-8">
        <ThemedLogo size={34} withBg={false} />
        <span
          className="text-[15px] font-semibold tracking-[-0.01em]"
          style={{ color: "var(--panel-text)" }}
        >
          Амар СӨХ
        </span>
      </div>

      {/* Theme Selector */}
      <div className="absolute top-5 right-5 z-20 sm:top-6 sm:right-8">
        <ӨнгөнийЗагварСонгох />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] items-center gap-10 px-4 py-24 lg:grid-cols-2 lg:gap-16 lg:px-10">
        {/* ── Зүүн тал: солигдох танилцуулга ─────────────────────── */}
        <section className="hidden flex-col items-center lg:flex">
          {isDesktop && (
            <div className="pointer-events-none h-52 w-52 opacity-95 xl:h-64 xl:w-64">
              <DotLottieReact
                src="https://lottie.host/d17186d3-f164-4808-a9a1-4dd3d95d1f49/0L9eXuFSaO.lottie"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )}

          {/* Слайдуудыг бүгдийг давхарлаж, зөвхөн opacity-г сольсноор layout
              үсрэхгүй, зөөлөн cross-fade болно. */}
          <div className="relative mt-8 h-[210px] w-full max-w-xl text-center">
            {SLIDES.map((s, i) => {
              const active = i === slide;
              return (
                <div
                  key={i}
                  aria-hidden={!active}
                  className="absolute inset-0 flex flex-col items-center justify-start gap-5 ease-out"
                  style={{
                    opacity: active ? 1 : 0,
                    transitionProperty: "opacity, transform, filter",
                    transitionDuration: reduceMotion ? "0ms" : "700ms",
                    transform: reduceMotion
                      ? undefined
                      : active
                        ? "translateY(0) scale(1)"
                        : "translateY(14px) scale(0.985)",
                    filter: reduceMotion
                      ? undefined
                      : active
                        ? "blur(0px)"
                        : "blur(3px)",
                    pointerEvents: active ? "auto" : "none",
                  }}
                >
                  <h2
                    className="whitespace-pre-line text-3xl font-bold leading-[1.22] tracking-[-0.02em] xl:text-[38px]"
                    style={{ color: "var(--panel-text)" }}
                  >
                    {s.title}
                  </h2>
                  <p
                    className="max-w-md text-[15px] leading-relaxed"
                    style={{ color: "var(--muted-text)" }}
                  >
                    {s.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Индикатор цэгүүд */}
          <div className="mt-4 flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => gotoSlide(i)}
                aria-label={s.title.replace("\n", " ")}
                aria-current={i === slide}
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: i === slide ? 26 : 8,
                  background:
                    i === slide
                      ? "var(--panel-text)"
                      : "color-mix(in oklch, var(--panel-text), transparent 72%)",
                }}
              />
            ))}
          </div>
        </section>

        {/* ── Баруун тал: нэвтрэх хэсэг ─────────────────────────── */}
        <section className="flex w-full justify-center lg:justify-end">
          <div className="menu-surface w-full max-w-md overflow-hidden rounded-3xl px-5 py-8 sm:px-10 sm:py-12">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center lg:hidden">
                <ThemedLogo size={72} withBg={false} />
              </div>
              <h1 className="text-3xl text-theme">Нэвтрэх</h1>
              <p className="text-sm text-[color:var(--muted-text)]">
                Амар СӨХ тавтай морилно уу
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-theme">
                  Нэвтрэх нэр
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[color:var(--muted-text)]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="email"
                    name="username"
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Байгууллагын регистр"
                    value={email}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEmail(v);
                      // keep storage in sync when remember is enabled
                      if (rememberMe) {
                        try {
                          localStorage.setItem("namaigSana.username", v);
                        } catch { }
                      }
                    }}
                    required
                    disabled={loading}
                    className="w-full h-12 rounded-2xl border pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={
                      {
                        background: "var(--surface-bg)",
                        color: "var(--panel-text)",
                        borderColor: "var(--surface-border)",
                        "--tw-ring-color": "var(--surface-border)",
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm text-theme">
                  Нууц үг
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[color:var(--muted-text)]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="current-password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full h-12 rounded-2xl border pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--surface-bg)",
                      color: "var(--panel-text)",
                      borderColor: "var(--surface-border)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v: boolean) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                    style={{ color: "var(--muted-text)" }}
                    aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between mt-2">
                <label
                  className="flex items-center gap-2 select-none cursor-pointer text-sm"
                  style={{ color: "var(--panel-text)" }}
                >
                  <input
                    type="checkbox"
                    className="accent-blue-600 w-4 h-4"
                    checked={rememberMe}
                    onChange={(e) => namaigSana(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Намайг сана</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(180deg, var(--glass-tint), var(--glass-tint-2))",
                  color: "var(--panel-text)",
                  border: "1px solid var(--surface-border, rgba(15,23,42,0.12))",
                  boxShadow:
                    "0 12px 28px var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)",
                }}
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
              </button>
            </form>

            <p
              className="text-center text-xs mt-6"
              style={{ color: "var(--muted-text)" }}
            >
              ЗЭВТАБС © Хөгжүүлэв
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
