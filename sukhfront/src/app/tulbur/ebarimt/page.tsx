"use client";

import { useState } from "react";
import { DatePicker, Select, Button, Spin } from "antd";
import moment from "moment";
import { motion } from "framer-motion";
const { RangePicker } = DatePicker;

type TableItem = {
  id: number;
  date: string;
  month: string;
  total: number;
  service: string;
};

const stats = [
  { title: "Баримт авах тоо", value: 10 },
  { title: "Баримт авах дүн", value: 5000 },
  { title: "Баримт авсан тоо", value: 8 },
  { title: "Баримт авсан дүн", value: 3200 },
  { title: "Баримт үлдсэн тоо", value: 2 },
  { title: "Баримт үлдсэн дүн", value: 1800 },
  { title: "Нийт", value: 10 },
];

const mockData: TableItem[] = [
  { id: 1, date: "2025-10-01", month: "10", total: 1500, service: "Зогсоол" },
  { id: 2, date: "2025-10-05", month: "10", total: 2000, service: "Тоглоом" },
  { id: 3, date: "2025-10-09", month: "10", total: 3200, service: "Түрээс" },
  { id: 4, date: "2025-10-01", month: "10", total: 1500, service: "Зогсоол" },
  { id: 5, date: "2025-10-05", month: "10", total: 2000, service: "Тоглоом" },
  { id: 6, date: "2025-10-09", month: "10", total: 3200, service: "Түрээс" },
  { id: 7, date: "2025-10-01", month: "10", total: 1500, service: "Зогсоол" },
  { id: 8, date: "2025-10-05", month: "10", total: 2000, service: "Тоглоом" },
  { id: 9, date: "2025-10-09", month: "10", total: 3200, service: "Түрээс" },
];

export default function Ebarimt() {
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<any>(null);
  const [uilchilgeeAvi, setUilchilgeeAvi] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<TableItem[]>(mockData);

  const eBarimtMedeelel = { extraInfo: { lastSentDate: new Date() } };

  const exceleerTatya = () => alert("Excel татах товч дарлаа!");
  const ebarimtIlgeeye = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };
  const t = (text: string) => text;

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 bg-slate-900 bg-clip-text text-transparent drop-shadow-sm"
      >
        И-Баримт
      </motion.h1>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
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
                <div className="text-3xl font-bold text-slate-900 mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-600 leading-tight">
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
                className="w-full sm:w-auto !bg-transparent border border-white/40 rounded-xl hover:shadow-md transition-all duration-300"
                size="large"
                value={ekhlekhOgnoo}
                onChange={setEkhlekhOgnoo}
              />
              <Select
                className="w-full sm:w-48 !bg-transparent border border-white/40 backdrop-blur-lg rounded-xl hover:shadow-md transition-all duration-300"
                size="large"
                placeholder={t("Үйлчилгээ")}
                onChange={(v) => setUilchilgeeAvi(v)}
                allowClear
              >
                <Select.Option key="Зогсоол" value="Зогсоол">
                  {t("Зогсоол")}
                </Select.Option>
                <Select.Option key="Тоглоом" value="Тоглоом">
                  {t("Тоглоом")}
                </Select.Option>
                <Select.Option key="Түрээс" value="Түрээс">
                  {t("Түрээс")}
                </Select.Option>
              </Select>
            </div>

            <div className="flex flex-row gap-3 w-full md:w-auto">
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  onClick={exceleerTatya}
                  type="primary"
                  size="large"
                  className="flex-1 md:flex-none rounded-xl bg-slate-900 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {t("Excel татах")}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  title={t("Сүүлд илгээгдсэн огноо")}
                  size="large"
                  className="flex-1 md:flex-none rounded-xl border border-white/40 bg-white/10 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {moment(eBarimtMedeelel.extraInfo.lastSentDate).format(
                    "YYYY-MM-DD"
                  )}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  danger
                  onClick={ebarimtIlgeeye}
                  size="large"
                  className="flex-1 md:flex-none rounded-xl border border-white/40 bg-gradient-to-r from-red-400/80 to-pink-400/80 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Spin spinning={loading}>
                    {loading ? "" : t("Татварт илгээх")}
                  </Spin>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          className="rounded-2xl overflow-hidden shadow-lg"
          whileHover={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full relative z-10">
              <thead>
                <tr className="bg-white/20 border-b border-white/30">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-800 w-20">
                    №
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-800">
                    Огноо
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-800">
                    Тайлант сар
                  </th>
                  <th className="py-4 px-6 text-right text-sm font-semibold text-slate-800">
                    Дүн
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-800">
                    Үйлчилгээ
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.length > 0 ? (
                  tableData.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      className="border-b border-white/30 cursor-pointer hover:shadow-lg"
                      transition={{ duration: 0.3 }}
                    >
                      <td className="py-4 px-6 text-slate-900">{index + 1}</td>
                      <td className="py-4 px-6 text-slate-600">{item.date}</td>
                      <td className="py-4 px-6 text-slate-600">{item.month}</td>
                      <td className="py-4 px-6 text-slate-600 text-right">
                        {item.total}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {item.service}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
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
        </motion.div>
      </div>
    </div>
  );
}
