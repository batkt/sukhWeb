"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Search, X, User, BarChart2, Users, Key, Monitor, Filter, ParkingCircle, Car, Wallet } from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import { StandardPagination } from "@/components/ui/StandardTable";

interface GateOpenLog {
  _id: string;
  ip: string;
  barilgiinId: string;
  baiguullagiinId: string;
  orshinSuugchiinId: string;
  orshinSuugchiinNer: string;
  toot: string;
  utas: string;
  mashiniiDugaar: string;
  turul?: "нээсэн" | "урьсан";
  /** "parkease" бол мөр нь Түрээсийн зогсоолоос ирсэн */
  ekhSurvalj?: string;
  parkease?: ParkEaseTuukh;
  ezenNer?: string;
  ezenToot?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ParkEase (Түрээсийн зогсоол) дээрх зочны хөдөлгөөн.
 * Webhook-оор ирж ZochinZogsooliinTuukh дээр хадгалагдана.
 */
interface ParkEaseTuukh {
  _id?: string;
  urilgiinId?: string;
  mashiniiDugaar?: string;
  orsonTsag?: string;
  garsanTsag?: string;
  orsonKhaalga?: string;
  garsanKhaalga?: string;
  niitKhugatsaa?: number;
  uneguiMinutAshiglasan?: number;
  uneguiMinutUldsen?: number;
  tulburiinTurul?: "zochin" | "ezen";
  tulukhDun?: number;
  niitDun?: number;
  nekhemjlekhId?: string;
  toot?: string;
  tuluv?: number;
}

/** Оршин суугчийн урисан машин (EzenUrisanMashin) */
interface UrisanMashin {
  _id: string;
  urisanMashiniiDugaar?: string;
  tusBurUneguiMinut?: number;
  tusBurAshiglasanUneguiMinut?: number;
  davtamjiinTurul?: string;
  tuluv?: number;
  createdAt?: string;
}

const URILGIIN_TULUV: Record<number, { ner: string; angi: string }> = {
  0: {
    ner: "Хүлээлгэ",
    angi:
      "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300",
  },
  1: {
    ner: "Идэвхтэй",
    angi:
      "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  },
  2: {
    ner: "Гарсан",
    angi:
      "bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-300",
  },
};

const mongoloorKhugatsaa = (minut?: number) => {
  const m = Number(minut) || 0;
  if (m <= 0) return "-";
  const tsag = Math.floor(m / 60);
  const uldsen = m % 60;
  if (tsag > 0) return `${tsag} цаг ${uldsen} мин`;
  return `${uldsen} мин`;
};

const dunFormat = (dun?: number) =>
  `${(Number(dun) || 0).toLocaleString("mn-MN")}₮`;

/**
 * Хүснэгтийн ParkEase багана - нэг мөрөнд багтах хураангуй.
 * Бүртгэл байхгүй бол зочин зогсоол дээр ирээгүй/интеграц асаагүй гэсэн үг.
 */
function ParkEaseMur({
  garchig,
  utga,
  nemelt,
}: {
  garchig: string;
  utga: string;
  nemelt?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {garchig}
      </span>
      <span className="text-[13px] text-slate-700 dark:text-slate-200 font-medium font-[family-name:var(--font-mono)]">
        {utga}
      </span>
      {nemelt ? (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-[family-name:var(--font-mono)]">
          {nemelt}
        </span>
      ) : null}
    </div>
  );
}

function ParkEaseNudu({ tuukh }: { tuukh?: ParkEaseTuukh }) {
  if (!tuukh)
    return <span className="text-slate-300 dark:text-slate-600 italic text-[13px]">-</span>;

  const dotor = !tuukh.garsanTsag;
  const ezenTulsun = tuukh.tulburiinTurul === "ezen";
  const dun = Number(tuukh.tulukhDun) || 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {dotor ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          Зогсоол дээр
        </span>
      ) : (
        <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 font-[family-name:var(--font-mono)]">
          {mongoloorKhugatsaa(tuukh.niitKhugatsaa)}
        </span>
      )}

      <div className="flex items-center gap-1.5">
        {(tuukh.uneguiMinutUldsen ?? 0) > 0 ? (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Үнэгүй {tuukh.uneguiMinutUldsen} мин үлдсэн
          </span>
        ) : (tuukh.uneguiMinutAshiglasan ?? 0) > 0 ? (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Үнэгүй {tuukh.uneguiMinutAshiglasan} мин дууссан
          </span>
        ) : null}

        {dun > 0 &&
          (ezenTulsun ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-400 text-black dark:bg-amber-600 dark:text-white text-[11px]">
              {dunFormat(dun)} · Amarhome
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {dunFormat(dun)} · Зочин
            </span>
          ))}
      </div>
    </div>
  );
}

