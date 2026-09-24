"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import Button from "@/components/ui/Button";

interface EmployeeModalProps {
  show: boolean;
  onClose: () => void;
  editingEmployee: any;
  newEmployee: any;
  setNewEmployee: (val: any) => void;
  onSubmit: (e: React.FormEvent) => Promise<any>;
}

/**
 * Оролтын нэгдсэн хэлбэр.
 *
 * `dark:text-white` хэрэглэхгүй — `--panel-text` нь хоёр горимд зөв өнгө
 * өгдөг (цайвар `#0f172a`, харанхуй `#f9fafb`) тул давхар зарлах нь
 * зөвхөн зөрчил үүсгэдэг.
 */
const OROLT =
  "h-12 w-full rounded-xl border border-[color:var(--surface-border)] " +
  "bg-[color:var(--surface-bg)] pl-11 pr-4 text-sm text-[color:var(--panel-text)] " +
  "placeholder:text-[color:var(--muted-text)] transition-colors " +
  "focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/20";

/** Шошго + шаардлагатайн од + зүүн дүрс бүхий талбарын бүрхүүл */
function Talbar({
  shoshgo,
  shaardlagatai,
  durs: Durs,
  children,
}: {
  shoshgo: string;
  shaardlagatai?: boolean;
  durs: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-[color:var(--panel-text)]">
        {shoshgo}
        {shaardlagatai && <span className="ml-1 text-danger">*</span>}
      </label>
      <div className="relative">
        <Durs className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand" />
        {children}
      </div>
    </div>
  );
}

