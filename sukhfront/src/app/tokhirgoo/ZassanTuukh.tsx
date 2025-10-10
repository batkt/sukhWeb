"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, DatePicker, Select, Table, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { EyeOutlined } from "@ant-design/icons";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { RangePicker } = DatePicker;

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

const UstsanTuukhTile = ({ data }: any) => (
  <div className=" border rounded">{JSON.stringify(data)}</div>
);

const CardList = ({
  jagsaalt,
  Component,
}: {
  jagsaalt: any[];
  Component: any;
}) => (
  <div className="grid grid-cols-1 gap-2">
    {jagsaalt.map((item) => (
      <Component key={item._id} data={item} />
    ))}
  </div>
);

const mockAjiltan = [
  { _id: "1", ner: "Ажилтан 1" },
  { _id: "2", ner: "Ажилтан 2" },
];

const mockData = Array.from({ length: 20 }, (_, i) => ({
  _id: i + 1,
  classOgnoo: dayjs().subtract(i, "days"),
  className: ["Гэрээ", "Талбай бүртгэл", "Алданги"][i % 3],
  classDugaar: `D-${i + 1}`,
  ajiltniiNer: mockAjiltan[i % 2].ner,
  createdAt: dayjs().subtract(i, "hours"),
}));

const turluud = [
  { turul: "Geree", text: "Гэрээ" },
  { turul: "Talbai", text: "Талбай бүртгэл" },
  { turul: "Aldangi", text: "Алданги" },
];

export default function ZassanTuukh() {
  const [ajiltankhaikh, setAjiltankhaikh] = useState<string>();
  const [turul, setTurul] = useState<string>();
  const [shuukhOgnoo, setShuukhOgnoo] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, "month"),
    dayjs(),
  ]);

  const filteredData = useMemo(() => {
    return mockData.filter((row) => {
      const inDateRange =
        row.classOgnoo.isSameOrAfter(shuukhOgnoo[0], "day") &&
        row.classOgnoo.isSameOrBefore(shuukhOgnoo[1], "day");
      const matchesAjiltan = ajiltankhaikh
        ? row.ajiltniiNer ===
          mockAjiltan.find((a) => a._id === ajiltankhaikh)?.ner
        : true;
      const matchesTurul = turul ? row.className === turul : true;
      return inDateRange && matchesAjiltan && matchesTurul;
    });
  }, [ajiltankhaikh, turul, shuukhOgnoo]);

  const columns = useMemo(
    () => [
      {
        title: "Огноо",
        dataIndex: "classOgnoo",
        key: "classOgnoo",
        align: "center" as const,
        render: (a: Dayjs) => a.format("YYYY-MM-DD"),
      },
      {
        title: "Төрөл",
        dataIndex: "className",
        key: "className",
        align: "left" as const,
      },
      {
        title: "Дугаар",
        dataIndex: "classDugaar",
        key: "classDugaar",
        align: "center" as const,
      },
      {
        title: "Зассан ажилтан",
        dataIndex: "ajiltniiNer",
        key: "ajiltniiNer",
        align: "left" as const,
      },
      {
        title: "Зассан огноо",
        dataIndex: "createdAt",
        key: "createdAt",
        align: "center" as const,
        render: (a: Dayjs) => a.format("YYYY-MM-DD HH:mm"),
      },
      {
        title: "Үзэх",
        key: "action",
        align: "center" as const,
        render: (_: any, record: any) => (
          <Button
            shape="circle"
            icon={<EyeOutlined />}
            onClick={() => alert(JSON.stringify(record, null, 2))}
          />
        ),
      },
    ],
    []
  );

  const ognooShuultOnChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    _dateStrings: [string, string]
  ) => {
    if (!dates || !dates[0] || !dates[1]) {
      setShuukhOgnoo([dayjs().subtract(1, "month"), dayjs()]);
    } else {
      setShuukhOgnoo([dates[0]!, dates[1]!]);
    }
  };

  return (
    <Admin title="Зассан түүх">
      <Card className="rounded-md">
        <div className="flex flex-col-reverse gap-3 sm:flex-row mb-4">
          <RangePicker
            style={{ marginBottom: "10px" }}
            size="middle"
            value={shuukhOgnoo}
            onChange={ognooShuultOnChange}
          />
          <Select
            className="w-full sm:w-36"
            placeholder="Ажилтан"
            allowClear
            onChange={setAjiltankhaikh}
          >
            {mockAjiltan.map((a) => (
              <Select.Option key={a._id} value={a._id}>
                {a.ner}
              </Select.Option>
            ))}
          </Select>
          <Select
            className="w-full sm:w-36"
            placeholder="Төрөл"
            allowClear
            onChange={setTurul}
          >
            {turluud.map((a) => (
              <Select.Option key={a.turul} value={a.text}>
                {a.text}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(row) => row._id}
          size="small"
          bordered
          pagination={{ pageSize: 5 }}
          className="hidden md:block bg-transparent"
        />

        <div className="md:hidden mt-4">
          <CardList jagsaalt={filteredData} Component={UstsanTuukhTile} />
        </div>
      </Card>
    </Admin>
  );
}
