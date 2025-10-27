"use client";

import Image from "next/image";
import React from "react";

type ThemedLogoProps = {
  size?: number; // px
  className?: string;
  alt?: string;
  // Paths to light/dark assets under public/
  lightSrc?: string; // defaults to "/logo.svg"
  darkSrc?: string; // optional; if omitted, only lightSrc is rendered
  withBg?: boolean; // show theme-aware background using --logo-bg
  radius?: number; // px
  padding?: number; // px
  style?: React.CSSProperties;
};

/**
 * Theme-aware logo with optional background. If darkSrc is provided, it swaps
 * between .logo-light and .logo-dark based on [data-theme="dark-black"].
 */
export default function ThemedLogo({
  size = 48,
  className,
  alt = "Logo",
  lightSrc = "/amarLogo.svg",
  darkSrc,
  withBg = true,
  radius = 12,
  padding = 6,
  style,
}: ThemedLogoProps) {
  const dim = size;
  const wrapperStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: withBg ? radius : undefined,
    padding: withBg ? padding : 0,
    background: withBg ? "var(--logo-bg, transparent)" : undefined,
    ...style,
  };

  return (
    <span className={className} style={wrapperStyle}>
      {darkSrc ? (
        <>
          <span className="logo-variant logo-light">
            <Image src={lightSrc} alt={alt} width={dim} height={dim} priority />
          </span>
          <span className="logo-variant logo-dark">
            <Image src={darkSrc} alt={alt} width={dim} height={dim} priority />
          </span>
        </>
      ) : (
        <Image src={lightSrc} alt={alt} width={dim} height={dim} priority />
      )}

      <style jsx global>{`
        /* Variant swap rules (safe even if darkSrc is not provided) */
        .logo-variant.logo-dark {
          display: none;
        }
        [data-theme="dark-black"] .logo-variant.logo-light {
          display: none;
        }
        [data-theme="dark-black"] .logo-variant.logo-dark {
          display: inline-flex;
        }

        /* Defaults for themed background if not defined elsewhere */
        :root {
          --logo-bg: transparent;
        }
        [data-theme="dark-black"] {
          --logo-bg: #0b1220;
        }
      `}</style>
    </span>
  );
}
