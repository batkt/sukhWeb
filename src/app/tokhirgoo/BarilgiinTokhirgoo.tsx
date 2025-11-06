"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader } from "@mantine/core";
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

  // If no building is selected and there are buildings available,
  // automatically select the first available building.
  useEffect(() => {
    const list = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!
      : [];
    if (baiguullaga && !selectedBuildingId && list.length > 0) {
      const firstId = String(list[0]._id);
      setSelectedBuildingId(firstId);
    }
  }, [
    baiguullaga?.barilguud,
    selectedBuildingId,
    setSelectedBuildingId,
    baiguullaga,
  ]);

  const [barilgaNer, setBarilgaNer] = useState<string>("");

  // allow empty string while editing so user can clear the field without it immediately becoming 0
  const [davkharCount, setDavkharCount] = useState<number | "">(0);
  // entrances (орц) as numeric count like давхар
  const [ortsCount, setOrtsCount] = useState<number | "">(0);
  const [isInit, setIsInit] = useState<boolean>(false);

  // Field for adding a new building (added via main save button)
  const [newBarilgaNer, setNewBarilgaNer] = useState<string>("");

  // Initialize basic info only
  useEffect(() => {
    if (!barilga) {
      setBarilgaNer("");
      setOrtsCount(0);
      setDavkharCount(0);
      setIsInit(true);
      return;
    }
    try {
      setBarilgaNer(barilga?.ner || "");
      // initialize entrances (orts) and floor count from barilga tokhirgoo

      const davFrom = (barilga?.tokhirgoo as any)?.davkhar || [];
      // davkhar can be array or number; normalize to count
      const davCount = Array.isArray(davFrom)
        ? davFrom.length
        : Number(davFrom) || 0;
      setDavkharCount(davCount);
      const ortsFrom = (barilga?.tokhirgoo as any)?.orts || [];
      const _ortsCount = Array.isArray(ortsFrom)
        ? ortsFrom.length
        : Number(ortsFrom) || 0;
      setOrtsCount(_ortsCount);
      setIsInit(true);
    } catch (_) {
      setIsInit(true);
    }
  }, [barilga]);

  const incrementOrts = () => {
    setOrtsCount((prev: any) => {
      const n = Number(prev) || 0;
      return n + 1;
    });
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
      const name = (newBarilgaNer || "").trim();
      const count = Number(davkharCount) || 0;
      const ortsNum = Number(ortsCount) || 0;

      // Choose the best available location source:
      // 1) Active building with non-empty location
      // 2) Organization-level location
      // 3) First building that has a non-empty location
      const pickLocationSource = () => {
        const safeTrim = (v: any) => (typeof v === "string" ? v.trim() : "");
        const hasLoc = (t: any) =>
          !!(safeTrim(t?.duuregNer) || safeTrim(t?.horoo?.ner));

        const activeTok = (barilga?.tokhirgoo as any) || {};
        if (hasLoc(activeTok)) return activeTok;

        const orgTok = ((baiguullaga?.tokhirgoo as any) || {}) as any;
        if (hasLoc(orgTok)) return orgTok;

        const firstWithLoc = (baiguullaga?.barilguud || [])
          .map((b: any) => b?.tokhirgoo)
          .find((t: any) => hasLoc(t));
        return firstWithLoc || {};
      };
      const bestLoc = pickLocationSource();

      let updatedBarilguud: any[] = [...(baiguullaga?.barilguud || [])];

      if (name) {
        // Validation for new building creation

        if (count <= 0) {
          openErrorOverlay("Шинэ барилгын давхарын тоо оруулна уу");
          return;
        }
        // Duplicate name check
        const hasDup = updatedBarilguud.some(
          (b: any) => String(b?.ner || "").trim() === name
        );
        if (hasDup) {
          openErrorOverlay("Ижил нэртэй барилга аль хэдийн бүртгэлтэй байна");
          return;
        }
        // Prefer active building; fallback to org-level; then any building with location
        const locSrc = bestLoc as any;

        const newBuilding = {
          ner: name,
          bairshil: { coordinates: [] },
          tokhirgoo: {
            duuregNer: locSrc?.duuregNer || "",
            districtCode: locSrc?.districtCode || "",
            horoo: {
              ner: locSrc?.horoo?.ner || "",
              kod: locSrc?.horoo?.kod || "",
            },
            sohNer: locSrc?.sohNer || "",
            // initialize entrances (орц) as a String count per schema
            orts: String(ortsNum),
            davkhar: Array.from({ length: count }, (_, i) => String(i + 1)),
          },
          davkharuud: [],
        };
        updatedBarilguud = [...updatedBarilguud, newBuilding];
      } else if (activeBuildingId) {
        // Update existing building's settings
        updatedBarilguud = updatedBarilguud.map((b: any) => {
          if (String(b._id) !== String(activeBuildingId)) return b;
          const orgTokhirgoo = ((baiguullaga?.tokhirgoo as any) || {}) as any;
          const locSrc = pickLocationSource() as any;
          const tokhirgoo = {
            ...(b.tokhirgoo || {}),
            // Ensure building has location; prefer existing non-empty, else best available
            duuregNer:
              typeof (b?.tokhirgoo as any)?.duuregNer === "string" &&
              (b?.tokhirgoo as any)?.duuregNer?.trim()
                ? (b?.tokhirgoo as any)?.duuregNer
                : (locSrc as any)?.duuregNer || "",
            districtCode:
              typeof (b?.tokhirgoo as any)?.districtCode === "string" &&
              (b?.tokhirgoo as any)?.districtCode?.trim()
                ? (b?.tokhirgoo as any)?.districtCode
                : (locSrc as any)?.districtCode || "",
            horoo: {
              ner:
                typeof (b?.tokhirgoo as any)?.horoo?.ner === "string" &&
                (b?.tokhirgoo as any)?.horoo?.ner?.trim()
                  ? (b?.tokhirgoo as any)?.horoo?.ner
                  : (locSrc as any)?.horoo?.ner || "",
              kod:
                typeof (b?.tokhirgoo as any)?.horoo?.kod === "string" &&
                (b?.tokhirgoo as any)?.horoo?.kod?.trim()
                  ? (b?.tokhirgoo as any)?.horoo?.kod
                  : (locSrc as any)?.horoo?.kod || "",
            },
            // Recompute entrances (орц) as a String count per schema
            orts: String(ortsNum),
            davkhar: Array.from({ length: count }, (_, i) => String(i + 1)),
          } as any;
          return { ...b, tokhirgoo };
        });
      }

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

      if (name) {
        openSuccessOverlay("Шинэ барилга нэмэгдлээ");
        setNewBarilgaNer("");
        if (res?.barilguud && res.barilguud.length > 0) {
          const added =
            res.barilguud.find((b: any) => b.ner === name) ||
            res.barilguud[res.barilguud.length - 1];
          if (added?._id) setSelectedBuildingId(String(added._id));
        }
      } else {
        openSuccessOverlay("Барилгын тохиргоо амжилттай хадгалагдлаа");
      }
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
        {String(activeBuildingId || "") === String(barilgiinId || "") && (
          <div className="border-t pt-4">
            <h3 className="font-medium text-theme mb-2">Шинэ барилга</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newBarilgaNer}
                onChange={(e) => setNewBarilgaNer(e.target.value)}
                placeholder="Шинэ барилгын нэр (Хадгалах дарвал нэмэгдэнэ)"
                className="w-full sm:flex-1 px-3 py-2 neu-panel focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Тайлбар: Шинэ барилга нэмэхдээ доорх Орц/Давхар тоог оруулаад
              "Хадгалах" товчийг дарна.
            </div>
          </div>
        )}
        {/* Entrances (Орц) and Floors (Давхар) settings */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Нийт орцын тоо
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={ortsCount}
                    onChange={(e) =>
                      setOrtsCount(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 neu-panel focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Давхар */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Нийт давхарын тоо
                </label>
                <input
                  type="number"
                  min={0}
                  value={davkharCount}
                  onChange={(e) =>
                    setDavkharCount(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 neu-panel focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <button
                  className="btn-minimal btn-save"
                  onClick={handleSaveSettings}
                >
                  Хадгалах
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
