/**
 * Нийт төлсөн дүн: түүхийн мөрнөөс нийлбэрлэсэн `_totalTulsun` нь олон төлөлтийг оролцуулна.
 * `/tulsunSummary` заримдаа нэг хугацааны дүн буцаадаг тул эхлээд ledger, дараа нь API.
 */
export function resolveTotalPaidFromLedgerThenApi(
  record: { _totalTulsun?: number } | any,
  gid: string | undefined,
  paidSummaryByGereeId: Record<string, number>,
): number {
  const ledger = Number(record?._totalTulsun ?? 0);
  if (ledger > 0.01) return ledger;
  return gid ? (paidSummaryByGereeId[gid] ?? 0) : 0;
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
      const isPayment =
        type === "tulult" ||
        type === "төлбөр" ||
        type === "төлөлт" ||
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
