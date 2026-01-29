import React, { useCallback } from "react";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
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
  setNewResident?: (resident: any) => void,
  setNewEmployee?: (employee: any) => void,
  setEditingResident?: (resident: any | null) => void,
  setEditingEmployee?: (employee: any | null) => void,
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
  contracts?: any[]
) {
  const handleCreateResident = useCallback(async (e: React.FormEvent, newResident: any, editingResident: any) => {
    e.preventDefault();

    if (!isValidName(newResident.ner) || (String(newResident.ovog || "").trim() !== "" && !isValidName(newResident.ovog))) {
      openErrorOverlay("Нэр зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой). Овог хоосон байж болно.");
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
        ? newResident.utas.find((p: any) => String(p || "").trim() !== "") || ""
        : String(newResident.utas || "");

      // Find the selected building from baiguullaga
      const selectedBuildingId = selectedBuildingIdForActions || barilgiinId;
      const selectedBarilga = baiguullaga?.barilguud?.find((b: any) => b._id === selectedBuildingId);

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
        // Building & Apartment Information
        toot: newResident.toot || "",
        davkhar: newResident.davkhar || "",
        orts: newResident.orts || "1", // Default to "1" if not provided
        barilgiinId: selectedBarilga?._id || selectedBuildingId || "",
        bairniiNer: selectedBarilga?.ner || "",
        // Financial Information
        ekhniiUldegdel: newResident.ekhniiUldegdel || 0,
        tsahilgaaniiZaalt: newResident.tsahilgaaniiZaalt || "",
        // Additional
        tailbar: newResident.tailbar || "",
        // Address (if available from selectedBarilga)
        duureg: newResident.duureg || selectedBarilga?.duureg || "",
        horoo: newResident.horoo || selectedBarilga?.horoo || "",
        soh: selectedBarilga?.tokhirgoo?.sohNer || "",
        sohNer: selectedBarilga?.tokhirgoo?.sohNer || "",
      };

      if (editingResident?._id) {
        await updateMethod("orshinSuugch", token || "", {
          ...payload,
          _id: editingResident._id,
        });
      } else {
        await createMethod("orshinSuugchBurtgey", token || "", payload);
      }

      openSuccessOverlay(editingResident?._id ? "Оршин суугчийн мэдээлэл засагдлаа" : "Оршин суугч нэмэгдлээ");
      
      return true;
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
      return false;
    }
  }, [token, ajiltan, baiguullaga]);

  const handleDeleteResident = useCallback(async (p: any) => {
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

    if (!residentId || residentId === "" || residentId === "undefined" || residentId === "null") {
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
  }, [token]);

  const handleEditResident = useCallback((p: any, setEditingResident: any, setNewResident: any, setShowResidentModal: any) => {
    setEditingResident(p);
    setNewResident({
      ovog: p.ovog || "",
      ner: p.ner || "",
      register: p.register || "",
      utas: Array.isArray(p.utas) ? p.utas.map((u: any) => String(u)) : p.utas ? [String(p.utas)] : [""],
      mail: p.mail || p.email || "",
      khayag: p.khayag || "",
      aimag: p.aimag || "Улаанбаатар",
      duureg: p.duureg || "",
      horoo: p.horoo || "",
      orts: p.orts || "",
      toot: p.toot || "",
      davkhar: p.davkhar || "",
      tsahilgaaniiZaalt: p.tsahilgaaniiZaalt || "",
      turul: p.turul || "Үндсэн",
      tailbar: p?.tailbar || "",
    });
    setShowResidentModal(true);
  }, []);

  const composeKeyFn = useCallback((orts: string, floor: string) => {
    if (composeKey) return composeKey(orts, floor);
    const f = String(floor || "").trim();
    const o = String(orts || "").trim();
    return o ? `${o}::${f}` : f;
  }, [composeKey]);

  const addUnit = useCallback(async (floor: string, values: string[]) => {
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
      const orgResp = await uilchilgee(token).get(`/baiguullaga/${baiguullaga._id}`, {
        headers: { "X-Org-Only": "1" },
      });
      const org = orgResp.data;
      const barilga = org.barilguud?.find((b: any) => String(b._id) === String(effectiveBarilgiinId));
      if (!barilga) {
        openErrorOverlay("Барилга олдсонгүй");
        return;
      }

      const key = composeKeyFn(selectedOrts || "", floor);
      const existing = (barilga.tokhirgoo?.davkhariinToonuud || {}) as Record<string, string[]>;
      const currentUnits = Array.isArray(existing[key]) ? [...existing[key]] : [];
      
      // Add new units, avoiding duplicates
      const newUnits = Array.from(new Set([...currentUnits, ...values.map(String)]));

      const updatedBarilguud = org.barilguud.map((b: any) => {
        if (String(b._id) !== String(effectiveBarilgiinId)) return b;
        return {
          ...b,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            davkhariinToonuud: {
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
      openSuccessOverlay("Тоот нэмэгдлээ");
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setIsSavingUnits?.(false);
    }
  }, [token, baiguullaga, selectedBuildingId, barilgiinId, baiguullagaMutate, setIsSavingUnits, selectedOrts, composeKeyFn]);

  const deleteUnit = useCallback(async (floor: string, unit: string) => {
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

      const orgResp = await uilchilgee(token).get(`/baiguullaga/${baiguullaga._id}`, {
        headers: { "X-Org-Only": "1" },
      });
      const org = orgResp.data;
      const barilga = org.barilguud?.find((b: any) => String(b._id) === String(effectiveBarilgiinId));
      if (!barilga) {
        openErrorOverlay("Барилга олдсонгүй");
        return;
      }

      const key = composeKeyFn(selectedOrts || "", floor);
      const existing = (barilga.tokhirgoo?.davkhariinToonuud || {}) as Record<string, string[]>;
      const currentUnits = Array.isArray(existing[key]) ? [...existing[key]] : [];
      const unitStr = String(unit).trim();
      const updatedUnits = currentUnits.filter((u: string) => String(u).trim() !== unitStr);

      if (currentUnits.length === updatedUnits.length) {
        openErrorOverlay("Тоот олдсонгүй");
        return;
      }

      // Check if there are active contracts for this unit
      if (contracts && Array.isArray(contracts)) {
        const hasActiveContract = contracts.some((c: any) => {
          const isCancelled = String(c.tuluv || c.status || "").toLowerCase().includes("цуцалсан") || 
                             String(c.tuluv || c.status || "").toLowerCase().includes("идэвхгүй") ||
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
          openErrorOverlay("Энэ тоот дээр идэвхтэй гэрээ байна. Устгах боломжгүй.");
          return;
        }
      }

      const updatedBarilguud = org.barilguud.map((b: any) => {
        if (String(b._id) !== String(effectiveBarilgiinId)) return b;
        return {
          ...b,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            davkhariinToonuud: {
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
      openSuccessOverlay("Тоот устгагдлаа");
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setIsSavingUnits?.(false);
    }
  }, [token, baiguullaga, selectedBuildingId, barilgiinId, baiguullagaMutate, setIsSavingUnits, selectedOrts, composeKeyFn, contracts]);

  const deleteFloor = useCallback(async (floor: string) => {
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

      const orgResp = await uilchilgee(token).get(`/baiguullaga/${baiguullaga._id}`, {
        headers: { "X-Org-Only": "1" },
      });
      const org = orgResp.data;
      const barilga = org.barilguud?.find((b: any) => String(b._id) === String(effectiveBarilgiinId));
      if (!barilga) {
        openErrorOverlay("Барилга олдсонгүй");
        return;
      }

      const key = composeKeyFn(selectedOrts || "", floor);
      const existing = (barilga.tokhirgoo?.davkhariinToonuud || {}) as Record<string, string[]>;
      
      if (!existing[key] || (Array.isArray(existing[key]) && existing[key].length === 0)) {
        openErrorOverlay("Давхар олдсонгүй эсвэл хэдийнэ устгагдсан байна");
        return;
      }

      // Check if there are any active contracts on this floor
      if (contracts && Array.isArray(contracts)) {
        const floorUnits = Array.isArray(existing[key]) ? existing[key] : [];
        const hasActiveContract = contracts.some((c: any) => {
          const isCancelled = String(c.tuluv || c.status || "").toLowerCase().includes("цуцалсан") || 
                             String(c.tuluv || c.status || "").toLowerCase().includes("идэвхгүй") ||
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
             return floorUnits.some(u => String(u).trim() === cToot);
          }
          return false;
        });

        if (hasActiveContract) {
          openErrorOverlay("Энэ давхарт идэвхтэй гэрээтэй тоот байна. Устгах боломжгүй.");
          return;
        }
      }

      const updated = { ...existing };
      delete updated[key];

      const updatedBarilguud = org.barilguud.map((b: any) => {
        if (String(b._id) !== String(effectiveBarilgiinId)) return b;
        return {
          ...b,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            davkhariinToonuud: updated,
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
  }, [token, baiguullaga, selectedBuildingId, barilgiinId, baiguullagaMutate, setIsSavingUnits, selectedOrts, composeKeyFn, contracts]);

  const handleShowResidentModal = useCallback(() => {
    setEditingResident?.(null);
    setNewResident?.({
      ovog: "",
      ner: "",
      register: "",
      utas: [""],
      khayag: "",
      aimag: "Улаанбаатар",
      duureg: "",
      horoo: "",
      orts: "",
      toot: "",
      davkhar: "",
      tsahilgaaniiZaalt: "",
      turul: "Үндсэн",
      tailbar: "",
      ekhniiUldegdel: 0,
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
      const cd = (resp.headers?.["content-disposition"] || resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "orshin_suugch.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(cd.match(/filename\*=UTF-8''([^;]+)/i)![1]);
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
          ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
        },
        responseType: "blob" as any,
      });

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "orshin_suugch_template.xlsx";
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

  const onResidentsExcelFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const resp: any = await uilchilgee(token).post("/orshinSuugchExcelImport", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        const detailLines = failed.map((f: any) => `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`);
        const details = detailLines.join("\n");
        const topMsg = data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        openSuccessOverlay("Excel импорт амжилттай");
        if (baiguullagaMutate) {
          await baiguullagaMutate();
        }
      }
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setIsUploadingResidents?.(false);
      if (residentExcelInputRef?.current) {
        residentExcelInputRef.current.value = "";
      }
    }
  }, [token, ajiltan, selectedBuildingId, barilgiinId, setIsUploadingResidents, residentExcelInputRef, baiguullagaMutate]);

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
          ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
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

  const onUnitsExcelFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const resp: any = await uilchilgee(token).post("/tootBurtgelExcelImport", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        const detailLines = failed.map((f: any) => `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`);
        const details = detailLines.join("\n");
        const topMsg = data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        openSuccessOverlay("Excel импорт амжилттай");
        if (baiguullagaMutate) {
          await baiguullagaMutate();
        }
      }
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setIsUploadingUnits?.(false);
      if (unitExcelInputRef?.current) {
        unitExcelInputRef.current.value = "";
      }
    }
  }, [token, ajiltan, selectedBuildingId, barilgiinId, setIsUploadingUnits, unitExcelInputRef, baiguullagaMutate]);

  // Preview invoice handler
  const handlePreviewInvoice = useCallback(async (contract: any) => {
    if (!token || !baiguullaga?._id) {
      openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
      return;
    }

    try {
      const effectiveBarilgiinId = selectedBuildingIdForActions || selectedBuildingId || barilgiinId;
      
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
      openErrorOverlay(`Нэхэмжлэхийн урьдчилсан харалт татахад алдаа гарлаа: ${msg}`);
    }
  }, [token, baiguullaga, selectedBuildingIdForActions, selectedBuildingId, barilgiinId, setInvoicePreviewData, setShowInvoicePreviewModal]);

  // Manual send invoice handler
  const handleSendInvoices = useCallback(async (selectedContractIds: string[]) => {
    if (!token || !baiguullaga?._id) {
      openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
      return;
    }

    if (!selectedContractIds || selectedContractIds.length === 0) {
      openErrorOverlay("Нэхэмжлэх илгээх гэрээ сонгоно уу");
      return;
    }

    try {
      // Get current month and year as default
      const now = new Date();
      
      const body = {
        gereeIds: selectedContractIds,
        baiguullagiinId: baiguullaga._id,
        override: false,
        targetMonth: now.getMonth() + 1,
        targetYear: now.getFullYear(),
      };
      
      const response = await uilchilgee(token).post("/manualSend", body);
      
      if (response.data?.success) {
        const message = response.data.message || `${response.data.data?.created || 0} нэхэмжлэх амжилттай үүсгэгдлээ`;
        openSuccessOverlay(message);
        
        // If there are errors, show them
        if (response.data.data?.errors > 0 && response.data.data?.errorsList?.length > 0) {
          const errorMessages = response.data.data.errorsList
            .map((err: any) => `${err.gereeniiDugaar || 'Гэрээ'}: ${err.error}`)
            .join('\n');
          openErrorOverlay(`Зарим алдаа гарлаа:\n${errorMessages}`);
        }
      }
    } catch (error: any) {
      const msg = getErrorMessage(error);
      openErrorOverlay(`Нэхэмжлэх илгээхэд алдаа гарлаа: ${msg}`);
    }
  }, [token, baiguullaga]);

  const handleCreateOrUpdateEmployee = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 [CREATE/UPDATE EMPLOYEE] Starting...");
    
    if (!token || !ajiltan?.baiguullagiinId) {
      console.error("❌ [CREATE/UPDATE EMPLOYEE] Missing token or baiguullagiinId");
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

    console.log("📝 [CREATE/UPDATE EMPLOYEE] Form data:", employeeData);

    try {
      // Get the effective building ID with fallback logic
      let effectiveBarilgiinId = selectedBuildingId || barilgiinId;
      
      // If no building is selected, try to get the first available building from baiguullaga
      if (!effectiveBarilgiinId && baiguullaga?.barilguud?.length > 0) {
        effectiveBarilgiinId = baiguullaga.barilguud[0]._id;
        console.log("⚠️ [CREATE/UPDATE EMPLOYEE] No building selected, using first available:", effectiveBarilgiinId);
      }
      
      console.log("🏢 [CREATE/UPDATE EMPLOYEE] Building ID:", effectiveBarilgiinId);
      console.log("🏢 [CREATE/UPDATE EMPLOYEE] selectedBuildingId:", selectedBuildingId);
      console.log("🏢 [CREATE/UPDATE EMPLOYEE] barilgiinId:", barilgiinId);
      console.log("🏢 [CREATE/UPDATE EMPLOYEE] Available buildings:", baiguullaga?.barilguud?.map((b: any) => ({ id: b._id, name: b.ner })));
      
      // Validate that we have a building ID
      if (!effectiveBarilgiinId) {
        console.error("❌ [CREATE/UPDATE EMPLOYEE] No building ID available!");
        openErrorOverlay("Барилга сонгоно уу эсвэл байгууллагад барилга нэмнэ үү");
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

      console.log("📦 [CREATE/UPDATE EMPLOYEE] Payload:", JSON.stringify(payload, null, 2));

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

        console.log("✏️ [CREATE/UPDATE EMPLOYEE] Updating employee:", id);
        await updateMethod("ajiltan", token, updatePayload);
        
        console.log("✅ [CREATE/UPDATE EMPLOYEE] Employee updated successfully");
        openSuccessOverlay("Ажилтны мэдээлэл засагдлаа");
      } else {
        // Create new employee
        console.log("➕ [CREATE/UPDATE EMPLOYEE] Creating new employee");
        const response = await createMethod("ajiltan", token, payload);
        console.log("✅ [CREATE/UPDATE EMPLOYEE] Employee created successfully:", response);
        openSuccessOverlay("Ажилтан нэмэгдлээ");
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
    } catch (err) {
      console.error("❌ [CREATE/UPDATE EMPLOYEE] Error:", err);
      console.error("❌ [CREATE/UPDATE EMPLOYEE] Error details:", {
        message: getErrorMessage(err),
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
      });
      openErrorOverlay(getErrorMessage(err));
    }
  }, [token, ajiltan, baiguullaga, selectedBuildingId, barilgiinId, setShowEmployeeModal, setEditingEmployee, setNewEmployee]);

  const handleEditEmployee = useCallback((employee: any) => {
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
  }, [setEditingEmployee, setNewEmployee, setShowEmployeeModal]);

  const handleDeleteEmployee = useCallback(async (employee: any) => {
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
      return true;
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
      return false;
    }
  }, [token]);
  
  
  return {
    handleCreateResident,
    handleDeleteResident,
    handleEditResident,
    handleCreateOrUpdateEmployee,
    handleDeleteEmployee,
    handleEditEmployee,
    handleEdit: (_contract: any) => {},
    handleUpdateContract: async (_e: React.FormEvent) => {},
    handleCreateContract: async (_e: React.FormEvent) => {},
    handlePreviewContractTemplate: (_id: string) => {},
    handleOpenPaymentModal: (_resident: any) => {},
    handleMarkAsPaid: async () => {},
    handleShowResidentModal,
    handleShowEmployeeModal,
    handleExportResidentsExcel,
    handleDownloadResidentsTemplate,
    handleResidentsExcelImportClick,
    onResidentsExcelFileChange,
    handleDownloadUnitsTemplate,
    handleUnitsExcelImportClick,
    onUnitsExcelFileChange,
    handlePreviewTemplate: (_id: string) => {},
    handleEditTemplate: (_id: string) => {},
    handleDeleteTemplate: (_id: string) => {},
    toggleSortFor: (_key: string) => {},
    deleteUnit,
    deleteFloor,
    addUnit,
    handlePreviewInvoice,
    handleSendInvoices,
  };
}