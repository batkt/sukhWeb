"use client";
import { useEffect, useState } from "react";
import { Button, Input, notification } from "antd";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";

const mockKhariltsagchid = [
  {
    _id: "1",
    ner: "Болд",
    utas: "99112233",
    talbainDugaar: ["101"],
    turul: "Хувь хүн",
  },
  {
    _id: "2",
    ner: "Сараа",
    utas: "99114455",
    talbainDugaar: ["202", "203"],
    turul: "ААН",
  },
];

function IlgeesenToo({ text, count }: { text: string; count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl bg-white/10 dark:from-green-900/40 dark:to-green-700/40 p-3 shadow-sm"
    >
      <span className="text-sm text-gray-600 dark:text-gray-300">{text}</span>
      <span className="text-lg font-bold text-slate-900 dark:text-green-300">
        {count || 0}
      </span>
    </motion.div>
  );
}

export default function KhyanaltFrontend() {
  useEffect(() => {
    Aos.init({ once: true });
  }, []);

  const [khariltsagch, setKhariltsagch] = useState<any>(null);
  const [songogdsonKhariltsagch, setSongogdsonKhariltsagch] = useState<any[]>(
    []
  );
  const [msj, setMsj] = useState("");
  const [title, setTitle] = useState("");
  const [turul, setTurul] = useState<"SMS" | "App" | "Mail">("SMS");
  const [loading, setLoading] = useState(false);

  function send() {
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
  }

  function khariltsagchSongokh(mur: any) {
    const exists = songogdsonKhariltsagch.find((a) => a._id === mur._id);
    if (exists) {
      setSongogdsonKhariltsagch(
        songogdsonKhariltsagch.filter((a) => a._id !== mur._id)
      );
    } else {
      setSongogdsonKhariltsagch([...songogdsonKhariltsagch, mur]);
    }
    setKhariltsagch(mur);
  }

  return (
    <div className="min-h-screen   dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm"
      >
        Мэдэгдэл
      </motion.h1>

      <motion.div
        className="flex gap-5 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {["SMS", "App", "Mail"].map((mur) => (
          <motion.button
            key={mur}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 rounded-2xl px-4 py-2 font-semibold transition-all shadow-lg ${
              turul === mur
                ? "bg-bar text-white shadow-md "
                : "bg-transparent/70 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => setTurul(mur as any)}
          >
            {mur}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence>
        {turul === "SMS" && (
          <motion.div
            className="grid grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
          >
            <IlgeesenToo text="Нийт" count={50} />
            <IlgeesenToo text="Энэ сард" count={12} />
          </motion.div>
        )}
        {turul === "App" && (
          <motion.div
            className="grid grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
          >
            <IlgeesenToo text="Нийт" count={10} />
            <IlgeesenToo text="Энэ сард" count={2} />
          </motion.div>
        )}
        {turul === "Mail" && (
          <motion.div
            className="grid grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
          >
            <IlgeesenToo text="Нийт" count={5} />
            <IlgeesenToo text="Энэ сард" count={12} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-6">
        <motion.div
          className="col-span-12 md:col-span-4 rounded-2xl bg-transparent dark:bg-gray-800/50 p-4 shadow-md backdrop-blur-sm"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">
            Харилцагчид
          </h2>
          <div className="scrollbar-hidden max-h-[420px] overflow-y-auto space-y-2">
            {mockKhariltsagchid.map((mur) => (
              <motion.div
                key={mur._id}
                whileHover={{ scale: 1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 rounded-xl border p-3 cursor-pointer transition-all ${
                  khariltsagch?._id === mur._id
                    ? "bg-violet-50 border-violet-300 shadow-sm dark:bg-green-900/40"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700/40 dark:border-amber-700"
                }`}
                onClick={() => khariltsagchSongokh(mur)}
              >
                <div className="h-12 w-12 rounded-full bg-bar flex items-center justify-center font-bold text-white">
                  {mur.ner[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{mur.ner}</div>
                  <div className="text-xs text-gray-500">{mur.utas}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {(khariltsagch || songogdsonKhariltsagch.length > 0) && (
            <motion.div
              key="msg-box"
              className="col-span-12 md:col-span-8 flex flex-col rounded-2xl bg-transparent/70 dark:bg-gray-800/60 p-6 shadow-lg backdrop-blur-md"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              <Input
                placeholder="Гарчиг"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-3 rounded-xl bg-transparent border-white dark:border-amber-600"
              />
              <Input.TextArea
                rows={8}
                placeholder="Мэдэгдэл бичих..."
                value={msj}
                onChange={(e) => setMsj(e.target.value)}
                className="rounded-xl border-white transparent dark:border-amber-600 "
                style={{ marginTop: "10px" }}
              />
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="primary"
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold shadow-md"
                  onClick={send}
                  loading={loading}
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
