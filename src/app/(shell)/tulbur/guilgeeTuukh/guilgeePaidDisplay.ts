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
 * Сонгосон хугацаанд төлсөн дүнг гэрээгээр нийлбэрлэнэ («Гүйцэтгэл» — зөвхөн бодит төлбөр, хөнгөлөлтийг хасна).
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
    const rawTulsun = Number(it?.tulsunDun ?? it?.tulsun ?? 0);
    const turul = String(it?.turul || "").toLowerCase();
    const khelber = String(it?.khelber || "").toLowerCase();
    const zardliinTurul = String(it?.zardliinTurul || "").toLowerCase();

    const isDiscount =
      turul === "khungulult" ||
      turul === "хөнгөлөлт" ||
      turul === "discount" ||
      khelber === "хөнгөлөлт" ||
      khelber === "khungulult" ||
      zardliinTurul === "хөнгөлөлт";

    // EXCLUDE discounts from Гүйцэтгэл (paid performance)
    if (isDiscount) continue;

    let paidForRow = 0;
    if (rawDun < 0 || rawTulsun > 0) {
      paidForRow = Math.abs(rawDun || rawTulsun);
    }

    m[gid] = (m[gid] ?? 0) + paidForRow;
  }
  return m;
}

/**
 * Сонгосон хугацаанд хөнгөлсөн дүнг гэрээгээр нийлбэрлэнэ («Хөнгөлөлт» багана).
 */
export function aggregateLedgerKhungulultByGereeId(
  items: any[],
  contractsByNumber: Record<string, any>,
): Record<string, number> {
  const m: Record<string, number> = {};
  for (const it of items) {
    const gid = gereeIdFromItem(it, contractsByNumber);
    if (!gid) continue;

    const rawDun = Number(it?.dun ?? 0);
    const rawTulsun = Number(it?.tulsunDun ?? it?.tulsun ?? 0);
    const turul = String(it?.turul || "").toLowerCase();
    const khelber = String(it?.khelber || "").toLowerCase();
    const zardliinTurul = String(it?.zardliinTurul || "").toLowerCase();

    const isDiscount =
      turul === "khungulult" ||
      turul === "хөнгөлөлт" ||
      turul === "discount" ||
      khelber === "хөнгөлөлт" ||
      khelber === "khungulult" ||
      zardliinTurul === "хөнгөлөлт";

    if (isDiscount) {
      const discVal = Math.abs(rawDun || rawTulsun);
      m[gid] = (m[gid] ?? 0) + discVal;
    }
  }
  return m;
}

export function aggregateLedgerKhungulultByGereeIdInRange(
  items: any[],
  contractsByNumber: Record<string, any>,
  rangeStartMs: number,
  rangeEndMs: number,
): Record<string, number> {
  const filtered = items.filter((it) => {
    const ms = itemPrimaryDateMs(it);
    return ms >= rangeStartMs && ms <= rangeEndMs;
  });
  return aggregateLedgerKhungulultByGereeId(filtered, contractsByNumber);
}
