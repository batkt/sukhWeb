/**
 * Зогсоол / Агуулахын эзэмшигчийн Excel загвар ба импортын цэвэр логик.
 *
 * DB-д юу ч бичихгүй: загвар үүсгэх, файлыг задлах, шалгах, хүмүүсээр
 * бүлэглэх л үүрэгтэй. Хадгалалтыг `ZogsoolAguulakhExcel.tsx` нь
 * "Харилцагч нэмэх" модалын ашигладаг ЯГ тэр API-гаар (POST/PUT
 * /khariltsagch, PUT /orshinSuugch/:id) хийнэ.
 */
import { dugaarZuvEsekh, mashiniiDugaarTseverle } from "@/lib/mashiniiDugaar";

export type EzemshikhTurul = "Зогсоол" | "Агуулах";
/** Хэрэглэгчид харуулах нэр — "Зогсоол" нь дотоод утга, дэлгэц/Excel-д "Гараж". */
export const turulNer = (t: string) => (t === "Зогсоол" ? "Гараж" : t);
/** Backend-ийн `toots[].turul` дээр хадгалагддаг утга. */
export type TootTurul = "Гараж" | "Агуулах";

export type GetTootOptions = (
  orts: string,
  floor: string,
  turul?: "Тоот" | "Зогсоол" | "Агуулах",
) => string[];

export const SHEET_NAME = "Бүртгэл";
export const JISHEE_TEMDEG = "ЖИШЭЭ";

export const turulToToot = (t: EzemshikhTurul): TootTurul =>
  t === "Зогсоол" ? "Гараж" : "Агуулах";

/** `toots[].turul` → табын төрөл (KhariltsagchModal.isTootOccupied-тэй ижил). */
export function tootTurulAngilal(raw: any): EzemshikhTurul | "Тоот" {
  const t = String(raw || "Орон сууц").trim().toLowerCase();
  if (["гараж", "гараш", "зогсоол", "parking", "garage"].includes(t)) return "Зогсоол";
  if (["агуулах", "storage"].includes(t)) return "Агуулах";
  return "Тоот";
}

export const digitsOnly = (v: any) => String(v ?? "").replace(/\D/g, "");

/** getTootOptions-той ижил цэвэрлэгээ */
export const normalizeToot = (v: any) =>
  String(v ?? "")
    .trim()
    .replace(/[^0-9A-Za-zА-Яа-яӨөҮүёЁ-]/g, "");

/** Хүний бүх утас (string эсвэл массив) — зөвхөн цифр */
export function personPhones(p: any): string[] {
  const list = Array.isArray(p?.utas) ? p.utas : [p?.utas];
  return list.map(digitsOnly).filter(Boolean);
}

export function personName(p: any): string {
  return [p?.ovog, p?.ner].filter(Boolean).join(" ").trim() || "Нэргүй";
}

/** Хүний тухайн барилга дахь нэгжүүд (toots эсвэл хуучин top-level талбар). */
export function personUnits(p: any, barilgiinId?: string): any[] {
  const units =
    Array.isArray(p?.toots) && p.toots.length > 0
      ? p.toots
      : [{ orts: p?.orts, davkhar: p?.davkhar, toot: p?.toot, turul: p?.turul, barilgiinId: p?.barilgiinId }];
  return units.filter(
    (u: any) =>
      u?.toot &&
      (!barilgiinId || !u.barilgiinId || String(u.barilgiinId) === String(barilgiinId)),
  );
}

export const unitKey = (turul: EzemshikhTurul | "Тоот", davkhar: any, toot: any) =>
  `${turul}|${String(davkhar ?? "").trim().toLowerCase()}|${normalizeToot(toot).toLowerCase()}`;

// ── Давхар / дугаарын тохиргоо ─────────────────────────────────────────

/** Кирилл "В"-г латин "B" болгож, том үсгээр */
export const normalizeFloor = (v: any) =>
  String(v ?? "")
    .trim()
    .replace(/^[ВвBb]/, "B")
    .toUpperCase();

export function tootOptions(
  getTootOptions: GetTootOptions,
  davkhar: string,
  turul: EzemshikhTurul,
): string[] {
  // Модалтай адил "1" орцоор, орцгүй тохиргоонд "" -ээр нөхнө.
  const a = getTootOptions("1", davkhar, turul);
  const b = getTootOptions("", davkhar, turul);
  return Array.from(new Set([...a, ...b]));
}

