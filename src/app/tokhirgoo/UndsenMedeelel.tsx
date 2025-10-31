"use client";

import React, { useEffect, useState } from "react";
import { Loader } from "@mantine/core";
import uilchilgee, {
  aldaaBarigch,
  updateBaiguullaga,
} from "../../../lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";

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
  const [isLoading, setIsLoading] = useState(false);
  const { token, baiguullaga, baiguullagaMutate } = useAuth();
  const [merchantTin, setMerchantTin] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    const fetchTatvariinAlba = async () => {
      try {
        const res = await uilchilgee(token).get<TatvariinAlbaResponse>(
          "/tatvariinAlba"
        );
        setTatvariinAlbaData(res.data);

        if (baiguullaga?.duureg && typeof baiguullaga.duureg !== "string") {
          const duuregObj = baiguullaga.duureg;
          setState((s) => ({
            ...s,
            selectedDuureg: duuregObj._id || "",
            selectedDuuregData: duuregObj,
          }));
        }
        if (baiguullaga?.horoo && typeof baiguullaga.horoo !== "string") {
          const horooObj = baiguullaga.horoo;
          setState((s) => ({
            ...s,
            selectedHoroo: horooObj.kod || "",
            selectedHorooData: horooObj,
          }));
        }

        // preload merchant TIN if available
        if (baiguullaga?.tokhirgoo?.merchantTin) {
          setMerchantTin(String(baiguullaga.tokhirgoo.merchantTin));
        }

        // If server doesn't include top-level duureg/horoo or tokhirgoo yet,
        // try to read last-saved values from localStorage as a fallback so
        // the UI remains consistent after refresh.
        if (
          (!baiguullaga?.tokhirgoo ||
            Object.keys(baiguullaga.tokhirgoo).length === 0) &&
          typeof window !== "undefined"
        ) {
          try {
            const savedTok = localStorage.getItem("baiguullaga_tokhirgoo");
            const savedDu = localStorage.getItem("baiguullaga_duureg");
            const savedHo = localStorage.getItem("baiguullaga_horoo");
            if (savedTok) {
              const tok = JSON.parse(savedTok);
              setMerchantTin(String(tok.merchantTin || ""));
            }
            if ((savedDu || savedHo) && res.data?.jagsaalt) {
              const duObj = savedDu ? JSON.parse(savedDu) : null;
              const hoObj = savedHo ? JSON.parse(savedHo) : null;
              // find matching duureg/horoo objects in tatvariinAlba
              if (duObj) {
                const duMatch = res.data.jagsaalt.find(
                  (d: Duureg) =>
                    d._id === duObj._id ||
                    d.ner === duObj.ner ||
                    d.kod === duObj.kod
                );
                const horooMatch =
                  duMatch && hoObj
                    ? (duMatch.ded || []).find(
                        (h) => h.kod === hoObj.kod || h.ner === hoObj.ner
                      )
                    : undefined;
                if (duMatch) {
                  setState((s) => ({
                    ...s,
                    selectedDuureg: duMatch._id || s.selectedDuureg,
                    selectedDuuregData: duMatch || s.selectedDuuregData,
                    selectedHoroo: horooMatch?.kod || s.selectedHoroo,
                    selectedHorooData: horooMatch || s.selectedHorooData,
                  }));
                }
              }
            }
          } catch (e) {
            // ignore JSON/localStorage parse errors
          }
        }

        // If top-level duureg/horoo are not objects (or missing), try to derive
        // them from the saved `tokhirgoo` (districtCode / duuregNer / horoo).
        if (
          res.data?.jagsaalt &&
          (!baiguullaga?.duureg || typeof baiguullaga.duureg === "string") &&
          baiguullaga?.tokhirgoo
        ) {
          try {
            const tok = baiguullaga.tokhirgoo as any;
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

    if (!state.selectedDuuregData) {
      openErrorOverlay("Дүүрэг сонгоно уу");
      return;
    }

    if (!state.selectedHorooData) {
      openErrorOverlay("Хороо сонго уу");
      return;
    }

    setIsLoading(true);

    try {
      const duuregKod = state.selectedDuuregData.kod || "";
      const horooKod = state.selectedHorooData.kod || "";
      // District code must include horoo code (e.g., 35 + 01 -> 3501)
      const districtCodeCombined = `${duuregKod}${horooKod}`;

      // build default building entry from existing baiguullaga or minimal tokhirgoo
      const defaultBuilding = {
        bairshil: {
          coordinates: [],
        },
        tokhirgoo: {
          merchantTin: merchantTin || baiguullaga?.tokhirgoo?.merchantTin || "",
          duuregNer: state.selectedDuuregData.ner,
          districtCode: districtCodeCombined,
          horoo: {
            ner: state.selectedHorooData.ner,
            kod: state.selectedHorooData.kod,
          },
          sohCode: baiguullaga?.tokhirgoo?.sohCode || "СӨХ-001",
        },
      };

      // merge existing barilguud if present, otherwise create array with default building
      const barilguudArray = Array.isArray(baiguullaga?.barilguud)
        ? baiguullaga!.barilguud!.map((b: any) => ({
            // ensure minimal shape for each building
            bairshil: b?.bairshil || { coordinates: [] },
            tokhirgoo: {
              aldangiinKhuvi:
                b?.tokhirgoo?.aldangiinKhuvi ??
                baiguullaga?.tokhirgoo?.aldangiinKhuvi ??
                0,
              aldangiChuluulukhKhonog:
                b?.tokhirgoo?.aldangiChuluulukhKhonog ??
                baiguullaga?.tokhirgoo?.aldangiChuluulukhKhonog ??
                0,
              baritsaaAvakhSar:
                b?.tokhirgoo?.baritsaaAvakhSar ??
                baiguullaga?.tokhirgoo?.baritsaaAvakhSar ??
                0,
              merchantTin:
                b?.tokhirgoo?.merchantTin ??
                merchantTin ??
                baiguullaga?.tokhirgoo?.merchantTin ??
                "",
              sohCode:
                b?.tokhirgoo?.sohCode ??
                baiguullaga?.tokhirgoo?.sohCode ??
                "СӨХ-001",
            },
            ...b,
          }))
        : [defaultBuilding];

      // Merge changes into existing organization object so PUT doesn't wipe other fields
      const payload: any = {
        // start with the existing object to preserve fields the user didn't touch
        ...(baiguullaga || {}),
        // ensure id is present
        _id: baiguullaga!._id,
        // also persist top-level duureg/horoo so the UI can read them on mount
        duureg: state.selectedDuuregData || baiguullaga?.duureg,
        horoo: state.selectedHorooData || baiguullaga?.horoo,
        // top-level merchant TIN (also duplicated under tokhirgoo/building tokhirgoo)
        merchantTin:
          merchantTin ||
          baiguullaga?.merchantTin ||
          baiguullaga?.tokhirgoo?.merchantTin ||
          "",
        // preserve or set eBarimt/nuat flags
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
        // merge tokhirgoo while applying the updated district/horoo and merchantTin
        tokhirgoo: {
          ...(baiguullaga?.tokhirgoo || {}),
          merchantTin: merchantTin || baiguullaga?.tokhirgoo?.merchantTin || "",
          duuregNer: state.selectedDuuregData.ner,
          districtCode: districtCodeCombined,
          horoo: {
            ner: state.selectedHorooData.ner,
            kod: state.selectedHorooData.kod,
          },
          sohCode: baiguullaga?.tokhirgoo?.sohCode || "СӨХ-001",
        },
        // replace/ensure barilguud array with our merged array
        barilguud: barilguudArray,
      };

      // Debug: log outgoing payload to help trace what we're sending
      try {
        console.debug("[UndsenMedeelel] PUT payload:", payload);
      } catch (e) {}

      // Use helper which handles errors consistently and return updated record
      const updated = await updateBaiguullaga(
        token || undefined,
        baiguullaga!._id,
        payload
      );

      // Debug: log server response from PUT
      try {
        console.debug("[UndsenMedeelel] PUT response:", updated);
      } catch (e) {}

      // Optimistically update SWR cache so the UI updates immediately,
      // then force a revalidation (GET) to ensure we display the persisted
      // server-side object (in case the server changed/stripped fields).
      try {
        if (updated) {
          // show server response immediately
          await baiguullagaMutate(updated, false);
        }

        // then revalidate by calling mutate() with no args which triggers the fetcher (GET)
        const revalidated = await baiguullagaMutate();
        try {
          console.debug(
            "[UndsenMedeelel] revalidated GET result:",
            revalidated
          );
        } catch (e) {}
      } catch (e) {
        console.error("baiguullagaMutate failed:", e);
      }

      openSuccessOverlay("Амжилттай хадгаллаа");
      // Persist last saved tokhirgoo/duureg/horoo locally as a fallback in case
      // the backend doesn't return them immediately on GET.
      try {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "baiguullaga_tokhirgoo",
              JSON.stringify(payload.tokhirgoo)
            );
            localStorage.setItem(
              "baiguullaga_duureg",
              JSON.stringify(state.selectedDuuregData || null)
            );
            localStorage.setItem(
              "baiguullaga_horoo",
              JSON.stringify(state.selectedHorooData || null)
            );
          } catch (e) {
            // ignore storage errors
          }
        }
      } catch (e) {}
      setSongogdsonTsonkhniiIndex(1);
    } catch (err) {
      aldaaBarigch(err);
      openErrorOverlay("Хадгалахад алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDistrict = tatvariinAlbaData?.jagsaalt.find(
    (d) => d._id === state.selectedDuureg
  );

  return (
    <div className="xxl:col-span-9 col-span-12 lg:col-span-12 h-full overflow-visible">
      {tatvariinAlbaData?.jagsaalt && (
        <div className="mt-8">
          <h2 className="text-md font-semibold text-theme mb-3">
            Үндсэн мэдээлэл
          </h2>

          <div className="neu-panel allow-overflow p-4 md:p-6 space-y-4 md:space-y-6 min-h-[24rem]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-theme mb-1  ">
                  Дүүрэг
                </label>
                <TusgaiZagvar
                  value={state.selectedDuureg || ""}
                  onChange={(v) => handleDuuregChange(v)}
                  options={(tatvariinAlbaData?.jagsaalt || []).map(
                    (duureg) => ({
                      value: duureg._id || "",
                      label: duureg.ner,
                    })
                  )}
                  placeholder="Сонгоно уу"
                  disabled={isLoading}
                  tone="neutral"
                  className="w-full z-[1001]"
                />
              </div>

              {selectedDistrict && (
                <div className="md:col-span-2">
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
                    disabled={isLoading}
                    tone="neutral"
                    className="w-full z-[1000]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={khadgalakh}
                disabled={isLoading}
                className="btn-minimal btn-save btn-minimal-lg"
              >
                {isLoading ? <Loader size="sm" /> : "Хадгалах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhuviinMedeelel;
