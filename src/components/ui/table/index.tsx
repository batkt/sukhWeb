"use client";

import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import Popup from "./Popup";
import Pagination from "./Pagination";
import Spin from "./Spin";

/* ------------------------------------------------------------------ *
 * Нийтлэг төрлүүд — antd Table-ийн гэрээтэй нийцтэй байхаар зохиосон. *
 * ------------------------------------------------------------------ */

export type SortOrder = "ascend" | "descend" | null;

export interface ColumnType<T = any> {
  key?: React.Key;
  dataIndex?: string | string[];
  title?: React.ReactNode | ((props: any) => React.ReactNode);
  width?: number | string;
  align?: "left" | "right" | "center";
  fixed?: "left" | "right" | boolean;
  ellipsis?: boolean;
  className?: string;
  sorter?:
    | boolean
    | ((a: T, b: T) => number)
    | { compare?: (a: T, b: T) => number; multiple?: number };
  sortOrder?: SortOrder;
  defaultSortOrder?: Exclude<SortOrder, null>;
  filters?: { text: React.ReactNode; value: any }[];
  filterDropdown?: React.ReactNode | ((props: any) => React.ReactNode);
  onFilter?: (value: any, record: T) => boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  children?: ColumnType<T>[];
  onCell?: (record: T, index?: number) => Record<string, any>;
  onHeaderCell?: (column: ColumnType<T>) => Record<string, any>;
  [key: string]: any;
}

export type ColumnsType<T = any> = ColumnType<T>[];

export interface TablePaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  defaultCurrent?: number;
  defaultPageSize?: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: (string | number)[];
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  size?: "small" | "middle" | "large";
  [key: string]: any;
}

export interface RowSelection<T = any> {
  type?: "checkbox" | "radio";
  selectedRowKeys?: React.Key[];
  onChange?: (keys: React.Key[], rows: T[]) => void;
  getCheckboxProps?: (record: T) => { disabled?: boolean; [k: string]: any };
  [key: string]: any;
}

export interface TableProps<T = any> {
  columns?: ColumnsType<T>;
  dataSource?: T[];
  rowKey?: string | ((record: T, index: number) => React.Key);
  loading?: boolean | { spinning?: boolean; tip?: React.ReactNode };
  pagination?: false | TablePaginationConfig;
  rowSelection?: RowSelection<T>;
  scroll?: { x?: number | string | true; y?: number | string };
  summary?: (rows: readonly T[]) => React.ReactNode;
  expandable?: {
    expandedRowRender?: (record: T, index: number) => React.ReactNode;
    rowExpandable?: (record: T) => boolean;
    [k: string]: any;
  };
  expandedRowRender?: (record: T, index: number) => React.ReactNode;
  onRow?: (record: T, index: number) => Record<string, any>;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
  size?: "small" | "middle" | "large";
  bordered?: boolean;
  title?: (rows: readonly T[]) => React.ReactNode;
  footer?: (rows: readonly T[]) => React.ReactNode;
  rowClassName?: string | ((record: T, index: number) => string);
  className?: string;
  style?: React.CSSProperties;
  sticky?: boolean | Record<string, any>;
  components?: any;
  locale?: { emptyText?: React.ReactNode; [k: string]: any };
  showHeader?: boolean;
  tableLayout?: "auto" | "fixed";
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Хүснэгтийн их биеийг цонхны үлдсэн өндрөөр дүүргэнэ.
 *
 * Өмнө нь дэлгэц бүр `calc(100vh - 460px)` мэт ГАР тоо дамжуулдаг байсан тул
 * шүүлтүүр/картын өндөр өөр болмогц доор нь том хоосон зай үлддэг байв. Энд
 * бодит байрлалыг хэмжиж тооцдог тул дээр нь юу байхаас үл хамаарна.
 *
 * @param enabled  `scroll.y` гараар өгөгдөөгүй үед л ажиллана
 * @param rootRef  бүрдлийн үндэс (хуудаслалт/гарчгийг хамарна)
 * @param bodyRef  гүйдэг хэсэг
 */
function useFillViewportHeight(
  enabled: boolean,
  rootRef: React.RefObject<HTMLDivElement | null>,
  bodyRef: React.RefObject<HTMLDivElement | null>,
  deps: unknown[],
) {
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      setMaxHeight(undefined);
      return undefined;
    }
    const measure = () => {
      const root = rootRef.current;
      const body = bodyRef.current;
      if (!root || !body) return;
      const bodyRect = body.getBoundingClientRect();
      // Гарчиг + хуудаслалт + хөл нь их биеэс ГАДНА байдаг тул тэдний өндрийг
      // хасна. Энэ зөрүү maxHeight-аас хамаардаггүй тул тойрог үүсгэхгүй.
      const chrome = root.getBoundingClientRect().height - bodyRect.height;
      const next = Math.max(
        180,
        Math.round(window.innerHeight - bodyRect.top - chrome - 16),
      );
      // 1px-ээс бага хэлбэлзэлд төлөв шинэчилбэл ResizeObserver-тэй хамт
      // төгсгөлгүй давталт үүсгэнэ.
      setMaxHeight((prev) =>
        prev != null && Math.abs(prev - next) <= 1 ? prev : next,
      );
    };

