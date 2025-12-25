"use client";

import { useMemo, useState, lazy, Suspense, Component, ReactNode } from "react";
import { useAuth } from "@/lib/useAuth";
import { Settings } from "lucide-react";

// Dynamic imports for better code splitting
const AppTokhirgoo = lazy(() => import("./AppTokhirgoo"));
const AshiglaltiinZardal = lazy(() => import("./AshiglaltiinZardal"));
const Baaz = lazy(() => import("./Baaz"));
const EbarimtTokhirgoo = lazy(() => import("./EbarimtTokhirgoo"));
const Dans = lazy(() => import("./Dans"));
const EmailTokhirgoo = lazy(() => import("./EmailTokhirgoo"));
const TuslamjTokhirgoo = lazy(() => import("./TuslamjTokhirgoo"));
const Medegdel = lazy(() => import("./Medegdel"));
const NevtreltiinTuukh = lazy(() => import("./NevtreltiinTuukh"));
const Zogsool = lazy(() => import("./Zogsool"));
const UstgasanTuukh = lazy(() => import("./UstsanTuukh"));
const ZassanTuukh = lazy(() => import("./ZassanTuukh"));
const BarilgiinTokhirgoo = lazy(() => import("./BarilgiinTokhirgoo"));

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
          <div className="text-lg font-semibold mb-4">
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
  // Use a column flex layout so header stays visible and the content area
  // can grow/shrink. Use min-h-0 on the scrolling container so children can
  // use flex-based heights and inner scrolling works on all browsers.
  <div className="w-full pb-6" style={{ minHeight: "calc(100vh - 140px)" }}>
    <header className="px-4 pt-3">
      <h1 className="text-2xl font-semibold mb-2 text-[color:var(--panel-text)] leading-tight">
        {title}
      </h1>
    </header>

    <main
      className="px-4 overflow-y-auto lg:overflow-y-visible custom-scrollbar"
      style={{ maxHeight: "calc(100vh - 200px)" }}
    >
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
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
    if (ajiltan?.erkh === "Admin") {
      return [
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Барилгын тохиргоо",
          tsonkh: BarilgiinTokhirgoo,
        },

        {
          icon: <Settings className="w-5 h-5" />,
          text: "И-Баримт",
          tsonkh: EbarimtTokhirgoo,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: " Ашиглалтын зардал",
          tsonkh: AshiglaltiinZardal,
        },
        // {
        //   icon: <Settings className="w-5 h-5" />,
        //   text: "Мэдэгдэл",
        //   tsonkh: Medegdel,
        // },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Данс",
          tsonkh: Dans,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Зогсоол",
          tsonkh: Zogsool,
          comingSoon: true,
        },
        // {
        //   icon: <Settings className="w-5 h-5" />,
        //   text: " Хэрэглэгчийн апп",
        //   tsonkh: AppTokhirgoo,
        // },

        // {
        //   icon: <Settings className="w-5 h-5" />,
        //   text: "И-мэйл",
        //   tsonkh: EmailTokhirgoo,
        // },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Тусламж",
          tsonkh: TuslamjTokhirgoo,
          comingSoon: true,
          // Enabled: implement PDF upload/view and use green static theme inside
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Бааз",
          tsonkh: Baaz,
          comingSoon: true,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Нэвтрэлтийн түүх",
          tsonkh: NevtreltiinTuukh,
          comingSoon: true,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Устгасан түүх",
          tsonkh: UstgasanTuukh,
          comingSoon: true,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Зассан түүх",
          tsonkh: ZassanTuukh,
          comingSoon: true,
        },
      ];
    } else {
      return [
        // {
        //   icon: <Settings className="w-5 h-5" />,
        //   text: "Нууц үг солих",
        //   tsonkh: NuutsUgSolikh,
        // },
      ];
    }
  }, [ajiltan]);

  const Tsonkh = useMemo(
    () => tokhirgoo[selectedIndexInternal]?.tsonkh,
    [tokhirgoo, selectedIndexInternal]
  );

  return (
    <AdminLayout title="Тохиргоо">
      <div className="w-full lg:col-span-3 ">
        <div className="bg-transparent rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5 space-y-2 bg-transparent">
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
                      ? "bg-[var(--btn-bg-hover)] border border-[var(--btn-border)] text-theme font-semibold"
                      : "text-theme opacity-80 hover:opacity-100"
                  } ${isSoon ? "cursor-not-allowed pr-24" : ""}`}
                >
                  {item.icon}
                  <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-left">
                    {item.text}
                  </span>
                  {isSoon && (
                    <span className="text-xs font-semibold text-green-500 whitespace-nowrap flex-shrink-0 overflow-hidden text-ellipsis max-w-20">
                      Тун удахгүй
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full lg:col-span-9 text-theme">
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
