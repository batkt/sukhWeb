"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { Edit, Eye, ChevronDown, X } from "lucide-react";
import moment from "moment";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { Loader } from "@mantine/core";
import {
  StandardTable,
  StandardPagination,
} from "@/components/ui/StandardTable";

interface Props {
  token: string;
  baiguullaga: { _id: string };
  ajiltan: { _id: string; baiguullagiinId?: string };
}

interface ChangeItem {
  field?: string;
  talbar?: string;
  talbarNer?: string;
  oldValue?: any;
  newValue?: any;
  umnukhUtga?: any;
  shineUtga?: any;
  utganiiTurul?: string;
  _id?: string;
}

interface EditRecord {
  _id: string;
  modelName: string;
  documentId: string;
  ajiltniiNer: string;
  ajiltniiId?: string;
  changes?: ChangeItem[];
  uurchlult?: ChangeItem[];
  baiguullagiinId: string;
  ognoo?: string;
  createdAt?: string;
}

const pageSizeOptions = [10, 20, 50, 100, 500];

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  record: EditRecord | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ open, onClose, record }) => {
  if (!open || !record) return null;

  const formatNumber = (val: any) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "0";
    return new Intl.NumberFormat("en-US").format(Number(val));
  };

  const getParsedValue = (value: any) => {
    if (typeof value === "string") {
      try {
        if (value.startsWith("[") || value.startsWith("{")) {
          return JSON.parse(value);
        }
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const renderValue = (field: string, rawValue: any, type?: string) => {
    const value = getParsedValue(rawValue);
    if (value === null || value === undefined || value === "") {
      return <span className="text-gray-500 italic opacity-50">(хоосон)</span>;
    }

    if (field === "zardluud" && Array.isArray(value)) {
      return (
        <div className="overflow-x-auto my-1">
          <table className="w-full text-[10px] border border-[color:var(--surface-border)] rounded">
            <thead className="bg-[color:var(--surface-bg)] text-[color:var(--muted-text)]">
              <tr>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-left">Нэр</th>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-center">Төрөл</th>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-right">Үнэ</th>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-right">Төлөх дүн</th>
              </tr>
            </thead>
            <tbody>
              {value.map((item: any, idx) => (
                <tr key={idx} className="hover:bg-blue-500/5">
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-left truncate max-w-[80px]">{item.ner || "-"}</td>
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-center">{item.turul || "-"}</td>
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-right">{formatNumber(item.turul === "Дурын" ? item.dun : item.tariff)}</td>
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-right text-blue-500">{formatNumber(item.tulukhDun)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (field === "segmentuud" && Array.isArray(value)) {
      return (
        <div className="overflow-x-auto my-1">
          <table className="w-full text-[10px] border border-[color:var(--surface-border)] rounded">
            <thead className="bg-[color:var(--surface-bg)] text-[color:var(--muted-text)]">
              <tr>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-left">Нэр</th>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-center">Утга</th>
              </tr>
            </thead>
            <tbody>
              {value.map((item: any, idx) => (
                <tr key={idx} className="hover:bg-blue-500/5">
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-left">{item.ner || "-"}</td>
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-center">{typeof item.utga === "number" ? formatNumber(item.utga) : String(item.utga || "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (field === "khungulultuud" && Array.isArray(value)) {
      return (
        <div className="overflow-x-auto my-1">
          <table className="w-full text-[10px] border border-[color:var(--surface-border)] rounded">
            <thead className="bg-[color:var(--surface-bg)] text-[color:var(--muted-text)]">
              <tr>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-center">Огноо</th>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-center">%</th>
                <th className="p-1 border-b border-[color:var(--surface-border)] text-right">Дүн</th>
              </tr>
            </thead>
            <tbody>
              {value.map((item: any, idx) => (
                <tr key={idx} className="hover:bg-blue-500/5">
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-center">
                    {item.ognoonuud ? `${moment(item.ognoonuud[0]).format("MM-DD")} ~ ${moment(item.ognoonuud[1]).format("MM-DD")}` : "-"}
                  </td>
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-center">{item.khungulukhKhuvi}%</td>
                  <td className="p-1 border-b border-[color:var(--surface-border)] text-right text-green-500">{formatNumber(item.khungulultiinDun)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (typeof value === "object") {
       if (Array.isArray(value)) return `[${value.length} мөр]`;
       return <span className="text-[10px] truncate max-w-[200px] inline-block">{JSON.stringify(value)}</span>;
    }

    if (typeof value === "boolean") return value ? "Тийм" : "Үгүй";
    if (type === "date" || (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/))) {
      return moment(value).format("YYYY-MM-DD");
    }
    if (typeof value === "number" || (!isNaN(Number(value)) && String(value).length > 0 && field.toLowerCase().includes("dun"))) {
      return formatNumber(value);
    }

    return String(value);
  };

  const fieldLabels: Record<string, string> = {
    ner: "Нэр",
    ovog: "Овог",
    utas: "Утас",
    mail: "Имэйл",
    email: "Имэйл",
    register: "Регистр",
    toot: "Тоот",
    davkhar: "Давхар",
    orts: "Орц",
    bairniiNer: "Барилгын нэр",
    baiguullagiinNer: "Байгууллагын нэр",
    ekhniiUldegdel: "Эхний үлдэгдэл",
    tailbar: "Тайлбар",
    status: "Төлөв",
    tuluv: "Төлөв",
    zardluud: "Зардлууд",
    segmentuud: "Сегментүүд",
    khungulultuud: "Хөнгөлөлтүүд",
  };

  const normalizedChanges = (record.changes || record.uurchlult || []).map((c) => ({
    field: c.field || c.talbar || "unknown",
    label: c.talbarNer || c.field || "unknown",
    oldValue: c.oldValue ?? c.umnukhUtga,
    newValue: c.newValue ?? c.shineUtga,
    type: c.utganiiTurul,
    id: c._id,
  }));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-[color:var(--surface-border)] flex items-center justify-between">
          <h3 className="text-xl text-[color:var(--panel-text)]  ">Өөрчлөлтийн түүх</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]">
            <X className="w-5 h-5 text-theme"/>
          </button>
        </div>

        <div className="px-8 py-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div>
                <label className="block text-smtext-theme mb-1">Зассан ажилтан</label>
                <p className="text-sm text-[color:var(--panel-text)]">{record.ajiltniiNer || "Систем"}</p>
              </div>
              <div>
                <label className="block text-sm text-theme mb-1">Огноо</label>
                <p className="text-sm text-[color:var(--panel-text)]">{moment(record.createdAt || record.ognoo).format("YYYY-MM-DD HH:mm:ss")}</p>
              </div>
           </div>

           <div className="rounded-xl border border-[color:var(--surface-border)] overflow-hidden">
             <table className="w-full text-sm">
                <thead className="bg-[color:var(--surface-bg)] text-theme border-b border-[color:var(--surface-border)]">
                  <tr>
                    <th className="py-3 px-4 text-left w-[25%] border-r border-[color:var(--surface-border)]">Талбар</th>
                    <th className="py-3 px-4 text-centerw-[37%] border-r border-[color:var(--surface-border)]">Өмнөх</th>
                    <th className="py-3 px-4 text-center  w-[37%]">Шинэ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--surface-border)]">
                  {normalizedChanges.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-500 italic">Өөрчлөлт олдсонгүй</td></tr>
                  ) : (
                    normalizedChanges.map((change, idx) => (
                      <tr key={change.id || idx}>
                        <td className="py-3 px-4 font-semibold text-theme border-r border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
                          {fieldLabels[change.field] || change.label}
                        </td>
                        <td className="py-3 px-4 text-center align-middle border-r border-[color:var(--surface-border)]">
                          {renderValue(change.field, change.oldValue, change.type)}
                        </td>
                        <td className="py-3 px-4 text-center align-middle">
                          {renderValue(change.field, change.newValue, change.type)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
           </div>
        </div>

        <div className="px-6 py-4 border-t border-[color:var(--surface-border)] flex items-center justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm text-sm">Хаах</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function ZassanTuukh({ token, baiguullaga }: Props) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    dayjs().subtract(30, "days").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);
  const [selectedRecord, setSelectedRecord] = useState<EditRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Common model names
  const modelNames = useMemo(
    () => [
      { value: "geree", label: "Гэрээ" },
      { value: "orshinSuugch", label: "Оршин суугч" },
      { value: "talbai", label: "Талбай" },
      { value: "nekhemjlekh", label: "Нэхэмжлэх" },
      { value: "nekhemjlekhiinTuukh", label: "Нэхэмжлэлийн түүх" },
      { value: "guilgee", label: "Гүйлгээ" },
      { value: "ajiltan", label: "Ажилтан" },
      { value: "barilga", label: "Барилга" },
    ],
    [],
  );

  // Fetch all employees for the filter
  const { data: employeesData } = useSWR(
    token && baiguullaga?._id ? [`/ajiltan`, token, baiguullaga._id] : null,
    async ([url, tkn, orgId]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: { baiguullagiinId: orgId, khuudasniiKhemjee: 1000 },
      });
      return resp.data?.jagsaalt || resp.data?.data || [];
    },
  );

  const employees = useMemo(() => {
    if (!Array.isArray(employeesData)) return [];
    return employeesData.map((e: any) => {
      const aName =
        typeof e.ner === "object"
          ? `${e.ner.over || e.ner.ovog || ""} ${e.ner.ner || ""}`
          : e.ner;
      const bName = `${e.ovog || ""} ${e.ner || ""}`;
      return {
        id: e._id,
        name: (aName || bName || e.nevtrekhNer || "Нэргүй").trim(),
      };
    });
  }, [employeesData]);

  // Fetch edit history from the new zassanBarimt endpoint
  // Matching filters and parameters with UstsanTuukh for consistency
  const { data, isLoading } = useSWR(
    token && baiguullaga?._id
      ? [
          "/audit/zasakhTuukh", 
          token,
          baiguullaga._id,
          dateRange?.[0] || null,
          dateRange?.[1] || null,
          selectedModel,
          selectedEmployee,
        ]
      : null,
    async ([url, tkn, orgId, startDate, endDate, model, employee]) => {
      const params: any = {
        baiguullagiinId: orgId,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 10000, 
      };

      if (model) params.modelName = model;
      if (employee) params.ajiltniiId = employee;
      
      if (startDate && endDate) {
        params.ekhlekhOgnoo = `${startDate} 00:00:00`;
        params.duusakhOgnoo = `${endDate} 23:59:59`;
      }

      const resp = await uilchilgee(tkn).get(url, { params });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const normalizationAdapter = (records: any[]): EditRecord[] => {
    return records.map((r: any) => ({
      _id: r._id,
      modelName: r.modelName || r.className || r.collection || "-",
      documentId: r.documentId || r.classDugaar || r.id || "-",
      ajiltniiNer: r.ajiltniiNer || r.workerName || r.ajiltan?.ner || "-",
      ajiltniiId: r.ajiltniiId,
      changes: r.changes,
      uurchlult: r.uurchlult,
      baiguullagiinId: r.baiguullagiinId,
      ognoo: r.ognoo || r.classOgnoo,
      createdAt: r.createdAt,
    }));
  };

  const allRecords: EditRecord[] = useMemo(() => {
    const raw = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : [];
    return normalizationAdapter(raw);
  }, [data]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const matchesModel = !selectedModel || r.modelName === selectedModel;
      const matchesEmployee =
        !selectedEmployee || 
        r.changes?.some((c: any) => c.ajiltniiId === selectedEmployee) || 
        r.ajiltniiId === selectedEmployee || 
        true; 
      return matchesModel && matchesEmployee;
    });
  }, [allRecords, selectedModel, selectedEmployee]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const totalRecords = filteredRecords.length;

  const handleDateChange = (dates: any) => {
    setDateRange(dates || [null, null]);
    setPage(1);
  };

  const handleViewDetails = (record: EditRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)]">
            <div className="flex items-center gap-3">
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl text-[color:var(--panel-text)]">
                {t("Зассан түүх")}
              </h2>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div
              id="zassan-date"
              className="btn-minimal h-[40px] w-full sm:w-[320px] flex items-center px-3"
            >
              <StandardDatePicker
                isRange={true}
                value={dateRange}
                onChange={handleDateChange}
                allowClear
                placeholder="Огноо сонгох"
                classNames={{
                  root: "!h-full !w-full",
                  input:
                    "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
                }}
              />
            </div>

            <div className="relative h-[40px] w-full sm:w-[200px] border border-[color:var(--surface-border)] rounded-lg bg-[color:var(--surface-bg)] flex items-center">
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setPage(1);
                }}
                className="w-full h-full px-4 pr-10 bg-transparent border-0 focus:outline-none text-[color:var(--panel-text)] appearance-none cursor-pointer text-sm"
              >
                <option value="">Бүх ажилтан</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
            </div>

            <div className="relative h-[40px] w-full sm:w-[200px] border border-[color:var(--surface-border)] rounded-lg bg-[color:var(--surface-bg)] flex items-center">
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setPage(1);
                }}
                className="w-full h-full px-4 pr-10 bg-transparent border-0 focus:outline-none text-[color:var(--panel-text)] appearance-none cursor-pointer text-sm"
              >
                <option value="">Бүгд</option>
                {modelNames.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="md" />
            </div>
          ) : (
            <>
              <StandardTable
                data={paginatedRecords}
                columns={[
                  {
                    key: "index",
                    label: "#",
                    width: 60,
                    align: "center",
                    render: (_: any, __: any, index: number) =>
                      (page - 1) * pageSize + index + 1,
                  },
                  {
                    key: "createdAt",
                    label: "Зассан огноо",
                    align: "center",
                    render: (value: any, record: any) =>
                      moment(value || record.ognoo).format("YYYY-MM-DD HH:mm:ss"),
                  },
                  {
                    key: "ajiltniiNer",
                    label: "Зассан ажилтан",
                    align: "center",
                    render: (value: any) => (
                      <span className="text-gray-500 font-medium">{value}</span>
                    )
                  },
                  {
                    key: "modelName",
                    label: "Төрөл",
                    align: "center",
                    render: (value: any) =>
                      modelNames.find((m) => m.value === value)?.label || value || "-",
                  },
                  {
                    key: "documentId",
                    label: "Дугаар",
                    align: "center",
                    render: (val: any) => (
                       <span className="text-gray-500">{val}</span>
                    )
                  },
                  {
                    key: "action",
                    label: "Үйлдэл",
                    align: "center",
                    render: (_value: any, record: any) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewDetails(record);
                        }}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors relative z-10"
                        title="Дэлгэрэнгүй үзэх"
                      >
                        <Eye className="w-4 h-4 text-blue-600 pointer-events-none" />
                      </button>
                    ),
                  },
                ]}
                rowKey="_id"
                loading={isLoading}
                emptyMessage="Зассан түүх олдсонгүй"
                className="rounded-2xl guilgee-table border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden"
                maxHeight={pageSize * 60}
              />

              <div className="pt-2 border-t border-[color:var(--surface-border)]">
                <StandardPagination
                  current={page}
                  total={totalRecords}
                  pageSize={pageSize}
                  onChange={(p, size) => {
                    setPage(p);
                    if (size) setPageSize(size);
                  }}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                  pageSizeOptions={pageSizeOptions}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <DetailModal
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
      />
    </>
  );
}
