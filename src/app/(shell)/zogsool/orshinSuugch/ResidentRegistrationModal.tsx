"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  User,
  Phone,
  Car,
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  Home,
  ChevronDown,
  FileText,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import uilchilgee from "@/lib/uilchilgee";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { useAuth } from "@/lib/useAuth";
import ModalPortal from "../../../../../components/shell/ModalPortal";

const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А",
  B: "В",
  C: "С",
  E: "Е",
  H: "Н",
  K: "К",
  M: "М",
  O: "О",
  P: "Р",
  T: "Т",
  U: "У",
  X: "Х",
  Y: "Ү",
  D: "Д",
  G: "Г",
  I: "И",
  J: "Ж",
  L: "Л",
  N: "Н",
  Q: "Ө",
  R: "Р",
  S: "С",
  V: "В",
  W: "В",
  Z: "З",
};

interface ResidentRegistrationModalProps {
  onClose: () => void;
  token: string;
  barilgiinId?: string;
  baiguullagiinId?: string;
  onSuccess?: () => void;
  editData?: any;
}

interface InputFieldProps {
  icon: any;
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

const InputField = React.memo(function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  rightElement,
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="group relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors pointer-events-none">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={type}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-10 pr-9 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-colors disabled:opacity-60"
        placeholder={placeholder}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
      <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] font-sans text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors pointer-events-none">
        {label}
      </label>
    </div>
  );
});

