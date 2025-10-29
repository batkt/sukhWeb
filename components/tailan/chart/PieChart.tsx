import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";

// Register required elements for Pie/Doughnut charts
ChartJS.register(ArcElement, Tooltip, Legend);

export const sampleData: ChartData<"pie", number[], string> = {
  labels: ["A", "B", "C"],
  datasets: [
    {
      label: "Жишээ",
      data: [10, 20, 30],
      backgroundColor: ["#6366f1", "#22c55e", "#f59e0b"],
    },
  ],
};

type Props = {
  data?: ChartData<"pie", number[], string>;
  options?: ChartOptions<"pie">;
};

export default function PieChart({ data = sampleData, options }: Props) {
  const defaultOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
    },
  };
  return (
    <Pie data={data} options={{ ...defaultOptions, ...(options || {}) }} />
  );
}
