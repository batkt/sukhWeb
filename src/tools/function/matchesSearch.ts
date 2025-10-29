export default function matchesSearch(
  item: any,
  query: string | undefined
): boolean {
  if (!query || String(query).trim() === "") return true;
  const q = String(query).toLowerCase();

  const visited = new WeakSet();

  function walk(value: any): boolean {
    if (value == null) return false;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value).toLowerCase().includes(q);
    }
    if (value instanceof Date) {
      return value.toISOString().toLowerCase().includes(q);
    }
    if (Array.isArray(value)) {
      for (const v of value) if (walk(v)) return true;
      return false;
    }
    if (typeof value === "object") {
      if (visited.has(value)) return false;
      visited.add(value);
      for (const k of Object.keys(value)) {
        try {
          if (walk(value[k])) return true;
        } catch (e) {
          // ignore
        }
      }
    }
    return false;
  }

  return walk(item);
}
