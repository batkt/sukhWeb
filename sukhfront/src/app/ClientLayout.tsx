"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { SpinnerProvider, useSpinner } from "../../src/context/SpinnerContext";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SpinnerProvider>
      <LayoutContent>{children}</LayoutContent>
    </SpinnerProvider>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const { loading } = useSpinner();

  return (
    <>
      {children}

      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[2000]">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
