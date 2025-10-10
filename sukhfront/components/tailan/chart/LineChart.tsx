import _ from "lodash";
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  TooltipItem,
} from "chart.js";

import formatNumberNershil from "../../../tools/function/formatNumberNershil";
import formatNumber from "../../../tools/function/formatNumber";
import { t } from "i18next";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options: ChartOptions<"line"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Chart.js Line Chart",
    },
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
        callback: function (label: string | number) {
          if (typeof label === "number") return formatNumberNershil(label);
          return t(label.toString());
        },
      },
    },
    x: {
      ticks: {
        callback: function (label: string | number) {
          return t(label.toString());
        },
      },
    },
  },
  animation: {
    duration: 1500,
    easing: "easeInQuad",
  },
};

interface AppProps {
  data: ChartData<"line", number[], string>;
}

export default function App({ data }: AppProps) {
  return <Line options={options} data={data} />;
}
