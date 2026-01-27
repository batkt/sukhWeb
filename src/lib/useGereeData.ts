import { useMemo, useCallback, useState, useEffect } from "react";
import { useGereeJagsaalt } from "@/lib/useGeree";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import { useSocket } from "@/context/SocketContext";
import uilchilgee, { getErrorMessage } from "@/lib/uilchilgee";
import { getPaymentStatusLabel } from "@/lib/utils";

export function useGereeData(
  token: string | null,
  ajiltan: any,
  selectedBuildingId: string | undefined,
  barilgiinId: string | undefined,
  baiguullaga: any,
  resPage: number,
  resPageSize: number,
  empPage: number,
  empPageSize: number,
  currentPage: number,
  rowsPerPage: number,
  sortKey: "createdAt" | "toot" | "orts" | "davkhar",
  sortOrder: "asc" | "desc",
  searchTerm: string,
  unitPage: number,
  unitPageSize: number
) {
  const effectiveBarilgiinId = selectedBuildingId ?? barilgiinId ?? undefined;
  const selectedBarilga = baiguullaga?.barilguud?.find(
    (b: any) => b._id === selectedBuildingId
  );

  const {
    gereeGaralt,
    gereeJagsaaltMutate,
    setGereeKhuudaslalt,
    isValidating: isValidatingGeree,
  } = useGereeJagsaalt({}, token || undefined, ajiltan?.baiguullagiinId, effectiveBarilgiinId);

  const {
    orshinSuugchGaralt,
    orshinSuugchJagsaaltMutate,
    setOrshinSuugchKhuudaslalt,
    isValidating: isValidatingSuugch,
  } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    {},
    effectiveBarilgiinId
  );

  const {
    ajilchdiinGaralt,
    ajiltniiJagsaaltMutate,
    setAjiltniiKhuudaslalt,
    isValidating: isValidatingAjiltan,
  } = useAjiltniiJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    effectiveBarilgiinId,
    {}
  );

  const {
    zagvaruud,
    zagvarJagsaaltMutate,
    isValidating: isValidatingZagvar,
  } = useGereeniiZagvar();

  const socketCtx = useSocket();

  const contracts = gereeGaralt?.jagsaalt || [];
  const residentsList = (orshinSuugchGaralt?.jagsaalt || []) as any[];
  const employeesList = (ajilchdiinGaralt?.jagsaalt || []) as any[];

  // Create a map of residents by _id for quick lookup
  const residentsById = useMemo(() => {
    const map: Record<string, any> = {};
    residentsList.forEach((r: any) => {
      if (r?._id) {
        map[String(r._id)] = r;
      }
    });
    return map;
  }, [residentsList]);

  // Derived data
  const davkharOptions = useMemo(() => {
    try {
      const tok = (selectedBarilga as any)?.tokhirgoo?.davkhar;
      if (Array.isArray(tok) && tok.length > 0)
        return tok.map((d: any) => String(d?.davkhar ?? d));
      if (typeof tok === "number" && tok > 0)
        return Array.from({ length: tok }).map((_, i) => String(i + 1));
      const list = (selectedBarilga as any)?.davkharuud;
      if (Array.isArray(list) && list.length > 0)
        return list.map((d: any) => String(d?.davkhar ?? d));
      return [];
    } catch (e) {
      return [];
    }
  }, [selectedBarilga]);

  const ortsOptions = useMemo(() => {
    try {
      const tok = (selectedBarilga as any)?.tokhirgoo?.orts;
      if (Array.isArray(tok) && tok.length > 0) return tok.map(String);
      if (typeof tok === "number" && tok > 0)
        return Array.from({ length: tok }).map((_, i) => String(i + 1));
      if (typeof tok === "string") {
        const s = tok.trim();
        if (/^\d+$/.test(s)) {
          const n = Number(s);
          if (n > 0) return Array.from({ length: n }).map((_, i) => String(i + 1));
        }
        const parts = s.split(/[\s,;|]+/).filter(Boolean);
        if (parts.length > 0) return parts.map(String);
      }
      return [];
    } catch (e) {
      return [];
    }
  }, [selectedBarilga]);

  const tootMap: Record<string, string[]> = useMemo(() => {
    const out: Record<string, string[]> = {};
    try {
      const tokhirgoo = (selectedBarilga as any)?.tokhirgoo || {};
      const map = (tokhirgoo as any)?.davkhariinToonuud;
      if (map && typeof map === "object" && !Array.isArray(map)) {
        Object.entries(map).forEach(([floor, arr]) => {
          const list = Array.isArray(arr) ? arr : [];
          out[String(floor)] = list.map((x: any) => String(x));
        });
      }
      const tok = (tokhirgoo as any)?.davkhar;
      if (Array.isArray(tok)) {
        tok.forEach((it: any) => {
          const floor = String(it?.davkhar ?? it);
          const list = Array.isArray(it?.toonuud) ? it.toonuud : [];
          if (floor && !out[floor]) out[floor] = list.map((x: any) => String(x));
        });
      }
    } catch {}
    return out;
  }, [selectedBarilga]);

  const composeKey = useCallback((orts: string, floor: string) => {
    const f = String(floor || "").trim();
    const o = String(orts || "").trim();
    return o ? `${o}::${f}` : f;
  }, []);

  const getTootOptions = useCallback(
    (orts: string, floor: string) => {
      try {
        const o = String(orts || "").trim();
        const f = String(floor || "").trim();
        const key = composeKey(o, f);

        let candidates: string[] = [];
        if (tootMap[key] && Array.isArray(tootMap[key]) && tootMap[key].length > 0) {
          candidates = tootMap[key].slice();
        } else if (f && tootMap[f] && Array.isArray(tootMap[f]) && tootMap[f].length > 0) {
          candidates = tootMap[f].slice();
        } else {
          return [];
        }

        const normalized = Array.from(
          new Set(
            candidates
              .flatMap((it) => String(it || "").split(/[\s,;|]+/))
              .map((s) => s.trim())
              .map((s) => s.replace(/[^0-9A-Za-zА-Яа-яӨөҮүёЁ-]/g, ""))
              .filter(Boolean)
          )
        );

        return normalized;
      } catch (e) {
        return [];
      }
    },
    [tootMap, composeKey]
  );

  const [tuluvByResidentId, setTuluvByResidentId] = useState<
    Record<string, "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй">
  >({});

  // Fetch payment status
  useEffect(() => {
    const run = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      try {
        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: selectedBuildingId || barilgiinId || null,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 20000,
          },
        });
        const list: any[] = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
          ? resp.data
          : [];
        
        const residents = residentsList;
        const norm = (v: any) => String(v ?? "").trim().toLowerCase();
        const resIndex = new Map<string, string>();
        
        const makeResKeys = (r: any): string[] => {
          const id = String(r?._id || "");
          const reg = norm(r?.register);
          const phone = norm(r?.utas);
          const ovog = norm(r?.ovog);
          const ner = norm(r?.ner);
          const toot = String(r?.toot ?? r?.medeelel?.toot ?? "").trim();
          const keys: string[] = [];
          if (id) keys.push(`id|${id}`);
          if (reg) keys.push(`reg|${reg}`);
          if (phone) keys.push(`phone|${phone}`);
          if (ovog || ner || toot) keys.push(`name|${ovog}|${ner}|${toot}`);
          return keys;
        };
        
        residents.forEach((r: any) => {
          const id = String(r?._id || "");
          if (!id) return;
          makeResKeys(r).forEach((k) => resIndex.set(k, id));
        });

        const byId: Record<string, { label: string; ts: number }> = {};
        list.forEach((it: any) => {
          const keys: string[] = [];
          const osIdRaw = String(it?.orshinSuugchId || "");
          if (osIdRaw) keys.push(`id|${osIdRaw}`);
          const reg = norm(it?.register);
          if (reg) keys.push(`reg|${reg}`);
          const utasVal = Array.isArray(it?.utas) ? it.utas[0] : it?.utas;
          const phone = norm(utasVal);
          if (phone) keys.push(`phone|${phone}`);
          const ovog = norm(it?.ovog);
          const ner = norm(it?.ner);
          const toot = String(it?.medeelel?.toot ?? it?.toot ?? "").trim();
          if (ovog || ner || toot) keys.push(`name|${ovog}|${ner}|${toot}`);

          let osId = "";
          for (const k of keys) {
            const found = resIndex.get(k);
            if (found) {
              osId = found;
              break;
            }
          }
          if (!osId) return;

          const label = getPaymentStatusLabel(it);
          const ts = new Date(it?.tulsunOgnoo || it?.ognoo || it?.createdAt || 0).getTime();
          const cur = byId[osId];
          if (!cur || ts >= cur.ts) byId[osId] = { label, ts };
        });
        
        const out: Record<string, "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй"> = {};
        Object.entries(byId).forEach(([k, v]) => {
          const l = v.label as any;
          out[k] = l === "Төлсөн" || l === "Төлөөгүй" || l === "Хугацаа хэтэрсэн" ? l : "Тодорхойгүй";
        });
        setTuluvByResidentId(out);
      } catch {
        setTuluvByResidentId({});
      }
    };
    run();
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId, residentsList]);

  const renderCellValue = useCallback((contract: any, columnKey: string) => {
    if (!contract) return "-";

    // Helper to extract string value from object or primitive
    const getStringValue = (val: any): string => {
      if (val == null) return "";
      if (typeof val === "string") return val;
      if (typeof val === "number") return String(val);
      if (typeof val === "boolean") return String(val);
      if (typeof val === "object") {
        // Handle objects like {ner: "...", kod: "..."}
        if (val.ner) return String(val.ner);
        if (val.kod) return String(val.kod);
        if (val.label) return String(val.label);
        if (val.value) return String(val.value);
        // If it's an array, join it
        if (Array.isArray(val)) {
          return val.map((v: any) => getStringValue(v)).filter(Boolean).join(", ");
        }
        // Last resort: try to stringify
        return "";
      }
      return String(val);
    };

    switch (columnKey) {
      case "ner": {
        const ovog = getStringValue(contract.ovog);
        const ner = getStringValue(contract.ner);
        return ovog || ner ? `${ovog} ${ner}`.trim() : "-";
      }
      
      case "gereeniiDugaar":
        return getStringValue(contract.gereeniiDugaar) || "-";
      
      case "turul":
        return getStringValue(contract.turul) || "-";
      
      case "duureg":
        return getStringValue(contract.duureg) || "-";
      
      case "horoo": {
        const horoo = contract.horoo;
        if (typeof horoo === "object" && horoo != null) {
          return getStringValue(horoo.ner) || getStringValue(horoo.kod) || "-";
        }
        return getStringValue(horoo) || "-";
      }
      
      case "bairniiNer":
        return getStringValue(contract.bairniiNer) || "-";
      
      case "orts": {
        // First try to get orts from the linked resident
        const orshinSuugchId = contract.orshinSuugchId;
        if (orshinSuugchId) {
          const resident = residentsById[String(orshinSuugchId)];
          if (resident?.orts != null) {
            return String(resident.orts);
          }
        }
        // Fall back to contract's own orts value
        return contract.orts != null ? String(contract.orts) : "-";
      }
      
      case "davkhar": {
        // Try to get davkhar from the linked resident
        const orshinSuugchId = contract.orshinSuugchId;
        if (orshinSuugchId) {
          const resident = residentsById[String(orshinSuugchId)];
          if (resident?.davkhar != null) {
            return String(resident.davkhar);
          }
        }
        // Fall back to contract's own davkhar value
        return contract.davkhar != null ? String(contract.davkhar) : "-";
      }
      
      case "toot": {
        // Try to get toot from the linked resident
        const orshinSuugchId = contract.orshinSuugchId;
        if (orshinSuugchId) {
          const resident = residentsById[String(orshinSuugchId)];
          if (resident?.toot != null) {
            return String(resident.toot);
          }
        }
        // Fall back to contract's own toot value
        return contract.toot != null ? String(contract.toot) : "-";
      }
      
      case "utas":
        if (Array.isArray(contract.utas)) {
          return contract.utas.map((u: any) => getStringValue(u)).filter(Boolean).join(", ") || "-";
        }
        return getStringValue(contract.utas) || "-";
      
      case "tuluv":
        return contract.tuluv || "Идэвхтэй";
      
      case "ognoo":
        if (contract.ognoo || contract.createdAt) {
          try {
            const date = new Date(contract.ognoo || contract.createdAt);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString("mn-MN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });
            }
          } catch (e) {
            // Fall through to return raw value
          }
          return getStringValue(contract.ognoo || contract.createdAt) || "-";
        }
        return "-";
      
      default: {
        const value = contract[columnKey];
        return getStringValue(value) || "-";
      }
    }
  }, [residentsById]);

  // Filter and sort residents
  const filteredResidents = useMemo(() => {
    let filtered = [...residentsList];

    // Apply search filter if searchTerm exists
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((r: any) => {
        const ner = String(r?.ner || "").toLowerCase();
        const ovog = String(r?.ovog || "").toLowerCase();
        const utas = String(r?.utas || "").toLowerCase();
        const toot = String(r?.toot || "").toLowerCase();
        const register = String(r?.register || "").toLowerCase();
        return (
          ner.includes(term) ||
          ovog.includes(term) ||
          utas.includes(term) ||
          toot.includes(term) ||
          register.includes(term)
        );
      });
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;

      if (sortKey === "createdAt") {
        aVal = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
        bVal = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
      } else if (sortKey === "toot") {
        aVal = String(a?.toot || "").trim();
        bVal = String(b?.toot || "").trim();
        // Try numeric comparison first
        const aNum = parseInt(aVal);
        const bNum = parseInt(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        }
      } else if (sortKey === "orts") {
        aVal = String(a?.orts || "").trim();
        bVal = String(b?.orts || "").trim();
        const aNum = parseInt(aVal);
        const bNum = parseInt(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        }
      } else if (sortKey === "davkhar") {
        aVal = String(a?.davkhar || "").trim();
        bVal = String(b?.davkhar || "").trim();
        const aNum = parseInt(aVal);
        const bNum = parseInt(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        }
      } else {
        aVal = String(a?.[sortKey] || "").trim();
        bVal = String(b?.[sortKey] || "").trim();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [residentsList, searchTerm, sortKey, sortOrder]);

  // Paginate residents
  const resTotalPages = Math.max(1, Math.ceil(filteredResidents.length / resPageSize));
  const startIndex = (resPage - 1) * resPageSize;
  const currentResidents = filteredResidents.slice(startIndex, startIndex + resPageSize);

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    let filtered = [...contracts];

    // Apply search filter if searchTerm exists
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((c: any) => {
        const ner = String(c?.ner || "").toLowerCase();
        const ovog = String(c?.ovog || "").toLowerCase();
        const utas = Array.isArray(c?.utas) 
          ? c.utas.map((u: any) => String(u).toLowerCase()).join(" ")
          : String(c?.utas || "").toLowerCase();
        const toot = String(c?.toot || "").toLowerCase();
        const gereeniiDugaar = String(c?.gereeniiDugaar || "").toLowerCase();
        return (
          ner.includes(term) ||
          ovog.includes(term) ||
          utas.includes(term) ||
          toot.includes(term) ||
          gereeniiDugaar.includes(term)
        );
      });
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;

      if (sortKey === "createdAt") {
        aVal = new Date(a?.createdAt || a?.ognoo || a?.updatedAt || 0).getTime();
        bVal = new Date(b?.createdAt || b?.ognoo || b?.updatedAt || 0).getTime();
      } else if (sortKey === "toot") {
        // Get toot from linked resident if available
        const aResident = a?.orshinSuugchId ? residentsById[String(a.orshinSuugchId)] : null;
        const bResident = b?.orshinSuugchId ? residentsById[String(b.orshinSuugchId)] : null;
        aVal = String(aResident?.toot ?? a?.toot ?? "").trim();
        bVal = String(bResident?.toot ?? b?.toot ?? "").trim();
        const aNum = parseInt(aVal);
        const bNum = parseInt(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        }
      } else if (sortKey === "orts") {
        // Get orts from linked resident if available
        const aResident = a?.orshinSuugchId ? residentsById[String(a.orshinSuugchId)] : null;
        const bResident = b?.orshinSuugchId ? residentsById[String(b.orshinSuugchId)] : null;
        aVal = String(aResident?.orts ?? a?.orts ?? "").trim();
        bVal = String(bResident?.orts ?? b?.orts ?? "").trim();
        const aNum = parseInt(aVal);
        const bNum = parseInt(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        }
      } else if (sortKey === "davkhar") {
        // Get davkhar from linked resident if available
        const aResident = a?.orshinSuugchId ? residentsById[String(a.orshinSuugchId)] : null;
        const bResident = b?.orshinSuugchId ? residentsById[String(b.orshinSuugchId)] : null;
        aVal = String(aResident?.davkhar ?? a?.davkhar ?? "").trim();
        bVal = String(bResident?.davkhar ?? b?.davkhar ?? "").trim();
        const aNum = parseInt(aVal);
        const bNum = parseInt(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        }
      } else {
        aVal = String(a?.[sortKey] || "").trim();
        bVal = String(b?.[sortKey] || "").trim();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contracts, searchTerm, sortKey, sortOrder, residentsById]);

  // Paginate contracts
  const contractStartIndex = (currentPage - 1) * rowsPerPage;
  const currentContracts = filteredContracts.slice(contractStartIndex, contractStartIndex + rowsPerPage);

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = [...employeesList];

    // Apply search filter if searchTerm exists
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((e: any) => {
        const ner = String(e?.ner || "").toLowerCase();
        const ovog = String(e?.ovog || "").toLowerCase();
        const utas = String(e?.utas || "").toLowerCase();
        const email = String(e?.email || "").toLowerCase();
        const albanTushaal = String(e?.albanTushaal || "").toLowerCase();
        return (
          ner.includes(term) ||
          ovog.includes(term) ||
          utas.includes(term) ||
          email.includes(term) ||
          albanTushaal.includes(term)
        );
      });
    }

    // Sort employees by createdAt (most recent first)
    filtered.sort((a: any, b: any) => {
      const aVal = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
      const bVal = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
      return bVal - aVal; // Descending by default
    });

    return filtered;
  }, [employeesList, searchTerm]);

  // Paginate employees
  const empTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / empPageSize));
  const empStartIndex = (empPage - 1) * empPageSize;
  const currentEmployees = filteredEmployees.slice(empStartIndex, empStartIndex + empPageSize);

  // Compute floors list from davkharOptions
  const floorsList = useMemo(() => {
    return [...davkharOptions];
  }, [davkharOptions]);

  // Paginate floors
  const unitTotalPages = Math.max(1, Math.ceil(floorsList.length / unitPageSize));
  const unitStartIndex = (unitPage - 1) * unitPageSize;
  const currentFloors = floorsList.slice(unitStartIndex, unitStartIndex + unitPageSize);

  return {
    contracts,
    residentsList,
    employeesList,
    davkharOptions,
    ortsOptions,
    tootMap,
    selectedBarilga,
    zagvaruud,
    socketCtx,
    composeKey,
    getTootOptions,
    tuluvByResidentId,
    renderCellValue,
    gereeJagsaaltMutate,
    orshinSuugchJagsaaltMutate,
    ajiltniiJagsaaltMutate,
    zagvarJagsaaltMutate,
    setGereeKhuudaslalt,
    setOrshinSuugchKhuudaslalt,
    setAjiltniiKhuudaslalt,
    isValidatingGeree,
    isValidatingSuugch,
    isValidatingAjiltan,
    // Computed data
    currentContracts,
    startIndex: contractStartIndex,
    currentResidents,
    resTotalPages,
    filteredResidents,
    currentEmployees,
    empTotalPages,
    filteredEmployees,
    currentFloors,
    floorsList,
    unitTotalPages,
    residentsById,
  };
}