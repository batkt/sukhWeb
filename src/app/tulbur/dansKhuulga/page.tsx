"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { useAuth } from "@/lib/useAuth";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import useJagsaalt from "@/lib/useJagsaalt";
import uilchilgee, { url as API_URL } from "@/lib/uilchilgee";
import IconTextButton from "@/components/ui/IconTextButton";
import { Download } from "lucide-react";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import { useBuilding } from "@/context/BuildingContext";
import matchesSearch from "@/tools/function/matchesSearch";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import TulburLayout from "../TulburLayout";

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

  useEffect(() => {
    if (ajiltan) {
      if (!hasPermission(ajiltan, "/tulbur/dansKhuulga")) {
        router.push("/tulbur");
      }
    }
  }, [ajiltan, router]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const todayStr = new Date().toISOString().split("T")[0];
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [selectedDansId, setSelectedDansId] = useState<string | undefined>(
    undefined
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
    router.replace(`/tulbur/dansKhuulga?${params.toString()}`, { scroll: false });
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
    [dansList]
  );



  const t = (text: string) => text;

  // Bank transfers (банкны гүйлгээ) fetched from /bankniiGuilgee
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
    <TulburLayout activeTab="dansKhuulga">
      <div className="min-h-screen">
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
                className="relative group rounded-2xl neu-panel hover:bg-[color:var(--surface-hover)] transition-colors"
              >
                <div className="relative rounded-2xl p-5 overflow-hidden">
                  <div className="text-3xl  mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-theme">
                    {stat.value}
                  </div>
                  <div className="text-xs text-theme leading-tight">
                    {stat.title}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div id="dans-date" className="btn-minimal h-[40px] w-[160px] flex items-center px-3">
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
                      position: "bottom",
                      withinPortal: true,
                      width: 320,
                    }}
                    clearable
                    placeholder="Огноо сонгох"
                    classNames={{
                    root: "!h-full !w-full",
                    input:
                      "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
                  }}
                  />
                </div>
                <div id="dans-account">
                  <TusgaiZagvar
                    value={selectedDansId || ""}
                    onChange={(v) => setSelectedDansId(v || undefined)}
                    options={dansOptions}
                    placeholder={t("Данс")}
                    className="h-[40px] w-[160px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="table-surface overflow-hidden rounded-2xl w-full">
            <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
              <div
                className="max-h-[40vh] overflow-y-auto custom-scrollbar w-full"
                id="dans-table"
              >
                <table className="table-ui text-sm min-w-full border border-[color:var(--surface-border)]">
                  <thead>
                    <tr className="text-theme">
                      <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap w-12 border-r border-[color:var(--surface-border)]">
                        №
                      </th>
                      <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap w-24 border-r border-[color:var(--surface-border)]">
                        Огноо
                      </th>

                      <th className="p-1 text-sm font-normal text-theme text-left pl-2 whitespace-nowrap border-r border-[color:var(--surface-border)]">
                        Гүйлгээний утга
                      </th>
                      <th className="p-1 text-sm font-normal text-theme text-right pr-2 whitespace-nowrap w-32 border-r border-[color:var(--surface-border)]">
                        Гүйлгээний дүн
                      </th>
                      <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap">
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
                          <td className="p-1 text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                            {(page - 1) * rowsPerPage + index + 1}
                          </td>
                          <td className="p-1 text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                            {item.date}
                          </td>

                          <td className="p-1 truncate text-left pl-2 border-r border-[color:var(--surface-border)]" title={item.action}>
                            {item.action}
                          </td>
                          <td className="p-1 !text-right pr-2 whitespace-nowrap border-r border-[color:var(--surface-border)]">
                            {formatNumber(item.total ?? 0, 0)} ₮
                          </td>
                          <td className="p-1 text-center whitespace-nowrap">
                            {item.account || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
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
                            <div className="text-slate-500 ">
                              Хайсан мэдээлэл алга байна
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-30 bg-slate-50 dark:bg-slate-800 border-t border-[color:var(--surface-border)]">
                    <tr className="text-theme ">
                      <td className="p-1 text-center whitespace-nowrap w-12 border-r border-[color:var(--surface-border)]"></td>
                      <td className="p-1 text-center whitespace-nowrap w-24 border-r border-[color:var(--surface-border)]"></td>
                      <td className="p-1 text-right pr-2 border-r border-[color:var(--surface-border)]">
                        Нийт дүн:
                      </td>
                      <td className="p-1 text-right pr-2 border-r border-[color:var(--surface-border)] whitespace-nowrap w-32">
                        {formatNumber(totalSum, 0)} ₮
                      </td>
                      <td className="p-1"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between w-full px-2 py-1 gap-3 text-sm">
              <div className="text-theme/70">Нийт: {filteredData.length}</div>

              <div className="flex items-center gap-3">
                <span id="dans-page-size">
                  <PageSongokh
                    value={rowsPerPage}
                    onChange={(v) => {
                      setRowsPerPage(v);
                      setPage(1);
                    }}
                    className="text-sm px-2 py-1"
                  />
                </span>

                <div id="dans-pagination" className="flex items-center gap-1">
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(Math.max(1, page - 1))}
                  >
                    Өмнөх
                  </button>
                  <div className="text-theme/70 px-1">{page}</div>
                  <button
                    className="btn-minimal btn-minimal-sm px-2 py-1 text-sm"
                    disabled={page * rowsPerPage >= filteredData.length}
                    onClick={() => setPage(page + 1)}
                  >
                    Дараах
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </TulburLayout>
  );
}
