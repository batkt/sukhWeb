"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input, Modal, notification, Card, Popconfirm, Tooltip } from "antd";
import Button from "@/components/ui/Button";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, Bell, Users, Mail, MessageSquare, Smartphone, FileText, Plus, ImagePlus, X, Home, Phone, User, Check, Search } from "lucide-react";
import uilchilgee, { getApiUrl } from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import useSWR, { mutate } from "swr"; // Added SWR import if not there
import BlogManagement from "./BlogManagement";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";
import { useSocket } from "@/context/SocketContext";
import { ognooTsagBogino, ognooTsagButen } from "@/lib/ognoo";
interface Geree {
  _id: string;
  ner: string;
  utas: string | string[];
  mail?: string;
  gereeniiDugaar: string;
  tuluv: string;
  [key: string]: any;
}

interface MedegdelTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  imageDataUrl?: string;
}

const TEMPLATE_STORAGE_KEY = (orgId: string, turul: string) =>
  `medegdelTemplates_${orgId}_${turul}`;

function loadTemplates(orgId: string, turul: string): MedegdelTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY(orgId, turul));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplates(orgId: string, turul: string, templates: MedegdelTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATE_STORAGE_KEY(orgId, turul), JSON.stringify(templates));
}

export default function MedegdelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MedegdelContent />
    </Suspense>
  );
}

