"use client";

import { useEffect, useState } from "react";
import { Button, Input, notification } from "antd";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon } from "lucide-react";
import TabButton from "components/tabButton/tabButton";
import uilchilgee from "lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
interface Geree {
  _id: string;
  ner: string;
  utas: string | string[];
  mail?: string;
  gereeniiDugaar: string;
  tuluv: string;
  [key: string]: any;
}

export default function KhyanaltFrontend() {
  const { barilgiinId, token, ajiltan, baiguullaga } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId;
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId: string | undefined =
    selectedBuildingId ?? barilgiinId ?? undefined;
  const selectedBarilga = baiguullaga?.barilguud?.find(
    (b) => b._id === selectedBuildingId
  );
  useEffect(() => {
    Aos.init({ once: true });
  }, []);

  const [khariltsagch, setKhariltsagch] = useState<Geree | null>(null);
  const [songogdsonKhariltsagch, setSongogdsonKhariltsagch] = useState<Geree[]>(
    []
  );
  const [title, setTitle] = useState("");
  const [msj, setMsj] = useState("");
  const [turul, setTurul] = useState<"App" | "Мессеж" | "Mail">("App");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { orshinSuugchGaralt, isValidating, setOrshinSuugchKhuudaslalt } =
    useOrshinSuugchJagsaalt(
      token || "",
      baiguullagiinId || "",
      {},
      effectiveBarilgiinId
    );

  useEffect(() => {
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 1000,
      search: "",
    });
  }, [setOrshinSuugchKhuudaslalt]);

  const geree = (orshinSuugchGaralt?.jagsaalt || []) as Geree[];

  const khariltsagchSongokh = (mur: Geree) => {
    setSongogdsonKhariltsagch((prev) => {
      const exists = prev.find((a) => a._id === mur._id);
      if (exists) {
        return prev.filter((a) => a._id !== mur._id);
      } else {
        return [...prev, mur];
      }
    });
    setKhariltsagch(mur);
  };

  const send = async () => {
    if (!title || !msj) {
      notification.warning({
        message: "Гарчиг болон мессеж оруулна уу",
        style: { zIndex: 99999 },
      });
      return;
    }

    if (songogdsonKhariltsagch.length === 0) {
      notification.warning({
        message: "Мэдэгдэл илгээх харилцагч сонгоно уу",
        description: "Та мэдэгдэл илгээх хүмүүсийг сонгоно уу",
        style: { zIndex: 99999 },
      });
      return;
    }

    if (!token || !baiguullagiinId || !barilgiinId) {
      openErrorOverlay("Системийн алдаа");
      return;
    }

    setLoading(true);
    try {
      if (turul === "Мессеж") {
        // Build msgnuud array for SMS service
        const msgnuud = songogdsonKhariltsagch.flatMap((user) => {
          const phoneNumbers = Array.isArray(user.utas)
            ? user.utas
            : [user.utas];
          return phoneNumbers
            .filter((phone) => phone && phone.trim() !== "")
            .map((phone) => ({
              to: phone,
              text: `${title}\n${msj}`,
              gereeniiId: user._id,
            }));
        });

        await uilchilgee(token).post("/msgIlgeeye", {
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
          msgnuud: msgnuud,
        });
      } else if (turul === "Mail") {
        // Build mailuud array for email service
        const mailuud = songogdsonKhariltsagch
          .filter((user) => user.mail && user.mail.trim() !== "")
          .map((user) => ({
            mail: user.mail,
            content: `<p>${msj}</p>`,
          }));

        await uilchilgee(token).post("/mailOlnoorIlgeeye", {
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
          mailuud: mailuud,
          subject: title,
        });
      } else {
        // For App, use medegdelIlgeeye endpoint
        const orshinSuugchIdArray = songogdsonKhariltsagch.map(
          (user) => user.orshinSuugchId
        );

        await uilchilgee(token).post("/medegdelIlgeeye", {
          medeelel: {
            title: title,
            body: msj,
          },
          orshinSuugchId: orshinSuugchIdArray,
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
          turul: turul,
        });
      }

      // Show different success message based on service type
      const successMessage =
        turul === "Мессеж"
          ? "Мессеж амжилттай илгээгдлээ"
          : turul === "Mail"
          ? "Имэйл амжилттай илгээгдлээ"
          : "Мэдэгдэл амжилттай илгээгдлээ";

      openSuccessOverlay(successMessage);

      setTitle("");
      setMsj("");
      setSongogdsonKhariltsagch([]);
      setKhariltsagch(null);
    } catch (err) {
      console.error("Error in send function:", err);
      openErrorOverlay("Мэдэгдэл илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSongogdsonKhariltsagch((prev) => {
      if (prev.length === filteredGeree.length) {
        // Unselect all
        return [];
      } else {
        // Select all
        return [...filteredGeree];
      }
    });
  };

  const filteredGeree = geree.filter((mur) => {
    const query = searchQuery.toLowerCase();
    const nerMatch = mur.ner ? mur.ner.toLowerCase().includes(query) : false;

    // Handle utas as either string or array
    const utasMatch = Array.isArray(mur.utas)
      ? mur.utas.some((utas) => utas?.toLowerCase().includes(query))
      : typeof mur.utas === "string"
      ? mur.utas.toLowerCase().includes(query)
      : false;

    return nerMatch || utasMatch;
  });

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
        <motion.div
          className="rounded-2xl bg-white/10 p-4 sm:p-6 backdrop-blur-sm w-full lg:w-1/4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="grid grid-cols-12 gap-2 sm:gap-5 mb-4 sm:mb-6">
            {(["App", "Мессеж", "Mail"] as const).map((m) => (
              <div key={m} className="2xl:col-span-4 col-span-12">
                <TabButton active={turul === m} onClick={() => setTurul(m)}>
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
        </motion.div>

        <div className="rounded-2xl bg-white/10 p-4 sm:p-6 backdrop-blur-sm w-full lg:w-1/4 min-h-[200px]">
          <motion.div
            className="rounded-2xl p-2 sm:p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="font-semibold text-sm sm:text-base text-slate-700 dark:text-white">
                Харилцагчид
              </h2>
              {orshinSuugchGaralt && (
                <span className="text-xs text-slate-500">
                  Нийт: {orshinSuugchGaralt.niitMur || 0}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2 px-1 sm:px-2">
              <input
                type="checkbox"
                checked={
                  songogdsonKhariltsagch.length === filteredGeree.length &&
                  filteredGeree.length > 0
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label
                className="text-sm text-slate-700 cursor-pointer dark:text-white"
                onClick={handleSelectAll}
              >
                Бүгд сонгох
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-2 xl:pl-3 pr-8 xl:pr-10 rounded-2xl border border-transparent bg-transparent text-theme text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)] transition-all"
                placeholder="Хайх..."
              />{" "}
              <SearchIcon className="absolute right-2 xl:right-3 top-1/2 -translate-y-1/2 w-3.5 xl:w-4 h-3.5 xl:h-4 text-(--panel-text) opacity-60 pointer-events-none" />
            </div>
            <div className="overflow-y-auto max-h-[400px] sm:max-h-[600px] space-y-2 sm:space-y-3">
              {isValidating ? (
                <div className="text-center py-8 text-slate-500">
                  Уншиж байна...
                </div>
              ) : filteredGeree.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Оршин суугч олдсонгүй
                </div>
              ) : (
                filteredGeree.map((mur) => {
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
                        {mur.ner?.[0] || "?"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate dark:text-white">
                          {mur.ner}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-200">
                          {Array.isArray(mur.utas)
                            ? mur.utas.join(", ")
                            : mur.utas}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
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
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-slate-700 dark:text-white">
                    Сонгогдсон харилцагчид ({songogdsonKhariltsagch.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-[100px] sm:max-h-[150px] overflow-y-auto">
                    {songogdsonKhariltsagch.map((mur) => (
                      <div
                        key={mur._id}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/20 border border-white/30"
                      >
                        <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-linear-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
                          {mur.ner?.[0] || "?"}
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
                    whileHover={{ scale: !title || !msj ? 1 : 1.03 }}
                    whileTap={{ scale: !title || !msj ? 1 : 0.95 }}
                  >
                    <Button
                      type="primary"
                      onClick={send}
                      loading={loading}
                      disabled={!title || !msj}
                      className="mt-3 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold shadow-md px-4 py-2 dark:text-white"
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
