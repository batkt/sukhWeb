"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Download,
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RotateCcw,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import Button from "@/components/ui/Button";
import ModalPortal from "../../../../../components/shell/ModalPortal";

/** Excel-ийн баганын гарчгууд — хэрэглэгчийн хүссэн дарааллаар: Овог, Нэр, Утас, Тоот, Төрөл, Улсын дугаар, Тайлбар */
const COLUMNS = [
  "Овог",
  "Нэр",
  "Утас",
  "Тоот",
  "Төрөл",
  "Улсын дугаар",
  "Тайлбар",
] as const;

/** Бүртгэлийн маягт дээрх сонголтуудтай яг ижил жагсаалт. */
const TURUL_OPTIONS = [
  "Оршин суугч",
  "Харилцагч",
  "Ажилтан",
  "Дотоод",
  "СӨХ",
  "Үнэгүй",
] as const;

function normalizeTurul(raw: string): string {
  const val = String(raw ?? "").trim();
  if (!val) return "Оршин суугч";
  const lower = val.toLowerCase().replace(/\s+/g, "");
  if (
    lower === "о.суугч" ||
    lower === "осуугч" ||
    lower === "оршинсуугч" ||
    lower === "оршинсуугч."
  ) {
    return "Оршин суугч";
  }
  const matched = TURUL_OPTIONS.find(
    (opt) => opt.toLowerCase().replace(/\s+/g, "") === lower,
  );
  return matched || val;
}

interface ParsedRow {
  /** Excel дэх мөрийн дугаар (гарчиг 1-р мөр тул +2). */
  excelRow: number;
  plate: string;
  ovog: string;
  ner: string;
  utas: string;
  toot: string;
  turul: string;
  tailbar: string;
  errors: string[];
}

interface Props {
  token: string;
  baiguullagiinId?: string;
  barilgiinId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

/** Улсын дугаар: эхний 4 нь тоо, сүүлийн 3 нь монгол кирилл үсэг (ж: 1234УБА) */
const PLATE_REGEX = /^\d{4}[А-ЯӨҮЁ]{3}$/;

/** Латин гараар бичсэн ч кирилл рүү хөрвүүлнэ — бүртгэлийн маягттай ижил. */
const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А", B: "В", C: "С", D: "Д", E: "Е", G: "Г", H: "Н", I: "И",
  J: "Ж", K: "К", L: "Л", M: "М", N: "Н", O: "О", P: "Р", Q: "Ө",
  R: "Р", S: "С", T: "Т", U: "У", V: "В", W: "В", X: "Х", Y: "Ү",
  Z: "З",
};

/** Улсын дугаарыг маягт дээрхтэй ижил дүрмээр цэгцэлнэ. */
function normalizePlate(raw: string): string {
  const value = String(raw ?? "").toUpperCase().replace(/\s/g, "").slice(0, 7);
  const digits = value.slice(0, 4).replace(/\D/g, "");
  const letters = Array.from(value.slice(4))
    .map((ch) => LATIN_TO_CYRILLIC[ch] || ch)
    .filter((ch) => /^[А-ЯӨҮЁ]$/.test(ch))
    .join("");
  return digits + letters;
}

/** Excel тоон нүднээс утас "99112233" биш 99112233 болж ирдгийг барина. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Мөрийг шалгана. `uzegdsen` нь өмнөх мөрүүдэд тааралдсан дугаар/утсыг
 * хадгална — нэг файлд ижил машиныг хоёр удаа бүртгэхээс сэргийлнэ.
 */
function validateRow(
  row: Omit<ParsedRow, "errors">,
  uzegdsen: { plate: Set<string>; utas: Set<string> },
): string[] {
  const errors: string[] = [];

  if (!row.ner) errors.push("Нэр хоосон");

  if (!row.utas) {
    errors.push("Утас хоосон");
  } else if (!/^\d{8}$/.test(row.utas)) {
    errors.push("Утас 8 оронтой байх ёстой");
  } else if (uzegdsen.utas.has(row.utas)) {
    errors.push("Утас файлд давхардсан");
  }

  // Дугаар хоосон байж болно — тэр тохиолдолд БҮРТГЭЛГҮЙ гэж орно.
  if (row.plate) {
    if (!PLATE_REGEX.test(row.plate)) {
      errors.push("Улсын дугаар 4 тоо + 3 монгол кирилл үсэг байх ёстой");
    } else if (uzegdsen.plate.has(row.plate)) {
      errors.push("Улсын дугаар файлд давхардсан");
    }
  }

  if (row.turul && !(TURUL_OPTIONS as readonly string[]).includes(row.turul)) {
    errors.push(`Төрөл буруу (${TURUL_OPTIONS.join(", ")})`);
  }

  return errors;
}

