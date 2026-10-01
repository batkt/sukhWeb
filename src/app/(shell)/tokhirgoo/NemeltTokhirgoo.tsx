"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  NumberInput as MNumberInput,
  Button as MButton,
  TextInput as MTextInput,
} from "@mantine/core";
import { useAuth } from "@/lib/useAuth";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { fetchWithDomainFallback } from "@/lib/uilchilgee";
import { useBuilding } from "@/context/BuildingContext";
import { useSpinner } from "@/context/SpinnerContext";
import {
  Trash2,
  Coins,
  CircleDollarSign,
  FileText,
  Zap,
  Calculator,
  Building2,
  Car,
  Warehouse,
  CalendarClock,
  DoorOpen,
  CarFront,
  UserPlus,
  ArrowUpDown,
  Users,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import deleteMethod from "../../../../tools/function/deleteMethod";
import createMethod from "../../../../tools/function/createMethod";
import updateMethod from "../../../../tools/function/updateMethod";
import Button from "@/components/ui/Button";
import {
  SettingsCard,
  SettingsItem,
  SettingsField,
  Switch,
} from "./SettingsRow";

/**
 * kheseg="undsen"  — Тохиргоо → Нэмэлт: нэхэмжлэх, гараж/агуулах, байр.
 * kheseg="zogsool" — Тохиргоо → Зогсоол → «Зочин ба машин» таб: хаалт нээх
 *                    эрх, машины хязгаар, зочин.
 * Хоёр хэсэг ижил өгөгдөл, хадгалах логиктой тул нэг компонент.
 */
export default function NemeltTokhirgoo({
  kheseg = "undsen",
}: { kheseg?: "undsen" | "zogsool" } = {}) {
  const { token, ajiltan, barilgiinId, baiguullaga, baiguullagaMutate } =
    useAuth();
  const { selectedBuildingId } = useBuilding();
  const { showSpinner, hideSpinner } = useSpinner();

  const lastInitializedKeyRef = useRef<string>("");

  // Хадгалах үед гарсан алдааг тоолно — алдаа гарсан бол «хадгалагдлаа» гэж
  // хуурамчаар мэдэгдэхгүй.
  const aldaaToo = useRef(0);
  const aldaaGargay = (zurvas: string) => {
    aldaaToo.current += 1;
    openErrorOverlay(zurvas);
  };

  /**
   * Хадгалсан (серверийн) утгууд — өөрчлөлтийг илрүүлэх суурь.
   * Ачаалагч бүр өөрийн бүлгийг («invoice», «lift», «org») тэмдэглэхэд
   * дараагийн рендер дээр тухайн бүлгийн одоогийн утгыг суурь болгоно.
   */
  const [suuri, setSuuri] = useState<Record<string, unknown>>({});
  // Бүлэг → тэмдгийн дугаар. Ачаалагч утгаа setState хийсэн рендер нь
  // ЭНЭ дугаартай болсон үед л суурийг авна — эс бөгөөс ижил effect-ийн
  // давалгаанд хуучин (анхдагч) утгыг суурь болгож, бүх тохиргоо
  // «Өөрчлөгдсөн» гэж харагддаг байв.
  const khuleegdejBuiBuleg = useRef<Map<string, number>>(new Map());
  const temdegRef = useRef(0);
  const [suuriTemdeg, setSuuriTemdeg] = useState(0);
  const suuriTemdeglekh = (buleg: string) => {
    temdegRef.current += 1;
    khuleegdejBuiBuleg.current.set(buleg, temdegRef.current);
    setSuuriTemdeg(temdegRef.current);
  };

  // Invoice states
  const [invoiceDay, setInvoiceDay] = useState<number | null>(null);
  const [invoiceActive, setInvoiceActive] = useState<boolean>(true);
  const [invoiceScheduleId, setInvoiceScheduleId] = useState<string | null>(
    null,
  );

  // Lift states
  const [liftEnabled, setLiftEnabled] = useState<boolean>(false);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);
  const [liftBulkInput, setLiftBulkInput] = useState<string>("");
  const [liftShalgayaId, setLiftShalgayaId] = useState<string | null>(null);

  // Guest settings states
  const [guestConfigEnabled, setGuestConfigEnabled] = useState<boolean>(false);
  const [guestNotes, setGuestNotes] = useState<any[]>([]);
  const [guestLimit, setGuestLimit] = useState<number | string>("");
  const [guestFreeMinutes, setGuestFreeMinutes] = useState<number | string>("");
  // Нэг оршин суугч/харилцагч дээр бүртгэж болох машины дээд тоо.
  // Байгууллага/барилгын бүх оршин суугчид нэг ижил хамаарна.
  const [residentCarLimit, setResidentCarLimit] = useState<number | string>(1);
  /** Харилцагчийн хязгаар — оршин суугчаас ТУСДАА. */
  const [clientCarLimit, setClientCarLimit] = useState<number | string>(1);
  // Зочны зогсоолын төлбөрийг оршин суугчийн нэхэмжлэхэд бичих боломжтой
  // эсэх. Унтраалттай бол апп дээр "Би даана" сонголт харагдахгүй.
  const [guestInvoiceEnabled, setGuestInvoiceEnabled] =
    useState<boolean>(false);
  const [guestNote, setGuestNote] = useState<string>("");
  const [guestFrequencyType, setGuestFrequencyType] =
    useState<string>("saraar");
  const [guestFrequencyValue, setGuestFrequencyValue] = useState<
    number | string
  >("");

  // Resident Gate Open state
  const [residentGateOpenEnabled, setResidentGateOpenEnabled] = useState<boolean>(false);
  /**
   * Оршин суугч гэр бүлийн гишүүн урих боломжтой эсэх.
   * Тохируулаагүй бол ЗӨВШӨӨРНӨ — backend-ийн үндсэн зан төлөвтэй ижил.
   */
  const [gerBuliinGishuunEnabled, setGerBuliinGishuunEnabled] =
    useState<boolean>(true);

  // Цахилгааны тооцооны горим.
  // true  - тоолуурын заалт оруулж, систем кВт тарифаар бодно.
  // false - хэрэглэгч эцсийн дүнг Excel-ээр шууд оруулах ба тэр дүн шууд
  //         "Цахилгаан" төлбөр болно (систем юу ч бодохгүй).
  const [zaaltaarBodokh, setZaaltaarBodokh] = useState<boolean>(true);

  // Calculation states
  const [calculationEnabled, setCalculationEnabled] = useState<boolean>(false);
  const [calculationMethod, setCalculationMethod] = useState<string>("Хуанли");
  const [fixedDayCount, setFixedDayCount] = useState<number | string>(30);

  // Garage payment states
  const [garagePaymentEnabled, setGaragePaymentEnabled] =
    useState<boolean>(false);
  const [garagePaymentMethod, setGaragePaymentMethod] =
    useState<string>("Тогтмол");
  const [garagePaymentValue, setGaragePaymentValue] = useState<number | string>(
    "",
  );

  // Storage payment states
  const [storagePaymentEnabled, setStoragePaymentEnabled] =
    useState<boolean>(false);
  const [storagePaymentMethod, setStoragePaymentMethod] =
    useState<string>("Тогтмол");
  const [storagePaymentValue, setStoragePaymentValue] = useState<number | string>(
    "",
  );
  const fetchInvoiceSchedule = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId || null;
      const url = effectiveBarilgiinId
        ? `/nekhemjlekhCron/${ajiltan.baiguullagiinId}?barilgiinId=${effectiveBarilgiinId}`
        : `/nekhemjlekhCron/${ajiltan.baiguullagiinId}`;

      const response = await fetchWithDomainFallback(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();

        if (
          result.success &&
          result.data &&
          Array.isArray(result.data) &&
          result.data.length > 0
        ) {
          const latestSchedule = result.data[result.data.length - 1];

          if (latestSchedule.nekhemjlekhUusgekhOgnoo !== undefined) {
            setInvoiceDay(latestSchedule.nekhemjlekhUusgekhOgnoo);
            setInvoiceActive(latestSchedule.idevkhitei ?? true);
            setInvoiceScheduleId(latestSchedule._id);
            suuriTemdeglekh("invoice");
            return;
          }
        }
      }

      setInvoiceDay(null);
      setInvoiceActive(true);
      setInvoiceScheduleId(null);
      suuriTemdeglekh("invoice");
    } catch (error) {
      setInvoiceDay(null);
      setInvoiceActive(true);
      setInvoiceScheduleId(null);
      suuriTemdeglekh("invoice");
    }
  };

  const saveInvoiceSchedule = async (overrideActive?: boolean) => {
    const isOverrideBool = typeof overrideActive === "boolean";
    const isActive = isOverrideBool ? overrideActive : invoiceActive;
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }
    if (isActive && (!invoiceDay || invoiceDay < 1 || invoiceDay > 31)) {
      aldaaGargay("Огноог 1-31 хооронд сонгоно уу");
      return;
    }

    showSpinner();
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId || null;

      const res = await fetchWithDomainFallback(`/nekhemjlekhCron`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baiguullagiinId: ajiltan?.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
          nekhemjlekhUusgekhOgnoo: invoiceDay,
          idevkhitei: isActive,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      const data = result.data || result;

      if (data._id) {
        setInvoiceScheduleId(data._id);
      }

      amjilt("Нэхэмжлэх илгээх тохиргоог хадгаллаа");
      await fetchInvoiceSchedule();
    } catch (e) {
      aldaaGargay("Нэхэмжлэх тохиргоо илгээхэд алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  // Lift functions
  const fetchLiftFloors = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    try {
      const resp = await uilchilgee(token).get(`/liftShalgaya`, {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 100,
        },
      });
      const data = resp.data;
      const list = Array.isArray(data?.jagsaalt) ? data.jagsaalt : [];

      const toStr = (v: any) => (v == null ? "" : String(v));
      const branchMatches = list.filter(
        (x: any) =>
          toStr(x?.barilgiinId) === toStr(selectedBuildingId || barilgiinId),
      );
      const pickLatest = (arr: any[]) =>
        [...arr].sort(
          (a, b) =>
            new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
            new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
        )[0];

      let chosen = branchMatches.length > 0 ? pickLatest(branchMatches) : null;
      if (!chosen) {
        const orgDefaults = list.filter(
          (x: any) => x?.barilgiinId == null || toStr(x.barilgiinId) === "",
        );
        chosen =
          orgDefaults.length > 0 ? pickLatest(orgDefaults) : pickLatest(list);
      }

      const floors = Array.isArray(chosen?.choloolugdokhDavkhar)
        ? chosen.choloolugdokhDavkhar
          .map((f: any) => String(f).trim())
          .filter(Boolean)
        : [];

      if (!floors || floors.length === 0) {
        setLiftBulkInput("");
        setLiftEnabled(false);
        setLiftFloors([]);
        suuriTemdeglekh("lift");
        return;
      }

      const sortedFloors = toUniqueSorted(floors);
      setLiftBulkInput(sortedFloors.join(","));
      setLiftFloors(sortedFloors);
      setLiftShalgayaId(chosen?._id ?? null);
      setLiftEnabled(true);
      suuriTemdeglekh("lift");
    } catch (error) {
      setLiftBulkInput("");
      setLiftEnabled(false);
      setLiftFloors([]);
      setLiftShalgayaId(null);
      suuriTemdeglekh("lift");
    }
  };

  const saveLiftSettings = async (
    floorsOrMax: string[] | number | null,
    skipFetch = false,
  ) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }

    const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
    if (!effectiveBarilgiinId) {
      aldaaGargay("Барилга сонгоогүй байна");
      return;
    }

    showSpinner();

    try {
      let floors: string[] = [];
      if (Array.isArray(floorsOrMax)) {
        floors = toUniqueSorted(floorsOrMax);
      } else if (typeof floorsOrMax === "number" && floorsOrMax > 0) {
        floors = Array.from({ length: floorsOrMax }, (_, i) => String(i + 1));
      } else {
        floors = [];
      }

      const payload: any = {
        choloolugdokhDavkhar: floors,
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: effectiveBarilgiinId,
      };

      await uilchilgee(token).post(`/liftShalgaya`, payload);

      if (floors.length > 0) {
        amjilt(`Лифт ${floors.join(",")} давхарт тохируулагдлаа`);
      } else {
        amjilt("Лифт хөнгөлөлтийг идэвхгүй болголоо");
      }

      if (!skipFetch) {
        await fetchLiftFloors();
      }
    } catch (error) {
      aldaaGargay("Лифт тохиргоо хадгалах үед алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    if (token && ajiltan?.baiguullagiinId) {
      fetchLiftFloors();
      fetchInvoiceSchedule();
    }
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId]);

  // Reactive Effect for Guest Settings
  useEffect(() => {
    const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
    if (!baiguullaga) {
      return;
    }

    const currentKey = `${baiguullaga._id || ""}-${effectiveBarilgiinId || ""}`;
    if (lastInitializedKeyRef.current === currentKey) {
      return;
    }
    lastInitializedKeyRef.current = currentKey;

    let target: any = baiguullaga;
    let syncSource = "org-level";

    if (effectiveBarilgiinId && baiguullaga.barilguud) {
      const b = baiguullaga.barilguud.find((x: any) => {
        const xId = x._id || x.id;
        return String(xId).trim() === String(effectiveBarilgiinId).trim();
      });
      if (b) {
        target = b;
        syncSource = "building-level";
      }
    }

    const tok = (target.tokhirgoo || {}) as any;
    // Priority 1: target.tokhirgoo.zochinTokhirgoo (schema standard)
    const zt = tok.zochinTokhirgoo || {};
    // Priority 2: target.zochinTokhirgoo (legacy)
    const rootZt = (target as any).zochinTokhirgoo || {};

    // Fallback Org Level
    const orgTok = (baiguullaga.tokhirgoo || {}) as any;
    const orgZt = (orgTok.zochinTokhirgoo ||
      (baiguullaga as any).zochinTokhirgoo ||
      {}) as any;

    const find = (field: string, def: any = "") => {
      // 0. Priority for billing calculation fields (root tokhirgoo)
      if (["bodokhArgaEnabled", "bodokhArga", "bodokhKhonog"].includes(field)) {
        if (tok[field] !== undefined && tok[field] !== null) return tok[field];
      }

      // 1. Check schema standard: target.tokhirgoo.zochinTokhirgoo
      if (zt[field] !== undefined && zt[field] !== null) return zt[field];
      // 2. Check root zochinTokhirgoo
      if (rootZt[field] !== undefined && rootZt[field] !== null)
        return rootZt[field];
      // 3. Check target.tokhirgoo root (legacy)
      if (tok[field] !== undefined && tok[field] !== null) return tok[field];
      // 4. Check target root
      if (target[field] !== undefined && target[field] !== null)
        return target[field];

      // Final Fallback to Org level (if syncing at building level)
      if (syncSource === "building-level") {
        const b = baiguullaga as any;
        if (orgZt[field] !== undefined && orgZt[field] !== null)
          return orgZt[field];
        if (orgTok[field] !== undefined && orgTok[field] !== null)
          return orgTok[field];
        if (b[field] !== undefined && b[field] !== null) return b[field];
      }

      return def;
    };

    const isEnabled = !!find("zochinUrikhEsekh", false);

    setGuestConfigEnabled(isEnabled);
    setGuestLimit(find("zochinErkhiinToo", ""));
    setGuestFreeMinutes(find("zochinTusBurUneguiMinut", ""));
    // Тохируулаагүй бол 1 — backend-ийн үндсэн зан төлөвтэй ижил.
    setResidentCarLimit(find("orshinSuugchMashiniiLimit", 1));
    // Харилцагчийнх тохируулаагүй бол оршин суугчийнхаар харуулна —
    // backend ч ийм нөхөлт хийдэг тул дэлгэц нь үнэнийг харуулна.
    setClientCarLimit(
      find(
        "khariltsagchMashiniiLimit",
        find("orshinSuugchMashiniiLimit", 1),
      ),
    );
    setGuestInvoiceEnabled(find("zochinNekhemjlekhEsekh", false) === true);
    setGuestNote(find("zochinTailbar", ""));
    setGuestFrequencyType(find("davtamjiinTurul", "saraar"));
    setGuestFrequencyValue(find("davtamjUtga", ""));

    setCalculationMethod(find("bodokhArga", "Хуанли"));
    setFixedDayCount(find("bodokhKhonog", 30));
    setCalculationEnabled(!!find("bodokhArgaEnabled", false));

    setGaragePaymentMethod(find("garsiinTolborArga", "Тогтмол"));
    setGaragePaymentValue(find("garsiinTolborUtga", ""));
    setGaragePaymentEnabled(!!find("garsiinTolborEnabled", false));

    setStoragePaymentMethod(find("aguulakhTolborArga", "Тогтмол"));
    setStoragePaymentValue(find("aguulakhTolborUtga", ""));
    setStoragePaymentEnabled(!!find("aguulakhTolborEnabled", false));

    setResidentGateOpenEnabled(!!find("orshinSuugchKhaalgaNeehEsekh", false));
    setGerBuliinGishuunEnabled(find("gerBuliinGishuunEsekh", true) !== false);

    // Тодорхойгүй бол хуучин зан төлөв — заалтаар бодно.
    setZaaltaarBodokh(find("zaaltaarTsakhilgaanBodokhEsekh", true) !== false);
    suuriTemdeglekh("org");
  }, [baiguullaga, selectedBuildingId, barilgiinId]);

  const fetchGuestSettings = async () => {
    // legacy fetcher removed, now handled by the reactive effect above
    await baiguullagaMutate();
  };

  /**
   * `zochinTokhirgoo`-ийн өгсөн талбаруудыг байгууллага (эсвэл сонгосон
   * барилга) дээр хадгална.
   *
   * ЧУХАЛ: обьектыг бүхэлд нь дарж бичихгүй, байгаа тохиргоо дээрээ нэмнэ.
   * Өмнө нь бүтнээр дарж бичдэг тул жишээ нь машины бүртгэлийн хязгаар
   * (`orshinSuugchMashiniiLimit`) нь зочны тохиргоо хадгалах товч дарах
   * бүрд чимээгүй тэглэгддэг байв.
   */
  const zochinTokhirgooKhadgalya = async (
    shineTalbaruud: Record<string, any>,
  ) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return false;
    }
    showSpinner();
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;

      // 1. Fetch FRESH and FULL organization data
      const resp = await uilchilgee(token).get(
        `/baiguullaga/${ajiltan.baiguullagiinId}`,
        {
          headers: { "X-Org-Only": "1" },
        },
      );

      const freshOrg = resp.data;
      if (!freshOrg || !freshOrg._id) {
        throw new Error("Байгууллагын мэдээлэл олдсонгүй");
      }

      // Deep copy to prevent state mutation
      let payload: any = JSON.parse(JSON.stringify(freshOrg));

      if (effectiveBarilgiinId && payload.barilguud) {
        let found = false;
        payload.barilguud = payload.barilguud.map((b: any) => {
          const bId = b._id || b.id;
          if (String(bId).trim() === String(effectiveBarilgiinId).trim()) {
            found = true;
            return {
              ...b,
              tokhirgoo: {
                ...(b.tokhirgoo || {}),
                zochinTokhirgoo: {
                  ...(b.tokhirgoo?.zochinTokhirgoo || {}),
                  ...shineTalbaruud,
                },
              },
            };
          }
          return b;
        });

        if (!found) {
          throw new Error(
            "Сонгосон барилга байгууллагын жагсаалтад олдсонгүй. Хадгалах боломжгүй.",
          );
        }
      } else {
        // Organization level update
        payload.tokhirgoo = {
          ...(payload.tokhirgoo || {}),
          zochinTokhirgoo: {
            ...(payload.tokhirgoo?.zochinTokhirgoo || {}),
            ...shineTalbaruud,
          },
        };
      }

      // Use createMethod to perform a POST update (project convention for configs)
      // Organizations (baiguullaga) updates typically use POST specifically for these config paths
      const result = await updateMethod("baiguullaga", token, payload);

      if (!result?.data) {
        throw new Error("Хадгалахад алдаа гарлаа");
      }

      const finalData = result.data.result || result.data;
      // Optimistically update the cache
      await baiguullagaMutate(finalData, false);
      // Ensure a background sync is triggered to confirm server state
      await baiguullagaMutate();
      amjilt("Амжилттай хадгаллаа");
      return true;
    } catch (error: any) {
      aldaaGargay(error?.message || "  хадгалахад алдаа гарлаа");
      return false;
    } finally {
      hideSpinner();
    }
  };

  const saveGuestSettings = async (overrideEnabled?: boolean) => {
    const isOverrideBool = typeof overrideEnabled === "boolean";
    const isEnabled = isOverrideBool ? overrideEnabled : !!guestConfigEnabled;

    await zochinTokhirgooKhadgalya({
      zochinUrikhEsekh: isEnabled,
      zochinTurul: "Оршин суугч",
      zochinErkhiinToo: Number(guestLimit) || 0,
      zochinTusBurUneguiMinut: Number(guestFreeMinutes) || 0,
      zochinNekhemjlekhEsekh: !!guestInvoiceEnabled,
      zochinTailbar: guestNote || "",
      davtamjiinTurul: guestFrequencyType,
      davtamjUtga: Number(guestFrequencyValue) || null,
    });
  };

  /** Машины бүртгэлийн хязгаарыг хадгална (зочны тохиргооноос хамаарахгүй). */
  const saveResidentCarLimit = async () => {
    const orshinSuugch = Number(residentCarLimit);
    const khariltsagch = Number(clientCarLimit);

    if (!Number.isFinite(orshinSuugch) || orshinSuugch < 1) {
      aldaaGargay("Оршин суугчийн машины хязгаар 1-ээс багагүй байх ёстой");
      return;
    }
    if (!Number.isFinite(khariltsagch) || khariltsagch < 1) {
      aldaaGargay("Харилцагчийн машины хязгаар 1-ээс багагүй байх ёстой");
      return;
    }

    await zochinTokhirgooKhadgalya({
      orshinSuugchMashiniiLimit: Math.floor(orshinSuugch),
      khariltsagchMashiniiLimit: Math.floor(khariltsagch),
    });
  };

  const saveGaragePaymentSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }
    showSpinner();
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get(
        `/baiguullaga/${ajiltan.baiguullagiinId}`,
        {
          headers: { "X-Org-Only": "1" },
        },
      );
      const freshOrg = resp.data;
      let payload: any = JSON.parse(JSON.stringify(freshOrg));

      const isOverrideBool = typeof overrideEnabled === "boolean";
      const isEnabled = isOverrideBool ? overrideEnabled : garagePaymentEnabled;

      const garageData = {
        garsiinTolborEnabled: isEnabled,
        garsiinTolborArga: garagePaymentMethod,
        garsiinTolborUtga: Number(garagePaymentValue) || 0,
      };

      if (effectiveBarilgiinId && payload.barilguud) {
        payload.barilguud = payload.barilguud.map((b: any) => {
          const bId = b._id || b.id;
          if (String(bId).trim() === String(effectiveBarilgiinId).trim()) {
            return {
              ...b,
              tokhirgoo: {
                ...(b.tokhirgoo || {}),
                ...garageData,
              },
            };
          }
          return b;
        });
      } else {
        payload.tokhirgoo = {
          ...(payload.tokhirgoo || {}),
          ...garageData,
        };
      }

      const result = await updateMethod("baiguullaga", token, payload);
      if (result?.data) {
        await baiguullagaMutate(result.data.result || result.data, false);
        await baiguullagaMutate();
        amjilt("Грашийн төлбөрийн тохиргоо хадгалагдлаа");
      }
    } catch (error: any) {
      aldaaGargay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveStoragePaymentSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }
    showSpinner();
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get(
        `/baiguullaga/${ajiltan.baiguullagiinId}`,
        {
          headers: { "X-Org-Only": "1" },
        },
      );
      const freshOrg = resp.data;
      let payload: any = JSON.parse(JSON.stringify(freshOrg));

      const isOverrideBool = typeof overrideEnabled === "boolean";
      const isEnabled = isOverrideBool ? overrideEnabled : storagePaymentEnabled;

      const storageData = {
        aguulakhTolborEnabled: isEnabled,
        aguulakhTolborArga: storagePaymentMethod,
        aguulakhTolborUtga: Number(storagePaymentValue) || 0,
      };

      if (effectiveBarilgiinId && payload.barilguud) {
        payload.barilguud = payload.barilguud.map((b: any) => {
          const bId = b._id || b.id;
          if (String(bId).trim() === String(effectiveBarilgiinId).trim()) {
            return {
              ...b,
              tokhirgoo: {
                ...(b.tokhirgoo || {}),
                ...storageData,
              },
            };
          }
          return b;
        });
      } else {
        payload.tokhirgoo = {
          ...(payload.tokhirgoo || {}),
          ...storageData,
        };
      }

      const result = await updateMethod("baiguullaga", token, payload);
      if (result?.data) {
        await baiguullagaMutate(result.data.result || result.data, false);
        await baiguullagaMutate();
        amjilt("Агуулахын төлбөрийн тохиргоо хадгалагдлаа");
      }
    } catch (error: any) {
      aldaaGargay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveCalculationSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }
    showSpinner();
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get(
        `/baiguullaga/${ajiltan.baiguullagiinId}`,
        {
          headers: { "X-Org-Only": "1" },
        },
      );
      const freshOrg = resp.data;
      let payload: any = JSON.parse(JSON.stringify(freshOrg));

      const isOverrideBool = typeof overrideEnabled === "boolean";
      const isEnabled = isOverrideBool ? overrideEnabled : calculationEnabled;

      const calculationData = {
        bodokhArgaEnabled: isEnabled,
        bodokhArga: calculationMethod,
        bodokhKhonog: Number(fixedDayCount) || 30,
      };

      if (effectiveBarilgiinId && payload.barilguud) {
        payload.barilguud = payload.barilguud.map((b: any) => {
          const bId = b._id || b.id;
          if (String(bId).trim() === String(effectiveBarilgiinId).trim()) {
            return {
              ...b,
              tokhirgoo: {
                ...(b.tokhirgoo || {}),
                ...calculationData,
              },
            };
          }
          return b;
        });
      } else {
        payload.tokhirgoo = {
          ...(payload.tokhirgoo || {}),
          ...calculationData,
        };
      }

      const result = await updateMethod("baiguullaga", token, payload);
      if (result?.data) {
        await baiguullagaMutate(result.data.result || result.data, false);
        await baiguullagaMutate();
        amjilt("Амжилттай хадгаллаа");
      }
    } catch (error: any) {
      aldaaGargay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveResidentGateOpenSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }
    showSpinner();
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get(
        `/baiguullaga/${ajiltan.baiguullagiinId}`,
        {
          headers: { "X-Org-Only": "1" },
        },
      );
      const freshOrg = resp.data;
      let payload: any = JSON.parse(JSON.stringify(freshOrg));

      const isOverrideBool = typeof overrideEnabled === "boolean";
      const isEnabled = isOverrideBool ? overrideEnabled : residentGateOpenEnabled;

      const residentGateData = {
        orshinSuugchKhaalgaNeehEsekh: isEnabled,
      };

      if (effectiveBarilgiinId && payload.barilguud) {
        payload.barilguud = payload.barilguud.map((b: any) => {
          const bId = b._id || b.id;
          if (String(bId).trim() === String(effectiveBarilgiinId).trim()) {
            return {
              ...b,
              tokhirgoo: {
                ...(b.tokhirgoo || {}),
                ...residentGateData,
              },
            };
          }
          return b;
        });
      } else {
        payload.tokhirgoo = {
          ...(payload.tokhirgoo || {}),
          ...residentGateData,
        };
      }

      const result = await updateMethod("baiguullaga", token, payload);
      if (result?.data) {
        await baiguullagaMutate(result.data.result || result.data, false);
        await baiguullagaMutate();
        amjilt("Оршин суугч хаалга нээх эрхийн тохиргоо хадгалагдлаа");
      }
    } catch (error: any) {
      aldaaGargay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  /**
   * Гэр бүлийн гишүүн урих боломжийг асаах/унтраах.
   *
   * Чек дарахад шууд хадгална (хаалт нээх эрхийн тохиргоотой ижил зан төлөв).
   * Алдаа гарвал төлөвөө эргүүлж тавина — UI хуурамч байдалд орохгүй.
   */
  const saveGerBuliinGishuunSettings = async (utga: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }

    const umnukh = gerBuliinGishuunEnabled;
    setGerBuliinGishuunEnabled(utga);
    showSpinner();

    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get(
        `/baiguullaga/${ajiltan.baiguullagiinId}`,
        {
          headers: { "X-Org-Only": "1" },
        },
      );

      const freshOrg = resp.data;
      if (!freshOrg || !freshOrg._id) {
        throw new Error("Байгууллагын мэдээлэл олдсонгүй");
      }

      const payload: any = JSON.parse(JSON.stringify(freshOrg));
      const gishuuniiData = { gerBuliinGishuunEsekh: utga };

      if (effectiveBarilgiinId && payload.barilguud) {
        payload.barilguud = payload.barilguud.map((b: any) => {
          const bId = b._id || b.id;
          if (String(bId).trim() === String(effectiveBarilgiinId).trim()) {
            return {
              ...b,
              tokhirgoo: { ...(b.tokhirgoo || {}), ...gishuuniiData },
            };
          }
          return b;
        });
      } else {
        payload.tokhirgoo = {
          ...(payload.tokhirgoo || {}),
          ...gishuuniiData,
        };
      }

      const result = await updateMethod("baiguullaga", token, payload);
      if (!result?.data) throw new Error("Хадгалахад алдаа гарлаа");

      await baiguullagaMutate(result.data.result || result.data, false);
      await baiguullagaMutate();
      amjilt(
        utga
          ? "Гэр бүлийн гишүүн урих боломж идэвхжлээ"
          : "Гэр бүлийн гишүүн урих боломж хаагдлаа",
      );
    } catch (error: any) {
      setGerBuliinGishuunEnabled(umnukh);
      aldaaGargay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveZaaltaarBodokhSettings = async (utga: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      aldaaGargay("Нэвтрэх шаардлагатай");
      return;
    }

    const umnukh = zaaltaarBodokh;
    setZaaltaarBodokh(utga);
    showSpinner();

    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get(
        `/baiguullaga/${ajiltan.baiguullagiinId}`,
        {
          headers: { "X-Org-Only": "1" },
        },
      );
      const freshOrg = resp.data;
      const payload: any = JSON.parse(JSON.stringify(freshOrg));

      const zaaltData = { zaaltaarTsakhilgaanBodokhEsekh: utga };

      if (effectiveBarilgiinId && payload.barilguud) {
        payload.barilguud = payload.barilguud.map((b: any) => {
          const bId = b._id || b.id;
          if (String(bId).trim() === String(effectiveBarilgiinId).trim()) {
            return {
              ...b,
              tokhirgoo: { ...(b.tokhirgoo || {}), ...zaaltData },
            };
          }
          return b;
        });
      } else {
        payload.tokhirgoo = { ...(payload.tokhirgoo || {}), ...zaaltData };
      }

      const result = await updateMethod("baiguullaga", token, payload);
      if (result?.data) {
        // Гүйлгээний түүх хуудас ч мөн энэ баримтаас горимоо уншдаг тул
        // шинэчлэхэд тэнд байгаа Excel цэс шууд өөрчлөгдөнө.
        await baiguullagaMutate(
          (result.data as any).result || result.data,
          false,
        );
        await baiguullagaMutate();
        amjilt(
          utga
            ? "Цахилгааныг заалтаар бодохоор тохирууллаа"
            : "Цахилгааны дүнг гараар оруулахаар тохирууллаа",
        );
      }
    } catch (error: any) {
      setZaaltaarBodokh(umnukh);
      aldaaGargay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const toUniqueSorted = (values: (string | number)[]) => {
    const nums = values
      .map((v) => Number(String(v).trim()))
      .filter((n) => Number.isFinite(n) && n > 0) as number[];
    const uniq = Array.from(new Set(nums));
    uniq.sort((a, b) => a - b);
    return uniq.map((n) => String(n));
  };

  const expandRangeToken = (token: string): number[] => {
    const t = token.trim().replace(/\s+/g, "");
    if (!t) return [];
    const m = t.match(/^(\d+)-(\d+)$/);
    if (m) {
      const start = Number(m[1]);
      const end = Number(m[2]);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        const a = Math.min(start, end);
        const b = Math.max(start, end);
        const out: number[] = [];
        for (let i = a; i <= b; i++) out.push(i);
        return out;
      }
    }
    const n = Number(t);
    return Number.isFinite(n) ? [n] : [];
  };

  const parseBulk = (text: string): string[] => {
    const tokens = text
      .split(/[,;\n\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const expanded = tokens.flatMap(expandRangeToken);
    return toUniqueSorted(expanded);
  };

  const handleSaveFloors = async () => {
    let merged: string[] = [];
    if (liftBulkInput && liftBulkInput.trim() !== "") {
      const parsed = parseBulk(liftBulkInput);
      merged = toUniqueSorted(parsed);
    } else {
      merged = liftFloors || [];
    }

    setLiftFloors(merged);
    setLiftBulkInput(merged.length > 0 ? merged.join(",") : "");

    if (merged.length > 0) {
      await saveLiftSettings(merged);
    } else {
      try {
        if (liftShalgayaId && token) {
          await deleteMethod("liftShalgaya", token, liftShalgayaId);
          setLiftShalgayaId(null);
        } else {
          await saveLiftSettings(null);
        }
      } catch (e) {
        await saveLiftSettings(null);
      }
    }
  };

  const handleDeleteAllFloors = async () => {
    const originalLiftShalgayaId = liftShalgayaId;
    setLiftFloors([]);
    setLiftBulkInput("");
    setLiftEnabled(false);
    setLiftShalgayaId(null);
    try {
      if (originalLiftShalgayaId && token) {
        await deleteMethod("liftShalgaya", token, originalLiftShalgayaId);
      }
      await saveLiftSettings(null, true);
      amjilt("Бүх лифт давхар устгагдлаа");
    } catch (e) {
      try {
        await saveLiftSettings(null, true);
      } catch (e2) {
        // ignore
      }
      amjilt("Бүх лифт давхар устгагдлаа");
    }
  };

  // Хадгалах үед хэсэг бүрийн амжилтын мэдэгдэл гарах ёсгүй — дуугүй
  // горимоор дараалуулж, эцэст нь нэг удаа. Алдааны мэдэгдэл дуугүй болохгүй.
  const chimeeguiRef = useRef(false);
  const amjilt = (zurvas: string) => {
    if (!chimeeguiRef.current) openSuccessOverlay(zurvas);
  };

  const [khadgalj, setKhadgalj] = useState(false);

  /* ── Өөрчлөлт илрүүлэх ─────────────────────────────────────────────── */
  const too = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

  /** Харьцуулахад зориулсан одоогийн утгууд (хэлбэрийг нэгтгэсэн) */
  const odoo: Record<string, unknown> = {
    invoiceActive,
    invoiceDay: too(invoiceDay),
    calculationEnabled,
    calculationMethod,
    fixedDayCount: too(fixedDayCount),
    zaaltaarBodokh,
    garagePaymentEnabled,
    garagePaymentValue: too(garagePaymentValue),
    storagePaymentEnabled,
    storagePaymentValue: too(storagePaymentValue),
    residentGateOpenEnabled,
    residentCarLimit: too(residentCarLimit),
    clientCarLimit: too(clientCarLimit),
    guestConfigEnabled,
    guestFrequencyType,
    guestFrequencyValue: too(guestFrequencyValue),
    guestInvoiceEnabled,
    guestLimit: too(guestLimit),
    guestFreeMinutes: too(guestFreeMinutes),
    liftEnabled,
    liftBulkInput: parseBulk(liftBulkInput || "").join(","),
    gerBuliinGishuunEnabled,
  };

  useEffect(() => {
    const bulguud = khuleegdejBuiBuleg.current;
    if (bulguud.size === 0) return;
    const shine: Record<string, unknown> = {};
    let bui = false;
    bulguud.forEach((temdeg, b) => {
      // Энэ рендерт тухайн бүлгийн шинэ утга хараахан ороогүй
      if (temdeg > suuriTemdeg) return;
      (TOKHIRGOONII_BULEG[b] || []).forEach((k) => {
        shine[k] = odoo[k];
      });
      bulguud.delete(b);
      bui = true;
    });
    if (bui) setSuuri((umnukh) => ({ ...umnukh, ...shine }));
  }, [suuriTemdeg]);

  const uurchlugdsun = (...talbaruud: string[]) =>
    talbaruud.some((k) => k in suuri && suuri[k] !== odoo[k]);

  /** Тохиргоо бүр ба түүнийг хадгалах үйлдэл */
  const ZOGSOOLIIN_TALBAR = new Set([
    "residentGateOpenEnabled",
    "residentCarLimit",
    "clientCarLimit",
    "guestConfigEnabled",
  ]);
  const khesguud: { talbar: string[]; khadgal: () => Promise<unknown> }[] = [
    { talbar: ["invoiceActive", "invoiceDay"], khadgal: () => saveInvoiceSchedule() },
    {
      talbar: ["calculationEnabled", "calculationMethod", "fixedDayCount"],
      khadgal: () => saveCalculationSettings(),
    },
    { talbar: ["zaaltaarBodokh"], khadgal: () => saveZaaltaarBodokhSettings(zaaltaarBodokh) },
    {
      talbar: ["garagePaymentEnabled", "garagePaymentValue"],
      khadgal: () => saveGaragePaymentSettings(),
    },
    {
      talbar: ["storagePaymentEnabled", "storagePaymentValue"],
      khadgal: () => saveStoragePaymentSettings(),
    },
    {
      talbar: ["residentGateOpenEnabled"],
      khadgal: () => saveResidentGateOpenSettings(residentGateOpenEnabled),
    },
    { talbar: ["residentCarLimit", "clientCarLimit"], khadgal: saveResidentCarLimit },
    {
      talbar: [
        "guestConfigEnabled",
        "guestFrequencyType",
        "guestFrequencyValue",
        "guestInvoiceEnabled",
        "guestLimit",
        "guestFreeMinutes",
      ],
      khadgal: () => saveGuestSettings(),
    },
    {
      talbar: ["liftEnabled", "liftBulkInput"],
      khadgal: () => (liftEnabled ? handleSaveFloors() : handleDeleteAllFloors()),
    },
    {
      talbar: ["gerBuliinGishuunEnabled"],
      khadgal: () => saveGerBuliinGishuunSettings(gerBuliinGishuunEnabled),
    },
  ];

  // Зөвхөн энэ дэлгэцэнд харагдах тохиргоонуудыг тоолж, хадгална
  const enaKheseg = (k: { talbar: string[] }) =>
    ZOGSOOLIIN_TALBAR.has(k.talbar[0]) === (kheseg === "zogsool");
  const uurchlugdsunKhesguud = khesguud.filter(
    (k) => enaKheseg(k) && uurchlugdsun(...k.talbar),
  );
  const uurchlugdsunToo = uurchlugdsunKhesguud.length;

  // Хадгалаагүй өөрчлөлттэй хуудсаа хаахад сануулна
  useEffect(() => {
    if (uurchlugdsunToo === 0) return;
    const sanuulga = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", sanuulga);
    return () => window.removeEventListener("beforeunload", sanuulga);
  }, [uurchlugdsunToo]);

  /** Өөрчлөгдсөн бүх тохиргоог нэг дор хадгална */
  const bugdiigKhadgalya = async () => {
    if (uurchlugdsunToo === 0) return;
    const ilgeesen = { ...odoo };
    const amjilttai: Record<string, unknown> = {};
    setKhadgalj(true);
    chimeeguiRef.current = true;
    aldaaToo.current = 0;
    try {
      for (const k of uurchlugdsunKhesguud) {
        const umnukhAldaa = aldaaToo.current;
        await k.khadgal();
        if (aldaaToo.current === umnukhAldaa) {
          k.talbar.forEach((t) => (amjilttai[t] = ilgeesen[t]));
        }
      }
    } finally {
      chimeeguiRef.current = false;
      setKhadgalj(false);
    }
    setSuuri((umnukh) => ({ ...umnukh, ...amjilttai }));
    if (aldaaToo.current === 0) openSuccessOverlay("Тохиргоо хадгалагдлаа");
  };

  /** Хадгалаагүй өөрчлөлтийг хаяж, хадгалсан утга руу буцаана */
  const butsaay = () => {
    const v = (k: string) => suuri[k] as any;
    const bui = (k: string) => k in suuri;
    if (bui("invoiceActive")) {
      setInvoiceActive(v("invoiceActive"));
      setInvoiceDay(v("invoiceDay") || null);
    }
    if (bui("liftEnabled")) {
      setLiftEnabled(v("liftEnabled"));
      setLiftBulkInput(v("liftBulkInput") || "");
      setLiftFloors(String(v("liftBulkInput") || "").split(",").filter(Boolean));
    }
    if (bui("calculationEnabled")) {
      setCalculationEnabled(v("calculationEnabled"));
      setCalculationMethod(v("calculationMethod"));
      setFixedDayCount(v("fixedDayCount") || 30);
      setZaaltaarBodokh(v("zaaltaarBodokh"));
      setGaragePaymentEnabled(v("garagePaymentEnabled"));
      setGaragePaymentValue(v("garagePaymentValue") || "");
      setStoragePaymentEnabled(v("storagePaymentEnabled"));
      setStoragePaymentValue(v("storagePaymentValue") || "");
      setResidentGateOpenEnabled(v("residentGateOpenEnabled"));
      setResidentCarLimit(v("residentCarLimit"));
      setClientCarLimit(v("clientCarLimit"));
      setGuestConfigEnabled(v("guestConfigEnabled"));
      setGuestFrequencyType(v("guestFrequencyType"));
      setGuestFrequencyValue(v("guestFrequencyValue") || "");
      setGuestInvoiceEnabled(v("guestInvoiceEnabled"));
      setGuestLimit(v("guestLimit"));
      setGuestFreeMinutes(v("guestFreeMinutes"));
      setGerBuliinGishuunEnabled(v("gerBuliinGishuunEnabled"));
    }
  };

  const toogoor = (setter: (v: number | string) => void) => (val: number | string) =>
    setter(val !== "" ? val : "");

  const zochniiKhuraangui = guestConfigEnabled
    ? `${DAVTAMJ_NER[guestFrequencyType] || ""} ${too(guestLimit)} зочин, тус бүр ${too(guestFreeMinutes)} минут үнэгүй`
    : "Оршин суугч зочин урих боломжгүй.";

  return (
    <div id="nemelt-panel" className="w-full">
      <div className="allow-overflow">
        <div className="stg-page stg-page-grid">
          {kheseg === "undsen" ? (
            <>
          {/* ── 1. Нэхэмжлэх ба тооцоолол ─────────────────────────────── */}
          <SettingsCard
            id="nemelt-invoice-box"
            icon={<FileText />}
            title="Нэхэмжлэх ба тооцоолол"
            subtitle="Сарын нэхэмжлэх хэзээ, хэрхэн бодогдох"
          >
            <SettingsItem
              id="nemelt-invoice-settings"
              icon={<CalendarClock />}
              title="Нэхэмжлэх автоматаар илгээх"
              changed={uurchlugdsun("invoiceActive", "invoiceDay")}
              desc={
                invoiceActive
                  ? invoiceDay
                    ? `Сар бүрийн ${invoiceDay}-ны өдөр бүх оршин суугчид илгээгдэнэ.`
                    : "Илгээх өдрөө сонгоно уу."
                  : "Унтраалттай. Нэхэмжлэхийг гараар илгээнэ."
              }
              control={
                <Switch
                  checked={invoiceActive}
                  onChange={(e) => setInvoiceActive(e.currentTarget.checked)}
                  label="Нэхэмжлэх автоматаар илгээх"
                />
              }
            >
              {invoiceActive ? (
                <div className="stg-inline">
                  <span>Сар бүрийн</span>
                  <MNumberInput
                    min={1}
                    max={31}
                    placeholder="1-31"
                    value={invoiceDay ?? undefined}
                    onChange={(v) => setInvoiceDay(v === "" ? null : Number(v))}
                    size="sm"
                    className="w-20"
                    aria-label="Илгээх өдөр"
                  />
                  <span>-ны өдөр</span>
                </div>
              ) : null}
            </SettingsItem>

            <SettingsItem
              id="nemelt-calculation-box"
              icon={<Calculator />}
              title="Хоногоор хувааж бодох"
              changed={uurchlugdsun("calculationEnabled", "calculationMethod", "fixedDayCount")}
              desc={
                !calculationEnabled
                  ? "Унтраалттай. Сарын төлбөрийг бүтнээр нь бодно."
                  : calculationMethod === "Хуанли"
                    ? "Тухайн сарын хоногт (28–31) хувааж бодно."
                    : `Сар бүрийг ${too(fixedDayCount) || 30} хоногт хувааж бодно.`
              }
              control={
                <Switch
                  checked={calculationEnabled}
                  onChange={(e) => setCalculationEnabled(e.currentTarget.checked)}
                  label="Хоногоор хувааж бодох"
                />
              }
            >
              {calculationEnabled ? (
                <div className="stg-inline">
                  <div className="stg-segment">
                    {(["Хуанли", "Тогтмол"] as const).map((arga) => (
                      <button
                        key={arga}
                        type="button"
                        onClick={() => setCalculationMethod(arga)}
                        className={
                          calculationMethod === arga
                            ? "stg-segment-item is-active"
                            : "stg-segment-item"
                        }
                      >
                        {arga === "Хуанли" ? "Хуанлийн хоног" : "Тогтмол хоног"}
                      </button>
                    ))}
                  </div>
                  {calculationMethod === "Тогтмол" ? (
                    <>
                      <MNumberInput
                        value={fixedDayCount === "" ? undefined : Number(fixedDayCount)}
                        onChange={toogoor(setFixedDayCount)}
                        placeholder="30"
                        min={1}
                        max={31}
                        size="sm"
                        className="w-20"
                        aria-label="Хоногийн тоо"
                      />
                      <span>хоног</span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </SettingsItem>

            <SettingsItem
              id="nemelt-tsakhilgaan-box"
              icon={<Zap />}
              title="Цахилгааныг заалтаар бодох"
              changed={uurchlugdsun("zaaltaarBodokh")}
              desc={
                zaaltaarBodokh
                  ? "Excel-ийн заалтын зөрүүг кВт тарифаар үржүүлж систем бодно."
                  : "Систем бодохгүй. Тоот бүрийн эцсийн дүнг Excel-ээр оруулна."
              }
              control={
                <Switch
                  checked={zaaltaarBodokh}
                  onChange={(e) => setZaaltaarBodokh(e.currentTarget.checked)}
                  label="Цахилгааныг заалтаар бодох"
                />
              }
            />
          </SettingsCard>

          {/* ── 2. Гараж ба агуулах ───────────────────────────────────── */}
          <SettingsCard
            id="nemelt-garaj-box"
            icon={<Warehouse />}
            title="Гараж ба агуулахын төлбөр"
            subtitle="Эзэн холбогдоход энэ дүнгээр сар бүр нэхэмжлэгдэнэ"
          >
            <SettingsItem
              id="nemelt-garage-storage-box"
              icon={<Car />}
              title="Гараж"
              changed={uurchlugdsun("garagePaymentEnabled", "garagePaymentValue")}
              desc={
                garagePaymentEnabled
                  ? "Сарын төлбөр нэхэмжлэгдэнэ."
                  : "Унтраалттай. Гаражид төлбөр нэхэмжлэхгүй."
              }
              control={
                <>
                  {garagePaymentEnabled ? (
                    <MNumberInput
                      value={garagePaymentValue === "" ? undefined : Number(garagePaymentValue)}
                      onChange={toogoor(setGaragePaymentValue)}
                      placeholder="0"
                      min={0}
                      size="sm"
                      thousandSeparator=","
                      rightSection={<span className="stg-unit">₮</span>}
                      className="w-36"
                      aria-label="Гаражийн сарын төлбөр"
                    />
                  ) : null}
                  <Switch
                    checked={garagePaymentEnabled}
                    onChange={(e) => setGaragePaymentEnabled(e.currentTarget.checked)}
                    label="Гаражийн төлбөр"
                  />
                </>
              }
            />

            <SettingsItem
              id="nemelt-storage-box"
              icon={<Warehouse />}
              title="Агуулах"
              changed={uurchlugdsun("storagePaymentEnabled", "storagePaymentValue")}
              desc={
                storagePaymentEnabled
                  ? "Сарын төлбөр нэхэмжлэгдэнэ."
                  : "Унтраалттай. Агуулахад төлбөр нэхэмжлэхгүй."
              }
              control={
                <>
                  {storagePaymentEnabled ? (
                    <MNumberInput
                      value={storagePaymentValue === "" ? undefined : Number(storagePaymentValue)}
                      onChange={toogoor(setStoragePaymentValue)}
                      placeholder="0"
                      min={0}
                      size="sm"
                      thousandSeparator=","
                      rightSection={<span className="stg-unit">₮</span>}
                      className="w-36"
                      aria-label="Агуулахын сарын төлбөр"
                    />
                  ) : null}
                  <Switch
                    checked={storagePaymentEnabled}
                    onChange={(e) => setStoragePaymentEnabled(e.currentTarget.checked)}
                    label="Агуулахын төлбөр"
                  />
                </>
              }
            />
          </SettingsCard>

          {/* ── 5. Оршин суугч ба байр ────────────────────────────────── */}
          <SettingsCard
            className="stg-card-wide"
            icon={<Building2 />}
            title="Оршин суугч ба байр"
            subtitle="Лифтний чөлөөлөлт, гэр бүлийн гишүүд"
          >
            <SettingsItem
              id="nemelt-lift-settings"
              icon={<ArrowUpDown />}
              title="Лифтний төлбөрөөс чөлөөлөх"
              changed={uurchlugdsun("liftEnabled", "liftBulkInput")}
              desc={
                liftEnabled
                  ? "Бичсэн давхрын оршин суугчид лифтний төлбөр төлөхгүй."
                  : "Унтраалттай. Бүх давхар лифтний төлбөр төлнө."
              }
              control={
                <Switch
                  checked={liftEnabled}
                  onChange={(e) => setLiftEnabled(e.currentTarget.checked)}
                  label="Лифтний төлбөрөөс чөлөөлөх"
                />
              }
            >
              {liftEnabled ? (
                <div className="stg-inline">
                  <span>Давхар</span>
                  <MTextInput
                    placeholder="Жишээ: 1-3, 5, 7"
                    value={liftBulkInput}
                    onChange={(e) => setLiftBulkInput(e.currentTarget.value)}
                    size="sm"
                    className="w-48"
                    aria-label="Чөлөөлөх давхрууд"
                  />
                  {liftBulkInput ? (
                    <span className="stg-inline-hint">
                      {parseBulk(liftBulkInput).length} давхар
                    </span>
                  ) : null}
                </div>
              ) : null}
            </SettingsItem>

            <SettingsItem
              id="nemelt-gerbul-box"
              icon={<Users />}
              title="Гэр бүлийн гишүүн урих"
              changed={uurchlugdsun("gerBuliinGishuunEnabled")}
              desc={
                gerBuliinGishuunEnabled
                  ? "Оршин суугч аппаар гишүүн урьж, гишүүн нь нэхэмжлэх, төлбөрөө харна."
                  : "Шинэ урилга үүсэхгүй. Бүртгэлтэй гишүүд хэвээр үлдэнэ."
              }
              control={
                <Switch
                  checked={gerBuliinGishuunEnabled}
                  onChange={(e) => setGerBuliinGishuunEnabled(e.currentTarget.checked)}
                  label="Гэр бүлийн гишүүн урих"
                />
              }
            />
          </SettingsCard>
            </>
          ) : (
            <>
          {/* ── 3. Зогсоол ────────────────────────────────────────────── */}
          <SettingsCard
            id="nemelt-zogsool-box"
            icon={<Car />}
            title="Зогсоол"
            subtitle="Хаалт нээх эрх, машины хязгаар"
          >
            <SettingsItem
              id="nemelt-resident-gate-box"
              icon={<DoorOpen />}
              title="Оршин суугч хаалт нээх"
              changed={uurchlugdsun("residentGateOpenEnabled")}
              desc={
                residentGateOpenEnabled
                  ? "Апп дээр хаалт нээх товч харагдана."
                  : "Апп дээр хаалт нээх товч харагдахгүй."
              }
              control={
                <Switch
                  checked={residentGateOpenEnabled}
                  onChange={(e) => setResidentGateOpenEnabled(e.currentTarget.checked)}
                  label="Оршин суугч хаалт нээх"
                />
              }
            />

            <SettingsItem
              id="nemelt-mashin-box"
              icon={<CarFront />}
              title="Машины дээд тоо"
              changed={uurchlugdsun("residentCarLimit", "clientCarLimit")}
              desc="Нэг эзэн дээр бүртгэж болох машин. Бүртгэх цонх, Excel импорт хоёулаа дагана."
            >
              <div className="stg-inline">
                <span>Оршин суугч</span>
                <MNumberInput
                  value={residentCarLimit === "" ? undefined : Number(residentCarLimit)}
                  onChange={toogoor(setResidentCarLimit)}
                  placeholder="1"
                  min={1}
                  size="sm"
                  className="w-20"
                  aria-label="Оршин суугчийн машины дээд тоо"
                />
                <span className="stg-inline-gap">Харилцагч</span>
                <MNumberInput
                  value={clientCarLimit === "" ? undefined : Number(clientCarLimit)}
                  onChange={toogoor(setClientCarLimit)}
                  placeholder="1"
                  min={1}
                  size="sm"
                  className="w-20"
                  aria-label="Харилцагчийн машины дээд тоо"
                />
              </div>
            </SettingsItem>
          </SettingsCard>

          {/* ── 4. Зочин ──────────────────────────────────────────────── */}
          <SettingsCard
            id="nemelt-visitor-box"
            icon={<UserPlus />}
            title="Зочин"
            subtitle="Оршин суугчийн урих зочны зогсоолын эрх"
          >
            <SettingsItem
              icon={<UserPlus />}
              title="Зочин урих эрх"
              changed={uurchlugdsun(...khesguud[7].talbar)}
              desc={zochniiKhuraangui}
              control={
                <Switch
                  checked={guestConfigEnabled}
                  onChange={(e) => setGuestConfigEnabled(e.currentTarget.checked)}
                  label="Зочин урих эрх"
                />
              }
            >
              {guestConfigEnabled ? (
                <div className="stg-grid">
                  <SettingsField label="Эрх шинэчлэгдэх">
                    <select
                      value={guestFrequencyType}
                      onChange={(e) => setGuestFrequencyType(e.target.value)}
                      className="stg-select"
                    >
                      {Object.entries(DAVTAMJ_NER).map(([utga, ner]) => (
                        <option key={utga} value={utga}>
                          {ner}
                        </option>
                      ))}
                    </select>
                  </SettingsField>

                  {guestFrequencyType === "saraar" || guestFrequencyType === "jileer" ? (
                    <SettingsField
                      label={guestFrequencyType === "saraar" ? "Хэдний өдөр" : "Хэддүгээр сар"}
                    >
                      <MNumberInput
                        value={guestFrequencyValue === "" ? undefined : Number(guestFrequencyValue)}
                        onChange={toogoor(setGuestFrequencyValue)}
                        placeholder={guestFrequencyType === "saraar" ? "1-31" : "1-12"}
                        min={1}
                        max={guestFrequencyType === "saraar" ? 31 : 12}
                        size="sm"
                        className="w-full"
                      />
                    </SettingsField>
                  ) : null}

                  <SettingsField label="Зочны тоо">
                    <MNumberInput
                      value={guestLimit === "" ? undefined : Number(guestLimit)}
                      onChange={toogoor(setGuestLimit)}
                      placeholder="0"
                      min={0}
                      size="sm"
                      className="w-full"
                    />
                  </SettingsField>

                  <SettingsField label="Үнэгүй минут (зочин бүрт)">
                    <MNumberInput
                      value={guestFreeMinutes === "" ? undefined : Number(guestFreeMinutes)}
                      onChange={toogoor(setGuestFreeMinutes)}
                      placeholder="0"
                      min={0}
                      size="sm"
                      className="w-full"
                    />
                  </SettingsField>

                  <SettingsField label="Илүү хугацааны төлбөр">
                    <div className="stg-subrow">
                      <span className="stg-subrow-text">
                        {guestInvoiceEnabled ? "Оршин суугч төлж болно" : "Зочин өөрөө төлнө"}
                      </span>
                      <Switch
                        checked={guestInvoiceEnabled}
                        onChange={(e) => setGuestInvoiceEnabled(e.currentTarget.checked)}
                        label="Оршин суугчийн нэхэмжлэхэд нэмэх"
                        size="sm"
                      />
                    </div>
                  </SettingsField>
                </div>
              ) : null}
            </SettingsItem>
          </SettingsCard>

            </>
          )}
        </div>

        {/* Нэг хадгалах мөр — өөрчлөлт гарахад л харагдана */}
        {uurchlugdsunToo > 0 || khadgalj ? (
          <div className="stg-savebar" role="status">
            <span className="stg-savebar-text">
              <span className="stg-savebar-dot" />
              {uurchlugdsunToo} өөрчлөлт хадгалаагүй
            </span>
            <div className="stg-savebar-actions">
              <button
                type="button"
                className="stg-btn stg-btn-ghost"
                onClick={butsaay}
                disabled={khadgalj}
              >
                Буцаах
              </button>
              <button
                id="nemelt-invoice-save"
                type="button"
                className="stg-btn stg-btn-primary"
                onClick={bugdiigKhadgalya}
                disabled={khadgalj}
              >
                {khadgalj ? "Хадгалж байна…" : "Хадгалах"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Ачаалагч бүрийн хариуцдаг талбарууд — өөрчлөлтийн суурь шинэчлэхэд */
const TOKHIRGOONII_BULEG: Record<string, string[]> = {
  invoice: ["invoiceActive", "invoiceDay"],
  lift: ["liftEnabled", "liftBulkInput"],
  org: [
    "calculationEnabled",
    "calculationMethod",
    "fixedDayCount",
    "zaaltaarBodokh",
    "garagePaymentEnabled",
    "garagePaymentValue",
    "storagePaymentEnabled",
    "storagePaymentValue",
    "residentGateOpenEnabled",
    "residentCarLimit",
    "clientCarLimit",
    "guestConfigEnabled",
    "guestFrequencyType",
    "guestFrequencyValue",
    "guestInvoiceEnabled",
    "guestLimit",
    "guestFreeMinutes",
    "gerBuliinGishuunEnabled",
  ],
};

const DAVTAMJ_NER: Record<string, string> = {
  udruur: "Өдөр бүр",
  "7khonogoor": "Долоо хоног бүр",
  saraar: "Сар бүр",
  jileer: "Жил бүр",
};
