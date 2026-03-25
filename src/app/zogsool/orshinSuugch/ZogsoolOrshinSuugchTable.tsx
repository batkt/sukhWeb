"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { User, Phone, Car, Edit2, Trash2 } from "lucide-react";
import { getResidentToot } from "@/lib/residentDataHelper";
import Button from "@/components/ui/Button";

interface ResidentParking {
  _id?: string;
  ner?: string;
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
}

export const ZogsoolOrshinSuugchTable: React.FC<
  ZogsoolOrshinSuugchTableProps
> = ({ data, loading, page, pageSize, onEdit, onDelete }) => {
  const columns: ColumnsType<ResidentParking> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, idx: number) =>
          (page - 1) * pageSize + idx + 1,
      },
      {
        title: "Нэр",
        key: "ner",
        render: (_: any, record: ResidentParking) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[12px] font-black text-slate-700 dark:text-slate-200">
                {record.ner || record.orshinSuugchNer || "Нэр тодорхойгүй"}
              </p>
              <p className="text-[10px] text-slate-400">{record.ovog || ""}</p>
            </div>
          </div>
        ),
      },
      {
        title: "Утас",
        key: "utas",
        render: (_: any, record: ResidentParking) => (
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            {record.utas || "-"}
          </div>
        ),
      },
      {
        title: "Дугаар",
        key: "dugaar",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-wrap gap-2 justify-center">
            {record.mashiniiDugaar ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                <Car className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-slate-700 dark:text-blue-200">
                  {record.mashiniiDugaar}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 italic">
                Машин бүртгэлгүй
              </span>
            )}
          </div>
        ),
      },
      {
        title: "Төрөл",
        key: "turul",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-col gap-1.5 items-center">
            <span className="px-2 py-1 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit">
              {record.zochinTurul || record.turul || "-"}
            </span>
            {record.zochinErkhiinToo !== undefined && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 w-fit">
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                  Хэрэглэсэн {record.mashinuud?.length || 0}/
                  {record.zochinErkhiinToo}
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Ажилтан",
        key: "ajiltan",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            {record.burtgesenAjiltaniiNer || "-"}
          </div>
        ),
      },
      {
        title: "Тоот",
        key: "toot",
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-1 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 text-[10px] text-emerald-700 dark:text-emerald-400">
              {record.ezenToot || getResidentToot(record)
                ? `${record.ezenToot || getResidentToot(record)} тоот`
                : "-"}
            </span>
          </div>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 100,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex justify-center items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(record)}
              className="!p-2 !h-auto"
              icon={<Edit2 className="w-4 h-4" />}
              title="Засах"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(record)}
              className="!p-2 !h-auto hover:!text-red-500"
              icon={<Trash2 className="w-4 h-4" />}
              title="Устгах"
            />
          </div>
        ),
      },
    ],
    [page, pageSize, onEdit, onDelete],
  );

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
        scroll={{ x: "max-content", y: "calc(100vh - 280px)" }}
        locale={{ emptyText: "Оршин суугчийн мэдээлэл олдсонгүй" }}
      />
    </div>
  );
};

export default ZogsoolOrshinSuugchTable;
