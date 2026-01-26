"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Plus, Edit, Trash2, Video, Power } from "lucide-react";
import { Modal as MModal, Button as MButton } from "@mantine/core";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";

interface Camera {
  _id?: string;
  ner: string;
  ipAddress: string;
  port: number;
  bairlal: string;
  status: "active" | "inactive";
  createdAt?: string;
}

export default function CameraKhyanalt() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [formData, setFormData] = useState<Camera>({
    ner: "",
    ipAddress: "",
    port: 80,
    bairlal: "",
    status: "active",
  });

  const shouldFetch =
    isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: camerasData, mutate } = useSWR(
    shouldFetch
      ? [
          "/zogsool/cameraKhyanalt",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
        ]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const cameras: Camera[] = camerasData?.jagsaalt || [];

  const handleAdd = () => {
    setEditingCamera(null);
    setFormData({
      ner: "",
      ipAddress: "",
      port: 80,
      bairlal: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      ner: camera.ner || "",
      ipAddress: camera.ipAddress || "",
      port: camera.port || 80,
      bairlal: camera.bairlal || "",
      status: camera.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    try {
      const payload = {
        ...formData,
        baiguullagiinId: ajiltan.baiguullagiinId,
        ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
      };

      if (editingCamera?._id) {
        await uilchilgee(token).put(
          `/zogsool/cameraKhyanalt/${editingCamera._id}`,
          payload
        );
      } else {
        await uilchilgee(token).post("/zogsool/cameraKhyanalt", payload);
      }

      mutate();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving camera:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Устгахдаа итгэлтэй байна уу?")) return;

    try {
      await uilchilgee(token).delete(`/zogsool/cameraKhyanalt/${id}`);
      mutate();
    } catch (error) {
      console.error("Error deleting camera:", error);
    }
  };

  const handleToggleStatus = async (camera: Camera) => {
    if (!token || !camera._id) return;

    try {
      const newStatus = camera.status === "active" ? "inactive" : "active";
      await uilchilgee(token).put(`/zogsool/cameraKhyanalt/${camera._id}`, {
        ...camera,
        status: newStatus,
      });
      mutate();
    } catch (error) {
      console.error("Error toggling camera status:", error);
    }
  };

  return (
    <div className="h-full overflow-hidden custom-scrollbar">
      <div className="min-h-full p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[color:var(--panel-text)]">
            Камерын хяналт
          </h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--theme)] text-white hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Камер нэмэх
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cameras.length === 0 ? (
            <div className="col-span-full neu-panel rounded-2xl p-8 text-center">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50 text-[color:var(--muted-text)]" />
              <p className="text-[color:var(--muted-text)]">
                Камерын мэдээлэл олдсонгүй
              </p>
            </div>
          ) : (
            cameras.map((camera) => (
              <div
                key={camera._id}
                className="neu-panel rounded-2xl p-4 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        camera.status === "active"
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <Video
                        className={`w-5 h-5 ${
                          camera.status === "active"
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[color:var(--panel-text)]">
                        {camera.ner}
                      </h3>
                      <p className="text-sm text-[color:var(--muted-text)]">
                        {camera.bairlal || "Байрлал тодорхойгүй"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(camera)}
                    className={`p-1.5 rounded-lg transition ${
                      camera.status === "active"
                        ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                    title={
                      camera.status === "active" ? "Идэвхгүй болгох" : "Идэвхжүүлэх"
                    }
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted-text)]">IP хаяг:</span>
                    <span className="text-[color:var(--panel-text)] font-mono">
                      {camera.ipAddress}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted-text)]">Порт:</span>
                    <span className="text-[color:var(--panel-text)] font-mono">
                      {camera.port}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted-text)]">Төлөв:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        camera.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {camera.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-[color:var(--surface-border)]">
                  <button
                    onClick={() => handleEdit(camera)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition"
                  >
                    <Edit className="w-4 h-4" />
                    Засах
                  </button>
                  <button
                    onClick={() => camera._id && handleDelete(camera._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Устгах
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <MModal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCamera ? "Камер засах" : "Камер нэмэх"}
          size="lg"
          classNames={{
            content: "modal-surface modal-responsive",
            header:
              "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
            title: "text-theme font-semibold",
            close: "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
          }}
          overlayProps={{ opacity: 0.5, blur: 6 }}
          centered
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                Камерын нэр *
              </label>
              <input
                type="text"
                value={formData.ner}
                onChange={(e) =>
                  setFormData({ ...formData, ner: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  IP хаяг *
                </label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, ipAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                  placeholder="192.168.1.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Порт *
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      port: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                Байрлал
              </label>
              <input
                type="text"
                value={formData.bairlal}
                onChange={(e) =>
                  setFormData({ ...formData, bairlal: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                placeholder="Жишээ: Гол хаалга"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                Төлөв
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "inactive",
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
              >
                <option value="active">Идэвхтэй</option>
                <option value="inactive">Идэвхгүй</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[color:var(--surface-border)]">
            <MButton
              onClick={() => setIsModalOpen(false)}
              className="btn-minimal btn-cancel"
            >
              Цуцлах
            </MButton>
            <MButton onClick={handleSave} className="btn-minimal btn-save">
              Хадгалах
            </MButton>
          </div>
        </MModal>
      </div>
    </div>
  );
}
