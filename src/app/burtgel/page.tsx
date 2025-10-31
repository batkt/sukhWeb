// "use client";

// import { useState, useEffect, useRef, useMemo } from "react";
// import { useSearch } from "@/context/SearchContext";
// import {
//   ChevronDown,
//   Users,
//   FileText,
//   Plus,
//   User,
//   Home,
//   Phone,
//   IdCard,
//   Briefcase,
//   Mail,
//   Lock,
//   Search,
//   Edit,
//   Trash2,
//   X,
// } from "lucide-react";
// import { ModalPortal } from "../../../components/golContent";
// import { AnimatePresence, motion } from "framer-motion";
// import { useAuth } from "@/lib/useAuth";
// import toast from "react-hot-toast";
// import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
// import { useGereeJagsaalt } from "@/lib/useGeree";
// import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
// import createMethod from "../../../tools/function/createMethod";
// import updateMethod from "../../../tools/function/updateMethod";
// import deleteMethod from "../../../tools/function/deleteMethod";
// import { aldaaBarigch } from "../../../lib/uilchilgee";
// import {
//   isValidName,
//   isValidRegister,
//   isValidPhone,
//   explainRegisterRule,
//   explainPhoneRule,
//   normalizeRegister,
// } from "@/lib/validation";

// import formatNumber from "../../../tools/function/formatNumber";
// import PageSongokh from "../../../components/selectZagvar/pageSongokh";

// type ModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   children: React.ReactNode;
// };

// const PageModal = ({ isOpen, onClose, title, children }: ModalProps) => {
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "";
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [isOpen]);

//   if (!isOpen) return null;

//   return (
//     <ModalPortal>
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
//             onClick={onClose}
//           >
//             <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//               className="relative w-full max-w-[850px] max-height-[85vh] max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
//             >
//               <div className="flex items-center justify-between p-6">
//                 <h2 className="text-xl font-bold text-slate-900">{title}</h2>
//                 <button
//                   onClick={onClose}
//                   type="button"
//                   className="p-2 rounded-2xl hover:bg-gray-100"
//                 >
//                   <X className="w-6 h-6 text-slate-600" />
//                 </button>
//               </div>
//               <div className="p-6">{children}</div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </ModalPortal>
//   );
// };

// export default function Burtgel() {
//   const {
//     token,
//     ajiltan: currentAjiltan,
//     baiguullaga,
//     barilgiinId,
//   } = useAuth();
//   const formRef = useRef<HTMLFormElement>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [liftFloors, setLiftFloors] = useState<string[]>([]);
//   const [pageSize, setPageSize] = useState(10);
//   const [tootBurtgelList, setTootBurtgelList] = useState<any[]>([]);
//   const [isLoadingToot, setIsLoadingToot] = useState(false);
//   const [selectedBarilga, setSelectedBarilga] = useState<string>("");
//   const [selectedOrts, setSelectedOrts] = useState<string>("");
//   const [selectedDavkhar, setSelectedDavkhar] = useState<string>("");
//   const [ashiglaltiinZardluud, setAshiglaltiinZardluud] = useState<any[]>([]);
//   const [selectedRecord, setSelectedRecord] = useState<any>(null);

//   const [activeTab, setActiveTab] = useState("ajiltanList");
//   const [loading, setLoading] = useState(false);
//   const { searchTerm, setSearchTerm } = useSearch();
//   const [showAjiltanModal, setShowAjiltanModal] = useState(false);
//   const [showSuugchModal, setShowSuugchModal] = useState(false);
//   const [showZardalModal, setShowZardalModal] = useState(false);
//   const [selectedZardalRecord, setSelectedZardalRecord] = useState<any>(null);
//   const [showTootModal, setShowTootModal] = useState(false);

//   // Contracts for structured address options (bairNer/orts/toot) scoped by org/branch
//   const { gereeGaralt } = useGereeJagsaalt(
//     {},
//     token || undefined,
//     currentAjiltan?.baiguullagiinId,
//     undefined
//   );
//   const gereeList = (gereeGaralt?.jagsaalt || []) as any[];

//   interface FormData {
//     ovog: string;
//     ner: string;
//     register: string;
//     khayag: string;
//     utas: string;
//     ajildOrsonOgnoo: string;
//     albanTushaal: string;
//     nevtrekhNer: string;
//     nuutsUg: string;
//     email: string;
//     _id?: string;
//     zasakhEsekh?: boolean;
//     temdeglel?: string;
//   }

//   const {
//     ajilchdiinGaralt: ajiltanData,
//     ajiltniiJagsaaltMutate: ajiltanMutate,
//     setAjiltniiKhuudaslalt: setAjiltanKhuudaslalt,
//     isValidating: ajiltanValidating,
//   } = useAjiltniiJagsaalt(
//     token || "",
//     currentAjiltan?.baiguullagiinId || "",
//     undefined,
//     {}
//   );

//   const {
//     orshinSuugchGaralt: suugchData,
//     orshinSuugchJagsaaltMutate: suugchMutate,
//     setOrshinSuugchKhuudaslalt: setSuugchKhuudaslalt,
//     isValidating: suugchValidating,
//   } = useOrshinSuugchJagsaalt(
//     token || "",
//     currentAjiltan?.baiguullagiinId || "",
//     {}
//   );

//   const activeRecords =
//     activeTab === "ajiltanList"
//       ? ajiltanData?.jagsaalt || []
//       : activeTab === "suugchList"
//       ? suugchData?.jagsaalt || []
//       : [];

//   const isValidating =
//     activeTab === "ajiltanList"
//       ? ajiltanValidating
//       : activeTab === "suugchList"
//       ? suugchValidating
//       : false;

//   const fetchTootBurtgel = async () => {
//     if (!token || !currentAjiltan?.baiguullagiinId) return;

//     setIsLoadingToot(true);
//     try {
//       let url = `http://103.143.40.46:8084/orshinSuugch?baiguullagiinId=${currentAjiltan.baiguullagiinId}&khuudasniiDugaar=1&khuudasniiKhemjee=100`;

//       const response = await fetch(url, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok)
//         throw new Error(`HTTP error! status: ${response.status}`);

//       const data = await response.json();
//       setTootBurtgelList(data.jagsaalt || []);
//     } catch (error) {
//       toast.error("Тоот бүртгэл татахад алдаа гарлаа");
//     } finally {
//       setIsLoadingToot(false);
//     }
//   };
//   const [formData, setFormData] = useState<FormData>({
//     ovog: "",
//     ner: "",
//     register: "",
//     khayag: "",
//     utas: "",
//     ajildOrsonOgnoo: "",
//     albanTushaal: "",
//     nevtrekhNer: "",
//     nuutsUg: "",
//     email: "",
//     temdeglel: "",
//   });

