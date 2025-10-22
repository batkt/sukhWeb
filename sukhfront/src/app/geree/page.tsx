"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Search,
  Filter,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import formatNumberNershil from "../../../tools/function/formatNumberNershil";
import { ModalPortal } from "../../../components/golContent";
import { DownloadOutlined } from "@ant-design/icons";
import { createPortal } from "react-dom";
import {
  useGereeJagsaalt,
  useGereeCRUD,
  Geree as GereeType,
} from "@/lib/useGeree";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "../../../lib/uilchilgee";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import { notification } from "antd";

export const ALL_COLUMNS = [
  { key: "ovog", label: "Овог", default: true },
  { key: "ner", label: "Нэр", default: true },
  { key: "register", label: "Регистр", default: true },
  { key: "utas", label: "Утас", default: true },
  { key: "mail", label: "И-мэйл", default: false },
  { key: "aimag", label: "Аймаг", default: false },
  { key: "duureg", label: "Дүүрэг", default: false },
  { key: "horoo", label: "Хороо", default: false },
  { key: "baingiinKhayag", label: "Байнгын хаяг", default: false },
  { key: "gereeniiDugaar", label: "Гэрээний дугаар", default: false },
  { key: "gereeniiOgnoo", label: "Гэрээний огноо", default: false },
  { key: "turul", label: "Төрөл", default: false },
  { key: "ekhlekhOgnoo", label: "Эхлэх огноо", default: false },
  { key: "duusakhOgnoo", label: "Дуусах огноо", default: false },
  { key: "tulukhOgnoo", label: "Төлөх огноо", default: false },
  { key: "khugatsaa", label: "Хугацаа (сар)", default: false },
  { key: "suhNer", label: "СӨХ-ийн нэр", default: false },
  { key: "suhRegister", label: "СӨХ-ийн регистр", default: false },
  { key: "suhUtas", label: "СӨХ-ийн утас", default: false },
  { key: "suhMail", label: "СӨХ-ийн и-мэйл", default: false },
  { key: "suhTulbur", label: "СӨХ төлбөр", default: false },
  { key: "uilchilgeeniiZardal", label: "Үйлчилгээний зардал", default: false },
  { key: "niitTulbur", label: "Нийт төлбөр", default: false },
  { key: "bairNer", label: "Байрны нэр", default: false },
  { key: "orts", label: "Орц", default: false },
  { key: "toot", label: "Тоот", default: false },
  { key: "davkhar", label: "Давхар", default: false },
  { key: "temdeglel", label: "Тэмдэглэл", default: false },
];

