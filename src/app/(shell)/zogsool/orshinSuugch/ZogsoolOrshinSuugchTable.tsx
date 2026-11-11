"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Car, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { getResidentToot } from "@/lib/residentDataHelper";
import { LATIN_TO_CYRILLIC } from "./ResidentRegistrationModal";

interface ResidentParking {
  _id?: string;
  ner?: string;
  orts?: string;
  orshinSuugchNer?: string;
  ovog?: string;
  utas?: string;
  toot?: string;
  burtgeliinDugaar?: string;
  turul?: string;
  tailbar?: string;
  burtgesenAjiltaniiNer?: string;
  createdAt?: string;
  mashinuud?: Array<{
    ulsiinDugaar: string;
    mark?: string;
  }>;
  zochinUrikhEsekh?: boolean;
  zochinTurul?: string;
  davtamjiinTurul?: string;
  mashiniiDugaar?: string;
  /** Тухайн эзний БҮХ машины дугаар (backend-ээс мөр тус бүрд хамт ирнэ). */
  ezniiMashinuud?: string[];
  /** Тухайн эзэнд бүртгэлтэй машины тоо. */
  mashiniiToo?: number;
  dugaarUurchilsunOgnoo?: string;
  ezenToot?: string;
  zochinTailbar?: string;
  zochinErkhiinToo?: number;
  zochinTusBurUneguiMinut?: number;
  zochinNiitUneguiMinut?: number;
  orshinSuugchTurul?: string;
  ezemshigchiinId?: string;
}

interface ZogsoolOrshinSuugchTableProps {
  data: ResidentParking[];
  loading: boolean;
  page: number;
  pageSize: number;
  onEdit: (resident: ResidentParking) => void;
  onDelete: (resident: ResidentParking) => void;
  onFilterChange?: (filters: any) => void;
  ortsOptions?: string[];
  /** Бүртгэлгүй мөрөнд машины дугаар шууд хадгалах. Амжилттай бол true. */
  onMashinBurtgekh?: (resident: ResidentParking, dugaar: string) => Promise<boolean>;
}

const mashinBurtgelgui = (d?: string) => !d || d === "БҮРТГЭЛГҮЙ" || d === "-";

/** 4 цифр + 3 кирилл үсэг (1234УБА). Латин үсгийг кирилл болгоно. */
const dugaarTseverlekh = (raw: string): string | null => {
  const input = raw.toUpperCase().replace(/\s/g, "");
  if (input.length > 7) return null;
  const digits = input.slice(0, 4);
  let chars = "";
  for (const c of input.slice(4)) chars += LATIN_TO_CYRILLIC[c] || c;
  if (!/^\d*$/.test(digits) || !/^[А-ЯӨҮЁ]*$/.test(chars)) return null;
  return digits + chars;
};
const dugaarBuren = (d: string) => /^\d{4}[А-ЯӨҮЁ]{3}$/.test(d);

/**
 * «Машин бүртгэх» товч → дармагц input болно. 7 тэмдэгт (1234УБА) бүрэн
 * бичигдмэгц өөрөө хадгална; Enter эсвэл гадагш дарахад мөн хадгална.
 */
