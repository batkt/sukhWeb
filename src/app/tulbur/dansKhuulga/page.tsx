"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { createPortal } from "react-dom";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { motion } from "framer-motion";
import EbarimtPage from "../ebarimt/page";
import ZardalPage from "../zardal/page";
import { useAuth } from "@/lib/useAuth";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import useJagsaalt from "@/lib/useJagsaalt";
import uilchilgee, { url as API_URL } from "@/lib/uilchilgee";
import { message } from "antd";
import IconTextButton from "@/components/ui/IconTextButton";
import { Download, Upload, ChevronDown, FileSpreadsheet } from "lucide-react";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import { useBuilding } from "@/context/BuildingContext";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
// Using Mantine DatePickerInput with type="range" instead of Antd RangePicker
import matchesSearch from "@/tools/function/matchesSearch";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";

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
  const { searchTerm } = useSearch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [selectedDansId, setSelectedDansId] = useState<string | undefined>(
    undefined
  );
  const [filteredData, setFilteredData] = useState<TableItem[]>([]);
  const [isEbarimtOpen, setIsEbarimtOpen] = useState(false);
  const [isZardalOpen, setIsZardalOpen] = useState(false);
  const { token, ajiltan, barilgiinId } = useAuth();
  const ebarimtRef = useRef<HTMLDivElement | null>(null);
  const { selectedBuildingId } = useBuilding();
  const [isZaaltDropdownOpen, setIsZaaltDropdownOpen] = useState(false);
  const zaaltButtonRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load selectedDansId from URL on mount
  useEffect(() => {
    const dans = searchParams.get("dans");
    if (dans) {
      setSelectedDansId(dans);
    }
  }, [searchParams]);

  // Update URL when selectedDansId changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedDansId) {
      params.set("dans", selectedDansId);
    } else {
      params.delete("dans");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selectedDansId, searchParams, router]);

  useModalHotkeys({
    isOpen: isEbarimtOpen,
    onClose: () => setIsEbarimtOpen(false),
    container: ebarimtRef.current,
  });

  // Include only defined filters to avoid sending { baiguullagiinId: undefined }
  const orgQuery = useMemo(() => {
    const q: Record<string, any> = {};
    if (ajiltan?.baiguullagiinId) q.baiguullagiinId = ajiltan.baiguullagiinId;
    q.barilgiinId = selectedBuildingId || barilgiinId || null;
    return q;
  }, [ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId]);
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

  const exceleerTatya = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }
      if (!selectedDansId) {
        message.warning("Эхлээд данс сонгоно уу");
        return;
      }
      // Resolve selected account number (dugaar)
      const chosen = (() => {
        const byId = (dansList || []).find(
          (d: any) => String(d._id) === String(selectedDansId)
        );
        if (byId?.dugaar) return String(byId.dugaar);
        const byDugaar = (dansList || []).find(
          (d: any) => String(d.dugaar) === String(selectedDansId)
        );
        if (byDugaar?.dugaar) return String(byDugaar.dugaar);
        return String(selectedDansId);
      })();

      const [s, e] = ekhlekhOgnoo || [];
      const filters: Record<string, any> = {};
      if (s) filters.ekhlekhOgnoo = s;
      if (e) filters.duusakhOgnoo = e;
      if (chosen) filters.dansniiDugaar = chosen;

      const body = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: selectedBuildingId || barilgiinId || null,
        filters,
        historical: false,
        fileName: undefined as string | undefined,
      };

      const path = "/bankniiGuilgeeExcelDownload";
      const hide = message.loading({
        content: "Excel бэлдэж байна…",
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
      const cd = (resp.headers?.["content-disposition"] ||
        resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "bank_guilgee.xlsx";
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
      message.success("Excel татагдлаа");
    } catch (e) {
      console.error(e);
      message.error("Excel татахад алдаа гарлаа");
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
      form.append("excelFile", file);
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      if (selectedBuildingId || barilgiinId) {
        form.append("barilgiinId", selectedBuildingId || barilgiinId || "");
      }

      const endpoint = "/bankniiGuilgeeExcelImport";

      message.loading({ content: "Excel импорт хийж байна…", key: "import", duration: 0 });

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

  // Register guided tour for /tulbur/dansKhuulga
  const tourSteps = useMemo<DriverStep[]>(
    () => [
      {
        element: "#dans-date",
        popover: {
          title: "Огнооны шүүлтүүр",
          description: "Эндээс хугацааны интервал сонгож жагсаалтыг шүүдэг.",
        },
      },
      {
        element: "#dans-account",
        popover: {
          title: "Данс сонгох",
          description: "Данс сонгоход тухайн дансны гүйлгээ харагдана.",
        },
      },
      {
        element: "#ebarimt-btn",
        popover: {
          title: "И-баримт",
          description: "Энд дарж И-баримтын цонх нээнэ.",
        },
      },
      {
        element: "#dans-excel-btn",
        popover: {
          title: "Excel татах",
          description: "Жагсаалтыг Excel файл хэлбэрээр татна.",
        },
      },
      {
        element: "#dans-table",
        popover: {
          title: "Жагсаалт",
          description: "Сонгосон дансны гүйлгээ энд харагдана.",
        },
      },
      {
        element: "#dans-pagination",
        popover: {
          title: "Хуудаслалт",
          description: "Эндээс хуудсуудын хооронд шилжинэ.",
        },
      },
    ],
    []
  );
  useRegisterTourSteps("/tulbur/dansKhuulga", tourSteps);

  useEffect(() => {
    const fetchBankTransfers = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      setIsLoadingBankRows(true);
      try {
        const resp = await uilchilgee(token).get("/bankniiGuilgee", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: selectedBuildingId || barilgiinId || null,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 20000,
          },
        });
        const list = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
          ? resp.data
          : [];
        setBankRows(list);
      } catch (e) {
        openErrorOverlay(getErrorMessage(e));
      } finally {
        setIsLoadingBankRows(false);
      }
    };

    fetchBankTransfers();
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId]);

  // Map bankRows to table items and apply filters (date range + selected account)
  useEffect(() => {
    const toDate = (val: any) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };
    // If no account (данс) selected, don't show any bank rows
    if (!selectedDansId) {
      setFilteredData([]);
      return;
    }

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
      // bank API uses `dansniiDugaar` or `accNum`/`dugaar` depending on source
      const account = String(
        r.dansniiDugaar || r.accNum || r.dugaar || r.accountId || ""
      );
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
    // Resolve selectedDansId (may be _id) to the actual account number (dugaar)
    const selectedAccount = (() => {
      if (!selectedDansId) return undefined;
      // try to find by _id first
      const byId = (dansList || []).find(
        (d: any) => String(d._id) === String(selectedDansId)
      );
      if (byId && byId.dugaar) return String(byId.dugaar);
      // fallback: maybe the option stored dugaar directly
      const byDugaar = (dansList || []).find(
        (d: any) => String(d.dugaar) === String(selectedDansId)
      );
      if (byDugaar && byDugaar.dugaar) return String(byDugaar.dugaar);
      return String(selectedDansId);
    })();

    const filtered = mapped.filter((m) => {
      // account filter: compare the normalized account string on the mapped item
      if (
        selectedAccount &&
        String(m.account || "") !== String(selectedAccount)
      )
        return false;
      if (start || end) {
        const raw = m.raw || {};
        // use the same date fields we used when mapping rows
        const dateVal =
          raw.postDate ||
          raw.tranDate ||
          raw.ognoo ||
          raw.createdAt ||
          raw.date ||
          raw.togtoo ||
          null;
        if (!dateVal) return false;
        const d = new Date(dateVal);
        if (start && d < start) return false;
        if (end && d > end) return false;
      }
      // global search filtering
      if (searchTerm && !matchesSearch(m, searchTerm)) return false;
      return true;
    });

    setFilteredData(filtered as TableItem[]);
  }, [bankRows, selectedDansId, ekhlekhOgnoo, searchTerm]);

  // Dashboard statistics derived from filteredData for admin
  const stats = useMemo(() => {
    const totalCount = filteredData.length;
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
      // Total transactions
      { title: "Нийт", value: totalCount },
      // Unspecified / no contract
      { title: "Тодорхойгүй", value: withoutContracts },
      // Linked to contract
      { title: "Гэрээ холбогдсон", value: withContracts },
      // Number of unique accounts involved (could represent potential leads)
      { title: "Магадлалтай", value: uniqueAccounts },
    ];
  }, [filteredData]);

  // Calculate total sum for the footer
  const totalSum = useMemo(() => {
    return filteredData.reduce((s, r) => s + (r.total || 0), 0);
  }, [filteredData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const paginated = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-3 mb-4">
        {/* <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-3xl font-bold text-theme"
        >
          Дансны хуулга
        </motion.h1> */}
        {/* <div style={{ width: 100, height: 100 }} className="flex items-center">
          <DotLottieReact
            src="https://lottie.host/2fd97978-2462-4da6-ae45-e16cff8aa0e2/WS8rp6nk36.lottie"
            loop
            autoplay
            style={{ width: "%", height: "100%" }}
          />
        </div> */}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative group rounded-2xl neu-panel"
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
                <div className="text-3xl font-bold mb-1  bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-theme">
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
              <div id="dans-account">
                <TusgaiZagvar
                  value={selectedDansId || ""}
                  onChange={(v) => setSelectedDansId(v || undefined)}
                  options={dansOptions}
                  placeholder={t("Данс")}
                  className="h-[40px] !w-[150px]"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
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
                  id="ebarimt-btn"
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
                {/* <button
                  onClick={() => setIsZardalOpen(true)}
                  className="btn-minimal"
                >
                  Зардал
                </button> */}
              </motion.div>
            </div>
          </div>
        </div>

        <div className="table-surface overflow-hidden rounded-2xl w-full">
          <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
            <div
              className="max-h-[40vh] overflow-y-auto custom-scrollbar w-full"
              id="dans-table"
            >
              <table className="table-ui text-sm min-w-full">
                <thead>
                  <tr className="text-theme">
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      №
                    </th>
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Огноо
                    </th>

                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Гүйлгээний утга
                    </th>
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Гүйлгээний дүн
                    </th>
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Шилжүүлсэн данс
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    paginated.map((item, index) => (
                      <tr
                        key={item.id}
                        className="transition-colors border-b last:border-b-0"
                      >
                        <td className="p-1 text-center whitespace-nowrap">
                          {(page - 1) * rowsPerPage + index + 1}
                        </td>
                        <td className="p-1 text-center whitespace-nowrap">
                          {item.date}
                        </td>

                        <td className="p-1 truncate text-center">
                          {item.action}
                        </td>
                        <td className="p-1 !text-right whitespace-nowrap">
                          {formatNumber(item.total ?? 0, 0)} ₮
                        </td>
                        <td className="p-1 text-center whitespace-nowrap">
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
                            Хайсан мэдээлэл алга байна
                          </div>
                        </div>
                      </td>
                    </tr>
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

                    <td className="p-1 text-theme"></td>
                    <td className="p-1 !text-right font-bold text-theme whitespace-nowrap">
                      Нийт дүн: {formatNumber(totalSum, 0)} ₮
                    </td>
                    <td className="p-1 text-theme"></td>

                    <td className="p-1 text-theme"></td>
                    <td className="p-1 text-theme"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between w-full px-2 py-1 gap-3 text-xs">
            <div className="text-theme/70">Нийт: {filteredData.length}</div>

            <div className="flex items-center gap-3">
              <span id="dans-page-size">
                <PageSongokh
                  value={rowsPerPage}
                  onChange={(v) => {
                    setRowsPerPage(v);
                    setPage(1);
                  }}
                  className="text-xs px-2 py-1"
                />
              </span>

              <div id="dans-pagination" className="flex items-center gap-1">
                <button
                  className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Өмнөх
                </button>
                <div className="text-theme/70 px-1">{page}</div>
                <button
                  className="btn-minimal btn-minimal-sm px-2 py-1 text-xs"
                  disabled={page * rowsPerPage >= filteredData.length}
                  onClick={() => setPage(page + 1)}
                >
                  Дараах
                </button>
              </div>
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
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2100]"
                onClick={() => setIsEbarimtOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 z-[2200] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1800px] h-[95vh] max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto modal-surface"
                onClick={(e) => e.stopPropagation()}
                ref={ebarimtRef}
                role="dialog"
                aria-modal="true"
              >
                <button
                  onClick={() => setIsEbarimtOpen(false)}
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
                  {/* Ensure the embedded page can scroll within the modal instead of bubbling to body */}
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
                className="fixed left-1/2 top-1/2 z-[2200] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1400px] max-h-[90vh] rounded-3xl overflow-auto shadow-2xl modal-surface modal-responsive"
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
    </div>
  );
}
