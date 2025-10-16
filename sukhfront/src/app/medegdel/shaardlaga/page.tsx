"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button, Tag, DatePicker, notification } from "antd";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import moment from "moment";

const { RangePicker } = DatePicker;

type TurulType = "sanal" | "gomdol";

interface Feedback {
  _id: string;
  title?: string;
  message: string;
  tuluv?: number;
  createdAt?: string;
}

interface Khariltsagch {
  _id: string;
  ner: string;
  utas: string;
  register: string;
  tuluv?: number;
  allFeedbacks?: Feedback[];
}

interface Sanal {
  _id: string;
  khariltsagchiinId: string;
  title: string;
  message: string;
  tuluv: number;
  ognoo: Date;
  khariltsagchiinNer: string;
  zurguud?: string[];
}

export default function SanalKhuselt() {
  const { t } = useTranslation();
  const [turul, setTurul] = useState<TurulType>("sanal");
  const [khariltsagch, setKhariltsagch] = useState<Khariltsagch | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<any>(null);

  const KhariltsagchiinMedeelel: { jagsaalt: Khariltsagch[] } = {
    jagsaalt: [
      {
        _id: "1",
        ner: "Aho",
        utas: "9911...",
        register: "AAbondogo",
        allFeedbacks: [],
      },
      {
        _id: "2",
        ner: "Boo",
        utas: "9922...",
        register: "AAbondogo",
        allFeedbacks: [],
      },
      {
        _id: "3",
        ner: "Coo",
        utas: "9933...",
        register: "AAbondogo",
        allFeedbacks: [],
      },
      {
        _id: "4",
        ner: "Doo",
        utas: "9944...",
        register: "AAbondogo",
        allFeedbacks: [],
      },
      {
        _id: "5",
        ner: "Eoo",
        utas: "9955...",
        register: "AAbondogo",
        allFeedbacks: [],
      },
    ],
  };

  const initialSanal: Sanal[] = [
    {
      _id: "101",
      khariltsagchiinId: "1",
      title: "bondogo2",
      message: "coffee pls",
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
      zurguud: [],
    },
    {
      _id: "202",
      khariltsagchiinId: "2",
      title: "bondogo2",
      message: "coffee pls",
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
      zurguud: [],
    },
    {
      _id: "303",
      khariltsagchiinId: "3",
      title: "bondogo2",
      message: "coffee pls",
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
      zurguud: [],
    },
    {
      _id: "404",
      khariltsagchiinId: "5",
      title: "bondogo2",
      message: "coffee pls",
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
      zurguud: [],
    },
    {
      _id: "505",
      khariltsagchiinId: "5",
      title: "bondogo2",
      message: "coffee pls",
      tuluv: 0,
      ognoo: new Date(),
      khariltsagchiinNer: "coffee+energy drink",
      zurguud: [],
    },
  ];

  const [sanalList, setSanalList] = useState<Sanal[]>(initialSanal);

  useEffect(() => {
    Aos.init({ once: true, duration: 800 });
  }, []);

  const turulSongokh = (status: TurulType) => {
    setTurul(status);
    setKhariltsagch(null);
  };

  const sanalGomdolAvakh = (itemId: string) => {
    setSanalList((prev) =>
      prev.map((p) => (p._id === itemId ? { ...p, tuluv: 1 } : p))
    );
    notification.success({ message: t("Хүлээж авлаа") });
  };

  const getStatusInfo = (tuluv?: number) => {
    switch (tuluv) {
      case 0:
        return { text: t("Шинэ"), color: "blue" };
      case 1:
        return { text: t("Хүлээж авсан"), color: "green" };
      default:
        return { text: t("Тодорхойгүй"), color: "gray" };
    }
  };

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
          <RangePicker
            placeholder={[t("Эхлэх"), t("Дуусах")]}
            onChange={(dates) => setEkhlekhOgnoo(dates)}
            className="!h-8 !bg-transparent !backdrop-blur-md !border !border-gray-300 !text-black rounded-xl"
          />

          <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3">
            {KhariltsagchiinMedeelel.jagsaalt.map((mur) => {
              const isActive = khariltsagch?._id === mur._id;
              return (
                <motion.div
                  key={mur._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setKhariltsagch(mur)}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-white/25 border border-white/50 shadow-xl"
                      : "bg-white/10 border border-white/20 hover:bg-white/20 hover:shadow-lg"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {mur.ner[0]}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-black text-sm">
                      {mur.ner}
                    </div>
                    <div className="text-xs text-gray-500">{mur.utas}</div>
                  </div>
                </motion.div>
              );
            })}
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
                key="form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="flex flex-col space-y-4 rounded-3xl bg-transparent p-4"
              >
                {sanalGomdolTuukh.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl bg-transparent backdrop-blur-xl p-4 border border-gray-200 shadow-xl flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-black">
                        {item.message}
                      </div>
                      <div className="text-xs text-gray-500">
                        {moment(item.ognoo).format("YYYY-MM-DD")}
                      </div>
                    </div>
                    <Tag
                      color={getStatusInfo(item.tuluv).color}
                      className="!rounded-full !text-xs"
                    >
                      {getStatusInfo(item.tuluv).text}
                    </Tag>
                    {item.tuluv === 0 && (
                      <Button
                        type="link"
                        onClick={() => sanalGomdolAvakh(item._id)}
                        className="text-blue-500"
                      >
                        {t("Хүлээж авах")}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
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
                    📋
                  </motion.div>
                  <div className="font-bold text-2xl text-gray-700 mb-3">
                    {t("Та санал хүсэлт харах харилцагчаа сонгоно уу")}
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
