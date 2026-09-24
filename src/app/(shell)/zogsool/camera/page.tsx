"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
import {
  Calendar,
  DollarSign,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  X,
  Wifi,
  WifiOff,
  Bell,
  Clock,
  Copy,
  Settings,
  Share2,
  ExternalLink,
  Info,
  MoreHorizontal,
  ChevronDown,
  Plus,
  Filter,
  ArrowUpDown,
  Tag,
  ChevronLeft,
  ChevronRight,

  Receipt,
  AlertTriangle,
} from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { ConfigProvider } from "antd";
import moment from "moment";
import { getDefaultDateRange } from "@/lib/utils";
import useSWR from "swr";
import axios from "axios";
import uilchilgee, {
  socket as getSocket,
  aldaaBarigch,
  url as apiUrl,
  getApiUrl,
} from "@/lib/uilchilgee";
import formatNumber from "../../../../../tools/function/formatNumber";
import WebRTCVideoPlayer from "@/components/WebRTCVideoPlayer";
import { type Uilchluulegch } from "@/lib/useParkingSocket";
import PaymentModal from "./PaymentModal";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
import { PaymentPopup } from "./PaymentPopup";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";
import { tulburiinZadargaaBodyo } from "@/lib/tulburiinZadargaa";

const RealTimeDuration = ({
  orsonTsag,
  garsanTsag,
  niitKhugatsaa,
}: {
  orsonTsag?: string;
  garsanTsag?: string;
  niitKhugatsaa?: number;
}) => {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => {
        setNow(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);

  if (!orsonTsag) return <span>00 : 00 : 00</span>;

  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));

  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  if (!garsanTsag) {
    return (
      <span className="text-[11px]  font-mono text-[color:var(--panel-text)]">
        {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} :{" "}
        {String(seconds).padStart(2, "0")}
      </span>
    );
  }

  const khugatsaaMin =
    niitKhugatsaa ?? Math.max(0, Math.ceil(diff.asMinutes()));
  const h = Math.floor(khugatsaaMin / 60);
  const m = khugatsaaMin % 60;
  return (
    <span className="text-[11px] text-[color:var(--panel-text)]">
      {h > 0 ? `${h} цаг ${m} мин` : `${m} мин`}
    </span>
  );
};

/**
 * Баганын шүүлтүүрийн попап.
 *
 * Өмнөх хувилбарын гэмтэл:
 *   • Гадаргуу `bg-white/95` тогтмол — ХАРАНХУЙ горимд цагаан панел дээр
 *     `dark:text-white` текст үл харагдана.
 *   • Сонгогдсон мөрийн `text-brand/20` — 20% тунгалаг брэнд өнгө, өөрөөр
 *     хэлбэл текст бараг үзэгдэхгүй. (`dark:` хураахад орфан болсон alpha.)
 *   • Тусгаарлагч `bg-[color:var(--panel)]` — цайвар горимд бараг цагаан
 *     тул шугам харагдахгүй.
 *   • Заагч цэгийн гэрэлтэлт хатуу ЦЭНХЭР, сэдвийн ногоонтой зөрдөг.
 *   • Нэг л удаа байрлаж, ДАХИН тооцоологддоггүй — хүснэгтийн бие дотроо
 *     гүйхэд попап тригерээсээ салж хоцордог.
 *   • Escape ч, гадна дарах ч хаадаггүй; тригерийн хоорондох зай дээр
 *     хулгана гарангуут анивчдаг.
 *
 * Байрлуулах логикийг `turees/components/ui/primitives/Popup.js`-аас
 * хуулав: доор тохирохгүй бол ДЭЭШ эргэнэ, хөндлөнгөөр цонхонд багтана,
 * scroll / resize / агуулгын өөрчлөлтөд дахин байрлана.
 */
