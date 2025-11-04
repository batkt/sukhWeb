import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";
import { AuthProvider } from "@/lib/useAuth";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Амар Сөх",
  description: "Амар Сөх",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/* PWA manifest and theme color */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var d=document.documentElement;var savedMode=localStorage.getItem('theme-mode');var mode=savedMode||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');d.setAttribute('data-mode',mode);if(mode==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}
var savedTheme=localStorage.getItem('app-theme')||'colorful';d.setAttribute('data-theme',savedTheme);}catch(e){}})();`}
        </Script>
      </head>
      <body className="min-h-screen bg-card text-foreground font-sans">
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
        {/* Stable portal container to avoid hydration mismatches for overlays and modals */}
        <div id="portal-root" />
      </body>
    </html>
  );
}
