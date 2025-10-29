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
  withBg?: boolean; // show theme-aware background using theme tokens
  /**
   * Background tint strength for light themes.
   * - "weak": least gray (subtle)
   * - "default": balanced (recommended)
   * - "strong": more gray for high contrast
   */
  bgStrength?: "weak" | "default" | "strong";
  /**
   * Background mode:
   * - "theme" (default): follow theme surface exactly (var(--surface-bg))
   * - "tint": use light-theme tints (weak/default/strong) for extra contrast
   */
  bgMode?: "theme" | "tint";
  radius?: number; // px
  padding?: number; // px
  style?: React.CSSProperties;
};

/**
 * Theme-aware logo with optional background that follows app theme tokens.
 * If darkSrc is provided, it swaps between .logo-light and .logo-dark based on
 * [data-theme="dark-black"].
 */
export default function ThemedLogo({
  size = 48,
  className,
  alt = "Logo",
  lightSrc = "/logoSukh.png",
  darkSrc,
  withBg = true,
  bgStrength = "strong",
  bgMode = "tint",
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

    background: withBg
      ? bgMode === "theme"
        ? "var(--surface-bg)"
        : bgStrength === "strong"
        ? "var(--logo-bg-strong)"
        : bgStrength === "weak"
        ? "var(--logo-bg-weak)"
        : "var(--logo-bg)"
      : undefined,
    border: withBg ? "1px solid var(--surface-border)" : undefined,
    // Subtle elevation so it reads on light backgrounds
    boxShadow: withBg ? "0 8px 20px var(--glass-shadow)" : undefined,
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
        /* Switch to dark variant on all dark themes */
        [data-theme="dark-black"] .logo-variant.logo-light,
        [data-theme="dark-gray"] .logo-variant.logo-light,
        [data-theme="dark-green"] .logo-variant.logo-light,
        .dark .logo-variant.logo-light {
          display: none;
        }
        [data-theme="dark-black"] .logo-variant.logo-dark,
        [data-theme="dark-gray"] .logo-variant.logo-dark,
        [data-theme="dark-green"] .logo-variant.logo-dark,
        .dark .logo-variant.logo-dark {
          display: inline-flex;
        }
      `}</style>
    </span>
  );
}
