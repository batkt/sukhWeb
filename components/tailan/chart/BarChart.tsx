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
} from "chart.js";
import formatNumberNershil from "../../../tools/function/formatNumberNershil";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options: ChartOptions<"bar"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
      labels: {
        boxWidth: 20,
      },
    },
    title: {
      display: true,
      text: "Chart.js Bar Chart",
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        // @ts-expect-error dash is valid at runtime but missing in types
        dash: [2],
      },
      ticks: {
        callback: (value: number | string) =>
          typeof value === "number" ? formatNumberNershil(value) : value,
      },
    },
  },

  animation: {
    duration: 1500,
    easing: "easeInQuad",
  },
};

// Props typing
interface AppProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
    }[];
  };
}

export default function App({ data }: AppProps) {
  return <Bar options={options} data={data} />;
}
