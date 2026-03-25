"use client";

import React, { useState, useEffect } from "react";
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
import { Trash2 } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import deleteMethod from "../../../tools/function/deleteMethod";
import createMethod from "../../../tools/function/createMethod";
import Button from "@/components/ui/Button";

export default function NemeltTokhirgoo() {
  const { token, ajiltan, barilgiinId, baiguullaga, baiguullagaMutate } =
    useAuth();
  const { selectedBuildingId } = useBuilding();
  const { showSpinner, hideSpinner } = useSpinner();

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
  const [guestTotalFreeMinutes, setGuestTotalFreeMinutes] = useState<
    number | string
  >("");
  const [guestNote, setGuestNote] = useState<string>("");
  const [guestFrequencyType, setGuestFrequencyType] =
    useState<string>("saraar");
  const [guestFrequencyValue, setGuestFrequencyValue] = useState<
    number | string
  >("");
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

  const saveInvoiceSchedule = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!invoiceDay || invoiceDay < 1 || invoiceDay > 31) {
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
          idevkhitei: invoiceActive,
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
    setGuestTotalFreeMinutes(find("zochinNiitUneguiMinut", ""));
    setGuestNote(find("zochinTailbar", ""));
    setGuestFrequencyType(find("davtamjiinTurul", "saraar"));
    setGuestFrequencyValue(find("davtamjUtga", ""));
  }, [baiguullaga, selectedBuildingId, barilgiinId]);

  const fetchGuestSettings = async () => {
    // legacy fetcher removed, now handled by the reactive effect above
    await baiguullagaMutate();
  };

  const saveGuestSettings = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
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

      // 2. Prepare schema-compliant configuration
      const zochinTokhirgoo = {
        zochinUrikhEsekh: !!guestConfigEnabled,
        zochinTurul: "Оршин суугч",
        zochinErkhiinToo: Number(guestLimit) || 0,
        zochinTusBurUneguiMinut: Number(guestFreeMinutes) || 0,
        zochinNiitUneguiMinut: Number(guestTotalFreeMinutes) || 0,
        zochinTailbar: guestNote || "",
        davtamjiinTurul: guestFrequencyType,
        davtamjUtga: Number(guestFrequencyValue) || null,
      };

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
                zochinTokhirgoo: zochinTokhirgoo,
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
          zochinTokhirgoo: zochinTokhirgoo,
        };
      }

      // Use createMethod to perform a POST update (project convention for configs)
      const result = await createMethod(
        `baiguullaga/${freshOrg._id}`,
        token,
        payload,
      );

      if (result?.data) {
        openSuccessOverlay("Зочны тохиргоо хадгалагдлаа");
        const finalData = result.data.result || result.data;
        await baiguullagaMutate(finalData, false);
        await baiguullagaMutate();
      } else {
        throw new Error("Хадгалахад алдаа гарлаа");
      }
    } catch (error: any) {
      openErrorOverlay(
        error?.message || "Зочны тохиргоо хадгалахад алдаа гарлаа",
      );
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
      className="xxl:col-span-9 col-span-12 lg:col-span-12 h-[82vh]"
    >
      <div className="neu-panel allow-overflow p-4 md:p-6 pb-20 space-y-6 h-full overflow-auto custom-scrollbar">
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-6">
          {/* Invoice box */}
          <div id="nemelt-invoice-box" className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg  text-theme">Нэхэмжлэх илгээх</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Сар бүрийн илгээх тохиргоо
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm  text-theme">
                    {invoiceActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoiceActive}
                      onChange={(e) =>
                        setInvoiceActive(e.currentTarget.checked)
                      }
                      className="sr-only peer"
                      aria-label="Нэхэмжлэх идэвхжүүлэх"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 dark:peer-checked:bg-purple-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              {invoiceActive && (
                <div
                  id="nemelt-invoice-settings"
                  className="p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10"
                >
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="text-sm  text-theme mb-2 block">
                        Илгээх өдөр (сар бүр)
                      </label>
                      <MNumberInput
                        min={1}
                        max={31}
                        placeholder="1-31"
                        value={invoiceDay ?? undefined}
                        onChange={(v) => setInvoiceDay((v as number) ?? null)}
                        className="w-full"
                        size="md"
                      />
                    </div>
                    <Button
                      id="nemelt-invoice-save"
                      onClick={saveInvoiceSchedule}
                      variant="primary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Хадгалах
                    </Button>
                  </div>
                  <p className="text-xs text-[color:var(--muted-text)] mt-2">
                    Сар бүрийн хэдний өдөр нэхэмжлэх илгээх
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lift box */}
          <div id="nemelt-lift-settings" className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg  text-theme">Лифт хөнгөлөлт</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {liftFloors.length} давхар тохируулсан
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm  text-theme">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600 dark:peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {liftEnabled && (
                <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm  text-theme flex items-center gap-2">
                      <span className="text-lg">🔢</span>
                      Давхар тохиргоо
                    </label>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Жишээ: 1 эсвэл 1-3 эсвэл 1,2,3
                    </p>

                    <div className="flex items-center gap-3">
                      <MTextInput
                        placeholder="1-3,5,7 эсвэл 1,2,3"
                        value={liftBulkInput}
                        onChange={(e) =>
                          setLiftBulkInput(e.currentTarget.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteAllFloors}
                        title="Бүгдийг устгах"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[color:var(--surface-border)]">
                    <p className="text-sm  text-theme mb-3">
                      Тохируулсан давхарууд:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {liftFloors && liftFloors.length > 0 ? (
                        liftFloors.map((f) => (
                          <div
                            key={f}
                            className="inline-flex items-center px-4 py-2 rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 shadow-sm"
                          >
                            <span className="text-theme ">{f}</span>
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center py-6">
                          <p className="text-sm text-[color:var(--muted-text)]">
                            Давхар тохируулаагүй байна
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visitor Configuration Box - Now Below */}
        <div id="nemelt-visitor-box" className="mt-6">
          <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg text-theme">Зочны тохиргоо</h3>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Шинэ оршин суугчдад автоматаар оноогдох тохиргоо
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm  text-theme">
                  {guestConfigEnabled ? "Идэвхтэй" : "Идэвхгүй"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guestConfigEnabled}
                    onChange={(e) =>
                      setGuestConfigEnabled(e.currentTarget.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 dark:peer-checked:bg-blue-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {guestConfigEnabled && (
              <div className="p-5 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm  text-theme">Давтамж</label>
                    <select
                      value={guestFrequencyType}
                      onChange={(e) => setGuestFrequencyType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="udruur">Өдөр бүр</option>
                      <option value="7khonogoor">Долоо хоног бүр</option>
                      <option value="saraar">Сар бүр</option>
                      <option value="jileer">Жил бүр</option>
                    </select>
                  </div>

                  {(guestFrequencyType === "saraar" ||
                    guestFrequencyType === "jileer") && (
                    <div className="space-y-1">
                      <label className="text-sm  text-theme">
                        {guestFrequencyType === "saraar"
                          ? "Сар бүрийн хэдэн"
                          : "Жил бүрийн хэддүгээр сар"}
                      </label>
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
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm  text-theme">Эрхийн тоо</label>
                    <MNumberInput
                      value={guestLimit === "" ? undefined : Number(guestLimit)}
                      onChange={(val) => setGuestLimit(val !== "" ? val : "")}
                      placeholder="0"
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm  text-theme">
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
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm  text-theme">
                      Нийт үнэгүй минут
                    </label>
                    <MNumberInput
                      value={
                        guestTotalFreeMinutes === ""
                          ? undefined
                          : Number(guestTotalFreeMinutes)
                      }
                      onChange={(val) =>
                        setGuestTotalFreeMinutes(val !== "" ? val : "")
                      }
                      placeholder="0"
                      min={0}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm  text-theme">Тайлбар</label>
                  <MTextInput
                    value={guestNote}
                    onChange={(e) => setGuestNote(e.currentTarget.value)}
                    placeholder="Жишээ: Оршин суугчийн зочин"
                    className="w-full"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={saveGuestSettings}
                    variant="primary"
                    size="sm"
                    className="!rounded-2xl"
                  >
                    Хадгалах
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
