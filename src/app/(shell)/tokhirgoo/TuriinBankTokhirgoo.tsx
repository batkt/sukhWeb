"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput as MTextInput } from "@mantine/core";
import { Landmark, Link2, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { SettingsCard, SettingsItem, Switch } from "./SettingsRow";

/**
 * Төрийн банк (BPay) горим — байгууллага бүрээр.
 */

type Barilga = { barilgiinId: string; ner: string; bpayBairId: string };
type Ajil = {
  ajillajBaina: boolean;
  ekhelsen?: string;
  duussan?: string | null;
  ur?: any;
  aldaa?: string | null;
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
  const [ekhelsenOgnoo, setEkhelsenOgnoo] = useState("");
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
      const { data } = await uilchilgee(token).get("/bpay/tokhirgoo");
      const t = data?.tokhirgoo || {};
      setIdevkhtei(!!t.idevkhtei);
      setEkhelsenOgnoo(t.ekhelsenOgnoo ? String(t.ekhelsenOgnoo).slice(0, 10) : "");
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
      await uilchilgee(token).post("/bpay/tokhirgoo", {
        bpayEkhelsenOgnoo: ekhelsenOgnoo || null,
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
      ? "Төрийн банк (BPay) горимыг асаах уу?\n\n" +
        "• СӨХ-ийн төлбөрийг зөвхөн BPay нэхэмжилнэ.\n" +
        "• Sukh нэхэмжлэх, QPay, алданги зөвхөн лавлагаа болно.\n" +
        "• Тоотуудыг BPay-д бүрэн холбосон эсэхээ шалгана уу."
      : "Төрийн банк горимыг унтраах уу?";
    if (!window.confirm(batalgaa)) return;
    const umnukh = idevkhtei;
    setIdevkhtei(utga);
    try {
      await uilchilgee(token).post("/bpay/tokhirgoo", { bpayAshiglakhEsekh: utga });
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
    if (window.confirm("BPay-ээс бүх биллийг албадан синк хийх үү?")) {
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
      title="Төрийн банк (BPay)"
      subtitle="СӨХ-ийн төлбөрийг BPay-ээр дамжуулах нэгдсэн горим."
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
      {/* 1. Билл эхлэх огноо */}
      <SettingsItem
        icon={<Landmark />}
        title="Билл эхлэх огноо"
        desc="Энэ огнооноос хойших төлбөрийг BPay-ээр тооцно."
      >
        <div className="stg-inline">
          <StandardDatePicker
            value={ekhelsenOgnoo || null}
            onChange={(_d, dateStr) => setEkhelsenOgnoo(dateStr || "")}
            placeholder="Огноо сонгох"
            allowClear
            style={{ width: "190px", height: "36px" }}
          />
        </div>
      </SettingsItem>

      {/* 2. Барилгын хаяг */}
      <SettingsItem
        icon={<Search />}
        title="Барилгын хаяг"
        desc="Барилга тус бүрийг BPay-ийн хаягтай холбох."
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
                  aria-label={`${b.ner} BPay хаяг хайх`}
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
            {ajil.kholbokh?.ajillajBaina ? "Холбож байна…" : "Тоот холбох"}
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
                BPay-д алга: {kholbokhUr.oldoogui.length}
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
