"use client";

import { useState } from "react";

export default function EbarimtTokhirgoo() {
  const [ebarimt3, setEbarimt3] = useState(false);
  const [vat, setVat] = useState(false);

  return (
    <div>
      <div className="border border-b border-b-gray-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 ">
          И-Баримт тохиргоо
        </h2>
      </div>

      <div className="space-y-6 max-w-md pt-5">
        <div className="flex items-center justify-between">
          <span className="text-slate-700 font-medium">И-Баримт 3.0 эсэх</span>
          <button
            onClick={() => setEbarimt3(!ebarimt3)}
            className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${
              ebarimt3 ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-transparent w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                ebarimt3 ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-700 font-medium">НӨАТ төлөх эсэх</span>
          <button
            onClick={() => setVat(!vat)}
            className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${
              vat ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                vat ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">
            ТИН дугаар
          </label>
          <input
            type="text"
            placeholder="ТИН дугаар"
            className="w-full border border-white rounded-2xl p-2 focus:ring-2 focus:ring-blue-400 text-theme"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">
            Дүүрэг
          </label>
          <input
            type="text"
            placeholder="Дүүрэг"
            className="w-full border border-white rounded-2xl p-2 focus:ring-2 focus:ring-blue-400 text-theme"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Хороо</label>
          <input
            type="text"
            placeholder="Хороо"
            className="w-full border border-white rounded-2xl p-2 focus:ring-2 focus:ring-blue-400 text-theme"
          />
        </div>
      </div>
    </div>
  );
}
