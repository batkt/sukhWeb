"use client";

import useSWR from "swr";
import uilchilgee from "./uilchilgee";
import useGereeJagsaalt from "./useGeree";
import { useOrshinSuugchJagsaalt } from "./useOrshinSuugch";
import { useMemo, useEffect, useState, useRef } from "react";

 
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
      gList.forEach((g: any) => {
        if (g?._id) trackingIds.add(String(g._id));
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
    const contractsWithEkhniiUldegdelInInvoice = new Set<string>();

    // Discovery from all contracts (Exhaustive)
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];
    allGerees.forEach((g: any) => {
      const gereeId = String(g?._id || g?.gereeniiId || g?.gereeId || "").trim();
      const gereeDugaar = String(g?.gereeniiDugaar || "").trim();
      const key = gereeId || gereeDugaar;

      if (key && !map.has(key)) {
        map.set(key, {
          ...g,
          _gereeniiId: gereeId,
        });
      }
    });

    buildingHistoryItems.forEach((it: any) => {
      const zardluud = Array.isArray(it?.medeelel?.zardluud)
        ? it.medeelel.zardluud
        : Array.isArray(it?.zardluud)
          ? it.zardluud
          : [];
      const hasEkhniiUldegdelInZardluud = zardluud.some((z: any) => {
        const ner = String(z?.ner || "").toLowerCase();
        const isEkhUld =
          z?.isEkhniiUldegdel === true ||
          ner.includes("эхний үлдэгдэл") ||
          ner.includes("ekhniuldegdel");
        const hasValue = Number(z?.dun || z?.tariff || 0) > 0;
        return isEkhUld && hasValue;
      });
      if (hasEkhniiUldegdelInZardluud) {
        const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
        const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
        if (gereeId) contractsWithEkhniiUldegdelInInvoice.add(gereeId);
        if (gereeDugaar) contractsWithEkhniiUldegdelInInvoice.add(gereeDugaar);
      }
    });

    buildingHistoryItems.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      const ner = String(it?.ner || "").trim().toLowerCase();
      const utas = Array.isArray(it?.utas)
        ? String(it.utas[0] || "").trim()
        : String(it?.utas || "").trim();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return;

      const isStandaloneEkhniiUldegdel = it?.ekhniiUldegdelEsekh === true;
      if (isStandaloneEkhniiUldegdel) {
        const contractHasEkhniiUldegdelInInvoice =
          (gereeId && contractsWithEkhniiUldegdelInInvoice.has(gereeId)) ||
          (gereeDugaar && contractsWithEkhniiUldegdelInInvoice.has(gereeDugaar));
        if (contractHasEkhniiUldegdelInInvoice) return;
      }

      const resolvedGereeId =
        gereeId ||
        (gereeDugaar && (contractsByNumber as any)[gereeDugaar]?._id
          ? String((contractsByNumber as any)[gereeDugaar]._id)
          : "");

      if (!map.has(key)) {
        map.set(key, { ...it, _gereeniiId: resolvedGereeId });
      } else {
        // Just update the record to include latest fields if needed, but primary values are from gereeGaralt
      }
    });

    return Array.from(map.values());
  }, [buildingHistoryItems, contractsByNumber, gereeGaralt?.jagsaalt]);

  const [paidSummaryByGereeId, setPaidSummaryByGereeId] = useState<Record<string, number>>({});
  const paidRequestedRef = useRef<Set<string>>(new Set());

  const [uldegdelByGereeId, setUldegdelByGereeId] = useState<Record<string, number | null>>({});
  const uldegdelRequestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setPaidSummaryByGereeId({});
    paidRequestedRef.current.clear();
    setUldegdelByGereeId({});
    uldegdelRequestedRef.current.clear();
  }, [historyData, receivableData, paymentRecordsData, startDate, endDate]);

  useEffect(() => {
    if (!token || !baiguullagiinId || deduplicatedResidents.length === 0) return;

    deduplicatedResidents.forEach((it: any) => {
      const gid =
        (it?.gereeniiId && String(it.gereeniiId)) ||
        (it?._gereeniiId && String(it._gereeniiId)) ||
        (it?.gereeniiDugaar &&
          (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id &&
          String((contractsByNumber as any)[String(it.gereeniiDugaar)]._id)) ||
        "";

      if (!gid || paidRequestedRef.current.has(gid)) return;
      paidRequestedRef.current.add(gid);

      uilchilgee(token)
        .post("/tulsunSummary", { baiguullagiinId, gereeniiId: gid })
        .then((resp) => {
          const total =
            Number(resp.data?.totalTulsunDun ?? resp.data?.totalInvoicePayment ?? 0) || 0;
          setPaidSummaryByGereeId((prev) => ({ ...prev, [gid]: total }));
        })
        .catch(() => {
          paidRequestedRef.current.delete(gid);
        });
    });
  }, [token, baiguullagiinId, deduplicatedResidents, contractsByNumber]);

  
  useEffect(() => {
    if (!token || !baiguullagiinId || deduplicatedResidents.length === 0) return;

    deduplicatedResidents.forEach((it: any) => {
      const gid =
        (it?.gereeniiId && String(it.gereeniiId)) ||
        (it?._gereeniiId && String(it._gereeniiId)) ||
        (it?.gereeniiDugaar &&
          (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id &&
          String((contractsByNumber as any)[String(it.gereeniiDugaar)]._id)) ||
        "";

      if (!gid || uldegdelRequestedRef.current.has(gid)) return;
      const existing = uldegdelByGereeId[gid];
      if (existing !== undefined && existing !== null && Number.isFinite(existing)) return;

      uldegdelRequestedRef.current.add(gid);

      uilchilgee(token)
        .get(`/geree/${gid}/history-ledger`, {
          params: {
            baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            _t: Date.now(),
          },
        })
        .then((resp) => {
          const ledger = Array.isArray(resp.data?.jagsaalt)
            ? resp.data.jagsaalt
            : Array.isArray(resp.data?.ledger)
            ? resp.data.ledger
            : Array.isArray(resp.data)
            ? resp.data
            : [];
          const latestRow = ledger.length > 0 ? ledger[ledger.length - 1] : null;
          const latestUldegdel =
            latestRow?.uldegdel != null && Number.isFinite(Number(latestRow.uldegdel))
              ? Number(latestRow.uldegdel)
              : null;
          setUldegdelByGereeId((prev) => ({ ...prev, [gid]: latestUldegdel }));
        })
        .catch(() => {
          uldegdelRequestedRef.current.delete(gid);
          setUldegdelByGereeId((prev) => ({ ...prev, [gid]: null }));
        });
    });
  }, [token, baiguullagiinId, barilgiinId, deduplicatedResidents, contractsByNumber]);

  /** guilgeeTuukh `bestKnownBalances` — гэрээ → түүхийн сүүлийн үлдэгдэл → ledger */
  const bestKnownBalances = useMemo(() => {
    const balances: Record<string, number> = {};

    Object.values(contractsById).forEach((c: any) => {
      const id = String(c?._id || "").trim();
      if (!id) return;
      if (c?.uldegdel != null) balances[id] = Number(c.uldegdel);
    });

    const sorted = [...allHistoryItems].sort((a: any, b: any) => {
      const da = new Date(
        a.ognoo || a.tulsunOgnoo || a.createdAt || 0,
      ).getTime();
      const db = new Date(
        b.ognoo || b.tulsunOgnoo || b.createdAt || 0,
      ).getTime();
      return db - da;
    });

    const seenGid = new Set<string>();
    sorted.forEach((it: any) => {
      const gid =
        String(it?.gereeniiId || it?.gereeId || "").trim() ||
        (it?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
          )) ||
        "";
      if (gid && !seenGid.has(gid)) {
        seenGid.add(gid);
        if (it?.uldegdel != null && Number.isFinite(Number(it.uldegdel))) {
          balances[gid] = Number(it.uldegdel);
        }
      }
    });

    Object.entries(uldegdelByGereeId).forEach(([id, val]) => {
      if (val != null && Number.isFinite(val)) balances[id] = val;
    });

    return balances;
  }, [allHistoryItems, contractsById, contractsByNumber, uldegdelByGereeId]);

  const totals = useMemo(() => {
    let totalPaid = 0;
    let totalUldegdel = 0;
    let tuluvUnpaidCount = 0;

    const cancelledGereeIds = new Set<string>();
    const cancelledGereeDugaars = new Set<string>();
    ((gereeGaralt?.jagsaalt || []) as any[]).forEach((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim().toLowerCase();
      if (status === "цуцалсан" || status === "tsutlsasan") {
        if (g?._id) cancelledGereeIds.add(String(g._id));
        if (g?.gereeniiDugaar)
          cancelledGereeDugaars.add(String(g.gereeniiDugaar));
      }
    });

    const aggregatePaidMap: Record<string, number> = {};
    buildingHistoryItems.forEach((it: any) => {
      const gid =
        String(it?.gereeniiId ?? it?.gereeId ?? "").trim() ||
        (it?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
          )) ||
        "";

      const recordIsStandaloneEkh = it?.ekhniiUldegdelEsekh === true;
      const itemAmount = recordIsStandaloneEkh
        ? Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0
        : Number(
            it?.tulsunDun ??
              it?.tulsun ??
              it?.niitTulbur ??
              it?.niitDun ??
              it?.total ??
              it?.tulukhDun ??
              it?.undsenDun ??
              it?.dun ??
              0,
          ) || 0;

      const type = String(it?.turul || it?.type || "").toLowerCase();
      const isPayment =
        type === "tulult" ||
        type === "төлбөр" ||
        type === "төлөлт" ||
        (itemAmount < 0 && !recordIsStandaloneEkh);

      const paidAmt = isPayment
        ? Math.abs(itemAmount)
        : Number(it?.tulsunDun ?? it?.tulsun ?? 0) || 0;

      const key_gid = gid || (it?._id && String(it._id)) || "";
      if (key_gid) {
        aggregatePaidMap[key_gid] = (aggregatePaidMap[key_gid] || 0) + paidAmt;
      }
    });

    deduplicatedResidents.forEach((it: any) => {
      const gid =
        String(it?.gereeniiId ?? it?.gereeId ?? "").trim() ||
        (it?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
          )) ||
        (it?._id && String(it._id)) ||
        "";

      const periodPaid = gid ? (aggregatePaidMap[gid] ?? 0) : 0;
      const hasExplicitRowTulsun =
        it?._totalTulsun != null &&
        it?._totalTulsun !== "" &&
        Number.isFinite(Number(it._totalTulsun));
      const rowTulsunNum = hasExplicitRowTulsun
        ? Number(it._totalTulsun)
        : undefined;
      // Төлбөр stats: tulsunSummary, дараа нь жагсаалтын _totalTulsun, эцэст түүхийн нийлбэр
      const paid = gid
        ? (paidSummaryByGereeId[gid] ??
            (rowTulsunNum !== undefined ? rowTulsunNum : periodPaid))
        : rowTulsunNum !== undefined
          ? rowTulsunNum
          : periodPaid;
      totalPaid += paid;

      const balance = gid
        ? (bestKnownBalances[gid] ?? Number(it?.uldegdel ?? 0))
        : Number(it?.uldegdel ?? 0);
      totalUldegdel += balance;

      // guilgeeTuukh stats — "Төлөөгүй"
      const isResidentPaid = balance < 0.01;
      const isPartiallyPaid = !isResidentPaid && paid > 0.1;
      const isLinkedToCancelledGeree =
        cancelledGereeIds.has(gid) ||
        (it?.gereeniiDugaar &&
          cancelledGereeDugaars.has(String(it.gereeniiDugaar)));

      if (
        !isResidentPaid &&
        !isPartiallyPaid &&
        !isLinkedToCancelledGeree
      ) {
        tuluvUnpaidCount += 1;
      }
    });

    return { totalPaid, totalUldegdel, tuluvUnpaidCount };
  }, [
    buildingHistoryItems,
    deduplicatedResidents,
    contractsByNumber,
    contractsById,
    paidSummaryByGereeId,
    uldegdelByGereeId,
    gereeGaralt?.jagsaalt,
    bestKnownBalances,
  ]);

  return totals;
}
