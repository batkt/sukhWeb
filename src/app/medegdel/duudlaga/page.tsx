"use client";

import React, { useState, useMemo } from "react";
import matchesSearch from "../../../tools/function/matchesSearch";
import { Tag, Input, Popconfirm, Card, Select } from "antd";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import formatNumber from "../../../../tools/function/formatNumber";

const { Option } = Select;

interface DuudlagaItem {
  _id: string;
  khariltsagchiinNer: string;
  khariltsagchiinRegister: string;
  khariltsagchiinUtas: string;
  duudlagiinTurul: string;
  title: string;
  message: string;
  khariltsagchiinToot: string;
  tuluv: number;
  createdAt: Date;
  updatedAt: Date;
  tailbar: string | null;
  updatedBy: string | null;
}

interface GroupedDuudlaga extends DuudlagaItem {
  duudlagaCount: number;
  allDuudlaga: DuudlagaItem[];
}

type StatusInfo = {
  text: string;
  color: string;
};

const MOCK_CALLS: DuudlagaItem[] = [
  {
    _id: "1",
    khariltsagchiinNer: "Буянаа",
    khariltsagchiinRegister: "УБ12345678",
    khariltsagchiinToot: "101",
    khariltsagchiinUtas: "99001122",
    duudlagiinTurul: "Сантехник",
    title: "Усны хоолой гоожсон",
    message: "Гал тогооны усны хоолой гоожсон байна. Help ASAP.",
    tuluv: 0,
    createdAt: new Date("2025-10-08T09:30:00"),
    updatedAt: new Date("2025-10-08T09:30:00"),
    tailbar: null,
    updatedBy: null,
  },
  {
    _id: "2",
    khariltsagchiinNer: "Нинжин",
    khariltsagchiinRegister: "УА98765432",
    khariltsagchiinToot: "201",
    khariltsagchiinUtas: "88112233",
    duudlagiinTurul: "Цахилгаан",
    title: "Гэрэл асахгүй байна",
    message: "huye gerel asdgue bro.",
    tuluv: 1,
    createdAt: new Date("2025-10-07T14:20:00"),
    updatedAt: new Date("2025-10-08T10:15:00"),
    tailbar: null,
    updatedBy: "Дорж",
  },
  {
    _id: "3",
    khariltsagchiinNer: "Сайхнаа",
    khariltsagchiinRegister: "УТ11223344",
    khariltsagchiinToot: "301",
    khariltsagchiinUtas: "99887766",
    duudlagiinTurul: "Ус",
    title: "Усны даралт сул",
    message: "us has belgin sulralt.",
    tuluv: 0,
    createdAt: new Date("2025-10-08T08:15:00"),
    updatedAt: new Date("2025-10-08T08:15:00"),
    tailbar: null,
    updatedBy: null,
  },
  {
    _id: "4",
    khariltsagchiinNer: "Самбуу",
    khariltsagchiinRegister: "УБ12345678",
    khariltsagchiinToot: "111",
    khariltsagchiinUtas: "99001122",
    duudlagiinTurul: "Цахилгаан",
    title: "Залгуур эвдэрсэн",
    message: "zalguur fucked up.",
    tuluv: -1,
    createdAt: new Date("2025-10-06T16:45:00"),
    updatedAt: new Date("2025-10-07T09:20:00"),
    tailbar: "Харилцагч өөрөө засчихсан",
    updatedBy: "Ганбат",
  },
  {
    _id: "5",
    khariltsagchiinNer: "Согтуунаа",
    khariltsagchiinRegister: "УВ55667788",
    khariltsagchiinToot: "40",
    khariltsagchiinUtas: "77665544",
    duudlagiinTurul: "Сантехник",
    title: "Ариун цэврийн өрөө",
    message: "00 iin tsaas duuschlaa.",
    tuluv: 0,
    createdAt: new Date("2025-10-08T11:00:00"),
    updatedAt: new Date("2025-10-08T11:00:00"),
    tailbar: null,
    updatedBy: null,
  },
];

