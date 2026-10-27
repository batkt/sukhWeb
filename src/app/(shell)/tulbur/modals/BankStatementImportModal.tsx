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
  ovog?: string;
  phone?: string;
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

  // Selection states: selB stores checked bank transaction IDs for registration (auto-checked for matched rows)
  const [selB, setSelB] = useState<Set<number>>(new Set());
  // Manual pairing selection for matching
  const [pairBankId, setPairBankId] = useState<number | null>(null);
  const [pairHomeId, setPairHomeId] = useState<string | number | null>(null);

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
            ovog: c.ovog || c.orshinSuugchId?.ovog || "",
            phone: Array.isArray(c.utas) ? c.utas.join(", ") : (c.utas || ""),
            building: c.bairNer || c.barilgiinId?.dugaar || "Байр",
            unit: String(c.toot || "").trim(),
            amount: Number(c.suhTulbur || c.niitTulbur || c.sarBuriinTulbur || c.nekhemjlekhDun || c.sarBuriinUilchilgee || c.uilchilgeeniiZardal || 0),
            note: "СӨХ-ийн төлбөр",
            status: "open",
            gereeId: c._id,
          }));
          setHomes(loadedHomes);

          // If bank statements are already uploaded and waiting, auto-match right away
          setBanks((prevBanks) => {
            if (prevBanks.length > 0 && prevBanks.some((b) => b.status === "open")) {
              setTimeout(() => {
                autoMatch(prevBanks, loadedHomes);
              }, 60);
            }
            return prevBanks;
          });
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
            const colLower = col.toLowerCase();
            if (colLower.includes("тайлант огноо") || (colLower.includes("огноо") && dateIdx === -1)) dateIdx = cIdx;
            if (
              !colLower.includes("харилцагч") &&
              !colLower.includes("нэр") &&
              !colLower.includes("ажилтан") &&
              (colLower === "цаг" || colLower.startsWith("цаг ") || colLower.includes("гүйлгээний цаг") || colLower === "time")
            ) {
              timeIdx = cIdx;
            }
            if (colLower.includes("утга")) descIdx = cIdx;
            if (colLower.includes("орлого") || (colLower.includes("дүн") && orlogoIdx === -1)) orlogoIdx = cIdx;
            if (colLower.includes("зарлага")) zarlagaIdx = cIdx;
            if (colLower.includes("дансны нэр") || colLower.includes("харилцагч")) accNameIdx = cIdx;
            if (colLower.includes("журнал") || colLower.includes("гүйлгээний дугаар") || colLower.includes("дугаар") || colLower.includes("лавлах")) journalIdx = cIdx;
          });
          break;
        }
      }

      if (headerRowIdx === -1) {
        headerRowIdx = 0;
        dateIdx = 0;
        timeIdx = -1;
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

      // Comprehensive Excel Date & Time parser
      const formatExcelDate = (rawDateVal: any, rawTimeVal?: any) => {
        const now = new Date();
        let dateFormatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
        let fullDate = dateFormatted;
        let timeStr = "12:00";
        let rowMonth = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;

        const num = typeof rawDateVal === "number" ? rawDateVal : parseFloat(String(rawDateVal || "").trim());

        if (typeof rawDateVal === "number" || (!isNaN(num) && /^\.?\d+(\.\d+)?$/.test(String(rawDateVal || "").trim()))) {
          if (num >= 35000 && num <= 60000) {
            // Excel serial date number with possible fractional time (e.g. 46315.01180555556)
            const d = new Date(Math.round((Math.floor(num) - 25569) * 86400 * 1000));
            const yyyy = String(d.getUTCFullYear());
            const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(d.getUTCDate()).padStart(2, "0");
            dateFormatted = `${yyyy}.${mm}.${dd}`;
            fullDate = `${yyyy}.${mm}.${dd}`;
            rowMonth = `${yyyy}.${mm}`;

            const fraction = num - Math.floor(num);
            if (fraction > 0.00001) {
              const totalSec = Math.round(fraction * 86400);
              const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
              const min = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
              timeStr = `${hh}:${min}`;
            }
          } else if (num > 0 && num < 1) {
            // Pure time fraction
            const totalSec = Math.round(num * 86400);
            const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
            const min = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
            timeStr = `${hh}:${min}`;
          }
        } else {
          const s = String(rawDateVal || "").trim();
          const fullMatch = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);
          if (fullMatch) {
            const yyyy = fullMatch[1];
            const mm = fullMatch[2].padStart(2, "0");
            const dd = fullMatch[3].padStart(2, "0");
            dateFormatted = `${yyyy}.${mm}.${dd}`;
            fullDate = `${yyyy}.${mm}.${dd}`;
            rowMonth = `${yyyy}.${mm}`;
            if (fullMatch[4] && fullMatch[5]) {
              timeStr = `${fullMatch[4].padStart(2, "0")}:${fullMatch[5].padStart(2, "0")}`;
            }
          } else {
            const shortMatch = s.match(/(\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);
            if (shortMatch) {
              const mm = shortMatch[1].padStart(2, "0");
              const dd = shortMatch[2].padStart(2, "0");
              dateFormatted = `${now.getFullYear()}.${mm}.${dd}`;
              fullDate = `${now.getFullYear()}.${mm}.${dd}`;
              rowMonth = `${now.getFullYear()}.${mm}`;
              if (shortMatch[3] && shortMatch[4]) {
                timeStr = `${shortMatch[3].padStart(2, "0")}:${shortMatch[4].padStart(2, "0")}`;
              }
            }
          }
        }

        // Only parse rawTimeVal if it actually contains a time (not a person's name)
        if (rawTimeVal) {
          const tStr = String(rawTimeVal).trim();
          const tMatch = tStr.match(/(\d{1,2}):(\d{1,2})/);
          if (tMatch) {
            timeStr = `${tMatch[1].padStart(2, "0")}:${tMatch[2].padStart(2, "0")}`;
          } else {
            const tNum = parseFloat(tStr);
            if (!isNaN(tNum) && tNum > 0 && tNum < 1) {
              const totalSec = Math.round(tNum * 86400);
              const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
              const min = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
              timeStr = `${hh}:${min}`;
            }
          }
        }

        return { dateFormatted, fullDate, timeStr, rowMonth };
      };

      const extractedBanks: BankRow[] = [];
      const detectedMonths = new Set<string>();

      for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const rawDateVal = dateIdx !== -1 ? row[dateIdx] : "";
        const rawTimeVal = timeIdx !== -1 ? row[timeIdx] : "";
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

        const explicitTootWord =
          cleanedDesc.match(/\b(\d{1,4})\s*(?:тоот|toot)\b/i) ||
          cleanedDesc.match(/(?:тоот|toot)\s*[:.]?\s*(\d{1,4})\b/i);

        if (explicitMatch) {
          building = explicitMatch[1];
          unit = explicitMatch[2];
        } else if (explicitTootWord) {
          unit = explicitTootWord[1];
        } else {
          const dashMatch = cleanedDesc.match(/(?:^|\s)[-–_#]\s*(\d{1,4})\b|\b(\d{1,4})\s*[-–_#]/);
          if (dashMatch) {
            unit = dashMatch[1] || dashMatch[2];
          } else {
            const standaloneMatch = cleanedDesc.match(/(?:^|\s)([1-9]\d{1,3})(?:\s|$)/);
            if (standaloneMatch && Number(standaloneMatch[1]) <= 2500) {
              unit = standaloneMatch[1];
            }
          }
        }

        if (unit) {
          unit = unit.trim().replace(/^0+/, "");
        }

        if (!name) {
          const words = descStr.split(/\s+/).filter((w) => /^[а-яөүёА-ЯӨҮЁa-zA-Z.]+$/.test(w) && w.length > 2);
          if (words.length > 0) name = words[words.length - 1];
        }

        const { dateFormatted, fullDate, timeStr, rowMonth } = formatExcelDate(rawDateVal, rawTimeVal);
        detectedMonths.add(rowMonth);

        extractedBanks.push({
          id: extractedBanks.length,
          name: name || descStr.substring(0, 25),
          unit: unit || "—",
          building: building || "Байр",
          amount: amount,
          date: dateFormatted,
          rawDate: fullDate,
          month: rowMonth,
          time: timeStr,
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
      setPairBankId(null);
      setPairHomeId(null);
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

  // String & Toot Normalization Helpers
  const normalizeToot = (val: any): string => {
    if (!val && val !== 0) return "";
    const s = String(val)
      .trim()
      .replace(/\s*тоот$/i, "")
      .replace(/^0+/, "")
      .toLowerCase();
    if (s === "—" || s === "-" || s === "–" || s === "_" || s === "null" || s === "undefined") return "";
    return s;
  };

  const cleanNameStr = (val: any): string => {
    if (!val) return "";
    return String(val)
      .toLowerCase()
      .replace(/[^a-z0-9а-яөүё]/gi, "")
      .trim();
  };

  // Name matching helper with typo tolerance (e.g. Мичидмаа vs Мичдмаа) and ovog support
  const isNameMatch = (payerName: string, desc: string, residentName: string, ovog?: string) => {
    const cleanResident = cleanNameStr(residentName);
    if (!cleanResident || cleanResident.length < 2) return false;

    const cleanPayer = cleanNameStr(payerName);
    const cleanDesc = cleanNameStr(desc);
    const cleanOvog = ovog ? cleanNameStr(ovog) : "";

    // 1. Direct contains check
    if (cleanPayer.includes(cleanResident) || cleanDesc.includes(cleanResident)) return true;
    if (cleanResident.includes(cleanPayer) && cleanPayer.length >= 3) return true;

    // 2. Ovog match
    if (cleanOvog && cleanOvog.length >= 3 && (cleanPayer.includes(cleanOvog) || cleanDesc.includes(cleanOvog))) return true;

    // 3. Word-by-word comparison with typo tolerance
    const combinedTokens = `${payerName} ${desc}`
      .split(/[\s,./_–\-]+/)
      .map(cleanNameStr)
      .filter((w) => w.length >= 3);

    for (const token of combinedTokens) {
      if (token === cleanResident) return true;
      if (cleanResident.includes(token) && token.length >= 3) return true;
      if (token.includes(cleanResident) && cleanResident.length >= 3) return true;

      if (Math.abs(token.length - cleanResident.length) <= 2) {
        let diff = 0;
        let i = 0, j = 0;
        while (i < token.length && j < cleanResident.length) {
          if (token[i] !== cleanResident[j]) {
            diff++;
            if (token.length > cleanResident.length) i++;
            else if (cleanResident.length > token.length) j++;
            else { i++; j++; }
          } else {
            i++; j++;
          }
        }
        diff += (token.length - i) + (cleanResident.length - j);
        if (diff <= 1 || (diff <= 2 && token.length >= 6)) return true;
      }
    }

    return false;
  };

  // Intelligent Multi-Tier Auto Matching
  const autoMatch = (currentBanks = banks, currentHomes = homes) => {
    let matchCount = 0;
    const newBanks = [...currentBanks];
    const newHomes = [...currentHomes];

    const pairMatch = (b: BankRow, h: HomeRow) => {
      b.status = "match";
      b.matchedHomeId = h.id;
      if ((!b.unit || b.unit === "—") && h.unit && h.unit !== "-") {
        b.unit = h.unit;
      }
      if ((!b.building || b.building === "Байр") && h.building && h.building !== "Байр") {
        b.building = h.building;
      }
      h.status = "match";
      h.matchedBankId = b.id;
      matchCount++;
    };

    // TIER 1: Exact Apartment Toot AND Resident Name match (100% verified match)
    newBanks.forEach((b) => {
      if (b.status !== "open") return;
      const bToot = normalizeToot(b.unit);
      if (!bToot) return;

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hToot = normalizeToot(h.unit);
        if (hToot !== bToot) return false;
        return isNameMatch(b.name, b.description, h.name, h.ovog);
      });

      if (candidates.length >= 1) {
        pairMatch(b, candidates[0]);
      }
    });

    // TIER 2: Exact Apartment Toot match alone (unique Toot in the building)
    newBanks.forEach((b) => {
      if (b.status !== "open") return;
      const bToot = normalizeToot(b.unit);
      if (!bToot) return;

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        return normalizeToot(h.unit) === bToot;
      });

      if (candidates.length === 1) {
        pairMatch(b, candidates[0]);
      } else if (candidates.length > 1) {
        const amt = candidates.find((h) => h.amount === b.amount);
        pairMatch(b, amt || candidates[0]);
      }
    });

    // TIER 3: Match by Resident Name (e.g. Sisi online shop or Отгонбилэг)
    newBanks.forEach((b) => {
      if (b.status !== "open") return;

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        return isNameMatch(b.name, b.description, h.name, h.ovog);
      });

      if (candidates.length === 1) {
        pairMatch(b, candidates[0]);
      } else if (candidates.length > 1) {
        const amt = candidates.find((h) => h.amount === b.amount);
        pairMatch(b, amt || candidates[0]);
      }
    });

    // TIER 4: Phone number match in description
    newBanks.forEach((b) => {
      if (b.status !== "open") return;
      const phoneMatch = b.description.match(/\b([89]\d{7})\b/);
      if (!phoneMatch) return;
      const phone = phoneMatch[1];

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        return Boolean(h.phone && h.phone.includes(phone));
      });

      if (candidates.length >= 1) {
        pairMatch(b, candidates[0]);
      }
    });

    setBanks(newBanks);
    setHomes(newHomes);
    // Auto check all matched / tulgagdsan transactions!
    const matchedIds = new Set(newBanks.filter((b) => b.status === "match").map((b) => b.id));
    setSelB(matchedIds);
    setPairBankId(null);
    setPairHomeId(null);

    const totalMatched = newBanks.filter((b) => b.status === "match").length;
    if (matchCount > 0) {
      toast.success(`${matchCount} гүйлгээг автоматаар амжилттай тулгаж сонголоо!`);
    } else if (totalMatched > 0) {
      toast.success(`Бүх тохирох гүйлгээ (${totalMatched}) аль хэдийн тулгагдсан байна.`);
    } else {
      toast("Шинээр тохирох гүйлгээ олдсонгүй.");
    }
  };

  // Toggle bank row checkbox (check / uncheck for registration)
  const toggleBankRow = (id: number) => {
    setSelB((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle home row pairing selection
  const toggleHomeRow = (id: string | number) => {
    setPairHomeId((prev) => (prev === id ? null : id));
  };

  // Selected Bank & Home for Manual Match / Pairing
  const selectedBankRow = useMemo(() => {
    if (pairBankId === null) return null;
    return banks.find((b) => b.id === pairBankId) || null;
  }, [pairBankId, banks]);

  const selectedHomeRow = useMemo(() => {
    if (pairHomeId === null) return null;
    return homes.find((h) => h.id === pairHomeId) || null;
  }, [pairHomeId, homes]);

  const confirmManualMatch = () => {
    if (!selectedBankRow || !selectedHomeRow) return;

    const bankId = selectedBankRow.id;
    const homeId = selectedHomeRow.id;

    setBanks((prev) =>
      prev.map((b) =>
        b.id === bankId
          ? {
              ...b,
              status: "match",
              matchedHomeId: homeId,
              unit: (b.unit === "—" || !b.unit) && selectedHomeRow.unit ? selectedHomeRow.unit : b.unit,
              building:
                (b.building === "Байр" || !b.building) && selectedHomeRow.building && selectedHomeRow.building !== "Байр"
                  ? selectedHomeRow.building
                  : b.building,
            }
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

    // Auto-check the newly matched transaction!
    setSelB((prev) => new Set([...Array.from(prev), bankId]));
    setPairBankId(null);
    setPairHomeId(null);
    setShowManualMatchModal(false);

    toast.success(
      `${selectedBankRow.name || selectedBankRow.unit || ""} болон ${selectedHomeRow.unit} тоот амжилттай тулгагдлаа!`
    );
  };

  // Pairing trigger:
  // RED rows (unmatched) NEED THAT CONFIRMATION! GREEN rows (already matched) DO NOT!
  useEffect(() => {
    if (selectedBankRow && selectedHomeRow) {
      const isRed = selectedBankRow.status === "open" || selectedHomeRow.status === "open";
      if (isRed) {
        // Red rows prompt the confirmation modal!
        setShowManualMatchModal(true);
      } else {
        // Green does not need confirmation
        confirmManualMatch();
      }
    }
  }, [selectedBankRow, selectedHomeRow]);

  const handleUnlink = (e: React.MouseEvent, bankId?: number | null, homeId?: string | number | null) => {
    e.stopPropagation();
    if (bankId != null) {
      setBanks((prev) =>
        prev.map((b) => (b.id === bankId ? { ...b, status: "open", matchedHomeId: null } : b))
      );
      setSelB((prev) => {
        const next = new Set(prev);
        next.delete(bankId);
        return next;
      });
      if (pairBankId === bankId) setPairBankId(null);
    }
    if (homeId != null) {
      setHomes((prev) =>
        prev.map((h) => (h.id === homeId ? { ...h, status: "open", matchedBankId: null } : h))
      );
      if (pairHomeId === homeId) setPairHomeId(null);
    }
    toast.success("Тулгалтыг салгалаа");
  };

  const handleClear = () => {
    setSelB(new Set());
    setPairBankId(null);
    setPairHomeId(null);
  };

  const handleRegisterConfirm = async () => {
    const targetBanks = banks.filter((b) => b.status === "match");

    if (targetBanks.length === 0) {
      toast.error("Бүртгэх тулгасан гүйлгээ байхгүй байна");
      return;
    }

    try {
      setSubmitting(true);
      const payloadRows = targetBanks.map((b) => {
        const linkedHome = homes.find((h) => h.id === b.matchedHomeId);
        let fullDate = b.rawDate || b.date;
        if (fullDate && !/^\d{4}/.test(fullDate)) {
          const yr = b.month?.substring(0, 4) || new Date().getFullYear();
          fullDate = `${yr}.${fullDate}`;
        }
        const tootStr = b.unit !== "—" ? b.unit : linkedHome?.unit || "";
        return {
          journal: b.journal && !b.journal.startsWith("J-") ? b.journal : `EXCEL-${Date.now()}-${b.id}`,
          date: fullDate,
          time: b.time,
          description: b.description,
          orlogo: b.amount,
          zarlaga: 0,
          amount: b.amount,
          relatedAccount: b.relatedAccount || "",
          accName: b.accName || b.name,
          bank: "Банк",
          matchedGereeId: linkedHome?.gereeId,
          detectedToot: tootStr,
          action: linkedHome?.gereeId ? "IMPORT_AND_PAY" : "IMPORT_ONLY",
          tailbar: `Банк тулгалт - ${fullDate}${tootStr ? ` - ${tootStr} тоот` : ""}`,
        };
      });

      const resp = await uilchilgee(token || "").post("/bankniiGuilgee/excelConfirmImport", {
        baiguullagiinId,
        barilgiinId,
        rows: payloadRows,
      });

      if (resp.data?.success) {
        if (resp.data?.stats?.errorCount > 0 && resp.data?.stats?.paidCount === 0) {
          toast.error(resp.data?.errors?.[0]?.error || "Бүртгэхэд алдаа гарлаа");
          return;
        }
        toast.success(resp.data.message || "Гүйлгээнүүд амжилттай бүртгэгдлээ!");
        const registeredIds = new Set(targetBanks.map((b) => b.id));
        setBanks((prev) => prev.map((b) => (registeredIds.has(b.id) ? { ...b, status: "done" } : b)));
        setHomes((prev) =>
          prev.map((h) => (targetBanks.some((b) => b.matchedHomeId === h.id) ? { ...h, status: "done" } : h))
        );
        setSelB((prev) => {
          const next = new Set(prev);
          registeredIds.forEach((id) => next.delete(id));
          return next;
        });
        setShowRegisterConfirm(false);
        onSuccess();
      } else {
        toast.error(resp.data?.aldaa || resp.data?.message || "Бүртгэхэд алдаа гарлаа");
      }
    } catch (err: any) {
      console.error("Register error:", err);
      toast.error(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        err?.message ||
        "Бүртгэхэд алдаа гарлаа"
      );
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
  // Both "match" and "done" (burtgegdsen) rows remain paired side-by-side!
  const displayRows = useMemo(() => {
    // Sort banks: matched & done first, then open
    const sBanks = [...filteredBanks].sort((a, b) => {
      const aDoneOrMatch = a.status === "match" || a.status === "done";
      const bDoneOrMatch = b.status === "match" || b.status === "done";
      if (aDoneOrMatch && !bDoneOrMatch) return -1;
      if (!aDoneOrMatch && bDoneOrMatch) return 1;
      return a.id - b.id;
    });

    const rows: { bank: BankRow | null; home: HomeRow | null }[] = [];
    const usedHomeIds = new Set<string | number>();

    // 1. For each bank row, place its matched home on the exact same row (works for both "match" and "done")
    sBanks.forEach((b) => {
      if ((b.status === "match" || b.status === "done") && b.matchedHomeId != null) {
        const matchedHome =
          filteredHomes.find((h) => h.id === b.matchedHomeId) ||
          homes.find((h) => h.id === b.matchedHomeId);
        if (matchedHome) {
          const pairedHome = {
            ...matchedHome,
            status: matchedHome.status === "open" ? b.status : matchedHome.status,
            matchedBankId: matchedHome.matchedBankId || b.id,
          };
          rows.push({ bank: b, home: pairedHome });
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
  }, [filteredBanks, filteredHomes, homes]);

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
    return banks.filter((b) => selB.has(b.id)).reduce((s, b) => s + b.amount, 0);
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
                          setPairBankId(null);
                          setPairHomeId(null);
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
                      <div className="text-[11px] text-black dark:text-zinc-200 leading-none">Нийт орлогын гүйлгээ</div>
                      <div className="text-base text-black dark:text-white leading-tight mt-1">
                        {stats.totalCount}
                      </div>
                    </div>
                    <div className="text-xs text-black dark:text-zinc-200 tabular-nums text-right">
                      {formatNumber(stats.totalSum)} ₮
                    </div>
                  </div>

                  {/* Card 2: Тулгасан (Green) */}
                  <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between bg-emerald-50/30">
                    <div>
                      <div className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-none">✓ Тулгасан</div>
                      <div className="text-base text-emerald-800 dark:text-emerald-300 leading-tight mt-1">
                        {stats.matchedCount}
                      </div>
                    </div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 tabular-nums text-right">
                      {formatNumber(stats.matchedSum)} ₮
                    </div>
                  </div>

                  {/* Card 3: Тулгаагүй (Red / Rose) */}
                  <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between bg-rose-50/30">
                    <div>
                      <div className="text-[11px] text-rose-900 dark:text-rose-300 leading-none">✕ Тулгаагүй</div>
                      <div className="text-base text-rose-700 dark:text-rose-400 leading-tight mt-1">
                        {stats.openCount}
                      </div>
                    </div>
                    <div className="text-xs text-rose-700 dark:text-rose-400 tabular-nums text-right">
                      {formatNumber(stats.openSum)} ₮
                    </div>
                  </div>

                  {/* Card 4: Бүртгэсэн */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-black dark:text-zinc-200 leading-none">Бүртгэсэн</div>
                      <div className="text-base text-black dark:text-white leading-tight mt-1">
                        {stats.doneCount}
                      </div>
                    </div>
                    <div className="text-xs text-black dark:text-zinc-200 tabular-nums text-right">
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
                          ["all", `Бүгд (${stats.totalCount})`],
                          ["open", `Тулгаагүй (${stats.openCount})`],
                          ["match", `Тулгасан (${stats.matchedCount})`],
                          ["done", `Бүртгэсэн (${stats.doneCount})`],
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
                      {pairBankId !== null && pairHomeId !== null && (
                        <button
                          onClick={() => {
                            const isRed = selectedBankRow?.status === "open" || selectedHomeRow?.status === "open";
                            if (isRed) setShowManualMatchModal(true);
                            else confirmManualMatch();
                          }}
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

                  {/* Alert Banner if a Month filter is active and hiding transactions */}
                  {selectedMonth !== "ALL" && banks.length > filteredBanks.length && (
                    <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Одоогоор <strong>{formatMonthName(selectedMonth)}</strong> сараар шүүсэн байна (Зөвхөн {filteredBanks.length} гүйлгээ харагдаж байна, нийт хуулгад {banks.length} гүйлгээ бий).
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedMonth("ALL")}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Бүх гүйлгээг харах ({banks.length})
                      </button>
                    </div>
                  )}

                  {/* Panel Heads & Searches (Fixed above the synchronized scroll container) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e7ece9] dark:divide-zinc-800 border-b border-[#e7ece9] dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 relative z-20">
                    {/* Left Head & Search */}
                    <div className="flex flex-col">
                      <div className="px-4 py-2.5 h-[52px] flex items-center justify-between border-b border-[#e7ece9] dark:border-zinc-800">
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

                      <div className="p-2 h-11 bg-[#fbfcfb] dark:bg-zinc-900/60 flex items-center">
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
                      <div className="px-4 py-2.5 h-[52px] flex items-center justify-between border-b border-[#e7ece9] dark:border-zinc-800">
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

                      <div className="p-2 h-11 bg-[#fbfcfb] dark:bg-zinc-900/60 flex items-center">
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
                  <div className="flex-1 overflow-y-auto overflow-x-auto min-h-[360px] max-h-[520px]">
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
                      <table className="w-full text-left text-xs border-separate border-spacing-0 table-fixed">
                        {/* 50 / 50 HALF AND HALF COLUMN SPECIFICATION */}
                        <colgroup>
                          {/* Left (Bank): 50% - 18px */}
                          <col style={{ width: "105px" }} />
                          <col style={{ width: "calc(50% - 228px)" }} />
                          <col style={{ width: "105px" }} />

                          {/* Center Divider: 36px (Strictly centered at 50%) */}
                          <col style={{ width: "36px" }} />

                          {/* Right (Home): 50% - 18px */}
                          <col style={{ width: "85px" }} />
                          <col style={{ width: "calc(50% - 208px)" }} />
                          <col style={{ width: "105px" }} />
                        </colgroup>

                        {/* UNIFIED THEAD: EXACT 50 / 50 HALF AND HALF & 100% OPAQUE SHIELD (HIDES SCROLLING ROW COLORS) */}
                        <thead className="sticky top-0 z-30 select-none">
                          <tr className="h-10">
                            {/* Left Table Headers: Дансны хуулга (50%) */}
                            <th className="sticky top-0 z-30 h-10 py-0 px-3 text-left align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Огноо
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-3 text-left align-middle font-semibold text-xs truncate bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Гүйлгээний утга
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-4 text-right align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Орлого ₮
                            </th>

                            {/* Center Column: STRICTLY AT 50% DIVIDER */}
                            <th className="sticky top-0 z-30 h-10 py-0 px-0 text-center align-middle font-bold text-zinc-400 border-b border-x border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-xs select-none">
                              →
                            </th>

                            {/* Right Table Headers: Айлын төлбөр (50%) */}
                            <th className="sticky top-0 z-30 h-10 py-0 px-3 text-left align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Тоот
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-3 text-left align-middle font-semibold text-xs truncate bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Оршин суугч
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-4 text-right align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Төлбөр ₮
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {displayRows.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                                Илэрц олдсонгүй
                              </td>
                            </tr>
                          ) : (
                            displayRows.map(({ bank: b, home: h }, idx) => {
                              const isPairSelectedBank = b && pairBankId === b.id;
                              const isPairSelectedHome = h && pairHomeId === h.id;
                              const isPairSelected = isPairSelectedBank || isPairSelectedHome;
                              const isBothMatched = Boolean(
                                b && h && (b.status === "match" || b.status === "done") && (h.status === "match" || h.status === "done")
                              );
                              const isBothDone = Boolean(b && h && b.status === "done" && h.status === "done");
                              const isBankMatched = Boolean(b && (b.status === "match" || b.status === "done"));
                              const isHomeMatched = Boolean(h && (h.status === "match" || h.status === "done"));

                              // Distinct cell colors: Green for matched, Red for unmatched, Sky for selected
                              const bankBg = isPairSelectedBank
                                ? "bg-[#e0f2fe] dark:bg-sky-950/50"
                                : !b
                                ? "bg-zinc-50 dark:bg-zinc-900/30"
                                : isBankMatched
                                ? "bg-[#eaf5ef] dark:bg-emerald-950/30 hover:bg-[#e1f0e7]"
                                : "bg-[#fef2f2] dark:bg-rose-950/30 hover:bg-[#fde8e8]";

                              const homeBg = isPairSelectedHome
                                ? "bg-[#e0f2fe] dark:bg-sky-950/50"
                                : !h
                                ? "bg-zinc-50 dark:bg-zinc-900/30"
                                : isHomeMatched
                                ? "bg-[#eaf5ef] dark:bg-emerald-950/30 hover:bg-[#e1f0e7]"
                                : "bg-[#fef2f2] dark:bg-rose-950/30 hover:bg-[#fde8e8]";

                              // Foolproof Date & Time converter for Bank Statement
                              const { date: displayDate, time: displayTime } = (() => {
                                if (!b) return { date: "—", time: "" };

                                const raw = String(b.date || b.rawDate || "").trim();
                                const rawTime = String(b.time || "").trim();

                                // 1. Excel serial number (e.g. 46315.01180555556, 46315)
                                const num = parseFloat(raw);
                                if (!isNaN(num) && num >= 30000 && num <= 65000) {
                                  const wholeDays = Math.floor(num);
                                  const fraction = num - wholeDays;
                                  const jsDate = new Date(Math.round((wholeDays - 25569) * 86400 * 1000));
                                  const yyyy = jsDate.getUTCFullYear();
                                  const mm = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
                                  const dd = String(jsDate.getUTCDate()).padStart(2, "0");

                                  let time = "";
                                  if (fraction > 0.0001) {
                                    const totalSec = Math.round(fraction * 86400);
                                    const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
                                    const min = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
                                    time = `${hh}:${min}`;
                                  } else if (rawTime && /^\d{1,2}:\d{2}/.test(rawTime)) {
                                    time = rawTime;
                                  } else {
                                    time = "12:00";
                                  }

                                  return { date: `${yyyy}.${mm}.${dd}`, time };
                                }

                                // 2. Decimal time fraction (e.g. .01180555556)
                                if (!isNaN(num) && num > 0 && num < 1) {
                                  const totalSec = Math.round(num * 86400);
                                  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
                                  const min = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
                                  return { date: "2026.10.20", time: `${hh}:${min}` };
                                }

                                // 3. Standard date string (e.g. 2026-10-20, 2026.10.20)
                                const m = raw.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
                                if (m) {
                                  const timeM = (raw + " " + rawTime).match(/(\d{1,2}):(\d{1,2})/);
                                  return {
                                    date: `${m[1]}.${m[2].padStart(2, "0")}.${m[3].padStart(2, "0")}`,
                                    time: timeM ? `${timeM[1].padStart(2, "0")}:${timeM[2].padStart(2, "0")}` : (rawTime && /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime : "12:00")
                                  };
                                }

                                // Fallback
                                if (/^\.?\d+/.test(raw) || raw.length > 10) {
                                  return { date: "2026.10.20", time: rawTime && /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime : "12:00" };
                                }

                                return { date: raw || "2026.10.20", time: rawTime && /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime : "12:00" };
                              })();

                              return (
                                <tr key={`row-${idx}`} className="h-[60px] transition select-none">
                                  {/* LEFT 3 CELLS: BANK TRANSACTION (50% OF ROW) */}
                                  {b ? (
                                    <>
                                      {/* ONLY START of Bank gets the colored line */}
                                      <td
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${bankBg}`}
                                      >
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight whitespace-nowrap">
                                          {displayDate}
                                        </div>
                                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 whitespace-nowrap font-normal">
                                          {displayTime}
                                        </div>
                                      </td>
                                      {/* MID of Bank: FIXED POSITION FOR BADGE & САЛГАХ BEFORE AMOUNT */}
                                      <td
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${bankBg}`}
                                      >
                                        <div className="flex items-center justify-between gap-2 h-full">
                                          {/* Name & description */}
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold truncate" title={b.name}>
                                              {b.name}
                                            </div>
                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" title={b.description}>
                                              {b.building} байр, {b.unit} тоот · {b.description}
                                            </div>
                                          </div>

                                          {/* FIXED POSITION BADGE & САЛГАХ (RIGHT ALIGNED, JUST BEFORE ORLOGO AMOUNT) */}
                                          <div className="w-[145px] shrink-0 flex items-center justify-end gap-1.5">
                                            {b.status === "match" && (
                                              <>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                                  <Check className="w-3 h-3 text-emerald-600" /> Тулгасан
                                                </span>
                                                <button
                                                  onClick={(e) => handleUnlink(e, b.id, b.matchedHomeId)}
                                                  className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                                  title="Тулгалт салгах"
                                                >
                                                  [Салгах]
                                                </button>
                                              </>
                                            )}
                                            {b.status === "open" && (
                                              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                                                ✕ Тулгаагүй
                                              </span>
                                            )}
                                            {b.status === "done" && (
                                              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                                Бүртгэсэн
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      {/* END of Bank: NO colored line */}
                                      <td
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-4 text-right whitespace-nowrap cursor-pointer ${bankBg}`}
                                      >
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">
                                          {formatNumber(b.amount)} ₮
                                        </div>
                                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Орлого</div>
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={3} className={`py-2 px-3 text-center text-[11px] text-zinc-400 dark:text-zinc-600 italic ${bankBg}`}>
                                      —
                                    </td>
                                  )}

                                  {/* CENTER CELL: BETWEEN THE TWO TABLES AT 50% LINE - CLEAN NEUTRAL DIVIDER */}
                                  <td className="py-0 px-0 text-center align-middle border-x border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 select-none">
                                    {isBothMatched || isBothDone ? (
                                      <div className="flex items-center justify-center" title="Тулгагдсан холбоос">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base leading-none">→</span>
                                      </div>
                                    ) : isPairSelected ? (
                                      <div className="flex items-center justify-center animate-pulse" title="Сонгосон холбоос">
                                        <span className="text-sky-500 font-bold text-base leading-none">→</span>
                                      </div>
                                    ) : (
                                      <span className="text-zinc-300 dark:text-zinc-600 text-sm leading-none">→</span>
                                    )}
                                  </td>

                                  {/* RIGHT 3 CELLS: RESIDENT / HOME (50% OF ROW) */}
                                  {h ? (
                                    <>
                                      {/* ONLY START of Home gets the colored line */}
                                      <td
                                        onClick={() => toggleHomeRow(h.id)}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${homeBg}`}
                                      >
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight whitespace-nowrap">
                                          {h.unit} тоот
                                        </div>
                                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" title={h.building}>
                                          {h.building}
                                        </div>
                                      </td>
                                      {/* MID of Home: FIXED POSITION FOR BADGE & САЛГАХ BEFORE NEHEMJLEH AMOUNT */}
                                      <td
                                        onClick={() => toggleHomeRow(h.id)}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${homeBg}`}
                                      >
                                        <div className="flex items-center justify-between gap-2 h-full">
                                          {/* Name & Note */}
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold truncate" title={h.name}>
                                              {h.name}
                                            </div>
                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" title={h.note}>
                                              {h.note}
                                            </div>
                                          </div>

                                          {/* FIXED POSITION BADGE & САЛГАХ (RIGHT ALIGNED, JUST BEFORE NEHEMJLEH AMOUNT) */}
                                          <div className="w-[145px] shrink-0 flex items-center justify-end gap-1.5">
                                            {h.status === "match" && (
                                              <>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                                  <Check className="w-3 h-3 text-emerald-600" /> Тулгасан
                                                </span>
                                                <button
                                                  onClick={(e) => handleUnlink(e, h.matchedBankId, h.id)}
                                                  className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                                  title="Тулгалт салгах"
                                                >
                                                  [Салгах]
                                                </button>
                                              </>
                                            )}
                                            {h.status === "open" && (
                                              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                                                ✕ Тулгаагүй
                                              </span>
                                            )}
                                            {h.status === "done" && (
                                              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                                Бүртгэсэн
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      {/* END of Home: NO colored line */}
                                      <td
                                        onClick={() => toggleHomeRow(h.id)}
                                        className={`py-2 px-4 text-right whitespace-nowrap cursor-pointer ${homeBg}`}
                                      >
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">
                                          {formatNumber(h.amount)} ₮
                                        </div>
                                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Нэхэмжлэх</div>
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={3} className={`py-2 px-3 text-center text-[11px] text-zinc-400 dark:text-zinc-600 italic ${homeBg}`}>
                                      —
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Panel Footer: Status & Counts & Money Sums */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e7ece9] dark:divide-zinc-800 border-t border-[#e7ece9] dark:border-zinc-800 px-5 py-2 text-xs text-black dark:text-zinc-200 shrink-0 bg-[#fbfcfb] dark:bg-zinc-900 relative z-20">
                    <div className="flex items-center justify-between pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-black dark:text-white">
                          Нийт: {filteredBanks.length} ({formatNumber(filteredBanks.reduce((s, b) => s + b.amount, 0))} ₮)
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-emerald-800 dark:text-emerald-300">
                          Тулгасан: {filteredBanks.filter((b) => b.status === "match").length} ({formatNumber(filteredBanks.filter((b) => b.status === "match").reduce((s, b) => s + b.amount, 0))} ₮)
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-rose-700 dark:text-rose-400">
                          Тулгаагүй: {filteredBanks.filter((b) => b.status === "open").length} ({formatNumber(filteredBanks.filter((b) => b.status === "open").reduce((s, b) => s + b.amount, 0))} ₮)
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-700 dark:text-zinc-300">{file ? file.name : "Дансны хуулга"}</span>
                    </div>

                    <div className="flex items-center justify-between pl-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-black dark:text-white">
                          Нийт: {filteredHomes.length} айл
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-emerald-800 dark:text-emerald-300">
                          Тулгасан: {filteredHomes.filter((h) => h.status === "match").length}
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-rose-700 dark:text-rose-400">
                          Тулгаагүй: {filteredHomes.filter((h) => h.status === "open").length}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-700 dark:text-zinc-300">Айлын төлбөр</span>
                    </div>
                  </div>
                </div>

                {/* Hint Text */}
                <p className="text-[11px] text-black dark:text-zinc-300 px-1 shrink-0">
                  ⓘ &nbsp; <span className="text-emerald-800 dark:text-emerald-300">Ногоон</span> нь тулгагдсан, <span className="text-rose-700 dark:text-rose-400">Улаан</span> нь тулгаагүй гүйлгээнүүд. Хүснэгтийн мөр дээр дарж гараар холбох боломжтой.
                </p>
              </div>

              {/* Bottom Information & Action Bar */}
              <div className="h-16 px-6 bg-white dark:bg-zinc-900 border-t border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0 shadow-md">
                {/* Left Side: Must-Have Status Pills (Total, Matched, Unmatched, Selected) */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Total pill */}
                  <button
                    onClick={() => setTab("all")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      tab === "all"
                        ? "bg-gray-100 dark:bg-zinc-800 border-gray-400"
                        : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 hover:bg-gray-100"
                    }`}
                    title="Бүх гүйлгээг шүүх"
                  >
                    <span className="text-black dark:text-zinc-300">Нийт:</span>
                    <span className="text-black dark:text-white">{stats.totalCount}</span>
                    <span className="text-zinc-400">·</span>
                    <span className="tabular-nums text-black dark:text-white">{formatNumber(stats.totalSum)} ₮</span>
                  </button>

                  {/* Matched green pill */}
                  <button
                    onClick={() => setTab("match")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      tab === "match"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500"
                        : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100"
                    }`}
                    title="Тулгасан гүйлгээг шүүх"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-emerald-900 dark:text-emerald-300">Тулгасан:</span>
                    <span className="text-emerald-800 dark:text-emerald-200">{stats.matchedCount}</span>
                    <span className="text-emerald-400 dark:text-emerald-700">·</span>
                    <span className="tabular-nums text-emerald-800 dark:text-emerald-300">{formatNumber(stats.matchedSum)} ₮</span>
                  </button>

                  {/* Unmatched red pill */}
                  <button
                    onClick={() => setTab("open")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      tab === "open"
                        ? "bg-rose-100 dark:bg-rose-950/60 border-rose-500"
                        : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 hover:bg-rose-100"
                    }`}
                    title="Тулгаагүй гүйлгээг шүүх"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-rose-900 dark:text-rose-300">Тулгаагүй:</span>
                    <span className="text-rose-700 dark:text-rose-200">{stats.openCount}</span>
                    <span className="text-rose-400 dark:text-rose-700">·</span>
                    <span className="tabular-nums text-rose-700 dark:text-rose-300">{formatNumber(stats.openSum)} ₮</span>
                  </button>

                  {/* Manual Pair Selection Indicator */}
                  {(pairBankId !== null || pairHomeId !== null) && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-xs shadow-xs text-sky-800 dark:text-sky-300">
                      <span>Сонгосон:</span>
                      <span className="font-semibold">
                        {pairBankId !== null ? selectedBankRow?.name || "Гүйлгээ" : "Гүйлгээ сонгоогүй"}
                        {" ↔ "}
                        {pairHomeId !== null ? `${selectedHomeRow?.unit || ""} тоот` : "Айл сонгоогүй"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {pairBankId !== null && pairHomeId !== null && (
                    <button
                      onClick={() => {
                        const isRed = selectedBankRow?.status === "open" || selectedHomeRow?.status === "open";
                        if (isRed) setShowManualMatchModal(true);
                        else confirmManualMatch();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition animate-pulse cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Сонгосныг тулгах</span>
                    </button>
                  )}

                  <button
                    onClick={handleClear}
                    disabled={pairBankId === null && pairHomeId === null}
                    className="px-4 py-2 rounded-xl border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Цэвэрлэх
                  </button>

                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] transition cursor-pointer"
                  >
                    Болих
                  </button>

                  <button
                    onClick={handleRegisterConfirm}
                    disabled={submitting || stats.matchedCount === 0}
                    className="px-5 py-2 rounded-xl bg-[#087f64] hover:bg-[#05694f] text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <span>Бүртгэж байна...</span>
                    ) : (
                      <span>Бүртгэх ({stats.matchedCount})</span>
                    )}
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
                      setPairBankId(null);
                      setPairHomeId(null);
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
