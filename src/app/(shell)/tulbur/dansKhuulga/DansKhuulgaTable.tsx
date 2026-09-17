"use client";

import React, { useMemo } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { CheckOutlined, ExclamationOutlined } from "@ant-design/icons";
import formatNumber from "../../../../../tools/function/formatNumber";

const bankLabelMap: Record<string, string> = {
  khanbank: "Хаан банк",
  golomt: "Голомт банк",
  tdb: "ХХБанк",
  bogd: "Богд банк",
  trans: "Тэнгэр",
  qpay: "QPay",
};

/** Гэрээнээс оршин суугчийн харагдах нэрийг гаргана. */
const gereeniiEzenNer = (geree: any): string => {
  if (!geree) return "";
  const buten = `${geree.ovog || ""} ${geree.ner || ""}`.trim();
  return buten || String(geree.ner || "");
};

/** "12 тоот · Батбаяр" маягийн нэг мөр тайлбар. */
const gereeniiTailbar = (geree: any): string => {
  const kheseg: string[] = [];
  if (geree?.toot) kheseg.push(`${geree.toot} тоот`);
  const ner = gereeniiEzenNer(geree);
  if (ner) kheseg.push(ner);
  if (geree?.gereeniiDugaar) kheseg.push(String(geree.gereeniiDugaar));
  return kheseg.join(" · ");
};

export interface DansKhuulgaItem {
  id: string | number;
  date: string;
  month: string;
  total: number;
  balance?: number | null;
  action: string;
  contractIds?: string[];
  /** Эцэг хуудас `_id`-аар нь татаж өгсөн бүтэн гэрээнүүд. */
  contracts?: any[];
  account?: string;
  raw?: any;
  [key: string]: any;
}

export type DansKhuulgaSortOrder = "ascend" | "descend" | null;

interface DansKhuulgaTableProps {
  data: DansKhuulgaItem[];
  loading?: boolean;
  page?: number;
  rowsPerPage?: number;
  maxHeight?: string | number;
  onLink?: (item: DansKhuulgaItem) => void;
  onUnlink?: (item: DansKhuulgaItem) => void;
  /**
   * Эрэмбийг ЭЦЭГ компонент эзэмшинэ. Энэ хүснэгтэд зөвхөн тухайн хуудсын
   * мөрүүд ирдэг тул antd-ын дотоод эрэмбэ хэрэглэвэл ЗӨВХӨН харагдаж
   * байгаа хуудас эрэмбэлэгдэж, бүх өгөгдлийн хувьд буруу дараалал
   * үүснэ. Тиймээс эрэмбийг дээш гаргаж, зүсэхээс ӨМНӨ хийнэ.
   */
  sortKey?: string | null;
  sortOrder?: DansKhuulgaSortOrder;
  onSort?: (key: string | null, order: DansKhuulgaSortOrder) => void;
}

