"use client";

import { useMemo, useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import { Menu, Pin, PinOff } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import {
  Building2,
  Car,
  Database,
  Landmark,
  LifeBuoy,
  ListChecks,
  LogIn,
  Receipt,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { hasPermission } from "@/lib/permissionUtils";
import Button from "@/components/ui/Button";

// Dynamic imports for better code splitting
const AppTokhirgoo = lazy(() => import("./AppTokhirgoo"));
const AshiglaltiinZardal = lazy(() => import("./AshiglaltiinZardal"));
const Baaz = lazy(() => import("./Baaz"));
const EbarimtTokhirgoo = lazy(() => import("./EbarimtTokhirgoo"));
const Dans = lazy(() => import("./Dans"));
const EmailTokhirgoo = lazy(() => import("./EmailTokhirgoo"));
const Medegdel = lazy(() => import("./Medegdel"));
const NevtreltiinTuukh = lazy(() => import("./NevtreltiinTuukh"));
const ZogsoolTokhirgoo = lazy(() => import("./ZogsoolTokhirgoo"));
const BarilgiinTokhirgoo = lazy(() => import("./BarilgiinTokhirgoo"));
const NemeltTokhirgoo = lazy(() => import("./NemeltTokhirgoo"));
const TuslamjTokhirgoo = lazy(() => import("./TuslamjTokhirgoo"));

// Error boundary for chunk loading errors
class ChunkErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Check if it's a chunk loading error
    if (
      error?.message?.includes("Loading chunk") ||
      error?.name === "ChunkLoadError"
    ) {
      console.error("Chunk loading error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Loading chunk") ||
        this.state.error?.name === "ChunkLoadError";

      return (
        <div className="flex flex-col items-center justify-center p-8 text-theme">
          <div className="text-lg  mb-4">
            {isChunkError ? "Хуудас ачааллахад алдаа гарлаа" : "Алдаа гарлаа"}
          </div>
          <div className="text-sm opacity-70 mb-4 text-center max-w-md">
            {isChunkError
              ? "Хуудас шинэчлэгдсэн байна. Дахин ачааллах товчийг дарна уу."
              : this.state.error?.message || "Тодорхой бус алдаа гарлаа"}
          </div>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            variant="primary"
            size="sm"
          >
            Дахин ачааллах
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-4 pb-6 pt-3">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">{children}</div>
  </div>
);

/** Цэсний бүлэг — нэг бүлгийн табууд хамт харагдана */
type Buleg = "Байгууллага" | "Төлбөр" | "Зогсоол" | "Систем";

function Tokhirgoo() {
  const { ajiltan, baiguullaga, token } = useAuth();

  // Persist selected tab so saving in child windows (which may trigger
  // re-renders/remounts) doesn't jump back to the first tab.
  const STORAGE_KEY = "tokhirgoo_selectedIndex_v2";
  const [selectedIndexInternal, setSelectedIndexInternal] = useState<number>(
    () => {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v ? Number(v) || 0 : 0;
      } catch (e) {
        return 0;
      }
    }
  );

  const setSelectedIndex = (i: number) => {
    setSelectedIndexInternal(i);
    try {
      localStorage.setItem(STORAGE_KEY, String(i));
    } catch (e) {
      // ignore storage errors
    }
  };

  /**
   * Талбарт ажиллаж эхлэхэд (focus) цэс бүрэн нуугдаж, агуулга бүтэн
   * өргөнтэй болно. Оронд нь «Тохиргооны цэс» товч + одоогийн табын нэр
   * гарна — дарж буцааж нээнэ. Hover-оор нээх нь санамсаргүй үсэрдэг,
   * ахмад хэрэглэгчдэд олдохгүй байсан тул тодорхой товч болгов.
   * «Нуухгүй» (pin) сонгосон бол цэс үргэлж харагдана.
   */
  const PIN_KEY = "tokhirgoo_nav_pin";
  const [tsesTogtmol, setTsesTogtmol] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PIN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [khumigdsan, setKhumigdsan] = useState(false);
  const tsesNuugdsan = khumigdsan && !tsesTogtmol;
  const togtmolSolikh = () => {
    const v = !tsesTogtmol;
    setTsesTogtmol(v);
    if (v) setKhumigdsan(false);
    try {
      localStorage.setItem(PIN_KEY, v ? "1" : "0");
    } catch {
      /* хадгалах боломжгүй */
    }
  };

  const tokhirgoo = useMemo(() => {
    const isAdmin = ajiltan?.erkh === "Admin" || ajiltan?.erkh === "admin";
    const has = (path: string) => hasPermission(ajiltan, path);

    // `tailbar` — баруун талын гарчгийн доор нэг мөр. `tolgoi: true` —
    // таб өөрөө гарчиг зурдаггүй (шинэ загварт шилжсэн) тул бүрхүүл зурна.
    const allTabs: {
      perm: string;
      /** Өөр эрхээр ч харагдана (нэгтгэсэн таб) */
      perm2?: string;
      text: string;
      tailbar: string;
      buleg: Buleg;
      Icon: React.ComponentType<{ className?: string }>;
      tsonkh: React.ComponentType<any>;
      tolgoi?: boolean;
      comingSoon: boolean;
    }[] = [
      { perm: "tokhirgoo.barilga", text: "Барилгын тохиргоо", tailbar: "СӨХ-ийн мэдээлэл, барилга, орц, давхар", buleg: "Байгууллага", Icon: Building2, tsonkh: BarilgiinTokhirgoo, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.nemelt", text: "Нэмэлт тохиргоо", tailbar: "Нэхэмжлэх, алданги, мэдэгдэл, машины хязгаар", buleg: "Байгууллага", Icon: SlidersHorizontal, tsonkh: NemeltTokhirgoo, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.ashiglaltiinZardal", text: "Ашиглалтын зардал", tailbar: "Сар бүр бодогдох зардлууд", buleg: "Төлбөр", Icon: ListChecks, tsonkh: AshiglaltiinZardal, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.dans", text: "Данс", tailbar: "Төлбөр хүлээн авах данс", buleg: "Төлбөр", Icon: Landmark, tsonkh: Dans, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.ebarimt", text: "И-Баримт", tailbar: "Татварын баримтын тохиргоо", buleg: "Төлбөр", Icon: Receipt, tsonkh: EbarimtTokhirgoo, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.zogsool", perm2: "tokhirgoo.kamer", text: "Зогсоол", tailbar: "Зогсоол, тариф, хаалга, камер", buleg: "Зогсоол", Icon: Car, tsonkh: ZogsoolTokhirgoo, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.nevtreltiinTuukh", text: "Нэвтрэлтийн түүх", tailbar: "Хэн, хэзээ нэвтэрсэн", buleg: "Систем", Icon: LogIn, tsonkh: NevtreltiinTuukh, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.baaz", text: "Бааз", tailbar: "Өгөгдлийн сангийн хэмжээ", buleg: "Систем", Icon: Database, tsonkh: Baaz, tolgoi: true, comingSoon: false },
      { perm: "tokhirgoo.tuslamj", text: "Ерөнхий тусламж", tailbar: "Тусламжийн агуулга", buleg: "Систем", Icon: LifeBuoy, tsonkh: TuslamjTokhirgoo, tolgoi: true, comingSoon: false },
    ];

    return (isAdmin ? allTabs : allTabs.filter((t) => has(t.perm) || (!!t.perm2 && has(t.perm2)))).map((t) => ({
      ...t,
      icon: <t.Icon className="h-4 w-4 shrink-0" />,
    }));
  }, [ajiltan]);

  const Tsonkh = useMemo(
    () => tokhirgoo[selectedIndexInternal]?.tsonkh,
    [tokhirgoo, selectedIndexInternal]
  );

  // Clamp selected index when tabs change (e.g. non-admin loses permissions)
  useEffect(() => {
    if (tokhirgoo.length > 0 && selectedIndexInternal >= tokhirgoo.length) {
      setSelectedIndexInternal(0);
      try {
        localStorage.setItem(STORAGE_KEY, "0");
      } catch (e) { }
    }
  }, [tokhirgoo.length, selectedIndexInternal]);

  return (
    <AdminLayout>
      {tokhirgoo.length > 0 && (
        <aside
          className={`relative w-full shrink-0 lg:sticky lg:top-[calc(var(--shell-topbar-h,56px)+1rem)] lg:w-[232px] ${
            tsesNuugdsan ? "lg:hidden" : ""
          }`}
        >
          <nav
            aria-label="Тохиргоо"
            className="flex gap-1 overflow-x-auto rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-2 lg:max-h-[calc(100dvh-var(--shell-topbar-h,56px)-2.5rem)] lg:flex-col lg:overflow-y-auto custom-scrollbar"
          >
            {tokhirgoo.map((item: any, i) => {
              const isActive = i === selectedIndexInternal;
              const shineBuleg = i === 0 || tokhirgoo[i - 1]?.buleg !== item.buleg;
              return (
                <div key={item.text} className="contents">
                  {shineBuleg && (
                    <div className={`hidden px-2.5 pb-1 text-[12px] text-[color:var(--muted-text)] lg:block ${i === 0 ? "pt-1" : "pt-3"}`}>
                      {item.buleg}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex min-h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-2.5 py-2 text-left text-[14px] transition-colors ${
                      isActive
                        ? "bg-theme/10 text-brand"
                        : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <span className={isActive ? "text-brand" : "text-[color:var(--muted-text)]"}>{item.icon}</span>
                    <span className="min-w-0 truncate">{item.text}</span>
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={togtmolSolikh}
              title={tsesTogtmol ? "Талбарт ажиллах үед цэсийг нуух" : "Цэсийг хэзээ ч нуухгүй"}
              aria-pressed={tsesTogtmol}
              className="mt-auto hidden min-h-10 items-center gap-2.5 border-t border-[color:var(--surface-border)] px-2.5 pb-1 pt-3 text-[13px] text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] lg:flex"
            >
              {tsesTogtmol ? <PinOff className="h-4 w-4 shrink-0" /> : <Pin className="h-4 w-4 shrink-0" />}
              {tsesTogtmol ? "Ажиллах үед нуух" : "Цэсийг нуухгүй"}
            </button>
          </nav>
        </aside>
      )}

      <div
        className="min-w-0 flex-1 text-theme"
        // Агуулга дээр ажиллаж эхэлмэгц цэсийг хумина (зөвхөн том дэлгэцэнд)
        onFocusCapture={(e) => {
          // Зөвхөн талбарт бичих/сонгох үед (товч дарахад биш)
          const t = e.target as HTMLElement;
          if (!tsesTogtmol && t.matches("input, textarea, select, [contenteditable='true']"))
            setKhumigdsan(true);
        }}
      >
        {tsesNuugdsan && tokhirgoo[selectedIndexInternal] && (
          <div className="mb-3 hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setKhumigdsan(false)}
              className="btn-minimal inline-flex h-10 items-center gap-2 !px-3.5 text-[14px]"
            >
              <Menu className="h-4 w-4" />
              Тохиргооны цэс
            </button>
            <span className="inline-flex items-center gap-2 text-[14px] text-[color:var(--muted-text)]">
              {tokhirgoo[selectedIndexInternal].icon}
              {tokhirgoo[selectedIndexInternal].text}
            </span>
          </div>
        )}
        {tokhirgoo.length === 0 && ajiltan && (
          <div className="flex flex-col items-center justify-center p-12 text-theme">
            <Settings className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg ">Тохиргооны эрх олдсонгүй</p>
            <p className="text-sm mt-2">Админ тань тохиргооны эрх олгоно уу.</p>
          </div>
        )}
        {Tsonkh &&
          ajiltan &&
          (() => {
            const AnyWindow = Tsonkh as unknown as React.ComponentType<any>;
            return (
              <ChunkErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-8">
                      <div className="text-theme opacity-60">
                        Ачааллаж байна...
                      </div>
                    </div>
                  }
                >
                  <AnyWindow
                    ajiltan={ajiltan}
                    baiguullaga={baiguullaga}
                    token={token || ""}
                    setSongogdsonTsonkhniiIndex={setSelectedIndex}
                  />
                </Suspense>
              </ChunkErrorBoundary>
            );
          })()}
      </div>
    </AdminLayout>
  );
}

export default Tokhirgoo;
