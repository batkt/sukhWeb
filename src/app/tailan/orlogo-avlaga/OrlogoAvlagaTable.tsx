"use client";

import React, { useMemo } from "react";
import { Modal } from "antd";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { X } from "lucide-react";
import { motion, useDragControls } from "framer-motion";
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
  _ekhniiUldegdel?: number;
  _periodTulbur?: number;
  _periodPaid?: number;
  [key: string]: any;
}

interface OrlogoAvlagaTableProps {
  data: OrlogoAvlagaItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  activeTab: "tulult" | "avlaga" | "all";
  expandedRow?: string | null;
  expandedLedger: any[];
  expandedGlobalUldegdel: number | null;
  expandedLoading: boolean;
  expandedError: string | null;
  getPaid: (item: any) => number;
  getUldegdel: (item: any) => number;
  onRowClick: (item: any) => void;
  getGereeId: (item: any) => string;
  modalOpen: boolean;
  onModalClose: () => void;
  selectedRecord: OrlogoAvlagaItem | null;
  grandTotalPaid?: number;
  grandTotalUldegdel?: number;
  grandTotalEkhniiUldegdel?: number;
  grandTotalTulbur?: number;
  dateRange?: [string | null, string | null] | undefined;
}

export const OrlogoAvlagaTable: React.FC<OrlogoAvlagaTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  activeTab,
  expandedLedger,
  expandedGlobalUldegdel,
  expandedLoading,
  expandedError,
  getPaid,
  getUldegdel,
  onRowClick,
  getGereeId,
  modalOpen,
  onModalClose,
  selectedRecord,
  grandTotalPaid,
  grandTotalUldegdel,
  grandTotalEkhniiUldegdel,
  grandTotalTulbur,
  dateRange,
}) => {
  const dragControls = useDragControls();

  const baseColumns = useMemo(() => [
    { key: "index", label: "№", width: "50px", align: "center" as const },
    { key: "ner", label: "Харилцагчийн нэр", width: "180px", align: "left" as const },
    { key: "gereeniiDugaar", label: "Гэрээний дугаар", width: "120px", align: "center" as const },
    { key: "davkhar", label: "Давхар", width: "80px", align: "center" as const },
    { key: "toot", label: "Тоот", width: "80px", align: "center" as const },
  ], []);

  const balanceColumns = useMemo(() => {
    if (activeTab === "tulult") {
      return [
        { key: "paid", label: "Төлсөн", width: "150px", align: "right" as const },
      ];
    }
    return [
      { key: "ekhniiUldegdel", label: "Эхний үлдэгдэл", width: "140px", align: "right" as const },
      { key: "tulbur", label: "Төлөх дүн", width: "140px", align: "right" as const },
      { key: "paid", label: "Төлсөн", width: "150px", align: "right" as const },
      { key: "finalBalance", label: "Эцсийн үлдэгдэл", width: "140px", align: "right" as const },
    ];
  }, [activeTab]);

  const allColumns = useMemo(() => [...baseColumns, ...balanceColumns], [baseColumns, balanceColumns]);

  const formatNer = (record: OrlogoAvlagaItem) => {
    const ovogFull = String(record._ovog || "").trim();
    const ner = String(record._ner || "").trim();
    const abbreviated = ovogFull ? `${ovogFull.charAt(0)}.` : "";
    return [abbreviated, ner].filter(Boolean).join(" ") || "-";
  };

  const getCellValue = (record: OrlogoAvlagaItem, key: string, index: number) => {
    switch (key) {
      case "index": return (page - 1) * pageSize + index + 1;
      case "ner": return formatNer(record);
      case "gereeniiDugaar": return record._gereeDugaar || record.gereeniiDugaar || "-";
      case "davkhar": return record._davkhar || "-";
      case "toot": return record._toot || "-";
      case "ekhniiUldegdel": return formatNumber(record._ekhniiUldegdel ?? 0, 2);
      case "tulbur": {
        const ekh = record._ekhniiUldegdel ?? 0;
        const paid = Number(record._periodPaid ?? getPaid(record));
        return formatNumber(ekh - paid, 2);
      }
      case "paid": return formatNumber(Number(record._periodPaid ?? getPaid(record)), 2);
      case "finalBalance": return formatNumber(record._finalUldegdel ?? getUldegdel(record), 2);
      default: return "-";
    }
  };

  const getCellClassName = (key: string) => {
    if (key === "paid") return "text-emerald-600 dark:text-emerald-400";
    if (key === "finalBalance") return "text-red-600 dark:text-red-400";
    return "text-gray-900 dark:text-white";
  };

  const getTotalValue = (key: string) => {
    switch (key) {
      case "ekhniiUldegdel": return formatNumber(grandTotalEkhniiUldegdel ?? 0, 2);
      case "tulbur": return formatNumber((grandTotalEkhniiUldegdel ?? 0) - (grandTotalPaid ?? 0), 2);
      case "paid": return formatNumber(grandTotalPaid ?? 0, 2);
      case "finalBalance": return formatNumber(grandTotalUldegdel ?? 0, 2);
      default: return null;
    }
  };

  // Modal content
  const modalContent = () => {
    if (!selectedRecord) return null;
    const gid = getGereeId(selectedRecord);
    const gd = selectedRecord._gereeDugaar || selectedRecord.gereeniiDugaar || gid;
    const ner = selectedRecord._ner || selectedRecord.ner || "";
    const ovog = selectedRecord._ovog || selectedRecord.ovog || "";
    const fullName = ovog && ner ? `${ovog} ${ner}` : ner || ovog || "";
    const toot = selectedRecord._toot || selectedRecord.toot || "";
    const utas = selectedRecord._utas || selectedRecord.utas || "";
    const titleInfo = [fullName, toot, utas].filter(Boolean).join(" | ");

    const filteredLedger = (() => {
      if (!dateRange?.[0] && !dateRange?.[1]) return expandedLedger;
      const startDate = dateRange[0] ? new Date(dateRange[0]) : null;
      const endDate = dateRange[1] ? new Date(dateRange[1]) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);
      return expandedLedger.filter((row: any) => {
        const rowDate = row?.ognoo ? new Date(row.ognoo) : null;
        if (!rowDate) return false;
        if (startDate && rowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
        return true;
      });
    })();

    const headerClassName = "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-[13px]";

    const ledgerColumns: ColumnsType<any> = [
      { title: "№", key: "index", width: 50, align: "center", className: headerClassName, render: (_: any, __: any, i: number) => i + 1 },
      { title: "Огноо", dataIndex: "ognoo", key: "ognoo", width: 100, className: headerClassName,
        render: (val: string) => <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">{val ? new Date(val).toLocaleString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}</span> },
      { title: "Тайлбар", dataIndex: "tailbar", key: "tailbar", width: 200, className: headerClassName,
        render: (val: string, row: any) => <span className="text-gray-900 dark:text-white max-w-[280px] truncate text-[13px]" title={val || row?.ner || "-"}>{val || row?.ner || row?.turul || "-"}</span> },
      { title: "Төлөх дүн", dataIndex: "tulukhDun", key: "tulukhDun", width: 120, align: "right", className: headerClassName,
        render: (_: any, row: any) => { const v = Number(row?.tulukhDun ?? 0); return v > 0 ? <span className="text-gray-900 dark:text-white text-[13px]">{formatNumber(v, 2)}</span> : <span className="text-[13px]">-</span>; } },
      { title: "Төлсөн дүн", dataIndex: "tulsunDun", key: "tulsunDun", width: 120, align: "right", className: headerClassName,
        render: (_: any, row: any) => { const v = Number(row?.tulsunDun ?? 0); return v > 0 ? <span className="text-gray-900 dark:text-white text-[13px]">{formatNumber(v, 2)}</span> : <span className="text-[13px]">-</span>; } },
      { title: "Үлдэгдэл", dataIndex: "uldegdel", key: "uldegdel", width: 120, align: "right", className: headerClassName,
        render: (val: any) => <span className="text-gray-900 dark:text-white text-[13px]">{formatNumber(Number(val) || 0, 2)}</span> },
    ];

    const totalTulukh = filteredLedger.reduce((s: number, row: any) => s + Number(row?.tulukhDun ?? 0), 0);
    const totalTulsun = filteredLedger.reduce((s: number, row: any) => s + Number(row?.tulsunDun ?? 0), 0);

    return (
      <div className="p-4">
        <div onPointerDown={(e) => dragControls.start(e)} className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 cursor-move select-none">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Дэлгэрэнгүй мэдээлэл</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{titleInfo || gd}</p>
        </div>
        {expandedLoading ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">Уншиж байна...</div>
        ) : expandedError ? (
          <div className="text-red-500 dark:text-red-400 py-2">Алдаа: {expandedError}</div>
        ) : filteredLedger.length === 0 ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">Тэмдэглэл алга байна</div>
        ) : (
          <Table
            dataSource={filteredLedger}
            columns={ledgerColumns}
            rowKey={(r) => r._id || Math.random().toString()}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="small"
            bordered
            sticky
            className="guilgee-table"
            scroll={{ y: 500 }}
            rowClassName={(_, i) => `${i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"} text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200`}
            summary={() => (
              <Table.Summary fixed="bottom">
                <Table.Summary.Row className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <Table.Summary.Cell index={0} colSpan={3} align="center">
                    <span className="font-bold text-gray-900 dark:!text-white text-[13px]">Нийт</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <span className="font-bold text-gray-900 dark:!text-white text-[13px]">{formatNumber(totalTulukh, 2)}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <span className="font-bold text-gray-900 dark:!text-white text-[13px]">{formatNumber(totalTulsun, 2)}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <span className="font-bold text-gray-900 dark:!text-white text-[13px]">
                      {filteredLedger.length > 0 ? formatNumber(Number(filteredLedger[filteredLedger.length - 1]?.uldegdel ?? 0), 2) : "0.00"}
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                {expandedGlobalUldegdel !== null && (
                  <Table.Summary.Row className="bg-red-50 dark:bg-red-900/20 font-bold">
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <span className="font-bold text-red-600 dark:text-red-400 text-[13px]">Нийт үлдэгдэл:</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={2} align="right">
                      <span className="font-bold text-red-600 dark:text-red-400 text-[15px]">{formatNumber(expandedGlobalUldegdel, 2)} ₮</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              </Table.Summary>
            )}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Уншиж байна...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">Мэдээлэл алга байна</span>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div
          className="overflow-auto custom-scrollbar"
          style={{ maxHeight: "calc(100vh - 320px)" }}
        >
          <table className="w-full border-collapse" style={{ minWidth: activeTab === "tulult" ? "800px" : "1200px" }}>
            {/* Header */}
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-50 dark:bg-gray-800/90 backdrop-blur-sm">
                {allColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`
                      px-3 py-3 text-[13px] font-bold tracking-tight whitespace-nowrap
                      border-b-2 border-gray-200 dark:border-gray-600
                      text-gray-700 dark:text-gray-200
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                    `}
                    style={{ width: col.width, minWidth: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {data.map((record, index) => (
                <tr
                  key={record._gereeDugaar || record.gereeniiDugaar || record._id || `row-${index}`}
                  className={`
                    cursor-pointer transition-colors duration-100
                    ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"}
                    hover:bg-blue-50/60 dark:hover:bg-blue-900/15 hover:shadow-sm
                  `}
                  onClick={() => onRowClick(record)}
                >
                  {allColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`
                        px-3 py-2.5 text-[13px] font-medium whitespace-nowrap
                        border-b border-gray-100 dark:border-gray-800
                        ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                        ${getCellClassName(col.key)}
                      `}
                      style={{ width: col.width, minWidth: col.width }}
                    >
                      {col.key === "paid" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 cursor-pointer">
                          {getCellValue(record, col.key, index)}
                        </span>
                      ) : (
                        getCellValue(record, col.key, index)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

            {/* Footer */}
            <tfoot className="sticky bottom-0 z-20">
              <tr className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm border-t-2 border-gray-300 dark:border-gray-600">
                {allColumns.map((col) => {
                  const totalVal = getTotalValue(col.key);
                  const isFirstGroup = ["index", "gereeniiDugaar", "ner", "davkhar", "toot"].includes(col.key);

                  return (
                    <td
                      key={col.key}
                      className={`
                        px-3 py-3 text-[13px] font-bold whitespace-nowrap
                        ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                        ${col.key === "paid" ? "text-emerald-600 dark:text-emerald-400" : ""}
                        ${col.key === "finalBalance" ? "text-red-600 dark:text-red-400" : ""}
                        ${!["paid", "finalBalance"].includes(col.key) ? "text-gray-900 dark:text-white" : ""}
                      `}
                      style={{ width: col.width, minWidth: col.width }}
                    >
                      {col.key === "index" ? "" :
                       col.key === "ner" ? "Нийт" :
                       isFirstGroup ? "" :
                       totalVal || ""}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onCancel={onModalClose}
        footer={null}
        width={1400}
        maskStyle={{ background: "transparent" }}
        closeIcon={<X className="w-5 h-5" />}
        className="dark:bg-gray-900"
        modalRender={(node) => (
          <motion.div drag dragListener={false} dragControls={dragControls} dragMomentum={false}>
            {node}
          </motion.div>
        )}
      >
        {modalContent()}
      </Modal>
    </>
  );
};

export default OrlogoAvlagaTable;
