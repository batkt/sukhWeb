export const hasPermission = (ajiltan: any, pathOrId: string): boolean => {
  if (!ajiltan) return false;
  if (ajiltan.erkh && ajiltan.erkh.toLowerCase() === "admin") return true;
  
  const permissions = ajiltan.tsonkhniiErkhuud || [];

  const path = pathOrId.startsWith("/") ? pathOrId : "/" + pathOrId.replace(/\./g, "/");
  const id = pathOrId.startsWith("/") ? pathOrId.substring(1).replace(/\//g, ".") : pathOrId;
  
  return permissions.includes(path) || permissions.includes(id) || permissions.includes(pathOrId);
};