interface UserHistoryModalProps {
  log: GateOpenLog;
  onClose: () => void;
  token: string;
  baiguullagiinId: string;
  getBuildingName: (bId: string) => string;
}

function UserHistoryModal({
  log,
  onClose,
  token,
  baiguullagiinId,
  getBuildingName,
}: UserHistoryModalProps) {
  const searchValue = log.utas || log.orshinSuugchiinNer || log.mashiniiDugaar || "";

  const { data: historyData, isValidating } = useSWR(
    token && baiguullagiinId && searchValue
      ? ["/khaalgaNeeyeTuukh/history", token, baiguullagiinId, searchValue]
      : null,
    async ([url, tkn, bId, search]): Promise<any> => {
      const resp = await uilchilgee(tkn).get("/khaalgaNeeyeTuukh", {
        params: {
          baiguullagiinId: bId,
          khuudasniiKhemjee: 50,
          searchUtga: search,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const historyLogs: GateOpenLog[] = useMemo(
    () => historyData?.jagsaalt || [],
    [historyData]
  );

  // Тухайн машины ParkEase зогсоолын БҮХ хөдөлгөөн - оршин суугчид
  // "хэзээ орж гарсан, хэдэн төгрөг, хэн төлсөн" гэдгийг бүрэн харуулна.
  const { data: parkEaseData } = useSWR(
    token && baiguullagiinId && log.mashiniiDugaar
      ? ["/zochin/zogsool/tuukh/modal", token, baiguullagiinId, log.mashiniiDugaar]
      : null,
    async ([, tkn, bId, dugaar]): Promise<any> => {
      const resp = await uilchilgee(tkn).get("/zochin/zogsool/tuukh", {
        params: {
          baiguullagiinId: bId,
          mashiniiDugaar: dugaar,
          khuudasniiKhemjee: 20,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const parkEaseTuukh: ParkEaseTuukh[] = useMemo(
    () => parkEaseData?.jagsaalt || [],
    [parkEaseData]
  );

  // Тухайн оршин суугчийн урисан БҮХ машин - зогсоолд ирээгүй, зүгээр л
  // хүлээлгэнд байгаа урилгууд ч энд харагдана.
  const { data: urisanData } = useSWR(
    token && baiguullagiinId && log.orshinSuugchiinId
      ? ["/zochin/urisanMashin", token, baiguullagiinId, log.orshinSuugchiinId]
      : null,
    async ([url, tkn, bId, suugchId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          orshinSuugchId: suugchId,
          khuudasniiKhemjee: 50,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const urisanMashinuud: UrisanMashin[] = useMemo(
    () => urisanData?.jagsaalt || [],
    [urisanData]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[650px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[#18181b] border-slate-200/40 dark:border-white/[0.06] flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 pt-6 pb-5 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 opacity-80" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.06]">
                <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-medium text-slate-800 dark:text-white tracking-tight">
                  {log.orshinSuugchiinNer || "Хэрэглэгч"}-ийн түүх
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Тоот: {log.toot || "-"} | Утас: {log.utas || "-"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Logs List */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Уригдсан машинууд ──────────────────────────────────────── */}
          {urisanMashinuud.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <h3 className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                  Уригдсан машин
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {urisanMashinuud.length}
                </span>
              </div>

              <div className="border border-slate-100 dark:border-white/[0.05] rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-100 dark:bg-white/[0.04] text-[11px] uppercase font-medium text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Урьсан огноо</th>
                      <th className="py-2.5 px-4 text-center">Улсын дугаар</th>
                      <th className="py-2.5 px-4 text-center">Төлөв</th>
                      <th className="py-2.5 px-4 text-center">Үнэгүй минут</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {urisanMashinuud.map((mashin) => {
                      const tuluv =
                        URILGIIN_TULUV[Number(mashin.tuluv) || 0] ||
                        URILGIIN_TULUV[0];
                      return (
                        <tr
                          key={mashin._id}
                          className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02]"
                        >
                          <td className="py-2.5 px-4 font-mono text-[13px]">
                            {mashin.createdAt
                              ? moment(mashin.createdAt).format("YYYY-MM-DD HH:mm")
                              : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {mashin.urisanMashiniiDugaar ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[12px] !text-white tracking-widest font-[family-name:var(--font-mono)]">
                                {mashin.urisanMashiniiDugaar}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${tuluv.angi}`}
                            >
                              {tuluv.ner}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
                            {mashin.tusBurUneguiMinut ?? 0} үлдсэн
                            {(mashin.tusBurAshiglasanUneguiMinut ?? 0) > 0
                              ? ` / ${mashin.tusBurAshiglasanUneguiMinut} ашигласан`
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 mb-1 h-px bg-slate-100 dark:bg-white/[0.05]" />
            </div>
          )}

          {/* ── ParkEase зогсоолын дэлгэрэнгүй ─────────────────────────── */}
          {parkEaseTuukh.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <ParkingCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                  ParkEase зогсоол
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {log.mashiniiDugaar}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {parkEaseTuukh.map((mur) => {
                  const dotor = !mur.garsanTsag;
                  const ezenTulsun = mur.tulburiinTurul === "ezen";
                  const dun = Number(mur.tulukhDun) || 0;
                  return (
                    <div
                      key={mur._id}
                      className="rounded-2xl border border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        {dotor ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            Зогсоол дээр байна
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            Гарсан
                          </span>
                        )}
                        {dun > 0 &&
                          (ezenTulsun ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-400 text-black dark:bg-amber-600 dark:text-white text-[11px]">
                              {dunFormat(dun)} · Amarhome нэхэмжлэх
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/[0.08] text-[11px] font-medium text-slate-700 dark:text-slate-200">
                              {dunFormat(dun)} · Зочин төлсөн
                            </span>
                          ))}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                        <ParkEaseMur
                          garchig="Орсон"
                          utga={
                            mur.orsonTsag
                              ? moment(mur.orsonTsag).format("MM-DD HH:mm")
                              : "-"
                          }
                          nemelt={mur.orsonKhaalga}
                        />
                        <ParkEaseMur
                          garchig="Гарсан"
                          utga={
                            mur.garsanTsag
                              ? moment(mur.garsanTsag).format("MM-DD HH:mm")
                              : "-"
                          }
                          nemelt={mur.garsanKhaalga}
                        />
                        <ParkEaseMur
                          garchig="Зогссон хугацаа"
                          utga={mongoloorKhugatsaa(mur.niitKhugatsaa)}
                        />
                        <ParkEaseMur
                          garchig="Үнэгүй минут"
                          utga={`${mur.uneguiMinutAshiglasan ?? 0} ашигласан / ${
                            mur.uneguiMinutUldsen ?? 0
                          } үлдсэн`}
                        />
                        <ParkEaseMur
                          garchig="Төлбөрийг"
                          utga={
                            ezenTulsun
                              ? "Оршин суугч даасан"
                              : "Зочин өөрөө төлсөн"
                          }
                        />
                        <ParkEaseMur
                          garchig="Нэхэмжлэх"
                          utga={mur.nekhemjlekhId ? "Бичигдсэн" : "-"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 mb-1 h-px bg-slate-100 dark:bg-white/[0.05]" />
            </div>
          )}

          {isValidating && historyLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-[13px]">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mb-2" />
              Түүхийг уншиж байна...
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-[13px]">
              Хэрэглэгчийн түүх олдсонгүй.
            </div>
          ) : (
            <div className="border border-slate-100 dark:border-white/[0.05] rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 dark:bg-white/[0.04] text-[11px] uppercase font-medium text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4 text-center">№</th>
                    <th className="py-2.5 px-4 text-left">Огноо</th>
                    <th className="py-2.5 px-4 text-center">Төлөв</th>
                    <th className="py-2.5 px-4 text-center">Улсын дугаар</th>
                    <th className="py-2.5 px-4 text-center">Камер IP</th>
                    <th className="py-2.5 px-4 text-left">Барилга</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {historyLogs.map((hLog, idx) => {
                    const isUrisan = hLog.turul === "урьсан";
                    return (
                      <tr key={hLog._id} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {moment(hLog.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isUrisan ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                              Урьсан
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                              Нээсэн
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {hLog.mashiniiDugaar ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[12px] !text-white tracking-widest font-[family-name:var(--font-mono)]">
                              {hLog.mashiniiDugaar}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {hLog.ip || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-left text-slate-500 dark:text-slate-400 text-[13px]">
                          {getBuildingName(hLog.barilgiinId)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 pt-2 border-t border-slate-100 dark:border-white/[0.06] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-[12px] font-medium text-slate-600 dark:text-slate-300 transition-colors"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UrisanTuukh() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [selectedLog, setSelectedLog] = useState<GateOpenLog | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | null | undefined
  >(getDefaultDateRange);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (dateRange === null) return { start: "", end: "" };
    const range = dateRange || getDefaultDateRange();
    return {
      start: range[0] || "",
      end: range[1] || "",
    };
  }, [dateRange]);

  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: logsData } = useSWR(
    shouldFetch
      ? [
          "/khaalgaNeeyeTuukh",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          page,
          searchTerm,
          rangeStart,
          rangeEnd,
          statusFilter,
        ]
      : null,
    async ([url, tkn, bId, barId, pg, search, start, end, status]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pageSize,
          start: start || undefined,
          end: end || undefined,
          searchUtga: search || undefined,
          turul: status || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const logs: GateOpenLog[] = useMemo(
    () => logsData?.jagsaalt || [],
    [logsData],
  );
  const totalCount = logsData?.niitMur || 0;

  const { data: statsData } = useSWR(
    shouldFetch
      ? [
          "/khaalgaNeeyeTuukh/stats",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([url, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          start: start || undefined,
          end: end || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const counts = useMemo(
    () => statsData?.counts || { total: 0, urisan: 0, neesen: 0 },
    [statsData]
  );
  const topResidents = useMemo(
    () => statsData?.topResidents || [],
    [statsData]
  );
  const topGates = useMemo(
    () => statsData?.topGates || [],
    [statsData]
  );
  const dailyActivity = useMemo(
    () => statsData?.dailyActivity || [],
    [statsData]
  );

  // ── ParkEase (Түрээсийн зогсоол) ──────────────────────────────────────
  // Хуудсан дээр харагдаж буй дугааруудаар л татна - бүх түүхийг татаад
  // клиент дээр шүүхээс хамаагүй хямд, мөн хуудаслалттай ч зөрөхгүй.
  const khuudasniiDugaaruud = useMemo(() => {
    const olonlog = new Set(
      logs
        .map((l) => (l.mashiniiDugaar || "").trim().toUpperCase())
        .filter(Boolean)
    );
    return Array.from(olonlog).sort().join(",");
  }, [logs]);

  const { data: parkEaseData } = useSWR(
    shouldFetch && khuudasniiDugaaruud
      ? [
          "/zochin/zogsool/tuukh",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          khuudasniiDugaaruud,
        ]
      : null,
    async ([url, tkn, bId, barId, dugaaruud]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          mashiniiDugaaruud: dugaaruud,
          khuudasniiKhemjee: 200,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  /** Машины дугаар -> хамгийн сүүлийн зогсоолын хөдөлгөөн */
  const parkEaseMap = useMemo(() => {
    const map = new Map<string, ParkEaseTuukh>();
    const jagsaalt: ParkEaseTuukh[] = parkEaseData?.jagsaalt || [];
    // Сервер createdAt буурахаар эрэмбэлдэг тул эхний тохиолдол = сүүлийнх
    for (const mur of jagsaalt) {
      const dugaar = (mur.mashiniiDugaar || "").trim().toUpperCase();
      if (!dugaar || map.has(dugaar)) continue;
      map.set(dugaar, mur);
    }
    return map;
  }, [parkEaseData]);

  /**
   * Машины дугаар -> ХУРИМТЛАГДСАН төлөгдөөгүй зогсоолын төлбөр.
   *
   * parkEaseMap нь зөвхөн СҮҮЛИЙН хөдөлгөөнийг хадгалдаг тул авлагыг
   * тэндээс авах боломжгүй - нэг машин олон удаа орж гарсан бол өмнөх
   * төлөгдөөгүй төлбөрүүд нь алга болно. Иймд бүх хөдөлгөөнийг нэмнэ.
   *
   * `tulukhDun` нь гарах үед бодогдсон, хараахан хаагдаагүй дүн. Төлөгдсөн
   * бол сервер тал үүнийг 0 болгодог тул > 0 байгаа нь л авлага.
   */
  const avlagaMap = useMemo(() => {
    const map = new Map<string, { dun: number; too: number }>();
    const jagsaalt: ParkEaseTuukh[] = parkEaseData?.jagsaalt || [];
    for (const mur of jagsaalt) {
      const dugaar = (mur.mashiniiDugaar || "").trim().toUpperCase();
      const dun = Number(mur.tulukhDun) || 0;
      if (!dugaar || dun <= 0) continue;
      const umnukh = map.get(dugaar) || { dun: 0, too: 0 };
      map.set(dugaar, { dun: umnukh.dun + dun, too: umnukh.too + 1 });
    }
    return map;
  }, [parkEaseData]);

  /** Хуудсанд харагдаж буй бүх машины нийлбэр авлага */
  const avlagaNiit = useMemo(() => {
    let dun = 0;
    let too = 0;
    avlagaMap.forEach((v) => {
      dun += v.dun;
      too += 1;
    });
    return { dun, too };
  }, [avlagaMap]);

  /** Сонгосон хугацаанд ParkEase дээр бүртгэгдсэн нийт хөдөлгөөн */
  const { data: parkEaseStats } = useSWR(
    shouldFetch
      ? [
          "/zochin/zogsool/tuukh/stats",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).get("/zochin/zogsool/tuukh", {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          start: start || undefined,
          end: end || undefined,
          khuudasniiKhemjee: 1,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const parkEaseNiit = parkEaseStats?.niitMur || 0;

  const { baiguullaga } = useAuth();
  const getBuildingName = (bId: string) => {
    if (!bId) return "-";
    const building = baiguullaga?.barilguud?.find((b: any) => b._id === bId);
    return building?.ner || bId;
  };

  const HEADERS = [
    { id: "no", label: "№", width: "w-12" },
    { id: "ognoo", label: "Огноо" },
    {
      id: "status",
      label: "Төлөв",
      filter: true,
      current: statusFilter,
      set: setStatusFilter,
      options: [
        { label: "Бүгд", value: "all" },
        { label: "Урьсан", value: "urisan" },
        { label: "Нээсэн", value: "neesen" },
      ],
    },
    { id: "ip", label: "Камер IP" },
    { id: "suugch", label: "Оршин суугч" },
    { id: "toot", label: "Тоот" },
    { id: "utas", label: "Утас" },
    { id: "dugaar", label: "Улсын дугаар" },
    { id: "parkease", label: "ParkEase зогсоол" },
    { id: "avlaga", label: "Хуримтлагдсан авлага" },
    { id: "barilga", label: "Барилга" },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-[1700px] mx-auto w-full pb-8">
        {/* Filter bar */}
        <div className="relative z-10 px-6 py-4 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-[50px] sm:w-40 lg:w-[300px] h-11 [&_.ant-picker-input]:!bg-transparent [&_input]:!bg-transparent [&_.ant-picker-input-active]:!bg-transparent dark:[&_.ant-picker-suffix]:!text-white dark:[&_.ant-picker-suffix_svg]:!fill-white dark:[&_.ant-picker:hover]:!bg-slate-700 dark:[&_.ant-picker-focused]:!bg-slate-700 [&_.ant-picker-range-separator]:!text-slate-400 dark:[&_.ant-picker-range-separator]:!text-slate-400">
                <StandardDatePicker
                  isRange={true}
                  value={dateRange ?? undefined}
                  onChange={(_: any, dateString: [string, string]) => {
                    setDateRange(dateString);
                    setPage(1);
                  }}
                  format="YYYY-MM-DD"
                  className="w-full !bg-white dark:!bg-slate-700 hover:!bg-white dark:hover:!bg-slate-700 !border-slate-200 dark:!border-slate-500 hover:!border-slate-300 dark:hover:!border-slate-500 shadow-sm"
                  classNames={{
                    input: "!bg-transparent !border-0 !shadow-none text-[12px] !text-slate-700 dark:!text-slate-100 px-2",
                  }}
                  allowClear
                />
              </div>
            </div>

            <div className="relative group w-full xl:w-80 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Хайх (Оршин суугч, Тоот, Утас, Улсын дугаар, IP)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-11 pr-4 h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[12px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {statusFilter !== "all" && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Шүүлт:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] rounded-full border border-violet-200 dark:border-violet-500/20">
                Төлөв: {
                  { urisan: "Урьсан", neesen: "Нээсэн" }[statusFilter] || statusFilter
                }
                <button
                  onClick={() => { setStatusFilter("all"); setPage(1); }}
                  className="ml-0.5 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Dashboard Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Нийт хандалт</p>
                <p className="text-2xl font-medium text-slate-800 dark:text-white mt-0.5">{counts.total}</p>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Урьсан</p>
                <p className="text-2xl font-medium text-slate-800 dark:text-white mt-0.5">{counts.urisan}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-500 dark:text-sky-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Нээсэн</p>
                <p className="text-2xl font-medium text-slate-800 dark:text-white mt-0.5">{counts.neesen}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Идэвхтэй камер</p>
                <p className="text-2xl font-medium text-slate-800 dark:text-white mt-0.5">{topGates.length}</p>
              </div>
            </div>
          </div>

            {/* Төлөгдөөгүй хуримтлагдсан зогсоолын төлбөр */}
          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Хуримтлагдсан авлага
                </p>
                <p className="text-2xl font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                  {avlagaNiit.dun.toLocaleString("mn-MN")}₮
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {avlagaNiit.too} машин
                </p>
              </div>
            </div>
          </div>

        {/* ParkEase дээр бодитоор зогссон зочид */}
          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <ParkingCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  ParkEase зогсоол
                </p>
                <p className="text-2xl font-medium text-slate-800 dark:text-white mt-0.5">
                  {parkEaseNiit}
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Table */}
        <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-2xl flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-slate-900 dark:bg-slate-950 border-b border-white/5 text-slate-300">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h.id}
                      className={`group relative py-3.5 px-4 text-center text-[11px] font-medium uppercase tracking-wider whitespace-nowrap ${h.width || ""}`}
                    >
                      <div
                        className="flex items-center justify-center gap-2 cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          if (!h.filter) return;
                          setOpenFilter(openFilter === h.id ? null : h.id);
                        }}
                      >
                        {h.filter && (
                          <Filter className={`w-3 h-3 transition-colors ${h.current !== "all" && h.current !== undefined
                            ? "text-blue-400"
                            : "text-slate-500 group-hover:text-blue-400"
                            }`} />
                        )}
                        <span>{h.label}</span>
                      </div>

                      {h.options && (
                        <div
                          className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900/98 backdrop-blur-2xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 transition-all duration-300 z-[100] border border-white/5 overflow-hidden ring-1 ring-white/10 ${openFilter === h.id ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-3 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"}`}
                        >
                          <div className="relative flex flex-col gap-1 z-10">
                            <div className="px-3 py-1.5 mb-1 text-[11px] text-slate-500 uppercase tracking-widest border-b border-white/5 normal-case font-medium">
                              Сонгох
                            </div>
                            {h.options.map((opt, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  h.set?.(opt.value);
                                  setPage(1);
                                  setOpenFilter(null);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-[11px] text-left flex items-center justify-between cursor-pointer transition-all duration-200 normal-case font-normal ${h.current === opt.value
                                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40"
                                  : "hover:bg-white/10 text-slate-300 hover:text-white"
                                  }`}
                              >
                                <span>{opt.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-600 dark:text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center text-slate-400 dark:text-slate-500 text-[13px]"
                    >
                      Бүртгэл олдсонгүй.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer ${
                        idx % 2 === 0
                          ? "bg-slate-100 dark:bg-slate-800/40"
                          : "bg-white dark:bg-transparent"
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-[13px] text-slate-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px] font-medium font-[family-name:var(--font-mono)]">
                        {moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {log.ekhSurvalj === "parkease" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            <ParkingCircle className="w-3 h-3 shrink-0" />
                            ParkEase
                          </span>
                        ) : log.turul === "урьсан" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            Урьсан
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            Нээсэн
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px] font-mono text-slate-500 dark:text-slate-400">
                        {log.ip || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px] font-medium text-slate-700 dark:text-slate-200">
                        {log.orshinSuugchiinNer
                          ? log.orshinSuugchiinNer.trim().split(/\s+/).pop()
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px]">
                        {log.toot || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px] font-mono text-slate-500 dark:text-slate-400">
                        {log.utas || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px]">
                        {log.mashiniiDugaar ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[12px] !text-white tracking-widest font-[family-name:var(--font-mono)]">
                            {log.mashiniiDugaar}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[13px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px]">
                        <ParkEaseNudu
                          tuukh={
                            log.parkease ||
                            parkEaseMap.get(
                              (log.mashiniiDugaar || "").trim().toUpperCase()
                            )
                          }
                        />
                      </td>
                      <td className="py-3 px-4 text-center text-[13px]">
                        {(() => {
                          const avl = avlagaMap.get(
                            (log.mashiniiDugaar || "").trim().toUpperCase(),
                          );
                          if (!avl || avl.dun <= 0)
                            return (
                              <span className="text-slate-300 dark:text-slate-600">
                                -
                              </span>
                            );
                          return (
                            <span className="inline-flex flex-col items-center">
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                {avl.dun.toLocaleString("mn-MN")}₮
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {avl.too} удаа
                              </span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center text-[13px] text-slate-500 dark:text-slate-400">
                        {getBuildingName(log.barilgiinId)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <StandardPagination
            current={page}
            total={totalCount}
            pageSize={pageSize}
            onChange={setPage}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && token && ajiltan?.baiguullagiinId && (
        <UserHistoryModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          token={token}
          baiguullagiinId={ajiltan.baiguullagiinId}
          getBuildingName={getBuildingName}
        />
      )}
    </div>
  );
}