export default function ResidentRegistrationModal({
  onClose,
  token,
  barilgiinId,
  baiguullagiinId,
  onSuccess,
  editData,
}: ResidentRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState(editData ? 2 : 1);
  const [searchStatus, setSearchStatus] = useState<"idle" | "found" | "notFound">("idle");

  const { baiguullaga } = useAuth();

  const currentBarilga = useMemo(() => {
    const org = baiguullaga as any;
    return org?.barilguud?.find(
      (b: any) => String(b?._id || b?.id) === String(barilgiinId || ""),
    );
  }, [baiguullaga, barilgiinId]);

  const mashiniiKhyazgaar = useMemo(() => {
    const org = baiguullaga as any;
    const utga =
      currentBarilga?.tokhirgoo?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      currentBarilga?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      org?.tokhirgoo?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      org?.zochinTokhirgoo?.orshinSuugchMashiniiLimit;

    const toon = Number(utga);
    return Number.isFinite(toon) && toon > 0 ? Math.floor(toon) : 0;
  }, [baiguullaga, currentBarilga]);

  const availableToots = useMemo(() => {
    const mapping = currentBarilga?.tokhirgoo?.davkhariinToonuud;
    if (!mapping) return [];

    const allUnits = new Set<string>();
    Object.values(mapping).forEach((units: any) => {
      if (Array.isArray(units)) {
        units.forEach((u) => u && allUnits.add(String(u).trim()));
      } else if (typeof units === "string") {
        units.split(",").forEach((u) => u && allUnits.add(u.trim()));
      }
    });

    return Array.from(allUnits).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [currentBarilga]);

  const [formData, setFormData] = useState({
    plate: editData?.mashiniiDugaar || "",
    name: editData?.ner || editData?.orshinSuugchNer || "",
    ovog: editData?.ovog || "",
    phone: editData?.utas || "",
    register: editData?.register || "",
    unit: editData?.toot || editData?.burtgeliinDugaar || editData?.ezenToot || "",
    type: (editData?.zochinTurul || editData?.turul || "Оршин суугч") as
      | "Оршин суугч"
      | "Түр оршин суугч"
      | "Харилцагч",
    frequency: editData?.davtamjiinTurul || "saraar",
    rightsCount: editData?.zochinErkhiinToo ?? 1,
    freeMinutes: editData?.zochinTusBurUneguiMinut ?? 8,
    description: editData?.zochinTailbar || editData?.tailbar || "",
    orshinSuugchTurul:
      editData?.orshinSuugchTurul ||
      editData?.zochinTurul ||
      editData?.turul ||
      "Оршин суугч",
  });

  const [baigaaMashinuud, setBaigaaMashinuud] = useState<
    Array<{ _id: string; mashiniiDugaar: string }>
  >([]);

  const [zasajBuiMashiniiId, setZasajBuiMashiniiId] = useState<string | null>(
    editData?._id &&
      String(editData._id) !== String(editData?.ezemshigchiinId) &&
      editData?.mashiniiDugaar
      ? String(editData._id)
      : null,
  );

  const [mashinUstgaj, setMashinUstgaj] = useState<string | null>(null);

  const khyazgaarDuurenEsekh =
    !zasajBuiMashiniiId &&
    mashiniiKhyazgaar > 0 &&
    baigaaMashinuud.length >= mashiniiKhyazgaar;

  const isClient =
    formData.orshinSuugchTurul === "Харилцагч" || formData.type === "Харилцагч";

  const baigaaMashinuudAvya = useCallback(
    async (utas?: string, ownerId?: string, turul?: string) => {
      if (!baiguullagiinId) return;
      try {
        const resp = await uilchilgee(token).get("/zochinJagsaalt", {
          params: {
            baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 200,
            search: utas || undefined,
            turul: turul && turul !== "Бүгд" ? turul : undefined,
          },
        });

        const jagsaalt: any[] = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : [];

        const tseverlesen = new Map<
          string,
          { _id: string; mashiniiDugaar: string }
        >();

        jagsaalt.forEach((r) => {
          const rUtas = Array.isArray(r?.utas) ? r.utas[0] : r?.utas;
          const ezniiUtas = String(r?.ezemshigchiinUtas || rUtas || "").replace(
            /\s/g,
            "",
          );
          const samePhone = Boolean(
            utas && ezniiUtas && ezniiUtas === String(utas).replace(/\s/g, ""),
          );
          const sameId = Boolean(
            ownerId &&
              (String(r?._id) === String(ownerId) ||
                String(r?.ezemshigchiinId) === String(ownerId) ||
                String(r?.orshinSuugchiinId) === String(ownerId)),
          );
          if (!samePhone && !sameId) return;

          const dugaar = String(r?.mashiniiDugaar || r?.dugaar || "")
            .trim()
            .toUpperCase();
          if (!dugaar || dugaar === "БҮРТГЭЛГҮЙ" || dugaar === "-") return;

          if (!tseverlesen.has(dugaar)) {
            tseverlesen.set(dugaar, {
              _id: String(r._id),
              mashiniiDugaar: dugaar,
            });
          }
        });

        const list = Array.from(tseverlesen.values());
        if (
          editData?.mashiniiDugaar &&
          editData.mashiniiDugaar !== "БҮРТГЭЛГҮЙ" &&
          editData.mashiniiDugaar !== "-"
        ) {
          const curPlate = editData.mashiniiDugaar.trim().toUpperCase();
          if (!list.some((m) => m.mashiniiDugaar === curPlate)) {
            list.unshift({
              _id: String(editData._id),
              mashiniiDugaar: curPlate,
            });
          }
        }
        setBaigaaMashinuud(list);
      } catch {
        if (
          editData?.mashiniiDugaar &&
          editData.mashiniiDugaar !== "БҮРТГЭЛГҮЙ" &&
          editData.mashiniiDugaar !== "-"
        ) {
          setBaigaaMashinuud([
            {
              _id: String(editData._id),
              mashiniiDugaar: editData.mashiniiDugaar.trim().toUpperCase(),
            },
          ]);
        } else {
          setBaigaaMashinuud([]);
        }
      }
    },
    [baiguullagiinId, barilgiinId, token, editData],
  );

  const mashinZasaya = useCallback(
    (mashin: { _id: string; mashiniiDugaar: string }) => {
      setZasajBuiMashiniiId(mashin._id);
      setFormData((prev) => ({ ...prev, plate: mashin.mashiniiDugaar }));
    },
    [],
  );

  const shineMashinNemey = useCallback(() => {
    setZasajBuiMashiniiId(null);
    setFormData((prev) => ({ ...prev, plate: "" }));
  }, []);

  const mashinUstgaya = async (mashin: {
    _id: string;
    mashiniiDugaar: string;
  }) => {
    if (!token) return;
    setMashinUstgaj(mashin._id);
    try {
      const resp = await uilchilgee(token).delete(
        `/orshinSuugchiinMashin/${mashin._id}`,
        { data: { baiguullagiinId } },
      );

      if (resp.data?.success) {
        toast.success(resp.data.message || "Машины бүртгэл устгагдлаа");
        if (zasajBuiMashiniiId === mashin._id) shineMashinNemey();
        await baigaaMashinuudAvya(
          formData.phone,
          editData?.ezemshigchiinId || editData?._id,
          formData.orshinSuugchTurul || formData.type,
        );
        onSuccess?.();
      } else {
        toast.error(resp.data?.aldaa || "Устгахад алдаа гарлаа");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.aldaa ||
          err?.response?.data?.message ||
          "Устгахад алдаа гарлаа",
      );
    } finally {
      setMashinUstgaj(null);
    }
  };

  useEffect(() => {
    if (editData) {
      baigaaMashinuudAvya(
        editData.utas,
        editData.ezemshigchiinId || editData._id,
        editData.orshinSuugchTurul || editData.zochinTurul || editData.turul,
      );
      if (
        editData.mashiniiDugaar &&
        editData.mashiniiDugaar !== "БҮРТГЭЛГҮЙ" &&
        editData.mashiniiDugaar !== "-"
      ) {
        setBaigaaMashinuud([
          {
            _id: String(editData._id),
            mashiniiDugaar: editData.mashiniiDugaar.trim().toUpperCase(),
          },
        ]);
      }
    }
  }, [editData, baigaaMashinuudAvya]);

  const handleSearch = async (phoneOverride?: any, keepStep = false) => {
    const phoneToSearch =
      typeof phoneOverride === "string" ? phoneOverride : formData.phone;

    if (!phoneToSearch || phoneToSearch.length !== 8) {
      toast.error("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }

    setSearching(true);
    try {
      let found: any = null;
      let isCust = false;

      // 1. Search in OrshinSuugch
      try {
        const resp = await uilchilgee(token).get("/orshinSuugch", {
          params: {
            baiguullagiinId,
            barilgiinId,
            search: phoneToSearch,
          },
        });
        if (Array.isArray(resp.data?.jagsaalt) && resp.data.jagsaalt.length > 0) {
          found = resp.data.jagsaalt[0];
        }
      } catch (e) {
        console.warn("OrshinSuugch search error:", e);
      }

      // 2. Search in Khariltsagch
      if (!found) {
        try {
          const kResp = await uilchilgee(token).get("/khariltsagch", {
            params: {
              baiguullagiinId,
              barilgiinId,
              search: phoneToSearch,
            },
          });
          if (Array.isArray(kResp.data?.jagsaalt) && kResp.data.jagsaalt.length > 0) {
            found = kResp.data.jagsaalt[0];
            isCust = true;
          }
        } catch (e) {
          console.warn("Khariltsagch search error:", e);
        }
      }

      if (found) {
        setSearchStatus("found");
        if (isCust) {
          setFormData((prev) => ({
            ...prev,
            phone: phoneToSearch,
            name: found.ner || found.khariltsagchNer || prev.name,
            ovog: found.ovog || prev.ovog,
            register: found.register || prev.register,
            unit: found.toot || found.zogsooliinDugaar || prev.unit,
            orshinSuugchTurul: prev.orshinSuugchTurul || "Харилцагч",
            type: "Харилцагч",
          }));
          toast.success("Харилцагчийн мэдээлэл олдлоо");
        } else {
          const specificToot = Array.isArray(found.toots)
            ? found.toots.find(
                (t: any) =>
                  String(t.barilgiinId) === String(barilgiinId) &&
                  t.source !== "WALLET_API",
              )
            : null;

          setFormData((prev) => ({
            ...prev,
            phone: phoneToSearch,
            name:
              specificToot?.ner || found.ner || found.orshinSuugchNer || prev.name,
            ovog: found.ovog || prev.ovog,
            register: found.register || prev.register,
            unit: specificToot?.toot || found.toot || prev.unit,
            rightsCount: found.zochinErkhiinToo ?? prev.rightsCount,
            freeMinutes: found.zochinTusBurUneguiMinut ?? prev.freeMinutes,
            type: found.zochinTurul || found.turul || prev.type,
            frequency: found.davtamjiinTurul || prev.frequency,
            orshinSuugchTurul:
              prev.orshinSuugchTurul ||
              found.zochinTurul ||
              found.turul ||
              "Оршин суугч",
          }));
          toast.success("Оршин суугчийн мэдээлэл олдлоо");
        }

        await baigaaMashinuudAvya(
          phoneToSearch,
          found._id,
          isCust ? "Харилцагч" : "Оршин суугч",
        );
        if (!keepStep) setStep(2);
      } else {
        setSearchStatus("notFound");
        setFormData((prev) => ({ ...prev, phone: phoneToSearch }));
        toast("Бүртгэлгүй тул мэдээллийг шинээр оруулна уу.", {
          icon: "ℹ️",
        });
        if (!keepStep) setStep(2);
      }
    } catch {
      setFormData((prev) => ({ ...prev, phone: phoneToSearch }));
      if (!keepStep) setStep(2);
    } finally {
      setSearching(false);
    }
  };

  const handleManualProceed = () => {
    if (isClient && !formData.phone) {
      setStep(2);
      return;
    }
    if (!isClient) {
      if (!formData.phone || formData.phone.length !== 8) {
        toast.error("Утасны дугаар 8 оронтой байх ёстой");
        return;
      }
    }
    handleSearch(formData.phone);
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase().replace(/\s/g, "");
    if (input.length > 7) return;

    const digits = input.slice(0, 4);
    const chars = input.slice(4);

    let convertedChars = "";
    for (const c of chars) {
      convertedChars += LATIN_TO_CYRILLIC[c] || c;
    }

    const fullPlate = digits + convertedChars;
    if (/^\d*$/.test(digits) && /^[А-ЯӨҮЁ]*$/.test(convertedChars)) {
      setFormData((prev) => ({ ...prev, plate: fullPlate }));
    }
  };

  const handleSave = async () => {
    let hasError = false;

    if (!formData.name?.trim()) {
      toast.error("Оршин суугчийн нэр заавал оруулна уу");
      hasError = true;
    }

    if (!isClient) {
      if (!formData.phone?.trim()) {
        toast.error("Утасны дугаар заавал оруулна уу");
        hasError = true;
      } else if (formData.phone.trim().length !== 8) {
        toast.error("Утасны дугаар 8 оронтой байх ёстой");
        hasError = true;
      }
    }

    if (hasError) return;

    if (khyazgaarDuurenEsekh) {
      toast.error(
        `Нэг оршин суугч дээр хамгийн олон ${mashiniiKhyazgaar} машин бүртгэх боломжтой.`,
      );
      return;
    }

    setLoading(true);
    try {
      const plateToUse = formData.plate.trim().toUpperCase() || "БҮРТГЭЛГҮЙ";

      const payload = {
        baiguullagiinId,
        barilgiinId,
        mashiniiDugaar: plateToUse,
        ezemshigchiinUtas: formData.phone,
        turul: formData.orshinSuugchTurul || formData.type,
        khariltsagchMedeelel: {
          _id: editData?.ezemshigchiinId,
          ner: formData.name,
          ovog: formData.ovog || formData.name,
          register: formData.register || "00000000",
          utas: formData.phone,
          turul: "Иргэн",
          baiguullagiinId,
          barilgiinId,
          davtamjiinTurul: formData.frequency,
          ezenToot: formData.unit,
          idevkhiteiEsekh: true,
          mashiniiDugaar: plateToUse,
          zochinErkhiinToo: formData.rightsCount,
          zochinTailbar: formData.description,
          zochinTurul: formData.orshinSuugchTurul || formData.type,
          zochinTusBurUneguiMinut: formData.freeMinutes,
          zochinUrikhEsekh: true,
        },
        mashinMedeelel: {
          _id: zasajBuiMashiniiId || undefined,
          dugaar: plateToUse,
          ezemshigchiinNer: formData.name,
          ezemshigchiinRegister: formData.register || "00000000",
          ezemshigchiinUtas: formData.phone,
          turul: formData.orshinSuugchTurul || formData.type,
          ezemshigchiinTalbainDugaar: formData.unit,
          baiguullagiinId,
          barilgiinId,
          orshinSuugchTurul: formData.orshinSuugchTurul || undefined,
        },
        ezemshigchiinId: editData?.ezemshigchiinId || undefined,
        tukhainBaaziinKholbolt: null,
      };

      const resp = await uilchilgee(token).post("/zochinHadgalya", payload);

      if (resp.status === 200 || resp.status === 201 || resp.data?.success) {
        toast.success("Амжилттай хадгаллаа");
        onSuccess?.();
        onClose();
      } else {
        toast.error("Амжилтгүй боллоо");
      }
    } catch (err: any) {
      console.error("Save Error:", err);
      toast.error(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useModalHotkeys({
    isOpen: true,
    onClose,
    onSubmit: step === 1 ? handleManualProceed : handleSave,
  });

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`relative w-full ${
            step === 1 ? "max-w-md" : "max-w-3xl"
          } bg-white dark:bg-[color:var(--panel)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[color:var(--surface-border)] dark:border-white/10 ring-1 ring-black/5 my-auto`}
        >
          {/* Header */}
          <div className="relative px-6 sm:px-8 py-5 border-b border-[color:var(--surface-border)] dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step === 2 && !editData && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    title="Хайлт руу буцах"
                    className="p-1.5 -ml-1 rounded-xl text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-semibold text-[color:var(--panel-text)] dark:text-white tracking-tight">
                      {step === 1
                        ? "Оршин суугч хайх"
                        : editData
                          ? zasajBuiMashiniiId
                            ? "Машин засах"
                            : "Шинээр машин бүртгэх"
                          : "Машин бүртгэл"}
                    </h2>
                    {searchStatus === "found" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3 h-3" />
                        Бүртгэлтэй
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                    {step === 1
                      ? "Утасны дугаараар хайж өмнөх бүртгэлийг автоматаар татна"
                      : editData
                        ? zasajBuiMashiniiId
                          ? "Бүртгэлтэй машины дугаар засах"
                          : "Тухайн эзэн дээр шинэ машин бүртгэх"
                        : "Оршин суугч болон тээврийн хэрэгслийн мэдээлэл оруулах"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10 text-[color:var(--muted-text)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {step === 1 ? (
            // STEP 1: Fast Phone Search
            <div className="p-6 sm:p-8">
              <div className="space-y-5">
                <div className="group relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)]">
                    <User className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.orshinSuugchTurul}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        orshinSuugchTurul: e.target.value,
                        type:
                          e.target.value === "Оршин суугч"
                            ? "Оршин суугч"
                            : (e.target.value as any),
                      }))
                    }
                    className="w-full h-11 pl-10 pr-8 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Оршин суугч">Оршин суугч</option>
                    <option value="Харилцагч">Харилцагч</option>
                    <option value="Ажилтан">Ажилтан</option>
                    <option value="СӨХ">СӨХ</option>
                    <option value="Үнэгүй">Үнэгүй</option>
                    <option value="Дотоод">Дотоод</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                  <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] font-sans text-[color:var(--muted-text)]">
                    Төрөл
                  </label>
                </div>

                <div className="relative group">
                  <InputField
                    icon={Phone}
                    label="Утасны дугаар"
                    value={formData.phone}
                    type="tel"
                    onChange={(v) => {
                      const val = v.replace(/\D/g, "");
                      if (val.length > 8) return;
                      setFormData((prev) => ({ ...prev, phone: val }));
                    }}
                    placeholder="88888888"
                    rightElement={
                      searching ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand mr-1" />
                      ) : formData.phone?.length === 8 ? (
                        <button
                          type="button"
                          onClick={() => handleSearch(formData.phone)}
                          className="p-1 text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer"
                          title="Хайх"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      ) : null
                    }
                  />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={handleManualProceed}
                    disabled={searching}
                    variant="primary"
                    size="md"
                    fullWidth
                    className="h-11 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity font-medium"
                    isLoading={searching}
                    data-modal-primary
                    rightIcon={
                      !searching ? <ArrowRight className="w-4 h-4" /> : undefined
                    }
                  >
                    {formData.phone?.length === 8
                      ? "Хайж үргэлжлүүлэх"
                      : isClient
                        ? "Шууд үргэлжлүүлэх (Утасгүй)"
                        : "Үргэлжлүүлэх"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-1 text-xs text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition-colors text-center cursor-pointer"
                  >
                    Хайлтгүйгээр шууд гараар бөглөх →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // STEP 2: Unified Form
            <>
              <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                  {/* Left Column: Personal Info (5 cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)] dark:border-white/5">
                      <span className="p-1.5 rounded-lg bg-[color:var(--surface-hover)] dark:bg-white/10 text-black dark:text-white">
                        <User className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs font-medium text-[color:var(--muted-text)]">
                        Хувийн мэдээлэл
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <InputField
                        icon={Phone}
                        label={isClient ? "Утас (заавал биш)" : "Утас"}
                        value={formData.phone}
                        type="tel"
                        onChange={(v) => {
                          const val = v.replace(/\D/g, "");
                          if (val.length > 8) return;
                          setFormData((prev) => ({ ...prev, phone: val }));
                        }}
                        placeholder={isClient ? "Заавал биш" : "88888888"}
                        rightElement={
                          searching ? (
                            <Loader2 className="w-4 h-4 animate-spin text-brand mr-1" />
                          ) : formData.phone?.length === 8 ? (
                            <button
                              type="button"
                              onClick={() => handleSearch(formData.phone, true)}
                              title="Энэ утсаар мэдээлэл татах"
                              className="p-1 text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          ) : null
                        }
                      />

                      {!["СӨХ", "Ажилтан", "Үнэгүй", "Дотоод", "Харилцагч"].includes(
                        formData.orshinSuugchTurul,
                      ) && (
                        <div className="group relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors z-10 pointer-events-none">
                            <Home className="w-4 h-4" />
                          </div>
                          <input
                            list="toot-suggestions"
                            value={formData.unit}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                unit: e.target.value,
                              }))
                            }
                            className="w-full h-11 pl-10 pr-4 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-colors"
                            placeholder="Тоот сонгох"
                          />
                          {availableToots.length > 0 && (
                            <datalist id="toot-suggestions">
                              {availableToots.map((t) => (
                                <option key={t} value={t} />
                              ))}
                            </datalist>
                          )}
                          <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] font-sans text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors pointer-events-none">
                            Тоот
                          </label>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <InputField
                          icon={User}
                          label="Овог"
                          value={formData.ovog}
                          onChange={(v) =>
                            setFormData((prev) => ({ ...prev, ovog: v }))
                          }
                          placeholder="Овог"
                        />
                        <InputField
                          icon={User}
                          label="Нэр"
                          value={formData.name}
                          onChange={(v) =>
                            setFormData((prev) => ({ ...prev, name: v }))
                          }
                          placeholder="Нэр"
                        />
                      </div>

                      {!["СӨХ", "Ажилтан", "Үнэгүй", "Дотоод", "Харилцагч"].includes(
                        formData.orshinSuugchTurul,
                      ) && (
                        <div className="group relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] pointer-events-none">
                            <Home className="w-4 h-4" />
                          </div>
                          <select
                            value={formData.type}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                type: e.target.value as any,
                              }))
                            }
                            className="w-full h-11 pl-10 pr-8 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-colors appearance-none cursor-pointer"
                          >
                            <option value="Оршин суугч">Оршин суугч</option>
                            <option value="Түр оршин суугч">Түр оршин суугч</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                          <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] text-[color:var(--muted-text)] pointer-events-none">
                            Төрөл
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Asset & Config (7 cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)] dark:border-white/5">
                      <span className="p-1.5 rounded-lg bg-[color:var(--surface-hover)] dark:bg-white/10 text-black dark:text-white">
                        <Car className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs font-medium text-[color:var(--muted-text)]">
                        Тээврийн хэрэгсэл & Тохиргоо
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] pointer-events-none">
                          <User className="w-4 h-4" />
                        </div>
                        <select
                          value={formData.orshinSuugchTurul || "Оршин суугч"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              orshinSuugchTurul: val,
                              type:
                                val === "Оршин суугч"
                                  ? "Оршин суугч"
                                  : (val as any),
                            }));
                          }}
                          className="w-full h-11 pl-10 pr-8 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-colors appearance-none cursor-pointer"
                        >
                          <option value="Оршин суугч">Оршин суугч</option>
                          <option value="Харилцагч">Харилцагч</option>
                          <option value="Ажилтан">Ажилтан</option>
                          <option value="Дотоод">Дотоод</option>
                          <option value="СӨХ">СӨХ</option>
                          <option value="Үнэгүй">Үнэгүй</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                        <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] font-sans text-[color:var(--muted-text)] pointer-events-none">
                          Бүртгэх төрөл
                        </label>
                      </div>

                      {/* Эзэн дээр бүртгэлтэй машинууд болон үйлдлийн сонголт */}
                      {(baigaaMashinuud.length > 0 || editData) && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[color:var(--muted-text)]">
                              Машины бүртгэл / үйлдэл
                            </span>
                            {mashiniiKhyazgaar > 0 && (
                              <span className="text-[11px] font-medium text-[color:var(--muted-text)]">
                                {baigaaMashinuud.length}/{mashiniiKhyazgaar}
                              </span>
                            )}
                          </div>

                          {baigaaMashinuud.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {baigaaMashinuud.map((mashin) => {
                                const zasajBui =
                                  zasajBuiMashiniiId === mashin._id;
                                const ustgaj = mashinUstgaj === mashin._id;

                                return (
                                  <div
                                    key={mashin._id}
                                    className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border transition-colors ${
                                      zasajBui
                                        ? "border-theme bg-theme/10"
                                        : "border-[color:var(--surface-border)] dark:border-white/10 bg-[color:var(--surface-hover)]"
                                    }`}
                                  >
                                    <Car className="w-4 h-4 text-[color:var(--muted-text)] shrink-0" />
                                    <span className="flex-1 text-sm font-mono font-medium tracking-wider text-[color:var(--panel-text)]">
                                      {mashin.mashiniiDugaar}
                                    </span>

                                    {zasajBui && (
                                      <span className="text-[11px] font-medium text-brand">
                                        Засаж байна
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => mashinZasaya(mashin)}
                                      disabled={ustgaj}
                                      title="Дугаарыг засах"
                                      className="p-1.5 rounded-lg text-[color:var(--muted-text)] hover:text-brand hover:bg-theme/10 dark:hover:bg-theme/10 disabled:opacity-40 transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => mashinUstgaya(mashin)}
                                      disabled={ustgaj}
                                      title="Машины бүртгэлийг устгах"
                                      className="p-1.5 rounded-lg text-[color:var(--muted-text)] hover:text-danger hover:bg-danger/10 disabled:opacity-40 transition-colors cursor-pointer"
                                    >
                                      {ustgaj ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Үйлдлийн товчнууд: Шинээр машин бүртгэх / Бүртгэлтэй машин засах */}
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const target =
                                  baigaaMashinuud.find(
                                    (m) => m._id === zasajBuiMashiniiId,
                                  ) || baigaaMashinuud[0];
                                const targetId =
                                  target?._id || String(editData?._id || "");
                                const targetPlate =
                                  target?.mashiniiDugaar ||
                                  editData?.mashiniiDugaar ||
                                  "";
                                if (targetId) setZasajBuiMashiniiId(targetId);
                                setFormData((prev) => ({
                                  ...prev,
                                  plate:
                                    targetPlate === "БҮРТГЭЛГҮЙ"
                                      ? ""
                                      : targetPlate,
                                }));
                              }}
                              className={`h-9.5 px-3 rounded-xl text-xs font-medium border transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                zasajBuiMashiniiId
                                  ? "border-theme bg-theme text-white shadow-xs font-semibold"
                                  : "border-[color:var(--surface-border)] dark:border-white/10 bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] hover:border-theme/40"
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Бүртгэлтэй машин засах</span>
                            </button>

                            <button
                              type="button"
                              onClick={shineMashinNemey}
                              disabled={
                                mashiniiKhyazgaar > 0 &&
                                baigaaMashinuud.length >= mashiniiKhyazgaar
                              }
                              className={`h-9.5 px-3 rounded-xl text-xs font-medium border transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                !zasajBuiMashiniiId
                                  ? "border-theme bg-theme text-white shadow-xs font-semibold"
                                  : "border-[color:var(--surface-border)] dark:border-white/10 bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] hover:border-theme/40"
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Шинээр машин бүртгэх</span>
                            </button>
                          </div>

                          {!zasajBuiMashiniiId && khyazgaarDuurenEsekh && (
                            <p className="mt-1 text-[11px] leading-relaxed text-warning">
                              Хязгаар дүүрсэн байна. Шинэ машин нэмэхийн тулд
                              дээрхээс нэгийг устгах, эсвэл Тохиргоо → Нэмэлт
                              тохиргоо → «Машины бүртгэлийн хязгаар»-аас дээд
                              тоог өсгөнө.
                            </p>
                          )}
                        </div>
                      )}

                      {/* License Plate Input */}
                      <div className="relative p-4 sm:p-5 rounded-2xl bg-[color:var(--surface-hover)] dark:bg-white/[0.02] flex flex-col justify-center items-center overflow-hidden border border-[color:var(--surface-border)] dark:border-white/10">
                        <label className="text-xs font-medium text-[color:var(--muted-text)] mb-2.5">
                          {zasajBuiMashiniiId
                            ? "Улсын дугаар засах (4 тоо + 3 кирилл үсэг)"
                            : "ШИНЭЭР бүртгэх машины улсын дугаар (4 тоо + 3 кирилл үсэг)"}
                        </label>
                        <div className="relative w-64 h-[64px] bg-[color:var(--surface-bg)] rounded-xl border-2 border-[color:var(--surface-border)] dark:border-white/10 focus-within:border-theme flex items-center shadow-xs transition-colors">
                          <input
                            type="text"
                            value={
                              formData.plate === "БҮРТГЭЛГҮЙ"
                                ? ""
                                : formData.plate
                            }
                            onChange={handlePlateChange}
                            className="w-full h-full text-center text-2xl sm:text-3xl font-medium uppercase tracking-[0.15em] outline-none font-mono focus:ring-0 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)]"
                            placeholder="1234УБҮ"
                          />
                          {formData.plate && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, plate: "" }))
                              }
                              className="absolute right-2.5 p-1 rounded-full text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition-colors cursor-pointer"
                              title="Цэвэрлэх"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <InputField
                        icon={FileText}
                        label="Тайлбар"
                        value={formData.description}
                        onChange={(v) =>
                          setFormData((prev) => ({ ...prev, description: v }))
                        }
                        placeholder="Нэмэлт тайлбар..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 sm:p-6 border-t border-[color:var(--surface-border)] dark:border-white/5 bg-white/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
                {!editData ? (
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center gap-1.5 text-xs text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Буцах</span>
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    size="sm"
                    className="hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10 transition-colors"
                  >
                    Хаах
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                    isLoading={loading}
                    data-modal-primary
                    className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity font-medium px-5"
                  >
                    Хадгалах
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </ModalPortal>
  );
}
