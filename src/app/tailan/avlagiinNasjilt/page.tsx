"use client";
import { motion } from "framer-motion";
import React, { useState, useMemo, useRef } from "react";
import {
  Calendar,
  Printer,
  FileSpreadsheet,
  ChevronDown,
  Search,
} from "lucide-react";

interface Customer {
  _id: string;
  register: string;
  ner: string;
  talbainKhemjee: number;
  talbainNegjUne: number;
  gereeniiDugaar?: string;
  gereeniiOgnoo?: string;
  ovog?: string;
  utas?: string[];
  mail?: string;
  talbainDugaar?: string;
}

interface Avlaga {
  ognoo: string;
  tailbar: string;
  tulukhDun: number;
  talbainKhemjee: number;
}

interface ReportData {
  _id: Customer;
  avlaga: Avlaga[];
  niitTulukhDun: number;
}

const generateMockData = (): ReportData[] => {
  const customers: Customer[] = [
    {
      _id: "1",
      register: "РД12345678",
      ner: "Бат-Эрдэнэ",
      talbainKhemjee: 45.5,
      talbainNegjUne: 15000,
      gereeniiDugaar: "G2024-001",
      gereeniiOgnoo: "2024-01-15",
      ovog: "Доржийн",
      utas: ["99001122"],
      mail: "bat@email.com",
      talbainDugaar: "T-101",
    },
    {
      _id: "2",
      register: "РД87654321",
      ner: "Энхтуяа",
      talbainKhemjee: 32.0,
      talbainNegjUne: 12000,
      gereeniiDugaar: "G2024-002",
      gereeniiOgnoo: "2024-02-01",
      ovog: "Гантулгын",
      utas: ["88112233"],
      mail: "enkh@email.com",
      talbainDugaar: "T-102",
    },
    {
      _id: "3",
      register: "РД11223344",
      ner: "Болормаа",
      talbainKhemjee: 28.3,
      talbainNegjUne: 13500,
      gereeniiDugaar: "G2024-003",
      gereeniiOgnoo: "2024-01-20",
      ovog: "Цэрэнийн",
      utas: ["99887766"],
      mail: "bolor@email.com",
      talbainDugaar: "T-103",
    },
  ];

  const months = ["2024-08", "2024-09", "2024-10"];
  const services = [
    "Түрээсийн төлбөр",
    "Цахилгааны төлбөр",
    "Усны төлбөр",
    "Менежментийн төлбөр",
  ];

  return customers.map((customer) => {
    const avlaga: Avlaga[] = [];
    let total = 0;

    months.forEach((month) => {
      services.forEach((service) => {
        const amount = Math.random() * 500000 + 100000;
        avlaga.push({
          ognoo: month + "-15",
          tailbar: service,
          tulukhDun: amount,
          talbainKhemjee: customer.talbainKhemjee,
        });
        total += amount;
      });
    });

    return {
      _id: customer,
      avlaga,
      niitTulukhDun: total,
    };
  });
};

