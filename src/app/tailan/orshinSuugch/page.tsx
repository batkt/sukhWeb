"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageSongokh from "components/selectZagvar/pageSongokh";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useGereeJagsaalt } from "@/lib/useGeree";
import uilchilgee from "lib/uilchilgee";

export default function OrshinSuugchReportPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId || null;

  // org details (optional, may be used later)
  const { baiguullaga } = useBaiguullaga(token || null, baiguullagiinId);
  // Residents list (uses existing hook with org/branch enforcement)
  const {
    orshinSuugchGaralt,
    orshinSuugchJagsaaltMutate,
    setOrshinSuugchKhuudaslalt,
    isValidating: isValidatingSuugch,
  } = useOrshinSuugchJagsaalt(token || "", baiguullagiinId || "", {});

  // Contracts list (for counts if needed)
  const { gereeGaralt } = useGereeJagsaalt(
    {},
    token || undefined,
    baiguullagiinId || undefined,
    barilgiinId || undefined
  );

  // Summary from server endpoint (small SWR-like manual fetch)
  const [summary, setSummary] = useState<any | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token || !baiguullagiinId) return;

      // compute start/end of current month as yyyy-MM-dd
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const payload = {
        baiguullagiinId,
        barilgiinId: barilgiinId || null,
        ekhlekhOgnoo: fmt(start),
        duusakhOgnoo: fmt(end),
      };

      try {
        // use POST as requested
        const resp = await uilchilgee(token).post(`/tailan/summary`, payload);
        const data = resp.data;
        const returnedOrgId =
          data?.filter?.baiguullagiinId ||
          data?.baiguullagiinId ||
          data?.baiguullaga?.id ||
          null;
        if (returnedOrgId && returnedOrgId !== baiguullagiinId) {
          if (!cancelled) setSummary({ accessDenied: true });
        } else {
          if (!cancelled) setSummary(data);
        }
      } catch (err: any) {
        console.error("Summary load error (POST):", err?.message || err);
        const respData = err?.response?.data;
        if (respData && (respData.summary || respData.success)) {
          const returnedOrgId =
            respData?.filter?.baiguullagiinId ||
            respData?.baiguullagiinId ||
            respData?.baiguullaga?.id ||
            null;
          if (returnedOrgId && returnedOrgId !== baiguullagiinId) {
            if (!cancelled) setSummary({ accessDenied: true });
          } else {
            if (!cancelled) setSummary(respData);
          }
        }
        // otherwise keep summary null
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token, baiguullagiinId, barilgiinId]);

  // Pagination state (default 20 per user's request)
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);

  useEffect(() => {
    // set initial paging for residents hook
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: rowsPerPage,
      search: "",
    });
  }, [rowsPerPage, setOrshinSuugchKhuudaslalt]);

  if (!ajiltan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neu-panel rounded-2xl p-6 text-center">
          <div className="text-lg font-semibold">Нэвтрээгүй байна</div>
          <div className="text-sm text-theme/60 mt-2">
            Энэ тайланг үзэхийн тулд нэвтэрнэ үү.
          </div>

          <div className="rounded-3xl p-6 mt-4 neu-table w-full">
            <h3 className="text-sm font-semibold mb-3">Тайлан - дэлгэрэнгүй</h3>
            {summary?.accessDenied ? (
              <div className="p-4 neu-panel rounded-lg text-sm text-center text-red-600">
                Та өөр байгууллагын мэдээлэл рүү хандах эрхгүй байна.
              </div>
            ) : summary == null ? (
              <div className="p-4 text-sm text-theme/70">
                Татаж авч байна...
              </div>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full">
                {Array.isArray(summary) ? (
                  <table className="table-ui text-xs min-w-full">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Үзүүлэлт</th>
                        <th className="p-2 text-left">Мөнгөн дүн</th>
                        <th className="p-2 text-left">Тэмдэглэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((it: any, i: number) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="p-2">{i + 1}</td>
                          <td className="p-2">
                            {it.name || it.label || JSON.stringify(it)}
                          </td>
                          <td className="p-2">
                            {it.amount ?? it.value ?? "-"}
                          </td>
                          <td className="p-2">
                            {it.note ?? it.description ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : summary?.summary ? (
                  // try to render nested summary keys
                  <table className="table-ui text-xs min-w-full">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">Категори</th>
                        <th className="p-2 text-left">Тоо / Дүн</th>
                        <th className="p-2 text-left">Нэмэлт</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.summary).map(([k, v]: any) => (
                        <tr key={k} className="border-b last:border-b-0">
                          <td className="p-2">{k}</td>
                          <td className="p-2">
                            {typeof v === "object"
                              ? v.totalCount ?? v.total ?? JSON.stringify(v)
                              : String(v)}
                          </td>
                          <td className="p-2">
                            {typeof v === "object"
                              ? v.totalAmount ?? v.stats?.totalAmount ?? "-"
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-xs text-theme/70">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(summary, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!baiguullagiinId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neu-panel rounded-2xl p-6 text-center">
          <div className="text-lg font-semibold">Байгууллага тохиргоогүй</div>
          <div className="text-sm text-theme/60 mt-2">
            Та байгууллагатай холбогдоод тайланг үзнэ үү.
          </div>
        </div>
      </div>
    );
  }

  const residents: any[] = orshinSuugchGaralt?.jagsaalt || [];

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-theme"
          >
            Оршин суугч / Тайлан
          </motion.h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="neu-panel rounded-2xl p-4">
            <div className="text-sm text-theme">Оршин суугч</div>
            <div className="text-2xl font-bold mt-2">{residents.length}</div>
          </div>
          <div className="neu-panel rounded-2xl p-4">
            <div className="text-sm text-theme">Гэрээ</div>
            <div className="text-2xl font-bold mt-2">
              {gereeGaralt?.niitMur ?? 0}
            </div>
          </div>
          <div className="neu-panel rounded-2xl p-4">
            <div className="text-sm text-theme">Нийт нэхэмжлэх</div>
            <div className="text-2xl font-bold mt-2">
              {summary?.summary?.invoices?.total ?? "-"}
            </div>
            <div className="text-xs text-theme/70 mt-1">
              Дүн: {summary?.summary?.invoices?.stats?.totalAmount ?? "-"} ₮
            </div>
          </div>
          <div className="neu-panel rounded-2xl p-4">
            <div className="text-sm text-theme">Нийт гүйлгээ</div>
            <div className="text-2xl font-bold mt-2">
              {summary?.summary?.payments?.totalCount ?? "-"}
            </div>
            <div className="text-xs text-theme/70 mt-1">
              Дүн: {summary?.summary?.payments?.totalAmount ?? "-"} ₮
            </div>
          </div>
        </div>

        <div className="table-surface overflow-hidden rounded-2xl w-full">
          <div className="rounded-3xl p-6 mb-2 neu-table allow-overflow">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar w-full">
              <table className="table-ui text-xs min-w-full">
                <thead className="z-10 bg-white dark:bg-gray-800">
                  <tr>
                    <th className="p-1 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                      №
                    </th>
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Нэр
                    </th>
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Холбоо барих
                    </th>
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Хаяг
                    </th>
                    <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                      Төлөв
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {residents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-subtle">
                        Мэдээлэл олдсонгүй
                      </td>
                    </tr>
                  ) : (
                    residents.map((r: any, idx: number) => (
                      <tr
                        key={r._id || idx}
                        className="transition-colors border-b last:border-b-0"
                      >
                        <td className="p-1 text-center text-theme">
                          {idx + 1}
                        </td>
                        <td className="p-1 text-theme whitespace-nowrap text-center">
                          {r.ner || "-"}
                        </td>
                        <td className="p-1 text-center">
                          <div className="text-xs text-theme">
                            {Array.isArray(r.utas)
                              ? r.utas.join(", ")
                              : r.utas || "-"}
                          </div>
                          {r.email && (
                            <div className="text-xxs text-theme/70">
                              {r.email}
                            </div>
                          )}
                        </td>
                        <td className="p-1 text-center">
                          {r.khayag || r.aimag || "-"}
                        </td>
                        <td className="p-1 text-center">{r.tuluv || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full px-1 gap-3 z-1005">
            <div className="flex items-end gap-2 !mt-1 sm:ml-auto sm:mt-0 z-1005">
              <PageSongokh
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(v);
                  setOrshinSuugchKhuudaslalt({
                    khuudasniiDugaar: 1,
                    khuudasniiKhemjee: v,
                    search: "",
                  });
                }}
                className="text-xs px-2 py-1 relative z-30"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
