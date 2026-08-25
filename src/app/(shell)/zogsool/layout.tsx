"use client";

import PermissionGuard from "@/components/PermissionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      paths={["zogsool", "/zogsool", "zogsool.jagsaalt", "zogsool.camera", "zogsool.orshinSuugch", "zogsool.urisan"]}
    >
      {children}
    </PermissionGuard>
  );
}
