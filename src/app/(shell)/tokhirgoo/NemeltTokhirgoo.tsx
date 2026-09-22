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

export default function NemeltTokhirgoo() {
  const { token, ajiltan, barilgiinId, baiguullaga, baiguullagaMutate } =
    useAuth();
  const { selectedBuildingId } = useBuilding();
  const { showSpinner, hideSpinner } = useSpinner();

  const lastInitializedKeyRef = useRef<string>("");

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
            return;
          }
        }
      }

      setInvoiceDay(null);
      setInvoiceActive(true);
      setInvoiceScheduleId(null);
    } catch (error) {
      setInvoiceDay(null);
      setInvoiceActive(true);
      setInvoiceScheduleId(null);
    }
  };

  const saveInvoiceSchedule = async (overrideActive?: boolean) => {
    const isOverrideBool = typeof overrideActive === "boolean";
    const isActive = isOverrideBool ? overrideActive : invoiceActive;
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (isActive && (!invoiceDay || invoiceDay < 1 || invoiceDay > 31)) {
      openErrorOverlay("Огноог 1-31 хооронд сонгоно уу");
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
      openErrorOverlay("Нэхэмжлэх тохиргоо илгээхэд алдаа гарлаа");
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
        return;
      }

      const sortedFloors = toUniqueSorted(floors);
      setLiftBulkInput(sortedFloors.join(","));
      setLiftFloors(sortedFloors);
      setLiftShalgayaId(chosen?._id ?? null);
      setLiftEnabled(true);
    } catch (error) {
      setLiftBulkInput("");
      setLiftEnabled(false);
      setLiftFloors([]);
      setLiftShalgayaId(null);
    }
  };

  const saveLiftSettings = async (
    floorsOrMax: string[] | number | null,
    skipFetch = false,
  ) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
    if (!effectiveBarilgiinId) {
      openErrorOverlay("Барилга сонгоогүй байна");
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
      openErrorOverlay("Лифт тохиргоо хадгалах үед алдаа гарлаа");
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
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      openErrorOverlay(error?.message || "  хадгалахад алдаа гарлаа");
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
    const utga = Number(residentCarLimit);
    if (!Number.isFinite(utga) || utga < 1) {
      openErrorOverlay("Машины хязгаар 1-ээс багагүй тоо байх ёстой");
      return;
    }
    await zochinTokhirgooKhadgalya({
      orshinSuugchMashiniiLimit: Math.floor(utga),
    });
  };

  const saveGaragePaymentSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      openErrorOverlay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveStoragePaymentSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      openErrorOverlay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveCombinedPaymentSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      const isEnabled = isOverrideBool
        ? overrideEnabled
        : (garagePaymentEnabled || storagePaymentEnabled);

      const combinedData = {
        garsiinTolborEnabled: isEnabled,
        garsiinTolborArga: "Тогтмол",
        garsiinTolborUtga: Number(garagePaymentValue) || 0,
        aguulakhTolborEnabled: isEnabled,
        aguulakhTolborArga: "Тогтмол",
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
                ...combinedData,
              },
            };
          }
          return b;
        });
      } else {
        payload.tokhirgoo = {
          ...(payload.tokhirgoo || {}),
          ...combinedData,
        };
      }

      const result = await updateMethod("baiguullaga", token, payload);
      if (result?.data) {
        await baiguullagaMutate(result.data.result || result.data, false);
        await baiguullagaMutate();
        amjilt("Агуулах, гражийн төлбөрийн тохиргоо хадгалагдлаа");
      }
    } catch (error: any) {
      openErrorOverlay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveCalculationSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      openErrorOverlay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveResidentGateOpenSettings = async (overrideEnabled?: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      openErrorOverlay(error?.message || "Хадгалахад алдаа гарлаа");
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
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      openErrorOverlay(error?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const saveZaaltaarBodokhSettings = async (utga: boolean) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
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
      openErrorOverlay(error?.message || "Хадгалахад алдаа гарлаа");
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

  // Нэг хэсэгт хэд хэдэн тохиргоо байвал хадгалахад амжилтын мэдэгдэл
  // тус бүрд нь гарах ёсгүй — дуугүй горимоор дараалуулж, эцэст нь нэг удаа.
  // Алдааны мэдэгдэл дуугүй болохгүй.
  const chimeeguiRef = useRef(false);
  const amjilt = (zurvas: string) => {
    if (!chimeeguiRef.current) openSuccessOverlay(zurvas);
  };

  const [khadgalj, setKhadgalj] = useState(false);

  const khesegKhadgalya = async (uildluud: Array<() => Promise<unknown>>) => {
    if (uildluud.length === 0) return;
    setKhadgalj(true);
    chimeeguiRef.current = true;
    try {
      for (const uildel of uildluud) await uildel();
    } finally {
      chimeeguiRef.current = false;
      setKhadgalj(false);
    }
    openSuccessOverlay("Тохиргоо хадгалагдлаа");
  };

  const nekhemjlekhKhesegKhadgalya = () =>
    khesegKhadgalya([
      ...(invoiceActive ? [() => saveInvoiceSchedule()] : []),
      ...(calculationEnabled ? [() => saveCalculationSettings()] : []),
    ]);

  const bairKhesegKhadgalya = () =>
    khesegKhadgalya(liftEnabled ? [handleSaveFloors] : []);

  const zogsoolKhesegKhadgalya = () =>
    khesegKhadgalya([
      ...(guestConfigEnabled ? [() => saveGuestSettings()] : []),
      saveResidentCarLimit,
      ...(garagePaymentEnabled || storagePaymentEnabled
        ? [() => saveCombinedPaymentSettings()]
        : []),
    ]);

  return (
    <div id="nemelt-panel" className="w-full">
      <div className="neu-panel allow-overflow p-4 md:p-6 pb-6">
        <div className="stg-page">
          {/* ── 1. Нэхэмжлэх ба тооцоолол ─────────────────────────────── */}
          <SettingsCard
            id="nemelt-invoice-box"
            icon={<FileText />}
            title="Нэхэмжлэх ба тооцоолол"
            subtitle="Сар бүрийн төлбөрийн нэхэмжлэхтэй холбоотой тохиргоо"
            onSave={nekhemjlekhKhesegKhadgalya}
            saveId="nemelt-invoice-save"
            saving={khadgalj}
          >
            <SettingsItem
              id="nemelt-invoice-settings"
              title="Нэхэмжлэх илгээх"
              desc="Сар бүрийн хэдний өдөр нэхэмжлэх автоматаар илгээхийг тохируулна"
              control={
                <>
                  {invoiceActive ? (
                    <MNumberInput
                      min={1}
                      max={31}
                      placeholder="1-31"
                      value={invoiceDay ?? undefined}
                      onChange={(v) => setInvoiceDay((v as number) ?? null)}
                      size="sm"
                      className="w-20"
                    />
                  ) : null}
                  <Switch
                    checked={invoiceActive}
                    onChange={(e) => {
                      const val = e.currentTarget.checked;
                      setInvoiceActive(val);
                      if (!val) saveInvoiceSchedule(false);
                    }}
                    label="Нэхэмжлэх идэвхжүүлэх"
                  />
                </>
              }
            />

            <SettingsItem
              id="nemelt-tsakhilgaan-box"
              title="Заалтаар цахилгаан бодох"
              desc={
                zaaltaarBodokh
                  ? "Өдөр, шөнө, өмнөх заалтыг Excel-ээр оруулахад зөрүүг нь кВт тарифаар үржүүлж систем өөрөө бодно."
                  : "Систем цахилгааныг бодохгүй. Тоот тус бүрийн эцсийн дүнг Excel-д бичиж оруулна."
              }
              control={
                <Switch
                  checked={zaaltaarBodokh}
                  onChange={(e) =>
                    saveZaaltaarBodokhSettings(e.currentTarget.checked)
                  }
                  label="Заалтаар цахилгаан бодох"
                />
              }
            />

            <SettingsItem
              id="nemelt-calculation-box"
              title="Төлбөр тооцох арга"
              desc="Сарын төлбөрийг хоногоор хувааж тооцох тохиргоо"
              control={
                <Switch
                  checked={calculationEnabled}
                  onChange={(e) => {
                    const val = e.currentTarget.checked;
                    setCalculationEnabled(val);
                    if (!val) saveCalculationSettings(false);
                  }}
                  label="Төлбөр тооцох арга идэвхжүүлэх"
                />
              }
            >
              {calculationEnabled ? (
                <>
                  <div className="stg-editor">
                    <div className="stg-segment">
                      <button
                        type="button"
                        onClick={() => setCalculationMethod("Хуанли")}
                        className={
                          calculationMethod === "Хуанли"
                            ? "stg-segment-item is-active"
                            : "stg-segment-item"
                        }
                      >
                        Хуанли
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalculationMethod("Тогтмол")}
                        className={
                          calculationMethod === "Тогтмол"
                            ? "stg-segment-item is-active"
                            : "stg-segment-item"
                        }
                      >
                        Тогтмол
                      </button>
                    </div>
                    {calculationMethod === "Тогтмол" ? (
                      <MNumberInput
                        value={
                          fixedDayCount === ""
                            ? undefined
                            : Number(fixedDayCount)
                        }
                        onChange={(val) =>
                          setFixedDayCount(val !== "" ? val : "")
                        }
                        placeholder="30"
                        min={1}
                        max={31}
                        size="sm"
                        className="w-24"
                      />
                    ) : null}
                  </div>
                  <p className="stg-note">
                    {calculationMethod === "Хуанли"
                      ? "Тухайн сарын нийт хоногт хувааж бодно (28, 30, 31)"
                      : "Заасан хоногт тогтмол хувааж бодно"}
                  </p>
                </>
              ) : null}
            </SettingsItem>
          </SettingsCard>

          {/* ── 2. Байрны үйлчилгээ ───────────────────────────────────── */}
          <SettingsCard
            icon={<Building2 />}
            title="Байрны үйлчилгээ"
            subtitle="Лифт, хаалт, гэр бүлийн гишүүдтэй холбоотой тохиргоо"
            onSave={liftEnabled ? bairKhesegKhadgalya : undefined}
            saveId="nemelt-lift-save"
            saving={khadgalj}
          >
            <SettingsItem
              id="nemelt-lift-settings"
              title="Лифт хөнгөлөлт"
              desc={
                liftEnabled
                  ? `${liftFloors.length} давхар тохируулсан. Жишээ: 1-3, 5, 7 эсвэл 1, 2, 3`
                  : `${liftFloors.length} давхар тохируулсан`
              }
              control={
                <>
                  {liftEnabled ? (
                    <>
                      <MTextInput
                        placeholder="1-3,5,7"
                        value={liftBulkInput}
                        onChange={(e) => setLiftBulkInput(e.currentTarget.value)}
                        className="w-28"
                      />
                      <button
                        type="button"
                        className="stg-btn stg-btn-ghost stg-btn-icon"
                        onClick={handleDeleteAllFloors}
                        title="Бүгдийг устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}
                  <Switch
                    checked={liftEnabled}
                    onChange={(event) => {
                      const enabled = event.currentTarget.checked;
                      setLiftEnabled(enabled);
                      if (!enabled) {
                        saveLiftSettings(null);
                      }
                    }}
                    label="Лифт идэвхжүүлэх"
                  />
                </>
              }
            />

            <SettingsItem
              id="nemelt-resident-gate-box"
              title="Оршин суугчийн хаалт нээх эрх"
              desc={
                residentGateOpenEnabled
                  ? "Оршин суугчийн гар утасны аппликейшн дээр хаалт нээх товч харагдана."
                  : "Оршин суугчийн гар утасны аппликейшн дээр хаалт нээх товч харагдахгүй."
              }
              control={
                <Switch
                  checked={residentGateOpenEnabled}
                  onChange={(e) => {
                    const val = e.currentTarget.checked;
                    setResidentGateOpenEnabled(val);
                    saveResidentGateOpenSettings(val);
                  }}
                  label="Хаалт нээх эрх идэвхжүүлэх"
                />
              }
            />

            <SettingsItem
              id="nemelt-gerbul-box"
              title="Гэр бүлийн гишүүн урих"
              desc={
                gerBuliinGishuunEnabled
                  ? "Оршин суугч аппаараа гэр бүлийн гишүүн урьж, гишүүн нь тоот, нэхэмжлэх, төлбөрийг харна."
                  : "Урих боломж хаагдсан. Шинэ урилга үүсэхгүй, бүртгэлтэй гишүүд хэвээр байна."
              }
              control={
                <Switch
                  checked={gerBuliinGishuunEnabled}
                  onChange={(e) =>
                    saveGerBuliinGishuunSettings(e.currentTarget.checked)
                  }
                  label="Гэр бүлийн гишүүн урих боломж идэвхжүүлэх"
                />
              }
            />
          </SettingsCard>

          {/* ── 3. Зогсоол болон зочин ────────────────────────────────── */}
          <SettingsCard
            id="nemelt-visitor-box"
            icon={<Car />}
            title="Зогсоол болон зочин"
            subtitle="Зочны эрх, машины хязгаар, граш болон агуулахын төлбөр"
            onSave={zogsoolKhesegKhadgalya}
            saving={khadgalj}
          >
            <SettingsItem
              title="Зочны тохиргоо"
              desc="Шинэ оршин суугчдад автоматаар зогсоолын эрх үүсгэх"
              control={
                <Switch
                  checked={guestConfigEnabled}
                  onChange={(e) => {
                    const val = e.currentTarget.checked;
                    setGuestConfigEnabled(val);
                    if (!val) saveGuestSettings(false);
                  }}
                  label="Зочны тохиргоо идэвхжүүлэх"
                />
              }
            >
              {guestConfigEnabled ? (
                <div className="stg-grid">
                  <SettingsField label="Давтамж">
                    <select
                      value={guestFrequencyType}
                      onChange={(e) => setGuestFrequencyType(e.target.value)}
                      className="stg-select"
                    >
                      <option value="udruur">Өдөр бүр</option>
                      <option value="7khonogoor">Долоо хоног бүр</option>
                      <option value="saraar">Сар бүр</option>
                      <option value="jileer">Жил бүр</option>
                    </select>
                  </SettingsField>

                  {guestFrequencyType === "saraar" ||
                  guestFrequencyType === "jileer" ? (
                    <SettingsField
                      label={
                        guestFrequencyType === "saraar"
                          ? "Хэдний өдөр"
                          : "Хэддүгээр сар"
                      }
                    >
                      <MNumberInput
                        value={
                          guestFrequencyValue === ""
                            ? undefined
                            : Number(guestFrequencyValue)
                        }
                        onChange={(val) =>
                          setGuestFrequencyValue(val !== "" ? val : "")
                        }
                        placeholder={
                          guestFrequencyType === "saraar" ? "1-31" : "1-12"
                        }
                        min={1}
                        max={guestFrequencyType === "saraar" ? 31 : 12}
                        size="sm"
                        className="w-full"
                      />
                    </SettingsField>
                  ) : null}

                  <SettingsField label="Нэхэмжлэх дээр нэмэх эсэх">
                    <div className="stg-subrow">
                      <span className="stg-subrow-text">
                        {guestInvoiceEnabled
                          ? 'Идэвхтэй ("Би даана")'
                          : "Зочин өөрөө төлнө"}
                      </span>
                      <Switch
                        checked={guestInvoiceEnabled}
                        onChange={(e) =>
                          setGuestInvoiceEnabled(e.currentTarget.checked)
                        }
                        label="Нэхэмжлэх дээр нэмэх"
                        size="sm"
                      />
                    </div>
                  </SettingsField>

                  <SettingsField label="Эрхийн тоо">
                    <MNumberInput
                      value={guestLimit === "" ? undefined : Number(guestLimit)}
                      onChange={(val) => setGuestLimit(val !== "" ? val : "")}
                      placeholder="0"
                      min={0}
                      size="sm"
                      className="w-full"
                    />
                  </SettingsField>

                  <SettingsField label="Үнэгүй минут (тус бүр)">
                    <MNumberInput
                      value={
                        guestFreeMinutes === ""
                          ? undefined
                          : Number(guestFreeMinutes)
                      }
                      onChange={(val) =>
                        setGuestFreeMinutes(val !== "" ? val : "")
                      }
                      placeholder="0"
                      min={0}
                      size="sm"
                      className="w-full"
                    />
                  </SettingsField>
                </div>
              ) : null}
            </SettingsItem>

            <SettingsItem
              id="nemelt-mashin-box"
              title="Машины бүртгэлийн хязгаар"
              desc="Нэг оршин суугч / харилцагч дээр бүртгэж болох машины дээд тоо. Бүх оршин суугчид ижил хамаарна."
              control={
                <MNumberInput
                  value={
                    residentCarLimit === ""
                      ? undefined
                      : Number(residentCarLimit)
                  }
                  onChange={(val) => setResidentCarLimit(val !== "" ? val : "")}
                  placeholder="1"
                  min={1}
                  size="sm"
                  className="w-20"
                />
              }
            />

            <SettingsItem
              id="nemelt-garage-storage-box"
              title="Агуулах төлбөр бодох арга"
              desc="Граш болон агуулахын төлбөрийг нэгтгэсэн байдлаар тооцно"
              control={
                <Switch
                  checked={garagePaymentEnabled || storagePaymentEnabled}
                  onChange={(e) => {
                    const val = e.currentTarget.checked;
                    setGaragePaymentEnabled(val);
                    setStoragePaymentEnabled(val);
                    if (!val) saveCombinedPaymentSettings(false);
                  }}
                  label="Граж, агуулах төлбөр идэвхжүүлэх"
                />
              }
            >
              {garagePaymentEnabled || storagePaymentEnabled ? (
                <>
                  <div className="stg-grid">
                    <SettingsField label="Граш төлбөр">
                      <MNumberInput
                        value={
                          garagePaymentValue === ""
                            ? undefined
                            : Number(garagePaymentValue)
                        }
                        onChange={(val) =>
                          setGaragePaymentValue(val !== "" ? val : "")
                        }
                        placeholder="0"
                        min={0}
                        size="sm"
                        thousandSeparator=","
                        rightSection={<span className="stg-unit">₮</span>}
                        className="w-full"
                      />
                    </SettingsField>

                    <SettingsField label="Агуулах төлбөр">
                      <MNumberInput
                        value={
                          storagePaymentValue === ""
                            ? undefined
                            : Number(storagePaymentValue)
                        }
                        onChange={(val) =>
                          setStoragePaymentValue(val !== "" ? val : "")
                        }
                        placeholder="0"
                        min={0}
                        size="sm"
                        thousandSeparator=","
                        rightSection={<span className="stg-unit">₮</span>}
                        className="w-full"
                      />
                    </SettingsField>
                  </div>

                  <div className="stg-total">
                    <span className="stg-total-label">Нийт төлбөр</span>
                    <span className="stg-total-value">
                      {(
                        (Number(garagePaymentValue) || 0) +
                        (Number(storagePaymentValue) || 0)
                      ).toLocaleString()}{" "}
                      ₮
                    </span>
                  </div>
                </>
              ) : null}
            </SettingsItem>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
