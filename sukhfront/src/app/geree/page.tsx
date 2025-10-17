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
} from "lucide-react";
import { useRouter } from "next/navigation";

import { DownloadOutlined } from "@ant-design/icons";
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

// Available columns configuration
const ALL_COLUMNS = [
  { key: "ovog", label: "Овог", default: true },
  { key: "ner", label: "Нэр", default: true },
  { key: "register", label: "Регистр", default: true },
  { key: "gereeniiDugaar", label: "Гэрээний дугаар", default: true },
  { key: "gereeniiOgnoo", label: "Гэрээний огноо", default: true },
  { key: "duusakhOgnoo", label: "Дуусах огноо", default: false },
  { key: "khugatsaa", label: "Хугацаа (сар)", default: false },
  { key: "turul", label: "Төрөл", default: false },
  { key: "zoriulalt", label: "Зориулалт", default: false },
  { key: "talbainDugaar", label: "Талбайн дугаар", default: false },
  { key: "talbainKhemjee", label: "Талбайн хэмжээ", default: false },
  { key: "sariinTurees", label: "Сарын төлбөр", default: true },
  { key: "baritsaaniiUldegdel", label: "Үлдэгдэл", default: false },
  { key: "utas", label: "Утас", default: true },
  { key: "mail", label: "И-мэйл", default: false },
  { key: "khayag", label: "Хаяг", default: false },
];

