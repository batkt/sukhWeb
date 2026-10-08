"use client";

/**
 * «Нууц үг мартсан?» — ажилтны нууц үгийг утасны дугаараар сэргээх цонх.
 *
 * Гурван алхам:
 *   1. Утасны дугаар   → backend SMS-ээр 4 оронтой код илгээнэ
 *   2. Код             → зөвхөн шалгана (кодыг энд хэрэглэхгүй)
 *   3. Шинэ нууц үг    → код + нууц үгийг хамт илгээж сэргээнэ
 *
 * Нэг утсан дээр ОЛОН ажилтны данс байж болно. Тийм үед backend нь 409-ээр
 * `dansnuud` жагсаалт буцаадаг тул аль дансаа сэргээхийг хэрэглэгчээр
 * сонгуулна.
 *
 * Загварын хувьд нэвтрэх хуудастай ижил CSS хувьсагчуудыг (`--surface-bg`,
 * `--panel-text` г.м.) шууд хэрэглэнэ — Tailwind-ийн `bg-card`/`text-primary`
 * зэрэг токенууд энэ төсөл дээр гэрэл горимд утгагүй байдаг.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Phone, KeyRound, Lock, Eye, EyeOff, X, ArrowLeft } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";

type Alkham = "utas" | "code" | "nuutsUg";

type Dans = {
  nevtrekhNer: string;
  nuusanNer: string;
  baiguullagiinNer: string;
};

const oruulakhStyle: React.CSSProperties = {
  background: "var(--surface-bg)",
  color: "var(--panel-text)",
  borderColor: "var(--surface-border)",
};

/** Серверээс ирсэн алдааны мессежийг гаргаж авна. */
function aldaaniiMessage(e: any, nuuts: string): string {
  return e?.response?.data?.message || e?.message || nuuts;
}

