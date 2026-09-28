"use client";

/**
 * Өмч бүртгэл → Зогсоол / Агуулах табын Excel загвар татах, оруулах.
 *
 * Хадгалалт нь гараар хийдэг урсгалтай ЯГ ижил API-г ашиглана:
 *   • шинэ утас      → POST /khariltsagch       («Харилцагч нэмэх» модал)
 *   • харилцагч      → PUT  /khariltsagch/:id   (модалын засвар, toots-ыг нэмж)
 *   • оршин суугч    → PUT  /orshinSuugch/:id   (оршин суугчийн модал, toots-ыг нэмж)
 * Одоо байгаа дугаарыг хэзээ ч хасахгүй — зөвхөн нэмнэ.
 */
import React from "react";
import { FileDown, FileUp, X } from "lucide-react";
import { useSWRConfig } from "swr";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee, { getErrorMessage } from "@/lib/uilchilgee";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { ModalPortal } from "../../../../components/shell/ModalPortal";
import { useGereeContext } from "./GereeContext";
import {
  EzemshikhTurul,
  Ezen,
  ParsedUnit,
  PersonGroup,
  RowIssue,
  buildOwnerMap,
  buildTemplate,
  floorsFor,
  parseWorkbook,
  personName,
  personPhones,
  personUnits,
  runPool,
  tootTurulAngilal,
  turulNer,
  turulToToot,
  unitKey,
} from "@/lib/zogsoolAguulakhExcel";

type Existing = {
  kind: "khariltsagch" | "orshinSuugch";
  id: string;
  name: string;
  record: any;
};

type PlanItem = {
  group: PersonGroup;
  existing: Existing | null;
  newUnits: ParsedUnit[];
  alreadyOwn: ParsedUnit[];
  conflicts: { unit: ParsedUnit; owner: Ezen }[];
  skipReason?: string;
};

type ResultItem = {
  name: string;
  utas: string;
  status: "ok" | "skipped" | "failed";
  message: string;
};

const unitLabel = (u: { turul: string; davkhar: string; toot: string }) =>
  `${turulNer(u.turul)} ${u.davkhar}-${u.toot}`;

