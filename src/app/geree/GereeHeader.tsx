"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileDown,
  FileUp,
  LayoutTemplate,
  UserPlus,
  Columns3Cog,
  Send,
  ChevronDown,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import { ALL_COLUMNS } from "./columns";

interface GereeHeaderProps {
  activeTab: "contracts" | "residents" | "employees" | "units";
  setActiveTab: (tab: "contracts" | "residents" | "employees" | "units") => void;
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
  davkharOptions,
  selectedDawkhar,
  setSelectedDawkhar,
  selectedOrtsForContracts,
  setSelectedOrtsForContracts,
  statusFilter,
  setStatusFilter,
  unitStatusFilter,
  setUnitStatusFilter,
  ajiltan,
  selectedContracts,
  showColumnSelector,
  setShowColumnSelector,
  visibleColumns,
  setVisibleColumns,
  columnMenuRef,
  DEFAULT_HIDDEN,
  onShowAvlagaModal,
  onShowList2Modal,
  onSendInvoices,
  onShowResidentModal,
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
        <div className="flex items-start justify-between p-4 gap-4 mb-4 w-full">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <motion.h1
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-3xl font-bold text-theme"
                >
                  Гэрээ
                </motion.h1>
                <div style={{ width: 64, height: 64 }} className="flex items-center">
                  <DotLottieReact
                    src="https://lottie.host/97f6cb84-58da-46ef-811a-44e3203445c1/rQ76j6FHd8.lottie"
                    loop
                    autoplay
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>

              {/* Desktop: top-right actions per tab */}
              <div className="hidden md:flex items-center gap-2">
                {activeTab === "contracts" && (
                  <>
                    {ajiltan?.erkh === "Admin" && (
                      <>
                        <button
                          id="geree-avlaga-btn"
                          onClick={onShowAvlagaModal}
                          className={`btn-minimal ${
                            selectedContracts.length === 0
                              ? "opacity-60 pointer-events-none"
                              : ""
                          }`}
                          title="Авлага"
                        >
                          Авлага
                        </button>
                        <button
                          id="geree-send-invoice-btn"
                          onClick={onSendInvoices}
                          className={`btn-minimal ${
                            selectedContracts.length === 0
                              ? "opacity-60 pointer-events-none"
                              : ""
                          }`}
                          title="Нэхэмжлэх илгээх"
                        >
                          <Send className="w-5 h-5" />
                          <span className="hidden sm:inline text-xs ml-1">
                            Нэхэмжлэх илгээх
                          </span>
                        </button>
                      </>
                    )}
                    <button
                      id="geree-templates-btn"
                      onClick={onShowList2Modal}
                      className="btn-minimal"
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
                        className="btn-minimal flex items-center gap-2"
                        aria-label="Багана сонгох"
                        title="Багана сонгох"
                      >
                        <Columns3Cog className="w-5 h-5" />
                        <span className="hidden sm:inline text-xs ml-1">
                          Багана
                        </span>
                      </button>
                    </div>
                  </>
                )}

