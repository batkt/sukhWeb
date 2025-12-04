"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import GuilgeeTuukhPage from "./guilgeeTuukh/page";
import DansKhuulgaPage from "./dansKhuulga/page";
import TabButton from "components/tabButton/tabButton";

export default function TulburPage() {
  const [active, setActive] = useState<"guilgee" | "dans">("guilgee");
  const [activeTab, setActiveTab] = useState<"guilgee" | "dansKhuulga">(
    "guilgee"
  );

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
              "Эндээс холбосон дансны гүйлгээний жагсаалтыг харах, И-баримт илгээх боломжтой.",
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
          element: "#ebarimt-btn",
          popover: {
            title: "И-баримт",
            description: "Энд дарж И-баримтын цонх нээнэ.",
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
            ) : (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-theme bg-clip-text text-transparent drop-shadow-sm"
                >
                  Дансны хуулга
                </motion.h1>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <TabButton
              id="tab-guilgee"
              active={active === "guilgee"}
              onClick={() => {
                setActive("guilgee");
                setActiveTab("guilgee");
              }}
            >
              Гүйлгээний түүх
            </TabButton>
            <TabButton
              id="tab-dansKhuulga"
              active={active === "dans"}
              onClick={() => {
                setActive("dans");
                setActiveTab("dansKhuulga");
              }}
            >
              Дансны хуулга
            </TabButton>
          </div>
        </div>

        <div className="w-full">
          {active === "guilgee" ? <GuilgeeTuukhPage /> : <DansKhuulgaPage />}
        </div>
      </div>
    </div>
  );
}
