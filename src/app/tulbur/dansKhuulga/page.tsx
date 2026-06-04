"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getDefaultDateRange } from "@/lib/utils";
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
  const [ekhlekhOgnoo, setEkhlekhOgnoo] =
    useState<DateRangeValue>(getDefaultDateRange);
  const [selectedDansId, setSelectedDansId] = useState<string | undefined>(
    undefined,
  );
  const [filteredData, setFilteredData] = useState<TableItem[]>([]);

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
      await fetchBankTransfers();
    } catch (e) {
      openErrorOverlay(getErrorMessage(e));
    } finally {
      setIsFetchingStatement(false);
    }
  };

  // Resolve selectedDansId → dugaar string
  const selectedDugaar = useMemo(() => {
    if (!selectedDansId) return null;
    const byId = (dansList || []).find((d: any) => String(d._id) === String(selectedDansId));
    if (byId?.dugaar) return String(byId.dugaar);
    const byDugaar = (dansList || []).find((d: any) => String(d.dugaar) === String(selectedDansId));
    if (byDugaar?.dugaar) return String(byDugaar.dugaar);
    return null;
  }, [selectedDansId, dansList]);

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
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
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
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId, selectedDugaar]);

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

  // Map + client-side date/search filter (on the small per-account result set)
  useEffect(() => {
    if (!selectedDugaar) { setFilteredData([]); return; }
    const toDate = (val: any) => { if (!val) return null; const d = new Date(val); return isNaN(d.getTime()) ? null : d; };
    const start = ekhlekhOgnoo?.[0] ? toDate(ekhlekhOgnoo[0]) : null;
    const end = ekhlekhOgnoo?.[1] ? toDate(ekhlekhOgnoo[1]) : null;

    const mapped = (bankRows || []).map((r: any, idx: number) => {
      const dateVal = r.postDate || r.tranDate || r.ognoo || r.createdAt || r.date || r.togtoo || null;
      const d = dateVal ? new Date(dateVal) : null;
      return {
        id: r._id || `bank-${idx}`,
        date: d ? d.toLocaleDateString("mn-MN") : "-",
        month: d ? d.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit" }) : r.sar || "",
        total: Number(r.amount ?? r.Amt ?? r.tranAmount ?? r.income ?? r.kholbosonDun ?? 0) || 0,
        action: r.description || r.TxAddInf || r.tranDesc || r.txnDesc || r.ner || "Банкны гүйлгээ",
        contractIds: Array.isArray(r.kholbosonGereeniiId) ? r.kholbosonGereeniiId : r.kholbosonGereeniiId ? [String(r.kholbosonGereeniiId)] : [],
        account: String(r.dansniiDugaar || r.accNum || ""),
        raw: r,
      } as TableItem;
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
                      <span>Үлдэгдэл: <strong>{formatNumber(uldegdel, 2)}</strong></span>
                    ) : (
                      <span className="opacity-60">Үлдэгдэл авах боломжгүй</span>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleKhuulgaTatakh}
                isLoading={isFetchingStatement}
                className="flex-shrink-0 rounded-2xl"
              >
                Хуулга татах
              </Button>
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
    </TulburLayout>
  );
}
