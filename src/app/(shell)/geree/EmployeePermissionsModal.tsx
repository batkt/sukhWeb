"use client";

/**
 * Ажилтны эрхийн тохиргооны цонх.
 *
 * Өмнө нь энэ нь /ajiltan/tokhirgoo/[id] гэсэн ТУСДАА хуудас байсан бөгөөд
 * Тохиргоо табаас орж ирэхэд (?from=tokhirgoo) барилга ба модулиудыг НУУДАГ
 * байсан - иймээс "модулиуд хаана байна" гэсэн асуудал үүсдэг байв.
 *
 * Одоо:
 *   - Гэрээ → Ажилтан хэсэгт модал болж буцаж ирэв,
 *   - "Тохиргооны эрх" тусдаа багана байхаа болиод модулиудын мод дотор
 *     `tokhirgoo` модуль болж нэгдсэн (src/lib/permissions.ts),
 *   - Аль ч цэгээс орсон ижил бүтэн эрхийн жагсаалт харагдана.
 */

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import {
  ALL_PERMISSIONS,
  getAllPermissionIds,
  getChildPermissionIds,
  getAncestorPermissionIds,
  type PermissionItem,
} from "@/lib/permissions";
import { useAuth } from "@/lib/useAuth";
import updateMethod from "../../../../tools/function/updateMethod";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";

interface Props {
  employee: any | null;
  open: boolean;
  onClose: () => void;
  /** Хадгалсны дараа жагсаалтыг сэргээх */
  onSaved?: () => void;
}

/** `ner` нь зарим бичлэг дээр { ner, kod } объект хэлбэртэй байдаг */
const nerAvya = (raw: any): string => {
  if (!raw) return "";
  if (typeof raw === "object") return `${raw.ner || ""} ${raw.kod || ""}`.trim();
  return String(raw).trim();
};

/** Асуулттай утгыг "-" болгож харуулна */
const utgaKharuulya = (v: any): string => {
  const s = typeof v === "string" ? v.trim() : v ? String(v) : "";
  return s || "-";
};

