import uilchilgee from "../../src/lib/uilchilgee";

function updateMethod<T = any>(
  modelName: string,
  token: string | null,
  data: { _id: string; [key: string]: any }
): Promise<{ data: T }> {
  let payload = data;
  if (modelName === "baiguullaga") {
    // Normalize building tokhirgoo davkhariinToonuud shape to ensure the
    // server receives arrays of individual unit strings. Some clients may
    // send values like ["202,203"] or mixed numeric values; normalize to
    // ["202","203"]. This helps downstream consumers (mobile/web)
    // display units consistently.
    try {
      if (payload && Array.isArray(payload.barilguud)) {
        payload = {
          ...payload,
          barilguud: payload.barilguud.map((b: any) => {
            if (
              b &&
              b.tokhirgoo &&
              b.tokhirgoo.davkhariinToonuud &&
              typeof b.tokhirgoo.davkhariinToonuud === "object"
            ) {
              const nextMap: Record<string, string[]> = {};
              Object.entries(b.tokhirgoo.davkhariinToonuud).forEach(
                ([k, v]) => {
                  const arr = Array.isArray(v) ? v : [v];
                  const normalized = Array.from(
                    new Set(
                      arr
                        .flatMap((it: any) =>
                          String(it || "").split(/[\s,;|]+/)
                        )
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    )
                  );
                  nextMap[String(k)] = normalized;
                }
              );
              b = {
                ...b,
                tokhirgoo: {
                  ...(b.tokhirgoo || {}),
                  davkhariinToonuud: nextMap,
                },
              };
            }
            return b;
          }),
        };
      }
    } catch (normErr) {
      // don't block the main request on normalization errors
    }
  }
  return uilchilgee(token || undefined).put(
    `/${modelName}/${data._id}`,
    payload
  );
}

export default updateMethod;