export const DansKhuulgaTable: React.FC<DansKhuulgaTableProps> = ({
  data,
  loading = false,
  page = 1,
  rowsPerPage = 500,
  maxHeight = "calc(100vh - 500px)",
  onLink,
  onUnlink,
  sortKey = null,
  sortOrder = null,
  onSort,
}) => {
  const columns: ColumnsType<DansKhuulgaItem> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * rowsPerPage + index + 1,
      },
      {
        title: "Огноо",
        dataIndex: "date",
        key: "date",
        align: "center",
        width: 150,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "date" ? sortOrder : null,
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Гүйлгээний утга",
        dataIndex: "action",
        align: "left",
        key: "action",
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "action" ? sortOrder : null,
        render: (val: string, item: DansKhuulgaItem) => (
          <span className="text-gray-900 dark:text-white" title={val}>
            {item.action || item.raw?.uilchilgeeniiUtga || "-"}
          </span>
        ),
      },
      {
        title: "Гүйлгээний дүн",
        dataIndex: "total",
        key: "total",
        align: "right",
        width: 140,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "total" ? sortOrder : null,
        render: (val: number) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap font-medium">
            {formatNumber(val || 0, 2)}
          </span>
        ),
      },
      {
        title: "Үлдэгдэл",
        dataIndex: "balance",
        key: "balance",
        align: "right",
        width: 140,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "balance" ? sortOrder : null,
        render: (val: number | undefined, item: DansKhuulgaItem) => {
          const bal =
            val ??
            item.balance ??
            item.raw?.balance ??
            item.raw?.closingBalance ??
            item.raw?.bal ??
            item.raw?.accountBalance;
          if (bal === null || bal === undefined || bal === "") return "-";
          const num = Number(bal);
          return (
            <span className="text-gray-900 dark:text-white whitespace-nowrap font-medium">
              {!isNaN(num) ? formatNumber(num, 2) : "-"}
            </span>
          );
        },
      },
      {
        title: "Шилжүүлсэн данс",
        dataIndex: "account",
        key: "account",
        align: "center",
        width: 180,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "account" ? sortOrder : null,
        render: (val: string, item: DansKhuulgaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {item.account || item.raw?.bairlal || "-"}
          </span>
        ),
      },
      {
        // Холбогдсон гүйлгээний ЭЗЭН хэн болохыг хүснэгтээс шууд харуулна
        // — өмнө нь зөвхөн "холбогдсон" гэдэг нь л мэдэгддэг байв.
        title: "Оршин суугч",
        key: "resident",
        align: "left",
        width: 200,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "resident" ? sortOrder : null,
        render: (_: any, item: DansKhuulgaItem) => {
          const geree = item.contracts?.[0];
          if (!geree) {
            // Холбоогүй мөр, эсвэл гэрээ нь татагдаж амжаагүй.
            return (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            );
          }
          const ner = gereeniiEzenNer(geree);
          const nemelt = (item.contracts?.length || 0) - 1;
          return (
            <span
              className="text-gray-900 dark:text-white"
              title={item.contracts?.map(gereeniiTailbar).join("\n")}
            >
              {ner || "-"}
              {geree.toot ? (
                <span className="text-gray-500 dark:text-gray-400">
                  {" "}· {geree.toot} тоот
                </span>
              ) : null}
              {nemelt > 0 ? (
                <span className="text-gray-400"> +{nemelt}</span>
              ) : null}
            </span>
          );
        },
      },
      {
        title: "Холбосон огноо",
        dataIndex: "updatedAt",
        key: "linkedDate",
        align: "center",
        width: 150,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "linkedDate" ? sortOrder : null,
        render: (_: any, item: DansKhuulgaItem) => {
          const isLinked = (item.contractIds?.length || 0) > 0;
          if (!isLinked) return "-";
          const dateVal = item.raw?.updatedAt || null;
          const d = dateVal ? new Date(dateVal) : null;
          if (!d) return "-";
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
      },
      {
        title: "Төлөв",
        key: "status",
        align: "center",
        width: 100,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "status" ? sortOrder : null,
        render: (_: any, item: DansKhuulgaItem) => {
          const isLinked = (item.contractIds?.length || 0) > 0;
          return (
            <div className="flex items-center justify-center">
              {isLinked ? (
                <button
                  onClick={() => onUnlink?.(item)}
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Холболт салгах"
                >
                  <CheckOutlined className="" />
                </button>
              ) : (
                <button
                  onClick={() => onLink?.(item)}
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Гүйлгээ холбох"
                >
                  <ExclamationOutlined className="" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [page, rowsPerPage, onLink, onUnlink, sortKey, sortOrder],
  );

  const totalSum = useMemo(
    () => data.reduce((sum, item) => sum + (item.total || 0), 0),
    [data],
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto hide-scrollbar">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) => record.id?.toString() || Math.random().toString()}
          pagination={false}
          loading={loading}
          // `x: "max-content"` + `min-w-[1000px]` хоёр зэрэг ажиллаж байсан тул
          // баганууд өөрсдийн өргөнөөрөө хумигдаад баруун талд ЭЗЭНГҮЙ зурвас
          // үлддэг байв. Одоо тодорхой доод өргөн (багануудын нийлбэр) өгч,
          // "Гүйлгээний утга" баганыг өргөнгүй үлдээснээр тэр багана үлдсэн
          // зайг шингээж, хоосон багана арилна.
          scroll={{ x: 1220, y: maxHeight }}
          onChange={(_pagination, _filters, sorter: any) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            const order = s?.order ?? null;
            onSort?.(order ? String(s?.columnKey ?? s?.field ?? "") : null, order);
          }}
          expandable={{
            // Задлах товчийг стандарт хүснэгт өөрөө (зүүн талд) зурна.
            expandedRowRender: (record) => {
              const raw = record.raw || {};
              const txnNo =
                raw.record ||
                raw.tranId ||
                raw.recNum ||
                raw.jrno ||
                raw.NtryRef ||
                raw.refno ||
                raw.requestId ||
                "-";
              const bankLabel = bankLabelMap[raw.bank] || raw.bank || "-";
              // Өмнө нь энд гэрээний түүхий `_id`
              // ("6a4def37f9c8db0cec503fd8") бичигддэг байсан нь
              // хэрэглэгчид ямар ч утгагүй. Одоо гэрээний дугаар, тоот,
              // эзэмшигчийг харуулна; гэрээ нь татагдаагүй бол л id үлдэнэ.
              const contractLabel =
                record.contracts && record.contracts.length > 0
                  ? record.contracts.map(gereeniiTailbar).join(" | ")
                  : record.contractIds && record.contractIds.length > 0
                    ? record.contractIds.join(", ")
                    : "-";
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-0.5">
                      Гүйлгээний №
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white font-mono">
                      {txnNo}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-0.5">
                      Огноо, цаг
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {record.date || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-0.5">
                      Төрөл
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {bankLabel}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-0.5">
                      Дансны эзэмшигч
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {raw.accName || "-"}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-gray-500 dark:text-gray-400 mb-0.5">
                      Тайлбар
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white break-words">
                      {record.action || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-0.5">
                      Холбогдсон гэрээ
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {contractLabel}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-0.5">
                      и-баримт
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {raw.ebarimtAvsanEsekh ? "Авсан" : "Аваагүй"}
                    </div>
                  </div>
                </div>
              );
            },
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center bg-white dark:bg-gray-900">
                <span className="text-gray-500 dark:text-gray-400">
                  Гүйлгээний мэдээлэл олдсонгүй
                </span>
              </div>
            ),
          }}
          summary={() =>
            data.length > 0 ? (
              // `fixed` — хөл мөрийг доод талд ЗҮҮЖ хөлдөөнө. Өмнө нь энгийн
              // мөр байсан тул урт жагсаалт дээр доош гүйлгэхэд алга болж,
              // сүүлийн мөртэй давхцаж харагддаг байв.
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-gray-50 dark:bg-gray-800">
                  <Table.Summary.Cell
                    index={0}
                    colSpan={2}
                    align="center"
                    className="dark:border-gray-700"
                  />
                  <Table.Summary.Cell
                    index={1}
                    align="right"
                    className="dark:border-gray-700 pr-2"
                  >
                    <span className="font-medium text-gray-900 dark:!text-white whitespace-nowrap">
                      Нийт дүн:
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={2}
                    align="right"
                    className="dark:border-gray-700"
                  >
                    <span className="font-medium text-gray-900 dark:!text-white whitespace-nowrap">
                      {formatNumber(totalSum, 2)}₮
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={3}
                    align="center"
                    className="dark:border-gray-700"
                  >
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  </Table.Summary.Cell>
                  {/* Шилжүүлсэн данс */}
                  <Table.Summary.Cell
                    index={4}
                    align="center"
                    className="dark:border-gray-700"
                  >
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  </Table.Summary.Cell>
                  {/* Оршин суугч */}
                  <Table.Summary.Cell
                    index={5}
                    className="dark:border-gray-700"
                  />
                  {/* Холбосон огноо */}
                  <Table.Summary.Cell
                    index={6}
                    className="dark:border-gray-700"
                  />
                  {/* Төлөв */}
                  <Table.Summary.Cell
                    index={7}
                    className="dark:border-gray-700"
                  />
                  {/* Дэлгэрэнгүй */}
                  <Table.Summary.Cell
                    index={8}
                    className="dark:border-gray-700"
                  />
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </div>
    </div>
  );
};

export default DansKhuulgaTable;