const FilterPopover = ({
  label,
  options,
  current,
  onSelect,
  children,
}: {
  label: string;
  options: { label: string; value: string }[];
  current: string;
  onSelect: (v: string) => void;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, kharagdakh: false });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const tsagKhemjigch = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Тригерийн хажууд байрлуулна; доор багтахгүй бол дээш эргэнэ. */
  const baiirshuulya = useCallback(() => {
    const tr = triggerRef.current;
    const pp = popupRef.current;
    if (!tr || !pp) return;
    const r = tr.getBoundingClientRect();
    const pw = pp.offsetWidth;
    const ph = pp.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const doorBagtakh = r.bottom + 6 + ph <= vh;
    const deerBagtakh = r.top - 6 - ph >= 0;
    const deeshee = !doorBagtakh && deerBagtakh;
    const top = deeshee ? r.top - ph - 6 : r.bottom + 6;

    // Тригерийн хөндлөн ТӨВД, гэхдээ цонхны ирмэгээс 8px дотогш
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.min(Math.max(left, 8), Math.max(8, vw - pw - 8));

    setPos((khuuchin) =>
      khuuchin.top === top && khuuchin.left === left && khuuchin.kharagdakh
        ? khuuchin
        : { top, left, kharagdakh: true },
    );
  }, []);

  const neekh = () => {
    if (tsagKhemjigch.current) clearTimeout(tsagKhemjigch.current);
    tsagKhemjigch.current = setTimeout(() => setOpen(true), 90);
  };
  // Тригер ба попапын хооронд зай байгаа тул хулгана гарангуут хаавал
  // анивчина — хойшлуулж хаана.
  const khaakh = () => {
    if (tsagKhemjigch.current) clearTimeout(tsagKhemjigch.current);
    tsagKhemjigch.current = setTimeout(() => setOpen(false), 130);
  };

  useEffect(() => {
    if (!open) {
      setPos((p) => (p.kharagdakh ? { ...p, kharagdakh: false } : p));
      return;
    }
    baiirshuulya();

    // Хүснэгтийн бие ДОТРОО гүйдэг тул `capture` шаардлагатай — эс
    // тэгвээс зөвхөн цонхны гүйлт баригдана.
    const dakhinBaiirshuulya = () => baiirshuulya();
    window.addEventListener("scroll", dakhinBaiirshuulya, true);
    window.addEventListener("resize", dakhinBaiirshuulya);

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && popupRef.current) {
      ro = new ResizeObserver(dakhinBaiirshuulya);
      ro.observe(popupRef.current);
    }

    const tovchlolt = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const gadnaDarsan = (e: MouseEvent) => {
      const n = e.target as Node;
      if (popupRef.current?.contains(n)) return;
      if (triggerRef.current?.contains(n)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", tovchlolt);
    document.addEventListener("mousedown", gadnaDarsan);

    return () => {
      window.removeEventListener("scroll", dakhinBaiirshuulya, true);
      window.removeEventListener("resize", dakhinBaiirshuulya);
      ro?.disconnect();
      document.removeEventListener("keydown", tovchlolt);
      document.removeEventListener("mousedown", gadnaDarsan);
    };
  }, [open, baiirshuulya]);

  useEffect(
    () => () => {
      if (tsagKhemjigch.current) clearTimeout(tsagKhemjigch.current);
    },
    [],
  );

  return (
    <div
      ref={triggerRef}
      onMouseEnter={neekh}
      onMouseLeave={khaakh}
      onClick={() => {
        if (tsagKhemjigch.current) clearTimeout(tsagKhemjigch.current);
        setOpen((v) => !v);
      }}
      aria-haspopup="menu"
      aria-expanded={open}
      className="h-full"
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={popupRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 99999,
              visibility: pos.kharagdakh ? "visible" : "hidden",
            }}
            className="w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--panel)] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
            onMouseEnter={neekh}
            onMouseLeave={khaakh}
          >
            <div className="mb-1 px-3 py-2 text-[11px] text-[color:var(--muted-text)]">
              {label} сонгох
            </div>
            {options.map((opt, idx, arr) => {
              const songogdson = current === opt.value;
              return (
                <div key={opt.value ?? idx}>
                  <div
                    role="menuitemradio"
                    aria-checked={songogdson}
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(opt.value);
                        setOpen(false);
                      }
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-theme/40 ${
                      songogdson
                        ? "bg-theme/10 font-medium text-brand"
                        : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {songogdson && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme ring-[3px] ring-theme/20" />
                    )}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="mx-2 my-1 h-px bg-[color:var(--surface-border)]" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

function tulburuudiigTsugluulya(transaction: any): any[] {
  const payHistory: any[] = (transaction?.tuukh || []).flatMap((th: any) => {
    const raw = th?.tulbur;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") return [raw];
    return [];
  });
  return payHistory.filter(
    (pay: any) =>
      (pay?.dun ?? 0) > 0 &&
      pay?.turul !== "khungulult" &&
      pay?.turul !== "discount" &&
      pay?.turul !== "Хөнгөлөлт",
  );
}

/**
 * Мөрийн төлвийг нэг дор бодно. Өмнө нь эдгээр хувьсагчид <tr> дотор
 * тооцогддог байсан; багана бүр тусдаа render-тэй болсон тул нийтлэг
 * функц болгов.
 */
function murNiiluulye(transaction: any) {
  const mur = transaction?.tuukh?.[0];
  const tsag = mur?.tsagiinTuukh?.[0];
  const orsonTsag = tsag?.orsonTsag;
  const garsanTsag = tsag?.garsanTsag;
  const tuluv = mur?.tuluv;
  const niitDun = transaction?.niitDun || 0;
  const isCurrentlyIn = !mur?.garsanKhaalga;
  const isFreeExit = !!mur?.uneguiGarsan && tuluv !== -2 && tuluv !== -1;
  const isPaid = tuluv === 1;
  const isDebt =
    !isFreeExit &&
    (tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn));
  const rawTulbur = mur?.tulbur;
  const tulburArr: any[] = Array.isArray(rawTulbur)
    ? rawTulbur
    : rawTulbur
      ? [rawTulbur]
      : [];
  const positivePaid = tulburArr.reduce(
    (sum: number, pay: any) => sum + (pay?.dun > 0 ? pay.dun : 0),
    0,
  );
  const discountTotal = tulburArr
    .filter(
      (pay: any) =>
        pay?.turul === "khungulult" ||
        pay?.turul === "discount" ||
        pay?.turul === "Хөнгөлөлт",
    )
    .reduce((sum: number, pay: any) => sum + Math.abs(pay?.dun ?? 0), 0);
  const effectiveOwed = Math.max(0, niitDun - discountTotal);
  const hasRemainingBalance =
    tuluv === 1 &&
    effectiveOwed > 0 &&
    !isCurrentlyIn &&
    positivePaid < effectiveOwed;
  return {
    mur,
    orsonTsag,
    garsanTsag,
    tuluv,
    niitDun,
    isCurrentlyIn,
    isFreeExit,
    isPaid,
    isDebt,
    discountTotal,
    hasRemainingBalance,
    isActive: isCurrentlyIn,
    showActionBtn: isCurrentlyIn || isDebt || hasRemainingBalance,
  };
}

export default function Camera() {
  const { token, ajiltan, baiguullaga, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const { searchTerm } = useSearch();
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Uilchluulegch | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Record<string, Uilchluulegch>>(
    {},
  );
  const latestPlatesRef = useRef<Record<string, string>>({});
  const [activeEntryIP, setActiveEntryIP] = useState<string>("");
  const [activeExitIP, setActiveExitIP] = useState<string>("");
  const [confirmExitId, setConfirmExitId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [freeExitModalTransaction, setFreeExitModalTransaction] =
    useState<Uilchluulegch | null>(null);
  const [freeExitReason, setFreeExitReason] = useState<string>("Агуулах");
  const [violationModalTransaction, setViolationModalTransaction] =
    useState<Uilchluulegch | null>(null);
  const [violationReason, setViolationReason] = useState<string>("");
  const [customFreeExitReason, setCustomFreeExitReason] = useState<string>("");
  const [isExiting, setIsExiting] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(500);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const [durationFilter, setDurationFilter] = useState("latest_out");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortConfig, setSortConfig] = useState<{ col: string; dir: "asc" | "desc" } | null>(null);
  const [ebarimtResult, setEbarimtResult] = useState<any>(null);
  const [discountModalTransaction, setDiscountModalTransaction] =
    useState<Uilchluulegch | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountMinutes, setDiscountMinutes] = useState("");
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [revenueDateRange, setRevenueDateRange] = useState<[string | null, string | null] | undefined>(undefined);
  const [revenueListData, setRevenueListData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(() => { const today = moment().format("YYYY-MM-DD"); return [today, today]; });

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const today = moment().format("YYYY-MM-DD");
    const range = dateRange || [today, today];
    return {
      start: range[0] || "",
      end: range[1] || "",
    };
  }, [dateRange]);

  const shouldFetch = !!token && !!ajiltan?.baiguullagiinId;

  // Fetch parking configuration to get camera IPs
  const { data: parkingConfigData } = useSWR(
    shouldFetch
      ? ["/parking", token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 100,
        },
      });
      return resp.data;
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    },
  );

  // Extract cameras from parking configuration
  const cameras = useMemo(() => {
    const parkingList = Array.isArray(parkingConfigData?.jagsaalt)
      ? parkingConfigData.jagsaalt
      : Array.isArray(parkingConfigData)
        ? parkingConfigData
        : [];

    const allCameras: Array<{
      cameraIP: string;
      cameraPort: number; // RTSP port
      httpPort?: number; // HTTP port for fallback
      cameraType: "entry" | "exit";
      cameraName?: string;
      gateName?: string;
      cameraUsername?: string;
      cameraPassword?: string;
      root?: string; // Stream path (ROOT from tokhirgoo)
      tokhirgoo?: {
        USER?: string;
        PASSWD?: string;
        ROOT?: string;
        PORT?: string;
        dotorKamerEsekh?: boolean;
      };
    }> = [];

    parkingList.forEach((parking: any) => {
      if (Array.isArray(parking?.khaalga)) {
        parking.khaalga.forEach((gate: any) => {
          if (Array.isArray(gate?.camera)) {
            gate.camera.forEach((cam: any) => {
              if (cam?.cameraIP) {
                // For RTSP, use tokhirgoo.PORT if available, otherwise default to 554 (RTSP standard port)
                // For HTTP fallback, use cameraPort or 80
                const rtspPort = cam.tokhirgoo?.PORT
                  ? Number(cam.tokhirgoo.PORT)
                  : 554; // RTSP default port
                const httpPort = cam.cameraPort || 80;

                // Extract username and password from tokhirgoo object
                const username =
                  cam.tokhirgoo?.USER || cam.cameraUsername || "";
                const password =
                  cam.tokhirgoo?.PASSWD || cam.cameraPassword || "";

                allCameras.push({
                  cameraIP: cam.cameraIP,
                  cameraPort: rtspPort, // Use RTSP port for streaming
                  httpPort: httpPort, // Keep HTTP port for fallback
                  cameraType:
                    cam.cameraType ||
                    (gate.turul === "Орох" ? "entry" : "exit"),
                  cameraName: cam.cameraName || cam.cameraIP,
                  gateName: gate.ner,
                  cameraUsername: username,
                  cameraPassword: password,
                  tokhirgoo: cam.tokhirgoo,
                  root: cam.tokhirgoo?.ROOT || "stream", // Use ROOT from tokhirgoo, default to "stream"
                });
              }
            });
          }
        });
      }
    });

    return allCameras;
  }, [parkingConfigData]);

  const socketRef = useRef<any>(null);

  // Stabilize cameras reference to prevent socket effector from re-running unnecessarily
  const camerasHash = useMemo(() => JSON.stringify(cameras), [cameras]);

  const entryCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "entry"),
    [camerasHash],
  );
  const exitCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "exit"),
    [camerasHash],
  );

  const garakhTsag = useMemo(() => {
    const list = Array.isArray(parkingConfigData?.jagsaalt)
      ? parkingConfigData.jagsaalt
      : Array.isArray(parkingConfigData)
        ? parkingConfigData
        : [];
    const val = list[0]?.garakhTsag;
    return val ? Number(val) : null;
  }, [parkingConfigData]);

  const parkingPricing = useMemo(() => {
    const list = Array.isArray(parkingConfigData?.jagsaalt)
      ? parkingConfigData.jagsaalt
      : Array.isArray(parkingConfigData)
        ? parkingConfigData
        : [];
    const cfg = list[0];
    if (!cfg) return null;
    // tulburuud[0].tariff[0].tulbur===0 means free minutes up to .minut
    const firstTariff = cfg.tulburuud?.[0]?.tariff?.[0];
    const uneguiMin = (firstTariff?.tulbur === 0 && firstTariff?.minut > 0) ? Number(firstTariff.minut) : 0;
    return {
      undsenUne: Number(cfg.undsenUne) || 0,
      undsenMin: !!cfg.undsenMin,  // true=30min unit, false=60min unit
      togtmolTulburEsekh: !!cfg.togtmolTulburEsekh,
      togtmolTulburiinDun: Number(cfg.togtmolTulburiinDun) || 0,
      uneguiMin,
    };
  }, [parkingConfigData]);

  function calculateParkingFee(khugatsaaMin: number): number {
    if (!parkingPricing) return 0;
    if (parkingPricing.togtmolTulburEsekh) return parkingPricing.togtmolTulburiinDun;
    const billable = Math.max(0, khugatsaaMin - parkingPricing.uneguiMin);
    if (billable === 0) return 0;
    // undsenMin=true → per 30min; undsenMin=false → per 60min (hour)
    const unit = parkingPricing.undsenMin ? 30 : 60;
    return Math.ceil(billable / unit) * parkingPricing.undsenUne;
  }

  // Reset live updates when filters or page change
  useEffect(() => {
    setLiveUpdates({});
  }, [page, searchTerm, dateRange, effectiveBarilgiinId]);

  // Sync active camera IPs when cameras load
  useEffect(() => {
    if (entryCameras.length > 0 && !activeEntryIP) {
      setActiveEntryIP(entryCameras[0].cameraIP);
    }
    if (exitCameras.length > 0 && !activeExitIP) {
      setActiveExitIP(exitCameras[0].cameraIP);
    }
  }, [entryCameras, exitCameras]);

  // State for transaction list
  const [listData, setListData] = useState<any>({
    jagsaalt: [],
    niitMur: 0,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Helper to fetch list via REST (as a fallback or for filters)
  const fetchList = useCallback(async () => {
    if (!rangeStart || !rangeEnd || !token) return;

    const query: any = {
      baiguullagiinId: ajiltan?.baiguullagiinId,
      barilgiinId: effectiveBarilgiinId || undefined,
      createdAt: {
        $gte: `${rangeStart} 00:00:00`,
        $lte: `${rangeEnd} 23:59:59`,
      },
    };

    if (searchTerm) {
      query.mashiniiDugaar = { $regex: searchTerm, $options: "i" };
    }

    if (typeFilter !== "all") {
      if (typeFilter === "Үйлчлүүлэгч") {
        query.$or = [
          { turul: "Үйлчлүүлэгч" },
          { turul: { $exists: false } },
          { turul: null },
          { turul: "" },
        ];
      } else {
        query.turul = typeFilter;
      }
    }

    if (statusFilter === "active") {
      // Идэвхтэй: Currently in (no exit) and no payment due
      query["tuukh.garsanKhaalga"] = { $exists: false };
      query["tuukh.tsagiinTuukh.garsanTsag"] = { $exists: false };
      query.niitDun = 0;
    } else if (statusFilter === "paid") {
      // Төлсөн: Payment completed (tuluv === 1 and exited, or tuluv === 2)
      query["tuukh.tuluv"] = { $in: [1, 2] };
    } else if (statusFilter === "unpaid") {
      // Төлбөртэй: Has debt or unpaid amount
      query.$and = [
        {
          $or: [
            { "tuukh.tuluv": -4 },
            {
              "tuukh.tuluv": 0,
              niitDun: { $gt: 0 },
              "tuukh.garsanKhaalga": { $exists: true },
            },
          ],
        },
      ];
    } else if (statusFilter === "free") {
      // Үнэгүй: Exited with no payment, excluding violations
      query["tuukh.garsanKhaalga"] = { $exists: true };
      query.niitDun = 0;
      query["tuukh.0.tuluv"] = { $nin: [-1, -2] };
    }

    const sortObj =
      durationFilter === "longest"
        ? { "tuukh.0.niitKhugatsaa": -1 }
        : durationFilter === "latest_in"
          ? {
            "tuukh.tsagiinTuukh.garsanTsag": 1,
            niitDun: 1,
            "tuukh.tuluv": 1,
            "tuukh.tsagiinTuukh.orsonTsag": -1,
            zurchil: 1,
          }
          : { "tuukh.0.tsagiinTuukh.0.garsanTsag": -1 };

    try {
      const resp = await uilchilgee(token).get(
        "/zogsoolUilchluulegchJagsaalt",
        {
          params: {
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 10000,
            query: JSON.stringify(query),
            order: JSON.stringify(sortObj),
          },
        },
      );
      setListData(resp.data);
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setIsInitialLoading(false);
    }
  }, [
    rangeStart,
    rangeEnd,
    token,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId,
    searchTerm,
    typeFilter,
    statusFilter,
    durationFilter,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    rangeStart,
    rangeEnd,
    typeFilter,
    durationFilter,
    statusFilter,
  ]);

  // Initial fetch and fetch on changes
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Auto-exit: exit vehicles that have exceeded garakhTsag minutes
  useEffect(() => {
    if (!garakhTsag || garakhTsag <= 0 || !token || !ajiltan?.baiguullagiinId) return;

    const runAutoExit = async () => {
      try {
        const resp = await uilchilgee(token).get("/zogsoolUilchluulegchJagsaalt", {
          params: {
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 500,
            query: JSON.stringify({
              baiguullagiinId: ajiltan.baiguullagiinId,
              ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
              "tuukh.garsanKhaalga": { $exists: false },
              "tuukh.tsagiinTuukh.garsanTsag": { $exists: false },
            }),
          },
        });

        const activeList: any[] = resp.data?.jagsaalt || resp.data || [];
        if (!activeList.length) return;

        const now = moment();
        const exitIP = exitCameras[0]?.cameraIP || "";
        let exited = 0;

        for (const t of activeList) {
          const orsonTsag = t.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag;
          if (!orsonTsag) continue;
          const minutesIn = now.diff(moment(orsonTsag), "minutes");
          if (minutesIn < garakhTsag) continue;

          const garsanTsag = new Date();
          const khugatsaaMin = Math.max(
            0,
            Math.ceil((garsanTsag.getTime() - new Date(orsonTsag).getTime()) / 60000),
          );
          try {
            await uilchilgee(token).put(`/uilchluulegch/${t._id}`, {
              "tuukh.0.garsanKhaalga": exitIP,
              "tuukh.0.tsagiinTuukh.0.garsanTsag": garsanTsag.toISOString(),
              "tuukh.0.tsagiinTuukh.0.khugatsaa": khugatsaaMin,
              "tuukh.0.niitKhugatsaa": khugatsaaMin,
              "tuukh.0.tuluv": -1,
              "tuukh.0.uneguiGarsan": "Автомат гарсан",
              "tuukh.0.burtgesenAjiltaniiId": ajiltan._id || "",
              "tuukh.0.burtgesenAjiltaniiNer": ajiltan.ner || "CAdmin",
            });
            exited++;
          } catch (err) {
            console.error("Auto-exit PUT error:", t._id, err);
          }
        }

        if (exited > 0) fetchList();
      } catch (err) {
        console.error("Auto-exit check error:", err);
      }
    };

    const interval = setInterval(runAutoExit, 60000);
    runAutoExit();
    return () => clearInterval(interval);
  }, [garakhTsag, token, ajiltan, effectiveBarilgiinId, exitCameras, fetchList]);

  const getLatestPlateForCamera = useCallback((ip: string) => {
    // 1. Check our live socket updates cache first (most real-time)
    if (latestPlatesRef.current[ip]) {
      return latestPlatesRef.current[ip];
    }

    // 2. Fallback: Search in active transactions from listData and liveUpdates
    let list: Uilchluulegch[] = [];
    if (Array.isArray(listData?.jagsaalt)) list = listData.jagsaalt;
    else if (Array.isArray(listData?.list)) list = listData.list;
    else if (Array.isArray(listData?.data)) list = listData.data;
    else if (Array.isArray(listData)) list = listData;

    // Merge list and liveUpdates
    const allTxMap = new Map<string, Uilchluulegch>();
    list.forEach((item, index) => {
      const key = item._id || `list_${index}_${item.mashiniiDugaar || "unknown"}`;
      allTxMap.set(key, item);
    });
    Object.values(liveUpdates).forEach((update: any) => {
      const key = update._id || update.mashiniiDugaar;
      if (key) allTxMap.set(key, update);
    });

    const allTx = Array.from(allTxMap.values());
    const matchingTx = allTx
      .filter((t: any) => {
        const lastTuukh = t.tuukh?.[0];
        return lastTuukh?.orsonKhaalga === ip || lastTuukh?.garsanKhaalga === ip;
      })
      .sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag || 0).getTime();
        const timeB = new Date(b.createdAt || b.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag || 0).getTime();
        return timeB - timeA;
      });

    if (matchingTx.length > 0) {
      return matchingTx[0].mashiniiDugaar || "";
    }

    // 3. Fallback to the general latest active car
    const fallbackActive = listData?.jagsaalt?.find((t: any) => !t.tuukh?.[0]?.garsanKhaalga)?.mashiniiDugaar || "";
    return fallbackActive;
  }, [listData, liveUpdates]);

  const khaalgaNeey = useCallback(
    (ip: string) => {
      if (!ip) return;
      if (token) {
        // Find latest recognized plate for this specific camera IP
        const latestPlate = getLatestPlateForCamera(ip);

        uilchilgee(token)
          .get("/neeye/" + ip, {
            params: {
              barilgiinId: effectiveBarilgiinId,
              mashiniiDugaar: latestPlate
            },
          })
          .catch(aldaaBarigch);
      }
    },
    [token, effectiveBarilgiinId, getLatestPlateForCamera],
  );

  async function handleManualExit(
    transaction: Uilchluulegch,
    type: "pay" | "free",
  ) {
    if (type === "pay") {
      setSelectedTransaction(transaction);
      setConfirmExitId(null);
    } else {
      // SDK Exit Call
      try {
        const payload = {
          mashiniiDugaar: transaction.mashiniiDugaar,
          CAMERA_IP: activeExitIP || exitCameras[0]?.cameraIP,
          barilgiinId: effectiveBarilgiinId,
          baiguullagiinId: transaction.baiguullagiinId, // Added for backend lookup
        };

        const resp = await axios.post(
          `${getApiUrl()}zogsoolSdkService`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (
          (resp.status === 200 && !resp.data.aldaa) ||
          resp.data === "Amjilttai"
        ) {
          toast.success("Гаралтын команд амжилттай");
          setConfirmExitId(null);
          fetchList();
        } else {
          toast.error(
            "Алдаа: " + (resp.data.aldaa || resp.data?.message || "Амжилтгүй"),
          );
        }
      } catch (err) {
        console.error("SDK Error:", err);
        toast.error("Команд илгээхэд алдаа гарлаа");
      }
    }
  }

  async function handleWarehouseExit(transaction: Uilchluulegch, reason: string) {
    try {
      const orsonTsag = transaction.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag;
      const garsanTsag = new Date();
      const khugatsaaMin = orsonTsag
        ? Math.max(
          0,
          Math.ceil(
            (garsanTsag.getTime() - new Date(orsonTsag).getTime()) / 60000,
          ),
        )
        : 0;
      const exitIP = activeExitIP || exitCameras[0]?.cameraIP || undefined;

      const payload = {
        "tuukh.0.garsanKhaalga": exitIP,
        "tuukh.0.tsagiinTuukh.0.garsanTsag": garsanTsag.toISOString(),
        "tuukh.0.tsagiinTuukh.0.khugatsaa": khugatsaaMin,
        "tuukh.0.niitKhugatsaa": khugatsaaMin,
        "tuukh.0.tuluv": -1,
        "tuukh.0.uneguiGarsan": reason,
        "tuukh.0.burtgesenAjiltaniiId": ajiltan?._id || "",
        "tuukh.0.burtgesenAjiltaniiNer": ajiltan?.ner || "CAdmin",
      };

      const resp = await uilchilgee(token || undefined).put(
        `/uilchluulegch/${transaction._id}`,
        payload,
      );

      if (resp.status === 200 || resp.data === "Amjilttai") {
        toast.success("Гаралтын команд амжилттай");
        if (exitIP) khaalgaNeey(exitIP);
        setConfirmExitId(null);
        fetchList();
      } else {
        toast.error(
          "Алдаа: " +
          (resp.data?.message ||
            (typeof resp.data === "string" ? resp.data : "Амжилтгүй")),
        );
      }
    } catch (err: any) {
      console.error("Manual exit PUT error:", err);
      toast.error(
        "Команд илгээхэд алдаа гарлаа: " +
        (err.response?.data?.aldaa || err.message),
      );
    }
  }

  async function handleViolationSubmit(transaction: Uilchluulegch, reason: string) {
    try {
      const orsonTsag = transaction.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag;
      const garsanTsag = new Date();
      const khugatsaaMin = orsonTsag
        ? Math.max(0, Math.ceil((garsanTsag.getTime() - new Date(orsonTsag).getTime()) / 60000))
        : 0;
      const exitIP = activeExitIP || exitCameras[0]?.cameraIP || "ЗӨРЧИЛ";

      const zurchilText = reason || "Зөрчил бүртгэгдлээ";
      const calculatedFee = calculateParkingFee(khugatsaaMin);
      const resp = await uilchilgee(token || "").put(`/uilchluulegch/${transaction._id}`, {
        "tuukh.0.tuluv": -2,
        "tuukh.0.garsanKhaalga": exitIP,
        "tuukh.0.tsagiinTuukh.0.garsanTsag": garsanTsag.toISOString(),
        "tuukh.0.tsagiinTuukh.0.khugatsaa": khugatsaaMin,
        "tuukh.0.niitKhugatsaa": khugatsaaMin,
        "tuukh.0.burtgesenAjiltaniiId": ajiltan?._id || "",
        "tuukh.0.burtgesenAjiltaniiNer": ajiltan?.ner || "",
        "tuukh.0.zurchil": zurchilText,
        zurchil: zurchilText,
        ...(calculatedFee > 0 ? { niitDun: calculatedFee } : {}),
      });
      if (resp.status === 200 || resp.data === "Amjilttai") {
        toast.success("Зөрчил амжилттай бүртгэгдлээ");
        setViolationModalTransaction(null);
        setViolationReason("");
        fetchList();
      } else {
        toast.error("Алдаа: " + (resp.data?.message || "Амжилтгүй"));
      }
    } catch (err: any) {
      console.error("Violation record error:", err);
      toast.error("Зөрчил бүртгэхэд алдаа гарлаа: " + (err.response?.data?.aldaa || err.message));
    }
  }

  // QPay listener (zogsool.md lines 916-953)
  useEffect(() => {
    if (!baiguullaga?._id || !cameras.length) return;
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }

    const s = socketRef.current;
    const cleanup: (() => void)[] = [];

    exitCameras.forEach((cam) => {
      const eventName = `qpayMobileSdk${baiguullaga?._id}${cam.cameraIP}`;
      const handleGarahTulsun = (data: any) => {
        if (
          !data ||
          !data?.mashiniiDugaar ||
          !data?.baiguullagiinId ||
          data?.baiguullagiinId !== baiguullaga?._id
        )
          return;
        if (data.cameraIP && data.mashiniiDugaar) {
          latestPlatesRef.current[data.cameraIP] = data.mashiniiDugaar;
        }
        khaalgaNeey(data.cameraIP);
      };
      s.on(eventName, handleGarahTulsun);
      cleanup.push(() => s.off(eventName, handleGarahTulsun));
    });

    return () => cleanup.forEach((fn) => fn());
  }, [baiguullaga?._id, exitCameras]);

  useEffect(() => {
    const bId = ajiltan?.baiguullagiinId || baiguullaga?._id;
    if (!bId || !cameras.length) return;
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }

    const s = socketRef.current;
    const cleanup: (() => void)[] = [];

    s.on("connect", () => {
      setIsConnected(true);
    });
    s.on("disconnect", () => setIsConnected(false));
    setIsConnected(s.connected);

    const handleGeneralUpdate = (data: any) => {
      if (data?._id && data?.baiguullagiinId === bId) {
        // Cache recognized plate mapping
        const lastTuukh = data.tuukh?.[0];
        if (data.mashiniiDugaar) {
          if (lastTuukh?.garsanKhaalga) {
            latestPlatesRef.current[lastTuukh.garsanKhaalga] = data.mashiniiDugaar;
          }
          if (lastTuukh?.orsonKhaalga) {
            latestPlatesRef.current[lastTuukh.orsonKhaalga] = data.mashiniiDugaar;
          }
        }

        setLiveUpdates((prev: Record<string, Uilchluulegch>) => {
          const newState: Record<string, Uilchluulegch> = {
            ...prev,
            [data._id]: data,
          };
          // If we have a synthetic entry (key == plate), remove it now that we have the real data
          if (data.mashiniiDugaar && newState[data.mashiniiDugaar]) {
            delete newState[data.mashiniiDugaar];
          }
          return newState;
        });
        fetchList();
      }
    };

    s.on(`zogsool${bId}`, handleGeneralUpdate);
    cleanup.push(() => s.off(`zogsool${bId}`, handleGeneralUpdate));

    const handleOroh = (data: any) => {
      if (
        !data ||
        !data?.mashiniiDugaar ||
        !data?.baiguullagiinId ||
        data?.baiguullagiinId !== bId
      )
        return;

      if (data.cameraIP && data.mashiniiDugaar) {
        latestPlatesRef.current[data.cameraIP] = data.mashiniiDugaar;
      }

      if (!data?.oruulakhguiEsekh) {
        khaalgaNeey(data.cameraIP);

        // Create synthetic update to avoid REST fetch and update "Идэвхтэй" list
        // Use plate as ID to ensure we only have one entry for this car in liveUpdates
        const plate = data.mashiniiDugaar;
        setLiveUpdates((prev) => ({
          ...prev,
          [plate]: {
            _id: plate, // Use plate as stable ID for synthetic entry
            mashiniiDugaar: plate,
            baiguullagiinId: data.baiguullagiinId,
            createdAt: new Date().toISOString(),
            tuukh: [
              {
                tsagiinTuukh: [{ orsonTsag: new Date().toISOString() }],
                orsonKhaalga: data.cameraIP,
                tuluv: 0,
              },
            ],
          },
        }));
      }

      fetchList();
      const dugaar = data.mashiniiDugaar?.replace("???", "");
    };

    const handleGarah = (u: any) => {
      if (
        !u ||
        !u?.mashiniiDugaar ||
        !u?.baiguullagiinId ||
        u?.baiguullagiinId !== bId
      )
        return;

      const exitIP = u.tuukh?.[0]?.garsanKhaalga;
      if (exitIP && u.mashiniiDugaar) {
        latestPlatesRef.current[exitIP] = u.mashiniiDugaar;
      }

      let niit = u?.niitDun || 0;
      if (u?.tuukh?.[0]?.tulbur?.length > 0) {
        niit =
          u.niitDun -
          u.tuukh.reduce(
            (s: number, t: any) =>
              s +
              (t?.tulbur?.reduce((a: number, b: any) => a + (b?.dun || 0), 0) ||
                0),
            0,
          );
      }
      if (niit < 0) niit = 0;


      if (u?.turul === "Үнэгүй" || niit === 0) {
        if (u?.tuukh?.[0]?.garsanKhaalga) {
          khaalgaNeey(u.tuukh[0].garsanKhaalga);
        }
      }
      if (u?._id) handleGeneralUpdate(u);
    };

    const handleGarahTulsun = (data: any) => {
      if (
        !data ||
        !data?.mashiniiDugaar ||
        !data?.baiguullagiinId ||
        data?.baiguullagiinId !== bId
      )
        return;
      if (data.cameraIP && data.mashiniiDugaar) {
        latestPlatesRef.current[data.cameraIP] = data.mashiniiDugaar;
      }
      khaalgaNeey(data.cameraIP);
      fetchList();
    };

    entryCameras.forEach((cam) => {
      const eventName = `zogsoolOroh${bId}${cam.cameraIP}`;
      s.on(eventName, handleOroh);
      cleanup.push(() => s.off(eventName, handleOroh));
    });

    exitCameras.forEach((cam) => {
      const e1 = `zogsoolGarah${bId}${cam.cameraIP}`;
      const e2 = `zogsoolGarahTulsun${bId}${cam.cameraIP}`;

      s.on(e1, handleGarah);
      s.on(e2, handleGarahTulsun);

      cleanup.push(() => {
        s.off(e1, handleGarah);
        s.off(e2, handleGarahTulsun);
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, [
    baiguullaga?._id,
    ajiltan?.baiguullagiinId,
    camerasHash,
    token,
    fetchList,
  ]);

  const { transactions, totalFiltered } = useMemo(() => {
    const data = listData;
    let list: Uilchluulegch[] = [];

    if (Array.isArray(data?.jagsaalt)) list = data.jagsaalt;
    else if (Array.isArray(data?.list)) list = data.list;
    else if (Array.isArray(data?.data)) list = data.data;
    else if (Array.isArray(data)) list = data;

    const transactionMap = new Map<string, Uilchluulegch>();
    const platesWithRealId = new Set<string>();

    list.forEach((item, index) => {
      const key =
        item._id || `list_${index}_${item.mashiniiDugaar || "unknown"}`;
      transactionMap.set(key, item);
      if (item._id && item._id !== item.mashiniiDugaar) {
        platesWithRealId.add(item.mashiniiDugaar);
      }
    });

    // First pass of liveUpdates to identify more real IDs
    Object.values(liveUpdates).forEach((update: any) => {
      if (update._id && update._id !== update.mashiniiDugaar) {
        platesWithRealId.add(update.mashiniiDugaar);
      }
    });

    Object.values(liveUpdates).forEach((update: any) => {
      // If synthetic (id == plate) and we have a real record for this plate, skip the synthetic one
      if (
        update._id === update.mashiniiDugaar &&
        platesWithRealId.has(update.mashiniiDugaar)
      ) {
        return;
      }
      const key = update._id || update.mashiniiDugaar;
      if (key) {
        const existing = transactionMap.get(key);
        // Don't override a properly exited record (has garsanTsag) with a stale live update that lacks it
        const existingGarsan = existing?.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag;
        const updateGarsan = update?.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag;
        if (existing && existingGarsan && !updateGarsan) return;
        transactionMap.set(key, update);
      }
    });

    let merged = Array.from(transactionMap.values());

    // Filter Type
    if (typeFilter !== "all") {
      merged = merged.filter((t) => {
        const type = t.turul || t.tuukh?.[0]?.turul || "Үйлчлүүлэгч";
        return type === typeFilter;
      });
    }

    // Filter Status
    if (statusFilter !== "all") {
      merged = merged.filter((t) => {
        const mur = t.tuukh?.[0];
        const tsag = mur?.tsagiinTuukh?.[0];
        const garsanTsag = tsag?.garsanTsag;
        // Check both garsanKhaalga and garsanTsag - if either exists, car has exited
        const isCurrentlyIn = !mur?.garsanKhaalga && !garsanTsag;
        const niitDun = t.niitDun || 0;
        const tuluv = mur?.tuluv;
        const isDebt =
          tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn);

        if (statusFilter === "active") {
          // Идэвхтэй: Currently in and no payment due
          return isCurrentlyIn && niitDun === 0;
        }
        if (statusFilter === "paid") {
          // Төлсөн: Payment completed (tuluv === 1 and not currently in, or tuluv === 2)
          return (tuluv === 1 && !isCurrentlyIn) || tuluv === 2;
        }
        if (statusFilter === "unpaid") {
          // Төлбөртэй: Has debt or unpaid amount
          return !isCurrentlyIn && (niitDun > 0 || isDebt);
        }
        if (statusFilter === "free") {
          // Үнэгүй: Exited with no payment, excluding violations
          return !isCurrentlyIn && niitDun === 0 && tuluv !== -2 && tuluv !== -1;
        }
        return true;
      });
    }

    // Sort
    merged.sort((a, b) => {
      const getInTime = (t: Uilchluulegch) =>
        t.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag
          ? new Date(t.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag).getTime()
          : t.createdAt
            ? new Date(t.createdAt).getTime()
            : 0;
      const getOutTime = (t: Uilchluulegch) =>
        t.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag
          ? new Date(t.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag).getTime()
          : 0;

      if (sortConfig) {
        const d = sortConfig.dir === "asc" ? 1 : -1;
        let aVal: any, bVal: any;
        switch (sortConfig.col) {
          case "dugaar":
            return d * (a.mashiniiDugaar || "").localeCompare(b.mashiniiDugaar || "");
          case "orson":
            return d * (getInTime(a) - getInTime(b));
          case "garsan":
            return d * (getOutTime(a) - getOutTime(b));
          case "duration":
            aVal = getOutTime(a) ? getOutTime(a) - getInTime(a) : Date.now() - getInTime(a);
            bVal = getOutTime(b) ? getOutTime(b) - getInTime(b) : Date.now() - getInTime(b);
            return d * (aVal - bVal);
          case "type":
            return d * (a.turul || a.tuukh?.[0]?.turul || "").localeCompare(b.turul || b.tuukh?.[0]?.turul || "");
          case "discount":
            return d * ((Number(a.tuukh?.[0]?.khungulult) || 0) - (Number(b.tuukh?.[0]?.khungulult) || 0));
          case "amount":
            return d * ((a.niitDun || 0) - (b.niitDun || 0));
          case "payment":
            aVal = (Array.isArray(a.tuukh?.[0]?.tulbur) ? a.tuukh![0].tulbur! : []).reduce((s: number, p: any) => s + (p.dun || 0), 0);
            bVal = (Array.isArray(b.tuukh?.[0]?.tulbur) ? b.tuukh![0].tulbur! : []).reduce((s: number, p: any) => s + (p.dun || 0), 0);
            return d * (aVal - bVal);
          case "ebarimt":
            return d * (((a.tuukh?.[0] as any)?.ebarimtDugaar || "").localeCompare((b.tuukh?.[0] as any)?.ebarimtDugaar || ""));
          case "status":
            return d * ((a.tuukh?.[0]?.tuluv ?? -99) - (b.tuukh?.[0]?.tuluv ?? -99));
          case "reason":
            return d * (a.tuukh?.[0]?.uneguiGarsan || "").localeCompare(b.tuukh?.[0]?.uneguiGarsan || "");
          default:
            return 0;
        }
      }

      // Default: durationFilter
      if (durationFilter === "longest") {
        const durA = getOutTime(a)
          ? getOutTime(a) - getInTime(a)
          : Date.now() - getInTime(a);
        const durB = getOutTime(b)
          ? getOutTime(b) - getInTime(b)
          : Date.now() - getInTime(b);
        return durB - durA;
      } else if (durationFilter === "latest_in") {
        return getInTime(b) - getInTime(a);
      } else {
        const timeA = getOutTime(a) || getInTime(a);
        const timeB = getOutTime(b) || getInTime(b);
        return timeB - timeA;
      }
    });

    // Calculate total BEFORE pagination
    const totalFiltered = merged.length;

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const transactions = merged.slice(startIndex, endIndex);

    return { transactions, totalFiltered };
  }, [
    listData,
    liveUpdates,
    page,
    pageSize,
    durationFilter,
    typeFilter,
    statusFilter,
    sortConfig,
  ]);

  const total = totalFiltered;

  const stats = useMemo(() => {
    const total = transactions.reduce(
      (sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0),
      0,
    );
    const paid = transactions
      .filter((t) => t.tuukh?.[0]?.tuluv === 1 || t.tuukh?.[0]?.tuluv === 2)
      .reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const unpaid = transactions
      .filter(
        (t) =>
          (t.tuukh?.[0]?.tuluv === 0 || t.tuukh?.[0]?.tuluv === -4) &&
          (t.niitDun || 0) > 0,
      )
      .reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const count = transactions.length;
    const paidCount = transactions.filter(
      (t) => t.tuukh?.[0]?.tuluv === 1 || t.tuukh?.[0]?.tuluv === 2,
    ).length;

    return { total, paid, unpaid, count, paidCount };
  }, [transactions]);


  const fetchRevenueData = useCallback(async (start: string, end: string) => {
    if (!token || !start || !end) return;
    setRevenueLoading(true);
    try {
      const resp = await uilchilgee(token).get("/zogsoolUilchluulegchJagsaalt", {
        params: {
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 10000,
          query: JSON.stringify({
            baiguullagiinId: ajiltan?.baiguullagiinId,
            ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
            createdAt: { $gte: `${start} 00:00:00`, $lte: `${end} 23:59:59` },
          }),
        },
      });
      setRevenueListData(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRevenueLoading(false);
    }
  }, [token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]);

  useEffect(() => {
    if (!revenueModalOpen) return;
    const [start, end] = revenueDateRange || [null, null];
    if (start && end) fetchRevenueData(start, end);
  }, [revenueModalOpen, revenueDateRange, fetchRevenueData]);

  const revenueModalBreakdown = useMemo(
    () => tulburiinZadargaaBodyo(revenueListData?.jagsaalt || []),
    [revenueListData],
  );


  const totalPages = Math.ceil(total / pageSize);

  // Keyboard Shortcuts (shortcut.md / zogsool.md)
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "F1":
          e.preventDefault();
          if (entryCameras[0]) khaalgaNeey(entryCameras[0].cameraIP);
          break;
        case "F2":
          e.preventDefault();
          if (exitCameras[0]) khaalgaNeey(exitCameras[0].cameraIP);
          break;
        case "F4":
          e.preventDefault();
          if (transactions[0] && (transactions[0].niitDun || 0) > 0) {
            setSelectedTransaction(transactions[0]);
          }
          break;
        case "F7":
          e.preventDefault();
          if (transactions[0]) {
            handleManualExit(transactions[0], "free");
          }
          break;
        case "F8":
        case "+":
          e.preventDefault();
          setActiveEntryIP(entryCameras[0]?.cameraIP || "");
          setIsRegModalOpen(true);
          break;
        case "-":
          e.preventDefault();
          setActiveEntryIP(exitCameras[0]?.cameraIP || ""); // Using registration for exit if needed
          setIsRegModalOpen(true);
          break;
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [entryCameras, exitCameras, transactions, khaalgaNeey, handleManualExit]);

  // Click outside + scroll listener for action menu
  useEffect(() => {
    if (!confirmExitId) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setConfirmExitId(null);
        setDropdownPos(null);
      }
    };
    const closeOnScroll = () => { setConfirmExitId(null); setDropdownPos(null); };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [confirmExitId]);

  useEffect(() => {
    if (!revenueModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setRevenueModalOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [revenueModalOpen]);

  // Click outside listener for page size dropdown
  useEffect(() => {
    if (!isPageSizeOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(e.target as Node)
      ) {
        setIsPageSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPageSizeOpen]);

  function formatCurrency(n: number) {
    return `${formatNumber(n)} `;
  }

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${text.toUpperCase()} дугаарыг хууллаа`);
  };

  // ── Гүйлгээний хүснэгтийн багана ────────────────────────────────────────
  // Толгойн шүүлтүүр/эрэмбийн харилцан үйлдэл нь өмнөхтэй яг адил —
  // зөвхөн хүснэгтийн их бие стандарт бүрдэл рүү шилжив.
  const erembiinTolgoi = (id: string, label: string) => (
    <div
      className="flex h-full cursor-pointer items-center justify-center gap-2"
      onClick={() => {
        setSortConfig((prev) => {
          if (prev?.col !== id) return { col: id, dir: "asc" };
          if (prev.dir === "asc") return { col: id, dir: "desc" };
          return null;
        });
        setPage(1);
      }}
    >
      <span>{label}</span>
      {sortConfig?.col === id ? (
        <ArrowUpDown
          className={`h-3.5 w-3.5 text-brand ${sortConfig.dir === "desc" ? "rotate-180" : ""}`}
        />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-[color:var(--muted-text)] opacity-40" />
      )}
    </div>
  );

  const shuultuuriinTolgoi = (
    label: string,
    current: string,
    options: { label: string; value: string }[],
    onSelect: (v: string) => void,
  ) => (
    <FilterPopover
      label={label}
      options={options}
      current={current}
      onSelect={onSelect}
    >
      <div className="group/f flex h-full cursor-pointer items-center justify-center gap-2">
        <Filter
          className={`h-3.5 w-3.5 transition-colors ${
            current && current !== "all"
              ? "text-brand"
              : "text-[color:var(--muted-text)] group-hover/f:text-brand"
          }`}
        />
        <span>{label}</span>
      </div>
    </FilterPopover>
  );

  const guilgeeniiColumns: ColumnsType<any> = [
    {
      title: "№",
      key: "no",
      width: 40,
      align: "center",
      render: (_: any, __: any, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: erembiinTolgoi("dugaar", "Дугаар"),
      key: "dugaar",
      width: 110,
      align: "center",
      render: (_: any, transaction: any) => (
        <div className="flex items-center justify-center gap-1">
          <span className="font-[family-name:var(--font-mono)]">
            {transaction.mashiniiDugaar || "-"}
          </span>
          <Copy
            className="h-4 w-4 cursor-pointer text-[color:var(--muted-text)] transition-colors hover:text-brand"
            onClick={() => copyToClipboard(transaction.mashiniiDugaar)}
          />
        </div>
      ),
    },
    {
      title: erembiinTolgoi("orson", "Орсон"),
      key: "orson",
      width: 115,
      align: "center",
      render: (_: any, transaction: any) => {
        const { orsonTsag } = murNiiluulye(transaction);
        return (
          <span className="font-[family-name:var(--font-mono)] whitespace-nowrap">
            {orsonTsag ? moment(orsonTsag).format("MM-DD HH:mm:ss") : "-"}
          </span>
        );
      },
    },
    {
      title: erembiinTolgoi("garsan", "Гарсан"),
      key: "garsan",
      width: 115,
      align: "center",
      render: (_: any, transaction: any) => {
        const { garsanTsag } = murNiiluulye(transaction);
        return (
          <span className="font-[family-name:var(--font-mono)] whitespace-nowrap">
            {garsanTsag ? moment(garsanTsag).format("MM-DD HH:mm:ss") : ""}
          </span>
        );
      },
    },
    {
      title: shuultuuriinTolgoi(
        "Хугацаа/мин",
        durationFilter,
        [
          { label: "Удаан зогссон эхэнд", value: "longest" },
          { label: "Сүүлд орсон эхэнд", value: "latest_in" },
          { label: "Сүүлд гарсан эхэнд", value: "latest_out" },
        ],
        (v) => {
          setDurationFilter(v);
          setSortConfig(null);
          setPage(1);
        },
      ),
      key: "duration",
      width: 120,
      align: "center",
      render: (_: any, transaction: any) => {
        const {
          mur,
          orsonTsag,
          garsanTsag,
          tuluv,
          niitDun,
          isCurrentlyIn,
          isFreeExit,
          isDebt,
          hasRemainingBalance,
        } = murNiiluulye(transaction);
        // Хугацааны өнгө нь Төлөв баганын өнгөтэй ЯГ ижил дарааллаар бодогдоно.
        const getStatusColor = () => {
          if (tuluv === -2 || tuluv === -1) return "bg-danger border-danger";
          if (hasRemainingBalance) return "bg-warning border-warning";
          if (isFreeExit) return "bg-[color:var(--panel)] border-[color:var(--surface-border)]";
          if (tuluv === 1)
            return isCurrentlyIn && niitDun === 0
              ? "bg-theme border-theme"
              : "bg-success border-success";
          if (!isCurrentlyIn && (niitDun > 0 || isDebt))
            return "bg-warning border-warning";
          if (!isCurrentlyIn && niitDun === 0)
            return "bg-[color:var(--panel)] border-[color:var(--surface-border)]";
          return "bg-theme border-theme";
        };
        return (
          <div
            className={`mx-auto flex w-[100px] max-w-[100px] min-w-[100px] flex-nowrap items-center justify-center overflow-hidden rounded-[6px] border px-2 py-0.5 ${getStatusColor()}`}
            style={{ borderRadius: "6px", color: "white" }}
          >
            <RealTimeDuration
              orsonTsag={orsonTsag}
              garsanTsag={garsanTsag}
              niitKhugatsaa={mur?.niitKhugatsaa}
            />
          </div>
        );
      },
    },
    {
      title: shuultuuriinTolgoi(
        "Төрөл",
        typeFilter,
        [
          { label: "Бүгд", value: "all" },
          { label: "Үйлчлүүлэгч", value: "Үйлчлүүлэгч" },
          { label: "Оршин суугч", value: "Оршин суугч" },
          { label: "Зочин", value: "Зочин" },
        ],
        (v) => {
          setTypeFilter(v);
          setPage(1);
        },
      ),
      key: "type",
      width: 100,
      align: "center",
      render: (_: any, transaction: any) =>
        transaction.turul || transaction.tuukh?.[0]?.turul || "Үйлчлүүлэгч",
    },
    {
      title: erembiinTolgoi("amount", "Дүн"),
      key: "amount",
      width: 90,
      align: "right",
      render: (_: any, transaction: any) => (
        <span className="font-[family-name:var(--font-mono)]">
          {formatNumber(transaction.niitDun || 0, 2)}
        </span>
      ),
    },
    {
      title: erembiinTolgoi("payment", "Төлбөр"),
      key: "payment",
      width: 90,
      align: "center",
      render: (_: any, transaction: any) => {
        const tulsunDun = transaction.tuukh?.[0]?.tulsunDun || 0;
        // Төрлийн шүүлтүүрээс үл хамааран бүх түүхээс төлбөрийг нэгтгэнэ.
        const payOnly = tulburuudiigTsugluulya(transaction);
        if (payOnly.length > 0) {
          const totalPaid = payOnly.reduce(
            (sum: number, pay: any) => sum + (pay.dun || 0),
            0,
          );
          const uniqueTypes = [
            ...new Set(payOnly.map((pay: any) => pay.turul).filter(Boolean)),
          ] as string[];
          return (
            <PaymentPopup
              payHistory={payOnly}
              totalPaid={totalPaid}
              uniqueTypes={uniqueTypes}
            />
          );
        }
        return (
          <span className="font-[family-name:var(--font-mono)]">
            {formatNumber(tulsunDun || 0, 2)}
          </span>
        );
      },
    },
    {
      title: erembiinTolgoi("discount", "Хөнгөлөлт"),
      key: "discount",
      width: 110,
      align: "right",
      render: (_: any, transaction: any) => (
        <span className="font-[family-name:var(--font-mono)]">
          {formatNumber(murNiiluulye(transaction).discountTotal || 0, 2)}
        </span>
      ),
    },
    {
      title: erembiinTolgoi("ebarimt", "И-Баримт"),
      key: "ebarimt",
      width: 100,
      align: "center",
      render: (_: any, transaction: any) => {
        const mur = transaction.tuukh?.[0] as any;
        const ebarimtId =
          mur?.ebarimtId ||
          mur?.ebarimtDugaar ||
          mur?.lottery ||
          mur?.receiptId ||
          mur?.ebarimt?.id ||
          mur?.ebarimt?.lottery ||
          transaction?.ebarimtId ||
          transaction?.ebarimtDugaar ||
          transaction?.lottery;
        if (ebarimtId)
          return (
            <span className="font-[family-name:var(--font-mono)]">
              {ebarimtId}
            </span>
          );
        const ebDun =
          (mur?.ebarimtAvsanDun ?? transaction?.ebarimtAvsanDun) || 0;
        return (
          <span className="font-[family-name:var(--font-mono)]">
            {ebDun > 0 ? formatNumber(ebDun, 2) : "-"}
          </span>
        );
      },
    },
    {
      title: shuultuuriinTolgoi(
        "Төлөв",
        statusFilter,
        [
          { label: "Бүгд", value: "all" },
          { label: "Идэвхтэй", value: "active" },
          { label: "Төлсөн", value: "paid" },
          { label: "Төлөөгүй", value: "unpaid" },
          { label: "Үнэгүй", value: "free" },
        ],
        (v) => {
          setStatusFilter(v);
          setPage(1);
        },
      ),
      key: "status",
      width: 120,
      align: "center",
      render: (_: any, transaction: any) => {
        const {
          tuluv,
          niitDun,
          isCurrentlyIn,
          isFreeExit,
          isPaid,
          isDebt,
          hasRemainingBalance,
          showActionBtn,
        } = murNiiluulye(transaction);
        const badgeClass =
          "mx-auto flex w-[100px] max-w-[100px] min-w-[100px] flex-nowrap items-center justify-center overflow-hidden rounded-[6px] border px-2 py-0.5";
        const badge = (color: string, text: string) => (
          <div
            className={`${badgeClass} ${color}`}
            style={{ borderRadius: "6px", color: "white" }}
          >
            <span className="whitespace-nowrap">
              {text}
            </span>
          </div>
        );

        if (!showActionBtn) {
          if (isFreeExit) return badge("bg-[color:var(--panel)] border-[color:var(--surface-border)]", "Үнэгүй");
          if (tuluv === 1)
            return isCurrentlyIn && niitDun === 0
              ? badge("bg-theme border-theme", "Идэвхтэй")
              : badge("bg-success border-success", "Төлсөн");
          if (tuluv === -2 || tuluv === -1)
            return badge("bg-danger border-danger", "Зөрчилтэй");
          if (hasRemainingBalance)
            return badge("bg-warning border-warning", "Төлбөртэй");
          if (!isCurrentlyIn && (niitDun > 0 || isDebt))
            return badge("bg-warning border-warning", "Төлбөртэй");
          if (!isCurrentlyIn && niitDun === 0)
            return badge("bg-[color:var(--panel)] border-[color:var(--surface-border)]", "Үнэгүй");
          return badge("bg-theme border-theme", "Идэвхтэй");
        }

        return (
          <div className="action-menu-container flex items-center justify-center gap-1">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (confirmExitId === transaction._id) {
                  setConfirmExitId(null);
                  setDropdownPos(null);
                } else {
                  const rect = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  setDropdownPos({
                    top: rect.bottom + 6,
                    right: window.innerWidth - rect.right,
                  });
                  setConfirmExitId(transaction._id ?? null);
                }
              }}
              className={`mx-auto flex w-[100px] max-w-[100px] min-w-[100px] cursor-pointer flex-nowrap items-center justify-center overflow-hidden rounded-[6px] border px-2 py-0.5 whitespace-nowrap ${
                hasRemainingBalance
                  ? "bg-warning border-warning"
                  : !isCurrentlyIn && isDebt
                    ? "bg-warning border-warning"
                    : tuluv === -1 || tuluv === -2
                      ? "bg-danger border-danger"
                      : "bg-theme border-theme"
              }`}
              style={{ color: "white" }}
            >
              {!isCurrentlyIn
                ? hasRemainingBalance
                  ? "Төлбөр"
                  : isDebt
                    ? "Төлбөртэй"
                    : "Дууссан"
                : isPaid && niitDun > 0
                  ? "Төлсөн"
                  : tuluv === 2
                    ? "Төлбөртэй"
                    : niitDun > 0
                      ? "Төлбөр"
                      : "Идэвхтэй"}
            </div>
            {confirmExitId === transaction._id &&
              dropdownPos &&
              createPortal(
                <div
                  className="action-menu-container fixed z-[9999] min-w-[170px] rounded-md border border-[color:var(--surface-border)] bg-[color:var(--panel)]/95 p-1.5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
                  style={{ top: dropdownPos.top, right: dropdownPos.right }}
                >
                  <div className="space-y-0">
                    {(isCurrentlyIn
                      ? [
                          {
                            label: "Хөнгөлөлт",
                            icon: Tag,
                            color: "amber",
                            action: () => {
                              setDiscountModalTransaction(transaction);
                              setDiscountAmount("");
                              setDiscountMinutes("");
                              setConfirmExitId(null);
                            },
                          },
                          {
                            label: "Гаргах",
                            icon: ArrowUpDown,
                            color: "blue",
                            action: () =>
                              isPaid || niitDun === 0
                                ? handleManualExit(transaction, "free")
                                : handleManualExit(transaction, "pay"),
                          },
                          {
                            label: "Зөрчил",
                            icon: AlertTriangle,
                            color: "red",
                            action: () => {
                              setViolationModalTransaction(transaction);
                              setViolationReason("");
                              setConfirmExitId(null);
                            },
                          },
                        ]
                      : [
                          {
                            label: "Төлөх",
                            icon: DollarSign,
                            color: "emerald",
                            action: () => handleManualExit(transaction, "pay"),
                          },
                          {
                            label: "Үнэгүй",
                            icon: Info,
                            color: "slate",
                            action: () => {
                              setFreeExitModalTransaction(transaction);
                              setFreeExitReason("Агуулах");
                              setCustomFreeExitReason("");
                              setConfirmExitId(null);
                            },
                          },
                        ]
                    ).map((btn, bi, arr) => (
                      <div key={bi}>
                        <button
                          onClick={btn.action}
                          className={`group/item flex w-full items-center justify-between rounded-md px-3 py-0.5 text-[color:var(--panel-text)] transition-all duration-200 ${
                            btn.color === "amber"
                              ? "hover:bg-warning/10 hover:text-warning"
                              : btn.color === "blue"
                                ? "hover:bg-theme/10 hover:text-brand dark:hover:bg-theme/10"
                                : btn.color === "emerald"
                                  ? "hover:bg-success/10 hover:text-success dark:hover:bg-success/10"
                                  : btn.color === "red"
                                    ? "hover:bg-danger/10 hover:text-danger"
                                    : "hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--muted-text)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <btn.icon
                              className={`h-4 w-4 transition-transform group-hover/item:scale-110 ${
                                btn.color === "amber"
                                  ? "text-warning"
                                  : btn.color === "blue"
                                    ? "text-brand"
                                    : btn.color === "emerald"
                                      ? "text-success"
                                      : btn.color === "red"
                                        ? "text-danger"
                                        : "text-[color:var(--muted-text)]"
                              }`}
                            />
                            <span>{btn.label}</span>
                          </div>
                        </button>
                        {bi < arr.length - 1 && (
                          <div className="mx-2 my-1 h-px bg-[color:var(--panel)] dark:bg-white/10" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>,
                document.body,
              )}
          </div>
        );
      },
    },
    {
      title: erembiinTolgoi("reason", "Шалтгаан"),
      key: "reason",
      width: 130,
      align: "center",
      ellipsis: true,
      render: (_: any, transaction: any) => (
        <span className="italic text-[color:var(--muted-text)]">
          {transaction.tuukh?.[0]?.uneguiGarsan ||
            transaction.zurchil ||
            (transaction.tuukh?.[0] as any)?.zurchil ||
            ""}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full bg-[color:var(--surface-bg)]">
      <div className="px-4 pt-3 pb-4 lg:px-6 lg:pb-6 space-y-4">
        {/* Camera Streaming Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Entry Camera Stream */}
          <div className="relative group/camera overflow-hidden rounded-3xl bg-black shadow-2xl transition-all duration-500">
            {/* Top-Right Badge and Selection Dropdown */}
            {entryCameras.length > 0 && (
              <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-theme animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-[11px] font-medium !text-white">
                    Орох Камер
                  </span>
                  <span className="text-[11px] font-mono !text-[color:var(--muted-text)] ml-1">
                    ({activeEntryIP || entryCameras[0]?.cameraIP || "-"})
                  </span>
                </div>

                {entryCameras.length > 1 && (
                  <div className="relative group/dropdown">
                    <select
                      value={activeEntryIP}
                      onChange={(e) => setActiveEntryIP(e.target.value)}
                      className="appearance-none bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2 pr-10 text-[11px] font-medium !text-white cursor-pointer hover:bg-black/80 transition-all outline-none"
                    >
                      {entryCameras.map((cam) => (
                        <option
                          key={cam.cameraIP}
                          value={cam.cameraIP}
                          className="bg-[color:var(--panel)] text-[color:var(--panel-text)]"
                        >
                          {cam.cameraIP}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none group-hover/dropdown:text-white transition-colors" />
                  </div>
                )}
              </div>
            )}

            <div className="aspect-video relative">
              {entryCameras.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[color:var(--panel)] border border-white/5">
                  <VideoOff className="w-12 h-12 text-[color:var(--panel-text)] mb-4" />
                  <p className="text-[11px] font-medium text-[color:var(--muted-text)]">
                    Тохиргоогүй байна
                  </p>
                </div>
              ) : (
                <div className="h-full">

                  {entryCameras
                    .filter(
                      (c) =>
                        c.cameraIP === activeEntryIP ||
                        (!activeEntryIP &&
                          entryCameras[0]?.cameraIP === c.cameraIP),
                    )
                    .map((camera, i) => (
                      <div
                        key={`entry-${camera.cameraIP}-${i}`}
                        className="h-full relative overflow-hidden group/cam"
                      >
                        <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="entry"
                          onOpenGate={khaalgaNeey}
                          barilgiinId={effectiveBarilgiinId}
                          token={token || undefined}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Exit Camera Stream */}
          <div className="relative group/camera overflow-hidden rounded-3xl bg-black shadow-2xl transition-all duration-500">
            {/* Top-Right Badge and Selection Dropdown */}
            {exitCameras.length > 0 && (
              <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  <span className="text-[11px] font-medium !text-white">
                    Гарах Камер
                  </span>
                  <span className="text-[11px] font-mono !text-[color:var(--muted-text)] ml-1">
                    ({activeExitIP || exitCameras[0]?.cameraIP || "-"})
                  </span>
                </div>

                {exitCameras.length > 1 && (
                  <div className="relative group/dropdown">
                    <select
                      value={activeExitIP}
                      onChange={(e) => setActiveExitIP(e.target.value)}
                      className="appearance-none bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2 pr-10 text-[11px] font-medium !text-white cursor-pointer hover:bg-black/80 transition-all outline-none"
                    >
                      {exitCameras.map((cam) => (
                        <option
                          key={cam.cameraIP}
                          value={cam.cameraIP}
                          className="bg-[color:var(--panel)] text-[color:var(--panel-text)]"
                        >
                          {cam.cameraIP}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none group-hover/dropdown:text-white transition-colors" />
                  </div>
                )}
              </div>
            )}

            <div className="aspect-video relative">
              {exitCameras.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[color:var(--panel)] border border-white/5">
                  <VideoOff className="w-12 h-12 text-[color:var(--panel-text)] mb-4" />
                  <p className="text-[11px] font-medium text-[color:var(--muted-text)]">
                    Тохиргоогүй байна
                  </p>
                </div>
              ) : (
                <div className="h-full">

                  {exitCameras
                    .filter(
                      (c) =>
                        c.cameraIP === activeExitIP ||
                        (!activeExitIP &&
                          exitCameras[0]?.cameraIP === c.cameraIP),
                    )
                    .map((camera, i) => (
                      <div
                        key={`exit-${camera.cameraIP}-${i}`}
                        className="h-full relative overflow-hidden group/cam"
                      >
                        <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="exit"
                          onOpenGate={khaalgaNeey}
                          barilgiinId={effectiveBarilgiinId}
                          token={token || undefined}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="space-y-4">
          {/* ─── Top Bar ─── */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-[color:var(--surface-border)] dark:border-white/[0.04] shadow-sm"
            style={{ zIndex: 1 }}
          >
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl">
                <Calendar className="w-4 h-4 text-[color:var(--muted-text)]" />
              </div>
              <div>
                <h3 className="text-[13px] text-[color:var(--panel-text)] tracking-tight leading-none">
                  Жагсаалт
                </h3>
                <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">
                  Зогсоолын бүртгэл
                </p>
              </div>
            </div>

            {/* Right: Register + DatePicker */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Date picker */}
              <FilterDatePicker
                value={dateRange}
                onChange={(_: any, dateStrings: [string, string]) => {
                    setDateRange(dateStrings);
                    setPage(1);
                  }}
                format="YYYY-MM-DD"
                className="w-full sm:w-[260px]"
              />

              {/* Revenue report button */}
              <Button
                onClick={() => { const today = moment().format("YYYY-MM-DD"); setRevenueDateRange([today, today]); setRevenueModalOpen(true); }}
                variant="primary"
                size="sm"
                className="rounded-lg h-8 px-4 text-[11px] shadow-sm"
              >
                <Receipt className="w-3.5 h-3.5 mr-1.5" />
                Орлого тайлан
              </Button>

              {/* Register button */}
              <Button
                onClick={() => setIsRegModalOpen(true)}
                variant="primary"
                size="sm"
                className="rounded-lg h-8 px-4 text-[11px] shadow-sm"
              >
                Машин бүртгэх
              </Button>
            </div>
          </div>

          <div className="flex flex-col">
            <div>
              <Table<any>
                columns={guilgeeniiColumns}
                dataSource={transactions}
                rowKey={(t, idx) => t._id || idx}
                pagination={false}
                scroll={{ x: 1300 }}
                rowClassName={(t) => (murNiiluulye(t).isActive ? "zt-row-selected" : "")}
                summary={() => (
                  <Table.Summary.Row className="font-[family-name:var(--font-mono)] text-[11px]">
                    <Table.Summary.Cell colSpan={6} align="right">
                      <span className="font-medium">
                        Нийт Дүн:
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right" className="font-medium whitespace-nowrap">
                      {formatNumber(
                        transactions.reduce(
                          (sum, t) => sum + (Number(t.niitDun) || 0),
                          0,
                        ),
                      )}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right" className="font-medium whitespace-nowrap">
                      {formatNumber(
                        transactions.reduce((sum, t) => {
                          const payOnly = tulburuudiigTsugluulya(t);
                          if (payOnly.length > 0) {
                            return (
                              sum +
                              payOnly.reduce(
                                (acc: number, pay: any) => acc + (pay.dun || 0),
                                0,
                              )
                            );
                          }
                          return sum + (Number(t.tuukh?.[0]?.tulsunDun) || 0);
                        }, 0),
                      )}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right" className="font-medium whitespace-nowrap">
                      {formatNumber(
                        transactions.reduce((sum, t) => {
                          const disc = murNiiluulye(t).discountTotal;
                          return (
                            sum +
                            (disc > 0
                              ? disc
                              : Number(t.tuukh?.[0]?.khungulult) || 0)
                          );
                        }, 0),
                      )}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell colSpan={3} />
                  </Table.Summary.Row>
                )}
              />
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-[color:var(--surface-border)] dark:border-white/5 bg-[color:var(--surface-bg)] rounded-b-2xl flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="relative" ref={pageSizeRef}>
                  <button
                    onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--surface-hover)] dark:bg-white/5 border border-[color:var(--surface-border)] dark:border-white/10 text-xs text-[color:var(--panel-text)]  cursor-pointer hover:bg-[color:var(--panel)] dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme/30 focus:border-theme/50 shadow-sm"
                  >
                    <span>{pageSize}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[color:var(--muted-text)] transition-transform duration-200 ${isPageSizeOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isPageSizeOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-20 bg-[color:var(--panel)]/95 backdrop-blur-xl border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-1.5 z-50">
                      {[10, 20, 50, 100, 500].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setPageSize(size);
                            setPage(1);
                            setIsPageSizeOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs  text-left transition-all duration-200 ${pageSize === size
                            ? "bg-theme/10 text-brand"
                            : "hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/5 text-[color:var(--panel-text)] hover:text-[color:var(--panel-text)] dark:hover:text-white"
                            }`}
                          style={{
                            borderRadius: "0.5rem",
                          }}
                          onMouseEnter={(e) => {
                            if (pageSize !== size) {
                              e.currentTarget.style.borderRadius = "0.625rem";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pageSize !== size) {
                              e.currentTarget.style.borderRadius = "0.5rem";
                            }
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[color:var(--muted-text)]">
                  Нийт {total} мөр
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-xl"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                />
                <div className="flex items-center gap-1.5 px-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[color:var(--surface-hover)] dark:bg-white/5 text-xs  text-[color:var(--panel-text)] dark:text-white">
                    {page}
                  </span>
                  <span className="text-[color:var(--muted-text)] text-xs">
                    /
                  </span>
                  <span className="text-xs  text-[color:var(--muted-text)]">
                    {Math.ceil(total / pageSize)}
                  </span>
                </div>
                <Button
                  onClick={() =>
                    setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
                  }
                  disabled={page >= Math.ceil(total / pageSize)}
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-xl"
                  leftIcon={<ChevronRight className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Нийт орлого
                </p>
                <p className="text-lg  text-[color:var(--panel-text)]">
                  {formatCurrency(stats.total)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-brand" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Төлсөн
                </p>
                <p className="text-lg  text-brand">
                  {formatCurrency(stats.paid)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-brand" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Төлөөгүй
                </p>
                <p className="text-lg  text-danger">
                  {formatCurrency(stats.unpaid)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-danger" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Нийт тоо
                </p>
                <p className="text-lg  text-[color:var(--panel-text)]">
                  {stats.count}
                </p>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  Төлсөн: {stats.paidCount}
                </p>
              </div>
              <Calendar className="w-5 h-5 text-brand" />
            </div>
          </div>
        </div> */}

        {selectedTransaction && createPortal(
          <PaymentModal
            transaction={selectedTransaction}
            token={token || ""}
            onClose={() => setSelectedTransaction(null)}
            onConfirm={async (amount, method, extraData) => {
              try {
                const zogsooliinId =
                  selectedTransaction.tuukh?.[0]?.zogsooliinId ||
                  selectedTransaction.barilgiinId ||
                  effectiveBarilgiinId;

                // Build tulbur array from split entries (pay.md)
                const splitEntries = extraData?.tulbur || [
                  {
                    turul: method,
                    dun: amount,
                    ognoo: new Date().toISOString(),
                  },
                ];
                const newEntries = splitEntries
                  .filter((t: any) => t.dun > 0 || amount === 0) // keep zero for free exits
                  .map((t: any) => ({
                    ...t,
                    baiguullagiinId: ajiltan?.baiguullagiinId,
                    barilgiinId: effectiveBarilgiinId,
                    burtgesenAjiltaniiId: ajiltan?._id,
                    burtgesenAjiltaniiNer: ajiltan?.ner,
                    zogsooliinId: zogsooliinId,
                  }));

                // Preserve existing discount entries from DB so they aren't wiped on payment
                const existingDbTulbur: any[] = (() => {
                  const raw = selectedTransaction.tuukh?.[0]?.tulbur;
                  return Array.isArray(raw) ? raw : raw ? [raw] : [];
                })();
                const existingDiscounts = existingDbTulbur
                  .filter((t: any) => (t?.dun ?? 0) < 0)
                  .map((t: any) => ({ ...t, zogsooliinId: zogsooliinId }));
                const tulburArray = [...existingDiscounts, ...newEntries];

                const payload = {
                  id: selectedTransaction._id,
                  tulbur: tulburArray,
                };

                const resp = await uilchilgee(token || "").post(
                  "/zogsooliinTulburTulye",
                  payload,
                );

                if (resp.status === 200 || resp.data === "Amjilttai") {
                  toast.success("Төлбөр амжилттай бүртгэгдлээ");

                  // E-Barimt (payment.md section 3)
                  if (extraData?.ebarimt) {
                    try {
                      const ebResp = await uilchilgee(token || "").post(
                        "/ebarimtShivye",
                        {
                          id: selectedTransaction._id,
                          type: extraData.ebarimt.type,
                          register: extraData.ebarimt.register,
                        },
                      );
                      if (ebResp.data?.success || ebResp.data?.qrData) {
                        setEbarimtResult(ebResp.data);
                        toast.success("И-Баримт амжилттай үүслээ");
                      }
                    } catch (ebErr) {
                      console.error("Ebarimt error:", ebErr);
                      toast.error("И-Баримт үүсгэхэд алдаа гарлаа");
                    }
                  }

                  // Hardware Gate Kick (payment.md section 5)
                  const parkingList =
                    parkingConfigData?.jagsaalt || parkingConfigData || [];
                  const parking = Array.isArray(parkingList)
                    ? parkingList.find((p: any) => p._id === zogsooliinId)
                    : parkingList;

                  if (parking?.garakhKhaalgaGarTokhirgoo === true) {
                    const exitIP = activeExitIP || exitCameras[0]?.cameraIP;
                    if (exitIP) {
                      khaalgaNeey(exitIP);
                    }
                  }

                  setSelectedTransaction(null);
                  fetchList();
                } else {
                  toast.error(
                    "Алдаа гарлаа: " +
                    (resp.data?.message || "Үл мэдэгдэх алдаа"),
                  );
                }
              } catch (err) {
                console.error("Payment registration error:", err);
                toast.error("Төлбөр бүртгэхэд алдаа гарлаа");
              }
            }}
          />,
          document.body
        )}
        {/* И-Баримт result modal */}
        {ebarimtResult && createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(14px)" }}
            onClick={() => setEbarimtResult(null)}
          >
            <div
              className="relative w-[360px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-[color:var(--surface-bg)] border-[color:var(--surface-border)] dark:border-white/[0.08]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top gradient bar */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-theme/20 via-theme/20 to-theme/20" />

              <div className="px-6 pt-7 pb-6 flex flex-col items-center gap-4">
                {/* Success icon */}
                <div className="w-14 h-14 rounded-full bg-theme/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div className="text-center">
                  <p className="text-[15px] font-medium text-[color:var(--panel-text)] dark:text-white">И-Баримт амжилттай</p>
                  <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">Цахим баримт үүсгэгдлээ</p>
                </div>

                {/* QR code */}
                {ebarimtResult.qrData && ebarimtResult.qrData !== "FALSE" ? (
                  <div className="p-3 bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-sm">
                    <QRCodeSVG
                      value={ebarimtResult.qrData}
                      size={176}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-2xl bg-[color:var(--surface-hover)] dark:bg-white/[0.04] border border-[color:var(--surface-border)] dark:border-white/[0.08] flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-[color:var(--muted-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span className="text-[11px] text-[color:var(--muted-text)]">QR байхгүй</span>
                  </div>
                )}

                {/* Lottery + Receipt ID */}
                <div className="w-full space-y-2">
                  {ebarimtResult.lottery && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-warning/10 border border-warning/30">
                      <span className="text-[11px] font-medium text-warning shrink-0">Сугалааны №</span>
                      <span className="text-[13px] font-medium text-warning font-[family-name:var(--font-mono)] text-right">{ebarimtResult.lottery}</span>
                    </div>
                  )}
                  {(ebarimtResult.receiptId || ebarimtResult.id) && (
                    <div className="px-4 py-2.5 rounded-2xl bg-[color:var(--surface-hover)] dark:bg-white/[0.04] border border-[color:var(--surface-border)] dark:border-white/[0.08] space-y-1">
                      <span className="text-[11px] font-medium text-[color:var(--muted-text)] block">Баримтын №</span>
                      <span className="text-[11px] font-medium text-[color:var(--panel-text)] font-[family-name:var(--font-mono)] break-all block leading-relaxed">
                        {ebarimtResult.receiptId || ebarimtResult.id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="w-full flex gap-2">
                  <button
                    onClick={() => {
                      const r = ebarimtResult;
                      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>И-Баримт</title>
                        <style>body{font-family:monospace;padding:24px;background:#fff;color:#111}
                        h2{text-align:center;font-size:16px;margin-bottom:16px}
                        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #eee;font-size:13px}
                        .label{color:#888;font-size:11px}
                        .qr{display:block;margin:16px auto;width:180px;height:180px}
                        .footer{text-align:center;margin-top:20px;font-size:11px;color:#aaa}</style>
                        </head><body>
                        <h2>И-БАРИМТ</h2>
                        ${r.qrData && r.qrData !== "FALSE" ? `<img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(r.qrData)}" />` : ""}
                        ${r.lottery ? `<div class="row"><span class="label">СУГАЛААНЫ №</span><strong>${r.lottery}</strong></div>` : ""}
                        ${(r.receiptId || r.id) ? `<div class="row"><span class="label">БАРИМТЫН №</span><span style="font-size:10px;word-break:break-all">${r.receiptId || r.id}</span></div>` : ""}
                        <div class="footer">ebarimt.mn</div>
                        </body></html>`;
                      const iframe = document.createElement("iframe");
                      iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;";
                      iframe.srcdoc = html;
                      document.body.appendChild(iframe);
                      iframe.onload = () => {
                        iframe.contentWindow!.focus();
                        iframe.contentWindow!.print();
                        setTimeout(() => document.body.removeChild(iframe), 1000);
                      };
                    }}
                    className="flex-1 h-10 rounded-2xl border border-[color:var(--surface-border)] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[color:var(--panel-text)] text-[13px] font-medium hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Хэвлэх
                  </button>
                  <button
                    onClick={() => setEbarimtResult(null)}
                    className="flex-1 h-10 rounded-2xl bg-theme hover:bg-theme text-white text-[13px] font-medium transition-colors"
                  >
                    Хаах
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Discount Modal */}
        {discountModalTransaction && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={() => setDiscountModalTransaction(null)}
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              className="relative w-[380px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[color:var(--panel)] border-[color:var(--surface-border)] dark:border-white/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-7 pt-6 pb-5 border-b border-[color:var(--surface-border)] dark:border-white/[0.06]">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-warning/20 via-danger/20 to-theme/20 opacity-80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[color:var(--surface-hover)] dark:bg-white/[0.06] border border-[color:var(--surface-border)] dark:border-white/[0.06]">
                      <Tag className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h2 className="text-[15px] text-[color:var(--panel-text)] dark:text-white tracking-tight">
                        Хөнгөлөх
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setDiscountModalTransaction(null)}
                    className="w-9 h-9 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/[0.06] flex items-center justify-center text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-7 py-6 space-y-5">
                {(() => {
                  const orsonTsag = discountModalTransaction.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag;
                  const elapsedMin = orsonTsag ? Math.ceil((Date.now() - new Date(orsonTsag).getTime()) / 60000) : 0;
                  const isInFreePeriod = !discountModalTransaction.tuukh?.[0]?.garsanKhaalga &&
                    calculateParkingFee(elapsedMin) === 0 &&
                    !((discountModalTransaction.tuukh?.[0]?.tulbur?.length ?? 0) > 0);
                  return isInFreePeriod;
                })() ? (
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30">
                    <span className="text-warning mt-0.5 shrink-0">⚠</span>
                    <p className="text-[12px] text-warning">
                      Үнэгүй хугацаанд байгаа тул хөнгөлөлт оруулах боломжгүй. Машин гарсны дараа хөнгөлөх боломжтой.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-[color:var(--muted-text)] dark:text-white mb-1.5">
                        Хөнгөлөх дүн
                      </label>
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-[color:var(--surface-hover)] dark:bg-white/[0.04] border border-[color:var(--surface-border)] dark:border-white/[0.08] text-[color:var(--panel-text)] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-warning/20 focus:border-warning/50 transition-all"
                        placeholder="0"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[color:var(--muted-text)] dark:text-white mb-1.5">
                        Хөнгөлөх минут
                      </label>
                      <input
                        type="number"
                        value={discountMinutes}
                        onChange={(e) => {
                          setDiscountMinutes(e.target.value);
                          const min = parseInt(e.target.value) || 0;
                          if (min > 0 && parkingPricing && !parkingPricing.togtmolTulburEsekh) {
                            const unit = parkingPricing.undsenMin ? 30 : 60;
                            const value = Math.ceil(min / unit) * parkingPricing.undsenUne;
                            setDiscountAmount(value.toString());
                          }
                        }}
                        className="w-full h-11 px-4 rounded-xl bg-[color:var(--surface-hover)] dark:bg-white/[0.04] border border-[color:var(--surface-border)] dark:border-white/[0.08] text-[color:var(--panel-text)] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-warning/20 focus:border-warning/50 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-7 pb-6 pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDiscountModalTransaction(null)}
                  className="h-10 px-5 rounded border border-[color:var(--surface-border)] dark:border-white/[0.08] text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/[0.06] text-sm font-medium active:scale-[0.97] transition-all"
                >
                  Хаах
                </button>
                {(() => {
                  const orsonTsag = discountModalTransaction.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag;
                  const elapsedMin = orsonTsag ? Math.ceil((Date.now() - new Date(orsonTsag).getTime()) / 60000) : 0;
                  return !(!discountModalTransaction.tuukh?.[0]?.garsanKhaalga &&
                    calculateParkingFee(elapsedMin) === 0 &&
                    !((discountModalTransaction.tuukh?.[0]?.tulbur?.length ?? 0) > 0));
                })() && (
                    <button
                      onClick={async () => {
                        const amount = parseFloat(discountAmount) || 0;
                        const minutes = parseInt(discountMinutes) || 0;
                        try {
                          const zogsooliinId =
                            discountModalTransaction.tuukh?.[0]?.zogsooliinId ||
                            discountModalTransaction.barilgiinId ||
                            effectiveBarilgiinId;
                          const isActive = !discountModalTransaction.tuukh?.[0]?.garsanKhaalga;
                          const tulburArray = [
                            {
                              ognoo: new Date().toISOString(),
                              turul: "khungulult",
                              dun: -amount,
                              khariu: {
                                khungulsunKhugatsaa: minutes,
                              },
                              baiguullagiinId: ajiltan?.baiguullagiinId,
                              barilgiinId: effectiveBarilgiinId,
                              burtgesenAjiltaniiId: ajiltan?._id,
                              burtgesenAjiltaniiNer: ajiltan?.ner,
                              zogsooliinId,
                            },
                          ];
                          const resp = await uilchilgee(token || "").post(
                            "/zogsooliinTulburTulye",
                            {
                              id: discountModalTransaction._id,
                              tulbur: tulburArray,
                              ...(isActive ? { urdchilsan: true } : {}),
                            },
                          );
                          if (resp.status === 200 || resp.data === "Amjилттай") {
                            toast.success("Хөнгөлөлт амжилттай бүртгэгдлээ");
                            setDiscountModalTransaction(null);
                            fetchList();
                          } else {
                            toast.error("Алдаа гарлаа");
                          }
                        } catch (err) {
                          console.error("Discount error:", err);
                          toast.error("Хөнгөлөлт бүртгэхэд алдаа гарлаа");
                        }
                      }}
                      className="h-10 px-5 rounded !text-white text-sm font-medium active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      Хөнгөлөх
                    </button>
                  )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Free Exit Reason Modal */}
        {freeExitModalTransaction && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
            onClick={() => setFreeExitModalTransaction(null)}
          >
            <div
              className="relative w-full max-w-lg bg-[color:var(--surface-bg)] rounded-2xl overflow-hidden shadow-2xl border border-[color:var(--surface-border)] dark:border-white/10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--surface-border)] dark:border-white/10 bg-[color:var(--surface-bg)]">
                <div>
                  <h2 className="text-sm font-medium text-[color:var(--panel-text)] dark:text-white tracking-tight">
                    Үнэгүй үйлчлүүлэгчийн төрөл сонгох
                  </h2>
                  <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">
                    {freeExitModalTransaction.mashiniiDugaar}
                  </p>
                </div>
                <button
                  onClick={() => setFreeExitModalTransaction(null)}
                  className="p-1.5 rounded-lg hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10 text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {/* Column 1 */}
                  <div className="space-y-2">
                    {["Цагдаа", "Гал", "Эмнэлэг", "Онцгой", "Борлуулалтын машин", "Хөгжлийн бэрхшээлтэй", "Хогны машин", "Шуудан", "Дэлгүүрийн үйлчлүүлэгч"].map((reason) => (
                      <label key={reason} className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                          type="radio"
                          name="freeExitReason"
                          value={reason}
                          checked={freeExitReason === reason}
                          onChange={() => { setFreeExitReason(reason); setCustomFreeExitReason(""); }}
                          className="w-3.5 h-3.5 accent-theme cursor-pointer"
                        />
                        <span className="text-[12px] text-[color:var(--muted-text)] group-hover:text-[color:var(--panel-text)] dark:group-hover:text-white transition-colors">{reason}</span>
                      </label>
                    ))}
                  </div>
                  {/* Column 2 */}
                  <div className="space-y-2">
                    {["Бүртгэл хийгдээгүй айл", "Бүртгэл хийгдээгүй үйлчилгээ эрхлэгч", "Хүргэлтийн машин", "Компаниин ажилчдын машин", "Такси", "Бүртгэл хийгдэх тоот", "Тусгай зочид", "Банк хамгаалалт", "Цэцэрлэг", "Авто угаалга", "Агуулах"].map((reason) => (
                      <label key={reason} className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                          type="radio"
                          name="freeExitReason"
                          value={reason}
                          checked={freeExitReason === reason}
                          onChange={() => { setFreeExitReason(reason); setCustomFreeExitReason(""); }}
                          className="w-3.5 h-3.5 accent-theme cursor-pointer"
                        />
                        <span className="text-[12px] text-[color:var(--muted-text)] group-hover:text-[color:var(--panel-text)] dark:group-hover:text-white transition-colors">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom reason */}
                <div className="flex items-center gap-3 pt-3 border-t border-[color:var(--surface-border)] dark:border-white/10">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none shrink-0">
                    <input
                      type="radio"
                      name="freeExitReason"
                      value="Бусад"
                      checked={freeExitReason === "Бусад"}
                      onChange={() => setFreeExitReason("Бусад")}
                      className="w-3.5 h-3.5 accent-theme cursor-pointer"
                    />
                    <span className="text-[12px] text-[color:var(--muted-text)]">Бусад</span>
                  </label>
                  <input
                    type="text"
                    value={customFreeExitReason}
                    onChange={(e) => { setCustomFreeExitReason(e.target.value); setFreeExitReason("Бусад"); }}
                    placeholder="Шалтгаан бичих..."
                    className="flex-1 h-9 px-3 rounded-lg bg-[color:var(--surface-hover)] dark:bg-white/5 border border-[color:var(--surface-border)] dark:border-white/10 text-[color:var(--panel-text)] dark:text-white text-[12px] focus:outline-none focus:border-theme dark:focus:border-theme transition-all placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)]"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[color:var(--surface-border)] dark:border-white/10">
                <button
                  onClick={() => setFreeExitModalTransaction(null)}
                  className="h-9 px-5 rounded-lg border border-[color:var(--surface-border)] dark:border-white/10 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/5 text-xs font-medium transition-all"
                >
                  Хаах
                </button>
                <button
                  onClick={async () => {
                    const finalReason = freeExitReason === "Бусад" ? customFreeExitReason.trim() : freeExitReason;
                    if (!finalReason) { toast.error("Шалтгаан сонгох эсвэл бичнэ үү"); return; }
                    await handleWarehouseExit(freeExitModalTransaction, finalReason);
                    setFreeExitModalTransaction(null);
                  }}
                  className="h-9 px-5 rounded-lg text-xs font-medium text-white transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}
                >
                  Хадгалах
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Violation Modal */}
        {violationModalTransaction && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
            onClick={() => setViolationModalTransaction(null)}
          >
            <div
              className="relative w-full max-w-sm bg-[color:var(--surface-bg)] rounded-2xl overflow-hidden shadow-2xl border border-[color:var(--surface-border)] dark:border-white/10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-5 pb-4 border-b border-[color:var(--surface-border)] dark:border-white/[0.06]">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-danger/20 via-danger/20 to-danger/20" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/60 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-danger" />
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-[color:var(--panel-text)] dark:text-white">Зөрчил бүртгэх</h2>
                      <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5 font-mono uppercase tracking-wide">
                        {violationModalTransaction.mashiniiDugaar}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViolationModalTransaction(null)}
                    className="w-8 h-8 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/[0.06] flex items-center justify-center text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs text-[color:var(--muted-text)] mb-1.5">
                    Зөрчлийн шалтгаан
                  </label>
                  <textarea
                    rows={3}
                    value={violationReason}
                    onChange={(e) => setViolationReason(e.target.value)}
                    placeholder="Зөрчлийн тайлбар оруулна уу..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-[color:var(--surface-hover)] dark:bg-white/[0.04] border border-[color:var(--surface-border)] dark:border-white/[0.08] text-sm text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/50 transition-all resize-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Төлбөр төлөөгүй гарсан", "Зугтаасан", "Зөвшөөрөлгүй зогссон", "Бусад"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setViolationReason(preset)}
                      className={`px-3 py-1.5 rounded-full text-[11px] border transition-all ${violationReason === preset ? "bg-danger border-danger text-white" : "border-[color:var(--surface-border)] dark:border-white/10 text-[color:var(--muted-text)] hover:border-danger/30 hover:text-danger"}`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setViolationModalTransaction(null)}
                  className="h-9 px-4 rounded-xl border border-[color:var(--surface-border)] dark:border-white/[0.08] text-[color:var(--muted-text)] text-sm hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/[0.06] transition-all"
                >
                  Цуцлах
                </button>
                <button
                  onClick={() => handleViolationSubmit(violationModalTransaction, violationReason)}
                  className="h-9 px-5 rounded-xl text-white text-sm font-medium transition-all active:scale-95 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 14px rgba(239,68,68,0.35)" }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Бүртгэх
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Revenue Report Modal */}
        {revenueModalOpen && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
            }}
            onClick={() => setRevenueModalOpen(false)}
          >
            <div
              className="relative w-[420px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[color:var(--panel)] border-[color:var(--surface-border)] dark:border-white/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-7 pt-6 pb-5 border-b border-[color:var(--surface-border)] dark:border-white/[0.06]">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-theme/20 via-theme/20 to-theme/20 opacity-80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[color:var(--surface-hover)] dark:bg-white/[0.06] border border-[color:var(--surface-border)] dark:border-white/[0.06]">
                      <Receipt className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h2 className="text-[15px] text-[color:var(--panel-text)] dark:text-white tracking-tight">
                        Орлого тайлан
                      </h2>
                      <div className="mt-1.5 min-w-[220px]">
                        <ConfigProvider theme={{ token: { zIndexPopupBase: 10000 } }}>
                          <StandardDatePicker
                            isRange={true}
                            value={revenueDateRange}
                            onChange={(_: any, dateStrings: [string, string]) => setRevenueDateRange(dateStrings)}
                            format="YYYY-MM-DD"
                            classNames={{
                              input: "flex items-center gap-2 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/[0.06] border border-[color:var(--surface-border)] dark:border-white/[0.06] h-8 px-3 text-[11px] text-[color:var(--muted-text)] focus:ring-2 focus:ring-theme/10 transition-all",
                            }}
                            allowClear
                            getPopupContainer={() => document.body}
                          />
                        </ConfigProvider>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRevenueModalOpen(false)}
                    className="w-9 h-9 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/[0.06] flex items-center justify-center text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                <p className="text-[11px] text-[color:var(--muted-text)] mb-1">
                  Төлбөрийн хэлбэр
                </p>
                {revenueLoading && (
                  <div className="text-center py-8 text-[11px] text-[color:var(--muted-text)]">Уншиж байна...</div>
                )}
                {!revenueLoading && revenueModalBreakdown.items.map((item) => (
                  <div
                    key={item.key}
                    className="relative flex items-center gap-3 py-2.5 px-3 rounded-2xl border border-[color:var(--surface-border)] dark:border-white/[0.06] bg-[color:var(--surface-hover)] dark:bg-white/[0.02] overflow-hidden"
                  >
                    {/* Percentage fill background */}
                    <div
                      className={`absolute inset-y-0 left-0 ${item.color} opacity-[0.08] dark:opacity-[0.06] transition-all duration-500`}
                      style={{ width: `${item.pct}%` }}
                    />
                    <div
                      className={`w-1 h-8 rounded-full ${item.color} shrink-0 relative z-10`}
                    />
                    <div className="w-8 h-8 rounded-xl bg-[color:var(--surface-hover)] dark:bg-white/[0.06] flex items-center justify-center text-[color:var(--muted-text)] shrink-0 relative z-10">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <span className="text-[12px] text-[color:var(--panel-text)] block">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[13px] font-medium text-[color:var(--panel-text)] dark:text-white font-[family-name:var(--font-mono)] shrink-0 relative z-10">
                      {formatNumber(item.amount)}₮
                    </span>
                    <span className="text-[11px] text-[color:var(--muted-text)] font-[family-name:var(--font-mono)] w-6 text-center shrink-0 relative z-10">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-[color:var(--muted-text)] font-[family-name:var(--font-mono)] w-12 text-right shrink-0 relative z-10">
                      {item.pct}%
                    </span>
                  </div>
                ))}
                {!revenueLoading && revenueModalBreakdown.items.length === 0 && (
                  <p className="text-center text-[11px] text-[color:var(--muted-text)] py-8">
                    Төлбөрийн мэдээлэл олдсонгүй
                  </p>
                )}
              </div>

              {/* Footer total */}
              <div className="px-7 pb-6 pt-2">
                <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-theme/[0.08] border border-theme/30">
                  <span className="text-[11px] font-medium text-brand">
                    Нийт орлого
                  </span>
                  <span className="text-[14px] font-medium text-brand font-[family-name:var(--font-mono)]">
                    {formatNumber(revenueModalBreakdown.totalAmount)}₮
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {isRegModalOpen && createPortal(
          <VehicleRegistrationModal
            onClose={() => setIsRegModalOpen(false)}
            token={token || ""}
            barilgiinId={effectiveBarilgiinId}
            entryCameras={entryCameras}
            selectedCameraIP={activeEntryIP}
            onSuccess={() => fetchList()}
          />,
          document.body
        )}
      </div>
    </div>
  );
}

// Camera Stream Component using R2WPlayer
const CameraStream = React.memo(
  ({
    ip,
    port,
    name,
    username,
    password,
    root = "stream",
    gateName,
    cameraType,
    onOpenGate,
    barilgiinId,
    token,
  }: {
    ip: string;
    port: number;
    name: string;
    username?: string;
    password?: string;
    root?: string; // Stream path (ROOT from tokhirgoo, e.g., "live", "stream")
    gateName?: string;
    cameraType?: "entry" | "exit";
    onOpenGate?: (ip: string) => void;
    barilgiinId?: string;
    token?: string;
  }) => {
    const [error, setError] = useState(false);
    const [connectionState, setConnectionState] = useState<string>("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const streamContainerRef = useRef<HTMLDivElement>(null);

    const handleError = useCallback((err: any) => {
      console.error("R2WPlayer error:", err);
      setError(true);
    }, []);

    const handleConnectionStateChange = useCallback((state: string) => {
      setConnectionState(state);
      if (state === "failed" || state === "disconnected") {
        setError(true);
      } else if (state === "connected") {
        setError(false);
      }
    }, []);

    const toggleFullscreen = () => {
      if (!streamContainerRef.current) return;

      if (!isFullscreen) {
        // Enter fullscreen
        if (streamContainerRef.current.requestFullscreen) {
          streamContainerRef.current.requestFullscreen();
        } else if (
          (streamContainerRef.current as any).webkitRequestFullscreen
        ) {
          (streamContainerRef.current as any).webkitRequestFullscreen();
        } else if ((streamContainerRef.current as any).msRequestFullscreen) {
          (streamContainerRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    };

    // Listen for fullscreen changes and keyboard shortcuts
    useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
        );
        setIsFullscreen(isCurrentlyFullscreen);
      };

      const handleKeyPress = (e: KeyboardEvent) => {
        // Press 'F' to toggle fullscreen (when not in input/textarea)
        if (e.key === "f" || e.key === "F") {
          const target = e.target as HTMLElement;
          if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
            e.preventDefault();
            toggleFullscreen();
          }
        }
        // Press 'Escape' to exit fullscreen
        if (e.key === "Escape") {
          const isCurrentlyFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).msFullscreenElement
          );
          if (isCurrentlyFullscreen) {
            toggleFullscreen();
          }
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.addEventListener("msfullscreenchange", handleFullscreenChange);
      document.addEventListener("keydown", handleKeyPress);

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
        document.removeEventListener(
          "webkitfullscreenchange",
          handleFullscreenChange,
        );
        document.removeEventListener(
          "msfullscreenchange",
          handleFullscreenChange,
        );
        document.removeEventListener("keydown", handleKeyPress);
      };
    }, []);

    if (error) {
      const rtspUrl = `rtsp://${username || "admin"}:${password || "***"}@${ip}:${port}/${root}`;
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-[color:var(--panel)] to-black text-white">
          <div className="relative max-w-md px-4">
            <div className="absolute inset-0 bg-danger/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative p-6 rounded-3xl bg-[color:var(--panel)] backdrop-blur-sm border border-danger/30 space-y-3">
              <VideoOff className="w-16 h-16 mb-2 mx-auto opacity-75 animate-pulse" />
              <p className="text-base text-center">Камер холбогдохгүй байна</p>
              <p className="text-[11px] opacity-50 text-center font-mono break-all">
                {rtspUrl}
              </p>
              {connectionState && (
                <div className="px-3 py-1.5 rounded-lg bg-danger/20 border border-danger/30">
                  <p className="text-[11px] opacity-80 text-center">
                    Алдаа: {connectionState}
                  </p>
                </div>
              )}
              <p className="text-[11px] text-[color:var(--muted-text)] text-center leading-relaxed">
                Stream path (&quot;{root}&quot;) буруу байж магадгүй.
                <br />
                Камер тохиргооноос ROOT-г шалгана уу.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={streamContainerRef}
        className="absolute inset-0 w-full h-full group/stream"
        style={
          isFullscreen
            ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: "#000",
            }
            : {}
        }
      >
        <WebRTCVideoPlayer
          rtspUrl={username && password
            ? `rtsp://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${ip}:${port}/${root}`
            : `rtsp://${ip}:${port}/${root}`
          }
          barilgiinId={barilgiinId || ""}
          token={token}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Manual Gate Control Button - Modernized */}
        <div className="absolute bottom-6 left-6 z-40 transition-all duration-300 group-hover/stream:translate-y-0 translate-y-2 group-hover/stream:opacity-100 opacity-0 sm:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenGate?.(ip);
            }}
            className={`
            relative flex items-center gap-3 px-8 py-3 rounded-full 
            font-medium text-[11px]  
            transition-all duration-300 active:scale-90
            backdrop-blur-xl border-2
            shadow-[0_8px_32px_rgba(0,0,0,0.3)]
            ${cameraType === "entry"
                ? "bg-success/20 border-success/40 text-white hover:bg-success hover:border-success"
                : "bg-danger/20 border-danger/40 text-white hover:bg-danger hover:border-danger"
              }
          `}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${cameraType === "entry" ? "bg-success" : "bg-danger"} group-hover:bg-[color:var(--surface-bg)] `}
            ></div>
            <span className="!text-white">Нээх</span>
            <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className={`absolute top-2 right-2 z-20 p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-all duration-200 ${isFullscreen
            ? "opacity-100"
            : "opacity-0 group-hover/stream:opacity-100"
            } focus:opacity-100`}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={
            isFullscreen ? "Бүтэн дэлгэцнээс гарах (ESC)" : "Бүтэн дэлгэц (F)"
          }
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>


        {/* Fullscreen overlay info */}
        {isFullscreen && (
          <div className="absolute top-3 left-3 z-30 px-3 py-2 rounded-lg bg-black/70 text-white">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${cameraType === "entry" ? "bg-success" : "bg-danger"} animate-pulse`}
              ></div>
              <div>
                <p className=" text-xs">{gateName || name}</p>
                <p className="text-xs opacity-75 font-mono">
                  {ip}:{port}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Display connection state for debugging */}
        {process.env.NODE_ENV === "development" && connectionState && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1.5 text-center z-10">
            {connectionState}
          </div>
        )}
      </div>
    );
  },
);
