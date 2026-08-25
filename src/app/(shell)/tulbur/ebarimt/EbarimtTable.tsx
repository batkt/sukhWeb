"use client";

import React, { useMemo } from "react";
import { Table, Popconfirm, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Trash2, Loader2 } from "lucide-react";
import formatNumber from "../../../../../tools/function/formatNumber";

export interface EbarimtItem {
  id?: string | number;
  /** Mongo-ийн _id — буцаах хүсэлтэд ЭНЭ хэрэглэгдэнэ (id нь ДДТД) */
  _id?: string;
  receiptId?: string;
  ddtd?: string;
  date?: string;
  month?: string;
  total?: number;
  toot?: string;
  gereeniiDugaar?: string;
  totalVAT?: number;
  totalCityTax?: number;
  type?: string;
  payStatus?: string;
  payCode?: string;
  service?: string;
  /** Татварын системээс буцаагдсан огноо — байвал баримт хүчингүй */
  ustgasanOgnoo?: string | Date | null;
  [key: string]: any;
}

interface EbarimtTableProps {
  data: EbarimtItem[];
  loading?: boolean;
  maxHeight?: string | number;
  /** Баримт буцаах (устгах) — заагаагүй бол үйлдлийн багана харагдахгүй */
  onButsaakh?: (row: EbarimtItem) => void;
  /** Одоо буцаагдаж байгаа баримтын _id — тэр мөрд эргэлдэх зураг харуулна */
  butsaajBaigaaId?: string | null;
}

/** Баримт татварын системээс буцаагдсан эсэх */
function butsaasanEsekh(row: EbarimtItem): boolean {
  return !!row?.ustgasanOgnoo;
}

