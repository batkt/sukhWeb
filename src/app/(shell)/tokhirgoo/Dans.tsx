"use client";

import React, { useMemo, useState } from "react";
import {
  Tooltip,
  TextInput,
  PasswordInput,
  Modal,
  Select,
  Loader,
  Popover,
} from "@mantine/core";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import useJagsaalt from "@/lib/useJagsaalt";
import createMethod from "../../../../tools/function/createMethod";
import updateMethod from "../../../../tools/function/updateMethod";
import deleteMethod from "../../../../tools/function/deleteMethod";
import { aldaaBarigch } from "@/lib/uilchilgee";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import { useSpinner } from "@/context/SpinnerContext";
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { SettingsCard, SettingsItem, Switch } from "./SettingsRow";

interface DansItem {
  _id: string;
  dugaar: string;
  dansniiNer: string;
  valyut: string;
  bank: "khanbank" | "tdb";
  ibanDugaar?: string;
  corporateAshiglakhEsekh?: boolean;
  corporateNevtrekhNer?: string;
  corporateNuutsUg?: string;
  corporateGuilgeeniiNuutsUg?: string;
}

interface DansTileProps {
  data: DansItem;
  onEdit: (data: DansItem) => void;
  onDelete: (id: string) => Promise<void> | void;
  t: (key: string) => string;
}

