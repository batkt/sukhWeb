"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { X, UserCheck, Building2, ArrowLeft, Search, Plus } from "lucide-react";
import { ModalPortal } from "../../../../components/golContent";
import { useRouter } from "next/navigation";
import useModalHotkeys from "@/lib/useModalHotkeys";

interface QuickRegisterModalProps {
  show: boolean;
  onClose: () => void;
  unit: string | null;
  floor: string | null;
  orts: string;
  propertyTab: "Тоот" | "Зогсоол" | "Агуулах";
  residentsList: any[];
  clientsList: any[];
  onAssign: (personId: string, personType: "orshinSuugch" | "khariltsagch") => Promise<boolean>;
  onRegisterNewOrshinSuugch?: () => void;
  onRegisterNewKhariltsagch?: () => void;
}

export default function QuickRegisterModal({
  show,
  onClose,
  unit,
  floor,
  orts,
  propertyTab,
  residentsList,
  clientsList,
  onAssign,
  onRegisterNewOrshinSuugch,
  onRegisterNewKhariltsagch,
}: QuickRegisterModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<"orshinSuugch" | "khariltsagch" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Reset modal state on show/hide
  useEffect(() => {
    if (show) {
      setStep(1);
      setSelectedType(null);
      setSearchQuery("");
      setIsSubmitting(false);
    }
  }, [show]);

  // Focus search input when going to step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const unitTypeLabel =
    propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Тоот";

  const listToSearch = useMemo(() => {
    if (!selectedType) return [];
    return selectedType === "orshinSuugch" ? residentsList : clientsList;
  }, [selectedType, residentsList, clientsList]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) {
      // Return first 15 entries by default when search is empty
      return listToSearch.slice(0, 15);
    }
    const term = searchQuery.toLowerCase().trim();
    return listToSearch.filter((item: any) => {
      const ner = String(item.ner || "").toLowerCase();
      const ovog = String(item.ovog || "").toLowerCase();
      const register = String(item.register || "").toLowerCase();
      const utasVal = Array.isArray(item.utas)
        ? item.utas.map((u: any) => String(u)).join(" ")
        : String(item.utas || "");
      const utas = utasVal.toLowerCase();
      return (
        ner.includes(term) ||
        ovog.includes(term) ||
        register.includes(term) ||
        utas.includes(term)
      );
    });
  }, [listToSearch, searchQuery]);

  const handleSelectType = (type: "orshinSuugch" | "khariltsagch") => {
    setSelectedType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedType(null);
    setSearchQuery("");
  };

  const handleAssignPerson = async (personId: string) => {
    if (!selectedType || isSubmitting) return;
    setIsSubmitting(true);
    const success = await onAssign(personId, selectedType);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  // ESC closes, Enter submits if there's exactly one result in the list
  useModalHotkeys({
    isOpen: show,
    onClose,
    onSubmit:
      step === 2 && filteredList.length === 1
        ? () => handleAssignPerson(filteredList[0]._id)
        : undefined,
  });

  if (!show) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[12000] flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-transparent"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                title="Буцах"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                {unitTypeLabel} холбох
              </p>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold">
                  {floor}
                </span>
                <span className="text-slate-400 font-light">/</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold">
                  {unit}
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="px-6 py-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-5 text-center">
              Бүртгэлтэй хэрэглэгч сонгох
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Resident option */}
              <button
                onClick={() => handleSelectType("orshinSuugch")}
                className="group flex flex-col items-center gap-3.5 p-5 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 text-center leading-tight">
                  Оршин суугч
                </span>
              </button>

              {/* Client option */}
              <button
                onClick={() => handleSelectType("khariltsagch")}
                className="group flex flex-col items-center gap-3.5 p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 text-center leading-tight">
                  Харилцагч
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Search and Select */}
        {step === 2 && (
          <div className="flex flex-col h-[400px]">
            {/* Search Input */}
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`${selectedType === "orshinSuugch" ? "Оршин суугч" : "Харилцагч"} хайх...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Quick Register/Create New Button */}
            <div className="px-6 pb-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedType === "orshinSuugch") {
                    router.push(`/geree/orshinSuugch?new=true&orts=${orts || ""}&davkhar=${floor || ""}&toot=${unit || ""}&turul=${unitTypeLabel}`);
                  } else {
                    router.push(`/geree/khariltsagch?new=true&orts=${orts || ""}&davkhar=${floor || ""}&toot=${unit || ""}&turul=${unitTypeLabel}`);
                  }
                  onClose();
                }}
                className="w-full py-2 px-4 rounded-xl border border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Шинэ {selectedType === "orshinSuugch" ? "оршин суугч" : "харилцагч"} бүртгэх
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2 no-scrollbar">
              {filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  <span>Хайлт илэрцгүй</span>
                </div>
              ) : (
                filteredList.map((person: any) => {
                  const fullName = [person.ovog, person.ner].filter(Boolean).join(" ") || person.ner || "Нэргүй";
                  const utasStr = Array.isArray(person.utas)
                    ? person.utas.filter(Boolean).join(", ")
                    : person.utas || "-";
                  const tootsCount = Array.isArray(person.toots) ? person.toots.length : 0;

                  return (
                    <button
                      key={person._id}
                      disabled={isSubmitting}
                      onClick={() => handleAssignPerson(person._id)}
                      className="w-full text-left p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between group disabled:opacity-50"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {fullName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                          <span className="shrink-0">{utasStr}</span>
                          {person.register && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                              <span className="shrink-0 uppercase font-mono">{person.register}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right indicator: number of connected toots */}
                      {tootsCount > 0 && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                          {tootsCount} тоот
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </ModalPortal>
  );
}
