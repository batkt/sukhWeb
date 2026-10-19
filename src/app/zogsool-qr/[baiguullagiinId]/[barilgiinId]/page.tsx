"use client";

/**
 * Гадаа наалтын QR-аар зогсоолын төлбөр төлөх нийтийн (нэвтрэлтгүй) хуудас.
 *
 * QR: /zogsool-qr/<baiguullagiinId>/<barilgiinId>
 *
 * Урсгал:
 *   1. Машины дугаар бичих
 *   2. Төлбөр харуулах
 *   3. QPay-ээр төлөх
 *
 * Гэрлийн/харанхуй загварыг root layout-ийн theme-init скрипт <html> дээр
 * `.dark` класс тавьж шийддэг тул энд `dark:` вариантууд ажиллана. Бүх текстэд
 * ХОЁУЛАНГИЙН өнгийг зааж өгнө - эс тэгвээс body-ийн `text-foreground`
 * өвлөгдөж, картны дэвсгэртэй нийлээд уншигдахгүй болно.
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

/**
 * Зогсоолын `garakhTsag` минутаар хадгалагддаг ч зарим бааз дээр бодит бус
 * том утга (жнь 900 = 15 цаг) тавигдсан байдаг. Наалтын мэдэгдэлд ойлгомжтой
 * хүрээнд л хэрэглэж, бусад тохиолдолд стандарт 30 минутыг харуулна.
 */
const garakhKhugatsaaAvya = (n?: number): number => {
  const t = Number(n);
  return Number.isFinite(t) && t > 0 && t <= 120 ? t : GARAKH_KHUGATSAA_STANDART;
};

/**
 * Монгол улсын автомашины дугаар: 4 тоо + 3 кирил үсэг (жнь 1234УБА).
 * Ё, Ө, Ү нь [А-Я] хүрээнд ороогүй тул тусад нь заана.
 */
const DUGAARIIN_KHELBER = /^[0-9]{4}[А-ЯЁӨҮ]{3}$/u;

/**
 * Оруулах үед зөвшөөрөгдөөгүй тэмдэгтийг хаяж, 4 тоо + 3 үсгийн хэлбэрт
 * шахна. Ингэснээр жолооч буруу тэмдэгт бичих боломжгүй болно.
 */
const dugaarTseverleye = (v: string): string => {
  const tom = v.toUpperCase();
  const toonuud = tom.replace(/[^0-9]/g, "").slice(0, 4);
  const useguud = tom.replace(/[^А-ЯЁӨҮ]/gu, "").slice(0, 3);
  return toonuud + useguud;
};

