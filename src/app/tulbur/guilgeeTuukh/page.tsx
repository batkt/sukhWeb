"use client";

import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "@/context/SearchContext";
import useSWR from "swr";
import { createPortal } from "react-dom";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { motion } from "framer-motion";
import NekhemjlekhPage from "../nekhemjlekh/page";
import KhungulultPage from "../khungulult/page";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useGereeJagsaalt } from "@/lib/useGeree";
import uilchilgee from "../../../../lib/uilchilgee";
import { message } from "antd";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { set } from "lodash";
import formatNumber from "../../../../tools/function/formatNumber";
import matchesSearch from "@/tools/function/matchesSearch";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("mn-MN") : "-";

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted ? createPortal(children as any, document.body) : null;
};

type DateRangeValue = [string | null, string | null] | undefined;

export default function DansniiKhuulga() {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const { searchTerm } = useSearch();
  const { token, ajiltan, barilgiinId } = useAuth();
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [tuluvFilter, setTuluvFilter] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [isNekhemjlekhOpen, setIsNekhemjlekhOpen] = useState(false);
  const [isKhungulultOpen, setIsKhungulultOpen] = useState(false);
  const nekhemjlekhRef = useRef<HTMLDivElement | null>(null);
  const khungulultRef = useRef<HTMLDivElement | null>(null);

  // Paid history modal state
  // History modal removed; showing org-scoped list directly

  // Fetch org-scoped payment history
  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/nekhemjlekhiinTuukh",
          token,
          ajiltan.baiguullagiinId,
          barilgiinId || null,
        ]
      : null,
    async ([url, tkn, orgId, branch]: [
      string,
      string,
      string,
      string | null
    ]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          ...(branch ? { barilgiinId: branch } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 500,
          query: {
            baiguullagiinId: orgId,
            ...(branch ? { barilgiinId: branch } : {}),
          },
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const allHistoryItems = useMemo(() => {
    const raw = Array.isArray(historyData?.jagsaalt)
      ? historyData.jagsaalt
      : Array.isArray(historyData)
      ? historyData
      : [];
    if (!ekhlekhOgnoo || (!ekhlekhOgnoo[0] && !ekhlekhOgnoo[1])) return raw;
    const [start, end] = ekhlekhOgnoo;
    const s = start ? new Date(start).getTime() : Number.NEGATIVE_INFINITY;
    const e = end ? new Date(end).getTime() : Number.POSITIVE_INFINITY;
    return raw.filter((it: any) => {
      const d = new Date(
        it?.tulsunOgnoo || it?.ognoo || it?.createdAt || 0
      ).getTime();
      return d >= s && d <= e;
    });
  }, [historyData, ekhlekhOgnoo]);

  const { gereeGaralt } = useGereeJagsaalt(
    {},
    token || undefined,
    ajiltan?.baiguullagiinId,
    barilgiinId || undefined
  );
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    {},
    barilgiinId
  );

  const contractsById = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?._id) map[String(g._id)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const contractsByNumber = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?.gereeniiDugaar) map[String(g.gereeniiDugaar)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const residentsById = useMemo(() => {
    const list = (orshinSuugchGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((r) => {
      if (r?._id) map[String(r._id)] = r;
    });
    return map;
  }, [orshinSuugchGaralt?.jagsaalt]);

  // Filter by paid/unpaid
  const filteredItems = useMemo(() => {
    return allHistoryItems.filter((it: any) => {
      const isPaid =
        !!it?.tulsunOgnoo || String(it?.tuluv || "").trim() === "Төлсөн";
      if (tuluvFilter === "paid") return isPaid;
      if (tuluvFilter === "unpaid") return !isPaid;

      if (searchTerm) {
        if (!matchesSearch(it, searchTerm)) return false;
      }

      return true;
    });
  }, [allHistoryItems, tuluvFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalCount = filteredItems.length;
    const totalSum = filteredItems.reduce((s: number, it: any) => {
      const v = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
      return s + v;
    }, 0);
    const paidCount = filteredItems.filter((it: any) => {
      return (
        String(it?.tuluv || "").trim() === "Төлсөн" ||
        !!it?.tulsunOgnoo ||
        (Array.isArray(it?.paymentHistory) && it.paymentHistory.length > 0)
      );
    }).length;
    const unpaidCount = totalCount - paidCount;
    const maxAmount = filteredItems.reduce((m: number, it: any) => {
      const v = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
      return Math.max(m, v);
    }, 0);

    return [
      { title: "Төлсөн", value: paidCount },
      { title: "Төлөөгүй", value: unpaidCount },
      { title: "Хамгийн их төлбөр", value: `${formatNumber(maxAmount, 0)} ₮` },
      { title: "Нийт дүн", value: `${formatNumber(totalSum, 0)} ₮` },
    ];
  }, [filteredItems]);

  const exceleerTatya = () => {
    message.info("Excel татах боломж удахгүй");
  };
  const t = (text: string) => text;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const paginated = filteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    const open = isNekhemjlekhOpen || isKhungulultOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isNekhemjlekhOpen, isKhungulultOpen]);

  // Keyboard: Esc to close, Enter to trigger primary action within modal
  useModalHotkeys({
    isOpen: isNekhemjlekhOpen,
    onClose: () => setIsNekhemjlekhOpen(false),
    container: nekhemjlekhRef.current,
  });
  useModalHotkeys({
    isOpen: isKhungulultOpen,
    onClose: () => setIsKhungulultOpen(false),
    container: khungulultRef.current,
  });

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-3 mb-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-theme bg-clip-text text-transparent drop-shadow-sm"
        >
          Гүйлгээний түүх
        </motion.h1>
        <div style={{ width: 44, height: 44 }} className="flex items-center">
          <DotLottieReact
            src="https://lottie.host/740ab27b-f4f0-49c5-a202-a23a70cd8e50/eNy8Ct6t4y.lottie"
            loop
            autoplay
            style={{ width: 44, height: 44 }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative group rounded-2xl neu-panel"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.25 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-2xl opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
              <div className="relative rounded-2xl p-5 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-theme">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString("mn-MN")
                    : String(stat.value)}
                </div>
                <div className="text-xs text-theme leading-tight">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <DatePickerInput
                type="range"
                locale="mn"
                value={ekhlekhOgnoo}
                onChange={setEkhlekhOgnoo}
                size="sm"
                radius="md"
                variant="filled"
                clearable
                dropdownType="popover"
                popoverProps={{
                  position: "bottom-start",
                  withinPortal: true,
                  width: 320,
                }}
                placeholder="Огноо сонгох"
                classNames={{
                  input:
                    "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-[380px]",
                }}
              />
              <TusgaiZagvar
                value={tuluvFilter}
                onChange={(v: string) =>
                  setTuluvFilter(v as "all" | "paid" | "unpaid")
                }
                options={[
                  { value: "all", label: "Бүгд" },
                  { value: "paid", label: "Төлсөн" },
                  { value: "unpaid", label: "Төлөөгүй" },
                ]}
                placeholder="Төлөв"
                className="h-[40px] w-[140px]"
              />
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsNekhemjlekhOpen(true)}
                  className="btn-minimal"
                >
                  Нэхэмжлэх
                </button>
              </motion.div>
              {/* <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsKhungulultOpen(true)}
                  className="btn-minimal"
                >
                  Хөнгөлөлт
                </button>
              </motion.div> */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button onClick={exceleerTatya} className="btn-minimal">
                  {t("Excel татах")}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="table-surface overflow-hidden rounded-2xl w-full">
          <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
            <div className="max-h-[29vh] overflow-y-auto custom-scrollbar w-full">
              <table className="table-ui text-sm min-w-full">
                <thead>
                  <tr>
                    <th className="  dark:bg-slate-900 z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      №
                    </th>
                    <th className="  dark:bg-slate-900 z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Нэр
                    </th>
                    <th className="  dark:bg-slate-900 z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Гэрээний дугаар
                    </th>

                    {/* <th className="  dark:bg-slate-900 z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Хаяг
                    </th> */}
                    <th className="  dark:bg-slate-900 z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Нийт дүн
                    </th>

                    <th className="  dark:bg-slate-900 z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Төлөв
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-theme/70">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-theme/60">
                        Хайсан мэдээлэл алга байна
                      </td>
                    </tr>
                  ) : (
                    paginated.map((it: any, idx: number) => {
                      const ct =
                        (it?.gereeniiId &&
                          contractsById[String(it.gereeniiId)]) ||
                        (it?.gereeniiDugaar &&
                          contractsByNumber[String(it.gereeniiDugaar)]) ||
                        undefined;
                      const resident =
                        (it?.orshinSuugchId &&
                          residentsById[String(it.orshinSuugchId)]) ||
                        undefined;
                      const dugaar = String(
                        it?.gereeniiDugaar || ct?.gereeniiDugaar || "-"
                      );
                      const total = Number(
                        it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0
                      );
                      // const khayag =
                      //   resident && resident.bairNer
                      //     ? String(resident.bairNer).trim()
                      //     : it.bairNer
                      //     ? String(it.bairNer).trim()
                      //     : "-";
                      const isPaid =
                        String(it?.tuluv || "").trim() === "Төлсөн" ||
                        !!it?.tulsunOgnoo ||
                        (Array.isArray(it?.paymentHistory) &&
                          it.paymentHistory.length > 0);
                      const tuluvLabel = isPaid ? "Төлсөн" : "Төлөөгүй";
                      const ner = resident
                        ? [resident.ner]
                            .map((v) => (v ? String(v).trim() : ""))
                            .filter(Boolean)
                            .join(" ") || "-"
                        : [it.ner]
                            .map((v) => (v ? String(v).trim() : ""))
                            .filter(Boolean)
                            .join(" ") || "-";

                      return (
                        <tr
                          key={it?._id || `${idx}`}
                          className="transition-colors border-b last:border-b-0"
                        >
                          <td className="p-1 text-center text-theme whitespace-nowrap">
                            {(page - 1) * rowsPerPage + idx + 1}
                          </td>
                          <td className="p-1 text-center text-theme whitespace-nowrap">
                            {ner}
                          </td>
                          <td className="p-1 text-center text-theme whitespace-nowrap">
                            {dugaar}
                          </td>

                          {/* <td className="p-3 text-center text-theme whitespace-nowrap">
                            {khayag}
                          </td> */}
                          <td className="p-1 text-center text-theme whitespace-nowrap">
                            {total.toLocaleString("mn-MN")} ₮
                          </td>
                          <td className="p-1 text-center text-theme whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={
                                  "px-2 py-0.5 rounded-full text-xs font-medium " +
                                  (isPaid ? "badge-paid" : "badge-unpaid")
                                }
                              >
                                {tuluvLabel}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className=" px-4 py-2 border-t border-gray-200 flex items-center justify-between gap-4"></div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full px-2 py-1 gap-3 text-xs">
            <div className="text-theme/70">Нийт: {filteredItems.length}</div>

            <div className="flex items-center gap-3">
              <PageSongokh
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(v);
                  setPage(1);
                }}
                className="text-xs px-2 py-1"
              />

              <div className="flex items-center gap-1">
                <button
                  className="btn-minimal btn-minimal-sm px-2 py-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Өмнөх
                </button>
                <div className="text-theme/70 px-1">{page}</div>
                <button
                  className="btn-minimal btn-minimal-sm px-2 py-1 text-xs"
                  disabled={page * rowsPerPage >= filteredItems.length}
                  onClick={() => setPage(page + 1)}
                >
                  Дараах
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isNekhemjlekhOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
              onClick={() => setIsNekhemjlekhOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 z-[2200] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1800px] h-[95vh] max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto modal-surface"
              onClick={(e) => e.stopPropagation()}
              ref={nekhemjlekhRef}
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full h-full overflow-y-auto overflow-x-auto overscroll-contain custom-scrollbar">
                <NekhemjlekhPage />
              </div>
            </motion.div>
          </>
        </ModalPortal>
      )}

      {isKhungulultOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
              onClick={() => setIsKhungulultOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1100px] rounded-3xl overflow-hidden shadow-2xl modal-surface modal-responsive"
              onClick={(e) => e.stopPropagation()}
              ref={khungulultRef}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-slate-800">
                <div className="font-semibold"></div>
                <button
                  onClick={() => setIsKhungulultOpen(false)}
                  className="btn-cancel btn-minimal"
                  data-modal-primary
                >
                  Хаах
                </button>
              </div>
              <div className="p-2 overflow-auto max-h-[calc(90vh-48px)] ">
                <KhungulultPage />
              </div>
            </motion.div>
          </>
        </ModalPortal>
      )}

      {/* Per-resident history modal removed */}
    </div>
  );
}
