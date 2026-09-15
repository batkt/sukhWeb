"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../../tools/function/formatNumber";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";

/**
 * Оршин суугчийн БҮХ мэдээллийг нэг дэлгэцээс харуулах (зөвхөн харах) модал.
 *
 * Өгөгдлийг `GET /orshinSuugch/:id?delgerengui=true` нэг дуудалтаар авна —
 * backend тэнд гэрээ, гэр бүлийн гишүүд, зогсоолын машин, сүүлийн гүйлгээг
 * нэгтгэж буцаадаг (routes/orshinSuugchRoute.js).
 *
 * Мөн `erslediinUnelgee` (эрсдлийн үнэлгээ) талбар хариунд ирдэг боловч
 * түүний ЖИН батлагдаагүй тул дэлгэцэнд ХАРУУЛААГҮЙ. Батлагдсаны дараа
 * энэ файлд нэг хэсэг нэмэхэд л харагдана.
 */

type Props = {
  show: boolean;
  onClose: () => void;
  residentId?: string | null;
  token?: string | null;
  baiguullagiinId?: string | null;
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

const Buleg: React.FC<{ garchig: string; children: React.ReactNode }> = ({
  garchig,
  children,
}) => (
  <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <h3 className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
      {garchig}
    </h3>
    <div className="p-4">{children}</div>
  </section>
);

const Talbar: React.FC<{ ner: string; utga: React.ReactNode }> = ({
  ner,
  utga,
}) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {ner}
    </span>
    <span className="text-[13px] text-gray-800 dark:text-gray-100 break-words">
      {utga}
    </span>
  </div>
);

const Khooson = ({ bichig }: { bichig: string }) => (
  <p className="text-[12px] text-gray-400 dark:text-gray-500 py-2">{bichig}</p>
);

