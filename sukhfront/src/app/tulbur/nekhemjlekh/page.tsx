"use client";
import { motion } from "framer-motion";
import React, { useState, useMemo } from "react";
import {
  Calendar,
  Mail,
  MessageSquare,
  Bell,
  Printer,
  Send,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Mock data
const mockInvoices = [
  {
    id: "1",
    customerName: "Батбаяр",
    contractNumber: "GER-2024-001",
    areaNumber: "A-101",
    nextPaymentDate: "2024-02-15",
    accumulated: 1250000,
    currentMonth: 850000,
    penalty: 125000,
    balance: 2225000,
    status: "pending",
  },
  {
    id: "2",
    customerName: "Оюунгэрэл",
    contractNumber: "GER-2024-002",
    areaNumber: "B-205",
    nextPaymentDate: "2024-02-20",
    accumulated: 980000,
    currentMonth: 750000,
    penalty: 0,
    balance: 1730000,
    status: "active",
  },
  {
    id: "3",
    customerName: "Төмөрбаатар",
    contractNumber: "GER-2024-003",
    areaNumber: "C-310",
    nextPaymentDate: "2024-02-25",
    accumulated: 1500000,
    currentMonth: 920000,
    penalty: 250000,
    balance: 2670000,
    status: "pending",
  },
];

const mockTemplates = [
  { id: "1", name: "Стандарт нэхэмжлэх", type: "Mail", isCustom: false },
  { id: "2", name: "Товч мэдэгдэл", type: "SMS", isCustom: true },
  { id: "3", name: "Апп мэдэгдэл", type: "App", isCustom: true },
];

const mockAccounts = [
  { id: "1", number: "5000123456", name: "Үндсэн данс", bank: "Хаан банк" },
  { id: "2", number: "5000789012", name: "Туслах данс", bank: "Голомт банк" },
];

const mockEmailHistory = [
  {
    id: "1",
    date: "2024-01-15",
    contractNo: "GER-2024-001",
    message: "Нэхэмжлэл илгээгдлээ",
    email: "batbayar@email.com",
    success: true,
  },
  {
    id: "2",
    date: "2024-01-16",
    contractNo: "GER-2024-002",
    message: "Нэхэмжлэл илгээгдлээ",
    email: "oyungerel@email.com",
    success: true,
  },
  {
    id: "3",
    date: "2024-01-17",
    contractNo: "GER-2024-003",
    message: "И-мэйл хаяг буруу байна",
    email: "invalid@email",
    success: false,
  },
];

const formatNumber = (num: number) => {
  return num.toLocaleString("mn-MN");
};

export default function InvoiceManagement() {
  const [selectedType, setSelectedType] = useState<"Mail" | "SMS" | "App">(
    "Mail"
  );
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedDate, setSelectedDate] = useState("2024-02-01");
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: "2024-01-01",
    end: "2024-01-31",
  });

  const successCount = mockEmailHistory.filter((item) => item.success).length;
  const failedCount = mockEmailHistory.filter((item) => !item.success).length;

  const handleSelectAll = () => {
    if (selectedInvoices.length === mockInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(mockInvoices.map((inv) => inv.id));
    }
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredTemplates = mockTemplates.filter(
    (t) => t.type === selectedType
  );

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm"
      >
        Нэхэмжлэл
      </motion.h1>

      <div className="rounded-2xl p-6 ">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-gray-800">
              Олон сараар:
            </span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-gray-200/70 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/40 after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-500/80 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 min-w-[120px] rounded-xl border border-white/30 bg-white/40 px-3 py-2 text-sm text-gray-800 backdrop-blur-sm focus:border-violet-400 focus:outline-none shadow-sm"
          />

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="flex-1 min-w-[120px] rounded-xl border border-white/30 bg-white/40 px-3 py-2 text-sm text-gray-800 backdrop-blur-sm focus:border-violet-400 focus:outline-none shadow-sm"
          >
            <option value="">Данс сонгох</option>
            {mockAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.number}
              </option>
            ))}
          </select>

          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="flex-1 min-w-[100px] rounded-xl border border-white/30 bg-white/40 px-3 py-2 text-sm text-gray-800 backdrop-blur-sm focus:border-violet-400 focus:outline-none shadow-sm"
          >
            <option value="">Давхар сонгох</option>
            <option value="1">1-р давхар</option>
            <option value="2">2-р давхар</option>
            <option value="3">3-р давхар</option>
          </select>

          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="flex-1 min-w-[140px] rounded-xl border border-white/30 bg-white/40 px-3 py-2 text-sm text-gray-800 backdrop-blur-sm focus:border-violet-400 focus:outline-none shadow-sm"
          >
            <option value="">Төрөл сонгох</option>
            {filteredTemplates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>

          <button className="flex-shrink-0 flex items-center gap-2 rounded-2xl bg-bar px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Mail className="h-4 w-4" />
            И-мэйл түүх
          </button>

          <button className="flex-shrink-0 flex items-center gap-2 rounded-2xl bg-bar px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Printer className="h-4 w-4" />
            Хэвлэх
          </button>

          <button className="flex-shrink-0 flex items-center gap-2 rounded-2xl border border-white/30 bg-white/30 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm backdrop-blur-sm hover:bg-white/50 transition-colors duration-300">
            <Send className="h-4 w-4" />
            Илгээх
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/30 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead className="bg-white/50 backdrop-blur-sm">
                <tr>
                  <th className="border-b border-white/40 p-3 text-center">
                    №
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Түрээслэгч
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Гэрээ
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Талбай
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Дараагийн төлөх
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Хуримтлагдсан
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Энэ сард төлөх
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Алданги
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Үлдэгдэл
                  </th>
                  <th className="border-b border-white/40 p-3 text-center">
                    Төлөв
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {mockInvoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-white/20 transition-colors"
                  >
                    <td className="p-3 text-center">{index + 1}</td>
                    <td className="p-3 text-center">{invoice.customerName}</td>
                    <td className="p-3 text-center">
                      {invoice.contractNumber}
                    </td>
                    <td className="p-3 text-center">{invoice.areaNumber}</td>
                    <td className="p-3 text-center">
                      {invoice.nextPaymentDate}
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(invoice.accumulated)}
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(invoice.currentMonth)}
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(invoice.penalty)}
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(invoice.balance)}
                    </td>
                    <td className="p-3 text-center">
                      <button className="rounded-full p-2 hover:bg-white/30 transition-colors">
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
