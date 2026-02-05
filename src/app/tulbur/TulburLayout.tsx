"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { useAuth } from "@/lib/useAuth";
import { hasPermission } from "@/lib/permissionUtils";

interface TulburLayoutProps {
  children: React.ReactNode;
  activeTab: "guilgee" | "dansKhuulga" | "ebarimt";
}

export default function TulburLayout({ children, activeTab }: TulburLayoutProps) {
  const router = useRouter();
  const { ajiltan } = useAuth();

  const showGuilgee = hasPermission(ajiltan, "/tulbur");
  const showDans = hasPermission(ajiltan, "/tulbur/dansKhuulga");
  const showEbarimt = hasPermission(ajiltan, "/tulbur/ebarimt");

  const handleTabChange = (tab: "guilgee" | "dansKhuulga" | "ebarimt") => {
    const routes = {
      guilgee: "/tulbur",
      dansKhuulga: "/tulbur/dansKhuulga",
      ebarimt: "/tulbur/ebarimt",
    };
    router.push(routes[tab]);
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
      <div className="rounded-2xl p-4 table-surface">
        <div className="flex items-center justify-between gap-3 flex-wrap px-1 mb-4">
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
          <div className="grid grid-cols-3 flex-wrap items-center gap-2 tabbar">
            {showGuilgee && (
            <button
              id="tab-guilgee"
              onClick={() => handleTabChange("guilgee")}
              className={`px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                activeTab === "guilgee"
                  ? "bg-[color:var(--theme)] text-white shadow-lg shadow-[color:var(--theme)]/20 scale-105"
                  : "text-[color:var(--panel-text)]/60 hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
              }`}
            >
              Гүйлгээний түүх
            </button>
            )}
            {showDans && (
            <button
              id="tab-dansKhuulga"
              onClick={() => handleTabChange("dansKhuulga")}
              className={`px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                activeTab === "dansKhuulga"
                  ? "bg-[color:var(--theme)] text-white shadow-lg shadow-[color:var(--theme)]/20 scale-105"
                  : "text-[color:var(--panel-text)]/60 hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
              }`}
            >
              Дансны хуулга
            </button>
            )}
            {showEbarimt && (
            <button
              id="tab-ebarimt"
              onClick={() => handleTabChange("ebarimt")}
              className={`px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                activeTab === "ebarimt"
                  ? "bg-[color:var(--theme)] text-white shadow-lg shadow-[color:var(--theme)]/20 scale-105"
                  : "text-[color:var(--panel-text)]/60 hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
              }`}
            >
              И-баримт
            </button>
            )}
          </div>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
