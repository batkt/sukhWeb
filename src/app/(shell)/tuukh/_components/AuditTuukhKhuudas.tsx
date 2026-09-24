"use client";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import useSWR from "swr";
import { Eye } from "lucide-react";
import Table, { type ColumnsType } from "@/components/ui/table";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import FilterSelect from "@/components/ui/FilterSelect";
import PermissionGuard from "@/components/PermissionGuard";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { auditAngilalNer, useAuditTurluud } from "@/lib/auditTurluud";
import TuukhModal from "./TuukhModal";
import {
  type AuditMur,
  type TuukhTurul,
  murKhevjuulekh,
  ognooKharuulakh,
} from "./auditUtils";

/** Хуудас бүрийн ялгаатай хэсэг — бусад нь бүгд нэг */
const TOKHIRGOO: Record<
  TuukhTurul,
  { url: string; buleg: string; khooson: string; delgerengui: boolean }
> = {
  zassan: {
    url: "/audit/zasakhTuukh",
    buleg: "Зассан бүртгэл",
    khooson: "Зассан түүх олдсонгүй",
    delgerengui: true,
  },
  ustgasan: {
    url: "/audit/ustgakhTuukh",
    buleg: "Устгасан бүртгэл",
    khooson: "Устгасан түүх олдсонгүй",
    delgerengui: true,
  },
};

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500];

const ognooEremb = (a: string | null, b: string | null) =>
  (a ? Date.parse(a) : 0) - (b ? Date.parse(b) : 0);

const textEremb = (a: string, b: string) => a.localeCompare(b, "mn");

