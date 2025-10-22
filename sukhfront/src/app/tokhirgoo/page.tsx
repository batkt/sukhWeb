"use client";

import { useMemo, useState } from "react";
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
  <div className="min-h-screen">
    <h1 className="text-3xl font-bold mb-8 text-slate-900">{title}</h1>
    <div className="grid grid-cols-12 gap-6">{children}</div>
  </div>
);

const mockAjiltan = {
  _id: "ajiltan-123",
  erkh: "Admin",
  ner: "d ./.",
  ovog: "a",
  albanTushaal: "Developer",
  register: "1234567890",
  zurgiinNer: null,
  baiguullagiinId: "test-org",
};

const mockBaiguullaga = {
  _id: "mock-id-123",
  tokhirgoo: {
    msgIlgeekhDugaar: "1234",
    msgIlgeekhKey: "test-key-123",
    msgAvakhDugaar: ["99887766", "88776655"],
    msgAvakhTurul: "bugd",
  },
};

function Tokhirgoo() {
  const ajiltan = mockAjiltan;
  const baiguullaga = mockBaiguullaga;

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
          <div className="flex items-center p-5 border-b border-amber-200">
            <img
              src="/profile.svg"
              alt={ajiltan.ner}
              className="w-12 h-12 rounded-full ring-2 ring-amber-500"
            />
            <div className="ml-4">
              <h2 className="font-medium text-lg text-slate-900">{`${ajiltan.ovog} ${ajiltan.ner}`}</h2>
              <p className="text-slate-500 text-sm">{ajiltan.albanTushaal}</p>
            </div>
          </div>

          <div className="p-5 space-y-2 bg-transparent">
            {tokhirgoo.map((item, i) => (
              <button
                key={item.text}
                onClick={() => setSelectedIndex(i)}
                className={`flex items-center w-full gap-3 px-4 py-2 rounded-lg text-left transition-all duration-200 ${
                  i === selectedIndex
                    ? "bg-amber-50 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-9 text-slate-900">
        <div className="bg-transparent rounded-2xl shadow-lg p-8">
          {Tsonkh && (
            <Tsonkh
              ajiltan={ajiltan}
              baiguullaga={baiguullaga}
              token="mock-token-123"
              setSongogdsonTsonkhniiIndex={setSelectedIndex}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default Tokhirgoo;
