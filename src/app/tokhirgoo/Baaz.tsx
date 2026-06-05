"use client";

import React, { useState, useEffect } from "react";
import { Download, HardDrive } from "lucide-react";
import { t } from "i18next";
import formatNumber from "../../../tools/function/formatNumber";
import Button from "@/components/ui/Button";
import uilchilgee from "@/lib/uilchilgee";

interface StorageInfo {
  total: { dataSize: number; storageSize: number; indexSize: number };
}

interface BaazProps {
  token?: string;
  ajiltan?: any;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${formatNumber(bytes / (1024 * 1024 * 1024), 2)} GB`;
  if (bytes >= 1024 * 1024) return `${formatNumber(bytes / (1024 * 1024), 2)} MB`;
  if (bytes >= 1024) return `${formatNumber(bytes / 1024, 2)} KB`;
  return `${formatNumber(bytes, 0)} B`;
}

function Baaz({ token, ajiltan }: BaazProps) {
  const [loading, setLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setStorageLoading(true);
    uilchilgee(token)
      .get("/storageInfo", { params: { baiguullagiinId: ajiltan?.baiguullagiinId } })
      .then((res) => setStorageInfo(res.data))
      .catch(() => setStorageInfo(null))
      .finally(() => setStorageLoading(false));
  }, [token, ajiltan?.baiguullagiinId]);

  function backTatya() {
    setLoading(true);
    setTimeout(() => {
      const blob = new Blob(["Mock backup content"], { type: "application/rar" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.rar`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-12 gap-6 mt-6">

        {/* Storage Info Card */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 shadow-lg rounded-2xl overflow-hidden border border-emerald-200/50 dark:border-emerald-600/50">
            <div className="px-6 py-4 border-b border-emerald-200/50 dark:border-emerald-600/50 bg-gradient-to-r from-emerald-100/50 to-teal-100/50 dark:from-emerald-800/20 dark:to-teal-800/20 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg text-theme">{t("Ашиглаж буй Storage")}</h2>
            </div>
            <div className="p-6">
              {storageLoading ? (
                <div className="text-sm text-theme opacity-60">Уншиж байна...</div>
              ) : storageInfo ? (
                <div className="flex items-center gap-4">
                  <HardDrive className="w-10 h-10 text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {fmtBytes(storageInfo.total.dataSize)}
                    </div>
                    <div className="text-xs text-theme opacity-60 mt-1 uppercase tracking-wide">
                      Нийт ашиглаж буй өгөгдөл
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-theme opacity-50">Storage мэдээлэл авах боломжгүй</div>
              )}
            </div>
          </div>
        </div>

        {/* Backup Card */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden border border-blue-200/50 dark:border-blue-600/50">
            <div className="px-6 py-4 border-b border-blue-200/50 dark:border-blue-600/50 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-800/20 dark:to-indigo-800/20">
              <h2 className="text-lg text-theme flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 dark:bg-blue-400/20 rounded-lg">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                {t("Мэдээллийн сан")}
              </h2>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="text-theme mb-1">{t("Системийн өгөгдөл")}</div>
                <p className="text-sm text-[color:var(--muted-text)] dark:text-gray-400">
                  {t("Сүүлд шинэчилсэн")} {new Date().toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="text-white transition-all duration-200"
                style={{ borderRadius: "0.75rem" }}
                isLoading={loading}
                onClick={backTatya}
                leftIcon={<Download className="w-4 h-4" />}
              >
                {t("Татах")}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Baaz;
