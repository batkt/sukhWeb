"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

type Props = {
  ajiltan?: any;
  baiguullaga?: any;
  token?: string;
};

export default function TuslamjTokhirgoo(props: Props) {
  const auth = useAuth();
  const token = useMemo(
    () => props.token || auth.token || "",
    [props.token, auth.token]
  );
  const orgId = useMemo(
    () => props.ajiltan?.baiguullagiinId || auth.ajiltan?.baiguullagiinId || "",
    [props.ajiltan?.baiguullagiinId, auth.ajiltan?.baiguullagiinId]
  );
  const barilgiinId = auth.barilgiinId || null;

  // Apply a gentle static green theme only while this page is mounted
  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "green-static");
    return () => {
      if (prevTheme) root.setAttribute("data-theme", prevTheme);
      else root.removeAttribute("data-theme");
    };
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [ner, setNer] = useState("");
  const [tailbar, setTailbar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);

  const [viewId, setViewId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) return openErrorOverlay("Нэвтрэх токен байхгүй");
      if (!orgId) return openErrorOverlay("Байгууллага сонгогдоогүй");
      if (!file) return openErrorOverlay("PDF файл оруулна уу");
      if (file.type !== "application/pdf")
        return openErrorOverlay("Зөвхөн PDF файл байж болно");
      const max = 10 * 1024 * 1024; // 10MB
      if (file.size > max)
        return openErrorOverlay("Файлын хэмжээ 10MB-аас хэтэрсэн байна");

      const fd = new FormData();
      fd.append("file", file);
      if (ner.trim()) fd.append("ner", ner.trim());
      if (tailbar.trim()) fd.append("tailbar", tailbar.trim());

      setUploading(true);
      const resp = await uilchilgee(token).post("/pdfFile/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        params: {
          baiguullagiinId: orgId,
          ...(barilgiinId ? { barilgiinId } : {}),
        },
      });

      const data = resp?.data || {};
      if (data?.queued) {
        openSuccessOverlay(
          "Сүлжээ байхгүй тул илгээгдлээ. Интернэт ормогц сервер рүү дамжина."
        );
        setLastUploadedId(null);
      } else {
        const newId = data?.id || data?._id || data?.result?.id || null;
        setLastUploadedId(newId);
        openSuccessOverlay("Амжилттай байршлаа");
        if (newId) setViewId(String(newId));
      }
      setFile(null);
      setNer("");
      setTailbar("");
    } catch (err) {
      aldaaBarigch(err);
    } finally {
      setUploading(false);
    }
  };

  const openPdf = async () => {
    try {
      if (!token) return openErrorOverlay("Нэвтрэх токен байхгүй");
      const id = viewId?.trim();
      if (!id) return openErrorOverlay("PDF ID оруулна уу");
      // Cleanup previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const resp = await uilchilgee(token).get(
        `/pdfFile/${encodeURIComponent(id)}/file`,
        {
          responseType: "blob" as any,
        }
      );
      const blob = resp?.data as Blob;
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setPreviewUrl(url);
      // Also open in a new tab for convenience
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      aldaaBarigch(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload panel */}
      <div className="rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">PDF байршуулах</h2>
        <form onSubmit={onUpload} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-theme">
                Файл (PDF, 10MB хүртэл)
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border px-4 py-2 bg-white text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-theme">
                Нэр (сонголттой)
              </label>
              <input
                type="text"
                value={ner}
                onChange={(e) => setNer(e.target.value)}
                placeholder="Жишээ: Ашиглалтын заавар"
                className="w-full rounded-2xl border px-4 py-2 bg-white text-theme"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-theme">
              Тайлбар (сонголттой)
            </label>
            <textarea
              value={tailbar}
              onChange={(e) => setTailbar(e.target.value)}
              rows={3}
              placeholder="Товч тайлбар..."
              className="w-full rounded-2xl border px-4 py-2 bg-white text-theme"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={uploading} className="btn-minimal">
              {uploading ? "Илгээж байна…" : "Байршуулах"}
            </button>
            {lastUploadedId && (
              <span className="text-sm text-theme/80">
                ID: {lastUploadedId}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* View panel */}
      <div className="rounded-2xl p-6 neu-panel">
        <h2 className="text-xl font-semibold mb-4">PDF харах</h2>
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-theme">
              PDF ID
            </label>
            <input
              type="text"
              value={viewId}
              onChange={(e) => setViewId(e.target.value)}
              placeholder="Жишээ: 672fdc0a…"
              className="w-full rounded-2xl border px-4 py-2 bg-white text-theme"
            />
          </div>
          <div className="flex-none">
            <button onClick={openPdf} className="btn-minimal">
              Нээх
            </button>
          </div>
        </div>

        {previewUrl && (
          <div className="mt-4 border rounded-xl overflow-hidden">
            <iframe src={previewUrl} className="w-full h-[480px] bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}
