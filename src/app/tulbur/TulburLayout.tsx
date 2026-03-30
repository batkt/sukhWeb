"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { useAuth } from "@/lib/useAuth";
import { hasPermission } from "@/lib/permissionUtils";
import Link from "next/link";

interface TulburLayoutProps {
  children: React.ReactNode;
  activeTab: "guilgee" | "dansKhuulga" | "ebarimt";
}

export default function TulburLayout({
  children,
  activeTab,
}: TulburLayoutProps) {
  const { ajiltan } = useAuth();

  const showGuilgee = hasPermission(ajiltan, "/tulbur");
  const showDans = false; // hasPermission(ajiltan, "/tulbur/dansKhuulga");
  const showEbarimt = hasPermission(ajiltan, "/tulbur/ebarimt");

  const routes = {
    guilgee: "/tulbur",
    dansKhuulga: "/tulbur/dansKhuulga",
    ebarimt: "/tulbur/ebarimt",
  };

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
          <div className="flex md:flex-row gap-2 md:gap-4 tabbar flex-shrink-0">
            {showGuilgee && (
              <Link
                id="tab-guilgee"
                href={routes.guilgee}
                className={`px-3 neu-panel md:px-5 py-2.5 md:py-2  text-xs md:text-sm font-normal rounded-2xl whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme/50 ${
                  activeTab === "guilgee"
                    ? "bg-theme/15 text-theme font-medium"
                    : "text-theme/60  hover:text-theme"
                }`}
              >
                Гүйлгээний түүх
              </Link>
            )}
            {showDans && (
              <Link
                id="tab-dansKhuulga"
                href={routes.dansKhuulga}
                className={`px-3 neu-panel  md:px-5 py-2.5 md:py-2 text-xs md:text-sm font-normal rounded-2xl whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme/50 ${
                  activeTab === "dansKhuulga"
                    ? "bg-theme/15 text-theme font-medium"
                    : "text-theme/60 hover:bg-theme/10 hover:text-theme"
                }`}
              >
                Дансны хуулга
              </Link>
            )}
            {showEbarimt && (
              <Link
                id="tab-ebarimt"
                href={routes.ebarimt}
                className={`px-3 neu-panel  md:px-5 py-2.5 md:py-2 text-xs md:text-sm font-normal rounded-2xl whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme/50 ${
                  activeTab === "ebarimt"
                    ? "bg-theme/15 text-theme font-medium"
                    : "text-theme/60 hover:bg-theme/10 hover:text-theme"
                }`}
              >
                И-баримт
              </Link>
            )}
          </div>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
