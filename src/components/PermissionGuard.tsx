"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { hasPermission } from "@/lib/permissionUtils";

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Permission paths to check (user needs at least one) */
  paths: string[];
  /** Where to redirect if no permission */
  redirectTo?: string;
}

export default function PermissionGuard({
  children,
  paths,
  redirectTo = "/khynalt",
}: PermissionGuardProps) {
  const router = useRouter();
  const { ajiltan } = useAuth();

  const allowed =
    !ajiltan ||
    ajiltan.erkh?.toLowerCase() === "admin" ||
    paths.some((p) => hasPermission(ajiltan, p) || hasPermission(ajiltan, p.startsWith("/") ? p.slice(1) : `/${p}`));

  useEffect(() => {
    if (ajiltan && !allowed) {
      router.replace(redirectTo);
    }
  }, [ajiltan, allowed, redirectTo, router]);

  if (ajiltan && !allowed) {
    return null;
  }

  return <>{children}</>;
}
