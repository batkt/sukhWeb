"use client";

/**
 * Хуулга (HistoryModal) доторх Төрийн банк (BPay) хэсэг.
 *
 * Сар бүрийн BPay билл (дүн, алданги, төлөв, төлсөн огноо) ба тухайн сарын
 * ашиглалтын зардлын задаргаа (гараж, агуулах орно). Backend: GET /bpay/khuulga.
 * Төрийн банк горимгүй байгууллагад юу ч зурахгүй.
 */

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";

type Mur = { ner: string; dun: number; turul?: string };
type Sar = {
  sar: string;
  tuluv: "Төлөгдөөгүй" | "Төлөгдсөн";
  dun: number;
  aldangi: number;
  aldangitaiDun: number;
  tulsunOgnoo?: string | null;
  tulsunDun?: number | null;
  tulburiinEkhSurvalj?: string;
  nuusan?: boolean;
  zadargaa: Mur[];
  zadargaaNiit: number;
  taarsan: boolean;
};
type Khariu = {
  bpay: boolean;
  tulukh?: number;
  holbolt?: { customerCode?: string; salgasan?: boolean; suuldAldaa?: string } | null;
  saruud?: Sar[];
};

const mungu = (n?: number | null) => `${Math.round(Number(n) || 0).toLocaleString("mn-MN")} ₮`;
const ognoo = (s?: string | null) => (s ? new Date(s).toLocaleDateString("mn-MN") : "—");
const garaj = (t?: string) => t === "Зогсоол" || t === "Гараж";

/** HistoryModal-тай ижил дүрмээр гэрээний id-г олно. */
function gereeniiIdOlokh(contract: any): string {
  const explicit = String(contract?.gereeniiId || contract?.gereeId || contract?._gereeniiId || "").trim();
  if (explicit) return explicit;
  const nekhemjlekhMur = Boolean(
    contract?.medeelel?.zardluud ||
      contract?.medeelel?.guilgeenuud ||
      contract?.nekhemjlekhiinDugaar ||
      contract?.turul === "nekhemjlekh",
  );
  return !nekhemjlekhMur && contract?._id ? String(contract._id).trim() : "";
}

export default function BpayKhuulga({ contract, show }: { contract: any; show: boolean }) {
  const { token, baiguullaga } = useAuth() as { token?: string; baiguullaga?: any };
  const bpayGorim = baiguullaga?.tokhirgoo?.bpayAshiglakhEsekh === true;
  const gereeniiId = gereeniiIdOlokh(contract);
  const [khariu, setKhariu] = useState<Khariu | null>(null);
  const [achaalj, setAchaalj] = useState(false);

  useEffect(() => {
    if (!show || !bpayGorim || !token || !gereeniiId) {
      setKhariu(null);
      return;
    }
    let tsutsalsan = false;
    setAchaalj(true);
    uilchilgee(token)
      .get("/bpay/khuulga", { params: { gereeniiId } })
      .then(({ data }) => {
        if (!tsutsalsan) setKhariu(data);
      })
      .catch(() => {
        if (!tsutsalsan) setKhariu(null);
      })
      .finally(() => {
        if (!tsutsalsan) setAchaalj(false);
      });
    return () => {
      tsutsalsan = true;
    };
  }, [show, bpayGorim, token, gereeniiId]);

  if (!bpayGorim || !gereeniiId) return null;
  if (achaalj && !khariu) {
    return <div className="py-3 text-[12px] text-[color:var(--muted-text)]">Төлбөрийн мэдээлэл ачаалж байна…</div>;
  }
  if (!khariu?.bpay) return null;

  const saruud = khariu.saruud || [];
  return (
    <div className="mb-4 rounded-xl border border-[color:var(--surface-border)] p-3 print:break-inside-avoid">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="font-semibold text-[color:var(--panel-text)]">
          Төлбөр (Төрийн банк)
          {khariu.holbolt?.customerCode ? (
            <span className="ml-2 font-normal text-[color:var(--muted-text)]">код {khariu.holbolt.customerCode}</span>
          ) : null}
          {khariu.holbolt?.salgasan ? <span className="ml-2 text-orange-600">· хаягаа салгасан</span> : null}
        </div>
        <div className="text-[color:var(--panel-text)]">
          Төлөх: <b>{mungu(khariu.tulukh)}</b>
        </div>
      </div>

      {!saruud.length ? (
        <div className="text-[12px] text-[color:var(--muted-text)]">
          {khariu.holbolt ? "Билл ирээгүй байна." : "Тоот холбогдоогүй байна."}
        </div>
      ) : (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[color:var(--surface-border)] text-left text-[color:var(--muted-text)]">
              <th className="py-1 pr-2 font-medium">Сар</th>
              <th className="py-1 pr-2 text-right font-medium">Дүн</th>
              <th className="py-1 pr-2 text-right font-medium">Алданги</th>
              <th className="py-1 pr-2 font-medium">Төлөв</th>
              <th className="py-1 pr-2 font-medium">Төлсөн</th>
            </tr>
          </thead>
          <tbody>
            {saruud.map((m) => {
              const zardal = m.zadargaa.filter((z) => !garaj(z.turul));
              const garajuud = m.zadargaa.filter((z) => garaj(z.turul));
              return (
                <React.Fragment key={m.sar}>
                  <tr className="border-t border-[color:var(--surface-border)] text-[color:var(--panel-text)]">
                    <td className="py-1.5 pr-2 font-medium">
                      {m.sar}
                      {m.nuusan ? <span className="ml-1 text-[11px] text-[color:var(--muted-text)]">(нуусан)</span> : null}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{mungu(m.dun)}</td>
                    <td className="py-1.5 pr-2 text-right">{m.aldangi ? mungu(m.aldangi) : "—"}</td>
                    <td className={`py-1.5 pr-2 ${m.tuluv === "Төлөгдсөн" ? "text-green-600" : "text-red-600"}`}>{m.tuluv}</td>
                    <td className="py-1.5 pr-2">
                      {m.tuluv === "Төлөгдсөн" ? (
                        <>
                          {ognoo(m.tulsunOgnoo)}
                          {m.tulburiinEkhSurvalj ? (
                            <span className="ml-1 text-[11px] text-[color:var(--muted-text)]">· {m.tulburiinEkhSurvalj}</span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  {m.zadargaa.length ? (
                    <tr>
                      <td colSpan={5} className="pb-2 pl-4 pr-2">
                        <div className="text-[11px] text-[color:var(--muted-text)]">
                          {zardal.map((z, i) => (
                            <div key={`z${i}`} className="flex justify-between">
                              <span>· {z.ner}</span>
                              <span>{mungu(z.dun)}</span>
                            </div>
                          ))}
                          {garajuud.map((z, i) => (
                            <div key={`g${i}`} className="flex justify-between">
                              <span>· Гараж — {z.ner}</span>
                              <span>{mungu(z.dun)}</span>
                            </div>
                          ))}
                          {!m.taarsan ? (
                            <div className="mt-0.5 text-orange-600">
                              Задаргааны нийлбэр {mungu(m.zadargaaNiit)} — биллийн дүнтэй таарахгүй
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