function DansTile({ data, onEdit, onDelete, t }: DansTileProps) {
  const [deleteOpened, setDeleteOpened] = useState(false);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <div className="text-[12px] text-[color:var(--muted-text)]">{t("Дансны дугаар")}</div>
          <div className="truncate text-[14px] text-[color:var(--panel-text)] tabular-nums">{data.dugaar}</div>
          {data.ibanDugaar && (
            <div className="truncate text-[12px] text-[color:var(--muted-text)] tabular-nums">{data.ibanDugaar}</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] text-[color:var(--muted-text)]">{t("Дансны нэр")}</div>
          <div className="truncate text-[14px] text-[color:var(--panel-text)]">{data.dansniiNer}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip label={t("Засах")} withArrow>
          <button
            type="button"
            onClick={() => onEdit(data)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-brand"
            aria-label={t("Засах")}
            title={t("Засах")}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </Tooltip>
        <Popover
          opened={deleteOpened}
          onChange={setDeleteOpened}
          width={240}
          position="bottom-end"
        >
          <Popover.Target>
            <Tooltip label={t("Устгах")} withArrow>
              <button
                type="button"
                onClick={() => setDeleteOpened(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label={t("Устгах")}
                title={t("Устгах")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown className="modal-surface border-[color:var(--surface-border)]">
            <div className="text-[14px] text-[color:var(--panel-text)]">
              <p className="mb-3">{data.dugaar} данс устгах уу?</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="stg-btn stg-btn-ghost"
                  onClick={() => setDeleteOpened(false)}
                >
                  {t("Хаах")}
                </button>
                <button
                  type="button"
                  className="stg-btn bg-danger text-white hover:opacity-90"
                  onClick={() => {
                    onDelete(data._id);
                    setDeleteOpened(false);
                  }}
                >
                  {t("Устгах")}
                </button>
              </div>
            </div>
          </Popover.Dropdown>
        </Popover>
      </div>
    </li>
  );
}

function Dans() {
  const t = (key: string) => key;
  const { token, ajiltan, barilgiinId } = useAuth();
  const { showSpinner, hideSpinner } = useSpinner();
  // Load all accounts using shared list hook
  const orgQuery = useMemo(
    () => ({ baiguullagiinId: ajiltan?.baiguullagiinId || undefined }),
    [ajiltan?.baiguullagiinId]
  );
  const {
    jagsaalt: allDans,
    mutate: refetchDans,
    isValidating,
  } = useJagsaalt<DansItem>(DANS_ENDPOINT, orgQuery, { createdAt: -1 });

  const [khanbankCorporate, setKhanBankCorporate] = useState<Partial<DansItem>>(
    { corporateAshiglakhEsekh: false }
  );
  const [tdbCorporate, setTdbCorporate] = useState<Partial<DansItem>>({
    corporateAshiglakhEsekh: false,
  });

  // Seed corporate state from first matching dans once loaded
  React.useEffect(() => {
    if (!allDans) return;
    const kh = allDans.find((d) => d.bank === "khanbank");
    if (kh) setKhanBankCorporate({ corporateAshiglakhEsekh: kh.corporateAshiglakhEsekh || false, corporateNevtrekhNer: kh.corporateNevtrekhNer || "", corporateNuutsUg: kh.corporateNuutsUg || "" });
    const td = allDans.find((d) => d.bank === "tdb");
    if (td) setTdbCorporate({ corporateAshiglakhEsekh: td.corporateAshiglakhEsekh || false, corporateNevtrekhNer: td.corporateNevtrekhNer || "", corporateNuutsUg: td.corporateNuutsUg || "" });
  }, [allDans]);

  // Modal state for add/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DansItem | null>(null);
  const [formState, setFormState] = useState<
    Pick<DansItem, "dugaar" | "dansniiNer" | "valyut" | "bank" | "ibanDugaar" | "corporateAshiglakhEsekh" | "corporateNevtrekhNer" | "corporateNuutsUg">
  >({ dugaar: "", dansniiNer: "", valyut: "MNT", bank: "khanbank", ibanDugaar: "", corporateAshiglakhEsekh: false, corporateNevtrekhNer: "", corporateNuutsUg: "" });

  const openAdd = (bank: "khanbank" | "tdb") => {
    setEditing(null);
    setFormState({ dugaar: "", dansniiNer: "", valyut: "MNT", bank, ibanDugaar: "", corporateAshiglakhEsekh: false, corporateNevtrekhNer: "", corporateNuutsUg: "" });
    setModalOpen(true);
  };

  const openEdit = (data: DansItem) => {
    setEditing(data);
    setFormState({
      dugaar: data.dugaar || "",
      dansniiNer: data.dansniiNer || "",
      valyut: data.valyut || "MNT",
      bank: data.bank,
      ibanDugaar: data.ibanDugaar || "",
      corporateAshiglakhEsekh: data.corporateAshiglakhEsekh || false,
      corporateNevtrekhNer: data.corporateNevtrekhNer || "",
      corporateNuutsUg: data.corporateNuutsUg || "",
    });
    setModalOpen(true);
  };

  const saveDans = async () => {
    if (!token) return;

    showSpinner();
    try {
      const payload: Record<string, any> = {
        ...formState,
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId: barilgiinId || ajiltan?.barilgiinId || null,
      };
      if (!formState.corporateAshiglakhEsekh) {
        payload.corporateNevtrekhNer = "";
        payload.corporateNuutsUg = "";
      }
      if (editing?._id) {
        await updateMethod("dans", token, { _id: editing._id, ...payload });
      } else {
        await createMethod("dans", token, payload);
      }
      toast.success(t("Амжилттай хадгаллаа"));
      setModalOpen(false);
      setEditing(null);
      refetchDans();
    } catch (e) {
      aldaaBarigch(e);
    } finally {
      hideSpinner();
    }
  };

  const removeDans = async (id: string) => {
    if (!token) return;
    try {
      await deleteMethod("dans", token, id);
      toast.success(t("Амжилттай устгалаа"));
      refetchDans();
    } catch (e) {
      aldaaBarigch(e);
    }
  };

  const saveBank = async (bank: "khanbank" | "tdb") => {
    if (!token) return;
    const corporateState = bank === "khanbank" ? khanbankCorporate : tdbCorporate;
    const dansList = (allDans || []).filter((d) => d.bank === bank);
    if (dansList.length === 0) { toast.success(t("Амжилттай хадгаллаа")); return; }
    showSpinner();
    try {
      await Promise.all(
        dansList.map((d) =>
          updateMethod("dans", token, {
            _id: d._id,
            corporateAshiglakhEsekh: corporateState.corporateAshiglakhEsekh || false,
            corporateNevtrekhNer: corporateState.corporateAshiglakhEsekh ? corporateState.corporateNevtrekhNer || "" : "",
            corporateNuutsUg: corporateState.corporateAshiglakhEsekh ? corporateState.corporateNuutsUg || "" : "",
            baiguullagiinId: ajiltan?.baiguullagiinId,
          })
        )
      );
      toast.success(t("Амжилттай хадгаллаа"));
      refetchDans();
    } catch (e) {
      aldaaBarigch(e);
    } finally {
      hideSpinner();
    }
  };


  const BankCard = ({
    title,
    bankKey,
    corporateState,
    setCorporateState,
  }: {
    title: string;
    bankKey: "khanbank" | "tdb";
    corporateState: Partial<DansItem>;
    setCorporateState: React.Dispatch<React.SetStateAction<Partial<DansItem>>>;
  }) => {
    const bankDans = (allDans || []).filter((d) => d.bank === bankKey);

    return (
      <SettingsCard
        icon={<Landmark className="h-4 w-4" />}
        title={title}
        subtitle={
          bankDans.length
            ? `${bankDans.length} данс бүртгэлтэй`
            : "Данс бүртгэгдээгүй байна"
        }
        toggle={
          <button
            type="button"
            onClick={() => openAdd(bankKey)}
            className="stg-btn stg-btn-primary"
          >
            <Plus className="h-4 w-4" />
            {t("Нэмэх")}
          </button>
        }
        onSave={() => saveBank(bankKey)}
      >
        <SettingsItem
          title={t("Corporate ашиглах эсэх")}
          desc="Банкны corporate эрхээр гүйлгээг автоматаар татах бол асаана уу."
          control={
            <Switch
              checked={corporateState.corporateAshiglakhEsekh || false}
              onChange={(event) =>
                setCorporateState({
                  ...corporateState,
                  corporateAshiglakhEsekh: event.currentTarget.checked,
                })
              }
              label={t("Corporate ашиглах эсэх")}
            />
          }
        >
          {corporateState.corporateAshiglakhEsekh && (
            <div className="stg-grid">
              <TextInput
                label={t("Нэвтрэх нэр")}
                placeholder="CAdmin1"
                value={corporateState.corporateNevtrekhNer || ""}
                onChange={(e) =>
                  setCorporateState({
                    ...corporateState,
                    corporateNevtrekhNer: e.target.value,
                  })
                }
                className="text-theme"
              />
              <PasswordInput
                label={t("Нэвтрэх нууц үг")}
                placeholder="••••••••"
                value={corporateState.corporateNuutsUg || ""}
                onChange={(e) =>
                  setCorporateState({
                    ...corporateState,
                    corporateNuutsUg: e.target.value,
                  })
                }
                className="text-theme"
              />
            </div>
          )}
        </SettingsItem>

        {isValidating && (
          <div className="flex justify-center py-4">
            <Loader size="sm" />
          </div>
        )}
        {bankDans.length > 0 ? (
          <ul className="divide-y divide-[color:var(--surface-border)] rounded-xl border border-[color:var(--surface-border)]">
            {bankDans.map((d) => (
              <DansTile
                key={d._id}
                data={d}
                onEdit={openEdit}
                onDelete={removeDans}
                t={t}
              />
            ))}
          </ul>
        ) : (
          !isValidating && (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-[color:var(--surface-border)] px-4 py-6 text-center">
              <p className="text-[14px] text-[color:var(--panel-text)]">Данс нэмээгүй байна</p>
              <p className="max-w-xs text-[13px] text-[color:var(--muted-text)]">
                «Нэмэх» товч дарж энэ банкны дансаа оруулна уу.
              </p>
            </div>
          )
        )}
      </SettingsCard>
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
        <BankCard
          title={t("Хаан банк")}
          bankKey="khanbank"
          corporateState={khanbankCorporate}
          setCorporateState={setKhanBankCorporate}
        />
        <BankCard
          title={t("Худалдаа хөгжлийн банк")}
          bankKey="tdb"
          corporateState={tdbCorporate}
          setCorporateState={setTdbCorporate}
        />
      </div>

          <Modal
            opened={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            title={editing ? t("Данс засах") : t("Шинэ данс нэмэх")}
            classNames={{ content: "modal-surface" }}
            centered
          >
            <div className="mt-1 flex flex-col gap-4">
              <div>
                <div className="mb-1 text-[13px] text-[color:var(--muted-text)]">{t("Банк")}</div>
                <Select
                  data={[
                    { label: "Хаан банк", value: "khanbank" },
                    { label: "ХХБ", value: "tdb" },
                  ]}
                  value={formState.bank}
                  onChange={(v) =>
                    setFormState((s) => ({
                      ...s,
                      bank: (v as "khanbank" | "tdb") ?? "khanbank",
                    }))
                  }
                  comboboxProps={{ classNames: { dropdown: "tusgaiZagvar" } }}
                  classNames={{ input: "" }}
                />
              </div>
              <div>
                <div className="mb-1 text-[13px] text-[color:var(--muted-text)]">{t("Дансны дугаар")}</div>
                <TextInput
                  placeholder={t("Дансны дугаар")}
                  value={formState.dugaar}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, dugaar: e.target.value }))
                  }
                  className="text-theme"
                />
              </div>
              <div>
                <div className="mb-1 text-[13px] text-[color:var(--muted-text)]">{t("Дансны нэр")}</div>
                <TextInput
                  placeholder={t("Дансны нэр")}
                  value={formState.dansniiNer}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, dansniiNer: e.target.value }))
                  }
                  className="text-theme"
                />
              </div>
              <div>
                <div className="mb-1 text-[13px] text-[color:var(--muted-text)]">{t("IBAN дугаар")}</div>
                <TextInput
                  placeholder="MN76000500XXXXXXXXXX"
                  value={formState.ibanDugaar || ""}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, ibanDugaar: e.target.value }))
                  }
                  className="text-theme"
                />
              </div>


              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="stg-btn stg-btn-ghost"
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                  }}
                >
                  {t("Хаах")}
                </button>
                <button
                  type="button"
                  className="stg-btn stg-btn-primary"
                  onClick={saveDans}
                >
                  {t("Хадгалах")}
                </button>
              </div>
            </div>
          </Modal>
    </div>
  );
}

export default Dans;
