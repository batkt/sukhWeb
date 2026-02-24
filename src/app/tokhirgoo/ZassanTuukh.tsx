"use client";

import React, { useEffect, useMemo, useState } from "react";
import DateRangeButton from "@/components/ui/DateRangeButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Edit, 
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ChevronDown
} from "lucide-react";
import moment from "moment";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { Loader } from "@mantine/core";
import Button from "@/components/ui/Button";
import { createPortal } from "react-dom";

interface Props {
  token: string;
  baiguullaga: { _id: string };
  ajiltan: { _id: string; baiguullagiinId?: string };
}

interface ChangeItem {
  field: string;
  oldValue: any;
  newValue: any;
  _id?: string;
}

interface EditRecord {
  _id: string;
  modelName: string;
  documentId: string;
  ajiltniiId: string;
  ajiltniiNer: string;
  ajiltniiLoginNer?: string;
  changes?: ChangeItem[]; // API returns array of change objects
  baiguullagiinId: string;
  baiguullagiinRegister: string;
  ip?: string;
  useragent?: string;
  ognoo?: string; // API uses ognoo
  createdAt?: string; // Fallback
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  record: EditRecord | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ open, onClose, record }) => {
  if (!open || !record) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div 
        className="relative w-full max-w-4xl bg-[color:var(--surface-bg)] rounded-2xl shadow-2xl border border-[color:var(--surface-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-xl  text-[color:var(--panel-text)]">
                  Зассан дэлгэрэнгүй
                </h3>
                <p className="text-xs text-theme mt-0.5">
                  {record.modelName} - {record.documentId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
              type="button"
            >
              <X className="w-5 h-5 text-theme" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm  font-bold text-theme mb-1">
                Зассан ажилтан
              </label>
              <p className="text-sm text-theme">
                {record.ajiltniiNer || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm  text-theme font-bold mb-1">
                Огноо
              </label>
              <p className="text-sm text-[color:var(--panel-text)]">
                {moment(record.createdAt || record.ognoo).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </div>
            <div>
              <label className="block text-sm  text-theme font-bold mb-1">
                Төрөл

              </label>
              <p className="text-sm text-[color:var(--panel-text)]">
                {record.modelName || "-"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm  text-[color:var(--panel-text)] mb-3">
              Өөрчлөлтүүд
            </h4>
            <div className="space-y-2">
              {!record.changes || record.changes.length === 0 ? (
                <p className="text-sm text-[color:var(--muted-text)]">
                  Өөрчлөлт олдсонгүй
                </p>
              ) : (
                record.changes.map((change, index) => {
                  // Field labels in Mongolian
                  const fieldLabels: Record<string, string> = {
                    utas: "Утас",
                    mail: "Имэйл",
                    ner: "Нэр",
                    ovog: "Овог",
                    register: "Регистр",
                    toot: "Тоот",
                    davkhar: "Давхар",
                    orts: "Орц",
                    bairniiNer: "Барилгын нэр",
                    barilgiinId: "Барилгын ID",
                    baiguullagiinId: "Байгууллагын ID",
                    baiguullagiinNer: "Байгууллагын нэр",
                    erkh: "Эрх",
                    nevtrekhNer: "Нэвтрэх нэр",
                    duureg: "Дүүрэг",
                    horoo: "Хороо",
                    soh: "СОХ",
                    tailbar: "Тайлбар",
                  };
                  
                  const formatValue = (value: any): string => {
                    if (value === null || value === undefined) return "(хоосон)";
                    if (typeof value === "boolean") return value ? "Тийм" : "Үгүй";
                    if (typeof value === "object" && !Array.isArray(value)) {
                      if (value.ner && value.kod) return `${value.ner} (${value.kod})`;
                      // Try to format common objects
                      const entries = Object.entries(value).slice(0, 3);
                      if (entries.length > 0) {
                        return entries.map(([k, v]) => `${k}: ${v}`).join(", ") + (Object.keys(value).length > 3 ? "..." : "");
                      }
                      return JSON.stringify(value, null, 2);
                    }
                    if (Array.isArray(value)) {
                      if (value.length === 0) return "(хоосон)";
                      if (value.length <= 5) return value.join(", ");
                      return `${value.slice(0, 5).join(", ")}... (+${value.length - 5})`;
                    }
                    return String(value);
                  };
                  
                  return (
                    <div
                      key={change._id || index}
                      className="p-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
                    >
                      <div className=" text-sm text-[color:var(--panel-text)] mb-2">
                        {fieldLabels[change.field] || change.field}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-theme font-bold mb-1">Хуучин:</div>
                          <div className="text-theme break-words">
                            {formatValue(change.oldValue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-theme font-bold mb-1">Шинэ:</div>
                          <div className="text-theme break-words">
                            {formatValue(change.newValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] flex items-center justify-end">
          <Button
            onClick={onClose}
            variant="primary"
            size="md"
            className="!rounded-2xl"
            style={{ borderRadius: '0.5rem' }}
          >
            Хаах
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function ZassanTuukh({
  token,
  baiguullaga,
  ajiltan,
}: Props) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    dayjs().subtract(30, "days").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EditRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Common model names
  const modelNames = useMemo(() => [
    { value: "ajiltan", label: "Ажилтан" },
    { value: "geree", label: "Гэрээ" },
    { value: "baiguullaga", label: "Байгууллага" },
    { value: "barilga", label: "Барилга" },
    { value: "talbai", label: "Талбай" },
    { value: "aldangi", label: "Алданги" },
    { value: "orshinSuugch", label: "Оршин суугч" },
  ], []);

  // Fetch edit history
  const { data, isLoading, mutate } = useSWR(
    token && baiguullaga?._id
      ? [
          "/audit/zasakhTuukh",
          token,
          baiguullaga._id,
          dateRange[0],
          dateRange[1],
          selectedModel,
          selectedEmployee,
          page,
          pageSize,
        ]
      : null,
    async ([url, tkn, orgId, startDate, endDate, model, employee, pg, pgSize]) => {
      const params: any = {
        baiguullagiinId: orgId,
        khuudasniiDugaar: pg,
        khuudasniiKhemjee: 10000, // Fetch all for client-side filtering
      };
      
      if (model) {
        params.modelName = model;
      }
      
      if (employee) {
        params.ajiltniiId = employee;
      }
      
      if (startDate && endDate) {
        params.ekhlekhOgnoo = `${startDate} 00:00:00`;
        params.duusakhOgnoo = `${endDate} 23:59:59`;
      }
      
      const resp = await uilchilgee(tkn).get(url, { params });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const allRecords: EditRecord[] = useMemo(() => {
    // API returns data in data.data array, not data.jagsaalt
    const records = Array.isArray(data?.data) 
      ? data.data 
      : Array.isArray(data?.jagsaalt) 
        ? data.jagsaalt 
        : [];
    
    // Map API response to our interface format
    return records.map((r: any) => ({
      ...r,
      createdAt: r.ognoo || r.createdAt, // Use ognoo if available (this is the edit date)
      // documentCreatedAt: The original creation date of the edited document
      // NOTE: The API response currently does NOT include documentCreatedAt.
      // The backend needs to add this field to the audit response.
      // Until then, this will be null and display as "-" in the table.
      documentCreatedAt: r.documentCreatedAt || null,
    }));
  }, [data]);

  // Get unique employees from records
  const employees = useMemo(() => {
    const empMap = new Map<string, { id: string; name: string }>();
    allRecords.forEach((r) => {
      if (r.ajiltniiId && r.ajiltniiNer) {
        if (!empMap.has(r.ajiltniiId)) {
          empMap.set(r.ajiltniiId, { id: r.ajiltniiId, name: r.ajiltniiNer });
        }
      }
    });
    return Array.from(empMap.values());
  }, [allRecords]);

  // Client-side filtering and pagination
  const filteredRecords = useMemo(() => {
    return [...allRecords];
  }, [allRecords]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, page, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const totalRecords = filteredRecords.length;

  const handleDateChange = (dates: [string | null, string | null]) => {
    setDateRange(dates);
    setPage(1);
  };

  const handleViewDetails = (record: EditRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // Close page size dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".page-size-selector")) {
        setIsPageSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .zassan-select-wrapper {
          border-radius: 0.5rem !important;
          -webkit-border-radius: 0.5rem !important;
          -moz-border-radius: 0.5rem !important;
          overflow: hidden !important;
          transition: all 0.2s ease !important;
        }
        .zassan-select-wrapper:hover {
          border-color: rgba(59, 130, 246, 0.5) !important;
        }
        .zassan-select-wrapper:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        .zassan-tuukh-select {
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
          border-radius: 0 !important;
        }
        .zassan-tuukh-select option {
          padding: 8px 12px !important;
          background: var(--surface-bg) !important;
          color: var(--panel-text) !important;
        }
      `}} />
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)]">
            <div className="flex items-center gap-3">
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl  text-[color:var(--panel-text)]">
                {t("Зассан түүх")}
              </h2>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4">
            {/* Model, Employee, and Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-sm  text-[color:var(--panel-text)] mb-1">
                  Төрөл
                </label>
                <div 
                  className="zassan-select-wrapper relative border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] flex items-center"
                  style={{ borderRadius: '0.5rem', overflow: 'hidden', height: '42px' } as React.CSSProperties}
                >
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setPage(1);
                    }}
                    className="zassan-tuukh-select w-full px-4 pr-10 bg-transparent border-0 focus:outline-none focus:ring-0 text-[color:var(--panel-text)] appearance-none cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none', borderRadius: 0, height: '100%' } as React.CSSProperties}
                  >
                    <option value="">Бүгд</option>
                    {modelNames.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm  text-[color:var(--panel-text)] mb-1">
                  Ажилтан
                </label>
                <div 
                  className="zassan-select-wrapper relative border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] flex items-center"
                  style={{ borderRadius: '0.5rem', overflow: 'hidden', height: '42px' } as React.CSSProperties}
                >
                  <select
                    value={selectedEmployee}
                    onChange={(e) => {
                      setSelectedEmployee(e.target.value);
                      setPage(1);
                    }}
                    className="zassan-tuukh-select w-full px-4 pr-10 bg-transparent border-0 focus:outline-none focus:ring-0 text-[color:var(--panel-text)] appearance-none cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none', borderRadius: 0, height: '100%' } as React.CSSProperties}
                  >
                    <option value="">Бүгд</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm  text-[color:var(--panel-text)] mb-1">
                  Огноо
                </label>
                <DateRangeButton
                  value={dateRange}
                  onChange={handleDateChange}
                  placeholder="Огноо сонгох"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="md" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden" style={{ maxHeight: `${pageSize * 60}px`, overflowY: 'auto' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[color:var(--surface-hover)] sticky top-0 border-b">
                      <tr>
                        <th className="px-4 py-3 text-xs border-r text-[color:var(--panel-text)] text-center w-16 !rounded-tl-lg">
                          #
                        </th>
                        <th className="px-4 py-3 text-xs border-r text-center   text-[color:var(--panel-text)]">
                          Үүссэн огноо
                        </th>
                        <th className="px-4 py-3 text-xs border- text-center  text-[color:var(--panel-text)]">
                          Төрөл
                        </th>
                        <th className="px-4 py-3 text-xs border-r text-center   text-[color:var(--panel-text)]">
                          Ажилтан
                        </th>
                        <th className="px-4 py-3 text-xs border-r text-center  text-[color:var(--panel-text)]">
                          Өөрчилсөн огноо
                        </th>
                        <th className="px-4 py-3 text-xs border-r   text-[color:var(--panel-text)] text-center !rounded-tr-lg">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-[color:var(--muted-text)]"
                          >
                            Зассан түүх олдсонгүй
                          </td>
                        </tr>
                      ) : (
                        paginatedRecords.map((record, index) => {
                          const isLast = index === paginatedRecords.length - 1;
                          // Get original creation date from documentCreatedAt field
                          const originalCreatedAt = (record as any).documentCreatedAt || "-";
                          return (
                            <tr
                              key={record._id}
                              className={`border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors ${isLast ? 'last:border-b-0' : ''}`}
                            >
                              <td className="px-4 border-r py-3 text-sm text-[color:var(--panel-text)] text-center">
                                {(page - 1) * pageSize + index + 1}
                              </td>
                              <td className="px-4 py-3 border-r text-center text-sm text-[color:var(--panel-text)]">
                                {originalCreatedAt !== "-" ? moment(originalCreatedAt).format("YYYY-MM-DD HH:mm:ss") : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-center border-r text-[color:var(--panel-text)]">
                                {modelNames.find((m) => m.value === record.modelName)?.label || record.modelName || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm border-r  text-[color:var(--panel-text)]">
                                <div className="flex text-center items-center justify-center gap-2">
                                  <User className="w-4 h-4 text-[color:var(--muted-text)]" />
                                  {record.ajiltniiNer || "-"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center border-r text-sm text-[color:var(--panel-text)]">
                                {moment(record.createdAt || record.ognoo).format("YYYY-MM-DD HH:mm:ss")}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(record)}
                                  className="!rounded-2xl"
                                  title="Дэлгэрэнгүй үзэх"
                                >
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[color:var(--surface-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[color:var(--panel-text)]">
                    Нийт {totalRecords} бичлэг
                  </span>
                  
                  {/* Page Size Selector */}
                  <div className="relative page-size-selector">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                      className="!rounded-2xl"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      {pageSize} / хуудас
                    </Button>
                    {isPageSizeOpen && (
                      <div className="absolute bottom-full mb-2 left-0 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg shadow-lg z-10 min-w-[100px] overflow-hidden">
                        {[10, 20, 50, 100, 500].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setPageSize(size);
                              setPage(1);
                              setIsPageSizeOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-[color:var(--surface-hover)] transition-colors ${
                              pageSize === size
                                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                                : "text-[color:var(--panel-text)]"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="!rounded-2xl"
                    style={{ borderRadius: '0.5rem' }}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Өмнөх
                  </Button>
                  <span className="text-sm text-[color:var(--panel-text)] px-3">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="!rounded-2xl"
                    style={{ borderRadius: '0.5rem' }}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Дараах
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
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
