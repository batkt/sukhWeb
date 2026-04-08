/**
 * Хуулга (HistoryModal)-тай ижил: нэхэмжлэхийн zardluud-ийг мөр бүрээр задалж,
 * tulukhDun / tulsunDun-оор running balance тооцоолно. Ингэснээр сүүлийн мөрийн Үлдэгдэл
 * (жишээ нь 8,347.83) invoice-ийн нэгтгэсэн uldegdel (65,000)-аас ялгарна.
 */

function itemPrimaryDateMs(it: any): number {
  const raw = it?.ognoo;
  if (raw != null && String(raw).trim() !== "") {
    const t = new Date(raw).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const t2 = new Date(it?.tulsunOgnoo || it?.createdAt || 0).getTime();
  return Number.isNaN(t2) ? 0 : t2;
}

function getGereeIdPure(
  it: any,
  contractsByNumber: Record<string, any>,
): string {
  return (
    (it?._gereeniiId && String(it._gereeniiId)) ||
    (it?.gereeniiId && String(it.gereeniiId)) ||
    (it?.gereeId && String(it.gereeId)) ||
    (it?.gereeniiDugaar &&
      String(contractsByNumber[String(it.gereeniiDugaar)]?._id || "")) ||
    ""
  );
}

function pickAmount(z: any): number {
  const n = (v: any) => {
    const num = Number(v);
    return Number.isFinite(num) ? num : null;
  };
  const dun = n(z?.dun);
  if (dun !== null && dun !== 0) return dun;
  const td = n(z?.tulukhDun);
  if (td !== null && td !== 0) return td;
  const tar = n(z?.tariff);
  return tar ?? 0;
}

type LedgerEv = {
  gid: string;
  ms: number;
  tul: number;
  tsun: number;
  ord: string;
};

/**
 * `allHistoryItems` = огноогоор шүүгдсэн нэгтгэсэн түүх (нэхэмжлэх, авлага, төлөлт).
 * Гэрээ тус бүрээр хугацааны дарааллаар running balance-ийн сүүлийн утгыг буцаана.
 */
export function computeLedgerRunningBalancesByGereeId(
  items: any[],
  contractsByNumber: Record<string, any>,
): Record<string, number> {
  const sorted = [...items].sort((a, b) => {
    const d = itemPrimaryDateMs(a) - itemPrimaryDateMs(b);
    if (d !== 0) return d;
    return String(a?._id ?? "").localeCompare(String(b?._id ?? ""));
  });

  const events: LedgerEv[] = [];

  for (const it of sorted) {
    const gid = getGereeIdPure(it, contractsByNumber);
    if (!gid) continue;

    const zardluud = Array.isArray(it?.medeelel?.zardluud)
      ? it.medeelel.zardluud
      : Array.isArray(it?.zardluud)
        ? it.zardluud
        : [];
    const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
      ? it.medeelel.guilgeenuud
      : Array.isArray(it?.guilgeenuud)
        ? it.guilgeenuud
        : [];

    const itemMs = itemPrimaryDateMs(it);
    const itemDateStr =
      it?.ognoo || it?.nekhemjlekhiinOgnoo || it?.createdAt || "";

    let expandedFromInvoice = false;

    for (const z of zardluud) {
      if (!z?.ner) continue;
      const amt = pickAmount(z);
      const isEkhniiUldegdel =
        z.isEkhniiUldegdel === true ||
        z.ner === "Эхний үлдэгдэл" ||
        (z.ner && String(z.ner).includes("Эхний үлдэгдэл"));
      if (isEkhniiUldegdel && (amt === 0 || amt === undefined)) continue;
      if ((isEkhniiUldegdel && amt !== 0) || amt > 0) {
        expandedFromInvoice = true;
        events.push({
          gid,
          ms: itemMs,
          tul: amt,
          tsun: 0,
          ord: `${it._id}-z-${z._id ?? z.ner}`,
        });
      }
    }

    for (const g of guilgeenuud) {
      const amt = Number(g.tulukhDun || 0);
      const paid = Number(g.tulsunDun || 0);
      if (amt > 0) {
        expandedFromInvoice = true;
        const gMs = (() => {
          const raw = g.ognoo || g.guilgeeKhiisenOgnoo || itemDateStr;
          const t = raw ? new Date(raw).getTime() : NaN;
          return !Number.isNaN(t) ? t : itemMs;
        })();
        events.push({
          gid,
          ms: gMs,
          tul: amt,
          tsun: 0,
          ord: `${it._id}-g-${g._id ?? "chg"}`,
        });
      }
      if (paid > 0) {
        expandedFromInvoice = true;
        const gMs = (() => {
          const raw = g.ognoo || g.guilgeeKhiisenOgnoo || itemDateStr;
          const t = raw ? new Date(raw).getTime() : NaN;
          return !Number.isNaN(t) ? t : itemMs;
        })();
        events.push({
          gid,
          ms: gMs,
          tul: 0,
          tsun: paid,
          ord: `${it._id}-gp-${g._id ?? "pay"}`,
        });
      }
    }

    if (expandedFromInvoice) continue;

    // Нэг мөр болсон гүйлгээ (төлөлт, ганцаарчилсан авлага, нэхэмжлэхийн дүүргэлтгүй)
    const isStandaloneEkhnii = it?.ekhniiUldegdelEsekh === true;
    const itemAmount = isStandaloneEkhnii
      ? Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0
      : Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        ) || 0;

    const type = String(it?.turul || it?.type || "").toLowerCase();
    const khelber = String(it?.khelber || "").toLowerCase();
    const source = String(it?.sourceCollection || "").toLowerCase();
    const isPayment =
      type === "tulult" ||
      type === "төлбөр" ||
      type === "төлөлт" ||
      khelber === "төлөлт" ||
      khelber === "tulult" ||
      source === "gereeniitulsunavlaga" ||
      (itemAmount < 0 && !isStandaloneEkhnii);
    const fromTulsun = Number(it?.tulsunDun ?? it?.tulsun ?? 0) || 0;

    if (isStandaloneEkhnii) {
      events.push({
        gid,
        ms: itemMs,
        tul: itemAmount,
        tsun: fromTulsun,
        ord: `${it._id}-ekh`,
      });
      continue;
    }

    if (isPayment) {
      events.push({
        gid,
        ms: itemMs,
        tul: 0,
        tsun: fromTulsun || Math.abs(itemAmount),
        ord: `${it._id}-pay`,
      });
    } else if (itemAmount !== 0 || fromTulsun !== 0) {
      events.push({
        gid,
        ms: itemMs,
        tul: Math.abs(itemAmount),
        tsun: fromTulsun,
        ord: `${it._id}-row`,
      });
    }
  }

  const byGid = new Map<string, LedgerEv[]>();
  for (const e of events) {
    if (!byGid.has(e.gid)) byGid.set(e.gid, []);
    byGid.get(e.gid)!.push(e);
  }

  const balances: Record<string, number> = {};
  for (const [gid, evs] of byGid) {
    evs.sort((a, b) =>
      a.ms !== b.ms
        ? a.ms - b.ms
        : String(a.ord).localeCompare(String(b.ord)),
    );
    let running = 0;
    for (const e of evs) {
      running =
        Math.round((running + e.tul - e.tsun) * 100) / 100;
    }
    balances[gid] = running;
  }

  return balances;
}
