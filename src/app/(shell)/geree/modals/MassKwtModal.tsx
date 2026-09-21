"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import {
  Zap,
  Loader2,
  X,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Upload,
  ChevronDown,
} from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { toast } from "sonner";

interface ResidentUnitRow {
  _id: string; // unique row id: `${orshinSuugchId}|${toot}` or `geree_${gereeId}`
  orshinSuugchId?: string;
  gereeniiId?: string;
  toot: string;
  davkhar?: string;
  orts?: string;
  ner: string;
  ovog?: string;
  utas?: string;
  currentKwt: number;
  newKwt: string;
}

interface MassKwtModalProps {
  show: boolean;
  onClose: () => void;
  token: string;
  baiguullagiinId?: string;
  barilgiinId?: string;
  onSuccess?: () => void;
}

// Check if a unit or contract is garage or storage
const isGarageOrStorage = (item: any): boolean => {
  const turul = String(item?.turul || "").toLowerCase().trim();
  if (
    turul === "гараж" ||
    turul === "зогсоол" ||
    turul === "агуулах" ||
    turul.includes("гараж") ||
    turul.includes("зогсоол") ||
    turul.includes("агуулах") ||
    turul.includes("garage") ||
    turul.includes("storage") ||
    turul.includes("parking")
  ) {
    return true;
  }
  const davkhar = String(item?.davkhar || "").toUpperCase().trim();
  if (/^B\d+$/i.test(davkhar) || davkhar === "B" || davkhar === "-1" || davkhar === "-2") {
    return true;
  }
  return false;
};

