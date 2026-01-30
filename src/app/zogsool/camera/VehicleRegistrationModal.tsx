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
    if (plate.length < 10) {
      setPlate(prev => prev + char);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#4285F4] text-white shadow-lg shadow-blue-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Машин бүртгэх</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Inputs Section */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-1.5 min-w-[140px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="text-red-500">*</span> Дугаар :
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="1234УБА"
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 font-black text-lg text-slate-700 focus:bg-white focus:border-[#4285F4] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none uppercase tracking-widest placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1.5 min-w-[140px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                Камер IP :
              </label>
              <div className="relative">
                <select
                  value={selectedIP}
                  onChange={(e) => setSelectedIP(e.target.value)}
                  className="w-full h-11 px-4 pl-10 rounded-xl bg-gray-50 border border-gray-200 font-bold text-slate-700 text-sm appearance-none focus:bg-white focus:border-[#4285F4] transition-all outline-none"
                >
                  {entryCameras.map(cam => (
                    <option key={cam.cameraIP} value={cam.cameraIP}>
                      {cam.cameraIP} ({cam.gateName || 'Орох'})
                    </option>
                  ))}
                </select>
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 space-y-1.5 min-w-[140px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                Огноо :
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full h-11 px-4 pl-10 rounded-xl bg-gray-50 border border-gray-200 font-bold text-slate-700 text-sm focus:bg-white focus:border-[#4285F4] transition-all outline-none"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleClear}
              className="h-11 px-4 rounded-xl border border-rose-200 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95"
            >
              Цэвэрлэх
            </button>
          </div>

          {/* Virtual Keyboard */}
          <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
            {keys.map((row, i) => (
              <div key={i} className="flex justify-center flex-wrap gap-1.5">
                {row.map(char => (
                  <button
                    key={char}
                    onClick={() => handleKey(char)}
                    className="w-8 h-9 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/5 shadow-sm font-bold text-sm text-slate-700 dark:text-gray-200 hover:border-[#4285F4] hover:text-[#4285F4] hover:scale-110 active:scale-90 transition-all duration-200"
                  >
                    {char}
                  </button>
                ))}
                {i === keys.length - 1 && (
                  <button
                    onClick={handleBackspace}
                    className="w-16 h-9 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
            >
              Хаах
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-8 py-3 rounded-xl bg-[#4285F4] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
            >
              {loading ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
