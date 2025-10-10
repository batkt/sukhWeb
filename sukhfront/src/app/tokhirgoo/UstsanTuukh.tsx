"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, Table, Button, Select, DatePicker } from "antd";
import { EyeOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

const t = (text: string) => text;

const Admin: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => (
  <div>
    {title && (
      <h1 className="text-lg font-semibold mb-4 border border-b border-b-gray-300 pb-7">
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
  const [shuukhOgnoo, setShuukhOgnoo] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, "month"),
    dayjs(),
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
            $gte: shuukhOgnoo[0].format("YYYY-MM-DD 00:00:00"),
            $lte: shuukhOgnoo[1].format("YYYY-MM-DD 23:59:59"),
          }
        : undefined,
    }),
    [ajiltankhaikh, turul, shuukhOgnoo]
  );

  const ustsanBarimt = useJagsaalt("/ustsanBarimt", query);

  const combinedData = ustsanBarimt.jagsaalt;

  const columns = useMemo(() => {
    return [
      {
        title: t("Устгасан огноо"),
        dataIndex: "createdAt",
        align: "center" as const,
        render: (data: Dayjs) => data.format("YYYY-MM-DD HH:mm"),
      },
      {
        title: t("Төрөл"),
        dataIndex: "class",
        align: "left" as const,
      },
      {
        title: t("Устгасан шалтгаан"),
        dataIndex: "tailbar",
        align: "left" as const,
      },
      {
        title: t("Төлсөн дүн"),
        align: "right" as const,
        render: (row: TableRow) => (
          <div
            className={`${
              row.object.tulsunDun > 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {row.object.tulsunDun}
          </div>
        ),
      },
      {
        title: t("Хийсэн"),
        align: "left" as const,
        render: (row: TableRow) => row.guilgeeKhiisenAjiltniiNer,
      },
      {
        title: t("Үзэх"),
        align: "center" as const,
        render: (row: TableRow) => (
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              alert("Дэлгэрэнгүй мэдээлэл");
            }}
          />
        ),
      },
    ];
  }, []);

  const ognooShuultOnChange = (
    dates: (Dayjs | null)[] | null,
    dateStrings: [string, string]
  ) => {
    if (!dates || !dates[0] || !dates[1]) {
      setShuukhOgnoo([dayjs().subtract(1, "month"), dayjs()]);
    } else {
      setShuukhOgnoo([dates[0], dates[1]] as [Dayjs, Dayjs]);
    }
  };

  return (
    <Admin title="Устгасан түүх">
      <Card>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <RangePicker value={shuukhOgnoo} onChange={ognooShuultOnChange} />

          <Select
            placeholder={t("Ажилтан")}
            style={{ width: 120 }}
            onChange={setAjiltankhaikh}
            allowClear
          >
            <Select.Option value="1">Ажилтан 1</Select.Option>
            <Select.Option value="2">Ажилтан 2</Select.Option>
          </Select>
          <Select
            placeholder={t("Төрөл")}
            style={{ width: 120 }}
            onChange={setTurul}
            allowClear
          >
            {turluud.map((a) => (
              <Select.Option key={a.turul} value={a.turul}>
                {a.text}
              </Select.Option>
            ))}
          </Select>
        </div>
        <Table<TableRow>
          columns={columns}
          dataSource={combinedData}
          rowKey={(row) => row._id}
        />
        <div className="md:hidden">
          <CardList jagsaalt={combinedData} Component={UstsanTuukhTile} />
        </div>
      </Card>
    </Admin>
  );
}