    measure();
    window.addEventListener("resize", measure);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      // Их биеийг ӨӨРИЙГ нь ажиглавал maxHeight-ийн өөрчлөлт дахин хэмжилт
      // дуудаж давталт үүснэ — иймд зөвхөн дээд талын байрлалд нөлөөлөх
      // эцэг элементийг ажиглана.
      const parent = rootRef.current?.parentElement;
      if (parent) ro.observe(parent);
    }
    return () => {
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
    };
     
  }, [enabled, ...deps]);

  return maxHeight;
}

/* ----------------------------- туслахууд ----------------------------- */

function getValue(record: any, dataIndex?: string | string[]) {
  // antd гэрээ: dataIndex байхгүй бол render бүтэн мөрийг хүлээж авна
  if (dataIndex == null || dataIndex === "") return record;
  if (Array.isArray(dataIndex))
    return dataIndex.reduce((acc: any, k) => (acc == null ? acc : acc[k]), record);
  return record?.[dataIndex];
}

function getRowKey(
  record: any,
  index: number,
  rowKey?: string | ((record: any, index: number) => React.Key),
): React.Key {
  if (typeof rowKey === "function") return rowKey(record, index);
  const k = record?.[(rowKey as string) || "key"];
  return k !== undefined ? k : index;
}

function colKey(col: ColumnType, i: number): React.Key {
  return col.key != null
    ? col.key
    : Array.isArray(col.dataIndex)
      ? col.dataIndex.join(".")
      : col.dataIndex != null
        ? col.dataIndex
        : i;
}

function parseWidthPx(w?: number | string): number | null {
  if (typeof w === "number") return w;
  if (typeof w === "string") {
    const rem = w.match(/^([\d.]+)rem$/);
    if (rem) return parseFloat(rem[1]) * 16;
    const px = w.match(/^([\d.]+)px$/);
    if (px) return parseFloat(px[1]);
  }
  return null;
}

// Гарчиг ихэвчлэн <div>/<span> дотор ороосон байдаг тул өргөнийг тооцохын
// тулд хүүхдүүдийг тойрч текстийг нь сэргээнэ.
function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) return extractText((node.props as any)?.children);
  return "";
}

// Толгойн бичиг үргэлж нэг мөрөнд багтахыг баталгаажуулна: зарласан өргөн нь
// зөвхөн зөвлөмж бөгөөд гарчгийн текстээс нарийн байж болох тул шошгоны
// тооцоолсон өргөнөөр доод хязгаарыг тавина.
function headerMinWidth(col: ColumnType): number | undefined {
  const declared = parseWidthPx(col.width);
  const text = typeof col.title === "function" ? "" : extractText(col.title);
  if (!text) return declared ?? undefined;
  const textPx =
    text.length * 6.2 +
    18 +
    (col.sorter ? 14 : 0) +
    (col.filters || col.filterDropdown ? 14 : 0);
  return declared != null ? Math.max(declared, textPx) : textPx;
}

// Зарласан өргөнгүй багана `auto` хэвээр үлдэх ёстой: table-layout:fixed дээр
// бүх багана тогтмол өргөнтэй бол илүү зай хувь тэнцүүлэн тарааагдаж, № мэт
// нарийн багана дэлгэц бүрт өөр өргөнтэй харагддаг.
function sorterFn(col: ColumnType): (a: any, b: any) => number {
  if (typeof col.sorter === "function") return col.sorter;
  if (
    col.sorter &&
    typeof col.sorter === "object" &&
    typeof (col.sorter as any).compare === "function"
  )
    return (col.sorter as any).compare;
  return (a: any, b: any) => {
    const va = getValue(a, col.dataIndex);
    const vb = getValue(b, col.dataIndex);
    if (va == null) return -1;
    if (vb == null) return 1;
    if (typeof va === "number" && typeof vb === "number") return va - vb;
    return String(va).localeCompare(String(vb));
  };
}

