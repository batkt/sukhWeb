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
  X,
} from "lucide-react";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
import updateMethod from "../../../tools/function/updateMethod";
import createMethod from "../../../tools/function/createMethod";
import { useAuth } from "@/lib/useAuth";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import Button from "@/components/ui/Button";

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
  handleSaveEditBuilding: (selectedDuureg?: string, selectedHoroo?: string) => Promise<void>;
  isSaving: boolean;
  districts: Record<string, string[]>;
  subDistricts: Record<string, string[]>;
  editSelectedDuureg: string;
  setEditSelectedDuureg: (value: string) => void;
  editSelectedHoroo: string;
  setEditSelectedHoroo: (value: string) => void;
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
  districts,
  subDistricts,
  editSelectedDuureg,
  setEditSelectedDuureg,
  editSelectedHoroo,
  setEditSelectedHoroo,
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

  const handleEditDuuregChange = (duuregName: string) => {
    setEditSelectedDuureg(duuregName);
    setEditSelectedHoroo(""); // Reset horoo when duureg changes
    setHasUserEdited(true);
  };

  const handleEditHorooChange = (horooName: string) => {
    if (!editSelectedDuureg) {
      openErrorOverlay("Дүүрэг эхлээд сонгоно уу");
      return;
    }
    setEditSelectedHoroo(horooName);
    setHasUserEdited(true);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-2xl bg-[color:var(--surface-bg)] rounded-2xl shadow-2xl border border-[color:var(--surface-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-xl font-semibold text-[color:var(--panel-text)]">
                  Барилга засах
                </h3>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  Барилгын мэдээллийг шинэчлэх
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Building Name Section */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[color:var(--panel-text)]">
              Барилгын нэр <span className="text-red-500">*</span>
            </label>
            <input
              id="barilgiin-edit-name"
              type="text"
              value={editBarilgaNer}
              onChange={(e) => {
                setEditBarilgaNer(e.target.value);
                setHasUserEdited(true);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Жишээ: А барилга, Б барилга..."
              className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
            />
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)]">
              <MapPin className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-[color:var(--panel-text)]">
                Байршил
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="barilgiin-duureg" className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Дүүрэг <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <TusgaiZagvar
                    value={editSelectedDuureg || ""}
                    onChange={(v) => handleEditDuuregChange(v)}
                    options={Object.keys(districts).flatMap((city) =>
                      districts[city].map((district) => ({
                        value: district,
                        label: district,
                      })),
                    )}
                    placeholder="Дүүрэг сонгоно уу"
                    className="w-full"
                    disabled={false}
                  />
                </div>
              </div>

              <div id="barilgiin-horoo" className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Хороо <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <TusgaiZagvar
                    value={editSelectedHoroo || ""}
                    onChange={(v) => handleEditHorooChange(v)}
                    options={
                      editSelectedDuureg && subDistricts[editSelectedDuureg]
                        ? subDistricts[editSelectedDuureg].map((horoo) => ({
                            value: horoo,
                            label: horoo,
                          }))
                        : []
                    }
                    placeholder={editSelectedDuureg ? "Хороо сонгоно уу" : "Эхлээд дүүрэг сонгоно уу"}
                    className="w-full"
                    disabled={!editSelectedDuureg}
                  />
                  {!editSelectedDuureg && (
                    <p className="text-xs text-[color:var(--muted-text)] mt-1">
                      Дүүрэг сонгосны дараа хороо сонгох боломжтой
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Building Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)]">
              <Home className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-[color:var(--panel-text)]">
                Барилгын дэлгэрэнгүй
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Нийт орцын тоо <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={editOrtsCount}
                  onChange={(e) => {
                    setEditOrtsCount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    );
                    setHasUserEdited(true);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Нийт давхарын тоо <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={editDavkharCount}
                  onChange={(e) => {
                    setEditDavkharCount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    );
                    setHasUserEdited(true);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[color:var(--surface-border)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-colors font-medium text-sm"
            type="button"
            disabled={isSaving}
          >
            Цуцлах
          </button>
          <button
            className={`px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/20 ${
              isSaving ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl hover:shadow-blue-500/30"
            }`}
            onClick={() => handleSaveEditBuilding(editSelectedDuureg, editSelectedHoroo)}
            id="barilgiin-edit-save"
            disabled={isSaving}
            type="button"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Хадгалж байна...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Хадгалах
              </span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
  handleSaveSettings: (selectedDuureg?: string, selectedHoroo?: string) => Promise<void>;
  isSaving: boolean;
  districts: Record<string, string[]>;
  subDistricts: Record<string, string[]>;
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
  districts,
  subDistricts,
}) => {
  const [modalSelectedDuureg, setModalSelectedDuureg] = useState<string>("");
  const [modalSelectedHoroo, setModalSelectedHoroo] = useState<string>("");
  
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

  // Reset modal state when opening
  useEffect(() => {
    if (open) {
      setModalSelectedDuureg("");
      setModalSelectedHoroo("");
    }
  }, [open]);

  const handleModalDuuregChange = (duuregName: string) => {
    setModalSelectedDuureg(duuregName);
    setModalSelectedHoroo(""); // Reset horoo when duureg changes
  };

  const handleModalHorooChange = (horooName: string) => {
    if (!modalSelectedDuureg) {
      openErrorOverlay("Дүүрэг эхлээд сонгоно уу");
      return;
    }
    setModalSelectedHoroo(horooName);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-2xl bg-[color:var(--surface-bg)] rounded-2xl shadow-2xl border border-[color:var(--surface-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-xl font-semibold text-[color:var(--panel-text)]">
                  Шинэ барилга нэмэх
                </h3>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  Барилгын мэдээллийг бүрэн бөглөнө үү
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Building Name Section */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[color:var(--panel-text)]">
              Барилгын нэр <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newBarilgaNer}
              onChange={(e) => setNewBarilgaNer(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Жишээ: А барилга, Б барилга..."
              className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
            />
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)]">
              <MapPin className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-[color:var(--panel-text)]">
                Байршил
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="barilgiin-duureg" className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Дүүрэг <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <TusgaiZagvar
                    value={modalSelectedDuureg || ""}
                    onChange={(v) => handleModalDuuregChange(v)}
                    options={Object.keys(districts).flatMap((city) =>
                      districts[city].map((district) => ({
                        value: district,
                        label: district,
                      })),
                    )}
                    placeholder="Дүүрэг сонгоно уу"
                    className="w-full"
                    disabled={false}
                  />
                </div>
              </div>

              <div id="barilgiin-horoo" className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Хороо <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <TusgaiZagvar
                    value={modalSelectedHoroo || ""}
                    onChange={(v) => handleModalHorooChange(v)}
                    options={
                      modalSelectedDuureg && subDistricts[modalSelectedDuureg]
                        ? subDistricts[modalSelectedDuureg].map((horoo) => ({
                            value: horoo,
                            label: horoo,
                          }))
                        : []
                    }
                    placeholder={modalSelectedDuureg ? "Хороо сонгоно уу" : "Эхлээд дүүрэг сонгоно уу"}
                    className="w-full"
                    disabled={!modalSelectedDuureg}
                  />
                  {!modalSelectedDuureg && (
                    <p className="text-xs text-[color:var(--muted-text)] mt-1">
                      Дүүрэг сонгосны дараа хороо сонгох боломжтой
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Building Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)]">
              <Home className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-[color:var(--panel-text)]">
                Барилгын дэлгэрэнгүй
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Нийт орцын тоо <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={ortsCount}
                  onChange={(e) =>
                    setOrtsCount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Нийт давхарын тоо <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={davkharCount}
                  onChange={(e) =>
                    setDavkharCount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[color:var(--surface-border)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-colors font-medium text-sm"
            type="button"
            disabled={isSaving}
          >
            Цуцлах
          </button>
          <button
            className={`px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/20 ${
              isSaving ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl hover:shadow-blue-500/30"
            }`}
            onClick={() => handleSaveSettings(modalSelectedDuureg, modalSelectedHoroo)}
            id="barilgiin-new-save"
            disabled={isSaving}
            type="button"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Хадгалж байна...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Хадгалах
              </span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
                isRealBuilding(b),
            );
            if (preferred) return preferred._id;

            // Fallback: any building belonging to this org
            const anyForOrg = baiguullaga.barilguud.find(
              (b: any) =>
                !b?.baiguullagiinId ||
                String(b.baiguullagiinId) === String(baiguullaga._id),
            );
            return anyForOrg?._id ?? null;
          })()
        : null)
    );
  }, [selectedBuildingId, barilgiinId, baiguullaga?.barilguud]);

  const barilga = useMemo(() => {
    return baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(activeBuildingId),
    );
  }, [baiguullaga?.barilguud, activeBuildingId]);

  // Filter buildings that belong to this organization (baiguullagiinId) or lack the field
  const orgBuildings = useMemo(() => {
    if (!Array.isArray(baiguullaga?.barilguud)) return [];
    return baiguullaga!.barilguud!.filter(
      (b: any) =>
        !b?.baiguullagiinId ||
        String(b.baiguullagiinId) === String(baiguullaga?._id),
    );
  }, [baiguullaga]);

  useEffect(() => {
    const list = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!.filter(
          (b: any) =>
            !b?.baiguullagiinId ||
            String(b.baiguullagiinId) === String(baiguullaga!._id),
        )
      : [];

    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("selectedBuildingId")
        : null;
    if (baiguullaga && !selectedBuildingId && !stored && list.length > 0) {
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
  const [editSelectedDuureg, setEditSelectedDuureg] = useState<string>("");
  const [editSelectedHoroo, setEditSelectedHoroo] = useState<string>("");

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
        })),
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
      const dName = tok?.duuregNer || (baiguullaga as any)?.duureg || "";
      const hName = tok?.horoo?.ner || (baiguullaga as any)?.horoo?.ner || "";
      if (dName) {
        duuregMatch = tatvariinAlbaData.jagsaalt.find((d) => d.ner === dName);
      }
      if (duuregMatch) {
        horooMatch = (duuregMatch.ded || []).find((h) => h.ner === hName);
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

  // Helper to fetch the latest organization data without building filters
  // This is used before every map/filter update of the barilguud array
  // to prevent accidental deletion of buildings that may be missing from
  // the current component state due to building-level filtering.
  const fetchFreshOrg = async () => {
    if (!token || !baiguullaga?._id) return null;
    const res = await uilchilgee(token).get(`/baiguullaga/${baiguullaga._id}`, {
      headers: { "X-Org-Only": "1" },
    });
    return res.data;
  };

  const handleSaveEditBuilding = async (selectedDuureg?: string, selectedHoroo?: string) => {
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

      // Use fresh unfiltered organization data before mapping
      const freshOrg = await fetchFreshOrg();
      if (!freshOrg) {
        openErrorOverlay("Байгууллагын мэдээлэл шинэчлэхэд алдаа гарлаа");
        return;
      }

      // Update existing building
      let updatedBarilguud: any[] = [...(freshOrg.barilguud || [])];
      updatedBarilguud = updatedBarilguud.map((b: any) => {
        if (String(b._id) !== String(editedBuildingId)) return b;
        const tokhirgoo = {
          ...(b.tokhirgoo || {}),
          orts: String(ortsNum),
          davkhar: Array.from({ length: count }, (_, i) => String(i + 1)),
          ...(selectedDuureg && {
            duuregNer: selectedDuureg,
            districtCode: selectedDuureg + (selectedHoroo || ""),
          }),
          ...(selectedHoroo && {
            horoo: {
              ner: selectedHoroo,
              kod: selectedHoroo,
            },
          }),
        } as any;
        return { ...b, ner: name, tokhirgoo };
      });

      const payload = {
        ...freshOrg,
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
    setEditSelectedDuureg("");
    setEditSelectedHoroo("");
    setIsEditBuildingModalOpen(true);
  };

  // Pre-fill edit modal when opening
  useEffect(() => {
    if (!isEditBuildingModalOpen || !editedBuildingId) return;
    if (hasUserEdited) return; // Don't reset if user has started editing
    const building = baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(editedBuildingId),
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
      
      // Load district and horoo if they exist
      const duuregNer = tok.duuregNer || "";
      const horooNer = tok.horoo?.ner || "";
      setEditSelectedDuureg(duuregNer);
      setEditSelectedHoroo(horooNer);
    }
  }, [isEditBuildingModalOpen, editedBuildingId, baiguullaga, hasUserEdited]);

  const handleDeleteBuilding = async (id: string) => {
    // open confirm modal instead of immediate delete
    if (!token) return openErrorOverlay("Нэвтрэх шаардлагатай");
    if (!baiguullaga?._id) return openErrorOverlay("Байгууллага олдсонгүй");
    const building = baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(id),
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
      const freshOrg = await fetchFreshOrg();
      if (!freshOrg) {
        openErrorOverlay("Байгууллагын мэдээлэл шинэчлэхэд алдаа гарлаа");
        return;
      }

      const updatedBarilguud = (freshOrg.barilguud || []).filter(
        (b: any) => String(b._id) !== String(id),
      );
      const payload = {
        ...freshOrg,
        barilguud: updatedBarilguud,
      };

      const res = await updateMethod("baiguullaga", token, payload);
      if (res?.data) await baiguullagaMutate(res.data, false);
      await baiguullagaMutate();

      openSuccessOverlay("Барилга устгагдлаа");

      // If deleted building was selected, pick first available or clear
      if (String(selectedBuildingId) === String(id)) {
        const first = (updatedBarilguud || []).find(
          (b: any) =>
            !b?.baiguullagiinId ||
            String(b.baiguullagiinId) === String(baiguullaga._id),
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
  const handleSaveSettings = async (selectedDuureg?: string, selectedHoroo?: string) => {
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
      const freshOrg = await fetchFreshOrg();
      if (!freshOrg) {
        openErrorOverlay("Байгууллагын мэдээлэл шинэчлэхэд алдаа гарлаа");
        setIsSaving(false);
        return;
      }

      const newBuilding: any = {
        // backend will assign _id; keep minimal required fields
        ner: name,
        baiguullagiinId: String(baiguullaga._id),
        tokhirgoo: {
          orts: String(ortsNum),
          davkhar: Array.from({ length: davCount }, (_, i) => String(i + 1)),
          ...(selectedDuureg && {
            duuregNer: selectedDuureg,
            districtCode: selectedDuureg + (selectedHoroo || ""),
          }),
          ...(selectedHoroo && {
            horoo: {
              ner: selectedHoroo,
              kod: selectedHoroo,
            },
          }),
        },
      };

      // Preserve existing buildings from freshOrg and add the new building
      const existingBuildings = (freshOrg.barilguud || []).map(
        (b: any) => ({
          ...b,
          _id: b._id,
        }),
      );
      const updatedBarilguud = [...existingBuildings, newBuilding];

      const payload = {
        ...freshOrg,
        barilguud: updatedBarilguud,
      };

      // Use POST to add new building
      const res = await createMethod(
        `baiguullaga/${baiguullaga._id}`,
        token,
        payload,
      );

      // Response has data nested under 'result' property
      const serverData = res?.data?.result || res?.data;
      if (serverData) {
        await baiguullagaMutate(serverData, false);
      
        try {
          // Find the newly created building by name (baiguullagiinId may not be stored in building object)
          const existingIds = new Set(existingBuildings.map((b: any) => String(b._id)));
          const created = (serverData.barilguud || []).find(
            (b: any) =>
              b.ner === name && !existingIds.has(String(b._id)),
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
      openErrorOverlay("Имэйл хаяг зөв байх ёстой (@ агуулагдана)");
      return;
    }

    setIsSaving(true);

    try {
      const freshOrg = await fetchFreshOrg();
      if (!freshOrg) {
        openErrorOverlay("Байгууллагын мэдээлэл шинэчлэхэд алдаа гарлаа");
        setIsSaving(false);
        return;
      }
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
      const newBarilguud = (freshOrg.barilguud || []).map((b: any) => {
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

      // Build updated org-level tokhirgoo to include contact fields and location
      // so the backend will save them against the current organization
      const orgTokhirgoo = {
        ...(baiguullaga?.tokhirgoo || {}),
        duuregNer: state.selectedDuuregData.ner,
        districtCode: districtCodeCombined,
        horoo: {
          ner: state.selectedHorooData.ner,
          kod: state.selectedHorooData.kod,
        },
        sohNer: finalSohNer,
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
        ...freshOrg,
        eBarimtAutomataarIlgeekh:
          typeof freshOrg?.eBarimtAutomataarIlgeekh === "boolean"
            ? freshOrg.eBarimtAutomataarIlgeekh
            : false,
        nuatTulukhEsekh:
          typeof freshOrg?.nuatTulukhEsekh === "boolean"
            ? freshOrg.nuatTulukhEsekh
            : false,
        eBarimtAshiglakhEsekh: freshOrg?.eBarimtAshiglakhEsekh ?? true,
        eBarimtShine: freshOrg?.eBarimtShine ?? false,
        // write updated org-level tokhirgoo (including utas/mail)
        tokhirgoo: orgTokhirgoo,
        // also keep top-level utas/mail in sync
        utas: orgTokhirgoo.utas || [],
        mail: orgTokhirgoo.mail || [],
        duureg: state.selectedDuuregData.ner,
        horoo: {
          ner: state.selectedHorooData.ner,
          kod: state.selectedHorooData.kod,
        },
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
              serverTok?.sohNer || server.ner || prev.sohNer || "",
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
    (d) => d._id === state.selectedDuureg,
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

  // Register tour steps for BarilgiinTokhirgoo
  const barilgaTourSteps: DriverStep[] = useMemo(() => {
    return [
      {
        element: "#barilgiin-panel",
        popover: {
          title: "Барилгын тохиргоо",
          description:
            "Эндээс СӨХ / барилгын үндсэн тохиргоонууд (СӨХ нэр, хаяг, холбоо) болон барилгуудыг удирдна.",
          side: "bottom",
        },
      },
      {
        element: "#barilgiin-soh-name",
        popover: {
          title: "СӨХ-ийн нэр",
          description: "СӨХ (удирдлагын нэр) өөрчлөх боломжтой талбар.",
          side: "right",
        },
      },

      {
        element: "#barilgiin-phone",
        popover: {
          title: "Утас",
          description: "СӨХ-ийн холбоо барих утасны дугаар.",
          side: "left",
        },
      },
      {
        element: "#barilgiin-email",
        popover: {
          title: "Email",
          description: "СӨХ-ийн холбогдох и-мэйл хаяг.",
          side: "left",
        },
      },
      {
        element: "#barilgiin-duureg",
        popover: {
          title: "Дүүрэг",
          description: "Барилгын дүүрэг/хаягийг эндээс сонгон тохируулна.",
          side: "right",
        },
      },
      {
        element: "#barilgiin-horoo",
        popover: {
          title: "Хороо",
          description: "Дүүрэг сонгосны дараа хороо(г) сонгоно.",
          side: "right",
        },
      },
      {
        element: "#barilgiin-buildings-list",
        popover: {
          title: "Бүртгэлтэй барилгууд",
          description:
            "Эндээс байгууллагад хамаарах барилгуудын жагсаалтыг харах, засах, устгах боломжтой.",
          side: "top",
        },
      },
      {
        element: "#barilgiin-new-building-btn",
        popover: {
          title: "Шинэ барилга нэмэх",
          description:
            "Шинэ барилга нэмэх товч. Барилга нэмэхдээ орц/давхарын тоог оруулна.",
          side: "left",
        },
      },
    ];
  }, []);

  useRegisterTourSteps("/tokhirgoo/BarilgiinTokhirgoo", barilgaTourSteps);
  // Also register under the parent pathname so the tour is available
  // when the browser URL is `/tokhirgoo` (parent page renders this child).
  useRegisterTourSteps("/tokhirgoo", barilgaTourSteps);

  // Removed save handler since орц/давхар settings are no longer editable from here

  if (!isInit) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  return (
    <div
      id="barilgiin-panel"
      className="xxl:col-span-9 col-span-12 lg:col-span-12 h-[700px]"
    >
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg allow-overflow p-6 space-y-6 h-full overflow-auto custom-scrollbar">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[color:var(--surface-border)] rounded-t-lg">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-[color:var(--panel-text)]">
              Барилгын тохиргоо
            </h2>
          </div>

          {/* SÖH Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[color:var(--panel-text)]">
              СӨХ-ийн нэр
            </label>
            <input
              id="barilgiin-soh-name"
              type="text"
              value={sohNer}
              onChange={(e) => setSohNer(e.target.value)}
              placeholder="СӨХ-ийн нэрийг оруулна уу"
              className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] !rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderRadius: '0.5rem' }}
              disabled
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)]">
              <Users className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-[color:var(--panel-text)]">
                Холбоо барих мэдээлэл
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="barilgiin-phone" className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
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
                  className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] !rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                  style={{ borderRadius: '0.5rem' }}
                />
              </div>
              <div id="barilgiin-email" className="space-y-2">
                <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                  Имэйл
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Имэйл хаяг оруулна уу"
                  className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] !rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                  style={{ borderRadius: '0.5rem' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[color:var(--panel-text)]">
                Хаяг
              </label>
              <input
                type="text"
                value={baiguullaga?.khayag || ""}
                placeholder="Хаяг"
                className="w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] !rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ borderRadius: '0.5rem' }}
                disabled
                readOnly
              />
            </div>
          </div>

          {/* Save Button */}
          {isDirty && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={khadgalakh}
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
                disabled={isSaving}
                className="!rounded-lg"
                style={{ borderRadius: '0.5rem' }}
              >
                Хадгалах
              </Button>
            </div>
          )}
        </div>

        {/* Buildings List Section */}
        {orgBuildings && orgBuildings.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[color:var(--surface-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-500" />
                <h3 className="text-lg font-semibold text-[color:var(--panel-text)]">
                  Бүртгэлтэй барилгууд (Байр)
                </h3>
              </div>
              <Button
                id="barilgiin-new-building-btn"
                onClick={openNewBuildingModal}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                title="Шинэ барилга нэмэх"
                className="!rounded-lg"
                style={{ borderRadius: '0.5rem' }}
              >
                Нэмэх
              </Button>
            </div>
            <div
              id="barilgiin-buildings-list"
              className="space-y-0 max-h-64 overflow-y-auto rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
            >
              {orgBuildings.map((b: any, index: number) => {
                const isFirst = index === 0;
                const isLast = index === orgBuildings.length - 1;
                return (
                  <div
                    key={b._id}
                    className={`p-3 flex items-center justify-between hover:bg-[color:var(--surface-hover)] transition-colors border-b border-[color:var(--surface-border)] relative ${
                      isFirst ? "rounded-t-lg" : ""
                    } ${isLast ? "rounded-b-lg border-b-0" : ""}`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div
                      id={`barilgiin-select-${b._id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBuildingId(String(b._id));
                      }}
                      className="flex-1 cursor-pointer text-[color:var(--panel-text)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium pointer-events-auto"
                    >
                      {b.ner || "-"}
                    </div>
                    <div className="flex items-center gap-2 pointer-events-auto">
                      <Button
                        id={`barilgiin-edit-${b._id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBuilding(String(b._id));
                        }}
                        variant="ghost"
                        size="sm"
                        title="Засах"
                        className="!rounded-lg"
                        style={{ borderRadius: '0.5rem' }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        id={`barilgiin-delete-${b._id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBuilding(String(b._id));
                        }}
                        variant="ghost"
                        size="sm"
                        title="Устгах"
                        className="!rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400"
                        style={{ borderRadius: '0.5rem' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Building Message */}
        {!barilga && (
          <div className="p-4 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2">
              <Building2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Барилга олдсонгүй</p>
                <p className="text-xs mt-1 opacity-80">
                  Зөвхөн мэдээллийг харах боломжтой. Барилга сонгох эсвэл шинээр нэмнэ үү.
                </p>
              </div>
            </div>
            <Button
              onClick={openNewBuildingModal}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              title="Шинэ барилга нэмэх"
              className="!rounded-lg"
              style={{ borderRadius: '0.5rem' }}
            >
              Шинэ барилга
            </Button>
          </div>
        )}

        {/* Info grid */}

        {/* removed bottom save duplicate - primary save now under Дүүрэг/Хороо */}
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
          districts={districts}
          subDistricts={subDistricts}
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
          districts={districts}
          subDistricts={subDistricts}
          editSelectedDuureg={editSelectedDuureg}
          setEditSelectedDuureg={setEditSelectedDuureg}
          editSelectedHoroo={editSelectedHoroo}
          setEditSelectedHoroo={setEditSelectedHoroo}
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
