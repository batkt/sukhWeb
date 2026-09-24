"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, FileDown, FileUp } from "lucide-react";
import ExcelButton from "@/components/ui/ExcelButton";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
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
import TusgaiZagvar from "../../../../../components/selectZagvar/tusgaiZagvar";
import useJagsaalt from "@/lib/useJagsaalt";
import uilchilgee from "@/lib/uilchilgee";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import formatNumber from "../../../../../tools/function/formatNumber";
import { useBuilding } from "@/context/BuildingContext";
import matchesSearch from "@/tools/function/matchesSearch";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { DansKhuulgaTable } from "./DansKhuulgaTable";
import { StandardPagination } from "@/components/ui/StandardTable";

type TableItem = {
  id: string | number;
  date: string;
  month: string;
  // numerical value in minor units (assumed) or main units depending on backend
  total: number;
  /** Зарлагын гүйлгээ эсэх (total нь хасах) */
  zarlagaEsekh?: boolean;
  balance?: number | null;
  // human readable description / purpose of transaction
  action: string;
  // linked contract ids (array or single)
  contractIds?: string[];
  // transferred account / destination account number
  account?: string;
  /**
   * Холбогдсон гэрээний БҮТЭН бичлэг (дугаар, тоот, оршин суугч).
   * Банкны гүйлгээ дээр зөвхөн гэрээний `_id` хадгалагддаг тул хүснэгт
   * болон дэлгэрэнгүй дээр түүхий ObjectId ("6a4def37f9c8db0cec503fd8")
   * гарч, оршин суугч хэн болох нь огт харагддаггүй байв.
   */
  contracts?: any[];
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

  const [activeStatFilter, setActiveStatFilter] = useState<number | null>(null);
  // Орлого / Зарлагаар ялгах
  const [turulShuult, setTurulShuult] = useState<"all" | "orlogo" | "zarlaga">("all");
  const [excelNeelttei, setExcelNeelttei] = useState(false);
  const [excelOruulj, setExcelOruulj] = useState(false);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const excelMenuRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  // Эрэмбэ. Хүснэгт рүү ЗӨВХӨН тухайн хуудсын мөр очдог тул эрэмбийг энд,
  // зүсэхээс өмнө хийх ёстой — эс тэгвээс зөвхөн харагдаж буй хуудас
  // эрэмбэлэгдэж, бүх өгөгдлийн дараалал буруу гарна.
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<
    "ascend" | "descend" | null
  >(null);
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
  /** gereeniiId -> гэрээ. Холбогдсон гүйлгээний эзэн/дугаарыг харуулахад. */
  const [gereeMap, setGereeMap] = useState<Record<string, any>>({});
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

  // Холбогдсон гэрээнүүдийг НЭГ удаагийн дуудалтаар татаж, id-аар нь
  // индексжүүлнэ. Мөр тус бүрд тусад нь татвал хэдэн зуун хүсэлт үүснэ.
  useEffect(() => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    const iduud = Array.from(
      new Set(
        (bankRows || [])
          .flatMap((r: any) =>
            Array.isArray(r.kholbosonGereeniiId)
              ? r.kholbosonGereeniiId
              : r.kholbosonGereeniiId
                ? [r.kholbosonGereeniiId]
                : [],
          )
          .map((id: any) => String(id))
          .filter(Boolean),
      ),
    ).filter((id) => !gereeMap[id]);
    if (iduud.length === 0) return;

    let tsutslagdsan = false;
    (async () => {
      try {
        const resp = await uilchilgee(token).get("/geree", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: iduud.length,
            query: JSON.stringify({ _id: { $in: iduud } }),
          },
        });
        const list = resp.data?.jagsaalt || resp.data?.list || resp.data || [];
        if (tsutslagdsan || !Array.isArray(list)) return;
        setGereeMap((umnukh) => {
          const shine = { ...umnukh };
          list.forEach((g: any) => {
            if (g?._id) shine[String(g._id)] = g;
          });
          return shine;
        });
      } catch {
        // Гэрээ татаж чадаагүй ч хүснэгт ажиллана — зөвхөн эзний нэр
        // харагдахгүй байна гэсэн үг тул алдааг дэлгэцэд гаргахгүй.
      }
    })();
    return () => {
      tsutslagdsan = true;
    };
  }, [bankRows, token, ajiltan?.baiguullagiinId, gereeMap]);

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
      let dateStr = d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "-";
      
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
        // Зарлага нь банк бүрд өөр тэмдэглэгддэг: хасах дүн (khan/tdb/bogd),
        // `drOrCr: "Debit"` (golomt), эсвэл `outcome` (trans). Нэг мөрөнд
        // тэмдэгтэй дүн болгоно — хасах = зарлага.
        ...(() => {
          const tuukhii = Number(r.amount ?? r.Amt ?? r.tranAmount ?? r.income ?? r.kholbosonDun ?? 0) || 0;
          const zarlagaEsekh =
            tuukhii < 0 ||
            r.drOrCr === "Debit" ||
            (Number(r.outcome) > 0 && !(Number(r.income) > 0));
          const dun = Math.abs(tuukhii) || (zarlagaEsekh ? Math.abs(Number(r.outcome) || 0) : 0);
          return { total: zarlagaEsekh ? -dun : dun, zarlagaEsekh };
        })(),
        balance: r.balance !== undefined && r.balance !== null && r.balance !== "" && !isNaN(Number(r.balance)) ? Number(r.balance) : (r.closingBalance ?? r.bal ?? null),
        action: r.description || r.TxAddInf || r.tranDesc || r.txnDesc || r.ner || "Банкны гүйлгээ",
        contractIds: Array.isArray(r.kholbosonGereeniiId) ? r.kholbosonGereeniiId : r.kholbosonGereeniiId ? [String(r.kholbosonGereeniiId)] : [],
        contracts: (Array.isArray(r.kholbosonGereeniiId)
          ? r.kholbosonGereeniiId
          : r.kholbosonGereeniiId
            ? [r.kholbosonGereeniiId]
            : []
        )
          .map((id: any) => gereeMap[String(id)])
          .filter(Boolean),
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
        const dv = (m.raw as any)?.postDate || (m.raw as any)?.tranDate || (m.raw as any)?.ognoo || (m.raw as any)?.createdAt || (m.raw as any)?.date || (m.raw as any)?.togtoo || null;
        if (!dv) return false;
        const d = new Date(dv);
        if (start && d < start) return false;
        if (end && d > end) return false;
      }
      if (searchTerm && !matchesSearch(m, searchTerm)) return false;
      return true;
    });
    setFilteredData(filtered);
  }, [bankRows, selectedDugaar, ekhlekhOgnoo, searchTerm, gereeMap]);

  // Fallback balance from transactions if bank live balance API is null
  const latestRowBalance = useMemo(() => {
    for (const r of filteredData || []) {
      const b = r.balance ?? r.raw?.balance ?? r.raw?.closingBalance ?? r.raw?.bal ?? r.raw?.accountBalance;
      if (b !== undefined && b !== null && b !== "" && !isNaN(Number(b))) {
        return Number(b);
      }
    }
    for (const r of bankRows || []) {
      const b = r.balance ?? r.closingBalance ?? r.bal ?? r.accountBalance;
      if (b !== undefined && b !== null && b !== "" && !isNaN(Number(b))) {
        return Number(b);
      }
    }
    return null;
  }, [filteredData, bankRows]);

  const effectiveUldegdel = uldegdel !== null ? uldegdel : latestRowBalance;

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

  const statFiltered = useMemo(() => {
    if (activeStatFilter === null || activeStatFilter === 0) return filteredData;
    if (activeStatFilter === 1) return filteredData.filter((f) => (f.contractIds?.length || 0) === 0);
    if (activeStatFilter === 2) return filteredData.filter((f) => (f.contractIds?.length || 0) > 0);
    if (activeStatFilter === 3) {
      const seen = new Set<string>();
      return filteredData.filter((f) => {
        const acc = String(f.account || "");
        if (!acc || seen.has(acc)) return false;
        seen.add(acc);
        return true;
      });
    }
    return filteredData;
  }, [filteredData, activeStatFilter]);

  /** "2026-07-25 13:01:53" гэх мэт зайтай бичлэгийг ч зөв уншина. */
  const tsagRuu = (utga: unknown): number => {
    if (!utga) return Number.NEGATIVE_INFINITY;
    const t = new Date(String(utga).replace(" ", "T")).getTime();
    return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
  };

  const turulTooluur = useMemo(() => {
    const zarlaga = statFiltered.filter((m) => m.zarlagaEsekh).length;
    return { all: statFiltered.length, orlogo: statFiltered.length - zarlaga, zarlaga };
  }, [statFiltered]);

  const erembelsen = useMemo(() => {
    const suuri =
      turulShuult === "all"
        ? statFiltered
        : statFiltered.filter((m) =>
            turulShuult === "zarlaga" ? m.zarlagaEsekh : !m.zarlagaEsekh,
          );
    if (!sortKey || !sortOrder) return suuri;
    const chig = sortOrder === "ascend" ? 1 : -1;
    const utgaAvya = (m: TableItem): string | number => {
      switch (sortKey) {
        case "date":
          return tsagRuu(m.date);
        case "total":
          return Number(m.total) || 0;
        case "ajiltan":
          return String(m.raw?.kholbosonAjiltniiNer || "");
        case "ebarimt":
          return m.raw?.ebarimtAvsanEsekh ? 1 : 0;
        case "action":
          return String(m.action || m.raw?.uilchilgeeniiUtga || "");
        case "account":
          return String(m.account || m.raw?.bairlal || "");
        case "linkedDate":
          // Холбогдоогүй мөрөнд огноо байхгүй тул үргэлж хамгийн сүүлд.
          return (m.contractIds?.length || 0) > 0
            ? tsagRuu(m.raw?.updatedAt)
            : Number.NEGATIVE_INFINITY;
        case "resident": {
          const g = m.contracts?.[0];
          if (!g) return "";
          return `${g.ovog || ""} ${g.ner || ""}`.trim() || String(g.ner || "");
        }
        case "status":
          return (m.contractIds?.length || 0) > 0 ? 1 : 0;
        default:
          return 0;
      }
    };
    return [...suuri].sort((a, b) => {
      const av = utgaAvya(a);
      const bv = utgaAvya(b);
      if (typeof av === "string" || typeof bv === "string")
        return String(av).localeCompare(String(bv), "mn") * chig;
      return (av - bv) * chig;
    });
  }, [statFiltered, sortKey, sortOrder, turulShuult]);

  // Excel цэс гадна дарахад хаагдана
  useEffect(() => {
    if (!excelNeelttei) return;
    const onDown = (e: MouseEvent) => {
      if (!excelMenuRef.current?.contains(e.target as Node)) setExcelNeelttei(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [excelNeelttei]);

  const excelZagvarTatya = async () => {
    setExcelNeelttei(false);
    if (!token) return;
    try {
      const resp = await uilchilgee(token).post(
        "/bankniiGuilgeeZagvarAvya",
        {},
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Банкны гүйлгээ загвар_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      openErrorOverlay(getErrorMessage(e));
    }
  };

  const excelOruulya = async (file: File) => {
    if (!token || !ajiltan?.baiguullagiinId || !selectedDugaar) return;
    setExcelOruulj(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("baiguullagiinId", String(ajiltan.baiguullagiinId));
      const barilga = selectedBuildingId || barilgiinId;
      if (barilga) formData.append("barilgiinId", String(barilga));
      formData.append("dansniiDugaar", selectedDugaar);
      if (selectedDans?.bank) formData.append("bank", String(selectedDans.bank));
      const resp = await uilchilgee(token).post("/bankniiGuilgeeExcelOruulya", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      openSuccessOverlay(`${resp.data?.too ?? 0} гүйлгээ оруулагдлаа`);
      await fetchBankTransfers();
    } catch (e: any) {
      openErrorOverlay(e?.response?.data?.aldaa || getErrorMessage(e));
    } finally {
      setExcelOruulj(false);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  };

  const totalPages = Math.max(1, Math.ceil(erembelsen.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const paginated = erembelsen.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <>
      <div className="flex flex-col pb-14">
        <div className="space-y-3">
          <div className="stat-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                onClick={() => { setActiveStatFilter(activeStatFilter === idx ? null : idx); setPage(1); }}
                className={`relative group rounded-2xl neu-panel transition-all cursor-pointer select-none ${
                  activeStatFilter === idx
                    ? "ring-2 ring-theme shadow-lg"
                    : "hover:bg-[color:var(--surface-hover)] hover:scale-105"
                }`}
              >
                <div className="stat-card">
                  <div className="stat-card-value">
                    {stat.value}
                  </div>
                  <div className="stat-card-title">
                    {stat.title}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Шүүлтүүр — нэгдсэн `.btn-minimal` загвар (globals.css); үлдэгдэл баруун талд */}
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <div id="dans-date" className="btn-minimal flex h-9 w-full items-center !px-2 sm:w-[260px]">
              <StandardDatePicker
                isRange={true}
                value={ekhlekhOgnoo}
                onChange={(_dates, dateStrings) => {
                  const [s, e] = (dateStrings || []) as [
                    string | undefined,
                    string | undefined,
                  ];
                  setEkhlekhOgnoo([s || null, e || null]);
                }}
                allowClear
                placeholder="Огноо сонгох"
                className="!h-full !px-1 text-[13px]"
              />
            </div>
            <div id="dans-account" className="h-9 w-full sm:w-[200px]">
              <TusgaiZagvar
                value={selectedDansId || ""}
                onChange={(v) => setSelectedDansId(v || undefined)}
                options={dansOptions}
                placeholder={t("Данс")}
                className="h-full w-full"
                buttonClassName="!font-normal text-[13px] !px-3"
                optionClassName="!px-3 !py-1.5 text-[13px] !font-normal"
              />
            </div>
            {/* Орлого / Зарлага */}
            <div className="inline-flex h-9 items-center gap-0.5 rounded-[10px] border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-0.5 shadow-[var(--ctl-shadow)]">
              {([
                ["all", "Бүгд"],
                ["orlogo", "Орлого"],
                ["zarlaga", "Зарлага"],
              ] as const).map(([k, nershil]) => {
                const idevkhtei = turulShuult === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setTurulShuult(k); setPage(1); }}
                    className={`inline-flex h-full items-center gap-1.5 rounded-[8px] px-3 text-[13px] transition-colors ${
                      idevkhtei
                        ? k === "zarlaga"
                          ? "bg-danger/10 text-danger"
                          : k === "orlogo"
                            ? "bg-success/10 text-success"
                            : "bg-theme/10 text-brand"
                        : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                    }`}
                  >
                    {nershil}
                    <span className="text-[11px] opacity-70">{turulTooluur[k]}</span>
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2">
            {selectedDansId && (
              <div className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[10px] border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-3 text-[13px] shadow-[var(--ctl-shadow)]">
                {isLoadingUldegdel ? (
                  <span className="text-[color:var(--muted-text)]">Үлдэгдэл...</span>
                ) : effectiveUldegdel !== null ? (
                  <>
                    <span className="text-xs text-[color:var(--muted-text)]">Дансны үлдэгдэл</span>
                    <strong className="font-semibold text-[color:var(--panel-text)]">
                      {formatNumber(effectiveUldegdel, 2)}₮
                    </strong>
                  </>
                ) : (
                  <span className="text-[color:var(--muted-text)]">Үлдэгдэл тодорхойгүй</span>
                )}
              </div>
            )}
            {/* Excel — гүйлгээг гараар оруулах (тест / API-гүй данс) */}
            <div ref={excelMenuRef} className="relative">
              <ExcelButton
                id="dans-excel-btn"
                label={excelOruulj ? "Оруулж байна..." : "Excel"}
                title="Excel"
                loading={excelOruulj}
                onClick={() => setExcelNeelttei((v) => !v)}
                suffix={<ChevronDown className={`h-3.5 w-3.5 transition-transform ${excelNeelttei ? "rotate-180" : ""}`} />}
              />
              {excelNeelttei && (
                <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={excelZagvarTatya}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                  >
                    <FileDown className="h-4 w-4 text-[color:var(--muted-text)]" />
                    Загвар татах
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDugaar}
                    onClick={() => { setExcelNeelttei(false); excelInputRef.current?.click(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    title={selectedDugaar ? undefined : "Эхлээд данс сонгоно уу"}
                  >
                    <FileUp className="h-4 w-4 text-[color:var(--muted-text)]" />
                    Excel оруулах
                  </button>
                </div>
              )}
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) excelOruulya(file);
                }}
              />
            </div>
            </div>
          </div>

          <div className="w-full">
            <div className="allow-overflow no-scrollbar" id="dans-table">
              <DansKhuulgaTable
                data={paginated}
                loading={isLoadingBankRows}
                page={page}
                rowsPerPage={rowsPerPage}
                onLink={handleOpenLinkModal}
                onUnlink={handleUnlinkTransaction}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={(key, order) => {
                  setSortKey(key);
                  setSortOrder(order);
                  // Шинэ эрэмбээр эхний хуудас руу буцна.
                  setPage(1);
                }}
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
          content: "dark:!bg-[color:var(--panel)] dark:!text-white rounded-lg !p-6 border",
          body: "!p-0 font-inter",
        }}
      >
        {selectedGuilgee && (
          <div className="flex w-full flex-col space-y-2 min-h-[500px] justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold lg:text-xl">
                  Гүйлгээний мэдээлэл
                </span>
                <span className=" text-sm font-mono">
                  {moment().format("YYYY-MM-DD")}
                </span>
              </div>
              <div className="box grid w-full grid-cols-4 rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-2 text-xs gap-1">
                <div className="col-span-4 lg:col-span-1 truncate font-mono">
                  {selectedGuilgee.account || selectedGuilgee.raw?.accNum || selectedGuilgee.raw?.CtAcct || "-"}
                </div>
                <div className="col-span-4 lg:col-span-1 truncate">
                  {selectedGuilgee.raw?.accName || selectedGuilgee.raw?.ner || selectedGuilgee.raw?.CtActnName || "-"}
                </div>
                <div className="col-span-2 text-center lg:col-span-1">
                  {selectedGuilgee.date.split(" ")[0]}
                </div>
                <div className="col-span-2 text-right text-danger font-semibold lg:col-span-1">
                  {formatNumber(selectedGuilgee.total)}
                </div>
                <div className="col-span-4 mt-2">
                  <input
                    className="w-full rounded-md border border-[color:var(--surface-border)] bg-[color:var(--panel)] px-2 py-1 text-xs dark:text-white"
                    value={selectedGuilgee.action}
                    disabled
                  />
                </div>
              </div>
              <div className="font-medium lg:text-xl pt-2">
                Гүйлгээ холбох
              </div>
              <div className="relative w-full">
                <input
                  autoComplete="off"
                  id="baiguullagaSongokh"
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full rounded-md border border-[color:var(--surface-border)] p-1.5 px-3 text-sm text-[color:var(--panel-text)] focus:outline-none focus:ring-1 focus:ring-theme"
                  placeholder="Оршин суугч/Гэрээ сонгох"
                  value={searchContractQuery}
                  onChange={(e) => {
                    setSearchContractQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                />
                {showDropdown && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1 shadow-lg text-xs">
                    {isSearchingContracts ? (
                      <div className="p-3 text-center text-[color:var(--muted-text)]">Уншиж байна...</div>
                    ) : contractsList.length === 0 ? (
                      <div className="p-3 text-center text-[color:var(--muted-text)]">Үр дүн олдсонгүй</div>
                    ) : (
                      contractsList.map((geree: any) => (
                        <div
                          key={geree._id}
                          className="grid cursor-pointer grid-cols-3 gap-2 rounded-md border border-transparent p-2 hover:bg-[color:var(--surface-hover)] text-[color:var(--panel-text)]"
                          onMouseDown={() => {
                            setSelectedContract(geree);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-semibold truncate">{geree.toot ? `${geree.toot} тоот` : "-"}</div>
                          <div className="truncate">{geree.ner || `${geree.ovog || ""} ${geree.ner || ""}`}</div>
                          <div className="truncate text-[color:var(--muted-text)]">{geree.gereeniiDugaar || "-"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 px-2 pt-2">
              {selectedContract && (
                <div className="space-y-2 rounded-md border border-[color:var(--surface-border)] p-2">
                  <div className="flex w-full justify-between items-center text-sm font-medium">
                    <span>
                      {selectedContract.toot ? `${selectedContract.toot} тоот` : "-"} -- {selectedContract.ner || `${selectedContract.ovog || ""} ${selectedContract.ner || ""}`} -- {selectedContract.gereeniiDugaar || "-"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedContract(null)}
                      className="h-8 w-8 p-1 text-lg text-danger hover:text-danger transition-colors"
                      title="Сонголт арилгах"
                    >
                      <CloseCircleOutlined />
                    </button>
                  </div>

                  {/* Төлбөрийн үлдэгдэл box */}
                  <div className="box grid w-full grid-cols-3 rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-2 text-xs">
                    <div className="col-span-3 font-semibold mb-1">Төлбөрийн үлдэгдэл</div>
                    <div className="text-danger font-medium">
                      {formatNumber(selectedContract.uldegdel || 0, 2)}
                    </div>
                    <div className="text-[color:var(--muted-text)]">
                      {selectedContract.register || selectedContract.gereeniiDugaar || ""}
                    </div>
                    <div className="text-right text-brand">
                      <input
                        className="w-full rounded-md border border-[color:var(--surface-border)] bg-[color:var(--panel)] px-2 py-0.5 text-right dark:text-white"
                        placeholder="Төлөх дүн"
                        value={formatNumber(selectedGuilgee.total)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-[color:var(--surface-border)] my-3" />

              <div className="grid w-full grid-cols-2 divide-x-2 divide-[color:var(--surface-border)] px-2">
                <div className="flex flex-col justify-between pr-2 lg:flex-row text-xs">
                  <div className="">Холбосон дүн:</div>
                  <div className="text-right text-base font-bold text-brand">
                    {formatNumber(selectedContract ? selectedGuilgee.total : 0)}
                  </div>
                </div>
                <div className="flex flex-col justify-between pl-2 lg:flex-row text-xs">
                  <div className="">Холбоогүй дүн:</div>
                  <div className="text-right text-base font-bold text-danger">
                    {formatNumber(selectedContract ? 0 : selectedGuilgee.total)}
                  </div>
                </div>
              </div>

              <hr className="border-[color:var(--surface-border)] my-3" />

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
    </>
  );
}
