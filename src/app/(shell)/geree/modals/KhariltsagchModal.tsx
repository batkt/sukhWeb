"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import TusgaiZagvar from "../../../../../components/selectZagvar/tusgaiZagvar";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import Button from "@/components/ui/Button";
import {
  Plus,
  Minus,
  X,
  Car,
  Warehouse,
  Users,
  User,
  Phone,
  Building2,
  FileText,
  HelpCircle,
  ChevronRight,
  Check,
} from "lucide-react";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
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
import { negjiinTurul, negjiinTulkhuur } from "@/lib/negjiinTurul";

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
  contracts?: any[];
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
  contracts = [],
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
      .map((u: any) => [
        negjiinTurul(u),
        str(u.orts),
        str(u.davkhar),
        str(u.toot),
        Number(u.ekhniiUldegdel || 0),
      ])
      .map((x: any[]) => JSON.stringify(x))
      .sort();
    return JSON.stringify([
      str(c.ovog),
      str(c.ner),
      str(utas),
      str(c.tailbar),
      !!c.gadnaZogsoolEsekh,
      mashinuud,
      units,
      Array.isArray(c.songosonZardluud)
        ? c.songosonZardluud.map(String).sort()
        : null,
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

      const isGarageOrStorage = negjiinTurul(unit) !== "Орон сууц";
      // Гараж B1-10 ба B2-10 нь өөр нэгж — давхрыг түлхүүрт оруулна.
      // Түлхүүрийг ХЭВШҮҮЛНЭ: «Гараж»/«Зогсоол», `B1`/`в1`, `40`/`040` нь
      // ижил нэгж тул өмнө нь нэг маягтаас давхар тоот гарч чаддаг байв.
      const key = negjiinTulkhuur({ ...unit, orts: isGarageOrStorage ? "1" : unit.orts });
      if (uniqueUnitKeys.has(key)) {
        newErrors.push(`units.${index}.duplicate`);
      } else {
        uniqueUnitKeys.add(key);
      }
      // Гараар бичсэн дугаар өөр хүнд идэвхтэй бүртгэлтэй эсэх
      if (
        isGarageOrStorage &&
        isTootOccupied(tootVal, unit.davkhar || "", negjiinTurul(unit) === "Гараж" ? "Зогсоол" : "Агуулах")
      ) {
        newErrors.push(`units.${index}.occupied`);
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

      /** «Гараж B1 давхрын 40 дугаар» — алдааг тодорхой нэгжээр нь нэрлэнэ. */
      const negjiinNer = (i: number) => {
        const u = units[i] || {};
        const t = negjiinTurul(u);
        const turulNer = t === "Орон сууц" ? "Тоот" : t;
        return `${turulNer}${u.davkhar ? ` ${u.davkhar} давхрын` : ""}${u.toot ? ` ${String(u.toot).trim()} дугаар` : ""}`;
      };

      // Эзэмшигчтэй дугаар — бөглөөгүй талбараас өөр төрлийн алдаа тул тусад нь.
      const ezemshigchtei = busadAldaa.filter((e) => e.endsWith(".occupied"));
      if (ezemshigchtei.length > 0) {
        const i = parseInt(ezemshigchtei[0].split(".")[1]);
        const u = units[i] || {};
        openErrorOverlay(
          `${negjiinNer(i)} ${ezemshigchiinDelgerengui(String(u.toot || "").trim(), u.davkhar || "")}-д идэвхтэй бүртгэлтэй. Сул дугаар сонгох эсвэл эхлээд тухайн эзэмшигчээс салгана уу.`,
        );
        return false;
      }

      const missingFields = busadAldaa
        .map((e) => {
          if (e.startsWith("units.")) {
            const parts = e.split(".");
            const i = parseInt(parts[1]);
            const field = parts[2];
            if (field === "duplicate")
              return `${negjiinNer(i)} хоёр удаа сонгогдсон — нэгийг нь хасна уу`;
            return `${negjiinNer(i)}: ${fieldNames[field] || field}`;
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

        const clientUnits = Array.isArray(newClient.units) ? newClient.units : [];
        for (const u of clientUnits) {
          const tVal = String(u.toot || "").trim();
          if (!tVal) continue;
          const pType: "Зогсоол" | "Агуулах" = u.turul === "Агуулах" ? "Агуулах" : "Зогсоол";
          if (isTootOccupied(tVal, u.davkhar || "", pType)) {
            const ezen = ezemshigchiinDelgerengui(tVal, u.davkhar || "", pType);
            openErrorOverlay(
              `${u.turul || "Гараж"}${u.davkhar ? ` ${u.davkhar} давхрын` : ""} ${tVal} дугаар ${ezen}-д идэвхтэй бүртгэлтэй байна. Сул дугаар сонгох эсвэл өмнөх эзэмшигчээс салгана уу.`
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
  const [mainUnits, setMainUnits] = React.useState<any[]>([]);
  const [garages, setGarages] = React.useState<any[]>([]);
  const [storages, setStorages] = React.useState<any[]>([]);

  const emptyMainUnit = () => ({
    orts: ortsOptions[0] || "1",
    davkhar: davkharOptions.find((d) => !/^B\d+$/i.test(d)) || davkharOptions[0] || "1",
    toot: "",
    ekhniiUldegdel: 0,
    tsahilgaaniiZaalt: 0,
    khonogoorBodokhEsekh: false,
    bodokhKhonog: 0,
  });
  const emptyGarage = () => ({ davkhar: "", toot: "", ekhniiUldegdel: 0, tsahilgaaniiZaalt: 0, khonogoorBodokhEsekh: false, bodokhKhonog: 0 });
  const emptyStorage = () => ({ davkhar: "", toot: "", ekhniiUldegdel: 0, tsahilgaaniiZaalt: 0, khonogoorBodokhEsekh: false, bodokhKhonog: 0 });

  // Main unit helpers
  const addMainUnit = () => {
    setMainUnits((prev) => [...prev, emptyMainUnit()]);
  };
  const removeMainUnit = (index: number) => {
    setMainUnits((prev) => { const n = [...prev]; n.splice(index, 1); return n; });
  };
  const updateMainUnitField = (index: number, field: string, value: any) => {
    setMainUnits((prev) => {
      const n = [...prev];
      n[index] = { ...n[index], [field]: value };
      return n;
    });
  };

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
  const getMainUnitFlatIndex = (mainIndex: number) => {
    return mainIndex;
  };
  const getGarageFlatIndex = (garageIndex: number) => {
    return mainUnits.length + garageIndex;
  };
  const getStorageFlatIndex = (storageIndex: number) => {
    return mainUnits.length + garages.length + storageIndex;
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
      // `negjiinTurul` — «Зогсоол» гэж хадгалсан гараж энд унаж, модал дээр
      // огт харагдахгүй, хадгалахад устдаг байв.
      const allMains = units.filter((u: any) => negjiinTurul(u) !== "Гараж" && negjiinTurul(u) !== "Агуулах");
      const allGarages = units.filter((u: any) => negjiinTurul(u) === "Гараж");
      const allStorages = units.filter((u: any) => negjiinTurul(u) === "Агуулах");

      setMainUnits(allMains.map((m: any) => ({ ...m, orts: m.orts || "1", turul: m.turul || "Тоот" })));
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
      
      const primary = allMains[0] || allGarages[0] || allStorages[0] || {};
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
    
    // Барилга/байгууллагын id нь ЗАСВАРТ хадгалагдана — backend нь алга бол
    // одоогийн барилгынхаар дүүргэдэг тул өөр барилгын тоот зөөгдөж, тоот
    // давхардах шалтгаан болдог байв.
    const kholboos = (u: any) => ({
      ...(u.barilgiinId ? { barilgiinId: u.barilgiinId } : {}),
      ...(u.baiguullagiinId ? { baiguullagiinId: u.baiguullagiinId } : {}),
    });
    mainUnits.forEach((m: any) => {
      activeUnits.push({
        orts: m.orts || "1",
        davkhar: m.davkhar || "",
        toot: m.toot || "",
        turul: m.turul || "Тоот",
        ...kholboos(m),
        ekhniiUldegdel: Number(m.ekhniiUldegdel || 0),
        tsahilgaaniiZaalt: Number(m.tsahilgaaniiZaalt || 0),
        khonogoorBodokhEsekh: !!m.khonogoorBodokhEsekh,
        bodokhKhonog: Number(m.bodokhKhonog || 0),
      });
    });
    garages.forEach((g: any) => {
      activeUnits.push({ orts: "1", davkhar: g.davkhar || "", toot: g.toot || "", turul: "Гараж",
        ...kholboos(g),
        ekhniiUldegdel: Number(g.ekhniiUldegdel || 0), tsahilgaaniiZaalt: Number(g.tsahilgaaniiZaalt || 0),
        khonogoorBodokhEsekh: !!g.khonogoorBodokhEsekh, bodokhKhonog: Number(g.bodokhKhonog || 0) });
    });
    storages.forEach((s: any) => {
      activeUnits.push({ orts: "1", davkhar: s.davkhar || "", toot: s.toot || "", turul: "Агуулах",
        ...kholboos(s),
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
  }, [mainUnits, garages, storages, show]);

  const additionalFloors = React.useMemo(() => {
    const filtered = davkharOptions.filter((d) => /^B\d+$/i.test(d));
    return filtered.length > 0 ? filtered : ["B1", "B2", "B3"];
  }, [davkharOptions]);

  const cleanFloorStr = (f: any) =>
    String(f || "")
      .replace(/\s*давхар\s*/gi, "")
      .replace(/^[вВ]/, "B")
      .replace(/^-/, "B")
      .replace(/^B-/, "B")
      .trim()
      .toUpperCase();

  const normalizeTootStr = (t: any) =>
    String(t || "")
      .trim()
      .toLowerCase()
      .replace(/^0+/, "");

  const matchesToot = (candidate: any, target: string) => {
    if (!candidate || !target) return false;
    const targetNorm = normalizeTootStr(target);
    const parts = String(candidate)
      .split(/[\s,;|]+/)
      .map(normalizeTootStr)
      .filter(Boolean);
    return parts.includes(targetNorm);
  };

  /**
   * Тухайн тоот/зогсоол/агуулахыг эзэмшиж буй этгээдийг олно
   * (currentResidents болон active contracts хоёуланг шалгана)
   */
  const findOccupant = React.useCallback(
    (tootVal: string, floorVal: string, propertyType: "Зогсоол" | "Агуулах") => {
      const uToot = String(tootVal || "").trim();
      if (!uToot) return null;
      const uFloorClean = cleanFloorStr(floorVal);

      // 1. Оршин суугчид болон харилцагчдын жагсаалтаас шалгах
      if (Array.isArray(currentResidents)) {
        for (const r of currentResidents) {
          if (editingClient && String(editingClient._id || "") === String(r._id || "")) {
            continue;
          }

          const existingUnits =
            Array.isArray(r.toots) && r.toots.length > 0
              ? r.toots
              : [{ orts: r.orts, davkhar: r.davkhar, toot: r.toot, turul: r.turul, linkedAptToot: r.linkedAptToot }];

          for (const rt of existingUnits) {
            // Төрлийг ХЭВШҮҮЛЖ харьцуулна — «Зогсоол» гэж, эсвэл төрөлгүй ч
            // B1 давхарт хадгалсан гараж нь өмнө нь "эзэнгүй" мэт харагдаж,
            // сул дугаар гэж дахин олгогдох шалтгаан болдог байв.
            const isTypeMatch =
              negjiinTurul(rt) ===
              (propertyType === "Агуулах" ? "Агуулах" : "Гараж");

            if (!isTypeMatch) continue;

            const tootMatch = matchesToot(rt.toot, uToot) || matchesToot(rt.linkedAptToot, uToot);
            if (!tootMatch) continue;

            const rtFloorClean = cleanFloorStr(rt.davkhar);
            const floorMatch = !uFloorClean || !rtFloorClean || uFloorClean === rtFloorClean;
            if (floorMatch) {
              return { person: r, unit: rt, source: "resident" };
            }
          }
        }
      }

      // 2. Идэвхтэй гэрээнүүдээс шалгах (contracts)
      if (Array.isArray(contracts)) {
        for (const c of contracts) {
          const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
          if (status === "Цуцалсан" || status === "Идэвхгүй") continue;

          if (editingClient && String(c.khariltsagchId || "") === String(editingClient._id || "")) {
            continue;
          }

          const isTypeMatch =
            negjiinTurul(c) ===
            (propertyType === "Агуулах" ? "Агуулах" : "Гараж");

          if (!isTypeMatch) continue;

          const tootMatch = matchesToot(c.toot, uToot) || matchesToot(c.linkedAptToot, uToot);
          if (!tootMatch) continue;

          const cFloorClean = cleanFloorStr(c.davkhar);
          const floorMatch = !uFloorClean || !cFloorClean || uFloorClean === cFloorClean;
          if (floorMatch) {
            return {
              person: {
                _id: c.orshinSuugchId || c.khariltsagchId,
                ner: c.ner || c.khariutsagchNer,
                ovog: c.ovog,
                utas: c.utas,
                toot: c.toot,
              },
              unit: c,
              source: "contract",
            };
          }
        }
      }

      return null;
    },
    [currentResidents, editingClient, contracts],
  );

  const isTootOccupied = React.useCallback(
    (tootVal: string, floorVal: string, propertyType: "Зогсоол" | "Агуулах") => {
      return Boolean(findOccupant(tootVal, floorVal, propertyType));
    },
    [findOccupant],
  );

  /**
   * Үндсэн тоот (орон сууц / оффис) өөр оршин суугч, харилцагч эсвэл идэвхтэй
   * гэрээнд эзэмшигдсэн эсэх. Мөн энэ модал дээр өөр мөрөнд сонгосон бол эзэмшигдсэн гэж үзнэ.
   */
  const isMainTootOccupied = React.useCallback(
    (tootVal: string, ortsVal: string, selfIdx: number) => {
      const uToot = String(tootVal || "").trim();
      if (!uToot) return false;
      const uOrts = String(ortsVal || "").trim();
      const ortsMatch = (o: any) => {
        const so = String(o || "").trim();
        return !uOrts || !so || so === uOrts;
      };

      if (Array.isArray(currentResidents)) {
        for (const r of currentResidents) {
          if (editingClient && String(editingClient._id || "") === String(r._id || "")) continue;
          const existingUnits =
            Array.isArray(r.toots) && r.toots.length > 0
              ? r.toots
              : [{ orts: r.orts, davkhar: r.davkhar, toot: r.toot, turul: r.turul }];
          for (const rt of existingUnits) {
            if (negjiinTurul(rt) !== "Орон сууц") continue;
            if (matchesToot(rt.toot, uToot) && ortsMatch(rt.orts)) return true;
          }
        }
      }

      if (Array.isArray(contracts)) {
        for (const c of contracts) {
          const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
          if (status === "Цуцалсан" || status === "Идэвхгүй") continue;
          if (editingClient && String(c.khariltsagchId || "") === String(editingClient._id || "")) continue;
          if (negjiinTurul(c) !== "Орон сууц") continue;
          if (matchesToot(c.toot, uToot) && ortsMatch(c.orts)) return true;
        }
      }

      // Энэ модал дээр өөр мөрөнд аль хэдийн сонгосон тоот
      return mainUnits.some(
        (m: any, i: number) =>
          i !== selfIdx &&
          String(m.toot || "").trim() === uToot &&
          ortsMatch(m.orts || "1"),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentResidents, editingClient, contracts, mainUnits],
  );

  /** Тоотыг эзэмшиж буй хүний нэр (өөр харилцагч/оршин суугч) — байхгүй бол null */
  const tootEzemshigch = React.useCallback(
    (tootVal: string, floorVal: string, propertyType: "Зогсоол" | "Агуулах"): string | null => {
      const occupant = findOccupant(tootVal, floorVal, propertyType);
      if (!occupant) return null;
      const r = occupant.person;
      const ner = [r?.ovog ? `${String(r.ovog).charAt(0)}.` : "", r?.ner || ""].filter(Boolean).join(" ");
      return ner || "эзэмшигчтэй";
    },
    [findOccupant],
  );

  /** Эзэмшигчийн дэлгэрэнгүй — «Б. Бат (302 тоот, 99112233)» */
  const ezemshigchiinDelgerengui = React.useCallback(
    (tootVal: string, floorVal: string, propertyType: "Зогсоол" | "Агуулах" = "Зогсоол"): string => {
      const occupant = findOccupant(tootVal, floorVal, propertyType);
      if (!occupant) return "өөр эзэмшигч";
      const r = occupant.person;
      const ner = [r.ovog ? `${String(r.ovog).charAt(0)}.` : "", r.ner || ""].filter(Boolean).join(" ") || "Нэргүй";
      const units = Array.isArray(r.toots) && r.toots.length ? r.toots : [r];
      const bair = units.find((u: any) => {
        const t = String(u?.turul || "").trim();
        return !t || t === "Орон сууц" || t === "Тоот";
      });
      const aptToot = bair?.toot || occupant.unit?.linkedAptToot;
      const utas = Array.isArray(r.utas) ? r.utas[0] : r.utas;
      const nemelt = [aptToot ? `${aptToot} тоот` : "", utas || ""].filter(Boolean).join(", ");
      return nemelt ? `«${ner}» (${nemelt})` : `«${ner}»`;
    },
    [findOccupant],
  );

  /** Дугаарын сонголтууд — сул нь эхэнд, эзэмшигчтэй нь нэртэйгээ доор */
  const dugaariinSongolt = (davkhar: string, turul: "Зогсоол" | "Агуулах") => {
    const jagsaalt = getTootOptions("", davkhar || "", turul).map((t) => {
      const ezen = tootEzemshigch(t, davkhar || "", turul);
      const turulNer = turul === "Зогсоол" ? "Гараж" : "Агуулах";
      return {
        value: t,
        label: ezen ? `${t}  ·  ${ezen}` : t,
        isOccupied: !!ezen,
        title: ezen ? `${t} — ${ezen} эзэмшдэг` : `${t} — сул`,
        occupiedNote: ezen
          ? `${turulNer} ${davkhar ? `${davkhar} давхрын ` : ""}${t} дугаар ${ezemshigchiinDelgerengui(t, davkhar || "", turul)}-д идэвхтэй бүртгэлтэй. Сул дугаар сонгох эсвэл эхлээд тухайн эзэмшигчээс салгана уу.`
          : undefined,
      };
    });
    return [...jagsaalt.filter((o) => !o.isOccupied), ...jagsaalt.filter((o) => o.isOccupied)];
  };

  // ── Ашиглалтын зардал ────────────────────────────────────────────────
  // Барилгын «харилцагч» зориулалттай зардлуудаас энэ харилцагчид аль нь
  // бодогдохыг сонгоно (`songosonZardluud`). Хэрэглэгч хөндөөгүй бол
  // талбар тодорхойгүй хэвээр үлдэж, backend анхны дүрмээрээ бодно.
  const { zardluud: barilgiinZardluud, isLoading: zardalAchaalj } =
    useAshiglaltiinZardluud({
      token: token || undefined,
      baiguullagiinId: baiguullaga?._id,
      barilgiinId: selectedBarilga?._id ?? null,
    });

  const khariltsagchiinZardluud = React.useMemo(
    () =>
      (barilgiinZardluud || []).filter(
        (z: any) => z?._id && z.zoriulalt === "khariltsagch",
      ),
    [barilgiinZardluud],
  );

  // Сонголт хийгээгүй үед backend харилцагчийн зориулалттай БҮХ зардлыг
  // тоотын төрлөөс үл хамааран бодно — анхны сонголт ч тэр.
  const anhniiSongolt = React.useMemo(
    () => khariltsagchiinZardluud.map((z: any) => String(z._id)),
    [khariltsagchiinZardluud],
  );

  const songosonZardluud: string[] = Array.isArray(newClient?.songosonZardluud)
    ? newClient.songosonZardluud.map(String)
    : anhniiSongolt;

  const zardalSongoyo = (id: string) => {
    const shine = songosonZardluud.includes(id)
      ? songosonZardluud.filter((x) => x !== id)
      : [...songosonZardluud, id];
    setNewClient((p: any) => ({ ...p, songosonZardluud: shine }));
  };

  const bukhZardalSongogdson =
    khariltsagchiinZardluud.length > 0 &&
    khariltsagchiinZardluud.every((z: any) =>
      songosonZardluud.includes(String(z._id)),
    );

  const bukhZardalSolio = () => {
    setNewClient((p: any) => ({
      ...p,
      songosonZardluud: bukhZardalSongogdson
        ? []
        : khariltsagchiinZardluud.map((z: any) => String(z._id)),
    }));
  };

  /** Сард бодогдох дүн — тогтмол нь `dun`-д, бусад нь `tariff`-д. */
  const zardliinDun = (z: any): number => {
    for (const utga of [z?.dun, z?.tariff]) {
      const n = Number(utga ?? 0);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  };
  const tooUnshigdakh = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const songosonNiitDun = khariltsagchiinZardluud
    .filter((z: any) => songosonZardluud.includes(String(z._id)) && !z.zaalt)
    .reduce((niit: number, z: any) => niit + zardliinDun(z), 0);

  const zardalTokhirgooNeey = () => {
    window.open("/tokhirgoo?tsonkh=tokhirgoo.ashiglaltiinZardal", "_blank");
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
          height: 40px !important;
          padding: 0 12px !important;
          font-size: 0.8125rem !important;
          border-radius: 10px !important;
          border: 1px solid #d1d5db !important;
          transition: all 0.2s ease !important;
          background: #ffffff !important;
          color: #111827 !important;
        }
        .modern-input.with-icon {
          padding-left: 36px !important;
        }
        .modern-input.pr-extra {
          padding-right: 32px !important;
        }
        .modern-textarea {
          line-height: 40px !important;
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
          height: 40px !important;
          padding: 0 !important;
          font-size: 0.8125rem !important;
          border-radius: 10px !important;
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
          font-size: 0.8125rem !important;
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
              className="relative z-[12001] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl p-0 shadow-2xl modal-surface modal-responsive modal-wide"
            >
              {/* Толгой */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex cursor-move select-none items-center justify-between gap-4 border-b border-[color:var(--surface-border)] px-6 py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-theme/10 text-brand">
                    <Users className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-[color:var(--panel-text)]">
                      {editingClient
                        ? "Харилцагчийн мэдээлэл засах"
                        : "Харилцагч бүртгэх"}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-[color:var(--muted-text)]">
                      Оффис түрээслэгч зэрэг оршин суугч биш харилцагчийг
                      бүртгэнэ.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={requestClose}
                  className="rounded-lg p-1.5 text-[color:var(--muted-text)] transition-all duration-200 hover:bg-[color:var(--surface-hover)] active:scale-95"
                  aria-label="Хаах"
                  title="Хаах"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={handleLocalSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
                  <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                    {/* ═══ Зүүн тал ═══ */}
                    <div className="space-y-5">
                      {/* Үндсэн мэдээлэл */}
                      <section className="rounded-2xl border border-[color:var(--surface-border)] p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-theme/10 text-brand">
                            <User className="h-5 w-5" />
                          </span>
                          <h3 className="text-base font-semibold text-[color:var(--panel-text)]">
                            Үндсэн мэдээлэл
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-4 sm:grid-cols-2">
                          {/* Овог */}
                          <div>
                            <label className="mb-1.5 block text-sm text-[color:var(--panel-text)]">
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
                              placeholder="Овог оруулах"
                            />
                          </div>

                          {/* Нэр */}
                          <div>
                            <label className="mb-1.5 block text-sm text-[color:var(--panel-text)]">
                              Нэр <span className="text-danger">*</span>
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
                              placeholder="Нэр оруулах"
                            />
                          </div>

                          {/* Утас */}
                          <div>
                            <label className="mb-1.5 block text-sm text-[color:var(--panel-text)]">
                              Утас
                            </label>
                            <div className="relative">
                              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-text)]" />
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
                                className={`modern-input with-icon w-full ${errors.includes("utas") ? "input-error" : ""}`}
                                placeholder="Утасны дугаар"
                                maxLength={8}
                              />
                            </div>
                          </div>

                          {/* Машины дугаар — ЭХНИЙ мөрд «+», нэмсэн мөрүүдэд «−» */}
                          <div>
                            <label className="mb-1.5 block text-sm text-[color:var(--panel-text)]">
                              Машины дугаар
                            </label>
                            <div className="space-y-2">
                              {mashinuud.map((dugaar, i) => (
                                <div key={i} className="flex items-stretch gap-2">
                                  <div className="relative min-w-0 flex-1">
                                    <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-text)]" />
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
                                      className={`modern-input with-icon w-full ${
                                        errors.includes(`mashin.${i}`)
                                          ? "input-error"
                                          : ""
                                      }`}
                                      placeholder="Машины дугаар"
                                      maxLength={7}
                                    />
                                  </div>
                                  {i === 0 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMashinuud((prev) => [...prev, ""])
                                      }
                                      disabled={khyazgaartKhurev}
                                      className="grid w-10 shrink-0 place-items-center rounded-[10px] border border-theme/30 bg-theme/10 text-brand transition-colors hover:bg-theme/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-theme/10"
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
                                      className="grid w-10 shrink-0 place-items-center rounded-[10px] border border-danger/30 bg-danger/10 text-danger transition-colors hover:bg-danger/20"
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

                          {/* Тайлбар */}
                          <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm text-[color:var(--panel-text)]">
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
                      </section>

                      {/* Тоот / Оффис / Талбай */}
                      <section className="rounded-2xl border border-[color:var(--surface-border)] p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-theme/10 text-brand">
                              <Building2 className="h-5 w-5" />
                            </span>
                            <h3 className="text-base font-semibold text-[color:var(--panel-text)]">
                              Тоот / Оффис / Талбай
                              {mainUnits.length > 1 && (
                                <span className="ml-1 font-normal text-[color:var(--muted-text)]">({mainUnits.length})</span>
                              )}
                            </h3>
                          </div>
                          {mainUnits.length > 0 && (
                            <button
                              type="button"
                              onClick={addMainUnit}
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                            >
                              <Plus className="h-3.5 w-3.5" /> Нэмэх
                            </button>
                          )}
                        </div>

                        {mainUnits.length === 0 ? (
                          <button
                            type="button"
                            onClick={addMainUnit}
                            className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-dashed border-[color:var(--surface-border)] px-3 text-sm text-[color:var(--muted-text)] transition-colors hover:border-theme/50 hover:text-brand"
                          >
                            <Building2 className="h-4 w-4" />
                            Тоот / оффис нэмэх
                            <Plus className="ml-auto h-4 w-4" />
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {mainUnits.map((mUnit: any, mIdx: number) => {
                              const mFlatIdx = getMainUnitFlatIndex(mIdx);
                              const oOptions = (ortsOptions && ortsOptions.length > 0 ? ortsOptions : ["1"]).map((o) => ({
                                value: o,
                                label: `${o}-р орц`,
                              }));
                              const dOptions = (davkharOptions && davkharOptions.length > 0 ? davkharOptions : ["1"]).map((d) => ({
                                value: d,
                                label: `${d} давхар`,
                              }));
                              // Зөвхөн сул тоотыг харуулна (одоо сонгосон утгыг хадгална)
                              const tOptions = getTootOptions
                                ? getTootOptions(mUnit.orts || "1", mUnit.davkhar || "", "Тоот")
                                    .filter(
                                      (t) =>
                                        String(t).trim() === String(mUnit.toot || "").trim() ||
                                        !isMainTootOccupied(t, mUnit.orts || "1", mIdx),
                                    )
                                    .map((t) => ({
                                      value: t,
                                      label: `${t} тоот`,
                                    }))
                                : [];
                              return (
                                <div key={`main-${mIdx}`} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                                  <div className="tusgai-wrapper flex min-w-[90px] flex-1 items-center">
                                    <TusgaiZagvar
                                      value={mUnit.orts || "1"}
                                      onChange={(val: string) => updateMainUnitField(mIdx, "orts", val)}
                                      options={oOptions}
                                      className="h-full w-full"
                                      placeholder="Орц"
                                    />
                                  </div>
                                  <div className={`tusgai-wrapper flex min-w-[100px] flex-1 items-center ${errors.includes(`units.${mFlatIdx}.davkhar`) ? "input-error" : ""}`}>
                                    <TusgaiZagvar
                                      value={mUnit.davkhar || ""}
                                      onChange={(val: string) => updateMainUnitField(mIdx, "davkhar", val)}
                                      options={dOptions}
                                      className="h-full w-full"
                                      placeholder="Давхар"
                                    />
                                  </div>
                                  <div className={`tusgai-wrapper flex min-w-[110px] flex-[1.5] items-center ${errors.includes(`units.${mFlatIdx}.toot`) ? "input-error" : ""}`}>
                                    <TusgaiZagvar
                                      value={mUnit.toot || ""}
                                      onChange={(val: string) => updateMainUnitField(mIdx, "toot", val)}
                                      options={tOptions}
                                      className="h-full w-full"
                                      placeholder="Тоот дугаар"
                                      allowCustomInput={true}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeMainUnit(mIdx)}
                                    title="Хасах"
                                    aria-label="Хасах"
                                    className="shrink-0 rounded-md p-1 text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      {/* Гараж / Агуулах */}
                      <section className="rounded-2xl border border-[color:var(--surface-border)] p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-theme/10 text-brand">
                            <Building2 className="h-5 w-5" />
                          </span>
                          <h3 className="text-base font-semibold text-[color:var(--panel-text)]">
                            Гараж/Агуулах
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                          {/* Гараж */}
                          <div>
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="text-sm text-[color:var(--panel-text)]">
                                Гаражын тоот
                                {garages.length > 1 && (
                                  <span className="ml-1 text-[color:var(--muted-text)]">({garages.length})</span>
                                )}
                              </span>
                              {garages.length > 0 && (
                                <button
                                  type="button"
                                  onClick={addGarage}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Нэмэх
                                </button>
                              )}
                            </div>
                            {garages.length === 0 ? (
                              <button
                                type="button"
                                onClick={addGarage}
                                className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-dashed border-[color:var(--surface-border)] px-3 text-sm text-[color:var(--muted-text)] transition-colors hover:border-theme/50 hover:text-brand"
                              >
                                <Car className="h-4 w-4" />
                                Гаражын тоот сонгох
                                <Plus className="ml-auto h-4 w-4" />
                              </button>
                            ) : (
                              <div className="space-y-2">
                                {garages.map((garage: any, gIdx: number) => {
                                  const gFlatIdx = getGarageFlatIndex(gIdx);
                                  return (
                                    <div key={`garage-${gIdx}`} className="flex items-center gap-2">
                                      <div className={`tusgai-wrapper flex w-[38%] shrink-0 items-center ${errors.includes(`units.${gFlatIdx}.davkhar`) ? "input-error" : ""}`}>
                                        <TusgaiZagvar value={garage.davkhar || ""} onChange={(val: string) => updateGarageField(gIdx, "davkhar", val)}
                                          options={additionalFloors.map((d) => ({ value: d, label: d }))} className="h-full w-full" placeholder="Давхар" />
                                      </div>
                                      <div className={`tusgai-wrapper flex min-w-0 flex-1 items-center ${errors.includes(`units.${gFlatIdx}.toot`) ? "input-error" : ""}`}>
                                        <TusgaiZagvar value={garage.toot || ""} onChange={(val: string) => updateGarageField(gIdx, "toot", val)}
                                          options={dugaariinSongolt(garage.davkhar || "", "Зогсоол")} className="h-full w-full" placeholder="Тоот" disabled={!garage.davkhar} allowCustomInput={true} blockOccupied />
                                      </div>
                                      <button type="button" onClick={() => removeGarage(gIdx)}
                                        title="Хасах" aria-label="Хасах"
                                        className="shrink-0 rounded-md p-1 text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Агуулах */}
                          <div>
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="text-sm text-[color:var(--panel-text)]">
                                Агуулахын тоот
                                {storages.length > 1 && (
                                  <span className="ml-1 text-[color:var(--muted-text)]">({storages.length})</span>
                                )}
                              </span>
                              {storages.length > 0 && (
                                <button
                                  type="button"
                                  onClick={addStorage}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Нэмэх
                                </button>
                              )}
                            </div>
                            {storages.length === 0 ? (
                              <button
                                type="button"
                                onClick={addStorage}
                                className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-dashed border-[color:var(--surface-border)] px-3 text-sm text-[color:var(--muted-text)] transition-colors hover:border-theme/50 hover:text-brand"
                              >
                                <Warehouse className="h-4 w-4" />
                                Агуулахын тоот сонгох
                                <Plus className="ml-auto h-4 w-4" />
                              </button>
                            ) : (
                              <div className="space-y-2">
                                {storages.map((storage: any, sIdx: number) => {
                                  const sFlatIdx = getStorageFlatIndex(sIdx);
                                  return (
                                    <div key={`storage-${sIdx}`} className="flex items-center gap-2">
                                      <div className={`tusgai-wrapper flex w-[38%] shrink-0 items-center ${errors.includes(`units.${sFlatIdx}.davkhar`) ? "input-error" : ""}`}>
                                        <TusgaiZagvar value={storage.davkhar || ""} onChange={(val: string) => updateStorageField(sIdx, "davkhar", val)}
                                          options={additionalFloors.map((d) => ({ value: d, label: d }))} className="h-full w-full" placeholder="Давхар" />
                                      </div>
                                      <div className={`tusgai-wrapper flex min-w-0 flex-1 items-center ${errors.includes(`units.${sFlatIdx}.toot`) ? "input-error" : ""}`}>
                                        <TusgaiZagvar value={storage.toot || ""} onChange={(val: string) => updateStorageField(sIdx, "toot", val)}
                                          options={dugaariinSongolt(storage.davkhar || "", "Агуулах")} className="h-full w-full" placeholder="Тоот" disabled={!storage.davkhar} allowCustomInput={true} blockOccupied />
                                      </div>
                                      <button type="button" onClick={() => removeStorage(sIdx)}
                                        title="Хасах" aria-label="Хасах"
                                        className="shrink-0 rounded-md p-1 text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Гадна зогсоол — гараж/агуулахгүй ч хадгалж болно.
                              Тоотгүй бол `syncResidentContracts` гэрээ үүсгэхгүй. */}
                          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-3 py-2.5 transition-colors hover:border-theme/40 sm:col-span-2">
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
                              <span className="block text-sm text-[color:var(--panel-text)]">
                                Гадна зогсоол
                              </span>
                              <span className="mt-0.5 block text-xs text-[color:var(--muted-text)]">
                                Гараж / агуулахгүйгээр хадгалах, эсвэл давхар нэмж болно
                              </span>
                            </span>
                          </label>
                        </div>
                      </section>
                    </div>

                    {/* ═══ Баруун тал: Ашиглалтын зардал ═══ */}
                    <aside className="space-y-4 rounded-2xl border border-theme/15 bg-theme/5 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-theme/10 text-brand">
                            <FileText className="h-5 w-5" />
                          </span>
                          <h3 className="truncate text-base font-semibold text-[color:var(--panel-text)]">
                            Ашиглалтын зардал
                          </h3>
                          <span
                            className="shrink-0 text-[color:var(--muted-text)]"
                            title="Барилгын «Харилцагч» зориулалттай ашиглалтын зардлуудаас энэ харилцагчид сар бүр бодогдохыг сонгоно. Зардлыг Тохиргоо → Ашиглалтын зардал хэсэгт бүртгэнэ."
                          >
                            <HelpCircle className="h-4 w-4" />
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={bukhZardalSongogdson}
                          aria-label="Бүх зардлыг сонгох"
                          title={bukhZardalSongogdson ? "Бүгдийг хасах" : "Бүгдийг сонгох"}
                          onClick={bukhZardalSolio}
                          disabled={khariltsagchiinZardluud.length === 0}
                          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 ${
                            bukhZardalSongogdson ? "bg-theme" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full !bg-white shadow transition-all duration-200 ease-in-out ${
                              bukhZardalSongogdson ? "left-[22px]" : "left-0.5"
                            }`}
                            style={{ backgroundColor: "white" }}
                          />
                        </button>
                      </div>

                      <p className="rounded-xl bg-theme/10 px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        Сонгосон зардлууд энэ харилцагчийн гэрээнд сар бүр
                        бодогдож, нэхэмжлэхэд орно.
                      </p>

                      <button
                        type="button"
                        onClick={zardalTokhirgooNeey}
                        className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-4 py-3 text-left text-sm font-medium text-[color:var(--panel-text)] transition-colors hover:border-theme/40"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-theme/10 text-brand">
                          <Plus className="h-5 w-5" />
                        </span>
                        <span className="flex-1">Ашиглалтын зардал бүртгэх</span>
                        <ChevronRight className="h-4 w-4 text-[color:var(--muted-text)]" />
                      </button>

                      <div className="flex items-center justify-between pt-1">
                        <h4 className="text-sm font-semibold text-[color:var(--panel-text)]">
                          Бодогдох зардлууд
                        </h4>
                        <span className="text-sm font-medium text-brand">
                          {songosonZardluud.filter((id) =>
                            khariltsagchiinZardluud.some((z: any) => String(z._id) === id),
                          ).length}{" "}
                          / {khariltsagchiinZardluud.length} сонгосон
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
                        <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-3 border-b border-[color:var(--surface-border)] px-4 py-2.5 text-xs text-[color:var(--muted-text)]">
                          <span />
                          <span>Зардлын нэр</span>
                          <span className="text-right">Дүн</span>
                        </div>

                        {zardalAchaalj ? (
                          <div className="px-4 py-6 text-center text-sm text-[color:var(--muted-text)]">
                            Ачаалж байна...
                          </div>
                        ) : khariltsagchiinZardluud.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-[color:var(--muted-text)]">
                            Харилцагчийн зардал бүртгээгүй байна
                          </div>
                        ) : (
                          <ul className="custom-scrollbar max-h-72 overflow-y-auto">
                            {khariltsagchiinZardluud.map((z: any) => {
                              const id = String(z._id);
                              const songoson = songosonZardluud.includes(id);
                              return (
                                <li key={id}>
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={songoson}
                                    onClick={() => zardalSongoyo(id)}
                                    className="grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--surface-border)] px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-[color:var(--surface-hover)]"
                                  >
                                    <span
                                      className={`grid h-5 w-5 place-items-center rounded-md border transition-colors ${
                                        songoson
                                          ? "border-transparent bg-theme"
                                          : "border-slate-300 dark:border-slate-600"
                                      }`}
                                    >
                                      {songoson && (
                                        <Check
                                          className="h-3.5 w-3.5 !text-white"
                                          strokeWidth={3}
                                          style={{ color: "white" }}
                                        />
                                      )}
                                    </span>
                                    <span className="min-w-0">
                                      <span className={`block truncate ${songoson ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"}`}>
                                        {z.ner}
                                      </span>
                                      {z.zardliinTurul && (
                                        <span className="block truncate text-xs text-[color:var(--muted-text)]">
                                          {z.zardliinTurul}
                                        </span>
                                      )}
                                    </span>
                                    <span className={`text-right tabular-nums ${songoson ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"}`}>
                                      {z.zaalt ? "Заалтаар" : tooUnshigdakh(zardliinDun(z))}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {khariltsagchiinZardluud.length > 0 && (
                          <div className="flex items-center justify-between border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-4 py-2.5 text-sm">
                            <span className="text-[color:var(--muted-text)]">Сарын нийт</span>
                            <span className="font-semibold tabular-nums text-[color:var(--panel-text)]">
                              {tooUnshigdakh(songosonNiitDun)} ₮
                            </span>
                          </div>
                        )}
                      </div>
                    </aside>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[color:var(--surface-border)] px-6 py-4">
                  <Button
                    type="button"
                    onClick={requestClose}
                    variant="secondary"
                    size="md"
                    className="min-w-[110px]"
                  >
                    Болих
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="min-w-[200px]"
                    data-modal-primary
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Түр хүлээнэ үү..." : "Хадгалах"}
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
