import React, { useMemo } from "react";
import { Tooltip } from "antd";
import formatNumber from "tools/function/formatNumber";
import { StandardTable } from "@/components/ui/StandardTable";

export interface ZardalItem {
  ner?: string;
  turul?: string;
  dun: number;
  tailbar?: string;
  toot?: string;
}

export function isParkingCharge(name?: string, turul?: string): boolean {
  const n = (name || "").trim().toLowerCase();
  const t = (turul || "").trim().toLowerCase();
  if (t === "зогсоол" || t === "гараж") return true;
  if (!n) return false;
  if (n.includes("зочны")) return false;
  return n.includes("зогсоол") || n.includes("гараж");
}

export function extractParkingToot(z: { ner?: string; tailbar?: string; toot?: string }, fallbackToot?: string): string {
  if (z.toot && String(z.toot).trim()) {
    return String(z.toot).replace(/^тоот\s*[:#-]?\s*/i, "").trim();
  }
  const text = `${z.ner || ""} ${z.tailbar || ""}`.trim();
  if (!text) return fallbackToot ? String(fallbackToot).trim() : "";

  // 1. Matches "тоот: 101", "тоот 101", "тоот-101", "тоот #101", "(тоот 101)"
  const m1 = text.match(/тоот\s*[:#-]?\s*([a-zA-Z0-9_\u0400-\u04FF-]+)/i);
  if (m1 && m1[1]) {
    return m1[1].replace(/[()]/g, "").trim();
  }

  // 2. Matches "(B1-02)" or "(12)" right after zogsool/garaj
  const m2 = text.match(/(?:зогсоол|гараж)[^\d(]*\(([a-zA-Z0-9_\u0400-\u04FF-]+)\)/i);
  if (m2 && m2[1]) {
    const candidate = m2[1].trim();
    if (!/^(нэхэмжлэх|авлага|бусад|төлбөр)/i.test(candidate)) {
      return candidate.replace(/^тоот\s*[:#-]?\s*/i, "").trim();
    }
  }

  // 3. Matches "зогсоол 12" or "гараж 12"
  const m3 = text.match(/(?:зогсоол|гараж)\s+([a-zA-Z0-9_\u0400-\u04FF-]+)/i);
  if (m3 && m3[1]) {
    const candidate = m3[1].trim();
    if (!/^(төлбөр|хураамж|авлага|сарын)/i.test(candidate)) {
      return candidate.replace(/^тоот\s*[:#-]?\s*/i, "").trim();
    }
  }

  return fallbackToot ? String(fallbackToot).trim() : "";
}

export interface AvlagaItem {
  ognoo: string;
  tailbar: string;
  tulukhDun: number;
  toot?: string;
  zardluud?: ZardalItem[];
  khungulultuud?: any[];
}

export interface NegtgelTailanItem {
  _id?: any;
  gereeniiId?: string;
  gereeniiDugaar?: string;
  register?: string;
  ovog?: string;
  ner?: string;
  utas?: string | string[];
  toot?: string;
  davkhar?: string;
  bairNer?: string;
  orts?: string;
  niitTulukhDun?: number;
  niitKhungulult?: number;
  niitTulsunDun?: number;
  niitUldegdel?: number;
  globalUldegdel?: number;
  invoiceToo?: number;
  avlaga: AvlagaItem[];
}

interface NegtgelTailanTableProps {
  data: NegtgelTailanItem[];
  loading: boolean;
  /**
   * Серверээс ирсэн, хайлт/огнооны шүүлтийн дараах БҮХ бичлэгийн нийт дүн.
   * Өгөөгүй тохиолдолд зөвхөн харагдаж буй хуудсаар нийлбэрлэнэ.
   */
  niitUldegdel?: number;
}
export function NegtgelTailanTable({ data, loading, niitUldegdel }: NegtgelTailanTableProps) {
  const { months, avlagaTypes } = useMemo(() => {
    const monthSet = new Set<string>();
    const avlagaMap = new Map<
      string,
      { tailbar: string; ognoo: string; index: number }
    >();

    (Array.isArray(data) ? data : []).forEach((row) => {
      (row.avlaga || []).forEach((b) => {
        const ym = b.ognoo ? b.ognoo.slice(0, 7) : "";
        if (!ym) return;
        monthSet.add(ym);

        const zardluud =
          Array.isArray(b.zardluud) && b.zardluud.length > 0
            ? b.zardluud
            : [{ ner: b.tailbar, dun: b.tulukhDun, turul: "Бусад" }];

        zardluud.forEach((z) => {
          if (z.dun <= 0) return;
          let zName = (z.ner || "").trim();
          
          // Filter out generic, junk, or organizational names
          const isJunk = !zName || 
                        zName === "Бусад" ||
                        zName === "Бусад зардал" ||
                        zName === "Нэхэмжлэх" || 
                        zName === "Авлага" || 
                        zName === "Авлага (Нэхэмжлэхгүй)" ||
                        zName === "Найрамдал" || // Specific organizational label filter
                        zName.length > 50; // Stricter length limit for headers
          
          if (isJunk) return; // Skip these completely as requested

          // ЗОГСООЛ-ын төлбөрийг тоот бүрээр багана үүсгэхгүй, нэг "Зогсоол" баганад нэгтгэнэ
          if (isParkingCharge(zName, z.turul)) {
            zName = "Зогсоол";
          }

          const key = `${ym}|${zName}`;
          if (!avlagaMap.has(key)) {
            avlagaMap.set(key, {
              tailbar: zName,
              ognoo: ym,
              index: Number(ym.split("-")[1]),
            });
          }
        });
      });
    });

    const months = Array.from(monthSet).sort();
    const avlagaTypes = Array.from(avlagaMap.values()).sort((a, b) => {
      if (a.ognoo !== b.ognoo) return a.ognoo.localeCompare(b.ognoo);
      
      const isEkhA = a.tailbar.includes("Эхний үлдэгдэл") ? 0 : 1;
      const isEkhB = b.tailbar.includes("Эхний үлдэгдэл") ? 0 : 1;
      if (isEkhA !== isEkhB) return isEkhA - isEkhB;

      const isKhungA = a.tailbar === "Хөнгөлөлт" ? 1 : 0;
      const isKhungB = b.tailbar === "Хөнгөлөлт" ? 1 : 0;
      if (isKhungA !== isKhungB) return isKhungA - isKhungB;
      
      return a.index - b.index;
    });

    return { months, avlagaTypes };
  }, [data]);

  // Хүснэгтийн "Нийт → Үлдэгдэл" баганатай ЯГ ижил талбараас нийлбэрлэнэ,
  // ингэснээр хөл нь мөрүүдтэйгээ таарна.
  const localTotalUldegdel = useMemo(() => {
    return (Array.isArray(data) ? data : []).reduce(
      (s, record) => s + Number(record.niitUldegdel ?? record.globalUldegdel ?? record.niitTulukhDun ?? 0), 0
    );
  }, [data]);

  const localTotalKhungulult = useMemo(() => {
    return (Array.isArray(data) ? data : []).reduce((sum, record) => {
      let rowKhungulult = Number((record as any).niitKhungulult || 0);
      if (rowKhungulult <= 0) {
        (record.avlaga || []).forEach((b) => {
          (b.zardluud || []).forEach((z) => {
            if (z.ner === "Хөнгөлөлт" || z.turul === "Хөнгөлөлт") {
              rowKhungulult += Number(z.dun || 0);
            }
          });
          (b.khungulultuud || []).forEach((k: any) => {
            rowKhungulult += Number(k.dun || k.khungulultiinDun || 0);
          });
        });
      }
      return sum + rowKhungulult;
    }, 0);
  }, [data]);

  // Сервер бүх хуудсыг хамарсан дүн өгсөн бол түүнийг, эс бөгөөс энэ хуудсыг
  const totalUldegdel =
    typeof niitUldegdel === "number" && Number.isFinite(niitUldegdel)
      ? niitUldegdel
      : localTotalUldegdel;

  // Хуудаслалттай үед хөл нь юуг хамарч байгааг тодорхой хэлнэ
  const khuudasKhesegKhen =
    typeof niitUldegdel === "number" &&
    Math.abs(niitUldegdel - localTotalUldegdel) >= 0.01;

  const columns = useMemo(() => {
    const cols: any[] = [
      {
        key: "index",
        label: "№",
        width: 40,
        align: "center",
        fixed: "left",
        render: (_: any, __: any, index: number) => (
          <span className="text-[11px] text-black dark:text-white leading-normal">{index + 1}</span>
        ),
      },
      {
        key: "ner",
        label: (
          <div className="flex justify-start w-full py-0.5">
            <span className="leading-normal pb-0.5 font-medium">Нэр</span>
          </div>
        ),
        width: 130,
        align: "left",
        fixed: "left",
        render: (_: any, record: NegtgelTailanItem) => {
          const ovog = String(record._id?.ovog || record.ovog || "").trim();
          const ner = String(record._id?.ner || record.ner || "").trim();
          const abbreviated = ovog ? `${ovog.charAt(0)}.` : "";
          const buten = [abbreviated, ner].filter(Boolean).join(" ") || "-";
          return (
            <Tooltip title={buten}>
              <div className="text-left text-[11px] text-black dark:text-white truncate py-0.5 leading-normal">
                {buten}
              </div>
            </Tooltip>
          );
        },
      },
      {
        key: "toot",
        label: (
          <div className="flex justify-center w-full py-0.5">
            <span className="leading-normal pb-0.5 font-medium">Тоот</span>
          </div>
        ),
        width: 50,
        align: "center",
        fixed: "left",
        render: (_: any, record: NegtgelTailanItem) => (
          <span className="text-[11px] text-black dark:text-white leading-normal">
            {record._id?.toot || record.toot || "-"}
          </span>
        ),
      },
      {
        key: "utas",
        label: (
          <div className="flex justify-center w-full py-0.5">
            <span className="leading-normal pb-0.5 font-medium">Утас</span>
          </div>
        ),
        width: 90,
        align: "center",
        fixed: "left",
        render: (_: any, record: NegtgelTailanItem) => {
          const u = record._id?.utas || record.utas;
          return (
            <span className="text-[11px] text-black dark:text-white leading-normal">
              {Array.isArray(u) ? u[0] || "-" : u || "-"}
            </span>
          );
        },
      },
    ];

    // Dynamic month groups
    months.forEach((ym) => {
      const typesInMonth = avlagaTypes.filter((v) => v.ognoo === ym);
      if (typesInMonth.length === 0) return;

      cols.push({
        key: `group-${ym}`,
        label: (
          <div className="py-0.5">
            <span className="leading-normal pb-0.5 font-semibold">{ym}</span>
          </div>
        ),
        align: "center",
        children: typesInMonth.map((assessment, subIdx) => {
          const isParkingCol = assessment.tailbar === "Зогсоол";
          const isKhungCol = assessment.tailbar === "Хөнгөлөлт";
          return {
            key: `${ym}|${assessment.tailbar}`,
            label: (
              <div className="flex justify-center w-full py-0.5">
                <Tooltip title={assessment.tailbar}>
                  <span className={`block truncate max-w-[105px] text-center leading-normal pb-1 font-medium ${isKhungCol ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {assessment.tailbar}
                  </span>
                </Tooltip>
              </div>
            ),
            width: isParkingCol ? 125 : isKhungCol ? 110 : 105,
            align: "right",
            onCell: () => ({
              className: subIdx === typesInMonth.length - 1 ? "!border-r-2 !border-r-slate-300 dark:!border-r-slate-800" : ""
            }),
            onHeaderCell: () => ({
              className: subIdx === typesInMonth.length - 1 ? "!border-r-2 !border-r-slate-300 dark:!border-r-slate-800" : ""
            }),
            render: (_: any, record: NegtgelTailanItem) => {
              if (isParkingCol) {
                const tootMap = new Map<string, number>();

                (record.avlaga || []).forEach((b) => {
                  if (b.ognoo?.slice(0, 7) === ym) {
                    const zardluud = Array.isArray(b.zardluud) && b.zardluud.length > 0
                      ? b.zardluud
                      : [{ ner: b.tailbar, dun: b.tulukhDun, toot: b.toot }];

                    zardluud.forEach((z) => {
                      if (z.dun <= 0) return;
                      const zName = (z.ner || "").trim();
                      if (isParkingCharge(zName, z.turul)) {
                        const pToot = extractParkingToot(z, b.toot);
                        tootMap.set(pToot, (tootMap.get(pToot) || 0) + z.dun);
                      }
                    });
                  }
                });

                if (tootMap.size === 0) return "";

                const entries = Array.from(tootMap.entries());
                const totalParkingDun = entries.reduce((s, [, d]) => s + d, 0);

                const tooltipContent = (
                  <div className="text-xs space-y-0.5">
                    {entries.map(([pToot, pDun], idx) => (
                      <div key={idx}>
                        {pToot ? `${pToot} тоот: ` : "Зогсоол: "}{formatNumber(pDun, 2)}₮
                      </div>
                    ))}
                    {entries.length > 1 && (
                      <div className="font-semibold border-t border-gray-600 mt-1 pt-1">
                        Нийт: {formatNumber(totalParkingDun, 2)}₮
                      </div>
                    )}
                  </div>
                );

                return (
                  <Tooltip title={tooltipContent}>
                    <div className="flex flex-col items-end gap-0.5 w-full py-0.5">
                      {entries.map(([pToot, pDun], idx) => (
                        <div key={idx} className="text-right whitespace-nowrap text-[11px] leading-normal">
                          {pToot ? (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1 font-normal">
                              {pToot} тоот:
                            </span>
                          ) : null}
                          <span className="text-black dark:text-white font-medium">
                            {formatNumber(pDun, 2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Tooltip>
                );
              }

              let total = 0;
              (record.avlaga || []).forEach((b) => {
                if (b.ognoo?.slice(0, 7) === ym) {
                  const zardluud = Array.isArray(b.zardluud) && b.zardluud.length > 0
                    ? b.zardluud
                    : [{ ner: b.tailbar, dun: b.tulukhDun }];

                  zardluud.forEach((z) => {
                    if (z.dun <= 0) return;
                    let zName = (z.ner || "").trim();
                    const isJunk = !zName || 
                                  zName === "Нэхэмжлэх" || 
                                  zName === "Авлага" || 
                                  zName === "Авлага (Нэхэмжлэхгүй)" ||
                                  zName.length > 100;
                    
                    if (isJunk) zName = "Бусад";
                    
                    // Do not accumulate parking charges into regular columns
                    if (isParkingCharge(zName, z.turul)) return;

                    if (zName === assessment.tailbar) total += z.dun;
                  });

                  if (assessment.tailbar === "Хөнгөлөлт") {
                    (b.khungulultuud || []).forEach((k: any) => {
                      total += Number(k.dun || k.khungulultiinDun || 0);
                    });
                  }
                }
              });

              if (total <= 0) return "";
              return (
                <span className={`text-[11px] leading-normal ${isKhungCol ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-black dark:text-white"}`}>
                  {formatNumber(total, 2)}
                </span>
              );
            },
          };
        }),
      });
    });

    // Final Total Balance Column
    cols.push({
      key: "balance",
      label: (
        <div className="py-0.5">
          <span className="leading-normal pb-0.5 font-semibold">Нийт</span>
        </div>
      ),
      align: "center",
      fixed: "right",
      children: [
        {
          key: "niitKhungulult",
          label: (
            <div className="flex justify-center w-full py-0.5">
              <span className="block truncate max-w-[100px] text-center leading-normal pb-1 font-medium">
                Хөнгөлөлт
              </span>
            </div>
          ),
          width: 105,
          align: "right",
          fixed: "right",
          render: (_: any, record: NegtgelTailanItem) => {
            let rowKhungulult = Number((record as any).niitKhungulult || 0);
            if (rowKhungulult <= 0) {
              (record.avlaga || []).forEach((b) => {
                (b.zardluud || []).forEach((z) => {
                  if (z.ner === "Хөнгөлөлт" || z.turul === "Хөнгөлөлт") {
                    rowKhungulult += Number(z.dun || 0);
                  }
                });
                (b.khungulultuud || []).forEach((k: any) => {
                  rowKhungulult += Number(k.dun || k.khungulultiinDun || 0);
                });
              });
            }
            return rowKhungulult > 0 ? (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium leading-normal">
                {formatNumber(rowKhungulult, 2)}
              </span>
            ) : "-";
          },
        },
        {
          key: "niitUldegdel",
          label: (
            <div className="flex justify-center w-full py-0.5">
              <span className="block truncate max-w-[100px] text-center leading-normal pb-1 font-medium">
                Үлдэгдэл
              </span>
            </div>
          ),
          width: 110,
          align: "right",
          fixed: "right",
          render: (_: any, record: NegtgelTailanItem) => {
            const bal = Number(record.niitUldegdel ?? record.globalUldegdel ?? record.niitTulukhDun ?? 0);
            return (
              <span className="text-[11px] text-gray-900 dark:text-white font-medium leading-normal">
                {formatNumber(bal, 2)}
              </span>
            );
          },
        }
      ]
    });

    return cols;
  }, [months, avlagaTypes]);

  return (
    <StandardTable
      className="compact-table"
      columns={columns}
      data={data || []}
      loading={loading}
      maxHeight="calc(100vh - 320px)"
      bordered
      containerClassName="rounded-2xl"
      footer={
        <div className="flex justify-end items-center gap-4 py-1.5 border-t border-gray-100 dark:border-gray-800">
          {khuudasKhesegKhen && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Энэ хуудас: {formatNumber(localTotalUldegdel, 2)} ₮
            </span>
          )}
          {localTotalKhungulult > 0 && (
            <>
              <span className="text-[13px] text-gray-500 dark:text-gray-400">Нийт хөнгөлөлт:</span>
              <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">
                {formatNumber(localTotalKhungulult, 2)} ₮
              </span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
            </>
          )}
          <span className="text-[13px] text-gray-500 dark:text-gray-400">Нийт үлдэгдэл:</span>
          <span className="text-[13px] text-emerald-500 font-medium">{formatNumber(totalUldegdel, 2)} ₮</span>
        </div>
      }
    />
  );
}
