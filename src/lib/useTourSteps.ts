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
          element: "#resident-new-btn-top, #resident-new-btn",
          popover: {
            title: "Оршин суугч бүртгэх",
            description: "Шинэ оршин суугч гараас бүртгэх товч. Дараад шаардлагатай мэдээллээ бөглөнө.",
            side: "bottom",
          },
        },
        {
          element: "#resident-excel-btn-top, #resident-excel-btn",
          popover: {
            title: "Excel үйлдлүүд",
            description: "Энд дарж Excel-ээр өгөгдөл татах, оруулах цэсийг нээнэ.",
            side: "bottom",
          },
        },
        {
          element: "#resident-download-list-btn-top, #resident-download-list-btn",
          popover: {
            title: "Жагсаалт татах",
            description: "Оршин суугчдын жагсаалтыг Excel файлаар татаж авна.",
            side: "bottom",
          },
        },
        {
          element: "#resident-download-template-btn, #resident-download-template-btn-top",
          popover: {
            title: "Загвар татах",
            description: "Excel загвар файлыг татаж авч, өгөгдлөө бэлтгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#resident-upload-template-btn, #resident-upload-template-btn-top",
          popover: {
            title: "Загвар оруулах",
            description: "Бэлтгэсэн Excel файлаа эндээс системд оруулна.",
            side: "bottom",
          },
        },
        {
          element: "#residents-table",
          popover: {
            title: "Оршин суугчдын жагсаалт",
            description: "Бүх оршин суугчдын мэдээлэл энд жагсаалт хэлбэрээр харагдана.",
            side: "top",
          },
        },
        {
          element: "#resident-edit-btn",
          popover: {
            title: "Мэдээлэл засах",
            description: "Сонгосон оршин суугчийн мэдээллийг эндээс засаж шинэчилнэ.",
            side: "top",
          },
        },
        {
          element: "#resident-delete-btn",
          popover: {
            title: "Устгах",
            description: "Шаардлагагүй болсон оршин суугчийн бүртгэлийг эндээс устгана.",
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
    } else if (activeTab === "units") {
      return [
        {
          element: "#tab-units",
          popover: {
            title: "Тоот бүртгэл",
            description: "Барилгын давхар болон тоотуудыг эндээс удирдана.",
            side: "bottom",
          },
        },
        {
          element: "#units-download-template-btn-top, #mobile-units-download-template-btn",
          popover: {
            title: "Загвар татах",
            description: "Тоот бүртгэлийн Excel загвар файлыг татаж авна.",
            side: "bottom",
          },
        },
        {
          element: "#units-upload-template-btn-top, #mobile-units-upload-template-btn",
          popover: {
            title: "Загвар оруулах",
            description: "Бэлтгэсэн тоот бүртгэлийн Excel файлаа эндээс системд оруулна.",
            side: "bottom",
          },
        },
        {
          element: "#units-table",
          popover: {
            title: "Тоотуудын жагсаалт",
            description: "Давхар тус бүрийн тоотууд болон тэдгээрийн төлөв энд харагдана.",
            side: "top",
          },
        },
        {
          element: "#units-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "ebarimt") {
      return [
        {
          element: "#ebarimt-date",
          popover: {
            title: "Огнооны шүүлтүүр",
            description: "И-баримтын жагсаалтыг хугацаагаар шүүж харна.",
            side: "bottom",
          },
        },
        {
          element: "#ebarimt-excel-btn",
          popover: {
            title: "Excel татах",
            description: "Шүүсэн жагсаалтыг Excel файл болгон татаж авна.",
            side: "bottom",
          },
        },
        {
          element: "#ebarimt-table",
          popover: {
            title: "Баримтын жагсаалт",
            description: "Бүх И-баримтын төлөв, дүн болон бусад мэдээлэл энд харагдана.",
            side: "top",
          },
        },
        {
          element: "#ebarimt-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "notifications") {
      return [
        {
          element: "#medegdel-tab-switch",
          popover: {
            title: "Төрөл сонгох",
            description: "Эндээс Мэдэгдэл илгээх эсвэл Нийтлэл оруулах хэсэг рүү шилжинэ.",
            side: "bottom",
          },
        },
        {
          element: "#medegdel-channels",
          popover: {
            title: "Суваг сонгох",
            description: "Мэдэгдлийг App, Мессеж эсвэл Имэйл сувгаар илгээх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#medegdel-templates",
          popover: {
            title: "Загварууд",
            description: "Байнга ашигладаг мэдэгдлийн загваруудаа эндээс сонгох эсвэл шинээр нэмэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#medegdel-contacts-section",
          popover: {
            title: "Харилцагчид",
            description: "Мэдэгдэл илгээх хүмүүсээ эндээс сонгоно. Хайлт хийх эсвэл бүгдийг нэг дор сонгож болно.",
            side: "bottom",
          },
        },
        {
          element: "#medegdel-composer-section",
          popover: {
            title: "Мэдэгдэл бичих",
            description: "Сонгосон хүмүүстээ илгээх гарчиг болон агуулгаа энд бичнэ. Мөн зураг хавсаргаж болно.",
            side: "left",
          },
        },
        {
          element: "#medegdel-new-btn",
          popover: {
            title: "Илгээх",
            description: "Бүх мэдээллээ шалгаад 'Илгээх' товчийг дарснаар мэдэгдэл сонгогдсон хүмүүст хүрнэ.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "feedback") {
      return [
        {
          element: "#feedback-stats",
          popover: {
            title: "Тоон үзүүлэлтүүд",
            description: "Ирсэн санал гомдлын нийт тоо, шийдвэрлэлтийн явцыг эндээс нэг дороос харна. Дээр нь дарж шууд шүүж болно.",
            side: "bottom",
          },
        },
        {
          element: "#feedback-search",
          popover: {
            title: "Хайлт",
            description: "Тодорхой нэг санал гомдлыг гарчгаар нь эндээс хайж олно.",
            side: "bottom",
          },
        },
        {
          element: "#feedback-filters",
          popover: {
            title: "Шүүлтүүрүүд",
            description: "Төрөл (Санал/Гомдол) болон төлөвөөр (Шийдэгдсэн/Хүлээгдэж буй) нарийвчлан шүүнэ.",
            side: "bottom",
          },
        },
        {
          element: "#sanal-list",
          popover: {
            title: "Жагсаалт",
            description: "Хэрэглэгчдээс ирсэн бүх хүсэлтүүд энд харагдана. Дээр нь дарж дэлгэрэнгүйг үзээрэй.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "niitlel") {
      return [
        {
          element: "#medegdel-tab-switch",
          popover: {
            title: "Төрөл сонгох",
            description: "Эндээс Мэдэгдэл илгээх эсвэл Нийтлэл оруулах хэсэг рүү шилжинэ.",
            side: "bottom",
          },
        },
        {
          element: "#niitlel-search",
          popover: {
            title: "Нийтлэл хайх",
            description: "Гарчиг эсвэл агуулгаар нь нийтлэлүүдийг хайж олох боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#niitlel-new-btn",
          popover: {
            title: "Шинэ нийтлэл",
            description: "Шинэ мэдээ, нийтлэл оруулах товч. Зураг болон агуулгаа эндээс бэлтгэнэ.",
            side: "left",
          },
        },
        {
          element: "#niitlel-list",
          popover: {
            title: "Нийтлэлийн жагсаалт",
            description: "Бүх нийтлэгдсэн мэдээ, мэдээллүүд энд жагсаалт хэлбэрээр харагдана.",
            side: "top",
          },
        },
        {
          element: "#niitlel-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Нийтлэлүүд олон болсон тохиолдолд эндээс хуудсаа сольж харна.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "dashboard") {
      return [
        {
          element: "#khynalt-date",
          popover: {
            title: "Огнооны шүүлтүүр",
            description: "Хяналтын самбарын өгөгдлийг сонгосон хугацааны интервалаар шүүж харуулна.",
            side: "bottom",
          },
        },
        {
          element: "#khynalt-stats",
          popover: {
            title: "Үндсэн үзүүлэлтүүд",
            description: "Байгууллагын санхүүгийн болон үйл ажиллагааны гол тоон үзүүлэлтүүдийг эндээс шууд харах боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#khynalt-income-chart",
          popover: {
            title: "Орлогын график",
            description: "Сонгосон хугацаан дахь орлогын өөрчлөлтийг шугаман графикаар харуулна.",
            side: "top",
          },
        },
        {
          element: "#khynalt-receivable-chart",
          popover: {
            title: "Авлага ба Гүйцэтгэл",
            description: "Нийт нэхэмжилсэн дүн болон төлөгдөөгүй үлдэгдлийн харьцааг графикаар шинжилнэ.",
            side: "top",
          },
        },
        {
          element: "#khynalt-summary-chart",
          popover: {
            title: "Төлбөрийн хураангуй",
            description: "Төлбөрийн нийт явц болон төлөвүүдийг нэгтгэн харуулсан диаграмм.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "barilga") {
      return [
        {
          element: "#barilga-list",
          popover: {
            title: "Барилгын жагсаалт",
            description: "Бүртгэлтэй бүх барилгуудын жагсаалт энд харагдана.",
            side: "bottom",
          },
        },
        {
          element: "#barilga-add-btn",
          popover: {
            title: "Барилга нэмэх",
            description: "Шинэ барилга бүртгэхдээ энэ товчийг ашиглана уу.",
            side: "left",
          },
        },
        {
          element: "#barilgiin-edit-name",
          popover: {
            title: "Барилгын нэр",
            description: "Барилгын нэрийг эндээс өөрчлөх боломжтой.",
            side: "bottom",
          },
        },
      ];
    } else if (activeTab === "settings") {
      return [
        {
          element: "#settings-tabs",
          popover: {
            title: "Тохиргооны цэс",
            description: "Системийн өөр өөр хэсгүүдийг эндээс сонгож тохируулна.",
            side: "bottom",
          },
        },
        {
          element: "#settings-save-btn",
          popover: {
            title: "Хадгалах",
            description: "Өөрчлөлтүүдээ оруулсны дараа заавал хадгалаарай.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "reports") {
      return [
        {
          element: "#tailan-tabs",
          popover: {
            title: "Тайлангийн төрлүүд",
            description: "Эндээс орлого, авлага, гүйцэтгэлийн төрөл бүрийн тайлангуудыг сонгож үзнэ.",
            side: "bottom",
          },
        },
        {
          element: "#tailan-negtgel",
          popover: {
            title: "Нэгтгэл тайлан",
            description: "Бүх барилга, салбарын нэгдсэн үзүүлэлтүүдийг эндээс харна.",
            side: "right",
          },
        },
        {
          element: "#tailan-avlaga",
          popover: {
            title: "Авлага ба Орлого",
            description: "Сонгосон хугацаан дахь нийт авлага болон бодит орлогын тайлан.",
            side: "right",
          },
        },
        {
          element: "#tailan-filter",
          popover: {
            title: "Шүүлтүүр",
            description: "Тайланг огноо, барилга, төлөвөөр нарийвчлан шүүх хэсэг.",
            side: "bottom",
          },
        },
        {
          element: "#tailan-excel",
          popover: {
            title: "Excel татах",
            description: "Тайланг Excel файл болгон татаж аваад дүн шинжилгээ хийх боломжтой.",
            side: "left",
          },
        },
      ];
    }
    return [];
  }, [activeTab]);
}