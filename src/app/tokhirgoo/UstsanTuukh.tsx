"use client";

import React, { useMemo, useState } from "react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { Trash2, Eye, X, AlertTriangle, ChevronDown } from "lucide-react";
import moment from "moment";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { Loader } from "@mantine/core";
import Button from "@/components/ui/Button";
import { createPortal } from "react-dom";
import useModalHotkeys from "@/lib/useModalHotkeys";
import {
  StandardTable,
  StandardPagination,
} from "@/components/ui/StandardTable";

interface Props {
  token: string;
  baiguullaga: { _id: string };
  ajiltan: { _id: string; baiguullagiinId?: string };
}

interface DeleteRecord {
  _id: string;
  modelName: string;
  documentId: string;
  ajiltniiId: string;
  ajiltniiNer: string;
  ajiltniiLoginNer?: string;
  deletedData?: any; // Full document snapshot (API uses deletedData)
  deletedDocument?: any; // Alias for deletedData
  deletionType: "hard" | "soft";
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
  record: DeleteRecord | null;
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
        <div className="px-6 py-5 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-xl  text-[color:var(--panel-text)]">
                  Устгасан дэлгэрэнгүй
                </h3>
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
              <label className="block text-sm font-bold text-theme mb-1">
                Устгасан ажилтан
              </label>
              <p className="text-sm text-[color:var(--panel-text)]">
                {record.ajiltniiNer || "-"}
              </p>
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
              <label className="block text-sm font-bold text-theme mb-1">
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
              Устгасан баримтын мэдээлэл
            </h4>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {(() => {
                const deletedData =
                  record.deletedDocument || record.deletedData;
                if (!deletedData) {
                  return (
                    <p className="text-sm text-[color:var(--muted-text)]">
                      Мэдээлэл олдсонгүй
                    </p>
                  );
                }

                // Common field labels in Mongolian
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
                  updatedAt: "Устгасан огноо",
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
                  medeelel: "Мэдээлэл",
                  zardluud: "Зардлууд",
                  guilgeenuud: "Гүйлгээнүүд",
                  tulsun: "Төлсөн",
                };

                // Fields to exclude from display
                const excludedFields = [
                  "taniltsuulgaKharakhEsekh",
                  "baiguullagiinId",
                  "barilgiinId",
                  "erkh",
                  "nevtrekhNer",
                  "duureg",
                  "horoo",
                  "toots",
                  "ajiltniiNer",
                  "nuutsUg",
                  "password",
                  "_id",
                  "__v",
                ];

                const formatValue = (value: any, key?: string): string => {
                  if (value === null || value === undefined) return "(хоосон)";
                  if (typeof value === "boolean")
                    return value ? "Тийм" : "Үгүй";

                  // Format dates in Mongolian format
                  if (key === "createdAt" || key === "updatedAt") {
                    try {
                      return moment(value).format("YYYY-MM-DD HH:mm:ss");
                    } catch {
                      return String(value);
                    }
                  }

                  // Check if value is a date string (ISO format)
                  if (value === "pending") return "Хүлээгдэж буй";
                  if (value === "done") return "Дууссан";

                  const safeStringify = (obj: any): string => {
                    try {
                      if (typeof obj !== "object" || obj === null)
                        return String(obj);
                      if (Array.isArray(obj)) {
                        if (obj.length === 0) return "(хоосон)";
                        return `[${obj.length} мөр]`;
                      }
                      if (obj.ner && obj.kod) return `${obj.ner} (${obj.kod})`;

                      // Try to pick some useful keys
                      const keys = Object.keys(obj).filter(
                        (k) => !k.startsWith("_"),
                      );
                      if (keys.length === 0) return "{...}";
                      const summary = keys
                        .slice(0, 3)
                        .map((k) => {
                          const v = obj[k];
                          const valStr =
                            typeof v === "object" && v !== null
                              ? Array.isArray(v)
                                ? `[${v.length}]`
                                : "{...}"
                              : String(v);
                          return `${k}: ${valStr}`;
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

                    // Detailed object formatting to avoid [object Object]
                    if (
                      key === "medeelel" ||
                      key === "deletedData" ||
                      key === "deletedDocument"
                    ) {
                      const summaryLines: string[] = [];
                      if (Array.isArray(value.zardluud))
                        summaryLines.push(`Зардал: ${value.zardluud.length}`);
                      if (Array.isArray(value.guilgeenuud))
                        summaryLines.push(
                          `Гүйлгээ: ${value.guilgeenuud.length}`,
                        );
                      if (value.niitTulbur !== undefined)
                        summaryLines.push(`Нийт: ${value.niitTulbur}`);
                      if (summaryLines.length > 0)
                        return summaryLines.join(", ");
                    }

                    return safeStringify(value);
                  }
                  if (Array.isArray(value)) {
                    if (value.length === 0) return "(хоосон)";
                    // Format payment history or other arrays
                    if (
                      key === "paymentHistory" ||
                      key === "guilgeenuud" ||
                      key === "zardluud"
                    ) {
                      return `${value.length} мөр`;
                    }
                    if (typeof value[0] === "object")
                      return `${value.length} мөр`;
                    return value.join(", ");
                  }
                  return String(value);
                };

                // Helper to get value from toots array first, then fallback to top-level
                const getValueFromToots = (
                  key: string,
                  topLevelValue: any,
                ): any => {
                  // Fields that should prioritize toots array
                  const tootsFields = [
                    "toot",
                    "davkhar",
                    "orts",
                    "duureg",
                    "horoo",
                    "soh",
                    "bairniiNer",
                  ];
                  if (
                    tootsFields.includes(key) &&
                    Array.isArray(deletedData.toots) &&
                    deletedData.toots.length > 0
                  ) {
                    const tootsValue = deletedData.toots[0][key];
                    if (tootsValue != null && tootsValue !== "") {
                      return tootsValue;
                    }
                  }
                  return topLevelValue;
                };

                const filteredEntries = Object.entries(deletedData).filter(
                  ([key]) =>
                    !key.startsWith("_") &&
                    key !== "__v" &&
                    !excludedFields.includes(key),
                );

                // Check if createdAt and updatedAt are the same
                const createdAt = deletedData.createdAt;
                const updatedAt = deletedData.updatedAt;
                const datesAreSame =
                  createdAt &&
                  updatedAt &&
                  moment(createdAt).format("YYYY-MM-DD HH:mm:ss") ===
                    moment(updatedAt).format("YYYY-MM-DD HH:mm:ss");

                return filteredEntries
                  .filter(([key]) => {
                    if (datesAreSame && key === "updatedAt") {
                      return false;
                    }
                    return true;
                  })
                  .map(([key, value]) => {
                    // Prioritize toots array data for specific fields
                    const displayValue = getValueFromToots(key, value);

                    // If dates are the same and this is createdAt, change label to show both
                    const displayLabel =
                      datesAreSame && key === "createdAt"
                        ? "Үүсгэсэн/Устгасан огноо"
                        : fieldLabels[key] || key;

                    return (
                      <div
                        key={key}
                        className="p-3 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
                      >
                        <div className=" text-sm text-theme mb-1">
                          {displayLabel}
                        </div>
                        <div className="text-sm text-theme break-words">
                          {formatValue(displayValue, key)}
                        </div>
                      </div>
                    );
                  });
              })()}
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

export default function UstsanTuukh({ token, baiguullaga, ajiltan }: Props) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().endOf("month").format("YYYY-MM-DD"),
  ]);
  const [selectedRecord, setSelectedRecord] = useState<DeleteRecord | null>(
    null,
  );
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

