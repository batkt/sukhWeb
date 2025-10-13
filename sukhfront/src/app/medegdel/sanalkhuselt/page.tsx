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
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm"
      >
        {t("Санал хүсэлт")}
      </motion.h1>

      <div className="flex h-[calc(100vh-10rem)] gap-6 bg-transparent">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex w-1/3 flex-col space-y-4 bg-transparent"
        >
          <div className="grid grid-cols-1 gap-3 bg-transparent">
            <RangePicker
              placeholder={[t("Эхлэх"), t("Дуусах")]}
              onChange={(dates) => setEkhlekhOgnoo(dates)}
              className="!h-10 !bg-transparent !backdrop-blur-md !border !border-gray-300 !text-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 bg-transparent">
            {[
              { ner: t("Санал"), utga: "sanal" },
              { ner: t("Гомдол"), utga: "gomdol" },
            ].map((status, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => turulSongokh(status.utga)}
                className={`p-3 text-center rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-xl ${
                  turul === status.utga
                    ? "border-gray-300 bg-white/25 shadow-xl"
                    : "border-gray-200 bg-transparent hover:shadow-lg"
                }`}
              >
                <div className="text-sm font-semibold text-gray-800">
                  {status.ner}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3">
            {KhariltsagchiinMedeelel.jagsaalt.map((mur, idx) => (
              <motion.div
                key={mur._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ scale: 1.001 }}
                onClick={() => setKhariltsagch(mur)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all backdrop-blur-xl border ${
                  khariltsagch?._id === mur._id
                    ? "bg-white/25 border-white/50"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-300 via-purple-300 to-pink-200 flex items-center justify-center text-white font-bold">
                  {mur.ner[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-black">{mur.ner}</div>
                  <div className="text-xs text-gray-500">{mur.utas}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          <AnimatePresence mode="wait">
            {khariltsagch ? (
              <motion.div
                key={khariltsagch._id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="flex h-full flex-col space-y-4 rounded-3xl bg-transparent p-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-transparent backdrop-blur-xl p-6 border border-gray-200 shadow-xl"
                >
                  <div className="font-bold text-2xl text-black mb-2">
                    {khariltsagch.ner}
                  </div>
                  <div className="text-sm text-gray-600">
                    {khariltsagch.utas}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {t("Төрөл")}: {turul}
                  </div>
                </motion.div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {sanalGomdolTuukh.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center h-full"
                    >
                      <div className="text-center p-8 rounded-2xl bg-transparent backdrop-blur-xl border border-gray-200 text-gray-600">
                        {t("Сонгогдсон харилцагчид мэдээлэл алга.")}
                      </div>
                    </motion.div>
                  ) : (
                    sanalGomdolTuukh.map((mur, idx) => (
                      <motion.div
                        key={mur._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="p-5 rounded-2xl transition-all bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-xl"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-gray-800">
                            {mur.khariltsagchiinNer}
                          </div>
                          <div className="text-xs text-gray-500 font-mono bg-white/10 px-3 py-1 rounded-full">
                            {moment(mur.ognoo).format("MM-DD HH:mm")}
                          </div>
                        </div>

                        <div className="text-gray-700 text-sm mb-3">
                          <div className="font-medium">{mur.title}</div>
                          <div>{mur.message}</div>
                        </div>

                        {mur.zurguud?.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {mur.zurguud.map((img, i) => (
                              <Image
                                key={i}
                                width={100}
                                src={img}
                                alt={`img-${i}`}
                                className="rounded-xl shadow-md"
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Popconfirm
                            title={t("Хүлээж авах уу?")}
                            onConfirm={() => sanalGomdolAvakh(mur._id)}
                          >
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`flex-1 px-4 py-2 rounded-xl text-center font-semibold text-sm cursor-pointer transition-all ${
                                mur.tuluv
                                  ? "bg-gray-200 text-gray-600 cursor-default"
                                  : "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-[0_0_20px_rgba(0,255,128,0.5)]"
                              }`}
                            >
                              {mur.tuluv ? t("Хүлээж авсан") : t("Хүлээж авах")}
                            </motion.div>
                          </Popconfirm>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Accepted Badge */}
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex h-full items-center justify-center rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-7xl mb-6"
                  >
                    💬
                  </motion.div>
                  <div className="font-bold text-2xl text-gray-700 mb-3">
                    {t("Санал хүсэлтээ харахын тулд харилцагч сонгоно уу")}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
