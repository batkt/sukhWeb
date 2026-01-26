"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Modal as MModal, Button as MButton } from "@mantine/core";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";

interface VehicleForm {
  _id?: string;
  ulsiinDugaar: string;
  mark: string;
  zagvar: string;
  ongo: string;
  ezemshliinNer: string;
  utas: string;
  orshinSuugchId?: string;
  zogsooliinBairlal?: string;
  tulburiinTurul?: "sariin" | "tsagiin";
  tulbur?: number;
}

export default function MashinBurtgel() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleForm | null>(null);
  const [formData, setFormData] = useState<VehicleForm>({
    ulsiinDugaar: "",
    mark: "",
    zagvar: "",
    ongo: "",
    ezemshliinNer: "",
    utas: "",
    zogsooliinBairlal: "",
    tulburiinTurul: "sariin",
    tulbur: 0,
  });

  const shouldFetch =
    isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: vehiclesData, mutate } = useSWR(
    shouldFetch
      ? [
          "/zogsool/mashinBurtgel",
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

  const vehicles = vehiclesData?.jagsaalt || [];

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormData({
      ulsiinDugaar: "",
      mark: "",
      zagvar: "",
      ongo: "",
      ezemshliinNer: "",
      utas: "",
      zogsooliinBairlal: "",
      tulburiinTurul: "sariin",
      tulbur: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      ulsiinDugaar: vehicle.ulsiinDugaar || "",
      mark: vehicle.mark || "",
      zagvar: vehicle.zagvar || "",
      ongo: vehicle.ongo || "",
      ezemshliinNer: vehicle.ezemshliinNer || "",
      utas: vehicle.utas || "",
      orshinSuugchId: vehicle.orshinSuugchId,
      zogsooliinBairlal: vehicle.zogsooliinBairlal || "",
      tulburiinTurul: vehicle.tulburiinTurul || "sariin",
      tulbur: vehicle.tulbur || 0,
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

      if (editingVehicle) {
        await uilchilgee(token).put(
          `/zogsool/mashinBurtgel/${editingVehicle._id || ""}`,
          payload
        );
      } else {
        await uilchilgee(token).post("/zogsool/mashinBurtgel", payload);
      }

      mutate();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving vehicle:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Устгахдаа итгэлтэй байна уу?")) return;

    try {
      await uilchilgee(token).delete(`/zogsool/mashinBurtgel/${id}`);
      mutate();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  return (
    <div className="h-full overflow-hidden custom-scrollbar">
      <div className="min-h-full p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[color:var(--panel-text)]">
            Машин бүртгэл
          </h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--theme)] text-white hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Машин нэмэх
          </button>
        </div>

        <div className="neu-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[color:var(--surface)] border-b border-[color:var(--surface-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Улсын дугаар
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Марк, загвар
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Өнгө
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Эзэмшлийн нэр
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Утас
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Зогсоолын байрлал
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Төлбөрийн төрөл
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-[color:var(--muted-text)]"
                    >
                      Машины мэдээлэл олдсонгүй
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle: any, idx: number) => (
                    <tr
                      key={vehicle._id || idx}
                      className="border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[color:var(--panel-text)]">
                        {vehicle.ulsiinDugaar || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.mark && vehicle.zagvar
                          ? `${vehicle.mark} ${vehicle.zagvar}`
                          : vehicle.mark || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.ongo || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.ezemshliinNer || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.utas || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.zogsooliinBairlal || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.tulburiinTurul === "sariin" ? "Сарын" : "Цагийн"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="p-1.5 rounded-lg hover:bg-[color:var(--surface-hover)] text-blue-600 transition"
                            title="Засах"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle._id)}
                            className="p-1.5 rounded-lg hover:bg-[color:var(--surface-hover)] text-red-600 transition"
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

        <MModal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingVehicle ? "Машин засах" : "Машин бүртгэх"}
          size="xl"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Улсын дугаар *
                </label>
                <input
                  type="text"
                  value={formData.ulsiinDugaar}
                  onChange={(e) =>
                    setFormData({ ...formData, ulsiinDugaar: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Марк *
                </label>
                <input
                  type="text"
                  value={formData.mark}
                  onChange={(e) =>
                    setFormData({ ...formData, mark: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Загвар
                </label>
                <input
                  type="text"
                  value={formData.zagvar}
                  onChange={(e) =>
                    setFormData({ ...formData, zagvar: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Өнгө
                </label>
                <input
                  type="text"
                  value={formData.ongo}
                  onChange={(e) =>
                    setFormData({ ...formData, ongo: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Эзэмшлийн нэр *
                </label>
                <input
                  type="text"
                  value={formData.ezemshliinNer}
                  onChange={(e) =>
                    setFormData({ ...formData, ezemshliinNer: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Утасны дугаар *
                </label>
                <input
                  type="tel"
                  value={formData.utas}
                  onChange={(e) =>
                    setFormData({ ...formData, utas: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Зогсоолын байрлал
                </label>
                <input
                  type="text"
                  value={formData.zogsooliinBairlal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      zogsooliinBairlal: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Төлбөрийн төрөл
                </label>
                <select
                  value={formData.tulburiinTurul}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tulburiinTurul: e.target.value as "sariin" | "tsagiin",
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                >
                  <option value="sariin">Сарын</option>
                  <option value="tsagiin">Цагийн</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--panel-text)] mb-1">
                  Төлбөр (₮)
                </label>
                <input
                  type="number"
                  value={formData.tulbur}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tulbur: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                />
              </div>
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
