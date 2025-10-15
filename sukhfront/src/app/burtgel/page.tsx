"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Plus,
  User,
  Home,
  Phone,
  IdCard,
  Briefcase,
  Mail,
  Lock,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import uilchilgee from "../../../lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import useJagsaalt from "@/lib/useJagsaalt";
import toast from "react-hot-toast";

interface Ajiltan {
  _id?: string;
  id?: number;
  davkhar?: string;
  toot?: string;
  gd?: string;
  ner: string;
  ovog?: string;
  register: string;
  utas: string;
  email?: string;
  tuluv?: string;
  tuukh?: string;
  mashinDugaar?: string;
  albanTushaal?: string;
  ajildOrsonOgnoo?: string;
  khayag?: string;
  nevtrekhNer?: string;
  baiguullagiinId?: string;
}

interface FormData {
  ovog: string;
  ner: string;
  register: string;
  khayag: string;
  utas: string;
  ajildOrsonOgnoo: string;
  albanTushaal: string;
  nevtrekhNer: string;
  nuutsUg: string;
  davkhar: string;
  toot: string;
  gd: string;
  email: string;
  mashinDugaar: string;
}

export default function Burtgel() {
  const { token, ajiltan: currentAjiltan } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ajiltanList");
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    ovog: "",
    ner: "",
    register: "",
    khayag: "",
    utas: "",
    ajildOrsonOgnoo: "",
    albanTushaal: "",
    nevtrekhNer: "",
    nuutsUg: "",
    davkhar: "",
    toot: "",
    gd: "",
    email: "",
    mashinDugaar: "",
  });

  // Use useJagsaalt hook for Ajiltan list
  const {
    jagsaalt: ajiltanRecords,
    onSearch: onAjiltanSearch,
    refresh: refreshAjiltan,
    isValidating: ajiltanLoading,
  } = useJagsaalt<Ajiltan>(
    "/ajiltan",
    {},
    {},
    {},
    ["ner", "ovog", "register", "utas", "email"],
    undefined,
    100
  );

  // Use useJagsaalt hook for Suugch list
  const {
    jagsaalt: suugchRecords,
    onSearch: onSuugchSearch,
    refresh: refreshSuugch,
    isValidating: suugchLoading,
  } = useJagsaalt<Ajiltan>(
    "/suugch",
    {},
    {},
    {},
    ["ner", "ovog", "register", "utas", "email"],
    undefined,
    100
  );

  const activeRecords =
    activeTab === "ajiltanList" ? ajiltanRecords : suugchRecords;
  const activeCount = activeRecords.filter(
    (r) => r.tuluv === "Идэвхтэй"
  ).length;
  const inactiveCount = activeRecords.filter(
    (r) => r.tuluv === "Идэвхгүй"
  ).length;
  const showSummaryCard = activeRecords.length > 5 && !isExpanded;
  const isLoading =
    activeTab === "ajiltanList" ? ajiltanLoading : suugchLoading;

  const handleSearch = (searchTerm: string) => {
    if (activeTab === "ajiltanList") {
      onAjiltanSearch(searchTerm);
    } else {
      onSuugchSearch(searchTerm);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }

    setLoading(true);

    try {
      const axiosInstance = uilchilgee(token);
      const endpoint = activeTab === "ajiltanNemekh" ? "/ajiltan" : "/suugch";

      const payload: any = {
        ner: formData.ner,
        ovog: formData.ovog,
        register: formData.register,
        khayag: formData.khayag,
        utas: formData.utas,
        email: formData.email,
        nevtrekhNer: formData.nevtrekhNer,
        nuutsUg: formData.nuutsUg,
        baiguullagiinId: currentAjiltan?.baiguullagiinId,
      };

      // Add ajiltan-specific fields
      if (activeTab === "ajiltanNemekh") {
        payload.ajildOrsonOgnoo = new Date(
          formData.ajildOrsonOgnoo
        ).toISOString();
        payload.albanTushaal = formData.albanTushaal;
        payload.barilguud = ["622ca3938e64e5b4f0c36bed"]; // Replace with actual building selection
      }

      const response = await axiosInstance.post(endpoint, payload);

      if (response.data?.success) {
        toast.success("Амжилттай хадгалагдлаа!");

        // Reset form
        setFormData({
          ovog: "",
          ner: "",
          register: "",
          khayag: "",
          utas: "",
          ajildOrsonOgnoo: "",
          albanTushaal: "",
          nevtrekhNer: "",
          nuutsUg: "",
          davkhar: "",
          toot: "",
          gd: "",
          email: "",
          mashinDugaar: "",
        });

        // Refresh the list
        if (activeTab === "ajiltanNemekh") {
          refreshAjiltan();
          setActiveTab("ajiltanList");
        } else {
          refreshSuugch();
          setActiveTab("suugchList");
        }
      } else {
        toast.error(response.data?.aldaa || "Алдаа гарлаа");
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.aldaa || err.message || "Алдаа гарлаа";
      toast.error(errorMsg);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !token) return;

    setLoading(true);

    try {
      const axiosInstance = uilchilgee(token);
      const endpoint = activeTab === "ajiltanList" ? "/ajiltan" : "/suugch";
      const id = selectedRecord._id || selectedRecord.id;

      const response = await axiosInstance.delete(`${endpoint}/${id}`);

      if (response.data?.success) {
        toast.success("Амжилттай устгагдлаа!");
        setDeleteOpen(false);

        // Refresh the list
        if (activeTab === "ajiltanList") {
          refreshAjiltan();
        } else {
          refreshSuugch();
        }
      } else {
        toast.error(response.data?.aldaa || "Устгахад алдаа гарлаа");
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.aldaa || err.message || "Устгахад алдаа гарлаа";
      toast.error(errorMsg);
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { label: "Ажилтны жагсаалт", icon: FileText, tab: "ajiltanList" },
    { label: "Оршин суугчдын жагсаалт", icon: Users, tab: "suugchList" },
    { label: "Ажилтан нэмэх", icon: Plus, tab: "ajiltanNemekh" },
    { label: "Оршин суугч нэмэх", icon: Plus, tab: "suugchNemekh" },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Бүртгэлийн систем
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Ажилтан болон оршин суугчдын мэдээлэл удирдах
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(({ label, icon: Icon, tab }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-transparent text-gray-700 hover:bg-gray-100 shadow"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {(activeTab === "ajiltanList" || activeTab === "suugchList") && (
          <>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Уншиж байна...</p>
              </div>
            ) : showSummaryCard ? (
              <div
                onClick={() => setIsExpanded(true)}
                className="bg-gradient-to-br from-blue-400 to-purple-500 text-white p-8 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="bg-transparent/20 p-5 rounded-2xl">
                      <Users className="w-12 h-12" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-bold mb-2">
                        {activeRecords.length}{" "}
                        {activeTab === "ajiltanList"
                          ? "Ажилтан"
                          : "Оршин суугч"}
                      </h2>
                      <p className="text-xl opacity-90">
                        Идэвхтэй: {activeCount} | Идэвхгүй: {inactiveCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">
                      Дэлгэрэнгүй харах
                    </span>
                    <ChevronDown className="w-7 h-7" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-transparent rounded-xl shadow-md p-6 mb-6">
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Хайх..."
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Filter className="w-5 h-5" />
                      Шүүлтүүр
                    </button>
                    {activeRecords.length > 5 && (
                      <button
                        onClick={() => setIsExpanded(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <ChevronUp className="w-5 h-5" />
                        Хураангуй
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto bg-transparent rounded-xl shadow-md">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          #
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Нэр
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Регистр
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Холбоо барих
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Төлөв
                        </th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-700">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-gray-500"
                          >
                            Мэдээлэл байхгүй байна
                          </td>
                        </tr>
                      ) : (
                        activeRecords.map((person: any, index: number) => (
                          <tr
                            key={person._id || person.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-4 text-gray-600 font-medium">
                              {index + 1}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {(person.ner || person.name)
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {person.ovog} {person.ner || person.name}
                                  </div>
                                  {person.albanTushaal && (
                                    <div className="text-sm text-gray-500">
                                      {person.albanTushaal}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-gray-900">
                              {person.register}
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                <div className="text-gray-900 mb-1">
                                  {person.utas}
                                </div>
                                {person.email && (
                                  <div className="text-gray-600">
                                    {person.email}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  person.tuluv === "Идэвхтэй"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {person.tuluv || "Идэвхтэй"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setSelectedRecord(person);
                                    setViewOpen(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-green-100 text-green-600"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRecord(person);
                                    setEditOpen(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-yellow-100 text-yellow-600"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRecord(person);
                                    setDeleteOpen(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-red-100 text-red-600"
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
              </>
            )}
          </>
        )}

        {(activeTab === "ajiltanNemekh" || activeTab === "suugchNemekh") && (
          <div className="bg-transparent rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {activeTab === "ajiltanNemekh"
                ? "Шинэ ажилтан нэмэх"
                : "Оршин суугч нэмэх"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Овог <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ovog"
                      required
                      placeholder="Овог"
                      value={formData.ovog}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Нэр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ner"
                      required
                      placeholder="Нэр"
                      value={formData.ner}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Регистр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="register"
                      placeholder="РД дугаар"
                      required
                      value={formData.register}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Утас <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="utas"
                      required
                      placeholder="Утас"
                      value={formData.utas}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    И-мэйл <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="И-мэйл"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {activeTab === "ajiltanNemekh" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Албан тушаал <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="albanTushaal"
                          required
                          placeholder="Албан тушаал"
                          value={formData.albanTushaal}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ажилд орсон огноо{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="ajildOrsonOgnoo"
                        required
                        value={formData.ajildOrsonOgnoo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Хаяг <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="khayag"
                      required
                      placeholder="Хаяг"
                      value={formData.khayag}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Нэвтрэх мэдээлэл
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нэвтрэх нэр <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="nevtrekhNer"
                        required
                        placeholder="Нэвтрэх нэр"
                        value={formData.nevtrekhNer}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нууц үг <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="nuutsUg"
                        required
                        placeholder="Нууц үг"
                        value={formData.nuutsUg}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                >
                  {loading ? "Хадгалж байна..." : "Хадгалах"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      activeTab === "ajiltanNemekh"
                        ? "ajiltanList"
                        : "suugchList"
                    )
                  }
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Цуцлах
                </button>
              </div>
            </form>
          </div>
        )}
        {activeTab === "suugchNemekh" && (
          <div className="bg-transparent rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Оршин суугч нэмэх
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Овог <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ovog"
                      required
                      placeholder="Овог"
                      value={formData.ovog}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Нэр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ner"
                      required
                      placeholder="Нэр"
                      value={formData.ner}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Регистр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="register"
                      required
                      placeholder="РД дугаар"
                      value={formData.register}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Утас <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="utas"
                      required
                      placeholder="Утас"
                      value={formData.utas}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    И-мэйл <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="И-Мэйл"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Хаяг <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="khayag"
                      required
                      placeholder="Хаяг"
                      value={formData.khayag}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Нэвтрэх мэдээлэл
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нэвтрэх нэр <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="nevtrekhNer"
                        required
                        value={formData.nevtrekhNer}
                        placeholder="Нэвтрэх нэр"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нууц үг <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="nuutsUg"
                        required
                        placeholder="Нууц үг"
                        value={formData.nuutsUg}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-bar text-white font-semibold rounded-lg hover:bg-bar/70 transition-color shadow-md"
                >
                  Хадгалах
                </button>
                <button
                  type="button"
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Цуцлах
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
