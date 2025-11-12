"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader, Modal as MModal, Button as MButton } from "@mantine/core";
import {
  Edit,
  Trash2,
  Plus,
  Building2,
  MapPin,
  Users,
  Save,
  Home,
} from "lucide-react";
import { aldaaBarigch } from "../../../lib/uilchilgee";
import updateMethod from "../../../tools/function/updateMethod";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";

interface Horoo {
  _id?: string;
  ner: string;
  kod: string;
}

interface Duureg {
  _id?: string;
  ner: string;
  kod: string;
  ded?: Horoo[];
}

interface TatvariinAlbaResponse {
  jagsaalt: Duureg[];
}

interface Ajiltan {
  _id: string;
  [key: string]: any;
  selectedHoroo?: string;
  selectedDuureg?: string;
  selectedDuuregData?: Duureg;
  selectedHorooData?: Horoo;
}

// Edit Building Modal Component
const EditBuildingModal: React.FC<{
  open: boolean;
  onClose: () => void;
  editBarilgaNer: string;
  setEditBarilgaNer: (value: string) => void;
  editOrtsCount: number | "";
  setEditOrtsCount: (value: number | "") => void;
  editDavkharCount: number | "";
  setEditDavkharCount: (value: number | "") => void;
  hasUserEdited: boolean;
  setHasUserEdited: (value: boolean) => void;
  editedBuildingId: string | null;
  baiguullaga: any;
  handleSaveEditBuilding: () => Promise<void>;
  isSaving: boolean;
}> = ({
  open,
  onClose,
  editBarilgaNer,
  setEditBarilgaNer,
  editOrtsCount,
  setEditOrtsCount,
  editDavkharCount,
  setEditDavkharCount,
  hasUserEdited,
  setHasUserEdited,
  editedBuildingId,
  baiguullaga,
  handleSaveEditBuilding,
  isSaving,
}) => {
  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // disable body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        style={{
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      <div className="relative w-full max-w-xl">
        <div className="neu-panel rounded-lg p-6 shadow-lg">
          <h3 className="font-medium text-theme mb-3">Барилга засах</h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={editBarilgaNer}
              onChange={(e) => {
                setEditBarilgaNer(e.target.value);
                setHasUserEdited(true);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Барилгын нэр"
              className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 mt-2">
            Тайлбар: Барилгын нэр болон орц/давхар тоог засна.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Нийт орцын тоо
              </label>
              <input
                type="number"
                min={0}
                value={editOrtsCount}
                onChange={(e) => {
                  setEditOrtsCount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  );
                  setHasUserEdited(true);
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-28 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Нийт давхарын тоо
              </label>
              <input
                type="number"
                min={0}
                value={editDavkharCount}
                onChange={(e) => {
                  setEditDavkharCount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  );
                  setHasUserEdited(true);
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-28 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button className="btn-minimal" onClick={onClose} type="button">
              Болих
            </button>
            <button
              className={`btn-minimal btn-save ${
                isSaving ? "opacity-60 cursor-not-allowed" : ""
              }`}
              onClick={handleSaveEditBuilding}
              disabled={isSaving}
              type="button"
            >
              {isSaving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// New Building Modal Component
const NewBuildingModal: React.FC<{
  open: boolean;
  onClose: () => void;
  newBarilgaNer: string;
  setNewBarilgaNer: (value: string) => void;
  ortsCount: number | "";
  setOrtsCount: (value: number | "") => void;
  davkharCount: number | "";
  setDavkharCount: (value: number | "") => void;
  handleSaveSettings: () => Promise<void>;
  isSaving: boolean;
}> = ({
  open,
  onClose,
  newBarilgaNer,
  setNewBarilgaNer,
  ortsCount,
  setOrtsCount,
  davkharCount,
  setDavkharCount,
  handleSaveSettings,
  isSaving,
}) => {
  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // disable body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        style={{
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      <div className="relative w-full max-w-xl">
        <div className="neu-panel p-6 shadow-lg">
          <h3 className="font-medium text-theme mb-3">Шинэ барилга</h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newBarilgaNer}
              onChange={(e) => setNewBarilgaNer(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Шинэ барилгын нэр (Хадгалах дарвал нэмэгдэнэ)"
              className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 mt-2">
            Тайлбар: Шинэ барилга нэмэхдээ доорх Орц/Давхар тоог оруулаад
            "Хадгалах" товчийг дарна.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Нийт орцын тоо
              </label>
              <input
                type="number"
                min={0}
                value={ortsCount}
                onChange={(e) =>
                  setOrtsCount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                onKeyDown={(e) => e.stopPropagation()}
                className="w-28 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              />
            </div>

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
                onKeyDown={(e) => e.stopPropagation()}
                className="w-28 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button className="btn-minimal" onClick={onClose} type="button">
              Болих
            </button>
            <button
              className={`btn-minimal btn-save ${
                isSaving ? "opacity-60 cursor-not-allowed" : ""
              }`}
              onClick={handleSaveSettings}
              disabled={isSaving}
              type="button"
            >
              {isSaving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function BarilgiinTokhirgoo() {
  const districts: Record<string, string[]> = {
    Улаанбаатар: [
      "Сүхбаатар",
      "Баянгол",
      "Чингэлтэй",
      "Хан-Уул",
      "Баянзүрх",
      "Сонгинохайрхан",
      "Налайх",
      "Багануур",
      "Багахангай",
    ],
  };

  const subDistricts: Record<string, string[]> = {
    Сүхбаатар: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
      "11-р хороо",
      "12-р хороо",
      "13-р хороо",
      "14-р хороо",
      "15-р хороо",
      "16-р хороо",
      "17-р хороо",
      "18-р хороо",
      "19-р хороо",
      "20-р хороо",
    ],
    Баянгол: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
      "11-р хороо",
      "12-р хороо",
      "13-р хороо",
      "14-р хороо",
      "15-р хороо",
      "16-р хороо",
      "17-р хороо",
      "18-р хороо",
      "19-р хороо",
      "20-р хороо",
      "21-р хороо",
      "22-р хороо",
      "23-р хороо",
      "24-р хороо",
      "25-р хороо",
      "26-р хороо",
      "27-р хороо",
      "28-р хороо",
      "29-р хороо",
      "30-р хороо",
      "31-р хороо",
      "32-р хороо",
      "33-р хороо",
      "34-р хороо",
    ],

    Чингэлтэй: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
      "11-р хороо",
      "12-р хороо",
      "13-р хороо",
      "14-р хороо",
      "15-р хороо",
      "16-р хороо",
      "17-р хороо",
      "18-р хороо",
      "19-р хороо",
      "20-р хороо",
      "21-р хороо",
      "22-р хороо",
      "23-р хороо",
      "24-р хороо",
    ],

    "Хан-Уул": [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
      "11-р хороо",
      "12-р хороо",
      "13-р хороо",
      "14-р хороо",
      "15-р хороо",
      "16-р хороо",
      "17-р хороо",
      "18-р хороо",
      "19-р хороо",
      "20-р хороо",
      "21-р хороо",
      "22-р хороо",
      "23-р хороо",
      "24-р хороо",
      "25-р хороо",
    ],

    Баянзүрх: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
      "11-р хороо",
      "12-р хороо",
      "13-р хороо",
      "14-р хороо",
      "15-р хороо",
      "16-р хороо",
      "17-р хороо",
      "18-р хороо",
      "19-р хороо",
      "20-р хороо",
      "21-р хороо",
      "22-р хороо",
      "23-р хороо",
      "24-р хороо",
      "25-р хороо",
      "26-р хороо",
      "27-р хороо",
      "28-р хороо",
      "29-р хороо",
      "30-р хороо",
      "31-р хороо",
      "32-р хороо",
      "33-р хороо",
      "34-р хороо",
      "35-р хороо",
      "36-р хороо",
      "37-р хороо",
      "38-р хороо",
      "39-р хороо",
      "40-р хороо",
      "41-р хороо",
      "42-р хороо",
      "43-р хороо",
    ],

    Сонгинохайрхан: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
      "11-р хороо",
      "12-р хороо",
      "13-р хороо",
      "14-р хороо",
      "15-р хороо",
      "16-р хороо",
      "17-р хороо",
      "18-р хороо",
      "19-р хороо",
      "20-р хороо",
      "21-р хороо",
      "22-р хороо",
      "23-р хороо",
      "24-р хороо",
      "25-р хороо",
      "26-р хороо",
      "27-р хороо",
      "28-р хороо",
      "29-р хороо",
      "30-р хороо",
      "31-р хороо",
      "32-р хороо",
      "33-р хороо",
      "34-р хороо",
      "35-р хороо",
      "36-р хороо",
      "37-р хороо",
      "38-р хороо",
      "39-р хороо",
      "40-р хороо",
      "41-р хороо",
      "42-р хороо",
      "43-р хороо",
    ],

    Налайх: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
    ],
    Багануур: ["1-р хороо", "2-р хороо", "3-р хороо", "4-р хороо", "5-р хороо"],
    Багахангай: ["1-р хороо", "2-р хороо"],
  };
  const { baiguullaga, token, baiguullagaMutate, barilgiinId } = useAuth();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();
  const activeBuildingId = useMemo(() => {
    return (
      selectedBuildingId ||
      barilgiinId ||
      // prefer a real building for this organization (avoid org-level duplicate entry)
      (Array.isArray(baiguullaga?.barilguud)
        ? (() => {
            const orgName = (baiguullaga?.ner || "").trim();
            const isRealBuilding = (b: any) => {
              try {
                const name = (b?.ner || "").trim();
                if (!name) return false;
                // If building name differs from organization name, treat as real building
                if (orgName && name !== orgName) return true;
                // If building has floors/entrances/address/register it is likely a real building
                const tok = b?.tokhirgoo || {};
                if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
                  return true;
                if (tok?.orts || b?.khayag || b?.register) return true;
              } catch (_) {}
              return false;
            };

            // Prefer the first building that looks like an actual building for this org
            const preferred = baiguullaga.barilguud.find(
              (b: any) =>
                (String(b.baiguullagiinId) === String(baiguullaga._id) ||
                  !b.baiguullagiinId) &&
                isRealBuilding(b)
            );
            if (preferred) return preferred._id;

            // Fallback: any building belonging to this org
            const anyForOrg = baiguullaga.barilguud.find(
              (b: any) =>
                !b?.baiguullagiinId ||
                String(b.baiguullagiinId) === String(baiguullaga._id)
            );
            return anyForOrg?._id ?? null;
          })()
        : null)
    );
  }, [selectedBuildingId, barilgiinId, baiguullaga?.barilguud]);

  const barilga = useMemo(() => {
    return baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(activeBuildingId)
    );
  }, [baiguullaga?.barilguud, activeBuildingId]);

  // Filter buildings that belong to this organization (baiguullagiinId) or lack the field
  const orgBuildings = useMemo(() => {
    if (!Array.isArray(baiguullaga?.barilguud)) return [];
    return baiguullaga!.barilguud!.filter(
      (b: any) =>
        !b?.baiguullagiinId ||
        String(b.baiguullagiinId) === String(baiguullaga?._id)
    );
  }, [baiguullaga?.barilguud, baiguullaga?._id]);

  // If no building is selected and there are buildings available,
  // automatically select the first available building.
  useEffect(() => {
    const list = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!.filter(
          (b: any) =>
            !b?.baiguullagiinId ||
            String(b.baiguullagiinId) === String(baiguullaga!._id)
        )
      : [];
    if (baiguullaga && !selectedBuildingId && list.length > 0) {
      // Prefer a real building (name differs from org or has building-specific data)
      const orgName = (baiguullaga?.ner || "").trim();
      const isRealBuilding = (b: any) => {
        try {
          const name = (b?.ner || "").trim();
          if (!name) return false;
          if (orgName && name !== orgName) return true;
          const tok = b?.tokhirgoo || {};
          if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
            return true;
          if (tok?.orts || b?.khayag || b?.register) return true;
        } catch (_) {}
        return false;
      };

      const preferred = list.find(isRealBuilding) || list[0];
      setSelectedBuildingId(String(preferred._id));
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

  // State from UndsenMedeelel
  const [state, setState] = useState<Ajiltan>({ _id: "" });
  const [tatvariinAlbaData, setTatvariinAlbaData] =
    useState<TatvariinAlbaResponse | null>(null);
  const [sohNer, setSohNer] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState({
    selectedDuureg: "",
    selectedHoroo: "",
    sohNer: "",
  });

  // Modal state for new building
  const [isNewBuildingModalOpen, setIsNewBuildingModalOpen] = useState(false);

  // Open new building modal and clear inputs so previous saved data is not shown
  const openNewBuildingModal = () => {
    setNewBarilgaNer("");
    setOrtsCount("");
    setDavkharCount("");
    setIsNewBuildingModalOpen(true);
  };

  // Modal state for edit building
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
  const [editedBuildingId, setEditedBuildingId] = useState<string | null>(null);

  // State for editing building
  const [editBarilgaNer, setEditBarilgaNer] = useState<string>("");
  const [editOrtsCount, setEditOrtsCount] = useState<number | "">(0);
  const [editDavkharCount, setEditDavkharCount] = useState<number | "">(0);
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(false);

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

  // useEffects from UndsenMedeelel - modified to use hardcoded data
  useEffect(() => {
    // Initialize with hardcoded data instead of API call
    setTatvariinAlbaData({
      jagsaalt: Object.keys(districts).flatMap((city) =>
        districts[city].map((district) => ({
          _id: district,
          ner: district,
          kod: district,
          ded:
            subDistricts[district]?.map((horoo) => ({
              _id: horoo,
              ner: horoo,
              kod: horoo,
            })) || [],
        }))
      ),
    });

    // Preload sohNer if available - prefer selected building, then first building, then org-level, then org name
    const effBarilgaId = selectedBuildingId || null;
    const allBuildings = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!
      : [];
    const selectedBarilga = effBarilgaId
      ? allBuildings.find((b: any) => String(b._id) === String(effBarilgaId))
      : allBuildings[0];
    if (selectedBarilga?.tokhirgoo?.sohNer) {
      setSohNer(String(selectedBarilga.tokhirgoo.sohNer));
    } else if (
      baiguullaga?.tokhirgoo &&
      (baiguullaga.tokhirgoo as any)?.sohNer
    ) {
      setSohNer(String((baiguullaga.tokhirgoo as any).sohNer));
    } else if (baiguullaga?.ner) {
      setSohNer(String(baiguullaga.ner));
    }
  }, [selectedBuildingId, baiguullaga]);

  // Initialize form state and initial snapshot whenever relevant data or selection changes
  useEffect(() => {
    if (!tatvariinAlbaData?.jagsaalt) return;

    // Prefer selected building tokhirgoo; fallback to org-level (no localStorage)
    const effBarilgaId = selectedBuildingId || null;
    const allBuildings = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!
      : [];
    const selectedBarilga = effBarilgaId
      ? allBuildings.find((b: any) => String(b._id) === String(effBarilgaId))
      : allBuildings[0];
    const effectiveTokhirgoo = (selectedBarilga?.tokhirgoo ||
      baiguullaga?.tokhirgoo) as any;

    // Derive SÖH name first to avoid async setState timing issues
    // Prefer a first "real" building that is not just a duplicate of organization
    const firstBuilding = (() => {
      if (
        !Array.isArray(baiguullaga?.barilguud) ||
        baiguullaga.barilguud.length === 0
      )
        return null;
      const orgName = (baiguullaga?.ner || "").trim();
      const isRealBuilding = (b: any) => {
        try {
          const name = (b?.ner || "").trim();
          if (!name) return false;
          if (orgName && name !== orgName) return true;
          const tok = b?.tokhirgoo || {};
          if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
            return true;
          if (tok?.orts || b?.khayag || b?.register) return true;
        } catch (_) {}
        return false;
      };
      return (
        baiguullaga.barilguud.find(isRealBuilding) || baiguullaga.barilguud[0]
      );
    })();
    const derivedSohNer = selectedBarilga?.tokhirgoo?.sohNer
      ? String(selectedBarilga.tokhirgoo.sohNer)
      : firstBuilding?.tokhirgoo?.sohNer
      ? String(firstBuilding.tokhirgoo.sohNer)
      : (baiguullaga?.tokhirgoo as any)?.sohNer
      ? String((baiguullaga!.tokhirgoo as any).sohNer)
      : baiguullaga?.ner
      ? String(baiguullaga.ner)
      : "";

    // Find duureg and horoo matches from hardcoded data
    let duuregMatch: Duureg | undefined;
    let horooMatch: Horoo | undefined;
    if (effectiveTokhirgoo) {
      const tok = effectiveTokhirgoo as any;
      if (tok?.duuregNer) {
        duuregMatch = tatvariinAlbaData.jagsaalt.find(
          (d) => d.ner === tok.duuregNer
        );
      }
      if (duuregMatch) {
        horooMatch = (duuregMatch.ded || []).find(
          (h) => h.ner === tok?.horoo?.ner
        );
      }
    }

    // Apply to state (reset to the currently selected building's values)
    setState((s) => ({
      ...s,
      selectedDuureg: duuregMatch?._id || "",
      selectedDuuregData: duuregMatch || undefined,
      selectedHoroo: horooMatch?.kod || "",
      selectedHorooData: horooMatch || undefined,
    }));
    setSohNer(derivedSohNer);

    // Capture initial snapshot for dirty-checking for the current selection
    setInitialValues({
      selectedDuureg: duuregMatch?._id || "",
      selectedHoroo: horooMatch?.kod || "",
      sohNer: derivedSohNer,
    });
  }, [tatvariinAlbaData, baiguullaga, selectedBuildingId]);

  // Update sohNer state when baiguullaga changes (after save operations)
  useEffect(() => {
    // Prefer a first "real" building when deriving sohNer and initial values
    const firstBuilding = (() => {
      if (
        !Array.isArray(baiguullaga?.barilguud) ||
        baiguullaga.barilguud.length === 0
      )
        return null;
      const orgName = (baiguullaga?.ner || "").trim();
      const isRealBuilding = (b: any) => {
        try {
          const name = (b?.ner || "").trim();
          if (!name) return false;
          if (orgName && name !== orgName) return true;
          const tok = b?.tokhirgoo || {};
          if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
            return true;
          if (tok?.orts || b?.khayag || b?.register) return true;
        } catch (_) {}
        return false;
      };
      return (
        baiguullaga.barilguud.find(isRealBuilding) || baiguullaga.barilguud[0]
      );
    })();
    if (firstBuilding?.tokhirgoo?.sohNer) {
      setSohNer(String(firstBuilding.tokhirgoo.sohNer));
    } else if ((baiguullaga as any)?.sohNer) {
      setSohNer(String((baiguullaga as any).sohNer));
    } else if (
      baiguullaga?.tokhirgoo &&
      (baiguullaga.tokhirgoo as any)?.sohNer
    ) {
      setSohNer(String((baiguullaga.tokhirgoo as any).sohNer));
    }
  }, [baiguullaga]);

  const incrementOrts = () => {
    setOrtsCount((prev: any) => {
      const n = Number(prev) || 0;
      return n + 1;
    });
  };

  // Handlers from UndsenMedeelel
  const handleDuuregChange = (duuregName: string) => {
    setState((s) => ({
      ...s,
      selectedDuureg: duuregName,
      selectedDuuregData: {
        _id: duuregName,
        ner: duuregName,
        kod: duuregName,
      } as Duureg,
      selectedHoroo: "",
      selectedHorooData: undefined,
    }));
  };

  const handleHorooChange = (horooName: string) => {
    if (!state.selectedDuureg) {
      openErrorOverlay("Дүүрэг эхлээд сонгоно уу");
      return;
    }

    const horooData = {
      _id: horooName,
      ner: horooName,
      kod: horooName,
    } as Horoo;
    setState((s) => ({
      ...s,
      selectedHoroo: horooName,
      selectedHorooData: horooData,
    }));
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
          // associate building with organization explicitly
          baiguullagiinId: baiguullaga?._id,
        };
        // mark newly created building as inheriting organization/main tokhirgoo
        // until the user explicitly edits this building
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
          // Mark this building as customized because user saved changes for it
          // so it should no longer be overwritten by org-level updates
          return { ...b, tokhirgoo };
        });
      }

      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga._id,
        // explicit organization id to ensure server updates the correct org
        baiguullagiinId: String(baiguullaga._id),
        barilguud: updatedBarilguud,
      };

      const res = await updateMethod("baiguullaga", token, payload);
      if (res?.data) await baiguullagaMutate(res.data, false);
      await baiguullagaMutate();

      if (name) {
        openSuccessOverlay("Шинэ барилга нэмэгдлээ");
        setNewBarilgaNer("");
        if (res?.data?.barilguud && res.data.barilguud.length > 0) {
          const added =
            res.data.barilguud.find((b: any) => b.ner === name) ||
            res.data.barilguud[res.data.barilguud.length - 1];
          if (added?._id) setSelectedBuildingId(String(added._id));
        }
        // close modal after successful add
        setIsNewBuildingModalOpen(false);
      } else {
        openSuccessOverlay("Барилгын тохиргоо амжилттай хадгалагдлаа");
      }
    } catch (e) {
      openErrorOverlay("Тохиргоо хадгалах явцад алдаа гарлаа");
    }
  };

  const handleSaveEditBuilding = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }
    if (!editedBuildingId) {
      openErrorOverlay("Барилга олдсонгүй");
      return;
    }

    try {
      const name = (editBarilgaNer || "").trim();
      const count = Number(editDavkharCount) || 0;
      const ortsNum = Number(editOrtsCount) || 0;

      if (!name) {
        openErrorOverlay("Барилгын нэр оруулна уу");
        return;
      }
      if (count <= 0) {
        openErrorOverlay("Барилгын давхарын тоо оруулна уу");
        return;
      }

      // Update existing building
      let updatedBarilguud: any[] = [...(baiguullaga?.barilguud || [])];
      updatedBarilguud = updatedBarilguud.map((b: any) => {
        if (String(b._id) !== String(editedBuildingId)) return b;
        const tokhirgoo = {
          ...(b.tokhirgoo || {}),
          orts: String(ortsNum),
          davkhar: Array.from({ length: count }, (_, i) => String(i + 1)),
        } as any;
        return { ...b, ner: name, tokhirgoo };
      });

      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga._id,
        baiguullagiinId: String(baiguullaga._id),
        barilguud: updatedBarilguud,
      };

      const res = await updateMethod("baiguullaga", token, payload);
      if (res?.data) await baiguullagaMutate(res.data, false);
      await baiguullagaMutate();

      openSuccessOverlay("Барилга амжилттай засагдлаа");
      setIsEditBuildingModalOpen(false);
    } catch (e) {
      openErrorOverlay("Барилга засах явцад алдаа гарлаа");
    }
  };

  const handleEditBuilding = (id: string) => {
    setEditedBuildingId(id);
    setHasUserEdited(false);
    setIsEditBuildingModalOpen(true);
  };

  // Pre-fill edit modal when opening
  useEffect(() => {
    if (!isEditBuildingModalOpen || !editedBuildingId) return;
    if (hasUserEdited) return; // Don't reset if user has started editing
    const building = baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(editedBuildingId)
    );
    if (building) {
      setEditBarilgaNer(building.ner || "");
      const tok = building.tokhirgoo || {};
      const ortsFrom = tok.orts || [];
      const ortsNum = Array.isArray(ortsFrom)
        ? ortsFrom.length
        : Number(ortsFrom) || 0;
      setEditOrtsCount(ortsNum);
      const davFrom = tok.davkhar || [];
      const davCount = Array.isArray(davFrom)
        ? davFrom.length
        : Number(davFrom) || 0;
      setEditDavkharCount(davCount);
    }
  }, [isEditBuildingModalOpen, editedBuildingId, baiguullaga, hasUserEdited]);

  const handleDeleteBuilding = async (id: string) => {
    // open confirm modal instead of immediate delete
    if (!token) return openErrorOverlay("Нэвтрэх шаардлагатай");
    if (!baiguullaga?._id) return openErrorOverlay("Байгууллага олдсонгүй");
    const building = baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(id)
    );
    setBuildingToDelete({ id: String(id), ner: building?.ner || "" });
    setDeleteModalOpen(true);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<{
    id: string;
    ner?: string;
  } | null>(null);

  const confirmDeleteBuilding = async () => {
    const id = buildingToDelete?.id;
    if (!id) return setDeleteModalOpen(false);
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллага олдсонгүй");
      return;
    }

    try {
      const updatedBarilguud = (baiguullaga?.barilguud || []).filter(
        (b: any) => String(b._id) !== String(id)
      );
      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga._id,
        baiguullagiinId: String(baiguullaga._id),
        barilguud: updatedBarilguud,
      } as any;

      const res = await updateMethod("baiguullaga", token, payload);
      if (res?.data) await baiguullagaMutate(res.data, false);
      await baiguullagaMutate();

      openSuccessOverlay("Барилга устгагдлаа");

      // If deleted building was selected, pick first available or clear
      if (String(selectedBuildingId) === String(id)) {
        const first = (updatedBarilguud || []).find(
          (b: any) =>
            !b?.baiguullagiinId ||
            String(b.baiguullagiinId) === String(baiguullaga._id)
        );
        setSelectedBuildingId(first?._id ? String(first._id) : null);
      }
      setDeleteModalOpen(false);
      setBuildingToDelete(null);
    } catch (e) {
      openErrorOverlay("Барилга устгах явцад алдаа гарлаа");
    }
  };

  // Functions from UndsenMedeelel
  const khadgalakh = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх токен олдсонгүй");
      return;
    }

    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }

    // Check if there are any changes
    const hasChanges =
      state.selectedDuureg !== initialValues.selectedDuureg ||
      state.selectedHoroo !== initialValues.selectedHoroo ||
      sohNer.trim() !== (initialValues.sohNer || "").trim();

    if (!hasChanges) {
      openErrorOverlay("Өөрчлөлт байхгүй байна");
      return;
    }

    if (!state.selectedDuuregData) {
      openErrorOverlay("Дүүрэг сонгоно уу");
      return;
    }

    if (!state.selectedHorooData) {
      openErrorOverlay("Хороо сонго уу");
      return;
    }

    setIsSaving(true);

    try {
      const duuregKod = state.selectedDuuregData.kod || "";
      const horooKod = state.selectedHorooData.kod || "";
      const districtCodeCombined = `${duuregKod}${horooKod}`;

      // Ensure we have a valid sohNer value
      const finalSohNer = sohNer || baiguullaga?.ner || "";

      // Propagate shared location and SÖH name across all buildings too
      const newTokhirgoo = {
        ...(baiguullaga?.tokhirgoo || {}),
        duuregNer: state.selectedDuuregData.ner,
        districtCode: districtCodeCombined,
        horoo: {
          ner: state.selectedHorooData.ner,
          kod: state.selectedHorooData.kod,
        },
        sohNer: finalSohNer,
      } as any;

      // Update only the selected building's tokhirgoo (do NOT overwrite other buildings)
      const targetBuildingId =
        activeBuildingId || selectedBuildingId || barilgiinId;
      const newBarilguud = (baiguullaga?.barilguud || []).map((b: any) => {
        if (!targetBuildingId || String(b._id) !== String(targetBuildingId))
          return b;
        return {
          ...b,
          baiguullagiinId: b.baiguullagiinId || baiguullaga?._id,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            duuregNer: newTokhirgoo.duuregNer,
            districtCode: newTokhirgoo.districtCode,
            horoo: { ...(newTokhirgoo.horoo || {}) },
            sohNer: newTokhirgoo.sohNer,
          },
        };
      });

      // Update organization payload but keep org-level tokhirgoo unchanged
      // (we only want to persist the change to the selected building)
      const payload = {
        ...(baiguullaga || {}),
        _id: baiguullaga!._id,
        baiguullagiinId: String(baiguullaga!._id),
        eBarimtAutomataarIlgeekh:
          typeof baiguullaga?.eBarimtAutomataarIlgeekh === "boolean"
            ? baiguullaga?.eBarimtAutomataarIlgeekh
            : false,
        nuatTulukhEsekh:
          typeof baiguullaga?.nuatTulukhEsekh === "boolean"
            ? baiguullaga?.nuatTulukhEsekh
            : false,
        eBarimtAshiglakhEsekh: baiguullaga?.eBarimtAshiglakhEsekh ?? true,
        eBarimtShine: baiguullaga?.eBarimtShine ?? false,
        // keep baiguullaga.tokhirgoo as-is (do not overwrite org-level defaults)
        tokhirgoo: baiguullaga?.tokhirgoo,
        barilguud: newBarilguud,
      };

      const updated = await updateMethod("baiguullaga", token, payload);

      if (updated?.data) {
        // Optimistically update cache with server response
        await baiguullagaMutate(updated.data, false);
      }

      // Show success overlay
      openSuccessOverlay("Амжилттай хадгаллаа", 2000);

      // Revalidate in background
      const revalidated = await baiguullagaMutate();

      // Removed localStorage persistence for API-backed tokhirgoo

      // Update initial values after successful save
      setInitialValues({
        selectedDuureg: state.selectedDuureg || "",
        selectedHoroo: state.selectedHoroo || "",
        sohNer: sohNer || "",
      });

      // Stay on the current tab after save
    } catch (err) {
      aldaaBarigch(err);
      openErrorOverlay("Хадгалахад алдаа гарлаа");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDistrict = tatvariinAlbaData?.jagsaalt.find(
    (d) => d._id === state.selectedDuureg
  );

  // Derived dirty flag for UI (disable Save when no changes)
  const isDirty = useMemo(() => {
    return (
      (state.selectedDuureg || "") !== (initialValues.selectedDuureg || "") ||
      (state.selectedHoroo || "") !== (initialValues.selectedHoroo || "") ||
      (sohNer || "").trim() !== (initialValues.sohNer || "").trim()
    );
  }, [state.selectedDuureg, state.selectedHoroo, sohNer, initialValues]);

  // Removed save handler since орц/давхар settings are no longer editable from here

  if (!isInit) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="xxl:col-span-9 col-span-12 lg:col-span-12 h-[650px]">
      <div className="neu-panel allow-overflow p-4 md:p-6 space-y-6 h-full overflow-auto custom-scrollbar">
        <div className="w-full">
          <label className="block text-sm font-medium text-theme mb-1">
            СӨХ-ийн нэр
          </label>
          <input
            type="text"
            value={sohNer}
            onChange={(e) => setSohNer(e.target.value)}
            placeholder="СӨХ-ийн нэрийг оруулна уу"
            className="w-full px-3 py-2 neu-panel focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1) Дүүрэг */}
          <div className="w-full">
            <label className="block text-sm font-medium text-theme mb-1">
              Дүүрэг
            </label>
            <TusgaiZagvar
              value={state.selectedDuureg || ""}
              onChange={(v) => handleDuuregChange(v)}
              options={Object.keys(districts).flatMap((city) =>
                districts[city].map((district) => ({
                  value: district,
                  label: district,
                }))
              )}
              placeholder="Сонгоно уу"
              className="w-full"
              // allow selecting district per-branch as well
              disabled={false}
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-theme mb-1">
              Хороо
            </label>
            <TusgaiZagvar
              value={state.selectedHoroo || ""}
              onChange={(v) => handleHorooChange(v)}
              options={
                state.selectedDuureg && subDistricts[state.selectedDuureg]
                  ? subDistricts[state.selectedDuureg].map((horoo) => ({
                      value: horoo,
                      label: horoo,
                    }))
                  : []
              }
              placeholder="Сонгоно уу"
              className="w-full"
              // enable horoo selection when duureg selected (branch-level editable)
              disabled={!state.selectedDuureg}
            />
          </div>

          {/* 4) СӨХ-ийн нэр */}
        </div>
        {/* Buildings list with edit/delete actions */}
        {/* Show building list for all buildings */}
        {orgBuildings && orgBuildings.length > 0 && (
          <div className="space-y-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-theme">
                Бүртгэлтэй барилгууд (Байр)
              </h3>
              <button
                onClick={openNewBuildingModal}
                className="btn-minimal btn-save"
                title="Шинэ барилга нэмэх"
              >
                <Plus className="w-4 h-4" />
              </button>
              {/* <div className="text-sm text-slate-500">
                Нийт: {orgBuildings.length}
              </div> */}
            </div>
            <ul className="divide-y max-h-64 overflow-y-auto">
              {orgBuildings.map((b: any, index: number) => {
                return (
                  <li
                    key={b._id}
                    className="py-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setSelectedBuildingId(String(b._id))}
                        className="cursor-pointer text-left px-2 py-1 hover:underline"
                      >
                        {b.ner || "-"}
                      </div>
                      <div className="text-xs text-slate-500"></div>
                    </div>
                    {/* Edit/Delete are available for all buildings */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditBuilding(String(b._id))}
                        className="btn-minimal btn-edit p-2"
                        title="Засах"
                      >
                        <Edit className="w-4 h-4 text-blue-700" />
                      </button>
                      <button
                        onClick={() => handleDeleteBuilding(String(b._id))}
                        className="btn-minimal btn-delete p-2"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!barilga && (
          <div className="p-3 rounded-2xl border border-blue-300 text-blue-700 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              Барилга олдсонгүй. Зөвхөн мэдээллийг харах боломжтой. Барилга
              сонгох эсвэл шинээр нэмнэ үү.
            </div>
            <div className="flex items-center gap-2">
              {/* Allow adding a building even when none exist */}
              <button
                onClick={openNewBuildingModal}
                className="btn-minimal btn-add p-2"
                title="Шинэ барилга нэмэх"
              >
                <Plus className="w-4 h-4 mr-2 inline" /> Шинэ барилга
              </button>
            </div>
          </div>
        )}

        {/* Info grid */}

        {/* Single Save button */}
        <div className="flex justify-end">
          <button
            onClick={khadgalakh}
            className={`btn-minimal btn-save ${
              !isDirty || isSaving ? "opacity-60 cursor-not-allowed" : ""
            }`}
            // allow saving for branch-level edits as well
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
        {/* New building modal (portal) */}
        <NewBuildingModal
          open={isNewBuildingModalOpen}
          onClose={() => setIsNewBuildingModalOpen(false)}
          newBarilgaNer={newBarilgaNer}
          setNewBarilgaNer={setNewBarilgaNer}
          ortsCount={ortsCount}
          setOrtsCount={setOrtsCount}
          davkharCount={davkharCount}
          setDavkharCount={setDavkharCount}
          handleSaveSettings={handleSaveSettings}
          isSaving={isSaving}
        />
        {/* Edit building modal (portal) */}
        <EditBuildingModal
          open={isEditBuildingModalOpen}
          onClose={() => setIsEditBuildingModalOpen(false)}
          editBarilgaNer={editBarilgaNer}
          setEditBarilgaNer={setEditBarilgaNer}
          editOrtsCount={editOrtsCount}
          setEditOrtsCount={setEditOrtsCount}
          editDavkharCount={editDavkharCount}
          setEditDavkharCount={setEditDavkharCount}
          hasUserEdited={hasUserEdited}
          setHasUserEdited={setHasUserEdited}
          editedBuildingId={editedBuildingId}
          baiguullaga={baiguullaga}
          handleSaveEditBuilding={handleSaveEditBuilding}
          isSaving={isSaving}
        />
        <MModal
          title="Баталгаажуулалт"
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          classNames={{
            content: "modal-surface modal-responsive",
            header:
              "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
            title: "text-theme font-semibold",
            close:
              "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
          }}
          overlayProps={{ opacity: 0.5, blur: 6 }}
          centered
          size="sm"
        >
          <div className="space-y-4 mt-4">
            <p className="text-theme">
              Та "{buildingToDelete?.ner}" барилгыг устгахдаа итгэлтэй байна уу?
              Энэ үйлдэл буцаагдахгүй.
            </p>
            <div className="flex justify-end gap-2">
              <MButton
                onClick={() => setDeleteModalOpen(false)}
                className="btn-minimal"
              >
                Болих
              </MButton>
              <MButton
                color="red"
                onClick={confirmDeleteBuilding}
                className="btn-minimal btn-cancel"
              >
                Устгах
              </MButton>
            </div>
          </div>
        </MModal>
        {/* Entrances and Floors moved inside the modal (full-screen) */}
      </div>
    </div>
  );
}