//   // Derived org/branch strings for auto-fill and display
//   const derivedBaiguullagiinId = useMemo(
//     () => currentAjiltan?.baiguullagiinId || "",
//     [currentAjiltan?.baiguullagiinId]
//   );
//   const derivedDuuregStr = useMemo(() => {
//     // Prefer org fields
//     const d: any = baiguullaga?.duureg;
//     let val = "";
//     if (d) {
//       if (typeof d === "string") val = d;
//       else if (typeof d?.ner === "string" && d.ner.trim()) val = d.ner;
//     }
//     if (!val && typeof baiguullaga?.tokhirgoo?.duuregNer === "string") {
//       val = baiguullaga?.tokhirgoo?.duuregNer || "";
//     }
//     // Fallback: try parse from selected building label if it contains commas
//     if (!val && (selectedBarilga || "").includes(",")) {
//       const tokens = (selectedBarilga || "")
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean);
//       if (tokens.length >= 1) val = tokens[0];
//     }
//     return val;
//   }, [baiguullaga, selectedBarilga]);
//   const derivedHorooStr = useMemo(() => {
//     const h: any = baiguullaga?.horoo;
//     let val = "";
//     if (h) {
//       if (typeof h === "string") val = h;
//       else if (typeof h?.ner === "string" && h.ner.trim()) val = h.ner;
//     }
//     // Fallback: parse 2nd token from selected building label
//     if (!val && (selectedBarilga || "").includes(",")) {
//       const tokens = (selectedBarilga || "")
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean);
//       if (tokens.length >= 2) val = tokens[1];
//     }
//     return val;
//   }, [baiguullaga, selectedBarilga]);
//   const derivedSohStr = useMemo(() => {
//     // Prefer selected building; if label contains commas like "Duureg, Horoo, SOH-001",
//     // pick the last token as the SÖH code.
//     if (selectedBarilga) {
//       if (selectedBarilga.includes(",")) {
//         const tokens = selectedBarilga
//           .split(",")
//           .map((s) => s.trim())
//           .filter(Boolean);
//         if (tokens.length) return tokens[tokens.length - 1];
//       }
//       return selectedBarilga;
//     }
//     return (baiguullaga?.tokhirgoo?.sohCode ||
//       baiguullaga?.ner ||
//       "") as string;
//   }, [selectedBarilga, baiguullaga]);

//   // Address picks for resident modal
//   const [selectedTootModal, setSelectedTootModal] = useState<string>("");
//   const fetchAshiglaltiinZardluud = async () => {
//     if (!token || !currentAjiltan?.baiguullagiinId) return;

//     try {
//       const response = await fetch(
//         `http://103.143.40.46:8084/ashiglaltiinZardluud?baiguullagiinId=${
//           currentAjiltan.baiguullagiinId
//         }&${
//           barilgiinId ? `barilgiinId=${barilgiinId}&` : ""
//         }khuudasniiDugaar=1&khuudasniiKhemjee=100`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok)
//         throw new Error(`HTTP error! status: ${response.status}`);
//       const data = await response.json();
//       setAshiglaltiinZardluud(data.jagsaalt || []);
//     } catch (error) {}
//   };

//   const getFilterOptions = () => {
//     // Prefer contracts as the authoritative source of building structure
//     const src =
//       Array.isArray(gereeList) && gereeList.length > 0
//         ? gereeList
//         : tootBurtgelList; // fallback to resident list if no contracts

//     const barilgaOptions = [
//       ...new Set(
//         src.map((item: any) => item.bairNer || item.soh).filter((v: any) => !!v)
//       ),
//     ];

//     const ortsOptions = selectedBarilga
//       ? [
//           ...new Set(
//             src
//               .filter(
//                 (item: any) => (item.bairNer || item.soh) === selectedBarilga
//               )
//               .map((item: any) => item.orts)
//               .filter((v: any) => !!v)
//           ),
//         ]
//       : [];

//     const davkharOptions = selectedBarilga
//       ? [
//           ...new Set(
//             src
//               .filter(
//                 (item: any) => (item.bairNer || item.soh) === selectedBarilga
//               )
//               .map((item: any) => item.davkhar)
//               .filter((v: any) => !!v)
//           ),
//         ]
//       : [];

//     return { barilgaOptions, ortsOptions, davkharOptions };
//   };

//   const getFilteredTootList = () => {
//     return tootBurtgelList.filter((item: any) => {
//       if (selectedBarilga && item.soh !== selectedBarilga) return false;
//       if (selectedOrts && !item.toot?.startsWith(selectedOrts)) return false;
//       if (selectedDavkhar && item.davkhar !== selectedDavkhar) return false;
//       return true;
//     });
//   };

//   const fetchLiftFloors = async () => {
//     if (!token) return;

//     try {
//       const res = await fetch("http://103.143.40.46:8084/liftShalgaya", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!res.ok) {
//         throw new Error(`HTTP error! status: ${res.status}`);
//       }

//       const data = await res.json();

//       let allFloors: string[] = [];
//       if (data?.jagsaalt && Array.isArray(data.jagsaalt)) {
//         data.jagsaalt.forEach((item: any) => {
//           if (Array.isArray(item?.choloolugdokhDavkhar)) {
//             allFloors = [
//               ...allFloors,
//               ...item.choloolugdokhDavkhar.map(String),
//             ];
//           }
//         });
//       }

//       const uniqueFloors = Array.from(new Set(allFloors)).sort();

//       setLiftFloors(uniqueFloors);
//     } catch (err) {
//       toast.error("Лифт давхруудын мэдээлэл авахад алдаа гарлаа");
//     }
//   };

//   useEffect(() => {
//     if (token) {
//       fetchLiftFloors();
//     }
//   }, [token]);

//   useEffect(() => {
//     if (activeTab === "tootList") {
//       fetchTootBurtgel();
//       fetchAshiglaltiinZardluud();
//     }
//   }, [activeTab]);

//   // Ensure toot list is available when opening resident modal
//   useEffect(() => {
//     if (showSuugchModal && tootBurtgelList.length === 0) {
//       fetchTootBurtgel();
//     }
//   }, [showSuugchModal]);

//   useEffect(() => {
//     if (activeTab === "ajiltanList") {
//       setAjiltanKhuudaslalt((prev: any) => ({
//         ...prev,
//         khuudasniiDugaar: currentPage,
//         khuudasniiKhemjee: pageSize,
//       }));
//     } else if (activeTab === "suugchList") {
//       setSuugchKhuudaslalt({
//         khuudasniiDugaar: currentPage,
//         khuudasniiKhemjee: pageSize,
//         search: searchTerm,
//       });
//     }
//   }, [searchTerm, activeTab]);

