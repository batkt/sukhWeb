import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";
import { AuthProvider } from "@/lib/useAuth";

export const metadata: Metadata = {
  title: "Амар Сөх",
  description: "Амар Сөх управления системийн",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body className="h-screen overflow-hidden bg-card text-foreground font-sans">
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
