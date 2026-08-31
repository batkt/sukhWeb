"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Video,
  VideoOff,
  Plus,
  Trash2,
  Save,
  Sliders,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Loader } from "@mantine/core";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";

/// Values the camera schema used to default to. They are placeholders, not
/// credentials, so a row still carrying them counts as "not configured".
const LEGACY_PLACEHOLDER_USERNAME = "admin";
const LEGACY_PLACEHOLDER_PASSWORD = "Admin123";
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
  password: "",
  root: "Streaming/Channels/102",
  enabled: true,
  residentVisible: false,
});

const INPUT_CLS =
  "w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] text-sm";

/**
 * Нэг камерын засварын дэлгэц.
 *
 * Өмнө нь мөр бүр өөрөө задардаг (accordion) байсныг Зогсоолын тохиргоотой
 * ижил болгож, жагсаалт → маягт гэсэн хоёр горимд хуваав. Ингэснээр жагсаалт
 * нь зөвхөн харах зориулалттай нягт хүснэгт хэвээр үлдэнэ.
 */
function CameraForm({
  cam,
  onChange,
}: {
  cam: CameraConfig;
  onChange: (cam: CameraConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label
          style={{ borderRadius: "10px" }}
          className="flex items-center justify-between gap-3 px-4 py-3 border border-[color:var(--surface-border)] cursor-pointer"
        >
          <span className="text-sm text-[color:var(--panel-text)]">
            Идэвхтэй
            <span className="block text-xs text-[color:var(--muted-text)]">
              Унтраасан камер хяналтад харагдахгүй
            </span>
          </span>
          <input
            type="checkbox"
            checked={cam.enabled}
            onChange={(e) => onChange({ ...cam, enabled: e.target.checked })}
            className="w-4 h-4 accent-emerald-600 shrink-0"
          />
        </label>

        <label
          style={{ borderRadius: "10px" }}
          className="flex items-center justify-between gap-3 px-4 py-3 border border-[color:var(--surface-border)] cursor-pointer"
        >
          <span className="text-sm text-[color:var(--panel-text)]">
            Оршин суугч харна
            <span className="block text-xs text-[color:var(--muted-text)]">
              Оршин суугчийн апп дээр гарч ирнэ
            </span>
          </span>
          <input
            type="checkbox"
            checked={cam.residentVisible}
            onChange={(e) =>
              onChange({ ...cam, residentVisible: e.target.checked })
            }
            className="w-4 h-4 accent-blue-600 shrink-0"
          />
        </label>
      </div>
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

  // Зогсоолын тохиргоотой ижил: жагсаалт / маягт гэсэн хоёр горим.
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);

  const editingCamera = sohCameras.find((c) => c.id === editingId) || null;

  const TABS: ["soh" | "resident", number][] = [
    ["soh", sohCameras.length],
    ["resident", residentCameras.length],
  ];

  const totalPages = Math.ceil(activeCameras.length / pageSize);
  const paginatedCameras = activeCameras.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Таб солих буюу камер устгахад хуудас хүрээнээс гарч хоосон харагдахаас
  // сэргийлж буцаана.
  useEffect(() => {
    if (page > 1 && page > totalPages) setPage(Math.max(1, totalPages));
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedBarilgiinId]);

  // Хуудасны хэмжээний сонголтыг гадна дарахад хаана.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".page-size-selector")) setIsPageSizeOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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
      password: cameraPassword || "",
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
  const [cameraPassword, setCameraPassword] = useState("");

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
    setCameraPassword(
      b?.cameraPassword && b.cameraPassword !== LEGACY_PLACEHOLDER_PASSWORD
        ? b.cameraPassword
        : "",
    );
  }, [selectedBarilgiinId, buildings]);

  const handleAddCamera = () => {
    const next = defaultCamera();
    next.id = `cam-${sohCameras.length + 1}`;
    next.name = `Камер ${sohCameras.length + 1}`;
    setActiveCameras((prev) => [...prev, next]);
    setEditingId(next.id);
    setView("form");
  };

  /**
   * Индексээр биш `id`-гаар шинэчилнэ.
   *
   * "Оршин суугчдын харах камер" таб дээрх жагсаалт нь `sohCameras`-ыг
   * шүүсэн массив тул түүний индекс эх массивын индекстэй таарахгүй. Өмнө нь
   * индексээр засдаг байсан учир энэ таб дээр өөр камер засагдаж/устдаг байв.
   */
  const handleChange = (id: string, updated: CameraConfig) => {
    setActiveCameras((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleRemove = (id: string) => {
    setActiveCameras((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setView("list");
    }
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
      const oldPassword = b?.cameraPassword ?? "";

      const nextSohCameras = sohCameras.map(cam => {
        const updated = { ...cam };
        if (!updated.ip || updated.ip === oldIp) {
          updated.ip = cameraIp;
        }
        if (!updated.port || updated.port === oldPort) {
          updated.port = Number(cameraPort) || 554;
        }
        // Also treat the legacy schema placeholder as unset. The old
        // condition compared only against the building's *saved* value, so
        // once that value changed, a row still holding "Admin123" matched
        // neither branch and could never be updated again - the building
        // password appeared to save while the row silently kept sending the
        // placeholder to the NVR.
        if (
          !updated.username ||
          updated.username === oldUsername ||
          updated.username === LEGACY_PLACEHOLDER_USERNAME
        ) {
          updated.username = cameraUsername;
        }
        if (
          !updated.password ||
          updated.password === oldPassword ||
          updated.password === LEGACY_PLACEHOLDER_PASSWORD
        ) {
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

  // ── Маягтын горим — Зогсоолын тохиргоотой ижил бүтэц ────────────────────
  if (view === "form" && editingCamera) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)]">
            <div>
              <h2 className="text-lg text-[color:var(--panel-text)] tracking-tight">
                Камер засах
              </h2>
              <p className="text-xs text-[color:var(--muted-text)]">
                ID: {editingCamera.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleRemove(editingCamera.id)}
                variant="ghost"
                size="sm"
                style={{ borderRadius: "10px" }}
                className="px-3 !text-rose-600 dark:!text-rose-400"
              >
                Устгах
              </Button>
              <Button
                onClick={() => {
                  setView("list");
                  setEditingId(null);
                }}
                variant="primary"
                size="sm"
                style={{ borderRadius: "10px" }}
                className="px-4"
              >
                Болсон
              </Button>
            </div>
          </div>

          <CameraForm
            cam={editingCamera}
            onChange={(updated) => handleChange(editingCamera.id, updated)}
          />

          <p className="text-xs text-[color:var(--muted-text)] pt-2 border-t border-[color:var(--surface-border)]">
            Өөрчлөлт жагсаалтад шууд тусна. Эцэслэн хадгалахын тулд жагсаалт руу
            буцаж{" "}
            <span className="text-[color:var(--panel-text)]">Хадгалах</span>{" "}
            товчийг дарна уу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] p-4 sm:p-5 space-y-4">
        {/* ── Толгой мөр + хэмжигдэхүүнүүд ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[color:var(--surface-border)]">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <h2 className="text-xl text-[color:var(--panel-text)] tracking-tight">
                Камерийн тохиргоо
              </h2>
              <p className="text-xs text-[color:var(--muted-text)]">
                Нийт{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {sohCameras.length}
                </span>{" "}
                камер тохируулагдсан
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span
                style={{ borderRadius: "10px" }}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-medium"
              >
                Нийт камер:{" "}
                <span className="text-blue-700 dark:text-blue-400 font-semibold">
                  {sohCameras.length}
                </span>
              </span>
              <span
                style={{ borderRadius: "10px" }}
                className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 font-medium"
              >
                Идэвхтэй:{" "}
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                  {sohCameras.filter((c) => c.enabled).length}
                </span>
              </span>
              <span
                style={{ borderRadius: "10px" }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border border-blue-300 dark:border-blue-700 font-medium"
              >
                Оршин суугч харах:{" "}
                <span className="text-blue-800 dark:text-blue-300 font-semibold">
                  {residentCameras.length}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setIsMassAddOpen(true)}
              variant="ghost"
              size="sm"
              style={{ borderRadius: "10px" }}
              className="px-3 border border-slate-200 dark:border-white/10"
            >
              Олноор нэмэх
            </Button>
            <Button
              onClick={handleAddCamera}
              variant="primary"
              size="sm"
              style={{ borderRadius: "10px" }}
              className="px-4"
            >
              Шинэ камер нэмэх
            </Button>
          </div>
        </div>

        {/* ── Барилга ──────────────────────────────────────────────────── */}
        {buildings.length > 1 ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--muted-text)] uppercase tracking-wide">
              Барилга
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
        ) : (
          selectedBuilding && (
            <p className="text-xs text-[color:var(--muted-text)]">
              Барилга:{" "}
              <span className="text-[color:var(--panel-text)]">
                {selectedBuilding.ner}
              </span>
            </p>
          )
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader size="md" />
            <span className="text-xs text-[color:var(--muted-text)]">
              Мэдээлэл уншиж байна...
            </span>
          </div>
        ) : !selectedBarilgiinId ? (
          <div className="flex flex-col items-center justify-center py-16 text-[color:var(--muted-text)]">
            <VideoOff className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Барилга олдсонгүй</p>
          </div>
        ) : (
          <>
            {/* ── NVR холболт ──────────────────────────────────────────── */}
            <div
              style={{ borderRadius: "14px" }}
              className="border border-[color:var(--surface-border)] p-4 space-y-3"
            >
              <div>
                <h3 className="text-sm text-[color:var(--panel-text)] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[color:var(--theme)]" />
                  Холболтын үндсэн мэдээлэл (NVR)
                </h3>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  Камер бүрт тусад нь IP хаяг тохируулах шаардлагагүй бөгөөд
                  тухайн барилгын үндсэн холболтын хаягийг энд оруулна.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                    RTSP порт
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

            {/* ── Таб ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {TABS.map(([key, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{ borderRadius: "10px" }}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    activeTab === key
                      ? "bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border-blue-300 dark:border-blue-700 font-semibold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
                  }`}
                >
                  {key === "soh" ? "СӨХ-ийн харах камер" : "Оршин суугчдын харах камер"} ({count})
                </button>
              ))}
            </div>

            {/* ── Хүснэгт ──────────────────────────────────────────────── */}
            <div
              style={{ borderRadius: "14px" }}
              className="border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-[color:var(--surface-border)]">
                    <tr>
                      <th className="px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-center w-12">
                        №
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-left w-1/4">
                        Камерын нэр
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-left">
                        RTSP зам
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-center w-32">
                        Оршин суугч
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-center w-28">
                        Төлөв
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-center w-24">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--surface-border)]">
                    {paginatedCameras.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-16 text-center text-[color:var(--muted-text)]"
                        >
                          <div>
                            <p className="text-slate-700 dark:text-slate-200">
                              {activeTab === "soh"
                                ? "Камер нэмэгдээгүй байна"
                                : "Оршин суугчид харагдах камер алга"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {activeTab === "soh"
                                ? "Дээрх «Шинэ камер нэмэх» товчийг дарж камер тохируулна уу"
                                : "Камер засах цонхноос «Оршин суугч харна» тохиргоог асаана уу"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedCameras.map((cam, index) => (
                        <tr
                          key={cam.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-center text-slate-500 dark:text-slate-400 text-xs">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-slate-800 dark:text-slate-100">
                              {cam.name || "Нэргүй камер"}
                            </span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {cam.id}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              style={{ borderRadius: "8px" }}
                              className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] font-mono border border-slate-300 dark:border-slate-700 break-all"
                            >
                              rtsp://{cam.ip || cameraIp || "—"}:
                              {cam.port || cameraPort}/{cam.root}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleChange(cam.id, {
                                  ...cam,
                                  residentVisible: !cam.residentVisible,
                                })
                              }
                              style={{ borderRadius: "8px" }}
                              title="Оршин суугчид харуулах эсэхийг сольно"
                              className={`inline-flex items-center px-3 py-1 text-xs border transition-colors ${
                                cam.residentVisible
                                  ? "bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border-blue-300 dark:border-blue-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {cam.residentVisible ? "Харна" : "Харахгүй"}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleChange(cam.id, {
                                  ...cam,
                                  enabled: !cam.enabled,
                                })
                              }
                              style={{ borderRadius: "8px" }}
                              title="Идэвхтэй эсэхийг сольно"
                              className={`inline-flex items-center px-3 py-1 text-xs border transition-colors ${
                                cam.enabled
                                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {cam.enabled ? "Идэвхтэй" : "Идэвхгүй"}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingId(cam.id);
                                  setView("form");
                                }}
                                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                title="Засах"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemove(cam.id)}
                                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                title="Устгах"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Хуудаслалт ───────────────────────────────────────────── */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 border-t border-[color:var(--surface-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[color:var(--panel-text)]">
                    Нийт <span>{activeCameras.length}</span> камер
                  </span>

                  <div className="relative page-size-selector">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                      className="!rounded-xl border border-slate-200 dark:border-white/10"
                    >
                      {pageSize} / хуудас
                    </Button>
                    {isPageSizeOpen && (
                      <div className="absolute bottom-full mb-2 left-0 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-2xl shadow-xl z-20 min-w-[110px] overflow-hidden p-1">
                        {[10, 20, 50, 100, 500].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setPageSize(size);
                              setPage(1);
                              setIsPageSizeOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 rounded-xl text-left text-xs transition-colors ${
                              pageSize === size
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="!rounded-xl border border-slate-200 dark:border-white/10"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Өмнөх
                  </Button>
                  <span className="text-xs text-[color:var(--panel-text)] px-3">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="!rounded-xl border border-slate-200 dark:border-white/10"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Дараах
                  </Button>
                </div>
              </div>
            )}

            {/* ── Хадгалах ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[color:var(--surface-border)]">
              <p className="text-xs text-[color:var(--muted-text)]">
                Өөрчлөлт зөвхөн Хадгалах товч дарсны дараа сервер рүү илгээгдэнэ.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={saving}
                style={{ borderRadius: "10px" }}
                className="px-4"
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
    </div>
  );
}
