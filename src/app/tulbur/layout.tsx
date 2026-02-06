"use client";

import GolContent from "../../../components/golContent";
import PermissionGuard from "@/components/PermissionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      paths={["tulbur", "/tulbur", "tulbur.nekhemjlekh", "tulbur.dansKhuulga", "tulbur.ebarimt", "tulbur.guilgeeTuukh"]}
    >
      <GolContent>{children}</GolContent>
    </PermissionGuard>
  );
}
