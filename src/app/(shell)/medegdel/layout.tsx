"use client";

import PermissionGuard from "@/components/PermissionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard paths={["medegdel", "/medegdel", "medegdel.medegdel", "medegdel.sanalKhuselt"]}>
      {children}
    </PermissionGuard>
  );
}
