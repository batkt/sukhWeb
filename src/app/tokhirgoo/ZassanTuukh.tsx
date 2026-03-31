"use client";

import React, { useEffect, useMemo, useState } from "react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit, User, FileText, Eye, X, ChevronDown } from "lucide-react";
import moment from "moment";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { Loader } from "@mantine/core";
import Button from "@/components/ui/Button";
import { createPortal } from "react-dom";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { Table } from "antd";
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
  useModalHotkeys({ isOpen: open, onClose });
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
                  {(() => {
                    const modelNames: Record<string, string> = {
                      ajiltan: "Ажилтан",
                      geree: "Гэрээ",
                      barilga: "Барилга",
                      talbai: "Талбай",
                      orshinSuugch: "Оршин суугч",
                      nekhemjlekh: "Нэхэмжлэх",
                      nekhemjlekhiinTuukh: "Нэхэмжлэлийн түүх",
                      guilgee: "Гүйлгээ",
                    };
                    return modelNames[record.modelName] || record.modelName;
                  })()}{" "}
                  - {record.documentId}
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
              <p className="text-sm text-theme">{record.ajiltniiNer || "-"}</p>
            </div>
            <div>
              <label className="block text-sm  text-theme font-bold mb-1">
                Огноо
              </label>
              <p className="text-sm text-[color:var(--panel-text)]">
                {moment(record.createdAt || record.ognoo).format(
                  "YYYY-MM-DD HH:mm:ss",
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm  text-theme font-bold mb-1">
                Төрөл
              </label>
              <p className="text-sm text-[color:var(--panel-text)]">
                {(() => {
                  const modelNames: Record<string, string> = {
                    ajiltan: "Ажилтан",
                    geree: "Гэрээ",
                    barilga: "Барилга",
                    talbai: "Талбай",
                    orshinSuugch: "Оршин суугч",
                    nekhemjlekh: "Нэхэмжлэх",
                    nekhemjlekhiinTuukh: "Нэхэмжлэлийн түүх",
                    guilgee: "Гүйлгээ",
                  };
                  return (
                    modelNames[record.modelName] || record.modelName || "-"
                  );
                })()}
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
                  const fieldLabels: Record<string, string> = {
                    ner: "Нэр",
                    ovog: "Овог",
                    utas: "Утас",
                    mail: "Имэйл",
                    register: "Регистр",
                    toot: "Тоот",
                    davkhar: "Давхар",
                    orts: "Орц",
                    bairniiNer: "Барилгын нэр",
                    baiguullagiinNer: "Байгууллагын нэр",
                    ekhniiUldegdel: "Эхний үлдэгдэл",
                    tsahilgaaniiZaalt: "Цахилгаан кВт",
                    tailbar: "Тайлбар",
                    createdAt: "Үүсгэсэн огноо",
                    updatedAt: "Шинэчилсэн огноо",
                    status: "Төлөв",
                    repliedAt: "Хариулсан огноо",
                    repliedBy: "Хариулсан ажилтан",
                    tanilsuulgaKharakhEsekh: "Танилцуулга харах эсэх",
                    walletUserId: "Wallet ID",
                    soh: "СӨХ",
                    nevtrekhNer: "Нэвтрэх нэр",
                    erkh: "Эрх",
                    duureg: "Дүүрэг",
                    horoo: "Хороо",
                    nuutsUg: "Нууц үг",
                    baiguullagiinRegister: "Байгууллагын регистр",
                    niitTulbur: "Нийт нэхэмжилсэн",
                    tulsunDun: "Нийт төлөн",
                    uldegdel: "Үлдэгдэл",
                    uld: "Үлдэгдэл",
                    paymentHistory: "Төлөлтийн түүх",
                    medeelel: "Нэмэлт мэдээлэл",
                    zardluud: "Зардлууд",
                    guilgeenuud: "Гүйлгээнүүд",
                  };

                  const excludedFields = ["nuutsUg", "password", "token"];
                  if (excludedFields.includes(change.field)) return null;

                  const formatValue = (value: any): string => {
                    if (value === null || value === undefined)
                      return "(хоосон)";
                    if (typeof value === "boolean")
                      return value ? "Тийм" : "Үгүй";
                    if (value === "pending") return "Хүлээгдэж буй";
                    if (value === "done") return "Дууссан";

                    const safeStringify = (obj: any): string => {
                      try {
                        if (typeof obj !== "object" || obj === null)
                          return String(obj);
                        if (Array.isArray(obj)) return `[${obj.length} мөр]`;
                        if (obj.ner && obj.kod)
                          return `${obj.ner} (${obj.kod})`;

                        const keys = Object.keys(obj).filter(
                          (k) => !k.startsWith("_"),
                        );
                        if (keys.length === 0) return "{...}";
                        const summary = keys
                          .slice(0, 3)
                          .map((k) => {
                            const v = obj[k];
                            const vStr =
                              typeof v === "object" && v !== null
                                ? Array.isArray(v)
                                  ? `[${v.length}]`
                                  : "{...}"
                                : String(v);
                            return `${k}: ${vStr}`;
                          })
                          .join(", ");
                        return summary + (keys.length > 3 ? "..." : "");
                      } catch {
                        return "[Объект]";
                      }
                    };

                    if (typeof value === "object" && !Array.isArray(value)) {
                      if (value.ner && value.kod)
                        return `${value.ner} (${value.kod})`;

                      // Detailed summary for medeelel to avoid [object Object]
                      if (change.field === "medeelel") {
                        const parts: string[] = [];
                        if (Array.isArray(value.zardluud))
                          parts.push(`Зардал: ${value.zardluud.length}`);
                        if (Array.isArray(value.guilgeenuud))
                          parts.push(`Гүйлгээ: ${value.guilgeenuud.length}`);
                        if (value.niitTulbur !== undefined)
                          parts.push(`Нийт: ${value.niitTulbur}`);
                        if (parts.length > 0) return parts.join(", ");
                      }

                      return safeStringify(value);
                    }
                    if (Array.isArray(value)) {
                      if (value.length === 0) return "(хоосон)";
                      if (
                        change.field === "paymentHistory" ||
                        change.field === "guilgeenuud" ||
                        change.field === "zardluud"
                      ) {
                        return `${value.length} мөр`;
                      }
                      if (typeof value[0] === "object")
                        return `${value.length} мөр`;
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
                          <div className="text-theme font-bold mb-1">
                            Хуучин:
                          </div>
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
            size="sm"
            style={{ borderRadius: "0.5rem" }}
          >
            Хаах
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default function ZassanTuukh({ token, baiguullaga, ajiltan }: Props) {
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

  // Common model names - Keep only necessary ones
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
        ]
      : null,
    async ([url, tkn, orgId, startDate, endDate, model, employee]) => {
      const params: any = {
        baiguullagiinId: orgId,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 10000, // Fetch all for client-side pagination
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
    { revalidateOnFocus: false },
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
      ajiltniiId:
        r.ajiltniiId ||
        r.ajiltanId ||
        r.workerId ||
        r.ajiltan?._id ||
        r.ajiltan?.id,
      createdAt: r.ognoo || r.createdAt,
      documentCreatedAt: r.documentCreatedAt || null,
      // modelName might come as different field names
      modelName:
        r.modelName ||
        r.collection ||
        r.collectionName ||
        r.entity ||
        r.entityType ||
        "-",
    }));
  }, [data]);

  // Client-side filtering and pagination
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const matchesModel = !selectedModel || r.modelName === selectedModel;
      const matchesEmployee =
        !selectedEmployee || r.ajiltniiId === selectedEmployee;
      return matchesModel && matchesEmployee;
    });
  }, [allRecords, selectedModel, selectedEmployee]);

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
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />
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

          {/* Filters - One Line */}
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

            <div className="relative zassan-select-wrapper h-[40px] w-full sm:w-[200px]">
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setPage(1);
                }}
                className="w-full h-full px-4 pr-10 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg text-[color:var(--panel-text)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    key: "documentCreatedAt",
                    label: "Үүссэн огноо",
                    align: "center",
                    render: (value: any) =>
                      value ? moment(value).format("YYYY-MM-DD HH:mm:ss") : "-",
                  },
                  {
                    key: "createdAt",
                    label: "Өөрчилсөн огноо",
                    align: "center",
                    render: (value: any, record: any) =>
                      moment(value || record.ognoo).format(
                        "YYYY-MM-DD HH:mm:ss",
                      ),
                  },
                  {
                    key: "modelName",
                    label: "Төрөл",
                    align: "center",
                    render: (value: any) =>
                      modelNames.find((m) => m.value === value)?.label ||
                      value ||
                      "-",
                  },
                  {
                    key: "action",
                    label: "Үйлдэл",
                    align: "center",
                    render: (_value: any, record: any) => (
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
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

              {/* Global Standard Pagination */}
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
                  pageSizeOptions={[10, 20, 50, 100, 500]}
                />
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
