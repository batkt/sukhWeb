"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { message } from "antd";
import { useAuth } from "@/lib/useAuth";
import Button from "@/components/ui/Button";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import FilterSelect from "@/components/ui/FilterSelect";

/** Файлаас уншсан, импортлогдох гэж буй нэг мөр. */
type UriidchilsanMur = {
  mur: number;
  ner: string;
  gereeniiDugaar: string;
  toot: string;
  dun: number;
  tailbar: string;
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
  const dunBaganiinNer = tulultEsekh ? "Төлөлт" : "Эхний үлдэгдэл";
  const niitDun = uriidchilsan.reduce((d, m) => d + (m.dun || 0), 0);
  // Эхний үлдэгдлийг аль ашиглалтын зардлаар бүртгэх («» = ерөнхий эхний үлдэгдэл)
  const [zardal, setZardal] = useState<string>("");
  const { zardluud } = useAshiglaltiinZardluud({
    token: token || "",
    baiguullagiinId,
    barilgiinId,
  });
  const zardliinSongolt = [
    { value: "", label: "Эхний үлдэгдэл (ерөнхий)" },
    ...Array.from(
      new Map(
        (Array.isArray(zardluud) ? zardluud : [])
          .filter((z) => z?.ner)
          .map((z) => [String(z.ner), { value: String(z.ner), label: String(z.ner) }]),
      ).values(),
    ),
  ];

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
        { baiguullagiinId, barilgiinId },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.setAttribute(
        "download",
        `${tulultEsekh ? "Төлөлт" : "Эхний үлдэгдэл"} загвар_${Date.now()}.xlsx`,
      );
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Загвар татахад алдаа гарлаа");
    }
  };

  /**
   * Excel-ийг задалж урьдчилан харуулна.
   *
   * Задлалт нь СЕРВЕРИЙНХТЭЙ ИЖИЛ дүрэмтэй байх ёстой (эхний мөр толгой,
   * 2-р мөр хоосон бол тайлбарын мөр гэж алгасна) — эс бөгөөс урьдчилсан
   * харагдац нь бодит импортоос зөрнө.
   */
  const uriidchilanKharuulya = async (songosonFile: File) => {
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

        const dunText = String(obj[dunBaganiinNer] ?? "").trim();
        if (!dunText) {
          khooson += 1;
          return;
        }

        // Excel-ээс «500,000.00» гэх мэтээр ирдэг тул тоонд хөрвүүлнэ.
        const dun = Number(dunText.replace(/[^0-9.-]/g, ""));

        muruud.push({
          mur: ekhlel + i + 1,
          ner: String(obj["Нэр"] ?? "").trim(),
          gereeniiDugaar: String(obj["Гэрээний дугаар"] ?? "").trim(),
          toot: String(obj["Тоот"] ?? "").trim(),
          dun: isNaN(dun) ? 0 : dun,
          tailbar: String(obj["Тайлбар"] ?? "").trim(),
        });
      });

      setUriidchilsan(muruud);
      setKhoosonToo(khooson);
    } catch (_aldaa) {
      setUriidchilsan([]);
      setKhoosonToo(0);
      message.error("Excel файлыг уншиж чадсангүй");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const songoson = e.target.files[0];
      setFile(songoson);
      uriidchilanKharuulya(songoson);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      message.warning("Excel файл сонгоно уу");
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
      if (!tulultEsekh && zardal) {
        const z = (Array.isArray(zardluud) ? zardluud : []).find((x) => x?.ner === zardal);
        formData.append("zardliinNer", zardal);
        if (z?.zardliinTurul || z?.turul) formData.append("zardliinTurul", String(z.zardliinTurul || z.turul));
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
        message.success(response.data.message || "Амжилттай импортлогдлоо");
        onSuccess();
        onClose();
        setFile(null);
        setUriidchilsan([]);
        setKhoosonToo(0);
      } else {
        message.error(response.data.message || "Импортлоход алдаа гарлаа");
      }
    } catch (error: any) {
      console.error("Error uploading excel:", error);
      message.error(
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
          className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 bg-[color:var(--surface-bg)] rounded-[32px] shadow-2xl w-[min(560px,95vw)] overflow-hidden"
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
            {/* Горим сонголт. Авлага = эхний үлдэгдэл (хуучин зан төлөв),
                Төлөлт = оршин суугчийн төлсөн мөнгийг бүртгэнэ. */}
            <div
              className="mb-5 inline-flex rounded-2xl border border-[color:var(--surface-border)] p-1"
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
                    // Багана нь өөр тул хуучин файл/урьдчилсан харагдац
                    // хүчингүй болно.
                    setGorim(s.utga);
                    setFile(null);
                    setUriidchilsan([]);
                    setKhoosonToo(0);
                  }}
                  className={`rounded-xl px-5 py-1.5 text-sm transition-colors ${
                    gorim === s.utga
                      ? "bg-theme text-white"
                      : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                  }`}
                >
                  {s.shoshgo}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 mb-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-[color:var(--surface-border)] bg-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-theme/20"
                  />
                </div>
                {/* Ашиглалтын зардал сонгох — ЗӨВХӨН авлагад хамаарна. */}
                {!tulultEsekh && (
                  <div className="min-w-0 flex-1 max-w-[240px]">
                    <FilterSelect
                      value={zardal}
                      onChange={(v) => setZardal(String(v || ""))}
                      options={zardliinSongolt}
                      bugdLabel={null}
                      allowClear={false}
                    />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[color:var(--muted-text)] italic">
                {tulultEsekh
                  ? "* Сонгосон огноогоор төлөлт бүртгэгдэж, нэхэмжлэхийн төлөв автоматаар шинэчлэгдэнэ."
                  : zardal
                    ? `* Сонгосон огноогоор «${zardal}» зардлаар эхний үлдэгдэл бүртгэгдэнэ.`
                    : "* Сонгосон огноогоор эхний үлдэгдэл бүртгэгдэнэ."}
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                group relative border-2 border-dashed rounded-[24px] p-12
                flex flex-col items-center justify-center gap-4 cursor-pointer
                transition-all duration-300
                ${
                  file
                    ? "border-theme/30 bg-theme/50"
                    : "border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] hover:border-theme hover:bg-theme/30 dark:hover:border-theme/50"
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
              />

              <div
                className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-2
                transition-transform duration-300 group-hover:scale-110
                ${file ? "bg-success/10 text-success" : "bg-info/10 text-info"}
              `}
              >
                {file ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
              </div>

              <div className="text-center">
                <p className="text-lg  text-[color:var(--panel-text)] mb-1">
                  {file
                    ? file.name
                    : "Excel файл аа чирч оруулах эсвэл сонгоно уу"}
                </p>
                <p className="text-sm text-[color:var(--muted-text)]">
                  {tulultEsekh ? "Төлөлтийн" : "Эхний үлдэгдэл"} excel файл
                </p>
              </div>
            </div>

            {/* Урьдчилан харах — импортлогдох мөрүүд */}
            {uriidchilsan.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[color:var(--panel-text)]">
                    Импортлогдох {uriidchilsan.length} мөр
                    {khoosonToo > 0 ? ` · ${khoosonToo} хоосон мөр алгасна` : ""}
                  </span>
                  <span className="font-medium text-[color:var(--panel-text)] tabular-nums">
                    Нийт {niitDun.toLocaleString("mn-MN")}₮
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-[color:var(--surface-border)] dark:border-white/10">
                  <div className="custom-scrollbar max-h-[260px] overflow-y-auto overflow-x-auto">
                    <table className="w-full border-collapse text-left text-[13px]">
                      <thead className="sticky top-0 z-10 bg-[color:var(--surface-hover)]">
                        <tr>
                          <th className="w-12 px-3 py-2 text-center text-xs text-[color:var(--panel-text)]">
                            №
                          </th>
                          <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                            Нэр
                          </th>
                          <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                            Гэрээ
                          </th>
                          <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                            Тоот
                          </th>
                          <th className="px-3 py-2 text-right text-xs text-[color:var(--panel-text)]">
                            {dunBaganiinNer}
                          </th>
                          {tulultEsekh && (
                            <th className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                              Тайлбар
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--surface-border)] dark:divide-white/5">
                        {uriidchilsan.map((m) => (
                          <tr
                            key={m.mur}
                            className={m.dun === 0 ? "bg-danger/40" : ""}
                          >
                            <td className="px-3 py-2 text-center text-xs text-[color:var(--muted-text)]">
                              {m.mur}
                            </td>
                            <td className="px-3 py-2 text-[color:var(--panel-text)]">
                              {m.ner || "—"}
                            </td>
                            <td className="px-3 py-2 text-[color:var(--panel-text)]">
                              {m.gereeniiDugaar || "—"}
                            </td>
                            <td className="px-3 py-2 text-[color:var(--panel-text)]">
                              {m.toot || "—"}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-[color:var(--panel-text)]">
                              {m.dun.toLocaleString("mn-MN")}
                            </td>
                            {tulultEsekh && (
                              <td className="px-3 py-2 text-[color:var(--muted-text)]">
                                {m.tailbar || `Төлөлт - ${m.toot} тоот`}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-2 text-[11px] italic text-[color:var(--muted-text)]">
                  * Улаан мөр нь дүн нь 0 буюу танигдаагүй — сервер түүнийг
                  алдаатай гэж буцаана.
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
