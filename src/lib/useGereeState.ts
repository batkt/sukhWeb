import { useState, useRef, useEffect } from "react";
import { ALL_COLUMNS } from "@/app/geree/columns";

export function useGereeState(searchParams: any, didInitRef: any) {
  const DEFAULT_HIDDEN = ["aimag"];
  
  const [activeTab, setActiveTab] = useState<"contracts" | "residents" | "employees" | "units">("residents");
  const [showContractModal, setShowContractModal] = useState(false);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showList2Modal, setShowList2Modal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyContract, setHistoryContract] = useState<any | null>(null);
  const [showAddTootModal, setShowAddTootModal] = useState(false);
  const [showDeleteResidentModal, setShowDeleteResidentModal] = useState(false);
  const [showDeleteEmployeeModal, setShowDeleteEmployeeModal] = useState(false);
  const [showDeleteUnitModal, setShowDeleteUnitModal] = useState(false);
  const [showDeleteFloorModal, setShowDeleteFloorModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAvlagaModal, setShowAvlagaModal] = useState(false);

  const [addTootFloor, setAddTootFloor] = useState<string>("");
  const [addTootValue, setAddTootValue] = useState<string>("");
  
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [selectAllContracts, setSelectAllContracts] = useState(false);
  
  const [paymentResident, setPaymentResident] = useState<any | null>(null);
  const [paymentIncludeEkhniiUldegdel, setPaymentIncludeEkhniiUldegdel] = useState(false);
  const [paymentTailbar, setPaymentTailbar] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter((col) => col.default && !DEFAULT_HIDDEN.includes(col.key)).map((col) => col.key)
  );

  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [editingResident, setEditingResident] = useState<any | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [invoicePreviewData, setInvoicePreviewData] = useState<any>(null);

  const [residentToDelete, setResidentToDelete] = useState<any | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<{ floor: string; unit: string } | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortKey, setSortKey] = useState<"createdAt" | "toot" | "orts" | "davkhar">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const [resPage, setResPage] = useState(1);
  const [resPageSize, setResPageSize] = useState(50);
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);
  const [unitPage, setUnitPage] = useState(1);
  const [unitPageSize, setUnitPageSize] = useState(50);

  // Default Орц for units tab is "1" (no "Бүгд" option in select)
  const [selectedOrts, setSelectedOrts] = useState<string>("1");
  const [selectedDawkhar, setSelectedDawkhar] = useState<string>("");
  const [selectedOrtsForContracts, setSelectedOrtsForContracts] =
    useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "cancelled"
  >("all");
  const [unitStatusFilter, setUnitStatusFilter] = useState<
    "all" | "occupied" | "free"
  >("all");
  const [isSavingUnits, setIsSavingUnits] = useState(false);
  const [isUploadingResidents, setIsUploadingResidents] = useState(false);
  const [isUploadingUnits, setIsUploadingUnits] = useState(false);

  const [newContract, setNewContract] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: [""],
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
    bairniiNer: "",
    orts: "",
    toot: 0,
    davkhar: "",
    temdeglel: "",
  });

  const [newResident, setNewResident] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: [""],
    khayag: "",
    aimag: "Улаанбаатар",
    duureg: "",
    horoo: "",
    orts: "",
    toot: "",
    davkhar: "",
    tsahilgaaniiZaalt: "",
    turul: "Үндсэн",
    tailbar: "",
    ekhniiUldegdel: 0,
  });

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

  const residentExcelInputRef = useRef<HTMLInputElement | null>(null);
  const unitExcelInputRef = useRef<HTMLInputElement | null>(null);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  // Initialize from URL tab
  useEffect(() => {
    if (didInitRef.current) return;
    const t = searchParams.get("tab");
    if (t === "contracts" || t === "residents" || t === "employees" || t === "units") {
      setActiveTab(t as any);
    }
    didInitRef.current = true;
  }, [searchParams]);

  return {
    activeTab,
    setActiveTab,
    showContractModal,
    setShowContractModal,
    showResidentModal,
    setShowResidentModal,
    showEmployeeModal,
    setShowEmployeeModal,
    showList2Modal,
    setShowList2Modal,
    showTemplatesModal,
    setShowTemplatesModal,
    showPreviewModal,
    setShowPreviewModal,
    showInvoicePreviewModal,
    setShowInvoicePreviewModal,
    showHistoryModal,
    setShowHistoryModal,
    historyContract,
    setHistoryContract,
    showAddTootModal,
    setShowAddTootModal,
    showDeleteResidentModal,
    setShowDeleteResidentModal,
    showDeleteEmployeeModal,
    setShowDeleteEmployeeModal,
    showDeleteUnitModal,
    setShowDeleteUnitModal,
    showDeleteFloorModal,
    setShowDeleteFloorModal,
    showPaymentModal,
    setShowPaymentModal,
    showAvlagaModal,
    setShowAvlagaModal,
    addTootFloor,
    setAddTootFloor,
    addTootValue,
    setAddTootValue,
    selectedContracts,
    setSelectedContracts,
    selectAllContracts,
    setSelectAllContracts,
    paymentResident,
    setPaymentResident,
    paymentIncludeEkhniiUldegdel,
    setPaymentIncludeEkhniiUldegdel,
    paymentTailbar,
    setPaymentTailbar,
    isProcessingPayment,
    setIsProcessingPayment,
    currentStep,
    setCurrentStep,
    visibleColumns,
    setVisibleColumns,
    editingContract,
    setEditingContract,
    editingResident,
    setEditingResident,
    editingEmployee,
    setEditingEmployee,
    previewTemplate,
    setPreviewTemplate,
    invoicePreviewData,
    setInvoicePreviewData,
    residentToDelete,
    setResidentToDelete,
    employeeToDelete,
    setEmployeeToDelete,
    unitToDelete,
    setUnitToDelete,
    floorToDelete,
    setFloorToDelete,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    showColumnSelector,
    setShowColumnSelector,
    resPage,
    setResPage,
    resPageSize,
    setResPageSize,
    empPage,
    setEmpPage,
    empPageSize,
    setEmpPageSize,
    unitPage,
    setUnitPage,
    unitPageSize,
    setUnitPageSize,
    selectedOrts,
    setSelectedOrts,
    selectedDawkhar,
    setSelectedDawkhar,
    selectedOrtsForContracts,
    setSelectedOrtsForContracts,
    statusFilter,
    setStatusFilter,
    unitStatusFilter,
    setUnitStatusFilter,
    isSavingUnits,
    setIsSavingUnits,
    isUploadingResidents,
    setIsUploadingResidents,
    isUploadingUnits,
    setIsUploadingUnits,
    newContract,
    setNewContract,
    newResident,
    setNewResident,
    newEmployee,
    setNewEmployee,
    residentExcelInputRef,
    unitExcelInputRef,
    columnMenuRef,
  };
}