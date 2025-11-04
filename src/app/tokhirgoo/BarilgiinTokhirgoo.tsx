"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  NumberInput as MNumberInput,
  Button as MButton,
  Loader,
  Badge,
} from "@mantine/core";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { updateBaiguullaga } from "../../../lib/uilchilgee";

interface Props {
  setSongogdsonTsonkhniiIndex?: (index: number) => void;
}

export default function BarilgiinTokhirgoo({
  setSongogdsonTsonkhniiIndex,
}: Props) {
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

  useEffect(() => {
    // If building isn't found, stop the spinner and show empty state instead of hanging
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

      const tkh: any = (barilga?.tokhirgoo as any) || {};
      // Prefer saved tokhirgoo.orts; fallback to tokhirgoo.ortsnuud for backward compatibility
      const existingOrts: string[] = Array.isArray(tkh.orts)
        ? tkh.orts
        : Array.isArray(tkh.ortsnuud)
        ? tkh.ortsnuud
        : [];
      setOrtsnuud(existingOrts);
      setOrtsInput("");

      // Floors: prefer tokhirgoo.davkhar (string[]), fallback to root-level davkharuud objects
      const tokhirgooDavkhars: string[] = Array.isArray(tkh.davkhar)
        ? tkh.davkhar
        : [];
      const existingDavkharuud = Array.isArray(barilga?.davkharuud)
        ? barilga!.davkharuud
        : [];
      const initialFloorCount =
        (tokhirgooDavkhars && tokhirgooDavkhars.length) ||
        (existingDavkharuud && existingDavkharuud.length) ||
        0;
      setDavkharCount(initialFloorCount);
      setIsInit(true);
    } catch (e) {
      // ignore
    }
  }, [barilga, baiguullaga]);

  const addOrtsFromInput = () => {
    const tokens = (ortsInput || "")
      .split(/[,;\n\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const existing = new Set((ortsnuud || []).map((x) => x));
    const uniqueNew: string[] = [];
    const dups: string[] = [];
    const seenInBatch = new Set<string>();

    for (const t of tokens) {
      const isDupExisting = existing.has(t);
      const isDupBatch = seenInBatch.has(t);
      if (isDupExisting || isDupBatch) {
        if (!dups.includes(t)) dups.push(t);
      } else {
        uniqueNew.push(t);
        seenInBatch.add(t);
      }
    }

    if (dups.length > 0) {
      openErrorOverlay(`Давхардсан орц байна: ${dups.join(", ")}`);
    }

    if (uniqueNew.length > 0) {
      setOrtsnuud([...(ortsnuud || []), ...uniqueNew]);
    }
    setOrtsInput("");
  };

  const removeOrts = (name: string) => {
    setOrtsnuud((prev) => prev.filter((o) => o !== name));
  };

  const buildDavkharuud = (n: number) => {
    const safe = Math.max(0, Math.min(100, Math.floor(n)));
    const current = Array.isArray(barilga?.davkharuud)
      ? barilga!.davkharuud
      : [];
    if (safe <= 0) return [] as any[];

    // Preserve existing when possible
    const out = [] as any[];
    for (let i = 0; i < safe; i++) {
      const label = String(i + 1);
      const existing = current[i];
      out.push(
        existing || {
          davkhar: label,
          talbai: 0,
          tariff: 0,
          planZurag: "",
        }
      );
    }
    return out;
  };

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

  const save = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх токен олдсонгүй");
      return;
    }
    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }
    if (!barilga) {
      openErrorOverlay(
        "Барилга сонгогдоогүй байна. Үндсэн мэдээлэл хэсгээс байршил/барилга тохируулна уу."
      );
      return;
    }

    try {
      const floorsObjects = buildDavkharuud(davkharCount);
      const floorLabels = Array.from({ length: davkharCount }, (_, i) =>
        String(i + 1)
      );

      const updatedBarilguud = (baiguullaga?.barilguud || []).map((b: any) => {
        if (String(b._id) !== String(barilga._id)) return b;
        return {
          ...b,
          // ner: barilgaNer || b.ner, // Remove name update to avoid changing current building name
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            // mirror UI fields into tokhirgoo as requested
            orts: ortsnuud,
            davkhar: floorLabels,
            // keep a list form for building name to satisfy consumers expecting array
          },
          // keep root-level floors for backward compatibility
          davkharuud: floorsObjects,
        };
      });

      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga._id,
        barilguud: updatedBarilguud,
      };

      const res = await updateBaiguullaga(
        token || undefined,
        baiguullaga._id,
        payload,
        { barilgiinId: activeBuildingId || null }
      );
      if (res) await baiguullagaMutate(res, false);
      await baiguullagaMutate();

      openSuccessOverlay("Барилгын тохиргоо хадгаллаа");
      if (setSongogdsonTsonkhniiIndex) setSongogdsonTsonkhniiIndex(0);
    } catch (e) {
      openErrorOverlay("Хадгалах үед алдаа гарлаа");
    }
  };

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

        {/* Entrances */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-theme">Орц</h3>
            <Badge variant="light" color="blue">
              {ortsnuud.length}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={ortsInput}
              onChange={(e) => setOrtsInput(e.target.value)}
              placeholder="Ж: 1, 2, 3 эсвэл 1 2 3"
              className="w-full sm:flex-1 px-3 py-2 neu-panel focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MButton className="btn-minimal mt-1" onClick={addOrtsFromInput}>
              Нэмэх
            </MButton>
          </div>
          {ortsnuud.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {ortsnuud.map((o) => (
                <span
                  key={o}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500 text-blue-700 border border-blue-200 text-sm"
                >
                  {o}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => removeOrts(o)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Floors */}
        <div>
          <h3 className="font-medium text-theme mb-2">Давхар</h3>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Нийт давхар
              </label>
              <MNumberInput
                min={0}
                max={100}
                value={davkharCount}
                onChange={(v) => setDavkharCount(Number(v as number) || 0)}
                className="w-40"
              />
            </div>
            <div className="text-sm text-slate-600 mt-6">
              {davkharCount > 0
                ? `1 - ${davkharCount} давхар оруулсан байна`
                : "Давхарын тоо оруулна уу"}
            </div>
          </div>
        </div>

        {/* Add New Building */}

        {/* Save */}
        <div className="flex justify-end pt-2">
          <MButton
            className="btn-minimal btn-save"
            onClick={save}
            disabled={!barilga}
            title={!barilga ? "Барилга сонгоогүй байна" : undefined}
          >
            Хадгалах
          </MButton>
        </div>
      </div>
    </div>
  );
}
