"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Copy, DollarSign, Tag, ArrowUpDown, Info } from "lucide-react";
import moment from "moment";
import formatNumber from "../../../../tools/function/formatNumber";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";

interface ParkingTransaction {
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
    burtgesenAjiltaniiNer?: string;
    tulbur?:
      | Array<{
          turul?: string;
          dun?: number;
          ognoo?: string;
        }>
      | {
          turul?: string;
          dun?: number;
          ognoo?: string;
        };
  }>;
}

interface ZogsoolCameraTableProps {
  data: ParkingTransaction[];
  loading: boolean;
  page: number;
  pageSize: number;
  onManualExit: (transaction: ParkingTransaction, action: string) => void;
  onPaymentClick: (transaction: ParkingTransaction) => void;
  confirmExitId: string | null;
  setConfirmExitId: (id: string | null) => void;
}

const RealTimeDuration = ({
  orsonTsag,
  garsanTsag,
}: {
  orsonTsag?: string;
  garsanTsag?: string;
}) => {
  const [now, setNow] = React.useState(moment());

  React.useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => setNow(moment()), 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);

  if (!orsonTsag) return <span>00 : 00 : 00</span>;
  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));
  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  if (!garsanTsag) {
    return (
      <span className="text-[11px] font-mono">
        {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} :{" "}
        {String(seconds).padStart(2, "0")}
      </span>
    );
  }
  return (
    <span className="text-[10px] uppercase tracking-wide">
      {hours > 0 ? `${hours} цаг ${minutes} мин` : `${minutes} мин`}
    </span>
  );
};

