"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Download,
  Search,
  Filter,
  Edit,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { DownloadOutlined } from "@ant-design/icons";
import {
  useGereeJagsaalt,
  useGereeCRUD,
  Geree as GereeType,
} from "@/lib/useGeree";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "../../../lib/uilchilgee";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import { notification } from "antd";

export default function Geree() {
  const [activeTab, setActiveTab] = useState<
    "list" | "create" | "templates" | "list2"
  >("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Бүгд");
  const [editingContract, setEditingContract] = useState<GereeType | null>(
    null
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

  const contracts = gereeGaralt?.jagsaalt || [];

  useEffect(() => {
    setGereeKhuudaslalt((prev) => ({
      ...prev,
      search: searchTerm,
      khuudasniiDugaar: 1,
    }));
  }, [searchTerm, setGereeKhuudaslalt]);

  useEffect(() => {
    console.log("Contracts Data:", gereeGaralt);
  }, [gereeGaralt]);

  const filteredContracts = Array.isArray(contracts)
    ? contracts.filter(
        (c: GereeType) => filterType === "Бүгд" || c.gereeTurul === filterType
      )
    : [];

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
        query.gereeTurul = filterType;
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

      const columns = [
        { title: "Нэр", dataIndex: "ner", key: "ner" },
        { title: "Төрөл", dataIndex: "gereeTurul", key: "gereeTurul" },
        { title: "Огноо", dataIndex: "startDate", key: "startDate" },
        { title: "Давхар", dataIndex: "davkhar", key: "davkhar" },
        { title: "Тоот", dataIndex: "toot", key: "toot" },
        {
          title: "Регистр",
          dataIndex: "gereeniiDugaar",
          key: "gereeniiDugaar",
        },
        { title: "Утас", dataIndex: "utas", key: "utas" },
        { title: "И-мэйл", dataIndex: "email", key: "email" },
      ];

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

  const handleEdit = (contract: GereeType) => {
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
      <h1 className="text-3xl font-bold mb-4 text-slate-900">Гэрээ</h1>
      <p className="text-lg text-gray-600 mb-8">
        Гэрээг удирдах, шинэ гэрээ байгуулах болон загварууд
      </p>

      <div className="flex gap-4 mb-8 pt-4">
        {[
          { label: "Гэрээний жагсаалт", icon: FileText, tab: "list" },
          {
            label: editingContract ? "Гэрээ засах" : "Гэрээ байгуулах",
            icon: Plus,
            tab: "create",
          },
          { label: "Гэрээний Загвар", icon: FileText, tab: "list2" },
          { label: "Гэрээний загвар", icon: Download, tab: "templates" },
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
            <Icon className="inline-block w-5 h-5 mr-2" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-transparent rounded-2xl p-8">
        {activeTab === "list" && (
          <div>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-900 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Гэрээ хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-900 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-8 py-3 text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-transparent"
                >
                  <option>Бүгд</option>
                  <option>Үндсэн гэрээ</option>
                  <option>Түр гэрээ</option>
                </select>
              </div>
            </div>

            {isValidatingGeree ? (
              <div className="text-center py-8 text-gray-500">
                Уншиж байна...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Гэрээний нэр
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Төрөл
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Огноо
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Давхар
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Тоот
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Регистр
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Утас
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        И-мэйл
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-8 text-gray-500"
                        >
                          Гэрээ олдсонгүй
                        </td>
                      </tr>
                    ) : (
                      filteredContracts.map((contract: GereeType) => (
                        <tr
                          key={contract._id}
                          className="hover:shadow-lg transition-colors"
                        >
                          <td className="py-4 px-4 text-slate-900">
                            {contract.ner}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                contract.gereeTurul === "Үндсэн гэрээ"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {contract.gereeTurul}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {contract.startDate}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {contract.davkhar}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {contract.toot}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {contract.gereeniiDugaar}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {contract.utas || "-"}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {contract.email || "-"}
                          </td>
                          <td className="py-4 px-4">
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
                    className="w-full px-4 py-3 text-slate-900 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border text-slate-900 border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border text-slate-900 border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                      className="w-full text-slate-900 px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                    className="rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all"
                  >
                    <FileText className="w-10 h-10 text-violet-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
