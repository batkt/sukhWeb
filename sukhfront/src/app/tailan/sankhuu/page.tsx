"use client";

import React, { useState, useEffect } from "react";
import { DatePicker, Progress, Select } from "antd";
import local from "antd/lib/date-picker/locale/mn_MN";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  TooltipItem,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import formatNumber from "../../../../tools/function/formatNumber";
import formatNumberNershil from "../../../../tools/function/formatNumberNershil";
import _ from "lodash";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const tailanguud = [
  { ner: "Борлуулалтын тайлан", service: "borluulaltiinTailanAvya" },
  { ner: "Авлагын тайлан", service: "avlagiinTailanAvya" },
  { ner: "Зардлын тайлан", service: "zardaliinTailanAvya" },
  { ner: "Ашгийн тайлан", service: "ashigiinTailanAvya" },
];

const lineData: ChartData<"line", number[], string> = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [{ label: "Орлого", data: [1000, 2000, 1500, 3000, 2500] }],
};

const barData: ChartData<"bar", number[], string> = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [{ label: "Орлого", data: [1000, 2000, 1500, 3000, 2500] }],
};

interface ChartProps {
  defaultTurul?: "line" | "bar" | "barHorizontal";
  defaultTailan?: string;
}

const Chart: React.FC<ChartProps> = ({
  defaultTurul = "line",
  defaultTailan = "borluulaltiinTailanAvya",
}) => {
  const { t } = useTranslation();
  const [ognoo, setOgnoo] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [tailan, setTailan] = useState(defaultTailan);
  const [tailanTurul, setTailanTurul] = useState(defaultTurul);
  const [nariivchlal, setNariivchlal] = useState("month");

  const tailanGaralt = {
    jagsaalt: [
      { ner: "Зардал", dun: 3000, ungu: "#ff4d4f" },
      { ner: "Орлого", dun: 7000, ungu: "#52c41a" },
    ],
  };

  const total = tailanGaralt.jagsaalt.reduce((sum, a) => sum + a.dun, 0);

  // Chart options
  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Шугаман график" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: TooltipItem<"line">) {
            const dataset = tooltipItem.dataset;
            const raw = tooltipItem.raw as number | string;
            if (typeof raw === "number") {
              return `${t(dataset.label || "")} ${formatNumber(raw)}`;
            }
            return `${t(dataset.label || "")} ${raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (label: string | number) =>
            typeof label === "number"
              ? formatNumberNershil(label)
              : t(label.toString()),
        },
      },
      x: {
        ticks: {
          callback: (label: string | number) => t(label.toString()),
        },
      },
    },
    animation: { duration: 1500, easing: "easeInQuad" },
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { boxWidth: 20 } },
      title: { display: true, text: "Босоо багана график" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: TooltipItem<"bar">) {
            const dataset = tooltipItem.dataset;
            const raw = tooltipItem.raw as number | string;
            if (typeof raw === "number") {
              return `${t(dataset.label || "")} ${formatNumber(raw)}`;
            }
            return `${t(dataset.label || "")} ${raw}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: {
          // @ts-expect-error dash is valid at runtime
          dash: [2],
        },
        ticks: {
          callback: (value: string | number) =>
            typeof value === "number"
              ? formatNumberNershil(value)
              : t(value.toString()),
        },
      },
    },
    animation: { duration: 1500, easing: "easeInQuad" },
  };

  const horizontalBarOptions: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    elements: { bar: { borderWidth: 2 } },
    plugins: {
      legend: { position: "right" },
      title: { display: true, text: "Хэвтээ багана график" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: TooltipItem<"bar">) {
            const dataset = tooltipItem.dataset;
            const raw = tooltipItem.raw as number | string;
            if (typeof raw === "number") {
              return `${t(dataset.label || "")} ${formatNumber(raw)}`;
            }
            return `${t(dataset.label || "")} ${raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: string | number) =>
            typeof value === "number"
              ? formatNumberNershil(value)
              : t(value.toString()),
        },
      },
      y: {
        ticks: {
          callback: (value: string | number) => t(value.toString()),
        },
      },
    },
    animation: { duration: 1500, easing: "easeInQuad" },
  };

  return (
    <div className="box col-span-12 p-2 md:col-span-6">
      <div className="flex w-full flex-col space-y-1 pb-5 md:flex-row md:justify-between md:space-y-0">
        <div className="flex flex-col gap-1 md:flex-row">
          <Select placeholder={t("Тайлан")} onChange={setTailan} value={tailan}>
            {tailanguud.map((a) => (
              <Select.Option key={a.service} value={a.service}>
                {t(a.ner)}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder={t("График төрөл")}
            value={tailanTurul}
            onChange={setTailanTurul}
          >
            {[
              { val: "line", lab: "Шугаман" },
              { val: "bar", lab: "Босоо багана" },
              { val: "barHorizontal", lab: "Хэвтээ багана" },
            ].map((a) => (
              <Select.Option key={a.val} value={a.val}>
                {t(a.lab)}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder={t("Нарийвчлал")}
            value={nariivchlal}
            onChange={setNariivchlal}
          >
            {[
              { val: "day", lab: "Өдөр" },
              { val: "month", lab: "Сар" },
              { val: "year", lab: "Жил" },
            ].map((a) => (
              <Select.Option key={a.val} value={a.val}>
                {t(a.lab)}
              </Select.Option>
            ))}
          </Select>
        </div>

        <DatePicker.RangePicker
          value={ognoo}
          onChange={(dates, dateStrings) => {
            if (dates) setOgnoo(dates as [Dayjs | null, Dayjs | null]);
          }}
          locale={local}
        />
      </div>

      {tailanTurul === "line" && <Line options={lineOptions} data={lineData} />}
      {tailanTurul === "bar" && <Bar options={barOptions} data={barData} />}
      {tailanTurul === "barHorizontal" && (
        <Bar options={horizontalBarOptions} data={barData} />
      )}

      <div className="flex flex-col items-center space-y-2">
        <div className="table w-full">
          {tailanGaralt.jagsaalt.map((a) => (
            <div key={a.ner} className="table-row rounded-2xl font-normal">
              <div className="table-cell w-1/12 p-1">{t(a.ner)}</div>
              <div className="table-cell w-9/12 p-1">
                <Progress
                  size="small"
                  trailColor={a.ungu}
                  strokeColor={a.ungu}
                  percent={Number(((a.dun * 100) / total).toFixed(0))}
                />
              </div>
              <div className="table-cell w-2/12 p-1 text-right">
                {formatNumber(a.dun)}₮
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Sankhuu: React.FC = () => {
  useEffect(() => {
    import("aos").then((AOS) => AOS.init({ once: true }));
  }, []);

  return (
    <div
      className="col-span-12 grid grid-cols-12 gap-5 overflow-y-auto md:p-2"
      style={{ height: "calc(100vh - 7rem)" }}
    >
      <Chart defaultTurul="line" defaultTailan="borluulaltiinTailanAvya" />
      <Chart defaultTurul="bar" defaultTailan="avlagiinTailanAvya" />
      <Chart defaultTurul="barHorizontal" defaultTailan="zardaliinTailanAvya" />
      <Chart defaultTurul="line" defaultTailan="ashigiinTailanAvya" />
    </div>
  );
};

export default Sankhuu;
