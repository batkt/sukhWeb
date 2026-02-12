"use client";

import React, { useState, useMemo, useEffect } from "react";
import { User, Phone, MapPin, Car, Briefcase, Calendar, Info, Search, X, ArrowRight, Home, ChevronDown, Clock, Hash, FileText, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import uilchilgee from "@/lib/uilchilgee";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";

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
  editData
}: ResidentRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState(editData ? 2 : 1); // 1: Search Phone, 2: Full Form

  const [formData, setFormData] = useState({
    plate: editData?.mashiniiDugaar || "",
    name: editData?.ner || editData?.orshinSuugchNer || "",
    ovog: editData?.ovog || "",
    phone: editData?.utas || "",
    register: editData?.register || "",
    unit: editData?.toot || editData?.burtgeliinDugaar || "",
    type: (editData?.zochinTurul || editData?.turul || "Оршин суугч") as "Оршин суугч" | "Түрээслэгч",
    frequency: editData?.davtamjiinTurul || "saraar",
    rightsCount: editData?.zochinErkhiinToo ?? 2,
    freeMinutes: editData?.zochinTusBurUneguiMinut ?? 0,
    description: editData?.zochinTailbar || editData?.tailbar || "",
    orshinSuugchTurul: editData?.orshinSuugchTurul || ""
  });

  // Fetch guest defaults from Barilga
  const { data: buildingData } = useSWR(
    barilgiinId ? `/barilga/${barilgiinId}` : null,
    async (url) => {
        const resp = await uilchilgee(token).get(url, {
            params: { baiguullagiinId }
        });
        return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const guestDefaults = useMemo(() => {
    return buildingData?.zochinTokhirgoo || null;
  }, [buildingData]);

  const availableToots = useMemo(() => {
    const mapping = buildingData?.tokhirgoo?.davkhariinToonuud;
    if (!mapping) return [];
    
    const allUnits = new Set<string>();
    Object.values(mapping).forEach((units: any) => {
        if (Array.isArray(units)) {
            units.forEach(u => u && allUnits.add(String(u).trim()));
        } else if (typeof units === 'string') {
            units.split(',').forEach(u => u && allUnits.add(u.trim()));
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
        setFormData(prev => ({
            ...prev,
            rightsCount: guestDefaults.zochinErkhiinToo ?? prev.rightsCount,
            freeMinutes: guestDefaults.zochinTusBurUneguiMinut ?? prev.freeMinutes,
            type: guestDefaults.zochinTurul || prev.type,
            frequency: guestDefaults.davtamjiinTurul || prev.frequency,
        }));
    }
  }, [guestDefaults, step]);

  const handleSearch = async (phoneOverride?: any) => {
    const phoneToSearch = typeof phoneOverride === 'string' ? phoneOverride : formData.phone;

    if (!phoneToSearch || phoneToSearch.length < 8) {
        toast.error("Утасны дугаар зөв оруулна уу");
        return;
    }

    setSearching(true);
    try {
        const resp = await uilchilgee(token).get("/orshinSuugch", {
            params: {
                baiguullagiinId,
                barilgiinId,
                search: phoneToSearch,
            }
        });

        const found = Array.isArray(resp.data?.jagsaalt) ? resp.data.jagsaalt[0] : null;

        if (found) {
            setFormData(prev => ({
                ...prev,
                phone: phoneToSearch,
                name: found.ner || found.orshinSuugchNer || prev.name,
                ovog: found.ovog || prev.ovog,
                unit: found.toot || found.burtgeliinDugaar || prev.unit,
                rightsCount: found.zochinErkhiinToo ?? prev.rightsCount,
                freeMinutes: found.zochinTusBurUneguiMinut ?? prev.freeMinutes,
                type: found.zochinTurul || found.turul || prev.type,
                frequency: found.davtamjiinTurul || prev.frequency,
            }));
            toast.success("Оршин суугчийн мэдээлэл олдлоо");
            setStep(2); 
        } else {
            setFormData(prev => ({ ...prev, phone: phoneToSearch }));
            toast.error("Оршин суугч олдсонгүй. Шинээр бүртгэнэ.");
            setStep(2);
        }
    } catch (err) {
        setFormData(prev => ({ ...prev, phone: phoneToSearch }));
        setStep(2);
    } finally {
        setSearching(false);
    }
  };

  const handleManualProceed = () => {
    if (!formData.phone || formData.phone.length < 4) {
        toast.error("Утасны дугаараа оруулна уу");
        return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Нэр, утас заавал оруулна уу");
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
        orshinSuugchTurul: formData.orshinSuugchTurul || undefined,
        khariltsagchMedeelel: {
          ner: formData.name,
          ovog: formData.ovog || formData.name,
          register: formData.register || "00000000",
          utas: [formData.phone],
          turul: "Иргэн",
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
          davtamjiinTurul: formData.frequency,
          ezenToot: formData.unit,
          idevkhiteiEsekh: true,
          mashiniiDugaar: plateToUse,
          zochinErkhiinToo: formData.rightsCount,
          zochinTailbar: formData.description,
          zochinTurul: formData.type,
          zochinTusBurUneguiMinut: formData.freeMinutes,
          zochinUrikhEsekh: true,
          orshinSuugchTurul: formData.orshinSuugchTurul || undefined
        },
        mashinMedeelel: {
          dugaar: plateToUse,
          ezemshigchiinNer: formData.name,
          ezemshigchiinRegister: formData.register || "00000000",
          ezemshigchiinUtas: formData.phone,
          turul: formData.orshinSuugchTurul || formData.type,
          ezemshigchiinTalbainDugaar: formData.unit,
          baiguullagiinId: baiguullagiinId,
          barilgiinId: barilgiinId,
          orshinSuugchTurul: formData.orshinSuugchTurul || undefined
        },
        ezemshigchiinId: editData?._id || undefined, // Important for updates
        tukhainBaaziinKholbolt: null
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
          className={`relative w-full ${step === 1 ? 'max-w-md' : 'max-w-3xl'} bg-white dark:bg-[#0f1117] rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-white/5 ring-1 ring-black/5 transition-all duration-500 ease-in-out`}
        >
            {/* Header */}
            <div className="relative px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                            {step === 1 ? 'Хайлт' : (editData ? 'Засах' : 'Оршин суугч бүртгэл')}
                        </h2>
                        <p className="text-xs  text-slate-500 dark:text-slate-400 mt-1">
                            {step === 1 ? 'Утасны дугаараар хайх' : (editData ? 'Оршин суугчийн мэдээлэл засах' : 'Шинээр оршин суугч болон тээврийн хэрэгсэл нэмэх')}
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
                         <div className="relative group">
                            <InputField 
                                icon={Phone} 
                                label="Утас" 
                                value={formData.phone} 
                                type="tel"
                                onChange={v => {
                                    const val = v.replace(/\D/g, '');
                                    if (val.length > 8) return;
                                    setFormData({...formData, phone: val});
                                    if (val.length === 8) {
                                        handleSearch(val);
                                    }
                                }} 
                                placeholder="88888888"
                            />
                         </div>

                         <button 
                            onClick={handleManualProceed}
                            disabled={searching}
                            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-600 text-white  uppercase tracking-widest hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                         >
                            {searching ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{formData.phone ? 'Үргэлжлүүлэх' : 'Хайх'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                         </button>
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
                                    <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <User className="w-4 h-4" />
                                    </span>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Хувийн мэдээлэл
                                    </h3>
                                </div>

                                <div className="space-y-5">
                                    <InputField 
                                        icon={Phone} 
                                        label="Утас" 
                                        value={formData.phone} 
                                        type="tel"
                                        onChange={v => setFormData({...formData, phone: v})} 
                                        placeholder="88888888"
                                    />
                                    <InputField 
                                        icon={User} 
                                        label="Овог" 
                                        value={formData.ovog} 
                                        onChange={v => setFormData({...formData, ovog: v})} 
                                        placeholder="Овог"
                                    />
                                    <InputField 
                                        icon={User} 
                                        label="Нэр" 
                                        value={formData.name} 
                                        onChange={v => setFormData({...formData, name: v})} 
                                        placeholder="Нэр"
                                    />
                                    {/* Register field removed as requested */}
                                    <div className="group relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Home className="w-4 h-4" />
                                        </div>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                            className="w-full h-11 pl-10 pr-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="Оршин суугч">Оршин суугч</option>
                                            <option value="Түрээслэгч">Түрээслэгч</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#0f1117] text-[10px]  text-slate-400 uppercase tracking-wider">
                                            Төрөл
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Asset & Config (7 cols) */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                                    <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                        <Car className="w-4 h-4" />
                                    </span>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Тээврийн хэрэгсэл & Тохиргоо
                                    </h3>
                                </div>

                                <div className="space-y-5">
                                    {/* License Plate Special Input */}
                                    <div className="relative p-6 rounded-2xl bg-slate-100 dark:bg-white/[0.03] flex justify-center items-center overflow-hidden group border border-slate-200 dark:border-white/5">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                                        <div className="relative w-64 h-14 bg-white dark:bg-slate-50 rounded-lg border-2 border-black flex items-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                                            <div className="h-full w-12 bg-blue-600 flex flex-col items-center justify-center border-r-2 border-black">
                                                <div className="text-[6px] text-white  leading-none mb-0.5">MNG</div>
                                                <div className="w-6 h-6 rounded-full bg-amber-400 border border-amber-600 flex items-center justify-center">
                                                    <span className="text-[4px] ">SOYOMBO</span>
                                                </div>
                                            </div>
                                            <input 
                                                type="text"
                                                value={formData.plate}
                                                onChange={e => {
                                                    const val = e.target.value.toUpperCase().slice(0, 7);
                                                    const digits = val.slice(0, 4);
                                                    const chars = val.slice(4);
                                                    // First 4 must be digits, remaining must be letters (Cyrillic or Latin)
                                                    if (/^\d*$/.test(digits) && /^[A-ZА-ЯӨҮЁ]*$/.test(chars)) {
                                                        setFormData({...formData, plate: val});
                                                    }
                                                }}
                                                className="w-full h-full bg-transparent text-center font-black text-3xl uppercase tracking-widest text-slate-900 placeholder:text-slate-200 outline-none font-mono"
                                                placeholder="0000УБА"
                                            />
                                        </div>
                                        <p className="absolute bottom-2 text-[9px]  text-slate-400 uppercase tracking-widest">Улсын дугаар</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="group relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                                                <Home className="w-4 h-4" />
                                            </div>
                                            <input 
                                                list="toot-suggestions"
                                                value={formData.unit}
                                                onChange={e => setFormData({...formData, unit: e.target.value})}
                                                className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                placeholder="Тоот сонгох"
                                            />
                                            <datalist id="toot-suggestions">
                                                {availableToots.map(t => (
                                                    <option key={t} value={t} />
                                                ))}
                                            </datalist>
                                            <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#0f1117] text-[10px]  text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">
                                                Тоот
                                            </label>
                                        </div>
                                        <div className="group relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <select
                                                value={formData.frequency}
                                                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                                                className="w-full h-11 pl-10 pr-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="saraar">Сараар</option>
                                                <option value="jileer">Жилээр</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#0f1117] text-[10px]  text-slate-400 uppercase tracking-wider">
                                                Давтамж
                                            </label>
                                        </div>
                                    </div>

                                    {/* Resident Type Dropdown */}
                                    <div className="group relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <select
                                            value={formData.orshinSuugchTurul}
                                            onChange={(e) => setFormData({...formData, orshinSuugchTurul: e.target.value})}
                                            className="w-full h-11 pl-10 pr-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Сонгох --</option>
                                            <option value="Үнэгүй">Үнэгүй</option>
                                            <option value="Дотоод">Дотоод</option>
                                            <option value="СӨХ">СӨХ</option>
                                            <option value="Жолооч">Жолооч</option>
                                            <option value="Ажилтан">Ажилтан</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#0f1117] text-[10px]  text-slate-400 uppercase tracking-wider">
                                            Оршин суугч төрөл
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <InputField 
                                            icon={Hash} 
                                            label="Эрхийн тоо" 
                                            type="number"
                                            value={formData.rightsCount} 
                                            onChange={v => setFormData({...formData, rightsCount: Number(v)})} 
                                            placeholder="2"
                                        />
                                        <InputField 
                                            icon={Clock} 
                                            label="Үнэгүй минут" 
                                            type="number"
                                            value={formData.freeMinutes} 
                                            onChange={v => setFormData({...formData, freeMinutes: Number(v)})} 
                                            placeholder="0"
                                        />
                                    </div>

                                    <InputField 
                                        icon={FileText} 
                                        label="Тайлбар" 
                                        value={formData.description} 
                                        onChange={v => setFormData({...formData, description: v})} 
                                        placeholder="Нэмэлт тайлбар..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-xs  uppercase tracking-wider text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                        >
                            Болих
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="
                                flex items-center gap-2 px-8 py-2.5 rounded-xl
                                bg-[#4285F4] text-white
                                text-xs font-black uppercase tracking-wider
                                shadow-lg shadow-blue-500/20
                                hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98]
                                disabled:opacity-70 disabled:cursor-not-allowed
                                transition-all duration-200
                            "
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>Хадгалах</span>
                        </button>
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
    placeholder 
  }: { 
    icon: any, 
    label: string, 
    value: string | number, 
    onChange: (val: string) => void, 
    type?: string,
    placeholder?: string
  }) => (
    <div className="group relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm  text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        placeholder={placeholder}
      />
      <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#0f1117] text-[10px]  text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">
        {label}
      </label>
    </div>
  );
