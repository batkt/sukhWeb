"use client";

import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "@/context/SearchContext";
import useSWR from "swr";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import NekhemjlekhPage from "../nekhemjlekh/page";
// import KhungulultPage from "../khungulult/page";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useGereeJagsaalt } from "@/lib/useGeree";
import uilchilgee from "@/lib/uilchilgee";
import { message } from "antd";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { set } from "lodash";
import IconTextButton from "@/components/ui/IconTextButton";
import { Download, Upload, ChevronDown, FileSpreadsheet } from "lucide-react";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import matchesSearch from "@/tools/function/matchesSearch";
import DatePickerInput from "@/components/ui/DatePickerInput";
import {
  getPaymentStatusLabel,
  isPaidLike,
  isUnpaidLike,
  isOverdueLike,
} from "@/lib/utils";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useBuilding } from "@/context/BuildingContext";

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
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;

  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [tuluvFilter, setTuluvFilter] = useState<
    "all" | "paid" | "unpaid" | "overdue"
  >("all");
  const [isNekhemjlekhOpen, setIsNekhemjlekhOpen] = useState(false);
  const [isKhungulultOpen, setIsKhungulultOpen] = useState(false);
  const nekhemjlekhRef = useRef<HTMLDivElement | null>(null);
  const khungulultRef = useRef<HTMLDivElement | null>(null);
  const [isZaaltDropdownOpen, setIsZaaltDropdownOpen] = useState(false);
  const zaaltButtonRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Paid history modal state
  // History modal removed; showing org-scoped list directly

  // Fetch org-scoped payment history
  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/nekhemjlekhiinTuukh",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId || null,
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
          khuudasniiKhemjee: 20000,
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
    effectiveBarilgiinId
  );
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    {},
    effectiveBarilgiinId
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

  // Ensure history is scoped to the selected building on the client too,
  // in case backend returns org-wide data.
  const buildingHistoryItems = useMemo(() => {
    const bid = String(effectiveBarilgiinId || "");
    if (!bid) return allHistoryItems;
    const toStr = (v: any) => (v == null ? "" : String(v));
    return allHistoryItems.filter((it: any) => {
      const itemBid = toStr(
        it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId
      );
      if (itemBid) return itemBid === bid;
      // Derive from linked contract or resident if barilgiinId absent
      const cId = toStr(
        it?.gereeId ??
          it?.gereeniiId ??
          it?.contractId ??
          it?.kholbosonGereeniiId
      );
      const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
      const c = cId ? (contractsById as any)[cId] : undefined;
      const r = rId ? (residentsById as any)[rId] : undefined;
      const cbid = toStr(
        c?.barilgiinId ?? c?.barilga ?? c?.barilgaId ?? c?.branchId
      );
      const rbid = toStr(
        r?.barilgiinId ?? r?.barilga ?? r?.barilgaId ?? r?.branchId
      );
      if (cbid) return cbid === bid;
      if (rbid) return rbid === bid;
      return false;
    });
  }, [allHistoryItems, effectiveBarilgiinId, contractsById, residentsById]);

  // Filter by paid/unpaid
  const filteredItems = useMemo(() => {
    return buildingHistoryItems.filter((it: any) => {
      const paid = isPaidLike(it);
      if (tuluvFilter === "paid") return paid;
      if (tuluvFilter === "unpaid")
        return isUnpaidLike(it) && !isOverdueLike(it);
      if (tuluvFilter === "overdue") return isOverdueLike(it);

      if (searchTerm) {
        if (!matchesSearch(it, searchTerm)) return false;
      }

      return true;
    });
  }, [buildingHistoryItems, tuluvFilter, searchTerm]);

  const totalSum = useMemo(() => {
    return filteredItems.reduce((s: number, it: any) => {
      const v = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
      return s + v;
    }, 0);
  }, [filteredItems]);

  const stats = useMemo(() => {
    const totalCount = filteredItems.length;
    const paidCount = filteredItems.filter((it: any) => isPaidLike(it)).length;
    const overdueCount = filteredItems.filter((it: any) =>
      isOverdueLike(it)
    ).length;
    const unpaidCount = filteredItems.filter(
      (it: any) => isUnpaidLike(it) && !isOverdueLike(it)
    ).length;

    return [
      { title: "Нийт гүйлгээ", value: totalCount },
      { title: "Төлсөн", value: paidCount },
      { title: "Хугацаа хэтэрсэн", value: overdueCount },
      { title: "Төлөөгүй", value: unpaidCount },
    ];
  }, [filteredItems]);

  const zaaltOruulakh = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const hide = message.loading({
        content: "Заалтын Excel файл бэлдэж байна…",
        duration: 0,
      });

      const response = await uilchilgee(token).post(
        "/zaaltExcelDataAvya",
        {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        },
        {
          responseType: "blob" as any,
        }
      );

      hide();

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Try to infer filename from headers or fallback
      const cd = (response.headers?.["content-disposition"] ||
        response.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "zaalt_data.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1]
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      message.success("Заалтын мэдээлэл амжилттай татагдлаа");
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      openErrorOverlay(errorMsg);
    }
  };

  const exceleerTatya = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const body = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: effectiveBarilgiinId || null,
      };

      const path = "/zaaltExcelTemplateAvya";
      const hide = message.loading({
        content: "Excel загвар бэлдэж байна…",
        duration: 0,
      });
      let resp: any;
      try {
        resp = await uilchilgee(token).post(path, body, {
          responseType: "blob" as any,
        });
      } catch (err: any) {
        if (err?.response?.status === 404 && typeof window !== "undefined") {
          resp = await uilchilgee(token).post(
            `${window.location.origin}${path}`,
            body,
            { responseType: "blob" as any, baseURL: undefined as any }
          );
        } else {
          throw err;
        }
      }
      hide();

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      // Try to infer filename from headers or fallback
      const cd = (resp.headers?.["content-disposition"] ||
        resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "zaalt_template.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1]
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success("Excel загвар татагдлаа");
    } catch (e) {
      console.error(e);
      message.error("Excel загвар татахад алдаа гарлаа");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        zaaltButtonRef.current &&
        !zaaltButtonRef.current.contains(event.target as Node)
      ) {
        setIsZaaltDropdownOpen(false);
      }
    };

    if (isZaaltDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isZaaltDropdownOpen]);

  // Excel Import handler
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      ".xlsx",
      ".xls",
    ];
    const isValidType =
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isValidType) {
      message.error("Зөвхөн Excel файл (.xlsx, .xls) оруулна уу");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const form = new FormData();
      form.append("file", file); // Field name must be "file" as expected by backend
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      if (effectiveBarilgiinId) {
        form.append("barilgiinId", effectiveBarilgiinId);
      }
      // Add ognoo (date) field - using current date in YYYY-MM-DD format
      const today = new Date();
      const ognoo = today.toISOString().split("T")[0]; // YYYY-MM-DD format
      form.append("ognoo", ognoo);

      const endpoint = "/zaaltExcelTatya";

      message.loading({
        content: "Excel импорт хийж байна…",
        key: "import",
        duration: 0,
      });

      const resp: any = await uilchilgee(token).post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy("import");

      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        const detailLines = failed.map(
          (f: any) => `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`
        );
        const details = detailLines.join("\n");
        const topMsg =
          data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        message.success("Excel импорт амжилттай");
        // Refresh the page data by reloading
        window.location.reload();
      }
    } catch (err: any) {
      message.destroy("import");
      const errorMsg = getErrorMessage(err);
      openErrorOverlay(errorMsg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

  // Register guided tour for /tulbur/guilgeeTuukh
  const tourSteps = useMemo<DriverStep[]>(
    () => [
      {
        element: "#guilgee-status-filter",
        popover: {
          title: "Төлөвийн шүүлтүүр",
          description:
            "Төлсөн, Төлөөгүй эсвэл Хугацаа хэтэрсэн гэх мэт төлөвөөр ялгана.",
        },
      },
      {
        element: "#guilgee-nekhemjlekh-btn",
        popover: {
          title: "Нэхэмжлэх",
          description: "Энд дарж нэхэмжлэхийн цонх нээнэ.",
        },
      },
      {
        element: "#guilgee-excel-btn",
        popover: {
          title: "Excel татах",
          description: "Жагсаалтыг Excel файл хэлбэрээр татна.",
        },
      },
      {
        element: "#guilgee-table",
        popover: {
          title: "Жагсаалт",
          description: "Гүйлгээний түүх энд харагдана.",
        },
      },
      {
        element: "#guilgee-pagination",
        popover: {
          title: "Хуудаслалт",
          description: "Эндээс хуудсуудын хооронд шилжинэ.",
        },
      },
    ],
    []
  );
  useRegisterTourSteps("/tulbur/guilgeeTuukh", tourSteps);

  return (
    <div className="min-h-screen">
      {/* <div className="flex items-center gap-3 mb-4">
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
      </div> */}

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
                  {stat.value}
                </div>
                <div className="text-xs text-theme leading-tight">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div id="dans-date">
                <DatePickerInput
                  type="range"
                  locale="mn"
                  value={ekhlekhOgnoo}
                  onChange={setEkhlekhOgnoo}
                  size="sm"
                  radius="md"
                  variant="filled"
                  dropdownType="popover"
                  popoverProps={{
                    position: "bottom-start",
                    withinPortal: true,
                    width: 320,
                  }}
                  clearable
                  placeholder="Огноо сонгох"
                  classNames={{
                    input:
                      "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-[220px]",
                  }}
                />
              </div>
              <div id="guilgee-status-filter">
                <TusgaiZagvar
                  value={tuluvFilter}
                  onChange={(v: string) =>
                    setTuluvFilter(v as "all" | "paid" | "unpaid" | "overdue")
                  }
                  options={[
                    { value: "all", label: "Бүгд" },
                    { value: "paid", label: "Төлсөн" },
                    { value: "overdue", label: "Хугацаа хэтэрсэн" },
                    { value: "unpaid", label: "Төлөөгүй" },
                  ]}
                  placeholder="Төлөв"
                  className="h-[40px] w-[160px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div ref={zaaltButtonRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsZaaltDropdownOpen(!isZaaltDropdownOpen)}
                  className="btn-minimal inline-flex items-center gap-2"
                  id="zaalt-btn"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-xs">Заалт</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isZaaltDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                {isZaaltDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Excel импорт</span>
                    </button>
                    <button
                      onClick={() => {
                        exceleerTatya();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Excel татах</span>
                    </button>
                    <button
                      onClick={() => {
                        zaaltOruulakh();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Заалт жагсаалт авах</span>
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleExcelImport}
                className="hidden"
              />
              <motion.div
                id="guilgee-excel-btn"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <IconTextButton
                  onClick={exceleerTatya}
                  icon={<Download className="w-5 h-5" />}
                  label={t("Excel татах")}
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  id="guilgee-nekhemjlekh-btn"
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
            </div>
          </div>
        </div>
        <div className="table-surface overflow-hidden rounded-2xl w-full">
          <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
            <div
              className="max-h-[40vh] overflow-y-auto custom-scrollbar w-full"
              id="guilgee-table"
            >
              <table className="table-ui text-sm min-w-full">
                <thead>
                  <tr>
                    <th className="  z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      №
                    </th>
                    <th className="   z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Нэр
                    </th>
                    <th className="  z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Гэрээний дугаар
                    </th>

                    {/* <th className="   z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Хаяг
                    </th> */}
                    <th className="  z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Төлбөр
                    </th>

                    <th className="   z-10 p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
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
                            Хайсан мэдээлэл алга байна
                          </div>
                        </div>
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
                      const tuluvLabel = getPaymentStatusLabel(it);
                      const isPaid = tuluvLabel === "Төлсөн";
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
                          <td className="p-1 !text-left text-theme whitespace-nowrap">
                            {ner}
                          </td>
                          <td className="p-1 text-center text-theme whitespace-nowrap">
                            {dugaar}
                          </td>

                          {/* <td className="p-3 text-center text-theme whitespace-nowrap">
                            {khayag}
                          </td> */}
                          <td className="p-1 !text-right text-theme whitespace-nowrap">
                            {formatNumber(total)} ₮
                          </td>
                          <td className="p-1 text-center text-theme whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={
                                  "px-2 py-0.5 rounded-full text-xs font-medium " +
                                  (isPaid
                                    ? "badge-paid"
                                    : tuluvLabel === "Төлөөгүй" ||
                                      tuluvLabel === "Хугацаа хэтэрсэн"
                                    ? "badge-unpaid"
                                    : "badge-neutral")
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
            <div className="border-t dark:border-gray-800 border-gray-100">
              {/* Render a single-row table footer so the total aligns under the "Төлбөр" (payment) column */}
              <table className="text-sm min-w-full">
                <tbody>
                  <tr>
                    <td className="p-1 text-center text-theme whitespace-nowrap w-12"></td>
                    <td className="p-1 !text-right font-bold text-theme whitespace-nowrap">
                      Нийт дүн: {formatNumber(totalSum, 0)} ₮
                    </td>
                    <td className="p-1 text-center text-theme whitespace-nowrap w-12"></td>

                    <td className="p-1 text-center text-theme whitespace-nowrap w-12"></td>

                    <td className="p-1 text-center text-theme whitespace-nowrap w-12"></td>

                    <td className="p-1 text-theme"></td>

                    <td className="p-1 text-theme"></td>

                    <td className="p-1 text-theme"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full px-2 gap-3 text-md">
            <div className="text-theme/70">Нийт: {filteredItems.length}</div>

            <div className="flex items-center gap-3">
              <span id="guilgee-page-size">
                <PageSongokh
                  value={rowsPerPage}
                  onChange={(v) => {
                    setRowsPerPage(v);
                    setPage(1);
                  }}
                  className="text-xs px-2 py-1"
                />
              </span>

              <div id="guilgee-pagination" className="flex items-center gap-1">
                <button
                  className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Өмнөх
                </button>
                <div className="text-theme/70 px-1">{page}</div>
                <button
                  className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
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
              className="fixed left-1/2 top-1/2 z-[2200] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1800px] h-[98vh] max-h-[98vh] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto modal-surface"
              onClick={(e) => e.stopPropagation()}
              ref={nekhemjlekhRef}
              role="dialog"
              aria-modal="true"
            >
              <button
                onClick={() => setIsNekhemjlekhOpen(false)}
                className="absolute top-2 right-4 hover:bg-gray-100 rounded-2xl transition-colors z-[2300]"
                aria-label="Хаах"
                title="Хаах"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-slate-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
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
              {/* <div className="p-2 overflow-auto max-h-[calc(90vh-48px)] ">
                <KhungulultPage />
              </div> */}
            </motion.div>
          </>
        </ModalPortal>
      )}

      {/* Per-resident history modal removed */}
    </div>
  );
}
