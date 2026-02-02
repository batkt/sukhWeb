"use client";

import React, { useState, useEffect } from "react";
import { X, Delete, Camera, Keyboard, Calendar } from "lucide-react";
import moment from "moment";
import axios from "axios";
import { toast } from "react-hot-toast";

interface VehicleRegistrationModalProps {
  onClose: () => void;
  token: string;
  barilgiinId?: string;
  entryCameras: any[];
  selectedCameraIP?: string;
  onSuccess?: () => void;
}

export default function VehicleRegistrationModal({ 
  onClose, 
  token, 
  barilgiinId, 
  entryCameras,
  selectedCameraIP,
  onSuccess 
}: VehicleRegistrationModalProps) {
  const [plate, setPlate] = useState("");
  const [selectedIP, setSelectedIP] = useState("");
  const [regDate, setRegDate] = useState(moment().format("YYYY-MM-DDTHH:mm"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCameraIP) {
      setSelectedIP(selectedCameraIP);
    } else if (entryCameras.length > 0 && !selectedIP) {
      setSelectedIP(entryCameras[0].cameraIP);
    }
  }, [entryCameras, selectedCameraIP]);

  const handleKey = (char: string) => {
    if (plate.length >= 7) return;

    const isNumber = /^\d$/.test(char);
    const isLetter = /^[А-Яа-яӨөҮү]$/.test(char);

      if (plate.length < 4) {
      if (isNumber) {
        setPlate(prev => prev + char);
      } else {
        toast.error("Эхний 4 орон тоо байх ёстой");
      }
    } else {
      if (isLetter) {
        setPlate(prev => prev + char);
      } else {
        toast.error("Сүүлийн 3 орон үсэг байх ёстой");
      }
    }
  };

  const handleBackspace = () => {
    setPlate(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPlate("");
  };

  const handleSave = async () => {
    if (!plate) {
      toast.error("Машины дугаар оруулна уу");
      return;
    }
    if (!selectedIP) {
      toast.error("Камер сонгоно уу");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        mashiniiDugaar: plate.trim(),
        CAMERA_IP: selectedIP,
        burtgelOgnoo: moment(regDate).format("YYYY-MM-DD HH:mm:ss"),
        barilgiinId: barilgiinId
      };

      const resp = await axios.post("https://amarhome.mn/api/zogsoolSdkService", payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (resp.status === 200 || resp.data === "Amjilttai" || resp.data?.success) {
        toast.success("Амжилттай бүртгэгдлээ");
        onSuccess?.();
        onClose();
      } else {
        toast.error(resp.data?.aldaa || "Бүртгэл амжилтгүй");
      }
    } catch (err: any) {
      console.error("SDK Registration Error:", err);
      toast.error(err.response?.data?.aldaa || "Бүртгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const keys = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й"],
    ["К", "Л", "М", "Н", "О", "Ө", "П", "Р", "С", "Т", "У"],
    ["Ү", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ь", "Ы", "Э"],
    ["Ю", "Я"]
  ];

  return (

    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 dark:border-white/5 ring-1 ring-black/5">
        {/* Decorative elements */}

        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
             <div className="relative">
                  <Keyboard className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Машин бүртгэх</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Зогсоолын системд гараар бүртгэх</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative p-5 space-y-5">
          {/* Main Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input: Plate Number */}
            <div className="space-y-3 md:col-span-2">
               <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                  <div className="relative bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden group-focus-within:border-transparent transition-colors">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 select-none">MNG</span>
                     <input
                        type="text"
                        value={plate}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          if (val.length < plate.length) {
                             setPlate(val);
                             return;
                          }
                          if (val.length > 7) return;

                          const char = val.slice(-1);
                          const index = val.length - 1;
                          
                          const isNumber = /^\d$/.test(char);
                          const isLetter = /^[А-Яа-яӨөҮү]$/.test(char);

                          if (index < 4) {
                             if (isNumber) {
                                setPlate(val);
                             } else {
                                toast.error("Эхний 4 орон тоо байх ёстой");
                             }
                          } else {
                             if (isLetter) {
                                setPlate(val);
                             } else {
                                toast.error("Сүүлийн 3 орон үсэг байх ёстой");
                             }
                          }
                        }}
                        placeholder="0000 УБА"
                        className="w-full h-14 pl-14 pr-10 bg-transparent border-none font-black text-2xl text-slate-800 focus:ring-0 outline-none uppercase tracking-[0.2em] placeholder:text-gray-200 placeholder:tracking-normal caret-blue-500"
                        autoFocus
                     />
                     {plate && (
                       <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all">
                          <X className="w-4 h-4" />
                       </button>
                     )}
                  </div>
               </div>
               <p className="text-[9px] font-bold text-center text-slate-400 tracking-widest">УЛСЫН ДУГААРЫГ КИРИЛ ҮСГЭЭР ОРУУЛНА УУ</p>
            </div>

            {/* Input: Camera Select */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase roundede-xl tracking-widest ml-1">Камер сонголт</label>
              <div className="relative group ">
                <select
                  value={selectedIP}
                  onChange={(e) => setSelectedIP(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-bold text-slate-700 dark:text-gray-200 text-[11px] appearance-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none cursor-pointer"
                >
                  {entryCameras.map(cam => (
                    <option key={cam.cameraIP} value={cam.cameraIP}>
                      {cam.cameraIP} ({cam.gateName || 'Орох'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-indigo-500 transition-colors">
                   <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Input: Date Select */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 rounded-xl uppercase tracking-widest ml-1">Огноо сонголт</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-bold text-slate-700 dark:text-gray-200 text-[11px] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-indigo-500 transition-colors">
                   <Calendar className="w-3.5 h-3.5" />
                </div>

              </div>
            </div>
          </div>

          {/* Virtual Keyboard */}
          {/* Virtual Keyboard */}
          {/* Virtual Keyboard */}
          <div className="bg-slate-50/50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
            <div className="space-y-1.5">
              {keys.map((row, i) => (
                <div key={i} className="flex justify-center flex-wrap gap-1">
                  {row.map(char => (
                    <button
                      key={char}
                      onClick={() => handleKey(char)}
                      className="
                        relative w-8 h-9 rounded-2xl
                        bg-white dark:bg-zinc-800 
                        border-b-[3px] border-r-[1px] border-slate-200 dark:border-white/10
                        active:border-b-0 active:translate-y-[2px]
                        font-black text-xs text-slate-600 dark:text-gray-300
                        hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200
                        transition-all duration-75
                        shadow-sm
                      "
                    >
                      {char}
                    </button>
                  ))}
                  {i === keys.length - 1 && (
                    <button
                      onClick={handleBackspace}
                      className="
                        px-3 h-9 rounded-2xl
                        bg-rose-50 border-b-[3px] border-r-[1px] border-rose-200 
                        active:border-b-0 active:translate-y-[2px]
                        text-rose-500 
                        hover:bg-rose-500 hover:text-white hover:border-rose-600
                        transition-all duration-75
                      "
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1">
             <button
               onClick={handleClear}
               className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
             >
               Бүгдийг арилгах
             </button>

             <div className="flex gap-2">
               <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl border-2 border-transparent hover:border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Болих
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="
                    relative overflow-hidden
                    px-6 py-2.5 rounded-2xl 
                    bg-gradient-to-r from-blue-600 to-indigo-600 
                    text-white font-black text-[10px] uppercase tracking-widest 
                    shadow-lg shadow-blue-500/30 
                    hover:scale-[1.02] active:scale-[0.98] 
                    disabled:opacity-70 disabled:cursor-not-allowed
                    distabled:hover:scale-100
                    transition-all duration-200
                  "
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                        <span>Хадгалж байна...</span>
                      </>
                    ) : 'Бүртгэх'}
                  </span>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );


}
