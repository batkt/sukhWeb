"use client";

import React, { useState, useEffect } from "react";
import { Button, Input, notification, Form } from "antd";
import { useTranslation } from "react-i18next";

interface EmailTokhirgooProps {
  token?: string;
  baiguullaga?: any;
  baiguullagaMutate?: () => void;
  setSongogdsonTsonkhniiIndex?: (index: number) => void;
}

interface EmailSettings {
  mailNevtrekhNer?: string;
  mailPassword?: string;
  mailHost?: string;
  mailPort?: string;
}

const FloatingInput = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (e: any) => void;
  type?: string;
}) => (
  <div className="relative w-full my-3">
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      className="peer w-full rounded-xl border border-white bg-transparent px-4 pt-5 pb-2 text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition"
    />
    <label
      className="absolute left-4 top-2 text-gray-500 text-sm transition-all pointer-events-none
      peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
      peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm"
    >
      {label}
    </label>
  </div>
);

const EmailTokhirgoo: React.FC<EmailTokhirgooProps> = ({
  baiguullaga,
  baiguullagaMutate,
  setSongogdsonTsonkhniiIndex,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [emailTokhirgoo, setEmailTokhirgoo] = useState<EmailSettings>({});

  useEffect(() => {
    if (baiguullaga) {
      const tokhirgoo = baiguullaga.tokhirgoo || {};
      form.setFieldsValue(tokhirgoo);
      setEmailTokhirgoo(tokhirgoo);
    }
  }, [baiguullaga, form]);

  const handleValuesChange = (changed: Partial<EmailSettings>) => {
    setEmailTokhirgoo((prev) => ({ ...prev, ...changed }));
  };

  const tokhirgooKhadgalakh = () => {
    setTimeout(() => {
      console.log("Mock saved:", emailTokhirgoo);
      notification.success({ message: t("Амжилттай засагдлаа (Mock)") });
      baiguullagaMutate?.();
      setSongogdsonTsonkhniiIndex?.(6);
    }, 500);
  };

  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-4">
      <div className="bg-transparent rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold border-b border-b-gray-300 text-gray-800 pb-2">
            {t("Нэхэмжлэл и-мэйлээр илгээх")}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <Form
            form={form}
            autoComplete="off"
            onFinish={tokhirgooKhadgalakh}
            onValuesChange={handleValuesChange}
          >
            <FloatingInput
              label={t("И-мэйл хаяг")}
              value={emailTokhirgoo.mailNevtrekhNer || ""}
              onChange={(e) =>
                setEmailTokhirgoo((prev) => ({
                  ...prev,
                  mailNevtrekhNer: e.target.value,
                }))
              }
              type="email"
            />

            <FloatingInput
              label={t("Нэвтрэх нууц үг")}
              value={emailTokhirgoo.mailPassword || ""}
              onChange={(e) =>
                setEmailTokhirgoo((prev) => ({
                  ...prev,
                  mailPassword: e.target.value,
                }))
              }
              type="password"
            />

            <FloatingInput
              label={t("Хост")}
              value={emailTokhirgoo.mailHost || ""}
              onChange={(e) =>
                setEmailTokhirgoo((prev) => ({
                  ...prev,
                  mailHost: e.target.value,
                }))
              }
            />

            <FloatingInput
              label={t("Порт")}
              value={emailTokhirgoo.mailPort || ""}
              onChange={(e) =>
                setEmailTokhirgoo((prev) => ({
                  ...prev,
                  mailPort: e.target.value,
                }))
              }
            />

            <div className="flex justify-end mt-4">
              <Button type="primary" htmlType="submit" className="rounded-xl">
                {t("Хадгалах")}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EmailTokhirgoo;
