"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import {
  VideoOff,
  Maximize2,
  Minimize2,
  Search,
  Grid,
  Tv,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import uilchilgee, { url as apiUrl } from "@/lib/uilchilgee";
import WebRTCVideoPlayer from "@/components/WebRTCVideoPlayer";
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

/// The password the camera schema used to default to. It is a placeholder, not
/// a credential, so any row still carrying it is treated as having no password
/// set at all.
const LEGACY_PLACEHOLDER_PASSWORD = "Admin123";

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
    <span className="hidden text-[13px] tabular-nums text-[color:var(--muted-text)] lg:inline">
      {time}
    </span>
  );
};

export default function CameraVideoWall() {
  const { token, bariguullagiinId, ajiltan, barilgiinId } = useAuth() as any;
  const effectiveBaiguullagiinId = ajiltan?.baiguullagiinId || bariguullagiinId;
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [cols, setCols] = useState<number>(0); // 0 means automatic layout
  const [isWallMode, setIsWallMode] = useState(false); // Video Wall Mode
  const [isConfigOpen, setIsConfigOpen] = useState(false); // Settings Panel Toggle
  const [loading, setLoading] = useState(false);

  // Stream server URL — "http://127.0.0.1:8083" for local, or backend relay URL for public access
  const [streamServerUrl, setStreamServerUrl] = useState("http://127.0.0.1:8083");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sukh_stream_server_url");
      if (saved) setStreamServerUrl(saved);
    }
  }, []);

  const handleStreamServerUrlChange = (val: string) => {
    setStreamServerUrl(val);
    localStorage.setItem("sukh_stream_server_url", val);
  };

  // Custom camera feeds list state loaded from backend
  const [cameras, setCameras] = useState<CustomCamera[]>([]);
  // Load custom camera list from SOH settings in MongoDB
  useEffect(() => {
    if (!token || !effectiveBaiguullagiinId) return;

    let active = true;
    const fetchCameras = async () => {
      try {
        setLoading(true);
        // Pass barilgiinId via Axios params (not URL string) to avoid the
        // uilchilgee interceptor doubling it up → Express getting an array → find() breaking
        const res = await uilchilgee(token).get(
          `/baiguullaga/${effectiveBaiguullagiinId}`,
          effectiveBarilgiinId ? { params: { barilgiinId: effectiveBarilgiinId } } : {}
        );
        if (!active) return;

        const barilguud: any[] = res.data?.barilguud || [];

        // Match by selected building, or fall back to first building
        const b = effectiveBarilgiinId
          ? (barilguud.find((x: any) => String(x._id) === String(effectiveBarilgiinId)) || barilguud[0])
          : barilguud[0];

        // Each camera row carries its own copy of ip/port/username/password,
        // but the settings UI only exposes the BUILDING-level fields - so a row
        // whose credentials were never filled in was unreachable and silently
        // used the schema default. Resolve the two here: the row wins when it
        // has a real value, otherwise the building-level value applies.
        //
        // LEGACY_PLACEHOLDER_PASSWORD is treated as unset. Existing rows were
        // written with it by the old schema default, and it is never a real
        // password - without this, those rows stay stranded on a credential
        // that only ever produces a 401.
        const fetchedCams = ((b?.sohCameruud ?? []) as CustomCamera[]).map(
          (cam) => {
            const rowPassword =
              cam.password && cam.password !== LEGACY_PLACEHOLDER_PASSWORD
                ? cam.password
                : "";
            return {
              ...cam,
              ip: cam.ip || b?.cameraIp || "",
              port: cam.port || b?.cameraPort || 554,
              username: cam.username || b?.cameraUsername || "",
              password: rowPassword || b?.cameraPassword || "",
            };
          },
        );
        setCameras(fetchedCams);
      } catch (e) {
        console.error("Failed to load SOH cameras:", e);
      } finally {
        if (active) setLoading(false);
      }

    };

    fetchCameras();
    return () => {
      active = false;
    };
  }, [token, effectiveBaiguullagiinId, effectiveBarilgiinId]);

  // Toggle quick enabled/disabled switch
  const handleToggleEnabled = (id: string, state: boolean) => {
    const nextList = cameras.map((cam) => (cam.id === id ? { ...cam, enabled: state } : cam));
    setCameras(nextList);
    toast.success(state ? "Камер идэвхжлээ" : "Камер идэвхгүй боллоо");
  };

  // Bulk enable/disable
  const handleToggleAll = (state: boolean) => {
    const nextList = cameras.map((cam) => ({ ...cam, enabled: state }));
    setCameras(nextList);
    toast.success(state ? "Бүх камерыг идэвхжүүллээ" : "Бүх камерыг идэвхгүй болголоо");
  };

  // Filter list based on search bar and enabled status
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      // Must be enabled to show on the main monitoring grid
      if (!cam.enabled) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const ipMatch = cam.ip?.toLowerCase().includes(query);
        const nameMatch = cam.name?.toLowerCase().includes(query);
        const pathMatch = cam.root?.toLowerCase().includes(query);
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

  // Видео ханаас Esc дарж гарна
  useEffect(() => {
    if (!isWallMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) setIsWallMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isWallMode]);

  const idevkhteiToo = cameras.filter((c) => c.enabled).length;
  const zokhionBaiguulalt: { v: number; label: string; title: string }[] = [
    { v: 0, label: "Авто", title: "Камерын тооноос хамааран автоматаар" },
    { v: 1, label: "1", title: "1 багана — том" },
    { v: 2, label: "2", title: "2 багана" },
    { v: 3, label: "3", title: "3 багана" },
    { v: 4, label: "4", title: "4 багана" },
  ];

  const khooson = (Icon: any, garchig: string, tailbar: string, uildel?: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--surface-border)] px-6 py-20 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-hover)]">
        <Icon className="h-6 w-6 text-[color:var(--muted-text)]" />
      </span>
      <p className="text-[15px] text-[color:var(--panel-text)]">{garchig}</p>
      <p className="mt-1 max-w-md text-[13px] text-[color:var(--muted-text)]">{tailbar}</p>
      {uildel}
    </div>
  );

  return (
    <div
      className={
        isWallMode
          ? "fixed inset-0 z-[1100] overflow-y-auto bg-black p-2"
          : "w-full space-y-4 px-4 pb-6 pt-3"
      }
    >
      {/* ── Толгой: гарчиг, хайлт, зохион байгуулалт, үйлдэл ── */}
      {isWallMode ? (
        <div className="fixed right-3 top-3 z-[1110] flex items-center gap-2">
          <span className="rounded-full bg-black/60 px-3 py-1.5 text-[12px] tabular-nums text-white/80">
            {filteredCameras.length} камер
          </span>
          <button
            type="button"
            onClick={() => setIsWallMode(false)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[13px] text-white backdrop-blur hover:bg-white/20"
            title="Видео ханаас гарах (Esc)"
          >
            <X className="h-4 w-4" />
            Гарах
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[17px] text-[color:var(--panel-text)]">Хяналтын камер</h1>
            <p className="text-[13px] text-[color:var(--muted-text)]">
              {cameras.length} камер · <span className="text-brand">{idevkhteiToo} идэвхтэй</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`filter-field w-[240px] ${searchTerm ? "is-active" : ""}`}>
              <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
              <input
                type="text"
                placeholder="Камерын нэр, IP хайх"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
            <div className="stg-segment" role="radiogroup" aria-label="Баганын тоо">
              {zokhionBaiguulalt.map((z) => (
                <button
                  key={z.v}
                  type="button"
                  role="radio"
                  aria-checked={cols === z.v}
                  onClick={() => setCols(z.v)}
                  title={z.title}
                  className={`stg-segment-item inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 ${cols === z.v ? "is-active" : ""}`}
                >
                  {z.v === 0 && <Grid className="h-4 w-4" />}
                  {z.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsWallMode(true)}
              className="btn-minimal inline-flex h-9 items-center gap-1.5 !px-3.5"
              title="Бүтэн дэлгэцээр хянах"
            >
              <Tv className="h-4 w-4" />
              Видео хана
            </button>
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="btn-minimal inline-flex h-9 items-center gap-1.5 !px-3.5"
              title="Камеруудыг асаах, унтраах"
            >
              <Settings className="h-4 w-4" />
              Тохиргоо
            </button>
            <RealTimeClock />
          </div>
        </div>
      )}

      {/* ── Камерын сүлжээ ── */}
      {loading ? (
        khooson(RefreshCw, "Камеруудыг ачаалж байна...", "Түр хүлээнэ үү")
      ) : cameras.length === 0 ? (
        khooson(
          VideoOff,
          "Камер тохируулаагүй байна",
          "Барилгын хяналтын камеруудыг Тохиргоо → Зогсоол → Камер хэсэгт нэмсний дараа энд харагдана.",
          <Link
            href="/tokhirgoo"
            className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-theme px-5 text-[14px] !text-white hover:opacity-90"
          >
            Камер тохируулах
          </Link>,
        )
      ) : filteredCameras.length === 0 ? (
        khooson(
          VideoOff,
          searchTerm ? "Хайлтад тохирох камер олдсонгүй" : "Идэвхтэй камер алга",
          searchTerm
            ? "Өөр нэр эсвэл IP-ээр хайгаад үзнэ үү."
            : "Бүх камер унтраалттай байна. «Тохиргоо» товчоор камеруудаа асаана уу.",
        )
      ) : (
        <div className={`grid ${isWallMode ? "gap-2" : "gap-3"} ${gridClassName}`}>
          {filteredCameras.map((camera) => (
            <div
              key={camera.id}
              className={`group/card relative isolate aspect-video overflow-hidden bg-black ${
                isWallMode ? "rounded-lg" : "rounded-xl border border-[color:var(--surface-border)]"
              }`}
            >
              <div className="relative h-full w-full">
                <CameraStream
                  ip={camera.ip}
                  port={camera.port}
                  name={camera.name}
                  username={camera.username}
                  password={camera.password}
                  root={camera.root}
                  barilgiinId={effectiveBarilgiinId}
                  token={token ?? undefined}
                />
              </div>
              {/* Доод гарчиг — нэр, суваг */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
                <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden />
                <span className="truncate text-[13px] text-white">{camera.name}</span>
                {camera.root && (
                  <span className="ml-auto shrink-0 text-[12px] tabular-nums text-white/60">
                    CH {camera.root.replace("Streaming/Channels/", "")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Тохиргооны самбар ── */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[1200] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsConfigOpen(false)} />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-5 py-4">
              <div>
                <h2 className="text-[16px] text-[color:var(--panel-text)]">Камерын тохиргоо</h2>
                <p className="text-[13px] text-[color:var(--muted-text)]">Харуулах камеруудаа асаана уу</p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
                aria-label="Хаах"
                title="Хаах"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 custom-scrollbar">
              <section>
                <h3 className="mb-2 text-[13px] text-[color:var(--muted-text)]">Стрим сервер</h3>
                <div className="stg-segment mb-2 w-full">
                  <button
                    type="button"
                    onClick={() => handleStreamServerUrlChange("http://127.0.0.1:8083")}
                    className={`stg-segment-item min-h-9 flex-1 ${streamServerUrl === "http://127.0.0.1:8083" ? "is-active" : ""}`}
                  >
                    Локал
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStreamServerUrlChange(`${apiUrl}/camera/stream/${effectiveBarilgiinId}`)}
                    className={`stg-segment-item min-h-9 flex-1 ${streamServerUrl !== "http://127.0.0.1:8083" ? "is-active" : ""}`}
                  >
                    Цахим (Relay)
                  </button>
                </div>
                <input
                  type="text"
                  value={streamServerUrl}
                  onChange={(e) => handleStreamServerUrlChange(e.target.value)}
                  className="stg-input tabular-nums"
                  aria-label="Стрим серверийн хаяг"
                />
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[13px] text-[color:var(--muted-text)]">
                    Камерууд · {idevkhteiToo}/{cameras.length} идэвхтэй
                  </h3>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => handleToggleAll(true)} className="btn-minimal inline-flex h-8 items-center !px-3 text-[13px]">
                      Бүгдийг асаах
                    </button>
                    <button type="button" onClick={() => handleToggleAll(false)} className="btn-minimal inline-flex h-8 items-center !px-3 text-[13px]">
                      Бүгдийг унтраах
                    </button>
                  </div>
                </div>
                <ul className="divide-y divide-[color:var(--surface-border)] rounded-xl border border-[color:var(--surface-border)]">
                  {cameras.map((cam, idx) => {
                    const channelCode = cam.root?.replace("Streaming/Channels/", "") || "";
                    return (
                      <li key={cam.id} className="flex items-center gap-3 px-3.5 py-2.5">
                        <div className={`min-w-0 flex-1 ${cam.enabled ? "" : "opacity-60"}`}>
                          <div className="truncate text-[14px] text-[color:var(--panel-text)]">
                            {idx + 1}. {cam.name}
                          </div>
                          <div className="truncate text-[12px] tabular-nums text-[color:var(--muted-text)]">
                            {cam.ip}:{cam.port}
                            {channelCode ? ` · CH ${channelCode}` : ""}
                          </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={cam.enabled}
                            onChange={(e) => handleToggleEnabled(cam.id, e.target.checked)}
                            aria-label={`${cam.name} харуулах`}
                          />
                          <span className="tokh-switch" />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <div className="border-t border-[color:var(--surface-border)] px-5 py-4">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-theme text-[14px] !text-white hover:opacity-90"
              >
                Болсон
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
    token,
  }: {
    ip: string;
    port: number;
    name: string;
    username?: string;
    password?: string;
    root?: string;
    barilgiinId?: string;
    token?: string;
  }) => {
    const [error, setError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const streamContainerRef = useRef<HTMLDivElement>(null);


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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900 p-4 text-center text-white">
          <VideoOff className="h-8 w-8 text-white/50" />
          <p className="text-[14px]">Камер холбогдсонгүй</p>
          <p className="text-[12px] tabular-nums text-white/50">{ip}:{port}</p>
          <button
            type="button"
            onClick={() => setError(false)}
            className="mt-1 inline-flex h-9 items-center rounded-full bg-white/10 px-4 text-[13px] text-white hover:bg-white/20"
          >
            Дахин оролдох
          </button>
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
        <WebRTCVideoPlayer
          // Only send credentials when BOTH are present. Building the URL
          // unconditionally produced "rtsp://:@host/..." for a camera with no
          // login, and an NVR that happily serves anonymous RTSP rejects that
          // empty pair with a 401.
          rtspUrl={
            username && password
              ? `rtsp://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${ip}:${port}/${root}`
              : `rtsp://${ip}:${port}/${root}`
          }
          barilgiinId={barilgiinId ?? ""}
          token={token}
          style={{ width: "100%", height: "100%" }}
        />

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className={`absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white transition-all duration-200 ${isFullscreen ? "opacity-100" : "opacity-0 group-hover/stream:opacity-100"
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
          <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/5 text-white text-[11px] font-mono opacity-0 group-hover/stream:opacity-100 transition-opacity duration-200">
            <span>{ip}:{port}</span>
          </div>
        )}

        {/* Fullscreen overlay info */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 z-30 px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-theme animate-pulse"></div>
              <div>
                <p className="text-xs ">{name}</p>
                <p className="text-[11px] opacity-75 font-mono mt-0.5">
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
