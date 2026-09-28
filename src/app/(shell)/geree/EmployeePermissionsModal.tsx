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
import { X, Check, ShieldCheck } from "lucide-react";
import {
  ALL_PERMISSIONS,
  getAllPermissionIds,
  migratePermissionIds,
  getChildPermissionIds,
  getAncestorPermissionIds,
  type PermissionItem,
} from "@/lib/permissions";
import { useAuth } from "@/lib/useAuth";
import updateMethod from "../../../../tools/function/updateMethod";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import Button from "@/components/ui/Button";

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

/** Бүх түвшинд НЭГ хэмжээтэй шилжүүлэгч */
const Shiljuurch: React.FC<{
  idevkhitei: boolean;
  onChange: () => void;
  ariaLabel: string;
}> = ({ idevkhitei, onChange, ariaLabel }) => (
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
    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
      idevkhitei ? "bg-theme" : "bg-[color:var(--panel)]"
    }`}
  >
    <span
      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[color:var(--surface-bg)] shadow transition-all ${
        idevkhitei ? "left-[18px]" : "left-0.5"
      }`}
    />
  </button>
);

const Mur: React.FC<{ nert: string; utga: string }> = ({ nert, utga }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <span className="shrink-0 text-xs text-[color:var(--muted-text)]">
      {nert}
    </span>
    <span className="min-w-0 break-words text-right text-xs text-[color:var(--panel-text)]">
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
    // Хуучин «tokhirgoo.zassanTuukh» мэт ID-г шинэ «tuukh.*» болгож харуулна
    setSelectedPermissions(migratePermissionIds(mapped));
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
        className={`flex cursor-pointer items-center gap-3 px-4 transition-colors hover:bg-[color:var(--surface-hover)] ${
          khuukhed ? "py-2 pl-9" : "bg-theme/5 py-2.5"
        }`}
      >
        {khuukhed ? (
          <span className="w-3 shrink-0 text-[color:var(--muted-text)]">
            —
          </span>
        ) : (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              songogdson ? "bg-theme" : "bg-[color:var(--panel)]"
            }`}
          />
        )}
        <span
          className={`min-w-0 flex-1 truncate ${
            khuukhed
              ? "text-xs text-[color:var(--muted-text)]"
              : "text-[13px] font-medium text-[color:var(--panel-text)]"
          }`}
        >
          {perm.label}
        </span>
        {khuukhdiinToo !== null && (
          <span className="shrink-0 rounded-md bg-[color:var(--surface-hover)] px-1.5 py-0.5 font-mono text-[11px] text-[color:var(--muted-text)] dark:bg-white/10">
            {khuukhdiinToo}
          </span>
        )}
        <Shiljuurch
          idevkhitei={songogdson}
          onChange={() => erkhSolikh(perm.id)}
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
        className="modal-surface flex max-h-[92vh] w-full max-w-3xl [--modal-max-w:48rem] flex-col overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* ── Толгой: дүрс + гарчиг + тайлбар ── */}
        <div className="flex shrink-0 items-start gap-3.5 border-b border-[color:var(--surface-border)] px-6 py-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-theme/10 text-brand">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium text-[color:var(--panel-text)]">
              Эрхийн тохиргоо
            </h2>
            <p className="mt-0.5 truncate text-xs text-[color:var(--muted-text)]">
              {ner ? `${ner} — ` : ""}ажилтны салбар болон цонхны эрхийг тохируулна уу
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Хаах"
            title="Хаах"
            className="-mt-1 rounded-xl p-2 text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Их бие ── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Зүүн: профайл + салбарын эрх */}
          <div className="min-h-0 space-y-4 overflow-y-auto border-b border-[color:var(--surface-border)] p-5 md:border-b-0 md:border-r">
            <section className="rounded-xl border border-[color:var(--surface-border)] px-4 py-3">
              <h3 className="mb-1.5 text-xs font-medium text-[color:var(--panel-text)]">
                Профайл мэдээлэл
              </h3>
              <div className="divide-y divide-[color:var(--surface-border)]">
                <Mur nert="Нэр" utga={utgaKharuulya(ner)} />
                <Mur nert="Албан тушаал" utga={utgaKharuulya(employee.albanTushaal)} />
                <Mur nert="Утас" utga={utgaKharuulya(employee.utas)} />
                <Mur
                  nert="И-мэйл"
                  utga={utgaKharuulya(employee.mail || employee.email || employee.imeil)}
                />
                <Mur
                  nert="Нэвтрэх нэр"
                  utga={utgaKharuulya(employee.nevtrekhNer)}
                />
              </div>
            </section>

            <section className="rounded-xl border border-[color:var(--surface-border)] px-4 py-3">
              <h3 className="mb-1.5 text-xs font-medium text-[color:var(--panel-text)]">
                Салбарын эрх
                <span className="ml-1.5 font-normal text-[color:var(--muted-text)]">
                  ({selectedBuildings.length})
                </span>
              </h3>
              {buildings.length === 0 ? (
                <p className="py-1.5 text-xs text-[color:var(--muted-text)]">Барилга олдсонгүй</p>
              ) : (
                <div className="divide-y divide-[color:var(--surface-border)]">
                  {buildings.map((b: any) => (
                    <div
                      key={b._id}
                      onClick={() => barilgaSolikh(b._id)}
                      className="flex cursor-pointer items-center justify-between gap-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs text-[color:var(--panel-text)]">
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
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--surface-border)] px-4 py-3">
              <h3 className="text-xs font-medium text-[color:var(--panel-text)]">
                Цонхны эрх
                <span className="ml-1.5 font-normal text-[color:var(--muted-text)]">
                  ({selectedPermissions.length})
                </span>
              </h3>
              <div
                onClick={bugdiigSolikh}
                className="flex cursor-pointer items-center gap-3"
              >
                <span className="text-xs text-[color:var(--muted-text)]">
                  Бүгдийг сонгох
                </span>
                <Shiljuurch
                  idevkhitei={bugdSongogdson}
                  onChange={bugdiigSolikh}
                  ariaLabel="Бүгдийг сонгох"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {ALL_PERMISSIONS.map((perm) => (
                <div
                  key={perm.id}
                  className="divide-y divide-[color:var(--surface-border)] overflow-hidden rounded-xl border border-[color:var(--surface-border)]"
                >
                  {erkhMur(perm, false)}
                  {perm.children?.map((child) => erkhMur(child, true))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Хөл ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[color:var(--surface-border)] px-6 py-4">
          <Button
            onClick={onClose}
            variant="secondary"
            className="min-w-[100px]"
            disabled={saving}
          >
            Хаах
          </Button>
          <Button
            onClick={khadgalya}
            variant="primary"
            className="min-w-[140px]"
            disabled={saving}
            icon={saving ? undefined : <Check className="h-4 w-4" />}
          >
            {saving ? "Түр хүлээнэ үү..." : "Хадгалах"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
