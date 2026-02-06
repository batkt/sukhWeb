"use client";

import GolContent from "../../../components/golContent";
import PermissionGuard from "@/components/PermissionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard paths={["medegdel", "/medegdel", "medegdel.medegdel", "medegdel.sanalKhuselt"]}>
      <GolContent>{children}</GolContent>
    </PermissionGuard>
  );
}
