export const FONT_SIZE_OPTIONS = [
  { label: "Хамгийн жижиг", size: "10px" },
  { label: "Маш жижиг", size: "11px" },
  { label: "Жижиг-", size: "12px" },
  { label: "Жижиг", size: "13px" },
  { label: "Жижиг+", size: "14px" },
  { label: "Дунд-", size: "15px" },
  { label: "Дунд", size: "16px" },
  { label: "Дунд+", size: "17px" },
  { label: "Том-", size: "18px" },
  { label: "Том", size: "19px" },
  { label: "Том+", size: "20px" },
  { label: "Маш том-", size: "21px" },
  { label: "Маш том", size: "22px" },
  { label: "Маш том+", size: "24px" },
  { label: "Хамгийн том", size: "26px" },
];

export const DEFAULT_FONT_INDEX = 6;

/**
 * Reads the persisted index and applies it to the document root.
 *
 * Lives in its own module so the shell can call it without statically pulling
 * in SettingsModal, which is meant to stay lazy.
 */
export function applyStoredFontSize(): number {
  try {
    const raw = localStorage.getItem("fontSizeIndex");
    const parsed = raw === null ? DEFAULT_FONT_INDEX : parseInt(raw, 10);
    const index = FONT_SIZE_OPTIONS[parsed] ? parsed : DEFAULT_FONT_INDEX;
    document.documentElement.style.fontSize = FONT_SIZE_OPTIONS[index].size;
    return index;
  } catch {
    return DEFAULT_FONT_INDEX;
  }
}

export function persistFontSize(index: number) {
  document.documentElement.style.fontSize = FONT_SIZE_OPTIONS[index].size;
  try {
    localStorage.setItem("fontSizeIndex", String(index));
  } catch {
    /* private mode — applies for this session only */
  }
}
