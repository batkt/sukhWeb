"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { notification, Select } from "antd";
import { mutate } from "swr";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/useAuth";
import uilchilgee, { getApiUrl } from "@/lib/uilchilgee";
import {
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Calendar,
  AlertCircle,
  ChevronRight,
  Search,
  ArrowLeft,
} from "lucide-react";

interface MedegdelItem {
  _id: string;
  status: string;
  orshinSuugchId: string | null;
  baiguullagiinId: string;
  barilgiinId: string;
  title: string;
  message: string;
  kharsanEsekh: boolean;
  turul: string;
  ognoo?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  repliedAt?: string;
  repliedBy?: string;
  tailbar?: string;
  zurag?: string;
}

export default function SanalKhuselt() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("id");
  const { ajiltan, token } = useAuth();

  const [medegdelList, setMedegdelList] = useState<MedegdelItem[]>([]);
  const [selectedMedegdel, setSelectedMedegdel] = useState<MedegdelItem | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    newStatus: string;
    oldStatus: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (ajiltan?.baiguullagiinId && token) {
      fetchMedegdelData(ajiltan.baiguullagiinId);
    }
  }, [ajiltan, token]);

  useEffect(() => {
    if (preselectedId && medegdelList.length > 0) {
      const found = medegdelList.find((it) => it._id === preselectedId);
      if (found) setSelectedMedegdel(found);
    }
  }, [preselectedId, medegdelList]);

  const markedSeenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const markAsSeen = async (item: MedegdelItem) => {
      if (!item || !token || !ajiltan?.baiguullagiinId || markedSeenIds.current.has(item._id)) return;
      if (item.status !== "pending" || item.kharsanEsekh) return;

      try {
        await uilchilgee(token).put(`/medegdel/${item._id}`, {
          baiguullagiinId: ajiltan.baiguullagiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
          barilgiinId: ajiltan?.barilgiinId,
          orshinSuugchId: item.orshinSuugchId,
          title: item.title,
          message: item.message,
          kharsanEsekh: true,
          status: item.status,
        });
        markedSeenIds.current.add(item._id);
        mutate((key) => Array.isArray(key) && key[0] === "/medegdel/unreadCount");
        mutate((key) => Array.isArray(key) && key[0] === "/medegdel/unreadList");
      } catch {
        // Ignore - don't block UI
      }
    };

    if (selectedMedegdel) markAsSeen(selectedMedegdel);
  }, [selectedMedegdel, token, ajiltan]);

  const fetchMedegdelData = async (baiguullagiinId: string) => {
    setLoading(true);
    try {
      const response = await uilchilgee(token || undefined).get("/medegdel", {
        params: {
          baiguullagiinId,
          barilgiinId: ajiltan?.barilgiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
        },
      });

      if (response.data.success) {
        // Filter for only "sanal" and "gomdol" types (checking both Latin's and Cyrillic)
        const filteredData = response.data.data.filter((item: MedegdelItem) => {
          const turul = item.turul?.toLowerCase() || "";
          return (
            turul === "sanal" ||
            "санал" === turul ||
            turul === "gomdol" ||
            turul === "гомдол"
          );
        });
        // Sort by date desc
        filteredData.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMedegdelList(filteredData);
        if (filteredData.length > 0) {
          const toSelect = preselectedId
            ? filteredData.find((it: MedegdelItem) => it._id === preselectedId)
            : null;
          setSelectedMedegdel(toSelect || filteredData[0]);
        }
      } else {
        notification.error({ message: t("Өгөгдөл татахад алдаа гарлаа") });
      }
    } catch (error) {
      console.error("Error fetching medegdel:", error);
      notification.error({ message: t("Өгөгдөл татахад алдаа гарлаа") });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const s = status || "pending";
    switch (s) {
      case "pending":
        return {
          label: t("Хүлээгдэж байна"),
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-100 dark:bg-amber-900/30",
          border: "border-amber-200 dark:border-amber-800",
          icon: <Clock className="w-4 h-4" />,
        };
      case "done":
        return {
          label: t("Шийдэгдсэн"),
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          border: "border-emerald-200 dark:border-emerald-800",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      case "rejected":
        return {
          label: t("Татгалзсан"),
          color: "text-rose-600 dark:text-rose-400",
          bg: "bg-rose-100 dark:bg-rose-900/30",
          border: "border-rose-200 dark:border-rose-800",
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          label: t("Тодорхойгүй"),
          color: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-slate-800",
          border: "border-slate-200 dark:border-slate-700",
          icon: <AlertCircle className="w-4 h-4" />,
        };
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedMedegdel) return;
    setPendingStatusChange({
      id: selectedMedegdel._id,
      newStatus,
      oldStatus: selectedMedegdel.status || "pending",
    });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      // Find the current item to get its data
      const currentItem = medegdelList.find(
        (item) => item._id === pendingStatusChange.id
      );
      if (!currentItem) return;

      const response = await uilchilgee(token || undefined).put(
        `/medegdel/${pendingStatusChange.id}`,
        {
          baiguullagiinId: ajiltan?.baiguullagiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
          barilgiinId: ajiltan?.barilgiinId,
          orshinSuugchId: currentItem.orshinSuugchId,
          title: currentItem.title,
          message: currentItem.message,
          kharsanEsekh: currentItem.kharsanEsekh,
          status: pendingStatusChange.newStatus,
          updatedAt: new Date().toISOString(),
        }
      );

      if (response.data.success) {
        setMedegdelList((prev) =>
          prev.map((item) =>
            item._id === pendingStatusChange.id
              ? { ...item, status: pendingStatusChange.newStatus }
              : item
          )
        );
        setSelectedMedegdel((prev) =>
          prev
            ? { ...prev, status: pendingStatusChange.newStatus }
            : null
        );
        notification.success({ message: t("Төлөв амжилттай шинэчлэгдлээ") });
      }
    } catch (error) {
      notification.error({ message: t("Төлөв шинэчлэхэд алдаа гарлаа") });
    } finally {
      setPendingStatusChange(null);
    }
  };

  const filteredList = medegdelList.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type Filter
    const type = item.turul?.toLowerCase() || "";
    const matchesType = filterType === "all" 
      ? true 
      : filterType === "sanal" 
        ? type.includes("sanal") || type.includes("санал")
        : type.includes("gomdol") || type.includes("гомдол");

    // Status Filter
    const status = item.status || "pending";
    const matchesStatus = filterStatus === "all" ? true : status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="h-[calc(100vh-64px)] p-4 md:p-6 flex flex-col gap-6 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between shrink-0 ${showDetail ? 'hidden md:flex' : 'flex'}`}
      >
        <div>
          <h1 className="text-2xl  text-theme">{t("Санал хүсэлт")}</h1>
          <p className="text-theme/60 text-sm mt-1">
            {t("Ирсэн санал, гомдлуудыг шийдвэрлэх")}
          </p>
        </div>
      </motion.div>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Left Panel: List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`w-full md:w-[380px] lg:w-[420px] flex-col gap-4 shrink-0 ${showDetail ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Search and Filters */}
          <div className="flex flex-col gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme/50" />
                <input
                type="text"
                placeholder={t("Хайх...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] text-theme placeholder:text-theme/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <Select
                    value={filterType}
                    onChange={setFilterType}
                    className="w-full"
                    popupClassName="rounded-xl border border-[color:var(--surface-border)] shadow-xl"
                    options={[
                      { value: "all", label: t("Бүгд") },
                      { value: "sanal", label: t("Санал") },
                      { value: "gomdol", label: t("Гомдол") },
                    ]}
                 />
                 <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    className="w-full"
                    popupClassName="rounded-xl border border-[color:var(--surface-border)] shadow-xl"
                    options={[
                      { value: "all", label: t("Бүх төлөв") },
                      { value: "pending", label: t("Хүлээгдэж байна") },
                      { value: "done", label: t("Шийдэгдсэн") },
                      { value: "rejected", label: t("Татгалзсан") },
                    ]}
                 />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-theme/50 text-sm">
                {t("Уншиж байна...")}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3 opacity-60">
                <div className="w-12 h-12 rounded-full bg-[color:var(--surface-hover)] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-theme/50" />
                </div>
                <div className="text-theme/70 text-sm">
                  {t("Илэрц олдсонгүй")}
                </div>
              </div>
            ) : (
              filteredList.map((item) => {
                const status = getStatusInfo(item.status);
                const isSelected = selectedMedegdel?._id === item._id;
                
                return (
                  <motion.div
                    key={item._id}
                    layoutId={item._id}
                    onClick={() => {
                        setSelectedMedegdel(item);
                        setShowDetail(true);
                    }}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                        : "bg-[color:var(--surface-bg)] border-[color:var(--surface-border)] hover:border-blue-300/50 hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide border ${status.bg} ${status.color} ${status.border} bg-opacity-50`}
                      >
                        {status.label}
                      </div>
                      <span className="text-[10px] text-theme/50 font-medium">
                        {moment(item.createdAt).fromNow()}
                      </span>
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 line-clamp-1 ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-theme"}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-theme/60 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    
                    {isSelected && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-blue-500" />
                        </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Right Panel: Detail */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex-1 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-3xl shadow-sm overflow-hidden flex flex-col ${showDetail ? 'fixed inset-0 z-50 m-0 rounded-none md:static md:z-auto md:m-0 md:rounded-3xl' : 'hidden md:flex'}`}
        >
          {selectedMedegdel ? (
            <>
              {/* Detail Header */}
              <div className="p-4 md:p-6 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] md:bg-theme/5 backdrop-blur-sm flex flex-col gap-4">
                {/* Mobile Back Button */}
                 <div className="flex md:hidden items-center gap-2 mb-1">
                     <button 
                        onClick={() => setShowDetail(false)}
                        className="p-2 -ml-2 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors active:scale-95"
                     >
                        <ArrowLeft className="w-6 h-6 text-theme" />
                     </button>
                     <span className=" text-lg text-theme">{t("Санал хүсэлт")}</span>
                  </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2 md:pt-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded-lg bg-[color:var(--surface-hover)] text-[10px]  tracking-wider text-theme/70 border border-[color:var(--surface-border)]">
                        {selectedMedegdel.turul}
                      </span>
                      <span className="text-xs text-theme/50">
                        {moment(selectedMedegdel.createdAt).format("YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl  text-theme leading-tight">
                      {selectedMedegdel.title}
                    </h2>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                    <Select
                      value={
                        pendingStatusChange?.id === selectedMedegdel._id
                          ? pendingStatusChange.newStatus
                          : selectedMedegdel.status || "pending"
                      }
                      onChange={handleStatusChange}
                      className="w-full"
                      popupClassName="rounded-xl border border-[color:var(--surface-border)] shadow-xl"
                      size="large"
                      options={[
                        { value: "pending", label: <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500"/> {t("Хүлээгдэж байна")}</span> },
                        { value: "done", label: <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> {t("Шийдэгдсэн")}</span> },
                        { value: "rejected", label: <span className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500"/> {t("Татгалзсан")}</span> },
                      ]}
                    />
                    
                    <AnimatePresence>
                      {pendingStatusChange?.id === selectedMedegdel._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-2 w-full overflow-hidden"
                        >
                           <button
                            onClick={confirmStatusChange}
                            className="flex-1 py-1.5 px-3 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                          >
                            {t("Батлах")}
                          </button>
                          <button
                            onClick={() => setPendingStatusChange(null)}
                            className="flex-1 py-1.5 px-3 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200"
                          >
                            {t("Болих")}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[color:var(--surface-bg)]">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[color:var(--surface-hover)]/50 border border-[color:var(--surface-border)]">
                        <div className="flex items-center gap-2 text-theme/50 text-xs mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Огноо
                        </div>
                        <div className="font-semibold text-theme text-sm">
                            {moment(selectedMedegdel.ognoo || selectedMedegdel.createdAt).format("YYYY-MM-DD")}
                        </div>
                    </div>
                    
                     <div className="p-4 rounded-2xl bg-[color:var(--surface-hover)]/50 border border-[color:var(--surface-border)]">
                        <div className="flex items-center gap-2 text-theme/50 text-xs mb-1">
                             <Clock className="w-3.5 h-3.5 " />
                             Цаг
                        </div>
                        <div className="font-semibold text-theme text-sm">
                            {moment(selectedMedegdel.ognoo || selectedMedegdel.createdAt).format("HH:mm")}
                        </div>
                    </div>
                </div>

                {/* Message Body */}
                <div>
                    <h3 className="text-sm  text-theme/80 tracking-wide mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {t("Агуулга")}
                    </h3>
                    <div className="p-6 rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] text-theme leading-relaxed whitespace-pre-wrap text-base">
                        {selectedMedegdel.message}
                    </div>
                </div>

                {/* Image Section */}
                {selectedMedegdel.zurag && (
                  <div>
                    <h3 className="text-sm text-theme/80 tracking-wide mb-3 flex items-center gap-2">
                       <MessageSquare className="w-4 h-4" />
                       {t("Зураг")}
                    </h3>
                    <div className="rounded-2xl overflow-hidden border border-[color:var(--surface-border)]">
                      <img 
                        src={`${getApiUrl().replace(/\/$/, '')}/${selectedMedegdel.zurag.replace(/^public\//, '')}`} 
                        alt="Medegdel" 
                        className="w-full h-auto object-contain max-h-[500px] bg-black/5"
                      />
                    </div>
                  </div>
                )}

                {/* Reply Section */}
                {selectedMedegdel.tailbar && (
                     <div>
                        <h3 className="text-sm  text-blue-600 dark:text-blue-400  tracking-wide mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            {t("Хариу тайлбар")}
                        </h3>
                        <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-theme leading-relaxed whitespace-pre-wrap relative">
                             {selectedMedegdel.tailbar}
                             {selectedMedegdel.repliedAt && (
                                <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-800/50 text-xs text-theme/50 flex items-center gap-2">
                                     <CheckCircle className="w-3 h-3" />
                                     {t("Хариулсан")}: {moment(selectedMedegdel.repliedAt).format("YYYY-MM-DD HH:mm")}
                                </div>
                             )}
                        </div>
                    </div>
                )}
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-theme/40 gap-4">
                <div className="w-20 h-20 bg-[color:var(--surface-hover)] rounded-full flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 opacity-50" />
                </div>
                <p>{t("Дэлгэрэнгүй харах мэдээллийг сонгоно уу")}</p>
             </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