//   useEffect(() => {
//     if (activeTab === "ajiltanList") {
//       setAjiltanKhuudaslalt((prev: any) => ({
//         ...prev,
//         khuudasniiDugaar: currentPage,
//         khuudasniiKhemjee: pageSize,
//       }));
//     } else if (activeTab === "suugchList") {
//       setSuugchKhuudaslalt((prev: any) => ({
//         ...prev,
//         khuudasniiDugaar: currentPage,
//         khuudasniiKhemjee: pageSize,
//       }));
//     }
//   }, [currentPage, pageSize, activeTab]);

//   // Ensure both lists are initialized when page loads (warm up SWR caches)
//   useEffect(() => {
//     setAjiltanKhuudaslalt((prev: any) => ({
//       ...prev,
//       khuudasniiDugaar: 1,
//       khuudasniiKhemjee: pageSize,
//     }));
//     setSuugchKhuudaslalt({
//       khuudasniiDugaar: 1,
//       khuudasniiKhemjee: pageSize,
//       search: "",
//     });
//     // Optionally trigger network revalidation immediately
//     // This ensures both ajiltan and orshin suugch lists are fetched on first load
//     ajiltanMutate();
//     suugchMutate();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // When opening resident modal, auto-sync SӨХ (building) from derived value and lock it
//   useEffect(() => {
//     if (showSuugchModal) {
//       setSelectedBarilga(derivedSohStr || "");
//     }
//   }, [showSuugchModal, derivedSohStr]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;

//     if (name === "register") {
//       setFormData((prev: FormData) => ({
//         ...prev,
//         [name]: value.toUpperCase(),
//       }));
//     } else {
//       setFormData((prev: FormData) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   // Confirm + delete helper (small popup / native confirm)
//   const confirmDelete = async (record: any) => {
//     if (!token) {
//       toast.error("Нэвтрэх шаардлагатай");
//       return;
//     }

//     const ok = window.confirm(
//       `Та ${record?.ovog || ""} ${
//         record?.ner || ""
//       } -г устгахдаа итгэлтэй байна уу?`
//     );
//     if (!ok) return;

//     setLoading(true);
//     try {
//       const endpoint = activeTab === "ajiltanList" ? "ajiltan" : "orshinSuugch";
//       const id = record._id || record.id;

//       // optimistic UI: remove from table immediately
//       if (activeTab === "ajiltanList") {
//         // @ts-ignore SWR mutate signature
//         ajiltanMutate(
//           (prev: any) =>
//             prev
//               ? {
//                   ...prev,
//                   jagsaalt: (prev.jagsaalt || []).filter(
//                     (i: any) => (i._id || i.id) !== id
//                   ),
//                 }
//               : prev,
//           false
//         );
//       } else {
//         // @ts-ignore
//         suugchMutate(
//           (prev: any) =>
//             prev
//               ? {
//                   ...prev,
//                   jagsaalt: (prev.jagsaalt || []).filter(
//                     (i: any) => (i._id || i.id) !== id
//                   ),
//                 }
//               : prev,
//           false
//         );
//       }

//       await deleteMethod(endpoint, token, id);
//       toast.success("Устгагдлаа");

//       // revalidate to sync with server
//       if (activeTab === "ajiltanList") await ajiltanMutate();
//       else await suugchMutate();
//     } catch (error: any) {
//       // rollback by revalidating
//       if (activeTab === "ajiltanList") await ajiltanMutate();
//       else await suugchMutate();
//       aldaaBarigch(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateLiftCharge = (residentDavkhar: any, zardal: any) => {
//     if (!residentDavkhar || !zardal?.tariff) {
//       return zardal?.tariff || 0;
//     }

//     const residentFloorStr = String(residentDavkhar).trim();

//     if (liftFloors.includes(residentFloorStr)) {
//       return 0;
//     }

//     return zardal.tariff;
//   };

//   const calculateTotalChargesForResident = (
//     zardluud: any[],
//     residentDavkhar: any
//   ) => {
//     if (!Array.isArray(zardluud)) return 0;

//     return zardluud.reduce((sum, zardal) => {
//       const isLift =
//         zardal?.ner?.toLowerCase() === "лифт" ||
//         zardal?.turul?.toLowerCase() === "лифт";

//       const charge = isLift
//         ? calculateLiftCharge(residentDavkhar, zardal)
//         : zardal?.tariff || 0;