export default function NuutsUgMartsan({
  nee,
  khaaya,
  ekhniiNevtrekhNer,
}: {
  nee: boolean;
  khaaya: () => void;
  /** Нэвтрэх формд бичсэн нэр. Олон данстай үед урьдчилж таана. */
  ekhniiNevtrekhNer?: string;
}) {
  const [alkham, setAlkham] = useState<Alkham>("utas");
  const [utas, setUtas] = useState("");
  const [code, setCode] = useState("");
  const [shineNuutsUg, setShineNuutsUg] = useState("");
  const [davtakhNuutsUg, setDavtakhNuutsUg] = useState("");
  const [nevtrekhNer, setNevtrekhNer] = useState("");
  const [dansnuud, setDansnuud] = useState<Dans[]>([]);
  const [kharuulakh, setKharuulakh] = useState(false);
  const [achaalj, setAchaalj] = useState(false);
  const [aldaa, setAldaa] = useState("");
  const [uldsenSekund, setUldsenSekund] = useState(0);

  // Цонх хаагдахад бүх төлвийг цэвэрлэнэ — дараа нээхэд өмнөх кодоос
  // эхлэхгүйн тулд.
  useEffect(() => {
    if (nee) return;
    setAlkham("utas");
    setUtas("");
    setCode("");
    setShineNuutsUg("");
    setDavtakhNuutsUg("");
    setNevtrekhNer("");
    setDansnuud([]);
    setAldaa("");
    setUldsenSekund(0);
  }, [nee]);

  // Дахин код илгээх хүртэлх тоолуур.
  useEffect(() => {
    if (uldsenSekund <= 0) return;
    const id = window.setInterval(
      () => setUldsenSekund((s) => (s <= 1 ? 0 : s - 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [uldsenSekund]);

  // Escape дарахад хаана.
  useEffect(() => {
    if (!nee) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") khaaya();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nee, khaaya]);

  const codeIlgeeye = useCallback(
    async (songosonNer?: string) => {
      setAldaa("");
      const tsever = utas.replace(/\D/g, "");
      if (tsever.length !== 8) {
        setAldaa("Утасны дугаараа 8 оронтойгоор оруулна уу.");
        return;
      }
      try {
        setAchaalj(true);
        const { data } = await uilchilgee().post("/ajiltanNuutsUgCodeIlgeeye", {
          utas: tsever,
          nevtrekhNer: songosonNer || nevtrekhNer || ekhniiNevtrekhNer || undefined,
        });
        setDansnuud([]);
        setUldsenSekund(data?.dakhinIlgeekhSekund || 60);
        setAlkham("code");
      } catch (e: any) {
        const khariu = e?.response?.data;
        // Олон данстай бол сонголт үзүүлнэ — алдаа биш, дараагийн алхам.
        if (khariu?.olonDans && Array.isArray(khariu.dansnuud)) {
          setDansnuud(khariu.dansnuud);
          setAldaa(khariu.message || "Аль дансаа сонгоно уу.");
          return;
        }
        if (khariu?.dakhinIlgeekhSekund)
          setUldsenSekund(khariu.dakhinIlgeekhSekund);
        setAldaa(aldaaniiMessage(e, "Код илгээхэд алдаа гарлаа."));
      } finally {
        setAchaalj(false);
      }
    },
    [utas, nevtrekhNer, ekhniiNevtrekhNer],
  );

  const codeShalgaya = useCallback(async () => {
    setAldaa("");
    if (code.trim().length !== 4) {
      setAldaa("4 оронтой кодоо оруулна уу.");
      return;
    }
    try {
      setAchaalj(true);
      await uilchilgee().post("/ajiltanNuutsUgCodeShalgaya", {
        utas: utas.replace(/\D/g, ""),
        code: code.trim(),
        nevtrekhNer: nevtrekhNer || ekhniiNevtrekhNer || undefined,
      });
      setAlkham("nuutsUg");
    } catch (e: any) {
      setAldaa(aldaaniiMessage(e, "Код шалгахад алдаа гарлаа."));
    } finally {
      setAchaalj(false);
    }
  }, [code, utas, nevtrekhNer, ekhniiNevtrekhNer]);

  const nuutsUgSergeeye = useCallback(async () => {
    setAldaa("");
    if (shineNuutsUg.length < 4) {
      setAldaa("Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой.");
      return;
    }
    if (shineNuutsUg !== davtakhNuutsUg) {
      setAldaa("Шинэ нууц үг таарахгүй байна.");
      return;
    }
    try {
      setAchaalj(true);
      const { data } = await uilchilgee().post("/ajiltanNuutsUgSergeeye", {
        utas: utas.replace(/\D/g, ""),
        code: code.trim(),
        shineNuutsUg,
        davtakhNuutsUg,
        nevtrekhNer: nevtrekhNer || ekhniiNevtrekhNer || undefined,
      });
      khaaya();
      openSuccessOverlay(
        data?.message || "Нууц үг амжилттай сэргээгдлээ.",
      );
    } catch (e: any) {
      setAldaa(aldaaniiMessage(e, "Нууц үг сэргээхэд алдаа гарлаа."));
      // Код хүчингүй болсон бол эхнээс нь эхлүүлэх хэрэгтэй.
      if (e?.response?.status === 400 && /код/i.test(aldaaniiMessage(e, "")))
        setAlkham("code");
    } finally {
      setAchaalj(false);
    }
  }, [
    shineNuutsUg,
    davtakhNuutsUg,
    utas,
    code,
    nevtrekhNer,
    ekhniiNevtrekhNer,
    khaaya,
  ]);

  if (!nee) return null;

  const garchig =
    alkham === "utas"
      ? "Нууц үг сэргээх"
      : alkham === "code"
        ? "Баталгаажуулах код"
        : "Шинэ нууц үг";

  const tailbar =
    alkham === "utas"
      ? "Бүртгэлтэй утасны дугаараа оруулна уу. Баталгаажуулах код илгээнэ."
      : alkham === "code"
        ? `${utas.replace(/\D/g, "")} дугаарт илгээсэн 4 оронтой кодоо оруулна уу.`
        : "Шинэ нууц үгээ оруулна уу.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        // Зөвхөн дэвсгэр дээр дарахад хаана, цонх дотроос чирэхэд хаахгүй.
        if (e.target === e.currentTarget) khaaya();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={garchig}
        className="menu-surface w-full max-w-md overflow-hidden rounded-3xl px-5 py-7 sm:px-8"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl text-theme">{garchig}</h2>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--muted-text)" }}
            >
              {tailbar}
            </p>
          </div>
          <button
            type="button"
            onClick={khaaya}
            aria-label="Хаах"
            className="shrink-0 rounded-full p-1 transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-text)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (achaalj) return;
            if (alkham === "utas") codeIlgeeye();
            else if (alkham === "code") codeShalgaya();
            else nuutsUgSergeeye();
          }}
        >
          {alkham === "utas" && (
            <>
              <div className="space-y-2">
                <label htmlFor="sergeekhUtas" className="text-sm text-theme">
                  Утасны дугаар
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
                    style={{ color: "var(--muted-text)" }}>
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    id="sergeekhUtas"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="99112233"
                    value={utas}
                    onChange={(e) => setUtas(e.target.value)}
                    disabled={achaalj}
                    autoFocus
                    className="h-12 w-full rounded-2xl border pl-12 pr-4 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={oruulakhStyle}
                  />
                </div>
              </div>

              {/* Нэг утсан дээр хэд хэдэн данс байвал сонгуулна. */}
              {dansnuud.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-theme">Аль дансаа сэргээх вэ?</span>
                  <div className="flex flex-col gap-2">
                    {dansnuud.map((d) => (
                      <button
                        key={d.nevtrekhNer}
                        type="button"
                        disabled={achaalj}
                        onClick={() => {
                          setNevtrekhNer(d.nevtrekhNer);
                          codeIlgeeye(d.nevtrekhNer);
                        }}
                        className="flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left text-sm transition-all hover:opacity-80 disabled:opacity-50"
                        style={oruulakhStyle}
                      >
                        <span>{d.nuusanNer}</span>
                        {!!d.baiguullagiinNer && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--muted-text)" }}
                          >
                            {d.baiguullagiinNer}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {alkham === "code" && (
            <div className="space-y-2">
              <label htmlFor="sergeekhCode" className="text-sm text-theme">
                Баталгаажуулах код
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
                  style={{ color: "var(--muted-text)" }}>
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  id="sergeekhCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  placeholder="0000"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  disabled={achaalj}
                  autoFocus
                  className="h-12 w-full rounded-2xl border pl-12 pr-4 text-center text-lg tracking-[0.5em] transition-all focus:border-transparent focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={oruulakhStyle}
                />
              </div>

              <button
                type="button"
                disabled={achaalj || uldsenSekund > 0}
                onClick={() => codeIlgeeye()}
                className="text-xs underline-offset-4 transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: "var(--muted-text)" }}
              >
                {uldsenSekund > 0
                  ? `Дахин илгээх (${uldsenSekund}с)`
                  : "Код дахин илгээх"}
              </button>
            </div>
          )}

          {alkham === "nuutsUg" && (
            <>
              <div className="space-y-2">
                <label htmlFor="shineNuutsUg" className="text-sm text-theme">
                  Шинэ нууц үг
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
                    style={{ color: "var(--muted-text)" }}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="shineNuutsUg"
                    type={kharuulakh ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={shineNuutsUg}
                    onChange={(e) => setShineNuutsUg(e.target.value)}
                    disabled={achaalj}
                    autoFocus
                    className="h-12 w-full rounded-2xl border pl-12 pr-12 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={oruulakhStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setKharuulakh((v) => !v)}
                    aria-label={kharuulakh ? "Нууц үг нуух" : "Нууц үг харах"}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors"
                    style={{ color: "var(--muted-text)" }}
                  >
                    {kharuulakh ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="davtakhNuutsUg" className="text-sm text-theme">
                  Нууц үг давтах
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
                    style={{ color: "var(--muted-text)" }}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="davtakhNuutsUg"
                    type={kharuulakh ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={davtakhNuutsUg}
                    onChange={(e) => setDavtakhNuutsUg(e.target.value)}
                    disabled={achaalj}
                    className="h-12 w-full rounded-2xl border pl-12 pr-4 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={oruulakhStyle}
                  />
                </div>
              </div>
            </>
          )}

          {!!aldaa && (
            <p
              role="alert"
              className="rounded-2xl px-4 py-2.5 text-xs leading-relaxed"
              style={{
                background: "color-mix(in oklch, #ef4444, transparent 88%)",
                color: "var(--panel-text)",
              }}
            >
              {aldaa}
            </p>
          )}

          <button
            type="submit"
            disabled={achaalj}
            className="relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl font-medium text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, var(--theme), color-mix(in srgb, var(--theme) 80%, #000))",
              border:
                "1px solid color-mix(in srgb, var(--theme) 50%, rgba(255,255,255,0.2))",
              boxShadow:
                "0 10px 24px color-mix(in srgb, var(--theme) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            {achaalj && (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {achaalj
              ? "Түр хүлээнэ үү..."
              : alkham === "utas"
                ? "Код авах"
                : alkham === "code"
                  ? "Үргэлжлүүлэх"
                  : "Нууц үг хадгалах"}
          </button>

          {alkham !== "utas" && (
            <button
              type="button"
              disabled={achaalj}
              onClick={() => {
                setAldaa("");
                setAlkham(alkham === "nuutsUg" ? "code" : "utas");
              }}
              className="mx-auto flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ color: "var(--muted-text)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Буцах
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