export default function ExcelImportModal({
  token,
  baiguullagiinId,
  barilgiinId,
  onClose,
  onSuccess,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState<{ row: ParsedRow; reason: string }[]>([]);
  /** Загвар татаж буй төлөв */
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  /** Хэрэглэгч шалгаад хасахаар сонгосон Excel мөрүүд */
  const [orkhigduulsan, setOrkhigduulsan] = useState<Set<number>>(new Set());

  const validRows = useMemo(
    () =>
      rows.filter(
        (r) => r.errors.length === 0 && !orkhigduulsan.has(r.excelRow),
      ),
    [rows, orkhigduulsan],
  );
  const invalidCount = rows.filter((r) => r.errors.length > 0).length;

  const murTogloy = (excelRow: number) =>
    setOrkhigduulsan((umnukh) => {
      const shine = new Set(umnukh);
      if (shine.has(excelRow)) shine.delete(excelRow);
      else shine.add(excelRow);
      return shine;
    });

  /** Загвар татах — машин бүртгэлгүй оршин суугч, харилцагчдыг татаж Excel загварт бэлдэнэ. */
  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      // 1. Бүртгэлтэй машины утас, ID-нуудыг татах
      const registeredPhones = new Set<string>();
      const registeredResidentIds = new Set<string>();

      const [parkingRes, residentsRes, khariltsagchRes] = await Promise.allSettled([
        uilchilgee(token).get("/zochinJagsaalt", {
          params: {
            baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 5000,
          },
        }),
        uilchilgee(token).get("/orshinSuugch", {
          params: {
            baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 5000,
          },
        }),
        uilchilgee(token).get("/khariltsagch", {
          params: {
            baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 5000,
          },
        }),
      ]);

      if (parkingRes.status === "fulfilled" && parkingRes.value?.data) {
        const pList: any[] = Array.isArray(parkingRes.value.data.jagsaalt)
          ? parkingRes.value.data.jagsaalt
          : [];
        pList.forEach((p) => {
          const plate = String(p.dugaar || p.mashiniiDugaar || "").trim().toUpperCase();
          const hasPlate = plate && plate !== "БҮРТГЭЛГҮЙ" && plate !== "-";
          const carCount = Number(p.mashiniiToo || 0);
          const hasCarsList = Array.isArray(p.ezniiMashinuud) && p.ezniiMashinuud.length > 0;

          if (hasPlate || carCount > 0 || hasCarsList) {
            const rawPhone = String(p.ezemshigchiinUtas || p.utas || "").replace(/\D/g, "");
            if (rawPhone) registeredPhones.add(rawPhone);
            if (p.ezemshigchiinId) registeredResidentIds.add(String(p.ezemshigchiinId));
            if (p._id) registeredResidentIds.add(String(p._id));
          }
        });
      }

      const templateRows: Array<{
        ovog: string;
        ner: string;
        utas: string;
        toot: string;
        turul: string;
        plate: string;
        tailbar: string;
      }> = [];

      const seenPhones = new Set<string>();

      // 2. Оршин суугчдаас машингүйг нь шүүх
      if (residentsRes.status === "fulfilled" && residentsRes.value?.data) {
        const rList: any[] = Array.isArray(residentsRes.value.data.jagsaalt)
          ? residentsRes.value.data.jagsaalt
          : [];

        rList.forEach((r) => {
          const rId = String(r._id || "");
          const rawPhone = Array.isArray(r.utas) ? r.utas[0] : r.utas;
          const phone = String(rawPhone || "").replace(/\D/g, "");

          const hasDirectCar =
            (Array.isArray(r.mashinuud) && r.mashinuud.length > 0) ||
            (r.mashiniiDugaar && r.mashiniiDugaar !== "БҮРТГЭЛГҮЙ" && r.mashiniiDugaar !== "-") ||
            (r.dugaar && r.dugaar !== "БҮРТГЭЛГҮЙ" && r.dugaar !== "-");

          const hasCar =
            hasDirectCar ||
            (phone && registeredPhones.has(phone)) ||
            (rId && registeredResidentIds.has(rId));

          if (!hasCar) {
            if (phone && seenPhones.has(phone)) return;
            if (phone) seenPhones.add(phone);

            const toot = String(r.toot || (r.toots && r.toots[0]?.toot) || "").trim();
            const ner = String(r.ner || "").trim();
            const ovog = String(r.ovog || "").trim();

            if (ner || phone || toot) {
              templateRows.push({
                ovog,
                ner,
                utas: phone,
                toot,
                turul: "Оршин суугч",
                plate: "",
                tailbar: "",
              });
            }
          }
        });
      }

      // 3. Харилцагчдаас машингүйг нь шүүх
      if (khariltsagchRes.status === "fulfilled" && khariltsagchRes.value?.data) {
        const kList: any[] = Array.isArray(khariltsagchRes.value.data.jagsaalt)
          ? khariltsagchRes.value.data.jagsaalt
          : [];

        kList.forEach((k) => {
          const kId = String(k._id || "");
          const rawPhone = Array.isArray(k.utas) ? k.utas[0] : k.utas;
          const phone = String(rawPhone || "").replace(/\D/g, "");

          const hasDirectCar =
            (Array.isArray(k.mashinuud) && k.mashinuud.length > 0) ||
            (k.mashiniiDugaar && k.mashiniiDugaar !== "БҮРТГЭЛГҮЙ" && k.mashiniiDugaar !== "-") ||
            (k.dugaar && k.dugaar !== "БҮРТГЭЛГҮЙ" && k.dugaar !== "-");

          const hasCar =
            hasDirectCar ||
            (phone && registeredPhones.has(phone)) ||
            (kId && registeredResidentIds.has(kId));

          if (!hasCar) {
            if (phone && seenPhones.has(phone)) return;
            if (phone) seenPhones.add(phone);

            const toot = String(k.toot || (k.toots && k.toots[0]?.toot) || "").trim();
            const ner = String(k.ner || "").trim();
            const ovog = String(k.ovog || "").trim();

            if (ner || phone || toot) {
              templateRows.push({
                ovog,
                ner,
                utas: phone,
                toot,
                turul: "Харилцагч",
                plate: "",
                tailbar: "",
              });
            }
          }
        });
      }

      // Тоот болон нэрээр нь цэгцтэй эрэмбэлэх
      templateRows.sort((a, b) => {
        const numA = parseInt(a.toot, 10);
        const numB = parseInt(b.toot, 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numA - numB;
        }
        if (a.toot && b.toot && a.toot !== b.toot) {
          return a.toot.localeCompare(b.toot, "mn");
        }
        return a.ner.localeCompare(b.ner, "mn");
      });

      const rowsToWrite =
        templateRows.length > 0
          ? templateRows
          : [
              {
                ovog: "Дорж",
                ner: "Бат",
                utas: "99112233",
                toot: "106",
                turul: "Оршин суугч",
                plate: "1234УБА",
                tailbar: "1-р орц",
              },
            ];

      const ExcelJS = (await import("exceljs")).default || (await import("exceljs"));
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Машин бүртгэл");

      worksheet.columns = [
        { header: "Овог", key: "ovog", width: 14 },
        { header: "Нэр", key: "ner", width: 14 },
        { header: "Утас", key: "utas", width: 14 },
        { header: "Тоот", key: "toot", width: 12 },
        { header: "Төрөл", key: "turul", width: 18 },
        { header: "Улсын дугаар", key: "plate", width: 16 },
        { header: "Тайлбар", key: "tailbar", width: 24 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;

      // Үндсэн стандарт өнгө: #059669 (ARGB: FF059669)
      // ЗӨВХӨН 1-7 дугаар багануудын нүдийг будна — бүх баганад будагдах (empty column color) алдааг арилгасан
      for (let col = 1; col <= 7; col++) {
        const cell = headerRow.getCell(col);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF059669" },
        };
        cell.font = {
          name: "Segoe UI",
          bold: true,
          color: { argb: "FFFFFFFF" },
          size: 11,
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "FF047857" } },
          left: { style: "thin", color: { argb: "FF047857" } },
          bottom: { style: "thin", color: { argb: "FF047857" } },
          right: { style: "thin", color: { argb: "FF047857" } },
        };
      }

      // Өгөгдлийн мөрүүдийг нэмж загваржуулах
      rowsToWrite.forEach((r) => {
        const row = worksheet.addRow(r);
        row.height = 22;
        for (let col = 1; col <= 7; col++) {
          const cell = row.getCell(col);
          cell.font = { name: "Segoe UI", size: 10 };
          cell.alignment = {
            vertical: "middle",
            horizontal: col === 3 || col === 4 || col === 5 || col === 6 ? "center" : "left",
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
          if (col === 3 && cell.value) {
            cell.numFmt = "@";
          }
        }
      });

      // Төрөл баганад Excel dropdown Data Validation нэмэх
      const dropdownList = TURUL_OPTIONS.join(",");
      const maxValidationRow = Math.max(rowsToWrite.length + 100, 500);
      for (let i = 2; i <= maxValidationRow; i++) {
        worksheet.getCell(`E${i}`).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${dropdownList}"`],
          showErrorMessage: true,
          errorTitle: "Буруу утга",
          error: `Төрлийг жагсаалтаас сонгоно уу: ${dropdownList}`,
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Машин_бүртгэл_загвар.xlsx";
      anchor.click();
      window.URL.revokeObjectURL(url);

      if (templateRows.length > 0) {
        toast.success(`Бүртгэлгүй ${templateRows.length} оршин суугч, харилцагчийг татлаа.`);
      } else {
        toast.success("Бүртгэлгүй оршин суугч олдсонгүй (загвар татагдлаа).");
      }
    } catch (err: any) {
      toast.error("Загвар татахад алдаа гарлаа");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Дахин ижил файл сонгоход onChange асахын тулд утгыг тэглэнэ.
    e.target.value = "";
    if (!file) return;

    setParsing(true);
    setFailed([]);
    setOrkhigduulsan(new Set());
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) {
          toast.error("Excel файл хоосон байна.");
          setRows([]);
          return;
        }

        const uzegdsen = { plate: new Set<string>(), utas: new Set<string>() };
        const parsed: ParsedRow[] = raw.map((r, i) => {
          const base = {
            excelRow: i + 2,
            plate: normalizePlate(cellText(r["Улсын дугаар"])),
            ovog: cellText(r["Овог"]),
            ner: cellText(r["Нэр"]),
            utas: cellText(r["Утас"]).replace(/\D/g, ""),
            toot: cellText(r["Тоот"]),
            turul: normalizeTurul(cellText(r["Төрөл"])),
            tailbar: cellText(r["Тайлбар"]),
          };
          const errors = validateRow(base, uzegdsen);
          if (base.plate) uzegdsen.plate.add(base.plate);
          if (base.utas) uzegdsen.utas.add(base.utas);
          return { ...base, errors };
        });

        setRows(parsed);

        const bad = parsed.filter((p) => p.errors.length > 0).length;
        if (bad > 0) {
          toast.error(`${parsed.length} мөрөөс ${bad} мөрөнд алдаа байна.`);
        } else {
          toast.success(
            `${parsed.length} мөр уншигдлаа — шалгаад импортлоно уу.`,
          );
        }
      } catch {
        toast.error("Excel файл уншихад алдаа гарлаа.");
        setRows([]);
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      toast.error("Файл уншихад алдаа гарлаа.");
      setParsing(false);
    };
    reader.readAsBinaryString(file);
  };

  /**
   * Мөр бүрийг дараалан илгээнэ.
   *
   * Сервер тал багц импортын endpoint-гүй тул бүртгэлийн маягттай яг ижил
   * `/zochinHadgalya` дуудлагыг мөр тутамд давтаж байна. Зэрэг илгээвэл нэг
   * утсаар олон бүртгэл үүсгэх уралдаан гарах магадлалтай тул дараалуулав.
   */
  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("Импортлох боломжтой мөр алга.");
      return;
    }

    setImporting(true);
    setProgress(0);
    const errored: { row: ParsedRow; reason: string }[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const plateToUse = row.plate || "БҮРТГЭЛГҮЙ";

      try {
        await uilchilgee(token).post("/zochinHadgalya", {
          baiguullagiinId,
          barilgiinId,
          mashiniiDugaar: plateToUse,
          ezemshigchiinUtas: row.utas,
          turul: row.turul,
          khariltsagchMedeelel: {
            ner: row.ner,
            ovog: row.ovog || row.ner,
            register: "00000000",
            utas: row.utas,
            turul: "Иргэн",
            baiguullagiinId,
            barilgiinId,
            ezenToot: row.toot,
            idevkhiteiEsekh: true,
            mashiniiDugaar: plateToUse,
            zochinTailbar: row.tailbar,
            zochinTurul: row.turul,
            zochinUrikhEsekh: true,
          },
          mashinMedeelel: {
            dugaar: plateToUse,
            ezemshigchiinNer: row.ner,
            ezemshigchiinRegister: "00000000",
            ezemshigchiinUtas: row.utas,
            turul: row.turul,
            ezemshigchiinTalbainDugaar: row.toot,
            baiguullagiinId,
            barilgiinId,
            orshinSuugchTurul: row.turul,
          },
          tukhainBaaziinKholbolt: null,
        });
      } catch (err: any) {
        errored.push({
          row,
          reason: err?.response?.data?.message || err?.message || "Алдаа",
        });
      }

      setProgress(i + 1);
    }

    setImporting(false);
    setFailed(errored);

    const ok = validRows.length - errored.length;
    if (ok > 0) {
      toast.success(`${ok} бүртгэл амжилттай орлоо.`);
      onSuccess();
    }
    if (errored.length > 0) {
      toast.error(`${errored.length} мөр амжилтгүй боллоо.`);
    } else {
      onClose();
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[color:var(--panel)] backdrop-blur-sm"
          onClick={importing ? undefined : onClose}
        />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-[color:var(--panel)] rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5"
      >
        {/* Толгой */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[color:var(--surface-border)] dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[color:var(--panel-text)] dark:text-white">
                Excel-ээр машин бүртгэх
              </h3>
              <p className="text-xs text-[color:var(--muted-text)]">
                Загварыг татаж бөглөөд буцааж оруулна уу
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-2 rounded-lg text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Биет */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFile}
            className="hidden"
          />

          {/* Файл сонгох алхам — уншсаны дараа баталгаажуулах хэсэг рүү шилжинэ */}
          {rows.length === 0 && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleDownloadTemplate}
                  variant="ghost"
                  isLoading={downloadingTemplate}
                  disabled={importing || parsing || downloadingTemplate}
                  className="flex-1 h-11 rounded-xl border border-[color:var(--surface-border)] dark:border-white/10"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  {downloadingTemplate
                    ? "Мэдээлэл татаж байна..."
                    : "Загвар татах"}
                </Button>
                <Button
                  onClick={() => fileRef.current?.click()}
                  variant="primary"
                  isLoading={parsing}
                  disabled={importing || downloadingTemplate}
                  className="flex-1 h-11 rounded-xl"
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Excel файл сонгох
                </Button>
              </div>

              <p className="text-xs text-[color:var(--muted-text)]">
                Багана: {COLUMNS.join(" · ")}. «Загвар татах» товч нь машин
                бүртгэлгүй бүх оршин суугч, харилцагчдын нэр, утас, тоотыг бэлтгэж
                татна. Улсын дугаарыг нь бөглөөд оруулна уу. Дугаар хоосон бол{" "}
                <span className="font-mono">БҮРТГЭЛГҮЙ</span> гэж орно.
              </p>
            </>
          )}

          {fileName && (
            <div className="flex items-center gap-2 text-xs text-[color:var(--muted-text)]">
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="truncate">{fileName}</span>
              {rows.length > 0 && (
                <span className="ml-auto shrink-0 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-theme/10 text-brand">
                    Зөв: {validRows.length}
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-danger/10 text-danger">
                      Алдаатай: {invalidCount}
                    </span>
                  )}
                  {orkhigduulsan.size > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-[color:var(--panel)] dark:bg-white/10 text-[color:var(--panel-text)]">
                      Хасагдсан: {orkhigduulsan.size}
                    </span>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={importing || parsing}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[color:var(--surface-border)] dark:border-white/10 hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Өөр файл
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Урьдчилан харах */}
          {rows.length > 0 && (
            <div className="border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead className="sticky top-0 z-10 bg-[color:var(--surface-hover)]">
                    <tr>
                      <th className="px-3 py-2 text-xs text-[color:var(--panel-text)] w-12 text-center">
                        №
                      </th>
                      <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                        Овог, Нэр
                      </th>
                      <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                        Утас
                      </th>
                      <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                        Тоот
                      </th>
                      <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                        Төрөл
                      </th>
                      <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                        Улсын дугаар
                      </th>
                      <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                        Төлөв
                      </th>
                      <th className="px-3 py-2 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--surface-border)] dark:divide-white/5">
                    {rows.map((r) => (
                      <tr
                        key={r.excelRow}
                        className={[
                          r.errors.length > 0
                            ? "bg-danger/60"
                            : "",
                          orkhigduulsan.has(r.excelRow) ? "opacity-40" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <td className="px-3 py-2 text-center text-xs text-[color:var(--muted-text)]">
                          {r.excelRow}
                        </td>
                        <td className="px-3 py-2 text-[color:var(--panel-text)] font-medium">
                          {[r.ovog, r.ner].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-[color:var(--panel-text)]">
                          {r.utas || "—"}
                        </td>
                        <td className="px-3 py-2 text-[color:var(--panel-text)]">
                          {r.toot || "—"}
                        </td>
                        <td className="px-3 py-2 text-[color:var(--panel-text)]">
                          {r.turul}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-[color:var(--panel-text)] font-semibold">
                          {r.plate || "БҮРТГЭЛГҮЙ"}
                        </td>
                        <td className="px-3 py-2">
                          {r.errors.length > 0 ? (
                            <span className="inline-flex items-start gap-1 text-xs text-danger">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              {r.errors.join(", ")}
                            </span>
                          ) : orkhigduulsan.has(r.excelRow) ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-text)]">
                              Хасагдсан
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-brand">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Бэлэн
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.errors.length === 0 && (
                            <button
                              onClick={() => murTogloy(r.excelRow)}
                              disabled={importing}
                              title={
                                orkhigduulsan.has(r.excelRow)
                                  ? "Буцааж оруулах"
                                  : "Энэ мөрийг импортлохгүй"
                              }
                              className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[color:var(--muted-text)] hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-40"
                            >
                              {orkhigduulsan.has(r.excelRow) ? (
                                <RotateCcw className="w-3.5 h-3.5" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Амжилтгүй болсон мөрүүд */}
          {failed.length > 0 && (
            <div className="rounded-xl border border-danger/30 bg-danger/60 p-3 space-y-1">
              <p className="text-xs font-semibold text-danger">
                Дараах мөрүүд серверт хадгалагдсангүй:
              </p>
              {failed.map((f) => (
                <p
                  key={f.row.excelRow}
                  className="text-xs text-danger/90"
                >
                  {f.row.excelRow}-р мөр ({f.row.ner}) — {f.reason}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Хөл */}
        <div className="px-6 py-4 border-t border-[color:var(--surface-border)] dark:border-white/5 flex items-center justify-between gap-3">
          <p className="text-xs text-[color:var(--muted-text)]">
            {importing
              ? `Илгээж байна... ${progress} / ${validRows.length}`
              : validRows.length > 0
                ? `${validRows.length} бүртгэлийг шалгаад импортлоно уу`
                : rows.length > 0
                  ? "Импортлох боломжтой мөр алга — алдаануудыг засна уу"
                  : "Файл сонгоно уу"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="ghost"
              disabled={importing}
              className="h-11 px-5 rounded-xl border border-[color:var(--surface-border)] dark:border-white/10"
            >
              Хаах
            </Button>
            <Button
              onClick={handleImport}
              variant="primary"
              isLoading={importing}
              disabled={validRows.length === 0}
              className="h-11 px-6 rounded-xl"
            >
              Импортлох ({validRows.length})
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
    </ModalPortal>
  );
}
