"use client";

import React, { useState, useEffect } from "react";
import { Input, notification, Form } from "antd";
import Button from "@/components/ui/Button";
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
      className="peer w-full rounded-xl border border-theme/30 bg-white/50 px-4 pt-5 pb-2 text-theme dark:text-white focus:border-theme dark:focus:border-theme focus:ring-2 focus:ring-theme/20 dark:focus:ring-theme/20 focus:outline-none transition-all duration-200"
    />
    <label
      className="absolute left-4 top-2 text-[color:var(--muted-text)] text-sm transition-all pointer-events-none
      peer-placeholder-shown:top-5 peer-placeholder-shown:text-[color:var(--muted-text)] dark:peer-placeholder-shown:text-[color:var(--muted-text)] peer-placeholder-shown:text-base
      peer-focus:top-2 peer-focus:text-brand dark:peer-focus:text-brand peer-focus:text-sm"
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
      <div className="bg-gradient-to-br from-theme/10 to-theme/5 shadow-lg dark:shadow-theme/20 hover:shadow-xl dark:hover:shadow-theme/30 transition-all duration-300 rounded-2xl overflow-hidden border border-theme/50">
        <div className="px-6 py-4 border-b border-theme/50 bg-gradient-to-r from-theme/50 to-theme/50">
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
              <Button 
                onClick={tokhirgooKhadgalakh}
                variant="primary"
                size="sm"
                className="text-white transition-all duration-200"
                style={{ borderRadius: '0.75rem' }}
              >
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
