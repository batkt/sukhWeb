import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useGereeJagsaalt } from "@/lib/useGeree";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useKhariltsagchJagsaalt } from "@/lib/useKhariltsagch";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import { useSocket } from "@/context/SocketContext";
import uilchilgee, { getErrorMessage } from "@/lib/uilchilgee";
import { getPaymentStatusLabel } from "@/lib/utils";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
  getResidentToots,
  getResidentDavkhauraud,
  getResidentOrtsuud,
} from "@/lib/residentDataHelper";

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
  sortKey: string,
  sortOrder: "asc" | "desc",
  searchTerm: string,
  unitPage: number,
  unitPageSize: number,
  selectedDawkhar?: string,
  selectedOrtsForContracts?: string,
  statusFilter?: "all" | "active" | "cancelled",
  propertyTab?: "Тоот" | "Зогсоол" | "Агуулах",
) {
  // Stick strictly to selectedBuildingId from context to prevent data leakage from cookie-based barilgiinId
  const effectiveBarilgiinId = selectedBuildingId || undefined;

  const selectedBarilga = baiguullaga?.barilguud?.find(
    (b: any) => String(b._id || b.id) === String(effectiveBarilgiinId),
  );

  const {
    gereeGaralt,
    gereeJagsaaltMutate,
    setGereeKhuudaslalt,
    isValidating: isValidatingGeree,
  } = useGereeJagsaalt(
    {},
    token || undefined,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId,
  );

  const {
    orshinSuugchGaralt,
    orshinSuugchJagsaaltMutate,
    setOrshinSuugchKhuudaslalt,
    isValidating: isValidatingSuugch,
  } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    {},
    effectiveBarilgiinId,
  );

  const {
    KhariltsagchGaralt,
    KhariltsagchJagsaaltMutate,
    setKhariltsagchKhuudaslalt,
    isValidating: isValidatingClient,
  } = useKhariltsagchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    {},
    effectiveBarilgiinId,
  );

  const {
    ajilchdiinGaralt,
    ajiltniiJagsaaltMutate,
    setAjiltniiKhuudaslalt,
    isValidating: isValidatingAjiltan,
  } = useAjiltniiJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    // Keep employee management org-wide. If this is tied to selected building,
    // an employee can disappear from list immediately after unassigning that building.
    undefined,
    {},
  );

  const {
    zagvaruud,
    zagvarJagsaaltMutate,
    isValidating: isValidatingZagvar,
  } = useGereeniiZagvar();

  const socketCtx = useSocket();

  const contracts = gereeGaralt?.jagsaalt || [];
  const residentsList = (orshinSuugchGaralt?.jagsaalt || []) as any[];
  const clientsList = (KhariltsagchGaralt?.jagsaalt || []) as any[];
  const employeesList = (ajilchdiinGaralt?.jagsaalt || []) as any[];

  // Create a map of residents by _id for quick lookup
  const residentsById = useMemo(() => {
    const map: Record<string, any> = {};
    residentsList.forEach((r: any) => {
      if (r?._id) {
        map[String(r._id)] = r;
      }
    });
    clientsList.forEach((r: any) => {
      if (r?._id) {
        map[String(r._id)] = r;
      }
    });
    return map;
  }, [residentsList, clientsList]);

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
          if (n > 0)
            return Array.from({ length: n }).map((_, i) => String(i + 1));
        }
        const parts = s.split(/[\s,;|]+/).filter(Boolean);
        if (parts.length > 0) return parts.map(String);
      }
      return [];
    } catch (e) {
      return [];
    }
  }, [selectedBarilga]);

  const maps = useMemo(() => {
    const parseMap = (map: any) => {
      const out: Record<string, string[]> = {};
      if (map && typeof map === "object" && !Array.isArray(map)) {
        Object.entries(map).forEach(([floor, val]) => {
          let units: string[] = [];
          if (Array.isArray(val)) {
            units = val.flatMap((v) =>
              String(v)
                .split(/[\s,;|]+/)
                .filter(Boolean),
            );
          } else if (typeof val === "string") {
            units = val.split(/[\s,;|]+/).filter(Boolean);
          }
          out[String(floor)] = units;
        });
      }
      return out;
    };

    const tokhirgoo = (selectedBarilga as any)?.tokhirgoo || {};
    const outToot = parseMap(tokhirgoo.davkhariinToonuud);
    const outZogsool = parseMap(tokhirgoo.davkhariinZogsoolnuud);
    const outAguulakh = parseMap(tokhirgoo.davkhariinAguulakhnuud);

    const tok = tokhirgoo.davkhar;
    if (Array.isArray(tok)) {
      tok.forEach((it: any) => {
        const floor = String(it?.davkhar ?? it);
        const list = Array.isArray(it?.toonuud) ? it.toonuud : [];
        // Only add if there are actual unit numbers
        if (floor && list.length > 0) {
          // Route basement/parking floors (B1, B2...) to Зогсоол map
          const isBasement = /^B\d+$/i.test(floor);
          const target = isBasement ? outZogsool : outToot;
          if (!target[floor]) {
            target[floor] = list.map((x: any) => String(x));
          }
        }
      });
    }

    return { outToot, outZogsool, outAguulakh };
  }, [selectedBarilga]);

  const composeKey = useCallback((orts: string, floor: string) => {
    const f = String(floor || "").trim();
    const o = String(orts || "").trim();
    return o ? `${o}::${f}` : f;
  }, []);

  const getTootOptions = useCallback(
    (
      orts: string,
      floor: string,
      turul: "Тоот" | "Зогсоол" | "Агуулах" = "Тоот",
    ) => {
      try {
        const o = String(orts || "").trim();
        const f = String(floor || "").trim();
        const key = composeKey(o, f);

        let activeMap = maps.outToot;
        if (turul === "Зогсоол") activeMap = maps.outZogsool;
        else if (turul === "Агуулах") activeMap = maps.outAguulakh;

        let candidates: string[] = [];
        if (
          activeMap[key] &&
          Array.isArray(activeMap[key]) &&
          activeMap[key].length > 0
        ) {
          candidates = activeMap[key].slice();
        } else if (
          f &&
          activeMap[f] &&
          Array.isArray(activeMap[f]) &&
          activeMap[f].length > 0
        ) {
          candidates = activeMap[f].slice();
        } else if (!f && (turul === "Зогсоол" || turul === "Агуулах")) {
          // If no floor is specified, aggregate all configured units across all floors
          Object.values(activeMap).forEach((val) => {
            if (Array.isArray(val)) {
              candidates.push(...val);
            }
          });
        } else {
          return [];
        }

        const normalized = Array.from(
          new Set(
            candidates
              .flatMap((it) => String(it || "").split(/[\s,;|]+/))
              .map((s) => s.trim())
              .map((s) => s.replace(/[^0-9A-Za-zА-Яа-яӨөҮүёЁ-]/g, ""))
              .filter(Boolean),
          ),
        );

        return normalized;
      } catch (e) {
        return [];
      }
    },
    [maps, composeKey],
  );

  const renderCellValue = useCallback(
    (contract: any, columnKey: string): React.ReactNode => {
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
            return val
              .map((v: any) => getStringValue(v))
              .filter(Boolean)
              .join(", ");
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

        case "duureg": {
          const val = getStringValue(contract.duureg);
          if (val && val !== "-") return val;
          // Fallback to linked resident
          const orshinSuugchId = contract.orshinSuugchId || contract.khariltsagchId;
          if (orshinSuugchId) {
            const resident = residentsById[String(orshinSuugchId)];
            if (resident) {
              const tootsDuureg =
                Array.isArray(resident.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.duureg
                  : null;
              return getStringValue(tootsDuureg ?? resident.duureg) || "-";
            }
          }
          return "-";
        }

        case "horoo": {
          const horoo = contract.horoo;
          if (horoo != null) {
            if (typeof horoo === "object") {
              return (
                getStringValue(horoo.ner) || getStringValue(horoo.kod) || "-"
              );
            }
            const hVal = getStringValue(horoo);
            if (hVal && hVal !== "-") return hVal;
          }
          // Fallback to linked resident
          const orshinSuugchId = contract.orshinSuugchId || contract.khariltsagchId;
          if (orshinSuugchId) {
            const resident = residentsById[String(orshinSuugchId)];
            if (resident) {
              const tootsHoroo =
                Array.isArray(resident.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.horoo
                  : null;
              const residentHoroo = tootsHoroo ?? resident.horoo;
              if (residentHoroo != null) {
                if (typeof residentHoroo === "object") {
                  return (
                    getStringValue(residentHoroo.ner) ||
                    getStringValue(residentHoroo.kod) ||
                    "-"
                  );
                }
                return getStringValue(residentHoroo) || "-";
              }
            }
          }
          return "-";
        }

        case "bairniiNer": {
          const val =
            getStringValue(contract.bairniiNer) ||
            getStringValue(contract.bairNer);
          if (val && val !== "-") return val;
          // Fallback to linked resident
          const orshinSuugchId = contract.orshinSuugchId || contract.khariltsagchId;
          if (orshinSuugchId) {
            const resident = residentsById[String(orshinSuugchId)];
            if (resident) {
              const tootsBairniiNer =
                Array.isArray(resident.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.bairniiNer
                  : null;
              return (
                getStringValue(tootsBairniiNer ?? resident.bairniiNer) || "-"
              );
            }
          }
          return "-";
        }

        case "orts": {
          const val = contract.orts != null ? String(contract.orts) : "";
          if (val && val !== "-") return val;
          // Fallback to linked resident
          const orshinSuugchId = contract.orshinSuugchId || contract.khariltsagchId;
          if (orshinSuugchId) {
            const resident = residentsById[String(orshinSuugchId)];
            if (resident) {
              return getResidentOrtsuud(resident) || "-";
            }
          }
          return "-";
        }

        case "davkhar": {
          const val = contract.davkhar != null ? String(contract.davkhar) : "";
          if (val && val !== "-") return val;
          // Fallback to linked resident
          const orshinSuugchId = contract.orshinSuugchId || contract.khariltsagchId;
          if (orshinSuugchId) {
            const resident = residentsById[String(orshinSuugchId)];
            if (resident) {
              return getResidentDavkhauraud(resident) || "-";
            }
          }
          return "-";
        }

        case "toot": {
          let val = contract.toot != null ? String(contract.toot) : "";
          if (Array.isArray(contract.nemeltTootnuud) && contract.nemeltTootnuud.length > 0) {
            const extra = contract.nemeltTootnuud.map((n: any) => `${n.toot} (${n.turul === "Гараж" ? "Зогсоол" : n.turul})`).join(", ");
            if (val) {
              val = `${val}, ${extra}`;
            } else {
              val = extra;
            }
          }
          if (val && val !== "-") return val;
          // Fallback to linked resident
          const orshinSuugchId = contract.orshinSuugchId || contract.khariltsagchId;
          if (orshinSuugchId) {
            const resident = residentsById[String(orshinSuugchId)];
            if (resident) {
              return getResidentToots(resident) || "-";
            }
          }
          return "-";
        }

        case "utas":
          if (Array.isArray(contract.utas)) {
            return (
              contract.utas
                .map((u: any) => getStringValue(u))
                .filter(Boolean)
                .join(", ") || "-"
            );
          }
          return getStringValue(contract.utas) || "-";

        case "tuluv": {
          const status = String(
            contract.tuluv || contract.status || "Идэвхтэй",
          ).trim();
          const isCancelled =
            status === "Цуцалсан" ||
            status.toLowerCase() === "цуцалсан" ||
            status === "tsutlsasan" ||
            status.toLowerCase() === "tsutlsasan" ||
            status === "Идэвхгүй" ||
            status.toLowerCase() === "идэвхгүй";
          const isActive =
            !isCancelled &&
            (status === "Идэвхтэй" ||
              status.toLowerCase() === "идэвхтэй" ||
              !status ||
              status === "");

          const statusClass = isCancelled
            ? "badge-unpaid bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            : isActive
              ? "badge-paid bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "badge-neutral";

          return React.createElement(
            "span",
            {
              className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs  ${statusClass}`,
            },
            status || "Идэвхтэй",
          );
        }

        case "ognoo": {
          const createdDate = contract.ognoo || contract.createdAt;
          if (!createdDate) return "-";

          try {
            const date = new Date(createdDate);
            if (!isNaN(date.getTime())) {
              return React.createElement(
                "span",
                { className: "text-green-600 dark:text-green-400 font-medium" },
                date.toLocaleDateString("mn-MN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }),
              );
            }
          } catch (e) {}
          return "-";
        }

        case "tsutsalsanOgnoo": {
          const status = String(
            contract.tuluv || contract.status || "Идэвхтэй",
          ).trim();
          const isCancelled =
            status === "Цуцалсан" || status.toLowerCase() === "цуцалсан";
          if (!isCancelled) return "-";

          const rawDate =
            contract.tsutsalsanOgnoo ||
            contract.tsutlsasanOgnoo ||
            contract.tsutlsanOgnoo ||
            contract.updatedAt;
          if (!rawDate) return "-";

          try {
            const date = new Date(rawDate);
            if (!isNaN(date.getTime())) {
              return React.createElement(
                "span",
                { className: "text-red-500 font-medium" },
                date.toLocaleDateString("mn-MN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }),
              );
            }
          } catch (e) {}
          return "-";
        }

        default: {
          const value = contract[columnKey];
          return getStringValue(value) || "-";
        }
      }
    },
    [residentsById],
  );

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
      } else if (sortKey === "ner") {
        const getStr = (v: any) =>
          typeof v === "object" && v !== null
            ? `${v.ner || ""} ${v.kod || ""}`.trim()
            : String(v || "");
        aVal = `${getStr(a?.ovog)} ${getStr(a?.ner)}`.trim().toLowerCase();
        bVal = `${getStr(b?.ovog)} ${getStr(b?.ner)}`.trim().toLowerCase();
      } else if (
        sortKey === "toot" ||
        sortKey === "orts" ||
        sortKey === "davkhar"
      ) {
        let aRaw = String(a?.[sortKey] || "").trim();
        let bRaw = String(b?.[sortKey] || "").trim();

        if (sortKey === "toot") {
          aRaw = String(getResidentToot(a) || a?.toot || "").trim();
          bRaw = String(getResidentToot(b) || b?.toot || "").trim();
        } else if (sortKey === "orts") {
          aRaw = String(getResidentOrts(a) || a?.orts || "").trim();
          bRaw = String(getResidentOrts(b) || b?.orts || "").trim();
        } else if (sortKey === "davkhar") {
          aRaw = String(getResidentDavkhar(a) || a?.davkhar || "").trim();
          bRaw = String(getResidentDavkhar(b) || b?.davkhar || "").trim();
        }

        const aNum = parseInt(aRaw);
        const bNum = parseInt(bRaw);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        } else {
          aVal = aRaw.toLowerCase();
          bVal = bRaw.toLowerCase();
        }
      } else if (sortKey === "utas") {
        aVal = String(a?.utas || "").replace(/[^0-9]/g, "");
        bVal = String(b?.utas || "").replace(/[^0-9]/g, "");
      } else {
        aVal = String(a?.[sortKey] || "")
          .trim()
          .toLowerCase();
        bVal = String(b?.[sortKey] || "")
          .trim()
          .toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [residentsList, searchTerm, sortKey, sortOrder]);

  // Paginate residents
  const resTotalPages = Math.max(
    1,
    Math.ceil(filteredResidents.length / resPageSize),
  );
  const startIndex = (resPage - 1) * resPageSize;
  const currentResidents = filteredResidents.slice(
    startIndex,
    startIndex + resPageSize,
  );

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = [...clientsList];

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

    filtered.sort((a: any, b: any) => {
      let aVal: any = String(a?.[sortKey] || "")
        .trim()
        .toLowerCase();
      let bVal: any = String(b?.[sortKey] || "")
        .trim()
        .toLowerCase();
      if (sortKey === "ner") {
        aVal = `${a?.ovog || ""} ${a?.ner || ""}`.trim().toLowerCase();
        bVal = `${b?.ovog || ""} ${b?.ner || ""}`.trim().toLowerCase();
      } else if (sortKey === "tuluv") {
        aVal = Number(a?.uldegdel ?? a?.ekhniiUldegdel ?? 0);
        bVal = Number(b?.uldegdel ?? b?.ekhniiUldegdel ?? 0);
      } else if (sortKey === "garage_storage") {
        const aToots = (Array.isArray(a?.toots) ? a.toots : []).filter((t: any) => t?.turul === "Гараж" || t?.turul === "Агуулах");
        const bToots = (Array.isArray(b?.toots) ? b.toots : []).filter((t: any) => t?.turul === "Гараж" || t?.turul === "Агуулах");
        aVal = aToots.length > 0 ? String(aToots[0]?.toot || "").toLowerCase() : "zzz";
        bVal = bToots.length > 0 ? String(bToots[0]?.toot || "").toLowerCase() : "zzz";
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clientsList, searchTerm, sortKey, sortOrder]);

  const clientTotalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / resPageSize),
  );
  const currentClients = filteredClients.slice(
    startIndex,
    startIndex + resPageSize,
  );

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    let filtered = [...contracts];

    // ... (filters remain the same) ...
    // Apply orts filter
    if (selectedOrtsForContracts && selectedOrtsForContracts.trim() !== "") {
      const filterOrts = String(selectedOrtsForContracts).trim();
      filtered = filtered.filter((c: any) => {
        const orshinSuugchId = c.orshinSuugchId || c.khariltsagchId;

        // 1. If contract has its own explicit orts, use it strictly
        const cOrts = String(c?.orts || "").trim();
        if (cOrts !== "" && cOrts !== "-") {
          return cOrts === filterOrts;
        }

        // 2. Otherwise, check linked resident's all units
        if (orshinSuugchId && residentsById[String(orshinSuugchId)]) {
          const resident = residentsById[String(orshinSuugchId)];

          // Check all toots
          if (Array.isArray(resident.toots)) {
            if (
              resident.toots.some(
                (t: any) => String(t.orts || "").trim() === filterOrts,
              )
            ) {
              return true;
            }
          }

          // Fallback to resident's top-level orts
          if (String(resident.orts || "").trim() === filterOrts) return true;
        }
        return false;
      });
    }

    if (selectedDawkhar && selectedDawkhar.trim() !== "") {
      const filterDawkhar = String(selectedDawkhar).trim();
      filtered = filtered.filter((c: any) => {
        const orshinSuugchId = c.orshinSuugchId || c.khariltsagchId;

        // 1. If contract has its own explicit davkhar, use it strictly
        const cDavkhar = String(c?.davkhar || "").trim();
        if (cDavkhar !== "" && cDavkhar !== "-") {
          return cDavkhar === filterDawkhar;
        }

        // 2. Otherwise, check linked resident's all units
        if (orshinSuugchId && residentsById[String(orshinSuugchId)]) {
          const resident = residentsById[String(orshinSuugchId)];

          // Check all toots
          if (Array.isArray(resident.toots)) {
            if (
              resident.toots.some(
                (t: any) => String(t.davkhar || "").trim() === filterDawkhar,
              )
            ) {
              return true;
            }
          }

          // Fallback to resident's top-level davkhar
          if (String(resident.davkhar || "").trim() === filterDawkhar)
            return true;
        }
        return false;
      });
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((c: any) => {
        const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
        const isCancelled =
          status === "Цуцалсан" ||
          status.toLowerCase() === "цуцалсан" ||
          status === "tsutlsasan" ||
          status.toLowerCase() === "tsutlsasan" ||
          status === "Идэвхгүй" ||
          status.toLowerCase() === "идэвхгүй";
        const isActive =
          !isCancelled &&
          (status === "Идэвхтэй" ||
            status.toLowerCase() === "идэвхтэй" ||
            !status ||
            status === "");
        if (statusFilter === "active") return isActive;
        if (statusFilter === "cancelled") return isCancelled;
        return true;
      });
    }

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
        aVal = new Date(
          a?.createdAt || a?.ognoo || a?.updatedAt || 0,
        ).getTime();
        bVal = new Date(
          b?.createdAt || b?.ognoo || b?.updatedAt || 0,
        ).getTime();
      } else if (sortKey === "ner") {
        aVal = `${a?.ovog || ""} ${a?.ner || ""}`.trim().toLowerCase();
        bVal = `${b?.ovog || ""} ${b?.ner || ""}`.trim().toLowerCase();
      } else if (
        sortKey === "toot" ||
        sortKey === "orts" ||
        sortKey === "davkhar"
      ) {
        const aValRaw = a?.[sortKey];
        const bValRaw = b?.[sortKey];
        const aResident = (a?.orshinSuugchId || a?.khariltsagchId)
          ? residentsById[String(a.orshinSuugchId || a.khariltsagchId)]
          : null;
        const bResident = (b?.orshinSuugchId || b?.khariltsagchId)
          ? residentsById[String(b.orshinSuugchId || b.khariltsagchId)]
          : null;

        const aRaw = String(aValRaw ?? aResident?.[sortKey] ?? "").trim();
        const bRaw = String(bValRaw ?? bResident?.[sortKey] ?? "").trim();

        const aNum = parseInt(aRaw);
        const bNum = parseInt(bRaw);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        } else {
          aVal = aRaw.toLowerCase();
          bVal = bRaw.toLowerCase();
        }
      } else if (sortKey === "utas") {
        const aUtas = Array.isArray(a?.utas) ? a.utas[0] : a?.utas;
        const bUtas = Array.isArray(b?.utas) ? b.utas[0] : b?.utas;
        aVal = String(aUtas || "").replace(/[^0-9]/g, "");
        bVal = String(bUtas || "").replace(/[^0-9]/g, "");
      } else if (sortKey === "tuluv") {
        aVal = String(a?.tuluv || a?.status || "Идэвхтэй")
          .trim()
          .toLowerCase();
        bVal = String(b?.tuluv || b?.status || "Идэвхтэй")
          .trim()
          .toLowerCase();
      } else {
        aVal = String(a?.[sortKey] || "")
          .trim()
          .toLowerCase();
        bVal = String(b?.[sortKey] || "")
          .trim()
          .toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    contracts,
    searchTerm,
    sortKey,
    sortOrder,
    residentsById,
    selectedDawkhar,
    selectedOrtsForContracts,
    statusFilter,
  ]);

  // Paginate contracts
  const contractStartIndex = (currentPage - 1) * rowsPerPage;
  const currentContracts = filteredContracts.slice(
    contractStartIndex,
    contractStartIndex + rowsPerPage,
  );

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
  const empTotalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / empPageSize),
  );
  const empStartIndex = (empPage - 1) * empPageSize;
  const currentEmployees = filteredEmployees.slice(
    empStartIndex,
    empStartIndex + empPageSize,
  );

  // Compute floors list from davkharOptions and selectedDawkhar filter
  // For Зогсоол and Агуулах, derive floors from their map keys instead
  const floorsList = useMemo(() => {
    let list: string[] = [];
    const activeTab = propertyTab || "Тоот";

    if (activeTab === "Тоот") {
      // Only show floors that actually have unit numbers defined, excluding basement floors (B1, B2, etc.)
      const floorsSet = new Set<string>();
      Object.keys(maps.outToot).forEach((key) => {
        let floorName = "";
        if (key.includes("::")) {
          const parts = key.split("::");
          floorName = parts[1] || parts[0];
        } else {
          floorName = key;
        }
        const isBasement = String(floorName).trim().toLowerCase().startsWith("b");
        if (floorName && !isBasement) {
          floorsSet.add(floorName);
        }
      });
      list = Array.from(floorsSet);
    } else {
      // For Зогсоол / Агуулах, extract unique floor names from the map keys
      const activeMap =
        activeTab === "Зогсоол" ? maps.outZogsool : maps.outAguulakh;
      const floorsSet = new Set<string>();

      // 1. Add configured basement floors from davkharOptions (floors starting with "B" or "b")
      davkharOptions.forEach((d) => {
        const floorStr = String(d).trim();
        if (floorStr.toLowerCase().startsWith("b")) {
          floorsSet.add(floorStr);
        }
      });

      // 2. Add existing floors from the map keys
      Object.keys(activeMap).forEach((key) => {
        // Keys are in format "orts::floor" or just "floor"
        if (key.includes("::")) {
          const parts = key.split("::");
          floorsSet.add(parts[1] || parts[0]);
        } else {
          floorsSet.add(key);
        }
      });
      list = Array.from(floorsSet);
    }

    const sel = String(selectedDawkhar || "").trim();
    if (sel) {
      list = list.filter((d) => String(d) === sel);
    }
    return list;
  }, [davkharOptions, selectedDawkhar, propertyTab, maps]);

  // Paginate floors
  const unitTotalPages = Math.max(
    1,
    Math.ceil(floorsList.length / unitPageSize),
  );
  const unitStartIndex = (unitPage - 1) * unitPageSize;
  const currentFloors = floorsList.slice(
    unitStartIndex,
    unitStartIndex + unitPageSize,
  );

  return {
    contracts,
    residentsList,
    clientsList,
    currentClients,
    clientTotalPages,
    totalClients: filteredClients.length,
    isValidatingClient,
    employeesList,
    davkharOptions,
    ortsOptions,
    tootMap: maps.outToot,
    selectedBarilga,
    zagvaruud,
    socketCtx,
    composeKey,
    getTootOptions,
    renderCellValue,
    gereeJagsaaltMutate,
    orshinSuugchJagsaaltMutate,
    ajiltniiJagsaaltMutate,
    zagvarJagsaaltMutate,
    setGereeKhuudaslalt,
    residentsById,
    isValidatingGeree,
    isValidatingSuugch,
    isValidatingAjiltan,
    isValidatingZagvar,
    // Computed data
    currentContracts,
    totalContracts: filteredContracts.length,
    startIndex: contractStartIndex,
    currentResidents,
    resTotalPages,
    filteredResidents,
    totalResidents: filteredResidents.length,
    currentEmployees,
    empTotalPages,
    filteredEmployees,
    currentFloors,
    floorsList,
    unitTotalPages,
  };
}
