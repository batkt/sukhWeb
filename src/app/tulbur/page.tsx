"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee from "@/lib/uilchilgee";
import { message } from "antd";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import {
  Upload,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import GuilgeeTuukhPage from "./guilgeeTuukh/page";
import DansKhuulgaPage from "./dansKhuulga/page";
import TabButton from "components/tabButton/tabButton";
import { Modal as MModal } from "@mantine/core";
import formatNumber from "../../../tools/function/formatNumber";

export default function TulburPage() {
  const [active, setActive] = useState<"guilgee" | "dans">("guilgee");
  const [activeTab, setActiveTab] = useState<"guilgee" | "dansKhuulga">(
    "guilgee"
  );
  const [isZaaltDropdownOpen, setIsZaaltDropdownOpen] = useState(false);
  const zaaltButtonRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;

  // Electricity meter modal state
  const [isZaaltModalOpen, setIsZaaltModalOpen] = useState(false);
  const [zaaltData, setZaaltData] = useState<any[]>([]);
  const [isLoadingZaalt, setIsLoadingZaalt] = useState(false);

  const gereeTourSteps: DriverStep[] = useMemo(() => {
    if (activeTab === "guilgee") {
      return [
        {
          element: "#tab-guilgee",
          popover: {
            title: "Гүйлгээний түүх",
            description:
              "Эндээс гүйлгээний жагсаалтыг харах, нэхэмжлэх үүсгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#guilgee-date",
          popover: {
            title: "Огнооны шүүлтүүр",
            description: "Хугацааны интервал сонгож жагсаалтыг шүүнэ.",
          },
        },
        {
          element: "#guilgee-status-filter",
          popover: {
            title: "Төлөвийн шүүлтүүр",
            description:
              "Төлсөн, Төлөөгүй, Хугацаа хэтэрсэн зэрэг төлөвөөр ялгана.",
          },
        },
        {
          element: "#guilgee-nekhemjlekh-btn",
          popover: {
            title: "Нэхэмжлэх",
            description: "Нэхэмжлэхийн цонхыг нээж ажиллана.",
          },
        },
        {
          element: "#guilgee-excel-btn",
          popover: {
            title: "Excel татах",
            description: "Жагсаалтыг Excel файл болгон татах.",
          },
        },
        {
          element: "#guilgee-table",
          popover: {
            title: "Жагсаалт",
            description: "Гүйлгээний жагсаалт энд харагдана.",
          },
        },
        {
          element: "#guilgee-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжих.",
          },
        },
      ];
    } else if (activeTab === "dansKhuulga") {
      return [
        {
          element: "#tab-dansKhuulga",
          popover: {
            title: "Дансны хуулга",
            description:
              "Эндээс холбосон дансны гүйлгээний жагсаалтыг харах, И-баримт илгээх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#dans-date",
          popover: {
            title: "Огнооны шүүлтүүр",
            description: "Хугацааны интервал сонгож жагсаалтыг шүүнэ.",
          },
        },
        {
          element: "#dans-account",
          popover: {
            title: "Данс сонгох",
            description: "Данс сонгоход тухайн дансны гүйлгээ харагдана.",
          },
        },
        {
          element: "#ebarimt-btn",
          popover: {
            title: "И-баримт",
            description: "Энд дарж И-баримтын цонх нээнэ.",
          },
        },
        {
          element: "#dans-excel-btn",
          popover: {
            title: "Excel татах",
            description: "Жагсаалтыг Excel файл болгон татах.",
          },
        },
        {
          element: "#dans-table",
          popover: {
            title: "Жагсаалт",
            description: "Сонгосон дансны гүйлгээ энд харагдана.",
          },
        },
        {
          element: "#dans-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжих.",
          },
        },
      ];
    }
    return [];
  }, [activeTab]);

  useRegisterTourSteps("/tulbur", gereeTourSteps);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        zaaltButtonRef.current &&
        !zaaltButtonRef.current.contains(event.target as Node)
      ) {
        setIsZaaltDropdownOpen(false);
      }
    };

    if (isZaaltDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isZaaltDropdownOpen]);

  // Excel Import handler
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      ".xlsx",
      ".xls",
    ];
    const isValidType =
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isValidType) {
      message.error("Зөвхөн Excel файл (.xlsx, .xls) оруулна уу");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const form = new FormData();
      form.append("excelFile", file);
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      if (effectiveBarilgiinId) {
        form.append("barilgiinId", effectiveBarilgiinId);
      }

      // Determine endpoint based on active tab
      const endpoint =
        activeTab === "guilgee"
          ? "/guilgeeniiTuukhExcelImport"
          : "/bankniiGuilgeeExcelImport";

      message.loading({
        content: "Excel импорт хийж байна…",
        key: "import",
        duration: 0,
      });

      const resp: any = await uilchilgee(token).post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy("import");

      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        const detailLines = failed.map(
          (f: any) => `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`
        );
        const details = detailLines.join("\n");
        const topMsg =
          data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        message.success("Excel импорт амжилттай");
        // Refresh the page data by reloading
        window.location.reload();
      }
    } catch (err: any) {
      message.destroy("import");
      const errorMsg = getErrorMessage(err);
      openErrorOverlay(errorMsg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Excel Export handler
  const handleExcelExport = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const body = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: effectiveBarilgiinId || null,
        filters: {},
        fileName: undefined as string | undefined,
      };

      // Determine endpoint based on active tab
      const path =
        activeTab === "guilgee"
          ? "/guilgeeniiTuukhExcelDownload"
          : "/bankniiGuilgeeExcelDownload";

      const hide = message.loading({
        content: "Excel бэлдэж байна…",
        duration: 0,
      });

      let resp: any;
      try {
        resp = await uilchilgee(token).post(path, body, {
          responseType: "blob" as any,
        });
      } catch (err: any) {
        if (err?.response?.status === 404 && typeof window !== "undefined") {
          resp = await uilchilgee(token).post(
            `${window.location.origin}${path}`,
            body,
            { responseType: "blob" as any, baseURL: undefined as any }
          );
        } else {
          throw err;
        }
      }
      hide();

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const cd = (resp.headers?.["content-disposition"] ||
        resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename =
        activeTab === "guilgee" ? "guilgee_tuukh.xlsx" : "bank_guilgee.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1]
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success("Excel татагдлаа");
      setIsZaaltDropdownOpen(false);
    } catch (e) {
      console.error(e);
      message.error("Excel татахад алдаа гарлаа");
    }
  };

  // Fetch electricity meter data
  const fetchZaaltData = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      setIsLoadingZaalt(true);
      setIsZaaltModalOpen(true);

      const response = await uilchilgee(token).post("/zaaltExcelDataAvya", {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: effectiveBarilgiinId,
      });

      // Handle different response structures
      const data = response.data;
      if (Array.isArray(data)) {
        setZaaltData(data);
      } else if (data && Array.isArray(data.data)) {
        setZaaltData(data.data);
      } else if (data && Array.isArray(data.result)) {
        setZaaltData(data.result);
      } else {
        console.log("Response structure:", data);
        setZaaltData([]);
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      openErrorOverlay(errorMsg);
      setIsZaaltModalOpen(false);
    } finally {
      setIsLoadingZaalt(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="rounded-2xl p-4 table-surface">
        <div className="flex items-center justify-between gap-3 flex-wrap px-1 mb-4">
          <div className="flex items-center gap-3">
            {active === "guilgee" ? (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-theme bg-clip-text text-transparent drop-shadow-sm"
                >
                  Гүйлгээний түүх
                </motion.h1>
                <div
                  style={{ width: 44, height: 44 }}
                  className="flex items-center"
                >
                  <DotLottieReact
                    src="https://lottie.host/740ab27b-f4f0-49c5-a202-a23a70cd8e50/eNy8Ct6t4y.lottie"
                    loop
                    autoplay
                    style={{ width: 44, height: 44 }}
                  />
                </div>
              </>
            ) : (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-theme bg-clip-text text-transparent drop-shadow-sm"
                >
                  Дансны хуулга
                </motion.h1>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <div ref={zaaltButtonRef} className="relative">
              {isZaaltDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsZaaltDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Excel импорт</span>
                  </button>
                  <button
                    onClick={handleExcelExport}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel татах</span>
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleExcelImport}
              className="hidden"
            />
            <TabButton
              id="tab-guilgee"
              active={active === "guilgee"}
              onClick={() => {
                setActive("guilgee");
                setActiveTab("guilgee");
              }}
            >
              Гүйлгээний түүх
            </TabButton>
            <TabButton
              id="tab-dansKhuulga"
              active={active === "dans"}
              onClick={() => {
                setActive("dans");
                setActiveTab("dansKhuulga");
              }}
            >
              Дансны хуулга
            </TabButton>
          </div>
        </div>

        <div className="w-full">
          {active === "guilgee" ? <GuilgeeTuukhPage /> : <DansKhuulgaPage />}
        </div>
      </div>

      {/* Electricity Meter Modal */}
      <MModal
        opened={isZaaltModalOpen}
        onClose={() => setIsZaaltModalOpen(false)}
        title="Цахилгаан заалт"
        size={zaaltData.length > 0 ? "xl" : "md"}
        centered
        classNames={{
          title: "text-xl font-bold text-theme",
        }}
      >
        {isLoadingZaalt ? (
          <div className="flex justify-center items-center p-10 ">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : zaaltData.length === 0 ? (
          <div className="text-center p-10 text-gray-500">
            Цахилгааны заалтын мэдээлэл олдсонгүй
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left">Гэрээний дугаар</th>
                  <th className="px-3 py-2 text-left">Тоот</th>
                  <th className="px-3 py-2 text-right">Өмнө</th>
                  <th className="px-3 py-2 text-right">Өдөр</th>
                  <th className="px-3 py-2 text-right">Шөнө</th>
                  <th className="px-3 py-2 text-right">Нийт (одоо)</th>
                  <th className="px-3 py-2 text-right">Зөрүү</th>
                  <th className="px-3 py-2 text-right">Тариф (кВт)</th>
                  <th className="px-3 py-2 text-right">Default дүн</th>
                  <th className="px-3 py-2 text-right">Төлбөр</th>
                  <th className="px-3 py-2 text-left">Тооцоолсон огноо</th>
                </tr>
              </thead>
              <tbody>
                {zaaltData.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2">{item.gereeniinDugaar || "-"}</td>
                    <td className="px-3 py-2">{item.toot || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(item.umnukhZaalt || 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(item.zaaltTog || 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(item.zaaltUs || 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(item.suuliinZaalt || 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(
                        (item.suuliinZaalt || 0) - (item.umnukhZaalt || 0)
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(item.tariff || 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(item.defaultDun || 0)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatNumber(item.zaaltDun || 0)} ₮
                    </td>
                    <td className="px-3 py-2">
                      {item.tootsoosonOgnoo
                        ? new Date(item.tootsoosonOgnoo).toLocaleString("mn-MN")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MModal>
    </div>
  );
}
