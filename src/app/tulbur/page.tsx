"use client";

import React, { useMemo } from "react";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import TulburLayout from "./TulburLayout";
import GuilgeeTuukhPage from "./guilgeeTuukh/page";

export default function TulburPage() {
  const gereeTourSteps: DriverStep[] = useMemo(() => {
    return [
      {
        element: "#tab-guilgee",
        popover: {
          title: "Төлбөр тооцоо",
          description:
            "Эндээс гүйлгээний жагсаалтыг харах, нэхэмжлэх үүсгэх боломжтой.",
          side: "bottom",
        },
      },
      {
        element: "#guilgee-date",
        popover: {
          title: "Огнооны шүүлтүүр",
          description: "Хугацааны интервал сонгож жагсаалтыг шүүнэ.",
        },
      },
      {
        element: "#guilgee-status-filter",
        popover: {
          title: "Төлөвийн шүүлтүүр",
          description:
            "Төлсөн, Төлөөгүй, Хугацаа хэтэрсэн зэрэг төлөвөөр ялгана.",
        },
      },
      {
        element: "#guilgee-nekhemjlekh-btn",
        popover: {
          title: "Нэхэмжлэх",
          description: "Нэхэмжлэхийн цонхыг нээж ажиллана.",
        },
      },
      {
        element: "#guilgee-excel-btn",
        popover: {
          title: "Excel татах",
          description: "Жагсаалтыг Excel файл болгон татах.",
        },
      },
      {
        element: "#guilgee-table",
        popover: {
          title: "Жагсаалт",
          description: "Гүйлгээний жагсаалт энд харагдана.",
        },
      },
      {
        element: "#guilgee-pagination",
        popover: {
          title: "Хуудаслалт",
          description: "Эндээс хуудсуудын хооронд шилжих.",
        },
      },
    ];
  }, []);

  useRegisterTourSteps("/tulbur", gereeTourSteps);

  return (
    <TulburLayout activeTab="guilgee">
      <GuilgeeTuukhPage />
    </TulburLayout>
  );
}
