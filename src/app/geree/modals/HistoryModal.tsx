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
  onRefresh?: () => void;
}

interface LedgerEntry {
  ognoo: string;
  ner: string;
  tulukhDun: number;
  tulsunDun: number;
  uldegdel: number;
  isSystem: boolean;
  ajiltan?: string;
  khelber?: string;
  tailbar?: string;
  burtgesenOgnoo?: string;
  _id?: string;
  parentInvoiceId?: string;
  sourceCollection?: "nekhemjlekhiinTuukh" | "gereeniiTulsunAvlaga" | "gereeniiTulukhAvlaga";
}

export default function HistoryModal({
  show,
  onClose,
  contract,
  token,
  baiguullagiinId,
  barilgiinId,
  onRefresh,
}: HistoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LedgerEntry[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null] | undefined>([null, null]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; type: string }>({ show: false, id: "", type: "" });
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  const fetchData = async () => {
    if (!token || !baiguullagiinId || !contract) return;

    const contractIdToFetch = contract?.gereeniiId || contract?._id;

    // Silent Auto-Sync: Recalculate global balance on backend before fetching
    if (contractIdToFetch) {
      try {
        uilchilgee(token || undefined).post("/nekhemjlekh/recalculate-balance", {
          gereeId: contractIdToFetch,
          baiguullagiinId
        }).catch(e => console.warn("Silent sync failed:", e.message));
      } catch (e) { }
    }

    setLoading(true);
    try {
      const commonParams = {
        baiguullagiinId: baiguullagiinId || undefined,
        barilgiinId: barilgiinId || null,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 5000,
      };


      // Fetch all necessary data concurrently
      const [historyResp, paymentResp, receivableResp, contractResp] = await Promise.all([
        uilchilgee(token || undefined).get("/nekhemjlekhiinTuukh", {
          params: {
            ...commonParams,
            query: {
              baiguullagiinId: baiguullagiinId || undefined,
            },
            _t: Date.now(),
          },
        }),
        uilchilgee(token || undefined).get("/gereeniiTulsunAvlaga", {
          params: {
            ...commonParams,
            _t: Date.now(),
          },
        }),
        uilchilgee(token || undefined).get("/gereeniiTulukhAvlaga", {
          params: {
            ...commonParams,
            _t: Date.now(),
          },
        }),
        // Fetch fresh contract data to get the authoritative balance
        contractIdToFetch ? uilchilgee(token || undefined).get(`/geree/${contractIdToFetch}`, {
          params: { _t: Date.now() }
        }).catch(err => { console.warn("Failed to fetch fresh contract:", err); return { data: null }; })
          : Promise.resolve({ data: null })
      ]);

      const rawList = Array.isArray(historyResp.data?.jagsaalt) ? historyResp.data.jagsaalt : [];
      const paymentRecords = Array.isArray(paymentResp.data?.jagsaalt) ? paymentResp.data.jagsaalt : [];
      const receivableRecords = Array.isArray(receivableResp.data?.jagsaalt) ? receivableResp.data.jagsaalt : [];
      const freshContract = contractResp?.data;

      console.log(`🔍 [HistoryModal] Fetched: ${rawList.length} invoices, ${paymentRecords.length} payments, ${receivableRecords.length} receivables. Fresh Contract Balance: ${freshContract?.uldegdel}`);

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
      // When gereeniiId is available, REQUIRE it to match - otherwise we'd pull in invoices
      // from other contracts (same resident, different apartment) and double-count charges
      const contractItems = rawList.filter((item: any) => {
        const itemGereeId = String(item?.gereeniiId || "").trim();
        const itemGereeDugaar = String(item?.gereeniiDugaar || "").trim();

        // If we have gereeniiId, require it to match - strict contract scoping
        if (gereeniiId && itemGereeId && itemGereeId === gereeniiId) {
          return true;
        }
        // If we have gereeDugaar but no gereeniiId, use dugaar
        if (gereeDugaar && itemGereeDugaar && itemGereeDugaar === gereeDugaar) {
          return true;
        }
        // Fallback: when no gereeniiId/gereeDugaar, use other strategies
        if (!gereeniiId && !gereeDugaar) {
          const itemResidentId = String(item?.orshinSuugchId || "").trim();
          if (residentId && itemResidentId && itemResidentId === residentId) return true;
          if (toot && ner) {
            const itemToot = String(item?.toot || item?.medeelel?.toot || "").trim();
            const itemNer = String(item?.ner || "").trim().toLowerCase();
            if (itemToot === toot && itemNer === ner) return true;
          }
          if (utas && utas.length >= 8) {
            const itemUtas = Array.isArray(item?.utas) && item.utas.length > 0
              ? String(item.utas[0] || "").trim() : String(item?.utas || "").trim();
            if (itemUtas === utas) return true;
          }
          if (ovog && ner) {
            const itemOvog = String(item?.ovog || "").trim().toLowerCase();
            const itemNer2 = String(item?.ner || "").trim().toLowerCase();
            if (itemOvog === ovog && itemNer2 === ner) return true;
          }
        }
        return false;
      });

      // Filter payment records for this contract (require gereeniiId when available)
      const matchedPayments = paymentRecords.filter((rec: any) => {
        const recGereeId = String(rec?.gereeniiId || "").trim();
        const recOrshinSuugchId = String(rec?.orshinSuugchId || "").trim();
        const recGereeDugaar = String(rec?.gereeniiDugaar || "").trim();
        if (gereeniiId && recGereeId && recGereeId === gereeniiId) return true;
        if (gereeDugaar && recGereeDugaar && recGereeDugaar === gereeDugaar) return true;
        if (!gereeniiId && !gereeDugaar && residentId && recOrshinSuugchId && recOrshinSuugchId === residentId) return true;
        return false;
      });

      // Filter receivable records for this contract (require gereeniiId when available)
      const matchedReceivables = receivableRecords.filter((rec: any) => {
        const recGereeId = String(rec?.gereeniiId || "").trim();
        const recOrshinSuugchId = String(rec?.orshinSuugchId || "").trim();
        const recGereeDugaar = String(rec?.gereeniiDugaar || "").trim();
        if (gereeniiId && recGereeId && recGereeId === gereeniiId) return true;
        if (gereeDugaar && recGereeDugaar && recGereeDugaar === gereeDugaar) return true;
        if (!gereeniiId && !gereeDugaar && residentId && recOrshinSuugchId && recOrshinSuugchId === residentId) return true;
        return false;
      });

      console.log("📊 Filter result:", {
        totalInvoices: rawList.length,
        matchedInvoices: contractItems.length,
        matchedPayments: matchedPayments.length,
        matchedReceivables: matchedReceivables.length
      });

      // Deduplicate invoices: when multiple invoices exist for same contract + same month, keep only one
      // to avoid double-counting charges (374k instead of 309k) and duplicate React keys
      const monthKey = (it: any) => {
        const d = new Date(it?.ognoo || it?.createdAt || 0);
        return `${it?.gereeniiId || ""}-${d.getFullYear()}-${d.getMonth()}`;
      };
      const seenMonths = new Set<string>();
      const dedupedContractItems = contractItems.filter((item: any) => {
        const key = monthKey(item);
        if (seenMonths.has(key)) return false;
        seenMonths.add(key);
        return true;
      });
      // Prefer paid invoice when deduping same month
      const contractItemsToProcess = dedupedContractItems.length < contractItems.length
        ? contractItems.filter((item: any) => {
          const key = monthKey(item);
          const sameMonth = contractItems.filter((it: any) => monthKey(it) === key);
          const paid = sameMonth.find((it: any) => it?.tuluv === "Төлсөн");
          const best = paid || sameMonth.sort((a: any, b: any) =>
            new Date(b?.updatedAt || 0).getTime() - new Date(a?.updatedAt || 0).getTime()
          )[0];
          return item._id === best?._id;
        })
        : contractItems;

      // Log first item for debugging
      if (contractItemsToProcess.length > 0) {
        console.log("📋 Sample item structure:", JSON.stringify(contractItemsToProcess[0], null, 2));
      }

      const flatLedger: LedgerEntry[] = [];
      const processedIds = new Set<string>();
      const invoiceIds = new Set(contractItemsToProcess.map((item: any) => item._id?.toString()));

      contractItemsToProcess.forEach((item: any) => {
        const itemDate = item.ognoo || item.nekhemjlekhiinOgnoo || item.createdAt || new Date().toISOString();
        // Use only employee fields - never item.ner (resident name) or createdBy?.ner (may be resident)
        const ajiltan = item.burtgesenAjiltaniiNer || item.guilgeeKhiisenAjiltniiNer || item.maililgeesenAjiltniiNer || item.ajiltan || "Admin";
        const source = item.medeelel?.uusgegsenEsekh || item.uusgegsenEsekh || "garan";
        const isSystem = source === "automataar" || source === "cron" || !item.maililgeesenAjiltniiId;

        const pickAmount = (obj: any) => {
          const n = (v: any) => {
            const num = Number(v);
            return Number.isFinite(num) ? num : null;
          };
          const dun = n(obj?.dun);
          if (dun !== null && dun !== 0) return dun;
          const td = n(obj?.tulukhDun);
          if (td !== null && td !== 0) return td;
          const tar = n(obj?.tariff);
          return tar ?? 0;
        };

        // 1. Process Expenses (Zardluud)
        const zardluud = Array.isArray(item?.medeelel?.zardluud) ? item.medeelel.zardluud :
          Array.isArray(item?.zardluud) ? item.zardluud : [];

        // Track if we found ekhniiUldegdel with value in invoice zardluud
        let foundEkhniiUldegdelInInvoice = false;

        zardluud.forEach((z: any) => {
          // Include all zardluud entries including zaalt (electricity) entries
          if (z.ner) {
            let amt = pickAmount(z);
            const isEkhniiUldegdel = z.isEkhniiUldegdel === true ||
              z.ner === "Эхний үлдэгдэл" ||
              (z.ner && z.ner.includes("Эхний үлдэгдэл"));

            // For "Эхний үлдэгдэл" entries with 0 value, SKIP them entirely
            // We'll use the gereeniiTulukhAvlaga record instead (which has the actual value)
            if (isEkhniiUldegdel && (amt === 0 || amt === undefined)) {
              console.log(`⏭️ [HistoryModal] Skipping 0.00 ekhniiUldegdel from invoice, will use gereeniiTulukhAvlaga`);
              return;
            }

            // Include ekhniiUldegdel even when negative (credit); regular charges need amt > 0
            if ((isEkhniiUldegdel && amt !== 0) || amt > 0) {
              // Use composite key: invoiceId-zardalId so entries stay unique when multiple
              // invoices share the same zardluud template (same _ids) -> fixes React duplicate key
              const rowId = `${item._id}-${z._id?.toString() || `z-${Math.random()}`}`;
              flatLedger.push({
                _id: rowId,
                parentInvoiceId: item._id,
                ognoo: itemDate,
                ner: z.ner,
                tulukhDun: amt,
                tulsunDun: 0,
                uldegdel: 0,
                isSystem,
                ajiltan,
                khelber: "Нэхэмжлэх",
                tailbar: z.tailbar || z.ner,
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh"
              });
              if (z._id) processedIds.add(z._id.toString());

              // Mark ALL ekhniiUldegdel records from gereeniiTulukhAvlaga as processed
              // if this invoice zardal is ekhniiUldegdel WITH value
              // This prevents double-counting
              if (isEkhniiUldegdel) {
                foundEkhniiUldegdelInInvoice = true;
                matchedReceivables.forEach((r: any) => {
                  if (r.ekhniiUldegdelEsekh === true && r._id) {
                    processedIds.add(r._id.toString());
                    console.log(`✅ [HistoryModal] Marked gereeniiTulukhAvlaga ekhniiUldegdel as processed: ${r._id}`);
                  }
                });
              }
            }
          }
        });

        // If we found ekhniiUldegdel in invoice, mark all gereeniiTulukhAvlaga ekhniiUldegdel as processed
        // (Double-check in case the loop missed some)
        if (foundEkhniiUldegdelInInvoice) {
          matchedReceivables.forEach((r: any) => {
            if (r.ekhniiUldegdelEsekh === true && r._id) {
              processedIds.add(r._id.toString());
            }
          });
        }

        // 2. Process Manual Transactions (Guilgeenuud - Avlaga/Charges)
        const guilgeenuud = Array.isArray(item?.medeelel?.guilgeenuud) ? item.medeelel.guilgeenuud :
          Array.isArray(item?.guilgeenuud) ? item.guilgeenuud : [];

        guilgeenuud.forEach((g: any) => {
          const amt = Number(g.tulukhDun || 0);
          const paid = Number(g.tulsunDun || 0);

          if (amt > 0) {
            const rowId = g._id?.toString() || `g-charge-${Math.random()}`;
            flatLedger.push({
              _id: rowId,
              parentInvoiceId: item._id,
              ognoo: g.ognoo || g.guilgeeKhiisenOgnoo || itemDate,
              ner: g.ekhniiUldegdelEsekh === true ? "Эхний үлдэгдэл" : "Авлага",
              tulukhDun: amt,
              tulsunDun: 0,
              uldegdel: 0,
              isSystem: false,
              ajiltan: g.guilgeeKhiisenAjiltniiNer || ajiltan,
              khelber: "Авлага",
              tailbar: g.tailbar || "Гараар нэмсэн авлага",
              burtgesenOgnoo: g.createdAt || item.createdAt || "-",
              sourceCollection: "nekhemjlekhiinTuukh"
            });
            if (g._id) processedIds.add(g._id.toString());
          }
          if (paid > 0) {
            const rowId = `${item._id}-g-paid-${g._id?.toString() || Math.random()}`;
            flatLedger.push({
              _id: rowId,
              ognoo: g.ognoo || g.guilgeeKhiisenOgnoo || itemDate,
              ner: "Төлөлт",
              tulukhDun: 0,
              tulsunDun: paid,
              uldegdel: 0,
              isSystem: false,
              ajiltan: g.guilgeeKhiisenAjiltniiNer || ajiltan,
              khelber: g.khelber || "Төлбөр",
              tailbar: g.tailbar || "-",
              burtgesenOgnoo: g.createdAt || item.createdAt || "-",
              sourceCollection: "nekhemjlekhiinTuukh"
            });
            if (g._id) processedIds.add(g._id.toString());
          }
        });
        // 3. Process Standalone Transactions (Top-level item is the transaction)
        // If item has 'turul' and isn't just a container for zardluud/guilgeenuud
        const hasChildren = zardluud.length > 0 || guilgeenuud.length > 0;

        if (!hasChildren && item.turul && (item.turul === "ashiglalt" || item.turul === "avlaga" || item.turul === "tulult" || item.turul === "voucher" || item.turul === "turgul")) {
          const type = item.turul;
          const amt = Number(item.tulukhDun || item.dun || 0);
          const tulsunAmt = Number(item.tulsunDun || 0);

          if (type === "tulult") {
            // Payment type - uses tulsunDun or tulukhDun
            const paymentAmt = tulsunAmt > 0 ? tulsunAmt : Math.abs(amt);
            if (paymentAmt > 0) {
              flatLedger.push({
                _id: item._id,
                ognoo: itemDate,
                ner: "Төлөлт",
                tulukhDun: 0,
                tulsunDun: paymentAmt,
                uldegdel: 0,
                isSystem: false,
                ajiltan,
                khelber: "Төлбөр",
                tailbar: item.tailbar || "-",
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh"
              });
              if (item._id) processedIds.add(item._id.toString());
            }
          } else if (type === "ashiglalt") {
            // Ashiglalt type - like payment, reduces balance
            const paymentAmt = tulsunAmt > 0 ? tulsunAmt : Math.abs(amt);
            if (paymentAmt > 0) {
              flatLedger.push({
                _id: item._id,
                ognoo: itemDate,
                ner: "Ашиглалт",
                tulukhDun: 0,
                tulsunDun: paymentAmt,
                uldegdel: 0,
                isSystem: false,
                ajiltan,
                khelber: "Төлбөр",
                tailbar: item.tailbar || "Ашиглалт",
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh"
              });
              if (item._id) processedIds.add(item._id.toString());
            }
          } else {
            // avlaga, turgul, voucher - adds to balance
            if (amt > 0) {
              let name = "Гүйлгээ";
              if (type === "avlaga") name = "Авлага";
              if (type === "turgul") name = "Торгууль";
              if (type === "voucher") name = "Voucher";

              const desc = item.tailbar || name;

              flatLedger.push({
                _id: item._id,
                ognoo: itemDate,
                ner: name,
                tulukhDun: amt,
                tulsunDun: 0,
                uldegdel: 0,
                isSystem: false,
                ajiltan,
                khelber: "Авлага",
                tailbar: desc,
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh"
              });
              if (item._id) processedIds.add(item._id.toString());
            }
          }
        }
      });

      // Process receivable records from gereeniiTulukhAvlaga
      // Track if we've already added ekhniiUldegdel from invoice zardluud WITH a value > 0
      const hasEkhniiUldegdelInInvoice = flatLedger.some(
        (entry) => {
          const isEkhniiUldegdelName = entry.ner === "Эхний үлдэгдэл" ||
            (entry.ner && entry.ner.includes("Эхний үлдэгдэл"));
          const amt = Number(entry.tulukhDun || 0);
          return isEkhniiUldegdelName &&
            entry.sourceCollection === "nekhemjlekhiinTuukh" &&
            amt !== 0;
        }
      );

      console.log(`📊 [HistoryModal] hasEkhniiUldegdelInInvoice: ${hasEkhniiUldegdelInInvoice}, processedIds count: ${processedIds.size}`);

      matchedReceivables.forEach((rec: any) => {
        const recId = rec._id?.toString();
        // Skip if already processed in invoice loop
        if (recId && processedIds.has(recId)) {
          console.log(`⏭️ [HistoryModal] Skipping already processed receivable: ${recId}`);
          return;
        }

        // Skip orphans (has nekhemjlekhId but parent invoice is gone)
        if (rec.nekhemjlekhId && !invoiceIds.has(rec.nekhemjlekhId.toString())) return;

        // Skip ekhniiUldegdel records if they're already included in the invoice zardluud
        // This prevents duplicate "Эхний үлдэгдэл" entries
        if (rec.ekhniiUldegdelEsekh === true && hasEkhniiUldegdelInInvoice) {
          console.log(`⏭️ [HistoryModal] Skipping duplicate ekhniiUldegdel from gereeniiTulukhAvlaga: ${recId}`);
          return;
        }

        const recDate = rec.ognoo || rec.createdAt || new Date().toISOString();
        const ajiltan = rec.guilgeeKhiisenAjiltniiNer || "Admin";
        // For ekhniiUldegdel, use undsenDun (original amount) for the charge - payments are tracked separately
        const amt = rec.ekhniiUldegdelEsekh === true
          ? Number(rec.undsenDun ?? rec.tulukhDun ?? rec.uldegdel ?? 0)
          : Number(rec.tulukhDun || rec.undsenDun || 0);

        // Include ekhniiUldegdel even when negative (credit); other receivables need amt > 0
        if ((rec.ekhniiUldegdelEsekh === true && amt !== 0) || amt > 0) {
          flatLedger.push({
            _id: rec._id,
            ognoo: recDate,
            ner: rec.ekhniiUldegdelEsekh === true ? "Эхний үлдэгдэл" : (rec.zardliinNer || "Авлага"),
            tulukhDun: amt,
            tulsunDun: 0,
            uldegdel: 0,
            isSystem: false,
            ajiltan,
            khelber: "Авлага",
            tailbar: rec.tailbar || rec.zardliinNer || "Гараар нэмсэн авлага",
            burtgesenOgnoo: rec.createdAt || "-",
            sourceCollection: "gereeniiTulukhAvlaga"
          });
        }
      });

      // Process payment records from gereeniiTulsunAvlaga
      matchedPayments.forEach((payment: any) => {
        const pId = payment._id?.toString();
        // Skip if already processed in invoice loop
        if (pId && processedIds.has(pId)) return;

        // Skip orphans (has nekhemjlekhId but parent invoice is gone)
        if (payment.nekhemjlekhId && !invoiceIds.has(payment.nekhemjlekhId.toString())) return;

        const paymentDate = payment.ognoo || payment.createdAt || new Date().toISOString();
        const ajiltan = payment.guilgeeKhiisenAjiltniiNer || "Admin";
        const tulsunDun = Number(payment.tulsunDun || 0);
        const turul = payment.turul || "tulbur";

        // Determine the name based on type
        let name = "Төлөлт";
        let khelber = "Төлбөр";
        if (turul === "ashiglalt" || turul === "Ашиглалт") {
          name = "Ашиглалт";
          khelber = "Төлбөр";
        } else if (turul === "tulult" || turul === "Төлөлт" || turul === "tulbur") {
          name = "Төлөлт";
          khelber = "Төлбөр";
        } else if (turul === "prepayment" || turul === "Урьдчилсан төлбөр" || turul === "invoice_payment") {
          name = "Төлөлт";
          khelber = "Төлбөр";
        }

        console.log(`💰 [HistoryModal] Processing payment: ${payment._id}, turul: ${turul}, amount: ${tulsunDun}, name: ${name}`);

        if (tulsunDun > 0) {
          flatLedger.push({
            _id: payment._id,
            ognoo: paymentDate,
            ner: name,
            tulukhDun: 0,
            tulsunDun: tulsunDun,
            uldegdel: 0,
            isSystem: false,
            ajiltan,
            khelber,
            tailbar: payment.tailbar || payment.zardliinNer || name,
            burtgesenOgnoo: payment.createdAt || "-",
            sourceCollection: "gereeniiTulsunAvlaga"
          });
        }
      });

      // Sort Chronologically: Oldest -> Newest
      flatLedger.sort((a, b) => {
        // Compare by transaction date (day start only) to group same-day entries
        const dA = new Date(a.ognoo);
        const dB = new Date(b.ognoo);
        const dayA = new Date(dA.getFullYear(), dA.getMonth(), dA.getDate()).getTime();
        const dayB = new Date(dB.getFullYear(), dB.getMonth(), dB.getDate()).getTime();

        if (dayA !== dayB) return dayA - dayB;

        // If same logical day, sort by actual creation time
        const createA = a.burtgesenOgnoo && a.burtgesenOgnoo !== "-" ? new Date(a.burtgesenOgnoo).getTime() : dayA;
        const createB = b.burtgesenOgnoo && b.burtgesenOgnoo !== "-" ? new Date(b.burtgesenOgnoo).getTime() : dayB;
        return createA - createB;
      });

      // Calculate Running Balance
      // Use fresh fetched balance if available, otherwise fallback to prop
      const currentBalance = freshContract?.uldegdel !== undefined
        ? Number(freshContract.uldegdel)
        : (contract?.uldegdel ? Number(contract.uldegdel) : null);

      // Calculate total charges and payments in the ledger
      const totalCharges = flatLedger.reduce((sum, row) => sum + Number(row.tulukhDun || 0), 0);
      const totalPayments = flatLedger.reduce((sum, row) => sum + Number(row.tulsunDun || 0), 0);

      // Check if there's ekhniiUldegdel from gereeniiTulukhAvlaga (not in invoice)
      const hasEkhniiUldegdelFromAvlaga = flatLedger.some(
        (row) => row.sourceCollection === "gereeniiTulukhAvlaga" &&
          (row.ner === "Эхний үлдэгдэл" || (row.ner && row.ner.includes("Эхний үлдэгдэл")))
      );

      console.log(`💰 [HistoryModal] Ledger totals - Charges: ${totalCharges}, Payments: ${totalPayments}, Current Balance: ${currentBalance}, hasEkhniiUldegdelFromAvlaga: ${hasEkhniiUldegdelFromAvlaga}`);

      // Compute expected balance from ledger (charges - payments)
      const computedBalance = totalCharges - totalPayments;

      // ALWAYS use FORWARD calculation for History Modal to ensure the math always adds up correctly
      // based on the visible transactions, rather than relying on a potentially out-of-sync contract balance
      console.log(`💰 [HistoryModal] Using FORWARD calculation (starting from 0)`);
      let runningBalance = 0;

      for (let i = 0; i < flatLedger.length; i++) {
        const row = flatLedger[i];
        const charge = Number(row.tulukhDun || 0);
        const pay = Number(row.tulsunDun || 0);

        // Balance AFTER this transaction
        runningBalance = runningBalance + charge - pay;
        row.uldegdel = runningBalance;
      }

      console.log(`💰 [HistoryModal] Forward Calc End (Final Balance): ${runningBalance}`);

      // Reverse for Display (Newest First)
      flatLedger.reverse();

      setData(flatLedger);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteClick = (id: string, type: string) => {
    setDeleteConfirm({ show: true, id, type });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    const entry = data.find(e => e._id === id);
    const source = entry?.sourceCollection || "nekhemjlekhiinTuukh";

    setDeleteConfirm({ show: false, id: "", type: "" });

    try {
      let response;
      const endpoint = source === "gereeniiTulsunAvlaga"
        ? "/gereeniiTulsunAvlaga"
        : source === "gereeniiTulukhAvlaga"
          ? "/gereeniiTulukhAvlaga"
          : "/nekhemjlekhiinTuukh";

      // If it's a sub-item (zardal or guilgee) in an invoice
      if (entry?.parentInvoiceId && source === "nekhemjlekhiinTuukh") {
        // Extract actual zardal/guilgee _id from composite key (invoiceId-zardalId or invoiceId-g-guilgeeId)
        let zardalId = id;
        if (id.includes("-g-paid-")) zardalId = id.split("-g-paid-")[1] || id;
        else if (id.includes("-g-")) zardalId = id.split("-g-")[1] || id;
        else if (id.includes("-")) zardalId = id.substring(id.indexOf("-") + 1);
        response = await uilchilgee(token || undefined).post(`${endpoint}/deleteZardal`, {
          invoiceId: entry.parentInvoiceId,
          zardalId,
          baiguullagiinId: baiguullagiinId || undefined,
        });
      } else {
        // Otherwise use standard delete for full documents
        response = await uilchilgee(token || undefined).delete(`${endpoint}/${id}`, {
          params: {
            baiguullagiinId: baiguullagiinId || undefined,
          }
        });
      }

      if (response.data.success || response.status === 200 || response.status === 204) {
        // Cascade delete related records when deleting from nekhemjlekhiinTuukh
        if (source === "nekhemjlekhiinTuukh" && contract?.gereeniiId) {
          // Delete related records from gereeniiTulsunAvlaga
          await uilchilgee(token || undefined).delete(`/gereeniiTulsunAvlaga`, {
            params: {
              baiguullagiinId: baiguullagiinId || undefined,
              gereeniiId: contract.gereeniiId,
              nekhemjlekhiinId: id,
            }
          }).catch(() => { }); // Silently ignore if no records exist

          // Delete related records from gereeniiTulukhAvlaga
          await uilchilgee(token || undefined).delete(`/gereeniiTulukhAvlaga`, {
            params: {
              baiguullagiinId: baiguullagiinId || undefined,
              gereeniiId: contract.gereeniiId,
              nekhemjlekhiinId: id,
            }
          }).catch(() => { }); // Silently ignore if no records exist
        }

        // Show success message
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 2000);

        // Refresh local data
        fetchData();

        // Notify parent to refresh (essential for updating totals/balances)
        // @ts-ignore
        if (onRefresh) {
          // @ts-ignore
          onRefresh();
        }
      } else {
        alert("Устгаж чадсангүй");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Алдаа гарлаа: " + (error as any).message);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: "", type: "" });
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
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar">
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
          className="relative bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-[1500px] md:max-w-[1800px] min-h-[0vh] max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg sm:text-xl  text-slate-800 dark:text-white">
                  Түүх
                </h2>
                <div className="text-xs text-slate-400">
                  {contract?.ovog} {contract?.ner} • {data.length} бичлэг
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-lg "
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
                <div key={idx} className="bg-slate-300 dark:bg-slate-800/40 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px]  text-slate-400 uppercase tracking-wider block">{item.label}</span>
                  <span className="text-xs  text-slate-700 dark:text-slate-200 truncate block">{item.value}</span>
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
                    input: "bg-slate-100 dark:bg-slate-800/50 border-none h-8 text-xs ",
                  }}
                />
              </div>
              {(dateRange?.[0] || dateRange?.[1]) && (
                <button
                  onClick={() => setDateRange([null, null])}
                  className="text-[10px]  text-rose-500 hover:underline"
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
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase">Огноо</th>
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase hidden sm:table-cell">Ажилтан</th>
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase">Төлөх дүн</th>
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase">Төлсөн дүн</th>
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase">Үлдэгдэл</th>
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase hidden md:table-cell">Хэлбэр</th>
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase hidden md:table-cell">Тайлбар</th>
                  <th className="py-2 px-2 text-center text-[9px]  text-slate-400 uppercase hidden lg:table-cell">Бүртгэсэн огноо</th>
                  <th className="py-2  text-center text-[9px]  text-slate-400 uppercase w-12">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="py-3 px-2">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
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
                        <td className="py-2 px-2 text-xs  text-slate-600 dark:text-slate-300 whitespace-nowrap text-center">
                          {row.ognoo.split("T")[0].replace(/-/g, ".")}
                        </td>
                        <td className="py-2 px-2 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell text-center">
                          {row.isSystem ? "Систем" : row.ajiltan}
                        </td>
                        <td className="py-2 px-2 text-xs  text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                          {Number(row.tulukhDun) !== 0 ? formatNumber(row.tulukhDun, 2) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap text-slate-700 dark:text-slate-200">
                          {row.tulsunDun > 0 ? formatNumber(row.tulsunDun, 2) : "-"}
                        </td>
                        <td className={`py-2 px-2 text-xs  text-right whitespace-nowrap ${row.uldegdel < 0 ? "!text-emerald-600 dark:!text-emerald-400" : row.uldegdel > 0 ? "!text-red-500 dark:!text-red-400" : "text-theme"}`}>
                          {formatNumber(row.uldegdel, 2)}
                        </td>
                        <td className="py-2 px-2 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell text-center">
                          {row.khelber || "-"}
                        </td>
                        <td className="py-2 px-2 text-xs text-slate-600 dark:text-slate-300 hidden md:table-cell">
                          {row.tailbar || "-"}
                        </td>
                        <td className="py-2 px-2 text-xs text-slate-400 dark:text-slate-500 hidden lg:table-cell whitespace-nowrap text-center">
                          {row.burtgesenOgnoo && row.burtgesenOgnoo !== "-"
                            ? new Date(row.burtgesenOgnoo).toLocaleString("mn-MN", { hour12: false })
                            : "-"}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const canDelete = row._id && !row._id.startsWith("z-") && !row._id.startsWith("g-") && !row._id.includes("-z-") && !row.isSystem;
                              if (canDelete && row._id) {
                                handleDeleteClick(row._id, row.ner || row.khelber || "");
                              }
                            }}
                            className={`p-1 transition-colors ${row._id && !row._id.startsWith("z-") && !row._id.startsWith("g-") && !row._id.includes("-z-") && !row.isSystem ? "!text-red-500 hover:!text-red-600 cursor-pointer" : "text-slate-200 dark:text-slate-700 cursor-not-allowed"}`}
                            title={row.isSystem ? "Системээс үүсгэсэн - устгах боломжгүй" : row._id && !row._id.startsWith("z-") && !row._id.startsWith("g-") && !row._id.includes("-z-") ? "Устгах" : "Устгах боломжгүй"}
                            disabled={!row._id || row._id.startsWith("z-") || row._id.startsWith("g-") || row._id.includes("-z-") || row.isSystem}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${row._id && !row._id.startsWith("z-") && !row._id.startsWith("g-") && !row.isSystem ? "!text-red-500" : "text-slate-300 dark:text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Total Summary Row - balance = charges - payments (shows overpayment as negative) */}
                    {(() => {
                      const totalCharges = filteredData.reduce((sum, row) => sum + (row.tulukhDun || 0), 0);
                      const totalPayments = filteredData.reduce((sum, row) => sum + (row.tulsunDun || 0), 0);
                      const balance = totalCharges - totalPayments;
                      const balanceClass = balance < 0 ? "!text-emerald-600 dark:!text-emerald-400" : balance > 0 ? "!text-red-500 dark:!text-red-400" : "text-theme";
                      return (
                        <tr className="bg-slate-100 dark:bg-slate-800/50  border-t-2 border-slate-300 dark:border-slate-600">
                          <td colSpan={2} className="py-2 px-2 text-xs  text-slate-700 dark:text-slate-200 text-right">Нийт</td>
                          <td className="py-2 px-2 text-xs  text-slate-700 dark:text-slate-200 text-right whitespace-nowrap">
                            {formatNumber(totalCharges, 2)}
                          </td>
                          <td className="py-2 px-2 text-xs  text-slate-700 dark:text-slate-200 text-right whitespace-nowrap">
                            {formatNumber(totalPayments, 2)}
                          </td>
                          <td className={`py-2 px-2 text-xs  text-right whitespace-nowrap ${balanceClass}`}>
                            {formatNumber(balance, 2)}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      );
                    })()}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer - Compact */}
          <div className="p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs  text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all"
            >
              Хаах
            </button>
            <button
              onClick={handlePrint}
              className="h-8 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xs  !text-white transition-all"
            >
              Хэвлэх
            </button>
          </div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteConfirm.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100000] flex items-center justify-center bg-black/50 rounded-2xl sm:rounded-3xl"
                onClick={handleDeleteCancel}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 !text-red-500 dark:!text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h3 className="text-lg  text-slate-800 dark:text-white mb-2">Устгах уу?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Та энэ гүйлгээг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteCancel}
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm  text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Болих
                      </button>
                      <button
                        onClick={handleDeleteConfirm}
                        className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm  text-white transition-colors"
                      >
                        Устгах
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Overlay */}
          <AnimatePresence>
            {deleteSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100001] flex items-center justify-center bg-black/30 rounded-2xl sm:rounded-3xl"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl"
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg  text-slate-800 dark:text-white">Амжилттай устгалаа!</p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div >
    </AnimatePresence >
  );
}
