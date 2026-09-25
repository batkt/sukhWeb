"use client";

/**
 * Тохиргоо → Зогсоол. «Зогсоол» ба «Камерийн тохиргоо» нь нэг зорилготой
 * (зогсоолын тоног төхөөрөмж, үнэ) тул нэг табын хоёр хэсэг болгов.
 * Хэсэг бүр өөрийн эрхээр харагдана.
 */

import React, { lazy, Suspense, useState } from "react";
import { Camera, Car } from "lucide-react";
import { hasPermission } from "@/lib/permissionUtils";

const Zogsool = lazy(() => import("./Zogsool"));
const KameriinTokhirgoo = lazy(() => import("./KameriinTokhirgoo"));

const KHADGALAKH_TULKHUUR = "tokhirgoo_zogsool_kheseg";

export default function ZogsoolTokhirgoo(props: any) {
  const { ajiltan } = props;
  const admin = String(ajiltan?.erkh || "").toLowerCase() === "admin";
  const khesguud = [
    { key: "zogsool", label: "Зогсоол ба тариф", Icon: Car, Tsonkh: Zogsool, perm: "tokhirgoo.zogsool" },
    { key: "kamer", label: "Камер", Icon: Camera, Tsonkh: KameriinTokhirgoo, perm: "tokhirgoo.kamer" },
  ].filter((k) => admin || hasPermission(ajiltan, k.perm));

  const [idevkhtei, setIdevkhtei] = useState<string>(() => {
    try {
      return localStorage.getItem(KHADGALAKH_TULKHUUR) || "zogsool";
    } catch {
      return "zogsool";
    }
  });
  const songogdson = khesguud.find((k) => k.key === idevkhtei) || khesguud[0];
  if (!songogdson) return null;

  const songokh = (key: string) => {
    setIdevkhtei(key);
    try {
      localStorage.setItem(KHADGALAKH_TULKHUUR, key);
    } catch {
      /* хадгалах боломжгүй */
    }
  };

  const Tsonkh = songogdson.Tsonkh as React.ComponentType<any>;
  return (
    <div className="space-y-4">
      {khesguud.length > 1 && (
        <div className="stg-segment" role="tablist" aria-label="Зогсоолын тохиргоо">
          {khesguud.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={songogdson.key === key}
              onClick={() => songokh(key)}
              className={`stg-segment-item inline-flex min-h-10 items-center gap-2 ${
                songogdson.key === key ? "is-active" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}
      <Suspense
        fallback={<p className="py-8 text-center text-[14px] text-[color:var(--muted-text)]">Ачааллаж байна...</p>}
      >
        <Tsonkh {...props} />
      </Suspense>
    </div>
  );
}