function AuditTuukhAgguulga({ turul }: { turul: TuukhTurul }) {
  const { token, baiguullaga } = useAuth();
  const orgId = baiguullaga?._id;
  const tokhirgoo = TOKHIRGOO[turul];

  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().endOf("month").format("YYYY-MM-DD"),
  ]);
  const [ajiltniiId, setAjiltniiId] = useState("");
  const [model, setModel] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [songogdson, setSongogdson] = useState<AuditMur | null>(null);

  const { angilaluud } = useAuditTurluud(
    token,
    orgId,
    turul,
    dateRange[0],
    dateRange[1],
  );

  const { data: ajiltnuudData } = useSWR(
    token && orgId ? ["/ajiltan", token, orgId] : null,
    async ([url, tkn, id]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: { baiguullagiinId: id, khuudasniiKhemjee: 1000 },
      });
      return resp.data?.jagsaalt || resp.data?.data || [];
    },
    { revalidateOnFocus: false },
  );

  const ajiltanOptions = useMemo(() => {
    if (!Array.isArray(ajiltnuudData)) return [];
    return ajiltnuudData
      .map((e: any) => {
        const ner =
          typeof e.ner === "object" && e.ner
            ? `${e.ner.ovog || ""} ${e.ner.ner || ""}`
            : `${e.ovog || ""} ${e.ner || ""}`;
        return { value: String(e._id), label: ner.trim() || e.nevtrekhNer || "Нэргүй" };
      })
      .sort((a, b) => textEremb(a.label, b.label));
  }, [ajiltnuudData]);

  // ID → ажилтны нэр (repliedBy, ajiltniiId г.м. утгыг нэрээр харуулна)
  const ajiltanIdNer = useMemo(
    () => Object.fromEntries(ajiltanOptions.map((o) => [o.value, o.label])),
    [ajiltanOptions],
  );

  const { data, isLoading } = useSWR(
    token && orgId
      ? [tokhirgoo.url, token, orgId, dateRange[0] || "", dateRange[1] || "", model, ajiltniiId]
      : null,
    async ([url, tkn, id, ekh, duus, m, aj]) => {
      const params: Record<string, unknown> = {
        baiguullagiinId: id,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 10000,
      };
      if (m) params.modelName = m;
      if (aj) params.ajiltniiId = aj;
      if (ekh && duus) {
        params.ekhlekhOgnoo = `${ekh} 00:00:00`;
        params.duusakhOgnoo = `${duus} 23:59:59`;
      }
      const resp = await uilchilgee(tkn).get(url, { params });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const murnuud = useMemo(() => {
    const raw: any[] = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : [];
    const seen = new Set<string>();
    return raw
      .filter(Boolean)
      .map(murKhevjuulekh)
      .filter((m) => {
        if (m._id) {
          if (seen.has(m._id)) return false;
          seen.add(m._id);
        }
        // Server талын шүүлт алдвал ч гэсэн клиент дээр давхар шүүнэ
        if (model && m.turul.toLowerCase() !== model.toLowerCase()) return false;
        if (ajiltniiId && m.ajiltniiId && m.ajiltniiId !== ajiltniiId) return false;
        // Зөвхөн огнооны талбар (updatedAt г.м.) өөрчлөгдсөн засвар — дуу чимээ
        if (turul === "zassan" && m.niitUurchlult > 0 && m.uurchlultuud.length === 0)
          return false;
        return true;
      });
  }, [data, model, ajiltniiId, turul]);

  const turulOptions = useMemo(
    () => angilaluud.map((a) => ({ value: a.value, label: a.label, tailbar: String(a.too) })),
    [angilaluud],
  );

  const columns: ColumnsType<AuditMur> = useMemo(() => {
    const uildel: ColumnsType<AuditMur> = [
      {
        key: "ajiltan",
        title: "Ажилтан",
        width: 180,
        sorter: (a, b) => textEremb(a.ajiltniiNer, b.ajiltniiNer),
        render: (_: unknown, r) => (
          <span className="text-[color:var(--panel-text)]">{r.ajiltniiNer}</span>
        ),
      },
      {
        key: "uildelOgnoo",
        title: "Огноо",
        width: 150,
        align: "center",
        sorter: (a, b) => ognooEremb(a.uildelOgnoo, b.uildelOgnoo),
        render: (_: unknown, r) => (
          <span className="tabular-nums">{ognooKharuulakh(r.uildelOgnoo, true)}</span>
        ),
      },
    ];

    if (turul === "ustgasan") {
      uildel.push({
        key: "shaltgaan",
        title: "Шалтгаан",
        width: 200,
        ellipsis: true,
        render: (_: unknown, r) =>
          r.shaltgaan ? (
            <span title={r.shaltgaan}>{r.shaltgaan}</span>
          ) : (
            <span className="text-[color:var(--muted-text)]">-</span>
          ),
      });
    }

    if (tokhirgoo.delgerengui) {
      uildel.push({
        key: "delgerengui",
        title: turul === "zassan" ? "Өөрчлөлт" : "Дэлгэрэнгүй",
        width: 110,
        align: "center",
        render: (_: unknown, r) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSongogdson(r);
            }}
            title="Дэлгэрэнгүй үзэх"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-brand transition-colors hover:bg-theme/10"
          >
            <Eye className="h-4 w-4" />
            {turul === "zassan" && r.uurchlultuud.length > 0 && (
              <span className="tabular-nums">{r.uurchlultuud.length}</span>
            )}
          </button>
        ),
      });
    }

    return [
      {
        key: "index",
        title: "#",
        width: 50,
        align: "center",
        // Хүснэгт индексийг хуудаслалтыг тооцсон байдлаар өгдөг
        render: (_: unknown, __: AuditMur, i: number) => i + 1,
      },
      {
        key: "bichlegBuleg",
        title: "Бүртгэсэн мэдээлэл",
        align: "center",
        children: [
          {
            key: "bichlegiinOgnoo",
            title: "Огноо",
            width: 110,
            align: "center",
            sorter: (a, b) => ognooEremb(a.bichlegiinOgnoo, b.bichlegiinOgnoo),
            render: (_: unknown, r) => (
              <span className="tabular-nums">{ognooKharuulakh(r.bichlegiinOgnoo)}</span>
            ),
          },
          {
            key: "turul",
            title: "Төрөл",
            width: 150,
            sorter: (a, b) => textEremb(auditAngilalNer(a.turul), auditAngilalNer(b.turul)),
            render: (_: unknown, r) => auditAngilalNer(r.turul),
          },
          {
            key: "ner",
            title: "Нэр / Дугаар",
            width: 220,
            sorter: (a, b) => textEremb(a.ner || a.dugaar, b.ner || b.dugaar),
            render: (_: unknown, r) => {
              const undsen = r.ner || r.dugaar;
              if (!undsen) return <span className="text-[color:var(--muted-text)]">-</span>;
              return (
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-[color:var(--panel-text)]" title={undsen}>
                    {undsen}
                  </span>
                  {r.ner && r.dugaar && r.dugaar !== r.ner && (
                    <span className="truncate text-[12px] text-[color:var(--muted-text)]">
                      {r.dugaar}
                    </span>
                  )}
                </div>
              );
            },
          },
        ],
      },
      {
        key: "uildelBuleg",
        title: tokhirgoo.buleg,
        align: "center",
        children: uildel,
      },
    ];
  }, [turul, tokhirgoo]);

  const shineerEkhlekh = () => setPage(1);

  return (
    <div className="flex w-full flex-col gap-3 pb-14">
      <div className="flex flex-wrap items-center gap-2">
        <FilterDatePicker
          id={`tuukh-${turul}-ognoo`}
          value={dateRange}
          onChange={(dates: any, strs?: any) => {
            const ds = strs as string[] | undefined;
            if (Array.isArray(ds) && ds[0] && ds[1]) setDateRange([ds[0], ds[1]]);
            else if (dates?.[0] && dates?.[1])
              setDateRange([
                dayjs(dates[0]).format("YYYY-MM-DD"),
                dayjs(dates[1]).format("YYYY-MM-DD"),
              ]);
            else setDateRange([null, null]);
            shineerEkhlekh();
          }}
          className="w-full sm:w-[284px]"
        />
        <FilterSelect
          label="Ажилтан"
          value={ajiltniiId}
          onChange={(v) => {
            setAjiltniiId(v);
            shineerEkhlekh();
          }}
          options={ajiltanOptions}
          searchable
          searchPlaceholder="Ажилтан хайх..."
          className="max-w-[260px]"
        />
        <FilterSelect
          label="Төрөл"
          value={model}
          onChange={(v) => {
            setModel(v);
            shineerEkhlekh();
          }}
          options={turulOptions}
          searchable
          searchPlaceholder="Төрөл хайх..."
          className="max-w-[260px]"
        />
      </div>

      <Table<AuditMur>
        columns={columns}
        dataSource={murnuud}
        rowKey={(r, i) => r._id || i}
        loading={isLoading}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (t) => `Нийт ${t} мөр`,
          onChange: (p, ps) => {
            setPage(ps !== pageSize ? 1 : p);
            setPageSize(ps);
          },
        }}
        locale={{ emptyText: tokhirgoo.khooson }}
      />

      {tokhirgoo.delgerengui && (
        <TuukhModal
          mur={songogdson}
          turul={turul === "ustgasan" ? "ustgasan" : "zassan"}
          idNer={ajiltanIdNer}
          onClose={() => setSongogdson(null)}
        />
      )}
    </div>
  );
}

/** Гурван түүхийн хуудасны нэгдсэн бүрдэл — эрхийн шалгалттай */
export default function AuditTuukhKhuudas({ turul }: { turul: TuukhTurul }) {
  return (
    <PermissionGuard paths={["tuukh", `tuukh.${turul}`]}>
      <AuditTuukhAgguulga turul={turul} />
    </PermissionGuard>
  );
}
