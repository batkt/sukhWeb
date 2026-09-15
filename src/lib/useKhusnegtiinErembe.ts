"use client";

import { useCallback, useState } from "react";

/**
 * ХҮСНЭГТИЙН ЭРЭМБИЙН НИЙТЛЭГ ТУСЛАХ
 * ===================================
 *
 * Энэ аппын хүснэгтүүд бараг бүгд ХУУДАСЛАГДСАН өгөдлийг хүлээж авдаг
 * (эцэг хуудас нь `slice` хийгээд зөвхөн тухайн хуудсын мөрүүдийг дамжуулна
 * — хүснэгтийн `№` багана `(page - 1) * pageSize + index + 1` гэж бодогддог
 * нь үүний нотолгоо).
 *
 * Тиймээс antd-ын ДОТООД эрэмбийг (`sorter: (a, b) => ...`) хэрэглэвэл
 * зөвхөн харагдаж буй хуудас эрэмбэлэгдэж, бүх өгөгдлийн хувьд БУРУУ
 * дараалал үүснэ. Үүнээс сэргийлж эрэмбийг эцэг хуудсанд, зүсэхээс ӨМНӨ
 * хийх ёстой.
 *
 * Хэрэглэх загвар (эцэг хуудас):
 *
 *   const utgaAvagch = useMemo(() => ({
 *     ner:   (m) => m.ner,
 *     ognoo: (m) => ognooRuuMs(m.ognoo),
 *     dun:   (m) => Number(m.dun) || 0,
 *   }), []);
 *   const { sortKey, sortOrder, onSort, erembeley } =
 *     useKhusnegtiinErembe(utgaAvagch, () => setPage(1));
 *
 *   const erembelsen = useMemo(() => erembeley(shuusen), [erembeley, shuusen]);
 *   const paginated = erembelsen.slice(...);
 *
 * Хүснэгтийн бүрэлдэхүүнд `sortKey`, `sortOrder`, `onSort`-ыг дамжуулж,
 * багана бүрд `...erembiinBagana("ognoo", sortKey, sortOrder)` тавина.
 */

export type ErembiinChig = "ascend" | "descend" | null;

/** Түлхүүр бүрд харгалзах эрэмбэлэх утга. `useMemo`-оор тогтвортой байлга. */
export type ErembiinUtgaAvagch<T> = Record<
  string,
  (mur: T) => string | number | null | undefined
>;

/** "2026-07-25 13:01:53" гэх мэт зайтай бичлэгийг ч зөв уншина. */
export function ognooRuuMs(utga: unknown): number | null {
  if (!utga) return null;
  const t = new Date(String(utga).replace(" ", "T")).getTime();
  return Number.isNaN(t) ? null : t;
}

export function useKhusnegtiinErembe<T>(
  utgaAvagch: ErembiinUtgaAvagch<T>,
  /** Эрэмбэ солигдоход дуудагдана — ихэвчлэн `() => setPage(1)`. */
  erembeSoligdokhod?: () => void,
) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<ErembiinChig>(null);

  const onSort = useCallback(
    (key: string | null, order: ErembiinChig) => {
      setSortKey(order ? key : null);
      setSortOrder(order);
      erembeSoligdokhod?.();
    },
    [erembeSoligdokhod],
  );

  const erembeley = useCallback(
    (rows: T[]): T[] => {
      if (!sortKey || !sortOrder || !Array.isArray(rows)) return rows;
      const avagch = utgaAvagch[sortKey];
      if (!avagch) return rows;
      const chig = sortOrder === "ascend" ? 1 : -1;
      return [...rows].sort((a, b) => {
        const av = avagch(a);
        const bv = avagch(b);
        // Хоосон утга ямар ч чиглэлд ҮРГЭЛЖ сүүлд — эс тэгвээс "-" мөрүүд
        // жагсаалтын эхэнд бөөгнөрч, хэрэгтэй мөр нь нуугдана.
        const aKhooson = av === null || av === undefined || av === "";
        const bKhooson = bv === null || bv === undefined || bv === "";
        if (aKhooson && bKhooson) return 0;
        if (aKhooson) return 1;
        if (bKhooson) return -1;
        if (typeof av === "number" && typeof bv === "number")
          return (av - bv) * chig;
        return String(av).localeCompare(String(bv), "mn") * chig;
      });
    },
    [sortKey, sortOrder, utgaAvagch],
  );

  return { sortKey, sortOrder, onSort, erembeley };
}

/** antd-ын багананд тавих эрэмбийн проп-ууд (удирдлагатай горим). */
export function erembiinBagana(
  key: string,
  sortKey: string | null,
  sortOrder: ErembiinChig,
) {
  return {
    sorter: true as const,
    sortDirections: ["ascend", "descend"] as const,
    sortOrder: sortKey === key ? sortOrder : null,
  };
}

/** antd `<Table onChange>` -> `onSort` руу хөрвүүлэгч. */
export function antdErembiinUzegch(
  onSort?: (key: string | null, order: ErembiinChig) => void,
) {
  return (_pagination: unknown, _filters: unknown, sorter: unknown) => {
    const s = (Array.isArray(sorter) ? sorter[0] : sorter) as {
      order?: ErembiinChig;
      columnKey?: string;
      field?: string;
    } | null;
    const order = s?.order ?? null;
    onSort?.(order ? String(s?.columnKey ?? s?.field ?? "") : null, order);
  };
}
