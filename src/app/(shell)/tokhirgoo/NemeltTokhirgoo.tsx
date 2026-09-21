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
import { Trash2, Coins, CircleDollarSign } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import deleteMethod from "../../../../tools/function/deleteMethod";
import createMethod from "../../../../tools/function/createMethod";
import updateMethod from "../../../../tools/function/updateMethod";
import Button from "@/components/ui/Button";

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

      openSuccessOverlay("Нэхэмжлэх илгээх тохиргоог хадгаллаа");
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
        openSuccessOverlay(`Лифт ${floors.join(",")} давхарт тохируулагдлаа`);
      } else {
        openSuccessOverlay("Лифт хөнгөлөлтийг идэвхгүй болголоо");
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
      openSuccessOverlay("Амжилттай хадгаллаа");
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
        openSuccessOverlay("Грашийн төлбөрийн тохиргоо хадгалагдлаа");
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
        openSuccessOverlay("Агуулахын төлбөрийн тохиргоо хадгалагдлаа");
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
        openSuccessOverlay("Агуулах, гражийн төлбөрийн тохиргоо хадгалагдлаа");
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
        openSuccessOverlay("Амжилттай хадгаллаа");
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
        openSuccessOverlay("Оршин суугч хаалга нээх эрхийн тохиргоо хадгалагдлаа");
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
      openSuccessOverlay(
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
        openSuccessOverlay(
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
      openSuccessOverlay("Бүх лифт давхар устгагдлаа");
    } catch (e) {
      try {
        await saveLiftSettings(null, true);
      } catch (e2) {
        // ignore
      }
      openSuccessOverlay("Бүх лифт давхар устгагдлаа");
    }
  };

  return (
    <div
      id="nemelt-panel"
      className="w-full"
    >
      <div className="neu-panel allow-overflow p-4 md:p-5 pb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          {/* Invoice box */}
          <div id="nemelt-invoice-box" className="h-full">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden h-full flex flex-col justify-between">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-base text-theme">Нэхэмжлэх илгээх</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Сар бүрийн илгээх тохиргоо
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-theme">
                    {invoiceActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoiceActive}
                      onChange={(e) => {
                        const val = e.currentTarget.checked;
                        setInvoiceActive(val);
                        if (!val) saveInvoiceSchedule(false);
                      }}
                      className="sr-only peer"
                      aria-label="Нэхэмжлэх идэвхжүүлэх"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-purple-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              {invoiceActive ? (
                <div
                  id="nemelt-invoice-settings"
                  className="p-3.5 px-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10 flex-1 flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs text-theme block">
                      Илгээх өдөр (сар бүр)
                    </label>
                    <div className="flex items-center gap-2">
                      <MNumberInput
                        min={1}
                        max={31}
                        placeholder="1-31"
                        value={invoiceDay ?? undefined}
                        onChange={(v) => setInvoiceDay((v as number) ?? null)}
                        className="flex-1"
                        size="sm"
                      />
                      <Button
                        id="nemelt-invoice-save"
                        onClick={() => saveInvoiceSchedule()}
                        variant="primary"
                        size="sm"
                        className="whitespace-nowrap !rounded-xl px-4 py-1.5 text-xs"
                      >
                        Хадгалах
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[color:var(--muted-text)]">
                    Сар бүрийн хэдний өдөр нэхэмжлэх илгээх
                  </p>
                </div>
              ) : (
                <div className="p-3.5 px-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10 flex-1 flex items-center">
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Нэхэмжлэх автоматаар илгээх тохиргоо идэвхгүй байна.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lift box */}
          <div id="nemelt-lift-settings" className="h-full">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden h-full flex flex-col justify-between">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-base text-theme">Лифт хөнгөлөлт</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {liftFloors.length} давхар тохируулсан
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-theme">
                    {liftEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liftEnabled}
                      onChange={(event) => {
                        const enabled = event.currentTarget.checked;
                        setLiftEnabled(enabled);
                        if (!enabled) {
                          saveLiftSettings(null);
                        }
                      }}
                      className="sr-only peer"
                      aria-label="Лифт идэвхжүүлэх"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600 dark:peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {liftEnabled ? (
                <div className="p-3.5 px-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-xs text-theme flex items-center gap-1.5">
                      <span>🔢</span>
                      Давхар тохиргоо
                    </label>

                    <div className="flex items-center gap-2">
                      <MTextInput
                        placeholder="1-3,5,7 эсвэл 1,2,3"
                        value={liftBulkInput}
                        onChange={(e) =>
                          setLiftBulkInput(e.currentTarget.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        id="nemelt-lift-save"
                        variant="primary"
                        size="sm"
                        onClick={handleSaveFloors}
                        className="whitespace-nowrap !rounded-xl px-4 py-1.5 text-xs"
                      >
                        Хадгалах
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteAllFloors}
                        title="Бүгдийг устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[color:var(--muted-text)]">
                    Жишээ: 1-3, 5, 7 эсвэл 1, 2, 3
                  </p>
                </div>
              ) : (
                <div className="p-3.5 px-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 flex-1 flex items-center">
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Лифт хөнгөлөлтийн тохиргоо идэвхгүй байна.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visitor Configuration Box */}
        <div id="nemelt-visitor-box">
          <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="flex items-center gap-2.5">
                <div>
                  <h3 className="text-base text-theme">Зочны тохиргоо</h3>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Шинэ оршин суугчдад автоматаар оноогдох тохиргоо
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-theme">
                  {guestConfigEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guestConfigEnabled}
                    onChange={(e) => {
                      const val = e.currentTarget.checked;
                      setGuestConfigEnabled(val);
                      if (!val) saveGuestSettings(false);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-blue-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {guestConfigEnabled && (
              <div className="p-3.5 px-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <div className="space-y-1">
                    <label className="text-xs text-theme">Давтамж</label>
                    <div className="flex gap-2">
                      <select
                        value={guestFrequencyType}
                        onChange={(e) => setGuestFrequencyType(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="udruur">Өдөр бүр</option>
                        <option value="7khonogoor">Долоо хоног бүр</option>
                        <option value="saraar">Сар бүр</option>
                        <option value="jileer">Жил бүр</option>
                      </select>
                      {(guestFrequencyType === "saraar" ||
                        guestFrequencyType === "jileer") && (
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
                              guestFrequencyType === "saraar" ? "1-31 өдөр" : "1-12 сар"
                            }
                            min={1}
                            max={guestFrequencyType === "saraar" ? 31 : 12}
                            size="sm"
                            className="w-28 shrink-0"
                          />
                        )}
                    </div>
                  </div>

                  {/* Төлбөрийг эзэн даах боломжтой эсэх */}
                  <div className="space-y-1">
                    <label className="text-xs text-theme">
                      Нэхэмжлэх дээр нэмэх эсэх
                    </label>
                    <div
                      className="h-9 px-3 flex items-center justify-between rounded-lg border border-gray-300 bg-white text-xs dark:bg-gray-800 dark:border-gray-700"
                      title={
                        guestInvoiceEnabled
                          ? 'Оршин суугч зочин урихдаа "Би даана" сонгож, зогсоолын төлбөрийг өөрийн нэхэмжлэхэд бичүүлж болно.'
                          : 'Унтраалттай — зочин зогсоолын төлбөрөө өөрөө төлнө. Апп дээр "Би даана" сонголт харагдахгүй.'
                      }
                    >
                      <span className="text-xs text-[color:var(--muted-text)] truncate mr-2">
                        {guestInvoiceEnabled
                          ? 'Идэвхтэй ("Би даана")'
                          : 'Зочин өөрөө төлнө'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={guestInvoiceEnabled}
                          onChange={(e) =>
                            setGuestInvoiceEnabled(e.currentTarget.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-blue-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-theme">Эрхийн тоо</label>
                    <MNumberInput
                      value={guestLimit === "" ? undefined : Number(guestLimit)}
                      onChange={(val) => setGuestLimit(val !== "" ? val : "")}
                      placeholder="0"
                      min={0}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-theme">
                      Үнэгүй минут (тус бүр)
                    </label>
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
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    onClick={() => saveGuestSettings()}
                    variant="primary"
                    size="sm"
                    className="!rounded-xl px-4 py-1 text-xs"
                  >
                    Хадгалах
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Машины бүртгэлийн хязгаар — зочны тохиргооноос хамааралгүй, бүх
            оршин суугч/харилцагчид ижил хамаарна */}
        <div id="nemelt-mashin-box">
          <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20">
              <h3 className="text-base text-theme">Машины бүртгэлийн хязгаар</h3>
              <p className="text-xs text-[color:var(--muted-text)]">
                Нэг оршин суугч / харилцагч дээр бүртгэж болох машины дээд тоо
              </p>
            </div>

            <div className="p-3.5 px-4 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/10 dark:to-fuchsia-950/10 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-xs text-theme">
                    Машины дээд тоо (оршин суугч тус бүрд)
                  </label>
                  <MNumberInput
                    value={
                      residentCarLimit === ""
                        ? undefined
                        : Number(residentCarLimit)
                    }
                    onChange={(val) =>
                      setResidentCarLimit(val !== "" ? val : "")
                    }
                    placeholder="1"
                    min={1}
                    size="sm"
                    className="w-full"
                  />
                  <p className="text-[11px] text-[color:var(--muted-text)]">
                    Жишээ: 3 гэж тохируулбал оршин суугч аппаараа 3 машин
                    бүртгэж, бүгдийг нь харна. Бүх оршин суугчид ижил хамаарна.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={saveResidentCarLimit}
                    variant="primary"
                    size="sm"
                    className="!rounded-xl px-4 py-1 text-xs"
                  >
                    Хадгалах
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Цахилгаан бодох горим - Урт тайлбартай тохиргоо бүтэн мөрөөр байршина */}
        <div id="nemelt-tsakhilgaan-box">
          <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20">
              <div className="flex items-center gap-2.5">
                <div>
                  <h3 className="text-base text-theme">
                    Заалтаар цахилгаан бодох
                  </h3>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Цахилгааны төлбөрийг заалтаас бодох эсвэл дүнг нь шууд
                    оруулах
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-theme">
                  {zaaltaarBodokh ? "Идэвхтэй" : "Идэвхгүй"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zaaltaarBodokh}
                    onChange={(e) =>
                      saveZaaltaarBodokhSettings(e.currentTarget.checked)
                    }
                    className="sr-only peer"
                    aria-label="Заалтаар цахилгаан бодох"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-sky-600 peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>

            <div className="p-3.5 px-4 bg-gradient-to-br from-sky-50/50 to-cyan-50/50 dark:from-sky-950/10 dark:to-cyan-950/10 space-y-1.5">
              {zaaltaarBodokh ? (
                <>
                  <p className="text-xs text-theme leading-relaxed">
                    Тоолуурын Өдөр, Шөнө, Өмнөх заалтыг
                    Excel-ээр оруулна. Зөрүүг кВт тарифаар үржүүлж систем өөрөө
                    бодно.
                  </p>
                  <p className="text-[11px] text-[color:var(--muted-text)]">
                    Гүйлгээний түүх хуудасны Заалт цэснээс «Заалт татах»,
                    «Заалтын жагсаалт татах» боломжтой.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-theme leading-relaxed">
                    Систем цахилгааныг бодохгүй. Та тоот тус бүрийн
                    эцсийн дүнг Excel-д бичиж оруулах ба тэр дүн шууд{" "}
                    Цахилгаан төлбөр болно.
                  </p>
                  <p className="text-[11px] text-[color:var(--muted-text)]">
                    Гүйлгээний түүх хуудасны Цахилгаан цэснээс «Цахилгаан
                    татах»-аар загварыг аваад, дүнг бөглөж буцаан оруулна.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2x2 Grid: Хаалт нээх эрх, Төлбөр тооцох арга, Грашийн төлбөр, Агуулахын төлбөр */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Row 1, Col 1: Resident Gate Open Permission Box */}
          <div id="nemelt-resident-gate-box" className="h-full">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden h-full flex flex-col justify-between">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-base text-theme">
                      Оршин суугчийн хаалт нээх эрх
                    </h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Оршин суугчийн аппликейшн дээр хаалт нээх товч харуулах эсэх
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-theme">
                    {residentGateOpenEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={residentGateOpenEnabled}
                      onChange={(e) => {
                        const val = e.currentTarget.checked;
                        setResidentGateOpenEnabled(val);
                        saveResidentGateOpenSettings(val);
                      }}
                      className="sr-only peer"
                      aria-label="Хаалт нээх эрх идэвхжүүлэх"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-rose-600 peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>
              <div className="p-3.5 px-4 bg-gradient-to-br from-rose-50/50 to-red-50/50 dark:from-rose-950/10 dark:to-red-950/10 flex-1 flex items-center">
                <p className="text-xs text-[color:var(--muted-text)]">
                  {residentGateOpenEnabled
                    ? "Оршин суугчийн гар утасны аппликейшн дээр хаалт нээх товч идэвхтэй харагдана."
                    : "Оршин суугчийн гар утасны аппликейшн дээр хаалт нээх товч харагдахгүй."}
                </p>
              </div>
            </div>
          </div>

          {/* Гэр бүлийн гишүүн урих боломж */}
          <div id="nemelt-gerbul-box" className="h-full">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden h-full flex flex-col justify-between">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-base text-theme">
                      Гэр бүлийн гишүүн урих
                    </h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Оршин суугч аппаараа гэр бүлийнхээ гишүүдийг урих эсэх
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-theme">
                    {gerBuliinGishuunEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gerBuliinGishuunEnabled}
                      onChange={(e) =>
                        saveGerBuliinGishuunSettings(e.currentTarget.checked)
                      }
                      className="sr-only peer"
                      aria-label="Гэр бүлийн гишүүн урих боломж идэвхжүүлэх"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-indigo-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
              <div className="p-3.5 px-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/10 dark:to-blue-950/10 flex-1 flex items-center">
                <p className="text-xs text-[color:var(--muted-text)]">
                  {gerBuliinGishuunEnabled
                    ? "Оршин суугч аппаараа гэр бүлийн гишүүн урьж, гишүүн нь тоот, нэхэмжлэх, төлбөрийг харна."
                    : "Урих боломж хаагдсан. Шинэ урилга үүсэхгүй, хүлээгдэж байсан урилга ч баталгаажихгүй. Бүртгэлтэй гишүүд хэвээр байна."}
                </p>
              </div>
            </div>
          </div>

          {/* Row 1, Col 2: Calculation Method Box */}
          <div id="nemelt-calculation-box" className="h-full">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden h-full flex flex-col justify-between">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-base text-theme">Төлбөр тооцох арга</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Сарын төлбөрийг хоногоор хувааж тооцох тохиргоо
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-theme">
                    {calculationEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calculationEnabled}
                      onChange={(e) => {
                        const val = e.currentTarget.checked;
                        setCalculationEnabled(val);
                        if (!val) saveCalculationSettings(false);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-green-600 peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {calculationEnabled ? (
                <div className="p-3.5 px-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10 space-y-3 animate-in fade-in zoom-in-95 duration-300 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="space-y-1.5">
                      <label className="text-xs text-theme">
                        Тооцоолох төрөл
                      </label>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit shrink-0">
                          <button
                            onClick={() => setCalculationMethod("Хуанли")}
                            className={`px-3.5 py-1 rounded-md text-xs transition-all ${calculationMethod === "Хуанли"
                              ? "bg-white dark:bg-gray-700 shadow-xs text-green-600"
                              : "text-gray-500 hover:text-gray-700"
                              }`}
                          >
                            Хуанли
                          </button>
                          <button
                            onClick={() => setCalculationMethod("Тогтмол")}
                            className={`px-3.5 py-1 rounded-md text-xs transition-all ${calculationMethod === "Тогтмол"
                              ? "bg-white dark:bg-gray-700 shadow-xs text-green-600"
                              : "text-gray-500 hover:text-gray-700"
                              }`}
                          >
                            Тогтмол
                          </button>
                        </div>

                        {calculationMethod === "Тогтмол" && (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                            <span className="text-xs text-theme whitespace-nowrap">
                              Сарын тогтмол хоног:
                            </span>
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
                              size="xs"
                              className="w-28"
                              styles={{
                                input: {
                                  height: 28,
                                  minHeight: 28,
                                  fontSize: "12px",
                                },
                              }}
                            />
                            <span className="text-xs text-[color:var(--muted-text)]">хоног</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-[color:var(--muted-text)]">
                        {calculationMethod === "Хуанли"
                          ? "Тухайн сарын нийт хоногт хувааж бодно (28, 30, 31)"
                          : "Заасан хоногт тогтмол хувааж бодно"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end border-t border-[color:var(--surface-border)]/50">
                    <Button
                      onClick={() => saveCalculationSettings()}
                      variant="primary"
                      size="sm"
                      className="!rounded-xl px-5 py-1 text-xs"
                    >
                      Хадгалах
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 px-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10 flex-1 flex items-center">
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Сарын төлбөрийг хоногоор хувааж тооцох тохиргоо идэвхгүй байна.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Unified Garage & Storage Payment Box */}
          <div id="nemelt-garage-storage-box" className="sm:col-span-2">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-3">

                  <div>
                    <h3 className="text-base text-theme">
                      Агуулах төлбөр бодох арга
                    </h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Агуулах төлбөрийг граш болон агуулах нэгтгэсэн байдлаар тооцно.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-theme">
                    {garagePaymentEnabled || storagePaymentEnabled
                      ? "Идэвхтэй"
                      : "Идэвхгүй"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={garagePaymentEnabled || storagePaymentEnabled}
                      onChange={(e) => {
                        const val = e.currentTarget.checked;
                        setGaragePaymentEnabled(val);
                        setStoragePaymentEnabled(val);
                        if (!val) saveCombinedPaymentSettings(false);
                      }}
                      className="sr-only peer"
                      aria-label="Граж, агуулах төлбөр идэвхжүүлэх"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 dark:peer-checked:bg-blue-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {garagePaymentEnabled || storagePaymentEnabled ? (
                <div className="p-3.5 px-4 bg-gradient-to-br from-blue-50/40 to-indigo-50/40 dark:from-blue-950/10 dark:to-indigo-950/10 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-3 md:p-3.5 rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-white/90 dark:bg-gray-800/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 shadow-xs">
                    {/* Left: Inputs with Plus */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Граш төлбөр */}
                      <div className="space-y-1 flex-1 min-w-[110px]">
                        <label className="text-xs text-theme">
                          Граш төлбөр
                        </label>
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
                          rightSection={
                            <span className="text-xs text-gray-500 mr-1 select-none">
                              ₮
                            </span>
                          }
                          className="w-full"
                        />
                      </div>

                      {/* + icon */}
                      <div className="flex items-center justify-center pt-5 shrink-0">

                      </div>

                      {/* Агуулах төлбөр */}
                      <div className="space-y-1 flex-1 min-w-[110px]">
                        <label className="text-xs text-theme">
                          Агуулах төлбөр
                        </label>
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
                          rightSection={
                            <span className="text-xs text-gray-500 mr-1 select-none">
                              ₮
                            </span>
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Right: Total display */}
                    <div className="flex items-center justify-between gap-2.5 px-3.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/40 shrink-0 self-center md:self-end md:mb-0.5 h-9 min-w-[180px]">
                      <span className="text-xs text-[color:var(--muted-text)] whitespace-nowrap">
                        Нийт төлбөр:
                      </span>
                      <span className="text-xs text-theme whitespace-nowrap">
                        {(
                          (Number(garagePaymentValue) || 0) +
                          (Number(storagePaymentValue) || 0)
                        ).toLocaleString()}{" "}
                        ₮
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Button
                      onClick={() => saveCombinedPaymentSettings()}
                      variant="primary"
                      size="sm"
                      className="!rounded-xl px-5 py-1 text-xs"
                    >
                      Хадгалах
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 px-4 bg-gradient-to-br from-blue-50/40 to-indigo-50/40 dark:from-blue-950/10 dark:to-indigo-950/10 flex-1 flex items-center">
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Граж болон агуулахын төлбөр тооцоо идэвхгүй байна.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
