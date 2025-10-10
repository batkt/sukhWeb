"use client";

import React, { useMemo, useState } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { Button, DatePicker, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import locale from "antd/lib/date-picker/locale/mn_MN";
import { t } from "i18next";

const formatNumber = (num: number) => num.toLocaleString();

interface BackItem {
  _id: number;
  ognoo: string | Date;
  ajiltniiNer: string;
  khemjee: number;
}

interface BaazProps {
  token?: string;
}

function Baaz({ token }: BaazProps) {
  const [loading, setLoading] = useState(false);
  const [ognoo, setOgnoo] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const backAwsanTuukh = {
    jagsaalt: [
      { _id: 1, ognoo: new Date(), ajiltniiNer: "Бат", khemjee: 120 },
      { _id: 2, ognoo: new Date(), ajiltniiNer: "Сара", khemjee: 340 },
    ],
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 10,
    niit: 2,
  };

  const columns: ColumnsType<BackItem> = useMemo(
    () => [
      {
        title: "№",
        width: 60,
        align: "center",
        render: (_, __, index) => (
          <div className="bg-transparent">
            {(backAwsanTuukh.khuudasniiDugaar - 1) *
              backAwsanTuukh.khuudasniiKhemjee +
              index +
              1}
          </div>
        ),
      },
      {
        title: t("Огноо"),
        dataIndex: "ognoo",
        align: "center",
        render: (value: string | Date) => (
          <div className="bg-transparent">
            {value ? new Date(value).toLocaleString() : ""}
          </div>
        ),
      },
      {
        title: t("Ажилтан"),
        dataIndex: "ajiltniiNer",
        align: "center",
        render: (value: string) => <div className="transparent">{value}</div>,
      },
      {
        title: t("Хэмжээ"),
        dataIndex: "khemjee",
        align: "center",
        render: (value: number) => (
          <div className="transparent">
            <span className="font-medium text-blue-600">
              {formatNumber(value)} MB
            </span>
          </div>
        ),
      },
    ],
    [backAwsanTuukh]
  );

  function backTatya() {
    setLoading(true);

    setTimeout(() => {
      const blob = new Blob(["Mock backup content"], {
        type: "application/rar",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.rar`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="grid grid-cols-12 gap-6 mt-6 ">
      <div className="col-span-12 lg:col-span-5 xl:col-span-4">
        <div className="bg-transparent   shadow-md rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200   flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("Мэдээллийн сан")}</h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <div className="text-gray-700   font-medium">
                {t("Системийн өгөгдөл")}
              </div>
              <p className="text-sm text-gray-500">
                {t("Сүүлд шинэчилсэн")} {new Date().toLocaleDateString()}
              </p>
            </div>
            <Button
              type="primary"
              loading={loading}
              icon={<DownloadOutlined />}
              onClick={backTatya}
            >
              {t("Татах")}
            </Button>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7 xl:col-span-8">
        <div className="bg-transparent   shadow-md rounded-xl overflow-hidden">
          <div className="px-6   border-amber-200   flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("Татсан түүх")}</h2>
            <DatePicker.RangePicker
              locale={locale}
              value={ognoo}
              onChange={(dates) => setOgnoo(dates)}
              className="w-full md:w-auto bg-transparent"
            />
          </div>
          <div className="p-6 ">
            <div className="p-6 bg-transparent">
              <Table
                bordered={false}
                size="middle"
                dataSource={backAwsanTuukh.jagsaalt}
                columns={columns}
                rowKey="_id"
                pagination={{
                  current: backAwsanTuukh.khuudasniiDugaar,
                  pageSize: backAwsanTuukh.khuudasniiKhemjee,
                  total: backAwsanTuukh.niit,
                  showSizeChanger: true,
                }}
                rowClassName={() => "bg-black"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Baaz;
