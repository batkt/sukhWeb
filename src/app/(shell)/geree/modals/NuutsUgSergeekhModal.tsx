"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { KeyRound, Eye, EyeOff, X, Sparkles, Loader2, Send, ShieldCheck, User } from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

interface NuutsUgSergeekhModalProps {
  show: boolean;
  onClose: () => void;
  userId?: string | null;
  ner?: string;
  utas?: string;
  isKhariltsagch?: boolean;
  onSuccess?: () => void;
}

export default function NuutsUgSergeekhModal({
  show,
  onClose,
  userId,
  ner,
  utas,
  isKhariltsagch = false,
  onSuccess,
}: NuutsUgSergeekhModalProps) {
  const { token } = useAuth();
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  const [shineNuutsUg, setShineNuutsUg] = useState("");
  const [davtakhNuutsUg, setDavtakhNuutsUg] = useState("");
  const [smsIlgeekh, setSmsIlgeekh] = useState(true);
  const [nuutsUgKharakh, setNuutsUgKharakh] = useState(false);
  const [unshij, setUnshij] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);

  useModalHotkeys({ isOpen: show, onClose });

  useEffect(() => {
    if (show) {
      setShineNuutsUg("");
      setDavtakhNuutsUg("");
      setNuutsUgKharakh(false);
      setAldaa(null);
      setSmsIlgeekh(Boolean(utas && utas.replace(/\D/g, "").length >= 8));
    }
  }, [show, utas]);

  if (!show || !userId) return null;

  const sanamsarguiNuutsUg = () => {
    // 6 оронтой санамсаргүй тоо үүсгэх (хэрэглэгчид санах, SMS-ээр авахад хялбар)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setShineNuutsUg(code);
    setDavtakhNuutsUg(code);
    setNuutsUgKharakh(true);
    setAldaa(null);
  };

  const khadgalya = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAldaa(null);

    const trimmed = shineNuutsUg.trim();
    if (trimmed.length < 4) {
      setAldaa("Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой!");
      return;
    }

    if (trimmed !== davtakhNuutsUg.trim()) {
      setAldaa("Нууц үг хоорондоо таарахгүй байна!");
      return;
    }

    setUnshij(true);
    try {
      const resp = await uilchilgee(token ?? undefined).post("/khereglech/nuutsUgSergeeyeAdmin", {
        id: userId,
        turul: isKhariltsagch ? "khariltsagch" : "orshinSuugch",
        shineNuutsUg: trimmed,
        smsIlgeekh: smsIlgeekh && Boolean(utas),
      });

      openSuccessOverlay(
        resp.data?.message || "Нууц үг амжилттай шинэчлэгдлээ"
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Нууц үг солиход алдаа гарлаа!";
      setAldaa(errMsg);
      openErrorOverlay(errMsg);
    } finally {
      setUnshij(false);
    }
  };

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-[color:var(--panel)] backdrop-blur-sm p-4"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="relative z-[12001] w-full max-w-[460px] bg-[color:var(--surface-bg)] rounded-3xl border border-[color:var(--surface-border)] shadow-2xl p-6 select-none overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)] cursor-move"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-theme/10 text-brand shadow-xs">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">
                    Нууц үг сэргээх
                  </h3>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    {isKhariltsagch ? "Харилцагчийн нэвтрэх эрх" : "Оршин суугчийн нэвтрэх эрх"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition cursor-pointer"
                title="Хаах"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target User Info Card */}
            <div className="my-4 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-theme/15 text-brand">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[color:var(--panel-text)] dark:text-white truncate">
                    {ner || "Нэр тодорхойгүй"}
                  </p>
                  <p className="text-[11px] text-[color:var(--muted-text)] truncate">
                    Утас: {utas || "Бүртгэлгүй"}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-theme/10 px-2.5 py-0.5 text-[10px] font-medium text-brand">
                {isKhariltsagch ? "Харилцагч" : "Оршин суугч"}
              </span>
            </div>

            {/* Error banner */}
            {aldaa && (
              <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs text-danger font-medium">
                {aldaa}
              </div>
            )}

            {/* Form */}
            <form onSubmit={khadgalya} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[color:var(--panel-text)]">
                    Шинэ нууц үг
                  </label>
                  <button
                    type="button"
                    onClick={sanamsarguiNuutsUg}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-theme hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Санамсаргүй үүсгэх
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={nuutsUgKharakh ? "text" : "password"}
                    value={shineNuutsUg}
                    onChange={(e) => setShineNuutsUg(e.target.value)}
                    placeholder="Дор хаяж 4 тэмдэгт оруулна уу"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3.5 py-2.5 pr-10 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme transition"
                  />
                  <button
                    type="button"
                    onClick={() => setNuutsUgKharakh(!nuutsUgKharakh)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition cursor-pointer"
                    title={nuutsUgKharakh ? "Нуух" : "Харах"}
                  >
                    {nuutsUgKharakh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
                  Шинэ нууц үг давтах
                </label>
                <input
                  type={nuutsUgKharakh ? "text" : "password"}
                  value={davtakhNuutsUg}
                  onChange={(e) => setDavtakhNuutsUg(e.target.value)}
                  placeholder="Шинэ нууц үгээ дахин оруулна уу"
                  required
                  className="w-full rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3.5 py-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme transition"
                />
              </div>

              {/* SMS notification toggle */}
              {utas && (
                <label className="flex items-start gap-2.5 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsIlgeekh}
                    onChange={(e) => setSmsIlgeekh(e.target.checked)}
                    className="mt-0.5 rounded border-[color:var(--surface-border)] text-theme focus:ring-theme"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-[color:var(--panel-text)]">
                      Шинэ нууц үгийг SMS-ээр илгээх
                    </span>
                    <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">
                      {utas} дугаарт шинэ нууц үгийн мэдээллийг зурвасаар илгээнэ.
                    </p>
                  </div>
                </label>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={unshij}
                  className="rounded-xl border border-[color:var(--surface-border)] px-4 py-2 text-xs font-medium text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition cursor-pointer"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={unshij}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme px-5 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  {unshij ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Сольж байна...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Нууц үг сэргээх</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
