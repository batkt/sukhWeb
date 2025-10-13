"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { parseCookies } from "nookies";
import { Toaster } from "react-hot-toast";
import { SpinnerProvider, useSpinner } from "../../src/context/SpinnerContext";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SpinnerProvider>
      <LayoutContent>{children}</LayoutContent>
    </SpinnerProvider>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: spinnerLoading } = useSpinner();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const cookies = parseCookies();
    const token = cookies.tureestoken;

    if (pathname === "/login") {
      if (token) router.replace("/khynalt");
      setAuthChecked(true);
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = parseJwt(token);
    if (!payload || !payload.id) {
      router.replace("/login");
      return;
    }

    setAuthChecked(true);
  }, [pathname, router]);

  if (!authChecked || spinnerLoading) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[2000]">
        <div className="w-24 h-24 border-8 border-gray-200 border-t-green-500 rounded-full animate-spin shadow-lg"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
