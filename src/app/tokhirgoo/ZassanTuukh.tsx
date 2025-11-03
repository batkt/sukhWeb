"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, Select, Button } from "antd";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { EyeOutlined } from "@ant-design/icons";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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
  const [shuukhOgnoo, setShuukhOgnoo] = useState<[Date | null, Date | null]>([
    dayjs().subtract(1, "month").toDate(),
    new Date(),
  ]);

  const filteredData = useMemo(() => {
    return mockData.filter((row) => {
      const inDateRange =
        shuukhOgnoo[0] && shuukhOgnoo[1]
          ? row.classOgnoo.isSameOrAfter(dayjs(shuukhOgnoo[0]), "day") &&
            row.classOgnoo.isSameOrBefore(dayjs(shuukhOgnoo[1]), "day")
          : true;
      const matchesAjiltan = ajiltankhaikh
        ? row.ajiltniiNer ===
          mockAjiltan.find((a) => a._id === ajiltankhaikh)?.ner
        : true;
      const matchesTurul = turul ? row.className === turul : true;
      return inDateRange && matchesAjiltan && matchesTurul;
    });
  }, [ajiltankhaikh, turul, shuukhOgnoo]);

  // Columns are rendered manually via a semantic table below

  const ognooShuultOnChange = (dates: [Date | null, Date | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      setShuukhOgnoo([dayjs().subtract(1, "month").toDate(), new Date()]);
    } else {
      setShuukhOgnoo([dates[0]!, dates[1]!]);
    }
  };

  return (
    <div className="relative">
      <Admin title="Зассан түүх">
        <Card className="rounded-2xl bg-transparent">
          <div className="flex flex-col-reverse gap-3 sm:flex-row mb-4">
            <DatePickerInput
              type="range"
              style={{ marginBottom: "10px" }}
              value={shuukhOgnoo}
              onChange={(v) =>
                ognooShuultOnChange(v as [Date | null, Date | null])
              }
              className="text-slate-900"
              locale="mn"
            />
            <Select
              popupClassName="tusgaiZagvar"
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
              popupClassName="tusgaiZagvar"
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
    </div>
  );
}
