"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@mantine/core";
import uilchilgee, {
  aldaaBarigch,
  updateBaiguullaga,
} from "../../../lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import { useSpinner } from "@/context/SpinnerContext";

interface Horoo {
  _id?: string;
  ner: string;
  kod: string;
}

interface Duureg {
  _id?: string;
  ner: string;
  kod: string;
  ded?: Horoo[];
}

interface TatvariinAlbaResponse {
  jagsaalt: Duureg[];
}

interface Ajiltan {
  _id: string;
  [key: string]: any;
  selectedHoroo?: string;
  selectedDuureg?: string;
  selectedDuuregData?: Duureg;
  selectedHorooData?: Horoo;
}

interface Props {
  ajiltan: Ajiltan;
  setSongogdsonTsonkhniiIndex: (index: number) => void;
}

const KhuviinMedeelel: React.FC<Props> = ({
  ajiltan: initialAjiltan,
  setSongogdsonTsonkhniiIndex,
}) => {
  const [state, setState] = useState<Ajiltan>(initialAjiltan);
  const [tatvariinAlbaData, setTatvariinAlbaData] =
    useState<TatvariinAlbaResponse | null>(null);
  const { token, baiguullaga, baiguullagaMutate } = useAuth();

  const [sohNer, setSohNer] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState({
    selectedDuureg: "",
    selectedHoroo: "",
    sohNer: "",
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    const fetchTatvariinAlba = async () => {
      try {
        const res = await uilchilgee(token).get<TatvariinAlbaResponse>(
          "/tatvariinAlba"
        );
        setTatvariinAlbaData(res.data);

        // preload sohNer if available - check barilguud tokhirgoo first
        const firstBuilding =
          Array.isArray(baiguullaga?.barilguud) &&
          baiguullaga.barilguud.length > 0
            ? baiguullaga.barilguud[0]
            : null;
        if (firstBuilding?.tokhirgoo?.sohNer) {
          setSohNer(String(firstBuilding.tokhirgoo.sohNer));
        } else if (
          baiguullaga?.tokhirgoo &&
          (baiguullaga.tokhirgoo as any)?.sohNer
        ) {
          setSohNer(String((baiguullaga.tokhirgoo as any).sohNer));
        } else if (baiguullaga?.ner) {
          setSohNer(String(baiguullaga.ner));
        }

        let effectiveTokhirgoo = baiguullaga?.tokhirgoo;
        if (
          !baiguullaga?.tokhirgoo?.districtCode &&
          typeof window !== "undefined"
        ) {
          try {
            const savedTok = localStorage.getItem("baiguullaga_tokhirgoo");
            if (savedTok) {
              effectiveTokhirgoo = JSON.parse(savedTok);
              setSohNer(String((effectiveTokhirgoo as any)?.sohNer || ""));
            }
          } catch (e) {
            // ignore
          }
        }

        // Always try to derive selectedDuureg and selectedHoroo from effectiveTokhirgoo if available
        if (res.data?.jagsaalt && effectiveTokhirgoo) {
          try {
            const tok = effectiveTokhirgoo as any;
            // try to infer duureg by districtCode prefix or duuregNer
            let duuregMatch: Duureg | undefined;
            if (tok?.districtCode) {
              const code = String(tok.districtCode);
              const duuregKodGuess =
                code.length > 2
                  ? code.slice(0, code.length - 2)
                  : code.slice(0, 2);
              duuregMatch = res.data.jagsaalt.find(
                (d) => d.kod === duuregKodGuess || d.ner === tok.duuregNer
              );
            }
            if (!duuregMatch && tok?.duuregNer) {
              duuregMatch = res.data.jagsaalt.find(
                (d) => d.ner === tok.duuregNer
              );
            }

            if (duuregMatch) {
              const horooMatch = (duuregMatch.ded || []).find(
                (h) => h.kod === tok?.horoo?.kod || h.ner === tok?.horoo?.ner
              );

              setState((s) => ({
                ...s,
                selectedDuureg: duuregMatch?._id || s.selectedDuureg,
                selectedDuuregData: duuregMatch || s.selectedDuuregData,
                selectedHoroo: horooMatch?.kod || s.selectedHoroo,
                selectedHorooData: horooMatch || s.selectedHorooData,
              }));
            }
          } catch (e) {
            // ignore parsing errors
          }
        }
      } catch (err) {
        aldaaBarigch(err);
      }
    };
    fetchTatvariinAlba();
  }, [token, baiguullaga]);

  // Initialize form state and initial snapshot ONCE after data is ready
  useEffect(() => {
    if (initializedRef.current) return;
    if (!tatvariinAlbaData?.jagsaalt) return;

    // Derive effective tokhirgoo from org or localStorage
    let effectiveTokhirgoo = baiguullaga?.tokhirgoo as any;
    if (!effectiveTokhirgoo?.districtCode && typeof window !== "undefined") {
      try {
        const savedTok = localStorage.getItem("baiguullaga_tokhirgoo");
        if (savedTok) effectiveTokhirgoo = JSON.parse(savedTok);
      } catch (_) {}
    }

    // Derive SÖH name first to avoid async setState timing issues
    const firstBuilding =
      Array.isArray(baiguullaga?.barilguud) && baiguullaga.barilguud.length > 0
        ? baiguullaga.barilguud[0]
        : null;
    const derivedSohNer = firstBuilding?.tokhirgoo?.sohNer
      ? String(firstBuilding.tokhirgoo.sohNer)
      : (baiguullaga?.tokhirgoo as any)?.sohNer
      ? String((baiguullaga!.tokhirgoo as any).sohNer)
      : baiguullaga?.ner
      ? String(baiguullaga.ner)
      : "";

    // Find duureg and horoo matches from tax office data
    let duuregMatch: Duureg | undefined;
    let horooMatch: Horoo | undefined;
    if (effectiveTokhirgoo) {
      const tok = effectiveTokhirgoo as any;
      if (tok?.districtCode) {
        const code = String(tok.districtCode);
        const duuregKodGuess =
          code.length > 2 ? code.slice(0, code.length - 2) : code.slice(0, 2);
        duuregMatch = tatvariinAlbaData.jagsaalt.find(
          (d) => d.kod === duuregKodGuess || d.ner === tok.duuregNer
        );
      }
      if (!duuregMatch && tok?.duuregNer) {
        duuregMatch = tatvariinAlbaData.jagsaalt.find(
          (d) => d.ner === tok.duuregNer
        );
      }
      if (duuregMatch) {
        horooMatch = (duuregMatch.ded || []).find(
          (h) => h.kod === tok?.horoo?.kod || h.ner === tok?.horoo?.ner
        );
      }
    }

    // Apply to state
    setState((s) => ({
      ...s,
      selectedDuureg: duuregMatch?._id || s.selectedDuureg || "",
      selectedDuuregData: duuregMatch || s.selectedDuuregData,
      selectedHoroo: horooMatch?.kod || s.selectedHoroo || "",
      selectedHorooData: horooMatch || s.selectedHorooData,
    }));
    setSohNer((prev) => (prev || derivedSohNer ? derivedSohNer : prev));

    // Capture initial snapshot once
    setInitialValues({
      selectedDuureg: duuregMatch?._id || "",
      selectedHoroo: horooMatch?.kod || "",
      sohNer: derivedSohNer,
    });

    initializedRef.current = true;
  }, [tatvariinAlbaData, baiguullaga]);

  // Update sohNer state when baiguullaga changes (after save operations)
  useEffect(() => {
    const firstBuilding =
      Array.isArray(baiguullaga?.barilguud) && baiguullaga.barilguud.length > 0
        ? baiguullaga.barilguud[0]
        : null;
    if (firstBuilding?.tokhirgoo?.sohNer) {
      setSohNer(String(firstBuilding.tokhirgoo.sohNer));
    } else if ((baiguullaga as any)?.sohNer) {
      setSohNer(String((baiguullaga as any).sohNer));
    } else if (
      baiguullaga?.tokhirgoo &&
      (baiguullaga.tokhirgoo as any)?.sohNer
    ) {
      setSohNer(String((baiguullaga.tokhirgoo as any).sohNer));
    }
  }, [baiguullaga]);

  const handleDuuregChange = (duuregId: string) => {
    const selectedDuuregData = tatvariinAlbaData?.jagsaalt.find(
      (d) => d._id === duuregId
    );

    if (selectedDuuregData) {
      setState((s) => ({
        ...s,
        selectedDuureg: duuregId,
        selectedDuuregData: selectedDuuregData,
        selectedHoroo: "",
        selectedHorooData: undefined,
      }));
    }
  };

  const handleHorooChange = (horooKod: string) => {
    if (!state.selectedDuureg) {
      openErrorOverlay("Дүүрэг эхлээд сонгоно уу");
      return;
    }

    const selectedHorooData = selectedDistrict?.ded?.find(
      (h) => h.kod === horooKod
    );

    if (selectedHorooData) {
      setState((s) => ({
        ...s,
        selectedHoroo: horooKod,
        selectedHorooData: selectedHorooData,
      }));
    }
  };

  const khadgalakh = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх токен олдсонгүй");
      return;
    }

    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }

    // Check if there are any changes
    const hasChanges =
      state.selectedDuureg !== initialValues.selectedDuureg ||
      state.selectedHoroo !== initialValues.selectedHoroo ||
      sohNer.trim() !== (initialValues.sohNer || "").trim();

    if (!hasChanges) {
      openErrorOverlay("Өөрчлөлт байхгүй байна");
      return;
    }

    if (!state.selectedDuuregData) {
      openErrorOverlay("Дүүрэг сонгоно уу");
      return;
    }

    if (!state.selectedHorooData) {
      openErrorOverlay("Хороо сонго уу");
      return;
    }

    setIsSaving(true);

    try {
      const duuregKod = state.selectedDuuregData.kod || "";
      const horooKod = state.selectedHorooData.kod || "";
      const districtCodeCombined = `${duuregKod}${horooKod}`;

      // Ensure we have a valid sohNer value
      const finalSohNer = sohNer || baiguullaga?.ner || "";

      const payload: any = {
        ...(baiguullaga || {}),
        _id: baiguullaga!._id,
        eBarimtAutomataarIlgeekh:
          typeof baiguullaga?.eBarimtAutomataarIlgeekh === "boolean"
            ? baiguullaga?.eBarimtAutomataarIlgeekh
            : false,
        nuatTulukhEsekh:
          typeof baiguullaga?.nuatTulukhEsekh === "boolean"
            ? baiguullaga?.nuatTulukhEsekh
            : false,
        eBarimtAshiglakhEsekh: baiguullaga?.eBarimtAshiglakhEsekh ?? true,
        eBarimtShine: baiguullaga?.eBarimtShine ?? false,
        tokhirgoo: {
          ...(baiguullaga?.tokhirgoo || {}),
          duuregNer: state.selectedDuuregData.ner,
          districtCode: districtCodeCombined,
          horoo: {
            ner: state.selectedHorooData.ner,
            kod: state.selectedHorooData.kod,
          },
          sohNer: finalSohNer,
        },
      };

      const updated = await updateBaiguullaga(
        token || undefined,
        baiguullaga!._id,
        payload
      );

      if (updated) {
        await baiguullagaMutate(updated, false);
      }

      // Show success overlay
      openSuccessOverlay("Амжилттай хадгаллаа", 2000);

      // Revalidate in background
      const revalidated = await baiguullagaMutate();

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "baiguullaga_tokhirgoo",
          JSON.stringify(payload.tokhirgoo)
        );
      }

      // Update initial values after successful save
      setInitialValues({
        selectedDuureg: state.selectedDuureg || "",
        selectedHoroo: state.selectedHoroo || "",
        sohNer: sohNer || "",
      });

      setSongogdsonTsonkhniiIndex(1);
    } catch (err) {
      aldaaBarigch(err);
      openErrorOverlay("Хадгалахад алдаа гарлаа");
    } finally {
      setIsSaving(false);
      // REMOVED: hideSpinner();
    }
  };

  // New minimal API call to register a building with SÖH name
  // NOTE: Previously there was a separate "Барилга бүртгэх" action.
  // We now consolidate into a single Save (khadgalakh) button,
  // so this function has been removed in favor of unified save logic.

  const selectedDistrict = tatvariinAlbaData?.jagsaalt.find(
    (d) => d._id === state.selectedDuureg
  );

  // Derived dirty flag for UI (disable Save when no changes)
  const isDirty = useMemo(() => {
    return (
      (state.selectedDuureg || "") !== (initialValues.selectedDuureg || "") ||
      (state.selectedHoroo || "") !== (initialValues.selectedHoroo || "") ||
      (sohNer || "").trim() !== (initialValues.sohNer || "").trim()
    );
  }, [state.selectedDuureg, state.selectedHoroo, sohNer, initialValues]);

  return (
    <div className="xxl:col-span-9 col-span-12 lg:col-span-12 h-full overflow-visible">
      {tatvariinAlbaData?.jagsaalt && (
        <div className="neu-panel allow-overflow p-4 md:p-6 space-y-6 min-h-[24rem]">
          {/* 2x2 grid: 1) Дүүрэг, 2) Хороо, 3) Барилгын нэр, 4) СӨХ-ийн нэр */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1) Дүүрэг */}
            <div className="w-full">
              <label className="block text-sm font-medium text-theme mb-1">
                Дүүрэг
              </label>
              <TusgaiZagvar
                value={state.selectedDuureg || ""}
                onChange={(v) => handleDuuregChange(v)}
                options={(tatvariinAlbaData?.jagsaalt || []).map((duureg) => ({
                  value: duureg._id || "",
                  label: duureg.ner,
                }))}
                placeholder="Сонгоно уу"
                className="w-full"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-theme mb-1">
                Хороо
              </label>
              <TusgaiZagvar
                value={state.selectedHoroo || ""}
                onChange={(v) => handleHorooChange(v)}
                options={(selectedDistrict?.ded || []).map((horoo) => ({
                  value: horoo.kod,
                  label: horoo.ner,
                }))}
                placeholder="Сонгоно уу"
                className="w-full"
                disabled={!state.selectedDuureg}
              />
            </div>

            {/* 4) СӨХ-ийн нэр */}
            <div className="w-full">
              <label className="block text-sm font-medium text-theme mb-1">
                СӨХ-ийн нэр
              </label>
              <input
                type="text"
                value={sohNer}
                onChange={(e) => setSohNer(e.target.value)}
                placeholder="СӨХ-ийн нэрийг оруулна уу"
                className="w-full px-3 py-2 neu-panel focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Single Save button */}
          <div className="flex justify-end">
            <button
              onClick={khadgalakh}
              className={`btn-minimal btn-save ${
                !isDirty || isSaving ? "opacity-60 cursor-not-allowed" : ""
              }`}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhuviinMedeelel;
