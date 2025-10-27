"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DatePickerInput } from "@mantine/dates";
import { Select } from "@mantine/core";
import { motion } from "framer-motion";
import EbarimtPage from "../ebarimt/page";
import ZardalPage from "../zardal/page";
// Using Mantine DatePickerInput with type="range" instead of Antd RangePicker

type TableItem = {
  id: number;
  date: string;
  month: string;
  total: number;
  action: string;
};

const stats = [
  { title: "Нийт", value: 150, delay: 600 },
  { title: "Тодорхойгүй", value: 5, delay: 500 },
  { title: "Холбогдсон", value: 80, delay: 400 },
  { title: "Магадлалтай", value: 20, delay: 400 },
];

// Mock table data
const mockData: TableItem[] = [
  { id: 1, date: "2025-10-01", month: "10", total: 1500, action: "Тайлбар 1" },
  { id: 2, date: "2025-10-05", month: "10", total: 2000, action: "Тайлбар 2" },
  { id: 3, date: "2025-10-09", month: "10", total: 3200, action: "Тайлбар 3" },
];

type DateRangeValue = [string | null, string | null] | undefined;

export default function DansniiKhuulga() {
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [uilchilgeeAvi, setUilchilgeeAvi] = useState<string | undefined>(
    undefined
  );
  const [filteredData, setFilteredData] = useState<TableItem[]>(mockData);
  const [isEbarimtOpen, setIsEbarimtOpen] = useState(false);
  const [isZardalOpen, setIsZardalOpen] = useState(false);

  const exceleerTatya = () => {
    alert("Excel татах товч дарлаа!");
  };
  const t = (text: string) => text;

  // Modal Portal Helper
  const ModalPortal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children as any, document.body) : null;
  };

  useEffect(() => {
    const open = isEbarimtOpen || isZardalOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isEbarimtOpen, isZardalOpen]);

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        Дансны хуулга
      </motion.h1>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative group rounded-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-2xl opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
              <div className="relative rounded-2xl p-5 backdrop-blur-xl  hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <motion.div
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/20 via-white/0 to-white/20 opacity-0"
                  initial={{ opacity: 0, x: -100 }}
                  whileHover={{ opacity: 1, x: 100 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-theme">
                  {stat.value}
                </div>
                <div className="text-xs text-theme leading-tight">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <DatePickerInput
                type="range"
                locale="mn"
                value={ekhlekhOgnoo}
                onChange={(v) => setEkhlekhOgnoo(v)}
                className="w-full sm:w-auto rounded-xl hover:shadow-md transition-all duration-300"
              />
              <Select
                data={[
                  { value: "421030635", label: t("421030635") },
                  { value: "421030636", label: t("421030636") },
                ]}
                placeholder={t("Данс")}
                allowDeselect
                onChange={(v) => setUilchilgeeAvi(v || undefined)}
                className="w-full sm:w-48 rounded-xl hover:shadow-md transition-all duration-300"
                nothingFoundMessage={t("Хайлт олдсонгүй")}
              />
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsEbarimtOpen(true)}
                  className="btn-minimal"
                >
                  И-баримт
                </button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsZardalOpen(true)}
                  className="btn-minimal"
                >
                  Зардал
                </button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={exceleerTatya}
                  className="flex-1 md:flex-none rounded-xl text-theme  text-white shadow-md hover:shadow-lg transition-all duration-300 bg-blue-600 px-4 py-2"
                >
                  {t("Excel татах")}
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="table-surface overflow-hidden rounded-2xl mt-10 w-full">
          <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
            <div className="overflow-y-auto custom-scrollbar w-full">
              <table className="table-ui text-sm min-w-full">
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "28%" }} />
                </colgroup>
                <thead>
                  <tr className="text-theme">
                    <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      №
                    </th>
                    <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Огноо
                    </th>
                    <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Тайлант сар
                    </th>
                    <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Дүн
                    </th>
                    <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                      Үйлчилгээ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr
                        key={item.id}
                        className="transition-colors border-b last:border-b-0"
                      >
                        <td className="p-3 text-center whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.date}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.month}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {item.total.toLocaleString("mn-MN")}
                        </td>
                        <td className="p-3 truncate text-center">
                          {item.action}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <svg
                            className="w-16 h-16 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div className="text-slate-500 font-medium">
                            Мэдээлэл байхгүй
                          </div>
                          <div className="text-slate-400 text-sm">
                            Шүүлтүүрийг өөрчилж үзнэ үү
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isEbarimtOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100]"
              onClick={() => setIsEbarimtOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2101] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1100px] h-auto rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-slate-800">
                <div className="font-semibold">И-баримт</div>
                <button
                  onClick={() => setIsEbarimtOpen(false)}
                  className="btn-minimal btn-cancel"
                >
                  Хаах
                </button>
              </div>
              <div className="p-2 max-h-[calc(90vh-48px)]">
                <EbarimtPage />
              </div>
            </motion.div>
          </>
        </ModalPortal>
      )}

      {isZardalOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100]"
              onClick={() => setIsZardalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2101] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1100px] h-auto rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-slate-800">
                <div className="font-semibold">Зардал</div>
                <button
                  onClick={() => setIsZardalOpen(false)}
                  className="btn-minimal btn-cancel"
                >
                  Хаах
                </button>
              </div>
              <div className="p-2 overflow-auto max-h-[calc(90vh-48px)]">
                <ZardalPage />
              </div>
            </motion.div>
          </>
        </ModalPortal>
      )}
    </div>
  );
}
