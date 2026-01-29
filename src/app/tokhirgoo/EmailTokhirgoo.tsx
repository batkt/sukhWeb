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
      className="peer w-full rounded-xl border border-teal-200 dark:border-teal-600 bg-white/50 dark:bg-gray-800/50 px-4 pt-5 pb-2 text-theme dark:text-white focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/20 focus:outline-none transition-all duration-200"
    />
    <label
      className="absolute left-4 top-2 text-gray-600 dark:text-gray-400 text-sm transition-all pointer-events-none
      peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-500 dark:peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
      peer-focus:top-2 peer-focus:text-teal-600 dark:peer-focus:text-teal-400 peer-focus:text-sm"
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
      notification.success({ message: t("Амжилттай засагдлаа (Mock)") });
      baiguullagaMutate?.();
      setSongogdsonTsonkhniiIndex?.(6);
    }, 500);
  };

  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-4">
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 shadow-lg dark:shadow-teal-900/20 hover:shadow-xl dark:hover:shadow-teal-900/30 transition-all duration-300 rounded-2xl overflow-hidden border border-teal-200/50 dark:border-teal-600/50">
        <div className="px-6 py-4 border-b border-teal-200/50 dark:border-teal-600/50 bg-gradient-to-r from-teal-100/50 to-cyan-100/50 dark:from-teal-800/20 dark:to-cyan-800/20">
          <h2 className="text-lg  text-theme dark:text-white">
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
              <button 
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-700 dark:hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                style={{ borderRadius: '0.75rem' }}
              >
                {t("Хадгалах")}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EmailTokhirgoo;
