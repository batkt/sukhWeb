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
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import Button from "@/components/ui/Button";

/** Excel-ийн баганын гарчгууд — загвар татах болон унших үед хоёуланд нь. */
const COLUMNS = [
  "Улсын дугаар",
  "Овог",
  "Нэр",
  "Утас",
  "Тоот",
  "Төрөл",
  "Тайлбар",
] as const;

/** Бүртгэлийн маягт дээрх сонголтуудтай яг ижил жагсаалт. */
const TURUL_OPTIONS = [
  "Оршин суугч",
  "Харилцагч",
  "Ажилтан",
  "СӨХ",
  "Үнэгүй",
  "Дотоод",
];

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

/** Улсын дугаарыг маягт дээрхтэй ижил дүрмээр цэгцэлнэ. */
function normalizePlate(raw: string): string {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/\s/g, "")
    .slice(0, 7);
}

/** Excel тоон нүднээс утас "99112233" биш 99112233 болж ирдгийг барина. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function validateRow(row: Omit<ParsedRow, "errors">): string[] {
  const errors: string[] = [];
  if (!row.ner) errors.push("Нэр хоосон");
  if (!row.utas) {
    errors.push("Утас хоосон");
  } else if (!/^\d{8}$/.test(row.utas)) {
    errors.push("Утас 8 оронтой байх ёстой");
  }
  if (row.turul && !TURUL_OPTIONS.includes(row.turul)) {
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

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalidCount = rows.length - validRows.length;

  /** Хоосон загвар татах — хэрэглэгч ямар багана хэрэгтэйг эндээс мэдэнэ. */
  const handleDownloadTemplate = async () => {
    // xlsx ~400 kB тул зөвхөн хэрэгтэй үед нь ачаална.
    const XLSX = await import("xlsx");
    const sample = [
      {
        "Улсын дугаар": "1234УБА",
        Овог: "Дорж",
        Нэр: "Бат",
        Утас: "99112233",
        Тоот: "106",
        Төрөл: "Оршин суугч",
        Тайлбар: "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header: COLUMNS as unknown as string[] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Машин бүртгэл");
    XLSX.writeFile(wb, "Машин_бүртгэл_загвар.xlsx");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Дахин ижил файл сонгоход onChange асахын тулд утгыг тэглэнэ.
    e.target.value = "";
    if (!file) return;

    setParsing(true);
    setFailed([]);
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

        const parsed: ParsedRow[] = raw.map((r, i) => {
          const base = {
            excelRow: i + 2,
            plate: normalizePlate(cellText(r["Улсын дугаар"])),
            ovog: cellText(r["Овог"]),
            ner: cellText(r["Нэр"]),
            utas: cellText(r["Утас"]).replace(/\D/g, ""),
            toot: cellText(r["Тоот"]),
            turul: cellText(r["Төрөл"]) || "Оршин суугч",
            tailbar: cellText(r["Тайлбар"]),
          };
          return { ...base, errors: validateRow(base) };
        });

        setRows(parsed);

        const bad = parsed.filter((p) => p.errors.length > 0).length;
        if (bad > 0) {
          toast.error(`${parsed.length} мөрөөс ${bad} мөрөнд алдаа байна.`);
        } else {
          toast.success(`${parsed.length} мөр уншигдлаа.`);
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={importing ? undefined : onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5"
      >
        {/* Толгой */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-800 dark:text-white">
                Excel-ээр машин бүртгэх
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Загварыг татаж бөглөөд буцааж оруулна уу
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Биет */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownloadTemplate}
              variant="ghost"
              className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-white/10"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Загвар татах
            </Button>
            <Button
              onClick={() => fileRef.current?.click()}
              variant="primary"
              isLoading={parsing}
              disabled={importing}
              className="flex-1 h-11 rounded-xl"
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Excel файл сонгох
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Багана: {COLUMNS.join(" · ")}. Улсын дугаар хоосон бол{" "}
            <span className="font-mono">БҮРТГЭЛГҮЙ</span> гэж бүртгэгдэнэ. Төрөл
            хоосон бол «Оршин суугч» болно.
          </p>

          {fileName && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="truncate">{fileName}</span>
              {rows.length > 0 && (
                <span className="ml-auto shrink-0 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    Зөв: {validRows.length}
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                      Алдаатай: {invalidCount}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}

          {/* Урьдчилан харах */}
          {rows.length > 0 && (
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 w-12 text-center">
                        №
                      </th>
                      <th className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        Улсын дугаар
                      </th>
                      <th className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        Нэр
                      </th>
                      <th className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        Утас
                      </th>
                      <th className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        Тоот
                      </th>
                      <th className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        Төрөл
                      </th>
                      <th className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        Төлөв
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {rows.map((r) => (
                      <tr
                        key={r.excelRow}
                        className={
                          r.errors.length > 0
                            ? "bg-rose-50/60 dark:bg-rose-950/20"
                            : ""
                        }
                      >
                        <td className="px-3 py-2 text-center text-xs text-slate-500">
                          {r.excelRow}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-800 dark:text-slate-100">
                          {r.plate || "БҮРТГЭЛГҮЙ"}
                        </td>
                        <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                          {[r.ovog, r.ner].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                          {r.utas || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                          {r.toot || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                          {r.turul}
                        </td>
                        <td className="px-3 py-2">
                          {r.errors.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Бэлэн
                            </span>
                          ) : (
                            <span className="inline-flex items-start gap-1 text-xs text-rose-700 dark:text-rose-300">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              {r.errors.join(", ")}
                            </span>
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
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Дараах мөрүүд серверт хадгалагдсангүй:
              </p>
              {failed.map((f) => (
                <p
                  key={f.row.excelRow}
                  className="text-xs text-rose-700/90 dark:text-rose-300/90"
                >
                  {f.row.excelRow}-р мөр ({f.row.ner}) — {f.reason}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Хөл */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {importing
              ? `Илгээж байна... ${progress} / ${validRows.length}`
              : validRows.length > 0
                ? `${validRows.length} бүртгэл импортлоход бэлэн`
                : "Файл сонгоно уу"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="ghost"
              disabled={importing}
              className="h-11 px-5 rounded-xl border border-slate-200 dark:border-white/10"
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
  );
}
