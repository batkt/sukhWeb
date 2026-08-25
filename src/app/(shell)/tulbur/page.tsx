"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import TulburLayout from "./TulburLayout";
import ShellLoading from "../loading";

// This page is 88 lines but the transaction table it renders is ~3,800, and a
// static import pulled that whole tree (xlsx, antd tables, charts) into the
// /tulbur chunk — 647 kB of first-load JS before the tabs could paint.
// Loading it dynamically lets the tab bar render immediately.
const GuilgeeTuukhPage = dynamic(() => import("./guilgeeTuukh/page"), {
  loading: () => <ShellLoading />,
});

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { hasPermission } from "@/lib/permissionUtils";

export default function TulburPage() {
  const router = useRouter();
  const { ajiltan } = useAuth();
  
  React.useEffect(() => {
    if (ajiltan) {
      if (!hasPermission(ajiltan, "/tulbur")) {
        router.push("/"); // or /khynalt
      }
    }
  }, [ajiltan, router]);

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
