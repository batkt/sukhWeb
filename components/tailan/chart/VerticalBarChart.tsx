import _ from "lodash";
import React from "react";
import { Bar } from "react-chartjs-2";
import formatNumberNershil from "../../../tools/function/formatNumberNershil";
import formatNumber from "../../../tools/function/formatNumber";
type Props = { t: (key: string) => string; data: any };
export default function App({ t, data }: Props) {
  const options: any = {
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
    },
    scales: {
      xAxes: [
        {
          barThickness: 6,
          maxBarThickness: 8,
        },
      ],
      yAxes: [
        {
          ticks: {
            callback: function (
              label: number | string,
              index: number,
              labels: any
            ) {
              if (_.isNumber(label)) return formatNumberNershil(label);
              return t(label);
            },
          },
        },
      ],
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem: any, data: any) {
          const { datasetIndex } = tooltipItem;
          const { datasets } = data;
          if (_.isNumber(tooltipItem?.yLabel))
            return (
              t(datasets[datasetIndex].label) +
              " " +
              formatNumber(tooltipItem?.value)
            );
          return t(datasets[datasetIndex].label) + " " + tooltipItem?.value;
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