//       return sum + Number(charge);
//     }, 0);
//   };
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     if (!token) {
//       toast.error("Нэвтрэх шаардлагатай");
//       return;
//     }

//     // Core field validations (applies to both Employee and Resident forms)
//     if (!isValidName(formData.ovog)) {
//       toast.error(
//         "Овог талбар зөвхөн үсэг байх ёстой (тоо, тэмдэгт хориглоно)."
//       );
//       return;
//     }
//     if (!isValidName(formData.ner)) {
//       toast.error(
//         "Нэр талбар зөвхөн үсэг байх ёстой (тоо, тэмдэгт хориглоно)."
//       );
//       return;
//     }
//     if (!isValidRegister(formData.register)) {
//       toast.error(explainRegisterRule());
//       return;
//     }
//     if (!isValidPhone(formData.utas)) {
//       toast.error(explainPhoneRule());
//       return;
//     }

//     if (formData.nuutsUg && formData.nuutsUg.length < 2) {
//       toast.error("Нууц үг буруу оруулсан байна.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const isAjiltan = showAjiltanModal;
//       const endpoint = isAjiltan ? "ajiltan" : "orshinSuugchBurtgey";

//       const payload: any = {
//         ner: formData.ner,
//         ovog: formData.ovog,
//         register: formData.register,
//         // Build khayag from structured selections when available
//         khayag: formData.khayag,
//         utas: formData.utas,
//         // Backend uses `mail`; keep `email` too for compatibility
//         email: formData.email,
//         mail: formData.email,
//         // Default login to phone if not provided
//         nevtrekhNer: formData.nevtrekhNer || formData.utas,
//         nuutsUg: formData.nuutsUg,
//         baiguullagiinId: currentAjiltan?.baiguullagiinId,
//         baiguullagiinNer: baiguullaga?.ner,
//         erkh: "OrshinSuugch",
//         taniltsuulgaKharakhEsekh: true,
//       };

//       // Auto-fill organization/branch scoped fields so backend required fields are satisfied
//       if (!isAjiltan) {
//         // Structured address: building(СӨХ) + орц + тоот from toot registry
//         const { barilgaOptions, ortsOptions } = getFilterOptions();
//         // If user selected structured address, set SÖH/building code
//         if (derivedSohStr) payload.soh = derivedSohStr;
//         if (selectedTootModal) payload.toot = selectedTootModal;
//         // Derive davkhar from toot registry when possible
//         const matched = tootBurtgelList.find(
//           (i: any) =>
//             (!selectedBarilga || i.soh === selectedBarilga) &&
//             String(i.toot) === String(selectedTootModal)
//         );
//         if (matched?.davkhar) payload.davkhar = matched.davkhar;
//         // Fill district, khoroo, and soh (building name)
//         if (derivedDuuregStr) payload.duureg = derivedDuuregStr;
//         if (derivedHorooStr) payload.horoo = derivedHorooStr;
//         if (!payload.soh && derivedSohStr) payload.soh = derivedSohStr;
//         if (barilgiinId) payload.barilgiinId = barilgiinId;
//         if (formData.temdeglel) payload.temdeglel = formData.temdeglel;
//         // Validate required fields before sending
//         if (!payload.soh || !payload.duureg || !payload.horoo) {
//           setLoading(false);
//           toast.error(
//             "Дүүрэг, Хороо, СӨХ мэдээлэл дутуу байна. Байрыг сонгоно уу."
//           );
//           return;
//         }
//       } else {
//         // For employees, include branch context if available
//         if (barilgiinId) payload.barilgiinId = barilgiinId;
//       }

//       if (isAjiltan) {
//         payload.ajildOrsonOgnoo = new Date(
//           formData.ajildOrsonOgnoo
//         ).toISOString();
//         payload.albanTushaal = formData.albanTushaal;

//         switch (formData.albanTushaal) {
//           case "Админ":
//             payload.erkh = "Admin";
//             break;
//           case "Зохион байгуулагч":
//             payload.erkh = "ZokhionBaiguulagch";
//             break;
//           case "Санхүү":
//             payload.erkh = "Sankhuu";
//             break;
//           default:
//             break;
//         }
//       }

//       if (formData._id || formData.zasakhEsekh) {
//         payload._id = formData._id;
//         await updateMethod(endpoint, token, payload);
//       } else {
//         await createMethod(endpoint, token, payload);
//       }

//       toast.success("Бүртгэл амжилттай хийгдлээ");

//       setFormData({
//         ovog: "",
//         ner: "",
//         register: "",
//         khayag: "",
//         utas: "",
//         ajildOrsonOgnoo: "",
//         albanTushaal: "",
//         nevtrekhNer: "",
//         nuutsUg: "",
//         email: "",
//         temdeglel: "",
//       });
//       setSelectedTootModal("");
//       setSelectedOrts("");
//       setSelectedBarilga("");

//       formRef.current?.reset();
//       setShowAjiltanModal(false);
//       setShowSuugchModal(false);

//       if (isAjiltan) {
//         await ajiltanMutate();
//       } else {
//         await suugchMutate();
//       }
//     } catch (error: any) {
//       aldaaBarigch(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!selectedRecord || !token) return;

//     if (currentAjiltan?._id === selectedRecord._id) {
//       toast.error("Та өөрийгөө устгаж болохгүй!");
//       return;
//     }

//     setLoading(true);

//     try {
//       const endpoint = activeTab === "ajiltanList" ? "ajiltan" : "orshinSuugch";
//       const id = selectedRecord._id || selectedRecord.id;

//       await deleteMethod(endpoint, token, id);

//       toast.success("Устгагдлаа");

//       if (activeTab === "ajiltanList") {
//         await ajiltanMutate();
//       } else {
//         await suugchMutate();
//       }
//     } catch (error: any) {
//       aldaaBarigch(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (data: any) => {
//     setFormData({
//       ovog: data.ovog || "",
//       ner: data.ner || "",
//       register: data.register || "",
//       khayag: data.khayag || "",
//       utas: data.utas || "",
//       ajildOrsonOgnoo: data.ajildOrsonOgnoo
//         ? new Date(data.ajildOrsonOgnoo).toISOString().split("T")[0]
//         : "",
//       albanTushaal: data.albanTushaal || "",
//       nevtrekhNer: data.nevtrekhNer || "",
//       nuutsUg: "",
//       email: data.email || "",
//       _id: data._id,
//       zasakhEsekh: true,
//     });

//     if (activeTab === "ajiltanList") {
//       setShowAjiltanModal(true);
//     } else {
//       setShowSuugchModal(true);
//     }
//   };

//   // removed inline Modal (moved to module scope as PageModal)

//   if (!currentAjiltan || !currentAjiltan.baiguullagiinId) {
//     return (
//       <div className="min-h-screen bg-transparent">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//           <p className="mt-4 text-slate-600">Мэдээлэл ачааллаж байна...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen">
//       <div className="flex items-start justify-between gap-4 mb-4">
//         <div>
//           <motion.h1
//             initial={{ opacity: 0, y: -16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4, ease: "easeOut" }}
//             className="text-3xl font-bold text-theme"
//           >
//             Бүртгэл
//           </motion.h1>
//           <p className="text-sm mt-1 text-theme/70">
//             Ажилтан болон оршин суугчдын мэдээлэл удирдах
//           </p>
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           {/* these now follow theme via globals (.btn-minimal) */}
//           <button
//             onClick={() => setShowSuugchModal(true)}
//             className="btn-minimal"
//             title="Оршин суугч нэмэх"
//           >
//             Оршин суугч нэмэх
//           </button>
//           <button
//             onClick={() => setShowAjiltanModal(true)}
//             className="btn-minimal"
//             title="Ажилтан нэмэх"
//           >
//             Ажилтан нэмэх
//           </button>
//           <button
//             onClick={() => {
//               fetchTootBurtgel();
//               fetchAshiglaltiinZardluud();
//               setShowTootModal(true);
//             }}
//             className="btn-minimal"
//           >
//             Тоот бүртгэл
//           </button>
//         </div>
//       </div>

//       <div className="mb-6 flex gap-2 tabbar">
//         <button
//           onClick={() => {
//             setActiveTab("ajiltanList");
//             setCurrentPage(1);
//             setSearchTerm("");
//           }}
//           className={`tab-btn px-6 py-3 font-semibold text-sm ${
//             activeTab === "ajiltanList" ? "is-active" : ""
//           }`}
//         >
//           <div className="flex items-center gap-2">
//             <Users className="w-4 h-4" />
//             Ажилтан
//           </div>
//         </button>

//         <button
//           onClick={() => {
//             setActiveTab("suugchList");
//             setCurrentPage(1);
//             setSearchTerm("");
//           }}
//           className={`tab-btn px-6 py-3 font-semibold text-sm ${
//             activeTab === "suugchList" ? "is-active" : ""
//           }`}
//         >
//           <div className="flex items-center gap-2">
//             <Home className="w-4 h-4" />
//             Оршин суугч
//           </div>
//         </button>
//       </div>

//       {loading || isValidating ? (
//         <div className="text-center py-8">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           <p className="mt-2 text-slate-600">Уншиж байна...</p>
//         </div>
//       ) : (
//         <>
//           {/* Search moved to navbar; page reads global `searchTerm` from SearchContext */}

//           <div className="table-surface overflow-hidden rounded-2xl mt-10 w-full">
//             <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
//               <div className="overflow-y-auto custom-scrollbar w-full">
//                 <table className="table-ui text-sm min-w-full">
//                   <thead>
//                     <tr>
//                       <th className="p-3 text-xs font-semibold text-theme text-center w-12">
//                         №
//                       </th>
//                       <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                         Нэр
//                       </th>
//                       <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                         Регистр
//                       </th>
//                       <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                         Холбоо барих
//                       </th>
//                       {activeTab === "ajiltanList" && (
//                         <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                           Албан тушаал
//                         </th>
//                       )}
//                       <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                         {activeTab === "suugchList" ? "Төлөв" : "Эрх"}
//                       </th>
//                       <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                         Үйлдэл
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {activeRecords.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan={activeTab === "ajiltanList" ? 7 : 6}
//                           className="p-8 text-center text-theme/60"
//                         >
//                           Хайсан мэдээлэл алга байна
//                         </td>
//                       </tr>
//                     ) : (
//                       activeRecords.map((person: any, index: number) => (
//                         <tr
//                           key={person._id}
//                           className="transition-colors border-b last:border-b-0"
//                         >
//                           <td className="p-3 text-center text-theme">
//                             {(currentPage - 1) * pageSize + index + 1}
//                           </td>
//                           <td className="p-3 text-theme whitespace-nowrap text-center">
//                             <div className="font-semibold text-theme">
//                               {person.ovog} {person.ner}
//                             </div>
//                           </td>
//                           <td className="p-3 text-theme whitespace-nowrap text-center">
//                             {person.register}
//                           </td>
//                           <td className="p-3 text-center">
//                             <div className="text-sm text-theme">
//                               {person.utas}
//                             </div>
//                             {person.email && (
//                               <div className="text-xs text-theme/70">
//                                 {person.email}
//                               </div>
//                             )}
//                           </td>
//                           {activeTab === "ajiltanList" && (
//                             <td className="p-3 text-center">
//                               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold">
//                                 {person.albanTushaal || "-"}
//                               </span>
//                             </td>
//                           )}
//                           <td className="p-3 text-center">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold">
//                               {activeTab === "suugchList"
//                                 ? person.tuluv || "Төлсөн"
//                                 : person.erkh || "-"}
//                             </span>
//                           </td>
//                           <td className="p-3 whitespace-nowrap">
//                             <div className="flex gap-2 justify-center">
//                               <button
//                                 type="button"
//                                 onClick={() => handleEdit(person)}
//                                 className="p-2 rounded-2xl action-edit hover:menu-surface/80 transition-colors"
//                                 title="Засах"
//                               >
//                                 <Edit className="w-4 h-4" />
//                               </button>
//                               <button
//                                 type="button"
//                                 onClick={() => confirmDelete(person)}
//                                 className="p-2 rounded-2xl action-delete hover:menu-surface/80 transition-colors"
//                                 title="Устгах"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//             <div className="flex flex-col sm:flex-row w-full px-1 gap-3 mt-3">
//               <div className="flex items-end gap-2 sm:ml-auto !mt-2 sm:mt-0">
//                 <PageSongokh
//                   value={pageSize}
//                   onChange={(v) => {
//                     setPageSize(v);
//                     setCurrentPage(1);
//                   }}
//                   className="text-xs px-2 py-1"
//                 />
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//       {showAjiltanModal && (
//         <PageModal
//           isOpen={showAjiltanModal}
//           onClose={() => {
//             setShowAjiltanModal(false);
//             setFormData({
//               ovog: "",
//               ner: "",
//               register: "",
//               khayag: "",
//               utas: "",
//               ajildOrsonOgnoo: "",
//               albanTushaal: "",
//               nevtrekhNer: "",
//               nuutsUg: "",
//               email: "",
//             });
//           }}
//           title={
//             formData.zasakhEsekh
//               ? "Ажилтны мэдээлэл засах"
//               : "Шинэ ажилтан нэмэх"
//           }
//         >
//           <form
//             ref={formRef}
//             onSubmit={(e) => {
//               handleSubmit(e);
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent">
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Овог <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="ovog"
//                     required
//                     placeholder="Овог"
//                     value={formData.ovog}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Нэр <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="ner"
//                     required
//                     placeholder="Нэр"
//                     value={formData.ner}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Регистр <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <IdCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="register"
//                     required
//                     maxLength={10}
//                     placeholder="РД дугаар"
//                     value={formData.register}
//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         register: e.target.value.toUpperCase(),
//                       })
//                     }
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Утас <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="tel"
//                     name="utas"
//                     required
//                     placeholder="Утас"
//                     value={formData.utas}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   И-мэйл <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="email"
//                     name="email"
//                     required
//                     placeholder="И-мэйл"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Албан тушаал <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="albanTushaal"
//                     required
//                     placeholder="Албан тушаал"
//                     value={formData.albanTushaal}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Ажилд орсон огноо <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="ajildOrsonOgnoo"
//                   required
//                   value={formData.ajildOrsonOgnoo}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all text-theme"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Хаяг <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Home className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="khayag"
//                     required
//                     placeholder="Хаяг"
//                     value={formData.khayag}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Read-only auto-filled info to satisfy backend required fields */}
//             <div className="mt-4 p-4 rounded-2xl border border-gray-200 bg-gray-50/60">
//               <div className="text-sm font-semibold text-slate-800 mb-2">
//                 Автоматаар бөглөгдөх мэдээлэл
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
//                 <div className="flex items-center justify-between gap-3">
//                   <span className="text-slate-500">Байгууллага ID</span>
//                   <span className="font-medium break-all">
//                     {derivedBaiguullagiinId || "-"}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between gap-3">
//                   <span className="text-slate-500">Дүүрэг</span>
//                   <span className="font-medium">{derivedDuuregStr || "-"}</span>
//                 </div>
//                 <div className="flex items-center justify-between gap-3">
//                   <span className="text-slate-500">Хороо</span>
//                   <span className="font-medium">{derivedHorooStr || "-"}</span>
//                 </div>
//                 <div className="flex items-center justify-between gap-3">
//                   <span className="text-slate-500">СӨХ (Байр)</span>
//                   <span className="font-medium">{derivedSohStr || "-"}</span>
//                 </div>
//                 {barilgiinId && (
//                   <div className="flex items-center justify-between gap-3">
//                     <span className="text-slate-500">Салбар ID</span>
//                     <span className="font-medium break-all">{barilgiinId}</span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="mt-6 pt-6 border-t border-gray-200/50">
//               <h3 className="text-lg font-semibold mb-4 text-slate-900">
//                 Нэвтрэх мэдээлэл
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700 mb-2">
//                     Нэвтрэх нэр <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                     <input
//                       type="text"
//                       name="nevtrekhNer"
//                       required
//                       placeholder="Нэвтрэх нэр"
//                       value={formData.nevtrekhNer}
//                       onChange={handleInputChange}
//                       className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700 mb-2">
//                     Нууц үг <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                     <input
//                       type="password"
//                       name="nuutsUg"
//                       required
//                       placeholder="Нууц үг"
//                       value={formData.nuutsUg}
//                       onChange={handleInputChange}
//                       className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all text-theme"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 flex gap-3 justify-end">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="btn-minimal btn-save"
//               >
//                 {loading ? "Хадгалж байна..." : "Хадгалах"}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setShowAjiltanModal(false)}
//                 className="btn-minimal-ghost btn-cancel min-w-[120px]"
//               >
//                 Цуцлах
//               </button>
//             </div>
//           </form>
//         </PageModal>
//       )}
//       {showSuugchModal && (
//         <PageModal
//           isOpen={showSuugchModal}
//           onClose={() => {
//             setShowSuugchModal(false);
//             setFormData({
//               ovog: "",
//               ner: "",
//               register: "",
//               khayag: "",
//               utas: "",
//               ajildOrsonOgnoo: "",
//               albanTushaal: "",
//               nevtrekhNer: "",
//               nuutsUg: "",
//               email: "",
//               temdeglel: "",
//             });
//           }}
//           title={
//             formData.zasakhEsekh
//               ? "Оршин суугчийн мэдээлэл засах"
//               : "Оршин суугч нэмэх"
//           }
//         >
//           <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Овог <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="ovog"
//                     required
//                     placeholder="Овог"
//                     value={formData.ovog}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Нэр <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="ner"
//                     required
//                     placeholder="Нэр"
//                     value={formData.ner}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Регистр <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <IdCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="text"
//                     name="register"
//                     required
//                     maxLength={10}
//                     placeholder="РД дугаар"
//                     value={formData.register}
//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         register: e.target.value.toUpperCase(),
//                       })
//                     }
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Утас <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="tel"
//                     name="utas"
//                     required
//                     placeholder="Утас"
//                     value={formData.utas}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   И-мэйл <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                   <input
//                     type="email"
//                     name="email"
//                     required
//                     placeholder="И-мэйл"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-2xl transition-all text-theme"
//                   />
//                 </div>
//               </div>

//               {/* SӨХ info auto-filled from organization (baiguullagiinId) */}
//               <div className="md:col-span-2">
//                 <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
//                   <div className="text-sm text-slate-600 mb-3">
//                     СӨХ мэдээлэл байгууллагын мэдээллээс автоматаар бөглөгдөнө.
//                   </div>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                     <div className="flex items-center justify-between gap-3">
//                       <span className="text-slate-500">СӨХ-ийн нэр</span>
//                       <span className="font-medium text-slate-900 truncate ml-2">
//                         {baiguullaga?.ner || "-"}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between gap-3">
//                       <span className="text-slate-500">СӨХ-ийн регистр</span>
//                       <span className="font-medium text-slate-900 truncate ml-2">
//                         {baiguullaga?.register || "-"}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between gap-3">
//                       <span className="text-slate-500">СӨХ-ийн утас</span>
//                       <span className="font-medium text-slate-900 truncate ml-2">
//                         {Array.isArray(baiguullaga?.utas)
//                           ? (baiguullaga?.utas as unknown as string[]).join(
//                               ", "
//                             )
//                           : baiguullaga?.utas || "-"}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between gap-3">
//                       <span className="text-slate-500">СӨХ-ийн и-мэйл</span>
//                       <span className="font-medium text-slate-900 truncate ml-2">
//                         {baiguullaga?.email || "-"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Structured address selection: Байр(СӨХ) -> Орц -> Тоот */}
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Байр (СӨХ)
//                 </label>
//                 <select
//                   value={selectedBarilga}
//                   onChange={() => {}}
//                   disabled
//                   className="w-full px-4 py-2 rounded-2xl border border-gray-200 bg-gray-50 text-theme cursor-not-allowed"
//                 >
//                   <option value={derivedSohStr || ""}>
//                     {derivedSohStr || "-"}
//                   </option>
//                 </select>
//                 <p className="text-xs text-slate-500 mt-1">
//                   Автоматаар бөглөгдөх, засах боломжгүй
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Орц
//                 </label>
//                 <select
//                   value={selectedOrts}
//                   onChange={(e) => {
//                     setSelectedOrts(e.target.value);
//                     setSelectedTootModal("");
//                   }}
//                   className="w-full px-4 py-2 rounded-2xl border border-gray-200 bg-white text-theme"
//                   disabled={!selectedBarilga}
//                 >
//                   <option value="">Сонгох</option>
//                   {getFilterOptions().ortsOptions.map((o) => (
//                     <option key={o} value={o}>
//                       {o}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Тоот
//                 </label>
//                 <select
//                   value={selectedTootModal}
//                   onChange={(e) => setSelectedTootModal(e.target.value)}
//                   className="w-full px-4 py-2 rounded-2xl border border-gray-200 bg-white text-theme"
//                   disabled={!selectedBarilga || !selectedOrts}
//                 >
//                   <option value="">Сонгох</option>
//                   {(Array.isArray(gereeList) && gereeList.length > 0
//                     ? gereeList
//                         .filter(
//                           (g: any) =>
//                             (g.bairNer || g.soh) === selectedBarilga &&
//                             String(g.orts || "") === String(selectedOrts || "")
//                         )
//                         .map((g: any) => ({ key: g._id, toot: g.toot }))
//                     : tootBurtgelList
//                         .filter(
//                           (i: any) =>
//                             (!selectedBarilga || i.soh === selectedBarilga) &&
//                             (!selectedOrts ||
//                               String(i.toot || "").startsWith(selectedOrts))
//                         )
//                         .map((i: any) => ({ key: i._id, toot: i.toot }))
//                   )
//                     .filter((x: any) => !!x.toot)
//                     .reduce((acc: any[], curr: any) => {
//                       if (!acc.find((a) => a.toot === curr.toot))
//                         acc.push(curr);
//                       return acc;
//                     }, [])
//                     .map((opt: any) => (
//                       <option
//                         key={String(opt.key) + String(opt.toot)}
//                         value={opt.toot}
//                       >
//                         {opt.toot}
//                       </option>
//                     ))}
//                 </select>
//               </div>

//               {/* Read-only derived Давхар and optional Тэмдэглэл */}
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Давхар
//                 </label>
//                 <input
//                   type="text"
//                   value={(() => {
//                     const matched = (
//                       Array.isArray(gereeList) && gereeList.length > 0
//                         ? gereeList.find(
//                             (g: any) =>
//                               (g.bairNer || g.soh) === selectedBarilga &&
//                               String(g.toot || "") ===
//                                 String(selectedTootModal || "")
//                           )
//                         : tootBurtgelList.find(
//                             (i: any) =>
//                               (!selectedBarilga || i.soh === selectedBarilga) &&
//                               String(i.toot) === String(selectedTootModal)
//                           )
//                     ) as any;
//                     return matched?.davkhar || "-";
//                   })()}
//                   readOnly
//                   className="w-full px-4 py-2 rounded-2xl border border-gray-200 bg-gray-50 text-theme"
//                 />
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Тэмдэглэл
//                 </label>
//                 <textarea
//                   rows={3}
//                   value={formData.temdeglel}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       temdeglel: e.target.value,
//                     }))
//                   }
//                   className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-theme"
//                   placeholder="Тэмдэглэл бичих..."
//                 />
//               </div>
//             </div>

//             <div className="mt-6 pt-6 border-t border-gray-200/50">
//               <h3 className="text-lg font-semibold mb-4 text-slate-900">
//                 Нэвтрэх мэдээлэл
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700 mb-2">
//                     Нэвтрэх нэр <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                     <input
//                       type="text"
//                       name="nevtrekhNer"
//                       required
//                       placeholder="Нэвтрэх нэр"
//                       value={formData.nevtrekhNer}
//                       onChange={handleInputChange}
//                       className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all text-theme"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700 mb-2">
//                     Нууц үг <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//                     <input
//                       type="password"
//                       name="nuutsUg"
//                       required
//                       placeholder="Нууц үг"
//                       value={formData.nuutsUg}
//                       onChange={handleInputChange}
//                       className="w-full pl-10 pr-4 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 backdrop-blur-xl transition-all text-theme"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 flex gap-3 justify-end">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="btn-minimal btn-save"
//               >
//                 {loading ? "Хадгалж байна..." : "Хадгалах"}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setShowSuugchModal(false)}
//                 className="btn-minimal-ghost btn-cancel min-w-[120px]"
//               >
//                 Цуцлах
//               </button>
//             </div>
//           </form>
//         </PageModal>
//       )}

//       {showTootModal && (
//         <ModalPortal>
//           <AnimatePresence>
//             {/* ...existing overlay... */}
//             <motion.div
//               key="toot-modal"
//               initial={{ scale: 0.96, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.96, opacity: 0 }}
//               className={`fixed left-1/2 top-1/2 z-[1101] -translate-x-1/2 -translate-y-1/2 w-[1000px] max-w-[95vw] max-h-[1000px] menu-surface rounded-2xl overflow-hidden ${
//                 showZardalModal ? "pointer-events-none" : ""
//               }`}
//               aria-hidden={showZardalModal}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="p-4 flex items-center justify-between">
//                 <h3 className="text-lg font-semibold text-theme">
//                   Тоот бүртгэл
//                 </h3>
//                 <button
//                   onClick={() => setShowTootModal(false)}
//                   className="p-2 rounded-2xl hover:menu-surface/80"
//                 >
//                   <X className="w-5 h-5 text-theme/70" />
//                 </button>
//               </div>

//               <div className="p-4" style={{ maxHeight: "calc(85vh - 64px)" }}>
//                 <div className="table-surface overflow-hidden rounded-2xl mt-10 w-full">
//                   <div className="max-h-[330px] overflow-y-auto custom-scrollbar w-full">
//                     <table className="table-ui text-sm min-w-full">
//                       <thead>
//                         <tr>
//                           <th className="p-3 text-xs font-semibold text-theme text-center w-12">
//                             №
//                           </th>
//                           <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                             Нэр
//                           </th>
//                           <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                             Байр
//                           </th>
//                           <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                             Ашиглалтын зардал
//                           </th>
//                           <th className="p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
//                             Нийт дүн
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {isLoadingToot ? (
//                           <tr>
//                             <td colSpan={5} className="p-8 text-center ">
//                               <div className="inline-block animate-spin  rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                             </td>
//                           </tr>
//                         ) : getFilteredTootList().length === 0 ? (
//                           <tr>
//                             <td
//                               colSpan={5}
//                               className="p-8 text-center text-slate-500 "
//                             >
//                               Хайсан мэдээлэл алга байна
//                             </td>
//                           </tr>
//                         ) : (
//                           getFilteredTootList().map(
//                             (item: any, index: number) => {
//                               const totalCharges =
//                                 calculateTotalChargesForResident(
//                                   ashiglaltiinZardluud,
//                                   item.davkhar
//                                 );
//                               return (
//                                 <tr
//                                   key={item._id}
//                                   className="table-ui hover:bg-gray-100 transition-all border-b last:border-b-0"
//                                 >
//                                   <td className="p-3 text-center text-slate-900">
//                                     {index + 1}
//                                   </td>
//                                   <td className="p-3 text-center">
//                                     <div className="font-semibold text-slate-900">
//                                       {item.ovog} {item.ner}
//                                     </div>
//                                     <div className="text-xs text-slate-500">
//                                       {item.soh}
//                                     </div>
//                                   </td>
//                                   <td className="p-3 text-center text-slate-900">
//                                     <div className="font-medium">
//                                       {item.toot || "-"}
//                                     </div>
//                                     <div className="text-xs text-slate-500">
//                                       Давхар: {item.davkhar || "-"}
//                                     </div>
//                                   </td>
//                                   <td className="p-3 text-center">
//                                     <button
//                                       onClick={() => {
//                                         setSelectedZardalRecord(item);
//                                         setShowZardalModal(true);
//                                       }}
//                                       className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-all text-sm font-medium"
//                                     >
//                                       <span>
//                                         {ashiglaltiinZardluud.length} зардлын
//                                         төрөл
//                                       </span>
//                                       <ChevronDown className="w-4 h-4" />
//                                     </button>
//                                   </td>
//                                   <td className="p-3 text-center">
//                                     <div className="font-bold text-blue-600 text-lg">
//                                       {formatNumber(totalCharges, 0)}₮
//                                     </div>
//                                   </td>
//                                 </tr>
//                               );
//                             }
//                           )
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           </AnimatePresence>
//         </ModalPortal>
//       )}

//       {/* Zardal modal can be themed similarly if desired */}
//       {showZardalModal && selectedZardalRecord && (
//         <ModalPortal>
//           <AnimatePresence>
//             {showZardalModal && (
//               <>
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
//                   onClick={() => {
//                     setShowZardalModal(false);
//                     setSelectedZardalRecord(null);
//                   }}
//                 />

//                 <motion.div
//                   initial={{ scale: 0.95, opacity: 0 }}
//                   animate={{ scale: 1, opacity: 1 }}
//                   exit={{ scale: 0.95, opacity: 0 }}
//                   className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] max-h-[1000px] bg-white rounded-2xl shadow-2xl overflow-hidden z-[2001]"
//                   role="dialog"
//                   aria-modal="true"
//                   onClick={(e) => e.stopPropagation()}
//                 >
//                   <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
//                     <h2 className="text-xl font-bold text-slate-800">
//                       Ашиглалтын зардлын дэлгэрэнгүй
//                     </h2>
//                     <div className="flex items-center gap-2">
//                       <button
//                         type="button"
//                         onClick={() => window.print()}
//                         className="btn-minimal btn-print"
//                       >
//                         Хэвлэх
//                       </button>
//                       <button
//                         onClick={() => {
//                           setShowZardalModal(false);
//                           setSelectedZardalRecord(null);
//                         }}
//                         className="p-2 hover:bg-gray-200 rounded-2xl transition-colors"
//                       >
//                         <X className="w-6 h-6 text-slate-500" />
//                       </button>
//                     </div>
//                   </div>

//                   <div
//                     className="overflow-y-auto p-6"
//                     style={{ maxHeight: "calc(85vh - 180px)" }}
//                   >
//                     <div className="space-y-6">
//                       <div className="text-sm text-slate-500 mb-1">
//                         Оршин суугч
//                       </div>
//                       <div className="font-bold text-lg text-slate-900">
//                         {selectedZardalRecord.ovog} {selectedZardalRecord.ner}
//                       </div>
//                       <div className="text-sm text-slate-600 mt-2">
//                         <span className="font-medium">СӨХ:</span>{" "}
//                         {selectedZardalRecord.soh}
//                       </div>
//                       <div className="text-sm text-slate-600">
//                         <span className="font-medium">Байр:</span>{" "}
//                         {selectedZardalRecord.toot || "-"} |{" "}
//                         <span className="font-medium">Давхар:</span>{" "}
//                         {selectedZardalRecord.davkhar || "-"}
//                       </div>

//                       <div>
//                         <h4 className="font-semibold text-slate-900 mb-3">
//                           Зардлын жагсаалт
//                         </h4>
//                         <div className="space-y-2">
//                           {ashiglaltiinZardluud.map(
//                             (zardal: any, index: number) => {
//                               const isLift =
//                                 zardal.ner === "Лифт" ||
//                                 zardal.turul === "лифт";
//                               const charge = isLift
//                                 ? calculateLiftCharge(
//                                     selectedZardalRecord.davkhar,
//                                     zardal
//                                   )
//                                 : zardal.tariff;
//                               const isExempted = isLift && charge === 0;

//                               return (
//                                 <div
//                                   key={zardal._id}
//                                   className={`flex justify-between items-center p-3 rounded-2xl transition-all ${
//                                     isExempted
//                                       ? "bg-green-50 border border-green-200"
//                                       : "bg-gray-50 hover:bg-gray-100"
//                                   }`}
//                                 >
//                                   <div className="flex items-center gap-3">
//                                     <div
//                                       className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
//                                         isExempted
//                                           ? "bg-green-100 text-green-600"
//                                           : "bg-blue-100 text-blue-600"
//                                       }`}
//                                     >
//                                       {index + 1}
//                                     </div>
//                                     <div>
//                                       <span className="text-slate-700 font-medium">
//                                         {zardal.ner}
//                                       </span>
//                                       {isExempted && (
//                                         <div className="text-xs text-green-600 font-medium mt-0.5">
//                                           Чөлөөлөгдсөн давхар
//                                         </div>
//                                       )}
//                                     </div>
//                                   </div>
//                                   <div className="text-right">
//                                     {isExempted ? (
//                                       <>
//                                         <div className="font-bold text-green-600">
//                                           0₮
//                                         </div>
//                                         <div className="text-xs text-slate-400 line-through">
//                                           {formatNumber(zardal.tariff, 0)}₮
//                                         </div>
//                                       </>
//                                     ) : (
//                                       <span className="font-bold text-slate-900">
//                                         {formatNumber(charge, 0)}₮
//                                       </span>
//                                     )}
//                                   </div>
//                                 </div>
//                               );
//                             }
//                           )}
//                         </div>
//                       </div>

//                       <div className="pt-4 border-t border-gray-200">
//                         <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-sm">
//                           <span className="text-lg font-semibold text-slate-900">
//                             Нийт дүн:
//                           </span>
//                           <span className="text-2xl font-bold text-blue-600">
//                             {formatNumber(
//                               calculateTotalChargesForResident(
//                                 ashiglaltiinZardluud,
//                                 selectedZardalRecord.davkhar
//                               ),
//                               0
//                             )}
//                             ₮
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </motion.div>
//               </>
//             )}
//           </AnimatePresence>
//         </ModalPortal>
//       )}
//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         @keyframes scaleIn {
//           from {
//             opacity: 0;
//             transform: scale(0.95);
//           }
//           to {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }

//         .animate-fadeIn {
//           animation: fadeIn 0.2s ease-out;
//         }

//         .animate-scaleIn {
//           animation: scaleIn 0.3s ease-out;
//         }

//         .custom-scrollbar::-webkit-scrollbar {
//           width: 8px;
//           height: 8px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 10px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: rgba(156, 163, 175, 0.5);
//           border-radius: 10px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: rgba(156, 163, 175, 0.7);
//         }
//       `}</style>
//     </div>
//   );
// }
