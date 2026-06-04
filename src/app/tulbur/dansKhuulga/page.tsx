"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, TextInput, Loader } from "@mantine/core";
import toast from "react-hot-toast";
import moment from "moment";
import { CloseCircleOutlined } from "@ant-design/icons";
import Button from "@/components/ui/Button";
import { useSocket } from "@/context/SocketContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { useAuth } from "@/lib/useAuth";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import useJagsaalt from "@/lib/useJagsaalt";
import uilchilgee from "@/lib/uilchilgee";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import { useBuilding } from "@/context/BuildingContext";
import matchesSearch from "@/tools/function/matchesSearch";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import TulburLayout from "../TulburLayout";
import { DansKhuulgaTable } from "./DansKhuulgaTable";
import { StandardPagination } from "@/components/ui/StandardTable";

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

import { hasPermission } from "@/lib/permissionUtils";

export default function DansniiKhuulga() {
  const { searchTerm } = useSearch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, ajiltan, barilgiinId } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    if (ajiltan) {
      if (!hasPermission(ajiltan, "/tulbur/dansKhuulga")) {
        router.push("/tulbur");
      }
    }
  }, [ajiltan, router]);

  const [isFetchingStatement, setIsFetchingStatement] = useState(false);
  const [uldegdel, setUldegdel] = useState<number | null>(null);
  const [isLoadingUldegdel, setIsLoadingUldegdel] = useState(false);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return [today, today];
  });
  const [selectedDansId, setSelectedDansId] = useState<string | undefined>(
    undefined,
  );
  const [filteredData, setFilteredData] = useState<TableItem[]>([]);

  // States for transaction linking (гүйлгээ холбох)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedGuilgee, setSelectedGuilgee] = useState<TableItem | null>(null);
  const [searchContractQuery, setSearchContractQuery] = useState("");
  const [contractsList, setContractsList] = useState<any[]>([]);
  const [isSearchingContracts, setIsSearchingContracts] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { selectedBuildingId } = useBuilding();

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
    router.replace(`/tulbur/dansKhuulga?${params.toString()}`, {
      scroll: false,
    });
  }, [selectedDansId, router]);

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
    [dansList],
  );

  // Auto-select first dans when list loads and nothing is selected
  useEffect(() => {
    if (!selectedDansId && dansList && dansList.length > 0) {
      setSelectedDansId(String(dansList[0]._id || dansList[0].dugaar || ""));
    }
  }, [dansList]);

  const t = (text: string) => text;

  const [bankRows, setBankRows] = useState<any[]>([]);
  const [isLoadingBankRows, setIsLoadingBankRows] = useState(false);

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
    [],
  );
  useRegisterTourSteps("/tulbur/dansKhuulga", tourSteps);

  // Fetch account balance via CGW
  useEffect(() => {
    const fetchUldegdel = async () => {
      if (!token || !selectedDansId) {
        setUldegdel(null);
        return;
      }
      const selectedDans = (dansList || []).find(
        (d: any) => String(d._id) === String(selectedDansId) || String(d.dugaar) === String(selectedDansId),
      );
      if (!selectedDans) return;
      setIsLoadingUldegdel(true);
      try {
        const resp = await uilchilgee(token).post("/dansniiUldegdelAvya", {
          dansniiDugaar: selectedDans.dugaar,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
        });
        setUldegdel(resp.data?.uldegdel ?? null);
      } catch {
        setUldegdel(null);
      } finally {
        setIsLoadingUldegdel(false);
      }
    };
    fetchUldegdel();
  }, [token, selectedDansId, dansList, ajiltan?.tukhainBaaziinKholbolt]);

  const handleKhuulgaTatakh = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    setIsFetchingStatement(true);
    try {
      const body: Record<string, any> = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: selectedBuildingId || barilgiinId || null,
        tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
      };
      if (selectedDansId) {
        const selectedDans = (dansList || []).find(
          (d: any) => String(d._id) === String(selectedDansId) || String(d.dugaar) === String(selectedDansId),
        );
        if (selectedDans?.dugaar) body.dansniiDugaar = selectedDans.dugaar;
      }
      if (ekhlekhOgnoo?.[0]) body.ognoo = ekhlekhOgnoo[0];
      await uilchilgee(token).post("/bankniiKhuulgaTatajKhadgalya", body);
      await uilchilgee(token).post("/tulultTaniya", {
        baiguullagiinId: ajiltan.baiguullagiinId,
        tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
      }).catch(() => {});
      await fetchBankTransfers();
    } catch (e) {
      openErrorOverlay(getErrorMessage(e));
    } finally {
      setIsFetchingStatement(false);
    }
  };

  // Resolve selectedDansId → { dugaar, bank }
  const selectedDans = useMemo(() => {
    if (!selectedDansId) return null;
    const byId = (dansList || []).find((d: any) => String(d._id) === String(selectedDansId));
    if (byId?.dugaar) return byId;
    const byDugaar = (dansList || []).find((d: any) => String(d.dugaar) === String(selectedDansId));
    if (byDugaar?.dugaar) return byDugaar;
    return null;
  }, [selectedDansId, dansList]);
  const selectedDugaar = selectedDans?.dugaar ? String(selectedDans.dugaar) : null;

  // Fetch only when a dans is selected — server-side filter by dansniiDugaar
  const fetchBankTransfers = useCallback(async () => {
    if (!token || !ajiltan?.baiguullagiinId || !selectedDugaar) {
      setBankRows([]);
      return;
    }
    setIsLoadingBankRows(true);
    try {
      const resp = await uilchilgee(token).get("/bankniiGuilgee", {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          dansniiDugaar: selectedDugaar,
          ...(selectedDans?.bank ? { bank: selectedDans.bank } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
          order: { createdAt: -1 },
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
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId, selectedDugaar, selectedDans?.bank]);

  useEffect(() => { fetchBankTransfers(); }, [fetchBankTransfers]);

  // Real-time: refetch when backend emits bankniiGuilgeeShine for this org
  useEffect(() => {
    if (!socket || !ajiltan?.baiguullagiinId) return;
    const event = "baiguullagiin" + ajiltan.baiguullagiinId;
    const handler = (data: any) => {
      if (data?.turul === "bankniiGuilgeeShine") fetchBankTransfers();
    };
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, ajiltan?.baiguullagiinId, fetchBankTransfers]);

  // Contract search for linking
  const performContractSearch = useCallback(async (searchVal: string) => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    setIsSearchingContracts(true);
    try {
      const queryObj: any = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: selectedBuildingId || barilgiinId || null,
      };
      if (searchVal.trim()) {
        queryObj.$or = [
          { ner: { $regex: searchVal.trim(), $options: "i" } },
          { gereeniiDugaar: { $regex: searchVal.trim(), $options: "i" } },
          { register: { $regex: searchVal.trim(), $options: "i" } },
          { toot: { $regex: searchVal.trim(), $options: "i" } },
        ];
      }
      const resp = await uilchilgee(token).get("/geree", {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 30,
          query: JSON.stringify(queryObj),
        },
      });
      const list = resp.data?.jagsaalt || resp.data?.list || resp.data || [];
      setContractsList(list);
    } catch (err) {
      console.error(err);
      toast.error("Гэрээ хайхад алдаа гарлаа");
    } finally {
      setIsSearchingContracts(false);
    }
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId]);

  // Debounced search trigger when modal is open and search query changes
  useEffect(() => {
    if (isLinkModalOpen) {
      const delayDebounce = setTimeout(() => {
        performContractSearch(searchContractQuery);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchContractQuery, isLinkModalOpen, performContractSearch]);

  const handleOpenLinkModal = useCallback((item: TableItem) => {
    setSelectedGuilgee(item);
    setIsLinkModalOpen(true);
    setSearchContractQuery("");
    setContractsList([]);
    setSelectedContract(null);
  }, []);

  const handleLinkTransaction = useCallback(async (gereeId: string) => {
    if (!token || !ajiltan || !selectedGuilgee) return;

    const loadingToast = toast.loading("Гүйлгээг гэрээнд холбож байна...");
    try {
      const resp = await uilchilgee(token).post("/guilgeeKholbyo", {
        bankniiGuilgeeId: selectedGuilgee.id,
        gereeniiId: gereeId,
        tukhainBaaziinKholbolt: ajiltan.tukhainBaaziinKholbolt,
      });
      if (resp.data?.success) {
        toast.success("Гүйлгээ амжилттай холбогдлоо", { id: loadingToast });
        setIsLinkModalOpen(false);
        setSelectedGuilgee(null);
        setSelectedContract(null);
        fetchBankTransfers();
      } else {
        toast.error(resp.data?.message || resp.data?.error || "Алдаа гарлаа", { id: loadingToast });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(getErrorMessage(e) || "Алдаа гарлаа", { id: loadingToast });
    }
  }, [token, ajiltan, selectedGuilgee, fetchBankTransfers]);

  const handleUnlinkTransaction = useCallback((item: TableItem) => {
    toast.success("Гүйлгээ холбогдсон байна");
  }, []);

  // Map + client-side date/search filter (on the small per-account result set)
  useEffect(() => {
    if (!selectedDugaar) { setFilteredData([]); return; }
    const toLocalDate = (val: any): Date | null => {
      if (!val) return null;
      if (typeof val === "string") {
        const parts = val.slice(0, 10).split("-");
        if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
      const d = new Date(val as any);
      return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    const startRaw = toLocalDate(ekhlekhOgnoo?.[0]);
    const start = startRaw ? new Date(startRaw.getFullYear(), startRaw.getMonth(), startRaw.getDate(), 0, 0, 0, 0) : null;
    const endRaw = toLocalDate(ekhlekhOgnoo?.[1]);
    const end = endRaw ? new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate(), 23, 59, 59, 999) : null;

    const mapped = (bankRows || []).filter((r: any) => r.bank !== "qpay").map((r: any, idx: number) => {
      const dateVal = r.postDate || r.tranDate || r.ognoo || r.createdAt || r.date || r.togtoo || null;
      const d = dateVal ? new Date(dateVal) : null;
      
      const pad = (n: number) => String(n).padStart(2, "0");
      let dateStr = d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "-";
      
      let timeStr = "";
      if (r.time) {
        const cleanTime = String(r.time).trim().replace(/[^0-9:]/g, "");
        if (cleanTime.includes(":")) {
          timeStr = cleanTime;
        } else if (cleanTime.length >= 6) {
          timeStr = `${cleanTime.slice(0, 2)}:${cleanTime.slice(2, 4)}:${cleanTime.slice(4, 6)}`;
        } else if (cleanTime.length === 4) {
          timeStr = `${cleanTime.slice(0, 2)}:${cleanTime.slice(2, 4)}`;
        } else {
          timeStr = cleanTime;
        }
      } else if (d) {
        const isUtcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
        if (!isUtcMidnight) {
          timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
      }
      
      const dateValFormatted = timeStr ? `${dateStr} ${timeStr}` : dateStr;

      return {
        id: r._id || `bank-${idx}`,
        date: dateValFormatted,
        month: d ? d.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit" }) : r.sar || "",
        total: Number(r.amount ?? r.Amt ?? r.tranAmount ?? r.income ?? r.kholbosonDun ?? 0) || 0,
        action: r.description || r.TxAddInf || r.tranDesc || r.txnDesc || r.ner || "Банкны гүйлгээ",
        contractIds: Array.isArray(r.kholbosonGereeniiId) ? r.kholbosonGereeniiId : r.kholbosonGereeniiId ? [String(r.kholbosonGereeniiId)] : [],
        account: String(r.relatedAccount || r.accNum || r.accVal || r.CtAcct || r.CtAcntOrg || r.dansniiDugaar || ""),
        raw: r,
      } as TableItem;
    });

    const getSortTime = (item: any) => {
      const dateVal = item.postDate || item.tranDate || item.ognoo || item.createdAt || item.date || item.togtoo || null;
      if (!dateVal) return 0;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 0;
      
      const isUtcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
      if (isUtcMidnight && item.time) {
        const cleanTime = String(item.time).trim();
        let h = 0, m = 0, s = 0;
        if (cleanTime.includes(":")) {
          const parts = cleanTime.split(":");
          h = parseInt(parts[0], 10) || 0;
          m = parseInt(parts[1], 10) || 0;
          s = parseInt(parts[2], 10) || 0;
        } else if (cleanTime.length === 6) {
          h = parseInt(cleanTime.slice(0, 2), 10) || 0;
          m = parseInt(cleanTime.slice(2, 4), 10) || 0;
          s = parseInt(cleanTime.slice(4, 6), 10) || 0;
        } else if (cleanTime.length === 4) {
          h = parseInt(cleanTime.slice(0, 2), 10) || 0;
          m = parseInt(cleanTime.slice(2, 4), 10) || 0;
        }
        d.setHours(h, m, s, 0);
      }
      return d.getTime();
    };

    // Sort descending by date/time/createdAt: latest first
    mapped.sort((a, b) => {
      const timeA = getSortTime(a.raw);
      const timeB = getSortTime(b.raw);
      if (timeA === timeB) {
        const recA = (a.raw as any).record;
        const recB = (b.raw as any).record;
        if (recA && recB) {
          const numA = Number(recA);
          const numB = Number(recB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numB - numA;
          }
        }
        const idA = String((a.raw as any)._id || "");
        const idB = String((b.raw as any)._id || "");
        return idB.localeCompare(idA);
      }
      return timeB - timeA;
    });

    const filtered = mapped.filter((m) => {
      if (start || end) {
        const dv = (m.raw as any)?.postDate || (m.raw as any)?.tranDate || (m.raw as any)?.ognoo || (m.raw as any)?.createdAt || null;
        if (!dv) return false;
        const d = new Date(dv);
        if (start && d < start) return false;
        if (end && d > end) return false;
      }
      if (searchTerm && !matchesSearch(m, searchTerm)) return false;
      return true;
    });
    setFilteredData(filtered);
  }, [bankRows, selectedDugaar, ekhlekhOgnoo, searchTerm]);

  // Dashboard statistics derived from filteredData for admin
  const stats = useMemo(() => {
    const totalCount = filteredData.length;
    const uniqueAccounts = new Set(
      filteredData.map((f) => String(f.account || "")).filter(Boolean),
    ).size;
    const withContracts = filteredData.filter(
      (f) => (f.contractIds?.length || 0) > 0,
    ).length;
    const withoutContracts = totalCount - withContracts;
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

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const paginated = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <TulburLayout activeTab="dansKhuulga">
      <div className="flex flex-col pb-14">
        <div className="flex items-center gap-3 mb-4">
          {/* <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-3xl  text-theme"
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
              <div
                key={idx}
                className="relative group rounded-[32px] neu-panel p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div
                  className={`text-3xl mb-1 text-theme ${stat.title === "Нийт" || stat.title === "Нийт дүн" ? "force-bold" : ""}`}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-widest text-theme opacity-60 ${stat.title === "Нийт" || stat.title === "Нийт дүн" ? "force-bold" : ""}`}
                >
                  {stat.title}
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 px-6 py-4 rounded-[32px] neu-panel shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
                <div id="dans-date" className="h-10 w-full sm:w-[320px]">
                  <StandardDatePicker
                    isRange={true}
                    value={ekhlekhOgnoo}
                    onChange={setEkhlekhOgnoo}
                    allowClear
                    placeholder="Огноо сонгох"
                    className="text-theme !px-3"
                  />
                </div>
                <div id="dans-account" className="h-10 w-full sm:w-[200px]">
                  <TusgaiZagvar
                    value={selectedDansId || ""}
                    onChange={(v) => setSelectedDansId(v || undefined)}
                    options={dansOptions}
                    placeholder={t("Данс")}
                    className="h-full w-full rounded-2xl !border-slate-200 dark:!border-slate-800 !bg-white/50 dark:!bg-slate-900/50 hover:!border-slate-300 dark:hover:!border-slate-700 transition-all font-inter"
                  />
                </div>
                {selectedDansId && (
                  <div className="flex items-center h-10 px-4 rounded-2xl neu-panel text-sm text-theme whitespace-nowrap">
                    {isLoadingUldegdel ? (
                      <span className="opacity-60">Үлдэгдэл...</span>
                    ) : uldegdel !== null ? (
                      <span>Үлдэгдэл: <strong>{formatNumber(uldegdel, 2)}₮</strong></span>
                    ) : (
                      <span className="opacity-60">Үлдэгдэл авах боломжгүй</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="table-surface rounded-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="p-1 allow-overflow no-scrollbar" id="dans-table">
              <DansKhuulgaTable
                data={paginated}
                loading={isLoadingBankRows}
                page={page}
                rowsPerPage={rowsPerPage}
                maxHeight="calc(100vh - 550px)"
                onLink={handleOpenLinkModal}
                onUnlink={handleUnlinkTransaction}
              />
            </div>
            <div id="dans-pagination">
              <StandardPagination
                current={page}
                total={filteredData.length}
                pageSize={rowsPerPage}
                onChange={setPage}
                onPageSizeChange={setRowsPerPage}
                pageSizeOptions={[50, 100, 500, 1000]}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        opened={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setSelectedGuilgee(null);
          setSelectedContract(null);
        }}
        title={null}
        size="xl"
        centered
        withCloseButton={false}
        classNames={{
          content: "dark:!bg-slate-900 dark:!text-white rounded-lg !p-6 border dark:border-slate-800",
          body: "!p-0 font-inter",
        }}
      >
        {selectedGuilgee && (
          <div className="flex w-full flex-col space-y-2 min-h-[500px] justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold dark:text-gray-100 lg:text-xl">
                  Гүйлгээний мэдээлэл
                </span>
                <span className="dark:text-gray-200 text-sm font-mono">
                  {moment().format("YYYY-MM-DD")}
                </span>
              </div>
              <div className="box grid w-full grid-cols-4 rounded-md border border-gray-400 bg-gray-100 p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-xs gap-1">
                <div className="col-span-4 lg:col-span-1 truncate font-mono">
                  {selectedGuilgee.account || selectedGuilgee.raw?.accNum || selectedGuilgee.raw?.CtAcct || "-"}
                </div>
                <div className="col-span-4 lg:col-span-1 truncate">
                  {selectedGuilgee.raw?.accName || selectedGuilgee.raw?.ner || selectedGuilgee.raw?.CtActnName || "-"}
                </div>
                <div className="col-span-2 text-center lg:col-span-1">
                  {selectedGuilgee.date.split(" ")[0]}
                </div>
                <div className="col-span-2 text-right text-red-600 dark:text-red-400 font-semibold lg:col-span-1">
                  {formatNumber(selectedGuilgee.total)}
                </div>
                <div className="col-span-4 mt-2">
                  <input
                    className="w-full rounded-md border border-gray-400 bg-gray-200/50 px-2 py-1 text-xs dark:bg-gray-750 dark:border-gray-700 dark:text-white"
                    value={selectedGuilgee.action}
                    disabled
                  />
                </div>
              </div>
              <div className="font-medium dark:text-gray-200 lg:text-xl pt-2">
                Гүйлгээ холбох
              </div>
              <div className="relative w-full">
                <input
                  autoComplete="off"
                  id="baiguullagaSongokh"
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full rounded-md border border-gray-400 p-1.5 px-3 text-sm text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Оршин суугч/Гэрээ сонгох"
                  value={searchContractQuery}
                  onChange={(e) => {
                    setSearchContractQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                />
                {showDropdown && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-1 shadow-lg dark:bg-gray-900 dark:border-gray-700 text-xs">
                    {isSearchingContracts ? (
                      <div className="p-3 text-center text-gray-500">Уншиж байна...</div>
                    ) : contractsList.length === 0 ? (
                      <div className="p-3 text-center text-gray-500">Үр дүн олдсонгүй</div>
                    ) : (
                      contractsList.map((geree: any) => (
                        <div
                          key={geree._id}
                          className="grid cursor-pointer grid-cols-3 gap-2 rounded-md border border-transparent p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-200"
                          onMouseDown={() => {
                            setSelectedContract(geree);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-semibold truncate">{geree.toot ? `${geree.toot} тоот` : "-"}</div>
                          <div className="truncate">{geree.ner || `${geree.ovog || ""} ${geree.ner || ""}`}</div>
                          <div className="truncate text-gray-500">{geree.gereeniiDugaar || "-"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 px-2 pt-2">
              {selectedContract && (
                <div className="space-y-2 rounded-md border border-gray-400 p-2 dark:border-gray-700">
                  <div className="flex w-full justify-between items-center text-sm font-medium dark:text-gray-200">
                    <span>
                      {selectedContract.toot ? `${selectedContract.toot} тоот` : "-"} -- {selectedContract.ner || `${selectedContract.ovog || ""} ${selectedContract.ner || ""}`} -- {selectedContract.gereeniiDugaar || "-"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedContract(null)}
                      className="h-8 w-8 p-1 text-lg text-red-500 hover:text-red-700 transition-colors"
                      title="Сонголт арилгах"
                    >
                      <CloseCircleOutlined />
                    </button>
                  </div>

                  {/* Төлбөрийн үлдэгдэл box */}
                  <div className="box grid w-full grid-cols-3 rounded-md border border-gray-400 bg-gray-100 p-2 dark:bg-gray-800 dark:border-gray-700 text-xs">
                    <div className="col-span-3 font-semibold mb-1">Төлбөрийн үлдэгдэл</div>
                    <div className="text-red-500 dark:text-red-400 font-medium">
                      {formatNumber(selectedContract.uldegdel || 0, 2)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {selectedContract.register || selectedContract.gereeniiDugaar || ""}
                    </div>
                    <div className="text-right text-green-600 dark:text-green-400">
                      <input
                        className="w-full rounded-md border border-gray-400 bg-gray-200 px-2 py-0.5 text-right dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Төлөх дүн"
                        value={formatNumber(selectedGuilgee.total)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-gray-300 dark:border-gray-700 my-3" />

              <div className="grid w-full grid-cols-2 divide-x-2 divide-gray-300 dark:divide-gray-700 px-2">
                <div className="flex flex-col justify-between pr-2 lg:flex-row text-xs">
                  <div className="dark:text-gray-200">Холбосон дүн:</div>
                  <div className="text-right text-base font-bold text-green-600 dark:text-green-400">
                    {formatNumber(selectedContract ? selectedGuilgee.total : 0)}
                  </div>
                </div>
                <div className="flex flex-col justify-between pl-2 lg:flex-row text-xs">
                  <div className="dark:text-gray-200">Холбоогүй дүн:</div>
                  <div className="text-right text-base font-bold text-red-600 dark:text-red-400">
                    {formatNumber(selectedContract ? 0 : selectedGuilgee.total)}
                  </div>
                </div>
              </div>

              <hr className="border-gray-300 dark:border-gray-700 my-3" />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setSelectedGuilgee(null);
                    setSelectedContract(null);
                  }}
                  variant="secondary"
                  className="rounded-md h-9 px-4 text-xs font-semibold"
                >
                  Хаах
                </Button>
                <Button
                  onClick={() => selectedContract && handleLinkTransaction(selectedContract._id)}
                  disabled={!selectedContract}
                  variant="primary"
                  className="rounded-md h-9 px-4 text-xs font-semibold"
                >
                  Хадгалах
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </TulburLayout>
  );
}
