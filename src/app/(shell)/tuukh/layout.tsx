"use client";

import PermissionGuard from "@/components/PermissionGuard";

export default function TuukhLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      paths={[
        "tuukh",
        "/tuukh",
        "tuukh.zassan",
        "tuukh.ustgasan",
      ]}
    >
      {children}
    </PermissionGuard>
  );
}
