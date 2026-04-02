"use client";

import React, { useMemo } from "react";
import { Table, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import formatNumber from "../../../../tools/function/formatNumber";

export interface OrlogoAvlagaItem {
  _id?: string;
  _gereeId?: string;
  _gereeDugaar?: string;
  _residentId?: string;
  _ner?: string;
  _ovog?: string;
  _utas?: string;
  _toot?: string;
  _davkhar?: string;
  [key: string]: any;
}

interface OrlogoAvlagaTableProps {
  data: OrlogoAvlagaItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  activeTab: "tulult" | "avlaga";
  expandedRow?: string | null;
  expandedLedger: any[];
  expandedLoading: boolean;
  expandedError: string | null;
  getPaid: (item: any) => number;
  getUldegdel: (item: any) => number;
  onRowClick: (item: any) => void;
  getGereeId: (item: any) => string;
  modalOpen: boolean;
  onModalClose: () => void;
  selectedRecord: OrlogoAvlagaItem | null;
}

export const OrlogoAvlagaTable: React.FC<OrlogoAvlagaTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  activeTab,
  expandedLedger,
  expandedLoading,
  expandedError,
  getPaid,
  getUldegdel,
  onRowClick,
  getGereeId,
  modalOpen,
  onModalClose,
  selectedRecord,
}) => {
  const headerClassName =
    "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-[13px]";

  const columns: ColumnsType<OrlogoAvlagaItem> = useMemo(() => {
    const baseColumns: ColumnsType<OrlogoAvlagaItem> = [
      {
        title: <span className="text-gray-900 dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: headerClassName,
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: <span className="text-gray-900 dark:text-white">ГД</span>,
        key: "gereeniiDugaar",
        width: 100,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {record._gereeDugaar || record.gereeniiDugaar || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Нэр
          </span>
        ),
        key: "ner",
        width: 100,
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {[record._ovog, record._ner].filter(Boolean).join(" ") || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Давхар</span>,
        key: "davkhar",
        width: 80,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {record._davkhar || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Тоот</span>,
        key: "toot",
        width: 80,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {record._toot || "-"}
          </span>
        ),
      },
    ];

    if (activeTab === "tulult") {
      return [
        ...baseColumns,
        {
          title: (
            <span className="text-gray-900 dark:text-white">Гүйцэтгэл</span>
          ),
          key: "paid",
          width: 120,
          align: "right",
          className: headerClassName,
          render: (_: any, record: OrlogoAvlagaItem) => {
            const paid = getPaid(record);
            return (
              <button
                type="button"
                onClick={() => onRowClick(record)}
                className="text-gray-900 dark:text-white underline underline-offset-2 decoration-current cursor-pointer inline-flex items-center gap-1"
              >
                <span className="text-green-600 dark:text-green-400 font-medium text-[13px]">
                  {formatNumber(paid, 2)}
                </span>
              </button>
            );
          },
        },
      ];
    } else {
      return [
        ...baseColumns,
        {
          title: (
            <span className="text-gray-900 dark:text-white text-center block w-full">
              Үлдэгдэл
            </span>
          ),
          key: "uldegdel",
          width: 120,
          align: "right",
          className: headerClassName,
          render: (_: any, record: OrlogoAvlagaItem) => {
            const uldegdel = getUldegdel(record);
            return (
              <button
                type="button"
                onClick={() => onRowClick(record)}
                className="text-gray-900 dark:text-white underline underline-offset-2 decoration-current cursor-pointer inline-flex items-center gap-1"
              >
                <span
                  className={
                    uldegdel > 0
                      ? "text-red-500 dark:text-red-400 font-medium"
                      : uldegdel < 0
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-gray-900 dark:text-white"
                  }
                >
                  {formatNumber(uldegdel, 2)}
                </span>
              </button>
            );
          },
        },
        {
          title: (
            <span className="text-gray-900 dark:text-white text-center block w-full">
              Төлөлт
            </span>
          ),
          key: "paid",
          width: 120,
          align: "right",
          className: headerClassName,
          render: (_: any, record: OrlogoAvlagaItem) => {
            const paid = getPaid(record);
            return (
              <span className="text-green-600 dark:text-green-400 text-[13px]">
                {formatNumber(paid, 2)}
              </span>
            );
          },
        },
      ];
    }
  }, [activeTab, page, pageSize, getPaid, getUldegdel, onRowClick, getGereeId]);

  const modalContent = () => {
    if (!selectedRecord) return null;
    const gid = getGereeId(selectedRecord);
    const gd =
      selectedRecord._gereeDugaar || selectedRecord.gereeniiDugaar || gid;

    // Get resident info for modal title - try multiple field name variations
    const ner = selectedRecord._ner || selectedRecord.ner || "";
    const ovog = selectedRecord._ovog || selectedRecord.ovog || "";
    const fullName = ovog && ner ? `${ovog} ${ner}` : ner || ovog || "";
    const toot =
      selectedRecord._toot ||
      selectedRecord.toot ||
      selectedRecord._tootName ||
      "";
    const utas =
      selectedRecord._utas || selectedRecord.utas || selectedRecord.phone || "";
    const titleInfo = [fullName, toot, utas].filter(Boolean).join(" | ");

    const ledgerColumns: ColumnsType<any> = [
      {
        title: <span className="text-gray-900 dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: headerClassName,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block w-full">
            Огноо
          </span>
        ),
        dataIndex: "ognoo",
        key: "ognoo",
        width: 100,
        className: headerClassName,
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {val ? new Date(val).toLocaleDateString("mn-MN") : "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block w-full">
            Тайлбар
          </span>
        ),
        dataIndex: "tailbar",
        key: "tailbar",
        width: 200,
        className: headerClassName,
        render: (val: string, row: any) => (
          <span
            className="text-gray-900 dark:text-white max-w-[280px] truncate text-[13px]"
            title={val || row?.ner || row?.turul || "-"}
          >
            {val || row?.ner || row?.turul || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block w-full">
            Авлага
          </span>
        ),
        dataIndex: "avlagaDun",
        key: "avlaga",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const avlaga =
            Number(row?.avlagaDun ?? row?.tulukhDun ?? row?.debit ?? 0) || 0;
          return avlaga > 0 ? (
            <span className="text-red-500 dark:text-red-400 text-[13px]">
              {formatNumber(avlaga, 2)}
            </span>
          ) : (
            <span className="text-[13px]">-</span>
          );
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block w-full">
            Төлөлт
          </span>
        ),
        dataIndex: "tulsunDun",
        key: "tulult",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const tulult =
            Number(row?.tulsunDun ?? row?.tulult ?? row?.credit ?? 0) || 0;
          return tulult > 0 ? (
            <span className="text-green-600 dark:text-green-400 text-[13px]">
              {formatNumber(tulult, 2)}
            </span>
          ) : (
            <span className="text-[13px]">-</span>
          );
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block w-full">
            Үлдэгдэл
          </span>
        ),
        dataIndex: "uldegdel",
        key: "uldegdel",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const uldeg = Number(row?.uldegdel ?? 0);
          return (
            <span
              className={
                (uldeg > 0
                  ? "text-red-500 dark:text-red-400 font-medium"
                  : uldeg < 0
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-gray-900 dark:text-white") + " text-[13px]"
              }
            >
              {formatNumber(uldeg, 2)}
            </span>
          );
        },
      },
    ];

    return (
      <div className="p-4">
        <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Дэлгэрэнгүй мэдээлэл
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {titleInfo || gd}
          </p>
        </div>
        {expandedLoading ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            Уншиж байна...
          </div>
        ) : expandedError ? (
          <div className="text-red-500 dark:text-red-400 py-2">
            Алдаа: {expandedError}
          </div>
        ) : expandedLedger.length === 0 ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            Тэмдэглэл алга байна
          </div>
        ) : (
          <Table
            dataSource={expandedLedger}
            columns={ledgerColumns}
            rowKey={(record) => record._id || Math.random().toString()}
            pagination={false}
            size="small"
            bordered
            className="guilgee-table"
            scroll={{ y: 400 }}
            rowClassName={(record, index) => `
              ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
              text-gray-900 dark:text-white
              hover:bg-gray-100 dark:hover:bg-gray-600
              transition-colors duration-200
            `}
          />
        )}
      </div>
    );
  };

  return (
    <div className="table-surface w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) =>
          record._gereeDugaar ||
          record.gereeniiDugaar ||
          record._id ||
          Math.random().toString()
        }
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        scroll={{ x: "max-content", y: 480 }}
        rowClassName={(record, index) => `
          ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
          text-gray-900 dark:text-white
          hover:bg-blue-50 dark:hover:bg-blue-900/20
          hover:shadow-sm
          cursor-pointer
          transition-all duration-150
        `}
        locale={{
          emptyText: (
            <span className="text-gray-500 dark:text-gray-400">
              Мэдээлэл алга байна
            </span>
          ),
        }}
        summary={(pageData) => {
          if (pageData.length === 0) return null;

          let totalPaid = 0;
          let totalUldegdel = 0;

          pageData.forEach((record) => {
            totalPaid += getPaid(record);
            totalUldegdel += getUldegdel(record);
          });

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-gray-50 dark:bg-gray-900">
                <Table.Summary.Cell
                  index={0}
                  colSpan={5}
                  align="center"
                  className="bg-gray-50 dark:bg-gray-900"
                >
                  <span className="font-bold text-gray-900 dark:!text-white force-bold text-[11px]">
                    Нийт
                  </span>
                </Table.Summary.Cell>
                {activeTab === "avlaga" ? (
                  <>
                    <Table.Summary.Cell
                      index={1}
                      align="right"
                      className="bg-gray-50 dark:bg-gray-900"
                    >
                      <span
                        className={`font-bold force-bold text-[11px] ${totalUldegdel > 0 ? "text-gray-900 dark:!text-white" : totalUldegdel < 0 ? "text-emerald-600 dark:!text-emerald-400" : "text-gray-900 dark:!text-white"}`}
                      >
                        {formatNumber(totalUldegdel, 2)} ₮
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={2}
                      align="right"
                      className="bg-gray-50 dark:bg-gray-900"
                    >
                      <span className="font-bold text-green-600 dark:text-green-400 force-bold text-[11px] dark:!text-white">
                        {formatNumber(totalPaid, 2)} ₮
                      </span>
                    </Table.Summary.Cell>
                  </>
                ) : (
                  <Table.Summary.Cell
                    index={1}
                    align="right"
                    className="bg-gray-50 dark:bg-gray-900"
                  >
                    <span className="font-bold text-green-600 dark:text-green-400 force-bold text-[11px] dark:!text-white">
                      {formatNumber(totalPaid, 2)} ₮
                    </span>
                  </Table.Summary.Cell>
                )}
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
      <Modal
        open={modalOpen}
        onCancel={onModalClose}
        footer={null}
        width={1100}
        closeIcon={<X className="w-5 h-5" />}
        className="dark:bg-gray-900"
      >
        {modalContent()}
      </Modal>
    </div>
  );
};

export default OrlogoAvlagaTable;
