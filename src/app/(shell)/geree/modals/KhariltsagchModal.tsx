"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import TusgaiZagvar from "../../../../../components/selectZagvar/tusgaiZagvar";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import Button from "@/components/ui/Button";
import { Plus, Minus, X, Car, Warehouse } from "lucide-react";
import {
  mashiniiDugaarTseverle,
  dugaarZuvEsekh,
  mashiniiKhyazgaarOlya,
} from "@/lib/mashiniiDugaar";
import uilchilgee from "@/lib/uilchilgee";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
  getResidentToots,
  getResidentDavkhauraud,
  getResidentOrtsuud,
} from "@/lib/residentDataHelper";

interface KhariltsagchModalProps {
  show: boolean;
  onClose: () => void;
  editingClient: any;
  newClient: any;
  setNewClient: (val: any) => void;
  ortsOptions: string[];
  davkharOptions: string[];
  getTootOptions: (
    orts: string,
    floor: string,
    turul?: "Тоот" | "Зогсоол" | "Агуулах",
  ) => string[];
  selectedBarilga: any;
  baiguullaga: any;
  currentResidents: any[];
  onSubmit: (e: React.FormEvent) => Promise<any>;
  token: string | null;
}

export default function KhariltsagchModal({
  show,
  onClose,
  editingClient,
  newClient,
  setNewClient,
  ortsOptions,
  davkharOptions,
  getTootOptions,
  selectedBarilga,
  baiguullaga,
  currentResidents,
  onSubmit,
  token,
}: KhariltsagchModalProps) {
  const residentRef = React.useRef<HTMLDivElement | null>(null);
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [errors, setErrors] = React.useState<string[]>([]);
  const [showConfirmClose, setShowConfirmClose] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const pendingCursorRef = React.useRef<{
    index: number;
    field: string;
    validChars: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    if (pendingCursorRef.current) {
      const { index, field, validChars } = pendingCursorRef.current;
      const input = document.getElementById(
        `input-${field}-${index}`,
      ) as HTMLInputElement;
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

  /**
   * Хэрэглэгчийн ЗАСАХ боломжтой талбаруудын түлхүүр. Нээгдсэний дараа
   * sync effect-үүд `units`, `mashiniiDugaar`, `orts/toot`-ийг дахин
   * бичдэг тул бүтэн объектыг харьцуулбал юу ч засаагүй байхад
   * "өөрчлөгдсөн" гэж хаахад анхааруулга гардаг байв.
   */
  const zasvariinTulkhuur = (c: any): string => {
    if (!c) return "";
    const str = (v: any) => String(v ?? "").trim();
    const utas = Array.isArray(c.utas) ? c.utas[0] : c.utas;
    const mashinuud = (
      Array.isArray(c.mashinuud) && !c.mashiniiDugaar
        ? c.mashinuud
        : String(c.mashiniiDugaar || "").split(",")
    )
      .map(str)
      .filter(Boolean);
    const units = (Array.isArray(c.units) ? c.units : [])
      .filter((u: any) => u?.turul === "Гараж" || u?.turul === "Агуулах")
      .map((u: any) => [
        u.turul,
        str(u.davkhar),
        str(u.toot),
        Number(u.ekhniiUldegdel || 0),
      ]);
    return JSON.stringify([
      str(c.ovog),
      str(c.ner),
      str(utas),
      str(c.tailbar),
      !!c.gadnaZogsoolEsekh,
      mashinuud,
      units,
    ]);
  };

  // Snapshot of newClient when modal opens — used to detect unsaved changes
  const initialSnapshot = React.useRef<string | null>(null);
  const initialTulkhuur = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (show) {
      if (!initialSnapshot.current && newClient) {
        initialSnapshot.current = JSON.stringify(newClient);
        initialTulkhuur.current = zasvariinTulkhuur(newClient);
      }
      setErrors([]);
    } else {
      initialSnapshot.current = null;
      initialTulkhuur.current = null;
      setShowConfirmClose(false);
      setUldegdelInput("");
      setZaaltInput("");
      setIsSubmitting(false);
    }
  }, [show, newClient?.units, editingClient]);

  const hasChanges = React.useMemo(() => {
    if (!initialTulkhuur.current || !newClient) return false;
    return zasvariinTulkhuur(newClient) !== initialTulkhuur.current;
  }, [newClient, show]);

  const requestClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const validate = () => {
    const newErrors: string[] = [];
    // Зөвхөн НЭР шаардлагатай. Харилцагч дээр утас, зогсоол/агуулахын тоот
    // байхгүй байх нь хэвийн тул тэднийг албадахгүй (Excel импорттой ижил).
    if (!newClient.ner?.trim()) newErrors.push("ner");

    // Бөглөсөн дугаар бүр хэлбэрт таарах ёстой. Хоосон мөр нь «бөглөөгүй»
    // тул шалгалтгүй — хэрэглэгч «+» дарж мөр нэмээд орхиж болно.
    mashinuud.forEach((d, i) => {
      const dugaar = (d || "").trim();
      if (dugaar && !dugaarZuvEsekh(dugaar)) {
        newErrors.push(`mashin.${i}`);
      }
    });

    // Давхардсан дугаар
    const bugleesen = mashinuud.map((d) => (d || "").trim()).filter(Boolean);
    if (new Set(bugleesen).size !== bugleesen.length) {
      newErrors.push("mashin.duplicate");
    }

    // Хязгаар — «+» хаагдсан ч хуучин мөр үлдсэн, эсвэл засах үед
    // хязгаар буурсан байж болно.
    if (mashiniiKhyazgaar > 0 && bugleesen.length > mashiniiKhyazgaar) {
      newErrors.push("mashin.khyazgaar");
    }

    // Гараж/агуулах БАЙХГҮЙ харилцагч бүртгэх нь хэвийн — дараа нь тоот
    // нэмж болно. Иймд `no_units` шалгалтыг хассан.
    //
    // Гэхдээ тоот БӨГЛӨСӨН мөрүүд дээр ДАВХАРДЛЫГ шалгасаар байна: хоосон
    // тоотууд хоорондоо "давхардсан" болж мэдэхгүйн тул зөвхөн утгатайг
    // тооцно.
    const units = Array.isArray(newClient.units) ? newClient.units : [];
    const uniqueUnitKeys = new Set();
    units.forEach((unit: any, index: number) => {
      const tootVal = unit.toot?.trim() || "";
      if (!tootVal) return;

      const isGarageOrStorage =
        unit.turul === "Гараж" || unit.turul === "Агуулах";
      const ortsVal = isGarageOrStorage ? "1" : unit.orts?.trim() || "";
      const davkharVal = isGarageOrStorage ? "" : unit.davkhar?.trim() || "";
      const key = `${ortsVal}-${davkharVal}-${tootVal}`;
      if (uniqueUnitKeys.has(key)) {
        newErrors.push(`units.${index}.duplicate`);
      } else {
        uniqueUnitKeys.add(key);
      }
    });


    setErrors(newErrors);

    if (newErrors.length > 0) {
      const fieldNames: Record<string, string> = {
        ner: "Нэр",
        orts: "Орц",
        davkhar: "Давхар",
        toot: "Тоот",
        duusakhOgnoo: "Гэрээ дуусах огноо",
      };

      // Дугаарын алдаа нь «бөглөөгүй» биш «ХЭЛБЭР буруу» тул тусад нь
      // хэлнэ — «бөглөх шаардлагатай» гэдэг нь төөрөгдүүлнэ.
      const mashiniiAldaa = newErrors
        .filter((e) => e.startsWith("mashin."))
        .map((e) => {
          if (e === "mashin.duplicate") return "давхардсан дугаар";
          if (e === "mashin.khyazgaar")
            return `хязгаар ${mashiniiKhyazgaar} машин`;
          return `${parseInt(e.split(".")[1]) + 1}-р дугаар`;
        });

      const busadAldaa = newErrors.filter((e) => !e.startsWith("mashin."));

      if (mashiniiAldaa.length > 0 && busadAldaa.length === 0) {
        openErrorOverlay(
          `Машины дугаар буруу (${mashiniiAldaa.join(", ")}). Хэлбэр: 4 тоо + 3 үсэг, жишээ 1234УБА`,
        );
        return false;
      }

      const missingFields = busadAldaa
        .map((e) => {
          if (e.startsWith("units.")) {
            const parts = e.split(".");
            const field = parts[2];
            if (field === "duplicate")
              return `Мөр ${parseInt(parts[1]) + 1}: Давхардсан тоот`;
            return `Мөр ${parseInt(parts[1]) + 1}: ${fieldNames[field] || field}`;
          }
          return fieldNames[e] || e;
        })
        .join(", ");

      openErrorOverlay(
        mashiniiAldaa.length > 0
          ? `Дараах талбарууд бөглөх шаардлагатай: ${missingFields}. Мөн машины дугаар буруу (${mashiniiAldaa.join(", ")})`
          : `Дараах талбарууд бөглөх шаардлагатай: ${missingFields}`,
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
        const ovog = (newClient.ovog || "").toString().trim().toLowerCase();
        const ner = (newClient.ner || "").toString().trim().toLowerCase();
        const phone = (
          Array.isArray(newClient.utas)
            ? newClient.utas[0]
            : newClient.utas || ""
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
              editingClient &&
              String(editingClient._id || "") === String(r._id || "");
            if (isSameResident) return false;

            const rToots = (getResidentToots(r) || "")
              .split(", ")
              .map((t) => t.trim());

            const units = Array.isArray(newClient.units)
              ? newClient.units
              : [{ toot: newClient.toot }];

            const hasConflict = units.some((u: any) => {
              const uOrts = String(u.orts || "1").trim();
              const uDavkhar = String(u.davkhar || "").trim();
              const uToot = String(u.toot || "").trim();
              const existingUnits =
                Array.isArray(r.toots) && r.toots.length > 0
                  ? r.toots
                  : [{ orts: r.orts, davkhar: r.davkhar, toot: r.toot }];
              return existingUnits.some((rt: any) => {
                const rtOrts = String(rt.orts || "1").trim();
                const rtDavkhar = String(rt.davkhar || "").trim();
                const rtToot = String(rt.toot || "").trim();
                return (
                  rtOrts === uOrts && rtDavkhar === uDavkhar && rtToot === uToot
                );
              });
            });

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
              `Энэ овог, нэр, утасны харилцагч дараах тоот дээр бүртгэлтэй байна: ${tootList}. Давхардсан бүртгэл үүсгэх боломжгүй.`,
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

  /**
   * Харилцагч дээр бүртгэж болох машины дээд тоо.
   *
   * Backend-ийн хаалттай ИЖИЛ логикоор бодно — эс тэгвээс дэлгэц
   * зөвшөөрөөд сервер хаяж, хэрэглэгч машин орсон гэж бодно.
   * 0 бол тохируулаагүй → хязгаарлахгүй.
   */
  const mashiniiKhyazgaar = React.useMemo(
    () => mashiniiKhyazgaarOlya(baiguullaga, selectedBarilga, "Khariltsagch"),
    [baiguullaga, selectedBarilga],
  );

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
      const resp = await uilchilgee(token || "").get("/khariltsagch", {
        params: {
          baiguullagiinId: baiguullaga?._id,
          barilgiinId: selectedBarilga._id,
          search: phone,
        },
      });

      const found = Array.isArray(resp.data?.jagsaalt)
        ? resp.data.jagsaalt[0]
        : null;

      if (found) {
        // Filter units by current building and exclude WALLET_API
        const filteredToots = (found.toots || []).filter(
          (t: any) =>
            String(t.barilgiinId) === String(selectedBarilga._id) &&
            t.source !== "WALLET_API",
        );

        setNewClient((p: any) => ({
          ...p,
          ovog: found.ovog || p.ovog,
          ner: found.ner || p.ner,
          register: found.register || p.register,
          mail: found.mail || found.email || p.mail,
          khayag: found.khayag || p.khayag,
          units:
            filteredToots.length > 0
              ? filteredToots.map((t: any) => ({
                  orts: t.orts || "1",
                  davkhar: t.davkhar || "",
                  toot: t.toot || "",
                  ekhniiUldegdel: t.ekhniiUldegdel || 0,
                  tsahilgaaniiZaalt: t.tsahilgaaniiZaalt || 0,
                  khonogoorBodokhEsekh: t.khonogoorBodokhEsekh || false,
                  bodokhKhonog: t.bodokhKhonog || 0,
                }))
              : p.units,
        }));
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  useModalHotkeys({
    isOpen: show,
    onClose: requestClose,
    onSubmit: (e?: any) =>
      handleLocalSubmit(e || ({ preventDefault: () => {} } as any)),
    container: residentRef.current,
  });

  // Local state for formatted inputs
  const [uldegdelInput, setUldegdelInput] = React.useState("");
  const [zaaltInput, setZaaltInput] = React.useState("");
  const [focusedInput, setFocusedInput] = React.useState<string | null>(null);

  /**
   * Улсын дугаарууд — «+»-аар мөр нэмнэ.
   *
   * Backend нь `mashiniiDugaar`-ыг таслалаар салгаж уншдаг
   * (`utils/mashinBurtgel.js` → `dugaaruudSalgaya`) тул хадгалахдаа
   * массивыг нэгтгэж дамжуулна.
   */
  const [mashinuud, setMashinuud] = React.useState<string[]>([""]);
  /** Хязгаарт хүрсэн эсэх — «+» товчийг хаана. */
  const khyazgaartKhurev =
    mashiniiKhyazgaar > 0 && mashinuud.length >= mashiniiKhyazgaar;
  const [garages, setGarages] = React.useState<any[]>([]);
  const [storages, setStorages] = React.useState<any[]>([]);

  const emptyGarage = () => ({ davkhar: "", toot: "", ekhniiUldegdel: 0, tsahilgaaniiZaalt: 0, khonogoorBodokhEsekh: false, bodokhKhonog: 0 });
  const emptyStorage = () => ({ davkhar: "", toot: "", ekhniiUldegdel: 0, tsahilgaaniiZaalt: 0, khonogoorBodokhEsekh: false, bodokhKhonog: 0 });

  // Garage helpers
  const addGarage = () => {
    setGarages((prev) => [...prev, emptyGarage()]);
  };
  const removeGarage = (index: number) => {
    setGarages((prev) => { const n = [...prev]; n.splice(index, 1); return n; });
  };
  const updateGarageField = (index: number, field: string, value: any) => {
    setGarages((prev) => {
      const n = [...prev];
      n[index] = { ...n[index], [field]: value };
      return n;
    });
  };

  // Storage helpers
  const addStorage = () => {
    setStorages((prev) => [...prev, emptyStorage()]);
  };
  const removeStorage = (index: number) => {
    setStorages((prev) => { const n = [...prev]; n.splice(index, 1); return n; });
  };
  const updateStorageField = (index: number, field: string, value: any) => {
    setStorages((prev) => {
      const n = [...prev];
      n[index] = { ...n[index], [field]: value };
      return n;
    });
  };

  // Flat index calculators
  const getGarageFlatIndex = (garageIndex: number) => {
    return garageIndex;
  };
  const getStorageFlatIndex = (storageIndex: number) => {
    return garages.length + storageIndex;
  }

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
    let fractionalPart =
      parts.length > 1 ? parts[1].replace(/\D/g, "").slice(0, 2) : "";

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
    if (!editingClient) return false;
    const existing =
      editingClient.ekhniiUldegdel ?? editingClient.medeelel?.ekhniiUldegdel;
    const parsedSnapshot = initialSnapshot.current
      ? JSON.parse(initialSnapshot.current)
      : null;
    const initial = parsedSnapshot?.ekhniiUldegdel;
    // Disable if original record has non-zero OR if it was non-zero when modal opened (e.g. fetched from history)
    return (
      (existing != null && Number(existing) !== 0) ||
      (initial != null && Number(initial) !== 0)
    );
  }, [editingClient, show, initialSnapshot.current]);

  // Sync local state when modal opens
  React.useEffect(() => {
    if (show) {
      const units = Array.isArray(newClient.units) ? newClient.units : [];
      const allGarages = units.filter((u: any) => u.turul === "Гараж");
      const allStorages = units.filter((u: any) => u.turul === "Агуулах");

      setGarages(allGarages.map((g: any) => ({ ...g })));
      setStorages(allStorages.map((s: any) => ({ ...s })));

      // Жагсаалтын мөр нь `mashinuud` массив (backend-ийн join), эсвэл
      // `mashiniiDugaar` таслалтай мөр байж болно — хоёуланг дэмжинэ.
      const baigaa = Array.isArray(newClient.mashinuud)
        ? newClient.mashinuud.map((m: any) => String(m || ""))
        : String(newClient.mashiniiDugaar || "")
            .split(",")
            .map((s) => s.trim());
      const tseverleesen = baigaa.filter(Boolean);
      setMashinuud(tseverleesen.length > 0 ? tseverleesen : [""]);
      
      const primary = allGarages[0] || allStorages[0] || {};
      setUldegdelInput(formatWithCommas(primary.ekhniiUldegdel) || "0");
      setZaaltInput(formatWithCommas(primary.tsahilgaaniiZaalt) || "0");
    }
  }, [show]);

  // Дугаарын массивыг эцэгт нэг мөр болгож дамжуулна — backend нь
  // таслалаар салгаж уншдаг.
  React.useEffect(() => {
    if (!show) return;
    const niiluulsen = mashinuud
      .map((d) => (d || "").trim())
      .filter(Boolean)
      .join(", ");
    setNewClient((p: any) =>
      p.mashiniiDugaar === niiluulsen ? p : { ...p, mashiniiDugaar: niiluulsen },
    );
  }, [mashinuud, show, setNewClient]);

  // Sync to parent component's newClient state
  React.useEffect(() => {
    if (!show) return;
    const activeUnits: any[] = [];
    
    garages.forEach((g: any) => {
      activeUnits.push({ orts: "1", davkhar: g.davkhar || "", toot: g.toot || "", turul: "Гараж",
        ekhniiUldegdel: Number(g.ekhniiUldegdel || 0), tsahilgaaniiZaalt: Number(g.tsahilgaaniiZaalt || 0),
        khonogoorBodokhEsekh: !!g.khonogoorBodokhEsekh, bodokhKhonog: Number(g.bodokhKhonog || 0) });
    });
    storages.forEach((s: any) => {
      activeUnits.push({ orts: "1", davkhar: s.davkhar || "", toot: s.toot || "", turul: "Агуулах",
        ekhniiUldegdel: Number(s.ekhniiUldegdel || 0), tsahilgaaniiZaalt: Number(s.tsahilgaaniiZaalt || 0),
        khonogoorBodokhEsekh: !!s.khonogoorBodokhEsekh, bodokhKhonog: Number(s.bodokhKhonog || 0) });
    });

    setNewClient((p: any) => {
      const stringifiedActive = JSON.stringify(activeUnits);
      const stringifiedExisting = JSON.stringify(p.units);
      if (stringifiedActive === stringifiedExisting) return p;

      const primary = activeUnits[0] || { orts: "", davkhar: "", toot: "", ekhniiUldegdel: 0, tsahilgaaniiZaalt: 0, khonogoorBodokhEsekh: false, bodokhKhonog: 0 };

      return {
        ...p,
        units: activeUnits,
        orts: primary.orts || "",
        davkhar: primary.davkhar || "",
        toot: primary.toot || "",
        ekhniiUldegdel: primary.ekhniiUldegdel || 0,
        tsahilgaaniiZaalt: primary.tsahilgaaniiZaalt || 0,
        khonogoorBodokhEsekh: primary.khonogoorBodokhEsekh || false,
        bodokhKhonog: primary.bodokhKhonog || 0,
      };
    });
  }, [garages, storages, show]);

  const additionalFloors = React.useMemo(() => {
    const filtered = davkharOptions.filter((d) => /^B\d+$/i.test(d));
    return filtered.length > 0 ? filtered : ["B1", "B2", "B3"];
  }, [davkharOptions]);

  const isTootOccupied = React.useCallback(
    (tootVal: string, floorVal: string, propertyType: "Зогсоол" | "Агуулах") => {
      if (!Array.isArray(currentResidents)) return false;
      const uOrts = "1";
      const uDavkhar = String(floorVal || "").trim().toLowerCase();
      const uToot = String(tootVal || "").trim().toLowerCase();
      if (!uToot) return false;

      return currentResidents.some((r: any) => {
        if (editingClient && String(editingClient._id || "") === String(r._id || "")) {
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

          let rtPropertyType = "";
          if (rtTurul === "гараж" || rtTurul === "зогсоол" || rtTurul === "parking" || rtTurul === "garage") {
            rtPropertyType = "Зогсоол";
          } else if (rtTurul === "агуулах" || rtTurul === "storage") {
            rtPropertyType = "Агуулах";
          } else {
            rtPropertyType = "Тоот";
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
    [currentResidents, editingClient]
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
        /* Бичих боломжтой сонгогчийн сумтай товч — дээрх 100% өргөн нь
           сумыг талбарын дунд аваачиж байсан */
        .tusgai-wrapper input + button {
          width: auto !important;
          flex-shrink: 0 !important;
          padding: 0 10px !important;
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
            className="fixed inset-0 z-[12000] flex items-center justify-center p-4"
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
              className="relative z-[12001] w-full max-w-2xl modal-surface modal-responsive rounded-xl shadow-2xl p-0 flex flex-col max-h-[85vh] overflow-hidden"
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
                    {editingClient
                      ? "Харилцагчийн мэдээлэл засах"
                      : "Харилцагч нэмэх"}
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
                  <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
                    {/* Овог */}
                    <div>
                      <label className="block text-xs text-[color:var(--muted-text)] mb-1 transition-colors">
                        Овог
                      </label>
                      <input
                        type="text"
                        value={newClient.ovog || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            "",
                          );
                          setNewClient((p: any) => ({ ...p, ovog: value }));
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
                        value={newClient.ner || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            "",
                          );
                          setNewClient((p: any) => ({ ...p, ner: value }));
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
                          Array.isArray(newClient.utas)
                            ? newClient.utas[0] || ""
                            : newClient.utas || ""
                        }
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 8);
                          setNewClient((p: any) => ({ ...p, utas: [value] }));
                        }}
                        className={`modern-input w-full ${errors.includes("utas") ? "input-error" : ""}`}
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>

                    {/* Машины дугаар — мөр тус бүрийн дэргэд товч:
                        ЭХНИЙ мөрд «+» (нэмэх), нэмсэн мөрүүдэд «−» (хасах) */}
                    <div>
                      <label className="mb-1 block text-xs text-[color:var(--muted-text)] transition-colors">
                        Машины дугаар
                      </label>
                      <div className="space-y-1.5">
                        {mashinuud.map((dugaar, i) => (
                          <div
                            key={i}
                            className="flex items-stretch gap-1.5"
                          >
                            <input
                              type="text"
                              value={dugaar}
                              onChange={(e) => {
                                const utga = mashiniiDugaarTseverle(
                                  e.target.value,
                                );
                                setMashinuud((prev) => {
                                  const shine = [...prev];
                                  shine[i] = utga;
                                  return shine;
                                });
                              }}
                              className={`modern-input min-w-0 flex-1 ${
                                errors.includes(`mashin.${i}`)
                                  ? "input-error"
                                  : ""
                              }`}
                              placeholder="1234УБА"
                              maxLength={7}
                            />
                            {i === 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setMashinuud((prev) => [...prev, ""])
                                }
                                disabled={khyazgaartKhurev}
                                className="grid w-9 shrink-0 place-items-center rounded-lg border border-theme/30 bg-theme/10 text-brand transition-colors hover:bg-theme/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-theme/10"
                                title={
                                  khyazgaartKhurev
                                    ? `Машины хязгаар ${mashiniiKhyazgaar}`
                                    : "Машин нэмэх"
                                }
                                aria-label="Машин нэмэх"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setMashinuud((prev) =>
                                    prev.filter((_, j) => j !== i),
                                  )
                                }
                                className="grid w-9 shrink-0 place-items-center rounded-lg border border-danger/30 bg-danger/10 text-danger transition-colors hover:bg-danger/20"
                                title="Хасах"
                                aria-label="Хасах"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Гадна зогсоол ────────────────────────────────────
                        Гадна зогсоол хэрэглэдэг харилцагч гараж/агуулах
                        давхар эзэмшиж болно — тэмдэглэсэн ч тоот нэмэх
                        боломжтой. Тоотгүй бол `syncResidentContracts` гэрээ
                        үүсгэхгүй. */}
                    <div className="md:col-span-2">
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-3 py-2.5 transition-colors hover:border-theme/40">
                        <input
                          type="checkbox"
                          checked={!!newClient.gadnaZogsoolEsekh}
                          onChange={(e) => {
                            const asaav = e.target.checked;
                            setNewClient((p: any) => ({
                              ...p,
                              gadnaZogsoolEsekh: asaav,
                            }));
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[color:var(--theme)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-xs text-[color:var(--panel-text)]">
                            Гадна зогсоол
                          </span>
                          <span className="mt-0.5 block text-[11px] text-[color:var(--muted-text)]">
                            Гараж / агуулахгүйгээр хадгалах, эсвэл давхар нэмж болно
                          </span>
                        </span>
                      </label>
                    </div>

                    {/* Гараж | Агуулах — зэрэгцээ самбар. Гадна зогсоолтой ч
                        давхар нэмж болно. */}
                    <div className="md:col-span-2 grid grid-cols-1 items-start gap-3 md:grid-cols-2">
                      <div className="overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]">
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-theme/10 text-brand">
                              <Car className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-xs font-medium text-[color:var(--panel-text)]">
                              Гараж
                              {garages.length > 0 && (
                                <span className="ml-1 text-[color:var(--muted-text)]">({garages.length})</span>
                              )}
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={addGarage}
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                          >
                            Нэмэх
                          </Button>
                        </div>
                        {garages.map((garage: any, gIdx: number) => {
                          const gFlatIdx = getGarageFlatIndex(gIdx);
                          return (
                            <div key={`garage-${gIdx}`} className="flex items-center gap-2 border-t border-[color:var(--surface-border)] px-3 py-2">
                              <div className={`tusgai-wrapper min-w-0 flex-1 flex items-center ${errors.includes(`units.${gFlatIdx}.davkhar`) ? "input-error" : ""}`}>
                                <TusgaiZagvar value={garage.davkhar || ""} onChange={(val: string) => updateGarageField(gIdx, "davkhar", val)}
                                  options={additionalFloors.map((d) => ({ value: d, label: d }))} className="w-full h-full" placeholder="Давхар" />
                              </div>
                              <div className={`tusgai-wrapper min-w-0 flex-1 flex items-center ${errors.includes(`units.${gFlatIdx}.toot`) ? "input-error" : ""}`}>
                                <TusgaiZagvar value={garage.toot || ""} onChange={(val: string) => updateGarageField(gIdx, "toot", val)}
                                  options={getTootOptions("1", garage.davkhar || "", "Зогсоол").map((t) => ({ value: t, label: t, isOccupied: isTootOccupied(t, garage.davkhar || "", "Зогсоол") }))} className="w-full h-full" placeholder="Дугаар" disabled={!garage.davkhar} allowCustomInput={true} />
                              </div>
                              <button type="button" onClick={() => removeGarage(gIdx)}
                                title="Хасах" aria-label="Хасах"
                                className="shrink-0 rounded-md p-1 text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]">
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-indigo-500/10 text-indigo-500">
                              <Warehouse className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-xs font-medium text-[color:var(--panel-text)]">
                              Агуулах
                              {storages.length > 0 && (
                                <span className="ml-1 text-[color:var(--muted-text)]">({storages.length})</span>
                              )}
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={addStorage}
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                          >
                            Нэмэх
                          </Button>
                        </div>
                        {storages.map((storage: any, sIdx: number) => {
                          const sFlatIdxNested = getStorageFlatIndex(sIdx);
                          return (
                            <div key={`storage-${sIdx}`} className="flex items-center gap-2 border-t border-[color:var(--surface-border)] px-3 py-2">
                              <div className={`tusgai-wrapper min-w-0 flex-1 flex items-center ${errors.includes(`units.${sFlatIdxNested}.davkhar`) ? "input-error" : ""}`}>
                                <TusgaiZagvar value={storage.davkhar || ""} onChange={(val: string) => updateStorageField(sIdx, "davkhar", val)}
                                  options={additionalFloors.map((d) => ({ value: d, label: d }))} className="w-full h-full" placeholder="Давхар" />
                              </div>
                              <div className={`tusgai-wrapper min-w-0 flex-1 flex items-center ${errors.includes(`units.${sFlatIdxNested}.toot`) ? "input-error" : ""}`}>
                                <TusgaiZagvar value={storage.toot || ""} onChange={(val: string) => updateStorageField(sIdx, "toot", val)}
                                  options={getTootOptions("1", storage.davkhar || "", "Агуулах").map((t) => ({ value: t, label: t, isOccupied: isTootOccupied(t, storage.davkhar || "", "Агуулах") }))} className="w-full h-full" placeholder="Дугаар" disabled={!storage.davkhar} allowCustomInput={true} />
                              </div>
                              <button type="button" onClick={() => removeStorage(sIdx)}
                                title="Хасах" aria-label="Хасах"
                                className="shrink-0 rounded-md p-1 text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Tailbar */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-[color:var(--muted-text)] mb-1 transition-colors">
                        Тайлбар
                      </label>
                      <textarea
                        value={newClient.tailbar || ""}
                        onChange={(e) => {
                          setNewClient((p: any) => ({
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
                    {isSubmitting
                      ? "Түр хүлээнэ үү..."
                      : editingClient
                        ? "Хадгалах"
                        : "Хадгалах"}
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
        onConfirm={() => {
          setShowConfirmClose(false);
          onClose();
        }}
      />
    </>
  );
}
