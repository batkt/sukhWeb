"use client";

import { useState } from "react";

const stats = [
  { title: "Баримт авах тоо", value: 0, delay: 600 },
  { title: "Баримт авах дүн", value: 5, delay: 500 },
  { title: "Баримт авсан тоо", value: 0, delay: 400 },
  { title: "Баримт авсан тоо", value: 0, delay: 400 },
  { title: "Баримт авсан тоо", value: 0, delay: 400 },
  { title: "Баримт авсан тоо", value: 0, delay: 400 },
  { title: "Баримт авсан тоо", value: 0, delay: 400 },
];

export default function Ebarimt() {
  return (
    <div className="p-5 grid grid-cols-12 gap-6">
      {/* Stats Cards */}
      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 overflow-x-auto">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex-1 h-24 cursor-pointer rounded-xl border-2 border-green-600 p-4 flex flex-col justify-center items-start
              transform transition hover:scale-105 duration-300"
            data-aos="zoom-out-down"
            data-aos-duration="1000"
            data-aos-delay={stat.delay}
          >
            <div className="text-2xl font-bold text-green-600">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="col-span-12 mt-4 border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full table-fixed text-center">
          <colgroup>
            <col className="w-16" />
            <col />
            <col />
            <col className="w-48" />
            <col className="w-72" />
          </colgroup>
          <thead className="bg-green-50">
            <tr>
              <th className="py-2 font-semibold">№</th>
              <th className="py-2 font-semibold">Огноо</th>
              <th className="py-2 font-semibold">Тайлант сар</th>
              <th className="py-2 font-semibold">Дүн</th>
              <th className="py-2 font-semibold">Үйлчилгээ</th>
            </tr>
          </thead>
          <tbody>
            {/* Example empty row */}
            <tr className="bg-white border-t">
              <td colSpan={5} className="py-6 text-gray-400">
                Мэдээлэл байхгүй
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
