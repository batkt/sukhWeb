"use client";

import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import moment from "moment";
import { toast } from "react-hot-toast";
import ResidentRegistrationModal from "./ResidentRegistrationModal";
import deleteMethod from "../../../../tools/function/deleteMethod";
import { getResidentToot } from "@/lib/residentDataHelper";
import Button from "@/components/ui/Button";
import ZogsoolOrshinSuugchTable from "./ZogsoolOrshinSuugchTable";
import { StandardPagination } from "@/components/ui/StandardTable";

const RealTimeClock = () => {
  const [time, setTime] = useState(moment());
  useEffect(() => {
    const interval = setInterval(() => setTime(moment()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center text-center hidden md:flex shrink-0">
      <Clock className="w-4 h-4 text-[#4285F4] mb-1.5 opacity-80" />
      <p className="text-[11px] font-black text-slate-800 dark:text-gray-200 leading-none">
        {time.format("YYYY-MM-DD")}
      </p>
      <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mt-1.5 ">
        {time.format("HH:mm:ss")}
      </p>
    </div>
  );
};

/* Updated interface to match /orshinSuugch response */
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
}

export default function OrshinSuugch() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [editingResident, setEditingResident] =
    useState<ResidentParking | null>(null);
  const pageSize = 50;

  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: residentsData, mutate } = useSWR(
    shouldFetch
      ? [
          "/zochinJagsaalt",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          page,
          searchTerm,
        ]
      : null,
    async ([url, tkn, bId, barId, pg, search]): Promise<any> => {
      // Build query object with barilgiinId for backend filtering
      const queryObj: any = {
        baiguullagiinId: bId,
      };
      if (barId) {
        queryObj.barilgiinId = barId;
      }
      if (search) {
        queryObj.$or = [
          { ner: { $regex: search, $options: "i" } },
          { orshinSuugchNer: { $regex: search, $options: "i" } },
          { utas: { $regex: search, $options: "i" } },
          { burtgeliinDugaar: { $regex: search, $options: "i" } },
          { mashiniiDugaar: { $regex: search, $options: "i" } },
        ];
      }

      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pageSize,
          ...(search ? { search: search } : {}),
          query: JSON.stringify(queryObj),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const residents: ResidentParking[] = useMemo(() => {
    const list = residentsData?.jagsaalt || [];
    if (!effectiveBarilgiinId) return list;

    // Client-side filtering by barilgiinId as fallback if backend doesn't filter
    const toStr = (v: any) => (v == null ? "" : String(v));
    const targetBarilgiinId = toStr(effectiveBarilgiinId);

    return list.filter((item: any) => {
      const itemBarilgiinId = toStr(item?.barilgiinId);
      return itemBarilgiinId === targetBarilgiinId;
    });
  }, [residentsData, effectiveBarilgiinId]);

  // Use filtered count if client-side filtering is applied
  const totalCount = effectiveBarilgiinId
    ? residents.length
    : residentsData?.niitMur || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDelete = async (r: ResidentParking) => {
    const id = r._id;
    if (!id || !token) return;
    if (
      !window.confirm(
        `${r.ner || r.orshinSuugchNer || "Энэ хэрэглэгчийг"} устгахдаа итгэлтэй байна уу?`,
      )
    )
      return;

    try {
      // Based on save endpoint /zochinHadgalya, we might need a specific delete endpoint
      // but trying regular deleteMethod first as it's common in this project
      const res = await deleteMethod("orshinSuugch", token, id);
      if (res.data) {
        toast.success("Амжилттай устгагдлаа");
        mutate();
      }
    } catch (err) {
      toast.error("Устгахад алдаа гарлаа");
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-8 max-w-[1700px] mx-auto min-h-full flex flex-col gap-6">
        {/* Header */}
        <div className="relative z-10 px-6 py-4 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* Left: Title and Stats */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg text-slate-800 dark:text-white">
                  Оршин суугч
                </h1>
                <p className="text-[9px]  text-slate-400 uppercase tracking-widest mt-1">
                  {residentsData?.niitMur || 0} Бүртгэлтэй
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 flex-1 lg:justify-end">
              <div className="relative group w-full sm:w-72 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                <input
                  type="text"
                  placeholder="Нэр, утас, дугаар хайх..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-11 pr-4 h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border-0 text-[11px]  text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4285F4]/20 transition-all shadow-inner"
                />
              </div>

              <Button
                onClick={() => setShowRegistrationModal(true)}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="h-11 px-6 rounded-[30px] uppercase tracking-widest text-[10px] font-black"
              >
                <span className="hidden sm:inline">Бүртгэх</span>
              </Button>
            </div>
          </div>
        </div>

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
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-2xl flex-1 mt-2 p-4">
          <ZogsoolOrshinSuugchTable
            data={residents}
            loading={!residentsData && !residents.length}
            page={page}
            pageSize={pageSize}
            onEdit={(resident) => setEditingResident(resident)}
            onDelete={(resident) => handleDelete(resident)}
          />
        </div>

        <StandardPagination
          current={page}
          total={totalCount}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={undefined} // pageSize is fixed to 50 in this page currently
        />
      </div>
    </div>
  );
}