/* --------------------------- шүүлтүүрийн цэс --------------------------- */

function FilterDropdown({
  col,
  active,
  onApply,
}: {
  col: ColumnType;
  active?: any[];
  onApply: (vals: any[]) => void;
}) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any[]>(active || []);

  const custom =
    typeof col.filterDropdown === "function" ||
    React.isValidElement(col.filterDropdown);

  return (
    <>
      <button
        type="button"
        aria-label="filter"
        ref={anchorRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "ml-1 inline-flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[hsl(var(--zt-accent))]",
          active && active.length
            ? "text-[hsl(var(--zt-primary))]"
            : "text-[hsl(var(--zt-muted-fg)/0.6)]",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
          <path d="M4 4h16l-6.4 8v6.2l-3.2 1.6V12L4 4Z" />
        </svg>
      </button>
      <Popup
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        placement="bottomRight"
      >
        {custom ? (
          typeof col.filterDropdown === "function" ? (
            (col.filterDropdown as any)({
              setSelectedKeys: setSelected,
              selectedKeys: selected,
              confirm: () => {
                onApply(selected);
                setOpen(false);
              },
              clearFilters: () => {
                setSelected([]);
                onApply([]);
                setOpen(false);
              },
            })
          ) : (
            col.filterDropdown
          )
        ) : (
          <div className="min-w-[9rem] p-2">
            <div className="max-h-52 overflow-auto">
              {(col.filters || []).map((f) => (
                <label
                  key={String(f.value)}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-[11px] hover:bg-[hsl(var(--zt-accent))]"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(f.value)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked
                          ? [...s, f.value]
                          : s.filter((x) => x !== f.value),
                      )
                    }
                    className="h-3.5 w-3.5 accent-[hsl(var(--zt-primary))]"
                  />
                  <span>{f.text}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-2 border-t border-[hsl(var(--zt-border))] pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelected([]);
                  onApply([]);
                  setOpen(false);
                }}
                className="text-[11px] text-[hsl(var(--zt-muted-fg))] hover:text-[hsl(var(--zt-fg))]"
              >
                Цэвэрлэх
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(selected);
                  setOpen(false);
                }}
                className="rounded bg-[hsl(var(--zt-primary))] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--zt-primary-fg))] hover:bg-[hsl(var(--zt-primary)/0.9)]"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </Popup>
    </>
  );
}

/* ----------------------------- нийлбэр мөр ----------------------------- */

function SummaryRow({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-t border-[hsl(var(--zt-border))] bg-[hsl(var(--zt-muted)/0.4)] font-medium",
        className,
      )}
    >
      {children}
    </tr>
  );
}

function SummaryCell({
  colSpan,
  align,
  className,
  children,
  fixed,
}: {
  index?: number;
  colSpan?: number;
  align?: "left" | "right" | "center";
  className?: string;
  children?: React.ReactNode;
  fixed?: "left" | "right" | boolean;
}) {
  const side = fixed === true ? "left" : fixed || undefined;
  return (
    <td
      colSpan={colSpan}
      style={side ? { position: "sticky", [side]: 0, zIndex: 1 } : undefined}
      className={cn(
        "px-2 py-1 text-[11px] leading-tight",
        align === "right" && "text-right",
        align === "center" && "text-center",
        side && "zt-summary-fixed",
        className,
      )}
    >
      {children}
    </td>
  );
}

const Summary = ({
  children,
}: {
  children?: React.ReactNode;
  /** antd-тэй нийцүүлэхийн тулд хүлээж авна; наалдац нь scroll.y-гээр тодорхойлогдоно. */
  fixed?: boolean | "top" | "bottom";
}) => <>{children}</>;
Summary.Row = SummaryRow;
Summary.Cell = SummaryCell;

/* ------------------------------- Хүснэгт ------------------------------- */

