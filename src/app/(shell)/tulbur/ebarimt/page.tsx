"use client";

import ExcelButton from "@/components/ui/ExcelButton";
import { useMemo, useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Spin } from "antd";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { getDefaultDateRange } from "@/lib/utils";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { EbarimtTable, EbarimtItem } from "./EbarimtTable";
import EbarimtKhevlekhModal from "./EbarimtKhevlekhModal";
import moment from "moment";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissionUtils";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";
import uilchilgee, { getApiUrl } from "@/lib/uilchilgee";
import useBaiguullaga from "@/lib/useBaiguullaga";
import formatNumber from "../../../../../tools/function/formatNumber";
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

/**
 * Баримтыг ҮЙЛЧИЛГЭЭГЭЭР ялгана.
 *
 * `models/ebarimt.js`-д «үйлчилгээ» гэсэн талбар БАЙХГҮЙ — гарал үүсэл нь
 * зөвхөн холбоос талбаруудаар илэрдэг:
 *   • `zogsooliinId` / `mashiniiDugaar`      → зогсоол
 *   • `gereeniiDugaar` / `guilgeeniiId` / `tulultiinId` → СӨХ
 *
 * `togloomiinId`, `tasalbariinGuilgeeniiId` гэх мэт бусад гарал үүсэл ч
 * байдаг тул тэднийг ХҮЧЭЭР СӨХ болгохгүй — «Бүгд» дор л харагдана.
 */
function zogsooliinBarimtEsekh(it: any): boolean {
  return Boolean(it?.zogsooliinId || it?.mashiniiDugaar);
}

function sokhiinBarimtEsekh(it: any): boolean {
  if (zogsooliinBarimtEsekh(it)) return false;
  // Мөр бүтээхдээ `gereeniiDugaar`-ыг "-" гэж нөхдөг тул түүнийг хасна
  const geree = it?.gereeniiDugaar;
  return (
    Boolean(geree && geree !== "-") ||
    Boolean(it?.guilgeeniiId || it?.tulultiinId)
  );
}

