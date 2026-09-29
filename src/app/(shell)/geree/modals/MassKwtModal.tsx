"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import {
  Zap,
  Loader2,
  X,
  Search,
  Download,
  Upload,
  ChevronDown,
} from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { toast } from "sonner";
import ExcelButton from "@/components/ui/ExcelButton";

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
  /**
   * «Зөвхөн оруулаагүй» шүүлт. Асаах үеийн оруулаагүй мөрүүдийн агшин зураг —
   * бичиж эхлэнгүүт мөр алга болж, курсор үсрэхээс сэргийлнэ.
   */
  const [dutuuIdnuud, setDutuuIdnuud] = useState<Set<string> | null>(null);
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
    const suuri = dutuuIdnuud ? residents.filter((r) => dutuuIdnuud.has(r._id)) : residents;
    if (!searchTerm.trim()) return suuri;
    const term = searchTerm.toLowerCase().trim();
    return suuri.filter(
      (r) =>
        r.toot.toLowerCase().includes(term) ||
        (r.davkhar && r.davkhar.toLowerCase().includes(term)) ||
        r.ner.toLowerCase().includes(term) ||
        (r.ovog && r.ovog.toLowerCase().includes(term)) ||
        (r.utas && r.utas.includes(term))
    );
  }, [residents, searchTerm, dutuuIdnuud]);

  // Footer summary — same "filled" rule as handleSubmit
  const summary = useMemo(() => {
    let filled = 0;
    let totalKwt = 0;
    residents.forEach((r) => {
      if (r.newKwt !== "" && !isNaN(parseFloat(r.newKwt))) {
        filled++;
        totalKwt += parseFloat(r.newKwt);
      }
    });
    return { filled, missing: residents.length - filled, totalKwt };
  }, [residents]);

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
            className="w-full max-h-[92vh] flex flex-col overflow-hidden modal-surface rounded-2xl shadow-2xl text-sm relative"
            style={{ maxWidth: 880, width: "100%" }}
          >
            {/* Толгой — нягт: дүрс, гарчиг, товч тайлбар, хаах */}
            <div
              className="flex items-center justify-between gap-3 border-b border-[color:var(--surface-border)] px-5 py-3.5 cursor-move select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Zap className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-tight text-[color:var(--panel-text)]">
                    Цахилгааны заалт оруулах
                  </h3>
                  
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={loading}
                title="Хаах"
                aria-label="Хаах"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)] disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Хайх · Зөвхөн оруулаагүй · Бүгдэд ижил заалт · Excel — НЭГ мөр, ижил 40px өндөр */}
            <div className="px-5 py-2.5 flex flex-wrap items-center gap-2 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/40">
              <label className="relative min-w-[220px] flex-1">
                <span className="sr-only">Хайх</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[color:var(--muted-text)]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Тоот, давхар, нэр эсвэл утасаар хайх"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="stg-input !h-10 !pl-9 !text-sm"
                />
              </label>

              

              <div className="flex flex-wrap items-center gap-2">
                {/* Бүгдэд ижил заалт — нэг бүлэг (утга + товч) */}
                <div className="flex h-10 items-stretch overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] focus-within:border-theme/60">
                  <span className="flex items-center border-r border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-3 text-[13px] text-[color:var(--muted-text)] whitespace-nowrap">
                    Бүгдэд
                  </span>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      inputMode="decimal"
                      placeholder="0"
                      aria-label="Бүх тоотод оруулах кВт заалт"
                      value={bulkInputValue}
                      onChange={(e) => setBulkInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyBulkValue();
                        }
                      }}
                      className="h-full w-full bg-transparent pl-3 pr-10 text-right text-sm tabular-nums outline-none text-[color:var(--panel-text)]"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[color:var(--muted-text)]">
                      кВт
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBulkValue}
                    disabled={!bulkInputValue.trim()}
                    className="border-l border-[color:var(--surface-border)] px-3 text-sm font-medium text-brand transition-colors hover:bg-theme/10 disabled:cursor-not-allowed disabled:text-[color:var(--muted-text)] disabled:hover:bg-transparent"
                    title="Энэ утгыг бүх тоотод оруулах"
                  >
                    Оруулах
                  </button>
                </div>

                {/* Excel dropdown */}
                <div ref={excelMenuRef} className="relative">
                  <ExcelButton
                    label="Excel"
                    title="Excel файлаар татах / оруулах"
                    onClick={() => setExcelMenuOpen((prev) => !prev)}
                    suffix={
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${excelMenuOpen ? "rotate-180" : ""}`}
                      />
                    }
                  />

                  {excelMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1.5 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setExcelMenuOpen(false);
                          handleExportToExcel();
                        }}
                        className="w-full min-h-10 px-3 py-2 text-left text-sm text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                        <span>Excel татах</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExcelMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full min-h-10 px-3 py-2 text-left text-sm text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer mt-0.5"
                      >
                        <Upload className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                        <span>Excel-ээс заалт оруулах</span>
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
              </div>
            </div>

            {/* Жагсаалт — хүрээгүй, бүтэн өргөнтэй, нягт мөр */}
            <div className="flex-1 min-h-[240px] overflow-y-auto custom-scrollbar">
              {fetching ? (
                <div className="flex items-center justify-center h-48 text-sm text-[color:var(--muted-text)] gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-brand" aria-hidden="true" />
                  <span>Тоотын мэдээллийг ачаалж байна…</span>
                </div>
              ) : filteredResidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 h-48 px-4 text-center">
                  <p className="text-sm text-[color:var(--panel-text)]">
                    {searchTerm.trim() || dutuuIdnuud
                      ? "Тохирох тоот олдсонгүй."
                      : "Орон сууцны тоот олдсонгүй."}
                  </p>
                  <p className="text-[12px] text-[color:var(--muted-text)]">
                    {searchTerm.trim() || dutuuIdnuud
                      ? "Хайлт эсвэл шүүлтээ өөрчилнө үү."
                      : "Энэ барилгад идэвхтэй гэрээтэй эсвэл бүртгэлтэй тоот алга байна."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-[13px] border-separate border-spacing-0 table-fixed">
                  <thead>
                    <tr className="text-[12px] text-[color:var(--muted-text)]">
                      {[
                        { t: "№", c: "w-12 text-right" },
                        { t: "Тоот", c: "w-24" },
                        { t: "Эзэмшигч", c: "" },
                        { t: "Давхар", c: "w-20" },
                        { t: "Өмнөх", c: "w-28 text-right" },
                        { t: "Шинэ заалт", c: "w-40 text-right" },
                        { t: "Зөрүү", c: "w-28 text-right pr-5" },
                      ].map((h) => (
                        <th
                          key={h.t}
                          className={`sticky top-0 z-20 h-9 px-3 font-medium border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] ${h.c}`}
                        >
                          {h.t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((r, index) => {
                      const isMissing = r.newKwt === "" || isNaN(parseFloat(r.newKwt));
                      const zoruu = isMissing ? null : parseFloat(r.newKwt) - (Number(r.currentKwt) || 0);
                      return (
                        <tr
                          key={r._id}
                          className="group h-10 transition-colors hover:bg-[color:var(--surface-hover)]"
                        >
                          <td
                            className={`px-3 text-right tabular-nums text-[12px] text-[color:var(--muted-text)] border-b border-[color:var(--surface-border)] ${
                              isMissing ? "border-l-[3px] border-l-warning" : "border-l-[3px] border-l-transparent"
                            }`}
                          >
                            {index + 1}
                          </td>
                          <td className="px-3 font-semibold tabular-nums text-[color:var(--panel-text)] border-b border-[color:var(--surface-border)] truncate">
                            {r.toot}
                          </td>
                          <td className="px-3 border-b border-[color:var(--surface-border)] truncate" title={r.ner}>
                            <span className="text-[color:var(--panel-text)]">{r.ner}</span>
                            {r.utas && (
                              <span className="ml-2 tabular-nums text-[12px] text-[color:var(--muted-text)]">{r.utas}</span>
                            )}
                          </td>
                          <td className="px-3 text-[color:var(--muted-text)] border-b border-[color:var(--surface-border)] truncate">
                            {r.davkhar || "—"}
                          </td>
                          <td className="px-3 text-right tabular-nums text-[color:var(--muted-text)] border-b border-[color:var(--surface-border)] whitespace-nowrap">
                            {Number(r.currentKwt || 0).toLocaleString("mn-MN")}
                          </td>
                          <td className="px-3 py-1 text-right border-b border-[color:var(--surface-border)]">
                            <div className="relative ml-auto w-full max-w-[132px]">
                              <input
                                data-kwt-index={index}
                                type="number"
                                step="any"
                                min="0"
                                inputMode="decimal"
                                value={r.newKwt}
                                onChange={(e) => handleKwtChange(r._id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onFocus={(e) => e.currentTarget.select()}
                                placeholder="—"
                                aria-label={`${r.toot} тоотын шинэ кВт заалт`}
                                aria-invalid={isMissing || undefined}
                                className={`h-8 w-full rounded-lg border bg-[color:var(--surface-bg)] pl-2 pr-10 text-right text-[13px] tabular-nums text-[color:var(--panel-text)] outline-none transition-colors placeholder:text-[color:var(--muted-text)] focus:border-theme focus:ring-2 focus:ring-theme/15 ${
                                  isMissing ? "border-warning/50" : "border-[color:var(--surface-border)]"
                                }`}
                              />
                              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--muted-text)]">
                                кВт
                              </span>
                            </div>
                          </td>
                          <td className="px-3 pr-5 text-right tabular-nums border-b border-[color:var(--surface-border)] whitespace-nowrap">
                            {zoruu === null ? (
                              <span className="text-[color:var(--muted-text)]">—</span>
                            ) : zoruu < 0 ? (
                              // Өмнөхөөсөө бага — шалгах шаардлагатай
                              <span className="text-danger" title="Шинэ заалт өмнөхөөсөө бага байна">
                                {zoruu.toLocaleString("mn-MN")}
                              </span>
                            ) : (
                              <span className="text-[color:var(--panel-text)]">
                                +{zoruu.toLocaleString("mn-MN")}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Хөл — явцын мөр + үйлдэл */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--surface-border)] px-5 py-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[color:var(--muted-text)]">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--surface-hover)]" aria-hidden="true">
                    <span
                      className="block h-full rounded-full bg-theme transition-all"
                      style={{ width: `${residents.length ? Math.round((summary.filled / residents.length) * 100) : 0}%` }}
                    />
                  </span>
                  <span>
                    <span className="tabular-nums font-medium text-[color:var(--panel-text)]">
                      {summary.filled}/{residents.length}
                    </span>{" "}
                    оруулсан
                  </span>
                </span>
                {summary.missing > 0 && (
                  <span className="text-warning tabular-nums">{summary.missing} дутуу</span>
                )}
                <span>
                  Нийт{" "}
                  <span className="tabular-nums font-medium text-[color:var(--panel-text)]">
                    {summary.totalKwt.toLocaleString("mn-MN")}
                  </span>{" "}
                  кВт
                </span>
                {(searchTerm.trim() || dutuuIdnuud) && (
                  <span>
                    Харагдаж буй <span className="tabular-nums">{filteredResidents.length}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="stg-btn stg-btn-ghost !h-9 !text-[13px]"
                >
                  Болих
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || fetching}
                  className="stg-btn stg-btn-primary !h-9 !px-5 !text-[13px]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>{loading ? "Хадгалж байна…" : "Хадгалах"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
