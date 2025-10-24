"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, DatePicker, Select, Button } from "antd";
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

  // Columns are rendered manually via a semantic table below

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
      <Card className="rounded-2xl bg-transparent">
        <div className="flex flex-col-reverse gap-3 sm:flex-row mb-4">
          <RangePicker
            style={{ marginBottom: "10px" }}
            size="middle"
            value={shuukhOgnoo}
            onChange={ognooShuultOnChange}
            className="text-slate-900"
          />
          <Select
            className="w-full sm:w-36 text-slate-900"
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
            className="w-full sm:w-36 text-slate-900"
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

        <div className="hidden md:block table-surface neu-table custom-scrollbar p-2">
          <table className="table-ui w-full text-left text-sm">
            <thead>
              <tr>
                <th className="text-center">Огноо</th>
                <th>Төрөл</th>
                <th className="text-center">Дугаар</th>
                <th>Зассан ажилтан</th>
                <th className="text-center">Зассан огноо</th>
                <th className="text-center">Үзэх</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row._id}>
                  <td className="text-center">
                    {row.classOgnoo.format("YYYY-MM-DD")}
                  </td>
                  <td>{row.className}</td>
                  <td className="text-center">{row.classDugaar}</td>
                  <td>{row.ajiltniiNer}</td>
                  <td className="text-center">
                    {row.createdAt.format("YYYY-MM-DD HH:mm")}
                  </td>
                  <td className="text-center">
                    <Button
                      shape="circle"
                      icon={<EyeOutlined />}
                      onClick={() => alert(JSON.stringify(row, null, 2))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden mt-4">
          <CardList jagsaalt={filteredData} Component={UstsanTuukhTile} />
        </div>
      </Card>
    </Admin>
  );
}
