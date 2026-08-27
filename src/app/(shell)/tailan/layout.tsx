"use client";

import PermissionGuard from "@/components/PermissionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      paths={["tailan", "/tailan", "tailan.bi", "tailan.orlogoAvlaga", "tailan.sariinTulbur", "tailan.avlagiinNasjilt"]}
    >
      {children}
    </PermissionGuard>
  );
}
