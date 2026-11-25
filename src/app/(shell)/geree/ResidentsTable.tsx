"use client";

import React, { useMemo } from "react";
import { Modal, Popover, Tooltip } from "antd";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Check, Edit, Eye, Trash2, ChevronUp, ChevronDown, X, KeyRound, Plus, Loader2, Unlink, Search } from "lucide-react";
import { getPaymentStatusLabel } from "@/lib/utils";
import { negjiinTurul, negjiinTulkhuur } from "@/lib/negjiinTurul";
import DeleteConfirmModal from "./modals/DeleteModal";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
  getResidentToots,
  getResidentDavkhauraud,
  getResidentOrtsuud,
} from "@/lib/residentDataHelper";

export interface ResidentItem {
  _id?: string;
  ner?: string | { ner?: string; kod?: string };
  utas?: string;
  toot?: string;
  davkhar?: string;
  orts?: string;
  [key: string]: any;
}


type SortKey = string;
type SortOrder = "asc" | "desc";

interface ResidentsTableProps {
  data: ResidentItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  sortKey?: SortKey;
  sortOrder?: SortOrder;
  currentBaiguullagiinId?: string;
  onEdit?: (resident: ResidentItem) => void;
  /** Оршин суугчийн БҮХ мэдээллийг нэг модалаас харах. */
  onView?: (resident: ResidentItem) => void;
  onDelete?: (resident: ResidentItem) => void;
  onResetPassword?: (resident: ResidentItem) => void;
  onRemoveToot?: (residentId: string, baiguullagiinId: string, barilgiinId: string, toot: string, turul?: string) => void;
  onSort?: (key: SortKey, order?: "ascend" | "descend" | null) => void;
  /** Байвал «Гараж», «Агуулах» нүдэнд «+ Нэмэх» товч гарна. */
  negjNemekh?: NegjNemekhTokhirgoo;
}

/** Гараж/агуулахын сонгож болох дугаар (барилгын тохиргооноос, эзэнгүй нь). */
export interface NegjiinSongolt {
  davkhar: string;
  toot: string;
}

export type NegjNemekhTurul = "Гараж" | "Агуулах";

export interface NegjNemekhTokhirgoo {
  /** Төрөл бүрийн сул дугаарууд. Хоосон бол дугаарыг гараар бичнэ. */
  songoltuud: Record<NegjNemekhTurul, NegjiinSongolt[]>;
  /** Амжилттай холбогдвол true буцаана. */
  onNemekh: (
    resident: ResidentItem,
    turul: NegjNemekhTurul,
    davkhar: string,
    toot: string,
  ) => Promise<boolean>;
}

/**
 * «Машин бүртгэх»-тэй ижил: «+» дарахад нүдэн дээр шууд сонголт гарна.
 * Барилгын тохиргоонд дугаар бүртгэгдсэн бол сул дугааруудаас сонгоно,
 * үгүй бол дугаарыг гараар бичээд Enter дарна.
 */
