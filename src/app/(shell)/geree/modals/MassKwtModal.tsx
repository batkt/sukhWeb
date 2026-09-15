"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import {
  Zap,
  Loader2,
  X,
  Search,
  Save,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Upload,
  ChevronDown,
} from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { getResidentField } from "@/lib/residentDataHelper";
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
        const tootVal = getResidentField(item, "toot") ?? item.toot;
        const davkharVal = getResidentField(item, "davkhar") ?? item.davkhar;
        const ortsVal = getResidentField(item, "orts") ?? item.orts;

        return {
          _id: String(item._id),
          toot: tootVal ? String(tootVal).trim() : "-",
          davkhar: davkharVal ? String(davkharVal).trim() : "",
          orts: ortsVal ? String(ortsVal).trim() : "",
          ner: item.ner || "Нэргүй",
          ovog: item.ovog || "",
          utas: item.utas || "",
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

  // Export Resident list with current kWt to Excel sheet
  const handleExportToExcel = async () => {
    if (residents.length === 0) {
      toast.error("Татах оршин суугчийн мэдээлэл байхгүй байна.");
      return;
    }

    const XLSX = await import("xlsx");

    const exportRows = residents.map((r, index) => ({
      "№": index + 1,
      "Тоот": r.toot || "",
      "Давхар": r.davkhar || "",
      "Нэр": r.ner || "",
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
            className="w-full max-w-4xl max-h-[88vh] flex flex-col modal-surface rounded-2xl shadow-2xl p-6 text-sm relative"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 cursor-move select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <Zap className="w-6 h-6" />
                </div>
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
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-500/20 shadow-xs"
                    title="Excel үйлдлүүд"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Excel</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        excelMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {excelMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[170px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setExcelMenuOpen(false);
                          handleExportToExcel();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Excel татах</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExcelMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-gray-700/50"
                      >
                        <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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

                <button
                  type="button"
                  onClick={loadResidents}
                  disabled={fetching}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  title="Дахин ачаалах"
                >
                  <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Resident List Table with Sticky Header and solid background */}
            <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[48vh] border border-gray-200 dark:border-gray-700 rounded-xl relative my-2">
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
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20 shadow-xs">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2.5 px-3 sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-center w-12 border-b border-gray-200 dark:border-gray-700">
                        №
                      </th>
                      <th className="py-2.5 px-3 sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold w-24 border-b border-gray-200 dark:border-gray-700">
                        Тоот
                      </th>
                      <th className="py-2.5 px-3 sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-center w-20 border-b border-gray-200 dark:border-gray-700">
                        Давхар
                      </th>
                      <th className="py-2.5 px-3 sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                        Нэр / Овог
                      </th>
                      <th className="py-2.5 px-3 sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold w-28 border-b border-gray-200 dark:border-gray-700">
                        Дугаар
                      </th>
                      <th className="py-2.5 px-3 sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-right w-28 border-b border-gray-200 dark:border-gray-700">
                        Одоогийн кВт
                      </th>
                      <th className="py-2.5 px-3 sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-right w-36 border-b border-gray-200 dark:border-gray-700">
                        Шинэ кВт заалт
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900/50">
                    {filteredResidents.map((r, index) => (
                      <tr
                        key={r._id}
                        className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center text-gray-400 dark:text-gray-500 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                          {r.toot}
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-600 dark:text-gray-300">
                          {r.davkhar || "-"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {r.ner}
                          </span>
                          {r.ovog && (
                            <span className="text-gray-400 ml-1 text-[11px]">
                              ({r.ovog})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300 font-mono">
                          {r.utas || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                          {r.currentKwt} кВт
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="relative inline-block w-28">
                            <input
                              data-kwt-index={index}
                              type="number"
                              step="any"
                              min="0"
                              value={r.newKwt}
                              onChange={(e) => handleKwtChange(r._id, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              placeholder="0"
                              className="w-full px-2.5 py-1 text-right text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || fetching}
                  className="px-5 py-2 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Хадгалах</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
