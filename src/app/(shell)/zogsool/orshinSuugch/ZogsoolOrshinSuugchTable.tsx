"use client";

import React, { useMemo } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
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
  /** Тухайн эзний БҮХ машины дугаар (backend-ээс мөр тус бүрд хамт ирнэ). */
  ezniiMashinuud?: string[];
  /** Тухайн эзэнд бүртгэлтэй машины тоо. */
  mashiniiToo?: number;
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
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, idx: number) => (
          <span className="text-black dark:text-white">
            {(page - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        title: "Нэр",
        key: "ner",
        width: 250,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="text-left">
            <p className="text-black dark:text-white font-sans">
              {record.ner || record.orshinSuugchNer || "Нэр тодорхойгүй"}
            </p>
            {/* Олон машинтай эзэн нь машин тутамдаа нэг мөр эзэлдэг тул нэр
                давтагдана — тоог хамт харуулж шалтгааныг тодруулна. */}
            {(record.mashiniiToo ?? 0) > 1 && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Car className="w-3 h-3" />
                {record.mashiniiToo} машин
              </span>
            )}
          </div>
        ),
      },
      {
        title: "Утас",
        key: "utas",
        width: 120,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex items-center justify-center gap-1 text-black dark:text-white">
            {record.utas || "-"}
          </div>
        ),
      },
      {
        title: "Дугаар",
        key: "dugaar",
        width: 140,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-wrap gap-2 justify-center">
            {record.mashiniiDugaar && record.mashiniiDugaar !== "БҮРТГЭЛГҮЙ" ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                <span className="text-black dark:text-white">
                  {record.mashiniiDugaar}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                <span className="text-black dark:text-white">
                  БҮРТГЭЛГҮЙ
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Төрөл",
        key: "turul",
        width: 110,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-col gap-1.5 items-center">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-black dark:text-white w-fit">
              {record.zochinTurul || record.turul || "Оршин суугч"}
            </span>
          </div>
        ),
      },
      {
        title: "Орц",
        key: "orts",
        width: 80,
        align: "center",
        filterMultiple: false,
        sorter: (a, b) => (a.orts || "").localeCompare(b.orts || ""),
        render: (_: any, record: ResidentParking) => (
          <div className="text-black dark:text-white">
            {record.orts || ""}
          </div>
        ),
      },
      {
        title: "Тоот",
        key: "toot",
        width: 120,
        align: "center",
        sorter: (a, b) => (a.ezenToot || "").localeCompare(b.ezenToot || ""),
        render: (_: any, record: ResidentParking) => {
          const tootValue = record.ezenToot || getResidentToot(record);
          if (!tootValue || tootValue === "-") return null;
          
          return (
            <div className="flex items-center justify-center gap-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-black dark:text-white">
                  {tootValue}
                  <span className="ml-1 opacity-70">тоот</span>
              </span>
            </div>
          );
        },
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 96,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex justify-center items-center gap-1">
            <button
              id="resident-edit-btn"
              onClick={() => onEdit(record)}
              className="p-1.5 rounded-lg action-edit hover-surface transition-colors hover:bg-slate-200 dark:hover:bg-white/20"
              title="Засах"
            >
              <Edit className="w-4 h-4 text-black dark:text-white" />
            </button>
            <button
              id="resident-delete-btn"
              onClick={() => onDelete(record)}
              disabled={!record.mashiniiDugaar || record.mashiniiDugaar === "БҮРТГЭЛГҮЙ"}
              className={`p-1.5 rounded-lg action-delete transition-all ${
                (!record.mashiniiDugaar || record.mashiniiDugaar === "БҮРТГЭЛГҮЙ")
                  ? "opacity-20 cursor-not-allowed text-slate-400"
                  : "hover-surface hover:bg-red-50 dark:hover:bg-red-500/10 text-black dark:text-white hover:text-red-500"
              }`}
              title={(!record.mashiniiDugaar || record.mashiniiDugaar === "БҮРТГЭЛГҮЙ") ? "Машин бүртгэлгүй" : "Устгах"}
            >
              <Trash2 className="w-4 h-4" />
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
    <div id="residents-table" className="w-full">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => record._id || Math.random().toString()}
        pagination={false}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Оршин суугчийн мэдээлэл олдсонгүй" }}
      />
    </div>
  );
};

export default ZogsoolOrshinSuugchTable;
