"use client";

import React, { useState } from "react";
import { Tooltip, Popconfirm, Button, Switch, Input, notification } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  InfoCircleFilled,
} from "@ant-design/icons";

interface DansItem {
  _id: number | string;
  dugaar: string;
  dansniiNer: string;
  valyut: string;
  bank: "khanbank" | "tdb";
  corporateAshiglakhEsekh?: boolean;
  corporateNevtrekhNer?: string;
  corporateNuutsUg?: string;
  corporateGuilgeeniiNuutsUg?: string;
}

interface DansTileProps {
  data: DansItem;
  dansMutate: React.Dispatch<React.SetStateAction<DansItem[]>>;
  zasya: (data: DansItem) => void;
  t: (key: string) => string;
}

function DansTile({ data, dansMutate, zasya, t }: DansTileProps) {
  const removeItem = () => {
    dansMutate((prev) => prev.filter((d) => d._id !== data._id));
  };

  return (
    <div className="flex items-center justify-between bg-transparent rounded-2xl shadow p-4 mb-3 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
        <div>
          <div className="font-medium text-slate-700">{t("Данс")}</div>
          <div className="text-slate-900">{data.dugaar}</div>
        </div>
        <div>
          <div className="font-medium text-slate-700">{t("Дансны нэр")}</div>
          <div className="text-slate-900">{data.dansniiNer}</div>
        </div>
        <div>
          <div className="font-medium text-slate-700">{t("Валют")}</div>
          <div className="text-slate-900">{data.valyut}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Popconfirm
          title={`${data.dugaar} данс устгах уу?`}
          okText={t("Тийм")}
          cancelText={t("Үгүй")}
          onConfirm={removeItem}
        >
          <Tooltip title={t("Устгах")}>
            <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition">
              <DeleteOutlined />
            </div>
          </Tooltip>
        </Popconfirm>

        <Tooltip title={t("Засах")}>
          <div
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition"
            onClick={() => zasya(data)}
          >
            <EditOutlined />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

function Dans() {
  const t = (key: string) => key;
  const [dansList, setDansList] = useState<DansItem[]>([
    {
      _id: 1,
      dugaar: "001",
      dansniiNer: "Тест Данс 1",
      valyut: "MNT",
      bank: "khanbank",
    },
    {
      _id: 2,
      dugaar: "002",
      dansniiNer: "Тест Данс 2",
      valyut: "USD",
      bank: "tdb",
    },
  ]);

  const [khanbankCorporate, setKhanBankCorporate] = useState<Partial<DansItem>>(
    { corporateAshiglakhEsekh: false }
  );
  const [tdbCorporate, setTdbCorporate] = useState<Partial<DansItem>>({
    corporateAshiglakhEsekh: false,
  });
  const [tdbMessage, setTdbMessage] = useState("");
  const [loadingCheck, setLoadingCheck] = useState(false);

  const addOrEditDans = (data?: DansItem) => {
    if (data?._id) {
      setDansList((prev) =>
        prev.map((d) =>
          d._id === data._id
            ? { ...d, dansniiNer: d.dansniiNer + " (зассан)" }
            : d
        )
      );
    } else {
      const newItem: DansItem = {
        _id: Date.now(),
        dugaar: "999",
        dansniiNer: "Шинэ данс",
        valyut: "MNT",
        bank: "khanbank",
      };
      setDansList((prev) => [newItem, ...prev]);
    }
  };

  const saveBank = (bank: "khanbank" | "tdb") => {
    notification.success({ message: t("Амжилттай хадгаллаа") });
  };

  const checkTdbConnection = () => {
    setLoadingCheck(true);
    setTimeout(() => {
      setTdbMessage("Холболт амжилттай");
      setLoadingCheck(false);
    }, 1000);
  };

  const BankCard = ({
    title,
    bankKey,
    corporateState,
    setCorporateState,
  }: {
    title: string;
    bankKey: "khanbank" | "tdb";
    corporateState: Partial<DansItem>;
    setCorporateState: React.Dispatch<React.SetStateAction<Partial<DansItem>>>;
  }) => (
    <div className="bg-transparent rounded-2xl shadow p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={() => addOrEditDans({ bank: bankKey } as DansItem)}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span>{t("Corporate ашиглах эсэх")}</span>
        <Switch
          checked={corporateState.corporateAshiglakhEsekh || false}
          onChange={(v) =>
            setCorporateState({ ...corporateState, corporateAshiglakhEsekh: v })
          }
        />
      </div>

      {bankKey === "tdb" && corporateState.corporateAshiglakhEsekh && (
        <div className="flex flex-col gap-3 mb-4">
          <Input
            placeholder={t("Нэвтрэх нэр")}
            value={corporateState.corporateNevtrekhNer}
            onChange={(e) =>
              setCorporateState({
                ...corporateState,
                corporateNevtrekhNer: e.target.value,
              })
            }
            className="text-theme"
          />
          <Input.Password
            placeholder={t("Нэвтрэх нууц үг")}
            value={corporateState.corporateNuutsUg}
            onChange={(e) =>
              setCorporateState({
                ...corporateState,
                corporateNuutsUg: e.target.value,
              })
            }
            className="text-theme"
          />
          <Button loading={loadingCheck} onClick={checkTdbConnection}>
            {t("Шалгах")}
          </Button>
          {tdbMessage && <div className="text-green-600">{tdbMessage}</div>}
        </div>
      )}

      {dansList
        .filter((d) => d.bank === bankKey)
        .map((d) => (
          <DansTile
            key={d._id}
            data={d}
            dansMutate={setDansList}
            zasya={addOrEditDans}
            t={t}
          />
        ))}

      <div className="flex justify-end mt-4">
        <Button type="primary" onClick={() => saveBank(bankKey)}>
          {t("Хадгалах")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-6">
        <BankCard
          title={t("Хаан банк")}
          bankKey="khanbank"
          corporateState={khanbankCorporate}
          setCorporateState={setKhanBankCorporate}
        />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <BankCard
          title={t("Худалдаа хөгжлийн банк")}
          bankKey="tdb"
          corporateState={tdbCorporate}
          setCorporateState={setTdbCorporate}
        />
      </div>
    </div>
  );
}

export default Dans;
