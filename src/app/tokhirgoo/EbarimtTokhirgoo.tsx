"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { DatePickerInput } from "@mantine/dates";
import { useAuth } from "@/lib/useAuth";
import uilchilgee, { updateBaiguullaga } from "../../../lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { useSpinner } from "@/context/SpinnerContext";

type DateRangeValue = [string | null, string | null] | undefined;

export default function EbarimtTokhirgoo() {
  const { token, ajiltan, barilgiinId } = useAuth();

  const { baiguullaga, baiguullagaMutate } = useAuth();
  const { showSpinner, hideSpinner } = useSpinner();

  // Date range like guilgeeTuukh page
  const [ognoo, setOgnoo] = useState<DateRangeValue>(undefined);
  const [ebAutoSend, setEbAutoSend] = useState<boolean>(false);
  const [ebNuat, setEbNuat] = useState<boolean>(false);
  const [ebAshiglakh, setEbAshiglakh] = useState<boolean>(false);
  const [ebShine, setEbShine] = useState<boolean>(false);
  const [merchantTin, setMerchantTin] = useState<string>("");

  const MSwitch = ({
    checked,
    onChange,
    id,
    className,
  }: {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    id?: string;
    className?: string;
  }) => (
    <label
      className={`inline-flex items-center cursor-pointer select-none ${
        className ?? ""
      }`}
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="relative w-11 h-6 bg-blue-200 rounded-full transition-colors peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-[var(--color-primary)]">
        <span
          className={`absolute left-0.5 top-0.5 w-5 h-5 bg-blue-800 rounded-full shadow transform transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );

  useEffect(() => {
    if (!baiguullaga) return;
    // Load from server data first
    let autoSend = Boolean(baiguullaga.eBarimtAutomataarIlgeekh);
    let nuat = Boolean(baiguullaga.nuatTulukhEsekh);
    let ashiglakh = Boolean(baiguullaga.eBarimtAshiglakhEsekh ?? true);
    let shine = Boolean(baiguullaga.eBarimtShine);
    let tin = String(
      baiguullaga.merchantTin || baiguullaga.tokhirgoo?.merchantTin || ""
    );

    // If server data is missing, try localStorage
    if (
      !baiguullaga.eBarimtAutomataarIlgeekh &&
      !baiguullaga.nuatTulukhEsekh &&
      baiguullaga.eBarimtAshiglakhEsekh === undefined &&
      !baiguullaga.eBarimtShine &&
      typeof window !== "undefined"
    ) {
      try {
        const saved = localStorage.getItem("baiguullaga_ebarimt");
        if (saved) {
          const parsed = JSON.parse(saved);
          autoSend = Boolean(parsed.eBarimtAutomataarIlgeekh ?? autoSend);
          nuat = Boolean(parsed.nuatTulukhEsekh ?? nuat);
          ashiglakh = Boolean(parsed.eBarimtAshiglakhEsekh ?? ashiglakh);
          shine = Boolean(parsed.eBarimtShine ?? shine);
          tin = String(parsed.merchantTin ?? tin);
        }
      } catch (e) {
        // ignore
      }
    }

    setEbAutoSend(autoSend);
    setEbNuat(nuat);
    setEbAshiglakh(ashiglakh);
    setEbShine(shine);
    setMerchantTin(tin);
  }, [baiguullaga]);

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
            <div className="flex items-center p-4  rounded-xl shadow-sm border-l-4 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт ашиглах эсэх
                </div>
              </div>
              <div className="ml-auto">
                <MSwitch
                  checked={ebAshiglakh}
                  onChange={(e) => setEbAshiglakh(e.target.checked)}
                  aria-label="И-Баримт ашиглах эсэх"
                />
              </div>
            </div>

            <div className="flex items-center p-4   rounded-xl shadow-sm border-l-4 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт 3.0 эсэх
                </div>
              </div>
              <div className="ml-auto">
                <MSwitch
                  checked={ebShine}
                  onChange={(e) => setEbShine(e.target.checked)}
                  aria-label="И-Баримт 3.0 эсэх"
                />
              </div>
            </div>

            <div className="flex items-center p-4   rounded-xl shadow-sm border-l-4 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт автоматаар илгээх эсэх
                </div>
              </div>
              <div className="ml-auto">
                <MSwitch
                  checked={ebAutoSend}
                  onChange={(e) => setEbAutoSend(e.target.checked)}
                  aria-label="И-Баримт автоматаар илгээх эсэх"
                />
              </div>
            </div>

            <div className="flex items-center p-4   rounded-xl shadow-sm border-l-4 border-l-blue-500">
              <div>
                <div className="text-sm font-medium text-theme">
                  И-Баримт нөат эсэх
                </div>
              </div>
              <div className="ml-auto">
                <MSwitch
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
                      // update eBarimt settings
                      eBarimtAutomataarIlgeekh: ebAutoSend,
                      nuatTulukhEsekh: ebNuat,
                      eBarimtAshiglakhEsekh: ebAshiglakh,
                      eBarimtShine: ebShine,
                      // update merchant TIN
                      merchantTin:
                        merchantTin || baiguullaga?.merchantTin || "",
                      // update tokhirgoo merchantTin as well
                      tokhirgoo: {
                        ...(baiguullaga?.tokhirgoo || {}),
                        merchantTin:
                          merchantTin ||
                          baiguullaga?.tokhirgoo?.merchantTin ||
                          "",
                      },
                    };
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
                    // Save to localStorage as fallback since backend may not persist
                    try {
                      if (typeof window !== "undefined") {
                        localStorage.setItem(
                          "baiguullaga_ebarimt",
                          JSON.stringify({
                            eBarimtAutomataarIlgeekh: ebAutoSend,
                            nuatTulukhEsekh: ebNuat,
                            eBarimtAshiglakhEsekh: ebAshiglakh,
                            eBarimtShine: ebShine,
                            merchantTin: merchantTin,
                          })
                        );
                      }
                    } catch (e) {
                      // ignore storage errors
                    }
                    openSuccessOverlay("Хадгалагдлаа");
                  } catch (err) {
                    openErrorOverlay("Хадгалахдаа алдаа гарлаа");
                  } finally {
                    hideSpinner();
                  }
                }}
                className="btn-minimal btn-minimal-lg"
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
