"use client";

import { useEffect, useState } from "react";
import { Select, Button, Spin } from "antd";
import { DatePickerInput } from "@mantine/dates";
import moment from "moment";
import { motion } from "framer-motion";

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
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<
    [Date | null, Date | null] | null
  >(null);
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

  // Scoped light overrides: ignore global theme and ensure readability on white
  const LocalStyles = () => (
    <style jsx global>{`
      .no-theme-scope {
        --panel-text: #0f172a;
        --btn-text: #0f172a;
        --btn-bg: #ffffff;
        --btn-bg-hover: #f8fafc;
        --btn-bg-active: #f1f5f9;
        --btn-border: rgba(15, 23, 42, 0.12);
        --surface-bg: #ffffff;
        --surface-border: rgba(15, 23, 42, 0.12);
        color: #0f172a !important;
        background: #ffffff !important;
      }
      .no-theme-scope *,
      .no-theme-scope
        :where(th, td, p, span, div, button, input, select, label) {
        color: #0f172a !important;
      }
      /* AntD inputs */
      .no-theme-scope .ant-picker,
      .no-theme-scope .ant-select-selector {
        background: #ffffff !important;
        color: #0f172a !important;
        border-color: #e5e7eb !important;
      }
      .no-theme-scope .ant-picker:hover,
      .no-theme-scope .ant-picker-focused,
      .no-theme-scope .ant-select-selector:hover,
      .no-theme-scope .ant-select-focused .ant-select-selector {
        border-color: #bfdbfe !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
      }
      .no-theme-scope .ant-picker-input > input,
      .no-theme-scope .ant-picker input,
      .no-theme-scope .ant-select-selection-item,
      .no-theme-scope .ant-select-selection-search-input {
        color: #0f172a !important;
      }
      .no-theme-scope .ant-picker-input > input::placeholder,
      .no-theme-scope .ant-picker input::placeholder,
      .no-theme-scope .ant-select-selection-placeholder {
        color: rgba(15, 23, 42, 0.6) !important;
      }
      .no-theme-scope .ant-select-arrow {
        color: #0f172a !important;
      }

      /* Overlays in body: force light while this component is mounted */
      body.force-light-dropdown .ant-select-dropdown,
      body.force-light-dropdown .ant-dropdown .ant-dropdown-menu,
      body.force-light-dropdown .ant-picker-dropdown {
        background: #ffffff !important;
        color: #0f172a !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.75rem !important;
      }
      body.force-light-dropdown .ant-select-item,
      body.force-light-dropdown .ant-dropdown-menu-item,
      body.force-light-dropdown .ant-dropdown-menu-submenu-title {
        color: #0f172a !important;
      }
      body.force-light-dropdown .ant-select-item-option-active {
        background: #f1f5f9 !important;
      }
      body.force-light-dropdown .ant-select-item-option-selected {
        background: #e5effe !important;
        color: #0b3868 !important;
      }
    `}</style>
  );

  useEffect(() => {
    document.body.classList.add("force-light-dropdown");
    return () => {
      document.body.classList.remove("force-light-dropdown");
    };
  }, []);

  return (
    <div className="min-h-screen no-theme-scope">
      <LocalStyles />
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
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
                className="w-full sm:w-auto rounded-xl hover:shadow-md transition-all duration-300"
                value={ekhlekhOgnoo ?? undefined}
                placeholder={"Огноо"}
                onChange={(v) =>
                  setEkhlekhOgnoo(
                    (v || [null, null]) as [Date | null, Date | null]
                  )
                }
                locale="mn"
              />
              <Select
                className="text-[color:var(--panel-text)]"
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
                  className="btn-minimal"
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
                  className="btn-minimal"
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
                  className="btn-minimal"
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
          <div className="table-surface overflow-hidden rounded-2xl mt-10 w-full">
            <div className="max-h-[330px] overflow-y-auto custom-scrollbar w-full">
              <table className="table-ui text-sm min-w-full">
                <thead>
                  <tr>
                    <th className="p-3 text-xs font-semibold text-theme text-center w-12">
                      №
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold">
                      Огноо
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold">
                      Тайлант сар
                    </th>
                    <th className="py-4 px-6 text-right text-sm font-semibold">
                      Дүн
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold">
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
                        <td className="py-4 px-6">{index + 1}</td>
                        <td className="py-4 px-6">{item.date}</td>
                        <td className="py-4 px-6">{item.month}</td>
                        <td className="py-4 px-6 text-right">{item.total}</td>
                        <td className="py-4 px-6">{item.service}</td>
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
