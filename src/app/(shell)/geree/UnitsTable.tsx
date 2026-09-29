"use client";

import React, { useMemo } from "react";
import { ShuultuurTolgoi } from "@/components/ui/table/ShuultuurTolgoi";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

export interface FloorItem {
  orts?: string;
  floor: string;
  units: string[];
  filteredUnits: string[];
  activeToots: Set<string>;
  unitToResident: Record<string, any>;
  /** Мөрийн төрөл — «Тоот» таб дээр гаражийн давхар ч мөр болж орно. */
  turul?: "Тоот" | "Зогсоол" | "Агуулах";
}

interface UnitsTableProps {
  data: FloorItem[];
  actions: any;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onAddUnit?: (floor: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => void;
  onDeleteUnit?: (floor: string, unit: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => void;
  onDeleteFloor?: (floor: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  propertyTab?: "Тоот" | "Зогсоол" | "Агуулах";
  selectedFloor?: string | null;
  onSelectFloor?: (floor: string) => void;
  /**
   * Хуудсанд орц бүрээр нь ОЛОН хүснэгт зэрэг байгаа эсэх.
   *
   * Тийм үед хүснэгт бүр цонхны үлдсэн өндрийг дүүргэх гэж оролдвол
   * дээд нь өндөр, доод нь намхан болж хэмжээ таарахгүй — иймд дотоод
   * гүйлтийг унтраана.
   */
  bugdiigKharuulakh?: boolean;
  /** Баганын толгойн шүүлтүүр — өгвөл тухайн баганын толгой шүүлтүүр болж, эрэмбэ хасагдана. */
  ortsShuultuur?: TolgoinShuultuur;
  davkharShuultuur?: TolgoinShuultuur;
  tuluvShuultuur?: TolgoinShuultuur;
  /** Нэг мөрөнд багтах чипийн тоо (хагас өргөнтэй үед бага). */
  chipiinKhyazgaar?: number;
  /** Эцэг сав өөрөө гүйдэг (босоо 50/50) үед хүснэгт цонхны өндрөөр хэмжигдэхгүй. */
  ondoriinKhyazgaargui?: boolean;
}

type TolgoinShuultuur = {
  current: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
};

export const UnitsTable: React.FC<UnitsTableProps> = ({
  data,
  actions,
  loading = false,
  page = 1,
  pageSize = 500,
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
  sortKey,
  sortOrder,
  propertyTab = "Тоот",
  selectedFloor = null,
  onSelectFloor,
  bugdiigKharuulakh = false,
  ortsShuultuur,
  davkharShuultuur,
  tuluvShuultuur,
  chipiinKhyazgaar = 12,
  ondoriinKhyazgaargui = false,
}) => {
  const columns: ColumnsType<FloorItem> = useMemo(() => {
    const cols: ColumnsType<FloorItem> = [
      {
        title: <span className="text-[color:var(--panel-text)]">№</span>,
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: (
          <span className="text-[color:var(--panel-text)]">Нийт тоот</span>
        ),
        dataIndex: "units",
        key: "unitsCount",
        align: "center",
        width: 80,
        sorter: true,
        sortOrder:
          sortKey === "unitsCount" || sortKey === "units"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        className: "font-medium",
        render: (units: string[]) => (
          <span className="text-[color:var(--panel-text)] whitespace-nowrap">
            {units ? units.length : 0}
          </span>
        ),
      },
      {
        title: ortsShuultuur ? (
          <ShuultuurTolgoi label="Орц" {...ortsShuultuur} />
        ) : (
          <span className="text-[color:var(--panel-text)]">Орц</span>
        ),
        dataIndex: "orts",
        key: "orts",
        align: "center",
        width: ortsShuultuur ? 110 : 75,
        ...(ortsShuultuur
          ? {}
          : {
              sorter: true,
              sortOrder:
                sortKey === "orts"
                  ? sortOrder === "asc"
                    ? ("ascend" as const)
                    : ("descend" as const)
                  : null,
            }),
        render: (val: string, record: FloorItem) =>
          record.turul === "Зогсоол" ? (
            // «Тоот» таб дээрх гаражийн давхрын мөр
            <span className="text-[color:var(--panel-text)] whitespace-nowrap">Гараж</span>
          ) : (
            <span className="text-[color:var(--panel-text)] whitespace-nowrap">
              {val ? `${val}-р орц` : "-"}
            </span>
          ),
      },
      {
        title: davkharShuultuur ? (
          <ShuultuurTolgoi label="Давхар" {...davkharShuultuur} />
        ) : (
          <span className="text-[color:var(--panel-text)]">Давхар</span>
        ),
        dataIndex: "floor",
        key: "floor",
        align: "center",
        width: davkharShuultuur ? 120 : 95,
        ...(davkharShuultuur
          ? {}
          : {
              sorter: true,
              sortOrder:
                sortKey === "floor"
                  ? sortOrder === "asc"
                    ? ("ascend" as const)
                    : ("descend" as const)
                  : null,
            }),
        render: (val: string) => (
          <span className="text-[color:var(--panel-text)] whitespace-nowrap">
            {/^b/i.test(String(val || "")) ? `${val} давхар` : `${val}-р давхар`}
          </span>
        ),
      },
    ];

    // Нэг мөрөнд хамгийн олон тоот хэдэн ширхэг байгааг олж баганын өргөнийг
    // түүгээр тогтооно (чипний өргөн 48px + 6px зай + нүдний 16px хүрээ).
    const maxUnits = (data || []).reduce(
      (max, row) => Math.max(max, row.filteredUnits?.length || 0),
      0,
    );
    // Хэт олон дугаартай (ж: 45 гараж) мөр хүснэгтийг хэвтээ сунгахгүй —
    // 12 чипээс цааш дараагийн мөрөнд шилжинэ. Бүх хүснэгт ижил өргөнтэй.
    const tootuudWidth = Math.max(200, Math.min(maxUnits, chipiinKhyazgaar) * 54 + 16);

    cols.push({
      width: tootuudWidth,
      title: tuluvShuultuur ? (
        <ShuultuurTolgoi
          label={propertyTab === "Зогсоол" ? "Гаражийн дугаарууд" : propertyTab === "Агуулах" ? "Агуулахын дугаарууд" : "Тоотууд"}
          {...tuluvShuultuur}
        />
      ) : (
        <span className={`text-[color:var(--panel-text)] text-center block ${propertyTab === "Зогсоол" ? "" : "font-medium"}`}>
          {propertyTab === "Зогсоол"
            ? "Гаражийн дугаарууд"
            : propertyTab === "Агуулах"
              ? "Агуулахын дугаарууд"
              : "Тоотууд"}
        </span>
      ),
      dataIndex: "filteredUnits",
      key: "filteredUnits",
      align: "center",
        render: (filteredUnits: string[], record: FloorItem) => {
          // «Тоот» таб дээрх гаражийн давхрын мөр: дугаарын чип биш, товч
          // тойм (дэлгэрэнгүй жагсаалт нь «Гараж» таб дээр).
          if (record.turul === "Зогсоол" && propertyTab === "Тоот") {
            const too = record.units?.length || 0;
            return too === 0 ? (
              <span className="text-[color:var(--muted-text)]">
                Гаражийн дугаар алга — «+» дарж нэмнэ
              </span>
            ) : (
              <span className="text-[color:var(--panel-text)]">
                {too} гаражийн дугаар
                <span className="text-[color:var(--muted-text)]"> · {record.activeToots.size} бүртгэлтэй</span>
              </span>
            );
          }
          if (!filteredUnits || filteredUnits.length === 0) {
            return (
              <span className="italic text-[color:var(--muted-text)]">
                Хоосон
              </span>
            );
          }
          return (
            <div
              className="mx-auto flex flex-wrap items-center justify-center gap-1.5 py-0.5"
              style={{ maxWidth: chipiinKhyazgaar * 54 }}
            >
              {filteredUnits.map((unit) => {
                const unitStr = String(unit).trim();
                const hasActive = record.activeToots.has(unitStr);
                const garaj = record.turul === "Зогсоол" && propertyTab === "Тоот";
                return (
                  <div
                    key={unitStr}
                    title={garaj ? `Гараж ${record.floor}-${unitStr}${hasActive ? " · бүртгэлтэй" : " · чөлөөтэй"}` : undefined}
                    className={`group relative flex items-center justify-center w-[48px] h-[28px] rounded-lg border transition-all duration-150 ${
                      // Ногоон дэвсгэргүй: бүртгэлтэй тоот нь хүрээ + тод бичиг + цэгээр ялгарна.
                      hasActive
                          ? "border-theme bg-[color:var(--surface-bg)] shadow-sm"
                          : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:border-theme shadow-sm"
                    }`}
                  >
                    <span
                      className={`${propertyTab === "Зогсоол" ? "" : "font-medium"} ${
                        hasActive
                          ? "text-brand font-semibold"
                          : "text-[color:var(--muted-text)]"
                      }`}
                    >
                      {unitStr}
                    </span>
                    {hasActive && (
                      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-theme" />
                    )}
                    {/* Холбогдсон тоотод устгах «×» гаргахгүй — alert-аар
                        хориглохын оронд үйлдлийг ерөөсөө санал болгохгүй. */}
                    {!hasActive && (
                      <button
                        className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-neutral text-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-danger z-20 scale-90 group-hover:scale-100"
                        aria-label={`Устгах ${unitStr}`}
                        title="Устгах"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUnit?.(record.floor, unitStr, record.turul);
                        }}
                      >
                        <span className="leading-none">×</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        },
      });

    cols.push({
      title: <span className="text-[color:var(--panel-text)]">Үйлдэл</span>,
      key: "action",
      align: "center",
      width: 96,
      render: (_: any, record: FloorItem) => (
        <div className="flex items-center justify-center gap-1">
          <button
            className="p-1.5 rounded-md hover-surface transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
            title={record.turul === "Зогсоол" ? "Гаражийн дугаар нэмэх" : "Шинэ тоот нэмэх"}
            onClick={(e) => {
              e.stopPropagation();
              onAddUnit?.(record.floor, record.turul);
            }}
          >
            <Plus className="w-4 h-4 text-brand" />
          </button>
          {/* Гаражийн давхрын мөрөнд давхар устгах товчгүй (зөвхөн «+»). */}
          {!(record.turul === "Зогсоол" && propertyTab === "Тоот") && (
          <button
            className={`p-1.5 rounded-md action-delete hover-surface transition-colors hover:bg-danger/10 ${
              record.units.length === 0
                ? "opacity-20 cursor-not-allowed grayscale"
                : ""
            }`}
            title={
              record.units.length === 0
                ? "Устгах тоот байхгүй"
                : "Давхрын тоотуудыг устгах"
            }
            onClick={(e) => {
              e.stopPropagation();
              if (record.units.length > 0) {
                onDeleteFloor?.(record.floor, record.turul);
              }
            }}
            disabled={record.units.length === 0}
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
          )}
          {record.turul === "Зогсоол" && propertyTab === "Тоот" && (
            <span className="inline-block h-7 w-7" aria-hidden="true" />
          )}
        </div>
      ),
    });

    return cols;
  }, [
    // Баганын өргөн нь мөрүүдийн тоотын тооноос хамаардаг тул `data` хэрэгтэй.
    data,
    ortsShuultuur,
    davkharShuultuur,
    tuluvShuultuur,
    chipiinKhyazgaar,
    page,
    pageSize,
    onAddUnit,
    onDeleteUnit,
    onDeleteFloor,
    propertyTab,
    sortKey,
    sortOrder,
  ]);

  return (
    <div className="w-full">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => `${record.turul || ""}-${record.orts || ""}-${record.floor}`}
        pagination={false}
        loading={loading}
        onChange={(_: any, __: any, sorter: any) => {
          if (actions?.toggleSortFor) {
            actions.toggleSortFor(
              sorter.field || sorter.columnKey,
              sorter.order,
            );
          }
        }}
        onRow={(record) => ({
          onClick: () => {
            if (onSelectFloor) {
              onSelectFloor(record.floor);
            }
          },
        })}
        scroll={
          bugdiigKharuulakh || ondoriinKhyazgaargui
            ? { x: "max-content", y: "none" }
            : { x: "max-content" }
        }
        rowClassName={(record) =>
          // Ээлжлэх/hover өнгийг стандарт хүснэгт өөрөө хийнэ — энд зөвхөн
          // сонгосон давхарын онцлолт үлдэнэ.
          `cursor-pointer${
            selectedFloor === record.floor ? " zt-row-selected font-medium" : ""
          }`
        }
        locale={{
          emptyText: (
            <span className="text-[color:var(--muted-text)]">
              Давхарын мэдээлэл алга
            </span>
          ),
        }}
      />
    </div>
  );
};

export default UnitsTable;