export const ZogsoolCameraTable: React.FC<ZogsoolCameraTableProps> = ({
  data,
  loading,
  page,
  pageSize,
  onManualExit,
  onPaymentClick,
  confirmExitId,
  setConfirmExitId,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Хуулагдлаа");
  };

  const columns: ColumnsType<ParkingTransaction> = useMemo(
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
        title: "Дугаар",
        key: "dugaar",
        width: 110,
        align: "center",
        render: (_: any, record: ParkingTransaction) => (
          <div className="flex items-center justify-center gap-2">
            <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">
              {record.mashiniiDugaar || "-"}
            </span>
            <Copy
              className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={() => copyToClipboard(record.mashiniiDugaar)}
            />
          </div>
        ),
      },
      {
        title: "Орсон",
        key: "orson",
        width: 140,
        align: "center",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          const tsag = mur?.tsagiinTuukh?.[0];
          const orsonTsag = tsag?.orsonTsag;
          return (
            <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">
              {orsonTsag ? moment(orsonTsag).format("MM-DD HH:mm:ss") : "-"}
            </span>
          );
        },
      },
      {
        title: "Гарсан",
        key: "garsan",
        width: 140,
        align: "center",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          const tsag = mur?.tsagiinTuukh?.[0];
          const garsanTsag = tsag?.garsanTsag;
          return (
            <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">
              {garsanTsag ? moment(garsanTsag).format("MM-DD HH:mm:ss") : ""}
            </span>
          );
        },
      },
      {
        title: "Хугацаа",
        key: "duration",
        width: 100,
        align: "center",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          const tsag = mur?.tsagiinTuukh?.[0];
          const orsonTsag = tsag?.orsonTsag;
          const garsanTsag = tsag?.garsanTsag;
          const niitDun = record.niitDun || 0;
          const tuluv = mur?.tuluv;
          const isCurrentlyIn = !mur?.garsanKhaalga;
          const isDebt =
            tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn);

          const getStatusColor = () => {
            if (tuluv === 1) {
              return isCurrentlyIn && niitDun === 0
                ? "bg-blue-500 text-white border-blue-600"
                : "bg-green-500 text-white border-green-600";
            }
            if (!isCurrentlyIn && (niitDun > 0 || isDebt)) {
              return "bg-yellow-500 text-white border-yellow-600";
            }
            if (tuluv === -2 || tuluv === -1) {
              return "bg-red-500 text-white border-red-600";
            }
            if (!isCurrentlyIn && niitDun === 0) {
              return "bg-gray-500 text-white border-gray-600";
            }
            return "bg-blue-500 text-white border-blue-600";
          };

          return (
            <div
              className={`flex items-center justify-center px-2 py-1.5 rounded-md overflow-hidden border shadow-sm text-xs ${getStatusColor()}`}
            >
              <RealTimeDuration orsonTsag={orsonTsag} garsanTsag={garsanTsag} />
            </div>
          );
        },
      },
      {
        title: "Төрөл",
        key: "type",
        width: 110,
        align: "center",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          return (
            <span className="text-slate-600 dark:text-slate-400 text-sm">
              {record.turul || mur?.turul || "Үйлчлүүлэгч"}
            </span>
          );
        },
      },
      {
        title: "Хөнгөлөлт",
        key: "discount",
        width: 110,
        align: "center",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          return (
            <span className="text-slate-600 dark:text-slate-400 text-sm">
              {mur?.khungulult || "0"}
            </span>
          );
        },
      },
      {
        title: "Дүн",
        key: "amount",
        width: 110,
        align: "right",
        render: (_: any, record: ParkingTransaction) => (
          <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">
            {formatNumber(record.niitDun || 0)}
          </span>
        ),
      },
      {
        title: "Төлбөр",
        key: "payment",
        width: 140,
        align: "right",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          const history = mur;
          const tulsunDun = history?.tulsunDun || 0;
          const rawTulbur = history?.tulbur;
          let payHistory: any[] = [];

          if (Array.isArray(rawTulbur)) {
            payHistory = rawTulbur;
          } else if (rawTulbur && typeof rawTulbur === "object") {
            payHistory = [rawTulbur];
          }

          const labels: Record<string, string> = {
            belen: "Бэлэн",
            cash: "Бэлэн",
            khaan: "Карт",
            qpay: "QPay",
            khariltsakh: "Дансаар",
            transfer: "Дансаар",
            khungulult: "Хөнгөлөлт",
            discount: "Хөнгөлөлт",
            free: "Үнэгүй",
          };

          if (payHistory.length > 0) {
            const totalPaid = payHistory.reduce(
              (s: number, p: any) => s + (p.dun || 0),
              0,
            );
            return (
              <div className="group/pay relative inline-block cursor-pointer">
                <span className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors border-b border-dashed border-slate-300 dark:border-slate-600 pb-0.5 font-mono">
                  {formatNumber(totalPaid)}
                  {payHistory.length > 1 && (
                    <span className="ml-1 text-[10px] text-slate-400">
                      ({payHistory.length})
                    </span>
                  )}
                </span>
              </div>
            );
          }

          if (tulsunDun > 0) {
            return (
              <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                {formatNumber(tulsunDun)}
              </span>
            );
          }
          return (
            <span className="font-mono text-slate-700 dark:text-slate-300 text-sm">
              -
            </span>
          );
        },
      },
      {
        title: "И-Баримт",
        key: "ebarimt",
        width: 110,
        align: "center",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          return (
            <span className="text-slate-600 dark:text-slate-400 font-mono text-sm">
              {mur?.ebarimtId || ""}
            </span>
          );
        },
      },
      {
        title: "Төлөв",
        key: "status",
        width: 100,
        align: "center",
        render: (_: any, record: ParkingTransaction) => {
          const mur = record.tuukh?.[0];
          const tuluv = mur?.tuluv;
          const niitDun = record.niitDun || 0;
          const garsanTsag = mur?.tsagiinTuukh?.[0]?.garsanTsag;
          const isCurrentlyIn = !mur?.garsanKhaalga;
          const isPaid = tuluv === 1;
          const isDebt =
            tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn);
          const showActionBtn = isCurrentlyIn || isDebt;

          if (showActionBtn) {
            return (
              <div className="flex items-center justify-center gap-1">
                <Button
                  onClick={(e) => {
                    e?.stopPropagation();
                    setConfirmExitId(
                      confirmExitId === record._id ? null : record._id || null,
                    );
                  }}
                  variant={
                    isPaid && niitDun > 0
                      ? "success"
                      : !isCurrentlyIn && isDebt
                        ? "warning"
                        : tuluv === -1 || tuluv === -2
                          ? "danger"
                          : "primary"
                  }
                  size="sm"
                  className="w-[90px] mx-auto uppercase tracking-wide text-[10px]"
                >
                  {!isCurrentlyIn
                    ? isDebt
                      ? "Төлбөртэй"
                      : "Дууссан"
                    : isPaid && niitDun > 0
                      ? "Төлсөн"
                      : tuluv === 2
                        ? "Төлбөртэй"
                        : niitDun > 0
                          ? "Төлбөр"
                          : "Идэвхтэй"}
                </Button>
              </div>
            );
          }

          const badgeClass =
            "flex items-center justify-center px-2 py-1.5 rounded-[6px] overflow-hidden border text-[10px] uppercase whitespace-nowrap";
          if (tuluv === 1) {
            return (
              <div
                className={`${badgeClass} ${isCurrentlyIn && niitDun === 0 ? "bg-blue-500 text-white border-blue-600" : "bg-green-500 text-white border-green-600"}`}
              >
                {isCurrentlyIn && niitDun === 0 ? "Идэвхтэй" : "Төлсөн"}
              </div>
            );
          }
          if (!isCurrentlyIn && (niitDun > 0 || isDebt)) {
            return (
              <div
                className={`${badgeClass} bg-yellow-500 text-white border-yellow-600`}
              >
                Төлбөртэй
              </div>
            );
          }
          if (tuluv === -2 || tuluv === -1) {
            return (
              <div
                className={`${badgeClass} bg-red-500 text-white border-red-600`}
              >
                Зөрчилтэй
              </div>
            );
          }
          if (!isCurrentlyIn && niitDun === 0) {
            return (
              <div
                className={`${badgeClass} bg-gray-500 text-white border-gray-600`}
              >
                Үнэгүй
              </div>
            );
          }
          return (
            <div
              className={`${badgeClass} bg-blue-500 text-white border-blue-600`}
            >
              Идэвхтэй
            </div>
          );
        },
      },
    ],
    [page, pageSize, confirmExitId],
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
        locale={{ emptyText: "Мэдээлэл байхгүй байна" }}
      />
    </div>
  );
};

export default ZogsoolCameraTable;
