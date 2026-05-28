"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { 
  Video, 
  VideoOff, 
  Maximize2, 
  Minimize2, 
  Search, 
  Grid, 
  Tv, 
  RefreshCw, 
  Settings, 
  X, 
  Save, 
  Edit3,
  Sliders
} from "lucide-react";
import uilchilgee, { url as apiUrl } from "@/lib/uilchilgee";
import R2WPlayerComponent from "@/components/R2WPlayerComponent";
import { toast } from "react-hot-toast";

// Interface for customizable camera configuration
interface CustomCamera {
  id: string;
  name: string;
  ip: string;
  port: number;
  username?: string;
  password?: string;
  root: string;
  enabled: boolean;
}

// Default pre-populated configurations for 16 static channels (101 - 1601)
const DEFAULT_16_CAMERAS: CustomCamera[] = Array.from({ length: 16 }, (_, index) => {
  const channelNum = index + 1;
  return {
    id: `custom-cam-${channelNum}`,
    name: `Камер ${channelNum}`,
    ip: "192.168.1.228", // NVR default IP
    port: 554, // RTSP default port
    username: "admin",
    password: "",
    // Pre-configured paths for Hikvision NVR channels (Main streams 101 through 1601)
    root: `Streaming/Channels/${channelNum}01`, 
    enabled: true, // Enable all 16 cameras statically by default!
  };
});

// Helper component for Real-Time Clock
const RealTimeClock = () => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString("mn-MN") + " " + now.toLocaleTimeString("mn-MN")
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-right hidden md:block">
      <p className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wide font-mono">
        {time}
      </p>
    </div>
  );
};