export default function Ebarimt() {
  const router = useRouter();
  const { token, ajiltan, barilgiinId } = useAuth();

  const tourSteps = useTourSteps("ebarimt");
  useRegisterTourSteps("/tulbur/ebarimt", tourSteps);

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
    ];
  }, [
    merchantTin,
    districtCode,
    ekhlekhOgnoo,
    ajiltan?.baiguullagiinId,
    barilgiinId,
    token,
  ]);

  const { data, isLoading, mutate } = useSWR(
    swrKey,
    async (args: any[]) => {
      const mode = args?.[0];
      if (mode === "ext") {
        const [, tkn, url, tin, dCode, s, e] = args as [
          string,
          string,
          string,
          string,
          string,
          string | null,
          string | null,
        ];
        const resp = await uilchilgee(tkn).get("/ebarimtJagsaaltAvya", {
          baseURL: getApiUrl(),
          params: {
            merchantTin: tin,
            districtCode: dCode,
            ...(s || e ? { ekhlekhOgnoo: s, duusakhOgnoo: e } : {}),
          },
        });
        return resp.data;
      }
      // internal fallback via our API
      const [, tkn, url, orgId, branch, s, e] = args as [
        string,
        string,
        string,
        string,
        string | null,
        string | null,
        string | null,
      ];
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          ...(branch ? { barilgiinId: branch } : {}),
          ...(s || e ? { ekhlekhOgnoo: s, duusakhOgnoo: e } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  // Одоо буцаагдаж байгаа баримтын _id — тэр мөрд эргэлдэх зураг харуулна
  const [butsaakhId, setButsaakhId] = useState<string | null>(null);
  /** Дахин хэвлэхээр сонгосон баримт */
  const [khevlekhBarimt, setKhevlekhBarimt] = useState<EbarimtItem | null>(
    null,
  );

  /**
   * И-баримтыг буцаах (устгах).
   *
   * Backend нь ЭХЛЭЭД татварын систем рүү залгаж, тэндээс амжилттай болсныг
   * батлаад л устгасан гэж тэмдэглэдэг. Тиймээс алдаа гарвал баримт хүчинтэй
   * хэвээр байна — хэрэглэгчид алдааг үзүүлж, жагсаалтыг хөндөхгүй.
   */
  const ebarimtButsaaya = useCallback(
    async (row: TableItem) => {
      const barimtiinId = row?._id;
      if (!token) return;
      if (!barimtiinId) {
        toast.error("Баримтын _id олдсонгүй — буцаах боломжгүй");
        return;
      }

      setButsaakhId(String(barimtiinId));
      try {
        const { data: khariu } = await uilchilgee(token).post(
          "/ebarimtButsaaya",
          {
            _id: barimtiinId,
            baiguullagiinId: ajiltan?.baiguullagiinId,
            // Баримт өөр барилгад хамаарч мэдэх тул мөрийн барилгыг эрхэмлэнэ
            barilgiinId: row?.barilgiinId || barilgiinId,
          },
          { baseURL: getApiUrl() },
        );

        if (khariu?.success) {
          const dugaar = row?.ddtd || row?.receiptId || row?.id || "";
          toast.success(
            dugaar
              ? `${dugaar} дугаартай баримт буцаагдлаа`
              : "Баримт буцаагдлаа",
          );
          await mutate();
        } else {
          toast.error(khariu?.message || "Баримт буцаахад алдаа гарлаа");
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Баримт буцаахад алдаа гарлаа",
        );
      } finally {
        setButsaakhId(null);
      }
    },
    [token, ajiltan?.baiguullagiinId, barilgiinId, mutate],
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

    // Үйлчилгээгээр ялгах — зогсоол ↔ СӨХ
    if (uilchilgeeAvi === "zogsool") {
      filtered = filtered.filter(zogsooliinBarimtEsekh);
    } else if (uilchilgeeAvi === "sokh") {
      filtered = filtered.filter(sokhiinBarimtEsekh);
    }

    // Filter by date range
    if (ekhlekhOgnoo && (ekhlekhOgnoo[0] || ekhlekhOgnoo[1])) {
      const [start, end] = ekhlekhOgnoo;
      filtered = filtered.filter((it) => {
        if (!it.date) return true; // if no date, include
        const itemDate = moment(it.date, "YYYY-MM-DD HH:mm").toDate();
        if (start && itemDate < moment(start).startOf("day").toDate())
          return false;
        if (end && itemDate > moment(end).endOf("day").toDate()) return false;
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
  }, [tableDataWithToot, searchTerm, ekhlekhOgnoo, uilchilgeeAvi]);

  const exceleerTatya = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
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
      const hide = toast.loading("Excel бэлдэж байна…");
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
      toast.dismiss(hide);

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
      toast.success("Excel татагдлаа");
    } catch (e) {
      console.error(e);
      toast.dismiss();
      toast.error("Excel татахад алдаа гарлаа");
    }
  };
  // Сүүлд татварт илгээсэн огноо — backend `ebarimtIlgeeye` амжилттай бол хадгална
  const [suuliinIlgeesen, setSuuliinIlgeesen] = useState<string | null>(null);
  useEffect(() => {
    const v = (baiguullaga as any)?.ebarimtSuuliinIlgeesenOgnoo;
    if (v) setSuuliinIlgeesen(String(v));
  }, [baiguullaga]);

  const ebarimtIlgeeye = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтэрсэн эсэхээ шалгана уу");
      return;
    }
    setLoading(true);
    try {
      const resp = await uilchilgee(token).post("/ebarimtIlgeeye", {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: barilgiinId || null,
      });
      setSuuliinIlgeesen(
        String(resp.data?.suuliinIlgeesenOgnoo || new Date().toISOString()),
      );
      toast.success("Татварт амжилттай илгээлээ");
    } catch (e) {
      console.error(e);
      toast.error("Татварт илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };
  const t = (text: string) => text;

  // Dashboard: Баримт авах (бүх) / авсан (хүчинтэй) / буцаалт (буцаасан)
  const stats = useMemo(() => {
    const niilber = (rows: TableItem[]) =>
      rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const khuchintei = displayedData.filter((r) => !r.ustgasanOgnoo);
    const butsaasan = displayedData.filter((r) => !!r.ustgasanOgnoo);
    return [
      { title: "Баримт авах тоо", value: formatNumber(displayedData.length, 0), shuult: "all" },
      { title: "Баримт авах дүн", value: formatNumber(niilber(displayedData)), shuult: "all" },
      { title: "Баримт авсан тоо", value: formatNumber(khuchintei.length, 0), shuult: "khuchintei" },
      { title: "Баримт авсан дүн", value: formatNumber(niilber(khuchintei)), shuult: "khuchintei" },
      { title: "Буцаалт хийгдсэн тоо", value: formatNumber(butsaasan.length, 0), shuult: "butsaasan", danger: true },
      { title: "Буцаалт хийгдсэн дүн", value: formatNumber(niilber(butsaasan)), shuult: "butsaasan", danger: true },
    ] as const;
  }, [displayedData]);

  // Карт дарахад тухайн төлөвөөр шүүнэ (тоо/дүн хос карт ижил шүүлттэй)
  const [activeStatFilter, setActiveStatFilter] = useState<
    "all" | "khuchintei" | "butsaasan" | null
  >(null);

  const statFilteredData = useMemo(() => {
    if (activeStatFilter === "khuchintei")
      return displayedData.filter((r) => !r.ustgasanOgnoo);
    if (activeStatFilter === "butsaasan")
      return displayedData.filter((r) => !!r.ustgasanOgnoo);
    return displayedData;
  }, [displayedData, activeStatFilter]);

  return (
    <div className="flex flex-col pb-14">
        <div className="space-y-3">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => {
              const idevkhtei = activeStatFilter === stat.shuult && stat.shuult !== "all";
              return (
                <button
                  key={stat.title}
                  type="button"
                  onClick={() =>
                    setActiveStatFilter(
                      stat.shuult === "all" || activeStatFilter === stat.shuult
                        ? null
                        : stat.shuult,
                    )
                  }
                  className={`rounded-2xl border bg-[color:var(--surface-bg)] px-5 py-4 text-left shadow-[var(--ctl-shadow)] transition-colors ${
                    idevkhtei
                      ? "border-theme ring-2 ring-theme/20"
                      : "border-[color:var(--ctl-border)] hover:border-[color:var(--ctl-border-hover)]"
                  }`}
                >
                  <div
                    className={`text-2xl font-semibold leading-tight ${
                      "danger" in stat && stat.danger ? "text-danger" : "text-[color:var(--panel-text)]"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-[color:var(--muted-text)]">
                    {stat.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filters Section */}
          <div className="rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div
                  id="ebarimt-date"
                  className="btn-minimal h-9 w-full sm:w-[300px] flex items-center px-3"
                >
                  <StandardDatePicker
                    isRange={true}
                    value={ekhlekhOgnoo ?? undefined}
                    onChange={(v) => {
                      const [s, e] = (v || [null, null]) as [any, any];
                      setEkhlekhOgnoo([
                        s ? new Date(s.valueOf()) : null,
                        e ? new Date(e.valueOf()) : null,
                      ]);
                    }}
                    allowClear
                    placeholder="Огноо сонгох"
                    classNames={{
                      root: "!h-full !w-full",
                      input:
                        "text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)] h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
                    }}
                  />
                </div>

                <label className={`filter-field w-full sm:w-[200px] ${uilchilgeeAvi ? "is-active" : ""}`}>
                  <span className="filter-field-label">Үйлчилгээ</span>
                  <select
                    value={uilchilgeeAvi ?? ""}
                    onChange={(e) => setUilchilgeeAvi(e.target.value || undefined)}
                    className="min-w-0 flex-1 cursor-pointer bg-transparent text-[13px] font-medium text-[color:var(--panel-text)] focus:outline-none"
                  >
                    <option value="">Бүгд</option>
                    <option value="zogsool">Зогсоол</option>
                    <option value="sokh">СӨХ</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-row gap-3 w-full lg:w-auto justify-end">
                <ExcelButton id="ebarimt-excel-btn" onClick={exceleerTatya} />
                <div className="flex items-center gap-2">
                  <span
                    className="whitespace-nowrap text-xs text-[color:var(--muted-text)]"
                    title="Хамгийн сүүлд татварт илгээсэн огноо"
                  >
                    Сүүлд илгээсэн:{" "}
                    <span className="font-medium text-[color:var(--panel-text)]">
                      {suuliinIlgeesen
                        ? moment(suuliinIlgeesen).format("YYYY-MM-DD HH:mm")
                        : "—"}
                    </span>
                  </span>
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
          </div>

          {khevlekhBarimt && (
            <EbarimtKhevlekhModal
              barimt={khevlekhBarimt}
              baiguullagiinNer={(baiguullaga as any)?.ner}
              onClose={() => setKhevlekhBarimt(null)}
            />
          )}

          <div className="w-full">
            <div className="allow-overflow no-scrollbar" id="ebarimt-table">
              <EbarimtTable
                data={statFilteredData}
                loading={isLoading}
                onButsaakh={
                  hasPermission(ajiltan, "/tulbur/ebarimt")
                    ? ebarimtButsaaya
                    : undefined
                }
                butsaajBaigaaId={butsaakhId}
                onKhevlekh={setKhevlekhBarimt}
              />
            </div>
            <div id="ebarimt-pagination">
              <StandardPagination
                current={1}
                total={statFilteredData.length}
                pageSize={statFilteredData.length || 50}
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
  );
}