                {activeTab === "residents" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onShowResidentModal}
                      className="btn-minimal"
                      id="resident-new-btn-top"
                      aria-label="Оршин суугч"
                      title="Оршин суугч"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="hidden sm:inline text-xs ml-1">
                        Оршин суугч
                      </span>
                    </button>
                    <div ref={desktopExcelRef} className="relative">
                      <button
                        onClick={() => setIsDesktopExcelOpen(!isDesktopExcelOpen)}
                        className="btn-minimal inline-flex items-center gap-2"
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
                              onExportResidentsExcel();
                              setIsDesktopExcelOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                            id="resident-download-list-btn-top"
                          >
                            <Download className="w-4 h-4" />
                            <span>Жагсаалт татах</span>
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
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "employees" && (
                  <button
                    onClick={onShowEmployeeModal}
                    className="btn-minimal"
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
                      className="btn-minimal"
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
                      className="btn-minimal"
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
              </div>
            </div>
        <p className="text-sm mt-1 text-subtle">
          Гэрээ, Оршин суугч, Ажилтны жагсаалтуудыг удирдах
        </p>

        <div className="mt-3 flex items-center justify-between gap-4 w-full">
          <div className="flex justify-between items-center gap-2 w-full max-w-xl tabbar">
            <button
              id="tab-residents"
              onClick={() => setActiveTab("residents")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "residents"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Оршин суугч
            </button>
            <button
              id="tab-contracts"
              onClick={() => setActiveTab("contracts")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "contracts"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Гэрээ
            </button>
            <button
              id="tab-units"
              onClick={() => setActiveTab("units")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "units"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Тоот бүртгэл
            </button>
            <button
              id="tab-employees"
              onClick={() => setActiveTab("employees")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "employees"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Ажилтан
            </button>
          </div>

          {(activeTab === "contracts" || activeTab === "units") && (
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {activeTab === "contracts" && (
                <>
                  {ortsOptions.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-theme whitespace-nowrap">
                        Орц:
                      </label>
                      <div className="w-26">
                        <TusgaiZagvar
                          value={selectedOrtsForContracts}
                          onChange={(val) => setSelectedOrtsForContracts(val)}
                          options={[
                            { value: "", label: "Бүгд" },
                            ...ortsOptions.map((o) => ({ value: o, label: o })),
                          ]}
                          className="w-full z-50 text-xs"
                          placeholder="Сонгох..."
                        />
                      </div>
                    </div>
                  )}
                  {davkharOptions.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-theme whitespace-nowrap">
                        Давхар:
                      </label>
                      <div className="w-26">
                        <TusgaiZagvar
                          value={selectedDawkhar}
                          onChange={(val) => setSelectedDawkhar(val)}
                          options={[
                            { value: "", label: "Бүгд" },
                            ...davkharOptions.map((d) => ({
                              value: d,
                              label: d,
                            })),
                          ]}
                          className="w-full z-50 text-xs"
                          placeholder="Сонгох..."
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-theme whitespace-nowrap">
                      Төлөв:
                    </label>
                    <div className="w-26">
                      <TusgaiZagvar
                        value={statusFilter}
                        onChange={(val) =>
                          setStatusFilter(
                            val as "all" | "active" | "cancelled"
                          )
                        }
                        options={[
                          { value: "all", label: "Бүгд" },
                          { value: "active", label: "Идэвхтэй" },
                          { value: "cancelled", label: "Цуцлагдсан" },
                        ]}
                        className="w-full z-50 text-xs"
                        placeholder="Сонгох..."
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "units" && (
                <>
                  {/* Орц */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-theme whitespace-nowrap">
                      Орц:
                    </label>
                    <div className="w-26">
                      <TusgaiZagvar
                        value={selectedOrts}
                        onChange={(val) => setSelectedOrts(val)}
                        options={ortsOptions.map((o) => ({
                          value: o,
                          label: o,
                        }))}
                        className="w-full z-50 text-xs rounded-2xl"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {/* Давхар: styled dropdown, no Бүгд */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-theme whitespace-nowrap">
                      Давхар:
                    </label>
                    <div className="w-26">
                      <TusgaiZagvar
                        value={selectedDawkhar}
                        onChange={(val) => setSelectedDawkhar(val)}
                        options={davkharOptions.map((d) => ({
                          value: String(d),
                          label: String(d),
                        }))}
                        className="w-full z-50 text-xs rounded-2xl"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {/* Төлөв: only occupied / free, same card-like style */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-theme whitespace-nowrap">
                      Төлөв:
                    </label>
                    <div className="w-26">
                      <TusgaiZagvar
                        value={unitStatusFilter}
                        onChange={(val) =>
                          setUnitStatusFilter(
                            (val as "all" | "occupied" | "free") || "all",
                          )
                        }
                        options={[
                          { value: "occupied", label: "Идэвхтэй" },
                          { value: "free", label: "Идэвхгүй" },
                        ]}
                        className="w-full z-50 text-xs rounded-2xl"
                        placeholder="Төлөв"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile: filters on their own row, still right-aligned */}
        {(activeTab === "contracts" || activeTab === "units") && (
          <div className="mt-2 flex md:hidden items-center justify-end gap-2 flex-wrap">
            {activeTab === "contracts" && (
              <>
                {ortsOptions.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-theme whitespace-nowrap">
                      Орц:
                    </label>
                    <div className="w-24">
                      <TusgaiZagvar
                        value={selectedOrtsForContracts}
                        onChange={(val) => setSelectedOrtsForContracts(val)}
                        options={[
                          { value: "", label: "Бүгд" },
                          ...ortsOptions.map((o) => ({ value: o, label: o })),
                        ]}
                        className="w-full z-50 text-xs"
                        placeholder="Сонгох..."
                      />
                    </div>
                  </div>
                )}
                {davkharOptions.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-theme whitespace-nowrap">
                      Давхар:
                    </label>
                    <div className="w-24">
                      <TusgaiZagvar
                        value={selectedDawkhar}
                        onChange={(val) => setSelectedDawkhar(val)}
                        options={[
                          { value: "", label: "Бүгд" },
                          ...davkharOptions.map((d) => ({ value: d, label: d })),
                        ]}
                        className="w-full z-50 text-xs"
                        placeholder="Сонгох..."
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-theme whitespace-nowrap">
                    Төлөв:
                  </label>
                  <div className="w-24">
                    <TusgaiZagvar
                      value={statusFilter}
                      onChange={(val) =>
                        setStatusFilter(val as "all" | "active" | "cancelled")
                      }
                      options={[
                        { value: "all", label: "Бүгд" },
                        { value: "active", label: "Идэвхтэй" },
                        { value: "cancelled", label: "Цуцлагдсан" },
                      ]}
                      className="w-full z-50 text-xs"
                      placeholder="Сонгох..."
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "units" && (
              <>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-theme whitespace-nowrap">
                    Орц:
                  </label>
                  <div className="w-24">
                    <TusgaiZagvar
                      value={selectedOrts}
                      onChange={(val) => setSelectedOrts(val)}
                      options={ortsOptions.map((o) => ({
                        value: o,
                        label: o,
                      }))}
                      className="w-full z-50 text-xs"
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-theme whitespace-nowrap">
                    Давхар:
                  </label>
                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      value={selectedDawkhar}
                      onChange={(e) => setSelectedDawkhar(e.target.value)}
                      className="w-full px-2 py-1 rounded-xl border border-[color:var(--surface-border)] bg-transparent text-xs"
                      placeholder=""
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-theme whitespace-nowrap">
                    Төлөв:
                  </label>
                  <div className="w-24">
                    <TusgaiZagvar
                      value={unitStatusFilter}
                      onChange={(val) =>
                        setUnitStatusFilter(
                          (val as "all" | "occupied" | "free") || "all",
                        )
                      }
                      options={[
                        { value: "occupied", label: "Идэвхтэй" },
                        { value: "free", label: "Идэвхгүй" },
                      ]}
                      className="w-full z-50 text-xs"
                      placeholder="Төлөв"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
      {/* Mobile / small screens: keep actions below as before */}
      <div className="flex gap-2 flex-wrap px-4 md:hidden">
        {activeTab === "residents" && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowResidentModal}
                className="btn-minimal"
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
                  className="btn-minimal inline-flex items-center gap-2"
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
            className="btn-minimal"
            aria-label="Ажилтан нэмэх"
            title="Ажилтан нэмэх"
            id="employees-new-btn"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline text-xs ml-1">
              Ажилтан нэмэх
            </span>
          </button>
        )}
        {activeTab === "units" && (
          <>
            <button
              onClick={onDownloadUnitsTemplate}
              className="btn-minimal"
              id="units-download-template-btn"
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
              className="btn-minimal"
              id="units-upload-template-btn"
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
