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
} from "lucide-react";
import { toast } from "react-hot-toast";
import uilchilgee from "@/lib/uilchilgee";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import Button from "@/components/ui/Button";
import useModalHotkeys from "@/lib/useModalHotkeys";

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

  const [formData, setFormData] = useState({
    plate: editData?.mashiniiDugaar || "",
    name: editData?.ner || editData?.orshinSuugchNer || "",
    ovog: editData?.ovog || "",
    phone: editData?.utas || "",
    register: editData?.register || "",
    unit: editData?.toot || editData?.burtgeliinDugaar || editData?.ezenToot || "",
    type: (editData?.zochinTurul || editData?.turul || "Оршин суугч") as
      | "Оршин суугч"
      | "Түр оршин суугч",
    frequency: editData?.davtamjiinTurul || "saraar",
    rightsCount: editData?.zochinErkhiinToo ?? 1,
    freeMinutes: editData?.zochinTusBurUneguiMinut ?? 8,
    description: editData?.zochinTailbar || editData?.tailbar || "",
    orshinSuugchTurul: editData?.orshinSuugchTurul || editData?.zochinTurul || editData?.turul || "Оршин суугч",
  });

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

    if (formData.orshinSuugchTurul && formData.orshinSuugchTurul !== "Оршин суугч") {
      setStep(2);
      return;
    }

    if (!phoneToSearch || phoneToSearch.length !== 8) {
      toast.error("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }

    setSearching(true);
    try {
      const resp = await uilchilgee(token).get("/orshinSuugch", {
        params: {
          baiguullagiinId,
          barilgiinId,
          search: phoneToSearch,
        },
      });

      const found = Array.isArray(resp.data?.jagsaalt)
        ? resp.data.jagsaalt[0]
        : null;

      if (found) {
        // Find specific unit for current building, excluding WALLET_API sources
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
          unit: specificToot?.toot || "", // Only use if it matches our building and isn't WALLET_API
          rightsCount: found.zochinErkhiinToo ?? prev.rightsCount,
          freeMinutes: found.zochinTusBurUneguiMinut ?? prev.freeMinutes,
          type: found.zochinTurul || found.turul || prev.type,
          frequency: found.davtamjiinTurul || prev.frequency,
        }));
        toast.success("Оршин суугчийн мэдээлэл олдлоо");
        setStep(2);
      } else {
        if (formData.orshinSuugchTurul === "Оршин суугч") {
          toast.error("Энэ дугаар дээр оршин суугч бүртгэгдээгүй байна. Та өөр төрөл сонгох эсвэл эхлээд оршин суугчийг бүртгэнэ үү.");
        } else {
          setFormData((prev) => ({ ...prev, phone: phoneToSearch }));
          toast.success("Шинээр бүртгэнэ.");
          setStep(2);
        }
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

    // If it's a resident, we MUST search and find them first.
    // We don't allow manual registration of NEW residents from the parking module.
    if (!formData.orshinSuugchTurul || formData.orshinSuugchTurul === "Оршин суугч") {
      handleSearch(formData.phone);
    } else {
      // For Staff, SÖH, etc., we allow manual proceed to Step 2
      setStep(2);
    }
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
          _id:
            editData?._id && String(editData?._id) !== String(editData?.ezemshigchiinId)
              ? editData._id
              : undefined, // Actual Mashin ID only if it exists
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
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full ${step === 1 ? "max-w-md" : "max-w-3xl"} bg-white dark:bg-[#11131a] rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 ring-1 ring-black/5 transition-all duration-500 ease-in-out`}
        >
          {/* Header */}
          <div className="relative px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl text-slate-800 dark:text-white tracking-tight">
                  {step === 1
                    ? "Хайлт"
                    : editData
                      ? "Засах"
                      : "Машин бүртгэл"}
                </h2>
                <p className="text-xs  text-slate-500 dark:text-slate-400 mt-1">
                  {step === 1
                    ? "Утасны дугаараар хайх"
                    : editData
                      ? "Оршин суугчийн мэдээлэл засах"
                      : "Шинээр оршин суугч болон тээврийн хэрэгсэл нэмэх"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
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
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
                    className="w-full h-12 pl-10 pr-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Оршин суугч">Оршин суугч</option>
                    <option value="Харилцагч">Харилцагч</option>
                    <option value="Ажилтан">Ажилтан</option>
                    <option value="СӨХ">СӨХ</option>
                    <option value="Үнэгүй">Үнэгүй</option>
                    <option value="Дотоод">Дотоод</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#11131a] text-[11px] font-sans text-slate-400 dark:text-slate-300">
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
                      if (val.length === 8 && (formData.orshinSuugchTurul === "Оршин суугч" || !formData.orshinSuugchTurul)) {
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
                  className="h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
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
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                      <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-black dark:text-white">
                        <User className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs uppercase tracking-widest text-slate-500">
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
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                            <Home className="w-4 h-4" />
                          </div>
                          <input
                            list="toot-suggestions"
                            value={formData.unit}
                            onChange={(e) =>
                              setFormData({ ...formData, unit: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="Тоот сонгох"
                          />
                          <datalist id="toot-suggestions">
                            {availableToots.map((t) => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                          <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#11131a] text-[11px] font-sans text-slate-400 dark:text-slate-300 group-focus-within:text-blue-500 transition-colors">
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
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
                            className="w-full h-11 pl-10 pr-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                          >
                            <option value="Оршин суугч">Оршин суугч</option>
                            <option value="Түр оршин суугч">Түр оршин суугч</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#11131a] text-[10px]  text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                            Төрөл
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Asset & Config (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                      <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-black dark:text-white">
                        <Car className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs uppercase tracking-widest text-slate-500">
                        Тээврийн хэрэгсэл & Тохиргоо
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="w-full h-11 pl-10 pr-8 flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-black dark:text-white">
                          {formData.orshinSuugchTurul || "Оршин суугч"}
                        </div>
                        <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#11131a] text-[11px] font-sans text-slate-400 dark:text-slate-300">
                          Төрөл
                        </label>
                      </div>

                      {/* License Plate Special Input */}
                      <div className="relative p-6 rounded-2xl bg-[#edf2f7] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-900/50 flex flex-col justify-center items-center overflow-hidden group border border-slate-200/60 dark:border-white/10 shadow-inner">

                        <div className="relative w-64 h-[72px] bg-white rounded-lg border-[2px] flex items-center  transform group-hover:scale-102 transition-transform duration-300">

                          <input
                            type="text"
                            value={formData.plate === "БҮРТГЭЛГҮЙ" ? "" : formData.plate}
                            onChange={(e) => {
                              const input = e.target.value.toUpperCase().replace(/\s/g, "");
                              if (input.length > 7) return;

                              const digits = input.slice(0, 4);
                              const chars = input.slice(4);

                              // Strict validation: first 4 must be digits, rest letters
                              if (/^\d*$/.test(digits) && /^[A-ZА-ЯӨҮЁ]*$/.test(chars)) {
                                setFormData({ ...formData, plate: input });
                              }
                            }}
                            className="w-full h-full  text-center text-3xl font-bold uppercase tracking-[0.15em]  outline-none font-mono focus:ring-0"
                            placeholder="0000УБА"
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

              <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
                <Button onClick={onClose} variant="secondary" size="sm" className="hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                  Хаах
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                  data-modal-primary
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  Хадгалах
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
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
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
      <Icon className="w-4 h-4" />
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      placeholder={placeholder}
    />
    <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#11131a] text-[11px] font-sans text-slate-400 dark:text-slate-300 group-focus-within:text-blue-500 transition-colors">
      {label}
    </label>
  </div>
);
