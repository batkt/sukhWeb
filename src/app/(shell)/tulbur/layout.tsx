"use client";

import PermissionGuard from "@/components/PermissionGuard";
import BpayGorimBanner from "@/components/BpayGorimBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      paths={["tulbur", "/tulbur", "tulbur.nekhemjlekh", "tulbur.dansKhuulga", "tulbur.ebarimt", "tulbur.guilgeeTuukh", "tulbur.bpay"]}
    >
      <BpayGorimBanner />
      {children}
    </PermissionGuard>
  );
}
