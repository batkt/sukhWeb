"use client";

import React, { useMemo } from "react";
import { Modal, ConfigProvider } from "antd";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { X, FileText, Phone, Home, Hash } from "lucide-react";
import { motion, useDragControls } from "framer-motion";
import formatNumber from "../../../../../tools/function/formatNumber";
import FilterDatePicker from "@/components/ui/FilterDatePicker";

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
  _periodKhungulult?: number;
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
  grandTotalKhungulult?: number;
  grandTotalUldegdel?: number;
  grandTotalEkhniiUldegdel?: number;
  grandTotalTulbur?: number;
  dateRange?: [string | null, string | null] | undefined;
}

export const OrlogoAvlagaTable: React.FC<OrlogoAvlagaTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 500,
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
  grandTotalKhungulult,
  grandTotalUldegdel,
  grandTotalEkhniiUldegdel,
  grandTotalTulbur,
  dateRange,
}) => {
  const dragControls = useDragControls();
  const [ledgerPage, setLedgerPage] = React.useState(1);
  const [ledgerDateRange, setLedgerDateRange] = React.useState<[string | null, string | null] | null | undefined>(dateRange);

  React.useEffect(() => {
    if (modalOpen) {
      setLedgerPage(1);
      setLedgerDateRange(dateRange);
    }
  }, [modalOpen, selectedRecord]);

  const baseColumns = useMemo(() => [
    { key: "index", label: "№", width: "40px", align: "center" as const },
    { key: "ner", label: "Харилцагчийн нэр", width: "180px", align: "left" as const },
    { key: "gereeniiDugaar", label: "Гэрээний дугаар", width: "120px", align: "center" as const },
    { key: "davkhar", label: "Давхар", width: "80px", align: "center" as const },
    { key: "toot", label: "Тоот", width: "60px", align: "center" as const },
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
      { key: "khungulult", label: "Хөнгөлөлт", width: "130px", align: "right" as const },
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
      case "tulbur": return formatNumber(record._periodTulbur ?? 0, 2);
      case "paid": return formatNumber(Number(record._periodPaid ?? getPaid(record)), 2);
      case "khungulult": return formatNumber(Number(record._periodKhungulult ?? 0), 2);
      case "finalBalance": return formatNumber(record._finalUldegdel ?? getUldegdel(record), 2);
      default: return "-";
    }
  };

  const getTotalValue = (key: string) => {
    switch (key) {
      case "ekhniiUldegdel": return formatNumber(grandTotalEkhniiUldegdel ?? 0, 2);
      case "tulbur": return formatNumber(grandTotalTulbur ?? 0, 2);
      case "paid": return formatNumber(grandTotalPaid ?? 0, 2);
      case "khungulult": return formatNumber(grandTotalKhungulult ?? 0, 2);
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
    /** Огноо + цаг: 2026-09-18 14:05 */
    const ognooTsag = (val?: string) => {
      if (!val) return "-";
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);
      const p2 = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
    };

    const filteredLedger = (() => {
      if (!ledgerDateRange?.[0] && !ledgerDateRange?.[1]) return expandedLedger;
      const startDate = ledgerDateRange[0] ? new Date(ledgerDateRange[0]) : null;
      const endDate = ledgerDateRange[1] ? new Date(ledgerDateRange[1]) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);
      return expandedLedger.filter((row: any) => {
        const rowDate = row?.ognoo ? new Date(row.ognoo) : null;
        if (!rowDate) return false;
        if (startDate && rowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
        return true;
      });
    })();

    const ledgerColumns: ColumnsType<any> = [
      { title: "№", key: "index", width: 40, align: "center", render: (_: any, __: any, index: number) => (ledgerPage - 1) * 50 + index + 1 },
      // Огноо зүүн тийш, цагтай
      { title: "Огноо", dataIndex: "ognoo", key: "ognoo", width: 140, align: "left",
        render: (val: string) => <span className="whitespace-nowrap tabular-nums">{ognooTsag(val)}</span> },
      // Өргөнгүй — үлдсэн зайг авна
      { title: "Тайлбар", dataIndex: "tailbar", key: "tailbar", align: "left",
        render: (val: string, row: any) => <span className="block truncate" title={val || row?.ner || "-"}>{val || row?.ner || row?.turul || "-"}</span> },
      { title: "Төлөх дүн", dataIndex: "tulukhDun", key: "tulukhDun", width: 120, align: "right",
        render: (_: any, row: any) => { const v = Number(row?.tulukhDun ?? 0); return v > 0 ? <span className="">{formatNumber(v, 2)}</span> : <span className="">-</span>; } },
      { title: "Төлсөн дүн", dataIndex: "tulsunDun", key: "tulsunDun", width: 120, align: "right",
        render: (_: any, row: any) => { const v = Number(row?.tulsunDun ?? 0); return v > 0 ? <span className="">{formatNumber(v, 2)}</span> : <span className="">-</span>; } },
      { title: "Үлдэгдэл", dataIndex: "uldegdel", key: "uldegdel", width: 120, align: "right",
        render: (val: any) => <span className="">{formatNumber(Number(val) || 0, 2)}</span> },
    ];

    const totalTulukh = filteredLedger.reduce((s: number, row: any) => s + Number(row?.tulukhDun ?? 0), 0);
    const totalTulsun = filteredLedger.reduce((s: number, row: any) => s + Number(row?.tulsunDun ?? 0), 0);

    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] shadow-2xl">
        {/* ── Толгой: гарчиг + оршин суугчийн мэдээлэл + огноо ── */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-move select-none border-b border-[color:var(--surface-border)] px-6 py-4 pr-14"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-theme/10 text-brand">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-medium text-[color:var(--panel-text)]">
                  {fullName || "Дэлгэрэнгүй мэдээлэл"}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[color:var(--muted-text)]">
                  {toot && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--surface-hover)] px-2 py-0.5">
                      <Home className="h-3 w-3" /> {toot} тоот
                    </span>
                  )}
                  {utas && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--surface-hover)] px-2 py-0.5">
                      <Phone className="h-3 w-3" /> {utas}
                    </span>
                  )}
                  {gd && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--surface-hover)] px-2 py-0.5">
                      <Hash className="h-3 w-3" /> {gd}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div onPointerDown={(e) => e.stopPropagation()} className="shrink-0">
              <FilterDatePicker
                value={ledgerDateRange ?? undefined}
                onChange={(_, dateStr) => {
                  if (!dateStr[0] && !dateStr[1]) setLedgerDateRange(null);
                  else setLedgerDateRange([dateStr[0] || null, dateStr[1] || null]);
                  setLedgerPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Хураангуй ── */}
        <div className="grid grid-cols-2 gap-3 border-b border-[color:var(--surface-border)] px-6 py-3 md:grid-cols-4">
          {[
            { nershil: "Төлөх дүн", utga: totalTulukh, ungu: "text-[color:var(--panel-text)]" },
            { nershil: "Төлсөн дүн", utga: totalTulsun, ungu: "text-success" },
            {
              nershil: "Үлдэгдэл (хугацаанд)",
              utga: filteredLedger.length > 0 ? Number(filteredLedger[filteredLedger.length - 1]?.uldegdel ?? 0) : 0,
              ungu: "text-[color:var(--panel-text)]",
            },
            ...(expandedGlobalUldegdel !== null
              ? [{ nershil: "Нийт үлдэгдэл", utga: expandedGlobalUldegdel, ungu: "text-danger" }]
              : []),
          ].map((k) => (
            <div key={k.nershil} className="rounded-xl border border-[color:var(--ctl-border)] px-4 py-2.5">
              <div className={`text-lg font-medium tabular-nums ${k.ungu}`}>{formatNumber(k.utga, 2)}</div>
              <div className="text-[11px] text-[color:var(--muted-text)]">{k.nershil}</div>
            </div>
          ))}
        </div>

        {expandedLoading ? (
          <div className="py-10 text-center text-sm text-[color:var(--muted-text)]">Уншиж байна...</div>
        ) : expandedError ? (
          <div className="px-6 py-6 text-sm text-danger">Алдаа: {expandedError}</div>
        ) : filteredLedger.length === 0 ? (
          <div className="py-10 text-center text-sm text-[color:var(--muted-text)]">Тэмдэглэл алга байна</div>
        ) : (
          <Table
            dataSource={filteredLedger}
            columns={ledgerColumns}
            rowKey={(r) => r._id || Math.random().toString()}
            pagination={{
              pageSize: 50,
              showSizeChanger: false,
              current: ledgerPage,
              onChange: (p) => setLedgerPage(p)
            }}
            sticky
            scroll={{ y: 500 }}
            summary={() => (
              <Table.Summary fixed="bottom">
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="center">
                    <span className="">Нийт</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <span className="">{formatNumber(totalTulukh, 2)}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <span className="">{formatNumber(totalTulsun, 2)}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <span className="">
                      {filteredLedger.length > 0 ? formatNumber(Number(filteredLedger[filteredLedger.length - 1]?.uldegdel ?? 0), 2) : "0.00"}
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        )}
      </div>
    );
  };

  const columns: ColumnsType<OrlogoAvlagaItem> = useMemo(
    () =>
      allColumns.map((col) => ({
        key: col.key,
        title: col.label,
        width: col.width,
        align: col.align,
        render: (_: any, record: OrlogoAvlagaItem, index: number) => {
          const value = getCellValue(record, col.key, index);
          if (col.key === "paid")
            return (
              <span className="cursor-pointer text-brand underline underline-offset-2">
                {value}
              </span>
            );
          if (col.key === "finalBalance")
            return <span className="text-danger">{value}</span>;
          return value ?? "-";
        },
      })),
    [allColumns, page, pageSize, getPaid, getUldegdel],
  );

  return (
    <>
      <Table<OrlogoAvlagaItem>
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey={(record, index) =>
          record._gereeDugaar ||
          record.gereeniiDugaar ||
          record._id ||
          `row-${index}`
        }
        pagination={false}
        // Бусад хуудастай ижил: өндрийг хүснэгт өөрөө цонхны үлдсэн зайгаар тооцно
        scroll={{ x: activeTab === "tulult" ? 800 : 1200 }}
        locale={{ emptyText: "Мэдээлэл алга байна" }}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          className: "cursor-pointer",
        })}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row>
              {allColumns.map((col) => (
                <Table.Summary.Cell
                  key={col.key}
                  align={col.align}
                  className={
                    col.key === "paid"
                      ? "text-success"
                      : col.key === "finalBalance"
                        ? "text-danger"
                        : undefined
                  }
                >
                  {col.key === "ner" ? "Нийт" : getTotalValue(col.key) || ""}
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <Modal
        open={modalOpen}
        onCancel={onModalClose}
        footer={null}
        width={1100}
        mask={true}
        maskStyle={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        wrapClassName="pointer-events-none"
        className="pointer-events-auto"
        rootClassName="!bg-transparent"
        closeIcon={<X className="w-4 h-4" />}
        modalRender={(node) => (
          <motion.div 
            drag 
            dragListener={false} 
            dragControls={dragControls} 
            dragMomentum={false}
            className="outline-none focus:outline-none focus-visible:outline-none"
          >
            {React.cloneElement(node as React.ReactElement<any>, {
              style: { ...(((node as React.ReactElement<any>).props.style as React.CSSProperties) || {}), background: 'transparent', padding: 0, boxShadow: 'none', outline: 'none' }
            })}
          </motion.div>
        )}
      >
        {modalContent()}
      </Modal>
    </>
  );
};

export default OrlogoAvlagaTable;