const formatNumber = (
  num: number | undefined,
  decimals: number = 0
): string => {
  if (!num && num !== 0) return "";
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const AvlagiinNasjilt: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: "2024-08-01",
    end: "2024-10-31",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const [additionalColumns, setAdditionalColumns] = useState<string[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const mockData = useMemo(() => generateMockData(), []);

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item._id.ner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item._id.register.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCustomer =
        selectedCustomers.length === 0 ||
        selectedCustomers.includes(item._id.register);

      return matchesSearch && matchesCustomer;
    });
  }, [mockData, searchTerm, selectedCustomers]);

  const { months, services } = useMemo(() => {
    const monthSet = new Set<string>();
    const serviceMap = new Map<string, { ognoo: string; tailbar: string }>();

    filteredData.forEach((item) => {
      item.avlaga.forEach((avl) => {
        const month = avl.ognoo.substring(0, 7);
        monthSet.add(month);
        const key = `${month}-${avl.tailbar}`;
        if (!serviceMap.has(key)) {
          serviceMap.set(key, { ognoo: month, tailbar: avl.tailbar });
        }
      });
    });

    return {
      months: Array.from(monthSet).sort(),
      services: Array.from(serviceMap.values()).sort(
        (a, b) =>
          a.ognoo.localeCompare(b.ognoo) || a.tailbar.localeCompare(b.tailbar)
      ),
    };
  }, [filteredData]);

  const totals = useMemo(() => {
    const result = {
      talbainKhemjee: 0,
      services: new Map<string, number>(),
      total: 0,
    };

    filteredData.forEach((item) => {
      result.talbainKhemjee += item._id.talbainKhemjee;
      result.total += item.niitTulukhDun;

      services.forEach((service) => {
        const key = `${service.ognoo}-${service.tailbar}`;
        const avlaga = item.avlaga.filter(
          (a) =>
            a.ognoo.substring(0, 7) === service.ognoo &&
            a.tailbar === service.tailbar
        );
        const sum = avlaga.reduce((acc, a) => acc + a.tulukhDun, 0);
        result.services.set(key, (result.services.get(key) || 0) + sum);
      });
    });

    return result;
  }, [filteredData, services]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Нэгтгэл тайлан</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #999; padding: 8px; font-size: 11px; }
            th { background-color: #9CA3AF; color: white; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const availableColumns = [
    { key: "gereeniiDugaar", label: "Гэрээ №" },
    { key: "gereeniiOgnoo", label: "Гэрээний огноо" },
    { key: "ovog", label: "Овог" },
    { key: "utas", label: "Утас" },
    { key: "mail", label: "И-мэйл" },
    { key: "talbainDugaar", label: "Талбайн №" },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
        >
          Нэгтгэл
        </motion.h1>

        <div className="p-4 rounded-2xl shadow mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Calendar className="w-5 h-5 text-slate-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="border rounded px-3 py-2"
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="border rounded px-3 py-2"
            />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Харилцагч хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded px-10 py-2"
            />
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2  border border-gray-300 rounded hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Хэвлэх
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExcelMenu(!showExcelMenu)}
                className="flex items-center gap-2 px-4 py-2  border border-gray-300 rounded hover:bg-gray-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
                <ChevronDown className="w-4 h-4" />
              </button>
              {showExcelMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                  <button
                    onClick={() => {
                      alert("Excel тайлан татагдаж байна...");
                      setShowExcelMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Тайлан татах
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Багана сонгох
              </button>
              {showColumnSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-10 p-3">
                  <div className="text-sm font-semibold mb-2">
                    Нэмэлт багана сонгох:
                  </div>
                  {availableColumns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={additionalColumns.includes(col.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdditionalColumns([
                              ...additionalColumns,
                              col.key,
                            ]);
                          } else {
                            setAdditionalColumns(
                              additionalColumns.filter((c) => c !== col.key)
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="table-surface overflow-hidden rounded-2xl mt-0 w-full">
          <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
            <div
              className="custom-scrollbar w-full"
              style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
            >
              <table className="table-ui text-sm min-w-full">
                <thead>
                  <tr className="text-theme">
                    <th rowSpan={2} className="p-3 text-center">
                      №
                    </th>
                    <th rowSpan={2} className="p-3 text-center min-w-[120px]">
                      Регистер/ТИН
                    </th>
                    <th rowSpan={2} className="p-3 text-center min-w-[150px]">
                      Харилцагч нэр
                    </th>
                    <th rowSpan={2} className="p-3 text-center min-w-[100px]">
                      Талбайн хэмжээ
                    </th>
                    <th rowSpan={2} className="p-3 text-center min-w-[100px]">
                      Түрээс үнэ
                    </th>
                    {additionalColumns.map((colKey) => {
                      const col = availableColumns.find(
                        (c) => c.key === colKey
                      );
                      return (
                        <th
                          key={colKey}
                          rowSpan={2}
                          className="p-3 text-center min-w-[100px]"
                        >
                          {col?.label}
                        </th>
                      );
                    })}
                    {months.map((month) => (
                      <th
                        key={month}
                        colSpan={
                          services.filter((s) => s.ognoo === month).length
                        }
                        className="p-3 text-center"
                      >
                        {month}
                      </th>
                    ))}
                    <th rowSpan={2} className="p-3 text-center min-w-[100px]">
                      Нийт
                    </th>
                  </tr>
                  <tr className="text-theme">
                    {services.map((service, idx) => (
                      <th key={idx} className="p-3 text-center min-w-[120px]">
                        {service.tailbar}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((item, idx) => (
                    <tr
                      key={item._id._id}
                      className="transition-colors border-b last:border-b-0"
                    >
                      <td className="p-3 text-center">{idx + 1}</td>
                      <td className="p-3 text-center">{item._id.register}</td>
                      <td className="p-3 text-center">{item._id.ner}</td>
                      <td className="p-3 text-right">
                        {formatNumber(item._id.talbainKhemjee, 2)}
                      </td>
                      <td className="p-3 text-right">
                        {formatNumber(item._id.talbainNegjUne, 2)}
                      </td>

                      {additionalColumns.map((colKey) => (
                        <td key={colKey} className="p-3 text-center">
                          {colKey === "gereeniiOgnoo" && item._id.gereeniiOgnoo
                            ? item._id.gereeniiOgnoo.substring(0, 10)
                            : colKey === "utas" && item._id.utas
                            ? item._id.utas.join(", ")
                            : item._id[colKey as keyof Customer] || ""}
                        </td>
                      ))}

                      {services.map((service, sIdx) => {
                        const avlaga = item.avlaga.filter(
                          (a) =>
                            a.ognoo.substring(0, 7) === service.ognoo &&
                            a.tailbar === service.tailbar
                        );
                        const sum = avlaga.reduce(
                          (acc, a) => acc + a.tulukhDun,
                          0
                        );
                        return (
                          <td key={sIdx} className="p-3 text-right">
                            {sum > 0 ? formatNumber(sum) : ""}
                          </td>
                        );
                      })}

                      <td className="p-3 text-right font-semibold">
                        {formatNumber(item.niitTulukhDun, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={3} className="p-3">
                      Нийт
                    </td>
                    <td className="p-3 text-right">
                      {formatNumber(totals.talbainKhemjee, 2)}
                    </td>
                    <td
                      className="p-3"
                      colSpan={additionalColumns.length + 1}
                    ></td>
                    {services.map((service, idx) => {
                      const key = `${service.ognoo}-${service.tailbar}`;
                      return (
                        <td key={idx} className="p-3 text-right">
                          {formatNumber(totals.services.get(key) || 0)}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right">
                      {formatNumber(totals.total, 2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvlagiinNasjilt;