export default function MassKwtModal({
  show,
  onClose,
  token,
  baiguullagiinId,
  barilgiinId,
  onSuccess,
}: MassKwtModalProps) {
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const excelMenuRef = useRef<HTMLDivElement | null>(null);

  const [fetching, setFetching] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [residents, setResidents] = useState<ResidentUnitRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [excelMenuOpen, setExcelMenuOpen] = useState<boolean>(false);
  const [bulkInputValue, setBulkInputValue] = useState<string>("");

  useModalHotkeys({ isOpen: show, onClose });

  // Close Excel menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (excelMenuRef.current && !excelMenuRef.current.contains(e.target as Node)) {
        setExcelMenuOpen(false);
      }
    };
    if (excelMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [excelMenuOpen]);

  // Fetch residents & contracts when modal opens
  useEffect(() => {
    if (show && token && baiguullagiinId) {
      loadResidents();
    } else {
      setResidents([]);
      setSearchTerm("");
      setExcelMenuOpen(false);
    }
  }, [show, token, baiguullagiinId, barilgiinId]);

  const loadResidents = async () => {
    try {
      setFetching(true);
      const [resResidents, resContracts] = await Promise.all([
        uilchilgee(token).get("/orshinSuugch", {
          params: {
            baiguullagiinId,
            barilgiinId: barilgiinId || undefined,
            khuudasniiKhemjee: 2000,
          },
        }),
        uilchilgee(token)
          .get("/geree", {
            params: {
              baiguullagiinId,
              khuudasniiDugaar: 1,
              khuudasniiKhemjee: 2000,
              query: JSON.stringify({
                baiguullagiinId,
                ...(barilgiinId ? { barilgiinId } : {}),
                tuluv: "Идэвхтэй",
              }),
            },
          })
          .catch(() => ({ data: { jagsaalt: [] } })),
      ]);

      const rawResidents = Array.isArray(resResidents.data?.jagsaalt)
        ? resResidents.data.jagsaalt
        : Array.isArray(resResidents.data?.list)
          ? resResidents.data.list
          : Array.isArray(resResidents.data)
            ? resResidents.data
            : [];

      const rawContracts = Array.isArray(resContracts.data?.jagsaalt)
        ? resContracts.data.jagsaalt
        : Array.isArray(resContracts.data?.list)
          ? resContracts.data.list
          : Array.isArray(resContracts.data)
            ? resContracts.data
            : [];

      // Build contract lookup maps
      const contractMap = new Map<string, any>();
      rawContracts.forEach((c: any) => {
        if (isGarageOrStorage(c)) return;
        const tootStr = String(c.toot || "").trim();
        if (!tootStr) return;
        const resId = String(c.orshinSuugchId || c.khariltsagchId || "").trim();
        if (resId) {
          contractMap.set(`${resId}|${tootStr}`, c);
        }
        if (!contractMap.has(tootStr)) {
          contractMap.set(tootStr, c);
        }
      });

      const parsedRows: ResidentUnitRow[] = [];
      const seenRowKeys = new Set<string>();

      // 1. Process each resident's units
      rawResidents.forEach((item: any) => {
        const resId = String(item._id);
        const phoneVal = item.utas || item.utas1 || item.utas2 || item.utasnuud || "";
        const residentName = item.ner || "Нэргүй";
        const residentOvog = item.ovog || "";

        if (Array.isArray(item.toots) && item.toots.length > 0) {
          // Filter toots: only matching building and NOT garage/storage
          const aptToots = item.toots.filter((t: any) => {
            if (barilgiinId && t.barilgiinId && String(t.barilgiinId) !== String(barilgiinId)) {
              return false;
            }
            if (isGarageOrStorage(t)) {
              return false;
            }
            return !!t.toot;
          });

          aptToots.forEach((t: any) => {
            const subToots = String(t.toot || "")
              .split(/[\s,;|]+/)
              .map((s: string) => s.trim())
              .filter(Boolean);

            subToots.forEach((singleToot: string) => {
              const rowKey = `${resId}|${singleToot}`;
              if (seenRowKeys.has(rowKey)) return;
              seenRowKeys.add(rowKey);

              const matchedContract =
                contractMap.get(`${resId}|${singleToot}`) || contractMap.get(singleToot);
              const cur =
                parseFloat(
                  matchedContract?.suuliinZaalt ??
                  t.tsahilgaaniiZaalt ??
                  t.suuliinZaalt ??
                  item.tsahilgaaniiZaalt ??
                  0
                ) || 0;

              parsedRows.push({
                _id: rowKey,
                orshinSuugchId: resId,
                gereeniiId: matchedContract?._id
                  ? String(matchedContract._id)
                  : t.gereeniiId || "",
                toot: singleToot,
                davkhar: String(
                  t.davkhar || matchedContract?.davkhar || item.davkhar || ""
                ).trim(),
                orts: String(
                  t.orts || matchedContract?.orts || item.orts || ""
                ).trim(),
                ner: residentName,
                ovog: residentOvog,
                utas: String(phoneVal).trim(),
                currentKwt: cur,
                newKwt: cur > 0 ? String(cur) : "",
              });
            });
          });
        } else if (item.toot && !isGarageOrStorage(item)) {
          const subToots = String(item.toot || "")
            .split(/[\s,;|]+/)
            .map((s: string) => s.trim())
            .filter(Boolean);

          subToots.forEach((singleToot: string) => {
            const rowKey = `${resId}|${singleToot}`;
            if (seenRowKeys.has(rowKey)) return;
            seenRowKeys.add(rowKey);

            const matchedContract =
              contractMap.get(`${resId}|${singleToot}`) || contractMap.get(singleToot);
            const cur =
              parseFloat(
                matchedContract?.suuliinZaalt ??
                item.tsahilgaaniiZaalt ??
                0
              ) || 0;

            parsedRows.push({
              _id: rowKey,
              orshinSuugchId: resId,
              gereeniiId: matchedContract?._id
                ? String(matchedContract._id)
                : item.gereeniiId || "",
              toot: singleToot,
              davkhar: String(
                matchedContract?.davkhar || item.davkhar || ""
              ).trim(),
              orts: String(matchedContract?.orts || item.orts || "").trim(),
              ner: residentName,
              ovog: residentOvog,
              utas: String(phoneVal).trim(),
              currentKwt: cur,
              newKwt: cur > 0 ? String(cur) : "",
            });
          });
        }
      });

      // 2. Include any active apartment contracts that might not be in residents list
      rawContracts.forEach((c: any) => {
        if (isGarageOrStorage(c)) return;
        const toot = String(c.toot || "").trim();
        if (!toot) return;
        const resId = String(c.orshinSuugchId || c.khariltsagchId || "").trim();
        const rowKey = resId ? `${resId}|${toot}` : `geree_${c._id}|${toot}`;
        if (
          seenRowKeys.has(rowKey) ||
          parsedRows.some((r) => r.toot === toot && r.ner === c.ner)
        ) {
          return;
        }
        seenRowKeys.add(rowKey);

        const cur = parseFloat(c.suuliinZaalt ?? c.tsahilgaaniiZaalt ?? 0) || 0;
        parsedRows.push({
          _id: rowKey,
          orshinSuugchId: resId || undefined,
          gereeniiId: String(c._id),
          toot,
          davkhar: String(c.davkhar || "").trim(),
          orts: String(c.orts || "").trim(),
          ner: c.ner || "Нэргүй",
          ovog: c.ovog || "",
          utas: Array.isArray(c.utas)
            ? c.utas.join(", ")
            : String(c.utas || "").trim(),
          currentKwt: cur,
          newKwt: cur > 0 ? String(cur) : "",
        });
      });

      // Sort by Toot numerically/alphabetically
      parsedRows.sort((a, b) =>
        a.toot.localeCompare(b.toot, undefined, { numeric: true, sensitivity: "base" })
      );

      setResidents(parsedRows);
    } catch (err: any) {
      toast.error("Тоотын мэдээлэл татахад алдаа гарлаа");
    } finally {
      setFetching(false);
    }
  };

  const handleKwtChange = (id: string, val: string) => {
    setResidents((prev) =>
      prev.map((r) => (r._id === id ? { ...r, newKwt: val } : r))
    );
  };

  // Keyboard navigation between inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = document.querySelector<HTMLInputElement>(
        `input[data-kwt-index="${index + 1}"]`
      );
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = document.querySelector<HTMLInputElement>(
        `input[data-kwt-index="${index - 1}"]`
      );
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Apply same kWt to all toots
  const handleApplyBulkValue = () => {
    if (!bulkInputValue.trim()) return;
    const num = parseFloat(bulkInputValue);
    if (isNaN(num) || num < 0) {
      toast.error("Ижил оруулах кВт утгаа зөв оруулна уу.");
      return;
    }
    setResidents((prev) =>
      prev.map((r) => ({ ...r, newKwt: String(num) }))
    );
    toast.success(`Бүх тоотод ${num} кВт утга тохирууллаа.`);
  };

  // Export Toot list with current kWt to Excel sheet
  const handleExportToExcel = async () => {
    if (residents.length === 0) {
      toast.error("Татах тоотын мэдээлэл байхгүй байна.");
      return;
    }

    const XLSX = await import("xlsx");

    const exportRows = residents.map((r, index) => ({
      "№": index + 1,
      "Нэр": r.ner || "",
      "Тоот": r.toot || "",
      "Давхар": r.davkhar || "",
      "Дугаар": r.utas || "",
      "Одоогийн кВт": r.currentKwt || 0,
      "Шинэ кВт заалт": r.newKwt !== "" ? parseFloat(r.newKwt) : r.currentKwt || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "кВт_Заалт");
    XLSX.writeFile(workbook, `Тоотуудын_кВт_заалт.xlsx`);
    toast.success("Excel файл амжилттай татагдлаа.");
  };

  // Import readings from user's edited Excel file
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          toast.error("Excel файл хоосон байна.");
          return;
        }

        let updatedCount = 0;
        setResidents((prev) =>
          prev.map((r) => {
            const matchedRow =
              rows.find(
                (row) =>
                  String(row["Тоот"] || "").trim() === String(r.toot).trim() &&
                  (!row["Нэр"] || String(row["Нэр"]).trim() === String(r.ner).trim())
              ) ||
              rows.find(
                (row) => String(row["Тоот"] || "").trim() === String(r.toot).trim()
              );
            if (matchedRow) {
              const val = parseFloat(
                matchedRow["Шинэ кВт заалт"] ??
                matchedRow["Цахилгаан кВт"] ??
                matchedRow["Цахилгаан кВт (тариф ₮/кВт)"] ??
                matchedRow["кВт"] ??
                matchedRow["Заалт"] ??
                matchedRow["Шинэ заалт"]
              );
              if (!isNaN(val) && val >= 0) {
                updatedCount++;
                return { ...r, newKwt: String(val) };
              }
            }
            return r;
          })
        );

        toast.success(
          `Excel файлаас ${updatedCount} тоотын кВт заалт амжилттай уншигдлаа. "Хадгалах" товчийг дарж баталгаажуулна уу.`
        );
      } catch (err) {
        toast.error("Excel файл уншихад алдаа гарлаа.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const filteredResidents = useMemo(() => {
    if (!searchTerm.trim()) return residents;
    const term = searchTerm.toLowerCase().trim();
    return residents.filter(
      (r) =>
        r.toot.toLowerCase().includes(term) ||
        (r.davkhar && r.davkhar.toLowerCase().includes(term)) ||
        r.ner.toLowerCase().includes(term) ||
        (r.ovog && r.ovog.toLowerCase().includes(term)) ||
        (r.utas && r.utas.includes(term))
    );
  }, [residents, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!baiguullagiinId) {
      toast.error("Байгууллагын мэдээлэл олдсонгүй.");
      return;
    }

    // Collect modified or filled kWt entries
    const unitsToUpdate = residents
      .filter((r) => r.newKwt !== "" && !isNaN(parseFloat(r.newKwt)))
      .map((r) => ({
        orshinSuugchId: r.orshinSuugchId || undefined,
        gereeniiId: r.gereeniiId || undefined,
        toot: r.toot,
        davkhar: r.davkhar,
        kwt: parseFloat(r.newKwt),
      }));

    if (unitsToUpdate.length === 0) {
      toast.error("Шинэчлэх кВт заалттай нэг ч тоот олдсонгүй.");
      return;
    }

    try {
      setLoading(true);
      const res = await uilchilgee(token).post("/orshinSuugch/massUpdateKwt", {
        baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
        units: unitsToUpdate,
      });

      if (res.data?.success) {
        toast.success(
          res.data.message ||
          `${res.data.updatedCount || unitsToUpdate.length} тоотын кВт заалт амжилттай шинэчлэгдлээ.`
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.aldaa || "Заалт шинэчлэхэд алдаа гарлаа.");
      }
    } catch (err: any) {
      toast.error(
        "Алдаа гарлаа: " +
        (err.response?.data?.aldaa || err.message || "Сүлжээний алдаа")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="w-full !max-w-[1260px] max-h-[100vh] flex flex-col modal-surface rounded-2xl shadow-2xl p-5 sm:p-6 text-sm relative"
            style={{ maxWidth: "1260px", width: "100%" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-[color:var(--surface-border)] pb-4 cursor-move select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-base text-[color:var(--panel-text)] dark:text-white">
                    Цахилгааны (кВт) заалт шинэчлэх
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors p-1 rounded-lg hover:bg-[color:var(--surface-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Excel & Search Action Bar */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--surface-border)]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)]" />
                <input
                  type="text"
                  placeholder="Тоот, давхар эсвэл нэрээр хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[color:var(--surface-border)] bg-white text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-warning"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Unified Single Excel Dropdown Button */}
                <div ref={excelMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setExcelMenuOpen((prev) => !prev)}
                    className="px-3 py-1.5 text-xs text-brand bg-theme/10 hover:bg-theme/20 !rounded-xl transition-colors flex items-center gap-1.5 border border-theme/30 shadow-xs cursor-pointer"
                    style={{ borderRadius: "0.75rem" }}
                    title="Excel үйлдлүүд"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-brand" />
                    <span>Excel</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${excelMenuOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {excelMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 z-50 min-w-[170px] dropdown-menu-surface !rounded-2xl shadow-2xl border border-[color:var(--surface-border)] p-1.5 overflow-hidden"
                      style={{
                        backgroundColor: "var(--surface-bg, #ffffff)",
                        borderRadius: "1rem",
                        boxShadow:
                           "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setExcelMenuOpen(false);
                          handleExportToExcel();
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-[color:var(--panel-text)] hover:!bg-theme/10 hover:!text-brand dark:hover:!text-brand !rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        style={{ borderRadius: "0.75rem" }}
                      >
                        <Download className="w-4 h-4 text-brand shrink-0" />
                        <span>Excel татах</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExcelMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-[color:var(--panel-text)] hover:!bg-theme/10 hover:!text-brand dark:hover:!text-brand !rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer mt-0.5"
                        style={{ borderRadius: "0.75rem" }}
                      >
                        <Upload className="w-4 h-4 text-brand shrink-0" />
                        <span>Excel оруулах</span>
                      </button>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleExcelImport}
                />

                <div className="h-4 w-px bg-[color:var(--panel)] mx-0.5" />

                <div className="flex items-center gap-1.5">
                  <div className="relative w-28 md:w-32">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Ижил кВт"
                      value={bulkInputValue}
                      onChange={(e) => setBulkInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyBulkValue();
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[color:var(--surface-border)] bg-white text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-warning"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBulkValue}
                    className="px-3 py-1.5 text-xs text-warning bg-warning/10 hover:bg-warning/20 rounded-xl border border-warning/20 transition-colors cursor-pointer"
                    title="Бүх тоотод ижил утга оруулах"
                  >
                    <span>Бүгдэд</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Resident List Table with Sticky Header and solid background */}
            <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[50vh] border border-[color:var(--surface-border)] rounded-xl relative my-2 bg-white">
              {fetching ? (
                <div className="flex items-center justify-center h-48 text-[color:var(--muted-text)] gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-warning" />
                  <span>Уншиж байна...</span>
                </div>
              ) : filteredResidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[color:var(--muted-text)]">
                  <p>Орон сууцны тоот олдсонгүй.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-separate border-spacing-0 table-fixed">
                  <thead className="sticky top-0 z-20 shadow-xs">
                    <tr>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-[color:var(--panel-text)] text-center w-[6%] border-b border-[color:var(--surface-border)] first:rounded-tl-xl"
                      >
                        №
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-[color:var(--panel-text)] text-left w-[24%] border-b border-[color:var(--surface-border)]"
                      >
                        Нэр
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-[color:var(--panel-text)] text-center w-[12%] border-b border-[color:var(--surface-border)]"
                      >
                        Тоот
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-[color:var(--panel-text)] text-center w-[10%] border-b border-[color:var(--surface-border)]"
                      >
                        Давхар
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-[color:var(--panel-text)] text-center w-[16%] border-b border-[color:var(--surface-border)]"
                      >
                        Дугаар
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-[color:var(--panel-text)] text-right w-[16%] border-b border-[color:var(--surface-border)]"
                      >
                        Одоогийн кВт
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-[color:var(--panel-text)] text-center w-[16%] border-b border-[color:var(--surface-border)] last:rounded-tr-xl"
                      >
                        Шинэ кВт заалт
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredResidents.map((r, index) => (
                      <tr
                        key={r._id}
                        className="hover:bg-warning/5 transition-colors"
                      >
                        <td className="py-2 px-3 text-center text-[color:var(--muted-text)] font-mono text-[11px] border-b border-[color:var(--surface-border)]">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 text-left border-b border-[color:var(--surface-border)] truncate">
                          <span className="text-[color:var(--panel-text)] dark:text-white">
                            {r.ner}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-[color:var(--panel-text)] dark:text-white border-b border-[color:var(--surface-border)] truncate">
                          {r.toot}
                        </td>
                        <td className="py-2 px-3 text-center text-[color:var(--muted-text)] border-b border-[color:var(--surface-border)] truncate">
                          {r.davkhar || "-"}
                        </td>
                        <td className="py-2 px-3 text-center text-[color:var(--muted-text)] font-mono text-xs border-b border-[color:var(--surface-border)] whitespace-nowrap">
                          {r.utas || "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-[color:var(--muted-text)] font-mono border-b border-[color:var(--surface-border)] whitespace-nowrap">
                          {r.currentKwt} кВт
                        </td>
                        <td className="py-2 px-3 text-center border-b border-[color:var(--surface-border)]">
                          <div className="relative inline-block w-full max-w-[120px]">
                            <input
                              data-kwt-index={index}
                              type="number"
                              step="any"
                              min="0"
                              value={r.newKwt}
                              onChange={(e) => handleKwtChange(r._id, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              placeholder="0"
                              className="w-full px-2.5 py-1 text-center text-xs rounded-lg border border-[color:var(--surface-border)] bg-white text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-theme"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[color:var(--surface-border)] mt-2">
              <span className="text-xs text-[color:var(--muted-text)]">
                Нийт: {filteredResidents.length} тоот
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] rounded-xl transition-colors cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || fetching}
                  className="px-5 py-2 text-xs !text-white bg-theme hover:bg-theme active:bg-theme !rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  style={{ color: "#ffffff", borderRadius: "0.75rem" }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span className="!text-white" style={{ color: "#ffffff" }}>
                    Хадгалах
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
