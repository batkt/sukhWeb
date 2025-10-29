"use client";
import React, { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import ThemedLogo from "@/components/ui/ThemedLogo";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import {
  AnimatePresence,
  motion,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function LoginPage() {
  const router = useRouter();
  const { newterya } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [introDone, setIntroDone] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoTargetRef = useRef<HTMLDivElement>(null);
  const [logoTarget, setLogoTarget] = useState<{ x: number; y: number } | null>(
    null
  );
  const [centerPos, setCenterPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const controls = useAnimation();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!showLoader) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = setTimeout(
      () => setShowLoader(false),
      prefersReduced ? 400 : 900
    );
    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = prev;
    };
  }, [showLoader, prefersReduced]);

  useEffect(() => {
    if (prefersReduced) {
      setIntroDone(true);
      return;
    }

    const calcTarget = () => {
      if (!containerRef.current || !logoTargetRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = logoTargetRef.current.getBoundingClientRect();
      const size = 88;
      const x =
        targetRect.left - containerRect.left + targetRect.width / 2 - size / 2;
      const y =
        targetRect.top - containerRect.top + targetRect.height / 2 - size / 2;
      setLogoTarget({ x, y });

      const cx = containerRect.width / 2 - size / 2;
      const cy = Math.max(24, containerRect.height * 0.12);
      setCenterPos({ x: cx, y: cy });
    };

    const raf = requestAnimationFrame(calcTarget);
    window.addEventListener("resize", calcTarget);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", calcTarget);
    };
  }, [prefersReduced]);

  useEffect(() => {
    if (prefersReduced) return;
    if (showLoader) return;
    if (!logoTarget || !centerPos) return;
    (async () => {
      // Modern intro: fade in + scale with subtle rotation
      await controls.start({
        opacity: [0, 1],
        scale: [0.3, 1.15, 1],
        rotate: [180, -10, 0],
        x: centerPos.x,
        y: centerPos.y,
        transition: {
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1], // elastic ease
        },
      });

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Slide to target position
      await controls.start({
        x: logoTarget.x,
        y: logoTarget.y,
        scale: 1,
        transition: {
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1], // smooth ease out
        },
      });

      setIntroDone(true);
    })();
  }, [controls, logoTarget, centerPos, prefersReduced, showLoader]);

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
        openSuccessOverlay("Амжилттай нэвтэрлээ");
        setTimeout(() => {
          router.push("/khynalt");
        }, 900);
        return;
      }

      openErrorOverlay("Нэвтрэх нэр эсвэл нууц үг буруу байна");
    } catch (error: any) {
      console.error("Login error:", error);
      openErrorOverlay("Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-card"
    >
      <AnimatePresence>
        {showLoader && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center"
            style={{
              background:
                "color-mix(in oklch, var(--surface-bg), transparent 10%)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="menu-surface p-8 rounded-3xl flex flex-col items-center gap-5"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="w-[160px] h-[160px]">
                <DotLottieReact
                  src="https://lottie.host/5386a522-13d7-4766-b11e-78c8c868b2d6/ljDPLtL4kH.lottie"
                  loop
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.9, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-muted-foreground"
              >
                Түр хүлээнэ үү…
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!introDone && (
          <motion.div
            className="absolute z-20 top-0 left-0"
            initial={{
              opacity: 0,
              scale: 0.3,
              rotate: 180,
            }}
            animate={controls}
            exit={{
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.3 },
            }}
          >
            <ThemedLogo
              size={88}
              withBg={true}
              bgMode="theme"
              radius={24}
              bgStrength="strong"
              style={{
                background: "#000",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative gradient blobs */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--surface-bg), var(--surface-border) 18%), transparent 75%)",
          filter: "blur(20px)",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-10 w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--surface-bg), var(--surface-border) 14%), transparent 78%)",
          filter: "blur(24px)",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 hidden md:block lg:right-10 z-[15]"
      >
        <div className="w-40 h-40 lg:w-64 lg:h-64 opacity-95">
          <DotLottieReact
            src="https://lottie.host/d17186d3-f164-4808-a9a1-4dd3d95d1f49/0L9eXuFSaO.lottie"
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </motion.div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden"
          initial={{ y: 0 }}
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{
            y: -4,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            transition: { duration: 0.3 },
          }}
          style={{
            padding: "48px 40px 32px",
          }}
        >
          <div className="text-center mb-8 flex flex-col items-center gap-3">
            <div
              ref={logoTargetRef}
              className="w-[88px] h-[88px] flex items-center justify-center"
            >
              {introDone && (
                <motion.div
                  initial={{
                    scale: 0.5,
                    rotate: -180,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  <ThemedLogo
                    size={88}
                    bgMode="theme"
                    bgStrength="strong"
                    withBg
                    style={{
                      background: "#000",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  />
                </motion.div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Нэвтрэх</h1>
            <p className="text-slate-500 text-sm">Амар СӨХ тавтай морилно уу</p>
          </div>

          <motion.form
            className="space-y-5"
            onSubmit={handleSubmit}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
          >
            <motion.div
              className="space-y-2"
              variants={{
                hidden: { y: 8, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
            >
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Нэвтрэх нэр
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="email"
                  placeholder="aaa@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-12 rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </motion.div>

            <motion.div
              className="space-y-2"
              variants={{
                hidden: { y: 8, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
            >
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Нууц үг
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-12 rounded-2xl border border-slate-300 bg-white pl-12 pr-12 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v: boolean) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl text-slate-900 font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 relative overflow-hidden"
              variants={{
                hidden: { y: 8, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: "linear-gradient(145deg, #f0f0f3, #caccd1)",
                boxShadow: "6px 6px 12px #b8babe, -6px -6px 12px #ffffff",
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow =
                  "inset 3px 3px 7px #b8babe, inset -3px -3px 7px #ffffff";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.boxShadow =
                  "6px 6px 12px #b8babe, -6px -6px 12px #ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "6px 6px 12px #b8babe, -6px -6px 12px #ffffff";
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
            </motion.button>
          </motion.form>

          <motion.p
            className="text-center text-xs text-slate-400 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            ЗЭВТАБС ХХК Хөгжүүлэв
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