export default function Geree() {
  const DEFAULT_HIDDEN = ["mail", "aimag", "duureg", "horoo"];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showList2Modal, setShowList2Modal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter(
      (col) => col.default && !DEFAULT_HIDDEN.includes(col.key)
    ).map((col) => col.key)
  );
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Бүгд");
  const [editingContract, setEditingContract] = useState<GereeType | null>(
    null
  );
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const mongoliaProvinces = [
    "Улаанбаатар",
    "Архангай",
    "Баян-Өлгий",
    "Баянхонгор",
    "Булган",
    "Говь-Алтай",
    "Говьсүмбэр",
    "Дархан-Уул",
    "Дорноговь",
    "Дорнод",
    "Дундговь",
    "Завхан",
    "Өвөрхангай",
    "Өмнөговь",
    "Сүхбаатар",
    "Сэлэнгэ",
    "Төв",
    "Увс",
    "Ховд",
    "Хэнтий",
    "Орхон",
    "Сайншанд",
  ];

  const districts: Record<string, string[]> = {
    Улаанбаатар: [
      "Сүхбаатар",
      "Баянгол",
      "Чингэлтэй",
      "Хан-Уул",
      "Багануур",
      "Налайх",
      "Сонгинохайрхан",
      "Дунд гол",
      "Багахангай",
    ],
    Архангай: ["Арвайхээр", "Хашаат", "Хайрхан"],
  };

  const subDistricts: Record<string, string[]> = {
    Сүхбаатар: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
    ],
    Баянгол: ["1-р хороо", "2-р хороо", "3-р хороо", "4-р хороо", "5-р хороо"],
  };

  const { token, ajiltan, barilgiinId } = useAuth();

  const {
    gereeGaralt,
    gereeJagsaaltMutate,
    setGereeKhuudaslalt,
    isValidating: isValidatingGeree,
  } = useGereeJagsaalt();
  const { gereeUusgekh, gereeZasakh, gereeUstgakh } = useGereeCRUD();
  const {
    zagvaruud,
    zagvarJagsaaltMutate,
    isValidating: isValidatingZagvar,
  } = useGereeniiZagvar();
  const router = useRouter();
  const contracts = gereeGaralt?.jagsaalt || [];

  useEffect(() => {
    setGereeKhuudaslalt((prev) => ({
      ...prev,
      search: searchTerm,
      khuudasniiDugaar: 1,
    }));
  }, [searchTerm, setGereeKhuudaslalt]);

  const filteredContracts = Array.isArray(contracts)
    ? contracts.filter(
        (c: any) => filterType === "Бүгд" || c.turul === filterType
      )
    : [];

  const totalPages = Math.ceil(filteredContracts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  const [newContract, setNewContract] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: [""],
    mail: "",
    khayag: "",
    baingiinKhayag: "",
    gereeniiDugaar: "",
    gereeniiOgnoo: "",
    turul: "",
    ekhlekhOgnoo: "",
    duusakhOgnoo: "",
    tulukhOgnoo: "",
    khugatsaa: 0,
    suhNer: "",
    suhRegister: "",
    suhUtas: [""],
    suhMail: "",
    suhGariinUseg: "",
    suhTamga: "",
    suhTulbur: "",
    suhTulburUsgeer: "",
    suhKhugatsaa: 0,
    sukhKhungulult: 0,
    uilchilgeeniiZardal: 0,
    uilchilgeeniiZardalUsgeer: "",
    niitTulbur: 0,
    niitTulburUsgeer: "",
    bairNer: "",
    orts: "",
    toot: 0,
    talbainKhemjee: "",
    zoriulalt: "",
    davkhar: "",
    burtgesenAjiltan: "",
    temdeglel: "",
    actOgnoo: "",
    tooluuriinDugaar: "",
    baritsaaAvakhDun: 0,
  });

  const renderCellValue = (contract: any, columnKey: string) => {
    switch (columnKey) {
      case "ovog":
        return contract.ovog || "-";
      case "ner":
        return contract.ner || "-";
      case "register":
        return contract.register || "-";
      case "gereeniiDugaar":
        return contract.gereeniiDugaar || "-";
      case "gereeniiOgnoo":
        return contract.gereeniiOgnoo
          ? new Date(contract.gereeniiOgnoo).toLocaleDateString("mn-MN")
          : "-";
      case "duusakhOgnoo":
        return contract.duusakhOgnoo
          ? new Date(contract.duusakhOgnoo).toLocaleDateString("mn-MN")
          : "-";
      case "khugatsaa":
        return contract.khugatsaa || "-";
      case "turul":
        return contract.turul || "-";
      case "zoriulalt":
        return contract.zoriulalt || "-";
      case "talbainDugaar":
        return contract.talbainDugaar || "-";
      case "talbainKhemjee":
        return contract.talbainKhemjee ? `${contract.talbainKhemjee} м²` : "-";
      case "sariinTurees":
        return contract.sariinTurees
          ? `${contract.sariinTurees.toLocaleString()}₮`
          : "-";
      case "baritsaaniiUldegdel":
        return contract.baritsaaniiUldegdel
          ? `${contract.baritsaaniiUldegdel.toLocaleString()}₮`
          : "0₮";
      case "utas":
        return Array.isArray(contract.utas) && contract.utas.length > 0
          ? contract.utas.join(", ")
          : contract.utas || "-";
      case "mail":
        return contract.mail || contract.email || "-";
      case "khayag":
        return contract.khayag || "-";
      default:
        return "-";
    }
  };

  const handleDownloadTemplate = async (templateType: string) => {
    if (!token) {
      notification.error({
        message: "Алдаа",
        description: "Нэвтрэх шаардлагатай",
      });
      return;
    }

    try {
      const response = await uilchilgee(token).get("/gereeniiZagvarAvya", {
        responseType: "blob",
        params: {
          templateType: templateType,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${templateType}_загвар.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notification.success({
        message: "Амжилттай",
        description: "Загвар амжилттай татагдлаа",
      });
    } catch (error) {
      console.error("Download error:", error);
      notification.error({
        message: "Алдаа",
        description: "Загвар татахад алдаа гарлаа",
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      notification.error({
        message: "Алдаа",
        description: "Нэвтрэх шаардлагатай",
      });
      return;
    }

    try {
      const query: any = {
        baiguullagiinId: ajiltan.baiguullagiinId,
      };

      if (barilgiinId) {
        query.barilgiinId = barilgiinId;
      }

      if (searchTerm) {
        query.$or = [
          { ner: { $regex: searchTerm, $options: "i" } },
          { gereeniiDugaar: { $regex: searchTerm, $options: "i" } },
          { register: { $regex: searchTerm, $options: "i" } },
        ];
      }

      if (filterType !== "Бүгд") {
        query.turul = filterType;
      }

      const response = await uilchilgee(token).get("/geree", {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          query: query,
          khuudasniiKhemjee: gereeGaralt?.niitMur || 1000,
          khuudasniiDugaar: 1,
        },
      });

      const { Excel } = require("antd-table-saveas-excel");
      const excel = new Excel();

      const columns = ALL_COLUMNS.map((col) => ({
        title: col.label,
        dataIndex: col.key,
        key: col.key,
      }));

      excel
        .addSheet("Гэрээний жагсаалт")
        .addColumns(columns)
        .addDataSource(response.data?.jagsaalt || [])
        .saveAs("Гэрээний_жагсаалт.xlsx");

      notification.success({
        message: "Амжилттай",
        description: "Excel файл амжилттай татагдлаа",
      });
    } catch (error) {
      console.error("Excel download error:", error);
      notification.error({
        message: "Алдаа",
        description: "Excel файл татахад алдаа гарлаа",
      });
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await gereeUusgekh(newContract);
    if (success) {
      setNewContract({
        ovog: "",
        ner: "",
        register: "",
        utas: [""],
        mail: "",
        khayag: "",
        baingiinKhayag: "",
        gereeniiDugaar: "",
        gereeniiOgnoo: "",
        turul: "",
        ekhlekhOgnoo: "",
        duusakhOgnoo: "",
        tulukhOgnoo: "",
        khugatsaa: 0,
        suhNer: "",
        suhRegister: "",
        suhUtas: [""],
        suhMail: "",
        suhGariinUseg: "",
        suhTamga: "",
        suhTulbur: "",
        suhTulburUsgeer: "",
        suhKhugatsaa: 0,
        sukhKhungulult: 0,
        uilchilgeeniiZardal: 0,
        uilchilgeeniiZardalUsgeer: "",
        niitTulbur: 0,
        niitTulburUsgeer: "",
        bairNer: "",
        orts: "",
        toot: 0,
        talbainKhemjee: "",
        zoriulalt: "",
        davkhar: "",
        burtgesenAjiltan: "",
        temdeglel: "",
        actOgnoo: "",
        tooluuriinDugaar: "",
        baritsaaAvakhDun: 0,
      });
      gereeJagsaaltMutate();
    }
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingContract?._id) return;

    const success = await gereeZasakh(editingContract._id, newContract);
    if (success) {
      setEditingContract(null);
      setNewContract({
        ner: "",
        gereeTurul: "Үндсэн гэрээ",
        davkhar: "",
        toot: "",
        startDate: "",
        gereeniiDugaar: "",
        utas: "",
        email: "",
      });
      gereeJagsaaltMutate();
    }
  };

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    setNewContract({
      ner: contract.ner,
      gereeTurul: contract.gereeTurul,
      davkhar: contract.davkhar,
      toot: contract.toot,
      startDate: contract.startDate,
      gereeniiDugaar: contract.gereeniiDugaar,
      utas: contract.utas || "",
      email: contract.email || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Та энэ гэрээг устгахдаа итгэлтэй байна уу?")) {
      const success = await gereeUstgakh(id);
      if (success) {
        gereeJagsaaltMutate();
      }
    }
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(`/geree/zagvar/gereeniiZagvar?id=${templateId}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!token) {
      notification.error({
        message: "Алдаа",
        description: "Нэвтрэх шаардлагатай",
      });
      return;
    }

    if (window.confirm("Та энэ загварыг устгахдаа итгэлтэй байна уу?")) {
      try {
        await uilchilgee(token).delete(`/gereeniiZagvar/${templateId}`);

        notification.success({
          message: "Амжилттай",
          description: "Загвар амжилттай устгагдлаа",
        });

        zagvarJagsaaltMutate();
      } catch (error) {
        console.error("Delete error:", error);
        notification.error({
          message: "Алдаа",
          description: "Загвар устгахад алдаа гарлаа",
        });
      }
    }
  };
  const handlePreviewTemplate = async (templateId: string) => {
    if (!token) {
      notification.error({
        message: "Алдаа",
        description: "Нэвтрэх шаардлагатай",
      });
      return;
    }

    try {
      const response = await uilchilgee(token).get(
        `/gereeniiZagvar/${templateId}`
      );
      setPreviewTemplate(response.data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Preview error:", error);
      notification.error({
        message: "Алдаа",
        description: "Загвар харахад алдаа гарлаа",
      });
    }
  };
  const templates = [
    {
      id: 1,
      name: "Үндсэн гэрээний загвар",
      description: "Үндсэн гэрээний загвар файл",
      type: "Үндсэн гэрээ",
    },
    {
      id: 2,
      name: "Түр гэрээний загвар",
      description: "Түр гэрээний загвар файл",
      type: "Түр гэрээ",
    },
  ];

  return (
    <div className="min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl font-bold mb-6 bg-slate-900 bg-clip-text text-transparent drop-shadow-sm"
      >
        {"Гэрээ"}
      </motion.h1>
      <p className="text-lg text-slate-600 mb-8">
        Гэрээг удирдах, шинэ гэрээ байгуулах болон загварууд
      </p>

      <div className="flex gap-3 mb-8 pt-4 flex-wrap">
        <button
          onClick={() => {
            setEditingContract(null);
            setNewContract({
              ovog: "",
              ner: "",
              register: "",
              utas: [""],
              mail: "",
              khayag: "",
              baingiinKhayag: "",
              gereeniiDugaar: "",
              gereeniiOgnoo: "",
              turul: "",
              ekhlekhOgnoo: "",
              duusakhOgnoo: "",
              tulukhOgnoo: "",
              khugatsaa: 0,
              suhNer: "",
              suhRegister: "",
              suhUtas: [""],
              suhMail: "",
              suhGariinUseg: "",
              suhTamga: "",
              suhTulbur: "",
              suhTulburUsgeer: "",
              suhKhugatsaa: 0,
              sukhKhungulult: 0,
              uilchilgeeniiZardal: 0,
              uilchilgeeniiZardalUsgeer: "",
              niitTulbur: 0,
              niitTulburUsgeer: "",
              bairNer: "",
              orts: "",
              toot: 0,
              talbainKhemjee: "",
              zoriulalt: "",
              davkhar: "",
              burtgesenAjiltan: "",
              temdeglel: "",
              actOgnoo: "",
              tooluuriinDugaar: "",
              baritsaaAvakhDun: 0,
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-bar text-white rounded-lg font-semibold hover:bg-violet-400 transition-colors"
        >
          {editingContract ? "Гэрээ засах" : "Гэрээ байгуулах"}
        </button>
        <button
          onClick={() => setShowList2Modal(true)}
          className="px-4 py-2 btn rounded-lg font-semibold"
        >
          Гэрээний Загвар
        </button>
        <button
          onClick={() => setShowTemplatesModal(true)}
          className="px-4 py-2 btn rounded-lg font-semibold"
        >
          Гэрээний загвар татах
        </button>
      </div>

      <div className="bg-transparent rounded-2xl p-8">
        <div>
          <div className="flex gap-4 mb-6 flex-wrap items-start">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-900 w-5 h-5" />
              <input
                type="text"
                placeholder="Гэрээ хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-900 w-5 h-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none"
              >
                <option>Бүгд</option>
                <option>homeowner</option>
                <option>renter</option>
              </select>
            </div>
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="px-4 py-3 bg-bar text-white rounded-lg font-semibold hover:bg-violet-400 transition-colors flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Багана сонгох
              </button>

              <button
                onClick={() => setShowExtraColumns(true)}
                className="px-4 py-3 bg-transparent btn rounded-lg font-semibold transition-colors flex items-center gap-2"
                title="Бусад талбарууд"
              >
                <FileText className="w-4 h-4 icon" />
                Бусад талбарууд
              </button>
            </div>
          </div>

          {isValidatingGeree ? (
            <div className="text-center py-8 text-slate-500">
              Уншиж байна...
            </div>
          ) : (
            <div>
              <div className="rounded-2xl bg-transparent shadow-sm overflow-hidden table-wrapper">
                {" "}
                <div className="h-[330px] overflow-y-auto custom-scrollbar">
                  <table className="table-custom w-full min-w-[900px]">
                    <thead className="sticky top-0 shadow-sm z-10">
                      <tr>
                        {visibleColumns.map((columnKey) => {
                          const column = ALL_COLUMNS.find(
                            (col) => col.key === columnKey
                          );
                          return (
                            <th
                              key={columnKey}
                              className="p-4 text-left text-sm font-semibold whitespace-nowrap"
                            >
                              {column?.label}
                            </th>
                          );
                        })}
                        <th className="p-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentContracts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 1}
                            className="p-8 text-center text-slate-500"
                          >
                            Гэрээ олдсонгүй
                          </td>
                        </tr>
                      ) : (
                        currentContracts.map((contract: any, idx: number) => (
                          <tr
                            key={contract._id || idx}
                            className="bg-transparent hover:shadow-md transition-all border-b last:border-b-0"
                          >
                            {visibleColumns.map((columnKey) => (
                              <td
                                key={columnKey}
                                className="p-4 text-slate-600 font-medium whitespace-nowrap"
                              >
                                {renderCellValue(contract, columnKey)}
                              </td>
                            ))}
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(contract)}
                                  className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors icon"
                                  title="Засах"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    contract._id && handleDelete(contract._id)
                                  }
                                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors icon"
                                  title="Устгах"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row w-full px-4 gap-3">
                <div className="flex items-end gap-2 sm:ml-auto !mt-2 sm:mt-0">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg text-sm px-2 py-1 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showCreateModal &&
            createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={() => setShowCreateModal(false)}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {editingContract ? "Гэрээ засах" : "Шинэ гэрээ байгуулах"}
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form
                    onSubmit={
                      editingContract
                        ? handleUpdateContract
                        : handleCreateContract
                    }
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar max-h-[55vh]">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Овог
                        </label>
                        <input
                          type="text"
                          value={newContract.ovog}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              ovog: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Нэр
                        </label>
                        <input
                          type="text"
                          value={newContract.ner}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              ner: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Регистр
                        </label>
                        <input
                          type="text"
                          value={newContract.register}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              register: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Утас
                        </label>
                        <input
                          type="text"
                          value={newContract.utas.join(", ")}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              utas: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          И-мэйл
                        </label>
                        <input
                          type="email"
                          value={newContract.mail}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              mail: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Аймаг
                        </label>
                        <select
                          value={newContract.khayag}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              khayag: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        >
                          <option value="">Сонгох...</option>
                          {mongoliaProvinces.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Дүүрэг
                        </label>
                        <select
                          value={newContract.ner}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              ner: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        >
                          <option value="">Сонгох...</option>
                          {(districts[newContract.khayag] || []).map(
                            (district) => (
                              <option key={district} value={district}>
                                {district}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Хороо
                        </label>
                        <select
                          value={newContract.ner}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              ner: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        >
                          <option value="">Сонгох...</option>
                          {(subDistricts[newContract.ner] || []).map(
                            (subDistrict) => (
                              <option key={subDistrict} value={subDistrict}>
                                {subDistrict}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Байнгын хаяг
                        </label>
                        <input
                          type="text"
                          value={newContract.baingiinKhayag}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              baingiinKhayag: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Гэрээний дугаар
                        </label>
                        <input
                          type="text"
                          value={newContract.gereeniiDugaar}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              gereeniiDugaar: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Гэрээний огноо
                        </label>
                        <input
                          type="date"
                          value={newContract.gereeniiOgnoo}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              gereeniiOgnoo: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Төрөл
                        </label>
                        <input
                          type="text"
                          value={newContract.turul}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              turul: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Эхлэх огноо
                        </label>
                        <input
                          type="date"
                          value={newContract.ekhlekhOgnoo}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              ekhlekhOgnoo: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Дуусах огноо
                        </label>
                        <input
                          type="date"
                          value={newContract.duusakhOgnoo}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              duusakhOgnoo: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Төлөх огноо
                        </label>
                        <input
                          type="date"
                          value={newContract.tulukhOgnoo}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              tulukhOgnoo: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Хугацаа (сар)
                        </label>
                        <input
                          type="number"
                          value={newContract.khugatsaa}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              khugatsaa: Number(e.target.value),
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          СӨХ-ийн нэр
                        </label>
                        <input
                          type="text"
                          value={newContract.suhNer}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              suhNer: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          СӨХ-ийн регистр
                        </label>
                        <input
                          type="text"
                          value={newContract.suhRegister}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              suhRegister: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          СӨХ-ийн утас
                        </label>
                        <input
                          type="text"
                          value={newContract.suhUtas.join(", ")}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              suhUtas: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          СӨХ-ийн и-мэйл
                        </label>
                        <input
                          type="email"
                          value={newContract.suhMail}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              suhMail: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          СӨХ төлбөр
                        </label>
                        <input
                          type="number"
                          value={newContract.suhTulbur}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              suhTulbur: Number(e.target.value),
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Үйлчилгээний зардал
                        </label>
                        <input
                          type="number"
                          value={newContract.uilchilgeeniiZardal}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              uilchilgeeniiZardal: Number(e.target.value),
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Нийт төлбөр
                        </label>
                        <input
                          type="number"
                          value={newContract.niitTulbur}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              niitTulbur: Number(e.target.value),
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Байрны нэр
                        </label>
                        <input
                          type="text"
                          value={newContract.bairNer}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              bairNer: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Орц
                        </label>
                        <input
                          type="text"
                          value={newContract.orts}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              orts: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Тоот
                        </label>
                        <input
                          type="number"
                          value={newContract.toot}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              toot: Number(e.target.value),
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Давхар
                        </label>
                        <input
                          type="text"
                          value={newContract.davkhar}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              davkhar: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Тэмдэглэл
                        </label>
                        <textarea
                          value={newContract.temdeglel}
                          onChange={(e) =>
                            setNewContract((prev: any) => ({
                              ...prev,
                              temdeglel: e.target.value,
                            }))
                          }
                          className="w-full p-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-300"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingContract(null);
                          setNewContract({
                            ovog: "",
                            ner: "",
                            register: "",
                            utas: [""],
                            mail: "",
                            khayag: "",
                            baingiinKhayag: "",
                            gereeniiDugaar: "",
                            gereeniiOgnoo: "",
                            turul: "",
                            ekhlekhOgnoo: "",
                            duusakhOgnoo: "",
                            tulukhOgnoo: "",
                            khugatsaa: 0,
                            suhNer: "",
                            suhRegister: "",
                            suhUtas: [""],
                            suhMail: "",
                            suhGariinUseg: "",
                            suhTamga: "",
                            suhTulbur: "",
                            suhTulburUsgeer: "",
                            suhKhugatsaa: 0,
                            sukhKhungulult: 0,
                            uilchilgeeniiZardal: 0,
                            uilchilgeeniiZardalUsgeer: "",
                            niitTulbur: 0,
                            niitTulburUsgeer: "",
                            bairNer: "",
                            orts: "",
                            toot: 0,
                            talbainKhemjee: "",
                            zoriulalt: "",
                            davkhar: "",
                            burtgesenAjiltan: "",
                            temdeglel: "",
                            actOgnoo: "",
                            tooluuriinDugaar: "",
                            baritsaaAvakhDun: 0,
                          });
                          setShowCreateModal(false);
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-slate-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Болих
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-bar text-white rounded-lg font-semibold hover:shadow-md transition-colors"
                      >
                        {editingContract ? "Хадгалах" : "Гэрээ үүсгэх"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>,
              document.body
            )}

          {showList2Modal &&
            createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={() => setShowList2Modal(false)}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">
                      Гэрээний Загвар
                    </h2>
                    <button
                      onClick={() => setShowList2Modal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {(zagvaruud || []).map((z: any) => (
                      <div
                        key={z._id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {z.ner}
                          </div>
                          <div className="text-sm text-slate-600">
                            {z.turul}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreviewTemplate(z._id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Харах"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditTemplate(z._id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Засах"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(z._id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                            title="Устгах"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>,
              document.body
            )}

          {showTemplatesModal &&
            createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={() => setShowTemplatesModal(false)}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">
                      Гэрээний загвар татах
                    </h2>
                    <button
                      onClick={() => setShowTemplatesModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleDownloadTemplate("Үндсэн гэрээ")}
                      className="w-full flex items-center gap-2 px-4 py-3 btn rounded-lg font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Үндсэн гэрээ загвар
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate("Түр гэрээ")}
                      className="w-full flex items-center gap-2 px-4 py-3 btn rounded-lg font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Түр гэрээ загвар
                    </button>
                  </div>
                </motion.div>
              </motion.div>,
              document.body
            )}
          {showExtraColumns &&
            createPortal(
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                onClick={() => setShowExtraColumns(false)}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md p-6 rounded-2xl bg-transparent frosted-plate shadow-2xl z-60"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white/95">
                      Бусад талбарууд
                    </h3>
                    <button
                      onClick={() => setShowExtraColumns(false)}
                      className="p-2 rounded-md"
                    >
                      <X className="w-5 h-5 text-white/85" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ALL_COLUMNS.filter(
                      (c) => !visibleColumns.includes(c.key)
                    ).map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/6"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-white/90">
                          {column.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setShowExtraColumns(false)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-white/90"
                    >
                      Хаах
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          {/* preview modal stays as is */}
          {showPreviewModal && previewTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPreviewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-full overflow-hidden"
              >
                <div className="flex justify-between items-center p-6 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {previewTemplate.ner}
                  </h2>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">
                      <strong>Тайлбар:</strong>{" "}
                      {previewTemplate.tailbar || "Байхгүй"}
                    </p>
                    <p className="text-sm text-slate-600">
                      <strong>Төрөл:</strong>{" "}
                      {previewTemplate.turul || "Байхгүй"}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-300 rounded-lg p-8">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: previewTemplate.aguulga || "",
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-slate-700 font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Хаах
                  </button>
                  <button
                    onClick={() => {
                      handleEditTemplate(previewTemplate._id);
                      setShowPreviewModal(false);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Засах
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
