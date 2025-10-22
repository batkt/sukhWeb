"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import {
  Calendar,
  Mail,
  Printer,
  Send,
  Plus,
  Edit2,
  Eye,
  Search,
  DollarSign,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  TrendingUp,
  Edit,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "../../../lib/useOrshinSuugch";
import { useGereeJagsaalt } from "../../../lib/useGeree";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import toast from "react-hot-toast";

const formatNumber = (num: number) => {
  return num?.toLocaleString("mn-MN") || "0";
};

const formatCurrency = (amount: number) => {
  return `${formatNumber(amount)} ₮`;
};

// First, add this print-specific style to the top of your file
const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4;
        margin: 1.5cm;
      }

      body * {
        visibility: hidden;
      }

      .invoice-modal,
      .invoice-modal * {
        visibility: visible !important;
      }

      .invoice-modal {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
      }

      .no-print {
        display: none !important;
      }

      .print-break {
        break-inside: avoid;
      }

      /* Ensure table fits on one page */
      table {
        page-break-inside: avoid;
      }

      /* Adjust font sizes for print */
      .invoice-modal h2 {
        font-size: 18pt !important;
      }
      .invoice-modal h3 {
        font-size: 14pt !important;
      }
      .invoice-modal p,
      .invoice-modal td,
      .invoice-modal th {
        font-size: 11pt !important;
      }
    }
  `}</style>
);

// First, update the InvoiceModal props interface
interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
  baiguullagiinId: string;
  token: string;
}

// Add the ModalPortal component
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted
    ? createPortal(
        <div className="fixed inset-0 z-[9999]">{children}</div>,
        document.body
      )
    : null;
};

// Update the InvoiceModal component
const InvoiceModal = ({
  isOpen,
  onClose,
  resident,
  baiguullagiinId,
  token,
}: InvoiceModalProps) => {
  // Add necessary hooks and state
  const { baiguullaga } = useBaiguullaga(token, baiguullagiinId);
  const { gereeGaralt } = useGereeJagsaalt(
    { _id: resident?._id },
    token,
    baiguullagiinId
  );
  const { zardluud: ashiglaltiinZardluud } = useAshiglaltiinZardluud();

  // Get geree data from gereeGaralt
  const gereeData = gereeGaralt?.jagsaalt?.[0];

  // Generate unique invoice number and current date
  const invoiceNumber = `INV-${Math.random().toString(36).substr(2, 9)}`;
  const currentDate = new Date().toLocaleDateString("mn-MN");

  if (!isOpen) return null;

  // Add type for zardal
  interface Zardal {
    _id: string;
    ner: string;
    tariff: number;
    turul: string;
  }

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            <PrintStyles />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="invoice-modal">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print-break no-print">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        Үйлчилгээний нэхэмжлэх
                      </h2>
                      <p className="text-sm text-slate-500">
                        Нэхэмжлэхийн дугаар: {invoiceNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Хаах"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                {/* Printable Content */}
                <div className="p-6 space-y-6">
                  {/* Company and Invoice Info */}
                  <div className="grid grid-cols-2 gap-6 print-break">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">
                        {baiguullaga?.ner}
                      </h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="font-medium">Имэйл:</span>{" "}
                          {baiguullaga?.email || "-"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className="font-medium">Утас:</span>{" "}
                          {baiguullaga?.utas || "-"}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">Хаяг:</span>{" "}
                          {baiguullaga?.khayag || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="inline-block text-left bg-blue-50 p-3 rounded-xl">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Огноо:</span>{" "}
                          {currentDate}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Төлбөр төлөх:</span>{" "}
                          {formatDate(gereeData?.tulukhOgnoo || currentDate)}
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                          <span className="font-medium">Банк:</span>{" "}
                          {baiguullaga?.bankNer || "-"}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Данс:</span>{" "}
                          {baiguullaga?.dans || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resident Info */}
                  <div className="border border-gray-100 rounded-lg p-4 print-break">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {resident?.ovog?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">
                          {resident?.ovog} {resident?.ner}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {resident?.register}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p>
                          <span className="text-slate-500">Тоот:</span>{" "}
                          {resident?.toot}
                        </p>
                        <p>
                          <span className="text-slate-500">Гэрээ №:</span>{" "}
                          {gereeData?.gereeniiDugaar}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p>
                          <span className="text-slate-500">Утас:</span>{" "}
                          {resident?.utas}
                        </p>
                        <p>
                          <span className="text-slate-500">Огноо:</span>{" "}
                          {formatDate(gereeData?.gereeniiOgnoo)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg overflow-hidden print-break">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-3 text-left text-slate-600">
                            Зардал
                          </th>
                          <th className="py-2 px-3 text-right text-slate-600">
                            Тариф
                          </th>
                          <th className="py-2 px-3 text-right text-slate-600">
                            Нийт
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(ashiglaltiinZardluud as Zardal[]).map(
                          (zardal: Zardal) => (
                            <tr key={zardal._id}>
                              <td className="py-2 px-3">{zardal.ner}</td>
                              <td className="py-2 px-3 text-right">
                                {formatNumber(zardal.tariff)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {formatNumber(zardal.tariff)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={2} className="py-2 px-3 font-medium">
                            Нийт дүн:
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {formatNumber(
                              (ashiglaltiinZardluud as Zardal[]).reduce(
                                (sum: number, item: Zardal) =>
                                  sum + item.tariff,
                                0
                              )
                            )}{" "}
                            ₮
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="border-t border-gray-100 pt-4 print-break">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            resident?.tuluv === "Төлсөн"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span className="font-normal mr-2">
                            Төлбөрийн төлөв:
                          </span>
                          {resident?.tuluv || "Төлөөгүй"}
                        </span>
                        <span className="text-sm text-slate-500">
                          Нийт дүн:{" "}
                          <span className="font-bold text-slate-900">
                            {formatNumber(
                              (ashiglaltiinZardluud as Zardal[]).reduce(
                                (sum: number, item: Zardal) =>
                                  sum + item.tariff,
                                0
                              )
                            )}{" "}
                            ₮
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Hide in print */}
                <div className="border-t border-gray-100 bg-gray-50 p-4 no-print">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Printer className="w-5 h-5" />
                      Хэвлэх
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-gray-100 text-slate-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                      Хаах
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

export default function InvoicingZardluud() {
  const { token, ajiltan } = useAuth();
  const [selectedSukh, setSelectedSukh] = useState("");
  const [selectedDavkhar, setSelectedDavkhar] = useState("");
  const [selectedBarilga, setSelectedBarilga] = useState("");
  const [selectedTurul, setSelectedTurul] = useState("");
  const [selectedTuluv, setSelectedTuluv] = useState(""); // New filter for payment status
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [davkharList, setDavkharList] = useState<string[]>([]);
  const [barilgaList, setBarilgaList] = useState<string[]>([]);
  const [turulList, setTurulList] = useState<string[]>([]);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { zardluud: ashiglaltiinZardluud } = useAshiglaltiinZardluud();

  const filterQuery = useMemo(() => {
    const query: any = {};
    if (selectedDavkhar) query.davkhar = selectedDavkhar;
    if (selectedBarilga) query.barilga = selectedBarilga;
    if (selectedTurul) query.turul = selectedTurul;

    return query;
  }, [selectedDavkhar, selectedBarilga, selectedTurul]);

  const {
    orshinSuugchGaralt,
    setOrshinSuugchKhuudaslalt,
    isValidating: isLoadingResidents,
  } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    filterQuery
  );

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;

      setIsLoadingExpenses(true);
      try {
        const response = await fetch(
          `http://103.143.40.46:8084/ashiglaltiinZardluud?baiguullagiinId=${ajiltan.baiguullagiinId}&khuudasniiDugaar=1&khuudasniiKhemjee=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setExpenses(data.jagsaalt || []);
      } catch (error) {
        toast.error("Зардлын мэдээлэл татахад алдаа гарлаа");
        console.error(error);
      } finally {
        setIsLoadingExpenses(false);
      }
    };

    fetchExpenses();
  }, [token, ajiltan?.baiguullagiinId]);

  useEffect(() => {
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 100,
      search: searchTerm,
      davkhar: selectedDavkhar || undefined,
      barilga: selectedBarilga || undefined,
      turul: selectedTurul || undefined,
    });
  }, [selectedDavkhar, selectedBarilga, searchTerm]);

  const residents = orshinSuugchGaralt?.jagsaalt || [];

  // Filter by payment status
  const filteredResidents = useMemo(() => {
    if (!selectedTuluv) return residents;
    return residents.filter((r: any) => r.tuluv === selectedTuluv);
  }, [residents, selectedTuluv]);

  const totalRecords = filteredResidents.length;

  useEffect(() => {
    if (residents.length > 0) {
      const uniqueDavkhar = [
        ...new Set(residents.map((r: any) => r.davkhar).filter(Boolean)),
      ];
      const uniqueBarilga = [
        ...new Set(residents.map((r: any) => r.barilga).filter(Boolean)),
      ];
      const uniqueTurul = [
        ...new Set(residents.map((r: any) => r.turul).filter(Boolean)),
      ];
      setDavkharList(uniqueDavkhar as string[]);
      setBarilgaList(uniqueBarilga as string[]);
      setTurulList(uniqueTurul as string[]);
    }
  }, [residents]);

  const handleSelectAll = () => {
    if (selectedExpenses.length === filteredResidents.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredResidents.map((res: any) => res._id));
    }
  };

  const handleSelectExpense = (id: string) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleViewInvoice = (resident: any) => {
    setSelectedResident(resident);
    setIsModalOpen(true);
  };

  const isLoading = isLoadingExpenses || isLoadingResidents;

  if (!ajiltan || !ajiltan.baiguullagiinId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Мэдээлэл ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 bg-slate-900 bg-clip-text text-transparent drop-shadow-sm"
      >
        Зардлын нэхэмжлэл
      </motion.h1>

      <div className="rounded-2xl p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 min-w-[140px] rounded-xl border border-white/30 bg-transparent backdrop-blur-md px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:bg-white/30 shadow-sm transition-all"
          />
          <select
            value={selectedTurul}
            onChange={(e) => setSelectedTurul(e.target.value)}
            className="flex-1 min-w-[160px] rounded-xl border border-white/30 bg-transparent backdrop-blur-md px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:bg-white/30 shadow-sm transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22%23374151%22%20d%3d%22M6%209L1%204h10z%22%2f%3e%3c%2fsvg%3e')] bg-[length:12px_12px] bg-[position:right_0.8rem_center] bg-no-repeat"
          >
            <option value="" className="bg-white/95 backdrop-blur-md">
              Гэрээний төрөл
            </option>
            {turulList.map((turul) => (
              <option
                key={turul}
                value={turul}
                className="bg-white/95 backdrop-blur-md"
              >
                {turul}
              </option>
            ))}
          </select>

          <select
            value={selectedTuluv}
            onChange={(e) => setSelectedTuluv(e.target.value)}
            className="flex-1 min-w-[160px] rounded-xl border border-white/30 bg-transparent backdrop-blur-md px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:bg-white/30 shadow-sm transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22%23374151%22%20d%3d%22M6%209L1%204h10z%22%2f%3e%3c%2fsvg%3e')] bg-[length:12px_12px] bg-[position:right_0.8rem_center] bg-no-repeat"
          >
            <option value="" className="bg-white/95 backdrop-blur-md">
              Бүх төлөв
            </option>
            <option value="Төлсөн" className="bg-white/95 backdrop-blur-md">
              Төлсөн
            </option>
            <option value="Төлөөгүй" className="bg-white/95 backdrop-blur-md">
              Төлөөгүй
            </option>
          </select>

          <select
            value={selectedDavkhar}
            onChange={(e) => setSelectedDavkhar(e.target.value)}
            className="flex-1 min-w-[160px] rounded-xl border border-white/30 bg-transparent backdrop-blur-md px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:bg-white/30 shadow-sm transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22%23374151%22%20d%3d%22M6%209L1%204h10z%22%2f%3e%3c%2fsvg%3e')] bg-[length:12px_12px] bg-[position:right_0.8rem_center] bg-no-repeat"
          >
            <option value="" className="bg-white/95 backdrop-blur-md">
              Давхар
            </option>
            {davkharList.map((davkhar) => (
              <option
                key={davkhar}
                value={davkhar}
                className="bg-white/95 backdrop-blur-md"
              >
                {davkhar}
              </option>
            ))}
          </select>

          <select
            value={selectedBarilga}
            onChange={(e) => setSelectedBarilga(e.target.value)}
            className="flex-1 min-w-[160px] rounded-xl border border-white/30 bg-transparent backdrop-blur-md px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:bg-white/30 shadow-sm transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22%23374151%22%20d%3d%22M6%209L1%204h10z%22%2f%3e%3c%2fsvg%3e')] bg-[length:12px_12px] bg-[position:right_0.8rem_center] bg-no-repeat"
          >
            <option value="" className="bg-white/95 backdrop-blur-md">
              Бүх барилга
            </option>
            {barilgaList.map((barilga) => (
              <option
                key={barilga}
                value={barilga}
                className="bg-white/95 backdrop-blur-md"
              >
                {barilga}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Оршин суугч хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-2xl border border-white/30 bg-transparent backdrop-blur-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600">Уншиж байна...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl backdrop-blur-md shadow-xl">
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-slate-800">
                <thead className="bg-white/50">
                  <tr>
                    <th className="w-[4%] p-3 text-center border-b border-white/40 font-semibold">
                      №
                    </th>
                    <th className="w-[18%] p-3 text-left border-b border-white/40 font-semibold">
                      Оршин суугч
                    </th>
                    <th className="w-[8%] p-3 text-center border-b border-white/40 font-semibold">
                      Тоот
                    </th>
                    <th className="w-[22%] p-3 text-left border-b border-white/40 font-semibold">
                      Хаяг
                    </th>
                    <th className="w-[12%] p-3 text-center border-b border-white/40 font-semibold">
                      Утас
                    </th>
                    <th className="w-[10%] p-3 text-center border-b border-white/40 font-semibold">
                      Төлөв
                    </th>
                    <th className="w-[10%] p-3 text-center border-b border-white/40 font-semibold">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/20 max-h-[300px]">
                  {residents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-slate-500"
                      >
                        Мэдээлэл байхгүй байна
                      </td>
                    </tr>
                  ) : (
                    residents.map((resident: any, index: any) => (
                      <tr
                        key={resident._id}
                        className="hover:shadow-md transition-colors"
                      >
                        <td className="p-3 text-center text-slate-600 font-medium">
                          {index + 1}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                              {resident.ovog?.charAt(0)?.toUpperCase() || "О"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">
                                {resident.ovog} {resident.ner}
                              </div>
                              <div className="text-xs text-slate-600 truncate">
                                {resident.register || "Регистр тодорхойгүй"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg  text-slate-900 font-semibold text-sm">
                              {resident.toot || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-slate-700">
                            {resident.duureg &&
                            resident.horoo &&
                            resident.davkhar
                              ? `${resident.duureg}, ${resident.horoo}, ${resident.davkhar}`
                              : resident.khayag || "Хаяг тодорхойгүй"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-slate-700 text-center">
                            {resident.utas || "-"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xl ${
                                resident.tuluv === "Төлсөн"
                                  ? "bg-green-100/80 text-green-800"
                                  : resident.tuluv === "Төлөөгүй"
                                  ? "bg-red-100/80 text-red-800"
                                  : "bg-gray-100/80 text-slate-800"
                              }`}
                            >
                              {resident.tuluv || "Тодорхойгүй"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewInvoice(resident)}
                              className="rounded-full p-2 hover:bg-white/30 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-violet-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-transparent px-6 py-3 border-t border-white/40">
              <div className="text-sm text-slate-700">
                Нийт: <span className="font-semibold">{totalRecords}</span>{" "}
                оршин суугч
              </div>
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resident={selectedResident}
        baiguullagiinId={ajiltan?.baiguullagiinId}
        token={token || ""}
      />
    </div>
  );
}

// First update the formatDate function to handle undefined values
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
