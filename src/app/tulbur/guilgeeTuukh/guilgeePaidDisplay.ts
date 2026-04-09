import { itemPrimaryDateMs } from "./ledgerRunningBalances";

/**
 * Сонгосон хугацааны `itemPrimaryDateMs`-аар шүүж, тухайн хугацаанд төлсөн дүнг гэрээгээр нийлбэрлэнэ.
 * «Гүйцэтгэл» багана: бүх түүхийн харагдац ч зөвхөн сонгосон сарын төлөлтүүд.
 */
export function aggregateLedgerTulsunByGereeIdInRange(
  items: any[],
  contractsByNumber: Record<string, any>,
  rangeStartMs: number,
  rangeEndMs: number,
): Record<string, number> {
  const filtered = items.filter((it) => {
    const ms = itemPrimaryDateMs(it);
    return ms >= rangeStartMs && ms <= rangeEndMs;
  });
  return aggregateLedgerTulsunByGereeId(filtered, contractsByNumber);
}

function gereeIdFromItem(
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

/**
 * `buildingHistoryItems` дээрх мөр бүрийн төлсөн дүнг гэрээгээр нийлбэрлэнэ (жагсаалтын `_totalTulsun`-тай ижил дүрмээр).
 * Төлөв шүүлтэнд мөр тус бүрийн `_totalTulsun`-ийг ашиглахгүй.
 */
export function aggregateLedgerTulsunByGereeId(
  items: any[],
  contractsByNumber: Record<string, any>,
): Record<string, number> {
  const m: Record<string, number> = {};
  for (const it of items) {
    const gid = gereeIdFromItem(it, contractsByNumber);
    if (!gid) continue;

    const isStandaloneEkhniiUldegdel = it?.ekhniiUldegdelEsekh === true;
    const itemAmount = isStandaloneEkhniiUldegdel
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

    let paidForRow: number;
    if (isStandaloneEkhniiUldegdel) {
      paidForRow = Number(it?.tulsunDun ?? it?.tulsun ?? 0) || 0;
    } else {
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
        (itemAmount < 0 && !isStandaloneEkhniiUldegdel);
      const fromTulsun = Number(it?.tulsunDun ?? it?.tulsun ?? 0) || 0;
      if (isPayment) {
        paidForRow = fromTulsun || Math.abs(itemAmount);
      } else {
        paidForRow = fromTulsun;
      }
    }
    m[gid] = (m[gid] ?? 0) + paidForRow;
  }
  return m;
}
