"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useGereeContext } from "./GereeContext";
import {
  Download,
  FileDown,
  FileUp,
  Plus,
  UserPlus,
  ChevronDown,
  Zap,
} from "lucide-react";
import { hasPermission } from "@/lib/permissionUtils";
import Link from "next/link";
import ExcelButton from "@/components/ui/ExcelButton";

interface GereeHeaderProps {
  activeTab: "contracts" | "residents" | "employees" | "units" | "clients";
  setActiveTab: (
    tab: "contracts" | "residents" | "employees" | "units" | "clients",
  ) => void;
  onShowMassKwtModal?: () => void;
  statusFilter: "all" | "active" | "cancelled";
  setStatusFilter: (val: "all" | "active" | "cancelled") => void;
  unitStatusFilter: "all" | "occupied" | "free";
  setUnitStatusFilter: (val: "all" | "occupied" | "free") => void;
  ajiltan: any;
  selectedContracts: string[];
  onShowAvlagaModal: () => void;
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
  onDownloadClientsTemplate?: () => void;
  onClientsExcelImportClick?: () => void;
  isUploadingClients?: boolean;
  clientExcelInputRef?: React.RefObject<HTMLInputElement | null>;
  onClientsExcelFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function GereeHeader({
  activeTab,
  setActiveTab,
  statusFilter,
  setStatusFilter,
  unitStatusFilter,
  setUnitStatusFilter,
  ajiltan,
  onShowAvlagaModal,
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
  onDownloadClientsTemplate,
  onClientsExcelImportClick,
  isUploadingClients,
  clientExcelInputRef,
  onClientsExcelFileChange,
}: GereeHeaderProps) {
  const [isDesktopExcelOpen, setIsDesktopExcelOpen] = useState(false);
  const [isMobileExcelOpen, setIsMobileExcelOpen] = useState(false);
  const desktopExcelRef = useRef<HTMLDivElement>(null);
  const mobileExcelRef = useRef<HTMLDivElement>(null);

  const context = useGereeContext();
  const activePropertyTab = context?.state?.propertyTab || "Тоот";



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
            {activeTab === "units" && (
              <div className="hidden md:flex items-center gap-2 flex-wrap min-w-0">
                  {/* Тоот бүртгэл: Тоот / Гараж / Агуулах таб — үйлдлийн товчтой НЭГ мөрөнд
                      (дээр нь хоосон зай үлдээхгүй). Орц/Давхар/Төлөв шүүлтүүр
                      хүснэгтийн баганын толгойд байна. */}
                  {activeTab === "units" && context?.state?.setPropertyTab && (
                    <div className="stg-segment" role="tablist" aria-label="Өмчийн төрөл">
                      {(["Тоот", "Зогсоол", "Агуулах"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          role="tab"
                          aria-selected={activePropertyTab === t}
                          onClick={() => context.state.setPropertyTab(t)}
                          className={`stg-segment-item inline-flex min-h-9 items-center ${activePropertyTab === t ? "is-active" : ""}`}
                        >
                          {t === "Зогсоол" ? "Гараж" : t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Desktop: top-right actions per tab */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
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
                      className="btn-minimal h-10 inline-flex items-center gap-2 text-warning hover:text-warning"
                      id="resident-mass-kwt-btn-top"
                      aria-label="кВт заалт"
                      title="кВт заалт олноор шинэчлэх"
                    >
                      <Zap className="w-5 h-5" />
                      <span className="hidden sm:inline text-xs">кВт заалт</span>
                    </button>
                  )}
                  <div ref={desktopExcelRef} className="relative">
                    <ExcelButton
                      label="Excel"
                      id="resident-excel-btn-top"
                      title="Excel үйлдлүүд"
                      iconOnlyOnMobile
                      onClick={() => setIsDesktopExcelOpen(!isDesktopExcelOpen)}
                      suffix={
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isDesktopExcelOpen ? "rotate-180" : ""
                          }`}
                        />
                      }
                    />
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

              {activeTab === "units" && activePropertyTab === "Тоот" && (
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
                <div className="flex items-center gap-2">
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
                  {onClientsExcelImportClick && onDownloadClientsTemplate && (
                    <div ref={desktopExcelRef} className="relative">
                      <ExcelButton
                        label="Excel"
                        id="client-excel-btn-top"
                        title="Excel үйлдлүүд"
                        iconOnlyOnMobile
                        onClick={() => setIsDesktopExcelOpen(!isDesktopExcelOpen)}
                        suffix={
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${
                              isDesktopExcelOpen ? "rotate-180" : ""
                            }`}
                          />
                        }
                      />
                      {isDesktopExcelOpen && (
                        <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                          <button
                            onClick={() => {
                              onClientsExcelImportClick();
                              setIsDesktopExcelOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                            id="client-upload-template-btn-top"
                            disabled={isUploadingClients}
                          >
                            <FileUp className="w-4 h-4" />
                            <span>Загвар оруулах</span>
                          </button>
                          <button
                            onClick={() => {
                              onDownloadClientsTemplate();
                              setIsDesktopExcelOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                            id="client-download-template-btn-top"
                          >
                            <FileDown className="w-4 h-4" />
                            <span>Загвар татах</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          </div>
        </div>

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
                <ExcelButton
                  label="Excel"
                  id="resident-excel-btn"
                  title="Excel үйлдлүүд"
                  iconOnlyOnMobile
                  onClick={() => setIsMobileExcelOpen(!isMobileExcelOpen)}
                  suffix={
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        isMobileExcelOpen ? "rotate-180" : ""
                      }`}
                    />
                  }
                />
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
        {activeTab === "units" && activePropertyTab === "Тоот" && (
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
          <div className="flex items-center gap-2">
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
            {onClientsExcelImportClick && onDownloadClientsTemplate && (
              <div ref={mobileExcelRef} className="relative">
                <ExcelButton
                  label="Excel"
                  id="client-excel-btn"
                  title="Excel үйлдлүүд"
                  iconOnlyOnMobile
                  onClick={() => setIsMobileExcelOpen(!isMobileExcelOpen)}
                  suffix={
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        isMobileExcelOpen ? "rotate-180" : ""
                      }`}
                    />
                  }
                />
                {isMobileExcelOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        onDownloadClientsTemplate();
                        setIsMobileExcelOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                      id="client-download-template-btn"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Загвар татах</span>
                    </button>
                    <button
                      onClick={() => {
                        onClientsExcelImportClick();
                        setIsMobileExcelOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                      id="client-upload-template-btn"
                      disabled={isUploadingClients}
                    >
                      <FileUp className="w-4 h-4" />
                      <span>Загвар оруулах</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
      {clientExcelInputRef && onClientsExcelFileChange && (
        <input
          ref={clientExcelInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onClientsExcelFileChange}
          className="hidden"
        />
      )}
    </div>
  );
}
