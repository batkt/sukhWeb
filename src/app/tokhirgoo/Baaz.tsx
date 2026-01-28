"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { t } from "i18next";
import formatNumber from "../../../tools/function/formatNumber";

interface BackItem {
  _id: number;
  ognoo: string | Date;
  ajiltniiNer: string;
  khemjee: number;
}

interface BaazProps {
  token?: string;
}

function Baaz({ token }: BaazProps) {
  const [loading, setLoading] = useState(false);
  const [ognoo, setOgnoo] = useState<[Date | null, Date | null] | null>(null);

  const backAwsanTuukh = {
    jagsaalt: [
      { _id: 1, ognoo: new Date(), ajiltniiNer: "Бат", khemjee: 120 },
      { _id: 2, ognoo: new Date(), ajiltniiNer: "Сара", khemjee: 340 },
    ],
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 10,
    niit: 2,
  };


  function backTatya() {
    setLoading(true);

    setTimeout(() => {
      const blob = new Blob(["Mock backup content"], {
        type: "application/rar",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.rar`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg dark:shadow-blue-900/20 hover:shadow-xl dark:hover:shadow-blue-900/30 transition-all duration-300 rounded-2xl overflow-hidden border border-blue-200/50 dark:border-blue-600/50">
            <div className="px-6 py-4 border-b border-blue-200/50 dark:border-blue-600/50 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-800/20 dark:to-indigo-800/20">
              <h2 className="text-lg font-bold text-theme dark:text-white flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 dark:bg-blue-400/20 rounded-lg">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                {t("Мэдээллийн сан")}
              </h2>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="text-theme dark:text-white font-semibold mb-1">
                  {t("Системийн өгөгдөл")}
                </div>
                <p className="text-sm text-[color:var(--muted-text)] dark:text-gray-400">
                  {t("Сүүлд шинэчилсэн")} {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                style={{ borderRadius: '0.75rem' }}
                disabled={loading}
                onClick={backTatya}
              >
                <Download className="w-4 h-4" />
                {t("Татах")}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 shadow-lg dark:shadow-purple-900/20 hover:shadow-xl dark:hover:shadow-purple-900/30 transition-all duration-300 rounded-2xl overflow-hidden border border-purple-200/50 dark:border-purple-600/50">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-purple-200/50 dark:border-purple-600/50 bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-800/20 dark:to-pink-800/20">
              <h2 className="text-lg font-bold text-theme dark:text-white">
                {t("Татсан түүх")}
              </h2>
              <DatePickerInput
                type="range"
                locale="mn"
                value={ognoo || undefined}
                onChange={(dates) =>
                  setOgnoo((dates || null) as [Date | null, Date | null] | null)
                }
                className="w-full md:w-auto bg-transparent"
              />
            </div>

            <div className="p-4">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-purple-200/50 dark:border-purple-600/30">
                      <th className="px-4 py-3 text-center text-theme dark:text-white font-semibold">№</th>
                      <th className="px-4 py-3 text-center text-theme dark:text-white font-semibold">{t("Огноо")}</th>
                      <th className="px-4 py-3 text-center text-theme dark:text-white font-semibold">{t("Ажилтан")}</th>
                      <th className="px-4 py-3 text-center text-theme dark:text-white font-semibold">{t("Хэмжээ")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backAwsanTuukh.jagsaalt.map((row, index) => (
                      <tr key={row._id} className="border-b border-purple-100/50 dark:border-purple-800/30 hover:bg-purple-100/30 dark:hover:bg-purple-800/20 transition-colors duration-150">
                        <td className="px-4 py-3 text-center text-theme dark:text-gray-300">
                          {(backAwsanTuukh.khuudasniiDugaar - 1) *
                            backAwsanTuukh.khuudasniiKhemjee +
                            index +
                            1}
                        </td>
                        <td className="px-4 py-3 text-center text-theme dark:text-gray-300">
                          {row.ognoo ? new Date(row.ognoo).toLocaleString() : ""}
                        </td>
                        <td className="px-4 py-3 text-center text-theme dark:text-gray-300">{row.ajiltniiNer}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {formatNumber(row.khemjee)} MB
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Baaz;
