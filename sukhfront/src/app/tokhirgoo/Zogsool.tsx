"use client";

import React, { useState } from "react";
import moment from "moment";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

interface ZogsoolItem {
  key: number;
  ner: string;
  ajiltniiNer: string;
  khaalga: string[];
  too: number;
  undsenUne: string;
  ognoo: Date;
}

interface SmsItem {
  key: number;
  createdAt: Date;
  dugaar: string[];
  msg: string;
}

export default function Zogsool() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  const [zogsoolData, setZogsoolData] = useState<ZogsoolItem[]>(
    Array.from({ length: 20 }).map((_, i) => ({
      key: i,
      ner: `Зогсоол ${i + 1}`,
      ajiltniiNer: i % 2 === 0 ? "Дотор" : "Гадна",
      khaalga: Array.from({ length: (i % 3) + 1 }, (_, idx) => `Х${idx + 1}`),
      too: (i + 1) * 2,
      undsenUne: `${(i + 1) * 1000}₮`,
      ognoo: new Date(),
    }))
  );

  const [smsData, setSmsData] = useState<SmsItem[]>(
    Array.from({ length: 12 }).map((_, i) => ({
      key: i,
      createdAt: new Date(),
      dugaar: [`99900${i + 1}`],
      msg: `СМС загвар ${i + 1}`,
    }))
  );

  const addZogsool = () => {
    const newItem: ZogsoolItem = {
      key: Date.now(),
      ner: "Шинэ зогсоол",
      ajiltniiNer: "Дотор",
      khaalga: ["Х1"],
      too: 1,
      undsenUne: "1000₮",
      ognoo: new Date(),
    };
    setZogsoolData((prev) => [newItem, ...prev]);
  };

  const editZogsool = (item: ZogsoolItem) => {
    alert(`Edit ${item.ner}`);
  };

  const deleteZogsool = (key: number) => {
    setZogsoolData((prev) => prev.filter((item) => item.key !== key));
  };

  const paginatedZogsool = zogsoolData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div>
      <div className="flex justify-between items-center border-b border-amber-300 pb-3">
        <h2 className="text-lg font-medium">Зогсоол тохиргоо</h2>
        <button
          onClick={addZogsool}
          className="flex items-center px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <PlusOutlined className="mr-2" /> Зогсоол бүртгэх
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-amber-300 bg-transparent">
              {[
                "№",
                "Зогсоолын нэр",
                "Дотор эсэх",
                "Хаалганы тоо",
                "Зогсоолын тоо",
                "Үнэ",
                "Огноо",
                "",
              ].map((col) => (
                <th key={col} className="py-3 px-4 font-semibold text-gray-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedZogsool.map((record, idx) => (
              <tr
                key={record.key}
                className="border-b border-amber-200 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4">{(page - 1) * pageSize + idx + 1}</td>
                <td className="py-3 px-4">{record.ner}</td>
                <td className="py-3 px-4">{record.ajiltniiNer}</td>
                <td className="py-3 px-4">{record.khaalga.length}</td>
                <td className="py-3 px-4">{record.too}</td>
                <td className="py-3 px-4">{record.undsenUne}</td>
                <td className="py-3 px-4">
                  {moment(record.ognoo).format("YYYY-MM-DD, HH:mm")}
                </td>
                <td className="py-3 px-4 flex space-x-2">
                  <button
                    onClick={() => editZogsool(record)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <EditOutlined />
                  </button>
                  <button
                    onClick={() => deleteZogsool(record.key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <DeleteOutlined />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center mt-4 gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Өмнөх
        </button>
        <span>
          {page} / {Math.ceil(zogsoolData.length / pageSize)}
        </span>
        <button
          disabled={page * pageSize >= zogsoolData.length}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Дараах
        </button>
      </div>

      <div className="mt-10 mb-5 flex justify-between items-center">
        <h2 className="text-md font-medium">СМС тохиргоо</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-amber-300 bg-transparent">
              {["№", "Огноо", "Дугаар", "СМС мессеж"].map((col) => (
                <th key={col} className="py-3 px-4 font-semibold text-gray-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {smsData.slice(0, 5).map((record, idx) => (
              <tr
                key={record.key}
                className="border-b border-amber-200 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4">{idx + 1}</td>
                <td className="py-3 px-4">
                  {moment(record.createdAt).format("YYYY-MM-DD, HH:mm")}
                </td>
                <td className="py-3 px-4">{record.dugaar[0]}</td>
                <td className="py-3 px-4">{record.msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
