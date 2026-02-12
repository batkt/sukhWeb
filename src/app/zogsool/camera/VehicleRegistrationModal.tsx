"use client";

import React, { useState, useEffect } from "react";
import { X, Delete, Camera, Keyboard, Calendar } from "lucide-react";
import moment from "moment";
import axios from "axios";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";

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
  const [regDate, setRegDate] = useState(() => moment().format("YYYY-MM-DDTHH:mm"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset date and plate to current time and empty when modal opens
    setRegDate(moment().format("YYYY-MM-DDTHH:mm"));
    setPlate("");
  }, []);

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

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200/50 dark:border-white/10">
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-200/50 bg-white">
          <div className="flex items-center gap-3">
             <Keyboard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
             <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Машин бүртгэх</h2>
                <p className="text-[9px]  text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Зогсоолын системд гараар бүртгэх</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative p-4 space-y-3">
          {/* Main Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input: Plate Number */}
            <div className="space-y-1.5 md:col-span-2">
               <label className="text-[9px]  text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Улсын дугаар</label>
               <div className="relative group">
                  <div className="relative bg-white rounded-lg border-2 border-slate-200 overflow-hidden group-focus-within:border-blue-500 transition-all shadow-sm" style={{ borderRadius: '0.5rem' }}>
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-slate-500 select-none">MNG</span>
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
                        className="w-full h-12 pl-14 pr-11 bg-transparent border-none font-black text-xl text-slate-800 dark:text-white focus:ring-0 outline-none uppercase tracking-[0.2em] placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:tracking-normal caret-blue-500"
                        autoFocus
                     />
                     {plate && (
                       <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-500 transition-all">
                          <X className="w-3.5 h-3.5" />
                       </button>
                     )}
                  </div>
               </div>
               <p className="text-[8px]  text-center text-slate-500 dark:text-slate-400 tracking-wide">Улсын дугаарыг кирил үсгээр оруулна уу</p>
            </div>

            {/* Input: Camera Select */}
            <div className="space-y-1.5">
              <label className="text-[9px]  text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Камер сонголт</label>
              <div className="relative group">
                <select
                  value={selectedIP}
                  onChange={(e) => setSelectedIP(e.target.value)}
                  className="w-full h-10 pl-3 pr-9 rounded-lg bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10  text-slate-700 dark:text-slate-300 text-xs appearance-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer shadow-sm"
                  style={{ borderRadius: '0.5rem' }}
                >
                  {entryCameras.map(cam => (
                    <option key={cam.cameraIP} value={cam.cameraIP}>
                      {cam.cameraIP} ({cam.gateName || 'Орох'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
                   <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Input: Date Select */}
            <div className="space-y-1.5">
              <label className="text-[9px]  text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Огноо сонголт</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full h-10 pl-3 pr-9 rounded-lg bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10  text-slate-700 dark:text-slate-300 text-xs focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{ borderRadius: '0.5rem' }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
                   <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Virtual Keyboard */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-lg">
            <div className="space-y-1">
              {keys.map((row, i) => (
                <div key={i} className="flex justify-center flex-wrap gap-1">
                  {row.map(char => (
                    <button
                      key={char}
                      onClick={() => handleKey(char)}
                      className="
                        relative w-8 h-8 rounded-lg
                        bg-white dark:bg-slate-800 
                        border-2 border-slate-200 dark:border-white/10
                        active:scale-95 active:translate-y-0.5
 text-[11px] text-slate-700 dark:text-slate-300
                        hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500/50
                        transition-all duration-150
                        shadow-sm hover:shadow-md
                      "
                    >
                      {char}
                    </button>
                  ))}
                  {i === keys.length - 1 && (
                    <button
                      onClick={handleBackspace}
                      className="
                        px-2.5 h-8 rounded-lg
                        bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-500/20 dark:to-rose-600/20
                        border-2 border-rose-200 dark:border-rose-500/30
                        active:scale-95 active:translate-y-0.5
                        text-rose-600 dark:text-rose-400
                        hover:bg-gradient-to-br hover:from-rose-500 hover:to-rose-600 hover:text-white hover:border-rose-600
                        transition-all duration-150
                        shadow-sm hover:shadow-md
                      "
                    >
                      <Delete className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-200/50 dark:border-white/10">
             <div className="flex gap-2">
               <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                >
                  Хаах
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  isLoading={loading}
                  variant="primary"
                  size="sm"
                >
                  Хадгалах
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );


}
