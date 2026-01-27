"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileDown,
  FileUp,
  LayoutTemplate,
  UserPlus,
  Columns3Cog,
  Send,
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
  return (
    <div className="flex items-start justify-between p-4 gap-4 mb-4">
      <div>
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
        <p className="text-sm mt-1 text-subtle">
          Гэрээ, Оршин суугч, Ажилтны жагсаалтуудыг удирдах
        </p>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 flex-wrap items-center gap-2 tabbar">
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
          {activeTab === "units" && ortsOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-theme whitespace-nowrap">
                Орц сонгох
              </label>
              <div className="w-32">
                <TusgaiZagvar
                  value={selectedOrts}
                  onChange={(val) => setSelectedOrts(val)}
                  options={ortsOptions.map((o) => ({ value: o, label: o }))}
                  className="w-full z-50"
                  placeholder={
                    ortsOptions.length === 0
                      ? "Орц тохируулаагүй"
                      : "Сонгох..."
                  }
                  disabled={ortsOptions.length === 0}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
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
          </>
        )}
        {activeTab === "residents" && (
          <>
            <div className="grid grid-cols-2 min-[1200px]:grid-cols-4 gap-2 w-full">
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
              <button
                onClick={onExportResidentsExcel}
                className="btn-minimal"
                aria-label="Оршин суугч Excel татах"
                title="Оршин суугчдын Excel татах"
                id="resident-download-list-btn"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Жагсаалт татах
                </span>
              </button>
              <button
                onClick={onDownloadResidentsTemplate}
                className="btn-minimal"
                id="resident-download-template-btn"
                aria-label="Загвар татах"
                title="Оршин суугчийн Excel загвар татах"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Загвар татах
                </span>
              </button>
              <button
                onClick={onResidentsExcelImportClick}
                className="btn-minimal"
                id="resident-upload-template-btn"
                disabled={isUploadingResidents}
                aria-label="Excel-ээс импортлох"
                title="Excel-ээс оршин суугчдыг импортлох"
              >
                <FileUp className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Загвар оруулах
                </span>
              </button>
            </div>
            <input
              ref={residentExcelInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={onResidentsExcelFileChange}
              className="hidden"
            />
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
            <input
              ref={unitExcelInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={onUnitsExcelFileChange}
              className="hidden"
            />
          </>
        )}
        {activeTab === "contracts" && (
          <div className="relative flex-shrink-0" ref={columnMenuRef}>
            <button
              id="geree-columns-btn"
              onClick={() => setShowColumnSelector((s) => !s)}
              className="btn-minimal"
              aria-expanded={showColumnSelector}
              aria-haspopup="menu"
              aria-label="Багана сонгох"
              title="Багана сонгох"
            >
              <Columns3Cog className="w-5 h-5" />
              <span className="hidden sm:inline text-xs ml-1">Багана</span>
            </button>
            {showColumnSelector && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-xl menu-surface p-3 z-[80]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-theme">
                    Багана
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs px-2 py-1"
                      onClick={() =>
                        setVisibleColumns(ALL_COLUMNS.map((c) => c.key))
                      }
                    >
                      Бүгд
                    </button>
                    <button
                      type="button"
                      className="text-xs px-2 py-1"
                      onClick={() =>
                        setVisibleColumns(
                          ALL_COLUMNS.filter(
                            (c) =>
                              c.default && !DEFAULT_HIDDEN.includes(c.key),
                          ).map((c) => c.key),
                        )
                      }
                    >
                      Үндсэн
                    </button>
                  </div>
                </div>
                <div className="max-h-70 overflow-y-auto space-y-1">
                  {ALL_COLUMNS.map((col) => {
                    const checked = visibleColumns.includes(col.key);
                    return (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 text-sm text-theme hover:bg-[color:var(--surface-hover)] px-2 py-1.5 rounded-2xl cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setVisibleColumns((prev) =>
                              prev.includes(col.key)
                                ? prev.filter((k) => k !== col.key)
                                : [...prev, col.key],
                            )
                          }
                          style={{ accentColor: "var(--panel-text)" }}
                        />
                        {col.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
