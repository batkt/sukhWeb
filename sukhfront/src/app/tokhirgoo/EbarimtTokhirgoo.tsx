"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { DatePickerInput } from "@mantine/dates";
import { useAuth } from "@/lib/useAuth";
import uilchilgee, { updateBaiguullaga } from "../../../lib/uilchilgee";
import toast from "react-hot-toast";

type DateRangeValue = [string | null, string | null] | undefined;

export default function EbarimtTokhirgoo() {
  const { token, ajiltan, barilgiinId } = useAuth();

  const { baiguullaga, baiguullagaMutate } = useAuth();

  // Date range like guilgeeTuukh page
  const [ognoo, setOgnoo] = useState<DateRangeValue>(undefined);
  const [ebAutoSend, setEbAutoSend] = useState<boolean>(false);
  const [ebNuat, setEbNuat] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!baiguullaga) return;
    setEbAutoSend(Boolean(baiguullaga.eBarimtAutomataarIlgeekh));
    setEbNuat(Boolean(baiguullaga.nuatTulukhEsekh));
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <DatePickerInput
            type="range"
            locale="mn"
            value={ognoo}
            onChange={setOgnoo}
            size="sm"
            radius="md"
            variant="filled"
            clearable
            placeholder="Огноо сонгох"
            className="w-[380px]"
            classNames={{ input: "text-theme placeholder:text-theme" }}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-theme">
            <label className="whitespace-nowrap">
              И-Баримт автоматаар илгээх
            </label>
            <input
              type="checkbox"
              checked={ebAutoSend}
              onChange={(e) => setEbAutoSend(e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-theme">
            <label className="whitespace-nowrap">И-Баримт нөат</label>
            <input
              type="checkbox"
              checked={ebNuat}
              onChange={(e) => setEbNuat(e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="text-sm text-theme">
            {isLoading
              ? t("Ачааллаж байна…")
              : `${t("Нийт")}: ${jagsaalt.length}`}
          </div>

          <button
            onClick={async () => {
              if (!token) return toast.error("Нэвтрэх токен байхгүй");
              if (!baiguullaga?._id)
                return toast.error("Байгууллага олдсонгүй");
              setSaving(true);
              try {
                const payload: any = {
                  _id: baiguullaga._id,
                  eBarimtAutomataarIlgeekh: ebAutoSend,
                  nuatTulukhEsekh: ebNuat,
                };
                await updateBaiguullaga(token, baiguullaga._id, payload);
                baiguullagaMutate();
                toast.success("Хадгалагдлаа");
              } catch (err) {
                toast.error("Хадгалахдаа алдаа гарлаа");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="btn-minimal ml-2"
          >
            {saving ? t("Хадгалж...") : t("Хадгалах")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4 neu-panel allow-overflow">
        {isLoading ? (
          <div className="p-8 text-center text-theme/70">
            {t("Ачааллаж байна…")}
          </div>
        ) : jagsaalt.length === 0 ? (
          <div className="p-8 text-center text-theme/60">
            {t("Мэдээлэл байхгүй")}
          </div>
        ) : (
          <ul className="space-y-2 max-h-[45vh] overflow-y-auto custom-scrollbar">
            {jagsaalt.map((row: any, idx: number) => (
              <li
                key={row?._id || idx}
                className="flex justify-between text-sm border-b last:border-b-0 py-2"
              >
                <span className="text-theme/80">
                  {row?.dugaar || row?.billId || `#${idx + 1}`}
                </span>
                <span className="text-theme">
                  {new Date(
                    row?.ognoo || row?.createdAt || Date.now()
                  ).toLocaleDateString("mn-MN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
