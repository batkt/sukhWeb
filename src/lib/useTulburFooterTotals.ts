"use client";

import useSWR from "swr";
import uilchilgee from "./uilchilgee";
import useGereeJagsaalt from "./useGeree";
import { useOrshinSuugchJagsaalt } from "./useOrshinSuugch";
import { useMemo, useEffect, useState, useRef } from "react";
import { getDefaultDateRange } from "./utils";
import { itemPrimaryDateMs } from "../app/tulbur/guilgeeTuukh/ledgerRunningBalances";
import { aggregateLedgerTulsunByGereeIdInRange } from "../app/tulbur/guilgeeTuukh/guilgeePaidDisplay";

export function useTulburFooterTotals(
  token: string | null,
  baiguullagiinId: string | null,
  barilgiinId: string | undefined,
  startDate?: string | null,
  endDate?: string | null
) {
  const emptyQuery = useMemo(() => ({}), []);
  const { gereeGaralt } = useGereeJagsaalt(
    emptyQuery,
    token || undefined,
    baiguullagiinId || undefined,
    barilgiinId
  );
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    baiguullagiinId || "",
    emptyQuery,
    barilgiinId
  );

  const contractsByNumber = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?.gereeniiDugaar) map[String(g.gereeniiDugaar)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const contractsById = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?._id) map[String(g._id)] = g;
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

  const { data: historyData } = useSWR(
    token && baiguullagiinId
      ? ["/nekhemjlekhiinTuukh-footer", token, baiguullagiinId, barilgiinId, startDate, endDate]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const resp = await uilchilgee(tkn).get("/nekhemjlekhiinTuukh", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
          query: { baiguullagiinId: bId, ...(barId ? { barilgiinId: barId } : {}) },
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const { data: receivableData } = useSWR(
    token && baiguullagiinId
      ? ["/gereeniiTulukhAvlaga-footer", token, baiguullagiinId, barilgiinId, startDate, endDate]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const resp = await uilchilgee(tkn).get("/gereeniiTulukhAvlaga", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const { data: paymentRecordsData } = useSWR(
    token && baiguullagiinId
      ? ["/gereeniiTulsunAvlaga-footer", token, baiguullagiinId, barilgiinId, startDate, endDate]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const resp = await uilchilgee(tkn).get("/gereeniiTulsunAvlaga", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const allHistoryItems = useMemo(() => {
    const invoices = Array.isArray(historyData?.jagsaalt)
      ? historyData.jagsaalt
      : Array.isArray(historyData)
        ? historyData
        : [];
    const receivables = Array.isArray(receivableData?.jagsaalt)
      ? receivableData.jagsaalt
      : Array.isArray(receivableData)
        ? receivableData
        : [];
    const payments = Array.isArray(paymentRecordsData?.jagsaalt)
      ? paymentRecordsData.jagsaalt
      : Array.isArray(paymentRecordsData)
        ? paymentRecordsData
        : [];

    const combined = [...invoices];
    const trackingIds = new Set(invoices.map((it: any) => String(it._id)));
    invoices.forEach((it: any) => {
      const gList = Array.isArray(it?.medeelel?.guilgeenuud)
        ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud)
          ? it.guilgeenuud
          : [];
      
      const pList = Array.isArray(it?.paymentHistory) ? it.paymentHistory : [];

      [...gList, ...pList].forEach((g: any) => {
        const id = String(g?._id || g?.guilgeeniiId || "");
        if (id && !id.startsWith("sync_")) trackingIds.add(id);
      });
    });

    receivables.forEach((r: any) => {
      if (!trackingIds.has(String(r._id))) combined.push(r);
    });

    payments.forEach((p: any) => {
      if (!trackingIds.has(String(p._id))) combined.push(p);
    });

    return combined;
  }, [historyData, receivableData, paymentRecordsData]);

  const buildingHistoryItems = useMemo(() => {
    const bid = String(barilgiinId || "");
    if (!bid) return allHistoryItems;
    const toStr = (v: any) => (v == null ? "" : String(v));
    return allHistoryItems.filter((it: any) => {
      const itemBid = toStr(
        it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId
      );
      if (itemBid) return itemBid === bid;
      const cId = toStr(
        it?.gereeId ?? it?.gereeniiId ?? it?.contractId ?? it?.kholbosonGereeniiId
      );
      const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
      const c = cId ? (contractsByNumber as any)[cId] : undefined;
      const r = rId ? (residentsById as any)[rId] : undefined;
      const cbid = toStr(c?.barilgiinId ?? c?.barilga ?? c?.barilgaId ?? c?.branchId);
      const rbid = toStr(r?.barilgiinId ?? r?.barilga ?? r?.barilgaId ?? r?.branchId);
      if (cbid) return cbid === bid;
      if (rbid) return rbid === bid;
      return false;
    });
  }, [allHistoryItems, barilgiinId, contractsByNumber, residentsById]);

  const deduplicatedResidents = useMemo(() => {
    const map = new Map<string, any>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];
    allGerees.forEach((g: any) => {
      const gereeId = String(g?._id || g?.gereeniiId || g?.gereeId || "").trim();
      const gereeDugaar = String(g?.gereeniiDugaar || "").trim();
      const key = gereeId || gereeDugaar;
      if (key && !map.has(key)) {
        map.set(key, { ...g, _gereeniiId: gereeId });
      }
    });

    buildingHistoryItems.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      const resGid = gereeId || (gereeDugaar && (contractsByNumber as any)[gereeDugaar]?._id ? String((contractsByNumber as any)[gereeDugaar]._id) : "");
      
      const ner = String(it?.ner || "").trim().toLowerCase();
      const utas = Array.isArray(it?.utas) ? String(it.utas[0] || "").trim() : String(it?.utas || "").trim();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key = resGid || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return;
      if (!map.has(key)) {
        map.set(key, { ...it, _gereeniiId: resGid });
      }
    });

    return Array.from(map.values());
  }, [buildingHistoryItems, contractsByNumber, gereeGaralt?.jagsaalt]);

  const [paidSummaryByGereeId, setPaidSummaryByGereeId] = useState<Record<string, number>>({});
  const paidRequestedRef = useRef<Set<string>>(new Set());

  const [uldegdelByGereeId, setUldegdelByGereeId] = useState<Record<string, number | null>>({});
  const [ekhniiUldegdelByGereeId, setEkhniiUldegdelByGereeId] = useState<Record<string, number | null>>({});
  const [ledgerBilledByGid, setLedgerBilledByGid] = useState<Record<string, number>>({});
  const [ledgerPaidByGid, setLedgerPaidByGid] = useState<Record<string, number>>({});
  const uldegdelRequestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setPaidSummaryByGereeId({});
    paidRequestedRef.current.clear();
    setUldegdelByGereeId({});
    setEkhniiUldegdelByGereeId({});
    setLedgerBilledByGid({});
    setLedgerPaidByGid({});
    uldegdelRequestedRef.current.clear();
  }, [historyData, receivableData, paymentRecordsData, startDate, endDate]);

  useEffect(() => {
    if (!token || !baiguullagiinId || deduplicatedResidents.length === 0) return;
    deduplicatedResidents.forEach((it: any) => {
      const gid = (it?.gereeniiId && String(it.gereeniiId)) || (it?._gereeniiId && String(it._gereeniiId)) || "";
      if (!gid || paidRequestedRef.current.has(gid)) return;
      paidRequestedRef.current.add(gid);
      uilchilgee(token).post("/tulsunSummary", { baiguullagiinId, gereeniiId: gid }).then((resp) => {
        const total = Number(resp.data?.totalTulsunDun ?? resp.data?.totalInvoicePayment ?? 0) || 0;
        setPaidSummaryByGereeId((prev) => ({ ...prev, [gid]: total }));
      }).catch(() => { paidRequestedRef.current.delete(gid); });
    });
  }, [token, baiguullagiinId, deduplicatedResidents]);

  useEffect(() => {
    if (!token || !baiguullagiinId || deduplicatedResidents.length === 0) return;
    deduplicatedResidents.forEach((it: any) => {
      const gid = (it?.gereeniiId && String(it.gereeniiId)) || (it?._gereeniiId && String(it._gereeniiId)) || "";
      if (!gid || uldegdelRequestedRef.current.has(gid)) return;
      uldegdelRequestedRef.current.add(gid);
      uilchilgee(token).get(`/geree/${gid}/history-ledger`, { params: { baiguullagiinId, _t: Date.now() } }).then((resp) => {
        const ledger = resp.data?.jagsaalt || resp.data?.ledger || resp.data || [];
        
        let filteredLedger = ledger;
        if (endDate || startDate) {
          const startMs = startDate ? new Date(startDate as string).getTime() : 0;
          const endObj = new Date((endDate || startDate) as string);
          endObj.setHours(23, 59, 59, 999);
          const endMs = endObj.getTime();
          
          let pBilled = 0;
          let pPaid = 0;

          // Full ledger is sorted by backend. Identify rows within range.
          const inRangeRows = ledger.filter((row: any) => {
            if (!row?.ognoo) return false;
            const ms = new Date(row.ognoo).getTime();
            return ms >= startMs && ms <= endMs;
          });

          inRangeRows.forEach((row: any) => {
             const isEkh = row.ner === "Эхний үлдэгдэл" || (row.tailbar && row.tailbar.includes("Эхний үлдэгдэл"));
             if (!isEkh) pBilled += Number(row.tulukhDun ?? 0);
             pPaid += Number(row.tulsunDun ?? 0);
          });

          setLedgerBilledByGid(prev => ({ ...prev, [gid]: pBilled }));
          setLedgerPaidByGid(prev => ({ ...prev, [gid]: pPaid }));

          // Opening Balance is the running balance BEFORE the first row of the period
          const firstIdx = ledger.findIndex((row: any) => row?.ognoo && new Date(row.ognoo).getTime() >= startMs);
          if (firstIdx !== -1) {
            const row = ledger[firstIdx];
            const isEkh = row.ner === "Эхний үлдэгдэл" || (row.tailbar && row.tailbar.includes("Эхний үлдэгдэл"));
            // ekhnii = balance_after_this_row - this_row_impact
            const chargeImpact = !isEkh ? Number(row.tulukhDun ?? 0) : 0;
            const payImpact = Number(row.tulsunDun ?? 0);
            const ekhnii = Number(row.uldegdel ?? 0) - chargeImpact + payImpact;
            setEkhniiUldegdelByGereeId(prev => ({ ...prev, [gid]: ekhnii }));
          } else if (ledger.length > 0) {
            // All rows are before startMs
            setEkhniiUldegdelByGereeId(prev => ({ ...prev, [gid]: Number(ledger[ledger.length - 1].uldegdel ?? 0) }));
          }

          const latestRow = inRangeRows.length > 0 ? inRangeRows[inRangeRows.length - 1] : null;
          setUldegdelByGereeId((prev) => ({ ...prev, [gid]: latestRow ? latestRow.uldegdel : (ledger[ledger.length - 1]?.uldegdel ?? 0) }));
        }
      }).catch(() => { uldegdelRequestedRef.current.delete(gid); });
    });
  }, [token, baiguullagiinId, deduplicatedResidents]);

  const bestKnownBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    Object.values(contractsById).forEach((c: any) => {
      const id = String(c?._id || "").trim();
      if (id && c?.uldegdel != null) balances[id] = Number(c.uldegdel);
    });
    [...allHistoryItems].sort((a,b) => new Date(b.ognoo || 0).getTime() - new Date(a.ognoo || 0).getTime()).forEach((it) => {
      const gid = String(it?.gereeniiId || it?.gereeId || "").trim();
      if (gid && balances[gid] === undefined && it?.uldegdel != null) balances[gid] = Number(it.uldegdel);
    });
    Object.entries(uldegdelByGereeId).forEach(([id, val]) => { if (val != null) balances[id] = val; });
    return balances;
  }, [allHistoryItems, contractsById, uldegdelByGereeId]);

  const totals = useMemo(() => {
    let totalPaid = 0;
    let totalUldegdel = 0;
    let totalBilled = 0;
    let tuluvUnpaidCount = 0;
    let totalEkhniiUldegdel = 0;

    const [defaultStart, defaultEnd] = getDefaultDateRange();
    const startMs = new Date(startDate || defaultStart).getTime();
    const endObj = new Date(endDate || defaultEnd);
    endObj.setHours(23, 59, 59, 999);
    const endMs = endObj.getTime();

    const aggregatePaidMap = aggregateLedgerTulsunByGereeIdInRange(buildingHistoryItems, contractsByNumber, startMs, endMs);
    const aggregateBilledMap: Record<string, number> = {};

    buildingHistoryItems.forEach((it: any) => {
      const ms = itemPrimaryDateMs(it);
      if (ms < startMs || ms > endMs) return;
      const gid = String(it?.gereeniiId ?? it?.gereeId ?? "").trim() || (it?.gereeniiDugaar && String((contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "")) || "";
      if (!gid) return;
      const amount = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? it?.tulukhDun ?? it?.undsenDun ?? it?.dun ?? 0);
      const fromTulsun = Number(it?.tulsunDun ?? 0);
      const isStandaloneEkh = it?.ekhniiUldegdelEsekh === true;
      const type = String(it?.turul || it?.type || "").toLowerCase();
      const isPayment = type === "tulult" || type === "төлбөр" || type === "төлөлт" || (amount < 0 && !isStandaloneEkh);
      if (isPayment) {
        aggregatePaidMap[gid] = (aggregatePaidMap[gid] || 0) + (fromTulsun || Math.abs(amount));
      } else {
        aggregateBilledMap[gid] = (aggregateBilledMap[gid] || 0) + Math.abs(amount);
        aggregatePaidMap[gid] = (aggregatePaidMap[gid] || 0) + Math.abs(fromTulsun);
      }
    });

    const finalPaidByGid = new Map<string, number>();
    const finalBilledByGid = new Map<string, number>();
    const finalBalanceByGid = new Map<string, number>();
    const activeUnpaidGids = new Set<string>();

    deduplicatedResidents.forEach((it: any) => {
      const gid = (it?.gereeniiId && String(it.gereeniiId)) || (it?._gereeniiId && String(it._gereeniiId)) || "";
      if (!gid) return;
      const paid = ledgerPaidByGid[gid] ?? aggregatePaidMap[gid] ?? 0;
      const billed = ledgerBilledByGid[gid] ?? aggregateBilledMap[gid] ?? 0;
      const balance = bestKnownBalances[gid] ?? Number(it?.uldegdel ?? 0);

      finalPaidByGid.set(gid, Math.round(paid * 100) / 100);
      finalBilledByGid.set(gid, Math.round(billed * 100) / 100);
      finalBalanceByGid.set(gid, Math.round(balance * 100) / 100);

      if (balance >= 0.01 && paid < 0.1) activeUnpaidGids.add(gid);
    });

    finalPaidByGid.forEach(v => totalPaid += v);
    finalBilledByGid.forEach(v => totalBilled += v);
    finalBalanceByGid.forEach(v => totalUldegdel += v);
    
    // Sum ekhnii uldegdel
    deduplicatedResidents.forEach(it => {
      const gid = (it?.gereeniiId && String(it.gereeniiId)) || (it?._gereeniiId && String(it._gereeniiId)) || "";
      const ekh = ekhniiUldegdelByGereeId[gid] ?? (finalBalanceByGid.get(gid) || 0) - (finalBilledByGid.get(gid) || 0) + (finalPaidByGid.get(gid) || 0);
      totalEkhniiUldegdel += ekh;
    });

    tuluvUnpaidCount = activeUnpaidGids.size;

    console.log(`📊 [TOTALS CALC] FINAL:`, { totalPaid, totalUldegdel, totalBilled, totalEkhniiUldegdel });

    return { 
      totalPaid, 
      totalUldegdel, 
      totalBilled, 
      tuluvUnpaidCount, 
      totalEkhniiUldegdel,
      paidByGid: Object.fromEntries(finalPaidByGid),
      billedByGid: Object.fromEntries(finalBilledByGid)
    };
  }, [buildingHistoryItems, deduplicatedResidents, contractsByNumber, bestKnownBalances, startDate, endDate, ledgerBilledByGid, ledgerPaidByGid, ekhniiUldegdelByGereeId]);

  return {
    ...totals,
    paidByGereeId: totals.paidByGid,
    billedByGereeId: totals.billedByGid,
    uldegdelByGereeId: bestKnownBalances,
    ekhniiUldegdelByGereeId: ekhniiUldegdelByGereeId,
  };
}