/** Тухайн төрлийн дугаар тохируулсан давхрууд */
export function floorsFor(
  selectedBarilga: any,
  davkharOptions: string[],
  getTootOptions: GetTootOptions,
  turul: EzemshikhTurul,
): string[] {
  const tokhirgoo = selectedBarilga?.tokhirgoo || {};
  const map =
    turul === "Зогсоол" ? tokhirgoo.davkhariinZogsoolnuud : tokhirgoo.davkhariinAguulakhnuud;
  const set = new Set<string>();
  if (map && typeof map === "object" && !Array.isArray(map)) {
    Object.keys(map).forEach((k) => {
      const parts = String(k).split("::");
      const f = String(parts[parts.length - 1] || "").trim();
      if (f) set.add(f);
    });
  }
  if (turul === "Зогсоол" && Array.isArray(tokhirgoo.davkhar)) {
    tokhirgoo.davkhar.forEach((it: any) => {
      const f = String(it?.davkhar ?? it ?? "").trim();
      if (/^b/i.test(f)) set.add(f);
    });
  }
  (davkharOptions || []).forEach((d) => {
    const f = String(d || "").trim();
    if (/^B\d+$/i.test(f)) set.add(f);
  });
  return Array.from(set)
    .filter((f) => tootOptions(getTootOptions, f, turul).length > 0)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// ── Эзэмшлийн зураглал ────────────────────────────────────────────────

export type Ezen = {
  id: string;
  kind: "khariltsagch" | "orshinSuugch";
  name: string;
  phones: string[];
};

/** unitKey → эзэмшигч (одоогийн барилгын жагсаалтаас) */
export function buildOwnerMap(
  residents: any[],
  clients: any[],
  barilgiinId?: string,
): Map<string, Ezen> {
  const out = new Map<string, Ezen>();
  const add = (list: any[], kind: Ezen["kind"]) =>
    (list || []).forEach((p) => {
      if (!p?._id) return;
      const ezen: Ezen = { id: String(p._id), kind, name: personName(p), phones: personPhones(p) };
      personUnits(p, barilgiinId).forEach((u) => {
        const key = unitKey(tootTurulAngilal(u.turul), u.davkhar, u.toot);
        if (!out.has(key)) out.set(key, ezen);
      });
    });
  add(clients, "khariltsagch");
  add(residents, "orshinSuugch");
  return out;
}

// ── Загвар ─────────────────────────────────────────────────────────────

export async function buildTemplate(opts: {
  turul: EzemshikhTurul;
  floors: Record<EzemshikhTurul, string[]>;
  getTootOptions: GetTootOptions;
  ownerMap: Map<string, Ezen>;
  barilgaNer?: string;
}): Promise<Blob> {
  const { turul, floors, getTootOptions, ownerMap } = opts;
  const ExcelJSMod: any = await import("exceljs");
  const ExcelJS = ExcelJSMod.default || ExcelJSMod;
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet(SHEET_NAME, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Овог", key: "ovog", width: 16 },
    { header: "Нэр*", key: "ner", width: 18 },
    { header: "Утас*", key: "utas", width: 14, style: { numFmt: "@" } },
    { header: "Төрөл*", key: "turul", width: 12 },
    { header: "Давхар*", key: "davkhar", width: 10 },
    { header: "Дугаар*", key: "dugaar", width: 18, style: { numFmt: "@" } },
    { header: "Машины дугаар", key: "mashin", width: 22 },
    { header: "Тайлбар", key: "tailbar", width: 24 },
  ];
  const COLS = 8;
  const header = ws.getRow(1);
  header.height = 26;
  for (let c = 1; c <= COLS; c++) {
    const cell = header.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF047857" } },
      left: { style: "thin", color: { argb: "FF047857" } },
      bottom: { style: "thin", color: { argb: "FF047857" } },
      right: { style: "thin", color: { argb: "FF047857" } },
    };
  }

  // Жишээ мөрүүд — бодит тохиргооноос дугаар авна
  const f0 = floors[turul][0] || "B1";
  const opts0 = tootOptions(getTootOptions, f0, turul);
  const ex1 = opts0.slice(0, 2).join(", ") || "12, 13";
  const ex2 = opts0[2] || opts0[0] || "14";
  const examples = [
    { ovog: "Бат", ner: "Жишээ Болд", utas: "99112233", turul: turulNer(turul), davkhar: f0, dugaar: ex1, mashin: "1234УБА, 5678УНА", tailbar: JISHEE_TEMDEG },
    { ovog: "Бат", ner: "Жишээ Болд", utas: "99112233", turul: turulNer(turul), davkhar: f0, dugaar: ex2, mashin: "", tailbar: JISHEE_TEMDEG },
  ];
  examples.forEach((r) => {
    const row = ws.addRow(r);
    for (let c = 1; c <= COLS; c++) {
      row.getCell(c).font = { italic: true, color: { argb: "FF9CA3AF" } };
    }
  });

  // Сонголтын жагсаалтууд — нуусан хуудсанд
  const list = wb.addWorksheet("Жагсаалт", { state: "veryHidden" });
  const allFloors = Array.from(new Set([...floors["Зогсоол"], ...floors["Агуулах"]]));
  allFloors.forEach((f, i) => (list.getCell(i + 1, 1).value = f));

  const LAST = 1000;
  for (let r = 2; r <= LAST; r++) {
    ws.getCell(r, 4).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Гараж,Агуулах"'],
      showErrorMessage: true,
      errorTitle: "Төрөл",
      error: "Гараж эсвэл Агуулах сонгоно уу",
    };
    if (allFloors.length > 0) {
      ws.getCell(r, 5).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`'Жагсаалт'!$A$1:$A$${allFloors.length}`],
        showErrorMessage: true,
        errorTitle: "Давхар",
        error: "Жагсаалтаас давхар сонгоно уу",
      };
    }
  }

  // Заавар
  const z = wb.addWorksheet("Заавар");
  z.getColumn(1).width = 110;
  const lines = [
    "Гараж / Агуулахын эзэмшигч бүртгэх заавар",
    "",
    "1. «Бүртгэл» хуудсанд нэг мөрөнд нэг хүн бичнэ. Нэг хүн олон дугаартай бол:",
    "   • нэг мөрөнд «Дугаар» баганад таслалаар бичнэ, жишээ нь: 12, 13, 14",
    "   • эсвэл ижил утастай хэд хэдэн мөр бичнэ. Хоёулаа бүх дугаарыг тэр нэг хүнд холбоно.",
    "2. Утас — 8 оронтой тоо. Хүнийг утсаар нь танина.",
    "3. Төрөл — «Гараж» эсвэл «Агуулах». Хоосон орхивол Excel-ийг оруулж буй цэсний төрлөөр бүртгэнэ.",
    "4. Давхар — жагсаалтаас сонгоно (жишээ нь B1). Дугаар нь тухайн давхарт тохируулагдсан байх ёстой.",
    "5. Машины дугаар — заавал биш. Олон бол таслалаар: 1234УБА, 5678УНА (4 тоо + 3 үсэг).",
    "6. Саарал налуу үсэгтэй, Тайлбар нь «ЖИШЭЭ» мөрүүдийг оруулахгүй. Устгаад эсвэл дээр нь бичээд ашиглана уу.",
    "",
    "Оруулахад юу болох вэ:",
    "   • Утас системд бүртгэлгүй бол ШИНЭ харилцагч үүсгэж, дугааруудыг нь холбоно («Харилцагч нэмэх»-тэй адил, гэрээ автоматаар үүснэ).",
    "   • Утас бүртгэлтэй бол (харилцагч эсвэл оршин суугч) Excel-ийн дугааруудыг тухайн хүний одоо байгаа дугаар дээр НЭМНЭ. Хуучин дугаарыг хасахгүй.",
    "   • Өөр хүн эзэмшдэг дугаарыг анхааруулга болгон харуулна.",
    "   • Оруулахаас өмнө шалгалтын цонх гарч, алдаатай мөрүүдийг мөрийн дугаартай нь харуулна.",
    "",
    "«Сул дугаар» хуудсанд давхар бүрийн одоогоор эзэмшигчгүй дугааруудыг харуулав.",
  ];
  lines.forEach((t, i) => {
    const cell = z.getCell(i + 1, 1);
    cell.value = t;
    cell.alignment = { wrapText: true, vertical: "top" };
    if (i === 0) cell.font = { bold: true, size: 13 };
    if (t === "Оруулахад юу болох вэ:") cell.font = { bold: true };
  });

  // Сул дугаар
  const s = wb.addWorksheet("Сул дугаар");
  s.columns = [
    { header: "Төрөл", key: "turul", width: 12 },
    { header: "Давхар", key: "davkhar", width: 10 },
    { header: "Сул", key: "too", width: 8 },
    { header: "Сул дугаарууд", key: "sul", width: 90 },
  ];
  for (let c = 1; c <= 4; c++) {
    const cell = s.getRow(1).getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  }
  const order: EzemshikhTurul[] = turul === "Зогсоол" ? ["Зогсоол", "Агуулах"] : ["Агуулах", "Зогсоол"];
  order.forEach((t) =>
    floors[t].forEach((f) => {
      const sul = tootOptions(getTootOptions, f, t).filter((d) => !ownerMap.has(unitKey(t, f, d)));
      const row = s.addRow({ turul: turulNer(t), davkhar: f, too: sul.length, sul: sul.join(", ") });
      row.getCell(4).alignment = { wrapText: true, vertical: "top" };
    }),
  );

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// ── Импорт: задлах, шалгах ────────────────────────────────────────────

