"use client";

import GolContent from "../../../components/golContent";
import PermissionGuard from "@/components/PermissionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      paths={["tailan", "/tailan", "tailan.orlogoAvlaga", "tailan.sariinTulbur", "tailan.avlagiinNasjilt"]}
    >
      <GolContent>{children}</GolContent>
    </PermissionGuard>
  );
}
