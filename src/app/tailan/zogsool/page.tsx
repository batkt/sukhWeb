"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import uilchilgee from "@/lib/uilchilgee";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import formatNumber from "../../../../tools/function/formatNumber";

interface ResidentSummaryRow {
  orshinSuugchiinId: string;
  ner: string;
  toot: string;
  urisanMachinToo: number;
  niitTulbur: number;
  khungulultMinut: number;
  tulsunDun: number;
  uldegdelTulbur: number;
}

interface GuestDetailRow {
  mashiniiDugaar: string;
  zogssonMinut: number;
  khungulsunMinut: number;
  tulbur: number;
  tuluv: string;
}

interface GuestCarRow {
  mashiniiDugaar: string;
  orshinSuugchiinNer: string;
  davkhar: string;
  toot: string;
  utas: string;
}

export default function ZogsoolTailanPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([null, null]);
  const [filters, setFilters] = useState({
    orshinSuugch: "",
    toot: "",
  });
  const [apiResponse, setApiResponse] = useState<{
    residentSummary: ResidentSummaryRow[];
    niit: {
      urisanMachinToo: number;
      niitTulbur: number;
      khungulultMinut: number;
      tulsunDun: number;
      uldegdelTulbur: number;
    };
    guestCarList: GuestCarRow[];
    selectedDetail: GuestDetailRow[] | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"residentSummary" | "guestDetail" | "guestCarList">("residentSummary");
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBuildingId || !baiguullaga) return;

      try {
        setLoading(true);
        const response = await uilchilgee(token ?? undefined).post(
          "/tailan/zogsool",
          {
            baiguullagiinId: baiguullaga._id,
            barilgiinId: selectedBuildingId,
            ekhlekhOgnoo: dateRange?.[0] || undefined,
            duusakhOgnoo: dateRange?.[1] || undefined,
            orshinSuugch: filters.orshinSuugch || undefined,
            toot: filters.toot || undefined,
          }
        );
        setApiResponse(response.data);
        setSelectedResidentId(null);
        setActiveTab("residentSummary");
      } catch (err: any) {
        setError(err?.response?.data?.aldaa || err?.response?.data?.message || err.message || "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBuildingId, baiguullaga, token, dateRange, filters]);

  const residentSummary = apiResponse?.residentSummary || [];
  const niit = apiResponse?.niit || {
    urisanMachinToo: 0,
    niitTulbur: 0,
    khungulultMinut: 0,
    tulsunDun: 0,
    uldegdelTulbur: 0,
  };
  const guestCarList = apiResponse?.guestCarList || [];
  const selectedDetail = apiResponse?.selectedDetail || null;

  const handleResidentClick = async (orshinSuugchiinId: string) => {
    if (selectedResidentId === orshinSuugchiinId) {
      setSelectedResidentId(null);
      setApiResponse((prev) =>
        prev ? { ...prev, selectedDetail: null } : null
      );
      return;
    }
    setSelectedResidentId(orshinSuugchiinId);
    const resident = residentSummary.find((r) => r.orshinSuugchiinId === orshinSuugchiinId);
    if (!resident) return;
    setDetailLoading(true);
    try {
      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/zogsool",
        {
          baiguullagiinId: baiguullaga?._id,
          barilgiinId: selectedBuildingId,
          ekhlekhOgnoo: dateRange?.[0] || undefined,
          duusakhOgnoo: dateRange?.[1] || undefined,
          orshinSuugch: resident.ner,
          toot: resident.toot,
        }
      );
      setApiResponse((prev) =>
        prev ? { ...prev, selectedDetail: response.data?.selectedDetail || null } : null
      );
    } catch {
      setSelectedResidentId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const displayDetail = useMemo(() => {
    if (!selectedResidentId) return null;
    if (detailLoading) return null;
    return selectedDetail;
  }, [selectedResidentId, selectedDetail, detailLoading]);

  const selectedResident = residentSummary.find(
    (r) => r.orshinSuugchiinId === selectedResidentId
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Уншиж байна...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Алдаа: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-2xl">Зогсоолын тайлан</h1>
        <div className="w-full md:w-[320px]">
          <DatePickerInput
            type="range"
            locale="mn"
            value={dateRange}
            onChange={setDateRange}
            size="sm"
            radius="md"
            variant="filled"
            dropdownType="popover"
            popoverProps={{
              position: "bottom-start",
              withinPortal: true,
              width: 320,
            }}
            clearable
            placeholder="Огноо сонгох"
            classNames={{
              input:
                "neu-panel text-theme placeholder:text-theme !h-[40px] !py-2 !w-full",
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="neu-panel p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">
            Оршин суугч
          </label>
          <input
            type="text"
            value={filters.orshinSuugch}
            onChange={(e) =>
              setFilters((p) => ({ ...p, orshinSuugch: e.target.value }))
            }
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Нэрээр хайх"
          />
        </div>
        <div className="neu-panel p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">
            Тоот
          </label>
          <input
            type="text"
            value={filters.toot}
            onChange={(e) =>
              setFilters((p) => ({ ...p, toot: e.target.value }))
            }
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Тоот"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("residentSummary")}
          className={`px-4 py-2 rounded-xl  transition-all ${
            activeTab === "residentSummary"
              ? "neu-panel bg-white/20 border border-white/20"
              : "hover:menu-surface"
          }`}
        >
          Оршин суугчдын урьсан зочдын машин
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guestDetail")}
          className={`px-4 py-2 rounded-xl  transition-all ${
            activeTab === "guestDetail"
              ? "neu-panel bg-white/20 border border-white/20"
              : "hover:menu-surface"
          }`}
        >
          Зочдын дэлгэрэнгүй тайлан
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guestCarList")}
          className={`px-4 py-2 rounded-xl  transition-all ${
            activeTab === "guestCarList"
              ? "neu-panel bg-white/20 border border-white/20"
              : "hover:menu-surface"
          }`}
        >
          Зочдын машины жагсаалт
        </button>
      </div>

      {activeTab === "residentSummary" && (
        <div className="overflow-hidden rounded-2xl neu-table allow-overflow">
          <h3 className="p-4  text-theme border-b">
            Оршин суугчдын урьсан зочдын машин бүртгэлийн тайлан
          </h3>
          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Тоот
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Урьсан машин тоо
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Нийт төлөх
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Хөнгөлөлт Минут
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Төлсөн дүн
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Үлдэгдэл төлбөр
                  </th>
                </tr>
              </thead>
              <tbody>
                {residentSummary.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-theme/60"
                    >
                      Мэдээлэл алга байна
                    </td>
                  </tr>
                ) : (
                  residentSummary.map((row, idx) => (
                    <tr
                      key={row.orshinSuugchiinId}
                      className={`transition-colors border-b last:border-b-0 cursor-pointer hover:bg-[color:var(--surface-hover)]/30 ${
                        selectedResidentId === row.orshinSuugchiinId
                          ? "bg-[color:var(--surface-hover)]/50"
                          : ""
                      }`}
                      onClick={() => {
                        handleResidentClick(row.orshinSuugchiinId);
                        setActiveTab("guestDetail");
                      }}
                    >
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="p-3 text-left text-theme whitespace-nowrap">
                        {row.ner || "-"}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.toot || "-"}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.urisanMachinToo}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {formatNumber(row.niitTulbur)} ₮
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.khungulultMinut || "-"}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {formatNumber(row.tulsunDun)} ₮
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {formatNumber(row.uldegdelTulbur)} ₮
                      </td>
                    </tr>
                  ))
                )}
                {residentSummary.length > 0 && (
                  <tr className="border-t-2  bg-[color:var(--surface-hover)]/20">
                    <td className="p-3 text-center" colSpan={3}>
                      Нийт
                    </td>
                    <td className="p-3 text-center">{niit.urisanMachinToo}</td>
                    <td className="p-3 text-center">
                      {formatNumber(niit.niitTulbur)} ₮
                    </td>
                    <td className="p-3 text-center">
                      {niit.khungulultMinut || "-"}
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(niit.tulsunDun)} ₮
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(niit.uldegdelTulbur)} ₮
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "guestDetail" && (
        <div className="overflow-hidden rounded-2xl neu-table allow-overflow">
          <h3 className="p-4  text-theme border-b">
            Зочдын дэлгэрэнгүй тайлан
            {selectedResident && (
              <span className="ml-2 text-sm font-normal text-theme/70">
                — Нэр: {selectedResident.ner} | Тоот: {selectedResident.toot}
              </span>
            )}
          </h3>
          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Машины дугаар
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Зогссон минут
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Хөнгөлсөн минут
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Төлбөр
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Төлөв
                  </th>
                </tr>
              </thead>
              <tbody>
                {detailLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-theme/60">
                      Уншиж байна...
                    </td>
                  </tr>
                ) : !displayDetail || displayDetail.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-theme/60"
                    >
                      {selectedResidentId
                        ? "Дэлгэрэнгүй мэдээлэл алга"
                        : "Эхний таб дээр оршин суугч сонгоно уу"}
                    </td>
                  </tr>
                ) : (
                  displayDetail.map((row, idx) => (
                    <tr
                      key={`${row.mashiniiDugaar}-${idx}`}
                      className="transition-colors border-b last:border-b-0"
                    >
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.mashiniiDugaar || "-"}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.zogssonMinut}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.khungulsunMinut}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.tulbur > 0 ? `${formatNumber(row.tulbur)} ₮` : "-"}
                      </td>
                      <td className="p-3 text-center text-theme whitespace-nowrap">
                        {row.tuluv || "-"}
                      </td>
                    </tr>
                  ))
                )}
                {displayDetail && displayDetail.length > 0 && (
                  <tr className="border-t-2  bg-[color:var(--surface-hover)]/20">
                    <td className="p-3 text-center" colSpan={2}>
                      Нийт
                    </td>
                    <td className="p-3 text-center">
                      {displayDetail.reduce((s, r) => s + r.zogssonMinut, 0)}
                    </td>
                    <td className="p-3 text-center">
                      {displayDetail.reduce((s, r) => s + r.khungulsunMinut, 0)}
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(
                        displayDetail.reduce((s, r) => s + r.tulbur, 0)
                      )}{" "}
                      ₮
                    </td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "guestCarList" && (
        <div className="overflow-hidden rounded-2xl neu-table allow-overflow">
        <h3 className="p-4  text-theme border-b">
          Зочдын машины жагсаалт
        </h3>
        <div className="max-h-[30vh] overflow-y-auto custom-scrollbar">
          <table className="table-ui text-sm min-w-full">
            <thead>
              <tr>
                <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap w-12">
                  №
                </th>
                <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                  Машины дугаар
                </th>
                <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                  Оршин суугчийн нэр
                </th>
                <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                  Давхар
                </th>
                <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                  Тоот
                </th>
                <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                  Утасны дугаар
                </th>
              </tr>
            </thead>
            <tbody>
              {guestCarList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-theme/60"
                  >
                    Мэдээлэл алга байна
                  </td>
                </tr>
              ) : (
                guestCarList.map((row, idx) => (
                  <tr
                    key={`${row.mashiniiDugaar}-${idx}`}
                    className="transition-colors border-b last:border-b-0"
                  >
                    <td className="p-3 text-center text-theme whitespace-nowrap">
                      {idx + 1}
                    </td>
                    <td className="p-3 text-center text-theme whitespace-nowrap">
                      {row.mashiniiDugaar || "-"}
                    </td>
                    <td className="p-3 text-left text-theme whitespace-nowrap">
                      {row.orshinSuugchiinNer || "-"}
                    </td>
                    <td className="p-3 text-center text-theme whitespace-nowrap">
                      {row.davkhar || "-"}
                    </td>
                    <td className="p-3 text-center text-theme whitespace-nowrap">
                      {row.toot || "-"}
                    </td>
                    <td className="p-3 text-center text-theme whitespace-nowrap">
                      {row.utas || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}
