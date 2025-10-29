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
import NuutsUgSolikh from "./NuutsUgSolikh";

import UndsenMedeelel from "./UndsenMedeelel";
import Zogsool from "./Zogsool";
import UstgasanTuukh from "./UstsanTuukh";
import ZassanTuukh from "./ZassanTuukh";

const AdminLayout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen text-theme">
    <h1 className="text-3xl font-bold mb-8 text-theme">{title}</h1>
    <div className="grid grid-cols-12 gap-6">{children}</div>
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
          text: "Хувийн мэдээлэл",
          tsonkh: UndsenMedeelel,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Тусламж",
          tsonkh: TuslamjTokhirgoo,
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
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Мэдэгдэл",
          tsonkh: Medegdel,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Данс",
          tsonkh: Dans,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: " Хэрэглэгчийн апп",
          tsonkh: AppTokhirgoo,
        },

        {
          icon: <Settings className="w-5 h-5" />,
          text: "И-мэйл",
          tsonkh: EmailTokhirgoo,
        },
        { icon: <Settings className="w-5 h-5" />, text: "Бааз", tsonkh: Baaz },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Нэвтрэлтийн түүх",
          tsonkh: NevtreltiinTuukh,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Устгасан түүх",
          tsonkh: UstgasanTuukh,
        },
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Зассан түүх",
          tsonkh: ZassanTuukh,
        },
      ];
    } else {
      return [
        {
          icon: <Settings className="w-5 h-5" />,
          text: "Нууц үг солих",
          tsonkh: NuutsUgSolikh,
        },
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
          <div
            className="flex items-center p-5 border-b"
            style={{ borderColor: "var(--surface-border)" }}
          >
            <img
              src="/profile.svg"
              alt={ajiltan?.ner || "profile"}
              className="w-12 h-12 rounded-full ring-2 ring-[var(--sidebar-ring)]"
            />
            <div className="ml-4">
              <h2 className="font-medium text-lg text-theme">
                {ajiltan?.ner || ""}
              </h2>
              <p className="text-theme text-sm">{ajiltan?.nevtrekhNer || ""}</p>
            </div>
          </div>

          <div className="p-5 space-y-2 bg-transparent max-h-[560px] overflow-y-auto custom-scrollbar">
            {tokhirgoo.map((item, i) => (
              <button
                key={item.text}
                onClick={() => setSelectedIndex(i)}
                className={`btn-minimal flex items-center w-full justify-start gap-3 text-left transition-all duration-200 ${
                  i === selectedIndex
                    ? "bg-[var(--btn-bg-hover)] border border-[var(--btn-border)] text-theme font-semibold"
                    : "text-theme opacity-80 hover:opacity-100"
                }`}
              >
                {item.icon}
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-9 text-theme">
        <div className="bg-transparent rounded-2xl shadow-lg p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
      </div>
    </AdminLayout>
  );
}

export default Tokhirgoo;
