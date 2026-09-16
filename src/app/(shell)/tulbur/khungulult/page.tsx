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

import React from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import HongololtTool from "./HongololtTool";

export default function KhungulultPage() {
  const { token, ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();

  const effectiveBarilgiinId =
    selectedBuildingId || barilgiinId || undefined;
  const effectiveBaiguullagiinId =
    ajiltan?.baiguullagiinId || baiguullaga?._id;

  return (
    <div className="flex flex-col pb-14">
      <div className="space-y-3">
        {/* Хөнгөлөлт оруулах / түүх */}
        <div className="rounded-2xl neu-panel p-3 sm:p-4">
          <HongololtTool
            inline
            token={token || ""}
            baiguullagiinId={effectiveBaiguullagiinId}
            barilgiinId={effectiveBarilgiinId}
          />
        </div>
      </div>
    </div>
  );
}
