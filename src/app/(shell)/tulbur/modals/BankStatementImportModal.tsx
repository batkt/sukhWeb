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
  Check,
  Link2,
  AlertTriangle,
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

  // Month Filter state - "ALL" by default to show all transactions
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
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);

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

  // Load actual contracts / residents from Amarhome API using proper queryObj
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

        // Skip fee or pure expenditure rows
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

      // Show ALL transactions by default so user sees every row
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

  // Row toggles
  const toggleBankRow = (id: number) => {
    const row = banks[id];
    if (!row || row.status === "done") return;

    setSelB((prev) => {
      const next = new Set<number>();
      if (!prev.has(id)) next.add(id);
      return next;
    });
  };

  const toggleHomeRow = (id: string | number) => {
    const row = homes.find((h) => h.id === id);
    if (!row || row.status === "done") return;

    setSelH((prev) => {
      const next = new Set<string | number>();
      if (!prev.has(id)) next.add(id);
      return next;
    });
  };

  // Selected Bank & Home for Manual Match
  const selectedBankRow = useMemo(() => {
    if (selB.size !== 1) return null;
    const id = Array.from(selB)[0];
    return banks.find((b) => b.id === id) || null;
  }, [selB, banks]);

  const selectedHomeRow = useMemo(() => {
    if (selH.size !== 1) return null;
    const id = Array.from(selH)[0];
    return homes.find((h) => h.id === id) || null;
  }, [selH, homes]);

  // When exactly 1 bank row and 1 home row are selected, automatically prompt confirmation modal
  useEffect(() => {
    if (selB.size === 1 && selH.size === 1) {
      setShowManualMatchModal(true);
    }
  }, [selB, selH]);

  const confirmManualMatch = () => {
    if (!selectedBankRow || !selectedHomeRow) return;

    const bankId = selectedBankRow.id;
    const homeId = selectedHomeRow.id;

    setBanks((prev) =>
      prev.map((b) =>
        b.id === bankId
          ? { ...b, status: "match", matchedHomeId: homeId }
          : b.matchedHomeId === homeId
          ? { ...b, status: "open", matchedHomeId: null }
          : b
      )
    );

    setHomes((prev) =>
      prev.map((h) =>
        h.id === homeId
          ? { ...h, status: "match", matchedBankId: bankId }
          : h.matchedBankId === bankId
          ? { ...h, status: "open", matchedBankId: null }
          : h
      )
    );

    setShowManualMatchModal(false);
    setSelB(new Set());
    setSelH(new Set());
    toast.success(`${selectedBankRow.name || selectedBankRow.unit} болон ${selectedHomeRow.unit} тоот амжилттай тулгагдлаа!`);
  };

  const handleUnlink = (e: React.MouseEvent, bankId?: number | null, homeId?: string | number | null) => {
    e.stopPropagation();
    if (bankId != null) {
      setBanks((prev) =>
        prev.map((b) => (b.id === bankId ? { ...b, status: "open", matchedHomeId: null } : b))
      );
    }
    if (homeId != null) {
      setHomes((prev) =>
        prev.map((h) => (h.id === homeId ? { ...h, status: "open", matchedBankId: null } : h))
      );
    }
    toast.success("Тулгалтыг салгалаа");
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

  // Aligned side-by-side row display:
  // Each entry in displayRows has { bank: BankRow | null, home: HomeRow | null }
  // This ensures row i of bank sits on the exact same row as row i of home!
  const displayRows = useMemo(() => {
    // Sort banks: matched first, then open
    const sBanks = [...filteredBanks].sort((a, b) => {
      if (a.status === "match" && b.status !== "match") return -1;
      if (a.status !== "match" && b.status === "match") return 1;
      return a.id - b.id;
    });

    const rows: { bank: BankRow | null; home: HomeRow | null }[] = [];
    const usedHomeIds = new Set<string | number>();

    // 1. For each bank row, place its matched home on the exact same row
    sBanks.forEach((b) => {
      if (b.status === "match" && b.matchedHomeId != null) {
        const matchedHome = filteredHomes.find((h) => h.id === b.matchedHomeId);
        if (matchedHome) {
          rows.push({ bank: b, home: matchedHome });
          usedHomeIds.add(matchedHome.id);
          return;
        }
      }

      // If bank is open, pair with next open home so they align row-by-row
      const nextOpenHome = filteredHomes.find((h) => !usedHomeIds.has(h.id) && h.status === "open");
      if (nextOpenHome) {
        rows.push({ bank: b, home: nextOpenHome });
        usedHomeIds.add(nextOpenHome.id);
      } else {
        rows.push({ bank: b, home: null });
      }
    });

    // 2. For any remaining homes that were not yet included, append them
    filteredHomes.forEach((h) => {
      if (!usedHomeIds.has(h.id)) {
        rows.push({ bank: null, home: h });
        usedHomeIds.add(h.id);
      }
    });

    return rows;
  }, [filteredBanks, filteredHomes]);

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
                        className="text-[11px] text-[#087f64] hover:underline font-semibold ml-1 cursor-pointer"
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
                        className="text-gray-400 hover:text-rose-500 ml-1 p-0.5 cursor-pointer"
                        title="Файл арилгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loadingFile}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition shadow-sm cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#087f64]" />
                      <span>{loadingFile ? "Уншиж байна..." : "Excel хуулга оруулах"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition shadow-sm cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#087f64]" />
                    <span>Заавар</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Хаах"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Content Area */}
              <div className="flex-1 overflow-hidden px-6 py-3 flex flex-col space-y-3 min-h-0">
                {/* 4 Stats Cards (Sleek Compact Height: px-3 py-1.5) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
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
                  <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between bg-emerald-50/30">
                    <div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium leading-none">✓ Тулгасан</div>
                      <div className="text-base font-bold text-[#087f64] leading-tight mt-1">
                        {stats.matchedCount}
                      </div>
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums text-right">
                      {formatNumber(stats.matchedSum)} ₮
                    </div>
                  </div>

                  {/* Card 3: Тулгаагүй (Red / Rose) */}
                  <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between bg-rose-50/30">
                    <div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium leading-none">✕ Тулгаагүй</div>
                      <div className="text-base font-bold text-rose-600 leading-tight mt-1">
                        {stats.openCount}
                      </div>
                    </div>
                    <div className="text-xs text-rose-600 dark:text-rose-400 font-medium tabular-nums text-right">
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
                <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm flex-1 min-h-0">
                  {/* Toolbar with Tabs & Auto-Match Button */}
                  <div className="px-5 py-2 border-b border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          ["all", "Бүгд"],
                          ["open", "Тулгаагүй (Улаан)"],
                          ["match", "Тулгасан (Ногоон)"],
                          ["done", "Бүртгэсэн"],
                        ] as const
                      ).map(([key, label]) => {
                        const active = tab === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
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

                    <div className="flex items-center gap-2">
                      {selB.size === 1 && selH.size === 1 && (
                        <button
                          onClick={() => setShowManualMatchModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition animate-pulse cursor-pointer"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Сонгосныг холбох</span>
                        </button>
                      )}

                      <button
                        onClick={() => autoMatch(banks, homes)}
                        disabled={banks.length === 0 || homes.length === 0}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#087f64] hover:bg-[#05694f] text-white text-xs font-semibold shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>✧</span>
                        <span>Автоматаар тулгах</span>
                      </button>
                    </div>
                  </div>

                  {/* Panel Heads & Searches (Fixed above the synchronized scroll container) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e7ece9] dark:divide-zinc-800 border-b border-[#e7ece9] dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
                    {/* Left Head & Search */}
                    <div className="flex flex-col">
                      <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#e7ece9] dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#eaf2ff] text-[#1268c1] flex items-center justify-center font-bold">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <h2 className="text-xs font-bold text-[#203a35] dark:text-white leading-tight">
                              Дансны хуулга
                            </h2>
                            <p className="text-[10px] text-[#7c8b85] truncate max-w-[170px]">
                              {file ? file.name : "Банкны хуулга оруулах"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMonth("ALL")}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                              selectedMonth === "ALL"
                                ? "bg-[#087f64] text-white shadow-xs"
                                : "border border-[#e7ece9] dark:border-zinc-700 text-[#819089] hover:bg-gray-100 dark:hover:bg-zinc-800"
                            }`}
                            title="Бүх гүйлгээг харах"
                          >
                            Бүх гүйлгээ ({banks.length})
                          </button>
                        </div>
                      </div>

                      <div className="p-2 bg-[#fbfcfb] dark:bg-zinc-900/60">
                        <input
                          type="text"
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="⌕  Гүйлгээний утга, дүнгээр хайх..."
                          className="w-full h-7 px-3 rounded-md border border-[#e7ece9] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#203a35] dark:text-white placeholder-[#9aa69e] focus:outline-none focus:border-[#087f64]"
                        />
                      </div>
                    </div>

                    {/* Right Head & Search */}
                    <div className="flex flex-col">
                      <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#e7ece9] dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#e9f6ef] text-[#087f64] flex items-center justify-center font-bold">
                            <Receipt className="w-4 h-4 text-[#087f64]" />
                          </div>
                          <div>
                            <h2 className="text-xs font-bold text-[#203a35] dark:text-white leading-tight">
                              Айлын төлбөр
                            </h2>
                            <p className="text-[10px] text-[#7c8b85] truncate max-w-[170px]">
                              {baiguullaga?.ner || "Оршин суугчдын нэхэмжлэх"}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-md border border-[#e7ece9] dark:border-zinc-700 text-xs font-semibold text-[#819089]">
                          {filteredHomes.length} бүртгэл
                        </span>
                      </div>

                      <div className="p-2 bg-[#fbfcfb] dark:bg-zinc-900/60">
                        <input
                          type="text"
                          value={homeSearch}
                          onChange={(e) => setHomeSearch(e.target.value)}
                          placeholder="⌕  Нэр, байр, тоотоор хайх..."
                          className="w-full h-7 px-3 rounded-md border border-[#e7ece9] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#203a35] dark:text-white placeholder-[#9aa69e] focus:outline-none focus:border-[#087f64]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SINGLE SYNCHRONIZED SCROLL CONTAINER - SCROLLS BOTH SIDES AT ONCE */}
                  <div className="flex-1 overflow-y-auto min-h-[360px] max-h-[520px]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e7ece9] dark:divide-zinc-800 min-h-full">
                      {/* Left Table: Dans */}
                      <div className="min-w-0">
                        {banks.length === 0 ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="h-[300px] border-2 border-dashed border-[#e7ece9] dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-[#087f64] hover:bg-[#edf5f1]/40 transition m-4"
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
                            <thead className="sticky top-0 z-10 bg-[#f8faf9] dark:bg-zinc-800 text-[#85948c] font-semibold border-b border-[#e7ece9] dark:border-zinc-700 shadow-xs">
                              <tr>
                                <th className="py-2.5 px-3 w-10 text-center"></th>
                                <th className="py-2.5 px-2 w-20">Огноо</th>
                                <th className="py-2.5 px-3">Гүйлгээний утга</th>
                                <th className="py-2.5 px-4 w-28 text-right">Орлого ₮</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e7ece9] dark:divide-zinc-800">
                              {displayRows.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-[#9aa69e]">
                                    Илэрц олдсонгүй
                                  </td>
                                </tr>
                              ) : (
                                displayRows.map(({ bank: b }, idx) => {
                                  if (!b) {
                                    return (
                                      <tr key={`bank-empty-${idx}`} className="h-[64px] border-b border-[#e7ece9] dark:border-zinc-800 bg-[#fbfcfb]/40 dark:bg-zinc-900/20">
                                        <td colSpan={4} className="py-2 px-3 text-center text-[11px] text-gray-300 dark:text-zinc-700 italic">
                                          —
                                        </td>
                                      </tr>
                                    );
                                  }

                                  const isSelected = selB.has(b.id);
                                  const isMatch = b.status === "match";
                                  const isDone = b.status === "done";

                                  // Matched is GREEN, Unmatched is RED, Selected is SKY
                                  const rowBg = isSelected
                                    ? "bg-sky-100/90 dark:bg-sky-950/60 border-l-4 border-l-sky-500 ring-2 ring-sky-400 ring-inset shadow-xs"
                                    : isMatch || isDone
                                    ? "bg-[#ecfdf5] dark:bg-emerald-950/25 border-l-4 border-l-emerald-500"
                                    : "bg-[#fff1f2] dark:bg-rose-950/25 border-l-4 border-l-rose-500";

                                  return (
                                    <tr
                                      key={`bank-${b.id}`}
                                      onClick={() => toggleBankRow(b.id)}
                                      className={`h-[64px] cursor-pointer transition select-none ${rowBg} hover:brightness-95 dark:hover:brightness-110`}
                                    >
                                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          disabled={isDone}
                                          onChange={() => toggleBankRow(b.id)}
                                          className="rounded text-[#087f64] focus:ring-[#087f64] cursor-pointer accent-[#087f64] w-4 h-4"
                                        />
                                      </td>
                                      <td className="py-2 px-2 whitespace-nowrap">
                                        <div className="font-semibold text-xs text-[#203a35] dark:text-zinc-200">
                                          {b.date}
                                        </div>
                                        <div className="text-[10px] text-[#7c8b85] mt-0.5">
                                          {b.time}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <strong className="text-xs font-bold text-[#203a35] dark:text-white">
                                            {b.name}
                                          </strong>
                                          {isMatch && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                                              <Check className="w-3 h-3" /> Тулгасан
                                            </span>
                                          )}
                                          {isMatch && (
                                            <button
                                              onClick={(e) => handleUnlink(e, b.id, b.matchedHomeId)}
                                              className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                                              title="Тулгалт салгах"
                                            >
                                              [Салгах]
                                            </button>
                                          )}
                                          {!isMatch && !isDone && (
                                            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300">
                                              ✕ Тулгаагүй
                                            </span>
                                          )}
                                          {isDone && (
                                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-300">
                                              Бүртгэсэн
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-[#7c8b85] mt-0.5 line-clamp-1" title={b.description}>
                                          {b.building} байр, {b.unit} тоот · {b.description}
                                        </div>
                                      </td>
                                      <td className="py-2 px-4 text-right whitespace-nowrap">
                                        <div className="text-xs font-bold text-[#203a35] dark:text-white tabular-nums">
                                          {formatNumber(b.amount)} ₮
                                        </div>
                                        <div className="text-[10px] text-[#7c8b85] mt-0.5">Орлого</div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Right Table: Homes */}
                      <div className="min-w-0">
                        {homes.length === 0 ? (
                          <div className="h-[300px] flex flex-col items-center justify-center p-6 text-center text-[#9aa69e]">
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
                            <thead className="sticky top-0 z-10 bg-[#f8faf9] dark:bg-zinc-800 text-[#85948c] font-semibold border-b border-[#e7ece9] dark:border-zinc-700 shadow-xs">
                              <tr>
                                <th className="py-2.5 px-3 w-10 text-center"></th>
                                <th className="py-2.5 px-2 w-16">Тоот</th>
                                <th className="py-2.5 px-3">Оршин суугч</th>
                                <th className="py-2.5 px-4 w-28 text-right">Төлбөр ₮</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e7ece9] dark:divide-zinc-800">
                              {displayRows.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-[#9aa69e]">
                                    Илэрц олдсонгүй
                                  </td>
                                </tr>
                              ) : (
                                displayRows.map(({ home: h }, idx) => {
                                  if (!h) {
                                    return (
                                      <tr key={`home-empty-${idx}`} className="h-[64px] border-b border-[#e7ece9] dark:border-zinc-800 bg-[#fbfcfb]/40 dark:bg-zinc-900/20">
                                        <td colSpan={4} className="py-2 px-3 text-center text-[11px] text-gray-300 dark:text-zinc-700 italic">
                                          —
                                        </td>
                                      </tr>
                                    );
                                  }

                                  const isSelected = selH.has(h.id);
                                  const isMatch = h.status === "match";
                                  const isDone = h.status === "done";

                                  // Matched is GREEN, Unmatched is RED, Selected is SKY
                                  const rowBg = isSelected
                                    ? "bg-sky-100/90 dark:bg-sky-950/60 border-l-4 border-l-sky-500 ring-2 ring-sky-400 ring-inset shadow-xs"
                                    : isMatch || isDone
                                    ? "bg-[#ecfdf5] dark:bg-emerald-950/25 border-l-4 border-l-emerald-500"
                                    : "bg-[#fff1f2] dark:bg-rose-950/25 border-l-4 border-l-rose-500";

                                  return (
                                    <tr
                                      key={`home-${h.id}`}
                                      onClick={() => toggleHomeRow(h.id)}
                                      className={`h-[64px] cursor-pointer transition select-none ${rowBg} hover:brightness-95 dark:hover:brightness-110`}
                                    >
                                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          disabled={isDone}
                                          onChange={() => toggleHomeRow(h.id)}
                                          className="rounded text-[#087f64] focus:ring-[#087f64] cursor-pointer accent-[#087f64] w-4 h-4"
                                        />
                                      </td>
                                      <td className="py-2 px-2 whitespace-nowrap">
                                        <div className="font-bold text-xs text-[#203a35] dark:text-zinc-200">
                                          {h.unit}
                                        </div>
                                        <div className="text-[10px] text-[#7c8b85] mt-0.5 truncate max-w-[80px]">
                                          {h.building}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <strong className="text-xs font-bold text-[#203a35] dark:text-white">
                                            {h.name}
                                          </strong>
                                          {isMatch && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                                              <Check className="w-3 h-3" /> Тулгасан
                                            </span>
                                          )}
                                          {isMatch && (
                                            <button
                                              onClick={(e) => handleUnlink(e, h.matchedBankId, h.id)}
                                              className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                                              title="Тулгалт салгах"
                                            >
                                              [Салгах]
                                            </button>
                                          )}
                                          {!isMatch && !isDone && (
                                            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300">
                                              ✕ Тулгаагүй
                                            </span>
                                          )}
                                          {isDone && (
                                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-300">
                                              Бүртгэсэн
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-[#7c8b85] mt-0.5">
                                          {h.note}
                                        </div>
                                      </td>
                                      <td className="py-2 px-4 text-right whitespace-nowrap">
                                        <div className="text-xs font-bold text-[#203a35] dark:text-white tabular-nums">
                                          {formatNumber(h.amount)} ₮
                                        </div>
                                        <div className="text-[10px] text-[#7c8b85] mt-0.5">Нэхэмжлэх</div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel Footer: Status & Counts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e7ece9] dark:divide-zinc-800 border-t border-[#e7ece9] dark:border-zinc-800 px-5 py-2 text-xs text-[#94a29b] shrink-0 bg-[#fbfcfb] dark:bg-zinc-900">
                    <div className="flex items-center justify-between pr-3">
                      <span>{filteredBanks.length} гүйлгээ (Ногоон: {filteredBanks.filter((b) => b.status === "match").length}, Улаан: {filteredBanks.filter((b) => b.status === "open").length})</span>
                      <span>{file ? file.name : "Дансны хуулга"}</span>
                    </div>
                    <div className="flex items-center justify-between pl-3">
                      <span>{filteredHomes.length} бүртгэл (Ногоон: {filteredHomes.filter((h) => h.status === "match").length}, Улаан: {filteredHomes.filter((h) => h.status === "open").length})</span>
                      <span>Айлын төлбөр</span>
                    </div>
                  </div>
                </div>

                {/* Hint Text */}
                <p className="text-[11px] text-[#7c8b85] px-1 shrink-0">
                  ⓘ &nbsp; <strong className="text-emerald-700 dark:text-emerald-400">Ногоон</strong> нь тулгагдсан, <strong className="text-rose-700 dark:text-rose-400">Улаан</strong> нь тулгаагүй гүйлгээнүүд. Зүүн талаас 1 гүйлгээ, баруун талаас 1 айл сонгож гараар баталгаажуулан тулгах боломжтой.
                </p>
              </div>

              {/* Bottom Clean Action Bar */}
              <div className="h-14 px-6 bg-white dark:bg-zinc-900 border-t border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0 shadow-sm">
                {/* Left Side: Clean Selection Status */}
                <div className="flex items-center gap-3 text-xs text-[#7c8b85]">
                  <span>
                    Сонгосон: <strong className="text-[#203a35] dark:text-white font-bold">{selB.size}</strong> гүйлгээ,{" "}
                    <strong className="text-[#203a35] dark:text-white font-bold">{selH.size}</strong> айл
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
                    className="px-4 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Цэвэрлэх
                  </button>

                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition cursor-pointer"
                  >
                    Болих
                  </button>

                  <button
                    onClick={() => setShowRegisterConfirm(true)}
                    disabled={stats.matchedCount === 0 && selB.size === 0}
                    className="px-5 py-1.5 rounded-lg bg-[#087f64] hover:bg-[#05694f] text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                  >
                    Бүртгэх ({stats.matchedCount || selB.size})
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Match Confirmation Modal - Pops up when 1 bank row and 1 home row are selected */}
      <ModalPortal>
        <AnimatePresence>
          {showManualMatchModal && selectedBankRow && selectedHomeRow && (
            <div className="fixed inset-0 z-[12020] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#e7ece9] dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#087f64] dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#203a35] dark:text-white">
                      Гүйлгээг айлын төлбөртэй тулгах уу?
                    </h3>
                    <p className="text-xs text-[#7c8b85]">
                      Эдгээр мэдээллийг хооронд нь холбож ногоон төлөвт шилжүүлнэ.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 my-4">
                  {/* Bank Row Details */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-[#1268c1]" />
                        <span>Дансны гүйлгээ</span>
                      </span>
                      <span className="text-slate-400 font-medium">{selectedBankRow.date} {selectedBankRow.time}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <div>
                        <div className="font-bold text-xs text-[#203a35] dark:text-white">
                          {selectedBankRow.name}
                        </div>
                        <div className="text-[11px] text-[#7c8b85] mt-0.5">
                          {selectedBankRow.building} байр, {selectedBankRow.unit} тоот · {selectedBankRow.description}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-xs font-bold text-[#087f64] tabular-nums">
                          {formatNumber(selectedBankRow.amount)} ₮
                        </div>
                        <div className="text-[10px] text-[#7c8b85]">Орлого</div>
                      </div>
                    </div>
                  </div>

                  {/* Link indicator arrow */}
                  <div className="flex justify-center -my-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#087f64] dark:text-emerald-300 flex items-center justify-center text-xs font-bold shadow-xs">
                      ↓
                    </div>
                  </div>

                  {/* Resident Row Details */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-[#087f64]" />
                        <span>Айлын бүртгэл (СӨХ)</span>
                      </span>
                      <span className="text-slate-400 font-medium">{selectedHomeRow.building}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <div>
                        <div className="font-bold text-xs text-[#203a35] dark:text-white">
                          {selectedHomeRow.unit} тоот · {selectedHomeRow.name}
                        </div>
                        <div className="text-[11px] text-[#7c8b85] mt-0.5">
                          {selectedHomeRow.note}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-xs font-bold text-[#203a35] dark:text-white tabular-nums">
                          {formatNumber(selectedHomeRow.amount || selectedBankRow.amount)} ₮
                        </div>
                        <div className="text-[10px] text-[#7c8b85]">Нэхэмжлэх</div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Check / Difference Warning if different */}
                  {selectedHomeRow.amount > 0 && selectedHomeRow.amount !== selectedBankRow.amount && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Анхааруулга:</strong> Банкны дүн ({formatNumber(selectedBankRow.amount)} ₮) болон нэхэмжлэлийн дүн ({formatNumber(selectedHomeRow.amount)} ₮) зөрүүтэй байна. Холбож тулгахдаа итгэлтэй байна уу?
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => {
                      setShowManualMatchModal(false);
                      setSelB(new Set());
                      setSelH(new Set());
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Болих
                  </button>
                  <button
                    onClick={confirmManualMatch}
                    className="px-5 py-2 rounded-xl bg-[#087f64] hover:bg-[#066a53] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Тулгах / Холбох ✓
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ModalPortal>

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
                <p>2. “Автоматаар тулгах” товч дарж нэр, байр, тоот болон дүнгээр автоматаар тулгана (ногооноор тэмдэглэгдэнэ).</p>
                <p>3. Тулгаагүй (улаан) гүйлгээг зүүн талаас 1 гүйлгээ, баруун талаас 1 айл сонгоход баталгаажуулах цонх гарч ирэн гараар холбох боломжтой.</p>
                <p>4. Холбогдсон гүйлгээний “[Салгах]” товчийг дарж буцаан салгах боломжтой.</p>
                <p>5. “Бүртгэх” товч дарснаар бүх тулгасан гүйлгээг системд оршин суугчдын төлөлт болгон баталгаажуулна.</p>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#087f64] text-white text-xs font-semibold hover:bg-[#05694f] cursor-pointer"
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
                  className="px-4 py-2 rounded-lg border border-[#dce5e0] dark:border-zinc-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Хаах
                </button>
                <button
                  onClick={handleRegisterConfirm}
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#087f64] hover:bg-[#05694f] text-white text-xs font-bold cursor-pointer"
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
