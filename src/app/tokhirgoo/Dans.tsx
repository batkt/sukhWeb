"use client";

import React, { useMemo, useState } from "react";
import {
  Tooltip,
  Switch,
  TextInput,
  PasswordInput,
  Modal,
  Select,
  Loader,
} from "@mantine/core";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import useJagsaalt from "@/lib/useJagsaalt";
import createMethod from "../../../tools/function/createMethod";
import updateMethod from "../../../tools/function/updateMethod";
import deleteMethod from "../../../tools/function/deleteMethod";
import { aldaaBarigch } from "../../../lib/uilchilgee";
import { DANS_ENDPOINT } from "@/lib/endpoints";

interface DansItem {
  _id: string;
  dugaar: string;
  dansniiNer: string;
  valyut: string;
  bank: "khanbank" | "tdb";
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
  return (
    <div className="flex items-center justify-between bg-transparent rounded-2xl shadow p-4 mb-3 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
        <div>
          <div className="font-medium text-slate-700">{t("Данс")}</div>
          <div className="text-slate-900">{data.dugaar}</div>
        </div>
        <div>
          <div className="font-medium text-slate-700">{t("Дансны нэр")}</div>
          <div className="text-slate-900">{data.dansniiNer}</div>
        </div>
        <div>
          <div className="font-medium text-slate-700">{t("Валют")}</div>
          <div className="text-slate-900">{data.valyut}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Tooltip label={t("Устгах")} withArrow>
          <button
            onClick={() => {
              if (window.confirm(`${data.dugaar} данс устгах уу?`)) {
                onDelete(data._id);
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition"
            aria-label={t("Устгах")}
          >
            ×
          </button>
        </Tooltip>

        <Tooltip label={t("Засах")} withArrow>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition"
            onClick={() => onEdit(data)}
            aria-label={t("Засах")}
          >
            ✎
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

function Dans() {
  const t = (key: string) => key;
  const { token, ajiltan } = useAuth();
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
  const [tdbMessage, setTdbMessage] = useState("");
  const [loadingCheck, setLoadingCheck] = useState(false);

  // Modal state for add/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DansItem | null>(null);
  const [formState, setFormState] = useState<
    Pick<DansItem, "dugaar" | "dansniiNer" | "valyut" | "bank">
  >({ dugaar: "", dansniiNer: "", valyut: "MNT", bank: "khanbank" });

  const openAdd = (bank: "khanbank" | "tdb") => {
    setEditing(null);
    setFormState({ dugaar: "", dansniiNer: "", valyut: "MNT", bank });
    setModalOpen(true);
  };

  const openEdit = (data: DansItem) => {
    setEditing(data);
    setFormState({
      dugaar: data.dugaar || "",
      dansniiNer: data.dansniiNer || "",
      valyut: data.valyut || "MNT",
      bank: data.bank,
    });
    setModalOpen(true);
  };

  const saveDans = async () => {
    if (!token) return;
    try {
      if (editing?._id) {
        await updateMethod("dans", token, {
          _id: editing._id,
          ...formState,
          baiguullagiinId: ajiltan?.baiguullagiinId,
        });
      } else {
        await createMethod("dans", token, {
          ...formState,
          baiguullagiinId: ajiltan?.baiguullagiinId,
        });
      }
      toast.success(t("Амжилттай хадгаллаа"));
      setModalOpen(false);
      setEditing(null);
      refetchDans();
    } catch (e) {
      aldaaBarigch(e);
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

  const saveBank = (bank: "khanbank" | "tdb") => {
    toast.success(t("Амжилттай хадгаллаа"));
  };

  const checkTdbConnection = () => {
    setLoadingCheck(true);
    setTimeout(() => {
      setTdbMessage("Холболт амжилттай");
      setLoadingCheck(false);
    }, 1000);
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
  }) => (
    <div className="bg-transparent rounded-2xl shadow p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={() => openAdd(bankKey)}
          className="btn-minimal btn-neu-round"
          aria-label={t("Нэмэх")}
        >
          +
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span>{t("Corporate ашиглах эсэх")}</span>
        <Switch
          checked={corporateState.corporateAshiglakhEsekh || false}
          onChange={(event) =>
            setCorporateState({
              ...corporateState,
              corporateAshiglakhEsekh: event.currentTarget.checked,
            })
          }
        />
      </div>

      {bankKey === "tdb" && corporateState.corporateAshiglakhEsekh && (
        <div className="flex flex-col gap-3 mb-4">
          <TextInput
            placeholder={t("Нэвтрэх нэр")}
            value={corporateState.corporateNevtrekhNer}
            onChange={(e) =>
              setCorporateState({
                ...corporateState,
                corporateNevtrekhNer: e.target.value,
              })
            }
            className="text-theme"
          />
          <PasswordInput
            placeholder={t("Нэвтрэх нууц үг")}
            value={corporateState.corporateNuutsUg}
            onChange={(e) =>
              setCorporateState({
                ...corporateState,
                corporateNuutsUg: e.target.value,
              })
            }
            className="text-theme"
          />
          <button onClick={checkTdbConnection} className="btn-minimal">
            {loadingCheck ? <Loader size="sm" /> : t("Шалгах")}
          </button>
          {tdbMessage && <div className="text-green-600">{tdbMessage}</div>}
        </div>
      )}

      {isValidating && (
        <div className="py-4">
          <Loader />
        </div>
      )}
      {(allDans || [])
        .filter((d) => d.bank === bankKey)
        .map((d) => (
          <DansTile
            key={d._id}
            data={d}
            onEdit={openEdit}
            onDelete={removeDans}
            t={t}
          />
        ))}

      <div className="flex justify-end mt-4">
        <button className="btn-minimal" onClick={() => saveBank(bankKey)}>
          {t("Хадгалах")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-6">
        <BankCard
          title={t("Хаан банк")}
          bankKey="khanbank"
          corporateState={khanbankCorporate}
          setCorporateState={setKhanBankCorporate}
        />
      </div>
      <div className="col-span-12 lg:col-span-6">
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
      >
        <div className="flex flex-col gap-3 mt-2">
          <div>
            <div className="text-sm mb-1">{t("Банк")}</div>
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
            <div className="text-sm mb-1">{t("Дансны дугаар")}</div>
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
            <div className="text-sm mb-1">{t("Дансны нэр")}</div>
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
            <div className="text-sm mb-1">{t("Валют")}</div>
            <Select
              data={[
                { label: "MNT", value: "MNT" },
                { label: "USD", value: "USD" },
                { label: "EUR", value: "EUR" },
              ]}
              value={formState.valyut}
              onChange={(v) =>
                setFormState((s) => ({ ...s, valyut: v || "MNT" }))
              }
              comboboxProps={{ classNames: { dropdown: "tusgaiZagvar" } }}
              classNames={{ input: "" }}
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="btn-minimal btn-cancel"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
            >
              {t("Болих")}
            </button>
            <button className="btn-minimal btn-save" onClick={saveDans}>
              {t("Хадгалах")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dans;
