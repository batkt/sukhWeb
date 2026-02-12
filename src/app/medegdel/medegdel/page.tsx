"use client";

import { useEffect, useState, useRef } from "react";
import { Button, Input, Modal, notification } from "antd";
import Aos from "aos";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, Bell, Users, Mail, MessageSquare, Smartphone, FileText, Plus, ImagePlus, X } from "lucide-react";
import uilchilgee, { getApiUrl } from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
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

export default function KhyanaltFrontend() {
  const { barilgiinId, token, ajiltan, baiguullaga } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId;
  const { selectedBuildingId } = useBuilding();
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
      if (turul === "Мессеж") {
        // Build msgnuud array for SMS service
        const msgnuud = songogdsonKhariltsagch.flatMap((user) => {
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

        await uilchilgee(token).post("/msgIlgeeye", {
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
          msgnuud: msgnuud,
        });
      } else if (turul === "Mail") {
        // Build mailuud array for email service
        const mailuud = songogdsonKhariltsagch
          .filter((user) => user.mail && user.mail.trim() !== "")
          .map((user) => ({
            mail: user.mail,
            content: `<p>${msj}</p>`,
          }));

        await uilchilgee(token).post("/mailOlnoorIlgeeye", {
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
          mailuud: mailuud,
          subject: title,
        });
      } else {
        // For App: use FormData when sending image so backend receives multipart zurag
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
        } else {
          await uilchilgee(token).post("/medegdelIlgeeye", {
            medeelel: { title, body: msj },
            orshinSuugchId: orshinSuugchIdArray,
            baiguullagiinId: baiguullagiinId,
            barilgiinId: barilgiinId,
            turul: turul,
          });
        }
      }

      // Show different success message based on service type
      const successMessage =
        turul === "Мессеж"
          ? "Мессеж амжилттай илгээгдлээ"
          : turul === "Mail"
          ? "Имэйл амжилттай илгээгдлээ"
          : "Мэдэгдэл амжилттай илгээгдлээ";

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

  const channelIcons = { App: Smartphone, Мессеж: MessageSquare, Mail: Mail } as const;

  return (
    <div className="min-h-0 flex flex-col p-3 sm:p-4 md:p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4 sm:mb-6"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl neu-panel flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-theme" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl  text-theme">Мэдэгдэл</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Харилцагчид руу мэдэгдэл илгээх</p>
        </div>
      </motion.header>

      {/* Main content: 3-column layout, flexible height */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-5 flex-1 min-h-0 lg:max-h-[calc(100vh-12rem)]">
        {/* Left: Channel & Templates */}
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="neu-panel p-4 sm:p-5 flex flex-col min-w-0 lg:flex-1"
        >
          
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 min-w-0">
            {(["App", "Мессеж", "Mail"] as const).map((m) => {
              const Icon = channelIcons[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTurul(m)}
                  className={`min-w-0 flex items-center justify-center gap-1 py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs  transition-all duration-200 truncate ${
                    turul === m
                      ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                      : "hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">{m}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 mb-2">
            <span className="text-xs  text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Загвар
            </span>
            <button
              type="button"
              onClick={handleOpenTemplateModal}
              className="btn-minimal-sm btn-minimal inline-flex items-center gap-1.5 px-2 py-1 text-xs"
            >
               
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
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-white/15 transition-all truncate"
                >
                  {t.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              Загвар байхгүй. &quot;Нэмэх&quot; дарж нэмнэ үү.
            </p>
          )}

          <Modal
            title="Загвар нэмэх"
            open={templateModalOpen}
            onOk={handleSaveTemplate}
            onCancel={() => setTemplateModalOpen(false)}
            okText="Хадгалах"
            cancelText="Цуцлах"
            destroyOnClose
            className="[&_.ant-modal-content]:rounded-2xl"
          >
            <div className="flex flex-col gap-4 pt-2">
              <div>
                <label className="block text-sm  text-slate-700 dark:text-slate-300 mb-1">Нэр</label>
                <Input
                  placeholder="Загварын нэр"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm  text-slate-700 dark:text-slate-300 mb-1">Гарчиг</label>
                <Input
                  placeholder="Мэдэгдлийн гарчиг"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm  text-slate-700 dark:text-slate-300 mb-1">Агуулга</label>
                <Input.TextArea
                  placeholder="Мэдэгдлийн агуулга"
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  rows={5}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm  text-slate-700 dark:text-slate-300 mb-1">Зураг (заавал биш)</label>
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs  border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-white/10"
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
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="neu-panel p-4 sm:p-5 flex flex-col min-w-0 lg:flex-1"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm  flex items-center gap-2 text-slate-700 dark:text-white">
              <Users className="w-4 h-4 text-theme" />
              Харилцагчид
            </h3>
            {orshinSuugchGaralt && (
              <span className="text-xs text-slate-500 bg-white/10 px-2 py-0.5 rounded-2xl">
                {orshinSuugchGaralt.niitMur || 0}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={
                  songogdsonKhariltsagch.length === filteredGeree.length &&
                  filteredGeree.length > 0
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-slate-700 dark:text-slate-200">Бүгд сонгох</span>
            </label>
            {songogdsonKhariltsagch.length > 0 && (
              <span className="text-xs text-theme ">
                {songogdsonKhariltsagch.length} сонгогдсон
              </span>
            )}
          </div>

          <div className="relative h-9 w-full neu-panel mb-3 flex items-center">
            <SearchIcon className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              aria-label="Хайх"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full pl-9 pr-3 rounded-2xl bg-transparent border-0 text-sm text-theme placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/50"
              placeholder="Нэр, утас хайх..."
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 px-1 pr-1 custom-scrollbar">
              {isValidating ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Уншиж байна...
                </div>
              ) : filteredGeree.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
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
                      className={`flex items-center gap-3 py-2 px-3 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-500/20 border-blue-500"
                          : "border-transparent hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-4 h-4 rounded shrink-0 pointer-events-none"
                      />
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center text-white text-sm  shrink-0">
                        {mur.ner?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className=" text-sm text-slate-800 dark:text-white truncate">
                          {mur.ner}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {Array.isArray(mur.utas)
                            ? mur.utas.join(", ")
                            : mur.utas}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
        </motion.section>
        {/* Right: Message composer */}
        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="neu-panel p-4 sm:p-5 flex flex-col min-w-0 lg:flex-1"
        >
          <AnimatePresence mode="wait">
            {songogdsonKhariltsagch.length > 0 ? (
              <motion.div
                key="composer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4 flex-1 min-h-0"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm  text-slate-700 dark:text-slate-200">
                    Сонгогдсон: {songogdsonKhariltsagch.length}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                    {songogdsonKhariltsagch.map((mur) => (
                      <span
                        key={mur._id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs "
                      >
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-[10px]">
                          {mur.ner?.[0] || "?"}
                        </span>
                        {mur.ner}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 flex-1 min-h-0">
                  <Input
                    placeholder="Гарчиг"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="!rounded-xl !h-11 text-sm bg-white/20 dark:bg-white/10 border border-white/30"
                  />
                  <Input.TextArea
                    rows={6}
                    placeholder="Мэдэгдлийн агуулга бичих..."
                    value={msj}
                    onChange={(e) => setMsj(e.target.value)}
                    className="!rounded-xl text-sm bg-white/20 dark:bg-white/10 border border-white/30 !min-h-[100px] !resize-none"
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
                      type="button"
                      onClick={() => attachInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs  bg-white/20 dark:bg-white/10 border border-white/30 hover:bg-white/30 transition-colors"
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
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600"
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
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600"
                          aria-label="Зураг хасах"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="primary"
                    onClick={send}
                    loading={loading}
                    disabled={!title || (!msj && attachImages.length === 0 && !composerTemplateImage)}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 !text-white  border-0 shadow-lg hover:shadow-xl hover:opacity-95 transition-all"
                  >
                    Илгээх
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4"
              >
                <div className="w-16 h-16 rounded-2xl neu-panel flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-sm  text-slate-600 dark:text-slate-300 mb-1">
                  Харилцагч сонгоно уу
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px]">
                  Зүүн талын жагсаалтаас мэдэгдэл илгээх хүмүүсийг сонгоод бичлэгээ үргэлжлүүлнэ үү.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}
