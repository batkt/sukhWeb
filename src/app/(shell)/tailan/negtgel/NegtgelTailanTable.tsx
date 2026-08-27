import React, { useMemo } from "react";
import { Tooltip } from "antd";
import formatNumber from "tools/function/formatNumber";
import { StandardTable } from "@/components/ui/StandardTable";

export interface ZardalItem {
  ner?: string;
  turul?: string;
  dun: number;
}

export interface AvlagaItem {
  ognoo: string;
  tailbar: string;
  tulukhDun: number;
  zardluud?: ZardalItem[];
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
          <span className="text-[11px] text-black dark:text-white">{index + 1}</span>
        ),
      },
      {
        key: "ner",
        label: "Нэр",
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
              <div className="text-left text-[11px] text-black dark:text-white truncate">
                {buten}
              </div>
            </Tooltip>
          );
        },
      },
      {
        key: "toot",
        label: "Тоот",
        width: 50,
        align: "center",
        fixed: "left",
        render: (_: any, record: NegtgelTailanItem) => (
          <span className="text-[11px] text-black dark:text-white">
            {record._id?.toot || record.toot || "-"}
          </span>
        ),
      },
      {
        key: "utas",
        label: "Утас",
        width: 90,
        align: "center",
        fixed: "left",
        render: (_: any, record: NegtgelTailanItem) => {
          const u = record._id?.utas || record.utas;
          return (
            <span className="text-[11px] text-black dark:text-white">
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
        label: ym,
        align: "center",
          children: typesInMonth.map((assessment, subIdx) => ({
            key: `${ym}|${assessment.tailbar}`,
            label: (
              <div className="flex justify-center w-full">
                <Tooltip title={assessment.tailbar}>
                  <span className="block truncate max-w-[85px] text-center">
                    {assessment.tailbar}
                  </span>
                </Tooltip>
              </div>
            ),
            width: 95,
            align: "right",
            onCell: () => ({
              className: subIdx === typesInMonth.length - 1 ? "!border-r-2 !border-r-slate-300 dark:!border-r-slate-800" : ""
            }),
            onHeaderCell: () => ({
              className: subIdx === typesInMonth.length - 1 ? "!border-r-2 !border-r-slate-300 dark:!border-r-slate-800" : ""
            }),
            render: (_: any, record: NegtgelTailanItem) => {
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
                  
                  if (zName === assessment.tailbar) total += z.dun;
                });
              }
            });

            if (total <= 0) return "";
            return (
              <span className="text-[11px] text-black dark:text-white">
                {formatNumber(total, 2)}
              </span>
            );
          },
        })),
      });
    });

    // Final Total Balance Column
    cols.push({
      key: "balance",
      label: "Нийт",
      align: "center",
      fixed: "right",
      children: [
        {
          key: "niitUldegdel",
          label: "Үлдэгдэл",
          width: 100,
          align: "right",
          fixed: "right",
          render: (_: any, record: NegtgelTailanItem) => {
            const bal = Number(record.niitUldegdel ?? record.globalUldegdel ?? record.niitTulukhDun ?? 0);
            return (
              <span className="text-[11px] text-gray-900 dark:text-white">
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
        <div className="flex justify-end items-center gap-3 py-1.5 border-t border-gray-100 dark:border-gray-800">
          {khuudasKhesegKhen && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Энэ хуудас: {formatNumber(localTotalUldegdel, 2)} ₮
            </span>
          )}
          <span className="text-[13px] text-gray-500 dark:text-gray-400">Нийт үлдэгдэл:</span>
          <span className="text-[13px] text-emerald-500">{formatNumber(totalUldegdel, 2)} ₮</span>
        </div>
      }
    />
  );
}
