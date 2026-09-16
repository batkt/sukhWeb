"use client";

/**
 * Хөнгөлөлт — Төлбөр хэсгийн бүрэн хуудас.
 *
 * Өмнө нь энэ хэрэгсэл нь Оршин суугч хуудасны модал байсан (`HongololtModal`).
 * Модал дотор 1200px хүртэл сунгасан хоёр таб, оршин суугчдын жагсаалт,
 * түүх — бүгд багтаж ядаж байв. Мөн тэр байрлал нь логикгүй: хөнгөлөлт бол
 * төлбөрийн үйлдэл болохоос оршин суугчийн бүртгэл биш.
 *
 * Одоо Гүйлгээний түүх / Дансны хуулга / И-баримт гурвынхтай ижил бүтэцтэй:
 * `flex flex-col pb-14` → `space-y-3` → стат картууд → агуулга.
 *
 * Агуулга нь `HongololtTool`-оос ирнэ — модалын яг тэр код, зөвхөн бүрхүүлгүй
 * (`inline`). Ингэснээр зан төлөв нь битүү хуулбарлагдахгүй, нэг эх сурвалжтай.
 */

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../../tools/function/formatNumber";
import HongololtTool from "./HongololtTool";

export default function KhungulultPage() {
  const { token, ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();

  const effectiveBarilgiinId =
    selectedBuildingId || barilgiinId || undefined;
  const effectiveBaiguullagiinId =
    ajiltan?.baiguullagiinId || baiguullaga?._id;

  /** Хуудсыг дахин уншуулах түлхүүр — хөнгөлөлт бүртгэсний дараа. */
  const [shinechlelt, setShinechlelt] = useState(0);

  /**
   * Стат картуудын өгөгдөл. Ах дүү хуудсуудтай ижилхэн — эхлээд тоо,
   * дараа нь агуулга.
   *
   * `guilgeeAvlaguud`-аас хөнгөлөлтийн бичлэгүүдийг уншина. Сарын
   * үзүүлэлтийг тусад нь хүсэлт явуулалгүй, ирсэн жагсаалтаас нь бодно.
   */
  const { data: khungulultuud } = useSWR(
    token && effectiveBaiguullagiinId
      ? [
          "/guilgeeAvlaguud/khungulult",
          token,
          effectiveBaiguullagiinId,
          effectiveBarilgiinId,
          shinechlelt,
        ]
      : null,
    async ([, tkn, bId, barId]) => {
      const resp = await uilchilgee(tkn as string).get("/guilgeeAvlaguud", {
        params: {
          query: {
            baiguullagiinId: bId,
            ...(barId ? { barilgiinId: barId } : {}),
            turul: "Хөнгөлөлт",
          },
          khuudasniiKhemjee: 500,
        },
      });
      const garalt = resp.data;
      return Array.isArray(garalt?.jagsaalt)
        ? garalt.jagsaalt
        : Array.isArray(garalt)
          ? garalt
          : [];
    },
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const stats = useMemo(() => {
    const jagsaalt: any[] = khungulultuud || [];
    const dun = (r: any) => Math.abs(Number(r?.dun ?? r?.khungulultiinDun ?? 0));

    const odooSar = new Date();
    const sariinEkhlel = new Date(
      odooSar.getFullYear(),
      odooSar.getMonth(),
      1,
    ).getTime();

    const sariinKhungulult = jagsaalt.filter((r) => {
      const t = new Date(r?.ognoo || r?.createdAt || 0).getTime();
      return !Number.isNaN(t) && t >= sariinEkhlel;
    });

    const niitDun = jagsaalt.reduce((s, r) => s + dun(r), 0);
    const sariinDun = sariinKhungulult.reduce((s, r) => s + dun(r), 0);
    const gereeToo = new Set(
      jagsaalt.map((r) => String(r?.gereeniiId || "")).filter(Boolean),
    ).size;

    return [
      { title: "Нийт хөнгөлөлт", value: formatNumber(niitDun, 2) + "₮" },
      { title: "Энэ сард", value: formatNumber(sariinDun, 2) + "₮" },
      { title: "Бичлэгийн тоо", value: String(jagsaalt.length) },
      { title: "Хамрагдсан гэрээ", value: String(gereeToo) },
    ];
  }, [khungulultuud]);

  return (
    <div className="flex flex-col pb-14">
      <div className="space-y-3">
        {/* Стат картууд — ах дүү хуудсуудтай ижил бүтэц */}
        <div className="stat-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="relative group rounded-2xl neu-panel transition-all select-none"
            >
              <div className="stat-card">
                <div className="stat-card-value">{stat.value}</div>
                <div className="stat-card-title">{stat.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Хөнгөлөлт оруулах / түүх — модалынхтай яг ижил агуулга */}
        <div className="rounded-2xl neu-panel p-3 sm:p-4">
          <HongololtTool
            inline
            token={token || ""}
            baiguullagiinId={effectiveBaiguullagiinId}
            barilgiinId={effectiveBarilgiinId}
            onSuccess={() => setShinechlelt((n) => n + 1)}
          />
        </div>
      </div>
    </div>
  );
}
