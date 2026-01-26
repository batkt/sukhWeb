"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import moment from "moment";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal as MModal, Button as MButton } from "@mantine/core";
import ZogsoolBurtgekh from "./ZogsoolBurtgekh";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

interface ZogsoolItem {
  _id?: string;
  key?: number;
  ner: string;
  ajiltniiNer?: string;
  khaalga?: any[];
  too: number;
  undsenUne: number | string;
  ognoo?: Date | string;
  createdAt?: string;
}

interface SmsItem {
  _id?: string;
  key?: number;
  createdAt: Date | string;
  dugaar: string[];
  msg: string;
}

interface ZogsoolProps {
  ajiltan?: any;
  baiguullaga?: any;
  token?: string;
  setSongogdsonTsonkhniiIndex?: (index: number) => void;
}

export default function Zogsool({
  ajiltan,
  baiguullaga,
  token: propToken,
  setSongogdsonTsonkhniiIndex,
}: ZogsoolProps) {
  const { token: authToken, barilgiinId, ajiltan: authAjiltan } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  // Use prop token if provided, otherwise fall back to auth token
  const token = propToken || authToken || "";
  
  // Use prop ajiltan if provided, otherwise fall back to auth ajiltan
  const effectiveAjiltan = ajiltan || authAjiltan;
  const effectiveBaiguullagiinId = effectiveAjiltan?.baiguullagiinId;
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ZogsoolItem | null>(null);
  const zogsoolRef = useRef<any>(null);

  // Allow API call if we have token and baiguullagiinId
  // Building context initialization can be slow, but we have the data we need from ajiltan
  const shouldFetch = !!token && !!effectiveBaiguullagiinId;

  const { data: zogsoolDataResponse, mutate: mutateZogsool } = useSWR(
    shouldFetch
      ? [
          "/parking",
          token,
          effectiveBaiguullagiinId,
          effectiveBarilgiinId,
          page,
        ]
      : null,
    async ([url, tkn, bId, barId, p]): Promise<any> => {
      // API endpoint: /api/parking (matches https://amarhome.mn/api/parking)
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: p,
          khuudasniiKhemjee: pageSize,
        },
      });
      
      const data = resp.data;
      
      // Normalize response to consistent format
      // Handle both direct array and wrapped responses
      if (Array.isArray(data)) {
        return {
          jagsaalt: data,
          niitMur: data.length,
          niitKhuudas: Math.ceil(data.length / pageSize),
        };
      }
      
      // If it's an object, return as-is (might have jagsaalt, list, etc.)
      return data;
    },
    { revalidateOnFocus: false }
  );

  // Handle multiple response formats (similar to other hooks)
  const zogsoolData: ZogsoolItem[] = useMemo(() => {
    const data = zogsoolDataResponse;
    if (!data) return [];
    
    // Debug: log the response structure (remove in production if needed)
    if (process.env.NODE_ENV === "development") {
      console.log("Parking API Response:", data);
    }
    
    // Try different response formats
    if (Array.isArray(data?.jagsaalt)) return data.jagsaalt;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.data?.jagsaalt)) return data.data.jagsaalt;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    
    return [];
  }, [zogsoolDataResponse]);

  const { data: smsDataResponse } = useSWR(
    shouldFetch
      ? ["/parking/sms", token, effectiveBaiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const smsData: SmsItem[] = smsDataResponse?.jagsaalt || [];

  const addZogsool = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const editZogsool = (item: ZogsoolItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const deleteZogsool = async (id: string) => {
    if (!confirm("Устгахдаа итгэлтэй байна уу?")) return;
    
    try {
      // API endpoint: DELETE /api/parking/:id (matches https://amarhome.mn/api/parking/:id)
      await uilchilgee(token).delete(`/parking/${id}`);
      openSuccessOverlay("Амжилттай устгалаа");
      mutateZogsool();
    } catch (error: any) {
      openErrorOverlay(error?.message || "Алдаа гарлаа");
    }
  };

  const refreshZogsool = () => {
    mutateZogsool();
  };

  const totalPages = Math.ceil(
    (zogsoolDataResponse?.niitMur || 
     zogsoolDataResponse?.niitKhuudas || 
     zogsoolDataResponse?.total || 
     zogsoolData?.length || 0) / pageSize
  );

  return (
    <div>
      <div
        className="flex justify-between items-center border-b pb-3"
        style={{ borderColor: "var(--surface-border)" }}
      >
        <h2 className="text-lg font-medium">Зогсоол тохиргоо</h2>
        <button
          onClick={addZogsool}
          className="flex items-center px-2 py-2 btn-neu  transition"
        >
          <PlusOutlined className="mr-2" /> Зогсоол бүртгэх
        </button>
      </div>

      <div className="overflow-x-auto table-surface neu-table custom-scrollbar">
        <table className="table-ui w-full text-left">
          <thead>
            <tr>
              {[
                "№",
                "Зогсоолын нэр",
                "Дотор эсэх",
                "Хаалганы тоо",
                "Зогсоолын тоо",
                "Үнэ",
                "Огноо",
                "",
              ].map((col) => (
                <th key={col} className="py-3 px-4 font-semibold text-theme">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zogsoolData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[color:var(--muted-text)]">
                  Зогсоолын мэдээлэл олдсонгүй
                </td>
              </tr>
            ) : (
              zogsoolData.map((record, idx) => (
                <tr key={record._id || record.key || idx}>
                  <td className="py-3 px-4">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="py-3 px-4">{record.ner}</td>
                  <td className="py-3 px-4">{record.ajiltniiNer || "-"}</td>
                  <td className="py-3 px-4">
                    {record.khaalga?.length || 0}
                  </td>
                  <td className="py-3 px-4">{record.too}</td>
                  <td className="py-3 px-4">
                    {typeof record.undsenUne === "number"
                      ? `${record.undsenUne}₮`
                      : record.undsenUne}
                  </td>
                  <td className="py-3 px-4">
                    {record.ognoo || record.createdAt
                      ? moment(record.ognoo || record.createdAt).format(
                          "YYYY-MM-DD, HH:mm"
                        )
                      : "-"}
                  </td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => editZogsool(record)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Засах"
                    >
                      <EditOutlined />
                    </button>
                    {record._id && (
                      <button
                        onClick={() => deleteZogsool(record._id!)}
                        className="text-red-600 hover:text-red-800"
                        title="Устгах"
                      >
                        <DeleteOutlined />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-4 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Өмнөх
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Дараах
          </button>
        </div>
      )}

      <div className="mt-10 mb-5 flex justify-between items-center">
        <h2 className="text-md font-medium">СМС тохиргоо</h2>
      </div>
      <div className="overflow-x-auto table-surface neu-table custom-scrollbar">
        <table className="table-ui w-full text-left">
          <thead>
            <tr>
              {["№", "Огноо", "Дугаар", "СМС мессеж"].map((col) => (
                <th key={col} className="py-3 px-4 font-semibold text-theme">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {smsData.slice(0, 5).map((record, idx) => (
              <tr key={record.key}>
                <td className="py-3 px-4">{idx + 1}</td>
                <td className="py-3 px-4">
                  {moment(record.createdAt).format("YYYY-MM-DD, HH:mm")}
                </td>
                <td className="py-3 px-4">{record.dugaar[0]}</td>
                <td className="py-3 px-4">{record.msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zogsool Modal */}
      <MModal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Зогсоол засах" : "Зогсоол бүртгэх"}
        size="xl"
        classNames={{
          content: "modal-surface modal-responsive",
          header:
            "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
          title: "text-theme font-semibold",
          close: "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
        }}
        overlayProps={{ opacity: 0.5, blur: 6 }}
        centered
      >
        <ZogsoolBurtgekh
          ref={zogsoolRef}
          data={editingItem}
          jagsaalt={zogsoolData}
          barilgiinId={effectiveBarilgiinId || barilgiinId || undefined}
          token={token || ""}
          refresh={refreshZogsool}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
        />
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <MButton
            onClick={() => zogsoolRef.current?.khaaya()}
            className="btn-minimal btn-cancel"
          >
            Хаах
          </MButton>
          <MButton
            onClick={() => zogsoolRef.current?.khadgalya()}
            className="btn-minimal btn-save"
          >
            Хадгалах
          </MButton>
        </div>
      </MModal>
    </div>
  );
}