export const ResidentDetailModal: React.FC<Props> = ({
  show,
  onClose,
  residentId,
  token,
  baiguullagiinId,
}) => {
  const [medeelel, setMedeelel] = useState<any>(null);
  const [unshij, setUnshij] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);

  const tataya = useCallback(async () => {
    if (!token || !residentId) return;
    setUnshij(true);
    setAldaa(null);
    try {
      const resp = await uilchilgee(token).get(`/orshinSuugch/${residentId}`, {
        params: { baiguullagiinId, delgerengui: true },
      });
      setMedeelel(resp.data);
    } catch {
      setAldaa("Мэдээлэл татахад алдаа гарлаа");
    } finally {
      setUnshij(false);
    }
  }, [token, residentId, baiguullagiinId]);

  useEffect(() => {
    if (show) tataya();
    else setMedeelel(null);
  }, [show, tataya]);

  useEffect(() => {
    if (!show) return;
    const tovch = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", tovch);
    return () => document.removeEventListener("keydown", tovch);
  }, [show, onClose]);

  const toots: any[] = useMemo(
    () => (Array.isArray(medeelel?.toots) ? medeelel.toots : []),
    [medeelel],
  );

  if (!show) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="my-8 w-full max-w-5xl rounded-3xl border border-gray-200 bg-gray-50 shadow-2xl dark:border-gray-700 dark:bg-gray-950"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Толгой */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-bold text-gray-900 dark:text-white">
                {tekst(medeelel?.ovog)} {tekst(medeelel?.ner)}
              </h2>
              <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
                {tekst(medeelel?.utas)} · {tekst(medeelel?.mail)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:text-gray-800 dark:bg-white/[0.06] dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Бие */}
          <div className="max-h-[75vh] space-y-3 overflow-y-auto p-5">
            {unshij && (
              <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...
              </div>
            )}
            {!unshij && aldaa && (
              <p className="py-16 text-center text-[13px] text-rose-500">
                {aldaa}
              </p>
            )}

            {!unshij && !aldaa && medeelel && (
              <>
                {/* Хувийн мэдээлэл */}
                <Buleg garchig="Хувийн мэдээлэл">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Talbar ner="Овог" utga={tekst(medeelel.ovog)} />
                    <Talbar ner="Нэр" utga={tekst(medeelel.ner)} />
                    <Talbar ner="Утас" utga={tekst(medeelel.utas)} />
                    <Talbar ner="И-мэйл" utga={tekst(medeelel.mail)} />
                    <Talbar
                      ner="Нэвтрэх нэр"
                      utga={tekst(medeelel.nevtrekhNer)}
                    />
                    <Talbar ner="Эрх" utga={tekst(medeelel.erkh)} />
                    <Talbar ner="Төлөв" utga={tekst(medeelel.tuluv)} />
                    <Talbar
                      ner="Бүртгэсэн"
                      utga={ognooKharuul(medeelel.createdAt)}
                    />
                    <Talbar
                      ner="Барьцааны үлдэгдэл"
                      utga={`${formatNumber(medeelel.baritsaaniiUldegdel || 0)}₮`}
                    />
                    <Talbar ner="Тайлбар" utga={tekst(medeelel.tailbar)} />
                  </div>
                </Buleg>

                {/* Тоотууд */}
                <Buleg garchig={`Тоот / хаяг (${toots.length})`}>
                  {toots.length === 0 ? (
                    <Khooson bichig="Бүртгэлтэй тоот алга" />
                  ) : (
                    <div className="space-y-3">
                      {toots.map((t: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-white/[0.02]"
                        >
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Talbar
                              ner="Тоот"
                              utga={<b>{tekst(t.toot)}</b>}
                            />
                            <Talbar ner="Төрөл" utga={tekst(t.turul)} />
                            <Talbar ner="Давхар" utga={tekst(t.davkhar)} />
                            <Talbar ner="Орц" utga={tekst(t.orts)} />
                            <Talbar ner="Байр" utga={tekst(t.bairniiNer)} />
                            <Talbar ner="Дүүрэг" utga={tekst(t.duureg)} />
                            <Talbar ner="СӨХ" utga={tekst(t.soh)} />
                            <Talbar
                              ner="Үлдэгдэл"
                              utga={`${formatNumber(
                                t.uldegdel ?? t.ekhniiUldegdel ?? 0,
                              )}₮`}
                            />
                            <Talbar
                              ner="Цахилгааны заалт"
                              utga={tekst(t.tsahilgaaniiZaalt)}
                            />
                            <Talbar
                              ner="Хоногоор бодох"
                              utga={t.khonogoorBodokhEsekh ? "Тийм" : "Үгүй"}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Buleg>

                {/* Гэрээ */}
                <Buleg
                  garchig={`Гэрээ (${medeelel.gereenuud?.length || 0})`}
                >
                  {!medeelel.gereenuud?.length ? (
                    <Khooson bichig="Гэрээ олдсонгүй" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead className="text-[10px] uppercase tracking-wider text-gray-400">
                          <tr>
                            <th className="py-1.5 text-left">Дугаар</th>
                            <th className="py-1.5 text-left">Тоот</th>
                            <th className="py-1.5 text-left">Төлөв</th>
                            <th className="py-1.5 text-left">Эхлэх</th>
                            <th className="py-1.5 text-left">Дуусах</th>
                            <th className="py-1.5 text-right">Үлдэгдэл</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-200">
                          {medeelel.gereenuud.map((g: any) => (
                            <tr
                              key={g._id}
                              className="border-t border-gray-100 dark:border-gray-800"
                            >
                              <td className="py-1.5">
                                {tekst(g.gereeniiDugaar)}
                              </td>
                              <td className="py-1.5">{tekst(g.toot)}</td>
                              <td className="py-1.5">{tekst(g.tuluv)}</td>
                              <td className="py-1.5">
                                {ognooKharuul(g.ekhlekhOgnoo)}
                              </td>
                              <td className="py-1.5">
                                {ognooKharuul(g.duusakhOgnoo)}
                              </td>
                              <td className="py-1.5 text-right">
                                {formatNumber(
                                  g.dynamicUldegdel ?? g.ekhniiUldegdel ?? 0,
                                )}
                                ₮
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Buleg>

                {/* Гэр бүлийн гишүүд */}
                <Buleg
                  garchig={`Гэр бүлийн гишүүд (${
                    medeelel.gerBuliinGishuud?.length || 0
                  })`}
                >
                  {!medeelel.gerBuliinGishuud?.length ? (
                    <Khooson bichig="Гишүүн бүртгэгдээгүй" />
                  ) : (
                    <div className="space-y-2">
                      {medeelel.gerBuliinGishuud.map((g: any) => (
                        <div
                          key={g._id}
                          className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-4 dark:border-gray-800"
                        >
                          <Talbar
                            ner="Нэр"
                            utga={`${tekst(g.ovog)} ${tekst(g.ner)}`}
                          />
                          <Talbar ner="Утас" utga={tekst(g.utas)} />
                          <Talbar
                            ner="Холбоо"
                            utga={tekst(g.gishuuniiKholboo)}
                          />
                          <Talbar
                            ner="Төлөв / эрх"
                            utga={`${tekst(g.gishuuniiTuluv)} · ${tekst(
                              g.gishuuniiErkh,
                            )}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Buleg>

                {/* Зогсоол */}
                <Buleg
                  garchig={`Зогсоол / машин (${medeelel.mashinuud?.length || 0})`}
                >
                  {!medeelel.mashinuud?.length ? (
                    <Khooson bichig="Машин бүртгэгдээгүй" />
                  ) : (
                    <div className="space-y-2">
                      {medeelel.mashinuud.map((m: any) => (
                        <div
                          key={m._id}
                          className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-4 dark:border-gray-800"
                        >
                          <Talbar
                            ner="Улсын дугаар"
                            utga={<b>{tekst(m.mashiniiDugaar)}</b>}
                          />
                          <Talbar ner="Эзэн тоот" utga={tekst(m.ezenToot)} />
                          <Talbar
                            ner="Зочин урих"
                            utga={m.zochinUrikhEsekh ? "Тийм" : "Үгүй"}
                          />
                          <Talbar
                            ner="Зочны эрхийн тоо"
                            utga={tekst(m.zochinErkhiinToo)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Buleg>

                {/* Гүйлгээ */}
                <Buleg
                  garchig={`Сүүлийн гүйлгээ (${
                    medeelel.suuliinGuilgeenuud?.length || 0
                  } / ${medeelel.guilgeeniiNiitToo || 0})`}
                >
                  {!medeelel.suuliinGuilgeenuud?.length ? (
                    <Khooson bichig="Гүйлгээ олдсонгүй" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead className="text-[10px] uppercase tracking-wider text-gray-400">
                          <tr>
                            <th className="py-1.5 text-left">Огноо</th>
                            <th className="py-1.5 text-left">Төрөл</th>
                            <th className="py-1.5 text-left">Тоот</th>
                            <th className="py-1.5 text-right">Дүн</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-200">
                          {medeelel.suuliinGuilgeenuud.map((g: any) => (
                            <tr
                              key={g._id}
                              className="border-t border-gray-100 dark:border-gray-800"
                            >
                              <td className="py-1.5">
                                {ognooKharuul(g.ognoo)}
                              </td>
                              <td className="py-1.5">{tekst(g.turul)}</td>
                              <td className="py-1.5">{tekst(g.toot)}</td>
                              <td
                                className={`py-1.5 text-right ${
                                  (g.dun || 0) < 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-gray-800 dark:text-gray-100"
                                }`}
                              >
                                {formatNumber(g.dun || 0)}₮
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Buleg>
              </>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ResidentDetailModal;
