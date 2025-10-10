"use client";

import React, { useRef, useState } from "react";
import { Button } from "antd";

function KhuviinMedeelel({
  ajiltan: initialAjiltan,
  setSongogdsonTsonkhniiIndex,
}: any) {
  const [state, setState] = useState(initialAjiltan);
  const zuragRef = useRef<HTMLImageElement>(null);

  function onChange({ target }: any, key: string) {
    setState((s: any) => ({ ...s, [key]: target.value }));
  }

  function khadgalakh() {
    console.log("Saved", state);
    setSongogdsonTsonkhniiIndex(1);
  }

  function zuragSolikh({ target }: any) {
    const file = target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (zuragRef.current) {
        zuragRef.current.src = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
    setState((s: any) => ({ ...s, zurag: file }));
  }

  function zuragUstgakh() {
    setState((prev: any) => {
      const copy = { ...prev };
      delete copy.zurag;
      return copy;
    });
    if (zuragRef.current) {
      zuragRef.current.src = "/profile.svg";
    }
  }

  const FloatingInput = ({
    label,
    value,
    onChange,
    type = "text",
    id,
  }: {
    label: string;
    value: string;
    onChange: (e: any) => void;
    type?: string;
    id: string;
  }) => (
    <div className="relative w-full my-3">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="peer w-full rounded-xl border border-amber-100 bg-transparent/5 px-4 pt-5 pb-2 text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none shadow-sm transition"
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm cursor-text"
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="xxl:col-span-9 col-span-12 lg:col-span-12">
      <h2 className="text-lg font-semibold border-b border-b-gray-300 text-gray-800 pb-4">
        Хувийн мэдээлэл
      </h2>

      <div className="grid bg-tra grid-cols-1 md:grid-cols-2 gap-6">
        <FloatingInput
          id="ovog"
          label="Овог"
          value={state.ovog || ""}
          onChange={(e) => onChange(e, "ovog")}
        />
        <FloatingInput
          id="ner"
          label="Нэр"
          value={state.ner || ""}
          onChange={(e) => onChange(e, "ner")}
        />
        <FloatingInput
          id="email"
          label="И-Мэйл"
          value={state.email || ""}
          onChange={(e) => onChange(e, "email")}
        />
        <FloatingInput
          id="register"
          label="Регистрийн дугаар"
          value={state.register || ""}
          onChange={(e) => onChange(e, "register")}
        />
        <FloatingInput
          id="hayag"
          label="Хаяг - Тоот, давхар"
          value={state.hayag || ""}
          onChange={(e) => onChange(e, "hayag")}
        />
        <FloatingInput
          id="dugaar"
          label="Утасны дугаар"
          value={state.dugaar || ""}
          onChange={(e) => onChange(e, "dugaar")}
        />
        <FloatingInput
          id="shineNuutsUg"
          label="Шинэ нууц үг"
          value={state.shineNuutsUg || ""}
          onChange={(e) => onChange(e, "shineNuutsUg")}
          type="password"
        />
        <FloatingInput
          id="shineNuutsUgDavtan"
          label="Шинэ нууц үг давтан"
          value={state.shineNuutsUgDavtan || ""}
          onChange={(e) => onChange(e, "shineNuutsUgDavtan")}
          type="password"
        />
      </div>

      <div className="flex flex-col items-center mt-4">
        <div className="relative w-32 h-32">
          <img
            ref={zuragRef}
            src={
              state.zurag ? URL.createObjectURL(state.zurag) : "/profile.svg"
            }
            alt="Profile"
            className="h-full w-full rounded-full object-cover border-2 border-amber-200 shadow-lg"
          />
          {state.zurag && (
            <div
              className="absolute top-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold shadow"
              onClick={zuragUstgakh}
              title="Зураг устгах"
            >
              ✕
            </div>
          )}
        </div>

        <div className="mt-3 w-32">
          <Button type="default" className="w-full rounded-xl shadow-sm">
            Зураг солих
            <input
              type="file"
              accept="image/*"
              onChange={zuragSolikh}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </Button>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="primary"
          size="large"
          onClick={khadgalakh}
          className="rounded-xl shadow-lg"
        >
          Хадгалах
        </Button>
      </div>
    </div>
  );
}

export default KhuviinMedeelel;
