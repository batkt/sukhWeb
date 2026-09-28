"use client";

import React, { useState, useEffect } from "react";
import { Download, HardDrive } from "lucide-react";
import { t } from "i18next";
import formatNumber from "../../../../tools/function/formatNumber";
import Button from "@/components/ui/Button";
import uilchilgee from "@/lib/uilchilgee";
import { SettingsCard, SettingsItem } from "./SettingsRow";

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
    <div className="stg-page">
      <SettingsCard
        icon={<HardDrive className="h-4 w-4" />}
        title={t("Ашиглаж буй Storage")}
        subtitle="Таны байгууллагын өгөгдлийн сангийн нийт хэмжээ"
      >
        {storageLoading ? (
          <p className="text-[14px] text-[color:var(--muted-text)]">Уншиж байна...</p>
        ) : storageInfo ? (
          <div>
            <div className="text-[28px] leading-tight tabular-nums text-brand">
              {fmtBytes(storageInfo.total.dataSize)}
            </div>
            <div className="mt-1 text-[13px] text-[color:var(--muted-text)]">
              Нийт ашиглаж буй өгөгдөл
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-[color:var(--muted-text)]">
            Хэмжээг одоогоор авах боломжгүй байна. Хуудсаа дахин ачааллаад үзнэ үү.
          </p>
        )}
      </SettingsCard>

      <SettingsCard
        icon={<Download className="h-4 w-4" />}
        title={t("Мэдээллийн сан")}
        subtitle={`${t("Сүүлд шинэчилсэн")} ${new Date().toLocaleDateString()}`}
      >
        <SettingsItem
          title={t("Системийн өгөгдөл")}
          desc="Өгөгдлийн хуулбарыг компьютер дээрээ татаж хадгална"
          control={
            <Button
              variant="primary"
              size="sm"
              className="!h-10 !rounded-[10px] !px-4 text-white"
              isLoading={loading}
              onClick={backTatya}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {t("Татах")}
            </Button>
          }
        />
      </SettingsCard>
    </div>
  );
}

export default Baaz;
