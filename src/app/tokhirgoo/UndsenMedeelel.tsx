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
  const { showSpinner, hideSpinner } = useSpinner();
  const [merchantTin, setMerchantTin] = useState<string>("");
  const [sohNer, setSohNer] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    const fetchTatvariinAlba = async () => {
      try {
        const res = await uilchilgee(token).get<TatvariinAlbaResponse>(
          "/tatvariinAlba"
        );
        setTatvariinAlbaData(res.data);

        // preload merchant TIN if available
        if (baiguullaga?.tokhirgoo?.merchantTin) {
          setMerchantTin(String(baiguullaga.tokhirgoo.merchantTin));
        }

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
              setMerchantTin(String(effectiveTokhirgoo?.merchantTin || ""));
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

    showSpinner();

    try {
      const duuregKod = state.selectedDuuregData.kod || "";
      const horooKod = state.selectedHorooData.kod || "";
      const districtCodeCombined = `${duuregKod}${horooKod}`;

      // Ensure we have a valid sohNer value
      const finalSohNer = sohNer || baiguullaga?.ner || "";

      // build default building entry
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
          sohNer: finalSohNer, // Use finalSohNer here
        },
      };

      // merge existing barilguud if present
      const barilguudArray = Array.isArray(baiguullaga?.barilguud)
        ? baiguullaga!.barilguud!.map((b: any, index: number) => ({
            ...b,
            bairshil: b?.bairshil || { coordinates: [] },
            tokhirgoo: {
              ...(b?.tokhirgoo || {}),
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
              duuregNer: state.selectedDuuregData!.ner,
              districtCode: districtCodeCombined,
              horoo: {
                ner: state.selectedHorooData!.ner,
                kod: state.selectedHorooData!.kod,
              },
              sohNer: finalSohNer, // Use finalSohNer consistently for all buildings
            },
          }))
        : [defaultBuilding];

      const payload: any = {
        ...(baiguullaga || {}),
        _id: baiguullaga!._id,
        merchantTin:
          merchantTin ||
          baiguullaga?.merchantTin ||
          baiguullaga?.tokhirgoo?.merchantTin ||
          "",
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
          merchantTin: merchantTin || baiguullaga?.tokhirgoo?.merchantTin || "",
          duuregNer: state.selectedDuuregData.ner,
          districtCode: districtCodeCombined,
          horoo: {
            ner: state.selectedHorooData.ner,
            kod: state.selectedHorooData.kod,
          },
          sohNer: finalSohNer, // Also save at top-level tokhirgoo for consistency
        },
        barilguud: barilguudArray,
      };

      const updated = await updateBaiguullaga(
        token || undefined,
        baiguullaga!._id,
        payload
      );

      if (updated) {
        await baiguullagaMutate(updated, false);
      }

      const revalidated = await baiguullagaMutate();

      openSuccessOverlay("Амжилттай хадгаллаа");

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "baiguullaga_tokhirgoo",
          JSON.stringify(payload.tokhirgoo)
        );
      }

      setSongogdsonTsonkhniiIndex(1);
    } catch (err) {
      aldaaBarigch(err);
      openErrorOverlay("Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
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
                    tone="neutral"
                    className="w-full z-[1000]"
                  />
                </div>
              )}

              <div className="md:col-span-2">
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

            <div className="flex justify-end">
              <button
                onClick={khadgalakh}
                className="btn-minimal btn-save btn-minimal-lg"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhuviinMedeelel;
