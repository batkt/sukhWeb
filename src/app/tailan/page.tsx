"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function ReportsIndex() {
  const reports = [
    {
      href: "/tailan/orshinSuugch",
      label: "Оршин суугч / Тайлан (дэлгэрэнгүй)",
    },
    {
      href: "/tailan/debt",
      label: "Өр / Авлага тайлан (байр, орц, давхар, тоот)",
    },
    { href: "/tailan/income-expense", label: "Орлого / Зарлагын тайлан" },
    { href: "/tailan/profit-loss", label: "Нийт ашиг / Алдагдал" },
    { href: "/tailan/transactions", label: "Гүйлгээний түүх" },
  ];

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-theme">Тайлан</h1>
        <p className="text-sm text-theme/70 mt-1">Тайланнуудыг сонгож үзэх</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="block">
            <div className="neu-panel p-6 rounded-2xl hover:shadow-lg transition">
              <div className="text-lg font-semibold text-theme">{r.label}</div>
              <div className="text-sm text-theme/60 mt-2">Орох</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
