"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Spin, message } from "antd";
import Button from "@/components/ui/Button";
import { getDefaultDateRange } from "@/lib/utils";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { EbarimtTable, EbarimtItem } from "./EbarimtTable";
import moment from "moment";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissionUtils";
import uilchilgee, { getApiUrl } from "@/lib/uilchilgee";
import useBaiguullaga from "@/lib/useBaiguullaga";
import formatNumber from "../../../../tools/function/formatNumber";
import { Download } from "lucide-react";
import IconTextButton from "@/components/ui/IconTextButton";
import TulburLayout from "../TulburLayout";
import { StandardPagination } from "@/components/ui/StandardTable";
import { useSearch } from "@/context/SearchContext";

type TableItem = {
  id?: string | number;
  receiptId?: string;
  ddtd?: string;
  date?: string;
  month?: string;
  total?: number;
  toot?: string;
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
  const router = useRouter();
  const { token, ajiltan, barilgiinId } = useAuth();

  useEffect(() => {
    if (ajiltan) {
      if (!hasPermission(ajiltan, "/tulbur/ebarimt")) {
        router.push("/tulbur");
      }
    }
  }, [ajiltan, router]);
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null,
  );
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<
    [Date | null, Date | null] | null
  >(() => {
    const [start, end] = getDefaultDateRange();
    return [new Date(start), new Date(end)];
  });
  const { searchTerm } = useSearch();
  const [uilchilgeeAvi, setUilchilgeeAvi] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  // Cache for contract toot lookups
  const [contractTootCache, setContractTootCache] = useState<
    Record<string, string>
  >({});

  // Function to fetch toot by gereeniiDugaar
  const fetchTootByDugaar = useCallback(
    async (dugaar: string): Promise<string | null> => {
      if (!token || !ajiltan?.baiguullagiinId || !dugaar) return null;

      // Check cache first
      if (contractTootCache[dugaar]) {
        return contractTootCache[dugaar];
      }

      try {
        const resp = await uilchilgee(token).get("/geree", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: barilgiinId || null,
            gereeniiDugaar: dugaar,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 1,
          },
        });

        const contracts = resp.data?.jagsaalt || [];
        if (contracts.length > 0) {
          const contract = contracts[0];
          const toot = contract?.toot || contract?.medeelel?.toot || null;
          if (toot) {
            setContractTootCache((prev) => ({ ...prev, [dugaar]: toot }));
          }
          return toot;
        }
      } catch (err) {
        console.error("Failed to fetch contract toot:", err);
      }
      return null;
    },
    [token, ajiltan?.baiguullagiinId, barilgiinId, contractTootCache],
  );

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
      return isNaN(d.getTime()) ? null : moment(d).format("YYYY-MM-DD");
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
        "/ebarimtJagsaaltAvya",
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
          string | null,
        ];
        const resp = await uilchilgee(tkn).get("/ebarimtJagsaaltAvya", {
          baseURL: getApiUrl(),
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
        string | null,
      ];
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          ...(branch ? { barilgiinId: branch } : {}),
          ...(s || e ? { ekhlekhOgnoo: s, duusakhOgnoo: e } : {}),
          ...(service ? { uilchilgee: service } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
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
              rec?.id ||
              it?.id ||
              it?.idId ||
              "",
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
        gereeniiDugaar: it?.gereeniiDugaar || it?.geree?.gereeniiDugaar || "-",
        // Note: toot will be fetched asynchronously after initial render
        toot: it?.toot || it?.medeelel?.toot || it?.orshinSuugch?.toot || "-",
        ...it,
      } as TableItem;
    });
  }, [data]);

  // Effect to fetch missing toot data for items with gereeniiDugaar
  useEffect(() => {
    const fetchMissingToots = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;

      // Find items that have gereeniiDugaar but no toot
      const itemsNeedingToot = tableData.filter(
        (item) =>
          item.gereeniiDugaar &&
          item.gereeniiDugaar !== "-" &&
          item.toot === "-",
      );

      if (itemsNeedingToot.length === 0) return;

      // Get unique dugaars
      const uniqueDugaars = Array.from(
        new Set(itemsNeedingToot.map((item) => item.gereeniiDugaar)),
      ).filter(Boolean) as string[];

      // Fetch toot for each unique dugaar
      for (const dugaar of uniqueDugaars) {
        if (!dugaar || contractTootCache[dugaar]) continue;

        try {
          const resp = await uilchilgee(token).get("/geree", {
            params: {
              baiguullagiinId: ajiltan.baiguullagiinId,
              barilgiinId: barilgiinId || null,
              gereeniiDugaar: dugaar,
              khuudasniiDugaar: 1,
              khuudasniiKhemjee: 1,
            },
          });

          const contracts = resp.data?.jagsaalt || [];
          if (contracts.length > 0) {
            const contract = contracts[0];
            const toot = contract?.toot || contract?.medeelel?.toot || null;
            if (toot) {
              setContractTootCache((prev) => ({ ...prev, [dugaar]: toot }));
            }
          }
        } catch (err) {
          console.error(`Failed to fetch toot for ${dugaar}:`, err);
        }
      }
    };

    fetchMissingToots();
  }, [
    tableData,
    token,
    ajiltan?.baiguullagiinId,
    barilgiinId,
    contractTootCache,
  ]);

  // Update table data with cached toot values
  const tableDataWithToot = useMemo(() => {
    return tableData.map((item) => {
      if (
        item.toot !== "-" ||
        !item.gereeniiDugaar ||
        item.gereeniiDugaar === "-"
      ) {
        return item;
      }
      const cachedToot = contractTootCache[item.gereeniiDugaar];
      if (cachedToot) {
        return { ...item, toot: cachedToot };
      }
      return item;
    });
  }, [tableData, contractTootCache]);

  // Client-side filtered view based on search input and date range
  const displayedData: TableItem[] = useMemo(() => {
    let filtered = tableDataWithToot;

    // Filter by date range
    if (ekhlekhOgnoo && (ekhlekhOgnoo[0] || ekhlekhOgnoo[1])) {
      const [start, end] = ekhlekhOgnoo;
      filtered = filtered.filter((it) => {
        if (!it.date) return true; // if no date, include
        const itemDate = moment(it.date, "YYYY-MM-DD HH:mm").toDate();
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    // Filter by search term
    const s = (searchTerm || "").trim().toLowerCase();
    if (!s) return filtered;
    return filtered.filter((it) => {
      const fields = [
        it.receiptId,
        it.ddtd,
        it.name,
        it.service,
        it.gereeniiDugaar,
        it.toot,
        it.id,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  }, [tableData, searchTerm, ekhlekhOgnoo]);

  const exceleerTatya = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }
      const [s, e] = ekhlekhOgnoo || [];
      const filters: Record<string, any> = {};
      const sIso = toISO(s);
      const eIso = toISO(e);
      if (sIso) filters.ekhlekhOgnoo = sIso;
      if (eIso) filters.duusakhOgnoo = eIso;
      if (uilchilgeeAvi) filters.uilchilgee = uilchilgeeAvi;

      const body = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: barilgiinId || null,
        filters,
        fileName: undefined as string | undefined,
      };

      const path = "/ebarimtExcelDownload";
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
            { responseType: "blob" as any, baseURL: undefined as any },
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
      let filename = "ebarimt.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
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
  const ebarimtIlgeeye = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };
  const t = (text: string) => text;

  // Calculate stats
  const stats = useMemo(() => {
    const total = displayedData.reduce((s, r) => s + (r.total || 0), 0);
    const b2c = displayedData.filter((r) => r.type === "B2C_RECEIPT").length;
    const b2b = displayedData.filter((r) => r.type === "B2B_RECEIPT").length;
    return [
      { title: "Нийт баримт", value: displayedData.length },
      { title: "Нийт дүн", value: formatNumber(total) },
      { title: "Байгууллага", value: b2b },
      { title: "Иргэн", value: b2c },
    ];
  }, [displayedData]);

  return (
    <TulburLayout activeTab="ebarimt">
      <div className="flex flex-col pb-14">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="relative group rounded-2xl neu-panel hover:bg-[color:var(--surface-hover)] transition-colors"
              >
                <div className="relative rounded-2xl p-5 overflow-hidden">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div
                      className={`text-3xl mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-theme dark:!text-white ${stat.title === "Нийт дүн" ? "force-bold" : ""}`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs text-theme dark:!text-white/70 leading-tight font-medium">
                      {stat.title}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters Section */}
          <div className="rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div id="ebarimt-date" className="h-10 w-full sm:w-[320px]">
                  <StandardDatePicker
                    isRange={true}
                    value={ekhlekhOgnoo ?? undefined}
                    onChange={(v) =>
                      setEkhlekhOgnoo(
                        (v || [null, null]) as [Date | null, Date | null],
                      )
                    }
                    allowClear
                    placeholder="Огноо сонгох"
                    className="text-theme !px-3"
                  />
                </div>

              </div>
              <div className="flex flex-row gap-3 w-full lg:w-auto justify-end">
                <IconTextButton
                  id="ebarimt-excel-btn"
                  onClick={exceleerTatya}
                  icon={<Download className="w-4 h-4" />}
                  label="Excel татах"
                />
                <Button
                  onClick={ebarimtIlgeeye}
                  isLoading={loading}
                  variant="primary"
                  className="rounded-xl"
                >
                  Татварт илгээх
                </Button>
              </div>
            </div>
          </div>

          <div className="table-surface rounded-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="p-1 allow-overflow no-scrollbar" id="ebarimt-table">
              <EbarimtTable
                data={displayedData}
                loading={isLoading}
                maxHeight="calc(100vh - 550px)"
              />
            </div>
            <div id="ebarimt-pagination">
              <StandardPagination
                current={1}
                total={displayedData.length}
                pageSize={displayedData.length || 50}
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </TulburLayout>
  );
}
