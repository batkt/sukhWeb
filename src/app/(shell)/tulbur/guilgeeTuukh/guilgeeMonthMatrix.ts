/**
 * Resolve the correct month bucket from /tailan/resident-monthly-matrix.
 * Prefer the month that matches the list page date filter (matrixMonthKey),
 * not always periods[periods.length - 1] (which can point at the wrong month).
 *
 * Анхаар: жагсаалтын «Гүйцэтгэл» нь `monthPaidByGereeId` (түүх + сарын хүрээ)-оор тооцогдоно.
 * Энд голчлон `billed` болон сарын тайлангийн харгалзуулалтад зориулна.
 */
export function pickMonthSlice(
  monthlyData: any | null | undefined,
  periods: string[] | undefined,
  matrixMonthKey: string | undefined,
): any | null {
  const months = monthlyData?.months;
  if (!months || typeof months !== "object") return null;

  if (matrixMonthKey) {
    if (months[matrixMonthKey] != null) return months[matrixMonthKey];
    // Fuzzy match: if looking for "2026-04", match "2026-04-22"
    const fuzzyKey = Object.keys(months).find((k) => k.startsWith(matrixMonthKey));
    if (fuzzyKey && months[fuzzyKey] != null) return months[fuzzyKey];
  }
  if (!periods?.length) return null;
  for (let i = periods.length - 1; i >= 0; i--) {
    const k = periods[i];
    if (k != null && months[k] != null) return months[k];
  }
  return null;
}