export default function CameraVideoWall() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cols, setCols] = useState<number>(0); // 0 means automatic layout
  const [isWallMode, setIsWallMode] = useState(false); // Video Wall Mode
  const [isConfigOpen, setIsConfigOpen] = useState(false); // Settings Panel Toggle
  
  // Custom camera feeds list state (persisted in localStorage)
  const [cameras, setCameras] = useState<CustomCamera[]>([]);
  const [editingCamera, setEditingCamera] = useState<CustomCamera | null>(null);

  // Load custom camera list on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sukh_custom_cameras");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Auto migrate/reset if the stored list is not 16 items long
          if (Array.isArray(parsed) && parsed.length !== 16) {
            setCameras(DEFAULT_16_CAMERAS);
            localStorage.setItem("sukh_custom_cameras", JSON.stringify(DEFAULT_16_CAMERAS));
          } else {
            setCameras(parsed);
          }
        } catch (e) {
          console.error("Failed to parse custom cameras:", e);
          setCameras(DEFAULT_16_CAMERAS);
        }
      } else {
        setCameras(DEFAULT_16_CAMERAS);
        localStorage.setItem("sukh_custom_cameras", JSON.stringify(DEFAULT_16_CAMERAS));
      }
    }
  }, []);

  // Update a single camera's settings
  const handleUpdateCamera = (updated: CustomCamera) => {
    const nextList = cameras.map((cam) => (cam.id === updated.id ? updated : cam));
    setCameras(nextList);
    localStorage.setItem("sukh_custom_cameras", JSON.stringify(nextList));
    toast.success(`"${updated.name}" тохиргоо түр хадгалагдлаа`);
    setEditingCamera(null);
  };

  // Toggle quick enabled/disabled switch
  const handleToggleEnabled = (id: string, state: boolean) => {
    const nextList = cameras.map((cam) => (cam.id === id ? { ...cam, enabled: state } : cam));
    setCameras(nextList);
    localStorage.setItem("sukh_custom_cameras", JSON.stringify(nextList));
    toast.success(state ? "Камер идэвхжлээ" : "Камер идэвхгүй боллоо");
  };

  // Bulk enable/disable
  const handleToggleAll = (state: boolean) => {
    const nextList = cameras.map((cam) => ({ ...cam, enabled: state }));
    setCameras(nextList);
    localStorage.setItem("sukh_custom_cameras", JSON.stringify(nextList));
    toast.success(state ? "Бүх камерыг идэвхжүүллээ" : "Бүх камерыг идэвхгүй болголоо");
  };

  // Reset to default 16 NVR channels (101-1601)
  const handleResetDefaults = () => {
    if (window.confirm("Та бүх камерын тохиргоог анхны хэвэнд нь оруулахдаа итгэлтэй байна уу?")) {
      setCameras(DEFAULT_16_CAMERAS);
      localStorage.setItem("sukh_custom_cameras", JSON.stringify(DEFAULT_16_CAMERAS));
      setEditingCamera(null);
      toast.success("Камерын тохиргоонуудыг 101-1601 сувгуудаар шинэчиллээ");
    }
  };

  // Filter list based on search bar and enabled status
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      // Must be enabled to show on the main monitoring grid
      if (!cam.enabled) return false;
      
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const ipMatch = cam.ip.toLowerCase().includes(query);
        const nameMatch = cam.name.toLowerCase().includes(query);
        const pathMatch = cam.root.toLowerCase().includes(query);
        return ipMatch || nameMatch || pathMatch;
      }
      return true;
    });
  }, [cameras, searchTerm]);

  // Determine grid column styles based on number of active channels
  const gridClassName = useMemo(() => {
    const count = filteredCameras.length;
    let computedCols = cols;

    if (computedCols === 0) {
      if (count <= 1) computedCols = 1;
      else if (count <= 2) computedCols = 2;
      else if (count <= 4) computedCols = 2;
      else if (count <= 9) computedCols = 3;
      else computedCols = 4;
    }

    switch (computedCols) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
      default: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    }
  }, [filteredCameras.length, cols]);

  return (
    <div className={`h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-950 text-white rounded-3xl relative ${isWallMode ? "p-2" : "p-4 md:p-6"}`}>
      <div className="space-y-4">
        
        {/* Main Header Bar */}
        {!isWallMode && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-theme rounded-full"></div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Хяналтын Камерууд
                  <span className="px-2 py-0.5 rounded-full bg-theme/20 border border-theme/30 text-theme text-[9px] font-black uppercase tracking-wider">
                    101 - 1601 Шууд Харах
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
                  Амар СӨХ — Нийт 16 суваг бүхий видео хяналтын систем
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <RealTimeClock />
              <button
                onClick={() => setIsConfigOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 text-xs font-bold text-slate-200"
                title="Тохиргоо нээх"
              >
                <Settings className="w-4 h-4 text-theme" />
                <span>Тохиргоо</span>
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-lg">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Камер, суваг хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 pl-10 pr-4 h-9 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-theme/40 outline-none transition-all"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">
              Идэвхтэй: {filteredCameras.length} / {cameras.filter(c => c.enabled).length}
            </span>
          </div>

          {/* Grid Layout controls */}
          <div className="flex items-center gap-3">
            {/* Grid selectors */}
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-white/10 text-xs h-9">
              <button
                onClick={() => setCols(0)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${cols === 0 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                title="Автомат байршил"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCols(1)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${cols === 1 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                title="1 багана (Том)"
              >
                1
              </button>
              <button
                onClick={() => setCols(2)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${cols === 2 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                title="2 багана"
              >
                2
              </button>
              <button
                onClick={() => setCols(3)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${cols === 3 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                title="3 багана"
              >
                3
              </button>
              <button
                onClick={() => setCols(4)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${cols === 4 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                title="4 багана (16 сувагт хамгийн тохиромжтой)"
              >
                4
              </button>
            </div>

            {/* Video Wall Toggler */}
            <button
              onClick={() => setIsWallMode(!isWallMode)}
              className={`flex items-center gap-2 px-4 h-9 rounded-xl border text-xs font-bold transition-all ${
                isWallMode 
                  ? "bg-theme border-theme text-white shadow-lg animate-pulse" 
                  : "bg-slate-950 border-white/10 text-slate-300 hover:text-white"
              }`}
              title="Бүтэн дэлгэцээр хянах"
            >
              <Tv className="w-4 h-4" />
              <span>{isWallMode ? "Энгийн харагдац" : "Видео Хана"}</span>
            </button>
            
            {isWallMode && (
              <button
                onClick={() => setIsConfigOpen(true)}
                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition-colors"
                title="Тохиргоо"
              >
                <Settings className="w-4 h-4 text-theme" />
              </button>
            )}
          </div>
        </div>

        {/* Live Camera Surveillance Grid */}
        {filteredCameras.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-36 rounded-3xl bg-slate-900/40 border border-white/5 shadow-inner">
            <VideoOff className="w-14 h-14 text-slate-700 mb-4 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Идэвхтэй камер олдсонгүй
            </p>
            <p className="text-[10px] text-slate-600 mt-2 max-w-md text-center">
              Баруун дээд буланд байрлах <strong className="text-theme">Тохиргоо</strong> цэс рүү орж камеруудыг идэвхжүүлэх болон IP хаягийг нь оруулна уу.
            </p>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="mt-6 px-5 py-2 rounded-xl bg-theme text-white font-bold text-xs shadow-lg hover:bg-theme/90 active:scale-95 transition-all"
            >
              Камер тохируулах
            </button>
          </div>
        ) : (
          <div className={`grid gap-4 ${gridClassName} transition-all duration-500`}>
            {filteredCameras.map((camera) => (
              <div 
                key={camera.id}
                className="relative overflow-hidden rounded-3xl bg-black border border-white/5 shadow-2xl hover:border-white/15 transition-all duration-300 group/card aspect-video"
              >
                {/* Header Overlay */}
                <div className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/75 backdrop-blur-xl px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                      {camera.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono border-l border-white/20 pl-2">
                      CH {camera.root.replace("Streaming/Channels/", "")}
                    </span>
                  </div>
                </div>

                {/* Video feed element */}
                <div className="w-full h-full relative">
                  <CameraStream
                    ip={camera.ip}
                    port={camera.port}
                    name={camera.name}
                    username={camera.username}
                    password={camera.password}
                    root={camera.root}
                    barilgiinId={effectiveBarilgiinId}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-out Sidebar Settings Drawer */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[1200] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => {
              setIsConfigOpen(false);
              setEditingCamera(null);
            }}
          />
          {/* Drawer Body */}
          <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col text-slate-200 z-10 animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-theme" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Камер тохиргоо (16 суваг)</span>
              </div>
              <button 
                onClick={() => {
                  setIsConfigOpen(false);
                  setEditingCamera(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config Content (Scrollable list of 16 slots) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              
              {/* Quick controls */}
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-white/5 text-xs font-bold">
                <span>Нийтийн удирдлага:</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleAll(true)}
                    className="px-2.5 py-1 rounded bg-slate-800 border border-white/5 hover:bg-slate-700 transition-colors text-slate-300 font-bold"
                  >
                    Бүгдийг нээх
                  </button>
                  <button 
                    onClick={() => handleToggleAll(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 border border-white/5 hover:bg-slate-700 transition-colors text-slate-300 font-bold"
                  >
                    Бүгдийг хаах
                  </button>
                </div>
              </div>

              {/* Editing Form */}
              {editingCamera ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-theme/20 shadow-xl space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-theme uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      Засах: {editingCamera.name}
                    </span>
                    <button 
                      onClick={() => setEditingCamera(null)}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Буцах
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Камерын нэр:</label>
                      <input 
                        type="text" 
                        value={editingCamera.name} 
                        onChange={(e) => setEditingCamera({ ...editingCamera, name: e.target.value })}
                        className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:border-theme/40"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-slate-400 font-bold mb-1">IP хаяг:</label>
                        <input 
                          type="text" 
                          value={editingCamera.ip} 
                          onChange={(e) => setEditingCamera({ ...editingCamera, ip: e.target.value })}
                          className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-white/10 text-white font-mono outline-none focus:border-theme/40"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">RTSP Порт:</label>
                        <input 
                          type="number" 
                          value={editingCamera.port} 
                          onChange={(e) => setEditingCamera({ ...editingCamera, port: Number(e.target.value) })}
                          className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-white/10 text-white font-mono outline-none focus:border-theme/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Нэвтрэх нэр (User):</label>
                        <input 
                          type="text" 
                          value={editingCamera.username || ""} 
                          onChange={(e) => setEditingCamera({ ...editingCamera, username: e.target.value })}
                          className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:border-theme/40"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Нууц үг (Password):</label>
                        <input 
                          type="password" 
                          value={editingCamera.password || ""} 
                          onChange={(e) => setEditingCamera({ ...editingCamera, password: e.target.value })}
                          className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:border-theme/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Сувгийн зам (RTSP Path):</label>
                      <input 
                        type="text" 
                        value={editingCamera.root} 
                        onChange={(e) => setEditingCamera({ ...editingCamera, root: e.target.value })}
                        className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-white/10 text-white font-mono outline-none focus:border-theme/40"
                        placeholder="e.g., Streaming/Channels/101"
                      />
                      <p className="text-[9px] text-slate-500 mt-1">
                        * Channel Main Stream range: <strong>101 - 1601</strong> (e.g. `Streaming/Channels/101`, `Streaming/Channels/201` ... `Streaming/Channels/1601`).
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCamera(null)}
                      className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs text-slate-300 transition-colors"
                    >
                      Цуцлах
                    </button>
                    <button
                      onClick={() => handleUpdateCamera(editingCamera)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-theme text-white text-xs font-bold hover:bg-theme/90 transition-all shadow-md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Хадгалах
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Cameras List */}
              <div className="space-y-2">
                {cameras.map((cam, idx) => {
                  const isEditing = editingCamera?.id === cam.id;
                  const channelCode = cam.root.replace("Streaming/Channels/", "");
                  return (
                    <div 
                      key={cam.id}
                      className={`p-3 rounded-2xl bg-slate-950/80 border transition-all ${
                        isEditing 
                          ? "border-theme/40 bg-slate-950 shadow-md" 
                          : cam.enabled 
                            ? "border-emerald-500/10 hover:border-emerald-500/20" 
                            : "border-white/5 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <button
                            onClick={() => handleToggleEnabled(cam.id, !cam.enabled)}
                            className={`w-7 h-4 rounded-full p-0.5 transition-all duration-300 shrink-0 ${cam.enabled ? "bg-emerald-500" : "bg-slate-800"}`}
                          >
                            <div className={`w-3 h-3 rounded-full bg-white transition-all ${cam.enabled ? "translate-x-3" : "translate-x-0"}`}></div>
                          </button>
                          
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-white truncate">
                              {idx + 1}. {cam.name}
                            </span>
                            <span className="block text-[9px] text-slate-500 font-mono truncate mt-0.5">
                              {cam.ip}:{cam.port} / CH {channelCode}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingCamera(cam)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-all"
                            title="Тохиргоо засах"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/50 flex gap-3">
              <button
                onClick={handleResetDefaults}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold text-slate-400"
              >
                Анхны тохиргоо
              </button>
              <button
                onClick={() => {
                  setIsConfigOpen(false);
                  setEditingCamera(null);
                }}
                className="flex-1 py-2 rounded-xl bg-theme text-white hover:bg-theme/90 transition-all text-xs font-bold shadow-lg shadow-theme/20"
              >
                Дуусгах
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Compact camera surveillance player
const CameraStream = React.memo(
  ({
    ip,
    port,
    name,
    username,
    password,
    root = "stream",
    barilgiinId,
  }: {
    ip: string;
    port: number;
    name: string;
    username?: string;
    password?: string;
    root?: string;
    barilgiinId?: string;
  }) => {
    const [error, setError] = useState(false);
    const [connectionState, setConnectionState] = useState<string>("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const streamContainerRef = useRef<HTMLDivElement>(null);

    const handleError = useCallback((err: any) => {
      console.error("R2WPlayer error:", err);
      setError(true);
    }, []);

    const handleConnectionStateChange = useCallback((state: string) => {
      setConnectionState(state);
      if (state === "failed" || state === "disconnected") {
        setError(true);
      } else if (state === "connected") {
        setError(false);
      }
    }, []);

    const toggleFullscreen = () => {
      if (!streamContainerRef.current) return;

      if (!isFullscreen) {
        if (streamContainerRef.current.requestFullscreen) {
          streamContainerRef.current.requestFullscreen();
        } else if ((streamContainerRef.current as any).webkitRequestFullscreen) {
          (streamContainerRef.current as any).webkitRequestFullscreen();
        } else if ((streamContainerRef.current as any).msRequestFullscreen) {
          (streamContainerRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    };

    // Fullscreen Listeners
    useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
        );
        setIsFullscreen(isCurrentlyFullscreen);
      };

      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === "f" || e.key === "F") {
          const target = e.target as HTMLElement;
          if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
            e.preventDefault();
            toggleFullscreen();
          }
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.addEventListener("msfullscreenchange", handleFullscreenChange);
      document.addEventListener("keydown", handleKeyPress);

      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.removeEventListener("msfullscreenchange", handleFullscreenChange);
        document.removeEventListener("keydown", handleKeyPress);
      };
    }, [isFullscreen]);

    if (error) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-4">
          <div className="relative text-center max-w-sm">
            <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-red-500/20">
              <VideoOff className="w-10 h-10 mb-3 mx-auto opacity-75 text-red-500" />
              <p className="text-xs font-bold mb-1">
                Холболт амжилтгүй
              </p>
              <p className="text-[9px] text-slate-500 font-mono mb-4">
                {ip}:{port}
              </p>
              
              <div className="flex flex-col gap-2">
                {connectionState && (
                  <div className="px-2 py-1 rounded bg-slate-800/80 border border-white/5 text-[9px] text-slate-400 font-mono">
                    Төлөв: {connectionState}
                  </div>
                )}
                <button 
                  onClick={() => setError(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-850 border border-white/10 hover:bg-slate-750 transition-colors text-[10px] font-bold uppercase tracking-wider"
                >
                  Дахин ачаалах
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={streamContainerRef}
        className="absolute inset-0 w-full h-full group/stream"
        style={
          isFullscreen
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: "#000",
              }
            : {}
        }
      >
        <R2WPlayerComponent
          Camer={ip}
          PORT={port}
          USER={username}
          PASSWD={password}
          ROOT={root}
          serverPath={`${apiUrl.endsWith("/") ? apiUrl : apiUrl + "/"}camera/stream/${barilgiinId}`}
          onError={handleError}
          onConnectionStateChange={handleConnectionStateChange}
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className={`absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-white transition-all duration-200 ${
            isFullscreen ? "opacity-100" : "opacity-0 group-hover/stream:opacity-100"
          }`}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Camera Info Overlay */}
        {!isFullscreen && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/60 border border-white/5 text-white text-[10px] font-mono opacity-0 group-hover/stream:opacity-100 transition-opacity duration-200">
            <span>{ip}:{port}</span>
          </div>
        )}

        {/* Fullscreen overlay info */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 z-30 px-4 py-2.5 rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <p className="text-xs font-bold">{name}</p>
                <p className="text-[10px] opacity-75 font-mono mt-0.5">
                  {ip}:{port} / {root}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
