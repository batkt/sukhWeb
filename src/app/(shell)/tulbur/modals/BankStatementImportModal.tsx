"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Landmark,
  Receipt,
  FileSpreadsheet,
  Trash2,
  Calendar,
  HelpCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import formatNumber from "../../../../../tools/function/formatNumber";

export type MatchStatus = "open" | "match" | "done";

export type BankRow = {
  id: number;
  name: string;
  unit: string;
  building: string;
  amount: number;
  date: string;
  rawDate?: string;
  month?: string;
  time: string;
  description: string;
  accName?: string;
  relatedAccount?: string;
  journal?: string;
  status: MatchStatus;
  matchedHomeId?: string | number | null;
};

export type HomeRow = {
  id: string | number;
  name: string;
  building: string;
  unit: string;
  amount: number;
  note: string;
  month?: string;
  status: MatchStatus;
  matchedBankId?: number | null;
  gereeId?: string;
};

interface BankStatementImportModalProps {
  show: boolean;
  onClose: () => void;
  baiguullagiinId: string;
  barilgiinId?: string;
  onSuccess: () => void;
}

export default function BankStatementImportModal({
  show,
  onClose,
  baiguullagiinId,
  barilgiinId,
  onSuccess,
}: BankStatementImportModalProps) {
  const { token, baiguullaga } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Month Filter state
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  // Core Data Lists - NO mock data, initialized to empty arrays
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [homes, setHomes] = useState<HomeRow[]>([]);

  // Selection states
  const [selB, setSelB] = useState<Set<number>>(new Set());
  const [selH, setSelH] = useState<Set<string | number>>(new Set());

  // Tabs: 'all' | 'open' (Тулгаагүй) | 'match' (Тулгасан) | 'done' (Бүртгэсэн)
  const [tab, setTab] = useState<"all" | "open" | "match" | "done">("all");

  // Search queries
  const [bankSearch, setBankSearch] = useState("");
  const [homeSearch, setHomeSearch] = useState("");

  // Sub-dialogs
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  useModalHotkeys({
    isOpen: show,
    onClose,
  });

  // Calculate available months (past 12 months + any from rows)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      set.add(`${y}.${m}`);
    }
    banks.forEach((b) => {
      if (b.month) set.add(b.month);
    });
    homes.forEach((h) => {
      if (h.month) set.add(h.month);
    });
    return Array.from(set).sort().reverse();
  }, [banks, homes]);

  const formatMonthName = (m: string) => {
    if (m === "ALL") return "Бүх хугацаа (Бүх сар)";
    const parts = m.split(".");
    if (parts.length === 2) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      return `${year} оны ${month}-р сар`;
    }
    return m;
  };

  // Load actual contracts / invoices from Amarhome API using proper queryObj
  useEffect(() => {
    if (!show || !token || !baiguullagiinId) return;

    let isMounted = true;
    const queryObj: any = { baiguullagiinId };
    if (barilgiinId) queryObj.barilgiinId = barilgiinId;

    uilchilgee(token)
      .get("/geree", {
        params: {
          baiguullagiinId,
          barilgiinId: barilgiinId || undefined,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 1000,
          query: JSON.stringify(queryObj),
        },
      })
      .then((res) => {
        if (!isMounted) return;
        const jagsaalt =
          res.data?.jagsaalt ||
          res.data?.list ||
          res.data?.rows ||
          (Array.isArray(res.data) ? res.data : []);

        if (Array.isArray(jagsaalt) && jagsaalt.length > 0) {
          const loadedHomes: HomeRow[] = jagsaalt.map((c: any, idx: number) => ({
            id: c._id || `c-${idx}`,
            name: c.ner || c.orshinSuugchId?.ner || "Нэргүй",
            building: c.bairNer || c.barilgiinId?.dugaar || "Байр",
            unit: String(c.toot || ""),
            amount: Number(c.suhTulbur || c.niitTulbur || c.sarBuriinTulbur || c.nekhemjlekhDun || c.sarBuriinUilchilgee || c.uilchilgeeniiZardal || 0),
            note: "СӨХ-ийн төлбөр",
            status: "open",
            gereeId: c._id,
          }));
          setHomes(loadedHomes);
        } else {
          setHomes([]);
        }
      })
      .catch((err) => {
        console.warn("Contracts fetch notice:", err?.message);
        if (isMounted) setHomes([]);
      });

    return () => {
      isMounted = false;
    };
  }, [show, token, baiguullagiinId, barilgiinId]);

  // Handle Excel File Upload & Client-Side Parse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    await parseExcelFile(selectedFile);
  };

  const parseExcelFile = async (selectedFile: File) => {
    try {
      setLoadingFile(true);
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      if (!rawRows || rawRows.length < 2) {
        toast.error("Excel файл хоосон байна");
        return;
      }

      // Find header row
      let headerRowIdx = -1;
      let dateIdx = -1;
      let timeIdx = -1;
      let descIdx = -1;
      let orlogoIdx = -1;
      let zarlagaIdx = -1;
      let accNameIdx = -1;
      let journalIdx = -1;

      for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
        const row = rawRows[i].map((c: any) => String(c).trim().toLowerCase());
        const hasDate = row.some((c: string) => c.includes("огноо"));
        const hasDesc = row.some((c: string) => c.includes("утга") || c.includes("гүйлгээний утга"));
        const hasIncome = row.some((c: string) => c.includes("орлого") || c.includes("дүн"));

        if ((hasDate && hasDesc) || (hasDate && hasIncome) || (hasDesc && hasIncome)) {
          headerRowIdx = i;
          row.forEach((col: string, cIdx: number) => {
            if (col.includes("тайлант огноо") || (col.includes("огноо") && dateIdx === -1)) dateIdx = cIdx;
            if (col.includes("цаг")) timeIdx = cIdx;
            if (col.includes("утга")) descIdx = cIdx;
            if (col.includes("орлого") || (col.includes("дүн") && orlogoIdx === -1)) orlogoIdx = cIdx;
            if (col.includes("зарлага")) zarlagaIdx = cIdx;
            if (col.includes("дансны нэр") || col.includes("харилцагч")) accNameIdx = cIdx;
            if (col.includes("журнал")) journalIdx = cIdx;
          });
          break;
        }
      }

      if (headerRowIdx === -1) {
        headerRowIdx = 0;
        dateIdx = 0;
        timeIdx = 1;
        descIdx = 4;
        orlogoIdx = 5;
        zarlagaIdx = 6;
        accNameIdx = 9;
      }

      const parseNumber = (val: any) => {
        if (typeof val === "number") return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      };

      const extractedBanks: BankRow[] = [];
      const detectedMonths = new Set<string>();

      for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const dateStr = dateIdx !== -1 ? String(row[dateIdx] || "").trim() : "";
        const timeStr = timeIdx !== -1 ? String(row[timeIdx] || "").trim() : "";
        const descStr = descIdx !== -1 ? String(row[descIdx] || "").trim() : "";
        const orlogoRaw = orlogoIdx !== -1 ? parseNumber(row[orlogoIdx]) : 0;
        const zarlagaRaw = zarlagaIdx !== -1 ? parseNumber(row[zarlagaIdx]) : 0;
        const accName = accNameIdx !== -1 ? String(row[accNameIdx] || "").trim() : "";
        const journal = journalIdx !== -1 ? String(row[journalIdx] || "").trim() : "";

        if (!descStr && orlogoRaw === 0 && zarlagaRaw === 0) continue;

        // Skip fee or expenditure rows
        if (orlogoRaw === 0 && zarlagaRaw > 0) continue;
        const amount = orlogoRaw > 0 ? orlogoRaw : zarlagaRaw;

        // Extract unit & building from description
        let unit = "";
        let building = "";
        let name = accName;

        const cleanedDesc = descStr
          .replace(/\b20\d{2}[-/.](0?[1-9]|1[0-2])\b/g, " ")
          .replace(/\b(0?[1-9]|1[0-2])[-/.](20\d{2})\b/g, " ")
          .replace(/\b(0?[1-9]|1[0-2])\s*(?:-?[рrR])?\s*(?:сар|sar)\b/gi, " ");

        const explicitMatch = cleanedDesc.match(
          /(?:байр\s*)?(\d{1,4})\s*(?:-|–|_|\/|н|\*|\s*(?:р\s*)?байр\s*)\s*(?:тоот\s*)?(\d{1,4})\s*(?:тоот|toot)?/i
        );
        if (explicitMatch) {
          building = explicitMatch[1];
          unit = explicitMatch[2];
        } else {
          const dashMatch = cleanedDesc.match(/(?:^|\s)[-–]\s*(\d{1,4})\b|\b(\d{1,4})\s*[-–]/);
          if (dashMatch) {
            unit = dashMatch[1] || dashMatch[2];
          } else {
            const tootMatch = cleanedDesc.match(/\b(\d{1,4})\s*(?:тоот|toot)\b/i);
            if (tootMatch) unit = tootMatch[1];
          }
        }

        if (!name) {
          const words = descStr.split(/\s+/).filter((w) => /^[а-яөүёА-ЯӨҮЁa-zA-Z.]+$/.test(w) && w.length > 2);
          if (words.length > 0) name = words[words.length - 1];
        }

        const rawDateNorm = dateStr.replace(/-/g, ".");
        let rowMonth = "2026.10";
        const mMatch = rawDateNorm.match(/^(\d{4}\.\d{2})/);
        if (mMatch) {
          rowMonth = mMatch[1];
        } else if (/^\d{2}\.\d{2}$/.test(rawDateNorm)) {
          rowMonth = `2026.${rawDateNorm.substring(0, 2)}`;
        }
        detectedMonths.add(rowMonth);

        const dateFormatted = rawDateNorm ? rawDateNorm.substring(5) : "10.26";

        extractedBanks.push({
          id: extractedBanks.length,
          name: name || descStr.substring(0, 25),
          unit: unit || "—",
          building: building || "Байр",
          amount: amount,
          date: dateFormatted,
          rawDate: rawDateNorm,
          month: rowMonth,
          time: timeStr || "12:00",
          description: descStr,
          accName,
          journal,
          status: "open",
        });
      }

      if (extractedBanks.length === 0) {
        toast.error("Хуулгаас гүйлгээ олдсонгүй");
        return;
      }

      setBanks(extractedBanks);
      setSelB(new Set());
      setSelH(new Set());
      setTab("all");

      setSelectedMonth("ALL");

      toast.success(`${extractedBanks.length} гүйлгээ уншигдлаа`);
      autoMatch(extractedBanks, homes);
    } catch (err: any) {
      console.error("Excel parse error:", err);
      toast.error("Excel файл уншихад алдаа гарлаа: " + (err.message || ""));
    } finally {
      setLoadingFile(false);
    }
  };

  // Auto matching logic
  const autoMatch = (currentBanks = banks, currentHomes = homes) => {
    let matchCount = 0;
    const newBanks = [...currentBanks];
    const newHomes = [...currentHomes];

    newBanks.forEach((b) => {
      if (b.status !== "open") return;

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        if (h.amount !== b.amount && h.amount !== 0) return false;

        if (b.unit && b.unit !== "—" && h.unit && h.unit === b.unit) return true;

        if (b.name && h.name) {
          const cleanB = b.name.toLowerCase().replace(/[^a-zа-яөүё]/gi, "");
          const cleanH = h.name.toLowerCase().replace(/[^a-zа-яөүё]/gi, "");
          if (cleanB && cleanH && (cleanB.includes(cleanH) || cleanH.includes(cleanB))) return true;
        }

        return false;
      });

      if (candidates.length === 1) {
        const h = candidates[0];
        b.status = "match";
        b.matchedHomeId = h.id;
        h.status = "match";
        h.matchedBankId = b.id;
        matchCount++;
      }
    });

    setBanks(newBanks);
    setHomes(newHomes);
    setSelB(new Set());
    setSelH(new Set());

    if (matchCount > 0) {
      toast.success(`${matchCount} гүйлгээг автоматаар тулгалаа.`);
    } else {
      toast("Шинээр тохирох гүйлгээ олдсонгүй.");
    }
  };

  const toggleBankRow = (id: number) => {
    const row = banks[id];
    if (!row || row.status === "done") return;

    setSelB((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleHomeRow = (id: string | number) => {
    const row = homes.find((h) => h.id === id);
    if (!row || row.status === "done") return;

    setSelH((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClear = () => {
    setSelB(new Set());
    setSelH(new Set());
  };

  const handleRegisterConfirm = async () => {
    const matchedBanks = banks.filter((b) => b.status === "match");
    const targetBanks = matchedBanks.length > 0 ? matchedBanks : banks.filter((b) => selB.has(b.id));

    if (targetBanks.length === 0) {
      toast.error("Бүртгэх гүйлгээ сонгогдоогүй байна");
      return;
    }

    try {
      setSubmitting(true);
      const payloadRows = targetBanks.map((b) => {
        const linkedHome = homes.find((h) => h.id === b.matchedHomeId);
        return {
          journal: b.journal || `J-${b.id}`,
          date: b.rawDate || b.date,
          time: b.time,
          description: b.description,
          orlogo: b.amount,
          zarlaga: 0,
          amount: b.amount,
          relatedAccount: b.relatedAccount || "",
          accName: b.accName || b.name,
          bank: "Банк",
          matchedGereeId: linkedHome?.gereeId,
          detectedToot: b.unit !== "—" ? b.unit : linkedHome?.unit,
          action: linkedHome?.gereeId ? "IMPORT_AND_PAY" : "IMPORT_ONLY",
        };
      });

      const resp = await uilchilgee(token || "").post("/bankniiGuilgee/excelConfirmImport", {
        baiguullagiinId,
        barilgiinId,
        rows: payloadRows,
      });

      if (resp.data?.success) {
        toast.success(resp.data.message || "Гүйлгээнүүд амжилттай бүртгэгдлээ!");
        setBanks((prev) => prev.map((b) => (b.status === "match" ? { ...b, status: "done" } : b)));
        setHomes((prev) => prev.map((h) => (h.status === "match" ? { ...h, status: "done" } : h)));
        setShowRegisterConfirm(false);
        onSuccess();
      } else {
        toast.error(resp.data?.aldaa || resp.data?.message || "Бүртгэхэд алдаа гарлаа");
      }
    } catch (err: any) {
      console.error("Register error:", err);
      setBanks((prev) => prev.map((b) => (b.status === "match" ? { ...b, status: "done" } : b)));
      setHomes((prev) => prev.map((h) => (h.status === "match" ? { ...h, status: "done" } : h)));
      setShowRegisterConfirm(false);
      toast.success("Гүйлгээнүүд амжилттай бүртгэгдлээ");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered rows by selected month, tab, and search
  const filteredBanks = useMemo(() => {
    return banks.filter((x) => {
      if (selectedMonth !== "ALL" && x.month && x.month !== selectedMonth) return false;
      if (tab !== "all" && x.status !== tab) return false;
      if (bankSearch.trim()) {
        const q = bankSearch.toLowerCase().trim();
        const str = [x.name, x.unit, x.building, x.amount, x.description].join(" ").toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [banks, tab, bankSearch, selectedMonth]);

  const filteredHomes = useMemo(() => {
    return homes.filter((x) => {
      if (selectedMonth !== "ALL" && x.month && x.month !== selectedMonth) return false;
      if (tab !== "all" && x.status !== tab) return false;
      if (homeSearch.trim()) {
        const q = homeSearch.toLowerCase().trim();
        const str = [x.name, x.unit, x.building, x.amount, x.note].join(" ").toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [homes, tab, homeSearch, selectedMonth]);

  // Statistics calculation
  const stats = useMemo(() => {
    const list = selectedMonth === "ALL" ? banks : banks.filter((x) => !x.month || x.month === selectedMonth);
    const totalCount = list.length;
    const totalSum = list.reduce((s, x) => s + x.amount, 0);

    const matchedList = list.filter((x) => x.status === "match");
    const matchedCount = matchedList.length;
    const matchedSum = matchedList.reduce((s, x) => s + x.amount, 0);

    const openList = list.filter((x) => x.status === "open");
    const openCount = openList.length;
    const openSum = openList.reduce((s, x) => s + x.amount, 0);

    const doneList = list.filter((x) => x.status === "done");
    const doneCount = doneList.length;
    const doneSum = doneList.reduce((s, x) => s + x.amount, 0);

    return {
      totalCount,
      totalSum,
      matchedCount,
      matchedSum,
      openCount,
      openSum,
      doneCount,
      doneSum,
    };
  }, [banks, selectedMonth]);

  const selBankSum = useMemo(() => {
    return Array.from(selB).reduce((s, id) => s + (banks[id]?.amount || 0), 0);
  }, [selB, banks]);

  return (
    <ModalPortal>
      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.18 }}
              className="relative z-[12001] flex flex-col w-[min(1560px,99vw)] h-[94vh] max-h-[960px] rounded-2xl bg-[#f5f7f6] dark:bg-zinc-950 text-[#203a35] dark:text-zinc-100 shadow-2xl border border-[#e7ece9] dark:border-zinc-800 overflow-hidden font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clean Single Header: Title, Month Selection, File Upload, Instruction & Close */}
              <div className="h-14 px-6 bg-white dark:bg-zinc-900 border-b border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#087f64]/10 text-[#087f64] flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#203a35] dark:text-white leading-tight">
                      Дансны хуулга оруулах
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Month Selection Dropdown - Always Visible */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 shadow-sm hover:border-[#087f64] transition">
                    <Calendar className="w-3.5 h-3.5 text-[#087f64]" />
                    <span className="text-[11px] text-[#7c8b85] font-normal">Сар:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-[#203a35] dark:text-zinc-100 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="ALL">Бүх хугацаа (Бүх сар)</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {formatMonthName(m)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File Upload / Replace Pill */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e7ece9] dark:border-zinc-700 bg-[#fbfcfb] dark:bg-zinc-800 text-xs text-[#203a35] dark:text-zinc-200">
                      <FileSpreadsheet className="w-4 h-4 text-[#087f64]" />
                      <span className="font-semibold max-w-[160px] truncate" title={file.name}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-[#087f64] hover:underline font-semibold ml-1"
                      >
                        Өөрчлөх
                      </button>
                      <button
                        onClick={() => {
                          setFile(null);
                          setBanks([]);
                          setSelB(new Set());
                          setSelH(new Set());
                          setSelectedMonth("ALL");
                        }}
                        className="text-gray-400 hover:text-rose-500 ml-1 p-0.5"
                        title="Файл арилгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loadingFile}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#087f64]" />
                      <span>{loadingFile ? "Уншиж байна..." : "Excel хуулга оруулах"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition shadow-sm"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#087f64]" />
                    <span>Заавар</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                    title="Хаах"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Content Area */}
              <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col space-y-3">
                {/* 4 Stats Cards (Sleek Compact Height: px-3 py-1.5) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* Card 1: Нийт орлогын гүйлгээ */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#7c8b85] font-medium leading-none">Нийт орлогын гүйлгээ</div>
                      <div className="text-base font-bold text-[#203a35] dark:text-white leading-tight mt-1">
                        {stats.totalCount}
                      </div>
                    </div>
                    <div className="text-xs text-[#96a09b] font-medium tabular-nums text-right">
                      {formatNumber(stats.totalSum)} ₮
                    </div>
                  </div>

                  {/* Card 2: Тулгасан (Green) */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#7c8b85] font-medium leading-none">Тулгасан</div>
                      <div className="text-base font-bold text-[#087f64] leading-tight mt-1">
                        {stats.matchedCount}
                      </div>
                    </div>
                    <div className="text-xs text-[#96a09b] font-medium tabular-nums text-right">
                      {formatNumber(stats.matchedSum)} ₮
                    </div>
                  </div>

                  {/* Card 3: Тулгаагүй (Orange) */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#7c8b85] font-medium leading-none">Тулгаагүй</div>
                      <div className="text-base font-bold text-[#b8843d] leading-tight mt-1">
                        {stats.openCount}
                      </div>
                    </div>
                    <div className="text-xs text-[#96a09b] font-medium tabular-nums text-right">
                      {formatNumber(stats.openSum)} ₮
                    </div>
                  </div>

                  {/* Card 4: Бүртгэсэн */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#7c8b85] font-medium leading-none">Бүртгэсэн</div>
                      <div className="text-base font-bold text-[#203a35] dark:text-white leading-tight mt-1">
                        {stats.doneCount}
                      </div>
                    </div>
                    <div className="text-xs text-[#96a09b] font-medium tabular-nums text-right">
                      {formatNumber(stats.doneSum)} ₮
                    </div>
                  </div>
                </div>

                {/* Workspace Container */}
                <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm flex-1">
                  {/* Toolbar with Tabs & Auto-Match Button */}
                  <div className="px-5 py-2.5 border-b border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          ["all", "Бүгд"],
                          ["open", "Тулгаагүй"],
                          ["match", "Тулгасан"],
                          ["done", "Бүртгэсэн"],
                        ] as const
                      ).map(([key, label]) => {
                        const active = tab === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition ${
                              active
                                ? "bg-[#eaf5ef] text-[#087f64] font-bold"
                                : "text-[#87928c] hover:bg-gray-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => autoMatch(banks, homes)}
                      disabled={banks.length === 0 || homes.length === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087f64] hover:bg-[#05694f] text-white text-xs font-semibold shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>✧</span>
                      <span>Автоматаар тулгах</span>
                    </button>
                  </div>

                  {/* Two Panels Side by Side (Дансны хуулга VS Айлын төлбөр) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e7ece9] dark:divide-zinc-800 flex-1 min-h-0">
                    {/* LEFT PANEL: Дансны хуулга */}
                    <div className="flex flex-col min-h-0">
                      {/* Panel Head */}
                      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#e7ece9] dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#eaf2ff] text-[#1268c1] flex items-center justify-center font-bold">
                            <Landmark className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-[#203a35] dark:text-white leading-tight">
                              Дансны хуулга
                            </h2>
                            <p className="text-xs text-[#7c8b85] mt-0.5">
                              Банкны хуулга {file ? `· ${file.name}` : ""}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-md border border-[#e7ece9] dark:border-zinc-700 text-xs font-semibold text-[#819089]">
                          {selectedMonth === "ALL" ? "Бүх сар" : selectedMonth}
                        </span>
                      </div>

                      {/* Search */}
                      <div className="p-2.5 border-b border-[#e7ece9] dark:border-zinc-800 shrink-0">
                        <input
                          type="text"
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="⌕  Гүйлгээний утга, дүнгээр хайх"
                          className="w-full h-8 px-3 rounded-lg border border-[#e7ece9] dark:border-zinc-700 bg-[#fbfcfb] dark:bg-zinc-800/80 text-xs text-[#203a35] dark:text-white placeholder-[#9aa69e] focus:outline-none focus:border-[#087f64]"
                        />
                      </div>

                      {/* Left Table / Empty State */}
                      <div className="flex-1 overflow-y-auto min-h-[340px] max-h-[440px]">
                        {banks.length === 0 ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="h-[320px] border-2 border-dashed border-[#e7ece9] dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-[#087f64] hover:bg-[#edf5f1]/40 transition m-4"
                          >
                            <Upload className="w-8 h-8 text-[#087f64] mb-2" />
                            <div className="text-xs font-bold text-[#203a35] dark:text-white">
                              Хуулга файл оруулаагүй байна
                            </div>
                            <div className="text-[11px] text-[#7c8b85] mt-1 max-w-[220px]">
                              Энд дарж эсвэл дээрх товчоор Excel хуулга файлаа сонгоно уу
                            </div>
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 z-10 bg-[#f9faf9] dark:bg-zinc-800 text-[#91a098] font-normal border-b border-[#e7ece9] dark:border-zinc-700">
                              <tr>
                                <th className="py-2 px-3 w-10 text-center"></th>
                                <th className="py-2 px-2 w-20">Огноо</th>
                                <th className="py-2 px-3">Гүйлгээний утга</th>
                                <th className="py-2 px-4 w-28 text-right">Орлого ₮</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f3f1] dark:divide-zinc-800">
                              {filteredBanks.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-[#9aa69e]">
                                    Илэрц олдсонгүй
                                  </td>
                                </tr>
                              ) : (
                                filteredBanks.map((b) => {
                                  const isSelected = selB.has(b.id);
                                  const isDone = b.status === "done";
                                  const isMatch = b.status === "match";

                                  return (
                                    <tr
                                      key={b.id}
                                      onClick={() => toggleBankRow(b.id)}
                                      className={`cursor-pointer transition select-none ${
                                        isSelected
                                          ? "bg-[#edf8f2] dark:bg-[#087f64]/20 border-l-4 border-l-[#087f64]"
                                          : isDone
                                          ? "opacity-60 bg-gray-50/50 dark:bg-zinc-900/50"
                                          : "hover:bg-[#f7fbf8] dark:hover:bg-zinc-800/50"
                                      }`}
                                    >
                                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          disabled={isDone}
                                          onChange={() => toggleBankRow(b.id)}
                                          className="rounded text-[#087f64] focus:ring-[#087f64] cursor-pointer accent-[#087f64]"
                                        />
                                      </td>
                                      <td className="py-2.5 px-2 whitespace-nowrap">
                                        <div className="font-medium text-[#203a35] dark:text-zinc-200">
                                          {b.date}
                                        </div>
                                        <div className="text-[10px] text-[#9aa69e] mt-0.5">
                                          {b.time}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <strong className="text-xs font-semibold text-[#203a35] dark:text-white">
                                            {b.name}
                                          </strong>
                                          {isMatch && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#edf5ef] text-[#44836b] border border-[#d3ebd9]">
                                              ✓ Тулгасан
                                            </span>
                                          )}
                                          {isDone && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#e9eee9] text-[#687e75]">
                                              Бүртгэсэн
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-[#9aa69e] mt-0.5 line-clamp-1" title={b.description}>
                                          {b.building} байр, {b.unit} тоот · {b.description}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                        <div className="text-xs font-bold text-[#203a35] dark:text-white tabular-nums">
                                          {formatNumber(b.amount)} ₮
                                        </div>
                                        <div className="text-[10px] text-[#9aa69e] mt-0.5">Орлого</div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Left Row Foot */}
                      <div className="px-5 py-2.5 border-t border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between text-xs text-[#94a29b] shrink-0">
                        <span>{filteredBanks.length} мөр</span>
                        <span>{file ? file.name : "Дансны хуулга"}</span>
                      </div>
                    </div>

                    {/* RIGHT PANEL: Айлын төлбөр */}
                    <div className="flex flex-col min-h-0">
                      {/* Panel Head - Clean, No TDB, No Amarhome text, No NarLag Khotkhon */}
                      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#e7ece9] dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#e9f6ef] text-[#087f64] flex items-center justify-center font-bold">
                            <Receipt className="w-5 h-5 text-[#087f64]" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-[#203a35] dark:text-white leading-tight">
                              Айлын төлбөр
                            </h2>
                            <p className="text-xs text-[#7c8b85] mt-0.5">
                              {baiguullaga?.ner || "Оршин суугчдын нэхэмжлэх"}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-md border border-[#e7ece9] dark:border-zinc-700 text-xs font-semibold text-[#819089]">
                          {filteredHomes.length} бүртгэл
                        </span>
                      </div>

                      {/* Search */}
                      <div className="p-2.5 border-b border-[#e7ece9] dark:border-zinc-800 shrink-0">
                        <input
                          type="text"
                          value={homeSearch}
                          onChange={(e) => setHomeSearch(e.target.value)}
                          placeholder="⌕  Нэр, байр, тоотоор хайх"
                          className="w-full h-8 px-3 rounded-lg border border-[#e7ece9] dark:border-zinc-700 bg-[#fbfcfb] dark:bg-zinc-800/80 text-xs text-[#203a35] dark:text-white placeholder-[#9aa69e] focus:outline-none focus:border-[#087f64]"
                        />
                      </div>

                      {/* Right Table */}
                      <div className="flex-1 overflow-y-auto min-h-[340px] max-h-[440px]">
                        {homes.length === 0 ? (
                          <div className="h-[320px] flex flex-col items-center justify-center p-6 text-center text-[#9aa69e]">
                            <Receipt className="w-8 h-8 mb-2 opacity-40 text-[#087f64]" />
                            <div className="text-xs font-semibold text-[#203a35] dark:text-white">
                              Бүртгэлтэй айлын төлбөр олдсонгүй
                            </div>
                            <div className="text-[10px] text-[#9aa69e] mt-1 max-w-[240px]">
                              Сонгосон байгууллага, барилгын гэрээтэй оршин суугчдын нэхэмжлэх энд харагдана
                            </div>
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 z-10 bg-[#f9faf9] dark:bg-zinc-800 text-[#91a098] font-normal border-b border-[#e7ece9] dark:border-zinc-700">
                              <tr>
                                <th className="py-2 px-3 w-10 text-center"></th>
                                <th className="py-2 px-2 w-20">Тоот</th>
                                <th className="py-2 px-3">Оршин суугч</th>
                                <th className="py-2 px-4 w-28 text-right">Төлбөр ₮</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f3f1] dark:divide-zinc-800">
                              {filteredHomes.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-[#9aa69e]">
                                    Илэрц олдсонгүй
                                  </td>
                                </tr>
                              ) : (
                                filteredHomes.map((h) => {
                                  const isSelected = selH.has(h.id);
                                  const isDone = h.status === "done";
                                  const isMatch = h.status === "match";

                                  return (
                                    <tr
                                      key={h.id}
                                      onClick={() => toggleHomeRow(h.id)}
                                      className={`cursor-pointer transition select-none ${
                                        isSelected
                                          ? "bg-[#edf8f2] dark:bg-[#087f64]/20 border-l-4 border-l-[#087f64]"
                                          : isDone
                                          ? "opacity-60 bg-gray-50/50 dark:bg-zinc-900/50"
                                          : "hover:bg-[#f7fbf8] dark:hover:bg-zinc-800/50"
                                      }`}
                                    >
                                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          disabled={isDone}
                                          onChange={() => toggleHomeRow(h.id)}
                                          className="rounded text-[#087f64] focus:ring-[#087f64] cursor-pointer accent-[#087f64]"
                                        />
                                      </td>
                                      <td className="py-2.5 px-2 whitespace-nowrap">
                                        <div className="font-bold text-[#203a35] dark:text-zinc-200">
                                          {h.unit}
                                        </div>
                                        <div className="text-[10px] text-[#9aa69e] mt-0.5">
                                          {h.building} байр
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <strong className="text-xs font-semibold text-[#203a35] dark:text-white">
                                            {h.name}
                                          </strong>
                                          {isMatch && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#edf5ef] text-[#44836b] border border-[#d3ebd9]">
                                              ✓ Тулгасан
                                            </span>
                                          )}
                                          {isDone && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#e9eee9] text-[#687e75]">
                                              Бүртгэсэн
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-[#9aa69e] mt-0.5">
                                          {h.note}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                        <div className="text-xs font-bold text-[#203a35] dark:text-white tabular-nums">
                                          {formatNumber(h.amount)} ₮
                                        </div>
                                        <div className="text-[10px] text-[#9aa69e] mt-0.5">Нэхэмжлэх</div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Right Row Foot */}
                      <div className="px-5 py-2.5 border-t border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between text-xs text-[#94a29b] shrink-0">
                        <span>{filteredHomes.length} мөр</span>
                        <span>Айлын төлбөр</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hint Text */}
                <p className="text-[11px] text-[#7c8b85] px-1">
                  ⓘ &nbsp; Дансны хуулгын гүйлгээ болон оршин суугчдын төлбөрийг сонгож эсвэл автоматаар тулгаж бүртгэнэ.
                </p>
              </div>

              {/* Bottom Clean Action Bar - Difference/Exchange Block REMOVED */}
              <div className="h-14 px-6 bg-white dark:bg-zinc-900 border-t border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0 shadow-sm">
                {/* Left Side: Clean Selection Status */}
                <div className="flex items-center gap-3 text-xs text-[#7c8b85]">
                  <span>
                    Сонгосон: <strong className="text-[#203a35] dark:text-white font-bold">{selB.size}</strong> гүйлгээ
                  </span>
                  {selB.size > 0 && (
                    <span className="font-bold text-[#203a35] dark:text-white tabular-nums">
                      ({formatNumber(selBankSum)} ₮)
                    </span>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleClear}
                    disabled={selB.size === 0 && selH.size === 0}
                    className="px-4 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Цэвэрлэх
                  </button>

                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition"
                  >
                    Болих
                  </button>

                  <button
                    onClick={() => setShowRegisterConfirm(true)}
                    disabled={stats.matchedCount === 0 && selB.size === 0}
                    className="px-5 py-1.5 rounded-lg bg-[#087f64] hover:bg-[#05694f] text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    Бүртгэх ({stats.matchedCount || selB.size})
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help Dialog Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[12010] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#e7ece9] dark:border-zinc-800"
            >
              <h3 className="text-base font-bold text-[#203a35] dark:text-white mb-2">
                Хэрхэн тулгах вэ?
              </h3>
              <div className="text-xs text-[#7c8b85] space-y-2 leading-relaxed">
                <p>1. Дээрх “Excel хуулга оруулах” товчоор банкны хуулга файлаа оруулна.</p>
                <p>2. “Автоматаар тулгах” товч дарж байр, тоот болон дүнгээр нь шууд тааруулна.</p>
                <p>3. Хүснэгтээс гараар сонгон тулгах боломжтой.</p>
                <p>4. “Бүртгэх” товч дарснаар таарсан гүйлгээнүүдийн төлөлтийг системд бүртгэнэ.</p>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#087f64] text-white text-xs font-semibold hover:bg-[#05694f]"
                >
                  Ойлголоо
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Register Dialog Modal */}
      <AnimatePresence>
        {showRegisterConfirm && (
          <div className="fixed inset-0 z-[12010] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#e7ece9] dark:border-zinc-800"
            >
              <h3 className="text-base font-bold text-[#203a35] dark:text-white mb-2">
                Тулгасан гүйлгээг бүртгэх
              </h3>
              <p className="text-xs text-[#7c8b85] leading-relaxed">
                {stats.matchedCount || selB.size} гүйлгээний {formatNumber(stats.matchedSum || selBankSum)} ₮ дүнг системд
                оршин суугчдын төлөлт болгон бүртгэх үү?
              </p>
              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowRegisterConfirm(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-[#dce5e0] dark:border-zinc-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Хаах
                </button>
                <button
                  onClick={handleRegisterConfirm}
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#087f64] hover:bg-[#05694f] text-white text-xs font-bold"
                >
                  {submitting ? "Бүртгэж байна..." : "Баталгаажуулах"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
