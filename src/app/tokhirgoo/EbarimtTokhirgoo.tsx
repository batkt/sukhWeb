"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { useAuth } from "@/lib/useAuth";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee from "@/lib/uilchilgee";
import updateMethod from "../../../tools/function/updateMethod";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { useSpinner } from "@/context/SpinnerContext";
import {
  Tooltip,
  TextInput,
  PasswordInput,
  Modal,
  Select,
  Loader,
} from "@mantine/core";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";

// Ulaanbaatar districts and subdistricts (reuse mapping from BarilgiinTokhirgoo)
const districts: Record<string, string[]> = {
  Улаанбаатар: [
    "Сүхбаатар",
    "Баянгол",
    "Чингэлтэй",
    "Хан-Уул",
    "Баянзүрх",
    "Сонгинохайрхан",
    "Налайх",
    "Багануур",
    "Багахангай",
  ],
};

const subDistricts: Record<string, string[]> = {
  Сүхбаатар: [
    "1-р хороо",
    "2-р хороо",
    "3-р хороо",
    "4-р хороо",
    "5-р хороо",
    "6-р хороо",
    "7-р хороо",
    "8-р хороо",
    "9-р хороо",
    "10-р хороо",
    "11-р хороо",
    "12-р хороо",
    "13-р хороо",
    "14-р хороо",
    "15-р хороо",
    "16-р хороо",
    "17-р хороо",
    "18-р хороо",
    "19-р хороо",
    "20-р хороо",
  ],
  Баянгол: [
    "1-р хороо",
    "2-р хороо",
    "3-р хороо",
    "4-р хороо",
    "5-р хороо",
    "6-р хороо",
    "7-р хороо",
    "8-р хороо",
    "9-р хороо",
    "10-р хороо",
    "11-р хороо",
    "12-р хороо",
    "13-р хороо",
    "14-р хороо",
    "15-р хороо",
    "16-р хороо",
    "17-р хороо",
    "18-р хороо",
    "19-р хороо",
    "20-р хороо",
    "21-р хороо",
    "22-р хороо",
    "23-р хороо",
    "24-р хороо",
    "25-р хороо",
    "26-р хороо",
    "27-р хороо",
    "28-р хороо",
    "29-р хороо",
    "30-р хороо",
    "31-р хороо",
    "32-р хороо",
    "33-р хороо",
    "34-р хороо",
  ],

  Чингэлтэй: [
    "1-р хороо",
    "2-р хороо",
    "3-р хороо",
    "4-р хороо",
    "5-р хороо",
    "6-р хороо",
    "7-р хороо",
    "8-р хороо",
    "9-р хороо",
    "10-р хороо",
    "11-р хороо",
    "12-р хороо",
    "13-р хороо",
    "14-р хороо",
    "15-р хороо",
    "16-р хороо",
    "17-р хороо",
    "18-р хороо",
    "19-р хороо",
    "20-р хороо",
    "21-р хороо",
    "22-р хороо",
    "23-р хороо",
    "24-р хороо",
  ],

  "Хан-Уул": [
    "1-р хороо",
    "2-р хороо",
    "3-р хороо",
    "4-р хороо",
    "5-р хороо",
    "6-р хороо",
    "7-р хороо",
    "8-р хороо",
    "9-р хороо",
    "10-р хороо",
    "11-р хороо",
    "12-р хороо",
    "13-р хороо",
    "14-р хороо",
    "15-р хороо",
    "16-р хороо",
    "17-р хороо",
    "18-р хороо",
    "19-р хороо",
    "20-р хороо",
    "21-р хороо",
    "22-р хороо",
    "23-р хороо",
    "24-р хороо",
    "25-р хороо",
  ],

  Баянзүрх: [
    "1-р хороо",
    "2-р хороо",
    "3-р хороо",
    "4-р хороо",
    "5-р хороо",
    "6-р хороо",
    "7-р хороо",
    "8-р хороо",
    "9-р хороо",
    "10-р хороо",
    "11-р хороо",
    "12-р хороо",
    "13-р хороо",
    "14-р хороо",
    "15-р хороо",
    "16-р хороо",
    "17-р хороо",
    "18-р хороо",
    "19-р хороо",
    "20-р хороо",
    "21-р хороо",
    "22-р хороо",
    "23-р хороо",
    "24-р хороо",
    "25-р хороо",
    "26-р хороо",
    "27-р хороо",
    "28-р хороо",
    "29-р хороо",
    "30-р хороо",
    "31-р хороо",
    "32-р хороо",
    "33-р хороо",
    "34-р хороо",
    "35-р хороо",
    "36-р хороо",
    "37-р хороо",
    "38-р хороо",
    "39-р хороо",
    "40-р хороо",
    "41-р хороо",
    "42-р хороо",
    "43-р хороо",
  ],

  Сонгинохайрхан: [
    "1-р хороо",
    "2-р хороо",
    "3-р хороо",
    "4-р хороо",
    "5-р хороо",
    "6-р хороо",
    "7-р хороо",
    "8-р хороо",
    "9-р хороо",
    "10-р хороо",
    "11-р хороо",
    "12-р хороо",
    "13-р хороо",
    "14-р хороо",
    "15-р хороо",
    "16-р хороо",
    "17-р хороо",
    "18-р хороо",
    "19-р хороо",
    "20-р хороо",
    "21-р хороо",
    "22-р хороо",
    "23-р хороо",
    "24-р хороо",
    "25-р хороо",
    "26-р хороо",
    "27-р хороо",
    "28-р хороо",
    "29-р хороо",
    "30-р хороо",
    "31-р хороо",
    "32-р хороо",
    "33-р хороо",
    "34-р хороо",
    "35-р хороо",
    "36-р хороо",
    "37-р хороо",
    "38-р хороо",
    "39-р хороо",
    "40-р хороо",
    "41-р хороо",
    "42-р хороо",
    "43-р хороо",
  ],

  Налайх: [
    "1-р хороо",
    "2-р хороо",
    "3-р хороо",
    "4-р хороо",
    "5-р хороо",
    "6-р хороо",
    "7-р хороо",
    "8-р хороо",
  ],
  Багануур: ["1-р хороо", "2-р хороо", "3-р хороо", "4-р хороо", "5-р хороо"],
  Багахангай: ["1-р хороо", "2-р хороо"],
};
type DateRangeValue = [string | null, string | null] | undefined;

