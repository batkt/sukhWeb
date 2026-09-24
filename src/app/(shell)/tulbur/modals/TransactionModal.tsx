"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Calendar, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { message } from "antd";
import Button from "@/components/ui/Button";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";

function DoubleYearMonthPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const initialYear = value ? parseInt(value.split("-")[0], 10) : new Date().getFullYear();
  const [startYear, setStartYear] = useState(initialYear || 2026);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const months = [
    { num: 1, label: "1 cap" },
    { num: 2, label: "2 cap" },
    { num: 3, label: "3 cap" },
    { num: 4, label: "4 cap" },
    { num: 5, label: "5 cap" },
    { num: 6, label: "6 cap" },
    { num: 7, label: "7 cap" },
    { num: 8, label: "8 cap" },
    { num: 9, label: "9 cap" },
    { num: 10, label: "10 cap" },
    { num: 11, label: "11 cap" },
    { num: 12, label: "12 cap" },
  ];

  const handleSelectMonth = (year: number, monthNum: number) => {
    const paddedMonth = String(monthNum).padStart(2, "0");
    onChange(`${year}-${paddedMonth}`);
    setIsOpen(false);
  };

  const formattedDisplay = (() => {
    if (!value) return "Сар сонгоно уу";
    const [y, m] = value.split("-");
    const monthInt = parseInt(m, 10);
    return `${y} он ${monthInt} сар`;
  })();

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3 py-2.5 border border-theme/30 bg-[color:var(--surface-bg)] text-brand rounded-2xl focus:outline-none focus:ring-2 focus:ring-theme/30 focus:border-theme transition-all text-sm font-medium flex items-center justify-between cursor-pointer"
      >
        <span>{formattedDisplay}</span>
        <Calendar className="w-4 h-4 text-brand" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-[13000] !bg-[color:var(--surface-bg)] !opacity-100 border border-[color:var(--surface-border)] rounded-2xl shadow-2xl p-4 w-[480px] sm:w-[520px] select-none text-[color:var(--panel-text)] shadow-[color:var(--surface-border)]/30"
          >
            {/* Top Navigation Bar: <<  2026                 2027  >> */}
            <div className="flex items-center justify-between pb-3 border-b border-[color:var(--surface-border)] mb-3 px-2">
              <button
                type="button"
                onClick={() => setStartYear((prev) => prev - 2)}
                className="p-1.5 rounded-lg hover:bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition-colors font-medium text-xs flex items-center gap-1"
                title="Өмнөх 2 он"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 grid grid-cols-2 text-center font-medium text-[color:var(--panel-text)] text-sm">
                <div>{startYear}</div>
                <div>{startYear + 1}</div>
              </div>

              <button
                type="button"
                onClick={() => setStartYear((prev) => prev + 2)}
                className="p-1.5 rounded-lg hover:bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition-colors font-medium text-xs flex items-center gap-1"
                title="Дараах 2 он"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Side-by-Side Year Grids */}
            <div className="grid grid-cols-2 gap-6">
              {/* Year 1 Grid */}
              <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                {months.map((m) => {
                  const monthVal = `${startYear}-${String(m.num).padStart(2, "0")}`;
                  const isSelected = value === monthVal;
                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => handleSelectMonth(startYear, m.num)}
                      className={`
                        py-2 px-1 text-center text-xs font-medium rounded-xl transition-all
                        ${
                          isSelected
                            ? "bg-theme text-white font-medium shadow-sm"
                            : "text-[color:var(--panel-text)] hover:bg-theme/10 dark:hover:bg-theme/40 hover:text-brand"
                        }
                      `}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Year 2 Grid */}
              <div className="grid grid-cols-3 gap-y-3 gap-x-2 border-l border-[color:var(--surface-border)] pl-4">
                {months.map((m) => {
                  const monthVal = `${startYear + 1}-${String(m.num).padStart(2, "0")}`;
                  const isSelected = value === monthVal;
                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => handleSelectMonth(startYear + 1, m.num)}
                      className={`
                        py-2 px-1 text-center text-xs font-medium rounded-xl transition-all
                        ${
                          isSelected
                            ? "bg-theme text-white font-medium shadow-sm"
                            : "text-[color:var(--panel-text)] hover:bg-theme/10 dark:hover:bg-theme/40 hover:text-brand"
                        }
                      `}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TransactionModalProps {
  show: boolean;
  onClose: () => void;
  resident?: any;
  onSubmit: (data: TransactionData) => Promise<void>;
  isProcessing?: boolean;
  /** For electricity (цахилгаан) auto-calc: org and building */
  token?: string;
  baiguullagiinId?: string;
  barilgiinId?: string | null;
  /**
   * Ажилтанд «Хөнгөлөлт» төрлөөр гүйлгээ бүртгэх эрх байгаа эсэх
   * (`tulbur.khungulultOruulakh`). Эрхгүй бол тухайн сонголт харагдахгүй.
   * Өгөгдөөгүй бол зөвшөөрнө — ингэснээр энэ цонхыг ашигладаг бусад газар
   * хэвээрээ ажиллана.
   */
  canAddDiscount?: boolean;
}

export interface TransactionData {
  type:
    | "voucher"
    | "avlaga"
    | "turul"
    | "ashiglalt"
    | "torguuli"
    | "tulult"
    | "khungulult"
    | "busad";
  /** «Бусад» төрлийн дэд ангилал (одоогоор зөвхөн "barter"). */
  busadTurul?: string;
  date: string;
  amount: number;
  residentId?: string;
  gereeniiId?: string;
  tailbar?: string;
  ekhniiUldegdel: boolean;
  discountType?: "percent" | "amount";
  discountValue?: number;
  reason?: string;
}

/** 1234567.5 -> "1,234,567.50" */
const mungunDunFormat = (n: number) =>
  (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Бичиж байх үед мянгатын таслал тавина ("100000" -> "100,000").
 *
 * Бутархайг 2 орноор хязгаарлах ба "1234." гэж бичиж байхад цэгийг нь
 * устгахгүй — эс тэгвээс бутархай оруулах боломжгүй болно. Хадгалах үед
 * `handleSubmit` таслалыг аль хэдийн цэвэрлэдэг тул state-д форматтай
 * тэмдэгт мөр хадгалах нь аюулгүй.
 */
const dunFormatlay = (raw: string): string => {
  const tsever = String(raw).replace(/[^\d.]/g, "");
  const kheseguud = tsever.split(".");
  const butenToo = (kheseguud[0] || "").replace(/^0+(?=\d)/, "");
  const butarkhai = kheseguud.length > 1 ? kheseguud[1].slice(0, 2) : null;
  const tasalsan = butenToo ? Number(butenToo).toLocaleString("en-US") : "";
  if (butarkhai === null) return tasalsan;
  return `${tasalsan || "0"}.${butarkhai}`;
};

/** Хувь — таслалгүй, 0-100 хооронд, 2 орны бутархайтай. */
const khuviFormatlay = (raw: string): string => {
  const tsever = String(raw).replace(/[^\d.]/g, "");
  const kheseguud = tsever.split(".");
  let buten = (kheseguud[0] || "").replace(/^0+(?=\d)/, "");
  if (buten && Number(buten) > 100) buten = "100";
  const butarkhai =
    kheseguud.length > 1 ? kheseguud.slice(1).join("").slice(0, 2) : null;
  if (butarkhai === null) return buten;
  return `${buten || "0"}.${butarkhai}`;
};

/** Хөнгөлөлтийн доод мөрийн нэг нүд. */
const KhungulultiinMur = ({
  ner,
  utga,
  onts,
}: {
  ner: string;
  utga: string;
  onts?: boolean;
}) => (
  <div className="flex flex-col">
    <span className="text-[11px] text-brand/70">
      {ner}
    </span>
    <span
      className={
        onts
          ? "text-[13px] font-medium tabular-nums text-brand"
          : "text-[13px] font-medium tabular-nums text-brand"
      }
    >
      {utga}₮
    </span>
  </div>
);

export default function TransactionModal({
  show,
  onClose,
  resident,
  onSubmit,
  isProcessing = false,
  token,
  baiguullagiinId,
  barilgiinId,
  canAddDiscount = true,
}: TransactionModalProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const constraintsRef = React.useRef<HTMLDivElement>(null);
  const amountInputRef = React.useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();
  const [transactionType, setTransactionType] =
    useState<TransactionData["type"]>("avlaga");
  /**
   * «Бусад» сонгоход гарах дэд ангилал. Одоогоор зөвхөн бартер боловч
   * жагсаалт нь өсөх бодолтой тул эхнээсээ dropdown хэлбэрээр.
   */
  const [busadTurul, setBusadTurul] = useState("barter");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState("");
  const [tailbar, setTailbar] = useState("");
  const [ekhniiUldegdel, setEkhniiUldegdel] = useState(false);
  const [lastShow, setLastShow] = useState(false);

  // Хөнгөлөлт (Discount) fields
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountMonth, setDiscountMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  // Ашиглалтын зардал (цахилгаан кВт) – additional fields when type === "ashiglalt"
  const [ashiglaltZardal, setAshiglaltZardal] = useState<"" | "tsakhilgaan_kv">(
    "",
  );
  const [umnukhZaalt, setUmnukhZaalt] = useState("");
  const [suuliinZaalt, setSuuliinZaalt] = useState("");
  const [showUsageOnInvoice, setShowUsageOnInvoice] = useState(true);
  const [includeSuuriKhuraamj, setIncludeSuuriKhuraamj] = useState(true);
  const [isCalculatingTsakhilgaan, setIsCalculatingTsakhilgaan] =
    useState(false);
  const [calcBreakdown, setCalcBreakdown] = useState<{
    usageAmount: number;
    suuriKhuraamj: number;
    zoruu: number;
    selectedCharge?: string;
  } | null>(null);
  const [residentBalance, setResidentBalance] = useState<number | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [isFetchingLatest, setIsFetchingLatest] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  // Simplified ashiglalt UI: keep amount fully manual, disable legacy auto-calc side effects.
  const useLegacyAshiglaltCalculator = false;

  // Determine if umnukhZaalt is editable (if initial value is 0 or undefined)
  const initialUmnukhVal = resident?.umnukhZaalt ?? resident?.suuliinZaalt;
  const isUmnukhEditable = !initialUmnukhVal || Number(initialUmnukhVal) === 0;

  const formatAmount = (val: number | string): string => {
    const clean = String(val).replace(/,/g, "");
    const num = parseFloat(clean);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatWhileTyping = (val: string) => {
    const clean = val.replace(/,/g, "").replace(/[^\d.]/g, "");
    const dotIdx = clean.indexOf(".");
    let intRaw: string;
    let fracRaw: string;
    const endsWithDot = clean.endsWith(".") && clean.split(".").length <= 2;

    if (dotIdx === -1) {
      intRaw = clean;
      fracRaw = "";
    } else {
      intRaw = clean.slice(0, dotIdx);
      fracRaw = clean.slice(dotIdx + 1).replace(/\./g, "");
    }

    const intDigits = intRaw.replace(/\D/g, "");
    const intFormatted = intDigits
      ? intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "";

    if (dotIdx !== -1 && fracRaw === "" && endsWithDot) {
      return intFormatted + ".";
    }

    if (!intDigits && fracRaw !== "") {
      return "." + fracRaw.replace(/\D/g, "").slice(0, 10);
    }

    if (fracRaw !== "") {
      const fd = fracRaw.replace(/\D/g, "").slice(0, 10);
      return intFormatted + "." + fd;
    }

    return intFormatted;
  };

  const getCursorPosByNonCommaCount = (val: string, nonCommaCount: number) => {
    if (nonCommaCount <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== ",") seen++;
      if (seen >= nonCommaCount) return i + 1;
    }
    return val.length;
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cursor = e.target.selectionStart ?? raw.length;
    const nonCommaBeforeCursor = raw.slice(0, cursor).replace(/,/g, "").length;
    const formatted = formatWhileTyping(raw);
    setAmount(formatted);

    requestAnimationFrame(() => {
      const el = amountInputRef.current;
      if (!el || document.activeElement !== el) return;
      const nextPos = getCursorPosByNonCommaCount(
        formatted,
        nonCommaBeforeCursor,
      );
      el.setSelectionRange(nextPos, nextPos);
    });
  };

  const resetForm = () => {
    setTransactionType("avlaga");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setAmount("");
    setTailbar("");
    setEkhniiUldegdel(false);
    setAshiglaltZardal("");
    setUmnukhZaalt("");
    setSuuliinZaalt("");
    setShowUsageOnInvoice(true);
    setIncludeSuuriKhuraamj(true);
    setCalcBreakdown(null);
    setDiscountType("percent");
    setDiscountMonth(new Date().toISOString().slice(0, 7));
    setDiscountValue("");
    setDiscountReason("");
  };

  const handleClose = () => {
    resetForm();
    setShowConfirmClose(false);
    onClose();
  };

  // hasChanges: any meaningful user input detected
  const hasChanges =
    (amount !== "" && amount !== "0" && amount !== "0.00") ||
    tailbar.trim() !== "" ||
    umnukhZaalt.trim() !== "" ||
    suuliinZaalt.trim() !== "" ||
    discountValue.trim() !== "" ||
    discountReason.trim() !== "";

  const requestClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      handleClose();
    }
  };

  const fetchLatestZaalt = async () => {
    if (
      !resident ||
      !show ||
      transactionType !== "ashiglalt" ||
      ashiglaltZardal !== "tsakhilgaan_kv"
    )
      return;

    setIsFetchingLatest(true);
    try {
      console.log("[LATEST] Fetching latest reading for:", resident._id);
      const res = await uilchilgee(token!).get("/latestZaaltAvya", {
        params: {
          baiguullagiinId,
          residentId: resident._id,
          gereeniiId: resident.gereeniiId,
          gereeniiDugaar: resident.gereeniiDugaar,
        },
      });

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        console.log("[LATEST] Found:", d);
        if (d.umnukhZaalt != null) setUmnukhZaalt(String(d.umnukhZaalt));
        if (d.suuliinZaalt != null) setSuuliinZaalt(String(d.suuliinZaalt));
      }
    } catch (error) {
      console.error("[LATEST] Error fetching readings:", error);
    } finally {
      setIsFetchingLatest(false);
    }
  };

  React.useEffect(() => {
    if (show && !lastShow) {
      resetForm();
      setAmount("");
    }
    setLastShow(show);
  }, [show, lastShow]);

  React.useEffect(() => {
    if (
      useLegacyAshiglaltCalculator &&
      show &&
      transactionType === "ashiglalt" &&
      ashiglaltZardal === "tsakhilgaan_kv"
    ) {
      fetchLatestZaalt();
    }
  }, [
    show,
    transactionType,
    ashiglaltZardal,
    resident?._id,
    useLegacyAshiglaltCalculator,
  ]);

  useModalHotkeys({
    isOpen: show,
    onClose: requestClose,
    container: modalRef.current,
  });

  const handleTsakhilgaanTootsool = async () => {
    if (!token || !baiguullagiinId) {
      messageApi.warning(
        "Тооцоолох бол байгууллага сонгогдсон байх шаардлагатай.",
      );
      return;
    }
    const u = parseFloat(String(umnukhZaalt).replace(/,/g, ""));
    const s = parseFloat(String(suuliinZaalt).replace(/,/g, ""));
    if (Number.isNaN(u) || Number.isNaN(s)) {
      messageApi.warning("Өмнөх заалт болон Сүүлийн заалт оруулна уу.");
      return;
    }
    const payload = {
      baiguullagiinId,
      barilgiinId: barilgiinId || undefined,
      residentId: resident?._id,
      gereeniiId: resident?.gereeniiId,
      umnukhZaalt: String(umnukhZaalt).replace(/,/g, ""),
      suuliinZaalt: String(suuliinZaalt).replace(/,/g, ""),
      includeSuuriKhuraamj,
    };

    setIsCalculatingTsakhilgaan(true);
    try {
      console.log("[CALC] Sending request:", payload);
      const res = await uilchilgee(token).post<{
        success: boolean;
        niitDun?: number;
        usageAmount?: number;
        suuriKhuraamj?: number;
        tailbar?: string;
        odorZaaltNum?: number;
        shonoZaaltNum?: number;
        suuliinZaaltNum?: number;
        zoruu?: number;
        selectedCharge?: string;
      }>("/tsakhilgaanTootsool", payload);

      if (res.data?.success && typeof res.data.niitDun === "number") {
        console.log("[CALC] Received response:", res.data);
        const formatted = formatAmount(res.data.niitDun);
        setAmount(formatted);

        setCalcBreakdown({
          usageAmount:
            res.data.usageAmount ??
            res.data.niitDun - (res.data.suuriKhuraamj || 0),
          suuriKhuraamj: res.data.suuriKhuraamj || 0,
          zoruu: res.data.zoruu || 0,
          selectedCharge: res.data.selectedCharge,
        });
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Тооцоолол амжилтгүй.";
      messageApi.error(msg);
    } finally {
      setIsCalculatingTsakhilgaan(false);
    }
  };

  const fetchBalance = async () => {
    if (!token || !resident?._id) return;
    setIsFetchingBalance(true);
    try {
      const resp = await uilchilgee(token).get(
        `/orshinSuugch/${resident._id}`,
        {
          params: { baiguullagiinId },
        },
      );
      const data = resp.data;
      if (data) {
        setResidentBalance(Number(data.uldegdel ?? 0));
        messageApi.success("Үлдэгдэл шинэчлэгдлээ.");
      }
    } catch (e: any) {
      console.error("Balance fetch failed", e);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const fillAmountWithBalance = () => {
    if (residentBalance !== null && transactionType === "tulult") {
      const amountToFill = Math.max(0, residentBalance);
      setAmount(formatAmount(amountToFill));
    }
  };

  React.useEffect(() => {
    if (show && resident) {
      const bal = Number(resident.uldegdel ?? 0);
      setResidentBalance(bal);
    }
  }, [show, resident]);

  React.useEffect(() => {
    if (
      useLegacyAshiglaltCalculator &&
      show &&
      transactionType === "ashiglalt" &&
      ashiglaltZardal === "tsakhilgaan_kv" &&
      umnukhZaalt &&
      suuliinZaalt
    ) {
      const timer = setTimeout(() => {
        handleTsakhilgaanTootsool();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [
    includeSuuriKhuraamj,
    transactionType,
    ashiglaltZardal,
    umnukhZaalt,
    suuliinZaalt,
    show,
    useLegacyAshiglaltCalculator,
  ]);

  /**
   * Хөнгөлөлтийн бодолт. Оролт нь форматтай (таслал/цэг) байж болох тул
   * цэвэрлээд тооцно — дэлгэц ба хадгалалт хоёр ижил тоо ашиглана.
   */
  const khungulultiinDun = useMemo(() => {
    const val =
      parseFloat(String(discountValue).replace(/%/g, "").replace(/,/g, "")) ||
      0;
    if (val <= 0) return 0;
    if (discountType === "percent")
      return Math.round((residentBalance || 0) * (val / 100) * 100) / 100;
    return val;
  }, [discountValue, discountType, residentBalance]);

  const uldekhDun = useMemo(
    () =>
      Math.round(((residentBalance || 0) - khungulultiinDun) * 100) / 100,
    [residentBalance, khungulultiinDun],
  );

  const handleSubmit = async () => {
    if (transactionType === "khungulult") {
      const rawVal = discountValue.replace(/%/g, "").replace(/,/g, "");
      const valNum = parseFloat(rawVal) || 0;
      if (valNum <= 0) {
        messageApi.warning("Хөнгөлөх дүн эсвэл хувийг зөв оруулна уу.");
        return;
      }

      let calculatedAmount = 0;
      if (discountType === "percent") {
        const bal = residentBalance ?? Number(resident?.uldegdel ?? 0);
        calculatedAmount = Math.round(bal * (valNum / 100) * 100) / 100;
      } else {
        calculatedAmount = valNum;
      }

      if (calculatedAmount <= 0) {
        messageApi.warning("Хөнгөлөх дүн 0-ээс их байх шаардлагатай.");
        return;
      }

      const dateTag = discountMonth ? `(${discountMonth})` : "";
      const percentTag = discountType === "percent" ? ` ${valNum}%` : "";
      // Хэрэглэгчийн бичсэн тайлбарыг ХАЯДАГ байсан: доорх "Тайлбар" талбар
      // нь зөвхөн бусад төрөлд ашиглагддаг байсан тул хөнгөлөлт дээр бичсэн
      // тэмдэглэл хаашаа ч хадгалагддаггүй байв. Одоо системийн шошгоны
      // ард залгана — хуулга дээр "Хөнгөлөлт 20% (2026-08) · <тэмдэглэл>"
      // гэж харагдана.
      const nemeltTailbar = tailbar.trim();
      const finalTailbar = [
        `Хөнгөлөлт${percentTag} ${dateTag}`.trim(),
        nemeltTailbar,
      ]
        .filter(Boolean)
        .join(" · ");

      const data: TransactionData = {
        type: "khungulult",
        date: discountMonth ? `${discountMonth}-01` : transactionDate,
        amount: calculatedAmount,
        residentId: resident?._id || resident?.orshinSuugchId,
        gereeniiId: resident?.gereeniiId,
        tailbar: finalTailbar,
        ekhniiUldegdel: false,
        discountType,
        discountValue: valNum,
      };

      await onSubmit(data);
      resetForm();
      return;
    }

    let finalTailbar = tailbar;
    if (
      transactionType === "ashiglalt" &&
      ashiglaltZardal === "tsakhilgaan_kv" &&
      showUsageOnInvoice
    ) {
      const parts: string[] = [];
      if (umnukhZaalt.trim()) {
        parts.push(`Өмнөх заалт: ${umnukhZaalt.trim()}`);
      }
      if (suuliinZaalt.trim()) {
        parts.push(`Нийт (одоо): ${suuliinZaalt.trim()}`);
      }
      const usageText = parts.join(", ");
      if (usageText) {
        finalTailbar = finalTailbar
          ? `${finalTailbar} | ${usageText}`
          : usageText;
      }
    }

    if (ekhniiUldegdel) {
      const dateStr = transactionDate.replace(/-/g, ".");
      const prefix = "Эхний үлдэгдэл";
      if (finalTailbar) {
        if (!finalTailbar.startsWith(prefix)) {
          finalTailbar = `${prefix} - ${finalTailbar} - ${dateStr}`;
        } else if (!finalTailbar.includes(dateStr)) {
          finalTailbar = `${finalTailbar} - ${dateStr}`;
        }
      } else {
        finalTailbar = `${prefix} - ${dateStr}`;
      }
    }

    const data: TransactionData = {
      type: transactionType,
      ...(transactionType === "busad" ? { busadTurul } : {}),
      date: transactionDate,
      amount: parseFloat(amount.replace(/,/g, "")) || 0,
      residentId: resident?._id || resident?.orshinSuugchId,
      gereeniiId: resident?.gereeniiId,
      tailbar: finalTailbar,
      ekhniiUldegdel,
    };

    await onSubmit(data);
    resetForm();
  };

  if (!show) return null;

  return (
    <>
      <ModalPortal>
        <AnimatePresence>
          <div ref={constraintsRef} className="fixed inset-0 z-[12000]">
            {contextHolder}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-transparent"
              onClick={requestClose}
            />

            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              drag
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={constraintsRef}
              dragMomentum={false}
              className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 modal-surface rounded-2xl shadow-2xl w-[min(700px,95vw)] max-h-[85vh] flex flex-col border border-[color:var(--surface-border)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Draggable Title Bar */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="px-6 py-3 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] flex items-center justify-between cursor-move select-none"
              >
                <div className="text-sm font-medium text-[color:var(--panel-text)]">
                  Гүйлгээ хийх
                </div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={requestClose}
                  className="p-2 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors"
                  title="Хаах"
                >
                  <X className="w-5 h-5 text-[color:var(--muted-text)]" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 px-6 py-5 space-y-5 bg-[color:var(--surface-bg)] overflow-y-auto">
                {/* Resident Info Card */}
                {resident && (
                  <div className="bg-[color:var(--surface-hover)]/50 rounded-2xl p-3 border border-[color:var(--surface-border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[color:var(--theme)]/10 flex items-center justify-center text-[color:var(--theme)] text-sm font-medium">
                      {resident?.toot || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--panel-text)]">
                        {resident?.ovog || ""} {resident?.ner}
                      </p>
                      <p className="text-xs text-[color:var(--muted-text)]">
                        Оршин суугч
                      </p>
                    </div>
                  </div>
                )}

                {/* Transaction Type Segmented Control */}
                <div>
                  <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
                    Гүйлгээний төрөл
                  </label>
                  <div
                    className={`grid ${
                      canAddDiscount ? "grid-cols-5" : "grid-cols-4"
                    } neu-panel gap-1 p-1 bg-[color:var(--surface-hover)] rounded-2xl`}
                    style={{
                      gridTemplateColumns: `repeat(${
                        canAddDiscount ? 6 : 5
                      }, minmax(0, 1fr))`,
                    }}
                  >
                    {[
                      { value: "avlaga", label: "Авлага" },
                      { value: "ashiglalt", label: "Ашиглалт" },
                      { value: "torguuli", label: "Торгууль" },
                      { value: "tulult", label: "Төлөлт" },
                      ...(canAddDiscount
                        ? [{ value: "khungulult", label: "Хөнгөлөлт" }]
                        : []),
                      { value: "busad", label: "Бусад" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const newType =
                            option.value as TransactionData["type"];
                          if (newType !== transactionType) {
                            setAmount("0.00");
                            setTailbar("");
                            setEkhniiUldegdel(false);
                            setAshiglaltZardal("");
                            setUmnukhZaalt("");
                            setSuuliinZaalt("");
                            setDiscountValue("");
                            setDiscountReason("");
                          }
                          setTransactionType(newType);
                        }}
                        disabled={isProcessing}
                        className={`
                      relative py-1.5 px-2 text-xs font-medium rounded-2xl transition-all duration-200
                      ${
                        transactionType === option.value
                          ? option.value === "khungulult"
                            ? "!bg-theme !text-white shadow-md scale-[1.02]"
                            : "neu-panel-2 !text-white scale-[1.02]"
                          : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-bg)]/40"
                      }
                    `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* «Бусад»-ын дэд ангилал. Одоогоор ганц утгатай ч
                      жагсаалт нь өсөх учир эхнээсээ сонгогч хэлбэрээр. */}
                  {transactionType === "busad" && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-[color:var(--muted-text)] mb-1">
                        Дэд төрөл
                      </label>
                      <select
                        value={busadTurul}
                        onChange={(e) => setBusadTurul(e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-3 py-2 text-xs rounded-2xl neu-panel bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] focus:outline-none"
                      >
                        <option value="barter">Бартер</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Initial Balance Checkbox - only for avlaga type */}
                <AnimatePresence>
                  {transactionType === "avlaga" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 p-3 rounded-2xl overflow-hidden"
                    >
                      <input
                        type="checkbox"
                        id="ekhniiUldegdel"
                        checked={ekhniiUldegdel}
                        onChange={(e) => setEkhniiUldegdel(e.target.checked)}
                        className="w-4 h-4 rounded border-danger/30 text-danger focus:ring-danger cursor-pointer"
                      />
                      <label
                        htmlFor="ekhniiUldegdel"
                        className="text-xs text-danger cursor-pointer select-none"
                      >
                        Эхний үлдэгдэл эсэх
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Content */}
                {transactionType === "khungulult" ? (
                  <div className="bg-theme/70 border border-theme/30 text-brand rounded-2xl p-4 space-y-4/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-brand">
                          Хөнгөлөх сар
                        </label>
                        <DoubleYearMonthPicker
                          value={discountMonth}
                          onChange={(val) => setDiscountMonth(val)}
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-brand">
                          Хөнгөлөлтийн хэлбэр
                        </label>
                        <select
                          value={discountType}
                          onChange={(e) => {
                            setDiscountType(e.target.value as "percent" | "amount");
                            setDiscountValue("");
                          }}
                          disabled={isProcessing}
                          className="w-full px-3 py-2.5 border border-theme/30 bg-[color:var(--surface-bg)] text-brand rounded-2xl focus:outline-none focus:ring-2 focus:ring-theme/30 focus:border-theme transition-all text-sm font-medium"
                        >
                          <option value="percent">Хувиар</option>
                          <option value="amount">Дүнгээр</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Гарчиг нь сонгосон хэлбэрээс хамаарч хувьсана —
                          өмнө нь "ХӨНГӨЛӨХ ДҮН / ХӨНГӨЛӨХ ХУВЬ" гэж хоёуланг
                          нь зэрэг бичдэг тул аль нь хүчинтэй нь ойлгомжгүй
                          байв. */}
                      <label className="block text-xs font-medium text-brand">
                        {discountType === "percent"
                          ? "ХӨНГӨЛӨХ ХУВЬ"
                          : "ХӨНГӨЛӨХ ДҮН"}
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={discountValue}
                          onChange={(e) =>
                            setDiscountValue(
                              discountType === "percent"
                                ? khuviFormatlay(e.target.value)
                                : dunFormatlay(e.target.value),
                            )
                          }
                          placeholder={discountType === "percent" ? "0" : "0.00"}
                          disabled={isProcessing}
                          className="w-full rounded-2xl border border-theme/30 bg-[color:var(--surface-bg)] py-3 pl-4 pr-12 text-right text-lg font-medium tabular-nums tracking-wide text-brand transition-all focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/30 disabled:opacity-60"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-brand/70">
                          {discountType === "percent" ? "%" : "₮"}
                        </span>
                      </div>

                      {residentBalance !== null && (
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl bg-white/70 px-3 py-2.5">
                          {/* Сүүлчийн үлдэгдэл нь гарчгийн хажуугаас ЭНД
                              шилжив: оролтод аль хэдийн форматтай дүн
                              харагдаж байгаа тул хуучин "Хөнгөлөх дүн: ..."
                              давхардал болж байсан. */}
                          <KhungulultiinMur
                            ner="Сүүлчийн үлдэгдэл"
                            utga={mungunDunFormat(residentBalance)}
                          />
                          {discountType === "percent" && (
                            <KhungulultiinMur
                              ner="Хөнгөлөх дүн"
                              utga={mungunDunFormat(khungulultiinDun)}
                            />
                          )}
                          <KhungulultiinMur
                            ner="Үлдэгдэл дүн"
                            utga={mungunDunFormat(uldekhDun)}
                            onts
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : transactionType === "ashiglalt" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                          Огноо
                        </label>
                        <input
                          type="date"
                          value={transactionDate}
                          onChange={(e) => setTransactionDate(e.target.value)}
                          disabled={isProcessing}
                          className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 relative group">
                        <div className="flex justify-between items-end mb-1.5">
                          <label className="block text-xs text-[color:var(--panel-text)]">
                            Дүн
                          </label>
                        </div>
                        <div className="relative w-full group/input">
                          <input
                            type="text"
                            ref={amountInputRef}
                            value={amount}
                            inputMode="decimal"
                            onChange={handleAmountInputChange}
                            onBlur={() => {
                              if (amount) setAmount(formatAmount(amount));
                            }}
                            disabled={isProcessing}
                            placeholder="0.00"
                            className="w-full px-3 py-2.5 pr-[38px] border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-right tracking-wide text-lg font-medium"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] text-xs pointer-events-none select-none font-medium" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                        Зардлын төрөл
                      </label>
                      <select
                        value={ashiglaltZardal}
                        onChange={(e) =>
                          setAshiglaltZardal(
                            e.target.value as "" | "tsakhilgaan_kv",
                          )
                        }
                        disabled={isProcessing}
                        className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm"
                      >
                        <option value="">Сонгоно уу</option>
                        <option value="tsakhilgaan_kv">Цахилгаан кВ</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[color:var(--muted-text)]">
                        Суурь хураамж:{" "}
                        {(calcBreakdown?.suuriKhuraamj ?? 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                        Огноо
                      </label>
                      <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 relative group">
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="block text-xs text-[color:var(--panel-text)]">
                          Дүн
                        </label>
                        {residentBalance !== null &&
                          transactionType === "tulult" && (
                            <motion.div
                              initial={{ opacity: 0, x: 5 }}
                              animate={{ opacity: 1, x: 0 }}
                              onDoubleClick={fillAmountWithBalance}
                              title="Хоёр товшиж дүнг оруулах"
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-2xl border cursor-pointer transition-all select-none ${
                                isFetchingBalance
                                  ? "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] border-[color:var(--surface-border)] animate-pulse"
                                  : "bg-warning/10 text-warning border-warning/30 hover:bg-warning/10 active:scale-95"
                              }`}
                            >
                              Үлдэгдэл:{" "}
                              {residentBalance.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </motion.div>
                          )}
                      </div>
                      <div className="relative w-full group/input">
                        <input
                          type="text"
                          ref={amountInputRef}
                          value={amount}
                          onChange={handleAmountInputChange}
                          onDoubleClick={
                            transactionType === "tulult"
                              ? fillAmountWithBalance
                              : undefined
                          }
                          onBlur={() => {
                            if (amount) {
                              setAmount(formatAmount(amount));
                            }
                          }}
                          disabled={isProcessing}
                          placeholder="0.00"
                          className="w-full px-3 py-2.5 pr-[38px] border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-right tracking-wide text-lg font-medium"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] text-xs pointer-events-none select-none font-medium"></span>
                      </div>
                    </div>
                  </div>
                )}

                {transactionType !== "ashiglalt" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                      Тайлбар
                    </label>
                    <textarea
                      value={tailbar}
                      onChange={(e) => setTailbar(e.target.value)}
                      disabled={isProcessing}
                      placeholder="Гүйлгээний утга..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <Button
                  onClick={requestClose}
                  disabled={isProcessing}
                  variant="secondary"
                  className="ant-btn w-20 color-black"
                >
                  Хаах
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={isProcessing}
                  variant="primary"
                  className="ant-btn w-20 ant-btn-primary !text-white"
                >
                  Хадгалах
                </Button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      </ModalPortal>

      <ConfirmCloseDialog
        open={showConfirmClose}
        onCancel={() => setShowConfirmClose(false)}
        onConfirm={handleClose}
      />
    </>
  );
}