export type RowIssue = { row: number; message: string };

export type ParsedUnit = { turul: EzemshikhTurul; davkhar: string; toot: string; row: number };

export type PersonGroup = {
  utas: string;
  ovog: string;
  ner: string;
  tailbar: string;
  rows: number[];
  units: ParsedUnit[];
  plates: string[];
};

const headerKey = (v: any) => String(v ?? "").replace(/\*/g, "").trim().toLowerCase();

const COLUMN_ALIASES: Record<string, string[]> = {
  ovog: ["овог"],
  ner: ["нэр"],
  utas: ["утас", "утасны дугаар"],
  turul: ["төрөл"],
  davkhar: ["давхар"],
  dugaar: ["дугаар", "зогсоолын дугаар", "агуулахын дугаар", "тоот"],
  mashin: ["машины дугаар", "улсын дугаар"],
  tailbar: ["тайлбар"],
};

function parseTurul(v: string, fallback: EzemshikhTurul): EzemshikhTurul | null {
  const t = v.trim().toLowerCase();
  if (!t) return fallback;
  if (["зогсоол", "гараж", "гараш", "parking", "garage"].includes(t)) return "Зогсоол";
  if (["агуулах", "storage"].includes(t)) return "Агуулах";
  return null;
}

export async function parseWorkbook(
  file: File,
  opts: {
    defaultTurul: EzemshikhTurul;
    getTootOptions: GetTootOptions;
    floors: Record<EzemshikhTurul, string[]>;
  },
): Promise<{ groups: PersonGroup[]; errors: RowIssue[]; warnings: RowIssue[]; dataRows: number }> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName = wb.SheetNames.find((n) => n.trim() === SHEET_NAME) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];
  if (!ws || !ws["!ref"]) return { groups: [], errors: [{ row: 0, message: "Excel хоосон байна" }], warnings, dataRows: 0 };

  const startRow = XLSX.utils.decode_range(ws["!ref"]).s.r; // 0-based
  const grid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "", blankrows: true });

  const headerIdx = grid.findIndex((r) => r.some((c) => headerKey(c) === "нэр"));
  if (headerIdx < 0) {
    return {
      groups: [],
      errors: [{ row: 0, message: "«Нэр» баганатай толгой мөр олдсонгүй. Шинэ загвар татаж ашиглана уу." }],
      warnings,
      dataRows: 0,
    };
  }
  const col: Record<string, number> = {};
  grid[headerIdx].forEach((c, i) => {
    const k = headerKey(c);
    Object.entries(COLUMN_ALIASES).forEach(([field, names]) => {
      if (col[field] === undefined && names.includes(k)) col[field] = i;
    });
  });
  const missing = ["ner", "utas", "davkhar", "dugaar"].filter((f) => col[f] === undefined);
  if (missing.length > 0) {
    const label: Record<string, string> = { ner: "Нэр", utas: "Утас", davkhar: "Давхар", dugaar: "Дугаар" };
    return {
      groups: [],
      errors: [{ row: headerIdx + startRow + 1, message: `Багана дутуу: ${missing.map((m) => label[m]).join(", ")}` }],
      warnings,
      dataRows: 0,
    };
  }

  const get = (r: any[], f: string) => (col[f] === undefined ? "" : String(r[col[f]] ?? "").trim());
  const byPhone = new Map<string, PersonGroup>();
  /** Excel дотор нэг дугаарыг хоёр өөр хүнд өгсөн эсэх */
  const unitOwnerInFile = new Map<string, { utas: string; row: number }>();
  let dataRows = 0;

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const r = grid[i];
    const rowNo = i + startRow + 1;
    if (!r || r.every((c) => String(c ?? "").trim() === "")) continue;
    const ner = get(r, "ner");
    const tailbar = get(r, "tailbar");
    if (tailbar.toUpperCase() === JISHEE_TEMDEG || /^жишээ/i.test(ner)) continue;
    dataRows++;

    const rowErrors: string[] = [];
    const utas = digitsOnly(get(r, "utas"));
    if (!ner) rowErrors.push("Нэр хоосон");
    if (!utas) rowErrors.push("Утас хоосон");
    else if (utas.length !== 8) rowErrors.push(`Утас 8 оронтой байх ёстой («${get(r, "utas")}»)`);

    const turulRaw = get(r, "turul");
    const turul = parseTurul(turulRaw, opts.defaultTurul);
    if (!turul) rowErrors.push(`Төрөл буруу («${turulRaw}») — Гараж эсвэл Агуулах`);

    const davkharRaw = get(r, "davkhar");
    let davkhar = "";
    if (!davkharRaw) rowErrors.push("Давхар хоосон");
    else if (turul) {
      const match = opts.floors[turul].find((f) => normalizeFloor(f) === normalizeFloor(davkharRaw));
      if (!match) rowErrors.push(`«${davkharRaw}» давхарт ${turul.toLowerCase()}ын дугаар тохируулаагүй байна`);
      else davkhar = match;
    }

    const dugaarRaw = get(r, "dugaar");
    const dugaaruud = Array.from(
      new Set(dugaarRaw.split(/[,;\n]+/).map(normalizeToot).filter(Boolean)),
    );
    if (dugaaruud.length === 0) rowErrors.push("Дугаар хоосон");

    const units: ParsedUnit[] = [];
    if (turul && davkhar && dugaaruud.length > 0) {
      const valid = tootOptions(opts.getTootOptions, davkhar, turul);
      const validLower = new Map(valid.map((v) => [v.toLowerCase(), v]));
      const buruu: string[] = [];
      dugaaruud.forEach((d) => {
        const canon = validLower.get(d.toLowerCase());
        if (!canon) buruu.push(d);
        else units.push({ turul, davkhar, toot: canon, row: rowNo });
      });
      if (buruu.length > 0) rowErrors.push(`${davkhar} давхарт байхгүй дугаар: ${buruu.join(", ")}`);
    }

    const plates: string[] = [];
    const mashinRaw = get(r, "mashin");
    if (mashinRaw) {
      const buruu: string[] = [];
      mashinRaw
        .split(/[,;/\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => {
          const d = mashiniiDugaarTseverle(s);
          if (dugaarZuvEsekh(d)) plates.push(d);
          else buruu.push(s);
        });
      if (buruu.length > 0) rowErrors.push(`Машины дугаар буруу: ${buruu.join(", ")} (4 тоо + 3 үсэг)`);
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNo, message: rowErrors.join("; ") });
      continue;
    }

    // Excel дотор давхардсан дугаар
    const unitsOk: ParsedUnit[] = [];
    units.forEach((u) => {
      const key = unitKey(u.turul, u.davkhar, u.toot);
      const prev = unitOwnerInFile.get(key);
      if (prev && prev.utas !== utas) {
        errors.push({
          row: rowNo,
          message: `${u.turul} ${u.davkhar}-${u.toot} нь ${prev.row}-р мөрөнд өөр утастай хүнд бичигдсэн`,
        });
      } else if (!prev) {
        unitOwnerInFile.set(key, { utas, row: rowNo });
        unitsOk.push(u);
      }
    });

    // Бүх дугаар нь дээрх давхардлаар хасагдсан бол хүнийг бүлэгт нэмэхгүй
    if (unitsOk.length === 0 && plates.length === 0) continue;

    let g = byPhone.get(utas);
    if (!g) {
      g = { utas, ovog: get(r, "ovog"), ner, tailbar, rows: [], units: [], plates: [] };
      byPhone.set(utas, g);
    } else if (g.ner.toLowerCase() !== ner.toLowerCase()) {
      warnings.push({ row: rowNo, message: `Утас ${utas}: нэр өөр («${ner}»), эхний мөрийн «${g.ner}» нэрийг авлаа` });
    }
    if (!g.ovog) g.ovog = get(r, "ovog");
    if (!g.tailbar) g.tailbar = tailbar;
    g.rows.push(rowNo);
    g.units.push(...unitsOk);
    plates.forEach((p) => {
      if (!g!.plates.includes(p)) g!.plates.push(p);
    });
  }

  return { groups: Array.from(byPhone.values()), errors, warnings, dataRows };
}

/** Энгийн хязгаартай зэрэгцээ гүйцэтгэл */
export async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const item = items[idx++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}
