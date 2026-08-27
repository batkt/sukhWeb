"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { AlertTriangle, FileText, Receipt, Wallet, X } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import Button from "@/components/ui/Button";

interface Tootsoo {
  geree: number;
  nekhemjlekh: number;
  guilgeeAvlaga: number;
}

interface Props {
  /** Устгах гэж буй ЦУЦЛАГДСАН гэрээний мөр. */
  contract: any;
  token: string;
  onClose: () => void;
  onDeleted: () => void;
}

/** Баталгаажуулахын тулд хэрэглэгчээр бичүүлэх үг. */
const BATALGAA = "УСТГАХ";

/**
 * Ганц цуцлагдсан гэрээг нэхэмжлэх + гүйлгээ/авлагатай нь устгах цонх.
 *
 * Эзэмшигч (оршин суугч / харилцагч) болон түүний бусад гэрээнд хүрэхгүй — нэг
 * хүн олон гэрээтэй байж, шинэ гэрээ нь идэвхтэй хэвээр байх нь хэвийн.
 *
 * Хоёр алхамтай: эхлээд `zovkhonShalgakh: true` илгээж юу устгагдахыг тоолуулна
 * (юу ч устгахгүй), дараа нь хэрэглэгч баталгаажуулсны дараа жинхэнэ устгалыг
 * дуудна.
 */
export default function AdminGereeUstgakhModal({
  contract,
  token,
  onClose,
  onDeleted,
}: Props) {
  const gereeniiId = contract?._id || contract?.id;
  const [tootsoo, setTootsoo] = useState<Tootsoo | null>(null);
  const [shalgaj, setShalgaj] = useState(true);
  const [ustgaj, setUstgaj] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);
  const [batalgaa, setBatalgaa] = useState("");

  const ezemshigch =
    [contract?.ovog, contract?.ner].filter(Boolean).join(" ") || "—";

  const shalgakh = useCallback(async () => {
    if (!gereeniiId) {
      setAldaa("Гэрээний ID олдсонгүй.");
      setShalgaj(false);
      return;
    }
    setShalgaj(true);
    setAldaa(null);
    try {
      const res = await uilchilgee(token).post(
        `/geree/${gereeniiId}/adminUstgakh`,
        { zovkhonShalgakh: true },
      );
      setTootsoo(res.data?.tootsoo ?? null);
    } catch (err: any) {
      setAldaa(err?.response?.data?.message || "Шалгахад алдаа гарлаа.");
    } finally {
      setShalgaj(false);
    }
  }, [gereeniiId, token]);

  useEffect(() => {
    shalgakh();
  }, [shalgakh]);

  const ustgakh = async () => {
    if (batalgaa.trim().toUpperCase() !== BATALGAA) return;
    setUstgaj(true);
    try {
      const res = await uilchilgee(token).post(
        `/geree/${gereeniiId}/adminUstgakh`,
        {},
      );
      toast.success(res.data?.message || "Устгагдлаа.");
      onDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Устгахад алдаа гарлаа.");
    } finally {
      setUstgaj(false);
    }
  };

  const bolomjtoi = !shalgaj && !aldaa && tootsoo !== null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={ustgaj ? undefined : onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-white">
                Цуцлагдсан гэрээг устгах
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {contract?.gereeniiDugaar || "Дугааргүй"}
                {contract?.toot ? ` · ${contract.toot} тоот` : ""} · {ezemshigch}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={ustgaj}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {shalgaj ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : aldaa ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 p-4">
              <p className="text-sm text-rose-700 dark:text-rose-300">{aldaa}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Дараах бичлэгүүд{" "}
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  бүрмөсөн устана
                </span>
                . Энэ үйлдлийг буцаах боломжгүй.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: FileText, label: "Гэрээ", value: tootsoo?.geree ?? 0 },
                  {
                    icon: Receipt,
                    label: "Нэхэмжлэх",
                    value: tootsoo?.nekhemjlekh ?? 0,
                  },
                  {
                    icon: Wallet,
                    label: "Гүйлгээ/авлага",
                    value: tootsoo?.guilgeeAvlaga ?? 0,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 dark:border-white/10 p-3 text-center"
                  >
                    <Icon className="w-4 h-4 mx-auto text-slate-400 mb-1.5" />
                    <p className="text-lg font-semibold text-slate-800 dark:text-white leading-none">
                      {value}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-3">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <span className="font-semibold">{ezemshigch}</span> болон түүний
                  бусад гэрээнд хүрэхгүй — зөвхөн энэ нэг цуцлагдсан гэрээ
                  устана. Устгасан бичлэг бүр «Устгасан түүх» рүү хуулбараар
                  бичигдэнэ.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Баталгаажуулахын тулд{" "}
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    {BATALGAA}
                  </span>{" "}
                  гэж бичнэ үү
                </label>
                <input
                  value={batalgaa}
                  onChange={(e) => setBatalgaa(e.target.value)}
                  disabled={ustgaj}
                  placeholder={BATALGAA}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-end gap-2">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={ustgaj}
            className="h-11 px-5 rounded-xl border border-slate-200 dark:border-white/10"
          >
            Болих
          </Button>
          <Button
            onClick={ustgakh}
            variant="primary"
            isLoading={ustgaj}
            disabled={!bolomjtoi || batalgaa.trim().toUpperCase() !== BATALGAA}
            className="h-11 px-6 rounded-xl !bg-rose-600 hover:!bg-rose-700"
          >
            Гэрээг устгах
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