/**
 * QPay-ийн хариунаас QR-ийн текстийг авна. Талбарын нэр QPay-ийн
 * хувилбараас хамаарч `qr_code` эсвэл `qr_text` байдаг.
 */
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
  const [zakhialgiinDugaar, setZakhialgiinDugaar] = useState<string | null>(
    null,
  );
  const [uldsenSekund, setUldsenSekund] = useState(QPAY_KHUGATSAA_MIN * 60);

  // ── И-Баримт төлөв ────────────────────────────────────────────────────
  const [ebarimtTurul, setEbarimtTurul] = useState<"1" | "3">("1");
  const [ebarimtRegister, setEbarimtRegister] = useState("");
  const [ebarimtData, setEbarimtData] = useState<any>(null);
  const [ebarimtLoading, setEbarimtLoading] = useState(false);
  const [ebarimtAldaa, setEbarimtAldaa] = useState<string | null>(null);

  const garakhKhugatsaa = garakhKhugatsaaAvya(tokhirgoo?.garakhTsag);

  // ── Хуудас ачаалах: зочны token + зогсоолын мэдээлэл ──────────────────
  useEffect(() => {
    if (!baiguullagiinId || !barilgiinId) return;
    let khuchintei = true;

    (async () => {
      // Зочны token — QPay нэхэмжлэх гаргахад л хэрэгтэй тул унасан ч
      // хуудсыг бүтнээр унагахгүй.
      try {
        const { data } = await uilchilgee().get(
          `/zochiniiTokenAvya/${baiguullagiinId}`,
        );
        if (khuchintei)
          setToken(typeof data === "string" ? data : data?.token || null);
      } catch {
        /* QPay хэсэгт дахин мэдэгдэнэ */
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

    // Socket алдаж мэдэх тул нөөцөөр 4 секунд тутам шалгана
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
    }, 4000);

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

  // ── QPay хүлээх countdown (QPay-ийн expiry_date-аар) ─────────────────
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
        setAldaa("Хугацаа дууслаа. Дахин үүсгэнэ үү.");
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
      setAldaa(
        "Дугаарыг 4 тоо, 3 кирил үсгээр бичнэ үү. Жишээ: 1234УБА",
      );
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
        // Нэг барилгад хэд хэдэн зогсоол байж болох тул тухайн машины бодит
        // зогсоолын мэдээллийг (данс, гарах хугацаа) дахин авна.
        if (data.data.parking_id && data.data.parking_id !== tokhirgoo?._id) {
          try {
            const { data: shine } = await uilchilgee().get(
              `/zogsool/qr/medeelel/${baiguullagiinId}/${barilgiinId}`,
              { params: { zogsooliinId: data.data.parking_id } },
            );
            if (shine?.success) setTokhirgoo(shine.data);
          } catch {
            /* мэдээлэл авахгүй бол өмнөхөөр үргэлжилнэ */
          }
        }
        setAlkham("songolt");
      } else {
        setAldaa(data?.message || "Тухайн машинд төлбөр бодогдоогүй байна");
      }
    } catch {
      setAldaa("Машин хайхад алдаа гарлаа");
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
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 ring-1 ring-danger">
            <AlertTriangle className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-lg font-medium text-[color:var(--panel-text)] dark:text-white">
            {ekhniiAldaa}
          </h1>
          <p className="text-sm text-[color:var(--muted-text)]">
            QR холбоос буруу байж магадгүй. Ажилтанд хандана уу.
          </p>
        </div>
      </Khuudas>
    );
  }

  if (!tokhirgoo) {
    return (
      <Khuudas>
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-[color:var(--muted-text)]">
            Ачаалж байна...
          </p>
        </div>
      </Khuudas>
    );
  }

  return (
    <Khuudas>
      {/* ── Толгой: лого + зогсоолын нэр ── */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <ThemedLogo size={52} withBg={false} alt="AmarHome" />
        <div>
          <h1 className="text-lg font-medium tracking-tight text-[color:var(--panel-text)] dark:text-white">
            {tokhirgoo.ner || "Зогсоол"}
          </h1>
          <p className="mt-1 text-xs text-[color:var(--muted-text)]">
            Зогсоолын төлбөр
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-theme/10 px-3 py-1.5 ring-1 ring-theme/20">
          <Clock className="h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="text-[11px] font-medium text-brand">
            Төлснөөс хойш {garakhKhugatsaa} минут дотор гарна уу
          </span>
        </div>
      </div>

      {aldaa && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-danger/10 p-3 ring-1 ring-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-xs text-danger">{aldaa}</p>
        </div>
      )}

      {/* ── 1. Машины дугаар ── */}
      {alkham === "dugaar" && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="mashinii-dugaar"
              className="text-xs font-medium text-[color:var(--muted-text)]"
            >
              Машины дугаар
            </label>
            <span className="text-[10px] text-[color:var(--muted-text)]">
              4 тоо + 3 үсэг
            </span>
          </div>
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
            maxLength={7}
            autoComplete="off"
            spellCheck={false}
            className="h-16 w-full rounded-2xl bg-[color:var(--surface-hover)] px-4 text-center text-2xl font-medium tracking-[0.2em] text-[color:var(--panel-text)] ring-1 ring-[color:var(--surface-border)] transition-shadow placeholder:font-normal placeholder:tracking-normal placeholder:text-[color:var(--muted-text)] focus:ring-2 focus:ring-theme focus:outline-none dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-[color:var(--muted-text)]"
          />
          <Tovch
            onClick={mashinKhaiya}
            ajillaj={ajillaj}
            icon={<CarFront className="h-4 w-4" />}
          >
            Хайх
          </Tovch>
        </div>
      )}

      {/* ── 2. Төлбөр ── */}
      {alkham === "songolt" && mashin && (
        <div className="space-y-5">
          <MashiniiKhuudas mashin={mashin} />

          {/* И-Баримт сонголт */}
          <div className="space-y-3 rounded-3xl bg-[color:var(--surface-hover)] p-4 ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-brand" />
                <span className="text-xs font-medium text-[color:var(--panel-text)] dark:text-white">
                  И-Баримт авах
                </span>
              </div>
              <div className="flex rounded-xl bg-[color:var(--surface-bg)] p-0.5 ring-1 ring-[color:var(--surface-border)] dark:ring-white/10">
                <button
                  type="button"
                  onClick={() => setEbarimtTurul("1")}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    ebarimtTurul === "1"
                      ? "bg-theme text-white shadow-sm"
                      : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] dark:hover:text-white"
                  }`}
                >
                  <User className="h-3 w-3" />
                  Хувь хүн
                </button>
                <button
                  type="button"
                  onClick={() => setEbarimtTurul("3")}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    ebarimtTurul === "3"
                      ? "bg-theme text-white shadow-sm"
                      : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] dark:hover:text-white"
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  Байгууллага
                </button>
              </div>
            </div>

            {ebarimtTurul === "3" ? (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-[color:var(--muted-text)]">
                  Байгууллагын регистрийн дугаар (РД)
                </label>
                <input
                  type="text"
                  value={ebarimtRegister}
                  onChange={(e) => setEbarimtRegister(e.target.value.trim())}
                  placeholder="Байгууллагын РД (ж: 1234567)"
                  maxLength={10}
                  className="h-10 w-full rounded-xl bg-[color:var(--surface-bg)] px-3 text-sm text-[color:var(--panel-text)] ring-1 ring-[color:var(--surface-border)] placeholder:text-[color:var(--muted-text)] focus:ring-2 focus:ring-theme focus:outline-none dark:bg-white/5 dark:text-white dark:ring-white/10"
                />
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-[color:var(--muted-text)]">
                  Иргэний бүртгэл / Утас (заавал биш)
                </label>
                <input
                  type="text"
                  value={ebarimtRegister}
                  onChange={(e) => setEbarimtRegister(e.target.value.trim())}
                  placeholder="Утасны дугаар эсвэл РД"
                  maxLength={15}
                  className="h-10 w-full rounded-xl bg-[color:var(--surface-bg)] px-3 text-sm text-[color:var(--panel-text)] ring-1 ring-[color:var(--surface-border)] placeholder:text-[color:var(--muted-text)] focus:ring-2 focus:ring-theme focus:outline-none dark:bg-white/5 dark:text-white dark:ring-white/10"
                />
              </div>
            )}
          </div>

          <Tovch
            onClick={qpayAvya}
            ajillaj={ajillaj}
            icon={<Wallet className="h-4 w-4" />}
          >
            Төлөх
          </Tovch>
          <Butsakh onClick={ekhleeseeKhiiye} />
        </div>
      )}

      {/* ── 3. QPay ── */}
      {alkham === "qpay" && mashin && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-xs text-[color:var(--muted-text)]">
              Төлөх дүн
            </p>
            <p className="text-3xl font-medium text-[color:var(--panel-text)] dark:text-white">
              {dunFormat(mashin.pay_amount)}
            </p>
            <p
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-medium ${
                tsagDuusch
                  ? "animate-pulse bg-danger/10 text-danger ring-1 ring-danger"
                  : "bg-warning/10 text-warning ring-1 ring-warning"
              }`}
            >
              <Clock className="h-3 w-3" />
              {tsagniiKhelber}
            </p>
          </div>

          {qrTekstAvya(qpay) && (
            <div className="mx-auto w-fit rounded-3xl bg-[color:var(--surface-bg)] p-4 ring-1 ring-[color:var(--surface-border)] dark:ring-white/10">
              <QRCodeSVG value={qrTekstAvya(qpay)} size={200} level="M" />
            </div>
          )}

          {Array.isArray(qpay?.urls) && qpay.urls.length > 0 && (
            <div className="space-y-2">
              <p className="text-center text-[11px] text-[color:var(--muted-text)]">
                Эсвэл банкны аппаа шууд сонгоно уу
              </p>
              {/* QPay бүх банк/хэтэвчийг буцаадаг - бүгдийг харуулна */}
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {qpay.urls.map((u: any, i: number) => (
                  <a
                    key={`${u?.name || u?.link || i}`}
                    href={u?.link}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-[color:var(--surface-hover)] p-2 text-center ring-1 ring-[color:var(--surface-border)] transition-colors hover:bg-[color:var(--surface-hover)] dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
                  >
                    {u?.logo ? (
                      <img
                        src={u.logo}
                        alt={u?.description || u?.name || ""}
                        className="h-8 w-8 rounded-lg object-contain"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--panel)] text-[10px] text-[color:var(--panel-text)] dark:bg-white/10 dark:text-white">
                        {String(u?.description || u?.name || "").charAt(0)}
                      </span>
                    )}
                    <span className="line-clamp-2 text-[9px] leading-tight text-[color:var(--muted-text)]">
                      {u?.description || u?.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[color:var(--muted-text)]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
            Төлөгдмөгц автоматаар шалгагдана
          </p>

          <Butsakh onClick={() => setAlkham("songolt")} />
        </div>
      )}

      {/* ── 4. Амжилттай ── */}
      {alkham === "amjilttai" && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-theme/10 ring-1 ring-theme/20">
            <CheckCircle2 className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-[color:var(--panel-text)] dark:text-white">
              Төлбөр бүртгэгдлээ
            </h2>
            <p className="mt-1 text-2xl font-medium text-brand">
              {dunFormat(tulsunDun)}
            </p>
            <p className="mt-2 text-xs text-[color:var(--muted-text)]">
              {garakhKhugatsaa} минут дотор гарна уу.
            </p>
          </div>

          {/* И-Баримт хэсэг */}
          <div className="rounded-3xl bg-[color:var(--surface-hover)] p-4 text-left ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10">
            <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] pb-2.5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-brand" />
                <span className="text-xs font-semibold text-[color:var(--panel-text)] dark:text-white">
                  И-Баримт
                </span>
              </div>
              <span className="rounded-full bg-theme/10 px-2.5 py-0.5 text-[10px] font-medium text-brand ring-1 ring-theme/20">
                {ebarimtTurul === "3" ? "Байгууллага (Б2Б)" : "Хувь хүн"}
              </span>
            </div>

            {ebarimtLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
                <p className="text-xs text-[color:var(--muted-text)]">
                  И-Баримт үүсгэж байна...
                </p>
              </div>
            )}

            {!ebarimtLoading && ebarimtData && (
              <div className="space-y-3 pt-3">
                {ebarimtData.qrData && (
                  <div className="mx-auto my-1 flex w-fit justify-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
                    <QRCodeSVG value={ebarimtData.qrData} size={130} level="M" />
                  </div>
                )}
                <div className="space-y-1.5 text-xs">
                  {ebarimtData.lottery && (
                    <div className="flex items-center justify-between rounded-xl bg-[color:var(--surface-bg)] p-2.5 ring-1 ring-[color:var(--surface-border)] dark:ring-white/10">
                      <span className="text-[color:var(--muted-text)]">
                        Сугалааны дугаар:
                      </span>
                      <span className="font-mono text-base font-bold text-brand">
                        {ebarimtData.lottery}
                      </span>
                    </div>
                  )}
                  {(ebarimtData.receiptId || ebarimtData.id) && (
                    <div className="flex items-center justify-between">
                      <span className="text-[color:var(--muted-text)]">ДДТД:</span>
                      <span className="font-mono font-medium text-[color:var(--panel-text)] dark:text-white">
                        {ebarimtData.receiptId || ebarimtData.id}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[color:var(--muted-text)]">Төлсөн дүн:</span>
                    <span className="font-semibold text-[color:var(--panel-text)] dark:text-white">
                      {dunFormat(ebarimtData.totalAmount || tulsunDun)}
                    </span>
                  </div>
                  {ebarimtRegister && (
                    <div className="flex items-center justify-between">
                      <span className="text-[color:var(--muted-text)]">
                        {ebarimtTurul === "3" ? "Байгууллагын РД:" : "Бүртгэл:"}
                      </span>
                      <span className="font-mono text-[color:var(--panel-text)] dark:text-white">
                        {ebarimtRegister}
                      </span>
                    </div>
                  )}
                  {ebarimtData.date && (
                    <div className="flex items-center justify-between text-[11px] text-[color:var(--muted-text)]">
                      <span>Огноо:</span>
                      <span>{ebarimtData.date}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!ebarimtLoading && !ebarimtData && ebarimtAldaa && (
              <div className="space-y-2 pt-3">
                <div className="flex items-start gap-2 rounded-xl bg-danger/10 p-2.5 ring-1 ring-danger">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                  <p className="text-xs text-danger">{ebarimtAldaa}</p>
                </div>
                <button
                  type="button"
                  onClick={() => ebarimtDuudya()}
                  className="w-full rounded-xl bg-theme/10 py-2 text-xs font-medium text-brand transition-colors hover:bg-theme/20"
                >
                  И-Баримт дахин авах
                </button>
              </div>
            )}

            {!ebarimtLoading && !ebarimtData && !ebarimtAldaa && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => ebarimtDuudya()}
                  className="rounded-xl bg-theme/10 px-4 py-2 text-xs font-medium text-brand transition-colors hover:bg-theme/20"
                >
                  И-Баримт үүсгэх
                </button>
              </div>
            )}
          </div>

          <button
            onClick={ekhleeseeKhiiye}
            className="mx-auto flex items-center gap-2 text-xs text-[color:var(--muted-text)] transition-colors hover:text-[color:var(--panel-text)] dark:hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Дахин төлөх
          </button>
        </div>
      )}
    </Khuudas>
  );
}

