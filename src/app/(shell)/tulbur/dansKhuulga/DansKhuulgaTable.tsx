"use client";

import React, { useMemo } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { CheckOutlined, ExclamationOutlined } from "@ant-design/icons";
import formatNumber from "../../../../../tools/function/formatNumber";

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
          <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
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
          <span className="text-[color:var(--panel-text)] dark:text-white" title={val}>
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
        // Орлого ногоон (+), зарлага улаан (−)
        render: (val: number) => {
          const n = Number(val) || 0;
          return (
            <span
              className={`whitespace-nowrap font-medium ${
                n < 0 ? "!text-danger" : n > 0 ? "!text-success" : "text-[color:var(--panel-text)]"
              }`}
            >
              {n > 0 ? "+" : ""}
              {formatNumber(n, 2)}
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
          <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
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
              <span className="text-[color:var(--muted-text)]">-</span>
            );
          }
          const ner = gereeniiEzenNer(geree);
          const nemelt = (item.contracts?.length || 0) - 1;
          return (
            <span
              className="text-[color:var(--panel-text)] dark:text-white"
              title={item.contracts?.map(gereeniiTailbar).join("\n")}
            >
              {ner || "-"}
              {geree.toot ? (
                <span className="text-[color:var(--muted-text)]">
                  {" "}· {geree.toot} тоот
                </span>
              ) : null}
              {nemelt > 0 ? (
                <span className="text-[color:var(--muted-text)]"> +{nemelt}</span>
              ) : null}
            </span>
          );
        },
      },
      {
        // Гүйлгээг гараар холбосон ажилтан — backend `guilgeeKholbyo` нь
        // `kholbosonAjiltniiNer`-ийг хадгална. Автомат холболтод хоосон.
        title: "Ажилтан",
        key: "ajiltan",
        align: "left",
        width: 150,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "ajiltan" ? sortOrder : null,
        render: (_: any, item: DansKhuulgaItem) => {
          const ner = item.raw?.kholbosonAjiltniiNer;
          return ner ? (
            <span className="block truncate text-[color:var(--panel-text)] dark:text-white" title={ner}>
              {ner}
            </span>
          ) : (
            <span className="text-[color:var(--muted-text)]">-</span>
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
        // НӨАТУС (и-баримт) илгээгдсэн эсэх
        title: "НӨАТУС",
        key: "ebarimt",
        align: "center",
        width: 100,
        sorter: true,
        sortDirections: ["ascend", "descend"] as const,
        sortOrder: sortKey === "ebarimt" ? sortOrder : null,
        render: (_: any, item: DansKhuulgaItem) =>
          item.raw?.ebarimtAvsanEsekh ? (
            <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-success">
              Илгээсэн
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-[color:var(--surface-hover)] px-2 py-0.5 text-[color:var(--muted-text)]">
              Илгээгээгүй
            </span>
          ),
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
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-theme/10 text-brand border border-theme/30 hover:bg-theme/10 dark:hover:bg-theme/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Холболт салгах"
                >
                  <CheckOutlined className="" />
                </button>
              ) : (
                <button
                  onClick={() => onLink?.(item)}
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-danger/10 text-danger border border-danger/30 hover:bg-danger/10 hover:scale-105 active:scale-95 transition-all duration-200"
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
      <div className="w-full">
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
          scroll={{ x: 1330 }}
          onChange={(_pagination, _filters, sorter: any) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            const order = s?.order ?? null;
            onSort?.(order ? String(s?.columnKey ?? s?.field ?? "") : null, order);
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center bg-[color:var(--surface-bg)]">
                <span className="text-[color:var(--muted-text)]">
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
                <Table.Summary.Row className="bg-[color:var(--surface-hover)]">
                  {/* № + Огноо + Гүйлгээний утга */}
                  <Table.Summary.Cell index={0} colSpan={3} align="right" className="pr-2">
                    <span className="font-medium text-[color:var(--panel-text)] dark:!text-white whitespace-nowrap">
                      Нийт дүн:
                    </span>
                  </Table.Summary.Cell>
                  {/* Гүйлгээний дүн */}
                  <Table.Summary.Cell index={3} align="right">
                    <span className="font-medium text-[color:var(--panel-text)] dark:!text-white whitespace-nowrap">
                      {formatNumber(totalSum, 2)}₮
                    </span>
                  </Table.Summary.Cell>
                  {/* Шилжүүлсэн данс, Оршин суугч, Ажилтан, Холбосон огноо, НӨАТУС, Төлөв */}
                  <Table.Summary.Cell index={4} colSpan={6} />
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
