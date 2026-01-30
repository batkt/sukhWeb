"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Banknote, Landmark, Tag, ArrowRight, Check, Delete } from "lucide-react";
import { type Uilchluulegch } from "@/lib/useParkingSocket";
import formatNumber from "../../../../tools/function/formatNumber";

interface PaymentModalProps {
  transaction: Uilchluulegch;
  onClose: () => void;
  onConfirm?: (amount: number, method: string) => void;
}

export default function PaymentModal({ transaction, onClose, onConfirm }: PaymentModalProps) {
  const [amountString, setAmountString] = useState(transaction.niitDun ? transaction.niitDun.toString() : "0");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  const amount = parseInt(amountString) || 0;
  const totalAmount = transaction.niitDun || 0;
  const remaining = Math.max(0, totalAmount - amount); // Logic might be reversed compared to screenshot context (screenshot shows inputting payment amount)
  // Actually, usually in POS, you enter the amount TENDERED or the amount TO PAY.
  // The screenshot shows "Input: 10,000.00", "Total: 10,000.00", "Remaining: 0.00".
  // This suggests the input is the amount being paid.

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "F4") handleSave();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [amountString, paymentMethod]);

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

  const handleSave = () => {
    // Implement save logic
    console.log("Saving payment:", { amount, paymentMethod, transactionId: transaction._id });
    if (onConfirm) onConfirm(amount, paymentMethod);
    // onClose(); // Ideally close after success
  };

  const paymentMethods = [
    { id: "cash", label: "Бэлэн", icon: <Banknote className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-white" },
    { id: "card", label: "Карт", icon: <CreditCard className="w-5 h-5" />, color: "text-teal-600", bg: "bg-white" },
    { id: "transfer", label: "Дансаар", icon: <ArrowRight className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-white" },
    { id: "discount", label: "Хөнгөлөлт", icon: <Tag className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-white" },
  ];

  const apps = [
    { id: "qpay", label: "QPay", color: "bg-[#003366] text-white", icon: "Q" }, // QPay logo placeholder
    { id: "toki", label: "Toki", color: "bg-[#FFCC00] text-black", icon: "Toki" }, // Toki logo placeholder
    { id: "socialpay", label: "SocialPay", color: "bg-[#00D18B] text-white", icon: "P" }, // SocialPay logo placeholder
  ];

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
                <div className="space-y-8">
                    {/* Main Types */}
                    <div className="grid grid-cols-2 gap-4">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex items-center gap-3 p-4 rounded-2xl shadow-sm border transition-all duration-200 ${paymentMethod === method.id ? 'border-theme ring-2 ring-theme/20 bg-theme/5 scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:shadow-md bg-white'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.id === 'cash' ? 'bg-emerald-100 text-emerald-600' : method.id === 'card' ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {method.icon}
                                </div>
                                <span className="font-bold text-slate-700 dark:text-gray-200">{method.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* App Payments */}
                    <div className="flex gap-4">
                        {apps.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => setPaymentMethod(app.id)}
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform ${app.color} ${paymentMethod === app.id ? 'ring-4 ring-offset-2 ring-blue-500' : ''}`}
                            >
                                <span className="font-black text-lg">{app.icon}</span>
                            </button>
                        ))}
                    </div>

                    {/* Quick Amounts */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Бэлэн мөнгө</p>
                        <div className="grid grid-cols-1 gap-3">
                             {[20000, 10000, 5000, 1000, 500].map(val => (
                                 <button
                                    key={val}
                                    onClick={() => handleQuickAmount(val)}
                                    className="w-full py-3 rounded-xl border border-gray-200 font-bold text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                 >
                                    {formatNumber(val)}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Keypad & Input */}
                <div className="flex flex-col gap-6">
                    {/* Amount Display */}
                    <div className="flex justify-center mb-4">
                        <div className="text-4xl font-black text-emerald-500 tracking-tight">
                            {formatNumber(amount)}.00₮
                        </div>
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-3 flex-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleDigit(num.toString())}
                                className="h-16 rounded-2xl border border-gray-200 bg-white font-black text-2xl text-slate-700 hover:bg-gray-50 hover:shadow-sm active:scale-95 transition-all"
                            >
                                {num}
                            </button>
                        ))}
                         <button
                            onClick={handleClear}
                            className="h-16 rounded-2xl border border-orange-200 bg-orange-50 font-black text-xl text-orange-500 hover:bg-orange-100 active:scale-95 transition-all"
                        >
                            C
                        </button>
                        <button
                            onClick={() => handleDigit("0")}
                            className="h-16 rounded-2xl border border-gray-200 bg-white font-black text-2xl text-slate-700 hover:bg-gray-50 hover:shadow-sm active:scale-95 transition-all"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            className="h-16 rounded-2xl border border-red-200 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
                        >
                            <Delete className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Summary Card */}
                    <div className="p-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-50/50 space-y-2 mt-4">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                            <span>Нийт дүн:</span>
                            <span className="text-slate-700">{formatNumber(totalAmount)}₮</span>
                        </div>
                         <div className="flex justify-between items-center text-sm font-black text-emerald-600 uppercase">
                            <span>Дутуу:</span>
                            <span>{formatNumber(Math.max(0, totalAmount - amount))}₮</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button 
                            onClick={onClose}
                            className="py-3 rounded-xl border border-red-200 text-red-500 font-bold uppercase text-xs hover:bg-red-50 transition-colors"
                        >
                            Цуцлах [ESC]
                        </button>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={handleSave}
                                className="py-3 rounded-xl border border-emerald-500 text-emerald-600 font-bold uppercase text-xs hover:bg-emerald-50 transition-colors"
                            >
                                Шууд хадгалах [F4]
                            </button>
                            <button onClick={handleSave} className="py-3 rounded-xl bg-emerald-500 text-white font-bold uppercase text-xs hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
                                Хадгалах
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