/* ─── Жижиг дэд компонентууд ─────────────────────────────────────────── */

const Khuudas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-[color:var(--surface-hover)] p-4">
    <div className="w-full max-w-md rounded-3xl bg-[color:var(--surface-bg)] p-6 shadow-xl ring-1 ring-[color:var(--surface-border)] dark:ring-white/10">
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
    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-theme py-4 text-sm font-medium text-white transition-colors hover:bg-theme disabled:opacity-40 dark:hover:bg-theme"
  >
    {ajillaj ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    {children}
  </button>
);

const Butsakh: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="mx-auto flex items-center gap-1.5 text-xs text-[color:var(--muted-text)] transition-colors hover:text-[color:var(--panel-text)] dark:hover:text-white"
  >
    <ArrowLeft className="h-3.5 w-3.5" />
    Буцах
  </button>
);

const Mur: React.FC<{ nert: string; utga: string; tom?: boolean }> = ({
  nert,
  utga,
  tom,
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-[color:var(--muted-text)]">{nert}</span>
    <span
      className={
        tom
          ? "text-lg font-medium text-brand"
          : "text-sm font-medium text-[color:var(--panel-text)] dark:text-white"
      }
    >
      {utga}
    </span>
  </div>
);

const MashiniiKhuudas: React.FC<{ mashin: MashiniiMedeelel }> = ({
  mashin,
}) => (
  <div className="space-y-3 rounded-3xl bg-[color:var(--surface-hover)] p-4 ring-1 ring-[color:var(--surface-border)] dark:bg-white/5 dark:ring-white/10">
    <div className="flex items-center gap-2">
      <CarFront className="h-4 w-4 shrink-0 text-brand" />
      <span className="text-base font-medium tracking-wider text-[color:var(--panel-text)] dark:text-white">
        {mashin.plate_number}
      </span>
    </div>
    <div className="flex items-center gap-2 text-xs text-[color:var(--muted-text)]">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      Орсон: {mashin.enter_date}
    </div>
    <div className="border-t border-[color:var(--surface-border)] pt-3 dark:border-white/10">
      <Mur nert="Төлөх дүн" utga={dunFormat(mashin.pay_amount)} tom />
    </div>
  </div>
);
