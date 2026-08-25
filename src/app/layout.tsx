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
        {/* Theme color (PWA manifest removed) */}
        <meta name="theme-color" content="#0ea5e9" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var d=document.documentElement;var savedMode=localStorage.getItem('theme-mode');var mode=savedMode||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');d.setAttribute('data-mode',mode);if(mode==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}
var savedTheme=localStorage.getItem('app-theme')||'soft-sage';d.setAttribute('data-theme',savedTheme);if(!localStorage.getItem('app-theme')){localStorage.setItem('app-theme',savedTheme);}
d.setAttribute('data-sidebar',localStorage.getItem('sidebar-collapsed')==='1'?'rail':'full');
var fs=localStorage.getItem('fontSizeIndex');if(fs!==null){var sizes=['10px','11px','12px','13px','14px','15px','16px','17px','18px','19px','20px','21px','22px','24px','26px'];var px=sizes[parseInt(fs,10)];if(px){d.style.fontSize=px;}} }catch(e){}})();`}
        </Script>
      </head>
      <body
        className="min-h-screen bg-card text-foreground"
        style={{ fontFamily: '"Segoe UI", sans-serif' }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>

        <div id="portal-root" />
      </body>
    </html>
  );
}
