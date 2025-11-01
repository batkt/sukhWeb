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
      "btn-minimal whitespace-nowrap px-4 py-2 text-sm font-semibold " +
      (active ? "btn-neu-primary" : "")
    }
  >
    {children}
  </button>
);

export default function TulburPage() {
  const [active, setActive] = useState<"guilgee" | "dans">("guilgee");

  return (
    <div className="min-h-screen">
      <div className="rounded-2xl p-4 table-surface">
        <div className="flex items-center justify-end gap-2 flex-wrap overflow-x-auto px-1 mb-4">
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
