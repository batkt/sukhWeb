"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { setRequestScope } from "../../lib/uilchilgee";

export default function RequestScopeSync() {
  const { ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();

  useEffect(() => {
    // If user hasn't explicitly selected a building yet, prefer to auto-select
    // a sensible default: 1) previously chosen cookie `barilgiinId`, 2)
    // ajiltan.barilguud[0], 3) baiguullaga.barilguud[0]. This makes the UI
    // friendlier immediately after login.
    try {
      if (!selectedBuildingId && !localStorage.getItem("selectedBuildingId")) {
        const candidate =
          barilgiinId ||
          (ajiltan?.barilguud && ajiltan.barilguud.length > 0
            ? ajiltan.barilguud[0]
            : null) ||
          (baiguullaga?.barilguud && baiguullaga.barilguud.length > 0
            ? baiguullaga.barilguud[0]._id || baiguullaga.barilguud[0]
            : null);
        if (candidate) {
          setSelectedBuildingId(String(candidate));
        }
      }
    } catch (e) {}

    const effectiveBarilga = selectedBuildingId || barilgiinId || null;
    const orgId = ajiltan?.baiguullagiinId || null;
    setRequestScope({ baiguullagiinId: orgId, barilgiinId: effectiveBarilga });
  }, [
    ajiltan?.baiguullagiinId,
    barilgiinId,
    selectedBuildingId,
    setSelectedBuildingId,
    baiguullaga,
  ]);

  return null;
}
