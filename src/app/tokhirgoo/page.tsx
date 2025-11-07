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
  <div className="min-h-screen text-theme">
    <h1 className="text-2xl font-semibold mb-4 text-[color:var(--panel-text)] leading-tight mt-2 ml-4">
      {title}
    </h1>
    <div className="grid grid-cols-12 gap-6 overflow-y-auto custom-scrollbar h-full md:h-auto">
      {children}
    </div>
  </div>
);

function Tokhirgoo() {
  const { ajiltan, baiguullaga, token } = useAuth();

  const [selectedIndex, setSelectedIndex] = useState(0);

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
        // {
        //   icon: <Settings className="w-5 h-5" />,
        //   text: "Зогсоол",
        //   tsonkh: Zogsool,
        // },
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
    () => tokhirgoo[selectedIndex]?.tsonkh,
    [tokhirgoo, selectedIndex]
  );

  return (
    <AdminLayout title="Тохиргоо">
      <div className="col-span-12 lg:col-span-3">
        <div className="bg-transparent rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5 space-y-2 bg-transparent max-h-[560px] overflow-y-auto md:overflow-y-hidden custom-scrollbar">
            {tokhirgoo.map((item: any, i) => {
              const isActive = i === selectedIndex;
              const isSoon = Boolean(item?.comingSoon);
              return (
                <button
                  key={item.text}
                  onClick={() => {
                    if (isSoon) return; // block taps for coming soon
                    setSelectedIndex(i);
                  }}
                  aria-disabled={isSoon}
                  className={`relative btn-minimal flex items-center w-full justify-start gap-3 text-left transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--btn-bg-hover)] border border-[var(--btn-border)] text-theme font-semibold"
                      : "text-theme opacity-80 hover:opacity-100"
                  } ${isSoon ? "cursor-not-allowed" : ""}`}
                >
                  {item.icon}
                  <span>{item.text}</span>
                  {isSoon && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-500">
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
