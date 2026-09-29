"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import TusgaiZagvar from "../../../../../components/selectZagvar/tusgaiZagvar";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import Button from "@/components/ui/Button";
import { Plus, Calendar, Car, ChevronDown, Home, Trash2, Warehouse, X } from "lucide-react";
import StandardDatePicker from "@/components/ui/StandardDatePicker";
import uilchilgee from "@/lib/uilchilgee";
import { toast } from "sonner";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
  getResidentToots,
  getResidentDavkhauraud,
  getResidentOrtsuud,
} from "@/lib/residentDataHelper";

interface ResidentModalProps {
  show: boolean;
  onClose: () => void;
  editingResident: any;
  newResident: any;
  setNewResident: (val: any) => void;
  ortsOptions: string[];
  davkharOptions: string[];
  getTootOptions: (orts: string, floor: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => string[];
  selectedBarilga: any;
  baiguullaga: any;
  currentResidents: any[];
  onSubmit: (e: React.FormEvent) => Promise<any>;
  token: string | null;
}

export default function ResidentModal({
  show,
  onClose,
  editingResident,
  newResident,
  setNewResident,
  ortsOptions,
  davkharOptions,
  getTootOptions,
  selectedBarilga,
  baiguullaga,
  currentResidents,
  onSubmit,
  token,
}: ResidentModalProps) {
  const residentRef = React.useRef<HTMLDivElement | null>(null);
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [errors, setErrors] = React.useState<string[]>([]);
  const [showConfirmClose, setShowConfirmClose] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const pendingCursorRef = React.useRef<{ index: number, field: string, validChars: number } | null>(null);

  React.useLayoutEffect(() => {
    if (pendingCursorRef.current) {
      const { index, field, validChars } = pendingCursorRef.current;
      const input = document.getElementById(`input-${field}-${index}`) as HTMLInputElement;
      if (input) {
        const newVal = input.value;
        let charsFound = 0;
        let newPos = newVal.length;
        if (validChars > 0) {
          for (let i = 0; i < newVal.length; i++) {
            if (newVal[i] !== ",") charsFound++;
            if (charsFound === validChars) {
              newPos = i + 1;
              break;
            }
          }
        } else {
          newPos = 0;
        }
        input.setSelectionRange(newPos, newPos);
      }
      pendingCursorRef.current = null;
    }
  });

  // Snapshot of newResident when modal opens — used to detect unsaved changes
  const initialSnapshot = React.useRef<string | null>(null);
  // Зургийг (snapshot) доорх синк эффект тоотуудыг өөрийн хэлбэрт (орон сууц →
  // гараж → агуулах, сэргээсэн төрөлтэй) оруулсны ДАРАА авна. Өмнө нь анхны
  // өгөгдлөөр авдаг байсан тул юу ч өөрчлөөгүй байхад "Өөрчлөлт хадгалагдахгүй" гардаг байв.
  const snapshotKhuleekhRef = React.useRef(false);
  React.useEffect(() => {
    if (show) {
      if (!initialSnapshot.current) snapshotKhuleekhRef.current = true;
      setErrors([]);
    } else {
      initialSnapshot.current = null;
      setShowConfirmClose(false);
      setUldegdelInput("");
      setZaaltInput("");
      setIsSubmitting(false);
    }
  }, [show, newResident?.units, editingResident]);

  const hasChanges = React.useMemo(() => {
    if (!initialSnapshot.current || !newResident) return false;
    
    // Compare normalized versions
    const normalize = (val: any) => {
        if (!val) return {};
        const obj = typeof val === "string" ? JSON.parse(val) : JSON.parse(JSON.stringify(val));
        
        // Remove volatile fields or normalize types
        const clean = (o: any) => {
            if (!o || typeof o !== "object") return o;
            const result: any = Array.isArray(o) ? [] : {};
            Object.keys(o).forEach(k => {
                let v = o[k];
                // Treat undefined, null, empty string as equivalent for ALL fields
                if (v === undefined || v === null || v === "") {
                    v = ""; 
                }
                // Special case for numbers: 0 is also an "empty" value for these specific fields
                if (v === 0 || v === "0") {
                    if (k === "ekhniiUldegdel" || k === "tsahilgaaniiZaalt" || k === "bodokhKhonog") {
                        v = ""; // Normalize to empty string for comparison
                    }
                }
                
                if (Array.isArray(v)) {
                   result[k] = v.map(clean);
                } else if (v && typeof v === "object") {
                   result[k] = clean(v);
                } else {
                   result[k] = v;
                }
            });
            return result;
        };
        return clean(obj);
    };
    
    const s1 = JSON.stringify(normalize(newResident));
    const s2 = JSON.stringify(normalize(initialSnapshot.current));
    
    return s1 !== s2;
  }, [newResident, show]);

  const requestClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const validate = () => {
    const newErrors: string[] = [];
    if (!newResident.ner?.trim()) newErrors.push("ner");
    if (
      !newResident.utas ||
      (Array.isArray(newResident.utas) && !newResident.utas[0]?.trim())
    )
      newErrors.push("utas");

    // Validate each unit
    const units = Array.isArray(newResident.units) ? newResident.units : [];
    if (units.length === 0) {
      if (!newResident.orts?.trim()) newErrors.push("orts");
      if (!newResident.davkhar?.trim()) newErrors.push("davkhar");
      if (!newResident.toot?.trim()) newErrors.push("toot");
    } else {
      const uniqueUnitKeys = new Set();
      units.forEach((unit: any, index: number) => {
        const isGarageOrStorage = unit.turul === "Гараж" || unit.turul === "Агуулах";
        
        if (!isGarageOrStorage) {
          if (!unit.orts?.trim()) newErrors.push(`units.${index}.orts`);
          if (!unit.davkhar?.trim()) newErrors.push(`units.${index}.davkhar`);
        }
        if (!unit.toot?.trim()) newErrors.push(`units.${index}.toot`);
        
        // Гараж B1-10 ба B2-10 нь өөр нэгж — давхрыг түлхүүрт оруулна.
        const ortsVal = isGarageOrStorage ? "1" : (unit.orts?.trim() || "");
        const davkharVal = unit.davkhar?.trim() || "";
        const key = `${unit.turul || "Орон сууц"}-${ortsVal}-${davkharVal}-${unit.toot?.trim()}`;
        if (uniqueUnitKeys.has(key)) {
          newErrors.push(`units.${index}.duplicate`);
        } else {
          uniqueUnitKeys.add(key);
        }
        // Гараж/агуулахын дугаар өөр хүнд идэвхтэй бүртгэлтэй эсэх (гараар бичсэн ч)
        if (
          isGarageOrStorage &&
          unit.toot?.trim() &&
          isTootOccupied(unit.toot.trim(), unit.davkhar || "", "1", unit.turul === "Гараж" ? "Зогсоол" : "Агуулах")
        ) {
          newErrors.push(`units.${index}.occupied`);
        }
      });
    }

    // Require end date for temporary contracts
    if (newResident.turul === "Түр" && !newResident.duusakhOgnoo?.trim()) {
      newErrors.push("duusakhOgnoo");
    }

    setErrors(newErrors);

    if (newErrors.length > 0) {
      const fieldNames: Record<string, string> = {
        ner: "Нэр",
        utas: "Утас",
        orts: "Орц",
        davkhar: "Давхар",
        toot: "Тоот",
        duusakhOgnoo: "Гэрээ дуусах огноо",
      };
      
      /** «Гараж B1 давхрын 40 дугаар» / «Орон сууц 1-р орц 3 давхрын 302 тоот» */
      const negjiinNer = (i: number) => {
        const u = units[i] || {};
        const toot = String(u.toot || "").trim();
        if (u.turul === "Гараж" || u.turul === "Агуулах") {
          return `${u.turul}${u.davkhar ? ` ${u.davkhar} давхрын` : ""}${toot ? ` ${toot} дугаар` : ""}`;
        }
        return `Орон сууц${u.orts ? ` ${u.orts}-р орц` : ""}${u.davkhar ? ` ${u.davkhar} давхрын` : ""}${toot ? ` ${toot} тоот` : ""}`;
      };

      // Эзэмшигчтэй дугаар — хэн эзэмшдэг, юу хийхийг хэлнэ.
      const ezemshigchtei = newErrors.find((e) => e.endsWith(".occupied"));
      if (ezemshigchtei) {
        const i = parseInt(ezemshigchtei.split(".")[1]);
        const u = units[i] || {};
        openErrorOverlay(
          `${negjiinNer(i)} ${ezemshigchiinDelgerengui(String(u.toot || "").trim(), u.davkhar || "", u.turul === "Гараж" ? "Зогсоол" : "Агуулах")}-д идэвхтэй бүртгэлтэй. Сул дугаар сонгох эсвэл эхлээд тухайн эзэмшигчээс салгана уу.`,
        );
        return false;
      }

      const davkhardsan = newErrors.filter((e) => e.endsWith(".duplicate"));
      if (davkhardsan.length > 0 && davkhardsan.length === newErrors.length) {
        openErrorOverlay(
          `${davkhardsan.map((e) => negjiinNer(parseInt(e.split(".")[1]))).join(", ")} хоёр удаа сонгогдсон байна. Давхардсан мөрийг хасна уу.`,
        );
        return false;
      }

      const unitFieldNames: Record<string, string> = { orts: "орц", davkhar: "давхар", toot: "тоот/дугаар" };
      const missingFields = newErrors
        .filter((e) => !e.endsWith(".duplicate"))
        .map((e) => {
          if (e.startsWith("units.")) {
            const parts = e.split(".");
            const i = parseInt(parts[1]);
            return `${negjiinNer(i)} — ${unitFieldNames[parts[2]] || parts[2]}`;
          }
          return fieldNames[e] || e;
        })
        .join(", ");

      openErrorOverlay(
        `Дараах талбаруудыг бөглөнө үү: ${missingFields}.` +
          (davkhardsan.length > 0
            ? ` Мөн ${davkhardsan.map((e) => negjiinNer(parseInt(e.split(".")[1]))).join(", ")} давхардсан байна.`
            : ""),
      );
      return false;
    }
    return true;
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validate()) {
      setIsSubmitting(true);
      try {
        // Duplicate check: same ovog + ner + phone already registered
        const ovog = (newResident.ovog || "").toString().trim().toLowerCase();
        const ner = (newResident.ner || "").toString().trim().toLowerCase();
        const phone = (
          Array.isArray(newResident.utas)
            ? newResident.utas[0]
            : newResident.utas || ""
        )
          .toString()
          .trim();

        if (ovog && ner && phone && Array.isArray(currentResidents)) {
          const duplicates = currentResidents.filter((r: any) => {
            const rOvog = (r.ovog || "").toString().trim().toLowerCase();
            const rNer = (r.ner || "").toString().trim().toLowerCase();
            const rPhone = (Array.isArray(r.utas) ? r.utas[0] : r.utas || "")
              .toString()
              .trim();

            const isSameResident =
              editingResident &&
              String(editingResident._id || "") === String(r._id || "");
            if (isSameResident) return false;

            const rToots = (getResidentToots(r) || "")
              .split(", ")
              .map((t) => t.trim());

            const units = Array.isArray(newResident.units) 
              ? newResident.units 
              : [{ toot: newResident.toot }];

            const hasConflict = units.some((u: any) => 
              rToots.includes(String(u.toot || "").trim())
            );

            return (
              rOvog === ovog && rNer === ner && rPhone === phone && hasConflict
            );
          });

          if (duplicates.length > 0) {
            const tootList = duplicates
              .map((r: any) => {
                const orts = getResidentOrtsuud(r) || "-";
                const davkhar = getResidentDavkhauraud(r) || "-";
                const toots = getResidentToots(r) || "-";
                return `${orts} орц, ${davkhar} давхар, ${toots} тоот`;
              })
              .join("; ");

            openErrorOverlay(
              `Энэ овог, нэр, утасны оршин суугч дараах тоот дээр бүртгэлтэй байна: ${tootList}. Давхардсан бүртгэл үүсгэх боломжгүй.`,
            );
            setIsSubmitting(false);
            return;
          }
        }

        const success = await onSubmit(e);
        if (!success) {
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error("Submit error:", error);
        setIsSubmitting(false);
      }
    }
  };

  // Get sohNer from selectedBarilga or baiguullaga (must be before early return)
  const sohNer = React.useMemo(() => {
    if (selectedBarilga?.tokhirgoo?.sohNer) {
      return String(selectedBarilga.tokhirgoo.sohNer);
    }
    if (baiguullaga?.tokhirgoo?.sohNer) {
      return String(baiguullaga.tokhirgoo.sohNer);
    }
    if (baiguullaga?.ner) {
      return String(baiguullaga.ner);
    }
    return "";
  }, [selectedBarilga, baiguullaga]);

  const handleSearch = async (phone: string) => {
    if (!phone || phone.length !== 8 || !selectedBarilga?._id) return;

    try {
      const resp = await uilchilgee(token || "").get("/orshinSuugch", {
        params: {
          baiguullagiinId: baiguullaga?._id,
          barilgiinId: selectedBarilga._id,
          search: phone,
        },
      });

      const found = Array.isArray(resp.data?.jagsaalt) ? resp.data.jagsaalt[0] : null;

      if (found) {
        // Filter units by current building and exclude WALLET_API
        const filteredToots = (found.toots || []).filter(
          (t: any) =>
            String(t.barilgiinId) === String(selectedBarilga._id) &&
            t.source !== "WALLET_API"
        );

        // Бүртгэлтэй хүний орон сууц, гараж, агуулахыг төрөлтэй нь авч модалын
        // мөрүүдийг шинэчилнэ — өмнө нь төрөлгүй, мөн мөрүүд шинэчлэгддэггүй
        // байсан тул гараж/агуулахыг дахин гараар оруулах шаардлагатай болдог байв.
        const olsonUnits = filteredToots.map((t: any) => ({
          orts: t.orts || "1",
          davkhar: t.davkhar || "",
          toot: t.toot || "",
          turul: t.turul || "Орон сууц",
          ekhniiUldegdel: t.ekhniiUldegdel || 0,
          tsahilgaaniiZaalt: t.tsahilgaaniiZaalt || 0,
          khonogoorBodokhEsekh: t.khonogoorBodokhEsekh || false,
          bodokhKhonog: t.bodokhKhonog || 0,
        }));
        setNewResident((p: any) => ({
          ...p,
          ovog: found.ovog || p.ovog,
          ner: found.ner || p.ner,
          register: found.register || p.register,
          mail: found.mail || found.email || p.mail,
          khayag: found.khayag || p.khayag,
        }));
        if (olsonUnits.length > 0) {
          setMainUnits(mainUnitsBeldekh(olsonUnits));
          setCollapsedMains([]);
          const garashToo = olsonUnits.filter((u: any) => u.turul === "Гараж").length;
          const aguulakhToo = olsonUnits.filter((u: any) => u.turul === "Агуулах").length;
          toast.success(
            `Бүртгэлтэй оршин суугч олдлоо: ${olsonUnits.length - garashToo - aguulakhToo} тоот` +
              (garashToo ? `, ${garashToo} гараж` : "") +
              (aguulakhToo ? `, ${aguulakhToo} агуулах` : "") +
              " автоматаар орлоо.",
          );
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  useModalHotkeys({
    isOpen: show,
    onClose: requestClose,
    onSubmit: (e?: any) => handleLocalSubmit(e || { preventDefault: () => {} } as any),
    container: residentRef.current,
  });

  // Local state for formatted inputs
  const [uldegdelInput, setUldegdelInput] = React.useState("");
  const [zaaltInput, setZaaltInput] = React.useState("");
  const [focusedInput, setFocusedInput] = React.useState<string | null>(null);

  const [mainUnits, setMainUnits] = React.useState<any[]>([]);
  const [collapsedMains, setCollapsedMains] = React.useState<number[]>([]);
  const toggleMainCollapse = (idx: number) => {
    setCollapsedMains((p) => p.includes(idx) ? p.filter((i) => i !== idx) : [...p, idx]);
  };

  const emptyGarage = () => ({ davkhar: "", toot: "", ekhniiUldegdel: 0, tsahilgaaniiZaalt: 0, khonogoorBodokhEsekh: false, bodokhKhonog: 0 });
  const emptyStorage = () => ({ davkhar: "", toot: "", ekhniiUldegdel: 0, tsahilgaaniiZaalt: 0, khonogoorBodokhEsekh: false, bodokhKhonog: 0 });

  const addMainUnitRow = () => {
    setMainUnits((prev) => [
      ...prev,
      {
        orts: "1",
        davkhar: "",
        toot: "",
        turul: "Орон сууц",
        ekhniiUldegdel: 0,
        tsahilgaaniiZaalt: 0,
        khonogoorBodokhEsekh: false,
        bodokhKhonog: 0,
        garages: [],
        storages: [],
      },
    ]);
  };

  const removeMainUnitRow = (index: number) => {
    setMainUnits((prev) => { const n = [...prev]; n.splice(index, 1); return n; });
  };

  const updateMainUnitRow = (index: number, field: string, value: any) => {
    setMainUnits((prev) => { const n = [...prev]; n[index] = { ...n[index], [field]: value }; return n; });
  };

  // Garage helpers
  const addGarageToUnit = (mainIndex: number) => {
    setMainUnits((prev) => {
      const n = [...prev];
      n[mainIndex] = { ...n[mainIndex], garages: [...(n[mainIndex].garages || []), emptyGarage()] };
      return n;
    });
  };
  const removeGarageFromUnit = (mainIndex: number, garageIndex: number) => {
    setMainUnits((prev) => {
      const n = [...prev]; const g = [...(n[mainIndex].garages || [])];
      g.splice(garageIndex, 1); n[mainIndex] = { ...n[mainIndex], garages: g }; return n;
    });
  };
  const updateGarageField = (mainIndex: number, garageIndex: number, field: string, value: any) => {
    setMainUnits((prev) => {
      const n = [...prev]; const g = [...(n[mainIndex].garages || [])];
      g[garageIndex] = { ...g[garageIndex], [field]: value }; n[mainIndex] = { ...n[mainIndex], garages: g }; return n;
    });
  };

  // Storage helpers
  const addStorageToUnit = (mainIndex: number) => {
    setMainUnits((prev) => {
      const n = [...prev];
      n[mainIndex] = { ...n[mainIndex], storages: [...(n[mainIndex].storages || []), emptyStorage()] };
      return n;
    });
  };
  const removeStorageFromUnit = (mainIndex: number, storageIndex: number) => {
    setMainUnits((prev) => {
      const n = [...prev]; const s = [...(n[mainIndex].storages || [])];
      s.splice(storageIndex, 1); n[mainIndex] = { ...n[mainIndex], storages: s }; return n;
    });
  };
  const updateStorageField = (mainIndex: number, storageIndex: number, field: string, value: any) => {
    setMainUnits((prev) => {
      const n = [...prev]; const s = [...(n[mainIndex].storages || [])];
      s[storageIndex] = { ...s[storageIndex], [field]: value }; n[mainIndex] = { ...n[mainIndex], storages: s }; return n;
    });
  };

  // Flat index calculators
  const getFlatIndex = (mainIndex: number, type: "main") => {
    let flatIdx = 0;
    for (let i = 0; i < mainIndex; i++) {
      flatIdx++;
      flatIdx += (mainUnits[i]?.garages || []).length;
      flatIdx += (mainUnits[i]?.storages || []).length;
    }
    return flatIdx; // type === "main"
  };
  const getGarageFlatIndex = (mainIndex: number, garageIndex: number) => {
    let flatIdx = getFlatIndex(mainIndex, "main");
    return flatIdx + 1 + garageIndex;
  };
  const getStorageFlatIndex = (mainIndex: number, storageIndex: number) => {
    let flatIdx = getFlatIndex(mainIndex, "main");
    return flatIdx + 1 + (mainUnits[mainIndex]?.garages || []).length + storageIndex;
  };

  const parseToNumber = (str: string) => {
    if (typeof str !== "string") return str || 0;
    return parseFloat(str.replace(/,/g, "")) || 0;
  };

  const formatWithCommas = (val: any) => {
    if (val === undefined || val === null || val === "") return "";
    const num = typeof val === "string" ? parseToNumber(val) : val;
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatWhileTyping = (val: string) => {
    // Remove commas for processing
    const clean = val.replace(/,/g, "");
    
    // Split into integer and fractional parts
    const parts = clean.split(".");
    let integerPart = parts[0].replace(/\D/g, "");
    const hasDot = clean.includes(".");
    let fractionalPart = parts.length > 1 ? parts[1].replace(/\D/g, "").slice(0, 2) : "";
    
    if (!integerPart && !hasDot) return "";
    
    // Add commas to integer part
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (hasDot) {
      integerPart = "0"; // Show 0 if user starts with a dot
    }
    
    return integerPart + (hasDot ? "." : "") + fractionalPart;
  };

  const isEkhniiUldegdelDisabled = React.useMemo(() => {
    if (!editingResident) return false;
    const existing =
      editingResident.ekhniiUldegdel ?? editingResident.medeelel?.ekhniiUldegdel;
    const parsedSnapshot = initialSnapshot.current ? JSON.parse(initialSnapshot.current) : null;
    const initial = parsedSnapshot?.ekhniiUldegdel;
    // Disable if original record has non-zero OR if it was non-zero when modal opened (e.g. fetched from history)
    return (
      (existing != null && Number(existing) !== 0) ||
      (initial != null && Number(initial) !== 0)
    );
  }, [editingResident, show, initialSnapshot.current]);

  /**
   * Тоотуудын жагсаалтаас модалын мөрүүдийг (орон сууц + түүний гараж/агуулах)
   * бэлдэнэ. Модал нээгдэхэд болон утсаар бүртгэлтэй хүн олдоход дуудна.
   */
  const mainUnitsBeldekh = (unitsRaw: any[], base?: any) => {
    // Өмнө нь гараж/агуулахын төрөл хадгалагддаггүй байсан тул хуучин
    // бүртгэлд тэд "Орон сууц" гэж ирдэг. Зоорийн (B1 г.м.) давхрын
    // дугаарыг барилгын гараж/агуулахын жагсаалтаас таньж зөв төрлийг сэргээнэ
    // — хадгалахад зөв төрөл баазад бичигдэнэ.
    const turulTaniya = (u: any) => {
      const t = String(u?.turul || "").trim();
      if (t === "Гараж" || t === "Агуулах") return u;
      const davkhar = String(u?.davkhar || "").trim();
      const toot = String(u?.toot || "").trim();
      if (!/^b\d*$/i.test(davkhar) || !toot) return u;
      const tootuud = (turul: "Тоот" | "Зогсоол" | "Агуулах") =>
        getTootOptions(String(u.orts || "1"), davkhar, turul).map((x) => String(x).trim());
      if (tootuud("Тоот").includes(toot)) return u;
      const garash = tootuud("Зогсоол").includes(toot) || getTootOptions("1", davkhar, "Зогсоол").map(String).includes(toot);
      const aguulakh = tootuud("Агуулах").includes(toot) || getTootOptions("1", davkhar, "Агуулах").map(String).includes(toot);
      if (aguulakh && !garash) return { ...u, turul: "Агуулах" };
      if (garash) return { ...u, turul: "Гараж" };
      // Жагсаалтад олдоогүй ч зоорийн давхарт орон сууц байхгүй тул гараж гэж үзнэ.
      return { ...u, turul: "Гараж" };
    };
    const units = (Array.isArray(unitsRaw) ? unitsRaw : []).map(turulTaniya);
    const foundMains = units.filter((u: any) => u.turul !== "Гараж" && u.turul !== "Агуулах");
    const allGarages = units.filter((u: any) => u.turul === "Гараж");
    const allStorages = units.filter((u: any) => u.turul === "Агуулах");

    const initialMains = (foundMains.length > 0 ? foundMains : [{
      orts: base?.orts || "1",
      davkhar: base?.davkhar || "",
      toot: base?.toot || "",
      turul: "Орон сууц",
      ekhniiUldegdel: base?.ekhniiUldegdel || 0,
      tsahilgaaniiZaalt: base?.tsahilgaaniiZaalt || 0,
      khonogoorBodokhEsekh: base?.khonogoorBodokhEsekh || false,
      bodokhKhonog: base?.bodokhKhonog || 0,
    }]).map((m: any, idx: number) => ({
      ...m,
      garages: idx === 0 ? allGarages.map((g: any) => ({ ...g })) : [],
      storages: idx === 0 ? allStorages.map((s: any) => ({ ...s })) : [],
    }));

    return initialMains;
  };

  // Sync local state when modal opens
  React.useEffect(() => {
    if (show) {
      setCollapsedMains([]);
      const initialMains = mainUnitsBeldekh(newResident.units, newResident);
      setMainUnits(initialMains);
      const primaryMain = initialMains[0];
      setUldegdelInput(formatWithCommas(primaryMain.ekhniiUldegdel) || "0");
      setZaaltInput(formatWithCommas(primaryMain.tsahilgaaniiZaalt) || "0");
    }
  }, [show]);

  // Sync to parent component's newResident state
  React.useEffect(() => {
    if (!show || mainUnits.length === 0) return;
    const activeUnits: any[] = [];
    mainUnits.forEach((mu) => {
      activeUnits.push({
        orts: mu.orts || "1", davkhar: mu.davkhar || "", toot: mu.toot || "",
        turul: mu.turul || "Орон сууц",
        ekhniiUldegdel: Number(mu.ekhniiUldegdel || 0),
        tsahilgaaniiZaalt: Number(mu.tsahilgaaniiZaalt || 0),
        khonogoorBodokhEsekh: !!mu.khonogoorBodokhEsekh,
        bodokhKhonog: Number(mu.bodokhKhonog || 0),
      });
      (mu.garages || []).forEach((g: any) => {
        activeUnits.push({ orts: "1", davkhar: g.davkhar || "", toot: g.toot || "", turul: "Гараж",
          ekhniiUldegdel: Number(g.ekhniiUldegdel || 0), tsahilgaaniiZaalt: Number(g.tsahilgaaniiZaalt || 0),
          khonogoorBodokhEsekh: !!g.khonogoorBodokhEsekh, bodokhKhonog: Number(g.bodokhKhonog || 0) });
      });
      (mu.storages || []).forEach((s: any) => {
        activeUnits.push({ orts: "1", davkhar: s.davkhar || "", toot: s.toot || "", turul: "Агуулах",
          ekhniiUldegdel: Number(s.ekhniiUldegdel || 0), tsahilgaaniiZaalt: Number(s.tsahilgaaniiZaalt || 0),
          khonogoorBodokhEsekh: !!s.khonogoorBodokhEsekh, bodokhKhonog: Number(s.bodokhKhonog || 0) });
      });
    });

    setNewResident((p: any) => {
      const stringifiedActive = JSON.stringify(activeUnits);
      const stringifiedExisting = JSON.stringify(p.units);
      if (stringifiedActive === stringifiedExisting) {
        if (snapshotKhuleekhRef.current) {
          initialSnapshot.current = JSON.stringify(p);
          snapshotKhuleekhRef.current = false;
        }
        return p;
      }

      const primaryMain = mainUnits[0];

      const next = {
        ...p,
        units: activeUnits,
        orts: primaryMain.orts || "",
        davkhar: primaryMain.davkhar || "",
        toot: primaryMain.toot || "",
        ekhniiUldegdel: primaryMain.ekhniiUldegdel || 0,
        tsahilgaaniiZaalt: primaryMain.tsahilgaaniiZaalt || 0,
        khonogoorBodokhEsekh: primaryMain.khonogoorBodokhEsekh || false,
        bodokhKhonog: primaryMain.bodokhKhonog || 0,
      };
      if (snapshotKhuleekhRef.current) {
        initialSnapshot.current = JSON.stringify(next);
        snapshotKhuleekhRef.current = false;
      }
      return next;
    });
  }, [mainUnits, show]);



  const additionalFloors = React.useMemo(() => {
    const filtered = davkharOptions.filter((d) => /^B\d+$/i.test(d));
    return filtered.length > 0 ? filtered : ["B1", "B2", "B3"];
  }, [davkharOptions]);

  const isTootOccupied = React.useCallback(
    (tootVal: string, floorVal: string, ortsVal: string, propertyType: "Тоот" | "Зогсоол" | "Агуулах") => {
      if (!Array.isArray(currentResidents)) return false;
      const uOrts = String(ortsVal || "1").trim().toLowerCase();
      const uDavkhar = String(floorVal || "").trim().toLowerCase();
      const uToot = String(tootVal || "").trim().toLowerCase();
      if (!uToot) return false;

      return currentResidents.some((r: any) => {
        if (editingResident && String(editingResident._id || "") === String(r._id || "")) {
          return false;
        }

        const existingUnits =
          Array.isArray(r.toots) && r.toots.length > 0
            ? r.toots
            : [{ orts: r.orts, davkhar: r.davkhar, toot: r.toot, turul: r.turul }];

        return existingUnits.some((rt: any) => {
          const rtOrts = String(rt.orts || "1").trim().toLowerCase();
          const rtDavkhar = String(rt.davkhar || "").trim().toLowerCase();
          const rtToot = String(rt.toot || "").trim().toLowerCase();
          const rtTurul = String(rt.turul || "Орон сууц").trim().toLowerCase();

          let rtPropertyType = "Тоот";
          if (rtTurul === "гараж" || rtTurul === "зогсоол" || rtTurul === "parking" || rtTurul === "garage") {
            rtPropertyType = "Зогсоол";
          } else if (rtTurul === "агуулах" || rtTurul === "storage") {
            rtPropertyType = "Агуулах";
          }

          return (
            rtOrts === uOrts &&
            rtDavkhar === uDavkhar &&
            rtToot === uToot &&
            rtPropertyType === propertyType
          );
        });
      });
    },
    [currentResidents, editingResident]
  );

  /** Гараж/агуулахын дугаарыг эзэмшиж буй хүн — «Б. Бат (302 тоот, 99112233)» */
  const ezemshigchiinDelgerengui = React.useCallback(
    (tootVal: string, floorVal: string, propertyType: "Зогсоол" | "Агуулах"): string => {
      const uDavkhar = String(floorVal || "").trim().toLowerCase();
      const uToot = String(tootVal || "").trim().toLowerCase();
      const turuluud = propertyType === "Зогсоол" ? ["гараж", "зогсоол", "parking", "garage"] : ["агуулах", "storage"];
      const r = (Array.isArray(currentResidents) ? currentResidents : []).find((x: any) => {
        if (editingResident && String(editingResident._id || "") === String(x._id || "")) return false;
        const units = Array.isArray(x.toots) && x.toots.length ? x.toots : [x];
        return units.some(
          (u: any) =>
            String(u.davkhar || "").trim().toLowerCase() === uDavkhar &&
            String(u.toot || "").trim().toLowerCase() === uToot &&
            turuluud.includes(String(u.turul || "").trim().toLowerCase()),
        );
      });
      if (!r) return "өөр эзэмшигч";
      const ner = [r.ovog ? `${String(r.ovog).charAt(0)}.` : "", r.ner || ""].filter(Boolean).join(" ") || "Нэргүй";
      const units = Array.isArray(r.toots) && r.toots.length ? r.toots : [r];
      const bair = units.find((u: any) => {
        const t = String(u?.turul || "").trim();
        return !t || t === "Орон сууц" || t === "Тоот";
      });
      const utas = Array.isArray(r.utas) ? r.utas[0] : r.utas;
      const nemelt = [bair?.toot ? `${bair.toot} тоот` : "", utas || ""].filter(Boolean).join(", ");
      return nemelt ? `«${ner}» (${nemelt})` : `«${ner}»`;
    },
    [currentResidents, editingResident],
  );

  if (!show) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* INPUTS AND TEXTAREAS - IDENTICAL STYLING */
        .modern-input,
        .modern-textarea {
          height: 32px !important;
          padding: 0 10px !important;
          font-size: 0.75rem !important;
          border-radius: 6px !important;
          border: 1px solid #d1d5db !important;
          transition: all 0.2s ease !important;
          background: #ffffff !important;
          color: #111827 !important;
        }
        .modern-input.pr-extra {
          padding-right: 32px !important;
        }
        .modern-textarea {
          line-height: 32px !important;
          overflow: hidden !important;
        }
        
        /* INPUTS AND TEXTAREAS - DARK MODE IDENTICAL */
        html[data-mode="dark"] .modern-input,
        html[data-mode="dark"] .modern-textarea,
        [data-mode="dark"] .modern-input,
        [data-mode="dark"] .modern-textarea {
          border-color: var(--surface-border) !important;
          background: var(--surface-bg) !important;
          color: var(--panel-text) !important;
        }
        
        /* INPUTS AND TEXTAREAS - HOVER */
        .modern-input:hover,
        .modern-textarea:hover {
          border-color: #9ca3af !important;
        }
        html[data-mode="dark"] .modern-input:hover,
        html[data-mode="dark"] .modern-textarea:hover,
        [data-mode="dark"] .modern-input:hover,
        [data-mode="dark"] .modern-textarea:hover {
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        
        /* INPUTS AND TEXTAREAS - FOCUS */
        .modern-input:focus,
        .modern-textarea:focus {
          outline: none !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        html[data-mode="dark"] .modern-input:focus,
        html[data-mode="dark"] .modern-textarea:focus,
        [data-mode="dark"] .modern-input:focus,
        [data-mode="dark"] .modern-textarea:focus {
          border-color: #60a5fa !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2) !important;
        }

        /* ERROR STATE */
        .input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }
        html[data-mode="dark"] .input-error,
        [data-mode="dark"] .input-error {
          border-color: #f87171 !important;
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        
        /* INPUTS AND TEXTAREAS - DISABLED */
        .modern-input:disabled,
        .modern-textarea:disabled {
          background: #f9fafb !important;
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }
        html[data-mode="dark"] .modern-input:disabled,
        html[data-mode="dark"] .modern-textarea:disabled,
        [data-mode="dark"] .modern-input:disabled,
        [data-mode="dark"] .modern-textarea:disabled {
          background: rgba(255, 255, 255, 0.05) !important;
          opacity: 0.6 !important;
        }
        
        /* INPUTS AND TEXTAREAS - PLACEHOLDER */
        .modern-input::placeholder,
        .modern-textarea::placeholder {
          color: #9ca3af !important;
        }
        html[data-mode="dark"] .modern-input::placeholder,
        html[data-mode="dark"] .modern-textarea::placeholder,
        [data-mode="dark"] .modern-input::placeholder,
        [data-mode="dark"] .modern-textarea::placeholder {
          color: rgba(229, 231, 235, 0.7) !important;
        }
        
        /* DROPDOWNS - SEPARATE THEME-BASED STYLING */
        .tusgai-wrapper {
          height: 32px !important;
          padding: 0 !important;
          font-size: 0.75rem !important;
          border-radius: 6px !important;
          border: 1px solid #d1d5db !important;
          transition: all 0.2s ease !important;
          background: #ffffff !important;
        }
        
        /* DROPDOWNS - DARK MODE IDENTICAL */
        html[data-mode="dark"] .tusgai-wrapper,
        [data-mode="dark"] .tusgai-wrapper {
          border-color: var(--surface-border) !important;
          background: var(--surface-bg) !important;
        }
        
        /* DROPDOWNS - HOVER */
        .tusgai-wrapper:hover {
          border-color: #9ca3af !important;
        }
        html[data-mode="dark"] .tusgai-wrapper:hover,
        [data-mode="dark"] .tusgai-wrapper:hover {
          border-color: rgba(255, 255, 255, 0.25) !important;
        }

        /* DROPDOWNS - FOCUS */
        .tusgai-wrapper:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        html[data-mode="dark"] .tusgai-wrapper:focus-within,
        [data-mode="dark"] .tusgai-wrapper:focus-within {
          border-color: #60a5fa !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2) !important;
        }

        /* DROPDOWNS - DISABLED */
        .tusgai-wrapper.disabled,
        .tusgai-wrapper:has(button:disabled) {
          background: #f9fafb !important;
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }
        html[data-mode="dark"] .tusgai-wrapper.disabled,
        html[data-mode="dark"] .tusgai-wrapper:has(button:disabled),
        [data-mode="dark"] .tusgai-wrapper.disabled,
        [data-mode="dark"] .tusgai-wrapper:has(button:disabled) {
          background: rgba(255, 255, 255, 0.05) !important;
          opacity: 0.6 !important;
        }
        
        .tusgai-wrapper button {
          height: 100% !important;
          padding: 0 10px !important;
          font-size: 0.75rem !important;
          border: none !important;
          background: transparent !important;
          min-height: unset !important;
          border-radius: 6px !important;
          width: 100% !important;
        }
        .tusgai-wrapper button:focus {
          outline: none !important;
        }
        .tusgai-wrapper button span {
          font-size: 0.75rem !important;
          line-height: 1.5 !important;
        }
        .tusgai-wrapper svg {
          width: 14px !important;
          height: 14px !important;
        }
        
        /* DROPDOWN MENU - REMOVE GLOW/SHADOW EFFECTS */
        div[role="listbox"] > div {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        /* DROPDOWN MENU DARK MODE */
        html[data-mode="dark"] div[role="listbox"] > div,
        [data-mode="dark"] div[role="listbox"] > div {
          background: var(--surface-bg) !important;
          color: var(--panel-text) !important;
          border-color: var(--surface-border) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
        }
        html[data-mode="dark"] div[role="listbox"] > div.rounded-2xl,
        [data-mode="dark"] div[role="listbox"] > div.rounded-2xl {
          background: var(--surface-bg) !important;
          border-color: var(--surface-border) !important;
        }
        html[data-mode="dark"] div[role="listbox"] > div button,
        [data-mode="dark"] div[role="listbox"] > div button {
          color: var(--panel-text) !important;
        }
      
        html[data-mode="dark"] div[role="listbox"] > div button[aria-selected="true"],
        [data-mode="dark"] div[role="listbox"] > div button[aria-selected="true"] {
          background: rgba(255, 255, 255, 0.15) !important;
          color: var(--panel-text) !important;
          font-weight: 600 !important;
        }
        html[data-mode="dark"] div[role="listbox"] > div button:disabled,
        [data-mode="dark"] div[role="listbox"] > div button:disabled {
          color: rgba(229, 231, 235, 0.5) !important;
          opacity: 0.5 !important;
        }
      `,
        }}
      />
      <AnimatePresence>
        <ModalPortal>
          <motion.div
            ref={constraintsRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[12000]"
          >
            <div className="absolute inset-0 bg-transparent" />
            <motion.div
              ref={residentRef}
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              drag
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={constraintsRef}
              dragMomentum={false}
              onClick={(e) => e.stopPropagation()}
              className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl modal-surface modal-responsive rounded-xl shadow-2xl p-0 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-transparent via-white/5 to-transparent cursor-move select-none"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[color:var(--muted-text)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <h2 className="text-lg text-[color:var(--panel-text)] dark:text-white">
                    {editingResident
                      ? "Оршин суугчийн мэдээлэл засах"
                      : "Оршин суугч нэмэх"}
                  </h2>
                </div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={requestClose}
                  className="p-1.5 rounded-lg transition-all duration-200  active:scale-95"
                  aria-label="Хаах"
                  title="Хаах"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[color:var(--muted-text)]"
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
                onSubmit={handleLocalSubmit}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Төрөл */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs text-[color:var(--muted-text)] transition-colors">
                          Төрөл
                        </label>
                        {newResident.turul === "Түр" && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-warning/10 text-warning border border-warning/30 animate-pulse">
                            Түр гэрээ
                          </span>
                        )}
                      </div>
                      <div className="tusgai-wrapper w-full flex items-center">
                        <TusgaiZagvar
                          value={newResident.turul || "Үндсэн"}
                          onChange={(val: string) => {
                            setNewResident((p: any) => ({
                              ...p,
                              turul: val,
                              // Clear end date when switching back to permanent
                              duusakhOgnoo: val === "Үндсэн" ? "" : p.duusakhOgnoo,
                            }));
                          }}
                          options={[
                            { value: "Үндсэн", label: "Үндсэн" },
                            { value: "Түр", label: "Түр" },
                          ]}
                          className="w-full h-full"
                          placeholder="Төрөл сонгох..."
                        />
                      </div>
                    </div>

                    {/* Гэрээ дуусах огноо - only shown for Түр гэрээ */}
                    {(newResident.turul === "Түр") && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative"
                      >
                        <label className="block text-xs text-[color:var(--muted-text)] mb-1 transition-colors flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand" />
                          Гэрээ дуусах огноо <span className="text-danger">*</span>
                        </label>
                        <div className="h-8">
                          <StandardDatePicker
                            value={newResident.duusakhOgnoo}
                            onChange={(_date, dateString) => 
                              setNewResident((p: any) => ({ ...p, duusakhOgnoo: dateString }))
                            }
                            placeholder="Дуусах огноо..."
                            className={errors.includes("duusakhOgnoo") ? "border-danger" : ""}
                            getPopupContainer={() => residentRef.current || document.body}
                            popupStyle={{ zIndex: 13010 }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Овог */}
                    <div>
                      <label className="block text-xs text-[color:var(--muted-text)] mb-1 transition-colors">
                        Овог
                      </label>
                      <input
                        type="text"
                        value={newResident.ovog || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            "",
                          );
                          setNewResident((p: any) => ({ ...p, ovog: value }));
                        }}
                        className="modern-input w-full"
                      />
                    </div>

                    {/* Нэр */}
                    <div>
                      <label className="block text-xs text-[color:var(--muted-text)] mb-1 transition-colors">
                        Нэр
                      </label>
                      <input
                        type="text"
                        value={newResident.ner || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            "",
                          );
                          setNewResident((p: any) => ({ ...p, ner: value }));
                        }}
                        className={`modern-input w-full ${errors.includes("ner") ? "input-error" : ""}`}
                      />
                    </div>

                    {/* Утас */}
                    <div>
                      <label className="block text-xs text-[color:var(--muted-text)] mb-1 transition-colors">
                        Утас
                      </label>
                      <input
                        type="tel"
                        value={
                          Array.isArray(newResident.utas)
                            ? newResident.utas[0] || ""
                            : newResident.utas || ""
                        }
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 8);
                          setNewResident((p: any) => ({ ...p, utas: [value] }));
                          if (value.length === 8 && !editingResident) {
                            handleSearch(value);
                          }
                        }}
                        className={`modern-input w-full ${errors.includes("utas") ? "input-error" : ""}`}
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>

                    {/* Units Section */}
                    <div className="md:col-span-2 space-y-4 pt-2">
                      <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] pb-2">
                        <h3 className="text-sm font-medium text-[color:var(--panel-text)]">Бүртгэлтэй тоотнууд</h3>
                        <Button
                          type="button"
                          onClick={addMainUnitRow}
                          variant="secondary"
                          size="sm"
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Тоот нэмэх
                        </Button>
                      </div>

                      {/* Main Units (Тоот) */}
                      {mainUnits.map((mainUnit, index) => {
                        return (
                          <div key={index} className="rm-unit">
                            {/* Толгой — дарахад нуугдана/нээгдэнэ */}
                            <div className="rm-unit-head">
                              <button
                                type="button"
                                onClick={() => toggleMainCollapse(index)}
                                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                                aria-expanded={!collapsedMains.includes(index)}
                              >
                                <span className="rm-unit-icon">
                                  <Home className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-[13px] font-semibold text-[color:var(--panel-text)]">
                                    {mainUnits.length > 1 ? `Орон сууц #${index + 1}` : "Орон сууц"}
                                  </span>
                                  <span className="block truncate text-[11px] text-[color:var(--muted-text)]">
                                    {mainUnit.toot
                                      ? [
                                          mainUnit.orts && `${mainUnit.orts} орц`,
                                          mainUnit.davkhar && `${mainUnit.davkhar} давхар`,
                                          `${mainUnit.toot} тоот`,
                                        ]
                                          .filter(Boolean)
                                          .join(" · ")
                                      : "Орц, давхар, тоотоо сонгоно уу"}
                                    {((mainUnit.garages || []).length > 0 || (mainUnit.storages || []).length > 0) &&
                                      ` · ${[
                                        (mainUnit.garages || []).length && `${(mainUnit.garages || []).length} гараж`,
                                        (mainUnit.storages || []).length && `${(mainUnit.storages || []).length} агуулах`,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")}`}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleMainCollapse(index)}
                                className="rm-icon-btn"
                                aria-label={collapsedMains.includes(index) ? "Нээх" : "Нуух"}
                                title={collapsedMains.includes(index) ? "Нээх" : "Нуух"}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${collapsedMains.includes(index) ? "-rotate-90" : ""}`}
                                />
                              </button>
                              {mainUnits.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMainUnitRow(index)}
                                  className="rm-icon-btn rm-icon-btn-danger"
                                  aria-label="Тоот хасах"
                                  title="Тоот хасах"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            {/* Toot Fields - collapsible */}
                            {!collapsedMains.includes(index) && (<div className="px-4 pt-3 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-[color:var(--muted-text)] mb-1">Орц</label>
                                <div className={`tusgai-wrapper w-full flex items-center ${errors.includes(`units.${getFlatIndex(index, "main")}.orts`) ? "input-error" : ""}`}>
                                  <TusgaiZagvar
                                    value={mainUnit.orts || ""}
                                    onChange={(val: string) => updateMainUnitRow(index, "orts", val)}
                                    options={ortsOptions.map((o) => ({ value: o, label: o }))}
                                    className="w-full h-full"
                                    placeholder="Орц..."
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-[color:var(--muted-text)] mb-1">Давхар</label>
                                <div className={`tusgai-wrapper w-full flex items-center ${errors.includes(`units.${getFlatIndex(index, "main")}.davkhar`) ? "input-error" : ""}`}>
                                  <TusgaiZagvar
                                    value={mainUnit.davkhar || ""}
                                    onChange={(val: string) => updateMainUnitRow(index, "davkhar", val)}
                                    options={davkharOptions.map((d) => ({ value: d, label: d }))}
                                    className="w-full h-full"
                                    placeholder="Давхар..."
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-[color:var(--muted-text)] mb-1">Тоот</label>
                                {(() => {
                                  const opts = getTootOptions(mainUnit.orts || "", mainUnit.davkhar || "", "Тоот");
                                  return (
                                    <div className={`tusgai-wrapper w-full flex items-center ${errors.includes(`units.${getFlatIndex(index, "main")}.toot`) ? "input-error" : ""}`}>
                                      <TusgaiZagvar
                                        value={mainUnit.toot || ""}
                                        onChange={(val: string) => updateMainUnitRow(index, "toot", val)}
                                        options={opts.map((t) => ({
                                          value: t,
                                          label: t,
                                          isOccupied: isTootOccupied(t, mainUnit.davkhar || "", mainUnit.orts || "1", "Тоот")
                                        }))}
                                        className="w-full h-full"
                                        placeholder="Тоот..."
                                        disabled={!mainUnit.orts || !mainUnit.davkhar}
                                      />
                                    </div>
                                  );
                                })()}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-[color:var(--muted-text)] mb-1">Эхний үлдэгдэл</label>
                                <div className="relative group">
                                  <input
                                    id={`input-ekhniiUldegdel-${index}`}
                                    type="text"
                                    value={
                                      focusedInput === `ekhniiUldegdel-${index}`
                                        ? formatWhileTyping(String(mainUnit.ekhniiUldegdel || ""))
                                        : formatWithCommas(mainUnit.ekhniiUldegdel) || "0.00"
                                    }
                                    onFocus={(e) => {
                                      setFocusedInput(`ekhniiUldegdel-${index}`);
                                      if (mainUnit.ekhniiUldegdel === 0 || !mainUnit.ekhniiUldegdel) setTimeout(() => e.target.select(), 0);
                                    }}
                                    onBlur={() => setFocusedInput(null)}
                                    onChange={(e) => {
                                      const input = e.target;
                                      const val = input.value;
                                      const oldStart = input.selectionStart || 0;
                                      const beforeCursor = val.slice(0, oldStart);
                                      const validCharsBeforeCursor = beforeCursor.replace(/[^0-9.]/g, "").length;
                                      pendingCursorRef.current = { index, field: "ekhniiUldegdel", validChars: validCharsBeforeCursor };
                                      let cleanVal = val.replace(/,/g, "").replace(/[^0-9.]/g, "");
                                      const dotIndex = cleanVal.indexOf(".");
                                      if (dotIndex !== -1) cleanVal = cleanVal.slice(0, dotIndex + 1) + cleanVal.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
                                      updateMainUnitRow(index, "ekhniiUldegdel", cleanVal);
                                    }}
                                    className="modern-input w-full text-right font-mono"
                                    placeholder="0.00"
                                    disabled={isEkhniiUldegdelDisabled && index === 0}
                                  />
                                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--muted-text)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">₮</div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-[color:var(--muted-text)] mb-1">Цахилгаан кВт</label>
                                <div className="relative group">
                                  <input
                                    id={`input-tsahilgaaniiZaalt-${index}`}
                                    type="text"
                                    value={
                                      focusedInput === `tsahilgaaniiZaalt-${index}`
                                        ? formatWhileTyping(String(mainUnit.tsahilgaaniiZaalt || ""))
                                        : formatWithCommas(mainUnit.tsahilgaaniiZaalt) || "0.00"
                                    }
                                    onFocus={(e) => {
                                      setFocusedInput(`tsahilgaaniiZaalt-${index}`);
                                      if (mainUnit.tsahilgaaniiZaalt === 0 || !mainUnit.tsahilgaaniiZaalt) setTimeout(() => e.target.select(), 0);
                                    }}
                                    onBlur={() => setFocusedInput(null)}
                                    onChange={(e) => {
                                      const input = e.target;
                                      const val = input.value;
                                      const oldStart = input.selectionStart || 0;
                                      const beforeCursor = val.slice(0, oldStart);
                                      const validCharsBeforeCursor = beforeCursor.replace(/[^0-9.]/g, "").length;
                                      pendingCursorRef.current = { index, field: "tsahilgaaniiZaalt", validChars: validCharsBeforeCursor };
                                      let cleanVal = val.replace(/,/g, "").replace(/[^0-9.]/g, "");
                                      const dotIndex = cleanVal.indexOf(".");
                                      if (dotIndex !== -1) cleanVal = cleanVal.slice(0, dotIndex + 1) + cleanVal.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
                                      updateMainUnitRow(index, "tsahilgaaniiZaalt", cleanVal);
                                    }}
                                    className="modern-input w-full text-right font-mono"
                                    placeholder="0.00"
                                  />
                                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--muted-text)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">кВт</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 md:col-span-3 pt-1">
                                <label className={`relative inline-flex items-center ${!!selectedBarilga?.tokhirgoo?.bodokhArgaEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} scale-75`}>
                                  <input
                                    type="checkbox"
                                    checked={mainUnit.khonogoorBodokhEsekh || false}
                                    disabled={!selectedBarilga?.tokhirgoo?.bodokhArgaEnabled}
                                    onChange={(e) => updateMainUnitRow(index, "khonogoorBodokhEsekh", e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-[color:var(--panel)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-theme dark:peer-focus:ring-theme rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[color:var(--surface-bg)] after:border-[color:var(--surface-border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme"></div>
                                </label>
                                <span className="text-[11px] font-medium text-[color:var(--muted-text)]">Ирээдүйд ашиглах хоног</span>
                                {mainUnit.khonogoorBodokhEsekh && (
                                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <input
                                      type="number"
                                      min={1}
                                      max={31}
                                      value={mainUnit.bodokhKhonog || ""}
                                      onChange={(e) => updateMainUnitRow(index, "bodokhKhonog", e.target.value)}
                                      placeholder="Хоног"
                                      className="modern-input !w-16 !h-7 text-center !py-0"
                                    />
                                    <span className="text-[11px] text-[color:var(--muted-text)]">хоногоор бодох</span>
                                  </div>
                                )}
                              </div>
                            </div>)}

                            {/* Гараж | Агуулах — «Харилцагч нэмэх»-тэй ижил зэрэгцээ самбар.
                                Энэ орон сууцны тоотод холбогдоно. */}
                            {!collapsedMains.includes(index) && (
                              <div className="grid grid-cols-1 items-start gap-3 px-4 pb-4 md:grid-cols-2">
                                {([
                                  { turul: "Зогсоол" as const, ner: "Гараж", jagsaalt: mainUnit.garages || [] },
                                  { turul: "Агуулах" as const, ner: "Агуулах", jagsaalt: mainUnit.storages || [] },
                                ]).map(({ turul, ner, jagsaalt }) => {
                                  const garash = turul === "Зогсоол";
                                  return (
                                    <div key={turul} className="overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]">
                                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`grid h-6 w-6 place-items-center rounded-md ${garash ? "bg-theme/10 text-brand" : "bg-indigo-500/10 text-indigo-500"}`}>
                                            {garash ? <Car className="h-3.5 w-3.5" /> : <Warehouse className="h-3.5 w-3.5" />}
                                          </span>
                                          <span className="text-xs font-medium text-[color:var(--panel-text)]">
                                            {ner}
                                            {jagsaalt.length > 0 && (
                                              <span className="ml-1 text-[color:var(--muted-text)]">({jagsaalt.length})</span>
                                            )}
                                          </span>
                                        </div>
                                        <Button
                                          type="button"
                                          onClick={() => (garash ? addGarageToUnit(index) : addStorageToUnit(index))}
                                          variant="secondary"
                                          size="sm"
                                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                                        >
                                          Нэмэх
                                        </Button>
                                      </div>
                                      {jagsaalt.map((u: any, i2: number) => {
                                        const flatIdx = garash ? getGarageFlatIndex(index, i2) : getStorageFlatIndex(index, i2);
                                        const shinechlekh = (field: string, val: string) =>
                                          garash ? updateGarageField(index, i2, field, val) : updateStorageField(index, i2, field, val);
                                        const opts = getTootOptions("1", u.davkhar || "", turul);
                                        return (
                                          <div key={`${turul}-${i2}`} className="flex items-center gap-2 border-t border-[color:var(--surface-border)] px-3 py-2">
                                            <div className={`tusgai-wrapper min-w-0 flex-1 flex items-center ${errors.includes(`units.${flatIdx}.davkhar`) ? "input-error" : ""}`}>
                                              <TusgaiZagvar
                                                value={u.davkhar || ""}
                                                onChange={(val: string) => shinechlekh("davkhar", val)}
                                                options={additionalFloors.map((d) => ({ value: d, label: d }))}
                                                className="w-full h-full"
                                                placeholder="Давхар"
                                              />
                                            </div>
                                            <div className={`tusgai-wrapper min-w-0 flex-1 flex items-center ${errors.includes(`units.${flatIdx}.toot`) ? "input-error" : ""}`}>
                                              <TusgaiZagvar
                                                value={u.toot || ""}
                                                onChange={(val: string) => shinechlekh("toot", val)}
                                                options={opts.map((t) => {
                                                  const ezemshigchtei = isTootOccupied(t, u.davkhar || "", "1", turul);
                                                  return {
                                                    value: t,
                                                    label: t,
                                                    isOccupied: ezemshigchtei,
                                                    occupiedNote: ezemshigchtei
                                                      ? `${garash ? "Гараж" : "Агуулах"} ${u.davkhar ? `${u.davkhar} давхрын ` : ""}${t} дугаар ${ezemshigchiinDelgerengui(t, u.davkhar || "", turul)}-д идэвхтэй бүртгэлтэй. Сул дугаар сонгох эсвэл эхлээд тухайн эзэмшигчээс салгана уу.`
                                                      : undefined,
                                                  };
                                                })}
                                                className="w-full h-full"
                                                placeholder="Дугаар"
                                                disabled={!u.davkhar}
                                                allowCustomInput={true}
                                                blockOccupied
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => (garash ? removeGarageFromUnit(index, i2) : removeStorageFromUnit(index, i2))}
                                              title="Хасах"
                                              aria-label={`${ner} хасах`}
                                              className="shrink-0 rounded-md p-1 text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tailbar */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-[color:var(--muted-text)] mb-1 transition-colors">
                        Тайлбар
                      </label>
                      <textarea
                        value={newResident.tailbar || ""}
                        onChange={(e) => {
                          setNewResident((p: any) => ({
                            ...p,
                            tailbar: e.target.value,
                          }));
                        }}
                        className="modern-textarea w-full resize-none"
                        placeholder="Тайлбар..."
                      />
                    </div>


                  </div>
                </div>

                <div className="flex justify-end px-4 py-3 border-t border-[color:var(--surface-border)] gap-3 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                  <Button
                    type="button"
                    onClick={requestClose}
                    variant="secondary"
                    size="md"
                    className="min-w-[80px]"
                  >
                    Хаах
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="min-w-[80px]"
                    data-modal-primary
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Түр хүлээнэ үү..." : (editingResident ? "Хадгалах" : "Хадгалах")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </ModalPortal>
      </AnimatePresence>

      <ConfirmCloseDialog
        open={showConfirmClose}
        onCancel={() => setShowConfirmClose(false)}
        onConfirm={() => { setShowConfirmClose(false); onClose(); }}
      />
    </>
  );
}
