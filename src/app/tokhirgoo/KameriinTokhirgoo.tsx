"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Video,
  VideoOff,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ChevronDown,
  Eye,
  EyeOff,
  Sliders,
  User,
} from "lucide-react";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import Button from "@/components/ui/Button";

interface CameraConfig {
  id: string;
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  root: string;
  enabled: boolean;
  residentVisible: boolean;
}

const defaultCamera = (): CameraConfig => ({
  id: `cam-${Date.now()}`,
  name: `Камер`,
  ip: "",
  port: 554,
  username: "admin",
  password: "Admin123",
  root: "Streaming/Channels/102",
  enabled: true,
  residentVisible: false,
});

const INPUT_CLS =
  "w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] text-sm";

function CameraRow({
  cam,
  index,
  onChange,
  onRemove,
}: {
  cam: CameraConfig;
  index: number;
  onChange: (cam: CameraConfig) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all ${cam.enabled
        ? "border-theme/20 bg-theme/5 dark:bg-theme/5"
        : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] opacity-60"
        }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Enable toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...cam, enabled: !cam.enabled })}
          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${cam.enabled ? "bg-theme" : "bg-gray-300 dark:bg-gray-600"
            }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cam.enabled ? "translate-x-5" : "translate-x-0"
              }`}
          />
        </button>

        <Video className="w-4 h-4 text-[color:var(--muted-text)] flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[color:var(--panel-text)] truncate">
            {index + 1}. {cam.name || "Нэргүй камер"}
          </p>
          {cam.ip && (
            <p className="text-xs text-[color:var(--muted-text)] font-mono truncate">
              rtsp://{cam.ip}:{cam.port}/{cam.root}
            </p>
          )}
        </div>

        {/* Resident visible toggle */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            title={cam.residentVisible ? "Оршин суугч харах боломжтой" : "Оршин суугч харах боломжгүй"}
            onClick={() => onChange({ ...cam, residentVisible: !cam.residentVisible })}
            className={`relative w-10 h-5 rounded-full transition-colors ${cam.residentVisible ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cam.residentVisible ? "translate-x-5" : "translate-x-0"}`} />
          </button>
          <span className="text-[9px] text-[color:var(--muted-text)] leading-none">
            <User className="w-2.5 h-2.5 inline-block" />
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)]"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[color:var(--surface-border)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                Нэр
              </label>
              <input
                type="text"
                value={cam.name}
                onChange={(e) => onChange({ ...cam, name: e.target.value })}
                placeholder="Камер 1"
                className={INPUT_CLS}
              />
            </div>

            {/* ID */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                ID
              </label>
              <input
                type="text"
                value={cam.id}
                onChange={(e) => onChange({ ...cam, id: e.target.value })}
                placeholder="cam-1"
                className={INPUT_CLS}
              />
            </div>

            {/* Root / Stream path */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                RTSP зам (root)
              </label>
              <input
                type="text"
                value={cam.root}
                onChange={(e) => onChange({ ...cam, root: e.target.value })}
                placeholder="Streaming/Channels/102"
                className={INPUT_CLS}
              />
              <p className="text-xs text-[color:var(--muted-text)]">
                Sub-stream жишээ:{" "}
                <span className="font-mono">Streaming/Channels/102</span>,{" "}
                <span className="font-mono">Streaming/Channels/202</span> ...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KameriinTokhirgoo() {
  const { token, bariguullagiinId, ajiltan } = useAuth() as any;
  const effectiveBaiguullagiinId =
    ajiltan?.baiguullagiinId || bariguullagiinId;
  const { selectedBuildingId } = useBuilding();

  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBarilgiinId, setSelectedBarilgiinId] = useState<string>("");
  const [sohCameras, setSohCameras] = useState<CameraConfig[]>([]);
  const [activeTab, setActiveTab] = useState<"soh" | "resident">("soh");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const residentCameras = sohCameras.filter((c) => c.residentVisible);
  const activeCameras = activeTab === "soh" ? sohCameras : residentCameras;
  const setActiveCameras = setSohCameras;

  // Mass add settings states
  const [isMassAddOpen, setIsMassAddOpen] = useState(false);

  useEffect(() => {
    if (isMassAddOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMassAddOpen(false); };
      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("keydown", onKey);
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      };
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }, [isMassAddOpen]);
  const [massPrefix, setMassPrefix] = useState("Streaming/Channels/");
  const [massStart, setMassStart] = useState(102);
  const [massEnd, setMassEnd] = useState(1602);
  const [massStep, setMassStep] = useState(100);
  const [massNamePrefix, setMassNamePrefix] = useState("Камер");
  const [massNamingStyle, setMassNamingStyle] = useState<"seq" | "num">("seq");

  // Compute preview cameras list dynamically
  const previewCameras = React.useMemo(() => {
    if (massStart <= 0 || massEnd <= 0 || massStep <= 0 || massStart > massEnd) {
      return [];
    }
    const list = [];
    let counter = 1;
    const limit = 200; // safety limit to prevent freezing
    let iterations = 0;
    for (let num = massStart; num <= massEnd && iterations < limit; num += massStep) {
      iterations++;
      const rootPath = `${massPrefix}${num}`;
      const name = massNamingStyle === "seq" ? `${massNamePrefix} ${counter}` : `${massNamePrefix} ${num}`;
      list.push({
        name,
        root: rootPath,
      });
      counter++;
    }
    return list;
  }, [massPrefix, massStart, massEnd, massStep, massNamePrefix, massNamingStyle]);

  const handleGenerateMassCameras = () => {
    if (previewCameras.length === 0) {
      openErrorOverlay("Камерын тохиргоог зөв оруулна уу");
      return;
    }

    const nextCams = previewCameras.map((p, idx) => ({
      id: `cam-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      name: p.name,
      ip: cameraIp || "",
      port: Number(cameraPort) || 554,
      username: cameraUsername || "admin",
      password: cameraPassword || "Admin123",
      root: p.root,
      enabled: true,
      residentVisible: false,
    }));

    setActiveCameras((prev) => [...prev, ...nextCams]);
    setIsMassAddOpen(false);
    openSuccessOverlay(`${nextCams.length} камер амжилттай үүсгэлээ`);
  };

  // Building-level NVR settings
  const [cameraIp, setCameraIp] = useState("");
  const [cameraPort, setCameraPort] = useState(554);
  const [cameraUsername, setCameraUsername] = useState("admin");
  const [cameraPassword, setCameraPassword] = useState("Admin123");

  // Load all buildings once
  const loadBuildings = useCallback(async () => {
    if (!token || !effectiveBaiguullagiinId) return;
    try {
      setLoading(true);
      const res = await uilchilgee(token).get(
        `/baiguullaga/${effectiveBaiguullagiinId}`
      );
      return res.data?.barilguud || [];
    } catch (e) {
      aldaaBarigch(e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, effectiveBaiguullagiinId]);

  const refreshBuildings = useCallback(async () => {
    const barilguud = await loadBuildings();
    if (!barilguud) return;
    setBuildings(barilguud);
  }, [loadBuildings]);

  useEffect(() => {
    refreshBuildings();
  }, [refreshBuildings]);

  // Auto-follow the globally selected building
  useEffect(() => {
    if (buildings.length === 0) return;
    const target = selectedBuildingId || buildings[0]?._id || "";
    setSelectedBarilgiinId(target);
  }, [selectedBuildingId, buildings]);

  // When selected building changes, load its cameras and NVR defaults
  useEffect(() => {
    if (!selectedBarilgiinId || buildings.length === 0) return;
    const b = buildings.find((x: any) => x._id === selectedBarilgiinId);
    setSohCameras((b?.sohCameruud ?? []) as CameraConfig[]);
    setCameraIp(b?.cameraIp ?? "");
    setCameraPort(b?.cameraPort ?? 554);
    setCameraUsername(b?.cameraUsername ?? "admin");
    setCameraPassword(b?.cameraPassword ?? "Admin123");
  }, [selectedBarilgiinId, buildings]);

  const handleAddCamera = () => {
    const next = defaultCamera();
    next.id = `cam-${activeCameras.length + 1}`;
    next.name = `Камер ${activeCameras.length + 1}`;
    setActiveCameras((prev) => [...prev, next]);
  };

  const handleChange = (idx: number, updated: CameraConfig) => {
    setActiveCameras((prev) => prev.map((c, i) => (i === idx ? updated : c)));
  };

  const handleRemove = (idx: number) => {
    setActiveCameras((prev) => prev.filter((_, i) => i !== idx));
  };


  const handleSave = async () => {
    if (!token || !effectiveBaiguullagiinId || !selectedBarilgiinId) {
      openErrorOverlay("Барилга сонгоно уу");
      return;
    }

    // Validate NVR IP if cameras are configured
    if ((sohCameras.length > 0 || residentCameras.length > 0) && !cameraIp.trim()) {
      openErrorOverlay("Холболтын үндсэн IP хаяг бөглөнө үү");
      return;
    }

    try {
      setSaving(true);

      const b = buildings.find((x: any) => x._id === selectedBarilgiinId);
      const oldIp = b?.cameraIp ?? "";
      const oldPort = b?.cameraPort ?? 554;
      const oldUsername = b?.cameraUsername ?? "admin";
      const oldPassword = b?.cameraPassword ?? "Admin123";

      const nextSohCameras = sohCameras.map(cam => {
        const updated = { ...cam };
        if (!updated.ip || updated.ip === oldIp) {
          updated.ip = cameraIp;
        }
        if (!updated.port || updated.port === oldPort) {
          updated.port = Number(cameraPort) || 554;
        }
        if (!updated.username || updated.username === oldUsername) {
          updated.username = cameraUsername;
        }
        if (!updated.password || updated.password === oldPassword) {
          updated.password = cameraPassword;
        }
        return updated;
      });

      const nextResidentCameras = nextSohCameras.filter((c) => c.residentVisible);

      // Build updated barilguud array
      const updatedBarilguud = buildings.map((b: any) => {
        if (b._id === selectedBarilgiinId) {
          return {
            ...b,
            cameraIp,
            cameraPort: Number(cameraPort) || 554,
            cameraUsername,
            cameraPassword,
            cameruud: nextResidentCameras,
            sohCameruud: nextSohCameras,
          };
        }
        return b;
      });

      await uilchilgee(token).post(
        `/baiguullaga/${effectiveBaiguullagiinId}`,
        { barilguud: updatedBarilguud }
      );

      // Refresh local buildings data
      const freshBuildings = await loadBuildings();
      if (freshBuildings) setBuildings(freshBuildings);
      openSuccessOverlay("Камерын тохиргоо амжилттай хадгалагдлаа");
    } catch (e) {
      aldaaBarigch(e);
    } finally {
      setSaving(false);
    }
  };

  const selectedBuilding = buildings.find(
    (b: any) => b._id === selectedBarilgiinId
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-theme/10">
          <Video className="w-5 h-5 text-[color:var(--theme)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[color:var(--panel-text)]">
            Камерийн тохиргоо
          </h2>
          <p className="text-sm text-[color:var(--muted-text)]">
            Барилга тус бүрийн хяналтын камеруудыг тохируулна уу
          </p>
        </div>
      </div>

      {/* Building selector */}
      {buildings.length > 1 && (
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[color:var(--panel-text)]">
            Барилга сонгох
          </label>
          <select
            value={selectedBarilgiinId}
            onChange={(e) => setSelectedBarilgiinId(e.target.value)}
            className={INPUT_CLS}
          >
            {buildings.map((b: any) => (
              <option key={b._id} value={b._id}>
                {b.ner || b._id}
              </option>
            ))}
          </select>
        </div>
      )}

      {buildings.length === 1 && selectedBuilding && (
        <div className="px-4 py-2.5 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]">
          <p className="text-sm text-[color:var(--panel-text)] font-semibold">
            {selectedBuilding.ner}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-theme" />
        </div>
      ) : !selectedBarilgiinId ? (
        <div className="flex flex-col items-center justify-center py-16 text-[color:var(--muted-text)]">
          <VideoOff className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">Барилга олдсонгүй</p>
        </div>
      ) : (
        <>
          {/* Холболтын үндсэн мэдээлэл */}
          <div className="p-4 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] space-y-4">
            <h3 className="text-sm font-semibold text-[color:var(--panel-text)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[color:var(--theme)]" />
              Холболтын үндсэн мэдээлэл (NVR)
            </h3>
            <p className="text-xs text-[color:var(--muted-text)]">
              Камер бүрт тусад нь IP хаяг тохируулах шаардлагагүй бөгөөд тухайн барилгын үндсэн холболтын хаягийг энд оруулна.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                  IP хаяг
                </label>
                <input
                  type="text"
                  value={cameraIp}
                  onChange={(e) => setCameraIp(e.target.value)}
                  placeholder="192.168.1.228"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                  RTSP Порт
                </label>
                <input
                  type="number"
                  value={cameraPort}
                  onChange={(e) => setCameraPort(Number(e.target.value) || 554)}
                  placeholder="554"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                  Нэвтрэх нэр
                </label>
                <input
                  type="text"
                  value={cameraUsername}
                  onChange={(e) => setCameraUsername(e.target.value)}
                  placeholder="admin"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                  Нууц үг
                </label>
                <input
                  type="password"
                  value={cameraPassword}
                  onChange={(e) => setCameraPassword(e.target.value)}
                  placeholder="Admin123"
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex border-b border-[color:var(--surface-border)]">
            <button
              type="button"
              onClick={() => setActiveTab("soh")}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${activeTab === "soh"
                ? "border-theme text-[color:var(--theme)] font-bold"
                : "border-transparent text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                }`}
            >
              СӨХ-ийн харах камер ({sohCameras.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("resident")}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${activeTab === "resident"
                ? "border-theme text-[color:var(--theme)] font-bold"
                : "border-transparent text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                }`}
            >
              Оршин суугчдын харах камер ({residentCameras.length})
            </button>
          </div>

          {/* Add camera buttons — top */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAddCamera}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 border-dashed border-theme/30 text-[color:var(--theme)] hover:bg-theme/5 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Камер нэмэх
            </button>
            <button
              type="button"
              onClick={() => setIsMassAddOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4 text-[color:var(--theme)]" />
              Олноор нэмэх
            </button>
          </div>

          {/* Camera list — scrollable container showing ~5 rows */}
          <div className="rounded-2xl border border-[color:var(--surface-border)] overflow-hidden">
            <div className="overflow-y-auto custom-scrollbar max-h-[340px] p-3 space-y-3">
              {activeCameras.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-3xl border-2 border-dashed border-[color:var(--surface-border)] text-[color:var(--muted-text)]">
                  <VideoOff className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">Камер нэмэгдээгүй байна</p>
                  <p className="text-xs mt-1 opacity-70">Дээрх товчийг дарж камер нэмнэ үү</p>
                </div>
              ) : (
                activeCameras.map((cam, idx) => (
                  <CameraRow
                    key={cam.id + idx}
                    cam={cam}
                    index={idx}
                    onChange={(updated) => handleChange(idx, updated)}
                    onRemove={() => handleRemove(idx)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[color:var(--surface-border)]">
            <p className="text-sm text-[color:var(--muted-text)]">
              Нийт{" "}
              <span className="font-semibold text-[color:var(--panel-text)]">
                {activeCameras.length}
              </span>{" "}
              камер,{" "}
              <span className="font-semibold text-[color:var(--panel-text)]">
                {activeCameras.filter((c) => c.enabled).length}
              </span>{" "}
              идэвхтэй
            </p>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Хадгалах
            </Button>
          </div>

          {/* Mass Add Modal */}
          {isMassAddOpen && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsMassAddOpen(false)}
              />
              <div
                className="relative w-full max-w-2xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[color:var(--surface-border)] flex items-center justify-between bg-[color:var(--surface-bg)]">
                  <h3 className="font-bold text-sm text-[color:var(--panel-text)] uppercase tracking-wider">
                    Олноор камер нэмэх
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsMassAddOpen(false)}
                    className="p-1 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)]"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                        Угтвар зам (Prefix)
                      </label>
                      <input
                        type="text"
                        value={massPrefix}
                        onChange={(e) => setMassPrefix(e.target.value)}
                        className={INPUT_CLS}
                        placeholder="Streaming/Channels/"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                        Эхлэх суваг / дугаар
                      </label>
                      <input
                        type="number"
                        value={massStart}
                        onChange={(e) => setMassStart(Number(e.target.value) || 0)}
                        className={INPUT_CLS}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                        Дуусах суваг / дугаар
                      </label>
                      <input
                        type="number"
                        value={massEnd}
                        onChange={(e) => setMassEnd(Number(e.target.value) || 0)}
                        className={INPUT_CLS}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                        Алхам (Step)
                      </label>
                      <input
                        type="number"
                        value={massStep}
                        onChange={(e) => setMassStep(Number(e.target.value) || 1)}
                        className={INPUT_CLS}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                        Нэрний угтвар
                      </label>
                      <input
                        type="text"
                        value={massNamePrefix}
                        onChange={(e) => setMassNamePrefix(e.target.value)}
                        className={INPUT_CLS}
                      />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
                        Нэрлэх хэлбэр (Naming style)
                      </label>
                      <select
                        value={massNamingStyle}
                        onChange={(e) => setMassNamingStyle(e.target.value as "seq" | "num")}
                        className={INPUT_CLS}
                      >
                        <option value="seq">Дарааллаар (Камер 1, Камер 2...)</option>
                        <option value="num">Сувгийн дугаараар (Камер 102, Камер 202...)</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[color:var(--panel-text)]">
                      Үүсэх камеруудын жагсаалт ({previewCameras.length} камер)
                    </p>
                    <div className="max-h-40 overflow-y-auto p-3 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] space-y-1.5 custom-scrollbar font-mono text-[10px]">
                      {previewCameras.length === 0 ? (
                        <p className="text-center text-[color:var(--muted-text)] py-4">Эхлэх/дуусах дугааруудыг зөв оруулна уу</p>
                      ) : (
                        previewCameras.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 border-b border-[color:var(--surface-border)]/50 last:border-b-0">
                            <span className="text-[color:var(--panel-text)] font-semibold">{p.name}</span>
                            <span className="text-[color:var(--muted-text)]">{p.root}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[color:var(--surface-border)] flex justify-end gap-3 bg-[color:var(--surface-bg)]">
                  <button
                    type="button"
                    onClick={() => setIsMassAddOpen(false)}
                    className="px-5 py-2 rounded-full border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors text-xs font-semibold text-[color:var(--panel-text)]"
                  >
                    Цуцлах
                  </button>
                  <Button
                    variant="primary"
                    onClick={handleGenerateMassCameras}
                    disabled={previewCameras.length === 0}
                  >
                    Үүсгэх ({previewCameras.length})
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
