"use client";

import React, { useEffect, useState } from "react";
import { notification, Select } from "antd";
import Aos from "aos";
import moment from "moment";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "../../../../lib/uilchilgee";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

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
}

export default function SanalKhuselt() {
  const { t } = useTranslation();
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

  useEffect(() => {
    Aos.init({ duration: 900, once: true });
    if (ajiltan?.baiguullagiinId && token) {
      fetchMedegdelData(ajiltan.baiguullagiinId);
    }
  }, [ajiltan, token]);

  const fetchMedegdelData = async (baiguullagiinId: string) => {
    setLoading(true);
    try {
      const response = await uilchilgee(token || undefined).get("/medegdel", {
        params: {
          baiguullagiinId,
          barilgiinId: ajiltan?.barilgiinId,
          tukhainBaaziinKholbolt: "amarSukh",
        },
      });

      if (response.data.success) {
        // Filter for only "sanal" and "gomdol" types (checking both Latin and Cyrillic)
        const filteredData = response.data.data.filter((item: MedegdelItem) => {
          const turul = item.turul?.toLowerCase() || "";
          return (
            turul === "sanal" ||
            "санал" === turul ||
            turul === "gomdol" ||
            turul === "гомдол"
          );
        });
        setMedegdelList(filteredData);
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

  const getStatusColor = (status: string) => {
    // Default to pending if status is null, undefined, or empty
    const normalizedStatus = status || "pending";

    switch (normalizedStatus) {
      case "pending":
        return {
          bg: "#fef3c7",
          border: "#fbbf24",
          text: "#92400e",
        };
      case "done":
        return {
          bg: "#d1fae5",
          border: "#10b981",
          text: "#065f46",
        };
      case "rejected":
        return {
          bg: "#fee2e2",
          border: "#ef4444",
          text: "#991b1b",
        };
      default:
        // If unknown status, default to pending colors
        return {
          bg: "#fef3c7",
          border: "#fbbf24",
          text: "#92400e",
        };
    }
  };

  const getStatusLabel = (status: string) => {
    // Default to pending if status is null, undefined, or empty
    const normalizedStatus = status || "pending";

    const labels: Record<string, string> = {
      pending: t("Хүлээгдэж байгаа"),
      done: t("Шийдэгдсэн"),
      rejected: t("Татгалзсан"),
    };
    return labels[normalizedStatus] || t("Хүлээгдэж байгаа");
  };

  const getStatusIcon = (status: string) => {
    // Default to pending if status is null, undefined, or empty
    const normalizedStatus = status || "pending";

    const icons: Record<string, React.ReactNode> = {
      pending: <ClockCircleOutlined />,
      done: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />,
    };
    return icons[normalizedStatus] || <ClockCircleOutlined />;
  };

  const handleStatusChange = (
    id: string,
    newStatus: string,
    currentStatus: string
  ) => {
    // Set pending status change to show confirmation buttons
    setPendingStatusChange({
      id,
      newStatus,
      oldStatus: currentStatus,
    });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    await updateMedegdelStatus(
      pendingStatusChange.id,
      pendingStatusChange.newStatus
    );
    setPendingStatusChange(null);
  };

  const cancelStatusChange = () => {
    setPendingStatusChange(null);
    // Reset the select value back to original
    if (selectedMedegdel) {
      setSelectedMedegdel({ ...selectedMedegdel });
    }
  };

  const updateMedegdelStatus = async (id: string, newStatus: string) => {
    try {
      // Find the current item to get its data
      const currentItem = medegdelList.find((item) => item._id === id);
      if (!currentItem) {
        notification.error({ message: t("Мэдэгдэл олдсонгүй") });
        return;
      }

      const response = await uilchilgee(token || undefined).put(
        `/medegdel/${id}`,
        {
          baiguullagiinId: ajiltan?.baiguullagiinId,
          tukhainBaaziinKholbolt: "amarSukh",
          barilgiinId: ajiltan?.barilgiinId,
          orshinSuugchId: currentItem.orshinSuugchId,
          title: currentItem.title,
          message: currentItem.message,
          kharsanEsekh: currentItem.kharsanEsekh,
          status: newStatus,
        }
      );

      if (response.data.success) {
        // Update local state
        setMedegdelList((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: newStatus } : item
          )
        );
        if (selectedMedegdel?._id === id) {
          setSelectedMedegdel((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
        }
        notification.success({ message: t("Төлөв амжилттай шинэчлэгдлээ") });
      } else {
        notification.error({ message: t("Төлөв шинэчлэхэд алдаа гарлаа") });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      notification.error({ message: t("Төлөв шинэчлэхэд алдаа гарлаа") });
    }
  };

  return (
    <div className="min-h-screen p-5">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        {t("Санал хүсэлт")}
      </motion.h1>

      <div className="flex h-[calc(100vh-10rem)] gap-6 bg-transparent">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex w-1/3 flex-col space-y-3 bg-transparent"
        >
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4 rounded-2xl bg-transparent backdrop-blur-xl border border-gray-200 text-slate-600">
                  {t("Уншиж байна...")}
                </div>
              </div>
            ) : medegdelList.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4 rounded-2xl bg-transparent backdrop-blur-xl border border-gray-200 text-slate-600">
                  {t("Өгөгдөл олдсонгүй")}
                </div>
              </div>
            ) : (
              medegdelList.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2"
                >
                  <div
                    className="group relative overflow-hidden rounded-2xl bg-transparent backdrop-blur-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedMedegdel(item)}
                  >
                    <div className="relative flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 text-sm">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {item.turul}
                          </div>
                          {item.ognoo && (
                            <div className="text-xs text-slate-400 mt-1">
                              {moment(item.ognoo).format("YYYY-MM-DD HH:mm")}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs"
                            style={{
                              backgroundColor: getStatusColor(item.status).bg,
                              borderLeft: `3px solid ${
                                getStatusColor(item.status).border
                              }`,
                              color: getStatusColor(item.status).text,
                            }}
                          >
                            {getStatusIcon(item.status)}
                            <span>{getStatusLabel(item.status)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right Panel */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-transparent backdrop-blur-md p-6 shadow-lg"
        >
          {selectedMedegdel ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-bold text-2xl text-slate-900 flex-1">
                  {selectedMedegdel.title}
                </h2>
                <div className="flex flex-col gap-2">
                  <Select
                    value={
                      pendingStatusChange?.id === selectedMedegdel._id
                        ? pendingStatusChange.newStatus
                        : selectedMedegdel.status || "pending"
                    }
                    onChange={(value) =>
                      handleStatusChange(
                        selectedMedegdel._id,
                        value,
                        selectedMedegdel.status || "pending"
                      )
                    }
                    size="middle"
                    className="status-select min-w-40"
                    labelRender={({ value }) => (
                      <span
                        className="flex items-center gap-2"
                        style={{
                          color: getStatusColor(value as string).text,
                        }}
                      >
                        {getStatusIcon(value as string)}
                        <span className="font-semibold">
                          {getStatusLabel(value as string)}
                        </span>
                      </span>
                    )}
                    options={[
                      {
                        label: (
                          <span className="flex items-center gap-2 font-medium">
                            <ClockCircleOutlined className="text-yellow-600" />
                            <span className="text-gray-800">
                              {t("Хүлээгдэж байгаа")}
                            </span>
                          </span>
                        ),
                        value: "pending",
                      },
                      {
                        label: (
                          <span className="flex items-center gap-2 font-medium">
                            <CheckCircleOutlined className="text-green-600" />
                            <span className="text-gray-800">
                              {t("Шийдэгдсэн")}
                            </span>
                          </span>
                        ),
                        value: "done",
                      },
                      {
                        label: (
                          <span className="flex items-center gap-2 font-medium">
                            <CloseCircleOutlined className="text-red-600" />
                            <span className="text-gray-800">
                              {t("Татгалзсан")}
                            </span>
                          </span>
                        ),
                        value: "rejected",
                      },
                    ]}
                    style={{
                      borderRadius: "10px",
                      backgroundColor: getStatusColor(
                        pendingStatusChange?.id === selectedMedegdel._id
                          ? pendingStatusChange.newStatus
                          : selectedMedegdel.status || "pending"
                      ).bg,
                      borderColor: getStatusColor(
                        pendingStatusChange?.id === selectedMedegdel._id
                          ? pendingStatusChange.newStatus
                          : selectedMedegdel.status || "pending"
                      ).border,
                      fontWeight: "600",
                    }}
                  />
                  {pendingStatusChange?.id === selectedMedegdel._id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2"
                    >
                      <button
                        onClick={confirmStatusChange}
                        className="flex-1 btn-minimal px-3 py-1.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-200 shadow-sm"
                      >
                        {t("Тийм")}
                      </button>
                      <button
                        onClick={cancelStatusChange}
                        className="btn-minimal flex-1 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200 shadow-sm"
                      >
                        {t("Үгүй")}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                  <div className="text-xs text-slate-500 mb-1">
                    {t("Төрөл")}
                  </div>
                  <div className="font-medium text-slate-900">
                    {selectedMedegdel.turul}
                  </div>
                </div>

                {selectedMedegdel.ognoo && (
                  <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                    <div className="text-xs text-slate-500 mb-1">
                      {t("Огноо")}
                    </div>
                    <div className="font-medium text-slate-900">
                      {moment(selectedMedegdel.ognoo).format(
                        "YYYY-MM-DD HH:mm"
                      )}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                  <div className="text-xs text-slate-500 mb-1">
                    {t("Үүсгэсэн")}
                  </div>
                  <div className="font-medium text-slate-900">
                    {moment(selectedMedegdel.createdAt).format(
                      "YYYY-MM-DD HH:mm"
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                  <div className="text-xs text-slate-500 mb-1">
                    {t("Шинэчилсэн")}
                  </div>
                  <div className="font-medium text-slate-900">
                    {moment(selectedMedegdel.updatedAt).format(
                      "YYYY-MM-DD HH:mm"
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm">
                <div className="text-sm text-slate-500 mb-2 font-medium">
                  {t("Мессеж")}
                </div>
                <div className="text-slate-900 whitespace-pre-wrap">
                  {selectedMedegdel.message}
                </div>
              </div>

              {selectedMedegdel.tailbar && (
                <div className="p-4 rounded-xl bg-blue-50/50 backdrop-blur-sm border border-blue-200">
                  <div className="text-sm text-blue-700 mb-2 font-medium">
                    {t("Хариу")}
                  </div>
                  <div className="text-slate-900 whitespace-pre-wrap">
                    {selectedMedegdel.tailbar}
                  </div>
                  {selectedMedegdel.repliedAt && (
                    <div className="text-xs text-slate-500 mt-2">
                      {t("Хариулсан огноо")}:{" "}
                      {moment(selectedMedegdel.repliedAt).format(
                        "YYYY-MM-DD HH:mm"
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    {t("Харсан эсэх")}
                  </div>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedMedegdel.kharsanEsekh
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedMedegdel.kharsanEsekh
                      ? t("Харсан")
                      : t("Хараагүй")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                {t("Мэдэгдэл сонгоно уу")}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