const Shiljuurch: React.FC<{
  idevkhitei: boolean;
  onChange: () => void;
  jijig?: boolean;
  ariaLabel: string;
}> = ({ idevkhitei, onChange, jijig, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={idevkhitei}
    aria-label={ariaLabel}
    onClick={(e) => {
      // Toggle нь мөрийн onClick дотор сууж байгаа тул propagation-ыг зогсооно.
      // Үгүй бол нэг дарахад мөр ба toggle хоёулаа ажиллаж, хоёр удаа
      // сэлгэгдээд буцаад хэвэндээ ордог (toggle "ажиллахгүй" мэт харагдана).
      e.stopPropagation();
      onChange();
    }}
    className={`relative shrink-0 rounded-full transition-colors ${
      jijig ? "h-5 w-9" : "h-6 w-11"
    } ${
      idevkhitei
        ? "bg-emerald-500"
        : "bg-slate-200 dark:bg-slate-700"
    }`}
  >
    <span
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
        jijig ? "h-4 w-4" : "h-5 w-5"
      } ${
        idevkhitei
          ? jijig
            ? "left-[18px]"
            : "left-[22px]"
          : "left-0.5"
      }`}
    />
  </button>
);

const Mur: React.FC<{ nert: string; utga: string }> = ({ nert, utga }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
      {nert}
    </span>
    <span className="min-w-0 break-words text-right text-xs font-medium text-slate-900 dark:text-white">
      {utga}
    </span>
  </div>
);

export default function EmployeePermissionsModal({
  employee,
  open,
  onClose,
  onSaved,
}: Props) {
  const { baiguullaga, token } = useAuth();

  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const buildings = useMemo(() => {
    const list = baiguullaga?.barilguud;
    return Array.isArray(list) ? list : [];
  }, [baiguullaga]);

  const allPermissionIds = useMemo(() => getAllPermissionIds(), []);

  // Цонх нээгдэх бүрд тухайн ажилтны эрхээр дүүргэнэ
  useEffect(() => {
    if (!open || !employee) return;
    const mapped = (employee.tsonkhniiErkhuud || []).map((p: string) =>
      p.startsWith("/") ? p.substring(1).replace(/\//g, ".") : p,
    );
    setSelectedPermissions(mapped);
    setSelectedBuildings(employee.barilguud || []);
  }, [open, employee]);

  // Escape дарахад хаана
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const bugdSongogdson =
    allPermissionIds.length > 0 &&
    allPermissionIds.every((id) => selectedPermissions.includes(id)) &&
    (buildings.length === 0 || selectedBuildings.length === buildings.length);

  const bugdiigSolikh = () => {
    if (bugdSongogdson) {
      setSelectedPermissions([]);
      setSelectedBuildings([]);
    } else {
      setSelectedPermissions([...allPermissionIds]);
      setSelectedBuildings(buildings.map((b: any) => b._id));
    }
  };

  const barilgaSolikh = (id: string) =>
    setSelectedBuildings((umnukh) =>
      umnukh.includes(id)
        ? umnukh.filter((x) => x !== id)
        : [...umnukh, id],
    );

  /**
   * Эцгийг унтраахад хүүхдүүд нь ч унтарна, асаахад хамт асна.
   *
   * Дэд эрхийн АЛЬ НЭГИЙГ асахад эцэг модуль нь мөн автоматаар асна - дэд
   * цонхны эрх өгөөд модулийн эрхийг өгөхгүй бол ажилтан тэр цэс рүү орж
   * чадахгүй байсан. Бүх хүүхэд сонгогдохыг ХҮЛЭЭХГҮЙ, нэг л хангалттай.
   */
  const erkhSolikh = (permissionId: string) => {
    const khuukhduud = getChildPermissionIds(permissionId);
    const uvguud = getAncestorPermissionIds(permissionId);
    setSelectedPermissions((umnukh) => {
      if (umnukh.includes(permissionId)) {
        // Унтраахдаа зөвхөн өөрийг нь ба доод эрхүүдийг нь авна - эцгийг нь
        // хөндөхгүй (модулийн эрх дангаараа ч утгатай).
        const khasakh = new Set([permissionId, ...khuukhduud]);
        return umnukh.filter((id) => !khasakh.has(id));
      }
      const daraa = new Set(umnukh);
      daraa.add(permissionId);
      khuukhduud.forEach((id) => daraa.add(id));
      uvguud.forEach((id) => daraa.add(id));
      return [...daraa];
    });
  };

  const khadgalya = async () => {
    if (!employee || !token) return;
    try {
      setSaving(true);
      const payload = selectedPermissions.map(
        (id) => "/" + id.replace(/\./g, "/"),
      );
      await updateMethod("ajiltan", token, {
        _id: employee._id,
        tsonkhniiErkhuud: payload,
        barilguud: selectedBuildings,
      });
      openSuccessOverlay("Ажилтны эрх амжилттай хадгалагдлаа");
      onSaved?.();
      onClose();
    } catch (error) {
      openErrorOverlay(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open || !employee) return null;

  const ner = nerAvya(employee.ner);

  const erkhMur = (perm: PermissionItem, khuukhed: boolean) => {
    const songogdson = selectedPermissions.includes(perm.id);
    const khuukhdiinToo = perm.children?.length
      ? perm.children.filter((c) => selectedPermissions.includes(c.id)).length
      : null;
    return (
      <div
        key={perm.id}
        onClick={() => erkhSolikh(perm.id)}
        className={`flex cursor-pointer items-center gap-3 px-4 transition-colors ${
          khuukhed
            ? "py-2 pl-9 hover:bg-slate-50 dark:hover:bg-white/5"
            : "bg-slate-50/70 py-2.5 dark:bg-white/[0.03]"
        }`}
      >
        {khuukhed ? (
          <span className="w-3 shrink-0 text-slate-300 dark:text-slate-600">
            —
          </span>
        ) : (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              songogdson ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          />
        )}
        <span
          className={`min-w-0 flex-1 truncate ${
            khuukhed
              ? "text-xs text-slate-600 dark:text-slate-300"
              : "text-[13px] font-medium text-slate-900 dark:text-white"
          }`}
        >
          {perm.label}
        </span>
        {khuukhdiinToo !== null && (
          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-white/10 dark:text-slate-400">
            {khuukhdiinToo}
          </span>
        )}
        <Shiljuurch
          idevkhitei={songogdson}
          onChange={() => erkhSolikh(perm.id)}
          jijig={khuukhed}
          ariaLabel={perm.label}
        />
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10"
      >
        {/* ── Толгой ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">
              Хэрэглэгчийн эрхийн тохиргоо
            </h2>
            {ner && (
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {ner}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Их бие ── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_1fr]">
          {/* Зүүн: профайл + салбарын эрх */}
          <div className="min-h-0 space-y-6 overflow-y-auto border-b border-slate-200 p-6 md:border-b-0 md:border-r dark:border-white/10">
            <section>
              <h3 className="mb-3 text-xs font-semibold text-slate-900 dark:text-white">
                Профайл мэдээлэл
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <Mur nert="Нэр" utga={utgaKharuulya(ner)} />
                <Mur nert="Албан тушаал" utga={utgaKharuulya(employee.albanTushaal)} />
                <Mur nert="Утас" utga={utgaKharuulya(employee.utas)} />
                <Mur
                  nert="И-Мэйл"
                  utga={utgaKharuulya(employee.imeil || employee.email)}
                />
                <Mur
                  nert="Нэвтрэх нэр"
                  utga={utgaKharuulya(employee.nevtrekhNer)}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold text-slate-900 dark:text-white">
                Салбарын эрх
                <span className="ml-1.5 font-normal text-slate-400">
                  ({selectedBuildings.length})
                </span>
              </h3>
              {buildings.length === 0 ? (
                <p className="text-xs text-slate-400">Барилга олдсонгүй</p>
              ) : (
                <div className="space-y-1">
                  {buildings.map((b: any) => (
                    <div
                      key={b._id}
                      onClick={() => barilgaSolikh(b._id)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg py-1.5 pr-1 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-300">
                        {b.ner}
                      </span>
                      <Shiljuurch
                        idevkhitei={selectedBuildings.includes(b._id)}
                        onChange={() => barilgaSolikh(b._id)}
                        ariaLabel={b.ner}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Баруун: цонхны эрх */}
          <div className="flex min-h-0 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-6 py-3 dark:border-white/10">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Цонхны эрх
                <span className="ml-1.5 font-normal text-slate-400">
                  ({selectedPermissions.length})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Бүгдийг сонгох
                </span>
                <Shiljuurch
                  idevkhitei={bugdSongogdson}
                  onChange={bugdiigSolikh}
                  ariaLabel="Бүгдийг сонгох"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
              {ALL_PERMISSIONS.map((perm) => (
                <div key={perm.id}>
                  {erkhMur(perm, false)}
                  {perm.children?.map((child) => erkhMur(child, true))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Хөл ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-white/10">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5"
          >
            Болих
          </button>
          <button
            onClick={khadgalya}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
