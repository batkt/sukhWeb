"use client";

import React, { useMemo } from "react";
import { Popconfirm, Tag, Tooltip } from "antd";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Trash2, Loader2, Printer } from "lucide-react";
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
  /** Баримт буцаах (устгах) — заагаагүй бол үйлдлийн багана харагдахгүй */
  onButsaakh?: (row: EbarimtItem) => void;
  /** Одоо буцаагдаж байгаа баримтын _id — тэр мөрд эргэлдэх зураг харуулна */
  butsaajBaigaaId?: string | null;
  /** Баримтыг дахин хэвлэх — заагаагүй бол хэвлэх товч харагдахгүй */
  onKhevlekh?: (row: EbarimtItem) => void;
}

/** Баримт татварын системээс буцаагдсан эсэх */
function butsaasanEsekh(row: EbarimtItem): boolean {
  return !!row?.ustgasanOgnoo;
}

export const EbarimtTable: React.FC<EbarimtTableProps> = ({
  data,
  loading = false,
  onButsaakh,
  butsaajBaigaaId = null,
  onKhevlekh,
}) => {
  const columns: ColumnsType<EbarimtItem> = useMemo(
    () => [
      {
        title: <span className="text-inherit">№</span>,
        key: "index",
        width: 44,
        align: "center",
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: <span className="text-inherit">Огноо</span>,
        dataIndex: "date",
        key: "date",
        align: "center",
        width: 140,
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
        width: 65,
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
        width: 120,
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
        width: 80,
        render: (val: string) => {
          const isB2C = val === "B2C_RECEIPT";
          const isB2B = val === "B2B_RECEIPT";
          const label = isB2C ? "Иргэн" : isB2B ? "ААН" : val || "-";
          const badgeClass = isB2C
            ? "bg-theme/10 text-theme dark:bg-theme/40 dark:text-theme border border-theme/20 dark:border-theme/30"
            : isB2B
              ? "bg-theme/10 text-theme dark:bg-theme/40 dark:text-theme border border-theme/20 dark:border-theme/30"
              : "bg-[color:var(--panel)] text-[color:var(--muted-text)] border border-[color:var(--surface-border)]";
          return (
            <span
              className={`px-2 py-0.5 rounded-full ${badgeClass}`}
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
        width: 270,
        render: (val: string, item: EbarimtItem) => (
          <span className="text-inherit whitespace-nowrap font-mono text-[11px]">
            {item.ddtd || item.receiptId || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Дүн</span>,
        dataIndex: "total",
        key: "total",
        align: "center",
        width: 120,
        onCell: () => ({ className: "!text-right" }),
        render: (val: number) => (
          <span className="text-inherit whitespace-nowrap font-medium">
            {formatNumber(val || 0)}₮
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Үйлчилгээ</span>,
        dataIndex: "service",
        key: "service",
        align: "center",
        width: 130,
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
        width: 85,
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
      ...(onButsaakh || onKhevlekh
        ? ([
            {
              title: <span className="text-inherit">Үйлдэл</span>,
              key: "uildel",
              align: "center",
              width: onButsaakh && onKhevlekh ? 76 : 50,
              fixed: "right",
              render: (_: any, row: EbarimtItem) => {
                const butsaajBaigaa =
                  !!butsaajBaigaaId && butsaajBaigaaId === String(row._id);

                // Буцаасан баримтыг ДАХИН БУЦААХ боломжгүй ч хуулбарыг нь
                // хэвлэж болно — тиймээс хэвлэх товчийг тусад нь гаргана.
                const khevlekhTovch = onKhevlekh ? (
                  <Tooltip title="Баримтыг дахин хэвлэх">
                    <button
                      type="button"
                      aria-label="И-баримт дахин хэвлэх"
                      onClick={() => onKhevlekh(row)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </Tooltip>
                ) : null;

                const butsaakhTovch = (() => {
                  if (!onButsaakh) return null;
                  // Буцаасан баримтыг дахин буцаах боломжгүй
                  if (butsaasanEsekh(row)) return null;
                  if (butsaajBaigaa)
                    return (
                      <Loader2
                        className="h-4 w-4 animate-spin text-danger"
                        aria-label="Буцааж байна"
                      />
                    );
                  // _id байхгүй бол буцаах боломжгүй (хүсэлт _id-гээр явдаг)
                  if (!row._id)
                    return (
                      <Tooltip title="Баримтын _id байхгүй тул буцаах боломжгүй">
                        <span className="text-[color:var(--muted-text)]">
                          -
                        </span>
                      </Tooltip>
                    );
                  return (
                    <Popconfirm
                      title="И-баримт буцаах уу?"
                      description={
                        <span className="">
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
                        className="flex h-7 w-7 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Popconfirm>
                  );
                })();

                if (!khevlekhTovch && !butsaakhTovch)
                  return (
                    <span className="text-[color:var(--muted-text)]">-</span>
                  );

                return (
                  <div className="flex items-center justify-center gap-1">
                    {khevlekhTovch}
                    {butsaakhTovch}
                  </div>
                );
              },
            },
          ] as ColumnsType<EbarimtItem>)
        : []),
    ],
    [onButsaakh, onKhevlekh, butsaajBaigaaId],
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
      <div className="w-full">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) =>
            record.id?.toString() ||
            record.receiptId ||
            Math.random().toString()
          }
          pagination={false}
          loading={loading}
          className="min-w-[1180px]"
          scroll={{ x: "max-content" }}
          rowClassName={(record, index) => `
            ${butsaasanEsekh(record) ? "opacity-55 line-through decoration-danger/70" : ""}
`}
          locale={{
            emptyText: (
              <div className="py-8 text-center bg-white">
                <span className="text-[color:var(--muted-text)]">
                  Хайсан мэдээлэл алга байна
                </span>
              </div>
            ),
          }}
          summary={() =>
            data.length > 0 ? (
              <Table.Summary fixed="bottom">
                <Table.Summary.Row className="bg-[color:var(--surface-hover)]">
                  <Table.Summary.Cell
                    index={0}
                    colSpan={6}
                    align="right"
                    className="bg-[color:var(--surface-hover)] pr-3"
                  >
                    <span className="font-bold text-[color:var(--panel-text)] dark:!text-white">
                      {butsaasanToo > 0 ? "Нийт (хүчинтэй):" : "Нийт:"}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={1}
                    align="right"
                    className="bg-[color:var(--surface-hover)]"
                  >
                    <span className="font-bold text-[color:var(--panel-text)] dark:!text-white whitespace-nowrap">
                      {formatNumber(khuchinteiDun)}₮
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={2}
                    align="center"
                    className="bg-[color:var(--surface-hover)]"
                  >
                    <span className="text-[color:var(--muted-text)]">-</span>
                  </Table.Summary.Cell>
                  {/* Төлөв + (байвал) Үйлдэл багана */}
                  <Table.Summary.Cell
                    index={3}
                    colSpan={onButsaakh ? 2 : 1}
                    align="center"
                    className="bg-[color:var(--surface-hover)]"
                  >
                    {butsaasanToo > 0 ? (
                      <span className="whitespace-nowrap text-danger font-medium">
                        Буцаасан {butsaasanToo}: {formatNumber(butsaasanDun)}₮
                      </span>
                    ) : (
                      <span className="text-[color:var(--muted-text)]">-</span>
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
