import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "SukhFront",
  description: "Next.js + Tailwind + Typescript project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body className="min-h-screen bg-card text-foreground font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