function MedegdelContent() {
  const { barilgiinId, token, ajiltan, baiguullaga } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId;
  const { selectedBuildingId } = useBuilding();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab =
    searchParams.get("tab") === "niitlel"
      ? "niitlel"
      : searchParams.get("tab") === "tulult"
        ? "tulult"
        : "medegdel";
  const [activeTab, setActiveTab] = useState<"medegdel" | "niitlel" | "tulult">(initialTab);

  const tourSteps = useTourSteps(activeTab === "niitlel" ? "niitlel" : "notifications");
  useRegisterTourSteps("/medegdel/medegdel", tourSteps);

  useEffect(() => {
    const tab =
      searchParams.get("tab") === "niitlel"
        ? "niitlel"
        : searchParams.get("tab") === "tulult"
          ? "tulult"
          : "medegdel";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "medegdel" | "niitlel" | "tulult") => {
    setActiveTab(tab);
    router.push(`/medegdel/medegdel?tab=${tab}`);
  };

  const effectiveBarilgiinId: string | undefined =
    selectedBuildingId ?? barilgiinId ?? undefined;
  const selectedBarilga = baiguullaga?.barilguud?.find(
    (b) => b._id === selectedBuildingId
  );

  useEffect(() => {
    Aos.init({ once: true });
  }, []);

  const [khariltsagch, setKhariltsagch] = useState<Geree | null>(null);
  const [songogdsonKhariltsagch, setSongogdsonKhariltsagch] = useState<Geree[]>(
    []
  );
  const [title, setTitle] = useState("");
  const [msj, setMsj] = useState("");
  const [turul, setTurul] = useState<"App" | "Мессеж" | "Mail">("App");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSendResult, setLastSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    turul: string;
    failedUsers: { ner: string; toot?: string; shaltgaan?: string }[];
  } | null>(null);

  const hasPhone = (u: Geree) => {
    const phones = Array.isArray(u.utas) ? u.utas : [u.utas];
    return phones.some((p) => p && String(p).trim() !== "");
  };

  const hasEmail = (u: Geree) => {
    return Boolean(u.mail && String(u.mail).trim() !== "");
  };

  const hasApp = (u: Geree) => {
    return Boolean(u.firebaseToken && String(u.firebaseToken).trim() !== "");
  };

  const [resultModalOpen, setResultModalOpen] = useState(false);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateImageDataUrl, setTemplateImageDataUrl] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MedegdelTemplate[]>([]);
  const [attachImages, setAttachImages] = useState<File[]>([]);
  const [composerTemplateImage, setComposerTemplateImage] = useState<string | null>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const templateImageInputRef = useRef<HTMLInputElement>(null);
  // ── States and helper functions for Tulult (payment notifications) tab ──
  const [tulultList, setTulultList] = useState<any[]>([]);
  const [selectedTulult, setSelectedTulult] = useState<any | null>(null);
  const [tulultLoading, setTulultLoading] = useState(false);
  const [tulultSearch, setTulultSearch] = useState("");
  const [residentsMap, setResidentsMap] = useState<
    Record<string, { ner: string; toot: string; utas: string }>
  >({});

  const socket = useSocket();

  const fetchResidentInfo = async (orshinSuugchId: string) => {
    if (!orshinSuugchId || residentsMap[orshinSuugchId] || !token || !baiguullagiinId) return;
    try {
      const res = await uilchilgee(token).get(`/orshinSuugch/${orshinSuugchId}`, {
        params: { baiguullagiinId }
      });
      if (res.data) {
        const r = res.data;
        const ner = `${r.ovog || ""} ${r.ner || ""}`.trim();
        const toot = Array.isArray(r.toots) && r.toots.length > 0
          ? r.toots.map((t: any) => t.toot || t).join(", ")
          : r.toot || "";
        const utas = Array.isArray(r.utas) ? r.utas[0] || "" : r.utas || "";
        setResidentsMap(prev => ({ ...prev, [orshinSuugchId]: { ner, toot, utas } }));
      }
    } catch (e) {
      console.warn("Failed to fetch resident", orshinSuugchId, e);
    }
  };

  const fetchTulultData = async () => {
    if (!token || !baiguullagiinId) return;
    setTulultLoading(true);
    try {
      const res = await uilchilgee(token).get("/medegdel", {
        params: {
          baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        }
      });
      if (res.data?.success) {
        const filtered = res.data.data.filter((item: any) => {
          const type = (item.turul || "").toLowerCase().trim();
          return type === "medegdel" || type === "мэдэгдэл";
        });
        filtered.sort((a: any, b: any) => new Date(b.createdAt || b.ognoo).getTime() - new Date(a.createdAt || a.ognoo).getTime());
        setTulultList(filtered);

        if (filtered.length > 0) {
          setSelectedTulult((prev: any) => {
            const queryId = searchParams.get("id");
            if (queryId) {
              const matched = filtered.find((x: any) => x._id === queryId);
              if (matched) return matched;
            }
            const stillExists = prev ? filtered.find((x: any) => x._id === prev._id) : null;
            return stillExists || filtered[0];
          });
        } else {
          setSelectedTulult(null);
        }

        filtered.forEach((item: any) => {
          if (item.orshinSuugchId) {
            fetchResidentInfo(item.orshinSuugchId);
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch tulult notifications:", err);
    } finally {
      setTulultLoading(false);
    }
  };

  const markAsRead = async (item: any) => {
    console.log("[markAsRead] Called with item:", item?._id, "title:", item?.title, "kharsanEsekh:", item?.kharsanEsekh);
    if (!item || !token || !baiguullagiinId) {
      console.log("[markAsRead] Missing requirements:", { hasItem: !!item, hasToken: !!token, baiguullagiinId });
      return;
    }
    try {
      console.log("[markAsRead] Sending POST request for:", item._id);
      let res;
      try {
        res = await uilchilgee(token).post(
          `/medegdel/${item._id}/kharsanEsekh`,
          {},
          {
            params: { baiguullagiinId },
          }
        );
        console.log("[markAsRead] POST response:", res.data);
      } catch (postErr: any) {
        if (postErr?.response?.status === 404 || postErr?.response?.status === 405) {
          console.log("[markAsRead] POST not supported, falling back to PATCH");
          res = await uilchilgee(token).patch(
            `/medegdel/${item._id}/kharsanEsekh`,
            {},
            {
              params: { baiguullagiinId },
            }
          );
          console.log("[markAsRead] PATCH response:", res.data);
        } else {
          throw postErr;
        }
      }

      setTulultList((prev) =>
        prev.map((it) => (it._id === item._id ? { ...it, kharsanEsekh: true } : it))
      );
      setSelectedTulult((prev: any) =>
        prev && prev._id === item._id ? { ...prev, kharsanEsekh: true } : prev
      );

      // Revalidate count in sidebar dropdown and unread lists instantly
      console.log("[markAsRead] Mutating SWR counts...");
      mutate((k: unknown) => Array.isArray(k) && k[0] === "/medegdel/unreadCount", undefined, { revalidate: true });
      mutate((k: unknown) => Array.isArray(k) && k[0] === "/medegdel/unreadList", undefined, { revalidate: true });
    } catch (err) {
      console.error("[markAsRead] Failed to mark as read:", err);
    }
  };

  useEffect(() => {
    console.log("[useEffect selectedTulult] Triggered:", {
      activeTab,
      hasSelected: !!selectedTulult,
      kharsanEsekh: selectedTulult?.kharsanEsekh
    });
    if (activeTab === "tulult" && selectedTulult && !selectedTulult.kharsanEsekh) {
      markAsRead(selectedTulult);
    }
  }, [selectedTulult, activeTab]);

  useEffect(() => {
    if (activeTab === "tulult" && baiguullagiinId) {
      fetchTulultData();
    }
  }, [activeTab, baiguullagiinId, effectiveBarilgiinId]);

  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId && tulultList.length > 0) {
      const found = tulultList.find((x) => x._id === queryId);
      if (found) {
        setSelectedTulult(found);
      }
    }
  }, [searchParams, tulultList]);

  useEffect(() => {
    if (!socket || !baiguullagiinId) return;
    const bId = String(baiguullagiinId);

    const onNewMedegdel = (payload: any) => {
      if (payload?.type === "medegdelNew") {
        if (activeTab === "tulult") {
          fetchTulultData();
        }
      }
    };
    socket.on("baiguullagiin" + bId, onNewMedegdel);
    return () => {
      socket.off("baiguullagiin" + bId, onNewMedegdel);
    };
  }, [socket, baiguullagiinId, activeTab, effectiveBarilgiinId]);

  const attachPreviewUrlsRef = useRef<string[]>([]);

  const { orshinSuugchGaralt, isValidating, setOrshinSuugchKhuudaslalt } =
    useOrshinSuugchJagsaalt(
      token || "",
      baiguullagiinId || "",
      {},
      effectiveBarilgiinId
    );

  useEffect(() => {
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 1000,
      search: "",
    });
  }, [setOrshinSuugchKhuudaslalt]);

  useEffect(() => {
    if (baiguullagiinId) {
      setTemplates(loadTemplates(baiguullagiinId, turul));
    }
  }, [baiguullagiinId, turul]);

  function dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  const handleOpenTemplateModal = () => {
    setTemplateName("");
    setTemplateTitle("");
    setTemplateBody("");
    setTemplateImageDataUrl(null);
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !templateTitle.trim() || !templateBody.trim()) {
      notification.warning({
        message: "Нэр, гарчиг болон агуулга оруулна уу",
        style: { zIndex: 99999 },
      });
      return;
    }
    if (!baiguullagiinId) return;
    const newTemplate: MedegdelTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      title: templateTitle.trim(),
      body: templateBody.trim(),
      ...(templateImageDataUrl ? { imageDataUrl: templateImageDataUrl } : {}),
    };
    const updated = [...loadTemplates(baiguullagiinId, turul), newTemplate];
    saveTemplates(baiguullagiinId, turul, updated);
    setTemplates(updated);
    setTemplateModalOpen(false);
    setTemplateImageDataUrl(null);
    notification.success({ message: "Загвар амжилттай хадгалагдлаа", style: { zIndex: 99999 } });
  };

  const handleApplyTemplate = (t: MedegdelTemplate) => {
    setTitle(t.title);
    setMsj(t.body);
    attachPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    attachPreviewUrlsRef.current = [];
    setAttachImages([]);
    setComposerTemplateImage(t.imageDataUrl ?? null);
  };

  const geree = (orshinSuugchGaralt?.jagsaalt || []) as Geree[];

  const khariltsagchSongokh = (mur: Geree) => {
    setSongogdsonKhariltsagch((prev) => {
      const exists = prev.find((a) => a._id === mur._id);
      if (exists) {
        return prev.filter((a) => a._id !== mur._id);
      } else {
        return [...prev, mur];
      }
    });
    setKhariltsagch(mur);
  };

  const send = async () => {
    const hasImage = attachImages.length > 0 || !!composerTemplateImage;
    if (!title || (!msj && !hasImage)) {
      notification.warning({
        message: "Гарчиг оруулна уу. Мөн агуулга эсвэл зураг нэмнэ үү",
        style: { zIndex: 99999 },
      });
      return;
    }

    if (songogdsonKhariltsagch.length === 0) {
      notification.warning({
        message: "Мэдэгдэл илгээх харилцагч сонгоно уу",
        description: "Та мэдэгдэл илгээх хүмүүсийг сонгоно уу",
        style: { zIndex: 99999 },
      });
      return;
    }

    if (!token || !baiguullagiinId || !barilgiinId) {
      openErrorOverlay("Системийн алдаа");
      return;
    }

    setLoading(true);
    try {
      let sentCount = 0;
      let failedCount = 0;
      let failedList: { ner: string; toot?: string; shaltgaan?: string }[] = [];

      if (turul === "Мессеж") {
        const withPhone = songogdsonKhariltsagch.filter(hasPhone);
        const withoutPhone = songogdsonKhariltsagch.filter((u) => !hasPhone(u));
        sentCount = withPhone.length;
        failedCount = withoutPhone.length;
        failedList = withoutPhone.map((u) => ({
          ner: u.ner || "Оршин суугч",
          toot: u.toot || "",
          shaltgaan: "Утасны дугааргүй",
        }));

        const msgnuud = withPhone.flatMap((user) => {
          const phoneNumbers = Array.isArray(user.utas)
            ? user.utas
            : [user.utas];
          return phoneNumbers
            .filter((phone) => phone && phone.trim() !== "")
            .map((phone) => ({
              to: phone,
              text: `${title}\n${msj}`,
              gereeniiId: user._id,
            }));
        });

        if (msgnuud.length > 0) {
          await uilchilgee(token).post("/msgIlgeeye", {
            baiguullagiinId: baiguullagiinId,
            barilgiinId: barilgiinId,
            msgnuud: msgnuud,
          });
        }
      } else if (turul === "Mail") {
        const withMail = songogdsonKhariltsagch.filter(hasEmail);
        const withoutMail = songogdsonKhariltsagch.filter((u) => !hasEmail(u));
        sentCount = withMail.length;
        failedCount = withoutMail.length;
        failedList = withoutMail.map((u) => ({
          ner: u.ner || "Оршин суугч",
          toot: u.toot || "",
          shaltgaan: "И-мэйл хаяггүй",
        }));

        const mailuud = withMail.map((user) => ({
          mail: user.mail,
          content: `<p>${msj}</p>`,
        }));

        if (mailuud.length > 0) {
          await uilchilgee(token).post("/mailOlnoorIlgeeye", {
            baiguullagiinId: baiguullagiinId,
            barilgiinId: barilgiinId,
            mailuud: mailuud,
            subject: title,
          });
        }
      } else {
        // For App: use FormData when sending image so backend receives multipart zurag
        const withApp = songogdsonKhariltsagch.filter(hasApp);
        const withoutApp = songogdsonKhariltsagch.filter((u) => !hasApp(u));
        const orshinSuugchIdArray = songogdsonKhariltsagch.map(
          (user) => user._id
        );
        const templateAsFile = composerTemplateImage
          ? dataURLtoFile(composerTemplateImage, "template-image.png")
          : null;
        const allFiles: File[] =
          attachImages.length > 0
            ? attachImages
            : templateAsFile
              ? [templateAsFile]
              : [];

        let respData: any = null;
        if (allFiles.length > 0) {
          const formData = new FormData();
          formData.append(
            "medeelel",
            JSON.stringify({ title, body: msj || "" })
          );
          formData.append(
            "orshinSuugchId",
            JSON.stringify(orshinSuugchIdArray)
          );
          formData.append("baiguullagiinId", baiguullagiinId);
          formData.append("barilgiinId", barilgiinId);
          formData.append("turul", turul);
          allFiles.forEach((file) => formData.append("zurag", file));

          const baseUrl = getApiUrl().replace(/\/$/, "");
          const res = await fetch(`${baseUrl}/medegdelIlgeeye`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP ${res.status}`);
          }
          respData = await res.json().catch(() => null);
        } else {
          const res = await uilchilgee(token).post("/medegdelIlgeeye", {
            medeelel: { title, body: msj },
            orshinSuugchId: orshinSuugchIdArray,
            baiguullagiinId: baiguullagiinId,
            barilgiinId: barilgiinId,
            turul: turul,
          });
          respData = res.data;
        }

        sentCount = respData?.pushSentCount ?? withApp.length;
        failedCount = respData?.pushFailedCount ?? withoutApp.length;
        if (respData?.pushFailedList && Array.isArray(respData.pushFailedList)) {
          failedList = respData.pushFailedList;
        } else {
          failedList = withoutApp.map((u) => ({
            ner: u.ner || "Оршин суугч",
            toot: u.toot || "",
            shaltgaan: "Апп холбогдоогүй",
          }));
        }
      }

      const totalCount = songogdsonKhariltsagch.length;
      setLastSendResult({
        sent: sentCount,
        failed: failedCount,
        total: totalCount,
        turul: turul,
        failedUsers: failedList,
      });
      setResultModalOpen(true);

      // Show different success message with count details
      const successMessage = `${turul} амжилттай илгээгдлээ: ${sentCount} илгээсэн${failedCount > 0 ? `, ${failedCount} илгээгээгүй` : ""}`;

      openSuccessOverlay(successMessage);

      attachPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      attachPreviewUrlsRef.current = [];
      setTitle("");
      setMsj("");
      setAttachImages([]);
      setComposerTemplateImage(null);
      setSongogdsonKhariltsagch([]);
      setKhariltsagch(null);
    } catch (err) {
      console.error("Error in send function:", err);
      openErrorOverlay("Мэдэгдэл илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSongogdsonKhariltsagch((prev) => {
      if (prev.length === filteredGeree.length) {
        // Unselect all
        return [];
      } else {
        // Select all
        return [...filteredGeree];
      }
    });
  };

  const filteredGeree = geree.filter((mur) => {
    const query = searchQuery.toLowerCase();
    const nerMatch = mur.ner ? mur.ner.toLowerCase().includes(query) : false;

    // Handle utas as either string or array
    const utasMatch = Array.isArray(mur.utas)
      ? mur.utas.some((utas) => utas?.toLowerCase().includes(query))
      : typeof mur.utas === "string"
        ? mur.utas.toLowerCase().includes(query)
        : false;

    return nerMatch || utasMatch;
  });

  const filteredTulult = tulultList.filter((item: any) => {
    const query = tulultSearch.toLowerCase();
    const matchesSearch =
      (item.title || "").toLowerCase().includes(query) ||
      (item.message || "").toLowerCase().includes(query) ||
      (item.orshinSuugchNer || "").toLowerCase().includes(query) ||
      (item.orshinSuugchUtas || "").toLowerCase().includes(query);
    return matchesSearch;
  });

  const channelIcons = { App: Smartphone, Мессеж: MessageSquare, Mail: Mail } as const;

  return (
    <div className="flex min-h-0 flex-col gap-3 pb-14">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-2"
      >
        {/* Гарчиг толгой хэсэгт («… — Мэдэгдэл») байгаа тул давхарлахгүй */}
        {/* Tabs Control */}
        <div id="medegdel-tab-switch" className="flex gap-1">
          <button
            onClick={() => handleTabChange("medegdel")}
            className={`h-9 rounded-[10px] px-4 text-[13px] transition-colors ${activeTab === "medegdel"
              ? "bg-theme/15 font-medium text-brand"
              : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
              }`}
          >
            Мэдэгдэл
          </button>
          <button
            onClick={() => handleTabChange("tulult")}
            className={`h-9 rounded-[10px] px-4 text-[13px] transition-colors ${activeTab === "tulult"
              ? "bg-theme/15 font-medium text-brand"
              : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
              }`}
          >
            Төлөлтүүд
          </button>
          <button
            onClick={() => handleTabChange("niitlel")}
            className={`h-9 rounded-[10px] px-4 text-[13px] transition-colors ${activeTab === "niitlel"
              ? "bg-theme/15 font-medium text-brand"
              : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
              }`}
          >
            Нийтлэл
          </button>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {activeTab === "medegdel" ? (
          <motion.div
            key="medegdel-tab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="grid flex-1 min-h-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_260px] lg:h-[calc(100vh-13rem)]"
          >
            {/* Left: Channel & Templates */}
            <motion.section
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-4 shadow-[var(--ctl-shadow)] flex flex-col min-w-0 min-h-0 lg:order-3"
              id="medegdel-channels-section"
            >

              <div id="medegdel-templates" className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--panel-text)]">
                  <FileText className="h-4 w-4 text-[color:var(--muted-text)]" />
                  Загвар
                </span>
                <button
                  id="medegdel-template-add-btn"
                  type="button"
                  onClick={handleOpenTemplateModal}
                  className="btn-minimal inline-flex h-8 items-center gap-1 !px-2.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Нэмэх
                </button>
              </div>

              {templates.length > 0 ? (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleApplyTemplate(t)}
                      className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-[color:var(--surface-hover)]"
                    >
                      <div className="truncate text-[13px] text-[color:var(--panel-text)]">{t.name}</div>
                      {t.title && (
                        <div className="truncate text-[11px] text-[color:var(--muted-text)]">{t.title}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--ctl-border)] px-4 py-8 text-center">
                  <FileText className="mb-2 h-6 w-6 text-[color:var(--muted-text)]" />
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Загвар байхгүй. Байнга илгээдэг мэдэгдлээ загвар болгож хадгална уу.
                  </p>
                </div>
              )}

              <Modal
                title="Загвар нэмэх"
                open={templateModalOpen}
                onOk={handleSaveTemplate}
                onCancel={() => setTemplateModalOpen(false)}
                okText="Хадгалах"
                cancelText="Хаах"
                destroyOnHidden
                className="[&_.ant-modal-content]:rounded-2xl"
              >
                <div className="flex flex-col gap-4 pt-2">
                  <div>
                    <label className="block text-sm  text-[color:var(--panel-text)] mb-1">Нэр</label>
                    <Input
                      placeholder="Загварын нэр"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm  text-[color:var(--panel-text)] mb-1">Гарчиг</label>
                    <Input
                      placeholder="Мэдэгдлийн гарчиг"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm  text-[color:var(--panel-text)] mb-1">Агуулга</label>
                    <Input.TextArea
                      placeholder="Мэдэгдлийн агуулга"
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      rows={5}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm  text-[color:var(--panel-text)] mb-1">Зураг (заавал биш)</label>
                    <input
                      ref={templateImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = () => setTemplateImageDataUrl(reader.result as string);
                          reader.readAsDataURL(f);
                        }
                        e.target.value = "";
                      }}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => templateImageInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs  border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Зураг сонгох
                      </button>
                      {templateImageDataUrl && (
                        <div className="relative inline-block">
                          <img
                            src={templateImageDataUrl}
                            alt=""
                            className="w-20 h-20 object-cover rounded-xl border"
                          />
                          <button
                            type="button"
                            onClick={() => setTemplateImageDataUrl(null)}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center"
                            aria-label="Зураг хасах"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Modal>
            </motion.section>

            {/* Middle: Recipients */}
            <motion.section
              id="medegdel-contacts-section"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-4 shadow-[var(--ctl-shadow)] flex flex-col min-w-0 min-h-0 lg:order-1"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-[13px] font-medium text-[color:var(--panel-text)]">
                  <Users className="h-4 w-4 text-[color:var(--muted-text)]" />
                  Хүлээн авагч
                  {orshinSuugchGaralt && (
                    <span className="rounded-full bg-[color:var(--surface-hover)] px-1.5 text-[11px] font-normal text-[color:var(--muted-text)]">
                      {orshinSuugchGaralt.niitMur || 0}
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <label id="medegdel-select-all" className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={
                      songogdsonKhariltsagch.length === filteredGeree.length &&
                      filteredGeree.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-[color:var(--panel-text)]">Бүгд сонгох</span>
                </label>
                {songogdsonKhariltsagch.length > 0 && (
                  <span className="text-xs text-theme ">
                    {songogdsonKhariltsagch.length} сонгогдсон
                  </span>
                )}
              </div>

              <label id="medegdel-contact-search" className="filter-field mb-3 w-full">
                <SearchIcon className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
                <input
                  aria-label="Хайх"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Нэр, утас хайх..."
                />
              </label>

              <div id="medegdel-contact-list" className="-mx-1 flex-1 min-h-0 space-y-0.5 overflow-y-auto px-1 custom-scrollbar">
                {isValidating ? (
                  <div className="text-center py-12 text-[color:var(--muted-text)] text-sm">
                    Уншиж байна...
                  </div>
                ) : filteredGeree.length === 0 ? (
                  <div className="text-center py-12 text-[color:var(--muted-text)] text-sm">
                    Оршин суугч олдсонгүй
                  </div>
                ) : (
                  filteredGeree.map((mur) => {
                    const isActive = khariltsagch?._id === mur._id;
                    const isChecked = songogdsonKhariltsagch.some(
                      (k) => k._id === mur._id
                    );
                    return (
                      <motion.div
                        key={mur._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => khariltsagchSongokh(mur)}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${isChecked || isActive
                          ? "bg-theme/10"
                          : "hover:bg-[color:var(--surface-hover)]"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 rounded shrink-0 pointer-events-none"
                        />
                        {/* Өмнө нь цайвар дэвсгэр дээр цагаан үсэг — харагдахгүй байв */}
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-theme/15 text-[13px] font-medium text-brand">
                          {mur.ner?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className=" text-sm text-[color:var(--panel-text)] dark:text-white truncate">
                            {mur.ner}
                          </div>
                          <div className="truncate text-xs text-[color:var(--muted-text)]">
                            {mur.toot ? `${mur.toot} тоот · ` : ""}
                            {Array.isArray(mur.utas)
                              ? mur.utas.join(", ")
                              : mur.utas}
                          </div>
                        </div>
                        {/* Сонгосон сувгаар хүрэх боломжгүй бол анхааруулна */}
                        {((turul === "App" && !hasApp(mur)) ||
                          (turul === "Mail" && !hasEmail(mur))) && (
                          <span
                            className="shrink-0 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning"
                            title={turul === "App" ? "Апп суулгаагүй — мэдэгдэл хүрэхгүй" : "И-мэйлгүй"}
                          >
                            {turul === "App" ? "Апп-гүй" : "Мэйлгүй"}
                          </span>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.section>
            {/* Right: Message composer */}
            <motion.section
              id="medegdel-composer-section"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-4 shadow-[var(--ctl-shadow)] flex flex-col min-w-0 min-h-0 lg:order-2"
            >
              <AnimatePresence mode="wait">
                {(
                  <motion.div
                    key="composer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-4 flex-1 min-h-0"
                  >

                    <div className="flex flex-col gap-3 flex-1 min-h-0">
                      {/* Суваг */}
                      <div id="medegdel-channels" className="grid h-9 grid-cols-3 gap-0.5 rounded-[10px] border border-[color:var(--ctl-border)] p-0.5">
                        {(["App", "Мессеж", "Mail"] as const).map((m) => {
                          const Icon = channelIcons[m];
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setTurul(m)}
                              className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-[8px] text-[13px] transition-colors ${turul === m
                                ? "bg-theme !text-white"
                                : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                                }`}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{m}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Хэнд илгээх */}
                      <div className="flex items-center justify-between rounded-xl bg-[color:var(--surface-hover)] px-3 py-2 text-[13px]">
                        <span className="text-[color:var(--muted-text)]">Хүлээн авагч</span>
                        <span className={songogdsonKhariltsagch.length ? "font-medium text-brand" : "text-[color:var(--muted-text)]"}>
                          {songogdsonKhariltsagch.length
                            ? `${songogdsonKhariltsagch.length} сонгогдсон`
                            : "Зүүн талын жагсаалтаас сонгоно уу"}
                        </span>
                      </div>
                      <Input
                        id="medegdel-title-input"
                        placeholder="Гарчиг"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="!h-10 !rounded-[10px] text-[13px]"
                      />
                      <Input.TextArea
                        id="medegdel-content-input"
                        rows={8}
                        showCount={turul === "Мессеж" ? { formatter: ({ count }) => `${count} / 160 тэмдэгт` } : false}
                        placeholder="Мэдэгдлийн агуулга бичих..."
                        value={msj}
                        onChange={(e) => setMsj(e.target.value)}
                        className="!min-h-[140px] !resize-none !rounded-[10px] text-[13px]"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          ref={attachInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files?.length) {
                              setComposerTemplateImage(null);
                              const prev = attachImages.length;
                              const maxAdd = Math.max(0, 10 - prev);
                              const newFiles = Array.from(files).slice(0, maxAdd);
                              if (newFiles.length === 0 && files.length > 0) {
                                notification.warning({ message: "Дээд тал нь 10 зураг нэмнэ", style: { zIndex: 99999 } });
                                e.target.value = "";
                                return;
                              }
                              const newUrls = newFiles.map((f) => URL.createObjectURL(f));
                              attachPreviewUrlsRef.current.push(...newUrls);
                              setAttachImages((p) => [...p, ...newFiles]);
                            }
                            e.target.value = "";
                          }}
                        />
                        <button
                          id="medegdel-image-btn"
                          type="button"
                          onClick={() => attachInputRef.current?.click()}
                          className="btn-minimal inline-flex h-9 items-center gap-1.5 !px-3 text-[13px]"
                        >
                          <ImagePlus className="w-4 h-4" />
                          Зураг нэмэх
                        </button>
                        {composerTemplateImage && (
                          <div className="relative inline-block">
                            <img
                              src={composerTemplateImage}
                              alt=""
                              className="w-16 h-16 object-cover rounded-xl border border-white/30"
                            />
                            <button
                              type="button"
                              onClick={() => setComposerTemplateImage(null)}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center shadow hover:bg-danger"
                              aria-label="Зураг хасах"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {attachImages.map((file, idx) => (
                          <div key={`img-${idx}-${file.size}`} className="relative inline-block">
                            <img
                              src={attachPreviewUrlsRef.current[idx] ?? ""}
                              alt=""
                              className="w-16 h-16 object-cover rounded-xl border border-white/30"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const url = attachPreviewUrlsRef.current[idx];
                                if (url) URL.revokeObjectURL(url);
                                attachPreviewUrlsRef.current = attachPreviewUrlsRef.current.filter((_, i) => i !== idx);
                                setAttachImages((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center shadow hover:bg-danger"
                              aria-label="Зураг хасах"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button
                        id="medegdel-new-btn"
                        type="primary"
                        onClick={send}
                        loading={loading}
                        disabled={songogdsonKhariltsagch.length === 0 || !title || (!msj && attachImages.length === 0 && !composerTemplateImage)}
                        className="mt-auto w-full !h-10 !rounded-[10px]"
                      >
                        Илгээх
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </motion.div>
        ) : activeTab === "tulult" ? (
          <motion.div
            key="tulult-tab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-5 flex-1 min-h-0 lg:max-h-[calc(100vh-16rem)]"
          >
            {/* Left side: List of notifications */}
            <div className="neu-panel p-4 sm:p-5 flex flex-col min-w-0 lg:w-[350px] shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-[color:var(--panel-text)] dark:text-white">
                  <Bell className="w-4 h-4 text-brand" />
                  Төлөлтийн мэдэгдлүүд
                </h3>
                <span className="text-xs bg-[color:var(--surface-hover)] dark:bg-white/10 px-2 py-0.5 rounded-2xl text-[color:var(--muted-text)]">
                  {filteredTulult.length}
                </span>
              </div>

              {/* Search input */}
              <div className="relative h-9 w-full neu-panel mb-4 flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                <input
                  aria-label="Хайх"
                  value={tulultSearch}
                  onChange={(e) => setTulultSearch(e.target.value)}
                  className="w-full h-full pl-9 pr-3 rounded-2xl bg-transparent border-0 text-sm text-theme placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/50"
                  placeholder="Нэр, тоот, утас хайх..."
                />
              </div>

              {/* List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {tulultLoading ? (
                  <div className="text-center py-12 text-[color:var(--muted-text)] text-sm">Уншиж байна...</div>
                ) : filteredTulult.length === 0 ? (
                  <div className="text-center py-12 text-[color:var(--muted-text)] text-sm">Төлөлтийн мэдэгдэл олдсонгүй</div>
                ) : (
                  filteredTulult.map((item: any) => {
                    const isSelected = selectedTulult?._id === item._id;
                    const isUnread = !item.kharsanEsekh;
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedTulult(item)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border flex flex-col gap-1.5 relative ${isSelected
                          ? "bg-success/10 border-success shadow-sm"
                          : isUnread
                            ? "border-warning/30 bg-warning/5 hover:bg-warning/10"
                            : "border-theme/20 bg-theme/5 hover:bg-theme/10"
                          }`}
                      >

                        <div className="flex items-center justify-between w-full">

                          <span className="text-[10px] text-[color:var(--muted-text)]">
                            {ognooTsagBogino(item.createdAt || item.ognoo)}
                          </span>
                          {isUnread ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-warning/20 text-warning border border-warning/50 shrink-0">
                              Шинэ
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-theme/20 text-brand border border-theme/50 shrink-0">
                              Уншсан
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-[color:var(--panel-text)] dark:text-white line-clamp-1">
                          {item.title || "QPay төлөлт"}
                        </h4>
                        <p className="text-[11px] text-[color:var(--muted-text)] line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right side: Detail view */}
            <div className="neu-panel p-4 sm:p-5 flex flex-col min-w-0 flex-1 relative">
              {selectedTulult ? (
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                  <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] pb-3">
                    <div>
                      <h2 className="text-base font-bold text-[color:var(--panel-text)] dark:text-white">
                        {selectedTulult.title || "QPay төлөлт"}
                      </h2>
                      <span className="text-xs text-[color:var(--muted-text)]">
                        {ognooTsagButen(selectedTulult.createdAt || selectedTulult.ognoo)}
                      </span>
                    </div>

                  </div>

                  {/* Resident Info Box */}
                  <div className="p-4 rounded-2xl bg-theme/20 border border-theme/10 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-xs text-[color:var(--muted-text)] shrink-0">Нэр:</span>
                      <span className="text-xs font-semibold text-[color:var(--panel-text)] dark:text-white truncate">
                        {residentsMap[selectedTulult.orshinSuugchId]?.ner || selectedTulult.orshinSuugchNer || "..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-xs text-[color:var(--muted-text)] shrink-0">Тоот:</span>
                      <span className="text-xs font-semibold text-[color:var(--panel-text)] dark:text-white">
                        {residentsMap[selectedTulult.orshinSuugchId]?.toot || selectedTulult.gereeniiDugaar || "..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-xs text-[color:var(--muted-text)] shrink-0">Утас:</span>
                      <span className="text-xs font-semibold text-[color:var(--panel-text)] dark:text-white">
                        {residentsMap[selectedTulult.orshinSuugchId]?.utas || selectedTulult.orshinSuugchUtas || "..."}
                      </span>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="flex-1 overflow-y-auto bg-[color:var(--surface-hover)] dark:bg-white/5 rounded-2xl p-4 border border-[color:var(--surface-border)] text-sm text-[color:var(--panel-text)] leading-relaxed whitespace-pre-wrap">
                    {selectedTulult.message}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-2xl neu-panel flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-[color:var(--muted-text)]" />
                  </div>
                  <h3 className="text-sm text-[color:var(--muted-text)] mb-1">Мэдэгдэл сонгоно уу</h3>
                  <p className="text-xs text-[color:var(--muted-text)] max-w-[240px]">
                    Зүүн талын жагсаалтаас дэлгэрэнгүй харах мэдэгдэлийг сонгоно уу.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="niitlel-tab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <BlogManagement />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Мэдэгдэл илгээлтийн дэлгэрэнгүй үр дүнгийн Modal */}
      <Modal
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={400}
        className="[&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-xl overflow-hidden [&_.ant-modal-content]:!bg-[color:var(--surface-bg)] dark:[&_.ant-modal-content]:!bg-[color:var(--panel)] shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--surface-border)] dark:border-white/10">
          <h3 className="text-sm font-semibold text-[color:var(--panel-text)] dark:text-white m-0">
            {lastSendResult?.turul ? `${lastSendResult.turul} илгээлтийн дэлгэрэнгүй` : "Мэдэгдэл илгээлтийн дэлгэрэнгүй"}
          </h3>
          <button
            type="button"
            onClick={() => setResultModalOpen(false)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Cards */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center py-4 px-3 rounded-lg bg-success/10 dark:bg-theme/20 border border-[#86efac] dark:border-theme/60">
              <span className="text-2xl sm:text-3xl font-bold text-[#00875a] dark:text-brand mb-1">
                {lastSendResult?.sent ?? 0}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[color:var(--muted-text)] text-center">
                Амжилттай илгээсэн
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-4 px-3 rounded-lg bg-danger/10 border border-[#fca5a5]">
              <span className="text-2xl sm:text-3xl font-bold text-[#dc2626] mb-1">
                {lastSendResult?.failed ?? 0}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[color:var(--muted-text)] text-center">
                Амжилтгүй болсон
              </span>
            </div>
          </div>

          {/* Failed users detail if any */}
          {lastSendResult?.failedUsers && lastSendResult.failedUsers.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[color:var(--surface-border)] dark:border-white/10">
              <span className="text-[11px] font-semibold text-danger block mb-1.5">
                Амжилтгүй болсон шалтгаан ({lastSendResult.failedUsers.length}):
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-[11px]">
                {lastSendResult.failedUsers.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1 rounded-md bg-danger/70 text-[color:var(--panel-text)]"
                  >
                    <span className="font-medium truncate mr-2">
                      {u.ner} {u.toot ? `(${u.toot})` : ""}
                    </span>
                    <span className="text-danger text-[10px] shrink-0">
                      {u.shaltgaan || "Алдаа"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-[color:var(--surface-border)] dark:border-white/10">
          <button
            type="button"
            onClick={() => setResultModalOpen(false)}
            className="px-4 py-1.5 rounded-md bg-[color:var(--theme)] hover:bg-[color:var(--theme)] text-white text-xs font-medium transition-colors shadow-xs"
          >
            Хаах
          </button>
        </div>
      </Modal>
    </div>
  );
}
