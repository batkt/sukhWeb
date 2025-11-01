"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { setRequestScope } from "../../lib/uilchilgee";

export default function RequestScopeSync() {
  const { ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();

  useEffect(() => {
    const effectiveBarilga = selectedBuildingId || barilgiinId || null;
    const orgId = ajiltan?.baiguullagiinId || null;
    setRequestScope({ baiguullagiinId: orgId, barilgiinId: effectiveBarilga });
  }, [ajiltan?.baiguullagiinId, barilgiinId, selectedBuildingId]);

  return null;
}
