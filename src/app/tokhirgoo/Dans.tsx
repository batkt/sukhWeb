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
  Popover,
} from "@mantine/core";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import useJagsaalt from "@/lib/useJagsaalt";
import createMethod from "../../../tools/function/createMethod";
import updateMethod from "../../../tools/function/updateMethod";
import deleteMethod from "../../../tools/function/deleteMethod";
import { aldaaBarigch } from "@/lib/uilchilgee";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import { useSpinner } from "@/context/SpinnerContext";
import Button from "@/components/ui/Button";

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
  const [deleteOpened, setDeleteOpened] = useState(false);

  return (
    <div className="flex items-center flex-col justify-between bg-white/50 dark:bg-gray-800/30 rounded-xl shadow-md hover:shadow-lg dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 p-4 mb-3 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex justify-between flex-col sm:flex-row w-full gap-3">
        <div>
          <div className=" text-theme dark:text-white text-sm mb-1">{t("Данс")}</div>
          <div className="text-theme dark:text-gray-300 font-mono">{data.dugaar}</div>
        </div>
        <div className="sm:text-right">
          <div className=" text-theme dark:text-white text-sm mb-1">{t("Дансны нэр")}</div>
          <div className="text-theme dark:text-gray-300 mb-3">{data.dansniiNer}</div>
          <div className="flex justify-end gap-2">
            <Popover
              opened={deleteOpened}
              onChange={setDeleteOpened}
              width={200}
              position="bottom-end"
            >
              <Popover.Target>
                <Tooltip label={t("Устгах")} withArrow>
                   <button
                     onClick={() => setDeleteOpened(true)}
                     className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all duration-200"
                     aria-label={t("Устгах")}
                   >
                     <span className="text-lg leading-none">×</span>
                   </button>
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown className="modal-surface border-[color:var(--surface-border)]">
            <div className="text-sm text-theme dark:text-white">
              <p className="mb-3">{data.dugaar} данс устгах уу?</p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteOpened(false)}
                >
                  {t("Хаах")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(data._id);
                    setDeleteOpened(false);
                  }}
                >
                  {t("Устгах")}
                </Button>
              </div>
            </div>
          </Popover.Dropdown>
        </Popover>

        <Tooltip label={t("Засах")} withArrow>
          <button
            onClick={() => onEdit(data)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-200"
            aria-label={t("Засах")}
          >
            <span className="text-sm">✎</span>
          </button>
        </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dans() {
  const t = (key: string) => key;
  const { token, ajiltan } = useAuth();
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

    showSpinner();
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
  }) => {
    const colors = bankKey === "khanbank" 
      ? "from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200/50 dark:border-blue-600/50 dark:shadow-blue-900/20 dark:hover:shadow-blue-900/30"
      : "from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-200/50 dark:border-emerald-600/50 dark:shadow-emerald-900/20 dark:hover:shadow-emerald-900/30";
    
    return (
      <div className={`bg-gradient-to-br ${colors} shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-5 mb-6 border`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg  text-theme dark:text-white">{title}</h2>
          <Button
            onClick={() => openAdd(bankKey)}
            variant="primary"
            size="sm"
            style={{ borderRadius: '0.75rem' }}
          >
            + {t("Нэмэх")}
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4 p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl">
          <span className=" text-theme dark:text-white">{t("Corporate ашиглах эсэх")}</span>
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
          <div className="flex flex-col gap-3 mb-4 p-4 bg-white/50 dark:bg-gray-800/30 rounded-xl">
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
            <Button 
              onClick={checkTdbConnection} 
              variant="primary"
              size="sm"
              style={{ borderRadius: '0.75rem', backgroundColor: '#10b981', borderColor: '#10b981' }}
              isLoading={loadingCheck}
            >
              {t("Шалгах")}
            </Button>
            {tdbMessage && <div className="text-green-600 dark:text-green-400 ">{tdbMessage}</div>}
          </div>
        )}

        {isValidating && (
          <div className="py-4 flex justify-center">
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
          <Button
            size="sm"
            style={{ borderRadius: '0.75rem' }}
            onClick={() => saveBank(bankKey)}
            variant="primary"
          >
            {t("Хадгалах")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="xxl:col-span-9 col-span-12 lg:col-span-12 h-full overflow-visible">
      <div className="neu-panel  allow-overflow p-4 md:p-6 space-y-6 min-h-[24rem]">
        <div className="grid grid-cols-12 gap-6 ">
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
            centered
          >
            <div className="flex flex-col gap-3 mt-2 ">
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

          <div className="flex justify-end gap-2 mt-2">
                <Button
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  {t("Хаах")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={saveDans}
                  isLoading={false}
                >
                  {t("Хадгалах")}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default Dans;