const getStatusInfo = (tuluv: number): StatusInfo => {
  switch (tuluv) {
    case 0:
      return { text: "Идэвхтэй", color: "blue" };
    case 1:
      return { text: "Дууссан", color: "green" };
    case -1:
      return { text: "Цуцлагдсан", color: "red" };
    default:
      return { text: "Тодорхойгүй", color: "gray" };
  }
};

export default function TaskManagementSystem() {
  const [tuluv, setTuluv] = useState<string>("Идэвхтэй");
  const [duudlaga, setDuudlaga] = useState<DuudlagaItem | null>(null);
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<
    [Date | null, Date | null] | null
  >([new Date(), new Date()]);
  const [turulFilter, setTurulFilter] = useState<string>("Бүгд");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());
  const [mockData, setMockData] = useState<DuudlagaItem[]>(MOCK_CALLS);

  const toggleNameExpansion = (name: string) => {
    setExpandedNames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) newSet.delete(name);
      else newSet.add(name);
      return newSet;
    });
  };

  const groupDuudlagaByName = (jagsaalt: DuudlagaItem[]): GroupedDuudlaga[] => {
    if (!jagsaalt) return [];
    const grouped = jagsaalt.reduce(
      (acc: Record<string, GroupedDuudlaga>, mur: DuudlagaItem) => {
        const key = mur.khariltsagchiinNer;
        if (!acc[key])
          acc[key] = { ...mur, duudlagaCount: 1, allDuudlaga: [mur] };
        else {
          acc[key].duudlagaCount += 1;
          acc[key].allDuudlaga.push(mur);
        }
        return acc;
      },
      {}
    );
    return Object.values(grouped);
  };

  const updateTaskStatus = (
    taskId: string,
    newStatus: number,
    reason: string | null = null
  ) => {
    setMockData((prev) =>
      prev.map((task) =>
        task._id === taskId
          ? {
              ...task,
              tuluv: newStatus,
              updatedAt: new Date(),
              ...(reason && { tailbar: reason }),
              updatedBy: "Таны нэр",
            }
          : task
      )
    );
    openSuccessOverlay("Төлөв амжилттай шинэчлэгдлээ");
    if (duudlaga?._id === taskId)
      setDuudlaga((prev) => (prev ? { ...prev, tuluv: newStatus } : null));
  };

  const filteredJagsaalt = useMemo(() => {
    return mockData.filter((item) => {
      let statusMatch =
        tuluv === "Идэвхтэй"
          ? item.tuluv === 0
          : tuluv === "Дууссан"
          ? item.tuluv === 1
          : tuluv === "Цуцлагдсан"
          ? item.tuluv === -1
          : true;
      const typeMatch =
        turulFilter === "Бүгд" ||
        item.duudlagiinTurul?.toLowerCase() === turulFilter.toLowerCase();
      const searchMatch = matchesSearch(item, searchTerm);
      const dateMatch =
        ekhlekhOgnoo && ekhlekhOgnoo[0] && ekhlekhOgnoo[1]
          ? moment(item.createdAt).isBetween(
              moment(ekhlekhOgnoo[0]),
              moment(ekhlekhOgnoo[1]),
              "day",
              "[]"
            )
          : true;
      return statusMatch && typeMatch && searchMatch && dateMatch;
    });
  }, [mockData, tuluv, turulFilter, searchTerm, ekhlekhOgnoo]);

  const khyanaltiinDun = useMemo(() => {
    const activeCount = mockData.filter((i) => i.tuluv === 0).length || 0;
    const completedCount = mockData.filter((i) => i.tuluv === 1).length || 0;
    const cancelledCount = mockData.filter((i) => i.tuluv === -1).length || 0;
    return [
      {
        too: formatNumber(activeCount),
        utga: "Идэвхтэй",
        status: "Идэвхтэй",
        onClick: () => setTuluv("Идэвхтэй"),
      },
      {
        too: formatNumber(completedCount),
        utga: "Дууссан",
        status: "Дууссан",
        onClick: () => setTuluv("Дууссан"),
      },
      {
        too: formatNumber(cancelledCount),
        utga: "Цуцлагдсан",
        status: "Цуцлагдсан",
        onClick: () => setTuluv("Цуцлагдсан"),
      },
    ];
  }, [mockData]);

  const renderCallList = () => {
    const grouped = groupDuudlagaByName(filteredJagsaalt);
    return grouped.map((group) => {
      const statusInfo = getStatusInfo(group.tuluv);
      const isExpanded = expandedNames.has(group.khariltsagchiinNer);
      const hasMultiple = group.duudlagaCount > 1;

      return (
        <motion.div
          key={group._id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <div
            className={`group relative overflow-hidden rounded-2xl bg-transparent backdrop-blur-xl  p-3 hover:shadow-lg transition-all duration-300 cursor-pointer`}
            onClick={() => {
              setDuudlaga(group);
              if (hasMultiple) toggleNameExpansion(group.khariltsagchiinNer);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 text-white  text-lg shadow-md">
                    {group.khariltsagchiinNer?.charAt(0)}
                  </div>
                  {hasMultiple && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px]  shadow-sm">
                      {group.duudlagaCount}
                    </div>
                  )}
                </div>
                <div>
                  <div className=" text-slate-900 text-sm">
                    {group.khariltsagchiinNer}
                  </div>
                  <div className="text-xs text-slate-500">
                    {group.khariltsagchiinRegister}
                  </div>
                </div>
              </div>
              <Tag
                color={statusInfo.color}
                className="!rounded-full !px-2 !py-0.5 !border-0 !text-xs shadow-sm"
              >
                {statusInfo.text}
              </Tag>
            </div>
          </div>

          <AnimatePresence>
            {hasMultiple && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 ml-4 space-y-1 overflow-hidden"
              >
                {group.allDuudlaga
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-2 rounded-xl bg-transparent backdrop-blur-lg border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuudlaga(item);
                      }}
                    >
                      <Tag
                        color={getStatusInfo(item.tuluv).color}
                        className="!rounded-full !px-2 !py-0.5 !text-[10px]"
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
    });
  };

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl  mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        Дуудлага
      </motion.h1>

      <div className="flex h-[calc(100vh-10rem)] gap-6 bg-transparent">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex w-1/3 flex-col space-y-4 bg-transparent"
        >
          <Card className="!bg-transparent !border-none">
            <div className="grid grid-cols-3 gap-3 bg-transparent">
              {khyanaltiinDun.map((mur, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-2xl cursor-pointer text-center transition-all duration-300 bg-transparent border ${
                    mur.status === tuluv
                      ? "border-gray-300 shadow-xl"
                      : "border-gray-200 hover:bg-transparent hover:shadow-lg"
                  }`}
                  onClick={mur.onClick}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1, type: "spring" }}
                    className="text-3xl  text-slate-900 mb-1 bg-transparent"
                  >
                    {mur.too}
                  </motion.div>
                  <div className="text-xs text-slate-900  bg-transparent">
                    {mur.utga}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 bg-transparent">
            <StandardDatePicker
              isRange={true}
              placeholder={"Огноо"}
              onChange={(dates) =>
                setEkhlekhOgnoo(
                  (dates || [null, null]) as [Date | null, Date | null]
                )
              }
              value={ekhlekhOgnoo ?? undefined}
              className="!h-8 !bg-transparent !backdrop-blur-md !border !border-gray-300 !text-slate-900"
              locale="mn"
            />
            <Select
              popupClassName="tusgaiZagvar"
              placeholder="Төрөл"
              value={turulFilter}
              onChange={setTurulFilter}
              className="!h-8 !bg-transparent !backdrop-blur-md  !text-slate-900"
            >
              <Option value="Бүгд">Бүгд</Option>
              <Option value="Сантехник">Сантехник</Option>
              <Option value="Цахилгаан">Цахилгаан</Option>
              <Option value="Ус">Ус</Option>
            </Select>
          </div>

          <Input
            placeholder="Хайх..."
            onChange={({ target }) => setSearchTerm(target.value)}
            className="!h-10 !text-base !bg-transparent !backdrop-blur-md  !text-slate-900 placeholder:text-slate-500"
          />

          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            {filteredJagsaalt.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center p-8 rounded-2xl bg-transparent backdrop-blur-xl border border-gray-200">
                  <div className="text-slate-900 text-lg">
                    Өгөгдөл олдсонгүй
                  </div>
                </div>
              </motion.div>
            ) : (
              renderCallList()
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          {duudlaga ? (
            <div className="flex h-full flex-col space-y-4 rounded-3xl bg-transparent p-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-transparent backdrop-blur-xl p-6 border border-gray-200 shadow-xl"
              >
                <div className=" text-2xl text-slate-900 mb-2">
                  {duudlaga.khariltsagchiinNer}
                </div>
                <div className="flex gap-4 text-slate-900">
                  <span className="flex items-center gap-2">
                    {duudlaga.khariltsagchiinUtas}
                  </span>
                  <span className="flex items-center gap-2">
                    {
                      filteredJagsaalt.filter(
                        (i) =>
                          i.khariltsagchiinNer === duudlaga.khariltsagchiinNer
                      ).length
                    }{" "}
                    дуудлага
                  </span>
                </div>
              </motion.div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredJagsaalt
                  .filter(
                    (i) => i.khariltsagchiinNer === duudlaga.khariltsagchiinNer
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt || b.createdAt).getTime() -
                      new Date(a.updatedAt || a.createdAt).getTime()
                  )
                  .map((item, idx) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      whileHover={{ scale: 1.01 }}
                      className={`p-3 rounded-xl transition-all cursor-pointer ${
                        item._id === duudlaga._id
                          ? "bg-white/25 border border-white/50 shadow-md"
                          : "bg-white/10 border border-white/20 hover:bg-white/15"
                      } backdrop-blur-lg`}
                      onClick={() => setDuudlaga(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-1 flex-wrap">
                          <Tag
                            color={getStatusInfo(item.tuluv).color}
                            className="!rounded-full !px-2 !py-0.5 !border-0 text-xs"
                          >
                            {getStatusInfo(item.tuluv).text}
                          </Tag>
                          {item.duudlagiinTurul && (
                            <Tag
                              color="processing"
                              className="!rounded-full !px-2 !py-0.5 !border-0 text-xs"
                            >
                              {item.duudlagiinTurul}
                            </Tag>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                          {moment(item.createdAt).format("MM-DD HH:mm")}
                        </div>
                      </div>

                      {item.title && (
                        <div className=" text-slate-700 text-sm mb-1">
                          {item.title}
                        </div>
                      )}
                      {item.message && (
                        <div className="text-xs text-slate-500 leading-relaxed">
                          {item.message}
                        </div>
                      )}
                      {item.tailbar && (
                        <div className="mt-2 p-2 bg-red-500/20 backdrop-blur-sm rounded-2xl text-red-200 text-xs border border-red-400/30">
                          {item.tailbar}
                        </div>
                      )}

                      {item.tuluv === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="mt-3 flex gap-2"
                        >
                          <Popconfirm
                            title="Дуудлагыг дуусгах уу?"
                            okText="Тийм"
                            cancelText="Үгүй"
                            onConfirm={() => updateTaskStatus(item._id, 1)}
                          >
                            <motion.div
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs  cursor-pointer text-center"
                            >
                              ✓ Дуусгах
                            </motion.div>
                          </Popconfirm>
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-red-400 to-rose-500 text-white text-xs  cursor-pointer text-center"
                            onClick={() => {
                              const reason = prompt(
                                "Цуцлах шалтгааныг бичнэ үү:"
                              );
                              if (reason)
                                updateTaskStatus(item._id, -1, reason);
                            }}
                          >
                            ✕ Цуцлах
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex h-full items-center justify-center rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl"
            >
              <div className="text-center">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-8xl mb-6"
                >
                  👋
                </motion.div>
                <div className=" text-3xl text-slate-700 mb-3">
                  Өдрийн мэнд
                </div>
                <div className="text-lg text-slate-500 max-w-md">
                  Та харилцагч сонгож дэлгэрэнгүй мэдээлэл үзнэ үү
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
