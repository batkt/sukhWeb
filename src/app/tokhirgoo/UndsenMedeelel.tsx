"use client";

import React, { useEffect, useState } from "react";
import { Loader } from "@mantine/core";
import uilchilgee, {
  aldaaBarigch,
  updateBaiguullaga,
} from "../../../lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";
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
      toast.error("Нэвтрэх токен олдсонгүй");
      return;
    }

    if (!baiguullaga?._id) {
      toast.error("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }

    if (!state.selectedDuuregData) {
      toast.error("Дүүрэг сонгоно уу");
      return;
    }

    if (!state.selectedHorooData) {
      toast.error("Хороо сонго уу");
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

      const payload: any = {
        // keep id for clarity
        _id: baiguullaga!._id,
        // top-level merchant TIN (also duplicated under tokhirgoo/building tokhirgoo)
        merchantTin:
          merchantTin ||
          baiguullaga?.merchantTin ||
          baiguullaga?.tokhirgoo?.merchantTin ||
          "",
        // ensure the 2 flags the user requested live on baiguullaga top-level
        eBarimtAutomataarIlgeekh:
          typeof baiguullaga?.eBarimtAutomataarIlgeekh === "boolean"
            ? baiguullaga?.eBarimtAutomataarIlgeekh
            : false,
        nuatTulukhEsekh:
          typeof baiguullaga?.nuatTulukhEsekh === "boolean"
            ? baiguullaga?.nuatTulukhEsekh
            : false,
        // other eBarimt options (keep existing or default)
        eBarimtAshiglakhEsekh: baiguullaga?.eBarimtAshiglakhEsekh ?? true,
        eBarimtShine: baiguullaga?.eBarimtShine ?? false,
        // attach top-level tokhirgoo object with district/horoo info
        tokhirgoo: {
          merchantTin: merchantTin || baiguullaga?.tokhirgoo?.merchantTin || "",
          duuregNer: state.selectedDuuregData.ner,
          districtCode: districtCodeCombined,
          horoo: {
            ner: state.selectedHorooData.ner,
            kod: state.selectedHorooData.kod,
          },
          sohCode: baiguullaga?.tokhirgoo?.sohCode || "СӨХ-001",
          // preserve small tokhirgoo numeric settings if they exist
          aldangiinKhuvi: baiguullaga?.tokhirgoo?.aldangiinKhuvi,
          aldangiChuluulukhKhonog:
            baiguullaga?.tokhirgoo?.aldangiChuluulukhKhonog,
          baritsaaAvakhSar: baiguullaga?.tokhirgoo?.baritsaaAvakhSar,
        },
        // barilguud array
        barilguud: barilguudArray,
      };

      // Use helper which handles errors consistently
      await updateBaiguullaga(token || undefined, baiguullaga!._id, payload);

      // revalidate local cache
      baiguullagaMutate();

      toast.success("Амжилттай хадгаллаа");
      setSongogdsonTsonkhniiIndex(1);
    } catch (err) {
      aldaaBarigch(err);
      toast.error("Хадгалахад алдаа гарлаа");
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
                <label className="block text-sm font-medium text-theme mb-1">
                  Татвар төлөгчийн дугаар (TIN)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={merchantTin}
                  onChange={(e) => setMerchantTin(e.target.value.trim())}
                  placeholder="Татварын бүртгэлийн дугаар"
                  className="w-full rounded-2xl border px-4 py-2 text-theme bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                  disabled={isLoading}
                />
              </div>

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
