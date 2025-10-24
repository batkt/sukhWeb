"use client";

import { useState, useEffect, useRef } from "react";
import {
  Download,
  Search,
  Filter,
  Edit,
  Trash2,
  Settings,
  X,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadOutlined } from "@ant-design/icons";
import {
  useGereeJagsaalt,
  useGereeCRUD,
  Geree as GereeType,
} from "@/lib/useGeree";
import { useAuth } from "@/lib/useAuth";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import uilchilgee from "../../../lib/uilchilgee";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import { notification, DatePicker, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { ModalPortal } from "../../../components/golContent";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";
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
  const router = useRouter();
  const DEFAULT_HIDDEN = ["mail", "aimag", "duureg", "horoo"];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showList2Modal, setShowList2Modal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
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
  const columnMenuRef = useRef<HTMLDivElement | null>(null);
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

  const { token, ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { zardluud } = useAshiglaltiinZardluud();

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
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(e.target as Node)
      ) {
        setShowColumnSelector(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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
    aimag: "",
    duureg: "",
    horoo: "",
    baingiinKhayag: "",
    gereeniiDugaar: "",
    gereeniiOgnoo: "",
    turul: "Үндсэн",
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

  // Compute next contract number from existing list
  const computeNextGereeDugaar = () => {
    const nums = (contracts || [])
      .map((c: any) =>
        parseInt(String(c?.gereeniiDugaar || "").replace(/[^0-9]/g, ""), 10)
      )
      .filter((n: number) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return String(max + 1);
  };

  // Sum utilization expenses
  const uilchilgeeNiit = (zardluud || []).reduce(
    (sum: number, z: any) =>
      sum + (Number(z?.tariff) || 0) + (Number(z?.suuriKhuraamj) || 0),
    0
  );

  // Validation helpers
  const hasAnyPhone = (arr: any) =>
    Array.isArray(arr) && arr.some((x) => String(x || "").trim() !== "");
  const isStepValid = (step: number) => {
    if (step === 1) {
      const baseValid =
        String(newContract.ovog || "").trim() !== "" &&
        String(newContract.ner || "").trim() !== "" &&
        String(newContract.register || "").trim() !== "" &&
        hasAnyPhone(newContract.utas) &&
        String(newContract.aimag || "").trim() !== "";
      const ubExtraValid =
        newContract.aimag !== "Улаанбаатар" ||
        (String(newContract.duureg || "").trim() !== "" &&
          String(newContract.horoo || "").trim() !== "");
      return baseValid && ubExtraValid;
    }
    if (step === 2) {
      return (
        String(newContract.gereeniiDugaar || "").trim() !== "" &&
        String(newContract.gereeniiOgnoo || "").trim() !== "" &&
        String(newContract.ekhlekhOgnoo || "").trim() !== "" &&
        String(newContract.duusakhOgnoo || "").trim() !== "" &&
        String(newContract.tulukhOgnoo || "").trim() !== "" &&
        Number(newContract.khugatsaa) > 0
      );
    }
    if (step === 3) {
      return (
        String(newContract.suhNer || "").trim() !== "" &&
        String(newContract.suhRegister || "").trim() !== "" &&
        hasAnyPhone(newContract.suhUtas)
      );
    }
    if (step === 4) {
      return (
        newContract.suhTulbur !== undefined &&
        newContract.suhTulbur !== null &&
        String(newContract.suhTulbur) !== "" &&
        !isNaN(Number(newContract.suhTulbur))
      );
    }
    return true;
  };
  const isFormValid = () => [1, 2, 3, 4].every((s) => isStepValid(s));

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

    if (!isFormValid()) {
      notification.error({
        message: "Талбар хүрэлцэхгүй",
        description: "Бүх шаардлагатай талбарыг зөв бөглөнө үү",
      });
      return;
    }

    const success = await gereeUusgekh(newContract);
    if (success) {
      setShowCreateModal(false);
      await gereeJagsaaltMutate();
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
    setCurrentStep(1);
    setNewContract((prev: any) => ({
      ...prev,
      ner: contract.ner || "",
      gereeTurul: contract.gereeTurul || "",
      davkhar: contract.davkhar || "",
      toot: contract.toot || "",
      startDate: contract.startDate || "",
      gereeniiDugaar: contract.gereeniiDugaar || "",
      // Always store as array for inputs that use .join(", ")
      utas: Array.isArray(contract.utas)
        ? contract.utas
        : contract.utas
        ? String(contract.utas)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [""],
      // Prefill SÖH phones too (array-safe)
      suhUtas: Array.isArray(contract.suhUtas)
        ? contract.suhUtas
        : contract.suhUtas
        ? String(contract.suhUtas)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [""],
      // Form binds to "mail", not "email"
      mail: contract.mail || contract.email || "",
    }));
    setShowCreateModal(true);
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

  // Keep derived fields in sync when modal opens or data loads
  useEffect(() => {
    if (showCreateModal && !editingContract) {
      setNewContract((prev: any) => ({
        ...prev,
        gereeniiDugaar: prev.gereeniiDugaar || computeNextGereeDugaar(),
        uilchilgeeniiZardal: uilchilgeeNiit,
        // SÖХ defaults if empty
        suhNer: prev.suhNer || baiguullaga?.ner || "",
        suhRegister: prev.suhRegister || baiguullaga?.register || "",
        suhUtas:
          (prev.suhUtas && prev.suhUtas.length && prev.suhUtas) ||
          (baiguullaga?.utas ? [String(baiguullaga.utas)] : [""]),
        suhMail: prev.suhMail || baiguullaga?.email || "",
      }));
    }
  }, [showCreateModal, editingContract, uilchilgeeNiit, baiguullaga]);

  // Step 4: Fetch recent invoices (нэхэмжлэх) for the organization
  const [invLoading, setInvLoading] = useState(false);
  const [invItems, setInvItems] = useState<any[]>([]);
  useEffect(() => {
    const run = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      if (currentStep !== 4) return;
      try {
        setInvLoading(true);
        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 10,
            query: { baiguullagiinId: ajiltan.baiguullagiinId },
          },
        });
        const data = resp.data;
        const list = Array.isArray(data?.jagsaalt)
          ? data.jagsaalt
          : Array.isArray(data)
          ? data
          : [];
        setInvItems(list);
      } catch (e) {
        setInvItems([]);
      } finally {
        setInvLoading(false);
      }
    };
    run();
  }, [currentStep, token, ajiltan?.baiguullagiinId]);

  return (
    <div className="min-h-screen">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-3xl font-bold text-theme"
          >
            Гэрээ
          </motion.h1>
          <p className="text-sm mt-1 text-subtle">
            Гэрээг удирдах, шинэ гэрээ байгуулах болон загварууд
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditingContract(null);
              setCurrentStep(1);
              setNewContract({
                ovog: "",
                ner: "",
                register: "",
                utas: [""],
                mail: "",
                khayag: "",
                aimag: "",
                duureg: "",
                horoo: "",
                baingiinKhayag: "",
                // Auto next contract number
                gereeniiDugaar: computeNextGereeDugaar(),
                gereeniiOgnoo: "",
                turul: "Үндсэн",
                ekhlekhOgnoo: "",
                duusakhOgnoo: "",
                tulukhOgnoo: "",
                khugatsaa: 0,
                // Prefill from organization (SÖХ info)
                suhNer: baiguullaga?.ner || "",
                suhRegister: baiguullaga?.register || "",
                suhUtas: baiguullaga?.utas ? [String(baiguullaga.utas)] : [""],
                suhMail: baiguullaga?.email || "",
                suhGariinUseg: "",
                suhTamga: "",
                suhTulbur: "",
                suhTulburUsgeer: "",
                suhKhugatsaa: 0,
                sukhKhungulult: 0,
                // Auto from utilization expenses
                uilchilgeeniiZardal: uilchilgeeNiit,
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
            className="btn-minimal"
          >
            Гэрээ байгуулах
          </button>
          <button
            onClick={() => setShowList2Modal(true)}
            className="btn-minimal"
          >
            Гэрээний Загвар
          </button>
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="btn-minimal"
          >
            Гэрээний загвар татах
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--panel-text)] opacity-50" />
          <input
            type="text"
            placeholder="Хайх..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl neo-input:focus border-transparent backdrop-blur-xl transition-all text-theme"
          />
        </div>

        <div className="relative" ref={columnMenuRef}>
          <button
            onClick={() => setShowColumnSelector((s) => !s)}
            className="btn-neu"
            aria-expanded={showColumnSelector}
            aria-haspopup="menu"
          >
            <Settings className="w-5 h-5" />
            Багана сонгох
          </button>

          {showColumnSelector && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 rounded-xl menu-surface p-3 z-[80]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-theme">Багана</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs px-2 py-1"
                    onClick={() =>
                      setVisibleColumns(ALL_COLUMNS.map((c) => c.key))
                    }
                  >
                    Бүгд
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1"
                    onClick={() =>
                      setVisibleColumns(
                        ALL_COLUMNS.filter(
                          (c) => c.default && !DEFAULT_HIDDEN.includes(c.key)
                        ).map((c) => c.key)
                      )
                    }
                  >
                    Үндсэн
                  </button>
                  <button
                    type="button"
                    className=" text-xs px-2 py-1"
                    onClick={() => setVisibleColumns([])}
                  >
                    Цэвэрлэх
                  </button>
                </div>
              </div>
              <div className="max-h-70 overflow-y-auto space-y-1">
                {ALL_COLUMNS.map((col) => {
                  const checked = visibleColumns.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 text-sm text-theme hover:menu-surface/80 px-2 py-1.5 rounded-2xl cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setVisibleColumns((prev) =>
                            prev.includes(col.key)
                              ? prev.filter((k) => k !== col.key)
                              : [...prev, col.key]
                          )
                        }
                        style={{ accentColor: "var(--panel-text)" }}
                      />
                      {col.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isValidatingGeree ? (
        <div className="text-center py-8 text-subtle">Уншиж байна...</div>
      ) : (
        <div>
          <div className="table-surface overflow-hidden rounded-2xl mt-10 w-full">
            <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
              <div className="overflow-y-auto custom-scrollbar w-full">
                <table className="table-ui text-sm min-w-full">
                  <thead>
                    <tr>
                      <th className="p-3 text-xs font-semibold text-theme text-center w-12">
                        №
                      </th>
                      {visibleColumns.map((columnKey) => {
                        const column = ALL_COLUMNS.find(
                          (col) => col.key === columnKey
                        );
                        return (
                          <th
                            key={columnKey}
                            className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap"
                          >
                            {column?.label}
                          </th>
                        );
                      })}
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentContracts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={visibleColumns.length + 2}
                          className="p-8 text-center text-subtle"
                        >
                          Гэрээ олдсонгүй
                        </td>
                      </tr>
                    ) : (
                      currentContracts.map((contract: any, idx: number) => (
                        <tr
                          key={contract._id || idx}
                          className="transition-colors border-b last:border-b-0"
                        >
                          <td className="p-3 text-center text-theme">
                            {startIndex + idx + 1}
                          </td>
                          {visibleColumns.map((columnKey) => (
                            <td
                              key={columnKey}
                              className="p-3 text-theme whitespace-nowrap text-center"
                            >
                              {renderCellValue(contract, columnKey)}
                            </td>
                          ))}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEdit(contract)}
                                className="p-2 rounded-2xl action-edit hover:bg-white/10 transition-colors"
                                title="Засах"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  contract._id && handleDelete(contract._id)
                                }
                                className="p-2 rounded-2xl action-delete hover:bg-white/10 transition-colors"
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

            <div className="flex flex-col sm:flex-row w-full px-1 gap-3 mt-3">
              <div className="flex items-end gap-2 sm:ml-auto !mt-2 sm:mt-0">
                <PageSongokh
                  value={rowsPerPage}
                  onChange={(v) => {
                    setRowsPerPage(v);
                    setCurrentPage(1);
                  }}
                  className=""
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl h-[85vh] max-h-[90vh] rounded-2xl bg-white shadow-2xl p-0 flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingContract ? "Гэрээ засах" : "Шинэ гэрээ байгуулах"}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
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
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center gap-3 px-6 my-6">
                    {[
                      "Хувийн мэдээлэл",
                      "Гэрээний дугаар",
                      "СӨХ мэдээлэл",
                      "Төлбөр",
                    ].map((label, i) => {
                      const step = i + 1;
                      const active = currentStep === step;
                      const done = currentStep > step;
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                              active
                                ? "bg-sky-700 text-white"
                                : done
                                ? "bg-blue-200 text-slate-800"
                                : "bg-gray-200 text-slate-700"
                            }`}
                          >
                            {step}
                          </div>
                          <span
                            className={`text-sm ${
                              active
                                ? "text-slate-900 font-semibold"
                                : "text-slate-600"
                            }`}
                          >
                            {label}
                          </span>
                          {step < 4 && (
                            <div className="w-8 h-[2px] bg-gray-200 mx-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 space-y-6">
                    <div className="min-h-[60vh]">
                      {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Гэрээний төрөл
                            </label>
                            <TusgaiZagvar
                              tone="neutral"
                              value={newContract.turul}
                              onChange={(val) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  turul: val,
                                }))
                              }
                              options={[
                                { value: "Үндсэн", label: "Үндсэн" },
                                { value: "Түр", label: "Түр" },
                              ]}
                              className="w-full"
                              placeholder="Сонгох..."
                            />
                          </div>
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Аймаг
                            </label>
                            <TusgaiZagvar
                              tone="neutral"
                              value={newContract.aimag}
                              onChange={(val) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  aimag: val,
                                  khayag: val,
                                  duureg: "",
                                  horoo: "",
                                }))
                              }
                              options={mongoliaProvinces.map((p) => ({
                                value: p,
                                label: p,
                              }))}
                              className="w-full"
                              placeholder="Сонгох..."
                            />
                          </div>
                          {newContract.aimag === "Улаанбаатар" && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Дүүрэг
                                </label>
                                <TusgaiZagvar
                                  tone="neutral"
                                  value={newContract.duureg}
                                  onChange={(val) =>
                                    setNewContract((prev: any) => ({
                                      ...prev,
                                      duureg: val,
                                      horoo: "",
                                    }))
                                  }
                                  options={(
                                    districts[newContract.aimag] || []
                                  ).map((d) => ({ value: d, label: d }))}
                                  className="w-full"
                                  placeholder="Сонгох..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Хороо
                                </label>
                                <TusgaiZagvar
                                  tone="neutral"
                                  value={newContract.horoo}
                                  onChange={(val) =>
                                    setNewContract((prev: any) => ({
                                      ...prev,
                                      horoo: val,
                                    }))
                                  }
                                  options={(
                                    subDistricts[newContract.duureg] || []
                                  ).map((sd) => ({ value: sd, label: sd }))}
                                  className="w-full"
                                  placeholder="Сонгох..."
                                />
                              </div>
                            </>
                          )}
                          {newContract.turul !== "Үндсэн" && (
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
                                className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {/* Step 2: Гэрээний дугаар, огноо, хугацаа */}
                      {currentStep === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Гэрээний огноо
                            </label>
                            <DatePicker
                              className="w-full"
                              value={
                                newContract.gereeniiOgnoo
                                  ? dayjs(newContract.gereeniiOgnoo)
                                  : null
                              }
                              onChange={(d) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  gereeniiOgnoo: d
                                    ? d.format("YYYY-MM-DD")
                                    : "",
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Эхлэх/Дуусах огноо
                            </label>
                            <DatePicker.RangePicker
                              className="w-full"
                              value={
                                newContract.ekhlekhOgnoo &&
                                newContract.duusakhOgnoo
                                  ? [
                                      dayjs(newContract.ekhlekhOgnoo),
                                      dayjs(newContract.duusakhOgnoo),
                                    ]
                                  : null
                              }
                              onChange={(vals) => {
                                const [start, end] = (vals || []) as Dayjs[];
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  ekhlekhOgnoo: start
                                    ? start.format("YYYY-MM-DD")
                                    : "",
                                  duusakhOgnoo: end
                                    ? end.format("YYYY-MM-DD")
                                    : "",
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Төлөх огноо
                            </label>
                            <DatePicker
                              className="w-full"
                              value={
                                newContract.tulukhOgnoo
                                  ? dayjs(newContract.tulukhOgnoo)
                                  : null
                              }
                              onChange={(d) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  tulukhOgnoo: d ? d.format("YYYY-MM-DD") : "",
                                }))
                              }
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                        </div>
                      )}
                      {/* Step 3: СӨХ мэдээлэл */}
                      {currentStep === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Үйлчилгээний зардал
                            </label>
                            <input
                              type="number"
                              value={newContract.uilchilgeeniiZardal}
                              readOnly
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Ашиглалтын зардлуудын нийлбэр автоматаар
                              тооцоологдоно
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Барьцааны дүн
                            </label>
                            <input
                              type="number"
                              value={newContract.baritsaaAvakhDun}
                              onChange={(e) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  baritsaaAvakhDun: Number(e.target.value),
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
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
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Нэхэмжлэхийн сүүлийн бичилтүүд
                            </label>
                            <div className="rounded-2xl border border-gray-200 p-3">
                              {invLoading ? (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Spin size="small" /> Ачааллаж байна...
                                </div>
                              ) : invItems.length === 0 ? (
                                <div className="text-slate-500 text-sm">
                                  Мэдээлэл олдсонгүй
                                </div>
                              ) : (
                                <ul className="space-y-2">
                                  {invItems
                                    .slice(0, 5)
                                    .map((it: any, idx: number) => (
                                      <li
                                        key={idx}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span className="text-slate-700 truncate pr-2">
                                          {it.ner ||
                                            it.turul ||
                                            it.turulNer ||
                                            "Нэхэмжлэх"}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                          {(
                                            it.niitTulbur ??
                                            it.niitDun ??
                                            it.total ??
                                            0
                                          ).toLocaleString()}
                                          ₮
                                        </span>
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between px-6 py-4 border-t sticky bottom-4 left-0 right-0">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentStep((s: number) => Math.max(1, s - 1))
                        }
                        className="btn-minimal btn-minimal-ghost btn-back"
                        disabled={currentStep === 1}
                      >
                        Буцах
                      </button>
                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep((s: number) => Math.min(4, s + 1));
                          }}
                          className="btn-minimal btn-next"
                        >
                          Дараах
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isFormValid()}
                          className="btn-minimal btn-save h-11 min-w-[140px]"
                        >
                          {editingContract ? "Хадгалах" : "Гэрээ үүсгэх"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showList2Modal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
                  <h3 className="text-xl font-semibold text-slate-900">
                    Гэрээний Загвар
                  </h3>
                  <button
                    onClick={() => {
                      setShowList2Modal(false);
                      router.push("/geree/zagvar/gereeniiZagvar");
                    }}
                    className="btn-minimal"
                  >
                    Шинэ загвар
                  </button>
                </div>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {(zagvaruud || []).map((z: any) => (
                    <div
                      key={z._id}
                      className="flex items-center justify-between p-3 rounded-2xl border"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {z.ner}
                        </div>
                        <div className="text-sm text-slate-600">{z.turul}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewTemplate(z._id)}
                          className="p-2 hover:bg-blue-100 rounded-2xl"
                          title="Харах"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(z._id)}
                          className="p-2 hover:bg-blue-100 rounded-2xl"
                          title="Засах"
                        >
                          <Edit className="w-4 h-4 action-edit" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(z._id)}
                          className="p-2 hover:bg-red-50 rounded-2xl action-delete"
                          title="Устгах"
                        >
                          <Trash2 className="w-4 h-4 action-delete" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showTemplatesModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              onClick={() => setShowTemplatesModal(false)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Гэрээний загвар татах
                  </h3>
                  <button
                    onClick={() => setShowTemplatesModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {templates.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {t.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {t.description}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadTemplate(t.type)}
                        className="btn-minimal"
                      >
                        <Download className="w-4 h-4" />
                        Татах
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}
