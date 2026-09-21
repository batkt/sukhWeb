"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
import { Search, X, User, BarChart2, Users, Key, Monitor, Filter, ParkingCircle, Car, Wallet } from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import { StandardPagination } from "@/components/ui/StandardTable";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";

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
      "bg-warning/10 border-warning/30 text-warning",
  },
  1: {
    ner: "Идэвхтэй",
    angi:
      "bg-theme/10 border-theme/30 text-brand",
  },
  2: {
    ner: "Гарсан",
    angi:
      "bg-[color:var(--surface-hover)] dark:bg-white/[0.06] border-[color:var(--surface-border)] dark:border-white/[0.06] text-[color:var(--muted-text)]",
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
      <span className="text-[11px] uppercase tracking-wider text-[color:var(--muted-text)]">
        {garchig}
      </span>
      <span className="text-[13px] text-[color:var(--panel-text)] font-medium font-[family-name:var(--font-mono)]">
        {utga}
      </span>
      {nemelt ? (
        <span className="text-[11px] text-[color:var(--muted-text)] font-[family-name:var(--font-mono)]">
          {nemelt}
        </span>
      ) : null}
    </div>
  );
}

function ParkEaseNudu({ tuukh }: { tuukh?: ParkEaseTuukh }) {
  if (!tuukh)
    return <span className="text-[color:var(--muted-text)] italic text-xs">-</span>;

  const dotor = !tuukh.garsanTsag;
  const ezenTulsun = tuukh.tulburiinTurul === "ezen";
  const dun = Number(tuukh.tulukhDun) || 0;

  const tooltipParts = [
    dotor ? "Зогсоол дээр байгаа" : `Нийт: ${mongoloorKhugatsaa(tuukh.niitKhugatsaa)}`,
    (tuukh.uneguiMinutUldsen ?? 0) > 0 ? `Үнэгүй ${tuukh.uneguiMinutUldsen} мин үлдсэн` : "",
    (tuukh.uneguiMinutAshiglasan ?? 0) > 0 ? `Үнэгүй ${tuukh.uneguiMinutAshiglasan} мин дууссан` : "",
    dun > 0 ? `${dunFormat(dun)} (${ezenTulsun ? "Amarhome" : "Зочин"})` : "",
  ].filter(Boolean);

  return (
    <div
      title={tooltipParts.join(" | ")}
      className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
    >
      {dotor ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-theme/10 border border-theme/30 text-[11px] font-medium text-brand">
          <span className="w-1.5 h-1.5 rounded-full bg-theme shrink-0" />
          Зогсоол дээр
        </span>
      ) : (
        <span className="text-xs font-medium text-[color:var(--muted-text)] font-[family-name:var(--font-mono)]">
          {mongoloorKhugatsaa(tuukh.niitKhugatsaa)}
        </span>
      )}

      {dun > 0 ? (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            ezenTulsun
              ? "bg-warning text-black"
              : "bg-[color:var(--surface-hover)] dark:bg-white/[0.06] text-[color:var(--muted-text)] border border-[color:var(--surface-border)] dark:border-white/[0.06]"
          }`}
        >
          {dunFormat(dun)}
        </span>
      ) : (tuukh.uneguiMinutUldsen ?? 0) > 0 ? (
        <span className="text-[10px] text-[color:var(--muted-text)] opacity-75">
          ({tuukh.uneguiMinutUldsen}м)
        </span>
      ) : null}
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color:var(--panel)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[650px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[color:var(--panel)] border-[color:var(--surface-border)] dark:border-white/[0.06] flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 pt-6 pb-5 border-b border-[color:var(--surface-border)] dark:border-white/[0.06] shrink-0">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-theme/20 via-theme/20 to-theme/20 opacity-80" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[color:var(--surface-hover)] dark:bg-white/[0.06] border border-[color:var(--surface-border)] dark:border-white/[0.06]">
                <User className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-[15px] font-medium text-[color:var(--panel-text)] dark:text-white tracking-tight">
                  {log.orshinSuugchiinNer || "Хэрэглэгч"}-ийн түүх
                </h2>
                <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">
                  Тоот: {log.toot || "-"} | Утас: {log.utas || "-"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/[0.06] flex items-center justify-center text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors"
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
                <Car className="w-4 h-4 text-brand" />
                <h3 className="text-[13px] font-medium text-[color:var(--panel-text)]">
                  Уригдсан машин
                </h3>
                <span className="text-[11px] text-[color:var(--muted-text)]">
                  {urisanMashinuud.length}
                </span>
              </div>

              <div className="border border-[color:var(--surface-border)] dark:border-white/[0.05] rounded-2xl overflow-hidden bg-[color:var(--surface-hover)] dark:bg-white/[0.02]">
                <table className="w-full border-collapse">
                  <thead className="bg-[color:var(--surface-hover)] dark:bg-white/[0.04] text-[11px] uppercase font-medium text-[color:var(--muted-text)]">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Урьсан огноо</th>
                      <th className="py-2.5 px-4 text-center">Улсын дугаар</th>
                      <th className="py-2.5 px-4 text-center">Төлөв</th>
                      <th className="py-2.5 px-4 text-center">Үнэгүй минут</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[color:var(--muted-text)] divide-y divide-[color:var(--surface-border)] dark:divide-white/[0.05]">
                    {urisanMashinuud.map((mashin) => {
                      const tuluv =
                        URILGIIN_TULUV[Number(mashin.tuluv) || 0] ||
                        URILGIIN_TULUV[0];
                      return (
                        <tr
                          key={mashin._id}
                          className="hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/[0.02]"
                        >
                          <td className="py-2.5 px-4 font-mono text-[13px]">
                            {mashin.createdAt
                              ? moment(mashin.createdAt).format("YYYY-MM-DD HH:mm")
                              : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {mashin.urisanMashiniiDugaar ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-theme text-[12px] !text-white tracking-widest font-[family-name:var(--font-mono)]">
                                {mashin.urisanMashiniiDugaar}
                              </span>
                            ) : (
                              <span className="text-[color:var(--muted-text)]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${tuluv.angi}`}
                            >
                              {tuluv.ner}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center text-[11px] text-[color:var(--muted-text)]">
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

              <div className="mt-5 mb-1 h-px bg-[color:var(--surface-hover)] dark:bg-white/[0.05]" />
            </div>
          )}

          {/* ── ParkEase зогсоолын дэлгэрэнгүй ─────────────────────────── */}
          {parkEaseTuukh.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <ParkingCircle className="w-4 h-4 text-brand" />
                <h3 className="text-[13px] font-medium text-[color:var(--panel-text)]">
                  ParkEase зогсоол
                </h3>
                <span className="text-[11px] text-[color:var(--muted-text)]">
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
                      className="rounded-2xl border border-[color:var(--surface-border)] dark:border-white/[0.05] bg-[color:var(--surface-hover)] dark:bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        {dotor ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-theme/10 border border-theme/30 text-[11px] font-medium text-brand">
                            <span className="w-1.5 h-1.5 rounded-full bg-theme shrink-0" />
                            Зогсоол дээр байна
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/[0.06] border border-[color:var(--surface-border)] dark:border-white/[0.06] text-[11px] font-medium text-[color:var(--muted-text)]">
                            Гарсан
                          </span>
                        )}
                        {dun > 0 &&
                          (ezenTulsun ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-warning text-black dark:text-white text-[11px]">
                              {dunFormat(dun)} · Amarhome нэхэмжлэх
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[color:var(--panel)] dark:bg-white/[0.08] text-[11px] font-medium text-[color:var(--panel-text)]">
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

              <div className="mt-5 mb-1 h-px bg-[color:var(--surface-hover)] dark:bg-white/[0.05]" />
            </div>
          )}

          {isValidating && historyLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[color:var(--muted-text)] text-[13px]">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-theme mb-2" />
              Түүхийг уншиж байна...
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-12 text-[color:var(--muted-text)] text-[13px]">
              Хэрэглэгчийн түүх олдсонгүй.
            </div>
          ) : (
            <div className="border border-[color:var(--surface-border)] dark:border-white/[0.05] rounded-2xl overflow-hidden bg-[color:var(--surface-hover)] dark:bg-white/[0.02]">
              <table className="w-full border-collapse">
                <thead className="bg-[color:var(--surface-hover)] dark:bg-white/[0.04] text-[11px] uppercase font-medium text-[color:var(--muted-text)]">
                  <tr>
                    <th className="py-2.5 px-4 text-center">№</th>
                    <th className="py-2.5 px-4 text-left">Огноо</th>
                    <th className="py-2.5 px-4 text-center">Төлөв</th>
                    <th className="py-2.5 px-4 text-center">Улсын дугаар</th>
                    <th className="py-2.5 px-4 text-center">Камер IP</th>
                    <th className="py-2.5 px-4 text-left">Барилга</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[color:var(--muted-text)] divide-y divide-[color:var(--surface-border)] dark:divide-white/[0.05]">
                  {historyLogs.map((hLog, idx) => {
                    const isUrisan = hLog.turul === "урьсан";
                    return (
                      <tr key={hLog._id} className="hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 text-center text-[color:var(--muted-text)] font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {moment(hLog.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isUrisan ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-[11px] font-medium text-warning">
                              Урьсан
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-theme/10 border border-theme/30 text-[11px] font-medium text-brand">
                              Нээсэн
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {hLog.mashiniiDugaar ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-theme text-[12px] !text-white tracking-widest font-[family-name:var(--font-mono)]">
                              {hLog.mashiniiDugaar}
                            </span>
                          ) : (
                            <span className="text-[color:var(--muted-text)]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center text-[color:var(--muted-text)] font-mono text-[11px]">
                          {hLog.ip || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-left text-[color:var(--muted-text)] text-[13px]">
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
        <div className="px-7 pb-6 pt-2 border-t border-[color:var(--surface-border)] dark:border-white/[0.06] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 h-9 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/[0.06] hover:bg-[color:var(--panel)] dark:hover:bg-white/[0.1] text-[12px] font-medium text-[color:var(--muted-text)] transition-colors"
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
  const { searchTerm, setSearchTerm } = useSearch();
  const [page, setPage] = useState(1);
  const pageSize = 500;
  const [selectedLog, setSelectedLog] = useState<GateOpenLog | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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

  const urisanColumns: ColumnsType<any> = [
    {
      title: "№",
      key: "no",
      width: 45,
      align: "center",
      render: (_: any, __: any, idx: number) => (
        <span className="whitespace-nowrap font-mono text-xs text-[color:var(--muted-text)]">
          {(page - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      title: "Огноо",
      key: "ognoo",
      width: 155,
      align: "center",
      render: (_: any, log: any) => (
        <span className="whitespace-nowrap font-mono text-xs text-[color:var(--panel-text)]">
          {log.createdAt ? moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}
        </span>
      ),
    },
    {
      title: "Төлөв",
      key: "status",
      width: 110,
      align: "center",
      // Нэг сонголттой шүүлтүүр — хүснэгтийн стандарт шүүлтүүрийн цэсэнд
      // өөрийн жагсаалтыг зурна.
      filterDropdown: ({ confirm }: any) => (
        <div className="flex min-w-[9rem] flex-col gap-1 p-1.5">
          {[
            { label: "Бүгд", value: "all" },
            { label: "Урьсан", value: "urisan" },
            { label: "Нээсэн", value: "neesen" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
                confirm();
              }}
              className={`rounded px-3 py-0.5 text-left transition-colors ${
                statusFilter === opt.value
                  ? "bg-[hsl(var(--zt-primary))] text-white"
                  : "hover:bg-[hsl(var(--zt-accent))]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ),
      render: (_: any, log: any) => (
        <div className="flex items-center justify-center whitespace-nowrap">
          {log.ekhSurvalj === "parkease" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-theme/30 bg-theme/10 px-2 py-0.5 text-xs font-medium text-brand">
              <ParkingCircle className="h-3 w-3 shrink-0" />
              ParkEase
            </span>
          ) : log.turul === "урьсан" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              Урьсан
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-theme/30 bg-theme/10 px-2 py-0.5 text-xs font-medium text-brand">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme" />
              Нээсэн
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Камер IP",
      dataIndex: "ip",
      key: "ip",
      width: 120,
      align: "center",
      render: (v: any) => <span className="font-mono text-xs whitespace-nowrap">{v || "-"}</span>,
    },
    {
      title: "Оршин суугч",
      key: "suugch",
      width: 120,
      align: "center",
      render: (_: any, log: any) => (
        <span className="whitespace-nowrap truncate max-w-[120px] inline-block text-xs">
          {log.orshinSuugchiinNer
            ? log.orshinSuugchiinNer.trim().split(/\s+/).pop()
            : "-"}
        </span>
      ),
    },
    {
      title: "Тоот",
      dataIndex: "toot",
      key: "toot",
      width: 70,
      align: "center",
      render: (v: any) => <span className="whitespace-nowrap text-xs">{v || "-"}</span>,
    },
    {
      title: "Утас",
      dataIndex: "utas",
      key: "utas",
      width: 100,
      align: "center",
      render: (v: any) => <span className="font-mono text-xs whitespace-nowrap">{v || "-"}</span>,
    },
    {
      title: "Улсын дугаар",
      dataIndex: "mashiniiDugaar",
      key: "dugaar",
      width: 120,
      align: "center",
      render: (v: any) =>
        v ? (
          <span className="rounded-full bg-theme px-2.5 py-0.5 font-mono text-xs tracking-widest !text-white whitespace-nowrap">
            {v}
          </span>
        ) : (
          <span className="italic opacity-50 text-xs">-</span>
        ),
    },
    {
      title: "ParkEase зогсоол",
      key: "parkease",
      width: 160,
      align: "center",
      render: (_: any, log: any) => (
        <ParkEaseNudu
          tuukh={
            log.parkease ||
            parkEaseMap.get((log.mashiniiDugaar || "").trim().toUpperCase())
          }
        />
      ),
    },
    {
      title: "Хуримтлагдсан авлага",
      key: "avlaga",
      width: 130,
      align: "center",
      render: (_: any, log: any) => {
        const avl = avlagaMap.get(
          (log.mashiniiDugaar || "").trim().toUpperCase(),
        );
        if (!avl || avl.dun <= 0) return <span className="opacity-40 text-xs">-</span>;
        return (
          <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs font-mono">
            <span className="font-medium text-warning">
              {avl.dun.toLocaleString("mn-MN")}₮
            </span>
            <span className="text-[10px] opacity-60">({avl.too})</span>
          </span>
        );
      },
    },
    {
      title: "Барилга",
      key: "barilga",
      width: 140,
      align: "center",
      render: (_: any, log: any) => (
        <span className="whitespace-nowrap truncate max-w-[140px] inline-block text-xs">
          {getBuildingName(log.barilgiinId)}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-[1700px] mx-auto w-full pb-8">
        {/* Filter bar */}
        <div className="relative z-10 px-5 py-3 rounded-2xl bg-white dark:bg-[color:var(--panel)] border border-[color:var(--surface-border)] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-[50px] sm:w-40 lg:w-[300px] h-10 [&_.ant-picker-input]:!bg-transparent [&_input]:!bg-transparent [&_.ant-picker-input-active]:!bg-transparent dark:[&_.ant-picker-suffix]:!text-white dark:[&_.ant-picker-suffix_svg]:!fill-white dark:[&_.ant-picker:hover]:!bg-[color:var(--panel)] dark:[&_.ant-picker-focused]:!bg-[color:var(--panel)] [&_.ant-picker-range-separator]:!text-[color:var(--muted-text)] dark:[&_.ant-picker-range-separator]:!text-[color:var(--muted-text)]">
                <StandardDatePicker
                  isRange={true}
                  value={dateRange ?? undefined}
                  onChange={(_: any, dateString: [string, string]) => {
                    setDateRange(dateString);
                    setPage(1);
                  }}
                  format="YYYY-MM-DD"
                  className="w-full !bg-[color:var(--surface-bg)] dark:!bg-[color:var(--panel)] hover:!bg-[color:var(--surface-bg)] dark:hover:!bg-[color:var(--panel)] !border-[color:var(--surface-border)] dark:!border-[color:var(--surface-border)] hover:!border-[color:var(--surface-border)] dark:hover:!border-[color:var(--surface-border)] shadow-sm"
                  classNames={{
                    input: "!bg-transparent !border-0 !shadow-none text-[12px] !text-[color:var(--panel-text)] dark:!text-[color:var(--muted-text)] px-2",
                  }}
                  allowClear
                />
              </div>
            </div>
          </div>

          {statusFilter !== "all" && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-[color:var(--surface-border)]">
              <span className="text-[11px] text-[color:var(--muted-text)] uppercase tracking-wider">Шүүлт:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-theme/10 text-brand text-[11px] rounded-full border border-theme/30">
                Төлөв: {
                  { urisan: "Урьсан", neesen: "Нээсэн" }[statusFilter] || statusFilter
                }
                <button
                  onClick={() => { setStatusFilter("all"); setPage(1); }}
                  className="ml-0.5 hover:text-brand dark:hover:text-brand transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Dashboard Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="p-3 rounded-2xl border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--panel)] shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-theme/10 flex items-center justify-center text-brand shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[color:var(--muted-text)] uppercase tracking-wider font-medium truncate">Нийт хандалт</p>
              <p className="text-base font-semibold text-[color:var(--panel-text)] dark:text-white leading-tight mt-0.5">{counts.total}</p>
            </div>
          </div>
          
          <div className="p-3 rounded-2xl border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--panel)] shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[color:var(--muted-text)] uppercase tracking-wider font-medium truncate">Урьсан</p>
              <p className="text-base font-semibold text-[color:var(--panel-text)] dark:text-white leading-tight mt-0.5">{counts.urisan}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--panel)] shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-theme/10 flex items-center justify-center text-theme shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[color:var(--muted-text)] uppercase tracking-wider font-medium truncate">Нээсэн</p>
              <p className="text-base font-semibold text-[color:var(--panel-text)] dark:text-white leading-tight mt-0.5">{counts.neesen}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--panel)] shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-theme/10 flex items-center justify-center text-theme shrink-0">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[color:var(--muted-text)] uppercase tracking-wider font-medium truncate">Идэвхтэй камер</p>
              <p className="text-base font-semibold text-[color:var(--panel-text)] dark:text-white leading-tight mt-0.5">{topGates.length}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--panel)] shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[color:var(--muted-text)] uppercase tracking-wider font-medium truncate">Хуримтлагдсан авлага</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-base font-semibold text-warning leading-tight truncate">
                  {avlagaNiit.dun.toLocaleString("mn-MN")}₮
                </p>
                {avlagaNiit.too > 0 && (
                  <span className="text-[10px] text-[color:var(--muted-text)] whitespace-nowrap">
                    ({avlagaNiit.too})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--panel)] shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-theme/10 flex items-center justify-center text-brand shrink-0">
              <ParkingCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[color:var(--muted-text)] uppercase tracking-wider font-medium truncate">ParkEase зогсоол</p>
              <p className="text-base font-semibold text-[color:var(--panel-text)] dark:text-white leading-tight mt-0.5">{parkEaseNiit}</p>
            </div>
          </div>
        </div>



        {/* Table */}
        <div className="min-h-0 flex-1">
          <Table<any>
            columns={urisanColumns}
            dataSource={logs}
            rowKey={(log) => log._id}
            pagination={false}
            scroll={{ x: 1100 }}
            size="middle"
            className="[&_.ant-table-cell]:!py-2.5 [&_.ant-table-cell]:whitespace-nowrap [&_.ant-table-row]:!h-[44px]"
            locale={{ emptyText: "Бүртгэл олдсонгүй." }}
            onRow={(log) => ({
              onClick: () => setSelectedLog(log),
              className: "cursor-pointer",
            })}
          />
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
