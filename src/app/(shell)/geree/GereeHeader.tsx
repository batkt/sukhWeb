"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useGereeContext } from "./GereeContext";
import {
  Download,
  FileDown,
  FileUp,
  LayoutTemplate,
  UserPlus,
  Settings2,
  ChevronDown,
  Zap,
} from "lucide-react";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { hasPermission } from "@/lib/permissionUtils";
import { ALL_COLUMNS } from "./columns";
import Link from "next/link";

interface GereeHeaderProps {
  activeTab: "contracts" | "residents" | "employees" | "units" | "clients";
  setActiveTab: (
    tab: "contracts" | "residents" | "employees" | "units" | "clients",
  ) => void;
  onShowMassKwtModal?: () => void;
  ortsOptions: string[];
  selectedOrts: string;
  setSelectedOrts: (val: string) => void;
  davkharOptions: string[];
  selectedDawkhar: string;
  setSelectedDawkhar: (val: string) => void;
  selectedOrtsForContracts: string;
  setSelectedOrtsForContracts: (val: string) => void;
  statusFilter: "all" | "active" | "cancelled";
  setStatusFilter: (val: "all" | "active" | "cancelled") => void;
  unitStatusFilter: "all" | "occupied" | "free";
  setUnitStatusFilter: (val: "all" | "occupied" | "free") => void;
  ajiltan: any;
  selectedContracts: string[];
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean | ((prev: boolean) => boolean)) => void;
  visibleColumns: string[];
  setVisibleColumns: (cols: string[] | ((prev: string[]) => string[])) => void;
  columnMenuRef: React.RefObject<HTMLDivElement | null>;
  DEFAULT_HIDDEN: string[];
  onShowAvlagaModal: () => void;
  onShowList2Modal: () => void;
  onSendInvoices: () => void;
  onShowResidentModal: () => void;
  onShowClientModal: () => void;
  onExportResidentsExcel: () => void;
  onDownloadResidentsTemplate: () => void;
  onResidentsExcelImportClick: () => void;
  isUploadingResidents: boolean;
  residentExcelInputRef: React.RefObject<HTMLInputElement | null>;
  onResidentsExcelFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowEmployeeModal: () => void;
  onDownloadUnitsTemplate: () => void;
  onUnitsExcelImportClick: () => void;
  isUploadingUnits: boolean;
  unitExcelInputRef: React.RefObject<HTMLInputElement | null>;
  onUnitsExcelFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function GereeHeader({
  activeTab,
  setActiveTab,
  ortsOptions,
  selectedOrts,
  setSelectedOrts,
  davkharOptions: originalDavkharOptions,
  selectedDawkhar,
  setSelectedDawkhar,
  selectedOrtsForContracts,
  setSelectedOrtsForContracts,
  statusFilter,
  setStatusFilter,
  unitStatusFilter,
  setUnitStatusFilter,
  ajiltan,
  showColumnSelector,
  setShowColumnSelector,
  visibleColumns,
  setVisibleColumns,
  columnMenuRef,
  onShowAvlagaModal,
  onShowList2Modal,
  onSendInvoices,
  onShowResidentModal,
  onShowMassKwtModal,
  onShowClientModal,
  onExportResidentsExcel,
  onDownloadResidentsTemplate,
  onResidentsExcelImportClick,
  isUploadingResidents,
  residentExcelInputRef,
  onResidentsExcelFileChange,
  onShowEmployeeModal,
  onDownloadUnitsTemplate,
  onUnitsExcelImportClick,
  isUploadingUnits,
  unitExcelInputRef,
  onUnitsExcelFileChange,
}: GereeHeaderProps) {
  const [isDesktopExcelOpen, setIsDesktopExcelOpen] = useState(false);
  const [isMobileExcelOpen, setIsMobileExcelOpen] = useState(false);
  const desktopExcelRef = useRef<HTMLDivElement>(null);
  const mobileExcelRef = useRef<HTMLDivElement>(null);

  const context = useGereeContext();
  const activePropertyTab = context?.state?.propertyTab || "Тоот";

  const davkharOptions = React.useMemo(() => {
    if (activeTab === "units" && activePropertyTab === "Тоот") {
      return originalDavkharOptions.filter((d) => !String(d).trim().toLowerCase().startsWith("b"));
    }
    return originalDavkharOptions;
  }, [originalDavkharOptions, activeTab, activePropertyTab]);

  // Debugging
  useEffect(() => {
    if (ajiltan) {
      console.log("👤 GereeHeader received ajiltan:", ajiltan);
    }
  }, [ajiltan]);

  const hasGereeBase =
    hasPermission(ajiltan, "/geree") || hasPermission(ajiltan, "geree");
  const showContracts = hasGereeBase;
  const showResidents =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/orshinSuugch") ||
    hasPermission(ajiltan, "geree.orshinSuugch");
  const showUnits =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/tootBurtgel") ||
    hasPermission(ajiltan, "geree.tootBurtgel");
  const showEmployees =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/ajiltan") ||
    hasPermission(ajiltan, "geree.ajiltan");
  const showClients =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/khariltsagch") ||
    hasPermission(ajiltan, "geree.khariltsagch");

  useEffect(() => {
    const handleClickOutsideDesktop = (event: MouseEvent) => {
      if (
        desktopExcelRef.current &&
        !desktopExcelRef.current.contains(event.target as Node)
      ) {
        setIsDesktopExcelOpen(false);
      }
    };

    if (isDesktopExcelOpen) {
      document.addEventListener("mousedown", handleClickOutsideDesktop);
      return () => {
        document.removeEventListener("mousedown", handleClickOutsideDesktop);
      };
    }
  }, [isDesktopExcelOpen]);

  useEffect(() => {
    const handleClickOutsideMobile = (event: MouseEvent) => {
      if (
        mobileExcelRef.current &&
        !mobileExcelRef.current.contains(event.target as Node)
      ) {
        setIsMobileExcelOpen(false);
      }
    };

    if (isMobileExcelOpen) {
      document.addEventListener("mousedown", handleClickOutsideMobile);
      return () => {
        document.removeEventListener("mousedown", handleClickOutsideMobile);
      };
    }
  }, [isMobileExcelOpen]);


  return (
    <div className="w-full">
      <div className="flex items-start justify-between px-4 pt-3 pb-1 gap-4 mb-1 w-full">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between gap-3">
            {/* Шүүлтүүрүүд — гарчиг авагдсан тул үйлдлийн товчтой нэг мөрөнд */}
            {(activeTab === "contracts" || activeTab === "units") && (
              <div className="hidden md:flex items-center gap-6 flex-wrap min-w-0">
                  {activeTab === "contracts" && (
                    <>
                      {ortsOptions.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-28">
                            <TusgaiZagvar
                              value={selectedOrtsForContracts}
                              onChange={(val) => setSelectedOrtsForContracts(val)}
                              options={[
                                { value: "", label: "Орц" },
                                ...ortsOptions.map((o) => ({
                                  value: o,
                                  label: o,
                                })),
                              ]}
                              className="w-full z-50 text-sm"
                              placeholder="Сонгох..."
                              buttonClassName="!h-10 !py-0 px-3 !text-xs"
                            />
                          </div>
                        </div>
                      )}
                      {davkharOptions.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-28">
                            <TusgaiZagvar
                              value={selectedDawkhar}
                              onChange={(val) => setSelectedDawkhar(val)}
                              options={[
                                { value: "", label: "Давхар" },
                                ...davkharOptions.map((d) => ({
                                  value: d,
                                  label: d,
                                })),
                              ]}
                              className="w-full z-50 text-sm"
                              placeholder="Сонгох..."
                              buttonClassName="!h-10 !py-0 px-3 !text-xs"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="w-32">
                          <TusgaiZagvar
                            value={statusFilter}
                            onChange={(val) =>
                              setStatusFilter(
                                val as "all" | "active" | "cancelled",
                              )
                            }
                            options={[
                              { value: "all", label: "Төлөв" },
                              { value: "active", label: "Идэвхтэй" },
                              { value: "cancelled", label: "Цуцлагдсан" },
                            ]}
                            className="w-full z-50 text-sm"
                            placeholder="Сонгох..."
                            buttonClassName="!h-10 !py-0 px-3 !text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "units" && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-28">
                          <TusgaiZagvar
                            value={selectedOrts}
                            onChange={(val) => setSelectedOrts(val)}
                            options={[
                              { value: "", label: "Орц" },
                              ...ortsOptions.map((o) => ({
                                value: o,
                                label: o,
                              })),
                            ]}
                            className="w-full z-50 text-sm rounded-2xl"
                            placeholder="Сонгох..."
                            buttonClassName="!h-10 !py-0 px-3 !text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-28">
                          <TusgaiZagvar
                            value={selectedDawkhar}
                            onChange={(val) => setSelectedDawkhar(val)}
                            options={[
                              { value: "", label: "Давхар" },
                              ...davkharOptions.map((d) => ({
                                value: String(d),
                                label: String(d),
                              })),
                            ]}
                            className="w-full z-50 text-sm rounded-2xl"
                            placeholder="Сонгох..."
                            buttonClassName="!h-10 !py-0 px-3 !text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-32">
                          <TusgaiZagvar
                            value={unitStatusFilter}
                            onChange={(val) =>
                              setUnitStatusFilter(
                                (val as "all" | "occupied" | "free") || "all",
                              )
                            }
                            options={[
                              { value: "all", label: "Төлөв" },
                              { value: "occupied", label: "Идэвхтэй" },
                              { value: "free", label: "Идэвхгүй" },
                            ]}
                            className="w-full z-50 text-sm rounded-2xl"
                            placeholder="Төлөв..."
                            buttonClassName="!h-10 !py-0 px-3 !text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            {/* Desktop: top-right actions per tab */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {activeTab === "contracts" && (
                <>
                  <button
                    id="geree-templates-btn"
                    onClick={onShowList2Modal}
                    className="btn-minimal h-10"
                    aria-label="Гэрээний загварууд"
                    title="Гэрээний загварууд"
                  >
                    <LayoutTemplate className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs ml-1">
                      Загвар үүсгэх
                    </span>
                  </button>
                  <div className="relative flex-shrink-0" ref={columnMenuRef}>
                    <button
                      id="geree-columns-btn"
                      onClick={() => setShowColumnSelector((s) => !s)}
                      className="btn-minimal h-10 flex items-center gap-2"
                      aria-label="Багана сонгох"
                      title="Багана сонгох"
                    >
                      <Settings2 className="w-5 h-5" />
                      <span className="hidden sm:inline text-xs ml-1">
                        Багана
                      </span>
                    </button>
                    {showColumnSelector && (
                      <div className="absolute right-0 top-full mt-2 z-[100] min-w-[200px] menu-surface rounded-xl shadow-lg overflow-hidden p-2">
                        <div className="text-xs font-medium text-theme px-2 py-1 border-b border-white/10 mb-1">
                          Баганууд
                        </div>
                        {visibleColumns &&
                          ALL_COLUMNS.map((col) => {
                            const isVisible = visibleColumns.includes(col.key);
                            return (
                              <label
                                key={col.key}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={() => {
                                    if (isVisible) {
                                      setVisibleColumns((prev) =>
                                        prev.filter((k) => k !== col.key),
                                      );
                                    } else {
                                      setVisibleColumns((prev) => [
                                        ...prev,
                                        col.key,
                                      ]);
                                    }
                                  }}
                                  className="w-4 h-4 rounded border border-theme/30 accent-theme"
                                />
                                <span className="text-sm">{col.label}</span>
                              </label>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "residents" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onShowResidentModal}
                    className="btn-minimal h-10"
                    id="resident-new-btn-top"
                    aria-label="Оршин суугч"
                    title="Оршин суугч"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs ml-1">
                      Оршин суугч
                    </span>
                  </button>
                  {onShowMassKwtModal && (
                    <button
                      onClick={onShowMassKwtModal}
                      className="btn-minimal h-10 inline-flex items-center gap-2 text-amber-500 hover:text-amber-600"
                      id="resident-mass-kwt-btn-top"
                      aria-label="кВт заалт"
                      title="кВт заалт олноор шинэчлэх"
                    >
                      <Zap className="w-5 h-5" />
                      <span className="hidden sm:inline text-xs">кВт заалт</span>
                    </button>
                  )}
                  <div ref={desktopExcelRef} className="relative">
                    <button
                      onClick={() => setIsDesktopExcelOpen(!isDesktopExcelOpen)}
                      className="btn-minimal h-10 inline-flex items-center gap-2"
                      id="resident-excel-btn-top"
                      aria-label="Excel"
                      title="Excel үйлдлүүд"
                    >
                      <Download className="w-5 h-5" />
                      <span className="hidden sm:inline text-xs">Excel</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isDesktopExcelOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isDesktopExcelOpen && (
                      <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                        <button
                          onClick={() => {
                            onResidentsExcelImportClick();
                            setIsDesktopExcelOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                          id="resident-upload-template-btn-top"
                          disabled={isUploadingResidents}
                        >
                          <FileUp className="w-4 h-4" />
                          <span>Загвар оруулах</span>
                        </button>
                        <button
                          onClick={() => {
                            onDownloadResidentsTemplate();
                            setIsDesktopExcelOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                          id="resident-download-template-btn-top"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Загвар татах</span>
                        </button>
                        <button
                          onClick={() => {
                            onExportResidentsExcel();
                            setIsDesktopExcelOpen(false);
                          }}
                          className="w-full px-4 border-t py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                          id="resident-download-list-btn-top"
                        >
                          <Download className="w-4 h-4" />
                          <span>Жагсаалт татах</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "employees" && (
                <button
                  onClick={onShowEmployeeModal}
                  className="btn-minimal h-10"
                  aria-label="Ажилтан нэмэх"
                  title="Ажилтан нэмэх"
                  id="employees-new-btn-top"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs ml-1">
                    Ажилтан нэмэх
                  </span>
                </button>
              )}

              {activeTab === "units" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onDownloadUnitsTemplate}
                    className="btn-minimal h-10"
                    id="units-download-template-btn-top"
                    aria-label="Загвар татах"
                    title="Тоот бүртгэлийн Excel загвар татах"
                  >
                    <FileDown className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs ml-1">
                      Загвар татах
                    </span>
                  </button>
                  <button
                    onClick={onUnitsExcelImportClick}
                    className="btn-minimal h-10"
                    id="units-upload-template-btn-top"
                    disabled={isUploadingUnits}
                    aria-label="Excel-ээс импортлох"
                    title="Excel-ээс тоот бүртгэлийг импортлох"
                  >
                    <FileUp className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs ml-1">
                      Загвар оруулах
                    </span>
                  </button>
                </div>
              )}

              {activeTab === "clients" && (
                <button
                  onClick={onShowClientModal}
                  className="btn-minimal h-10"
                  aria-label="Харилцагч нэмэх"
                  title="Харилцагч нэмэх"
                  id="clients-new-btn-top"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs ml-1">
                    Харилцагч нэмэх
                  </span>
                </button>
              )}
            </div>
          </div>

          </div>
        </div>

        {/* Mobile: filters in grid layout */}
        {(activeTab === "contracts" || activeTab === "units") && (
          <div className="mt-3 md:hidden grid grid-cols-2 gap-2">
            {activeTab === "contracts" && (
              <>
                {ortsOptions.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <TusgaiZagvar
                      value={selectedOrtsForContracts}
                      onChange={(val) => setSelectedOrtsForContracts(val)}
                      options={[
                        { value: "", label: "Орц" },
                        ...ortsOptions.map((o) => ({ value: o, label: o })),
                      ]}
                      className="w-full z-50 text-xs"
                      placeholder="Сонгох..."
                      buttonClassName="!h-10 !py-0 px-3 !text-xs"
                    />
                  </div>
                )}
                {davkharOptions.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <TusgaiZagvar
                      value={selectedDawkhar}
                      onChange={(val) => setSelectedDawkhar(val)}
                      options={[
                        { value: "", label: "Давхар" },
                        ...davkharOptions.map((d) => ({ value: d, label: d })),
                      ]}
                      className="w-full z-50 text-xs"
                      placeholder="Сонгох..."
                      buttonClassName="!h-10 !py-0 px-3 !text-xs"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1 col-span-2">
                  <TusgaiZagvar
                    value={statusFilter}
                    onChange={(val) =>
                      setStatusFilter(val as "all" | "active" | "cancelled")
                    }
                    options={[
                      { value: "all", label: "Төлөв" },
                      { value: "active", label: "Идэвхтэй" },
                      { value: "cancelled", label: "Цуцлагдсан" },
                    ]}
                    className="w-full z-50 text-xs"
                    placeholder="Сонгох..."
                    buttonClassName="!h-10 !py-0 px-3 !text-xs"
                  />
                </div>
              </>
            )}

            {activeTab === "units" && (
              <>
                <div className="flex flex-col gap-1">
                  <TusgaiZagvar
                    value={selectedOrts}
                    onChange={(val) => setSelectedOrts(val)}
                    options={[
                      { value: "", label: "Орц" },
                      ...ortsOptions.map((o) => ({
                        value: o,
                        label: o,
                      })),
                    ]}
                    className="w-full z-50 text-xs"
                    placeholder="Сонгох..."
                    buttonClassName="!h-10 !py-0 px-3 !text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <TusgaiZagvar
                    value={selectedDawkhar}
                    onChange={(val) => setSelectedDawkhar(val)}
                    options={[
                      { value: "", label: "Давхар" },
                      ...davkharOptions.map((o) => ({
                        value: String(o),
                        label: String(o),
                      })),
                    ]}
                    className="w-full z-50 text-xs"
                    placeholder="Сонгох..."
                    buttonClassName="!h-10 !py-0 px-3 !text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <TusgaiZagvar
                    value={unitStatusFilter}
                    onChange={(val) =>
                      setUnitStatusFilter(
                        (val as "all" | "occupied" | "free") || "all",
                      )
                    }
                    options={[
                      { value: "all", label: "Төлөв" },
                      { value: "occupied", label: "Идэвхтэй" },
                      { value: "free", label: "Идэвхгүй" },
                    ]}
                    className="w-full z-50 text-xs"
                    placeholder="Төлөв..."
                    buttonClassName="!h-10 !py-0 px-3 !text-xs"
                  />
                </div>
              </>
            )}
          </div>
        )}

      {/* Mobile / small screens: keep actions below as before */}
      <div className="flex gap-2 flex-wrap px-4 md:hidden">
        {activeTab === "residents" && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowResidentModal}
                className="btn-minimal h-10"
                id="resident-new-btn"
                aria-label="Оршин суугч"
                title="Оршин суугч"
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Оршин суугч
                </span>
              </button>
              <div ref={mobileExcelRef} className="relative">
                <button
                  onClick={() => setIsMobileExcelOpen(!isMobileExcelOpen)}
                  className="btn-minimal h-10 inline-flex items-center gap-2"
                  id="resident-excel-btn"
                  aria-label="Excel"
                  title="Excel үйлдлүүд"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs">Excel</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isMobileExcelOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isMobileExcelOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        onExportResidentsExcel();
                        setIsMobileExcelOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                      id="resident-download-list-btn"
                    >
                      <Download className="w-4 h-4" />
                      <span>Жагсаалт татах</span>
                    </button>
                    <button
                      onClick={() => {
                        onDownloadResidentsTemplate();
                        setIsMobileExcelOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                      id="resident-download-template-btn"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Загвар татах</span>
                    </button>
                    <button
                      onClick={() => {
                        onResidentsExcelImportClick();
                        setIsMobileExcelOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                      id="resident-upload-template-btn"
                      disabled={isUploadingResidents}
                    >
                      <FileUp className="w-4 h-4" />
                      <span>Загвар оруулах</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {activeTab === "employees" && (
          <button
            onClick={onShowEmployeeModal}
            className="btn-minimal h-10"
            aria-label="Ажилтан нэмэх"
            title="Ажилтан нэмэх"
            id="employees-new-btn"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline text-xs ml-1">Ажилтан нэмэх</span>
          </button>
        )}
        {activeTab === "units" && (
          <>
            <button
              onClick={onDownloadUnitsTemplate}
              className="btn-minimal h-10"
              id="mobile-units-download-template-btn"
              aria-label="Загвар татах"
              title="Тоот бүртгэлийн Excel загвар татах"
            >
              <FileDown className="w-5 h-5" />
              <span className="hidden sm:inline text-xs ml-1">
                Загвар татах
              </span>
            </button>
            <button
              onClick={onUnitsExcelImportClick}
              className="btn-minimal h-10"
              id="mobile-units-upload-template-btn"
              disabled={isUploadingUnits}
              aria-label="Excel-ээс импортлох"
              title="Excel-ээс тоот бүртгэлийг импортлох"
            >
              <FileUp className="w-5 h-5" />
              <span className="hidden sm:inline text-xs ml-1">
                Загвар оруулах
              </span>
            </button>
          </>
        )}
        {activeTab === "clients" && (
          <button
            onClick={onShowClientModal}
            className="btn-minimal h-10"
            aria-label="Харилцагч нэмэх"
            title="Харилцагч нэмэх"
            id="clients-new-btn"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline text-xs ml-1">
              Харилцагч нэмэх
            </span>
          </button>
        )}
      </div>

      {/* Hidden inputs for excel operations - always rendered */}
      <input
        ref={residentExcelInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onResidentsExcelFileChange}
        className="hidden"
      />
      <input
        ref={unitExcelInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onUnitsExcelFileChange}
        className="hidden"
      />
    </div>
  );
}
