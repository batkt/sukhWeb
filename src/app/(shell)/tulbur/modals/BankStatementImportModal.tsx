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
  Building2,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import formatNumber from "../../../../../tools/function/formatNumber";

export type MatchStatus = "open" | "likely" | "match" | "done";

type ExistingRecord = {
  _id: string;
  record: string;
  date: string;
  time?: string;
  amount: number;
  description: string;
  relatedAccount?: string;
  accName?: string;
  matchedGereeId?: string | null;
  status?: string;
};

export type PayerRule = {
  payerKey: string;
  relatedAccount?: string;
  payerName?: string;
  building?: string;
  toot: string;
  gereeId?: string;
};

export type BankRow = {
  id: number;
  name: string;
  unit: string;
  building: string;
  amount: number;
  date: string;
  rawDate?: string;
  month?: string;
  targetMonths?: string[];
  time: string;
  description: string;
  accName?: string;
  relatedAccount?: string;
  journal?: string;
  status: MatchStatus;
  matchedHomeId?: string | number | null;
  matchReason?: string;
  targetPeriod?: string;
  phone?: string;
  ebillToot?: string;
  ebillBuilding?: string;
  isExpense?: boolean;
  isParking?: boolean;
  isFee?: boolean;
  isAldangi?: boolean;
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
  barilgiinId?: string;
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
  // Building Filter state - "ALL" by default
  const [selectedBuilding, setSelectedBuilding] = useState<string>("ALL");

  // Core Data Lists - NO mock data, initialized to empty arrays
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [homes, setHomes] = useState<HomeRow[]>([]);
  const [payerRules, setPayerRules] = useState<PayerRule[]>([]);
  const [existingBankRecords, setExistingBankRecords] = useState<ExistingRecord[]>([]);

  // Selection states: selB stores checked bank transaction IDs for registration (auto-checked for matched rows)
  const [selB, setSelB] = useState<Set<number>>(new Set());
  // Manual pairing selection for matching
  const [pairBankId, setPairBankId] = useState<number | null>(null);
  const [pairHomeId, setPairHomeId] = useState<string | number | null>(null);

  // Tabs: 'all' | 'match' (Тулгасан) | 'likely' (Магадлалтай) | 'open' (Тулгаагүй) | 'done' (Бүртгэсэн)
  const [tab, setTab] = useState<"all" | "match" | "likely" | "open" | "done">("all");

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
      if (Array.isArray(b.targetMonths)) {
        b.targetMonths.forEach((tm) => set.add(tm));
      }
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

  // Calculate available buildings (from organization, homes, and statement rows, deduplicated by building code)
  const availableBuildings = useMemo(() => {
    const rawList: string[] = [];
    const orgClean = String(baiguullaga?.ner || "").trim().toLowerCase();

    if (Array.isArray(baiguullaga?.barilguud)) {
      baiguullaga.barilguud.forEach((b: any) => {
        const n = String(b.ner || b.dugaar || "").trim();
        if (n && n !== "Байр" && n.toLowerCase() !== orgClean) rawList.push(n);
      });
    }
    homes.forEach((h) => {
      const n = String(h.building || "").trim();
      if (n && n !== "Байр" && n.toLowerCase() !== orgClean && !n.toLowerCase().endsWith("сөх") && !n.toLowerCase().endsWith("soh")) {
        rawList.push(n);
      }
    });
    banks.forEach((b) => {
      const n = String(b.building || "").trim();
      if (n && n !== "Байр" && n.toLowerCase() !== orgClean && !n.toLowerCase().endsWith("сөх") && !n.toLowerCase().endsWith("soh")) {
        rawList.push(n);
      }
    });

    // Deduplicate by building code/number so "Time tower 216" and "216" merge into a single canonical entry
    const codeMap = new Map<string, string>();
    rawList.forEach((name) => {
      const m = name.match(/(\d{1,4})/);
      const code = m ? m[1] : name.toLowerCase();
      const existing = codeMap.get(code);
      // Prefer the longer/descriptive building name (e.g. "Time tower 216" over "216")
      if (!existing || name.length > existing.length) {
        codeMap.set(code, name);
      }
    });

    return Array.from(codeMap.values()).sort((a, b) => {
      const numA = parseInt(a.match(/(\d+)/)?.[1] || "0", 10);
      const numB = parseInt(b.match(/(\d+)/)?.[1] || "0", 10);
      return numA - numB || a.localeCompare(b);
    });
  }, [baiguullaga, homes, banks]);

  // Load actual contracts / residents from Amarhome API for whole organization
  useEffect(() => {
    if (!show || !token || !baiguullagiinId) return;

    let isMounted = true;
    const queryObj: any = { baiguullagiinId };

    uilchilgee(token)
      .get("/geree", {
        params: {
          baiguullagiinId,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 2000,
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
          const barilguud = Array.isArray(baiguullaga?.barilguud) ? baiguullaga.barilguud : [];
          const orgNameClean = String(baiguullaga?.ner || "").trim().toLowerCase();

          const loadedHomes: HomeRow[] = jagsaalt.map((c: any, idx: number) => {
            const bId = String(c.barilgiinId?._id || c.barilgiinId || "").trim();
            const matchedBarilga = bId
              ? barilguud.find((b: any) => String(b?._id || b?.id).trim() === bId)
              : null;

            // Resolve real building name (e.g. 216, 217, 218, 219) instead of organization name
            let buildingName =
              matchedBarilga?.ner ||
              (matchedBarilga as any)?.dugaar ||
              c.barilgiinId?.ner ||
              c.barilgiinId?.dugaar ||
              "";

            if (!buildingName) {
              const rawBair = String(c.bairNer || "").trim();
              const numM = rawBair.match(/\b(21[6-9]|\d{1,4})\b/);
              if (numM) {
                buildingName = numM[1];
              } else if (
                rawBair &&
                rawBair.toLowerCase() !== orgNameClean &&
                !rawBair.toLowerCase().endsWith("сөх") &&
                !rawBair.toLowerCase().endsWith("soh")
              ) {
                buildingName = rawBair;
              }
            }

            if (!buildingName) {
              buildingName = "Байр";
            }

            return {
              id: c._id || `c-${idx}`,
              name: c.ner || c.orshinSuugchId?.ner || "Нэргүй",
              ovog: c.ovog || c.orshinSuugchId?.ovog || "",
              phone: Array.isArray(c.utas) ? c.utas.join(", ") : (c.utas || ""),
              building: buildingName,
              unit: String(c.toot || "").trim(),
              amount: Number(c.ashiglaltiinZardal || c.suhTulbur || c.niitTulbur || c.sarBuriinTulbur || c.nekhemjlekhDun || c.sarBuriinUilchilgee || c.uilchilgeeniiZardal || 0),
              note: "СӨХ-ийн төлбөр",
              status: "open",
              gereeId: c._id,
              barilgiinId: c.barilgiinId?._id || c.barilgiinId || "",
            };
          });
          setHomes(loadedHomes);

          // If bank statements are already uploaded and waiting, auto-match right away
          setBanks((prevBanks) => {
            if (prevBanks.length > 0 && prevBanks.some((b) => b.status === "open" || b.status === "likely")) {
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

    // Fetch existing bank records for deduplication & pre-marking
    uilchilgee(token)
      .get("/bankniiGuilgee/existingRecords", { params: { baiguullagiinId, barilgiinId } })
      .then((res) => {
        if (isMounted && Array.isArray(res.data?.records)) {
          setExistingBankRecords(res.data.records);
        }
      })
      .catch((err) => {
        console.warn("Existing bank records fetch notice:", err?.message);
      });

    // Also fetch learned payer rules
    uilchilgee(token)
      .get("/bankniiGuilgee/tulgaltDurem", { params: { baiguullagiinId } })
      .then((res) => {
        if (isMounted && Array.isArray(res.data?.rules)) {
          setPayerRules(res.data.rules);
        }
      })
      .catch(() => {
        try {
          const local = JSON.parse(localStorage.getItem(`sukh_bank_rules_${baiguullagiinId}`) || "[]");
          if (isMounted && Array.isArray(local)) setPayerRules(local);
        } catch {}
      });

    return () => {
      isMounted = false;
    };
  }, [show, token, baiguullagiinId, baiguullaga]);

  // Handle Excel File Upload & Client-Side Parse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    await parseExcelFile(selectedFile);
  };

  // Helper to extract effective billing months from a transaction
  const getEffectiveMonths = (desc: string, txDateStr: string): string[] => {
    const orig = String(desc || "").trim();
    const txYear = (txDateStr || "").split(".")[0] || "2026";
    const months = new Set<string>();

    // 1. E-Bill barcode period: e.g. _СӨХ_2026/7 or _СӨХ_2026/8 or _СӨХ_2026/10
    const ebill = orig.match(/(?:сөх|cox)_(\d{4})\/(\d{1,2})/i);
    if (ebill) {
      const y = ebill[1];
      const m = ebill[2].padStart(2, "0");
      months.add(`${y}.${m}`);
      return Array.from(months);
    }

    // 2. Year-month e.g. 2026.07, 2026-08, 2026/7, 202606
    const ymMatches = orig.matchAll(/\b(202\d)[./-](\d{1,2})\b/g);
    for (const m of ymMatches) {
      months.add(`${m[1]}.${m[2].padStart(2, "0")}`);
    }
    const compactYm = orig.matchAll(/\b(202\d)(0[1-9]|1[0-2])\b/g);
    for (const m of compactYm) {
      months.add(`${m[1]}.${m[2]}`);
    }

    // 3. Month ranges e.g. 1-7 SAR, 2026 1-10 SAR, 6-12 сар
    const rangeMatch = orig.match(/\b(\d{1,2})\s*[-~]\s*(\d{1,2})\s*(?:-[рrR]\s*)?(?:сар|sar)\b/i);
    if (rangeMatch) {
      const startM = parseInt(rangeMatch[1], 10);
      const endM = parseInt(rangeMatch[2], 10);
      if (startM >= 1 && startM <= 12 && endM >= 1 && endM <= 12 && startM <= endM) {
        for (let mo = startM; mo <= endM; mo++) {
          months.add(`${txYear}.${String(mo).padStart(2, "0")}`);
        }
      }
    }

    // 4. Comma / semicolon / slash list e.g. 4,5,6,7SAR, 6,7,8 SAR, 6;7;8;9-САР
    const listMatch = orig.match(/\b(\d{1,2}(?:\s*[,;/]\s*\d{1,2})+)\s*(?:-[рrR]\s*)?(?:сар|sar)\b/i);
    if (listMatch) {
      const digits = listMatch[1].match(/\d{1,2}/g) || [];
      for (const d of digits) {
        const num = parseInt(d, 10);
        if (num >= 1 && num <= 12) {
          months.add(`${txYear}.${String(num).padStart(2, "0")}`);
        }
      }
    }

    // 5. Single month e.g. 8-r sar, 8 sar, 6 sar, 7 сарын төлбөр
    if (!rangeMatch && !listMatch) {
      const singleMatch = orig.match(/\b(\d{1,2})\s*(?:-[рrR]\s*)?(?:сар|sar)\b/i);
      if (singleMatch) {
        const num = parseInt(singleMatch[1], 10);
        if (num >= 1 && num <= 12) {
          months.add(`${txYear}.${String(num).padStart(2, "0")}`);
        }
      }
    }

    // If no explicit month in text, fall back to transaction month
    if (months.size === 0) {
      const parts = (txDateStr || "").split(".");
      if (parts.length >= 2) {
        months.add(`${parts[0]}.${parts[1].padStart(2, "0")}`);
      }
    }

    return Array.from(months).sort();
  };

  // Advanced Transaction Description Parser
  const parseTransactionDescription = (descStr: string, accName?: string) => {
    const orig = String(descStr || "").trim();
    const isFee = Boolean(orig.match(/^(fee|шимтгэл|хураамж)$|данс хөтөлсний|гүйлгээний шимтгэл/i));
    const isExpense = Boolean(orig.match(/\btsalin\b|цалин|lift|лифт|засвар|zaswar|хог\b|hog\b|тээвэр|teewer|унгалгаа|ungulguu|тог\b|tog\b|цонх|хулдаас|huldaas|будаг|budag|харуул|haruul/i));
    const isParking = Boolean(orig.match(/qrgadaa|зогсоол|автомашин|улсын дугаар/i));
    const isAldangi = Boolean(orig.match(/алданги/i));

    // 1. E-Bill Barcode (United E-bill: 7 org + 3 bair + 5 toot + 1 check)
    // e.g. 2003260218000580_М.ЦЭРЭНЖАМЦ_СӨХ_2026/7 or Алданги. 2003260217001080_Ө._СУРМАА_СӨХ_2026/6
    const ebill = orig.match(/(?:алданги[.\s]*)?(\d{7})(\d{3})(\d{5})(\d{1})_(.+?)_(?:түр__)?сөх_(\d{4}\/\d{1,2})/i);
    if (ebill) {
      const rawBair = ebill[2];
      const rawToot = ebill[3];
      const ebillName = ebill[5].replace(/_/g, " ").trim();
      const period = ebill[6].trim();
      return {
        type: "EBILL",
        building: String(parseInt(rawBair, 10)),
        unit: String(parseInt(rawToot, 10)),
        ebillBuilding: String(parseInt(rawBair, 10)),
        ebillToot: String(parseInt(rawToot, 10)),
        name: ebillName || accName || "",
        targetPeriod: period,
        phone: "",
        isAldangi,
        isExpense: false,
        isParking: false,
        isFee: false,
      };
    }

    const ebillAlt = orig.match(/(?:алданги[.\s]*)?(\d{15,18})_(.+?)_(?:түр__)?сөх_(\d{4}\/\d{1,2})/i);
    if (ebillAlt) {
      const code = ebillAlt[1];
      const rawBair = code.substring(7, 10);
      const rawToot = code.substring(10, 15);
      const period = ebillAlt[3].trim();
      return {
        type: "EBILL",
        building: String(parseInt(rawBair, 10)),
        unit: String(parseInt(rawToot, 10)),
        ebillBuilding: String(parseInt(rawBair, 10)),
        ebillToot: String(parseInt(rawToot, 10)),
        name: ebillAlt[2].replace(/_/g, " ").trim() || accName || "",
        targetPeriod: period,
        phone: "",
        isAldangi,
        isExpense: false,
        isParking: false,
        isFee: false,
      };
    }

    // 2. Extract periods (target months) before cleaning
    const periodMatches: string[] = [];
    const mMulti = orig.match(/\b(\d{1,2}(?:\s*,\s*\d{1,2})+|\d{1,2}\s*-\s*\d{1,2})\s*(?:-[рrR]\s*)?(?:сар|sar)\b/i);
    if (mMulti) periodMatches.push(mMulti[0]);
    const mYm = orig.match(/\b(202[4-9][./-](?:0?[1-9]|1[0-2]))\b/);
    if (mYm) periodMatches.push(mYm[1]);
    const mNiit = orig.match(/niit\s*(\d{1,2})\s*n?\s*sar/i);
    if (mNiit) periodMatches.push(`${mNiit[1]} сар (нийт)`);

    // 3. Extract 8-digit phone number
    const phoneMatch = orig.match(/\b([89]\d{7})\b/);
    const phone = phoneMatch ? phoneMatch[1] : "";

    // 4. Clean working copy of the description to avoid dates/years becoming toot
    let clean = orig;
    clean = clean.replace(/\([^)]*\)/g, " "); // remove parentheses (ХААН БАНК ...)
    clean = clean.replace(/qpay\s*\d+/gi, " ").replace(/гд[-:]?\d+/gi, " ").replace(/charge:\s*[\d.]+/gi, " ");
    // Remove full dates e.g. 2026.08.01, 2026-08-01
    clean = clean.replace(/\b202[0-9][-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])\b/g, " ");
    // Remove year-month combinations e.g. _2026/7, 2026.07, 2026-8, 202606
    clean = clean.replace(/[_/.\s-]202[0-9][./-](?:0?[1-9]|1[0-2])\b/g, " ");
    clean = clean.replace(/\b202[0-9][./-](?:0?[1-9]|1[0-2])\b/g, " ");
    clean = clean.replace(/\b202[0-9](?:0[1-9]|1[0-2])\b/g, " ");
    // Remove standalone years e.g. 2025, 2026
    clean = clean.replace(/\b202[0-9]\b/g, " ");
    // Remove months e.g. 4,5,6,7sar, 6 sar, 8-r sar, niit6nsar
    clean = clean.replace(/\b(?:\d{1,2}(?:\s*,\s*\d{1,2})*|\d{1,2}\s*-\s*\d{1,2})\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*/gi, " ");
    clean = clean.replace(/\b\d{1,2}\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*/gi, " ");
    clean = clean.replace(/niit\s*\d+\s*n?\s*sar/gi, " ");
    if (phone) clean = clean.replace(phone, " ");

    let building = "";
    let unit = "";

    // 5. Building & Toot pattern matching:
    // Supports: "217-101", "218.78", "216/56", "218Н 14Т", "218 IIN 105", "219-Р БАЙР 66 ТООТ", "216-151-1", "217-151A"
    const mBairToot = clean.match(
      /\b(21[6-9]|\d{1,3})\s*(?:-?[рrR]\s*байр|\s*ба[йи]р|\s*bair|\s*iin|\s*ийн|\s*н|\*|[-./])\s*(\d{1,4}(?:[-/]\d{1,2}|[А-Яа-яA-Za-z])?)\s*(?:тоот|toot|т)?\b/i
    );
    if (mBairToot) {
      const bCandidate = mBairToot[1].trim();
      const uCandidate = mBairToot[2].trim();
      if (!bCandidate.startsWith("202")) {
        building = bCandidate;
        unit = uCandidate.replace(/^0+/, "") || uCandidate;
      }
    }

    // 6. Explicit Toot Word if not matched above:
    if (!unit) {
      const mToot = clean.match(/\b(\d{1,4}(?:[-/]\d{1,2}|[А-Яа-яA-Za-z])?)\s*(?:тоот|toot)\b/i) ||
                    clean.match(/(?:тоот|toot)\s*[:.]?\s*(\d{1,4}(?:[-/]\d{1,2}|[А-Яа-яA-Za-z])?)\b/i);
      if (mToot) {
        unit = mToot[1].replace(/^0+/, "") || mToot[1];
      }
    }

    // 7. Building alone if not matched:
    if (!building) {
      const mBair = clean.match(/\b(21[6-9]|\d{1,3})\s*(?:-?[рrR]\s*байр|\s*ба[йи]р|\s*bair)\b/i);
      if (mBair && !mBair[1].startsWith("202")) {
        building = mBair[1];
      }
    }

    // Extract name if missing
    let name = accName || "";
    if (!name) {
      const words = orig.split(/\s+/).filter((w) => /^[а-яөүёА-ЯӨҮЁa-zA-Z.]+$/.test(w) && w.length > 2);
      if (words.length > 0) name = words[words.length - 1];
    }

    return {
      type: "TEXT",
      building,
      unit,
      name,
      targetPeriod: periodMatches.join(", "),
      phone,
      isAldangi,
      isExpense,
      isParking,
      isFee,
    };
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
      let relAccIdx = -1;
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
            if (colLower.includes("харьцсан данс") || (colLower.includes("данс") && !colLower.includes("нэр") && relAccIdx === -1)) relAccIdx = cIdx;
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
        relAccIdx = 8;
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
        const relatedAccount = relAccIdx !== -1 ? String(row[relAccIdx] || "").trim() : "";
        const journal = journalIdx !== -1 ? String(row[journalIdx] || "").trim() : "";

        if (!descStr && orlogoRaw === 0 && zarlagaRaw === 0) continue;

        // Skip expense rows (Зарлага): only import income (Орлого) as requested
        if (orlogoRaw <= 0) continue;

        const amount = orlogoRaw;
        const parsed = parseTransactionDescription(descStr, accName);
        const { dateFormatted, fullDate, timeStr, rowMonth } = formatExcelDate(rawDateVal, rawTimeVal);
        const targetMonths = getEffectiveMonths(descStr, fullDate);
        detectedMonths.add(rowMonth);
        targetMonths.forEach((tm) => detectedMonths.add(tm));

        extractedBanks.push({
          id: extractedBanks.length,
          name: parsed.name || accName || descStr.substring(0, 25),
          unit: parsed.unit || "—",
          building: parsed.building || "Байр",
          amount: amount,
          date: dateFormatted,
          rawDate: fullDate,
          month: rowMonth,
          targetMonths,
          time: timeStr,
          description: descStr,
          accName,
          relatedAccount,
          journal,
          status: "open",
          targetPeriod: parsed.targetPeriod,
          ebillToot: (parsed as any).ebillToot,
          ebillBuilding: (parsed as any).ebillBuilding,
          phone: parsed.phone,
          isExpense: parsed.isExpense,
          isParking: parsed.isParking,
          isFee: parsed.isFee,
          isAldangi: parsed.isAldangi,
        });
      }

      if (extractedBanks.length === 0) {
        toast.error("Хуулгаас гүйлгээ олдсонгүй");
        return;
      }

      // Pre-check against existing bank records to prevent duplicate matches/charges
      let currentExisting = existingBankRecords;
      if (currentExisting.length === 0 && token && baiguullagiinId) {
        try {
          const res = await uilchilgee(token).get("/bankniiGuilgee/existingRecords", {
            params: { baiguullagiinId, barilgiinId },
          });
          if (Array.isArray(res.data?.records)) {
            currentExisting = res.data.records;
            setExistingBankRecords(currentExisting);
          }
        } catch (e) {
          console.warn("Could not fetch existing records:", e);
        }
      }

      let alreadyDoneCount = 0;
      const updatedHomes = [...homes];

      extractedBanks.forEach((b) => {
        const jClean = String(b.journal || "").trim().toLowerCase();
        const bAmt = Number(b.amount || 0);
        const bDateClean = String(b.date || b.rawDate || "").replace(/[-./]/g, "");
        const bDescClean = String(b.description || "").trim().toLowerCase().replace(/[\s\-_.,/()]/g, "");
        const bRelAccClean = String(b.relatedAccount || "").trim().toLowerCase().replace(/[\s\-_.,/()]/g, "");

        const existingMatch = currentExisting.find((ex) => {
          // 1. Direct journal / record match
          const exRec = String(ex.record || "").trim().toLowerCase();
          if (jClean && exRec && !jClean.startsWith("excel-") && (jClean === exRec || exRec.includes(jClean) || jClean.includes(exRec))) {
            return true;
          }
          // 2. Compound signature: Same Amount + Same Date + (Same Description or Same Account or Same Time)
          if (Math.abs(ex.amount - bAmt) >= 0.01) return false;

          const exDateClean = String(ex.date || "").replace(/[-./]/g, "");
          const isDateMatch = bDateClean && exDateClean && (bDateClean.includes(exDateClean) || exDateClean.includes(bDateClean));
          if (!isDateMatch) return false;

          if (bRelAccClean && ex.relatedAccount) {
            const exRelClean = String(ex.relatedAccount).trim().toLowerCase().replace(/[\s\-_.,/()]/g, "");
            if (bRelAccClean === exRelClean) return true;
          }

          if (bDescClean && ex.description) {
            const exDescClean = String(ex.description).trim().toLowerCase().replace(/[\s\-_.,/()]/g, "");
            if (bDescClean === exDescClean || (bDescClean.length > 5 && (bDescClean.includes(exDescClean) || exDescClean.includes(bDescClean)))) {
              return true;
            }
          }

          if (b.time && ex.time && b.time === ex.time) {
            return true;
          }

          return false;
        });

        if (existingMatch) {
          b.status = "done";
          b.matchReason = "Өмнө нь системд бүртгэгдсэн гүйлгээ";
          alreadyDoneCount++;

          if (existingMatch.matchedGereeId) {
            const linkedHome = updatedHomes.find(
              (h) => String(h.gereeId || h.id) === String(existingMatch.matchedGereeId)
            );
            if (linkedHome) {
              b.matchedHomeId = linkedHome.id;
              linkedHome.status = "done";
              linkedHome.matchedBankId = b.id;
            }
          }
        }
      });

      setHomes(updatedHomes);
      setBanks(extractedBanks);
      setSelB(new Set());
      setPairBankId(null);
      setPairHomeId(null);
      setTab("all");
      setSelectedMonth("ALL");

      if (alreadyDoneCount > 0) {
        toast.success(`${extractedBanks.length} гүйлгээ уншигдлаа (${alreadyDoneCount} нь өмнө нь бүртгэгдсэн)`);
      } else {
        toast.success(`${extractedBanks.length} гүйлгээ уншигдлаа`);
      }
      autoMatch(extractedBanks, updatedHomes);
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
      if (cleanResident.length >= 5 && token.length >= 5 && (cleanResident.includes(token) || token.includes(cleanResident))) return true;

      if (Math.abs(token.length - cleanResident.length) <= 1 && token.length >= 5 && cleanResident.length >= 5) {
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
        if (diff <= 1) return true;
      }
    }

    return false;
  };

  // Intelligent Multi-Tier Auto Matching
  // Format concise building name (e.g. "Time tower 216" -> "216-р байр") for clean display without truncation
  const formatBuildingShort = (bld?: string): string => {
    if (!bld || bld === "—" || bld === "Байр") return baiguullaga?.ner || "Байр";
    const m = String(bld).match(/(\d{1,4})/);
    if (m) return `${m[1]}-р байр`;
    return String(bld).trim();
  };

  const normalizeBuilding = (bld?: string): string => {
    if (!bld || bld === "—" || bld === "Байр") return "";
    const m = String(bld).match(/(\d{1,4})/);
    if (m) return m[1];
    return String(bld).trim().toLowerCase();
  };

  const isBuildingCompatible = (bBld?: string, hBld?: string): boolean => {
    const normB = normalizeBuilding(bBld);
    const normH = normalizeBuilding(hBld);
    if (!normB || !normH) return true;
    return normB === normH;
  };

  // Save learned recurring payer rule
  const savePayerRule = async (bank: BankRow, home: HomeRow) => {
    try {
      const payerKey = (bank.relatedAccount || bank.accName || bank.name || "").trim();
      if (!payerKey) return;
      const bldNorm = home.building || bank.building || "";
      const tootNorm = home.unit || bank.unit || "";
      const payload = {
        baiguullagiinId,
        barilgiinId: home.barilgiinId || barilgiinId,
        relatedAccount: bank.relatedAccount || "",
        payerName: bank.accName || bank.name || "",
        building: bldNorm,
        toot: tootNorm,
        gereeId: home.gereeId || (home.id ? String(home.id) : ""),
      };
      await uilchilgee(token || "").post("/bankniiGuilgee/saveTulgaltDurem", payload);
      setPayerRules((prev) => [
        ...prev.filter((r: PayerRule) => r.payerKey !== payerKey),
        { ...payload, payerKey },
      ]);
    } catch (err) {
      console.warn("Could not save payer rule:", err);
    }
  };

  // Confirm a "likely" match -> promotes to full "match" and learns rule
  const confirmLikelyMatch = async (bankId: number, homeId: string | number) => {
    const targetBank = banks.find((b) => b.id === bankId);
    const targetHome = homes.find((h) => String(h.id) === String(homeId));
    if (!targetBank || !targetHome) return;

    setBanks((prev) =>
      prev.map((b) =>
        b.id === bankId
          ? {
              ...b,
              status: "match",
              matchedHomeId: targetHome.id,
              unit: targetHome.unit || b.unit,
              building: targetHome.building && targetHome.building !== "Байр" ? targetHome.building : b.building,
            }
          : b
      )
    );

    setHomes((prev) =>
      prev.map((h) =>
        h.id === targetHome.id
          ? { ...h, status: "match", matchedBankId: bankId }
          : h
      )
    );

    setSelB((prev) => new Set([...Array.from(prev), bankId]));
    await savePayerRule(targetBank, targetHome);
    toast.success(`${targetHome.unit} тооттой амжилттай тулгаж баталгаажууллаа! Дараа сараас автоматаар танина.`);
  };

  // Intelligent Multi-Tier Auto Matching
  const autoMatch = (currentBanks = banks, currentHomes = homes, buildingFilter = selectedBuilding) => {
    let matchCount = 0;
    let likelyCount = 0;
    const newBanks = [...currentBanks];
    const newHomes = [...currentHomes];

    const pairMatch = (b: BankRow, h: HomeRow, status: "match" | "likely" = "match") => {
      const bBld = normalizeBuilding(b.building);
      const hBld = normalizeBuilding(h.building);
      if (bBld && hBld && bBld !== hBld) {
        return; // NEVER pair cross-building!
      }
      if (buildingFilter !== "ALL" && !isBuildingCompatible(buildingFilter, h.building)) {
        return;
      }

      b.status = status;
      b.matchedHomeId = h.id;
      if ((!b.unit || b.unit === "—") && h.unit && h.unit !== "-") {
        b.unit = h.unit;
      }
      if ((!b.building || b.building === "Байр") && h.building && h.building !== "Байр") {
        b.building = h.building;
      }

      if (status === "match") {
        h.status = "match";
        h.matchedBankId = b.id;
        matchCount++;
      } else {
        if (h.status === "open") {
          h.status = "likely";
          h.matchedBankId = b.id;
        }
        likelyCount++;
      }
    };

    // TIER 0: Learned Recurring Rules (Previous months' confirmed pairings)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      const bKey = (b.relatedAccount || b.accName || b.name || "").trim().toLowerCase();
      if (!bKey) return;

      const rule = payerRules.find((r) => {
        const rKey = (r.payerKey || r.relatedAccount || r.payerName || "").trim().toLowerCase();
        return rKey && (bKey.includes(rKey) || rKey.includes(bKey));
      });

      const bBld = normalizeBuilding(b.building);
      if (rule) {
        const candidate = newHomes.find((h) => {
          if (h.status !== "open") return false;
          const hBld = normalizeBuilding(h.building);
          if (bBld && hBld && bBld !== hBld) return false;
          const hToot = normalizeToot(h.unit);
          const rToot = normalizeToot(rule.toot);
          if (hToot !== rToot) return false;
          return isBuildingCompatible(rule.building, h.building);
        });

        if (candidate) {
          pairMatch(b, candidate, "match");
        }
      }
    });

    // TIER 1: E-Bill exact match (7 digits + 3 digits + 5 digits + 1 digit -> exact building & toot)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      if (!b.ebillToot) return;
      const eToot = normalizeToot(b.ebillToot);
      const bBld = normalizeBuilding(b.ebillBuilding || b.building);

      const candidate = newHomes.find((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        if (bBld && hBld && bBld !== hBld) return false;
        if (normalizeToot(h.unit) !== eToot) return false;
        return isBuildingCompatible(b.ebillBuilding, h.building);
      });

      if (candidate) {
        pairMatch(b, candidate, "match");
      }
    });

    // TIER 2: Exact Building + Exact Toot AND Resident Name match (100% verified)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      const bToot = normalizeToot(b.unit);
      if (!bToot) return;
      const bBld = normalizeBuilding(b.building);

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        if (bBld && hBld && bBld !== hBld) return false;
        if (normalizeToot(h.unit) !== bToot) return false;
        if (bBld && !isBuildingCompatible(b.building, h.building)) return false;
        return isNameMatch(b.name, b.description, h.name, h.ovog);
      });

      if (candidates.length >= 1) {
        pairMatch(b, candidates[0], "match");
      }
    });

    // TIER 3: Exact Building + Exact Toot (without name match -> likely or match if single)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      const bToot = normalizeToot(b.unit);
      if (!bToot) return;
      const bBld = normalizeBuilding(b.building);
      if (!bBld) return; // only for explicit building specification

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        if (bBld && hBld && bBld !== hBld) return false;
        if (normalizeToot(h.unit) !== bToot) return false;
        return isBuildingCompatible(b.building, h.building);
      });

      if (candidates.length === 1) {
        const nameMatches = isNameMatch(b.name, b.description, candidates[0].name, candidates[0].ovog);
        if (nameMatches) {
          pairMatch(b, candidates[0], "match");
        } else {
          // Building and toot match, but payer name differs -> Likely (Магадлалтай)
          pairMatch(b, candidates[0], "likely");
        }
      }
    });

    // TIER 4: Toot match alone (only when building matches or was not explicitly given in statement)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      const bToot = normalizeToot(b.unit);
      if (!bToot) return;
      const bBld = normalizeBuilding(b.building);

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        // If bank row explicitly has a building, do NOT match a different building!
        if (bBld && hBld && bBld !== hBld) return false;
        if (bBld && !hBld) return false;
        if (normalizeToot(h.unit) !== bToot) return false;
        if (buildingFilter !== "ALL") {
          return isBuildingCompatible(buildingFilter, h.building);
        }
        return true;
      });

      if (candidates.length === 1) {
        const nameMatches = isNameMatch(b.name, b.description, candidates[0].name, candidates[0].ovog);
        if (nameMatches) {
          pairMatch(b, candidates[0], "match");
        } else {
          pairMatch(b, candidates[0], "likely");
        }
      } else if (candidates.length > 1) {
        // Multiple buildings have this toot! Only match if name matches one of them
        const nameCandidate = candidates.find((h) =>
          isNameMatch(b.name, b.description, h.name, h.ovog)
        );
        if (nameCandidate) {
          pairMatch(b, nameCandidate, "match");
        }
      }
    });

    // TIER 5: Phone number match in description
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      const phoneMatch = b.phone || b.description.match(/\b([89]\d{7})\b/)?.[1];
      if (!phoneMatch) return;

      const bBld = normalizeBuilding(b.building);
      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        if (bBld && hBld && bBld !== hBld) return false;
        return Boolean(h.phone && h.phone.includes(phoneMatch));
      });

      if (candidates.length === 1) {
        pairMatch(b, candidates[0], "likely");
      }
    });

    // TIER 6: Resident Name alone (unique name match across complex)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      const bBld = normalizeBuilding(b.building);
      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        if (bBld && hBld && bBld !== hBld) return false;
        if (selectedBuilding !== "ALL" && !isBuildingCompatible(selectedBuilding, h.building)) return false;
        return isNameMatch(b.name, b.description, h.name, h.ovog);
      });

      if (candidates.length === 1) {
        pairMatch(b, candidates[0], "likely");
      }
    });

    setBanks(newBanks);
    setHomes(newHomes);

    // Auto check all 100% matched transactions (never auto-check "likely" ones)
    const matchedIds = new Set(newBanks.filter((b) => b.status === "match").map((b) => b.id));
    setSelB(matchedIds);
    setPairBankId(null);
    setPairHomeId(null);

    const totalMatched = newBanks.filter((b) => b.status === "match").length;
    const totalLikely = newBanks.filter((b) => b.status === "likely").length;

    if (matchCount > 0 || likelyCount > 0) {
      toast.success(
        `Тулгалт дууслаа: ${matchCount} баталгаажсан (Ногоон), ${likelyCount} магадлалтай (Шар).`
      );
    } else if (totalMatched > 0 || totalLikely > 0) {
      toast.success(
        `Нийт ${totalMatched} тулгагдсан, ${totalLikely} магадлалтай гүйлгээ байна.`
      );
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

  const confirmManualMatch = async () => {
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

    // Save learned rule so future payments from this account/name are automatically matched
    await savePayerRule(selectedBankRow, selectedHomeRow);

    toast.success(
      `${selectedBankRow.name || selectedBankRow.unit || ""} болон ${selectedHomeRow.unit} тоот амжилттай тулгагдлаа! Дүрэм хадгалагдлаа.`
    );
  };

  // Pairing trigger:
  useEffect(() => {
    if (selectedBankRow && selectedHomeRow) {
      const isRed = selectedBankRow.status === "open" || selectedHomeRow.status === "open" || selectedBankRow.status === "likely";
      if (isRed) {
        setShowManualMatchModal(true);
      } else {
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
        const linkedHome =
          (b.matchedHomeId ? homes.find((h) => String(h.id) === String(b.matchedHomeId)) : null) ||
          (b.unit && b.unit !== "—"
            ? homes.find(
                (h) =>
                  normalizeToot(h.unit) === normalizeToot(b.unit) &&
                  isBuildingCompatible(b.building, h.building)
              )
            : null);
        let fullDate = b.rawDate || b.date;
        if (fullDate && !/^\d{4}/.test(fullDate)) {
          const yr = b.month?.substring(0, 4) || new Date().getFullYear();
          fullDate = `${yr}.${fullDate}`;
        }
        const tootStr = b.unit !== "—" && b.unit ? b.unit : linkedHome?.unit || "";
        const targetGereeId = linkedHome?.gereeId || (linkedHome?.id ? String(linkedHome.id) : undefined);
        const resolvedBuilding = b.building && b.building !== "Байр" ? b.building : linkedHome?.building || "";
        const resolvedBarilgaId = linkedHome?.barilgiinId || barilgiinId;

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
          matchedGereeId: targetGereeId,
          detectedToot: tootStr,
          barilgiinId: resolvedBarilgaId,
          building: resolvedBuilding,
          targetPeriod: b.targetPeriod || "",
          action: targetGereeId || tootStr ? "IMPORT_AND_PAY" : "IMPORT_ONLY",
          tailbar: `Банк тулгалт - ${fullDate}${tootStr ? ` - ${tootStr} тоот` : ""}${b.targetPeriod ? ` (${b.targetPeriod})` : ""}`,
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

        // Also save rules for these confirmed imports
        for (const b of targetBanks) {
          const linkedHome = homes.find((h) => String(h.id) === String(b.matchedHomeId));
          if (linkedHome) {
            savePayerRule(b, linkedHome);
          }
        }

        const registeredIds = new Set(targetBanks.map((b) => b.id));
        setBanks((prev) => prev.map((b) => (registeredIds.has(b.id) ? { ...b, status: "done" } : b)));
        // Update in-memory existingBankRecords for instant deduplication
        const newlySavedRecords: ExistingRecord[] = targetBanks.map((b) => ({
          _id: `NEW-${b.id}`,
          record: b.journal || "",
          date: b.date || "",
          amount: b.amount,
          description: b.description || "",
          relatedAccount: b.relatedAccount || "",
          accName: b.accName || "",
          matchedGereeId: b.matchedHomeId ? String(b.matchedHomeId) : null,
          status: "done",
        }));
        setExistingBankRecords((prev) => [...newlySavedRecords, ...prev]);
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

  // Filtered rows by selected building, selected month, tab, and search
  const filteredBanks = useMemo(() => {
    return banks.filter((x) => {
      if (selectedBuilding !== "ALL") {
        const normSel = normalizeBuilding(selectedBuilding);
        const normBank = normalizeBuilding(x.building);
        // If bank row explicitly states a building, it MUST match selectedBuilding
        if (normBank) {
          if (normBank !== normSel) return false;
        } else {
          // If bank row has no building, check if linked home matches
          const linkedHome = x.matchedHomeId ? homes.find((h) => h.id === x.matchedHomeId) : null;
          const normHome = linkedHome ? normalizeBuilding(linkedHome.building) : "";
          if (normHome && normHome !== normSel) return false;
        }
      }
      if (selectedMonth !== "ALL") {
        const bMonths = Array.isArray(x.targetMonths) && x.targetMonths.length > 0
          ? x.targetMonths
          : [x.month || ""];
        if (!bMonths.includes(selectedMonth)) return false;
      }
      if (tab !== "all" && x.status !== tab) return false;
      if (bankSearch.trim()) {
        const q = bankSearch.toLowerCase().trim();
        const str = [x.name, x.unit, x.building, x.amount, x.description, x.targetPeriod].join(" ").toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [banks, homes, tab, bankSearch, selectedMonth, selectedBuilding]);

  const filteredHomes = useMemo(() => {
    return homes.filter((x) => {
      if (selectedBuilding !== "ALL") {
        if (!isBuildingCompatible(x.building, selectedBuilding)) return false;
      }
      if (selectedMonth !== "ALL" && x.month && x.month !== selectedMonth) return false;
      if (tab !== "all" && x.status !== tab) return false;
      if (homeSearch.trim()) {
        const q = homeSearch.toLowerCase().trim();
        const str = [x.name, x.unit, x.building, x.amount, x.note].join(" ").toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [homes, tab, homeSearch, selectedMonth, selectedBuilding]);

  // Aligned side-by-side row display (Option 2):
  // 1. Matched, Done, and Likely rows remain paired with their matched home.
  // 2. Unmatched (open) bank rows and unmatched homes are aligned side-by-side in parallel starting from row 0
  //    (eliminates huge blank gaps and enables intuitive side-by-side manual linking).
  const displayRows = useMemo(() => {
    // Sort banks: matched & done & likely first, then open
    const sBanks = [...filteredBanks].sort((a, b) => {
      const aPrior = a.status === "match" || a.status === "done" || a.status === "likely";
      const bPrior = b.status === "match" || b.status === "done" || b.status === "likely";
      if (aPrior && !bPrior) return -1;
      if (!aPrior && bPrior) return 1;
      return a.id - b.id;
    });

    const rows: { bank: BankRow | null; home: HomeRow | null }[] = [];
    const usedHomeIds = new Set<string | number>();
    const unmatchedBanks: BankRow[] = [];

    // 1. For each bank row: if matched, done, or likely, pair with matched home
    sBanks.forEach((b) => {
      if ((b.status === "match" || b.status === "done" || b.status === "likely") && b.matchedHomeId != null) {
        const matchedHome =
          filteredHomes.find((h) => h.id === b.matchedHomeId) ||
          (selectedBuilding === "ALL" ? homes.find((h) => h.id === b.matchedHomeId) : null);
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

      unmatchedBanks.push(b);
    });

    // 2. Unmatched homes
    const unmatchedHomes = filteredHomes.filter((h) => !usedHomeIds.has(h.id));

    // Sort unmatched homes: candidate matches for unmatched banks bubble up to top
    const targetToots = new Set(unmatchedBanks.map((b) => normalizeToot(b.unit)).filter(Boolean));
    const targetNames = unmatchedBanks.map((b) => (b.name || "").toLowerCase().trim()).filter(Boolean);

    unmatchedHomes.sort((a, b) => {
      const aTootMatch = targetToots.has(normalizeToot(a.unit));
      const bTootMatch = targetToots.has(normalizeToot(b.unit));
      if (aTootMatch && !bTootMatch) return -1;
      if (!aTootMatch && bTootMatch) return 1;

      const aNameMatch = targetNames.some((n) => isNameMatch(n, "", a.name, a.ovog));
      const bNameMatch = targetNames.some((n) => isNameMatch(n, "", b.name, b.ovog));
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      const numA = parseInt(normalizeToot(a.unit), 10);
      const numB = parseInt(normalizeToot(b.unit), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

      return String(a.unit).localeCompare(String(b.unit));
    });

    // 3. Align unmatched banks and unmatched homes side-by-side in parallel!
    const maxUnmatched = Math.max(unmatchedBanks.length, unmatchedHomes.length);
    for (let i = 0; i < maxUnmatched; i++) {
      rows.push({
        bank: unmatchedBanks[i] || null,
        home: unmatchedHomes[i] || null,
      });
    }

    return rows;
  }, [filteredBanks, filteredHomes, homes, selectedBuilding]);

  // Statistics calculation
  const stats = useMemo(() => {
    const list = banks.filter((x) => {
      if (selectedBuilding !== "ALL") {
        const normSel = normalizeBuilding(selectedBuilding);
        const normBank = normalizeBuilding(x.building);
        if (normBank) {
          if (normBank !== normSel) return false;
        } else {
          const linkedHome = x.matchedHomeId ? homes.find((h) => h.id === x.matchedHomeId) : null;
          const normHome = linkedHome ? normalizeBuilding(linkedHome.building) : "";
          if (normHome && normHome !== normSel) return false;
        }
      }
      if (selectedMonth !== "ALL") {
        const bMonths = Array.isArray(x.targetMonths) && x.targetMonths.length > 0
          ? x.targetMonths
          : [x.month || ""];
        if (!bMonths.includes(selectedMonth)) return false;
      }
      return true;
    });

    const totalCount = list.length;
    const totalSum = list.reduce((s, x) => s + x.amount, 0);

    const matchedList = list.filter((x) => x.status === "match");
    const matchedCount = matchedList.length;
    const matchedSum = matchedList.reduce((s, x) => s + x.amount, 0);

    const likelyList = list.filter((x) => x.status === "likely");
    const likelyCount = likelyList.length;
    const likelySum = likelyList.reduce((s, x) => s + x.amount, 0);

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
      likelyCount,
      likelySum,
      openCount,
      openSum,
      doneCount,
      doneSum,
    };
  }, [banks, homes, selectedMonth, selectedBuilding]);

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
                  {/* Building Selection Dropdown - Added for Multi-Building Complexes */}
                  {availableBuildings.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 shadow-sm hover:border-[#087f64] transition">
                      <Building2 className="w-3.5 h-3.5 text-[#087f64]" />
                      <span className="text-[11px] text-[#7c8b85] font-normal">Байр:</span>
                      <select
                        value={selectedBuilding}
                        onChange={(e) => {
                          const nextBld = e.target.value;
                          setSelectedBuilding(nextBld);
                          setBanks((prevBanks) => {
                            const resetBanks = prevBanks.map((b) => {
                              if (b.status === "done") return b;
                              if (b.status === "likely") {
                                return { ...b, status: "open" as const, matchedHomeId: undefined };
                              }
                              return b;
                            });
                            const resetHomes = homes.map((h) => {
                              if (h.status === "done") return h;
                              if (h.status === "likely") {
                                return { ...h, status: "open" as const, matchedBankId: undefined };
                              }
                              return h;
                            });
                            setTimeout(() => {
                              autoMatch(resetBanks, resetHomes, nextBld);
                            }, 50);
                            return resetBanks;
                          });
                        }}
                        className="bg-transparent border-none text-xs font-bold text-[#203a35] dark:text-zinc-100 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">Бүх байр ({availableBuildings.length})</option>
                        {availableBuildings.map((b) => (
                          <option key={b} value={b}>
                            {b.includes("байр") || b.includes("Байр") ? b : `${b}-р байр`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 shrink-0">
                  {/* Card 1: Нийт орлогын гүйлгээ */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-black dark:text-zinc-200 leading-none">Нийт орлого</div>
                      <div className="text-base text-black dark:text-white leading-tight mt-1 font-bold">
                        {stats.totalCount}
                      </div>
                    </div>
                    <div className="text-xs text-black dark:text-zinc-200 tabular-nums text-right font-medium">
                      {formatNumber(stats.totalSum)} ₮
                    </div>
                  </div>

                  {/* Card 2: Тулгасан (Green) */}
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-none font-semibold">✓ Тулгасан</div>
                      <div className="text-base text-emerald-800 dark:text-emerald-300 leading-tight mt-1 font-bold">
                        {stats.matchedCount}
                      </div>
                    </div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 tabular-nums text-right font-medium">
                      {formatNumber(stats.matchedSum)} ₮
                    </div>
                  </div>

                  {/* Card 3: Магадлалтай (Amber) */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <div className="text-[11px] text-amber-900 dark:text-amber-300 leading-none font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">Магадлалтай</span>
                      </div>
                      <div className="text-base text-amber-800 dark:text-amber-300 leading-tight mt-1 font-bold">
                        {stats.likelyCount}
                      </div>
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-300 tabular-nums text-right font-medium shrink-0 ml-2">
                      {formatNumber(stats.likelySum)} ₮
                    </div>
                  </div>

                  {/* Card 4: Тулгаагүй (Red / Rose) */}
                  <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-rose-900 dark:text-rose-300 leading-none font-semibold">✕ Тулгаагүй</div>
                      <div className="text-base text-rose-700 dark:text-rose-400 leading-tight mt-1 font-bold">
                        {stats.openCount}
                      </div>
                    </div>
                    <div className="text-xs text-rose-700 dark:text-rose-400 tabular-nums text-right font-medium">
                      {formatNumber(stats.openSum)} ₮
                    </div>
                  </div>

                  {/* Card 5: Бүртгэсэн */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#e7ece9] dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-none">Бүртгэсэн</div>
                      <div className="text-base text-zinc-700 dark:text-zinc-200 leading-tight mt-1 font-bold">
                        {stats.doneCount}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-300 tabular-nums text-right font-medium">
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
                          ["match", `Тулгасан (${stats.matchedCount})`],
                          ["likely", `Магадлалтай (${stats.likelyCount})`],
                          ["open", `Тулгаагүй (${stats.openCount})`],
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
                          {/* Left (Bank): 50% - 16px */}
                          <col style={{ width: "95px" }} />
                          <col style={{ width: "calc(50% - 205px)" }} />
                          <col style={{ width: "95px" }} />

                          {/* Center Divider: 32px (Strictly centered at 50%) */}
                          <col style={{ width: "32px" }} />

                          {/* Right (Home): 50% - 16px */}
                          <col style={{ width: "105px" }} />
                          <col style={{ width: "calc(50% - 215px)" }} />
                          <col style={{ width: "95px" }} />
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
                              Байр, тоот
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

                              const isBankLikely = Boolean(b && b.status === "likely");
                              const isHomeLikely = Boolean(h && h.status === "likely");

                              // Distinct cell colors: Green for matched, Amber for likely, Red for unmatched, Sky for selected
                              const bankBg = isPairSelectedBank
                                ? "bg-[#e0f2fe] dark:bg-sky-950/50"
                                : !b
                                ? "bg-zinc-50 dark:bg-zinc-900/30"
                                : isBankMatched
                                ? "bg-[#eaf5ef] dark:bg-emerald-950/30 hover:bg-[#e1f0e7]"
                                : isBankLikely
                                ? "bg-[#fefce8] dark:bg-amber-950/30 hover:bg-[#fef9c3]"
                                : "bg-[#fef2f2] dark:bg-rose-950/30 hover:bg-[#fde8e8]";

                              const homeBg = isPairSelectedHome
                                ? "bg-[#e0f2fe] dark:bg-sky-950/50"
                                : !h
                                ? "bg-zinc-50 dark:bg-zinc-900/30"
                                : isHomeMatched
                                ? "bg-[#eaf5ef] dark:bg-emerald-950/30 hover:bg-[#e1f0e7]"
                                : isHomeLikely
                                ? "bg-[#fefce8] dark:bg-amber-950/30 hover:bg-[#fef9c3]"
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
                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate flex items-center gap-1.5" title={b.description}>
                                              {b.isExpense && (
                                                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                                                  Зардал
                                                </span>
                                              )}
                                              {b.isParking && (
                                                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                                                  Зогсоол QPay
                                                </span>
                                              )}
                                              <span>{b.building} байр, {b.unit} тоот · {b.description}</span>
                                            </div>
                                          </div>

                                          {/* FIXED POSITION BADGE & САЛГАХ (RIGHT ALIGNED, JUST BEFORE ORLOGO AMOUNT) */}
                                          <div className="shrink-0 flex items-center justify-end gap-1.5 ml-1">
                                            {b.status === "match" && (
                                              <>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shrink-0">
                                                  <Check className="w-3 h-3 text-emerald-600" /> Тулгасан
                                                </span>
                                                <button
                                                  onClick={(e) => handleUnlink(e, b.id, b.matchedHomeId)}
                                                  className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium px-1 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                                  title="Тулгалт салгах"
                                                >
                                                  [Салгах]
                                                </button>
                                              </>
                                            )}
                                            {b.status === "likely" && (
                                              <>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 whitespace-nowrap shrink-0">
                                                  <Zap className="w-2.5 h-2.5 text-amber-600" /> Магадлалтай
                                                </span>
                                                {b.matchedHomeId && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      confirmLikelyMatch(b.id, b.matchedHomeId!);
                                                    }}
                                                    className="text-[10px] text-emerald-800 hover:text-emerald-900 font-bold px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                                    title="Энэ айлын төлбөр мөн болохыг батлах"
                                                  >
                                                    [Батлах]
                                                  </button>
                                                )}
                                                <button
                                                  onClick={(e) => handleUnlink(e, b.id, b.matchedHomeId)}
                                                  className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium px-1 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
                                    ) : (b?.status === "likely" || h?.status === "likely") ? (
                                      <div className="flex items-center justify-center" title="Магадлалтай холбоос">
                                        <span className="text-amber-500 font-bold text-sm leading-none animate-pulse">⚡</span>
                                      </div>
                                    ) : isPairSelected ? (
                                      <div className="flex items-center justify-center animate-pulse" title="Сонгосон холбоос">
                                        <span className="text-sky-500 font-bold text-base leading-none">→</span>
                                      </div>
                                    ) : (
                                      <span className="text-zinc-300 dark:text-zinc-600 text-sm leading-none">·</span>
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
                                         <div
                                           className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5 truncate"
                                           title={h.building || baiguullaga?.ner || ""}
                                         >
                                           {formatBuildingShort(h.building)}
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
                                          <div className="shrink-0 flex items-center justify-end gap-1.5 ml-1">
                                            {h.status === "match" && (
                                              <>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shrink-0">
                                                  <Check className="w-3 h-3 text-emerald-600" /> Тулгасан
                                                </span>
                                                <button
                                                  onClick={(e) => handleUnlink(e, h.matchedBankId, h.id)}
                                                  className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium px-1 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                                  title="Тулгалт салгах"
                                                >
                                                  [Салгах]
                                                </button>
                                              </>
                                            )}
                                            {h.status === "likely" && (
                                              <>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 whitespace-nowrap shrink-0">
                                                  <Zap className="w-2.5 h-2.5 text-amber-600" /> Магадлалтай
                                                </span>
                                                <button
                                                  onClick={(e) => handleUnlink(e, h.matchedBankId, h.id)}
                                                  className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium px-1 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
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

                  {/* Panel Footer: Resident Counts */}
                  <div className="flex items-center justify-end border-t border-[#e7ece9] dark:border-zinc-800 px-5 py-2 text-xs text-black dark:text-zinc-200 shrink-0 bg-[#fbfcfb] dark:bg-zinc-900 relative z-20">
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
                  </div>
                </div>

                {/* Hint Text */}
                <p className="text-[11px] text-black dark:text-zinc-300 px-1 shrink-0">
                  ⓘ &nbsp; <span className="text-emerald-800 dark:text-emerald-300">Ногоон</span> нь тулгагдсан, <span className="text-rose-700 dark:text-rose-400">Улаан</span> нь тулгаагүй гүйлгээнүүд. Хүснэгтийн мөр дээр дарж гараар холбох боломжтой.
                </p>
              </div>

              {/* Bottom Information & Action Bar */}
              <div className="h-16 px-6 bg-white dark:bg-zinc-900 border-t border-[#e7ece9] dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0 shadow-md">
                {/* Left Side: Manual Pair Selection Indicator */}
                <div className="flex items-center gap-2.5 flex-wrap">
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
