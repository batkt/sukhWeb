"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Building2,
  CreditCard,
  Filter,
  Eye,
  ChevronDown,
} from "lucide-react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import Button from "@/components/ui/Button";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import HistoryModal from "../../geree/modals/HistoryModal";

export interface BankReconciliationRecord {
  building: string;
  korpus: string;
  toot: string;
  urkh: string;
  on: number;
  sar: number;
  dun: number;
  residentName: string;
  paymentType: "qpay" | "manual";
  date: string;
  tailbar: string;
  contract: any;
}

interface BankReconciliationExcelModalProps {
  show: boolean;
  onClose: () => void;
  baiguullaga?: any;
  barilguud?: any[];
  currentBuildingId?: string;
  historyItems: any[];
  contracts?: any[];
  contractsById?: Record<string, any>;
  contractsByNumber?: Record<string, any>;
}

export default function BankReconciliationExcelModal({
  show,
  onClose,
  baiguullaga,
  barilguud = [],
  currentBuildingId,
  historyItems = [],
  contracts = [],
  contractsById = {},
  contractsByNumber = {},
}: BankReconciliationExcelModalProps) {
  const { token, ajiltan } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Modal keyboard handling
  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  // Source Choice: 'all' | 'qpay' | 'manual'
  const [sourceChoice, setSourceChoice] = useState<"all" | "qpay" | "manual">("all");

  // Building Filter: 'ALL' or specific building ID / code
  const [selectedBuilding, setSelectedBuilding] = useState<string>("ALL");

  // Date Range Filter: Default to all
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Selected resident contract for HistoryModal (Хуулга)
  const [selectedContractForHistory, setSelectedContractForHistory] = useState<any>(null);

  // Normalize building code helper (e.g. "Time tower 216" -> "216")
  const extractBuildingCode = (bldRaw?: string): string => {
    if (!bldRaw || bldRaw === "—" || bldRaw === "Байр") return "";
    const m = String(bldRaw).match(/(\d{1,4})/);
    if (m) return m[1];
    return String(bldRaw).trim();
  };

  // Available buildings for dropdown
  const availableBuildings = useMemo(() => {
    const list: { id: string; name: string; code: string }[] = [];
    const set = new Set<string>();

    if (Array.isArray(barilguud)) {
      barilguud.forEach((b: any) => {
        const id = String(b?._id || b?.id || "").trim();
        const n = String(b?.ner || b?.dugaar || "").trim();
        const code = extractBuildingCode(n);
        if (n && !set.has(n)) {
          set.add(n);
          list.push({ id, name: n, code: code || n });
        }
      });
    }

    if (Array.isArray(contracts)) {
      contracts.forEach((c: any) => {
        const n = String(c?.bairNer || c?.barilgiinId?.ner || "").trim();
        const code = extractBuildingCode(n);
        if (n && !set.has(n)) {
          set.add(n);
          list.push({ id: String(c?.barilgiinId || n), name: n, code: code || n });
        }
      });
    }

    return list;
  }, [barilguud, contracts]);

  // Extract and process paid records
  const processedRecords = useMemo(() => {
    const recordsMap = new Map<string, BankReconciliationRecord>();

    const startMs = startDate ? new Date(startDate + "T00:00:00").getTime() : 0;
    const endMs = endDate ? new Date(endDate + "T23:59:59").getTime() : Infinity;

    // Filter payments from historyItems
    (historyItems || []).forEach((it: any) => {
      // 1. Must be payment (turul === "tulult" or raw negative amount or positive tulsun)
      const turul = String(it?.turul || "").toLowerCase();
      const rawDun = Number(it?.dun ?? 0);
      const rawTulsun = Number(it?.tulsunDun ?? it?.tulsun ?? 0);

      const isPayment =
        turul === "tulult" ||
        turul === "төлөлт" ||
        rawDun < 0 ||
        rawTulsun > 0;

      if (!isPayment) return;

      // Skip discounts and initial balance setups
      if (it?.ekhniiUldegdelEsekh === true) return;
      if (turul === "khungulult" || turul === "хөнгөлөлт") return;

      // 2. Identify payment source: QPay vs Manual
      const tailbarLower = String(it?.tailbar || "").toLowerCase();
      const isQpay =
        tailbarLower.includes("qpay") ||
        it?.source === "qpay" ||
        it?.source === "nekhemjlekh" ||
        Boolean(it?.qpayId);

      const paymentType: "qpay" | "manual" = isQpay ? "qpay" : "manual";

      if (sourceChoice === "qpay" && !isQpay) return;
      if (sourceChoice === "manual" && isQpay) return;

      // 3. Date check
      const dateVal = it?.ognoo || it?.createdAt || it?.date;
      const d = dateVal ? new Date(dateVal) : new Date();
      const itemMs = !isNaN(d.getTime()) ? d.getTime() : 0;
      if (startDate && itemMs < startMs) return;
      if (endDate && itemMs > endMs) return;

      // 4. Resolve Contract & Apartment details
      const cId = String(it?._gereeniiId || it?.gereeniiId || it?.gereeId || "").trim();
      let contract =
        (cId && (contractsById as any)[cId]) ||
        (it?.gereeniiDugaar && (contractsByNumber as any)[String(it.gereeniiDugaar)]) ||
        null;

      if (!contract && Array.isArray(contracts)) {
        const rawToot = String(it?.toot || "").trim().replace(/\s*тоот$/i, "");
        if (rawToot) {
          contract = contracts.find((c: any) => String(c?.toot).trim() === rawToot) || null;
        }
      }

      const rawBuilding =
        contract?.bairNer ||
        contract?.barilgiinId?.ner ||
        contract?.barilga ||
        it?.bairNer ||
        it?.barilgiinNer ||
        baiguullaga?.ner ||
        "";

      const buildingCode = extractBuildingCode(rawBuilding) || "216";

      // Filter by building if selected
      if (selectedBuilding !== "ALL") {
        const selCode = extractBuildingCode(selectedBuilding);
        if (selCode && buildingCode !== selCode) return;
      }

      const rawToot = String(contract?.toot || it?.toot || "").trim();
      const toot = rawToot.replace(/\s*тоот$/i, "").replace(/^0+/, "") || rawToot;
      if (!toot || toot === "-" || toot === "—") return;

      const urkh = String(contract?.urkh || it?.urkh || "").trim();
      const korpus = String(contract?.korpus || it?.korpus || "").trim();
      const paidAmt = Math.abs(rawDun || rawTulsun);
      const residentName = contract?.ner
        ? `${contract.ovog ? contract.ovog.charAt(0) + "." : ""}${contract.ner}`
        : it?.orshinSuugchNer || "Оршин суугч";

      const actualContractId = String(
        contract?._id ||
        contract?.gereeniiId ||
        cId ||
        it?.gereeniiId ||
        it?.gereeId ||
        ""
      ).trim();

      const resolvedContract = {
        ...(contract || {}),
        _id: actualContractId,
        gereeniiId: actualContractId,
        gereeId: actualContractId,
        _gereeniiId: actualContractId,
        gereeniiDugaar: contract?.gereeniiDugaar || it?.gereeniiDugaar || it?.contractNumber || "",
        toot: toot,
        ner: contract?.ner || it?.ner || residentName,
        ovog: contract?.ovog || it?.ovog || "",
        utas: contract?.utas || it?.utas || "",
        bairNer: rawBuilding,
        barilgiinId: contract?.barilgiinId?._id || contract?.barilgiinId || it?.barilgiinId || currentBuildingId,
        baiguullagiinId: contract?.baiguullagiinId || it?.baiguullagiinId || ajiltan?.baiguullagiinId || baiguullaga?._id,
      };

      // 5. Extract target month and year
      const explicitMonths: { year: number; month: number }[] = [];

      const ymMatches = tailbarLower.matchAll(/\b(202\d)[\/.-](1[0-2]|0?[1-9])\b/g);
      for (const m of ymMatches) {
        explicitMonths.push({
          year: parseInt(m[1], 10),
          month: parseInt(m[2], 10),
        });
      }

      // If no explicit month in description, use the payment date
      if (explicitMonths.length === 0) {
        const yr = !isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
        const mo = !isNaN(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1;
        explicitMonths.push({ year: yr, month: mo });
      }

      // 6. Generate records for each paid month
      explicitMonths.forEach(({ year, month }) => {
        const key = `${buildingCode}_${toot}_${urkh}_${year}_${month}`;

        if (recordsMap.has(key)) {
          const existing = recordsMap.get(key)!;
          existing.dun += paidAmt;
        } else {
          recordsMap.set(key, {
            building: buildingCode,
            korpus,
            toot,
            urkh,
            on: year,
            sar: month,
            dun: paidAmt,
            residentName,
            paymentType,
            date: dateVal ? String(dateVal).slice(0, 10) : "",
            tailbar: it?.tailbar || "",
            contract: resolvedContract,
          });
        }
      });
    });

    // Sort rows naturally: Building -> Toot (numeric) -> Year -> Month
    return Array.from(recordsMap.values()).sort((a, b) => {
      const numBldA = parseInt(a.building, 10);
      const numBldB = parseInt(b.building, 10);
      if (!isNaN(numBldA) && !isNaN(numBldB) && numBldA !== numBldB) {
        return numBldA - numBldB;
      }
      if (a.building !== b.building) return a.building.localeCompare(b.building);

      const numTootA = parseInt(a.toot, 10);
      const numTootB = parseInt(b.toot, 10);
      if (!isNaN(numTootA) && !isNaN(numTootB) && numTootA !== numTootB) {
        return numTootA - numTootB;
      }
      if (a.toot !== b.toot) return a.toot.localeCompare(b.toot);

      if (a.on !== b.on) return a.on - b.on;
      return a.sar - b.sar;
    });
  }, [historyItems, contractsById, contractsByNumber, contracts, sourceChoice, startDate, endDate, baiguullaga, currentBuildingId]);

  // Statistics
  const totalCount = processedRecords.length;
  const totalAmount = useMemo(() => {
    return processedRecords.reduce((sum, r) => sum + r.dun, 0);
  }, [processedRecords]);

  const uniqueHomesCount = useMemo(() => {
    const set = new Set(processedRecords.map((r) => `${r.building}-${r.toot}`));
    return set.size;
  }, [processedRecords]);

  // Open resident history ledger
  const handleOpenHistory = (r: BankReconciliationRecord) => {
    let targetContract = r.contract;
    if ((!targetContract?._id || targetContract?._id === "") && Array.isArray(contracts)) {
      const found =
        contracts.find((c: any) => {
          const cToot = String(c?.toot || "").trim().replace(/\s*тоот$/i, "");
          if (cToot !== r.toot) return false;
          if (r.building) {
            const cBair = extractBuildingCode(c?.bairNer || c?.barilgiinId?.ner || c?.barilga);
            if (cBair && cBair !== r.building) return false;
          }
          return true;
        }) || contracts.find((c: any) => String(c?.toot || "").trim().replace(/\s*тоот$/i, "") === r.toot);
      if (found) targetContract = found;
    }

    if (!targetContract || (!targetContract._id && !targetContract.gereeniiId && !targetContract.gereeId)) {
      toast.warning(`${r.toot} тоот дээр холбогдох гэрээний мэдээлэл олдсонгүй`);
      return;
    }

    setSelectedContractForHistory(targetContract);
  };

  // Export to Excel handler
  const handleExportExcel = async (format: "xlsx" | "csv" = "xlsx") => {
    if (processedRecords.length === 0) {
      toast.error("Экспорт хийх төлбөрийн бичлэг олдсонгүй");
      return;
    }

    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");

      // Commercial bank standard format:
      const headerRow = [
        "Байрны код",
        "Корпус/Код/",
        "Хаалга",
        "Өрх",
        "Он",
        "Сар",
        " 1. Байр гэсэн дээр банкруу явуулдаг стандарт файл  дээрх байрныхаа дугаарыг шивнэ.",
      ];

      const dataRows = processedRecords.map((r) => [
        r.building,
        r.korpus,
        r.toot,
        r.urkh,
        r.on,
        r.sar,
        "",
      ]);

      const aoa = [headerRow, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      ws["!cols"] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 70 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Банкны тулгалт");

      const sourceLabel =
        sourceChoice === "qpay" ? "QPAY" : sourceChoice === "manual" ? "TULULT" : "BUGD";
      const bldLabel = "";
      const dateLabel = new Date().toISOString().slice(0, 10);
      const filename = `Банкны_тулгалт${bldLabel}_${sourceLabel}_${dateLabel}.${format}`;

      XLSX.writeFile(wb, filename);

      toast.success(
        `Банкны тулгалтын файл амжилттай татагдлаа! (${processedRecords.length} мөр)`
      );
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Файл бэлтгэхэд алдаа гарлаа: " + (err?.message || ""));
    } finally {
      setIsExporting(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        <ModalPortal>
          <div ref={constraintsRef} className="fixed inset-0 z-[12000]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-transparent"
              onClick={onClose}
            />

            <motion.div
              ref={modalRef}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              drag
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={constraintsRef}
              dragMomentum={false}
              className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 bg-[color:var(--surface-bg)] rounded-[32px] shadow-2xl w-[min(1040px,96vw)] max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Draggable Title Bar */}
                <div
                  onPointerDown={(e) => dragControls.start(e)}
                  className="-mt-2 mb-6 px-1 py-1 flex items-center justify-between cursor-move select-none"
                >
                  <div className="text-sm font-medium text-[color:var(--panel-text)] dark:text-white">
                    Банкны тулгалт (Төлбөр хаалтын Excel бэлтгэх)
                  </div>
                  <Button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onClose}
                    variant="ghost"
                    className="p-2 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5 text-[color:var(--muted-text)]" />
                  </Button>
                </div>

                {/* Filters row */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Төлбөрийн төрөл */}
                    <div
                      className="inline-flex rounded-2xl border border-[color:var(--surface-border)] p-1 bg-[color:var(--surface-hover)]"
                      role="tablist"
                      aria-label="Гүйлгээний төрөл"
                    >
                      {([
                        { id: "all", label: "Бүгд" },
                        { id: "qpay", label: "Зөвхөн QPay" },
                        { id: "manual", label: "Зөвхөн Төлөлт" },
                      ] as const).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={sourceChoice === tab.id}
                          onClick={() => setSourceChoice(tab.id)}
                          className={`rounded-xl px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                            sourceChoice === tab.id
                              ? "bg-theme text-white shadow-sm"
                              : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Байр сонгох */}
                    {availableBuildings.length > 0 && (
                      <div className="relative">
                        <select
                          value={selectedBuilding}
                          onChange={(e) => setSelectedBuilding(e.target.value)}
                          className="px-3.5 pr-8 py-1.5 border border-[color:var(--surface-border)] bg-transparent rounded-2xl text-xs font-medium text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 h-[34px] cursor-pointer appearance-none"
                        >
                          <option value="ALL" className="bg-[color:var(--surface-bg)] text-[color:var(--panel-text)]">
                            Бүх байр
                          </option>
                          {availableBuildings.map((b) => (
                            <option
                              key={b.name}
                              value={b.name}
                              className="bg-[color:var(--surface-bg)] text-[color:var(--panel-text)]"
                            >
                              {b.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[color:var(--muted-text)] absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    )}

                    {/* Огнооны хүрээ */}
                    <div className="flex items-center gap-1.5">
                      <FilterDatePicker
                        value={[startDate || null, endDate || null]}
                        onChange={(_: any, dateStrings: any) => {
                          if (Array.isArray(dateStrings)) {
                            setStartDate(dateStrings[0] || "");
                            setEndDate(dateStrings[1] || "");
                          } else {
                            setStartDate("");
                            setEndDate("");
                          }
                        }}
                        placeholder={["Эхлэх огноо", "Дуусах огноо"]}
                        className="!h-[34px] !rounded-2xl !border !border-[color:var(--surface-border)] !bg-transparent text-xs font-medium text-[color:var(--panel-text)]"
                      />
                      {(startDate || endDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="text-[11px] text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] px-1.5 py-1 rounded cursor-pointer"
                          title="Огноо цэвэрлэх"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 shrink-0">
                  <div className="px-4 py-2.5 rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-theme/15 text-theme flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-[color:var(--muted-text)] font-normal">Нийт өрх (Айл)</div>
                      <div className="text-sm font-semibold text-[color:var(--panel-text)] tabular-nums">
                        {uniqueHomesCount} <span className="text-xs font-normal text-[color:var(--muted-text)]">айл</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-[color:var(--muted-text)] font-normal">Нийт төлбөрийн мөр</div>
                      <div className="text-sm font-semibold text-[color:var(--panel-text)] tabular-nums">
                        {totalCount} <span className="text-xs font-normal text-[color:var(--muted-text)]">бичлэг</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 rounded-2xl bg-theme/10 border border-theme/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-theme text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-theme font-normal">Нийт хаагдах дүн</div>
                      <div className="text-sm font-semibold text-theme tabular-nums">
                        {totalAmount.toLocaleString()} ₮
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Preview Area */}
                <div className="flex-1 overflow-y-auto min-h-0 rounded-2xl border border-[color:var(--surface-border)] custom-scrollbar">
                  {processedRecords.length === 0 ? (
                    <div className="h-56 flex flex-col items-center justify-center p-6 text-center text-[color:var(--muted-text)]">
                      <Filter className="w-8 h-8 mb-2 opacity-40" />
                      <div className="text-xs font-medium text-[color:var(--panel-text)]">
                        Сонгосон нөхцөлд тохирох төлбөрийн бичлэг олдсонгүй
                      </div>
                      <div className="text-[11px] text-[color:var(--muted-text)] mt-1 max-w-[280px]">
                        Төлбөрийн төрөл, байр эсвэл огнооны шүүлтүүрээ өөрчилж шалгана уу
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr>
                          {[
                            { title: "№", align: "text-center w-10" },
                            { title: "Байрны код", align: "" },
                            { title: "Хаалга (Тоот)", align: "" },
                            { title: "Он", align: "text-center" },
                            { title: "Сар", align: "text-center" },
                            { title: "Төлсөн дүн", align: "text-right" },
                            { title: "Оршин суугч", align: "" },
                            { title: "Хэлбэр", align: "" },
                            { title: "Хуулга", align: "text-right w-20" },
                          ].map((col) => (
                            <th
                              key={col.title}
                              className={`sticky top-0 z-10 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] [background-image:linear-gradient(var(--surface-hover),var(--surface-hover))] px-3 py-2 text-xs font-medium text-[color:var(--panel-text)] dark:border-white/10 ${col.align}`}
                            >
                              {col.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {processedRecords.map((r, idx) => (
                          <tr
                            key={`${r.building}-${r.toot}-${r.on}-${r.sar}-${idx}`}
                            onClick={() => handleOpenHistory(r)}
                            className="hover:bg-[color:var(--surface-hover)] transition-colors cursor-pointer group"
                          >
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-center text-xs text-[color:var(--muted-text)] dark:border-white/5 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-xs font-medium text-[color:var(--panel-text)] dark:border-white/5">
                              {r.building}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-xs text-theme font-medium dark:border-white/5">
                              {r.toot} тоот
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-center text-xs tabular-nums text-[color:var(--panel-text)] dark:border-white/5">
                              {r.on}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-center text-xs tabular-nums font-medium text-[color:var(--panel-text)] dark:border-white/5">
                              {r.sar}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-right text-xs tabular-nums font-medium text-[color:var(--panel-text)] dark:border-white/5">
                              {r.dun.toLocaleString()} ₮
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-xs text-[color:var(--panel-text)] dark:border-white/5 truncate max-w-[160px]">
                              {r.residentName}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-xs dark:border-white/5">
                              {r.paymentType === "qpay" ? (
                                <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                  QPay
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-theme/10 text-theme border border-theme/20">
                                  Төлөлт
                                </span>
                              )}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-right text-xs dark:border-white/5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenHistory(r);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-theme hover:bg-theme/10 border border-theme/20 font-medium text-[11px] transition-colors cursor-pointer"
                                title="Хуулга харах"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Хуулга</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between shrink-0">
                  <div className="text-xs font-medium text-[color:var(--muted-text)]">
                    Нийт: <span className="font-semibold text-[color:var(--panel-text)]">{uniqueHomesCount} айл</span> ·{" "}
                    <span className="font-semibold text-[color:var(--panel-text)]">{totalCount} бичлэг</span> ·{" "}
                    <span className="font-semibold text-theme text-sm">{totalAmount.toLocaleString()} ₮</span>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={onClose}
                      variant="secondary"
                      className="px-6 py-2.5 rounded-2xl cursor-pointer"
                    >
                      Хаах
                    </Button>
                    <Button
                      onClick={() => handleExportExcel("xlsx")}
                      isLoading={isExporting}
                      disabled={processedRecords.length === 0 || isExporting}
                      variant="primary"
                      className="px-6 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Банкны тулгалт (Excel) татах</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      </AnimatePresence>

      {/* History Modal when any resident row or "Хуулга" is clicked */}
      <HistoryModal
        show={Boolean(selectedContractForHistory)}
        onClose={() => setSelectedContractForHistory(null)}
        contract={selectedContractForHistory}
        token={token}
        baiguullagiinId={
          selectedContractForHistory?.baiguullagiinId?._id ||
          selectedContractForHistory?.baiguullagiinId ||
          ajiltan?.baiguullagiinId ||
          baiguullaga?._id ||
          null
        }
        barilgiinId={
          selectedContractForHistory?.barilgiinId?._id ||
          selectedContractForHistory?.barilgiinId ||
          currentBuildingId ||
          null
        }
        printedByAjiltan={ajiltan ?? null}
        baiguullagiinNer={
          (baiguullaga?.ner && String(baiguullaga.ner).trim()) ||
          (baiguullaga?.dotoodNer && String(baiguullaga.dotoodNer).trim()) ||
          null
        }
      />
    </>
  );
}
