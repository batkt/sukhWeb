"use client";

import React, { useEffect, useState } from "react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { notification, Tag } from "antd";
import Aos from "aos";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// Mantine DatePickerInput is used instead of AntD RangePicker

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
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<
    [string | null, string | null] | undefined
  >(undefined);
  const [khariltsagch, setKhariltsagch] = useState<Khariltsagch | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [showAcceptedBadge, setShowAcceptedBadge] = useState(false);

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
    Aos.init({ duration: 900, once: true });
  }, []);

  function turulSongokh(status: TurulType) {
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

  function getStatusInfo(tuluv?: number) {
    switch (tuluv) {
      case 0:
        return { text: t("Шинэ"), color: "blue" };
      case 1:
        return { text: t("Хүлээж авсан"), color: "green" };
      default:
        return { text: t("Тодорхойгүй"), color: "gray" };
    }
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
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        {t("Санал хүсэлт")}
      </motion.h1>

      <div className="flex h-[calc(100vh-10rem)] gap-6 bg-transparent">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex w-1/3 flex-col space-y-3 bg-transparent"
        >
          <DatePickerInput
            type="range"
            locale="mn"
            valueFormat="YYYY-MM-DD"
            placeholder={`${t("Эхлэх")} – ${t("Дуусах")}`}
            value={ekhlekhOgnoo}
            onChange={(dates) =>
              setEkhlekhOgnoo(
                (dates || [null, null]) as [string | null, string | null]
              )
            }
            className="!h-8 !bg-transparent !backdrop-blur-md !border !border-gray-300 !text-slate-900 rounded-xl"
          />

          <div className="grid grid-cols-2 gap-2">
            {[
              { ner: t("Санал"), utga: "sanal" as TurulType },
              { ner: t("Гомдол"), utga: "gomdol" as TurulType },
            ].map((status, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => turulSongokh(status.utga)}
                className={`mt-4 p-2 text-center rounded-xl cursor-pointer transition-all duration-200 border backdrop-blur-lg text-sm font-semibold ${
                  turul === status.utga
                    ? "border-violet-300 bg-white/20 shadow-md"
                    : "border-gray-200 bg-transparent hover:shadow-lg"
                }`}
              >
                {status.ner}
              </motion.div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 mt-2 space-y-2">
            {KhariltsagchiinMedeelel.jagsaalt.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4 rounded-2xl bg-transparent backdrop-blur-xl border border-gray-200 text-slate-600">
                  {t("Өгөгдөл олдсонгүй")}
                </div>
              </div>
            ) : (
              KhariltsagchiinMedeelel.jagsaalt.map((mur) => {
                const hasMultiple =
                  mur.allFeedbacks && mur.allFeedbacks.length > 1;
                const isExpanded = expandedName === mur.ner;

                return (
                  <motion.div
                    key={mur._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2"
                  >
                    <div
                      className="group relative overflow-hidden rounded-2xl bg-transparent backdrop-blur-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        setKhariltsagch(mur);
                        if (hasMultiple) setExpandedName(mur.ner);
                      }}
                    >
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {mur.ner.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {mur.ner}
                            </div>
                            <div className="text-xs text-slate-500">
                              {mur.utas}
                            </div>
                          </div>
                        </div>
                        <Tag
                          color={getStatusInfo(mur.tuluv).color}
                          className="!rounded-full !px-2 !py-0.5 !border-0 !shadow-sm text-xs"
                        >
                          {getStatusInfo(mur.tuluv).text}
                        </Tag>
                      </div>
                    </div>

                    <AnimatePresence>
                      {hasMultiple && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 ml-5 space-y-1 overflow-hidden"
                        >
                          {mur
                            .allFeedbacks!.sort(
                              (a, b) =>
                                new Date(b.createdAt || "").getTime() -
                                new Date(a.createdAt || "").getTime()
                            )
                            .map((item) => (
                              <motion.div
                                key={item._id}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-2 rounded-xl bg-transparent backdrop-blur-lg border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKhariltsagch({
                                    _id: item._id,
                                    ner: item.title || "",
                                    utas: "",
                                    register: "",
                                  });
                                }}
                              >
                                <Tag
                                  color={getStatusInfo(item.tuluv).color}
                                  className="!rounded-full !text-[10px]"
                                >
                                  {getStatusInfo(item.tuluv).text}
                                </Tag>
                                {item.title && (
                                  <span className="ml-1 text-slate-900 text-xs">
                                    {item.title}
                                  </span>
                                )}
                              </motion.div>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Right Panel */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-transparent backdrop-blur-md p-4 shadow-lg"
        >
          {khariltsagch ? (
            <div>
              <h2 className="font-bold text-xl mb-4">{khariltsagch.ner}</h2>
              <div className="space-y-2">
                {sanalGomdolTuukh.map((item) => (
                  <div key={item._id} className="p-2 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span>{item.message}</span>
                      {item.tuluv === 0 && (
                        <button
                          className="text-blue-500 hover:underline text-sm"
                          onClick={() => sanalGomdolAvakh(item._id)}
                        >
                          {t("Хүлээж авах")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-slate-500">{t("Санал хүсэлт сонгоно уу")}</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