  // Fetch delete history — page/pageSize NOT in key (client-side pagination)
  const { data, isLoading } = useSWR(
    token && baiguullaga?._id
      ? [
          "/audit/ustgakhTuukh",
          token,
          baiguullaga._id,
          dateRange?.[0] || null,
          dateRange?.[1] || null,
          selectedModel,
        ]
      : null,
    async ([url, tkn, orgId, startDate, endDate, model]) => {
      const params: any = {
        baiguullagiinId: orgId,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 10000,
      };

      if (model) params.modelName = model;

      if (startDate && endDate) {
        params.ekhlekhOgnoo = `${startDate} 00:00:00`;
        params.duusakhOgnoo = `${endDate} 23:59:59`;
      }

      const resp = await uilchilgee(tkn).get(url, { params });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const allRecords: DeleteRecord[] = useMemo(() => {
    // API returns data in data.data array, not data.jagsaalt
    const raw = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : [];

    // De-duplicate by ID and content to prevent visual duplication
    const seenIds = new Set<string>();
    const seenContent = new Set<string>();
    const unique: any[] = [];

    raw.forEach((r: any) => {
      if (!r) return;
      const id = r._id ? String(r._id) : null;
      // Content key: documentId + date + model
      const cKey = `${r.documentId}-${r.ognoo || r.createdAt}-${r.modelName}`;

      if (id && seenIds.has(id)) return;
      if (seenContent.has(cKey)) return;

      if (id) seenIds.add(id);
      seenContent.add(cKey);
      unique.push(r);
    });

    // Map API response to our interface format
    return unique.map((r: any) => ({
      ...r,
      ajiltniiId:
        r.ajiltniiId ||
        r.ajiltanId ||
        r.workerId ||
        r.ajiltan?._id ||
        r.ajiltan?.id,
      deletedDocument: r.deletedData || r.deletedDocument, // Support both field names
      createdAt: r.ognoo || r.createdAt, // Use ognoo if available
    }));
  }, [data]);

  // Client-side filtering and pagination
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      return !selectedModel || r.modelName === selectedModel;
    });
  }, [allRecords, selectedModel]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const totalRecords = filteredRecords.length;

  const handleDateChange = (
    dates: any,
    dateStrings?: [string, string] | string[],
  ) => {
    const ds = dateStrings as [string, string] | undefined;
    if (Array.isArray(ds) && ds[0] && ds[1]) {
      setDateRange([ds[0], ds[1]]);
    } else if (dates?.[0] && dates?.[1]) {
      setDateRange([
        dayjs(dates[0]).format("YYYY-MM-DD"),
        dayjs(dates[1]).format("YYYY-MM-DD"),
      ]);
    } else {
      setDateRange([null, null]);
    }
    setPage(1);
  };

  const handleViewDetails = (record: DeleteRecord) => {
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
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-xl text-[color:var(--panel-text)]">
                {t("Устгасан түүх")}
              </h2>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div
              id="ustsan-date"
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
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setPage(1);
                }}
                className="w-full h-full px-4 pr-10 bg-transparent border-0 focus:outline-none text-[color:var(--panel-text)] appearance-none cursor-pointer text-sm"
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
                    render: (_value: any, record: any) => {
                      const orig =
                        record.deletedDocument?.createdAt ||
                        record.deletedData?.createdAt ||
                        null;
                      return orig
                        ? moment(orig).format("YYYY-MM-DD HH:mm:ss")
                        : "-";
                    },
                  },
                  {
                    key: "createdAt",
                    label: "Устгасан огноо",
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
                emptyMessage="Устгасан түүх олдсонгүй"
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
