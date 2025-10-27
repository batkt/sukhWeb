"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { createPortal } from "react-dom";
import { DatePickerInput } from "@mantine/dates";
import { motion } from "framer-motion";
import NekhemjlekhPage from "../nekhemjlekh/page";
import KhungulultPage from "../khungulult/page";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useGereeJagsaalt } from "@/lib/useGeree";
import uilchilgee from "../../../../lib/uilchilgee";
import toast from "react-hot-toast";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { useModalHotkeys } from "@/lib/useModalHotkeys";

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
      return true;
    });
  }, [allHistoryItems, tuluvFilter]);

  const exceleerTatya = () => {
    toast("Excel татах боломж удахгүй");
  };
  const t = (text: string) => text;

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
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        Гүйлгээний түүх
      </motion.h1>

      <div className="space-y-6">
        <div className="rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto ">
              <DatePickerInput
                type="range"
                locale="mn"
                value={ekhlekhOgnoo}
                onChange={setEkhlekhOgnoo}
                size="sm"
                radius="md"
                variant="filled"
                clearable
                placeholder="Огноо сонгох"
                className="w-[280px]"
                classNames={{
                  input: "text-theme placeholder:text-theme",
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
                className="w-[180px]"
                tone="theme"
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
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsKhungulultOpen(true)}
                  className="btn-minimal"
                >
                  Хөнгөлөлт
                </button>
              </motion.div>
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

        <div className="table-surface overflow-hidden rounded-2xl mt-10 w-full">
          <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
            <div className="max-h-[40vh] overflow-y-auto custom-scrollbar w-full">
              <table className="table-ui text-sm min-w-full">
                <thead>
                  <tr>
                    <th className="  dark:bg-slate-900 z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      №
                    </th>
                    <th className="  dark:bg-slate-900 z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Гэрээний дугаар
                    </th>

                    <th className="  dark:bg-slate-900 z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Хаяг
                    </th>
                    <th className="  dark:bg-slate-900 z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Нийт дүн
                    </th>

                    <th className="  dark:bg-slate-900 z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Төлөв
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-theme/70">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-theme/60">
                        Мэдээлэл байхгүй байна
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((it: any, idx: number) => {
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
                      const khayag = resident?.khayag || "-";
                      const isPaid =
                        String(it?.tuluv || "").trim() === "Төлсөн" ||
                        !!it?.tulsunOgnoo ||
                        (Array.isArray(it?.paymentHistory) &&
                          it.paymentHistory.length > 0);
                      const tuluvLabel = isPaid ? "Төлсөн" : "Төлөөгүй";

                      return (
                        <tr
                          key={it?._id || `${idx}`}
                          className="transition-colors border-b last:border-b-0"
                        >
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {dugaar}
                          </td>

                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {khayag}
                          </td>
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {total.toLocaleString("mn-MN")} ₮
                          </td>
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            <span
                              className={
                                "px-2 py-0.5 rounded-full text-xs font-medium " +
                                (isPaid ? "badge-paid" : "badge-unpaid")
                              }
                            >
                              {tuluvLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className=" px-6 py-3 border-t border-gray-200">
              <div className="text-sm text-theme">
                Нийт:{" "}
                <span className="font-semibold">{filteredItems.length}</span>
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
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1100px] h-auto rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
              ref={nekhemjlekhRef}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-slate-800">
                <div className="font-semibold"></div>
                <button
                  onClick={() => setIsNekhemjlekhOpen(false)}
                  className="btn-cancel btn-minimal"
                  data-modal-primary
                >
                  Хаах
                </button>
              </div>
              <div className="p-2 overflow-auto max-h-[calc(90vh-48px)]">
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
              className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1100px] h-auto rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900"
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
