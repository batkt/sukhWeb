"use client";

import PermissionGuard from "@/components/PermissionGuard";

export default function SankhuuLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard paths={["sankhuu", "/sankhuu", "sankhuu.shilenDans"]}>
      {children}
    </PermissionGuard>
  );
}
