"use client";

import React, { useState } from "react";
import { Button, Popconfirm, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import formatNumber from "../../../tools/function/formatNumber";

interface ZardalItem {
  _id: number;
  ner: string;
  turul: string;
  tariff: number;
  tseverUsDun?: number;
  bokhirUsDun?: number;
  usKhalaasniiDun?: number;
}

export default function AshiglaltiinZardal() {
  // === Mock front-end only data ===
  const [khuvisakhZardal, setKhuvisakhZardal] = useState<ZardalItem[]>(
    Array.from({ length: 8 }).map((_, i) => ({
      _id: i,
      ner: i % 2 === 0 ? "Хүйтэн ус" : "Цахилгаан",
      turul: i % 2 === 0 ? "Ус" : "Тогтмол",
      tariff: (i + 1) * 1000,
      tseverUsDun: (i + 1) * 10,
      bokhirUsDun: (i + 1) * 5,
      usKhalaasniiDun: (i + 1) * 3,
    }))
  );

  const [togtmolZardal, setTogtmolZardal] = useState<ZardalItem[]>(
    Array.from({ length: 5 }).map((_, i) => ({
      _id: i + 100,
      ner: "Цэвэрлэгээ",
      turul: "Тогтмол",
      tariff: (i + 1) * 2000,
    }))
  );

  const addZardal = (togtmol = false) => {
    const newItem: ZardalItem = {
      _id: Date.now(),
      ner: togtmol ? "Шинэ тогтмол зардал" : "Шинэ хувьсах зардал",
      turul: togtmol ? "Тогтмол" : "Хувьсах",
      tariff: 1000,
      tseverUsDun: 0,
      bokhirUsDun: 0,
      usKhalaasniiDun: 0,
    };
    if (togtmol) setTogtmolZardal((prev) => [newItem, ...prev]);
    else setKhuvisakhZardal((prev) => [newItem, ...prev]);
  };

  const editZardal = (item: ZardalItem, togmtol = false) => {
    alert(`Edit: ${item.ner} (${togmtol ? "Тогтмол" : "Хувьсах"})`);
  };

  const deleteZardal = (item: ZardalItem, togmtol = false) => {
    if (togmtol)
      setTogtmolZardal((prev) => prev.filter((x) => x._id !== item._id));
    else setKhuvisakhZardal((prev) => prev.filter((x) => x._id !== item._id));
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="xxl:col-span-4 col-span-12 lg:col-span-6">
        <div className="box max-h-[80vh] overflow-y-scroll">
          <div className="flex items-center border-b border-amber-200 px-5 pb-2 pt-5">
            <h2 className="mr-auto text-base font-medium">Хувьсах зардал</h2>
            <div
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-green-500 p-2 text-white"
              onClick={() => addZardal(false)}
            >
              <Tooltip title="Нэмэх">
                <PlusOutlined />
              </Tooltip>
            </div>
          </div>
          {khuvisakhZardal.map((mur) => (
            <div key={mur._id} className="box">
              <div className="flex items-center p-5">
                <div className="border-l-2 border-green-500 pl-4">
                  <div className="font-medium">{mur.ner}</div>
                  <div className="text-gray-600">{mur.turul}</div>
                </div>
                <div className="ml-auto">
                  {(mur.ner?.includes("Хүйтэн ус") ||
                  mur.ner?.includes("Халуун ус")
                    ? `Цэвэр ус: ${formatNumber(mur.tseverUsDun!, 2)} `
                    : formatNumber(mur.tariff, 2)) +
                    (mur.ner?.includes("Хүйтэн ус") ||
                    mur.ner?.includes("Халуун ус")
                      ? `Бохир ус: ${formatNumber(mur.bokhirUsDun!, 2)} `
                      : "") +
                    (mur.ner?.includes("Халуун ус")
                      ? `Ус халаасны: ${formatNumber(mur.usKhalaasniiDun!, 2)}`
                      : "")}
                </div>
                <div className="ml-5 flex space-x-2">
                  <Popconfirm
                    title={`Зардал устгах уу? (${mur.ner})`}
                    okText="Тийм"
                    cancelText="Үгүй"
                    onConfirm={() => deleteZardal(mur, false)}
                  >
                    <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-500 p-2 text-white">
                      <Tooltip title="Устгах">
                        <DeleteOutlined />
                      </Tooltip>
                    </div>
                  </Popconfirm>
                  <div
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-yellow-500 p-2 text-white"
                    onClick={() => editZardal(mur, false)}
                  >
                    <Tooltip title="Засах">
                      <EditOutlined />
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="xxl:col-span-4 col-span-12 lg:col-span-6">
        <div className="box max-h-[80vh] overflow-y-scroll">
          <div className="flex items-center border-b border-amber-200 px-5 pb-2 pt-5">
            <h2 className="mr-auto text-base font-medium">Тогтмол зардал</h2>
            <div
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-green-500 p-2 text-white"
              onClick={() => addZardal(true)}
            >
              <Tooltip title="Нэмэх">
                <PlusOutlined />
              </Tooltip>
            </div>
          </div>
          {togtmolZardal.map((mur) => (
            <div key={mur._id} className="box">
              <div className="flex items-center p-5">
                <div className="border-l-2 border-green-500 pl-4">
                  <div className="font-medium">{mur.ner}</div>
                  <div className="text-gray-600">{mur.turul}</div>
                </div>
                <div className="ml-auto">{formatNumber(mur.tariff, 2)}</div>
                <div className="ml-5 flex space-x-2">
                  <Popconfirm
                    title={`Зардал устгах уу? (${mur.ner})`}
                    okText="Тийм"
                    cancelText="Үгүй"
                    onConfirm={() => deleteZardal(mur, true)}
                  >
                    <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-500 p-2 text-white">
                      <Tooltip title="Устгах">
                        <DeleteOutlined />
                      </Tooltip>
                    </div>
                  </Popconfirm>
                  <div
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-yellow-500 p-2 text-white"
                    onClick={() => editZardal(mur, true)}
                  >
                    <Tooltip title="Засах">
                      <EditOutlined />
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
