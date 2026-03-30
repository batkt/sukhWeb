"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table } from "antd";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import uilchilgee from "@/lib/uilchilgee";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import formatNumber from "../../../../tools/function/formatNumber";
import { FileSpreadsheet, Printer, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { getDefaultDateRange } from "@/lib/utils";
import { useSearch } from "@/context/SearchContext";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4 landscape;
        margin: 1cm;
      }
      body * {
        visibility: hidden !important;
      }
      .print-container,
      .print-container * {
        visibility: visible !important;
      }
      .print-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th,
      td {
        border: 1px solid #ddd !important;
        padding: 4px !important;
        font-size: 8pt !important;
      }
      .max-h-[30vh] {
        max-height: none !important;
        overflow: visible !important;
      }
      .custom-scrollbar {
        overflow: visible !important;
      }
    }
  `}</style>
);

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
    ajiltan?.baiguullagiinId || null,
  );
  const { searchTerm } = useSearch();
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);
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
  const [activeTab, setActiveTab] = useState<
    "residentSummary" | "guestDetail" | "guestCarList"
  >("residentSummary");
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newToot, setNewToot] = useState("");

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
            orshinSuugch: filters.orshinSuugch || searchTerm || undefined,
            toot: filters.toot || undefined,
          },
        );
        setApiResponse(response.data);
        setSelectedResidentId(null);
        setActiveTab("residentSummary");
      } catch (err: any) {
        setError(
          err?.response?.data?.aldaa ||
            err?.response?.data?.message ||
            err.message ||
            "Алдаа гарлаа",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBuildingId, baiguullaga, token, dateRange, filters, searchTerm]);

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
        prev ? { ...prev, selectedDetail: null } : null,
      );
      return;
    }
    setSelectedResidentId(orshinSuugchiinId);
    const resident = residentSummary.find(
      (r) => r.orshinSuugchiinId === orshinSuugchiinId,
    );
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
        },
      );
      setApiResponse((prev) =>
        prev
          ? { ...prev, selectedDetail: response.data?.selectedDetail || null }
          : null,
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
    (r) => r.orshinSuugchiinId === selectedResidentId,
  );

  const exportToExcel = () => {
    let headers: string[] = [];
    let dataToExport: any[] = [];
    let fileName = "";

    if (activeTab === "residentSummary") {
      headers = [
        "№",
        "Нэр",
        "Тоот",
        "Урьсан машин тоо",
        "Нийт төлөх",
        "Хөнгөлөлт Минут",
        "Төлсөн дүн",
        "Үлдэгдэл төлбөр",
      ];
      dataToExport = residentSummary.map((row, idx) => [
        idx + 1,
        `"${row.ner || ""}"`,
        `"${row.toot || ""}"`,
        row.urisanMachinToo,
        row.niitTulbur,
        row.khungulultMinut,
        row.tulsunDun,
        row.uldegdelTulbur,
      ]);
      fileName = "resident_parking_summary";
    } else if (activeTab === "guestDetail") {
      headers = [
        "№",
        "Машины дугаар",
        "Зогссон минут",
        "Хөнгөлсөн минут",
        "Төлбөр",
        "Төлөв",
      ];
      dataToExport = (displayDetail || []).map((row, idx) => [
        idx + 1,
        `"${row.mashiniiDugaar || ""}"`,
        row.zogssonMinut,
        row.khungulsunMinut,
        row.tulbur,
        `"${row.tuluv || ""}"`,
      ]);
      fileName = "guest_parking_detail";
    } else {
      headers = [
        "№",
        "Машины дугаар",
        "Оршин суугчийн нэр",
        "Давхар",
        "Тоот",
        "Утасны дугаар",
      ];
      dataToExport = guestCarList.map((row, idx) => [
        idx + 1,
        `"${row.mashiniiDugaar || ""}"`,
        `"${row.orshinSuugchiinNer || ""}"`,
        `"${row.davkhar || ""}"`,
        `"${row.toot || ""}"`,
        `"${row.utas || ""}"`,
      ]);
      fileName = "guest_car_list";
    }

    const csvContent = [
      headers.join(","),
      ...dataToExport.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${fileName}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Define columns for Ant Design Tables
  const residentSummaryColumns = useMemo(
    () => [
      {
        title: "№",
        dataIndex: "index",
        key: "index",
        width: 50,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        align: "center" as const,
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
      {
        title: "Урьсан машин тоо",
        dataIndex: "urisanMachinToo",
        key: "urisanMachinToo",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{val}</span>
        ),
      },
      {
        title: "Нийт төлөх",
        dataIndex: "niitTulbur",
        key: "niitTulbur",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap text-[13px]">
            {formatNumber(val)}
          </span>
        ),
      },
      {
        title: "Хөнгөлөлт Минут",
        dataIndex: "khungulultMinut",
        key: "khungulultMinut",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{val || "-"}</span>
        ),
      },
      {
        title: "Төлсөн дүн",
        dataIndex: "tulsunDun",
        key: "tulsunDun",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap text-[13px]">
            {formatNumber(val)}
          </span>
        ),
      },
      {
        title: "Үлдэгдэл төлбөр",
        dataIndex: "uldegdelTulbur",
        key: "uldegdelTulbur",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap">
            {formatNumber(val)}
          </span>
        ),
      },
    ],
    [],
  );

  const guestDetailColumns = useMemo(
    () => [
      {
        title: "№",
        dataIndex: "index",
        key: "index",
        width: 50,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Машины дугаар",
        dataIndex: "mashiniiDugaar",
        key: "mashiniiDugaar",
        align: "center" as const,
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
      {
        title: "Зогссон минут",
        dataIndex: "zogssonMinut",
        key: "zogssonMinut",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{val}</span>
        ),
      },
      {
        title: "Хөнгөлсөн минут",
        dataIndex: "khungulsunMinut",
        key: "khungulsunMinut",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{val}</span>
        ),
      },
      {
        title: "Төлбөр",
        dataIndex: "tulbur",
        key: "tulbur",
        align: "center" as const,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap text-[13px]">
            {val > 0 ? formatNumber(val) : "-"}
          </span>
        ),
      },
      {
        title: "Төлөв",
        dataIndex: "tuluv",
        key: "tuluv",
        align: "center" as const,
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
    ],
    [],
  );

  const guestCarListColumns = useMemo(
    () => [
      {
        title: "№",
        dataIndex: "index",
        key: "index",
        width: 50,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Машины дугаар",
        dataIndex: "mashiniiDugaar",
        key: "mashiniiDugaar",
        align: "center" as const,
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
      {
        title: "Оршин суугчийн нэр",
        dataIndex: "orshinSuugchiinNer",
        key: "orshinSuugchiinNer",
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        key: "davkhar",
        align: "center" as const,
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        align: "center" as const,
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
      {
        title: "Утасны дугаар",
        dataIndex: "utas",
        key: "utas",
        align: "center" as const,
        render: (text: string) => (
          <span className="text-theme whitespace-nowrap text-[13px]">{text || "-"}</span>
        ),
      },
    ],
    [],
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
    <div className="p-6 print-container h-full flex flex-col">
      <PrintStyles />
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold">Зогсоолын тайлан</h1>
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Тоот нэмэх
          </Button>
          <button
            onClick={exportToExcel}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel татах
          </button>
          {/* <button
            onClick={handlePrint}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Хэвлэх
          </button> */}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 no-print">
        <div className="btn-minimal h-[40px] w-full md:w-[320px] flex items-center px-3">
          <StandardDatePicker
            isRange={true}
            value={dateRange}
            onChange={setDateRange}
            allowClear
            placeholder="Огноо сонгох"
            className="!h-full !w-full text-theme !px-0 flex items-center justify-center text-center border-0 shadow-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 no-print">
       
        <div className="p-3 w-30 rounded-xl">
          <label className="block text-sm w-8 text-theme/80 mb-1.5">Тоот</label>
          <input
            type="text"
            value={filters.toot}
            onChange={(e) =>
              setFilters((p) => ({ ...p, toot: e.target.value }))
            }
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 no-print">
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
          <h3 className="p-4 text-theme border-b">
            Оршин суугчдын урьсан зочдын машин бүртгэлийн тайлан
          </h3>
          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar p-4">
            <Table
              dataSource={residentSummary}
              columns={residentSummaryColumns}
              rowKey="orshinSuugchiinId"
              pagination={false}
              size="small"
              bordered
              className="guilgee-table"
              scroll={{ x: "max-content", y: 240 }}
              locale={{ emptyText: "Мэдээлэл алга байна" }}
              onRow={(record) => ({
                onClick: () => {
                  handleResidentClick(record.orshinSuugchiinId);
                  setActiveTab("guestDetail");
                },
                className: `cursor-pointer hover:bg-[color:var(--surface-hover)]/30 ${
                  selectedResidentId === record.orshinSuugchiinId
                    ? "bg-[color:var(--surface-hover)]/50"
                    : ""
                }`,
              })}
              summary={() =>
                residentSummary.length > 0 ? (
                  <Table.Summary.Row className="bg-theme/5">
                    <Table.Summary.Cell index={0} colSpan={3} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      <strong>Нийт</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {niit.urisanMachinToo}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {formatNumber(niit.niitTulbur)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {niit.khungulultMinut || "-"}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {formatNumber(niit.tulsunDun)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {formatNumber(niit.uldegdelTulbur)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ) : null
              }
            />
          </div>
        </div>
      )}

      {activeTab === "guestDetail" && (
        <div className="overflow-hidden rounded-2xl neu-table allow-overflow">
          <h3 className="p-4 text-theme border-b">
            Зочдын дэлгэрэнгүй тайлан
            {selectedResident && (
              <span className="ml-2 text-sm font-normal text-theme/70">
                — Нэр: {selectedResident.ner} | Тоот: {selectedResident.toot}
              </span>
            )}
          </h3>
          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar p-4">
            <Table
              dataSource={displayDetail || []}
              columns={guestDetailColumns}
              // rowKey={(record) =>
              //   `${record.mashiniiDugaar}-${record._id || Math.random().toString()}`
              // }
              pagination={false}
              size="small"
              bordered
              className="guilgee-table"
              scroll={{ x: "max-content", y: 240 }}
              loading={detailLoading}
              locale={{
                emptyText: selectedResidentId
                  ? "Дэлгэрэнгүй мэдээлэл алга"
                  : "Эхний таб дээр оршин суугч сонгоно уу",
              }}
              summary={() =>
                displayDetail && displayDetail.length > 0 ? (
                  <Table.Summary.Row className="bg-theme/5">
                    <Table.Summary.Cell index={0} colSpan={2} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      <strong>Нийт</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {displayDetail.reduce((s, r) => s + r.zogssonMinut, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {displayDetail.reduce((s, r) => s + r.khungulsunMinut, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      {formatNumber(
                        displayDetail.reduce((s, r) => s + r.tulbur, 0),
                      )}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="center" className="text-[13px] font-bold dark:!text-white force-bold text-theme">
                      -
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ) : null
              }
            />
          </div>
        </div>
      )}

      {activeTab === "guestCarList" && (
        <div className="overflow-hidden rounded-2xl neu-table allow-overflow">
          <h3 className="p-4 text-theme border-b">Зочдын машины жагсаалт</h3>
          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar p-4">
            <Table
              dataSource={guestCarList}
              columns={guestCarListColumns}
              // rowKey={(record) =>
              //   `${record.mashiniiDugaar}-${record._id || Math.random().toString()}`
              // }
              pagination={false}
              size="small"
              bordered
              className="guilgee-table"
              scroll={{ x: "max-content", y: 240 }}
              locale={{ emptyText: "Мэдээлэл алга байна" }}
            />
          </div>
        </div>
      )}

      {/* Modal for adding new room */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Тоот нэмэх
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              1-р давхарт шинэ тоот нэмнэ үү.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Тоот
              </label>
              <input
                type="text"
                value={newToot}
                onChange={(e) => setNewToot(e.target.value)}
                placeholder="1-9 гэх мэтээр оруулна уу"
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="back"
                size="md"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewToot("");
                }}
              >
                Хаах
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  // TODO: Add API call to save the new room
                  console.log("Adding new room:", newToot);
                  setIsModalOpen(false);
                  setNewToot("");
                }}
              >
                Нэмэх
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
