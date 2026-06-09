"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Copy } from "lucide-react";
import moment from "moment";
import formatNumber from "../../../../tools/function/formatNumber";
import { toast } from "react-hot-toast";

interface Vehicle {
  _id?: string;
  mashiniiDugaar: string;
  niitDun?: number;
  zurchil?: string;
  turul?: string;
  tuukh?: Array<{
    tsagiinTuukh?: Array<{
      orsonTsag?: string;
      garsanTsag?: string;
    }>;
    turul?: string;
    khungulult?: string;
    tulsunDun?: number;
    ebarimtId?: string;
    tuluv?: number;
    garsanKhaalga?: string;
    niitKhugatsaa?: number;
    burtgesenAjiltaniiNer?: string;
    tulbur?: Array<{
      turul?: string;
    }>;
  }>;
}

interface ZogsoolJagsaaltTableProps {
  data: Vehicle[];
  loading: boolean;
  page: number;
  pageSize: number;
}

const RealTimeDuration = ({
  orsonTsag,
  garsanTsag,
  niitKhugatsaa,
}: {
  orsonTsag?: string;
  garsanTsag?: string;
  niitKhugatsaa?: number;
}) => {
  const [now, setNow] = React.useState(moment());

  React.useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => setNow(moment()), 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);

  if (!orsonTsag) return <span />;
  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));
  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  if (!garsanTsag) {
    return (
      <span className="text-[11px] font-mono text-slate-800">
        {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} :{" "}
        {String(seconds).padStart(2, "0")}
      </span>
    );
  }
  const khugatsaaMin =
    niitKhugatsaa ?? Math.max(0, Math.ceil(diff.asMinutes()));
  const h = Math.floor(khugatsaaMin / 60);
  const m = khugatsaaMin % 60;
  return (
    <span className="text-[10px] uppercase tracking-wide text-slate-800">
      {h > 0 ? `${h} цаг ${m} мин` : `${m} мин`}
    </span>
  );
};