export default function EbarimtTokhirgoo() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();

  const { baiguullaga, baiguullagaMutate } = useAuth();
  const { showSpinner, hideSpinner } = useSpinner();

  // Date range like guilgeeTuukh page
  const [ognoo, setOgnoo] = useState<DateRangeValue>(undefined);
  const [ebAutoSend, setEbAutoSend] = useState<boolean>(false);
  const [ebNuat, setEbNuat] = useState<boolean>(false);
  const [ebAshiglakh, setEbAshiglakh] = useState<boolean>(false);
  const [ebShine, setEbShine] = useState<boolean>(false);
  const [merchantTin, setMerchantTin] = useState<string>("");
  const [duuregNer, setDuuregNer] = useState<string>("");
  const [horooNer, setHorooNer] = useState<string>("");
  const [horooKod, setHorooKod] = useState<string>("");
  const [districtCode, setDistrictCode] = useState<string>("");

  useEffect(() => {
    if (!baiguullaga) return;
    // For eBarimt-specific duureg/horoo we prefer organization-level ebarimt tokhirgoo
    // (it should not follow building.tokhirgoo per user's request)
    const orgTok = (baiguullaga?.tokhirgoo || {}) as any;
    // Load toggles: prefer org-level ebarimt flags; branch-level overrides still respected for send/nuat
    const effBarilgaId = selectedBuildingId || barilgiinId || null;
    const selectedBarilga = Array.isArray(baiguullaga.barilguud)
      ? baiguullaga.barilguud.find(
          (b: any) => String(b?._id || "") === String(effBarilgaId || "")
        )
      : null;

    // Prefer selected building's tokhirgoo for eBarimt flags when a branch
    // is selected. Fall back to org-level tokhirgoo, then top-level org flags.
    const selectedTok = (selectedBarilga?.tokhirgoo || {}) as any;
    let autoSend = Boolean(
      (effBarilgaId ? selectedTok?.eBarimtAutomataarIlgeekh : undefined) ??
        orgTok?.eBarimtAutomataarIlgeekh ??
        baiguullaga.eBarimtAutomataarIlgeekh
    );
    let nuat = Boolean(
      (effBarilgaId ? selectedTok?.nuatTulukhEsekh : undefined) ??
        orgTok?.nuatTulukhEsekh ??
        baiguullaga.nuatTulukhEsekh ??
        selectedTok?.nuatTulukhEsekh
    );
    let ashiglakh = Boolean(
      (effBarilgaId ? selectedTok?.eBarimtAshiglakhEsekh : undefined) ??
        orgTok?.eBarimtAshiglakhEsekh ??
        baiguullaga.eBarimtAshiglakhEsekh ??
        true
    );
    let shine = Boolean(
      (effBarilgaId ? selectedTok?.eBarimtShine : undefined) ??
        orgTok?.eBarimtShine ??
        baiguullaga.eBarimtShine ??
        false
    );

    // Merchant TIN: prefer selected building's tokhirgoo.merchantTin when a branch
    // is selected, otherwise prefer org-level tokhirgoo merchantTin or top-level merchantTin.
    let tin = String(
      (selectedBarilga
        ? selectedTok?.merchantTin ??
          orgTok?.merchantTin ??
          baiguullaga.merchantTin
        : orgTok?.merchantTin ?? baiguullaga.merchantTin) || ""
    );

    // eBarimt-specific location (duureg/horoo) should follow building selection like flags
    let duureg = String(
      (effBarilgaId ? selectedTok?.EbarimtDuuregNer : undefined) ??
        orgTok?.EbarimtDuuregNer ??
        (baiguullaga.duureg || "")
    );
    let horooObj = (effBarilgaId ? selectedTok?.EbarimtDHoroo : undefined) ??
      orgTok?.EbarimtDHoroo ?? { ner: "", kod: "" };
    let district = String(
      ((effBarilgaId ? selectedTok?.EbarimtDistrictCode : undefined) ??
        orgTok?.EbarimtDistrictCode) ||
        ""
    );

    // Removed localStorage fallback: always prefer backend state

    setEbAutoSend(autoSend);
    setEbNuat(nuat);
    setEbAshiglakh(ashiglakh);
    setEbShine(shine);
    setMerchantTin(tin);
    setDuuregNer(duureg);
    setHorooNer(horooObj?.ner || "");
    setHorooKod(horooObj?.kod || "");
    setDistrictCode(district);
  }, [baiguullaga, selectedBuildingId, barilgiinId]);

  // Register tour steps for eBarimt tokhirgoo
  const ebarimtTourSteps: DriverStep[] = useMemo(() => {
    return [
      {
        element: "#ebarimt-panel",
        popover: {
          title: "И-Баримт тохиргоо",
          description:
            "И-Баримт системтэй холбох тохиргоонууд (TIN, дүүрэг, хороо, автоматаар илгээх) энд байна.",
          side: "bottom",
        },
      },
      {
        element: "#ebarimt-tin",
        popover: {
          title: "Merchant TIN",
          description:
            "И-баримт системд ашиглах татвар төлөгчийн дугаар (TIN).",
          side: "right",
        },
      },
      {
        element: "#ebarimt-duureg",
        popover: {
          title: "Дүүрэг",
          description: "И-баримт-д ашиглах дүүрэг.",
          side: "right",
        },
      },
      {
        element: "#ebarimt-horoo",
        popover: {
          title: "Хороо",
          description: "Дүүрэг-с сонгосон хороо.",
          side: "right",
        },
      },
      {
        element: "#ebarimt-autosend",
        popover: {
          title: "Автоматаар илгээх",
          description:
            "Нэхэмжлэх/баримтыг хэрэглэгчийн нэрийн өмнөөс автоматаар илгээх тохиргоо.",
          side: "left",
        },
      },
      {
        element: "#ebarimt-save-btn",
        popover: {
          title: "Хадгалах",
          description: "Тохиргоог серверт хадгалах.",
          side: "left",
        },
      },
    ];
  }, [ebAutoSend, ebAshiglakh, duuregNer, horooNer]);

  useRegisterTourSteps("/tokhirgoo/ebarimt", ebarimtTourSteps);
  // Also register under the parent pathname so the tour appears when
  // the URL is `/tokhirgoo` (parent page renders this child component).
  useRegisterTourSteps("/tokhirgoo", ebarimtTourSteps);

  const paramsKey = useMemo(() => {
    if (!token || !ajiltan?.baiguullagiinId) return null;
    const [s, e] = ognoo || [];
    return [
      "/ebarimtJagsaaltAvya",
      token,
      ajiltan.baiguullagiinId,
      barilgiinId || null,
      s || null,
      e || null,
    ];
  }, [token, ajiltan?.baiguullagiinId, barilgiinId, ognoo]);

  const { data, isLoading } = useSWR(
    paramsKey,
    async ([url, tkn, orgId, branch, start, end]: [
      string,
      string,
      string,
      string | null,
      string | null,
      string | null
    ]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          ...(branch ? { barilgiinId: branch } : {}),
          ...(start || end ? { ekhlekhOgnoo: start, duusakhOgnoo: end } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const jagsaalt = Array.isArray(data?.jagsaalt)
    ? data.jagsaalt
    : Array.isArray(data)
    ? data
    : [];

  const t = (s: string) => s;

  return (
    <div id="ebarimt-panel" className="neu-panel">
      <div className="p-4 h-full">
        {isLoading ? (
          <div className="p-8 text-center text-theme/70">
            {t("Ачааллаж байна…")}
          </div>
        ) : (
          <div className="space-y-4 overflow-visible">
            {/* Merchant TIN and district/horoo are only editable when И-Баримт ашиглах эсэх is enabled */}
            {ebAshiglakh && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">
                    Татвар төлөгчийн дугаар (TIN)
                  </label>
                  <input
                    id="ebarimt-tin"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-theme mb-1"
                      id="ebarimt-duureg"
                    >
                      Дүүрэг
                    </label>
                    <TusgaiZagvar
                      value={duuregNer || ""}
                      onChange={(v) => {
                        setDuuregNer(v || "");
                        // clear selected horoo when duureg changes
                        setHorooNer("");
                        setHorooKod("");
                        // compute districtCode reset
                        setDistrictCode("");
                      }}
                      options={Object.keys(districts).flatMap((city) =>
                        districts[city].map((district) => ({
                          value: district,
                          label: district,
                        }))
                      )}
                      placeholder="Сонгоно уу"
                      className="w-full z-[9999]"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-theme mb-1"
                      id="ebarimt-horoo"
                    >
                      Хороо
                    </label>
                    <TusgaiZagvar
                      value={horooNer || ""}
                      onChange={(v) => {
                        setHorooNer(v || "");
                        setHorooKod(v || "");
                        // create districtCode as duureg+horoo for backward compatibility
                        setDistrictCode(`${duuregNer || ""}${v || ""}`);
                      }}
                      options={
                        duuregNer && subDistricts[duuregNer]
                          ? subDistricts[duuregNer].map((horoo) => ({
                              value: horoo,
                              label: horoo,
                            }))
                          : []
                      }
                      placeholder="Сонгоно уу"
                      className="w-full"
                      disabled={!duuregNer || isLoading}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center p-4  rounded-xl shadow-sm border-l-2 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт ашиглах эсэх
                </div>
              </div>
              <div className="ml-auto">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={ebAshiglakh}
                    onChange={(e) => setEbAshiglakh(e.target.checked)}
                    aria-label="И-Баримт ашиглах эсэх"
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {/* <div className="flex items-center p-4   rounded-xl shadow-sm border-l-2 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт 3.0 эсэх
                </div>
              </div>
              <div className="ml-auto">
                <Switch
                  checked={ebShine}
                  onChange={(e) => setEbShine(e.target.checked)}
                  aria-label="И-Баримт 3.0 эсэх"
                />
              </div>
            </div> */}

            <div className="flex items-center p-4   rounded-xl shadow-sm border-l-2 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт автоматаар илгээх эсэх
                </div>
              </div>
              <div className="ml-auto">
                <label className="switch">
                  <input
                    id="ebarimt-autosend"
                    type="checkbox"
                    checked={ebAutoSend}
                    onChange={(e) => setEbAutoSend(e.target.checked)}
                    aria-label="И-Баримт автоматаар илгээх эсэх"
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {/* <div className="flex items-center p-4   rounded-xl shadow-sm border-l-2 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт нөат эсэх
                </div>
              </div>
              <div className="ml-auto">
                <Switch
                  checked={ebNuat}
                  onChange={(e) => setEbNuat(e.target.checked)}
                  aria-label="И-Баримт нөат эсэх"
                />
              </div>
            </div> */}

            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (!token) return openErrorOverlay("Нэвтрэх токен байхгүй");
                  if (!baiguullaga?._id)
                    return openErrorOverlay("Байгууллага олдсонгүй");
                  showSpinner();
                  try {
                    // Build payload that persists eBarimt settings primarily to the
                    // currently selected building's `tokhirgoo`. If no building is
                    // selected, fall back to updating the org-level `tokhirgoo`.
                    const payload: any = {
                      ...(baiguullaga || {}),
                      _id: baiguullaga._id,
                      baiguullagiinId: String(baiguullaga._id),
                    };

                    const effBarilgaId =
                      selectedBuildingId || barilgiinId || null;

                    if (effBarilgaId && Array.isArray(baiguullaga?.barilguud)) {
                      // Update only the selected branch's tokhirgoo
                      payload.barilguud = baiguullaga.barilguud.map(
                        (b: any) => {
                          if (String(b?._id || "") !== String(effBarilgaId))
                            return b;
                          const shouldUpdateTin =
                            merchantTin && merchantTin.trim() !== "";
                          return {
                            ...b,
                            tokhirgoo: {
                              ...(b?.tokhirgoo || {}),
                              ...(shouldUpdateTin ? { merchantTin } : {}),
                              ...(duuregNer
                                ? { EbarimtDuuregNer: duuregNer }
                                : {}),
                              ...(districtCode
                                ? { EbarimtDistrictCode: districtCode }
                                : {}),
                              ...(horooNer || horooKod
                                ? {
                                    EbarimtDHoroo: {
                                      ner: horooNer || "",
                                      kod: horooKod || "",
                                    },
                                  }
                                : {}),
                              // Save ebarimt flags at branch level
                              eBarimtAshiglakhEsekh: ebAshiglakh,
                              eBarimtShine: ebShine,
                              eBarimtAutomataarIlgeekh: ebAutoSend,
                              ...(typeof ebNuat === "boolean"
                                ? { nuatTulukhEsekh: ebNuat }
                                : {}),
                            },
                          };
                        }
                      );
                    } else {
                      // No branch selected: persist at org level
                      payload.eBarimtAutomataarIlgeekh = ebAutoSend;
                      payload.nuatTulukhEsekh = ebNuat;
                      payload.eBarimtAshiglakhEsekh = ebAshiglakh;
                      payload.eBarimtShine = ebShine;
                      if (merchantTin && merchantTin.trim() !== "")
                        payload.merchantTin = merchantTin;
                      payload.duureg = duuregNer;
                      payload.horoo = {
                        ner: horooNer || "",
                        kod: horooKod || "",
                      };
                      payload.tokhirgoo = {
                        ...(baiguullaga?.tokhirgoo || {}),
                        merchantTin:
                          merchantTin ||
                          baiguullaga?.tokhirgoo?.merchantTin ||
                          "",
                        ...(duuregNer ? { EbarimtDuuregNer: duuregNer } : {}),
                        ...(districtCode
                          ? { EbarimtDistrictCode: districtCode }
                          : {}),
                        ...(horooNer || horooKod
                          ? {
                              EbarimtDHoroo: {
                                ner: horooNer || "",
                                kod: horooKod || "",
                              },
                            }
                          : {}),
                      };
                    }

                    const updated = await updateMethod(
                      "baiguullaga",
                      token,
                      payload
                    );
                    if (updated?.data) {
                      await baiguullagaMutate(updated.data, false);
                      // Reflect saved UI state directly from current form values
                      setEbAutoSend(ebAutoSend);
                      setEbNuat(ebNuat);
                      setEbAshiglakh(ebAshiglakh);
                      setEbShine(ebShine);
                      setMerchantTin(merchantTin);
                    }
                    // Removed localStorage persistence for API-backed data
                    openSuccessOverlay("Хадгалагдлаа");
                  } catch (err) {
                    openErrorOverlay("Хадгалахдаа алдаа гарлаа");
                  } finally {
                    hideSpinner();
                  }
                }}
                id="ebarimt-save-btn"
                className="btn-minimal btn-save"
              >
                {t("Хадгалах")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
