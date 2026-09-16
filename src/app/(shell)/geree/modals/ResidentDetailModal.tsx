"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  Phone,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Car,
  Warehouse,
  Home,
  Users,
  User,
  Building2,
  Trash2,
  Check,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import formatNumber from "../../../../../tools/function/formatNumber";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";

type Props = {
  show: boolean;
  onClose: () => void;
  residentId?: string | null;
  token?: string | null;
  baiguullagiinId?: string | null;
  onEdit?: (resident: any) => void;
};

const ognooKharuul = (utga: unknown) => {
  if (!utga) return "—";
  const o = new Date(String(utga));
  if (isNaN(o.getTime())) return "—";
  return o.toISOString().slice(0, 10);
};

const tekst = (utga: unknown) => {
  if (utga === null || utga === undefined || utga === "") return "—";
  if (typeof utga === "object") return "—";
  return String(utga);
};

export const ResidentDetailModal: React.FC<Props> = ({
  show,
  onClose,
  residentId,
  token,
  baiguullagiinId,
  onEdit,
}) => {
  const [medeelel, setMedeelel] = useState<any>(null);
  const [unshij, setUnshij] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);

  // Car addition state (direct input)
  const [shineMashiniiDugaar, setShineMashiniiDugaar] = useState("");
  const [shineMashinToot, setShineMashinToot] = useState("");
  const [mashinJagsaalt, setMashinJagsaalt] = useState<any[]>([]);

  /* Хувийн мэдээлэл засах */
  const [zasajBuiKhuvi, setZasajBuiKhuvi] = useState(false);
  const [khuviinMedeelel, setKhuviinMedeelel] = useState({
    ovog: "",
    ner: "",
    utas: "",
    mail: "",
    tailbar: "",
  });
  const [khuviKhadgaljBaina, setKhuviKhadgaljBaina] = useState(false);

  /* Гэр бүлийн гишүүн нэмэх форм */
  const [gishuunNemejBaina, setGishuunNemejBaina] = useState(false);
  const [shineGishuun, setShineGishuun] = useState({
    ovog: "",
    ner: "",
    utas: "",
    kholboo: "Бусад",
    erkh: "Харах + Төлөх",
  });
  const [gishuunKhadgaljBaina, setGishuunKhadgaljBaina] = useState(false);

  const [zasajBuiToot, setZasajBuiToot] = useState(false);
  const [tootJagsaalt, setTootJagsaalt] = useState<any[]>([]);
  const [tootKhadgaljBaina, setTootKhadgaljBaina] = useState(false);

  const tataya = useCallback(async () => {
    if (!token || !residentId) return;
    setUnshij(true);
    setAldaa(null);
    try {
      const resp = await uilchilgee(token).get(`/orshinSuugch/${residentId}`, {
        params: { baiguullagiinId, delgerengui: true },
      });
      const data = resp.data;
      setMedeelel(data);
      setMashinJagsaalt(Array.isArray(data?.mashinuud) ? data.mashinuud : []);
      setTootJagsaalt(Array.isArray(data?.toots) ? data.toots : []);
    } catch {
      setAldaa("Мэдээлэл татахад алдаа гарлаа");
    } finally {
      setUnshij(false);
    }
  }, [token, residentId, baiguullagiinId]);

  useEffect(() => {
    if (show) {
      tataya();
      setZasajBuiToot(false);
      setShineMashiniiDugaar("");
      setShineMashinToot("");
    } else {
      setMedeelel(null);
      setMashinJagsaalt([]);
      setTootJagsaalt([]);
    }
  }, [show, tataya]);

  useEffect(() => {
    if (!show) return;
    const tovch = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", tovch);
    return () => document.removeEventListener("keydown", tovch);
  }, [show, onClose]);

  /**
   * Гишүүнийг ШУУД нэмнэ (баталгаажуулалтгүй).
   *
   * Оршин суугчийн апп дахь `/gerBuliinGishuunUrikh` нь үндсэн эзэмшигчийг
   * токеноос олдог тул админ талаас ажиллахгүй. Эндээс `undsenId`-г
   * шууд заадаг `/gerBuliinGishuunNemekh` рүү хандана.
   */
  const gishuunNemye = async () => {
    const utas = shineGishuun.utas.replace(/\D/g, "");
    if (utas.length < 8) {
      openErrorOverlay("Утасны дугаараа зөв оруулна уу");
      return;
    }
    if (!token || !residentId) return;

    setGishuunKhadgaljBaina(true);
    try {
      await uilchilgee(token).post("/gerBuliinGishuunNemekh", {
        undsenId: residentId,
        utas,
        ovog: shineGishuun.ovog.trim(),
        ner: shineGishuun.ner.trim(),
        kholboo: shineGishuun.kholboo,
        erkh: shineGishuun.erkh,
      });
      openSuccessOverlay("Гэр бүлийн гишүүн нэмэгдлээ");
      setShineGishuun({
        ovog: "",
        ner: "",
        utas: "",
        kholboo: "Бусад",
        erkh: "Харах + Төлөх",
      });
      setGishuunNemejBaina(false);
      await tataya();
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
          err?.response?.data?.message ||
          "Гишүүн нэмэхэд алдаа гарлаа",
      );
    } finally {
      setGishuunKhadgaljBaina(false);
    }
  };

  // Real family members only (no static data)
  const gerBuliinGishuud: any[] = useMemo(() => {
    return Array.isArray(medeelel?.gerBuliinGishuud)
      ? medeelel.gerBuliinGishuud
      : [];
  }, [medeelel]);

  // ── Handlers for Car (Direct input add & delete) ──
  const shuudMashinNemekh = () => {
    const trimmed = shineMashiniiDugaar.trim().toUpperCase();
    if (!trimmed) return;
    const newCar = {
      _id: `car_${Date.now()}`,
      mashiniiDugaar: trimmed,
      ezenToot: shineMashinToot || tootJagsaalt[0]?.toot || "",
    };
    setMashinJagsaalt((prev) => [...prev, newCar]);
    setMedeelel((prev: any) => ({
      ...prev,
      mashinuud: [...(prev?.mashinuud || []), newCar],
    }));
    setShineMashiniiDugaar("");
  };

  const mashinUstgakh = (index: number) => {
    setMashinJagsaalt((prev) => prev.filter((_, i) => i !== index));
    setMedeelel((prev: any) => ({
      ...prev,
      mashinuud: (prev?.mashinuud || []).filter((_: any, i: number) => i !== index),
    }));
  };

  // ── Handlers for Toot editing ──
  const tootNemekh = () => {
    setTootJagsaalt((prev) => [
      ...prev,
      {
        toot: "",
        turul: "Орон сууц",
        davkhar: "",
        orts: "",
        tsahilgaaniiZaalt: 0,
      },
    ]);
  };

  const tootUstgakh = (index: number) => {
    setTootJagsaalt((prev) => prev.filter((_, i) => i !== index));
  };

  const tootFieldSolikh = (index: number, field: string, val: any) => {
    setTootJagsaalt((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  /** Засах горимд шилжихэд талбаруудыг одоогийн утгаар дүүргэнэ. */
  const khuviiZasya = () => {
    setKhuviinMedeelel({
      ovog: medeelel?.ovog || "",
      ner: medeelel?.ner || "",
      utas: medeelel?.utas || "",
      mail: medeelel?.mail || "",
      tailbar: medeelel?.tailbar || "",
    });
    setZasajBuiKhuvi(true);
  };

  /**
   * Хувийн мэдээллийг хадгална.
   *
   * `Нэвтрэх нэр`, `Төлөв`, `Эрх`, `Бүртгэгдсэн` дөрвийг ЗОРИУД оруулаагүй —
   * эдгээр нь системээс тодорхойлогддог (нэвтрэх нэр нь утаснаас, эрх нь
   * бүртгэлийн төрлөөс). Эндээс гараар өөрчилвөл нэвтрэлт эвдэрч болно.
   */
  const khuviiKhadgalya = async () => {
    if (!token || !residentId) return;
    const utas = khuviinMedeelel.utas.replace(/[^0-9]/g, "");
    if (utas && utas.length < 8) {
      openErrorOverlay("Утасны дугаараа зөв оруулна уу");
      return;
    }

    setKhuviKhadgaljBaina(true);
    try {
      const shinechlelt = {
        ovog: khuviinMedeelel.ovog.trim(),
        ner: khuviinMedeelel.ner.trim(),
        utas: utas || khuviinMedeelel.utas.trim(),
        mail: khuviinMedeelel.mail.trim(),
        tailbar: khuviinMedeelel.tailbar.trim(),
      };
      await uilchilgee(token).put(`/orshinSuugch/${residentId}`, {
        ...shinechlelt,
        baiguullagiinId,
      });
      setMedeelel((prev: any) => ({ ...prev, ...shinechlelt }));
      setZasajBuiKhuvi(false);
      openSuccessOverlay("Хувийн мэдээлэл хадгалагдлаа");
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa || "Хувийн мэдээлэл хадгалахад алдаа гарлаа",
      );
    } finally {
      setKhuviKhadgaljBaina(false);
    }
  };

  const tootKhadgalya = async () => {
    if (!token || !residentId) return;
    setTootKhadgaljBaina(true);
    try {
      await uilchilgee(token).put(`/orshinSuugch/${residentId}`, {
        toots: tootJagsaalt,
        baiguullagiinId,
      });
      setMedeelel((prev: any) => ({
        ...prev,
        toots: tootJagsaalt,
      }));
      setZasajBuiToot(false);
    } catch (err: any) {
      alert(err?.response?.data?.aldaa || "Тоот хадгалахад алдаа гарлаа");
    } finally {
      setTootKhadgaljBaina(false);
    }
  };

  if (!show) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="my-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 transition-all text-slate-800 dark:text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Modal Header ── */}
          <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-5 border-b border-slate-100 dark:border-slate-800/80">
            {/* Top Close (X) button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left: Avatar & Resident details */}
            <div className="flex items-center gap-4 min-w-0 pr-12">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400">
                <User className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {tekst(medeelel?.ovog)} {tekst(medeelel?.ner)}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{tekst(medeelel?.utas)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{tekst(medeelel?.mail)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Status pill & more options */}
            <div className="flex items-center gap-2.5 sm:pr-8">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  {tekst(medeelel?.tuluv) === "—" || !medeelel?.tuluv
                    ? "Идэвхтэй"
                    : tekst(medeelel.tuluv)}
                </span>
              </div>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Modal Body (Direct 2x2 Grid, No Tabs) ── */}
          <div className="max-h-[76vh] overflow-y-auto p-5 sm:p-6 bg-slate-50/40 dark:bg-slate-950">
            {unshij && (
              <div className="flex flex-col items-center justify-center gap-2 py-24 text-xs text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span>Мэдээлэл уншиж байна...</span>
              </div>
            )}

            {!unshij && aldaa && (
              <div className="py-20 text-center text-xs text-rose-500 font-medium">
                {aldaa}
              </div>
            )}

            {!unshij && !aldaa && medeelel && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* 1. Хувийн мэдээлэл Card (Edit button removed) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                          <User className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          Хувийн мэдээлэл
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          zasajBuiKhuvi ? setZasajBuiKhuvi(false) : khuviiZasya()
                        }
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        {zasajBuiKhuvi ? "Болих" : "Засах"}
                      </button>
                    </div>

                    {/* Засах горим. Уншигдах хүснэгтийг нуугаад форм гаргана —
                        ингэснээр байгаа бүтэц хэвээр үлдэнэ. */}
                    {zasajBuiKhuvi && (
                      <div className="pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Овог</p>
                            <input
                              value={khuviinMedeelel.ovog}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  ovog: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Нэр</p>
                            <input
                              value={khuviinMedeelel.ner}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  ner: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Утас</p>
                            <input
                              inputMode="numeric"
                              value={khuviinMedeelel.utas}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  utas: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">E-mail</p>
                            <input
                              type="email"
                              value={khuviinMedeelel.mail}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  mail: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] text-slate-400 mb-1">
                              Тайлбар
                            </p>
                            <input
                              value={khuviinMedeelel.tailbar}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  tailbar: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                          Нэвтрэх нэр, Төлөв, Эрх, Бүртгэгдсэн огноо нь системээс
                          тодорхойлогддог тул эндээс өөрчлөгдөхгүй.
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setZasajBuiKhuvi(false)}
                            disabled={khuviKhadgaljBaina}
                            className="px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                          >
                            Цуцлах
                          </button>
                          <button
                            type="button"
                            onClick={khuviiKhadgalya}
                            disabled={khuviKhadgaljBaina}
                            className="flex items-center gap-1 px-3 py-1 text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              {khuviKhadgaljBaina ? "Хадгалж байна…" : "Хадгалах"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      className={`grid grid-cols-3 gap-x-4 gap-y-4 pt-4 ${
                        zasajBuiKhuvi ? "hidden" : ""
                      }`}
                    >
                      {/* Col 1 */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Овог
                          </p>
                          <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                            {tekst(medeelel.ovog)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Нэвтрэх нэр
                          </p>
                          <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                            {tekst(medeelel.nevtrekhNer || medeelel.utas)}
                          </p>
                        </div>
                        {medeelel.tailbar && (
                          <div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              Тайлбар
                            </p>
                            <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                              {tekst(medeelel.tailbar)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Col 2 */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Нэр
                          </p>
                          <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                            {tekst(medeelel.ner)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Утас
                          </p>
                          <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                            {tekst(medeelel.utas)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            E-mail
                          </p>
                          <p
                            className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5 truncate"
                            title={tekst(medeelel.mail)}
                          >
                            {tekst(medeelel.mail)}
                          </p>
                        </div>
                      </div>

                      {/* Col 3 */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                            Төлөв
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>
                              {tekst(medeelel.tuluv) === "—" || !medeelel.tuluv
                                ? "Идэвхтэй"
                                : tekst(medeelel.tuluv)}
                            </span>
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Эрх
                          </p>
                          <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                            {medeelel.erkh === "OrshinSuugch"
                              ? "Оршин суугч"
                              : tekst(medeelel.erkh)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Бүртгэгдсэн
                          </p>
                          <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                            {ognooKharuul(medeelel.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Машин Card (Direct Input) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                          <Car className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          Машин ({mashinJagsaalt.length})
                        </h3>
                      </div>
                    </div>

                    {/* Direct car addition input */}
                    <div className="pt-3 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={shineMashiniiDugaar}
                            onChange={(e) => setShineMashiniiDugaar(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                shuudMashinNemekh();
                              }
                            }}
                            placeholder="Улсын дугаар (жишээ: 1234 УБА)..."
                            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
                          />
                        </div>
                        {tootJagsaalt.length > 1 && (
                          <select
                            value={shineMashinToot}
                            onChange={(e) => setShineMashinToot(e.target.value)}
                            className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
                          >
                            {tootJagsaalt.map((t, i) => (
                              <option key={i} value={t.toot}>
                                {t.toot} тоот
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={shuudMashinNemekh}
                          disabled={!shineMashiniiDugaar.trim()}
                          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Нэмэх</span>
                        </button>
                      </div>
                    </div>

                    {/* Car List */}
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                      {mashinJagsaalt.length === 0 ? (
                        <p className="py-5 text-center text-xs text-slate-400">
                          Бүртгэлтэй машин одоогоор алга байна.
                        </p>
                      ) : (
                        mashinJagsaalt.map((m: any, idx: number) => (
                          <div
                            key={m._id || idx}
                            className="flex items-center justify-between rounded-xl border border-slate-100/90 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800/60 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                <Car className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {tekst(m.mashiniiDugaar)}
                                </h4>
                                {m.ezenToot && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Тоот: {m.ezenToot}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => mashinUstgakh(idx)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Устгах"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Граш / B1 Card (Edit implemented) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                          <Warehouse className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          Граш / B1 ({tootJagsaalt.length})
                        </h3>
                      </div>

                      {/* Edit button implemented for Граш / B1 */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onEdit) {
                              onEdit(medeelel);
                            } else {
                              setZasajBuiToot(!zasajBuiToot);
                            }
                          }}
                          className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-normal transition cursor-pointer ${
                            zasajBuiToot
                              ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Pencil className="h-3 w-3 text-slate-500" />
                          <span>{zasajBuiToot ? "Болих" : "Засах"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Edit Mode View for Граш / B1 */}
                    {zasajBuiToot ? (
                      <div className="pt-4 space-y-3">
                        {tootJagsaalt.length === 0 && (
                          <p className="text-center text-xs text-slate-400 py-3">
                            Одоогоор бүртгэлтэй тоот/граш алга.
                          </p>
                        )}
                        {tootJagsaalt.map((t, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                Хаяг #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => tootUstgakh(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                title="Устгах"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Тоот
                                </label>
                                <input
                                  type="text"
                                  value={t.toot || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "toot", e.target.value)
                                  }
                                  placeholder="101"
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Төрөл
                                </label>
                                <select
                                  value={t.turul || "Орон сууц"}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "turul", e.target.value)
                                  }
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                >
                                  <option value="Орон сууц">Орон сууц</option>
                                  <option value="Гараж">Гараж</option>
                                  <option value="Граш">Граш</option>
                                  <option value="B1">B1</option>
                                  <option value="Агуулах">Агуулах</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Давхар
                                </label>
                                <input
                                  type="text"
                                  value={t.davkhar || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "davkhar", e.target.value)
                                  }
                                  placeholder="1"
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Цахилгааны заалт
                                </label>
                                <input
                                  type="number"
                                  value={t.tsahilgaaniiZaalt ?? 0}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "tsahilgaaniiZaalt", Number(e.target.value))
                                  }
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={tootNemekh}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Хаяг нэмэх</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setZasajBuiToot(false)}
                              className="px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                              Цуцлах
                            </button>
                            <button
                              type="button"
                              onClick={tootKhadgalya}
                              disabled={tootKhadgaljBaina}
                              className="flex items-center gap-1 px-3 py-1 text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Хадгалах</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode for Граш / B1 (Real Data Only) */
                      <div className="pt-4">
                        {tootJagsaalt.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            <Warehouse className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                            <p>Бүртгэлтэй тоот, граш байхгүй байна</p>
                            <button
                              type="button"
                              onClick={() => (onEdit ? onEdit(medeelel) : setZasajBuiToot(true))}
                              className="mt-2 text-blue-600 hover:underline cursor-pointer"
                            >
                              + Хаяг бүртгэх
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {tootJagsaalt.map((t: any, i: number) => {
                              const isB1 =
                                t.davkhar === "B1" ||
                                t.turul?.toLowerCase().includes("гараж") ||
                                t.turul?.toLowerCase().includes("граш") ||
                                t.turul === "B1";
                              return (
                                <div
                                  key={i}
                                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold text-xs">
                                        {isB1 && t.turul === "B1" ? (
                                          <span className="text-[11px] font-semibold">B1</span>
                                        ) : (
                                          <Building2 className="h-4 w-4" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                          {tekst(t.turul || "Орон сууц")}
                                        </p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                          {tekst(t.toot)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => (onEdit ? onEdit(medeelel) : setZasajBuiToot(true))}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                      title="Засах"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">Байр</span>
                                      <span className="text-slate-700 dark:text-slate-200">
                                        {tekst(t.bairniiNer)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">
                                        Цахилгааны заалт
                                      </span>
                                      <span className="text-slate-700 dark:text-slate-200">
                                        {tekst(t.tsahilgaaniiZaalt ?? 0)}
                                      </span>
                                    </div>
                                    {t.uldegdel !== undefined && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Үлдэгдэл</span>
                                        <span className="text-slate-700 dark:text-slate-200">
                                          {formatNumber(t.uldegdel)}₮
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Гэр бүлийн гишүүд / Нэмэлт хэрэглэгч Card (Edit button removed, Real data only) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                          <Home className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          Гэр бүлийн гишүүд / Нэмэлт хэрэглэгч ({gerBuliinGishuud.length})
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGishuunNemejBaina((n) => !n)}
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        {gishuunNemejBaina ? "Болих" : "+ Гишүүн нэмэх"}
                      </button>
                    </div>

                    {/* Шууд нэмэх форм — баталгаажуулалтгүй */}
                    {gishuunNemejBaina && (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-900/50 dark:bg-blue-900/10">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            placeholder="Овог"
                            value={shineGishuun.ovog}
                            onChange={(e) =>
                              setShineGishuun((g) => ({
                                ...g,
                                ovog: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <input
                            placeholder="Нэр"
                            value={shineGishuun.ner}
                            onChange={(e) =>
                              setShineGishuun((g) => ({
                                ...g,
                                ner: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <input
                            placeholder="Утас *"
                            inputMode="numeric"
                            value={shineGishuun.utas}
                            onChange={(e) =>
                              setShineGishuun((g) => ({
                                ...g,
                                utas: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <select
                            value={shineGishuun.kholboo}
                            onChange={(e) =>
                              setShineGishuun((g) => ({
                                ...g,
                                kholboo: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            <option value="Эхнэр/Нөхөр">Эхнэр/Нөхөр</option>
                            <option value="Үр хүүхэд">Үр хүүхэд</option>
                            <option value="Эцэг/Эх">Эцэг/Эх</option>
                            <option value="Ах/Эгч/Дүү">Ах/Эгч/Дүү</option>
                            <option value="Түрээслэгч">Түрээслэгч</option>
                            <option value="Бусад">Бусад</option>
                          </select>
                          <select
                            value={shineGishuun.erkh}
                            onChange={(e) =>
                              setShineGishuun((g) => ({
                                ...g,
                                erkh: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 col-span-2"
                          >
                            <option value="Харах + Төлөх">Харах + Төлөх</option>
                            <option value="Харах">Зөвхөн харах</option>
                          </select>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                          Гишүүн нэвтрэх нэр нь утасны дугаар болно.
                          Баталгаажуулалт шаардахгүй шууд идэвхжинэ.
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setGishuunNemejBaina(false)}
                            disabled={gishuunKhadgaljBaina}
                            className="px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                          >
                            Цуцлах
                          </button>
                          <button
                            type="button"
                            onClick={gishuunNemye}
                            disabled={gishuunKhadgaljBaina}
                            className="flex items-center gap-1 px-3 py-1 text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              {gishuunKhadgaljBaina
                                ? "Хадгалж байна…"
                                : "Хадгалах"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 overflow-x-auto">
                      {gerBuliinGishuud.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          <Users className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                          <p>Бүртгэлтэй гэр бүлийн гишүүн байхгүй байна</p>
                        </div>
                      ) : (
                        <table className="w-full text-[11px] sm:text-xs">
                          <thead>
                            <tr className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                              <th className="pb-2 text-left font-normal w-6">№</th>
                              <th className="pb-2 text-left font-normal">Овог нэр</th>
                              <th className="pb-2 text-left font-normal">Утас</th>
                              <th className="pb-2 text-left font-normal">Эрх</th>
                              <th className="pb-2 text-center font-normal">Төлөв</th>
                              <th className="pb-2 text-right font-normal">Үйлдэл</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                            {gerBuliinGishuud.map((g: any, i: number) => (
                              <tr
                                key={g._id || i}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                              >
                                <td className="py-2.5 font-normal text-slate-800 dark:text-slate-100">
                                  {i + 1}
                                </td>
                                <td className="py-2.5 font-normal text-slate-800 dark:text-slate-100">
                                  {g.ovog ? `${g.ovog[0]}. ` : ""}
                                  {tekst(g.ner)}
                                </td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300 font-normal">
                                  {tekst(g.utas)}
                                </td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300 font-normal">
                                  {tekst(
                                    g.gishuuniiErkh ||
                                      g.gishuuniiKholboo ||
                                      "Гэр бүлийн гишүүн",
                                  )}
                                </td>
                                <td className="py-2.5 text-center">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    {tekst(g.gishuuniiTuluv) === "—"
                                      ? "Идэвхтэй"
                                      : tekst(g.gishuuniiTuluv)}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    type="button"
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    <MoreHorizontal className="h-4 w-4 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Modal Footer ── */}
          <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200/90 bg-white px-6 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-2xs active:scale-95 cursor-pointer"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ResidentDetailModal;