function Table<T extends object = any>({
  columns = [],
  dataSource = [],
  rowKey,
  loading,
  pagination,
  rowSelection,
  scroll,
  summary,
  expandable,
  expandedRowRender: expandedRowRenderProp,
  onRow,
  onChange: onTableChange,
  size = "small",
  bordered = true,
  title,
  footer,
  rowClassName,
  className,
  style,
  sticky, // хүлээж авна — scroll.y-тэй үед толгой нь өөрөө наалддаг
  components, // хүлээж авна, ашиглахгүй
  locale,
  showHeader = true,
  tableLayout,
}: TableProps<T>) {
  const small = size === "small" || size === "middle";
  const isLoading =
    typeof loading === "object" && loading !== null ? !!loading.spinning : !!loading;

  // Бүлэглэсэн толгойг (children-тэй багана) их биед зориулж навч багана болгон
  // задална. Навчны индекс доорх `leafColumns`-тэй яг таарах ёстой.
  const headerRows = useMemo(() => {
    const hasGroups = columns.some((c) => c && c.children && c.children.length);
    if (!hasGroups) return null;
    let leafIndex = 0;
    const top = columns.map((c) => {
      if (c && c.children && c.children.length) {
        const colSpan = c.children.length;
        leafIndex += colSpan;
        return { ...c, colSpan, rowSpan: 1 };
      }
      return { ...c, colSpan: 1, rowSpan: 2, __leafIndex: leafIndex++ };
    });
    leafIndex = 0;
    const second = columns.flatMap((c) => {
      if (c && c.children && c.children.length) {
        return c.children.map((cc) => ({ ...cc, __leafIndex: leafIndex++ }));
      }
      leafIndex++;
      return [];
    });
    return [top, second] as ColumnType<T>[][];
  }, [columns]);

  const leafColumns = useMemo(
    () =>
      columns
        .flatMap((c) => (c && c.children && c.children.length ? c.children : [c]))
        .filter(Boolean),
    [columns],
  );

  // ---- эрэмбэлэлт ----
  const [sortState, setSortState] = useState<{
    key: React.Key;
    order: Exclude<SortOrder, null>;
  } | null>(() => {
    for (let i = 0; i < leafColumns.length; i++) {
      const c = leafColumns[i];
      if (c.defaultSortOrder) return { key: colKey(c, i), order: c.defaultSortOrder };
    }
    return null;
  });

  // ---- шүүлтүүр ----
  const [filterState, setFilterState] = useState<Record<string, any[]>>({});

  // ---- задлах мөр ----
  const expandedRowRender =
    (expandable && expandable.expandedRowRender) || expandedRowRenderProp;
  const rowExpandable = expandable && expandable.rowExpandable;
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  // ---- хуудаслалт ----
  const pgn: false | TablePaginationConfig =
    pagination === false ? false : pagination || {};
  const [innerPage, setInnerPage] = useState((pgn && pgn.defaultCurrent) || 1);
  const [innerSize, setInnerSize] = useState((pgn && pgn.defaultPageSize) || 10);
  const current =
    pgn === false ? 1 : pgn.current !== undefined ? pgn.current : innerPage;
  const pageSize =
    pgn === false
      ? dataSource.length
      : pgn.pageSize !== undefined
        ? pgn.pageSize
        : innerSize;
  const serverSide = pgn !== false && pgn.total !== undefined;

  const processed = useMemo(() => {
    let rows = [...(dataSource || [])];
    // шүүлтүүр
    for (const [key, values] of Object.entries(filterState)) {
      if (!values || !values.length) continue;
      const idx = leafColumns.findIndex((c, i) => String(colKey(c, i)) === key);
      const col = leafColumns[idx];
      if (!col || !col.onFilter) continue;
      rows = rows.filter((r) => values.some((v) => col.onFilter!(v, r)));
    }
    // эрэмбэ
    if (sortState) {
      const idx = leafColumns.findIndex(
        (c, i) => String(colKey(c, i)) === String(sortState.key),
      );
      const col = leafColumns[idx];
      // Багана өөрөө sortOrder-оо удирддаг (эцэг нь серверээс/төлвөөс
      // эрэмбэлсэн) бол дотоод эрэмбэлэлт хийвэл ДАВХАР эрэмбэлж, эцгийн
      // дарааллыг нураана — иймд зөвхөн удирдаагүй үед эрэмбэлнэ.
      if (col && col.sorter && col.sortOrder === undefined) {
        const fn = sorterFn(col);
        rows.sort((a, b) => (sortState.order === "descend" ? -fn(a, b) : fn(a, b)));
      }
    }
    return rows;
  }, [dataSource, filterState, sortState, leafColumns]);

  const total = serverSide
    ? (pgn as TablePaginationConfig).total!
    : processed.length;
  const pageRows =
    pgn === false || serverSide
      ? processed
      : processed.slice((current - 1) * pageSize, current * pageSize);

  const handlePageChange = (p: number, ps: number) => {
    if (pgn === false) return;
    if (pgn.current === undefined) setInnerPage(p);
    if (pgn.pageSize === undefined) setInnerSize(ps);
    if (pgn.onChange) pgn.onChange(p, ps);
    if (onTableChange)
      onTableChange({ current: p, pageSize: ps, total }, filterState, sortState || {});
  };

  const shownOrder = (col: ColumnType<T>, i: number): SortOrder => {
    // багана дээрх удирдсан sortOrder дотоод төлвөөс давуу
    if (col.sortOrder !== undefined) return col.sortOrder || null;
    const key = colKey(col, i);
    return sortState && String(sortState.key) === String(key)
      ? sortState.order
      : null;
  };

  const cycleSort = (col: ColumnType<T>, i: number) => {
    if (!col.sorter) return;
    const key = colKey(col, i);
    const cur = shownOrder(col, i);
    const next: SortOrder =
      cur === "ascend" ? "descend" : cur === "descend" ? null : "ascend";
    setSortState(next ? { key, order: next } : null);
    // antd гэрээ: толгой дээрх эрэмбэ onChange(pagination, filters, sorter) дуудна
    if (onTableChange)
      onTableChange({ current, pageSize, total }, filterState, {
        column: col,
        columnKey: key,
        field: col.dataIndex,
        order: next || undefined,
      });
  };

  // ---- сонголт ----
  const selType = (rowSelection && rowSelection.type) || "checkbox";
  const selectedRowKeys = (rowSelection && rowSelection.selectedRowKeys) || [];
  const selectable = !!rowSelection;
  const pageKeys = pageRows.map((r, i) => getRowKey(r, i, rowKey));
  const allSelected =
    pageKeys.length > 0 && pageKeys.every((k) => selectedRowKeys.includes(k));
  const someSelected = pageKeys.some((k) => selectedRowKeys.includes(k));

  const fireSelection = (keys: React.Key[]) => {
    if (!rowSelection || !rowSelection.onChange) return;
    const rows = keys
      .map((k) => processed.find((r, i) => getRowKey(r, i, rowKey) === k))
      .filter(Boolean) as T[];
    rowSelection.onChange(keys, rows);
  };
  const toggleRow = (k: React.Key, on: boolean) => {
    if (selType === "radio") return fireSelection([k]);
    fireSelection(on ? [...selectedRowKeys, k] : selectedRowKeys.filter((x) => x !== k));
  };
  const toggleAll = (on: boolean) => {
    if (on) fireSelection([...new Set([...selectedRowKeys, ...pageKeys])]);
    else fireSelection(selectedRowKeys.filter((k) => !pageKeys.includes(k)));
  };

  // ---- хөлдөөсөн баганын байрлал ----
  // col.width нь тоо (px) эсвэл CSS урт ("6rem") байж болох тул нийлбэрийг
  // calc()-аар хуримтлуулна — тоон `+=` нь холимог төрлийг чимээгүй нийлүүлж
  // хүчингүй CSS үүсгэдэг.
  const widthCss = (w?: number | string) =>
    typeof w === "number" ? `${w}px` : w || "120px";
  // headerMinWidth нь баганын *бодит* өргөнийг шошгонд багтаахаар доогуур
  // хязгаарладаг тул байрлалын тооцоо мөн адил хязгаарыг дагах ёстой.
  const effectiveWidthCss = (c: ColumnType<T>) => {
    const minW = headerMinWidth(c);
    return minW != null ? `${minW}px` : widthCss(c.width);
  };
  const fixedOffsets = useMemo(() => {
    const offsets: Record<number, { left?: string; right?: string }> = {};
    const leftParts: string[] = [];
    leafColumns.forEach((c, i) => {
      if (c.fixed === "left" || c.fixed === true) {
        offsets[i] = {
          left: leftParts.length ? `calc(${leftParts.join(" + ")})` : "0px",
        };
        leftParts.push(effectiveWidthCss(c));
      }
    });
    const rightParts: string[] = [];
    for (let i = leafColumns.length - 1; i >= 0; i--) {
      const c = leafColumns[i];
      if (c.fixed === "right") {
        offsets[i] = {
          right: rightParts.length ? `calc(${rightParts.join(" + ")})` : "0px",
        };
        rightParts.push(effectiveWidthCss(c));
      }
    }
    return offsets;
  }, [leafColumns]);

  // Нягт өндөр — өгөгдөл олон харагдах нь эрхэм. Мөрийн өндрийг нүдний
  // дотоод элемент (товч/шошго) тодорхойлохоос сэргийлж leading-tight өгнө.
  // `scroll.y` гараар өгөөгүй бол хүснэгт цонхны үлдсэн өндрийг дүүргэнэ.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const explicitY = scroll?.y;
  const autoMaxHeight = useFillViewportHeight(
    explicitY == null,
    rootRef,
    bodyRef,
    [dataSource.length, pageSize, current],
  );
  const effectiveY = explicitY ?? autoMaxHeight;

  const cellPad = small
    ? "px-2 py-0.5 leading-tight"
    : "px-3 py-1.5 leading-tight";
  const headPad = small ? "px-2 py-1 leading-tight" : "px-3 py-2 leading-tight";
  const emptyText =
    locale && locale.emptyText !== undefined ? locale.emptyText : "Мэдээлэл байхгүй";

  const colCount =
    leafColumns.length + (selectable ? 1 : 0) + (expandedRowRender ? 1 : 0);

  const renderHeaderCell = (
    col: ColumnType<T>,
    i: number,
    extra: { colSpan?: number; rowSpan?: number; leafIndex?: number } = {},
  ) => {
    const leafIndex = extra.leafIndex != null ? extra.leafIndex : i;
    const key = colKey(col, leafIndex);
    const sorted = shownOrder(col, leafIndex);
    const fixed = fixedOffsets[leafIndex];
    const isGroup = (extra.colSpan || 0) > 1;
    const headerCellProps = col.onHeaderCell ? col.onHeaderCell(col) || {} : {};
    const groupWidth =
      isGroup && col.children
        ? col.children.reduce((sum, c) => sum + (headerMinWidth(c) || 0), 0)
        : undefined;
    return (
      <th
        key={key}
        colSpan={extra.colSpan}
        rowSpan={extra.rowSpan}
        onClick={col.sorter ? () => cycleSort(col, leafIndex) : undefined}
        style={{
          // table-layout:fixed зөвхөн жинхэнэ эхний мөрнөөс баганын өргөнийг
          // уншдаг; бүлгийн толгойн хүүхдүүд 2-р мөрөнд сууж байдаг тул
          // хүүхдүүдийн өргөний нийлбэрийг бүлгийн нүдэнд өгч засна.
          width: isGroup ? groupWidth : headerMinWidth(col),
          minWidth: isGroup ? groupWidth : headerMinWidth(col),
          ...(fixed && { position: "sticky", ...fixed, zIndex: 2 }),
          ...(headerCellProps.style || {}),
        }}
        className={cn(
          "whitespace-nowrap bg-[hsl(var(--zt-muted))] text-center text-[11px] font-semibold text-[hsl(var(--zt-muted-fg))]",
          headPad,
          col.sorter && "cursor-pointer select-none hover:text-[hsl(var(--zt-fg))]",
          bordered && "border-r border-[hsl(var(--zt-border))] last:border-r-0",
          col.className,
          headerCellProps.className,
        )}
      >
        <span className="inline-flex flex-nowrap items-center justify-center gap-0.5">
          {typeof col.title === "function" ? col.title({}) : col.title}
          {col.sorter && (
            <span className="ml-0.5 inline-flex flex-col items-center leading-none">
              <svg
                viewBox="0 0 24 10"
                className={cn(
                  "h-1.5 w-2.5",
                  sorted === "ascend"
                    ? "text-[hsl(var(--zt-primary))]"
                    : "text-[hsl(var(--zt-muted-fg)/0.4)]",
                )}
                fill="currentColor"
              >
                <path d="M12 1 19 9H5Z" />
              </svg>
              <svg
                viewBox="0 0 24 10"
                className={cn(
                  "h-1.5 w-2.5",
                  sorted === "descend"
                    ? "text-[hsl(var(--zt-primary))]"
                    : "text-[hsl(var(--zt-muted-fg)/0.4)]",
                )}
                fill="currentColor"
              >
                <path d="M5 1H19L12 9Z" />
              </svg>
            </span>
          )}
          {(col.filters || col.filterDropdown) && (
            <FilterDropdown
              col={col}
              active={filterState[String(key)]}
              onApply={(vals) => {
                const nextFilters = { ...filterState, [String(key)]: vals };
                setFilterState(nextFilters);
                if (onTableChange)
                  onTableChange(
                    { current, pageSize, total },
                    nextFilters,
                    sortState || {},
                  );
              }}
            />
          )}
        </span>
      </th>
    );
  };

  const tableEl = (
    <table
      className={cn("w-full border-collapse text-[11px]", scroll && scroll.x && "min-w-max")}
      style={{
        ...(scroll && typeof scroll.x === "number" ? { minWidth: scroll.x } : null),
        // fixed layout нь зарласан баганын өргөн (ба ellipsis тайралт) үнэхээр
        // биелэхэд хэрэгтэй — эс бөгөөс хөтөч агуулгаараа сунгана.
        tableLayout: tableLayout || "fixed",
      }}
    >
      {showHeader && (
        <thead
          className={cn(
            "bg-[hsl(var(--zt-muted))]",
            effectiveY != null && "sticky top-0 z-10",
          )}
        >
          {headerRows ? (
            <>
              <tr>
                {selectable && (
                  <th
                    rowSpan={2}
                    style={{ position: "sticky", left: 0, zIndex: 3 }}
                    className={cn("w-8 bg-[hsl(var(--zt-muted))] text-center", headPad)}
                  />
                )}
                {expandedRowRender && (
                  <th
                    rowSpan={2}
                    style={{
                      position: "sticky",
                      left: selectable ? 32 : 0,
                      zIndex: 3,
                    }}
                    className={cn("w-8 bg-[hsl(var(--zt-muted))] text-center", headPad)}
                  />
                )}
                {headerRows[0].map((col: any, i) =>
                  renderHeaderCell(col, i, {
                    colSpan: col.colSpan > 1 ? col.colSpan : undefined,
                    rowSpan: col.children ? undefined : 2,
                    leafIndex: col.__leafIndex,
                  }),
                )}
              </tr>
              <tr>
                {headerRows[1].map((col: any, i) =>
                  renderHeaderCell(col, i, { leafIndex: col.__leafIndex }),
                )}
              </tr>
            </>
          ) : (
            <tr>
              {selectable && (
                <th
                  style={{ position: "sticky", left: 0, zIndex: 3 }}
                  className={cn("w-8 bg-[hsl(var(--zt-muted))] text-center", headPad)}
                >
                  {selType === "checkbox" && (
                    <input
                      type="checkbox"
                      aria-label="select all"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allSelected && someSelected;
                      }}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[hsl(var(--zt-primary))]"
                    />
                  )}
                </th>
              )}
              {expandedRowRender && (
                <th
                  style={{ position: "sticky", left: selectable ? 32 : 0, zIndex: 3 }}
                  className={cn("w-8 bg-[hsl(var(--zt-muted))] text-center", headPad)}
                />
              )}
              {leafColumns.map((col, i) => renderHeaderCell(col, i))}
            </tr>
          )}
        </thead>
      )}
      <tbody>
        {pageRows.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="px-3 py-14 text-center">
              <div className="flex flex-col items-center gap-3 text-[hsl(var(--zt-muted-fg))]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--zt-muted)/0.6)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.5 13 6 4h12l2.5 9M3.5 13v6a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-6M3.5 13h5.25a1 1 0 0 1 1 .9 2 2 0 0 0 2 1.85h.5a2 2 0 0 0 2-1.85 1 1 0 0 1 1-.9h5.25"
                    />
                  </svg>
                </div>
                <span className="text-[11px] font-medium">{emptyText}</span>
              </div>
            </td>
          </tr>
        ) : (
          pageRows.map((record, ri) => {
            const key = getRowKey(record, ri, rowKey);
            const selected = selectedRowKeys.includes(key);
            const expanded = expandedKeys.includes(key);
            const canExpand = !rowExpandable || rowExpandable(record);
            const extraRowProps: Record<string, any> = onRow
              ? onRow(record, ri) || {}
              : {};
            const rc =
              typeof rowClassName === "function" ? rowClassName(record, ri) : rowClassName;
            const checkboxProps =
              rowSelection && rowSelection.getCheckboxProps
                ? rowSelection.getCheckboxProps(record)
                : ({} as any);
            return (
              <Fragment key={key}>
                <tr
                  {...extraRowProps}
                  className={cn(
                    "border-b border-[hsl(var(--zt-border))] transition-colors last:border-b-0",
                    // zebra: наалдсан нүд өнгийг өвлөхийн тулд тунгалаг бус өнгө
                    ri % 2 === 1 ? "zt-row-even" : "zt-row-odd",
                    "zt-row-hover",
                    selected && "zt-row-selected",
                    rc,
                    extraRowProps.className,
                  )}
                >
                  {selectable && (
                    <td
                      style={{ position: "sticky", left: 0, zIndex: 1 }}
                      className={cn("zt-td-fixed w-8 text-center", cellPad)}
                    >
                      <input
                        type={selType === "radio" ? "radio" : "checkbox"}
                        checked={selected}
                        disabled={checkboxProps.disabled}
                        onChange={(e) => toggleRow(key, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-3.5 w-3.5 accent-[hsl(var(--zt-primary))]"
                      />
                    </td>
                  )}
                  {expandedRowRender && (
                    <td
                      style={{
                        position: "sticky",
                        left: selectable ? 32 : 0,
                        zIndex: 1,
                      }}
                      className={cn("zt-td-fixed w-8 text-center", cellPad)}
                    >
                      {canExpand && (
                        <button
                          type="button"
                          aria-label="expand"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedKeys((ks) =>
                              expanded ? ks.filter((k) => k !== key) : [...ks, key],
                            );
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded border border-[hsl(var(--zt-input))] text-[hsl(var(--zt-muted-fg))] transition-colors hover:border-[hsl(var(--zt-primary)/0.6)] hover:text-[hsl(var(--zt-primary))]"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className={cn(
                              "h-3 w-3 transition-transform",
                              expanded && "rotate-90",
                            )}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              d="m9 6 6 6-6 6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}
                  {leafColumns.map((col, ci) => {
                    const raw = getValue(record, col.dataIndex);
                    const content = col.render
                      ? col.render(raw, record, (current - 1) * pageSize + ri)
                      : (raw as React.ReactNode);
                    const fixed = fixedOffsets[ci];
                    const cellProps = col.onCell ? col.onCell(record, ri) || {} : {};
                    if (cellProps.colSpan === 0 || cellProps.rowSpan === 0) return null;
                    const {
                      className: cellClass,
                      style: cellStyle,
                      ...restCell
                    } = cellProps as any;
                    return (
                      <td
                        key={colKey(col, ci)}
                        {...restCell}
                        style={{
                          width: col.width,
                          minWidth: col.width,
                          ...(fixed && { position: "sticky", ...fixed, zIndex: 1 }),
                          ...(cellStyle || {}),
                        }}
                        className={cn(
                          cellPad,
                          "text-[hsl(var(--zt-fg))]",
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : "text-left",
                          col.ellipsis &&
                            "max-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
                          bordered &&
                            "border-r border-[hsl(var(--zt-border))] last:border-r-0",
                          fixed && "zt-td-fixed",
                          col.className,
                          cellClass,
                        )}
                      >
                        {content as React.ReactNode}
                      </td>
                    );
                  })}
                </tr>
                {expandedRowRender && expanded && (
                  <tr className="border-b border-[hsl(var(--zt-border))] bg-[hsl(var(--zt-muted)/0.2)]">
                    <td colSpan={colCount} className={cellPad}>
                      {expandedRowRender(record, ri)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })
        )}
      </tbody>
      {summary && pageRows.length > 0 && (
        // thead-тэй ижил z-10: наалдсан хөл нь доогуур гүйх ЯМАР Ч мөрийг —
        // тухайн мөрийн хөлдөөсөн баганыг ч оруулаад — бүрэн халхлах ёстой.
        <tfoot
          className={cn(
            effectiveY != null &&
              "sticky bottom-0 z-10 bg-[hsl(var(--zt-card))]",
          )}
        >
          {summary(pageRows)}
        </tfoot>
      )}
    </table>
  );

  return (
    <Spin spinning={isLoading}>
      <div
        ref={rootRef}
        style={style}
        className={cn("zt-table w-full", className)}
      >
        {title && <div className="px-1 pb-2 text-[11px] font-medium">{title(pageRows)}</div>}
        {/* Карт нь бүрдлийн ӨӨРИЙН нь хэсэг — дэлгэц бүр өөрийн хүрээ/радиусаа
            зурдаг байсан тул хүснэгтүүд өөр өөр харагддаг байв. Хүрээ ГАНЦ:
            өмнө нь гадна карт + дотор хүрээ хоёулаа зурагдаж давхардаж байв. */}
        <div
          ref={bodyRef}
          className={cn(
            "w-full overflow-x-auto rounded-md border border-[hsl(var(--zt-border))] bg-[hsl(var(--zt-card))]",
            effectiveY != null && "overflow-y-auto",
          )}
          style={effectiveY != null ? { maxHeight: effectiveY } : undefined}
        >
          {tableEl}
        </div>
        {footer && pageRows.length > 0 && (
          <div className="px-1 pt-2 text-[11px] text-[hsl(var(--zt-muted-fg))]">
            {footer(pageRows)}
          </div>
        )}
        {pgn !== false && total > 0 && (
          <Pagination
            current={current}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={pgn.showSizeChanger}
            pageSizeOptions={pgn.pageSizeOptions}
            showTotal={pgn.showTotal}
            size={(pgn.size || size) as any}
          />
        )}
      </div>
    </Spin>
  );
}

Table.Summary = Summary;

export { Pagination, Popup, Spin };
export default Table;
