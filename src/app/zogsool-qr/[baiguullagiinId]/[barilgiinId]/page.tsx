"use client";

/**
 * Гадаа наалтын QR-аар зогсоолын төлбөр төлөх нийтийн (нэвтрэлтгүй) хуудас.
 *
 * QR: /zogsool-qr/<baiguullagiinId>/<barilgiinId>
 *
 * Мобайл хэрэглэгчид зориулсан сайжруулсан responsive загвар:
 *   - 100dvh ба safe-area-inset зохицуулалт (гар утсан дээр дэлгэцнээс халихгүй)
 *   - Банкны аппаар шууд нээх болон QR-аар уншуулах таб
 *   - Тав тухтай товчнууд, хялбар дугаар цэвэрлэх (X) товч
 *   - И-Баримтын дижитал тасалбар + Сугалаа/ДДТД нэг товшилтоор хуулах
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  CarFront,
  Clock,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Receipt,
  Building2,
  User,
  X,
  Copy,
  Check,
  Smartphone,
  QrCode,
} from "lucide-react";
import ThemedLogo from "@/components/ui/ThemedLogo";
import uilchilgee, { socket } from "@/lib/uilchilgee";

type Alkham = "dugaar" | "songolt" | "qpay" | "amjilttai";

interface ZogsooliinTokhirgoo {
  _id: string;
  ner: string;
  garakhTsag: number;
  undsenUne: number;
  zogsooliinDans: string | null;
}

interface MashiniiMedeelel {
  session_id: string;
  parking_id: string;
  plate_number: string;
  pay_amount: number;
  enter_date: string;
  garsanCameraIP?: string | null;
}

const dunFormat = (n: number) =>
  new Intl.NumberFormat("mn-MN").format(Math.round(Number(n) || 0)) + " ₮";

/** QPay нэхэмжлэх хэр хугацаанд хүчинтэй байхыг хариу заагаагүй үеийн нөөц (минут) */
const QPAY_KHUGATSAA_MIN = 5;

/** "X минут дотор гарна уу" гэж мэдэгдэх хэвийн хугацаа */
const GARAKH_KHUGATSAA_STANDART = 30;

const garakhKhugatsaaAvya = (n?: number): number => {
  const t = Number(n);
  return Number.isFinite(t) && t > 0 && t <= 120 ? t : GARAKH_KHUGATSAA_STANDART;
};

/** Монгол улсын автомашины дугаар: 4 тоо + 3 кирил үсэг (жнь 1234УБА). */
const DUGAARIIN_KHELBER = /^[0-9]{4}[А-ЯЁӨҮ]{3}$/u;

const dugaarTseverleye = (v: string): string => {
  const tom = v.toUpperCase();
  const toonuud = tom.replace(/[^0-9]/g, "").slice(0, 4);
  const useguud = tom.replace(/[^А-ЯЁӨҮ]/gu, "").slice(0, 3);
  return toonuud + useguud;
};

const qrTekstAvya = (q: any): string => q?.qr_code || q?.qr_text || "";

