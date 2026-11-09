"use client";

/**
 * BPay төлбөр — Төрийн банк (BPay) горимтой СӨХ-ийн тоот бүрийн BPay биллүүд.
 *
 * Өгөгдөл `GET /bpay/billuud`-аас (backend `bpayBill`; 5 минут тутам синк, манай апп-аар
 * төлсөн нь callback-аар шууд).
 * BPay зөвхөн төлөгдөөгүй биллийг харуулдаг тул "Илрүүлсэн" төлбөрийн огноо нь
 * билл алга болсон өдөр (ойролцоо); манай холболтоор төлсөн бол яг огноо.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee from "@/lib/uilchilgee";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

type Bill = {
  _id: string;
  gereeniiId?: string;
  gereeniiDugaar?: string;
  toot?: string;
  sar: string;
  dun: number;
  aldangi: number;
  aldangitaiDun: number;
  tuluv: "Төлөгдөөгүй" | "Төлөгдсөн";
  tulsunOgnoo?: string | null;
  tulsunDun?: number | null;
  tulburiinEkhSurvalj?: string;
  davkharEsekh?: boolean;
};

type Holbolt = {
  gereeniiId: string;
  gereeniiDugaar?: string;
  toot?: string;
  customerCode?: string;
  customerName?: string;
  suuldSync?: string;
  suuldAldaa?: string;
  salgasan?: boolean;
};

type Mur = {
  gereeniiId: string;
  toot: string;
  gereeniiDugaar: string;
  customerCode: string;
  ner: string;
  billuud: Bill[];
  tulugduugui: number;
  tulugduuguiToo: number;
  suuldTulsun: string | null;
  aldaa: string;
  salgasan: boolean;
};

const mungu = (n: number) => `${Math.round(n || 0).toLocaleString("mn-MN")} ₮`;
const ognoo = (s?: string | null) => (s ? new Date(s).toLocaleDateString("mn-MN") : "—");
const sarEremb = (a: string, b: string) => {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return ay - by || am - bm;
};
const tootEremb = (a: string, b: string) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0) || a.localeCompare(b);

export default function BpayTulburPage() {
  const { token } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const [idevkhtei, setIdevkhtei] = useState<boolean | null>(null);
  const [billuud, setBilluud] = useState<Bill[]>([]);
  const [holboltuud, setHolboltuud] = useState<Holbolt[]>([]);
  const [achaalj, setAchaalj] = useState(true);
  const [shuult, setShuult] = useState<"bugd" | "ortei" | "tulsun">("bugd");
  const [khaikh, setKhaikh] = useState("");
  const [neelttei, setNeelttei] = useState<Set<string>>(new Set());

  const achaalakh = useCallback(async () => {
    if (!token) return;
    setAchaalj(true);
    try {
      const t = await uilchilgee(token).get("/bpay/medeelel");
      const asaalttai = !!t.data?.tokhirgoo?.idevkhtei;
      setIdevkhtei(asaalttai);
      const { data } = await uilchilgee(token).get("/bpay/billuud", {
        params: selectedBuildingId ? { barilgiinId: selectedBuildingId } : {},
      });
      setBilluud(data?.billuud || []);
      setHolboltuud(data?.holboltuud || []);
    } catch (e: any) {
      openErrorOverlay(e?.response?.data?.message || e?.message || "Ачаалахад алдаа гарлаа");
    } finally {
      setAchaalj(false);
    }
  }, [token, selectedBuildingId]);

  useEffect(() => {
    achaalakh();
  }, [achaalakh]);

  const muruud: Mur[] = useMemo(() => {
    const m = new Map<string, Mur>();
    for (const h of holboltuud) {
      m.set(h.gereeniiId, {
        gereeniiId: h.gereeniiId,
        toot: h.toot || "",
        gereeniiDugaar: h.gereeniiDugaar || "",
        customerCode: h.customerCode || "",
        ner: h.customerName || "",
        billuud: [],
        tulugduugui: 0,
        tulugduuguiToo: 0,
        suuldTulsun: null,
        aldaa: h.suuldAldaa || "",
        salgasan: !!h.salgasan,
      });
    }
    for (const b of billuud) {
      const k = b.gereeniiId || `?${b.toot}`;
      if (!m.has(k)) {
        m.set(k, { gereeniiId: k, toot: b.toot || "", gereeniiDugaar: b.gereeniiDugaar || "", customerCode: "", ner: "", billuud: [], tulugduugui: 0, tulugduuguiToo: 0, suuldTulsun: null, aldaa: "", salgasan: false });
      }
      const r = m.get(k)!;
      r.billuud.push(b);
      if (b.tuluv === "Төлөгдөөгүй") {
        r.tulugduugui += b.aldangitaiDun || b.dun || 0;
        r.tulugduuguiToo += 1;
      } else if (b.tulsunOgnoo && (!r.suuldTulsun || b.tulsunOgnoo > r.suuldTulsun)) {
        r.suuldTulsun = b.tulsunOgnoo;
      }
    }
    for (const r of m.values()) r.billuud.sort((a, b) => sarEremb(b.sar, a.sar));
    return [...m.values()].sort((a, b) => tootEremb(a.toot, b.toot));
  }, [billuud, holboltuud]);

  const kharagdakh = useMemo(() => {
    const q = khaikh.trim().toLowerCase();
    return muruud.filter((r) => {
      if (shuult === "ortei" && r.tulugduuguiToo === 0) return false;
      if (shuult === "tulsun" && r.tulugduuguiToo > 0) return false;
      if (!q) return true;
      return [r.toot, r.gereeniiDugaar, r.customerCode, r.ner].join(" ").toLowerCase().includes(q);
    });
  }, [muruud, shuult, khaikh]);

  const niit = useMemo(() => {
    const sarEkh = new Date();
    sarEkh.setDate(1);
    sarEkh.setHours(0, 0, 0, 0);
    let tulugduugui = 0;
    let orteiToo = 0;
    let enSarTulsun = 0;
    for (const r of muruud) {
      tulugduugui += r.tulugduugui;
      if (r.tulugduuguiToo) orteiToo += 1;
      for (const b of r.billuud) {
        if (b.tuluv === "Төлөгдсөн" && b.tulsunOgnoo && new Date(b.tulsunOgnoo) >= sarEkh) enSarTulsun += b.tulsunDun || b.dun || 0;
      }
    }
    return { tulugduugui, orteiToo, enSarTulsun, tootToo: muruud.length };
  }, [muruud]);

  const toggle = (id: string) =>
    setNeelttei((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (idevkhtei === false && !achaalj) {
    return (
      <div className="rounded-2xl neu-panel p-6">
        <p className="font-medium">Төрийн банк (BPay) горим асаагүй байна.</p>
        <p className="mt-1 text-sm opacity-70">
          Тохиргоо → Нэмэлт → «Төрийн банк (BPay)» хэсгээс асааж, тоотуудаа BPay-д холбоно уу.
        </p>
        <Link href="/tokhirgoo" className="mt-3 inline-block underline">
          Тохиргоо руу очих
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-14">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Төлөгдөөгүй (алдангитай)", mungu(niit.tulugduugui)],
            ["Өртэй тоот", `${niit.orteiToo} / ${niit.tootToo}`],
            ["Энэ сард төлсөн", mungu(niit.enSarTulsun)],
            ["Холбогдсон тоот", String(holboltuud.length)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl neu-panel p-4">
              <div className="text-xs opacity-70">{k}</div>
              <div className="mt-1 text-lg font-semibold">{v}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl neu-panel p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(
              [
                ["bugd", "Бүгд"],
                ["ortei", "Өртэй"],
                ["tulsun", "Өргүй"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setShuult(k)}
                className={`rounded-lg px-3 py-1 text-sm ${shuult === k ? "bg-blue-600 text-white" : "border"}`}
              >
                {l}
              </button>
            ))}
            <input
              value={khaikh}
              onChange={(e) => setKhaikh(e.target.value)}
              placeholder="Тоот, гэрээ, код, нэр"
              className="ml-auto rounded-lg border px-3 py-1 text-sm"
              aria-label="Хайх"
            />
            <button type="button" onClick={achaalakh} className="rounded-lg border px-3 py-1 text-sm">
              Шинэчлэх
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left opacity-70">
                  <th className="py-2 pr-3">Тоот</th>
                  <th className="py-2 pr-3">Гэрээ</th>
                  <th className="py-2 pr-3">BPay код</th>
                  <th className="py-2 pr-3 text-right">Төлөгдөөгүй сар</th>
                  <th className="py-2 pr-3 text-right">Төлөх (алдангитай)</th>
                  <th className="py-2 pr-3">Сүүлд төлсөн</th>
                  <th className="py-2 pr-3">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {kharagdakh.map((r) => (
                  <React.Fragment key={r.gereeniiId}>
                    <tr className="cursor-pointer border-t hover:bg-black/5" onClick={() => toggle(r.gereeniiId)}>
                      <td className="py-2 pr-3 font-medium">{r.toot}</td>
                      <td className="py-2 pr-3">{r.gereeniiDugaar}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.customerCode}</td>
                      <td className="py-2 pr-3 text-right">{r.tulugduuguiToo}</td>
                      <td className="py-2 pr-3 text-right font-semibold">{mungu(r.tulugduugui)}</td>
                      <td className="py-2 pr-3">{ognoo(r.suuldTulsun)}</td>
                      <td className="py-2 pr-3">
                        {r.salgasan ? (
                          <span className="text-orange-600" title="Оршин суугч BPay-ээс хаягаа салгасан — синк зогссон">
                            Салгасан
                          </span>
                        ) : r.aldaa ? (
                          <span className="text-orange-600" title={r.aldaa}>Синкийн алдаа</span>
                        ) : r.tulugduuguiToo ? (
                          <span className="text-red-600">Өртэй</span>
                        ) : (
                          <span className="text-green-600">Өргүй</span>
                        )}
                      </td>
                    </tr>
                    {neelttei.has(r.gereeniiId) ? (
                      <tr>
                        <td colSpan={7} className="pb-3 pl-6">
                          {r.billuud.length ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left opacity-60">
                                  <th className="py-1 pr-3">Сар</th>
                                  <th className="py-1 pr-3 text-right">Дүн</th>
                                  <th className="py-1 pr-3 text-right">Алданги</th>
                                  <th className="py-1 pr-3">Төлөв</th>
                                  <th className="py-1 pr-3">Төлсөн огноо</th>
                                  <th className="py-1 pr-3 text-right">Төлсөн дүн</th>
                                  <th className="py-1 pr-3">Эх сурвалж</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.billuud.map((b) => (
                                  <tr key={b._id} className="border-t">
                                    <td className="py-1 pr-3">
                                      {b.sar}
                                      {b.davkharEsekh ? <span className="ml-1 text-orange-600">(давхар — шалгах)</span> : null}
                                    </td>
                                    <td className="py-1 pr-3 text-right">{mungu(b.dun)}</td>
                                    <td className="py-1 pr-3 text-right">{b.aldangi ? mungu(b.aldangi) : "—"}</td>
                                    <td className={`py-1 pr-3 ${b.tuluv === "Төлөгдсөн" ? "text-green-600" : "text-red-600"}`}>{b.tuluv}</td>
                                    <td className="py-1 pr-3">{ognoo(b.tulsunOgnoo)}</td>
                                    <td className="py-1 pr-3 text-right">{b.tulsunDun ? mungu(b.tulsunDun) : "—"}</td>
                                    <td className="py-1 pr-3">{b.tulburiinEkhSurvalj || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <span className="opacity-60">BPay-ээс билл ирээгүй байна.</span>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}
                {!kharagdakh.length && !achaalj ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center opacity-60">
                      Мэдээлэл алга
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs opacity-60">
            «Илрүүлсэн» төлбөрийн огноо нь билл BPay-ээс алга болсон өдөр (ойролцоо). Сар бүр Төрийн банкны тайлантай
            тулгана уу.
          </p>
        </div>
      </div>
    </div>
  );
}
