"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, Modal as MModal, Button as MButton } from "@mantine/core";
import {
  Edit,
  Trash2,
  Plus,
  Building2,
  MapPin,
  Users,
  Save,
  Home,
  X,
  ArrowRight,
} from "lucide-react";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
import updateMethod from "../../../../tools/function/updateMethod";
import { useAuth } from "@/lib/useAuth";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import deleteMethod from "../../../../tools/function/deleteMethod";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import Button from "@/components/ui/Button";
import { SettingsCard, SettingsField } from "./SettingsRow";
import { districts, subDistricts } from "./barilgaKhayag";

interface Horoo {
  _id?: string;
  ner: string;
  kod: string;
}

interface Duureg {
  _id?: string;
  ner: string;
  kod: string;
  ded?: Horoo[];
}

interface TatvariinAlbaResponse {
  jagsaalt: Duureg[];
}

interface Ajiltan {
  _id: string;
  [key: string]: any;
  selectedHoroo?: string;
  selectedDuureg?: string;
  selectedDuuregData?: Duureg;
  selectedHorooData?: Horoo;
}

import { useTourSteps } from "@/lib/useTourSteps";

export default function BarilgiinTokhirgoo() {
  const router = useRouter();
  // Register tour steps for barilga
  const tourSteps = useTourSteps("barilga");
  useRegisterTourSteps("/tokhirgoo", tourSteps);

  const { baiguullaga, token, baiguullagaMutate, barilgiinId } = useAuth();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();
  const activeBuildingId = useMemo(() => {
    return (
      selectedBuildingId ||
      barilgiinId ||
      // prefer a real building for this organization (avoid org-level duplicate entry)
      (Array.isArray(baiguullaga?.barilguud)
        ? (() => {
            const orgName = (baiguullaga?.ner || "").trim();
            const isRealBuilding = (b: any) => {
              try {
                const name = (b?.ner || "").trim();
                if (!name) return false;
                // If building name differs from organization name, treat as real building
                if (orgName && name !== orgName) return true;
                // If building has floors/entrances/address/register it is likely a real building
                const tok = b?.tokhirgoo || {};
                if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
                  return true;
                if (tok?.orts || b?.khayag || b?.register) return true;
              } catch (_) {}
              return false;
            };

            // Prefer the first building that looks like an actual building for this org
            const preferred = baiguullaga.barilguud.find(
              (b: any) =>
                (String(b.baiguullagiinId) === String(baiguullaga._id) ||
                  !b.baiguullagiinId) &&
                isRealBuilding(b),
            );
            if (preferred) return preferred._id;

            // Fallback: any building belonging to this org
            const anyForOrg = baiguullaga.barilguud.find(
              (b: any) =>
                !b?.baiguullagiinId ||
                String(b.baiguullagiinId) === String(baiguullaga._id),
            );
            return anyForOrg?._id ?? null;
          })()
        : null)
    );
  }, [selectedBuildingId, barilgiinId, baiguullaga?.barilguud]);

  const barilga = useMemo(() => {
    return baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(activeBuildingId),
    );
  }, [baiguullaga?.barilguud, activeBuildingId]);

  // Filter buildings that belong to this organization (baiguullagiinId) or lack the field
  const orgBuildings = useMemo(() => {
    if (!Array.isArray(baiguullaga?.barilguud)) return [];
    return baiguullaga!.barilguud!.filter(
      (b: any) =>
        !b?.baiguullagiinId ||
        String(b.baiguullagiinId) === String(baiguullaga?._id),
    );
  }, [baiguullaga]);

  useEffect(() => {
    const list = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!.filter(
          (b: any) =>
            !b?.baiguullagiinId ||
            String(b.baiguullagiinId) === String(baiguullaga!._id),
        )
      : [];

    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("selectedBuildingId")
        : null;
    if (baiguullaga && !selectedBuildingId && !stored && list.length > 0) {
      const orgName = (baiguullaga?.ner || "").trim();
      const isRealBuilding = (b: any) => {
        try {
          const name = (b?.ner || "").trim();
          if (!name) return false;
          if (orgName && name !== orgName) return true;
          const tok = b?.tokhirgoo || {};
          if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
            return true;
          if (tok?.orts || b?.khayag || b?.register) return true;
        } catch (_) {}
        return false;
      };

      const preferred = list.find(isRealBuilding) || list[0];
      setSelectedBuildingId(String(preferred._id));
    }
  }, [
    baiguullaga?.barilguud,
    selectedBuildingId,
    setSelectedBuildingId,
    baiguullaga,
  ]);

  const [barilgaNer, setBarilgaNer] = useState<string>("");

  // allow empty string while editing so user can clear the field without it immediately becoming 0
  const [davkharCount, setDavkharCount] = useState<number | "">(0);
  // entrances (орц) as numeric count like давхар
  const [ortsCount, setOrtsCount] = useState<number | "">(0);
  const [isInit, setIsInit] = useState<boolean>(false);


  // State from UndsenMedeelel
  const [state, setState] = useState<Ajiltan>({ _id: "" });
  const [tatvariinAlbaData, setTatvariinAlbaData] =
    useState<TatvariinAlbaResponse | null>(null);
  const [sohNer, setSohNer] = useState<string>("");
  const [sukhDugaar, setSukhDugaar] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState({
    selectedDuureg: "",
    selectedHoroo: "",
    sohNer: "",
    sukhDugaar: "",
    email: "",
  });


  // Initialize basic info only
  useEffect(() => {
    if (!barilga) {
      setBarilgaNer("");
      setOrtsCount(0);
      setDavkharCount(0);
      setIsInit(true);
      return;
    }
    try {
      setBarilgaNer(barilga?.ner || "");
      // initialize entrances (orts) and floor count from barilga tokhirgoo

      const davFrom = (barilga?.tokhirgoo as any)?.davkhar || [];
      // davkhar can be array or number; normalize to count
      const davCount = Array.isArray(davFrom)
        ? davFrom.length
        : Number(davFrom) || 0;
      setDavkharCount(davCount);
      const ortsFrom = (barilga?.tokhirgoo as any)?.orts || [];
      const _ortsCount = Array.isArray(ortsFrom)
        ? ortsFrom.length
        : Number(ortsFrom) || 0;
      setOrtsCount(_ortsCount);
      setIsInit(true);
    } catch (_) {
      setIsInit(true);
    }
  }, [barilga]);

  // useEffects from UndsenMedeelel - modified to use hardcoded data
  useEffect(() => {
    // Initialize with hardcoded data instead of API call
    setTatvariinAlbaData({
      jagsaalt: Object.keys(districts).flatMap((city) =>
        districts[city].map((district) => ({
          _id: district,
          ner: district,
          kod: district,
          ded:
            subDistricts[district]?.map((horoo) => ({
              _id: horoo,
              ner: horoo,
              kod: horoo,
            })) || [],
        })),
      ),
    });

    // Preload sohNer if available - prefer selected building, then first building, then org-level, then org name
    const effBarilgaId = selectedBuildingId || null;
    const allBuildings = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!
      : [];
    const selectedBarilga = effBarilgaId
      ? allBuildings.find((b: any) => String(b._id) === String(effBarilgaId))
      : allBuildings[0];
    if (selectedBarilga?.tokhirgoo?.sohNer) {
      setSohNer(String(selectedBarilga.tokhirgoo.sohNer));
      // try to set phone/email from building tokhirgoo (best-effort)
      const ut =
        (selectedBarilga as any).tokhirgoo?.utas ||
        (selectedBarilga as any).utas ||
        [];
      const ml =
        (selectedBarilga as any).tokhirgoo?.mail ||
        (selectedBarilga as any).mail ||
        [];
      setSukhDugaar(String((Array.isArray(ut) ? ut[0] : ut) || ""));
      setEmail(String((Array.isArray(ml) ? ml[0] : ml) || ""));
    } else if (
      baiguullaga?.tokhirgoo &&
      (baiguullaga.tokhirgoo as any)?.sohNer
    ) {
      setSohNer(String((baiguullaga.tokhirgoo as any).sohNer));
      const ut =
        (baiguullaga as any).tokhirgoo?.utas || (baiguullaga as any).utas || [];
      const ml =
        (baiguullaga as any).tokhirgoo?.mail || (baiguullaga as any).mail || [];
      setSukhDugaar(String((Array.isArray(ut) ? ut[0] : ut) || ""));
      setEmail(String((Array.isArray(ml) ? ml[0] : ml) || ""));
    } else if (baiguullaga?.ner) {
      setSohNer(String(baiguullaga.ner));
      const ut = (baiguullaga as any).utas || [];
      const ml = (baiguullaga as any).mail || [];
      setSukhDugaar(String((Array.isArray(ut) ? ut[0] : ut) || ""));
      setEmail(String((Array.isArray(ml) ? ml[0] : ml) || ""));
    }
  }, [selectedBuildingId, baiguullaga]);

  // Initialize form state and initial snapshot whenever relevant data or selection changes
  useEffect(() => {
    if (!tatvariinAlbaData?.jagsaalt) return;

    // Prefer selected building tokhirgoo; fallback to org-level (no localStorage)
    const effBarilgaId = selectedBuildingId || null;
    const allBuildings = Array.isArray(baiguullaga?.barilguud)
      ? baiguullaga!.barilguud!
      : [];
    const selectedBarilga = effBarilgaId
      ? allBuildings.find((b: any) => String(b._id) === String(effBarilgaId))
      : allBuildings[0];
    const effectiveTokhirgoo = (selectedBarilga?.tokhirgoo ||
      baiguullaga?.tokhirgoo) as any;

    // Derive SÖH name first to avoid async setState timing issues
    // Prefer a first "real" building that is not just a duplicate of organization
    const firstBuilding = (() => {
      if (
        !Array.isArray(baiguullaga?.barilguud) ||
        baiguullaga.barilguud.length === 0
      )
        return null;
      const orgName = (baiguullaga?.ner || "").trim();
      const isRealBuilding = (b: any) => {
        try {
          const name = (b?.ner || "").trim();
          if (!name) return false;
          if (orgName && name !== orgName) return true;
          const tok = b?.tokhirgoo || {};
          if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
            return true;
          if (tok?.orts || b?.khayag || b?.register) return true;
        } catch (_) {}
        return false;
      };
      return (
        baiguullaga.barilguud.find(isRealBuilding) || baiguullaga.barilguud[0]
      );
    })();
    const derivedSohNer = selectedBarilga?.tokhirgoo?.sohNer
      ? String(selectedBarilga.tokhirgoo.sohNer)
      : firstBuilding?.tokhirgoo?.sohNer
        ? String(firstBuilding.tokhirgoo.sohNer)
        : (baiguullaga?.tokhirgoo as any)?.sohNer
          ? String((baiguullaga!.tokhirgoo as any).sohNer)
          : baiguullaga?.ner
            ? String(baiguullaga.ner)
            : "";

    // Find duureg and horoo matches from hardcoded data
    let duuregMatch: Duureg | undefined;
    let horooMatch: Horoo | undefined;
    if (effectiveTokhirgoo) {
      const tok = effectiveTokhirgoo as any;
      const dName = tok?.duuregNer || (baiguullaga as any)?.duureg || "";
      const hName = tok?.horoo?.ner || (baiguullaga as any)?.horoo?.ner || "";
      if (dName) {
        duuregMatch = tatvariinAlbaData.jagsaalt.find((d) => d.ner === dName);
      }
      if (duuregMatch) {
        horooMatch = (duuregMatch.ded || []).find((h) => h.ner === hName);
      }
    }

    // Apply to state (reset to the currently selected building's values)
    setState((s) => ({
      ...s,
      selectedDuureg: duuregMatch?._id || "",
      selectedDuuregData: duuregMatch || undefined,
      selectedHoroo: horooMatch?.kod || "",
      selectedHorooData: horooMatch || undefined,
    }));
    setSohNer(derivedSohNer);

    // Derive contact fields (phone/email) from selected building, then org
    const rawPhone =
      (selectedBarilga as any)?.tokhirgoo?.utas ||
      (selectedBarilga as any)?.utas ||
      (baiguullaga as any)?.tokhirgoo?.utas ||
      (baiguullaga as any)?.utas ||
      [];
    const rawEmail =
      (selectedBarilga as any)?.tokhirgoo?.mail ||
      (selectedBarilga as any)?.mail ||
      (baiguullaga as any)?.tokhirgoo?.mail ||
      (baiguullaga as any)?.mail ||
      [];
    const derivedPhone = Array.isArray(rawPhone) ? rawPhone[0] : rawPhone || "";
    const derivedEmail = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail || "";

    // Capture initial snapshot for dirty-checking for the current selection
    setInitialValues({
      selectedDuureg: duuregMatch?._id || "",
      selectedHoroo: horooMatch?.kod || "",
      sohNer: derivedSohNer,
      sukhDugaar: derivedPhone || "",
      email: derivedEmail || "",
    });
  }, [tatvariinAlbaData, baiguullaga, selectedBuildingId]);
  // Update sohNer state when baiguullaga changes (after save operations)
  useEffect(() => {
    // Prefer a first "real" building when deriving sohNer and initial values
    const firstBuilding = (() => {
      if (
        !Array.isArray(baiguullaga?.barilguud) ||
        baiguullaga.barilguud.length === 0
      )
        return null;
      const orgName = (baiguullaga?.ner || "").trim();
      const isRealBuilding = (b: any) => {
        try {
          const name = (b?.ner || "").trim();
          if (!name) return false;
          if (orgName && name !== orgName) return true;
          const tok = b?.tokhirgoo || {};
          if (Array.isArray(tok?.davkhar) && tok.davkhar.length > 0)
            return true;
          if (tok?.orts || b?.khayag || b?.register) return true;
        } catch (_) {}
        return false;
      };
      return (
        baiguullaga.barilguud.find(isRealBuilding) || baiguullaga.barilguud[0]
      );
    })();

    if (firstBuilding?.tokhirgoo?.sohNer) {
      setSohNer(String(firstBuilding.tokhirgoo.sohNer));
    } else if ((baiguullaga as any)?.sohNer) {
      setSohNer(String((baiguullaga as any).sohNer));
    } else if (
      baiguullaga?.tokhirgoo &&
      (baiguullaga.tokhirgoo as any)?.sohNer
    ) {
      setSohNer(String((baiguullaga.tokhirgoo as any).sohNer));
    }

    // Also update contact fields (phone/email) from the server-provided
    // selected building first, then organization-level tokhirgoo, then
    // top-level arrays. This is executed directly (no nested hooks).
    try {
      const serverOrg = baiguullaga as any;
      const sel = barilga as any;
      let phone: any = "";
      let mailAddr: any = "";

      if (sel) {
        const sbTok = sel.tokhirgoo || {};
        const sbU = sbTok.utas ?? sel.utas ?? [];
        const sbM = sbTok.mail ?? sel.mail ?? [];
        if (Array.isArray(sbU) && sbU.length > 0) phone = sbU[0];
        else if (sbU && !Array.isArray(sbU)) phone = sbU;
        if (Array.isArray(sbM) && sbM.length > 0) mailAddr = sbM[0];
        else if (sbM && !Array.isArray(sbM)) mailAddr = sbM;
      }

      if (!phone) {
        const orgTok = (serverOrg?.tokhirgoo as any) || {};
        const orgU = orgTok.utas ?? serverOrg?.utas ?? [];
        if (Array.isArray(orgU) && orgU.length > 0) phone = orgU[0];
        else if (orgU && !Array.isArray(orgU)) phone = orgU;
      }

      if (!mailAddr) {
        const orgTok = (serverOrg?.tokhirgoo as any) || {};
        const orgM = orgTok.mail ?? serverOrg?.mail ?? [];
        if (Array.isArray(orgM) && orgM.length > 0) mailAddr = orgM[0];
        else if (orgM && !Array.isArray(orgM)) mailAddr = orgM;
      }

      setSukhDugaar(String(phone || ""));
      setEmail(String(mailAddr || ""));
      setInitialValues((prev) => ({
        ...prev,
        sukhDugaar: String(phone || ""),
        email: String(mailAddr || ""),
      }));
    } catch (e) {
      // ignore
    }
  }, [baiguullaga, barilga, selectedBuildingId]);

  // Helper to fetch the latest organization data without building filters
  // This is used before every map/filter update of the barilguud array
  // to prevent accidental deletion of buildings that may be missing from
  // the current component state due to building-level filtering.
  const fetchFreshOrg = async () => {
    if (!token || !baiguullaga?._id) return null;
    const res = await uilchilgee(token).get(`/baiguullaga/${baiguullaga._id}`, {
      headers: { "X-Org-Only": "1" },
    });
    return res.data;
  };




  const handleDeleteBuilding = async (id: string) => {
    // open confirm modal instead of immediate delete
    if (!token) return openErrorOverlay("Нэвтрэх шаардлагатай");
    if (!baiguullaga?._id) return openErrorOverlay("Байгууллага олдсонгүй");
    const building = baiguullaga?.barilguud?.find(
      (b: any) => String(b._id) === String(id),
    );
    setBuildingToDelete({ id: String(id), ner: building?.ner || "" });
    setDeleteModalOpen(true);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<{
    id: string;
    ner?: string;
  } | null>(null);

  // Transfer modal state - only for specific baiguullagiinId
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [buildingToTransfer, setBuildingToTransfer] = useState<{
    id: string;
    ner?: string;
  } | null>(null);
  const [targetOrgId, setTargetOrgId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState<
    Array<{ _id: string; ner: string }>
  >([]);

  // Check if this is the specific baiguullagiinId
  const isTransferEnabled = useMemo(() => {
    return String(baiguullaga?._id) === "698e7fd3b6dd386b6c56a808";
  }, [baiguullaga?._id]);

  // Fetch available organizations when transfer modal opens
  useEffect(() => {
    if (transferModalOpen && token) {
      const fetchOrgs = async () => {
        try {
          // Use a different endpoint structure to avoid route conflict
          // Try using query parameters with a specific action
          const response = await uilchilgee(token).get("/baiguullaga", {
            params: {
              action: "list", // Signal that we want a list
              getAll: true, // Alternative parameter
            },
          });

          if (response.data) {
            let orgs: any[] = [];
            if (Array.isArray(response.data)) {
              orgs = response.data;
            } else if (
              response.data.jagsaalt &&
              Array.isArray(response.data.jagsaalt)
            ) {
              orgs = response.data.jagsaalt;
            } else if (
              response.data.list &&
              Array.isArray(response.data.list)
            ) {
              orgs = response.data.list;
            } else if (
              response.data.data &&
              Array.isArray(response.data.data)
            ) {
              orgs = response.data.data;
            }

            // Filter out current organization
            const filtered = orgs
              .filter(
                (org: any) =>
                  org &&
                  org._id &&
                  String(org._id) !== String(baiguullaga?._id),
              )
              .map((org: any) => ({
                _id: org._id,
                ner: org.ner || org.name || "",
              }));
            setAvailableOrgs(filtered);
          } else {
            // If no data, set empty array (user might not have access to list all orgs)
            setAvailableOrgs([]);
          }
        } catch (error: any) {
          console.error("Failed to fetch organizations:", error);
          // Don't show error overlay - just log and set empty array
          // The user can still manually enter the target org ID if needed
          setAvailableOrgs([]);
          // Only show error if it's not a 404 or similar expected error
          if (error?.response?.status !== 404) {
            console.warn(
              "Could not fetch organization list. User may need to contact admin for target organization ID.",
            );
          }
        }
      };
      fetchOrgs();
    } else {
      setAvailableOrgs([]);
    }
  }, [transferModalOpen, token, baiguullaga?._id]);

  // Handle building transfer
  const handleTransferBuilding = async () => {
    if (!buildingToTransfer?.id || !targetOrgId || !token) {
      if (!targetOrgId) {
        openErrorOverlay("Байгууллага сонгоно уу");
      }
      return;
    }

    setIsTransferring(true);
    try {
      const response = await uilchilgee(token).post(
        "/transformation/transformBarilga",
        {
          oldBaiguullagiinId: baiguullaga?._id,
          newBaiguullagiinId: targetOrgId,
          barilgiinId: buildingToTransfer.id,
        },
      );

      if (response.status === 200 || response.status === 201) {
        openSuccessOverlay("Барилга амжилттай шилжүүллээ");
        setTransferModalOpen(false);
        setBuildingToTransfer(null);
        setTargetOrgId("");
        // Refresh the building list
        if (baiguullagaMutate) {
          baiguullagaMutate();
        }
      } else {
        throw new Error("Transfer failed");
      }
    } catch (error: any) {
      console.error("Transfer error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Шилжүүлэх явцад алдаа гарлаа";
      openErrorOverlay(errorMsg);
    } finally {
      setIsTransferring(false);
    }
  };

  const confirmDeleteBuilding = async () => {
    const id = buildingToDelete?.id;
    if (!id) return setDeleteModalOpen(false);
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллага олдсонгүй");
      return;
    }

    try {
      const resp = await deleteMethod(
        `baiguullaga/${baiguullaga._id}/barilga`,
        token,
        id
      );

      if (resp?.data) {
        const finalData = resp.data.result || resp.data;
        await baiguullagaMutate(finalData, false);
      } else {
        await baiguullagaMutate();
      }

      openSuccessOverlay("Барилга устгагдлаа");

      // If deleted building was selected, pick first available or clear
      const freshOrg = await fetchFreshOrg();
      const updatedBarilguud = freshOrg?.barilguud || [];

      if (String(selectedBuildingId) === String(id)) {
        const first = (updatedBarilguud || []).find(
          (b: any) =>
            !b?.baiguullagiinId ||
            String(b.baiguullagiinId) === String(baiguullaga._id),
        );
        setSelectedBuildingId(first?._id ? String(first._id) : null);
      }
      setDeleteModalOpen(false);
      setBuildingToDelete(null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Барилга устгах явцад алдаа гарлаа";
      openErrorOverlay(msg);
    }
  };


  // Functions from UndsenMedeelel
  const handleDuuregChange = (duuregName: string) => {
    setState((s) => ({
      ...s,
      selectedDuureg: duuregName,
      selectedDuuregData: {
        _id: duuregName,
        ner: duuregName,
        kod: duuregName,
      } as Duureg,
      selectedHoroo: "",
      selectedHorooData: undefined,
    }));
  };

  const handleHorooChange = (horooName: string) => {
    if (!state.selectedDuureg) {
      openErrorOverlay("Дүүрэг эхлээд сонгоно уу");
      return;
    }
    const horooData = {
      _id: horooName,
      ner: horooName,
      kod: horooName,
    } as Horoo;
    setState((s) => ({
      ...s,
      selectedHoroo: horooName,
      selectedHorooData: horooData,
    }));
  };

  const khadgalakh = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх токен олдсонгүй");
      return;
    }

    if (!baiguullaga?._id) {
      openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
      return;
    }

    // Check if there are any changes
    const hasChanges =
      state.selectedDuureg !== initialValues.selectedDuureg ||
      state.selectedHoroo !== initialValues.selectedHoroo ||
      sohNer.trim() !== (initialValues.sohNer || "").trim() ||
      (sukhDugaar || "") !== (initialValues.sukhDugaar || "") ||
      (email || "") !== (initialValues.email || "");

    if (!hasChanges) {
      openErrorOverlay("Өөрчлөлт байхгүй байна");
      return;
    }

    if (!state.selectedDuuregData) {
      openErrorOverlay("Дүүрэг сонгоно уу");
      return;
    }

    if (!state.selectedHorooData) {
      openErrorOverlay("Хороо сонго уу");
      return;
    }

    // Validate contacts if provided: phone must be exactly 8 digits, email must contain '@'
    if (sukhDugaar && !/^\d{8}$/.test(sukhDugaar)) {
      openErrorOverlay("Утас 8 оронтой тоо байх ёстой");
      return;
    }
    if (email && !/@/.test(email)) {
      openErrorOverlay("Имэйл хаяг зөв байх ёстой (@ агуулагдана)");
      return;
    }

    setIsSaving(true);

    try {
      const freshOrg = await fetchFreshOrg();
      if (!freshOrg) {
        openErrorOverlay("Байгууллагын мэдээлэл шинэчлэхэд алдаа гарлаа");
        setIsSaving(false);
        return;
      }
      const duuregKod = state.selectedDuuregData.kod || "";
      const horooKod = state.selectedHorooData.kod || "";
      const districtCodeCombined = `${duuregKod}${horooKod}`;

      // Ensure we have a valid sohNer value
      const finalSohNer = sohNer || baiguullaga?.ner || "";

      // Propagate shared location and SÖH name across all buildings too
      const newTokhirgoo = {
        ...(baiguullaga?.tokhirgoo || {}),
        duuregNer: state.selectedDuuregData.ner,
        districtCode: districtCodeCombined,
        horoo: {
          ner: state.selectedHorooData.ner,
          kod: state.selectedHorooData.kod,
        },
        sohNer: finalSohNer,
        // persist contact info as arrays per backend shape
        utas: sukhDugaar
          ? [sukhDugaar]
          : (baiguullaga as any)?.tokhirgoo?.utas ||
            (baiguullaga as any)?.utas ||
            [],
        mail: email
          ? [email]
          : (baiguullaga as any)?.tokhirgoo?.mail ||
            (baiguullaga as any)?.mail ||
            [],
      } as any;

      // Update only the selected building's tokhirgoo (do NOT overwrite other buildings)
      const targetBuildingId =
        activeBuildingId || selectedBuildingId || barilgiinId;
      const newBarilguud = (freshOrg.barilguud || []).map((b: any) => {
        if (!targetBuildingId || String(b._id) !== String(targetBuildingId))
          return b;
        return {
          ...b,
          baiguullagiinId: b.baiguullagiinId || baiguullaga?._id,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            duuregNer: newTokhirgoo.duuregNer,
            districtCode: newTokhirgoo.districtCode,
            horoo: { ...(newTokhirgoo.horoo || {}) },
            sohNer: newTokhirgoo.sohNer,
          },
        };
      });

      // Build updated org-level tokhirgoo to include contact fields and location
      // so the backend will save them against the current organization
      const orgTokhirgoo = {
        ...(baiguullaga?.tokhirgoo || {}),
        duuregNer: state.selectedDuuregData.ner,
        districtCode: districtCodeCombined,
        horoo: {
          ner: state.selectedHorooData.ner,
          kod: state.selectedHorooData.kod,
        },
        sohNer: finalSohNer,
        utas: sukhDugaar
          ? [sukhDugaar]
          : (baiguullaga as any)?.tokhirgoo?.utas ||
            (baiguullaga as any)?.utas ||
            [],
        mail: email
          ? [email]
          : (baiguullaga as any)?.tokhirgoo?.mail ||
            (baiguullaga as any)?.mail ||
            [],
      } as any;

      const payload = {
        ...freshOrg,
        eBarimtAutomataarIlgeekh:
          typeof freshOrg?.eBarimtAutomataarIlgeekh === "boolean"
            ? freshOrg.eBarimtAutomataarIlgeekh
            : false,
        nuatTulukhEsekh:
          typeof freshOrg?.nuatTulukhEsekh === "boolean"
            ? freshOrg.nuatTulukhEsekh
            : false,
        eBarimtAshiglakhEsekh: freshOrg?.eBarimtAshiglakhEsekh ?? true,
        eBarimtShine: freshOrg?.eBarimtShine ?? false,
        // write updated org-level tokhirgoo (including utas/mail)
        tokhirgoo: orgTokhirgoo,
        // also keep top-level utas/mail in sync
        utas: orgTokhirgoo.utas || [],
        mail: orgTokhirgoo.mail || [],
        duureg: state.selectedDuuregData.ner,
        horoo: {
          ner: state.selectedHorooData.ner,
          kod: state.selectedHorooData.kod,
        },
        barilguud: newBarilguud,
      } as any;

      const updated = await updateMethod("baiguullaga", token, payload);

      if (updated?.data) {
        const finalData = updated.data.result || updated.data;
        // Optimistically update cache with server response
        await baiguullagaMutate(finalData, false);

        // Also update local UI state from the server response so contacts show immediately
        try {
          const server = updated.data as any;
          const serverTok = server.tokhirgoo || {};
          const serverUtas = Array.isArray(serverTok?.utas)
            ? serverTok.utas
            : Array.isArray(server?.utas)
              ? server.utas
              : serverTok?.utas
                ? [serverTok.utas]
                : server?.utas
                  ? [server.utas]
                  : [];
          const serverMail = Array.isArray(serverTok?.mail)
            ? serverTok.mail
            : Array.isArray(server?.mail)
              ? server.mail
              : serverTok?.mail
                ? [serverTok.mail]
                : server?.mail
                  ? [server.mail]
                  : [];
          setSukhDugaar(String(serverUtas[0] || ""));
          setEmail(String(serverMail[0] || ""));
          // update displayed SÖH name if server provided one
          if (serverTok?.sohNer) setSohNer(String(serverTok.sohNer));
          // reflect saved values in initial snapshot
          setInitialValues((prev) => ({
            ...prev,
            sukhDugaar: String(serverUtas[0] || ""),
            email: String(serverMail[0] || ""),
            sohNer: String(
              serverTok?.sohNer || server.ner || prev.sohNer || "",
            ),
          }));
        } catch (e) {
          // ignore UI-sync errors
        }
      }

      // Show success overlay
      openSuccessOverlay("Амжилттай хадгаллаа", 2000);

      // Revalidate in background
      const revalidated = await baiguullagaMutate();

      // Removed localStorage persistence for API-backed tokhirgoo

      // Update initial values after successful save (include contact fields)
      setInitialValues({
        selectedDuureg: state.selectedDuureg || "",
        selectedHoroo: state.selectedHoroo || "",
        sohNer: sohNer || "",
        sukhDugaar: sukhDugaar || "",
        email: email || "",
      });

      // Stay on the current tab after save
    } catch (err) {
      aldaaBarigch(err);
      openErrorOverlay("Хадгалахад алдаа гарлаа");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDistrict = tatvariinAlbaData?.jagsaalt.find(
    (d) => d._id === state.selectedDuureg,
  );

  // Derived dirty flag for UI (disable Save when no changes)
  const isDirty = useMemo(() => {
    return (
      (state.selectedDuureg || "") !== (initialValues.selectedDuureg || "") ||
      (state.selectedHoroo || "") !== (initialValues.selectedHoroo || "") ||
      (sohNer || "").trim() !== (initialValues.sohNer || "").trim() ||
      (sukhDugaar || "") !== (initialValues.sukhDugaar || "") ||
      (email || "") !== (initialValues.email || "")
    );
  }, [
    state.selectedDuureg,
    state.selectedHoroo,
    sohNer,
    sukhDugaar,
    email,
    initialValues,
  ]);

  // Register tour steps for BarilgiinTokhirgoo
  const barilgaTourSteps: DriverStep[] = useMemo(() => {
    return [
      {
        element: "#barilgiin-panel",
        popover: {
          title: "Барилгын тохиргоо",
          description:
            "Эндээс СӨХ / барилгын үндсэн тохиргоонууд (СӨХ нэр, хаяг, холбоо) болон барилгуудыг удирдна.",
          side: "bottom",
        },
      },
      {
        element: "#barilgiin-soh-name",
        popover: {
          title: "СӨХ-ийн нэр",
          description: "СӨХ (удирдлагын нэр) өөрчлөх боломжтой талбар.",
          side: "right",
        },
      },

      {
        element: "#barilgiin-phone",
        popover: {
          title: "Утас",
          description: "СӨХ-ийн холбоо барих утасны дугаар.",
          side: "left",
        },
      },
      {
        element: "#barilgiin-email",
        popover: {
          title: "Email",
          description: "СӨХ-ийн холбогдох и-мэйл хаяг.",
          side: "left",
        },
      },
      {
        element: "#barilgiin-duureg",
        popover: {
          title: "Дүүрэг",
          description: "Барилгын дүүрэг/хаягийг эндээс сонгон тохируулна.",
          side: "right",
        },
      },
      {
        element: "#barilgiin-horoo",
        popover: {
          title: "Хороо",
          description: "Дүүрэг сонгосны дараа хороо(г) сонгоно.",
          side: "right",
        },
      },
      {
        element: "#barilgiin-buildings-list",
        popover: {
          title: "Бүртгэлтэй барилгууд",
          description:
            "Эндээс байгууллагад хамаарах барилгуудын жагсаалтыг харах, засах, устгах боломжтой.",
          side: "top",
        },
      },
      {
        element: "#barilgiin-new-building-btn",
        popover: {
          title: "Шинэ барилга нэмэх",
          description:
            "Шинэ барилга нэмэх товч. Барилга нэмэхдээ орц/давхарын тоог оруулна.",
          side: "left",
        },
      },
    ];
  }, []);

  useRegisterTourSteps("/tokhirgoo/BarilgiinTokhirgoo", barilgaTourSteps);
  // Also register under the parent pathname so the tour is available
  // when the browser URL is `/tokhirgoo` (parent page renders this child).
  useRegisterTourSteps("/tokhirgoo", barilgaTourSteps);

  // Removed save handler since орц/давхар settings are no longer editable from here

  if (!isInit) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  const barilgaEsekhSongogdson = (id: string) =>
    String(selectedBuildingId || barilga?._id || "") === id;

  return (
    <div id="barilgiin-panel" className="w-full">
      <div>
        <SettingsCard
          icon={<Users className="h-4 w-4" />}
          title="СӨХ-ийн мэдээлэл"
          subtitle="Оршин суугчдад харагдах холбоо барих мэдээлэл"
          onSave={isDirty ? khadgalakh : undefined}
          saving={isSaving}
        >
          <div className="stg-grid">
            <SettingsField label="СӨХ-ийн нэр">
              <input
                id="barilgiin-soh-name"
                type="text"
                value={sohNer}
                onChange={(e) => setSohNer(e.target.value)}
                className="stg-input"
                disabled
              />
            </SettingsField>
            <SettingsField label="Хаяг">
              <input
                type="text"
                value={baiguullaga?.khayag || ""}
                placeholder="—"
                className="stg-input"
                disabled
                readOnly
              />
            </SettingsField>
              <SettingsField label="Утас">
                <input
                  id="barilgiin-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={8}
                  value={sukhDugaar}
                  onChange={(e) => setSukhDugaar(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="8 оронтой дугаар"
                  className="stg-input tabular-nums"
                />
              </SettingsField>
              <SettingsField label="Имэйл">
                <input
                  id="barilgiin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.mn"
                  className="stg-input"
                />
              </SettingsField>
          </div>
          <p className="mt-2 text-[12px] text-[color:var(--muted-text)]">
            СӨХ-ийн нэр, хаягийг гэрээний мэдээллээс авдаг тул энд засах боломжгүй.
          </p>
        </SettingsCard>

        <SettingsCard
          icon={<Home className="h-4 w-4" />}
          title="Барилгууд"
          subtitle={
            orgBuildings?.length
              ? `${orgBuildings.length} барилга бүртгэлтэй. Нэр дээр дарж идэвхтэй барилгаа сонгоно.`
              : "Бүртгэлтэй барилга алга"
          }
          toggle={
            <button
              id="barilgiin-new-building-btn"
              type="button"
              onClick={() => router.push("/tokhirgoo/barilga/shine")}
              className="stg-btn stg-btn-primary"
            >
              <Plus className="h-4 w-4" />
              Барилга нэмэх
            </button>
          }
        >
          {orgBuildings && orgBuildings.length > 0 ? (
            <ul
              id="barilgiin-buildings-list"
              className="max-h-80 divide-y divide-[color:var(--surface-border)] overflow-y-auto rounded-xl border border-[color:var(--surface-border)]"
            >
              {orgBuildings.map((b: any) => {
                const idevkhtei = barilgaEsekhSongogdson(String(b._id));
                return (
                  <li
                    key={b._id}
                    className={`group flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      idevkhtei ? "bg-theme/5" : "hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <button
                      id={`barilgiin-select-${b._id}`}
                      type="button"
                      onClick={() => setSelectedBuildingId(String(b._id))}
                      className="flex min-h-[32px] min-w-0 flex-1 items-center gap-2.5 text-left text-[14px]"
                    >
                      <Building2
                        className={`h-4 w-4 shrink-0 ${idevkhtei ? "text-brand" : "text-[color:var(--muted-text)]"}`}
                      />
                      <span className={`truncate ${idevkhtei ? "text-brand" : "text-[color:var(--panel-text)]"}`}>
                        {b.ner || "Нэргүй барилга"}
                      </span>
                      {idevkhtei && (
                        <span className="shrink-0 rounded-full bg-theme/10 px-2 py-0.5 text-[11px] text-brand">
                          Идэвхтэй
                        </span>
                      )}
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {isTransferEnabled && (
                        <button
                          id={`barilgiin-transfer-${b._id}`}
                          type="button"
                          onClick={() => {
                            setBuildingToTransfer({ id: String(b._id), ner: b.ner || "" });
                            setTransferModalOpen(true);
                          }}
                          title="Шилжүүлэх"
                          className="rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-brand"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        id={`barilgiin-edit-${b._id}`}
                        type="button"
                        onClick={() => router.push(`/tokhirgoo/barilga/${b._id}`)}
                        title="Засах — нэр, орц, давхар"
                        className="rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-brand"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        id={`barilgiin-delete-${b._id}`}
                        type="button"
                        onClick={() => handleDeleteBuilding(String(b._id))}
                        title="Устгах"
                        className="rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[color:var(--surface-border)] px-4 py-8 text-center">
              <Building2 className="h-6 w-6 text-[color:var(--muted-text)]" />
              <p className="text-[13px] text-[color:var(--panel-text)]">Барилга бүртгээгүй байна</p>
              <p className="max-w-xs text-[12px] text-[color:var(--muted-text)]">
                Эхний барилгаа нэмээд орц, давхрын тоог оруулбал тоот бүртгэл, гэрээ ашиглах боломжтой болно.
              </p>
            </div>
          )}
        </SettingsCard>

        {/* Info grid */}

        {/* removed bottom save duplicate - primary save now under Дүүрэг/Хороо */}
        <MModal
          title="Баталгаажуулалт"
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          classNames={{
            content: "modal-surface modal-responsive",
            header:
              "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
            title: "text-theme ",
            close:
              "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
          }}
          overlayProps={{ opacity: 0.5, blur: 6 }}
          centered
          size="sm"
        >
          <div className="space-y-4 mt-4">
            <p className="text-theme">
              Та "{buildingToDelete?.ner}" барилгыг устгахдаа итгэлтэй байна уу?
              Энэ үйлдэл буцаагдахгүй.
            </p>
            <div className="flex justify-end gap-2">
              <MButton
                onClick={() => setDeleteModalOpen(false)}
                className="btn-minimal"
              >
                Хаах
              </MButton>
              <MButton
                color="red"
                onClick={confirmDeleteBuilding}
                className="btn-minimal btn-cancel"
              >
                Устгах
              </MButton>
            </div>
          </div>
        </MModal>
        {/* Entrances and Floors moved inside the modal (full-screen) */}
      </div>

      {/* Transfer Modal - only for specific baiguullagiinId */}
      {isTransferEnabled && transferModalOpen && (
        <MModal
          opened={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            setBuildingToTransfer(null);
            setTargetOrgId("");
          }}
          title="Барилга шилжүүлэх"
          centered
          size="lg"
        >
          <div className="space-y-4 mt-4">
            {buildingToTransfer && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
                  <label className="block text-sm  text-[color:var(--panel-text)] mb-2">
                    Шилжүүлэх барилга
                  </label>
                  <div className="text-base  text-[color:var(--panel-text)]">
                    {buildingToTransfer.ner || "-"}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
                  <label className="block text-sm  text-[color:var(--panel-text)] mb-2">
                    Шинэ байгууллага сонгох{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <select
                    value={targetOrgId}
                    onChange={(e) => setTargetOrgId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-theme"
                    style={{ borderRadius: "0.5rem" }}
                  >
                    <option value="">Байгууллага сонгох...</option>
                    {availableOrgs.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.ner}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[color:var(--surface-border)]">
              <MButton
                onClick={() => {
                  setTransferModalOpen(false);
                  setBuildingToTransfer(null);
                  setTargetOrgId("");
                }}
                className="btn-minimal"
                disabled={isTransferring}
              >
                Хаах
              </MButton>
              <MButton
                onClick={handleTransferBuilding}
                className="btn-primary"
                disabled={!targetOrgId || isTransferring}
              >
                {isTransferring ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Шилжүүлж байна...
                  </span>
                ) : (
                  "Шилжүүлэх"
                )}
              </MButton>
            </div>
          </div>
        </MModal>
      )}
    </div>
  );
}
