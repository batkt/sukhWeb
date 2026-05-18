"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import Button from "@/components/ui/Button";
import { Plus, Calendar } from "lucide-react";
import StandardDatePicker from "@/components/ui/StandardDatePicker";
import uilchilgee from "@/lib/uilchilgee";
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
  getTootOptions: (orts: string, floor: string) => string[];
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
  React.useEffect(() => {
    if (show) {
      // Wait for units to be initialized (either from props or from the useEffect below)
      // to avoid false-positive "unsaved changes" warnings on new residents.
      const hasUnits = Array.isArray(newResident?.units) && newResident.units.length > 0;
      
      if (!initialSnapshot.current) {
          // Only take snapshot if units are populated (initialization done)
          // OR if it's been a few renders and still no units (though should always have one)
          if (hasUnits) {
            initialSnapshot.current = JSON.stringify(newResident);
          }
      }
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
        if (!unit.orts?.trim()) newErrors.push(`units.${index}.orts`);
        if (!unit.davkhar?.trim()) newErrors.push(`units.${index}.davkhar`);
        if (!unit.toot?.trim()) newErrors.push(`units.${index}.toot`);
        
        const key = `${unit.orts?.trim()}-${unit.davkhar?.trim()}-${unit.toot?.trim()}`;
        if (uniqueUnitKeys.has(key)) {
          newErrors.push(`units.${index}.duplicate`);
        } else {
          uniqueUnitKeys.add(key);
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
      
      const missingFields = newErrors
        .map((e) => {
          if (e.startsWith("units.")) {
            const parts = e.split(".");
            const field = parts[2];
            if (field === "duplicate") return `Мөр ${parseInt(parts[1]) + 1}: Давхардсан тоот (Орц/Давхар/Тоот)`;
            return `Мөр ${parseInt(parts[1]) + 1}: ${fieldNames[field] || field}`;
          }
          return fieldNames[e] || e;
        })
        .join(", ");

      openErrorOverlay(
        `Дараах талбарууд бөглөх шаардлагатай: ${missingFields}`,
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

        setNewResident((p: any) => ({
          ...p,
          ovog: found.ovog || p.ovog,
          ner: found.ner || p.ner,
          register: found.register || p.register,
          mail: found.mail || found.email || p.mail,
          khayag: found.khayag || p.khayag,
          units: filteredToots.length > 0 
            ? filteredToots.map((t: any) => ({
                orts: t.orts || "1",
                davkhar: t.davkhar || "",
                toot: t.toot || "",
                ekhniiUldegdel: t.ekhniiUldegdel || 0,
                tsahilgaaniiZaalt: t.tsahilgaaniiZaalt || 0,
                khonogoorBodokhEsekh: t.khonogoorBodokhEsekh || false,
                bodokhKhonog: t.bodokhKhonog || 0,
              }))
            : p.units
        }));
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

  // Sync local state when modal opens or editingResident changes
  React.useEffect(() => {
    if (show) {
      // Ensure units array exists
      if (!Array.isArray(newResident.units) || newResident.units.length === 0) {
        setNewResident((p: any) => ({
          ...p,
          units: [
            {
              orts: p.orts || "1",
              davkhar: p.davkhar || "",
              toot: p.toot || "",
              ekhniiUldegdel: p.ekhniiUldegdel || 0,
              tsahilgaaniiZaalt: p.tsahilgaaniiZaalt || 0,
              khonogoorBodokhEsekh: p.khonogoorBodokhEsekh || false,
              bodokhKhonog: p.bodokhKhonog || 0,
            },
          ],
        }));
      }

      setUldegdelInput(formatWithCommas(newResident.ekhniiUldegdel) || "0");
      setZaaltInput(formatWithCommas(newResident.tsahilgaaniiZaalt) || "0");
    }
  }, [show, newResident.ekhniiUldegdel, newResident.tsahilgaaniiZaalt]);

  const addUnitRow = () => {
    setNewResident((p: any) => ({
      ...p,
      units: [
        ...(p.units || []),
        {
          orts: "1",
          davkhar: "",
          toot: "",
          ekhniiUldegdel: 0,
          tsahilgaaniiZaalt: 0,
          khonogoorBodokhEsekh: false,
          bodokhKhonog: 0,
        },
      ],
    }));
  };

  const removeUnitRow = (index: number) => {
    setNewResident((p: any) => {
      const newUnits = [...(p.units || [])];
      newUnits.splice(index, 1);
      // If we removed the primary (index 0), sync new first unit to top-level fields
      const updates: any = { units: newUnits };
      if (index === 0 && newUnits.length > 0) {
        updates.orts = newUnits[0].orts || "";
        updates.davkhar = newUnits[0].davkhar || "";
        updates.toot = newUnits[0].toot || "";
        updates.ekhniiUldegdel = newUnits[0].ekhniiUldegdel || 0;
        updates.tsahilgaaniiZaalt = newUnits[0].tsahilgaaniiZaalt || 0;
        updates.khonogoorBodokhEsekh = newUnits[0].khonogoorBodokhEsekh || false;
        updates.bodokhKhonog = newUnits[0].bodokhKhonog || 0;
      }
      return { ...p, ...updates };
    });
  };

  const updateUnitRow = (index: number, field: string, value: any) => {
    setNewResident((p: any) => {
      const newUnits = [...(p.units || [])];
      newUnits[index] = { ...newUnits[index], [field]: value };
      
      // If updating the first unit, also update top-level fields for backward compatibility
      if (index === 0) {
        return { ...p, units: newUnits, [field]: value };
      }
      
      return { ...p, units: newUnits };
    });
  };

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
          border: none !important;
          transition: all 0.2s ease !important;
          background: transparent !important;
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
                className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-transparent via-white/5 to-transparent cursor-move select-none"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-slate-600 dark:text-slate-400"
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
                  <h2 className="text-lg text-slate-900 dark:text-white">
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
                    className="h-5 w-5 text-slate-500 dark:text-slate-400"
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
                        <label className="block text-xs text-slate-600 dark:text-slate-400 transition-colors">
                          Төрөл
                        </label>
                        {newResident.turul === "Түр" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
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
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          Гэрээ дуусах огноо <span className="text-red-500">*</span>
                        </label>
                        <div className="h-8">
                          <StandardDatePicker
                            value={newResident.duusakhOgnoo}
                            onChange={(_date, dateString) => 
                              setNewResident((p: any) => ({ ...p, duusakhOgnoo: dateString }))
                            }
                            placeholder="Дуусах огноо..."
                            className={errors.includes("duusakhOgnoo") ? "border-red-500" : ""}
                            getPopupContainer={() => residentRef.current || document.body}
                            popupStyle={{ zIndex: 13010 }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Овог */}
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
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
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
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
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
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
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Бүртгэлтэй тоотнууд</h3>
                        <Button
                          type="button"
                          onClick={addUnitRow}
                          variant="secondary"
                          size="sm"
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Тоот нэмэх
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {(newResident.units || []).map((unit: any, index: number) => (
                          <div 
                            key={index} 
                            className="relative grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:border-slate-200 dark:hover:border-slate-700"
                          >
                            {/* Remove Button - allow deleting any row as long as there are 2+ units */}
                            {(newResident.units || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeUnitRow(index)}
                                className="absolute -right-2 -top-2 p-1.5 bg-white dark:bg-slate-800 text-rose-500 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all z-10"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}

                            {/* Row Number Badge */}
                            <div className="absolute -left-2 -top-2 w-6 h-6 flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-bold border border-white dark:border-slate-700 shadow-sm">
                              {index + 1}
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-500 mb-1">
                                Орц
                              </label>
                              <div className={`tusgai-wrapper w-full flex items-center ${errors.includes(`units.${index}.orts`) ? "input-error" : ""}`}>
                                <TusgaiZagvar
                                  value={unit.orts || ""}
                                  onChange={(val: string) => updateUnitRow(index, "orts", val)}
                                  options={ortsOptions.map((o) => ({ value: o, label: o }))}
                                  className="w-full h-full"
                                  placeholder="Орц..."
                                />
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-500 mb-1">
                                Давхар
                              </label>
                              <div className={`tusgai-wrapper w-full flex items-center ${errors.includes(`units.${index}.davkhar`) ? "input-error" : ""}`}>
                                <TusgaiZagvar
                                  value={unit.davkhar || ""}
                                  onChange={(val: string) => updateUnitRow(index, "davkhar", val)}
                                  options={davkharOptions.map((d) => ({ value: d, label: d }))}
                                  className="w-full h-full"
                                  placeholder="Давхар..."
                                />
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-500 mb-1">
                                Тоот
                              </label>
                              <div className={`tusgai-wrapper w-full flex items-center ${errors.includes(`units.${index}.toot`) ? "input-error" : ""}`}>
                                <TusgaiZagvar
                                  value={unit.toot || ""}
                                  onChange={(val: string) => updateUnitRow(index, "toot", val)}
                                  options={getTootOptions(unit.orts || "", unit.davkhar || "").map((t) => {
                                    const isOccupied = currentResidents?.some(
                                      (r: any) => {
                                        const rOrts = String(getResidentOrts(r) || "").trim();
                                        const rDavkhar = String(getResidentDavkhar(r) || "").trim();
                                        const rToot = String(getResidentToot(r) || "").trim();
                                        const isSameUnit =
                                          rOrts === String(unit.orts || "").trim() &&
                                          rDavkhar === String(unit.davkhar || "").trim() &&
                                          rToot === String(t || "").trim();
                                        const isDifferentResident =
                                          String(r._id || "") !== String(editingResident?._id || "");
                                        return isSameUnit && isDifferentResident;
                                      },
                                    );
                                    return { value: t, label: t, isOccupied };
                                  })}
                                  className="w-full h-full"
                                  placeholder="Тоот..."
                                  disabled={!unit.orts || !unit.davkhar}
                                />
                              </div>
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-500 mb-1">
                                Эхний үлдэгдэл
                              </label>
                              <div className="relative group">
                                <input
                                  id={`input-ekhniiUldegdel-${index}`}
                                  type="text"
                                  value={
                                    focusedInput === `ekhniiUldegdel-${index}`
                                      ? formatWhileTyping(String(unit.ekhniiUldegdel || ""))
                                      : formatWithCommas(unit.ekhniiUldegdel) || "0.00"
                                  }
                                  onFocus={(e) => {
                                    setFocusedInput(`ekhniiUldegdel-${index}`);
                                    if (unit.ekhniiUldegdel === 0 || !unit.ekhniiUldegdel) {
                                      setTimeout(() => e.target.select(), 0);
                                    }
                                  }}
                                  onBlur={() => setFocusedInput(null)}
                                  onChange={(e) => {
                                    const input = e.target;
                                    const val = input.value;
                                    const oldStart = input.selectionStart || 0;
                                    
                                    // Count valid characters (digits/dot) before cursor
                                    const beforeCursor = val.slice(0, oldStart);
                                    const validCharsBeforeCursor = beforeCursor.replace(/[^0-9.]/g, "").length;

                                    pendingCursorRef.current = { index, field: "ekhniiUldegdel", validChars: validCharsBeforeCursor };

                                    // Remove all commas (thousands separators) before processing decimals
                                    let cleanVal = val.replace(/,/g, "");
                                    cleanVal = cleanVal.replace(/[^0-9.]/g, "");
                                    const dotIndex = cleanVal.indexOf(".");
                                    if (dotIndex !== -1) {
                                      cleanVal = cleanVal.slice(0, dotIndex + 1) + 
                                                cleanVal.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
                                    }
                                    updateUnitRow(index, "ekhniiUldegdel", cleanVal);
                                  }}
                                  className="modern-input w-full text-right font-mono"
                                  placeholder="0.00"
                                  disabled={isEkhniiUldegdelDisabled && index === 0}
                                />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  ₮
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-500 mb-1">
                                Цахилгаан кВт
                              </label>
                              <div className="relative group">
                                <input
                                  id={`input-tsahilgaaniiZaalt-${index}`}
                                  type="text"
                                  value={
                                    focusedInput === `tsahilgaaniiZaalt-${index}`
                                      ? formatWhileTyping(String(unit.tsahilgaaniiZaalt || ""))
                                      : formatWithCommas(unit.tsahilgaaniiZaalt) || "0.00"
                                  }
                                  onFocus={(e) => {
                                    setFocusedInput(`tsahilgaaniiZaalt-${index}`);
                                    if (unit.tsahilgaaniiZaalt === 0 || !unit.tsahilgaaniiZaalt) {
                                      setTimeout(() => e.target.select(), 0);
                                    }
                                  }}
                                  onBlur={() => setFocusedInput(null)}
                                  onChange={(e) => {
                                    const input = e.target;
                                    const val = input.value;
                                    const oldStart = input.selectionStart || 0;
                                    
                                    // Count valid characters (digits/dot) before cursor
                                    const beforeCursor = val.slice(0, oldStart);
                                    const validCharsBeforeCursor = beforeCursor.replace(/[^0-9.]/g, "").length;

                                    pendingCursorRef.current = { index, field: "tsahilgaaniiZaalt", validChars: validCharsBeforeCursor };

                                    // Remove all commas (thousands separators) before processing decimals
                                    let cleanVal = val.replace(/,/g, "");
                                    cleanVal = cleanVal.replace(/[^0-9.]/g, "");
                                    const dotIndex = cleanVal.indexOf(".");
                                    if (dotIndex !== -1) {
                                      cleanVal = cleanVal.slice(0, dotIndex + 1) + 
                                                cleanVal.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
                                    }
                                    updateUnitRow(index, "tsahilgaaniiZaalt", cleanVal);
                                  }}
                                  className="modern-input w-full text-right font-mono"
                                  placeholder="0.00"
                                />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  кВт
                                </div>
                              </div>
                            </div>

                            {/* Pro-rating Row inside Unit */}
                            <div className="md:col-span-12 flex items-center gap-4 mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <label className={`relative inline-flex items-center ${!!selectedBarilga?.tokhirgoo?.bodokhArgaEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} scale-75`}
                                  title={!selectedBarilga?.tokhirgoo?.bodokhArgaEnabled ? "Барилгын тохиргоонд хоногоор бодох тохиргоо идэвхжээгүй байна" : ""}
                                >
                                  <input
                                    type="checkbox"
                                    checked={unit.khonogoorBodokhEsekh || false}
                                    disabled={!selectedBarilga?.tokhirgoo?.bodokhArgaEnabled}
                                    onChange={(e) => updateUnitRow(index, "khonogoorBodokhEsekh", e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Ирээдүйд ашиглах хоног</span>
                              </div>

                              {unit.khonogoorBodokhEsekh && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                  <input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={unit.bodokhKhonog || ""}
                                    onChange={(e) => updateUnitRow(index, "bodokhKhonog", e.target.value)}
                                    placeholder="Хоног"
                                    className="modern-input !w-16 !h-7 text-center !py-0"
                                  />
                                  <span className="text-[11px] text-slate-500">хоногоор бодох</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tailbar */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
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

                <div className="flex justify-end px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 gap-3 bg-gradient-to-r from-transparent via-white/5 to-transparent">
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
