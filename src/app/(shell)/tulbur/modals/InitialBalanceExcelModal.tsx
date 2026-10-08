"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import Button from "@/components/ui/Button";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import MultiFilterSelect, {
  MultiFilterSelectOption,
} from "@/components/ui/MultiFilterSelect";

/** Файлаас уншсан, импортлогдох гэж буй нэг мөр. */
type UriidchilsanMur = {
  mur: number;
  ognoo?: string | Date | null;
  ner: string;
  gereeniiDugaar: string;
  toot: string;
  dun: number;
  tailbar: string;
  /** Төлөлтийн горимд сервер тооцож өгнө; авлагад null. */
  umnukhUldegdel: number | null;
  shineUldegdel: number | null;
  aldaa: string | null;
};

interface InitialBalanceExcelModalProps {
  show: boolean;
  onClose: () => void;
  baiguullagiinId: string;
  barilgiinId?: string;
  onSuccess: () => void;
}

export default function InitialBalanceExcelModal({
  show,
  onClose,
  baiguullagiinId,
  barilgiinId,
  onSuccess,
}: InitialBalanceExcelModalProps) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  // Горим: АВЛАГА (эхний үлдэгдэл) эсвэл ТӨЛӨЛТ. Анхдагч нь авлага —
  // энэ модал анх зөвхөн түүнд зориулагдсан тул хуучин зан төлөв хэвээр.
  const [gorim, setGorim] = useState<"avlaga" | "tulult">("avlaga");
  const tulultEsekh = gorim === "tulult";
  // Урьдчилан харах — файлыг сонгомогц ХӨТӨЧ дээр задалж харуулна.
  // Сервер рүү илгээхээс өмнө буруу файл/хоосон багана сонгосныг анзаарах
  // боломж өгнө.
  const [uriidchilsan, setUriidchilsan] = useState<UriidchilsanMur[]>([]);
  const [khoosonToo, setKhoosonToo] = useState(0);
  const [uriidchilj, setUriidchilj] = useState(false);
  const dunBaganiinNer = tulultEsekh ? "Төлөлт" : "Эхний үлдэгдэл";
  // Алдаатай мөр бичигдэхгүй тул нийлбэрт оруулахгүй.
  const niitDun = uriidchilsan.reduce(
    (d, m) => d + (m.aldaa ? 0 : m.dun || 0),
    0,
  );
  const aldaataiToo = uriidchilsan.filter((m) => m.aldaa).length;
  // Эхний үлдэгдлийг аль ашиглалтын зардлаар бүртгэх («» = ерөнхий эхний үлдэгдэл)
  const [selectedZardluud, setSelectedZardluud] = useState<string[]>([]);
  const { zardluud } = useAshiglaltiinZardluud({
    token: token || "",
    baiguullagiinId,
    barilgiinId,
  });
  const zardliinSongolt: MultiFilterSelectOption[] = React.useMemo(() => {
    return Array.from(
      new Map(
        (Array.isArray(zardluud) ? zardluud : [])
          .filter((z) => z?.ner)
          .map((z) => [
            String(z.ner),
            {
              value: String(z.ner),
              label: String(z.ner),
              tailbar: z.tariff ? `${z.tariff.toLocaleString()}₮` : undefined,
            },
          ]),
      ).values(),
    );
  }, [zardluud]);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  const handleDownloadTemplate = async () => {
    try {
      const resp = await uilchilgee(token || "").post(
        tulultEsekh
          ? "/generateTulultTemplate"
          : "/generateInitialBalanceTemplate",
        {
          baiguullagiinId,
          barilgiinId,
          zardluud:
            !tulultEsekh && selectedZardluud.length > 0
              ? selectedZardluud
              : undefined,
        },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      const zardalSuffix =
        !tulultEsekh && selectedZardluud.length > 0
          ? `_${selectedZardluud.length}зардал`
          : "";
      link.setAttribute(
        "download",
        `${tulultEsekh ? "Төлөлт" : "Эхний үлдэгдэл"}${zardalSuffix} загвар_${Date.now()}.xlsx`,
      );
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Загвар татахад алдаа гарлаа");
    }
  };

  /**
   * Excel-ийг задалж урьдчилан харуулна.
   *
   * Задлалт нь СЕРВЕРИЙНХТЭЙ ИЖИЛ дүрэмтэй байх ёстой (эхний мөр толгой,
   * 2-р мөр хоосон бол тайлбарын мөр гэж алгасна) — эс бөгөөс урьдчилсан
   * харагдац нь бодит импортоос зөрнө.
   */
  /**
   * ТӨЛӨЛТ — серверээс урьдчилан харна.
   *
   * Гэрээг хайх, үлдэгдлийг бодохыг хөтөч дээр давтах аргагүй (тааруулалт
   * нь утас/дугаар/тоот + барилгаар явагддаг). Иймд импорттой ЯГ ИЖИЛ
   * кодоор сервер тооцоод буцаана — урьдчилсан зураг нь бодит үр дүнгээс
   * зөрөхгүй.
   */
  const serverEesUriidchileye = async (songosonFile: File) => {
    const formData = new FormData();
    formData.append("file", songosonFile);
    formData.append("baiguullagiinId", baiguullagiinId);
    if (barilgiinId) formData.append("barilgiinId", barilgiinId);

    const khariu = await uilchilgee(token || "").post(
      "/uriidchlekhTulultExcel",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    const muruud: UriidchilsanMur[] = (khariu.data?.muruud || []).map(
      (m: any) => ({
        mur: m.rowNumber,
        ognoo: m.ognoo || null,
        ner: m.ner || "",
        gereeniiDugaar: m.gereeniiDugaar || "",
        toot: m.toot || "",
        dun: Number(m.dun) || 0,
        tailbar: m.tailbar || "",
        umnukhUldegdel:
          m.umnukhUldegdel === null ? null : Number(m.umnukhUldegdel),
        shineUldegdel:
          m.shineUldegdel === null ? null : Number(m.shineUldegdel),
        aldaa: m.aldaa || null,
      }),
    );

    setUriidchilsan(muruud);
    setKhoosonToo(Number(khariu.data?.khooson) || 0);
  };

  const uriidchilanKharuulya = async (songosonFile: File) => {
    if (tulultEsekh) {
      try {
        setUriidchilj(true);
        await serverEesUriidchileye(songosonFile);
      } catch (_aldaa) {
        setUriidchilsan([]);
        setKhoosonToo(0);
        toast.error("Урьдчилан харах боломжгүй байна");
      } finally {
        setUriidchilj(false);
      }
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const buf = await songosonFile.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const bukhMur: any[][] = XLSX.utils.sheet_to_json(ws, {
        raw: false,
        header: 1,
      });

      const tolgoi: string[] = (bukhMur[0] || []).map((x: any) =>
        String(x ?? "").trim(),
      );

      const khoyrdugaar = bukhMur[1];
      const khoyrdugaarKhooson =
        !khoyrdugaar ||
        !khoyrdugaar.some(
          (c: any) => c !== undefined && c !== null && c !== "",
        );
      const ekhlel = khoyrdugaarKhooson ? 2 : 1;

      // Тодорхой мета багануудаас бусад нь зардлын баганууд
      const metaHeaders = new Set([
        "Нэр",
        "Гэрээний дугаар",
        "Утас",
        "Орц",
        "Давхар",
        "Тоот",
        "Тайлбар",
        "Огноо",
        "ognoo",
        "toot",
        "utas",
        "ner",
        "orts",
        "davkhar",
      ]);

      let expenseHeaders = tolgoi.filter((k) => k && !metaHeaders.has(k));
      if (expenseHeaders.length === 0) {
        expenseHeaders = [dunBaganiinNer];
      }

      const muruud: UriidchilsanMur[] = [];
      let khooson = 0;

      bukhMur.slice(ekhlel).forEach((r: any[], i: number) => {
        if (
          !r ||
          !r.some((c: any) => c !== undefined && c !== null && c !== "")
        ) {
          return;
        }

        const obj: Record<string, any> = {};
        tolgoi.forEach((k, idx) => {
          if (k) obj[k] = r[idx] ?? "";
        });

        let rowDun = 0;
        let hasAnyValue = false;
        const zadargaa: string[] = [];

        expenseHeaders.forEach((col) => {
          const rawVal = String(obj[col] ?? "").trim();
          if (rawVal) {
            const parsed = Number(rawVal.replace(/[^0-9.-]/g, ""));
            if (!isNaN(parsed) && parsed !== 0) {
              hasAnyValue = true;
              rowDun += parsed;
              if (expenseHeaders.length > 1) {
                zadargaa.push(`${col}: ${parsed.toLocaleString("mn-MN")}₮`);
              }
            }
          }
        });

        if (!hasAnyValue) {
          khooson += 1;
          return;
        }

        const customTailbar = String(obj["Тайлбар"] ?? "").trim();
        const displayTailbar = customTailbar || zadargaa.join(", ");

        muruud.push({
          mur: ekhlel + i + 1,
          ner: String(obj["Нэр"] ?? "").trim(),
          gereeniiDugaar: String(obj["Гэрээний дугаар"] ?? "").trim(),
          toot: String(obj["Тоот"] ?? "").trim(),
          dun: rowDun,
          tailbar: displayTailbar,
          // Авлагын горимд үлдэгдлийг урьдчилж тооцохгүй — энэ нь зөвхөн
          // файлыг зөв уншсан эсэхийг шалгах зорилготой.
          umnukhUldegdel: null,
          shineUldegdel: null,
          aldaa: null,
        });
      });

      setUriidchilsan(muruud);
      setKhoosonToo(khooson);
    } catch (_aldaa) {
      setUriidchilsan([]);
      setKhoosonToo(0);
      toast.error("Excel файлыг уншиж чадсангүй");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const songoson = e.target.files[0];
      setFile(songoson);
      uriidchilanKharuulya(songoson);
    }
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFile(null);
    setUriidchilsan([]);
    setKhoosonToo(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning("Excel файл сонгоно уу");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("baiguullagiinId", baiguullagiinId);
      if (barilgiinId) formData.append("barilgiinId", barilgiinId);
      formData.append("ognoo", selectedDate);
      // Ашиглалтын зардал нь ЗӨВХӨН авлагад хамаарна — төлөлт нь аль
      // нэхэмжлэхэд хуваарилагдахаа дэвтрийн дарааллаар өөрөө шийднэ.
      if (!tulultEsekh && selectedZardluud.length > 0) {
        if (selectedZardluud.length === 1) {
          const z = (Array.isArray(zardluud) ? zardluud : []).find(
            (x) => x?.ner === selectedZardluud[0],
          );
          formData.append("zardliinNer", selectedZardluud[0]);
          if (z?.zardliinTurul || z?.turul) {
            formData.append("zardliinTurul", String(z.zardliinTurul || z.turul));
          }
        }
      }

      const response = await uilchilgee(token || "").post(
        tulultEsekh ? "/importTulultFromExcel" : "/importInitialBalanceFromExcel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.success(response.data.message || "Амжилттай импортлогдлоо");
        onSuccess();
        onClose();
        setFile(null);
        setUriidchilsan([]);
        setKhoosonToo(0);
      } else {
        toast.error(response.data.message || "Импортлоход алдаа гарлаа");
      }
    } catch (error: any) {
      console.error("Error uploading excel:", error);
      toast.error(
        error.response?.data?.message || "Импортлоход алдаа гарлаа",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-[12000]"
      >
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
          className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 bg-[color:var(--surface-bg)] rounded-[32px] shadow-2xl w-[min(1040px,96vw)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Draggable Title Bar */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="-mt-2 mb-6 px-1 py-1 flex items-center justify-between cursor-move select-none"
            >
              <div className="text-sm font-medium text-[color:var(--panel-text)] dark:text-white">
                Гүйлгээ импорт (Excel)
              </div>
              <Button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                variant="ghost"
                className="p-2 rounded-full"
              >
                <X className="w-5 h-5 text-[color:var(--muted-text)]" />
              </Button>
            </div>
            {/* Нэг мөрөнд: Горим сонголт, Огноо, Зардал сонголт */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Горим сонголт */}
                <div
                  className="inline-flex rounded-2xl border border-[color:var(--surface-border)] p-1 bg-[color:var(--surface-hover)]"
                  role="tablist"
                  aria-label="Гүйлгээний төрөл"
                >
                  {([
                    { utga: "avlaga", shoshgo: "Авлага" },
                    { utga: "tulult", shoshgo: "Төлөлт" },
                  ] as const).map((s) => (
                    <button
                      key={s.utga}
                      type="button"
                      role="tab"
                      aria-selected={gorim === s.utga}
                      onClick={() => {
                        setGorim(s.utga);
                        setSelectedZardluud([]);
                        handleRemoveFile();
                      }}
                      className={`rounded-xl px-4 py-1.5 text-xs font-medium transition-colors ${
                        gorim === s.utga
                          ? "bg-theme text-white shadow-sm"
                          : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                      }`}
                    >
                      {s.shoshgo}
                    </button>
                  ))}
                </div>

                {/* Огноо */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-1.5 border border-[color:var(--surface-border)] bg-transparent rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-theme/20 h-[34px]"
                />
              </div>

              {/* Ашиглалтын зардал сонгох — ЗӨВХӨН авлагад хамаарна */}
              {!tulultEsekh && (
                <div className="min-w-0 flex-1 max-w-[280px]">
                  <MultiFilterSelect
                    value={selectedZardluud}
                    onChange={(v) => setSelectedZardluud(v)}
                    options={zardliinSongolt}
                    placeholder="Ашиглалтын зардал сонгох"
                    allSelectedLabel="Бүх зардал сонгогдсон"
                  />
                </div>
              )}
            </div>

            <p className="-mt-1 mb-4 text-[11px] text-[color:var(--muted-text)] italic">
              {tulultEsekh
                ? "* Сонгосон огноогоор төлөлт бүртгэгдэж, нэхэмжлэхийн төлөв автоматаар шинэчлэгдэнэ."
                : selectedZardluud.length > 0
                  ? `* Сонгосон ${selectedZardluud.length} зардлаар («${selectedZardluud.slice(0, 3).join(", ")}${selectedZardluud.length > 3 ? "..." : ""}») эхний үлдэгдлийн баганууд үүснэ.`
                  : "* Зардал сонгоогүй үед ерөнхий «Эхний үлдэгдэл» баганаар загвар үүсэж бүртгэгдэнэ."}
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
            />

            {/* Excel файл оруулах хэсэг — сонгосон бол нэг мөрийн авсаархан харагдац, устгах товчтой */}
            {file ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-theme/40 bg-theme/10 dark:bg-theme/20 px-4 py-2.5 transition-all">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  title="Өөр файл сонгох бол дарна уу"
                >
                  <div className="w-8 h-8 rounded-xl bg-success/20 text-success flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[color:var(--panel-text)] truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[color:var(--muted-text)]">
                      {(file.size / 1024).toFixed(1)} KB · {tulultEsekh ? "Төлөлтийн" : "Эхний үлдэгдэл"} excel · Солих бол дарна уу
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-xl text-[color:var(--muted-text)] hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                  title="Файлыг хасах"
                  aria-label="Файлыг хасах"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] hover:border-theme hover:bg-theme/10 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-info/10 text-info transition-transform duration-200 group-hover:scale-110 shrink-0">
                  <Upload size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-[color:var(--panel-text)]">
                    Excel файл аа чирч оруулах эсвэл дарж сонгоно уу
                  </p>
                  <p className="text-[11px] text-[color:var(--muted-text)]">
                    {tulultEsekh ? "Төлөлтийн" : "Эхний үлдэгдэл"} excel загвар (.xlsx, .xls)
                  </p>
                </div>
              </div>
            )}

            {/* Урьдчилан харах — импортлогдох мөрүүд */}
            {uriidchilj && (
              <p className="mt-6 text-center text-xs text-[color:var(--muted-text)]">
                Урьдчилан бодож байна...
              </p>
            )}

            {!uriidchilj && uriidchilsan.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[color:var(--panel-text)]">
                    Импортлогдох {uriidchilsan.filter((m) => !m.aldaa).length} мөр
                    {aldaataiToo > 0 ? ` · ${aldaataiToo} алдаатай` : ""}
                    {khoosonToo > 0 ? ` · ${khoosonToo} хоосон мөр алгасна` : ""}
                  </span>
                  <span className="font-medium tabular-nums text-[color:var(--panel-text)]">
                    Нийт {niitDun.toLocaleString("mn-MN")}₮
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[color:var(--surface-border)] dark:border-white/10">
                  <div className="custom-scrollbar max-h-[360px] overflow-auto">
                    {/*
                      ТОЛГОЙГ НААЛТТАЙ байлгахын тулд `border-collapse` БИШ
                      `border-separate` хэрэглэнэ: collapse үед хөтөч нь
                      `position: sticky`-г thead/th дээр үл тоодог тул толгой
                      гүйлгэхэд дагаж алга болдог байв.
                    */}
                    <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                      <thead>
                        <tr>
                          {[
                            { ner: "№", kl: "w-12 text-center" },
                            ...(tulultEsekh
                              ? [{ ner: "Огноо", kl: "w-28 text-center whitespace-nowrap" }]
                              : []),
                            { ner: "Нэр", kl: "" },
                            { ner: "Гэрээ", kl: "" },
                            { ner: "Тоот", kl: "" },
                            { ner: dunBaganiinNer, kl: "text-right" },
                            ...(tulultEsekh
                              ? [
                                  { ner: "Өмнөх үлдэгдэл", kl: "text-right" },
                                  { ner: "Шинэ үлдэгдэл", kl: "text-right" },
                                  { ner: "Тайлбар", kl: "" },
                                ]
                              : [{ ner: "Тайлбар / Зардал", kl: "" }]),
                          ].map((b) => (
                            <th
                              key={b.ner}
                              className={`sticky top-0 z-10 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] [background-image:linear-gradient(var(--surface-hover),var(--surface-hover))] px-3 py-2 text-xs font-medium text-[color:var(--panel-text)] dark:border-white/10 ${b.kl}`}
                            >
                              {b.ner}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uriidchilsan.map((m) => (
                          <tr
                            key={m.mur}
                            className={m.aldaa ? "bg-danger/30" : ""}
                          >
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-center text-xs text-[color:var(--muted-text)] dark:border-white/5">
                              {m.mur}
                            </td>
                            {tulultEsekh && (
                              <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-center text-xs font-mono text-[color:var(--muted-text)] dark:border-white/5 whitespace-nowrap">
                                {m.ognoo
                                  ? new Date(m.ognoo).toISOString().split("T")[0]
                                  : selectedDate}
                              </td>
                            )}
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-[color:var(--panel-text)] dark:border-white/5">
                              {m.ner || "—"}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-[color:var(--panel-text)] dark:border-white/5">
                              {m.gereeniiDugaar || "—"}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-[color:var(--panel-text)] dark:border-white/5">
                              {m.toot || "—"}
                            </td>
                            <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-right tabular-nums text-[color:var(--panel-text)] dark:border-white/5">
                              {m.dun.toLocaleString("mn-MN")}
                            </td>

                            {tulultEsekh ? (
                              <>
                                <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-right tabular-nums text-[color:var(--muted-text)] dark:border-white/5">
                                  {m.umnukhUldegdel === null
                                    ? "—"
                                    : m.umnukhUldegdel.toLocaleString("mn-MN")}
                                </td>
                                <td
                                  className={`border-b border-[color:var(--surface-border)] px-3 py-2 text-right font-medium tabular-nums dark:border-white/5 ${
                                    m.shineUldegdel !== null &&
                                    m.shineUldegdel < 0
                                      ? "text-danger"
                                      : "text-[color:var(--panel-text)]"
                                  }`}
                                >
                                  {m.shineUldegdel === null
                                    ? "—"
                                    : m.shineUldegdel.toLocaleString("mn-MN")}
                                </td>
                                <td className="border-b border-[color:var(--surface-border)] px-3 py-2 text-[color:var(--muted-text)] dark:border-white/5">
                                  {m.aldaa || m.tailbar || "—"}
                                </td>
                              </>
                            ) : (
                              <td
                                className="border-b border-[color:var(--surface-border)] px-3 py-2 text-xs text-[color:var(--muted-text)] dark:border-white/5 max-w-[260px] truncate"
                                title={m.tailbar || ""}
                              >
                                {m.tailbar || "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="mt-2 text-[11px] italic text-[color:var(--muted-text)]">
                  {tulultEsekh
                    ? "* «Шинэ үлдэгдэл» нь энэ файлыг хадгалсны дараах үлдэгдэл. Сөрөг бол илүү төлөлт."
                    : "* Улаан мөр нь дүн нь 0 буюу танигдаагүй — сервер түүнийг алдаатай гэж буцаана."}
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button
                onClick={handleDownloadTemplate}
                variant="ghost"
                className="text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {tulultEsekh ? "Төлөлтийн" : "Эхний үлдэгдэл"} загвар татах
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="px-6 py-2.5"
                >
                  Хаах
                </Button>
                <Button
                  onClick={handleUpload}
                  isLoading={isUploading}
                  disabled={!file || isUploading}
                  variant="primary"
                  className="px-8 py-2.5"
                >
                  {isUploading ? "Уншиж байна..." : "Хадгалах"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </ModalPortal>
    </AnimatePresence>
  );
}
