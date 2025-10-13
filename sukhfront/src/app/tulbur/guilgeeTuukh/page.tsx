"use client";

import { useState } from "react";
import { DatePicker, Select, Button } from "antd";
import { motion } from "framer-motion";
const { RangePicker } = DatePicker;

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

export default function DansniiKhuulga() {
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<any>(null);
  const [uilchilgeeAvi, setUilchilgeeAvi] = useState<string | undefined>(
    undefined
  );
  const [filteredData, setFilteredData] = useState<TableItem[]>(mockData);

  const exceleerTatya = () => {
    alert("Excel татах товч дарлаа!");
  };
  const t = (text: string) => text;

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm"
      >
        Гүйлгээний түүх
      </motion.h1>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-2xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-300" />
              <div className="relative rounded-2xl p-5  hover:shadow-2xl transition-all duration-300 h-full flex flex-col justify-center overflow-hidden">
                <motion.div
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/20 via-white/0 to-white/20 opacity-0"
                  initial={{ opacity: 0, x: -100 }}
                  whileHover={{ opacity: 1, x: 100 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 leading-tight">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <RangePicker
                className="w-full sm:w-auto !bg-transparent rounded-xl hover:shadow-md transition-all duration-300"
                size="large"
                value={ekhlekhOgnoo}
                onChange={setEkhlekhOgnoo}
              />
              <Select
                className="w-full sm:w-48 !bg-transparent rounded-xl hover:shadow-md transition-all duration-300"
                size="large"
                placeholder={t("Данс")}
                onChange={(v: string) => setUilchilgeeAvi(v)}
                allowClear
              >
                <Select.Option key="khaan" value="421030635">
                  {t("421030635")}
                </Select.Option>
                <Select.Option key="tdb" value="421030636">
                  {t("421030636")}
                </Select.Option>
              </Select>
            </div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={exceleerTatya}
                type="primary"
                size="large"
                className="flex-1 md:flex-none rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                {t("Excel татах")}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Table */}
        <motion.div
          className="rounded-2xl bg-white/10 backdrop-blur-xl overflow-hidden shadow-lg"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    №
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Огноо
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Тайлант сар
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Дүн
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Үйлчилгээ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-white hover:shadow transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-900">{index + 1}</td>
                      <td className="py-4 px-4 text-gray-600">{item.date}</td>
                      <td className="py-4 px-4 text-gray-600">{item.month}</td>
                      <td className="py-4 px-4 text-gray-600 text-right">
                        {item.total}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{item.action}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg
                          className="w-16 h-16 text-gray-300"
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
                        <div className="text-gray-500 font-medium">
                          Мэдээлэл байхгүй
                        </div>
                        <div className="text-gray-400 text-sm">
                          Шүүлтүүрийг өөрчилж үзнэ үү
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
