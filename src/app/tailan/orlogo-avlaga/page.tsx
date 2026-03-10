"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useGereeJagsaalt } from "@/lib/useGeree";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import uilchilgee from "@/lib/uilchilgee";
import useSWR from "swr";
import { useTulburFooterTotals } from "@/lib/useTulburFooterTotals";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { FileSpreadsheet, Printer } from "lucide-react";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page { size: A4 landscape; margin: 1cm; }
      body * { visibility: hidden !important; }
      .print-container, .print-container * { visibility: visible !important; }
      .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 0 !important; }
      .no-print { display: none !important; }
      table { width: 100% !important; border-collapse: collapse !important; }
      th, td { border: 1px solid #ddd !important; padding: 6px !important; font-size: 8pt !important; }
      .custom-scrollbar { overflow: visible !important; }
    }
  `}</style>
);

type TabType = "tulult" | "avlaga";

export default function OrlogoAvlagaPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
const effectiveBarilgiinId = selectedBuildingId || undefined;
  
  const baiguullagiinId = ajiltan?.baiguullagiinId ?? null;

  const [activeTab, setActiveTab] = useState<TabType>("tulult");
  const [dateRange, setDateRange] = useState<[string | null, string | null] | undefined>(undefined);
  const [filters, setFilters] = useState({ orshinSuugch: "", toot: "", davkhar: "", gereeniiDugaar: "" });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedLedger, setExpandedLedger] = useState<any[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);
const footerTotals = useTulburFooterTotals(
    token,
    ajiltan?.baiguullagiinId ?? null,
    effectiveBarilgiinId
  );
  const [paidByGereeId, setPaidByGereeId] = useState<Record<string, number>>({});
  const [uldegdelByGereeId, setUldegdelByGereeId] = useState<Record<string, number | null>>({});
  const paidRequestedRef = useRef<Set<string>>(new Set());
  const uldegdelRequestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedFilters(filters); debounceRef.current = null; }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters]);

  const emptyQuery = useMemo(() => ({}), []);

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    token && baiguullagiinId
      ? ["/nekhemjlekhiinTuukh-oa", token, baiguullagiinId, selectedBuildingId || null,
          dateRange?.[0] || null, dateRange?.[1] || null]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const resp = await uilchilgee(tkn).get("/nekhemjlekhiinTuukh", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const { data: receivableData, isLoading: isLoadingReceivable } = useSWR(
    token && baiguullagiinId
      ? ["/gereeniiTulukhAvlaga-oa", token, baiguullagiinId, selectedBuildingId || null,
          dateRange?.[0] || null, dateRange?.[1] || null]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const resp = await uilchilgee(tkn).get("/gereeniiTulukhAvlaga", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const { gereeGaralt } = useGereeJagsaalt(emptyQuery, token || undefined, baiguullagiinId || undefined, selectedBuildingId || undefined);
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(token || "", baiguullagiinId || "", emptyQuery, selectedBuildingId || undefined);

  const contractsById = useMemo(() => {
    const map: Record<string, any> = {};
    (gereeGaralt?.jagsaalt || []).forEach((g: any) => { if (g?._id) map[String(g._id)] = g; });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const contractsByNumber = useMemo(() => {
    const map: Record<string, any> = {};
    (gereeGaralt?.jagsaalt || []).forEach((g: any) => { if (g?.gereeniiDugaar) map[String(g.gereeniiDugaar)] = g; });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const residentsById = useMemo(() => {
    const map: Record<string, any> = {};
    (orshinSuugchGaralt?.jagsaalt || []).forEach((r: any) => { if (r?._id) map[String(r._id)] = r; });
    return map;
  }, [orshinSuugchGaralt?.jagsaalt]);

  const allHistoryItems = useMemo(() => {
    const invoices = Array.isArray(historyData?.jagsaalt) ? historyData.jagsaalt
      : Array.isArray(historyData) ? historyData : [];
    const receivables = Array.isArray(receivableData?.jagsaalt) ? receivableData.jagsaalt
      : Array.isArray(receivableData) ? receivableData : [];

    const combined = [...invoices];
    const trackingIds = new Set(invoices.map((it: any) => String(it._id)));
    invoices.forEach((it: any) => {
      const gList = Array.isArray(it?.medeelel?.guilgeenuud) ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud) ? it.guilgeenuud : [];
      gList.forEach((g: any) => { if (g?._id) trackingIds.add(String(g._id)); });
    });
    receivables.forEach((r: any) => { if (!trackingIds.has(String(r._id))) combined.push(r); });
    return combined;
  }, [historyData, receivableData]);

  const buildingHistoryItems = useMemo(() => {
    const bid = String(selectedBuildingId || "");
    if (!bid) return allHistoryItems;
    const toStr = (v: any) => (v == null ? "" : String(v));
    return allHistoryItems.filter((it: any) => {
      const itemBid = toStr(it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId);
      if (itemBid) return itemBid === bid;
      const cId = toStr(it?.gereeId ?? it?.gereeniiId ?? it?.kholbosonGereeniiId);
      const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
      const c = cId ? contractsById[cId] : undefined;
      const r = rId ? residentsById[rId] : undefined;
      const cbid = toStr(c?.barilgiinId ?? c?.barilga);
      const rbid = toStr(r?.barilgiinId ?? r?.barilga);
      if (cbid) return cbid === bid;
      if (rbid) return rbid === bid;
      return false;
    });
  }, [allHistoryItems, selectedBuildingId, contractsById, residentsById]);

  const deduplicatedResidents = useMemo(() => {
    const map = new Map<string, any>();
    const contractsWithEkhniiInInvoice = new Set<string>();

    buildingHistoryItems.forEach((it: any) => {
      const zardluud = Array.isArray(it?.medeelel?.zardluud) ? it.medeelel.zardluud
        : Array.isArray(it?.zardluud) ? it.zardluud : [];
      const hasEkhUld = zardluud.some((z: any) => {
        const ner = String(z?.ner || "").toLowerCase();
        return (z?.isEkhniiUldegdel === true || ner.includes("эхний үлдэгдэл") || ner.includes("ekhniuldegdel"))
          && Number(z?.dun || z?.tariff || 0) !== 0;
      });
      if (hasEkhUld) {
        const gid = String(it?.gereeniiId || it?.gereeId || "").trim();
        const gd = String(it?.gereeniiDugaar || "").trim();
        if (gid) contractsWithEkhniiInInvoice.add(gid);
        if (gd) contractsWithEkhniiInInvoice.add(gd);
      }
    });

    buildingHistoryItems.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      let gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      if (!gereeId && gereeDugaar && contractsByNumber[gereeDugaar]?._id) {
        gereeId = String(contractsByNumber[gereeDugaar]._id);
      }
      const ner = String(it?.ner || "").trim().toLowerCase();
      const utas = Array.isArray(it?.utas) ? String(it.utas[0] || "").trim() : String(it?.utas || "").trim();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key = gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;
      if (!key || key === "||") return;

      const isStandaloneEkh = it?.ekhniiUldegdelEsekh === true;
      if (isStandaloneEkh) {
        const contractHasIt =
          (gereeId && contractsWithEkhniiInInvoice.has(gereeId)) ||
          (gereeDugaar && contractsWithEkhniiInInvoice.has(gereeDugaar));
        if (contractHasIt) return;
      }

      const ct = gereeId ? contractsById[gereeId] : (gereeDugaar ? contractsByNumber[gereeDugaar] : undefined);
      const r = residentId ? residentsById[residentId] : undefined;

      if (!map.has(key)) {
        map.set(key, {
          ...it,
          _gereeId: gereeId,
          _gereeDugaar: gereeDugaar || ct?.gereeniiDugaar || it?.gereeniiDugaar || "",
          _residentId: residentId,
          _ner: r?.ner ?? it?.ner ?? ct?.ner ?? "",
          _ovog: r?.ovog ?? it?.ovog ?? ct?.ovog ?? "",
          _utas: r?.utas ?? it?.utas ?? ct?.utas ?? "",
          _toot: r?.toot ?? ct?.toot ?? it?.toot ?? it?.medeelel?.toot ?? "",
          _davkhar: r?.davkhar ?? ct?.davkhar ?? it?.davkhar ?? "",
        });
      }
    });

    return Array.from(map.values());
  }, [buildingHistoryItems, contractsByNumber, contractsById, residentsById]);

  useEffect(() => {
    if (!token || !baiguullagiinId || deduplicatedResidents.length === 0) return;
    deduplicatedResidents.forEach((it: any) => {
      const gid = it?._gereeId || "";
      if (!gid || paidRequestedRef.current.has(gid) || paidByGereeId[gid] !== undefined) return;
      paidRequestedRef.current.add(gid);
      uilchilgee(token).post("/tulsunSummary", { baiguullagiinId, gereeniiId: gid })
        .then((resp) => {
          const total = Number(resp.data?.totalTulsunDun ?? resp.data?.totalInvoicePayment ?? 0) || 0;
          setPaidByGereeId((prev) => ({ ...prev, [gid]: total }));
        })
        .catch(() => { paidRequestedRef.current.delete(gid); });
    });
  }, [token, baiguullagiinId, deduplicatedResidents]);

  useEffect(() => {
    if (!token || !baiguullagiinId || deduplicatedResidents.length === 0) return;
    deduplicatedResidents.forEach((it: any) => {
      const gid = it?._gereeId || "";
      if (!gid || uldegdelRequestedRef.current.has(gid)) return;
      const existing = uldegdelByGereeId[gid];
      if (existing !== undefined && existing !== null && Number.isFinite(existing)) return;
      uldegdelRequestedRef.current.add(gid);
      uilchilgee(token).get(`/geree/${gid}/history-ledger`, {
        params: { baiguullagiinId, ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}), _t: Date.now() },
      })
        .then((resp) => {
          const ledger = Array.isArray(resp.data?.jagsaalt) ? resp.data.jagsaalt
            : Array.isArray(resp.data?.ledger) ? resp.data.ledger
            : Array.isArray(resp.data) ? resp.data : [];
          const latestRow = ledger.length > 0 ? ledger[ledger.length - 1] : null;
          const val = latestRow?.uldegdel != null && Number.isFinite(Number(latestRow.uldegdel))
            ? Number(latestRow.uldegdel) : null;
          setUldegdelByGereeId((prev) => ({ ...prev, [gid]: val }));
        })
        .catch(() => {
          uldegdelRequestedRef.current.delete(gid);
          setUldegdelByGereeId((prev) => ({ ...prev, [gid]: null }));
        });
    });
  }, [token, baiguullagiinId, selectedBuildingId, deduplicatedResidents]);

  useEffect(() => {
    setPaidByGereeId({});
    setUldegdelByGereeId({});
    paidRequestedRef.current.clear();
    uldegdelRequestedRef.current.clear();
  }, [selectedBuildingId, baiguullagiinId, dateRange]);

  const getGereeId = (it: any) => String(it?._gereeId || it?.gereeniiId || it?.gereeId || "").trim();

  const getPaid = (it: any): number => {
    const gid = getGereeId(it);
    return gid && paidByGereeId[gid] !== undefined ? paidByGereeId[gid] : 0;
  };

  const getUldegdel = (it: any): number => {
    const gid = getGereeId(it);
    if (gid) {
      const val = uldegdelByGereeId[gid];
      if (val != null && Number.isFinite(val)) return val;
      const ct = contractsById[gid];
      if (ct?.uldegdel != null && Number.isFinite(Number(ct.uldegdel))) return Number(ct.uldegdel);
    }
    return Number(it?.uldegdel ?? 0);
  };

  const matchesFilters = (it: any): boolean => {
    const f = debouncedFilters;
    if (f.toot) {
      const toot = String(it?._toot || it?.toot || it?.medeelel?.toot || "").toLowerCase();
      if (!toot.includes(f.toot.toLowerCase())) return false;
    }
    if (f.davkhar) {
      const dv = String(it?._davkhar || it?.davkhar || "").toLowerCase();
      if (!dv.includes(f.davkhar.toLowerCase())) return false;
    }
    if (f.gereeniiDugaar) {
      const gd = String(it?._gereeDugaar || it?.gereeniiDugaar || "").toLowerCase();
      if (!gd.includes(f.gereeniiDugaar.toLowerCase())) return false;
    }
    if (f.orshinSuugch) {
      const name = `${it?._ovog || ""} ${it?._ner || ""}`.toLowerCase();
      if (!name.includes(f.orshinSuugch.toLowerCase())) return false;
    }
    return true;
  };
  const paidList = useMemo(() =>
    deduplicatedResidents.filter((it) => matchesFilters(it) && getPaid(it) > 0),
  [deduplicatedResidents, paidByGereeId, debouncedFilters]);
  const avlagaList = useMemo(() =>
    deduplicatedResidents.filter((it) => matchesFilters(it) && getUldegdel(it) > 0),
  [deduplicatedResidents, uldegdelByGereeId, debouncedFilters]);

  const displayList = activeTab === "tulult" ? paidList : avlagaList;
 const totalOrlogo = useMemo(() =>
    deduplicatedResidents.reduce((s, it) => s + getPaid(it), 0),
  [deduplicatedResidents, paidByGereeId]);

  const totalUldegdel = useMemo(() =>
    deduplicatedResidents.reduce((s, it) => s + getUldegdel(it), 0),
  [deduplicatedResidents, uldegdelByGereeId]);
  const handleRowClick = async (it: any) => {
    const gid = getGereeId(it);
    const gd = it?._gereeDugaar || it?.gereeniiDugaar || gid;
    if (expandedRow === gd) {
      setExpandedRow(null);
      setExpandedLedger([]);
      return;
    }
    setExpandedRow(gd);
    setExpandedLedger([]);
    setExpandedError(null);
    if (!gid || !baiguullagiinId) return;
    setExpandedLoading(true);
    try {
      const resp = await uilchilgee(token ?? undefined).get(`/geree/${gid}/history-ledger`, {
        params: { baiguullagiinId, ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}), _t: Date.now() },
      });
      const ledger = Array.isArray(resp.data?.jagsaalt) ? resp.data.jagsaalt
        : Array.isArray(resp.data?.ledger) ? resp.data.ledger
        : Array.isArray(resp.data) ? resp.data : [];
      setExpandedLedger(ledger);
    } catch (e: any) {
      setExpandedError(e?.response?.data?.aldaa || e.message || "Алдаа гарлаа");
    } finally {
      setExpandedLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!displayList.length) return;
    const headers = activeTab === "tulult"
      ? ["№", "ГД", "Нэр", "Давхар", "Тоот", "Төлсөн (₮)"]
      : ["№", "ГД", "Нэр", "Давхар", "Тоот", "Үлдэгдэл (₮)", "Төлсөн (₮)"];
    const rows = displayList.map((it, i) => {
      const base = [i + 1, `"${it._gereeDugaar || ""}"`, `"${[it._ovog, it._ner].filter(Boolean).join(" ") || ""}"`,
        `"${it._davkhar || ""}"`, `"${it._toot || ""}"`];
      if (activeTab === "tulult") return [...base, getPaid(it)].join(",");
      return [...base, getUldegdel(it), getPaid(it)].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orlogo_avlaga_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const isLoading = isLoadingHistory || isLoadingReceivable;
  const paginatedList = displayList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("mn-MN") : "-";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="p-6 print-container">
      <PrintStyles />

      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold">Орлого авлагын товчоо</h1>
        <div className="flex gap-3">
          <button onClick={exportToExcel}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel татах
          </button>
          <button onClick={() => window.print()}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm">
            <Printer className="w-4 h-4 text-blue-600" /> Хэвлэх
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print mb-4">
        <div className="p-3 rounded-xl mt-4">
          <DatePickerInput type="range" locale="mn" value={dateRange} onChange={setDateRange}
            size="sm" radius="md" variant="filled" dropdownType="popover"
            popoverProps={{ position: "bottom-start", withinPortal: true, width: 320 }}
            clearable placeholder="Огноо сонгох"
            classNames={{ input: "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-full flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden" }} />
        </div>
        {[
          { key: "orshinSuugch", label: "Оршин суугч", placeholder: "Овог, нэрээр хайх" },
          { key: "toot", label: "Тоот", placeholder: "Тоот" },
          { key: "davkhar", label: "Давхар", placeholder: "Давхар" },
          { key: "gereeniiDugaar", label: "Гэрээний дугаар", placeholder: "ГД" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="p-3 rounded-xl">
            <label className="block text-sm text-theme/80 mb-1.5">{label}</label>
            <input type="text" value={(filters as any)[key]}
              onChange={(e) => setFilters((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder={placeholder} />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 no-print">
        {([["tulult", "Орлого"], ["avlaga", "Авлага"]] as [TabType, string][]).map(([tab, label]) => (
          <button key={tab} type="button"
            onClick={() => { setActiveTab(tab); setExpandedRow(null); setExpandedLedger([]); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === tab ? "neu-panel bg-white/20 border border-white/20" : "hover:menu-surface"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="mb-2">Нийт орлого <span className="text-xs text-theme/50">(Гүйцэтгэл)</span></h3>
          <p className="text-2xl text-green-600">{formatNumber(totalOrlogo)} ₮</p>
          <p className="text-xs text-theme/50 mt-1">{paidList.length} оршин суугч</p>
        </div>
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="mb-2">Нийт үлдэгдэл <span className="text-xs text-theme/50">(Үлдэгдэл)</span></h3>
          <p className={totalUldegdel < 0 ? "text-2xl text-emerald-600" : "text-2xl text-red-600"}>{formatNumber(totalUldegdel)} ₮</p>
          <p className="text-xs text-theme/50 mt-1">Бүх оршин суугчдын нийт үлдэгдэл</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="!max-h-[30vh] overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs text-theme text-center whitespace-nowrap w-10">№</th>
                  <th className="z-10 p-3 text-xs text-theme text-center whitespace-nowrap">ГД</th>
                  <th className="z-10 p-3 text-xs text-theme text-left whitespace-nowrap">Нэр</th>
                  <th className="z-10 p-3 text-xs text-theme text-center whitespace-nowrap">Давхар</th>
                  <th className="z-10 p-3 text-xs text-theme text-center whitespace-nowrap">Тоот</th>
                  {activeTab === "tulult" ? (
                    <th className="z-10 p-3 text-xs text-theme text-right whitespace-nowrap">Гүйцэтгэл</th>
                  ) : (
                    <>
                      <th className="z-10 p-3 text-xs text-theme text-right whitespace-nowrap">Үлдэгдэл</th>
                      <th className="z-10 p-3 text-xs text-theme text-right whitespace-nowrap">Гүйцэтгэл</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "tulult" ? 6 : 7} className="p-8 text-center text-theme/60">
                      Мэдээлэл алга байна
                    </td>
                  </tr>
                ) : paginatedList.map((it, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const gd = it?._gereeDugaar || it?.gereeniiDugaar || "-";
                  const isExpanded = expandedRow === gd;
                  const paid = getPaid(it);
                  const uldegdel = getUldegdel(it);
                  const colSpan = activeTab === "tulult" ? 6 : 7;

                  return (
                    <React.Fragment key={`${gd}-${idx}`}>
                      <tr className="transition-colors border-b last:border-b-0 hover:bg-[color:var(--surface-hover)]/20">
                        <td className="p-3 text-center text-theme whitespace-nowrap">{rowNum}</td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">{gd}</td>
                        <td className="p-3 text-left text-theme whitespace-nowrap">
                          {[it._ovog, it._ner].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">{it._davkhar || "-"}</td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">{it._toot || "-"}</td>

                        {activeTab === "tulult" ? (
                          <td className="p-3 text-right whitespace-nowrap">
                            <button type="button" onClick={() => handleRowClick(it)}
                              className="text-theme hover:underline cursor-pointer inline-flex items-center gap-1">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <span className="text-green-600 font-medium">{formatNumber(paid)} ₮</span>
                            </button>
                          </td>
                        ) : (
                          <>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button type="button" onClick={() => handleRowClick(it)}
                                className="hover:underline cursor-pointer inline-flex items-center gap-1">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                <span className={uldegdel > 0 ? "text-red-500 font-medium" : uldegdel < 0 ? "text-emerald-600 font-medium" : "text-theme"}>
                                  {formatNumber(uldegdel)} ₮
                                </span>
                              </button>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <span className="text-green-600">{formatNumber(paid)} ₮</span>
                            </td>
                          </>
                        )}
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={colSpan} className="p-4 bg-[color:var(--surface-hover)]/20 border-b">
                            {expandedLoading ? (
                              <div className="py-4 text-center text-theme/60">Уншиж байна...</div>
                            ) : expandedError ? (
                              <div className="text-red-500 py-2">Алдаа: {expandedError}</div>
                            ) : expandedLedger.length === 0 ? (
                              <div className="py-4 text-center text-theme/60">Тэмдэглэл алга байна</div>
                            ) : (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold mb-2">
                                  Дэлгэрэнгүй ({gd})
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left p-2 whitespace-nowrap">№</th>
                                        <th className="text-left p-2 whitespace-nowrap">Огноо</th>
                                        <th className="text-left p-2 whitespace-nowrap">Тайлбар</th>
                                        <th className="text-right p-2 whitespace-nowrap">Авлага</th>
                                        <th className="text-right p-2 whitespace-nowrap">Төлөлт</th>
                                        <th className="text-right p-2 whitespace-nowrap font-semibold">Үлдэгдэл</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedLedger.map((row: any, ri: number) => {
                                        const avlaga = Number(row?.avlagaDun ?? row?.tulukhDun ?? row?.debit ?? 0) || 0;
                                        const tulult = Number(row?.tulsunDun ?? row?.tulult ?? row?.credit ?? 0) || 0;
                                        const uldeg = Number(row?.uldegdel ?? 0);
                                        const tailbar = row?.tailbar || row?.ner || row?.turul || "-";
                                        const ognoo = fmtDate(row?.ognoo || row?.createdAt);
                                        return (
                                          <tr key={ri} className="border-b hover:bg-[color:var(--surface-hover)]/10">
                                            <td className="p-2 text-theme/60">{ri + 1}</td>
                                            <td className="p-2 whitespace-nowrap text-theme/70">{ognoo}</td>
                                            <td className="p-2 text-theme/80 max-w-[180px] truncate" title={tailbar}>{tailbar}</td>
                                            <td className="p-2 text-right whitespace-nowrap">
                                              {avlaga > 0 ? <span className="text-red-500">{formatNumber(avlaga)} ₮</span> : "-"}
                                            </td>
                                            <td className="p-2 text-right whitespace-nowrap">
                                              {tulult > 0 ? <span className="text-green-600">{formatNumber(tulult)} ₮</span> : "-"}
                                            </td>
                                            <td className="p-2 text-right whitespace-nowrap font-medium">
                                              <span className={uldeg > 0 ? "text-red-500" : uldeg < 0 ? "text-emerald-600" : "text-theme"}>
                                                {formatNumber(uldeg)} ₮
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t-2 font-semibold">
                                        <td colSpan={3} className="p-2 text-right text-xs text-theme/60">Эцсийн үлдэгдэл:</td>
                                        <td className="p-2 text-right">
                                          <span className="text-red-500">
                                            {formatNumber(expandedLedger.reduce((s, r) => s + (Number(r?.avlagaDun ?? r?.tulukhDun ?? r?.debit ?? 0) || 0), 0))} ₮
                                          </span>
                                        </td>
                                        <td className="p-2 text-right">
                                          <span className="text-green-600">
                                            {formatNumber(expandedLedger.reduce((s, r) => s + (Number(r?.tulsunDun ?? r?.tulult ?? r?.credit ?? 0) || 0), 0))} ₮
                                          </span>
                                        </td>
                                        <td className="p-2 text-right">
                                          {(() => {
                                            const last = expandedLedger[expandedLedger.length - 1];
                                            const v = Number(last?.uldegdel ?? 0);
                                            return (
                                              <span className={v > 0 ? "text-red-500" : v < 0 ? "text-emerald-600" : "text-theme"}>
                                                {formatNumber(v)} ₮
                                              </span>
                                            );
                                          })()}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between no-print mt-3">
        <div className="text-sm text-theme/70">
          Нийт: {displayList.length} &nbsp;|&nbsp;
          <span className="text-green-600">Орлого: {paidList.length}</span>&nbsp;
          <span className="text-red-500">Авлага: {avlagaList.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <PageSongokh value={pageSize} onChange={(v) => { setPageSize(v); setCurrentPage(1); }} className="text-xs" />
          <div className="flex items-center gap-1">
            <button className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>Өмнөх</button>
            <div className="text-theme/70 px-2">{currentPage} / {Math.max(1, Math.ceil(displayList.length / pageSize))}</div>
            <button className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage * pageSize >= displayList.length} onClick={() => setCurrentPage(currentPage + 1)}>Дараах</button>
          </div>
        </div>
      </div>
    </div>
  );
}
