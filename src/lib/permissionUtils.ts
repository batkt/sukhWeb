import { PERMISSION_ALIASES } from "./permissions";

export const hasPermission = (ajiltan: any, pathOrId: string): boolean => {
  if (!ajiltan) return false;
  if (ajiltan.erkh && ajiltan.erkh.toLowerCase() === "admin") return true;

  const permissions: string[] = ajiltan.tsonkhniiErkhuud || [];

  const direct = (value: string) => {
    const path = value.startsWith("/") ? value : "/" + value.replace(/\./g, "/");
    const id = value.startsWith("/") ? value.substring(1).replace(/\//g, ".") : value;
    return (
      permissions.includes(path) ||
      permissions.includes(id) ||
      permissions.includes(value)
    );
  };

  if (direct(pathOrId)) return true;

  // Хуучин ID-аар өгөгдсөн эрх (ж: tokhirgoo.zassanTuukh → tuukh.zassan)
  const id = pathOrId.startsWith("/")
    ? pathOrId.substring(1).replace(/\//g, ".")
    : pathOrId;
  const aliases = PERMISSION_ALIASES[id];
  return !!aliases && aliases.some(direct);
};
