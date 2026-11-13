"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput as MTextInput } from "@mantine/core";
import { Landmark, Link2, ListX, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { SettingsCard, SettingsItem, Switch } from "./SettingsRow";

/**
 * Төрийн банк (BPay) горим — байгууллага бүрээр.
 */

type Barilga = { barilgiinId: string; ner: string; bpayBairId: string };
type KholbogdooguiMur = {
  gereeniiId: string;
  barilga: string;
  toot: string;
  gereeniiDugaar: string;
  ner: string;
  utas: string;
  shaltgaan: string;
};

/** Холбогдоогүй тоотуудыг CSV (Excel-д нээгдэнэ) болгож татна. */
function csvTatakh(muruud: KholbogdooguiMur[]) {
  const q = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const tolgoi = ["Барилга", "Тоот", "Гэрээ", "Нэр", "Утас", "Шалтгаан"];
  const mur = muruud.map((m) => [m.barilga, m.toot, m.gereeniiDugaar, m.ner, m.utas, m.shaltgaan].map(q).join(","));
  // ﻿ (BOM) — Excel кирилл үсгийг зөв уншина
  const blob = new Blob(["﻿" + [tolgoi.map(q).join(","), ...mur].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kholbogdoogui_toot.csv";
  a.click();
  URL.revokeObjectURL(url);
}
type Ajil = {
  ajillajBaina: boolean;
  ekhelsen?: string;
  duussan?: string | null;
  ur?: any;
  aldaa?: string | null;
  yavts?: { niit: number; duussan: number };
} | null;

const aldaaZurvas = (e: any) =>
  e?.response?.data?.message || e?.response?.data?.aldaa || e?.message || "Алдаа гарлаа";

/** Тохиргоо → Байгууллага → «Төрийн банк» цэсний хуудас. */
export default function TuriinBankTokhirgoo() {
  return (
    <div className="w-full">
      <div className="allow-overflow">
        <div className="stg-page stg-page-grid">
          <TuriinBankKart />
        </div>
      </div>
    </div>
  );
}

function TuriinBankKart() {
  const { token } = useAuth();
  const [achaalj, setAchaalj] = useState(true);
  const [idevkhtei, setIdevkhtei] = useState(false);
  const [barilguud, setBarilguud] = useState<Barilga[]>([]);
  const [kholboltToo, setKholboltToo] = useState(0);
  const [billToo, setBillToo] = useState(0);
  const [ajil, setAjil] = useState<{ kholbokh: Ajil; sync: Ajil }>({ kholbokh: null, sync: null });
  const [khadgalj, setKhadgalj] = useState(false);
  const [khaikh, setKhaikh] = useState<Record<string, string>>({});
  const [ilertsuud, setIlertsuud] = useState<Record<string, { bairId: string; ner: string }[]>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const achaalakh = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await uilchilgee(token).get("/bpay/medeelel");
      const t = data?.tokhirgoo || {};
      setIdevkhtei(!!t.idevkhtei);
      setBarilguud(Array.isArray(t.barilguud) ? t.barilguud : []);
      setKholboltToo(data?.kholboltToo || 0);
      setBillToo(data?.billToo || 0);
      setAjil(data?.ajil || { kholbokh: null, sync: null });
    } catch (e) {
      openErrorOverlay(aldaaZurvas(e));
    } finally {
      setAchaalj(false);
    }
  }, [token]);

  useEffect(() => {
    achaalakh();
  }, [achaalakh]);

  // Холбох/синк ажиллаж байх үед 3 секунд тутам төлөв шалгана.
  const ajillajBaina = !!(ajil.kholbokh?.ajillajBaina || ajil.sync?.ajillajBaina);
  useEffect(() => {
    if (!ajillajBaina || !token) return;
    timerRef.current = setInterval(async () => {
      try {
        const { data } = await uilchilgee(token).get("/bpay/tuluv");
        setAjil(data?.ajil || { kholbokh: null, sync: null });
        if (!data?.ajil?.kholbokh?.ajillajBaina && !data?.ajil?.sync?.ajillajBaina) achaalakh();
      } catch {
        /* дараагийн удаа */
      }
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ajillajBaina, token, achaalakh]);

  const khadgalakh = async () => {
    if (!token) return;
    setKhadgalj(true);
    try {
      await uilchilgee(token).post("/bpay/medeelel", {
        barilguud: barilguud.map((b) => ({ barilgiinId: b.barilgiinId, bpayBairId: b.bpayBairId })),
      });
      openSuccessOverlay("Төрийн банкны тохиргоо хадгалагдлаа");
      await achaalakh();
    } catch (e) {
      openErrorOverlay(aldaaZurvas(e));
    } finally {
      setKhadgalj(false);
    }
  };

  const asaakhUntraakh = async (utga: boolean) => {
    if (!token) return;
    const batalgaa = utga
      ? "Төрийн банк горимыг асаах уу?\n\n" +
        "• СӨХ-ийн төлбөрийг зөвхөн Төрийн банк нэхэмжилнэ.\n" +
        "• Sukh нэхэмжлэх, QPay, алданги зөвхөн лавлагаа болно.\n" +
        "• Тоотуудыг Төрийн банкинд бүрэн холбосон эсэхээ шалгана уу."
      : "Төрийн банк горимыг унтраах уу?";
    if (!window.confirm(batalgaa)) return;
    const umnukh = idevkhtei;
    setIdevkhtei(utga);
    try {
      await uilchilgee(token).post("/bpay/medeelel", { bpayAshiglakhEsekh: utga });
      openSuccessOverlay(utga ? "Төрийн банк горим асаалаа" : "Төрийн банк горим унтарлаа");
      await achaalakh();
    } catch (e) {
      setIdevkhtei(umnukh);
      openErrorOverlay(aldaaZurvas(e));
    }
  };

  const bairKhaikh = async (barilgiinId: string) => {
    if (!token) return;
    const q = (khaikh[barilgiinId] || "").trim();
    if (!q) return;
    try {
      const { data } = await uilchilgee(token).get("/bpay/bairKhaikh", { params: { q } });
      setIlertsuud((s) => ({ ...s, [barilgiinId]: data?.jagsaalt || [] }));
      if (!data?.jagsaalt?.length) openErrorOverlay("Тохирох байр олдсонгүй");
    } catch (e) {
      openErrorOverlay(aldaaZurvas(e));
    }
  };

  const bairSongokh = (barilgiinId: string, bairId: string) => {
    setBarilguud((bs) => bs.map((b) => (b.barilgiinId === barilgiinId ? { ...b, bpayBairId: bairId } : b)));
    setIlertsuud((s) => ({ ...s, [barilgiinId]: [] }));
  };

  const ajilEkhluulekh = async (zam: string, body: Record<string, unknown> = {}) => {
    if (!token) return;
    try {
      const { data } = await uilchilgee(token).post(zam, body);
      if (data?.ajillajBaina) openErrorOverlay("Өмнөх ажил дуусаагүй байна");
      else openSuccessOverlay("Ажил эхэллээ");
      const t = await uilchilgee(token).get("/bpay/tuluv");
      setAjil(t.data?.ajil || { kholbokh: null, sync: null });
    } catch (e) {
      openErrorOverlay(aldaaZurvas(e));
    }
  };

  const khuchneerSync = () => {
    if (window.confirm("Төрийн банкнаас бүх биллийг албадан синк хийх үү?")) {
      ajilEkhluulekh("/bpay/sync", { albadakh: true });
    }
  };

  const kholbokhUr = ajil.kholbokh?.ur;
  const syncUr = ajil.sync?.ur;

  return (
    <SettingsCard
      id="nemelt-turiin-bank-box"
      className="stg-card-wide"
      icon={<Landmark />}
      title="Төрийн банк"
      subtitle="СӨХ-ийн төлбөрийг Төрийн банкаар дамжуулах горим."
      toggle={
        <Switch
          checked={idevkhtei}
          onChange={(e) => asaakhUntraakh(e.currentTarget.checked)}
          label="Төрийн банк горим"
        />
      }
      onSave={khadgalakh}
      saving={khadgalj || achaalj}
    >
      {/* 2. Барилгын хаяг */}
      <SettingsItem
        icon={<Search />}
        title="Барилгын хаяг"
        desc="Барилга тус бүрийг Төрийн банкны хаягтай холбох."
      >
        <div className="flex flex-col gap-2.5">
          {barilguud.map((b) => (
            <div key={b.barilgiinId} className="flex flex-col gap-1.5">
              <div className="stg-inline items-center gap-2">
                <span className="min-w-36 font-medium text-xs">{b.ner || b.barilgiinId}</span>
                <MTextInput
                  value={khaikh[b.barilgiinId] ?? ""}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setKhaikh((s) => ({ ...s, [b.barilgiinId]: v }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") bairKhaikh(b.barilgiinId);
                  }}
                  placeholder="Байр хайх..."
                  size="xs"
                  className="w-44"
                  aria-label={`${b.ner} хаяг хайх`}
                />
                <button type="button" className="stg-btn" onClick={() => bairKhaikh(b.barilgiinId)}>
                  Хайх
                </button>
                <span
                  className={
                    b.bpayBairId
                      ? "stg-chip !text-emerald-700 !bg-emerald-50 border border-emerald-200"
                      : "stg-chip !text-slate-400 !bg-slate-50 border border-slate-200"
                  }
                >
                  {b.bpayBairId ? `Холбогдсон (${b.bpayBairId.slice(0, 8)}…)` : "Тохируулаагүй"}
                </span>
              </div>
              {(ilertsuud[b.barilgiinId] || []).length ? (
                <div className="flex flex-wrap gap-1.5 pl-1 mt-1">
                  {(ilertsuud[b.barilgiinId] || []).map((x) => (
                    <button
                      key={x.bairId}
                      type="button"
                      className="stg-btn text-xs !py-1 !px-2.5"
                      onClick={() => bairSongokh(b.barilgiinId, x.bairId)}
                    >
                      {x.ner}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {!barilguud.length && !achaalj ? <span className="stg-inline-hint">Барилга олдсонгүй</span> : null}
        </div>
      </SettingsItem>

      {/* 3. Тоот холболт */}
      <SettingsItem
        icon={<Link2 />}
        title="Тоот холболт"
        desc={`Холбогдсон: ${kholboltToo} тоот`}
        control={
          <button
            type="button"
            className="stg-btn"
            disabled={!idevkhtei || !!ajil.kholbokh?.ajillajBaina}
            title={idevkhtei ? undefined : "Эхлээд горимоо асаана уу"}
            onClick={() => ajilEkhluulekh("/bpay/khayagKholbokh")}
          >
            {ajil.kholbokh?.ajillajBaina
              ? ajil.kholbokh.yavts?.niit
                ? `Холбож байна… ${ajil.kholbokh.yavts.duussan}/${ajil.kholbokh.yavts.niit}`
                : "Бэлдэж байна…"
              : "Тоот холбох"}
          </button>
        }
      >
        {ajil.kholbokh?.aldaa ? <p className="text-red-600 text-xs mt-1">{ajil.kholbokh.aldaa}</p> : null}
        {kholbokhUr ? (
          <div className="flex items-center gap-1.5 flex-wrap text-xs mt-1.5">
            <span className="stg-chip">Нийт: {kholbokhUr.niit}</span>
            <span className="stg-chip !bg-emerald-50 !text-emerald-700">Шинэ: {kholbokhUr.shine}</span>
            <span className="stg-chip">Өмнөх: {kholbokhUr.umnukh}</span>
            {kholbokhUr.oldoogui?.length ? (
              <span className="stg-chip" title={kholbokhUr.oldoogui.join(", ")}>
                Банкинд алга: {kholbokhUr.oldoogui.length}
              </span>
            ) : null}
            {kholbokhUr.salgasan?.length ? (
              <span className="stg-chip" title={kholbokhUr.salgasan.join(", ")}>
                Салгасан: {kholbokhUr.salgasan.length}
              </span>
            ) : null}
            {kholbokhUr.utasgui?.length ? (
              <span className="stg-chip" title={kholbokhUr.utasgui.join(", ")}>
                Утасгүй: {kholbokhUr.utasgui.length}
              </span>
            ) : null}
            {kholbokhUr.olonKhereglegch?.length ? (
              <span
                className="stg-chip"
                title={kholbokhUr.olonKhereglegch.map((x: { toot: string }) => x.toot).join(", ")}
              >
                Шалгах: {kholbokhUr.olonKhereglegch.length}
              </span>
            ) : null}
            {kholbokhUr.aldaa?.length ? (
              <span className="stg-chip !bg-rose-50 !text-rose-700">Алдаа: {kholbokhUr.aldaa.length}</span>
            ) : null}
          </div>
        ) : null}
      </SettingsItem>

      {/* 3б. Холбогдоогүй тоот */}
      <KholbogdooguiTootuud token={token} idevkhtei={idevkhtei} />

      {/* 4. Билл синк хийх */}
      <SettingsItem
        icon={<RefreshCw />}
        title="Билл синк хийх"
        desc={`Хадгалсан: ${billToo} билл`}
        control={
          <button
            type="button"
            className="stg-btn"
            disabled={!idevkhtei || !!ajil.sync?.ajillajBaina}
            onClick={() => ajilEkhluulekh("/bpay/sync")}
          >
            {ajil.sync?.ajillajBaina ? "Синк хийж байна…" : "Синк хийх"}
          </button>
        }
      >
        {ajil.sync?.aldaa ? <p className="text-red-600 text-xs mt-1">{ajil.sync.aldaa}</p> : null}
        {syncUr && !syncUr.algassan ? (
          <div className="flex flex-col gap-1 mt-1.5">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="stg-chip">Шинэ: {syncUr.shineBill || 0}</span>
              <span className="stg-chip !bg-emerald-50 !text-emerald-700">Төлөгдсөн: {syncUr.tulsun || 0}</span>
              <span className="stg-chip !bg-amber-50 !text-amber-700">Хүлээгдэж буй: {syncUr.khuleegdej || 0}</span>
              {syncUr.batalgaajaagui ? (
                <span className="stg-chip" title="Билл алга болсон ч холболт нь баталгаажаагүй тул төлсөн гэж тооцоогүй">
                  Баталгаагүй: {syncUr.batalgaajaagui}
                </span>
              ) : null}
              {syncUr.aldaatai ? (
                <span className="stg-chip !bg-rose-50 !text-rose-700">Алдаатай: {syncUr.aldaatai}</span>
              ) : null}
            </div>
            {syncUr.zogsoson ? (
              <div className="stg-inline mt-1">
                <span className="text-red-600 text-xs">{syncUr.sanuulga}</span>
                <button type="button" className="stg-btn text-xs" onClick={khuchneerSync}>
                  Үргэлжлүүлэх
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </SettingsItem>
    </SettingsCard>
  );
}

function KholbogdooguiTootuud({ token, idevkhtei }: { token?: string | null; idevkhtei: boolean }) {
  const [muruud, setMuruud] = useState<KholbogdooguiMur[] | null>(null);
  const [achaalj, setAchaalj] = useState(false);
  const [barilga, setBarilga] = useState("");
  const [songogdson, setSongogdson] = useState<KholbogdooguiMur | null>(null);

  const achaalakh = async () => {
    if (!token) return;
    setAchaalj(true);
    try {
      const { data } = await uilchilgee(token).get("/bpay/kholbogdoogui");
      setMuruud(Array.isArray(data?.jagsaalt) ? data.jagsaalt : []);
    } catch (e) {
      openErrorOverlay(aldaaZurvas(e));
    } finally {
      setAchaalj(false);
    }
  };

  const barilguud = muruud ? [...new Set(muruud.map((m) => m.barilga))] : [];
  const kharuulakh = (muruud || []).filter((m) => !barilga || m.barilga === barilga);

  return (
    <SettingsItem
      icon={<ListX />}
      title="Холбогдоогүй тоот"
      desc={muruud ? `${muruud.length} тоот` : "Бүх барилгын холбогдоогүй тоот, шалтгаантай"}
      control={
        <div className="stg-inline">
          {muruud?.length ? (
            <button type="button" className="stg-btn" onClick={() => csvTatakh(kharuulakh)}>
              Excel татах
            </button>
          ) : null}
          <button type="button" className="stg-btn" disabled={!idevkhtei || achaalj} onClick={achaalakh}>
            {achaalj ? "Ачаалж байна…" : muruud ? "Шинэчлэх" : "Жагсаалт"}
          </button>
        </div>
      }
    >
      {muruud && muruud.length ? (
        <div className="mt-2">
          {barilguud.length > 1 ? (
            <div className="flex items-center gap-1.5 flex-wrap text-xs mb-2">
              <button type="button" className={`stg-chip ${!barilga ? "!bg-emerald-50 !text-emerald-700" : ""}`} onClick={() => setBarilga("")}>
                Бүгд: {muruud.length}
              </button>
              {barilguud.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`stg-chip ${barilga === b ? "!bg-emerald-50 !text-emerald-700" : ""}`}
                  onClick={() => setBarilga(b)}
                >
                  {b || "—"}: {muruud.filter((m) => m.barilga === b).length}
                </button>
              ))}
            </div>
          ) : null}
          <div className="max-h-[360px] overflow-auto rounded-lg border border-[color:var(--surface-border)]">
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0 bg-[color:var(--surface-bg)]">
                <tr className="text-left text-[color:var(--muted-text)]">
                  <th className="py-1 px-2 font-medium">Барилга</th>
                  <th className="py-1 px-2 font-medium">Тоот</th>
                  <th className="py-1 px-2 font-medium">Нэр</th>
                  <th className="py-1 px-2 font-medium">Утас</th>
                  <th className="py-1 px-2 font-medium">Шалтгаан</th>
                  <th className="py-1 px-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {kharuulakh.map((m) => (
                  <tr key={m.gereeniiId} className="border-t border-[color:var(--surface-border)] text-[color:var(--panel-text)]">
                    <td className="py-1 px-2 whitespace-nowrap">{m.barilga || "—"}</td>
                    <td className="py-1 px-2 whitespace-nowrap">{m.toot}</td>
                    <td className="py-1 px-2">{m.ner || "—"}</td>
                    <td className="py-1 px-2 whitespace-nowrap">{m.utas || "—"}</td>
                    <td className="py-1 px-2">{m.shaltgaan}</td>
                    <td className="py-1 px-2 text-right">
                      <button
                        type="button"
                        className="stg-btn !py-0.5 !px-2 !text-[11px]"
                        onClick={() => setSongogdson(m)}
                        title="Оршин суугчийн нэрийн өмнөөс Төрийн банкинд холбох"
                      >
                        <Link2 className="h-3.5 w-3.5" /> Холбох
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : muruud ? (
        <p className="text-xs mt-1 text-emerald-700">Бүх тоот холбогдсон.</p>
      ) : null}
      {songogdson && (
        <GaraarKholbokhTsonkh
          token={token}
          mur={songogdson}
          onClose={() => setSongogdson(null)}
          onKholbogdson={(gereeniiId) => {
            setMuruud((prev) => (prev ? prev.filter((x) => x.gereeniiId !== gereeniiId) : prev));
            setSongogdson(null);
          }}
        />
      )}
    </SettingsItem>
  );
}

type Songolt = { customerId: string; customerCode: string; customerName: string; customerAddress: string };

/**
 * Нэг тоотыг гараар холбох — оршин суугч апп-аас «хаяг нэмэх»-тэй ижил:
 * Төрийн банкнаас хаягаар хайж → хэрэглэгчээ сонгож → холбоно (шууд синк).
 */
function GaraarKholbokhTsonkh({
  token,
  mur,
  onClose,
  onKholbogdson,
}: {
  token?: string | null;
  mur: KholbogdooguiMur;
  onClose: () => void;
  onKholbogdson: (gereeniiId: string) => void;
}) {
  const [utas, setUtas] = useState(mur.utas.split(",")[0]?.trim() || "");
  const [doorNo, setDoorNo] = useState(mur.toot);
  const [bairId, setBairId] = useState("");
  const [barilguud, setBarilguud] = useState<{ ner: string; bpayBairId: string }[]>([]);
  const [songoltuud, setSongoltuud] = useState<Songolt[] | null>(null);
  const [songoson, setSongoson] = useState("");
  const [khaij, setKhaij] = useState(false);
  const [kholboj, setKholboj] = useState(false);
  const [zurvas, setZurvas] = useState("");

  const khaikh = useCallback(
    async (anhnii = false) => {
      if (!token) return;
      setKhaij(true);
      setZurvas("");
      setSongoson("");
      try {
        const { data } = await uilchilgee(token).get("/bpay/garaarKhaikh", {
          params: anhnii ? { gereeniiId: mur.gereeniiId } : { gereeniiId: mur.gereeniiId, utas, doorNo, bairId },
        });
        if (anhnii) {
          if (data.utas) setUtas(data.utas);
          if (data.doorNo) setDoorNo(data.doorNo);
          if (data.bairId) setBairId(data.bairId);
        }
        setBarilguud(Array.isArray(data.barilguud) ? data.barilguud : []);
        const list: Songolt[] = Array.isArray(data.songoltuud) ? data.songoltuud : [];
        setSongoltuud(list);
        if (list.length === 1) setSongoson(list[0].customerId);
        if (data.aldaa) setZurvas(data.aldaa);
        else if (!list.length) setZurvas("Энэ хаягаар Төрийн банкинд хэрэглэгч олдсонгүй. Байр, тоотоо шалгана уу.");
      } catch (e) {
        setSongoltuud([]);
        setZurvas(aldaaZurvas(e));
      } finally {
        setKhaij(false);
      }
    },
    [token, mur.gereeniiId, utas, doorNo, bairId],
  );

  // Нээгдэхэд гэрээний анхдагч утгуудаар шууд хайна
  const ekhelsen = useRef(false);
  useEffect(() => {
    if (ekhelsen.current) return;
    ekhelsen.current = true;
    void khaikh(true);
  }, [khaikh]);

  const kholbokh = async () => {
    if (!token || !songoson) return;
    setKholboj(true);
    try {
      const { data } = await uilchilgee(token).post("/bpay/garaarKholbokh", {
        gereeniiId: mur.gereeniiId,
        customerId: songoson,
        utas,
        doorNo,
        bairId,
      });
      const shineBill = data?.sync?.shineBill;
      openSuccessOverlay(
        `${mur.barilga ? mur.barilga + " · " : ""}${mur.toot} тоот холбогдлоо${
          typeof shineBill === "number" ? ` (${shineBill} билл татлаа)` : ""
        }`,
      );
      onKholbogdson(mur.gereeniiId);
    } catch (e) {
      setZurvas(aldaaZurvas(e));
    } finally {
      setKholboj(false);
    }
  };

  const input =
    "w-full rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 py-1.5 text-[13px] text-[color:var(--panel-text)] outline-none focus:border-[color:var(--theme)]";

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={kholboj ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5 shadow-2xl">
        <h3 className="text-sm font-medium text-[color:var(--panel-text)]">
          Төрийн банкинд холбох — {mur.barilga ? `${mur.barilga} · ` : ""}
          {mur.toot} тоот
        </h3>
        <p className="mt-1 text-xs text-[color:var(--muted-text)]">
          {mur.ner || "Оршин суугч"} — апп-аас «хаяг нэмэх»-тэй ижил: хаягаар хайж, хэрэглэгчээ сонгоод холбоно.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <label className="col-span-3 text-[11px] text-[color:var(--muted-text)]">
            Оршин суугчийн утас (Төрийн банкны бүртгэл)
            <input className={input} value={utas} onChange={(e) => setUtas(e.target.value)} maxLength={8} />
          </label>
          <label className="col-span-2 text-[11px] text-[color:var(--muted-text)]">
            Банкны байр
            <select className={input} value={bairId} onChange={(e) => setBairId(e.target.value)}>
              {barilguud.map((b) => (
                <option key={b.bpayBairId} value={b.bpayBairId}>
                  {b.ner}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-[color:var(--muted-text)]">
            Тоот
            <input className={input} value={doorNo} onChange={(e) => setDoorNo(e.target.value)} />
          </label>
        </div>
        <button type="button" className="stg-btn mt-2" disabled={khaij} onClick={() => void khaikh(false)}>
          <Search className="h-3.5 w-3.5" /> {khaij ? "Хайж байна…" : "Дахин хайх"}
        </button>

        <div className="mt-3 max-h-56 space-y-1.5 overflow-auto">
          {songoltuud?.map((s) => (
            <label
              key={s.customerId}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-[12px] ${
                songoson === s.customerId
                  ? "border-[color:var(--theme)] bg-emerald-50/60"
                  : "border-[color:var(--surface-border)]"
              }`}
            >
              <input
                type="radio"
                name="bpaySongolt"
                className="mt-0.5"
                checked={songoson === s.customerId}
                onChange={() => setSongoson(s.customerId)}
              />
              <span className="text-[color:var(--panel-text)]">
                {s.customerName || "—"} · <span className="text-[color:var(--muted-text)]">{s.customerCode}</span>
                <br />
                <span className="text-[color:var(--muted-text)]">{s.customerAddress}</span>
              </span>
            </label>
          ))}
        </div>
        {zurvas && <p className="mt-2 text-xs text-[color:var(--warning,#d97706)]">{zurvas}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="stg-btn" disabled={kholboj} onClick={onClose}>
            Болих
          </button>
          <button
            type="button"
            className="stg-btn stg-btn-primary"
            disabled={!songoson || kholboj || khaij}
            onClick={() => void kholbokh()}
          >
            <Link2 className="h-3.5 w-3.5" /> {kholboj ? "Холбож байна…" : "Холбох"}
          </button>
        </div>
      </div>
    </div>
  );
}
