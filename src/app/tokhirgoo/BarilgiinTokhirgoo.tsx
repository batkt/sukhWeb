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
  const [sukhDugaar, setSukhDugaar] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState({
    selectedDuureg: "",
    selectedHoroo: "",
    sohNer: "",
    sukhDugaar: "",
    email: "",
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
      // try to set phone/email from building tokhirgoo (best-effort)
      const ut =
        (selectedBarilga as any).tokhirgoo?.utas ||
        (selectedBarilga as any).utas ||
        [];
      const ml =
        (selectedBarilga as any).tokhirgoo?.mail ||
        (selectedBarilga as any).mail ||
        [];
      setSukhDugaar(String((Array.isArray(ut) ? ut[0] : ut) || ""));
      setEmail(String((Array.isArray(ml) ? ml[0] : ml) || ""));
    } else if (
      baiguullaga?.tokhirgoo &&
      (baiguullaga.tokhirgoo as any)?.sohNer
    ) {
      setSohNer(String((baiguullaga.tokhirgoo as any).sohNer));
      const ut =
        (baiguullaga as any).tokhirgoo?.utas || (baiguullaga as any).utas || [];
      const ml =
        (baiguullaga as any).tokhirgoo?.mail || (baiguullaga as any).mail || [];
      setSukhDugaar(String((Array.isArray(ut) ? ut[0] : ut) || ""));
      setEmail(String((Array.isArray(ml) ? ml[0] : ml) || ""));
    } else if (baiguullaga?.ner) {
      setSohNer(String(baiguullaga.ner));
      const ut = (baiguullaga as any).utas || [];
      const ml = (baiguullaga as any).mail || [];
      setSukhDugaar(String((Array.isArray(ut) ? ut[0] : ut) || ""));
      setEmail(String((Array.isArray(ml) ? ml[0] : ml) || ""));
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

    // Derive contact fields (phone/email) from selected building, then org
    const rawPhone =
      (selectedBarilga as any)?.tokhirgoo?.utas ||
      (selectedBarilga as any)?.utas ||
      (baiguullaga as any)?.tokhirgoo?.utas ||
      (baiguullaga as any)?.utas ||
      [];
    const rawEmail =
      (selectedBarilga as any)?.tokhirgoo?.mail ||
      (selectedBarilga as any)?.mail ||
      (baiguullaga as any)?.tokhirgoo?.mail ||
      (baiguullaga as any)?.mail ||
      [];
    const derivedPhone = Array.isArray(rawPhone) ? rawPhone[0] : rawPhone || "";
    const derivedEmail = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail || "";

    // Capture initial snapshot for dirty-checking for the current selection
    setInitialValues({
      selectedDuureg: duuregMatch?._id || "",
      selectedHoroo: horooMatch?.kod || "",
      sohNer: derivedSohNer,
      sukhDugaar: derivedPhone || "",
      email: derivedEmail || "",
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

    // Also update contact fields (phone/email) from the server-provided
    // selected building first, then organization-level tokhirgoo, then
    // top-level arrays. This is executed directly (no nested hooks).
    try {
      const serverOrg = baiguullaga as any;
      const sel = barilga as any;
      let phone: any = "";
      let mailAddr: any = "";

      if (sel) {
        const sbTok = sel.tokhirgoo || {};
        const sbU = sbTok.utas ?? sel.utas ?? [];
        const sbM = sbTok.mail ?? sel.mail ?? [];
        if (Array.isArray(sbU) && sbU.length > 0) phone = sbU[0];
        else if (sbU && !Array.isArray(sbU)) phone = sbU;
        if (Array.isArray(sbM) && sbM.length > 0) mailAddr = sbM[0];
        else if (sbM && !Array.isArray(sbM)) mailAddr = sbM;
      }

      if (!phone) {
        const orgTok = (serverOrg?.tokhirgoo as any) || {};
        const orgU = orgTok.utas ?? serverOrg?.utas ?? [];
        if (Array.isArray(orgU) && orgU.length > 0) phone = orgU[0];
        else if (orgU && !Array.isArray(orgU)) phone = orgU;
      }

      if (!mailAddr) {
        const orgTok = (serverOrg?.tokhirgoo as any) || {};
        const orgM = orgTok.mail ?? serverOrg?.mail ?? [];
        if (Array.isArray(orgM) && orgM.length > 0) mailAddr = orgM[0];
        else if (orgM && !Array.isArray(orgM)) mailAddr = orgM;
      }

      setSukhDugaar(String(phone || ""));
      setEmail(String(mailAddr || ""));
      setInitialValues((prev) => ({
        ...prev,
        sukhDugaar: String(phone || ""),
        email: String(mailAddr || ""),
      }));
    } catch (e) {
      // ignore
    }
  }, [baiguullaga, barilga, selectedBuildingId]);

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

  // Handler for creating a new building (used by NewBuildingModal)
  const handleSaveSettings = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }

    const name = (newBarilgaNer || "").trim();
    const davCount = Number(davkharCount) || 0;
    const ortsNum = Number(ortsCount) || 0;

    if (!name) {
      openErrorOverlay("Барилгын нэр оруулна уу");
      return;
    }
    if (davCount <= 0) {
      openErrorOverlay("Барилгын давхарын тоо оруулна уу");
      return;
    }

    setIsSaving(true);
    try {
      const newBuilding: any = {
        // backend will assign _id; keep minimal required fields
        ner: name,
        baiguullagiinId: String(baiguullaga._id),
        tokhirgoo: {
          orts: String(ortsNum),
          davkhar: Array.from({ length: davCount }, (_, i) => String(i + 1)),
        },
      };

      const updatedBarilguud = [...(baiguullaga?.barilguud || []), newBuilding];

      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga._id,
        baiguullagiinId: String(baiguullaga._id),
        barilguud: updatedBarilguud,
      } as any;

      const res = await updateMethod("baiguullaga", token, payload);

      if (res?.data) {
        await baiguullagaMutate(res.data, false);
        // set the selected building to the newly created one if backend returned an id
        try {
          const server = res.data as any;
          const created = (server.barilguud || []).find(
            (b: any) =>
              b.ner === name &&
              String(b.baiguullagiinId) === String(baiguullaga._id)
          );
          if (created && created._id)
            setSelectedBuildingId(String(created._id));
        } catch (_) {}
      }

      // Revalidate to ensure freshest data
      await baiguullagaMutate();

      openSuccessOverlay("Шинэ барилга амжилттай нэмэгдлээ");
      setIsNewBuildingModalOpen(false);
      // clear inputs
      setNewBarilgaNer("");
      setOrtsCount("");
      setDavkharCount("");
    } catch (e) {
      aldaaBarigch(e);
      openErrorOverlay("Шинэ барилга нэмэх явцад алдаа гарлаа");
    } finally {
      setIsSaving(false);
    }
  };

  // Functions from UndsenMedeelel
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
      sohNer.trim() !== (initialValues.sohNer || "").trim() ||
      (sukhDugaar || "") !== (initialValues.sukhDugaar || "") ||
      (email || "") !== (initialValues.email || "");

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

    // Validate contacts if provided: phone must be exactly 8 digits, email must contain '@'
    if (sukhDugaar && !/^\d{8}$/.test(sukhDugaar)) {
      openErrorOverlay("Утас 8 оронтой тоо байх ёстой");
      return;
    }
    if (email && !/@/.test(email)) {
      openErrorOverlay("Email хаяг зөв байх ёстой (@ агуулагдана)");
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
        // persist contact info as arrays per backend shape
        utas: sukhDugaar
          ? [sukhDugaar]
          : (baiguullaga as any)?.tokhirgoo?.utas ||
            (baiguullaga as any)?.utas ||
            [],
        mail: email
          ? [email]
          : (baiguullaga as any)?.tokhirgoo?.mail ||
            (baiguullaga as any)?.mail ||
            [],
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
      // Build org-level tokhirgoo to include contact fields so the
      // backend will save them against the current organization
      const orgTokhirgoo = {
        ...(baiguullaga?.tokhirgoo || {}),
        utas: sukhDugaar
          ? [sukhDugaar]
          : (baiguullaga as any)?.tokhirgoo?.utas ||
            (baiguullaga as any)?.utas ||
            [],
        mail: email
          ? [email]
          : (baiguullaga as any)?.tokhirgoo?.mail ||
            (baiguullaga as any)?.mail ||
            [],
      } as any;

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
        // write updated org-level tokhirgoo (including utas/mail)
        tokhirgoo: orgTokhirgoo,
        // also keep top-level utas/mail in sync
        utas: orgTokhirgoo.utas || [],
        mail: orgTokhirgoo.mail || [],
        barilguud: newBarilguud,
      } as any;

      const updated = await updateMethod("baiguullaga", token, payload);

      if (updated?.data) {
        // Optimistically update cache with server response
        await baiguullagaMutate(updated.data, false);
        // Also update local UI state from the server response so contacts show immediately
        try {
          const server = updated.data as any;
          const serverTok = server.tokhirgoo || {};
          const serverUtas = Array.isArray(serverTok?.utas)
            ? serverTok.utas
            : Array.isArray(server?.utas)
            ? server.utas
            : serverTok?.utas
            ? [serverTok.utas]
            : server?.utas
            ? [server.utas]
            : [];
          const serverMail = Array.isArray(serverTok?.mail)
            ? serverTok.mail
            : Array.isArray(server?.mail)
            ? server.mail
            : serverTok?.mail
            ? [serverTok.mail]
            : server?.mail
            ? [server.mail]
            : [];
          setSukhDugaar(String(serverUtas[0] || ""));
          setEmail(String(serverMail[0] || ""));
          // update displayed SÖH name if server provided one
          if (serverTok?.sohNer) setSohNer(String(serverTok.sohNer));
          // reflect saved values in initial snapshot
          setInitialValues((prev) => ({
            ...prev,
            sukhDugaar: String(serverUtas[0] || ""),
            email: String(serverMail[0] || ""),
            sohNer: String(
              serverTok?.sohNer || server.ner || prev.sohNer || ""
            ),
          }));
        } catch (e) {
          // ignore UI-sync errors
        }
      }

      // Show success overlay
      openSuccessOverlay("Амжилттай хадгаллаа", 2000);

      // Revalidate in background
      const revalidated = await baiguullagaMutate();

      // Removed localStorage persistence for API-backed tokhirgoo

      // Update initial values after successful save (include contact fields)
      setInitialValues({
        selectedDuureg: state.selectedDuureg || "",
        selectedHoroo: state.selectedHoroo || "",
        sohNer: sohNer || "",
        sukhDugaar: sukhDugaar || "",
        email: email || "",
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
      (sohNer || "").trim() !== (initialValues.sohNer || "").trim() ||
      (sukhDugaar || "") !== (initialValues.sukhDugaar || "") ||
      (email || "") !== (initialValues.email || "")
    );
  }, [
    state.selectedDuureg,
    state.selectedHoroo,
    sohNer,
    sukhDugaar,
    email,
    initialValues,
  ]);

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
          <div className="w-full">
            <label className="block text-sm font-medium text-theme mb-1">
              Утас
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="\d*"
              maxLength={8}
              value={sukhDugaar}
              onChange={(e) => {
                // Allow only digits and limit to 8 characters
                const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                setSukhDugaar(digits);
              }}
              placeholder="Утас дугаар оруулна уу"
              className="w-full px-3 py-2 neu-panel focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-theme mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email хаяг оруулна уу"
              className="w-full px-3 py-2 neu-panel focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
