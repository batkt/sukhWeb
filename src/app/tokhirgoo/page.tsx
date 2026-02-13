"use client";

import { useMemo, useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import { useAuth } from "@/lib/useAuth";
import { Settings } from "lucide-react";
import { hasPermission } from "@/lib/permissionUtils";

// Dynamic imports for better code splitting
const AppTokhirgoo = lazy(() => import("./AppTokhirgoo"));
const AshiglaltiinZardal = lazy(() => import("./AshiglaltiinZardal"));
const Baaz = lazy(() => import("./Baaz"));
const EbarimtTokhirgoo = lazy(() => import("./EbarimtTokhirgoo"));
const Dans = lazy(() => import("./Dans"));
const EmailTokhirgoo = lazy(() => import("./EmailTokhirgoo"));
const Medegdel = lazy(() => import("./Medegdel"));
const NevtreltiinTuukh = lazy(() => import("./NevtreltiinTuukh"));
const Zogsool = lazy(() => import("./Zogsool"));
const UstgasanTuukh = lazy(() => import("./UstsanTuukh"));
const ZassanTuukh = lazy(() => import("./ZassanTuukh"));
const BarilgiinTokhirgoo = lazy(() => import("./BarilgiinTokhirgoo"));
const NemeltTokhirgoo = lazy(() => import("./NemeltTokhirgoo"));

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
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-4 py-2 bg-theme text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Дахин ачааллах
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminLayout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="w-full pb-6 flex flex-col min-h-0" style={{ minHeight: "calc(100vh - 140px)" }}>
    <header className="px-4 pt-3 flex-shrink-0">
      <h1 className="text-2xl  mb-2 text-[color:var(--panel-text)] leading-tight">
        {title}
      </h1>
    </header>

    <main className="flex-1 min-h-0 overflow-hidden px-4 flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-6">
        {children}
      </div>
    </main>
  </div>
);

function Tokhirgoo() {
  const { ajiltan, baiguullaga, token } = useAuth();

  // Persist selected tab so saving in child windows (which may trigger
  // re-renders/remounts) doesn't jump back to the first tab.
  const STORAGE_KEY = "tokhirgoo_selectedIndex";
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

  const tokhirgoo = useMemo(() => {
    const isAdmin = ajiltan?.erkh === "Admin" || ajiltan?.erkh === "admin";
    const has = (path: string) => hasPermission(ajiltan, path);

    const allTabs = [
      { perm: "tokhirgoo.barilga", text: "Барилгын тохиргоо", tsonkh: BarilgiinTokhirgoo, comingSoon: false },
      { perm: "tokhirgoo.nemelt", text: "Нэмэлт тохиргоо", tsonkh: NemeltTokhirgoo, comingSoon: false },
      { perm: "tokhirgoo.ebarimt", text: "И-Баримт", tsonkh: EbarimtTokhirgoo, comingSoon: false },
      { perm: "tokhirgoo.ashiglaltiinZardal", text: "Ашиглалтын зардал", tsonkh: AshiglaltiinZardal, comingSoon: false },
      { perm: "tokhirgoo.dans", text: "Данс", tsonkh: Dans, comingSoon: false },
      { perm: "tokhirgoo.zogsool", text: "Зогсоол", tsonkh: Zogsool, comingSoon: false },
      { perm: "tokhirgoo.nevtreltiinTuukh", text: "Нэвтрэлтийн түүх", tsonkh: NevtreltiinTuukh, comingSoon: false },
      { perm: "tokhirgoo.ustsanTuukh", text: "Устгасан түүх", tsonkh: UstgasanTuukh, comingSoon: false },
      { perm: "tokhirgoo.zassanTuukh", text: "Зассан түүх", tsonkh: ZassanTuukh, comingSoon: false },
      { perm: "tokhirgoo.baaz", text: "Бааз", tsonkh: Baaz, comingSoon: true },
    ];

    if (isAdmin) {
      return allTabs.map((t) => ({
        icon: <Settings className="w-5 h-5" />,
        text: t.text,
        tsonkh: t.tsonkh,
        comingSoon: t.comingSoon,
      }));
    }

    return allTabs
      .filter((t) => has(t.perm))
      .map((t) => ({
        icon: <Settings className="w-5 h-5" />,
        text: t.text,
        tsonkh: t.tsonkh,
        comingSoon: t.comingSoon,
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
      } catch (e) {}
    }
  }, [tokhirgoo.length, selectedIndexInternal]);

  return (
    <AdminLayout title="Тохиргоо">
      {tokhirgoo.length > 0 && (
      <div className="w-full lg:col-span-3 min-h-0 flex flex-col overflow-hidden">
        <div className="bg-transparent rounded-2xl shadow-lg overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="p-5 space-y-2 bg-transparent overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {tokhirgoo.map((item: any, i) => {
              const isActive = i === selectedIndexInternal;
              const isSoon = Boolean(item?.comingSoon);
              return (
                <button
                  key={item.text}
                  onClick={() => {
                    if (isSoon) return;
                    setSelectedIndex(i);
                  }}
                  aria-disabled={isSoon}
                  className={`relative btn-minimal flex items-center w-full justify-start gap-3 text-left transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--btn-bg-hover)] border border-[var(--btn-border)] text-theme "
                      : "text-theme opacity-80 hover:opacity-100"
                  } ${isSoon ? "cursor-not-allowed pr-24" : ""}`}
                >
                  {item.icon}
                  <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-left">
                    {item.text}
                  </span>
                  {isSoon && (
                    <span className="text-xs  text-green-500 whitespace-nowrap flex-shrink-0 overflow-hidden text-ellipsis max-w-20">
                      Тун удахгүй
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}

      <div className={`w-full text-theme min-h-0 flex flex-col overflow-hidden ${tokhirgoo.length > 0 ? "lg:col-span-9" : "lg:col-span-12"}`}>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {tokhirgoo.length === 0 && ajiltan && (
            <div className="flex flex-col items-center justify-center p-12 text-theme/70">
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
      </div>
    </AdminLayout>
  );
}

export default Tokhirgoo;
