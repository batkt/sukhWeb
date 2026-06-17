"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  User,
  Hash,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Copy,
  QrCode,
  Smartphone,
  RefreshCw,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { getApiUrl } from "@/lib/uilchilgee";
import { toast } from "sonner";

// Fetcher helper
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Мэдээлэл авахад алдаа гарлаа");
  }
  return res.json();
};

export default function PaymentLandingPage() {
  const params = useParams();
  const invoiceId = params?.invoiceId as string;
  const [activeTab, setActiveTab] = useState<"deeplink" | "qrcode">("deeplink");
  const [copied, setCopied] = useState(false);

  const baseUrl = getApiUrl().replace(/\/$/, "");
  const fetchUrl = invoiceId ? `${baseUrl}/pay/info/${invoiceId}` : null;

  // SWR hook for querying payment status & details
  // Automatically poll every 3 seconds if the invoice is unpaid
  const { data, error, mutate, isValidating } = useSWR(
    fetchUrl,
    fetcher,
    {
      refreshInterval: (data) => {
        if (data?.success && data?.invoice?.tuluv !== "Төлсөн") {
          return 3000; // Poll every 3s if unpaid
        }
        return 0; // Stop polling if paid
      },
      revalidateOnFocus: true,
      shouldRetryOnError: false
    }
  );

  const invoice = data?.invoice;
  
  // One-time payment link: if ANY payment has been made, show as paid
  const hasPayment = Number(invoice?.tulsunDun || 0) > 0;
  const remainingAmount = invoice?.uldegdel !== undefined && invoice?.uldegdel !== null 
    ? Number(invoice.uldegdel) 
    : Number(invoice?.niitTulbur || 0) - Number(invoice?.tulsunDun || 0);
  const actualIsPaid = invoice?.tuluv === "Төлсөн" || hasPayment || remainingAmount <= 0.01;
  const displayAmount = actualIsPaid ? Number(invoice?.niitTulbur || 0) : remainingAmount;
  const isPaid = actualIsPaid;

  // Handle mobile detection to set default tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (!isMobile) {
        setActiveTab("qrcode");
      }
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && invoice?.qpayUrl) {
      navigator.clipboard.writeText(invoice.qpayUrl);
      setCopied(true);
      toast.success("Төлбөрийн линк хуулагдлаа");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("mn-MN").format(amount) + " ₮";
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)" }}
      >
        <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-red-500/20 shadow-2xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Алдаа гарлаа</h1>
            <p className="text-sm text-slate-400">
              {error.message || "Нэхэмжлэх олоход алдаа гарлаа. Холбоос буруу эсвэл нэхэмжлэх устгагдсан байж магадгүй."}
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="w-full h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Дахин ачааллах
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)" }}
      >
        {/* Skeleton pulse loading */}
        <div className="w-full max-w-lg rounded-3xl p-6 sm:p-8 backdrop-blur-xl bg-slate-900/60 border border-white/5 space-y-8 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-6 w-28 bg-slate-800 rounded-lg" />
            <div className="h-6 w-16 bg-slate-800 rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="mx-auto h-12 w-48 bg-slate-800 rounded-xl" />
            <div className="h-20 bg-slate-800/40 rounded-2xl" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-4 w-32 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
          <div className="h-24 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-500/30 text-slate-100 relative overflow-x-hidden overflow-y-auto"
      style={{ background: "radial-gradient(circle at top right, #1e1b4b 0%, #09090b 100%)" }}
    >
      {/* Dynamic background glow shapes (only rendered on desktop to avoid mobile rendering lag) */}
      <span className="hidden sm:block pointer-events-none absolute -top-48 -left-48 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px]" />
      <span className="hidden sm:block pointer-events-none absolute -bottom-48 -right-48 w-[450px] h-[450px] rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="w-full max-w-lg relative z-10 my-8">

        {/* Brand logo header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <img src="/Main.png" alt="AMARHOME Logo" className="w-8 h-8 object-contain shrink-0" />
            <span className="text-base text-slate-400 text-white">AMARHOME</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isPaid ? (
            /* SUCCESS / PAID STATE SCREEN */
            <motion.div
              key="paid-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl bg-slate-900/60 border border-emerald-500/20 shadow-2xl text-center space-y-6"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <span className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">Нэхэмжлэх төлөгдсөн</h1>
                <p className="text-sm text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full inline-block border border-emerald-500/15">
                  Төлбөр амжилттай баталгаажлаа
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 text-sm py-1 border-b border-white/5">
                  <span className="text-slate-400 shrink-0">Хүлээн авагч</span>
                  <span className="font-semibold text-white sm:text-right break-words sm:max-w-[65%]">
                    {invoice.baiguullagiinNer}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 text-sm py-1 border-b border-white/5">
                  <span className="text-slate-400 shrink-0">Төлөгч оршин суугч</span>
                  <span className="font-semibold text-white sm:text-right break-words sm:max-w-[65%]">
                    {invoice.ner || "Тодорхойгүй"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 text-sm py-1 border-b border-white/5">
                  <span className="text-slate-400 shrink-0">Тоот</span>
                  <span className="font-semibold text-white text-right">
                    {invoice.toot ? `${invoice.toot} тоот` : "Тодорхойгүй"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 text-sm py-1 border-b border-white/5">
                  <span className="text-slate-400 shrink-0">Нэхэмжлэхийн дугаар</span>
                  <span className="font-semibold text-white text-right font-mono">
                    {invoice.nekhemjlekhiinDugaar}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 text-sm py-1">
                  <span className="text-slate-400 shrink-0">Төлсөн огноо</span>
                  <span className="font-semibold text-white text-right">
                    {formatDate(new Date().toISOString())}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-slate-500 text-xs py-2">
                  Нийт төлсөн дүн:
                </div>
                <div className="text-3xl font-black text-white bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  {formatAmount(invoice.niitTulbur)}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Баримттай холбоотой лавлах зүйл байвал сөх-тэй холбогдоно уу.
              </p>
            </motion.div>
          ) : (
            /* UNPAID / BILL SELECT STATE SCREEN */
            <motion.div
              key="unpaid-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl bg-slate-900/60 border border-white/5 shadow-2xl space-y-6"
            >
              {/* Header section with amount */}
              <div className="text-center space-y-2 pb-2">
                <span className="text-xs text-slate-400 uppercase tracking-widest">{actualIsPaid ? 'Төлсөн нийт дүн' : 'Төлөх нийт дүн'}</span>
                <h2 className="text-4xl font-black text-white tracking-tight">
                  {formatAmount(displayAmount)}
                </h2>
                {actualIsPaid ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Төлбөр төлөгдсөн
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Төлбөр хүлээгдэж байна
                  </div>
                )}
              </div>

              {/* Invoice breakdown details */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs sm:text-sm space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                  <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Building className="w-3.5 h-3.5 text-slate-500" /> СӨХ-ийн нэр
                  </span>
                  <span className="font-semibold text-white sm:text-right break-words sm:max-w-[65%]">
                    {invoice.baiguullagiinNer}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                  <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" /> Оршин суугч
                  </span>
                  <span className="font-semibold text-white sm:text-right break-words sm:max-w-[65%]">
                    {invoice.ner || "Тодорхойгүй"}
                  </span>
                </div>
                {invoice.toot && (
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                      <Hash className="w-3.5 h-3.5 text-slate-500" /> Тоот
                    </span>
                    <span className="font-semibold text-white text-right">
                      {invoice.toot} тоот
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Hash className="w-3.5 h-3.5 text-slate-500" /> Нэхэмжлэх №
                  </span>
                  <span className="font-semibold text-white text-right font-mono">
                    {invoice.nekhemjlekhiinDugaar}
                  </span>
                </div>
                {invoice.ognoo && (
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Огноо
                    </span>
                    <span className="font-semibold text-white text-right">
                      {formatDate(invoice.ognoo)}
                    </span>
                  </div>
                )}
              </div>

              {/* Selector Tabs (Deep Link vs QR Code) */}
              <div className="flex p-1 rounded-full bg-white/[0.03] border border-white/5">
                <button
                  onClick={() => setActiveTab("deeplink")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === "deeplink"
                    ? "bg-[#10b981] text-white shadow-lg shadow-[#10b981]/15"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Банкны Апп
                </button>
                <button
                  onClick={() => setActiveTab("qrcode")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === "qrcode"
                    ? "bg-[#10b981] text-white shadow-lg shadow-[#10b981]/15"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  <QrCode className="w-4 h-4" />
                  QR Код
                </button>
              </div>

              {/* Dynamic View container */}
              <div className="min-h-[250px]">
                {activeTab === "deeplink" ? (
                  /* DEEP LINKS LIST (FOR MOBILE DIRECT LAUNCH) */
                  <div className="space-y-4">
                    <div className="text-center py-1 text-slate-400 text-xs">
                      Та өөрийн ашигладаг банкны аппликейшнийг сонгон төлбөрөө төлнө үү.
                    </div>
                    {invoice.qpayUrls && invoice.qpayUrls.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {invoice.qpayUrls.map((bank: any) => (
                          <a
                            href={bank.link}
                            key={bank.name}
                            className="relative flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.1] border border-white/5 hover:border-white/10 transition-all group overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {bank.logo ? (
                              <img
                                src={bank.logo}
                                alt={bank.name}
                                className="w-8 h-8 rounded-xl object-contain shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {bank.name?.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                {bank.description || bank.name}
                              </div>
                              <span className="text-[9px] text-slate-500 block">
                                Нээх
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <AlertTriangle className="w-8 h-8 text-amber-400 opacity-60" />
                        <div className="text-xs text-slate-400 px-4">
                          Банкны апп холбоос олдсонгүй. Баруун талын &quot;QR Код&quot; сонголтыг ашиглан төлнө үү.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* QR CODE DISPLAY (FOR SCANNING) */
                  <div className="flex flex-col items-center space-y-6 py-2">
                    <div className="text-center text-slate-400 text-xs max-w-sm">
                      Гар утасныхаа банкны апп-ын QR уншуулагчаар доорх кодыг уншуулна уу.
                    </div>

                    {invoice.qpayUrl ? (
                      <div className="relative p-5 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                        {invoice.qpayUrl.startsWith("data:image/") || invoice.qpayUrl.length > 500 ? (
                          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                            <img
                              src={invoice.qpayUrl.startsWith("data:image/") ? invoice.qpayUrl : `data:image/png;base64,${invoice.qpayUrl}`}
                              alt="QPay QR Code"
                              className="w-36 h-36 sm:w-44 sm:h-44 object-contain"
                            />
                            {/* Overlay Amarhome logo in center */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border-2 border-white flex items-center justify-center shadow-lg p-0.5">
                              <img src="/Main.png" alt="Amarhome Logo" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                            <QRCodeSVG
                              value={invoice.qpayUrl}
                              size={144}
                              bgColor="#ffffff"
                              fgColor="#09090b"
                              level="M"
                              className="w-36 h-36 sm:w-44 sm:h-44"
                            />
                            {/* Overlay Amarhome logo in center */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border-2 border-white flex items-center justify-center shadow-lg p-0.5">
                              <img src="/Main.png" alt="Amarhome Logo" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-44 h-44 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-slate-500" />
                        <span className="text-[10px] text-slate-400">QR код олдсонгүй</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status footer spinner */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 border-t border-white/5 pt-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                <span>Төлбөрийг автоматаар шалгаж байна...</span>
                {isValidating && <RefreshCw className="w-3 h-3 animate-spin text-slate-600" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-slate-600 mt-6 tracking-wide">
          ЗЭВТАБС © Amarhome Төлбөрийн Систем
        </p>
      </div>
    </div>
  );
}
