"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { User, Phone, Car, Edit, Trash2 } from "lucide-react";
import { getResidentToot } from "@/lib/residentDataHelper";
import Button from "@/components/ui/Button";

interface ResidentParking {
  _id?: string;
  ner?: string;
  orts?: string;
  orshinSuugchNer?: string;
  ovog?: string;
  utas?: string;
  toot?: string;
  burtgeliinDugaar?: string;
  turul?: string;
  tailbar?: string;
  burtgesenAjiltaniiNer?: string;
  createdAt?: string;
  mashinuud?: Array<{
    ulsiinDugaar: string;
    mark?: string;
  }>;
  zochinUrikhEsekh?: boolean;
  zochinTurul?: string;
  davtamjiinTurul?: string;
  mashiniiDugaar?: string;
  dugaarUurchilsunOgnoo?: string;
  ezenToot?: string;
  zochinTailbar?: string;
  zochinErkhiinToo?: number;
  zochinTusBurUneguiMinut?: number;
  zochinNiitUneguiMinut?: number;
  orshinSuugchTurul?: string;
}

interface ZogsoolOrshinSuugchTableProps {
  data: ResidentParking[];
  loading: boolean;
  page: number;
  pageSize: number;
  onEdit: (resident: ResidentParking) => void;
  onDelete: (resident: ResidentParking) => void;
  onFilterChange?: (filters: any) => void;
  ortsOptions?: string[];
}

export const ZogsoolOrshinSuugchTable: React.FC<
  ZogsoolOrshinSuugchTableProps
> = ({ data, loading, page, pageSize, onEdit, onDelete, onFilterChange, ortsOptions = [] }) => {
  const columns: ColumnsType<ResidentParking> = useMemo(
    () => [
      {
        title: <span className="text-black dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, idx: number) => (
          <span className="text-black dark:text-white text-[11px]">
            {(page - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        title: <span className="text-black dark:text-white">Нэр</span>,
        key: "ner",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="text-left">
            <p className="text-[12px] text-black dark:text-white font-sans">
              {record.ner || record.orshinSuugchNer || "Нэр тодорхойгүй"}
            </p>
          </div>
        ),
      },
      {
        title: <span className="text-black dark:text-white">Утас</span>,
        key: "utas",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex items-center justify-center gap-2 text-[11px] text-black dark:text-white">
            {record.utas || "-"}
          </div>
        ),
      },
      {
        title: <span className="text-black dark:text-white">Дугаар</span>,
        key: "dugaar",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-wrap gap-2 justify-center">
            {record.mashiniiDugaar && record.mashiniiDugaar !== "БҮРТГЭЛГҮЙ" ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                <span className="text-[10px] text-black dark:text-white">
                  {record.mashiniiDugaar}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                <span className="text-[10px] text-black dark:text-white">
                  БҮРТГЭЛГҮЙ
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        title: <span className="text-black dark:text-white">Төрөл</span>,
        key: "turul",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-col gap-1.5 items-center">
            <span className="px-2 py-1 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-black dark:text-white w-fit">
              {record.zochinTurul || record.turul || "Оршин суугч"}
            </span>
          </div>
        ),
      },
      {
        title: <span className="text-black dark:text-white">Орц</span>,
        key: "orts",
        align: "center",
        filterMultiple: false,
        sorter: (a, b) => (a.orts || "").localeCompare(b.orts || ""),
        render: (_: any, record: ResidentParking) => (
          <div className="text-[11px] text-black dark:text-white">
            {record.orts || ""}
          </div>
        ),
      },
      {
        title: <span className="text-black dark:text-white">Тоот</span>,
        key: "toot",
        align: "center",
        sorter: (a, b) => (a.ezenToot || "").localeCompare(b.ezenToot || ""),
        render: (_: any, record: ResidentParking) => {
          const tootValue = record.ezenToot || getResidentToot(record);
          if (!tootValue || tootValue === "-") return null;
          
          return (
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] text-black dark:text-white">
                  {tootValue}
                  <span className="ml-1 opacity-70">тоот</span>
              </span>
            </div>
          );
        },
      },
      {
        title: <span className="text-black dark:text-white">Үйлдэл</span>,
        key: "action",
        width: 100,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex justify-center items-center gap-1">
            <button
              onClick={() => onEdit(record)}
              className="p-2 rounded-2xl action-edit hover-surface transition-colors hover:bg-slate-200 dark:hover:bg-white/20"
              title="Засах"
            >
              <Edit className="w-5 h-5 text-black dark:text-white" />
            </button>
            <button
              onClick={() => onDelete(record)}
              disabled={!record.mashiniiDugaar || record.mashiniiDugaar === "БҮРТГЭЛГҮЙ"}
              className={`p-2 rounded-2xl action-delete transition-all ${
                (!record.mashiniiDugaar || record.mashiniiDugaar === "БҮРТГЭЛГҮЙ")
                  ? "opacity-20 cursor-not-allowed text-slate-400"
                  : "hover-surface hover:bg-red-50 dark:hover:bg-red-500/10 text-black dark:text-white hover:text-red-500"
              }`}
              title={(!record.mashiniiDugaar || record.mashiniiDugaar === "БҮРТГЭЛГҮЙ") ? "Машин бүртгэлгүй" : "Устгах"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ),
      },
    ],
    [page, pageSize, onEdit, onDelete, ortsOptions],
  );

  const handleTableChange = (pagination: any, filters: any) => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  return (
    <div className="w-full">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => record._id || Math.random().toString()}
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        onChange={handleTableChange}
        scroll={{ x: "max-content", y: "calc(100vh - 550px)" }}
        locale={{ emptyText: "Оршин суугчийн мэдээлэл олдсонгүй" }}
      />
    </div>
  );
};

export default ZogsoolOrshinSuugchTable;