export default function EmployeeModal({
  show,
  onClose,
  editingEmployee,
  newEmployee,
  setNewEmployee,
  onSubmit,
}: EmployeeModalProps) {
  const employeeRef = React.useRef<HTMLDivElement | null>(null);
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nuutsUgKharagdakh, setNuutsUgKharagdakh] = React.useState(false);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: employeeRef.current,
  });

  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000]"
        >
          <div className="absolute inset-0 bg-transparent" />
          <motion.div
            ref={employeeRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="modal-surface modal-responsive fixed top-1/2 left-1/2 z-[12001] flex w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl p-0 shadow-2xl"
          >
            {/* ── Толгой: дүрс + гарчиг + тайлбар ──────────────────────── */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex cursor-move items-start gap-3.5 border-b border-[color:var(--surface-border)] px-6 py-5 select-none"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-theme/10 text-brand">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-medium text-[color:var(--panel-text)]">
                  {editingEmployee ? "Ажилтан засах" : "Ажилтан нэмэх"}
                </h2>
                <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">
                  СӨХ-ийн ажилтны мэдээллийг оруулна уу
                </p>
              </div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                className="-mt-1 rounded-xl p-2 text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
                aria-label="Хаах"
                title="Хаах"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  const success = await onSubmit(e);
                  if (!success) setIsSubmitting(false);
                } catch {
                  setIsSubmitting(false);
                }
              }}
              className="p-6"
            >
              {editingEmployee && (
                <input
                  type="hidden"
                  name="_id"
                  value={newEmployee._id || editingEmployee._id}
                />
              )}

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <Talbar shoshgo="Овог" durs={UserRound}>
                  <input
                    type="text"
                    name="ovog"
                    value={newEmployee.ovog}
                    onChange={(e) => {
                      const value = e.target.value.replace(
                        /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                        "",
                      );
                      setNewEmployee((p: any) => ({ ...p, ovog: value }));
                    }}
                    placeholder="Овог"
                    className={OROLT}
                  />
                </Talbar>

                <Talbar shoshgo="Нэр" shaardlagatai durs={UserRound}>
                  <input
                    type="text"
                    name="ner"
                    value={newEmployee.ner}
                    onChange={(e) => {
                      const value = e.target.value.replace(
                        /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                        "",
                      );
                      setNewEmployee((p: any) => ({ ...p, ner: value }));
                    }}
                    placeholder="Нэр"
                    className={OROLT}
                    required
                  />
                </Talbar>

                <Talbar shoshgo="Утас" shaardlagatai durs={Phone}>
                  <input
                    type="tel"
                    name="utas"
                    value={newEmployee.utas}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 8);
                      setNewEmployee((p: any) => ({
                        ...p,
                        utas: value,
                        // Нэвтрэх нэр нь ихэвчлэн утасны дугаар байдаг тул
                        // хэрэглэгч ГАРААР өөрчлөөгүй л бол дагаж явна.
                        nevtrekhNer:
                          !p.nevtrekhNer || p.nevtrekhNer === p.utas
                            ? value
                            : p.nevtrekhNer,
                      }));
                    }}
                    placeholder="99112233"
                    className={OROLT}
                    maxLength={8}
                    pattern="[0-9]{8}"
                    required
                  />
                </Talbar>

                <Talbar shoshgo="И-мэйл" durs={Mail}>
                  <input
                    type="email"
                    name="email"
                    value={newEmployee.email}
                    onChange={(e) =>
                      setNewEmployee((p: any) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    placeholder="example@domain.mn"
                    className={OROLT}
                  />
                </Talbar>

                <Talbar shoshgo="Албан тушаал" shaardlagatai durs={Briefcase}>
                  <input
                    type="text"
                    name="albanTushaal"
                    value={newEmployee.albanTushaal}
                    onChange={(e) =>
                      setNewEmployee((p: any) => ({
                        ...p,
                        albanTushaal: e.target.value,
                      }))
                    }
                    placeholder="Албан тушаал"
                    className={OROLT}
                    required
                  />
                </Talbar>

                <Talbar shoshgo="Ажилд орсон огноо" durs={Calendar}>
                  <StandardDatePicker
                    value={
                      newEmployee.ajildOrsonOgnoo
                        ? new Date(newEmployee.ajildOrsonOgnoo)
                        : null
                    }
                    onChange={(v) =>
                      setNewEmployee((p: any) => ({
                        ...p,
                        ajildOrsonOgnoo: v
                          ? (() => {
                              const date = new Date(v);
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(
                                2,
                                "0",
                              );
                              const day = String(date.getDate()).padStart(2, "0");
                              return `${year}-${month}-${day}`;
                            })()
                          : "",
                      }))
                    }
                    placeholder="Огноо сонгох"
                    /* Зүүн зайг `.ant-picker` бүрхүүлд (`pl-11`) өгч, дотоод
                       `<input>`-ийн зайг 0 болгосноор текст бусад талбартай
                       нэг эгнээнээс эхэлнэ. Баруун талын календарь дүрсийг
                       (`suffixIcon`) нууж, зүүн дүрсийг ашиглана.

                       `!` шаардлагатай: AntD-ийн `.ant-picker .ant-picker-input
                       > input` нь (0,3,1) спецификтэй тул эрэмбээр дийлдэг. */
                    className="!h-12 w-full !rounded-xl !bg-[color:var(--surface-bg)] !pl-11 [&_input]:!pl-0 [&_input]:!text-sm [&_input]:!text-[color:var(--panel-text)] [&_input::placeholder]:!text-[color:var(--muted-text)]"
                    allowClear
                    suffixIcon={null}
                    getPopupContainer={() => employeeRef.current || document.body}
                    popupStyle={{ zIndex: 13010 }}
                  />
                  <input
                    type="hidden"
                    name="ajildOrsonOgnoo"
                    value={newEmployee.ajildOrsonOgnoo || ""}
                  />
                </Talbar>

                {/* Нэвтрэх эрх: шинэ ажилтанд заавал, засах үед нууц үг
                    хоосон бол хэвээр үлдэнэ. */}
                <>
                    <Talbar shoshgo="Нэвтрэх нэр" shaardlagatai durs={UserRound}>
                      <input
                        type="text"
                        name="nevtrekhNer"
                        value={newEmployee.nevtrekhNer}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            nevtrekhNer: e.target.value,
                          }))
                        }
                        placeholder="Нэвтрэх нэр"
                        className={OROLT}
                        required
                      />
                    </Talbar>

                    <Talbar
                      shoshgo={editingEmployee ? "Шинэ нууц үг" : "Нууц үг"}
                      shaardlagatai={!editingEmployee}
                      durs={Lock}
                    >
                      <input
                        type={nuutsUgKharagdakh ? "text" : "password"}
                        name="nuutsUg"
                        value={newEmployee.nuutsUg}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            nuutsUg: e.target.value,
                          }))
                        }
                        placeholder={
                          editingEmployee ? "Солихгүй бол хоосон үлдээнэ" : "••••••••"
                        }
                        autoComplete="new-password"
                        minLength={4}
                        maxLength={8}
                        title="Нууц үг 4-8 тэмдэгт байна"
                        className={`${OROLT} !pr-11`}
                        required={!editingEmployee}
                      />
                      <button
                        type="button"
                        onClick={() => setNuutsUgKharagdakh((v) => !v)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-[color:var(--muted-text)] transition-colors hover:text-[color:var(--panel-text)]"
                        aria-label={
                          nuutsUgKharagdakh ? "Нууц үгийг нуух" : "Нууц үгийг харах"
                        }
                        title={
                          nuutsUgKharagdakh ? "Нууц үгийг нуух" : "Нууц үгийг харах"
                        }
                      >
                        {nuutsUgKharagdakh ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </Talbar>
                </>
              </div>

              {/* Нэвтрэх эрх зөвхөн ШИНЭ ажилтан дээр үүсдэг тул засах үед
                  энэ мэдэгдэл хамаарахгүй. */}
              {!editingEmployee && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-theme/20 bg-theme/5 px-4 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <p className="text-xs leading-relaxed text-[color:var(--muted-text)]">
                    Ажилтны мэдээллийг бүртгэсний дараа системд нэвтрэх эрх
                    автоматаар үүснэ.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="min-w-[100px]"
                >
                  Хаах
                </Button>
                <Button
                  htmlType="submit"
                  variant="primary"
                  className="min-w-[140px]"
                  disabled={isSubmitting}
                  icon={isSubmitting ? undefined : <Check className="h-4 w-4" />}
                >
                  {isSubmitting ? "Түр хүлээнэ үү..." : "Хадгалах"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