export default function ZogsoolAguulakhExcel({
  turul,
  idPrefix = "",
}: {
  turul: EzemshikhTurul;
  idPrefix?: string;
}) {
  const { token, baiguullaga, barilgiinId, ajiltan } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const { data } = useGereeContext();
  const { mutate } = useSWRConfig();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const effectiveBarilgiinId = String(selectedBuildingId || barilgiinId || "");
  const baiguullagiinId = String(baiguullaga?._id || ajiltan?.baiguullagiinId || "");

  const [busy, setBusy] = React.useState<null | string>(null);
  const [plan, setPlan] = React.useState<PlanItem[] | null>(null);
  const [errors, setErrors] = React.useState<RowIssue[]>([]);
  const [warnings, setWarnings] = React.useState<RowIssue[]>([]);
  const [includeConflicts, setIncludeConflicts] = React.useState(false);
  const [results, setResults] = React.useState<ResultItem[] | null>(null);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  const floors = React.useMemo(
    () => ({
      Зогсоол: floorsFor(data.selectedBarilga, data.davkharOptions, data.getTootOptions, "Зогсоол"),
      Агуулах: floorsFor(data.selectedBarilga, data.davkharOptions, data.getTootOptions, "Агуулах"),
    }),
    [data.selectedBarilga, data.davkharOptions, data.getTootOptions],
  );

  const ownerMap = React.useMemo(
    () => buildOwnerMap(data.residentsList, data.clientsList, effectiveBarilgiinId),
    [data.residentsList, data.clientsList, effectiveBarilgiinId],
  );

  const isOpen = plan !== null || results !== null || busy === "check";
  const close = () => {
    if (busy) return;
    setPlan(null);
    setResults(null);
    setErrors([]);
    setWarnings([]);
    setIncludeConflicts(false);
  };

  // ── Загвар татах ──────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!effectiveBarilgiinId) {
      openErrorOverlay("Барилга сонгоогүй байна.");
      return;
    }
    setBusy("template");
    try {
      const blob = await buildTemplate({
        turul,
        floors,
        getTootOptions: data.getTootOptions,
        ownerMap,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${turulNer(turul)} эзэмшигч загвар.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      if (floors[turul].length === 0) {
        openErrorOverlay(
          `Энэ барилгад ${turulNer(turul).toLowerCase()}${turul === "Зогсоол" ? "ийн" : "ын"} дугаар тохируулаагүй байна. Эхлээд тоот бүртгэлээс дугаар нэмнэ үү.`,
        );
      } else {
        openSuccessOverlay("Загвар татагдлаа");
      }
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  // ── Бүртгэлтэй хүнийг утсаар хайх ─────────────────────────────────
  const findExisting = async (utas: string): Promise<Existing | null> => {
    const match = (p: any) => personPhones(p).includes(utas);
    const localClient = (data.clientsList || []).find(match);
    if (localClient) {
      return { kind: "khariltsagch", id: String(localClient._id), name: personName(localClient), record: localClient };
    }
    const localResident = (data.residentsList || []).find(match);
    if (localResident) {
      return { kind: "orshinSuugch", id: String(localResident._id), name: personName(localResident), record: localResident };
    }
    // Жагсаалт зөвхөн энэ барилгынх — байгууллагын хэмжээнд хайна (зөвхөн уншина)
    const params = { baiguullagiinId, search: utas, khuudasniiKhemjee: 20 };
    const [kResp, oResp] = await Promise.all([
      uilchilgee(token || "").get("/khariltsagch", { params }),
      uilchilgee(token || "").get("/orshinSuugch", { params }),
    ]);
    const k = (kResp?.data?.jagsaalt || []).find(match);
    if (k) return { kind: "khariltsagch", id: String(k._id), name: personName(k), record: k };
    const o = (oResp?.data?.jagsaalt || []).find(match);
    if (o) return { kind: "orshinSuugch", id: String(o._id), name: personName(o), record: o };
    return null;
  };

  // ── Файл сонгосны дараа: задлах → шалгах → урьдчилан харах ────────
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!token || !baiguullagiinId || !effectiveBarilgiinId) {
      openErrorOverlay("Байгууллага эсвэл барилга сонгоогүй байна.");
      return;
    }
    setBusy("check");
    setResults(null);
    try {
      const parsed = await parseWorkbook(file, {
        defaultTurul: turul,
        getTootOptions: data.getTootOptions,
        floors,
      });
      const items: PlanItem[] = parsed.groups.map((group) => ({
        group,
        existing: null,
        newUnits: [],
        alreadyOwn: [],
        conflicts: [],
      }));

      const lookupErrors: RowIssue[] = [];
      await runPool(items, 4, async (item) => {
        try {
          item.existing = await findExisting(item.group.utas);
        } catch (err) {
          item.skipReason = `Утсаар хайхад алдаа: ${getErrorMessage(err)}`;
          lookupErrors.push({ row: item.group.rows[0], message: item.skipReason });
        }
      });

      items.forEach((item) => {
        const ex = item.existing;
        const ownKeys = new Set(
          ex
            ? personUnits(ex.record, effectiveBarilgiinId).map((u: any) =>
                unitKey(tootTurulAngilal(u.turul), u.davkhar, u.toot),
              )
            : [],
        );
        item.group.units.forEach((u) => {
          const key = unitKey(u.turul, u.davkhar, u.toot);
          const owner = ownerMap.get(key);
          if (ownKeys.has(key) || (owner && ex && owner.id === ex.id)) item.alreadyOwn.push(u);
          else if (owner) item.conflicts.push({ unit: u, owner });
          else item.newUnits.push(u);
        });
        if (ex?.kind === "orshinSuugch" && ex.record?.undsenId) {
          item.skipReason = "Гэр бүлийн гишүүн — үндсэн эзэмшигч дээр нь гараар нэмнэ үү";
        }
      });

      setErrors([...parsed.errors, ...lookupErrors].sort((a, b) => a.row - b.row));
      setWarnings(parsed.warnings);
      setPlan(items);
      if (parsed.dataRows === 0 && parsed.errors.length === 0) {
        setErrors([{ row: 0, message: "Оруулах мөр олдсонгүй (жишээ мөрүүдийг оруулахгүй)." }]);
      }
    } catch (err) {
      openErrorOverlay(`Файл уншихад алдаа гарлаа: ${getErrorMessage(err)}`);
      setPlan(null);
    } finally {
      setBusy(null);
    }
  };

  const unitsToSend = (item: PlanItem) => [
    ...item.newUnits,
    ...(includeConflicts ? item.conflicts.map((c) => c.unit) : []),
  ];

  const toTootObj = (u: ParsedUnit) => ({
    orts: "1",
    davkhar: u.davkhar,
    toot: u.toot,
    turul: turulToToot(u.turul),
    ekhniiUldegdel: 0,
    tsahilgaaniiZaalt: 0,
    khonogoorBodokhEsekh: false,
    bodokhKhonog: 0,
    baiguullagiinId,
    barilgiinId: effectiveBarilgiinId,
  });

  /** Хуучин toots + шинэ (давхардлыг алгасна). Хуучныг хэзээ ч хасахгүй. */
  const mergeToots = (oldToots: any[], add: ParsedUnit[]) => {
    const key = (t: any) =>
      `${String(t.barilgiinId || effectiveBarilgiinId)}|${unitKey(tootTurulAngilal(t.turul), t.davkhar, t.toot)}`;
    const seen = new Set(oldToots.map(key));
    const added: ParsedUnit[] = [];
    const merged = [...oldToots];
    add.forEach((u) => {
      const obj = toTootObj(u);
      const k = key(obj);
      if (!seen.has(k)) {
        seen.add(k);
        merged.push(obj);
        added.push(u);
      }
    });
    return { merged, added };
  };

  const runOne = async (item: PlanItem): Promise<ResultItem> => {
    const g = item.group;
    const ex = item.existing;
    const name = ex?.name || [g.ovog, g.ner].filter(Boolean).join(" ");
    const base = { name, utas: g.utas };
    if (item.skipReason) return { ...base, status: "skipped", message: item.skipReason };
    const units = unitsToSend(item);

    try {
      // 1) Шинэ харилцагч — «Харилцагч нэмэх» модалын payload
      if (!ex) {
        if (units.length === 0) {
          return { ...base, status: "skipped", message: "Нэмэх сул дугаар алга" };
        }
        const unitObjs = units.map(toTootObj);
        const primary = unitObjs[0];
        const resp = await uilchilgee(token || "").post("/khariltsagch", {
          ovog: g.ovog,
          ner: g.ner,
          register: "",
          utas: g.utas,
          khayag: "",
          aimag: "Улаанбаатар",
          duureg: "",
          horoo: "",
          turul: "Үндсэн",
          tailbar: g.tailbar,
          gadnaZogsoolEsekh: false,
          mashiniiDugaar: g.plates.join(", "),
          units: unitObjs,
          orts: primary.orts,
          davkhar: primary.davkhar,
          toot: primary.toot,
          ekhniiUldegdel: 0,
          tsahilgaaniiZaalt: 0,
          khonogoorBodokhEsekh: false,
          bodokhKhonog: 0,
          baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        });
        const sanuulga = resp?.data?.mashiniiSanuulga;
        return {
          ...base,
          status: "ok",
          message: `Шинэ харилцагч: ${units.map(unitLabel).join(", ")}${sanuulga ? ` · Машин: ${sanuulga}` : ""}`,
        };
      }

      // 2) Бүртгэлтэй хүн — хамгийн сүүлийн toots-ыг татаж, дээр нь нэмнэ
      const path = ex.kind === "khariltsagch" ? "/khariltsagch" : "/orshinSuugch";
      const fresh = (await uilchilgee(token || "").get(`${path}/${ex.id}`))?.data;
      if (!fresh?._id) return { ...base, status: "failed", message: "Бүртгэл олдсонгүй" };
      const oldToots = Array.isArray(fresh.toots) ? fresh.toots : [];
      const { merged, added } = mergeToots(oldToots, units);

      if (ex.kind === "khariltsagch") {
        const oldPlates: string[] = Array.isArray(ex.record?.mashinuud)
          ? ex.record.mashinuud.map((m: any) => String(m || "").trim())
          : String(ex.record?.mashiniiDugaar || "")
              .split(",")
              .map((s) => s.trim());
        const plateSet = oldPlates.filter(Boolean);
        const newPlates = g.plates.filter((p) => !plateSet.includes(p));
        if (added.length === 0 && newPlates.length === 0) {
          return { ...base, status: "skipped", message: "Бүх дугаар аль хэдийн бүртгэлтэй" };
        }
        const body: any = { units: merged };
        if (newPlates.length > 0) body.mashiniiDugaar = [...plateSet, ...newPlates].join(", ");
        const resp = await uilchilgee(token || "").put(`/khariltsagch/${ex.id}`, body);
        const sanuulga = resp?.data?.mashiniiSanuulga;
        return {
          ...base,
          status: "ok",
          message: `Харилцагч дээр нэмэв: ${added.map(unitLabel).join(", ") || "—"}${
            newPlates.length ? ` · Машин: ${newPlates.join(", ")}` : ""
          }${sanuulga ? ` · ${sanuulga}` : ""}`,
        };
      }

      // Оршин суугч — ResidentModal-ийн хадгалдаг PUT /orshinSuugch/:id
      if (added.length === 0) {
        return { ...base, status: "skipped", message: "Бүх дугаар аль хэдийн бүртгэлтэй" };
      }
      await uilchilgee(token || "").put(`/orshinSuugch/${ex.id}`, { units: merged });
      return {
        ...base,
        status: "ok",
        message: `Оршин суугч дээр нэмэв: ${added.map(unitLabel).join(", ")}${
          g.plates.length ? " · Машины дугаарыг оршин суугчийн цонхноос гараар нэмнэ үү" : ""
        }`,
      };
    } catch (err: any) {
      const msg = err?.response?.data?.aldaa || err?.response?.data?.error || getErrorMessage(err);
      return { ...base, status: "failed", message: String(msg) };
    }
  };

  const handleRun = async () => {
    if (!plan) return;
    setBusy("run");
    setProgress({ done: 0, total: plan.length });
    const out: ResultItem[] = [];
    // Дараалан — нэг дугаарыг хоёр хүсэлт зэрэг авахаас сэргийлнэ
    for (const item of plan) {
      out.push(await runOne(item));
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setBusy(null);
    setPlan(null);
    setResults(out);
    mutate(
      (key: any) =>
        Array.isArray(key) &&
        (key[0] === "/khariltsagch" || key[0] === "/orshinSuugch" || key[0] === "/geree"),
      undefined,
      { revalidate: true },
    );
  };

  // ── Тоо баримт ────────────────────────────────────────────────────
  const summary = React.useMemo(() => {
    if (!plan) return null;
    const active = plan.filter((p) => !p.skipReason);
    const sendCount = (p: PlanItem) =>
      p.newUnits.length + (includeConflicts ? p.conflicts.length : 0);
    const shine = active.filter((p) => !p.existing && sendCount(p) > 0);
    const khuuchin = active.filter((p) => p.existing && sendCount(p) > 0);
    return {
      shineToo: shine.length,
      shineUnits: shine.reduce((s, p) => s + sendCount(p), 0),
      khuuchinToo: khuuchin.length,
      khuuchinUnits: khuuchin.reduce((s, p) => s + sendCount(p), 0),
      conflicts: plan.flatMap((p) => p.conflicts.map((c) => ({ ...c, group: p.group }))),
      alreadyOwn: plan.reduce((s, p) => s + p.alreadyOwn.length, 0),
      skipped: plan.filter((p) => p.skipReason),
      canRun: plan.some((p) => !p.skipReason && (sendCount(p) > 0 || (p.existing?.kind === "khariltsagch" && p.group.plates.length > 0))),
    };
  }, [plan, includeConflicts]);

  const btnLabel = turul === "Зогсоол" ? "Гаражийн" : "Агуулахын";

  return (
    <>
      <button
        onClick={handleDownload}
        className="btn-minimal h-10"
        id={`${idPrefix}units-owner-download-template-btn`}
        aria-label="Загвар татах"
        title={`${btnLabel} эзэмшигчийн Excel загвар татах`}
        disabled={!!busy}
      >
        <FileDown className="w-5 h-5" />
        <span className="hidden sm:inline text-xs ml-1">Загвар татах</span>
      </button>
      <button
        onClick={() => inputRef.current?.click()}
        className="btn-minimal h-10"
        id={`${idPrefix}units-owner-upload-template-btn`}
        aria-label="Excel-ээс импортлох"
        title={`${btnLabel} эзэмшигчийг Excel-ээс оруулах`}
        disabled={!!busy}
      >
        <FileUp className="w-5 h-5" />
        <span className="hidden sm:inline text-xs ml-1">Загвар оруулах</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onFileChange}
      />

      {isOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={close} />
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-[640px] max-h-[85vh] flex flex-col rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] shadow-2xl text-sm text-[color:var(--panel-text)]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--surface-border)]">
                <h3 className="text-base font-normal">
                  {results ? "Оруулсан үр дүн" : `${btnLabel} эзэмшигч оруулах`}
                </h3>
                <button
                  type="button"
                  onClick={close}
                  disabled={!!busy}
                  className="p-1 rounded-lg text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                  aria-label="Хаах"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {busy === "check" && (
                  <p className="text-[color:var(--muted-text)]">Файлыг шалгаж байна...</p>
                )}

                {busy === "run" && (
                  <p className="text-[color:var(--muted-text)]">
                    Бүртгэж байна... {progress.done}/{progress.total}
                  </p>
                )}

                {plan && summary && busy !== "run" && (
                  <>
                    <ul className="space-y-1">
                      <li>
                        Шинэ харилцагч: <span className="text-[color:var(--theme)]">{summary.shineToo}</span>
                        <span className="text-[color:var(--muted-text)]"> ({summary.shineUnits} дугаар)</span>
                      </li>
                      <li>
                        Бүртгэлтэй хүнд нэмэх: <span className="text-[color:var(--theme)]">{summary.khuuchinToo}</span>
                        <span className="text-[color:var(--muted-text)]"> хүн, {summary.khuuchinUnits} дугаар</span>
                      </li>
                      {summary.alreadyOwn > 0 && (
                        <li className="text-[color:var(--muted-text)]">
                          Аль хэдийн тухайн хүн дээр бүртгэлтэй тул алгасах: {summary.alreadyOwn} дугаар
                        </li>
                      )}
                      <li className={errors.length ? "text-red-500" : "text-[color:var(--muted-text)]"}>
                        Алдаатай мөр: {errors.length} (оруулахгүй)
                      </li>
                    </ul>

                    {plan.some((p) => p.existing) && (
                      <Section title="Бүртгэлтэй хүмүүс">
                        {plan
                          .filter((p) => p.existing)
                          .map((p) => (
                            <li key={p.group.utas}>
                              {p.existing!.name} · {p.group.utas} ·{" "}
                              <span className="text-[color:var(--muted-text)]">
                                {p.existing!.kind === "khariltsagch" ? "харилцагч" : "оршин суугч"}
                                {p.newUnits.length > 0 && ` · +${p.newUnits.map(unitLabel).join(", ")}`}
                              </span>
                            </li>
                          ))}
                      </Section>
                    )}

                    {summary.conflicts.length > 0 && (
                      <Section title="Анхааруулга: өөр хүн эзэмшдэг дугаар" tone="warn">
                        {summary.conflicts.map((c) => (
                          <li key={`${c.group.utas}-${unitKey(c.unit.turul, c.unit.davkhar, c.unit.toot)}`}>
                            Мөр {c.unit.row}: {unitLabel(c.unit)} — одоо {c.owner.name}
                            {c.owner.kind === "orshinSuugch" ? " (оршин суугч)" : " (харилцагч)"} эзэмшдэг
                          </li>
                        ))}
                        <label className="flex items-center gap-2 pt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeConflicts}
                            onChange={(e) => setIncludeConflicts(e.target.checked)}
                          />
                          <span>Эдгээр дугаарыг ч гэсэн нэмэх (хуучин эзэмшигчээс хасахгүй)</span>
                        </label>
                      </Section>
                    )}

                    {summary.skipped.length > 0 && (
                      <Section title="Алгасах" tone="warn">
                        {summary.skipped.map((p) => (
                          <li key={p.group.utas}>
                            {p.group.utas}: {p.skipReason}
                          </li>
                        ))}
                      </Section>
                    )}

                    {warnings.length > 0 && (
                      <Section title="Анхааруулга" tone="warn">
                        {warnings.map((w, i) => (
                          <li key={i}>Мөр {w.row}: {w.message}</li>
                        ))}
                      </Section>
                    )}

                    {errors.length > 0 && (
                      <Section title="Алдаатай мөрүүд" tone="error">
                        {errors.map((er, i) => (
                          <li key={i}>
                            {er.row > 0 ? `Мөр ${er.row}: ` : ""}
                            {er.message}
                          </li>
                        ))}
                      </Section>
                    )}
                  </>
                )}

                {results && (
                  <>
                    <p>
                      Амжилттай: <span className="text-[color:var(--theme)]">{results.filter((r) => r.status === "ok").length}</span>
                      {" · "}Алгассан: {results.filter((r) => r.status === "skipped").length}
                      {" · "}
                      <span className={results.some((r) => r.status === "failed") ? "text-red-500" : ""}>
                        Алдаа: {results.filter((r) => r.status === "failed").length}
                      </span>
                    </p>
                    <ul className="space-y-1.5">
                      {results.map((r, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-[color:var(--surface-border)] px-3 py-2"
                        >
                          <span
                            className={
                              r.status === "ok"
                                ? "text-[color:var(--theme)]"
                                : r.status === "failed"
                                  ? "text-red-500"
                                  : "text-[color:var(--muted-text)]"
                            }
                          >
                            {r.status === "ok" ? "Амжилттай" : r.status === "failed" ? "Алдаа" : "Алгассан"}
                          </span>
                          {" · "}
                          {r.name || "—"} · {r.utas}
                          <div className="text-[color:var(--muted-text)]">{r.message}</div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 px-5 py-4 border-t border-[color:var(--surface-border)]">
                {plan && (
                  <>
                    <button type="button" className="stg-btn stg-btn-ghost" onClick={close} disabled={!!busy}>
                      Болих
                    </button>
                    <button
                      type="button"
                      className="stg-btn stg-btn-primary"
                      onClick={handleRun}
                      disabled={!!busy || !summary?.canRun}
                    >
                      {busy === "run" ? "Оруулж байна..." : "Оруулах"}
                    </button>
                  </>
                )}
                {results && (
                  <button type="button" className="stg-btn stg-btn-primary" onClick={close}>
                    Хаах
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "warn" | "error";
  children: React.ReactNode;
}) {
  const color =
    tone === "error" ? "text-red-500" : tone === "warn" ? "text-amber-600" : "text-[color:var(--panel-text)]";
  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] p-3">
      <div className={`mb-1.5 ${color}`}>{title}</div>
      <ul className="space-y-1 text-[color:var(--panel-text)] max-h-48 overflow-y-auto">{children}</ul>
    </div>
  );
}
