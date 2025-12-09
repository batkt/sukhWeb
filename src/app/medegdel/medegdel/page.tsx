"use client";

import { useEffect, useState } from "react";
import { Button, Input, notification } from "antd";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon } from "lucide-react";
import TabButton from "components/tabButton/tabButton";
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
    setSongogdsonKhariltsagch((prev) => {
      const exists = prev.find((a) => a._id === mur._id);
      if (exists) {
        // Remove from selection
        return prev.filter((a) => a._id !== mur._id);
      } else {
        // Add to selection
        return [...prev, mur];
      }
    });
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

  const handleSelectAll = () => {
    setSongogdsonKhariltsagch((prev) => {
      if (prev.length === mockKhariltsagchid.length) {
        // Unselect all
        return [];
      } else {
        // Select all
        return [...mockKhariltsagchid];
      }
    });
  };

  return (
    <div className="space-y-6 p-2 sm:p-5">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-theme bg-clip-text text-transparent drop-shadow-sm"
      >
        Мэдэгдэл
      </motion.h1>
      <div className="flex flex-col lg:flex-row min-h-screen gap-4 lg:gap-6 bg-transparent">
        <div className="rounded-2xl bg-white/10 p-4 sm:p-6 backdrop-blur-sm w-full lg:w-1/4">
          <motion.div
            className="grid grid-cols-12 gap-2 sm:gap-5 mb-4 sm:mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {["SMS", "App", "Mail"].map((m) => (
              <div key={m} className="2xl:col-span-4 col-span-12">
                <TabButton
                  active={turul === m}
                  onClick={() => {
                    setTurul(m as any);
                  }}
                >
                  {m}
                </TabButton>
              </div>
            ))}
          </motion.div>
          <div className="flex flex-row justify-between items-center">
            <div className="text-xs sm:text-sm">{`${turul} загвар`}</div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <button className="btn-minimal text-xs sm:text-sm">
                Загвар нэмэх
              </button>
            </motion.div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-4 sm:p-6 backdrop-blur-sm w-full lg:w-1/4 min-h-[200px]">
          <motion.div
            className="rounded-2xl p-2 sm:p-4"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-slate-700">
              Харилцагчид
            </h2>
            <div className="flex items-center gap-2 mb-2 px-1 sm:px-2">
              <input
                type="checkbox"
                checked={
                  songogdsonKhariltsagch.length === mockKhariltsagchid.length &&
                  mockKhariltsagchid.length > 0
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label
                className="text-sm text-slate-700 cursor-pointer"
                onClick={handleSelectAll}
              >
                Бүг сонгох
              </label>
              {songogdsonKhariltsagch.length > 0 && (
                <span className="text-xs text-slate-500">
                  ({songogdsonKhariltsagch.length} сонгогдсон)
                </span>
              )}
            </div>
            <div className="relative h-9 xl:h-10 w-full flex items-center neu-panel mb-2">
              <input
                aria-label="Global search"
                className="w-full h-full pl-2 xl:pl-3 pr-8 xl:pr-10 rounded-2xl border border-transparent bg-transparent text-theme text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)] transition-all"
                placeholder="Хайх..."
              />{" "}
              <SearchIcon className="absolute right-2 xl:right-3 top-1/2 -translate-y-1/2 w-3.5 xl:w-4 h-3.5 xl:h-4 text-(--panel-text) opacity-60 pointer-events-none" />
            </div>
            <div className="overflow-y-auto max-h-[400px] sm:max-h-[600px] space-y-2 sm:space-y-3">
              {mockKhariltsagchid.map((mur) => {
                const isActive = khariltsagch?._id === mur._id;
                const isChecked = songogdsonKhariltsagch.some(
                  (k) => k._id === mur._id
                );
                return (
                  <motion.div
                    key={mur._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => khariltsagchSongokh(mur)}
                    className={`group relative flex items-center gap-2 sm:gap-3 py-1 px-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "bg-white/25 border border-white/50 shadow-xl"
                        : "bg-white/10 border border-white/20 hover:bg-white/20 hover:shadow-lg"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded cursor-pointer pointer-events-none"
                    />
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-linear-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                      {mur.ner[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                        {mur.ner}
                      </div>
                      <div className="text-xs text-slate-500">{mur.utas}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4 sm:p-6 backdrop-blur-sm w-full lg:w-1/2 min-h-[200px]">
          <AnimatePresence>
            {songogdsonKhariltsagch.length > 0 && (
              <motion.div
                key="msg-box"
                className="flex flex-col gap-3 sm:gap-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: "spring", stiffness: 120 }}
              >
                <div className="rounded-2xl bg-white/10 p-3 sm:p-4 backdrop-blur-sm">
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-slate-700">
                    Сонгогдсон харилцагчид ({songogdsonKhariltsagch.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-[100px] sm:max-h-[150px] overflow-y-auto">
                    {songogdsonKhariltsagch.map((mur) => (
                      <div
                        key={mur._id}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/20 border border-white/30"
                      >
                        <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-linear-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
                          {mur.ner[0]}
                        </div>
                        <span className="text-xs text-slate-700 font-medium">
                          {mur.ner}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-transparent p-3 sm:p-4 shadow-sm backdrop-blur-md flex flex-col">
                  <Input
                    placeholder="Гарчиг"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="!mb-2 rounded-xl bg-white/30 border border-white/40 text-sm"
                  />
                  <Input.TextArea
                    rows={10}
                    placeholder="Мэдэгдэл бичих..."
                    value={msj}
                    onChange={(e) => setMsj(e.target.value)}
                    className="rounded-xl bg-white/30 border border-white/40 mt-2 text-sm sm:rows-20"
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