export default function Geree() {
  const [activeTab, setActiveTab] = useState<
    "list" | "create" | "templates" | "list2"
  >("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Бүгд");
  const [editingContract, setEditingContract] = useState<GereeType | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter((col) => col.default).map((col) => col.key)
  );

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

  // Pagination
  const totalPages = Math.ceil(filteredContracts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  const [newContract, setNewContract] = useState<Partial<GereeType>>({
    ner: "",
    gereeTurul: "Үндсэн гэрээ",
    davkhar: "",
    toot: "",
    startDate: "",
    gereeniiDugaar: "",
    utas: "",
    email: "",
  });

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

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
      setActiveTab("list");
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
      setActiveTab("list");
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
    setActiveTab("create");
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
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm"
      >
        {"Гэрээ"}
      </motion.h1>
      <p className="text-lg text-gray-600 mb-8">
        Гэрээг удирдах, шинэ гэрээ байгуулах болон загварууд
      </p>

      <div className="flex gap-4 mb-8 pt-4">
        {[
          { label: "Гэрээний жагсаалт", icon: FileText, tab: "list" },
          {
            label: editingContract ? "Гэрээ засах" : "Гэрээ байгуулах",

            tab: "create",
          },
          { label: "Гэрээний Загвар", icon: FileText, tab: "list2" },
          { label: "Гэрээний загвар татах", icon: Download, tab: "templates" },
        ].map(({ label, icon: Icon, tab }) => (
          <button
            key={tab}
            onClick={() => {
              if (tab !== "create") {
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
              }
              setActiveTab(tab as any);
            }}
            className={`pb-4 px-6 font-semibold transition-all ${
              activeTab === tab
                ? "text-slate-900 border-b-2 border-black"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-transparent rounded-2xl p-8">
        {activeTab === "list" && (
          <div>
            <div className="flex gap-4 mb-6 flex-wrap items-start">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-900 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Гэрээ хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent border border-gray-200"
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
              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-4 py-3 bg-bar text-white rounded-lg font-semibold hover:bg-violet-400 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Багана сонгох
                </button>

                <AnimatePresence>
                  {showColumnSelector && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-gradient-to-br from-white/70 to-white/70 backdrop-strong rounded-2xl shadow-2xl border border-white/40 z-50 p-4"
                      >
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/30">
                          <h3 className="text-sm font-bold text-gray-900">
                            Багана сонгох
                          </h3>
                          <button
                            onClick={() => setShowColumnSelector(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-1">
                          {ALL_COLUMNS.map((column) => (
                            <label
                              key={column.key}
                              className="flex items-center gap-2 cursor-pointer hover:bg-white/30 p-2 rounded-lg transition-all"
                            >
                              <input
                                type="checkbox"
                                checked={visibleColumns.includes(column.key)}
                                onChange={() => toggleColumn(column.key)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-900">
                                {column.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isValidatingGeree ? (
              <div className="text-center py-8 text-gray-500">
                Уншиж байна...
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto rounded-xl shadow-sm ">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {visibleColumns.map((columnKey) => {
                          const column = ALL_COLUMNS.find(
                            (col) => col.key === columnKey
                          );
                          return (
                            <th
                              key={columnKey}
                              className="text-left py-4 px-4 font-semibold text-gray-700 whitespace-nowrap"
                            >
                              {column?.label}
                            </th>
                          );
                        })}
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 whitespace-nowrap">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentContracts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 1}
                            className="text-center py-8 text-gray-500"
                          >
                            Гэрээ олдсонгүй
                          </td>
                        </tr>
                      ) : (
                        currentContracts.map((contract: any) => (
                          <tr
                            key={contract._id}
                            className=" hover:shadow-sm transition-colors"
                          >
                            {visibleColumns.map((columnKey) => (
                              <td
                                key={columnKey}
                                className="py-4 px-4 text-gray-700 whitespace-nowrap"
                              >
                                {renderCellValue(contract, columnKey)}
                              </td>
                            ))}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(contract)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Засах"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    contract._id && handleDelete(contract._id)
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <div className="mt-6 flex justify-end items-end gap-4">
                  <div className="flex items-end gap-2">
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-2 shadow-sm rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingContract ? "Гэрээ засах" : "Шинэ гэрээ байгуулах"}
            </h2>
            <form
              onSubmit={
                editingContract ? handleUpdateContract : handleCreateContract
              }
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Эхлэх огноо
                  </label>
                  <input
                    type="date"
                    required
                    value={newContract.startDate}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-slate-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Гэрээний дугаар
                  </label>
                  <input
                    type="text"
                    required
                    value={newContract.gereeniiDugaar}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        gereeniiDugaar: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border text-slate-900 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Гэрээний дугаар оруулах"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    И-мэйл
                  </label>
                  <input
                    type="email"
                    value={newContract.email}
                    onChange={(e) =>
                      setNewContract({ ...newContract, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border text-slate-900 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="И-мэйл оруулах"
                  />
                </div>

                {newContract.gereeTurul === "Түр гэрээ" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Хугацаа (сар)
                    </label>
                    <input
                      type="number"
                      required
                      value={newContract.utas}
                      onChange={(e) =>
                        setNewContract({ ...newContract, utas: e.target.value })
                      }
                      className="w-full text-slate-900 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Гэрээний хугацаа"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
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
                    setActiveTab("list");
                  }}
                  className="px-6 py-3 border border-white rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingContract ? "Хадгалах" : "Гэрээ үүсгэх"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "list2" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Гэрээний загварууд
              </h2>
              <button
                onClick={() => router.push("/geree/zagvar/gereeniiZagvar")}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all"
              >
                Шинэ загвар үүсгэх
              </button>
            </div>

            {isValidatingZagvar ? (
              <div className="text-center py-8 text-gray-500">
                Уншиж байна...
              </div>
            ) : zagvaruud?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Гэрээний загвар олдсонгүй
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zagvaruud.map((item: any) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-gray-100 p-2 hover:shadow-lg transition-all relative"
                  >
                    <div className="absolute top-4 right-2 flex">
                      <button
                        onClick={() => handleEditTemplate(item._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Засах"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(item._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <FileText className="w-10 h-10 text-violet-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-16">
                      {item.ner}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {item.tailbar || "Тайлбар байхгүй"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Төрөл: {item.turul || "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.uusgesenOgnoo
                        ? new Date(item.uusgesenOgnoo).toLocaleDateString(
                            "mn-MN"
                          )
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Гэрээний загварууд
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <FileText className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  <button
                    className="flex items-center space-x-2 rounded-lg px-4 py-2 bg-bar hover:shadow-lg transition-colors text-white font-medium"
                    onClick={() => handleDownloadTemplate(template.type)}
                  >
                    <DownloadOutlined style={{ fontSize: "18px" }} />
                    <span>Татах</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
