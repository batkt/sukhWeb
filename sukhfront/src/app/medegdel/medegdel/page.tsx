"use client";

import { useEffect, useState } from "react";
import { Button, Input, notification } from "antd";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";

const mockKhariltsagchid = [
  { _id: "1", ner: "Болд", utas: "99112233" },
  { _id: "2", ner: "Сараа", utas: "99114455" },
  { _id: "3", ner: "Дорж", utas: "99115566" },
];

export default function KhyanaltFrontend() {
  useEffect(() => {
    Aos.init({ once: true });
  }, []);

  const [khariltsagch, setKhariltsagch] = useState<any>(null);
  const [songogdsonKhariltsagch, setSongogdsonKhariltsagch] = useState<any[]>(
    []
  );
  const [title, setTitle] = useState("");
  const [msj, setMsj] = useState("");
  const [turul, setTurul] = useState<"SMS" | "App" | "Mail">("SMS");
  const [loading, setLoading] = useState(false);

  const khariltsagchSongokh = (mur: any) => {
    const exists = songogdsonKhariltsagch.find((a) => a._id === mur._id);
    if (exists) {
      setSongogdsonKhariltsagch(
        songogdsonKhariltsagch.filter((a) => a._id !== mur._id)
      );
    } else {
      setSongogdsonKhariltsagch([...songogdsonKhariltsagch, mur]);
    }
    setKhariltsagch(mur);
  };

  const send = () => {
    if (!title || !msj) {
      notification.warning({ message: "Гарчиг болон мессеж оруулна уу" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      notification.success({ message: `${turul} илгээгдлээ (mock)` });
      setTitle("");
      setMsj("");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        Мэдэгдэл
      </motion.h1>

      {/* Tabs */}
      <motion.div
        className="flex gap-5 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {["SMS", "App", "Mail"].map((m) => (
          <motion.button
            key={m}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 rounded-2xl px-4 py-2 font-semibold transition-all shadow-lg ${
              turul === m
                ? "bg-bar text-white shadow-md"
                : "bg-white/10 text-slate-700 hover:bg-white/20"
            }`}
            onClick={() => setTurul(m as any)}
          >
            {m}
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        <motion.div
          className="col-span-12 md:col-span-4 rounded-2xl p-4"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="font-semibold mb-3 text-slate-700">Харилцагчид</h2>
          <div className="max-h-[350px] overflow-y-auto space-y-3">
            {mockKhariltsagchid.map((mur) => {
              const isActive = khariltsagch?._id === mur._id;

              return (
                <motion.div
                  key={mur._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => khariltsagchSongokh(mur)}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-white/25 border border-white/50 shadow-xl"
                      : "bg-white/10 border border-white/20 hover:bg-white/20 hover:shadow-lg"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {mur.ner[0]}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">
                      {mur.ner}
                    </div>
                    <div className="text-xs text-slate-500">{mur.utas}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence>
          {(khariltsagch || songogdsonKhariltsagch.length > 0) && (
            <motion.div
              key="msg-box"
              className="col-span-12 md:col-span-8 rounded-2xl bg-transparent p-4 shadow-sm backdrop-blur-md flex flex-col"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              <Input
                placeholder="Гарчиг"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="!mb-2 rounded-xl bg-white/30 border border-white/40"
              />
              <Input.TextArea
                rows={5}
                placeholder="Мэдэгдэл бичих..."
                value={msj}
                onChange={(e) => setMsj(e.target.value)}
                className="rounded-xl bg-white/30 border border-white/40 mt-2"
              />
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="primary"
                  onClick={send}
                  loading={loading}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold shadow-md px-4 py-2"
                >
                  Илгээх
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
