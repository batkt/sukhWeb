"use client";

import React, { useMemo } from "react";
import { Table, Modal } from "antd";
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

  const headerClassName =
    "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-[13px]";

  const columns: ColumnsType<OrlogoAvlagaItem> = useMemo(() => {
    const baseColumns: ColumnsType<OrlogoAvlagaItem> = [
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            №
          </span>
        ),
        key: "index",
        width: 50,
        align: "center",
        className: headerClassName,
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            Харилцагчийн нэр
          </span>
        ),
        key: "ner",
        width: 180,
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => {
          const ovogFull = String(record._ovog || "").trim();
          const ner = String(record._ner || "").trim();
          const abbreviated = ovogFull ? `${ovogFull.charAt(0)}.` : "";
          const fullName = [abbreviated, ner].filter(Boolean).join(" ");
          return (
            <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
              {fullName || "-"}
            </span>
          );
        },
        sorter: (a, b) => {
          const nameA = [a._ovog, a._ner].filter(Boolean).join(" ");
          const nameB = [b._ovog, b._ner].filter(Boolean).join(" ");
          return nameA.localeCompare(nameB, "mn-MN");
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            Гэрээний дугаар
          </span>
        ),
        key: "gereeniiDugaar",
        width: 120,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {record._gereeDugaar || record.gereeniiDugaar || "-"}
          </span>
        ),
        sorter: (a, b) =>
          String(a._gereeDugaar || a.gereeniiDugaar || "").localeCompare(
            String(b._gereeDugaar || b.gereeniiDugaar || ""),
          ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            Давхар
          </span>
        ),
        key: "davkhar",
        width: 80,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {record._davkhar || "-"}
          </span>
        ),
        sorter: (a, b) =>
          Number(a._davkhar || 0) - Number(b._davkhar || 0) ||
          String(a._davkhar || "").localeCompare(String(b._davkhar || "")),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            Тоот
          </span>
        ),
        key: "toot",
        width: 80,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap text-[13px]">
            {record._toot || "-"}
          </span>
        ),
        sorter: (a, b) =>
          Number(a._toot || 0) - Number(b._toot || 0) ||
          String(a._toot || "").localeCompare(String(b._toot || "")),
      },
    ];

    const balanceColumns: ColumnsType<OrlogoAvlagaItem> =
      activeTab === "tulult"
        ? [
            {
              title: (
                <span className="text-gray-900 dark:text-white text-center block text-[13px]">
                  Төлсөн
                </span>
              ),
              key: "paid",
              width: 150,
              align: "right",
              className: headerClassName,
              render: (_: any, record: OrlogoAvlagaItem) => {
                const paid = Number(record._periodPaid ?? getPaid(record));
                return (
                  <button
                    type="button"
                    onClick={() => onRowClick(record)}
                    className="text-gray-900 dark:text-white underline underline-offset-2 decoration-current cursor-pointer inline-flex items-center gap-1 w-full justify-end"
                  >
                    <span className="text-green-600 dark:text-green-400 font-bold text-[13px]">
                      {formatNumber(paid, 2)}
                    </span>
                  </button>
                );
              },
              sorter: (a, b) =>
                Number(a._periodPaid ?? 0) - Number(b._periodPaid ?? 0),
            },
          ]
        : [
            {
              title: (
                <span className="text-gray-900 dark:text-white text-center block text-[13px]">
                  Эхний үлдэгдэл
                </span>
              ),
              key: "openingBalance",
              width: 140,
              align: "right",
              className: headerClassName,
              render: (_: any, record: OrlogoAvlagaItem) => (
                <span className="text-gray-900 dark:text-white font-medium text-[13px]">
                  {formatNumber(record._ekhniiUldegdel ?? 0, 2)}
                </span>
              ),
              sorter: (a, b) =>
                Number(a._ekhniiUldegdel ?? 0) - Number(b._ekhniiUldegdel ?? 0),
            },
            {
              title: (
                <span className="text-gray-900 dark:text-white text-center block text-[13px]">
                  Төлөх дүн
                </span>
              ),
              key: "billed",
              width: 140,
              align: "right",
              className: headerClassName,
              render: (_: any, record: OrlogoAvlagaItem) => (
                <span className="text-gray-900 dark:text-white font-medium text-[13px]">
                  {formatNumber(record._periodTulbur ?? 0, 2)}
                </span>
              ),
              sorter: (a, b) =>
                Number(a._periodTulbur ?? 0) - Number(b._periodTulbur ?? 0),
            },
            {
              title: (
                <span className="text-gray-900 dark:text-white text-center block text-[13px]">
                  Төлсөн
                </span>
              ),
              key: "paid",
              width: 150,
              align: "right",
              className: headerClassName,
              render: (_: any, record: OrlogoAvlagaItem) => {
                const paid = Number(record._periodPaid ?? getPaid(record));
                return (
                  <button
                    type="button"
                    onClick={() => onRowClick(record)}
                    className="text-gray-900 dark:text-white underline underline-offset-2 decoration-current cursor-pointer inline-flex items-center gap-1 w-full justify-end"
                  >
                    <span className="text-green-600 dark:text-white text-[13px]">
                      {formatNumber(paid, 2)}
                    </span>
                  </button>
                );
              },
              sorter: (a, b) =>
                Number(a._periodPaid ?? 0) - Number(b._periodPaid ?? 0),
            },
            {
              title: (
                <span className="text-gray-900 dark:text-white text-center block text-[13px]">
                  Эцсийн үлдэгдэл
                </span>
              ),
              key: "finalBalance",
              width: 140,
              align: "right",
              className: headerClassName,
              render: (_: any, record: OrlogoAvlagaItem) => (
                <span className="text-red-600 dark:text-red-400 text-[13px]">
                  {formatNumber(record._finalUldegdel ?? getUldegdel(record), 2)}
                </span>
              ),
              sorter: (a, b) =>
                Number(a._finalUldegdel ?? 0) - Number(b._finalUldegdel ?? 0),
            },
          ];

    return [...baseColumns, ...balanceColumns];
  }, [page, pageSize, activeTab, getPaid, getUldegdel, onRowClick]);

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

    // Filter ledger by date range (regular calculation, not useMemo)
    const filteredLedger = (() => {
      if (!dateRange?.[0] && !dateRange?.[1]) return expandedLedger;

      const startDate = dateRange[0] ? new Date(dateRange[0]) : null;
      const endDate = dateRange[1] ? new Date(dateRange[1]) : null;
      // Set end date to end of day
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      return expandedLedger.filter((row: any) => {
        const rowDate = row?.ognoo ? new Date(row.ognoo) : null;
        if (!rowDate) return false;

        if (startDate && rowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
        return true;
      });
    })();

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
            {val
              ? new Date(val).toLocaleString("mn-MN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
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
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            Төлөх дүн
          </span>
        ),
        dataIndex: "tulukhDun",
        key: "tulukhDun",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const tulbur =
            Number(row?.tulukhDun ?? row?.avlagaDun ?? row?.debit ?? 0) || 0;
          return tulbur > 0 ? (
            <span className="text-gray-900 dark:text-white text-[13px]">
              {formatNumber(tulbur, 2)}
            </span>
          ) : (
            <span className="text-[13px]">-</span>
          );
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            Төлсөн дүн
          </span>
        ),
        dataIndex: "tulsunDun",
        key: "tulsunDun",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const tulult =
            Number(row?.tulsunDun ?? row?.tulult ?? row?.credit ?? 0) || 0;
          return tulult > 0 ? (
            <span className="text-gray-900 dark:text-white text-[13px]">
              {formatNumber(tulult, 2)}
            </span>
          ) : (
            <span className="text-[13px]">-</span>
          );
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block text-[13px]">
            Үлдэгдэл
          </span>
        ),
        dataIndex: "uldegdel",
        key: "uldegdel",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (val: any) => (
          <span className="text-gray-900 dark:text-white text-[13px]">
            {formatNumber(Number(val) || 0, 2)}
          </span>
        ),
      },
    ];

    // Calculate totals for summary row (using filtered data)
    const totalTulukh = filteredLedger.reduce(
      (sum: number, row: any) =>
        sum + Number(row?.tulukhDun ?? row?.avlagaDun ?? row?.debit ?? 0),
      0,
    );
    const totalTulsun = filteredLedger.reduce(
      (sum: number, row: any) =>
        sum + Number(row?.tulsunDun ?? row?.tulult ?? row?.credit ?? 0),
      0,
    );

    return (
      <div className="p-4">
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 cursor-move select-none"
        >
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
        ) : filteredLedger.length === 0 ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            Тэмдэглэл алга байна
          </div>
        ) : (
          <Table
            dataSource={filteredLedger}
            columns={ledgerColumns}
            rowKey={(record) => record._id || Math.random().toString()}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="small"
            bordered
            className="guilgee-table"
            scroll={{ y: 500 }}
            rowClassName={(record, index) => `
              ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
              text-gray-900 dark:text-white
              hover:bg-gray-100 dark:hover:bg-gray-600
              transition-colors duration-200
            `}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <Table.Summary.Cell index={0} colSpan={3} align="center">
                    <span className="font-bold text-gray-900 dark:!text-white text-[13px]">
                      Нийт
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <span className="font-bold text-gray-900 dark:!text-white text-[13px]">
                      {formatNumber(totalTulukh, 2)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <span className="font-bold text-gray-900 dark:!text-white text-[13px]">
                      {formatNumber(totalTulsun, 2)}
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                {expandedGlobalUldegdel !== null && (
                  <Table.Summary.Row className="bg-red-50 dark:bg-red-900/20 font-bold">
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <span className="font-bold text-red-600 dark:text-red-400 text-[13px]">
                        Нийт үлдэгдэл:
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={2} align="right">
                      <span className="font-bold text-red-600 dark:text-red-400 text-[15px]">
                        {formatNumber(expandedGlobalUldegdel, 2)} ₮
                      </span>
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
        scroll={{ x: "max-content" }}
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
        summary={() => {
          const finalPaid = grandTotalPaid ?? 0;
          const finalUldegdel = grandTotalUldegdel ?? 0;
          const finalEkhniiUldegdel = grandTotalEkhniiUldegdel ?? 0;
          const finalTulbur = grandTotalTulbur ?? 0;

          if (activeTab === "tulult") {
            return (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700">
                  <Table.Summary.Cell
                    index={0}
                    colSpan={5}
                    align="center"
                    className="bg-gray-50 dark:bg-gray-900 py-3"
                  >
                    <span className="font-bold text-gray-900 dark:!text-white force-bold text-[13px]">
                      Нийт
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={1}
                    align="right"
                    className="bg-gray-50 dark:bg-gray-900 py-3"
                  >
                    <span className="font-bold text-green-600 dark:!text-white force-bold text-[13px]">
                      {formatNumber(finalPaid, 2)}
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700">
                <Table.Summary.Cell
                  index={0}
                  colSpan={5}
                  align="center"
                  className="bg-gray-50 dark:bg-gray-900 py-3"
                >
                  <span className="font-bold text-gray-900 dark:!text-white force-bold text-[13px]">
                    Нийт
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell
                  index={1}
                  align="right"
                  className="bg-gray-50 dark:bg-gray-900 py-3"
                >
                  <span className="font-bold text-gray-900 dark:!text-white force-bold text-[13px]">
                    {formatNumber(finalEkhniiUldegdel, 2)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell
                  index={2}
                  align="right"
                  className="bg-gray-50 dark:bg-gray-900 py-3"
                >
                  <span className="font-bold text-gray-900 dark:!text-white force-bold text-[13px]">
                    {formatNumber(finalTulbur, 2)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell
                  index={3}
                  align="right"
                  className="bg-gray-50 dark:bg-gray-900 py-3"
                >
                  <span className="font-bold text-green-600 dark:!text-white force-bold text-[13px]">
                    {formatNumber(finalPaid, 2)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell
                  index={4}
                  align="right"
                  className="bg-gray-50 dark:bg-gray-900 py-3"
                >
                  <span className="font-bold text-red-600 dark:!text-red-400 force-bold text-[13px]">
                    {formatNumber(finalUldegdel, 2)}
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
      <Modal
        open={modalOpen}
        onCancel={onModalClose}
        footer={null}
        width={1400}
        maskStyle={{ background: "transparent" }}
        closeIcon={<X className="w-5 h-5" />}
        className="dark:bg-gray-900"
        modalRender={(node) => (
          <motion.div
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
          >
            {node}
          </motion.div>
        )}
      >
        {modalContent()}
      </Modal>
    </div>
  );
};

export default OrlogoAvlagaTable;
