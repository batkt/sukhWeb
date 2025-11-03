"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, Button, Select } from "antd";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { EyeOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

// Mantine DatePickerInput replaces AntD RangePicker

const t = (text: string) => text;

const Admin: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => (
  <div>
    {title && (
      <h1
        className="text-lg font-semibold mb-4 pb-7 text-theme border-b"
        style={{ borderColor: "var(--surface-border)" }}
      >
        {title}
      </h1>
    )}
    {children}
  </div>
);

const DelgerenguiKharakh = React.forwardRef((props: any, ref) => {
  return <div>Дэлгэрэнгүй мэдээлэл</div>;
});

const UstsanTuukhTile = ({ data }: any) => <div>{JSON.stringify(data)}</div>;

const CardList = ({
  jagsaalt,
  Component,
}: {
  jagsaalt: any[];
  Component: React.FC<any>;
}) => (
  <div className="grid grid-cols-1 gap-2">
    {jagsaalt.map((item) => (
      <Component key={item._id} data={item} />
    ))}
  </div>
);

const useJagsaalt = (url: string, query: any) => {
  const [data, setData] = useState({
    jagsaalt: [
      {
        _id: 1,
        createdAt: dayjs(),
        class: "ajiltan",
        tailbar: "Tailbar sample",
        object: {
          tulsunDun: 1000,
          orlogo: 2000,
          ner: "Test",
          register: "A001",
        },
        guilgeeKhiisenAjiltniiNer: "Admin",
      },
    ],
    data: { khuudasniiDugaar: 1, khuudasniiKhemjee: 10, niitMur: 1 },
    setKhuudaslalt: () => {},
    isValidating: false,
  });
  return data;
};

interface TableRow {
  _id: number;
  createdAt: Dayjs;
  class: string;
  tailbar: string;
  object: {
    tulsunDun: number;
    orlogo: number;
    ner: string;
    register: string;
  };
  guilgeeKhiisenAjiltniiNer: string;
}

export default function UstsanTuukh() {
  const [ajiltankhaikh, setAjiltankhaikh] = useState<string>();
  const [turul, setTurul] = useState<string>();
  const ref = useRef<any>(null);
  const [shineBagana, setShineBagana] = useState([]);
  const [shuukhOgnoo, setShuukhOgnoo] = useState<
    [string | null, string | null]
  >([
    dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const turluud = [
    { turul: "ajiltan", text: "Ажилтан" },
    { turul: "Talbai", text: "Талбай" },
    { turul: "baritsaa", text: "Барьцаа" },
  ];

  const query = useMemo(
    () => ({
      ajiltniiId: ajiltankhaikh,
      "object.turul": turul,
      createdAt: shuukhOgnoo
        ? {
            $gte: dayjs(shuukhOgnoo[0] || undefined).format(
              "YYYY-MM-DD 00:00:00"
            ),
            $lte: dayjs(shuukhOgnoo[1] || undefined).format(
              "YYYY-MM-DD 23:59:59"
            ),
          }
        : undefined,
    }),
    [ajiltankhaikh, turul, shuukhOgnoo]
  );

  const ustsanBarimt = useJagsaalt("/ustsanBarimt", query);

  const combinedData = ustsanBarimt.jagsaalt;

  // Columns replaced by semantic table below

  const ognooShuultOnChange = (
    dates: [string | null, string | null] | undefined
  ) => {
    if (!dates || !dates[0] || !dates[1]) {
      setShuukhOgnoo([
        dayjs().subtract(1, "month").format("YYYY-MM-DD"),
        dayjs().format("YYYY-MM-DD"),
      ]);
    } else {
      setShuukhOgnoo([dates[0], dates[1]]);
    }
  };

  return (
    <div className="relative">
      <Admin title="Устгасан түүх">
        <Card className="bg-transparent">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <DatePickerInput
              type="range"
              value={shuukhOgnoo}
              onChange={ognooShuultOnChange}
              valueFormat="YYYY-MM-DD"
              className="text-slate-900"
              locale="mn"
            />

            <Select
              popupClassName="tusgaiZagvar"
              placeholder={t("Ажилтан")}
              style={{ width: 120 }}
              onChange={setAjiltankhaikh}
              className="text-slate-900"
              allowClear
            >
              <Select.Option value="1">Ажилтан 1</Select.Option>
              <Select.Option value="2">Ажилтан 2</Select.Option>
            </Select>
            <Select
              popupClassName="tusgaiZagvar"
              placeholder={t("Төрөл")}
              style={{ width: 120 }}
              onChange={setTurul}
              className="text-slate-900"
              allowClear
            >
              {turluud.map((a) => (
                <Select.Option key={a.turul} value={a.turul}>
                  {a.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="table-surface neu-table custom-scrollbar">
            <table className="table-ui w-full text-left">
              <thead>
                <tr>
                  <th className="text-center">{t("Устгасан огноо")}</th>
                  <th>{t("Төрөл")}</th>
                  <th>{t("Устгасан шалтгаан")}</th>
                  <th className="text-right">{t("Төлсөн дүн")}</th>
                  <th>{t("Хийсэн")}</th>
                  <th className="text-center">{t("Үзэх")}</th>
                </tr>
              </thead>
              <tbody>
                {combinedData.map((row: TableRow) => (
                  <tr key={row._id}>
                    <td className="text-center">
                      {row.createdAt.format("YYYY-MM-DD HH:mm")}
                    </td>
                    <td>{row.class}</td>
                    <td>{row.tailbar}</td>
                    <td
                      className={`text-right ${
                        row.object.tulsunDun > 0
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {row.object.tulsunDun}
                    </td>
                    <td>{row.guilgeeKhiisenAjiltniiNer}</td>
                    <td className="text-center">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                          alert("Дэлгэрэнгүй мэдээлэл");
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            <CardList jagsaalt={combinedData} Component={UstsanTuukhTile} />
          </div>
        </Card>
      </Admin>
    </div>
  );
}
