"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResidentsSection from "../ResidentsSection";
import type { NegjNemekhTokhirgoo, NegjiinSongolt, NegjNemekhTurul } from "../ResidentsTable";
import { negjiinTurul } from "@/lib/negjiinTurul";
import ResidentDetailModal from "../modals/ResidentDetailModal";
import NuutsUgSergeekhModal from "../modals/NuutsUgSergeekhModal";
import { useGereeContext } from "../GereeContext";
import { useAuth } from "@/lib/useAuth";
import { hasPermission } from "@/lib/permissionUtils";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";

export default function OrshinSuugchPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();
  const { token } = useAuth();

  // "Үйлдэл" багана дахь нүдний товч — оршин суугчийн бүх мэдээллийг нэг
  // модалаас харуулна (гэрээ, тоот, гэр бүл, зогсоол, гүйлгээ, эрсдэл).
  const [kharakhId, setKharakhId] = useState<string | null>(null);
  const [resetPasswordResident, setResetPasswordResident] = useState<any>(null);

  // «Гараж», «Агуулах» нүдэнд дарж нэмэх: барилгын тохиргоон дахь дугааруудаас
  // хэн нэгэнд (оршин суугч, харилцагч) аль хэдийн холбогдсоныг хасна.
  const negjiinSongoltuud = useMemo(() => {
    const barilgiinId = String((data.selectedBarilga as any)?._id || "");
    const ezemshsen = new Set<string>();
    const davkhargui = new Set<string>();
    [...(data.residentsList || []), ...(data.clientsList || [])].forEach((r: any) => {
      (Array.isArray(r?.toots) ? r.toots : []).forEach((t: any) => {
        if (!t?.toot) return;
        if (ajiltan?.baiguullagiinId && t.baiguullagiinId && String(t.baiguullagiinId) !== String(ajiltan.baiguullagiinId)) return;
        if (barilgiinId && t.barilgiinId && String(t.barilgiinId) !== barilgiinId) return;
        const turul = negjiinTurul(t);
        if (turul === "Орон сууц") return;
        const toot = String(t.toot).trim();
        const davkhar = String(t.davkhar || "").trim();
        if (davkhar) ezemshsen.add(`${turul}|${davkhar}|${toot}`);
        else davkhargui.add(`${turul}|${toot}`);
      });
    });
    const jagsaalt = (turul: NegjNemekhTurul, map: Record<string, string[]> | undefined) => {
      const seen = new Set<string>();
      const out: NegjiinSongolt[] = [];
      Object.entries(map || {}).forEach(([key, toonuud]) => {
        // "орц::давхар" түлхүүрийг parseMap давхраар нь давхардуулдаг — давхарыг л авна
        if (key.includes("::")) return;
        (toonuud || []).forEach((x) => {
          const toot = String(x).trim();
          const k = `${key}|${toot}`;
          if (!toot || seen.has(k)) return;
          seen.add(k);
          if (ezemshsen.has(`${turul}|${k}`) || davkhargui.has(`${turul}|${toot}`)) return;
          out.push({ davkhar: key, toot });
        });
      });
      const eremb = (a: string, b: string) => a.localeCompare(b, "mn", { numeric: true, sensitivity: "base" });
      return out.sort((a, b) => eremb(a.davkhar, b.davkhar) || eremb(a.toot, b.toot));
    };
    return {
      Гараж: jagsaalt("Гараж", data.garaazhMap),
      Агуулах: jagsaalt("Агуулах", data.aguulakhMap),
    };
  }, [data.selectedBarilga, data.residentsList, data.clientsList, data.garaazhMap, data.aguulakhMap, ajiltan?.baiguullagiinId]);

  const onNegjNemekh = useCallback<NegjNemekhTokhirgoo["onNemekh"]>(
    async (resident, turul, davkhar, toot) => {
      if (!resident?._id) return false;
      const ok = await actions.handleAssignToUnit(
        String(resident._id),
        "orshinSuugch",
        "",
        davkhar,
        toot,
        turul === "Агуулах" ? "Агуулах" : "Зогсоол",
      );
      return !!ok;
    },
    [actions],
  );

  const negjNemekh = useMemo<NegjNemekhTokhirgoo>(
    () => ({ songoltuud: negjiinSongoltuud, onNemekh: onNegjNemekh }),
    [negjiinSongoltuud, onNegjNemekh],
  );

  const tourSteps = useTourSteps("residents");
  useRegisterTourSteps("/geree/orshinSuugch", tourSteps);

  useEffect(() => {
    if (ajiltan) {
      const hasGereeBase =
        hasPermission(ajiltan, "/geree") || hasPermission(ajiltan, "geree");
      const allowed =
        hasGereeBase ||
        hasPermission(ajiltan, "/geree/orshinSuugch") ||
        hasPermission(ajiltan, "geree.orshinSuugch");
      if (!allowed) {
        router.push("/geree");
      }
    }
  }, [ajiltan, router]);

  return (
    <>
    <ResidentsSection
      isValidatingSuugch={data.isValidatingSuugch}
      currentResidents={data.currentResidents}
      resPage={state.resPage}
      resPageSize={state.resPageSize}
      resTotalPages={data.resTotalPages}
      totalResidents={data.totalResidents}
      sortKey={state.sortKey}
      sortOrder={state.sortOrder}
      toggleSortFor={actions.toggleSortFor}
      onEditResident={(resident) => {
        actions.handleEditResident(
          resident,
          state.setEditingResident,
          state.setNewResident,
          state.setShowResidentModal,
        );
      }}
      onRequestDeleteResident={(r) => {
        state.setResidentToDelete(r);
        state.setShowDeleteResidentModal(true);
      }}
      onRemoveToot={actions.handleRemoveResidentToot}
      currentBaiguullagiinId={ajiltan?.baiguullagiinId}
      setResPageSize={state.setResPageSize}
      setResPage={state.setResPage}
      onViewResident={(resident) => setKharakhId(resident?._id || null)}
      onResetPasswordResident={(resident) => setResetPasswordResident(resident)}
      negjNemekh={negjNemekh}
    />
    <ResidentDetailModal
      show={!!kharakhId}
      onClose={() => setKharakhId(null)}
      residentId={kharakhId}
      token={token}
      baiguullagiinId={ajiltan?.baiguullagiinId}
      onEdit={(resident) => {
        setKharakhId(null);
        actions.handleEditResident(
          resident,
          state.setEditingResident,
          state.setNewResident,
          state.setShowResidentModal,
        );
      }}
    />
    <NuutsUgSergeekhModal
      show={!!resetPasswordResident}
      onClose={() => setResetPasswordResident(null)}
      userId={resetPasswordResident?._id}
      ner={typeof resetPasswordResident?.ner === "object" ? resetPasswordResident?.ner?.ner : resetPasswordResident?.ner}
      utas={Array.isArray(resetPasswordResident?.utas) ? resetPasswordResident?.utas[0] : (resetPasswordResident?.utas || "")}
      isKhariltsagch={false}
    />
    </>
  );
}
