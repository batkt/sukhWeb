import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";
import { AuthProvider } from "@/lib/useAuth";
import Script from "next/script";
import LocatorWarningSuppress from "./locator-setup";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

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
var savedTheme=localStorage.getItem('app-theme')||'soft-sage';d.setAttribute('data-theme',savedTheme);if(!localStorage.getItem('app-theme')){localStorage.setItem('app-theme',savedTheme);} }catch(e){}})();`}
        </Script>
        <Script id="locator-suppress" strategy="beforeInteractive">
          {`(function(){if(typeof window!=='undefined'){var oe=console.error;var ow=console.warn;console.error=function(){var a=arguments;var m=a[0];if(typeof m==='string'&&m.includes('data-locatorjs'))return;if(typeof m==='string'&&(m.includes('Hydration')||m.includes('hydration')||m.includes('did not match'))){for(var i=0;i<a.length;i++){if(typeof a[i]==='string'&&a[i].includes('data-locatorjs'))return}}oe.apply(console,a)};console.warn=function(){var a=arguments;var m=a[0];if(typeof m==='string'&&m.includes('data-locatorjs'))return;if(typeof m==='string'&&(m.includes('Hydration')||m.includes('hydration')||m.includes('did not match'))){for(var i=0;i<a.length;i++){if(typeof a[i]==='string'&&a[i].includes('data-locatorjs'))return}}ow.apply(console,a)}}})();`}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${inter.className} min-h-screen bg-card text-foreground font-sans`}
        suppressHydrationWarning
      >
        {process.env.NODE_ENV === "development" && <LocatorWarningSuppress />}
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>

        <div id="portal-root" />
      </body>
    </html>
  );
}
