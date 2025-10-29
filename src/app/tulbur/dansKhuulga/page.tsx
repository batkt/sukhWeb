"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DatePickerInput } from "@mantine/dates";
import { motion } from "framer-motion";
import EbarimtPage from "../ebarimt/page";
import ZardalPage from "../zardal/page";
import { useAuth } from "@/lib/useAuth";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import useJagsaalt from "@/lib/useJagsaalt";
import uilchilgee, { url as API_URL } from "../../../../lib/uilchilgee";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import formatNumber from "../../../../tools/function/formatNumber";
// Using Mantine DatePickerInput with type="range" instead of Antd RangePicker

type TableItem = {
  id: string | number;
  date: string;
  month: string;
  // numerical value in minor units (assumed) or main units depending on backend
  total: number;
  // human readable description / purpose of transaction
  action: string;
  // linked contract ids (array or single)
  contractIds?: string[];
  // transferred account / destination account number
  account?: string;
  raw?: any;
};

type DateRangeValue = [string | null, string | null] | undefined;

export default function DansniiKhuulga() {
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [selectedDansId, setSelectedDansId] = useState<string | undefined>(
    undefined
  );
  const [filteredData, setFilteredData] = useState<TableItem[]>([]);
  const [isEbarimtOpen, setIsEbarimtOpen] = useState(false);
  const [isZardalOpen, setIsZardalOpen] = useState(false);
  const { token, ajiltan, barilgiinId } = useAuth();
  // Include only defined filters to avoid sending { baiguullagiinId: undefined }
  const orgQuery = useMemo(() => {
    const q: Record<string, any> = {};
    if (ajiltan?.baiguullagiinId) q.baiguullagiinId = ajiltan.baiguullagiinId;
    if (barilgiinId) q.barilgiinId = barilgiinId;
    return q;
  }, [ajiltan?.baiguullagiinId, barilgiinId]);
  const { jagsaalt: dansList } = useJagsaalt<any>(DANS_ENDPOINT, orgQuery, {
    createdAt: -1,
  });
  const dansOptions = useMemo(
    () =>
      (dansList || []).map((d: any) => ({
        value: String(d._id || d.dugaar || ""),

        label: String(d.dugaar || "-") || "-",
      })),
    [dansList]
  );

  const exceleerTatya = () => {
    alert("Excel татах товч дарлаа!");
  };
  const t = (text: string) => text;

  // Bank transfers (банкны гүйлгээ) fetched from /bankniiGuilgee
  const [bankRows, setBankRows] = useState<any[]>([]);
  const [isLoadingBankRows, setIsLoadingBankRows] = useState(false);

  // Modal Portal Helper
  const ModalPortal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children as any, document.body) : null;
  };

  useEffect(() => {
    const open = isEbarimtOpen || isZardalOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isEbarimtOpen, isZardalOpen]);

  useEffect(() => {
    const fetchBankTransfers = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      setIsLoadingBankRows(true);
      try {
        const resp = await uilchilgee(token).get("/bankniiGuilgee", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 200,
          },
        });
        const list = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
          ? resp.data
          : [];
        setBankRows(list);
      } catch (e) {
        console.error("bankniiGuilgee fetch error", e);
        openErrorOverlay("Банкны гүйлгээ татахад алдаа гарлаа");
      } finally {
        setIsLoadingBankRows(false);
      }
    };

    fetchBankTransfers();
  }, [token, ajiltan?.baiguullagiinId, barilgiinId]);

  // Map bankRows to table items and apply filters (date range + selected account)
  useEffect(() => {
    const toDate = (val: any) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const start = ekhlekhOgnoo?.[0] ? toDate(ekhlekhOgnoo[0]) : null;
    const end = ekhlekhOgnoo?.[1] ? toDate(ekhlekhOgnoo[1]) : null;

    const mapped = (bankRows || []).map((r: any, idx: number) => {
      const dateVal =
        r.postDate ||
        r.tranDate ||
        r.ognoo ||
        r.createdAt ||
        r.date ||
        r.togtoo ||
        null;
      const d = dateVal ? new Date(dateVal) : null;
      const month = d
        ? d.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit" })
        : r.sar || "";
      const total =
        Number(r.amount ?? r.kholbosonDun ?? r.niitTulbur ?? r.total ?? 0) || 0;
      const action = r.description || r.ner || r.tovch || "Банкны гүйлгээ";
      const contractIds = Array.isArray(r.kholbosonGereeniiId)
        ? r.kholbosonGereeniiId
        : r.kholbosonGereeniiId
        ? [String(r.kholbosonGereeniiId)]
        : [];
      const account =
        r.dansniiDugaar || r.accNum || r.dugaar || r.accountId || "";
      return {
        id: r._id || `bank-${idx}`,
        date: d ? d.toLocaleDateString("mn-MN") : "-",
        month,
        total,
        action,
        contractIds,
        account,
        raw: r,
      } as TableItem & { raw?: any };
    });

    const filtered = mapped.filter((m) => {
      // account filter: support matching by several possible fields
      if (selectedDansId) {
        const raw = m.raw || {};
        const acct = String(raw.dansId || raw.dugaar || raw.accountId || "");
        if (acct !== String(selectedDansId)) return false;
      }
      if (start || end) {
        const raw = m.raw || {};
        const dateVal = raw.ognoo || raw.createdAt || raw.date || null;
        if (!dateVal) return false;
        const d = new Date(dateVal);
        if (start && d < start) return false;
        if (end && d > end) return false;
      }
      return true;
    });

    setFilteredData(filtered as TableItem[]);
  }, [bankRows, selectedDansId, ekhlekhOgnoo]);

  // Dashboard statistics derived from filteredData for admin
  const stats = useMemo(() => {
    const totalCount = filteredData.length;
    const totalSum = filteredData.reduce((s, r) => s + (r.total || 0), 0);
    const uniqueAccounts = new Set(
      filteredData.map((f) => String(f.account || "")).filter(Boolean)
    ).size;
    const withContracts = filteredData.filter(
      (f) => (f.contractIds?.length || 0) > 0
    ).length;
    const withoutContracts = totalCount - withContracts;
    const maxAmount = filteredData.reduce(
      (m, r) => Math.max(m, r.total || 0),
      0
    );
    const latestDate = (() => {
      let latest: Date | null = null;
      for (const r of filteredData) {
        const raw = (r as any).raw || {};
        const dateVal =
          raw.ognoo || raw.createdAt || raw.date || r.date || null;
        const d = dateVal ? new Date(dateVal) : null;
        if (d && (!latest || d > latest)) latest = d;
      }
      return latest ? latest.toLocaleDateString("mn-MN") : "-";
    })();

    return [
      { title: "Гэрээ холбогдсон", value: withContracts },

      { title: "Холбогдоогүй", value: withoutContracts },
      { title: "Хамгийн их гүйлгээ", value: `${formatNumber(maxAmount, 0)} ₮` },
      { title: "Нийт дүн", value: `${formatNumber(totalSum, 0)} ₮` },
    ];
  }, [filteredData]);

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        Дансны хуулга
      </motion.h1>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative group rounded-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-2xl opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
              <div className="relative rounded-2xl p-5 backdrop-blur-xl  hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <motion.div
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/20 via-white/0 to-white/20 opacity-0"
                  initial={{ opacity: 0, x: -100 }}
                  whileHover={{ opacity: 1, x: 100 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
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
                placeholder="Огноо сонгох"
                classNames={{
                  input:
                    "text-theme placeholder:text-theme !h-[40px] !py-2 !w-[380px]",
                }}
              />
              <TusgaiZagvar
                value={selectedDansId || ""}
                onChange={(v) => setSelectedDansId(v || undefined)}
                options={dansOptions}
                placeholder={t("Данс")}
                className="h-[40px] !w-[150px]"
                tone="theme"
              />
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsEbarimtOpen(true)}
                  className="btn-minimal"
                >
                  И-баримт
                </button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsZardalOpen(true)}
                  className="btn-minimal"
                >
                  Зардал
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

        <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
          <div className="overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="text-theme">
                  <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    Огноо
                  </th>

                  <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    Гүйлгээний утга
                  </th>
                  <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    Гүйлгээний дүн
                  </th>
                  <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    Шилжүүлсэн данс
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.id}
                      className="transition-colors border-b last:border-b-0"
                    >
                      <td className="p-3 text-center whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="p-3 truncate text-left">{item.action}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {formatNumber(item.total ?? 0, 0)} ₮
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {item.account || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg
                          className="w-16 h-16 text-slate-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="text-slate-500 font-medium">
                          Мэдээлэл байхгүй
                        </div>
                        <div className="text-slate-400 text-sm">
                          Шүүлтүүрийг өөрчилж үзнэ үү
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isEbarimtOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100]"
              onClick={() => setIsEbarimtOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2200] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1400px] max-h-[90vh] rounded-3xl shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 overflow-auto max-h-[calc(90vh-48px)]">
                <EbarimtPage />
              </div>
            </motion.div>
          </>
        </ModalPortal>
      )}

      {isZardalOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100]"
              onClick={() => setIsZardalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2200] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1400px] max-h-[90vh] rounded-3xl overflow-auto shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-slate-800">
                <div className="font-semibold">Зардал</div>
                <button
                  onClick={() => setIsZardalOpen(false)}
                  className="btn-minimal btn-cancel"
                >
                  Хаах
                </button>
              </div>
              <div className="p-2 overflow-auto max-h-[calc(90vh-48px)]">
                <ZardalPage />
              </div>
            </motion.div>
          </>
        </ModalPortal>
      )}
    </div>
  );
}
