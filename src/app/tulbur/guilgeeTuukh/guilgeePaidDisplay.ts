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

    const rawDun = Number(it?.dun ?? 0);
    let paidForRow = 0;
    
    // Only sum records where dun < 0 (actual payments/credits)
    // To avoid double-counting tulsunDun from charge records.
    if (rawDun < 0) {
      paidForRow = Math.abs(rawDun);
    }
    
    m[gid] = (m[gid] ?? 0) + paidForRow;
  }
  return m;
}
