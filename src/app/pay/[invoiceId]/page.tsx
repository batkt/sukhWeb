"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  UserRound,
  Hash,
  CalendarDays,
  Check,
  TriangleAlert,
  QrCode,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { getApiUrl } from "@/lib/uilchilgee";

// Fetcher helper
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Мэдээлэл авахад алдаа гарлаа");
  }
  return res.json();
};

/**
 * Нийтэд нээлттэй төлбөрийн хуудас — админы СЭДВЭЭС ҮЛ ХАМААРНА.
 *
 * Хуудас бүхэлдээ бараан загвартай ч `--panel`, `--muted-text` зэрэг нь
 * цайвар горимд бараг цагаан болдог тул карт цагаан дээр цагаан бичигтэй
 * болж УНШИГДАХГҮЙ байв. Оршин суугч сэдэв сонгодоггүй тул энд бараан
 * өнгийг ТОГТООНО. `--surface-border`-ыг ч мөн адил — өмнө нь зөвхөн гурав
 * нь тогтоогдсон тул QR-ын хүрээ сэдвээс хамаарч алга болдог байв.
 */
const BARAAN_TOKEN = {
  "--panel": "var(--dark-panel)",
  "--panel-text": "var(--dark-text)",
  "--muted-text": "var(--dark-muted)",
  "--surface-border": "var(--dark-border)",
} as React.CSSProperties;

/** Нарийн ширхэгт «мана» — тэгш хавтгай бараан гадаргууг амьдруулна. */
const MANA_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/**
 * Гурван дэлгэц (алдаа, ачаалалт, нэхэмжлэх) НЭГ ижил дэвсгэртэй байна.
 * Өмнө нь тус бүр өөр радиал градиенттай байсан тул ачаалагдах явцад
 * дэвсгэр хоёр удаа «үсэрдэг» байв.
 */
function Devsger({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden px-4 py-10 font-sans text-[color:var(--muted-text)] selection:bg-theme/30"
      style={{ ...BARAAN_TOKEN, background: "var(--dark-gradient)" }}
    >
      {/* Брэнд өнгийн гэрэлтэлт — зөвхөн өргөн дэлгэцэнд, гар утсанд blur
          нь удаашруулдаг. */}
      <span className="pointer-events-none absolute -left-40 -top-40 hidden h-96 w-96 rounded-full bg-theme/10 blur-[110px] sm:block" />
      <span className="pointer-events-none absolute -bottom-48 -right-40 hidden h-[26rem] w-[26rem] rounded-full bg-theme/[0.07] blur-[130px] sm:block" />
      {/* Ширхэглэл — өнгөний туузлалыг эвдэж, гадаргууг «хэвлэмэл» болгоно. */}
      <span
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: MANA_URL }}
      />

      <main className="relative z-10 w-full max-w-md">
        <header className="mb-7 flex items-center justify-center gap-2">
          <img
            src="/logo.png"
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-white/90">
            AMARHOME
          </span>
        </header>

        {children}

        <footer className="mt-7 text-center text-[11px] leading-relaxed text-[color:var(--muted-text)]/70">
          ЗЭВТАБС · Amarhome төлбөрийн систем
        </footer>
      </main>
    </div>
  );
}

/** Нэхэмжлэхийн нэг мөр — хоёр дэлгэц НЭГ ижил бүтэцтэй байхын тулд. */
function Mur({
  dugaar,
  ner,
  utga,
  mono,
}: {
  dugaar?: React.ReactNode;
  ner: string;
  utga: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-2.5 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="flex shrink-0 items-center gap-1.5 text-[13px] text-[color:var(--muted-text)]">
        {dugaar}
        {ner}
      </dt>
      <dd
        className={`text-[13px] font-medium text-white sm:max-w-[62%] sm:text-right ${
          mono ? "font-mono tracking-tight tabular-nums" : "break-words"
        }`}
      >
        {utga}
      </dd>
    </div>
  );
}

