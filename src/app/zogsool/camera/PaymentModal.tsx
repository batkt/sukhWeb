"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Banknote, Landmark, Tag, ArrowRight, Check, Delete } from "lucide-react";
import { type Uilchluulegch } from "@/lib/useParkingSocket";
import formatNumber from "../../../../tools/function/formatNumber";
import { socket } from "@/lib/uilchilgee";

interface PaymentModalProps {
  transaction: Uilchluulegch;
  onClose: () => void;
  onConfirm?: (amount: number, method: string, extraData?: any) => void;
}

export default function PaymentModal({ transaction, onClose, onConfirm }: PaymentModalProps) {
  const [amountString, setAmountString] = useState(transaction.niitDun ? transaction.niitDun.toString() : "0");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [ebarimtType, setEbarimtType] = useState<"1" | "3">("1"); // 1: Human, 3: Org
  const [register, setRegister] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [qpayData, setQpayData] = useState<any>(null);

  const amount = parseInt(amountString) || 0;
  const totalAmount = transaction.niitDun || 0;
  const remaining = Math.max(0, totalAmount - amount); 

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "F4") handleSave();
      if (e.key === "F7") {
          if (onConfirm) onConfirm(0, "cash", { ebarimt: { type: ebarimtType, register: ebarimtType === "3" ? register : undefined } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [amountString, paymentMethod, ebarimtType, register, isProcessing]);

  // QPay Socket Listener (payment.md section 2.C)
  useEffect(() => {
    if (paymentMethod === "qpay" && transaction?._id) {
       const s = socket();
       const eventName = `qpay/${transaction.baiguullagiinId}/${transaction._id}`;
       
       const handleQPaySuccess = (data: any) => {
          console.log("QPay success via socket:", data);
          if (onConfirm) onConfirm(amount, "qpay", { ebarimt: { type: ebarimtType, register: ebarimtType === "3" ? register : undefined } });
       };

       s.on(eventName, handleQPaySuccess);
       return () => {
          s.off(eventName, handleQPaySuccess);
       };
    }
  }, [paymentMethod, transaction, amount, ebarimtType, register]);

  // Fetch QPay QR (payment.md section 2.C)
  useEffect(() => {
    if (paymentMethod === "qpay" && transaction?._id) {
       const fetchQR = async () => {
          try {
             const resp = await fetch(`https://amarhome.mn/api/payment/qpay?id=${transaction._id}&amount=${amount}`);
             const data = await resp.json();
             if (data.qr_image || data.qrData) {
                setQpayData(data);
             }
          } catch (err) {
             console.error("QPay QR fetch error:", err);
          }
       };
       fetchQR();
    } else {
       setQpayData(null);
    }
  }, [paymentMethod, transaction, amount]);

  const handleDigit = (digit: string) => {
    setAmountString((prev) => {
      if (prev === "0") return digit;
      if (prev.length > 8) return prev; // limit length
      return prev + digit;
    });
  };

  const handleBackspace = () => {
    setAmountString((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setAmountString("0");
  };

  const handleQuickAmount = (val: number) => {
    setAmountString(val.toString());
  };

  const handleSave = async () => {
    if (isProcessing) return;
    
    // Bank Terminal Integration (payment.md section 2.B)
    if (paymentMethod === "khaan") {
       setIsProcessing(true);
       try {
          const terminalResp = await fetch("http://127.0.0.1:27028", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                service_name: "doSaleTransaction",
                amount: amount.toString()
             })
          });
          const data = await terminalResp.json();
          if (data.response_code !== "000") {
             alert("Терминалын алдаа: " + (data.response_msg || "Амжилтгүй"));
             setIsProcessing(false);
             return;
          }
       } catch (err) {
          alert("Терминалын сервис холбогдоогүй байна (127.0.0.1:27028)");
          setIsProcessing(false);
          return;
       }
    }

    // Prepare payment data with E-Barimt (payment.md section 3)
    const extraData = {
       ebarimt: {
          type: ebarimtType,
          register: ebarimtType === "3" ? register : undefined
       }
    };

    if (onConfirm) onConfirm(amount, paymentMethod, extraData);
  };

  const paymentMethods = [
    { id: "cash", label: "Бэлэн", icon: <Banknote className="w-5 h-5" /> },
    { id: "khaan", label: "Карт", icon: <CreditCard className="w-5 h-5" /> },
    { id: "transfer", label: "Дансаар", icon: <ArrowRight className="w-5 h-5" /> },
    { id: "discount", label: "Хөнгөлөлт", icon: <Tag className="w-5 h-5" /> },
  ];

  /* Apps section removed as requested */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Тооцоо хийх</h2>
          <div className="flex items-center gap-4">
             <span className="text-xl font-black text-slate-800 dark:text-gray-200 uppercase">{transaction.mashiniiDugaar}</span>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
               <X className="w-6 h-6 text-gray-400" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                {/* Left Side: Payment Methods */}
                <div className="space-y-6">
                    {/* Main Types */}
                    <div className="grid grid-cols-2 gap-4">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex items-center gap-3 p-4 rounded-2xl shadow-sm border transition-all duration-200 ${paymentMethod === method.id ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:shadow-md bg-white'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.id === 'cash' ? 'bg-emerald-100 text-emerald-600' : method.id === 'khaan' ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {method.icon}
                                </div>
                                <span className="font-bold text-slate-700 dark:text-gray-200 text-sm whitespace-nowrap">{method.label}</span>
                            </button>
                        ))}
                    </div>



                    {/* E-Barimt Selection */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">И-Баримт төрөл</span>
                            <div className="flex p-0.5 bg-gray-200 rounded-lg">
                                <button 
                                    onClick={() => setEbarimtType("1")}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${ebarimtType === "1" ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                >
                                    Хувь хүн
                                </button>
                                <button 
                                    onClick={() => setEbarimtType("3")}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${ebarimtType === "3" ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                >
                                    Байгууллага
                                </button>
                            </div>
                         </div>
                         {ebarimtType === "3" && (
                             <input 
                                type="text"
                                placeholder="Байгууллагын регистер"
                                value={register}
                                onChange={(e) => setRegister(e.target.value)}
                                className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                             />
                         )}
                    </div>

                    {/* Quick Amounts */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Бэлэн мөнгө</p>
                        <div className="grid grid-cols-2 gap-2">
                             {[20000, 10000, 5000, 1000].map(val => (
                                 <button
                                    key={val}
                                    onClick={() => handleQuickAmount(val)}
                                    className="py-2.5 rounded-xl border border-gray-200 font-bold text-slate-600 hover:bg-gray-50 transition-colors text-sm"
                                 >
                                    {formatNumber(val)}₮
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* QPay QR Display (payment.md section 2.C) */}
                    {paymentMethod === "qpay" && qpayData && (
                        <div className="flex flex-col items-center justify-center p-6 bg-blue-50/30 rounded-3xl border-2 border-dashed border-blue-200 mt-2">
                             <img 
                                src={qpayData.qr_image || `data:image/png;base64,${qpayData.qrData}`} 
                                alt="QPay QR"
                                className="w-40 h-40 mb-3 border rounded-xl overflow-hidden shadow-sm bg-white"
                             />
                             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse text-center leading-relaxed">Утсаараа эсвэл банкаараа<br/>уншуулж төлнө үү</p>
                        </div>
                    )}
                </div>

                {/* Right Side: Keypad & Input */}
                <div className="flex flex-col gap-6">
                    {/* Amount Display */}
                    <div className="flex justify-center mb-2">
                        <div className="text-4xl font-black text-emerald-500 tracking-tight">
                            {formatNumber(amount)}₮
                        </div>
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-3 flex-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleDigit(num.toString())}
                                className="h-14 rounded-2xl border border-gray-200 bg-white font-black text-2xl text-slate-700 hover:bg-gray-50 hover:shadow-sm active:scale-95 transition-all"
                            >
                                {num}
                            </button>
                        ))}
                         <button
                            onClick={handleClear}
                            className="h-14 rounded-2xl border border-orange-200 bg-orange-50 font-black text-xl text-orange-500 hover:bg-orange-100 active:scale-95 transition-all"
                        >
                            C
                        </button>
                        <button
                            onClick={() => handleDigit("0")}
                            className="h-14 rounded-2xl border border-gray-200 bg-white font-black text-2xl text-slate-700 hover:bg-gray-50 hover:shadow-sm active:scale-95 transition-all"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            className="h-14 rounded-2xl border border-red-200 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
                        >
                            <Delete className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Summary Card */}
                    <div className="p-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-50/50 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                            <span>Нийт дүн:</span>
                            <span className="text-slate-700 font-bold">{formatNumber(totalAmount)}₮</span>
                        </div>
                         <div className="flex justify-between items-center text-sm font-black text-emerald-600 uppercase">
                            <span>Дутуу:</span>
                            <span>{formatNumber(Math.max(0, totalAmount - amount))}₮</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button 
                            onClick={async () => {
                                // "Free" logic: set amount to 0, use 'cash' (or special method if backend supports), and confirm
                                if (onConfirm) onConfirm(0, "cash", { ebarimt: { type: ebarimtType, register: ebarimtType === "3" ? register : undefined } });
                            }}
                            disabled={isProcessing}
                            className="py-3 rounded-xl border border-amber-200 text-amber-600 font-bold uppercase text-[10px] hover:bg-amber-50 transition-colors disabled:opacity-50"
                        >
                            Үнэгүй [F7]
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isProcessing}
                            className="py-3 rounded-xl bg-emerald-500 text-white font-bold uppercase text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                        >
                            {isProcessing ? "Уншиж байна..." : "Төлөх [F4]"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