const MashinBurtgekhNud: React.FC<{
  onSave: (dugaar: string) => Promise<boolean>;
}> = ({ onSave }) => {
  const [zasaj, setZasaj] = useState(false);
  const [utga, setUtga] = useState("");
  const [khadgalj, setKhadgalj] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const khadgalsan = useRef<string | null>(null);

  useEffect(() => {
    if (zasaj) inputRef.current?.focus();
  }, [zasaj]);

  const khadgalakh = async (dugaar: string) => {
    if (khadgalj || !dugaarBuren(dugaar) || khadgalsan.current === dugaar) return;
    khadgalsan.current = dugaar;
    setKhadgalj(true);
    const ok = await onSave(dugaar);
    setKhadgalj(false);
    if (ok) {
      setZasaj(false);
      setUtga("");
    } else {
      khadgalsan.current = null;
      inputRef.current?.focus();
    }
  };

  const bolikh = () => {
    if (khadgalj) return;
    setZasaj(false);
    setUtga("");
    khadgalsan.current = null;
  };

  if (!zasaj) {
    return (
      <button
        type="button"
        onClick={() => setZasaj(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-warning/50 bg-warning/10 px-2 py-0.5 text-warning transition-colors hover:bg-warning/20"
        title="Машины дугаар бүртгэх"
      >
        <Plus className="h-3.5 w-3.5" />
        Машин бүртгэх
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={inputRef}
        value={utga}
        disabled={khadgalj}
        placeholder="1234УБА"
        maxLength={7}
        onChange={(e) => {
          const d = dugaarTseverlekh(e.target.value);
          if (d === null) return;
          setUtga(d);
          if (dugaarBuren(d)) void khadgalakh(d);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void khadgalakh(utga);
          if (e.key === "Escape") bolikh();
        }}
        onBlur={() => {
          if (dugaarBuren(utga)) void khadgalakh(utga);
          else bolikh();
        }}
        className="w-[110px] rounded-lg border border-brand/60 bg-[color:var(--surface-bg)] px-2 py-0.5 text-center uppercase tracking-wide text-[color:var(--panel-text)] outline-none focus:ring-2 focus:ring-brand/30"
      />
      {khadgalj && (
        <Loader2 className="absolute -right-5 h-3.5 w-3.5 animate-spin text-brand" />
      )}
    </div>
  );
};

export const ZogsoolOrshinSuugchTable: React.FC<
  ZogsoolOrshinSuugchTableProps
> = ({ data, loading, page, pageSize, onEdit, onDelete, onFilterChange, ortsOptions = [], onMashinBurtgekh }) => {
  const columns: ColumnsType<ResidentParking> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, idx: number) => (
          <span className="text-black dark:text-white">
            {(page - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        title: "Тоот",
        key: "toot",
        width: 120,
        align: "center",
        sorter: (a, b) => (a.ezenToot || "").localeCompare(b.ezenToot || "", "mn", { numeric: true }),
        render: (_: any, record: ResidentParking) => {
          const tootValue = record.ezenToot || getResidentToot(record);
          if (!tootValue || tootValue === "-") return null;

          return (
            <div className="flex items-center justify-center gap-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-[color:var(--surface-hover)] dark:bg-white/10 border border-[color:var(--surface-border)] dark:border-white/10 text-black dark:text-white">
                  {tootValue}
                  <span className="ml-1 opacity-70">тоот</span>
              </span>
            </div>
          );
        },
      },
      {
        title: "Орц",
        key: "orts",
        width: 80,
        align: "center",
        filterMultiple: false,
        sorter: (a, b) => (a.orts || "").localeCompare(b.orts || "", "mn", { numeric: true }),
        render: (_: any, record: ResidentParking) => (
          <div className="text-black dark:text-white">
            {record.orts || ""}
          </div>
        ),
      },
      {
        title: "Нэр",
        key: "ner",
        width: 250,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="text-left">
            <p className="text-black dark:text-white font-sans">
              {record.ner || record.orshinSuugchNer || "Нэр тодорхойгүй"}
            </p>
            {/* Олон машинтай эзэн нь машин тутамдаа нэг мөр эзэлдэг тул нэр
                давтагдана — тоог хамт харуулж шалтгааныг тодруулна. */}
            {(record.mashiniiToo ?? 0) > 1 && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[color:var(--muted-text)]">
                <Car className="w-3 h-3" />
                {record.mashiniiToo} машин
              </span>
            )}
          </div>
        ),
      },
      {
        title: "Утас",
        key: "utas",
        width: 120,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex items-center justify-center gap-1 text-black dark:text-white">
            {record.utas || "-"}
          </div>
        ),
      },
      {
        title: "Дугаар",
        key: "dugaar",
        width: 150,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-wrap gap-2 justify-center">
            {!mashinBurtgelgui(record.mashiniiDugaar) ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-success/10 border border-success/30">
                <span className="font-medium tracking-wide text-success">
                  {record.mashiniiDugaar}
                </span>
              </div>
            ) : onMashinBurtgekh ? (
              <MashinBurtgekhNud onSave={(d) => onMashinBurtgekh(record, d)} />
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-warning/10 border border-dashed border-warning/50">
                <span className="text-warning">БҮРТГЭЛГҮЙ</span>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Төрөл",
        key: "turul",
        width: 110,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex flex-col gap-1.5 items-center">
            <span className="px-2 py-0.5 rounded bg-[color:var(--surface-hover)] text-black dark:text-white w-fit">
              {record.zochinTurul || record.turul || "Оршин суугч"}
            </span>
          </div>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 96,
        align: "center",
        render: (_: any, record: ResidentParking) => (
          <div className="flex justify-center items-center gap-1">
            <button
              id="resident-edit-btn"
              onClick={() => onEdit(record)}
              className="p-1.5 rounded-lg action-edit hover-surface transition-colors hover:bg-[color:var(--panel)] dark:hover:bg-white/20"
              title="Засах"
            >
              <Edit className="w-4 h-4 text-black dark:text-white" />
            </button>
            <button
              id="resident-delete-btn"
              onClick={() => onDelete(record)}
              disabled={mashinBurtgelgui(record.mashiniiDugaar)}
              className={`p-1.5 rounded-lg action-delete transition-all ${
                mashinBurtgelgui(record.mashiniiDugaar)
                  ? "opacity-20 cursor-not-allowed text-[color:var(--muted-text)]"
                  : "hover-surface hover:bg-danger/10 text-black dark:text-white hover:text-danger"
              }`}
              title={mashinBurtgelgui(record.mashiniiDugaar) ? "Машин бүртгэлгүй" : "Устгах"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [page, pageSize, onEdit, onDelete, ortsOptions, onMashinBurtgekh],
  );

  const handleTableChange = (pagination: any, filters: any) => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  return (
    <div id="residents-table" className="w-full">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => record._id || Math.random().toString()}
        pagination={false}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Оршин суугчийн мэдээлэл олдсонгүй" }}
      />
    </div>
  );
};

export default ZogsoolOrshinSuugchTable;
