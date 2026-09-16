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
import {
  getResidentField,
  getResidentToots,
  getResidentDavkhauraud,
  getResidentOrtsuud,
} from "@/lib/residentDataHelper";
import { toast } from "sonner";

interface ResidentUnitRow {
  _id: string;
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

  // Fetch residents when modal opens
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
      const res = await uilchilgee(token).get("/orshinSuugch", {
        params: {
          baiguullagiinId,
          barilgiinId: barilgiinId || undefined,
          khuudasniiKhemjee: 2000,
        },
      });

      const rawList = Array.isArray(res.data?.jagsaalt)
        ? res.data.jagsaalt
        : Array.isArray(res.data?.list)
          ? res.data.list
          : Array.isArray(res.data)
            ? res.data
            : [];

      const parsedRows: ResidentUnitRow[] = rawList.map((item: any) => {
        const cur = parseFloat(item.tsahilgaaniiZaalt) || 0;
        const tootVal =
          getResidentToots(item) ||
          getResidentField(item, "toot") ||
          item.toot ||
          "-";
        const davkharVal =
          getResidentDavkhauraud(item) ||
          getResidentField(item, "davkhar") ||
          item.davkhar ||
          "";
        const ortsVal =
          getResidentOrtsuud(item) ||
          getResidentField(item, "orts") ||
          item.orts ||
          "";
        const phoneVal =
          item.utas || item.utas1 || item.utas2 || item.utasnuud || "";

        return {
          _id: String(item._id),
          toot: String(tootVal).trim(),
          davkhar: davkharVal ? String(davkharVal).trim() : "",
          orts: ortsVal ? String(ortsVal).trim() : "",
          ner: item.ner || "Нэргүй",
          ovog: item.ovog || "",
          utas: phoneVal ? String(phoneVal).trim() : "",
          currentKwt: cur,
          newKwt: cur > 0 ? String(cur) : "",
        };
      });

      // Sort by Toot numerically/alphabetically
      parsedRows.sort((a, b) =>
        a.toot.localeCompare(b.toot, undefined, { numeric: true, sensitivity: "base" })
      );

      setResidents(parsedRows);
    } catch (err: any) {
      toast.error("Оршин суугчдын мэдээлэл татахад алдаа гарлаа");
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

  // Apply same kWt to all residents
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
    toast.success(`Бүх оршин суугчдад ${num} кВт утга тохирууллаа.`);
  };

  // Export Resident list with current kWt to Excel sheet
  const handleExportToExcel = async () => {
    if (residents.length === 0) {
      toast.error("Татах оршин суугчийн мэдээлэл байхгүй байна.");
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
    XLSX.writeFile(workbook, `Оршин_суугчдын_кВт_заалт.xlsx`);
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
            const matchedRow = rows.find(
              (row) =>
                String(row["Тоот"] || "").trim() === String(r.toot).trim() ||
                (row["Нэр"] && String(row["Нэр"]).trim() === String(r.ner).trim())
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
        orshinSuugchId: r._id,
        toot: r.toot,
        kwt: parseFloat(r.newKwt),
      }));

    if (unitsToUpdate.length === 0) {
      toast.error("Шинэчлэх кВт заалттай нэг ч оршин суугч олдсонгүй.");
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
          `${res.data.updatedCount || unitsToUpdate.length} оршин суугчийн кВт заалт амжилттай шинэчлэгдлээ.`
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
              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 cursor-move select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">

                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                    Цахилгааны (кВт) заалт шинэчлэх
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Оршин суугч бүрийн заалтыг гараар оруулах эсвэл Excel-ээр уншуулах
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Excel & Search Action Bar */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Тоот, давхар эсвэл нэрээр хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Unified Single Excel Dropdown Button */}
                <div ref={excelMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setExcelMenuOpen((prev) => !prev)}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 !rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-500/30 shadow-xs cursor-pointer"
                    style={{ borderRadius: "0.75rem" }}
                    title="Excel үйлдлүүд"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Excel</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${excelMenuOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {excelMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 z-50 min-w-[170px] dropdown-menu-surface !rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/80 p-1.5 overflow-hidden"
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
                        className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hover:!bg-emerald-500/10 hover:!text-emerald-700 dark:hover:!text-emerald-400 !rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        style={{ borderRadius: "0.75rem" }}
                      >
                        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Excel татах</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExcelMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hover:!bg-blue-500/10 hover:!text-blue-700 dark:hover:!text-blue-400 !rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer mt-0.5"
                        style={{ borderRadius: "0.75rem" }}
                      >
                        <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
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

                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5" />

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
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBulkValue}
                    className="px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/20 transition-colors cursor-pointer"
                    title="Бүх оршин суугчид ижил утга оруулах"
                  >
                    <span>Бүгдэд</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Resident List Table with Sticky Header and solid background */}
            <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[50vh] border border-gray-200 dark:border-gray-700 rounded-xl relative my-2 bg-white dark:bg-gray-900/40">
              {fetching ? (
                <div className="flex items-center justify-center h-48 text-gray-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                  <span>Уншиж байна...</span>
                </div>
              ) : filteredResidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <p>Оршин суугч олдсонгүй.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-separate border-spacing-0 table-fixed">
                  <thead className="sticky top-0 z-20 shadow-xs">
                    <tr>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-gray-700 dark:text-gray-200 font-semibold text-center w-[6%] border-b border-gray-200 dark:border-gray-700 first:rounded-tl-xl"
                      >
                        №
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-gray-700 dark:text-gray-200 font-semibold text-left w-[24%] border-b border-gray-200 dark:border-gray-700"
                      >
                        Нэр
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-gray-700 dark:text-gray-200 font-semibold text-center w-[12%] border-b border-gray-200 dark:border-gray-700"
                      >
                        Тоот
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-gray-700 dark:text-gray-200 font-semibold text-center w-[10%] border-b border-gray-200 dark:border-gray-700"
                      >
                        Давхар
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-gray-700 dark:text-gray-200 font-semibold text-center w-[16%] border-b border-gray-200 dark:border-gray-700"
                      >
                        Дугаар
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-gray-700 dark:text-gray-200 font-semibold text-right w-[16%] border-b border-gray-200 dark:border-gray-700"
                      >
                        Одоогийн кВт
                      </th>
                      <th
                        style={{ backgroundColor: "var(--surface-bg, #f1f5f9)" }}
                        className="py-2.5 px-3 sticky top-0 z-20 text-gray-700 dark:text-gray-200 font-semibold text-right w-[16%] border-b border-gray-200 dark:border-gray-700 last:rounded-tr-xl"
                      >
                        Шинэ кВт заалт
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900/50">
                    {filteredResidents.map((r, index) => (
                      <tr
                        key={r._id}
                        className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors"
                      >
                        <td className="py-2 px-3 text-center text-gray-400 dark:text-gray-500 font-mono text-[11px] border-b border-gray-100 dark:border-gray-800">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 text-left border-b border-gray-100 dark:border-gray-800 truncate">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {r.ner}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 truncate">
                          {r.toot}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 truncate">
                          {r.davkhar || "-"}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-300 font-mono text-xs border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">
                          {r.utas || "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-mono border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">
                          {r.currentKwt} кВт
                        </td>
                        <td className="py-2 px-3 text-right border-b border-gray-100 dark:border-gray-800">
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
                              className="w-full px-2.5 py-1 text-right text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Нийт: {filteredResidents.length} оршин суугч
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || fetching}
                  className="px-5 py-2 text-xs font-medium !text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 !rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  style={{ color: "#ffffff", borderRadius: "0.75rem" }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span className="!text-white font-medium" style={{ color: "#ffffff" }}>
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
