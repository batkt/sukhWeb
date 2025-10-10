"use client";

import { useEffect, useState, useRef } from "react";
import { Button, Checkbox, Input, message, notification, Upload } from "antd";
import { EditOutlined, UploadOutlined } from "@ant-design/icons";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

var timeout: any = null;
const getBase64 = (file: File, callback: (result: string) => void) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => callback(reader.result as string);
};

export default function Shaardlaga() {
  const { t } = useTranslation();
  const [khariltsagch, setKhariltsagch] = useState<any>(null);
  const [msj, onTextChange] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [zurag, setZurag] = useState<string | undefined>();
  const [songogdsonKhariltsagch, setSongogdsonKhariltsagch] = useState<any[]>(
    []
  );
  const ref = useRef<any>(null);

  const [khariltsagchiinMedeelel, setKhariltsagchiinMedeelel] = useState({
    jagsaalt: [
      { _id: "1", ner: "Бат", utas: "99112233", register: "AA123456" },
      { _id: "2", ner: "Сараа", utas: "88112233", register: "BB654321" },
      { _id: "3", ner: "Дорж", utas: "77112233", register: "CC789012" },
    ],
  });

  useEffect(() => {
    Aos.init({ once: true, duration: 800 });
  }, []);

  function beforeUpload(file: any, callback: any) {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) message.error("Зөвхөн JPG/PNG зураг оруулна уу!");
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error("Зураг 2MB-аас бага байх ёстой!");
    callback(file);
    return false;
  }

  function send() {
    if (!title) {
      notification.warning({ message: t("Гарчиг заавал оруулна уу!") });
      return;
    }
    if (!msj) {
      notification.warning({ message: t("Мэдэгдэл оруулна уу") });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notification.success({
        message: t("Амжилттай илгээлээ (frontend only)"),
      });
      setTitle("");
      setZurag(undefined);
      onTextChange("");
    }, 1000);
  }

  function khariltsagchSongokh(mur: any) {
    setKhariltsagch(mur);
    const index = songogdsonKhariltsagch.findIndex((a) => a._id === mur._id);
    if (index !== -1) {
      songogdsonKhariltsagch.splice(index, 1);
      setKhariltsagch(null);
    } else {
      songogdsonKhariltsagch.push(mur);
    }
    setSongogdsonKhariltsagch([...songogdsonKhariltsagch]);
  }

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-4 "
      >
        {t("Шаардлага")}
      </motion.h1>

      <div className="grid grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 md:col-span-4 rounded-2xl bg-card/60 dark:bg-gray-800/50 p-5 shadow-lg backdrop-blur-sm"
        >
          <Input
            type="text"
            placeholder="Хайх/Нэр, Регистр, Утас..."
            className="rounded-lg mb-4"
            onChange={({ target }) => {
              clearTimeout(timeout);
              timeout = setTimeout(() => {
                setKhariltsagchiinMedeelel((a) => ({
                  ...a,
                  search: target.value,
                }));
              }, 300);
            }}
          />

          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {khariltsagchiinMedeelel?.jagsaalt?.map((mur) => {
              const isActive = khariltsagch?._id === mur?._id;
              const isChecked =
                songogdsonKhariltsagch.findIndex((a) => a._id === mur._id) !==
                -1;

              return (
                <motion.div
                  key={mur._id}
                  whileHover={{ scale: 1 }}
                  onClick={() => khariltsagchSongokh(mur)}
                  className={`flex items-center gap-4 rounded-xl border p-3 cursor-pointer transition-all mt-2
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#7D7AD8] to-[#9B8FD5] border-[#9B8FD5] shadow"
                      : "bg-card/80 dark:bg-gray-700/50 hover:shadow"
                  }`}
                >
                  <Checkbox checked={isChecked} />

                  <div className="h-10 w-12 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#f5dcc8] to-[#c7bfee] text-white font-bold">
                    {mur.ner[0]}
                  </div>

                  <div className="flex w-full justify-between items-center">
                    <div>
                      <div className="font-medium">{mur?.ner}</div>
                      <div className="text-xs text-gray-500">ID: {mur._id}</div>
                    </div>
                    <div className="text-sm text-green-600">{mur?.utas}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="col-span-12 md:col-span-8">
          <AnimatePresence mode="wait">
            {khariltsagch || songogdsonKhariltsagch.length > 0 ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="rounded-2xl bg-card/70 dark:bg-gray-800/60 p-6 shadow-lg backdrop-blur-md"
              >
                <Input
                  placeholder={t("Гарчиг")}
                  value={title}
                  onChange={({ target }) => setTitle(target.value)}
                  className="rounded-lg mb-4"
                />

                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => {
                    function handleChange(img: any) {
                      getBase64(img, (img64: string) => {
                        if (ref.current) ref.current.src = img64;
                        ref.current?.classList?.remove("hidden");
                        setZurag(img64);
                      });
                    }
                    return beforeUpload(file, handleChange);
                  }}
                >
                  <Button
                    icon={zurag ? <EditOutlined /> : <UploadOutlined />}
                    className="mb-4"
                    style={{ marginTop: "10px" }}
                  >
                    {zurag ? t("Зураг өөрчлөх") : t("Зураг оруулах")}
                  </Button>
                </Upload>

                {zurag && (
                  <div className="mb-4 flex justify-center">
                    <img
                      ref={ref}
                      width={200}
                      src=""
                      className="rounded-lg shadow-md"
                      style={{ marginTop: "10px" }}
                    />
                  </div>
                )}

                <Input.TextArea
                  rows={6}
                  placeholder={t("Шаардлагын текст")}
                  value={msj}
                  onChange={({ target }) => onTextChange(target.value)}
                  className="rounded-lg mb-4"
                />

                <div className="flex justify-end">
                  <Button
                    type="primary"
                    onClick={send}
                    loading={loading}
                    disabled={loading}
                    className="rounded-lg px-6 bg-gradient-to-r from-green-500 to-emerald-500 mt-2"
                  >
                    {t("Илгээх")}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="rounded-2xl bg-card/70 dark:bg-gray-800/60 p-12 shadow-lg backdrop-blur-md flex items-center justify-center"
              >
                <div className="text-center text-gray-600 dark:text-gray-300">
                  <div className="text-lg font-semibold">
                    {t("Өдрийн мэнд")}
                  </div>
                  <div className="mt-1">
                    {t("Та шаардлага илгээх харилцагчаа сонгоно уу.")}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
