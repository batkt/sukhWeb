"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import uilchilgee from "@/lib/uilchilgee";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";

interface OrlogoAvlagaItem {
  gereeniiDugaar: string;
  ovog: string;
  ner: string;
  utas: string[];
  toot: string;
  davkhar: string;
  bairNer?: string;
  orts?: string;
  niitTulbur?: number;
  tulbur?: number;
  uldegdel?: number;
  tulsunDun?: number;
}

type TabType = "tulult" | "avlaga";

export default function OrlogoAvlagaPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const [activeTab, setActiveTab] = useState<TabType>("tulult");
  const [paidList, setPaidList] = useState<any[]>([]);
  const [unpaidList, setUnpaidList] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([
    new Date().toISOString().split("T")[0],
    new Date().toISOString().split("T")[0],
  ]);
  const [filters, setFilters] = useState({
    orshinSuugch: "",
    toot: "",
    davkhar: "",
    gereeniiDugaar: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<any | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBuildingId || !baiguullaga) return;

      try {
        setLoading(true);
        const response = await uilchilgee(token ?? undefined).post(
          "/tailan/orlogo-avlaga",
          {
            baiguullagiinId: baiguullaga._id,
            barilgiinId: selectedBuildingId,
            bairNer: undefined,
            orts: undefined,
            davkhar: debouncedFilters.davkhar || undefined,
            toot: debouncedFilters.toot || undefined,
            gereeniiDugaar: debouncedFilters.gereeniiDugaar || undefined,
            orshinSuugch: debouncedFilters.orshinSuugch || undefined,
            ekhlekhOgnoo: dateRange?.[0] || undefined,
            duusakhOgnoo: dateRange?.[1] || undefined,
          }
        );
        setApiResponse(response.data);
        const rawPaid = Array.isArray(response.data?.paid?.list)
          ? response.data.paid.list
          : [];
        const unpaid = Array.isArray(response.data?.unpaid?.list)
          ? response.data.unpaid.list
          : [];
        const getPaidAmount = (item: any) => {
          return Number(
            item?.tulsunDun ?? 
            item?.tulsun ?? 
            item?.totalTulsunDun ?? 
            item?.totalPrepayment ?? 
            item?.niitTulbur ?? 
            item?.tulbur ?? 
            item?.paidAmount ?? 0
          ) || 0;
        };

        const paid = rawPaid.filter((item: any) => item?.tuluv === "Төлсөн" || getPaidAmount(item) > 0);
        setPaidList(paid);
        setUnpaidList(unpaid);
      } catch (err: any) {
        setError(err?.response?.data?.aldaa || err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBuildingId, baiguullaga, token, dateRange, debouncedFilters]);

  const totalOrlogo = useMemo(() => {
    return paidList.reduce((sum, item) => {
      const amt = Number(
        item?.tulsunDun ?? 
        item?.tulsun ?? 
        item?.totalTulsunDun ?? 
        item?.totalPrepayment ?? 
        item?.niitTulbur ?? 
        item?.tulbur ?? 
        item?.paidAmount ?? 0
      ) || 0;
      return sum + amt;
    }, 0);
  }, [paidList]);
  const totalZarlaga = useMemo(
    () => apiResponse?.unpaid?.sum || 0,
    [apiResponse]
  );
  const totalUldegdel = useMemo(
    () => totalOrlogo - totalZarlaga,
    [totalOrlogo, totalZarlaga]
  );

  const fetchNekhData = async (gereeniiDugaar: string) => {
    if (!baiguullaga || !selectedBuildingId) return;
    setExpandedLoading(true);
    setExpandedError(null);
    try {
      const resp = await uilchilgee(token ?? undefined).post(
        "/tailan/nekhemjlekhiin-tuukh",
        {
          baiguullagiinId: baiguullaga._id,
          barilgiinId: selectedBuildingId,
          gereeniiDugaar,
          khuudasniiKhemjee: 1000,
        }
      );
      const raw = Array.isArray(resp.data?.list)
        ? resp.data.list
        : Array.isArray(resp.data)
        ? resp.data
        : [];

      const formatOgnoo = (d: string) =>
        d
          ? d.split("T")[0].replace(/-/g, ".") +
            (d.includes("T") ? " " + (d.split("T")[1]?.slice(0, 8) || "") : "")
          : "-";

      const pickAmount = (obj: any) => {
        const n = (v: any) => {
          const num = Number(v);
          return Number.isFinite(num) ? num : 0;
        };
        const dun = n(obj?.dun);
        if (dun !== 0) return dun;
        const td = n(obj?.tulukhDun);
        if (td !== 0) return td;
        const tar = n(obj?.tariff);
        if (tar !== 0) return tar;
        const amt = n(obj?.amount);
        if (amt !== 0) return amt;
        return 0;
      };

      const detailRows: Array<{
        ognoo: string;
        tailbar: string;
        tulukhDun: number;
        tulsunDun: number;
      }> = [];

      raw.forEach((r: any) => {
        const itemDate = r.ognoo || r.nekhemjlekhiinOgnoo || r.createdAt || "";
        const ognooStr = formatOgnoo(itemDate);

        const zardluud =
          Array.isArray(r?.nememjlekh?.zardluud) ? r.nememjlekh.zardluud
          : Array.isArray(r?.medeelel?.zardluud) ? r.medeelel.zardluud
          : Array.isArray(r?.zardluud) ? r.zardluud : [];
        const guilgeenuud =
          Array.isArray(r?.nememjlekh?.guilgeenuud) ? r.nememjlekh.guilgeenuud
          : Array.isArray(r?.medeelel?.guilgeenuud) ? r.medeelel.guilgeenuud
          : Array.isArray(r?.guilgeenuud) ? r.guilgeenuud : [];

        const invoiceTotal = Number(r.niitTulbur ?? r.tulbur ?? r.niitDun ?? 0) || 0;
        const zardalWithNer = zardluud.filter((z: any) => z.ner);
        zardalWithNer.forEach((z: any) => {
          let amt = pickAmount(z);
          if (amt === 0 && invoiceTotal > 0 && zardalWithNer.length > 0) {
            amt = Math.round((invoiceTotal / zardalWithNer.length) * 100) / 100;
          }
          if (amt > 0) {
            const isPaid = r.tuluv === "Төлсөн";
            detailRows.push({
              ognoo: ognooStr,
              tailbar: z.tailbar || z.ner,
              tulukhDun: amt,
              tulsunDun: isPaid ? amt : 0,
            });
          }
        });

        guilgeenuud.forEach((g: any) => {
          const amt = Number(g.tulukhDun || 0);
          const paid = Number(g.tulsunDun || 0);
          if (amt > 0) {
            detailRows.push({
              ognoo: ognooStr,
              tailbar: g.tailbar || "Авлага",
              tulukhDun: amt,
              tulsunDun: 0,
            });
          }
          if (paid > 0) {
            detailRows.push({
              ognoo: ognooStr,
              tailbar: g.tailbar || "Төлөлт",
              tulukhDun: 0,
              tulsunDun: paid,
            });
          }
        });

        const hasChildren = zardluud.length > 0 || guilgeenuud.length > 0;
        if (
          !hasChildren &&
          r.turul &&
          (r.turul === "ashiglalt" || r.turul === "avlaga" || r.turul === "tulult" || r.turul === "voucher" || r.turul === "turgul")
        ) {
          const amt = Number(r.tulukhDun || r.dun || 0);
          const tulsunAmt = Number(r.tulsunDun || 0);
          if (r.turul === "tulult" && (tulsunAmt > 0 || Math.abs(amt) > 0)) {
            detailRows.push({
              ognoo: ognooStr,
              tailbar: r.tailbar || "Төлөлт",
              tulukhDun: 0,
              tulsunDun: tulsunAmt > 0 ? tulsunAmt : Math.abs(amt),
            });
          } else if (r.turul === "ashiglalt" && (tulsunAmt > 0 || Math.abs(amt) > 0)) {
            detailRows.push({
              ognoo: ognooStr,
              tailbar: r.tailbar || "Ашиглалт",
              tulukhDun: 0,
              tulsunDun: tulsunAmt > 0 ? tulsunAmt : Math.abs(amt),
            });
          } else if ((r.turul === "avlaga" || r.turul === "turgul" || r.turul === "voucher") && amt > 0) {
            const name = r.turul === "avlaga" ? "Авлага" : r.turul === "turgul" ? "Торгууль" : "Voucher";
            detailRows.push({
              ognoo: ognooStr,
              tailbar: r.tailbar || name,
              tulukhDun: amt,
              tulsunDun: 0,
            });
          }
        }

        if (zardluud.length === 0 && guilgeenuud.length === 0 && !hasChildren) {
          const amt = Number(r.niitTulbur ?? r.tulbur ?? r.niitDun ?? 0) || 0;
          if (amt > 0) {
            detailRows.push({
              ognoo: ognooStr,
              tailbar: r.tailbar || r.dugaalaltDugaar || r.gereeniiDugaar || "Нэхэмжлэх",
              tulukhDun: amt,
              tulsunDun: r.tuluv === "Төлсөн" ? amt : 0,
            });
          }
        }
      });

      detailRows.sort((a, b) => {
        const dA = new Date(a.ognoo.replace(/\./g, "-")).getTime();
        const dB = new Date(b.ognoo.replace(/\./g, "-")).getTime();
        return dA - dB;
      });

      const sumTulukh = detailRows.reduce((s: number, row: any) => s + (row.tulukhDun || 0), 0);
      const sumTulsun = detailRows.reduce((s: number, row: any) => s + (row.tulsunDun || 0), 0);
      setExpandedData({
        rows: detailRows,
        sumTulukh,
        sumTulsun,
        raw,
      });
    } catch (e: any) {
      setExpandedError(
        e?.response?.data?.aldaa || e.message || "Unknown error"
      );
      setExpandedData(null);
    } finally {
      setExpandedLoading(false);
    }
  };

  const handleAmountClick = (gereeniiDugaar: string) => {
    if (expandedRow === gereeniiDugaar) {
      setExpandedRow(null);
      setExpandedData(null);
      return;
    }
    setExpandedRow(gereeniiDugaar);
    fetchNekhData(gereeniiDugaar);
  };

  const displayList =
    activeTab === "tulult" ? paidList : unpaidList;

  const getItemAmount = (item: any) => {
    const amt = item?.tulsunDun ?? item?.tulsun ?? item?.totalTulsunDun ?? item?.totalPrepayment ?? item?.niitTulbur ?? item?.tulbur ?? item?.sum ?? item?.amount ?? 0;
    return Number(amt) || 0;
  };

  const getItemTulukh = (item: any) => {
    return Number(item?.uldegdel ?? item?.niitTulbur ?? item?.tulbur ?? 0) || 0;
  };

  const getItemTulsun = (item: any) => {
    return Number(item?.tulsunDun ?? item?.tulsun ?? item?.totalTulsunDun ?? item?.totalPrepayment ?? item?.niitTulbur ?? item?.tulbur ?? 0) || 0;
  };

  const paginatedList = displayList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Уншиж байна...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Алдаа: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl">Авлагын товчоо</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-3 rounded-xl mt-6">
          <DatePickerInput
            type="range"
            locale="mn"
            value={dateRange}
            onChange={setDateRange}
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
                "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-full flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden",
            }}
          />
        </div>
        <div className="p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">Оршин суугч</label>
          <input
            type="text"
            value={filters.orshinSuugch}
            onChange={(e) => setFilters((p) => ({ ...p, orshinSuugch: e.target.value }))}
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Овог, нэрээр хайх"
          />
        </div>
        <div className="p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">Тоот</label>
          <input
            type="text"
            value={filters.toot}
            onChange={(e) => setFilters((p) => ({ ...p, toot: e.target.value }))}
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Тоот"
          />
        </div>
        <div className="p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">Давхар</label>
          <input
            type="text"
            value={filters.davkhar}
            onChange={(e) => setFilters((p) => ({ ...p, davkhar: e.target.value }))}
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Давхар"
          />
        </div>
        <div className="p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">Гэрээний дугаар</label>
          <input
            type="text"
            value={filters.gereeniiDugaar}
            onChange={(e) => setFilters((p) => ({ ...p, gereeniiDugaar: e.target.value }))}
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="ГД"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("tulult");
            setExpandedRow(null);
            setExpandedData(null);
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl  transition-all ${
            activeTab === "tulult"
              ? "neu-panel bg-white/20 border border-white/20"
              : "hover:menu-surface"
          }`}
        >
          Орлого
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("avlaga");
            setExpandedRow(null);
            setExpandedData(null);
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl  transition-all ${
            activeTab === "avlaga"
              ? "neu-panel bg-white/20 border border-white/20"
              : "hover:menu-surface"
          }`}
        >
          Авлага
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="neu-panel p-4 rounded-xl">
          <h3 className=" mb-2">Нийт орлого</h3>
          <p className="text-2xl text-green-600">
            {formatNumber(totalOrlogo)} ₮
          </p>
        </div>
        <div className="neu-panel p-4 rounded-xl">
          <h3 className=" mb-2">Нийт авлага</h3>
          <p className="text-2xl text-red-600">
            {formatNumber(totalZarlaga)} ₮
          </p>
        </div>
        
      </div>

      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    ГД
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Давхар
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Тоот
                  </th>
                  {activeTab === "tulult" ? (
                    <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                      Төлөлт
                    </th>
                  ) : (
                    <>
                      <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                        Төлөх дүн
                      </th>
                      <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                        Төлсөн
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === "tulult" ? 6 : 7}
                      className="p-8 text-center text-theme/60"
                    >
                      Мэдээлэл алга байна
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((item, idx) => {
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                    const gd = item.gereeniiDugaar || "-";
                    const isExpanded = expandedRow === gd;

                    return (
                      <React.Fragment key={`${gd}-${idx}`}>
                        <tr
                          key={`${gd}-${idx}`}
                          className="transition-colors border-b last:border-b-0"
                        >
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {rowNum}
                          </td>
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {gd}
                          </td>
                          <td className="p-3 text-left text-theme whitespace-nowrap">
                            {[item.ovog, item.ner].filter(Boolean).join(" ") || "-"}
                          </td>
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {item.davkhar || "-"}
                          </td>
                          <td className="p-3 text-center text-theme whitespace-nowrap">
                            {item.toot || item.medeelel?.toot || item.nememjlekh?.toot || item.gerchigee?.toot || "-"}
                          </td>
                          {activeTab === "tulult" ? (
                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleAmountClick(gd)}
                                className="text-theme  hover:underline cursor-pointer inline-flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                {formatNumber(getItemAmount(item))} ₮
                              </button>
                            </td>
                          ) : (
                            <>
                              <td className="p-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleAmountClick(gd)}
                                  className="text-theme  hover:underline cursor-pointer inline-flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                  {formatNumber(getItemTulukh(item))} ₮
                                </button>
                              </td>
                              <td className="p-3 text-right text-theme whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleAmountClick(gd)}
                                  className="text-theme  hover:underline cursor-pointer inline-flex items-center gap-1"
                                >
                                  {formatNumber(getItemTulsun(item))} ₮
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                        {isExpanded && (
                          <tr key={`${gd}-exp-${idx}`}>
                            <td
                              colSpan={activeTab === "tulult" ? 6 : 7}
                              className="p-4 bg-[color:var(--surface-hover)]/30 border-b"
                            >
                              {expandedLoading ? (
                                <div className="py-4 text-center">
                                  Уншиж байна...
                                </div>
                              ) : expandedError ? (
                                <div className="text-red-500 py-2">
                                  Алдаа: {expandedError}
                                </div>
                              ) : expandedData ? (
                                <div className="space-y-3">
                                  <h4 className=" text-sm">
                                    {activeTab === "tulult"
                                      ? "Төлөлтийн дэлгэрэнгүй"
                                      : "Авлагын дэлгэрэнгүй"}{" "}
                                    — {gd}
                                  </h4>
                                  <table className="w-auto text-sm table-fixed">
                                    <thead>
                                      <tr>
                                        <th className="text-left p-2 w-10">№</th>
                                        <th className="text-left p-2 w-28">Огноо</th>
                                        <th className="text-left p-2 w-40">Тайлбар</th>
                                        {activeTab === "avlaga" && (
                                          <th className="text-center p-2 w-24">
                                            Төлөх дүн
                                          </th>
                                        )}
                                        <th className="text-center p-2 w-24">
                                          Төлсөн дүн
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedData.rows.map(
                                        (r: any, ri: number) => (
                                          <tr key={ri} className="border-t">
                                            <td className="p-2">{ri + 1}</td>
                                            <td className="p-2">{r.ognoo}</td>
                                            <td className="p-2 truncate" title={r.tailbar}>{r.tailbar}</td>
                                            {activeTab === "avlaga" && (
                                              <td className="p-2 text-right">
                                                {formatNumber(r.tulukhDun || 0)}{" "}
                                                ₮
                                              </td>
                                            )}
                                            <td className="p-2 text-right">
                                              {formatNumber(r.tulsunDun || 0)} ₮
                                            </td>
                                          </tr>
                                        )
                                      )}
                                      <tr className="border-t-2 ">
                                        <td className="p-2" />
                                        <td className="p-2" />
                                        <td className="p-2" />
                                        {activeTab === "avlaga" && (
                                          <td className="p-2 text-right">
                                            {formatNumber(
                                              expandedData.sumTulukh
                                            )}{" "}
                                            ₮
                                          </td>
                                        )}
                                        <td className="p-2 text-right whitespace-nowrap">
                                          Нийт {formatNumber(
                                            expandedData.sumTulsun
                                          )}{" "}
                                          ₮
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-theme/70">
          Нийт: {displayList.length}
        </div>
        <div className="flex items-center gap-3">
          <PageSongokh
            value={pageSize}
            onChange={(v) => {
              setPageSize(v);
              setCurrentPage(1);
            }}
            className="text-xs"
          />
          <div className="flex items-center gap-1">
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Өмнөх
            </button>
            <div className="text-theme/70 px-1">{currentPage}</div>
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage * pageSize >= displayList.length}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Дараах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