export default function PaymentLandingPage() {
  const params = useParams();
  const invoiceId = params?.invoiceId as string;
  const [activeTab, setActiveTab] = useState<"deeplink" | "qrcode">("deeplink");

  const baseUrl = getApiUrl().replace(/\/$/, "");
  const fetchUrl = invoiceId ? `${baseUrl}/pay/info/${invoiceId}` : null;

  // SWR hook for querying payment status & details
  // Automatically poll every 3 seconds if the invoice is unpaid
  const { data, error, mutate, isValidating } = useSWR(fetchUrl, fetcher, {
    refreshInterval: (data) => {
      if (data?.success && data?.invoice?.tuluv !== "Төлсөн") {
        return 3000; // Poll every 3s if unpaid
      }
      return 0; // Stop polling if paid
    },
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });

  const invoice = data?.invoice;

  // One-time payment link: if ANY payment has been made, show as paid
  const hasPayment = Number(invoice?.tulsunDun || 0) > 0;
  const remainingAmount =
    invoice?.uldegdel !== undefined && invoice?.uldegdel !== null
      ? Number(invoice.uldegdel)
      : Number(invoice?.niitTulbur || 0) - Number(invoice?.tulsunDun || 0);
  const actualIsPaid =
    invoice?.tuluv === "Төлсөн" || hasPayment || remainingAmount <= 0.01;
  const displayAmount = actualIsPaid
    ? Number(invoice?.niitTulbur || 0)
    : remainingAmount;
  const isPaid = actualIsPaid;

  // Handle mobile detection to set default tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      if (!isMobile) {
        setActiveTab("qrcode");
      }
    }
  }, []);

  /**
   * Дүнг зөвхөн ТОО болгоно. `₮` тэмдгийг тусад нь, ЖИЖИГ хэмжээтэй
   * байрлуулдаг тул энд оруулахгүй — ингэснээр дүн өөрөө хуудсын хамгийн
   * том элемент хэвээр үлдэнэ.
   */
  const formatToo = (amount: number) =>
    new Intl.NumberFormat("mn-MN").format(amount);

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  if (error) {
    return (
      <Devsger>
        <div className="space-y-6 rounded-3xl border border-danger/20 bg-[color:var(--panel)]/80 p-7 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10">
            <TriangleAlert className="h-7 w-7 text-danger" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Нэхэмжлэх нээгдсэнгүй
            </h1>
            <p className="text-pretty text-[13px] leading-relaxed text-[color:var(--muted-text)]">
              {error.message ||
                "Холбоос буруу эсвэл нэхэмжлэх устгагдсан байж магадгүй."}
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px"
          >
            <RefreshCw className="h-4 w-4" />
            Дахин ачааллах
          </button>
        </div>
      </Devsger>
    );
  }

  if (!data) {
    return (
      <Devsger>
        {/* Араг яс — блокууд нь картаасаа ЦАЙВАР байх ёстой. Өмнө нь карттай
            ижил `--panel` өнгөтэй байсан тул ачаалалт огт харагддаггүй байв. */}
        <div
          className="space-y-7 rounded-3xl border border-white/5 bg-[color:var(--panel)]/80 p-7 shadow-2xl backdrop-blur-xl"
          aria-busy="true"
          aria-label="Нэхэмжлэх ачаалж байна"
        >
          <div className="animate-pulse space-y-3 text-center">
            <div className="mx-auto h-3 w-28 rounded-full bg-white/10" />
            <div className="mx-auto h-10 w-48 rounded-xl bg-white/[0.14]" />
            <div className="mx-auto h-6 w-36 rounded-full bg-white/10" />
          </div>
          <div className="animate-pulse space-y-3 rounded-2xl bg-white/[0.03] p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between gap-6">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-3 flex-1 max-w-[9rem] rounded-full bg-white/[0.07]" />
              </div>
            ))}
          </div>
          <div className="h-12 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-44 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
      </Devsger>
    );
  }

  /** Хоёр дэлгэц хуваалцах нэхэмжлэхийн задаргаа. */
  const delgerengui = (
    <dl className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-1">
      <Mur
        dugaar={<Building2 className="h-3.5 w-3.5 opacity-60" />}
        ner="СӨХ"
        utga={invoice.baiguullagiinNer}
      />
      <Mur
        dugaar={<UserRound className="h-3.5 w-3.5 opacity-60" />}
        ner="Оршин суугч"
        utga={invoice.ner || "Тодорхойгүй"}
      />
      {invoice.toot && (
        <Mur
          dugaar={<Hash className="h-3.5 w-3.5 opacity-60" />}
          ner="Тоот"
          utga={`${invoice.toot} тоот`}
        />
      )}
      <Mur
        dugaar={<Hash className="h-3.5 w-3.5 opacity-60" />}
        ner="Нэхэмжлэх №"
        utga={invoice.nekhemjlekhiinDugaar}
        mono
      />
      {invoice.ognoo && (
        <Mur
          dugaar={<CalendarDays className="h-3.5 w-3.5 opacity-60" />}
          ner="Огноо"
          utga={formatDate(invoice.ognoo)}
          mono
        />
      )}
    </dl>
  );

  return (
    <Devsger>
      <AnimatePresence mode="wait">
        {isPaid ? (
          /* SUCCESS / PAID STATE SCREEN */
          <motion.div
            key="paid-state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 rounded-3xl border border-theme/20 bg-[color:var(--panel)]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7"
          >
            <div className="space-y-4 text-center">
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 16 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-theme/25 bg-theme/10"
              >
                <Check className="h-8 w-8 text-brand" strokeWidth={2.5} />
              </motion.div>

              <div className="space-y-1.5">
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Төлбөр хүлээн авлаа
                </h1>
                <p className="text-[13px] text-[color:var(--muted-text)]">
                  Энэ нэхэмжлэх бүрэн төлөгдсөн байна.
                </p>
              </div>

              {/* Төлсөн дүн — хуудсын гол мэдээлэл. */}
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted-text)]">
                  Төлсөн дүн
                </div>
                <div className="mt-1.5 flex items-baseline justify-center gap-1.5">
                  <span className="text-[2.1rem] font-semibold leading-none tracking-tight tabular-nums text-white">
                    {formatToo(
                      Number(invoice.tulsunDun) || Number(invoice.niitTulbur),
                    )}
                  </span>
                  <span className="text-lg font-medium text-[color:var(--muted-text)]">
                    ₮
                  </span>
                </div>
              </div>
            </div>

            {delgerengui}

            <p className="text-pretty text-center text-[11px] leading-relaxed text-[color:var(--muted-text)]/80">
              Баримттай холбоотой лавлах зүйл байвал СӨХ-тэйгээ холбогдоно уу.
            </p>
          </motion.div>
        ) : (
          /* UNPAID / BILL SELECT STATE SCREEN */
          <motion.div
            key="unpaid-state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 rounded-3xl border border-white/5 bg-[color:var(--panel)]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7"
          >
            {/* Төлөх дүн — хуудсанд хамгийн түрүүнд уншигдах зүйл. */}
            <div className="space-y-2.5 text-center">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted-text)]">
                Төлөх дүн
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <h1 className="text-[2.6rem] font-semibold leading-none tracking-tighter tabular-nums text-white">
                  {formatToo(displayAmount)}
                </h1>
                <span className="text-xl font-medium text-[color:var(--muted-text)]">
                  ₮
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                Төлөгдөөгүй
              </div>
            </div>

            {delgerengui}

            {/* Selector Tabs (Deep Link vs QR Code) */}
            <div
              role="tablist"
              aria-label="Төлөх арга"
              className="flex gap-1 rounded-full border border-white/5 bg-white/[0.03] p-1"
            >
              {(
                [
                  { id: "deeplink", ner: "Банкны апп", Dugaar: Smartphone },
                  { id: "qrcode", ner: "QR код", Dugaar: QrCode },
                ] as const
              ).map(({ id, ner, Dugaar }) => {
                const idevkhtei = activeTab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    type="button"
                    aria-selected={idevkhtei}
                    onClick={() => setActiveTab(id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      idevkhtei
                        ? "bg-theme text-white shadow-lg shadow-theme/20"
                        : "text-[color:var(--muted-text)] hover:text-white"
                    }`}
                  >
                    <Dugaar className="h-4 w-4" />
                    {ner}
                  </button>
                );
              })}
            </div>

            {/* Dynamic View container */}
            <div>
              {activeTab === "deeplink" ? (
                /* DEEP LINKS LIST (FOR MOBILE DIRECT LAUNCH) */
                <div className="space-y-3">
                  <p className="text-center text-[12px] leading-relaxed text-[color:var(--muted-text)]">
                    Ашигладаг банкаа сонгоход апп шууд нээгдэнэ.
                  </p>
                  {invoice.qpayUrls && invoice.qpayUrls.length > 0 ? (
                    <div className="custom-scrollbar grid max-h-[17rem] grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {invoice.qpayUrls.map((bank: any) => (
                        <a
                          href={bank.link}
                          key={bank.name}
                          className="group flex items-center gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px"
                        >
                          {bank.logo ? (
                            <img
                              src={bank.logo}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-xl object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-white">
                              {bank.name?.charAt(0)}
                            </div>
                          )}
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-snug text-white/90 transition-colors group-hover:text-white">
                            {bank.description || bank.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-8 text-center">
                      <TriangleAlert className="h-7 w-7 text-warning/70" />
                      <p className="text-[12px] leading-relaxed text-[color:var(--muted-text)]">
                        Банкны апп холбоос олдсонгүй. «QR код» сонголтыг ашиглан
                        төлнө үү.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* QR CODE DISPLAY (FOR SCANNING) */
                <div className="flex flex-col items-center gap-4">
                  <p className="text-center text-[12px] leading-relaxed text-[color:var(--muted-text)]">
                    Банкны апп-ынхаа QR уншуулагчаар доорх кодыг уншуулна уу.
                  </p>

                  {invoice.qpayUrl ? (
                    // QR-ын хүрээ нь ҮРГЭЛЖ цагаан — уншигдах контраст нь
                    // сэдвээс хамаарч болохгүй (`--surface-bg` нь бараан
                    // сэдэвт хар болж, код уншигдахгүй болдог байв).
                    <div className="relative rounded-3xl bg-white p-4 shadow-xl">
                      <div className="relative flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
                        {invoice.qpayUrl.startsWith("data:image/") ||
                        invoice.qpayUrl.length > 500 ? (
                          <img
                            src={
                              invoice.qpayUrl.startsWith("data:image/")
                                ? invoice.qpayUrl
                                : `data:image/png;base64,${invoice.qpayUrl}`
                            }
                            alt="QPay QR код"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <QRCodeSVG
                            value={invoice.qpayUrl}
                            size={176}
                            bgColor="#ffffff"
                            fgColor="#09090b"
                            level="M"
                            className="h-full w-full"
                          />
                        )}
                        {/* Overlay Amarhome logo in center */}
                        <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-white bg-white p-1 shadow-md">
                          <img
                            src="/logo.png"
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/[0.02]">
                      <TriangleAlert className="h-6 w-6 text-[color:var(--muted-text)]" />
                      <span className="text-[11px] text-[color:var(--muted-text)]">
                        QR код олдсонгүй
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status footer spinner */}
            <div
              aria-live="polite"
              className="flex items-center justify-center gap-2 border-t border-white/5 pt-4 text-[11px] text-[color:var(--muted-text)]"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-theme opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-theme" />
              </span>
              Төлбөрийг автоматаар шалгаж байна
              {isValidating && <RefreshCw className="h-3 w-3 animate-spin" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Devsger>
  );
}