export const ZogsoolJagsaaltTable: React.FC<ZogsoolJagsaaltTableProps> = ({
  data,
  loading,
  page,
  pageSize,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Хуулагдлаа");
  };

  const columns: ColumnsType<Vehicle> = useMemo(
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
        title: "Орсон",
        key: "orson",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          const tsag = mur?.tsagiinTuukh?.[0];
          const orsonTsag = tsag?.orsonTsag;
          return (
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-700 dark:text-slate-300">
                {orsonTsag ? moment(orsonTsag).format("MM-DD HH:mm:ss") : ""}
              </span>
            </div>
          );
        },
      },
      {
        title: "Гарсан",
        key: "garsan",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          const tsag = mur?.tsagiinTuukh?.[0];
          const garsanTsag = tsag?.garsanTsag;
          return (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {garsanTsag ? moment(garsanTsag).format("MM-DD HH:mm:ss") : ""}
            </span>
          );
        },
      },
      {
        title: "Төрөл",
        key: "turul",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          return (
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 uppercase tracking-tighter">
              {record.turul || mur?.turul || "Үйлчлүүлэгч"}
            </span>
          );
        },
      },
      {
        title: "Дугаар",
        key: "dugaar",
        align: "center",
        render: (_: any, record: Vehicle) => (
          <div className="flex items-center justify-center gap-2 group/copy">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
              {record.mashiniiDugaar || ""}
            </span>
            <Copy
              className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-pointer hover:text-blue-500 transition-all opacity-0 group-hover/copy:opacity-100 scale-90 group-hover/copy:scale-100"
              onClick={() => copyToClipboard(record.mashiniiDugaar)}
            />
          </div>
        ),
      },
      {
        title: "Хугацаа/мин",
        key: "duration",
        align: "center",
        width: 130,
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          const tsag = mur?.tsagiinTuukh?.[0];
          const orsonTsag = tsag?.orsonTsag;
          const garsanTsag = tsag?.garsanTsag;
          const niitKhugatsaa = mur?.niitKhugatsaa;
          const isCurrentlyIn = !mur?.garsanKhaalga;
          return (
            <div
              className={`px-2.5 py-1.5 rounded-2xl text-center inline-block whitespace-nowrap border-2 transition-all ${
                !garsanTsag
                  ? "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-200 shadow-sm"
                  : "bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/30 dark:border-slate-800/50 dark:text-slate-400"
              }`}
            >
              <RealTimeDuration
                orsonTsag={orsonTsag}
                garsanTsag={garsanTsag}
                niitKhugatsaa={niitKhugatsaa}
              />
            </div>
          );
        },
      },
      {
        title: "Бодогдсон",
        key: "calc",
        align: "center",
        render: (_: any, record: Vehicle) => (
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {record.niitDun ? formatNumber(record.niitDun) : ""}
          </span>
        ),
      },
      {
        title: "Төлбөр",
        key: "payment",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          const tulsunDun = mur?.tulsunDun || 0;
          const payHistory = mur?.tulbur?.[0];
          const method = payHistory?.turul;
          const labels: any = {
            cash: "Бэлэн",
            khaan: "Хаан",
            qpay: "QPay",
            transfer: "Дансаар",
            discount: "Хөнгөлөлт",
          };
          if (tulsunDun > 0) {
            return (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  {formatNumber(tulsunDun)}
                </span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">
                  {(method && labels[method]) || "Төлсөн"}
                </span>
              </div>
            );
          }
          return <span />;
        },
      },
      {
        title: "Төлөв",
        key: "status",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          const tuluv = mur?.tuluv;
          const garsanTsag = mur?.tsagiinTuukh?.[0]?.garsanTsag;
          const niitDun = record.niitDun || 0;
          const isCurrentlyIn = !mur?.garsanKhaalga;

          const badgeClass =
            "flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1.5 rounded-[6px] overflow-hidden border";
          if (tuluv === 1) {
            return (
              <div
                className={`${badgeClass} bg-emerald-500 border-emerald-600`}
                style={{ borderRadius: "6px" }}
              >
                <span className="text-[10px] text-white uppercase whitespace-nowrap">
                  Төлсөн
                </span>
              </div>
            );
          }
          if (isCurrentlyIn) {
            return (
              <div
                className={`${badgeClass} bg-blue-500 border-blue-600`}
                style={{ borderRadius: "6px" }}
              >
                <span className="text-[10px] text-white uppercase whitespace-nowrap">
                  Идэвхтэй
                </span>
              </div>
            );
          }
          if (tuluv === -4 || (niitDun > 0 && !isCurrentlyIn)) {
            return (
              <div
                className={`${badgeClass} bg-amber-600 border-amber-700`}
                style={{ borderRadius: "6px" }}
              >
                <span className="text-[10px] text-white uppercase whitespace-nowrap">
                  Төлбөртэй
                </span>
              </div>
            );
          }
          return (
            <div
              className={`${badgeClass} bg-gray-500 border-gray-600`}
              style={{ borderRadius: "6px" }}
            >
              <span className="text-[10px] text-white uppercase whitespace-nowrap">
                Гарсан
              </span>
            </div>
          );
        },
      },
      {
        title: "Шалтгаан",
        key: "reason",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          const garsanTsag = mur?.tsagiinTuukh?.[0]?.garsanTsag;
          const isCurrentlyIn = !mur?.garsanKhaalga;
          return (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate text-center">
              {record.zurchil || ""}
            </p>
          );
        },
      },
      {
        title: "Бүртгэсэн",
        key: "staff",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          return (
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                {mur?.burtgesenAjiltaniiNer || ""}
              </span>
            </div>
          );
        },
      },
      {
        title: "Хөнгөлөлт",
        key: "discount",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          return (
            <span className="text-[11px] text-slate-500 text-center">
              {mur?.khungulult || ""}
            </span>
          );
        },
      },
      {
        title: "И-Баримт",
        key: "ebarimt",
        align: "center",
        render: (_: any, record: Vehicle) => {
          const mur = record.tuukh?.[0];
          return (
            <span className="text-[11px] text-slate-500 text-center">
              {mur?.ebarimtId || ""}
            </span>
          );
        },
      },
    ],
    [page, pageSize],
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
        locale={{ emptyText: "Машины мэдээлэл олдсонгүй" }}
      />
    </div>
  );
};

export default ZogsoolJagsaaltTable;
