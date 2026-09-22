"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  User,
  Phone,
  MapPin,
  Car,
  Briefcase,
  Calendar,
  Info,
  Search,
  X,
  ArrowRight,
  Home,
  ChevronDown,
  Clock,
  Hash,
  FileText,
  Save,
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import uilchilgee from "@/lib/uilchilgee";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import Button from "@/components/ui/Button";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { useAuth } from "@/lib/useAuth";
import ModalPortal from "../../../../../components/shell/ModalPortal";

interface ResidentRegistrationModalProps {
  onClose: () => void;
  token: string;
  barilgiinId?: string;
  baiguullagiinId?: string;
  onSuccess?: () => void;
  editData?: any;
}

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

  const { baiguullaga } = useAuth();

  /**
   * Нэг оршин суугч дээр бүртгэж болох машины дээд тоо.
   *
   * Вебийн «Нэмэлт тохиргоо → Машины бүртгэлийн хязгаар»-аас тохируулна.
   * Барилга → байгууллагын дарааллаар уншина; 0 бол тохируулаагүй тул
   * хязгаарлахгүй (backend-ийн `mashiniiKhyazgaarOlya`-тай ижил дүрэм).
   */
  const mashiniiKhyazgaar = useMemo(() => {
    const org = baiguullaga as any;
    const barilga = org?.barilguud?.find(
      (b: any) => String(b?._id || b?.id) === String(barilgiinId || ""),
    );

    const utga =
      barilga?.tokhirgoo?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      barilga?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      org?.tokhirgoo?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      org?.zochinTokhirgoo?.orshinSuugchMashiniiLimit;

    const toon = Number(utga);
    return Number.isFinite(toon) && toon > 0 ? Math.floor(toon) : 0;
  }, [baiguullaga, barilgiinId]);

  const [formData, setFormData] = useState({
    plate: editData?.mashiniiDugaar || "",
    name: editData?.ner || editData?.orshinSuugchNer || "",
    ovog: editData?.ovog || "",
    phone: editData?.utas || "",
    register: editData?.register || "",
    unit: editData?.toot || editData?.burtgeliinDugaar || editData?.ezenToot || "",
    // Харилцагч (зогсоол/агуулахын эзэн) ч энэ модалаар бүртгэгддэг тул
    // төрлийн нэгдэлд нь орсон байх ёстой.
    type: (editData?.zochinTurul || editData?.turul || "Оршин суугч") as
      | "Оршин суугч"
      | "Түр оршин суугч"
      | "Харилцагч",
    frequency: editData?.davtamjiinTurul || "saraar",
    rightsCount: editData?.zochinErkhiinToo ?? 1,
    freeMinutes: editData?.zochinTusBurUneguiMinut ?? 8,
    description: editData?.zochinTailbar || editData?.tailbar || "",
    orshinSuugchTurul: editData?.orshinSuugchTurul || editData?.zochinTurul || editData?.turul || "Оршин суугч",
  });

  /**
   * Эзэнд бүртгэлтэй машинууд (id-тай — засах/устгахад хэрэгтэй).
   *
   * Зогсоолын жагсаалт машин тус бүрээр мөр буцаадаг тул тухайн утасны
   * мөрүүдээс цуглуулна.
   */
  const [baigaaMashinuud, setBaigaaMashinuud] = useState<
    Array<{ _id: string; mashiniiDugaar: string }>
  >([]);

  /**
   * Одоо ЗАСАЖ байгаа машины id. `null` бол шинэ машин нэмэх горим.
   *
   * Хадгалахад `mashinMedeelel._id`-гаар дамждаг тул backend яг ТЭР машиныг
   * шинэчилнэ. Өмнө нь зөвхөн `editData`-аас уншдаг тул модал дотроос өөр
   * машин сонгож засах боломжгүй байв.
   */
  const [zasajBuiMashiniiId, setZasajBuiMashiniiId] = useState<string | null>(
    editData?._id &&
      String(editData._id) !== String(editData?.ezemshigchiinId) &&
      editData?.mashiniiDugaar
      ? String(editData._id)
      : null,
  );

  /** Аль машиныг устгаж байгаа (товч дээр эргэлт харуулахад). */
  const [mashinUstgaj, setMashinUstgaj] = useState<string | null>(null);

  /** Шинэ машин нэмэх үед хязгаар дүүрсэн эсэх (засах үед хамаарахгүй). */
  const khyazgaarDuurenEsekh =
    !zasajBuiMashiniiId &&
    mashiniiKhyazgaar > 0 &&
    baigaaMashinuud.length >= mashiniiKhyazgaar;

  /** Эзний бүртгэлтэй машинуудыг утсаар татна. */
  const baigaaMashinuudAvya = async (utas: string) => {
    if (!utas || !baiguullagiinId) return;
    try {
      const resp = await uilchilgee(token).get("/zochinJagsaalt", {
        params: {
          baiguullagiinId,
          ...(barilgiinId ? { barilgiinId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 200,
          search: utas,
          turul: "Оршин суугч",
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
        if (ezniiUtas !== String(utas).replace(/\s/g, "")) return;

        const dugaar = String(r?.mashiniiDugaar || r?.dugaar || "")
          .trim()
          .toUpperCase();
        if (!dugaar || dugaar === "БҮРТГЭЛГҮЙ" || dugaar === "-") return;

        if (!tseverlesen.has(dugaar)) {
          tseverlesen.set(dugaar, { _id: String(r._id), mashiniiDugaar: dugaar });
        }
      });

      setBaigaaMashinuud(Array.from(tseverlesen.values()));
    } catch {
      // Тоолж чадаагүй ч бүртгэлийг хаахгүй — backend талдаа шалгана.
      setBaigaaMashinuud([]);
    }
  };

  /** Жагсаалтаас нэг машиныг засах горимд авна. */
  const mashinZasaya = (mashin: { _id: string; mashiniiDugaar: string }) => {
    setZasajBuiMashiniiId(mashin._id);
    setFormData((prev) => ({ ...prev, plate: mashin.mashiniiDugaar }));
  };

  /** Засах горимоос гарч шинэ машин нэмэх. */
  const shineMashinNemey = () => {
    setZasajBuiMashiniiId(null);
    setFormData((prev) => ({ ...prev, plate: "" }));
  };

  /** Нэг машины бүртгэлийг устгана. */
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
        await baigaaMashinuudAvya(formData.phone);
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
    if (editData && formData.phone) {
      baigaaMashinuudAvya(formData.phone);
    }
  }, []);

  // Fetch guest defaults from Barilga - Disabled as endpoint /barilga does not exist
  const buildingData: any = null;

  const guestDefaults = useMemo(() => {
    return buildingData?.zochinTokhirgoo || null;
  }, [buildingData]);

  const availableToots = useMemo(() => {
    const mapping = buildingData?.tokhirgoo?.davkhariinToonuud;
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
  }, [buildingData]);

  useEffect(() => {
    if (guestDefaults && step === 1) {
      setFormData((prev) => ({
        ...prev,
        rightsCount: guestDefaults.zochinErkhiinToo ?? prev.rightsCount,
        freeMinutes: guestDefaults.zochinTusBurUneguiMinut ?? prev.freeMinutes,
        type: guestDefaults.zochinTurul || prev.type,
        frequency: guestDefaults.davtamjiinTurul || prev.frequency,
      }));
    }
  }, [guestDefaults, step]);

  const handleSearch = async (phoneOverride?: any) => {
    const phoneToSearch =
      typeof phoneOverride === "string" ? phoneOverride : formData.phone;

    if (!phoneToSearch || phoneToSearch.length !== 8) {
      toast.error("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }

    setSearching(true);
    try {
      // 1. First search in OrshinSuugch collection
      let found: any = null;
      let isCustomer = false;

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

      // 2. If not found in OrshinSuugch, search in Khariltsagch collection
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
            isCustomer = true;
          }
        } catch (e) {
          console.warn("Khariltsagch search error:", e);
        }
      }

      if (found) {
        if (isCustomer) {
          // Found Customer
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
          // Found Resident
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
            name: specificToot?.ner || found.ner || found.orshinSuugchNer || prev.name,
            ovog: found.ovog || prev.ovog,
            register: found.register || prev.register,
            unit: specificToot?.toot || found.toot || prev.unit,
            rightsCount: found.zochinErkhiinToo ?? prev.rightsCount,
            freeMinutes: found.zochinTusBurUneguiMinut ?? prev.freeMinutes,
            type: found.zochinTurul || found.turul || prev.type,
            frequency: found.davtamjiinTurul || prev.frequency,
            orshinSuugchTurul: prev.orshinSuugchTurul || found.zochinTurul || found.turul || "Оршин суугч",
          }));
          toast.success("Оршин суугчийн мэдээлэл олдлоо");
        }

        await baigaaMashinuudAvya(phoneToSearch);
        setStep(2);
      } else {
        // Unregistered - auto proceed to allow entering details smoothly
        setFormData((prev) => ({ ...prev, phone: phoneToSearch }));
        toast("Бүртгэлгүй тул мэдээллийг шинээр оруулна уу.", {
          icon: "ℹ️",
        });
        setStep(2);
      }
    } catch (err) {
      setFormData((prev) => ({ ...prev, phone: phoneToSearch }));
      setStep(2);
    } finally {
      setSearching(false);
    }
  };

  const handleManualProceed = () => {
    if (!formData.phone || formData.phone.length !== 8) {
      toast.error("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }
    handleSearch(formData.phone);
  };

  const handleSave = async () => {
    // Validate individual fields and show separate errors
    let hasError = false;

    if (!formData.name?.trim()) {
      toast.error("Оршин суугчийн нэр заавал оруулна уу");
      hasError = true;
    }

    if (!formData.phone?.trim()) {
      toast.error("Утасны дугаар заавал оруулна уу");
      hasError = true;
    } else if (formData.phone.trim().length !== 8) {
      toast.error("Утасны дугаар 8 оронтой байх ёстой");
      hasError = true;
    }

    if (hasError) return;

    // Хязгаарыг backend ч шалгадаг; энд шалгах нь хэрэглэгчид шалтгааныг
    // хүсэлт явуулахаас өмнө хэлэх зорилготой.
    if (khyazgaarDuurenEsekh) {
      toast.error(
        `Нэг оршин суугч дээр хамгийн олон ${mashiniiKhyazgaar} машин бүртгэх боломжтой. Хязгаарыг Нэмэлт тохиргооноос өөрчилнө.`,
      );
      return;
    }

    setLoading(true);
    try {
      const plateToUse = formData.plate.trim().toUpperCase() || "БҮРТГЭЛГҮЙ";

      const payload = {
        baiguullagiinId: baiguullagiinId,
        barilgiinId: barilgiinId,
        mashiniiDugaar: plateToUse,
        ezemshigchiinUtas: formData.phone,
        turul: formData.orshinSuugchTurul || formData.type,
        khariltsagchMedeelel: {
          _id: editData?.ezemshigchiinId, // Actual OrshinSuugch ID
          ner: formData.name,
          ovog: formData.ovog || formData.name,
          register: formData.register || "00000000",
          utas: formData.phone,
          turul: "Иргэн",
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
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
          // Модал дотроос сонгож засаж байгаа машины id. `null` бол
          // шинэ машин — backend шинээр үүсгэнэ.
          _id: zasajBuiMashiniiId || undefined,
          dugaar: plateToUse,
          ezemshigchiinNer: formData.name,
          ezemshigchiinRegister: formData.register || "00000000",
          ezemshigchiinUtas: formData.phone,
          turul: formData.orshinSuugchTurul || formData.type,
          ezemshigchiinTalbainDugaar: formData.unit,
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
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
      <AnimatePresence>
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[color:var(--panel)] backdrop-blur-sm"
            onClick={onClose}
          />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full ${step === 1 ? "max-w-md" : "max-w-3xl"} bg-white dark:bg-[color:var(--panel)] rounded-[32px] shadow-2xl overflow-hidden border border-[color:var(--surface-border)] dark:border-white/10 ring-1 ring-black/5 transition-all duration-500 ease-in-out`}
        >
          {/* Header */}
          <div className="relative px-8 py-6 border-b border-[color:var(--surface-border)] dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl text-[color:var(--panel-text)] dark:text-white tracking-tight">
                  {step === 1
                    ? "Хайлт"
                    : editData
                      ? "Засах"
                      : "Машин бүртгэл"}
                </h2>
                <p className="text-xs  text-[color:var(--muted-text)] mt-1">
                  {step === 1
                    ? "Утасны дугаараар хайх"
                    : editData
                      ? "Оршин суугчийн мэдээлэл засах"
                      : "Шинээр оршин суугч болон тээврийн хэрэгсэл нэмэх"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10 text-[color:var(--muted-text)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {step === 1 ? (
            // STEP 1: Phone Search
            <div className="p-8">
              <div className="space-y-6">
                <div className="group relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)]">
                    <User className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.orshinSuugchTurul}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        orshinSuugchTurul: e.target.value,
                      })
                    }
                    className="w-full h-12 pl-10 pr-8 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm  text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all appearance-none cursor-pointer"
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
                    label="Утас"
                    value={formData.phone}
                    type="tel"
                    onChange={(v) => {
                      const val = v.replace(/\D/g, "");
                      if (val.length > 8) return;
                      setFormData({ ...formData, phone: val });
                      if (val.length === 8) {
                        handleSearch(val);
                      }
                    }}
                    placeholder="88888888"
                  />
                </div>

                <Button
                  onClick={handleManualProceed}
                  disabled={searching}
                  variant="primary"
                  size="md"
                  fullWidth
                  className="h-12 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
                  isLoading={searching}
                  data-modal-primary
                  rightIcon={
                    !searching ? <ArrowRight className="w-4 h-4" /> : undefined
                  }
                >
                  {formData.phone ? "Үргэлжлүүлэх" : "Хайх"}
                </Button>
              </div>
            </div>
          ) : (
            // STEP 2: Full Form
            <>
              <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Personal Info (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)] dark:border-white/5">
                      <span className="p-1.5 rounded-lg bg-[color:var(--surface-hover)] dark:bg-white/10 text-black dark:text-white">
                        <User className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs uppercase tracking-widest text-[color:var(--muted-text)]">
                        Хувийн мэдээлэл
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <InputField
                        icon={Phone}
                        label="Утас"
                        value={formData.phone}
                        type="tel"
                        onChange={(v) =>
                          setFormData({ ...formData, phone: v })
                        }
                        placeholder="88888888"
                      />

                      {!["СӨХ", "Ажилтан", "Үнэгүй", "Дотоод", "Харилцагч"].includes(formData.orshinSuugchTurul) && (
                        <div className="group relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors z-10">
                            <Home className="w-4 h-4" />
                          </div>
                          <input
                            list="toot-suggestions"
                            value={formData.unit}
                            onChange={(e) =>
                              setFormData({ ...formData, unit: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm  text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all"
                            placeholder="Тоот сонгох"
                          />
                          <datalist id="toot-suggestions">
                            {availableToots.map((t) => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                          <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] font-sans text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors">
                            Тоот
                          </label>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-5">
                        <InputField
                          icon={User}
                          label="Овог"
                          value={formData.ovog}
                          onChange={(v) =>
                            setFormData({ ...formData, ovog: v })
                          }
                          placeholder="Овог"
                        />
                        <InputField
                          icon={User}
                          label="Нэр"
                          value={formData.name}
                          onChange={(v) =>
                            setFormData({ ...formData, name: v })
                          }
                          placeholder="Нэр"
                        />
                      </div>

                      {!["СӨХ", "Ажилтан", "Үнэгүй", "Дотоод", "Харилцагч"].includes(formData.orshinSuugchTurul) && (
                        <div className="group relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)]">
                            <Home className="w-4 h-4" />
                          </div>
                          <select
                            value={formData.type}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                type: e.target.value as any,
                              })
                            }
                            className="w-full h-11 pl-10 pr-8 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm  text-[color:var(--panel-text)] dark:text-white focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all appearance-none cursor-pointer"
                          >
                            <option value="Оршин суугч">Оршин суугч</option>
                            <option value="Түр оршин суугч">Түр оршин суугч</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                          <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[10px]  text-[color:var(--muted-text)] uppercase tracking-wider">
                            Төрөл
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Asset & Config (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-[color:var(--surface-border)] dark:border-white/5">
                      <span className="p-1.5 rounded-lg bg-[color:var(--surface-hover)] dark:bg-white/10 text-black dark:text-white">
                        <Car className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs uppercase tracking-widest text-[color:var(--muted-text)]">
                        Тээврийн хэрэгсэл & Тохиргоо
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)]">
                          <User className="w-4 h-4" />
                        </div>
                        <select
                          value={formData.orshinSuugchTurul || "Оршин суугч"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              orshinSuugchTurul: val,
                              type: val === "Оршин суугч" ? "Оршин суугч" : (val as any),
                            }));
                          }}
                          className="w-full h-11 pl-10 pr-8 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all appearance-none cursor-pointer"
                        >
                          <option value="Оршин суугч">Оршин суугч</option>
                          <option value="Харилцагч">Харилцагч</option>
                          <option value="Ажилтан">Ажилтан</option>
                          <option value="Дотоод">Дотоод</option>
                          <option value="СӨХ">СӨХ</option>
                          <option value="Үнэгүй">Үнэгүй</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                        <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] font-sans text-[color:var(--muted-text)]">
                          Бүртгэх төрөл
                        </label>
                      </div>

                      {/* Эзэн дээр бүртгэлтэй машинууд — тус бүрд засах/устгах */}
                      {baigaaMashinuud.length > 0 && (
                        <div className="rounded-2xl border border-[color:var(--surface-border)] dark:border-white/10 bg-[color:var(--surface-hover)] dark:bg-white/[0.03] p-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-text)]">
                              Бүртгэлтэй машин
                            </span>
                            {mashiniiKhyazgaar > 0 && (
                              <span className="text-[11px] font-semibold text-[color:var(--muted-text)]">
                                {baigaaMashinuud.length}/{mashiniiKhyazgaar}
                              </span>
                            )}
                          </div>

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
                                      : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
                                  }`}
                                >
                                  <Car className="w-4 h-4 text-[color:var(--muted-text)] shrink-0" />
                                  <span className="flex-1 text-sm font-mono font-bold tracking-wider text-[color:var(--panel-text)]">
                                    {mashin.mashiniiDugaar}
                                  </span>

                                  {zasajBui && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                                      Засаж байна
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => mashinZasaya(mashin)}
                                    disabled={ustgaj}
                                    title="Дугаарыг засах"
                                    className="p-1.5 rounded-lg text-[color:var(--muted-text)] hover:text-brand hover:bg-theme/10 dark:hover:bg-theme/10 disabled:opacity-40 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => mashinUstgaya(mashin)}
                                    disabled={ustgaj}
                                    title="Машины бүртгэлийг устгах"
                                    className="p-1.5 rounded-lg text-[color:var(--muted-text)] hover:text-danger hover:bg-danger/10 disabled:opacity-40 transition-colors"
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

                          {/* Засах горимоос гарч шинэ машин нэмэх */}
                          {zasajBuiMashiniiId ? (
                            <button
                              type="button"
                              onClick={shineMashinNemey}
                              disabled={
                                mashiniiKhyazgaar > 0 &&
                                baigaaMashinuud.length >= mashiniiKhyazgaar
                              }
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Шинэ машин нэмэх
                              {mashiniiKhyazgaar > 0 &&
                                baigaaMashinuud.length >= mashiniiKhyazgaar &&
                                " (хязгаар дүүрсэн)"}
                            </button>
                          ) : (
                            khyazgaarDuurenEsekh && (
                              <p className="mt-3 text-[11px] leading-relaxed text-warning">
                                Хязгаар дүүрсэн байна. Шинэ машин нэмэхийн тулд
                                дээрхээс нэгийг устгах, эсвэл Тохиргоо → Нэмэлт
                                тохиргоо → «Машины бүртгэлийн хязгаар»-аас дээд
                                тоог өсгөнө.
                              </p>
                            )
                          )}
                        </div>
                      )}

                      {/* License Plate Special Input */}
                      <div className="relative p-5 rounded-2xl bg-[color:var(--panel)] bg-[radial-gradient(var(--surface-border)_1px,transparent_1px)] [background-size:16px_16px] flex flex-col justify-center items-center overflow-hidden group border border-[color:var(--surface-border)] dark:border-white/10 shadow-inner">
                        <label className="text-xs font-semibold text-[color:var(--muted-text)] mb-2 uppercase tracking-wider">
                          {zasajBuiMashiniiId
                            ? "Улсын дугаар засах (4 тоо + 3 кирилл үсэг)"
                            : baigaaMashinuud.length > 0
                              ? "ШИНЭ машины улсын дугаар"
                              : "Улсын дугаар (4 тоо + 3 Монгол кирилл үсэг)"}
                        </label>
                        <div className="relative w-64 h-[68px] bg-[color:var(--surface-bg)] rounded-xl border-2 border-[color:var(--surface-border)] flex items-center shadow-md transform group-hover:scale-102 transition-transform duration-300">
                          <input
                            type="text"
                            value={formData.plate === "БҮРТГЭЛГҮЙ" ? "" : formData.plate}
                            onChange={(e) => {
                              const input = e.target.value.toUpperCase().replace(/\s/g, "");
                              if (input.length > 7) return;

                              const digits = input.slice(0, 4);
                              const chars = input.slice(4);

                              const latinToCyrillic: Record<string, string> = {
                                A: "А", B: "В", C: "С", E: "Е", H: "Н", K: "К", M: "М",
                                O: "О", P: "Р", T: "Т", U: "У", X: "Х", Y: "Ү", D: "Д",
                                G: "Г", I: "И", J: "Ж", L: "Л", N: "Н", Q: "Ө", R: "Р",
                                S: "С", V: "В", W: "В", Z: "З",
                              };

                              let convertedChars = "";
                              for (const c of chars) {
                                convertedChars += latinToCyrillic[c] || c;
                              }

                              const fullPlate = digits + convertedChars;
                              if (/^\d*$/.test(digits) && /^[А-ЯӨҮЁ]*$/.test(convertedChars)) {
                                setFormData({ ...formData, plate: fullPlate });
                              }
                            }}
                            className="w-full h-full text-center text-3xl font-bold uppercase tracking-[0.15em] outline-none font-mono focus:ring-0 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)]"
                            placeholder="1234УБҮ"
                          />
                        </div>
                      </div>

                      <InputField
                        icon={FileText}
                        label="Тайлбар"
                        value={formData.description}
                        onChange={(v) =>
                          setFormData({ ...formData, description: v })
                        }
                        placeholder="Нэмэлт тайлбар..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[color:var(--surface-border)] dark:border-white/5 bg-[color:var(--surface-hover)] dark:bg-white/[0.02] flex items-center justify-end gap-3">
                <Button onClick={onClose} variant="secondary" size="sm" className="hover:bg-[color:var(--panel)] dark:hover:bg-white/10 transition-colors">
                  Хаах
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                  data-modal-primary
                  className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
                >
                  Хадгалах
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  </ModalPortal>
  );
}

const InputField = ({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  icon: any;
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div className="group relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors">
      <Icon className="w-4 h-4" />
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 pl-10 pr-4 bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-xl text-sm  text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all"
      placeholder={placeholder}
    />
    <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[color:var(--panel)] text-[11px] font-sans text-[color:var(--muted-text)] group-focus-within:text-brand transition-colors">
      {label}
    </label>
  </div>
);
