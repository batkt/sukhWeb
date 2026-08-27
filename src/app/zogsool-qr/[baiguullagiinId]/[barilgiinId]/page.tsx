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

  // ── QPay төлөгдсөнийг socket + poll-оор хянах ─────────────────────────
  const qpayTulugdlee = useCallback((dun: number) => {
    setTulsunDun(dun);
    setAlkham("amjilttai");
  }, []);

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
  };

  // ── Ачаалах / эхний алдаа ────────────────────────────────────────────
  if (ekhniiAldaa) {
    return (
      <Khuudas>
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {ekhniiAldaa}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {tokhirgoo.ner || "Зогсоол"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Зогсоолын төлбөр
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
          <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            Төлснөөс хойш {garakhKhugatsaa} минут дотор гарна уу
          </span>
        </div>
      </div>

      {aldaa && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-red-50 p-3 ring-1 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
          <p className="text-xs text-red-700 dark:text-red-200">{aldaa}</p>
        </div>
      )}

      {/* ── 1. Машины дугаар ── */}
      {alkham === "dugaar" && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="mashinii-dugaar"
              className="text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Машины дугаар
            </label>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
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
            className="h-16 w-full rounded-2xl bg-slate-100 px-4 text-center text-2xl font-bold tracking-[0.2em] text-slate-900 ring-1 ring-slate-200 transition-shadow placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-slate-500"
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Төлөх дүн
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {dunFormat(mashin.pay_amount)}
            </p>
            <p
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                tsagDuusch
                  ? "animate-pulse bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
              }`}
            >
              <Clock className="h-3 w-3" />
              {tsagniiKhelber}
            </p>
          </div>

          {qrTekstAvya(qpay) && (
            <div className="mx-auto w-fit rounded-3xl bg-white p-4 ring-1 ring-slate-200 dark:ring-white/10">
              <QRCodeSVG value={qrTekstAvya(qpay)} size={200} level="M" />
            </div>
          )}

          {Array.isArray(qpay?.urls) && qpay.urls.length > 0 && (
            <div className="space-y-2">
              <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
                Эсвэл банкны аппаа шууд сонгоно уу
              </p>
              {/* QPay бүх банк/хэтэвчийг буцаадаг - бүгдийг харуулна */}
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {qpay.urls.map((u: any, i: number) => (
                  <a
                    key={`${u?.name || u?.link || i}`}
                    href={u?.link}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 p-2 text-center ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
                  >
                    {u?.logo ? (
                      <img
                        src={u.logo}
                        alt={u?.description || u?.name || ""}
                        className="h-8 w-8 rounded-lg object-contain"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-[10px] text-slate-700 dark:bg-white/10 dark:text-white">
                        {String(u?.description || u?.name || "").charAt(0)}
                      </span>
                    )}
                    <span className="line-clamp-2 text-[9px] leading-tight text-slate-600 dark:text-slate-400">
                      {u?.description || u?.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            Төлөгдмөгц автоматаар шалгагдана
          </p>

          <Butsakh onClick={() => setAlkham("songolt")} />
        </div>
      )}

      {/* ── 4. Амжилттай ── */}
      {alkham === "amjilttai" && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Төлбөр бүртгэгдлээ
            </h2>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {dunFormat(tulsunDun)}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {garakhKhugatsaa} минут дотор гарна уу.
            </p>
          </div>
          <button
            onClick={ekhleeseeKhiiye}
            className="mx-auto flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
  <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
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
    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 dark:bg-emerald-500 dark:hover:bg-emerald-400"
  >
    {ajillaj ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    {children}
  </button>
);

const Butsakh: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="mx-auto flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
    <span className="text-xs text-slate-500 dark:text-slate-400">{nert}</span>
    <span
      className={
        tom
          ? "text-lg font-bold text-emerald-600 dark:text-emerald-400"
          : "text-sm font-medium text-slate-900 dark:text-white"
      }
    >
      {utga}
    </span>
  </div>
);

const MashiniiKhuudas: React.FC<{ mashin: MashiniiMedeelel }> = ({
  mashin,
}) => (
  <div className="space-y-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
    <div className="flex items-center gap-2">
      <CarFront className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="text-base font-bold tracking-wider text-slate-900 dark:text-white">
        {mashin.plate_number}
      </span>
    </div>
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      Орсон: {mashin.enter_date}
    </div>
    <div className="border-t border-slate-200 pt-3 dark:border-white/10">
      <Mur nert="Төлөх дүн" utga={dunFormat(mashin.pay_amount)} tom />
    </div>
  </div>
);
