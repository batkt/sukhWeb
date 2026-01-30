"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useModalHotkeys } from "@/lib/useModalHotkeys";

interface HistoryModalProps {
  show: boolean;
  onClose: () => void;
  contract: any;
  token: string | null;
  baiguullagiinId: string | null;
  barilgiinId?: string | null;
}

interface LedgerEntry {
  ognoo: string;
  ajiltan?: string;
  turees: number;
  tulukhDun: number;
  khyamdral: number;
  tulsunDun: number;
  uldegdel: number;
  khelber: string;
  tailbar: string;
  burtgesenOgnoo: string;
  _id?: string;
}

export default function HistoryModal({
  show,
  onClose,
  contract,
  token,
  baiguullagiinId,
  barilgiinId,
}: HistoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LedgerEntry[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null] | undefined>([null, null]);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  const fetchData = async () => {
    if (!token || !baiguullagiinId || !contract) return;

    setLoading(true);
    try {
      const resp = await uilchilgee(token).get("/nekhemjlekhiinTuukh", {
        params: {
          baiguullagiinId,
          barilgiinId: barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 2000,
        },
      });

      const rawList = Array.isArray(resp.data?.jagsaalt)
        ? resp.data.jagsaalt
        : Array.isArray(resp.data)
        ? resp.data
        : [];

      // Extract all possible identifiers from the contract/resident object
      const contractId = String(contract?._id || "").trim();
      const residentId = String(contract?.orshinSuugchId || contract?._id || "").trim();
      const gereeniiId = String(contract?.gereeniiId || "").trim();
      const gereeDugaar = String(contract?.gereeniiDugaar || "").trim();
      const toot = String(contract?.toot || "").trim();
      const ner = String(contract?.ner || "").trim().toLowerCase();
      const ovog = String(contract?.ovog || "").trim().toLowerCase();
      const utas = (() => {
        if (Array.isArray(contract?.utas) && contract.utas.length > 0) {
          return String(contract.utas[0] || "").trim();
        }
        return String(contract?.utas || "").trim();
      })();

      console.log("🔍 Filtering history for:", { contractId, residentId, gereeniiId, gereeDugaar, toot, ner, ovog, utas });

      // Filter for this specific contract/resident using multiple strategies
      const contractItems = rawList.filter((item: any) => {
        // Strategy 1: Match by orshinSuugchId
        const itemResidentId = String(item?.orshinSuugchId || "").trim();
        if (residentId && itemResidentId && itemResidentId === residentId) {
          return true;
        }

        // Strategy 2: Match by gereeniiId
        const itemGereeId = String(item?.gereeniiId || "").trim();
        if (gereeniiId && itemGereeId && itemGereeId === gereeniiId) {
          return true;
        }

        // Strategy 3: Match by gereeniiDugaar
        const itemGereeDugaar = String(item?.gereeniiDugaar || "").trim();
        if (gereeDugaar && itemGereeDugaar && itemGereeDugaar === gereeDugaar) {
          return true;
        }

        // Strategy 4: Match by toot + ner (both must match)
        if (toot && ner) {
          const itemToot = String(item?.toot || item?.medeelel?.toot || "").trim();
          const itemNer = String(item?.ner || "").trim().toLowerCase();
          if (itemToot === toot && itemNer === ner) {
            return true;
          }
        }

        // Strategy 5: Match by phone number (if 8+ digits)
        if (utas && utas.length >= 8) {
          const itemUtas = (() => {
            if (Array.isArray(item?.utas) && item.utas.length > 0) {
              return String(item.utas[0] || "").trim();
            }
            return String(item?.utas || "").trim();
          })();
          if (itemUtas === utas) {
            return true;
          }
        }

        // Strategy 6: Match by ovog + ner (both must match)
        if (ovog && ner) {
          const itemOvog = String(item?.ovog || "").trim().toLowerCase();
          const itemNer = String(item?.ner || "").trim().toLowerCase();
          if (itemOvog === ovog && itemNer === ner) {
            return true;
          }
        }

        return false;
      });

      console.log("📊 Filter result:", { totalItems: rawList.length, matchedItems: contractItems.length });
      
      // Log first item for debugging
      if (contractItems.length > 0) {
        console.log("📋 Sample item structure:", JSON.stringify(contractItems[0], null, 2));
      }

      const ledger: LedgerEntry[] = contractItems.map((item: any) => {
        // Try multiple field locations for payment amounts
        // Check medeelel.zardluud for expense items
        const zardluud = Array.isArray(item?.medeelel?.zardluud) ? item.medeelel.zardluud : 
                         Array.isArray(item?.zardluud) ? item.zardluud : [];
        const guilgeenuud = Array.isArray(item?.medeelel?.guilgeenuud) ? item.medeelel.guilgeenuud :
                           Array.isArray(item?.guilgeenuud) ? item.guilgeenuud : [];
        
        // Calculate total from zardluud/guilgeenuud if main amount is 0
        let calculatedTotal = 0;
        [...zardluud, ...guilgeenuud].forEach((z: any) => {
          calculatedTotal += Number(z?.tariff ?? z?.dun ?? z?.tulukhDun ?? 0);
        });
        
        // Add ekhniiUldegdel if present
        const ekhniiUldegdel = Number(item?.medeelel?.ekhniiUldegdel ?? item?.ekhniiUldegdel ?? 0);
        
        // Get the total amount from multiple possible sources
        const niitTulbur = Number(item?.niitTulbur ?? item?.tulbur ?? item?.niitDun ?? item?.total ?? 0) || 
                          (calculatedTotal + ekhniiUldegdel);
        
        // Calculate tulsunDun from guilgeenuud if available
        let calculatedTulsun = 0;
        guilgeenuud.forEach((g: any) => {
          calculatedTulsun += Number(g?.tulsunDun ?? 0);
        });
        
        const isPaid = item.tuluv === "Төлсөн" || item.tuluv === "paid";
        const tulsun = isPaid ? niitTulbur : (Number(item?.tulsunDun ?? item?.medeelel?.tulsunDun ?? 0) || calculatedTulsun);
        
        // Calculate uldegdel (balance) = tulukhDun - tulsunDun
        // If item.uldegdel is 0, calculate it ourselves
        const itemUldegdel = Number(item?.uldegdel ?? item?.medeelel?.uldegdel ?? 0);
        const uldegdel = itemUldegdel !== 0 ? itemUldegdel : (niitTulbur - tulsun);
        
        return {
          _id: item._id,
          ognoo: item.ognoo || item.nekhemjlekhiinOgnoo || item.createdAt || "-",
          ajiltan: item.createdBy?.ner || item.ajiltan || item.guilgeeKhiisenAjiltniiNer || item.maililgeesenAjiltniiNer || "Admin",
          turees: Number(item.turees ?? item.medeelel?.turees ?? 0),
          tulukhDun: niitTulbur,
          khyamdral: Number(item.khyamdral ?? item.medeelel?.khyamdral ?? 0),
          tulsunDun: tulsun,
          uldegdel: uldegdel,
          khelber: item.khelber || item.tuluv || "-",
          tailbar: item.tailbar || item.medeelel?.tailbar || "-",
          burtgesenOgnoo: item.createdAt || item.ognoo || "-",
        };
      });

      // Sort newest first
      ledger.sort((a, b) => new Date(b.ognoo).getTime() - new Date(a.ognoo).getTime());

      setData(ledger);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && contract) {
      setData([]);
      fetchData();
    }
  }, [show, contract]);

  const filteredData = useMemo(() => {
    if (!dateRange || (!dateRange[0] && !dateRange[1])) return data;
    const [start, end] = dateRange;
    const s = start ? new Date(start).getTime() : -Infinity;
    const e = end ? new Date(end).getTime() : Infinity;
    return data.filter((item) => {
      const d = new Date(item.ognoo).getTime();
      return d >= s && d <= e;
    });
  }, [data, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-[1200px] min-h-[70vh] max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                  Түүх
                </h2>
                <div className="text-xs text-slate-400">
                  {contract?.ovog} {contract?.ner} • {data.length} бичлэг
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info Cards - Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { label: "Гэрээ", value: contract?.gereeniiDugaar || "-" },
                { label: "Тоот", value: contract?.toot || "-" },
                { label: "Нэр", value: contract?.ner || "-" },
                { label: "Утас", value: Array.isArray(contract?.utas) ? contract.utas[0] : contract?.utas || "-" },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Date Filter - Compact */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-full sm:w-[220px]">
                <DatePickerInput
                  type="range"
                  locale="mn"
                  value={dateRange}
                  onChange={setDateRange}
                  size="xs"
                  radius="lg"
                  variant="filled"
                  placeholder="Огноо"
                  classNames={{
                    input: "bg-slate-100 dark:bg-slate-800/50 border-none h-8 text-xs font-medium",
                  }}
                />
              </div>
              {(dateRange?.[0] || dateRange?.[1]) && (
                <button 
                  onClick={() => setDateRange([null, null])}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Арилгах
                </button>
              )}
            </div>
          </div>

          {/* Table Section - Scrollable */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-white dark:bg-[#0f172a]">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 px-2 text-left text-[9px] font-bold text-slate-400 uppercase">Огноо</th>
                  <th className="py-2 px-2 text-left text-[9px] font-bold text-slate-400 uppercase hidden sm:table-cell">Ажилтан</th>
                  <th className="py-2 px-2 text-right text-[9px] font-bold text-slate-400 uppercase">Төлөх</th>
                  <th className="py-2 px-2 text-right text-[9px] font-bold text-slate-400 uppercase">Төлсөн</th>
                  <th className="py-2 px-2 text-right text-[9px] font-bold text-slate-400 uppercase hidden sm:table-cell">Үлдэгдэл</th>
                  <th className="py-2 px-2 text-center text-[9px] font-bold text-slate-400 uppercase">Төлөв</th>
                  <th className="py-2 px-2 text-left text-[9px] font-bold text-slate-400 uppercase hidden md:table-cell">Тайлбар</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="py-3 px-2">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <span className="text-slate-400 text-xs">Мэдээлэл олдсонгүй</span>
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredData.map((row, idx) => (
                      <tr 
                        key={row._id || idx} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {row.ognoo.split("T")[0].replace(/-/g, ".")}
                        </td>
                        <td className="py-2 px-2 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                          {row.ajiltan}
                        </td>
                        <td className="py-2 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                          {formatNumber(row.tulukhDun)}
                        </td>
                        <td className="py-2 px-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                          {formatNumber(row.tulsunDun)}
                        </td>
                        <td className="py-2 px-2 text-xs font-bold text-rose-500 dark:text-rose-400 text-right whitespace-nowrap hidden sm:table-cell">
                          {formatNumber(row.uldegdel)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            row.khelber === "Төлсөн" || row.khelber === "paid" 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {row.khelber}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell max-w-[150px] truncate" title={row.tailbar}>
                          {row.tailbar !== "-" ? row.tailbar : ""}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-100 dark:bg-slate-800/50 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="py-2 px-2 text-xs font-bold text-slate-700 dark:text-slate-200">Нийт</td>
                      <td className="py-2 px-2 hidden sm:table-cell"></td>
                      <td className="py-2 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 text-right whitespace-nowrap">
                        {formatNumber(filteredData.reduce((sum, row) => sum + row.tulukhDun, 0))}
                      </td>
                      <td className="py-2 px-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 text-right whitespace-nowrap">
                        {formatNumber(filteredData.reduce((sum, row) => sum + row.tulsunDun, 0))}
                      </td>
                      <td className="py-2 px-2 text-xs font-bold text-rose-600 dark:text-rose-400 text-right whitespace-nowrap hidden sm:table-cell">
                        {formatNumber(filteredData.reduce((sum, row) => sum + row.uldegdel, 0))}
                      </td>
                      <td className="py-2 px-2"></td>
                      <td className="py-2 px-2 hidden md:table-cell"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer - Compact */}
          <div className="p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all"
            >
              Хаах
            </button>
            <button
              onClick={handlePrint}
              className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all"
            >
              Хэвлэх
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
