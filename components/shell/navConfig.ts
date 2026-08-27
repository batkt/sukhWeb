import {
  Banknote,
  Cctv,
  ChartNoAxesCombined,
  Gauge,
  Megaphone,
  ScrollText,
  SquareParking,
  type LucideIcon,
} from "lucide-react";
import { hasPermission } from "@/lib/permissionUtils";

export interface SubNavItem {
  label: string;
  path: string;
}

export interface NavItem {
  label: string;
  /** Route segment, also used as the permission key. */
  path: string;
  icon: LucideIcon;
  /** Destination override for leaf items whose landing page is a child route. */
  href?: string;
  submenu?: SubNavItem[];
  comingSoon?: boolean;
}

/** Single stroke weight across the whole shell — mixed weights read as sloppy. */
export const ICON_STROKE = 1.75;

export const NAV_ITEMS: NavItem[] = [
  { label: "Хяналт", path: "khynalt", icon: Gauge },
  {
    label: "Бүртгэл",
    path: "geree",
    icon: ScrollText,
    href: "/geree/orshinSuugch",
  },
  { label: "Төлбөр", path: "tulbur", icon: Banknote },
  { label: "Камер", path: "camera", icon: Cctv },
  {
    label: "Тайлан",
    path: "tailan",
    icon: ChartNoAxesCombined,
    submenu: [
      { label: "Авлагын товчоо", path: "orlogo-avlaga" },
      { label: "Нэгтгэл тайлан", path: "negtgel" },
      { label: "Авлагийн насжилт", path: "avlagiin-nasjilt" },
      { label: "Зогсоол", path: "zogsool" },
    ],
  },
  {
    label: "Мэдэгдэл",
    path: "medegdel",
    icon: Megaphone,
    submenu: [
      { label: "Мэдэгдэл", path: "medegdel" },
      { label: "Санал хүсэлт", path: "sanalKhuselt" },
      { label: "Санал асуулга", path: "sanalAsuulga" },
    ],
  },
  {
    label: "Зогсоол",
    path: "zogsool",
    icon: SquareParking,
    submenu: [
      { label: "Жагсаалт", path: "jagsaalt" },
      { label: "Камер касс", path: "camera" },
      { label: "Машин бүртгэл", path: "orshinSuugch" },
      { label: "Урьсан түүх", path: "urisan" },
    ],
  },
];

/** Where a top-level item navigates to when clicked. */
export function hrefFor(item: NavItem): string {
  return item.href ?? `/${item.path}`;
}

export function subHrefFor(item: NavItem, sub: SubNavItem): string {
  return `/${item.path}/${sub.path}`;
}

/**
 * Same permission rules the old top navbar used: admins see everything,
 * a parent is visible if the parent path is granted or any child is,
 * and parents whose children are all denied disappear entirely.
 */
export function filterNavByPermission(
  items: NavItem[],
  ajiltan: unknown,
): NavItem[] {
  const has = (path: string) => hasPermission(ajiltan, path);
  const isAdmin =
    (ajiltan as { erkh?: string } | null)?.erkh?.toLowerCase() === "admin";

  const allowedSubs = (item: NavItem) =>
    (item.submenu ?? []).filter(
      (sub) =>
        has(item.path) ||
        has(`/${item.path}`) ||
        has(`${item.path}.${sub.path}`) ||
        has(`/${item.path}/${sub.path}`),
    );

  return items
    .map((item) => {
      if (isAdmin) return item;
      if (item.submenu) return { ...item, submenu: allowedSubs(item) };
      return item;
    })
    .filter((item) => {
      if (isAdmin) return true;
      if (item.submenu) return item.submenu.length > 0;
      return has(item.path) || has(`/${item.path}`);
    });
}

/**
 * Human-readable title for the current route, derived from the nav tree so
 * pages don't each have to declare one. Falls back to the app name.
 */
export function titleForPath(pathname: string, items: NavItem[]): string {
  for (const item of items) {
    if (!pathname.startsWith(`/${item.path}`)) continue;
    const sub = item.submenu?.find((s) =>
      pathname.startsWith(subHrefFor(item, s)),
    );
    return sub ? `${item.label} — ${sub.label}` : item.label;
  }
  return "Амар Сөх";
}
