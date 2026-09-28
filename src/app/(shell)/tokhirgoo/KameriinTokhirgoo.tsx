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
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { SettingsCard, SettingsField, SettingsItem, Switch } from "./SettingsRow";

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

const INPUT_CLS = "stg-input";

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
    <div className="space-y-5">
      <div className="stg-grid">
        <SettingsField label="Камерын нэр">
          <input
            type="text"
            value={cam.name}
            onChange={(e) => onChange({ ...cam, name: e.target.value })}
            placeholder="Камер 1"
            className={INPUT_CLS}
          />
        </SettingsField>

        <SettingsField label="Камерын ID">
          <input
            type="text"
            value={cam.id}
            onChange={(e) => onChange({ ...cam, id: e.target.value })}
            placeholder="cam-1"
            className={INPUT_CLS}
          />
        </SettingsField>
      </div>

      <SettingsField label="RTSP зам (root)">
        <input
          type="text"
          value={cam.root}
          onChange={(e) => onChange({ ...cam, root: e.target.value })}
          placeholder="Streaming/Channels/102"
          className={INPUT_CLS}
        />
        <p className="text-[13px] leading-relaxed text-[color:var(--muted-text)]">
          Жишээ:{" "}
          <span className="font-mono">Streaming/Channels/102</span>,{" "}
          <span className="font-mono">Streaming/Channels/202</span> ...
        </p>
      </SettingsField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SettingsItem
          title="Идэвхтэй"
          desc="Унтраасан камер хяналтад харагдахгүй"
          control={
            <Switch
              checked={cam.enabled}
              onChange={(e) => onChange({ ...cam, enabled: e.target.checked })}
              label="Идэвхтэй"
            />
          }
        />
        <SettingsItem
          title="Оршин суугч харна"
          desc="Оршин суугчийн апп дээр гарч ирнэ"
          control={
            <Switch
              checked={cam.residentVisible}
              onChange={(e) =>
                onChange({ ...cam, residentVisible: e.target.checked })
              }
              label="Оршин суугч харна"
            />
          }
        />
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
  const [pageSize, setPageSize] = useState(500);
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
  const kameriinColumns: ColumnsType<any> = React.useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Камерын нэр",
        key: "name",
        width: 240,
        render: (_: any, cam: any) => (
          <>
            <span className="text-[color:var(--panel-text)]">{cam.name || "Нэргүй камер"}</span>
            <span className="block font-mono text-[13px] text-[color:var(--muted-text)]">
              {cam.id}
            </span>
          </>
        ),
      },
      {
        title: "RTSP зам",
        key: "rtsp",
        render: (_: any, cam: any) => (
          <span className="inline-flex items-center break-all rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-2.5 py-1 text-[13px] font-mono">
            rtsp://{cam.ip || cameraIp || "—"}:{cam.port || cameraPort}/
            {cam.root}
          </span>
        ),
      },
      {
        title: "Оршин суугч",
        key: "residentVisible",
        width: 130,
        align: "center",
        render: (_: any, cam: any) => (
          <button
            type="button"
            onClick={() =>
              handleChange(cam.id, {
                ...cam,
                residentVisible: !cam.residentVisible,
              })
            }
            title="Оршин суугчид харуулах эсэхийг сольно"
            className={`inline-flex items-center min-h-8 rounded-lg border px-3 py-1 text-[13px] transition-colors hover:border-theme/40 ${
              cam.residentVisible
                ? "border-theme/30 bg-theme/10 text-brand"
                : "border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
            }`}
          >
            {cam.residentVisible ? "Харна" : "Харахгүй"}
          </button>
        ),
      },
      {
        title: "Төлөв",
        key: "enabled",
        width: 120,
        align: "center",
        render: (_: any, cam: any) => (
          <button
            type="button"
            onClick={() => handleChange(cam.id, { ...cam, enabled: !cam.enabled })}
            title="Идэвхтэй эсэхийг сольно"
            className={`inline-flex items-center min-h-8 rounded-lg border px-3 py-1 text-[13px] transition-colors hover:border-theme/40 ${
              cam.enabled
                ? "border-theme/30 bg-theme/10 text-brand"
                : "border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
            }`}
          >
            {cam.enabled ? "Идэвхтэй" : "Идэвхгүй"}
          </button>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 96,
        align: "center",
        render: (_: any, cam: any) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => {
                setEditingId(cam.id);
                setView("form");
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand transition-colors hover:bg-theme/10"
              title="Засах"
              aria-label="Засах"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRemove(cam.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10"
              title="Устгах"
              aria-label="Устгах"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
     
    [page, pageSize, cameraIp, cameraPort, handleChange, handleRemove],
  );

  if (view === "form" && editingCamera) {
    return (
      <div className="w-full">
        <SettingsCard
          icon={<Video className="h-4 w-4" />}
          title="Камер засах"
          subtitle={`ID: ${editingCamera.id}`}
          toggle={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRemove(editingCamera.id)}
                className="stg-btn stg-btn-ghost !text-danger"
              >
                <Trash2 className="h-4 w-4" />
                Устгах
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  setEditingId(null);
                }}
                className="stg-btn stg-btn-primary"
              >
                Болсон
              </button>
            </div>
          }
        >
          <CameraForm
            cam={editingCamera}
            onChange={(updated) => handleChange(editingCamera.id, updated)}
          />

          <p className="mt-5 pt-4 border-t border-[color:var(--surface-border)] text-[13px] leading-relaxed text-[color:var(--muted-text)]">
            Өөрчлөлт жагсаалтад шууд тусна. Эцэслэн хадгалахын тулд жагсаалт руу
            буцаж{" "}
            <span className="text-[color:var(--panel-text)]">Хадгалах</span>{" "}
            товчийг дарна уу.
          </p>
        </SettingsCard>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Барилга ──────────────────────────────────────────────────── */}
      {buildings.length > 1 ? (
        <SettingsCard
          title="Барилга"
          subtitle="Аль барилгын камерыг тохируулахаа сонгоно уу"
        >
          <div className="max-w-md">
            <SettingsField label="Барилга">
              <select
                value={selectedBarilgiinId}
                onChange={(e) => setSelectedBarilgiinId(e.target.value)}
                className="stg-select"
              >
                {buildings.map((b: any) => (
                  <option key={b._id} value={b._id}>
                    {b.ner || b._id}
                  </option>
                ))}
              </select>
            </SettingsField>
          </div>
        </SettingsCard>
      ) : (
        selectedBuilding && (
          <p className="mb-4 text-[13px] text-[color:var(--muted-text)]">
            Барилга:{" "}
            <span className="text-[color:var(--panel-text)]">
              {selectedBuilding.ner}
            </span>
          </p>
        )
      )}

      {loading ? (
        <div className="stg-card flex flex-col items-center justify-center py-12 gap-3">
          <Loader size="md" />
          <span className="text-sm text-[color:var(--muted-text)]">
            Мэдээлэл уншиж байна...
          </span>
        </div>
      ) : !selectedBarilgiinId ? (
        <div className="stg-card flex flex-col items-center justify-center py-14 text-center text-[color:var(--muted-text)]">
          <VideoOff className="w-10 h-10 mb-3 opacity-50" />
          <p className="text-sm text-[color:var(--panel-text)]">
            Барилга олдсонгүй
          </p>
          <p className="mt-1 text-[13px]">
            Эхлээд барилга бүртгэсний дараа камер тохируулах боломжтой.
          </p>
        </div>
      ) : (
        <>
          {/* ── NVR холболт ──────────────────────────────────────────── */}
          <SettingsCard
            icon={<Sliders className="h-4 w-4" />}
            title="Холболтын үндсэн мэдээлэл (NVR)"
            subtitle="Камер бүрт тусад нь IP хаяг оруулах шаардлагагүй. Тухайн барилгын үндсэн холболтын хаягийг энд оруулна."
          >
            <div className="stg-grid">
              <SettingsField label="IP хаяг">
                <input
                  type="text"
                  value={cameraIp}
                  onChange={(e) => setCameraIp(e.target.value)}
                  placeholder="192.168.1.228"
                  className={INPUT_CLS}
                />
              </SettingsField>
              <SettingsField label="RTSP порт">
                <input
                  type="number"
                  value={cameraPort}
                  onChange={(e) => setCameraPort(Number(e.target.value) || 554)}
                  placeholder="554"
                  className={INPUT_CLS}
                />
              </SettingsField>
              <SettingsField label="Нэвтрэх нэр">
                <input
                  type="text"
                  value={cameraUsername}
                  onChange={(e) => setCameraUsername(e.target.value)}
                  placeholder="admin"
                  className={INPUT_CLS}
                />
              </SettingsField>
              <SettingsField label="Нууц үг">
                <input
                  type="password"
                  value={cameraPassword}
                  onChange={(e) => setCameraPassword(e.target.value)}
                  placeholder="Admin123"
                  className={INPUT_CLS}
                />
              </SettingsField>
            </div>
          </SettingsCard>

          {/* ── Камерын жагсаалт ─────────────────────────────────────── */}
          <SettingsCard
            icon={<Video className="h-4 w-4" />}
            title="Камерууд"
            subtitle={
              <>
                Нийт {sohCameras.length} камер · Идэвхтэй{" "}
                {sohCameras.filter((c) => c.enabled).length} · Оршин суугч
                харах {residentCameras.length}
              </>
            }
            toggle={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMassAddOpen(true)}
                  className="stg-btn stg-btn-ghost"
                >
                  Олноор нэмэх
                </button>
                <button
                  type="button"
                  onClick={handleAddCamera}
                  className="stg-btn stg-btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Шинэ камер нэмэх
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              {/* ── Таб ──────────────────────────────────────────────── */}
              <div className="stg-segment flex-wrap">
                {TABS.map(([key, count]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`min-h-10 ${
                      activeTab === key
                        ? "stg-segment-item is-active"
                        : "stg-segment-item"
                    }`}
                  >
                    {key === "soh" ? "СӨХ-ийн харах камер" : "Оршин суугчдын харах камер"} ({count})
                  </button>
                ))}
              </div>

              {/* ── Хүснэгт ──────────────────────────────────────────── */}
              <Table<any>
                columns={kameriinColumns}
                dataSource={paginatedCameras}
                rowKey={(cam) => cam.id}
                pagination={false}
                scroll={{ x: "max-content" }}
                locale={{
                  emptyText: (
                    <div className="py-4">
                      <p className="text-sm text-[color:var(--panel-text)]">
                        {activeTab === "soh"
                          ? "Камер нэмэгдээгүй байна"
                          : "Оршин суугчид харагдах камер алга"}
                      </p>
                      <p className="mt-1 text-[13px] text-[color:var(--muted-text)]">
                        {activeTab === "soh"
                          ? "Дээрх «Шинэ камер нэмэх» товчийг дарж камер тохируулна уу"
                          : "Камер засах цонхноос «Оршин суугч харна» тохиргоог асаана уу"}
                      </p>
                    </div>
                  ),
                }}
              />

              {/* ── Хуудаслалт ───────────────────────────────────────── */}
              {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[color:var(--surface-border)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[color:var(--muted-text)]">
                      Нийт{" "}
                      <span className="text-[color:var(--panel-text)]">
                        {activeCameras.length}
                      </span>{" "}
                      камер
                    </span>

                    <div className="relative page-size-selector">
                      <button
                        type="button"
                        onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                        className="stg-btn stg-btn-ghost"
                      >
                        {pageSize} / хуудас
                      </button>
                      {isPageSizeOpen && (
                        <div className="absolute bottom-full mb-2 left-0 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-xl shadow-md z-20 min-w-[120px] overflow-hidden p-1">
                          {[10, 20, 50, 100, 500].map((size) => (
                            <button
                              key={size}
                              onClick={() => {
                                setPageSize(size);
                                setPage(1);
                                setIsPageSizeOpen(false);
                              }}
                              className={`w-full h-9 px-3 rounded-lg text-left text-sm transition-colors ${
                                pageSize === size
                                  ? "bg-theme/10 text-brand"
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
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="stg-btn stg-btn-ghost"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Өмнөх
                    </button>
                    <span className="text-sm text-[color:var(--panel-text)] px-2">
                      {page} / {totalPages || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="stg-btn stg-btn-ghost"
                    >
                      Дараах
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* ── Хадгалах ─────────────────────────────────────────────── */}
          <div className="stg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[13px] leading-relaxed text-[color:var(--muted-text)]">
              Өөрчлөлт зөвхөн «Хадгалах» товч дарсны дараа сервер рүү илгээгдэнэ.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="stg-btn stg-btn-primary shrink-0"
            >
              {saving ? <Loader size="xs" color="white" /> : <Save className="w-4 h-4" />}
              Хадгалах
            </button>
          </div>

          {/* Mass Add Modal */}
          {isMassAddOpen && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsMassAddOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Олноор камер нэмэх"
                className="relative w-full max-w-2xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-2xl shadow-lg flex flex-col overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[color:var(--surface-border)] flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base text-[color:var(--panel-text)]">
                      Олноор камер нэмэх
                    </h3>
                    <p className="mt-0.5 text-[13px] text-[color:var(--muted-text)]">
                      Сувгийн дугаарын мужаар олон камер нэг дор үүсгэнэ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMassAddOpen(false)}
                    title="Хаах"
                    aria-label="Хаах"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)]"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SettingsField label="Угтвар зам (Prefix)" className="sm:col-span-2">
                      <input
                        type="text"
                        value={massPrefix}
                        onChange={(e) => setMassPrefix(e.target.value)}
                        className={INPUT_CLS}
                        placeholder="Streaming/Channels/"
                      />
                    </SettingsField>

                    <SettingsField label="Эхлэх суваг / дугаар">
                      <input
                        type="number"
                        value={massStart}
                        onChange={(e) => setMassStart(Number(e.target.value) || 0)}
                        className={INPUT_CLS}
                      />
                    </SettingsField>

                    <SettingsField label="Дуусах суваг / дугаар">
                      <input
                        type="number"
                        value={massEnd}
                        onChange={(e) => setMassEnd(Number(e.target.value) || 0)}
                        className={INPUT_CLS}
                      />
                    </SettingsField>

                    <SettingsField label="Алхам (Step)">
                      <input
                        type="number"
                        value={massStep}
                        onChange={(e) => setMassStep(Number(e.target.value) || 1)}
                        className={INPUT_CLS}
                      />
                    </SettingsField>

                    <SettingsField label="Нэрний угтвар">
                      <input
                        type="text"
                        value={massNamePrefix}
                        onChange={(e) => setMassNamePrefix(e.target.value)}
                        className={INPUT_CLS}
                      />
                    </SettingsField>

                    <SettingsField label="Нэрлэх хэлбэр" className="sm:col-span-2">
                      <select
                        value={massNamingStyle}
                        onChange={(e) => setMassNamingStyle(e.target.value as "seq" | "num")}
                        className="stg-select"
                      >
                        <option value="seq">Дарааллаар (Камер 1, Камер 2...)</option>
                        <option value="num">Сувгийн дугаараар (Камер 102, Камер 202...)</option>
                      </select>
                    </SettingsField>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <p className="text-sm text-[color:var(--panel-text)]">
                      Үүсэх камерууд ({previewCameras.length})
                    </p>
                    <div className="max-h-48 overflow-y-auto px-3 py-2 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] custom-scrollbar text-[13px]">
                      {previewCameras.length === 0 ? (
                        <p className="text-center text-[color:var(--muted-text)] py-4">
                          Эхлэх болон дуусах дугаарыг зөв оруулна уу
                        </p>
                      ) : (
                        previewCameras.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center gap-3 py-1.5 border-b border-[color:var(--surface-border)] last:border-b-0">
                            <span className="text-[color:var(--panel-text)]">{p.name}</span>
                            <span className="font-mono text-[color:var(--muted-text)]">{p.root}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[color:var(--surface-border)] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMassAddOpen(false)}
                    className="stg-btn stg-btn-ghost"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateMassCameras}
                    disabled={previewCameras.length === 0}
                    className="stg-btn stg-btn-primary"
                  >
                    Үүсгэх ({previewCameras.length})
                  </button>
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
