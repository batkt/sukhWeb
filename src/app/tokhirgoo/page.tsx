"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { Settings } from "lucide-react";

import AppTokhirgoo from "./AppTokhirgoo";
import AshiglaltiinZardal from "./AshiglaltiinZardal";
import Baaz from "./Baaz";
import EbarimtTokhirgoo from "./EbarimtTokhirgoo";
import Dans from "./Dans";
import EmailTokhirgoo from "./EmailTokhirgoo";
import TuslamjTokhirgoo from "./TuslamjTokhirgoo";

import Medegdel from "./Medegdel";
import NevtreltiinTuukh from "./NevtreltiinTuukh";

import Zogsool from "./Zogsool";
import UstgasanTuukh from "./UstsanTuukh";
import ZassanTuukh from "./ZassanTuukh";
import BarilgiinTokhirgoo from "./BarilgiinTokhirgoo";

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
  <div>
    <header className="px-4 pt-3">
      <h1 className="text-2xl font-semibold mb-2 text-[color:var(--panel-text)] leading-tight">
        {title}
      </h1>
    </header>

    <main className="flex-1 px-4 pb-6">
      <div className="grid grid-cols-12 gap-6">{children}</div>
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
          text: "Зогсоол",
          tsonkh: Zogsool,
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
      <div className="col-span-12 lg:col-span-3">
        <div className="bg-transparent rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5 space-y-2 bg-transparent overflow-y-auto md:overflow-y-hidden custom-scrollbar">
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
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.text}
                  </span>
                  {isSoon && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-500 max-w-20 overflow-hidden text-ellipsis whitespace-nowrap">
                      Тун удахгүй
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-9 text-theme">
        {Tsonkh &&
          ajiltan &&
          (() => {
            const AnyWindow = Tsonkh as unknown as React.ComponentType<any>;
            return (
              <AnyWindow
                ajiltan={ajiltan}
                baiguullaga={baiguullaga}
                token={token || ""}
                setSongogdsonTsonkhniiIndex={setSelectedIndex}
              />
            );
          })()}
      </div>
    </AdminLayout>
  );
}

export default Tokhirgoo;
