"use client";

import React, { useEffect, useState } from "react";
import { Button } from "antd";
import uilchilgee, { aldaaBarigch } from "../../../lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";

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
      toast.error("Хороо сонгоно уу");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        _id: baiguullaga._id,
        barilguud: {
          tokhirgoo: {
            duuregNer: state.selectedDuuregData.ner,
            districtCode: state.selectedHorooData.ner,
            sohCode: baiguullaga.tokhirgoo?.sohCode || "СӨХ-001",
          },
        },
      };

      await uilchilgee(token).put(`/baiguullaga/${baiguullaga._id}`, payload);

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
    <div className="xxl:col-span-9 col-span-12 lg:col-span-12">
      {tatvariinAlbaData?.jagsaalt && (
        <div className="mt-8 space-y-4">
          <h3 className="text-md font-semibold text-slate-700 mb-2">
            Хувийн мэдээлэл
          </h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Дүүрэг
            </label>
            <select
              value={state.selectedDuureg || ""}
              onChange={(e) => handleDuuregChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              disabled={isLoading}
            >
              <option value="">Сонгоно уу</option>
              {tatvariinAlbaData.jagsaalt.map((duureg) => (
                <option key={duureg._id} value={duureg._id}>
                  {duureg.ner}
                </option>
              ))}
            </select>
          </div>

          {selectedDistrict?.ded && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Хороо
              </label>
              <select
                value={state.selectedHoroo || ""}
                onChange={(e) => handleHorooChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                disabled={isLoading}
              >
                <option value="">Сонгоно уу</option>
                {selectedDistrict.ded.map((horoo) => (
                  <option key={horoo._id} value={horoo.kod}>
                    {horoo.ner}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              size="large"
              onClick={khadgalakh}
              loading={isLoading}
              disabled={isLoading}
              className="rounded-xl shadow-lg"
            >
              Хадгалах
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhuviinMedeelel;
