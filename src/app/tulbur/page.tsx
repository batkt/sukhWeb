"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import GuilgeeTuukhPage from "./guilgeeTuukh/page";
import DansKhuulgaPage from "./dansKhuulga/page";
import EbarimtPage from "./ebarimt/page";

export default function TulburPage() {
  const [active, setActive] = useState<"guilgee" | "dans" | "ebarimt">("guilgee");
  const [activeTab, setActiveTab] = useState<"guilgee" | "dansKhuulga" | "ebarimt">(
    "guilgee"
  );
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;

  const gereeTourSteps: DriverStep[] = useMemo(() => {
    if (activeTab === "guilgee") {
      return [
        {
          element: "#tab-guilgee",
          popover: {
            title: "Гүйлгээний түүх",
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
    } else if (activeTab === "dansKhuulga") {
      return [
        {
          element: "#tab-dansKhuulga",
          popover: {
            title: "Дансны хуулга",
            description:
              "Эндээс холбосон дансны гүйлгээний жагсаалтыг харах боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#dans-date",
          popover: {
            title: "Огнооны шүүлтүүр",
            description: "Хугацааны интервал сонгож жагсаалтыг шүүнэ.",
          },
        },
        {
          element: "#dans-account",
          popover: {
            title: "Данс сонгох",
            description: "Данс сонгоход тухайн дансны гүйлгээ харагдана.",
          },
        },
        {
          element: "#dans-excel-btn",
          popover: {
            title: "Excel татах",
            description: "Жагсаалтыг Excel файл болгон татах.",
          },
        },
        {
          element: "#dans-table",
          popover: {
            title: "Жагсаалт",
            description: "Сонгосон дансны гүйлгээ энд харагдана.",
          },
        },
        {
          element: "#dans-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжих.",
          },
        },
      ];
    } else if (activeTab === "ebarimt") {
      return [
        {
          element: "#tab-ebarimt",
          popover: {
            title: "И-баримт",
            description: "И-баримтын мэдээллийг энд харна.",
            side: "bottom",
          },
        },
      ];
    }
    return [];
  }, [activeTab]);

  useRegisterTourSteps("/tulbur", gereeTourSteps);

  return (
    <div className="min-h-screen">
      <div className="rounded-2xl p-4 table-surface">
        <div className="flex items-center justify-between gap-3 flex-wrap px-1 mb-4">
          <div className="flex items-center gap-3">
            {active === "guilgee" ? (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-theme bg-clip-text text-transparent drop-shadow-sm"
                >
                  Гүйлгээний түүх
                </motion.h1>
                <div
                  style={{ width: 44, height: 44 }}
                  className="flex items-center"
                >
                  <DotLottieReact
                    src="https://lottie.host/740ab27b-f4f0-49c5-a202-a23a70cd8e50/eNy8Ct6t4y.lottie"
                    loop
                    autoplay
                    style={{ width: 44, height: 44 }}
                  />
                </div>
              </>
            ) : active === "dans" ? (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-theme bg-clip-text text-transparent drop-shadow-sm"
                >
                  Дансны хуулга
                </motion.h1>
              </>
            ) : (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-theme bg-clip-text text-transparent drop-shadow-sm"
                >
                  И-баримт
                </motion.h1>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 flex-wrap items-center gap-2 tabbar">
            <button
              id="tab-guilgee"
              onClick={() => {
                setActive("guilgee");
                setActiveTab("guilgee");
              }}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                active === "guilgee"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Гүйлгээний түүх
            </button>
            <button
              id="tab-dansKhuulga"
              onClick={() => {
                setActive("dans");
                setActiveTab("dansKhuulga");
              }}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                active === "dans"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Дансны хуулга
            </button>
            <button
              id="tab-ebarimt"
              onClick={() => {
                setActive("ebarimt");
                setActiveTab("ebarimt");
              }}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                active === "ebarimt"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              И-баримт
            </button>
          </div>
        </div>

        <div className="w-full">
          {active === "guilgee" ? (
            <GuilgeeTuukhPage />
          ) : active === "dans" ? (
            <DansKhuulgaPage />
          ) : (
            <EbarimtPage />
          )}
        </div>
      </div>
    </div>
  );
}
