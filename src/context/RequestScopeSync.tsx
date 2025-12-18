"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { setRequestScope } from "@/lib/uilchilgee";

export default function RequestScopeSync() {
  const { ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    // Only auto-select on initial load, not on every change
    // This prevents resetting the building when user has explicitly selected one
    try {
      const stored = localStorage.getItem("selectedBuildingId");
      // Only auto-select if:
      // 1. We haven't auto-selected before
      // 2. There's no selectedBuildingId in state
      // 3. There's no stored value in localStorage
      if (!hasAutoSelectedRef.current && !selectedBuildingId && !stored) {
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
          hasAutoSelectedRef.current = true;
        }
      } else if (stored || selectedBuildingId) {
        // Mark as auto-selected if there's already a selection to prevent future auto-selection
        hasAutoSelectedRef.current = true;
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
