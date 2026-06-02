import React, { useCallback } from "react";
import { useSWRConfig } from "swr";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay, openWarningOverlay } from "@/components/ui/ErrorOverlay";
import uilchilgee, { getErrorMessage } from "@/lib/uilchilgee";
import createMethod from "../../tools/function/createMethod";
import updateMethod from "../../tools/function/updateMethod";
import deleteMethod from "../../tools/function/deleteMethod";
import {
  isValidName,
  isValidRegister,
  areValidPhones,
  explainRegisterRule,
  explainPhoneRule,
} from "@/lib/validation";

export function useGereeActions(
  token: string | null,
  ajiltan: any,
  barilgiinId: string | undefined,
  selectedBuildingId: string | undefined,
  baiguullaga: any,
  baiguullagaMutate: any,
  setIsSavingUnits?: (saving: boolean) => void,
  selectedOrts?: string,
  composeKey?: (orts: string, floor: string) => string,
  setShowResidentModal?: (show: boolean) => void,
  setShowEmployeeModal?: (show: boolean) => void,
  setShowClientModal?: (show: boolean) => void,
  setNewResident?: (resident: any) => void,
  setNewEmployee?: (employee: any) => void,
  setNewClient?: (client: any) => void,
  setEditingResident?: (resident: any | null) => void,
  setEditingEmployee?: (employee: any | null) => void,
  setEditingClient?: (client: any | null) => void,
  setIsUploadingResidents?: (uploading: boolean) => void,
  setIsUploadingUnits?: (uploading: boolean) => void,
  residentExcelInputRef?: React.RefObject<HTMLInputElement | null>,
  unitExcelInputRef?: React.RefObject<HTMLInputElement | null>,
  selectedBuildingIdForActions?: string | undefined,
  setShowPreviewModal?: (show: boolean) => void,
  setPreviewTemplate?: (template: any) => void,
  setShowInvoicePreviewModal?: (show: boolean) => void,
  setInvoicePreviewData?: (data: any) => void,
  onLoadingChange?: (loading: boolean) => void,
  contracts?: any[],
  sortKey?: string,
  setSortKey?: (key: any) => void,
  sortOrder?: "asc" | "desc",
  setSortOrder?: (order: "asc" | "desc") => void,
) {
  const { mutate } = useSWRConfig();

  const handleCreateResident = useCallback(
    async (e: React.FormEvent, newResident: any, editingResident: any) => {
      e.preventDefault();

      if (
        !isValidName(newResident.ner) ||
        (String(newResident.ovog || "").trim() !== "" &&
          !isValidName(newResident.ovog))
      ) {
        openErrorOverlay(
          "Нэр зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой). Овог хоосон байж болно.",
        );
        return;
      }

      const _newResReg = String(newResident.register || "").trim();
      if (_newResReg !== "" && !isValidRegister(newResident.register)) {
        openErrorOverlay(explainRegisterRule());
        return;
      }

      if (!areValidPhones(newResident.utas || [])) {
        openErrorOverlay(explainPhoneRule());
        return;
      }

      try {
        const firstPhone = Array.isArray(newResident.utas)
          ? newResident.utas.find((p: any) => String(p || "").trim() !== "") ||
          ""
          : String(newResident.utas || "");

        // Find the selected building from baiguullaga
        const effectiveBid =
          selectedBuildingIdForActions || selectedBuildingId || barilgiinId;
        const selectedBarilga = baiguullaga?.barilguud?.find(
          (b: any) => String(b._id || b.id) === String(effectiveBid),
        );

        // Unit validation: Ensure the toot exists in the building configuration
        const davkhariinToonuud = selectedBarilga?.tokhirgoo?.davkhariinToonuud;
        if (davkhariinToonuud && typeof davkhariinToonuud === "object") {
          const o = String(newResident.orts || "").trim();
          const f = String(newResident.davkhar || "").trim();
          const key = composeKey ? composeKey(o, f) : f;

          // Use the same splitting logic as the data layer
          const getUnitsAsArray = (val: any): string[] => {
            if (Array.isArray(val)) {
              return val.flatMap((v) =>
                String(v)
                  .split(/[\s,;|]+/)
                  .filter(Boolean),
              );
            }
            if (typeof val === "string")
              return val.split(/[\s,;|]+/).filter(Boolean);
            return [];
          };

          const validUnits = [
            ...getUnitsAsArray(davkhariinToonuud[key]),
            ...getUnitsAsArray(davkhariinToonuud[f]),
          ];

          if (validUnits.length > 0) {
            const inputToot = String(newResident.toot || "").trim();
            // Normalize comparison to handle special characters consistently with getTootOptions
            const normalize = (s: string) =>
              String(s || "").replace(/[^0-9A-Za-zА-Яа-яӨөҮүёЁ-]/g, "");
            const normInput = normalize(inputToot);

            const exists = validUnits.some(
              (u: any) => normalize(String(u)).trim() === normInput,
            );
            if (!exists) {
              openErrorOverlay(
                `"${inputToot}" тоот тухайн давхарт бүртгэлгүй байна. Тоот бүртгэлээс шалгана уу.`,
              );
              return false;
            }
          }
        }

        const payload: any = {
          ner: newResident.ner,
          ovog: newResident.ovog,
          register: newResident.register,
          utas: firstPhone,
          email: newResident.mail,
          mail: newResident.mail,
          khayag: newResident.khayag,
          turul: newResident.turul,
          baiguullagiinId: ajiltan?.baiguullagiinId,
          baiguullagiinNer: baiguullaga?.ner,
          erkh: "OrshinSuugch",
          taniltsuulgaKharakhEsekh: true,
          // Units (Multiple Units Support)
          units:
            Array.isArray(newResident.units) && newResident.units.length > 0
              ? newResident.units
              : [
                {
                  toot: newResident.toot || "",
                  davkhar: newResident.davkhar || "",
                  orts: newResident.orts || "1",
                  ekhniiUldegdel: newResident.ekhniiUldegdel || 0,
                  tsahilgaaniiZaalt: newResident.tsahilgaaniiZaalt || 0,
                  khonogoorBodokhEsekh:
                    newResident.khonogoorBodokhEsekh || false,
                  bodokhKhonog: newResident.bodokhKhonog || 0,
                },
              ],
          // Backward compatibility fields - pull from first unit if possible
          toot: newResident.units?.[0]?.toot || newResident.toot || "",
          davkhar: newResident.units?.[0]?.davkhar || newResident.davkhar || "",
          orts: newResident.units?.[0]?.orts || newResident.orts || "1",
          ekhniiUldegdel:
            newResident.units?.[0]?.ekhniiUldegdel ??
            (newResident.ekhniiUldegdel || 0),
          tsahilgaaniiZaalt:
            newResident.units?.[0]?.tsahilgaaniiZaalt ??
            (newResident.tsahilgaaniiZaalt || 0),
          khonogoorBodokhEsekh:
            newResident.units?.[0]?.khonogoorBodokhEsekh ??
            (newResident.khonogoorBodokhEsekh || false),
          bodokhKhonog: Number(
            newResident.units?.[0]?.bodokhKhonog ??
            (newResident.bodokhKhonog || 0),
          ),
          barilgiinId: selectedBarilga?._id || effectiveBid || "",
          bairniiNer: selectedBarilga?.ner || "",
          // Global settings
          tailbar: newResident.tailbar || "",
          duureg: newResident.duureg || selectedBarilga?.duureg || "",
          horoo: newResident.horoo || selectedBarilga?.horoo || "",
          soh: selectedBarilga?.tokhirgoo?.sohNer || "",
          sohNer: selectedBarilga?.tokhirgoo?.sohNer || "",
          // Temporary contract end date
          duusakhOgnoo:
            newResident.turul === "Түр"
              ? newResident.duusakhOgnoo || null
              : null,
        };

        if (editingResident?._id) {
          await updateMethod("orshinSuugch", token || "", {
            ...payload,
            _id: editingResident._id,
          });
        } else {
          await createMethod("orshinSuugchBurtgey", token || "", payload);
        }

        openSuccessOverlay(
          editingResident?._id
            ? "Оршин суугчийн мэдээлэл засагдлаа"
            : "Оршин суугч нэмэгдлээ",
        );

        // Ensure all resident-related lists refresh immediately across the app
        try {
          mutate(
            (key: any) =>
              Array.isArray(key) &&
              (key[0] === "/orshinSuugch" || key[0] === "/geree"),
            undefined,
            { revalidate: true },
          );
        } catch (_e) {
          // Best-effort cache refresh; ignore errors here
        }

        return true;
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
        return false;
      }
    },
    [
      token,
      ajiltan,
      baiguullaga,
      selectedBuildingIdForActions,
      barilgiinId,
      selectedBuildingId,
      composeKey,
      mutate,
    ],
  );

  const handleDeleteResident = useCallback(
    async (p: any) => {
      if (!token) {
        openErrorOverlay("Нэвтрэх шаардлагатай");
        return;
      }

      let residentId: string | undefined = undefined;
      if (p && typeof p === "object") {
        if (p._id !== undefined && p._id !== null) {
          residentId = String(p._id).trim();
        } else if (p.id !== undefined && p.id !== null) {
          residentId = String(p.id).trim();
        }
      }

      if (
        !residentId ||
        residentId === "" ||
        residentId === "undefined" ||
        residentId === "null"
      ) {
        openErrorOverlay("Оршин суугчийн ID олдсонгүй эсвэл буруу байна");
        return;
      }

      try {
        await deleteMethod("orshinSuugch", token, residentId);
        openSuccessOverlay("Устгагдлаа");
        return true;
      } catch (e) {
        openErrorOverlay("Устгахад алдаа гарлаа");
        return false;
      }
    },
    [token],
  );

  const handleEditResident = useCallback(
    async (
      p: any,
      setEditingResident: any,
      setNewResident: any,
      setShowResidentModal: any,
    ) => {
      setEditingResident(p);

      let ekhniiUldegdel = p.ekhniiUldegdel ?? p.medeelel?.ekhniiUldegdel ?? 0;

      // If ekhniiUldegdel is 0, attempt to fetch from invoice history
      if (ekhniiUldegdel === 0 && token && baiguullaga?._id) {
        try {
          const resp = await uilchilgee(token).get("/nekhemjlekhiinTuukh", {
            params: {
              baiguullagiinId: baiguullaga._id,
              barilgiinId: selectedBuildingId || barilgiinId || null,
              khuudasniiDugaar: 1,
              khuudasniiKhemjee: 100,
            },
          });

          const list = Array.isArray(resp.data?.jagsaalt)
            ? resp.data.jagsaalt
            : Array.isArray(resp.data)
              ? resp.data
              : [];

          // Find the latest invoice for this resident
          const residentInvoices = list.filter((item: any) => {
            const pNer = String(p.ner || "")
              .trim()
              .toLowerCase();
            const pOvog = String(p.ovog || "")
              .trim()
              .toLowerCase();
            const iNer = String(item.ner || "")
              .trim()
              .toLowerCase();
            const iOvog = String(item.ovog || "")
              .trim()
              .toLowerCase();

            return (
              (iNer === pNer && iOvog === pOvog) ||
              (item.register &&
                p.register &&
                String(item.register).trim() === String(p.register).trim())
            );
          });

          if (residentInvoices.length > 0) {
            const latest = residentInvoices[0];
            const zardluud = latest.medeelel?.zardluud || latest.zardluud || [];

            const ekhniiRow = zardluud.find((z: any) => {
              const name = String(z.ner || z.name || "").toLowerCase();
              return (
                z.isEkhniiUldegdel === true ||
                name.includes("эхний үлдэгдэл") ||
                name.includes("starting balance")
              );
            });

            if (ekhniiRow) {
              const val = Number(ekhniiRow.dun || ekhniiRow.tariff || 0);
              if (val > 0) {
                ekhniiUldegdel = val;
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch ekhniiUldegdel from history:", error);
        }
      }

      console.log(`[DEBUG] Opening Resident Modal:`, {
        name: `${p.ovog} ${p.ner}`,
        units: Array.isArray(p.toots)
          ? p.toots.map((t: any) => ({
            toot: t.toot,
            balance: t.ekhniiUldegdel,
          }))
          : "no toots",
      });
      setNewResident({
        ovog: p.ovog || "",
        ner: p.ner || "",
        register: p.register || "",
        utas: Array.isArray(p.utas)
          ? p.utas.map((u: any) => String(u))
          : p.utas
            ? [String(p.utas)]
            : [""],
        mail: p.mail || p.email || "",
        khayag: p.khayag || "",
        aimag: p.aimag || "Улаанбаатар",
        duureg: p.duureg || "",
        horoo: p.horoo || "",
        orts: p.orts || "",
        toot: p.toot || "",
        davkhar: p.davkhar || "",
        tsahilgaaniiZaalt: p.tsahilgaaniiZaalt ?? 0,
        turul: p.turul || "Үндсэн",
        tailbar: p?.tailbar || "",
        ekhniiUldegdel: ekhniiUldegdel ?? 0,
        khonogoorBodokhEsekh: p.khonogoorBodokhEsekh || false,
        bodokhKhonog: p.bodokhKhonog || 0,
        duusakhOgnoo: p.duusakhOgnoo
          ? new Date(p.duusakhOgnoo).toISOString().split("T")[0]
          : "",
        units:
          Array.isArray(p.toots) && p.toots.length > 0
            ? p.toots
              .filter((t: any) => {
                const currentBid = String(
                  selectedBuildingId || barilgiinId || "",
                );
                const tootBid = String(t.barilgiinId || "");
                return currentBid === tootBid;
              })
              .map((t: any) => ({
                orts: t.orts || "1",
                davkhar: t.davkhar || "",
                toot: t.toot || "",
                turul: t.turul || "Орон сууц",
                ekhniiUldegdel:
                  t.ekhniiUldegdel !== undefined && t.ekhniiUldegdel !== 0
                    ? t.ekhniiUldegdel
                    : ekhniiUldegdel || 0,
                tsahilgaaniiZaalt: t.tsahilgaaniiZaalt ?? 0,
                khonogoorBodokhEsekh: t.khonogoorBodokhEsekh || false,
                bodokhKhonog: t.bodokhKhonog || 0,
              }))
            : [
              {
                orts: p.orts || "1",
                davkhar: p.davkhar || "",
                toot: p.toot || "",
                turul: p.turul || "Орон сууц",
                ekhniiUldegdel: ekhniiUldegdel || 0,
                tsahilgaaniiZaalt: p.tsahilgaaniiZaalt || 0,
                khonogoorBodokhEsekh: p.khonogoorBodokhEsekh || false,
                bodokhKhonog: p.bodokhKhonog || 0,
              },
            ],
      });
      setShowResidentModal(true);
    },
    [token, baiguullaga, selectedBuildingId, barilgiinId],
  );

  const composeKeyFn = useCallback(
    (orts: string, floor: string) => {
      if (composeKey) return composeKey(orts, floor);
      const f = String(floor || "").trim();
      const o = String(orts || "").trim();
      return o ? `${o}::${f}` : f;
    },
    [composeKey],
  );

  const addUnit = useCallback(
    async (
      floor: string,
      values: string[],
      turul: "Тоот" | "Зогсоол" | "Агуулах" = "Тоот",
    ) => {
      const propName =
        turul === "Зогсоол"
          ? "davkhariinZogsoolnuud"
          : turul === "Агуулах"
            ? "davkhariinAguulakhnuud"
            : "davkhariinToonuud";
      if (!token || !baiguullaga?._id) {
        openErrorOverlay("Мэдээлэл дутуу байна");
        return;
      }

      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      if (!effectiveBarilgiinId) {
        openErrorOverlay("Барилга сонгоогүй байна");
        return;
      }

      setIsSavingUnits?.(true);
      try {
        // Fetch latest baiguullaga without building filters
        const orgResp = await uilchilgee(token).get(
          `/baiguullaga/${baiguullaga._id}`,
          {
            headers: { "X-Org-Only": "1" },
          },
        );
        const org = orgResp.data;
        const barilga = org.barilguud?.find(
          (b: any) => String(b._id || b.id) === String(effectiveBarilgiinId),
        );
        if (!barilga) {
          openErrorOverlay("Барилга олдсонгүй");
          return;
        }

        const getUnitsAsArray = (val: any): string[] => {
          if (Array.isArray(val)) {
            return val.flatMap((v) =>
              String(v)
                .split(/[\s,;|]+/)
                .filter(Boolean),
            );
          }
          if (typeof val === "string")
            return val.split(/[\s,;|]+/).filter(Boolean);
          return [];
        };

        const key = composeKeyFn(selectedOrts || "", floor);
        const existing = (barilga.tokhirgoo?.[propName] || {}) as Record<
          string,
          any
        >;
        const currentUnits = getUnitsAsArray(existing[key]);

        // Add new units, avoiding duplicates
        const newUnits = Array.from(
          new Set([...currentUnits, ...values.map(String)]),
        );

        const updatedBarilguud = org.barilguud.map((b: any) => {
          if (String(b._id || b.id) !== String(effectiveBarilgiinId)) return b;
          return {
            ...b,
            tokhirgoo: {
              ...(b.tokhirgoo || {}),
              [propName]: {
                ...existing,
                [key]: newUnits,
              },
            },
          };
        });

        const payload = {
          ...org,
          barilguud: updatedBarilguud,
        };

        await updateMethod("baiguullaga", token, payload);
        await baiguullagaMutate?.();
        openSuccessOverlay(`${turul} нэмэгдлээ`);
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
      } finally {
        setIsSavingUnits?.(false);
      }
    },
    [
      token,
      baiguullaga,
      selectedBuildingId,
      barilgiinId,
      baiguullagaMutate,
      setIsSavingUnits,
      selectedOrts,
      composeKeyFn,
    ],
  );

  const deleteUnit = useCallback(
    async (
      floor: string,
      unit: string,
      turul: "Тоот" | "Зогсоол" | "Агуулах" = "Тоот",
    ) => {
      const propName =
        turul === "Зогсоол"
          ? "davkhariinZogsoolnuud"
          : turul === "Агуулах"
            ? "davkhariinAguulakhnuud"
            : "davkhariinToonuud";
      if (!token || !baiguullaga?._id) {
        openErrorOverlay("Мэдээлэл дутуу байна");
        return;
      }

      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      if (!effectiveBarilgiinId) {
        openErrorOverlay("Барилга сонгоогүй байна");
        return;
      }

      setIsSavingUnits?.(true);
      try {
        const orgResp = await uilchilgee(token).get(
          `/baiguullaga/${baiguullaga._id}`,
          {
            headers: { "X-Org-Only": "1" },
          },
        );
        const org = orgResp.data;
        const barilga = org.barilguud?.find(
          (b: any) => String(b._id || b.id) === String(effectiveBarilgiinId),
        );
        if (!barilga) {
          openErrorOverlay("Барилга олдсонгүй");
          return;
        }

        const getUnitsAsArray = (val: any): string[] => {
          if (Array.isArray(val)) {
            return val.flatMap((v) =>
              String(v)
                .split(/[\s,;|]+/)
                .filter(Boolean),
            );
          }
          if (typeof val === "string")
            return val.split(/[\s,;|]+/).filter(Boolean);
          return [];
        };

        const key = composeKeyFn(selectedOrts || "", floor);
        const existing = (barilga.tokhirgoo?.[propName] || {}) as Record<
          string,
          any
        >;
        const currentUnits = getUnitsAsArray(existing[key]);
        const unitStr = String(unit).trim();
        const updatedUnits = currentUnits.filter(
          (u: string) => String(u).trim() !== unitStr,
        );

        if (currentUnits.length === updatedUnits.length) {
          openErrorOverlay(`${turul} олдсонгүй`);
          return;
        }

        // Check if there are active contracts for this unit
        if (contracts && Array.isArray(contracts)) {
          const hasActiveContract = contracts.some((c: any) => {
            const isCancelled =
              String(c.tuluv || c.status || "")
                .toLowerCase()
                .includes("цуцалсан") ||
              String(c.tuluv || c.status || "")
                .toLowerCase()
                .includes("идэвхгүй") ||
              String(c.tuluv || c.status || "").toLowerCase() === "tsutlsasan";
            const isActive = !isCancelled;

            if (!isActive) return false;

            const cFloor = String(c.davkhar || "").trim();
            const cToot = String(c.toot || "").trim();
            const cOrts = String(c.orts || "").trim();
            const selOrts = String(selectedOrts || "").trim();

            const floorMatch = cFloor === String(floor).trim();
            const tootMatch = cToot === unitStr;
            const ortsMatch = !selOrts || cOrts === "" || cOrts === selOrts;

            return floorMatch && tootMatch && ortsMatch;
          });

          if (hasActiveContract) {
            openErrorOverlay(
              "Энэ тоот дээр идэвхтэй гэрээ байна. Устгах боломжгүй.",
            );
            return;
          }
        }

        const updatedBarilguud = org.barilguud.map((b: any) => {
          if (String(b._id || b.id) !== String(effectiveBarilgiinId)) return b;
          return {
            ...b,
            tokhirgoo: {
              ...(b.tokhirgoo || {}),
              [propName]: {
                ...existing,
                [key]: updatedUnits,
              },
            },
          };
        });

        const payload = {
          ...org,
          barilguud: updatedBarilguud,
        };

        await updateMethod("baiguullaga", token, payload);
        await baiguullagaMutate?.();
        openSuccessOverlay(`${turul} устгагдлаа`);
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
      } finally {
        setIsSavingUnits?.(false);
      }
    },
    [
      token,
      baiguullaga,
      selectedBuildingId,
      barilgiinId,
      baiguullagaMutate,
      setIsSavingUnits,
      selectedOrts,
      composeKeyFn,
      contracts,
    ],
  );

  const deleteFloor = useCallback(
    async (floor: string, turul: "Тоот" | "Зогсоол" | "Агуулах" = "Тоот") => {
      const propName =
        turul === "Зогсоол"
          ? "davkhariinZogsoolnuud"
          : turul === "Агуулах"
            ? "davkhariinAguulakhnuud"
            : "davkhariinToonuud";
      if (!token || !baiguullaga?._id) {
        openErrorOverlay("Мэдээлэл дутуу байна");
        return;
      }

      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      if (!effectiveBarilgiinId) {
        openErrorOverlay("Барилга сонгоогүй байна");
        return;
      }

      setIsSavingUnits?.(true);
      try {
        const orgResp = await uilchilgee(token).get(
          `/baiguullaga/${baiguullaga._id}`,
          {
            headers: { "X-Org-Only": "1" },
          },
        );
        const org = orgResp.data;
        const barilga = org.barilguud?.find(
          (b: any) => String(b._id || b.id) === String(effectiveBarilgiinId),
        );
        if (!barilga) {
          openErrorOverlay("Барилга олдсонгүй");
          return;
        }

        const key = composeKeyFn(selectedOrts || "", floor);
        const existing = (barilga.tokhirgoo?.[propName] || {}) as Record<
          string,
          string[]
        >;

        if (
          !existing[key] ||
          (Array.isArray(existing[key]) && existing[key].length === 0)
        ) {
          openErrorOverlay("Давхар олдсонгүй эсвэл хэдийнэ устгагдсан байна");
          return;
        }

        // Check if there are any active contracts on this floor
        if (contracts && Array.isArray(contracts)) {
          const floorUnits = Array.isArray(existing[key]) ? existing[key] : [];
          const hasActiveContract = contracts.some((c: any) => {
            const isCancelled =
              String(c.tuluv || c.status || "")
                .toLowerCase()
                .includes("цуцалсан") ||
              String(c.tuluv || c.status || "")
                .toLowerCase()
                .includes("идэвхгүй") ||
              String(c.tuluv || c.status || "").toLowerCase() === "tsutlsasan";
            const isActive = !isCancelled;

            if (!isActive) return false;

            const cFloor = String(c.davkhar || "").trim();
            const cOrts = String(c.orts || "").trim();
            const selOrts = String(selectedOrts || "").trim();

            const floorMatch = cFloor === String(floor).trim();
            const ortsMatch = !selOrts || cOrts === "" || cOrts === selOrts;

            if (floorMatch && ortsMatch) {
              const cToot = String(c.toot || "").trim();
              return floorUnits.some((u) => String(u).trim() === cToot);
            }
            return false;
          });

          if (hasActiveContract) {
            openErrorOverlay(
              "Энэ давхарт идэвхтэй гэрээтэй тоот байна. Устгах боломжгүй.",
            );
            return;
          }
        }

        const updated = { ...existing };
        delete updated[key];

        const updatedBarilguud = org.barilguud.map((b: any) => {
          if (String(b._id || b.id) !== String(effectiveBarilgiinId)) return b;
          return {
            ...b,
            tokhirgoo: {
              ...(b.tokhirgoo || {}),
              [propName]: updated,
            },
          };
        });

        const payload = {
          ...org,
          barilguud: updatedBarilguud,
        };

        await updateMethod("baiguullaga", token, payload);
        await baiguullagaMutate?.();
        openSuccessOverlay("Давхрын тоотууд устгагдлаа");
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
      } finally {
        setIsSavingUnits?.(false);
      }
    },
    [
      token,
      baiguullaga,
      selectedBuildingId,
      barilgiinId,
      baiguullagaMutate,
      setIsSavingUnits,
      selectedOrts,
      composeKeyFn,
      contracts,
    ],
  );

  const handleShowResidentModal = useCallback((initialUnit?: { orts?: string; davkhar?: string; toot?: string; turul?: string }) => {
    setEditingResident?.(null);
    const isGarageOrStorage = initialUnit?.turul === "Гараж" || initialUnit?.turul === "Агуулах";
    setNewResident?.({
      ovog: "",
      ner: "",
      register: "",
      utas: [""],
      khayag: "",
      aimag: "Улаанбаатар",
      duureg: "",
      horoo: "",
      orts: isGarageOrStorage ? "" : (initialUnit?.orts || ""),
      toot: isGarageOrStorage ? "" : (initialUnit?.toot || ""),
      davkhar: isGarageOrStorage ? "" : (initialUnit?.davkhar || ""),
      tsahilgaaniiZaalt: "",
      turul: "Үндсэн",
      tailbar: "",
      ekhniiUldegdel: 0,
      units: [
        {
          orts: initialUnit?.orts || "1",
          davkhar: initialUnit?.davkhar || "",
          toot: initialUnit?.toot || "",
          turul: initialUnit?.turul || "Орон сууц",
          ekhniiUldegdel: 0,
          tsahilgaaniiZaalt: 0,
        },
      ],
    });
    setShowResidentModal?.(true);
  }, [setEditingResident, setNewResident, setShowResidentModal]);

  const handleShowEmployeeModal = useCallback(() => {
    setEditingEmployee?.(null);
    setNewEmployee?.({
      ovog: "",
      ner: "",
      register: "",
      utas: "",
      email: "",
      albanTushaal: "",
      ajildOrsonOgnoo: "",
      nevtrekhNer: "",
      nuutsUg: "",
    });
    setShowEmployeeModal?.(true);
  }, [setEditingEmployee, setNewEmployee, setShowEmployeeModal]);

  const handleExportResidentsExcel = useCallback(async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтэрсэн эсэхээ шалгана уу");
      return;
    }

    onLoadingChange?.(true);
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const body = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: effectiveBarilgiinId || null,
        filters: {},
        fileName: undefined as string | undefined,
      };

      const resp = await uilchilgee(token).post("/downloadExcelList", body, {
        responseType: "blob" as any,
      });

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const cd = (resp.headers?.["content-disposition"] ||
        resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "Оршин суугчийн жагсаалт.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      openSuccessOverlay("Excel файл татагдлаа");
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      onLoadingChange?.(false);
    }
  }, [token, ajiltan, selectedBuildingId, barilgiinId, onLoadingChange]);

  const handleDownloadResidentsTemplate = useCallback(async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтэрсэн эсэхээ шалгана уу");
      return;
    }

    onLoadingChange?.(true);
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get("/orshinSuugchExcelTemplate", {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          ...(effectiveBarilgiinId
            ? { barilgiinId: effectiveBarilgiinId }
            : {}),
        },
        responseType: "blob" as any,
      });

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Оршин суугчийн загвар.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      openSuccessOverlay("Загвар татагдлаа");
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      onLoadingChange?.(false);
    }
  }, [token, ajiltan, selectedBuildingId, barilgiinId, onLoadingChange]);

  const handleResidentsExcelImportClick = useCallback(() => {
    residentExcelInputRef?.current?.click();
  }, [residentExcelInputRef]);

  const onResidentsExcelFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!token || !ajiltan?.baiguullagiinId) {
        openErrorOverlay("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      setIsUploadingResidents?.(true);
      try {
        const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
        const form = new FormData();
        form.append("excelFile", file);
        form.append("baiguullagiinId", ajiltan.baiguullagiinId);
        if (effectiveBarilgiinId) {
          form.append("barilgiinId", effectiveBarilgiinId);
        }

        const resp: any = await uilchilgee(token).post(
          "/orshinSuugchExcelImport",
          form,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        const data = resp?.data;
        const failed = data?.result?.failed;
        if (Array.isArray(failed) && failed.length > 0) {
          const detailLines = failed.map(
            (f: any) =>
              `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`,
          );
          const details = detailLines.join("\n");
          const topMsg =
            data?.message || "Импортын явцад зарим мөр алдаатай байна";
          openErrorOverlay(`${topMsg}\n${details}`);
        } else {
          openSuccessOverlay("Загвар амжилттай орууллаа.");
          if (baiguullagaMutate) {
            await baiguullagaMutate();
          }
          // Refresh resident and contract lists across the app
          mutate(
            (key: any) =>
              Array.isArray(key) &&
              (key[0] === "/orshinSuugch" || key[0] === "/geree"),
            undefined,
            { revalidate: true },
          );
        }
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
      } finally {
        setIsUploadingResidents?.(false);
        if (residentExcelInputRef?.current) {
          residentExcelInputRef.current.value = "";
        }
      }
    },
    [
      token,
      ajiltan,
      selectedBuildingId,
      barilgiinId,
      setIsUploadingResidents,
      residentExcelInputRef,
      baiguullagaMutate,
    ],
  );

  const handleDownloadUnitsTemplate = useCallback(async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтэрсэн эсэхээ шалгана уу");
      return;
    }

    onLoadingChange?.(true);
    try {
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      const resp = await uilchilgee(token).get("/tootBurtgelExcelTemplate", {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          ...(effectiveBarilgiinId
            ? { barilgiinId: effectiveBarilgiinId }
            : {}),
        },
        responseType: "blob" as any,
      });

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "toot_burtgel_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      openSuccessOverlay("Загвар татагдлаа");
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      onLoadingChange?.(false);
    }
  }, [token, ajiltan, selectedBuildingId, barilgiinId, onLoadingChange]);

  const handleUnitsExcelImportClick = useCallback(() => {
    unitExcelInputRef?.current?.click();
  }, [unitExcelInputRef]);

  const onUnitsExcelFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!token || !ajiltan?.baiguullagiinId) {
        openErrorOverlay("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      setIsUploadingUnits?.(true);
      try {
        const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
        const form = new FormData();
        form.append("excelFile", file);
        form.append("baiguullagiinId", ajiltan.baiguullagiinId);
        if (effectiveBarilgiinId) {
          form.append("barilgiinId", effectiveBarilgiinId);
        }

        const resp: any = await uilchilgee(token).post(
          "/tootBurtgelExcelImport",
          form,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        const data = resp?.data;
        const failed = data?.result?.failed;
        if (Array.isArray(failed) && failed.length > 0) {
          const detailLines = failed.map(
            (f: any) =>
              `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`,
          );
          const details = detailLines.join("\n");
          const topMsg =
            data?.message || "Импортын явцад зарим мөр алдаатай байна";
          openErrorOverlay(`${topMsg}\n${details}`);
        } else {
          openSuccessOverlay("Загвар амжилттай орууллаа.");
          if (baiguullagaMutate) {
            await baiguullagaMutate();
          }
          // Refresh resident and contract lists across the app
          mutate(
            (key: any) =>
              Array.isArray(key) &&
              (key[0] === "/orshinSuugch" || key[0] === "/geree"),
            undefined,
            { revalidate: true },
          );
        }
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
      } finally {
        setIsUploadingUnits?.(false);
        if (unitExcelInputRef?.current) {
          unitExcelInputRef.current.value = "";
        }
      }
    },
    [
      token,
      ajiltan,
      selectedBuildingId,
      barilgiinId,
      setIsUploadingUnits,
      unitExcelInputRef,
      baiguullagaMutate,
    ],
  );

  // Preview invoice handler
  const handlePreviewInvoice = useCallback(
    async (contract: any) => {
      if (!token || !baiguullaga?._id) {
        openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
        return;
      }

      try {
        const effectiveBarilgiinId =
          selectedBuildingIdForActions || selectedBuildingId || barilgiinId;

        // Build query params
        const params: Record<string, string> = {
          gereeId: contract._id,
          baiguullagiinId: baiguullaga._id,
        };

        if (effectiveBarilgiinId) {
          params.barilgiinId = effectiveBarilgiinId;
        }

        // Get current month and year as default
        const now = new Date();
        params.targetMonth = String(now.getMonth() + 1);
        params.targetYear = String(now.getFullYear());

        const queryString = new URLSearchParams(params).toString();

        const response = await uilchilgee(token).get(`/preview?${queryString}`);

        if (response.data) {
          // Set invoice preview data and show modal
          if (setInvoicePreviewData) {
            setInvoicePreviewData(response.data);
          }
          if (setShowInvoicePreviewModal) {
            setShowInvoicePreviewModal(true);
          }
        }
      } catch (error: any) {
        const msg = getErrorMessage(error);
        openErrorOverlay(
          `Нэхэмжлэхийн урьдчилсан харалт татахад алдаа гарлаа: ${msg}`,
        );
      }
    },
    [
      token,
      baiguullaga,
      selectedBuildingIdForActions,
      selectedBuildingId,
      barilgiinId,
      setInvoicePreviewData,
      setShowInvoicePreviewModal,
    ],
  );

  // Manual send invoice handler
  //
  // When propertyTab is Зогсоол / Агуулах there are TWO kinds of contracts:
  //   1. dedicatedIds   – contracts whose turul IS "Зогсоол"/"Гараж"/"Агуулах"
  //                       → they own their invoice; send as a normal invoice (onlyGarageOrStorage=false)
  //   2. mainWithNestedIds – main apartment contracts that have the garage/storage in nemeltTootnuud
  //                       → append only the garage/storage charges to the existing invoice
  //
  // For backward-compat, the old (ids, bool) signature still works.
  const handleSendInvoices = useCallback(
    async (
      dedicatedOrAllIds: string[],
      onlyGarageOrStorageOrMainIds?: boolean | string[],
      options?: { onlyGarage?: boolean; onlyStorage?: boolean },
    ) => {
      if (!token || !baiguullaga?._id) {
        openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
        return;
      }

      // Normalise arguments
      const dedicatedIds: string[] = dedicatedOrAllIds;
      const mainWithNestedIds: string[] = Array.isArray(onlyGarageOrStorageOrMainIds)
        ? onlyGarageOrStorageOrMainIds
        : [];
      // legacy boolean flag → treat all IDs as dedicated (no nested split needed)
      const legacyFlag: boolean =
        typeof onlyGarageOrStorageOrMainIds === "boolean"
          ? onlyGarageOrStorageOrMainIds
          : false;

      const allIds = [...dedicatedIds, ...mainWithNestedIds];
      if (allIds.length === 0) {
        openErrorOverlay("Нэхэмжлэх илгээх гэрээ сонгоно уу");
        return;
      }

      try {
        const now = new Date();
        const baseBody = {
          baiguullagiinId: baiguullaga._id,
          override: false,
          targetMonth: now.getMonth() + 1,
          targetYear: now.getFullYear(),
        };

        let totalCreated = 0;
        const combinedErrors: any[] = [];

        // ── 1. Dedicated garage/storage contracts ──────────────────────────
        if (dedicatedIds.length > 0) {
          const body = {
            ...baseBody,
            gereeIds: dedicatedIds,
            onlyGarageOrStorage: legacyFlag, // false for new split-calls, preserved for legacy
            ...(options?.onlyGarage ? { onlyGarage: true } : {}),
            ...(options?.onlyStorage ? { onlyStorage: true } : {}),
          };
          const res = await uilchilgee(token).post("/manualSend", body);
          if (res.data?.success) {
            totalCreated += Number(res.data?.data?.created ?? 0) || 0;
            (res.data?.data?.errorsList || []).forEach((e: any) => combinedErrors.push(e));
          }
        }

        // ── 2. Main contracts whose nested unit is a garage/storage ────────
        if (mainWithNestedIds.length > 0) {
          const body = {
            ...baseBody,
            gereeIds: mainWithNestedIds,
            onlyGarageOrStorage: true,
            ...(options?.onlyGarage ? { onlyGarage: true } : {}),
            ...(options?.onlyStorage ? { onlyStorage: true } : {}),
          };
          const res = await uilchilgee(token).post("/manualSend", body);
          if (res.data?.success) {
            totalCreated += Number(res.data?.data?.created ?? 0) || 0;
            (res.data?.data?.errorsList || []).forEach((e: any) => combinedErrors.push(e));
          }
        }

        const message = `${totalCreated} нэхэмжлэх амжилттай үүсгэгдлээ`;
        openSuccessOverlay(message);

        if (totalCreated <= 0 && !legacyFlag && mainWithNestedIds.length === 0) {
          openErrorOverlay(
            "Шинэ нэхэмжлэх үүсээгүй байна (created = 0). Давхар үүсгэх тохиргоо (override) эсвэл тухайн сар аль хэдийн үүссэн эсэхийг шалгана уу.",
          );
        }

        // Notify open invoice UIs to refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sukh:invoices-sent", {
              detail: {
                baiguullagiinId: baiguullaga._id,
                gereeIds: allIds,
                created: totalCreated,
                at: Date.now(),
              },
            }),
          );
        }

        // Show errors
        if (combinedErrors.length > 0) {
          const errorMessages = combinedErrors
            .map((err: any) => {
              const errMsg = String(err.error || "");
              if (errMsg.includes("үүссэн байна") || errMsg.includes("хэдийн")) {
                return `${err.gereeniiDugaar || "Гэрээ"} аль хэдийн үүссэн байна.`;
              }
              return `${err.gereeniiDugaar || "Гэрээ"}: ${err.error}`;
            })
            .join("\n");

          const isAllDuplicate = combinedErrors.every((err: any) => {
            const errMsg = String(err.error || "");
            return errMsg.includes("үүссэн байна") || errMsg.includes("хэдийн");
          });

          if (isAllDuplicate) {
            openWarningOverlay(`Анхааруулга:\n${errorMessages}`);
          } else {
            openErrorOverlay(`Зарим алдаа гарлаа:\n${errorMessages}`);
          }
        }
      } catch (error: any) {
        const msg = getErrorMessage(error);
        openErrorOverlay(`Нэхэмжлэх илгээхэд алдаа гарлаа: ${msg}`);
      }
    },
    [token, baiguullaga],
  );

  const handleAddGarageCharges = useCallback(
    async (residents: any[], chargeType?: "Зогсоол" | "Агуулах") => {
      if (!token || !baiguullaga?._id) {
        openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
        return;
      }
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      if (!effectiveBarilgiinId) {
        openErrorOverlay("Барилга сонгоогүй байна");
        return;
      }

      try {
        // 1. Get building config
        const barilga = baiguullaga.barilguud?.find(
          (b: any) => String(b._id || b.id) === String(effectiveBarilgiinId),
        );
        const tok = barilga?.tokhirgoo || {};

        // Garage config
        const garageEnabled = (chargeType === undefined || chargeType === "Зогсоол") && !!tok.garsiinTolborEnabled;
        const garageMethod = tok.garsiinTolborArga || "Тогтмол";
        const garageValue = Number(tok.garsiinTolborUtga) || 0;

        // Storage config
        const storageEnabled = (chargeType === undefined || chargeType === "Агуулах") && !!tok.aguulakhTolborEnabled;
        const storageMethod = tok.aguulakhTolborArga || "Тогтмол";
        const storageValue = Number(tok.aguulakhTolborUtga) || 0;

        if (!garageEnabled && !storageEnabled) {
          openErrorOverlay("Сонгосон төрлийн төлбөрийн тохиргоо идэвхгүй байна");
          return;
        }

        // 2. Build set of garage/storage unit keys (orts::davkhar::toot)
        const garageKeys = new Set<string>();
        const aguulakhKeys = new Set<string>();

        const addKey = (
          set: Set<string>,
          orts: string,
          davkhar: string,
          toot: string,
        ) => {
          const o = String(orts || "1").trim();
          const f = String(davkhar || "").trim();
          const t = String(toot || "").trim();
          // Store both orts::davkhar::toot and davkhar::toot for flexible matching
          set.add(`${o}::${f}::${t}`);
          if (o && o !== "1") set.add(`1::${f}::${t}`);
        };

        const parseMap = (map: any) => {
          const out: Record<string, string[]> = {};
          if (map && typeof map === "object" && !Array.isArray(map)) {
            Object.entries(map).forEach(([key, val]: [string, any]) => {
              let units: string[] = [];
              if (Array.isArray(val)) {
                units = val.flatMap((v: any) =>
                  String(v)
                    .split(/[\s,;|]+/)
                    .filter(Boolean),
                );
              } else if (typeof val === "string") {
                units = val.split(/[\s,;|]+/).filter(Boolean);
              }
              out[key] = units;
            });
          }
          return out;
        };

        const zogsoolMap = parseMap(tok.davkhariinZogsoolnuud);
        const aguulakhMap = parseMap(tok.davkhariinAguulakhnuud);

        Object.entries(zogsoolMap).forEach(([key, units]) => {
          const parts = key.split("::");
          const orts = parts.length > 1 ? parts[0] : "";
          const davkhar = parts.length > 1 ? parts[1] : key;
          units.forEach((toot) => addKey(garageKeys, orts, davkhar, toot));
        });
        Object.entries(aguulakhMap).forEach(([key, units]) => {
          const parts = key.split("::");
          const orts = parts.length > 1 ? parts[0] : "";
          const davkhar = parts.length > 1 ? parts[1] : key;
          units.forEach((toot) => addKey(aguulakhKeys, orts, davkhar, toot));
        });

        // Add basement/parking floor units from davkhar array
        const davkharArr = Array.isArray(tok.davkhar) ? tok.davkhar : [];
        davkharArr.forEach((it: any) => {
          const floor = String(it?.davkhar ?? it).trim();
          const list = Array.isArray(it?.toonuud) ? it.toonuud : [];
          if (/^B\d+$/i.test(floor) && list.length > 0) {
            const orts = String(it?.orts || "1").trim();
            list.forEach((toot: any) => addKey(garageKeys, orts, floor, toot));
          }
        });

        // 3. Fetch cron schedule to determine billing cycle bounds
        let cronDay = 1;
        try {
          const cronRes = await uilchilgee(token).get(`/nekhemjlekhCron/${baiguullaga._id}`, {
            params: effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}
          });
          const schedules = cronRes.data?.data || cronRes.data || [];
          const schedule = Array.isArray(schedules) ? schedules[schedules.length - 1] : schedules;
          if (schedule?.nekhemjlekhUusgekhOgnoo) cronDay = Number(schedule.nekhemjlekhUusgekhOgnoo);
        } catch { }

        const now = new Date();
        let cycleStartYear = now.getFullYear();
        let cycleStartMonth = now.getMonth(); // 0-indexed
        if (now.getDate() < cronDay) {
          cycleStartMonth--;
          if (cycleStartMonth < 0) { cycleStartMonth = 11; cycleStartYear--; }
        }
        const cycleStart = new Date(cycleStartYear, cycleStartMonth, cronDay);
        const cycleEndMonth = cycleStartMonth === 11 ? 0 : cycleStartMonth + 1;
        const cycleEndYear = cycleStartMonth === 11 ? cycleStartYear + 1 : cycleStartYear;
        // Day before next billing day (cronDay=1 → last day of current month via day 0)
        const cycleEnd = new Date(cycleEndYear, cycleEndMonth, cronDay - 1 || 0);
        const cycleStartStr = cycleStart.toISOString().split("T")[0];
        const cycleEndStr = cycleEnd.toISOString().split("T")[0];

        // 4. For each resident, check if they have garage/storage units
        let added = 0;
        let skipped = 0;
        const today = new Date().toISOString().split("T")[0];

        const residentHasGarage = (u: any) => {
          const o = String(u.orts || "1").trim();
          const f = String(u.davkhar || "").trim();
          const t = String(u.toot || "").trim();
          return (
            garageKeys.has(`${o}::${f}::${t}`) ||
            garageKeys.has(`1::${f}::${t}`)
          );
        };
        const residentHasAguulakh = (u: any) => {
          const o = String(u.orts || "1").trim();
          const f = String(u.davkhar || "").trim();
          const t = String(u.toot || "").trim();
          return (
            aguulakhKeys.has(`${o}::${f}::${t}`) ||
            aguulakhKeys.has(`1::${f}::${t}`)
          );
        };

        for (const resident of residents) {
          const units = Array.isArray(resident.toots) ? resident.toots : [];
          if (units.length === 0) continue;

          const garageUnits = units.filter(residentHasGarage);
          const aguulakhUnits = units.filter(residentHasAguulakh);

          const hasGarage = garageUnits.length > 0;
          const hasAguulakh = aguulakhUnits.length > 0;

          if (!hasGarage && !hasAguulakh) continue;

          // Resolve contract (gereeniiId) and contract number (gereeniiDugaar)
          let gereeniiId = resident.gereeniiId || resident.gereeId || resident.geree?._id;
          let gereeniiDugaar = resident.gereeniiDugaar || resident.geree?.gereeniiDugaar || resident.gereeDugaar;

          if (!gereeniiId && Array.isArray(contracts)) {
            // Find contract matching this resident in our contracts list
            const matchedContract = contracts.find((c: any) => {
              const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
              const isCancelled =
                status === "Цуцалсан" ||
                status.toLowerCase() === "цуцалсан" ||
                status === "tsutlsasan" ||
                status.toLowerCase() === "tsutlsasan" ||
                status === "Идэвхгүй" ||
                status.toLowerCase() === "идэвхгүй";

              if (isCancelled) return false;

              const cResId = c.orshinSuugchId || c.khariltsagchId;
              return cResId && String(cResId) === String(resident._id);
            }) || contracts.find((c: any) => {
              const cResId = c.orshinSuugchId || c.khariltsagchId;
              return cResId && String(cResId) === String(resident._id);
            });

            if (matchedContract) {
              gereeniiId = matchedContract._id || matchedContract.id;
              gereeniiDugaar = matchedContract.gereeniiDugaar;
            }
          }

          if (!gereeniiId) {
            openErrorOverlay(
              `"${resident.ovog || ""} ${resident.ner || ""}"-д холбогдох идэвхтэй гэрээ олдсонгүй тул төлбөр нэмэх боломжгүй байна. Гэрээ байгуулагдсан эсэхийг шалгана уу.`
            );
            continue; // Skip this resident to avoid validation failure
          }

          // Fetch all avlaga for this contract once, then check both types client-side
          // (avoids MongoDB date-type mismatch when filtering by ognoo range)
          let contractAvlaga: any[] = [];
          try {
            const checkRes = await uilchilgee(token).get("/guilgeeAvlaguud", {
              params: {
                baiguullagiinId: baiguullaga._id,
                query: JSON.stringify({ gereeniiId: String(gereeniiId) }),
                khuudasniiDugaar: 1,
                khuudasniiKhemjee: 200,
              },
            });
            contractAvlaga = checkRes.data?.data || checkRes.data || [];
            if (!Array.isArray(contractAvlaga)) contractAvlaga = [];
          } catch { }

          const inCycle = (r: any) => {
            const raw = r.ognoo || r.createdAt || "";
            const str = typeof raw === "string" ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
            return str >= cycleStartStr && str <= cycleEndStr;
          };

          if (garageEnabled && hasGarage && garageMethod === "Тогтмол" && garageValue > 0) {
            for (const gu of garageUnits) {
              const toot = String(gu.toot || "");
              const alreadyBilled = contractAvlaga.some(
                (r: any) => /зогсоол/i.test(r.tailbar || "") && String(r.toot || "") === toot && inCycle(r)
              );
              if (alreadyBilled) {
                skipped++;
              } else {
                try {
                  await uilchilgee(token).post("/guilgeeAvlaguud", {
                    baiguullagiinId: baiguullaga._id,
                    barilgiinId: effectiveBarilgiinId,
                    orshinSuugchId: resident._id,
                    gereeniiId: gereeniiId,
                    gereeniiDugaar: gereeniiDugaar || "",
                    toot,
                    turul: "avlaga",
                    tulukhDun: garageValue,
                    tulsunDun: 0,
                    dun: garageValue,
                    tailbar: `Зогсоол (тоот ${toot})`,
                    ognoo: today,
                    guilgeeKhiisenAjiltniiId: ajiltan?._id,
                    guilgeeKhiisenAjiltniiNer: `${ajiltan?.ovog || ""} ${ajiltan?.ner || ""}`.trim(),
                  });
                  added++;
                } catch (postErr: any) {
                  if (postErr?.response?.status === 409) { skipped++; } else { throw postErr; }
                }
              }
            }
          }
          if (storageEnabled && hasAguulakh && storageMethod === "Тогтмол" && storageValue > 0) {
            for (const su of aguulakhUnits) {
              const toot = String(su.toot || "");
              const alreadyBilled = contractAvlaga.some(
                (r: any) => /агуулах/i.test(r.tailbar || "") && String(r.toot || "") === toot && inCycle(r)
              );
              if (alreadyBilled) {
                skipped++;
              } else {
                try {
                  await uilchilgee(token).post("/guilgeeAvlaguud", {
                    baiguullagiinId: baiguullaga._id,
                    barilgiinId: effectiveBarilgiinId,
                    orshinSuugchId: resident._id,
                    gereeniiId: gereeniiId,
                    gereeniiDugaar: gereeniiDugaar || "",
                    toot,
                    turul: "avlaga",
                    tulukhDun: storageValue,
                    tulsunDun: 0,
                    dun: storageValue,
                    tailbar: `Агуулах (тоот ${toot})`,
                    ognoo: today,
                    guilgeeKhiisenAjiltniiId: ajiltan?._id,
                    guilgeeKhiisenAjiltniiNer: `${ajiltan?.ovog || ""} ${ajiltan?.ner || ""}`.trim(),
                  });
                  added++;
                } catch (postErr: any) {
                  if (postErr?.response?.status === 409) { skipped++; } else { throw postErr; }
                }
              }
            }
          }
        }

        if (skipped > 0) {
          openWarningOverlay(
            added > 0
              ? `${added} төлбөр нэмэгдлээ, ${skipped} нь энэ мөчлөгт аль хэдийн бүртгэгдсэн тул алгасав`
              : `${skipped} нь энэ мөчлөгт аль хэдийн бүртгэгдсэн тул алгасав`
          );
        } else {
          openSuccessOverlay(`${added} төлбөр амжилттай нэмэгдлээ`);
        }

        // Refresh caches
        mutate(
          (key: any) =>
            Array.isArray(key) &&
            [
              "/guilgeeAvlaguud",
              "/nekhemjlekhiinTuukh",
              "/orshinSuugch",
            ].includes(key[0]),
          undefined,
          { revalidate: true },
        );
      } catch (error: any) {
        openErrorOverlay(getErrorMessage(error));
      }
    },
    [token, baiguullaga, selectedBuildingId, barilgiinId, ajiltan],
  );

  const handleCreateOrUpdateEmployee = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!token || !ajiltan?.baiguullagiinId) {
        console.error("Missing token or baiguullagiinId");
        openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
        return;
      }

      // We need to get newEmployee from the component state
      // Since we can't access it directly here, we'll need to pass it through the form
      // For now, let's create a workaround by getting the data from the event target
      const form = e.target as HTMLFormElement;
      const formElements = form.elements as any;

      const employeeData: any = {
        ovog: formElements.ovog?.value || "",
        ner: formElements.ner?.value || "",
        utas: formElements.utas?.value || "",
        email: formElements.email?.value || "",
        albanTushaal: formElements.albanTushaal?.value || "",
        ajildOrsonOgnoo: formElements.ajildOrsonOgnoo?.value || "",
        nevtrekhNer: formElements.nevtrekhNer?.value || "",
        nuutsUg: formElements.nuutsUg?.value || "",
      };

      try {
        // Get the effective building ID with fallback logic
        let effectiveBarilgiinId = selectedBuildingId || barilgiinId;

        // If no building is selected, try to get the first available building from baiguullaga
        if (!effectiveBarilgiinId && baiguullaga?.barilguud?.length > 0) {
          effectiveBarilgiinId = baiguullaga.barilguud[0]._id;
        }

        // Validate that we have a building ID
        if (!effectiveBarilgiinId) {
          console.error("No building ID available");
          openErrorOverlay(
            "Барилга сонгоно уу эсвэл байгууллагад барилга нэмнэ үү",
          );
          return;
        }

        // IMPORTANT: Backend model expects 'barilguud' as an array, not 'barilgiinId'
        const payload = {
          ...employeeData,
          baiguullagiinId: ajiltan.baiguullagiinId,
          baiguullagiinNer: baiguullaga?.ner || "",
          // Send barilguud as array (backend model expects this)
          // Ensure we always have at least one building
          barilguud: [effectiveBarilgiinId],
          erkh: "Ajiltan",
        };

        // Check if we're editing (form has _id hidden input)
        const isEditing = formElements._id?.value;

        if (isEditing) {
          // Update existing employee (Pattern matching orshinSuugch logic)
          const id = formElements._id.value;

          // Prepare payload with _id for updateMethod (which will extract it for URL and strip it from body)
          const updatePayload = { ...payload, _id: id };

          // Remove username/password for edit mode as requested
          delete updatePayload.nevtrekhNer;
          delete updatePayload.nuutsUg;

          await updateMethod("ajiltan", token, updatePayload);
          openSuccessOverlay("Ажилтны мэдээлэл засагдлаа");
        } else {
          // Create new employee
          await createMethod("ajiltan", token, payload);
          openSuccessOverlay("Ажилтан нэмэгдлээ");
        }

        try {
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/ajiltan",
            undefined,
            { revalidate: true },
          );
        } catch (_e) {
          // Best-effort cache refresh
        }

        setShowEmployeeModal?.(false);
        setEditingEmployee?.(null);
        setNewEmployee?.({
          ovog: "",
          ner: "",
          register: "",
          utas: "",
          email: "",
          albanTushaal: "",
          ajildOrsonOgnoo: "",
          nevtrekhNer: "",
          nuutsUg: "",
        });
        return true;
      } catch (err) {
        console.error("Error creating/updating employee:", err);
        openErrorOverlay(getErrorMessage(err));
        return false;
      }
    },
    [
      token,
      ajiltan,
      baiguullaga,
      selectedBuildingId,
      barilgiinId,
      setShowEmployeeModal,
      setEditingEmployee,
      setNewEmployee,
    ],
  );

  const handleEditEmployee = useCallback(
    (employee: any) => {
      setEditingEmployee?.(employee);
      setNewEmployee?.({
        _id: employee._id,
        ovog: employee.ovog || "",
        ner: employee.ner || "",
        register: employee.register || "",
        utas: employee.utas || "",
        email: employee.email || "",
        albanTushaal: employee.albanTushaal || "",
        ajildOrsonOgnoo: employee.ajildOrsonOgnoo || "",
        nevtrekhNer: employee.nevtrekhNer || "",
        nuutsUg: "", // Don't pre-fill password
        erkh: employee.erkh || "Ajiltan",
      });
      setShowEmployeeModal?.(true);
    },
    [setEditingEmployee, setNewEmployee, setShowEmployeeModal],
  );

  const handleDeleteEmployee = useCallback(
    async (employee: any) => {
      if (!token) {
        openErrorOverlay("Нэвтрэх шаардлагатай");
        return;
      }

      if (!employee?._id) {
        openErrorOverlay("Ажилтны ID олдсонгүй");
        return;
      }

      try {
        await deleteMethod("ajiltan", token, employee._id);
        openSuccessOverlay("Ажилтан устгагдлаа");

        try {
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/ajiltan",
            undefined,
            { revalidate: true },
          );
        } catch (_e) {
          // Best-effort cache refresh
        }

        return true;
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
        return false;
      }
    },
    [token],
  );

  const handleRemoveResidentToot = useCallback(
    async (
      residentId: string,
      baiguullagiinId: string,
      barilgiinId: string,
      toot: string,
      turul?: string,
    ) => {
      if (!token) {
        openErrorOverlay("Нэвтрэх шаардлагатай");
        return;
      }
      onLoadingChange?.(true);
      try {
        await uilchilgee(token).post("/orshinSuugch/remove-toot", {
          residentId,
          baiguullagiinId,
          barilgiinId,
          toot,
          ...(turul ? { turul } : {}),
        });
        openSuccessOverlay("Тоот амжилттай хасагдлаа");
        // Refresh resident lists across the app
        mutate(
          (key: any) =>
            Array.isArray(key) &&
            (key[0] === "/orshinSuugch" || key[0] === "/geree"),
          undefined,
          { revalidate: true },
        );
        return true;
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
        return false;
      } finally {
        onLoadingChange?.(false);
      }
    },
    [token, onLoadingChange, mutate],
  );

  // --- KHARILTSAGCH ACTIONS ---
  const handleCreateClient = useCallback(
    async (e: React.FormEvent, newClient: any, editingClient: any) => {
      e.preventDefault();
      if (!token) return false;

      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      if (!baiguullaga?._id || !effectiveBarilgiinId) {
        openErrorOverlay("Байгууллага эсвэл барилга сонгоогүй байна.");
        return false;
      }

      if (!newClient.ner || !newClient.utas) {
        openErrorOverlay("Нэр, утас заавал оруулна уу.");
        return false;
      }

      try {
        const payload = {
          ...newClient,
          baiguullagiinId: baiguullaga._id,
          barilgiinId: effectiveBarilgiinId,
          utas: Array.isArray(newClient.utas)
            ? newClient.utas[0] || ""
            : newClient.utas || "",
        };
        if (editingClient?._id) {
          await uilchilgee(token).put(
            `/khariltsagch/${editingClient._id}`,
            payload,
          );
          openSuccessOverlay("Амжилттай засагдлаа");
        } else {
          await uilchilgee(token).post("/khariltsagch", payload);
          openSuccessOverlay("Амжилттай бүртгэгдлээ");
        }
        mutate(
          (key: any) =>
            Array.isArray(key) &&
            (key[0] === "/khariltsagch" || key[0] === "/geree"),
          undefined,
          { revalidate: true },
        );
        return true;
      } catch (error: any) {
        openErrorOverlay(
          `Алдаа гарлаа: ${error.response?.data?.error || error.message}`,
        );
        return false;
      }
    },
    [token, baiguullaga, selectedBuildingId, barilgiinId, mutate],
  );

  const handleDeleteClient = useCallback(
    async (client: any) => {
      if (!token) return;
      try {
        await uilchilgee(token).delete(`/khariltsagch/${client._id}`);
        openSuccessOverlay("Амжилттай устгагдлаа");
        mutate(
          (key: any) =>
            Array.isArray(key) &&
            (key[0] === "/khariltsagch" || key[0] === "/geree"),
          undefined,
          { revalidate: true },
        );
      } catch (error: any) {
        openErrorOverlay(
          `Алдаа: ${error.response?.data?.error || error.message}`,
        );
      }
    },
    [token, mutate],
  );

  const handleEditClient = useCallback(
    async (
      p: any,
      setEditingClient: any,
      setNewClient: any,
      setShowClientModal: any,
    ) => {
      setEditingClient(p);
      let ekhniiUldegdel = p.ekhniiUldegdel ?? p.medeelel?.ekhniiUldegdel ?? 0;
      setNewClient({
        ...p,
        units:
          Array.isArray(p.toots) && p.toots.length > 0
            ? p.toots.map((t: any) => ({
              orts: t.orts || "1",
              davkhar: t.davkhar || "",
              toot: t.toot || "",
              turul: t.turul || "Орон сууц",
              ekhniiUldegdel: t.ekhniiUldegdel || 0,
              tsahilgaaniiZaalt: t.tsahilgaaniiZaalt || 0,
              khonogoorBodokhEsekh: t.khonogoorBodokhEsekh || false,
              bodokhKhonog: t.bodokhKhonog || 0,
            }))
            : [
              {
                orts: p.orts || "1",
                davkhar: p.davkhar || "",
                toot: p.toot || "",
                turul: p.turul || "Орон сууц",
                ekhniiUldegdel: ekhniiUldegdel || 0,
                tsahilgaaniiZaalt: p.tsahilgaaniiZaalt || 0,
                khonogoorBodokhEsekh: p.khonogoorBodokhEsekh || false,
                bodokhKhonog: p.bodokhKhonog || 0,
              },
            ],
        ekhniiUldegdel,
      });
      setShowClientModal(true);
    },
    [],
  );

  const handleRemoveClientToot = useCallback(
    async (
      residentId: string,
      baiguullagiinId: string,
      barilgiinId: string,
      toot: string,
      turul?: string,
    ) => {
      if (!token) return;
      try {
        await uilchilgee(token).post("/khariltsagch/remove-toot", {
          id: residentId,
          residentId,
          baiguullagiinId,
          barilgiinId,
          toot,
          ...(turul ? { turul } : {}),
        });
        openSuccessOverlay("Тоот амжилттай хасагдлаа");
        mutate(
          (key: any) =>
            Array.isArray(key) &&
            (key[0] === "/khariltsagch" || key[0] === "/geree"),
          undefined,
          { revalidate: true },
        );
      } catch (error: any) {
        openErrorOverlay(`Тоот хасахад алдаа гарлаа: ${error.message}`);
      }
    },
    [token, mutate],
  );

  const handleAssignToUnit = useCallback(
    async (
      personId: string,
      personType: "orshinSuugch" | "khariltsagch",
      orts: string,
      floor: string,
      unit: string,
      propertyTab: "Тоот" | "Зогсоол" | "Агуулах",
    ) => {
      if (!token) {
        openErrorOverlay("Нэвтрэх шаардлагатай");
        return false;
      }

      const effectiveBid = selectedBuildingId || barilgiinId;
      if (!baiguullaga?._id || !effectiveBid) {
        openErrorOverlay("Байгууллага эсвэл барилга сонгоогүй байна.");
        return false;
      }

      const unitTurul =
        propertyTab === "Зогсоол"
          ? "Гараж"
          : propertyTab === "Агуулах"
            ? "Агуулах"
            : "Орон сууц";

      try {
        if (personType === "orshinSuugch") {
          const resp = await uilchilgee(token).get(`/orshinSuugch/${personId}`, {
            params: { baiguullagiinId: baiguullaga._id },
          });
          const resident = resp.data;
          if (!resident) {
            openErrorOverlay("Оршин суугч олдсонгүй");
            return false;
          }

          const existingToots = Array.isArray(resident.toots) ? resident.toots : [];
          const isDuplicate = existingToots.some(
            (t: any) =>
              String(t.toot).trim() === String(unit).trim() &&
              String(t.barilgiinId) === String(effectiveBid) &&
              String(t.baiguullagiinId) === String(baiguullaga._id)
          );

          if (isDuplicate) {
            openErrorOverlay("Энэ тоот оршин суугчид бүртгэгдсэн байна.");
            return false;
          }

          const selectedBarilga = baiguullaga.barilguud?.find(
            (b: any) => String(b._id || b.id) === String(effectiveBid),
          );

          const newUnitEntry = {
            orts: orts || "1",
            davkhar: floor || "",
            toot: unit,
            turul: unitTurul,
            ekhniiUldegdel: 0,
            tsahilgaaniiZaalt: 0,
            baiguullagiinId: baiguullaga._id,
            barilgiinId: effectiveBid,
            bairniiNer: selectedBarilga?.ner || "",
            soh: selectedBarilga?.tokhirgoo?.sohNer || "",
            sohNer: selectedBarilga?.tokhirgoo?.sohNer || "",
            duureg: selectedBarilga?.duureg || "",
            horoo: selectedBarilga?.horoo || "",
          };

          const updatedToots = [...existingToots, newUnitEntry];

          const payload = {
            ...resident,
            toots: updatedToots,
            units: updatedToots,
            toot: updatedToots[0]?.toot || resident.toot || "",
            davkhar: updatedToots[0]?.davkhar || resident.davkhar || "",
            orts: updatedToots[0]?.orts || resident.orts || "1",
            ekhniiUldegdel: updatedToots[0]?.ekhniiUldegdel || resident.ekhniiUldegdel || 0,
            tsahilgaaniiZaalt: updatedToots[0]?.tsahilgaaniiZaalt || resident.tsahilgaaniiZaalt || 0,
            barilgiinId: effectiveBid,
            baiguullagiinId: baiguullaga._id,
          };

          await updateMethod("orshinSuugch", token, {
            ...payload,
            _id: personId,
          });

          openSuccessOverlay("Амжилттай холбогдлоо");
          mutate(
            (key: any) =>
              Array.isArray(key) &&
              (key[0] === "/orshinSuugch" || key[0] === "/geree"),
            undefined,
            { revalidate: true },
          );
          return true;
        } else {
          const resp = await uilchilgee(token).get(`/khariltsagch/${personId}`, {
            params: { baiguullagiinId: baiguullaga._id },
          });
          const client = resp.data;
          if (!client) {
            openErrorOverlay("Харилцагч олдсонгүй");
            return false;
          }

          const existingToots = Array.isArray(client.toots) ? client.toots : [];
          const isDuplicate = existingToots.some(
            (t: any) =>
              String(t.toot).trim() === String(unit).trim() &&
              String(t.barilgiinId) === String(effectiveBid) &&
              String(t.baiguullagiinId) === String(baiguullaga._id)
          );

          if (isDuplicate) {
            openErrorOverlay("Энэ тоот харилцагчид бүртгэгдсэн байна.");
            return false;
          }

          const selectedBarilga = baiguullaga.barilguud?.find(
            (b: any) => String(b._id || b.id) === String(effectiveBid),
          );

          const newUnitEntry = {
            orts: orts || "1",
            davkhar: floor || "",
            toot: unit,
            turul: unitTurul,
            ekhniiUldegdel: 0,
            tsahilgaaniiZaalt: 0,
            baiguullagiinId: baiguullaga._id,
            barilgiinId: effectiveBid,
            bairniiNer: selectedBarilga?.ner || "",
            soh: selectedBarilga?.tokhirgoo?.sohNer || "",
            sohNer: selectedBarilga?.tokhirgoo?.sohNer || "",
            duureg: selectedBarilga?.duureg || "",
            horoo: selectedBarilga?.horoo || "",
            khonogoorBodokhEsekh: false,
            bodokhKhonog: 0,
          };

          const updatedToots = [...existingToots, newUnitEntry];

          const payload = {
            ...client,
            toots: updatedToots,
            units: updatedToots,
            toot: updatedToots[0]?.toot || client.toot || "",
            davkhar: updatedToots[0]?.davkhar || client.davkhar || "",
            orts: updatedToots[0]?.orts || client.orts || "1",
            ekhniiUldegdel: updatedToots[0]?.ekhniiUldegdel || client.ekhniiUldegdel || 0,
            tsahilgaaniiZaalt: updatedToots[0]?.tsahilgaaniiZaalt || client.tsahilgaaniiZaalt || 0,
            barilgiinId: effectiveBid,
            baiguullagiinId: baiguullaga._id,
            utas: Array.isArray(client.utas)
              ? client.utas[0] || ""
              : client.utas || "",
          };

          await uilchilgee(token).put(`/khariltsagch/${personId}`, payload);

          openSuccessOverlay("Амжилттай холбогдлоо");
          mutate(
            (key: any) =>
              Array.isArray(key) &&
              (key[0] === "/khariltsagch" || key[0] === "/geree"),
            undefined,
            { revalidate: true },
          );
          return true;
        }
      } catch (err: any) {
        openErrorOverlay(
          `Алдаа гарлаа: ${err.response?.data?.error || err.message}`
        );
        return false;
      }
    },
    [token, baiguullaga, selectedBuildingId, barilgiinId, mutate],
  );

  const handleShowClientModal = useCallback((initialUnit?: { orts?: string; davkhar?: string; toot?: string; turul?: string }) => {
    setEditingClient?.(null);
    setNewClient?.({
      ovog: "",
      ner: "",
      register: "",
      utas: [""],
      khayag: "",
      aimag: "Улаанбаатар",
      duureg: "",
      horoo: "",
      turul: "Үндсэн",
      tailbar: "",
      units: [
        {
          orts: initialUnit?.orts || "1",
          davkhar: initialUnit?.davkhar || "",
          toot: initialUnit?.toot || "",
          turul: initialUnit?.turul || "Орон сууц",
          ekhniiUldegdel: 0,
          tsahilgaaniiZaalt: 0,
        },
      ],
      ekhniiUldegdel: undefined,
    });
    setShowClientModal?.(true);
  }, [setEditingClient, setNewClient, setShowClientModal]);

  const handleAddGarageChargesForContracts = useCallback(
    async (contractIds: string[], chargeType: "Зогсоол" | "Агуулах") => {
      if (!token || !baiguullaga?._id) {
        openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
        return;
      }
      const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      if (!effectiveBarilgiinId) {
        openErrorOverlay("Барилга сонгоогүй байна");
        return;
      }
      try {
        const barilga = baiguullaga.barilguud?.find(
          (b: any) => String(b._id || b.id) === String(effectiveBarilgiinId),
        );
        const tok = barilga?.tokhirgoo || {};
        const isGarage = chargeType === "Зогсоол";
        const enabled = isGarage ? !!tok.garsiinTolborEnabled : !!tok.aguulakhTolborEnabled;
        const method = isGarage ? (tok.garsiinTolborArga || "Тогтмол") : (tok.aguulakhTolborArga || "Тогтмол");
        const value = isGarage ? (Number(tok.garsiinTolborUtga) || 0) : (Number(tok.aguulakhTolborUtga) || 0);

        if (!enabled || method !== "Тогтмол" || value <= 0) {
          openErrorOverlay("Сонгосон төрлийн төлбөрийн тохиргоо идэвхгүй байна");
          return;
        }

        // Billing cycle bounds
        let cronDay = 1;
        try {
          const cronRes = await uilchilgee(token).get(`/nekhemjlekhCron/${baiguullaga._id}`, {
            params: effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}
          });
          const schedules = cronRes.data?.data || cronRes.data || [];
          const schedule = Array.isArray(schedules) ? schedules[schedules.length - 1] : schedules;
          if (schedule?.nekhemjlekhUusgekhOgnoo) cronDay = Number(schedule.nekhemjlekhUusgekhOgnoo);
        } catch { }

        const now = new Date();
        let csYear = now.getFullYear(), csMonth = now.getMonth();
        if (now.getDate() < cronDay) { csMonth--; if (csMonth < 0) { csMonth = 11; csYear--; } }
        const cycleStart = new Date(csYear, csMonth, cronDay);
        const ceMonth = csMonth === 11 ? 0 : csMonth + 1;
        const ceYear = csMonth === 11 ? csYear + 1 : csYear;
        const cycleEnd = new Date(ceYear, ceMonth, cronDay - 1 || 0);
        const cycleStartStr = cycleStart.toISOString().split("T")[0];
        const cycleEndStr = cycleEnd.toISOString().split("T")[0];

        const today = now.toISOString().split("T")[0];
        const tailbarKeyword = isGarage ? "зогсоол" : "агуулах";
        let added = 0, skipped = 0;

        for (const id of contractIds) {
          const c = (contracts || []).find((x: any) => String(x._id) === id);
          if (!c) continue;

          // Determine which unit toots to bill for this contract
          const cTurul = String(c.turul || "").trim();
          const unitToots: string[] = [];

          if (isGarage && (cTurul === "Зогсоол" || cTurul === "Гараж")) {
            unitToots.push(String(c.toot || ""));
          } else if (!isGarage && cTurul === "Агуулах") {
            unitToots.push(String(c.toot || ""));
          } else {
            const nemelt = Array.isArray(c.nemeltTootnuud) ? c.nemeltTootnuud : [];
            for (const n of nemelt) {
              const nt = String(n.turul || "");
              if (isGarage && (nt === "Гараж" || nt === "Зогсоол")) unitToots.push(String(n.toot || ""));
              if (!isGarage && nt === "Агуулах") unitToots.push(String(n.toot || ""));
            }
          }

          if (unitToots.length === 0) continue;

          // Fetch existing avlaga for this contract once
          let contractAvlaga: any[] = [];
          try {
            const checkRes = await uilchilgee(token).get("/guilgeeAvlaguud", {
              params: {
                baiguullagiinId: baiguullaga._id,
                query: JSON.stringify({ gereeniiId: String(c._id) }),
                khuudasniiDugaar: 1, khuudasniiKhemjee: 200,
              },
            });
            contractAvlaga = checkRes.data?.data || checkRes.data || [];
            if (!Array.isArray(contractAvlaga)) contractAvlaga = [];
          } catch { }

          const inCycle = (r: any) => {
            const raw = r.ognoo || r.createdAt || "";
            const s = typeof raw === "string" ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
            return s >= cycleStartStr && s <= cycleEndStr;
          };

          for (const toot of unitToots) {
            const alreadyBilled = contractAvlaga.some(
              (r: any) => new RegExp(tailbarKeyword, "i").test(r.tailbar || "") && String(r.toot || "") === toot && inCycle(r)
            );
            if (alreadyBilled) { skipped++; continue; }
            try {
              await uilchilgee(token).post("/guilgeeAvlaguud", {
                baiguullagiinId: baiguullaga._id,
                barilgiinId: effectiveBarilgiinId,
                orshinSuugchId: c.orshinSuugchId || c.khariltsagchId || "",
                gereeniiId: String(c._id),
                gereeniiDugaar: c.gereeniiDugaar || "",
                toot,
                turul: "avlaga",
                tulukhDun: value,
                tulsunDun: 0,
                dun: value,
                tailbar: `${chargeType} (тоот ${toot})`,
                ognoo: today,
                guilgeeKhiisenAjiltniiId: ajiltan?._id,
                guilgeeKhiisenAjiltniiNer: `${ajiltan?.ovog || ""} ${ajiltan?.ner || ""}`.trim(),
              });
              added++;
            } catch (e: any) {
              if (e?.response?.status === 409) { skipped++; } else { throw e; }
            }
          }
        }

        if (skipped > 0) {
          openWarningOverlay(
            added > 0
              ? `Энэ мөчлөгт аль хэдийн бүртгэгдсэн тул алгасав`
              : `${skipped} нь энэ мөчлөгт аль хэдийн бүртгэгдсэн тул алгасав`
          );
        } else {
          openSuccessOverlay(`${added} төлбөр амжилттай нэмэгдлээ`);
        }

        mutate(
          (key: any) => Array.isArray(key) && ["/guilgeeAvlaguud", "/nekhemjlekhiinTuukh", "/orshinSuugch"].includes(key[0]),
          undefined, { revalidate: true },
        );
      } catch (error: any) {
        openErrorOverlay(getErrorMessage(error));
      }
    },
    [token, baiguullaga, selectedBuildingId, barilgiinId, ajiltan, contracts],
  );

  return {
    handleCreateClient,
    handleDeleteClient,
    handleEditClient,
    handleRemoveClientToot,
    handleShowClientModal,
    handleCreateResident,
    handleDeleteResident,
    handleEditResident,
    handleRemoveResidentToot,
    handleCreateOrUpdateEmployee,
    handleDeleteEmployee,
    handleEditEmployee,
    handleEdit: (_contract: any) => { },
    handleUpdateContract: async (_e: React.FormEvent) => {
      return true;
    },
    handleCreateContract: async (_e: React.FormEvent) => {
      return true;
    },
    handlePreviewContractTemplate: async (contract: any) => {
      if (!token || !ajiltan?.baiguullagiinId) {
        openErrorOverlay("Нэвтрэх шаардлагатай");
        return;
      }
      if (onLoadingChange) onLoadingChange(true);
      try {
        // Find the first available template for this organization
        const templatesResp = await uilchilgee(token).get("/gereeniiZagvar", {
          params: { baiguullagiinId: ajiltan.baiguullagiinId },
        });

        const templates = Array.isArray(templatesResp.data?.jagsaalt)
          ? templatesResp.data.jagsaalt
          : Array.isArray(templatesResp.data)
            ? templatesResp.data
            : [];

        if (templates.length === 0) {
          openErrorOverlay(
            "Гэрээний загвар олдсонгүй. Эхлээд загвар үүсгэнэ үү.",
          );
          return;
        }

        // Use the first template by default
        const selectedTemplate = templates[0];

        // Fetch the filled template
        const resp = await uilchilgee(token).post("/gereeniiZagvarSoliyo", {
          gereeniiZagvariinId: selectedTemplate._id,
          gereeniiId: contract._id || contract.id,
        });

        if (resp.data?.success && resp.data?.result) {
          if (setPreviewTemplate) setPreviewTemplate(resp.data.result);
          if (setShowPreviewModal) setShowPreviewModal(true);
        } else {
          openErrorOverlay(
            "Загвар боловсруулахад алдаа гарлаа: " +
            (resp.data?.message || "Тодорхойгүй алдаа"),
          );
        }
      } catch (err) {
        openErrorOverlay(getErrorMessage(err));
      } finally {
        if (onLoadingChange) onLoadingChange(false);
      }
    },
    handleOpenPaymentModal: (_resident: any) => { },
    handleMarkAsPaid: async () => { },
    handleShowResidentModal,
    handleShowEmployeeModal,
    handleExportResidentsExcel,
    handleDownloadResidentsTemplate,
    handleResidentsExcelImportClick,
    onResidentsExcelFileChange,
    handleDownloadUnitsTemplate,
    handleUnitsExcelImportClick,
    onUnitsExcelFileChange,
    handlePreviewTemplate: (_id: string) => { },
    handleEditTemplate: (_id: string) => { },
    handleDeleteTemplate: (_id: string) => { },
    toggleSortFor: useCallback(
      (key: any, order?: "ascend" | "descend" | null) => {
        if (!setSortKey || !setSortOrder) return;
        if (order === undefined || order === null) {
          setSortKey("createdAt");
          setSortOrder("desc");
        } else {
          setSortKey(key);
          setSortOrder(order === "ascend" ? "asc" : "desc");
        }
      },
      [setSortKey, setSortOrder],
    ),
    handleSendInvoices,
    handleAddGarageCharges,
    handleAddGarageChargesForContracts,
    handlePreviewInvoice,
    deleteUnit,
    deleteFloor,
    addUnit,
    handleAssignToUnit,
  };
}
