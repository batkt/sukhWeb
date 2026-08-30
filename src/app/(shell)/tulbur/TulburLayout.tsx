"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface TulburLayoutProps {
  children: React.ReactNode;
  activeTab: "guilgee" | "dansKhuulga" | "ebarimt";
}

export default function TulburLayout({
  children,
  activeTab,
}: TulburLayoutProps) {

  const tabTitle = useMemo(() => {
    switch (activeTab) {
      case "guilgee":
        return "Төлбөр тооцоо";
      case "dansKhuulga":
        return "Дансны хуулга";
      case "ebarimt":
        return "И-баримт";
      default:
        return "Төлбөр тооцоо";
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen">
      <div className="rounded-2xl p-1 table-surface">
        <div className="flex items-center justify-between gap-3 flex-wrap px-1 mb-2">
          <div className="flex items-center gap-3">
            <motion.h1
              key={activeTab}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl  text-theme bg-clip-text text-transparent drop-shadow-sm"
            >
              {tabTitle}
            </motion.h1>
            {activeTab === "guilgee" && (
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
            )}
          </div>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
