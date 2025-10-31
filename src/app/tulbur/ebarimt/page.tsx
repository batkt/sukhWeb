"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Loader } from "@mantine/core";
import TusgaiZagvar from "components/selectZagvar/tusgaiZagvar";
import { DatePickerInput } from "@mantine/dates";
import moment from "moment";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "../../../../lib/uilchilgee";
import useBaiguullaga from "@/lib/useBaiguullaga";
import formatNumber from "../../../../tools/function/formatNumber";

type TableItem = {
  id?: string | number;
  receiptId?: string;
  ddtd?: string;
  date?: string;
  month?: string;
  total?: number;
  gereeniiDugaar?: string;
  totalVAT?: number;
  totalCityTax?: number;
  type?: string;
  payStatus?: string;
  payCode?: string;
  service?: string;
  [key: string]: any;
};

export default function Ebarimt() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<
    [Date | null, Date | null] | null
  >(null);
  const [uilchilgeeAvi, setUilchilgeeAvi] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);

  const merchantTin = useMemo(() => {
    // Prefer selected building; fallback to sole building; then org-level tokhirgoo
    const list = (baiguullaga as any)?.barilguud || [];
    const matched = barilgiinId
      ? list.find((b: any) => String(b?._id) === String(barilgiinId))
      : null;
    const fallback = !matched && list.length === 1 ? list[0] : null;
    return (
      matched?.tokhirgoo?.merchantTin ||
      fallback?.tokhirgoo?.merchantTin ||
      (baiguullaga as any)?.tokhirgoo?.merchantTin ||
      ""
    );
  }, [baiguullaga, barilgiinId]);

  const districtCode = useMemo(() => {
    const list = (baiguullaga as any)?.barilguud || [];
    const matched = barilgiinId
      ? list.find((b: any) => String(b?._id) === String(barilgiinId))
      : null;
    const fallback = !matched && list.length === 1 ? list[0] : null;
    return (
      matched?.tokhirgoo?.districtCode ||
      fallback?.tokhirgoo?.districtCode ||
      (baiguullaga as any)?.tokhirgoo?.districtCode ||
      ""
    );
  }, [baiguullaga, barilgiinId]);

  // Normalize any date-like input to ISO string safely
  const toISO = (x: any): string | null => {
    if (!x) return null;
    try {
      const d = x instanceof Date ? x : new Date(x);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch (_e) {
      return null;
    }
  };

  const swrKey = useMemo(() => {
    const [s, e] = ekhlekhOgnoo || [];
    const orgId = ajiltan?.baiguullagiinId || null;
    const isExternal = !!merchantTin && !!districtCode;
    if (isExternal) {
      return [
        "ext",
        token || "",
        "http://103.143.40.46:8084/ebarimtJagsaaltAvya",
        merchantTin,
        districtCode,
        toISO(s),
        toISO(e),
        uilchilgeeAvi || null,
      ];
    }
    if (!token || !orgId) return null;
    return [
      "int",
      token,
      "/ebarimtJagsaaltAvya",
      orgId,
      barilgiinId || null,
      toISO(s),
      toISO(e),
      uilchilgeeAvi || null,
    ];
  }, [
    merchantTin,
    districtCode,
    ekhlekhOgnoo,
    uilchilgeeAvi,
    ajiltan?.baiguullagiinId,
    barilgiinId,
    token,
  ]);

  const { data, isLoading } = useSWR(
    swrKey,
    async (args: any[]) => {
      const mode = args?.[0];
      if (mode === "ext") {
        const [, tkn, url, tin, dCode, s, e, service] = args as [
          string,
          string,
          string,
          string,
          string,
          string | null,
          string | null,
          string | null
        ];
        const resp = await uilchilgee(tkn).get(url, {
          baseURL: undefined,
          params: {
            merchantTin: tin,
            districtCode: dCode,
            ...(s || e ? { ekhlekhOgnoo: s, duusakhOgnoo: e } : {}),
            ...(service ? { uilchilgee: service } : {}),
          },
        });
        return resp.data;
      }
      // internal fallback via our API
      const [, tkn, url, orgId, branch, s, e, service] = args as [
        string,
        string,
        string,
        string,
        string | null,
        string | null,
        string | null,
        string | null
      ];
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          ...(branch ? { barilgiinId: branch } : {}),
          ...(s || e ? { query: { ekhlekhOgnoo: s, duusakhOgnoo: e } } : {}),
          ...(service ? { uilchilgee: service } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const tableData: TableItem[] = useMemo(() => {
    const container: any = data ?? {};
    const raw = Array.isArray(container?.jagsaalt)
      ? container.jagsaalt
      : Array.isArray(container?.data)
      ? container.data
      : Array.isArray(container?.items)
      ? container.items
      : Array.isArray(container?.result)
      ? container.result
      : Array.isArray(data)
      ? (data as any[])
      : [];
    return raw.map((it: any, idx: number) => {
      const rec = Array.isArray(it?.receipts) ? it.receipts[0] : undefined;
      const item0 = Array.isArray(rec?.items) ? rec.items[0] : undefined;
      const pay = Array.isArray(it?.payments) ? it.payments[0] : undefined;
      const dstr = it?.ognoo || it?.date || it?.dateOgnoo || it?.createdAt;
      const d = dstr ? new Date(dstr) : null;
      return {
        id: it?._id || idx + 1,
        receiptId: String(it?.id || it?.receiptId || ""),
        ddtd:
          String(
            it?.ddtd ||
              rec?.ddtd ||
              it?.barimtDugaar ||
              it?.dugaar ||
              rec?.lottery ||
              it?.lottery ||
              it?.lotteryId ||
              ""
          ) || undefined,
        date: d ? moment(d).format("YYYY-MM-DD HH:mm") : "",
        month: moment(d || undefined).format("MM"),
        total: Number(it?.totalAmount ?? rec?.totalAmount ?? it?.total ?? 0),
        totalVAT: Number(it?.totalVAT ?? rec?.totalVAT ?? 0),
        totalCityTax: Number(it?.totalCityTax ?? rec?.totalCityTax ?? 0),
        type: it?.type,
        payStatus: pay?.status || "",
        payCode: pay?.code || "",
        service: item0?.name || it?.uilchilgee || it?.service || "-",
        ...it,
      } as TableItem;
    });
  }, [data]);

  const eBarimtMedeelel = { extraInfo: { lastSentDate: new Date() } };

  const exceleerTatya = () => alert("Excel татах товч дарлаа!");
  const ebarimtIlgeeye = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };
  const t = (text: string) => text;

  // Scoped light overrides: ignore global theme and ensure readability on white
  const LocalStyles = () => (
    <style jsx global>{`
      .no-theme-scope {
        --panel-text: #0f172a;
        --btn-text: #0f172a;
        --btn-bg: #ffffff;
        --btn-bg-hover: #f8fafc;
        --btn-bg-active: #f1f5f9;
        --btn-border: rgba(15, 23, 42, 0.12);
        --surface-bg: #ffffff;
        --surface-border: rgba(15, 23, 42, 0.12);
        color: #0f172a !important;
        background: #ffffff !important;
      }
      .no-theme-scope *,
      .no-theme-scope
        :where(th, td, p, span, div, button, input, select, label) {
        color: #0f172a !important;
      }
      /* AntD inputs */
      .no-theme-scope .ant-picker,
      .no-theme-scope .ant-select-selector {
        background: #ffffff !important;
        color: #0f172a !important;
        border-color: #e5e7eb !important;
      }
      .no-theme-scope .ant-picker:hover,
      .no-theme-scope .ant-picker-focused,
      .no-theme-scope .ant-select-selector:hover,
      .no-theme-scope .ant-select-focused .ant-select-selector {
        border-color: #bfdbfe !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
      }
      .no-theme-scope .ant-picker-input > input,
      .no-theme-scope .ant-picker input,
      .no-theme-scope .ant-select-selection-item,
      .no-theme-scope .ant-select-selection-search-input {
        color: #0f172a !important;
      }
      .no-theme-scope .ant-picker-input > input::placeholder,
      .no-theme-scope .ant-picker input::placeholder,
      .no-theme-scope .ant-select-selection-placeholder {
        color: rgba(15, 23, 42, 0.6) !important;
      }
      .no-theme-scope .ant-select-arrow {
        color: #0f172a !important;
      }

      /* Overlays in body: force light while this component is mounted */
      body.force-light-dropdown .ant-select-dropdown,
      body.force-light-dropdown .ant-dropdown .ant-dropdown-menu,
      body.force-light-dropdown .ant-picker-dropdown {
        background: #ffffff !important;
        color: #0f172a !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.75rem !important;
        z-index: 2200 !important;
      }
      body.force-light-dropdown .ant-select-item,
      body.force-light-dropdown .ant-dropdown-menu-item,
      body.force-light-dropdown .ant-dropdown-menu-submenu-title {
        color: #0f172a !important;
      }
      body.force-light-dropdown .ant-select-item-option-active {
        background: #f1f5f9 !important;
      }
      body.force-light-dropdown .ant-select-item-option-selected {
        background: #e5effe !important;
        color: #0b3868 !important;
      }
    `}</style>
  );

  useEffect(() => {
    document.body.classList.add("force-light-dropdown");
    return () => {
      document.body.classList.remove("force-light-dropdown");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <LocalStyles />
      {/* Hidden title for modal context */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-theme bg-clip-text text-transparent drop-shadow-sm hidden"
      >
        И-Баримт
      </motion.h1>

      <div className="space-y-8">
        {/* Enhanced Dashboard with Borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          {(() => {
            const total = tableData.reduce((s, r) => s + (r.total || 0), 0);
            const vat = tableData.reduce((s, r) => s + (r.totalVAT || 0), 0);
            const city = tableData.reduce(
              (s, r) => s + (r.totalCityTax || 0),
              0
            );
            const paid = tableData.filter((r) => r.payStatus === "PAID").length;
            const unpaid = tableData.filter(
              (r) => r.payStatus !== "PAID"
            ).length;
            const b2c = tableData.filter(
              (r) => r.type === "B2C_RECEIPT"
            ).length;
            const stats = [
              { title: "Нийт баримт", value: tableData.length },
              { title: "Нийт дүн", value: total },
              { title: "НӨАТ", value: vat },
              { title: "Хотын татвар", value: city },
              { title: "Төлсөн", value: paid },
              { title: "Иргэн", value: b2c },
            ];
            return stats;
          })().map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative group rounded-3xl border border-white/30 shadow-lg overflow-hidden"
              whileHover={{ scale: 1.08, rotateY: 5 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500" />
              <div className="relative rounded-3xl p-6 backdrop-blur-xl bg-white/80 hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20">
                <motion.div
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/30 via-white/10 to-white/30 opacity-0"
                  initial={{ opacity: 0, x: -100 }}
                  whileHover={{ opacity: 1, x: 100 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString("mn-MN")
                    : String(stat.value)}
                </div>
                <div className="text-sm text-gray-600 font-medium leading-tight">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Section */}
        <motion.div
          className="rounded-3xl p-8 bg-white/90 backdrop-blur-xl shadow-xl border border-white/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <DatePickerInput
                type="range"
                locale="mn"
                value={ekhlekhOgnoo ?? undefined}
                onChange={(v) =>
                  setEkhlekhOgnoo(
                    (v || [null, null]) as [Date | null, Date | null]
                  )
                }
                size="md"
                radius="xl"
                variant="filled"
                clearable
                placeholder="Огноо сонгох"
                className="w-[450px]"
                classNames={{ input: "text-theme placeholder:text-theme h-12" }}
                popoverProps={{ zIndex: 2210 }}
              />
            </div>

            <div className="flex flex-row gap-4 w-full lg:w-auto justify-end">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={exceleerTatya}
                  className="btn-minimal px-6 py-3 rounded-xl"
                >
                  {t("Excel татах")}
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  title={t("Сүүлд илгээгдсэн огноо")}
                  className="btn-minimal px-6 py-3 rounded-xl"
                >
                  {moment(eBarimtMedeelel.extraInfo.lastSentDate).format(
                    "YYYY-MM-DD"
                  )}
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={ebarimtIlgeeye}
                  className="btn-minimal px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                >
                  {loading ? <Loader size="sm" /> : t("Татварт илгээх")}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Table */}
        <motion.div
          className="rounded-3xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-xl border border-white/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-8">
            <div className="max-h-[45vh] overflow-y-auto overflow-x-hidden custom-scrollbar w-full rounded-2xl border border-gray-100">
              <table className="table-ui text-sm min-w-full">
                <thead className="bg-white/95 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                  <tr>
                    <th className="p-4 text-xs font-bold text-theme text-center w-12 rounded-tl-2xl bg-white/95">
                      №
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Огноо
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Гэрээний дугаар
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Төрөл
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      ДДТД
                    </th>
                    <th className="py-4 px-6 text-right text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Дүн
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold text-theme whitespace-nowrap rounded-tr-2xl bg-white/95">
                      Үйлчилгээ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : tableData).length > 0 ? (
                    tableData.map((item, index) => (
                      <motion.tr
                        key={String(item.id)}
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="py-4 px-4 text-center font-medium">
                          {index + 1}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-gray-700">
                          {item.date}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-gray-700">
                          {item.gereeniiDugaar}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.type === "B2C_RECEIPT"
                                ? "bg-green-100 text-green-800"
                                : item.type === "B2B_RECEIPT"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.type === "B2C_RECEIPT"
                              ? "Иргэн"
                              : item.type === "B2B_RECEIPT"
                              ? "ААН"
                              : item.type || "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-gray-700 font-mono">
                          {item.ddtd || item.receiptId || "-"}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap font-bold text-gray-800">
                          {formatNumber(item.total ?? 0, 0)} ₮
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-gray-700">
                          {item.service}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <motion.div
                          className="flex flex-col items-center justify-center space-y-4"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear",
                            }}
                          >
                            <svg
                              className="w-20 h-20 text-gray-300"
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
                          </motion.div>
                          <div className="text-gray-500 font-semibold text-lg">
                            Хайсан мэдээлэл алга байна
                          </div>
                          <div className="text-gray-400 text-sm">
                            Шүүлтүүрийг өөрчилж үзнэ үү
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
