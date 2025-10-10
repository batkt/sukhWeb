import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AppProps {
  data: ChartData<"bar", number[], string>;
}

export default function App({ data }: AppProps) {
  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Chart.js Horizontal Bar Chart",
      },
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
          callback: function (label: string | number) {
            if (typeof label === "number") return formatNumberNershil(label);
            return t(label.toString());
          },
        },
      },
      y: {
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

  return <Bar options={options} data={data} />;
}
