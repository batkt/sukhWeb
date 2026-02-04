"use client";

import useSWR from "swr";
import uilchilgee from "./uilchilgee";
import useGereeJagsaalt from "./useGeree";
import { useOrshinSuugchJagsaalt } from "./useOrshinSuugch";
import { useMemo, useEffect, useState } from "react";

/**
 * Fetches the same totals as the guilgeeTuukh (Төлбөр тооцоо) table footer:
 * - totalPaid = sum of paid amounts (Гүйцэтгэл)
 * - totalUldegdel = sum of balance amounts (Үлдэгдэл)
 */
export function useTulburFooterTotals(
  token: string | null,
  baiguullagiinId: string | null,
  barilgiinId: string | undefined
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
      ? ["/nekhemjlekhiinTuukh-footer", token, baiguullagiinId, barilgiinId]
      : null,
    async ([, tkn, bId, barId]) => {
      const resp = await uilchilgee(tkn).get("/nekhemjlekhiinTuukh", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
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
      ? ["/gereeniiTulukhAvlaga-footer", token, baiguullagiinId, barilgiinId]
      : null,
    async ([, tkn, bId, barId]) => {
      const resp = await uilchilgee(tkn).get("/gereeniiTulukhAvlaga", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
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
    return combined;
  }, [historyData, receivableData]);

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
      const key = gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return;

      const isStandaloneEkhniiUldegdel = it?.ekhniiUldegdelEsekh === true;
      if (isStandaloneEkhniiUldegdel) {
        const contractHasEkhniiUldegdelInInvoice =
          (gereeId && contractsWithEkhniiUldegdelInInvoice.has(gereeId)) ||
          (gereeDugaar && contractsWithEkhniiUldegdelInInvoice.has(gereeDugaar));
        if (contractHasEkhniiUldegdelInInvoice) return;
      }

      const itemAmount = isStandaloneEkhniiUldegdel
        ? Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0
        : Number(
            it?.niitTulbur ??
              it?.niitDun ??
              it?.total ??
              it?.tulukhDun ??
              it?.undsenDun ??
              it?.dun ??
              0
          ) || 0;

      const resolvedGereeId =
        gereeId ||
        (gereeDugaar && (contractsByNumber as any)[gereeDugaar]?._id
          ? String((contractsByNumber as any)[gereeDugaar]._id)
          : "");

      if (!map.has(key)) {
        map.set(key, {
          ...it,
          _totalTulbur: itemAmount,
          _gereeniiId: resolvedGereeId,
        });
      } else {
        const existing = map.get(key);
        existing._totalTulbur += itemAmount;
      }
    });

    return Array.from(map.values());
  }, [buildingHistoryItems, contractsByNumber]);

  const [paidSummaryByGereeId, setPaidSummaryByGereeId] = useState<Record<string, number>>({});
  const requestedRef = useMemo(() => new Set<string>(), []);

  // Clear paid cache when underlying data changes so we re-fetch
  useEffect(() => {
    setPaidSummaryByGereeId({});
    requestedRef.clear();
  }, [historyData, receivableData]);

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

      if (!gid || requestedRef.has(gid)) return;
      requestedRef.add(gid);

      uilchilgee(token)
        .post("/tulsunSummary", {
          baiguullagiinId,
          gereeniiId: gid,
        })
        .then((resp) => {
          const total =
            Number(resp.data?.totalTulsunDun ?? resp.data?.totalInvoicePayment ?? 0) || 0;
          setPaidSummaryByGereeId((prev) => ({ ...prev, [gid]: total }));
        })
        .catch(() => {
          requestedRef.delete(gid);
        });
    });
  }, [
    token,
    baiguullagiinId,
    deduplicatedResidents,
    contractsByNumber,
  ]);

  const totals = useMemo(() => {
    let totalPaid = 0;
    let totalUldegdel = 0;

    deduplicatedResidents.forEach((it: any) => {
      const gid =
        (it?.gereeniiId && String(it.gereeniiId)) ||
        (it?.gereeniiDugaar &&
          String((contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "")) ||
        "";
      const paid = gid ? paidSummaryByGereeId[gid] ?? 0 : 0;
      const tulbur = Number(it?._totalTulbur ?? 0);
      totalPaid += paid;
      totalUldegdel += tulbur - paid;
    });

    return { totalPaid, totalUldegdel };
  }, [deduplicatedResidents, contractsByNumber, paidSummaryByGereeId]);

  return totals;
}
