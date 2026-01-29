"use client";

import GolContent from "../../../components/golContent";
import { GereeProvider } from "./GereeContext";
import GereeModals from "./GereeModals";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GolContent>
      <GereeProvider>
        {children}
        <GereeModals />
      </GereeProvider>
    </GolContent>
  );
}
