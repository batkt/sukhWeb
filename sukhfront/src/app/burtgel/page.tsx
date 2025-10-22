"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
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
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import createMethod from "../../../tools/function/createMethod";
import updateMethod from "../../../tools/function/updateMethod";
import deleteMethod from "../../../tools/function/deleteMethod";
import { aldaaBarigch } from "../../../lib/uilchilgee";
import { ModalPortal } from "../../../components/golContent";
import formatNumber from "../../../tools/function/formatNumber";

const Modal = ({ isOpen, onClose, title, children }: any) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[850px] max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden pointer-events-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              type="button"
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>
          <div
            className="p-6 overflow-y-auto"
            style={{ maxHeight: "calc(85vh - 180px)" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Burtgel() {
  const { token, ajiltan: currentAjiltan } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [tootBurtgelList, setTootBurtgelList] = useState<any[]>([]);
  const [isLoadingToot, setIsLoadingToot] = useState(false);
  const [selectedBarilga, setSelectedBarilga] = useState<string>("");
  const [selectedOrts, setSelectedOrts] = useState<string>("");
  const [selectedDavkhar, setSelectedDavkhar] = useState<string>("");
  const [ashiglaltiinZardluud, setAshiglaltiinZardluud] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("ajiltanList");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAjiltanModal, setShowAjiltanModal] = useState(false);
  const [showSuugchModal, setShowSuugchModal] = useState(false);
  const [showZardalModal, setShowZardalModal] = useState(false);
  const [selectedZardalRecord, setSelectedZardalRecord] = useState<any>(null);

  // First, define an interface for your form data
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
    email: string;
    _id?: string;
    zasakhEsekh?: boolean;
  }

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
      : activeTab === "suugchList"
      ? suugchData?.jagsaalt || []
      : [];

  const isValidating =
    activeTab === "ajiltanList"
      ? ajiltanValidating
      : activeTab === "suugchList"
      ? suugchValidating
      : false;

  const fetchTootBurtgel = async () => {
    if (!token || !currentAjiltan?.baiguullagiinId) return;

    setIsLoadingToot(true);
    try {
      let url = `http://103.143.40.46:8084/orshinSuugch?baiguullagiinId=${currentAjiltan.baiguullagiinId}&khuudasniiDugaar=1&khuudasniiKhemjee=100`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setTootBurtgelList(data.jagsaalt || []);
    } catch (error) {
      toast.error("Тоот бүртгэл татахад алдаа гарлаа");
    } finally {
      setIsLoadingToot(false);
    }
  };
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
    email: "",
  });
  const fetchAshiglaltiinZardluud = async () => {
    if (!token || !currentAjiltan?.baiguullagiinId) return;

    try {
      const response = await fetch(
        `http://103.143.40.46:8084/ashiglaltiinZardluud?baiguullagiinId=${currentAjiltan.baiguullagiinId}&khuudasniiDugaar=1&khuudasniiKhemjee=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAshiglaltiinZardluud(data.jagsaalt || []);
    } catch (error) {}
  };

  const getFilterOptions = () => {
    const barilgaOptions = [
      ...new Set(tootBurtgelList.map((item: any) => item.soh).filter(Boolean)),
    ];
    const ortsOptions = selectedBarilga
      ? [
          ...new Set(
            tootBurtgelList
              .filter((item: any) => item.soh === selectedBarilga)
              .map((item: any) => item.toot?.charAt(0))
              .filter(Boolean)
          ),
        ]
      : [];
    const davkharOptions = selectedBarilga
      ? [
          ...new Set(
            tootBurtgelList
              .filter((item: any) => item.soh === selectedBarilga)
              .map((item: any) => item.davkhar)
              .filter(Boolean)
          ),
        ]
      : [];

    return { barilgaOptions, ortsOptions, davkharOptions };
  };

  const getFilteredTootList = () => {
    return tootBurtgelList.filter((item: any) => {
      if (selectedBarilga && item.soh !== selectedBarilga) return false;
      if (selectedOrts && !item.toot?.startsWith(selectedOrts)) return false;
      if (selectedDavkhar && item.davkhar !== selectedDavkhar) return false;
      return true;
    });
  };

  const fetchLiftFloors = async () => {
    if (!token) return;

    try {
      const res = await fetch("http://103.143.40.46:8084/liftShalgaya", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      let allFloors: string[] = [];
      if (data?.jagsaalt && Array.isArray(data.jagsaalt)) {
        data.jagsaalt.forEach((item: any) => {
          if (Array.isArray(item?.choloolugdokhDavkhar)) {
            allFloors = [
              ...allFloors,
              ...item.choloolugdokhDavkhar.map(String),
            ];
          }
        });
      }

      const uniqueFloors = Array.from(new Set(allFloors)).sort();

      setLiftFloors(uniqueFloors);
    } catch (err) {
      toast.error("Лифт давхруудын мэдээлэл авахад алдаа гарлаа");
    }
  };

  useEffect(() => {
    if (token) {
      fetchLiftFloors();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "tootList") {
      fetchTootBurtgel();
      fetchAshiglaltiinZardluud();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "ajiltanList") {
      setAjiltanKhuudaslalt((prev: any) => ({
        ...prev,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
      }));
    } else if (activeTab === "suugchList") {
      setSuugchKhuudaslalt({
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
    } else if (activeTab === "suugchList") {
      setSuugchKhuudaslalt((prev: any) => ({
        ...prev,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
      }));
    }
  }, [currentPage, pageSize, activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "register") {
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
    } else {
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Confirm + delete helper (small popup / native confirm)
  const confirmDelete = async (record: any) => {
    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }

    const ok = window.confirm(
      `Та ${record?.ovog || ""} ${
        record?.ner || ""
      } -г устгахдаа итгэлтэй байна уу?`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const endpoint = activeTab === "ajiltanList" ? "ajiltan" : "orshinSuugch";
      const id = record._id || record.id;
      await deleteMethod(endpoint, token, id);
      toast.success("Устгагдлаа");
      // refresh list
      if (activeTab === "ajiltanList") await ajiltanMutate();
      else await suugchMutate();
    } catch (error: any) {
      aldaaBarigch(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLiftCharge = (residentDavkhar: any, zardal: any) => {
    if (!residentDavkhar || !zardal?.tariff) {
      return zardal?.tariff || 0;
    }

    const residentFloorStr = String(residentDavkhar).trim();

    if (liftFloors.includes(residentFloorStr)) {
      return 0;
    }

    return zardal.tariff;
  };

  const calculateTotalChargesForResident = (
    zardluud: any[],
    residentDavkhar: any
  ) => {
    if (!Array.isArray(zardluud)) return 0;

    return zardluud.reduce((sum, zardal) => {
      const isLift =
        zardal?.ner?.toLowerCase() === "лифт" ||
        zardal?.turul?.toLowerCase() === "лифт";

      const charge = isLift
        ? calculateLiftCharge(residentDavkhar, zardal)
        : zardal?.tariff || 0;

      return sum + Number(charge);
    }, 0);
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

  if (!currentAjiltan || !currentAjiltan.baiguullagiinId) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Мэдээлэл ачааллаж байна...</p>
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
          className="text-3xl font-bold mb-6 bg-slate-900 bg-clip-text text-transparent drop-shadow-sm"
        >
          Бүртгэл
        </motion.h1>
        <p className="text-lg text-slate-600">
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
                : "text-slate-700 hover:text-slate-600"
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
            className="px-3 py-2 text-slate-700 font-semibold rounded transition-all hover:text-blue-600 flex items-center gap-1 hover:shadow-[0_0_10px_#3b82f6]"
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
                : "text-slate-700 hover:text-slate-600"
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
            className="px-3 py-2 text-slate-700 font-semibold rounded transition-all hover:text-blue-600 flex items-center gap-1 hover:shadow-[0_0_10px_#3b82f6]"
            title="Оршин суугч нэмэх"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setActiveTab("tootList")}
            className={`px-3 py-2 font-semibold transition-all relative ${
              activeTab === "tootList"
                ? "text-slate-900"
                : "text-slate-700 hover:text-slate-600"
            }`}
          >
            <FileText className="w-5 h-5 inline mr-1" />
            Тоот бүртгэл
            {activeTab === "tootList" && (
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-black rounded-full transition-all"></span>
            )}
          </button>
        </div>
      </div>
      {loading || isValidating ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Уншиж байна...</p>
        </div>
      ) : activeTab === "tootList" ? (
        <>
          <div className="rounded-3xl p-4 mb-4 bg-transparent/50">
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  СӨХ (Барилга)
                </label>
                <select
                  value={selectedBarilga}
                  onChange={(e) => {
                    setSelectedBarilga(e.target.value);
                    setSelectedOrts("");
                    setSelectedDavkhar("");
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border"
                >
                  <option value="">Бүгд</option>
                  {getFilterOptions().barilgaOptions.map((soh: string) => (
                    <option key={soh} value={soh}>
                      {soh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Орц (Тоот эхний үсэг)
                </label>
                <select
                  value={selectedOrts}
                  onChange={(e) => setSelectedOrts(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border"
                  disabled={!selectedBarilga}
                >
                  <option value="">Бүгд</option>
                  {getFilterOptions().ortsOptions.map((orts: string) => (
                    <option key={orts} value={orts}>
                      {orts}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Давхар
                </label>
                <select
                  value={selectedDavkhar}
                  onChange={(e) => setSelectedDavkhar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border"
                  disabled={!selectedBarilga}
                >
                  <option value="">Бүгд</option>
                  {getFilterOptions().davkharOptions.map((davkhar: string) => (
                    <option key={davkhar} value={davkhar}>
                      {davkhar}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl backdrop-blur-md shadow-xl">
            <div className="max-h-[330px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-slate-800">
                <thead className="bg-white/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      #
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Нэр
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Байр
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Ашиглалтын зардал
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Нийт дүн
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingToot ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </td>
                    </tr>
                  ) : getFilteredTootList().length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-slate-500"
                      >
                        Мэдээлэл байхгүй байна
                      </td>
                    </tr>
                  ) : (
                    getFilteredTootList().map((item: any, index: number) => {
                      const totalCharges = calculateTotalChargesForResident(
                        ashiglaltiinZardluud,
                        item.davkhar
                      );

                      return (
                        <tr
                          key={item._id}
                          className="bg-transparent hover:shadow-md transition-all border-b last:border-b-0"
                        >
                          <td className="p-4 text-slate-600 font-medium">
                            {index + 1}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-900">
                              {item.ovog} {item.ner}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.soh}
                            </div>
                          </td>
                          <td className="p-4 text-slate-900">
                            <div className="font-medium">
                              {item.toot || "-"}
                            </div>
                            <div className="text-xs text-slate-500">
                              Давхар: {item.davkhar || "-"}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setSelectedZardalRecord(item);
                                setShowZardalModal(true);
                              }}
                              className="flex items-center gap-2 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all text-sm font-medium"
                            >
                              <span>
                                {ashiglaltiinZardluud.length} зардлын төрөл
                              </span>
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-blue-600 text-lg">
                              {formatNumber(totalCharges, 0)}₮
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-3xl p-6 mb-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Хайх..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl backdrop-blur-md shadow-xl">
            <div className="max-h-[330px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-slate-800">
                <thead className="bg-white/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      #
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Нэр
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Регистр
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Холбоо барих
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Төлөв
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-slate-500"
                      >
                        Мэдээлэл байхгүй байна
                      </td>
                    </tr>
                  ) : (
                    activeRecords.map((person: any, index: number) => (
                      <tr
                        key={person._id}
                        className="bg-transparent hover:shadow-md transition-all border-b last:border-b-0"
                      >
                        <td className="p-4 text-slate-600 font-medium">
                          {index + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {person.ner}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-900">
                          {person.register}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="text-slate-900 mb-1">
                              {person.utas}
                            </div>
                            {person.email && (
                              <div className="text-slate-600">
                                {person.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold  ${
                              person.tuluv === "Төлсөн"
                                ? "bg-green-100/80 text-green-800"
                                : person.tuluv === "Төлөөгүй"
                                ? "bg-red-100/80 text-red-800"
                                : "bg-gray-100/80 text-slate-800"
                            }`}
                          >
                            {person.tuluv || "Төлсөн"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(person)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Засах"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(person)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
        </>
      )}
      {showAjiltanModal && (
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
          title={formData.zasakhEsekh ? "Засах" : "Шинэ ажилтан нэмэх"}
        >
          <form
            ref={formRef}
            onSubmit={(e) => {
              handleSubmit(e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Овог <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Нэр <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Регистр <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
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
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Утас <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    name="utas"
                    required
                    placeholder="Утас"
                    value={formData.utas}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  И-мэйл <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="И-мэйл"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Албан тушаал <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="albanTushaal"
                    required
                    placeholder="Албан тушаал"
                    value={formData.albanTushaal}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ажилд орсон огноо <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="ajildOrsonOgnoo"
                  required
                  value={formData.ajildOrsonOgnoo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Хаяг <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="khayag"
                    required
                    placeholder="Хаяг"
                    value={formData.khayag}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <h3 className="text-lg font-semibold mb-4 text-slate-900">
                Нэвтрэх мэдээлэл
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Нэвтрэх нэр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="nevtrekhNer"
                      required
                      placeholder="Нэвтрэх нэр"
                      value={formData.nevtrekhNer}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Нууц үг <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="nuutsUg"
                      required
                      placeholder="Нууц үг"
                      value={formData.nuutsUg}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button
                type="button"
                onClick={() => setShowAjiltanModal(false)}
                className="px-6 py-3 bg-transparent/80 text-slate-700 font-semibold rounded-xl hover:bg-transparent transition-all backdrop-blur-xl border border-gray-200/50"
              >
                Цуцлах
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showSuugchModal && (
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
          title={formData.zasakhEsekh ? "Засах" : "Оршин суугч нэмэх"}
        >
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Овог <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="ovog"
                    required
                    placeholder="Овог"
                    value={formData.ovog}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Нэр <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Регистр <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
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
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Утас <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    name="utas"
                    required
                    placeholder="Утас"
                    value={formData.utas}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  И-мэйл <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="И-мэйл"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Хаяг <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="khayag"
                    required
                    placeholder="Хаяг"
                    value={formData.khayag}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <h3 className="text-lg font-semibold mb-4 text-slate-900">
                Нэвтрэх мэдээлэл
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Нэвтрэх нэр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="nevtrekhNer"
                      required
                      placeholder="Нэвтрэх нэр"
                      value={formData.nevtrekhNer}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Нууц үг <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="nuutsUg"
                      required
                      placeholder="Нууц үг"
                      value={formData.nuutsUg}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button
                type="button"
                onClick={() => setShowSuugchModal(false)}
                className="px-6 py-3 bg-transparent/80 text-slate-700 font-semibold rounded-xl hover:bg-transparent transition-all backdrop-blur-xl border border-gray-200/50"
              >
                Цуцлах
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showZardalModal && selectedZardalRecord && (
        <ModalPortal>
          <AnimatePresence>
            {showZardalModal && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => {
                    setShowZardalModal(false);
                    setSelectedZardalRecord(null);
                  }}
                />

                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-slate-800">
                      Ашиглалтын зардлын дэлгэрэнгүй
                    </h2>
                    <button
                      onClick={() => {
                        setShowZardalModal(false);
                        setSelectedZardalRecord(null);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-500" />
                    </button>
                  </div>

                  {/* Content area with scrolling */}
                  <div
                    className="overflow-y-auto p-6"
                    style={{ maxHeight: "calc(85vh - 180px)" }}
                  >
                    <div className="space-y-6">
                      {/* Resident Info */}
                      <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">
                          Оршин суугч
                        </div>
                        <div className="font-bold text-lg text-slate-900">
                          {selectedZardalRecord.ovog} {selectedZardalRecord.ner}
                        </div>
                        <div className="text-sm text-slate-600 mt-2">
                          <span className="font-medium">СӨХ:</span>{" "}
                          {selectedZardalRecord.soh}
                        </div>
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Байр:</span>{" "}
                          {selectedZardalRecord.toot || "-"} |{" "}
                          <span className="font-medium">Давхар:</span>{" "}
                          {selectedZardalRecord.davkhar || "-"}
                        </div>
                      </div>

                      {/* Expenses List */}
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">
                          Зардлын жагсаалт
                        </h4>
                        <div className="space-y-2">
                          {ashiglaltiinZardluud.map(
                            (zardal: any, index: number) => {
                              const isLift =
                                zardal.ner === "Лифт" ||
                                zardal.turul === "лифт";
                              const charge = isLift
                                ? calculateLiftCharge(
                                    selectedZardalRecord.davkhar,
                                    zardal
                                  )
                                : zardal.tariff;
                              const isExempted = isLift && charge === 0;

                              return (
                                <div
                                  key={zardal._id}
                                  className={`flex justify-between items-center p-3 rounded-lg transition-all ${
                                    isExempted
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-gray-50 hover:bg-gray-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                        isExempted
                                          ? "bg-green-100 text-green-600"
                                          : "bg-blue-100 text-blue-600"
                                      }`}
                                    >
                                      {index + 1}
                                    </div>
                                    <div>
                                      <span className="text-slate-700 font-medium">
                                        {zardal.ner}
                                      </span>
                                      {isExempted && (
                                        <div className="text-xs text-green-600 font-medium mt-0.5">
                                          Чөлөөлөгдсөн давхар
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {isExempted ? (
                                      <>
                                        <div className="font-bold text-green-600">
                                          0₮
                                        </div>
                                        <div className="text-xs text-slate-400 line-through">
                                          {formatNumber(zardal.tariff, 0)}₮
                                        </div>
                                      </>
                                    ) : (
                                      <span className="font-bold text-slate-900">
                                        {formatNumber(charge, 0)}₮
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm">
                          <span className="text-lg font-semibold text-slate-900">
                            Нийт дүн:
                          </span>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatNumber(
                              calculateTotalChargesForResident(
                                ashiglaltiinZardluud,
                                selectedZardalRecord.davkhar
                              ),
                              0
                            )}
                            ₮
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => {
                        setShowZardalModal(false);
                        setSelectedZardalRecord(null);
                      }}
                      className="w-full px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg"
                    >
                      Хаах
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </ModalPortal>
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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </div>
  );
}
