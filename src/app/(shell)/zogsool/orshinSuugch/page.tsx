"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import {
  Search,
  User,
  Phone,
  MapPin,
  Car,
  Clock,
  Filter,
  MoreHorizontal,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import moment from "moment";
import { toast } from "react-hot-toast";
import ResidentRegistrationModal from "./ResidentRegistrationModal";
import ExcelImportModal from "./ExcelImportModal";
import deleteMethod from "../../../../../tools/function/deleteMethod";
import { getResidentToot } from "@/lib/residentDataHelper";
import Button from "@/components/ui/Button";
import ExcelButton from "@/components/ui/ExcelButton";
import ZogsoolOrshinSuugchTable from "./ZogsoolOrshinSuugchTable";
import { StandardPagination } from "@/components/ui/StandardTable";
import TusgaiZagvar from "../../../../../components/selectZagvar/tusgaiZagvar";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";
import ModalPortal from "../../../../../components/shell/ModalPortal";

const RealTimeClock = () => {
  const [time, setTime] = useState(moment());
  useEffect(() => {
    const interval = setInterval(() => setTime(moment()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center text-center hidden md:flex shrink-0">
      <p className="text-[11px] font-normal text-black dark:text-white leading-none">
        {time.format("YYYY-MM-DD")}
      </p>
      <p className="text-[11px] text-black dark:text-white mt-1.5 ">
        {time.format("HH:mm:ss")}
      </p>
    </div>
  );
};

interface ResidentParking {
  _id?: string;
  ner?: string;
  orshinSuugchNer?: string;
  ovog?: string;
  utas?: string;
  toot?: string;
  burtgeliinDugaar?: string;
  turul?: string; // Resident/Tenant
  tailbar?: string;
  burtgesenAjiltaniiNer?: string;
  createdAt?: string;
  mashinuud?: Array<{
    ulsiinDugaar: string;
    mark?: string;
  }>;

  zochinUrikhEsekh?: boolean;
  zochinTurul?: string;
  davtamjiinTurul?: string;
  mashiniiDugaar?: string;
  dugaarUurchilsunOgnoo?: string;
  ezenToot?: string;
  zochinTailbar?: string;
  zochinErkhiinToo?: number;
  zochinTusBurUneguiMinut?: number;
  zochinNiitUneguiMinut?: number;
  orshinSuugchTurul?: string;
  orts?: string;
}

export default function OrshinSuugch() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const { searchTerm } = useSearch();

  const tourSteps = useTourSteps("residents");
  useRegisterTourSteps("/zogsool/orshinSuugch", tourSteps);
  const [page, setPage] = useState(1);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ResidentParking | null>(null);
  const [editingResident, setEditingResident] =
    useState<ResidentParking | null>(null);
  const [pageSize, setPageSize] = useState(500);
  
  // Filters
  const [turulFilter, setTurulFilter] = useState("Бүгд");
  const [ortsFilter, setOrtsFilter] = useState("");
  const [tootFilter, setTootFilter] = useState("");
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if any modal is already open
      if (showRegistrationModal || editingResident) return;

      if (e.key === "+" || (e.key === "=" && e.shiftKey)) {
        const target = e.target as HTMLElement;
        const tag = (target?.tagName || "").toLowerCase();
        const isEditable = 
          target?.isContentEditable || 
          tag === "input" || 
          tag === "textarea" || 
          tag === "select";

        if (isEditable) return;

        e.preventDefault();
        setShowRegistrationModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRegistrationModal, editingResident]);

  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: residentsData, mutate } = useSWR(
    shouldFetch
      ? [
          "/zochinJagsaalt",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          page,
          pageSize,
          searchTerm,
          turulFilter,
          ortsFilter,
          tootFilter,
        ]
      : null,
    async ([url, tkn, bId, barId, pg, pSize, search, turul, orts, toot]): Promise<any> => {
      // Build query object with barilgiinId for backend filtering
      const queryObj: any = {
        baiguullagiinId: bId,
      };
      if (barId) {
        queryObj.barilgiinId = barId;
      }
      
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pSize,
          search: search || undefined,
          turul: turul && turul !== "Бүгд" ? turul : undefined,
          orts: orts && orts !== "Бүгд" ? orts : undefined,
          toot: toot || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  // Separate SWR for category counts (ignores turulFilter)
  const { data: statsData } = useSWR(
    shouldFetch
      ? [
          "/zochinJagsaalt",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          1,
          5000, // Large limit to get true counts if backend doesn't aggregate
          searchTerm,
          "Бүгд",
          ortsFilter,
          tootFilter,
        ]
      : null,
    async ([url, tkn, bId, barId, pg, pSize, search, turul, orts, toot]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
          search: search || undefined,
          orts: orts && orts !== "Бүгд" ? orts : undefined,
          toot: toot || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const residents: ResidentParking[] = residentsData?.jagsaalt || [];
  const totalCount = residentsData?.niitMur || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const ortsOptions = useMemo(() => {
    const set = new Set<string>();
    residents.forEach(r => {
      if (r.orts) set.add(r.orts);
    });
    return Array.from(set).sort();
  }, [residents]);

  const handleFilterChange = (filters: any) => {
    if (filters.orts) {
      setOrtsFilter(filters.orts[0] || "");
    }
    setPage(1);
  };

  const categoryStats = useMemo(() => {
    const list = statsData?.jagsaalt || [];
    const total = list.length;
    
    return [
      { label: "Нийт бүртгэл", value: "Бүгд", count: total },
      { 
        label: "Оршин суугч", 
        value: "Оршин суугч", 
        count: list.filter((it: any) => it.turul === "Оршин суугч" || it.zochinTurul === "Оршин суугч" || it.orshinSuugchTurul === "Оршин суугч").length 
      },
      { 
        label: "СӨХ", 
        value: "СӨХ", 
        count: list.filter((it: any) => it.turul === "СӨХ" || it.zochinTurul === "СӨХ" || it.orshinSuugchTurul === "СӨХ").length 
      },
      { 
        label: "Ажилтан", 
        value: "Ажилтан", 
        count: list.filter((it: any) => it.turul === "Ажилтан" || it.zochinTurul === "Ажилтан" || it.orshinSuugchTurul === "Ажилтан").length 
      },
      { 
        label: "Түрээслэгч", 
        value: "Түрээслэгч", 
        count: list.filter((it: any) => it.turul === "Түрээслэгч" || it.zochinTurul === "Түрээслэгч" || it.orshinSuugchTurul === "Түрээслэгч").length 
      },
      { 
        label: "Харилцагч", 
        value: "Харилцагч", 
        count: list.filter((it: any) => it.turul === "Харилцагч" || it.zochinTurul === "Харилцагч" || it.orshinSuugchTurul === "Харилцагч").length 
      },
      { 
        label: "Бусад", 
        value: "Бусад", 
        count: list.filter((it: any) => !["Оршин суугч", "СӨХ", "Ажилтан", "Түрээслэгч", "Харилцагч"].includes(it.turul || it.zochinTurul || it.orshinSuugchTurul)).length 
      },
    ];
  }, [statsData, totalCount]);

  const handleDelete = (r: ResidentParking) => {
    setItemToDelete(r);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !token) return;
    const id = itemToDelete._id;
    if (!id) return;

    try {
      // Мөр бүр НЭГ машины бүртгэл — тиймээс машиныг л устгана, оршин
      // суугчийг биш. Өмнө нь `deleteMethod("orshinSuugch", ...)`-г МАШИНЫ
      // id-гаар дууддаг тул оршин суугч олдохгүй, устгал чимээгүй унадаг байв.
      const res = await uilchilgee(token).delete(
        `/orshinSuugchiinMashin/${id}`,
        { data: { baiguullagiinId: ajiltan?.baiguullagiinId } },
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Машины бүртгэл устгагдлаа");
        mutate();
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        toast.error(res.data?.aldaa || "Устгахад алдаа гарлаа");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.aldaa ||
          err?.response?.data?.message ||
          "Устгахад алдаа гарлаа",
      );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 sm:p-8 max-w-[1700px] mx-auto w-full flex-1 flex flex-col gap-6 overflow-hidden bg-transparent">


        {/* Category Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categoryStats.map((stat) => {
            const isActive = turulFilter === stat.value;
            return (
              <div
                key={stat.value}
                onClick={() => {
                  setTurulFilter(stat.value);
                  setPage(1);
                }}
                className={`relative group rounded-2xl transition-all duration-300 cursor-pointer border bg-[color:var(--surface-bg)] ${
                  isActive
                    ? "border-theme shadow-md shadow-theme/10 scale-[1.02]"
                    : "border-[color:var(--surface-border)] dark:border-white/5 shadow-sm hover:shadow-md hover:border-[color:var(--surface-border)] dark:hover:border-white/10"
                }`}
              >
                <div className="relative p-5 overflow-hidden flex flex-col h-full justify-between">
                  <div
                    className={`text-3xl font-sans mb-1 transition-colors ${
                      isActive ? "text-brand font-medium" : "text-[color:var(--panel-text)]"
                    }`}
                  >
                    {stat.count || "0"}
                  </div>
                  <div
                    className={`text-[13px] font-sans leading-tight transition-colors ${
                      isActive ? "text-brand/80 font-medium" : "text-[color:var(--muted-text)]"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table Actions */}
        <div className="flex items-center justify-end gap-3 px-1">
          <ExcelButton
            label="Excel"
            title="Excel-ээр машин бүртгэх"
            onClick={() => setShowExcelImport(true)}
          />
          <Button
            id="resident-new-btn"
            onClick={() => setShowRegistrationModal(true)}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="h-9 px-4 rounded-[10px] text-[13px]"
          >
            Нэмэх
          </Button>
        </div>

        {showDeleteModal && itemToDelete && (
          <ModalPortal>
            <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[color:var(--panel)] backdrop-blur-sm"
                onClick={() => setShowDeleteModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-white dark:bg-[color:var(--panel)] rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5 p-8"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-6">
                    <Trash2 className="w-8 h-8 text-danger" />
                  </div>
                  <h3 className="text-xl font-medium text-[color:var(--panel-text)] dark:text-white mb-2">
                    Устгахдаа итгэлтэй байна уу?
                  </h3>
                  <p className="text-[color:var(--muted-text)] mb-8 leading-relaxed">
                    <span className="font-medium text-[color:var(--panel-text)]">
                      {itemToDelete.ner || itemToDelete.orshinSuugchNer || "Энэ хэрэглэгч"}
                    </span>{" "}
                    -ийн мэдээллийг устгахыг зөвшөөрч байна уу?
                  </p>
                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={confirmDelete}
                      className="w-full h-12 bg-danger hover:bg-danger text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-danger/20"
                    >
                      Устгах
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="w-full h-12 bg-[color:var(--surface-hover)] dark:bg-white/5 hover:bg-[color:var(--panel)] dark:hover:bg-white/10 text-[color:var(--muted-text)] rounded-xl font-medium transition-all"
                    >
                      Цуцлах
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}

        {showExcelImport && (
          <ExcelImportModal
            token={token || ""}
            baiguullagiinId={ajiltan?.baiguullagiinId}
            barilgiinId={effectiveBarilgiinId}
            onClose={() => setShowExcelImport(false)}
            onSuccess={() => mutate()}
          />
        )}

        {showRegistrationModal && (
          <ResidentRegistrationModal
            onClose={() => setShowRegistrationModal(false)}
            token={token || ""}
            barilgiinId={effectiveBarilgiinId}
            baiguullagiinId={ajiltan?.baiguullagiinId}
            onSuccess={() => {
              mutate(); // Refresh the list
            }}
          />
        )}

        {editingResident && (
          <ResidentRegistrationModal
            onClose={() => setEditingResident(null)}
            token={token || ""}
            barilgiinId={effectiveBarilgiinId}
            baiguullagiinId={ajiltan?.baiguullagiinId}
            editData={editingResident}
            onSuccess={() => {
              mutate(); // Refresh the list
            }}
          />
        )}

        {/* Content Table */}
        <div className="mt-2 flex-1 min-h-0">
          <ZogsoolOrshinSuugchTable
            data={residents}
            loading={!residentsData && !residents.length}
            page={page}
            pageSize={pageSize}
            onEdit={(resident) => setEditingResident(resident)}
            onDelete={(resident) => handleDelete(resident)}
            onFilterChange={handleFilterChange}
            ortsOptions={ortsOptions}
          />
        </div>

        <div id="resident-pagination">
          <StandardPagination
            current={page}
            total={totalCount}
            pageSize={pageSize}
            onChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
