"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee, { updateBaiguullaga } from "../../../lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { useSpinner } from "@/context/SpinnerContext";
import {
  Tooltip,
  Switch,
  TextInput,
  PasswordInput,
  Modal,
  Select,
  Loader,
} from "@mantine/core";
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

  useEffect(() => {
    if (!baiguullaga) return;
    // Resolve selected branch first
    const effBarilgaId = selectedBuildingId || barilgiinId || null;
    const selectedBarilga = Array.isArray(baiguullaga.barilguud)
      ? baiguullaga.barilguud.find(
          (b: any) => String(b?._id || "") === String(effBarilgaId || "")
        )
      : null;
    // Load from server data first
    // Prefer branch toggles when a building is selected
    let autoSend = Boolean(
      selectedBarilga?.tokhirgoo?.eBarimtAutomataarIlgeekh ??
        baiguullaga.eBarimtAutomataarIlgeekh
    );
    // Prefer branch-level VAT flag if backend stores it there; fallback to org-level
    let nuat = Boolean(
      (selectedBarilga?.tokhirgoo as any)?.nuatTulukhEsekh ??
        baiguullaga.nuatTulukhEsekh
    );
    let ashiglakh = Boolean(
      selectedBarilga?.tokhirgoo?.eBarimtAshiglakhEsekh ??
        baiguullaga.eBarimtAshiglakhEsekh ??
        true
    );
    let shine = Boolean(
      selectedBarilga?.tokhirgoo?.eBarimtShine ?? baiguullaga.eBarimtShine
    );
    // Prefer branch-specific merchantTin when a building is selected
    let tin = String(
      selectedBarilga?.tokhirgoo?.merchantTin ||
        baiguullaga.merchantTin ||
        baiguullaga.tokhirgoo?.merchantTin ||
        ""
    );

    // Removed localStorage fallback: always prefer backend state

    setEbAutoSend(autoSend);
    setEbNuat(nuat);
    setEbAshiglakh(ashiglakh);
    setEbShine(shine);
    setMerchantTin(tin);
  }, [baiguullaga, selectedBuildingId, barilgiinId]);

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
          ...(start || end
            ? { query: { ekhlekhOgnoo: start, duusakhOgnoo: end } }
            : {}),
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
    <div className="space-y-6">
      <div className="rounded-2xl p-4 neu-panel">
        {isLoading ? (
          <div className="p-8 text-center text-theme/70">
            {t("Ачааллаж байна…")}
          </div>
        ) : (
          <div className="space-y-4">
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
            <div className="flex items-center p-4  rounded-xl shadow-sm border-l-2 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт ашиглах эсэх
                </div>
              </div>
              <div className="ml-auto">
                <Switch
                  checked={ebAshiglakh}
                  onChange={(e) => setEbAshiglakh(e.target.checked)}
                  aria-label="И-Баримт ашиглах эсэх"
                />
              </div>
            </div>

            <div className="flex items-center p-4   rounded-xl shadow-sm border-l-2 border-l-blue-500">
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
            </div>

            <div className="flex items-center p-4   rounded-xl shadow-sm border-l-2 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт автоматаар илгээх эсэх
                </div>
              </div>
              <div className="ml-auto">
                <Switch
                  checked={ebAutoSend}
                  onChange={(e) => setEbAutoSend(e.target.checked)}
                  aria-label="И-Баримт автоматаар илгээх эсэх"
                />
              </div>
            </div>

            <div className="flex items-center p-4   rounded-xl shadow-sm border-l-2 border-l-blue-500">
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
            </div>

            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (!token) return openErrorOverlay("Нэвтрэх токен байхгүй");
                  if (!baiguullaga?._id)
                    return openErrorOverlay("Байгууллага олдсонгүй");
                  showSpinner();
                  try {
                    const payload: any = {
                      // start with the existing object to preserve fields the user didn't touch
                      ...(baiguullaga || {}),
                      // ensure id is present
                      _id: baiguullaga._id,
                      // also include explicit organization id like other endpoints
                      baiguullagiinId: String(baiguullaga._id),
                      // update eBarimt settings
                      eBarimtAutomataarIlgeekh: ebAutoSend,
                      nuatTulukhEsekh: ebNuat,
                      eBarimtAshiglakhEsekh: ebAshiglakh,
                      eBarimtShine: ebShine,
                      // update merchant TIN (do not overwrite with empty value)
                      ...(merchantTin && merchantTin.trim() !== ""
                        ? { merchantTin }
                        : {}),
                      // update tokhirgoo merchantTin as well
                      tokhirgoo: {
                        ...(baiguullaga?.tokhirgoo || {}),
                        merchantTin:
                          merchantTin ||
                          baiguullaga?.tokhirgoo?.merchantTin ||
                          "",
                      },
                    };

                    // Also persist merchantTin at the selected branch under barilguud[].tokhirgoo
                    try {
                      const effBarilgaId =
                        selectedBuildingId || barilgiinId || null;
                      if (
                        effBarilgaId &&
                        Array.isArray(baiguullaga?.barilguud)
                      ) {
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
                                // Save ebarimt flags at branch level (include VAT if present)
                                eBarimtAshiglakhEsekh: ebAshiglakh,
                                eBarimtShine: ebShine,
                                eBarimtAutomataarIlgeekh: ebAutoSend,
                                ...(typeof payload.nuatTulukhEsekh === "boolean"
                                  ? { nuatTulukhEsekh: payload.nuatTulukhEsekh }
                                  : {}),
                              },
                            };
                          }
                        );
                      }
                    } catch {}
                    const updated = await updateBaiguullaga(
                      token,
                      baiguullaga._id,
                      payload
                    );
                    if (updated) {
                      await baiguullagaMutate(updated, false);
                      // Update local state to reflect saved values immediately
                      setEbAutoSend(payload.eBarimtAutomataarIlgeekh);
                      setEbNuat(payload.nuatTulukhEsekh);
                      setEbAshiglakh(payload.eBarimtAshiglakhEsekh);
                      setEbShine(payload.eBarimtShine);
                      setMerchantTin(payload.merchantTin);
                    }
                    // Removed localStorage persistence for API-backed data
                    openSuccessOverlay("Хадгалагдлаа");
                  } catch (err) {
                    openErrorOverlay("Хадгалахдаа алдаа гарлаа");
                  } finally {
                    hideSpinner();
                  }
                }}
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