export const EbarimtTable: React.FC<EbarimtTableProps> = ({
  data,
  loading = false,
  maxHeight = "calc(100vh - 500px)",
  onButsaakh,
  butsaajBaigaaId = null,
}) => {
  const columns: ColumnsType<EbarimtItem> = useMemo(
    () => [
      {
        title: <span className="text-inherit">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: <span className="text-inherit">Огноо</span>,
        dataIndex: "date",
        key: "date",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string) => (
          <span className="text-inherit whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Тоот</span>,
        dataIndex: "toot",
        key: "toot",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string, item: EbarimtItem) => (
          <span className="text-inherit whitespace-nowrap">
            {item.toot || item.medeelel?.toot || item.orshinSuugch?.toot || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-inherit">Гэрээний дугаар</span>
        ),
        dataIndex: "gereeniiDugaar",
        key: "gereeniiDugaar",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string) => (
          <span className="text-inherit whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Төрөл</span>,
        dataIndex: "type",
        key: "type",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string) => {
          const isB2C = val === "B2C_RECEIPT";
          const isB2B = val === "B2B_RECEIPT";
          const label = isB2C ? "Иргэн" : isB2B ? "ААН" : val || "-";
          const badgeClass = isB2C
            ? "bg-green-500/10 text-green-600 dark:bg-green-900/40 dark:text-green-400 border border-green-500/20 dark:border-green-500/30"
            : isB2B
              ? "bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30"
              : "bg-gray-500/10 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-500/20 dark:border-gray-500/30";
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${badgeClass}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        title: <span className="text-inherit">ДДТД</span>,
        dataIndex: "ddtd",
        key: "ddtd",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string, item: EbarimtItem) => (
          <span className="text-inherit whitespace-nowrap font-mono text-xs">
            {item.ddtd || item.receiptId || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Дүн</span>,
        dataIndex: "total",
        key: "total",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        onCell: () => ({ className: "!text-right" }),
        render: (val: number) => (
          <span className="text-inherit whitespace-nowrap font-medium">
            {formatNumber(val || 0)}
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Үйлчилгээ</span>,
        dataIndex: "service",
        key: "service",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string) => (
          <span className="text-inherit whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Төлөв</span>,
        key: "tuluv",
        align: "center",
        width: 110,
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, row: EbarimtItem) =>
          butsaasanEsekh(row) ? (
            <Tooltip
              title={`Буцаасан: ${new Date(
                row.ustgasanOgnoo as string,
              ).toLocaleString("mn-MN")}`}
            >
              <Tag color="red" className="!m-0 cursor-help">
                Буцаасан
              </Tag>
            </Tooltip>
          ) : (
            <Tag color="green" className="!m-0">
              Хүчинтэй
            </Tag>
          ),
      },
      ...(onButsaakh
        ? ([
            {
              title: <span className="text-inherit">Үйлдэл</span>,
              key: "uildel",
              align: "center",
              width: 80,
              fixed: "right",
              className:
                "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
              render: (_: any, row: EbarimtItem) => {
                // Буцаасан баримтыг дахин буцаах боломжгүй — товч харагдахгүй
                if (butsaasanEsekh(row))
                  return (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  );

                const butsaajBaigaa =
                  !!butsaajBaigaaId && butsaajBaigaaId === String(row._id);

                if (butsaajBaigaa)
                  return (
                    <Loader2
                      className="mx-auto h-4 w-4 animate-spin text-red-500"
                      aria-label="Буцааж байна"
                    />
                  );

                // _id байхгүй бол буцаах боломжгүй (хүсэлт _id-гээр явдаг)
                if (!row._id)
                  return (
                    <Tooltip title="Баримтын _id байхгүй тул буцаах боломжгүй">
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    </Tooltip>
                  );

                return (
                  <Popconfirm
                    title="И-баримт буцаах уу?"
                    description={
                      <span className="text-xs">
                        Татварын системээс мөн буцаагдана.
                        <br />
                        Үйлдлийг эргүүлэх боломжгүй.
                      </span>
                    }
                    okText="Тийм"
                    cancelText="Үгүй"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onButsaakh(row)}
                  >
                    <button
                      type="button"
                      aria-label="И-баримт буцаах"
                      className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Popconfirm>
                );
              },
            },
          ] as ColumnsType<EbarimtItem>)
        : []),
    ],
    [onButsaakh, butsaajBaigaaId],
  );

  // Буцаасан баримт нь хүчингүй тул нийт дүнд ОРОХГҮЙ. Буцаасан дүнг тусад
  // нь харуулна - тайлан тулгахад хоёулаа хэрэгтэй.
  const { khuchinteiDun, butsaasanDun, butsaasanToo } = useMemo(() => {
    let khuchintei = 0;
    let butsaasan = 0;
    let too = 0;
    for (const item of data) {
      if (butsaasanEsekh(item)) {
        butsaasan += item.total || 0;
        too += 1;
      } else {
        khuchintei += item.total || 0;
      }
    }
    return {
      khuchinteiDun: khuchintei,
      butsaasanDun: butsaasan,
      butsaasanToo: too,
    };
  }, [data]);

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto hide-scrollbar">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) =>
            record.id?.toString() ||
            record.receiptId ||
            Math.random().toString()
          }
          pagination={false}
          size="small"
          bordered
          loading={loading}
          className="guilgee-table min-w-[1180px] dark:bg-gray-900 dark:text-gray-100"
          scroll={{ x: "max-content", y: maxHeight }}
          rowClassName={(record, index) => `
            ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
            text-gray-900 dark:text-white
            hover:bg-gray-100 dark:hover:bg-gray-600
            transition-colors duration-200
            ${butsaasanEsekh(record) ? "opacity-55 line-through decoration-red-400/70" : ""}
          `}
          locale={{
            emptyText: (
              <div className="py-8 text-center bg-white dark:bg-gray-900">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Хайсан мэдээлэл алга байна
                </span>
              </div>
            ),
          }}
          summary={() =>
            data.length > 0 ? (
              <Table.Summary fixed="bottom">
                <Table.Summary.Row className="bg-gray-50 dark:bg-gray-800">
                  <Table.Summary.Cell index={0} colSpan={6} align="center">
                    <span className="font-bold text-gray-900 dark:!text-white">
                      {butsaasanToo > 0 ? "Нийт (хүчинтэй):" : "Нийт:"}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right" className="bg-gray-50 dark:bg-gray-800">
                    <span className="font-bold text-gray-900 dark:!text-white">
                      {formatNumber(khuchinteiDun)}₮
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  </Table.Summary.Cell>
                  {/* Төлөв + (байвал) Үйлдэл багана */}
                  <Table.Summary.Cell
                    index={3}
                    colSpan={onButsaakh ? 2 : 1}
                    align="center"
                  >
                    {butsaasanToo > 0 ? (
                      <span className="whitespace-nowrap text-xs text-red-500">
                        Буцаасан {butsaasanToo}: {formatNumber(butsaasanDun)}₮
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </div>
    </div>
  );
};

export default EbarimtTable;
