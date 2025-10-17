"use client";

import { useState, useEffect, useRef } from "react";
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
  Edit,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import createMethod from "../../../tools/function/createMethod";
import updateMethod from "../../../tools/function/updateMethod";
import deleteMethod from "../../../tools/function/deleteMethod";
import uilchilgee, { aldaaBarigch } from "../../../lib/uilchilgee";

export default function Burtgel() {
  const { token, ajiltan: currentAjiltan } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ajiltanList");
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAjiltanModal, setShowAjiltanModal] = useState(false);
  const [showSuugchModal, setShowSuugchModal] = useState(false);

  const [formData, setFormData] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    khayag: "",
    utas: "",
    ajildOrsonOgnoo: "",
    albanTushaal: "",
    nevtrekhNer: "",
    nuutsUg: "",
    email: "",
  });

  const {
    ajilchdiinGaralt: ajiltanData,
    ajiltniiJagsaaltMutate: ajiltanMutate,
    setAjiltniiKhuudaslalt: setAjiltanKhuudaslalt,
    isValidating: ajiltanValidating,
  } = useAjiltniiJagsaalt(
    token || "",
    currentAjiltan?.baiguullagiinId || "",
    undefined,
    {}
  );

  const {
    orshinSuugchGaralt: suugchData,
    orshinSuugchJagsaaltMutate: suugchMutate,
    setOrshinSuugchKhuudaslalt: setSuugchKhuudaslalt,
    isValidating: suugchValidating,
  } = useOrshinSuugchJagsaalt(
    token || "",
    currentAjiltan?.baiguullagiinId || "",
    {}
  );

  const activeRecords =
    activeTab === "ajiltanList"
      ? ajiltanData?.jagsaalt || []
      : suugchData?.jagsaalt || [];

  const isValidating =
    activeTab === "ajiltanList" ? ajiltanValidating : suugchValidating;

  useEffect(() => {
    if (activeTab === "ajiltanList") {
      setAjiltanKhuudaslalt((prev: any) => ({
        ...prev,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
      }));
    } else if (activeTab === "suugchList") {
      setAjiltanKhuudaslalt({
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
        search: searchTerm,
      });
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    if (activeTab === "ajiltanList") {
      setAjiltanKhuudaslalt((prev: any) => ({
        ...prev,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
      }));
    } else {
      setSuugchKhuudaslalt((prev: any) => ({
        ...prev,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
      }));
    }
  }, [currentPage, pageSize, activeTab]);

  const activeCount = activeRecords.filter(
    (r: any) => r.tuluv === "Идэвхтэй"
  ).length;
  const inactiveCount = activeRecords.filter(
    (r: any) => r.tuluv === "Идэвхгүй"
  ).length;
  const showSummaryCard = false;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }

    if (formData.nuutsUg && formData.nuutsUg.length < 2) {
      toast.error("Нууц үг буруу оруулсан байна.");
      return;
    }

    setLoading(true);

    try {
      const isAjiltan = showAjiltanModal;
      const endpoint = isAjiltan ? "ajiltan" : "orshinSuugchBurtgey";

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

      if (isAjiltan) {
        payload.ajildOrsonOgnoo = new Date(
          formData.ajildOrsonOgnoo
        ).toISOString();
        payload.albanTushaal = formData.albanTushaal;

        switch (formData.albanTushaal) {
          case "Админ":
            payload.erkh = "Admin";
            break;
          case "Зохион байгуулагч":
            payload.erkh = "ZokhionBaiguulagch";
            break;
          case "Санхүү":
            payload.erkh = "Sankhuu";
            break;
          default:
            break;
        }
      }

      if (formData._id || formData.zasakhEsekh) {
        payload._id = formData._id;
        await updateMethod(endpoint, token, payload);
      } else {
        await createMethod(endpoint, token, payload);
      }

      toast.success("Бүртгэл амжилттай хийгдлээ");

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
        email: "",
      });

      formRef.current?.reset();
      setShowAjiltanModal(false);
      setShowSuugchModal(false);

      if (isAjiltan) {
        await ajiltanMutate();
      } else {
        await suugchMutate();
      }
    } catch (error: any) {
      aldaaBarigch(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !token) return;

    if (currentAjiltan?._id === selectedRecord._id) {
      toast.error("Та өөрийгөө устгаж болохгүй!");
      return;
    }

    setLoading(true);

    try {
      const endpoint = activeTab === "ajiltanList" ? "ajiltan" : "orshinSuugch";
      const id = selectedRecord._id || selectedRecord.id;

      await deleteMethod(endpoint, token, id);

      toast.success("Устгагдлаа");
      setDeleteOpen(false);

      if (activeTab === "ajiltanList") {
        await ajiltanMutate();
      } else {
        await suugchMutate();
      }
    } catch (error: any) {
      aldaaBarigch(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (data: any) => {
    setFormData({
      ovog: data.ovog || "",
      ner: data.ner || "",
      register: data.register || "",
      khayag: data.khayag || "",
      utas: data.utas || "",
      ajildOrsonOgnoo: data.ajildOrsonOgnoo
        ? new Date(data.ajildOrsonOgnoo).toISOString().split("T")[0]
        : "",
      albanTushaal: data.albanTushaal || "",
      nevtrekhNer: data.nevtrekhNer || "",
      nuutsUg: "",
      email: data.email || "",
      _id: data._id,
      zasakhEsekh: true,
    });

    if (activeTab === "ajiltanList") {
      setShowAjiltanModal(true);
    } else {
      setShowSuugchModal(true);
    }
  };

  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/30 animate-scaleIn">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-200/30">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/60 transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="p-5 max-h-[calc(85vh-80px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    );
  };

  if (!currentAjiltan || !currentAjiltan.baiguullagiinId) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Мэдээлэл ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm"
        >
          {"Бүртгэл"}
        </motion.h1>
        <p className="text-lg text-gray-600">
          Ажилтан болон оршин суугчдын мэдээлэл удирдах
        </p>
      </div>

      <div className="flex gap-6 mb-8 flex-wrap">
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setActiveTab("ajiltanList")}
            className={`px-3 py-2 font-semibold transition-all relative ${
              activeTab === "ajiltanList"
                ? "text-slate-900"
                : "text-gray-700 hover:text-slate-600"
            }`}
          >
            <FileText className="w-5 h-5 inline mr-1" />
            Ажилтны жагсаалт
            {activeTab === "ajiltanList" && (
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-black rounded-full transition-all"></span>
            )}
          </button>

          <button
            onClick={() => setShowAjiltanModal(true)}
            className="px-3 py-2 text-gray-700 font-semibold rounded transition-all hover:text-blue-600 flex items-center gap-1 hover:shadow-[0_0_10px_#3b82f6]"
            title="Ажилтан нэмэх"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setActiveTab("suugchList")}
            className={`px-3 py-2 font-semibold transition-all relative ${
              activeTab === "suugchList"
                ? "text-slate-900"
                : "text-gray-700 hover:text-slate-600"
            }`}
          >
            <Users className="w-5 h-5 inline mr-1" />
            Оршин суугчдын жагсаалт
            {activeTab === "suugchList" && (
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-black rounded-full transition-all"></span>
            )}
          </button>

          <button
            onClick={() => setShowSuugchModal(true)}
            className="px-3 py-2 text-gray-700 font-semibold rounded transition-all hover:text-blue-600 flex items-center gap-1 hover:shadow-[0_0_10px_#3b82f6]"
            title="Оршин суугч нэмэх"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading || isValidating ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Уншиж байна...</p>
        </div>
      ) : showSummaryCard ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="backdrop-blur-2xl   p-8 rounded-3xl shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-5 rounded-2xl shadow-lg">
                <Users className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {activeRecords.length}{" "}
                  {activeTab === "ajiltanList" ? "Ажилтан" : "Оршин суугч"}
                </h2>
                <p className="text-xl text-gray-600">
                  Идэвхтэй: {activeCount} | Идэвхгүй: {inactiveCount}
                </p>
              </div>
            </div>
            <ChevronDown className="w-7 h-7 text-gray-600" />
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-3xl p-6 mb-4 ">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Хайх..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3  rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="gray-200/50">
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
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        Мэдээлэл байхгүй байна
                      </td>
                    </tr>
                  ) : (
                    activeRecords.map((person: any, index: number) => (
                      <tr
                        key={person._id}
                        className="hover:shadow-lg transition-all"
                      >
                        <td className="p-4 text-gray-600 font-medium">
                          {index + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {person.ner?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {person.ovog} {person.ner}
                              </div>
                              {person.albanTushaal && (
                                <div className="text-sm text-gray-500">
                                  {person.albanTushaal}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-900">{person.register}</td>
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
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xl ${
                              person.tuluv === "Идэвхтэй"
                                ? "bg-green-100/80 text-green-800"
                                : "bg-red-100/80 text-red-800"
                            }`}
                          >
                            {person.tuluv || "Идэвхтэй"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(person)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Засах"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(person);
                                setDeleteOpen(true);
                              }}
                              className="p-2 rounded-xl hover:bg-red-100/80 text-red-600 backdrop-blur-xl transition-all"
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
            <div className="flex flex-col sm:flex-row w-full mt-4 px-4 gap-3">
              <div className="flex items-end gap-2 sm:ml-auto mt-2 sm:mt-0">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
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
        </>
      )}

      <Modal
        isOpen={showAjiltanModal}
        onClose={() => {
          setShowAjiltanModal(false);
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
            email: "",
          });
        }}
        title="Шинэ ажилтан нэмэх"
      >
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent">
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
                  className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all"
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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  maxLength={10}
                  placeholder="РД дугаар"
                  value={formData.register}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      register: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                />
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ажилд орсон огноо <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="ajildOrsonOgnoo"
                required
                value={formData.ajildOrsonOgnoo}
                onChange={handleInputChange}
                className="w-full px-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
              />
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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Нэвтрэх мэдээлэл
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                    className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-bar text-white font-semibold rounded-xl hover:scale-3d transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button
              type="button"
              onClick={() => setShowAjiltanModal(false)}
              className="px-6 py-3 bg-white/80 text-gray-700 font-semibold rounded-xl hover:bg-white transition-all backdrop-blur-xl border border-gray-200/50"
            >
              Цуцлах
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showSuugchModal}
        onClose={() => {
          setShowSuugchModal(false);
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
            email: "",
          });
        }}
        title="Оршин суугч нэмэх"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full pl-10 pr-4 py-2  rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  maxLength={10}
                  placeholder="РД дугаар"
                  value={formData.register}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      register: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full pl-10 pr-4 py-2  rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                  className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Нэвтрэх мэдээлэл
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
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
                    className="w-full pl-10 pr-4 py-2    rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-bar text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button
              type="button"
              onClick={() => setShowSuugchModal(false)}
              className="px-6 py-3 bg-white/80 text-gray-700 font-semibold rounded-xl hover:bg-white transition-all backdrop-blur-xl border border-gray-200/50"
            >
              Цуцлах
            </button>
          </div>
        </form>
      </Modal>

      {deleteOpen && (
        <Modal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Устгах уу?"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Та{" "}
              <span className="font-semibold text-gray-900">
                {selectedRecord?.ovog} {selectedRecord?.ner}
              </span>{" "}
              -г устгахдаа итгэлтэй байна уу?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Устгаж байна..." : "Устгах"}
              </button>
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-6 py-3 bg-white/80 text-gray-700 font-semibold rounded-xl hover:bg-white transition-all backdrop-blur-xl border border-gray-200/50"
              >
                Цуцлах
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
