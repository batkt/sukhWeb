"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button as MButton, Loader } from "@mantine/core";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { updateBaiguullaga } from "../../../lib/uilchilgee";

export default function BarilgiinTokhirgoo() {
  const { baiguullaga, token, baiguullagaMutate, barilgiinId } = useAuth();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();

  const activeBuildingId = useMemo(() => {
    return (
      selectedBuildingId ||
      barilgiinId ||
      (baiguullaga?.barilguud?.[0]?._id ?? null)
    );
  }, [selectedBuildingId, barilgiinId, baiguullaga?.barilguud]);

  const barilga = useMemo(() => {
    return baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(activeBuildingId)
    );
  }, [baiguullaga?.barilguud, activeBuildingId]);

  // If the current activeBuildingId doesn't exist in baiguullaga anymore,
  // automatically fall back to the first available building and update the selection.
  useEffect(() => {
    const list = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!
      : [];
    if (!barilga && list.length > 0) {
      const firstId = String(list[0]._id);
      if (selectedBuildingId !== firstId) {
        setSelectedBuildingId(firstId);
      }
    }
  }, [
    barilga,
    baiguullaga?.barilguud,
    selectedBuildingId,
    setSelectedBuildingId,
  ]);

  const [barilgaNer, setBarilgaNer] = useState<string>("");
  const [ortsInput, setOrtsInput] = useState<string>("");
  const [ortsnuud, setOrtsnuud] = useState<string[]>([]);
  const [davkharCount, setDavkharCount] = useState<number>(0);
  const [isInit, setIsInit] = useState<boolean>(false);

  // New state for adding new building
  const [newBarilgaNer, setNewBarilgaNer] = useState<string>("");

  // Initialize basic info only
  useEffect(() => {
    if (!barilga) {
      setBarilgaNer("");
      setOrtsnuud([]);
      setOrtsInput("");
      setDavkharCount(0);
      setIsInit(true);
      return;
    }
    try {
      setBarilgaNer(barilga?.ner || "");
      // initialize entrances (orts) and floor count from barilga tokhirgoo
      const ortsFrom = (barilga?.tokhirgoo as any)?.orts || [];
      setOrtsnuud(Array.isArray(ortsFrom) ? ortsFrom : []);
      const davFrom = (barilga?.tokhirgoo as any)?.davkhar || [];
      // davkhar can be array or number; normalize to count
      const davCount = Array.isArray(davFrom)
        ? davFrom.length
        : Number(davFrom) || 0;
      setDavkharCount(davCount);
      setIsInit(true);
    } catch (_) {
      setIsInit(true);
    }
  }, [barilga]);

  const addNewBuilding = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх токен олдсонгүй");
      return;
    }
    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }
    const name = (newBarilgaNer || "").trim();
    if (!name) {
      openErrorOverlay("Барилгын нэр оруулна уу");
      return;
    }

    // Check for duplicate name
    const hasDup = (baiguullaga?.barilguud || []).some(
      (b: any) => String(b?.ner || "").trim() === name
    );
    if (hasDup) {
      openErrorOverlay("Ижил нэртэй барилга аль хэдийн бүртгэлтэй байна");
      return;
    }

    try {
      const newBuilding = {
        ner: name,
        bairshil: { coordinates: [] },
        tokhirgoo: {
          duuregNer: (baiguullaga?.tokhirgoo as any)?.duuregNer || "",
          districtCode: (baiguullaga?.tokhirgoo as any)?.districtCode || "",
          horoo: {
            ner: (baiguullaga?.tokhirgoo as any)?.horoo?.ner || "",
            kod: (baiguullaga?.tokhirgoo as any)?.horoo?.kod || "",
          },
          sohNer: (baiguullaga?.tokhirgoo as any)?.sohNer || "",
          orts: [],
          davkhar: [],
        },
        davkharuud: [],
      };

      const updatedBarilguud = [...(baiguullaga?.barilguud || []), newBuilding];

      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga._id,
        barilguud: updatedBarilguud,
      };

      const res = await updateBaiguullaga(
        token || undefined,
        baiguullaga._id,
        payload
      );
      if (res) await baiguullagaMutate(res, false);
      await baiguullagaMutate();

      openSuccessOverlay("Шинэ барилга нэмэгдлээ");
      setNewBarilgaNer("");
      // Optionally switch to the new building
      if (res?.barilguud && res.barilguud.length > 0) {
        const newId = res.barilguud[res.barilguud.length - 1]._id;
        setSelectedBuildingId(newId);
      }
    } catch (e) {
      openErrorOverlay("Шинэ барилга нэмэхэд алдаа гарлаа");
    }
  };

  const addOrts = () => {
    const val = (ortsInput || "").trim();
    if (!val) return;
    if (ortsnuud.includes(val)) {
      openErrorOverlay("Ижил орц бүртгэлтэй байна");
      return;
    }
    setOrtsnuud((prev) => [...prev, val]);
    setOrtsInput("");
  };

  const removeOrts = (index: number) => {
    setOrtsnuud((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSettings = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }

    try {
      // build updated barilguud array by replacing the current barilga
      const updatedBarilguud = (baiguullaga?.barilguud || []).map((b: any) => {
        if (String(b._id) !== String(activeBuildingId)) return b;
        const tokhirgoo = {
          ...(b.tokhirgoo || {}),
          orts: ortsnuud,
          davkhar: Array.from({ length: davkharCount }).map((_, i) => i + 1),
        };
        return { ...b, tokhirgoo };
      });

      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga._id,
        barilguud: updatedBarilguud,
      };

      const res = await updateBaiguullaga(
        token || undefined,
        baiguullaga._id,
        payload
      );
      if (res) await baiguullagaMutate(res, false);
      await baiguullagaMutate();

      openSuccessOverlay("Барилгын тохиргоо амжилттай хадгалагдлаа");
    } catch (e) {
      openErrorOverlay("Тохиргоо хадгалах явцад алдаа гарлаа");
    }
  };

  // Removed save handler since орц/давхар settings are no longer editable from here

  if (!isInit) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="xxl:col-span-9 col-span-12 lg:col-span-12 h-full overflow-visible">
      <div className="neu-panel allow-overflow p-4 md:p-6 space-y-6">
        {/* Empty state when no building is available */}
        {!barilga && (
          <div className="p-3 rounded-md border border-blue-300 text-blue-700 text-sm">
            Барилга олдсонгүй. Зөвхөн мэдээллийг харах боломжтой. Барилга сонгох
            эсвэл шинээр нэмнэ үү.
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Барилгын нэр
            </label>
            <input
              type="text"
              value={barilgaNer}
              readOnly
              placeholder="Барилгын нэр"
              className="w-full px-3 py-2 neu-panel focus:outline-none bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Байршил
            </label>
            <div className="w-full px-3 py-3 neu-panel text-sm text-theme">
              {(() => {
                const duureg =
                  barilga?.tokhirgoo?.duuregNer ||
                  (baiguullaga?.tokhirgoo as any)?.duuregNer;
                const horoo =
                  (barilga?.tokhirgoo as any)?.horoo?.ner ||
                  (baiguullaga?.tokhirgoo as any)?.horoo?.ner;
                if (duureg || horoo) return `${duureg || ""} / ${horoo || ""}`;
                return "Байршил тохируулаагүй (Үндсэн мэдээлэл хэсгээс тохируулна уу)";
              })()}
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-medium text-theme mb-2">Шинэ барилга нэмэх</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newBarilgaNer}
              onChange={(e) => setNewBarilgaNer(e.target.value)}
              placeholder="Шинэ барилгын нэр"
              className="w-full sm:flex-1 px-3 py-2 neu-panel focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MButton className="btn-minimal" onClick={addNewBuilding}>
              Нэмэх
            </MButton>
          </div>
        </div>
        {/* Entrances (Орц) and Floors (Давхар) settings */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-theme mb-2">Орц / Давхар</h3>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-theme mb-1">
                  Орц нэмэх
                </label>
                <input
                  type="text"
                  value={ortsInput}
                  onChange={(e) => setOrtsInput(e.target.value)}
                  placeholder="Орц нэрийг оруулна уу"
                  className="w-full px-3 py-2 neu-panel focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-6 ">
                <button className="btn-minimal" onClick={addOrts}>
                  Нэмэх
                </button>
                <button
                  className="btn-minimal"
                  onClick={() => {
                    setOrtsInput("");
                  }}
                >
                  Цэвэрлэх
                </button>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                {ortsnuud.map((o, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-blue-400 text-sm"
                  >
                    <span className="text-theme">{o}</span>
                    <button
                      onClick={() => removeOrts(idx)}
                      className="text-red-500 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {ortsnuud.length === 0 && (
                  <div className="text-sm text-slate-500">
                    Орц нэмэгдээгүй байна
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Давхар тоог оруулна уу
                </label>
                <input
                  type="number"
                  min={0}
                  value={davkharCount}
                  onChange={(e) => setDavkharCount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 neu-panel focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button className="btn-minimal" onClick={handleSaveSettings}>
                  Тохиргоо хадгалах
                </button>
                <button
                  className="btn-minimal"
                  onClick={() => {
                    // reset to original
                    const ortsFrom = (barilga?.tokhirgoo as any)?.orts || [];
                    setOrtsnuud(Array.isArray(ortsFrom) ? ortsFrom : []);
                    const davFrom = (barilga?.tokhirgoo as any)?.davkhar || [];
                    const davCount = Array.isArray(davFrom)
                      ? davFrom.length
                      : Number(davFrom) || 0;
                    setDavkharCount(davCount);
                  }}
                >
                  Буцаах
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Note: Entrances (орц) and Floors (давхар) settings have been removed. */}
      </div>
    </div>
  );
}
