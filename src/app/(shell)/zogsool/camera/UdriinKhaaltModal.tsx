"use client";

/**
 * Өдрийн хаалт — сонгосон өдрийн машины тоо ба мөнгөн дүнг автоматаар
 * нэгтгэнэ (кассчин гараар бөглөхгүй). Хэвлэж баталгаажуулна.
 */

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { Printer, X } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import { tulburiinZadargaaBodyo } from "@/lib/tulburiinZadargaa";

const KHUNGULULT = new Set(["khungulult", "discount", "Хөнгөлөлт"]);
const mnt = (n: number) => `${Math.round(n).toLocaleString("en-US")}₮`;

interface Props {
  token: string;
  baiguullagiinId?: string;
  barilgiinId?: string;
  onClose: () => void;
}

export default function UdriinKhaaltModal({ token, baiguullagiinId, barilgiinId, onClose }: Props) {
  const [udur, setUdur] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [jagsaalt, setJagsaalt] = useState<any[]>([]);
  const [achaalj, setAchaalj] = useState(false);

  useEffect(() => {
    if (!token || !baiguullagiinId || !udur) return;
    let khuchintei = true;
    setAchaalj(true);
    uilchilgee(token)
      .get("/zogsoolUilchluulegchJagsaalt", {
        params: {
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 10000,
          query: JSON.stringify({
            baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            createdAt: { $gte: `${udur} 00:00:00`, $lte: `${udur} 23:59:59` },
          }),
        },
      })
      .then((r) => khuchintei && setJagsaalt(r.data?.jagsaalt || []))
      .catch(() => khuchintei && setJagsaalt([]))
      .finally(() => khuchintei && setAchaalj(false));
    return () => {
      khuchintei = false;
    };
  }, [token, baiguullagiinId, barilgiinId, udur]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dun = useMemo(() => {
    const turluud = new Map<string, number>();
    let garsan = 0;
    let bodogdson = 0;
    let khungulult = 0;
    let tulsun = 0;
    let tulugdugui = 0;
    let ebarimt = 0;
    let unegui = 0;
    jagsaalt.forEach((t) => {
      const mur = t?.tuukh?.[0];
      const turul = t?.turul || mur?.turul || "Үйлчлүүлэгч";
      turluud.set(turul, (turluud.get(turul) || 0) + 1);
      if (!mur?.garsanKhaalga) return;
      garsan += 1;
      const niit = Number(t?.niitDun) || 0;
      const raw = mur?.tulbur;
      const tulbur: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const khung = tulbur
        .filter((p) => KHUNGULULT.has(p?.turul) || Number(p?.dun) < 0)
        .reduce((s, p) => s + Math.abs(Number(p?.dun) || 0), 0);
      const tul = tulbur
        .filter((p) => !KHUNGULULT.has(p?.turul) && Number(p?.dun) > 0)
        .reduce((s, p) => s + Number(p.dun), 0);
      bodogdson += niit;
      khungulult += khung;
      tulsun += tul;
      tulugdugui += Math.max(0, niit - khung - tul);
      if (tul <= 0) unegui += 1;
      else ebarimt += Number(t?.ebarimtAvsanDun ?? mur?.ebarimtAvsanDun) || 0;
    });
    return {
      niit: jagsaalt.length,
      garsan,
      dotor: jagsaalt.length - garsan,
      turluud: Array.from(turluud.entries()).sort((a, b) => b[1] - a[1]),
      bodogdson,
      khungulult,
      tulsun,
      tulugdugui,
      ebarimt,
      unegui,
      khelber: tulburiinZadargaaBodyo(jagsaalt).items.filter((i) => i.amount > 0),
    };
  }, [jagsaalt]);

  const khevlekh = () => {
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return;
    const mur = (k: string, v: string) =>
      `<tr><td>${k}</td><td style="text-align:right">${v}</td></tr>`;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Өдрийн хаалт ${udur}</title>
      <style>body{font:13px system-ui,sans-serif;padding:16px}h2{font-size:15px;margin:0 0 4px}
      h3{font-size:12px;margin:14px 0 4px;color:#555}table{width:100%;border-collapse:collapse}
      td{padding:3px 0;border-bottom:1px dashed #ddd}.b td{font-weight:600;border-top:1px solid #000}</style></head><body>
      <h2>Өдрийн хаалт</h2><div>${udur}</div>
      <h3>Машин</h3><table>${mur("Нийт орсон", String(dun.niit))}${mur("Гарсан", String(dun.garsan))}${mur("Дотор байгаа", String(dun.dotor))}
      ${dun.turluud.map(([k, v]) => mur(k, String(v))).join("")}</table>
      <h3>Төлбөрийн хэлбэр</h3><table>${dun.khelber.map((i) => mur(`${i.name} (${i.count})`, mnt(i.amount))).join("")}</table>
      <h3>Дүн</h3><table>${mur("Нийт бодогдсон", mnt(dun.bodogdson))}${mur("Хөнгөлөлт", mnt(dun.khungulult))}
      ${mur("Төлөөгүй", mnt(dun.tulugdugui))}${mur("И-баримт", mnt(dun.ebarimt))}${mur("Үнэгүй машин", String(dun.unegui))}
      <tr class="b"><td>Нийт орлого</td><td style="text-align:right">${mnt(dun.tulsun)}</td></tr></table>
      <p style="margin-top:28px">Хүлээлгэн өгсөн: ____________ &nbsp; Хүлээн авсан: ____________</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const Mur = ({ k, v, tod }: { k: string; v: React.ReactNode; tod?: string }) => (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-[color:var(--muted-text)]">{k}</span>
      <span className={`tabular-nums ${tod || "text-[color:var(--panel-text)]"}`}>{v}</span>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="modal-surface w-full max-w-[520px] overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--surface-border)] px-5 py-4">
          <div>
            <h2 className="text-[15px] text-[color:var(--panel-text)]">Өдрийн хаалт</h2>
            <p className="text-[12px] text-[color:var(--muted-text)]">Машин болон төлбөрийн дүн автоматаар бодогдоно</p>
          </div>
          <div className="flex items-center gap-2">
            <FilterDatePicker
              single
              value={udur}
              allowClear={false}
              onChange={(_, s) => s && setUdur(s)}
            />
            <button type="button" onClick={onClose} className="btn-minimal inline-flex h-9 w-9 items-center justify-center !p-0" aria-label="Хаах">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4">
          {achaalj ? (
            <p className="py-10 text-center text-[12px] text-[color:var(--muted-text)]">Уншиж байна...</p>
          ) : (
            <>
              <section>
                <h3 className="mb-1 text-[12px] text-[color:var(--muted-text)]">Машин</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Нийт орсон", dun.niit, "text-[color:var(--panel-text)]"],
                    ["Гарсан", dun.garsan, "text-[color:var(--panel-text)]"],
                    ["Дотор байгаа", dun.dotor, "text-sky-500"],
                  ].map(([k, v, c]) => (
                    <div key={String(k)} className="rounded-xl border border-[color:var(--surface-border)] px-3 py-2">
                      <div className="text-[11px] text-[color:var(--muted-text)]">{k}</div>
                      <div className={`text-[18px] tabular-nums ${c}`}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 divide-y divide-[color:var(--surface-border)]">
                  {dun.turluud.map(([k, v]) => (
                    <Mur key={k} k={k} v={v} />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-1 text-[12px] text-[color:var(--muted-text)]">Төлбөрийн хэлбэр</h3>
                <div className="divide-y divide-[color:var(--surface-border)]">
                  {dun.khelber.length === 0 && <Mur k="Төлбөр алга" v="—" />}
                  {dun.khelber.map((i) => (
                    <Mur key={i.key} k={`${i.name} · ${i.count}`} v={mnt(i.amount)} />
                  ))}
                </div>
              </section>

              <section className="divide-y divide-[color:var(--surface-border)]">
                <Mur k="Нийт бодогдсон" v={mnt(dun.bodogdson)} />
                <Mur k="Хөнгөлөлт" v={`−${mnt(dun.khungulult)}`} tod="text-brand" />
                <Mur k="Төлөөгүй" v={mnt(dun.tulugdugui)} tod={dun.tulugdugui > 0 ? "text-danger" : undefined} />
                <Mur k="И-баримт" v={mnt(dun.ebarimt)} />
                <Mur k="Үнэгүй машин" v={dun.unegui} />
              </section>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-5 py-3">
          <div>
            <div className="text-[11px] text-[color:var(--muted-text)]">Нийт орлого</div>
            <div className="text-[17px] tabular-nums text-brand">{mnt(dun.tulsun)}</div>
          </div>
          <button
            type="button"
            onClick={khevlekh}
            disabled={achaalj}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-theme px-4 text-[13px] !text-white disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Хэвлэх
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
