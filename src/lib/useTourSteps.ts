import { useMemo } from "react";
import type { DriverStep } from "@/context/TourContext";

export function useTourSteps(activeTab: string): DriverStep[] {
  return useMemo(() => {
    if (activeTab === "contracts") {
      return [
        {
          element: "#tab-contracts",
          popover: {
            title: "Гэрээний хэсэг",
            description: "Эндээс гэрээний жагсаалтыг харах, шүүх болон шинэ гэрээ үүсгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#geree-new-btn",
          popover: {
            title: "Шинэ гэрээ",
            description: "Шинэ гэрээ үүсгэх товч. Дараад шаардлагатай мэдээллээ бөглөнө.",
            side: "bottom",
          },
        },
        {
          element: "#geree-templates-btn",
          popover: {
            title: "Гэрээний загвар",
            description: "Гэрээний загваруудыг харах, сонгох боломжтой хэсэг.",
            side: "bottom",
          },
        },
        {
          element: "#geree-download-template-btn",
          popover: {
            title: "Загвар татах",
            description: "Excel загвар файлыг татаж авч, өгөгдлөө бэлтгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#geree-columns-btn",
          popover: {
            title: "Багана сонгох",
            description: "Жагсаалтын багануудыг эндээс тохируулж болно.",
            side: "left",
          },
        },
        {
          element: "#geree-table",
          popover: {
            title: "Гэрээний жагсаалт",
            description: "Тохируулсан багануудтай хамт гэрээний жагсаалт энд харагдана. Үйлдлээс засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#geree-edit-btn",
          popover: {
            title: "Гэрээний засвар",
            description: "Жагсаалтан дахь мэдээллийг энд засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#geree-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "residents") {
      return [
        {
          element: "#tab-residents",
          popover: {
            title: "Оршин суугчдын хэсэг",
            description: "Эндээс оршин суугчдын жагсаалтыг харах боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#resident-new-btn",
          popover: {
            title: "Оршин суугч бүртгэх",
            description: "Шинэ оршин суугч гараас бүртгэх товч. Дараад шаардлагатай мэдээллээ бөглөнө.",
            side: "bottom",
          },
        },
        {
          element: "#resident-download-list-btn",
          popover: {
            title: "Оршин суугчдын жагсаалтыг татах",
            description: "Оршин суугчдын жагсаалтыг Excel файлын хэлбэрээр татаж авах товч.",
            side: "bottom",
          },
        },
        {
          element: "#resident-download-template-btn",
          popover: {
            title: "Загвар татах",
            description: "Excel загвар файлыг татаж авч, өгөгдлөө бэлтгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#resident-upload-template-btn",
          popover: {
            title: "Загвар оруулах",
            description: "Excel загвар файлыг оруулж, өгөгдлөө бэлтгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#resident-table",
          popover: {
            title: "Оршин суугчдын жагсаалт",
            description: "Оршин суугчдын жагсаалт энд харагдана. Үйлдлээс засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#resident-edit-btn",
          popover: {
            title: "Оршин суугчийн мэдээлэл засах",
            description: "Жагсаалтан дахь мэдээллийг энд засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#resident-delete-btn",
          popover: {
            title: "Оршин суугч устгах",
            description: "Жагсаалтан дахь мэдээллийг энд устгах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#resident-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "employees") {
      return [
        {
          element: "#tab-employees",
          popover: {
            title: "Ажилчдын хэсэг",
            description: "Эндээс ажилтнуудын жагсаалтыг харах боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#employees-new-btn",
          popover: {
            title: "Ажилтан бүртгэх",
            description: "Шинэ ажилтан бүртгэх товч. Дараад шаардлагатай мэдээллээ бөглөнө.",
            side: "bottom",
          },
        },
        {
          element: "#employees-table",
          popover: {
            title: "Ажилтнуудын жагсаалт",
            description: "Ажилтнуудын жагсаалт энд харагдана. Үйлдлээс засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#employees-edit-btn",
          popover: {
            title: "Ажилтны мэдээлэл засах",
            description: "Жагсаалтан дахь мэдээллийг энд засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#employees-delete-btn",
          popover: {
            title: "Ажилтны мэдээлэл устгах",
            description: "Жагсаалтан дахь мэдээллийг энд устгах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#employees-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    }
    return [];
  }, [activeTab]);
}