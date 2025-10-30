"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import GuilgeeTuukhPage from "./guilgeeTuukh/page";
import DansKhuulgaPage from "./dansKhuulga/page";

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    onClick={onClick}
    className={
      "px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 " +
      (active
        ? "menu-surface ring-1 ring-[color:var(--surface-border)] shadow-sm"
        : "hover:menu-surface/80")
    }
  >
    {children}
  </button>
);

export default function TulburPage() {
  const [active, setActive] = useState<"guilgee" | "dans">("guilgee");

  return (
    <div className="min-h-screen">
      <div className="rounded-2xl p-4 table-surface overflow-hidden">
 
        <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
          <TabButton
            active={active === "guilgee"}
            onClick={() => setActive("guilgee")}
          >
            Гүйлгээний түүх
          </TabButton>
          <TabButton
            active={active === "dans"}
            onClick={() => setActive("dans")}
          >
            Дансны хуулга
          </TabButton>
        </div>
 
        <div className="w-full">
          {active === "guilgee" ? <GuilgeeTuukhPage /> : <DansKhuulgaPage />}
        </div>
      </div>
    </div>
  );
}
