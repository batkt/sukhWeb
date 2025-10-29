"use client";

import React from "react";
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
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import uilchilgee, { socket } from "../../../lib/uilchilgee";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import toast from "react-hot-toast";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { ModalPortal } from "../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import LordIcon from "@/components/ui/LordIcon";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  isValidName,
  isValidRegister,
  areValidPhones,
  explainRegisterRule,
  explainPhoneRule,
  normalizeRegister,
} from "@/lib/validation";
import createMethod from "../../../tools/function/createMethod";
import updateMethod from "../../../tools/function/updateMethod";
import deleteMethod from "../../../tools/function/deleteMethod";
import { set } from "lodash";
export const ALL_COLUMNS = [
  // { key: "ovog", label: "Овог", default: true },
  { key: "ner", label: "Нэр", default: true },
  { key: "utas", label: "Холбоо барих", default: true },
  { key: "mail", label: "И-мэйл", default: true },
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
  const DEFAULT_HIDDEN = ["aimag", "duureg", "horoo"];

  // Which section to show: contracts, residents, or employees
  const [activeTab, setActiveTab] = useState<
    "contracts" | "residents" | "employees"
  >("contracts");

  // Separate modals to avoid layout differences breaking sticky footers
  const [showContractModal, setShowContractModal] = useState(false);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [showList2Modal, setShowList2Modal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // Container refs for modal panels to scope Enter key primary lookup
  const contractRef = useRef<HTMLDivElement | null>(null);
  const residentRef = useRef<HTMLDivElement | null>(null);
  const employeeRef = useRef<HTMLDivElement | null>(null);
  const list2Ref = useRef<HTMLDivElement | null>(null);
  const templatesRef = useRef<HTMLDivElement | null>(null);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
  ];

  const districts: Record<string, string[]> = {
    Улаанбаатар: [
      "Сүхбаатар",
      "Баянгол",
      "Чингэлтэй",
      "Хан-Уул",
      "Баянзүрх",
      "Сонгинохайрхан",
      "Налайх",
      "Багануур",
      "Багахангай",
    ],
    Архангай: [
      "Цэцэрлэг",
      "Ихтамир",
      "Өлзийт",
      "Хотонт",
      "Тариат",
      "Хайрхан",
      "Хашаат",
      "Өндөр-Улаан",
      "Жаргалант",
    ],
    "Баян-Өлгий": ["Өлгий", "Буянт", "Толбо", "Цэнгэл", "Сагсай", "Алтай"],
    Баянхонгор: [
      "Баянхонгор",
      "Бууцагаан",
      "Баян-Овоо",
      "Жаргалант",
      "Шинэжинст",
      "Галуут",
    ],
    Булган: ["Булган", "Баяннуур", "Сайхан", "Бүрэгхангай", "Могод", "Орхон"],
    "Говь-Алтай": [
      "Алтай",
      "Тайшир",
      "Есөнбулаг",
      "Цогт",
      "Баян-Уул",
      "Хөхморьт",
      "Тонхил",
    ],
    Говьсүмбэр: ["Чойр", "Шивээговь", "Баянтал"],
    "Дархан-Уул": ["Дархан", "Орхон", "Хонгор", "Шарын гол"],
    Дорноговь: [
      "Сайншанд",
      "Замын-Үүд",
      "Эрдэнэ",
      "Алтанширээ",
      "Айраг",
      "Хатанбулаг",
    ],
    Дорнод: ["Чойбалсан", "Баянтүмэн", "Булган", "Халхгол", "Гурванзагал"],
    Дундговь: [
      "Мандалговь",
      "Говь-Угтаал",
      "Дэлгэрхангай",
      "Адаацаг",
      "Өлзийт",
    ],
    Завхан: [
      "Улиастай",
      "Идэр",
      "Тэлмэн",
      "Яруу",
      "Тосонцэнгэл",
      "Баянтэс",
      "Отгон",
    ],
    Өвөрхангай: ["Арвайхээр", "Баян-Өндөр", "Бат-Өлзий", "Тарагт", "Хужирт"],
    Өмнөговь: ["Даланзадгад", "Манлай", "Цогтцэций", "Ханбогд", "Баяндалай"],
    Сүхбаатар: ["Баруун-Урт", "Мөнххаан", "Түвшинширээ", "Асгат", "Онгон"],
    Сэлэнгэ: [
      "Сүхбаатар",
      "Алтанбулаг",
      "Зүүнбүрэн",
      "Орхон",
      "Шаамар",
      "Мандал",
    ],
    Төв: [
      "Зуунмод",
      "Баянчандмань",
      "Баянцогт",
      "Баян",
      "Сэргэлэн",
      "Аргалант",
    ],
    Увс: ["Улаангом", "Баруунтуруун", "Зүүнговь", "Ховд", "Малчин", "Сагил"],
    Ховд: ["Ховд", "Булган", "Жаргалант", "Мянгад", "Дөргөн", "Чандмань"],
    Хэнтий: [
      "Өндөрхаан",
      "Бэрх",
      "Батноров",
      "Дэлгэрхаан",
      "Баянхутаг",
      "Галшар",
    ],
    Орхон: ["Баян-Өндөр", "Жаргалант"],
  };

  const subDistricts: Record<string, string[]> = {
    Сүхбаатар: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
    ],
    Баянгол: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
    ],
    Чингэлтэй: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
    ],
    "Хан-Уул": [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
    ],
    Баянзүрх: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
    ],
    Сонгинохайрхан: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
    ],
    Налайх: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
    ],
    Багануур: ["1-р хороо", "2-р хороо", "3-р хороо", "4-р хороо", "5-р хороо"],
    Багахангай: ["1-р хороо", "2-р хороо"],
  };

  const { token, ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { zardluud } = useAshiglaltiinZardluud();
  // Residents list
  const {
    orshinSuugchGaralt,
    orshinSuugchJagsaaltMutate,
    setOrshinSuugchKhuudaslalt,
    isValidating: isValidatingSuugch,
  } = useOrshinSuugchJagsaalt(token || "", ajiltan?.baiguullagiinId || "", {});
  // Employees list
  const {
    ajilchdiinGaralt,
    ajiltniiJagsaaltMutate,
    setAjiltniiKhuudaslalt,
    isValidating: isValidatingAjiltan,
  } = useAjiltniiJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    undefined,
    {}
  );

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

  // Pagination for residents/employees
  const [resPage, setResPage] = useState(1);
  const [resPageSize, setResPageSize] = useState(10);
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);

  // Editing flags
  const [editingResident, setEditingResident] = useState<any | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [newEmployee, setNewEmployee] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: "",
    email: "",
    albanTushaal: "",
    ajildOrsonOgnoo: "",
    nevtrekhNer: "",
    nuutsUg: "",
  });

  // Keyboard shortcuts for all modals
  useModalHotkeys({
    isOpen: showContractModal,
    onClose: () => setShowContractModal(false),
    container: contractRef.current,
  });
  useModalHotkeys({
    isOpen: showResidentModal,
    onClose: () => setShowResidentModal(false),
    container: residentRef.current,
  });
  useModalHotkeys({
    isOpen: showEmployeeModal,
    onClose: () => setShowEmployeeModal(false),
    container: employeeRef.current,
  });
  useModalHotkeys({
    isOpen: showList2Modal,
    onClose: () => setShowList2Modal(false),
    container: list2Ref.current,
  });
  useModalHotkeys({
    isOpen: showTemplatesModal,
    onClose: () => setShowTemplatesModal(false),
    container: templatesRef.current,
  });

  useEffect(() => {
    if (activeTab === "contracts") {
      setGereeKhuudaslalt((prev) => ({
        ...prev,
        search: searchTerm,
        khuudasniiDugaar: 1,
      }));
    } else if (activeTab === "residents") {
      setOrshinSuugchKhuudaslalt((prev: any) => ({
        ...prev,
        search: searchTerm,
        khuudasniiDugaar: 1,
      }));
    } else if (activeTab === "employees") {
      setAjiltniiKhuudaslalt((prev: any) => ({
        ...prev,
        search: searchTerm,
        khuudasniiDugaar: 1,
      }));
    }
  }, [
    activeTab,
    searchTerm,
    setGereeKhuudaslalt,
    setOrshinSuugchKhuudaslalt,
    setAjiltniiKhuudaslalt,
  ]);
  useEffect(() => setMounted(true), []);
  // Initialize both lists on first load (warm SWR caches)
  useEffect(() => {
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: resPageSize,
      search: "",
    });
    setAjiltniiKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: empPageSize,
      search: "",
    });
    orshinSuugchJagsaaltMutate();
    ajiltniiJagsaaltMutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  // Separate state for resident add modal
  const [newResident, setNewResident] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: [""],
    mail: "",
    khayag: "",
    aimag: "Улаанбаатар",
    duureg: "",
    horoo: "",
    // Resident account fields
    nevtrekhNer: "",
    nuutsUg: "",
    // Resident type: Үндсэн | Түр
    turul: "Үндсэн",
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
      const namesOk =
        isValidName(newContract.ovog || "") &&
        isValidName(newContract.ner || "");
      const regOk = isValidRegister(newContract.register || "");
      const phonesOk = areValidPhones(newContract.utas || []);
      return baseValid && ubExtraValid && namesOk && regOk && phonesOk;
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
    return true;
  };
  const isFormValid = () => [1, 2, 3].every((s) => isStepValid(s));

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
      toast.error("Нэвтрэх шаардлагатай");
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

      openSuccessOverlay("Загвар амжилттай татагдлаа");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Загвар татахад алдаа гарлаа");
    }
  };

  const handleDownloadExcel = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
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

      // Lazy load Excel export lib at runtime to avoid bundling failure if missing
      let ExcelCtor: any = null;
      try {
        // Use eval to avoid static resolution during bundling
        const req = eval("require");
        const mod = req("antd-table-saveas-excel");
        ExcelCtor = mod?.Excel;
      } catch (e) {
        ExcelCtor = null;
      }
      if (!ExcelCtor) {
        toast.error(
          "Excel экспорт хийх боломжгүй байна. 'antd-table-saveas-excel' санг суулгана уу."
        );
        return;
      }
      const excel = new ExcelCtor();

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

      openSuccessOverlay("Excel файл амжилттай татагдлаа");
    } catch (error) {
      console.error("Excel download error:", error);
      toast.error("Excel файл татахад алдаа гарлаа");
    }
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate basic fields
    if (!isValidName(newResident.ovog) || !isValidName(newResident.ner)) {
      toast.error(
        "Овог, Нэр зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой)."
      );
      return;
    }
    if (!isValidRegister(newResident.register)) {
      toast.error(explainRegisterRule());
      return;
    }
    if (!areValidPhones(newResident.utas || [])) {
      toast.error(explainPhoneRule());
      return;
    }
    if (!newResident.nuutsUg || String(newResident.nuutsUg).length < 2) {
      toast.error("Нууц үг хамгийн багадаа 2 тэмдэгт байх ёстой.");
      return;
    }

    try {
      const firstPhone = Array.isArray(newResident.utas)
        ? newResident.utas.find((p: any) => String(p || "").trim() !== "") || ""
        : String(newResident.utas || "");

      const payload: any = {
        ner: newResident.ner,
        ovog: newResident.ovog,
        register: newResident.register,
        utas: firstPhone,
        email: newResident.mail,
        mail: newResident.mail,
        khayag: newResident.khayag,
        nevtrekhNer: newResident.nevtrekhNer || firstPhone,
        nuutsUg: newResident.nuutsUg,
        turul: newResident.turul,
        baiguullagiinId: ajiltan?.baiguullagiinId,
        baiguullagiinNer: baiguullaga?.ner,
        erkh: "OrshinSuugch",
        taniltsuulgaKharakhEsekh: true,
      };

      if (newResident.aimag) payload.aimag = newResident.aimag;
      // Prefer user selections; fallback to organization profile
      const deriveStr = (val: any) =>
        typeof val === "string"
          ? val
          : typeof val?.ner === "string"
          ? val.ner
          : "";
      payload.duureg = newResident.duureg || deriveStr(baiguullaga?.duureg);
      payload.horoo = newResident.horoo || deriveStr(baiguullaga?.horoo);
      // Auto-fill building code/name for resident
      payload.soh =
        (baiguullaga as any)?.tokhirgoo?.sohCode || baiguullaga?.ner || "";
      if (barilgiinId) payload.barilgiinId = barilgiinId;

      if (editingResident?._id) {
        await updateMethod("orshinSuugch", token || "", {
          ...payload,
          _id: editingResident._id,
        });
      } else {
        await createMethod("orshinSuugchBurtgey", token || "", payload);
      }
      openSuccessOverlay("Оршин суугч нэмэгдлээ");
      setShowResidentModal(false);
      setEditingResident(null);
      setCurrentStep(1);
      await orshinSuugchJagsaaltMutate();
      setActiveTab("residents");
    } catch (err) {
      toast.error("Нэмэхэд алдаа гарлаа");
    }
  };

  const handleEditResident = (p: any) => {
    setEditingResident(p);
    setNewResident({
      ovog: p.ovog || "",
      ner: p.ner || "",
      register: p.register || "",
      utas: Array.isArray(p.utas)
        ? p.utas.map((u: any) => String(u))
        : p.utas
        ? [String(p.utas)]
        : [""],
      mail: p.mail || p.email || "",
      khayag: p.khayag || "",
      aimag: p.aimag || "Улаанбаатар",
      duureg: p.duureg || "",
      horoo: p.horoo || "",
      soh: p.soh || "",
      davkhar: p.davkhar || "",
      toot: p.toot || "",
      baiguullagiinId: p.baiguullagiinId || p.baiguullagiin_id || "",
      baiguullagiinNer:
        p.baiguullagiinNer || p.baiguullagiinNer || baiguullaga?.ner || "",
      nevtrekhNer: p.nevtrekhNer || (p.utas ? String(p.utas) : "") || "",
      nuutsUg: "",
      turul: p.turul || "Үндсэн",
    });
    setShowResidentModal(true);
  };

  const handleDeleteResident = async (p: any) => {
    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }
    if (!window.confirm(`Та ${p.ovog || ""} ${p.ner || ""}-г устгах уу?`))
      return;
    try {
      // 1) Find related contracts for this resident from the loaded contracts
      const related = Array.isArray(contracts)
        ? contracts.filter(
            (c: any) => String(c?.orshinSuugchId || "") === String(p?._id || "")
          )
        : [];

      for (const c of related) {
        try {
          if (c?._id) await gereeUstgakh(c._id);
        } catch (err) {
          console.error("Failed to delete related contract", c?._id, err);
        }
      }

      await deleteMethod("orshinSuugch", token, p._id || p.id);

      try {
        const s = socket();
        s.emit("orshinSuugch.deleted", { id: p._id || p.id });
        for (const c of related) {
          if (c?._id) s.emit("geree.deleted", { id: c._id });
        }
      } catch (err) {
        console.error("Socket emit failed", err);
      }

      openSuccessOverlay("Устгагдлаа");

      await orshinSuugchJagsaaltMutate();
      await gereeJagsaaltMutate();
    } catch (e) {
      toast.error("Устгахад алдаа гарлаа");
    }
  };

  const handleCreateOrUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }
    try {
      const payload: any = {
        ovog: newEmployee.ovog,
        ner: newEmployee.ner,
        register: newEmployee.register,
        utas: newEmployee.utas,
        email: newEmployee.email,
        mail: newEmployee.email,
        albanTushaal: newEmployee.albanTushaal,
        ajildOrsonOgnoo: newEmployee.ajildOrsonOgnoo
          ? new Date(newEmployee.ajildOrsonOgnoo).toISOString()
          : undefined,
        nevtrekhNer: newEmployee.nevtrekhNer || newEmployee.utas,
        nuutsUg: newEmployee.nuutsUg,
        baiguullagiinId: ajiltan?.baiguullagiinId,
      };
      if (barilgiinId) payload.barilgiinId = barilgiinId;

      if (editingEmployee?._id) {
        await updateMethod("ajiltan", token, {
          ...payload,
          _id: editingEmployee._id,
        });
      } else {
        await createMethod("ajiltan", token, payload);
      }

      openSuccessOverlay("Ажилтны мэдээлэл хадгалагдлаа");
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      setNewEmployee({
        ovog: "",
        ner: "",
        register: "",
        utas: "",
        email: "",
        albanTushaal: "",
        ajildOrsonOgnoo: "",
        nevtrekhNer: "",
        nuutsUg: "",
      });
      await ajiltniiJagsaaltMutate();
      setActiveTab("employees");
    } catch (err) {
      toast.error("Хадгалахад алдаа гарлаа");
    }
  };

  const handleEditEmployee = (p: any) => {
    setEditingEmployee(p);
    setNewEmployee({
      ovog: p.ovog || "",
      ner: p.ner || "",
      register: p.register || "",
      utas: p.utas || "",
      email: p.email || p.mail || "",
      albanTushaal: p.albanTushaal || "",
      ajildOrsonOgnoo: p.ajildOrsonOgnoo
        ? new Date(p.ajildOrsonOgnoo).toISOString().split("T")[0]
        : "",
      nevtrekhNer: p.nevtrekhNer || p.utas || "",
      nuutsUg: "",
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = async (p: any) => {
    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }
    if (!window.confirm(`Та ${p.ovog || ""} ${p.ner || ""}-г устгах уу?`))
      return;
    try {
      await deleteMethod("ajiltan", token, p._id || p.id);
      openSuccessOverlay("Устгагдлаа");
      await ajiltniiJagsaaltMutate();
    } catch (e) {
      toast.error("Устгахад алдаа гарлаа");
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Бүх шаардлагатай талбарыг зөв бөглөнө үү");
      return;
    }

    // Friendly format errors
    if (!isValidName(newContract.ovog) || !isValidName(newContract.ner)) {
      toast.error(
        "Овог, Нэр талбар зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой)."
      );
      return;
    }
    if (!isValidRegister(newContract.register)) {
      toast.error(explainRegisterRule());
      return;
    }
    if (!areValidPhones(newContract.utas || [])) {
      toast.error(explainPhoneRule());
      return;
    }

    const success = await gereeUusgekh(newContract);
    if (success) {
      setShowContractModal(false);
      await gereeJagsaaltMutate();
    }
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingContract?._id) return;

    if (!isFormValid()) {
      toast.error("Бүх шаардлагатай талбарыг зөв бөглөнө үү");
      return;
    }
    if (!isValidName(newContract.ovog) || !isValidName(newContract.ner)) {
      toast.error(
        "Овог, Нэр талбар зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой)."
      );
      return;
    }
    if (!isValidRegister(newContract.register)) {
      toast.error(explainRegisterRule());
      return;
    }
    if (!areValidPhones(newContract.utas || [])) {
      toast.error(explainPhoneRule());
      return;
    }

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
    setShowContractModal(true);
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
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }

    if (window.confirm("Та энэ загварыг устгахдаа итгэлтэй байна уу?")) {
      try {
        await uilchilgee(token).delete(`/gereeniiZagvar/${templateId}`);

        openSuccessOverlay("Загвар амжилттай устгагдлаа");

        zagvarJagsaaltMutate();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Загвар устгахад алдаа гарлаа");
      }
    }
  };
  const handlePreviewTemplate = async (templateId: string) => {
    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
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
      toast.error("Загвар харахад алдаа гарлаа");
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
    if (showContractModal) {
      setNewContract((prev: any) => ({
        ...prev,
        gereeniiDugaar: prev.gereeniiDugaar || computeNextGereeDugaar(),
        uilchilgeeniiZardal: uilchilgeeNiit,
        // SӨХ info is auto-fetched from organization and read-only
        suhNer: baiguullaga?.ner || "",
        suhRegister: baiguullaga?.register || "",
        suhUtas: baiguullaga?.utas
          ? Array.isArray(baiguullaga.utas)
            ? baiguullaga.utas.map((u: any) => String(u))
            : [String(baiguullaga.utas)]
          : [],
        suhMail: baiguullaga?.email || "",
      }));
    }
  }, [showContractModal, uilchilgeeNiit, baiguullaga]);

  // Removed Step 4 (Төлбөр) and related invoice fetch.

  return (
    <div className="min-h-screen">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-3xl font-bold text-theme"
            >
              Гэрээ
            </motion.h1>
            <div
              style={{ width: 64, height: 64 }}
              className="flex items-center"
            >
              <DotLottieReact
                src="https://lottie.host/97f6cb84-58da-46ef-811a-44e3203445c1/rQ76j6FHd8.lottie"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
          <p className="text-sm mt-1 text-subtle">
            Гэрээ, Оршин суугч, Ажилтны жагсаалтуудыг удирдах
          </p>

          <div className="flex mt-3 w-48 pointer-events-none select-none justify-start"></div>
          <div className="mt-3 flex flex-wrap items-center gap-2 tabbar">
            {/* Tabs */}
            <button
              onClick={() => setActiveTab("contracts")}
              className={`tab-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "contracts" ? "is-active" : ""
              }`}
            >
              Гэрээ
            </button>
            <button
              onClick={() => setActiveTab("residents")}
              className={`tab-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "residents" ? "is-active" : ""
              }`}
            >
              Оршин суугч
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`tab-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "employees" ? "is-active" : ""
              }`}
            >
              Ажилтан
            </button>

            {/* Search + Column Selector at the end */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative min-w-[200px] h-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--panel-text)] opacity-50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-full pl-12 pr-4 rounded-2xl border border-transparent bg-[color:var(--surface-bg)] text-theme focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)] transition-all"
                />
              </div>

              {activeTab === "contracts" && (
                <div
                  className="relative flex-shrink-0 h-10"
                  ref={columnMenuRef}
                >
                  <button
                    onClick={() => setShowColumnSelector((s) => !s)}
                    className="btn-neu h-full flex items-center gap-2 px-4 rounded-2xl"
                    aria-expanded={showColumnSelector}
                    aria-haspopup="menu"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-semibold">Багана сонгох</span>
                  </button>

                  {showColumnSelector && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-64 rounded-xl menu-surface p-3 z-[80]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-theme">
                          Багана
                        </span>
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
                                  (c) =>
                                    c.default && !DEFAULT_HIDDEN.includes(c.key)
                                ).map((c) => c.key)
                              )
                            }
                          >
                            Үндсэн
                          </button>
                        </div>
                      </div>

                      <div className="max-h-70 overflow-y-auto space-y-1">
                        {ALL_COLUMNS.map((col) => {
                          const checked = visibleColumns.includes(col.key);
                          return (
                            <label
                              key={col.key}
                              className="flex items-center gap-2 text-sm text-theme hover:bg-[color:var(--surface-hover)] px-2 py-1.5 rounded-2xl cursor-pointer transition-colors"
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
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === "contracts" && (
            <>
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

                    gereeniiDugaar: computeNextGereeDugaar(),
                    gereeniiOgnoo: "",
                    turul: "Үндсэн",
                    ekhlekhOgnoo: "",
                    duusakhOgnoo: "",
                    tulukhOgnoo: "",
                    khugatsaa: 0,

                    suhNer: baiguullaga?.ner || "",
                    suhRegister: baiguullaga?.register || "",
                    suhUtas: baiguullaga?.utas
                      ? [String(baiguullaga.utas)]
                      : [""],
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
                    // login fields (unused for contract mode)
                    nevtrekhNer: "",
                    nuutsUg: "",
                  });
                  setShowContractModal(true);
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
            </>
          )}
          {activeTab === "residents" && (
            <button
              onClick={() => {
                setCurrentStep(1);
                setEditingContract(null);
                setEditingResident(null);
                setNewResident({
                  ovog: "",
                  ner: "",
                  register: "",
                  utas: [""],
                  mail: "",
                  khayag: "",
                  aimag: "Улаанбаатар",
                  duureg: "",
                  horoo: "",
                  nevtrekhNer: "",
                  nuutsUg: "",
                  turul: "Үндсэн",
                });
                setShowResidentModal(true);
              }}
              className="btn-minimal"
            >
              Оршин суугч нэмэх
            </button>
          )}
          {activeTab === "employees" && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setNewEmployee({
                  ovog: "",
                  ner: "",
                  register: "",
                  utas: "",
                  email: "",
                  albanTushaal: "",
                  ajildOrsonOgnoo: "",
                  nevtrekhNer: "",
                  nuutsUg: "",
                });
                setShowEmployeeModal(true);
              }}
              className="btn-minimal"
            >
              Ажилтан нэмэх
            </button>
          )}
        </div>
      </div>

      {activeTab === "contracts" &&
        (isValidatingGeree ? (
          <div className="text-center py-8 text-subtle">Уншиж байна...</div>
        ) : (
          <div>
            <div className="table-surface overflow-visible rounded-2xl w-full">
              <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
                <div className="max-h-[48vh] overflow-y-auto custom-scrollbar w-full">
                  <table className="table-ui text-sm min-w-full">
                    <thead className="z-10 bg-white dark:bg-gray-800">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                          №
                        </th>
                        {visibleColumns.map((columnKey) => {
                          const column = ALL_COLUMNS.find(
                            (col) => col.key === columnKey
                          );
                          return (
                            <th
                              key={columnKey}
                              className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit"
                            >
                              {column?.label}
                            </th>
                          );
                        })}
                        <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit">
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
                                  className="p-2 rounded-2xl action-edit hover-surface transition-colors"
                                  title="Засах"
                                >
                                  <Edit className="w-4 h-4" />
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

              <div className="flex flex-col sm:flex-row w-full px-1 gap-3 z-1005">
                <div className="flex items-end gap-2 !mt-1 sm:ml-auto sm:mt-0 z-1005">
                  <PageSongokh
                    value={rowsPerPage}
                    onChange={(v) => {
                      setRowsPerPage(v);
                      setCurrentPage(1);
                      setGereeKhuudaslalt({
                        khuudasniiDugaar: 1,
                        khuudasniiKhemjee: v,
                        search: searchTerm,
                      });
                    }}
                    className="relative z-30"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

      {activeTab === "residents" &&
        (isValidatingSuugch ? (
          <div className="text-center py-8 text-subtle">Уншиж байна...</div>
        ) : (
          <div className="table-surface overflow-hidden rounded-2xl w-full">
            <div className="rounded-3xl p-6 mb-2 neu-table allow-overflow">
              <div className="max-h-[48vh] overflow-y-auto custom-scrollbar w-full">
                <table className="table-ui text-sm min-w-full">
                  <thead className="z-10 bg-white dark:bg-gray-800">
                    <tr>
                      <th className="p-3 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                        №
                      </th>
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Нэр
                      </th>

                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Холбоо барих
                      </th>
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Төлөв
                      </th>
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!(orshinSuugchGaralt?.jagsaalt || []).length ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-subtle">
                          Хайсан мэдээлэл алга байна
                        </td>
                      </tr>
                    ) : (
                      (orshinSuugchGaralt?.jagsaalt || []).map(
                        (p: any, idx: number) => (
                          <tr
                            key={p._id || idx}
                            className="transition-colors border-b last:border-b-0"
                          >
                            <td className="p-3 text-center text-theme">
                              {idx + 1}
                            </td>
                            <td className="p-3 text-theme whitespace-nowrap text-center">
                              {p.ner}
                            </td>

                            <td className="p-3 text-center">
                              <div className="text-sm text-theme">{p.utas}</div>
                              {p.email && (
                                <div className="text-xs text-theme/70">
                                  {p.email}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold">
                                {p.tuluv || "Төлсөн"}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <div className="flex gap-2 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleEditResident(p)}
                                  className="p-2 rounded-2xl action-edit hover-surface transition-colors"
                                  title="Засах"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteResident(p)}
                                  className="p-2 rounded-2xl action-delete hover-surface transition-colors"
                                  title="Устгах"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full px-1 gap-3 z-1005">
              <div className="flex items-end gap-2 sm:ml-auto sm:mt-0 z-1005">
                <PageSongokh
                  value={resPageSize}
                  onChange={(v) => {
                    setResPageSize(v);
                    setResPage(1);
                    setOrshinSuugchKhuudaslalt({
                      khuudasniiDugaar: 1,
                      khuudasniiKhemjee: v,
                      search: searchTerm,
                    });
                  }}
                  className="z-1006"
                />
              </div>
            </div>
          </div>
        ))}

      {activeTab === "employees" &&
        (isValidatingAjiltan ? (
          <div className="text-center py-8 text-subtle">Уншиж байна...</div>
        ) : (
          <div className="table-surface overflow-hidden rounded-2xl w-full">
            <div className="rounded-3xl p-6 mb-2 neu-table allow-overflow">
              <div className="max-h-[48vh] overflow-y-auto custom-scrollbar w-full">
                <table className="table-ui text-sm min-w-full">
                  <thead className="z-10 bg-white dark:bg-gray-800">
                    <tr>
                      <th className="p-3 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                        №
                      </th>
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Нэр
                      </th>

                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Холбоо барих
                      </th>
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Албан тушаал
                      </th>
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Эрх
                      </th>
                      <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!(ajilchdiinGaralt?.jagsaalt || []).length ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-subtle">
                          Хайсан мэдээлэл алга байна
                        </td>
                      </tr>
                    ) : (
                      (ajilchdiinGaralt?.jagsaalt || []).map(
                        (p: any, idx: number) => (
                          <tr
                            key={p._id || idx}
                            className="transition-colors border-b last:border-b-0"
                          >
                            <td className="p-3 text-center text-theme">
                              {idx + 1}
                            </td>
                            <td className="p-3 text-theme whitespace-nowrap text-center">
                              {p.ner}
                            </td>

                            <td className="p-3 text-center">
                              <div className="text-sm text-theme">{p.utas}</div>
                              {p.email && (
                                <div className="text-xs text-theme/70">
                                  {p.email}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {p.albanTushaal || "-"}
                            </td>
                            <td className="p-3 text-center">{p.erkh || "-"}</td>
                            <td className="p-3 whitespace-nowrap">
                              <div className="flex gap-2 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleEditEmployee(p)}
                                  className="p-2 rounded-2xl action-edit hover-surface transition-colors"
                                  title="Засах"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmployee(p)}
                                  className="p-2 rounded-2xl action-delete hover-surface transition-colors"
                                  title="Устгах"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full px-1 gap-3 z-1005">
              <div className="flex items-end gap-2 sm:ml-auto sm:mt-0 z-1005">
                <PageSongokh
                  value={resPageSize}
                  onChange={(v) => {
                    setEmpPageSize(v);
                    setEmpPage(1);
                    setAjiltniiKhuudaslalt({
                      khuudasniiDugaar: 1,
                      khuudasniiKhemjee: v,
                      search: searchTerm,
                    });
                  }}
                  className="z-1006"
                />
              </div>
            </div>
          </div>
        ))}

      <AnimatePresence>
        {showContractModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={contractRef}
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
                    onClick={() => setShowContractModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
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
                  {
                    <div className="flex justify-center gap-3 px-6 my-10">
                      {[
                        "Хувийн мэдээлэл",
                        "Гэрээний дугаар",
                        "СӨХ мэдээлэл",
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
                            {step < 3 && (
                              <div className="w-8 h-[2px] bg-gray-200 mx-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  }
                  <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-40">
                    <div className="min-h-[60vh]">
                      {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {
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
                          }
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
                              Утас
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={8}
                              value={(newContract.utas?.[0] as any) || ""}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 8);
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  utas: [digits],
                                }));
                              }}
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
                          {newContract.aimag === "Улаанбаатар" ? (
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
                          ) : newContract.aimag ? (
                            // For aimags other than Ulaanbaatar show 'Сум' (use duureg field to store sum)
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Сум
                              </label>
                              <TusgaiZagvar
                                tone="neutral"
                                value={newContract.duureg}
                                onChange={(val) =>
                                  setNewContract((prev: any) => ({
                                    ...prev,
                                    duureg: val,
                                  }))
                                }
                                options={(
                                  districts[newContract.aimag] || []
                                ).map((d) => ({ value: d, label: d }))}
                                className="w-full"
                                placeholder="Сонгох..."
                              />
                            </div>
                          ) : null}
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
                      {null}

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
                            <DatePickerInput
                              className="w-full border"
                              locale="mn"
                              value={
                                newContract.gereeniiOgnoo
                                  ? new Date(newContract.gereeniiOgnoo)
                                  : null
                              }
                              onChange={(value) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  gereeniiOgnoo: value
                                    ? dayjs(value).format("YYYY-MM-DD")
                                    : "",
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Эхлэх/Дуусах огноо
                            </label>
                            <DatePickerInput
                              className="w-full"
                              type="range"
                              locale="mn"
                              value={
                                newContract.ekhlekhOgnoo &&
                                newContract.duusakhOgnoo
                                  ? [
                                      new Date(newContract.ekhlekhOgnoo),
                                      new Date(newContract.duusakhOgnoo),
                                    ]
                                  : undefined
                              }
                              onChange={(vals) => {
                                const [start, end] = (vals || [null, null]) as [
                                  Date | null,
                                  Date | null
                                ];
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  ekhlekhOgnoo: start
                                    ? dayjs(start).format("YYYY-MM-DD")
                                    : "",
                                  duusakhOgnoo: end
                                    ? dayjs(end).format("YYYY-MM-DD")
                                    : "",
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Төлөх огноо
                            </label>
                            <DatePickerInput
                              className="w-full"
                              locale="mn"
                              value={
                                newContract.tulukhOgnoo
                                  ? new Date(newContract.tulukhOgnoo)
                                  : null
                              }
                              onChange={(value) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  tulukhOgnoo: value
                                    ? dayjs(value).format("YYYY-MM-DD")
                                    : "",
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

                      {currentStep === 3 && (
                        <div className="grid grid-cols-1 gap-6">
                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <div className="text-sm text-slate-600 mb-3">
                              СӨХ мэдээлэл байгууллагын мэдээллээс автоматаар
                              бөглөгдөнө.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  Байгууллагын нэр
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {newContract.suhNer || "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  СӨХ-ийн регистр
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {newContract.suhRegister || "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  СӨХ-ийн утас
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {(newContract.suhUtas || []).join(", ") ||
                                    "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  СӨХ-ийн и-мэйл
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {newContract.suhMail || "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="md:col-span-2">
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
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between px-6 py-4 border-t sticky bottom-14 left-0 right-0">
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
                      {currentStep < 3 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep((s: number) => Math.min(3, s + 1));
                          }}
                          className="btn-minimal btn-next"
                          data-modal-primary
                        >
                          Дараах
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isFormValid()}
                          className="btn-minimal btn-save h-11"
                          data-modal-primary
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
        {showResidentModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={residentRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl h-[100vh] max-h-[90vh] rounded-2xl bg-white shadow-2xl p-0 flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingResident
                      ? "Оршин суугчийн мэдээлэл засах"
                      : "Оршин суугч нэмэх"}
                  </h2>
                  <button
                    onClick={() => setShowResidentModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={handleCreateResident}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-28">
                    <div className="min-h-[55vh] grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Төрөл
                        </label>
                        <TusgaiZagvar
                          tone="neutral"
                          value={newResident.turul}
                          onChange={(val) =>
                            setNewResident((prev: any) => ({
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
                          value={newResident.ovog}
                          onChange={(e) =>
                            setNewResident((prev: any) => ({
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
                          value={newResident.ner}
                          onChange={(e) =>
                            setNewResident((prev: any) => ({
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
                          Утас
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={8}
                          value={(newResident.utas?.[0] as any) || ""}
                          onChange={(e) => {
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 8);
                            setNewResident((prev: any) => ({
                              ...prev,
                              utas: [digits],
                            }));
                          }}
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
                          value={newResident.mail}
                          onChange={(e) =>
                            setNewResident((prev: any) => ({
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
                          value={newResident.aimag}
                          onChange={(val) =>
                            setNewResident((prev: any) => ({
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
                      {newResident.aimag === "Улаанбаатар" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Дүүрэг
                            </label>
                            <TusgaiZagvar
                              tone="neutral"
                              value={newResident.duureg}
                              onChange={(val) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  duureg: val,
                                  horoo: "",
                                }))
                              }
                              options={(districts[newResident.aimag] || []).map(
                                (d) => ({ value: d, label: d })
                              )}
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
                              value={newResident.horoo}
                              onChange={(val) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  horoo: val,
                                }))
                              }
                              options={(
                                subDistricts[newResident.duureg] || []
                              ).map((sd) => ({ value: sd, label: sd }))}
                              className="w-full"
                              placeholder="Сонгох..."
                            />
                          </div>
                        </>
                      )}

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            СӨХ нэр
                          </label>
                          <input
                            type="text"
                            value={newResident.soh || ""}
                            onChange={(e) =>
                              setNewResident((prev: any) => ({
                                ...prev,
                                soh: e.target.value,
                              }))
                            }
                            readOnly
                            className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Давхар
                          </label>
                          <input
                            type="text"
                            value={newResident.davkhar || ""}
                            onChange={(e) =>
                              setNewResident((prev: any) => ({
                                ...prev,
                                davkhar: e.target.value,
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
                            value={newResident.toot || ""}
                            onChange={(e) =>
                              setNewResident((prev: any) => ({
                                ...prev,
                                toot: e.target.value,
                              }))
                            }
                            className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Байгууллагын нэр
                          </label>
                          <input
                            type="text"
                            value={
                              newResident.baiguullagiinNer ||
                              baiguullaga?.ner ||
                              ""
                            }
                            readOnly
                            className="w-full p-3 text-slate-900 rounded-2xl border border-gray-200 bg-gray-50"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900">
                          Нэвтрэх мэдээлэл
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Нэвтрэх нэр
                            </label>
                            <input
                              type="text"
                              value={newResident.nevtrekhNer}
                              onChange={(e) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  nevtrekhNer: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              placeholder="Нэвтрэх нэр"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Нууц үг
                            </label>
                            <input
                              type="password"
                              value={newResident.nuutsUg}
                              onChange={(e) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  nuutsUg: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              placeholder="Нууц үг"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end px-6 py-4 border-t sticky bottom-6 left-0 right-0 gap-2">
                      <button
                        type="submit"
                        className="btn-minimal btn-save h-11"
                        data-modal-primary
                      >
                        {editingResident ? "Хадгалах" : "Хадгалах"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResidentModal(false)}
                        className="btn-minimal-ghost btn-cancel min-w-[100px]"
                      >
                        Цуцлах
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showEmployeeModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={employeeRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl p-0 flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingEmployee ? "Ажилтан засах" : "Ажилтан нэмэх"}
                  </h2>
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={handleCreateOrUpdateEmployee}
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Овог
                      </label>
                      <input
                        type="text"
                        value={newEmployee.ovog}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            ovog: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Нэр
                      </label>
                      <input
                        type="text"
                        value={newEmployee.ner}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            ner: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Утас
                      </label>
                      <input
                        type="tel"
                        value={newEmployee.utas}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            utas: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        И-мэйл
                      </label>
                      <input
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Албан тушаал
                      </label>
                      <input
                        type="text"
                        value={newEmployee.albanTushaal}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            albanTushaal: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ажилд орсон огноо
                      </label>
                      <DatePickerInput
                        value={
                          newEmployee.ajildOrsonOgnoo
                            ? new Date(newEmployee.ajildOrsonOgnoo)
                            : null
                        }
                        onChange={(v) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            ajildOrsonOgnoo: v
                              ? new Date(v).toISOString().slice(0, 10)
                              : "",
                          }))
                        }
                        placeholder="Огноо сонгох"
                        className="w-full"
                        required
                        clearable
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Нэвтрэх нэр
                      </label>
                      <input
                        type="text"
                        value={newEmployee.nevtrekhNer}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            nevtrekhNer: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Нууц үг
                      </label>
                      <input
                        type="password"
                        value={newEmployee.nuutsUg}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            nuutsUg: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="btn-minimal btn-save"
                      data-modal-primary
                    >
                      {editingEmployee ? "Хадгалах" : "Хадгалах"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmployeeModal(false)}
                      className="btn-minimal-ghost btn-cancel min-w-[100px]"
                    >
                      Цуцлах
                    </button>
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
                ref={list2Ref}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowList2Modal(false);
                        router.push("/geree/zagvar/gereeniiZagvar");
                      }}
                      className="btn-minimal btn-save"
                    >
                      Шинэ загвар
                    </button>
                    <button
                      onClick={() => setShowList2Modal(false)}
                      className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                      aria-label="Хаах"
                      title="Хаах"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-slate-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
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
                          <LordIcon
                            src="https://cdn.lordicon.com/tyounuzx.json"
                            trigger="hover"
                            size={20}
                          />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(z._id)}
                          className="p-2 hover:bg-blue-100 rounded-2xl"
                          title="Засах"
                        >
                          <LordIcon
                            src="https://cdn.lordicon.com/wuvorxbv.json"
                            trigger="hover"
                            size={20}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(z._id)}
                          className="p-2 hover:bg-red-50 rounded-2xl action-delete"
                          title="Устгах"
                        >
                          <LordIcon
                            src="https://cdn.lordicon.com/kfzfxczd.json"
                            trigger="hover"
                            size={20}
                          />
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
                ref={templatesRef}
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
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
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
                        className="btn-minimal btn-download"
                      >
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
