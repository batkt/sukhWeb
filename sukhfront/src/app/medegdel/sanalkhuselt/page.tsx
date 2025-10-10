"use client";

import React, { useEffect, useState } from "react";
import { DatePicker, Image, Popconfirm, notification } from "antd";
import Aos from "aos";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

export default function SanalKhuselt() {
  const { t } = useTranslation();
  const [turul, setTurul] = useState<"sanal" | "gomdol">("sanal");
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<any>(null);
  const [khariltsagch, setKhariltsagch] = useState<any>(null);
  const [showAcceptedBadge, setShowAcceptedBadge] = useState(false);

  const KhariltsagchiinMedeelel = {
    jagsaalt: [
      { _id: "1", ner: "aho", utas: "9911...", register: "AAbondogo" },
      { _id: "2", ner: "aho", utas: "9922...", register: "AAbondogo" },
      { _id: "3", ner: "aho", utas: "9933...", register: "AAbondogo" },
      { _id: "4", ner: "aho", utas: "9944...", register: "AAbondogo" },
      { _id: "5", ner: "aho", utas: "9955...", register: "AAbondogo" },
    ],
  };

  const initialSanal = [
    {
      _id: "101",
      khariltsagchiinId: "1",
      title: "bondogo2",
      message: "coffee pls",
      zurguud: [],
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
    },
    {
      _id: "202",
      khariltsagchiinId: "2",
      title: "bondogo2",
      message: "coffee pls",
      zurguud: [],
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
    },
    {
      _id: "303",
      khariltsagchiinId: "3",
      title: "bondogo2",
      message: "coffee pls",
      zurguud: [],
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
    },
    {
      _id: "404",
      khariltsagchiinId: "5",
      title: "bondogo2",
      message: "coffee pls",
      zurguud: [],
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
    },
    {
      _id: "505",
      khariltsagchiinId: "5",
      title: "bondogo2",
      message: "coffee pls",
      zurguud: [],
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
    },
  ];

  const [sanalList, setSanalList] = useState<any[]>(initialSanal);

  useEffect(() => {
    Aos.init({ duration: 900, once: true });
  }, []);

  function turulSongokh(status: "sanal" | "gomdol") {
    setTurul(status);
    setKhariltsagch(null);
  }

  function sanalGomdolAvakh(itemId: string) {
    setSanalList((prev) =>
      prev.map((p) => (p._id === itemId ? { ...p, tuluv: 1 } : p))
    );
    notification.success({ message: t("Хүлээж авлаа") });
    setShowAcceptedBadge(true);
    setTimeout(() => setShowAcceptedBadge(false), 1600);
  }

  const sanalGomdolTuukh = sanalList.filter(
    (a) => a.khariltsagchiinId === khariltsagch?._id
  );

  return (
    <div className="min-h-screen   dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-slate-900"
      >
        {t("Санал хүсэлт")}
      </motion.h1>

      <div className="grid grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 md:col-span-4 rounded-2xl bg-transparent/60 dark:bg-gray-800/50 p-4 shadow-md backdrop-blur-sm"
        >
          <RangePicker
            className="w-full rounded-lg"
            placeholder={[t("Эхлэх огноо"), t("Дуусах огшноо")]}
            onChange={(dates) => setEkhlekhOgnoo(dates)}
          />

          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { ner: "Санал", utga: "sanal" },
              { ner: "Гомдол", utga: "gomdol" },
            ].map((status, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => turulSongokh(status.utga as "sanal" | "gomdol")}
                className={`py-2 rounded-xl font-semibold transition-all ${
                  turul === status.utga
                    ? "bg-gradient-to-l from-[#f0b98c] to-[#b4a5fc] text-white shadow-md"
                    : "bg-transparent dark:bg-gray-700/40 text-gray-700 dark:text-gray-200 border border-amber-400 dark:border-amber-700"
                }`}
              >
                {t(status.ner)}
              </motion.button>
            ))}
          </div>

          <div className="text-sm text-gray-500 mt-2">{t("Харилцагчид")}</div>
          <div className="max-h-[54vh] overflow-y-auto space-y-2">
            {KhariltsagchiinMedeelel.jagsaalt.map((mur) => (
              <motion.div
                key={mur._id}
                layout
                whileHover={{ scale: 1 }}
                onClick={() => setKhariltsagch(mur)}
                className={`flex w-full items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  khariltsagch?._id === mur._id
                    ? "bg-gradient-to-l from-[#fdd8b9] to-[#7a61f3]"
                    : "bg-transparent/80 dark:bg-gray-800/60 border border-transparent hover:shadow-sm"
                }`}
              >
                <div className="h-11 w-11 rounded-full bg-gradient-to-l from-[#f0b98c] to-[#b4a5fc] flex items-center justify-center text-white font-bold text-lg">
                  {mur.ner[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{mur.ner}</div>
                  <div className="text-xs text-gray-500">{mur.utas}</div>
                </div>
                <div className="text-xs text-gray-400">{mur.register}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="col-span-12 md:col-span-8">
          <AnimatePresence mode="wait">
            {khariltsagch ? (
              <motion.div
                key={khariltsagch._id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="rounded-2xl bg-transparent dark:bg-gray-800/60 p-6 shadow-lg backdrop-blur-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold">
                      {khariltsagch.ner}
                    </div>
                    <div className="text-sm text-gray-500">
                      {khariltsagch.utas}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {t("Сонгогдсон")}: {turul}
                  </div>
                </div>

                <div className="space-y-4">
                  {sanalGomdolTuukh.length === 0 && (
                    <div className="text-center text-gray-500 py-12 rounded-lg border border-dashed border-amber-200">
                      {t(
                        "Сонгогдсон харилцагчид ямар саналууд/гомдлуудгүй байна."
                      )}
                    </div>
                  )}

                  {sanalGomdolTuukh.map((mur) => (
                    <motion.div
                      key={mur._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="p-4 rounded-xl bg-transparent dark:from-gray-800/50 dark:to-gray-800/40 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-semibold">
                          {mur.khariltsagchiinNer}
                        </div>
                        <div className="text-xs text-gray-400">
                          {moment(mur.ognoo).format("YYYY-MM-DD HH:mm")}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="font-medium mb-1">
                          {t("Гарчиг")}: {mur.title}
                        </div>
                        <div className="text-gray-700 dark:text-gray-200">
                          {mur.message}
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        {mur.zurguud?.map((img: string, i: number) => (
                          <Image
                            key={i}
                            width={100}
                            src={img}
                            alt={`img-${i}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <Popconfirm
                          title={t("Хүлээж авах уу?")}
                          onConfirm={() => sanalGomdolAvakh(mur._id)}
                        >
                          <button
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                              mur.tuluv
                                ? "bg-gray-200 text-gray-700 cursor-default"
                                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            }`}
                            disabled={!!mur.tuluv}
                          >
                            {mur.tuluv ? t("Хүлээж авсан") : t("Хүлээж авах")}
                          </button>
                        </Popconfirm>

                        {mur.tuluv ? (
                          <div className="text-sm text-green-600 font-medium">
                            {t("Хүлээж авсан")}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            {t("Төлөв: Нээлттэй")}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {showAcceptedBadge && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.6, y: 10 }}
                      transition={{ duration: 0.4 }}
                      className="fixed right-8 top-24 z-50 pointer-events-none"
                    >
                      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg">
                        ✅ {t("Хүлээж авлаа")}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="rounded-2xl bg-transparent dark:bg-gray-800/60 p-12 shadow-lg backdrop-blur-md flex items-center justify-center"
              >
                <div className="text-center text-gray-600 dark:text-gray-300">
                  {t("Та харилцагчаа сонгоно уу.")}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
