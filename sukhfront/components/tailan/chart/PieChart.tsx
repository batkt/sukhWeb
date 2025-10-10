import React from "react";
import { Pie } from "react-chartjs-2";

export const data = {
  datasets: [
    {
      label: "# of Votes",
      data: [5, 22, 3, 5],
      backgroundColor: ["green", "blue", "orange", "yellow"],
    },
  ],
  labels: ["Бат", "Сүх", "Хүрэл", "Ган"],
};

export default function App() {
  return <Pie data={data} />;
}
