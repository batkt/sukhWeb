"use client";

import React, { useState } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { DatePickerInput } from "@mantine/dates";
import { t } from "i18next";

const formatNumber = (num: number) => num.toLocaleString();

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

  // Columns are rendered in a semantic table below

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
      <div className="grid grid-cols-12 gap-6 mt-6 ">
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <div className="bg-transparent shadow-md rounded-xl overflow-hidden">
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--surface-border)" }}
            >
              <h2 className="text-lg font-semibold text-theme">
                {t("Мэдээллийн сан")}
              </h2>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="text-theme font-medium">
                  {t("Системийн өгөгдөл")}
                </div>
                <p className="text-sm text-theme opacity-70">
                  {t("Сүүлд шинэчилсэн")} {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                className="btn-minimal"
                disabled={loading}
                onClick={backTatya}
              >
                <span className="inline-flex items-center gap-2">
                  <DownloadOutlined /> {t("Татах")}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <div className="bg-transparent shadow-md rounded-xl overflow-hidden">
            <div
              className="px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b"
              style={{ borderColor: "var(--surface-border)" }}
            >
              <h2 className="text-lg font-semibold text-theme">
                {t("Татсан түүх")}
              </h2>
              <DatePickerInput
                type="range"
                locale="mn"
                value={ognoo || undefined}
                onChange={(dates) =>
                  setOgnoo((dates || null) as [Date | null, Date | null] | null)
                }
                className="w-full md:w-auto bg-transparent "
              />
            </div>

            <div className="table-surface neu-table custom-scrollbar p-2">
              <table className="table-ui w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="text-center">№</th>
                    <th className="text-center">{t("Огноо")}</th>
                    <th className="text-center">{t("Ажилтан")}</th>
                    <th className="text-center">{t("Хэмжээ")}</th>
                  </tr>
                </thead>
                <tbody>
                  {backAwsanTuukh.jagsaalt.map((row, index) => (
                    <tr key={row._id}>
                      <td className="text-center">
                        {(backAwsanTuukh.khuudasniiDugaar - 1) *
                          backAwsanTuukh.khuudasniiKhemjee +
                          index +
                          1}
                      </td>
                      <td className="text-center">
                        {row.ognoo ? new Date(row.ognoo).toLocaleString() : ""}
                      </td>
                      <td className="text-center">{row.ajiltniiNer}</td>
                      <td className="text-center">
                        <span className="font-medium text-blue-600">
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
  );
}

export default Baaz;
