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
  GripVertical,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import formatNumber from "../../../../../tools/function/formatNumber";
import { PaymentAllocationModal } from "./PaymentAllocationModal";

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
  gereeniiDugaar?: string;
  toot?: string;
  bank?: string;
  isQPay?: boolean;
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
  isManual?: boolean;
  isQPay?: boolean;
  qpayPaymentId?: string;
  gdNumber?: string;
  allocation?: {
    months: { [monthKey: string]: number };
    totalAllocated: number;
    remaining: number;
  };
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
  gereeniiDugaar?: string;
  barilgiinId?: string;
  isManual?: boolean;
  qpayPaid?: boolean;
};

interface BankStatementImportModalProps {
  show: boolean;
  onClose: () => void;
  baiguullagiinId: string;
  barilgiinId?: string;
  onSuccess: () => void;
}

// Pure helper to determine if a bank row should be completely excluded
// Hoisted outside component to prevent Temporal Dead Zone ReferenceError
export const isExcludedBankRow = (b: { description?: string; isParking?: boolean; isQPay?: boolean }): boolean => {
  const desc = b.description || "";
  if (b.isParking || /qrgadaa|зогсоол|автомашин/i.test(desc)) return true;
  const isOurSystemQPay = /qpay/i.test(desc) && /(?:гд|gd|гэрээний\s*дугаар)[-:\s#_]?\d+/i.test(desc);
  if (isOurSystemQPay) return true;
  return false;
};

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

  // Drag and Drop states for manual matching
  const [draggedBankId, setDraggedBankId] = useState<number | null>(null);
  const [draggedHomeId, setDraggedHomeId] = useState<string | number | null>(null);
  const [dragOverHomeId, setDragOverHomeId] = useState<string | number | null>(null);
  const [dragOverBankId, setDragOverBankId] = useState<number | null>(null);

  // Tabs: 'all' | 'match' (Тулгасан) | 'likely' (Магадлалтай) | 'open' (Тулгаагүй) | 'done' (Бүртгэсэн)
  const [tab, setTab] = useState<"all" | "match" | "likely" | "open" | "done">("all");

  // Search queries
  const [bankSearch, setBankSearch] = useState("");
  const [homeSearch, setHomeSearch] = useState("");

  // Sub-dialogs
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Payment Allocation Modal state (Төлбөр хуваарилалт)
  const [allocationModal, setAllocationModal] = useState<{
    isOpen: boolean;
    bankId: number | null;
    homeId: string | number | null;
  }>({
    isOpen: false,
    bankId: null,
    homeId: null,
  });

  // Check if there are unsaved changes (active imported transactions or matches not yet registered)
  const hasUnsavedChanges = useMemo(() => {
    // If no file has been uploaded and bank rows are empty, definitely no changes
    if (!file && banks.length === 0) return false;
    // If all bank transactions are already done/registered or excluded -> no unsaved changes
    const hasUnregistered = banks.some((b) => !isExcludedBankRow(b) && b.status !== "done");
    return hasUnregistered;
  }, [file, banks]);

  const resetModalState = () => {
    setShowCloseConfirm(false);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setBanks([]);
    setSelB(new Set());
    setPairBankId(null);
    setPairHomeId(null);
    setTab("all");
    setSelectedMonth("ALL");
    setSelectedBuilding("ALL");
    setBankSearch("");
    setHomeSearch("");
    setDraggedBankId(null);
    setDraggedHomeId(null);
    setDragOverHomeId(null);
    setDragOverBankId(null);
    setAllocationModal({
      isOpen: false,
      bankId: null,
      homeId: null,
    });
  };

  const forceClose = () => {
    setShowCloseConfirm(false);
    resetModalState();
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      forceClose();
    }
  };

  useModalHotkeys({
    isOpen: show,
    onClose: () => {
      if (showCloseConfirm) {
        setShowCloseConfirm(false);
        return;
      }
      if (showHelpModal) {
        setShowHelpModal(false);
        return;
      }
      if (showRegisterConfirm) {
        setShowRegisterConfirm(false);
        return;
      }
      if (showManualMatchModal) {
        setShowManualMatchModal(false);
        return;
      }
      if (allocationModal.isOpen) {
        setAllocationModal({ isOpen: false, bankId: null, homeId: null });
        return;
      }
      handleClose();
    },
  });

  // Reset internal state whenever modal is opened or closed
  useEffect(() => {
    if (!show) {
      resetModalState();
    }
  }, [show]);

  // Calculate available months (statement months + recent months fallback)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    banks.forEach((b) => {
      if (Array.isArray(b.targetMonths) && b.targetMonths.length > 0) {
        b.targetMonths.forEach((tm) => set.add(tm));
      } else if (b.month) {
        set.add(b.month);
      }
    });
    homes.forEach((h) => {
      if (h.month) set.add(h.month);
    });
    if (set.size === 0) {
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        set.add(`${y}.${m}`);
      }
    }
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
  // Calculate available buildings (strictly from the organization's official building list)
  const availableBuildings = useMemo(() => {
    const rawList: string[] = [];
    const orgClean = String(baiguullaga?.ner || "").trim().toLowerCase();

    if (Array.isArray(baiguullaga?.barilguud) && baiguullaga.barilguud.length > 0) {
      baiguullaga.barilguud.forEach((b: any) => {
        const n = String(b.ner || b.dugaar || "").trim();
        if (n && n !== "Байр" && n.toLowerCase() !== orgClean) rawList.push(n);
      });
    } else {
      homes.forEach((h) => {
        const n = String(h.building || "").trim();
        if (n && n !== "Байр" && n.toLowerCase() !== orgClean) rawList.push(n);
      });
    }

    // Deduplicate by building code/number
    const codeMap = new Map<string, string>();
    rawList.forEach((name) => {
      const m = name.match(/(\d{1,4})/);
      const code = m ? m[1] : name.toLowerCase();
      const existing = codeMap.get(code);
      if (!existing || name.length > existing.length) {
        codeMap.set(code, name);
      }
    });

    return Array.from(codeMap.values()).sort((a, b) => {
      const numA = parseInt(a.match(/(\d+)/)?.[1] || "0", 10);
      const numB = parseInt(b.match(/(\d+)/)?.[1] || "0", 10);
      return numA - numB || a.localeCompare(b);
    });
  }, [baiguullaga, homes]);

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
          const validBuildingCodes = new Set<string>();
          barilguud.forEach((b: any) => {
            const m = String(b.ner || b.dugaar || "").match(/(\d{1,4})/);
            if (m) validBuildingCodes.add(m[1]);
          });

          const loadedHomes: HomeRow[] = [];

          jagsaalt.forEach((c: any, idx: number) => {
            const bId = String(c.barilgiinId?._id || c.barilgiinId || "").trim();
            const matchedBarilga = bId
              ? barilguud.find((b: any) => String(b?._id || b?.id).trim() === bId)
              : null;

            let buildingName =
              matchedBarilga?.ner ||
              (matchedBarilga as any)?.dugaar ||
              "";

            if (!buildingName) {
              const rawBair = String(c.bairNer || "").trim();
              const numM = rawBair.match(/(\d{1,4})/);
              if (numM && (validBuildingCodes.size === 0 || validBuildingCodes.has(numM[1]))) {
                const found = barilguud.find((b: any) => String(b.ner || b.dugaar || "").includes(numM[1]));
                buildingName = found?.ner || numM[1];
              }
            }

            // If the organization has official buildings, SKIP contracts belonging to non-existing/deleted buildings!
            if (barilguud.length > 0 && !buildingName) {
              return;
            }

            if (!buildingName) {
              buildingName = "Байр";
            }

            loadedHomes.push({
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
              gereeniiDugaar: String(c.gereeniiDugaar || c.dugaar || "").trim(),
              barilgiinId: matchedBarilga?._id || c.barilgiinId?._id || c.barilgiinId || "",
            });
          });
          setHomes(loadedHomes);

          // If bank statements are already uploaded, auto-match deterministically
          if (banks.length > 0) {
            autoMatch(banks, loadedHomes);
          }
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
        } catch { }
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
    if (e.target) {
      e.target.value = "";
    }
  };

  // Helper to extract effective billing months from a transaction
  const getEffectiveMonths = (desc: string, txDateStr: string): string[] => {
    const orig = String(desc || "").trim();
    const txYear = (txDateStr || "").split(".")[0] || "2026";
    const months = new Set<string>();

    // 1. E-Bill barcode period: e.g. _СӨХ_2026/7 or _СӨХ_2026/8 or _СӨХ_2026/10
    const ebill = orig.match(/(?:сөх|cox)[_.\s]+(\d{4})\/(\d{1,2})/i);
    if (ebill) {
      const y = ebill[1];
      const m = ebill[2].padStart(2, "0");
      months.add(`${y}.${m}`);
      return Array.from(months);
    }

    // 2. Year-month e.g. 2026.07, 2026-08, 2026/7, 202606
    const ymMatches = orig.matchAll(/(?:^|[^0-9])(202\d)[./-](0?[1-9]|1[0-2])(?=[^0-9]|$)/g);
    for (const m of ymMatches) {
      months.add(`${m[1]}.${m[2].padStart(2, "0")}`);
    }
    const compactYm = orig.matchAll(/(?:^|[^0-9])(202\d)(0[1-9]|1[0-2])(?=[^0-9]|$)/g);
    for (const m of compactYm) {
      months.add(`${m[1]}.${m[2]}`);
    }

    // 3. Month ranges e.g. 1-7 SAR, 1-9 SAR, 6-12 сар, 6-8 sar (strict 1-12 months only!)
    const rangeMatch = orig.match(
      /(?:^|[^0-9a-zа-яөүё])([1-9]|1[0-2])\s*[-~]\s*([1-9]|1[0-2])\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*(?=[^0-9a-zа-яөүё]|$)/i
    );
    if (rangeMatch) {
      const startM = parseInt(rangeMatch[1], 10);
      const endM = parseInt(rangeMatch[2], 10);
      if (startM >= 1 && startM <= 12 && endM >= 1 && endM <= 12 && startM <= endM) {
        for (let mo = startM; mo <= endM; mo++) {
          months.add(`${txYear}.${String(mo).padStart(2, "0")}`);
        }
      }
    }

    // 4. Comma / semicolon / slash list e.g. 6,7,8 SARIIN, 4,5,6,7SAR (strict 1-12 months only!)
    const listMatch = orig.match(
      /(?:^|[^0-9a-zа-яөүё])((?:[1-9]|1[0-2])(?:\s*[,;/]\s*(?:[1-9]|1[0-2]))+)\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*(?=[^0-9a-zа-яөүё]|$)/i
    );
    if (listMatch) {
      const digits = listMatch[1].match(/\d{1,2}/g) || [];
      for (const d of digits) {
        const num = parseInt(d, 10);
        if (num >= 1 && num <= 12) {
          months.add(`${txYear}.${String(num).padStart(2, "0")}`);
        }
      }
    }

    // 5. Single month e.g. 8-r sar, 8 sar, 8 САР, 6 sar, 7 сарын төлбөр, 216-62-8 САР
    if (!rangeMatch && !listMatch) {
      const singleMatch = orig.match(
        /(?:^|[^0-9a-zа-яөүё])([1-9]|1[0-2])\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*(?=[^0-9a-zа-яөүё]|$)/i
      );
      if (singleMatch) {
        const num = parseInt(singleMatch[1], 10);
        if (num >= 1 && num <= 12) {
          months.add(`${txYear}.${String(num).padStart(2, "0")}`);
        }
      }
    }

    // If no explicit month in text, fall back to transaction execution month
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
    const mMulti = orig.match(
      /(?:^|[^0-9a-zа-яөүё])((?:[1-9]|1[0-2])(?:\s*[,;/]\s*(?:[1-9]|1[0-2]))+|[1-9]|1[0-2]\s*[-~]\s*(?:[1-9]|1[0-2]))\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*(?=[^0-9a-zа-яөүё]|$)/i
    );
    if (mMulti) {
      periodMatches.push(mMulti[0].trim());
    } else {
      const mSingle = orig.match(
        /(?:^|[^0-9a-zа-яөүё])([1-9]|1[0-2])\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*(?=[^0-9a-zа-яөүё]|$)/i
      );
      if (mSingle) periodMatches.push(mSingle[0].trim());
    }
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
    // Remove months e.g. 4,5,6,7sar, 6 sar, 8-r sar, niit6nsar (strict 1-12 months only! Do not eat toot like 62-8!)
    clean = clean.replace(/(?:^|[-_.\s])(?:[1-9]|1[0-2])\s*[-~]\s*(?:[1-9]|1[0-2])\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*/gi, " ");
    clean = clean.replace(/(?:^|[-_.\s])(?:[1-9]|1[0-2])(?:\s*[,;/]\s*(?:[1-9]|1[0-2]))+\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*/gi, " ");
    clean = clean.replace(/(?:^|[-_.\s])(?:[1-9]|1[0-2])\s*(?:-[рrR]\s*)?(?:сар|sar)[а-яөүёa-z]*/gi, " ");
    clean = clean.replace(/niit\s*\d+\s*n?\s*sar/gi, " ");
    // Remove entrance numbers (орц, orts, ortz) so entrance number e.g. "1-р орц" is NEVER confused for building or toot!
    clean = clean.replace(/\b\d{1,2}\s*(?:-?[рrR]\s*)?(?:орц|orts|ortz)\b/gi, " ");
    clean = clean.replace(/(?:орц|orts|ortz)\s*[:.-]?\s*\d{1,2}\b/gi, " ");
    if (phone) clean = clean.replace(phone, " ");

    let building = "";
    let unit = "";

    // 5. 3-part pattern e.g. "217-1-45" or "217/1/45" (Building 217, Entrance 1, Toot 45)
    const mThreePart = clean.match(/\b(\d{1,4})[-/. ]+(\d{1,2})[-/. ]+(\d{1,4})\b/);
    if (mThreePart) {
      const bCand = mThreePart[1];
      const uCand = mThreePart[3];
      if (!bCand.startsWith("202") && !uCand.startsWith("202")) {
        building = bCand;
        unit = uCand.replace(/^0+/, "") || uCand;
      }
    }

    // 6. Building & Toot pattern matching:
    // Supports: "216-БАЙР. 125-ТООТ.", "216 BAIR 43 TOOT", "216-80 ТООТ", "216-26", "218.52", "217/45", "216 dugar bair 4 toot"
    if (!unit) {
      const mBldToot = clean.match(
        /\b(21[6-9]|\d{1,4})\s*[-/.]*(?:-?[рrR]?\s*(?:дугаар|dugaar)?\s*байр[.]*|\s*ба[йи]р[.]*|\s*bair[.]*)?\s*[-/.:\s]*(\d{1,4})\s*(?:[nн]\s*)?(?:тоот|toot|торт|-?[тtT]\b)?/i
      );
      if (mBldToot && !mBldToot[1].startsWith("202") && !mBldToot[2].startsWith("202")) {
        building = mBldToot[1].trim();
        unit = mBldToot[2].replace(/^0+/, "") || mBldToot[2].trim();
      }
    }

    // 7. Explicit Toot Word if not matched above (support тоот, toot, -т, т, -р тоот, үүслээ: 70 т):
    if (!unit) {
      const mToot = clean.match(/\b(\d{1,4}(?:[-/]\d{1,2}|[А-Яа-яA-Za-z])?)\s*(?:-?[рrR]\s*)?(?:[nн]\s*)?(?:тоот|toot|торт|-?[тtT]\b)\b/i) ||
        clean.match(/(?:тоот|toot|-?[тtT]\b)\s*[:.-]?\s*(\d{1,4}(?:[-/]\d{1,2}|[А-Яа-яA-Za-z])?)\b/i) ||
        clean.match(/:\s*(\d{1,4})\s*(?:тоот|toot|тоо|-?[тtT]\b)?/i);
      if (mToot && !mToot[1].startsWith("202")) {
        unit = mToot[1].replace(/^0+/, "") || mToot[1];
      }
    }

    // 8. Match official building from availableBuildings if not identified yet:
    if (!building && availableBuildings.length > 0) {
      for (const ab of availableBuildings) {
        const code = normalizeBuilding(ab);
        if (!code) continue;
        const bRegex = new RegExp(`(?:^|[^0-9a-zа-яөүё])${code}(?:-?[рrR]\\s*байр|\\s*ба[йи]р|\\s*bair|[-/. ]+(?:\\d{1,4}))`, "i");
        if (bRegex.test(clean)) {
          building = code;
          break;
        }
      }
    }

    // 9. Building alone if not matched:
    if (!building) {
      const mBair = clean.match(/\b(\d{1,4})\s*(?:-?[рrR]\s*байр|\s*ба[йи]р|\s*bair)\b/i) ||
        clean.match(/(?:байр|баир|bair)\s*[:.-]?\s*(\d{1,4})\b/i);
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

        const descClean = descStr.trim();
        const parsed = parseTransactionDescription(descStr, accName);

        // Skip parking (Зогсоол / QRGADAA) transactions completely as requested
        const isParking = Boolean(descClean.match(/qrgadaa|зогсоол|автомашин|улсын дугаар/i)) || parsed.isParking;
        if (isParking) {
          continue;
        }

        const amount = orlogoRaw;
        const { dateFormatted, fullDate, timeStr, rowMonth } = formatExcelDate(rawDateVal, rawTimeVal);
        const targetMonths = getEffectiveMonths(descStr, fullDate);
        detectedMonths.add(rowMonth);
        targetMonths.forEach((tm) => detectedMonths.add(tm));

        // Completely skip OUR SYSTEM's QPay that has contract number (ГД / GD) - already handled by system
        // External QPay or any payment without ГД MUST show as normal income!
        const hasQPay = /qpay/i.test(descStr);
        const hasGD = /(?:гд|gd|гэрээний\s*дугаар)[-:\s#_]?\d+/i.test(descStr);
        const isSystemQPay = hasQPay && hasGD;
        if (isSystemQPay) {
          continue;
        }
        const qpMatch = descClean.match(/qpay\s*[:#\-]?\s*(\d+)/i);
        const qpayPaymentId = qpMatch ? qpMatch[1] : undefined;
        const gdMatch = descClean.match(/(?:гд|gd)[-:\s]?(\d+)/i);
        const gdNumber = gdMatch ? gdMatch[1] : undefined;

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
          isQPay: isSystemQPay,
          qpayPaymentId,
          gdNumber,
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

        // Block ONLY our system QPay transactions (those with ГД) from re-registration
        if (b.isQPay) {
          b.status = "done";
          b.matchReason = "Системийн QPay төлбөр (ГД бүртгэгдсэн тул дахин бүртгэх шаардлагагүй)";
          alreadyDoneCount++;
          return;
        }

        const existingMatch = currentExisting.find((ex) => {
          // 1. Direct journal / record match (must be a valid unique transaction identifier)
          const exRec = String(ex.record || "").trim().toLowerCase();
          if (jClean && exRec && !jClean.startsWith("excel-") && !exRec.startsWith("excel-") && jClean.length >= 6) {
            if (jClean === exRec || exRec.includes(jClean) || jClean.includes(exRec)) {
              return true;
            }
          }
          // 2. Strict Compound signature: Same Amount + Same Date + (Same Related Account or Exact Description)
          if (Math.abs(ex.amount - bAmt) >= 0.01) return false;

          const exDateClean = String(ex.date || "").replace(/[-./]/g, "");
          const isDateMatch = bDateClean && exDateClean && (bDateClean.includes(exDateClean) || exDateClean.includes(bDateClean));
          if (!isDateMatch) return false;

          if (bRelAccClean && ex.relatedAccount) {
            const exRelClean = String(ex.relatedAccount).trim().toLowerCase().replace(/[\s\-_.,/()]/g, "");
            if (bRelAccClean.length >= 6 && bRelAccClean === exRelClean) return true;
          }

          if (bDescClean && ex.description) {
            const exDescClean = String(ex.description).trim().toLowerCase().replace(/[\s\-_.,/()]/g, "");
            if (bDescClean.length >= 12 && bDescClean === exDescClean) {
              return true;
            }
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
            // ONLY link if BOTH unit (toot) AND building match!
            if (
              linkedHome &&
              normalizeToot(linkedHome.unit) === normalizeToot(b.unit) &&
              isBuildingCompatible(b.building, linkedHome.building)
            ) {
              b.matchedHomeId = linkedHome.id;
              // Do NOT mark linkedHome.status = "done" so current period transactions can match
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

  // Amount compatibility helper (exact amount, multiple months 2x-12x, or within 3% tolerance)
  const isAmountCompatible = (bAmt: number, hAmt: number): boolean => {
    if (!hAmt || hAmt <= 0) return true; // neutral if no contract fee set
    if (!bAmt || bAmt <= 0) return false;
    // Exact match (+/- 2₮)
    if (Math.abs(bAmt - hAmt) <= 2) return true;
    // Multiple months (2x to 12x)
    for (let k = 2; k <= 12; k++) {
      if (Math.abs(bAmt - (hAmt * k)) <= 10) return true;
    }
    // Percentage tolerance (within 3%)
    if (Math.abs(bAmt - hAmt) / hAmt <= 0.03) return true;
    return false;
  };

  // Name matching helper with typo tolerance and strict token checking to avoid false positives on short names
  const isNameMatch = (payerName: string, desc: string, residentName: string, ovog?: string) => {
    const cleanResident = cleanNameStr(residentName);
    if (!cleanResident || cleanResident.length < 2) return false;

    const cleanPayer = cleanNameStr(payerName);
    const cleanDesc = cleanNameStr(desc);
    const cleanOvog = ovog ? cleanNameStr(ovog) : "";

    const combinedTokens = `${payerName} ${desc}`
      .split(/[\s,./_–\-]+/)
      .map(cleanNameStr)
      .filter((w) => w.length >= 2);

    // For short resident names (2-3 chars e.g. Бат, Ари, Ану, Сүх), MUST match as standalone token!
    if (cleanResident.length <= 3) {
      if (combinedTokens.includes(cleanResident)) return true;
      if (cleanOvog && cleanOvog.length >= 3 && combinedTokens.includes(cleanOvog)) return true;
      return false;
    }

    // 1. Direct contains check for names >= 4 characters
    if (cleanPayer.includes(cleanResident) || cleanDesc.includes(cleanResident)) return true;
    if (cleanResident.includes(cleanPayer) && cleanPayer.length >= 4) return true;

    // 2. Ovog match
    if (cleanOvog && cleanOvog.length >= 4 && (cleanPayer.includes(cleanOvog) || cleanDesc.includes(cleanOvog))) return true;

    // 3. Word-by-word comparison with typo tolerance
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
    // If both specify a building, they MUST strictly match
    if (normB && normH) return normB === normH;
    // If neither specifies a building, compatible only in single building complex
    if (!normB && !normH) return true;
    // If one specifies building and other does not:
    // In multi-building complexes (e.g. 216, 217, 218), this is NOT compatible to avoid wrong building match!
    if (availableBuildings.length > 1) {
      return false;
    }
    return true;
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

  // Direct match triggered by drag-and-drop or manual click pairing
  const handleDirectMatch = async (bankId: number, homeId: string | number) => {
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
            isManual: true,
            unit: targetHome.unit || b.unit,
            building:
              targetHome.building && targetHome.building !== "Байр"
                ? targetHome.building
                : b.building,
            matchReason: "Гараар чирч тулгасан",
          }
          : b.matchedHomeId === targetHome.id
            ? { ...b, status: "open", matchedHomeId: null, isManual: false }
            : b
      )
    );

    setHomes((prev) =>
      prev.map((h) =>
        String(h.id) === String(homeId)
          ? { ...h, status: "match", matchedBankId: bankId, isManual: true }
          : h.matchedBankId === bankId
            ? { ...h, status: "open", matchedBankId: null, isManual: false }
            : h
      )
    );

    setSelB((prev) => new Set([...Array.from(prev), bankId]));
    setPairBankId(null);
    setPairHomeId(null);
    setDraggedBankId(null);
    setDraggedHomeId(null);
    setDragOverHomeId(null);
    setDragOverBankId(null);

    await savePayerRule(targetBank, targetHome);

    toast.success(
      `${targetHome.unit} тоот (${targetHome.name}) ↔ ${formatNumber(targetBank.amount)}₮ амжилттай холбогдлоо!`,
      { icon: "🔗" }
    );
  };

  // Reorder homes when user drags a home row onto another home row (independent of tab, does not affect relations!)
  const reorderHomes = (draggedId: string | number, targetId: string | number) => {
    if (draggedId === targetId) return;
    setHomes((prev) => {
      const fromIdx = prev.findIndex((h) => String(h.id) === String(draggedId));
      const toIdx = prev.findIndex((h) => String(h.id) === String(targetId));
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  };

  // Reorder banks when user drags a bank row onto another bank row (independent of tab, does not affect relations!)
  const reorderBanks = (draggedId: number, targetId: number) => {
    if (draggedId === targetId) return;
    setBanks((prev) => {
      const fromIdx = prev.findIndex((b) => b.id === draggedId);
      const toIdx = prev.findIndex((b) => b.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
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
            isManual: true,
            unit: targetHome.unit || b.unit,
            building:
              targetHome.building && targetHome.building !== "Байр"
                ? targetHome.building
                : b.building,
            matchReason: "Хэрэглэгч баталгаажуулсан",
          }
          : b
      )
    );

    setHomes((prev) =>
      prev.map((h) =>
        h.id === targetHome.id
          ? { ...h, status: "match", matchedBankId: bankId, isManual: true }
          : h
      )
    );

    setSelB((prev) => new Set([...Array.from(prev), bankId]));
    await savePayerRule(targetBank, targetHome);
    toast.success(`${targetHome.unit} тоот амжилттай баталгаажлаа!`);
  };

  // Open Payment Allocation Modal (Төлбөр хуваарилалт)
  const openAllocationModal = (bank: BankRow, home: HomeRow) => {
    setAllocationModal({
      isOpen: true,
      bankId: bank.id,
      homeId: home.id,
    });
  };

  // Intelligent Multi-Tier Auto Matching (Deterministic, Idempotent, High Accuracy)
  const autoMatch = (
    currentBanks = banks,
    currentHomes = homes,
    buildingFilter = selectedBuilding,
    monthFilter = selectedMonth
  ) => {
    let matchCount = 0;
    let likelyCount = 0;

    // Filter out parking and system QPay completely
    const validBanks = currentBanks.filter((b) => !isExcludedBankRow(b));

    // Prioritize transactions belonging to the filtered/selected month!
    // This ensures an October transaction (e.g. 125 тоот 48,600₮) matches the October invoice first,
    // rather than an earlier August/September payment in the same Excel file stealing the only contract.
    const isBankInMonth = (b: BankRow, m: string) => {
      if (m === "ALL") return true;
      if (Array.isArray(b.targetMonths) && b.targetMonths.length > 0) {
        return b.targetMonths.includes(m);
      }
      return b.month === m;
    };

    const sortedBanks = [...validBanks].sort((a, b) => {
      if (monthFilter !== "ALL") {
        const aInMonth = isBankInMonth(a, monthFilter) ? 1 : 0;
        const bInMonth = isBankInMonth(b, monthFilter) ? 1 : 0;
        if (aInMonth !== bInMonth) return bInMonth - aInMonth;
      }
      return 0;
    });

    // Reset open & likely rows deterministically; preserve "done" and user-manual confirmed matches
    const newBanks: BankRow[] = sortedBanks.map((b) => {
      if (b.status === "done" || (b.status === "match" && (b as any).isManual)) return { ...b };
      return {
        ...b,
        status: "open" as const,
        matchedHomeId: null,
        matchReason: undefined,
      };
    });

    const newHomes: HomeRow[] = currentHomes.map((h) => {
      if ((h as any).isManual && h.matchedBankId && validBanks.some((b) => b.id === h.matchedBankId)) {
        return { ...h };
      }
      if (h.status === "done" && h.matchedBankId && validBanks.some((b) => b.id === h.matchedBankId)) {
        return { ...h };
      }
      return {
        ...h,
        status: "open" as const,
        matchedBankId: null,
      };
    });

    const pairMatch = (
      b: BankRow,
      h: HomeRow,
      status: "match" | "likely" = "match",
      reason?: string
    ) => {
      if (isExcludedBankRow(b) || b.status === "done" || h.status === "done") {
        return false;
      }

      const bBld = normalizeBuilding(b.building);
      const hBld = normalizeBuilding(h.building);

      // STRICT CHECK 1: NEVER pair cross-building!
      if (bBld && hBld && bBld !== hBld) {
        return false;
      }

      // STRICT CHECK 2: If bank row states a building, home row MUST belong to that building
      if (bBld && !hBld) {
        return false;
      }

      // STRICT CHECK 3: When multi-building complex exists, never attach an unassigned building bank to a building unless filter selected or name matches
      if (!bBld && availableBuildings.length > 1 && buildingFilter === "ALL") {
        // Only allow if resident name matches or rule matched!
        const isNameVerified = isNameMatch(b.name, b.description, h.name, h.ovog);
        if (!isNameVerified && status === "likely") {
          return false; // Stop accidental cross-building link!
        }
      }

      if (buildingFilter !== "ALL" && !isBuildingCompatible(buildingFilter, h.building)) {
        return false;
      }

      b.status = status;
      b.matchedHomeId = h.id;
      b.matchReason = reason || (status === "match" ? "Тулгасан" : "Магадлалтай");
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
      return true;
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
          pairMatch(b, candidate, "match", "Өмнөх баталгаажсан дүрмээр тохирсон");
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
        pairMatch(b, candidate, "match", "E-Bill баркод яг тохирсон");
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
        pairMatch(b, candidates[0], "match", "Байр, тоот, оршин суугчийн нэр тохирсон");
      }
    });

    // TIER 3: Exact Building + Exact Toot (without name match)
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
        const c = candidates[0];
        const amtMatches = isAmountCompatible(b.amount, c.amount);
        if (amtMatches) {
          pairMatch(b, c, "match", "Байр, тоот болон төлбөрийн дүн тохирсон");
        } else {
          pairMatch(b, c, "likely", "Байр, тоот тохирсон (дүн зөрүүтэй)");
        }
      }
    });

    // TIER 4: TOOT FIRST (Prioritize Toot matching, preventing false cross-building jumping)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      const bToot = normalizeToot(b.unit);
      if (!bToot) return;
      const bBld = normalizeBuilding(b.building);

      // Check if this toot exists in multiple buildings across the whole complex
      const allHomesWithThisToot = newHomes.filter((h) => normalizeToot(h.unit) === bToot);
      const tootExistsInMultipleBuildings = new Set(allHomesWithThisToot.map((h) => normalizeBuilding(h.building))).size > 1;

      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        if (bBld && hBld && bBld !== hBld) return false;
        if (bBld && !hBld) return false;
        if (normalizeToot(h.unit) !== bToot) return false;
        if (buildingFilter !== "ALL") {
          return isBuildingCompatible(buildingFilter, h.building);
        }
        return true;
      });

      if (candidates.length === 0) return;

      // Case A: Bank transaction specified a building OR organization has only 1 building OR user filtered by building
      if (bBld || availableBuildings.length <= 1 || buildingFilter !== "ALL") {
        if (candidates.length === 1) {
          const c = candidates[0];
          const nameMatches = isNameMatch(b.name, b.description, c.name, c.ovog);
          const amtMatches = isAmountCompatible(b.amount, c.amount);
          if (nameMatches) {
            pairMatch(b, c, "match", "Байр, тоот болон оршин суугчийн нэр тохирсон");
          } else if (amtMatches) {
            pairMatch(b, c, "likely", "Байр, тоот болон төлбөрийн дүн тохирсон");
          } else {
            pairMatch(b, c, "likely", "Байр, тоот тохирсон");
          }
        }
        return;
      }

      // Case B: Bank transaction did NOT specify building, and complex has multiple buildings!
      // In this case, Toot exists in multiple buildings! NEVER pair to a random building just because it's open!
      if (tootExistsInMultipleBuildings) {
        // 1. Match ONLY if resident name matches that specific building's resident!
        const nameCandidate = candidates.find((h) =>
          isNameMatch(b.name, b.description, h.name, h.ovog)
        );
        if (nameCandidate) {
          pairMatch(b, nameCandidate, "match", "Тоот болон оршин суугчийн нэрээр байрыг ялгасан");
        }
        // If name does not match, DO NOT arbitrarily pair across buildings! Leave open for user to drag.
      } else {
        // Single building in complex has this toot:
        if (candidates.length === 1) {
          const c = candidates[0];
          const nameMatches = isNameMatch(b.name, b.description, c.name, c.ovog);
          const amtMatches = isAmountCompatible(b.amount, c.amount);
          if (nameMatches) {
            pairMatch(b, c, "match", "Тоот болон оршин суугчийн нэр тохирсон");
          } else if (amtMatches) {
            pairMatch(b, c, "likely", "Тоот болон төлбөрийн дүн тохирсон");
          } else {
            pairMatch(b, c, "likely", "Тоот тохирсон");
          }
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
        if (bBld && !hBld) return false;
        if (buildingFilter !== "ALL" && !isBuildingCompatible(buildingFilter, h.building)) return false;
        return Boolean(h.phone && h.phone.includes(phoneMatch));
      });

      if (candidates.length === 1) {
        pairMatch(b, candidates[0], "likely", "Утасны дугаараар тохирсон");
      }
    });

    // TIER 6: ABSOLUTE LAST PRIORITY - Resident Name alone (Only if Toot was never found anywhere!)
    newBanks.forEach((b) => {
      if (b.status !== "open" || b.isExpense || b.isParking) return;
      // If the bank row already had a toot that failed to match, do NOT fallback to a name match in a different home!
      if (b.unit && b.unit !== "—") return;

      const bBld = normalizeBuilding(b.building);
      const candidates = newHomes.filter((h) => {
        if (h.status !== "open") return false;
        const hBld = normalizeBuilding(h.building);
        if (bBld && hBld && bBld !== hBld) return false;
        if (bBld && !hBld) return false;
        if (selectedBuilding !== "ALL" && !isBuildingCompatible(selectedBuilding, h.building)) return false;
        const nameMatches = isNameMatch(b.name, b.description, h.name, h.ovog);
        if (!nameMatches) return false;
        return isAmountCompatible(b.amount, h.amount);
      });

      if (candidates.length === 1) {
        pairMatch(b, candidates[0], "likely", "Оршин суугчийн нэр болон төлбөрийн дүнгээр тохирсон (Тоот заагаагүй)");
      }
    });

    const orderedBanks = [...newBanks].sort((a, b) => a.id - b.id);
    setBanks(orderedBanks);
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

  // Auto-clean any residual system QPay or parking rows from banks state
  useEffect(() => {
    if (banks.some(isExcludedBankRow)) {
      const sanitized = banks.filter((b) => !isExcludedBankRow(b));
      setBanks(sanitized);
      autoMatch(sanitized, homes, selectedBuilding);
    }
  }, [banks, homes, selectedBuilding]);

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
    const targetBanks = banks.filter((b) => b.status === "match" && !b.isQPay);

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

        const allocatedDun = (b.allocation && Number(b.allocation.totalAllocated) > 0)
          ? Number(b.allocation.totalAllocated)
          : null;
        const effectivePayAmount = allocatedDun !== null
          ? allocatedDun
          : b.amount;

        return {
          journal: b.journal && !b.journal.startsWith("J-") ? b.journal : `EXCEL-${Date.now()}-${b.id}`,
          date: fullDate,
          time: b.time,
          description: b.description,
          orlogo: b.amount,
          zarlaga: 0,
          amount: b.amount,
          payAmount: effectivePayAmount,
          allocatedAmount: allocatedDun,
          relatedAccount: b.relatedAccount || "",
          accName: b.accName || b.name,
          bank: "Банк",
          matchedGereeId: targetGereeId,
          detectedToot: tootStr,
          barilgiinId: resolvedBarilgaId,
          building: resolvedBuilding,
          targetPeriod: b.targetPeriod || "",
          allocation: b.allocation,
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
      // Completely skip parking and system QPay
      if (isExcludedBankRow(x)) return false;

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
        const bMonths = (Array.isArray(x.targetMonths) && x.targetMonths.length > 0)
          ? x.targetMonths
          : [x.month || ""];
        if (!bMonths.includes(selectedMonth)) return false;
      }
      // If user is in "open" tab, keep manually matched rows visible so dragging doesn't jump them to another tab!
      if (tab !== "all" && x.status !== tab && !(tab === "open" && (x as any).isManual)) return false;
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
      if (tab !== "all" && x.status !== tab && !(tab === "open" && (x as any).isManual)) return false;
      if (homeSearch.trim()) {
        const q = homeSearch.toLowerCase().trim();
        const str = [x.name, x.unit, x.building, x.amount, x.note].join(" ").toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [homes, tab, homeSearch, selectedMonth, selectedBuilding]);

  // Aligned side-by-side row display with separate, independent search support:
  const displayRows = useMemo(() => {
    const sBanks = [...filteredBanks];
    const sHomes = [...filteredHomes];

    const rows: { bank: BankRow | null; home: HomeRow | null }[] = [];
    const usedHomeIds = new Set<string | number>();
    const usedBankIds = new Set<number>();

    // 1. Paired rows: bank in filteredBanks matched to home in filteredHomes
    sBanks.forEach((b) => {
      if ((b.status === "match" || b.status === "done" || b.status === "likely") && b.matchedHomeId != null) {
        const matchedHome = sHomes.find((h) => h.id === b.matchedHomeId);
        if (matchedHome) {
          const pairedHome = {
            ...matchedHome,
            status: matchedHome.status === "open" ? b.status : matchedHome.status,
            matchedBankId: matchedHome.matchedBankId || b.id,
          };
          rows.push({ bank: b, home: pairedHome });
          usedHomeIds.add(matchedHome.id);
          usedBankIds.add(b.id);
        }
      }
    });

    // If viewing "Тулгасан" tab, show only the matched pairs
    if (tab === "match") {
      return rows;
    }

    // 2. Remaining unmatched banks and homes (independent for both sides)
    const unmatchedBanks = sBanks.filter((b) => !usedBankIds.has(b.id));
    const unmatchedHomes = sHomes
      .filter((h) => !usedHomeIds.has(h.id))
      .map((h) => {
        // If a home has no paired bank in current filtered banks, it must show as open!
        if (h.status === "match" || h.status === "likely") {
          return { ...h, status: "open" as const, matchedBankId: null };
        }
        return h;
      });

    const maxUnmatched = Math.max(unmatchedBanks.length, unmatchedHomes.length);
    for (let i = 0; i < maxUnmatched; i++) {
      rows.push({
        bank: unmatchedBanks[i] || null,
        home: unmatchedHomes[i] || null,
      });
    }

    return rows;
  }, [filteredBanks, filteredHomes, tab]);

  // Sequential row numbering for both Left (Bank) and Right (Home) tables
  const displayRowsWithNumbers = useMemo(() => {
    let bankCounter = 0;
    let homeCounter = 0;
    return displayRows.map((row) => {
      const bankNo = row.bank ? ++bankCounter : null;
      const homeNo = row.home ? ++homeCounter : null;
      return {
        ...row,
        bankNo,
        homeNo,
      };
    });
  }, [displayRows]);

  // Statistics calculation
  const stats = useMemo(() => {
    const list = banks.filter((x) => {
      if (isExcludedBankRow(x)) return false;
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
        const bMonths = (Array.isArray(x.targetMonths) && x.targetMonths.length > 0)
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
                      onChange={(e) => {
                        const nextMonth = e.target.value;
                        setSelectedMonth(nextMonth);
                        autoMatch(banks, homes, selectedBuilding, nextMonth);
                      }}
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
                          autoMatch(banks, homes, nextBld);
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
                    onClick={handleClose}
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
                            className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${active
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
                        onClick={() => autoMatch(banks, homes, selectedBuilding, selectedMonth)}
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
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${selectedMonth === "ALL"
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
                          {/* Left (Bank): 50% */}
                          <col style={{ width: "38px" }} />
                          <col style={{ width: "85px" }} />
                          <col style={{ width: "100px" }} />
                          <col style={{ width: "calc(50% - 318px)" }} />
                          <col style={{ width: "95px" }} />

                          {/* Right (Home): 50% */}
                          <col style={{ width: "38px" }} />
                          <col style={{ width: "100px" }} />
                          <col style={{ width: "calc(50% - 233px)" }} />
                          <col style={{ width: "95px" }} />
                        </colgroup>

                        {/* UNIFIED THEAD: EXACT 50 / 50 HALF AND HALF */}
                        <thead className="sticky top-0 z-30 select-none">
                          <tr className="h-10">
                            {/* Left Table Headers: Дансны хуулга (50%) */}
                            <th className="sticky top-0 z-30 h-10 py-0 px-2 text-center align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              №
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-3 text-left align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Огноо
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-3 text-left align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Байр, тоот
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-3 text-left align-middle font-semibold text-xs truncate bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Гүйлгээний утга
                            </th>
                            <th className="sticky top-0 z-30 h-10 py-0 px-4 text-right align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-r border-zinc-200 dark:border-zinc-700 shadow-xs">
                              Орлого ₮
                            </th>

                            {/* Right Table Headers: Айлын төлбөр (50%) */}
                            <th className="sticky top-0 z-30 h-10 py-0 px-2 text-center align-middle font-semibold text-xs whitespace-nowrap bg-[#f4f7f5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-xs">
                              №
                            </th>
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
                          {displayRowsWithNumbers.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                                Илэрц олдсонгүй
                              </td>
                            </tr>
                          ) : (
                            displayRowsWithNumbers.map(({ bank: b, home: h, bankNo, homeNo }, idx) => {
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

                              // Drag and Drop active target indicators (supports both within list reordering & across matching)
                              const isDragTargetBank = Boolean(
                                b && dragOverBankId === b.id && (draggedHomeId !== null || (draggedBankId !== null && draggedBankId !== b.id))
                              );
                              const isDragTargetHome = Boolean(
                                h && dragOverHomeId === h.id && (draggedBankId !== null || (draggedHomeId !== null && draggedHomeId !== h.id))
                              );
                              const isDragConnecting = (draggedBankId && dragOverHomeId === h?.id) || (draggedHomeId && dragOverBankId === b?.id);

                              // Distinct cell colors
                              const bankBg = isDragTargetBank
                                ? "bg-emerald-100 dark:bg-emerald-950/70 ring-2 ring-emerald-500 shadow-md"
                                : isPairSelectedBank
                                  ? "bg-[#e0f2fe] dark:bg-sky-950/50"
                                  : !b
                                    ? "bg-zinc-50 dark:bg-zinc-900/30"
                                    : isBankMatched
                                      ? "bg-[#eaf5ef] dark:bg-emerald-950/30 hover:bg-[#e1f0e7]"
                                      : isBankLikely
                                        ? "bg-[#fefce8] dark:bg-amber-950/30 hover:bg-[#fef9c3]"
                                        : "bg-[#fef2f2] dark:bg-rose-950/30 hover:bg-[#fde8e8]";

                              const homeBg = isDragTargetHome
                                ? "bg-emerald-100 dark:bg-emerald-950/70 ring-2 ring-emerald-500 shadow-md"
                                : isPairSelectedHome
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

                                if (!isNaN(num) && num > 0 && num < 1) {
                                  const totalSec = Math.round(num * 86400);
                                  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
                                  const min = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
                                  return { date: "2026.10.20", time: `${hh}:${min}` };
                                }

                                const m = raw.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
                                if (m) {
                                  const timeM = (raw + " " + rawTime).match(/(\d{1,2}):(\d{1,2})/);
                                  return {
                                    date: `${m[1]}.${m[2].padStart(2, "0")}.${m[3].padStart(2, "0")}`,
                                    time: timeM ? `${timeM[1].padStart(2, "0")}:${timeM[2].padStart(2, "0")}` : (rawTime && /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime : "12:00")
                                  };
                                }

                                if (/^\.?\d+/.test(raw) || raw.length > 10) {
                                  return { date: "2026.10.20", time: rawTime && /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime : "12:00" };
                                }

                                return { date: raw || "2026.10.20", time: rawTime && /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime : "12:00" };
                              })();

                              return (
                                <tr
                                  key={`row-${idx}`}
                                  className={`h-[60px] transition select-none group ${(draggedBankId === b?.id || draggedHomeId === h?.id) ? "opacity-60" : ""
                                    }`}
                                >
                                  {/* LEFT 5 CELLS: BANK TRANSACTION (50% OF ROW) */}
                                  {b ? (
                                    <>
                                      {/* Cell 0: № */}
                                      <td
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-1 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none cursor-pointer ${bankBg}`}
                                      >
                                        {bankNo}
                                      </td>

                                      {/* Cell 1: Огноо */}
                                      <td
                                        draggable={true}
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData("text/plain", JSON.stringify({ type: "bank", id: b.id }));
                                          e.dataTransfer.effectAllowed = "move";
                                          setDraggedBankId(b.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedBankId(null);
                                          setDragOverHomeId(null);
                                          setDragOverBankId(null);
                                        }}
                                        onDragOver={(e) => {
                                          if (draggedHomeId || (draggedBankId && draggedBankId !== b.id)) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                            if (dragOverBankId !== b.id) setDragOverBankId(b.id);
                                          }
                                        }}
                                        onDragLeave={() => {
                                          if (dragOverBankId === b.id) setDragOverBankId(null);
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (draggedHomeId && b.status !== "done") {
                                            handleDirectMatch(b.id, draggedHomeId);
                                          } else if (draggedBankId && draggedBankId !== b.id) {
                                            reorderBanks(draggedBankId, b.id);
                                          }
                                          setDraggedHomeId(null);
                                          setDraggedBankId(null);
                                          setDragOverBankId(null);
                                        }}
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${bankBg}`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span title="Чирч зөөх эсвэл айлын төлбөртэй холбох" className="cursor-grab shrink-0">
                                            <GripVertical className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                                          </span>
                                          <div>
                                            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight whitespace-nowrap">
                                              {displayDate}
                                            </div>
                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 whitespace-nowrap font-normal">
                                              {displayTime}
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Cell 2: Байр, тоот (Dedicated Bank Column matching Home side) */}
                                      <td
                                        draggable={true}
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData("text/plain", JSON.stringify({ type: "bank", id: b.id }));
                                          e.dataTransfer.effectAllowed = "move";
                                          setDraggedBankId(b.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedBankId(null);
                                          setDragOverHomeId(null);
                                          setDragOverBankId(null);
                                        }}
                                        onDragOver={(e) => {
                                          if (draggedHomeId || (draggedBankId && draggedBankId !== b.id)) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                            if (dragOverBankId !== b.id) setDragOverBankId(b.id);
                                          }
                                        }}
                                        onDragLeave={() => {
                                          if (dragOverBankId === b.id) setDragOverBankId(null);
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (draggedHomeId && b.status !== "done") {
                                            handleDirectMatch(b.id, draggedHomeId);
                                          } else if (draggedBankId && draggedBankId !== b.id) {
                                            reorderBanks(draggedBankId, b.id);
                                          }
                                          setDraggedHomeId(null);
                                          setDraggedBankId(null);
                                          setDragOverBankId(null);
                                        }}
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${bankBg}`}
                                      >
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight whitespace-nowrap">
                                          {b.unit && b.unit !== "—" ? (
                                            `${b.unit} тоот`
                                          ) : (
                                            <span className="text-zinc-400 font-normal italic text-[11px]">Тоотгүй</span>
                                          )}
                                        </div>
                                        <div
                                          className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5 truncate"
                                          title={b.building || ""}
                                        >
                                          {b.building && b.building !== "Байр" && b.building !== "—" ? (
                                            formatBuildingShort(b.building)
                                          ) : (
                                            <span className="text-zinc-400 font-normal text-[10px]">Байр заагаагүй</span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Cell 3: Гүйлгээний утга */}
                                      <td
                                        draggable={true}
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData("text/plain", JSON.stringify({ type: "bank", id: b.id }));
                                          e.dataTransfer.effectAllowed = "move";
                                          setDraggedBankId(b.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedBankId(null);
                                          setDragOverHomeId(null);
                                          setDragOverBankId(null);
                                        }}
                                        onDragOver={(e) => {
                                          if (draggedHomeId || (draggedBankId && draggedBankId !== b.id)) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                            if (dragOverBankId !== b.id) setDragOverBankId(b.id);
                                          }
                                        }}
                                        onDragLeave={() => {
                                          if (dragOverBankId === b.id) setDragOverBankId(null);
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (draggedHomeId && b.status !== "done") {
                                            handleDirectMatch(b.id, draggedHomeId);
                                          } else if (draggedBankId && draggedBankId !== b.id) {
                                            reorderBanks(draggedBankId, b.id);
                                          }
                                          setDraggedHomeId(null);
                                          setDraggedBankId(null);
                                          setDragOverBankId(null);
                                        }}
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${bankBg}`}
                                      >
                                        <div className="flex items-center justify-between gap-2 h-full">
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold truncate" title={b.name}>
                                              {b.name || "Гүйлгээ"}
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
                                              {b.isQPay && (
                                                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shrink-0">
                                                  QPay бүртгэгдсэн
                                                </span>
                                              )}
                                              {b.targetPeriod && (
                                                <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                                                  {b.targetPeriod}
                                                </span>
                                              )}
                                              {b.allocation && Object.keys(b.allocation.months || {}).length > 0 && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shrink-0">
                                                  <Layers className="w-2.5 h-2.5 text-emerald-600" />
                                                  {Object.keys(b.allocation.months).length} сар хуваарилсан
                                                </span>
                                              )}
                                              <span className="truncate">{b.description}</span>
                                            </div>
                                          </div>

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
                                                <span
                                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 whitespace-nowrap shrink-0"
                                                  title={b.matchReason}
                                                >
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
                                              <span
                                                className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${b.isQPay
                                                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                                  } shrink-0`}
                                                title={b.matchReason}
                                              >
                                                {b.isQPay ? "QPay бүртгэгдсэн" : "Бүртгэсэн"}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Cell 4: Орлого ₮ */}
                                      <td
                                        onClick={() => setPairBankId((prev) => (prev === b.id ? null : b.id))}
                                        className={`py-2 px-4 text-right whitespace-nowrap cursor-pointer border-r border-zinc-200 dark:border-zinc-700 ${bankBg}`}
                                      >
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">
                                          {formatNumber(b.amount)} ₮
                                        </div>
                                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Орлого</div>
                                        {h && (b.status === "match" || b.status === "likely") && (
                                          <div className="mt-1 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openAllocationModal(b, h);
                                              }}
                                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition shadow-xs cursor-pointer ${b.allocation && Object.keys(b.allocation.months || {}).length > 0
                                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200"
                                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                                }`}
                                              title="Төлбөр хуваарилалт хийх"
                                            >
                                              <Layers className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                              {b.allocation && Object.keys(b.allocation.months || {}).length > 0
                                                ? `${Object.keys(b.allocation.months).length} сар (${formatNumber(b.allocation.totalAllocated)}₮)`
                                                : b.amount > (h.amount || 0)
                                                  ? "Төлбөр хуваарилах"
                                                  : "Хуваарилалт"}
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={5} className={`py-2 px-3 text-center text-[11px] text-zinc-400 dark:text-zinc-600 italic border-r border-zinc-200 dark:border-zinc-700 ${bankBg}`}>
                                      —
                                    </td>
                                  )}

                                  {/* RIGHT 4 CELLS: RESIDENT / HOME (50% OF ROW) */}
                                  {h ? (
                                    <>
                                      {/* Cell 5: № */}
                                      <td
                                        onClick={() => toggleHomeRow(h.id)}
                                        className={`py-2 px-1 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none cursor-pointer ${homeBg}`}
                                      >
                                        {homeNo}
                                      </td>

                                      {/* Cell 6: Байр, тоот */}
                                      <td
                                        draggable={true}
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData("text/plain", JSON.stringify({ type: "home", id: h.id }));
                                          e.dataTransfer.effectAllowed = "move";
                                          setDraggedHomeId(h.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedHomeId(null);
                                          setDragOverBankId(null);
                                          setDragOverHomeId(null);
                                        }}
                                        onDragOver={(e) => {
                                          if (draggedBankId || (draggedHomeId && draggedHomeId !== h.id)) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                            if (dragOverHomeId !== h.id) setDragOverHomeId(h.id);
                                          }
                                        }}
                                        onDragLeave={() => {
                                          if (dragOverHomeId === h.id) setDragOverHomeId(null);
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (draggedBankId && h.status !== "done") {
                                            handleDirectMatch(draggedBankId, h.id);
                                          } else if (draggedHomeId && draggedHomeId !== h.id) {
                                            reorderHomes(draggedHomeId, h.id);
                                          }
                                          setDraggedBankId(null);
                                          setDraggedHomeId(null);
                                          setDragOverHomeId(null);
                                        }}
                                        onClick={() => toggleHomeRow(h.id)}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${homeBg}`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span title="Чирч зөөх эсвэл банкны гүйлгээтэй холбох" className="cursor-grab shrink-0">
                                            <GripVertical className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                                          </span>
                                          <div>
                                            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight whitespace-nowrap">
                                              {h.unit} тоот
                                            </div>
                                            <div
                                              className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5 truncate"
                                              title={h.building || baiguullaga?.ner || ""}
                                            >
                                              {formatBuildingShort(h.building)}
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Cell 7: Оршин суугч */}
                                      <td
                                        draggable={true}
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData("text/plain", JSON.stringify({ type: "home", id: h.id }));
                                          e.dataTransfer.effectAllowed = "move";
                                          setDraggedHomeId(h.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedHomeId(null);
                                          setDragOverBankId(null);
                                          setDragOverHomeId(null);
                                        }}
                                        onDragOver={(e) => {
                                          if (draggedBankId || (draggedHomeId && draggedHomeId !== h.id)) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                            if (dragOverHomeId !== h.id) setDragOverHomeId(h.id);
                                          }
                                        }}
                                        onDragLeave={() => {
                                          if (dragOverHomeId === h.id) setDragOverHomeId(null);
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (draggedBankId && h.status !== "done") {
                                            handleDirectMatch(draggedBankId, h.id);
                                          } else if (draggedHomeId && draggedHomeId !== h.id) {
                                            reorderHomes(draggedHomeId, h.id);
                                          }
                                          setDraggedBankId(null);
                                          setDraggedHomeId(null);
                                          setDragOverHomeId(null);
                                        }}
                                        onClick={() => toggleHomeRow(h.id)}
                                        className={`py-2 px-3 cursor-pointer overflow-hidden ${homeBg}`}
                                      >
                                        <div className="flex items-center justify-between gap-2 h-full">
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold truncate" title={h.name}>
                                              {h.name}
                                            </div>
                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" title={h.note}>
                                              {h.note}
                                            </div>
                                          </div>

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
                                              <span
                                                className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${h.qpayPaid
                                                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                                  } shrink-0`}
                                              >
                                                {h.qpayPaid ? "QPay төлсөн" : "Бүртгэсэн"}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Cell 8: Төлбөр ₮ */}
                                      <td
                                        onClick={() => toggleHomeRow(h.id)}
                                        className={`py-2 px-4 text-right whitespace-nowrap cursor-pointer ${homeBg}`}
                                      >
                                        <div className="text-xs text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">
                                          {h.qpayPaid ? 0 : formatNumber(h.amount)} ₮
                                        </div>
                                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                          {h.qpayPaid ? "QPay төлөгдсөн" : "Нэхэмжлэх"}
                                        </div>
                                        {b && (b.status === "match" || b.status === "likely") && (
                                          <div className="mt-1 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openAllocationModal(b, h);
                                              }}
                                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                                              title="Төлбөр хуваарилах"
                                            >
                                              <Layers className="w-2.5 h-2.5" />
                                              {b.allocation ? "Засах" : "Хуваарилах"}
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={4} className={`py-2 px-3 text-center text-[11px] text-zinc-400 dark:text-zinc-600 italic ${homeBg}`}>
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
                        Тулгасан: {displayRows.filter((r) => r.bank && r.home && (r.home.status === "match" || r.home.status === "done")).length}
                      </span>
                      <span className="text-zinc-400">·</span>
                      <span className="text-rose-700 dark:text-rose-400">
                        Тулгаагүй: {filteredHomes.length - displayRows.filter((r) => r.bank && r.home && (r.home.status === "match" || r.home.status === "done")).length}
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
                    onClick={handleClose}
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

      {/* Payment Allocation Modal (Төлбөр хуваарилалт) */}
      <AnimatePresence>
        {allocationModal.isOpen && (
          <PaymentAllocationModal
            isOpen={allocationModal.isOpen}
            onClose={() => setAllocationModal((prev) => ({ ...prev, isOpen: false }))}
            bank={banks.find((b) => b.id === allocationModal.bankId) || null}
            home={homes.find((h) => String(h.id) === String(allocationModal.homeId)) || null}
            onSave={(bankId, targetMonths, targetPeriod, allocation) => {
              setBanks((prev) =>
                prev.map((b) =>
                  b.id === bankId
                    ? {
                      ...b,
                      targetMonths: targetMonths.length > 0 ? targetMonths : b.targetMonths,
                      targetPeriod: targetPeriod || b.targetPeriod,
                      allocation,
                    }
                    : b
                )
              );
              setAllocationModal((prev) => ({ ...prev, isOpen: false }));
              const h = homes.find((hm) => String(hm.id) === String(allocationModal.homeId));
              toast.success(
                `${h?.unit || ""} тоот: ${targetMonths.length} сарын төлбөр (${formatNumber(allocation.totalAllocated)} ₮) амжилттай хуваарилагдлаа!`,
                { icon: "⚡" }
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* Close Confirmation Dialog Modal */}
      <AnimatePresence>
        {showCloseConfirm && (
          <div className="fixed inset-0 z-[12030] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#e7ece9] dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#203a35] dark:text-white leading-tight">
                    Цонхыг хаах уу?
                  </h3>
                  <p className="text-xs text-[#7c8b85] mt-0.5">
                    Хадгалаагүй тулгалт болон өөрчлөлт устах болно.
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-[#fbfcfb] dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                Таны оруулсан банкны хуулга болон хийгдсэн тулгалтууд бүртгэгдээгүй байна. Цонхыг хаавал одоогийн хуулгын өгөгдөл цуцлагдахыг анхаарна уу.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-[#dce5e0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#203a35] dark:text-zinc-200 hover:bg-[#edf5f1] dark:hover:bg-zinc-800/80 transition cursor-pointer"
                >
                  Үргэлжлүүлэх
                </button>
                <button
                  type="button"
                  onClick={forceClose}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Цонхыг хаах
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