const NegjNemekh: React.FC<{
  turul: NegjNemekhTurul;
  songoltuud: NegjiinSongolt[];
  /** Оршин суугч аль хэдийн гараж/агуулахтай бол жижиг «+» л харуулна. */
  jijig?: boolean;
  onSave: (davkhar: string, toot: string) => Promise<boolean>;
}> = ({ turul, songoltuud, jijig, onSave }) => {
  const [neelttei, setNeelttei] = React.useState(false);
  const [khadgalj, setKhadgalj] = React.useState(false);
  const [utga, setUtga] = React.useState("");
  const [khailt, setKhailt] = React.useState("");
  const [songoson, setSongoson] = React.useState<string[]>([]);

  const khadgalakhOlnoor = async (items: Array<{ davkhar: string; toot: string }>) => {
    const valid = items.filter((it) => it.toot.trim().length > 0);
    if (khadgalj || valid.length === 0) return;
    setKhadgalj(true);
    let allOk = true;
    for (const it of valid) {
      const ok = await onSave(it.davkhar, it.toot.trim());
      if (!ok) allOk = false;
    }
    setKhadgalj(false);
    if (allOk) {
      setNeelttei(false);
      setUtga("");
      setKhailt("");
      setSongoson([]);
    }
  };

  const khaakh = () => {
    if (khadgalj) return;
    setNeelttei(false);
    setUtga("");
    setKhailt("");
    setSongoson([]);
  };

  const triggerBtn = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (songoltuud.length === 0) {
          setNeelttei(true);
        }
      }}
      className={
        jijig
          ? "inline-flex shrink-0 items-center justify-center rounded-md border border-dashed border-brand/50 p-0.5 text-brand transition-colors hover:bg-brand/10"
          : "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-dashed border-brand/50 bg-brand/5 px-2 py-0.5 text-brand transition-colors hover:bg-brand/15"
      }
      title={`${turul} нэмэх`}
    >
      <Plus className="!h-3.5 !w-3.5 shrink-0" />
      {!jijig && <span>Нэмэх</span>}
    </button>
  );

  if (songoltuud.length > 0) {
    const q = khailt.trim().toLowerCase();
    const shuusen = q
      ? songoltuud.filter(
          (s) =>
            s.toot.toLowerCase().includes(q) ||
            s.davkhar.toLowerCase().includes(q),
        )
      : songoltuud;

    const toggleItem = (key: string) => {
      if (khadgalj) return;
      setSongoson((prev) =>
        prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
      );
    };

    const content = (
      <div
        className="w-[240px] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-text)]" />
          <input
            autoFocus
            value={khailt}
            onChange={(e) => setKhailt(e.target.value)}
            placeholder={`${turul} хайх...`}
            className="w-full rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] py-1.5 pl-8 pr-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
          />
        </div>

        <div className="max-h-[210px] space-y-0.5 overflow-y-auto pr-1">
          {shuusen.length === 0 ? (
            <div className="py-4 text-center text-xs text-[color:var(--muted-text)]">
              Олдсонгүй
            </div>
          ) : (
            shuusen.map((s) => {
              const key = `${s.davkhar}|${s.toot}`;
              const checked = songoson.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleItem(key)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    checked
                      ? "bg-theme/10 text-[color:var(--panel-text)]"
                      : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        checked
                          ? "border-theme bg-theme text-white"
                          : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="font-medium">{s.toot}</span>
                  </span>
                  {s.davkhar && (
                    <span className="text-[11px] text-[color:var(--muted-text)]">
                      {s.davkhar} давхар
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[color:var(--surface-border)] pt-2">
          <button
            type="button"
            disabled={khadgalj}
            onClick={khaakh}
            className="rounded-lg px-2.5 py-1 text-xs text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)]"
          >
            Болих
          </button>
          <button
            type="button"
            disabled={khadgalj || songoson.length === 0}
            onClick={() => {
              const items = songoson.map((v) => {
                const [davkhar, toot] = String(v).split("|");
                return { davkhar: davkhar || "", toot: toot || "" };
              });
              void khadgalakhOlnoor(items);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-theme px-3 py-1 text-xs font-medium text-white transition-opacity disabled:opacity-40"
          >
            {khadgalj && <Loader2 className="h-3 w-3 animate-spin" />}
            Хадгалах{songoson.length > 0 ? ` (${songoson.length})` : ""}
          </button>
        </div>
      </div>
    );

    return (
      <span onClick={(e) => e.stopPropagation()}>
        <Popover
          trigger="click"
          placement="bottomLeft"
          open={neelttei}
          onOpenChange={(open) => {
            if (khadgalj) return;
            if (open) {
              setSongoson([]);
              setKhailt("");
              setNeelttei(true);
            } else {
              khaakh();
            }
          }}
          content={content}
        >
          {triggerBtn}
        </Popover>
      </span>
    );
  }

  if (!neelttei) return triggerBtn;

  return (
    <span className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={utga}
        disabled={khadgalj}
        placeholder={`${turul}: 1, 2, 3`}
        maxLength={60}
        onChange={(e) => setUtga(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const items = utga
              .split(/[\s,;]+/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((toot) => ({ davkhar: "", toot }));
            void khadgalakhOlnoor(items);
          }
          if (e.key === "Escape") khaakh();
        }}
        onBlur={() => {
          if (!utga.trim()) khaakh();
        }}
        className="w-[110px] rounded-lg border border-brand/60 bg-[color:var(--surface-bg)] px-2 py-0.5 text-center text-[color:var(--panel-text)] outline-none focus:ring-2 focus:ring-brand/30"
      />
      {khadgalj && <Loader2 className="absolute -right-5 h-3.5 w-3.5 animate-spin text-brand" />}
    </span>
  );
};


/** Олон тоот/гараж/агуулахтай мөрөнд «Олон (N)» — зогсоолын «Олон» машинтай ижил хэв маяг. */
const OLON_CLASS =
  "inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap px-2 py-0.5 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300";

/** Оршин суугчийн тухайн төрлийн (Гараж/Агуулах) нэгжүүд. */
function negjuudAvakh(
  record: ResidentItem,
  turul: NegjNemekhTurul,
  currentBaiguullagiinId: string | undefined,
): any[] {
  let toots =
    Array.isArray(record.toots) && record.toots.length > 0
      ? record.toots
      : [
          {
            toot: record.toot,
            baiguullagiinId: record.baiguullagiinId,
            barilgiinId: record.barilgiinId,
            turul: record.turul || "Орон сууц",
          },
        ];
  if (currentBaiguullagiinId) {
    toots = toots.filter((t: any) => String(t.baiguullagiinId) === String(currentBaiguullagiinId));
  }
  return toots.filter((t: any) => negjiinTurul(t) === turul);
}

/**
 * «Гараж», «Агуулах» тусдаа багана. Нэгжтэй нүдэнд «+» байхгүй — дугаар
 * эсвэл «Олон (N)» дээр дарахад цонх нээгдэж, тэндээс нэмж/хасна.
 * Хоосон нүдэнд «+ Нэмэх» хэвээр.
 */
function negjiinBagana(
  turul: NegjNemekhTurul,
  currentBaiguullagiinId: string | undefined,
  onNeekh: (record: ResidentItem, turul: NegjNemekhTurul) => void,
  negjNemekh?: NegjNemekhTokhirgoo,
): ColumnsType<ResidentItem>[number] {
  return {
    title: turul,
    key: turul === "Гараж" ? "garaazh" : "aguulakh",
    width: 110,
    align: "center",
    render: (_: any, record: ResidentItem) => {
      const toots = negjuudAvakh(record, turul, currentBaiguullagiinId);

      if (toots.length === 0) {
        return negjNemekh ? (
          <NegjNemekh
            turul={turul}
            songoltuud={negjNemekh.songoltuud[turul] || []}
            onSave={(davkhar, toot) => negjNemekh.onNemekh(record, turul, davkhar, toot)}
          />
        ) : (
          "-"
        );
      }

      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNeekh(record, turul);
          }}
          title={`${turul}: ${toots.map((t: any) => t.toot).join(", ")} — засах`}
          className={
            toots.length > 1
              ? OLON_CLASS
              : "inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-0.5 rounded-md bg-[color:var(--surface-hover)] font-medium text-[color:var(--panel-text)] border border-[color:var(--surface-border)] hover:border-brand/50 transition-colors"
          }
        >
          {toots.length > 1 ? `Олон (${toots.length})` : toots[0].toot}
        </button>
      );
    },
  };
}

export const ResidentsTable: React.FC<ResidentsTableProps> = React.memo(({
  data,
  loading = false,
  page = 1,
  pageSize = 500,
  sortKey = "createdAt",
  sortOrder = "desc",
  currentBaiguullagiinId,
  onEdit,
  onView,
  onDelete,
  onResetPassword,
  onRemoveToot,
  onSort,
  negjNemekh,
}) => {
  // Тоот хасахаас өмнө батлуулах (window.confirm-ийн оронд).
  const [khasakhAsuult, setKhasakhAsuult] = React.useState<{ record: ResidentItem; t: any } | null>(null);
  // Гараж/агуулахын нэгжүүдийг засах цонх. Нэмсэн/хассаны дараа жагсаалт
  // шинэчлэгдэхэд шинэ мөрийг `data`-аас id-гаар нь авна.
  const [negjTsonkh, setNegjTsonkh] = React.useState<{
    id: string;
    record: ResidentItem;
    turul: NegjNemekhTurul;
  } | null>(null);
  const negjTsonkhMur = negjTsonkh
    ? data.find((r) => String(r._id) === negjTsonkh.id) || negjTsonkh.record
    : null;
  const columns: ColumnsType<ResidentItem> = useMemo(
    () => [
      // ... (index and ner columns omitted for brevity, keeping them as they are)
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        width: 250,
        sorter: true,
        sortOrder:
          sortKey === "ner"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "left",
        render: (val: string | { ner?: string; kod?: string }) => {
          const name =
            typeof val === "object"
              ? `${val?.ner || ""} ${val?.kod || ""}`.trim() || "-"
              : val || "-";
          return (
            <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
              {name}
            </span>
          );
        },
      },
      {
        title: "Орц",
        key: "orts",
        dataIndex: "orts",
        width: 80,
        sorter: true,
        sortOrder:
          sortKey === "orts"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        render: (_: any, record: ResidentItem) => (
          <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
            {getResidentOrtsuud(record) || "-"}
          </span>
        ),
      },
      {
        title: "Давхар",
        key: "davkhar",
        dataIndex: "davkhar",
        width: 90,
        sorter: true,
        sortOrder:
          sortKey === "davkhar"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        render: (_: any, record: ResidentItem) => (
          <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
            {getResidentDavkhauraud(record, { zuvkhunOronSuuts: true }) || "-"}
          </span>
        ),
      },
      {
        title: "Тоот",
        key: "toot",
        dataIndex: "toot",
        width: 140,
        sorter: true,
        sortOrder:
          sortKey === "toot"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        render: (_: any, record: ResidentItem) => {
          let toots =
            Array.isArray(record.toots) && record.toots.length > 0
              ? record.toots
              : [
                  {
                    toot: record.toot,
                    baiguullagiinId: record.baiguullagiinId,
                    barilgiinId: record.barilgiinId,
                    turul: record.turul || "Орон сууц",
                  },
                ];
          
          // Filter by currentBaiguullagiinId if provided
          if (currentBaiguullagiinId) {
            toots = toots.filter((t: any) => String(t.baiguullagiinId) === String(currentBaiguullagiinId));
          }

          // Only show main housing units
          toots = toots.filter((t: any) => negjiinTurul(t) === "Орон сууц");

          // Deduplicate toots array
          const seenToots = new Set<string>();
          toots = toots.filter((t: any) => {
            const key = negjiinTulkhuur(t);
            if (seenToots.has(key)) return false;
            seenToots.add(key);
            return true;
          });

          if (toots.length === 0) return "-";

          const tooltipContent = (
            <div className="space-y-1.5 p-1.5 max-w-[220px]">
              {toots.map((t: any, idx: number) => {
                const label = negjiinTurul(t);
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="font-medium text-[color:var(--panel-text)]">Тоот {t.toot} {label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKhasakhAsuult({ record, t });
                      }}
                      className="p-0.5 text-danger hover:text-danger rounded hover:bg-danger/30 transition-colors"
                      title="Хасах"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          );

          return (
            <Tooltip title={tooltipContent} placement="top" trigger="hover">
              {toots.length > 1 ? (
                <span className={OLON_CLASS}>Олон ({toots.length})</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-0.5 rounded-md bg-[color:var(--surface-hover)] font-medium text-[color:var(--panel-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors">
                  {toots[0].toot}
                </span>
              )}
            </Tooltip>
          );
        },
      },
      negjiinBagana("Гараж", currentBaiguullagiinId, (record, turul) => setNegjTsonkh({ id: String(record._id), record, turul }), negjNemekh),
      negjiinBagana("Агуулах", currentBaiguullagiinId, (record, turul) => setNegjTsonkh({ id: String(record._id), record, turul }), negjNemekh),
      {
        title: "Утас",
        dataIndex: "utas",
        key: "utas",
        width: 140,
        sorter: true,
        sortOrder:
          sortKey === "utas"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        render: (val: string) => (
          <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Төлөв",
        key: "tuluv",
        width: 110,
        align: "center",
        render: (_: any, record: any) => {
          const uldegdel = Number(record?.uldegdel ?? record?.ekhniiUldegdel ?? 0);
          const label = uldegdel <= 0 ? "Төлсөн" : "Төлөөгүй";
          const cls =
            label === "Төлсөн"
              ? "badge-paid"
              : "badge-unpaid";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 font-normal rounded-full ${cls}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        title: "Үйлдэл",
        key: "action",
        align: "center",
        width: 120,
        render: (_: any, record: ResidentItem, index: number) => (
          <div className="flex gap-1 justify-center">
            <button
              type="button"
              onClick={() => onView?.(record)}
              className="p-1.5 rounded-md hover-surface transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
              id={index === 0 ? "resident-view-btn" : undefined}
              title="Бүх мэдээлэл харах"
            >
              <Eye className="w-4 h-4 text-brand" />
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(record)}
              className="p-1.5 rounded-md action-edit hover-surface transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
              id={index === 0 ? "resident-edit-btn" : undefined}
              title="Засах"
            >
              <Edit className="w-4 h-4 text-brand" />
            </button>
            {onResetPassword && (
              <button
                type="button"
                onClick={() => onResetPassword(record)}
                className="p-1.5 rounded-md hover-surface transition-colors hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                id={index === 0 ? "resident-reset-pass-btn" : undefined}
                title="Нууц үг сэргээх"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete?.(record)}
              className="p-1.5 rounded-md action-delete hover-surface transition-colors hover:bg-danger/10"
              id={index === 0 ? "resident-delete-btn" : undefined}
              title="Устгах"
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </button>
          </div>
        ),
      },
    ],
    [
      page,
      pageSize,
      sortKey,
      sortOrder,
      onEdit,
      onView,
      onDelete,
      onResetPassword,
      onRemoveToot,
      onSort,
      currentBaiguullagiinId,
      negjNemekh,
    ],
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) =>
            record._id ||
            `res_${String(typeof record.ner === "object" ? record.ner?.ner : record.ner)}_${record.toot}_${record.utas}`
          }
          pagination={false}
          loading={loading}
          className="min-w-[1000px]"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <span className="text-[color:var(--muted-text)]">
                Хайсан мэдээлэл алга байна
              </span>
            ),
          }}
          onChange={(_: any, __: any, sorter: any) => {
            if (onSort) {
              onSort((sorter.field || sorter.columnKey) as SortKey, sorter.order);
            }
          }}
        />
      </div>
      <Modal
        open={!!negjTsonkh && !!negjTsonkhMur}
        onCancel={() => setNegjTsonkh(null)}
        footer={null}
        width={380}
        destroyOnHidden
        title={
          negjTsonkh && negjTsonkhMur
            ? `${negjTsonkh.turul} — ${
                typeof negjTsonkhMur.ner === "object" ? negjTsonkhMur.ner?.ner || "" : negjTsonkhMur.ner || ""
              }`
            : ""
        }
      >
        {negjTsonkh && negjTsonkhMur && (() => {
          const negjuud = negjuudAvakh(negjTsonkhMur, negjTsonkh.turul, currentBaiguullagiinId);
          return (
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              {negjuud.length === 0 ? (
                <p className="text-sm text-[color:var(--muted-text)]">Бүртгэлтэй {negjTsonkh.turul.toLowerCase()} алга.</p>
              ) : (
                <ul className="divide-y divide-[color:var(--surface-border)] rounded-lg border border-[color:var(--surface-border)]">
                  {negjuud.map((t: any, idx: number) => (
                    <li key={`${t.davkhar}-${t.toot}-${idx}`} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm text-[color:var(--panel-text)]">
                        {negjTsonkh.turul} {t.toot}
                        {t.davkhar ? (
                          <span className="ml-1.5 text-xs text-[color:var(--muted-text)]">{t.davkhar} давхар</span>
                        ) : null}
                      </span>
                      {/* Салгах — оршин суугчаас л салгана, дугаар чөлөөтэй болж үлдэнэ */}
                      <button
                        type="button"
                        onClick={() => setKhasakhAsuult({ record: negjTsonkhMur, t })}
                        className="inline-flex items-center gap-1 rounded-md border border-danger/30 px-2 py-1 text-xs text-danger transition-colors hover:bg-danger/10"
                        title="Оршин суугчаас салгах — дугаар чөлөөтэй болно"
                        aria-label={`${t.toot} салгах`}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        Салгах
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {negjNemekh && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[color:var(--muted-text)]">Шинээр нэмэх:</span>
                  <NegjNemekh
                    turul={negjTsonkh.turul}
                    songoltuud={negjNemekh.songoltuud[negjTsonkh.turul] || []}
                    onSave={(davkhar, toot) =>
                      negjNemekh.onNemekh(negjTsonkhMur, negjTsonkh.turul, davkhar, toot)
                    }
                  />
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
      <DeleteConfirmModal
        show={!!khasakhAsuult}
        onClose={() => setKhasakhAsuult(null)}
        title="Та итгэлтэй байна уу?"
        confirmLabel="Салгах"
        message={
          khasakhAsuult
            ? (() => {
                const { record, t } = khasakhAsuult;
                const turul = negjiinTurul(t);
                const nerRaw: any = record.ner;
                const ner = [record.ovog ? `${String(record.ovog).charAt(0)}.` : "", typeof nerRaw === "string" ? nerRaw : nerRaw?.ner || ""]
                  .filter(Boolean)
                  .join(" ");
                const negj =
                  turul === "Орон сууц"
                    ? `${t.orts ? `${t.orts}-р орц, ` : ""}${t.davkhar ? `${t.davkhar} давхрын ` : ""}${t.toot} тоот`
                    : `${turul} ${t.davkhar ? `${t.davkhar} давхрын ` : ""}${t.toot} дугаар`;
                return `${ner ? `«${ner}»-ийн ` : ""}${negj}ыг салгана. Дугаар өөрөө жагсаалтад үлдэж, чөлөөтэй болно.`;
              })()
            : ""
        }
        onConfirm={async () => {
          if (!khasakhAsuult) return;
          const { record, t } = khasakhAsuult;
          await onRemoveToot?.(String(record._id), t.baiguullagiinId, t.barilgiinId, t.toot, t.turul);
          setKhasakhAsuult(null);
        }}
      />
    </div>
  );
});


export default ResidentsTable;
