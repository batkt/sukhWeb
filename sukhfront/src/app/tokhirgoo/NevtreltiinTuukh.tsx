"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DatePicker, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Settings, MoreHorizontal } from "lucide-react";
import moment from "moment";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

interface Props {
  token: string;
  baiguullaga: { _id: string };
  ajiltan: { _id: string };
}

interface RecordType {
  _id: number;
  ognoo: string;
  browser: string;
  ajiltniiNer: string;
  bairshilKhot: string;
  bairshilUls: string;
  uildliinSystem: string;
  ip: string;
}

function useJagsaalt(
  page: number,
  pageSize: number
): {
  jagsaalt: RecordType[];
  total: number;
} {
  const [jagsaalt, setJagsaalt] = useState<RecordType[]>([]);
  const [total] = useState(100); // Mock total rows

  useEffect(() => {
    const startIndex = (page - 1) * pageSize;
    const records: RecordType[] = Array.from({ length: pageSize }, (_, i) => ({
      _id: startIndex + i + 1,
      ognoo: moment()
        .subtract(startIndex + i, "days")
        .toISOString(),
      browser: ["Chrome", "Firefox", "Edge"][i % 3],
      ajiltniiNer: `Ажилтан ${startIndex + i + 1}`,
      bairshilKhot: ["Улаанбаатар", "Дархан", "Эрдэнэт"][i % 3],
      bairshilUls: "Монгол",
      uildliinSystem: ["Windows", "MacOS", "Linux"][i % 3],
      ip: `192.168.1.${(startIndex + i) % 255}`,
    }));
    setJagsaalt(records);
  }, [page, pageSize]);

  return { jagsaalt, total };
}

export default function NevtreltiinTuukh({
  token,
  baiguullaga,
  ajiltan,
}: Props) {
  const { t } = useTranslation();

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { jagsaalt, total } = useJagsaalt(page, pageSize);

  const handleDateChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      console.log("Filter range:", dateStrings);
    }
  };

  const columns: ColumnsType<RecordType> = useMemo(
    () => [
      {
        title: "#",
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: t("Огноо"),
        dataIndex: "ognoo",
        render: (ognoo) => moment(ognoo).format("YYYY-MM-DD, HH:mm"),
      },
      { title: t("Веб хөтөч"), dataIndex: "browser" },
      { title: t("Ажилтны нэр"), dataIndex: "ajiltniiNer" },
      {
        title: t("Байршил"),
        render: (_, record) => (
          <Tooltip title={`${record.bairshilKhot}, ${record.bairshilUls}`}>
            {record.bairshilKhot}, {record.bairshilUls}
          </Tooltip>
        ),
      },
      { title: t("Төхөөрөмж"), dataIndex: "uildliinSystem" },
      { title: "IP", dataIndex: "ip" },
    ],
    [page, pageSize]
  );

  return (
    <div className="overflow-x-auto bg-transparent rounded-2xl shadow-lg p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold border-b border-b-gray-300 text-gray-800 pb-4">
          {t("Нэвтрэлтийн түүх")}
        </h2>
        <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} />
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white">
            {columns.map((col) => (
              <th
                key={col.title as string}
                className="py-3 px-4 font-semibold text-gray-700"
              >
                {col.title as string}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jagsaalt.map((record, idx) => (
            <tr
              key={record._id}
              className="border-b border-amber-200 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">{(page - 1) * pageSize + idx + 1}</td>
              <td className="py-3 px-4">
                {moment(record.ognoo).format("YYYY-MM-DD, HH:mm")}
              </td>
              <td className="py-3 px-4">{record.browser}</td>
              <td className="py-3 px-4">{record.ajiltniiNer}</td>
              <td className="py-3 px-4">
                {record.bairshilKhot}, {record.bairshilUls}
              </td>
              <td className="py-3 px-4">{record.uildliinSystem}</td>
              <td className="py-3 px-4">{record.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end items-center mt-4 gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {t("Өмнөх")}
        </button>
        <span>
          {page} / {Math.ceil(total / pageSize)}
        </span>
        <button
          disabled={page * pageSize >= total}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {t("Дараах")}
        </button>
      </div>
    </div>
  );
}
