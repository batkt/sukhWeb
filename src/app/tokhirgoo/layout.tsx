"use client";

import GolContent from "../../../components/golContent";
import PermissionGuard from "@/components/PermissionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      paths={["tokhirgoo", "/tokhirgoo", "tokhirgoo.barilga", "tokhirgoo.nemelt", "tokhirgoo.tuslamj"]}
    >
      <GolContent>{children}</GolContent>
    </PermissionGuard>
  );
}
