"use client";

import React, { useState, useMemo } from "react";
import {
  Tag,
  Input,
  notification,
  Popconfirm,
  DatePicker,
  Card,
  Select,
} from "antd";
import moment from "moment";
import type { Dayjs } from "dayjs";
import { motion, AnimatePresence } from "framer-motion";

const { RangePicker } = DatePicker;
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

const formatNumber = (
  num: number | undefined | null,
  decimals: number = 0
): string => {
  if (num === undefined || num === null) return "0";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export default function TaskManagementSystem() {
  const [tuluv, setTuluv] = useState<string>("Идэвхтэй");
  const [duudlaga, setDuudlaga] = useState<DuudlagaItem | null>(null);
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<[Dayjs, Dayjs] | null>(null);
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
    notification.success({
      message: "Амжилттай",
      description: "Төлөв амжилттай шинэчлэгдлээ",
    });
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
      const searchMatch = searchTerm
        ? [
            item.khariltsagchiinNer,
            item.khariltsagchiinRegister,
            item.khariltsagchiinUtas,
            item.title,
            item.message,
          ].some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const dateMatch = ekhlekhOgnoo
        ? moment(item.createdAt).isBetween(
            moment(ekhlekhOgnoo[0].toDate()),
            moment(ekhlekhOgnoo[1].toDate()),
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
        <div
          key={group._id}
          className="mb-3 rounded-xl bg-transparent p-4 shadow-sm hover:shadow-md transition-all"
        >
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              setDuudlaga(group);
              if (hasMultiple) toggleNameExpansion(group.khariltsagchiinNer);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-l from-[#f5dcc8] to-[#c7bfee] text-white font-bold text-lg">
                {group.khariltsagchiinNer?.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{group.khariltsagchiinNer}</div>
                <div className="text-xs text-gray-500">
                  {group.khariltsagchiinRegister}
                </div>
              </div>
            </div>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </div>

          {hasMultiple && isExpanded && (
            <div className="mt-2 ml-6 space-y-2">
              {group.allDuudlaga
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((item) => (
                  <div
                    key={item._id}
                    className="p-2 rounded-lg hover:bg-white transition-all cursor-pointer border-l-2"
                    onClick={() => setDuudlaga(item)}
                  >
                    <Tag color={getStatusInfo(item.tuluv).color}>
                      {getStatusInfo(item.tuluv).text}
                    </Tag>
                    {item.title && <span className="ml-2">{item.title}</span>}
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    });
  };

  const renderRightPanel = () => {
    if (!duudlaga)
      return (
        <div className="flex h-full items-center justify-center rounded-2xl bg-gradient-to-tr from-card-50 to-card-100 p-8">
          <div className="text-center">
            <div className="font-medium text-lg">Өдрийн мэнд</div>
            <div className="mt-2 text-gray-500">
              Та харилцагч сонгож дэлгэрэнгүй мэдээлэл үзнэ үү.
            </div>
          </div>
        </div>
      );

    const khariltsagchDuudlaga = filteredJagsaalt
      .filter((i) => i.khariltsagchiinNer === duudlaga.khariltsagchiinNer)
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );

    return (
      <div className="flex h-full flex-col rounded-2xl bg-transparent p-5 shadow-lg space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-[#f5dcc8] to-[#c7bfee] p-4">
          <div className="font-semibold text-lg">
            Нэр: {duudlaga.khariltsagchiinNer}
          </div>
          <div className="text-sm text-gray-600">
            Нийт дуудлага: {khariltsagchDuudlaga.length}
          </div>
          <div className="text-sm text-gray-600">
            Утас: {duudlaga.khariltsagchiinUtas}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {khariltsagchDuudlaga.map((item) => (
            <div
              key={item._id}
              className={`p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                item._id === duudlaga._id
                  ? "border-green-500 bg-green-50"
                  : "border-amber-200"
              }`}
              onClick={() => setDuudlaga(item)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <Tag color={getStatusInfo(item.tuluv).color}>
                    {getStatusInfo(item.tuluv).text}
                  </Tag>
                  {item.duudlagiinTurul && (
                    <Tag color="processing" className="ml-2">
                      {item.duudlagiinTurul}
                    </Tag>
                  )}
                  {item.title && (
                    <div className="mt-2 font-medium text-gray-900">
                      {item.title}
                    </div>
                  )}
                  {item.message && (
                    <div className="text-sm text-gray-600">{item.message}</div>
                  )}
                  {item.tailbar && (
                    <div className="mt-2 p-2 bg-red-50 rounded-md text-red-600 text-xs">
                      {item.tailbar}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-gray-500">
                  {moment(item.createdAt).format("MM-DD HH:mm")}
                </div>
              </div>

              {item.tuluv === 0 && (
                <div className="mt-2 flex gap-2">
                  <Popconfirm
                    title="Дуудлагыг дуусгах уу?"
                    okText="Тийм"
                    cancelText="Үгүй"
                    onConfirm={() => updateTaskStatus(item._id, 1)}
                  >
                    <div className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs cursor-pointer hover:bg-blue-600">
                      Дуусгах
                    </div>
                  </Popconfirm>
                  <div
                    className="px-3 py-1 rounded-full bg-red-500 text-white text-xs cursor-pointer hover:bg-red-600"
                    onClick={() => {
                      const reason = prompt("Цуцлах шалтгааныг бичнэ үү:");
                      if (reason) updateTaskStatus(item._id, -1, reason);
                    }}
                  >
                    Цуцлах
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-gray-900">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-4 "
      >
        Дуудлага
      </motion.h1>

      <div className="flex h-[calc(100vh-4rem)] gap-4 bg-transparent">
        <div className="flex w-1/3 flex-col space-y-4 bg-transparent rounded-2xl p-4 shadow-lg">
          <Card className="!bg-transparent !shadow-none !border-none">
            <div className="grid grid-cols-3 gap-3 bg-transparent">
              {khyanaltiinDun.map((mur, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-3xl cursor-pointer text-center transition-all ${
                    mur.status === tuluv
                      ? "bg-[#f9f7f3] border-2 border-[#a89dd9] shadow-md"
                      : "border-2 border-[#b8aee3] hover:border-[#9b8fd5]"
                  }`}
                  onClick={mur.onClick}
                >
                  <div className="text-2xl font-bold text-[#a89dd9]">
                    {mur.too}
                  </div>
                  <div className="text-sm text-gray-500">{mur.utga}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 mt-2 bg-transparent">
            <RangePicker
              placeholder={["Эхлэх огноо", "Дуусах огноо"]}
              onChange={(dates) =>
                setEkhlekhOgnoo(dates as [Dayjs, Dayjs] | null)
              }
              value={ekhlekhOgnoo}
            />
            <Select
              placeholder="Төрөл сонгох"
              value={turulFilter}
              onChange={setTurulFilter}
              className="!bg-transparent !text-white"
            >
              <Option value="Бүгд">Бүгд</Option>
              <Option value="Сантехник">Сантехник</Option>
              <Option value="Цахилгаан">Цахилгаан</Option>
              <Option value="Ус">Ус</Option>
            </Select>
          </div>

          <Input
            placeholder="Хайх /Нэр, Регистр, Утас/"
            onChange={({ target }) => setSearchTerm(target.value)}
            className="!bg-transparent !text-white"
          />

          <div className="flex-1 overflow-y-auto">
            {filteredJagsaalt.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-gray-500">
                Өгөгдөл олдсонгүй
              </div>
            ) : (
              renderCallList()
            )}
          </div>
        </div>

        <div className="flex-1 bg-transparent">{renderRightPanel()}</div>
      </div>
    </div>
  );
}