export default function ZogsoolQrPage() {
  const params = useParams();
  const baiguullagiinId = params?.baiguullagiinId as string;
  const barilgiinId = params?.barilgiinId as string;

  const [token, setToken] = useState<string | null>(null);
  const [tokhirgoo, setTokhirgoo] = useState<ZogsooliinTokhirgoo | null>(null);
  const [ekhniiAldaa, setEkhniiAldaa] = useState<string | null>(null);

  const [alkham, setAlkham] = useState<Alkham>("dugaar");
  const [dugaar, setDugaar] = useState("");
  const [mashin, setMashin] = useState<MashiniiMedeelel | null>(null);
  const [tulsunDun, setTulsunDun] = useState(0);

  const [ajillaj, setAjillaj] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);

  const [qpay, setQpay] = useState<any>(null);
  const [qpayTab, setQpayTab] = useState<"apps" | "qr">("apps");
  const [zakhialgiinDugaar, setZakhialgiinDugaar] = useState<string | null>(null);
  const [uldsenSekund, setUldsenSekund] = useState(QPAY_KHUGATSAA_MIN * 60);

  // ── И-Баримт төлөв ────────────────────────────────────────────────────
  const [ebarimtTurul, setEbarimtTurul] = useState<"1" | "3">("1");
  const [ebarimtRegister, setEbarimtRegister] = useState("");
  const [ebarimtData, setEbarimtData] = useState<any>(null);
  const [ebarimtLoading, setEbarimtLoading] = useState(false);
  const [ebarimtAldaa, setEbarimtAldaa] = useState<string | null>(null);

  // Санах ойд хуулсан төлөв
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyText = (txt: string, field: string) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const garakhKhugatsaa = garakhKhugatsaaAvya(tokhirgoo?.garakhTsag);

  // ── Хуудас ачаалах: зочны token + зогсоолын мэдээлэл ──────────────────
  useEffect(() => {
    if (!baiguullagiinId || !barilgiinId) return;
    let khuchintei = true;

    (async () => {
      try {
        const { data } = await uilchilgee().get(
          `/zochiniiTokenAvya/${baiguullagiinId}`,
        );
        if (khuchintei)
          setToken(typeof data === "string" ? data : data?.token || null);
      } catch {
        /* нөөц token */
      }

      try {
        const { data } = await uilchilgee().get(
          `/zogsool/qr/medeelel/${baiguullagiinId}/${barilgiinId}`,
        );
        if (!khuchintei) return;
        if (data?.success) setTokhirgoo(data.data);
        else setEkhniiAldaa(data?.message || "Зогсоолын мэдээлэл олдсонгүй");
      } catch (err: any) {
        if (!khuchintei) return;
        const status = err?.response?.status;
        setEkhniiAldaa(
          err?.response?.data?.message ||
            `Зогсоолын мэдээлэл олдсонгүй${status ? ` (${status})` : ""}`,
        );
      }
    })();

    return () => {
      khuchintei = false;
    };
  }, [baiguullagiinId, barilgiinId]);

  // ── И-Баримт шивэх функц ──────────────────────────────────────────────
  const ebarimtDuudya = useCallback(
    async (sessionId?: string, dun?: number) => {
      const sId = sessionId || mashin?.session_id;
      if (!sId) return;
      setEbarimtLoading(true);
      setEbarimtAldaa(null);
      try {
        let authTkn = token;
        if (!authTkn) {
          try {
            const { data: tData } = await uilchilgee().get(
              `/zochiniiTokenAvya/${baiguullagiinId}`,
            );
            authTkn =
              typeof tData === "string" ? tData : tData?.token || null;
            if (authTkn) setToken(authTkn);
          } catch {}
        }

        const { data } = await uilchilgee(authTkn || "").post("/ebarimtShivye", {
          id: sId,
          type: ebarimtTurul,
          register: ebarimtRegister.trim(),
          baiguullagiinId,
          barilgiinId,
          zogsooliinId: mashin?.parking_id || tokhirgoo?._id,
        });

        if (data?.success || data?.lottery || data?.qrData) {
          setEbarimtData(data);
        } else {
          setEbarimtAldaa(
            data?.error || data?.message || "И-Баримт үүсгэж чадсангүй",
          );
        }
      } catch (err: any) {
        setEbarimtAldaa(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            "И-Баримт үүсгэхэд алдаа гарлаа",
        );
      } finally {
        setEbarimtLoading(false);
      }
    },
    [
      mashin?.session_id,
      mashin?.parking_id,
      token,
      baiguullagiinId,
      barilgiinId,
      tokhirgoo?._id,
      ebarimtTurul,
      ebarimtRegister,
    ],
  );

  // ── QPay төлөгдсөнийг socket + poll-оор хянах ─────────────────────────
  const qpayTulugdlee = useCallback(
    (dun: number) => {
      setTulsunDun(dun);
      setAlkham("amjilttai");
      if (mashin?.session_id) {
        ebarimtDuudya(mashin.session_id, dun);
      }
    },
    [mashin?.session_id, ebarimtDuudya],
  );

  useEffect(() => {
    if (alkham !== "qpay" || !zakhialgiinDugaar) return;

    const s = socket();
    const suvag = `qpay/${baiguullagiinId}/${zakhialgiinDugaar}`;
    const onTulugdluu = () => qpayTulugdlee(Number(mashin?.pay_amount || 0));
    s.on(suvag, onTulugdluu);

    const invoiceId = qpay?.id || qpay?.invoice_id;
    const shalgakh = setInterval(async () => {
      if (!invoiceId || !token) return;
      try {
        const { data } = await uilchilgee(token).get("/qpayObjectAvya", {
          params: { invoice_id: invoiceId },
        });
        if (data?.tulsunEsekh) qpayTulugdlee(Number(mashin?.pay_amount || 0));
      } catch {
        /* дараагийн шалгалтад дахин үзнэ */
      }
    }, 3500);

    return () => {
      s.off(suvag, onTulugdluu);
      clearInterval(shalgakh);
    };
  }, [
    alkham,
    zakhialgiinDugaar,
    baiguullagiinId,
    qpay,
    token,
    mashin?.pay_amount,
    qpayTulugdlee,
  ]);

  // ── QPay countdown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (alkham !== "qpay") return;
    const duusakhMs = qpay?.expiry_date
      ? new Date(qpay.expiry_date).getTime()
      : Date.now() + QPAY_KHUGATSAA_MIN * 60_000;
    const uldsenAvya = () =>
      Math.max(0, Math.round((duusakhMs - Date.now()) / 1000));
    setUldsenSekund(uldsenAvya());
    const timer = setInterval(() => {
      const uldsen = uldsenAvya();
      setUldsenSekund(uldsen);
      if (uldsen <= 0) {
        clearInterval(timer);
        setAldaa("Хугацаа дууслаа. Дахин нэхэмжлэх үүсгэнэ үү.");
        setAlkham("songolt");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [alkham, qpay?.expiry_date]);

  const tsagniiKhelber = useMemo(() => {
    const m = Math.floor(uldsenSekund / 60);
    const s = uldsenSekund % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, [uldsenSekund]);

  const tsagDuusch = uldsenSekund <= 60;

  // ── 1. Машин хайх ────────────────────────────────────────────────────
  const mashinKhaiya = async () => {
    const tseverDugaar = dugaarTseverleye(dugaar);
    if (!DUGAARIIN_KHELBER.test(tseverDugaar)) {
      setAldaa("Дугаарыг 4 тоо, 3 кирил үсгээр бичнэ үү (жнь: 1234УБА)");
      return;
    }
    setAldaa(null);
    setAjillaj(true);
    try {
      const { data } = await uilchilgee().get(
        `/v1/search_car/${encodeURIComponent(tseverDugaar)}`,
        { params: { baiguullagiinId, barilgiinId, freeze: true } },
      );
      if (data?.success && data?.data?.pay_amount > 0) {
        setMashin(data.data);
        if (data.data.parking_id && data.data.parking_id !== tokhirgoo?._id) {
          try {
            const { data: shine } = await uilchilgee().get(
              `/zogsool/qr/medeelel/${baiguullagiinId}/${barilgiinId}`,
              { params: { zogsooliinId: data.data.parking_id } },
            );
            if (shine?.success) setTokhirgoo(shine.data);
          } catch {}
        }
        setAlkham("songolt");
      } else {
        setAldaa(data?.message || "Тухайн машинд төлбөр бодогдоогүй байна");
      }
    } catch {
      setAldaa("Машин хайхад алдаа гарлаа. Дахин оролдоно уу");
    } finally {
      setAjillaj(false);
    }
  };

  // ── 2. QPay нэхэмжлэх гаргах ─────────────────────────────────────────
  const qpayAvya = async () => {
    if (!mashin || !tokhirgoo || !token) return;
    setAldaa(null);
    setAjillaj(true);
    const shineZakhialga = `${mashin.session_id}${Math.round(mashin.pay_amount)}`;
    try {
      const yavuulakh: Record<string, any> = {
        baiguullagiinId,
        barilgiinId,
        dun: Math.round(mashin.pay_amount),
        zakhialgiinDugaar: shineZakhialga,
        zogsooliinId: mashin.parking_id || tokhirgoo._id,
        tulukhDun: Math.round(mashin.pay_amount),
        zogsoolUilchluulegchiinId: mashin.session_id,
        mashiniiDugaar: mashin.plate_number,
        turul: "QRGadaa",
        cameraIP: mashin.garsanCameraIP || "dotor",
      };
      if (tokhirgoo.zogsooliinDans)
        yavuulakh.dansniiDugaar = tokhirgoo.zogsooliinDans;

      const { data } = await uilchilgee(token).post("/qpayGargaya", yavuulakh);
      if (
        !data ||
        (!qrTekstAvya(data) && !data.qr_image && !data.urls?.length)
      ) {
        setAldaa("QPay нэхэмжлэх үүсгэж чадсангүй");
        return;
      }
      setQpay(data);
      // Утсаар нээж буй тул банкуудын жагсаалтыг эхэнд нь тавина
      setQpayTab(data.urls?.length > 0 ? "apps" : "qr");
      setZakhialgiinDugaar(shineZakhialga);
      setAlkham("qpay");
    } catch {
      setAldaa("QPay нэхэмжлэх үүсгэхэд алдаа гарлаа");
    } finally {
      setAjillaj(false);
    }
  };

  const ekhleeseeKhiiye = () => {
    setAlkham("dugaar");
    setDugaar("");
    setMashin(null);
    setQpay(null);
    setZakhialgiinDugaar(null);
    setAldaa(null);
    setEbarimtData(null);
    setEbarimtAldaa(null);
    setEbarimtLoading(false);
  };

  // ── Ачаалах / эхний алдаа ────────────────────────────────────────────
  if (ekhniiAldaa) {
    return (
      <Khuudas>
        <div className="space-y-4 text-center py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 ring-1 ring-danger">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <h1 className="text-base font-semibold text-[color:var(--panel-text)] dark:text-white">
            {ekhniiAldaa}
          </h1>
          <p className="text-xs text-[color:var(--muted-text)]">
            QR холбоос буруу эсвэл түр саатсан байж магадгүй.
          </p>
        </div>
      </Khuudas>
    );
  }

  if (!tokhirgoo) {
    return (
      <Khuudas>
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <p className="text-xs font-medium text-[color:var(--muted-text)]">
            Зогсоолын мэдээлэл ачаалж байна...
          </p>
        </div>
      </Khuudas>
    );
  }

  return (
    <Khuudas>
      {/* ── Толгой хэсэг: тод, цэлгэр ── */}
      <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
        <ThemedLogo size={52} withBg={false} alt="AmarHome" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--panel-text)] dark:text-white">
            {tokhirgoo.ner || "Зогсоол"}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[color:var(--muted-text)]">
            Төлбөр төлөх хуудас
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-theme/10 px-3.5 py-1.5 ring-1 ring-theme/20">
          <Clock className="h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="text-xs font-semibold text-brand">
            Төлснөөс хойш {garakhKhugatsaa} мин дотор гарна
          </span>
        </div>
      </div>

      {aldaa && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-danger/10 p-3.5 ring-1 ring-danger text-left">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-xs sm:text-sm text-danger font-medium leading-relaxed">{aldaa}</p>
        </div>
      )}

      {/* ── 1. Машины дугаар оруулах шат ── */}
      {alkham === "dugaar" && (
        <div className="space-y-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <label
                htmlFor="mashinii-dugaar"
                className="text-sm font-bold text-[color:var(--panel-text)] dark:text-white"
              >
                Машины улсын дугаар
              </label>
              <span className="text-xs text-[color:var(--muted-text)]">
                4 тоо + 3 үсэг
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                id="mashinii-dugaar"
                value={dugaar}
                onChange={(e) => setDugaar(dugaarTseverleye(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") mashinKhaiya();
                }}
                placeholder="1234УБА"
                autoFocus
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                enterKeyHint="search"
                maxLength={7}
                autoComplete="off"
                spellCheck={false}
                className="h-16 sm:h-20 w-full rounded-2xl bg-[color:var(--surface-hover)] px-5 text-center text-3xl sm:text-4xl font-black tracking-[0.2em] text-[color:var(--panel-text)] ring-2 ring-[color:var(--surface-border)] transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-[color:var(--muted-text)] focus:ring-2 focus:ring-theme focus:outline-none dark:bg-white/5 dark:text-white dark:ring-white/10"
              />
              {dugaar && (
                <button
                  type="button"
                  onClick={() => setDugaar("")}
                  className="absolute right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] active:scale-95 dark:bg-white/10 dark:hover:text-white"
                  title="Арилгах"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <Tovch
            onClick={mashinKhaiya}
            ajillaj={ajillaj}
            icon={<CarFront className="h-5 w-5" />}
          >
            Хайх
          </Tovch>
        </div>
      )}

      {/* ── 2. Төлбөрийн дүн ба И-Баримт сонгох шат ── */}
      {alkham === "songolt" && mashin && (
        <div className="space-y-5">
          <MashiniiKhuudas mashin={mashin} />

          {/* И-Баримт сонголт */}
          <div className="space-y-3.5 rounded-2xl bg-[color:var(--surface-hover)] p-4 sm:p-5 ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-brand shrink-0" />
                <span className="text-sm font-bold text-[color:var(--panel-text)] dark:text-white">
                  И-Баримт
                </span>
              </div>
              <div className="flex rounded-xl bg-[color:var(--surface-bg)] p-1 ring-1 ring-[color:var(--surface-border)] dark:ring-white/10">
                <button
                  type="button"
                  onClick={() => setEbarimtTurul("1")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                    ebarimtTurul === "1"
                      ? "bg-theme text-white shadow-sm"
                      : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] dark:hover:text-white"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Хувь хүн
                </button>
                <button
                  type="button"
                  onClick={() => setEbarimtTurul("3")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                    ebarimtTurul === "3"
                      ? "bg-theme text-white shadow-sm"
                      : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] dark:hover:text-white"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Байгууллага
                </button>
              </div>
            </div>

            {ebarimtTurul === "3" ? (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-[color:var(--muted-text)]">
                  Байгууллагын регистрийн дугаар (РД)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ebarimtRegister}
                  onChange={(e) => setEbarimtRegister(e.target.value.trim())}
                  placeholder="Байгууллагын 7 оронтой РД"
                  maxLength={10}
                  className="h-12 w-full rounded-xl bg-[color:var(--surface-bg)] px-4 text-sm sm:text-base text-[color:var(--panel-text)] ring-1 ring-[color:var(--surface-border)] placeholder:text-[color:var(--muted-text)] focus:ring-2 focus:ring-theme focus:outline-none dark:bg-white/5 dark:text-white dark:ring-white/10 font-medium"
                />
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-[color:var(--muted-text)]">
                  Иргэний бүртгэл / Утас (заавал биш)
                </label>
                <input
                  type="text"
                  value={ebarimtRegister}
                  onChange={(e) => setEbarimtRegister(e.target.value.trim())}
                  placeholder="Утас эсвэл регистрийн дугаар"
                  maxLength={15}
                  className="h-12 w-full rounded-xl bg-[color:var(--surface-bg)] px-4 text-sm sm:text-base text-[color:var(--panel-text)] ring-1 ring-[color:var(--surface-border)] placeholder:text-[color:var(--muted-text)] focus:ring-2 focus:ring-theme focus:outline-none dark:bg-white/5 dark:text-white dark:ring-white/10 font-medium"
                />
              </div>
            )}
          </div>

          <Tovch
            onClick={qpayAvya}
            ajillaj={ajillaj}
            icon={<Wallet className="h-5 w-5" />}
          >
            Төлбөр төлөх
          </Tovch>
          <Butsakh onClick={ekhleeseeKhiiye} />
        </div>
      )}

      {/* ── 3. QPay төлбөр төлөх шат ── */}
      {alkham === "qpay" && mashin && (
        <div className="space-y-4">
          {/* Дүн ба хугацаа */}
          <div className="rounded-2xl bg-[color:var(--surface-hover)] p-4 text-center ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10">
            <p className="text-xs sm:text-sm font-medium text-[color:var(--muted-text)]">
              Төлөх нийт дүн
            </p>
            <p className="mt-0.5 text-3xl sm:text-4xl font-black tracking-tight text-[color:var(--panel-text)] dark:text-white">
              {dunFormat(mashin.pay_amount)}
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-xs sm:text-sm font-bold ${
                  tsagDuusch
                    ? "animate-pulse bg-danger/10 text-danger ring-1 ring-danger"
                    : "bg-warning/10 text-warning ring-1 ring-warning"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {tsagniiKhelber}
              </span>
            </div>
          </div>

          {/* Таб сонголт: Банкны аппаар шууд нээх vs QR зураг */}
          {Array.isArray(qpay?.urls) && qpay.urls.length > 0 && qrTekstAvya(qpay) && (
            <div className="grid grid-cols-2 rounded-xl bg-[color:var(--surface-hover)] p-1.5 ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10">
              <button
                type="button"
                onClick={() => setQpayTab("apps")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all ${
                  qpayTab === "apps"
                    ? "bg-theme text-white shadow-sm"
                    : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] dark:hover:text-white"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Банкны апп
              </button>
              <button
                type="button"
                onClick={() => setQpayTab("qr")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all ${
                  qpayTab === "qr"
                    ? "bg-theme text-white shadow-sm"
                    : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] dark:hover:text-white"
                }`}
              >
                <QrCode className="h-4 w-4" />
                QR уншуулах
              </button>
            </div>
          )}

          {/* 1. Банкны аппуудын жагсаалт */}
          {qpayTab === "apps" && Array.isArray(qpay?.urls) && qpay.urls.length > 0 && (
            <div className="space-y-2">
              <p className="text-center text-xs text-[color:var(--muted-text)]">
                Ашигладаг банкныхаа апп дээр товшиж төлнө үү:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto p-1">
                {qpay.urls.map((u: any, i: number) => (
                  <a
                    key={`${u?.name || u?.link || i}`}
                    href={u?.link}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--surface-hover)] p-3 text-center ring-1 ring-[color:var(--surface-border)] transition-all hover:ring-theme active:scale-95 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-theme min-h-[84px]"
                  >
                    {u?.logo ? (
                      <img
                        src={u.logo}
                        alt={u?.description || u?.name || ""}
                        className="h-10 w-10 rounded-xl object-contain shrink-0"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme/10 text-sm font-bold text-brand shrink-0">
                        {String(u?.description || u?.name || "B").charAt(0)}
                      </span>
                    )}
                    <span className="line-clamp-1 text-[11px] sm:text-xs font-semibold leading-tight text-[color:var(--panel-text)] dark:text-white">
                      {u?.description || u?.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 2. QR код */}
          {(qpayTab === "qr" || !qpay?.urls?.length) && qrTekstAvya(qpay) && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-black/10">
                <QRCodeSVG value={qrTekstAvya(qpay)} size={200} level="M" />
              </div>
              <p className="text-xs text-[color:var(--muted-text)]">
                Утсаараа эсвэл банкны аппаараа QR-ийг уншуулна уу
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[color:var(--muted-text)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
            </span>
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span>Төлөгдмөгц автоматаар шалгагдана</span>
          </div>

          <Butsakh onClick={() => setAlkham("songolt")} />
        </div>
      )}

      {/* ── 4. Амжилттай шат: Төлбөр + И-Баримт ── */}
      {alkham === "amjilttai" && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-theme/10 ring-2 ring-theme/20">
            <CheckCircle2 className="h-9 w-9 text-brand" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[color:var(--panel-text)] dark:text-white">
              Төлбөр амжилттай бүртгэгдлээ
            </h2>
            <p className="mt-1 text-3xl sm:text-4xl font-black text-brand">
              {dunFormat(tulsunDun)}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-theme/10 px-4 py-1.5 ring-1 ring-theme/20">
              <Clock className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs sm:text-sm font-bold text-brand">
                {garakhKhugatsaa} минутын дотор гарна уу
              </span>
            </div>
          </div>

          {/* И-Баримтын дижитал тасалбар */}
          <div className="rounded-2xl bg-[color:var(--surface-hover)] p-4 sm:p-5 text-left ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10">
            <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-brand shrink-0" />
                <span className="text-sm font-bold text-[color:var(--panel-text)] dark:text-white">
                  И-Баримт (НӨАТ)
                </span>
              </div>
              <span className="rounded-full bg-theme/10 px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-theme/20">
                {ebarimtTurul === "3" ? "Байгууллага" : "Хувь хүн"}
              </span>
            </div>

            {ebarimtLoading && (
              <div className="flex flex-col items-center justify-center gap-2.5 py-8">
                <Loader2 className="h-7 w-7 animate-spin text-brand" />
                <p className="text-xs sm:text-sm text-[color:var(--muted-text)] font-medium">
                  И-Баримт үүсгэж байна...
                </p>
              </div>
            )}

            {!ebarimtLoading && ebarimtData && (
              <div className="space-y-3 pt-3.5">
                {ebarimtData.qrData && (
                  <div className="mx-auto my-1 flex w-fit justify-center rounded-2xl bg-white p-3 shadow-md ring-1 ring-black/5">
                    <QRCodeSVG value={ebarimtData.qrData} size={140} level="M" />
                  </div>
                )}

                <div className="space-y-2 text-xs sm:text-sm">
                  {ebarimtData.lottery && (
                    <div className="flex items-center justify-between rounded-xl bg-[color:var(--surface-bg)] p-3 ring-1 ring-[color:var(--surface-border)] dark:ring-white/10">
                      <div>
                        <p className="text-xs text-[color:var(--muted-text)] font-medium">
                          Сугалааны дугаар:
                        </p>
                        <p className="font-mono text-xl sm:text-2xl font-black text-brand tracking-widest mt-0.5">
                          {ebarimtData.lottery}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(ebarimtData.lottery, "lottery")}
                        className="flex items-center gap-1.5 rounded-xl bg-theme/10 px-3 py-1.5 text-xs font-bold text-brand hover:bg-theme/20 active:scale-95 transition-all"
                      >
                        {copiedField === "lottery" ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Хуулагдлаа</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Хуулах</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {(ebarimtData.receiptId || ebarimtData.id) && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[color:var(--muted-text)] font-medium">ДДТД:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-[color:var(--panel-text)] dark:text-white">
                          {ebarimtData.receiptId || ebarimtData.id}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              ebarimtData.receiptId || ebarimtData.id,
                              "ddtd",
                            )
                          }
                          className="text-[color:var(--muted-text)] hover:text-brand p-1"
                          title="Хуулах"
                        >
                          {copiedField === "ddtd" ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1">
                    <span className="text-[color:var(--muted-text)] font-medium">Төлсөн дүн:</span>
                    <span className="font-bold text-base text-[color:var(--panel-text)] dark:text-white">
                      {dunFormat(ebarimtData.totalAmount || tulsunDun)}
                    </span>
                  </div>

                  {ebarimtRegister && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[color:var(--muted-text)] font-medium">
                        {ebarimtTurul === "3" ? "Байгууллагын РД:" : "Бүртгэл:"}
                      </span>
                      <span className="font-mono font-semibold text-[color:var(--panel-text)] dark:text-white">
                        {ebarimtRegister}
                      </span>
                    </div>
                  )}

                  {ebarimtData.date && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-[color:var(--surface-border)] dark:border-white/10 text-xs text-[color:var(--muted-text)]">
                      <span>Огноо:</span>
                      <span>{ebarimtData.date}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!ebarimtLoading && !ebarimtData && ebarimtAldaa && (
              <div className="space-y-2.5 pt-2 text-center">
                <div className="flex items-start gap-2 rounded-xl bg-danger/10 p-2.5 text-left ring-1 ring-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <p className="text-xs text-danger font-medium">{ebarimtAldaa}</p>
                </div>
                <button
                  type="button"
                  onClick={() => ebarimtDuudya()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme/10 px-4 py-2 text-xs font-bold text-brand hover:bg-theme/20 active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  И-Баримт дахин авах
                </button>
              </div>
            )}

            {!ebarimtLoading && !ebarimtData && !ebarimtAldaa && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => ebarimtDuudya()}
                  className="rounded-xl bg-theme/10 px-5 py-2.5 text-xs sm:text-sm font-bold text-brand hover:bg-theme/20 active:scale-95"
                >
                  И-Баримт үүсгэх
                </button>
              </div>
            )}
          </div>

          <button
            onClick={ekhleeseeKhiiye}
            className="mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-[color:var(--muted-text)] transition-colors hover:text-[color:var(--panel-text)] dark:hover:text-white py-2"
          >
            <RefreshCw className="h-4 w-4" />
            Өөр машин хайх / Дахин төлөх
          </button>
        </div>
      )}
    </Khuudas>
  );
}

/* ─── Жижиг дэд компонентууд ─────────────────────────────────────────── */

const Khuudas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[color:var(--surface-hover)] dark:bg-neutral-950 p-4 sm:p-6 overscroll-none">
    <div className="w-full max-w-lg rounded-3xl bg-[color:var(--surface-bg)] dark:bg-neutral-900/95 p-6 sm:p-8 shadow-2xl ring-1 ring-[color:var(--surface-border)] dark:ring-white/10 backdrop-blur-xl transition-all">
      {children}
    </div>
  </div>
);

const Tovch: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  ajillaj?: boolean;
  icon?: React.ReactNode;
}> = ({ onClick, children, ajillaj, icon }) => (
  <button
    onClick={onClick}
    disabled={ajillaj}
    className="flex h-14 sm:h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-theme text-base sm:text-lg font-bold text-white transition-all hover:bg-theme active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-theme/25"
  >
    {ajillaj ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
    {children}
  </button>
);

const Butsakh: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="mx-auto flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[color:var(--muted-text)] transition-colors hover:text-[color:var(--panel-text)] dark:hover:text-white py-1.5"
  >
    <ArrowLeft className="h-4 w-4" />
    Буцах
  </button>
);

const Mur: React.FC<{ nert: string; utga: string; tom?: boolean }> = ({
  nert,
  utga,
  tom,
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className={tom ? "text-sm font-medium text-[color:var(--muted-text)]" : "text-xs sm:text-sm text-[color:var(--muted-text)]"}>{nert}</span>
    <span
      className={
        tom
          ? "text-2xl sm:text-3xl font-black text-brand"
          : "text-sm sm:text-base font-bold text-[color:var(--panel-text)] dark:text-white"
      }
    >
      {utga}
    </span>
  </div>
);

const MashiniiKhuudas: React.FC<{ mashin: MashiniiMedeelel }> = ({
  mashin,
}) => (
  <div className="space-y-3 rounded-2xl bg-[color:var(--surface-hover)] p-4 sm:p-5 ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10">
    <div className="flex items-center justify-between">
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-black/15 bg-white dark:bg-neutral-800 px-4 py-2 shadow-sm">
        <CarFront className="h-5 w-5 text-brand" />
        <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-neutral-900 dark:text-white">
          {mashin.plate_number}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[color:var(--muted-text)]">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {mashin.enter_date}
      </div>
    </div>
    <div className="border-t border-[color:var(--surface-border)] pt-3 dark:border-white/10">
      <Mur nert="Төлөх дүн" utga={dunFormat(mashin.pay_amount)} tom />
    </div>
  </div>
);
